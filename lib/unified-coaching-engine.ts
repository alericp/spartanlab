// Unified Coaching Engine
// Central orchestration layer that synthesizes all SpartanLab intelligence systems
// into one coherent coaching decision pipeline

import { getAthleteProfile, type AthleteProfile } from './data-service'
import { getOnboardingProfile, type OnboardingProfile, type JointCaution } from './athlete-profile'
import { getCanonicalProfile, logCanonicalProfileState, type CanonicalProgrammingProfile } from './canonical-profile-service'
import { getAthleteSkillStates, type SkillState, type SkillKey } from './skill-state-service'
import { calculateReadinessDecision } from './skill-readiness-engine'
import type { ReadinessDecision } from '@/types/skill-readiness'
import { getReadinessAssessment, type ReadinessAssessment } from './recovery-fatigue-engine'
import { getConstraintContextForProgram, type ProgramConstraintContext, type ConstraintCategory } from './constraint-integration'
import { detectConstraintsSync, type GlobalConstraintResult } from './constraint-detection-engine'
import { getAthleteEnvelopes, getEnvelopeBasedRecommendations, type PerformanceEnvelope } from './performance-envelope-service'
import { getQuickFatigueDecision, type TrainingDecision } from './fatigue-decision-engine'
import { getDeloadRecommendation, type DeloadRecommendation, type FatigueSignalSummary } from './fatigue/deload-system'
import { analyzeEquipmentProfile, type EquipmentProfile } from './equipment-adaptation-engine'
import { selectMethodProfiles, type SelectedMethods, type SelectionContext } from './training-principles-engine'
import { recommendProtocolsForSession, type ProtocolRecommendation } from './protocols/joint-integrity-protocol'
import { calculateRecoverySignal, type RecoverySignal, type RecoveryLevel } from './recovery-engine'
import { 
  getTrainingStyleProfile, 
  getStyleProgrammingRules, 
  inferStyleFromOnboarding,
  getStyleCoachingSummary,
  refineStyleWithEnvelope,
  type TrainingStyleProfile as StyleProfile,
  type StyleProgrammingRules,
  type TrainingStyleMode as StyleMode 
} from './training-style-service'
import {
  selectFramework,
  getFrameworkProgrammingParams,
  getFrameworkCoachingMessage,
  getCurrentFrameworkWeeks,
  recordFrameworkSelection,
  type CoachingFrameworkId,
  type FrameworkSelectionInput,
} from './coaching-framework-engine'
import {
  detectMovementBias,
  applyBiasToVolume,
  generateBiasCoachMessage,
  type MovementBias,
  type BiasType,
  type BiasAdjustment,
  type BenchmarkInput,
} from './movement-bias-detection-engine'
import {
  buildAthleteMemoryProfile,
  getProgramAdjustments,
  getSessionContinuationAdjustments,
  type AthleteMemoryProfile,
  type ProgramAdjustments,
} from './athlete-memory-engine'

// Re-export for use by program generation
export { buildAthleteMemoryProfile, getProgramAdjustments, getSessionContinuationAdjustments }
export type { AthleteMemoryProfile, ProgramAdjustments }
// AthleteMemoryContext is exported via its interface definition below

// =============================================================================
// TYPES - UNIFIED ENGINE CONTEXT
// =============================================================================

export type TrainingStyleMode = 
  | 'skill_focused'
  | 'strength_focused'
  | 'power_focused'
  | 'endurance_focused'
  | 'hypertrophy_supported'
  | 'balanced_hybrid'

export type AdaptationLevel = 'none' | 'minor' | 'moderate' | 'major'
export type EngineConfidence = 'low' | 'medium' | 'high'

export interface AthleteContext {
  // Identity
  userId: string
  username: string
  
  // Physical attributes
  sex: 'male' | 'female'
  heightCm: number | null
  weightKg: number | null
  bodyFatPercent: number | null
  trainingAge: number
  
  // Goals
  primaryGoal: string
  primaryGoalLabel: string
  secondaryGoals: string[]
  
  // Preferences
  trainingDaysPerWeek: number
  sessionDurationMinutes: number
  equipment: string[]
  equipmentProfile: EquipmentProfile
  
  // Injury/caution flags
  jointCautions: string[]
  hasActiveInjury: boolean
  
  // Training style
  trainingStyle: TrainingStyleMode
  stylePriorities: {
    skill: number
    strength: number
    power: number
    endurance: number
    hypertrophy: number
  }
  
  // Style programming rules (derived from style mode)
  styleProgrammingRules: StyleProgrammingRules
  
  // Raw style profile from DB (if exists)
  styleProfile: StyleProfile | null
}

export interface SkillContext {
  states: SkillState[]
  primarySkillState: SkillState | null
  readinessDecision: ReadinessDecision | null
  readinessBreakdown: ReadinessBreakdown | null
}

export interface ReadinessBreakdown {
  overallScore: number
  pullStrengthScore: number
  pushStrengthScore: number
  straightArmScore: number
  compressionScore: number
  scapularControlScore: number
  shoulderStabilityScore: number
  wristToleranceScore: number
  mobilityScore: number
  limitingFactor: string | null
}

export interface ConstraintContext {
  primaryConstraint: ConstraintCategory
  secondaryConstraint: ConstraintCategory | null
  strongQualities: ConstraintCategory[]
  volumeAdjustments: {
    increasePriority: string[]
    maintainPriority: string[]
    decreasePriority: string[]
  }
  explanation: string
}

export interface EnvelopeContext {
  envelopes: PerformanceEnvelope[]
  recommendations: EnvelopeRecommendations
  hasHighConfidenceData: boolean
}

export interface EnvelopeRecommendations {
  preferredRepRange: { min: number; max: number } | null
  preferredSetsPerSession: { min: number; max: number } | null
  preferredWeeklyVolume: { min: number; max: number } | null
  preferredDensity: 'low' | 'moderate' | 'high' | null
  fatigueThreshold: number | null
}

