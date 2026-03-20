// =============================================================================
// METRICS UPDATE SERVICE
// =============================================================================
// Handles updating athlete metrics and triggering program recalculation
// Preserves training history while adapting future sessions
// 
// =============================================================================
// REGRESSION GUARD: METRICS MUST WRITE-THROUGH TO CANONICAL PROFILE
// =============================================================================
// 
// This service MUST call saveCanonicalProfile() when updating metrics.
// Metrics edits are one of three profile-editing surfaces:
// 1. Onboarding (writes to canonical via saveOnboardingProfile)
// 2. Settings (writes to canonical via saveCanonicalProfile)
// 3. Metrics (this service - writes to canonical via saveCanonicalProfile)
// 
// If write-through is removed:
// - Metrics changes won't reflect in program generation
// - Staleness detection will be inaccurate
// - The canonical truth contract will be violated
//
// CANONICAL PROFILE FIX: Now writes to canonical profile service to ensure
// metrics updates flow through to program generation.

import { 
  getOnboardingProfile, 
  saveOnboardingProfile,
  type OnboardingProfile,
  type PullUpCapacity,
  type PushUpCapacity,
  type DipCapacity,
  type WallHSPUReps,
  type FrontLeverProgression,
  type PlancheProgression,
  type MuscleUpReadiness,
  type HSPUProgression,
  type LSitHoldCapacity,
  type VSitHoldCapacity,
  type FlexibilityLevel,
  type WeightedBenchmark,
  type SkillBenchmark,
  type FlexibilityBenchmark,
} from './athlete-profile'
import { saveCanonicalProfile, logCanonicalProfileState } from './canonical-profile-service'

// =============================================================================
// TYPES
// =============================================================================

export interface StrengthMetrics {
  pullUpMax: PullUpCapacity | null
  pushUpMax: PushUpCapacity | null
  dipMax: DipCapacity | null
  wallHSPUReps: WallHSPUReps | null
  weightedPullUp: WeightedBenchmark | null
  weightedDip: WeightedBenchmark | null
}

export interface SkillMetrics {
  frontLever: SkillBenchmark | null
  planche: SkillBenchmark | null
  muscleUp: MuscleUpReadiness | null
  hspu: SkillBenchmark | null
  lSitHold: LSitHoldCapacity | null
  vSitHold: VSitHoldCapacity | null
}

export interface FlexibilityMetrics {
  pancake: FlexibilityBenchmark | null
  toeTouch: FlexibilityBenchmark | null
  frontSplits: FlexibilityBenchmark | null
  sideSplits: FlexibilityBenchmark | null
}

export interface MetricUpdate {
  strength?: Partial<StrengthMetrics>
  skills?: Partial<SkillMetrics>
  flexibility?: Partial<FlexibilityMetrics>
}

export type ChangeSignificance = 'none' | 'minor' | 'moderate' | 'major'

export interface MetricChangeAnalysis {
  significance: ChangeSignificance
  changedMetrics: string[]
  recommendsRecalculation: boolean
  summary: string
}

// =============================================================================
// METRIC VALUE SCORING (for comparison)
// =============================================================================

const PULLUP_SCORES: Record<PullUpCapacity, number> = {
  '0': 0, '1_3': 2, '4_7': 5, '8_12': 10, '13_17': 14, '18_22': 20, '23_plus': 25, 'unknown': -1
}

const DIP_SCORES: Record<DipCapacity, number> = {
  '0': 0, '1_5': 3, '6_10': 8, '11_15': 13, '16_20': 18, '21_25': 23, '25_plus': 28, 'unknown': -1
}

const PUSHUP_SCORES: Record<PushUpCapacity, number> = {
  '0_10': 5, '10_25': 18, '25_40': 32, '40_60': 50, '60_plus': 65, 'unknown': -1
}

const FL_SCORES: Record<FrontLeverProgression, number> = {
  'none': 0, 'tuck': 2, 'adv_tuck': 4, 'one_leg': 6, 'straddle': 8, 'full': 10, 'unknown': -1
}

const PLANCHE_SCORES: Record<PlancheProgression, number> = {
  'none': 0, 'lean': 1, 'tuck': 3, 'adv_tuck': 5, 'straddle': 8, 'full': 10, 'unknown': -1
}

