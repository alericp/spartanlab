// Skill Intelligence Layer
// Unified integration layer that combines existing skill intelligence signals
// into per-skill confidence scores and expanded weak point outputs.
//
// This layer does NOT duplicate existing calculations - it aggregates them.
// It serves as the single source of truth for skill decision summaries.

import type { SkillSession } from '@/types/skill-readiness'
import type { StrengthRecord } from './strength-service'
import type { 
  AthleteCalibration, 
  StrengthTier,
} from './athlete-calibration'
import { getAthleteCalibration, getSkillStartingPoint } from './athlete-calibration'
import type { TendonAdaptationLevel } from './athlete-profile'
import { 
  calculateOwnershipScore, 
  calculateSupportStrengthScore,
  calculateDensityScore,
  calculateTrendScore,
} from './skill-readiness-engine'
import {
  assessFrontLeverSupport,
  assessPlancheSupport,
  assessMuscleUpSupport,
  assessHSPUSupport,
  type SupportLevel,
  type SkillSupportAssessment,
} from './strength-support-rules'
import { getOnboardingProfile } from './athlete-profile'

// =============================================================================
// TYPES
// =============================================================================

// SkillKey matches SkillGoal from athlete-profile for compatibility
export type SkillKey = 
  | 'front_lever' 
  | 'planche' 
  | 'muscle_up' 
  | 'handstand_pushup' 
  | 'handstand'
  | 'l_sit' 
  | 'v_sit'
  | 'i_sit'

export type LimiterCategory =
  | 'pulling_strength'
  | 'pushing_strength'
  | 'horizontal_pulling'
  | 'compression'
  | 'scapular_control'
  | 'tendon_tolerance'
  | 'skill_density'
  | 'recovery_fatigue'
  | 'leverage_bodyweight'
  | 'ownership'
  | 'none'
  | 'insufficient_data'

export interface SkillLimiter {
  category: LimiterCategory
  label: string
  severity: 'primary' | 'secondary' | 'minor'
  explanation: string
  adjustmentFocus: string
}

export interface SkillConfidenceScore {
  // Core confidence (0-100)
  confidence: number
  
  // Component scores that feed into confidence
  components: {
    readinessScore: number         // From skill-readiness-engine (ownership + density + trend)
    supportStrengthScore: number   // From strength-support-rules
    tendonAdaptationScore: number  // From athlete-calibration
    calibrationScore: number       // From onboarding readiness calibration
    benchmarkScore: number         // From current skill benchmark / hold quality
  }
  
  // Interpretation
  tier: 'low' | 'developing' | 'moderate' | 'strong' | 'ready'
  tierLabel: string
  explanation: string
}

export interface SkillWeakPointAnalysis {
  primaryLimiter: SkillLimiter | null
  secondaryLimiter: SkillLimiter | null
  allLimiters: SkillLimiter[]
  hasCriticalLimiter: boolean
  overallAssessment: string
}

export interface SkillIntelligence {
  skillKey: SkillKey
  skillLabel: string
  confidence: SkillConfidenceScore
  weakPoints: SkillWeakPointAnalysis
  recommendations: {
    progressionTier: 'foundation' | 'beginner' | 'intermediate' | 'advanced'
    emphasisLevel: 'primary' | 'secondary' | 'exposure' | 'maintain'
    progressionAggressiveness: number // 0.0 to 1.5
    volumeModifier: number // 0.5 to 1.2
  }
}

export interface UnifiedSkillIntelligence {
  skills: Record<SkillKey, SkillIntelligence | null>
  
  // Aggregated weak points across all skills
  globalLimiters: {
    primaryPattern: LimiterCategory | null
    affectedSkills: SkillKey[]
    recommendation: string
  }
  
  // Program prioritization guidance
  prioritization: {
    primaryEmphasis: SkillKey | null
    secondaryEmphasis: SkillKey | null
    exposureOnly: SkillKey[]
    shouldAvoid: SkillKey[]
  }
  
