import { neon } from '@neondatabase/serverless'
import { ConstraintCategory, ConstraintResult } from './constraint-detection-engine'

const sql = neon(process.env.DATABASE_URL || '')

export interface ConstraintHistoryRecord {
  id: string
  athleteId: string
  skillType: string
  constraintCategory: ConstraintCategory
  severityScore: number
  timestamp: Date
  context?: string
}

export interface ConstraintImprovement {
  constraintCategory: ConstraintCategory
  initialScore: number
  latestScore: number
  improvement: number
  weeksTracked: number
  trend: 'improving' | 'stable' | 'worsening'
}

/**
 * Record a constraint detection result in history
 */
export async function recordConstraintHistory(
  athleteId: string,
  skillType: string,
  constraint: ConstraintResult
): Promise<void> {
  try {
    await sql`
      INSERT INTO constraint_history (
        athlete_id,
        skill_type,
        constraint_category,
        severity_score,
        timestamp,
        context
      ) VALUES (
        ${athleteId},
        ${skillType},
        ${constraint.category},
        ${constraint.score},
        NOW(),
        ${JSON.stringify({
          primaryLimiter: constraint.isPrimaryLimiter,
          indicatorMetrics: constraint.indicatorMetrics,
        })}
      )
    `
  } catch (error) {
    console.error('Error recording constraint history:', error)
    // Don't throw - constraint history is non-critical
  }
}

/**
 * Get constraint history for an athlete and skill
 */
export async function getConstraintHistory(
  athleteId: string,
  skillType: string,
  days: number = 90
): Promise<ConstraintHistoryRecord[]> {
  try {
    const results = await sql`
      SELECT
        id,
        athlete_id as "athleteId",
        skill_type as "skillType",
        constraint_category as "constraintCategory",
        severity_score as "severityScore",
        timestamp,
        context
      FROM constraint_history
      WHERE
        athlete_id = ${athleteId}
        AND skill_type = ${skillType}
        AND timestamp > NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `
    return results as ConstraintHistoryRecord[]
  } catch (error) {
    console.error('Error fetching constraint history:', error)
    return []
  }
}

/**
 * Calculate constraint improvement metrics
 */
export async function calculateConstraintImprovement(
  athleteId: string,
  skillType: string,
  weeks: number = 6
): Promise<ConstraintImprovement[]> {
  try {
    const results = await sql`
      SELECT
        constraint_category as "constraintCategory",
        ROUND(AVG(CASE WHEN timestamp <= NOW() - INTERVAL '${weeks} weeks' THEN severity_score END)::numeric, 1) as "initialScore",
        ROUND(AVG(CASE WHEN timestamp > NOW() - INTERVAL '${weeks} weeks' THEN severity_score END)::numeric, 1) as "latestScore",
        COUNT(DISTINCT DATE(timestamp)) as "dataPoints"
      FROM constraint_history
      WHERE
        athlete_id = ${athleteId}
        AND skill_type = ${skillType}
        AND timestamp > NOW() - INTERVAL '${weeks * 2} weeks'
      GROUP BY constraint_category
      HAVING COUNT(*) >= 2
      ORDER BY ABS(ROUND(AVG(CASE WHEN timestamp <= NOW() - INTERVAL '${weeks} weeks' THEN severity_score END)::numeric, 1) - ROUND(AVG(CASE WHEN timestamp > NOW() - INTERVAL '${weeks} weeks' THEN severity_score END)::numeric, 1)) DESC
    `

    return results.map((row: any) => {
      const initial = parseFloat(row.initialScore) || 0
      const latest = parseFloat(row.latestScore) || 0
      const improvement = initial - latest

      return {
        constraintCategory: row.constraintCategory,
        initialScore: initial,
        latestScore: latest,
        improvement,
        weeksTracked: weeks,
        trend: improvement > 5 ? 'improving' : improvement < -5 ? 'worsening' : 'stable',
      }
    })
  } catch (error) {
    console.error('Error calculating constraint improvement:', error)
    return []
  }
}

/**
 * Get the most recent constraint detection for an athlete and skill
 */
export async function getLatestConstraint(
  athleteId: string,
  skillType: string
): Promise<ConstraintHistoryRecord | null> {
  try {
    const results = await sql`
      SELECT
        id,
        athlete_id as "athleteId",
        skill_type as "skillType",
        constraint_category as "constraintCategory",
        severity_score as "severityScore",
        timestamp,
        context
      FROM constraint_history
      WHERE
        athlete_id = ${athleteId}
        AND skill_type = ${skillType}
      ORDER BY timestamp DESC
      LIMIT 1
    `
    return (results[0] as ConstraintHistoryRecord) || null
  } catch (error) {
    console.error('Error fetching latest constraint:', error)
    return null
  }
}

/**
 * Check if constraint has significantly changed since last detection
 */
export async function hasConstraintChanged(
  athleteId: string,
  skillType: string,
  currentConstraint: ConstraintResult,
  threshold: number = 15
): Promise<boolean> {
  const latest = await getLatestConstraint(athleteId, skillType)

  if (!latest) return false

  if (latest.constraintCategory !== currentConstraint.category) {
    return true // Different constraint type
  }

  const scoreDifference = Math.abs(latest.severityScore - currentConstraint.score)
  return scoreDifference > threshold
}
