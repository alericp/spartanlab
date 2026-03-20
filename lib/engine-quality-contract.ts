/**
 * ENGINE QUALITY CONTRACT
 * 
 * This file documents the SpartanLab adaptive programming engine pipeline
 * and provides utilities for goal hierarchy, session volume scaling, and
 * bottleneck ranking. This is the canonical reference for engine quality.
 * 
 * =============================================================================
 * ENGINE PIPELINE FLOW (TASK 1)
 * =============================================================================
 * 
 * 1. PROFILE NORMALIZATION
 *    - Input: CanonicalProgrammingProfile (from onboarding/settings)
 *    - Output: NormalizedProfile (engine-ready)
 *    - File: lib/profile-normalizer.ts
 *    - Validates critical fields, maps benchmarks
 * 
 * 2. LIMITER / BOTTLENECK DETECTION
 *    - Input: NormalizedProfile + skill targets
 *    - Output: Ranked bottleneck list with severity scores
 *    - File: lib/weak-point-engine.ts
 *    - Uses SKILL_PREREQUISITES to weight limiters per goal
 * 
 * 3. SCHEDULE SPLIT DECISION
 *    - Input: scheduleMode, trainingDays, recoveryLevel
 *    - Output: Effective training days, day stress pattern
 *    - File: lib/flexible-schedule-engine.ts
 *    - Flexible mode resolves to concrete week structure
 * 
 * 4. DAY TEMPLATE SELECTION
 *    - Input: Primary goal, secondary goal, session duration
 *    - Output: Day types with focus areas
 *    - File: lib/program-structure-engine.ts
 *    - Uses GOAL_HIERARCHY_WEIGHTS for emphasis
 * 
 * 5. EXERCISE SELECTION
 *    - Input: Day focus, athlete profile, equipment
 *    - Output: Selected exercises with reasons
 *    - File: lib/program-exercise-selector.ts
 *    - Respects straight-arm vs bent-arm distinctions
 * 
 * 6. WARM-UP GENERATION
 *    - Input: Main exercises, first skill, joint cautions
 *    - Output: Deduplicated warm-up with progression ramp
 *    - File: lib/warmup-engine.ts
 *    - MUST include prerequisite prep for demanding skills
 * 
 * 7. SET/REP/HOLD PRESCRIPTION
 *    - Input: Exercise category, training method, fatigue
 *    - Output: Sets, reps, hold times, RPE
 *    - File: lib/training-methods.ts
 *    - Skill work uses cluster sets, strength uses neural ranges
 * 
 * 8. ACCESSORY SELECTION
 *    - Input: Detected weak points, session time remaining
 *    - Output: Targeted accessory exercises
 *    - File: lib/weak-point-engine.ts (getWeakPointAccessories)
 *    - Addresses primary and secondary limiters
 * 
 * 9. COOLDOWN SELECTION
 *    - Input: Session focus, flexibility goals
 *    - Output: Cooldown exercises
 *    - File: lib/cooldown-engine.ts
 *    - Targets worked areas + flexibility goals
 * 
 * 10. EXPLANATION / COACHING COPY
 *     - Input: All engine decisions, constraints, profile
 *     - Output: Human-readable rationale
 *     - File: lib/explanation-resolver.ts
 *     - MUST reflect actual programming, not generic copy
 * 
 * =============================================================================
 * DURATION CONTRACT (TASK 5)
 * =============================================================================
 * 
 * Canonical duration buckets with target content volumes:
 * 
 * | Duration | Label            | Warmup | Main Ex | Accessories | Cooldown | Total |
 * |----------|------------------|--------|---------|-------------|----------|-------|
 * | 30 min   | Focused          | 4 min  | 3-4     | 0-1         | 2 min    | 26-30 |
 * | 45 min   | Balanced         | 5 min  | 4-5     | 1-2         | 3 min    | 40-45 |
 * | 60 min   | Complete         | 6 min  | 5-6     | 2-3         | 4 min    | 55-60 |
 * | 90 min   | Extended         | 8 min  | 6-8     | 3-4         | 5 min    | 80-90 |
 * 
 * RULES:
 * - Duration label MUST match actual content volume
 * - Warmup scales with session length
 * - Accessories only included if time permits
 * - Never over-stuff a shorter session
 */

// =============================================================================
// GOAL HIERARCHY WEIGHTS (TASK 2)
// =============================================================================

/**
 * Determines how primary and secondary goals affect session distribution.
 * Higher weight = more sessions/volume dedicated to that goal.
 */
export interface GoalHierarchyWeights {
  primaryWeight: number      // 0.6-0.7 typically
  secondaryWeight: number    // 0.2-0.3 typically
  supportWeight: number      // 0.1-0.2 for complementary work
}

/**
 * Calculate goal weights based on training path and goals.
 * 
 * @param primaryGoal - Main skill/strength target
 * @param secondaryGoal - Supporting goal (optional)
 * @param trainingPath - hybrid | skill_progression | strength_endurance
 * @returns Weights for session distribution
 */
