/**
 * MASTER-8C.8 — Slot Eligibility Scoring + Frequency Selection Preview
 * 
 * This is a READ-ONLY planner that:
 * - Scores each method family against actual program sessions/exercise slots
 * - Computes safe preview-only frequency bounds per method
 * - Does NOT mutate the program or sessions
 * - Does NOT persist frequency selections
 * - Does NOT apply any method changes
 * 
 * Purpose: Provide slot eligibility information and frequency preview
 * before implementing actual multi-session method application.
 */

import type { CanonicalMethodFamily } from './method-structure-contract'
import {
  buildMethodContractSlotFrequencyInventory,
  getMethodContractItem,
  type MethodContractInventoryItem,
  type MethodSupportStatus,
} from './method-contract-slot-frequency-inventory'
import { isSyntheticConditioningFinisherPlaceholder } from './conditioning-finisher-artifact-contract'
// [MASTER-8C.10.2] Import occupancy ledger for capacity tracking
import {
  buildMethodSlotOccupancyLedger,
  buildCapacitySummary,
  buildMethodBlockedReason,
  countSessionsWithAvailableRowMethodSlots,
  type MethodSlotOccupancyLedger,
} from './method-slot-occupancy-ledger'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Slot eligibility status for a method
 */
export type MethodSlotEligibilityStatus =
  | 'eligible'
  | 'eligible_with_caution'
  | 'blocked_no_safe_slot'
  | 'blocked_contract_not_ready'
  | 'blocked_runtime_not_ready'
  | 'blocked_logging_not_ready'
  | 'blocked_finisher_not_materialized'
  | 'blocked_density_timed_logging_missing'
  | 'inventory_only'
  | 'not_applicable'

/**
 * Frequency preview status for a method
 */
export type MethodFrequencyPreviewStatus =
  | 'selectable_preview_only'
  | 'capped_by_slots'
  | 'capped_by_recovery'
  | 'capped_by_runtime'
  | 'blocked'
  | 'not_supported_yet'

/**
 * Slot kind classification
 */
export type SlotKind =
  | 'single_exercise_row'
  | 'grouped_rows'
  | 'timed_window'
  | 'finisher_window'
  | 'rest_or_rpe_modifier'

/**
 * Confidence level for slot eligibility
 */
export type SlotConfidence = 'high' | 'medium' | 'low'

/**
 * An eligible slot for a method
 */
export interface MethodEligibleSlot {
  readonly sessionId: string
  readonly sessionIndex: number
  readonly sessionLabel: string
  readonly dayTitle: string
  readonly slotKind: SlotKind
  readonly exerciseIds: readonly string[]
  readonly exerciseNames: readonly string[]
  readonly confidence: SlotConfidence
  readonly cautionReasons: readonly string[]
  readonly blockedReasons: readonly string[]
  readonly isAlreadyMethodOwned: boolean
  readonly isPrimarySkillSensitive: boolean
  readonly isWarmupOrCooldown: boolean
  readonly isSyntheticArtifact: boolean
  readonly isEligible: boolean
}

/**
 * Frequency preview for a single method
 */
export interface MethodFrequencyPreview {
  readonly canonicalKey: CanonicalMethodFamily
  readonly displayLabel: string
  readonly supportStatus: MethodSupportStatus
  readonly eligibilityStatus: MethodSlotEligibilityStatus
  readonly frequencyPreviewStatus: MethodFrequencyPreviewStatus
  readonly eligibleSlotCount: number
  readonly eligibleSessionCount: number
  // [MASTER-8C.10.2] Capacity tracking fields
  readonly totalTrainingRowCount: number
  readonly availableRowCount: number
  readonly occupiedByRowMethodCount: number
  readonly occupiedByGroupedMethodCount: number
  readonly sessionsWithAvailableSlots: number
  readonly capacitySummary: string
  readonly safeMinFrequency: number
  readonly safeDefaultFrequency: number
  readonly safeMaxFrequency: number
  readonly userSelectableNow: boolean
  readonly selectionPersists: false // Always false in MASTER-8C.8
  readonly mutationAllowedNow: false // Always false in MASTER-8C.8
  readonly previewOnly: true // Always true in MASTER-8C.8
  readonly blockedReason: string | null
  readonly cautionReasons: readonly string[]
  readonly eligibleSlots: readonly MethodEligibleSlot[]
  readonly proofLines: readonly string[]
  readonly safeNextStep: string
}

/**
 * Full slot eligibility and frequency plan
 */
export interface MethodSlotEligibilityFrequencyPlan {
  readonly version: 'MASTER-8C.8'
  readonly source: 'method_contract_inventory_plus_current_program'
  readonly mutationAllowedNow: false
  readonly frequencySelectionsPersist: false
  readonly programChanged: false
  readonly methods: readonly MethodFrequencyPreview[]
  readonly totalMethods: number
  readonly eligibleMethodCount: number
  readonly blockedMethodCount: number
  readonly previewSelectableMethodCount: number
  readonly mutationReadyMethodCount: 0 // Always 0 in MASTER-8C.8
  readonly safeNextStep: string
  readonly warnings: readonly string[]
  readonly proofLines: readonly string[]
}

// =============================================================================
// SLOT ELIGIBILITY HELPERS
// =============================================================================

/**
 * Minimal exercise shape for slot scoring
 */
interface MinimalExercise {
  id?: string
  name?: string
  category?: string
  type?: string
  isWarmup?: boolean
  isCooldown?: boolean
  isPrehab?: boolean
  isMobility?: boolean
  methodFamily?: string
  appliedMethod?: string
  styledGroupId?: string
  // [MASTER-8C.10.1] Additional row-level method fields
  setExecutionMethod?: string
  methodOverrideApplied?: boolean
  methodOverrideMethodKey?: string
  method?: string
  trainingMethod?: string
}

/**
 * Minimal session shape for slot scoring
 */
interface MinimalSession {
  id?: string
  dayNumber?: number
  title?: string
  exercises?: unknown[]
  styledGroups?: unknown[]
  methodStructures?: unknown[]
  // [MASTER-8C.10.1] Additional session-level method structures
  styleMetadata?: {
    styledGroups?: unknown[]
    appliedMethods?: unknown[]
    methodOverrideRowApplications?: unknown[]
  }
}

// =============================================================================
// [MASTER-8C.10.1] METHOD OWNERSHIP DETECTION
// =============================================================================

/**
 * Result of method ownership check
 */
interface MethodOwnershipResult {
  readonly owned: boolean
  readonly ownerMethodKey: string | null
  readonly ownerKind: 'row_level' | 'grouped_structure' | 'session_structure' | 'unknown' | null
  readonly reason: string
  readonly evidence: readonly string[]
}

/**
 * Session-level method occupancy tracking
 */
