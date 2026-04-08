/**
 * ==========================================================================
 * WEEK ADAPTATION DECISION CONTRACT
 * ==========================================================================
 * 
 * CANONICAL AUTHORITY: This contract is the SINGLE source of truth for
 * week-level adaptation decisions during program generation.
 * 
 * The generator MUST obey this contract. No parallel week-level heuristics
 * are allowed to override these decisions downstream.
 * 
 * This contract determines:
 * - Target weekly frequency
 * - First-week acclimation protection
 * - Load management bias (volume/intensity/density)
 * - Recovery spacing requirements
 * - Finisher/density layer suppression
 * - Connective tissue protection
 * 
 * ==========================================================================
 */

import type { ExperienceLevel, TrainingDays } from '@/lib/program-service'
import type { ReadinessAssessment, ReadinessState } from '@/lib/recovery-fatigue-engine'
import type { ConsistencyStatus } from '@/lib/consistency-momentum-engine'
import type { TrainingPathType, JointCaution } from '@/lib/athlete-profile'
import type { AuthoritativeGenerationTruthIngestion } from '@/lib/server/authoritative-generation-truth-ingestion'

// =============================================================================
// TYPES
// =============================================================================

export type AdaptationPhase = 
  | 'initial_acclimation'       // First week or post-restart - conservative approach
  | 'normal_progression'        // Stable training, standard progression rules apply
  | 'recovery_constrained'      // Recent recovery signals indicate caution needed
  | 'rebuild_after_disruption'  // Coming back from missed sessions or consistency issues

export type BiasLevel = 'reduced' | 'normal' | 'elevated'
export type ProtectionLevel = 'protected' | 'normal' | 'expanded'
export type ConfidenceLevel = 'low' | 'moderate' | 'high'
export type ComplexityLevel = 'low' | 'moderate' | 'high'

// =============================================================================
// ADHERENCE EVENT TYPES - For skip/partial/rest tracking
// =============================================================================

export type AdherenceEventType = 
  | 'completed_session'
  | 'partial_session_completed'
  | 'skipped_session'
  | 'rest_day_due_to_recovery'
  | 'rest_day_due_to_schedule'
  | 'rest_day_due_to_pain'
  | 'rest_day_due_to_fatigue'
  | 'rest_day_due_to_sleep'
  | 'rest_day_due_to_soreness'

export interface AdherenceEvent {
  type: AdherenceEventType
  sessionIndex: number
  recordedAt: string
  reason?: string
  recoveryImpact: 'none' | 'minor' | 'moderate' | 'significant'
}

// =============================================================================
// REMAINDER-OF-WEEK STRATEGY TYPES
// =============================================================================

export type RemainderStrategy = 
  | 'continue_as_planned'
  | 'compress_remaining_sessions'
  | 'reduce_remaining_volume'
  | 'reduce_remaining_intensity'
  | 'reduce_accessories_only'
  | 'convert_to_recovery_session'
  | 'skip_remaining_finishers'
  | 'redistribute_skill_exposure'

export interface RemainderOfWeekDecision {
  /** The chosen strategy for remaining sessions */
  strategy: RemainderStrategy
  /** Why this strategy was chosen */
  reason: string
  /** Specific sessions affected */
  affectedSessions: number[]
  /** Volume adjustment factor (1.0 = no change, 0.8 = 20% reduction) */
  volumeAdjustmentFactor: number
  /** Intensity adjustment factor */
  intensityAdjustmentFactor: number
  /** Whether finishers should be suppressed for remainder */
  suppressFinishers: boolean
  /** Whether accessories should be reduced */
  reduceAccessories: boolean
  /** Evidence that drove this decision */
  evidence: string[]
}

export interface LoadStrategy {
  /** Volume bias - affects total sets across the week */
  volumeBias: BiasLevel
  /** Intensity bias - affects RPE targets */
  intensityBias: BiasLevel
  /** Density bias - affects rest periods and superset usage */
  densityBias: BiasLevel
  /** Finisher inclusion - whether to include finishers/AMRAP/density blocks */
  finisherBias: 'limited' | 'normal' | 'expanded'
  /** Straight-arm exposure - affects planche/FL/lever work volume */
  straightArmExposureBias: ProtectionLevel
  /** Connective tissue protection - affects tendon-heavy exercise selection */
  connectiveTissueBias: 'protected' | 'normal'
  /** Rest spacing - affects inter-session recovery guidance */
  restSpacingBias: 'increased' | 'normal'
}

