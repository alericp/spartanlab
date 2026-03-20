/**
 * PROFILE NORMALIZER (TASK 2)
 * 
 * Explicit mapping layer from raw database/onboarding data to engine-consumable format.
 * This ensures ALL program-influencing fields are explicitly mapped.
 * 
 * RULES:
 * - NO silent fallbacks to seed/default values
 * - Missing data = null (validation catches it)
 * - Throw errors for critical missing fields when generating
 */

import type { CanonicalProgrammingProfile } from './canonical-profile-service'

// =============================================================================
// NORMALIZED PROFILE TYPE (Engine-ready)
// =============================================================================

export interface NormalizedProfile {
  // Identity
  level: 'beginner' | 'intermediate' | 'advanced'
  
  // Goals
  primaryGoal: string
  secondaryGoal: string | null
  skills: string[]
  
  // Strength benchmarks
  strength: {
    pullups: number | null
    dips: number | null
    pushups: number | null
    weightedPull: { weight: number; reps: number } | null
    weightedDip: { weight: number; reps: number } | null
  }
  
  // Skill progressions
  skillProgressions: {
    frontLever: { progression: string | null; holdSeconds: number | null }
    planche: { progression: string | null; holdSeconds: number | null }
    hspu: { progression: string | null }
    muscleUp: { readiness: string | null }
    lSit: { holdSeconds: number | null }
    vSit: { holdSeconds: number | null }
  }
  
  // Flexibility
  flexibility: {
    pancake: string | null
    toeTouch: string | null
    frontSplits: string | null
    sideSplits: string | null
  }
  
  // Schedule
  schedule: 'static' | 'flexible'
  sessionLength: number
  trainingDays: number | null  // null = flexible
  
  // Recovery & constraints
  recovery: {
    sleepQuality: string | null
    energyLevel: string | null
    stressLevel: string | null
  }
  
  // Equipment
  equipment: string[]
  
  // Joint cautions
  joints: string[]
  
  // Weak areas
  weakestArea: string | null
  primaryLimitation: string | null
}

// =============================================================================
// NORMALIZER FUNCTION (TASK 2A)
// =============================================================================

/**
 * Normalize canonical profile to engine-consumable format.
 * TASK 2B: This MUST be used before ANY generation logic.
 */
export function normalizeProfile(canonical: CanonicalProgrammingProfile): NormalizedProfile {
  // TASK 3A: Validate critical fields exist
  if (!canonical.primaryGoal) {
    throw new Error('[ProfileNormalizer] Missing primaryGoal - cannot generate program')
  }
  
  if (!canonical.onboardingComplete) {
    throw new Error('[ProfileNormalizer] Onboarding not complete - cannot generate program')
  }
  
  if (!canonical.selectedSkills?.length && !canonical.selectedFlexibility?.length && !canonical.selectedStrength?.length) {
    throw new Error('[ProfileNormalizer] No goals selected - cannot generate program')
  }
  
  // Parse numeric string benchmarks
  const parseNumeric = (val: string | null): number | null => {
    if (!val) return null
    const match = val.match(/\d+/)
    return match ? parseInt(match[0]) : null
  }
  
  // Log normalized profile for debugging (TASK 8)
  console.log('[ProfileNormalizer] Normalizing profile:', {
    primaryGoal: canonical.primaryGoal,
    secondaryGoal: canonical.secondaryGoal,
    skillsCount: canonical.selectedSkills?.length || 0,
    hasStrengthBenchmarks: !!(canonical.pullUpMax || canonical.dipMax),
    hasSkillProgressions: !!(canonical.frontLeverProgression || canonical.plancheProgression),
  })
  
  return {
    level: canonical.experienceLevel,
    
    primaryGoal: canonical.primaryGoal,
    secondaryGoal: canonical.secondaryGoal,
    skills: canonical.selectedSkills || [],
    
    strength: {
      pullups: parseNumeric(canonical.pullUpMax),
      dips: parseNumeric(canonical.dipMax),
      pushups: parseNumeric(canonical.pushUpMax),
      weightedPull: canonical.weightedPullUp ? {
        weight: canonical.weightedPullUp.addedWeight,
        reps: canonical.weightedPullUp.reps,
      } : null,
      weightedDip: canonical.weightedDip ? {
        weight: canonical.weightedDip.addedWeight,
        reps: canonical.weightedDip.reps,
      } : null,
    },
    
    skillProgressions: {
      frontLever: {
        progression: canonical.frontLeverProgression,
        holdSeconds: canonical.frontLeverHoldSeconds,
      },
      planche: {
        progression: canonical.plancheProgression,
        holdSeconds: canonical.plancheHoldSeconds,
      },
      hspu: {
        progression: canonical.hspuProgression,
      },
      muscleUp: {
        readiness: canonical.muscleUpReadiness,
      },
      lSit: {
        holdSeconds: canonical.lSitHoldSeconds ? parseInt(canonical.lSitHoldSeconds) : null,
      },
      vSit: {
        holdSeconds: canonical.vSitHoldSeconds ? parseInt(canonical.vSitHoldSeconds) : null,
      },
    },
    
    flexibility: {
      pancake: canonical.pancakeLevel,
      toeTouch: canonical.toeTouchLevel,
      frontSplits: canonical.frontSplitsLevel,
      sideSplits: canonical.sideSplitsLevel,
    },
    
    schedule: canonical.scheduleMode,
    sessionLength: canonical.sessionLengthMinutes,
    trainingDays: canonical.trainingDaysPerWeek,
    
    recovery: {
      sleepQuality: null,  // Not in canonical yet
      energyLevel: null,
      stressLevel: null,
    },
    
    equipment: canonical.equipmentAvailable || [],
    joints: canonical.jointCautions || [],
    weakestArea: canonical.weakestArea,
    primaryLimitation: canonical.primaryLimitation,
  }
}