  // Metadata
  dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent'
  lastUpdated: string
}

// =============================================================================
// LIMITER LABELS AND MAPPINGS
// =============================================================================

const LIMITER_LABELS: Record<LimiterCategory, string> = {
  pulling_strength: 'Pulling Strength',
  pushing_strength: 'Pushing Strength',
  horizontal_pulling: 'Horizontal Pulling',
  compression: 'Compression Strength',
  scapular_control: 'Scapular Control',
  tendon_tolerance: 'Tendon Tolerance',
  skill_density: 'Skill Exposure',
  recovery_fatigue: 'Recovery / Fatigue',
  leverage_bodyweight: 'Leverage / Bodyweight',
  ownership: 'Level Ownership',
  none: 'None',
  insufficient_data: 'More Data Needed',
}

const SKILL_LABELS: Record<SkillKey, string> = {
  front_lever: 'Front Lever',
  planche: 'Planche',
  muscle_up: 'Muscle-Up',
  handstand_pushup: 'HSPU',
  handstand: 'Handstand',
  l_sit: 'L-Sit',
  v_sit: 'V-Sit',
  i_sit: 'I-Sit',
}

// Map skill to primary strength requirement
const SKILL_STRENGTH_MAP: Record<SkillKey, 'pulling' | 'pushing' | 'compression'> = {
  front_lever: 'pulling',
  planche: 'pushing',
  muscle_up: 'pulling', // Pull-dominant with push component
  handstand_pushup: 'pushing',
  handstand: 'pushing', // Balance-focused but pushing for pressing up
  l_sit: 'compression',
  v_sit: 'compression',
  i_sit: 'compression', // Advanced compression
}

// =============================================================================
// TENDON ADAPTATION SCORE CONVERTER
// =============================================================================

function tendonLevelToScore(level: TendonAdaptationLevel): number {
  switch (level) {
    case 'high': return 90
    case 'moderate_high': return 75
    case 'moderate': return 60
    case 'low_moderate': return 40
    case 'low': return 20
    default: return 20
  }
}

// =============================================================================
// SUPPORT LEVEL TO SCORE CONVERTER
// =============================================================================

function supportLevelToScore(level: SupportLevel): number {
  switch (level) {
    case 'strong_support': return 95
    case 'adequate_support': return 75
    case 'borderline_support': return 50
    case 'likely_limiter': return 25
    case 'no_data': return 50 // Neutral when no data
    default: return 50
  }
}

// =============================================================================
// CONFIDENCE TIER CALCULATION
// =============================================================================

function getConfidenceTier(score: number): { tier: SkillConfidenceScore['tier']; label: string } {
  if (score >= 85) return { tier: 'ready', label: 'Ready to Progress' }
  if (score >= 70) return { tier: 'strong', label: 'Strong Foundation' }
  if (score >= 55) return { tier: 'moderate', label: 'Developing' }
  if (score >= 40) return { tier: 'developing', label: 'Building Base' }
  return { tier: 'low', label: 'Foundation Needed' }
}

// =============================================================================
// WEAK POINT DETECTION
// =============================================================================

interface ScoreBreakdown {
  readiness: number
  support: number
  tendon: number
  calibration: number
  benchmark: number
  density: number
  trend: number
}