interface SessionMethodOccupancy {
  readonly sessionId: string
  readonly hasGroupedMethods: boolean
  readonly groupedMethodTypes: readonly string[]
  readonly groupedMemberExerciseIds: ReadonlySet<string>
  readonly groupedMemberExerciseNames: ReadonlySet<string>
  readonly rowLevelMethodExerciseIds: ReadonlySet<string>
  readonly evidence: readonly string[]
}

/**
 * Normalizes a method family key to a canonical form
 */
function normalizeMethodFamilyKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.toLowerCase().trim().replace(/[\s_-]+/g, '_')
  if (normalized.length === 0) return null
  return normalized
}

/**
 * Normalizes an exercise identity for comparison
 */
function normalizeExerciseIdentity(value: unknown): string {
  if (typeof value === 'string') {
    return value.toLowerCase().trim().replace(/[\s_-]+/g, '_')
  }
  return ''
}

/**
 * Collects method occupancy information from session-level structures
 */
function collectSessionMethodOccupancy(session: MinimalSession): SessionMethodOccupancy {
  const evidence: string[] = []
  const groupedMethodTypes: string[] = []
  const groupedMemberExerciseIds = new Set<string>()
  const groupedMemberExerciseNames = new Set<string>()
  const rowLevelMethodExerciseIds = new Set<string>()
  
  // Check session.styledGroups
  if (Array.isArray(session.styledGroups)) {
    for (const group of session.styledGroups) {
      if (group && typeof group === 'object') {
        const g = group as Record<string, unknown>
        const groupType = normalizeMethodFamilyKey(g.type) ?? normalizeMethodFamilyKey(g.methodFamily) ?? normalizeMethodFamilyKey(g.groupType)
        if (groupType) {
          groupedMethodTypes.push(groupType)
          evidence.push(`session.styledGroups contains ${groupType}`)
        }
        
        // Collect member exercise ids/names
        if (Array.isArray(g.exerciseIds)) {
          for (const id of g.exerciseIds) {
            if (typeof id === 'string') groupedMemberExerciseIds.add(id)
          }
        }
        if (Array.isArray(g.memberIds)) {
          for (const id of g.memberIds) {
            if (typeof id === 'string') groupedMemberExerciseIds.add(id)
          }
        }
        if (Array.isArray(g.exercises)) {
          for (const ex of g.exercises) {
            if (ex && typeof ex === 'object') {
              const exObj = ex as Record<string, unknown>
              if (typeof exObj.id === 'string') groupedMemberExerciseIds.add(exObj.id)
              if (typeof exObj.name === 'string') groupedMemberExerciseNames.add(normalizeExerciseIdentity(exObj.name))
            }
          }
        }
      }
    }
  }
  
  // Check session.methodStructures
  if (Array.isArray(session.methodStructures)) {
    for (const struct of session.methodStructures) {
      if (struct && typeof struct === 'object') {
        const s = struct as Record<string, unknown>
        const structType = normalizeMethodFamilyKey(s.type) ?? normalizeMethodFamilyKey(s.methodFamily) ?? normalizeMethodFamilyKey(s.methodKey)
        if (structType) {
          groupedMethodTypes.push(structType)
          evidence.push(`session.methodStructures contains ${structType}`)
        }
        
        // Collect member ids
        if (Array.isArray(s.memberIds)) {
          for (const id of s.memberIds) {
            if (typeof id === 'string') groupedMemberExerciseIds.add(id)
          }
        }
        if (Array.isArray(s.exerciseIds)) {
          for (const id of s.exerciseIds) {
            if (typeof id === 'string') groupedMemberExerciseIds.add(id)
          }
        }
      }
    }
  }
  
  // Check session.styleMetadata.styledGroups
  if (session.styleMetadata && Array.isArray(session.styleMetadata.styledGroups)) {
    for (const group of session.styleMetadata.styledGroups) {
      if (group && typeof group === 'object') {
        const g = group as Record<string, unknown>
        const groupType = normalizeMethodFamilyKey(g.type) ?? normalizeMethodFamilyKey(g.methodFamily)
        if (groupType) {
          groupedMethodTypes.push(groupType)
          evidence.push(`styleMetadata.styledGroups contains ${groupType}`)
        }
        
        if (Array.isArray(g.exerciseIds)) {
          for (const id of g.exerciseIds) {
            if (typeof id === 'string') groupedMemberExerciseIds.add(id)
          }
        }
        if (Array.isArray(g.memberIds)) {
          for (const id of g.memberIds) {
            if (typeof id === 'string') groupedMemberExerciseIds.add(id)
          }
        }
      }
    }
  }
  
  // Check exercises for row-level method ownership
  if (Array.isArray(session.exercises)) {
    for (const ex of session.exercises) {
      if (ex && typeof ex === 'object') {
        const e = ex as MinimalExercise
        const hasRowMethod = (
          (typeof e.setExecutionMethod === 'string' && e.setExecutionMethod.length > 0 && e.setExecutionMethod !== 'standard') ||
          e.methodOverrideApplied === true ||
          (typeof e.methodOverrideMethodKey === 'string' && e.methodOverrideMethodKey.length > 0)
        )
        if (hasRowMethod && typeof e.id === 'string') {
          rowLevelMethodExerciseIds.add(e.id)
          evidence.push(`exercise ${e.id} has row-level method`)
        }
      }
    }
  }
  
  return {
    sessionId: session.id ?? 'unknown',
    hasGroupedMethods: groupedMethodTypes.length > 0,
    groupedMethodTypes,
    groupedMemberExerciseIds,
    groupedMemberExerciseNames,
    rowLevelMethodExerciseIds,
    evidence,
  }
}

/**
 * Checks if an exercise is owned by a session-level method structure
 */
function isExerciseOwnedBySessionMethod(exercise: unknown, session: MinimalSession): MethodOwnershipResult {
  if (!exercise || typeof exercise !== 'object') {
    return { owned: false, ownerMethodKey: null, ownerKind: null, reason: 'invalid exercise', evidence: [] }
  }
  
  const ex = exercise as MinimalExercise
  const occupancy = collectSessionMethodOccupancy(session)
  const exerciseId = ex.id ?? ''
  const exerciseName = normalizeExerciseIdentity(ex.name)
  
  // Check if exercise is in a grouped method structure by ID
  if (exerciseId && occupancy.groupedMemberExerciseIds.has(exerciseId)) {
    return {
      owned: true,
      ownerMethodKey: occupancy.groupedMethodTypes[0] ?? 'grouped_method',
      ownerKind: 'grouped_structure',
      reason: `Exercise ${exerciseId} is member of grouped method`,
      evidence: [...occupancy.evidence],
    }
  }
  
  // Check if exercise is in a grouped method structure by normalized name
  if (exerciseName && occupancy.groupedMemberExerciseNames.has(exerciseName)) {
    return {
      owned: true,
      ownerMethodKey: occupancy.groupedMethodTypes[0] ?? 'grouped_method',
      ownerKind: 'grouped_structure',
      reason: `Exercise ${exerciseName} is member of grouped method by name`,
      evidence: [...occupancy.evidence],
    }
  }
  
  // Check if exercise has row-level method ownership
  if (exerciseId && occupancy.rowLevelMethodExerciseIds.has(exerciseId)) {
    return {
      owned: true,
      ownerMethodKey: (ex.methodOverrideMethodKey ?? ex.setExecutionMethod ?? 'row_method'),
      ownerKind: 'row_level',
      reason: `Exercise ${exerciseId} has row-level method applied`,
      evidence: [...occupancy.evidence],
    }
  }
  
  return { owned: false, ownerMethodKey: null, ownerKind: null, reason: '', evidence: [] }
}