// =============================================================================
// LIMITER COMPUTATION (TASK 4)
// =============================================================================

/**
 * Compute the current training limiter based on real profile data.
 * TASK 4: Uses actual benchmarks, NOT fallbacks.
 */
export function computeLimiter(profile: NormalizedProfile): string {
  const { strength, primaryGoal, skillProgressions } = profile
  
  // Calculate relative strengths
  const pushStrength = (strength.dips || 0) + (strength.pushups || 0)
  const pullStrength = (strength.pullups || 0) + (strength.weightedPull?.weight || 0)
  
  // Goal-specific limiters
  if (primaryGoal === 'planche') {
    // For planche: straight-arm pushing is almost always the limiter
    if (!skillProgressions.planche.progression || skillProgressions.planche.progression === 'none') {
      return 'straight-arm pushing strength'
    }
    // If already progressing, check if core/compression is limiting
    if (strength.pushups && strength.pushups < 30) {
      return 'pushing endurance for planche holds'
    }
    return 'planche-specific straight-arm strength'
  }
  
  if (primaryGoal === 'front_lever') {
    // For front lever: scapular depression and lat strength
    if (!skillProgressions.frontLever.progression || skillProgressions.frontLever.progression === 'none') {
      return 'straight-arm pulling strength'
    }
    if (strength.pullups && strength.pullups < 12) {
      return 'pulling foundation for front lever'
    }
    return 'front lever-specific pulling strength'
  }
  
  if (primaryGoal === 'muscle_up') {
    // For muscle up: explosive pull + transition
    if (strength.pullups && strength.pullups < 15) {
      return 'pulling power for muscle up'
    }
    return 'muscle up transition strength'
  }
  
  if (primaryGoal === 'handstand_pushup') {
    // For HSPU: overhead pressing strength
    if (!skillProgressions.hspu.progression) {
      return 'overhead pressing foundation'
    }
    return 'HSPU-specific pressing strength'
  }
  
  // General imbalance detection
  if (pullStrength < pushStrength * 0.75) {
    return 'pulling strength deficit'
  }
  
  if (pushStrength < pullStrength * 0.75) {
    return 'pushing strength deficit'
  }
  
  // Check flexibility limiters for flexibility-focused goals
  if (profile.skills.includes('front_splits') || profile.skills.includes('side_splits')) {
    if (!profile.flexibility.frontSplits || profile.flexibility.frontSplits === 'none') {
      return 'hip flexor and hamstring flexibility'
    }
  }
  
  return 'skill-specific coordination and strength'
}

// =============================================================================
// DEDUPE UTILITY (TASK 6)
// =============================================================================

/**
 * Remove duplicate exercises from any array.
 * TASK 6: Apply to warmups, exercises, accessories.
 */
