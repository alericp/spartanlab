// Compression Skill Readiness Engine
// Evaluates readiness for L-sit, V-sit, and I-sit based on athlete data and calibration
// Helps SpartanLab decide which progression is appropriate and what to focus on next

import { type CompressionLevel } from './skills'
import { 
  type AthleteCalibration, 
  type LeverageProfile,
  type CoreCompressionTier,
  getAthleteCalibration 
} from './athlete-calibration'
import { type OnboardingProfile, type LSitCapacity, getOnboardingProfile } from './athlete-profile'

// =============================================================================
// TYPES
// =============================================================================

export type CompressionLimiter =
  | 'compression_strength'
  | 'support_strength'
  | 'core_endurance'
  | 'mobility'
  | 'body_control'
  | 'none'

export interface CompressionReadinessResult {
  // Current skill level
  currentCompressionLevel: CompressionLevel
  currentLevelLabel: string
  
  // Next milestone
  nextMilestone: CompressionLevel
  nextMilestoneLabel: string
  
  // Readiness score (0-100)
  readinessScore: number
  readinessLabel: 'early_stage' | 'developing' | 'approaching' | 'ready'
  
  // Primary limiter
  primaryLimiter: CompressionLimiter
  limiterExplanation: string
  
  // Coaching explanation
  explanation: string
  
  // Recommended focus items
  recommendedFocus: string[]
  
  // Flags for program integration
  shouldIncludeCompressionWork: boolean
  compressionWorkIntensity: 'foundational' | 'progressive' | 'advanced'
  
  // For future tools
  lSitReady: boolean
  vSitReady: boolean
  iSitReady: boolean
  
  // Historical ceiling data for reacquisition programming
  hasHistoricalCeiling: boolean
  historicalHighest: string | null | undefined
  useReacquisitionStrategy: boolean
}

// =============================================================================
// LEVEL LABELS
// =============================================================================