/**
 * MASTER-8C.8.1: Determines if an exercise row is eligible for method slot scoring.
 * 
 * Excludes:
 * - Synthetic conditioning finisher placeholders
 * - Warmup/cooldown/prehab-only rows
 * - Empty/invalid rows
 * - Group header/container rows
 */
function isMethodSlotEligibleTrainingExercise(exercise: unknown): boolean {
  if (!exercise || typeof exercise !== 'object') return false
  
  const ex = exercise as MinimalExercise
  
  // Skip synthetic finisher placeholders
  if (isSyntheticConditioningFinisherPlaceholder(exercise)) {
    return false
  }
  
  // Must have at least an id or name
  const hasId = typeof ex.id === 'string' && ex.id.trim().length > 0
  const hasName = typeof ex.name === 'string' && ex.name.trim().length > 0
  
  if (!hasId && !hasName) {
    return false
  }
  
  // Skip warmup/cooldown/prehab-only rows for most methods
  if (ex.isWarmup === true || ex.isCooldown === true) {
    return false
  }
  
  // Skip generic group/container rows
  const nameStr = typeof ex.name === 'string' ? ex.name.toLowerCase().trim() : ''
  if (nameStr === 'circuit' || nameStr === 'group' || nameStr === 'superset' || nameStr === 'density block') {
    return false
  }
  
  return true
}

/**
 * [MASTER-8C.10.1] Enhanced check if an exercise is already owned by a method.
 * Now checks both exercise-level fields AND session-level grouped structures.
 */
function isExerciseAlreadyMethodOwned(exercise: unknown, session?: MinimalSession): boolean {
  if (!exercise || typeof exercise !== 'object') return false
  
  const ex = exercise as MinimalExercise
  
  // Has a styled group ID (part of circuit/superset/density)
  if (typeof ex.styledGroupId === 'string' && ex.styledGroupId.length > 0) {
    return true
  }
  
  // Has an applied method
  if (typeof ex.appliedMethod === 'string' && ex.appliedMethod.length > 0) {
    return true
  }
  
  if (typeof ex.methodFamily === 'string' && ex.methodFamily !== 'straight_sets') {
    return true
  }
  
  // [MASTER-8C.10.1] Check row-level method fields
  if (typeof ex.setExecutionMethod === 'string' && ex.setExecutionMethod.length > 0 && ex.setExecutionMethod !== 'standard') {
    return true
  }
  
  if (ex.methodOverrideApplied === true) {
    return true
  }
  
  if (typeof ex.methodOverrideMethodKey === 'string' && ex.methodOverrideMethodKey.length > 0) {
    return true
  }
  
  if (typeof ex.trainingMethod === 'string' && ex.trainingMethod.length > 0 && ex.trainingMethod !== 'straight_sets' && ex.trainingMethod !== 'standard') {
    return true
  }
  
  // [MASTER-8C.10.1] Check session-level grouped method ownership
  if (session) {
    const sessionOwnership = isExerciseOwnedBySessionMethod(exercise, session)
    if (sessionOwnership.owned) {
      return true
    }
  }
  
  return false
}

/**
 * Checks if an exercise is a primary skill row (sensitive to certain methods)
 */
function isPrimarySkillExercise(exercise: unknown): boolean {
  if (!exercise || typeof exercise !== 'object') return false
  
  const ex = exercise as MinimalExercise
  const category = typeof ex.category === 'string' ? ex.category.toLowerCase() : ''
  const type = typeof ex.type === 'string' ? ex.type.toLowerCase() : ''
  
  // Primary skill indicators
  if (category.includes('skill') || category.includes('hold') || category.includes('isometric')) {
    return true
  }
  if (type.includes('skill') || type.includes('hold') || type.includes('lever')) {
    return true
  }
  
  return false
}

// =============================================================================
// SLOT SCORING BY METHOD
// =============================================================================

/**
  * [MASTER-8C.10.4] Derives row-level eligible slots from the authoritative ledger.
  * This replaces stale local ownership helpers for row-level method eligibility.
  */
function deriveRowLevelSlotsFromLedger(
  ledger: MethodSlotOccupancyLedger,
  sessions: MinimalSession[],
  methodKey: CanonicalMethodFamily
): MethodEligibleSlot[] {
  const slots: MethodEligibleSlot[] = []
  const isHighFatigueMethod = ['drop_set', 'rest_pause'].includes(methodKey)
  
  for (const sessionLedger of ledger.sessions) {
    const sessionIndex = sessionLedger.sessionIndex
    const session = sessions[sessionIndex]
    if (!session) continue
    
    for (const slot of sessionLedger.slots) {
      // [MASTER-8C.10.4] Only accept slots the ledger says are truly available
      if (!slot.isTrainingRow) continue
      if (!slot.isAvailableForNewRowMethod) continue
      if (slot.isGroupedOwned) continue // Circuit/superset/density rows blocked
      if (slot.hasInvalidOverlap) continue // Invalid overlaps blocked
      if (slot.isWarmupOrCooldown) continue
      if (slot.isSyntheticArtifact) continue
      if (slot.isRowMethodOwned) continue // Already has a row method
      
      // For high-fatigue methods, skip primary skill exercises
      if (isHighFatigueMethod && slot.isPrimarySkill) continue
      
      const cautionReasons: string[] = []
      if (slot.isPrimarySkill && !isHighFatigueMethod) {
        cautionReasons.push('Primary skill exercise - use with caution')
      }
      
      slots.push({
        sessionId: slot.sessionId,
        sessionIndex,
        sessionLabel: `Day ${sessionLedger.dayNumber}`,
        dayTitle: session.title || `Day ${sessionLedger.dayNumber}`,
        slotKind: 'single_exercise_row',
        exerciseIds: slot.exerciseId ? [slot.exerciseId] : [],
        exerciseNames: slot.exerciseName ? [slot.exerciseName] : [],
        confidence: slot.isPrimarySkill ? 'medium' : 'high',
        cautionReasons,
        blockedReasons: [],
        isAlreadyMethodOwned: false,
        isPrimarySkillSensitive: slot.isPrimarySkill,
        isWarmupOrCooldown: false,
        isSyntheticArtifact: false,
        isEligible: true,
      })
    }
  }
  
  return slots
}

