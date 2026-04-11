/**
 * COACHING EXPLANATION CONTRACT
 * 
 * =============================================================================
 * AUTHORITATIVE AI COACHING EXPLANATION LAYER
 * =============================================================================
 * 
 * This is the SINGLE source of truth for all coaching explanations in SpartanLab.
 * All explanation text that appears in the UI MUST be derived from this system.
 * 
 * ARCHITECTURE:
 * 1. NORMALIZED INPUT CONTRACT - Structured truth from program/session/profile
 * 2. EXPLANATION BUILDERS - Dedicated builders for program/session/exercise/dosage
 * 3. STRUCTURED OUTPUT CONTRACT - Type-safe explanation bundles for UI consumption
 * 
 * RULES:
 * - Never fabricate explanations without backing truth
 * - Never produce generic filler text
 * - Always explain WHY, not just WHAT
 * - Degrade gracefully when truth is partial
 * - Sound like a credible coach, not a template
 */

import type { AdaptiveProgram, AdaptiveSession, AdaptiveExercise } from './adaptive-program-builder'
import { 
  buildExercisePurposeLine as buildPurposeLineFromDisplayContract,
  buildExerciseEffortReasonLine as buildEffortReasonFromDisplayContract,
} from './program/program-display-contract'

// =============================================================================
// NORMALIZED EXPLANATION INPUT CONTRACT
// =============================================================================

/**
 * All inputs the explanation builders need, normalized from various sources.
 * This is the boundary between messy program data and clean explanation logic.
 */
export interface NormalizedExplanationInput {
  // Athlete identity
  athlete: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    primaryGoal: string
    primaryGoalLabel: string
    secondaryGoal: string | null
    secondaryGoalLabel: string | null
    selectedSkills: string[]
    representedSkills: string[]
    deferredSkills: string[]
    equipmentAvailable: string[]
    jointCautions: string[]
    weakPoints: string[]
    recoveryQuality: 'poor' | 'moderate' | 'good' | 'excellent' | null
  }
  
  // Program structure
  program: {
    id: string
    scheduleMode: 'static' | 'flexible'
    trainingDaysPerWeek: number
    sessionDurationTarget: number
    trainingPath: string | null
    isFirstWeek: boolean
    adaptationPhase: string
    doctrineConstraints: string[]
  }
  
  // Week context
  week: {
    totalSessions: number
    primaryFocusSessions: number
    secondaryFocusSessions: number
    mixedSessions: number
    isProtective: boolean
    loadBias: 'reduced' | 'normal' | 'increased'
    volumeBias: 'reduced' | 'normal' | 'increased'
  }
  
  // Sessions with their metadata
  sessions: NormalizedSessionInput[]
  
  // Source tracking
  truthSource: 'program_object' | 'profile_composite' | 'fallback'
}

export interface NormalizedSessionInput {
  dayNumber: number
  dayLabel: string
  sessionIntent: string
  sessionComplexity: 'low' | 'moderate' | 'high'
  spineSessionType: string
  isPrimary: boolean
  primarySkillExposed: string | null
  secondarySkillExposed: string | null
  directlyExpressedSkills: string[]
  exerciseCount: number
  estimatedMinutes: number
  hasDensityApplied: boolean
  hasSupersetsApplied: boolean
  isProtectionConstrained: boolean
  rationale: string
  exercises: NormalizedExerciseInput[]
}

export interface NormalizedExerciseInput {
  id: string
  name: string
  category: string
  sets: number
  repsOrTime: string
  targetRPE: number | null
  restSeconds: number | null
  
  // Role/intent
  roleInSession: string
  expressionMode: string
  progressionIntent: string
  
  // Context
  isPrimary: boolean
  isProtected: boolean
  skillSupportTargets: string[]
  selectionReason: string
  
  // Movement truth
  movementFamily: 'pull' | 'push' | 'core' | 'scap' | 'mobility' | 'skill' | 'unknown'
  
  // Load
  isWeighted: boolean
  loadDecisionSummary: string | null
}

// =============================================================================
// EXPLANATION OUTPUT CONTRACT
// =============================================================================

/**
 * Program-level explanation bundle.
 * Explains why the weekly program fits this athlete.
 */
export interface ProgramExplanationBundle {
  // Primary explanation
  headline: string
  subheadline: string | null
  
  // Why this fits
  goalFitExplanation: string
  scheduleFitExplanation: string
  structureFitExplanation: string
  
  // Tradeoffs/constraints
  tradeoffExplanations: string[]
  protectionExplanations: string[]
  
  // Coaching insights
  weekFocusInsight: string
  progressionInsight: string | null
  
  // Quality markers
  confidenceLevel: 'high' | 'moderate' | 'low'
  source: 'authoritative' | 'derived' | 'fallback'
}

/**
 * Session/day-level explanation bundle.
 * Explains what today is trying to accomplish and why.
 */
export interface SessionExplanationBundle {
  dayNumber: number
  
  // Primary explanation
  sessionPurpose: string
  sessionStructureReason: string
  
  // Ordering explanation
  orderingReason: string | null
  
  // Adaptation context
  adaptationNote: string | null
  protectionNote: string | null
  
  // Quality markers
  confidenceLevel: 'high' | 'moderate' | 'low'
  source: 'authoritative' | 'derived' | 'fallback'
}

/**
 * Exercise-level explanation bundle.
 * Explains why this exercise exists in this day/program for this athlete.
 */
export interface ExerciseExplanationBundle {
  exerciseId: string
  
  // Primary explanation - the WHY
  roleExplanation: string
  
  // Context explanation
  sessionContextNote: string | null
  programContextNote: string | null
  
  // Dosage explanation
  dosageReason: string | null
  
  // Quality markers
  confidenceLevel: 'high' | 'moderate' | 'low'
  source: 'authoritative' | 'derived' | 'fallback'
}

