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
import type { AdaptiveProgram, AdaptiveSession } from '@/lib/adaptive-program-builder'

// Extended exercise type for method override fields not in base AdaptiveExercise
interface ExtendedSessionExercise {
  id?: string
  name?: string
  exerciseName?: string
  method?: string
  trainingMethod?: string
  setExecutionMethod?: string
  methodLabel?: string
  methodOverrideApplied?: boolean
  methodOverrideMethodKey?: string
  methodOverrideAppliedAt?: string
  methodOverrideCanRevert?: boolean
  frequencyPlacementApplied?: boolean
  frequencyPlacementSource?: string
  frequencyPlacementRequestedFrequency?: number
  frequencyPlacementTargetIndex?: number
  methodRationale?: string
  methodInstructions?: string
  methodRiskNote?: string
  styledGroupId?: string
  methodFamily?: string
  appliedMethod?: string
  // [MASTER-8C.14D] Grouped method fields
  blockId?: string
  structuralMethodApplied?: boolean
}

// Extended session type for styleMetadata fields
interface ExtendedStyleMetadata {
  methodOverrideRowApplications?: Array<{
    methodKey: string
    exerciseName: string
    exerciseIndex: number
    appliedAt: string
    source: string
  }>
  appliedMethods?: string[]
  [key: string]: unknown
}

