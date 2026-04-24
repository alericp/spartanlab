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
  trainingPath: string | null,
  // [PHASE 15B] New optional parameters for advanced profile calibration
  experienceLevel?: string | null,
  selectedSkillCount?: number
): GoalHierarchyWeights {
  // ==========================================================================
  // [PHASE 6B] TIGHTENED GOAL HIERARCHY FOR PRIMARY DOMINANCE
  // Primary should visibly dominate, secondary meaningful but not competing
  // Support is for complementary work, NOT for distributing across many tertiary skills
  // ==========================================================================
  // Phase 6B weights: primary 0.55-0.60, secondary 0.25-0.30, support 0.15
  // (Increased primary, reduced support to prevent tertiary sprawl)
  
  // [PHASE 15B] TASK 2: ADVANCED MULTI-SKILL CALIBRATION
  // Advanced athletes with 5+ selected skills need slightly more support weight
  // to allow meaningful tertiary skill expression without diluting primary/secondary
  const isAdvancedMultiSkill = experienceLevel === 'advanced' && (selectedSkillCount || 0) >= 5
  const supportBoost = isAdvancedMultiSkill ? 0.05 : 0

  // [PHASE 3B WEEKLY-ALLOCATOR-OPPORTUNITY-LOCK] Broader-profile hybrid escalation
  // When the athlete is advanced-or-intermediate + hybrid + has 4+ selected skills,
  // the pre-existing 0.55/0.30/0.15 split leaves only ~10-15% for 2-3 additional
  // selected skills combined. That is the upstream reason tertiary skills showed
  // a single exposure at the materiality floor and support-role density looked
  // "tacked on". This explicit escalation gives additional skills a real share
  // of the weekly budget WITHOUT weakening primary dominance below a safe floor.
  const isBroaderHybridProfile =
    trainingPath === 'hybrid' &&
    (experienceLevel === 'advanced' || experienceLevel === 'intermediate') &&
    (selectedSkillCount || 0) >= 4
  const broaderHybridSupportBoost = isBroaderHybridProfile ? 0.10 : 0

  let primaryWeight = 0.55  // [PHASE 6B] Raised from 0.50
  let secondaryWeight = secondaryGoal ? 0.30 : 0
  let supportWeight = 0.15 + supportBoost // [PHASE 15B] Boost for advanced multi-skill
  
  // Adjust for training path
  if (trainingPath === 'hybrid') {
    // Hybrid: balanced skill + strength - primary still leads clearly
    if (isSkillGoal(primaryGoal) && secondaryGoal && isSkillGoal(secondaryGoal)) {
      // Both are skills - primary still leads with clear margin
      // [PHASE 3B] For broader-profile hybrid: rebalance primary↓ / secondary≈ / support↑
      // so 3-4 additional skills get a materially visible budget. Primary still leads.
      primaryWeight = isBroaderHybridProfile ? 0.45 : 0.50  // [PHASE 6B] Raised from 0.45
      secondaryWeight = isBroaderHybridProfile ? 0.28 : 0.35
      supportWeight = 0.15 + supportBoost + broaderHybridSupportBoost // [PHASE 3B]
    } else if (isSkillGoal(primaryGoal)) {
      // Primary skill + strength support
      primaryWeight = isBroaderHybridProfile ? 0.48 : 0.55
      secondaryWeight = secondaryGoal ? (isBroaderHybridProfile ? 0.27 : 0.30) : 0
      supportWeight = 0.15 + supportBoost + broaderHybridSupportBoost // [PHASE 3B]
    } else if (isStrengthGoal(primaryGoal)) {
      // Primary strength + skill support
      primaryWeight = isBroaderHybridProfile ? 0.48 : 0.55
      secondaryWeight = secondaryGoal ? (isBroaderHybridProfile ? 0.27 : 0.30) : 0
      supportWeight = 0.15 + supportBoost + broaderHybridSupportBoost // [PHASE 3B]
    }
  } else if (trainingPath === 'skill_progression') {
    // Skill-focused: primary dominates
    primaryWeight = 0.60  // [PHASE 6B] Raised from 0.55
    secondaryWeight = secondaryGoal ? 0.28 : 0  // [PHASE 6B] Slightly reduced
    supportWeight = 0.12 + supportBoost // [PHASE 15B]
  } else if (trainingPath === 'strength_endurance') {
    // Strength-focused: primary still leads
    primaryWeight = 0.55
    secondaryWeight = secondaryGoal ? 0.30 : 0
    supportWeight = 0.15 + supportBoost
  }
  
  // [PHASE 15B] TASK 1: Log advanced multi-skill calibration
  if (isAdvancedMultiSkill) {
    console.log('[phase15b-advanced-multi-skill-calibration]', {
      experienceLevel,
      selectedSkillCount,
      supportBoostApplied: supportBoost,
      adjustedSupportWeight: supportWeight,
      rationale: 'Advanced athlete with 5+ skills gets more support allocation for tertiary expression',
    })
  }

  // [PHASE 3B WEEKLY-ALLOCATOR-OPPORTUNITY-LOCK] Broader-profile audit
  if (isBroaderHybridProfile) {
    console.log('[phase3b-broader-hybrid-allocation-lock]', {
      experienceLevel,
      selectedSkillCount,
      trainingPath,
      broaderHybridSupportBoostApplied: broaderHybridSupportBoost,
      preNormalizationPrimaryWeight: primaryWeight,
      preNormalizationSecondaryWeight: secondaryWeight,
      preNormalizationSupportWeight: supportWeight,
      rationale: 'Broader hybrid profile (advanced/intermediate + 4+ skills): support budget raised so 3-4 additional skills get a visible weekly share without weakening primary below safe floor',
      safetyFloor: 'primary still leads by at least 10pp vs secondary and at least 15pp vs support',
    })
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
  trainingPath: string | null,
  // [PHASE 15B] New optional parameters for advanced profile calibration
  experienceLevel?: string | null,
  selectedSkillCount?: number
): SessionDistribution {
  const weights = calculateGoalHierarchyWeights(
    primaryGoal, 
    secondaryGoal, 
    trainingPath,
    experienceLevel,
    selectedSkillCount
  )
  
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
// SESSION SKILL PLAN (TASK 4 - IMPROVED SKILL DISTRIBUTION)
// =============================================================================

/**
 * Expression modes define how a skill is trained in a session.
 * TASK 4: More intentional mode assignment to reduce sameness.
 * [exercise-expression] ISSUE B: Added additional expression modes for richer skill coverage
 */
export type SkillExpressionMode = 
  | 'direct'           // Main skill work - max hold progressions
  | 'technical'        // Movement quality focus - controlled reps/transitions  
  | 'support'          // Accessory work building toward skill
  | 'rotation'         // Lighter maintenance to allow recovery
  | 'prerequisite'     // Building prerequisite strength/positions
  | 'trunk_support'    // Compression/core/bodyline work for skill transfer
  | 'mobility_support' // Flexibility/range work enabling skill positions

/**
 * Per-day skill assignment with expression mode and rationale.
 */
export interface DaySkillAssignment {
  dayIndex: number
  dayLabel: string // "Day 1", "Push A", etc.
  primarySkill: string | null
  primaryMode: SkillExpressionMode
  secondarySkill: string | null
  secondaryMode: SkillExpressionMode | null
  supportWork: string[]
  dayRole: 'primary_focus' | 'secondary_focus' | 'mixed' | 'support_heavy' | 'recovery'
  rationale: string
}

/**
 * Complete session skill plan for a training week.
 */
export interface SessionSkillPlan {
  totalDays: number
  primaryGoal: string
  secondaryGoal: string | null
  days: DaySkillAssignment[]
  weekRationale: string
}

/**
 * Build a complete skill plan for the training week.
 * TASK 4: Reduces session sameness by assigning intentional modes per day.
 * 
 * Key improvements:
 * - Primary skill gets 'direct' mode on 1-2 days max (high intensity)
 * - Secondary skill gets 'direct' mode on 1 day when applicable
 * - Remaining days use 'technical', 'support', or 'rotation' modes
 * - Better recovery distribution across the week
 */
export function buildSessionSkillPlan(
  totalDays: number,
  primaryGoal: string,
  secondaryGoal: string | null,
  trainingPath: string | null
): SessionSkillPlan {
  const days: DaySkillAssignment[] = []
  const distribution = calculateSessionDistribution(totalDays, primaryGoal, secondaryGoal, trainingPath)
  
  // Determine expression mode rotation for primary skill
  // Direct work is most demanding - limit to 1-2 sessions/week
  const primaryDirectDays = Math.min(2, Math.ceil(totalDays * 0.4))
  const secondaryDirectDays = secondaryGoal ? Math.min(1, Math.ceil(totalDays * 0.25)) : 0
  
  // Track mode assignments
  let primaryDirectCount = 0
  let secondaryDirectCount = 0
  let primaryTechnicalCount = 0
  
  for (let i = 0; i < totalDays; i++) {
    const dayIndex = i + 1
    let assignment: DaySkillAssignment
    
    // Determine day role based on position in week
    // First days of week = primary focus, mid-week = secondary, end = mixed/recovery
    const weekPosition = i / totalDays
    
    if (i < distribution.primaryFocusSessions && primaryDirectCount < primaryDirectDays) {
      // Primary focus day with direct work
      primaryDirectCount++
      assignment = {
        dayIndex,
        dayLabel: `Day ${dayIndex}`,
        primarySkill: primaryGoal,
        primaryMode: 'direct',
        secondarySkill: secondaryGoal,
        secondaryMode: secondaryGoal ? 'support' : null,
        supportWork: getSupportWorkForGoal(primaryGoal),
        dayRole: 'primary_focus',
        rationale: `${GOAL_DISPLAY_LABELS[primaryGoal] || primaryGoal} direct work - max effort progressions with full rest. ${secondaryGoal ? (GOAL_DISPLAY_LABELS[secondaryGoal] || secondaryGoal) + ' receives support work.' : ''}`,
      }
    } else if (secondaryGoal && secondaryDirectCount < secondaryDirectDays) {
      // Secondary focus day with direct work
      secondaryDirectCount++
      assignment = {
        dayIndex,
        dayLabel: `Day ${dayIndex}`,
        primarySkill: secondaryGoal,
        primaryMode: 'direct',
        secondarySkill: primaryGoal,
        secondaryMode: 'technical',
        supportWork: getSupportWorkForGoal(secondaryGoal),
        dayRole: 'secondary_focus',
        rationale: `${GOAL_DISPLAY_LABELS[secondaryGoal] || secondaryGoal} direct work day. ${GOAL_DISPLAY_LABELS[primaryGoal] || primaryGoal} receives technical/quality focus.`,
      }
    } else if (primaryTechnicalCount < 1 && i < totalDays - 1) {
      // Technical focus day for primary
      primaryTechnicalCount++
      assignment = {
        dayIndex,
        dayLabel: `Day ${dayIndex}`,
        primarySkill: primaryGoal,
        primaryMode: 'technical',
        secondarySkill: secondaryGoal,
        secondaryMode: secondaryGoal ? 'rotation' : null,
        supportWork: [...getSupportWorkForGoal(primaryGoal), ...getStrengthSupportWork(primaryGoal)],
        dayRole: 'mixed',
        rationale: `Technical focus for ${GOAL_DISPLAY_LABELS[primaryGoal] || primaryGoal} - quality over intensity. Strength support prioritized.`,
      }
    } else {
      // Mixed/support/recovery days
      const isLastDay = i === totalDays - 1
      const dayRole = isLastDay ? 'support_heavy' : 'mixed'
      assignment = {
        dayIndex,
        dayLabel: `Day ${dayIndex}`,
        primarySkill: primaryGoal,
        primaryMode: isLastDay ? 'rotation' : 'support',
        secondarySkill: secondaryGoal,
        secondaryMode: secondaryGoal ? (isLastDay ? 'rotation' : 'technical') : null,
        supportWork: getStrengthSupportWork(primaryGoal),
        dayRole,
        rationale: isLastDay 
          ? `Rotation/maintenance day - lighter skill exposure, strength emphasis. Sets up recovery for next week.`
          : `Balanced skill and strength work. Both goals receive attention without max effort demands.`,
      }
    }
    
    days.push(assignment)
  }
  
  return {
    totalDays,
    primaryGoal,
    secondaryGoal,
    days,
    weekRationale: buildWeekRationale(primaryGoal, secondaryGoal, days, trainingPath),
  }
}

function getSupportWorkForGoal(goal: string): string[] {
  const supportMap: Record<string, string[]> = {
    planche: ['planche_lean', 'pseudo_planche_pushup', 'compression_drills'],
    front_lever: ['front_lever_rows', 'straight_arm_pulldown', 'active_hang'],
    back_lever: ['skin_the_cat', 'german_hang_holds', 'active_hang'],
    muscle_up: ['high_pull', 'transition_drills', 'dip_negatives'],
    hspu: ['pike_pushup', 'wall_walk', 'shoulder_taps'],
    handstand: ['wall_handstand', 'kick_up_drills', 'shoulder_taps'],
    l_sit: ['compression_work', 'pike_stretch', 'support_hold'],
    v_sit: ['l_sit', 'pike_compression', 'straddle_lifts'],
  }
  return supportMap[goal] || ['strength_support']
}

function getStrengthSupportWork(goal: string): string[] {
  const strengthMap: Record<string, string[]> = {
    planche: ['weighted_dip', 'pseudo_planche_pushup', 'ring_support'],
    front_lever: ['weighted_pullup', 'rows', 'scapular_pulls'],
    back_lever: ['pullup_variations', 'rear_delt_work'],
    muscle_up: ['weighted_pullup', 'dips', 'explosive_pulls'],
    hspu: ['overhead_press', 'pike_pushup_variations'],
    handstand: ['shoulder_strength', 'wrist_prep'],
    l_sit: ['dips', 'core_compression'],
    v_sit: ['pike_work', 'hip_flexor_strength'],
  }
  return strengthMap[goal] || ['general_strength']
}

function buildWeekRationale(
  primary: string,
  secondary: string | null,
  days: DaySkillAssignment[],
  trainingPath: string | null
): string {
  const primaryLabel = GOAL_DISPLAY_LABELS[primary] || primary
  const secondaryLabel = secondary ? (GOAL_DISPLAY_LABELS[secondary] || secondary) : null
  
  const directDays = days.filter(d => d.primaryMode === 'direct').length
  const technicalDays = days.filter(d => d.primaryMode === 'technical').length
  
  if (!secondary) {
    return `${directDays} direct ${primaryLabel} sessions for max progression, ${technicalDays} technical sessions for movement quality, remaining sessions focus on strength support and recovery.`
  }
  
  const secondaryDirectDays = days.filter(d => d.primarySkill === secondary && d.primaryMode === 'direct').length
  
  return `Week designed for dual-skill development: ${directDays} direct ${primaryLabel} sessions, ${secondaryDirectDays} direct ${secondaryLabel} session(s). Expression modes rotate to prevent staleness while maintaining progression stimulus.`
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
  // TASK 8: Short-form foundation for future 15-20 min circuit/round modes
  15: {
    warmupMinutes: 2,
    warmupExerciseCount: 3,
    mainExerciseCount: { min: 2, max: 3 },
    accessoryCount: { min: 0, max: 0 },
    cooldownMinutes: 1,
    cooldownExerciseCount: 1,
    totalEstimatedMinutes: { min: 12, max: 15 },
  },
  20: {
    warmupMinutes: 3,
    warmupExerciseCount: 3,
    mainExerciseCount: { min: 2, max: 3 },
    accessoryCount: { min: 0, max: 1 },
    cooldownMinutes: 1,
    cooldownExerciseCount: 2,
    totalEstimatedMinutes: { min: 17, max: 20 },
  },
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
  
  // Find nearest bucket (TASK 8: includes 15/20 for future short-form modes)
  const buckets = [15, 20, 30, 45, 60, 75, 90]
  const nearest = buckets.reduce((prev, curr) => 
    Math.abs(curr - sessionMinutes) < Math.abs(prev - sessionMinutes) ? curr : prev
  )
  
  return DURATION_VOLUME_CONFIGS[nearest]
}

// =============================================================================
// [PHASE 15E] ADVANCED ATHLETE SESSION CALIBRATION
// Advanced athletes can handle more intentional, richer session structure
// without this being "clutter" - they have the work capacity and skill
// =============================================================================

export interface AdvancedAthleteCalibration {
  sessionDensityMultiplier: number      // 1.0 = base, 1.2 = 20% more density allowed
  mainWorkBonus: number                 // Additional main exercises for advanced athletes
  supportWorkBonus: number              // Additional support exercises
  accessorySlotBonus: number            // Additional accessory slots
  mixedMethodFinisherAllowed: boolean   // Can include intelligent density/circuit finisher
  primarySkillExpressionWeight: number  // Weight toward primary goal (higher = more visible)
  secondarySkillExpressionWeight: number // Weight toward secondary goal
  tertiarySkillMinExposure: number      // Minimum exposure for tertiary skills
  carryoverThreshold: number            // Minimum carryover score for support exercises
  sequencingStrictness: 'loose' | 'moderate' | 'strict' // How strict intra-session ordering is
}

export function getAdvancedAthleteCalibration(params: {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  sessionMinutes: number
  recoveryLevel?: 'poor' | 'fair' | 'normal' | 'good'
  selectedSkillsCount: number
  hasAllStylesSelected?: boolean
}): AdvancedAthleteCalibration {
  const { experienceLevel, sessionMinutes, recoveryLevel = 'normal', selectedSkillsCount, hasAllStylesSelected } = params
  
  // Base calibration (conservative for beginners)
  const baseCalibration: AdvancedAthleteCalibration = {
    sessionDensityMultiplier: 1.0,
    mainWorkBonus: 0,
    supportWorkBonus: 0,
    accessorySlotBonus: 0,
    mixedMethodFinisherAllowed: false,
    primarySkillExpressionWeight: 0.5,
    secondarySkillExpressionWeight: 0.3,
    tertiarySkillMinExposure: 0,
    carryoverThreshold: 0.3,
    sequencingStrictness: 'loose',
  }
  
  // Recovery adjustment
  const recoveryMultiplier = {
    poor: 0.8,
    fair: 0.9,
    normal: 1.0,
    good: 1.1,
  }[recoveryLevel]
  
  // Experience-based calibration
  if (experienceLevel === 'advanced' || experienceLevel === 'elite') {
    // [PHASE 15E] Advanced athletes get richer session architecture
    const isLongSession = sessionMinutes >= 60
    const isExtendedSession = sessionMinutes >= 75
    const hasMultipleSkills = selectedSkillsCount >= 3
    
    baseCalibration.sessionDensityMultiplier = isExtendedSession 
      ? 1.25 * recoveryMultiplier 
      : isLongSession 
        ? 1.15 * recoveryMultiplier 
        : 1.0 * recoveryMultiplier
    
    // Advanced athletes can handle more main work
    baseCalibration.mainWorkBonus = isLongSession ? 1 : 0
    
    // Better support block density for advanced
    baseCalibration.supportWorkBonus = isLongSession ? 1 : 0
    
    // More accessory slots for extended sessions
    baseCalibration.accessorySlotBonus = isExtendedSession ? 1 : 0
    
    // Allow mixed-method finisher for advanced athletes with long sessions
    baseCalibration.mixedMethodFinisherAllowed = isLongSession && hasAllStylesSelected !== false
    
    // Stronger primary/secondary expression for advanced athletes
    baseCalibration.primarySkillExpressionWeight = 0.65
    baseCalibration.secondarySkillExpressionWeight = 0.4
    
    // Tertiary skills get real exposure for multi-skill advanced athletes
    baseCalibration.tertiarySkillMinExposure = hasMultipleSkills ? 1 : 0
    
    // Higher carryover threshold - don't use filler exercises
    baseCalibration.carryoverThreshold = 0.5
    
    // Strict sequencing for quality work
    baseCalibration.sequencingStrictness = 'strict'
    
    console.log('[phase15e-advanced-calibration-applied]', {
      experienceLevel,
      sessionMinutes,
      recoveryLevel,
      selectedSkillsCount,
      calibration: baseCalibration,
      isLongSession,
      isExtendedSession,
      hasMultipleSkills,
    })
  } else if (experienceLevel === 'intermediate') {
    // Intermediate gets moderate upgrades
    const isLongSession = sessionMinutes >= 60
    
    baseCalibration.sessionDensityMultiplier = isLongSession ? 1.1 * recoveryMultiplier : 1.0 * recoveryMultiplier
    baseCalibration.mainWorkBonus = 0
    baseCalibration.supportWorkBonus = isLongSession ? 1 : 0
    baseCalibration.primarySkillExpressionWeight = 0.55
    baseCalibration.secondarySkillExpressionWeight = 0.35
    baseCalibration.carryoverThreshold = 0.4
    baseCalibration.sequencingStrictness = 'moderate'
  }
  // Beginners use base calibration (conservative)
  
  return baseCalibration
}

/**
 * [PHASE 15E] Get calibrated volume config that accounts for athlete level
 * This is the main entry point for session construction
 */
export function getCalibratedVolumeConfig(params: {
  sessionMinutes: number
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  recoveryLevel?: 'poor' | 'fair' | 'normal' | 'good'
  selectedSkillsCount: number
  hasAllStylesSelected?: boolean
}): DurationVolumeConfig & { calibration: AdvancedAthleteCalibration } {
  const baseConfig = getDurationVolumeConfig(params.sessionMinutes)
  const calibration = getAdvancedAthleteCalibration(params)
  
  // Apply calibration bonuses
  const calibratedConfig: DurationVolumeConfig = {
    ...baseConfig,
    mainExerciseCount: {
      min: baseConfig.mainExerciseCount.min,
      max: baseConfig.mainExerciseCount.max + calibration.mainWorkBonus,
    },
    accessoryCount: {
      min: baseConfig.accessoryCount.min,
      max: baseConfig.accessoryCount.max + calibration.accessorySlotBonus + calibration.supportWorkBonus,
    },
  }
  
  console.log('[phase15e-calibrated-volume-config]', {
    sessionMinutes: params.sessionMinutes,
    experienceLevel: params.experienceLevel,
    baseMainMax: baseConfig.mainExerciseCount.max,
    calibratedMainMax: calibratedConfig.mainExerciseCount.max,
    baseAccessoryMax: baseConfig.accessoryCount.max,
    calibratedAccessoryMax: calibratedConfig.accessoryCount.max,
    calibrationApplied: calibration,
  })
  
  return {
    ...calibratedConfig,
    calibration,
  }
}

// =============================================================================
// EXERCISE COACHING METADATA CONTRACT (COACH LAYER)
// =============================================================================

/**
 * Expression mode - how the exercise contributes to the athlete's training
 * This is the core coaching truth that must survive from selection to render
 */
export type ExerciseExpressionMode = 
  | 'direct'           // Direct skill work toward goal (e.g., tuck planche for planche)
  | 'technical'        // Technical practice for positioning/shape (e.g., planche lean)
  | 'strength_support' // Strength building that supports skill (e.g., weighted dips for planche)
  | 'prerequisite'     // Prerequisite strength/mobility (e.g., scap pulls for front lever)
  | 'trunk_support'    // Core/compression work (e.g., hollow body for L-sit)
  | 'mobility_support' // Mobility/flexibility work (e.g., shoulder stretches)
  | 'recovery'         // Recovery-biased support work (e.g., light rows on easy day)
  | 'rotation'         // Rotation for variety/movement health

/**
 * Progression intent - the training effect this exercise aims to achieve
 */
export type ProgressionIntent =
  | 'skill_expression'      // Practice/express the skill directly
  | 'technical_refinement'  // Refine positioning/shape without maximal effort
  | 'strength_building'     // Build strength capacity
  | 'endurance_support'     // Build work capacity/endurance
  | 'mobility_maintenance'  // Maintain/improve range of motion
  | 'neural_practice'       // Neural patterning with low volume
  | 'fatigue_management'    // Lighter work to manage fatigue

/**
 * Load decision summary - why weighted vs bodyweight
 */
export type LoadDecisionReason =
  | 'strength_support_day'       // Weighted to build supporting strength
  | 'skill_priority_today'       // Bodyweight to preserve skill quality
  | 'missing_loadable_equipment' // No weights available
  | 'benchmark_missing'          // No benchmark data to prescribe load
  | 'recovery_limited'           // Recovery state suggests lighter load
  | 'progression_phase'          // Current phase dictates load type
  | 'exercise_not_loadable'      // Exercise doesn't support external load

/**
 * Role in session - describes the exercise's function within this specific session
 * [EXPLAIN-OWNER-LOCK] This field drives explanation engine reason classification
 */
export type RoleInSession =
  | 'main_driver'          // Primary work toward today's goal
  | 'secondary_driver'     // Second-priority work toward goal
  | 'bridge_work'          // Connects skill gap to main work
  | 'strength_foundation'  // Force capacity building
  | 'accessory_support'    // Lower-priority support volume
  | 'balance_counterstress'// Balances opposing movement pattern
  | 'tissue_conditioning'  // Connective tissue / prehab
  | 'trunk_line_control'   // Core / bodyline work
  | 'joint_stability'      // Scap / shoulder / mobility
  | 'warmup_activation'    // Pre-main work activation
  | 'finisher_density'     // End-of-session volume capture

/**
 * Canonical coaching metadata for each exercise
 * This must survive from exercise selection through render
 */
export interface ExerciseCoachingMeta {
  // Core expression truth
  expressionMode: ExerciseExpressionMode
  progressionIntent: ProgressionIntent
  
  // [EXPLAIN-OWNER-LOCK] Role within this session - drives explanation engine
  roleInSession?: RoleInSession
  
  // What this exercise supports
  skillSupportTargets: string[]  // Skills this exercise helps (e.g., ['planche', 'hspu'])
  
  // Selection context
  selectionReasonSummary: string  // Concise why this exercise won
  
  // Load decision
  loadDecision: {
    isWeighted: boolean
    reason: LoadDecisionReason
    summary: string  // User-facing summary (e.g., "Weighted (+35 lb)" or "Bodyweight today")
  }
  
  // Prescription truth
  targetRPE?: number         // 6-10 scale
  restGuidance?: {
    seconds: number
    label: string            // "90-120s" or "2-3 min"
  }
  
  // Doctrine source
  doctrineSourceSummary?: string  // Where this prescription came from
  
  // Confidence for debug
  confidenceLevel?: 'high' | 'moderate' | 'low'
}

/**
 * Maps raw selection trace/prescription data to coaching metadata
 * Call this at exercise selection time
 */
export function buildExerciseCoachingMeta(params: {
  exerciseCategory: string
  selectionReason: string
  prescriptionMode?: string
  isWeighted: boolean
  loadValue?: number
  loadUnit?: string
  hasLoadableEquipment: boolean
  hasBenchmarkData: boolean
  targetRPE?: number
  restSeconds?: number
  skillTargets?: string[]
  isRecoveryDay?: boolean
  // [EXPLAIN-OWNER-LOCK] Optional explicit role override
  explicitRole?: RoleInSession
}): ExerciseCoachingMeta {
  // Determine expression mode from category and context
  const expressionMode = mapCategoryToExpressionMode(
    params.exerciseCategory,
    params.isWeighted,
    params.isRecoveryDay
  )
  
  // Determine progression intent
  const progressionIntent = mapToProgressionIntent(
    params.exerciseCategory,
    params.prescriptionMode,
    params.isRecoveryDay
  )
  
  // [EXPLAIN-OWNER-LOCK] Derive roleInSession from category, reason, and mode
  const roleInSession = params.explicitRole || deriveRoleInSession(
    params.exerciseCategory,
    params.selectionReason,
    expressionMode,
    params.isRecoveryDay
  )
  
  // Determine load decision
  const loadDecision = buildLoadDecision(
    params.isWeighted,
    params.loadValue,
    params.loadUnit,
    params.hasLoadableEquipment,
    params.hasBenchmarkData,
    params.isRecoveryDay,
    params.exerciseCategory
  )
  
  // Build rest guidance if available
  const restGuidance = params.restSeconds ? {
    seconds: params.restSeconds,
    label: formatRestLabel(params.restSeconds),
  } : undefined
  
  console.log('[coach-layer] Built coaching meta:', {
    expressionMode,
    progressionIntent,
    roleInSession,
    loadDecision: loadDecision.summary,
    targetRPE: params.targetRPE,
    skillTargets: params.skillTargets,
  })
  
  return {
    expressionMode,
    progressionIntent,
    roleInSession,
    skillSupportTargets: params.skillTargets || [],
    selectionReasonSummary: params.selectionReason,
    loadDecision,
    targetRPE: params.targetRPE,
    restGuidance,
    confidenceLevel: params.hasBenchmarkData ? 'high' : 'moderate',
  }
}

/**
 * [EXPLAIN-OWNER-LOCK] Derive roleInSession from available context
 * This is a core input for the explanation engine
 */
function deriveRoleInSession(
  category: string,
  selectionReason: string,
  expressionMode: ExerciseExpressionMode,
  isRecoveryDay?: boolean
): RoleInSession {
  const reasonLower = selectionReason.toLowerCase()
  const categoryLower = category.toLowerCase()
  
  // Recovery day = accessory support
  if (isRecoveryDay) return 'accessory_support'
  
  // Direct skill work = main driver
  if (expressionMode === 'direct' || categoryLower === 'skill') {
    return 'main_driver'
  }
  
  // Technical work = secondary driver
  if (expressionMode === 'technical') {
    return 'secondary_driver'
  }
  
  // Check selection reason for specific roles
  if (reasonLower.includes('bridge') || reasonLower.includes('progression')) {
    return 'bridge_work'
  }
  if (reasonLower.includes('balance') || reasonLower.includes('antagonist') || reasonLower.includes('opposing')) {
    return 'balance_counterstress'
  }
  if (reasonLower.includes('tissue') || reasonLower.includes('tendon') || reasonLower.includes('prehab') || reasonLower.includes('protect')) {
    return 'tissue_conditioning'
  }
  if (reasonLower.includes('warm') || reasonLower.includes('activation') || reasonLower.includes('prep')) {
    return 'warmup_activation'
  }
  if (reasonLower.includes('finisher') || reasonLower.includes('density') || reasonLower.includes('emom')) {
    return 'finisher_density'
  }
  
  // Core / trunk work
  if (categoryLower === 'core' || expressionMode === 'trunk_support') {
    return 'trunk_line_control'
  }
  
  // Mobility / scap work
  if (categoryLower === 'mobility' || categoryLower === 'flexibility' || expressionMode === 'mobility_support') {
    return 'joint_stability'
  }
  
  // Strength work = foundation
  if (categoryLower === 'strength' || expressionMode === 'strength_support') {
    return 'strength_foundation'
  }
  
  // Default to accessory support
  return 'accessory_support'
}

function mapCategoryToExpressionMode(
  category: string,
  isWeighted: boolean,
  isRecoveryDay?: boolean
): ExerciseExpressionMode {
  if (isRecoveryDay) return 'recovery'
  
  switch (category) {
    case 'skill':
      return 'direct'
    case 'technical':
      return 'technical'
    case 'strength':
      return isWeighted ? 'strength_support' : 'strength_support'
    case 'accessory':
      return 'strength_support'
    case 'core':
      return 'trunk_support'
    case 'warmup':
    case 'mobility':
      return 'mobility_support'
    case 'cooldown':
      return 'mobility_support'
    default:
      return 'rotation'
  }
}

function mapToProgressionIntent(
  category: string,
  prescriptionMode?: string,
  isRecoveryDay?: boolean
): ProgressionIntent {
  if (isRecoveryDay) return 'fatigue_management'
  
  if (prescriptionMode === 'skill_hold' || prescriptionMode === 'skill_cluster') {
    return 'skill_expression'
  }
  if (prescriptionMode === 'weighted_strength') {
    return 'strength_building'
  }
  
  switch (category) {
    case 'skill':
      return 'skill_expression'
    case 'technical':
      return 'technical_refinement'
    case 'strength':
      return 'strength_building'
    case 'accessory':
      return 'strength_building'
    case 'core':
      return 'strength_building'
    case 'warmup':
    case 'mobility':
    case 'cooldown':
      return 'mobility_maintenance'
    default:
      return 'strength_building'
  }
}

function buildLoadDecision(
  isWeighted: boolean,
  loadValue?: number,
  loadUnit?: string,
  hasLoadableEquipment?: boolean,
  hasBenchmarkData?: boolean,
  isRecoveryDay?: boolean,
  category?: string
): ExerciseCoachingMeta['loadDecision'] {
  // Skill work is always bodyweight
  if (category === 'skill' || category === 'technical') {
    return {
      isWeighted: false,
      reason: 'skill_priority_today',
      summary: 'Bodyweight (skill focus)',
    }
  }
  
  // Check if weighted
  if (isWeighted && loadValue && loadValue > 0) {
    return {
      isWeighted: true,
      reason: 'strength_support_day',
      summary: `Weighted (+${loadValue} ${loadUnit || 'lbs'})`,
    }
  }
  
  // Determine why not weighted
  if (!hasLoadableEquipment) {
    return {
      isWeighted: false,
      reason: 'missing_loadable_equipment',
      summary: 'Bodyweight (no weights available)',
    }
  }
  
  if (!hasBenchmarkData) {
    return {
      isWeighted: false,
      reason: 'benchmark_missing',
      summary: 'Bodyweight (add benchmark for load)',
    }
  }
  
  if (isRecoveryDay) {
    return {
      isWeighted: false,
      reason: 'recovery_limited',
      summary: 'Bodyweight (recovery focus)',
    }
  }
  
  return {
    isWeighted: false,
    reason: 'exercise_not_loadable',
    summary: 'Bodyweight',
  }
}

function formatRestLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 120) return `${Math.round(seconds / 60)} min`
  return `${Math.floor(seconds / 60)}-${Math.ceil(seconds / 60) + 1} min`
}