/**
 * Warm-up explanation bundle.
 * Explains why warm-up ramps exist for loaded compounds.
 */
export interface WarmupExplanationBundle {
  exerciseName: string
  
  // Why this ramp
  rampReason: string
  
  // What it prepares
  preparationNote: string
  
  // Quality markers
  source: 'doctrine' | 'derived'
}

/**
 * Complete explanation surface for a program.
 * This is what the UI consumes.
 */
export interface ProgramExplanationSurface {
  program: ProgramExplanationBundle
  sessions: SessionExplanationBundle[]
  exercises: Map<string, ExerciseExplanationBundle>
  warmups: WarmupExplanationBundle[]
  
  // Generation metadata
  generatedAt: string
  inputTruthSource: string
}

// =============================================================================
// NORMALIZER - CONVERT PROGRAM TO EXPLANATION INPUT
// =============================================================================

/**
 * Normalize an AdaptiveProgram into the explanation input contract.
 * This is the bridge between messy program data and clean explanation logic.
 */
export function normalizeExplanationInput(
  program: AdaptiveProgram,
  profileOverrides?: Partial<NormalizedExplanationInput['athlete']>
): NormalizedExplanationInput {
  // Extract from program with safe defaults
  const weekAdaptation = program.weekAdaptationDecision
  const summaryTruth = (program as unknown as { summaryTruth?: { headlineFocusSkills?: string[] } }).summaryTruth
  const weeklyRep = (program as unknown as { weeklyRepresentation?: { policies?: Array<{ skill: string; representationVerdict?: string }> } }).weeklyRepresentation
  
  // Compute represented vs deferred skills
  const selectedSkills = (program as unknown as { selectedSkills?: string[] }).selectedSkills || []
  const representedSkills = (program as unknown as { representedSkills?: string[] }).representedSkills || []
  const deferredSkills = selectedSkills.filter(s => !representedSkills.includes(s))
  
  // Session distribution
  const sessions = program.sessions || []
  const primaryFocusSessions = sessions.filter(s => s.isPrimary).length
  const secondaryFocusSessions = sessions.filter(s => !s.isPrimary && s.focus?.includes('secondary')).length
  const mixedSessions = sessions.length - primaryFocusSessions - secondaryFocusSessions
  
  // Normalize sessions
  const normalizedSessions: NormalizedSessionInput[] = sessions.map(session => 
    normalizeSessionInput(session, program.primaryGoal)
  )
  
  return {
    athlete: {
      experienceLevel: (program as unknown as { experienceLevel?: string }).experienceLevel as NormalizedExplanationInput['athlete']['experienceLevel'] || 'intermediate',
      primaryGoal: program.primaryGoal,
      primaryGoalLabel: formatGoalLabel(program.primaryGoal),
      secondaryGoal: program.secondaryGoal || null,
      secondaryGoalLabel: program.secondaryGoal ? formatGoalLabel(program.secondaryGoal) : null,
      selectedSkills,
      representedSkills,
      deferredSkills,
      equipmentAvailable: (program as unknown as { equipmentAvailable?: string[] }).equipmentAvailable || [],
      jointCautions: (program as unknown as { jointCautions?: string[] }).jointCautions || [],
      weakPoints: (program as unknown as { weakPointDetection?: { primaryWeakPoint?: string } }).weakPointDetection?.primaryWeakPoint 
        ? [(program as unknown as { weakPointDetection: { primaryWeakPoint: string } }).weakPointDetection.primaryWeakPoint]
        : [],
      recoveryQuality: (program as unknown as { recoveryQuality?: string }).recoveryQuality as NormalizedExplanationInput['athlete']['recoveryQuality'] || null,
      ...profileOverrides,
    },
    program: {
      id: program.id,
      scheduleMode: program.scheduleMode,
      trainingDaysPerWeek: (program as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek || sessions.length,
      sessionDurationTarget: (program as unknown as { sessionDurationTarget?: number }).sessionDurationTarget || 60,
      trainingPath: (program as unknown as { trainingPath?: string }).trainingPath || null,
      isFirstWeek: weekAdaptation?.firstWeekGovernor?.active ?? false,
      adaptationPhase: weekAdaptation?.phase || 'normal_progression',
      doctrineConstraints: weekAdaptation?.doctrineConstraints || [],
    },
    week: {
      totalSessions: sessions.length,
      primaryFocusSessions,
      secondaryFocusSessions,
      mixedSessions,
      isProtective: weekAdaptation?.phase === 'initial_acclimation' || weekAdaptation?.phase === 'recovery_constrained',
      loadBias: weekAdaptation?.loadStrategy?.intensityBias === 'reduced' ? 'reduced' : 
                weekAdaptation?.loadStrategy?.intensityBias === 'increased' ? 'increased' : 'normal',
      volumeBias: weekAdaptation?.loadStrategy?.volumeBias === 'reduced' ? 'reduced' : 
                  weekAdaptation?.loadStrategy?.volumeBias === 'increased' ? 'increased' : 'normal',
    },
    sessions: normalizedSessions,
    truthSource: 'program_object',
  }
}

function normalizeSessionInput(session: AdaptiveSession, primaryGoal: string): NormalizedSessionInput {
  const composition = (session as unknown as { compositionMetadata?: { sessionIntent?: string; sessionComplexity?: string; spineSessionType?: string } }).compositionMetadata
  const skillMeta = (session as unknown as { skillExpressionMetadata?: { directlyExpressedSkills?: string[]; sessionPurpose?: string } }).skillExpressionMetadata
  const styleMeta = (session as unknown as { styleMetadata?: { hasDensityApplied?: boolean; hasSupersetsApplied?: boolean } }).styleMetadata
  const prescriptionAudit = (session as unknown as { prescriptionPropagationAudit?: { appliedReductions?: object } }).prescriptionPropagationAudit
  
  const exercises = session.exercises || []
  const normalizedExercises: NormalizedExerciseInput[] = exercises.map(ex => normalizeExerciseInput(ex))
  
  return {
    dayNumber: session.dayNumber,
    dayLabel: session.dayLabel || `Day ${session.dayNumber}`,
    sessionIntent: composition?.sessionIntent || session.focus || 'training',
    sessionComplexity: (composition?.sessionComplexity as NormalizedSessionInput['sessionComplexity']) || 'moderate',
    spineSessionType: composition?.spineSessionType || 'mixed',
    isPrimary: session.isPrimary ?? false,
    primarySkillExposed: skillMeta?.directlyExpressedSkills?.[0] || null,
    secondarySkillExposed: skillMeta?.directlyExpressedSkills?.[1] || null,
    directlyExpressedSkills: skillMeta?.directlyExpressedSkills || [],
    exerciseCount: exercises.length,
    estimatedMinutes: session.estimatedMinutes || 60,
    hasDensityApplied: styleMeta?.hasDensityApplied ?? false,
    hasSupersetsApplied: styleMeta?.hasSupersetsApplied ?? false,
    isProtectionConstrained: !!prescriptionAudit?.appliedReductions,
    rationale: session.rationale || '',
    exercises: normalizedExercises,
  }
}

function normalizeExerciseInput(exercise: AdaptiveExercise): NormalizedExerciseInput {
  const coaching = exercise.coachingMeta
  const nameLower = exercise.name.toLowerCase()
  
  // Determine movement family
  let movementFamily: NormalizedExerciseInput['movementFamily'] = 'unknown'
  if (nameLower.includes('pull') || nameLower.includes('row') || nameLower.includes('chin') || nameLower.includes('lever')) {
    movementFamily = 'pull'
  } else if (nameLower.includes('push') || nameLower.includes('dip') || nameLower.includes('press') || nameLower.includes('planche')) {
    movementFamily = 'push'
  } else if (nameLower.includes('hollow') || nameLower.includes('plank') || nameLower.includes('compression') || nameLower.includes('l-sit') || nameLower.includes('v-sit')) {
    movementFamily = 'core'
  } else if (nameLower.includes('scap') || nameLower.includes('face pull') || nameLower.includes('rear delt')) {
    movementFamily = 'scap'
  } else if (nameLower.includes('stretch') || nameLower.includes('mobility')) {
    movementFamily = 'mobility'
  } else if (nameLower.includes('handstand') || nameLower.includes('skill')) {
    movementFamily = 'skill'
  }
  
  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.category || 'accessory',
    sets: exercise.sets || 3,
    repsOrTime: exercise.repsOrTime || '8-12',
    targetRPE: exercise.targetRPE ?? null,
    restSeconds: exercise.restSeconds ?? null,
    roleInSession: coaching?.roleInSession || 'support',
    expressionMode: coaching?.expressionMode || 'support',
    progressionIntent: coaching?.progressionIntent || 'maintain',
    isPrimary: exercise.isPrimary ?? false,
    isProtected: exercise.isProtected ?? false,
    skillSupportTargets: coaching?.skillSupportTargets || [],
    selectionReason: exercise.selectionReason || '',
    movementFamily,
    isWeighted: !!exercise.prescribedLoad?.load,
    loadDecisionSummary: coaching?.loadDecisionSummary || null,
  }
}

