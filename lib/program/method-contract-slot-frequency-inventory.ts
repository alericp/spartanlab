/**
 * MASTER-8C.7 — Method Contract / Slot Ownership / Frequency Foundation Inventory
 * 
 * This is a READ-ONLY inventory of all method families, their current support status,
 * writer support, slot ownership semantics, frequency readiness, and execution/logging readiness.
 * 
 * This file does NOT:
 * - Mutate programs or sessions
 * - Change Method Planner apply/reset behavior
 * - Enable frequency controls
 * - Modify workout structure
 * - Change exercise selection
 * 
 * Purpose: Provide a stable foundation before implementing requested frequency selection,
 * slot ownership scoring, and multi-session method placement.
 */

import type { CanonicalMethodFamily } from './method-structure-contract'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Method category classification
 */
export type MethodCategory =
  | 'grouped_structural'       // Creates grouped exercise blocks (circuits, supersets, density)
  | 'row_level'                // Applies to individual exercise rows
  | 'session_finisher'         // End-of-session conditioning window
  | 'prescription_modifier'    // Modifies rest/RPE prescription only
  | 'unknown'

/**
 * Current support status for a method family
 */
export type MethodSupportStatus =
  | 'active'                           // Fully supported with writer
  | 'active_partial'                   // Writer exists but some features missing
  | 'preview_only'                     // Preview supported, no save yet
  | 'read_only_inventory'              // Inventoried but not actionable
  | 'blocked_until_contract_ready'     // Needs slot/frequency contract first
  | 'blocked_until_materialized_prescription' // Needs real exercise prescription
  | 'unsupported'

/**
 * Writer support classification
 */
export type MethodWriterSupport =
  | 'structural_group_writer'  // Creates styledGroup structure
  | 'row_level_writer'         // Applies method metadata to exercise row
  | 'preview_only_writer'      // Can show preview but not persist
  | 'no_writer_yet'            // No writer implemented
  | 'artifact_guard_only'      // Only has placeholder detection

/**
 * Slot ownership model - how the method consumes program resources
 */
export type MethodSlotOwnership =
  | 'consumes_multiple_exercise_rows'       // Groups 2+ exercises
  | 'consumes_single_exercise_row'          // Applies to one exercise
  | 'consumes_timed_window'                 // Timed block (density)
  | 'consumes_end_of_session_finisher_window' // Session finisher slot
  | 'consumes_rest_or_rpe_modifier'         // Modifies prescription only
  | 'not_slot_owning_yet'

/**
 * Requested frequency support level
 */
export type RequestedFrequencySupport =
  | 'not_supported_yet'
  | 'inventory_only'
  | 'future_safe_planning_required'
  | 'ready_for_read_only_planning'
  | 'ready_for_mutation_later'

/**
 * Max frequency basis - what constrains max applications
 */
export type MaxFrequencyBasis =
  | 'actual_training_days'
  | 'eligible_sessions_only'
  | 'eligible_exercise_slots'
  | 'one_per_session'
  | 'not_applicable_yet'

/**
 * Execution readiness for live workout
 */
export type ExecutionReadiness =
  | 'program_page_visible'     // Shows in Program Page but not runtime
  | 'live_workout_supported'   // Full live workout support
  | 'live_workout_partial'     // Partial support (e.g., displays but no timer)
  | 'not_runtime_ready'
  | 'needs_timed_logging_model'
  | 'needs_real_finisher_prescription'

/**
 * Logging readiness
 */
export type LoggingReadiness =
  | 'standard_sets_supported'
  | 'grouped_block_supported'
  | 'timed_window_missing'
  | 'finisher_logging_missing'
  | 'not_applicable'

/**
 * Single method family inventory item
 */
export interface MethodContractInventoryItem {
  readonly canonicalKey: CanonicalMethodFamily
  readonly displayLabel: string
  readonly methodCategory: MethodCategory
  readonly currentSupportStatus: MethodSupportStatus
  readonly writerSupport: MethodWriterSupport
  readonly slotOwnershipModel: MethodSlotOwnership
  readonly requestedFrequencySupport: RequestedFrequencySupport
  readonly maxFrequencyBasis: MaxFrequencyBasis
  readonly executionReadiness: ExecutionReadiness
  readonly loggingReadiness: LoggingReadiness
  readonly programBalanceDependency: 'none' | 'should_consume' | 'must_consume_before_mutation'
  readonly generatorKnowledgeDependency: 'none' | 'should_consume' | 'must_consume_before_mutation'
  readonly mutationAllowedNow: false // Always false in MASTER-8C.7
  readonly safeNextStep: string
  readonly blockedReason: string | null
  readonly proofLines: readonly string[]
}

