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
  
  // [profile-completeness] TASK 7: Log normalized profile with new field awareness
  console.log('[profile-completeness] Normalizing profile for engine:', {
    primaryGoal: canonical.primaryGoal,
    secondaryGoal: canonical.secondaryGoal,
    skillsCount: canonical.selectedSkills?.length || 0,
    hasStrengthBenchmarks: !!(canonical.pullUpMax || canonical.dipMax),
    hasSkillProgressions: !!(canonical.frontLeverProgression || canonical.plancheProgression),
    // [profile-completeness] ISSUE E: Log new engine-relevant fields
    hasWeightedStrength: !!(canonical.weightedPullUp || canonical.weightedDip),
    hasAllTimePRs: !!(canonical.allTimePRPullUp || canonical.allTimePRDip),
    hasSkillHistory: !!(
      canonical.skillHistory?.front_lever?.trainingHistory ||
      canonical.skillHistory?.planche?.trainingHistory
    ),
    hasBandLevels: !!(canonical.frontLeverBandLevel || canonical.plancheBandLevel),
    hasJointCautions: (canonical.jointCautions?.length || 0) > 0,
    hasRecoveryData: !!canonical.recoveryQuality,
  })
  
  // Build the normalized profile result
  const result: NormalizedProfile = {
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
  
  // ==========================================================================
  // [profile-normalization-truth-audit] TASK 4: Verify what comes in and out
  // ==========================================================================
  console.log('[profile-normalization-truth-audit]', {
    // Incoming canonical values
    incomingCanonical: {
      selectedSkills: canonical.selectedSkills,
      equipmentAvailable: canonical.equipmentAvailable,
      trainingDaysPerWeek: canonical.trainingDaysPerWeek,
      scheduleMode: canonical.scheduleMode,
      sessionDurationMode: canonical.sessionDurationMode,
      sessionLengthMinutes: canonical.sessionLengthMinutes,
      trainingStyle: canonical.trainingStyle,
      trainingPathType: canonical.trainingPathType,
    },
    // Outgoing normalized values
    outgoingNormalized: {
      skills: result.skills,
      equipment: result.equipment,
      trainingDays: result.trainingDays,
      schedule: result.schedule,
      sessionLength: result.sessionLength,
    },
    // Transformation audit
    transformationAudit: {
      skillsPreserved: canonical.selectedSkills?.length === result.skills.length,
      skillsDropped: (canonical.selectedSkills || []).filter(s => !result.skills.includes(s)),
      equipmentPreserved: (canonical.equipmentAvailable?.length || 0) === result.equipment.length,
      equipmentDropped: (canonical.equipmentAvailable || []).filter(e => !result.equipment.includes(e)),
      schedulePreserved: canonical.scheduleMode === result.schedule,
      sessionLengthPreserved: canonical.sessionLengthMinutes === result.sessionLength,
    },
  })
  
  return result
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
