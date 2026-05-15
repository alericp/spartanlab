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
 * Checks if an exercise is already owned by a method (in a styledGroup or has appliedMethod)
 */
function isExerciseAlreadyMethodOwned(exercise: unknown): boolean {
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
 * Scores a session for circuit eligibility
 * Requires 3-5 compatible real exercise rows
 */
function scoreSessionForCircuit(session: MinimalSession, sessionIndex: number): MethodEligibleSlot | null {
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  
  const eligibleExercises = exercises.filter(isMethodSlotEligibleTrainingExercise)
  const nonOwnedExercises = eligibleExercises.filter(ex => !isExerciseAlreadyMethodOwned(ex))
  
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
    if (isExerciseAlreadyMethodOwned(exercise)) continue
    
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
 */
function buildMethodFrequencyPreview(
  item: MethodContractInventoryItem,
  sessions: MinimalSession[]
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
    blockedReason = 'Timed-window logging model required'
    proofLines.push('BLOCKED: Timed-window logging not implemented')
  } else if (item.currentSupportStatus === 'read_only_inventory') {
    eligibilityStatus = 'inventory_only'
    frequencyPreviewStatus = 'not_supported_yet'
    proofLines.push('Status: inventory only - not actionable')
  } else if (item.currentSupportStatus === 'preview_only') {
    eligibilityStatus = 'blocked_contract_not_ready'
    frequencyPreviewStatus = 'blocked'
    blockedReason = item.blockedReason || 'Preview only - no structural writer'
    proofLines.push('Status: preview only - no save capability')
  } else {
    // Method is potentially eligible - score slots
    switch (item.methodCategory) {
      case 'grouped_structural': {
        if (item.canonicalKey === 'circuit') {
          for (let i = 0; i < sessions.length; i++) {
            const slot = scoreSessionForCircuit(sessions[i], i)
            if (slot) eligibleSlots.push(slot)
          }
        }
        // Density blocks are blocked by timed logging (handled above)
        // Supersets are preview-only (handled above)
        break
      }
      case 'row_level': {
        if (item.canonicalKey !== 'straight_sets') {
          for (let i = 0; i < sessions.length; i++) {
            const slots = scoreSessionForRowLevelMethod(sessions[i], i, item.canonicalKey)
            eligibleSlots.push(...slots)
          }
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
      blockedReason = 'No safe slots found in current program'
      proofLines.push('No eligible slots found')
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
  
  // Build frequency preview for each method
  const methods: MethodFrequencyPreview[] = []
  for (const item of inventory.items) {
    const preview = buildMethodFrequencyPreview(item, sessions)
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