export interface FatigueContext {
  fatigueLevel: 'fresh' | 'normal' | 'fatigued' | 'overtrained'
  recoveryLevel: RecoveryLevel
  recoveryScore: number
  deloadRecommendation: DeloadRecommendation | null
  trainingDecision: TrainingDecision
  requiresDeload: boolean
  sessionAdjustments: SessionAdjustments
}

export interface SessionAdjustments {
  volumeMultiplier: number
  intensityMultiplier: number
  densityAdjustment: 'reduce' | 'maintain' | 'increase'
  skipAccessories: boolean
  includeExtraRecovery: boolean
  notes: string[]
}

export interface ProtocolContext {
  recommendations: ProtocolRecommendation[]
  warmupProtocols: ProtocolRecommendation[]
  recoveryProtocols: ProtocolRecommendation[]
  prehabProtocols: ProtocolRecommendation[]
}

export interface ProgramDecision {
  shouldRegenerate: boolean
  regenerationReason: RegenerationReason | null
  adaptationLevel: AdaptationLevel
  sessionModifications: string[]
}

export type RegenerationReason = 
  | 'frequency_change'
  | 'duration_change'
  | 'equipment_change'
  | 'goal_change'
  | 'style_change'
  | 'major_benchmark_update'
  | 'injury_status_change'
  | 'fatigue_deload'
  | 'adaptive_rebalance'
  | 'framework_update'

export interface CoachingSummary {
  headline: string
  focusAreas: string[]
  currentEmphasis: string
  styleDescription: string
  constraintNote: string | null
  fatigueNote: string | null
  protocolNote: string | null
  frameworkNote: string | null
  sessionNotes: string[]
  confidence: EngineConfidence
}

export interface FrameworkContext {
  frameworkId: string
  frameworkName: string
  confidenceScore: number
  selectionReason: string
  programmingParams: {
    repRange: { min: number; max: number }
    setRange: { min: number; max: number }
    restRange: { min: number; max: number }
    allowFailure: boolean
    backoffSetRequired: boolean
    supersetAllowed: boolean
    circuitAllowed: boolean
  }
  coachingMessage: string
  weeksOnFramework: number
  shouldSwitch: boolean
  switchReason: string | null
}

export interface MovementBiasContext {
  biasType: BiasType
  dominantPattern: string
  weakerPattern: string
  confidenceScore: number
  volumeAdjustment: BiasAdjustment
  coachingMessage: string
  hasStrongBias: boolean
}

export interface AthleteMemoryContext {
  // Activity status
  lastActiveDate: string | null
  inactivityDays: number
  inactivityLevel: 'none' | 'mild' | 'moderate' | 'significant' | 'major'
  
  // Strength memory
  hasHistoricalData: boolean
  peakStrengthExercises: string[] // Exercises with peak PRs
  strengthDropEstimate: number // 0-100%
  
  // Program adjustments derived from memory
  adjustments: ProgramAdjustments
  
  // Weakness profile
  isPushWeak: boolean
  isPullWeak: boolean
  straightArmLagging: boolean
  
  // Progression rate
  averagePRsPerWeek: number
  weeksSinceLastPR: number
  
  // Full memory profile reference
  fullProfile: AthleteMemoryProfile
}

export interface UnifiedEngineContext {
  // Core athlete data
  athlete: AthleteContext
  
  // Skill-specific state
  skills: SkillContext
  
  // Constraints and limitations
  constraints: ConstraintContext
  
  // Performance response patterns
  envelope: EnvelopeContext
  
  // Fatigue and recovery
  fatigue: FatigueContext
  
  // Joint protocols
  protocols: ProtocolContext
  
  // Coaching framework methodology
  framework: FrameworkContext
  
  // Movement bias (push/pull/compression dominance)
  movementBias: MovementBiasContext
  
  // Athlete memory (historical training intelligence)
  memory: AthleteMemoryContext
  
  // Program decisions
  programDecision: ProgramDecision
  
  // Human-readable summary
  coachingSummary: CoachingSummary
  
  // Meta
  dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent'
  lastUpdated: string
  engineVersion: string
}

// =============================================================================
// ENGINE PIPELINE
// =============================================================================

const ENGINE_VERSION = '1.0.0'

/**
 * Main entry point - builds complete unified context
 * This is the single source of truth for all coaching decisions
 */
export async function buildUnifiedContext(userId: string): Promise<UnifiedEngineContext> {
  const timestamp = new Date().toISOString()
  
  // Step 1: Load AthleteProfile (root input)
  const athleteContext = await loadAthleteContext(userId)
  
  // Step 2: Load SkillState records
  const skillContext = await loadSkillContext(userId, athleteContext.primaryGoal)
  
  // Step 3: Calculate readiness breakdown
  const readinessBreakdown = calculateReadinessBreakdown(skillContext, athleteContext)
  if (readinessBreakdown) {
    skillContext.readinessBreakdown = readinessBreakdown
  }
  
  // Step 4: Detect constraints
  const constraintContext = buildConstraintContext(athleteContext.primaryGoal)
  
  // Step 5: Load performance envelopes
  const envelopeContext = await loadEnvelopeContext(userId)
  
  // Step 6: Assess fatigue and recovery state
  const fatigueContext = await buildFatigueContext(userId, athleteContext)
  
  // Step 7: Get joint protocol recommendations
  const protocolContext = buildProtocolContext(
    athleteContext,
    skillContext,
    constraintContext,
    fatigueContext
  )
  
  // Step 8: Select coaching framework
  const frameworkContext = buildFrameworkContext(
    userId,
    athleteContext,
    skillContext,
    constraintContext,
    envelopeContext
  )
  
  // Step 9: Detect movement bias (push/pull/compression dominance)
  const movementBiasContext = buildMovementBiasContext(
    userId,
    athleteContext,
    skillContext,
    constraintContext
  )
  
  // Step 10: Build athlete memory (historical training intelligence)
  const memoryContext = await buildMemoryContext(userId)
  
  // Step 11: Determine program decisions (now memory-informed)
  const programDecision = determineProgramDecision(
    athleteContext,
    fatigueContext,
    constraintContext,
    frameworkContext,
    memoryContext
  )
  
  // Step 12: Generate coaching summary
  const coachingSummary = generateCoachingSummary(
    athleteContext,
    skillContext,
    constraintContext,
    fatigueContext,
    envelopeContext,
    frameworkContext,
    movementBiasContext,
    memoryContext
  )
  
  // Step 13: Assess data quality
  const dataQuality = assessDataQuality(skillContext, envelopeContext, fatigueContext)
  
  return {
    athlete: athleteContext,
    skills: skillContext,
    constraints: constraintContext,
    envelope: envelopeContext,
    fatigue: fatigueContext,
    protocols: protocolContext,
    framework: frameworkContext,
    movementBias: movementBiasContext,
    memory: memoryContext,
    programDecision,
    coachingSummary,
    dataQuality,
    lastUpdated: timestamp,
    engineVersion: ENGINE_VERSION,
  }
}