/**
  * [MASTER-8C.10.4] Derives circuit eligible slots from the authoritative ledger.
  * A circuit requires at least 3 available non-owned rows in a session.
  */
function deriveCircuitSlotsFromLedger(
  ledger: MethodSlotOccupancyLedger,
  sessions: MinimalSession[]
): MethodEligibleSlot[] {
  const slots: MethodEligibleSlot[] = []
  
  for (const sessionLedger of ledger.sessions) {
    const sessionIndex = sessionLedger.sessionIndex
    const session = sessions[sessionIndex]
    if (!session) continue
    
    // Find available non-owned rows in this session
    const availableRows = sessionLedger.slots.filter(slot => 
      slot.isTrainingRow &&
      slot.isAvailableForNewRowMethod &&
      !slot.isGroupedOwned &&
      !slot.hasInvalidOverlap &&
      !slot.isWarmupOrCooldown &&
      !slot.isSyntheticArtifact &&
      !slot.isRowMethodOwned
    )
    
    // Need at least 3 exercises for a circuit
    if (availableRows.length < 3) continue
    
    const circuitRows = availableRows.slice(0, 5) // Cap at 5 for circuit
    const hasPrimarySkill = circuitRows.some(r => r.isPrimarySkill)
    
    slots.push({
      sessionId: sessionLedger.sessionId,
      sessionIndex,
      sessionLabel: `Day ${sessionLedger.dayNumber}`,
      dayTitle: session.title || `Day ${sessionLedger.dayNumber}`,
      slotKind: 'grouped_rows',
      exerciseIds: circuitRows.map(r => r.exerciseId).filter(Boolean),
      exerciseNames: circuitRows.map(r => r.exerciseName).filter(Boolean),
      confidence: hasPrimarySkill ? 'medium' : 'high',
      cautionReasons: hasPrimarySkill ? ['Contains primary skill exercises'] : [],
      blockedReasons: [],
      isAlreadyMethodOwned: false,
      isPrimarySkillSensitive: hasPrimarySkill,
      isWarmupOrCooldown: false,
      isSyntheticArtifact: false,
      isEligible: true,
    })
  }
  
  return slots
}

/**
  * Scores a session for circuit eligibility
  * [MASTER-8C.10.4 DEPRECATED] Use deriveCircuitSlotsFromLedger instead
  */
function scoreSessionForCircuit(session: MinimalSession, sessionIndex: number): MethodEligibleSlot | null {
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  
  const eligibleExercises = exercises.filter(isMethodSlotEligibleTrainingExercise)
  // [MASTER-8C.10.1] Pass session context for grouped method ownership detection
  const nonOwnedExercises = eligibleExercises.filter(ex => !isExerciseAlreadyMethodOwned(ex, session))
  
  // Need at least 3 exercises for a circuit
  if (nonOwnedExercises.length < 3) {
    return null
  }
  
  const exerciseIds = nonOwnedExercises
    .slice(0, 5) // Cap at 5 for circuit
    .map(ex => (ex as MinimalExercise).id || '')
    .filter(Boolean)
  
  const exerciseNames = nonOwnedExercises
    .slice(0, 5)
    .map(ex => (ex as MinimalExercise).name || '')
    .filter(Boolean)
  
  const hasPrimarySkill = nonOwnedExercises.some(isPrimarySkillExercise)
  
  return {
    sessionId: session.id || `session-${sessionIndex}`,
    sessionIndex,
    sessionLabel: `Day ${session.dayNumber || sessionIndex + 1}`,
    dayTitle: session.title || `Day ${session.dayNumber || sessionIndex + 1}`,
    slotKind: 'grouped_rows',
    exerciseIds,
    exerciseNames,
    confidence: hasPrimarySkill ? 'medium' : 'high',
    cautionReasons: hasPrimarySkill ? ['Contains primary skill exercises'] : [],
    blockedReasons: [],
    isAlreadyMethodOwned: false,
    isPrimarySkillSensitive: hasPrimarySkill,
    isWarmupOrCooldown: false,
    isSyntheticArtifact: false,
    isEligible: true,
  }
}

/**
 * Scores a session for row-level method eligibility
 */
function scoreSessionForRowLevelMethod(
  session: MinimalSession, 
  sessionIndex: number,
  methodKey: CanonicalMethodFamily
): MethodEligibleSlot[] {
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  const slots: MethodEligibleSlot[] = []
  
  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i]
    
    if (!isMethodSlotEligibleTrainingExercise(exercise)) continue
    // [MASTER-8C.10.1] Pass session context for grouped method ownership detection
    if (isExerciseAlreadyMethodOwned(exercise, session)) continue
    
    const ex = exercise as MinimalExercise
    const isPrimary = isPrimarySkillExercise(exercise)
    
    // For high-fatigue methods, skip primary skill exercises
    const isHighFatigueMethod = ['drop_set', 'rest_pause'].includes(methodKey)
    if (isHighFatigueMethod && isPrimary) continue
    
    const cautionReasons: string[] = []
    if (isPrimary && !isHighFatigueMethod) {
      cautionReasons.push('Primary skill exercise - use with caution')
    }
    
    slots.push({
      sessionId: session.id || `session-${sessionIndex}`,
      sessionIndex,
      sessionLabel: `Day ${session.dayNumber || sessionIndex + 1}`,
      dayTitle: session.title || `Day ${session.dayNumber || sessionIndex + 1}`,
      slotKind: 'single_exercise_row',
      exerciseIds: ex.id ? [ex.id] : [],
      exerciseNames: ex.name ? [ex.name] : [],
      confidence: isPrimary ? 'medium' : 'high',
      cautionReasons,
      blockedReasons: [],
      isAlreadyMethodOwned: false,
      isPrimarySkillSensitive: isPrimary,
      isWarmupOrCooldown: false,
      isSyntheticArtifact: false,
      isEligible: true,
    })
  }
  
  return slots
}

// =============================================================================
// FREQUENCY PREVIEW BUILDER
// =============================================================================

/**
 * Builds frequency preview for a single method
 * [MASTER-8C.10.2] Now uses occupancy ledger for accurate capacity tracking
 */