// =============================================================================
// PROGRAM-LEVEL EXPLANATION BUILDER
// =============================================================================

/**
 * Build the program-level explanation bundle.
 * Explains why this weekly program fits this athlete.
 */
export function buildProgramExplanation(input: NormalizedExplanationInput): ProgramExplanationBundle {
  const { athlete, program, week } = input
  
  // Build headline
  const headline = buildProgramHeadline(athlete, week)
  
  // Build subheadline
  const subheadline = buildProgramSubheadline(athlete, program, week)
  
  // Build goal fit explanation
  const goalFitExplanation = buildGoalFitExplanation(athlete, week)
  
  // Build schedule fit explanation
  const scheduleFitExplanation = buildScheduleFitExplanation(program, week)
  
  // Build structure fit explanation
  const structureFitExplanation = buildStructureFitExplanation(athlete, week, input.sessions)
  
  // Build tradeoff explanations
  const tradeoffExplanations = buildTradeoffExplanations(athlete, program, week)
  
  // Build protection explanations
  const protectionExplanations = buildProtectionExplanations(program, week)
  
  // Build coaching insights
  const weekFocusInsight = buildWeekFocusInsight(athlete, week, input.sessions)
  const progressionInsight = buildProgressionInsight(athlete, program)
  
  return {
    headline,
    subheadline,
    goalFitExplanation,
    scheduleFitExplanation,
    structureFitExplanation,
    tradeoffExplanations,
    protectionExplanations,
    weekFocusInsight,
    progressionInsight,
    confidenceLevel: input.truthSource === 'program_object' ? 'high' : 'moderate',
    source: input.truthSource === 'program_object' ? 'authoritative' : 'derived',
  }
}

function buildProgramHeadline(
  athlete: NormalizedExplanationInput['athlete'],
  week: NormalizedExplanationInput['week']
): string {
  const goalLabel = athlete.primaryGoalLabel
  
  if (athlete.secondaryGoal) {
    return `${week.totalSessions}-day program prioritizing ${goalLabel} with ${athlete.secondaryGoalLabel} support.`
  }
  
  return `${week.totalSessions}-day program focused on ${goalLabel} development.`
}

function buildProgramSubheadline(
  athlete: NormalizedExplanationInput['athlete'],
  program: NormalizedExplanationInput['program'],
  week: NormalizedExplanationInput['week']
): string | null {
  if (program.isFirstWeek) {
    return 'Conservative dosage this week while your body adapts to the new training stimulus.'
  }
  
  if (week.isProtective) {
    return 'Load managed this week to support recovery and long-term progress.'
  }
  
  if (athlete.experienceLevel === 'beginner') {
    return 'Structured for skill acquisition and movement quality before intensity.'
  }
  
  if (athlete.selectedSkills.length > 3) {
    return `Balanced across ${athlete.selectedSkills.length} skills with concentrated primary focus.`
  }
  
  return null
}