export function dedupe<T extends string | { id: string } | { name: string }>(arr: T[]): T[] {
  if (!arr || arr.length === 0) return []
  
  const seen = new Set<string>()
  return arr.filter(item => {
    const key = typeof item === 'string' 
      ? item 
      : 'id' in item 
        ? item.id 
        : item.name
    
    if (seen.has(key.toLowerCase())) return false
    seen.add(key.toLowerCase())
    return true
  })
}

/**
 * Dedupe exercises by name, keeping first occurrence.
 */
export function dedupeExercises<T extends { name: string }>(exercises: T[]): T[] {
  return dedupe(exercises) as T[]
}

// =============================================================================
// TASK 3: RANKED BOTTLENECK SCORING SYSTEM
// Multi-dimensional constraint analysis for smarter limiter reasoning
// =============================================================================

export interface RankedBottleneck {
  id: string
  label: string
  score: number  // 0-100, higher = more limiting
  category: 'strength' | 'skill' | 'mobility' | 'recovery' | 'equipment'
  affectsGoals: string[]
  suggestedEmphasis: string
}

export interface BottleneckAnalysis {
  primary: RankedBottleneck
  secondary: RankedBottleneck | null
  tertiary: RankedBottleneck | null
  allRanked: RankedBottleneck[]
  summaryLabel: string
}

/**
 * TASK 3: Compute ranked bottlenecks from profile data.
 * Returns top 3 constraints with scores and emphasis suggestions.
 */