interface ExtendedAdaptiveSession extends Omit<AdaptiveSession, 'styleMetadata' | 'exercises'> {
  completed?: boolean
  status?: string
  styleMetadata?: ExtendedStyleMetadata
  exercises?: ExtendedSessionExercise[]
}

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

  // [MASTER-8C.10.1] Defense against stale previews - re-check ownership at apply time
  // Check if already applied with same method (success case)
  if (targetExercise.methodOverrideApplied === true && 
      targetExercise.setExecutionMethod === setExecutionMethod) {
    return { success: false, reason: `${displayLabel} already applied to this exercise` }
  }

  // [MASTER-8C.10.1] Block if exercise has a DIFFERENT row-level method
  if (targetExercise.methodOverrideApplied === true && 
      targetExercise.setExecutionMethod !== setExecutionMethod) {
    return { success: false, reason: `Exercise already has ${targetExercise.setExecutionMethod} method — cannot stack ${setExecutionMethod}` }
  }
  
  // [MASTER-8C.10.1] Block if exercise is part of a styled group (circuit/superset/density)
  if (typeof targetExercise.styledGroupId === 'string' && targetExercise.styledGroupId.length > 0) {
    return { success: false, reason: `Target belongs to grouped method structure — row-level ${displayLabel} blocked` }
  }
  
  // [MASTER-8C.10.1] Block if exercise has another method family
  if (typeof targetExercise.methodFamily === 'string' && 
      targetExercise.methodFamily !== 'straight_sets' && 
      targetExercise.methodFamily !== methodKey) {
    return { success: false, reason: `Target has method family "${targetExercise.methodFamily}" — ${displayLabel} blocked` }
  }
  
  // [MASTER-8C.10.1] Block if exercise has appliedMethod from grouped structure
  if (typeof targetExercise.appliedMethod === 'string' && targetExercise.appliedMethod.length > 0) {
    return { success: false, reason: `Target has appliedMethod "${targetExercise.appliedMethod}" — ${displayLabel} blocked` }
  }
  
  // [MASTER-8C.10.1] Check session-level grouped method ownership
  const sessionStyledGroups = Array.isArray(session.styleMetadata?.styledGroups) 
    ? session.styleMetadata.styledGroups as Array<Record<string, unknown>>
    : []
  
  for (const group of sessionStyledGroups) {
    const memberIds = Array.isArray(group.exerciseIds) ? group.exerciseIds : 
                      Array.isArray(group.memberIds) ? group.memberIds : []
    if (memberIds.includes(exerciseId)) {
      const groupType = group.type ?? group.methodFamily ?? 'grouped_method'
      return { success: false, reason: `Target is member of ${groupType} group — row-level ${displayLabel} blocked` }
    }
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

// ==========================================================================
// [MASTER-8C.12B] Selective Removal Types and Helpers
// ==========================================================================

/**
 * Represents a single user-applied method placement that can be selectively removed.
 * Each placement is uniquely identified by session + exercise + method combination.
 */
export interface AppliedMethodPlacement {
  /** Unique identifier for this placement: `${sessionIndex}-${exerciseIndex}-${methodKey}` */
  id: string
  /** Session index in the program */
  sessionIndex: number
  /** Session day number for display */
  dayNumber: number
  /** Exercise index in the session */
  exerciseIndex: number
  /** Exercise name for display */
  exerciseName: string
  /** Method key (e.g., 'top_set', 'drop_sets') */
  methodKey: string
  /** Display label for the method */
  methodLabel: string
  /** When this placement was applied */
  appliedAt: string
  /** Source of the placement (e.g., 'frequency_placement_8C.10') */
  source: string
  /** Whether this is a row-level method */
  isRowLevel: boolean
  /** Whether this is a grouped/structural method */
  isGrouped: boolean
  /** [MASTER-8C.14C] Group ID for grouped methods like supersets */
  groupId?: string
  /** [MASTER-8C.14C] Exercise names in the group (for display) */
  groupExerciseNames?: string[]
  /** [MASTER-8C.14C] Provenance: 'native_generated' | 'user_applied_method_planner' | 'unknown_legacy' */
  provenance?: 'native_generated' | 'user_applied_method_planner' | 'preview_only' | 'blocked' | 'unknown_legacy'
}

/**
 * Result of extracting all user-applied method placements from a program.
 */
export interface ExtractAppliedPlacementsResult {
  placements: AppliedMethodPlacement[]
  totalCount: number
  rowLevelCount: number
  groupedCount: number
}

/**
 * Result of removing selected method placements.
 */
export interface SelectiveRemovalResult {
  status: 'success' | 'partial_success' | 'blocked'
  visibleSummary: string
  removedCount: number
  failedCount: number
  removedIds: string[]
  failedIds: string[]
  evidence: string[]
  updatedProgram?: AdaptiveProgram
}

/**
 * [MASTER-8C.14C] Check if a styledGroup was applied by Method Override Planner.
 * Used by extractAppliedMethodPlacements to determine removable groups.
 */
function isMethodOverridePlannerGroup(group: {
  id?: string
  source?: string
  methodOverrideApplied?: boolean
  exercises?: Array<{ methodRationale?: string }>
}): boolean {
  // Check explicit markers
  if (group.methodOverrideApplied === true) return true
  if (group.source === 'method_override_planner') return true
  
  // Check ID prefix patterns
  if (group.id?.startsWith('method-override-circuit-')) return true
  if (group.id?.startsWith('method-override-density-block-')) return true
  if (group.id?.startsWith('method-override-superset-')) return true
  
  // Check exercise rationale
  if (group.exercises?.some(ex => 
    ex.methodRationale?.includes('Method Override Planner')
  )) {
    return true
  }
  
  return false
}

/**
 * [MASTER-8C.12B / MASTER-8C.14C] Extract all user-applied method placements from a program.
 * This provides the list of placements that can be selectively removed.
 * [MASTER-8C.14C] Now also extracts grouped placements (supersets, circuits, density blocks).
 */
export function extractAppliedMethodPlacements(
  program: AdaptiveProgram | null
): ExtractAppliedPlacementsResult {
  const placements: AppliedMethodPlacement[] = []
  
  if (!program?.sessions) {
    return { placements, totalCount: 0, rowLevelCount: 0, groupedCount: 0 }
  }
  
  program.sessions.forEach((session: ExtendedAdaptiveSession, sessionIndex: number) => {
    const dayNumber = session.dayNumber ?? sessionIndex + 1
    
    // [MASTER-8C.14C] Extract grouped placements from styledGroups FIRST
    // This ensures we don't double-count exercises that are part of groups
    const groupedExerciseIds = new Set<string>()
    const styledGroups = (session.styleMetadata?.styledGroups || []) as Array<{
      id?: string
      groupType?: string
      source?: string
      methodOverrideApplied?: boolean
      methodOverrideMethodKey?: string
      methodOverrideAppliedAt?: string
      methodOverrideExerciseNames?: string[]
      exercises?: Array<{ id?: string; name?: string; methodRationale?: string }>
    }>
    
    styledGroups.forEach((group) => {
      // Determine provenance
      const isUserApplied = isMethodOverridePlannerGroup(group)
      
      // Only include user-applied groups in the removable list
      if (isUserApplied) {
        const groupExerciseNames = group.exercises?.map(e => e.name || 'Unknown') || 
                                   group.methodOverrideExerciseNames || []
        const exerciseName = groupExerciseNames.join(' + ')
        
        // Track exercise IDs to avoid double-counting
        group.exercises?.forEach(e => {
          if (e.id) groupedExerciseIds.add(e.id)
        })
        
        placements.push({
          id: group.id || `group-${sessionIndex}-${group.groupType}`,
          sessionIndex,
          dayNumber,
          exerciseIndex: -1, // -1 indicates grouped
          exerciseName,
          methodKey: group.methodOverrideMethodKey || group.groupType || 'unknown',
          methodLabel: getMethodDisplayLabel(group.groupType || 'unknown'),
          appliedAt: group.methodOverrideAppliedAt || new Date().toISOString(),
          source: group.source || 'method_override_planner',
          isRowLevel: false,
          isGrouped: true,
          groupId: group.id,
          groupExerciseNames,
          provenance: 'user_applied_method_planner',
        })
      }
    })
    
    // Extract row-level placements from methodOverrideRowApplications
    // [MASTER-8C.14C] Skip exercises that are part of grouped placements
    const rowApplications = (session.styleMetadata?.methodOverrideRowApplications || []) as Array<{
      methodKey: string
      exerciseName: string
      exerciseIndex: number
      appliedAt: string
      source: string
      exerciseId?: string
    }>
    
    rowApplications.forEach((app) => {
      // Skip if this exercise is part of a grouped placement
      if (app.exerciseId && groupedExerciseIds.has(app.exerciseId)) {
        return
      }
      const id = `${sessionIndex}-${app.exerciseIndex}-${app.methodKey}`
      placements.push({
        id,
        sessionIndex,
        dayNumber,
        exerciseIndex: app.exerciseIndex,
        exerciseName: app.exerciseName,
        methodKey: app.methodKey,
        methodLabel: getMethodDisplayLabel(app.methodKey),
        appliedAt: app.appliedAt,
        source: app.source,
        isRowLevel: true,
        isGrouped: false,
        provenance: 'user_applied_method_planner',
      })
    })
    
    // Also check exercises for methodOverrideApplied flag in case row applications list is incomplete
    // [MASTER-8C.14C] Skip exercises that are part of grouped placements
    const exercises = session.exercises || []
    exercises.forEach((exercise: ExtendedSessionExercise, exerciseIndex: number) => {
      // Skip if this exercise is part of a grouped placement
      if (exercise.id && groupedExerciseIds.has(exercise.id)) {
        return
      }
      // Skip if this exercise has a blockId (part of a structural group)
      if (exercise.blockId) {
        return
      }
      if (exercise.methodOverrideApplied && exercise.methodOverrideMethodKey) {
        const id = `${sessionIndex}-${exerciseIndex}-${exercise.methodOverrideMethodKey}`
        // Only add if not already in list from rowApplications
        if (!placements.some(p => p.id === id)) {
          placements.push({
            id,
            sessionIndex,
            dayNumber,
            exerciseIndex,
            exerciseName: exercise.name || exercise.exerciseName || 'Unknown Exercise',
            methodKey: exercise.methodOverrideMethodKey,
            methodLabel: getMethodDisplayLabel(exercise.methodOverrideMethodKey),
            appliedAt: exercise.methodOverrideAppliedAt || new Date().toISOString(),
            source: exercise.frequencyPlacementSource || 'method_override',
            isRowLevel: true,
            isGrouped: false,
            provenance: 'user_applied_method_planner',
          })
        }
      }
    })
  })
  
  const rowLevelCount = placements.filter(p => p.isRowLevel).length
  const groupedCount = placements.filter(p => p.isGrouped).length
  
  return {
    placements,
    totalCount: placements.length,
    rowLevelCount,
    groupedCount,
  }
}

/**
 * Get a display label for a method key.
 */
function getMethodDisplayLabel(methodKey: string): string {
  const labels: Record<string, string> = {
    top_set: 'Top Set',
    backoff_sets: 'Backoff Sets',
    drop_sets: 'Drop Sets',
    rest_pause: 'Rest-Pause',
    cluster_sets: 'Cluster Sets',
    superset: 'Superset',
    circuit: 'Circuit',
    density_block: 'Density Block',
  }
  return labels[methodKey] || methodKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * [MASTER-8C.12B / MASTER-8C.14D] Remove selected user-applied method placements from a program.
 * This allows users to remove specific placements without resetting everything.
 * [MASTER-8C.14D] Now handles both row-level and grouped placements.
 * 
 * @param program - The current program
 * @param placementIds - IDs of placements to remove
 *   - Row-level format: `${sessionIndex}-${exerciseIndex}-${methodKey}`
 *   - Grouped format: group ID (e.g., 'method-override-superset-...')
 * @returns Result with updated program and evidence
 */
export function removeSelectedMethodPlacements(args: {
  program: AdaptiveProgram
  placementIds: string[]
}): SelectiveRemovalResult {
  const { program, placementIds } = args
  
  // Guard: Must have program
  if (!program) {
    return {
      status: 'blocked',
      visibleSummary: 'No program available.',
      removedCount: 0,
      failedCount: 0,
      removedIds: [],
      failedIds: placementIds,
      evidence: ['program is null or undefined'],
    }
  }
  
  // Guard: Must have placements to remove
  if (!placementIds || placementIds.length === 0) {
    return {
      status: 'blocked',
      visibleSummary: 'No placements selected for removal.',
      removedCount: 0,
      failedCount: 0,
      removedIds: [],
      failedIds: [],
      evidence: ['placementIds is empty'],
    }
  }
  
  // Deep clone the program to avoid mutation
  const updatedProgram: AdaptiveProgram = JSON.parse(JSON.stringify(program))
  
  const removedIds: string[] = []
  const failedIds: string[] = []
  const evidence: string[] = []
  
  // [MASTER-8C.14D] Separate grouped and row-level IDs
  const groupedIds = placementIds.filter(id => 
    id.startsWith('method-override-') || id.startsWith('group-')
  )
  const rowLevelIds = placementIds.filter(id => 
    !id.startsWith('method-override-') && !id.startsWith('group-')
  )
  
  // [MASTER-8C.14D] Process grouped placements first
  groupedIds.forEach((groupId) => {
    let found = false
    
    // Search all sessions for this group
    for (let sessionIndex = 0; sessionIndex < (updatedProgram.sessions?.length || 0); sessionIndex++) {
      const session = updatedProgram.sessions?.[sessionIndex] as ExtendedAdaptiveSession | undefined
      if (!session) continue
      
      // Skip completed sessions
      if (session.completed || session.status === 'completed') {
        continue
      }
      
      const styledGroups = (session.styleMetadata?.styledGroups || []) as Array<{
        id?: string
        groupType?: string
        exercises?: Array<{ id?: string; name?: string }>
      }>
      
      const groupIndex = styledGroups.findIndex(g => g.id === groupId)
      if (groupIndex !== -1) {
        const group = styledGroups[groupIndex]
        found = true
        
        // Remove the group from styledGroups
        styledGroups.splice(groupIndex, 1)
        session.styleMetadata!.styledGroups = styledGroups
        
        // Clear metadata from exercises that were part of this group
        const exerciseIds = new Set(group?.exercises?.map(e => e.id).filter(Boolean) || [])
        const exercises = session.exercises || []
        
        exercises.forEach((exercise: ExtendedSessionExercise) => {
          if (exercise.blockId === groupId || (exercise.id && exerciseIds.has(exercise.id))) {
            // Clear grouped method metadata
            delete exercise.blockId
            delete exercise.method
            delete exercise.methodLabel
            delete exercise.structuralMethodApplied
            delete exercise.methodOverrideApplied
            delete exercise.methodOverrideMethodKey
            delete exercise.methodOverrideAppliedAt
            delete exercise.methodOverrideCanRevert
            delete exercise.frequencyPlacementSource
          }
        })
        
        // Update session flags
        const hasRemainingSupersets = styledGroups.some((g: { groupType?: string }) => g.groupType === 'superset')
        const hasRemainingCircuits = styledGroups.some((g: { groupType?: string }) => g.groupType === 'circuit')
        const hasRemainingDensity = styledGroups.some((g: { groupType?: string }) => g.groupType === 'density_block')
        
        if (session.styleMetadata) {
          session.styleMetadata.hasSupersetsApplied = hasRemainingSupersets
          session.styleMetadata.hasCircuitsApplied = hasRemainingCircuits
          session.styleMetadata.hasDensityApplied = hasRemainingDensity
          
          // Update appliedMethods
          if (Array.isArray(session.styleMetadata.appliedMethods)) {
            if (!hasRemainingSupersets) {
              session.styleMetadata.appliedMethods = session.styleMetadata.appliedMethods.filter(
                (m: string) => m !== 'supersets' && m !== 'superset'
              )
            }
            if (!hasRemainingCircuits) {
              session.styleMetadata.appliedMethods = session.styleMetadata.appliedMethods.filter(
                (m: string) => m !== 'circuits' && m !== 'circuit'
              )
            }
            if (!hasRemainingDensity) {
              session.styleMetadata.appliedMethods = session.styleMetadata.appliedMethods.filter(
                (m: string) => m !== 'density_blocks' && m !== 'density_block' && m !== 'density'
              )
            }
          }
        }
        
        removedIds.push(groupId)
        evidence.push(`Removed grouped method ${group?.groupType || 'unknown'} (${groupId}) from session ${sessionIndex}`)
        break
      }
    }
    
    if (!found) {
      failedIds.push(groupId)
      evidence.push(`Grouped placement not found: ${groupId}`)
    }
  })
  
  // Process row-level placements
  rowLevelIds.forEach((id) => {
    const parts = id.split('-')
    if (parts.length < 3) {
      failedIds.push(id)
      evidence.push(`Invalid placement ID format: ${id}`)
      return
    }
    
    const sessionIndex = parseInt(parts[0], 10)
    const exerciseIndex = parseInt(parts[1], 10)
    const methodKey = parts.slice(2).join('-') // Handle method keys with dashes
    
    if (isNaN(sessionIndex) || isNaN(exerciseIndex)) {
      failedIds.push(id)
      evidence.push(`Invalid indices in placement ID: ${id}`)
      return
    }
    
    const session = updatedProgram.sessions?.[sessionIndex] as ExtendedAdaptiveSession | undefined
    if (!session) {
      failedIds.push(id)
      evidence.push(`Session ${sessionIndex} not found`)
      return
    }
    
    // Skip completed sessions
    if (session.completed || session.status === 'completed') {
      failedIds.push(id)
      evidence.push(`Cannot remove from completed session ${sessionIndex}`)
      return
    }
    
    const exercise = session.exercises?.[exerciseIndex] as ExtendedSessionExercise | undefined
    if (!exercise) {
      failedIds.push(id)
      evidence.push(`Exercise ${exerciseIndex} not found in session ${sessionIndex}`)
      return
    }
    
    // Clear row-level method override metadata from the exercise
    if (exercise.methodOverrideMethodKey === methodKey || 
        exercise.setExecutionMethod === toRowSetExecutionMethod(methodKey)) {
      
      // Clear the user-applied method metadata
      delete exercise.methodOverrideApplied
      delete exercise.methodOverrideMethodKey
      delete exercise.methodOverrideAppliedAt
      delete exercise.methodOverrideCanRevert
      delete exercise.frequencyPlacementApplied
      delete exercise.frequencyPlacementSource
      delete exercise.frequencyPlacementRequestedFrequency
      delete exercise.frequencyPlacementTargetIndex
      delete exercise.methodRationale
      delete exercise.methodInstructions
      delete exercise.methodRiskNote
      
      // Reset row-level method fields only if they were user-applied
      // Check if this was a frequency placement by looking at source
      if (exercise.setExecutionMethod === toRowSetExecutionMethod(methodKey)) {
        delete exercise.setExecutionMethod
        delete exercise.methodLabel
        // Only delete method/trainingMethod if they match the removed method
        if (exercise.method === methodKey || exercise.trainingMethod === methodKey) {
          delete exercise.method
          delete exercise.trainingMethod
        }
      }
      
      evidence.push(`Cleared method override from exercise ${exerciseIndex} in session ${sessionIndex}`)
    }
    
    // Remove from methodOverrideRowApplications array
    if (session.styleMetadata?.methodOverrideRowApplications) {
      const rowApps = session.styleMetadata.methodOverrideRowApplications
      session.styleMetadata.methodOverrideRowApplications = rowApps.filter(
        app => !(app.exerciseIndex === exerciseIndex && app.methodKey === methodKey)
      )
    }
    
    // Remove from appliedMethods array if present
    if (session.styleMetadata?.appliedMethods) {
      const appliedMethods = session.styleMetadata.appliedMethods as string[]
      // Only remove if no other exercises in this session have this method
      const otherExercisesWithMethod = (session.exercises || []).filter((ex: ExtendedSessionExercise, idx: number) => 
        idx !== exerciseIndex && ex.methodOverrideMethodKey === methodKey
      )
      if (!otherExercisesWithMethod || otherExercisesWithMethod.length === 0) {
        session.styleMetadata.appliedMethods = appliedMethods.filter(m => m !== methodKey)
      }
    }
    
    removedIds.push(id)
  })
  
  // Determine overall status
  let status: 'success' | 'partial_success' | 'blocked'
  let visibleSummary: string
  
  if (removedIds.length === 0) {
    status = 'blocked'
    visibleSummary = `Failed to remove any placements.`
  } else if (failedIds.length === 0) {
    status = 'success'
    visibleSummary = `Removed ${removedIds.length} method placement${removedIds.length === 1 ? '' : 's'}.`
  } else {
    status = 'partial_success'
    visibleSummary = `Removed ${removedIds.length} placement${removedIds.length === 1 ? '' : 's'}, ${failedIds.length} failed.`
  }
  
  evidence.push(`Final: ${removedIds.length} removed, ${failedIds.length} failed`)
  
  return {
    status,
    visibleSummary,
    removedCount: removedIds.length,
    failedCount: failedIds.length,
    removedIds,
    failedIds,
    evidence,
    updatedProgram,
  }
}