function buildGoalFitExplanation(
  athlete: NormalizedExplanationInput['athlete'],
  week: NormalizedExplanationInput['week']
): string {
  const parts: string[] = []
  
  // Primary goal dedication
  if (week.primaryFocusSessions > 0) {
    parts.push(`${week.primaryFocusSessions} session${week.primaryFocusSessions > 1 ? 's' : ''} dedicated to ${athlete.primaryGoalLabel} as your main driver.`)
  }
  
  // Secondary goal handling
  if (athlete.secondaryGoal && week.secondaryFocusSessions > 0) {
    parts.push(`${week.secondaryFocusSessions} session${week.secondaryFocusSessions > 1 ? 's' : ''} supporting ${athlete.secondaryGoalLabel} development.`)
  }
  
  // Mixed sessions
  if (week.mixedSessions > 0) {
    parts.push(`${week.mixedSessions} balanced session${week.mixedSessions > 1 ? 's' : ''} building strength foundation.`)
  }
  
  // Deferred skills note
  if (athlete.deferredSkills.length > 0) {
    const deferredLabels = athlete.deferredSkills.map(formatGoalLabel).join(', ')
    parts.push(`${deferredLabels} receives indirect coverage through support work this week.`)
  }
  
  return parts.join(' ')
}

function buildScheduleFitExplanation(
  program: NormalizedExplanationInput['program'],
  week: NormalizedExplanationInput['week']
): string {
  if (program.scheduleMode === 'flexible') {
    if (week.isProtective) {
      return `Flexible schedule with ${week.totalSessions} sessions this week, conservatively chosen to support adaptation.`
    }
    return `Flexible schedule adapts week-to-week. Currently ${week.totalSessions} sessions based on your training capacity.`
  }
  
  return `Fixed ${week.totalSessions}-day schedule as selected. Consistent frequency builds reliable progression.`
}

function buildStructureFitExplanation(
  athlete: NormalizedExplanationInput['athlete'],
  week: NormalizedExplanationInput['week'],
  sessions: NormalizedSessionInput[]
): string {
  const parts: string[] = []
  
  // Equipment consideration
  if (athlete.equipmentAvailable.length > 0 && athlete.equipmentAvailable.length < 5) {
    parts.push('Exercise selection respects your equipment setup.')
  }
  
  // Session duration note
  const avgDuration = Math.round(sessions.reduce((sum, s) => sum + s.estimatedMinutes, 0) / sessions.length)
  parts.push(`Sessions average ~${avgDuration} minutes.`)
  
  // Method application
  const hasDensity = sessions.some(s => s.hasDensityApplied)
  const hasSuperset = sessions.some(s => s.hasSupersetsApplied)
  if (hasDensity || hasSuperset) {
    const methods: string[] = []
    if (hasSuperset) methods.push('supersets')
    if (hasDensity) methods.push('density blocks')
    parts.push(`${methods.join(' and ')} used where appropriate for efficiency.`)
  }
  
  return parts.join(' ')
}

function buildTradeoffExplanations(
  athlete: NormalizedExplanationInput['athlete'],
  program: NormalizedExplanationInput['program'],
  week: NormalizedExplanationInput['week']
): string[] {
  const tradeoffs: string[] = []
  
  // Multi-skill tradeoff
  if (athlete.selectedSkills.length > 3 && athlete.deferredSkills.length > 0) {
    tradeoffs.push(`With ${athlete.selectedSkills.length} selected skills, some receive lighter exposure this week to protect ${athlete.primaryGoalLabel} quality.`)
  }
  
  // Recovery tradeoff
  if (athlete.recoveryQuality === 'poor' || athlete.recoveryQuality === 'moderate') {
    tradeoffs.push('Volume intentionally moderated given current recovery capacity.')
  }
  
  // Joint caution tradeoff
  if (athlete.jointCautions.length > 0) {
    tradeoffs.push('Some exercise variations adjusted to respect joint considerations.')
  }
  
  return tradeoffs
}

function buildProtectionExplanations(
  program: NormalizedExplanationInput['program'],
  week: NormalizedExplanationInput['week']
): string[] {
  const protections: string[] = []
  
  if (program.isFirstWeek) {
    protections.push('First-week conservative dosage protects adaptation quality.')
  }
  
  if (week.volumeBias === 'reduced') {
    protections.push('Volume reduced this week to support recovery.')
  }
  
  if (week.loadBias === 'reduced') {
    protections.push('Intensity moderated to preserve movement quality.')
  }
  
  program.doctrineConstraints.forEach(constraint => {
    if (constraint.includes('straight_arm')) {
      protections.push('Straight-arm load managed to protect connective tissue.')
    }
  })
  
  return protections
}

function buildWeekFocusInsight(
  athlete: NormalizedExplanationInput['athlete'],
  week: NormalizedExplanationInput['week'],
  sessions: NormalizedSessionInput[]
): string {
  // Find the dominant skill across sessions
  const skillExposureCounts: Record<string, number> = {}
  sessions.forEach(s => {
    s.directlyExpressedSkills.forEach(skill => {
      skillExposureCounts[skill] = (skillExposureCounts[skill] || 0) + 1
    })
  })
  
  const sortedSkills = Object.entries(skillExposureCounts)
    .sort((a, b) => b[1] - a[1])
  
  if (sortedSkills.length === 0) {
    return `This week builds the strength foundation your ${athlete.primaryGoalLabel} work depends on.`
  }
  
  const topSkill = formatGoalLabel(sortedSkills[0][0])
  const topCount = sortedSkills[0][1]
  
  if (topCount >= 3) {
    return `Concentrated ${topSkill} exposure (${topCount} sessions) drives this week's adaptation.`
  }
  
  return `Balanced skill exposure this week with ${topSkill} receiving primary attention.`
}