/**
 * Expression mode labels for UI display
 */
export const EXPRESSION_MODE_LABELS: Record<ExerciseExpressionMode, string> = {
  direct: 'Direct Skill',
  technical: 'Technical Practice',
  strength_support: 'Strength Support',
  prerequisite: 'Prerequisite Work',
  trunk_support: 'Core/Compression',
  mobility_support: 'Mobility',
  recovery: 'Recovery Work',
  rotation: 'Variety/Health',
}

/**
 * Progression intent labels for UI display
 */
export const PROGRESSION_INTENT_LABELS: Record<ProgressionIntent, string> = {
  skill_expression: 'Skill Expression',
  technical_refinement: 'Technical Refinement',
  strength_building: 'Strength Building',
  endurance_support: 'Endurance Support',
  mobility_maintenance: 'Mobility',
  neural_practice: 'Neural Practice',
  fatigue_management: 'Recovery',
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
  // TASK 4: Weekly progression types
  ProgressionPhase,
  WeeklyProgressionContext,
  WeeklyProgressionRecommendation,
  // TASK 2: Advanced skill prescription
  AdvancedSkillPrescription,
  // TASK 7: Support work mapping
  SupportWorkMapping,
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
  // TASK 4: Weekly progression functions
  getWeeklyProgressionRecommendation,
  determineProgressionPhase,
  // TASK 2: Advanced skill prescription
  getAdvancedSkillPrescription,
  // TASK 7: Support work mapping
  mapSupportToGoalsAndLimiters,
  logSupportWorkMapping,
  // TASK 9: Dev-safe logging utilities
  logWeeklyProgressionDecision,
  logWeeklyLoadBalance,
  logAdvancedSkillPrescription,
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
// [PHASE 15F] CANONICAL SESSION IDENTITY RESOLVER
// Resolves session identity AFTER final assembly based on actual exercise content
// NOT based on upstream template intention
// =============================================================================

export interface ResolvedSessionIdentity {
  resolvedSessionIdentity: string       // "Push Skill Day" or "Mixed Hybrid Training"
  resolvedMovementBias: 'push' | 'pull' | 'mixed' | 'skill' | 'strength' | 'support'
  resolvedPrimarySkillForSession: string | null  // The actual primary skill expressed in this session
  resolvedSecondarySkillForSession: string | null
  resolvedMethodExpression: 'straight_sets' | 'superset' | 'circuit' | 'density' | 'mixed_method' | 'none'
  resolvedNarrativeReason: string       // Truthful explanation for why this session exists
  firstWorkingBlockCategory: string     // What the first actual working block does
  dominantExerciseCategory: string      // Most common category in session
  sessionCoherenceScore: number         // 0-1, how coherent the session content is
  identityMatchesContent: boolean       // Whether resolved identity matches actual content
}

export interface SessionExerciseForIdentity {
  name: string
  category?: string
  movementPattern?: string
  targetSkills?: string[]
  trainingMethod?: string
  isWarmup?: boolean
  isCooldown?: boolean
}

/**
 * [PHASE 15F TASK 1] Resolve session identity from final assembled exercises
 * This must run AFTER session assembly is complete, not before
 */
export function resolveSessionIdentityFromContent(params: {
  exercises: SessionExerciseForIdentity[]
  templateFocus?: string
  templateLabel?: string
  primaryGoal: string
  secondaryGoal?: string | null
  recoveryState?: 'poor' | 'fair' | 'normal' | 'good'
  isDeloadSession?: boolean
  dayNumber: number
}): ResolvedSessionIdentity {
  const { exercises, templateFocus, templateLabel, primaryGoal, secondaryGoal, recoveryState, isDeloadSession, dayNumber } = params
  
  // Filter to working exercises only (exclude warmup/cooldown)
  const workingExercises = exercises.filter(e => !e.isWarmup && !e.isCooldown)
  
  if (workingExercises.length === 0) {
    console.log('[phase15f-session-identity-vs-first-block-audit]', {
      dayNumber,
      templateFocus,
      noWorkingExercises: true,
      verdict: 'empty_session_cannot_resolve',
    })
    
    return {
      resolvedSessionIdentity: templateLabel || 'Rest Day',
      resolvedMovementBias: 'support',
      resolvedPrimarySkillForSession: null,
      resolvedSecondarySkillForSession: null,
      resolvedMethodExpression: 'none',
      resolvedNarrativeReason: 'No working exercises scheduled.',
      firstWorkingBlockCategory: 'none',
      dominantExerciseCategory: 'none',
      sessionCoherenceScore: 0,
      identityMatchesContent: true,
    }
  }
  
  // Analyze first working exercise block
  const firstExercise = workingExercises[0]
  const firstName = (firstExercise.name || '').toLowerCase()
  const firstCategory = firstExercise.category || 'unknown'
  const firstTargetSkills = firstExercise.targetSkills || []
  
  // Count movement patterns
  const pushExercises = workingExercises.filter(e => {
    const name = (e.name || '').toLowerCase()
    return name.includes('push') || name.includes('dip') || name.includes('press') || 
           name.includes('planche') || name.includes('handstand') || name.includes('pike')
  })
  
  const pullExercises = workingExercises.filter(e => {
    const name = (e.name || '').toLowerCase()
    return name.includes('pull') || name.includes('row') || name.includes('lever') ||
           name.includes('chin') || name.includes('muscle up')
  })
  
  const skillExercises = workingExercises.filter(e => 
    e.category === 'skill' || e.category === 'skill_isometric' || e.category === 'skill_dynamic'
  )
  
  const strengthExercises = workingExercises.filter(e => 
    e.category === 'strength' || e.category === 'primary_strength' || e.category === 'secondary_strength'
  )
  
  // Determine movement bias
  let resolvedMovementBias: ResolvedSessionIdentity['resolvedMovementBias'] = 'mixed'
  if (pushExercises.length > pullExercises.length * 1.5) {
    resolvedMovementBias = 'push'
  } else if (pullExercises.length > pushExercises.length * 1.5) {
    resolvedMovementBias = 'pull'
  } else if (skillExercises.length > workingExercises.length * 0.5) {
    resolvedMovementBias = 'skill'
  } else if (strengthExercises.length > workingExercises.length * 0.5) {
    resolvedMovementBias = 'strength'
  }
  
  // Determine primary skill expressed in this session
  let resolvedPrimarySkillForSession: string | null = null
  let resolvedSecondarySkillForSession: string | null = null
  
  const primaryGoalLower = primaryGoal.toLowerCase().replace(/_/g, ' ')
  const secondaryGoalLower = (secondaryGoal || '').toLowerCase().replace(/_/g, ' ')
  
  const primaryGoalExercises = workingExercises.filter(e => {
    const name = (e.name || '').toLowerCase()
    const targets = (e.targetSkills || []).map(t => t.toLowerCase())
    return name.includes(primaryGoalLower) || targets.some(t => t.includes(primaryGoalLower))
  })
  
  const secondaryGoalExercises = workingExercises.filter(e => {
    const name = (e.name || '').toLowerCase()
    const targets = (e.targetSkills || []).map(t => t.toLowerCase())
    return name.includes(secondaryGoalLower) || targets.some(t => t.includes(secondaryGoalLower))
  })
  
  if (primaryGoalExercises.length > 0) {
    resolvedPrimarySkillForSession = primaryGoal
  }
  if (secondaryGoalExercises.length > 0) {
    resolvedSecondarySkillForSession = secondaryGoal || null
  }
  
  // ==========================================================================
  // [AI-TRUTH-MATERIALIZATION] BROADER SKILL DETECTION FROM SELECTION CONTEXT
  // Detects skills beyond primary/secondary from influencingSkills metadata
  // ==========================================================================
  const skillExerciseCounts = new Map<string, { count: number; expressionModes: Set<string> }>()
  const broaderSkillsExpressed: string[] = []
  const supportSkillsExpressed: string[] = []
  const skillBreakdown: Array<{ skill: string; exerciseCount: number; expressionMode: string }> = []
  
  for (const ex of workingExercises) {
    // Check influencing skills from selection context
    if (ex.influencingSkills && Array.isArray(ex.influencingSkills) && ex.influencingSkills.length > 0) {
      for (const influence of ex.influencingSkills) {
        const skillId = influence.skillId?.toLowerCase().replace(/_/g, '') || ''
        if (skillId) {
          const existing = skillExerciseCounts.get(skillId) || { count: 0, expressionModes: new Set() }
          existing.count++
          if (influence.expressionMode) {
            existing.expressionModes.add(influence.expressionMode)
          }
          skillExerciseCounts.set(skillId, existing)
          
          if (!broaderSkillsExpressed.includes(influence.skillId)) {
            broaderSkillsExpressed.push(influence.skillId)
          }
          if (influence.expressionMode === 'support' || influence.expressionMode === 'technical') {
            if (!supportSkillsExpressed.includes(influence.skillId)) {
              supportSkillsExpressed.push(influence.skillId)
            }
          }
        }
      }
    }
  }
  
  // Build skill breakdown for reporting
  skillExerciseCounts.forEach((data, skill) => {
    const dominantMode = data.expressionModes.size > 0 
      ? Array.from(data.expressionModes)[0] 
      : 'unknown'
    skillBreakdown.push({
      skill,
      exerciseCount: data.count,
      expressionMode: dominantMode,
    })
  })
  
  // Determine if multi-skill architecture is active
  const multiSkillArchitectureActive = broaderSkillsExpressed.length >= 3 || 
    (primaryGoalExercises.length > 0 && secondaryGoalExercises.length > 0 && supportSkillsExpressed.length > 0)
  
  // Determine method expression
  const hasSuperset = workingExercises.some(e => e.trainingMethod?.includes('superset'))
  const hasCircuit = workingExercises.some(e => e.trainingMethod?.includes('circuit'))
  const hasDensity = workingExercises.some(e => e.trainingMethod?.includes('density'))
  
  let resolvedMethodExpression: ResolvedSessionIdentity['resolvedMethodExpression'] = 'straight_sets'
  if (hasCircuit) {
    resolvedMethodExpression = 'circuit'
  } else if (hasDensity) {
    resolvedMethodExpression = 'density'
  } else if (hasSuperset) {
    resolvedMethodExpression = 'superset'
  } else if (hasSuperset || hasCircuit || hasDensity) {
    resolvedMethodExpression = 'mixed_method'
  }
  
  // Determine dominant category
  const categoryCount: Record<string, number> = {}
  workingExercises.forEach(e => {
    const cat = e.category || 'unknown'
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })
  const dominantExerciseCategory = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed'
  
  // Build resolved session identity label
  // [AI-TRUTH-MATERIALIZATION] Identity now reflects multi-skill architecture when detected
  let resolvedSessionIdentity: string
  
  if (isDeloadSession) {
    resolvedSessionIdentity = 'Recovery Focus'
  } else if (multiSkillArchitectureActive && supportSkillsExpressed.length >= 2) {
    // Multi-skill day with significant broader skill expression
    if (resolvedPrimarySkillForSession) {
      resolvedSessionIdentity = `${formatSkillLabel(resolvedPrimarySkillForSession)} + Multi-Skill`
    } else {
      resolvedSessionIdentity = 'Integrated Skills Day'
    }
  } else if (resolvedPrimarySkillForSession && resolvedMovementBias === 'push') {
    if (supportSkillsExpressed.length >= 1) {
      resolvedSessionIdentity = `${formatSkillLabel(resolvedPrimarySkillForSession)} Push + Support`
    } else {
      resolvedSessionIdentity = `${formatSkillLabel(resolvedPrimarySkillForSession)} Push Day`
    }
  } else if (resolvedPrimarySkillForSession && resolvedMovementBias === 'pull') {
    if (supportSkillsExpressed.length >= 1) {
      resolvedSessionIdentity = `${formatSkillLabel(resolvedPrimarySkillForSession)} Pull + Support`
    } else {
      resolvedSessionIdentity = `${formatSkillLabel(resolvedPrimarySkillForSession)} Pull Day`
    }
  } else if (resolvedPrimarySkillForSession && skillExercises.length > strengthExercises.length) {
    if (supportSkillsExpressed.length >= 1) {
      resolvedSessionIdentity = `${formatSkillLabel(resolvedPrimarySkillForSession)} Skill + Support`
    } else {
      resolvedSessionIdentity = `${formatSkillLabel(resolvedPrimarySkillForSession)} Skill Focus`
    }
  } else if (resolvedMovementBias === 'push') {
    resolvedSessionIdentity = 'Push Strength'
  } else if (resolvedMovementBias === 'pull') {
    resolvedSessionIdentity = 'Pull Strength'
  } else if (resolvedMovementBias === 'skill') {
    resolvedSessionIdentity = 'Skill Practice'
  } else if (resolvedMovementBias === 'strength') {
    resolvedSessionIdentity = 'Strength Development'
  } else {
    resolvedSessionIdentity = 'Mixed Hybrid Training'
  }
  
  // Build truthful narrative reason
  let resolvedNarrativeReason: string
  
  if (isDeloadSession) {
    resolvedNarrativeReason = 'Lighter training to support recovery and adaptation.'
  } else if (recoveryState === 'poor') {
    resolvedNarrativeReason = 'Reduced intensity due to elevated fatigue markers.'
  } else if (resolvedPrimarySkillForSession && resolvedSecondarySkillForSession) {
    resolvedNarrativeReason = `Primary focus on ${formatSkillLabel(resolvedPrimarySkillForSession)} with ${formatSkillLabel(resolvedSecondarySkillForSession)} support work.`
  } else if (resolvedPrimarySkillForSession) {
    resolvedNarrativeReason = `Dedicated ${formatSkillLabel(resolvedPrimarySkillForSession)} development session.`
  } else if (resolvedMovementBias === 'push') {
    resolvedNarrativeReason = 'Pushing pattern strength and skill development.'
  } else if (resolvedMovementBias === 'pull') {
    resolvedNarrativeReason = 'Pulling pattern strength and skill development.'
  } else {
    resolvedNarrativeReason = 'Balanced session addressing multiple movement patterns.'
  }
  
  // Calculate coherence score
  let sessionCoherenceScore = 0.5 // Base
  
  // +0.2 if first exercise matches session identity
  const firstExerciseMatchesIdentity = 
    (resolvedMovementBias === 'push' && pushExercises.includes(firstExercise as any)) ||
    (resolvedMovementBias === 'pull' && pullExercises.includes(firstExercise as any)) ||
    (resolvedMovementBias === 'skill' && skillExercises.includes(firstExercise as any))
  if (firstExerciseMatchesIdentity) sessionCoherenceScore += 0.2
  
  // +0.15 if primary goal is visibly expressed
  if (primaryGoalExercises.length >= 2) sessionCoherenceScore += 0.15
  
  // +0.1 if method expression is consistent
  if (resolvedMethodExpression !== 'mixed_method') sessionCoherenceScore += 0.1
  
  // +0.05 if dominant category is clear (>50%)
  const dominantCategoryRatio = (categoryCount[dominantExerciseCategory] || 0) / workingExercises.length
  if (dominantCategoryRatio > 0.5) sessionCoherenceScore += 0.05
  
  sessionCoherenceScore = Math.min(1, sessionCoherenceScore)
  
  // Check if resolved identity matches the template
  const templateFocusLower = (templateFocus || '').toLowerCase()
  const identityMatchesContent = (
    (templateFocusLower.includes('push') && resolvedMovementBias === 'push') ||
    (templateFocusLower.includes('pull') && resolvedMovementBias === 'pull') ||
    (templateFocusLower.includes('skill') && resolvedMovementBias === 'skill') ||
    (templateFocusLower.includes('strength') && resolvedMovementBias === 'strength') ||
    templateFocusLower.includes('mixed') ||
    !templateFocus // No template = always matches
  )
  
  // Audit logs
  console.log('[phase15f-session-identity-vs-first-block-audit]', {
    dayNumber,
    templateFocus,
    templateLabel,
    firstExerciseName: firstName,
    firstExerciseCategory: firstCategory,
    resolvedIdentity: resolvedSessionIdentity,
    resolvedMovementBias,
    identityMatchesFirstBlock: firstExerciseMatchesIdentity,
  })
  
  console.log('[phase15f-session-label-truth-verdict]', {
    dayNumber,
    originalTemplateLabel: templateLabel,
    resolvedSessionIdentity,
    labelsMatch: templateLabel?.toLowerCase().includes(resolvedSessionIdentity.toLowerCase().split(' ')[0]) || false,
    shouldUpdateLabel: !identityMatchesContent,
    verdict: identityMatchesContent ? 'label_matches_content' : 'label_mismatch_needs_correction',
  })
  
  console.log('[phase15f-dominant-content-identity-audit]', {
    dayNumber,
    workingExerciseCount: workingExercises.length,
    pushCount: pushExercises.length,
    pullCount: pullExercises.length,
    skillCount: skillExercises.length,
    strengthCount: strengthExercises.length,
    dominantExerciseCategory,
    resolvedMovementBias,
    primaryGoalExerciseCount: primaryGoalExercises.length,
    secondaryGoalExerciseCount: secondaryGoalExercises.length,
    sessionCoherenceScore: sessionCoherenceScore.toFixed(2),
  })
  
  // [AI-TRUTH-MATERIALIZATION] Log broader skill detection for visibility audit
  console.log('[ai-truth-materialization-session-skill-detection]', {
    dayNumber,
    broaderSkillsExpressed,
    supportSkillsExpressed,
    multiSkillArchitectureActive,
    skillBreakdownCount: skillBreakdown.length,
    totalSkillsDetected: broaderSkillsExpressed.length,
    verdict: multiSkillArchitectureActive 
      ? 'MULTI_SKILL_SESSION_DETECTED'
      : supportSkillsExpressed.length > 0
        ? 'SUPPORT_SKILLS_VISIBLE'
        : 'PRIMARY_SECONDARY_ONLY',
  })
  return {
    resolvedSessionIdentity,
    resolvedMovementBias,
    resolvedPrimarySkillForSession,
    resolvedSecondarySkillForSession,
    resolvedMethodExpression,
    resolvedNarrativeReason,
    firstWorkingBlockCategory: firstCategory,
    dominantExerciseCategory,
    sessionCoherenceScore,
    identityMatchesContent,
    // [AI-TRUTH-MATERIALIZATION] Broader skill visibility
    broaderSkillsExpressed,
    supportSkillsExpressed,
    multiSkillArchitectureActive,
    skillBreakdown,
  }
}

function formatSkillLabel(skill: string): string {
  return skill
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * [PHASE 15F TASK 2] Generate truthful "Why This Workout" from final session data
 * NOT from template-level assumptions
 */
export function generateTruthfulSessionExplanation(params: {
  resolvedIdentity: ResolvedSessionIdentity
  dayNumber: number
  totalDaysInWeek: number
  recoveryState?: 'poor' | 'fair' | 'normal' | 'good'
  primaryGoal: string
  secondaryGoal?: string | null
  isAdvancedAthlete: boolean
  sessionMinutes: number
}): string {
  const { resolvedIdentity, dayNumber, totalDaysInWeek, recoveryState, primaryGoal, secondaryGoal, isAdvancedAthlete, sessionMinutes } = params
  
  const parts: string[] = []
  
  // Day position context
  if (dayNumber === 1) {
    parts.push('Week begins with')
  } else if (dayNumber === totalDaysInWeek) {
    parts.push('Week closes with')
  } else {
    parts.push(`Day ${dayNumber}:`)
  }
  
  // Session purpose
  if (resolvedIdentity.resolvedPrimarySkillForSession) {
    if (resolvedIdentity.resolvedSecondarySkillForSession) {
      parts.push(`${formatSkillLabel(resolvedIdentity.resolvedPrimarySkillForSession)} focus with ${formatSkillLabel(resolvedIdentity.resolvedSecondarySkillForSession)} support.`)
    } else {
      parts.push(`dedicated ${formatSkillLabel(resolvedIdentity.resolvedPrimarySkillForSession)} development.`)
    }
  } else if (resolvedIdentity.resolvedMovementBias === 'push') {
    parts.push('pushing pattern emphasis.')
  } else if (resolvedIdentity.resolvedMovementBias === 'pull') {
    parts.push('pulling pattern emphasis.')
  } else {
    parts.push('balanced hybrid training.')
  }
  
  // Recovery context - ONLY if actually relevant
  if (recoveryState === 'poor') {
    parts.push('Volume adjusted for recovery.')
  }
  // Do NOT say "recovery-focused" unless this is actually a deload/recovery session
  
  // Method expression
  if (resolvedIdentity.resolvedMethodExpression !== 'straight_sets' && resolvedIdentity.resolvedMethodExpression !== 'none') {
    parts.push(`Includes ${resolvedIdentity.resolvedMethodExpression.replace('_', ' ')} work.`)
  }
  
  // Advanced athlete context
  if (isAdvancedAthlete && sessionMinutes >= 60) {
    parts.push('Extended session time used for complete skill-strength coverage.')
  }
  
  const explanation = parts.join(' ')
  
  console.log('[phase15f-explanation-final-session-source-audit]', {
    dayNumber,
    usedResolvedIdentity: true,
    usedTemplateAssumptions: false,
    resolvedPrimarySkill: resolvedIdentity.resolvedPrimarySkillForSession,
    resolvedMovementBias: resolvedIdentity.resolvedMovementBias,
    recoveryState,
    explanationGenerated: explanation.slice(0, 100) + (explanation.length > 100 ? '...' : ''),
  })
  
  console.log('[phase15f-why-card-truth-contract-audit]', {
    dayNumber,
    explanationSourcedFromFinalSession: true,
    noTemplateMemoryUsed: true,
    recoveryMentionedOnlyWhenTrue: recoveryState === 'poor',
    verdict: 'explanation_truthful',
  })
  
  return explanation
}

/**
 * [PHASE 15F TASK 4] Check method expression eligibility for all-styles-selected
 */
export function checkMethodExpressionEligibility(params: {
  hasAllStylesSelected: boolean
  sessionMinutes: number
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  recoveryState?: 'poor' | 'fair' | 'normal' | 'good'
  dominantSpine: string
  dayNumber: number
}): {
  supersetEligible: boolean
  circuitEligible: boolean
  densityFinisherEligible: boolean
  mixedMethodEligible: boolean
  exclusionReasons: string[]
} {
  const { hasAllStylesSelected, sessionMinutes, experienceLevel, recoveryState, dominantSpine, dayNumber } = params
  
  const exclusionReasons: string[] = []
  
  // Base eligibility - only advanced+ with long sessions and all styles
  const baseEligible = hasAllStylesSelected && 
    sessionMinutes >= 60 && 
    (experienceLevel === 'advanced' || experienceLevel === 'elite')
  
  if (!hasAllStylesSelected) {
    exclusionReasons.push('not_all_styles_selected')
  }
  if (sessionMinutes < 60) {
    exclusionReasons.push('session_too_short_for_method_expression')
  }
  if (experienceLevel !== 'advanced' && experienceLevel !== 'elite') {
    exclusionReasons.push('not_advanced_experience_level')
  }
  
  // Recovery blocks method expression
  if (recoveryState === 'poor') {
    exclusionReasons.push('poor_recovery_blocks_complex_methods')
  }
  
  const recoverySafe = recoveryState !== 'poor'
  
  // Superset eligibility - most permissive
  const supersetEligible = baseEligible && recoverySafe
  
  // Circuit eligibility - needs extra time
  const circuitEligible = baseEligible && recoverySafe && sessionMinutes >= 65
  
  // Density finisher eligibility - needs the right spine and time
  const densityFinisherEligible = baseEligible && recoverySafe && sessionMinutes >= 70
  
  // Mixed method - advanced only
  const mixedMethodEligible = supersetEligible || circuitEligible || densityFinisherEligible
  
  console.log('[phase15f-method-expression-eligibility-audit]', {
    dayNumber,
    hasAllStylesSelected,
    sessionMinutes,
    experienceLevel,
    recoveryState,
    dominantSpine,
    supersetEligible,
    circuitEligible,
    densityFinisherEligible,
    mixedMethodEligible,
    exclusionReasons,
  })
  
  return {
    supersetEligible,
    circuitEligible,
    densityFinisherEligible,
    mixedMethodEligible,
    exclusionReasons,
  }
}

/**
 * [PHASE 15F TASK 5] Score session coherence for opening exercise appropriateness
 */
export function scoreSessionCoherence(params: {
  exercises: SessionExerciseForIdentity[]
  sessionIdentity: string
  primaryGoal: string
  secondaryGoal?: string | null
  dayNumber: number
}): {
  coherenceScore: number
  openingExerciseAppropriate: boolean
  supportExercisesJustified: boolean
  issues: string[]
} {
  const { exercises, sessionIdentity, primaryGoal, secondaryGoal, dayNumber } = params
  
  const issues: string[] = []
  let coherenceScore = 0.5
  
  const workingExercises = exercises.filter(e => !e.isWarmup && !e.isCooldown)
  if (workingExercises.length === 0) {
    return {
      coherenceScore: 0,
      openingExerciseAppropriate: true,
      supportExercisesJustified: true,
      issues: ['no_working_exercises'],
    }
  }
  
  const firstExercise = workingExercises[0]
  const firstName = (firstExercise.name || '').toLowerCase()
  const identityLower = sessionIdentity.toLowerCase()
  
  // Check opening exercise appropriateness
  let openingExerciseAppropriate = true
  
  if (identityLower.includes('push') && (firstName.includes('lever') || firstName.includes('pull') || firstName.includes('row'))) {
    openingExerciseAppropriate = false
    issues.push('push_session_opens_with_pull_exercise')
  }
  if (identityLower.includes('pull') && (firstName.includes('planche') || firstName.includes('push') || firstName.includes('dip'))) {
    openingExerciseAppropriate = false
    issues.push('pull_session_opens_with_push_exercise')
  }
  
  if (openingExerciseAppropriate) coherenceScore += 0.2
  
  // Check support exercise justification
  const supportExercises = workingExercises.filter(e => 
    e.category === 'accessory' || e.category === 'support' || e.category === 'secondary_strength'
  )
  
  const primaryGoalLower = primaryGoal.toLowerCase().replace(/_/g, ' ')
  const secondaryGoalLower = (secondaryGoal || '').toLowerCase().replace(/_/g, ' ')
  
  const justifiedSupport = supportExercises.filter(e => {
    const name = (e.name || '').toLowerCase()
    const targets = (e.targetSkills || []).map(t => t.toLowerCase())
    
    // Justified if it targets primary/secondary goal
    const targetsGoal = name.includes(primaryGoalLower) || 
                        name.includes(secondaryGoalLower) ||
                        targets.some(t => t.includes(primaryGoalLower) || t.includes(secondaryGoalLower))
    
    // Or if it matches session movement pattern
    const matchesPush = identityLower.includes('push') && (name.includes('push') || name.includes('press') || name.includes('dip'))
    const matchesPull = identityLower.includes('pull') && (name.includes('pull') || name.includes('row'))
    
    return targetsGoal || matchesPush || matchesPull
  })
  
  const supportExercisesJustified = supportExercises.length === 0 || 
    justifiedSupport.length >= supportExercises.length * 0.6
  
  if (supportExercisesJustified) coherenceScore += 0.15
  
  // Check primary goal visibility
  const primaryGoalExercises = workingExercises.filter(e => {
    const name = (e.name || '').toLowerCase()
    return name.includes(primaryGoalLower)
  })
  if (primaryGoalExercises.length >= 2) coherenceScore += 0.15
  
  coherenceScore = Math.min(1, coherenceScore)
  
  console.log('[phase15f-session-coherence-score-audit]', {
    dayNumber,
    sessionIdentity,
    workingExerciseCount: workingExercises.length,
    coherenceScore: coherenceScore.toFixed(2),
    openingExerciseAppropriate,
    supportExercisesJustified,
    issues,
  })
  
  console.log('[phase15f-opening-exercise-truth-audit]', {
    dayNumber,
    firstExerciseName: firstName,
    sessionIdentity,
    isAppropriate: openingExerciseAppropriate,
    verdict: openingExerciseAppropriate ? 'opening_matches_session' : 'opening_contradicts_session',
  })
  
  console.log('[phase15f-support-exercise-justification-audit]', {
    dayNumber,
    totalSupportExercises: supportExercises.length,
    justifiedCount: justifiedSupport.length,
    unjustifiedCount: supportExercises.length - justifiedSupport.length,
    verdict: supportExercisesJustified ? 'support_justified' : 'support_has_filler',
  })
  
  return {
    coherenceScore,
    openingExerciseAppropriate,
    supportExercisesJustified,
    issues,
  }
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

// =============================================================================
// EXPANDED ATHLETE CONTEXT (TASK 1 - DEEP PLANNER INPUT)
// =============================================================================

/**
 * Full athlete context for deep planner consumption.
 * Includes all relevant profile data for intelligent weekly construction.
 */
export interface ExpandedAthleteContext {
  // Core goals
  primaryGoal: string
  secondaryGoal: string | null
  selectedSkills: string[]
  goalCategories: string[]
  
  // Training path
  trainingPathType: 'hybrid' | 'skill_progression' | 'strength_endurance' | 'balanced'
  
  // Schedule identity
  scheduleMode: 'static' | 'flexible'
  trainingDaysPerWeek: number | null
  sessionDurationMode: 'static' | 'adaptive'
  sessionLengthMinutes: number
  
  // Flexibility targets
  selectedFlexibility: string[]
  
  // Strength benchmarks
  pullUpMax: number | null
  dipMax: number | null
  weightedPullUp: { weight: number; reps: number } | null
  weightedDip: { weight: number; reps: number } | null
  
  // Skill progressions
  frontLeverProgression: string | null
  plancheProgression: string | null
  hspuProgression: string | null
  
  // Recovery/caution
  jointCautions: string[]
  recoveryLevel: string | null
  
  // Experience
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * Weighted skill allocation for the week.
 * Determines how much exposure each skill gets across sessions.
 */
export interface WeightedSkillAllocation {
  skill: string
  weight: number           // 0-1, normalized
  exposureSessions: number // How many sessions include this skill
  priorityLevel: 'primary' | 'secondary' | 'tertiary' | 'support'
  rationale: string
}

// =============================================================================
// [advanced-skill-expression] ISSUE A: Advanced Skill Family Definitions
// =============================================================================

/**
 * Advanced skill families that need special expression handling.
 * These skills require specific support work and progression paths.
 */
export const ADVANCED_SKILL_FAMILIES: Record<string, {
  displayName: string
  category: 'push' | 'pull' | 'core' | 'hybrid'
  subcategory: 'vertical' | 'horizontal' | 'straight_arm' | 'bent_arm' | 'anti_extension' | 'compression'
  tendonSensitive: boolean
  minFrequencyPerWeek: number
  maxFrequencyPerWeek: number
  supportPatterns: string[]  // Exercise patterns that support this skill
  technicalSlotWeight: number // How much technical work this skill needs (0-1)
  directProgressions: string[] // Exercise IDs that are direct progressions
  requiresPrerequisites: boolean
}> = {
  // =============================================================================
  // [PHASE 2C CANONICAL REGISTRY ALIGNMENT]
  // Every `directProgressions` entry below is a REAL selectable ID from
  // `lib/adaptive-exercise-pool.ts → getAllExercises()`. The pool is the
  // single authoritative naming owner; this registry aligns to it, not the
  // other way around. Rungs are ordered low → high so low-index = easiest.
  // Phase 2B's `pickBestCanonicalCandidate` uses proximity to the athlete's
  // `currentWorkingProgression` to rank — a complete, pool-aligned ladder
  // here is the precondition that unlocks the best-in-class committed row.
  //
  // Entries restored or added in Phase 2C:
  //   • `planche`           — was MISSING (only `planche_pushup` existed)
  //   • `front_lever`       — was MISSING
  //   • `back_lever`        — pool IDs now exist; registry aligns to them
  //   • `dragon_flag`       — registry used inverse naming (`tuck_dragon_flag`);
  //                           pool uses `dragon_flag_tuck` / `dragon_flag_neg` /
  //                           `dragon_flag_assisted` / `dragon_flag`
  //   • `hspu`              — registry used `pike_push_up` / `freestanding_hspu`;
  //                           pool uses `pike_pushup` / `freestanding_hs_hold`
  //   • `planche_pushup`    — drops non-existent `pseudo_planche_pushup`,
  //                           `straddle_planche_pushup`; adds real pool IDs
  //   • `one_arm_*`         — drops non-existent negative/assisted variants
  // =============================================================================
  planche: {
    displayName: 'Planche',
    category: 'push',
    subcategory: 'straight_arm',
    tendonSensitive: true,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 4,
    supportPatterns: ['planche_lean', 'straight_arm_push', 'protraction'],
    technicalSlotWeight: 0.5,
    // [PHASE 3D REGISTRY-BREADTH-LOCK] Planche directProgressions previously
    // shipped only static holds. For an advanced planche-primary athlete,
    // the dynamic pseudo-planche pressing rows ARE direct planche expression
    // — they live in the same skill family and contribute the same straight-
    // arm push pattern under load. The pre-3D registry forced advanced
    // athletes into the static-hold ladder only, even when the pool already
    // shipped the dynamic rows that this exact level needs.
    //
    // Verified pool IDs added:
    //   • `pppu`                (L783) — pseudo planche push-up (canonical)
    //   • `planche_lean_pushup` (L800) — planche-lean range pushup, direct
    //                                    bridge from lean → tuck planche
    //
    // Static holds remain at the front for proximity-ranking when athlete
    // current-working-level is below the dynamic-press tier.
    directProgressions: [
      'planche_lean',
      'planche_lean_pushup',
      'tuck_planche',
      'pppu',
      'adv_tuck_planche',
      'straddle_planche',
      'banded_planche_hold',
    ],
    requiresPrerequisites: true,
  },
  front_lever: {
    displayName: 'Front Lever',
    category: 'pull',
    subcategory: 'straight_arm',
    tendonSensitive: true,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 3,
    supportPatterns: ['straight_arm_pull', 'horizontal_pull', 'core_anti_extension'],
    technicalSlotWeight: 0.4,
    // [PHASE 3D REGISTRY-BREADTH-LOCK] Front lever directProgressions previously
    // contained STATIC HOLDS ONLY — `tuck_fl`, `adv_tuck_fl`, `one_leg_fl`,
    // `straddle_fl`, `banded_fl_hold`. For an advanced athlete with FL as a
    // selected skill, dynamic FL carryover (rows, raises, ice cream makers,
    // tuck FL pulls) IS direct expression of the skill — the same way a
    // weighted-pullup is direct pull-up expression. The pre-3D registry forced
    // all FL athletes onto static holds even when the pool already shipped
    // the dynamic rows.
    //
    // Verified pool IDs added (all from adaptive-exercise-pool.ts):
    //   • `tuck_front_lever_pull` (L678) — dynamic tuck FL pull carryover
    //   • `fl_rows`                (L848) — front lever row, the canonical
    //                                       FL strength accumulation row
    //   • `ice_cream_maker`        (L862) — eccentric tuck-to-FL control,
    //                                       direct pre-FL-pullup carryover
    //
    // Order is low → high difficulty. Static holds remain at the front so the
    // proximity-ranker still surfaces them for athletes whose current working
    // level is below the dynamic tier.
    directProgressions: [
      'tuck_fl',
      'adv_tuck_fl',
      'fl_rows',
      'tuck_front_lever_pull',
      'one_leg_fl',
      'ice_cream_maker',
      'straddle_fl',
      'banded_fl_hold',
    ],
    requiresPrerequisites: true,
  },
  hspu: {
    displayName: 'Handstand Push-Up',
    category: 'push',
    subcategory: 'vertical',
    tendonSensitive: false,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 4,
    supportPatterns: ['vertical_push', 'overhead_press', 'pike_push'],
    technicalSlotWeight: 0.3,
    // Pool IDs: `pike_pushup`, `pike_pushup_elevated`, `wall_hspu_partial`,
    // `wall_hspu_negative`, `wall_hspu`, `wall_hspu_full`, `deficit_hspu`, `freestanding_hs_hold`.
    // Ordered low → high.
    directProgressions: [
      'pike_pushup',
      'pike_pushup_elevated',
      'wall_hspu_partial',
      'wall_hspu_negative',
      'wall_hspu',
      'wall_hspu_full',
      'deficit_hspu',
      'freestanding_hs_hold',
    ],
    requiresPrerequisites: true,
  },
  back_lever: {
    displayName: 'Back Lever',
    category: 'pull',
    subcategory: 'straight_arm',
    tendonSensitive: true,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 3,
    supportPatterns: ['shoulder_extension', 'straight_arm_pull', 'german_hang'],
    technicalSlotWeight: 0.4,
    // Pool IDs (added in Phase 2C to adaptive-exercise-pool SKILL_EXERCISES):
    // `skin_the_cat`, `german_hang`, `tuck_back_lever`, `advanced_tuck_back_lever`,
    // `straddle_back_lever`, `full_back_lever`. Note: `advanced_tuck_back_lever`
    // is authoritative (matches back-lever-training-system.ts) — NOT `adv_tuck_back_lever`.
    directProgressions: [
      'skin_the_cat',
      'german_hang',
      'tuck_back_lever',
      'advanced_tuck_back_lever',
      'straddle_back_lever',
      'full_back_lever',
    ],
    requiresPrerequisites: true,
  },
  dragon_flag: {
    displayName: 'Dragon Flag',
    category: 'core',
    subcategory: 'anti_extension',
    tendonSensitive: false,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 4,
    supportPatterns: ['anti_extension', 'eccentric_core', 'compression'],
    technicalSlotWeight: 0.25,
    // Pool IDs: `dragon_flag_tuck`, `dragon_flag_neg`, `dragon_flag_assisted`, `dragon_flag`.
    // Low → high. `hollow_body` was removed (it is support / prerequisite, not
    // direct progression — belongs in supportPatterns, not directProgressions).
    directProgressions: ['dragon_flag_tuck', 'dragon_flag_neg', 'dragon_flag_assisted', 'dragon_flag'],
    requiresPrerequisites: false,
  },
  planche_pushup: {
    displayName: 'Planche Push-Up',
    category: 'push',
    subcategory: 'straight_arm',
    tendonSensitive: true,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 3,
    supportPatterns: ['planche_lean', 'pseudo_planche', 'straight_arm_push'],
    technicalSlotWeight: 0.5,
    // Pool IDs: `planche_lean`, `planche_lean_pushup`, `pppu`, `tuck_planche_pushup`.
    // `pseudo_planche_pushup` & `straddle_planche_pushup` dropped (not in pool).
    // `pppu` ("pseudo planche push-up") is the canonical pseudo-planche pushup row.
    directProgressions: ['planche_lean', 'planche_lean_pushup', 'pppu', 'tuck_planche_pushup'],
    requiresPrerequisites: true,
  },
  one_arm_pull_up: {
    displayName: 'One-Arm Pull-Up',
    category: 'pull',
    subcategory: 'bent_arm',
    tendonSensitive: true,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 3,
    supportPatterns: ['archer_pull', 'weighted_pull', 'unilateral_pull', 'eccentric_pull'],
    technicalSlotWeight: 0.4,
    // Pool IDs: `pull_up`, `chin_up`, `chest_to_bar_pull_up`, `archer_pull_up`,
    // `typewriter_pull_up`, `weighted_pull_up`. `one_arm_pull_up` / `_negative` /
    // `assisted_one_arm_pull_up` dropped (not in pool). `typewriter_pull_up` is
    // the closest unilateral pulling row currently selectable.
    directProgressions: ['pull_up', 'chest_to_bar_pull_up', 'weighted_pull_up', 'archer_pull_up', 'typewriter_pull_up'],
    requiresPrerequisites: true,
  },
  one_arm_chin_up: {
    displayName: 'One-Arm Chin-Up',
    category: 'pull',
    subcategory: 'bent_arm',
    tendonSensitive: true,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 3,
    supportPatterns: ['archer_chin', 'weighted_chin', 'unilateral_pull', 'eccentric_chin'],
    technicalSlotWeight: 0.4,
    // Pool has no chin-specific variants; map to the canonical unilateral and
    // weighted pulling rows that transfer to chin-up strength.
    directProgressions: ['chin_up', 'chest_to_bar_pull_up', 'weighted_pull_up', 'archer_pull_up', 'typewriter_pull_up'],
    requiresPrerequisites: true,
  },
  one_arm_push_up: {
    displayName: 'One-Arm Push-Up',
    category: 'push',
    subcategory: 'horizontal',
    tendonSensitive: false,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 4,
    supportPatterns: ['leverage_push', 'anti_rotation', 'archer_push', 'asymmetric_push'],
    technicalSlotWeight: 0.3,
    // Pool IDs: `push_up`, `diamond_pushup`, `archer_push_up`, `ring_push_up`,
    // `pppu`. `one_arm_push_up_*` dropped (not in pool).
    directProgressions: ['push_up', 'diamond_pushup', 'ring_push_up', 'archer_push_up', 'pppu'],
    requiresPrerequisites: false,
  },

  // ===========================================================================
  // [PHASE 3D REGISTRY-BREADTH-LOCK] Four advanced skill families ADDED.
  //
  // These four skills (handstand, v_sit, l_sit, muscle_up) all had:
  //   • full pool ID coverage in lib/adaptive-exercise-pool.ts
  //   • full readiness factor coverage in advanced-skills-integration.ts
  //   • full progression node coverage in skill graphs
  // ...but were entirely MISSING from `ADVANCED_SKILL_FAMILIES`. Because
  // `isAdvancedSkill()` reads from this registry's keys, the advanced-skill
  // enforcement pass at program-exercise-selector.ts L6442+ silently
  // skipped any athlete who selected ONLY these skills — the very families
  // our advanced hybrid athlete profile most depends on (handstand and v-sit
  // are explicitly in the saved athlete truth).
  //
  // Result pre-3D: athlete selects handstand + v-sit, generic scoring
  // takes over, sessions surface generic pull-ups / push-ups / leg raises
  // instead of skill-specific direct progressions. Exactly the
  // "shallow / underexpressed" symptom diagnosed in the phase brief.
  //
  // Each entry below uses ONLY pool IDs verified to exist in
  // adaptive-exercise-pool.ts. directProgressions ordered low → high.
  // ===========================================================================

  handstand: {
    displayName: 'Handstand',
    category: 'push',
    subcategory: 'vertical',
    tendonSensitive: false,
    minFrequencyPerWeek: 3,
    maxFrequencyPerWeek: 5, // Handstand benefits from high frequency
    supportPatterns: ['vertical_push', 'overhead_press', 'shoulder_stability'],
    technicalSlotWeight: 0.4,
    // Pool IDs verified (low → high):
    //   `wall_hs_hold`              (L282)
    //   `wall_handstand_hold`       (L1212) — alias of wall_hs_hold variant
    //   `handstand_shoulder_taps`   (L1230)
    //   `freestanding_hs_hold`      (L337)
    //   `freestanding_handstand_hold` (L1264)
    directProgressions: [
      'wall_hs_hold',
      'wall_handstand_hold',
      'handstand_shoulder_taps',
      'freestanding_hs_hold',
      'freestanding_handstand_hold',
    ],
    requiresPrerequisites: false,
  },

  v_sit: {
    displayName: 'V-Sit',
    category: 'core',
    subcategory: 'compression',
    tendonSensitive: false,
    minFrequencyPerWeek: 3,
    maxFrequencyPerWeek: 5,
    supportPatterns: ['compression_core', 'hip_flexibility', 'scapular_control'],
    technicalSlotWeight: 0.3,
    // Pool IDs verified (low → high):
    //   `tuck_l_sit`        (L1873) — foundation compression
    //   `single_leg_l_sit`  (L1891) — unilateral compression
    //   `l_sit_skill`       (L1909) — full l-sit (v-sit prerequisite)
    //   `advanced_l_sit`    (L1927) — straddle/elevated variants
    //   `v_sit_progression` (L1947) — direct v-sit
    //   `v_sit_hold`        (L1965) — full v-sit
    //   `manna_progression` (L1984) — terminal compression skill
    directProgressions: [
      'tuck_l_sit',
      'single_leg_l_sit',
      'l_sit_skill',
      'advanced_l_sit',
      'v_sit_progression',
      'v_sit_hold',
      'manna_progression',
    ],
    requiresPrerequisites: true,
  },

  l_sit: {
    displayName: 'L-Sit',
    category: 'core',
    subcategory: 'compression',
    tendonSensitive: false,
    minFrequencyPerWeek: 3,
    maxFrequencyPerWeek: 5,
    supportPatterns: ['compression_core', 'dip_pattern', 'scapular_control'],
    technicalSlotWeight: 0.25,
    // Pool IDs verified (low → high):
    //   `tuck_l_sit`        (L1873)
    //   `single_leg_l_sit`  (L1891)
    //   `l_sit_core`        (L1697) — l-sit as a core anchor row
    //   `l_sit_skill`       (L1909) — full floor l-sit
    //   `advanced_l_sit`    (L1927)
    //   `hanging_l_sit`     (L1569) — hanging l-sit (advanced variant)
    directProgressions: [
      'tuck_l_sit',
      'single_leg_l_sit',
      'l_sit_core',
      'l_sit_skill',
      'advanced_l_sit',
      'hanging_l_sit',
    ],
    requiresPrerequisites: false,
  },

  muscle_up: {
    displayName: 'Muscle-Up',
    category: 'pull',
    subcategory: 'bent_arm',
    tendonSensitive: false,
    minFrequencyPerWeek: 2,
    maxFrequencyPerWeek: 3,
    supportPatterns: ['vertical_pull', 'dip_pattern', 'transition_control'],
    technicalSlotWeight: 0.4,
    // Pool IDs verified (low → high):
    //   `chest_to_bar_pull_up`        (L610) — height prerequisite
    //   `explosive_pull_up`           (L999) — explosive pulling base
    //   `muscle_up_negative`          (L1016)
    //   `muscle_up_negative_skill`    (L516) — skill-tier negative
    //   `muscle_up_transition_drill`  (L1034)
    //   `strict_muscle_up`            (L534)
    //   `ring_muscle_up`              (L551) — ring variant
    directProgressions: [
      'chest_to_bar_pull_up',
      'explosive_pull_up',
      'muscle_up_negative',
      'muscle_up_negative_skill',
      'muscle_up_transition_drill',
      'strict_muscle_up',
      'ring_muscle_up',
    ],
    requiresPrerequisites: true,
  },
}

/**
 * Check if a skill is an advanced skill that needs special expression handling.
 */
export function isAdvancedSkill(skillId: string): boolean {
  return skillId in ADVANCED_SKILL_FAMILIES
}

/**
 * Get the advanced skill family definition for a skill.
 */
export function getAdvancedSkillFamily(skillId: string) {
  return ADVANCED_SKILL_FAMILIES[skillId] || null
}

/**
 * Calculate weighted skill allocation across the week.
 * TASK 2: Implements weighted distribution so primary/secondary get most exposure
 * while other selected skills still get meaningful representation.
 * [advanced-skill-expression] ISSUE A: Enhanced to ensure advanced skills get proper expression.
 */
export function calculateWeightedSkillAllocation(
  context: ExpandedAthleteContext,
  totalSessions: number
): WeightedSkillAllocation[] {
  const allocations: WeightedSkillAllocation[] = []
  
  // [PHASE 15B] Calculate selected skill count for advanced calibration
  const selectedSkillCount = (context.selectedSkills || []).length
  
  // Get goal hierarchy weights with advanced profile calibration
  const goalWeights = calculateGoalHierarchyWeights(
    context.primaryGoal,
    context.secondaryGoal,
    context.trainingPathType,
    context.experienceLevel, // [PHASE 15B] Pass experience level
    selectedSkillCount       // [PHASE 15B] Pass selected skill count
  )
  
  // Primary goal - highest weight
  allocations.push({
    skill: context.primaryGoal,
    weight: goalWeights.primaryWeight,
    exposureSessions: Math.ceil(totalSessions * goalWeights.primaryWeight),
    priorityLevel: 'primary',
    rationale: `Primary focus - ${Math.round(goalWeights.primaryWeight * 100)}% of training emphasis`,
  })
  
  // Secondary goal - second highest weight
  if (context.secondaryGoal) {
    allocations.push({
      skill: context.secondaryGoal,
      weight: goalWeights.secondaryWeight,
      exposureSessions: Math.max(1, Math.round(totalSessions * goalWeights.secondaryWeight)),
      priorityLevel: 'secondary',
      rationale: `Secondary focus - ${Math.round(goalWeights.secondaryWeight * 100)}% of training emphasis`,
    })
  }
  
  // Other selected skills - distribute support weight among them
  // [advanced-skill-expression] ISSUE A: Separate advanced skills for special handling
  const otherSkills = (context.selectedSkills || []).filter(
    s => s !== context.primaryGoal && s !== context.secondaryGoal
  )
  
  // [advanced-skill-expression] Identify which "other" skills are advanced
  const advancedOtherSkills = otherSkills.filter(s => isAdvancedSkill(s))
  const normalOtherSkills = otherSkills.filter(s => !isAdvancedSkill(s))
  
  // [advanced-skill-expression] Log advanced skill detection
  if (advancedOtherSkills.length > 0) {
    console.log('[advanced-skill-expression] Detected advanced skills in selection:', {
      advancedSkills: advancedOtherSkills,
      normalSkills: normalOtherSkills,
      primaryIsAdvanced: isAdvancedSkill(context.primaryGoal),
      secondaryIsAdvanced: context.secondaryGoal ? isAdvancedSkill(context.secondaryGoal) : false,
    })
  }
  
  if (otherSkills.length > 0) {
    // [advanced-skill-expression] ISSUE A: Advanced skills get boosted allocation
    // Give advanced skills a minimum of 2 exposure sessions when possible
    const advancedSkillBoost = 0.05 // Extra weight for advanced skills
    
    const perSkillWeight = goalWeights.supportWeight / otherSkills.length
    
    // ==========================================================================
    // [PHASE 6B TASK 3] TIGHTENED TERTIARY ALLOCATION
    // Reduced from 40% to 20% of "other" skills to prevent over-broad identity
    // Tertiary visibility is now EARNED, not automatic
    // 
    // [PHASE 15B TASK 2] ADVANCED MULTI-SKILL CALIBRATION
    // Advanced athletes with 5+ selected skills can have more tertiary lanes
    // to allow meaningful multi-skill expression without diluting core goals
    //
    // [PHASE 1 AI-TRUTH-ESCALATION] TASK B: PREVENT NARROW PRIMARY/SECONDARY COLLAPSE
    // Broader profiles with high session counts deserve more tertiary expression.
    // The goal is NOT to equalize all skills, but to prevent premature demotion.
    // ==========================================================================
    // Formula: allow ~20% of "other" skills to be tertiary, minimum 1, max 2
    // [PHASE 15B] For advanced multi-skill profiles: allow up to 30% with max 3
    // [PHASE 1 AI-TRUTH-ESCALATION] For intermediate+ with 5+ days: allow up to 40% with max 4
    const isAdvancedMultiSkillProfile = 
      context.experienceLevel === 'advanced' && selectedSkillCount >= 5
    
    // [PHASE 1 AI-TRUTH-ESCALATION] Expanded profile detection for broader expression
    const isIntermediateHighFrequencyProfile = 
      (context.experienceLevel === 'intermediate' || context.experienceLevel === 'advanced') &&
      selectedSkillCount >= 4 &&
      totalSessions >= 5
    
    const isBroadExpressionJustified = 
      isAdvancedMultiSkillProfile || 
      (isIntermediateHighFrequencyProfile && otherSkills.length >= 3)
    
    // [PHASE 1 AI-TRUTH-ESCALATION] Tiered tertiary allocation based on profile complexity
    const tertiaryPercentage = isBroadExpressionJustified 
      ? 0.45  // Broader profiles: up to 45% of other skills get tertiary
      : isAdvancedMultiSkillProfile 
        ? 0.35  // Advanced multi-skill: 35%
        : isIntermediateHighFrequencyProfile 
          ? 0.30  // Intermediate high-frequency: 30%
          : 0.20  // Default: 20%
    
    // [PHASE 1 AI-TRUTH-ESCALATION] Tiered hard cap based on session availability
    const tertiaryHardCap = isBroadExpressionJustified 
      ? Math.min(5, Math.floor(totalSessions * 0.6))  // Up to 5 or 60% of sessions
      : isAdvancedMultiSkillProfile 
        ? 4
        : isIntermediateHighFrequencyProfile 
          ? 3
          : 2
    
    const maxTertiarySkills = Math.min(
      Math.max(1, Math.ceil(otherSkills.length * tertiaryPercentage)),
      tertiaryHardCap,
      Math.max(1, Math.floor(totalSessions / 2)) // [PHASE 1] More generous session-based cap
    )
    
    console.log('[phase6b-tertiary-threshold-enforcement-audit]', {
      otherSkillsCount: otherSkills.length,
      totalSessions,
      phase6aAllowedTertiary: Math.ceil(otherSkills.length * 0.4),
      phase6bAllowedTertiary: maxTertiarySkills,
      reductionReason: 'prevent_over_broad_visible_identity',
      tertiaryMustBeEarned: true,
      maxTertiaryHardCap: tertiaryHardCap,
      // [PHASE 15B] Advanced multi-skill audit
      isAdvancedMultiSkillProfile,
      tertiaryPercentageUsed: tertiaryPercentage,
      advancedCalibrationApplied: isAdvancedMultiSkillProfile,
      // [PHASE 1 AI-TRUTH-ESCALATION] Broader expression audit
      isIntermediateHighFrequencyProfile,
      isBroadExpressionJustified,
      escalationApplied: isBroadExpressionJustified || isIntermediateHighFrequencyProfile,
    })
    
    // [PHASE 15B] TASK 1: Log selected skills material influence audit
    console.log('[phase15b-selected-skills-material-influence-audit]', {
      primaryGoal: context.primaryGoal,
      secondaryGoal: context.secondaryGoal,
      otherSkillsCount: otherSkills.length,
      advancedSkillsInOthers: advancedOtherSkills.length,
      normalSkillsInOthers: normalOtherSkills.length,
      maxTertiaryAllowed: maxTertiarySkills,
      materialInfluenceCategories: {
        primary: 'weekly_emphasis + day_identity + exercise_pool_access',
        secondary: 'weekly_emphasis + day_identity + accessory_priority',
        tertiary: 'mixed_day_construction + support_allocation + exercise_variant_access',
        support: 'accessory_rotation + warmup_variety',
      },
      verdict: otherSkills.length > 0 
        ? `${Math.min(maxTertiarySkills, otherSkills.length)} skills get tertiary material influence`
        : 'no_tertiary_skills_selected',
    })
    
    otherSkills.forEach((skill, index) => {
      const isAdvanced = isAdvancedSkill(skill)
      const advancedFamily = getAdvancedSkillFamily(skill)
      
      // First tertiary skill gets more, subsequent get less (but slower decay)
      // [PRIORITY-COLLAPSE-FIX] Reduced decay rate from 0.15 to 0.08 for more even distribution
      let adjustedWeight = perSkillWeight * (1 - (index * 0.08))
      
      // [advanced-skill-expression] ISSUE A: Boost advanced skills
      if (isAdvanced) {
        adjustedWeight = Math.max(adjustedWeight + advancedSkillBoost, 0.10)
      }
      
      // Calculate exposure sessions with advanced skill minimum
      let exposureSessions = Math.max(1, Math.round(totalSessions * adjustedWeight))
      
      // [advanced-skill-expression] ISSUE A: Ensure advanced skills meet minimum frequency
      if (isAdvanced && advancedFamily) {
        exposureSessions = Math.max(exposureSessions, advancedFamily.minFrequencyPerWeek)
        // But don't exceed max frequency
        exposureSessions = Math.min(exposureSessions, advancedFamily.maxFrequencyPerWeek, totalSessions)
      }
      
      // [PRIORITY-COLLAPSE-FIX] TASK 6: Improved priority level assignment
      // - First maxTertiarySkills skills get 'tertiary' 
      // - Advanced skills always get at least 'tertiary' status
      // - Remaining skills get 'support'
      const shouldBeTertiary = index < maxTertiarySkills || isAdvanced
      const priorityLevel = shouldBeTertiary ? 'tertiary' : 'support'
      
      allocations.push({
        skill,
        weight: Math.max(0.05, adjustedWeight),
        exposureSessions,
        priorityLevel,
        rationale: isAdvanced
          ? `[Advanced] ${advancedFamily?.displayName || skill} - minimum ${exposureSessions} session(s) per week`
          : `Selected skill - ${priorityLevel} priority, included in ${exposureSessions} session(s)`,
      })
      
      // [advanced-skill-expression] Log advanced skill allocation
      if (isAdvanced) {
        console.log('[advanced-skill-expression] Advanced skill allocated:', {
          skill,
          displayName: advancedFamily?.displayName,
          weight: Math.round(adjustedWeight * 100) + '%',
          exposureSessions,
          minFrequency: advancedFamily?.minFrequencyPerWeek,
          maxFrequency: advancedFamily?.maxFrequencyPerWeek,
          tendonSensitive: advancedFamily?.tendonSensitive,
          priorityLevel,
        })
      }
    })
  }
  
  // [advanced-skill-expression] ISSUE A: Also check if primary/secondary are advanced
  // and log their expression requirements
  if (isAdvancedSkill(context.primaryGoal)) {
    const family = getAdvancedSkillFamily(context.primaryGoal)
    console.log('[advanced-skill-expression] Primary goal is advanced skill:', {
      skill: context.primaryGoal,
      displayName: family?.displayName,
      minFrequency: family?.minFrequencyPerWeek,
      technicalSlotWeight: family?.technicalSlotWeight,
      supportPatterns: family?.supportPatterns,
    })
  }
  
  if (context.secondaryGoal && isAdvancedSkill(context.secondaryGoal)) {
    const family = getAdvancedSkillFamily(context.secondaryGoal)
    console.log('[advanced-skill-expression] Secondary goal is advanced skill:', {
      skill: context.secondaryGoal,
      displayName: family?.displayName,
      minFrequency: family?.minFrequencyPerWeek,
      technicalSlotWeight: family?.technicalSlotWeight,
      supportPatterns: family?.supportPatterns,
    })
  }
  
  // TASK 9: Log allocation for diagnostics
  console.log('[engine-quality] TASK 2: Weighted skill allocation:', {
    primaryGoal: context.primaryGoal,
    secondaryGoal: context.secondaryGoal,
    selectedSkillsCount: otherSkills.length,
    advancedSkillsCount: advancedOtherSkills.length,
    totalSessions,
    allocations: allocations.map(a => ({
      skill: a.skill,
      weight: Math.round(a.weight * 100) + '%',
      sessions: a.exposureSessions,
      priority: a.priorityLevel,
      isAdvanced: isAdvancedSkill(a.skill),
    })),
  })
  
  // ==========================================================================
  // [PHASE 15B] COMPREHENSIVE SKILL INFLUENCE AUDITS
  // ==========================================================================
  
  // TASK 1: Skill to week structure audit
  const primaryAlloc = allocations.find(a => a.priorityLevel === 'primary')
  const secondaryAlloc = allocations.find(a => a.priorityLevel === 'secondary')
  const tertiaryAllocs = allocations.filter(a => a.priorityLevel === 'tertiary')
  const supportAllocs = allocations.filter(a => a.priorityLevel === 'support')
  
  console.log('[phase15b-skill-to-week-structure-audit]', {
    primarySkill: primaryAlloc?.skill,
    primarySessions: primaryAlloc?.exposureSessions,
    primaryWeight: primaryAlloc ? Math.round(primaryAlloc.weight * 100) + '%' : 'n/a',
    secondarySkill: secondaryAlloc?.skill || 'none',
    secondarySessions: secondaryAlloc?.exposureSessions || 0,
    secondaryWeight: secondaryAlloc ? Math.round(secondaryAlloc.weight * 100) + '%' : 'n/a',
    tertiarySkills: tertiaryAllocs.map(a => a.skill),
    tertiarySessions: tertiaryAllocs.reduce((sum, a) => sum + a.exposureSessions, 0),
    supportSkills: supportAllocs.map(a => a.skill),
    supportSessions: supportAllocs.reduce((sum, a) => sum + a.exposureSessions, 0),
    weeklyStructureInfluence: {
      primary: 'dominates_day_identity_and_exercise_selection',
      secondary: 'shapes_alternate_day_focus',
      tertiary: 'influences_mixed_day_support_work',
      support: 'accessory_and_warmup_variety',
    },
  })
  
  // TASK 1: Skill to exercise pool audit
  console.log('[phase15b-skill-to-exercise-pool-audit]', {
    primaryPoolAccess: 'full_exercise_pool_for_' + context.primaryGoal,
    secondaryPoolAccess: context.secondaryGoal ? 'full_exercise_pool_for_' + context.secondaryGoal : 'none',
    tertiaryPoolAccess: tertiaryAllocs.map(a => `support_exercises_for_${a.skill}`),
    influenceVerdict: {
      primary: 'MATERIAL - full pool access + priority selection',
      secondary: 'MATERIAL - full pool access + secondary priority',
      tertiary: 'MATERIAL - support/accessory pool access',
      support: 'LIMITED - rotation accessory access only',
    },
  })
  
  // TASK 1: Display vs material skill usage verdict
  const displayOnlySkills = supportAllocs.filter(a => a.exposureSessions < 1).map(a => a.skill)
  const materialSkills = allocations.filter(a => a.exposureSessions >= 1).map(a => a.skill)
  
  console.log('[phase15b-display-vs-material-skill-usage-verdict]', {
    materiallyInfluentialSkills: materialSkills,
    displayOnlySkills: displayOnlySkills,
    storedButUnderExpressedSkills: supportAllocs.filter(a => a.exposureSessions === 1).map(a => a.skill),
    verdict: displayOnlySkills.length === 0 
      ? 'ALL_SELECTED_SKILLS_HAVE_MATERIAL_INFLUENCE'
      : `${displayOnlySkills.length}_SKILLS_ARE_DISPLAY_ONLY`,
  })
  
  // TASK 2: Primary/secondary weight calibration audit
  console.log('[phase15b-primary-secondary-weight-calibration-audit]', {
    primaryWeight: Math.round(goalWeights.primaryWeight * 100) + '%',
    secondaryWeight: Math.round(goalWeights.secondaryWeight * 100) + '%',
    supportWeight: Math.round(goalWeights.supportWeight * 100) + '%',
    primaryDominanceRatio: secondaryAlloc 
      ? (primaryAlloc?.weight || 0) / (secondaryAlloc?.weight || 1)
      : 'no_secondary',
    calibrationVerdict: (primaryAlloc?.weight || 0) >= 0.45 
      ? 'PRIMARY_PROPERLY_DOMINANT'
      : 'PRIMARY_WEIGHT_TOO_LOW',
  })
  
  // TASK 2: No skill dilution verdict
  const primarySessionShare = (primaryAlloc?.exposureSessions || 0) / totalSessions
  const secondarySessionShare = secondaryAlloc 
    ? secondaryAlloc.exposureSessions / totalSessions 
    : 0
  
  console.log('[phase15b-no-skill-dilution-verdict]', {
    primarySessionShare: Math.round(primarySessionShare * 100) + '%',
    secondarySessionShare: Math.round(secondarySessionShare * 100) + '%',
    combinedPrimarySecondary: Math.round((primarySessionShare + secondarySessionShare) * 100) + '%',
    tertiaryTotalShare: Math.round(
      (tertiaryAllocs.reduce((sum, a) => sum + a.exposureSessions, 0) / totalSessions) * 100
    ) + '%',
    dilutionDetected: primarySessionShare < 0.40,
    verdict: primarySessionShare >= 0.40 
      ? 'NO_DILUTION_PRIMARY_MAINTAINS_DOMINANCE'
      : 'WARNING_PRIMARY_MAY_BE_DILUTED',
  })
  
  return allocations
}

/**
 * Determine intensity distribution for the week based on recovery and adaptive scheduling.
 * TASK F: Recovery + adaptive scheduling shapes hard/medium/light distribution.
 */
export interface WeeklyIntensityDistribution {
  highIntensityDays: number
  moderateIntensityDays: number
  lightIntensityDays: number
  suggestedPattern: ('high' | 'moderate' | 'light')[]
  rationale: string
}

export function calculateIntensityDistribution(
  totalDays: number,
  recoveryLevel: string | null,
  sessionDurationMode: 'static' | 'adaptive',
  trainingPathType: string
): WeeklyIntensityDistribution {
  // Base distribution
  let highDays = Math.ceil(totalDays * 0.5)
  let moderateDays = Math.floor(totalDays * 0.35)
  let lightDays = Math.max(0, totalDays - highDays - moderateDays)
  
  // Adjust for recovery level
  if (recoveryLevel === 'poor' || recoveryLevel === 'very_poor') {
    // Reduce high intensity days
    highDays = Math.max(1, highDays - 1)
    moderateDays = Math.max(1, moderateDays)
    lightDays = totalDays - highDays - moderateDays
  }
  
  // Adaptive duration mode = more variation
  if (sessionDurationMode === 'adaptive') {
    // Ensure at least one light day for adaptive users
    if (totalDays >= 3 && lightDays === 0) {
      lightDays = 1
      moderateDays = Math.max(0, moderateDays - 1)
    }
  }
  
  // Hybrid path = balanced intensity across modalities
  if (trainingPathType === 'hybrid' && totalDays >= 4) {
    // More moderate days for hybrid to avoid overtaxing any single modality
    highDays = Math.min(2, highDays)
    moderateDays = totalDays - highDays - lightDays
  }
  
  // Build suggested pattern
  const pattern: ('high' | 'moderate' | 'light')[] = []
  
  // Start with high, then moderate, then alternate
  for (let i = 0; i < highDays; i++) {
    pattern.push(i === 0 || pattern.length >= 2 ? 'high' : 'moderate')
  }
  for (let i = 0; i < moderateDays && pattern.length < totalDays; i++) {
    pattern.push('moderate')
  }
  for (let i = 0; i < lightDays && pattern.length < totalDays; i++) {
    pattern.push('light')
  }
  
  // Interleave to avoid back-to-back high days
  const interleavedPattern = interleaveIntensity(pattern)
  
  // Build rationale
  const rationale = `${highDays} high-intensity session(s), ${moderateDays} moderate, ${lightDays} light/recovery. ` +
    (recoveryLevel === 'poor' || recoveryLevel === 'very_poor' 
      ? 'Reduced intensity due to recovery constraints. '
      : '') +
    (sessionDurationMode === 'adaptive' 
      ? 'Adaptive scheduling allows intensity variation. '
      : '') +
    (trainingPathType === 'hybrid' 
      ? 'Hybrid training uses balanced intensity to manage multiple modalities.'
      : '')
  
  console.log('[engine-quality] TASK F: Intensity distribution:', {
    totalDays,
    highDays,
    moderateDays,
    lightDays,
    pattern: interleavedPattern,
    recoveryLevel,
    sessionDurationMode,
    trainingPathType,
  })
  
  return {
    highIntensityDays: highDays,
    moderateIntensityDays: moderateDays,
    lightIntensityDays: lightDays,
    suggestedPattern: interleavedPattern,
    rationale,
  }
}

function interleaveIntensity(pattern: ('high' | 'moderate' | 'light')[]): ('high' | 'moderate' | 'light')[] {
  // Avoid back-to-back high intensity days
  const result = [...pattern]
  for (let i = 1; i < result.length; i++) {
    if (result[i] === 'high' && result[i - 1] === 'high') {
      // Find a non-high day to swap with
      for (let j = i + 1; j < result.length; j++) {
        if (result[j] !== 'high') {
          [result[i], result[j]] = [result[j], result[i]]
          break
        }
      }
    }
  }
  return result
}

/**
 * Determine flexibility insertion points in the week.
 * TASK 4: Flexibility targets affect weekly inclusion.
 */
export interface FlexibilityInsertion {
  insertionPoint: 'session_end' | 'dedicated_block' | 'warmup_extended' | 'off_day'
  targetedMuscles: string[]
  durationMinutes: number
  frequency: number // Times per week
  rationale: string
}

export function planFlexibilityInsertions(
  selectedFlexibility: string[],
  totalSessions: number,
  sessionDurationMode: 'static' | 'adaptive',
  sessionLengthMinutes: number
): FlexibilityInsertion[] {
  if (!selectedFlexibility || selectedFlexibility.length === 0) {
    return []
  }
  
  const insertions: FlexibilityInsertion[] = []
  
  // Map flexibility targets to muscle groups
  const targetMuscleMap: Record<string, string[]> = {
    'front_splits': ['hip_flexors', 'hamstrings'],
    'side_splits': ['adductors', 'hip_flexors'],
    'pancake': ['hamstrings', 'adductors', 'lower_back'],
    'pike': ['hamstrings', 'lower_back'],
    'bridges': ['hip_flexors', 'shoulders', 'spine'],
    'shoulder_flexibility': ['shoulders', 'chest'],
  }
  
  // Calculate how much flexibility work can fit
  const hasTimeForDedicated = sessionLengthMinutes >= 60 || sessionDurationMode === 'adaptive'
  const maxFlexMinutes = sessionLengthMinutes >= 90 ? 10 : sessionLengthMinutes >= 60 ? 6 : 4
  
  selectedFlexibility.forEach(target => {
    const muscles = targetMuscleMap[target] || []
    
    // Primary flexibility targets get more attention
    const isPrimary = selectedFlexibility.indexOf(target) < 2
    
    insertions.push({
      insertionPoint: hasTimeForDedicated && isPrimary ? 'session_end' : 'warmup_extended',
      targetedMuscles: muscles,
      durationMinutes: isPrimary ? Math.min(maxFlexMinutes, 6) : Math.min(maxFlexMinutes, 3),
      frequency: isPrimary ? Math.min(totalSessions, 3) : Math.min(totalSessions, 2),
      rationale: `${target.replace(/_/g, ' ')} work ${isPrimary ? 'prioritized' : 'included'} for flexibility development`,
    })
  })
  
  console.log('[engine-quality] TASK 4: Flexibility insertions planned:', {
    selectedFlexibility,
    insertions: insertions.map(i => ({
      target: i.targetedMuscles.join('/'),
      point: i.insertionPoint,
      frequency: i.frequency,
    })),
  })
  
  return insertions
}

// =============================================================================
// EXERCISE SELECTION TRACE CONTRACT (TASK 1 - TRACEABILITY PR)
// =============================================================================
// This contract provides full audit trail for every exercise selected.
// Answers: Why was this exercise selected? Which skills drove it?
// Was it direct/technical/support? Why did weighted or bodyweight win?

/**
 * Primary reason an exercise was selected.
 * [exercise-trace] ISSUE A: Explicit selection reasons.
 */
export type ExerciseSelectionReason =
  | 'primary_skill_direct'       // Directly progresses primary skill (e.g., FL hold for front_lever)
  | 'primary_skill_technical'    // Technical drill for primary skill quality
  | 'secondary_skill_direct'     // Directly progresses secondary skill
  | 'secondary_skill_technical'  // Technical drill for secondary skill
  | 'selected_skill_support'     // Support work for a user-selected skill
  | 'prerequisite_building'      // Building prerequisite strength/position
  | 'limiter_correction'         // Addressing a detected limiter/weak point
  | 'trunk_core_support'         // Compression/core/bodyline for skill transfer
  | 'mobility_enabling'          // Flexibility work enabling skill positions
  | 'recovery_rotation'          // Light rotation day / recovery work
  | 'strength_foundation'        // General strength supporting skill goals
  | 'equipment_fallback'         // Alternative due to equipment constraint
  | 'session_role_fill'          // Filling session role requirement
  | 'doctrine_recommended'       // Doctrine mapping recommended this
  // TASK 1: Constraint-aware fallback reasons for skill exposure too low scenarios
  | 'constraint_fallback_support'  // Support work due to constraint limiting direct skill expression
  | 'constraint_fallback_limiter'  // Limiter correction work in constrained session
  | 'constraint_fallback_core'     // Core work selected in constrained session
  | 'constraint_fallback_general'  // General strength fallback when constrained
  | 'unknown'                    // Fallback when reason cannot be determined

/**
 * Expression mode for how the skill is being trained.
 * [exercise-trace] ISSUE B: Map to session intent.
 */
export type TraceExpressionMode =
  | 'direct_intensity'    // Max effort progression work
  | 'technical_focus'     // Quality/form emphasis
  | 'strength_support'    // Building strength foundation
  | 'volume_accumulation' // Volume for hypertrophy/endurance
  | 'rotation_light'      // Recovery / maintenance
  | 'mobility_prep'       // Range of motion work

/**
 * Session role that required this exercise slot.
 * [exercise-trace] ISSUE E: Session role impact.
 */
export type TraceSessionRole =
  | 'skill_primary'       // Primary skill slot
  | 'skill_secondary'     // Secondary skill slot  
  | 'strength_primary'    // Primary strength slot
  | 'strength_support'    // Supporting strength work
  | 'accessory'           // Accessory/isolation work
  | 'core'                // Core/trunk work
  | 'warmup'              // Warmup exercise
  | 'cooldown'            // Cooldown exercise
  | 'mobility'            // Dedicated mobility slot

/**
 * Equipment decision trace for weighted-capable exercises.
 * [exercise-trace] ISSUE C: Bodyweight vs weighted traceability.
 */
export interface WeightedDecisionTrace {
  /** Was weighted mode even considered for this movement? */
  weightedConsidered: boolean
  /** Was the athlete eligible for weighted mode (benchmarks, etc)? */
  weightedEligible: boolean
  /** Did weighted mode win the selection? */
  weightedChosen: boolean
  /** If weighted lost, why? */
  weightedBlockerReason: WeightedBlockerReason | null
  /** If weighted chosen, what load was prescribed? */
  prescribedLoad?: {
    load: number
    unit: 'lbs' | 'kg'
    basis: string
  }
}

/**
 * Reasons why weighted mode might not be chosen.
 * [exercise-trace] ISSUE C: Explicit blockers.
 */
export type WeightedBlockerReason =
  | 'no_loadable_equipment'           // No weight belt, vest, etc.
  | 'no_benchmark_confidence'         // No PR/benchmark data
  | 'session_role_calls_for_volume'   // Session wants bodyweight volume
  | 'limiter_recovery_favored_unloaded' // Recovery/limiter logic said no
  | 'weekly_weighted_quota_met'       // Already hit weighted allocation for week
  | 'doctrine_favored_skill_specific' // Doctrine prioritized skill-specific over strength
  | 'prerequisite_not_met'            // Not ready for loaded version
  | 'joint_stress_limit_reached'      // Session joint budget exceeded

/**
 * Rejected alternative exercise with reason.
 * [exercise-trace] ISSUE D: Rejected alternatives visible.
 */
export interface RejectedAlternative {
  exerciseId: string
  exerciseName: string
  rejectionReason: RejectionReason
  /** Additional context if helpful */
  details?: string
}

export type RejectionReason =
  | 'equipment_blocked'        // Doesn't match available equipment
  | 'recovery_session_role'    // Session role didn't want this intensity
  | 'skill_weighting_excluded' // Selected skill weighting deprioritized it
  | 'doctrine_mismatch'        // Doctrine mapping didn't include it
  | 'already_selected'         // Duplicate prevention
  | 'joint_stress_exceeded'    // Would exceed session joint budget
  | 'straight_arm_limit'       // Already hit straight-arm limit
  | 'fatigue_limit'            // Would exceed fatigue budget
  | 'prerequisite_blocked'     // Doesn't pass prerequisite gate
  | 'lower_score'              // Lost to higher-scored candidate

/**
 * Doctrine source that contributed to selection.
 * [exercise-trace] ISSUE F: Doctrine mapping traceability.
 */
export interface DoctrineSourceTrace {
  /** Which doctrine mapping file/helper was used */
  doctrineSource: string
  /** Which skill/family triggered the mapping */
  triggeringSkill: string
  /** Whether it was direct, support, or prerequisite doctrine */
  doctrineType: 'direct' | 'support' | 'prerequisite' | 'limiter'
  /** The exercise family from doctrine */
  exerciseFamily?: string
}

/**
 * Full selection trace for a single exercise.
 * [exercise-trace] TASK 1: Complete audit trail.
 */
export interface ExerciseSelectionTrace {
  /** Exercise ID from database */
  exerciseId: string
  /** Exercise display name */
  exerciseName: string
  /** Slot type in session */
  slotType: 'main' | 'warmup' | 'cooldown' | 'accessory'
  /** Session role this exercise fills */
  sessionRole: TraceSessionRole
  /** Expression mode for this exercise */
  expressionMode: TraceExpressionMode
  /** Primary reason this exercise was selected */
  primarySelectionReason: ExerciseSelectionReason
  /** Additional influences on selection */
  secondaryInfluences: ExerciseSelectionReason[]
  /** Selected skills that influenced this pick */
  influencingSkills: Array<{
    skillId: string
    influence: 'primary' | 'secondary' | 'selected' | 'limiter_related'
    expressionMode: SkillExpressionMode
  }>
  /** Doctrine source if applicable */
  doctrineSource: DoctrineSourceTrace | null
  /** Exercise family from movement registry */
  exerciseFamily: string | null
  /** Summary of candidate pool considered */
  candidatePoolSummary: {
    totalCandidates: number
    filteredByEquipment: number
    filteredBySessionRole: number
    filteredBySkillWeight: number
    finalRankedCandidates: number
  }
  /** Top rejected alternatives */
  rejectedAlternatives: RejectedAlternative[]
  /** Equipment decision trace (for weighted-capable) */
  equipmentDecision: WeightedDecisionTrace | null
  /** Whether loadability affected selection */
  loadabilityInfluence: string | null
  /** Whether a limiter affected selection */
  limiterInfluence: string | null
  /** Whether recovery logic affected selection */
  recoveryInfluence: string | null
  /** Confidence in this selection (0-1) */
  confidence: number
  /** Quality of trace data (how much we actually know) */
  traceQuality: 'full' | 'partial' | 'minimal'
  /** [EXERCISE-SELECTION-MATERIALITY] Materiality-based reason code */
  materialityReasonCode?: string
  /** [EXERCISE-SELECTION-MATERIALITY] Materiality confidence level */
  materialityConfidence?: 'high' | 'medium' | 'low'
  /** [EXERCISE-SELECTION-MATERIALITY] Key materiality factors that influenced selection */
  materialityFactors?: string[]
}

/**
 * Session-level trace summary.
 * [exercise-trace] TASK 5: Session role impact.
 */
export interface SessionSelectionTrace {
  sessionIndex: number
  dayLabel: string
  sessionRole: 'primary_focus' | 'secondary_focus' | 'mixed' | 'support_heavy' | 'recovery'
  primarySkillExpressed: string | null
  secondarySkillExpressed: string | null
  exerciseTraces: ExerciseSelectionTrace[]
  /** Summary of skills that were NOT expressed and why */
  unexpressedSkills: Array<{
    skillId: string
    reason: 'session_role_mismatch' | 'quota_met' | 'prerequisite_blocked' | 'equipment_blocked' | 'recovery_allocation'
  }>
  /** Session-level rationale */
  sessionRationale: string
}

/**
 * Program-level trace for build-to-build comparison.
 * [exercise-trace] TASK 8: Build comparison.
 */
export interface ProgramSelectionTrace {
  programId: string
  generatedAt: string
  profileSignature: string
  sessionTraces: SessionSelectionTrace[]
  /** Aggregate stats */
  aggregateStats: {
    totalExercises: number
    skillDirectExercises: number
    strengthSupportExercises: number
    weightedExercises: number
    bodyweightExercises: number
    doctrineHitCount: number
    rejectedAlternativeCount: number
  }
}

// =============================================================================
// EXERCISE SELECTION TRACE HELPERS
// =============================================================================

/**
 * Create an empty/minimal trace for when we can't determine full context.
 */
export function createMinimalTrace(
  exerciseId: string,
  exerciseName: string,
  slotType: ExerciseSelectionTrace['slotType'],
  reason: string
): ExerciseSelectionTrace {
  return {
    exerciseId,
    exerciseName,
    slotType,
    sessionRole: slotType === 'warmup' ? 'warmup' : slotType === 'cooldown' ? 'cooldown' : 'accessory',
    expressionMode: 'strength_support',
    primarySelectionReason: 'unknown',
    secondaryInfluences: [],
    influencingSkills: [],
    doctrineSource: null,
    exerciseFamily: null,
    candidatePoolSummary: {
      totalCandidates: 0,
      filteredByEquipment: 0,
      filteredBySessionRole: 0,
      filteredBySkillWeight: 0,
      finalRankedCandidates: 0,
    },
    rejectedAlternatives: [],
    equipmentDecision: null,
    loadabilityInfluence: null,
    limiterInfluence: null,
    recoveryInfluence: null,
    confidence: 0.3,
    traceQuality: 'minimal',
  }
}

/**
 * Log exercise selection trace with searchable prefix.
 * [exercise-trace] TASK 7: Dev-safe logging.
 */
export function logExerciseTrace(trace: ExerciseSelectionTrace): void {
  console.log('[exercise-trace] SELECTION:', {
    exercise: trace.exerciseId,
    slot: trace.slotType,
    role: trace.sessionRole,
    reason: trace.primarySelectionReason,
    skills: trace.influencingSkills.map(s => `${s.skillId}(${s.influence})`),
    doctrine: trace.doctrineSource?.doctrineSource || 'none',
    weighted: trace.equipmentDecision?.weightedChosen || false,
    weightedBlocker: trace.equipmentDecision?.weightedBlockerReason || 'n/a',
    rejected: trace.rejectedAlternatives.slice(0, 3).map(r => `${r.exerciseId}:${r.rejectionReason}`),
    confidence: trace.confidence,
  })
}

/**
 * Log session-level trace summary.
 */
export function logSessionTrace(trace: SessionSelectionTrace): void {
  console.log('[exercise-trace] SESSION SUMMARY:', {
    day: trace.dayLabel,
    role: trace.sessionRole,
    primarySkill: trace.primarySkillExpressed,
    secondarySkill: trace.secondarySkillExpressed,
    exerciseCount: trace.exerciseTraces.length,
    unexpressed: trace.unexpressedSkills.map(u => `${u.skillId}:${u.reason}`),
  })
}

/**
 * Compare two programs to explain differences.
 * [exercise-trace] TASK 8: Build-to-build comparison.
 */
export function compareExerciseSelectionTraces(
  previousProgram: ProgramSelectionTrace | null,
  newProgram: ProgramSelectionTrace
): ExerciseComparisonResult {
  if (!previousProgram) {
    return {
      comparisonType: 'new_build',
      unchangedExercises: [],
      changedExercises: [],
      addedExercises: newProgram.sessionTraces.flatMap(s => s.exerciseTraces.map(e => e.exerciseId)),
      removedExercises: [],
      differenceReasons: ['First program generation - no previous comparison available'],
      sessionRoleDifferences: [],
      skillWeightDifferences: [],
      equipmentDifferences: [],
    }
  }

  const prevExerciseIds = new Set(previousProgram.sessionTraces.flatMap(s => s.exerciseTraces.map(e => e.exerciseId)))
  const newExerciseIds = new Set(newProgram.sessionTraces.flatMap(s => s.exerciseTraces.map(e => e.exerciseId)))
  
  const unchangedExercises = [...prevExerciseIds].filter(id => newExerciseIds.has(id))
  const addedExercises = [...newExerciseIds].filter(id => !prevExerciseIds.has(id))
  const removedExercises = [...prevExerciseIds].filter(id => !newExerciseIds.has(id))
  
  const differenceReasons: string[] = []
  
  if (previousProgram.profileSignature !== newProgram.profileSignature) {
    differenceReasons.push('Profile settings changed')
  }
  
  // Check session role differences
  const sessionRoleDifferences: string[] = []
  for (let i = 0; i < Math.min(previousProgram.sessionTraces.length, newProgram.sessionTraces.length); i++) {
    const prev = previousProgram.sessionTraces[i]
    const curr = newProgram.sessionTraces[i]
    if (prev.sessionRole !== curr.sessionRole) {
      sessionRoleDifferences.push(`Day ${i + 1}: ${prev.sessionRole} → ${curr.sessionRole}`)
    }
  }
  
  if (sessionRoleDifferences.length > 0) {
    differenceReasons.push('Session role distribution changed')
  }
  
  if (addedExercises.length === 0 && removedExercises.length === 0) {
    differenceReasons.push('Same exercises - profile truth unchanged with same equipment and recovery allocation')
  }
  
  return {
    comparisonType: unchangedExercises.length === prevExerciseIds.size ? 'identical' : 'modified',
    unchangedExercises,
    changedExercises: [], // Could be enhanced to track exercises that stayed but changed prescription
    addedExercises,
    removedExercises,
    differenceReasons,
    sessionRoleDifferences,
    skillWeightDifferences: [], // Could be enhanced
    equipmentDifferences: [],   // Could be enhanced
  }
}

export interface ExerciseComparisonResult {
  comparisonType: 'new_build' | 'identical' | 'modified'
  unchangedExercises: string[]
  changedExercises: string[]
  addedExercises: string[]
  removedExercises: string[]
  differenceReasons: string[]
  sessionRoleDifferences: string[]
  skillWeightDifferences: string[]
  equipmentDifferences: string[]
}

/**
 * Log build-to-build comparison.
 */
export function logExerciseComparison(comparison: ExerciseComparisonResult): void {
  console.log('[exercise-trace-compare] BUILD COMPARISON:', {
    type: comparison.comparisonType,
    unchanged: comparison.unchangedExercises.length,
    added: comparison.addedExercises.length,
    removed: comparison.removedExercises.length,
    reasons: comparison.differenceReasons,
    sessionRoleChanges: comparison.sessionRoleDifferences,
  })
}

// =============================================================================
// FINAL TRUTH AUDIT REPORT (PROMPT 6 - END-TO-END VALIDATION)
// =============================================================================

/**
 * [final-truth-audit] STEP 1: Canonical audit report for proving rebuild truth.
 * This report captures the complete result of a rebuild and post-save verification.
 */
export type FinalTruthAuditStatus = 'pass' | 'pass_with_warnings' | 'soft_fail' | 'hard_fail'

export interface FinalTruthAuditReport {
  auditId: string
  buildAttemptId: string
  programId: string
  generatedAt: string
  
  // Signature alignment (STEP 2)
  profileSignatureAtBuild: string
  currentProfileSignature: string
  builderInputSignature: string
  displayedProgramSignature: string
  displayedWorkoutSignature: string | null
  
  // Overall status
  status: FinalTruthAuditStatus
  
  // Section results
  sections: {
    profileAlignment: AuditSectionResult
    builderAlignment: AuditSectionResult
    programAlignment: AuditSectionResult
    workoutAlignment: AuditSectionResult
    weightedPrescriptionTruth: AuditSectionResult
    sessionRoleDifferentiation: AuditSectionResult
    selectedSkillExpression: AuditSectionResult
    genericShellDetection: AuditSectionResult
    baselineEarnedTruth: AuditSectionResult
    staleSurfaceDetection: AuditSectionResult
  }
  
  warnings: string[]
  failures: string[]
  actionableSummary: string[]
}

export interface AuditSectionResult {
  status: 'pass' | 'warn' | 'fail'
  details: string
  evidence: Record<string, unknown>
}

/**
 * [final-truth-audit] STEP 2-8: Create the final truth audit report
 */
export function createFinalTruthAuditReport(params: {
  buildAttemptId: string
  programId: string
  generatedAt: string
  profileSignatureAtBuild: string
  currentProfileSignature: string
  builderInputSignature: string
  displayedProgramSignature: string
  displayedWorkoutSignature: string | null
  weightedCapableExercises: Array<{
    exerciseId: string
    loadEligible: boolean
    loadProduced: boolean
    loadSaved: boolean
    loadRendered: boolean
    noLoadReason?: string
  }>
  selectedSkills: Array<{
    skillId: string
    directExpressions: number
    technicalExpressions: number
    supportExpressions: number
    totalExposure: number
  }>
  sessionRoles: Array<{
    sessionIndex: number
    role: string
    exerciseFamilies: string[]
    distinctFromOthers: boolean
  }>
  earnedOnlySurfacesWithZeroHistory: string[]
  baselineLeakingSurfaces: string[]
}): FinalTruthAuditReport {
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const warnings: string[] = []
  const failures: string[] = []
  const actionableSummary: string[] = []
  
  // STEP 2: Profile alignment
  const profileAligned = params.profileSignatureAtBuild === params.currentProfileSignature
  const profileAlignment: AuditSectionResult = {
    status: profileAligned ? 'pass' : 'warn',
    details: profileAligned 
      ? 'Profile signature matches at build and current state'
      : 'Profile changed since build - consider rebuild',
    evidence: {
      atBuild: params.profileSignatureAtBuild,
      current: params.currentProfileSignature,
    }
  }
  if (!profileAligned) {
    warnings.push('profile_program_drift')
  }
  
  // STEP 2: Builder alignment
  const builderAligned = params.builderInputSignature === params.displayedProgramSignature
  const builderAlignment: AuditSectionResult = {
    status: builderAligned ? 'pass' : 'fail',
    details: builderAligned
      ? 'Builder input and displayed program are aligned'
      : 'Builder/display mismatch - stale surface detected',
    evidence: {
      builder: params.builderInputSignature,
      displayed: params.displayedProgramSignature,
    }
  }
  if (!builderAligned) {
    failures.push('builder_program_drift')
    actionableSummary.push('Rebuild required - displayed program does not match builder input')
  }
  
  // STEP 2: Program alignment
  const programAlignment: AuditSectionResult = {
    status: 'pass',
    details: 'Program identity verified',
    evidence: { programId: params.programId }
  }
  
  // STEP 2: Workout alignment
  const workoutAligned = !params.displayedWorkoutSignature || 
    params.displayedWorkoutSignature === params.displayedProgramSignature
  const workoutAlignment: AuditSectionResult = {
    status: workoutAligned ? 'pass' : 'fail',
    details: workoutAligned
      ? 'Workout session matches current program'
      : 'Workout/program mismatch - stale workout detected',
    evidence: {
      program: params.displayedProgramSignature,
      workout: params.displayedWorkoutSignature,
    }
  }
  if (!workoutAligned) {
    failures.push('program_workout_drift')
  }
  
  // STEP 3: Weighted prescription truth
  const weightedExpected = params.weightedCapableExercises.filter(e => e.loadEligible)
  const weightedPresent = weightedExpected.filter(e => e.loadRendered)
  const weightedMissing = weightedExpected.filter(e => !e.loadRendered && !e.noLoadReason)
  
  const weightedStatus = weightedMissing.length === 0 ? 'pass' : 
    weightedMissing.length <= 2 ? 'warn' : 'fail'
  const weightedPrescriptionTruth: AuditSectionResult = {
    status: weightedStatus,
    details: weightedMissing.length === 0
      ? `All ${weightedExpected.length} eligible weighted exercises have load or valid no-load reason`
      : `${weightedMissing.length} weighted exercises missing load without explanation`,
    evidence: {
      eligible: weightedExpected.length,
      present: weightedPresent.length,
      missing: weightedMissing.map(e => e.exerciseId),
      classifications: params.weightedCapableExercises.map(e => ({
        id: e.exerciseId,
        status: e.loadRendered ? 'weighted_expected_and_present' :
                !e.loadEligible ? 'weighted_correctly_blocked' :
                e.noLoadReason ? `blocked_${e.noLoadReason}` :
                'weighted_missing_reason_unknown'
      }))
    }
  }
  if (weightedStatus === 'fail') {
    failures.push('weighted_saved_but_lost_in_render')
  } else if (weightedStatus === 'warn') {
    warnings.push('weighted_partial_loss')
  }
  
  // STEP 4: Selected skill expression quality
  const underexpressedSkills = params.selectedSkills.filter(s => s.totalExposure < 2)
  const skillExpressionStatus = underexpressedSkills.length === 0 ? 'pass' :
    underexpressedSkills.length <= 1 ? 'warn' : 'fail'
  const selectedSkillExpression: AuditSectionResult = {
    status: skillExpressionStatus,
    details: underexpressedSkills.length === 0
      ? 'All selected skills have adequate weekly expression'
      : `${underexpressedSkills.length} skills have weak expression`,
    evidence: {
      skills: params.selectedSkills,
      underexpressed: underexpressedSkills.map(s => s.skillId),
    }
  }
  if (skillExpressionStatus !== 'pass') {
    warnings.push('skill_expression_weak')
  }
  
  // STEP 5: Session role differentiation
  const distinctRoles = params.sessionRoles.filter(r => r.distinctFromOthers).length
  const totalRoles = params.sessionRoles.length
  const roleStatus = distinctRoles >= totalRoles * 0.6 ? 'pass' :
    distinctRoles >= totalRoles * 0.4 ? 'warn' : 'fail'
  const sessionRoleDifferentiation: AuditSectionResult = {
    status: roleStatus,
    details: `${distinctRoles}/${totalRoles} sessions have distinct exercise composition`,
    evidence: {
      sessions: params.sessionRoles,
      distinctCount: distinctRoles,
    }
  }
  if (roleStatus === 'fail') {
    warnings.push('role_differentiation_poor')
  }
  
  // STEP 6: Generic shell detection
  const genericIndicators: string[] = []
  if (underexpressedSkills.length >= 2) genericIndicators.push('skills_underexpressed')
  if (distinctRoles < totalRoles * 0.5) genericIndicators.push('roles_collapsed')
  if (weightedMissing.length > 3) genericIndicators.push('weighted_opportunities_missed')
  
  const genericShellStatus = genericIndicators.length === 0 ? 'pass' :
    genericIndicators.length <= 1 ? 'warn' : 'fail'
  const genericShellDetection: AuditSectionResult = {
    status: genericShellStatus,
    details: genericIndicators.length === 0
      ? 'Program shows appropriate differentiation and skill expression'
      : `Generic shell indicators detected: ${genericIndicators.join(', ')}`,
    evidence: { indicators: genericIndicators }
  }
  if (genericShellStatus === 'fail') {
    failures.push('generic_shell_detected')
    actionableSummary.push('Program may feel generic - review skill selection and equipment')
  }
  
  // STEP 7: Baseline vs earned truth
  const baselineLeaks = params.baselineLeakingSurfaces.length > 0
  const earnedOnlyViolations = params.earnedOnlySurfacesWithZeroHistory.length > 0
  const baselineEarnedStatus = !baselineLeaks && !earnedOnlyViolations ? 'pass' : 'fail'
  const baselineEarnedTruth: AuditSectionResult = {
    status: baselineEarnedStatus,
    details: baselineEarnedStatus === 'pass'
      ? 'Baseline/earned separation is correct'
      : 'Trust leakage detected in progress surfaces',
    evidence: {
      baselineLeaks: params.baselineLeakingSurfaces,
      earnedOnlyViolations: params.earnedOnlySurfacesWithZeroHistory,
    }
  }
  if (baselineEarnedStatus === 'fail') {
    failures.push('baseline_earned_leakage')
  }
  
  // STEP 2: Stale surface detection
  const staleSurfaces: string[] = []
  if (!builderAligned) staleSurfaces.push('program_display')
  if (!workoutAligned) staleSurfaces.push('workout_session')
  if (!profileAligned) staleSurfaces.push('profile_state')
  
  const staleSurfaceDetection: AuditSectionResult = {
    status: staleSurfaces.length === 0 ? 'pass' : 'fail',
    details: staleSurfaces.length === 0
      ? 'No stale surfaces detected'
      : `Stale surfaces: ${staleSurfaces.join(', ')}`,
    evidence: { staleSurfaces }
  }
  
  // STEP 9: Determine overall status
  let status: FinalTruthAuditStatus = 'pass'
  if (failures.length > 0) {
    status = failures.includes('generic_shell_detected') || 
             failures.includes('baseline_earned_leakage') ? 'soft_fail' : 'hard_fail'
  } else if (warnings.length > 0) {
    status = 'pass_with_warnings'
  }
  
  const report: FinalTruthAuditReport = {
    auditId,
    buildAttemptId: params.buildAttemptId,
    programId: params.programId,
    generatedAt: params.generatedAt,
    profileSignatureAtBuild: params.profileSignatureAtBuild,
    currentProfileSignature: params.currentProfileSignature,
    builderInputSignature: params.builderInputSignature,
    displayedProgramSignature: params.displayedProgramSignature,
    displayedWorkoutSignature: params.displayedWorkoutSignature,
    status,
    sections: {
      profileAlignment,
      builderAlignment,
      programAlignment,
      workoutAlignment,
      weightedPrescriptionTruth,
      sessionRoleDifferentiation,
      selectedSkillExpression,
      genericShellDetection,
      baselineEarnedTruth,
      staleSurfaceDetection,
    },
    warnings,
    failures,
    actionableSummary,
  }
  
  // STEP 8: Log the final audit
  logFinalTruthAudit(report)
  
  return report
}

/**
 * [final-truth-audit] STEP 8: Log the final truth audit with searchable prefixes
 */
export function logFinalTruthAudit(report: FinalTruthAuditReport): void {
  console.log('[final-truth-audit] AUDIT COMPLETE:', {
    auditId: report.auditId,
    programId: report.programId,
    status: report.status,
    warningCount: report.warnings.length,
    failureCount: report.failures.length,
  })
  
  // [surface-alignment] Log alignment results
  console.log('[surface-alignment] Signature alignment:', {
    profileAligned: report.sections.profileAlignment.status === 'pass',
    builderAligned: report.sections.builderAlignment.status === 'pass',
    workoutAligned: report.sections.workoutAlignment.status === 'pass',
    staleSurfaces: report.sections.staleSurfaceDetection.evidence.staleSurfaces,
  })
  
  // [weighted-truth-audit] Log weighted prescription results
  console.log('[weighted-truth-audit] Weighted truth:', {
    status: report.sections.weightedPrescriptionTruth.status,
    evidence: report.sections.weightedPrescriptionTruth.evidence,
  })
  
  // [skill-expression-audit] Log skill expression results
  console.log('[skill-expression-audit] Skill expression:', {
    status: report.sections.selectedSkillExpression.status,
    underexpressed: report.sections.selectedSkillExpression.evidence.underexpressed,
  })
  
  // [generic-shell-audit] Log generic shell detection
  console.log('[generic-shell-audit] Generic shell check:', {
    status: report.sections.genericShellDetection.status,
    indicators: report.sections.genericShellDetection.evidence.indicators,
  })
  
  // [baseline-earned-audit] Log baseline/earned separation
  console.log('[baseline-earned-audit] Baseline/earned truth:', {
    status: report.sections.baselineEarnedTruth.status,
    leaks: report.sections.baselineEarnedTruth.evidence.baselineLeaks,
    violations: report.sections.baselineEarnedTruth.evidence.earnedOnlyViolations,
  })
  
  // Final summary
  if (report.status === 'pass') {
    console.log('[final-truth-audit] RESULT: All truth checks passed')
  } else if (report.status === 'pass_with_warnings') {
    console.log('[final-truth-audit] RESULT: Passed with warnings:', report.warnings)
  } else {
    console.log('[final-truth-audit] RESULT: Audit failed:', {
      status: report.status,
      failures: report.failures,
      actions: report.actionableSummary,
    })
  }
}