export interface FirstWeekGovernor {
  /** Whether first-week protection is active */
  active: boolean
  /** Reasons why governor was activated */
  reasons: string[]
  /** Reduce total training days this week */
  reduceDays: boolean
  /** Reduce set counts per exercise */
  reduceSets: boolean
  /** Reduce rep/hold targets */
  reduceRepsOrHoldTargets: boolean
  /** Cap RPE lower than normal */
  reduceRPE: boolean
  /** Skip finishers entirely */
  suppressFinishers: boolean
  /** Avoid high-stress patterns (failure sets, drop sets, etc.) */
  protectHighStressPatterns: boolean
}

export interface AdherenceContext {
  /** Number of missed sessions in last 7-14 days */
  recentMissedSessions: number
  /** Number of partially completed sessions */
  recentPartialSessions: number
  /** Overall consistency pattern */
  consistencyStatus: 'stable' | 'mixed' | 'disrupted'
  /** How many usable adherence signals we have */
  usableSignalCount: number
}

export interface RecoveryContext {
  /** Current readiness state label */
  readinessState: ReadinessState | 'unknown'
  /** Current fatigue assessment */
  fatigueState: 'low' | 'moderate' | 'high' | 'unknown'
  /** Risk of excessive soreness */
  sorenessRisk: 'low' | 'moderate' | 'high'
  /** Overall recovery risk */
  recoveryRisk: 'low' | 'moderate' | 'high'
}

export interface ComplexityContext {
  /** Overall onboarding complexity based on selections */
  onboardingComplexity: ComplexityLevel
  /** Goal complexity (primary + secondary + additional) */
  goalComplexity: ComplexityLevel
  /** Style complexity (skill/strength/hybrid/flexibility overlaps) */
  styleComplexity: ComplexityLevel
  /** Skill demand complexity (number and difficulty of skills) */
  skillDemandComplexity: ComplexityLevel
  /** Raw counts for transparency */
  rawCounts: {
    goals: number
    styles: number
    skills: number
    jointCautions: number
    straightArmSkills: number
  }
}

export interface WeekAdaptationDecision {
  /** Current adaptation phase */
  phase: AdaptationPhase
  /** Confidence in this decision */
  confidence: ConfidenceLevel
  /** Target training days for this week */
  targetDays: number
  /** Explanation of why this day count was chosen */
  dayCountReason: string
  
  /** Load management strategy for the week */
  loadStrategy: LoadStrategy
  
  /** First-week protection settings */
  firstWeekGovernor: FirstWeekGovernor
  
  /** Adherence context used in decision */
  adherenceContext: AdherenceContext
  
  /** Recovery context used in decision */
  recoveryContext: RecoveryContext
  
  /** Complexity context used in decision */
  complexityContext: ComplexityContext
  
  /** Remainder-of-week strategy (populated when adherence events occur mid-week) */
  remainderStrategy?: RemainderOfWeekDecision
  
  /** Doctrine constraints that influenced this decision */
  doctrineConstraints: string[]
  
  /** Evidence trail - what inputs drove this decision */
  evidence: string[]
  
  /** Trigger source for this decision */
  triggerSource: 'first_week_initial_generation' | 'regenerate_after_settings_change' | 'weekly_adaptation_after_usage' | 'mid_week_adjustment'
  
  /** Timestamp of decision */
  decidedAt: string
}

// =============================================================================
// INPUT CONTRACT - What the builder provides
// =============================================================================

export interface WeekAdaptationInput {
  // Identity
  generationIntent: string
  isFreshBaselineBuild: boolean
  
  // Profile truth
  experienceLevel?: ExperienceLevel
  trainingDaysPerWeek?: TrainingDays | number | 'flexible'
  scheduleMode?: 'static' | 'flexible'
  trainingPathType?: TrainingPathType
  
  // Goal complexity
  primaryGoal?: string
  secondaryGoal?: string | null
  additionalGoals?: string[]
  
  // Skill complexity
  selectedSkills?: string[]
  straightArmSkills?: string[]  // Skills with high tendon demand
  
  // Style complexity
  trainingStyles?: string[]
  
  // Constraints
  jointCautions?: JointCaution[]
  equipmentLimitations?: string[]
  
  // Recovery/Readiness (if available)
  readinessAssessment?: ReadinessAssessment | null
  consistencyStatus?: ConsistencyStatus | null
  
  // Adherence signals (if available)
  recentMissedSessions?: number
  recentPartialSessions?: number
  totalSessionsLast7Days?: number
  totalSessionsLast14Days?: number
  
  // Program context
  isFirstGeneratedWeek?: boolean
  weekNumber?: number
  previousWeekAdaptation?: WeekAdaptationDecision | null
}

// =============================================================================
// COMPLEXITY SCORING
// =============================================================================