function buildMethodFrequencyPreview(
  item: MethodContractInventoryItem,
  sessions: MinimalSession[],
  ledger: MethodSlotOccupancyLedger
): MethodFrequencyPreview {
  const proofLines: string[] = []
  const cautionReasons: string[] = []
  let eligibleSlots: MethodEligibleSlot[] = []
  let eligibilityStatus: MethodSlotEligibilityStatus = 'not_applicable'
  let frequencyPreviewStatus: MethodFrequencyPreviewStatus = 'not_supported_yet'
  let blockedReason: string | null = item.blockedReason
  let safeMinFrequency = 0
  let safeDefaultFrequency = 0
  let safeMaxFrequency = 0
  let userSelectableNow = false
  
  // [MASTER-8C.10.2] Get capacity from ledger
  const capacitySummary = buildCapacitySummary(ledger)
  const sessionsWithAvailableSlots = countSessionsWithAvailableRowMethodSlots(ledger)
  
  // Check contract readiness first
  if (item.currentSupportStatus === 'blocked_until_materialized_prescription') {
    eligibilityStatus = 'blocked_finisher_not_materialized'
    frequencyPreviewStatus = 'blocked'
    blockedReason = item.blockedReason || 'Needs real exercise prescription'
    proofLines.push('BLOCKED: No materialized prescription')
  } else if (item.currentSupportStatus === 'blocked_until_contract_ready') {
    eligibilityStatus = 'blocked_contract_not_ready'
    frequencyPreviewStatus = 'blocked'
    proofLines.push('BLOCKED: Contract not ready')
  } else if (item.loggingReadiness === 'timed_window_missing') {
    eligibilityStatus = 'blocked_density_timed_logging_missing'
    frequencyPreviewStatus = 'blocked'
    // [MASTER-8C.12.1E] Clearer messaging for Density Block
    blockedReason = 'Density Block needs timed/sequence runtime, logging, and save/reload support'
    proofLines.push('BLOCKED: Timed-window logging not implemented')
  } else if (item.currentSupportStatus === 'read_only_inventory') {
    eligibilityStatus = 'inventory_only'
    frequencyPreviewStatus = 'not_supported_yet'
    proofLines.push('Status: inventory only - not actionable')
  } else if (item.currentSupportStatus === 'preview_only') {
    eligibilityStatus = 'blocked_contract_not_ready'
    frequencyPreviewStatus = 'blocked'
    // [MASTER-8C.12.1E] Clearer messaging - distinguish between structural methods needing writer
    if (item.canonicalKey === 'superset') {
      // [MASTER-8C.13] Superset now has structural writer - this blocked reason is for row-level only
      blockedReason = 'Superset uses structural pair preview — see controls above'
    } else {
      blockedReason = item.blockedReason || 'Structural apply needed — not row-level frequency'
    }
    proofLines.push('Status: preview only - no save capability')
  } else {
    // Method is potentially eligible - score slots using authoritative ledger
    switch (item.methodCategory) {
      case 'grouped_structural': {
        if (item.canonicalKey === 'circuit') {
          // [MASTER-8C.10.4] Use ledger-based circuit slot derivation
          eligibleSlots = deriveCircuitSlotsFromLedger(ledger, sessions)
        }
        // Density blocks are blocked by timed logging (handled above)
        // Supersets are preview-only (handled above)
        break
      }
      case 'row_level': {
        if (item.canonicalKey !== 'straight_sets') {
          // [MASTER-8C.10.4] Use ledger-based row-level slot derivation
          eligibleSlots = deriveRowLevelSlotsFromLedger(ledger, sessions, item.canonicalKey)
        }
        break
      }
      case 'session_finisher': {
        // Finisher is blocked (handled above)
        break
      }
      case 'prescription_modifier': {
        // Not actionable as frequency method
        eligibilityStatus = 'inventory_only'
        proofLines.push('Prescription modifiers are not frequency-selectable')
        break
      }
    }
    
    // Determine eligibility status based on slots found
    if (eligibleSlots.length > 0) {
      const hasHighConfidence = eligibleSlots.some(s => s.confidence === 'high')
      const hasCautions = eligibleSlots.some(s => s.cautionReasons.length > 0)
      
      if (hasHighConfidence && !hasCautions) {
        eligibilityStatus = 'eligible'
      } else {
        eligibilityStatus = 'eligible_with_caution'
        if (hasCautions) {
          cautionReasons.push('Some slots contain primary skill exercises')
        }
      }
      
      // Calculate frequency bounds
      const eligibleSessionCount = new Set(eligibleSlots.map(s => s.sessionId)).size
      safeMaxFrequency = Math.min(eligibleSessionCount, sessions.length)
      safeDefaultFrequency = Math.min(Math.ceil(safeMaxFrequency / 2), 2)
      safeMinFrequency = 0
      
      // High-fatigue methods have lower caps
      if (['drop_set', 'rest_pause'].includes(item.canonicalKey)) {
        safeMaxFrequency = Math.min(safeMaxFrequency, Math.ceil(sessions.length / 2))
        safeDefaultFrequency = Math.min(safeDefaultFrequency, 1)
      }
      
      frequencyPreviewStatus = 'selectable_preview_only'
      userSelectableNow = true
      proofLines.push(`Eligible slots: ${eligibleSlots.length}`)
      proofLines.push(`Eligible sessions: ${eligibleSessionCount}/${sessions.length}`)
      proofLines.push(`Safe frequency range: ${safeMinFrequency}-${safeMaxFrequency}x/week`)
    } else if (eligibilityStatus !== 'inventory_only') {
      eligibilityStatus = 'blocked_no_safe_slot'
      frequencyPreviewStatus = 'blocked'
      // [MASTER-8C.10.2] Use ledger for detailed blocked reason
      blockedReason = buildMethodBlockedReason(ledger, item.canonicalKey)
      proofLines.push('No eligible slots found')
      proofLines.push(capacitySummary)
    }
  }
  
  // Straight sets is special - always available but not selectable
  if (item.canonicalKey === 'straight_sets') {
    eligibilityStatus = 'not_applicable'
    frequencyPreviewStatus = 'not_supported_yet'
    userSelectableNow = false
    proofLines.push('Straight sets is the default method')
  }
  
  const eligibleSessionCount = new Set(eligibleSlots.map(s => s.sessionId)).size
  
  return {
    canonicalKey: item.canonicalKey,
    displayLabel: item.displayLabel,
    supportStatus: item.currentSupportStatus,
    eligibilityStatus,
    frequencyPreviewStatus,
    eligibleSlotCount: eligibleSlots.length,
    eligibleSessionCount,
    // [MASTER-8C.10.2] Capacity tracking fields
    totalTrainingRowCount: ledger.totalTrainingRowCount,
    availableRowCount: ledger.totalAvailableForRowMethodCount,
    occupiedByRowMethodCount: ledger.totalOccupiedByRowMethodCount,
    occupiedByGroupedMethodCount: ledger.totalOccupiedByGroupedMethodCount,
    sessionsWithAvailableSlots,
    capacitySummary,
    safeMinFrequency,
    safeDefaultFrequency,
    safeMaxFrequency,
    userSelectableNow,
    selectionPersists: false,
    mutationAllowedNow: false,
    previewOnly: true,
    blockedReason,
    cautionReasons,
    eligibleSlots,
    proofLines,
    safeNextStep: item.safeNextStep,
  }
}