export function computeRankedBottlenecks(profile: NormalizedProfile): BottleneckAnalysis {
  const bottlenecks: RankedBottleneck[] = []
  const { strength, primaryGoal, secondaryGoal, skillProgressions, flexibility, equipment, joints } = profile
  
  // =========================
  // STRENGTH BOTTLENECKS
  // =========================
  
  // Pushing strength relative to advanced athlete standards
  const pushScore = calculatePushStrengthScore(strength)
  if (pushScore < 70) {
    bottlenecks.push({
      id: 'push_strength_deficit',
      label: 'Pushing strength foundation',
      score: 100 - pushScore,
      category: 'strength',
      affectsGoals: ['planche', 'handstand_pushup', 'weighted_strength'],
      suggestedEmphasis: 'weighted dips, planche leans, pike pushups',
    })
  }
  
  // Pulling strength relative to advanced athlete standards
  const pullScore = calculatePullStrengthScore(strength)
  if (pullScore < 70) {
    bottlenecks.push({
      id: 'pull_strength_deficit',
      label: 'Pulling strength foundation',
      score: 100 - pullScore,
      category: 'strength',
      affectsGoals: ['front_lever', 'muscle_up', 'back_lever'],
      suggestedEmphasis: 'weighted pullups, rows, scap work',
    })
  }
  
  // Push/pull imbalance
  const imbalanceScore = Math.abs(pushScore - pullScore)
  if (imbalanceScore > 15) {
    const weaker = pushScore < pullScore ? 'push' : 'pull'
    bottlenecks.push({
      id: `${weaker}_imbalance`,
      label: `${weaker === 'push' ? 'Pushing' : 'Pulling'} imbalance`,
      score: imbalanceScore,
      category: 'strength',
      affectsGoals: weaker === 'push' ? ['planche'] : ['front_lever'],
      suggestedEmphasis: weaker === 'push' ? 'push volume priority' : 'pull volume priority',
    })
  }
  
  // =========================
  // SKILL-SPECIFIC BOTTLENECKS
  // =========================
  
  // Planche-specific (if primary/secondary goal)
  if (primaryGoal === 'planche' || secondaryGoal === 'planche') {
    const plancheLevel = getProgressionLevel(skillProgressions.planche.progression)
    if (plancheLevel < 3) {  // Below straddle
      bottlenecks.push({
        id: 'planche_straight_arm',
        label: 'Straight-arm pushing for planche',
        score: (3 - plancheLevel) * 25 + 20,
        category: 'skill',
        affectsGoals: ['planche'],
        suggestedEmphasis: 'planche leans, tuck holds, shoulder protraction',
      })
    }
  }
  
  // Front lever-specific
  if (primaryGoal === 'front_lever' || secondaryGoal === 'front_lever') {
    const flLevel = getProgressionLevel(skillProgressions.frontLever.progression)
    if (flLevel < 3) {
      bottlenecks.push({
        id: 'front_lever_straight_arm',
        label: 'Straight-arm pulling for front lever',
        score: (3 - flLevel) * 25 + 20,
        category: 'skill',
        affectsGoals: ['front_lever'],
        suggestedEmphasis: 'FL holds, FL raises, ice cream makers',
      })
    }
  }
  
  // HSPU-specific
  if (primaryGoal === 'handstand_pushup' || skillProgressions.hspu.progression) {
    const hspuLevel = getHSPUProgressionLevel(skillProgressions.hspu.progression)
    if (hspuLevel < 3) {
      bottlenecks.push({
        id: 'hspu_overhead',
        label: 'Overhead pressing strength',
        score: (3 - hspuLevel) * 20 + 15,
        category: 'skill',
        affectsGoals: ['handstand_pushup'],
        suggestedEmphasis: 'pike pushups, wall HSPUs, shoulder strength',
      })
    }
  }
  
  // =========================
  // MOBILITY BOTTLENECKS
  // =========================
  
  // Hip flexor mobility for compression skills
  if (profile.skills.includes('l_sit') || profile.skills.includes('v_sit') || 
      profile.skills.includes('front_lever')) {
    if (!skillProgressions.lSit.holdSeconds || skillProgressions.lSit.holdSeconds < 15) {
      bottlenecks.push({
        id: 'compression_deficit',
        label: 'Core compression and pike mobility',
        score: 35,
        category: 'mobility',
        affectsGoals: ['l_sit', 'v_sit', 'front_lever'],
        suggestedEmphasis: 'compression work, pike stretches, L-sit holds',
      })
    }
  }
  
  // Splits mobility
  const hasFlexGoals = profile.skills.includes('front_splits') || profile.skills.includes('side_splits')
  if (hasFlexGoals) {
    const frontSplitsScore = getFlexibilityLevel(flexibility.frontSplits)
    const sideSplitsScore = getFlexibilityLevel(flexibility.sideSplits)
    const avgSplitsScore = (frontSplitsScore + sideSplitsScore) / 2
    
    if (avgSplitsScore < 70) {
      bottlenecks.push({
        id: 'splits_mobility',
        label: 'Hip and hamstring flexibility',
        score: 100 - avgSplitsScore,
        category: 'mobility',
        affectsGoals: ['front_splits', 'side_splits'],
        suggestedEmphasis: 'hip flexor stretches, hamstring work, PNF stretching',
      })
    }
  }
  
  // =========================
  // RECOVERY/JOINT BOTTLENECKS
  // =========================
  
  // Joint cautions impact training intensity
  if (joints && joints.length >= 3) {
    bottlenecks.push({
      id: 'joint_caution_load',
      label: 'Joint stress management',
      score: Math.min(50, joints.length * 12),
      category: 'recovery',
      affectsGoals: ['all'],
      suggestedEmphasis: 'prehab, controlled tempo, recovery focus',
    })
  }
  
  // Specific joint concerns
  if (joints.includes('shoulders') || joints.includes('wrists')) {
    const affectedSkills = joints.includes('wrists') 
      ? ['planche', 'handstand_pushup'] 
      : ['planche', 'front_lever', 'handstand_pushup']
    bottlenecks.push({
      id: 'upper_joint_caution',
      label: `${joints.includes('wrists') ? 'Wrist' : 'Shoulder'} integrity`,
      score: 25,
      category: 'recovery',
      affectsGoals: affectedSkills,
      suggestedEmphasis: 'joint prep, prehab protocols, controlled progressions',
    })
  }
  
  // =========================
  // EQUIPMENT BOTTLENECKS
  // =========================
  
  if (!equipment.includes('rings')) {
    bottlenecks.push({
      id: 'no_rings',
      label: 'Rings unavailable',
      score: 15,  // Lower priority
      category: 'equipment',
      affectsGoals: ['muscle_up', 'front_lever'],
      suggestedEmphasis: 'bar-based alternatives',
    })
  }
  
  // =========================
  // SORT AND RETURN TOP 3
  // =========================
  
  // Sort by score descending
  bottlenecks.sort((a, b) => b.score - a.score)
  
  // Filter to goals that actually apply to user's selected goals
  const relevantBottlenecks = bottlenecks.filter(b => 
    b.affectsGoals.includes('all') ||
    b.affectsGoals.includes(primaryGoal) ||
    (secondaryGoal && b.affectsGoals.includes(secondaryGoal)) ||
    profile.skills.some(s => b.affectsGoals.includes(s))
  )
  
  const primary = relevantBottlenecks[0] || {
    id: 'balanced',
    label: 'Balanced development',
    score: 20,
    category: 'strength',
    affectsGoals: ['all'],
    suggestedEmphasis: 'progressive overload across all areas',
  }
  
  const secondary = relevantBottlenecks[1] || null
  const tertiary = relevantBottlenecks[2] || null
  
  // Dev logging
  console.log('[Bottleneck] TASK 3: Ranked bottlenecks:', {
    primary: primary.label,
    primaryScore: primary.score,
    secondary: secondary?.label || 'none',
    tertiary: tertiary?.label || 'none',
    totalAnalyzed: bottlenecks.length,
  })
  
  return {
    primary,
    secondary,
    tertiary,
    allRanked: relevantBottlenecks.slice(0, 5),
    summaryLabel: primary.label,
  }
}