function scoreComplexity(count: number, thresholds: { low: number; high: number }): ComplexityLevel {
  if (count <= thresholds.low) return 'low'
  if (count >= thresholds.high) return 'high'
  return 'moderate'
}

function buildComplexityContext(input: WeekAdaptationInput): ComplexityContext {
  const goalCount = [
    input.primaryGoal,
    input.secondaryGoal,
    ...(input.additionalGoals || [])
  ].filter(Boolean).length
  
  const styleCount = (input.trainingStyles || []).length
  const skillCount = (input.selectedSkills || []).length
  const jointCautionCount = (input.jointCautions || []).length
  const straightArmCount = (input.straightArmSkills || []).length
  
  // Detect straight-arm skills from selectedSkills if not provided separately
  const straightArmPatterns = ['planche', 'front_lever', 'back_lever', 'iron_cross', 'maltese']
  const detectedStraightArm = straightArmCount > 0 
    ? straightArmCount 
    : (input.selectedSkills || []).filter(s => 
        straightArmPatterns.some(p => s.toLowerCase().includes(p))
      ).length
  
  return {
    onboardingComplexity: calculateOverallComplexity(goalCount, styleCount, skillCount, jointCautionCount),
    goalComplexity: scoreComplexity(goalCount, { low: 1, high: 3 }),
    styleComplexity: scoreComplexity(styleCount, { low: 1, high: 3 }),
    skillDemandComplexity: scoreComplexity(skillCount, { low: 2, high: 5 }),
    rawCounts: {
      goals: goalCount,
      styles: styleCount,
      skills: skillCount,
      jointCautions: jointCautionCount,
      straightArmSkills: detectedStraightArm,
    }
  }
}

function calculateOverallComplexity(
  goals: number, 
  styles: number, 
  skills: number, 
  cautions: number
): ComplexityLevel {
  // Weighted complexity score
  const score = (goals * 2) + (styles * 1.5) + (skills * 1) + (cautions * 1)
  
  if (score <= 4) return 'low'
  if (score >= 10) return 'high'
  return 'moderate'
}

// =============================================================================
// RECOVERY CONTEXT BUILDER
// =============================================================================

function buildRecoveryContext(input: WeekAdaptationInput): RecoveryContext {
  const readiness = input.readinessAssessment
  
  if (!readiness) {
    return {
      readinessState: 'unknown',
      fatigueState: 'unknown',
      sorenessRisk: 'moderate', // Default to moderate when unknown
      recoveryRisk: 'moderate',
    }
  }
  
  // Map readiness factors to fatigue state
  let fatigueState: 'low' | 'moderate' | 'high' | 'unknown' = 'unknown'
  if (readiness.factors) {
    const { recentVolume, recentIntensity, consecutiveHardDays } = readiness.factors
    if (recentVolume === 'high' || recentIntensity === 'high' || consecutiveHardDays >= 3) {
      fatigueState = 'high'
    } else if (recentVolume === 'low' && recentIntensity === 'low') {
      fatigueState = 'low'
    } else {
      fatigueState = 'moderate'
    }
  }
  
  // Map soreness to risk
  const sorenessRisk: 'low' | 'moderate' | 'high' = 
    readiness.factors?.soreness === 'severe' ? 'high' :
    readiness.factors?.soreness === 'moderate' ? 'moderate' : 'low'
  
  // Overall recovery risk
  const recoveryRisk: 'low' | 'moderate' | 'high' =
    readiness.shouldDeload ? 'high' :
    readiness.state === 'recovery_focused' ? 'high' :
    readiness.state === 'keep_controlled' ? 'moderate' : 'low'
  
  return {
    readinessState: readiness.state,
    fatigueState,
    sorenessRisk,
    recoveryRisk,
  }
}

// =============================================================================
// ADHERENCE CONTEXT BUILDER
// =============================================================================

function buildAdherenceContext(input: WeekAdaptationInput): AdherenceContext {
  const missed = input.recentMissedSessions ?? 0
  const partial = input.recentPartialSessions ?? 0
  const consistency = input.consistencyStatus
  
  // Determine consistency status
  let consistencyStatus: 'stable' | 'mixed' | 'disrupted' = 'stable'
  if (consistency) {
    if (consistency.isInConsistentStreak && consistency.currentStreak >= 3) {
      consistencyStatus = 'stable'
    } else if (missed >= 2 || consistency.gapDays >= 5) {
      consistencyStatus = 'disrupted'
    } else if (missed >= 1 || partial >= 1) {
      consistencyStatus = 'mixed'
    }
  } else if (missed >= 2) {
    consistencyStatus = 'disrupted'
  } else if (missed >= 1 || partial >= 1) {
    consistencyStatus = 'mixed'
  }
  
  // Count usable signals
  let usableSignalCount = 0
  if (input.totalSessionsLast7Days !== undefined) usableSignalCount++
  if (input.totalSessionsLast14Days !== undefined) usableSignalCount++
  if (consistency) usableSignalCount++
  if (input.readinessAssessment) usableSignalCount++
  
  return {
    recentMissedSessions: missed,
    recentPartialSessions: partial,
    consistencyStatus,
    usableSignalCount,
  }
}