/**
 * Program-level method contract inventory rollup
 */
export interface MethodContractInventoryRollup {
  readonly version: 'MASTER-8C.7'
  readonly totalMethodsInventoried: number
  readonly activeCount: number
  readonly activePartialCount: number
  readonly previewOnlyCount: number
  readonly blockedCount: number
  readonly mutationReadyCount: 0 // Always 0 in MASTER-8C.7
  readonly frequencyControlsEnabled: false // Always false in MASTER-8C.7
  readonly slotOwnershipInventoryReady: true
  readonly items: readonly MethodContractInventoryItem[]
  readonly densityWarning: string | null
  readonly finisherWarning: string | null
  readonly proofLines: readonly string[]
  readonly safeNextStep: string
}

// =============================================================================
// INVENTORY DATA
// =============================================================================

/**
 * Static method contract inventory
 * 
 * This is derived from current code analysis:
 * - METHOD_CAPABILITIES in requested-method-override-planner.ts
 * - CanonicalMethodFamily in method-structure-contract.ts
 * - Current writer implementations
 */
const METHOD_CONTRACT_INVENTORY: readonly MethodContractInventoryItem[] = [
  // ==========================================================================
  // GROUPED STRUCTURAL METHODS
  // ==========================================================================
  {
    canonicalKey: 'circuit',
    displayLabel: 'Circuits',
    methodCategory: 'grouped_structural',
    currentSupportStatus: 'active',
    writerSupport: 'structural_group_writer',
    slotOwnershipModel: 'consumes_multiple_exercise_rows',
    requestedFrequencySupport: 'inventory_only',
    maxFrequencyBasis: 'eligible_sessions_only',
    executionReadiness: 'live_workout_supported',
    loggingReadiness: 'grouped_block_supported',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'none',
    mutationAllowedNow: false,
    safeNextStep: 'Add frequency selection UI after slot ownership scoring',
    blockedReason: null,
    proofLines: [
      'Writer: grouped_circuit styledGroup',
      'Applies to: 3-5 compatible exercise rows',
      'Live workout: rounds/rotation display supported',
      'Logging: grouped block logging supported',
    ],
  },
  {
    canonicalKey: 'superset',
    displayLabel: 'Supersets',
    methodCategory: 'grouped_structural',
    currentSupportStatus: 'preview_only',
    writerSupport: 'preview_only_writer',
    slotOwnershipModel: 'consumes_multiple_exercise_rows',
    requestedFrequencySupport: 'not_supported_yet',
    maxFrequencyBasis: 'eligible_sessions_only',
    executionReadiness: 'program_page_visible',
    loggingReadiness: 'grouped_block_supported',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'none',
    mutationAllowedNow: false,
    safeNextStep: 'Implement superset structural writer',
    blockedReason: 'No superset structural writer implemented yet',
    proofLines: [
      'Writer: preview_only (no save)',
      'Applies to: 2 compatible exercise rows',
      'Live workout: not fully supported yet',
      'Needs: structural writer implementation',
    ],
  },
  {
    canonicalKey: 'density_block',
    displayLabel: 'Density Blocks',
    methodCategory: 'grouped_structural',
    currentSupportStatus: 'active_partial',
    writerSupport: 'structural_group_writer',
    slotOwnershipModel: 'consumes_timed_window',
    requestedFrequencySupport: 'inventory_only',
    maxFrequencyBasis: 'eligible_sessions_only',
    executionReadiness: 'live_workout_partial',
    loggingReadiness: 'timed_window_missing',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'none',
    mutationAllowedNow: false,
    safeNextStep: 'Add timed-window logging model before full execution support',
    blockedReason: 'Timed-cap execution and AMRAP/EMOM logging model not implemented',
    proofLines: [
      'Writer: grouped_density_block styledGroup',
      'Applies to: 3-5 exercise rows in timed block',
      'Live workout: displays but no timer/AMRAP tracking',
      'BLOCKED: Needs timed-window logging model',
    ],
  },

  // ==========================================================================
  // ROW-LEVEL METHODS
  // ==========================================================================
  {
    canonicalKey: 'top_set',
    displayLabel: 'Top Set',
    methodCategory: 'row_level',
    currentSupportStatus: 'active',
    writerSupport: 'row_level_writer',
    slotOwnershipModel: 'consumes_single_exercise_row',
    requestedFrequencySupport: 'inventory_only',
    maxFrequencyBasis: 'eligible_exercise_slots',
    executionReadiness: 'live_workout_supported',
    loggingReadiness: 'standard_sets_supported',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'none',
    mutationAllowedNow: false,
    safeNextStep: 'Add frequency selection after slot eligibility scoring',
    blockedReason: null,
    proofLines: [
      'Writer: row-level method metadata',
      'Applies to: single compound exercise row',
      'Live workout: standard set logging',
      'Compatible: heavy compound strength work',
    ],
  },
  {
    canonicalKey: 'backoff_sets',
    displayLabel: 'Backoff Sets',
    methodCategory: 'row_level',
    currentSupportStatus: 'active',
    writerSupport: 'row_level_writer',
    slotOwnershipModel: 'consumes_single_exercise_row',
    requestedFrequencySupport: 'inventory_only',
    maxFrequencyBasis: 'eligible_exercise_slots',
    executionReadiness: 'live_workout_supported',
    loggingReadiness: 'standard_sets_supported',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'none',
    mutationAllowedNow: false,
    safeNextStep: 'Add frequency selection after slot eligibility scoring',
    blockedReason: null,
    proofLines: [
      'Writer: row-level method metadata',
      'Applies to: single exercise row (pairs with top_set)',
      'Live workout: standard set logging',
      'Compatible: volume accumulation after heavy set',
    ],
  },
  {
    canonicalKey: 'drop_set',
    displayLabel: 'Drop Sets',
    methodCategory: 'row_level',
    currentSupportStatus: 'active',
    writerSupport: 'row_level_writer',
    slotOwnershipModel: 'consumes_single_exercise_row',
    requestedFrequencySupport: 'inventory_only',
    maxFrequencyBasis: 'eligible_exercise_slots',
    executionReadiness: 'live_workout_supported',
    loggingReadiness: 'standard_sets_supported',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'should_consume',
    mutationAllowedNow: false,
    safeNextStep: 'Add tendon-safety checks before frequency controls',
    blockedReason: null,
    proofLines: [
      'Writer: row-level method metadata',
      'Applies to: single accessory/hypertrophy row',
      'Live workout: standard set logging',
      'Caution: avoid on skill/tendon-sensitive exercises',
    ],
  },
  {
    canonicalKey: 'rest_pause',
    displayLabel: 'Rest-Pause',
    methodCategory: 'row_level',
    currentSupportStatus: 'active',
    writerSupport: 'row_level_writer',
    slotOwnershipModel: 'consumes_single_exercise_row',
    requestedFrequencySupport: 'inventory_only',
    maxFrequencyBasis: 'eligible_exercise_slots',
    executionReadiness: 'live_workout_supported',
    loggingReadiness: 'standard_sets_supported',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'should_consume',
    mutationAllowedNow: false,
    safeNextStep: 'Add fatigue-risk checks before frequency controls',
    blockedReason: null,
    proofLines: [
      'Writer: row-level method metadata',
      'Applies to: single accessory row',
      'Live workout: standard set logging',
      'Caution: high fatigue risk, avoid on skill work',
    ],
  },
  {
    canonicalKey: 'cluster',
    displayLabel: 'Cluster Sets',
    methodCategory: 'row_level',
    currentSupportStatus: 'active',
    writerSupport: 'row_level_writer',
    slotOwnershipModel: 'consumes_single_exercise_row',
    requestedFrequencySupport: 'inventory_only',
    maxFrequencyBasis: 'eligible_exercise_slots',
    executionReadiness: 'live_workout_supported',
    loggingReadiness: 'standard_sets_supported',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'should_consume',
    mutationAllowedNow: false,
    safeNextStep: 'Add frequency selection after slot eligibility scoring',
    blockedReason: null,
    proofLines: [
      'Writer: row-level method metadata',
      'Applies to: heavy compound or skill exercise',
      'Live workout: standard set logging',
      'Compatible: maintains quality on neural-demanding work',
    ],
  },

  // ==========================================================================
  // SESSION FINISHER METHODS
  // ==========================================================================
  {
    canonicalKey: 'endurance_density',
    displayLabel: 'Endurance/Conditioning',
    methodCategory: 'session_finisher',
    currentSupportStatus: 'blocked_until_materialized_prescription',
    writerSupport: 'artifact_guard_only',
    slotOwnershipModel: 'consumes_end_of_session_finisher_window',
    requestedFrequencySupport: 'not_supported_yet',
    maxFrequencyBasis: 'one_per_session',
    executionReadiness: 'needs_real_finisher_prescription',
    loggingReadiness: 'finisher_logging_missing',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'must_consume_before_mutation',
    mutationAllowedNow: false,
    safeNextStep: 'Implement real finisher exercise/modality prescription',
    blockedReason: 'Synthetic placeholder only — no real exercise prescription yet',
    proofLines: [
      'Writer: artifact_guard_only (placeholder detection)',
      'Current: synthetic "Conditioning Finisher" placeholder',
      'BLOCKED: No real modality/exercise selection',
      'BLOCKED: No work/rest format or time cap',
      'BLOCKED: No finisher-specific logging model',
    ],
  },

  // ==========================================================================
  // PRESCRIPTION MODIFIER METHODS
  // ==========================================================================
  {
    canonicalKey: 'prescription_rest',
    displayLabel: 'Rest Prescription',
    methodCategory: 'prescription_modifier',
    currentSupportStatus: 'read_only_inventory',
    writerSupport: 'no_writer_yet',
    slotOwnershipModel: 'consumes_rest_or_rpe_modifier',
    requestedFrequencySupport: 'not_supported_yet',
    maxFrequencyBasis: 'not_applicable_yet',
    executionReadiness: 'not_runtime_ready',
    loggingReadiness: 'not_applicable',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'none',
    mutationAllowedNow: false,
    safeNextStep: 'Define prescription modifier contract',
    blockedReason: 'Not implemented as actionable method yet',
    proofLines: [
      'Status: read-only inventory only',
      'Modifies: rest periods between sets',
      'No writer or UI support yet',
    ],
  },
  {
    canonicalKey: 'prescription_rpe',
    displayLabel: 'RPE Prescription',
    methodCategory: 'prescription_modifier',
    currentSupportStatus: 'read_only_inventory',
    writerSupport: 'no_writer_yet',
    slotOwnershipModel: 'consumes_rest_or_rpe_modifier',
    requestedFrequencySupport: 'not_supported_yet',
    maxFrequencyBasis: 'not_applicable_yet',
    executionReadiness: 'not_runtime_ready',
    loggingReadiness: 'not_applicable',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'none',
    mutationAllowedNow: false,
    safeNextStep: 'Define prescription modifier contract',
    blockedReason: 'Not implemented as actionable method yet',
    proofLines: [
      'Status: read-only inventory only',
      'Modifies: RPE/intensity targets',
      'No writer or UI support yet',
    ],
  },

  // ==========================================================================
  // STRAIGHT SETS (DEFAULT)
  // ==========================================================================
  {
    canonicalKey: 'straight_sets',
    displayLabel: 'Straight Sets',
    methodCategory: 'row_level',
    currentSupportStatus: 'active',
    writerSupport: 'row_level_writer',
    slotOwnershipModel: 'consumes_single_exercise_row',
    requestedFrequencySupport: 'not_supported_yet', // Default, no frequency selection needed
    maxFrequencyBasis: 'not_applicable_yet',
    executionReadiness: 'live_workout_supported',
    loggingReadiness: 'standard_sets_supported',
    programBalanceDependency: 'none',
    generatorKnowledgeDependency: 'none',
    mutationAllowedNow: false,
    safeNextStep: 'N/A - straight sets is default method',
    blockedReason: null,
    proofLines: [
      'Status: default method (always available)',
      'Writer: implicit (no special metadata needed)',
      'Live workout: full standard logging support',
    ],
  },
]

