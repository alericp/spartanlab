/**
 * CANONICAL MATERIALITY CONTRACT
 * 
 * =============================================================================
 * PURPOSE: Ensure saved athlete truth MATERIALLY affects program generation
 * =============================================================================
 * 
 * This contract bridges canonical profile truth → concrete generation levers.
 * It makes personalization deterministic rather than soft/explanatory.
 * 
 * ARCHITECTURE:
 * 1. Built ONCE per generation from canonical profile + history + feedback
 * 2. Consumed by builder sections (structure, exercise, method, weighted, etc.)
 * 3. Validated after generation to ensure levers were honored
 * 
 * SECTIONS:
 * - identityTruth: Who the athlete is (goals, skills, experience)
 * - historyTruth: Recent training patterns and adaptation signals
 * - bottleneckTruth: Ranked weak points and limiters
 * - personalizationLevers: Concrete downstream generation levers
 * - provenanceAudit: Source tracking for transparency
 * 
 * LOG PREFIX: [materiality-contract]
 */

import type { CanonicalProgrammingProfile, TrainingMethodPreference } from './canonical-profile-service'
import type { TrainingFeedbackSummary } from './training-feedback-loop'
import type { DetectedWeakPoints, LimiterDrivenProgramMods } from './weak-point-engine'

// =============================================================================
// TYPES - IDENTITY TRUTH
// =============================================================================

export interface IdentityTruth {
  // Core goals
  primaryGoal: string
  secondaryGoal: string | null
  
  // Skills with priority ordering
  selectedSkills: string[]
  skillPriorities: {
    primary: string[]      // Top 1-2 skills to emphasize
    secondary: string[]    // 2-3 skills to include meaningfully
    tertiary: string[]     // Remaining skills - only if space allows
  }
  
  // Training identity
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingStyle: string | null
  trainingPathType: string | null
  
  // Schedule identity
  scheduleMode: 'static' | 'flexible'
  targetSessionsPerWeek: number | null
  sessionDurationMinutes: number
  sessionDurationMode: 'static' | 'adaptive'
  
  // Equipment and loading
  equipmentAvailable: string[]
  hasLoadableEquipment: boolean
  weightedPullUpBenchmark: { load: number; reps: number; unit: string } | null
  weightedDipBenchmark: { load: number; reps: number; unit: string } | null
  
  // Flexibility and protection
  selectedFlexibility: string[]
  jointCautions: string[]
  
  // Training method preferences
  methodPreferences: TrainingMethodPreference[]
}

// =============================================================================
// TYPES - HISTORY TRUTH
// =============================================================================

export interface HistoryTruth {
  // Recent activity
  recentWorkoutCount: number
  daysSinceLastWorkout: number | null
  isDetrainedState: boolean       // > 14 days since last workout
  isLowVolumeState: boolean       // < 2 workouts in last 14 days
  
  // Fatigue and recovery
  fatigueTrend: 'increasing' | 'stable' | 'decreasing'
  needsDeload: boolean
  volumeModifier: number          // 0.7 - 1.2 based on fatigue
  intensityModifier: number       // 0.8 - 1.1 based on fatigue
  
  // Adherence patterns
  completionRate: number          // 0-1
  adherenceQuality: 'excellent' | 'good' | 'moderate' | 'poor' | 'insufficient_data'
  
  // Skill exposure history
  straightArmExposureLevel: 'none' | 'low' | 'moderate' | 'high'
  tendonAdaptationLevel: 'untrained' | 'building' | 'adapted'
  
  // Data confidence
  hasEnoughDataForAdaptation: boolean
  dataConfidence: 'none' | 'low' | 'medium' | 'high'
}

// =============================================================================
// TYPES - BOTTLENECK TRUTH
// =============================================================================

export interface BottleneckTruth {
  // Ranked bottlenecks
  primaryBottleneck: string | null
  secondaryBottleneck: string | null
  rankedBottlenecks: Array<{
    area: string
    severity: 'critical' | 'significant' | 'moderate' | 'minor'
    source: 'user_reported' | 'performance_derived' | 'anatomical_inference'
  }>
  
  // Limiter impact
  primaryLimitation: string | null
  limitationDrivenMods: {
    volumeModifier: number
    intensityModifier: number
    accessorySlotsAdjustment: number
    suggestRecoveryDay: boolean
    avoidExerciseTypes: string[]
    prioritizeExerciseTypes: string[]
  }
  
  // Weak area focus
  weakestArea: string | null
  weakPointAccessoryBias: string[]
}

// =============================================================================
// TYPES - PERSONALIZATION LEVERS
// =============================================================================

export type LeverConfidence = 'high' | 'medium' | 'low' | 'default'

export interface PersonalizationLevers {
  // Weekly structure levers
  weeklyStructureBias: {
    value: 'skill_heavy' | 'strength_heavy' | 'balanced' | 'support_heavy'
    confidence: LeverConfidence
    source: string
  }
  
  // Skill allocation levers
  mainSkillEmphasis: {
    value: number  // 0.3 - 0.6 of skill work goes to primary
    confidence: LeverConfidence
  }
  secondarySkillAllowance: {
    value: number  // 0.2 - 0.4 of skill work
    confidence: LeverConfidence
  }
  tertiarySkillAllowance: {
    value: number  // 0 - 0.2 of skill work
    confidence: LeverConfidence
  }
  
