/**
 * MASTER-8C.10 — Controlled Frequency Placement Apply Contract
 * 
 * This file provides a pure TypeScript apply contract for converting confirmed
 * MASTER-8C.9 frequency placement previews into actual saved program mutations.
 * 
 * KEY RULES:
 * - Only eligible ROW-LEVEL methods are supported (drop_set, rest_pause, top_set, cluster)
 * - Grouped methods (circuits, density_block, superset) are BLOCKED
 * - Endurance/conditioning is BLOCKED (no real prescription)
 * - Deep clones the program - never mutates original
 * - No direct localStorage/API access
 * - Returns evidence for every decision
 * 
 * @version MASTER-8C.10
 */

import type { FrequencySlotPlacementPreview, FrequencySlotPlacementTarget } from './method-frequency-slot-placement-preview'

// =============================================================================
// TYPE CONTRACTS
// =============================================================================

export type FrequencyPlacementApplyStatus =
  | 'success'
  | 'partial_success'
  | 'blocked'
  | 'already_applied'
  | 'invalid_preview'
  | 'invalid_program'

export interface FrequencyPlacementApplyResult {
  status: FrequencyPlacementApplyStatus
  updatedProgram?: unknown // AdaptiveProgram
  visibleSummary: string
  methodKey: string
  displayLabel: string
  requestedFrequency: number
  appliedCount: number
  blockedCount: number
  targetedDays: string[]
  targetedExercises: string[]
  evidence: string[]
  blockedReasons: string[]
  programChanged: boolean
  persistRequired: boolean
  /** Live workout was NOT touched - this is row metadata only */
  liveWorkoutChanged: false
  /** Completed sessions are never mutated */
  completedSessionsProtected: true
  /** Existing Method Planner artifacts are preserved */
  existingSavedArtifactsPreserved: true
}

// Row-level methods that have setExecutionMethod support
const SUPPORTED_ROW_LEVEL_METHODS = ['drop_set', 'rest_pause', 'top_set', 'backoff_sets', 'cluster'] as const
type SupportedRowLevelMethod = typeof SUPPORTED_ROW_LEVEL_METHODS[number]

// Methods blocked for frequency placement
const BLOCKED_METHODS = ['density_block', 'endurance_density', 'superset', 'circuit', 'circuits', 'prescription_rest', 'prescription_rpe', 'straight_sets'] as const

// Mapping from 8C.7/8C.8 canonical keys to row setExecutionMethod values
function toRowSetExecutionMethod(methodKey: string): 'cluster' | 'rest_pause' | 'top_set' | 'drop_set' | null {
  switch (methodKey) {
    case 'cluster': return 'cluster'
    case 'rest_pause': return 'rest_pause'
    case 'drop_set': return 'drop_set'
    case 'top_set': return 'top_set'
    case 'backoff_sets': return 'top_set' // Backoff maps to top_set execution
    default: return null
  }
}

function toMethodDisplayLabel(methodKey: string): string {
  switch (methodKey) {
    case 'cluster': return 'Cluster Set'
    case 'rest_pause': return 'Rest-Pause'
    case 'drop_set': return 'Drop Set'
    case 'top_set': return 'Top Set'
    case 'backoff_sets': return 'Backoff Sets'
    default: return methodKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }
}

// Method instruction copy
const METHOD_INSTRUCTIONS: Record<string, { instruction: string; riskNote: string }> = {
  drop_set: {
    instruction: 'Perform set to near-failure, then immediately reduce weight by 20-30% and continue for additional reps without rest.',
    riskNote: 'High fatigue accumulation. Best for accessory/hypertrophy work, not primary skill exercises.',
  },
  rest_pause: {
    instruction: 'Perform set to near-failure, rest 10-20 seconds, then continue with same weight for additional reps. Repeat 2-3 times.',
    riskNote: 'Very high intensity. Avoid on max strength or high-tendon-stress exercises.',
  },
  top_set: {
    instruction: 'Perform one heavy top set at high intensity, then reduce weight for back-off sets at moderate intensity.',
    riskNote: 'Demanding on CNS. Best for compound strength exercises with proper warm-up.',
  },
  backoff_sets: {
    instruction: 'After primary work, reduce weight by 10-20% and perform additional volume sets with controlled tempo.',
    riskNote: 'Adds training volume. Monitor fatigue accumulation across the week.',
  },
  cluster: {
    instruction: 'Break the set into mini-sets of 2-3 reps with 10-20 second intra-set rest periods.',
    riskNote: 'Allows heavier loading. Best for strength/power exercises.',
  },
}