export function calculateGoalHierarchyWeights(
  primaryGoal: string,
  secondaryGoal: string | null,
  trainingPath: string | null
): GoalHierarchyWeights {
  // Base weights
  let primaryWeight = 0.65
  let secondaryWeight = secondaryGoal ? 0.25 : 0
  let supportWeight = 0.10
  
  // Adjust for training path
  if (trainingPath === 'hybrid') {
    // Hybrid: balanced skill + strength
    if (isSkillGoal(primaryGoal) && secondaryGoal && isSkillGoal(secondaryGoal)) {
      // Both are skills - split more evenly but primary still leads
      primaryWeight = 0.55
      secondaryWeight = 0.30
      supportWeight = 0.15
    } else if (isSkillGoal(primaryGoal)) {
      // Primary skill + strength support
      primaryWeight = 0.60
      secondaryWeight = secondaryGoal ? 0.25 : 0
      supportWeight = 0.15
    }
  } else if (trainingPath === 'skill_progression') {
    // Skill-focused: strong primary emphasis
    primaryWeight = 0.70
    secondaryWeight = secondaryGoal ? 0.20 : 0
    supportWeight = 0.10
  } else if (trainingPath === 'strength_endurance') {
    // Strength-focused: more balanced
    primaryWeight = 0.55
    secondaryWeight = secondaryGoal ? 0.30 : 0
    supportWeight = 0.15
  }
  
  // Normalize to sum to 1.0
  const total = primaryWeight + secondaryWeight + supportWeight
  return {
    primaryWeight: primaryWeight / total,
    secondaryWeight: secondaryWeight / total,
    supportWeight: supportWeight / total,
  }
}

function isSkillGoal(goal: string): boolean {
  const skillGoals = [
    'planche', 'front_lever', 'back_lever', 'muscle_up',
    'hspu', 'handstand', 'l_sit', 'v_sit', 'iron_cross',
    'one_arm_pull_up', 'ring_muscle_up', 'maltese',
  ]
  return skillGoals.includes(goal)
}

function isStrengthGoal(goal: string): boolean {
  const strengthGoals = [
    'weighted_strength', 'strength', 'weighted_pull_up',
    'weighted_dip', 'max_reps', 'strength_endurance',
  ]
  return strengthGoals.includes(goal)
}

// =============================================================================
// SESSION DISTRIBUTION (TASK 2)
// =============================================================================

/**
 * Determines how many sessions per week focus on each goal type.
 * 
 * For a 4-day week with primary=planche, secondary=front_lever:
 * - 2-3 sessions emphasize planche (push/straight-arm)
 * - 1-2 sessions emphasize front lever (pull/straight-arm)
 * - Pull strength support integrated throughout
 */
export interface SessionDistribution {
  primaryFocusSessions: number
  secondaryFocusSessions: number
  mixedSessions: number
  totalSessions: number
  rationale: string
}

export function calculateSessionDistribution(
  totalDays: number,
  primaryGoal: string,
  secondaryGoal: string | null,
  trainingPath: string | null
): SessionDistribution {
  const weights = calculateGoalHierarchyWeights(primaryGoal, secondaryGoal, trainingPath)
  
  // Calculate session counts
  const primaryFocusSessions = Math.round(totalDays * weights.primaryWeight)
  const secondaryFocusSessions = secondaryGoal 
    ? Math.round(totalDays * weights.secondaryWeight)
    : 0
  const mixedSessions = totalDays - primaryFocusSessions - secondaryFocusSessions
  
  // Build rationale
  const rationale = buildDistributionRationale(
    primaryGoal,
    secondaryGoal,
    primaryFocusSessions,
    secondaryFocusSessions,
    mixedSessions,
    trainingPath
  )
  
  return {
    primaryFocusSessions,
    secondaryFocusSessions,
    mixedSessions,
    totalSessions: totalDays,
    rationale,
  }
}

function buildDistributionRationale(
  primary: string,
  secondary: string | null,
  primarySessions: number,
  secondarySessions: number,
  mixedSessions: number,
  trainingPath: string | null
): string {
  const primaryLabel = GOAL_DISPLAY_LABELS[primary] || primary
  const secondaryLabel = secondary ? (GOAL_DISPLAY_LABELS[secondary] || secondary) : null
  
  if (!secondary) {
    return `${primarySessions} sessions focused on ${primaryLabel}, ${mixedSessions} sessions for strength support and recovery.`
  }
  
  if (trainingPath === 'hybrid') {
    return `Hybrid training: ${primarySessions} primary ${primaryLabel} sessions, ${secondarySessions} ${secondaryLabel} sessions, ${mixedSessions} mixed/support sessions. Both goals receive dedicated attention with ${primaryLabel} taking priority.`
  }
  
  return `${primarySessions} sessions prioritize ${primaryLabel}, ${secondarySessions} sessions develop ${secondaryLabel}, ${mixedSessions} sessions for integrated strength support.`
}

const GOAL_DISPLAY_LABELS: Record<string, string> = {
  planche: 'Planche',
  front_lever: 'Front Lever',
  back_lever: 'Back Lever',
  muscle_up: 'Muscle Up',
  hspu: 'Handstand Push-Up',
  handstand: 'Handstand',
  l_sit: 'L-Sit',
  v_sit: 'V-Sit',
  iron_cross: 'Iron Cross',
  one_arm_pull_up: 'One Arm Pull-Up',
  weighted_strength: 'Weighted Strength',
  strength: 'Strength',
  flexibility: 'Flexibility',
  endurance: 'Endurance',
}