function buildProgressionInsight(
  athlete: NormalizedExplanationInput['athlete'],
  program: NormalizedExplanationInput['program']
): string | null {
  if (program.isFirstWeek) {
    return 'Progressions will calibrate based on your performance this week.'
  }
  
  if (program.adaptationPhase === 'recovery_constrained') {
    return 'Holding progressions this week to support recovery.'
  }
  
  if (athlete.experienceLevel === 'beginner') {
    return 'Focus on movement quality this week. Progressions follow consistency.'
  }
  
  return null
}

// =============================================================================
// SESSION-LEVEL EXPLANATION BUILDER
// =============================================================================

/**
 * Build session-level explanation bundle.
 * Explains what today is trying to accomplish and why.
 */
export function buildSessionExplanation(
  session: NormalizedSessionInput,
  programContext: { primaryGoal: string; primaryGoalLabel: string; secondaryGoal: string | null; isFirstWeek: boolean }
): SessionExplanationBundle {
  // Build session purpose
  const sessionPurpose = buildSessionPurpose(session, programContext)
  
  // Build structure reason
  const sessionStructureReason = buildSessionStructureReason(session)
  
  // Build ordering reason
  const orderingReason = buildOrderingReason(session)
  
  // Build adaptation note
  const adaptationNote = session.isProtectionConstrained 
    ? 'Dosage conservatively managed this session.'
    : null
  
  // Build protection note
  const protectionNote = programContext.isFirstWeek
    ? 'First-week exposure — quality over intensity.'
    : null
  
  return {
    dayNumber: session.dayNumber,
    sessionPurpose,
    sessionStructureReason,
    orderingReason,
    adaptationNote,
    protectionNote,
    confidenceLevel: 'high',
    source: 'authoritative',
  }
}

function buildSessionPurpose(
  session: NormalizedSessionInput,
  programContext: { primaryGoal: string; primaryGoalLabel: string; secondaryGoal: string | null }
): string {
  const intentLower = session.sessionIntent.toLowerCase()
  const { primaryGoalLabel } = programContext
  
  // Direct skill focus
  if (session.directlyExpressedSkills.length > 0) {
    const skills = session.directlyExpressedSkills.map(formatGoalLabel)
    if (skills.length === 1) {
      return `Primary ${skills[0]} development. Quality skill exposure with supporting strength work.`
    }
    return `Dual skill focus: ${skills.join(' + ')}. Balanced exposure across both.`
  }
  
  // Intent-based
  if (intentLower.includes('strength') || intentLower.includes('force')) {
    return `Strength-building session. Force capacity work that your ${primaryGoalLabel} depends on.`
  }
  
  if (intentLower.includes('volume') || intentLower.includes('density')) {
    return `Volume accumulation session. Building work capacity without max intensity demands.`
  }
  
  if (intentLower.includes('recovery') || intentLower.includes('lighter')) {
    return `Lower-demand session. Maintains training frequency while supporting recovery.`
  }
  
  // Spine type based
  if (session.spineSessionType.includes('push')) {
    return `Push-emphasis session. Pressing and protraction work for ${primaryGoalLabel} support.`
  }
  
  if (session.spineSessionType.includes('pull')) {
    return `Pull-emphasis session. Pulling and scapular work building ${primaryGoalLabel} foundation.`
  }
  
  // Default
  return `Balanced training session building toward ${primaryGoalLabel}.`
}

function buildSessionStructureReason(session: NormalizedSessionInput): string {
  const parts: string[] = []
  
  parts.push(`${session.exerciseCount} exercises in ~${session.estimatedMinutes} minutes.`)
  
  if (session.hasSupersetsApplied) {
    parts.push('Supersets pair non-competing movements for efficiency.')
  }
  
  if (session.hasDensityApplied) {
    parts.push('Density block captures additional volume without extending session time.')
  }
  
  if (session.isPrimary) {
    parts.push('Higher neural demand — prioritize this session when fresh.')
  }
  
  return parts.join(' ')
}

function buildOrderingReason(session: NormalizedSessionInput): string | null {
  if (session.isPrimary && session.directlyExpressedSkills.length > 0) {
    return 'Skill work placed first while nervous system is fresh. Strength work follows.'
  }
  
  if (session.hasSupersetsApplied || session.hasDensityApplied) {
    return 'Main work first, paired/density work finishes session efficiently.'
  }
  
  return null
}

// =============================================================================
// EXERCISE-LEVEL EXPLANATION BUILDER
// =============================================================================

/**
 * Build exercise-level explanation bundle.
 * Explains why this exercise exists in this day/program for this athlete.
 */
export function buildExerciseExplanation(
  exercise: NormalizedExerciseInput,
  sessionContext: NormalizedSessionInput,
  programContext: { primaryGoal: string; primaryGoalLabel: string; isFirstWeek: boolean }
): ExerciseExplanationBundle {
  // Build role explanation - the primary WHY
  const roleExplanation = buildExerciseRoleExplanation(exercise, sessionContext, programContext)
  
  // Build session context note
  const sessionContextNote = buildExerciseSessionContext(exercise, sessionContext)
  
  // Build program context note
  const programContextNote = buildExerciseProgramContext(exercise, programContext)
  
  // Build dosage reason
  const dosageReason = buildExerciseDosageReason(exercise, sessionContext, programContext)
  
  return {
    exerciseId: exercise.id,
    roleExplanation,
    sessionContextNote,
    programContextNote,
    dosageReason,
    confidenceLevel: exercise.selectionReason ? 'high' : 'moderate',
    source: exercise.selectionReason ? 'authoritative' : 'derived',
  }
}