const LSIT_SCORES: Record<LSitHoldCapacity, number> = {
  'none': 0, 'under_10': 5, '10_20': 15, '20_30': 25, '30_plus': 35, 'unknown': -1
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

function scoreStrengthMetric(
  metric: 'pullUpMax' | 'dipMax' | 'pushUpMax',
  value: string | null
): number {
  if (!value || value === 'unknown') return -1
  
  switch (metric) {
    case 'pullUpMax': return PULLUP_SCORES[value as PullUpCapacity] ?? -1
    case 'dipMax': return DIP_SCORES[value as DipCapacity] ?? -1
    case 'pushUpMax': return PUSHUP_SCORES[value as PushUpCapacity] ?? -1
    default: return -1
  }
}

function scoreSkillProgression(
  skill: 'frontLever' | 'planche',
  progression: string | null
): number {
  if (!progression || progression === 'unknown') return -1
  
  switch (skill) {
    case 'frontLever': return FL_SCORES[progression as FrontLeverProgression] ?? -1
    case 'planche': return PLANCHE_SCORES[progression as PlancheProgression] ?? -1
    default: return -1
  }
}

/**
 * Analyze the significance of metric changes
 */
export function analyzeMetricChanges(
  current: OnboardingProfile,
  updates: MetricUpdate
): MetricChangeAnalysis {
  const changedMetrics: string[] = []
  let totalScoreChange = 0
  let significantChanges = 0

  // Analyze strength changes
  if (updates.strength) {
    // Pull-ups
    if (updates.strength.pullUpMax !== undefined) {
      const oldScore = scoreStrengthMetric('pullUpMax', current.pullUpMax)
      const newScore = scoreStrengthMetric('pullUpMax', updates.strength.pullUpMax)
      if (oldScore !== newScore) {
        changedMetrics.push('Pull-ups')
        const change = newScore - oldScore
        totalScoreChange += Math.abs(change)
        if (Math.abs(change) >= 5) significantChanges++
      }
    }
    
    // Dips
    if (updates.strength.dipMax !== undefined) {
      const oldScore = scoreStrengthMetric('dipMax', current.dipMax)
      const newScore = scoreStrengthMetric('dipMax', updates.strength.dipMax)
      if (oldScore !== newScore) {
        changedMetrics.push('Dips')
        const change = newScore - oldScore
        totalScoreChange += Math.abs(change)
        if (Math.abs(change) >= 5) significantChanges++
      }
    }
    
    // Push-ups
    if (updates.strength.pushUpMax !== undefined) {
      const oldScore = scoreStrengthMetric('pushUpMax', current.pushUpMax)
      const newScore = scoreStrengthMetric('pushUpMax', updates.strength.pushUpMax)
      if (oldScore !== newScore) {
        changedMetrics.push('Push-ups')
        const change = newScore - oldScore
        totalScoreChange += Math.abs(change)
        if (Math.abs(change) >= 10) significantChanges++
      }
    }

    // Weighted benchmarks
    if (updates.strength.weightedPullUp !== undefined) {
      const oldWeight = current.weightedPullUp?.addedWeight ?? 0
      const newWeight = updates.strength.weightedPullUp?.addedWeight ?? 0
      if (oldWeight !== newWeight) {
        changedMetrics.push('Weighted Pull-up')
        if (Math.abs(newWeight - oldWeight) >= 10) significantChanges++
      }
    }

    if (updates.strength.weightedDip !== undefined) {
      const oldWeight = current.weightedDip?.addedWeight ?? 0
      const newWeight = updates.strength.weightedDip?.addedWeight ?? 0
      if (oldWeight !== newWeight) {
        changedMetrics.push('Weighted Dip')
        if (Math.abs(newWeight - oldWeight) >= 10) significantChanges++
      }
    }
  }

  // Analyze skill changes
  if (updates.skills) {
    if (updates.skills.frontLever !== undefined) {
      const oldProg = current.frontLever?.progression
      const newProg = updates.skills.frontLever?.progression
      if (oldProg !== newProg) {
        changedMetrics.push('Front Lever')
        const oldScore = scoreSkillProgression('frontLever', oldProg ?? null)
        const newScore = scoreSkillProgression('frontLever', newProg ?? null)
        if (Math.abs(newScore - oldScore) >= 2) significantChanges++
      }
    }

    if (updates.skills.planche !== undefined) {
      const oldProg = current.planche?.progression
      const newProg = updates.skills.planche?.progression
      if (oldProg !== newProg) {
        changedMetrics.push('Planche')
        const oldScore = scoreSkillProgression('planche', oldProg ?? null)
        const newScore = scoreSkillProgression('planche', newProg ?? null)
        if (Math.abs(newScore - oldScore) >= 2) significantChanges++
      }
    }

    if (updates.skills.muscleUp !== undefined && current.muscleUp !== updates.skills.muscleUp) {
      changedMetrics.push('Muscle-Up')
      significantChanges++
    }

    if (updates.skills.lSitHold !== undefined && current.lSitHold !== updates.skills.lSitHold) {
      changedMetrics.push('L-Sit')
    }

    if (updates.skills.vSitHold !== undefined && current.vSitHold !== updates.skills.vSitHold) {
      changedMetrics.push('V-Sit')
    }
  }

  // Analyze flexibility changes
  if (updates.flexibility) {
    if (updates.flexibility.pancake !== undefined) {
      const oldLevel = current.pancake?.level
      const newLevel = updates.flexibility.pancake?.level
      if (oldLevel !== newLevel) {
        changedMetrics.push('Pancake')
      }
    }

    if (updates.flexibility.frontSplits !== undefined) {
      const oldLevel = current.frontSplits?.level
      const newLevel = updates.flexibility.frontSplits?.level
      if (oldLevel !== newLevel) {
        changedMetrics.push('Front Splits')
      }
    }

    if (updates.flexibility.sideSplits !== undefined) {
      const oldLevel = current.sideSplits?.level
      const newLevel = updates.flexibility.sideSplits?.level
      if (oldLevel !== newLevel) {
        changedMetrics.push('Side Splits')
      }
    }
  }

  // Determine overall significance
  let significance: ChangeSignificance = 'none'
  let summary = 'No changes detected.'

  if (changedMetrics.length === 0) {
    significance = 'none'
  } else if (significantChanges >= 2 || totalScoreChange >= 15) {
    significance = 'major'
    summary = `Major improvements detected in ${changedMetrics.join(', ')}. Your program will be rebuilt to match your new abilities.`
  } else if (significantChanges >= 1 || totalScoreChange >= 8) {
    significance = 'moderate'
    summary = `Notable progress in ${changedMetrics.join(', ')}. Your program will be adjusted to reflect these changes.`
  } else {
    significance = 'minor'
    summary = `Minor updates to ${changedMetrics.join(', ')}. Small adjustments will be made to your training.`
  }

  return {
    significance,
    changedMetrics,
    recommendsRecalculation: significance !== 'none',
    summary,
  }
}

// =============================================================================
// UPDATE FUNCTIONS
// =============================================================================

/**
 * Save updated metrics to the profile
 * Does NOT trigger recalculation - that's handled separately
 * 
 * CANONICAL FIX: Now writes to BOTH onboarding profile AND canonical profile
 * to ensure metrics flow through to program generation.
 */
export function saveMetricUpdates(updates: MetricUpdate): OnboardingProfile {
  const profile = getOnboardingProfile()
  if (!profile) {
    throw new Error('No profile found')
  }

  const updatedProfile: OnboardingProfile = { ...profile }

  // Apply strength updates
  if (updates.strength) {
    if (updates.strength.pullUpMax !== undefined) {
      updatedProfile.pullUpMax = updates.strength.pullUpMax
    }
    if (updates.strength.pushUpMax !== undefined) {
      updatedProfile.pushUpMax = updates.strength.pushUpMax
    }
    if (updates.strength.dipMax !== undefined) {
      updatedProfile.dipMax = updates.strength.dipMax
    }
    if (updates.strength.wallHSPUReps !== undefined) {
      updatedProfile.wallHSPUReps = updates.strength.wallHSPUReps
    }
    if (updates.strength.weightedPullUp !== undefined) {
      updatedProfile.weightedPullUp = updates.strength.weightedPullUp
    }
    if (updates.strength.weightedDip !== undefined) {
      updatedProfile.weightedDip = updates.strength.weightedDip
    }
  }

  // Apply skill updates
  if (updates.skills) {
    if (updates.skills.frontLever !== undefined) {
      updatedProfile.frontLever = updates.skills.frontLever
    }
    if (updates.skills.planche !== undefined) {
      updatedProfile.planche = updates.skills.planche
    }
    if (updates.skills.muscleUp !== undefined) {
      updatedProfile.muscleUp = updates.skills.muscleUp
    }
    if (updates.skills.hspu !== undefined) {
      updatedProfile.hspu = updates.skills.hspu
    }
    if (updates.skills.lSitHold !== undefined) {
      updatedProfile.lSitHold = updates.skills.lSitHold
    }
    if (updates.skills.vSitHold !== undefined) {
      updatedProfile.vSitHold = updates.skills.vSitHold
    }
  }

  // Apply flexibility updates
  if (updates.flexibility) {
    if (updates.flexibility.pancake !== undefined) {
      updatedProfile.pancake = updates.flexibility.pancake
    }
    if (updates.flexibility.toeTouch !== undefined) {
      updatedProfile.toeTouch = updates.flexibility.toeTouch
    }
    if (updates.flexibility.frontSplits !== undefined) {
      updatedProfile.frontSplits = updates.flexibility.frontSplits
    }
    if (updates.flexibility.sideSplits !== undefined) {
      updatedProfile.sideSplits = updates.flexibility.sideSplits
    }
  }

  // Save to onboarding profile (legacy)
  saveOnboardingProfile(updatedProfile)
  
  // CANONICAL FIX: Also sync to canonical profile for generation consumption
  // This ensures metrics updates are visible to the program builder
  saveCanonicalProfile({
    pullUpMax: updates.strength?.pullUpMax ?? undefined,
    dipMax: updates.strength?.dipMax ?? undefined,
    pushUpMax: updates.strength?.pushUpMax ?? undefined,
    wallHSPUReps: updates.strength?.wallHSPUReps ?? undefined,
    weightedPullUp: updates.strength?.weightedPullUp ?? undefined,
    weightedDip: updates.strength?.weightedDip ?? undefined,
    frontLeverProgression: updates.skills?.frontLever?.progression ?? undefined,
    frontLeverHoldSeconds: updates.skills?.frontLever?.holdSeconds ?? undefined,
    plancheProgression: updates.skills?.planche?.progression ?? undefined,
    plancheHoldSeconds: updates.skills?.planche?.holdSeconds ?? undefined,
    muscleUpReadiness: updates.skills?.muscleUp ?? undefined,
    hspuProgression: updates.skills?.hspu?.progression ?? undefined,
    lSitHoldSeconds: updates.skills?.lSitHold ?? undefined,
    vSitHoldSeconds: updates.skills?.vSitHold ?? undefined,
    pancakeLevel: updates.flexibility?.pancake?.level ?? undefined,
    toeTouchLevel: updates.flexibility?.toeTouch?.level ?? undefined,
    frontSplitsLevel: updates.flexibility?.frontSplits?.level ?? undefined,
    sideSplitsLevel: updates.flexibility?.sideSplits?.level ?? undefined,
  })
  
  // Log canonical state after update for debugging
  logCanonicalProfileState('After metrics update')

  return updatedProfile
}

/**
 * Trigger program recalculation
 * This clears the cached program so it gets regenerated with new metrics
 */
export function triggerProgramRecalculation(): void {
  if (typeof window === 'undefined') return

  // Clear the cached adaptive program to force regeneration
  localStorage.removeItem('spartanlab_adaptive_program')
  localStorage.removeItem('spartanlab_program_cache')
  
  // Set a flag indicating recalculation was triggered
  localStorage.setItem('spartanlab_program_recalc_pending', 'true')
  localStorage.setItem('spartanlab_program_recalc_time', new Date().toISOString())
  
  // Dispatch event for any listening components
  window.dispatchEvent(new CustomEvent('spartanlab:program-recalculated'))
}

/**
 * Check if there's a pending recalculation
 */
export function hasPendingRecalculation(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('spartanlab_program_recalc_pending') === 'true'
}

/**
 * Clear the pending recalculation flag
 */
export function clearPendingRecalculation(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('spartanlab_program_recalc_pending')
}

/**
 * Get the current metrics from the profile
 */
export function getCurrentMetrics(): {
  strength: StrengthMetrics
  skills: SkillMetrics
  flexibility: FlexibilityMetrics
} {
  const profile = getOnboardingProfile()
  
  return {
    strength: {
      pullUpMax: profile?.pullUpMax ?? null,
      pushUpMax: profile?.pushUpMax ?? null,
      dipMax: profile?.dipMax ?? null,
      wallHSPUReps: profile?.wallHSPUReps ?? null,
      weightedPullUp: profile?.weightedPullUp ?? null,
      weightedDip: profile?.weightedDip ?? null,
    },
    skills: {
      frontLever: profile?.frontLever ?? null,
      planche: profile?.planche ?? null,
      muscleUp: profile?.muscleUp ?? null,
      hspu: profile?.hspu ?? null,
      lSitHold: profile?.lSitHold ?? null,
      vSitHold: profile?.vSitHold ?? null,
    },
    flexibility: {
      pancake: profile?.pancake ?? null,
      toeTouch: profile?.toeTouch ?? null,
      frontSplits: profile?.frontSplits ?? null,
      sideSplits: profile?.sideSplits ?? null,
    },
  }
}

/**
 * Full update flow: save metrics and optionally trigger recalculation
 */
export function updateMetricsAndRecalculate(
  updates: MetricUpdate,
  shouldRecalculate: boolean = true
): { profile: OnboardingProfile; analysis: MetricChangeAnalysis } {
  const profile = getOnboardingProfile()
  if (!profile) {
    throw new Error('No profile found')
  }

  // Analyze changes before saving
  const analysis = analyzeMetricChanges(profile, updates)

  // Save the updates
  const updatedProfile = saveMetricUpdates(updates)

  // Trigger recalculation if requested and there are meaningful changes
  if (shouldRecalculate && analysis.recommendsRecalculation) {
    triggerProgramRecalculation()
  }

  return { profile: updatedProfile, analysis }
}