// =============================================================================
// DURATION VOLUME SCALING (TASK 5)
// =============================================================================

export interface DurationVolumeConfig {
  warmupMinutes: number
  warmupExerciseCount: number
  mainExerciseCount: { min: number; max: number }
  accessoryCount: { min: number; max: number }
  cooldownMinutes: number
  cooldownExerciseCount: number
  totalEstimatedMinutes: { min: number; max: number }
}

export const DURATION_VOLUME_CONFIGS: Record<number, DurationVolumeConfig> = {
  30: {
    warmupMinutes: 4,
    warmupExerciseCount: 4,
    mainExerciseCount: { min: 3, max: 4 },
    accessoryCount: { min: 0, max: 1 },
    cooldownMinutes: 2,
    cooldownExerciseCount: 2,
    totalEstimatedMinutes: { min: 26, max: 30 },
  },
  45: {
    warmupMinutes: 5,
    warmupExerciseCount: 5,
    mainExerciseCount: { min: 4, max: 5 },
    accessoryCount: { min: 1, max: 2 },
    cooldownMinutes: 3,
    cooldownExerciseCount: 3,
    totalEstimatedMinutes: { min: 40, max: 45 },
  },
  60: {
    warmupMinutes: 6,
    warmupExerciseCount: 6,
    mainExerciseCount: { min: 5, max: 6 },
    accessoryCount: { min: 2, max: 3 },
    cooldownMinutes: 4,
    cooldownExerciseCount: 3,
    totalEstimatedMinutes: { min: 55, max: 60 },
  },
  75: {
    warmupMinutes: 7,
    warmupExerciseCount: 7,
    mainExerciseCount: { min: 5, max: 7 },
    accessoryCount: { min: 2, max: 4 },
    cooldownMinutes: 4,
    cooldownExerciseCount: 4,
    totalEstimatedMinutes: { min: 68, max: 75 },
  },
  90: {
    warmupMinutes: 8,
    warmupExerciseCount: 8,
    mainExerciseCount: { min: 6, max: 8 },
    accessoryCount: { min: 3, max: 4 },
    cooldownMinutes: 5,
    cooldownExerciseCount: 4,
    totalEstimatedMinutes: { min: 80, max: 90 },
  },
}

/**
 * Get volume configuration for a given session duration.
 * Falls back to nearest bucket if exact match not found.
 */
export function getDurationVolumeConfig(sessionMinutes: number): DurationVolumeConfig {
  // Direct match
  if (DURATION_VOLUME_CONFIGS[sessionMinutes]) {
    return DURATION_VOLUME_CONFIGS[sessionMinutes]
  }
  
  // Find nearest bucket
  const buckets = [30, 45, 60, 75, 90]
  const nearest = buckets.reduce((prev, curr) => 
    Math.abs(curr - sessionMinutes) < Math.abs(prev - sessionMinutes) ? curr : prev
  )
  
  return DURATION_VOLUME_CONFIGS[nearest]
}

// =============================================================================
// RANKED BOTTLENECK MODEL (TASK 3)
// =============================================================================

export interface RankedBottleneck {
  type: string
  label: string
  severityScore: number    // 0-100, higher = more limiting
  confidenceScore: number  // 0-1
  source: 'benchmark' | 'skill_level' | 'equipment' | 'joint' | 'recovery' | 'inference'
  affectsGoals: string[]   // Which goals this bottleneck limits
  suggestedFocus: string   // What to prioritize to address it
}

/**
 * Rank bottlenecks from most to least limiting.
 * Returns top 3 for engine use (UI may only show 1).
 */