/**
 * Build exercise role explanation using the sophisticated reasoning engine from program-display-contract.
 * 
 * This delegates to buildExercisePurposeLine which has:
 * - 15+ reason family classifications (direct_skill_exposure, force_base_building, explosive_power, etc.)
 * - 7+ modifiers (low_fatigue, high_quality, bridging, speed_preserving, etc.)
 * - 20+ local payoff types (lean_tolerance, trunk_compression, scapular_control, etc.)
 * - Day stress profile awareness (push/pull dominant, skill focused, etc.)
 * - Dosage profile awareness (volume intent, fatigue impact, quality emphasis, etc.)
 * - Movement family contradiction guards
 * - Anti-generic quality filters
 */
function buildExerciseRoleExplanation(
  exercise: NormalizedExerciseInput,
  sessionContext: NormalizedSessionInput,
  programContext: { primaryGoal: string; primaryGoalLabel: string }
): string {
  // ==========================================================================
  // [COACHING-EXPLANATION-CONTRACT] DELEGATE TO SOPHISTICATED REASONING ENGINE
  // ==========================================================================
  // The buildExercisePurposeLine function in program-display-contract.ts has
  // the full reasoning engine with:
  // - deriveReasonFamily (15+ categories)
  // - deriveModifiers (7+ types)
  // - deriveLocalPayoff (20+ payoffs)
  // - deriveDayStressProfile (7 dimensions)
  // - deriveDosageProfile (5 dimensions)
  // - composeExplanationFromReason (intelligent wording composer)
  // ==========================================================================
  
  // Build session context for the purpose line builder
  const sessionContextForPurposeLine = {
    sessionFocus: sessionContext.sessionIntent || sessionContext.dayLabel,
    isPrimarySession: sessionContext.isPrimary,
    primaryGoal: programContext.primaryGoal,
    compositionMetadata: {
      spineSessionType: sessionContext.spineSessionType,
      sessionIntent: sessionContext.sessionIntent,
    },
  }
  
  // Build exercise object for the purpose line builder
  const exerciseForPurposeLine = {
    name: exercise.name,
    category: exercise.category,
    selectionReason: exercise.selectionReason,
    isPrimary: exercise.isPrimary,
    isProtected: exercise.isProtected,
    coachingMeta: {
      expressionMode: exercise.expressionMode,
      roleInSession: exercise.roleInSession,
      loadDecisionSummary: exercise.loadDecisionSummary || undefined,
      progressionIntent: exercise.progressionIntent,
    },
  }
  
  // Derive emphasis kind based on role
  let emphasisKind: 'primary_skill' | 'strength_output' | 'support' | 'accessory' | undefined
  const role = exercise.roleInSession.toLowerCase()
  const expression = exercise.expressionMode.toLowerCase()
  
  if (role.includes('main') || role.includes('primary') || expression.includes('direct')) {
    emphasisKind = 'primary_skill'
  } else if (role.includes('strength') || role.includes('force') || role.includes('foundation')) {
    emphasisKind = 'strength_output'
  } else if (role.includes('support') || role.includes('bridge')) {
    emphasisKind = 'support'
  } else {
    emphasisKind = 'accessory'
  }
  
  // Call the sophisticated reasoning engine
  const purposeLine = buildPurposeLineFromDisplayContract(
    exerciseForPurposeLine,
    sessionContextForPurposeLine,
    emphasisKind
  )
  
  // Return the result, with a fallback if the engine returns null
  if (purposeLine) {
    return purposeLine
  }
  
  // ==========================================================================
  // FALLBACK: Simple but still context-aware explanation
  // ==========================================================================
  const { primaryGoalLabel } = programContext
  const family = exercise.movementFamily
  
  // Primary/direct skill work
  if (role.includes('main') || role.includes('primary') || expression.includes('direct')) {
    if (exercise.skillSupportTargets.length > 0) {
      const targetLabel = formatGoalLabel(exercise.skillSupportTargets[0])
      return `Primary ${targetLabel} exposure — direct skill practice at your current progression.`
    }
    return `Main driver for today — quality output here matters most.`
  }
  
  // Strength foundation
  if (role.includes('strength') || role.includes('foundation') || role.includes('force')) {
    return `Builds the force base your ${primaryGoalLabel} work depends on.`
  }
  
  // Bridge/progression work
  if (role.includes('bridge') || expression.includes('bridge')) {
    return `Bridge progression matching your current level — builds toward harder variations.`
  }
  
  // Balance/counterstress
  if (role.includes('balance') || role.includes('counter')) {
    if (family === 'pull') {
      return `Pulling work to balance pressing stress — keeps shoulders healthy.`
    }
    if (family === 'push') {
      return `Pressing work to balance pulling demands — maintains joint health.`
    }
    return `Balance work offsetting the session's primary stress pattern.`
  }
  
  // Tissue/joint conditioning
  if (role.includes('tissue') || role.includes('joint') || role.includes('conditioning')) {
    return `Conditions tissue for the demands of your main work — not fatiguing, but necessary.`
  }
  
  // Trunk/core work
  if (family === 'core' || role.includes('trunk') || role.includes('line')) {
    if (sessionContext.directlyExpressedSkills.some(s => s.includes('planche') || s.includes('lever'))) {
      return `Trunk control for the body positions your skill work requires.`
    }
    return `Core stability supporting movement quality across the session.`
  }
  
  // Scap work
  if (family === 'scap') {
    return `Scapular control for cleaner positioning under load.`
  }
  
  // Accessory/support
  if (role.includes('accessory') || role.includes('support')) {
    if (exercise.skillSupportTargets.length > 0) {
      const targetLabel = formatGoalLabel(exercise.skillSupportTargets[0])
      return `Support work feeding into ${targetLabel} capacity.`
    }
    return `Targeted support without competing for recovery from main work.`
  }
  
  // Finisher
  if (role.includes('finisher') || role.includes('density')) {
    return `End-of-session volume — captures additional stimulus efficiently.`
  }
  
  // Default based on movement family with goal context
  if (family === 'pull') {
    return `Pulling strength that supports your ${primaryGoalLabel} progression.`
  }
  if (family === 'push') {
    return `Pressing strength that supports your ${primaryGoalLabel} progression.`
  }
  
  return `Supports your ${primaryGoalLabel} goals.`
}