// =============================================================================
// ROLLUP BUILDER
// =============================================================================

/**
 * Builds the method contract inventory rollup.
 * 
 * This is a READ-ONLY function that inventories current method support.
 * It does NOT mutate the program or enable any new features.
 */
export function buildMethodContractSlotFrequencyInventory(): MethodContractInventoryRollup {
  const items = METHOD_CONTRACT_INVENTORY

  // Count by status
  let activeCount = 0
  let activePartialCount = 0
  let previewOnlyCount = 0
  let blockedCount = 0

  for (const item of items) {
    switch (item.currentSupportStatus) {
      case 'active':
        activeCount++
        break
      case 'active_partial':
        activePartialCount++
        break
      case 'preview_only':
        previewOnlyCount++
        break
      case 'blocked_until_contract_ready':
      case 'blocked_until_materialized_prescription':
      case 'unsupported':
        blockedCount++
        break
      case 'read_only_inventory':
        // Not counted as active or blocked
        break
    }
  }

  // Build warnings
  const densityItem = items.find(i => i.canonicalKey === 'density_block')
  const finisherItem = items.find(i => i.canonicalKey === 'endurance_density')

  const densityWarning = densityItem?.loggingReadiness === 'timed_window_missing'
    ? 'Density blocks need timed-window logging model before full execution support'
    : null

  const finisherWarning = finisherItem?.currentSupportStatus === 'blocked_until_materialized_prescription'
    ? 'Conditioning finisher needs real modality/exercise prescription before apply'
    : null

  // Build proof lines
  const proofLines: string[] = [
    `Method Contract Inventory v${METHOD_CONTRACT_INVENTORY.length} families`,
    `Read-only: no program changes applied`,
    `Mutation locked: 0 methods mutation-ready in MASTER-8C.7`,
    `Active: ${activeCount} methods with full writer support`,
    `Active partial: ${activePartialCount} methods with partial support`,
    `Preview only: ${previewOnlyCount} methods`,
    `Blocked/future: ${blockedCount} methods`,
    `Frequency controls: not enabled yet`,
    `Slot ownership: inventory complete`,
  ]

  if (densityWarning) proofLines.push(`Warning: ${densityWarning}`)
  if (finisherWarning) proofLines.push(`Warning: ${finisherWarning}`)

  return {
    version: 'MASTER-8C.7',
    totalMethodsInventoried: items.length,
    activeCount,
    activePartialCount,
    previewOnlyCount,
    blockedCount,
    mutationReadyCount: 0,
    frequencyControlsEnabled: false,
    slotOwnershipInventoryReady: true,
    items,
    densityWarning,
    finisherWarning,
    proofLines,
    safeNextStep: 'MASTER-8C.8: Implement slot eligibility scoring and frequency selection UI',
  }
}