export function rankBottlenecks(
  primaryGoal: string,
  secondaryGoal: string | null,
  strengthBenchmarks: {
    pullups: number | null
    dips: number | null
    pushups: number | null
    weightedPull: { weight: number; reps: number } | null
    weightedDip: { weight: number; reps: number } | null
  },
  skillProgressions: {
    frontLever: { progression: string | null; holdSeconds: number | null }
    planche: { progression: string | null; holdSeconds: number | null }
    hspu: { progression: string | null }
  },
  equipment: string[],
  jointCautions: string[],
  recoveryLevel: string | null
): RankedBottleneck[] {
  const bottlenecks: RankedBottleneck[] = []
  
  // Analyze primary goal requirements
  const primaryReqs = getGoalRequirements(primaryGoal)
  
  // Check strength bottlenecks for primary goal
  if (primaryReqs.requiresPullStrength) {
    const pullScore = calculatePullStrengthScore(strengthBenchmarks)
    if (pullScore < 70) {
      bottlenecks.push({
        type: 'pull_strength',
        label: 'Pulling Strength',
        severityScore: 100 - pullScore,
        confidenceScore: strengthBenchmarks.pullups !== null ? 0.9 : 0.5,
        source: 'benchmark',
        affectsGoals: [primaryGoal, secondaryGoal].filter(Boolean) as string[],
        suggestedFocus: 'Weighted pull-ups and rows',
      })
    }
  }
  
  if (primaryReqs.requiresPushStrength) {
    const pushScore = calculatePushStrengthScore(strengthBenchmarks)
    if (pushScore < 70) {
      bottlenecks.push({
        type: 'push_strength',
        label: 'Pushing Strength',
        severityScore: 100 - pushScore,
        confidenceScore: strengthBenchmarks.dips !== null ? 0.9 : 0.5,
        source: 'benchmark',
        affectsGoals: [primaryGoal],
        suggestedFocus: 'Weighted dips and pressing variations',
      })
    }
  }
  
  if (primaryReqs.requiresStraightArmPull) {
    const saScore = calculateStraightArmPullScore(strengthBenchmarks, skillProgressions)
    if (saScore < 70) {
      bottlenecks.push({
        type: 'straight_arm_pull_strength',
        label: 'Straight-Arm Pull Strength',
        severityScore: 100 - saScore,
        confidenceScore: 0.8,
        source: 'skill_level',
        affectsGoals: ['front_lever', 'back_lever'].filter(g => g === primaryGoal || g === secondaryGoal),
        suggestedFocus: 'Front lever progressions and straight-arm pulldown work',
      })
    }
  }
  
  if (primaryReqs.requiresStraightArmPush) {
    const saScore = calculateStraightArmPushScore(strengthBenchmarks, skillProgressions)
    if (saScore < 70) {
      bottlenecks.push({
        type: 'straight_arm_push_strength',
        label: 'Straight-Arm Push Strength',
        severityScore: 100 - saScore,
        confidenceScore: 0.8,
        source: 'skill_level',
        affectsGoals: ['planche'].filter(g => g === primaryGoal || g === secondaryGoal),
        suggestedFocus: 'Planche leans and pseudo planche push-ups',
      })
    }
  }
  
  // Check joint cautions
  if (jointCautions.includes('shoulder') && (primaryReqs.requiresPushStrength || primaryReqs.requiresStraightArmPush)) {
    bottlenecks.push({
      type: 'shoulder_caution',
      label: 'Shoulder Joint Consideration',
      severityScore: 40,
      confidenceScore: 1.0,
      source: 'joint',
      affectsGoals: [primaryGoal],
      suggestedFocus: 'Gradual loading with extra prehab and warm-up',
    })
  }
  
  if (jointCautions.includes('wrist') && primaryGoal === 'planche') {
    bottlenecks.push({
      type: 'wrist_caution',
      label: 'Wrist Tolerance',
      severityScore: 50,
      confidenceScore: 1.0,
      source: 'joint',
      affectsGoals: ['planche', 'handstand'],
      suggestedFocus: 'Progressive wrist loading and parallette use',
    })
  }
  
  // Check equipment limitations
  if (!equipment.includes('weights') && primaryReqs.requiresWeightedTraining) {
    bottlenecks.push({
      type: 'equipment_weighted',
      label: 'Limited Weighted Training Equipment',
      severityScore: 30,
      confidenceScore: 1.0,
      source: 'equipment',
      affectsGoals: [primaryGoal],
      suggestedFocus: 'Higher volume bodyweight progressions',
    })
  }
  
  // Check recovery
  if (recoveryLevel === 'poor' || recoveryLevel === 'very_poor') {
    bottlenecks.push({
      type: 'recovery',
      label: 'Recovery Capacity',
      severityScore: 60,
      confidenceScore: 0.7,
      source: 'recovery',
      affectsGoals: [primaryGoal, secondaryGoal].filter(Boolean) as string[],
      suggestedFocus: 'Reduced volume with maintained intensity',
    })
  }
  
  // Sort by severity (highest first) and return top 3
  return bottlenecks
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, 3)
}

interface GoalRequirements {
  requiresPullStrength: boolean
  requiresPushStrength: boolean
  requiresStraightArmPull: boolean
  requiresStraightArmPush: boolean
  requiresWeightedTraining: boolean
  requiresCompression: boolean
}

function getGoalRequirements(goal: string): GoalRequirements {
  const requirements: Record<string, GoalRequirements> = {
    planche: {
      requiresPullStrength: false,
      requiresPushStrength: true,
      requiresStraightArmPull: false,
      requiresStraightArmPush: true,
      requiresWeightedTraining: true,
      requiresCompression: true,
    },
    front_lever: {
      requiresPullStrength: true,
      requiresPushStrength: false,
      requiresStraightArmPull: true,
      requiresStraightArmPush: false,
      requiresWeightedTraining: true,
      requiresCompression: true,
    },
    back_lever: {
      requiresPullStrength: true,
      requiresPushStrength: false,
      requiresStraightArmPull: true,
      requiresStraightArmPush: false,
      requiresWeightedTraining: false,
      requiresCompression: false,
    },
    muscle_up: {
      requiresPullStrength: true,
      requiresPushStrength: true,
      requiresStraightArmPull: false,
      requiresStraightArmPush: false,
      requiresWeightedTraining: false,
      requiresCompression: false,
    },
    hspu: {
      requiresPullStrength: false,
      requiresPushStrength: true,
      requiresStraightArmPull: false,
      requiresStraightArmPush: false,
      requiresWeightedTraining: false,
      requiresCompression: false,
    },
    handstand: {
      requiresPullStrength: false,
      requiresPushStrength: true,
      requiresStraightArmPull: false,
      requiresStraightArmPush: false,
      requiresWeightedTraining: false,
      requiresCompression: false,
    },
    l_sit: {
      requiresPullStrength: false,
      requiresPushStrength: false,
      requiresStraightArmPull: false,
      requiresStraightArmPush: false,
      requiresWeightedTraining: false,
      requiresCompression: true,
    },
    v_sit: {
      requiresPullStrength: false,
      requiresPushStrength: false,
      requiresStraightArmPull: false,
      requiresStraightArmPush: false,
      requiresWeightedTraining: false,
      requiresCompression: true,
    },
  }
  
  return requirements[goal] || {
    requiresPullStrength: true,
    requiresPushStrength: true,
    requiresStraightArmPull: false,
    requiresStraightArmPush: false,
    requiresWeightedTraining: true,
    requiresCompression: false,
  }
}

