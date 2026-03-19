// Skill State Service
// Manages persistent skill-specific state tracking for athletes
// Source of truth for skill-specific coaching decisions
// Now integrated with Skill Progression Graph Engine for explicit node-based tracking

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import {
  determineGraphPosition,
  getSkillGraph,
  getGraphNode,
  type SkillGraphId,
  type AthleteGraphPosition,
  type ProgressionNode,
} from './skill-progression-graph-engine'

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
    console.log('[SkillState] DATABASE_URL not available - DB features disabled')
    return null
  }
  
  _sql = neon(connectionString)
  return _sql
}

// =============================================================================
// TYPES
// =============================================================================

export type SkillKey = 'front_lever' | 'back_lever' | 'planche' | 'hspu' | 'muscle_up' | 'l_sit'

export type MetricType = 'hold_seconds' | 'reps' | 'assisted_reps' | 'transition_completion'

export type CoachingContext = 
  | 'returning_from_break'
  | 'building_foundation'
  | 'approaching_milestone'
  | 'maintaining'
  | 'regressing'
  | 'new_skill'

export interface SkillState {
  id: string
  userId: string
  skill: SkillKey
  // Current ability
  currentLevel: number
  currentBestMetric: number
  metricType: MetricType
  // Historical peak
  highestLevel: number
  highestBestMetric: number
  highestLevelAchievedAt: string | null
  // Readiness and limitations
  readinessScore: number
  limitingFactor: string | null
  limitingFactorScore: number
  // Next milestone tracking
  nextMilestone: string | null
  nextMilestoneReadiness: number
  // Training recency
  lastSeriousTrainingAt: string | null
  totalTrainingSessions: number
  // Notes and coaching context
  notes: string | null
  coachingContext: CoachingContext | null
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface SkillStateInput {
  currentLevel: number
  currentBestMetric?: number
  metricType?: MetricType
  highestLevel?: number
  highestBestMetric?: number
  readinessScore?: number
  limitingFactor?: string | null
  limitingFactorScore?: number
  nextMilestone?: string | null
  nextMilestoneReadiness?: number
  notes?: string | null
  coachingContext?: CoachingContext | null
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Get all skill states for an athlete
 */
export async function getAthleteSkillStates(userId: string): Promise<SkillState[]> {
  const sql = getSql()
  if (!sql) {
    return [] // Return empty when DB unavailable
  }
  
  try {
    const results = await sql`
      SELECT 
        id,
        user_id as "userId",
        skill,
        current_level as "currentLevel",
        current_best_metric as "currentBestMetric",
        metric_type as "metricType",
        highest_level as "highestLevel",
        highest_best_metric as "highestBestMetric",
        highest_level_achieved_at as "highestLevelAchievedAt",
        readiness_score as "readinessScore",
        limiting_factor as "limitingFactor",
        limiting_factor_score as "limitingFactorScore",
        next_milestone as "nextMilestone",
        next_milestone_readiness as "nextMilestoneReadiness",
        last_serious_training_at as "lastSeriousTrainingAt",
        total_training_sessions as "totalTrainingSessions",
        notes,
        coaching_context as "coachingContext",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM skill_states
      WHERE user_id = ${userId}
      ORDER BY skill
    `
    return results as SkillState[]
  } catch (error) {
    console.error('[SkillState] Error fetching skill states:', error)
    return []
  }
}

/**
 * Get skill state for a specific skill
 */
export async function getSkillState(
  userId: string,
  skill: SkillKey
): Promise<SkillState | null> {
  const sql = getSql()
  if (!sql) {
    return null // Return null when DB unavailable
  }
  
  try {
    const results = await sql`
      SELECT 
        id,
        user_id as "userId",
        skill,
        current_level as "currentLevel",
        current_best_metric as "currentBestMetric",
        metric_type as "metricType",
        highest_level as "highestLevel",
        highest_best_metric as "highestBestMetric",
        highest_level_achieved_at as "highestLevelAchievedAt",
        readiness_score as "readinessScore",
        limiting_factor as "limitingFactor",
        limiting_factor_score as "limitingFactorScore",
        next_milestone as "nextMilestone",
        next_milestone_readiness as "nextMilestoneReadiness",
        last_serious_training_at as "lastSeriousTrainingAt",
        total_training_sessions as "totalTrainingSessions",
        notes,
        coaching_context as "coachingContext",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM skill_states
      WHERE user_id = ${userId} AND skill = ${skill}
      LIMIT 1
    `
    return results?.[0] as SkillState | null
  } catch (error) {
    console.error('[SkillState] Error fetching skill state for', skill, error)
    return null
  }
}

/**
 * Create or update skill state
 */
export async function saveSkillState(
  userId: string,
  skill: SkillKey,
  data: SkillStateInput
): Promise<SkillState | null> {
  const sql = getSql()
  if (!sql) {
    return null // Return null when DB unavailable
  }
  
  try {
    const now = new Date().toISOString()
    const id = `skill-state-${userId}-${skill}`
    
    // Upsert: insert or update if exists
    await sql`
      INSERT INTO skill_states (
        id,
        user_id,
        skill,
        current_level,
        current_best_metric,
        metric_type,
        highest_level,
        highest_best_metric,
        highest_level_achieved_at,
        readiness_score,
        limiting_factor,
        limiting_factor_score,
        next_milestone,
        next_milestone_readiness,
        notes,
        coaching_context,
        updated_at
      ) VALUES (
        ${id},
        ${userId},
        ${skill},
        ${data.currentLevel},
        ${data.currentBestMetric || 0},
        ${data.metricType || 'hold_seconds'},
        ${data.highestLevel || data.currentLevel},
        ${data.highestBestMetric || data.currentBestMetric || 0},
        ${data.currentLevel > (data.highestLevel || 0) ? now : null},
        ${data.readinessScore || 0},
        ${data.limitingFactor || null},
        ${data.limitingFactorScore || 0},
        ${data.nextMilestone || null},
        ${data.nextMilestoneReadiness || 0},
        ${data.notes || null},
        ${data.coachingContext || null},
        ${now}
      )
      ON CONFLICT (user_id, skill)
      DO UPDATE SET
        current_level = EXCLUDED.current_level,
        current_best_metric = EXCLUDED.current_best_metric,
        metric_type = EXCLUDED.metric_type,
        highest_level = GREATEST(skill_states.highest_level, EXCLUDED.current_level),
        highest_best_metric = GREATEST(skill_states.highest_best_metric, EXCLUDED.current_best_metric),
        highest_level_achieved_at = CASE 
          WHEN EXCLUDED.current_level > skill_states.highest_level THEN ${now}
          ELSE skill_states.highest_level_achieved_at
        END,
        readiness_score = EXCLUDED.readiness_score,
        limiting_factor = EXCLUDED.limiting_factor,
        limiting_factor_score = EXCLUDED.limiting_factor_score,
        next_milestone = EXCLUDED.next_milestone,
        next_milestone_readiness = EXCLUDED.next_milestone_readiness,
        notes = EXCLUDED.notes,
        coaching_context = EXCLUDED.coaching_context,
        updated_at = EXCLUDED.updated_at
    `
    
    // Save to history for tracking over time
    await sql`
      INSERT INTO skill_state_history (
        id,
        user_id,
        skill,
        current_level,
        current_best_metric,
        readiness_score,
        limiting_factor,
        snapshot_date
      ) VALUES (
        ${`ssh-${userId}-${skill}-${Date.now()}`},
        ${userId},
        ${skill},
        ${data.currentLevel},
        ${data.currentBestMetric || 0},
        ${data.readinessScore || 0},
        ${data.limitingFactor || null},
        CURRENT_DATE
      )
      ON CONFLICT (user_id, skill, snapshot_date)
      DO UPDATE SET
        current_level = EXCLUDED.current_level,
        current_best_metric = EXCLUDED.current_best_metric,
        readiness_score = EXCLUDED.readiness_score,
        limiting_factor = EXCLUDED.limiting_factor
    `
    
    // Return the updated state
    return getSkillState(userId, skill)
  } catch (error) {
    console.error('[SkillState] Error saving skill state:', error)
    return null
  }
}

/**
 * Update training session count and last training date
 */
export async function recordSkillTraining(
  userId: string,
  skill: SkillKey
): Promise<void> {
  const sql = getSql()
  if (!sql) {
    // No-op when DB unavailable
    return
  }
  
  try {
    const now = new Date().toISOString()
    
    await sql`
      UPDATE skill_states
      SET 
        last_serious_training_at = ${now},
        total_training_sessions = total_training_sessions + 1,
        updated_at = ${now}
      WHERE user_id = ${userId} AND skill = ${skill}
    `
  } catch (error) {
    console.error('[SkillState] Error recording training:', error)
  }
}

/**
 * Get skill state history for trend analysis
 */
export async function getSkillStateHistory(
  userId: string,
  skill: SkillKey,
  days: number = 30
): Promise<{
  date: string
  level: number
  metric: number
  readiness: number
}[]> {
  const sql = getSql()
  if (!sql) {
    return [] // Return empty when DB unavailable
  }
  
  try {
    const results = await sql`
      SELECT 
        snapshot_date as date,
        current_level as level,
        current_best_metric as metric,
        readiness_score as readiness
      FROM skill_state_history
      WHERE user_id = ${userId} 
        AND skill = ${skill}
        AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY snapshot_date DESC
    `
    return results as any[]
  } catch (error) {
    console.error('[SkillState] Error fetching history:', error)
    return []
  }
}

/**
 * Determine coaching context based on skill state
 */
export function determineCoachingContext(
  state: SkillState | null,
  currentLevel: number
): CoachingContext {
  if (!state) {
    return 'new_skill'
  }
  
  // Check if returning from break (no training in 2+ weeks)
  if (state.lastSeriousTrainingAt) {
    const daysSinceTraining = Math.floor(
      (Date.now() - new Date(state.lastSeriousTrainingAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceTraining > 14) {
      return 'returning_from_break'
    }
  }
  
  // Check if regressing
  if (currentLevel < state.highestLevel) {
    return 'regressing'
  }
  
  // Check if approaching milestone
  if (state.nextMilestoneReadiness > 70) {
    return 'approaching_milestone'
  }
  
  // Check if building foundation (early levels)
  if (currentLevel <= 2) {
    return 'building_foundation'
  }
  
  // Default to maintaining
  return 'maintaining'
}

// =============================================================================
// SKILL STATE LABELS
// =============================================================================

export const SKILL_LABELS: Record<SkillKey, string> = {
  front_lever: 'Front Lever',
  back_lever: 'Back Lever',
  planche: 'Planche',
  hspu: 'HSPU',
  muscle_up: 'Muscle-Up',
  l_sit: 'L-Sit',
}

export const COACHING_CONTEXT_LABELS: Record<CoachingContext, string> = {
  returning_from_break: 'Returning from Break',
  building_foundation: 'Building Foundation',
  approaching_milestone: 'Approaching Milestone',
  maintaining: 'Maintaining',
  regressing: 'Rebuilding',
  new_skill: 'New Skill',
}

// =============================================================================
// GRAPH-ENHANCED SKILL STATE
// =============================================================================

/**
 * Extended SkillState with graph node positioning
 */
export interface GraphEnhancedSkillState extends SkillState {
  graphPosition: AthleteGraphPosition | null
  currentNode: ProgressionNode | null
  nextNode: ProgressionNode | null
  isBlocked: boolean
  blockingReasons: string[]
}

/**
 * Convert SkillKey to SkillGraphId
 */
function skillKeyToGraphId(skill: SkillKey): SkillGraphId {
  return skill as SkillGraphId
}

/**
 * Get skill state enhanced with graph positioning
 */
export async function getGraphEnhancedSkillState(
  userId: string,
  skill: SkillKey,
  athleteBenchmarks?: Record<string, number>
): Promise<GraphEnhancedSkillState | null> {
  const state = await getSkillState(userId, skill)
  if (!state) return null
  
  // Default benchmarks from state if not provided
  const benchmarks = athleteBenchmarks || {
    pull_ups: 0,
    dips: 0,
    weighted_pull: 0,
    weighted_dip: 0,
    compression: 0,
    hold_time: state.currentBestMetric || 0,
  }
  
  // Get graph position
  const graphId = skillKeyToGraphId(skill)
  const graphPosition = determineGraphPosition(
    graphId,
    benchmarks,
    state.readinessScore || 0,
    state.metricType === 'hold_seconds' ? state.currentBestMetric : undefined,
    state.metricType === 'reps' ? state.currentBestMetric : undefined
  )
  
  return {
    ...state,
    graphPosition,
    currentNode: graphPosition?.currentNode || null,
    nextNode: graphPosition?.nextRecommendedNode || null,
    isBlocked: graphPosition?.isBlocked || false,
    blockingReasons: graphPosition?.blockingReasons.map(r => r.description) || [],
  }
}

/**
 * Get all skill states enhanced with graph positioning
 */
export async function getAllGraphEnhancedSkillStates(
  userId: string,
  athleteBenchmarks?: Record<string, number>
): Promise<GraphEnhancedSkillState[]> {
  const states = await getAthleteSkillStates(userId)
  
  return Promise.all(
    states.map(async (state) => {
      const enhanced = await getGraphEnhancedSkillState(
        userId,
        state.skill,
        athleteBenchmarks
      )
      return enhanced || {
        ...state,
        graphPosition: null,
        currentNode: null,
        nextNode: null,
        isBlocked: false,
        blockingReasons: [],
      }
    })
  )
}

/**
 * Map numeric level to graph node for a skill
 */
export function mapLevelToGraphNode(
  skill: SkillKey,
  level: number
): ProgressionNode | null {
  const graphId = skillKeyToGraphId(skill)
  const graph = getSkillGraph(graphId)
  if (!graph) return null
  
  // Find node with matching levelIndex
  const node = graph.nodes.find(n => n.levelIndex === level)
  return node || null
}

/**
 * Get node ID from current level (for SkillState update)
 */
export function getCurrentNodeId(
  skill: SkillKey,
  level: number
): string | null {
  const node = mapLevelToGraphNode(skill, level)
  return node?.nodeId || null
}

// =============================================================================
// BENCHMARK INTEGRATION
// =============================================================================

import {
  getUserBenchmarks,
  calculateReadinessAdjustment,
  detectLimiterFromBenchmarks,
  type Benchmark,
} from './benchmark-testing-engine'

/**
 * Update skill state readiness based on new benchmark data
 */
export async function updateSkillStateFromBenchmarks(
  userId: string
): Promise<{ updated: SkillKey[]; adjustments: Record<SkillKey, number> }> {
  const benchmarks = await getUserBenchmarks(userId)
  const skillStates = await getAthleteSkillStates(userId)
  
  // Calculate readiness adjustments from all recent benchmarks
  const adjustmentMap: Record<SkillKey, number[]> = {
    front_lever: [],
    back_lever: [],
    planche: [],
    hspu: [],
    muscle_up: [],
    l_sit: [],
  }
  
  // Get recent benchmarks (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentBenchmarks = benchmarks.filter(b => 
    new Date(b.testDate) >= thirtyDaysAgo
  )
  
  for (const benchmark of recentBenchmarks) {
    const adjustments = calculateReadinessAdjustment(benchmark)
    for (const adj of adjustments) {
      if (adjustmentMap[adj.skill]) {
        adjustmentMap[adj.skill].push(adj.adjustment)
      }
    }
  }
  
  // Average the adjustments for each skill
  const finalAdjustments: Record<SkillKey, number> = {} as Record<SkillKey, number>
  const updatedSkills: SkillKey[] = []
  
  for (const [skill, adjustments] of Object.entries(adjustmentMap)) {
    if (adjustments.length > 0) {
      const avgAdjustment = adjustments.reduce((a, b) => a + b, 0) / adjustments.length
      finalAdjustments[skill as SkillKey] = Math.round(avgAdjustment)
      
      // Find existing state
      const state = skillStates.find(s => s.skill === skill)
      if (state && avgAdjustment !== 0) {
        // Update readiness score
        const newReadiness = Math.min(100, Math.max(0, state.readinessScore + avgAdjustment))
        await updateSkillState(userId, skill as SkillKey, {
          currentLevel: state.currentLevel,
          readinessScore: newReadiness,
        })
        updatedSkills.push(skill as SkillKey)
      }
    }
  }
  
  return { updated: updatedSkills, adjustments: finalAdjustments }
}

/**
 * Get skill state with benchmark-derived limiter
 */
export async function getSkillStateWithBenchmarkLimiter(
  userId: string,
  skill: SkillKey
): Promise<SkillState & { benchmarkLimiter: { limiter: string; confidence: number } | null }> {
  const state = await getSkillState(userId, skill)
  if (!state) {
    throw new Error(`No skill state found for ${skill}`)
  }
  
  const benchmarks = await getUserBenchmarks(userId)
  const limiterInfo = detectLimiterFromBenchmarks(benchmarks)
  
  return {
    ...state,
    benchmarkLimiter: limiterInfo,
  }
}