// =============================================================================
// STEP 1: ATHLETE CONTEXT
// =============================================================================

async function loadAthleteContext(userId: string): Promise<AthleteContext> {
  // CANONICAL FIX: Use unified canonical profile as primary truth
  const canonical = getCanonicalProfile()
  logCanonicalProfileState('loadAthleteContext')
  
  // Legacy reads for backward compatibility (async sources)
  const profile = await getAthleteProfile(userId)
  const onboarding = await getOnboardingProfile(userId)
  
  // Load training style profile from DB (if exists)
  const styleProfileFromDb = await getTrainingStyleProfile(userId)
  
  // CANONICAL FIX: Use canonical profile as primary source, with fallbacks
  const equipment = canonical.equipmentAvailable.length > 0 
    ? canonical.equipmentAvailable 
    : (profile?.equipment || onboarding?.equipment || ['pull_bar', 'dip_bars', 'floor'])
  const equipmentProfile = analyzeEquipmentProfile(equipment)
  
  // Determine training style - prefer DB, then infer from onboarding
  const trainingStyle = styleProfileFromDb?.styleMode || inferStyleFromOnboarding(onboarding || {})
  const stylePriorities = styleProfileFromDb 
    ? {
        skill: styleProfileFromDb.skillPriority,
        strength: styleProfileFromDb.strengthPriority,
        power: styleProfileFromDb.powerPriority,
        endurance: styleProfileFromDb.endurancePriority,
        hypertrophy: styleProfileFromDb.hypertrophyPriority,
      }
    : calculateStylePriorities(trainingStyle)
  
  // Get programming rules for the style
  const styleProgrammingRules = getStyleProgrammingRules(trainingStyle)
  
  // CANONICAL FIX: Use canonical profile for primary goal truth
  const primaryGoal = canonical.primaryGoal || onboarding?.primaryGoal || 'front_lever'
  const secondaryGoal = canonical.secondaryGoal
  const secondaryGoals = secondaryGoal 
    ? [secondaryGoal, ...(canonical.selectedSkills || []).filter(s => s !== primaryGoal && s !== secondaryGoal)]
    : (canonical.selectedSkills || []).filter(s => s !== primaryGoal)
  
  return {
    userId,
    username: profile?.username || 'Athlete',
    sex: (onboarding?.sex as 'male' | 'female') || 'male',
    heightCm: canonical.height || onboarding?.heightCm || null,
    weightKg: canonical.bodyweight || onboarding?.weightKg || null,
    bodyFatPercent: onboarding?.bodyFatPercent || null,
    trainingAge: onboarding?.trainingAge || 1,
    // CANONICAL FIX: Use canonical goals
    primaryGoal,
    primaryGoalLabel: getGoalLabel(primaryGoal),
    secondaryGoals,
    // CANONICAL FIX: Use canonical schedule with flexible support
    trainingDaysPerWeek: canonical.scheduleMode === 'flexible' ? 4 : (canonical.trainingDaysPerWeek || onboarding?.trainingDaysPerWeek || 3),
    sessionDurationMinutes: canonical.sessionLengthMinutes || getSessionMinutes(onboarding?.workoutDuration || 'standard'),
    equipment,
    equipmentProfile,
    // CANONICAL FIX: Use canonical joint cautions
    jointCautions: canonical.jointCautions.length > 0 ? canonical.jointCautions : (onboarding?.jointCautions || []),
    hasActiveInjury: canonical.jointCautions.length > 0 || (onboarding?.jointCautions?.length || 0) > 0,
    trainingStyle,
    stylePriorities,
    styleProgrammingRules,
    styleProfile: styleProfileFromDb,
  }
}

function inferTrainingStyle(profile: OnboardingProfile | null): TrainingStyleMode {
  if (!profile) return 'balanced_hybrid'
  
  const outcome = profile.primaryOutcome
  
  switch (outcome) {
    case 'strength':
      return 'strength_focused'
    case 'skills':
      return 'skill_focused'
    case 'endurance':
      return 'endurance_focused'
    case 'max_reps':
      return 'endurance_focused'
    case 'military':
      return 'balanced_hybrid'
    default:
      return 'balanced_hybrid'
  }
}

function calculateStylePriorities(style: TrainingStyleMode): AthleteContext['stylePriorities'] {
  switch (style) {
    case 'skill_focused':
      return { skill: 50, strength: 25, power: 10, endurance: 10, hypertrophy: 5 }
    case 'strength_focused':
      return { skill: 20, strength: 50, power: 15, endurance: 5, hypertrophy: 10 }
    case 'power_focused':
      return { skill: 15, strength: 30, power: 40, endurance: 5, hypertrophy: 10 }
    case 'endurance_focused':
      return { skill: 15, strength: 15, power: 5, endurance: 55, hypertrophy: 10 }
    case 'hypertrophy_supported':
      return { skill: 25, strength: 25, power: 5, endurance: 10, hypertrophy: 35 }
    case 'balanced_hybrid':
    default:
      return { skill: 30, strength: 30, power: 10, endurance: 15, hypertrophy: 15 }
  }
}

function getGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    front_lever: 'Front Lever',
    back_lever: 'Back Lever',
    planche: 'Planche',
    hspu: 'Handstand Push-Up',
    muscle_up: 'Muscle-Up',
    l_sit: 'L-Sit',
    handstand_push_up: 'Handstand Push-Up',
  }
  return labels[goal] || goal.replace(/_/g, ' ')
}

function getSessionMinutes(duration: string): number {
  const durations: Record<string, number> = {
    short: 30,
    standard: 45,
    extended: 60,
    comprehensive: 75,
  }
  return durations[duration] || 45
}

// =============================================================================
// STEP 2: SKILL CONTEXT
// =============================================================================

async function loadSkillContext(userId: string, primaryGoal: string): Promise<SkillContext> {
  const states = await getAthleteSkillStates(userId)
  const primarySkillState = states.find(s => s.skill === primaryGoal) || null
  
  // Get readiness decision if we have skill data
  let readinessDecision: ReadinessDecision | null = null
  // Note: readiness calculation requires session data which is loaded separately
  
  return {
    states,
    primarySkillState,
    readinessDecision,
    readinessBreakdown: null, // Populated in step 3
  }
}

// =============================================================================
// STEP 3: READINESS BREAKDOWN
// =============================================================================

function calculateReadinessBreakdown(
  skillContext: SkillContext,
  athleteContext: AthleteContext
): ReadinessBreakdown | null {
  const primary = skillContext.primarySkillState
  if (!primary) return null
  
  // Use skill state data to build breakdown
  // These would ideally come from stored readiness calculations
  const baseScore = primary.readinessScore || 50
  const limitingFactor = primary.limitingFactor
  
  // Estimate component scores based on limiting factor
  const breakdown: ReadinessBreakdown = {
    overallScore: baseScore,
    pullStrengthScore: baseScore + (limitingFactor === 'pull_strength' ? -20 : 10),
    pushStrengthScore: baseScore + (limitingFactor === 'push_strength' ? -20 : 10),
    straightArmScore: baseScore + (limitingFactor?.includes('straight_arm') ? -20 : 5),
    compressionScore: baseScore + (limitingFactor === 'compression' ? -25 : 5),
    scapularControlScore: baseScore + (limitingFactor === 'scapular_control' ? -15 : 5),
    shoulderStabilityScore: baseScore + (limitingFactor === 'shoulder_stability' ? -20 : 5),
    wristToleranceScore: baseScore + (limitingFactor === 'wrist_tolerance' ? -20 : 10),
    mobilityScore: baseScore + (limitingFactor === 'mobility' ? -15 : 5),
    limitingFactor,
  }
  
  // Clamp all scores to 0-100
  Object.keys(breakdown).forEach(key => {
    if (typeof breakdown[key as keyof ReadinessBreakdown] === 'number') {
      (breakdown as Record<string, number>)[key] = Math.max(0, Math.min(100, 
        breakdown[key as keyof ReadinessBreakdown] as number
      ))
    }
  })
  
  return breakdown
}

// =============================================================================
// STEP 4: CONSTRAINT CONTEXT
// =============================================================================

function buildConstraintContext(primaryGoal: string): ConstraintContext {
  const programContext = getConstraintContextForProgram(primaryGoal)
  
  return {
    primaryConstraint: programContext.primaryConstraint,
    secondaryConstraint: programContext.secondaryConstraint,
    strongQualities: programContext.strongQualities,
    volumeAdjustments: programContext.volumeAdjustments,
    explanation: programContext.explanation,
  }
}

// =============================================================================
// STEP 5: ENVELOPE CONTEXT
// =============================================================================

async function loadEnvelopeContext(userId: string): Promise<EnvelopeContext> {
  const envelopes = await getAthleteEnvelopes(userId)
  
  // Check if we have high-confidence data
  const hasHighConfidenceData = envelopes.some(e => e.confidenceScore >= 0.7)
  
  // Aggregate recommendations from envelopes
  const recommendations = aggregateEnvelopeRecommendations(envelopes)
  
  return {
    envelopes,
    recommendations,
    hasHighConfidenceData,
  }
}

function aggregateEnvelopeRecommendations(envelopes: PerformanceEnvelope[]): EnvelopeRecommendations {
  if (envelopes.length === 0) {
    return {
      preferredRepRange: null,
      preferredSetsPerSession: null,
      preferredWeeklyVolume: null,
      preferredDensity: null,
      fatigueThreshold: null,
    }
  }
  
  // Find the envelope with highest confidence for primary recommendations
  const sorted = [...envelopes].sort((a, b) => b.confidenceScore - a.confidenceScore)
  const primary = sorted[0]
  
  return {
    preferredRepRange: primary.preferredRepRangeMin && primary.preferredRepRangeMax
      ? { min: primary.preferredRepRangeMin, max: primary.preferredRepRangeMax }
      : null,
    preferredSetsPerSession: primary.preferredSetRangeMin && primary.preferredSetRangeMax
      ? { min: primary.preferredSetRangeMin, max: primary.preferredSetRangeMax }
      : null,
    preferredWeeklyVolume: primary.preferredWeeklyVolumeMin && primary.preferredWeeklyVolumeMax
      ? { min: primary.preferredWeeklyVolumeMin, max: primary.preferredWeeklyVolumeMax }
      : null,
    preferredDensity: primary.preferredDensityLevel as 'low' | 'moderate' | 'high' | null,
    fatigueThreshold: primary.fatigueThreshold,
  }
}

// =============================================================================
// STEP 6: FATIGUE CONTEXT
// =============================================================================