function calculatePullStrengthScore(benchmarks: {
  pullups: number | null
  weightedPull: { weight: number; reps: number } | null
}): number {
  let score = 50 // Default mid-range
  
  if (benchmarks.pullups !== null) {
    if (benchmarks.pullups >= 20) score = 85
    else if (benchmarks.pullups >= 15) score = 75
    else if (benchmarks.pullups >= 10) score = 60
    else if (benchmarks.pullups >= 5) score = 45
    else score = 25
  }
  
  // Weighted bonus
  if (benchmarks.weightedPull) {
    const weightBonus = Math.min(20, benchmarks.weightedPull.weight / 2)
    score = Math.min(100, score + weightBonus)
  }
  
  return score
}

function calculatePushStrengthScore(benchmarks: {
  dips: number | null
  pushups: number | null
  weightedDip: { weight: number; reps: number } | null
}): number {
  let score = 50
  
  if (benchmarks.dips !== null) {
    if (benchmarks.dips >= 25) score = 85
    else if (benchmarks.dips >= 20) score = 75
    else if (benchmarks.dips >= 15) score = 65
    else if (benchmarks.dips >= 10) score = 50
    else score = 35
  }
  
  // Push-up bonus
  if (benchmarks.pushups !== null && benchmarks.pushups >= 40) {
    score = Math.min(100, score + 10)
  }
  
  // Weighted dip bonus
  if (benchmarks.weightedDip) {
    const weightBonus = Math.min(20, benchmarks.weightedDip.weight / 2.5)
    score = Math.min(100, score + weightBonus)
  }
  
  return score
}

function calculateStraightArmPullScore(
  benchmarks: { weightedPull: { weight: number; reps: number } | null },
  skills: { frontLever: { progression: string | null } }
): number {
  let score = 40 // Default lower for advanced skill
  
  // Weighted pull gives foundation
  if (benchmarks.weightedPull && benchmarks.weightedPull.weight >= 20) {
    score = 55
  }
  
  // Front lever progression is key indicator
  const flLevel = skills.frontLever.progression
  if (flLevel) {
    const levelScores: Record<string, number> = {
      'tuck': 50,
      'adv_tuck': 65,
      'advanced_tuck': 65,
      'one_leg': 75,
      'straddle': 85,
      'full': 95,
    }
    score = Math.max(score, levelScores[flLevel] || 40)
  }
  
  return score
}

function calculateStraightArmPushScore(
  benchmarks: { weightedDip: { weight: number; reps: number } | null },
  skills: { planche: { progression: string | null } }
): number {
  let score = 40
  
  // Weighted dip gives foundation
  if (benchmarks.weightedDip && benchmarks.weightedDip.weight >= 30) {
    score = 55
  }
  
  // Planche progression is key indicator
  const plLevel = skills.planche.progression
  if (plLevel) {
    const levelScores: Record<string, number> = {
      'lean': 45,
      'tuck': 55,
      'adv_tuck': 70,
      'advanced_tuck': 70,
      'straddle': 85,
      'full': 95,
    }
    score = Math.max(score, levelScores[plLevel] || 40)
  }
  
  return score
}

// =============================================================================
// ENGINE DIAGNOSTICS LOGGING (TASK 11)
// =============================================================================

export interface EngineDiagnostics {
  normalizedInputSummary: {
    primaryGoal: string
    secondaryGoal: string | null
    experienceLevel: string
    sessionDuration: number
    scheduleMode: string
    strengthBenchmarks: Record<string, unknown>
    skillProgressions: Record<string, unknown>
  }
  rankedBottlenecks: RankedBottleneck[]
  sessionDistribution: SessionDistribution
  durationVolumeConfig: DurationVolumeConfig
  warmupComponentsChosen: string[]
  warmupDedupeEvents: string[]
  goalWeighting: GoalHierarchyWeights
  // TASK 10: Enhanced diagnostics for prescription and load balancing
  prescriptionModeUsage?: {
    skill_hold: number
    skill_cluster: number
    weighted_strength: number
    bodyweight_strength: number
    hypertrophy_support: number
    compression_core: number
    mobility_prep: number
    density_block: number
  }
  weeklyLoadBalance?: {
    totalNeuralLoad: number
    straightArmDays: number
    hasRecoveryDay: boolean
    balanceIssues: string[]
  }
  weightedStrengthDecisions?: Array<{
    exercise: string
    primaryTarget: string
    included: boolean
    rationale: string
  }>
  topLimiterRanking?: Array<{
    type: string
    severity: number
    affectsGoals: string[]
  }>
}