// =============================================================================
// MAIN PLANNER FUNCTION
// =============================================================================

/**
 * Builds the complete slot eligibility and frequency preview plan.
 * 
 * This is READ-ONLY:
 * - Does NOT mutate the program
 * - Does NOT persist any selections
 * - Does NOT apply any methods
 * 
 * @param program - The current program object (read-only)
 */
export function buildMethodSlotEligibilityFrequencyPlan(
  program: unknown
): MethodSlotEligibilityFrequencyPlan {
  const inventory = buildMethodContractSlotFrequencyInventory()
  
  // Extract sessions from program safely
  let sessions: MinimalSession[] = []
  if (program && typeof program === 'object') {
    const p = program as Record<string, unknown>
    if (Array.isArray(p.sessions)) {
      sessions = p.sessions as MinimalSession[]
    }
  }
  
  // [MASTER-8C.10.2] Build occupancy ledger for capacity tracking
  const ledger = buildMethodSlotOccupancyLedger(program)
  
  // Build frequency preview for each method
  const methods: MethodFrequencyPreview[] = []
  for (const item of inventory.items) {
    const preview = buildMethodFrequencyPreview(item, sessions, ledger)
    methods.push(preview)
  }
  
  // Calculate counts
  const eligibleMethodCount = methods.filter(m => 
    m.eligibilityStatus === 'eligible' || m.eligibilityStatus === 'eligible_with_caution'
  ).length
  
  const blockedMethodCount = methods.filter(m =>
    m.eligibilityStatus.startsWith('blocked_') || m.frequencyPreviewStatus === 'blocked'
  ).length
  
  const previewSelectableMethodCount = methods.filter(m => m.userSelectableNow).length
  
  // Build warnings
  const warnings: string[] = []
  if (inventory.densityWarning) warnings.push(inventory.densityWarning)
  if (inventory.finisherWarning) warnings.push(inventory.finisherWarning)
  
  const blockedMethods = methods.filter(m => m.blockedReason)
  for (const m of blockedMethods) {
    if (m.blockedReason && !warnings.includes(m.blockedReason)) {
      warnings.push(`${m.displayLabel}: ${m.blockedReason}`)
    }
  }
  
  // Build proof lines
  const proofLines: string[] = [
    `MASTER-8C.8 Slot Eligibility & Frequency Preview`,
    `Read-only: no program changes applied`,
    `Mutation allowed: NO`,
    `Selections persist: NO`,
    `Program changed: NO`,
    `Sessions analyzed: ${sessions.length}`,
    `Methods scored: ${methods.length}`,
    `Eligible methods: ${eligibleMethodCount}`,
    `Blocked methods: ${blockedMethodCount}`,
    `Preview-selectable: ${previewSelectableMethodCount}`,
  ]
  
  return {
    version: 'MASTER-8C.8',
    source: 'method_contract_inventory_plus_current_program',
    mutationAllowedNow: false,
    frequencySelectionsPersist: false,
    programChanged: false,
    methods,
    totalMethods: methods.length,
    eligibleMethodCount,
    blockedMethodCount,
    previewSelectableMethodCount,
    mutationReadyMethodCount: 0,
    safeNextStep: 'MASTER-8C.9: Implement frequency-to-slot planning preview',
    warnings,
    proofLines,
  }
}

/**
 * Gets frequency preview for a specific method
 */
export function getMethodFrequencyPreview(
  program: unknown,
  canonicalKey: CanonicalMethodFamily
): MethodFrequencyPreview | null {
  const plan = buildMethodSlotEligibilityFrequencyPlan(program)
  return plan.methods.find(m => m.canonicalKey === canonicalKey) ?? null
}

// =============================================================================
// [MASTER-8C.13] SUPERSET STRUCTURAL CANDIDATE SCANNER
// =============================================================================

/**
 * Superset candidate status
 */
export type SupersetCandidateStatus =
  | 'safe_apply'
  | 'caution_apply_requires_confirmation'
  | 'blocked_no_safe_pair'
  | 'blocked_existing_group_conflict'
  | 'blocked_primary_skill_risk'
  | 'blocked_same_pattern_risk'
  | 'blocked_missing_prescription'
  | 'blocked_set_count_mismatch'

/**
 * A single superset pair candidate
 */
export interface SupersetCandidate {
  readonly id: string
  readonly dayIndex: number
  readonly dayNumber: number
  readonly sessionId: string
  readonly sessionLabel: string
  readonly exerciseA: {
    readonly id: string
    readonly name: string
    readonly index: number
    readonly setCount: number | null
    readonly isSkillSensitive: boolean
    readonly existingMethod: string | null
  }
  readonly exerciseB: {
    readonly id: string
    readonly name: string
    readonly index: number
    readonly setCount: number | null
    readonly isSkillSensitive: boolean
    readonly existingMethod: string | null
  }
  readonly orderedDayRows: readonly {
    readonly exerciseId: string
    readonly exerciseName: string
    readonly position: number
    readonly isPartOfPair: boolean
    readonly existingMethod: string | null
  }[]
  readonly status: SupersetCandidateStatus
  readonly confidence: SlotConfidence
  readonly pairRationale: string
  readonly riskReasons: readonly string[]
  readonly compatibilityReasons: readonly string[]
  readonly pairedRounds: number | null
  readonly restProtocol: string
  readonly insertionSummary: string
  readonly workoutEffectSummary: string
  readonly source: 'method_override_planner'
  readonly targetGroupType: 'superset'
}

/**
 * Superset structural preview result
 */
export interface SupersetStructuralPreview {
  readonly status: 'has_candidates' | 'no_candidates' | 'all_blocked'
  readonly candidates: readonly SupersetCandidate[]
  readonly safeCandidateCount: number
  readonly cautionCandidateCount: number
  readonly blockedCandidateCount: number
  readonly summary: string
  readonly proofLines: readonly string[]
}

/**
 * Superset apply result
 */
export interface SupersetApplyResult {
  readonly status: 'success' | 'blocked' | 'already_applied' | 'error'
  readonly visibleSummary: string
  readonly appliedCount: number
  readonly blockedReasons: readonly string[]
  readonly targetedDays: readonly number[]
  readonly targetedExercises: readonly string[]
  readonly evidence: readonly string[]
  readonly programChanged: boolean
  readonly persistRequired: boolean
  readonly updatedProgram: unknown | null
}

// Minimal session/exercise shape for scanning
interface MinimalExerciseForSuperset {
  id?: string
  name?: string
  exerciseName?: string
  sets?: number | string
  setCount?: number
  method?: string
  methodLabel?: string
  blockId?: string
  structuralMethodApplied?: boolean
  methodOverrideApplied?: boolean
  category?: string
  movementType?: string
  isWarmUp?: boolean
  isCoolDown?: boolean
  isPrimarySkill?: boolean
  tendonSensitive?: boolean
}