async function buildFatigueContext(
  userId: string,
  athleteContext: AthleteContext
): Promise<FatigueContext> {
  // Get fatigue decision
  const trainingDecision = getQuickFatigueDecision()
  
  // Get recovery signal
  const recoverySignal = calculateRecoverySignal(userId)
  
  // Get deload recommendation
  const deloadRecommendation = await getDeloadRecommendation(userId)
  
  // Determine fatigue level
  const fatigueLevel = determineFatigueLevel(trainingDecision, deloadRecommendation)
  
  // Calculate session adjustments
  const sessionAdjustments = calculateSessionAdjustments(fatigueLevel, trainingDecision)
  
  return {
    fatigueLevel,
    recoveryLevel: recoverySignal.level,
    recoveryScore: recoverySignal.score,
    deloadRecommendation,
    trainingDecision,
    requiresDeload: deloadRecommendation?.shouldDeload || false,
    sessionAdjustments,
  }
}

function determineFatigueLevel(
  decision: TrainingDecision,
  deload: DeloadRecommendation | null
): FatigueContext['fatigueLevel'] {
  if (deload?.shouldDeload && deload.severity === 'high') return 'overtrained'
  if (deload?.shouldDeload) return 'fatigued'
  
  switch (decision.recommendation) {
    case 'full_session':
      return 'fresh'
    case 'modified_session':
      return 'normal'
    case 'light_session':
      return 'fatigued'
    case 'rest_day':
      return 'overtrained'
    default:
      return 'normal'
  }
}

function calculateSessionAdjustments(
  fatigueLevel: FatigueContext['fatigueLevel'],
  decision: TrainingDecision
): SessionAdjustments {
  const notes: string[] = []
  
  let volumeMultiplier = 1.0
  let intensityMultiplier = 1.0
  let densityAdjustment: 'reduce' | 'maintain' | 'increase' = 'maintain'
  let skipAccessories = false
  let includeExtraRecovery = false
  
  switch (fatigueLevel) {
    case 'fresh':
      volumeMultiplier = 1.0
      intensityMultiplier = 1.0
      notes.push('Full training capacity available.')
      break
      
    case 'normal':
      volumeMultiplier = 0.95
      intensityMultiplier = 1.0
      notes.push('Normal training with standard recovery.')
      break
      
    case 'fatigued':
      volumeMultiplier = 0.75
      intensityMultiplier = 0.90
      densityAdjustment = 'reduce'
      includeExtraRecovery = true
      notes.push('Reduced volume to support recovery.')
      notes.push('Focus on quality over quantity.')
      break
      
    case 'overtrained':
      volumeMultiplier = 0.50
      intensityMultiplier = 0.80
      densityAdjustment = 'reduce'
      skipAccessories = true
      includeExtraRecovery = true
      notes.push('Deload in progress.')
      notes.push('Accessory work reduced to essential only.')
      break
  }
  
  return {
    volumeMultiplier,
    intensityMultiplier,
    densityAdjustment,
    skipAccessories,
    includeExtraRecovery,
    notes,
  }
}

// =============================================================================
// STEP 7: PROTOCOL CONTEXT
// =============================================================================

function buildProtocolContext(
  athleteContext: AthleteContext,
  skillContext: SkillContext,
  constraintContext: ConstraintContext,
  fatigueContext: FatigueContext
): ProtocolContext {
  // Build skill relevance list for protocol recommendations
  const skillRelevance: string[] = []
  
  // Add primary skill
  const skillKey = skillContext.primarySkillState?.skill
  if (skillKey) {
    const skillMapping: Record<string, string> = {
      'front_lever': 'front_lever',
      'back_lever': 'back_lever',
      'planche': 'planche',
      'hspu': 'handstand_pushup',
      'muscle_up': 'muscle_up',
      'l_sit': 'l_sit',
    }
    const mapped = skillMapping[skillKey]
    if (mapped) skillRelevance.push(mapped)
  }
  
  // Add general categories based on constraints
  if (constraintContext.primaryConstraint?.includes('pull')) {
    skillRelevance.push('general_pulling')
  }
  if (constraintContext.primaryConstraint?.includes('push')) {
    skillRelevance.push('general_pushing')
  }
  if (constraintContext.primaryConstraint?.includes('compression')) {
    skillRelevance.push('general_compression')
  }
  
  // Get protocols using the session recommendation function
  const allProtocols = recommendProtocolsForSession({
    primarySkill: athleteContext.primaryGoal,
    jointCautions: athleteContext.jointCautions as JointCaution[],
    sessionFocus: skillContext.primarySkillState?.skill 
      ? [skillContext.primarySkillState.skill as string]
      : [],
    experienceLevel: 'intermediate',
    sessionLength: athleteContext.sessionDurationMinutes,
    includeRecovery: fatigueContext.fatigueLevel === 'fatigued' || fatigueContext.fatigueLevel === 'overtrained',
  })
  
  // Categorize protocols by timing
  const warmupProtocols = allProtocols.filter(p => p.timing === 'warmup')
  const recoveryProtocols = allProtocols.filter(p => p.timing === 'cooldown')
  const prehabProtocols = allProtocols.filter(p => p.timing === 'standalone')
  
  return {
    recommendations: allProtocols,
    warmupProtocols,
    recoveryProtocols,
    prehabProtocols,
  }
}

// =============================================================================
// STEP 8: FRAMEWORK CONTEXT
// =============================================================================