function detectSkillLimiters(
  skillKey: SkillKey,
  scores: ScoreBreakdown,
  calibration: AthleteCalibration
): SkillWeakPointAnalysis {
  const limiters: SkillLimiter[] = []
  const strengthType = SKILL_STRENGTH_MAP[skillKey]
  
  // Check support strength limiter
  if (scores.support < 50) {
    const category: LimiterCategory = 
      strengthType === 'pulling' ? 'pulling_strength' :
      strengthType === 'pushing' ? 'pushing_strength' : 'compression'
    
    limiters.push({
      category,
      label: LIMITER_LABELS[category],
      severity: scores.support < 30 ? 'primary' : 'secondary',
      explanation: `${LIMITER_LABELS[category]} is below target for ${SKILL_LABELS[skillKey]} progression.`,
      adjustmentFocus: strengthType === 'pulling' 
        ? 'Increase weighted pull-up and row volume'
        : strengthType === 'pushing'
        ? 'Increase weighted dip and PPPU volume'
        : 'Add compression and L-sit conditioning',
    })
  }
  
  // Check tendon tolerance limiter
  if (scores.tendon < 40) {
    limiters.push({
      category: 'tendon_tolerance',
      label: LIMITER_LABELS.tendon_tolerance,
      severity: scores.tendon < 25 ? 'primary' : 'secondary',
      explanation: 'Limited tendon adaptation history. Requires conservative progression.',
      adjustmentFocus: 'Reduce progression aggression, increase prep work and isometric holds',
    })
  }
  
  // Check skill density limiter
  if (scores.density < 50) {
    limiters.push({
      category: 'skill_density',
      label: LIMITER_LABELS.skill_density,
      severity: scores.density < 30 ? 'primary' : 'secondary',
      explanation: 'Insufficient skill exposure and training frequency.',
      adjustmentFocus: 'Increase skill practice frequency and total hold time',
    })
  }
  
  // Check ownership limiter
  if (scores.readiness < 50) {
    limiters.push({
      category: 'ownership',
      label: LIMITER_LABELS.ownership,
      severity: scores.readiness < 30 ? 'primary' : 'minor',
      explanation: 'Current level not yet fully owned with clean, repeatable holds.',
      adjustmentFocus: 'Focus on quality volume at current progression',
    })
  }
  
  // Check recovery/fatigue limiter (from calibration)
  if (calibration.readinessScores && calibration.readinessScores.recoveryTolerance < 40) {
    limiters.push({
      category: 'recovery_fatigue',
      label: LIMITER_LABELS.recovery_fatigue,
      severity: 'secondary',
      explanation: 'Recovery capacity may limit training volume and intensity.',
      adjustmentFocus: 'Prioritize rest, reduce session density, extend rest periods',
    })
  }
  
  // Check leverage/bodyweight limiter (from calibration)
  if (calibration.bodyMassProfile === 'heavy' && strengthType !== 'pushing') {
    limiters.push({
      category: 'leverage_bodyweight',
      label: LIMITER_LABELS.leverage_bodyweight,
      severity: 'minor',
      explanation: 'Higher bodyweight increases lever difficulty for this skill.',
      adjustmentFocus: 'Build more relative strength, consider body composition goals',
    })
  }
  
  // Check horizontal pulling (front lever specific)
  if (skillKey === 'front_lever' && scores.support < 60) {
    const existingPullLimiter = limiters.find(l => l.category === 'pulling_strength')
    if (!existingPullLimiter) {
      limiters.push({
        category: 'horizontal_pulling',
        label: LIMITER_LABELS.horizontal_pulling,
        severity: 'secondary',
        explanation: 'Horizontal pulling strength supports front lever progression.',
        adjustmentFocus: 'Add rowing variations and front lever rows',
      })
    }
  }
  
  // Check scapular control (planche and HSPU specific)
  if ((skillKey === 'planche' || skillKey === 'handstand_pushup') && 
      calibration.pushStrengthTier === 'low') {
    limiters.push({
      category: 'scapular_control',
      label: LIMITER_LABELS.scapular_control,
      severity: 'minor',
      explanation: 'Scapular strength and control support advanced pushing skills.',
      adjustmentFocus: 'Add scapular push-ups, planche leans, and protraction work',
    })
  }
  
  // Check compression deficit (L-sit, V-sit, and planche)
  if ((skillKey === 'l_sit' || skillKey === 'v_sit' || skillKey === 'planche') &&
      calibration.coreCompressionTier === 'very_low') {
    const existingCompression = limiters.find(l => l.category === 'compression')
    if (!existingCompression) {
      limiters.push({
        category: 'compression',
        label: LIMITER_LABELS.compression,
        severity: skillKey === 'v_sit' ? 'primary' : 'secondary',
        explanation: 'Compression strength is essential for hip flexor intensive skills.',
        adjustmentFocus: 'Add seated leg raises, compression holds, and pike conditioning',
      })
    }
  }
  
  // Sort by severity
  limiters.sort((a, b) => {
    const severityOrder = { primary: 0, secondary: 1, minor: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
  
  const primaryLimiter = limiters.find(l => l.severity === 'primary') || limiters[0] || null
  const secondaryLimiter = limiters.find(l => l !== primaryLimiter && l.severity !== 'minor') || null
  
  return {
    primaryLimiter,
    secondaryLimiter,
    allLimiters: limiters,
    hasCriticalLimiter: limiters.some(l => l.severity === 'primary'),
    overallAssessment: primaryLimiter
      ? `Primary limiter: ${primaryLimiter.label}. ${primaryLimiter.adjustmentFocus}`
      : 'No critical limiters detected. Continue current approach.',
  }
}

// =============================================================================
// SINGLE SKILL CONFIDENCE CALCULATION
// =============================================================================

export function calculateSkillConfidence(
  skillKey: SkillKey,
  sessions: SkillSession[],
  strengthRecords: StrengthRecord[],
  bodyweight: number | null,
  calibration: AthleteCalibration,
  currentLevel: number = 0
): SkillConfidenceScore {
  // Get component scores from existing engines
  
  // 1. Readiness score (ownership + density + trend)
  const ownership = calculateOwnershipScore(sessions, skillKey, currentLevel)
  const density = calculateDensityScore(sessions, skillKey, currentLevel)
  const trend = calculateTrendScore(sessions, skillKey, currentLevel)
  const readinessScore = Math.round((ownership.score * 0.4 + density.score * 0.35 + trend.score * 0.25))
  
  // 2. Support strength score (from strength-support-rules)
  let supportAssessment: SkillSupportAssessment | null = null
  const pullRatio = strengthRecords.find(r => r.exercise === 'weighted_pull_up')?.estimatedOneRM 
    ? (bodyweight ? strengthRecords.find(r => r.exercise === 'weighted_pull_up')!.estimatedOneRM / bodyweight : null)
    : null
  const pushRatio = strengthRecords.find(r => r.exercise === 'weighted_dip')?.estimatedOneRM
    ? (bodyweight ? strengthRecords.find(r => r.exercise === 'weighted_dip')!.estimatedOneRM / bodyweight : null)
    : null
  
  switch (skillKey) {
    case 'front_lever':
      supportAssessment = assessFrontLeverSupport(pullRatio, currentLevel)
      break
    case 'planche':
      supportAssessment = assessPlancheSupport(pushRatio, currentLevel)
      break
    case 'muscle_up':
      supportAssessment = assessMuscleUpSupport(pullRatio, pushRatio, currentLevel)
      break
    case 'handstand_pushup':
    case 'handstand': // Handstand uses same pushing assessment as HSPU
      supportAssessment = assessHSPUSupport(pushRatio, currentLevel)
      break
    default:
      // L-sit, V-sit, and I-sit don't have direct support assessment (compression-focused)
      supportAssessment = null
  }
  
  const supportStrengthScore = supportAssessment 
    ? supportLevelToScore(supportAssessment.supportLevel)
    : 60 // Default for compression skills
  
  // 3. Tendon adaptation score (from calibration)
  const tendonLevel = calibration.tendonAdaptation?.[skillKey as keyof typeof calibration.tendonAdaptation] ?? 'low'
  const tendonAdaptationScore = tendonLevelToScore(tendonLevel as TendonAdaptationLevel)
  
  // 4. Calibration score (from onboarding readiness)
  const calibrationScore = calibration.readinessScores
    ? Math.round(
        (calibration.readinessScores.skillAdaptation * 0.3 +
         calibration.readinessScores.recoveryTolerance * 0.3 +
         calibration.readinessScores.volumeTolerance * 0.2 +
         calibration.readinessScores.strengthPotential * 0.2)
      )
    : 50 // Default neutral
  
  // 5. Benchmark score (from current hold quality)
  const benchmarkScore = ownership.score // Use ownership as proxy for benchmark quality
  
  // Calculate weighted confidence
  const confidence = Math.round(
    readinessScore * 0.30 +          // 30% readiness (ownership + density + trend)
    supportStrengthScore * 0.25 +    // 25% support strength
    tendonAdaptationScore * 0.20 +   // 20% tendon adaptation
    calibrationScore * 0.15 +        // 15% onboarding calibration
    benchmarkScore * 0.10            // 10% current benchmark quality
  )
  
  const { tier, label: tierLabel } = getConfidenceTier(confidence)
  
  // Generate explanation
  let explanation = ''
  if (confidence >= 80) {
    explanation = `Strong foundation for ${SKILL_LABELS[skillKey]}. Ready for progressive challenges.`
  } else if (confidence >= 60) {
    explanation = `Solid base developing for ${SKILL_LABELS[skillKey]}. Continue building.`
  } else if (confidence >= 40) {
    explanation = `Building foundation for ${SKILL_LABELS[skillKey]}. Focus on support work.`
  } else {
    explanation = `${SKILL_LABELS[skillKey]} requires more foundational development.`
  }
  
  return {
    confidence,
    components: {
      readinessScore,
      supportStrengthScore,
      tendonAdaptationScore,
      calibrationScore,
      benchmarkScore,
    },
    tier,
    tierLabel,
    explanation,
  }
}

// =============================================================================
// FULL SKILL INTELLIGENCE CALCULATION
// =============================================================================

export function calculateSkillIntelligence(
  skillKey: SkillKey,
  sessions: SkillSession[],
  strengthRecords: StrengthRecord[],
  bodyweight: number | null,
  calibration: AthleteCalibration,
  currentLevel: number = 0
): SkillIntelligence {
  // Calculate confidence
  const confidence = calculateSkillConfidence(
    skillKey, sessions, strengthRecords, bodyweight, calibration, currentLevel
  )
  
  // Get component scores for weak point detection
  const ownership = calculateOwnershipScore(sessions, skillKey, currentLevel)
  const density = calculateDensityScore(sessions, skillKey, currentLevel)
  const trend = calculateTrendScore(sessions, skillKey, currentLevel)
  const support = calculateSupportStrengthScore(skillKey, currentLevel, strengthRecords, bodyweight)
  
  const scores: ScoreBreakdown = {
    readiness: confidence.components.readinessScore,
    support: confidence.components.supportStrengthScore,
    tendon: confidence.components.tendonAdaptationScore,
    calibration: confidence.components.calibrationScore,
    benchmark: confidence.components.benchmarkScore,
    density: density.score,
    trend: trend.score,
  }
  
  // Detect weak points
  const weakPoints = detectSkillLimiters(skillKey, scores, calibration)
  
  // Calculate recommendations
  const strengthTier = SKILL_STRENGTH_MAP[skillKey] === 'pulling' 
    ? calibration.pullStrengthTier 
    : calibration.pushStrengthTier
  
  const startingPoint = getSkillStartingPoint(
    (calibration.tendonAdaptation?.[skillKey as keyof typeof calibration.tendonAdaptation] ?? 'low') as TendonAdaptationLevel,
    strengthTier,
    calibration.readinessScores
  )
  
  // Determine emphasis level based on confidence and limiters
  let emphasisLevel: 'primary' | 'secondary' | 'exposure' | 'maintain' = 'secondary'
  if (confidence.confidence >= 75 && !weakPoints.hasCriticalLimiter) {
    emphasisLevel = 'primary'
  } else if (confidence.confidence >= 50) {
    emphasisLevel = 'secondary'
  } else if (confidence.confidence >= 30) {
    emphasisLevel = 'exposure'
  } else {
    emphasisLevel = 'maintain'
  }
  
  // Adjust progression aggressiveness based on limiters
  let progressionAggressiveness = startingPoint.progressionSpeedModifier
  if (weakPoints.hasCriticalLimiter) {
    progressionAggressiveness *= 0.7 // Reduce by 30% if critical limiter
  }
  if (weakPoints.primaryLimiter?.category === 'tendon_tolerance') {
    progressionAggressiveness *= 0.8 // Extra caution for tendon issues
  }
  
  return {
    skillKey,
    skillLabel: SKILL_LABELS[skillKey],
    confidence,
    weakPoints,
    recommendations: {
      progressionTier: startingPoint.progressionTier,
      emphasisLevel,
      progressionAggressiveness: Math.max(0.5, Math.min(1.5, progressionAggressiveness)),
      volumeModifier: startingPoint.volumeModifier,
    },
  }
}

// =============================================================================
// UNIFIED INTELLIGENCE AGGREGATION
// =============================================================================

export function getUnifiedSkillIntelligence(
  sessions: SkillSession[],
  strengthRecords: StrengthRecord[],
  bodyweight: number | null,
  selectedSkills: SkillKey[] = ['front_lever', 'planche', 'muscle_up', 'handstand_pushup', 'handstand', 'l_sit', 'v_sit', 'i_sit']
): UnifiedSkillIntelligence {
  const calibration = getAthleteCalibration()
  const onboarding = getOnboardingProfile()
  
  // Calculate intelligence for each selected skill
  const skills: Record<SkillKey, SkillIntelligence | null> = {
    front_lever: null,
    planche: null,
    muscle_up: null,
    handstand_pushup: null,
    handstand: null,
    l_sit: null,
    v_sit: null,
    i_sit: null,
  }
  
  for (const skillKey of selectedSkills) {
    // Get skill-specific sessions
    const skillSessions = sessions.filter(s => s.skillKey === skillKey)
    
    // Get current level from onboarding if available
    let currentLevel = 0
    if (onboarding) {
      switch (skillKey) {
        case 'front_lever':
          currentLevel = onboarding.frontLever?.progression ? 1 : 0
          break
        case 'planche':
          currentLevel = onboarding.planche?.progression ? 1 : 0
          break
        // Add more mappings as needed
      }
    }
    
    skills[skillKey] = calculateSkillIntelligence(
      skillKey,
      skillSessions,
      strengthRecords,
      bodyweight,
      calibration,
      currentLevel
    )
  }
  
  // Detect global limiter patterns
  const allLimiters = Object.values(skills)
    .filter((s): s is SkillIntelligence => s !== null)
    .flatMap(s => s.weakPoints.allLimiters)
  
  // Count limiter categories
  const limiterCounts: Record<LimiterCategory, SkillKey[]> = {} as Record<LimiterCategory, SkillKey[]>
  for (const skill of Object.values(skills).filter((s): s is SkillIntelligence => s !== null)) {
    for (const limiter of skill.weakPoints.allLimiters) {
      if (!limiterCounts[limiter.category]) {
        limiterCounts[limiter.category] = []
      }
      if (!limiterCounts[limiter.category].includes(skill.skillKey)) {
        limiterCounts[limiter.category].push(skill.skillKey)
      }
    }
  }
  
  // Find most common limiter
  let primaryPattern: LimiterCategory | null = null
  let maxCount = 0
  for (const [category, affected] of Object.entries(limiterCounts)) {
    if (affected.length > maxCount && category !== 'none' && category !== 'insufficient_data') {
      maxCount = affected.length
      primaryPattern = category as LimiterCategory
    }
  }
  
  // Generate global recommendation
  let globalRecommendation = 'Continue balanced training approach.'
  if (primaryPattern) {
    switch (primaryPattern) {
      case 'pulling_strength':
        globalRecommendation = 'Prioritize weighted pull-up and row development across training.'
        break
      case 'pushing_strength':
        globalRecommendation = 'Prioritize weighted dip and PPPU work across training.'
        break
      case 'compression':
        globalRecommendation = 'Add dedicated compression conditioning to all sessions.'
        break
      case 'tendon_tolerance':
        globalRecommendation = 'Reduce overall progression aggression. Increase prep work volume.'
        break
      case 'skill_density':
        globalRecommendation = 'Increase skill practice frequency across the week.'
        break
      case 'recovery_fatigue':
        globalRecommendation = 'Prioritize recovery. Consider reducing training days or volume.'
        break
      default:
        globalRecommendation = `Address ${LIMITER_LABELS[primaryPattern]} across training.`
    }
  }
  
  // Determine prioritization
  const rankedSkills = Object.values(skills)
    .filter((s): s is SkillIntelligence => s !== null)
    .sort((a, b) => b.confidence.confidence - a.confidence.confidence)
  
  const primaryEmphasis = rankedSkills.find(s => s.recommendations.emphasisLevel === 'primary')?.skillKey || null
  const secondaryEmphasis = rankedSkills.find(s => 
    s.skillKey !== primaryEmphasis && s.recommendations.emphasisLevel === 'secondary'
  )?.skillKey || null
  const exposureOnly = rankedSkills
    .filter(s => s.recommendations.emphasisLevel === 'exposure')
    .map(s => s.skillKey)
  const shouldAvoid = rankedSkills
    .filter(s => s.recommendations.emphasisLevel === 'maintain' || s.weakPoints.hasCriticalLimiter)
    .map(s => s.skillKey)
  
  // Calculate data quality
  const skillsWithData = Object.values(skills).filter(s => s !== null).length
  const avgConfidence = Object.values(skills)
    .filter((s): s is SkillIntelligence => s !== null)
    .reduce((sum, s) => sum + s.confidence.confidence, 0) / Math.max(skillsWithData, 1)
  
  let dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent' = 'insufficient'
  if (skillsWithData >= 4 && avgConfidence > 60) dataQuality = 'excellent'
  else if (skillsWithData >= 3 && avgConfidence > 40) dataQuality = 'good'
  else if (skillsWithData >= 1) dataQuality = 'partial'
  
  return {
    skills,
    globalLimiters: {
      primaryPattern,
      affectedSkills: primaryPattern ? limiterCounts[primaryPattern] || [] : [],
      recommendation: globalRecommendation,
    },
    prioritization: {
      primaryEmphasis,
      secondaryEmphasis,
      exposureOnly,
      shouldAvoid,
    },
    dataQuality,
    lastUpdated: new Date().toISOString(),
  }
}

// =============================================================================
// TRAINING ADJUSTMENT GENERATORS
// =============================================================================

export interface TrainingAdjustment {
  type: 'add_exercise' | 'increase_volume' | 'decrease_volume' | 'increase_frequency' | 'reduce_intensity' | 'add_prep_work'
  target: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export function generateTrainingAdjustments(
  intelligence: UnifiedSkillIntelligence
): TrainingAdjustment[] {
  const adjustments: TrainingAdjustment[] = []
  
  // Global limiter adjustments
  if (intelligence.globalLimiters.primaryPattern) {
    switch (intelligence.globalLimiters.primaryPattern) {
      case 'pulling_strength':
        adjustments.push({
          type: 'increase_volume',
          target: 'Weighted pull-ups and rows',
          reason: 'Pulling strength limits multiple skills',
          priority: 'high',
        })
        break
      case 'pushing_strength':
        adjustments.push({
          type: 'increase_volume',
          target: 'Weighted dips and PPPU',
          reason: 'Pushing strength limits multiple skills',
          priority: 'high',
        })
        break
      case 'compression':
        adjustments.push({
          type: 'add_exercise',
          target: 'Compression holds and seated leg raises',
          reason: 'Compression deficit affects hip-flexor skills',
          priority: 'high',
        })
        break
      case 'tendon_tolerance':
        adjustments.push({
          type: 'reduce_intensity',
          target: 'All skill progressions',
          reason: 'Low tendon adaptation requires conservative approach',
          priority: 'high',
        })
        adjustments.push({
          type: 'add_prep_work',
          target: 'Isometric prep holds',
          reason: 'Build tendon tolerance gradually',
          priority: 'medium',
        })
        break
      case 'skill_density':
        adjustments.push({
          type: 'increase_frequency',
          target: 'Skill practice sessions',
          reason: 'Insufficient exposure to skills',
          priority: 'high',
        })
        break
      case 'recovery_fatigue':
        adjustments.push({
          type: 'decrease_volume',
          target: 'Overall training load',
          reason: 'Recovery capacity is limiting',
          priority: 'high',
        })
        break
    }
  }
  
  // Skill-specific adjustments
  for (const [skillKey, skill] of Object.entries(intelligence.skills)) {
    if (!skill) continue
    
    if (skill.weakPoints.primaryLimiter && skill.recommendations.emphasisLevel !== 'maintain') {
      const limiter = skill.weakPoints.primaryLimiter
      
      // Only add if not already covered by global adjustment
      const alreadyCovered = adjustments.some(a => 
        a.reason.toLowerCase().includes(limiter.category.replace('_', ' '))
      )
      
      if (!alreadyCovered) {
        adjustments.push({
          type: limiter.category === 'tendon_tolerance' ? 'add_prep_work' : 'add_exercise',
          target: limiter.adjustmentFocus,
          reason: `${skill.skillLabel}: ${limiter.explanation}`,
          priority: limiter.severity === 'primary' ? 'medium' : 'low',
        })
      }
    }
  }
  
  // Sort by priority
  adjustments.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
  
  return adjustments.slice(0, 5) // Max 5 adjustments
}

// =============================================================================
// CONVENIENCE EXPORTS FOR DASHBOARD AND PROGRAM BUILDER
// =============================================================================

/**
 * Get all skill confidence scores as a simple record
 * Useful for dashboard displays showing per-skill confidence bars
 */
export function getAllSkillConfidenceScores(
  sessions: SkillSession[],
  strengthRecords: StrengthRecord[],
  bodyweight: number | null
): Record<SkillKey, number> {
  const intelligence = getUnifiedSkillIntelligence(sessions, strengthRecords, bodyweight)
  
  const scores: Record<SkillKey, number> = {
    front_lever: 0,
    planche: 0,
    muscle_up: 0,
    handstand_pushup: 0,
    handstand: 0,
    l_sit: 0,
    v_sit: 0,
    i_sit: 0,
  }
  
  for (const [key, skill] of Object.entries(intelligence.skills)) {
    if (skill) {
      scores[key as SkillKey] = skill.confidence.confidence
    }
  }
  
  return scores
}

/**
 * Get a summary of weak points across all skills
 * Returns the most common limiters affecting multiple skills
 */
export function getGlobalWeakPointSummary(
  sessions: SkillSession[],
  strengthRecords: StrengthRecord[],
  bodyweight: number | null
): {
  primaryLimiter: LimiterCategory | null
  affectedSkillCount: number
  recommendation: string
  adjustments: TrainingAdjustment[]
} {
  const intelligence = getUnifiedSkillIntelligence(sessions, strengthRecords, bodyweight)
  const adjustments = generateTrainingAdjustments(intelligence)
  
  return {
    primaryLimiter: intelligence.globalLimiters.primaryPattern as LimiterCategory | null,
    affectedSkillCount: intelligence.globalLimiters.affectedSkills.length,
    recommendation: intelligence.globalLimiters.recommendation,
    adjustments,
  }
}