function buildExerciseSessionContext(
  exercise: NormalizedExerciseInput,
  sessionContext: NormalizedSessionInput
): string | null {
  // If this is the only primary exercise, note its importance
  if (exercise.isPrimary) {
    return `Priority slot this session. Output here drives adaptation.`
  }
  
  // If session has density/supersets and this exercise is part of it
  if (sessionContext.hasSupersetsApplied && !exercise.isPrimary) {
    return `Paired for efficiency without recovery cost.`
  }
  
  if (sessionContext.hasDensityApplied && !exercise.isPrimary) {
    return `Captured in density format for time efficiency.`
  }
  
  return null
}

function buildExerciseProgramContext(
  exercise: NormalizedExerciseInput,
  programContext: { primaryGoal: string; primaryGoalLabel: string }
): string | null {
  const family = exercise.movementFamily
  const goalLower = programContext.primaryGoal.toLowerCase()
  
  // Pull exercises in push-oriented programs
  if (family === 'pull' && (goalLower.includes('planche') || goalLower.includes('hspu') || goalLower.includes('handstand'))) {
    return `Maintains pulling capacity alongside pressing-dominant program.`
  }
  
  // Push exercises in pull-oriented programs
  if (family === 'push' && (goalLower.includes('lever') || goalLower.includes('muscle_up'))) {
    return `Maintains pressing capacity alongside pulling-dominant program.`
  }
  
  // Core for any skill goal
  if (family === 'core' && (goalLower.includes('planche') || goalLower.includes('lever') || goalLower.includes('handstand'))) {
    return `Trunk strength required for your skill positions.`
  }
  
  return null
}

/**
 * Build exercise dosage reason using the sophisticated effort reason engine from program-display-contract.
 * 
 * This delegates to buildExerciseEffortReasonLine which explains WHY this effort level was chosen,
 * not just WHAT the effort level is.
 */
function buildExerciseDosageReason(
  exercise: NormalizedExerciseInput,
  sessionContext: NormalizedSessionInput,
  programContext: { isFirstWeek: boolean }
): string | null {
  // ==========================================================================
  // [COACHING-EXPLANATION-CONTRACT] DELEGATE TO SOPHISTICATED EFFORT REASON ENGINE
  // ==========================================================================
  
  // Build exercise object for the effort reason builder
  const exerciseForEffortReason = {
    name: exercise.name,
    category: exercise.category,
    targetRPE: exercise.targetRPE ?? undefined,
    selectionReason: exercise.selectionReason,
    isPrimary: exercise.isPrimary,
    isProtected: exercise.isProtected,
    coachingMeta: {
      expressionMode: exercise.expressionMode,
      roleInSession: exercise.roleInSession,
      loadDecisionSummary: exercise.loadDecisionSummary || undefined,
      progressionIntent: exercise.progressionIntent,
    },
  }
  
  // Build session context for the effort reason builder
  const sessionContextForEffortReason = {
    sessionFocus: sessionContext.sessionIntent || sessionContext.dayLabel,
    isPrimarySession: sessionContext.isPrimary,
    prescriptionPropagationAudit: sessionContext.isProtectionConstrained ? {
      appliedReductions: {
        setsReduced: true,
        rpeReduced: true,
      },
      adaptationPhase: programContext.isFirstWeek ? 'initial_acclimation' : 'recovery_constrained',
    } : undefined,
  }
  
  // Call the sophisticated effort reason engine
  const effortReason = buildEffortReasonFromDisplayContract(
    exerciseForEffortReason,
    sessionContextForEffortReason
  )
  
  // Return the result if available
  if (effortReason) {
    return effortReason
  }
  
  // ==========================================================================
  // FALLBACK: Context-aware dosage explanation
  // ==========================================================================
  const rpe = exercise.targetRPE
  const role = exercise.roleInSession.toLowerCase()
  
  // First week conservative
  if (programContext.isFirstWeek) {
    return `Conservative this week while adapting to new program.`
  }
  
  // Protection constrained session
  if (sessionContext.isProtectionConstrained) {
    return `Moderated dosage this session for recovery support.`
  }
  
  // RPE-based reasoning with context
  if (rpe !== null) {
    if (rpe >= 9) {
      if (role.includes('main') || role.includes('primary')) {
        return `Higher effort here — this is the main output slot where adaptation happens.`
      }
      return `Pushed harder here to maximize stimulus within recoverable limits.`
    }
    if (rpe <= 6) {
      return `Conservative effort to preserve recovery for priority work.`
    }
    if (rpe <= 7) {
      return `Moderate effort — quality stimulus without accumulating recovery debt.`
    }
  }
  
  // Support work dosage
  if (role.includes('support') || role.includes('accessory')) {
    return `Submaximal — supports main work without stealing recovery.`
  }
  
  return null
}

// =============================================================================
// WARMUP EXPLANATION BUILDER
// =============================================================================

/**
 * Build warmup explanation for loaded compounds.
 * Explains why warm-up ramps exist.
 */