/**
 * Gets a single method contract item by canonical key.
 */
export function getMethodContractItem(
  canonicalKey: CanonicalMethodFamily
): MethodContractInventoryItem | null {
  return METHOD_CONTRACT_INVENTORY.find(i => i.canonicalKey === canonicalKey) ?? null
}

/**
 * Returns true if the method has a real structural or row-level writer.
 */
export function hasMethodWriter(canonicalKey: CanonicalMethodFamily): boolean {
  const item = getMethodContractItem(canonicalKey)
  if (!item) return false
  return item.writerSupport === 'structural_group_writer' || 
         item.writerSupport === 'row_level_writer'
}

/**
 * Returns true if the method is safe for live workout execution.
 */
export function isMethodExecutionReady(canonicalKey: CanonicalMethodFamily): boolean {
  const item = getMethodContractItem(canonicalKey)
  if (!item) return false
  return item.executionReadiness === 'live_workout_supported'
}

/**
 * Returns true if the method has proper logging support.
 */
export function isMethodLoggingReady(canonicalKey: CanonicalMethodFamily): boolean {
  const item = getMethodContractItem(canonicalKey)
  if (!item) return false
  return item.loggingReadiness === 'standard_sets_supported' ||
         item.loggingReadiness === 'grouped_block_supported'
}