/**
 * Log engine diagnostics for debugging.
 * Only logs in development mode.
 * 
 * TASK 10: Enhanced diagnostics showing:
 * - Goal weighting result
 * - Selected split/day-type map
 * - Session budget chosen
 * - Prescription modes used
 * - Top limiter ranking
 * - Weighted support decisions
 * - Warm-up progression mode chosen
 */
export function logEngineDiagnostics(diagnostics: EngineDiagnostics): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[EngineDiagnostics] ===== ENGINE QUALITY SUMMARY =====')
  console.log('[EngineDiagnostics] Input Summary:', {
    primaryGoal: diagnostics.normalizedInputSummary.primaryGoal,
    secondaryGoal: diagnostics.normalizedInputSummary.secondaryGoal,
    experienceLevel: diagnostics.normalizedInputSummary.experienceLevel,
    sessionDuration: diagnostics.normalizedInputSummary.sessionDuration,
    scheduleMode: diagnostics.normalizedInputSummary.scheduleMode,
  })
  console.log('[EngineDiagnostics] Goal Weighting:', diagnostics.goalWeighting)
  console.log('[EngineDiagnostics] Session Distribution:', diagnostics.sessionDistribution)
  console.log('[EngineDiagnostics] Ranked Bottlenecks:', diagnostics.rankedBottlenecks.map(b => ({
    type: b.type,
    severity: b.severityScore,
    label: b.label,
  })))
  console.log('[EngineDiagnostics] Duration Config:', {
    warmupMin: diagnostics.durationVolumeConfig.warmupMinutes,
    mainExercises: diagnostics.durationVolumeConfig.mainExerciseCount,
    accessories: diagnostics.durationVolumeConfig.accessoryCount,
  })
  if (diagnostics.warmupDedupeEvents.length > 0) {
    console.log('[EngineDiagnostics] Warmup Deduped:', diagnostics.warmupDedupeEvents)
  }
  
  // TASK 10: Enhanced diagnostics
  if (diagnostics.prescriptionModeUsage) {
    console.log('[EngineDiagnostics] Prescription Modes Used:', diagnostics.prescriptionModeUsage)
  }
  if (diagnostics.weeklyLoadBalance) {
    console.log('[EngineDiagnostics] Weekly Load Balance:', {
      neuralLoad: diagnostics.weeklyLoadBalance.totalNeuralLoad,
      straightArmDays: diagnostics.weeklyLoadBalance.straightArmDays,
      hasRecoveryDay: diagnostics.weeklyLoadBalance.hasRecoveryDay,
      issues: diagnostics.weeklyLoadBalance.balanceIssues,
    })
  }
  if (diagnostics.weightedStrengthDecisions && diagnostics.weightedStrengthDecisions.length > 0) {
    console.log('[EngineDiagnostics] Weighted Support Decisions:', diagnostics.weightedStrengthDecisions)
  }
  if (diagnostics.topLimiterRanking && diagnostics.topLimiterRanking.length > 0) {
    console.log('[EngineDiagnostics] Top Limiter Ranking:', diagnostics.topLimiterRanking)
  }
  
  console.log('[EngineDiagnostics] ===== END SUMMARY =====')
}

// =============================================================================
// PRESCRIPTION MODE INTEGRATION (TASK 1)
// =============================================================================

/**
 * Re-export prescription types for consumers
 */
export type {
  PrescriptionMode,
  PrescriptionContract,
  AthleteContext as PrescriptionAthleteContext,
  DayLoadProfile,
  WeekLoadBalance,
  PrescriptionDiagnostics,
} from './prescription-contract'

export {
  PRESCRIPTION_TEMPLATES,
  detectPrescriptionMode,
  resolvePrescription,
  formatPrescription,
  resolveWeightedStrengthForSkill,
  analyzeWeekLoadBalance,
  suggestOptimalDayOrder,
  logPrescriptionDiagnostics,
} from './prescription-contract'

// =============================================================================
// ADVANCED PRESCRIPTION RULES (TASK 2 - SKILL PRESCRIPTION QUALITY)
// =============================================================================

/**
 * Advanced skill prescription parameters based on athlete level and skill type.
 * TASK 2: Makes skill holds feel intentional and level-aware.
 */
export interface SkillPrescriptionRules {
  skillType: 'static_lever' | 'static_planche' | 'dynamic_transition' | 'balance' | 'compression'
  athleteLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  prescriptionStyle: 'cluster_exposure' | 'quality_holds' | 'max_effort' | 'volume_accumulation'
  holdSecondsRange: [number, number]
  setsRange: [number, number]
  restSeconds: number
  intensityNotes: string[]
}

/**
 * Get skill prescription rules based on skill type and athlete level.
 * TASK 2: Ensures planche, front lever, HSPU prescriptions match reality.
 */