function buildFrameworkContext(
  userId: string,
  athleteContext: AthleteContext,
  skillContext: SkillContext,
  constraintContext: ConstraintContext,
  envelopeContext: EnvelopeContext
): FrameworkContext {
  // Build framework selection input from unified context
  const hasTendonConcern = athleteContext.jointCautions.some(c => 
    c.toLowerCase().includes('tendon') || 
    c.toLowerCase().includes('elbow') || 
    c.toLowerCase().includes('bicep')
  )
  
  // Build skill levels map
  const skillLevels: Record<string, number> = {}
  for (const state of skillContext.states) {
    // Convert level to numeric score
    const levelScores: Record<string, number> = {
      'beginner': 1,
      'novice': 2,
      'intermediate': 3,
      'advanced': 4,
      'elite': 5,
    }
    skillLevels[state.skill] = levelScores[state.currentLevel] || 1
  }
  
  const input: FrameworkSelectionInput = {
    primaryGoal: athleteContext.primaryGoal,
    secondaryGoals: athleteContext.secondaryGoals,
    experienceLevel: getExperienceLevelFromTrainingAge(athleteContext.trainingAge),
    trainingStyle: athleteContext.trainingStyle,
    equipment: athleteContext.equipment,
    jointCautions: athleteContext.jointCautions,
    primarySkill: skillContext.primarySkillState?.skill || null,
    skillLevels,
    readinessScore: skillContext.readinessBreakdown?.overallScore || 50,
    limitingFactor: skillContext.readinessBreakdown?.limitingFactor || null,
    primaryConstraint: constraintContext.primaryConstraint || null,
    hasTendonConcern,
    preferredRepRange: envelopeContext.recommendations.preferredRepRange,
    preferredDensity: envelopeContext.recommendations.preferredDensity,
    envelopeConfidence: envelopeContext.hasHighConfidenceData ? 0.8 : 0.3,
    currentFrameworkId: null, // Would be loaded from DB in full implementation
    weeksOnCurrentFramework: getCurrentFrameworkWeeks(userId),
  }
  
  // Select framework
  const result = selectFramework(input)
  
  // Get programming params
  const params = getFrameworkProgrammingParams(result.selectedFrameworkId)
  
  // Record selection if switching
  if (result.shouldSwitch) {
    recordFrameworkSelection(userId, result.selectedFrameworkId, result.switchReason)
  }
  
  return {
    frameworkId: result.selectedFrameworkId,
    frameworkName: result.framework.frameworkName,
    confidenceScore: result.confidenceScore,
    selectionReason: result.selectionReason,
    programmingParams: {
      repRange: params.repRange,
      setRange: params.setRange,
      restRange: params.restRange,
      allowFailure: params.allowFailure,
      backoffSetRequired: params.backoffSetRequired,
      supersetAllowed: params.supersetAllowed,
      circuitAllowed: params.circuitAllowed,
    },
    coachingMessage: getFrameworkCoachingMessage(result.selectedFrameworkId),
    weeksOnFramework: input.weeksOnCurrentFramework,
    shouldSwitch: result.shouldSwitch,
    switchReason: result.switchReason,
  }
}

/**
 * Map training age to experience level
 */
function getExperienceLevelFromTrainingAge(trainingAge: number): 'beginner' | 'intermediate' | 'advanced' | 'elite' {
  if (trainingAge < 1) return 'beginner'
  if (trainingAge < 3) return 'intermediate'
  if (trainingAge < 6) return 'advanced'
  return 'elite'
}

// =============================================================================
// STEP 9: MOVEMENT BIAS CONTEXT
// =============================================================================

function buildMovementBiasContext(
  userId: string,
  athleteContext: AthleteContext,
  skillContext: SkillContext,
  constraintContext: ConstraintContext
): MovementBiasContext {
  // Build benchmark input from skill readiness breakdown
  const benchmarks: BenchmarkInput = {}
  
  // Extract readiness scores from skill context
  const readiness = skillContext.readinessBreakdown
  if (readiness) {
    // Convert readiness scores to estimated benchmarks
    // Pull strength component maps to pull-up estimate
    if (readiness.pullStrengthScore > 0) {
      benchmarks.pullUps = Math.round(readiness.pullStrengthScore / 5) // ~20 at 100 score
      benchmarks.frontLeverReadiness = readiness.straightArmScore
    }
    // Push strength component maps to dip estimate
    if (readiness.pushStrengthScore > 0) {
      benchmarks.dips = Math.round(readiness.pushStrengthScore / 4) // ~25 at 100 score
      benchmarks.plancheReadiness = readiness.straightArmScore * 0.8 // Planche typically harder
    }
    // Compression component maps to hollow hold
    if (readiness.compressionScore > 0) {
      benchmarks.hollowHold = Math.round(readiness.compressionScore * 0.6) // ~60s at 100 score
      benchmarks.lSit = Math.round(readiness.compressionScore * 0.3) // ~30s at 100 score
    }
  }
  
  // Add bodyweight if available
  if (athleteContext.weightKg) {
    benchmarks.bodyweight = athleteContext.weightKg
  }
  
  // Detect movement bias
  const bias = detectMovementBias({
    athleteId: userId,
    benchmarks,
    skillState: {
      frontLever: skillContext.states.find(s => s.skill === 'front_lever')
        ? {
            readiness: readiness?.straightArmScore || 50,
            currentNode: skillContext.states.find(s => s.skill === 'front_lever')?.currentNode || 'tuck',
            confidence: 0.7,
          }
        : undefined,
      planche: skillContext.states.find(s => s.skill === 'planche')
        ? {
            readiness: readiness?.straightArmScore ? readiness.straightArmScore * 0.8 : 40,
            currentNode: skillContext.states.find(s => s.skill === 'planche')?.currentNode || 'lean',
            confidence: 0.7,
          }
        : undefined,
    },
    weakPoints: constraintContext.primaryConstraint 
      ? [constraintContext.primaryConstraint as any]
      : [],
  })
  
  // Generate coaching message
  const coachingMessage = generateBiasCoachMessage(bias)
  
  // Determine if bias is significant enough to influence programming
  const hasStrongBias = bias.biasType !== 'balanced' && bias.confidenceScore >= 0.6
  
  return {
    biasType: bias.biasType,
    dominantPattern: bias.dominantPattern,
    weakerPattern: bias.weakerPattern,
    confidenceScore: bias.confidenceScore,
    volumeAdjustment: bias.recommendedAdjustments,
    coachingMessage,
    hasStrongBias,
  }
}

// =============================================================================
// STEP 10: ATHLETE MEMORY CONTEXT
// =============================================================================