  // Support allocation levers
  supportAllocationBias: {
    value: 'minimal' | 'moderate' | 'heavy' | 'rehab_focused'
    confidence: LeverConfidence
    source: string
  }
  accessoryBudget: {
    value: number  // 0-4 accessory exercises per session
    confidence: LeverConfidence
  }
  prehabPriorityBias: {
    value: number  // 0-1, how much to prioritize prehab
    confidence: LeverConfidence
  }
  
  // Weighted integration levers
  weightedExerciseEligibility: {
    pullUps: boolean
    dips: boolean
    rows: boolean
    other: boolean
  }
  weightedPlacementPriority: {
    value: 'primary' | 'secondary' | 'accessory_only' | 'none'
    confidence: LeverConfidence
  }
  
  // Complexity and method levers
  complexityAllowance: {
    value: 'minimal' | 'moderate' | 'full'
    confidence: LeverConfidence
    source: string
  }
  methodEligibility: {
    supersets: boolean
    circuits: boolean
    densityBlocks: boolean
    clusterSets: boolean
    dropSets: boolean
    ladderSets: boolean
    restPause: boolean
  }
  densityAllowance: {
    value: number  // 0-1, how much density work is allowed
    confidence: LeverConfidence
  }
  
  // Recovery and safety levers
  recoveryConservatism: {
    value: number  // 0-1, higher = more conservative
    confidence: LeverConfidence
  }
  tendonConservatism: {
    value: number  // 0-1, higher = more conservative on straight-arm
    confidence: LeverConfidence
  }
  jointProtectionBias: {
    value: number  // 0-1, higher = more joint protection work
    areas: string[]
    confidence: LeverConfidence
  }
  
  // Time budget levers
  timeBudgetCompressionPressure: {
    value: number  // 0-1, higher = more aggressive compression
    confidence: LeverConfidence
  }
  
  // Carryover levers
  carryoverPriorityBias: {
    value: 'high' | 'moderate' | 'low'
    primarySkillCarryover: string[]
    confidence: LeverConfidence
  }
}

// =============================================================================
// TYPES - PROVENANCE AUDIT
// =============================================================================

export interface LeverProvenance {
  leverName: string
  sourceFields: string[]
  derivationRule: string
  confidenceReason: string
  affectedGeneration: boolean
}

export interface ProvenanceAudit {
  timestamp: string
  profileSignature: string
  levers: LeverProvenance[]
  sparseAreas: string[]
  highConfidenceCount: number
  lowConfidenceCount: number
  defaultCount: number
}

// =============================================================================
// MAIN CONTRACT TYPE
// =============================================================================

export interface CanonicalMaterialityContract {
  version: '1.0'
  builtAt: string
  
  identity: IdentityTruth
  history: HistoryTruth
  bottleneck: BottleneckTruth
  levers: PersonalizationLevers
  provenance: ProvenanceAudit
  
  // Quick access flags
  isHighlyPersonalized: boolean
  sparseDataWarning: boolean
  criticalLeverCount: number
}

// =============================================================================
// CONTRACT BUILDER
// =============================================================================

/**
 * Build the canonical materiality contract from profile and feedback data.
 * This is called ONCE at the start of generation.
 */