export function getSkillPrescriptionRules(
  skillType: string,
  athleteLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite',
  currentProgression?: string
): SkillPrescriptionRules {
  // Map skill to skill type
  const skillTypeMap: Record<string, SkillPrescriptionRules['skillType']> = {
    planche: 'static_planche',
    front_lever: 'static_lever',
    back_lever: 'static_lever',
    muscle_up: 'dynamic_transition',
    handstand: 'balance',
    hspu: 'dynamic_transition',
    l_sit: 'compression',
    v_sit: 'compression',
  }
  
  const type = skillTypeMap[skillType] || 'static_lever'
  
  // Advanced/elite athletes with tuck or better progressions get quality-focused prescriptions
  const isAdvancedProgression = currentProgression && 
    ['tuck', 'adv_tuck', 'advanced_tuck', 'straddle', 'one_leg', 'full'].includes(currentProgression)
  
  // Static lever work (front lever, back lever)
  if (type === 'static_lever') {
    if (athleteLevel === 'advanced' || athleteLevel === 'elite') {
      return {
        skillType: type,
        athleteLevel,
        prescriptionStyle: isAdvancedProgression ? 'quality_holds' : 'cluster_exposure',
        holdSecondsRange: isAdvancedProgression ? [5, 12] : [3, 8],
        setsRange: [4, 6],
        restSeconds: isAdvancedProgression ? 150 : 90,
        intensityNotes: [
          'Full body tension throughout',
          'Stop when form breaks - quality over duration',
          isAdvancedProgression ? 'Progress hold time before advancing variation' : 'Build exposure time at current level',
        ],
      }
    }
    return {
      skillType: type,
      athleteLevel,
      prescriptionStyle: 'cluster_exposure',
      holdSecondsRange: [3, 6],
      setsRange: [4, 8],
      restSeconds: 60,
      intensityNotes: [
        'Focus on position and tension',
        'Multiple short exposures build neurological patterns',
      ],
    }
  }
  
  // Static planche work
  if (type === 'static_planche') {
    if (athleteLevel === 'advanced' || athleteLevel === 'elite') {
      return {
        skillType: type,
        athleteLevel,
        prescriptionStyle: isAdvancedProgression ? 'quality_holds' : 'cluster_exposure',
        holdSecondsRange: isAdvancedProgression ? [5, 10] : [3, 6],
        setsRange: [4, 6],
        restSeconds: isAdvancedProgression ? 180 : 120,
        intensityNotes: [
          'Protraction and posterior pelvic tilt throughout',
          'Wrist prep is non-negotiable before planche work',
          isAdvancedProgression ? 'Max quality holds - stop when lean angle drops' : 'Build lean angle tolerance',
        ],
      }
    }
    return {
      skillType: type,
      athleteLevel,
      prescriptionStyle: 'cluster_exposure',
      holdSecondsRange: [3, 5],
      setsRange: [5, 8],
      restSeconds: 90,
      intensityNotes: [
        'Prioritize lean angle and protraction',
        'Cluster sets allow more total quality exposure',
      ],
    }
  }
  
  // Dynamic transition work (muscle-up, HSPU)
  if (type === 'dynamic_transition') {
    if (athleteLevel === 'advanced' || athleteLevel === 'elite') {
      return {
        skillType: type,
        athleteLevel,
        prescriptionStyle: 'quality_holds',
        holdSecondsRange: [1, 3], // For negatives/pauses
        setsRange: [3, 5],
        restSeconds: 150,
        intensityNotes: [
          'Control the transition - never rush',
          'Quality singles/doubles > sloppy volume',
        ],
      }
    }
    return {
      skillType: type,
      athleteLevel,
      prescriptionStyle: 'cluster_exposure',
      holdSecondsRange: [1, 3],
      setsRange: [4, 6],
      restSeconds: 90,
      intensityNotes: [
        'Build the transition pattern with assistance',
        'Focus on timing and coordination',
      ],
    }
  }
  
  // Compression work (L-sit, V-sit)
  if (type === 'compression') {
    return {
      skillType: type,
      athleteLevel,
      prescriptionStyle: athleteLevel === 'advanced' ? 'volume_accumulation' : 'cluster_exposure',
      holdSecondsRange: athleteLevel === 'advanced' ? [15, 30] : [8, 20],
      setsRange: [3, 5],
      restSeconds: 60,
      intensityNotes: [
        'Posterior pelvic tilt is the priority',
        'Compression strength transfers to all skills',
      ],
    }
  }
  
  // Balance work (handstand)
  return {
    skillType: 'balance',
    athleteLevel,
    prescriptionStyle: 'cluster_exposure',
    holdSecondsRange: athleteLevel === 'advanced' ? [20, 60] : [5, 20],
    setsRange: [5, 10],
    restSeconds: 30,
    intensityNotes: [
      'Many short holds build proprioception',
      'Quality of entry and exit matters',
    ],
  }
}

// =============================================================================
// WEIGHTED STRENGTH CARRYOVER LOGIC (TASK 3)
// =============================================================================

/**
 * Calculate weighted strength prescription for skill support.
 * TASK 3: Makes weighted dips/pulls serve skill development intentionally.
 */