// =============================================================================
// FIRST WEEK GOVERNOR LOGIC
// =============================================================================

function buildFirstWeekGovernor(
  input: WeekAdaptationInput,
  complexity: ComplexityContext,
  recovery: RecoveryContext,
  adherence: AdherenceContext
): FirstWeekGovernor {
  const isFirstWeek = input.isFreshBaselineBuild || 
                      input.isFirstGeneratedWeek || 
                      input.weekNumber === 1 ||
                      input.generationIntent === 'onboarding_first_build'
  
  if (!isFirstWeek) {
    return {
      active: false,
      reasons: [],
      reduceDays: false,
      reduceSets: false,
      reduceRepsOrHoldTargets: false,
      reduceRPE: false,
      suppressFinishers: false,
      protectHighStressPatterns: false,
    }
  }
  
  const reasons: string[] = ['First week of new program']
  const governor: FirstWeekGovernor = {
    active: true,
    reasons,
    reduceDays: false,
    reduceSets: false,
    reduceRepsOrHoldTargets: false,
    reduceRPE: false,
    suppressFinishers: false,
    protectHighStressPatterns: false,
  }
  
  // HIGH COMPLEXITY: Protect via dosage, not necessarily day count
  if (complexity.onboardingComplexity === 'high') {
    reasons.push('High onboarding complexity detected')
    governor.reduceSets = true
    governor.suppressFinishers = true
    governor.protectHighStressPatterns = true
    
    // Only reduce days if also has recovery risk
    if (recovery.recoveryRisk === 'high' || adherence.consistencyStatus === 'disrupted') {
      governor.reduceDays = true
      reasons.push('Recovery/adherence risk compounds complexity')
    }
  }
  
  // MODERATE COMPLEXITY: Light protection
  if (complexity.onboardingComplexity === 'moderate') {
    governor.suppressFinishers = true
    governor.protectHighStressPatterns = true
    reasons.push('Moderate complexity - protecting high-stress patterns')
  }
  
  // STRAIGHT-ARM HEAVY: Always protect connective tissue on first week
  if (complexity.rawCounts.straightArmSkills >= 2) {
    governor.reduceRepsOrHoldTargets = true
    governor.protectHighStressPatterns = true
    reasons.push('Multiple straight-arm skills - protecting connective tissue')
  }
  
  // BEGINNER: More conservative first week
  if (input.experienceLevel === 'beginner') {
    governor.reduceRPE = true
    governor.reduceSets = true
    reasons.push('Beginner level - conservative introduction')
  }
  
  // RECOVERY ALREADY COMPROMISED
  if (recovery.recoveryRisk === 'high') {
    governor.reduceDays = true
    governor.reduceRPE = true
    reasons.push('Recovery risk elevated - reducing exposure')
  }
  
  return governor
}

// =============================================================================
// LOAD STRATEGY BUILDER
// =============================================================================