export function buildCanonicalMaterialityContract(
  profile: CanonicalProgrammingProfile,
  feedback: TrainingFeedbackSummary,
  detectedWeakPoints?: DetectedWeakPoints,
  limiterMods?: LimiterDrivenProgramMods
): CanonicalMaterialityContract {
  console.log('[materiality-contract] Building canonical materiality contract')
  
  const provenanceLevers: LeverProvenance[] = []
  
  // ==========================================================================
  // BUILD IDENTITY TRUTH
  // ==========================================================================
  
  const skillPriorities = deriveSkillPriorities(
    profile.selectedSkills,
    profile.primaryGoal,
    profile.secondaryGoal
  )
  
  const identity: IdentityTruth = {
    primaryGoal: profile.primaryGoal || 'general_fitness',
    secondaryGoal: profile.secondaryGoal,
    selectedSkills: profile.selectedSkills || [],
    skillPriorities,
    experienceLevel: profile.experienceLevel || 'intermediate',
    trainingStyle: profile.trainingStyle,
    trainingPathType: profile.trainingPathType,
    scheduleMode: profile.scheduleMode || 'flexible',
    targetSessionsPerWeek: profile.trainingDaysPerWeek,
    sessionDurationMinutes: profile.sessionLengthMinutes || 60,
    sessionDurationMode: profile.sessionDurationMode || 'static',
    equipmentAvailable: profile.equipmentAvailable || ['floor'],
    hasLoadableEquipment: checkHasLoadableEquipment(profile.equipmentAvailable || []),
    weightedPullUpBenchmark: profile.weightedPullUp 
      ? { load: profile.weightedPullUp.addedWeight, reps: profile.weightedPullUp.reps, unit: profile.weightedPullUp.unit || 'lbs' }
      : null,
    weightedDipBenchmark: profile.weightedDip
      ? { load: profile.weightedDip.addedWeight, reps: profile.weightedDip.reps, unit: profile.weightedDip.unit || 'lbs' }
      : null,
    selectedFlexibility: profile.selectedFlexibility || [],
    jointCautions: profile.jointCautions || [],
    methodPreferences: profile.trainingMethodPreferences || [],
  }
  
  // ==========================================================================
  // BUILD HISTORY TRUTH
  // ==========================================================================
  
  const history: HistoryTruth = {
    recentWorkoutCount: feedback.trustedWorkoutCount,
    daysSinceLastWorkout: feedback.daysSinceLastWorkout,
    isDetrainedState: (feedback.daysSinceLastWorkout ?? 999) > 14,
    isLowVolumeState: feedback.totalSessionsLast14Days < 2,
    fatigueTrend: feedback.recentFatigueTrend,
    needsDeload: feedback.needsDeload,
    volumeModifier: feedback.volumeModifier,
    intensityModifier: feedback.intensityModifier,
    completionRate: feedback.recentCompletionRate,
    adherenceQuality: feedback.adherenceQuality,
    straightArmExposureLevel: deriveStrightArmExposure(profile, feedback),
    tendonAdaptationLevel: deriveTendonAdaptation(profile, feedback),
    hasEnoughDataForAdaptation: feedback.dataConfidence !== 'none' && feedback.trustedWorkoutCount >= 2,
    dataConfidence: feedback.dataConfidence,
  }
  
  // ==========================================================================
  // BUILD BOTTLENECK TRUTH
  // ==========================================================================
  
  const bottleneck: BottleneckTruth = {
    primaryBottleneck: detectedWeakPoints?.primary?.[0] ? String(detectedWeakPoints.primary[0]) : profile.weakestArea || null,
    secondaryBottleneck: detectedWeakPoints?.secondary?.[0] ? String(detectedWeakPoints.secondary[0]) : null,
    rankedBottlenecks: buildRankedBottlenecks(detectedWeakPoints, profile),
    primaryLimitation: profile.primaryLimitation,
    limitationDrivenMods: {
      volumeModifier: limiterMods?.volumeModifier ?? 1.0,
      intensityModifier: limiterMods?.intensityModifier ?? 1.0,
      accessorySlotsAdjustment: limiterMods?.accessorySlotsAdjustment ?? 0,
      suggestRecoveryDay: limiterMods?.suggestRecoveryDay ?? false,
      avoidExerciseTypes: limiterMods?.avoidExerciseTypes ?? [],
      prioritizeExerciseTypes: limiterMods?.prioritizeExerciseTypes ?? [],
    },
    weakestArea: profile.weakestArea,
    weakPointAccessoryBias: detectedWeakPoints?.primary?.map(wp => String(wp)) || [],
  }
  
  // ==========================================================================
  // BUILD PERSONALIZATION LEVERS
  // ==========================================================================
  
  const levers = buildPersonalizationLevers(identity, history, bottleneck, profile, provenanceLevers)
  
  // ==========================================================================
  // BUILD PROVENANCE AUDIT
  // ==========================================================================
  
  const provenance: ProvenanceAudit = {
    timestamp: new Date().toISOString(),
    profileSignature: `${profile.userId}-${profile.primaryGoal}-${profile.selectedSkills.length}skills`,
    levers: provenanceLevers,
    sparseAreas: identifySparseAreas(identity, history),
    highConfidenceCount: provenanceLevers.filter(l => l.confidenceReason.includes('high')).length,
    lowConfidenceCount: provenanceLevers.filter(l => l.confidenceReason.includes('low')).length,
    defaultCount: provenanceLevers.filter(l => l.confidenceReason.includes('default')).length,
  }
  
  // ==========================================================================
  // ASSEMBLE CONTRACT
  // ==========================================================================
  
  const contract: CanonicalMaterialityContract = {
    version: '1.0',
    builtAt: new Date().toISOString(),
    identity,
    history,
    bottleneck,
    levers,
    provenance,
    isHighlyPersonalized: provenance.highConfidenceCount > provenance.defaultCount,
    sparseDataWarning: provenance.sparseAreas.length > 3,
    criticalLeverCount: countCriticalLevers(levers),
  }
  
  console.log('[materiality-contract] Contract built:', {
    skillPriorityCount: identity.skillPriorities.primary.length + identity.skillPriorities.secondary.length,
    historyDataQuality: history.dataConfidence,
    bottleneckCount: bottleneck.rankedBottlenecks.length,
    isHighlyPersonalized: contract.isHighlyPersonalized,
    sparseAreas: provenance.sparseAreas,
    criticalLevers: contract.criticalLeverCount,
  })
  
  return contract
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function deriveSkillPriorities(
  selectedSkills: string[],
  primaryGoal: string | null,
  secondaryGoal: string | null
): IdentityTruth['skillPriorities'] {
  if (!selectedSkills || selectedSkills.length === 0) {
    return { primary: [], secondary: [], tertiary: [] }
  }
  
  // Map goals to skill priorities
  const goalSkillMap: Record<string, string[]> = {
    front_lever: ['front_lever'],
    back_lever: ['back_lever'],
    planche: ['planche'],
    muscle_up: ['muscle_up'],
    handstand: ['handstand', 'handstand_pushup'],
    handstand_pushup: ['handstand_pushup', 'handstand'],
    l_sit: ['l_sit'],
    v_sit: ['v_sit', 'l_sit'],
    iron_cross: ['iron_cross', 'back_lever'],
    human_flag: ['human_flag'],
    pull_strength: ['muscle_up', 'front_lever'],
    push_strength: ['planche', 'handstand_pushup'],
    overall_strength: [],
  }
  
  const primarySkillsFromGoal = goalSkillMap[primaryGoal || ''] || []
  const secondarySkillsFromGoal = goalSkillMap[secondaryGoal || ''] || []
  
  // Prioritize skills that match goals
  const primary: string[] = []
  const secondary: string[] = []
  const tertiary: string[] = []
  
  selectedSkills.forEach(skill => {
    if (primarySkillsFromGoal.includes(skill)) {
      primary.push(skill)
    } else if (secondarySkillsFromGoal.includes(skill)) {
      secondary.push(skill)
    } else {
      tertiary.push(skill)
    }
  })
  
  // Ensure at least one primary if none matched
  if (primary.length === 0 && selectedSkills.length > 0) {
    primary.push(selectedSkills[0])
    tertiary.shift()
  }
  
  // Move overflow from primary to secondary
  while (primary.length > 2 && secondary.length < 3) {
    secondary.push(primary.pop()!)
  }
  
  // Move remaining overflow to tertiary
  while (primary.length > 2) {
    tertiary.push(primary.pop()!)
  }
  
  return { primary, secondary, tertiary }
}

function checkHasLoadableEquipment(equipment: string[]): boolean {
  const loadableEquipment = ['weight_belt', 'dumbbell', 'barbell', 'kettlebell', 'weight_vest', 'plates']
  return equipment.some(e => loadableEquipment.includes(e))
}

function deriveStrightArmExposure(
  profile: CanonicalProgrammingProfile,
  feedback: TrainingFeedbackSummary
): 'none' | 'low' | 'moderate' | 'high' {
  // Check if profile has straight-arm skills selected
  const straightArmSkills = ['front_lever', 'back_lever', 'planche', 'iron_cross', 'maltese']
  const hasStrightArmGoals = profile.selectedSkills?.some(s => straightArmSkills.includes(s))
  
  if (!hasStrightArmGoals) return 'none'
  
  // Use experience and workout count as proxy for exposure
  if (feedback.trustedWorkoutCount > 20 && profile.experienceLevel === 'advanced') return 'high'
  if (feedback.trustedWorkoutCount > 10 || profile.experienceLevel === 'intermediate') return 'moderate'
  return 'low'
}

function deriveTendonAdaptation(
  profile: CanonicalProgrammingProfile,
  feedback: TrainingFeedbackSummary
): 'untrained' | 'building' | 'adapted' {
  // Use experience level and workout history as proxy
  if (profile.experienceLevel === 'advanced' && feedback.trustedWorkoutCount > 30) return 'adapted'
  if (profile.experienceLevel === 'intermediate' || feedback.trustedWorkoutCount > 10) return 'building'
  return 'untrained'
}

function buildRankedBottlenecks(
  weakPoints: DetectedWeakPoints | undefined,
  profile: CanonicalProgrammingProfile
): BottleneckTruth['rankedBottlenecks'] {
  const bottlenecks: BottleneckTruth['rankedBottlenecks'] = []
  
  // DetectedWeakPoints has primary/secondary as WeakPointType[] arrays
  if (weakPoints?.primary && weakPoints.primary.length > 0) {
    // Map array items to bottleneck entries
    weakPoints.primary.forEach((wp, i) => {
      bottlenecks.push({
        area: String(wp), // WeakPointType is a string type
        severity: i === 0 ? 'critical' : 'significant',
        source: 'performance_derived',
      })
    })
  }
  
  if (weakPoints?.secondary && weakPoints.secondary.length > 0) {
    weakPoints.secondary.forEach(wp => {
      if (!bottlenecks.some(b => b.area === String(wp))) {
        bottlenecks.push({
          area: String(wp),
          severity: 'moderate',
          source: 'performance_derived',
        })
      }
    })
  }
  
  if (profile.weakestArea && !bottlenecks.some(b => b.area === profile.weakestArea)) {
    bottlenecks.push({
      area: profile.weakestArea,
      severity: 'significant',
      source: 'user_reported',
    })
  }
  
  // Add joint cautions as anatomical bottlenecks
  profile.jointCautions?.forEach(caution => {
    if (!bottlenecks.some(b => b.area === caution)) {
      bottlenecks.push({
        area: caution,
        severity: 'moderate',
        source: 'anatomical_inference',
      })
    }
  })
  
  return bottlenecks
}

function buildPersonalizationLevers(
  identity: IdentityTruth,
  history: HistoryTruth,
  bottleneck: BottleneckTruth,
  profile: CanonicalProgrammingProfile,
  provenanceLevers: LeverProvenance[]
): PersonalizationLevers {
  
  // ==========================================================================
  // WEEKLY STRUCTURE BIAS
  // ==========================================================================
  
  let weeklyStructureBias: PersonalizationLevers['weeklyStructureBias']
  
  if (identity.primaryGoal?.includes('skill') || identity.skillPriorities.primary.length >= 2) {
    weeklyStructureBias = { value: 'skill_heavy', confidence: 'high', source: 'primaryGoal + skillPriorities' }
  } else if (identity.primaryGoal?.includes('strength') || identity.primaryGoal === 'pull_strength' || identity.primaryGoal === 'push_strength') {
    weeklyStructureBias = { value: 'strength_heavy', confidence: 'high', source: 'primaryGoal' }
  } else if (bottleneck.rankedBottlenecks.length >= 3 || bottleneck.limitationDrivenMods.accessorySlotsAdjustment > 0) {
    weeklyStructureBias = { value: 'support_heavy', confidence: 'medium', source: 'bottleneckCount + limitationMods' }
  } else {
    weeklyStructureBias = { value: 'balanced', confidence: 'low', source: 'default' }
  }
  
  provenanceLevers.push({
    leverName: 'weeklyStructureBias',
    sourceFields: ['primaryGoal', 'selectedSkills', 'bottlenecks'],
    derivationRule: 'skill goals → skill_heavy; strength goals → strength_heavy; many bottlenecks → support_heavy; else balanced',
    confidenceReason: weeklyStructureBias.confidence,
    affectedGeneration: true,
  })
  
  // ==========================================================================
  // SKILL ALLOCATION
  // ==========================================================================
  
  const skillCount = identity.selectedSkills.length
  const mainSkillEmphasis: PersonalizationLevers['mainSkillEmphasis'] = {
    value: skillCount <= 2 ? 0.6 : skillCount <= 4 ? 0.45 : 0.35,
    confidence: skillCount > 0 ? 'high' : 'default',
  }
  
  const secondarySkillAllowance: PersonalizationLevers['secondarySkillAllowance'] = {
    value: identity.skillPriorities.secondary.length > 0 ? 0.3 : 0.15,
    confidence: identity.skillPriorities.secondary.length > 0 ? 'high' : 'low',
  }
  
  const tertiarySkillAllowance: PersonalizationLevers['tertiarySkillAllowance'] = {
    value: identity.skillPriorities.tertiary.length > 0 && identity.sessionDurationMinutes >= 60 ? 0.15 : 0.05,
    confidence: identity.skillPriorities.tertiary.length > 0 ? 'medium' : 'low',
  }
  
  provenanceLevers.push({
    leverName: 'skillAllocation',
    sourceFields: ['selectedSkills', 'skillPriorities', 'sessionDurationMinutes'],
    derivationRule: 'fewer skills → higher main emphasis; more skills → distributed; short sessions → reduce tertiary',
    confidenceReason: skillCount > 0 ? 'high' : 'default',
    affectedGeneration: true,
  })
  
  // ==========================================================================
  // SUPPORT ALLOCATION
  // ==========================================================================
  
  let supportAllocationBias: PersonalizationLevers['supportAllocationBias']
  
  if (bottleneck.limitationDrivenMods.suggestRecoveryDay || identity.jointCautions.length >= 2) {
    supportAllocationBias = { value: 'rehab_focused', confidence: 'high', source: 'jointCautions + limitationMods' }
  } else if (bottleneck.rankedBottlenecks.length >= 2) {
    supportAllocationBias = { value: 'heavy', confidence: 'medium', source: 'bottleneckCount' }
  } else if (identity.experienceLevel === 'beginner') {
    supportAllocationBias = { value: 'heavy', confidence: 'medium', source: 'experienceLevel' }
  } else if (identity.sessionDurationMinutes < 45) {
    supportAllocationBias = { value: 'minimal', confidence: 'high', source: 'sessionDuration' }
  } else {
    supportAllocationBias = { value: 'moderate', confidence: 'low', source: 'default' }
  }
  
  const accessoryBudget: PersonalizationLevers['accessoryBudget'] = {
    value: supportAllocationBias.value === 'minimal' ? 1 
      : supportAllocationBias.value === 'moderate' ? 2
      : supportAllocationBias.value === 'heavy' ? 3
      : 4, // rehab_focused
    confidence: supportAllocationBias.confidence,
  }
  
  const prehabPriorityBias: PersonalizationLevers['prehabPriorityBias'] = {
    value: identity.jointCautions.length >= 2 ? 0.8
      : identity.jointCautions.length === 1 ? 0.5
      : bottleneck.limitationDrivenMods.suggestRecoveryDay ? 0.6
      : 0.2,
    confidence: identity.jointCautions.length > 0 ? 'high' : 'low',
  }
  
  provenanceLevers.push({
    leverName: 'supportAllocation',
    sourceFields: ['jointCautions', 'bottlenecks', 'experienceLevel', 'sessionDuration'],
    derivationRule: 'many cautions → rehab_focused; bottlenecks → heavy; beginner → heavy; short sessions → minimal',
    confidenceReason: supportAllocationBias.confidence,
    affectedGeneration: true,
  })
  
  // ==========================================================================
  // WEIGHTED INTEGRATION
  // ==========================================================================
  
  const hasWeightedBenchmarks = !!identity.weightedPullUpBenchmark || !!identity.weightedDipBenchmark
  
  const weightedExerciseEligibility: PersonalizationLevers['weightedExerciseEligibility'] = {
    pullUps: identity.hasLoadableEquipment && !!identity.weightedPullUpBenchmark,
    dips: identity.hasLoadableEquipment && !!identity.weightedDipBenchmark,
    rows: identity.hasLoadableEquipment && hasWeightedBenchmarks,
    other: identity.hasLoadableEquipment,
  }
  
  let weightedPlacementPriority: PersonalizationLevers['weightedPlacementPriority']
  
  if (hasWeightedBenchmarks && identity.primaryGoal?.includes('strength')) {
    weightedPlacementPriority = { value: 'primary', confidence: 'high' }
  } else if (hasWeightedBenchmarks) {
    weightedPlacementPriority = { value: 'secondary', confidence: 'medium' }
  } else if (identity.hasLoadableEquipment) {
    weightedPlacementPriority = { value: 'accessory_only', confidence: 'low' }
  } else {
    weightedPlacementPriority = { value: 'none', confidence: 'high' }
  }
  
  provenanceLevers.push({
    leverName: 'weightedIntegration',
    sourceFields: ['weightedPullUp', 'weightedDip', 'equipmentAvailable', 'primaryGoal'],
    derivationRule: 'benchmarks + strength goal → primary; benchmarks alone → secondary; equipment only → accessory; no equipment → none',
    confidenceReason: weightedPlacementPriority.confidence,
    affectedGeneration: hasWeightedBenchmarks || identity.hasLoadableEquipment,
  })
  
  // ==========================================================================
  // COMPLEXITY AND METHODS
  // ==========================================================================
  
  let complexityAllowance: PersonalizationLevers['complexityAllowance']
  
  if (identity.experienceLevel === 'advanced' && !history.needsDeload) {
    complexityAllowance = { value: 'full', confidence: 'high', source: 'experienceLevel + fatigueState' }
  } else if (identity.experienceLevel === 'intermediate') {
    complexityAllowance = { value: 'moderate', confidence: 'medium', source: 'experienceLevel' }
  } else {
    complexityAllowance = { value: 'minimal', confidence: 'high', source: 'experienceLevel' }
  }
  
  // Method eligibility based on preferences, experience, and feasibility
  const methodEligibility: PersonalizationLevers['methodEligibility'] = {
    supersets: identity.methodPreferences.includes('supersets') || identity.experienceLevel !== 'beginner',
    circuits: identity.methodPreferences.includes('circuits') && identity.experienceLevel !== 'beginner',
    densityBlocks: identity.methodPreferences.includes('density_blocks') && identity.experienceLevel !== 'beginner',
    clusterSets: identity.methodPreferences.includes('cluster_sets') && identity.experienceLevel === 'advanced',
    dropSets: identity.methodPreferences.includes('drop_sets') && identity.experienceLevel !== 'beginner',
    ladderSets: identity.methodPreferences.includes('ladder_sets') && identity.experienceLevel !== 'beginner',
    restPause: identity.methodPreferences.includes('rest_pause') && identity.experienceLevel === 'advanced',
  }
  
  const densityAllowance: PersonalizationLevers['densityAllowance'] = {
    value: identity.sessionDurationMinutes < 45 ? 0.4
      : identity.methodPreferences.includes('density_blocks') ? 0.6
      : 0.3,
    confidence: identity.methodPreferences.length > 0 ? 'high' : 'medium',
  }
  
  provenanceLevers.push({
    leverName: 'complexityAndMethods',
    sourceFields: ['experienceLevel', 'trainingMethodPreferences', 'sessionDuration', 'fatigueState'],
    derivationRule: 'advanced + not fatigued → full; intermediate → moderate; beginner → minimal; preferences gate specific methods',
    confidenceReason: complexityAllowance.confidence,
    affectedGeneration: true,
  })
  
  // ==========================================================================
  // RECOVERY AND SAFETY
  // ==========================================================================
  
  let recoveryConservatism: PersonalizationLevers['recoveryConservatism']
  
  if (history.needsDeload) {
    recoveryConservatism = { value: 0.8, confidence: 'high' }
  } else if (history.fatigueTrend === 'increasing') {
    recoveryConservatism = { value: 0.6, confidence: 'medium' }
  } else if (history.isDetrainedState) {
    recoveryConservatism = { value: 0.7, confidence: 'high' }
  } else {
    recoveryConservatism = { value: 0.3, confidence: 'low' }
  }
  
  let tendonConservatism: PersonalizationLevers['tendonConservatism']
  
  if (history.tendonAdaptationLevel === 'untrained') {
    tendonConservatism = { value: 0.8, confidence: 'high' }
  } else if (history.tendonAdaptationLevel === 'building') {
    tendonConservatism = { value: 0.5, confidence: 'medium' }
  } else {
    tendonConservatism = { value: 0.2, confidence: 'medium' }
  }
  
  const jointProtectionBias: PersonalizationLevers['jointProtectionBias'] = {
    value: identity.jointCautions.length >= 2 ? 0.8
      : identity.jointCautions.length === 1 ? 0.5
      : 0.2,
    areas: identity.jointCautions,
    confidence: identity.jointCautions.length > 0 ? 'high' : 'low',
  }
  
  provenanceLevers.push({
    leverName: 'recoverySafety',
    sourceFields: ['fatigueState', 'jointCautions', 'tendonAdaptation', 'detrainedState'],
    derivationRule: 'deload needed → high conservatism; increasing fatigue → moderate; untrained tendons → high tendon conservatism',
    confidenceReason: recoveryConservatism.confidence,
    affectedGeneration: true,
  })
  
  // ==========================================================================
  // TIME BUDGET
  // ==========================================================================
  
  let timeBudgetCompressionPressure: PersonalizationLevers['timeBudgetCompressionPressure']
  
  if (identity.sessionDurationMinutes <= 30) {
    timeBudgetCompressionPressure = { value: 0.9, confidence: 'high' }
  } else if (identity.sessionDurationMinutes <= 45) {
    timeBudgetCompressionPressure = { value: 0.6, confidence: 'high' }
  } else if (identity.sessionDurationMinutes <= 60) {
    timeBudgetCompressionPressure = { value: 0.3, confidence: 'medium' }
  } else {
    timeBudgetCompressionPressure = { value: 0.1, confidence: 'medium' }
  }
  
  provenanceLevers.push({
    leverName: 'timeBudget',
    sourceFields: ['sessionDurationMinutes', 'sessionDurationMode'],
    derivationRule: '≤30min → high compression; ≤45min → moderate; ≤60min → light; >60min → minimal',
    confidenceReason: timeBudgetCompressionPressure.confidence,
    affectedGeneration: true,
  })
  
  // ==========================================================================
  // CARRYOVER
  // ==========================================================================
  
  const primarySkillCarryover = getPrimarySkillCarryover(identity.skillPriorities.primary)
  
  const carryoverPriorityBias: PersonalizationLevers['carryoverPriorityBias'] = {
    value: identity.skillPriorities.primary.length > 0 ? 'high' : 'moderate',
    primarySkillCarryover,
    confidence: identity.skillPriorities.primary.length > 0 ? 'high' : 'low',
  }
  
  provenanceLevers.push({
    leverName: 'carryover',
    sourceFields: ['skillPriorities', 'primaryGoal'],
    derivationRule: 'has primary skills → high carryover priority; else moderate',
    confidenceReason: carryoverPriorityBias.confidence,
    affectedGeneration: true,
  })
  
  return {
    weeklyStructureBias,
    mainSkillEmphasis,
    secondarySkillAllowance,
    tertiarySkillAllowance,
    supportAllocationBias,
    accessoryBudget,
    prehabPriorityBias,
    weightedExerciseEligibility,
    weightedPlacementPriority,
    complexityAllowance,
    methodEligibility,
    densityAllowance,
    recoveryConservatism,
    tendonConservatism,
    jointProtectionBias,
    timeBudgetCompressionPressure,
    carryoverPriorityBias,
  }
}

function getPrimarySkillCarryover(primarySkills: string[]): string[] {
  const carryoverMap: Record<string, string[]> = {
    front_lever: ['pull_strength', 'core_compression', 'scapular_depression'],
    back_lever: ['shoulder_extension', 'core_hollow', 'elbow_conditioning'],
    planche: ['push_strength', 'protraction', 'wrist_conditioning'],
    muscle_up: ['pull_power', 'dip_strength', 'transition_timing'],
    handstand: ['balance', 'shoulder_stability', 'line_awareness'],
    handstand_pushup: ['overhead_strength', 'handstand_stability', 'pike_compression'],
    l_sit: ['hip_flexor_strength', 'core_compression', 'tricep_lock'],
    v_sit: ['hip_flexor_strength', 'hamstring_flexibility', 'core_compression'],
    iron_cross: ['shoulder_strength', 'elbow_conditioning', 'ring_stability'],
    human_flag: ['oblique_strength', 'lat_strength', 'grip_endurance'],
  }
  
  return primarySkills.flatMap(skill => carryoverMap[skill] || [])
}

function identifySparseAreas(identity: IdentityTruth, history: HistoryTruth): string[] {
  const sparse: string[] = []
  
  if (!identity.primaryGoal || identity.primaryGoal === 'general_fitness') sparse.push('primaryGoal')
  if (identity.selectedSkills.length === 0) sparse.push('selectedSkills')
  if (!identity.trainingStyle) sparse.push('trainingStyle')
  if (history.dataConfidence === 'none') sparse.push('workoutHistory')
  if (!identity.weightedPullUpBenchmark && !identity.weightedDipBenchmark) sparse.push('weightedBenchmarks')
  if (identity.equipmentAvailable.length <= 1) sparse.push('equipment')
  
  return sparse
}

function countCriticalLevers(levers: PersonalizationLevers): number {
  let count = 0
  
  if (levers.weeklyStructureBias.confidence === 'high') count++
  if (levers.mainSkillEmphasis.confidence === 'high') count++
  if (levers.supportAllocationBias.confidence === 'high') count++
  if (levers.weightedPlacementPriority.confidence === 'high') count++
  if (levers.complexityAllowance.confidence === 'high') count++
  if (levers.recoveryConservatism.confidence === 'high') count++
  if (levers.jointProtectionBias.confidence === 'high') count++
  if (levers.timeBudgetCompressionPressure.confidence === 'high') count++
  
  return count
}

// =============================================================================
// MATERIALITY VALIDATOR
// =============================================================================

export interface MaterialityValidationResult {
  isValid: boolean
  overallScore: number  // 0-100
  checks: MaterialityCheck[]
  summary: string
}

export interface MaterialityCheck {
  lever: string
  expected: string
  actual: string
  honored: boolean
  severity: 'critical' | 'important' | 'minor'
  evidence: string
}

/**
 * Validate that the generated program honored the materiality contract levers.
 * This is called AFTER generation to verify truth was materially expressed.
 */
export function validateMateriality(
  contract: CanonicalMaterialityContract,
  programSummary: {
    sessionCount: number
    hasWeightedExercises: boolean
    skillsExpressed: string[]
    methodsUsed: string[]
    accessoryCount: number
    averageDurationMinutes: number
  }
): MaterialityValidationResult {
  console.log('[materiality-contract] Validating materiality')
  
  const checks: MaterialityCheck[] = []
  
  // Check 1: Skill expression materiality
  const primarySkillsExpressed = contract.identity.skillPriorities.primary.filter(
    s => programSummary.skillsExpressed.some(e => e.toLowerCase().includes(s.toLowerCase()))
  )
  checks.push({
    lever: 'primarySkillExpression',
    expected: contract.identity.skillPriorities.primary.join(', ') || 'none',
    actual: primarySkillsExpressed.join(', ') || 'none',
    honored: primarySkillsExpressed.length >= Math.min(1, contract.identity.skillPriorities.primary.length),
    severity: 'critical',
    evidence: `${primarySkillsExpressed.length}/${contract.identity.skillPriorities.primary.length} primary skills expressed`,
  })
  
  // Check 2: Weighted integration materiality
  const expectedWeighted = contract.levers.weightedPlacementPriority.value !== 'none'
  checks.push({
    lever: 'weightedIntegration',
    expected: contract.levers.weightedPlacementPriority.value,
    actual: programSummary.hasWeightedExercises ? 'present' : 'absent',
    honored: expectedWeighted === programSummary.hasWeightedExercises || !expectedWeighted,
    severity: 'important',
    evidence: `weighted expected: ${expectedWeighted}, actual: ${programSummary.hasWeightedExercises}`,
  })
  
  // Check 3: Time budget materiality
  const durationTarget = contract.identity.sessionDurationMinutes
  const durationVariance = Math.abs(programSummary.averageDurationMinutes - durationTarget) / durationTarget
  checks.push({
    lever: 'timeBudget',
    expected: `${durationTarget}min ±20%`,
    actual: `${programSummary.averageDurationMinutes.toFixed(0)}min`,
    honored: durationVariance <= 0.2,
    severity: 'important',
    evidence: `variance: ${(durationVariance * 100).toFixed(1)}%`,
  })
  
  // Check 4: Session count materiality
  const targetSessions = contract.identity.targetSessionsPerWeek
  checks.push({
    lever: 'sessionCount',
    expected: targetSessions ? `${targetSessions} sessions` : 'flexible',
    actual: `${programSummary.sessionCount} sessions`,
    honored: !targetSessions || Math.abs(programSummary.sessionCount - targetSessions) <= 1,
    severity: 'important',
    evidence: `target: ${targetSessions || 'flexible'}, actual: ${programSummary.sessionCount}`,
  })
  
  // Check 5: Method eligibility materiality
  const eligibleMethods = Object.entries(contract.levers.methodEligibility)
    .filter(([, eligible]) => eligible)
    .map(([method]) => method)
  const usedEligibleMethods = programSummary.methodsUsed.filter(m => 
    eligibleMethods.some(e => m.toLowerCase().includes(e.toLowerCase()))
  )
  checks.push({
    lever: 'methodExpression',
    expected: eligibleMethods.join(', ') || 'straight_sets only',
    actual: programSummary.methodsUsed.join(', ') || 'straight_sets only',
    honored: eligibleMethods.length === 0 || usedEligibleMethods.length > 0 || programSummary.methodsUsed.length === 0,
    severity: 'minor',
    evidence: `${usedEligibleMethods.length} eligible methods used`,
  })
  
  // Check 6: Support allocation materiality
  const expectedAccessoryBudget = contract.levers.accessoryBudget.value
  checks.push({
    lever: 'accessoryBudget',
    expected: `≤${expectedAccessoryBudget} per session`,
    actual: `${(programSummary.accessoryCount / programSummary.sessionCount).toFixed(1)} per session`,
    honored: (programSummary.accessoryCount / programSummary.sessionCount) <= expectedAccessoryBudget + 1,
    severity: 'minor',
    evidence: `budget: ${expectedAccessoryBudget}, actual avg: ${(programSummary.accessoryCount / programSummary.sessionCount).toFixed(1)}`,
  })
  
  // Calculate overall score
  const criticalChecks = checks.filter(c => c.severity === 'critical')
  const importantChecks = checks.filter(c => c.severity === 'important')
  const minorChecks = checks.filter(c => c.severity === 'minor')
  
  const criticalScore = criticalChecks.filter(c => c.honored).length / Math.max(1, criticalChecks.length) * 50
  const importantScore = importantChecks.filter(c => c.honored).length / Math.max(1, importantChecks.length) * 35
  const minorScore = minorChecks.filter(c => c.honored).length / Math.max(1, minorChecks.length) * 15
  
  const overallScore = Math.round(criticalScore + importantScore + minorScore)
  const isValid = criticalChecks.every(c => c.honored) && overallScore >= 70
  
  const result: MaterialityValidationResult = {
    isValid,
    overallScore,
    checks,
    summary: isValid 
      ? `Materiality validation PASSED (${overallScore}/100)`
      : `Materiality validation FAILED (${overallScore}/100) - ${checks.filter(c => !c.honored).map(c => c.lever).join(', ')} not honored`,
  }
  
  console.log('[materiality-contract] Validation result:', {
    isValid: result.isValid,
    score: result.overallScore,
    failedChecks: checks.filter(c => !c.honored).map(c => c.lever),
  })
  
  return result
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  IdentityTruth,
  HistoryTruth,
  BottleneckTruth,
  PersonalizationLevers,
  ProvenanceAudit,
  LeverProvenance,
}