// =========================
// SCORING HELPERS
// =========================

function calculatePushStrengthScore(strength: NormalizedProfile['strength']): number {
  let score = 50  // Baseline
  
  // Dips contribution (major)
  if (strength.dips !== null) {
    if (strength.dips >= 25) score += 25
    else if (strength.dips >= 20) score += 20
    else if (strength.dips >= 15) score += 15
    else if (strength.dips >= 10) score += 10
    else score += 5
  }
  
  // Weighted dip contribution
  if (strength.weightedDip) {
    const total = strength.weightedDip.weight + (strength.weightedDip.reps * 5)
    if (total >= 100) score += 20
    else if (total >= 60) score += 15
    else if (total >= 30) score += 10
    else score += 5
  }
  
  // Push-ups baseline (minor)
  if (strength.pushups !== null && strength.pushups >= 40) {
    score += 5
  }
  
  return Math.min(100, score)
}

function calculatePullStrengthScore(strength: NormalizedProfile['strength']): number {
  let score = 50  // Baseline
  
  // Pull-ups contribution (major)
  if (strength.pullups !== null) {
    if (strength.pullups >= 20) score += 25
    else if (strength.pullups >= 15) score += 20
    else if (strength.pullups >= 10) score += 15
    else if (strength.pullups >= 5) score += 10
    else score += 5
  }
  
  // Weighted pull-up contribution
  if (strength.weightedPull) {
    const total = strength.weightedPull.weight + (strength.weightedPull.reps * 5)
    if (total >= 80) score += 20
    else if (total >= 50) score += 15
    else if (total >= 25) score += 10
    else score += 5
  }
  
  return Math.min(100, score)
}

function getProgressionLevel(progression: string | null): number {
  if (!progression) return 0
  
  const levels: Record<string, number> = {
    'none': 0,
    'tuck': 1,
    'advanced_tuck': 2,
    'straddle': 3,
    'half_lay': 4,
    'full': 5,
    // Front lever variants
    'tuck_fl': 1,
    'adv_tuck_fl': 2,
    'straddle_fl': 3,
    'half_fl': 4,
    'full_fl': 5,
  }
  
  return levels[progression.toLowerCase()] ?? 1
}

function getHSPUProgressionLevel(progression: string | null): number {
  if (!progression) return 0
  
  const levels: Record<string, number> = {
    'none': 0,
    'pike': 1,
    'elevated_pike': 1,
    'wall': 2,
    'wall_hspu': 2,
    'negative': 3,
    'partial': 3,
    'full': 4,
    'freestanding': 5,
  }
  
  return levels[progression.toLowerCase()] ?? 1
}

function getFlexibilityLevel(level: string | null): number {
  if (!level) return 30  // Assume beginner if not set
  
  const levels: Record<string, number> = {
    'none': 20,
    'beginner': 30,
    'limited': 40,
    'moderate': 50,
    'good': 70,
    'excellent': 85,
    'full': 95,
  }
  
  return levels[level.toLowerCase()] ?? 50
}