// =============================================================================
// MAIN APPLY FUNCTION
// =============================================================================

export function applyConfirmedFrequencyPlacementPreview(args: {
  program: unknown
  placementPreview: FrequencySlotPlacementPreview
  allowCautionApply: boolean
}): FrequencyPlacementApplyResult {
  const { program, placementPreview, allowCautionApply } = args
  const evidence: string[] = []
  const blockedReasons: string[] = []
  const targetedDays: string[] = []
  const targetedExercises: string[] = []
  
  const methodKey = placementPreview.methodKey
  const displayLabel = placementPreview.displayLabel
  const requestedFrequency = placementPreview.requestedFrequency

  evidence.push(`[MASTER-8C.10] applyConfirmedFrequencyPlacementPreview called`)
  evidence.push(`Method: ${methodKey} (${displayLabel})`)
  evidence.push(`Requested frequency: ${requestedFrequency}x`)

  // Validate program
  if (!program || typeof program !== 'object') {
    return createBlockedResult({
      methodKey,
      displayLabel,
      requestedFrequency,
      reason: 'Invalid program object',
      evidence: [...evidence, 'program is null or not an object'],
      blockedReasons: ['Invalid program'],
    })
  }

  const typedProgram = program as { sessions?: unknown[] }
  if (!Array.isArray(typedProgram.sessions) || typedProgram.sessions.length === 0) {
    return createBlockedResult({
      methodKey,
      displayLabel,
      requestedFrequency,
      reason: 'Program has no sessions',
      evidence: [...evidence, 'program.sessions is empty or not an array'],
      blockedReasons: ['No sessions in program'],
    })
  }

  // Validate preview status
  if (placementPreview.status !== 'preview_ready' && placementPreview.status !== 'preview_ready_with_caution') {
    return createBlockedResult({
      methodKey,
      displayLabel,
      requestedFrequency,
      reason: `Preview status is not ready: ${placementPreview.status}`,
      evidence: [...evidence, `placementPreview.status: ${placementPreview.status}`],
      blockedReasons: [placementPreview.warnings[0] || 'Preview not ready'],
    })
  }

  // Block caution apply if not allowed
  if (placementPreview.status === 'preview_ready_with_caution' && !allowCautionApply) {
    return createBlockedResult({
      methodKey,
      displayLabel,
      requestedFrequency,
      reason: 'Caution preview requires explicit confirmation',
      evidence: [...evidence, 'status is preview_ready_with_caution', 'allowCautionApply is false'],
      blockedReasons: ['Caution confirmation required'],
    })
  }

  // Check if method is blocked
  if ((BLOCKED_METHODS as readonly string[]).includes(methodKey)) {
    const blockReason = getBlockReason(methodKey)
    return createBlockedResult({
      methodKey,
      displayLabel,
      requestedFrequency,
      reason: blockReason,
      evidence: [...evidence, `${methodKey} is in BLOCKED_METHODS list`],
      blockedReasons: [blockReason],
    })
  }

  // Check if method is supported for row-level apply
  const setExecutionMethod = toRowSetExecutionMethod(methodKey)
  if (!setExecutionMethod) {
    return createBlockedResult({
      methodKey,
      displayLabel,
      requestedFrequency,
      reason: `${displayLabel} does not have row-level render support (no setExecutionMethod mapping)`,
      evidence: [...evidence, `toRowSetExecutionMethod(${methodKey}) returned null`],
      blockedReasons: ['No row-level render support'],
    })
  }

  evidence.push(`setExecutionMethod mapping: ${setExecutionMethod}`)

  // Validate targets
  const targets = placementPreview.targets || []
  if (targets.length === 0) {
    return createBlockedResult({
      methodKey,
      displayLabel,
      requestedFrequency,
      reason: 'No placement targets in preview',
      evidence: [...evidence, 'placementPreview.targets is empty'],
      blockedReasons: ['No targets'],
    })
  }

  evidence.push(`Target count: ${targets.length}`)

  // Deep clone program for mutation
  const updatedProgram = JSON.parse(JSON.stringify(program)) as {
    sessions: Array<{
      dayNumber?: number
      focusLabel?: string
      exercises?: Array<Record<string, unknown>>
      styleMetadata?: Record<string, unknown>
    }>
  }

  let appliedCount = 0
  let blockedCount = 0

  // Apply each target
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]
    const targetResult = applyTargetToProgram({
      updatedProgram,
      target,
      methodKey,
      setExecutionMethod,
      displayLabel,
      requestedFrequency,
      targetIndex: i,
    })

    if (targetResult.success) {
      appliedCount++
      targetedDays.push(target.sessionLabel)
      targetedExercises.push(target.exerciseNames[0] || 'Unknown')
      evidence.push(`✓ Applied to ${target.sessionLabel} — ${target.exerciseNames[0]}`)
    } else {
      blockedCount++
      blockedReasons.push(targetResult.reason)
      evidence.push(`✗ Blocked: ${target.sessionLabel} — ${targetResult.reason}`)
    }
  }

  // Determine final status
  if (appliedCount === 0) {
    return createBlockedResult({
      methodKey,
      displayLabel,
      requestedFrequency,
      reason: 'All targets were blocked',
      evidence,
      blockedReasons,
    })
  }

  const status: FrequencyPlacementApplyStatus = blockedCount > 0 ? 'partial_success' : 'success'
  const visibleSummary = appliedCount === targets.length
    ? `Applied ${appliedCount} ${displayLabel} placement${appliedCount !== 1 ? 's' : ''} to saved program`
    : `Applied ${appliedCount}/${targets.length} ${displayLabel} placements (${blockedCount} blocked)`

  evidence.push(`Final status: ${status}`)
  evidence.push(`Applied: ${appliedCount}, Blocked: ${blockedCount}`)

  return {
    status,
    updatedProgram,
    visibleSummary,
    methodKey,
    displayLabel,
    requestedFrequency,
    appliedCount,
    blockedCount,
    targetedDays,
    targetedExercises,
    evidence,
    blockedReasons,
    programChanged: appliedCount > 0,
    persistRequired: appliedCount > 0,
    liveWorkoutChanged: false,
    completedSessionsProtected: true,
    existingSavedArtifactsPreserved: true,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function applyTargetToProgram(args: {
  updatedProgram: {
    sessions: Array<{
      dayNumber?: number
      focusLabel?: string
      exercises?: Array<Record<string, unknown>>
      styleMetadata?: Record<string, unknown>
    }>
  }
  target: FrequencySlotPlacementTarget
  methodKey: string
  setExecutionMethod: 'cluster' | 'rest_pause' | 'top_set' | 'drop_set'
  displayLabel: string
  requestedFrequency: number
  targetIndex: number
}): { success: boolean; reason: string } {
  const { updatedProgram, target, methodKey, setExecutionMethod, displayLabel, requestedFrequency, targetIndex } = args

  // Find session
  const sessionIndex = target.sessionIndex
  if (sessionIndex < 0 || sessionIndex >= updatedProgram.sessions.length) {
    return { success: false, reason: `Session index ${sessionIndex} out of bounds` }
  }

  const session = updatedProgram.sessions[sessionIndex]
  const exercises = session.exercises || []

  // Find target exercise
  const exerciseId = target.exerciseIds[0]
  const exerciseName = target.exerciseNames[0]
  
  let targetExerciseIndex = -1
  
  // First try by ID
  if (exerciseId) {
    targetExerciseIndex = exercises.findIndex(ex => ex.id === exerciseId)
  }
  
  // Fallback to name match
  if (targetExerciseIndex === -1 && exerciseName) {
    const normalizedTarget = normalizeExerciseName(exerciseName)
    targetExerciseIndex = exercises.findIndex(ex => 
      normalizeExerciseName(String(ex.name || '')) === normalizedTarget
    )
  }

  if (targetExerciseIndex === -1) {
    return { success: false, reason: `Exercise "${exerciseName}" not found in session` }
  }

  const targetExercise = exercises[targetExerciseIndex]

  // Check if already applied with same method
  if (targetExercise.methodOverrideApplied === true && 
      targetExercise.setExecutionMethod === setExecutionMethod) {
    return { success: false, reason: `${displayLabel} already applied to this exercise` }
  }

  // Get method instructions
  const methodInfo = METHOD_INSTRUCTIONS[methodKey] || {
    instruction: `Apply ${displayLabel} technique to this exercise.`,
    riskNote: 'Monitor fatigue and recovery.',
  }

  // Apply row-level method metadata
  // These are the EXACT fields that AdaptiveSessionCard.resolveRowMethodTruth reads
  targetExercise.setExecutionMethod = setExecutionMethod
  targetExercise.methodLabel = displayLabel
  targetExercise.method = setExecutionMethod
  targetExercise.trainingMethod = methodKey
  targetExercise.methodOverrideApplied = true
  targetExercise.methodOverrideMethodKey = methodKey
  targetExercise.methodOverrideAppliedAt = new Date().toISOString()
  targetExercise.methodOverrideCanRevert = true
  targetExercise.methodRationale = `Applied via Frequency Placement (${requestedFrequency}x/week) to ${exerciseName}.`
  targetExercise.methodInstructions = methodInfo.instruction
  targetExercise.methodRiskNote = methodInfo.riskNote
  // [MASTER-8C.10] Frequency placement tracking
  targetExercise.frequencyPlacementApplied = true
  targetExercise.frequencyPlacementSource = 'MASTER-8C.10'
  targetExercise.frequencyPlacementRequestedFrequency = requestedFrequency
  targetExercise.frequencyPlacementTargetIndex = targetIndex

  // Update session styleMetadata to track row applications
  if (!session.styleMetadata) {
    session.styleMetadata = {}
  }
  
  const rowApplications = (session.styleMetadata.methodOverrideRowApplications || []) as Array<{
    methodKey: string
    exerciseName: string
    exerciseIndex: number
    appliedAt: string
    source: string
  }>
  
  rowApplications.push({
    methodKey,
    exerciseName: exerciseName || 'Unknown',
    exerciseIndex: targetExerciseIndex,
    appliedAt: new Date().toISOString(),
    source: 'frequency_placement_8C.10',
  })
  
  session.styleMetadata.methodOverrideRowApplications = rowApplications

  // Update appliedMethods array if it exists
  const appliedMethods = (session.styleMetadata.appliedMethods || []) as string[]
  if (!appliedMethods.includes(methodKey)) {
    appliedMethods.push(methodKey)
    session.styleMetadata.appliedMethods = appliedMethods
  }

  return { success: true, reason: '' }
}

function normalizeExerciseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getBlockReason(methodKey: string): string {
  switch (methodKey) {
    case 'density_block':
      return 'Density Blocks require timed-window logging model (not implemented)'
    case 'endurance_density':
      return 'Endurance/Conditioning requires real modality/exercise prescription (not implemented)'
    case 'superset':
      return 'Superset structural writer not implemented'
    case 'circuit':
    case 'circuits':
      return 'Circuits require grouped structural writer (use existing Method Planner for circuits)'
    case 'prescription_rest':
    case 'prescription_rpe':
      return 'Prescription modifiers are not frequency-based methods'
    case 'straight_sets':
      return 'Straight sets is the baseline method, not a frequency override'
    default:
      return `${methodKey} is not supported for frequency placement`
  }
}

function createBlockedResult(args: {
  methodKey: string
  displayLabel: string
  requestedFrequency: number
  reason: string
  evidence: string[]
  blockedReasons: string[]
}): FrequencyPlacementApplyResult {
  return {
    status: 'blocked',
    visibleSummary: args.reason,
    methodKey: args.methodKey,
    displayLabel: args.displayLabel,
    requestedFrequency: args.requestedFrequency,
    appliedCount: 0,
    blockedCount: args.blockedReasons.length || 1,
    targetedDays: [],
    targetedExercises: [],
    evidence: args.evidence,
    blockedReasons: args.blockedReasons,
    programChanged: false,
    persistRequired: false,
    liveWorkoutChanged: false,
    completedSessionsProtected: true,
    existingSavedArtifactsPreserved: true,
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if a method is supported for frequency placement apply
 */
export function isMethodSupportedForFrequencyApply(methodKey: string): boolean {
  return (SUPPORTED_ROW_LEVEL_METHODS as readonly string[]).includes(methodKey) &&
         toRowSetExecutionMethod(methodKey) !== null
}

/**
 * Check if a method is blocked for frequency placement
 */
export function isMethodBlockedForFrequencyApply(methodKey: string): { blocked: boolean; reason: string } {
  if ((BLOCKED_METHODS as readonly string[]).includes(methodKey)) {
    return { blocked: true, reason: getBlockReason(methodKey) }
  }
  if (!toRowSetExecutionMethod(methodKey)) {
    return { blocked: true, reason: 'No row-level render support' }
  }
  return { blocked: false, reason: '' }
}