function buildLoadStrategy(
  input: WeekAdaptationInput,
  complexity: ComplexityContext,
  recovery: RecoveryContext,
  adherence: AdherenceContext,
  governor: FirstWeekGovernor
): LoadStrategy {
  const strategy: LoadStrategy = {
    volumeBias: 'normal',
    intensityBias: 'normal',
    densityBias: 'normal',
    finisherBias: 'normal',
    straightArmExposureBias: 'normal',
    connectiveTissueBias: 'normal',
    restSpacingBias: 'normal',
  }
  
  // Apply first-week governor overrides
  if (governor.active) {
    if (governor.reduceSets) strategy.volumeBias = 'reduced'
    if (governor.reduceRPE) strategy.intensityBias = 'reduced'
    if (governor.suppressFinishers) strategy.finisherBias = 'limited'
    if (governor.protectHighStressPatterns) strategy.densityBias = 'reduced'
  }
  
  // Recovery-driven adjustments
  if (recovery.recoveryRisk === 'high') {
    strategy.volumeBias = 'reduced'
    strategy.intensityBias = 'reduced'
    strategy.finisherBias = 'limited'
    strategy.restSpacingBias = 'increased'
  } else if (recovery.recoveryRisk === 'moderate') {
    strategy.densityBias = 'reduced'
    strategy.finisherBias = 'limited'
  }
  
  // Adherence-driven adjustments
  if (adherence.consistencyStatus === 'disrupted') {
    strategy.volumeBias = 'reduced'
    strategy.finisherBias = 'limited'
  }
  
  // Straight-arm protection
  if (complexity.rawCounts.straightArmSkills >= 2) {
    strategy.straightArmExposureBias = 'protected'
    strategy.connectiveTissueBias = 'protected'
  } else if (complexity.rawCounts.straightArmSkills >= 1) {
    strategy.connectiveTissueBias = 'protected'
  }
  
  // Joint caution protection
  if (complexity.rawCounts.jointCautions >= 2) {
    strategy.connectiveTissueBias = 'protected'
    strategy.intensityBias = strategy.intensityBias === 'reduced' ? 'reduced' : 'reduced'
  }
  
  // Advanced athletes with stable adherence can handle more
  if (input.experienceLevel === 'advanced' || input.experienceLevel === 'elite') {
    if (adherence.consistencyStatus === 'stable' && recovery.recoveryRisk === 'low') {
      // Don't override governor, but allow normal/elevated if not constrained
      if (strategy.finisherBias === 'normal') {
        strategy.finisherBias = 'expanded'
      }
    }
  }
  
  return strategy
}

// =============================================================================
// TARGET DAYS CALCULATION
// =============================================================================

function calculateTargetDays(
  input: WeekAdaptationInput,
  complexity: ComplexityContext,
  recovery: RecoveryContext,
  adherence: AdherenceContext,
  governor: FirstWeekGovernor
): { targetDays: number; reason: string } {
  // Start with user preference
  let baseDays: number
  if (typeof input.trainingDaysPerWeek === 'number') {
    baseDays = input.trainingDaysPerWeek
  } else if (input.scheduleMode === 'flexible') {
    // Default flexible range based on experience
    baseDays = input.experienceLevel === 'beginner' ? 3 :
               input.experienceLevel === 'intermediate' ? 4 :
               input.experienceLevel === 'advanced' ? 5 : 4
  } else {
    baseDays = 4 // Safe default
  }
  
  let targetDays = baseDays
  const reasons: string[] = [`Base: ${baseDays} days from profile`]
  
  // Apply governor reduction
  if (governor.active && governor.reduceDays) {
    const reduction = complexity.onboardingComplexity === 'high' ? 2 : 1
    targetDays = Math.max(2, targetDays - reduction)
    reasons.push(`First-week reduction: -${reduction} day(s)`)
  }
  
  // Recovery-driven reduction
  if (recovery.recoveryRisk === 'high' && !governor.reduceDays) {
    targetDays = Math.max(2, targetDays - 1)
    reasons.push('Recovery risk reduction: -1 day')
  }
  
  // Adherence-driven reduction
  if (adherence.consistencyStatus === 'disrupted' && !governor.reduceDays) {
    targetDays = Math.max(2, targetDays - 1)
    reasons.push('Disrupted adherence reduction: -1 day')
  }
  
  // Ensure reasonable bounds
  targetDays = Math.max(2, Math.min(7, targetDays))
  
  return {
    targetDays,
    reason: reasons.join('. ')
  }
}

// =============================================================================
// PHASE DETERMINATION
// =============================================================================

function determinePhase(
  input: WeekAdaptationInput,
  recovery: RecoveryContext,
  adherence: AdherenceContext,
  governor: FirstWeekGovernor
): AdaptationPhase {
  // First week is always acclimation
  if (governor.active) {
    return 'initial_acclimation'
  }
  
  // Recovery constraints take priority
  if (recovery.recoveryRisk === 'high') {
    return 'recovery_constrained'
  }
  
  // Disrupted adherence suggests rebuild
  if (adherence.consistencyStatus === 'disrupted') {
    return 'rebuild_after_disruption'
  }
  
  // Default to normal progression
  return 'normal_progression'
}

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

function calculateConfidence(
  input: WeekAdaptationInput,
  adherence: AdherenceContext
): ConfidenceLevel {
  // More signals = higher confidence
  if (adherence.usableSignalCount >= 3 && input.readinessAssessment) {
    return 'high'
  }
  if (adherence.usableSignalCount >= 2) {
    return 'moderate'
  }
  return 'low'
}

// =============================================================================
// REMAINDER-OF-WEEK DECISION BUILDER
// =============================================================================