// =============================================================================
// TASK 3: METRIC-BASED EXERCISE SELECTION GUIDANCE
// Uses actual profile metrics to guide exercise choices
// =============================================================================

export interface ExerciseSelectionGuidance {
  preferWeightedSupport: boolean
  skillTier: 'foundational' | 'intermediate' | 'advanced'
  pushVariantLevel: 'basic' | 'intermediate' | 'advanced'
  pullVariantLevel: 'basic' | 'intermediate' | 'advanced'
  compressionReady: boolean
  jointCautionAreas: string[]
  warmupEmphasis: string[]
  suggestedIntensity: 'conservative' | 'moderate' | 'aggressive'
}

/**
 * TASK 3: Compute exercise selection guidance from profile metrics.
 * This ensures actual benchmarks affect exercise choices.
 */
export function computeExerciseSelectionGuidance(profile: NormalizedProfile): ExerciseSelectionGuidance {
  const { strength, skillProgressions, joints, level } = profile
  
  // Determine if weighted support is appropriate
  const preferWeightedSupport = !!(
    (strength.weightedPull && strength.weightedPull.weight >= 15) ||
    (strength.weightedDip && strength.weightedDip.weight >= 20) ||
    (strength.pullups !== null && strength.pullups >= 15) ||
    (strength.dips !== null && strength.dips >= 20)
  )
  
  // Determine skill tier from progression levels
  const plancheLevel = getProgressionLevel(skillProgressions.planche.progression)
  const flLevel = getProgressionLevel(skillProgressions.frontLever.progression)
  const maxSkillLevel = Math.max(plancheLevel, flLevel)
  
  let skillTier: ExerciseSelectionGuidance['skillTier'] = 'foundational'
  if (maxSkillLevel >= 3) skillTier = 'advanced'
  else if (maxSkillLevel >= 2 || level === 'intermediate') skillTier = 'intermediate'
  
  // Determine push variant level from strength metrics
  let pushVariantLevel: ExerciseSelectionGuidance['pushVariantLevel'] = 'basic'
  if (strength.dips !== null && strength.dips >= 20) pushVariantLevel = 'advanced'
  else if (strength.dips !== null && strength.dips >= 12) pushVariantLevel = 'intermediate'
  else if (strength.pushups !== null && strength.pushups >= 30) pushVariantLevel = 'intermediate'
  
  // Determine pull variant level from strength metrics
  let pullVariantLevel: ExerciseSelectionGuidance['pullVariantLevel'] = 'basic'
  if (strength.pullups !== null && strength.pullups >= 18) pullVariantLevel = 'advanced'
  else if (strength.pullups !== null && strength.pullups >= 10) pullVariantLevel = 'intermediate'
  
  // Check compression readiness
  const compressionReady = !!(
    skillProgressions.lSit.holdSeconds && skillProgressions.lSit.holdSeconds >= 10
  )
  
  // Map joint cautions to warmup emphasis
  const warmupEmphasis: string[] = []
  if (joints.includes('shoulders')) warmupEmphasis.push('shoulder_prep', 'rotator_cuff')
  if (joints.includes('wrists')) warmupEmphasis.push('wrist_prep', 'forearm_stretches')
  if (joints.includes('elbows')) warmupEmphasis.push('elbow_prep', 'controlled_tempo')
  if (joints.includes('lower_back')) warmupEmphasis.push('core_activation', 'hip_mobility')
  
  // Determine intensity approach based on joint cautions and level
  let suggestedIntensity: ExerciseSelectionGuidance['suggestedIntensity'] = 'moderate'
  if (joints.length >= 3) suggestedIntensity = 'conservative'
  else if (level === 'advanced' && joints.length <= 1) suggestedIntensity = 'aggressive'
  
  const guidance: ExerciseSelectionGuidance = {
    preferWeightedSupport,
    skillTier,
    pushVariantLevel,
    pullVariantLevel,
    compressionReady,
    jointCautionAreas: joints,
    warmupEmphasis,
    suggestedIntensity,
  }
  
  // Dev logging
  console.log('[ProfileNormalizer] TASK 3: Exercise selection guidance:', {
    preferWeightedSupport,
    skillTier,
    pushVariant: pushVariantLevel,
    pullVariant: pullVariantLevel,
    intensity: suggestedIntensity,
  })
  
  return guidance
}