interface MinimalSessionForSuperset {
  id?: string
  dayNumber?: number
  sessionFocus?: string
  name?: string
  label?: string
  exercises?: MinimalExerciseForSuperset[]
  styleMetadata?: {
    styledGroups?: Array<{
      id?: string
      groupType?: string
      exercises?: Array<{ id?: string; name?: string }>
    }>
    hasSupersetsApplied?: boolean
  }
}

/**
 * [MASTER-8C.13] Build superset structural candidates from program
 */
export function buildSupersetStructuralCandidates(
  program: unknown
): SupersetStructuralPreview {
  const proofLines: string[] = [
    '[MASTER-8C.13] Superset Structural Candidate Scanner',
    'Mutation: NO — preview only',
  ]
  
  const prog = program as { sessions?: MinimalSessionForSuperset[] } | null
  const sessions = prog?.sessions ?? []
  
  if (sessions.length === 0) {
    return {
      status: 'no_candidates',
      candidates: [],
      safeCandidateCount: 0,
      cautionCandidateCount: 0,
      blockedCandidateCount: 0,
      summary: 'No sessions available for superset pairing.',
      proofLines: [...proofLines, 'No sessions found'],
    }
  }
  
  const candidates: SupersetCandidate[] = []
  
  for (let dayIndex = 0; dayIndex < sessions.length; dayIndex++) {
    const session = sessions[dayIndex]
    if (!session) continue
    
    const exercises = session.exercises ?? []
    if (exercises.length < 2) continue
    
    const dayNumber = session.dayNumber ?? dayIndex + 1
    const sessionLabel = session.sessionFocus ?? session.name ?? session.label ?? `Day ${dayNumber}`
    const sessionId = session.id ?? `session-${dayIndex}`
    
    // Check if session already has a superset
    const existingGroups = session.styleMetadata?.styledGroups ?? []
    const hasExistingSuperset = existingGroups.some(g => g.groupType === 'superset')
    
    // Build ordered day rows for context
    const orderedDayRows = exercises.map((ex, idx) => ({
      exerciseId: ex.id ?? `ex-${idx}`,
      exerciseName: ex.name ?? ex.exerciseName ?? 'Unknown',
      position: idx + 1,
      isPartOfPair: false,
      existingMethod: ex.method ?? ex.methodLabel ?? null,
    }))
    
    // Find eligible exercise pairs (late-position, non-skill, non-grouped)
    const eligibleExercises = exercises.map((ex, idx) => ({
      ex,
      idx,
      id: ex.id ?? `ex-${idx}`,
      name: ex.name ?? ex.exerciseName ?? 'Unknown',
      setCount: typeof ex.sets === 'number' ? ex.sets : (typeof ex.setCount === 'number' ? ex.setCount : null),
      isSkillSensitive: ex.isPrimarySkill === true || ex.category === 'skill',
      isWarmupCooldown: ex.isWarmUp === true || ex.isCoolDown === true,
      isTendonSensitive: ex.tendonSensitive === true,
      hasExistingGroup: !!ex.blockId || ex.structuralMethodApplied === true,
      existingMethod: ex.method ?? ex.methodLabel ?? null,
      movementType: ex.movementType ?? ex.category ?? 'unknown',
    }))
    
    // Filter to late-position accessory/support exercises
    const latePositionStart = Math.max(2, Math.floor(exercises.length / 2))
    const pairableExercises = eligibleExercises.filter((e, idx) => 
      idx >= latePositionStart &&
      !e.isWarmupCooldown &&
      !e.hasExistingGroup &&
      !e.isSkillSensitive
    )
    
    // Try to find one safe pair per session
    if (pairableExercises.length >= 2) {
      // Pick first two that have compatible set counts
      let bestPair: [typeof pairableExercises[0], typeof pairableExercises[0]] | null = null
      let pairStatus: SupersetCandidateStatus = 'blocked_no_safe_pair'
      let pairRationale = ''
      let riskReasons: string[] = []
      let compatibilityReasons: string[] = []
      let pairedRounds: number | null = null
      
      for (let i = 0; i < pairableExercises.length - 1; i++) {
        for (let j = i + 1; j < pairableExercises.length; j++) {
          const a = pairableExercises[i]!
          const b = pairableExercises[j]!
          
          // Reset for this pair evaluation
          riskReasons = []
          compatibilityReasons = []
          pairStatus = 'safe_apply'
          
          // Check set count compatibility
          if (a.setCount !== null && b.setCount !== null) {
            if (a.setCount === b.setCount) {
              pairedRounds = a.setCount
              compatibilityReasons.push(`Matched set count: ${pairedRounds}`)
            } else {
              pairStatus = 'blocked_set_count_mismatch'
              riskReasons.push(`Set count mismatch: ${a.setCount} vs ${b.setCount}`)
              continue // Skip this pair
            }
          } else {
            // Default to 3 rounds if unknown
            pairedRounds = 3
            compatibilityReasons.push('Default paired rounds: 3')
          }
          
          // Check for same movement pattern (redundant pairing)
          if (a.movementType === b.movementType && a.movementType !== 'unknown') {
            pairStatus = 'caution_apply_requires_confirmation'
            riskReasons.push(`Same movement type: ${a.movementType}`)
          }
          
          // Check for tendon sensitivity
          if (a.isTendonSensitive && b.isTendonSensitive) {
            pairStatus = 'blocked_same_pattern_risk'
            riskReasons.push('Both exercises are tendon-sensitive')
            continue
          }
          
          // Check for existing structural group conflict
          if (hasExistingSuperset) {
            pairStatus = 'blocked_existing_group_conflict'
            riskReasons.push('Session already has a superset')
          }
          
          // If we found a safe or caution pair, use it
          if (pairStatus === 'safe_apply' || pairStatus === 'caution_apply_requires_confirmation') {
            bestPair = [a, b]
            pairRationale = buildPairRationale(a, b)
            compatibilityReasons.push('Non-conflicting movement patterns')
            compatibilityReasons.push('Late-position accessory work')
            break
          }
        }
        if (bestPair) break
      }
      
      if (bestPair) {
        const [a, b] = bestPair
        const insertionSummary = `Superset A1/A2 at positions ${a.idx + 1} and ${b.idx + 1}`
        const workoutEffectSummary = pairedRounds !== null
          ? `${pairedRounds} paired rounds with minimal rest between, full rest after pair.`
          : 'Paired rounds with minimal rest between, full rest after pair.'
        
        // Update orderedDayRows to mark paired exercises
        const updatedRows = orderedDayRows.map(row => ({
          ...row,
          isPartOfPair: row.exerciseId === a.id || row.exerciseId === b.id,
        }))
        
        candidates.push({
          id: `superset-candidate-${dayIndex}-${a.idx}-${b.idx}`,
          dayIndex,
          dayNumber,
          sessionId,
          sessionLabel,
          exerciseA: {
            id: a.id,
            name: a.name,
            index: a.idx,
            setCount: a.setCount,
            isSkillSensitive: a.isSkillSensitive,
            existingMethod: a.existingMethod,
          },
          exerciseB: {
            id: b.id,
            name: b.name,
            index: b.idx,
            setCount: b.setCount,
            isSkillSensitive: b.isSkillSensitive,
            existingMethod: b.existingMethod,
          },
          orderedDayRows: updatedRows,
          status: pairStatus,
          confidence: pairStatus === 'safe_apply' ? 'high' : 'medium',
          pairRationale,
          riskReasons,
          compatibilityReasons,
          pairedRounds,
          restProtocol: '0-15s between exercises, 90-120s after pair',
          insertionSummary,
          workoutEffectSummary,
          source: 'method_override_planner',
          targetGroupType: 'superset',
        })
      }
    }
  }
  
  const safeCandidateCount = candidates.filter(c => c.status === 'safe_apply').length
  const cautionCandidateCount = candidates.filter(c => c.status === 'caution_apply_requires_confirmation').length
  const blockedCandidateCount = candidates.filter(c => 
    c.status !== 'safe_apply' && c.status !== 'caution_apply_requires_confirmation'
  ).length
  
  proofLines.push(`Sessions scanned: ${sessions.length}`)
  proofLines.push(`Candidates found: ${candidates.length}`)
  proofLines.push(`Safe: ${safeCandidateCount}, Caution: ${cautionCandidateCount}, Blocked: ${blockedCandidateCount}`)
  
  const status = candidates.length === 0 
    ? 'no_candidates'
    : safeCandidateCount + cautionCandidateCount > 0 
      ? 'has_candidates' 
      : 'all_blocked'
  
  const summary = status === 'no_candidates'
    ? 'No eligible superset pairs found in program.'
    : status === 'all_blocked'
      ? 'All potential superset pairs are blocked by safety gates.'
      : `${safeCandidateCount + cautionCandidateCount} superset pair${safeCandidateCount + cautionCandidateCount > 1 ? 's' : ''} available for apply.`
  
  return {
    status,
    candidates,
    safeCandidateCount,
    cautionCandidateCount,
    blockedCandidateCount,
    summary,
    proofLines,
  }
}