/**
 * Build a remainder-of-week adjustment decision based on mid-week adherence events.
 * Called when adherence signals indicate the week should be adjusted.
 */
export function buildRemainderOfWeekDecision(
  adherenceEvents: AdherenceEvent[],
  remainingSessions: number,
  currentComplexity: ComplexityContext,
  currentRecovery: RecoveryContext
): RemainderOfWeekDecision {
  const evidence: string[] = []
  
  // Count event types
  const skipped = adherenceEvents.filter(e => e.type === 'skipped_session').length
  const partial = adherenceEvents.filter(e => e.type === 'partial_session_completed').length
  const recoveryRests = adherenceEvents.filter(e => 
    e.type.startsWith('rest_day_due_to_')
  ).length
  
  evidence.push(`Adherence events: ${skipped} skipped, ${partial} partial, ${recoveryRests} recovery rests`)
  
  // Default decision
  let strategy: RemainderStrategy = 'continue_as_planned'
  let volumeAdjustmentFactor = 1.0
  let intensityAdjustmentFactor = 1.0
  let suppressFinishers = false
  let reduceAccessories = false
  let reason = 'No significant adherence disruption detected'
  
  // Recovery-driven rest days signal fatigue
  const hasFatigueSignal = adherenceEvents.some(e => 
    e.type === 'rest_day_due_to_fatigue' || 
    e.type === 'rest_day_due_to_sleep' ||
    e.type === 'rest_day_due_to_soreness'
  )
  
  const hasPainSignal = adherenceEvents.some(e => e.type === 'rest_day_due_to_pain')
  
  // Multiple skips or partials indicate consistency issues
  if (skipped >= 2 || (skipped >= 1 && partial >= 1)) {
    strategy = 'compress_remaining_sessions'
    volumeAdjustmentFactor = 0.85
    suppressFinishers = true
    reason = 'Multiple missed/partial sessions - compressing remainder with reduced volume'
    evidence.push('High disruption: compressing and reducing')
  } else if (hasPainSignal) {
    strategy = 'reduce_remaining_intensity'
    intensityAdjustmentFactor = 0.85
    reduceAccessories = true
    reason = 'Pain signal detected - reducing intensity and accessories for remainder'
    evidence.push('Pain signal: protecting via intensity reduction')
  } else if (hasFatigueSignal) {
    strategy = 'reduce_remaining_volume'
    volumeAdjustmentFactor = 0.9
    suppressFinishers = true
    reason = 'Fatigue/soreness signal - reducing volume and skipping finishers'
    evidence.push('Fatigue signal: volume reduction active')
  } else if (skipped === 1 || partial >= 1) {
    strategy = 'skip_remaining_finishers'
    suppressFinishers = true
    reason = 'Minor disruption - maintaining structure but skipping finishers'
    evidence.push('Minor disruption: finisher suppression only')
  } else if (recoveryRests >= 1) {
    strategy = 'reduce_accessories_only'
    reduceAccessories = true
    reason = 'Recovery rest taken - reducing accessory burden for remainder'
    evidence.push('Recovery rest: accessory reduction')
  }
  
  // Additional protection for high complexity
  if (currentComplexity.onboardingComplexity === 'high' && strategy !== 'continue_as_planned') {
    volumeAdjustmentFactor = Math.min(volumeAdjustmentFactor, 0.85)
    evidence.push('High complexity amplifies adjustment')
  }
  
  // Additional protection for already-elevated recovery risk
  if (currentRecovery.recoveryRisk === 'high') {
    intensityAdjustmentFactor = Math.min(intensityAdjustmentFactor, 0.9)
    suppressFinishers = true
    evidence.push('Elevated recovery risk: additional protection applied')
  }
  
  return {
    strategy,
    reason,
    affectedSessions: Array.from({ length: remainingSessions }, (_, i) => i),
    volumeAdjustmentFactor,
    intensityAdjustmentFactor,
    suppressFinishers,
    reduceAccessories,
    evidence,
  }
}

// =============================================================================
// MAIN BUILDER
// =============================================================================

/**
 * Build the canonical Week Adaptation Decision
 * 
 * This is the SINGLE authoritative source for week-level adaptation.
 * The generator MUST obey this contract.
 */