const LEVEL_LABELS: Record<CompressionLevel, string> = {
  'none': 'Not Started',
  'tuck_l_sit': 'Tuck L-Sit',
  'l_sit': 'L-Sit Hold',
  'advanced_l_sit': 'Advanced L-Sit',
  'v_sit_entry': 'V-Sit Entry',
  'v_sit': 'V-Sit Hold',
  'i_sit_entry': 'I-Sit Entry',
  'i_sit': 'I-Sit Mastery',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getLSitCapacityScore(capacity: LSitCapacity | null): number {
  if (!capacity) return 0
  const scores: Record<LSitCapacity, number> = {
    'none': 0,
    '3_sec': 20,
    '5_sec': 35,
    '10_sec': 55,
    '20_plus': 80,
  }
  return scores[capacity]
}

function getCompressionTierScore(tier: CoreCompressionTier): number {
  const scores: Record<CoreCompressionTier, number> = {
    'very_low': 10,
    'low': 30,
    'moderate': 55,
    'strong': 80,
  }
  return scores[tier]
}

function getLeverageModifier(leverage: LeverageProfile): number {
  // Long lever athletes need more strength for the same skill level
  const modifiers: Record<LeverageProfile, number> = {
    'compact': 1.1,   // Slight advantage
    'average': 1.0,   // Baseline
    'long_lever': 0.85, // More conservative
  }
  return modifiers[leverage]
}

// Map L-sit capacity to current compression level
function inferCurrentLevel(
  lSitCapacity: LSitCapacity | null,
  compressionTier: CoreCompressionTier,
  leverageProfile: LeverageProfile
): CompressionLevel {
  const leverageMod = getLeverageModifier(leverageProfile)
  const capacityScore = getLSitCapacityScore(lSitCapacity) * leverageMod
  const tierScore = getCompressionTierScore(compressionTier) * leverageMod
  
  // Use the more conservative estimate
  const combinedScore = Math.min(capacityScore, tierScore * 1.1)
  
  if (combinedScore >= 75) return 'advanced_l_sit'
  if (combinedScore >= 55) return 'l_sit'
  if (combinedScore >= 30) return 'tuck_l_sit'
  return 'none'
}

// Determine next milestone based on current level
function getNextMilestone(current: CompressionLevel): CompressionLevel {
  const progression: Record<CompressionLevel, CompressionLevel> = {
    'none': 'tuck_l_sit',
    'tuck_l_sit': 'l_sit',
    'l_sit': 'advanced_l_sit',
    'advanced_l_sit': 'v_sit_entry',
    'v_sit_entry': 'v_sit',
    'v_sit': 'i_sit_entry',
    'i_sit_entry': 'i_sit',
    'i_sit': 'i_sit', // Already at top
  }
  return progression[current]
}

// Calculate readiness score for next milestone
function calculateReadinessScore(
  lSitCapacity: LSitCapacity | null,
  compressionTier: CoreCompressionTier,
  leverageProfile: LeverageProfile,
  currentLevel: CompressionLevel
): number {
  const leverageMod = getLeverageModifier(leverageProfile)
  const capacityScore = getLSitCapacityScore(lSitCapacity)
  const tierScore = getCompressionTierScore(compressionTier)
  
  // Base score from both signals
  let baseScore = (capacityScore * 0.6 + tierScore * 0.4) * leverageMod
  
  // Adjust based on current level (higher levels need more to progress)
  const levelMultipliers: Record<CompressionLevel, number> = {
    'none': 1.2,
    'tuck_l_sit': 1.0,
    'l_sit': 0.9,
    'advanced_l_sit': 0.75,
    'v_sit_entry': 0.6,
    'v_sit': 0.5,
    'i_sit_entry': 0.4,
    'i_sit': 0.3,
  }
  
  baseScore = baseScore * levelMultipliers[currentLevel]
  
  return Math.min(100, Math.max(0, Math.round(baseScore)))
}

function getReadinessLabel(score: number): 'early_stage' | 'developing' | 'approaching' | 'ready' {
  if (score <= 25) return 'early_stage'
  if (score <= 50) return 'developing'
  if (score <= 75) return 'approaching'
  return 'ready'
}

// Determine primary limiter
function determinePrimaryLimiter(
  lSitCapacity: LSitCapacity | null,
  compressionTier: CoreCompressionTier,
  leverageProfile: LeverageProfile,
  currentLevel: CompressionLevel
): { limiter: CompressionLimiter; explanation: string } {
  const capacityScore = getLSitCapacityScore(lSitCapacity)
  const tierScore = getCompressionTierScore(compressionTier)
  
  // No compression ability at all
  if (capacityScore === 0 && tierScore <= 30) {
    return {
      limiter: 'compression_strength',
      explanation: 'Your core compression strength needs development before attempting L-sit holds.',
    }
  }
  
  // Can do some L-sit but tier is low - likely endurance issue
  if (capacityScore >= 20 && tierScore <= 30) {
    return {
      limiter: 'core_endurance',
      explanation: 'You can initiate the hold but fatigue quickly. Focus on building hold duration.',
    }
  }
  
  // Good capacity but unstable (indicated by tier being higher than capacity suggests)
  if (tierScore > capacityScore + 15) {
    return {
      limiter: 'body_control',
      explanation: 'You have the strength but need more practice with body positioning and control.',
    }
  }
  
  // Long lever athlete with decent scores but struggling
  if (leverageProfile === 'long_lever' && capacityScore >= 35 && currentLevel === 'l_sit') {
    return {
      limiter: 'support_strength',
      explanation: 'Your body type requires extra tricep and shoulder support strength for longer holds.',
    }
  }
  
  // Capacity score is high but not progressing to advanced
  if (capacityScore >= 55 && currentLevel === 'l_sit') {
    return {
      limiter: 'mobility',
      explanation: 'Hip flexor flexibility and pike compression may be limiting your progression.',
    }
  }
  
  // Advanced level - compression strength for V-sit
  if (currentLevel === 'advanced_l_sit' || currentLevel === 'v_sit_entry') {
    return {
      limiter: 'compression_strength',
      explanation: 'V-sit requires significantly more hip flexor and compression strength than L-sit.',
    }
  }
  
  // Default to compression strength
  return {
    limiter: 'compression_strength',
    explanation: 'Building more core compression strength will help you progress to the next level.',
  }
}

// Generate recommended focus items
function getRecommendedFocus(
  limiter: CompressionLimiter,
  currentLevel: CompressionLevel
): string[] {
  const focusMap: Record<CompressionLimiter, Record<string, string[]>> = {
    'compression_strength': {
      'none': ['Hollow body holds', 'Seated compression lifts', 'Hanging knee raises'],
      'tuck_l_sit': ['Tuck L-sit holds', 'Compression pulses', 'Pike compressions'],
      'l_sit': ['L-sit holds for time', 'Single leg L-sit', 'Dragon flag negatives'],
      'advanced': ['Elevated L-sit work', 'V-sit progressions', 'Pike compression lifts'],
    },
    'support_strength': {
      'default': ['Parallette support holds', 'Dip negatives', 'Tricep work', 'Shoulder shrugs'],
    },
    'core_endurance': {
      'default': ['Extended hollow holds', 'L-sit hold duration work', 'Compression circuits'],
    },
    'mobility': {
      'default': ['Pike stretches', 'Pancake work', 'Active pike compressions', 'Hip flexor activation'],
    },
    'body_control': {
      'default': ['Slow controlled L-sit entries', 'Tuck to L transitions', 'Balance work on parallettes'],
    },
    'none': {
      'default': ['Maintain current compression work'],
    },
  }
  
  // Get specific focus based on limiter and level
  const limiterFocus = focusMap[limiter]
  
  if (currentLevel === 'none' || currentLevel === 'tuck_l_sit') {
    return limiterFocus[currentLevel] || limiterFocus['default'] || []
  }
  if (currentLevel === 'l_sit') {
    return limiterFocus['l_sit'] || limiterFocus['default'] || []
  }
  return limiterFocus['advanced'] || limiterFocus['default'] || []
}

// Generate coaching explanation
function generateExplanation(
  currentLevel: CompressionLevel,
  nextMilestone: CompressionLevel,
  readinessScore: number,
  limiter: CompressionLimiter,
  leverageProfile: LeverageProfile
): string {
  const currentLabel = LEVEL_LABELS[currentLevel]
  const nextLabel = LEVEL_LABELS[nextMilestone]
  const readinessLabel = getReadinessLabel(readinessScore)
  
  // Build explanation based on state
  if (currentLevel === 'none') {
    return `You're at the beginning of your compression skill journey. Focus on building foundational core strength before attempting L-sit holds.`
  }
  
  if (currentLevel === nextMilestone) {
    return `You've reached I-sit mastery - the peak of compression skills. Maintain your skill with regular practice.`
  }
  
  let explanation = `You're currently at ${currentLabel}. `
  
  if (readinessLabel === 'ready') {
    explanation += `Your compression strength is ready to begin working toward ${nextLabel}. `
  } else if (readinessLabel === 'approaching') {
    explanation += `You're getting close to ${nextLabel}. Keep building your current capacity. `
  } else {
    explanation += `${nextLabel} is your next milestone. `
  }
  
  // Add leverage context if relevant
  if (leverageProfile === 'long_lever' && ['v_sit_entry', 'v_sit', 'i_sit_entry'].includes(nextMilestone)) {
    explanation += `As a taller athlete, V-sit and I-sit require extra patience and strength development.`
  }
  
  return explanation
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export function getCompressionReadiness(
  profile?: OnboardingProfile | null,
  calibration?: AthleteCalibration | null
): CompressionReadinessResult {
  // Get data from storage if not provided
  const effectiveProfile = profile ?? getOnboardingProfile()
  const effectiveCalibration = calibration ?? getAthleteCalibration()
  
  // Extract key values with defaults
  const lSitCapacity = effectiveProfile?.lSitCapacity ?? null
  const compressionTier = effectiveCalibration?.coreCompressionTier ?? 'low'
  const leverageProfile = effectiveCalibration?.leverageProfile ?? 'average'
  
  // Check for historical compression ceiling (user previously reached higher level)
  const vSitCalibration = effectiveCalibration?.skillCalibration?.v_sit
  const lSitCalibration = effectiveCalibration?.skillCalibration?.l_sit
  const hasHistoricalCeiling = !!(vSitCalibration?.hasHistoricalCeiling || lSitCalibration?.hasHistoricalCeiling)
  const historicalHighest = vSitCalibration?.highestLevelEverReached || lSitCalibration?.highestLevelEverReached
  
  // Calculate current level
  const currentLevel = inferCurrentLevel(lSitCapacity, compressionTier, leverageProfile)
  
  // Calculate next milestone
  const nextMilestone = getNextMilestone(currentLevel)
  
  // Calculate readiness score
  const readinessScore = calculateReadinessScore(
    lSitCapacity,
    compressionTier,
    leverageProfile,
    currentLevel
  )
  
  // Determine primary limiter
  const { limiter, explanation: limiterExplanation } = determinePrimaryLimiter(
    lSitCapacity,
    compressionTier,
    leverageProfile,
    currentLevel
  )
  
  // Get recommended focus
  const recommendedFocus = getRecommendedFocus(limiter, currentLevel)
  
  // Generate coaching explanation
  const explanation = generateExplanation(
    currentLevel,
    nextMilestone,
    readinessScore,
    limiter,
    leverageProfile
  )
  
  // Determine work intensity
  let compressionWorkIntensity: 'foundational' | 'progressive' | 'advanced' = 'foundational'
  if (currentLevel === 'l_sit' || currentLevel === 'advanced_l_sit') {
    compressionWorkIntensity = 'progressive'
  } else if (['v_sit_entry', 'v_sit', 'i_sit_entry', 'i_sit'].includes(currentLevel)) {
    compressionWorkIntensity = 'advanced'
  }
  
  // Determine skill readiness flags
  const lSitReady = currentLevel !== 'none'
  const vSitReady = ['advanced_l_sit', 'v_sit_entry', 'v_sit', 'i_sit_entry', 'i_sit'].includes(currentLevel)
  const iSitReady = ['v_sit', 'i_sit_entry', 'i_sit'].includes(currentLevel)
  
  return {
    currentCompressionLevel: currentLevel,
    currentLevelLabel: LEVEL_LABELS[currentLevel],
    nextMilestone,
    nextMilestoneLabel: LEVEL_LABELS[nextMilestone],
    readinessScore,
    readinessLabel: getReadinessLabel(readinessScore),
    primaryLimiter: limiter,
    limiterExplanation,
    explanation,
    recommendedFocus,
    shouldIncludeCompressionWork: currentLevel !== 'i_sit',
    compressionWorkIntensity,
    lSitReady,
    vSitReady,
    iSitReady,
    // Historical ceiling data for reacquisition programming
    hasHistoricalCeiling,
    historicalHighest,
    // If user had higher level before, use reacquisition strategy (faster ramp, less beginner work)
    useReacquisitionStrategy: hasHistoricalCeiling && currentLevel !== historicalHighest,
  }
}

// =============================================================================
// UTILITY FUNCTIONS FOR INTEGRATION
// =============================================================================

// For program builder - get compression exercises based on readiness
export function getCompressionExercisesForLevel(readiness: CompressionReadinessResult): string[] {
  const { currentCompressionLevel, compressionWorkIntensity } = readiness
  
  if (compressionWorkIntensity === 'foundational') {
    return ['Hollow Body Hold', 'Seated Compression Lifts', 'Hanging Knee Raises', 'Pike Stretch']
  }
  
  if (compressionWorkIntensity === 'progressive') {
    return ['L-Sit Hold', 'Toes to Bar', 'Dragon Flag Negatives', 'Compression Pulses']
  }
  
  // Advanced
  return ['V-Sit Progression', 'Advanced L-Sit Hold', 'Pike Compression Lifts', 'Manna Prep']
}

// For dashboard insight cards
export function getCompressionInsightSummary(): {
  title: string
  currentLevel: string
  nextMilestone: string
  limiter: string
  topFocus: string
} {
  const readiness = getCompressionReadiness()
  
  return {
    title: 'Compression Skills',
    currentLevel: readiness.currentLevelLabel,
    nextMilestone: readiness.nextMilestoneLabel,
    limiter: readiness.limiterExplanation,
    topFocus: readiness.recommendedFocus[0] || 'Compression work',
  }
}

// For program generation bias
export function shouldBiasTowardCompression(readiness: CompressionReadinessResult, goal: string | null): boolean {
  // Always include if goal is abs/core
  if (goal === 'abs') return true
  
  // Include if compression is a limiter
  if (readiness.primaryLimiter === 'compression_strength') return true
  
  // Include if at foundational or progressive stage
  if (readiness.compressionWorkIntensity !== 'advanced') return true
  
  return false
}
