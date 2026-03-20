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
  // TASK 10: Enhanced diagnostics for prescription quality
  prescriptionModesUsed?: string[]
  weightedSupportDecisions?: Array<{
    skill: string
    includedWeighted: boolean
    suggestedLoad: string
  }>
  weeklyLoadBalance?: Array<{
    day: number
    stressProfile: string
    primaryStress: string
  }>
  topLimiterIntervention?: {
    limiter: string
    volumeModifier: number
    supportWorkPriority: string[]
  }
}

/**
 * Log engine diagnostics for debugging.
 * Only logs in development mode.
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
  // TASK 10: Log enhanced prescription and weekly load diagnostics
  if (diagnostics.prescriptionModesUsed && diagnostics.prescriptionModesUsed.length > 0) {
    console.log('[EngineDiagnostics] Prescription Modes:', [...new Set(diagnostics.prescriptionModesUsed)])
  }
  if (diagnostics.weightedSupportDecisions && diagnostics.weightedSupportDecisions.length > 0) {
    console.log('[EngineDiagnostics] Weighted Support Decisions:', diagnostics.weightedSupportDecisions)
  }
  if (diagnostics.weeklyLoadBalance && diagnostics.weeklyLoadBalance.length > 0) {
    console.log('[EngineDiagnostics] Weekly Load Balance:', diagnostics.weeklyLoadBalance)
  }
  if (diagnostics.topLimiterIntervention) {
    console.log('[EngineDiagnostics] Top Limiter Intervention:', diagnostics.topLimiterIntervention)
  }
  console.log('[EngineDiagnostics] ===== END SUMMARY =====')
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