export interface WeightedStrengthCarryover {
  exercise: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | 'weighted_row'
  primarySkillTarget: string
  carryoverRationale: string
  prescriptionAdjustments: {
    setsModifier: number
    repsRange: [number, number]
    restSeconds: number
    intensityTarget: number // RPE
  }
  shouldInclude: boolean
  alternativeIfSkipped?: string
}

/**
 * Determine weighted strength carryover prescription for a skill goal.
 */
export function getWeightedStrengthCarryover(
  primarySkill: string,
  currentWeightedPull?: { load: number; reps: number },
  currentWeightedDip?: { load: number; reps: number },
  prWeightedPull?: { load: number; reps: number },
  prWeightedDip?: { load: number; reps: number }
): WeightedStrengthCarryover[] {
  const carryovers: WeightedStrengthCarryover[] = []
  
  // Planche benefits from weighted dips
  if (primarySkill === 'planche') {
    const hasSignificantDipStrength = currentWeightedDip && currentWeightedDip.load >= 25
    const isNearPR = prWeightedDip && currentWeightedDip && 
      (currentWeightedDip.load / prWeightedDip.load) >= 0.85
    
    carryovers.push({
      exercise: 'weighted_dip',
      primarySkillTarget: 'planche',
      carryoverRationale: 'Weighted dips build the pressing foundation for planche lean and support. The strength transfers directly to straight-arm pushing capacity.',
      prescriptionAdjustments: {
        setsModifier: isNearPR ? 0 : 1, // Extra set if building toward PR
        repsRange: hasSignificantDipStrength ? [3, 6] : [5, 8],
        restSeconds: hasSignificantDipStrength ? 180 : 120,
        intensityTarget: isNearPR ? 7 : 8, // Maintenance vs building
      },
      shouldInclude: true,
    })
  }
  
  // Front lever benefits from weighted pulls
  if (primarySkill === 'front_lever') {
    const hasSignificantPullStrength = currentWeightedPull && currentWeightedPull.load >= 20
    const isNearPR = prWeightedPull && currentWeightedPull && 
      (currentWeightedPull.load / prWeightedPull.load) >= 0.85
    
    carryovers.push({
      exercise: 'weighted_pull_up',
      primarySkillTarget: 'front_lever',
      carryoverRationale: 'Weighted pull-ups develop the pulling base and scapular control needed for front lever. The lat and grip strength transfers to horizontal pulling.',
      prescriptionAdjustments: {
        setsModifier: isNearPR ? 0 : 1,
        repsRange: hasSignificantPullStrength ? [3, 5] : [5, 8],
        restSeconds: hasSignificantPullStrength ? 180 : 120,
        intensityTarget: isNearPR ? 7 : 8,
      },
      shouldInclude: true,
    })
  }
  
  // Muscle-up benefits from both
  if (primarySkill === 'muscle_up') {
    carryovers.push({
      exercise: 'weighted_pull_up',
      primarySkillTarget: 'muscle_up',
      carryoverRationale: 'High pulls with added weight build explosive pulling power for the muscle-up transition.',
      prescriptionAdjustments: {
        setsModifier: 0,
        repsRange: [3, 5],
        restSeconds: 150,
        intensityTarget: 8,
      },
      shouldInclude: true,
    })
    carryovers.push({
      exercise: 'weighted_dip',
      primarySkillTarget: 'muscle_up',
      carryoverRationale: 'Dip strength ensures clean lockout after the transition.',
      prescriptionAdjustments: {
        setsModifier: 0,
        repsRange: [5, 8],
        restSeconds: 120,
        intensityTarget: 7,
      },
      shouldInclude: true,
    })
  }
  
  return carryovers
}

// =============================================================================
// FUTURE FORMAT HOOKS (TASK 10)
// =============================================================================

/**
 * Session format types - prepares for future ultra-short modes.
 * Currently only 'standard' is fully implemented.
 */
export type SessionFormat = 
  | 'standard'        // Normal skill/strength session
  | 'circuit_short'   // 15-20 min circuit (future)
  | 'emom'            // Every-minute-on-the-minute (future)
  | 'density_block'   // Timed density work (future)

export interface FormatConfig {
  format: SessionFormat
  targetMinutes: number
  restStyle: 'full' | 'short' | 'none'
  exerciseCount: number
  roundBased: boolean
}

/**
 * Get format configuration for a session.
 * Defaults to standard format.
 */
export function getSessionFormatConfig(
  targetMinutes: number,
  preferredFormat?: SessionFormat
): FormatConfig {
  // Currently only standard format is implemented
  // This hook allows future expansion without engine rewrite
  
  if (preferredFormat === 'circuit_short' && targetMinutes <= 20) {
    // Future: Ultra-short circuit format
    return {
      format: 'circuit_short',
      targetMinutes,
      restStyle: 'short',
      exerciseCount: 4,
      roundBased: true,
    }
  }
  
  // Default to standard
  return {
    format: 'standard',
    targetMinutes,
    restStyle: targetMinutes >= 60 ? 'full' : 'short',
    exerciseCount: getDurationVolumeConfig(targetMinutes).mainExerciseCount.max,
    roundBased: false,
  }
}