export function buildWeekAdaptationDecision(
  input: WeekAdaptationInput,
  adherenceEvents?: AdherenceEvent[]
): WeekAdaptationDecision {
  const evidence: string[] = []
  
  // Build context layers
  const complexity = buildComplexityContext(input)
  evidence.push(`Complexity: ${complexity.onboardingComplexity} (${complexity.rawCounts.goals}G/${complexity.rawCounts.skills}S/${complexity.rawCounts.styles}St)`)
  
  const recovery = buildRecoveryContext(input)
  if (recovery.readinessState !== 'unknown') {
    evidence.push(`Recovery: ${recovery.readinessState}, risk=${recovery.recoveryRisk}`)
  }
  
  const adherence = buildAdherenceContext(input)
  evidence.push(`Adherence: ${adherence.consistencyStatus} (${adherence.usableSignalCount} signals)`)
  
  // Build first-week governor
  const governor = buildFirstWeekGovernor(input, complexity, recovery, adherence)
  if (governor.active) {
    evidence.push(`First-week governor: ${governor.reasons.join(', ')}`)
  }
  
  // Build load strategy
  const loadStrategy = buildLoadStrategy(input, complexity, recovery, adherence, governor)
  
  // Calculate target days
  const { targetDays, reason: dayCountReason } = calculateTargetDays(
    input, complexity, recovery, adherence, governor
  )
  evidence.push(`Target days: ${targetDays}`)
  
  // Determine phase and confidence
  const phase = determinePhase(input, recovery, adherence, governor)
  const confidence = calculateConfidence(input, adherence)
  
  // Build doctrine constraints
  const doctrineConstraints: string[] = []
  if (complexity.rawCounts.straightArmSkills >= 2) {
    doctrineConstraints.push('Multi-straight-arm tendon protection active')
  }
  if (complexity.rawCounts.jointCautions > 0) {
    doctrineConstraints.push(`Joint caution protocol for ${complexity.rawCounts.jointCautions} area(s)`)
  }
  if (governor.active && governor.protectHighStressPatterns) {
    doctrineConstraints.push('High-stress pattern suppression active')
  }
  
  // Determine trigger source
  let triggerSource: WeekAdaptationDecision['triggerSource'] = 'first_week_initial_generation'
  if (adherenceEvents && adherenceEvents.length > 0) {
    triggerSource = 'mid_week_adjustment'
  } else if (input.generationIntent === 'regenerate' || input.generationIntent === 'rebuild_current') {
    triggerSource = 'regenerate_after_settings_change'
  } else if (input.weekNumber && input.weekNumber > 1) {
    triggerSource = 'weekly_adaptation_after_usage'
  } else if (governor.active) {
    triggerSource = 'first_week_initial_generation'
  }
  
  // Build remainder-of-week strategy if adherence events provided
  let remainderStrategy: RemainderOfWeekDecision | undefined
  if (adherenceEvents && adherenceEvents.length > 0) {
    const remainingSessions = Math.max(0, targetDays - adherenceEvents.filter(e => 
      e.type === 'completed_session' || e.type === 'partial_session_completed'
    ).length)
    remainderStrategy = buildRemainderOfWeekDecision(
      adherenceEvents,
      remainingSessions,
      complexity,
      recovery
    )
    evidence.push(`Remainder strategy: ${remainderStrategy.strategy}`)
  }
  
  return {
    phase,
    confidence,
    targetDays,
    dayCountReason,
    loadStrategy,
    firstWeekGovernor: governor,
    adherenceContext: adherence,
    recoveryContext: recovery,
    complexityContext: complexity,
    remainderStrategy,
    doctrineConstraints,
    evidence,
    triggerSource,
    decidedAt: new Date().toISOString(),
  }
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get a human-readable summary of the adaptation decision
 */
export function getAdaptationSummary(decision: WeekAdaptationDecision): string {
  const parts: string[] = []
  
  parts.push(`Phase: ${decision.phase.replace(/_/g, ' ')}`)
  parts.push(`${decision.targetDays} days/week`)
  
  if (decision.loadStrategy.volumeBias !== 'normal') {
    parts.push(`volume ${decision.loadStrategy.volumeBias}`)
  }
  if (decision.loadStrategy.intensityBias !== 'normal') {
    parts.push(`intensity ${decision.loadStrategy.intensityBias}`)
  }
  if (decision.firstWeekGovernor.active) {
    parts.push('first-week protection')
  }
  
  return parts.join(' • ')
}

/**
 * Get the adaptation bias summary for display
 */
export function getAdaptationBiasSummary(decision: WeekAdaptationDecision): {
  label: string
  sublabel: string
  isProtective: boolean
} {
  const { loadStrategy, firstWeekGovernor, phase } = decision
  
  const isProtective = 
    loadStrategy.volumeBias === 'reduced' ||
    loadStrategy.intensityBias === 'reduced' ||
    firstWeekGovernor.active ||
    phase === 'initial_acclimation' ||
    phase === 'recovery_constrained'
  
  let label: string
  let sublabel: string
  
  if (phase === 'initial_acclimation') {
    label = 'Acclimation Week'
    sublabel = 'Conservative dosage for new program adaptation'
  } else if (phase === 'recovery_constrained') {
    label = 'Recovery Priority'
    sublabel = 'Reduced load to support recovery'
  } else if (phase === 'rebuild_after_disruption') {
    label = 'Rebuilding Phase'
    sublabel = 'Ramping back up after training gap'
  } else {
    label = 'Normal Progression'
    sublabel = 'Standard training load'
  }
  
  return { label, sublabel, isProtective }
}

// =============================================================================
// [AUTHORITATIVE-TRUTH-INGESTION-CONTRACT] TRUTH INGESTION CONVERSION
// =============================================================================

/**
 * Build a WeekAdaptationInput from an AuthoritativeGenerationTruthIngestion.
 * This is the preferred way to feed the week adaptation contract from the
 * authoritative generation service.
 */
export function buildWeekAdaptationInputFromIngestion(
  ingestion: AuthoritativeGenerationTruthIngestion,
  additionalContext?: {
    generationIntent?: string
    isFreshBaselineBuild?: boolean
    weekNumber?: number
    previousWeekAdaptation?: WeekAdaptationDecision | null
  }
): WeekAdaptationInput {
  const profile = ingestion.profileTruth.canonicalProfile
  
  // Extract straight-arm skills from selected skills
  const straightArmPatterns = ['planche', 'front_lever', 'back_lever', 'iron_cross', 'maltese']
  const straightArmSkills = (profile.selectedSkills || []).filter(s =>
    straightArmPatterns.some(p => s.toLowerCase().includes(p))
  )
  
  return {
    // Identity
    generationIntent: additionalContext?.generationIntent || ingestion.currentProgramContext.recentGenerationIntent || 'unknown',
    isFreshBaselineBuild: additionalContext?.isFreshBaselineBuild ?? ingestion.currentProgramContext.isFirstGeneratedWeek,
    
    // Profile truth from authoritative ingestion
    experienceLevel: profile.experienceLevel as ExperienceLevel,
    trainingDaysPerWeek: profile.trainingDaysPerWeek as TrainingDays | number | 'flexible' | undefined,
    scheduleMode: profile.scheduleMode,
    trainingPathType: profile.trainingPathType as TrainingPathType | undefined,
    
    // Goal complexity
    primaryGoal: profile.primaryGoal || undefined,
    secondaryGoal: profile.secondaryGoal,
    additionalGoals: profile.goalCategories || undefined,
    
    // Skill complexity
    selectedSkills: profile.selectedSkills,
    straightArmSkills,
    
    // Style complexity
    trainingStyles: profile.trainingMethodPreferences?.map(String) || [],
    
    // Constraints
    jointCautions: profile.jointCautions as JointCaution[] | undefined,
    equipmentLimitations: undefined, // Not tracked in current ingestion
    
    // Recovery/Readiness from ingestion
    // Note: We don't have full ReadinessAssessment/ConsistencyStatus objects from server-side
    // Instead we use the normalized signals
    readinessAssessment: ingestion.recoveryTruth.rawAssessment || undefined,
    consistencyStatus: ingestion.adherenceTruth.rawConsistencyStatus || undefined,
    
    // Adherence signals from ingestion
    recentMissedSessions: ingestion.adherenceTruth.recentMissedSessions,
    recentPartialSessions: ingestion.adherenceTruth.recentPartialSessions,
    totalSessionsLast7Days: ingestion.adherenceTruth.totalSessionsLast7Days,
    totalSessionsLast14Days: ingestion.adherenceTruth.totalSessionsLast14Days,
    
    // Program context from ingestion
    isFirstGeneratedWeek: ingestion.currentProgramContext.isFirstGeneratedWeek,
    weekNumber: additionalContext?.weekNumber,
    previousWeekAdaptation: additionalContext?.previousWeekAdaptation || null,
  }
}

/**
 * Get adherence consistency status from ingestion truth.
 * Helper for code that needs the string consistency label.
 */
export function getConsistencyStatusFromIngestion(
  ingestion: AuthoritativeGenerationTruthIngestion
): 'stable' | 'mixed' | 'disrupted' | 'unknown' {
  return ingestion.adherenceTruth.consistencyStatus
}

/**
 * Get recovery risk level from ingestion truth.
 * Helper for code that needs the recovery risk label.
 */
export function getRecoveryRiskFromIngestion(
  ingestion: AuthoritativeGenerationTruthIngestion
): 'low' | 'moderate' | 'high' | 'unknown' {
  return ingestion.recoveryTruth.recoveryRisk
}