async function buildMemoryContext(userId: string): Promise<AthleteMemoryContext> {
  try {
    // Build the full memory profile from history
    const fullProfile = await buildAthleteMemoryProfile(userId)
    
    // Get program adjustments based on memory
    const adjustments = getProgramAdjustments(fullProfile)
    
    return {
      lastActiveDate: fullProfile.lastActiveDate,
      inactivityDays: fullProfile.inactivityDays,
      inactivityLevel: fullProfile.inactivityLevel,
      hasHistoricalData: fullProfile.dataQuality !== 'none',
      peakStrengthExercises: fullProfile.peakStrengthMetrics.map(m => m.exerciseName),
      strengthDropEstimate: fullProfile.strengthDropEstimate.overallDrop,
      adjustments,
      isPushWeak: fullProfile.weaknessProfile.isPushWeak,
      isPullWeak: fullProfile.weaknessProfile.isPullWeak,
      straightArmLagging: fullProfile.weaknessProfile.straightArmLagging,
      averagePRsPerWeek: fullProfile.progressionRateEstimate.averagePRsPerWeek,
      weeksSinceLastPR: fullProfile.progressionRateEstimate.weeksSinceLastPR,
      fullProfile,
    }
  } catch (error) {
    console.error('[UnifiedEngine] Error building memory context:', error)
    // Return default context if memory fails
    return {
      lastActiveDate: null,
      inactivityDays: 0,
      inactivityLevel: 'none',
      hasHistoricalData: false,
      peakStrengthExercises: [],
      strengthDropEstimate: 0,
      adjustments: {
        intensityMultiplier: 1.0,
        volumeMultiplier: 1.0,
        pushVolumeMultiplier: 1.0,
        pullVolumeMultiplier: 1.0,
        straightArmVolumeMultiplier: 1.0,
        reintroductionWeeks: 0,
        useHistoricalBaselines: false,
        prBasedTargets: new Map(),
        explanations: [],
      },
      isPushWeak: false,
      isPullWeak: false,
      straightArmLagging: false,
      averagePRsPerWeek: 0,
      weeksSinceLastPR: 0,
      fullProfile: null as unknown as AthleteMemoryProfile,
    }
  }
}

// =============================================================================
// STEP 11: PROGRAM DECISION
// =============================================================================

function determineProgramDecision(
  athleteContext: AthleteContext,
  fatigueContext: FatigueContext,
  constraintContext: ConstraintContext,
  frameworkContext: FrameworkContext,
  memoryContext?: AthleteMemoryContext
): ProgramDecision {
  const sessionModifications: string[] = []
  let shouldRegenerate = false
  let regenerationReason: RegenerationReason | null = null
  let adaptationLevel: AdaptationLevel = 'none'
  
  // Check for memory-triggered adjustments (returning after break)
  if (memoryContext && memoryContext.inactivityLevel !== 'none') {
    if (memoryContext.inactivityLevel === 'major' || memoryContext.inactivityLevel === 'significant') {
      // Major break - may need program adjustment
      adaptationLevel = memoryContext.inactivityLevel === 'major' ? 'major' : 'moderate'
      sessionModifications.push(memoryContext.adjustments.explanations[0] || 'Returning after break')
    } else {
      // Mild/moderate break - session-level adjustments
      sessionModifications.push(`Intensity adjusted for return (${memoryContext.inactivityDays} days off)`)
    }
  }
  
  // Check for framework-triggered regeneration
  if (frameworkContext.shouldSwitch) {
    shouldRegenerate = true
    regenerationReason = 'framework_update'
    adaptationLevel = 'major'
    sessionModifications.push(frameworkContext.switchReason || 'Framework updated')
  }
  
  // Check for deload-triggered regeneration
  if (fatigueContext.requiresDeload) {
    shouldRegenerate = true
    regenerationReason = 'fatigue_deload'
    adaptationLevel = 'major'
    sessionModifications.push('Deload week initiated')
  }
  
  // Session-level modifications based on fatigue
  if (fatigueContext.fatigueLevel === 'fatigued' && !fatigueContext.requiresDeload) {
    adaptationLevel = 'moderate'
    sessionModifications.push('Volume reduced for recovery')
    if (fatigueContext.sessionAdjustments.skipAccessories) {
      sessionModifications.push('Accessory work minimized')
    }
  }
  
  // Constraint-based modifications
  if (constraintContext.primaryConstraint) {
    sessionModifications.push(`Emphasis on ${constraintContext.primaryConstraint.replace(/_/g, ' ')}`)
  }
  
  // Weakness-based modifications from memory
  if (memoryContext?.isPushWeak) {
    sessionModifications.push('Extra pushing volume to address imbalance')
  } else if (memoryContext?.isPullWeak) {
    sessionModifications.push('Extra pulling volume to address imbalance')
  }
  
  // Framework-specific session modifications
  sessionModifications.push(frameworkContext.coachingMessage)
  
  return {
    shouldRegenerate,
    regenerationReason,
    adaptationLevel,
    sessionModifications,
  }
}

// =============================================================================
// STEP 9: COACHING SUMMARY
// =============================================================================