function buildPairRationale(
  a: { name: string; movementType: string },
  b: { name: string; movementType: string }
): string {
  if (a.movementType !== b.movementType && a.movementType !== 'unknown' && b.movementType !== 'unknown') {
    return `Non-competing pair: ${a.movementType} + ${b.movementType}`
  }
  return `Safe accessory pair: ${a.name} + ${b.name}`
}

/**
 * [MASTER-8C.13] Apply a superset candidate to the program
 */
export function applySupersetStructuralCandidate(
  program: unknown,
  candidate: SupersetCandidate
): SupersetApplyResult {
  if (candidate.status !== 'safe_apply' && candidate.status !== 'caution_apply_requires_confirmation') {
    return {
      status: 'blocked',
      visibleSummary: `Cannot apply superset: ${candidate.riskReasons.join(', ')}`,
      appliedCount: 0,
      blockedReasons: candidate.riskReasons,
      targetedDays: [],
      targetedExercises: [],
      evidence: ['Candidate status is blocked'],
      programChanged: false,
      persistRequired: false,
      updatedProgram: null,
    }
  }
  
  // Deep clone the program
  const prog = JSON.parse(JSON.stringify(program)) as {
    sessions?: MinimalSessionForSuperset[]
  }
  
  const sessions = prog.sessions ?? []
  const targetSession = sessions[candidate.dayIndex]
  
  if (!targetSession) {
    return {
      status: 'error',
      visibleSummary: `Session at day index ${candidate.dayIndex} not found.`,
      appliedCount: 0,
      blockedReasons: ['Session not found'],
      targetedDays: [],
      targetedExercises: [],
      evidence: [],
      programChanged: false,
      persistRequired: false,
      updatedProgram: null,
    }
  }
  
  const exercises = targetSession.exercises ?? []
  const exerciseA = exercises[candidate.exerciseA.index]
  const exerciseB = exercises[candidate.exerciseB.index]
  
  if (!exerciseA || !exerciseB) {
    return {
      status: 'error',
      visibleSummary: 'Target exercises not found in session.',
      appliedCount: 0,
      blockedReasons: ['Exercises not found'],
      targetedDays: [],
      targetedExercises: [],
      evidence: [],
      programChanged: false,
      persistRequired: false,
      updatedProgram: null,
    }
  }
  
  // Generate block ID
  const blockId = `method-superset-day${candidate.dayNumber}-user-${Date.now()}`
  
  // Stamp exercises
  exerciseA.blockId = blockId
  exerciseA.method = 'superset'
  exerciseA.methodLabel = 'Superset'
  exerciseA.structuralMethodApplied = true
  exerciseA.methodOverrideApplied = true
  
  exerciseB.blockId = blockId
  exerciseB.method = 'superset'
  exerciseB.methodLabel = 'Superset'
  exerciseB.structuralMethodApplied = true
  exerciseB.methodOverrideApplied = true
  
  // Ensure styleMetadata exists
  if (!targetSession.styleMetadata) {
    targetSession.styleMetadata = { styledGroups: [] }
  }
  if (!Array.isArray(targetSession.styleMetadata.styledGroups)) {
    targetSession.styleMetadata.styledGroups = []
  }
  
  // Add styledGroups entry
  targetSession.styleMetadata.styledGroups.push({
    id: blockId,
    groupType: 'superset',
    exercises: [
      { 
        id: candidate.exerciseA.id, 
        name: candidate.exerciseA.name,
      },
      { 
        id: candidate.exerciseB.id, 
        name: candidate.exerciseB.name,
      },
    ],
  } as unknown as (typeof targetSession.styleMetadata.styledGroups)[0])
  
  targetSession.styleMetadata.hasSupersetsApplied = true
  
  return {
    status: 'success',
    visibleSummary: `Applied Superset to Day ${candidate.dayNumber}: ${candidate.exerciseA.name} + ${candidate.exerciseB.name}`,
    appliedCount: 1,
    blockedReasons: [],
    targetedDays: [candidate.dayNumber],
    targetedExercises: [candidate.exerciseA.name, candidate.exerciseB.name],
    evidence: [
      `Block ID: ${blockId}`,
      `Session: ${candidate.sessionLabel}`,
      `Paired rounds: ${candidate.pairedRounds ?? 'default'}`,
    ],
    programChanged: true,
    persistRequired: true,
    updatedProgram: prog,
  }
}
