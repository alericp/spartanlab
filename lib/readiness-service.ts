import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import type { SkillReadiness, ReadinessSnapshot } from '@/types/skill-readiness'

// =============================================================================
// LAZY DATABASE CONNECTION
// Do NOT initialize at module scope - this allows the module to be imported
// even when DATABASE_URL is absent (e.g., during first-run onboarding)
// =============================================================================

let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> | null {
  if (_sql) return _sql
  
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.log('[Readiness] DATABASE_URL not available - DB features disabled')
    return null
  }
  
  _sql = neon(connectionString)
  return _sql
}

export interface SkillReadinessData {
  id: string
  athleteId: string
  skill: 'front_lever' | 'planche' | 'hspu' | 'muscle_up' | 'l_sit'
  readinessScore: number
  pullStrengthScore: number
  compressionScore: number
  scapularControlScore: number
  straightArmScore: number
  mobilityScore: number
  limitingFactor: string
  lastUpdated: string
}

/**
 * Fetch current skill readiness for an athlete
 */
export async function getAthleteSkillReadiness(
  athleteId: string
): Promise<SkillReadinessData[]> {
  const sql = getSql()
  if (!sql) {
    return [] // Return empty when DB unavailable
  }
  
  try {
    const results = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        skill,
        readiness_score as "readinessScore",
        pull_strength_score as "pullStrengthScore",
        compression_score as "compressionScore",
        scapular_control_score as "scapularControlScore",
        straight_arm_score as "straightArmScore",
        mobility_score as "mobilityScore",
        limiting_factor as "limitingFactor",
        last_updated as "lastUpdated"
      FROM skill_readiness
      WHERE athlete_id = ${athleteId}
      ORDER BY skill
    `
    return results as SkillReadinessData[]
  } catch (error) {
    console.error('[Readiness] Error fetching skill readiness:', error)
    return []
  }
}

/**
 * Fetch readiness for a specific skill
 */
export async function getSkillReadiness(
  athleteId: string,
  skill: string
): Promise<SkillReadinessData | null> {
  const sql = getSql()
  if (!sql) {
    return null // Return null when DB unavailable
  }
  
  try {
    const results = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        skill,
        readiness_score as "readinessScore",
        pull_strength_score as "pullStrengthScore",
        compression_score as "compressionScore",
        scapular_control_score as "scapularControlScore",
        straight_arm_score as "straightArmScore",
        mobility_score as "mobilityScore",
        limiting_factor as "limitingFactor",
        last_updated as "lastUpdated"
      FROM skill_readiness
      WHERE athlete_id = ${athleteId} AND skill = ${skill}
      LIMIT 1
    `
    return results?.[0] as SkillReadinessData | null
  } catch (error) {
    console.error('[Readiness] Error fetching skill readiness for', skill, error)
    return null
  }
}

/**
 * Save or update skill readiness
 */
export async function saveSkillReadiness(
  athleteId: string,
  skill: string,
  data: {
    readinessScore: number
    pullStrengthScore: number
    compressionScore: number
    scapularControlScore: number
    straightArmScore: number
    mobilityScore: number
    limitingFactor: string
  }
): Promise<void> {
  const sql = getSql()
  if (!sql) {
    // No-op when DB unavailable
    return
  }
  
  try {
    const now = new Date().toISOString()
    
    // Upsert: insert or update if exists
    await sql`
      INSERT INTO skill_readiness (
        athlete_id,
        skill,
        readiness_score,
        pull_strength_score,
        compression_score,
        scapular_control_score,
        straight_arm_score,
        mobility_score,
        limiting_factor,
        last_updated
      ) VALUES (
        ${athleteId},
        ${skill},
        ${data.readinessScore},
        ${data.pullStrengthScore},
        ${data.compressionScore},
        ${data.scapularControlScore},
        ${data.straightArmScore},
        ${data.mobilityScore},
        ${data.limitingFactor},
        ${now}
      )
      ON CONFLICT (athlete_id, skill)
      DO UPDATE SET
        readiness_score = EXCLUDED.readiness_score,
        pull_strength_score = EXCLUDED.pull_strength_score,
        compression_score = EXCLUDED.compression_score,
        scapular_control_score = EXCLUDED.scapular_control_score,
        straight_arm_score = EXCLUDED.straight_arm_score,
        mobility_score = EXCLUDED.mobility_score,
        limiting_factor = EXCLUDED.limiting_factor,
        last_updated = EXCLUDED.last_updated
    `
    
    // Save snapshot for history tracking
    await sql`
      INSERT INTO readiness_snapshots (
        athlete_id,
        skill,
        readiness_score,
        snapshot_date
      ) VALUES (
        ${athleteId},
        ${skill},
        ${data.readinessScore},
        ${now}
      )
    `
  } catch (error) {
    console.error('[Readiness] Error saving skill readiness:', error)
  }
}

/**
 * Get readiness history for a skill
 */
export async function getReadinessHistory(
  athleteId: string,
  skill: string,
  days: number = 30
): Promise<ReadinessSnapshot[]> {
  const sql = getSql()
  if (!sql) {
    return [] // Return empty when DB unavailable
  }
  
  try {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)
    
    const results = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        skill,
        readiness_score as "readinessScore",
        snapshot_date as "snapshotDate"
      FROM readiness_snapshots
      WHERE athlete_id = ${athleteId}
        AND skill = ${skill}
        AND snapshot_date >= ${dateThreshold.toISOString()}
      ORDER BY snapshot_date DESC
      LIMIT 100
    `
    return results as ReadinessSnapshot[]
  } catch (error) {
    console.error('[Readiness] Error fetching readiness history:', error)
    return []
  }
}