function generateCoachingSummary(
  athleteContext: AthleteContext,
  skillContext: SkillContext,
  constraintContext: ConstraintContext,
  fatigueContext: FatigueContext,
  envelopeContext: EnvelopeContext,
  frameworkContext: FrameworkContext,
  movementBiasContext: MovementBiasContext,
  memoryContext?: AthleteMemoryContext
): CoachingSummary {
  const focusAreas: string[] = []
  const sessionNotes: string[] = []
  
  // Build headline - adjust for returning athletes
  let headline = `${athleteContext.primaryGoalLabel} Development`
  if (memoryContext && memoryContext.inactivityLevel !== 'none' && memoryContext.inactivityLevel !== 'mild') {
    headline = `Welcome Back - ${athleteContext.primaryGoalLabel} Rebuild`
  } else if (skillContext.primarySkillState?.currentLevel) {
    headline += ` - Working toward ${skillContext.primarySkillState.nextMilestone || 'next milestone'}`
  }
  
  // Add memory-based session notes
  if (memoryContext) {
    if (memoryContext.inactivityLevel !== 'none') {
      sessionNotes.push(`Returning after ${memoryContext.inactivityDays} days - adjustments applied`)
    }
    if (memoryContext.hasHistoricalData && memoryContext.adjustments.useHistoricalBaselines) {
      sessionNotes.push('Working weights based on PR history')
    }
    for (const explanation of memoryContext.adjustments.explanations.slice(0, 2)) {
      sessionNotes.push(explanation)
    }
  }
  
  // Current emphasis based on style - use the enhanced style summary
  const styleDescription = getStyleCoachingSummary(
    athleteContext.trainingStyle,
    athleteContext.primaryGoal,
    constraintContext.primaryConstraint || undefined
  )
  
  // Focus areas from constraints
  if (constraintContext.volumeAdjustments.increasePriority.length > 0) {
    focusAreas.push(...constraintContext.volumeAdjustments.increasePriority.slice(0, 2))
  }
  focusAreas.push(athleteContext.primaryGoal.replace(/_/g, ' '))
  
  // Add movement bias focus area if significant
  if (movementBiasContext.hasStrongBias) {
    focusAreas.push(`${movementBiasContext.weakerPattern} development`)
  }
  
  // Build constraint note
  let constraintNote: string | null = null
  if (constraintContext.primaryConstraint) {
    const label = constraintContext.primaryConstraint.replace(/_/g, ' ')
    constraintNote = `Primary focus on developing ${label} to support skill progression.`
  }
  
  // Build fatigue note
  let fatigueNote: string | null = null
  if (fatigueContext.fatigueLevel === 'fatigued') {
    fatigueNote = 'Recovery-focused session. Volume reduced to support adaptation.'
  } else if (fatigueContext.fatigueLevel === 'overtrained') {
    fatigueNote = 'Deload in progress. Essential work only this week.'
  }
  
  // Protocol note
  let protocolNote: string | null = null
  if (athleteContext.jointCautions.length > 0) {
    protocolNote = `Joint protocols included for ${athleteContext.jointCautions.join(', ')}.`
  }
  
  // Framework note
  const frameworkNote = `${frameworkContext.frameworkName}: ${frameworkContext.coachingMessage}`
  
  // Session notes from fatigue adjustments
  sessionNotes.push(...fatigueContext.sessionAdjustments.notes)
  
  // Add movement bias coaching note if significant
  if (movementBiasContext.hasStrongBias && movementBiasContext.coachingMessage) {
    sessionNotes.push(movementBiasContext.coachingMessage)
  }
  
  // Add envelope-based insight if available
  if (envelopeContext.hasHighConfidenceData && envelopeContext.recommendations.preferredRepRange) {
    const { min, max } = envelopeContext.recommendations.preferredRepRange
    sessionNotes.push(`You respond well to ${min}-${max} rep ranges for strength work.`)
  }
  
  // Determine confidence
  let confidence: EngineConfidence = 'medium'
  if (skillContext.states.length >= 3 && envelopeContext.hasHighConfidenceData) {
    confidence = 'high'
  } else if (skillContext.states.length === 0) {
    confidence = 'low'
  }
  
  return {
    headline,
    focusAreas: [...new Set(focusAreas)], // Deduplicate
    currentEmphasis: constraintContext.primaryConstraint?.replace(/_/g, ' ') || 'balanced development',
    styleDescription,
    constraintNote,
    fatigueNote,
    protocolNote,
    frameworkNote,
    sessionNotes,
    confidence,
  }
}

// =============================================================================
// STEP 10: DATA QUALITY ASSESSMENT
// =============================================================================

function assessDataQuality(
  skillContext: SkillContext,
  envelopeContext: EnvelopeContext,
  fatigueContext: FatigueContext
): UnifiedEngineContext['dataQuality'] {
  let score = 0
  
  // Skill states exist
  if (skillContext.states.length > 0) score += 25
  if (skillContext.primarySkillState) score += 15
  
  // Envelope data
  if (envelopeContext.envelopes.length > 0) score += 20
  if (envelopeContext.hasHighConfidenceData) score += 15
  
  // Fatigue data
  if (fatigueContext.trainingDecision) score += 15
  
  // Readiness breakdown
  if (skillContext.readinessBreakdown) score += 10
  
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 30) return 'partial'
  return 'insufficient'
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get quick coaching summary without full context build
 */
export async function getQuickCoachingSummary(userId: string): Promise<CoachingSummary> {
  const context = await buildUnifiedContext(userId)
  return context.coachingSummary
}

/**
 * Check if program regeneration is needed
 */
export async function shouldRegenerateProgram(userId: string): Promise<{
  shouldRegenerate: boolean
  reason: RegenerationReason | null
}> {
  const context = await buildUnifiedContext(userId)
  return {
    shouldRegenerate: context.programDecision.shouldRegenerate,
    reason: context.programDecision.regenerationReason,
  }
}

/**
 * Get session adjustments for today's workout
 */
export async function getTodaySessionAdjustments(userId: string): Promise<SessionAdjustments> {
  const context = await buildUnifiedContext(userId)
  return context.fatigue.sessionAdjustments
}

/**
 * Get all relevant protocol recommendations
 */
export async function getSessionProtocols(userId: string): Promise<ProtocolContext> {
  const context = await buildUnifiedContext(userId)
  return context.protocols
}

/**
 * Get current coaching framework and explanation
 */
export async function getCoachingFramework(userId: string): Promise<FrameworkContext> {
  const context = await buildUnifiedContext(userId)
  return context.framework
}

/**
 * Get framework programming parameters for session generation
 */
export async function getFrameworkSessionParams(userId: string): Promise<{
  repRange: { min: number; max: number }
  setRange: { min: number; max: number }
  restRange: { min: number; max: number }
  allowFailure: boolean
  backoffSetRequired: boolean
  supersetAllowed: boolean
  circuitAllowed: boolean
  frameworkName: string
  coachingMessage: string
}> {
  const context = await buildUnifiedContext(userId)
  return {
    ...context.framework.programmingParams,
    frameworkName: context.framework.frameworkName,
    coachingMessage: context.framework.coachingMessage,
  }
}