export function buildWarmupExplanation(
  exerciseName: string,
  isWeighted: boolean,
  loadValue: number | null
): WarmupExplanationBundle | null {
  const nameLower = exerciseName.toLowerCase()
  
  // Only weighted compounds need ramp explanation
  if (!isWeighted || !loadValue) {
    return null
  }
  
  // Identify exercise type
  const isPullUp = nameLower.includes('pull-up') || nameLower.includes('pullup') || nameLower.includes('chin')
  const isDip = nameLower.includes('dip')
  const isRow = nameLower.includes('row')
  
  if (isPullUp) {
    return {
      exerciseName,
      rampReason: `Weighted pull-ups need tissue preparation before work sets. Light ramp primes pulling pattern and grip without fatigue.`,
      preparationNote: `Start with bodyweight, add load progressively until reaching ${loadValue} for work sets.`,
      source: 'doctrine',
    }
  }
  
  if (isDip) {
    return {
      exerciseName,
      rampReason: `Weighted dips load shoulder and tricep tendons significantly. Brief ramp protects these structures.`,
      preparationNote: `Bodyweight first, then increment to ${loadValue} over 1-2 warm-up sets.`,
      source: 'doctrine',
    }
  }
  
  if (isRow) {
    return {
      exerciseName,
      rampReason: `Loaded rows benefit from position practice before intensity. Quick ramp ensures clean movement.`,
      preparationNote: `Light set or two building to work weight.`,
      source: 'doctrine',
    }
  }
  
  // Generic weighted exercise
  return {
    exerciseName,
    rampReason: `Weighted movements benefit from progressive loading to prepare muscles and joints.`,
    preparationNote: `Brief ramp to ${loadValue} before work sets.`,
    source: 'derived',
  }
}

// =============================================================================
// COMPLETE SURFACE BUILDER
// =============================================================================

/**
 * Build complete explanation surface for a program.
 * This is what the UI consumes.
 */
export function buildProgramExplanationSurface(program: AdaptiveProgram): ProgramExplanationSurface {
  // Normalize input
  const input = normalizeExplanationInput(program)
  
  // Build program explanation
  const programExplanation = buildProgramExplanation(input)
  
  // Build session explanations
  const sessionExplanations: SessionExplanationBundle[] = input.sessions.map(session =>
    buildSessionExplanation(session, {
      primaryGoal: input.athlete.primaryGoal,
      primaryGoalLabel: input.athlete.primaryGoalLabel,
      secondaryGoal: input.athlete.secondaryGoal,
      isFirstWeek: input.program.isFirstWeek,
    })
  )
  
  // Build exercise explanations
  const exerciseExplanations = new Map<string, ExerciseExplanationBundle>()
  input.sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      const explanation = buildExerciseExplanation(exercise, session, {
        primaryGoal: input.athlete.primaryGoal,
        primaryGoalLabel: input.athlete.primaryGoalLabel,
        isFirstWeek: input.program.isFirstWeek,
      })
      exerciseExplanations.set(exercise.id, explanation)
    })
  })
  
  // Build warmup explanations
  const warmupExplanations: WarmupExplanationBundle[] = []
  input.sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      if (exercise.isWeighted) {
        const warmup = buildWarmupExplanation(
          exercise.name,
          exercise.isWeighted,
          // Extract load value - this would come from prescribedLoad
          null // We don't have this in normalized input, but the builder can still provide generic advice
        )
        if (warmup) {
          warmupExplanations.push(warmup)
        }
      }
    })
  })
  
  return {
    program: programExplanation,
    sessions: sessionExplanations,
    exercises: exerciseExplanations,
    warmups: warmupExplanations,
    generatedAt: new Date().toISOString(),
    inputTruthSource: input.truthSource,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatGoalLabel(goal: string): string {
  const labelMap: Record<string, string> = {
    front_lever: 'Front Lever',
    planche: 'Planche',
    muscle_up: 'Muscle Up',
    back_lever: 'Back Lever',
    l_sit: 'L-Sit',
    v_sit: 'V-Sit',
    handstand: 'Handstand',
    hspu: 'Handstand Push-Up',
    handstand_pushup: 'Handstand Push-Up',
    iron_cross: 'Iron Cross',
    maltese: 'Maltese',
    one_arm_pull_up: 'One Arm Pull-Up',
    one_arm_chin: 'One Arm Chin',
    ring_muscle_up: 'Ring Muscle Up',
    weighted_strength: 'Weighted Strength',
    general_strength: 'General Strength',
    skill_variety: 'Skill Variety',
    mobility_flexibility: 'Mobility',
  }
  
  return labelMap[goal] || goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// =============================================================================
// COMPACT GETTERS FOR UI CONSUMPTION
// =============================================================================

/**
 * Get a compact program fit explanation for UI display.
 */
export function getCompactProgramFitExplanation(surface: ProgramExplanationSurface): {
  headline: string
  bullets: string[]
} {
  const bullets: string[] = []
  
  // Add goal fit as first bullet
  if (surface.program.goalFitExplanation) {
    bullets.push(surface.program.goalFitExplanation)
  }
  
  // Add week focus insight
  if (surface.program.weekFocusInsight) {
    bullets.push(surface.program.weekFocusInsight)
  }
  
  // Add first tradeoff if meaningful
  if (surface.program.tradeoffExplanations.length > 0) {
    bullets.push(surface.program.tradeoffExplanations[0])
  }
  
  // Add first protection if present
  if (surface.program.protectionExplanations.length > 0) {
    bullets.push(surface.program.protectionExplanations[0])
  }
  
  return {
    headline: surface.program.headline,
    bullets: bullets.slice(0, 4), // Max 4 bullets
  }
}

/**
 * Get compact session explanation for UI display.
 */
export function getCompactSessionExplanation(
  surface: ProgramExplanationSurface,
  dayNumber: number
): { purpose: string; note: string | null } | null {
  const session = surface.sessions.find(s => s.dayNumber === dayNumber)
  if (!session) return null
  
  return {
    purpose: session.sessionPurpose,
    note: session.adaptationNote || session.protectionNote || null,
  }
}

/**
 * Get compact exercise explanation for UI display.
 */
export function getCompactExerciseExplanation(
  surface: ProgramExplanationSurface,
  exerciseId: string
): { role: string; dosage: string | null } | null {
  const exercise = surface.exercises.get(exerciseId)
  if (!exercise) return null
  
  return {
    role: exercise.roleExplanation,
    dosage: exercise.dosageReason,
  }
}
