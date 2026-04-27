/**
 * Unified Program State Utility
 * 
 * =============================================================================
 * REGRESSION GUARD: PROGRAM SNAPSHOT CONSISTENCY (OBJECTIVE 4)
 * =============================================================================
 * 
 * DO NOT DRIFT: This is the CANONICAL SOURCE OF TRUTH for program existence checks.
 * All routes MUST use getProgramState() instead of direct getLatestAdaptiveProgram() calls.
 * 
 * CRITICAL: This utility MUST NEVER throw. It always returns a safe object.
 * 
 * RULES:
 * - Generated program, stored snapshot, dashboard summary, and program page all
 *   read from ONE consistent stored program state via getProgramState()
 * - No partial snapshot writes allowed
 * - Regenerate fully replaces current program snapshot
 * - Summary cards derive from stored current program, not stale side-state
 * - If current program is stale relative to profile, mark stale explicitly
 * 
 * DO NOT:
 * - Bypass getProgramState() with direct localStorage reads
 * - Write partial program snapshots
 * - Let dashboard show different state than program page
 * 
 * MIGRATION: This module handles backward compatibility with old storage keys:
 * - spartanlab_first_program (old onboarding key) → migrated to canonical storage
 * - spartanlab_adaptive_programs (canonical key) → preferred source of truth
 */

import { getLatestAdaptiveProgram, saveAdaptiveProgram, type AdaptiveProgram, type GenerationErrorCode, type AdaptiveSession, type AdaptiveExercise } from './adaptive-program-builder'
import { getLatestProgram, type GeneratedProgram } from './program-service'
import { 
  assertProgramStateUsable, 
  markCanonicalPathUsed,
} from './production-safety'
import { EMPTY_SKILL_TRACE, getSafeSkillTrace } from './safe-access'
import {
  hasCanonicalProgramTruth,
  detectCanonicalProgramTruthDowngrade,
  assertCanonicalProgramTruthPreserved,
} from './program/program-display-contract'

// =============================================================================
// [BUILDER-TRUTH-PRESERVATION] Canonical Load-Time Grouped Truth Preservation
// =============================================================================
// CRITICAL DOCTRINE: The builder is the SINGLE AUTHORITATIVE SOURCE for grouped
// training method truth. Load-time normalization must PRESERVE builder truth,
// not rebuild it with potentially different/outdated eligibility rules.
//
// This was changed from destructive reconciliation to preservation because:
// 1. The builder may use DIFFERENT (richer) eligibility rules than load-time
// 2. Re-running eligibility at load-time creates version skew
// 3. Users expect their generated program to stay consistent after save/reload
// 4. Any eligibility changes should require explicit program regeneration
//
// ALLOWED: Null-safety defaults, structural validation
// NOT ALLOWED: Re-deciding method eligibility, rebuilding styledGroups from scratch
// =============================================================================

/**
 * PRESERVE session grouped contract from builder (NOT rebuild it).
 * This function validates structural integrity and adds safe defaults,
 * but does NOT re-evaluate eligibility or rebuild grouped truth.
 * 
 * The builder's styleMetadata/styledGroups/appliedMethods are AUTHORITATIVE.
 * Load-time normalization must not act as a shadow builder.
 */
function preserveSessionGroupedContract(session: AdaptiveSession): AdaptiveSession {
  if (!session || !Array.isArray(session.exercises)) return session
  
  // ==========================================================================
  // [FUNNEL-RULE] BUILDER TRUTH IS AUTHORITATIVE - PRESERVE, DON'T REBUILD
  // ==========================================================================
  // If the builder computed grouped truth (styleMetadata exists), preserve it.
  // Only add safe defaults for missing structural fields - never re-evaluate.
  // ==========================================================================
  
  const existingMeta = session.styleMetadata || {}
  
  // --------------------------------------------------------------------------
  // PRIORITY 1 - Authoritative builder styledGroups
  // --------------------------------------------------------------------------
  // If the builder already computed styledGroups, PRESERVE them exactly.
  if (existingMeta.styledGroups && Array.isArray(existingMeta.styledGroups) && existingMeta.styledGroups.length > 0) {
    // Builder truth exists - preserve it intact, only ensure structural fields
    return {
      ...session,
      styleMetadata: {
        ...existingMeta,
        // Ensure these fields exist but don't overwrite builder values
        hasSupersetsApplied: existingMeta.hasSupersetsApplied ?? existingMeta.styledGroups.some((g: { groupType: string }) => g.groupType === 'superset'),
        appliedMethods: existingMeta.appliedMethods ?? ['straight_sets'],
      },
    }
  }
  
  // --------------------------------------------------------------------------
  // [BUILDER-TRUTH-PRESERVATION / PRIORITY 2] Exercise-level grouped truth
  // --------------------------------------------------------------------------
  // Builder styledGroups may be missing from an older save or from an upstream
  // serialization path that dropped the style metadata, BUT the per-exercise
  // grouped authority fields (`blockId` / non-straight `method`) can still be
  // present on `session.exercises[]`. Converting those to fallback straight
  // groups is destructive: it transforms RECOVERABLE grouped truth into
  // AUTHORITATIVE straight truth and permanently seals `appliedMethods` to
  // ['straight_sets']. That is the exact load-corridor bug that was stripping
  // grouped truth before the card ever read it.
  //
  // When exercise-level grouped truth exists, we preserve it intact:
  //   - no fabricated styledGroups
  //   - no appliedMethods override
  //   - downstream consumers (buildFullSessionRoutineSurface,
  //     buildFullVisibleRoutineExercises, buildGroupedDisplayModel,
  //     AdaptiveSessionCard) still read `session.exercises[].blockId/method/
  //     methodLabel` and reconstruct grouped shape from that authoritative
  //     per-exercise data.
  // --------------------------------------------------------------------------
  // [TRUTH-TO-UI-OWNERSHIP, prompt 6] Also check `setExecutionMethod`.
  // Previously this detector read ONLY `.method` + `.blockId`. `setExecutionMethod`
  // (cluster / rest_pause / top_set / drop_set) is the authoritative per-row
  // set-execution field per METHOD-TAXONOMY-LOCK (adaptive-program-builder.ts
  // ~L1180-1198). If a save/load roundtrip delivered an exercise with a valid
  // `setExecutionMethod: 'cluster'` but no legacy `.method` (because a stricter
  // whitelist elsewhere dropped the overloaded field), this detector would
  // return `false` and PRIORITY 3 below would fabricate `'straight'` styledGroups
  // -- destroying authoritative cluster truth at the load boundary exactly the
  // way the [FUNNEL-RULE] comment warns against. Now cluster / rest-pause /
  // top-set / drop-set truth keeps the session on the preservation path.
  const hasExerciseLevelGroupedTruth = session.exercises.some(ex => {
    const m = ex?.method
    const methodIsNonStraight = typeof m === 'string' && m.length > 0 && m !== 'straight_sets'
    const setExec = (ex as unknown as { setExecutionMethod?: string })?.setExecutionMethod
    const setExecIsNonStraight =
      typeof setExec === 'string' &&
      setExec.length > 0 &&
      setExec !== 'straight' &&
      setExec !== 'straight_sets'
    const hasBlockId = typeof ex?.blockId === 'string' && ex.blockId.length > 0
    return hasBlockId || methodIsNonStraight || setExecIsNonStraight
  })

  if (hasExerciseLevelGroupedTruth) {
    // Preserve exercise-level grouped truth intact. Only set safe structural
    // defaults on styleMetadata -- do NOT invent styledGroups, do NOT override
    // appliedMethods, do NOT act as a shadow builder.
    return {
      ...session,
      styleMetadata: {
        ...existingMeta,
        // Keep whatever the upstream metadata already said; never force false.
        hasSupersetsApplied: existingMeta.hasSupersetsApplied ?? false,
        // Do NOT default appliedMethods here -- leaving it undefined signals
        // "metadata incomplete, defer to exercise-level truth" to downstream
        // consumers. Overriding with ['straight_sets'] would lie about intent.
        structureDescription: existingMeta.structureDescription || '',
      },
    }
  }
  
  // --------------------------------------------------------------------------
  // PRIORITY 3 - No grouped truth at either level: minimal straight fallback
  // --------------------------------------------------------------------------
  // Only reached when BOTH builder styledGroups AND per-exercise grouped truth
  // are absent. This handles genuinely flat programs and programs saved before
  // method materialization existed. These minimal straight groups are safe
  // defaults, not authoritative truth.
  // --------------------------------------------------------------------------
  const fallbackStyledGroups = session.exercises.map((ex, idx) => ({
    id: `straight-${idx}`,
    groupType: 'straight' as const,
    exercises: [{ id: ex.id || `ex-${idx}`, name: ex.name }],
  }))
  
  return {
    ...session,
    styleMetadata: {
      ...existingMeta,
      hasSupersetsApplied: false,
      styledGroups: fallbackStyledGroups,
      appliedMethods: ['straight_sets'],
      structureDescription: existingMeta.structureDescription || '',
    },
  }
}

// =============================================================================
// REBUILD RESULT CONTRACT - TASK 1
// =============================================================================
// This contract provides truthful, structured results for every build attempt.
// It answers all 7 questions from the PR goal without ambiguity.

/**
 * Status of a build/rebuild attempt.
 * - 'success': New program fully replaced the old one
 * - 'failed': Build failed at some stage, no replacement occurred
 * - 'preserved_last_good': Build failed but last good program is still available
 * - 'stale_visible_program': Visible program does not match current profile
 */
export type BuildAttemptStatus = 
  | 'success'
  | 'failed'
  | 'preserved_last_good'
  | 'stale_visible_program'

/**
 * Sub-codes that provide more detail about the failure.
 * TASK 5: Expanded to cover more specific failure scenarios
 */
export type BuildAttemptSubCode =
  | 'empty_structure_days'
  | 'empty_final_session_array'
  | 'session_count_mismatch'
  | 'session_save_blocked'
  | 'assembly_unknown_failure'
  | 'empty_exercise_pool'
  | 'invalid_warmup_block'
  | 'invalid_cooldown_block'
  | 'invalid_main_block'
  | 'session_validation_failed'
  | 'normalization_failed'
  | 'display_safety_failed'
  // TASK 5: Additional sub-codes for more precise diagnosis
  | 'helper_failure'
  | 'canonical_profile_failure'
  | 'exercise_selection_returned_null'
  | 'save_verification_failed'
  | 'audit_blocked'
  | 'session_has_no_exercises'
  | 'invalid_exercise_sets'
  // STEP F: New classified middle-helper failures
  | 'effective_selection_invalid'
  | 'session_middle_helper_failed'
  | 'session_variant_generation_failed'
  | 'finisher_helper_failed'
  // Post-session mutation failures
  | 'post_session_mutation_failed'
  | 'post_session_integrity_invalid'
  // Full lifecycle classification
  | 'session_generation_failed'
  // High-frequency schedule failures (TASK 7)
  | 'unsupported_high_frequency_structure'
  | 'insufficient_templates_for_requested_days'
  | 'recovery_distribution_conflict'
  // Internal builder runtime errors (TASK 5 - allExerciseNames fix)
  | 'internal_builder_reference_error'
  | 'internal_builder_type_error'
  // Session assembly root fix subcodes (TASK 5 - precise failure classification)
  | 'no_valid_candidate_after_filtering'
  | 'selected_candidate_invalidated_by_constraints'
  | 'equipment_filtered_all_candidates'
  | 'hybrid_structure_unresolvable'
  | 'final_validation_failed'
  | 'equipment_adaptation_zeroed_session'
  | 'validation_zeroed_session'
  | 'mapping_zeroed_session'
  // [PHASE 16Q] Page-side validation failure subcodes
  | 'program_null'
  | 'program_missing_id'
  | 'sessions_not_array'
  | 'sessions_empty'
  | 'session_item_invalid'
  | 'session_missing_day_number'
  | 'session_missing_focus'
  | 'session_exercises_not_array'
  // [PHASE 16R] Additional page-owned failure subcodes
  | 'storage_quota_exceeded'
  | 'save_verification_id_mismatch'
  | 'save_verification_session_mismatch'
  | 'builder_result_unresolved_promise'
  | 'generation_entry_failed'
  | 'fresh_input_invalid'
  // [404-DIAGNOSTIC] Route-level failure subcodes
  | 'route_not_found'
  | 'non_json_server_response'
  | 'server_regenerate_failed'
  // [PHASE15E-DEGRADED-SUCCESS-HANDOFF] Degraded success subcode
  | 'generation_degraded'
  | 'none'

/**
 * Structured result from every build/rebuild attempt.
 * TASK 1: This is the canonical contract for all generation outcomes.
 */
export interface BuildAttemptResult {
  /** Unique ID for this attempt (for logging/debugging) */
  attemptId: string
  /** When the attempt started */
  attemptedAt: string
  /** Overall status of the attempt */
  status: BuildAttemptStatus
  /** Which stage failed (if any) */
  stage: string
  /** Error code from GenerationError (if any) */
  errorCode: GenerationErrorCode | null
  /** More specific sub-code (if any) */
  subCode: BuildAttemptSubCode
  /** Whether the visible program was replaced with a new one */
  replacedVisibleProgram: boolean
  /** Whether a last good program was preserved on failure */
  preservedLastGoodProgram: boolean
  /** Whether the visible program is now stale relative to current profile */
  visibleProgramIsStale: boolean
  /** User-facing message (concise, product-grade) */
  userMessage: string
  /** Dev-facing summary with more detail */
  devSummary: string
  /** Profile signature used for this attempt */
  usedProfileSignature: string
  /** Previous program ID (if any) */
  previousProgramId: string | null
  /** New program ID (if successful) */
  newProgramId: string | null
  // ==========================================================================
  // TASK 1-C: Structured failure diagnostic fields for UI display
  // ==========================================================================
  /** Exact step where failure occurred */
  failureStep: string | null
  /** Middle helper step if applicable */
  failureMiddleStep: string | null
  /** Reason string (trimmed for UI) */
  failureReason: string | null
  /** Day number where failure occurred */
  failureDayNumber: number | null
  /** Day focus where failure occurred */
  failureFocus: string | null
  /** Goal at time of failure */
  failureGoal: string | null
  // [PHASE15E-DEGRADED-SUCCESS-HANDOFF] Server-provided action required
  actionRequired?: string | null
  // ==========================================================================
  // [PHASE 16S] Attempt-truth metadata for stale banner suppression
  // ==========================================================================
  /** Runtime session ID from the page mount that created this attempt */
  runtimeSessionId?: string | null
  /** Which page flow triggered this attempt */
  pageFlow?: 'main_generation' | 'regeneration' | 'adjustment_rebuild' | 'unknown'
  /** When the dispatch started (ISO string) */
  dispatchStartedAt?: string | null
  /** Whether the request was actually dispatched to the builder */
  requestDispatched?: boolean
  /** Whether a response was received from the builder */
  responseReceived?: boolean
  /** Whether this result was hydrated from storage (not live) */
  hydratedFromStorage?: boolean
}

/**
 * Generate a unique attempt ID.
 */
function generateAttemptId(): string {
  return `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Generate a unique runtime session ID for the page mount.
 */
export function generateRuntimeSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * [PHASE 16S] Truth-gate for whether a stored failure banner should render.
 * Returns whether render is allowed and the reason if suppressed.
 */
export function shouldRenderBuildFailureBanner(
  storedResult: BuildAttemptResult | null,
  currentRuntimeSessionId: string,
  currentSessionHasStartedNewAttempt: boolean,
  currentAttemptStartedAt: string | null
): { renderAllowed: boolean; suppressionReason: string | null } {
  // No result = nothing to render
  if (!storedResult) {
    return { renderAllowed: false, suppressionReason: 'no_stored_result' }
  }
  
  // Success results are not failure banners
  if (storedResult.status === 'success') {
    return { renderAllowed: false, suppressionReason: 'not_a_failure' }
  }
  
  const storedRuntimeSessionId = storedResult.runtimeSessionId
  const hydratedFromStorage = storedResult.hydratedFromStorage === true
  
  // ==========================================================================
  // [PHASE 16T] STRICT RULE: Block ALL hydrated failures by default
  // A hydrated failure from storage must NEVER auto-render as the active banner
  // unless there is explicit proof it belongs to a fresh current-runtime attempt.
  // ==========================================================================
  
  // RULE 1: If hydrated from storage, ALWAYS suppress for failure results
  // This is the core fix - old stored failures cannot become active banners on page load
  if (hydratedFromStorage) {
    // Check for missing runtime session ID
    if (!storedRuntimeSessionId) {
      return { 
        renderAllowed: false, 
        suppressionReason: 'hydrated_failure_missing_runtime' 
      }
    }
    
    // Check for runtime session mismatch (prior runtime)
    if (storedRuntimeSessionId !== currentRuntimeSessionId) {
      return { 
        renderAllowed: false, 
        suppressionReason: 'hydrated_failure_prior_runtime' 
      }
    }
    
    // Even if runtime matches (impossible for true hydrated result), still block
    // because hydratedFromStorage=true means it came from localStorage, not live
    return { 
      renderAllowed: false, 
      suppressionReason: 'hydrated_failure_not_live' 
    }
  }
  
  // RULE 2: For LIVE (non-hydrated) results only:
  // Allow if it belongs to current runtime session
  if (storedRuntimeSessionId && storedRuntimeSessionId === currentRuntimeSessionId) {
    return { renderAllowed: true, suppressionReason: null }
  }
  
  // RULE 3: For LIVE results: If current session started a new attempt, check timing
  if (currentSessionHasStartedNewAttempt && currentAttemptStartedAt) {
    const storedAttemptTime = new Date(storedResult.attemptedAt).getTime()
    const currentAttemptTime = new Date(currentAttemptStartedAt).getTime()
    
    // Allow if this result is from after the current attempt started (it's the current result)
    if (storedAttemptTime >= currentAttemptTime) {
      return { renderAllowed: true, suppressionReason: null }
    }
    
    // Suppress if this result is older than the current attempt
    return { 
      renderAllowed: false, 
      suppressionReason: 'hydrated_failure_superseded_by_new_attempt' 
    }
  }
  
  // RULE 4: Block anything without a runtime session ID (legacy data)
  if (!storedRuntimeSessionId) {
    return { 
      renderAllowed: false, 
      suppressionReason: 'hydrated_failure_missing_runtime' 
    }
  }
  
  // Default: suppress unknown cases (fail closed, not open)
  return { renderAllowed: false, suppressionReason: 'hydrated_failure_pre_dispatch' }
}

/**
 * [PHASE 16S] Normalize a hydrated build attempt result from storage.
 * Marks it as hydrated and handles missing fields for backward compatibility.
 */
export function normalizeHydratedBuildAttempt(
  stored: BuildAttemptResult
): BuildAttemptResult {
  return {
    ...stored,
    hydratedFromStorage: true,
    // Preserve existing values or set safe defaults for missing fields
    runtimeSessionId: stored.runtimeSessionId ?? null,
    pageFlow: stored.pageFlow ?? 'unknown',
    dispatchStartedAt: stored.dispatchStartedAt ?? null,
    requestDispatched: stored.requestDispatched ?? false,
    responseReceived: stored.responseReceived ?? false,
  }
}

/**
 * Create a profile signature for comparison.
 * Used to detect if visible program matches current profile.
 */
export function createProfileSignature(profile: {
  primaryGoal?: string | null
  secondaryGoal?: string | null
  scheduleMode?: string
  trainingDaysPerWeek?: number | null
  sessionLengthMinutes?: number
  selectedSkills?: string[]
}): string {
  return JSON.stringify({
    g: profile.primaryGoal || '',
    g2: profile.secondaryGoal || '',
    sm: profile.scheduleMode || '',
    td: profile.trainingDaysPerWeek || 0,
    sl: profile.sessionLengthMinutes || 0,
    sk: (profile.selectedSkills || []).sort().join(','),
  })
}

/**
 * Map error codes to user-facing messages.
 * TASK 5: Concise, stage-specific messaging with expanded sub-code handling.
 */
export function getErrorUserMessage(
  errorCode: GenerationErrorCode | null,
  subCode: BuildAttemptSubCode,
  hasLastGoodProgram: boolean
): string {
  const suffix = hasLastGoodProgram 
    ? ' Your previous plan is still available.' 
    : ''
  
  // TASK 5: Handle sub-codes first for more specific messaging
  // STEP F: Added new classified failure subcodes
  switch (subCode) {
    case 'canonical_profile_failure':
      return 'Could not load your profile. Please refresh and try again.' + suffix
    case 'helper_failure':
      return 'A setup step failed. Please try again.' + suffix
    case 'audit_blocked':
      return 'Plan did not pass quality checks. Try different settings.' + suffix
    case 'save_verification_failed':
      return 'Plan could not be verified after saving. Please try again.' + suffix
    case 'exercise_selection_returned_null':
      return 'A session could not be built from your current goals and equipment.' + suffix
    case 'session_has_no_exercises':
      return 'One part of your updated plan could not be built with the current settings.' + suffix
    case 'invalid_exercise_sets':
      return 'Exercise configuration is invalid. Please try again.' + suffix
    case 'effective_selection_invalid':
      return 'One part of your updated plan became invalid before session assembly completed.' + suffix
    case 'session_middle_helper_failed':
      return 'A session detail could not be prepared.' + suffix
    case 'session_variant_generation_failed':
      return 'Session variants could not be prepared.' + suffix
    case 'finisher_helper_failed':
      return 'Optional session finishing work could not be added, but your core plan remains available.' + suffix
    // Post-session mutation failure messages
    case 'post_session_mutation_failed':
      return 'A session detail could not be finalized.' + suffix
    case 'post_session_integrity_invalid':
      return 'Your rebuilt session became invalid before final save.' + suffix
    // Full lifecycle failure
    case 'session_generation_failed':
      return 'A session could not be built from the current inputs.' + suffix
    // High-frequency schedule failures
    case 'unsupported_high_frequency_structure':
      return '6/7-day schedules require specific structure support. The selected goals may not fully support this frequency yet.' + suffix
    case 'insufficient_templates_for_requested_days':
      return 'Not enough session templates for your requested schedule. Try fewer days.' + suffix
    case 'recovery_distribution_conflict':
      return 'Recovery days could not be properly distributed. Try fewer training days.' + suffix
    // Internal builder runtime errors (TASK 5 - allExerciseNames fix)
    case 'internal_builder_reference_error':
      return 'An internal builder error occurred. Please try again or report this issue.' + suffix
    case 'internal_builder_type_error':
      return 'An internal data error occurred. Please try again or report this issue.' + suffix
    // Session assembly root fix subcodes (precise failure classification)
    case 'no_valid_candidate_after_filtering':
      return 'No valid exercises remained after filtering. Try adjusting your equipment or skills.' + suffix
    case 'selected_candidate_invalidated_by_constraints':
      return 'Selected exercises were invalidated by constraints. Try fewer skills or different equipment.' + suffix
    case 'equipment_filtered_all_candidates':
      return 'Your equipment settings filtered out all suitable exercises. Check your equipment list.' + suffix
    case 'hybrid_structure_unresolvable':
      return 'Unable to build a hybrid session with current settings. Try fewer goals or skills.' + suffix
    case 'final_validation_failed':
      return 'Session validation failed. Try simplifying your goals or equipment.' + suffix
    case 'equipment_adaptation_zeroed_session':
      return 'Equipment adaptation removed all exercises. Check your equipment matches your goals.' + suffix
    case 'validation_zeroed_session':
      return 'Session validation removed all exercises. Try different settings.' + suffix
    case 'mapping_zeroed_session':
      return 'Exercise mapping failed. Please try again or report this issue.' + suffix
    // [PHASE 16Q] Page-side validation failure messages
    case 'program_null':
      return 'The program builder returned no plan. Please try again.' + suffix
    case 'program_missing_id':
      return 'The generated plan was incomplete and could not be saved.' + suffix
    case 'sessions_not_array':
      return 'The generated plan had an invalid session format.' + suffix
    case 'sessions_empty':
      return 'The generated plan did not contain any sessions.' + suffix
    case 'session_item_invalid':
      return 'One session in the generated plan was malformed.' + suffix
    case 'session_missing_day_number':
      return 'A generated session was missing its training day.' + suffix
    case 'session_missing_focus':
      return 'A generated session was missing its focus.' + suffix
    case 'session_exercises_not_array':
      return 'A generated session had an invalid exercise list.' + suffix
    // [PHASE 16R] Additional page-owned failure messages
    case 'audit_blocked':
      return 'The generated plan did not pass internal quality checks. Please try again.' + suffix
    case 'storage_quota_exceeded':
      return 'Your plan could not be saved because local storage is full. Clear older saved data and try again.' + suffix
    case 'save_verification_id_mismatch':
      return 'The saved plan did not match the newly generated plan. Please try again.' + suffix
    case 'save_verification_session_mismatch':
      return 'The saved plan structure did not match the generated plan. Please try again.' + suffix
    case 'builder_result_unresolved_promise':
      return 'The builder did not finish correctly. Please try again.' + suffix
    case 'generation_entry_failed':
      return 'Program generation could not start correctly. Please try again.' + suffix
    case 'fresh_input_invalid':
      return 'Required training inputs were incomplete. Please review your settings and try again.' + suffix
    default:
      // Fall through to error code handling
      break
  }
  
  // [PHASE 16R] Runtime marker for error mapping
  console.log('[phase16r-runtime-marker]', {
    file: 'lib/program-state.ts',
    location: 'getErrorUserMessage',
    errorCode,
    subCode,
    marker: 'PHASE_16R_RUNTIME_MARKER',
  })
  
  // [PHASE 16Q] Runtime marker for error mapping
  console.log('[phase16q-runtime-marker]', {
    file: 'lib/program-state.ts',
    location: 'getErrorUserMessage',
    errorCode,
    subCode,
    marker: 'PHASE_16Q_RUNTIME_MARKER',
  })
  
  switch (errorCode) {
    case 'profile_validation_failed':
      return 'Complete your training profile to build a plan.'
    case 'input_resolution_failed':
      return 'Missing required settings. Check your profile.' + suffix
    case 'structure_selection_failed':
      return 'Unable to create a plan with those settings. Try adjusting your schedule or goals.' + suffix
    case 'session_assembly_failed':
      // [PHASE 4] Precise error messages for each session assembly subcode
      if (subCode === 'empty_exercise_pool') {
        return 'No suitable exercises found for your equipment. Check your equipment settings.' + suffix
      }
      if (subCode === 'empty_final_session_array') {
        return 'Sessions could not be built. Try different goals or schedule.' + suffix
      }
      if (subCode === 'session_has_no_exercises') {
        return 'One part of your updated plan could not be built with the current settings.' + suffix
      }
      if (subCode === 'session_count_mismatch') {
        return 'Session count does not match the selected schedule. Try rebuilding your program.' + suffix
      }
      if (subCode === 'empty_structure_days') {
        return 'Weekly structure has no days defined. Try a different schedule configuration.' + suffix
      }
      if (subCode === 'no_valid_candidate_after_filtering') {
        return 'No valid exercises found after filtering. Try adjusting your equipment or goals.' + suffix
      }
      if (subCode === 'equipment_filtered_all_candidates') {
        return 'Your equipment settings filtered out all exercises. Update your available equipment.' + suffix
      }
      if (subCode === 'hybrid_structure_unresolvable') {
        return 'Hybrid training structure could not be resolved. Try fewer selected skills.' + suffix
      }
      return 'A session could not be assembled. Try adjusting your goals or equipment.' + suffix
    case 'warmup_generation_failed':
      return 'Warmup generation encountered an issue.' + suffix
    case 'validation_failed':
      return 'Plan validation failed. Try adjusting your settings.' + suffix
    case 'snapshot_normalization_failed':
      return 'Plan could not be prepared for display.' + suffix
    case 'snapshot_save_failed':
      if (subCode === 'session_save_blocked') {
        return 'Plan save was blocked due to validation issues.' + suffix
      }
      return 'Plan could not be saved.' + suffix
    case 'unknown_generation_failure':
    default:
      return 'Unable to create your plan. Please try again.' + suffix
  }
}

/**
 * Create a successful build result.
 */
export function createSuccessBuildResult(
  profileSignature: string,
  previousProgramId: string | null,
  newProgramId: string
): BuildAttemptResult {
  const result: BuildAttemptResult = {
  attemptId: generateAttemptId(),
  attemptedAt: new Date().toISOString(),
  status: 'success',
  stage: 'completed',
  errorCode: null,
  subCode: 'none',
  replacedVisibleProgram: true,
  preservedLastGoodProgram: false, // Not applicable on success
  visibleProgramIsStale: false,
  userMessage: 'Your new training plan is ready.',
  devSummary: `SUCCESS: Program ${newProgramId} replaced ${previousProgramId || 'none'}`,
  usedProfileSignature: profileSignature,
  previousProgramId,
  newProgramId,
  // Failure diagnostic fields - null on success
  failureStep: null,
  failureMiddleStep: null,
  failureReason: null,
  failureDayNumber: null,
  failureFocus: null,
  failureGoal: null,
  }
  
  // Log for debugging
  console.log('[program-rebuild-truth] BUILD SUCCESS:', {
    attemptId: result.attemptId,
    newProgramId,
    previousProgramId,
    replacedVisibleProgram: true,
  })
  
  return result
}

/**
 * Structured failure details for diagnostic display.
 * TASK 1-C: Canonical shape for UI-facing rebuild errors.
 */
export interface FailureDiagnostics {
  failureStep?: string | null
  failureMiddleStep?: string | null
  failureReason?: string | null
  failureDayNumber?: number | null
  failureFocus?: string | null
  failureGoal?: string | null
  // [PHASE15E-DEGRADED-SUCCESS-HANDOFF] Server-provided action required for surgical debugging
  actionRequired?: string | null
}

/**
 * Create a failed build result with last good program preserved.
 * TASK 1-C: Now accepts optional structured failure diagnostics for UI display.
 */
export function createFailedBuildResult(
  errorCode: GenerationErrorCode | null,
  stage: string,
  subCode: BuildAttemptSubCode,
  profileSignature: string,
  previousProgramId: string | null,
  errorMessage: string,
  diagnostics?: FailureDiagnostics
): BuildAttemptResult {
  const hasLastGoodProgram = previousProgramId !== null
  const userMessage = getErrorUserMessage(errorCode, subCode, hasLastGoodProgram)
  
  // Build enhanced devSummary with structured details
  const stepInfo = diagnostics?.failureStep ? ` step=${diagnostics.failureStep}` : ''
  const middleInfo = diagnostics?.failureMiddleStep ? ` middle=${diagnostics.failureMiddleStep}` : ''
  const dayInfo = diagnostics?.failureDayNumber ? ` day=${diagnostics.failureDayNumber}` : ''
  const focusInfo = diagnostics?.failureFocus ? ` focus=${diagnostics.failureFocus}` : ''
  
  const result: BuildAttemptResult = {
    attemptId: generateAttemptId(),
    attemptedAt: new Date().toISOString(),
    status: hasLastGoodProgram ? 'preserved_last_good' : 'failed',
    stage,
    errorCode,
    subCode,
    replacedVisibleProgram: false,
    preservedLastGoodProgram: hasLastGoodProgram,
    visibleProgramIsStale: hasLastGoodProgram,
    userMessage,
    devSummary: `FAILED at ${stage} [${errorCode}/${subCode}]:${stepInfo}${middleInfo}${dayInfo}${focusInfo}. Last good: ${previousProgramId || 'none'}`,
    usedProfileSignature: profileSignature,
    previousProgramId,
    newProgramId: null,
    // TASK 1-C: Structured failure diagnostics
    failureStep: diagnostics?.failureStep ?? null,
    failureMiddleStep: diagnostics?.failureMiddleStep ?? null,
    failureReason: diagnostics?.failureReason ?? null,
    failureDayNumber: diagnostics?.failureDayNumber ?? null,
    failureFocus: diagnostics?.failureFocus ?? null,
    failureGoal: diagnostics?.failureGoal ?? null,
    // [PHASE15E-DEGRADED-SUCCESS-HANDOFF]
    actionRequired: diagnostics?.actionRequired ?? null,
  }
  
  // [rebuild-error-state] Log for debugging with searchable prefix
  console.log('[rebuild-error-state]', {
    attemptId: result.attemptId,
    stage,
    errorCode,
    subCode,
    failureStep: result.failureStep,
    failureMiddleStep: result.failureMiddleStep,
    failureDayNumber: result.failureDayNumber,
    failureFocus: result.failureFocus,
    failureReason: result.failureReason?.slice(0, 60),
    preservedLastGoodProgram: hasLastGoodProgram,
    previousProgramId,
  })
  
  if (hasLastGoodProgram) {
    console.log('[program-rebuild-fallback] Last good program preserved:', {
      programId: previousProgramId,
      message: 'User is viewing previous plan - new profile truth NOT applied',
    })
  }
  
  return result
}

/**
 * Get the most recent build attempt result from storage.
 * Used by UI to display current build status.
 */
export function getLastBuildAttemptResult(): BuildAttemptResult | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('spartanlab_last_build_result')
    if (!stored) return null
    return JSON.parse(stored) as BuildAttemptResult
  } catch {
    return null
  }
}

/**
 * Save the build attempt result to storage.
 * [storage-quota-fix] TASK D: Trim oversized fields to prevent quota issues
 */
export function saveLastBuildAttemptResult(result: BuildAttemptResult): void {
  if (typeof window === 'undefined') return
  try {
    // Create a trimmed version for storage - only essential fields
    const trimmedResult: BuildAttemptResult = {
      ...result,
      // Trim potentially long strings to safe lengths
      userMessage: result.userMessage?.slice(0, 200) || '',
      devSummary: result.devSummary?.slice(0, 300) || '',
      failureReason: result.failureReason?.slice(0, 150) || null,
      usedProfileSignature: result.usedProfileSignature?.slice(0, 100) || '',
    }
    
    localStorage.setItem('spartanlab_last_build_result', JSON.stringify(trimmedResult))
    
    // Also dispatch event for UI components to react
    window.dispatchEvent(new CustomEvent('spartanlab:build-result', { detail: trimmedResult }))
  } catch (err) {
    // [storage-quota-fix] Log but don't fail - this is non-core bookkeeping
    console.warn('[storage-quota-fix] Failed to save build result (non-core):', err)
  }
}

/**
 * Clear the last build result (e.g., when user starts fresh).
 */
export function clearLastBuildAttemptResult(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('spartanlab_last_build_result')
}

// =============================================================================
// FRESHNESS SYNC - TASK 1: Canonical freshness identity for cross-surface consistency
// =============================================================================

/**
 * [freshness-sync] TASK 1: Canonical identity that all surfaces must compare against
 * This ensures builder, program page, workout page, and today page all see the same snapshot
 */
export interface ProgramFreshnessIdentity {
  /** Unique program ID */
  programId: string
  /** When this program was generated */
  generatedAt: string
  /** Profile signature at build time - for staleness detection */
  profileSignatureAtBuild: string
  /** Monotonically increasing version for fast equality checks */
  snapshotVersion: number
}

/** Storage key for the current freshness identity */
const FRESHNESS_IDENTITY_KEY = 'spartanlab_program_freshness_identity'

/** In-memory version counter for this session */
let currentSnapshotVersion = Date.now()

/**
 * [freshness-sync] TASK 1: Get the current canonical freshness identity
 * All surfaces should compare against this to detect drift
 */
export function getCurrentFreshnessIdentity(): ProgramFreshnessIdentity | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(FRESHNESS_IDENTITY_KEY)
    if (!stored) return null
    return JSON.parse(stored) as ProgramFreshnessIdentity
  } catch {
    return null
  }
}

/**
 * [freshness-sync] TASK 2: Update the canonical freshness identity after successful save
 * This triggers cache invalidation across all surfaces
 */
export function updateFreshnessIdentity(
  programId: string,
  generatedAt: string,
  profileSignature: string
): ProgramFreshnessIdentity {
  currentSnapshotVersion = Date.now()
  
  const identity: ProgramFreshnessIdentity = {
    programId,
    generatedAt,
    profileSignatureAtBuild: profileSignature,
    snapshotVersion: currentSnapshotVersion,
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(FRESHNESS_IDENTITY_KEY, JSON.stringify(identity))
    
    // [freshness-sync] TASK 4: Dispatch event for all surfaces to invalidate stale state
    console.log('[freshness-sync] Dispatching snapshot-replaced event:', {
      programId,
      snapshotVersion: currentSnapshotVersion,
    })
    window.dispatchEvent(new CustomEvent('spartanlab:snapshot-replaced', { 
      detail: identity 
    }))
  }
  
  return identity
}

/**
 * [freshness-sync] TASK 6: Check if a cached/displayed program matches current canonical identity
 * Returns drift info if there's a mismatch
 */
export function checkFreshnessDrift(displayedProgramId: string | undefined): {
  hasDrift: boolean
  currentIdentity: ProgramFreshnessIdentity | null
  driftReason?: string
} {
  const currentIdentity = getCurrentFreshnessIdentity()
  
  if (!currentIdentity) {
    // No canonical identity - can't detect drift
    return { hasDrift: false, currentIdentity: null }
  }
  
  if (!displayedProgramId) {
    return { 
      hasDrift: true, 
      currentIdentity,
      driftReason: 'surface_has_no_program_but_canonical_exists'
    }
  }
  
  if (displayedProgramId !== currentIdentity.programId) {
    console.warn('[surface-drift] Detected drift:', {
      displayed: displayedProgramId,
      canonical: currentIdentity.programId,
    })
    return { 
      hasDrift: true, 
      currentIdentity,
      driftReason: `program_id_mismatch: displayed=${displayedProgramId} canonical=${currentIdentity.programId}`
    }
  }
  
  return { hasDrift: false, currentIdentity }
}

/**
 * [freshness-sync] TASK 4: Clear any stale cached state
 * Called when a new snapshot replaces the old one
 */
export function invalidateStaleCaches(): void {
  if (typeof window === 'undefined') return
  
  // Clear any session-level caches that might hold stale data
  const staleCacheKeys = [
    'spartanlab_builder_draft',
    'spartanlab_workout_session_cache',
    'spartanlab_today_session_cache',
  ]
  
  staleCacheKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log('[freshness-sync] Invalidating stale cache:', key)
      localStorage.removeItem(key)
    }
  })
  
  // Also clear sessionStorage caches
  const sessionStaleCacheKeys = [
    'spartanlab_current_session',
    'spartanlab_workout_state',
  ]
  
  sessionStaleCacheKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
      console.log('[freshness-sync] Invalidating sessionStorage cache:', key)
      sessionStorage.removeItem(key)
    }
  })
}

// =============================================================================
// MIGRATION HELPERS - Handle old storage keys
// =============================================================================

/**
 * Attempt to recover a program from the old spartanlab_first_program key
 * and migrate it to canonical storage. This is idempotent - safe to call multiple times.
 * 
 * CRITICAL: Must validate ALL sessions before migrating to prevent saving malformed data
 */
function migrateFirstProgramIfNeeded(): AdaptiveProgram | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('spartanlab_first_program')
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    
    // Validate basic structure
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray(parsed.sessions) || parsed.sessions.length === 0) return null
    
    // Validate ALL sessions have required structure before migrating
    for (let i = 0; i < parsed.sessions.length; i++) {
      const session = parsed.sessions[i]
      if (!session || typeof session !== 'object') {
        console.log(`[Migration] Session ${i} is invalid, skipping migration`)
        return null
      }
      if (!Array.isArray(session.exercises)) {
        console.log(`[Migration] Session ${i} has no exercises array, skipping migration`)
        return null
      }
      // First session must have at least one exercise
      if (i === 0 && session.exercises.length === 0) {
        console.log('[Migration] First session has no exercises, skipping migration')
        return null
      }
    }
    
    // This looks valid - save it to canonical storage
    // saveAdaptiveProgram handles deduplication by ID
    const saved = saveAdaptiveProgram(parsed)
    console.log('[Migration] Successfully migrated first_program to canonical storage')
    
    return saved
  } catch (err) {
    console.error('[Migration] Error during migration:', err)
    return null
  }
}

export interface ProgramState {
  /** Whether a usable workout program exists */
  hasProgram: boolean
  /** Whether the program has actual runnable sessions */
  hasUsableWorkoutProgram: boolean
  /** The adaptive program object (preferred) */
  adaptiveProgram: AdaptiveProgram | null
  /** The legacy program object (fallback) */
  legacyProgram: GeneratedProgram | null
  /** The active program (adaptive or legacy) */
  activeProgram: AdaptiveProgram | GeneratedProgram | null
  /** Number of sessions available */
  sessionCount: number
}

/**
 * Validate that an adaptive program is fully usable by all downstream readers
 * This checks ALL sessions, not just the first one, to prevent crashes in
 * today/week/adjustment widgets that may access any session.
 * 
 * GUARANTEED: Never throws - returns false on any error
 */
function validateAdaptiveProgramUsability(program: AdaptiveProgram | null): boolean {
  try {
    if (!program || typeof program !== 'object') return false
    if (!Array.isArray(program.sessions) || program.sessions.length === 0) return false
    
    // Validate EVERY session has required structure
    for (let i = 0; i < program.sessions.length; i++) {
      const session = program.sessions[i]
      if (!session || typeof session !== 'object') {
        console.log(`[ProgramState] Session ${i} is not a valid object`)
        return false
      }
      if (!Array.isArray(session.exercises)) {
        console.log(`[ProgramState] Session ${i} has no exercises array`)
        return false
      }
      // Note: We don't require exercises.length > 0 - an empty session is still valid structure
      // But first session should have exercises for a truly usable program
      if (i === 0 && session.exercises.length === 0) {
        console.log('[ProgramState] First session has no exercises')
        return false
      }
    }
    
    return true
  } catch (err) {
    console.error('[ProgramState] Validation error:', err)
    return false
  }
}

/** Safe default state - used when anything fails */
const SAFE_DEFAULT_STATE: ProgramState = {
  hasProgram: false,
  hasUsableWorkoutProgram: false,
  adaptiveProgram: null,
  legacyProgram: null,
  activeProgram: null,
  sessionCount: 0,
}

// =============================================================================
// PROGRAM NORMALIZATION - Crash-proof display helpers
// =============================================================================

/**
 * Check if a program is safe to render in AdaptiveProgramDisplay
 * Returns false if any critical display property could cause a crash
 * 
 * TASK 4: Enhanced display-sanity gate that validates enough fields
 * to guarantee the display layer won't explode
 */
export function isRenderableProgram(program: AdaptiveProgram | null): boolean {
  if (!program || typeof program !== 'object') return false
  if (!Array.isArray(program.sessions)) return false
  if (!program.goalLabel || typeof program.goalLabel !== 'string') return false
  if (!program.createdAt) return false
  
  // TASK 4: Validate every rendered session has minimal safe fields
  for (let i = 0; i < program.sessions.length; i++) {
    const session = program.sessions[i]
    if (!session || typeof session !== 'object') return false
    if (!Array.isArray(session.exercises)) return false
    // First session must have exercises for display to be meaningful
    if (i === 0 && session.exercises.length === 0) return false
  }
  
  return true
}

/**
 * TASK 4: Display-safe verification helper
 * Returns true only if the program is fully safe for the display layer
 * This is a stricter check than isRenderableProgram for the final sanity gate
 */
export function isProgramDisplaySafe(program: AdaptiveProgram | null): {
  safe: boolean
  reason?: string
} {
  if (!program || typeof program !== 'object') {
    return { safe: false, reason: 'program_null_or_invalid' }
  }
  if (!Array.isArray(program.sessions)) {
    return { safe: false, reason: 'sessions_not_array' }
  }
  if (program.sessions.length === 0) {
    return { safe: false, reason: 'sessions_empty' }
  }
  if (!program.goalLabel || typeof program.goalLabel !== 'string') {
    return { safe: false, reason: 'goalLabel_missing' }
  }
  if (!program.createdAt) {
    return { safe: false, reason: 'createdAt_missing' }
  }
  
  // Validate each session
  for (let i = 0; i < program.sessions.length; i++) {
    const session = program.sessions[i]
    if (!session || typeof session !== 'object') {
      return { safe: false, reason: `session_${i}_invalid` }
    }
    if (!Array.isArray(session.exercises)) {
      return { safe: false, reason: `session_${i}_exercises_not_array` }
    }
  }
  
  return { safe: true }
}

/**
 * Default values for missing nested objects in AdaptiveProgram
 * Used to prevent crashes when accessing optional properties
 */
const DEFAULT_CONSTRAINT_INSIGHT = {
  hasInsight: false,
  label: 'Training Balanced',
  category: 'none' as const,
  severity: 'low' as const,
}

const DEFAULT_STRUCTURE = {
  structureName: 'Custom Program',
  rationale: 'Personalized training structure',
  dayTypes: [],
}

const DEFAULT_ENGINE_CONTEXT = {
  plateauStatus: 'no_plateau' as const,
  strengthSupportLevel: 'unknown' as const,
  fatigueState: 'normal' as const,
  recommendations: [],
}

const DEFAULT_EQUIPMENT_PROFILE = {
  hasFullSetup: true,
  adaptationNotes: [],
  available: [],
  missing: [],
}

/**
 * Normalize a program for safe display
 * Fills in missing nested objects with safe defaults to prevent crashes
 * 
 * IMPORTANT: This does NOT validate the program is usable for workouts,
 * only that it won't crash when rendered.
 */
export function normalizeProgramForDisplay(program: AdaptiveProgram | null): AdaptiveProgram | null {
  if (!program || typeof program !== 'object') return null
  
  try {
    // Create a safe copy with defaults for all potentially missing nested objects
    const normalized: AdaptiveProgram = {
      ...program,
      // Ensure required string fields have defaults
      goalLabel: program.goalLabel || 'Training Program',
      experienceLevel: program.experienceLevel || 'intermediate',
      programRationale: program.programRationale || '',
      recoveryLevel: program.recoveryLevel || 'MODERATE',
      createdAt: program.createdAt || new Date().toISOString(),
      
      // ISSUE C FIX: Preserve actual program values - only use fallbacks for truly missing fields
      // These fallbacks are for snapshot display only, not for generation truth
      sessionLength: program.sessionLength ?? 60,  // Fallback only if truly null/undefined
      trainingDaysPerWeek: program.trainingDaysPerWeek ?? 3,  // Fallback only if truly null/undefined
      currentWeekFrequency: program.currentWeekFrequency ?? program.trainingDaysPerWeek ?? 3,
      
      // Ensure nested objects have defaults
      constraintInsight: {
        ...DEFAULT_CONSTRAINT_INSIGHT,
        ...(program.constraintInsight || {}),
      },
      structure: {
        ...DEFAULT_STRUCTURE,
        ...(program.structure || {}),
      },
      engineContext: program.engineContext ? {
        ...DEFAULT_ENGINE_CONTEXT,
        ...program.engineContext,
        recommendations: Array.isArray(program.engineContext.recommendations) 
          ? program.engineContext.recommendations 
          : [],
      } : undefined,
      equipmentProfile: program.equipmentProfile ? {
        ...DEFAULT_EQUIPMENT_PROFILE,
        ...program.equipmentProfile,
        adaptationNotes: Array.isArray(program.equipmentProfile.adaptationNotes)
          ? program.equipmentProfile.adaptationNotes
          : [],
      } : undefined,
      
    // [PHASE-X] Ensure sessions array exists and normalize each session
    // This prevents downstream crashes from malformed session data
    // [BUILDER-TRUTH-PRESERVATION] Preserve builder's grouped truth, don't rebuild
      sessions: Array.isArray(program.sessions) 
        ? program.sessions
            .filter(s => s && typeof s === 'object' && Array.isArray(s.exercises))
            .map(s => {
              // ====================================================================
              // [PHASE 4V] CANONICAL SESSION TRUTH PRESERVATION CONTRACT
              //
              // The `...s` spread above carries every runtime field through, but
              // the explicit lines further down (`blockId` / `method` /
              // `methodLabel` / `setExecutionMethod`) make that preservation a
              // contract instead of an accidental side-effect of ordering. Phase
              // 4V extends the same contract to the session-level canonical
              // Phase 4P/4Q/4S signals so any future refactor that swaps the
              // spread for a picked subset still survives the load corridor:
              //
              //   * methodStructures            (Phase 4P canonical method truth)
              //   * doctrineBlockResolution     (Phase 4Q classified doctrine)
              //
              // These two fields are typed as optional via `as unknown as` casts
              // on `AdaptiveSession` (their authoritative declarations live in
              // `lib/program/method-structure-contract.ts` and
              // `lib/program/doctrine-block-resolution-contract.ts`). We read
              // them off `s` via a narrow structural typing and re-assign them
              // BY NAME below using `Object.assign` to keep TypeScript happy
              // without polluting the `AdaptiveSession` interface. They are
              // copied verbatim — never re-decided, never flattened, never
              // converted into styledGroups.
              //
              // `methodMaterializationSummary` already lives inside
              // `styleMetadata` and is preserved by `preserveSessionGroupedContract`
              // below (the existing `existingMeta` spread carries it through).
              // ====================================================================
              const sCanonical = s as unknown as {
                methodStructures?: unknown
                doctrineBlockResolution?: unknown
              }
              // First normalize basic session fields
              const normalizedSession = {
                ...s,
                // Ensure session has all required fields
                dayNumber: typeof s.dayNumber === 'number' ? s.dayNumber : 1,
                dayLabel: typeof s.dayLabel === 'string' && s.dayLabel ? s.dayLabel : `Day ${s.dayNumber || 1}`,
                focus: typeof s.focus === 'string' && s.focus ? s.focus : 'general',
                focusLabel: typeof s.focusLabel === 'string' ? s.focusLabel : 'Training',
                rationale: typeof s.rationale === 'string' ? s.rationale : '',
                estimatedMinutes: typeof s.estimatedMinutes === 'number' ? s.estimatedMinutes : 45,
                isPrimary: s.isPrimary !== false,
                finisherIncluded: s.finisherIncluded === true,
                // Normalize exercises with safe defaults.
                //
                // [BUILDER-TRUTH-PRESERVATION] Grouped-authority field contract:
                // The `...ex` spread already carries ALL runtime fields through,
                // but the explicit `blockId` / `method` / `methodLabel` lines
                // below make the grouped-truth preservation a CONTRACT rather
                // than an accidental side-effect of ordering. Any future edit
                // that reorders this map (e.g. someone refactors to a picked
                // subset or adds a field-whitelist step above the spread) will
                // still preserve grouped truth because these three fields are
                // named explicitly and placed AFTER the generic safety
                // defaults. They are the ONLY fields the card needs for
                // grouped body rendering when builder styledGroups are absent.
                exercises: Array.isArray(s.exercises) 
                  ? s.exercises
                      .filter(ex => ex && typeof ex === 'object')
                      .map((ex, idx) => ({
                        ...ex,
                        id: typeof ex.id === 'string' && ex.id ? ex.id : `exercise-${idx}`,
                        name: typeof ex.name === 'string' && ex.name ? ex.name : 'Exercise',
                        category: typeof ex.category === 'string' ? ex.category : 'general',
                        sets: typeof ex.sets === 'number' && ex.sets > 0 ? ex.sets : 3,
                        repsOrTime: typeof ex.repsOrTime === 'string' && ex.repsOrTime ? ex.repsOrTime : '8-12 reps',
                        note: typeof ex.note === 'string' ? ex.note : '',
                        isOverrideable: ex.isOverrideable !== false,
                        selectionReason: typeof ex.selectionReason === 'string' ? ex.selectionReason : '',
                        // [BUILDER-TRUTH-PRESERVATION] Explicit grouped-truth carry-forward.
                        // Only overwrite with `undefined` if source was already missing --
                        // never coerce a valid builder value to a default here.
                        blockId: typeof ex.blockId === 'string' && ex.blockId ? ex.blockId : ex.blockId,
                        method: ex.method,
                        methodLabel: typeof ex.methodLabel === 'string' && ex.methodLabel ? ex.methodLabel : ex.methodLabel,
                        // [TRUTH-TO-UI-OWNERSHIP, prompt 6] Pin `setExecutionMethod`
                        // to the explicit contract list alongside `method`. The
                        // `...ex` spread above already carries it through at
                        // runtime, but naming it explicitly protects it from
                        // any future refactor that swaps this map for a picked
                        // subset -- same contract rationale the comment above
                        // cites for `method` / `blockId` / `methodLabel`.
                        // `AdaptiveExercise` declares setExec as a narrow
                        // union at adaptive-program-builder.ts L1198; the cast
                        // just reassures TS across this mapper's inferred
                        // return type.
                        setExecutionMethod: (ex as AdaptiveExercise).setExecutionMethod,
                      }))
                  : [],
                warmup: Array.isArray(s.warmup) ? s.warmup : [],
                cooldown: Array.isArray(s.cooldown) ? s.cooldown : [],
              }
              
        // [BUILDER-TRUTH-PRESERVATION] Preserve builder's grouped truth, don't rebuild
        // Load-time normalization preserves authoritative builder output
        const preserved = preserveSessionGroupedContract(normalizedSession)
        // [PHASE 4V] Re-attach canonical session-level Phase 4P/4Q signals BY
        // NAME after `preserveSessionGroupedContract` so the contract is
        // explicit and survives future refactors. `Object.assign` is used
        // (rather than spread) because `methodStructures` and
        // `doctrineBlockResolution` are not declared on the
        // `AdaptiveSession` interface — they are typed via `as unknown as`
        // at their authoring sites. We only assign when the source
        // actually carried the field, so legacy programs without canonical
        // truth stay untouched (no `undefined` keys introduced).
        if (sCanonical.methodStructures !== undefined) {
          Object.assign(preserved, { methodStructures: sCanonical.methodStructures })
        }
        if (sCanonical.doctrineBlockResolution !== undefined) {
          Object.assign(preserved, {
            doctrineBlockResolution: sCanonical.doctrineBlockResolution,
          })
        }
        return preserved
            })
        : [],
      
      // ==========================================================================
      // [CONTRACT NORMALIZATION] Ensure new truth contract fields always exist
      // ==========================================================================
      // These fields may be missing on older programs - provide safe defaults
      
      // selectedSkillTrace - Required for skill coverage display
      selectedSkillTrace: program.selectedSkillTrace 
        ? getSafeSkillTrace(program.selectedSkillTrace)
        : EMPTY_SKILL_TRACE,
      
      // weeklyRepresentation - Required for schedule display  
      weeklyRepresentation: program.weeklyRepresentation ?? {
        sessions: [],
        frequency: program.trainingDaysPerWeek ?? program.currentWeekFrequency ?? 4,
        distribution: 'unknown',
        weekNumber: 1,
      },
      
      // materialSkillIntent - Required for skill intent display
      materialSkillIntent: program.materialSkillIntent ?? {
        primarySkills: [],
        secondarySkills: [],
        methodsUsed: [],
        emphasis: 'general',
      },
      
      // currentWorkingProgressions - Required for progression truth display
      currentWorkingProgressions: program.currentWorkingProgressions ?? {
        planche: null,
        frontLever: null, 
        hspu: null,
        backLever: null,
        muscleUp: null,
        lSit: null,
        resolvedAt: null,
        anyConservativeStart: false,
      },
    }
    
    // [CONTRACT NORMALIZATION] Log when missing fields were normalized
    const missingFields: string[] = []
    if (!program.selectedSkillTrace) missingFields.push('selectedSkillTrace')
    if (!program.weeklyRepresentation) missingFields.push('weeklyRepresentation')
    if (!program.materialSkillIntent) missingFields.push('materialSkillIntent')
    if (!program.currentWorkingProgressions) missingFields.push('currentWorkingProgressions')
    
    if (missingFields.length > 0) {
      console.warn('[CONTRACT_NORMALIZATION] Missing fields normalized:', missingFields.join(', '))
    }
    
    // ==========================================================================
    // [BUILDER-TRUTH-PRESERVATION] Grouped-truth preservation audit
    // ==========================================================================
    // One compact summary per normalization call. Reports for each session:
    //   - blockId counts (source vs. normalized)
    //   - non-straight method counts (source vs. normalized)
    //   - styledGroups counts (source vs. normalized)
    //   - status: 'preserved' | 'downgraded' | 'absent_at_source'
    //
    // `downgraded` fires only when source had grouped truth at either level
    // but normalization lost it -- i.e. the exact destructive corridor this
    // fix closes. If this warns after the fix, the loader regressed.
    // ==========================================================================
    const countNonStraightMethods = (exs: AdaptiveExercise[] | undefined): number => {
      if (!Array.isArray(exs)) return 0
      return exs.reduce((n, ex) => {
        const m = ex?.method
        return n + (typeof m === 'string' && m.length > 0 && m !== 'straight_sets' ? 1 : 0)
      }, 0)
    }
    const countBlockIds = (exs: AdaptiveExercise[] | undefined): number => {
      if (!Array.isArray(exs)) return 0
      return exs.reduce((n, ex) => n + (typeof ex?.blockId === 'string' && ex.blockId ? 1 : 0), 0)
    }

    const preservationSummary = normalized.sessions.map((s, idx) => {
      const sourceSession = program.sessions?.[idx]
      const sourceBlockIds = countBlockIds(sourceSession?.exercises)
      const normalizedBlockIds = countBlockIds(s.exercises)
      const sourceMethods = countNonStraightMethods(sourceSession?.exercises)
      const normalizedMethods = countNonStraightMethods(s.exercises)
      const sourceStyledGroups = sourceSession?.styleMetadata?.styledGroups?.length ?? 0
      const normalizedStyledGroups = s.styleMetadata?.styledGroups?.length ?? 0

      const sourceHadGroupedTruth = sourceBlockIds > 0 || sourceMethods > 0 || sourceStyledGroups > 0
      const normalizedHasGroupedTruth = normalizedBlockIds > 0 || normalizedMethods > 0 || normalizedStyledGroups > 0

      let status: 'preserved' | 'downgraded' | 'absent_at_source'
      if (!sourceHadGroupedTruth) status = 'absent_at_source'
      else if (
        normalizedBlockIds < sourceBlockIds ||
        normalizedMethods < sourceMethods ||
        (sourceStyledGroups > 0 && normalizedStyledGroups < sourceStyledGroups) ||
        !normalizedHasGroupedTruth
      ) status = 'downgraded'
      else status = 'preserved'

      return {
        day: s.dayNumber,
        sourceBlockIds,
        normalizedBlockIds,
        sourceMethods,
        normalizedMethods,
        sourceStyledGroups,
        normalizedStyledGroups,
        status,
      }
    })

    const anyDowngraded = preservationSummary.some(x => x.status === 'downgraded')
    if (anyDowngraded) {
      console.warn('[BUILDER-TRUTH-PRESERVATION] Grouped truth DOWNGRADED during normalization:', preservationSummary)
    }

    // ==========================================================================
    // [PHASE 4W] CANONICAL PROGRAM TRUTH ENFORCEMENT
    // ==========================================================================
    // Phase 4V audited canonical-truth preservation with a coarse
    // "any-canonical-truth-lost?" warning. Phase 4W upgrades that to:
    //
    //   1. GRANULAR detection — `detectCanonicalProgramTruthDowngrade`
    //      reports per-signal loss (methodStructures /
    //      doctrineBlockResolution / methodMaterializationSummary /
    //      doctrineBlockResolutionRollup) AND per-session-coverage drop,
    //      so partial downgrades are caught (e.g. methodStructures
    //      survives but doctrineBlockResolution gets stripped).
    //
    //   2. GUARDED FAIL-LOUD enforcement —
    //      `assertCanonicalProgramTruthPreserved` THROWS in dev/test or
    //      when `SPARTANLAB_STRICT_CANONICAL_TRUTH=true`, and emits a
    //      structured `console.error` (not just `warn`) in production so
    //      regressions cannot silently render. Legacy programs (source
    //      had no canonical truth) are exempt — they still render through
    //      compatibility fallback without throwing.
    //
    // The throw happens inside the same `try` block that already wraps
    // the entire normalize body, so a strict-mode throw propagates up
    // to `normalizeProgramForDisplay`'s outer `catch` and the function
    // returns `null` (the existing failure semantic) — callers already
    // handle that. Customers in production never see a crash.
    // ==========================================================================
    const sourceCanonical = hasCanonicalProgramTruth(
      program as unknown as Parameters<typeof hasCanonicalProgramTruth>[0],
    )
    const normalizedCanonical = hasCanonicalProgramTruth(
      normalized as unknown as Parameters<typeof hasCanonicalProgramTruth>[0],
    )
    const canonicalDowngrade = detectCanonicalProgramTruthDowngrade(
      sourceCanonical,
      normalizedCanonical,
    )

    console.log('[ProgramState] Normalized program for display:', {
      originalSessions: program.sessions?.length || 0,
      normalizedSessions: normalized.sessions.length,
      hasConstraintInsight: !!program.constraintInsight,
      hasStructure: !!program.structure,
      hasEngineContext: !!program.engineContext,
      contractFieldsNormalized: missingFields.length,
      groupedTruthPreservation: preservationSummary,
      anyDowngraded,
      canonicalTruthSource: sourceCanonical.verdict,
      canonicalTruthNormalized: normalizedCanonical.verdict,
      canonicalTruthDowngradeVerdict: canonicalDowngrade.verdict,
      canonicalTruthDowngrade: canonicalDowngrade.isDowngrade
        ? {
            lostMethodStructures: canonicalDowngrade.lostMethodStructures,
            lostDoctrineBlockResolution: canonicalDowngrade.lostDoctrineBlockResolution,
            lostMethodMaterializationSummary: canonicalDowngrade.lostMethodMaterializationSummary,
            lostDoctrineBlockResolutionRollup: canonicalDowngrade.lostDoctrineBlockResolutionRollup,
            lostCanonicalSessionCoverage: canonicalDowngrade.lostCanonicalSessionCoverage,
          }
        : null,
    })

    // Throws in dev/strict mode, structured error log in production.
    // Legacy programs (source had no canonical truth) are exempt.
    assertCanonicalProgramTruthPreserved({
      source: sourceCanonical,
      normalized: normalizedCanonical,
      downgrade: canonicalDowngrade,
      context: 'normalizeProgramForDisplay',
    })

    return normalized
  } catch (err) {
    console.error('[ProgramState] Error normalizing program:', err)
    return null
  }
}

/**
 * Get unified program state - THE canonical check for program existence
 * 
 * GUARANTEED: This function NEVER throws. It always returns a valid ProgramState object.
 * 
 * Usage:
 * const { hasProgram, activeProgram } = getProgramState()
 * if (hasProgram) { ... }
 */
export function getProgramState(): ProgramState {
  try {
    let adaptiveProgram: AdaptiveProgram | null = null
    let legacyProgram: GeneratedProgram | null = null
    
    // Step 1: Try to get from canonical adaptive storage
    try {
      adaptiveProgram = getLatestAdaptiveProgram()
    } catch {
      adaptiveProgram = null
    }
    
    // Step 2: If no adaptive program, try migration from old storage
    if (!adaptiveProgram) {
      adaptiveProgram = migrateFirstProgramIfNeeded()
    }
    
    // Step 3: Legacy program fallback (old program-service system)
    try {
      legacyProgram = getLatestProgram()
    } catch {
      legacyProgram = null
    }
    
    // Prefer adaptive program over legacy
    const activeProgram = adaptiveProgram || legacyProgram
    
    // Check if adaptive program has actual runnable sessions
    // CRITICAL: Validate ALL sessions, not just the first one, to prevent downstream crashes
    const hasUsableAdaptiveProgram = validateAdaptiveProgramUsability(adaptiveProgram)
    
    // Check if legacy program exists and has training days
    const hasUsableLegacyProgram = !!(
      legacyProgram && 
      typeof legacyProgram.trainingDaysPerWeek === 'number' &&
      legacyProgram.trainingDaysPerWeek > 0
    )
    
    // Canonical hasProgram check: must have sessions array with at least one session
    const hasProgram = hasUsableAdaptiveProgram || hasUsableLegacyProgram
    const hasUsableWorkoutProgram = hasUsableAdaptiveProgram
    
    const sessionCount = adaptiveProgram?.sessions?.length || legacyProgram?.trainingDaysPerWeek || 0
    
    // PRODUCTION SAFETY: Verify state coherence before returning
    markCanonicalPathUsed('program_read')
    const safetyCheck = assertProgramStateUsable({
      hasProgram,
      hasUsableWorkoutProgram,
      sessionCount,
      adaptiveProgram,
    })
    
    // If safety check fails and should degrade, return safe default
    if (!safetyCheck.ok && safetyCheck.shouldDegrade) {
      console.warn('[ProgramState] Safety check failed, degrading to safe default:', safetyCheck.reason)
      return SAFE_DEFAULT_STATE
    }
    
    // TASK 7: Enhanced diagnostic for debugging program snapshot state
    // [freshness-sync] TASK 6: Include freshness identity in diagnostic
    const currentFreshness = getCurrentFreshnessIdentity()
    const freshnessAligned = currentFreshness?.programId === adaptiveProgram?.id
    
    console.log('[ProgramState] TASK 4: getProgramState read source:', {
      source: adaptiveProgram ? 'adaptiveProgram' : legacyProgram ? 'legacyProgram' : 'none',
      hasUsableWorkoutProgram,
      adaptiveProgramExists: !!adaptiveProgram,
      sessionCount,
      programId: adaptiveProgram?.id || 'none',
      primaryGoal: adaptiveProgram?.primaryGoal || legacyProgram?.primaryGoal || 'none',
      goalLabel: adaptiveProgram?.goalLabel || 'none',
      freshnessAligned,
      currentFreshnessId: currentFreshness?.programId || 'none',
    })
    
    // [freshness-sync] Log drift warning if detected
    if (adaptiveProgram && currentFreshness && !freshnessAligned) {
      console.warn('[surface-drift] Program read may be stale - freshness mismatch:', {
        storedProgramId: adaptiveProgram.id,
        canonicalFreshnessId: currentFreshness.programId,
      })
    }
    
    // [CONTRACT NORMALIZATION] Normalize program before returning to ensure all fields exist
    const normalizedAdaptiveProgram = adaptiveProgram 
      ? normalizeProgramForDisplay(adaptiveProgram)
      : null
    
    return {
      hasProgram,
      hasUsableWorkoutProgram,
      adaptiveProgram: normalizedAdaptiveProgram,
      legacyProgram,
      activeProgram: normalizedAdaptiveProgram || legacyProgram,
      sessionCount,
    }
  } catch (err) {
    // Absolute safety: if anything fails, return safe default
    console.error('[ProgramState] Error in getProgramState:', err)
    return SAFE_DEFAULT_STATE
  }
}

/**
 * Simple boolean check for program existence
 * Use this for quick guards, use getProgramState() when you need the program data
 * GUARANTEED: This function NEVER throws.
 */
export function hasActiveProgram(): boolean {
  try {
    return getProgramState().hasProgram
  } catch {
    return false
  }
}

// =============================================================================
// [adjustment-sync] STEP 1: CANONICAL ADJUSTMENT DISPLAY VALUES
// =============================================================================
// These helpers provide ONE source of truth for displaying program settings.
// All adjustment controls, summaries, and displays should use these.

/**
 * Get canonical training days display string from program or inputs
 * [adjustment-sync] STEP 1: Centralized training days display
 */
export function getCanonicalTrainingDaysDisplay(
  trainingDaysPerWeek: number | 'flexible' | undefined,
  scheduleMode?: 'static' | 'flexible',
  sessionCount?: number
): string {
  // Log what we're displaying
  console.log('[displayed-adjustment-truth] getCanonicalTrainingDaysDisplay:', {
    trainingDaysPerWeek,
    scheduleMode,
    sessionCount,
  })
  
  if (scheduleMode === 'flexible' || trainingDaysPerWeek === 'flexible') {
    if (sessionCount && sessionCount > 0) {
      return `Adaptive (${sessionCount} this week)`
    }
    return 'Adaptive'
  }
  
  if (typeof trainingDaysPerWeek === 'number' && trainingDaysPerWeek > 0) {
    return `${trainingDaysPerWeek} Days per Week`
  }
  
  // Fallback to session count if available
  if (sessionCount && sessionCount > 0) {
    return `${sessionCount} Sessions`
  }
  
  return 'Not set'
}

/**
 * Get canonical session duration display string
 * [adjustment-sync] STEP 1: Centralized session duration display
 */
export function getCanonicalSessionDurationDisplay(
  sessionLength: number | undefined,
  sessionDurationMode?: 'static' | 'adaptive'
): string {
  if (!sessionLength || sessionLength <= 0) {
    return 'Not set'
  }
  
  if (sessionDurationMode === 'adaptive') {
    return `~${sessionLength} min (adaptive)`
  }
  
  return `${sessionLength} min`
}

/**
 * Get adjustment state summary for verification
 * [adjustment-sync] STEP 2: Structured adjustment state for verification
 */
export interface AdjustmentVerificationState {
  settingsSaved: boolean
  rebuildAttempted: boolean
  rebuildSucceeded: boolean
  replacedProgramSnapshot: boolean
  previousProgramId: string | null
  nextProgramId: string | null
  effectiveTrainingDaysBefore: number | 'flexible' | null
  effectiveTrainingDaysAfter: number | 'flexible' | null
  previousSessionCount: number
  nextSessionCount: number
  programIdChanged: boolean
  sessionCountChanged: boolean
  trainingDaysChanged: boolean
}

/**
 * Create verification state for logging adjustment results
 */
export function createAdjustmentVerificationState(
  previous: {
    programId?: string | null
    trainingDays?: number | 'flexible' | null
    sessionCount?: number
  },
  next: {
    programId?: string | null
    trainingDays?: number | 'flexible' | null
    sessionCount?: number
  },
  result: {
    settingsSaved: boolean
    rebuildAttempted: boolean
    rebuildSucceeded: boolean
    replacedProgramSnapshot: boolean
  }
): AdjustmentVerificationState {
  return {
    ...result,
    previousProgramId: previous.programId || null,
    nextProgramId: next.programId || null,
    effectiveTrainingDaysBefore: previous.trainingDays ?? null,
    effectiveTrainingDaysAfter: next.trainingDays ?? null,
    previousSessionCount: previous.sessionCount || 0,
    nextSessionCount: next.sessionCount || 0,
    programIdChanged: previous.programId !== next.programId,
    sessionCountChanged: previous.sessionCount !== next.sessionCount,
    trainingDaysChanged: previous.trainingDays !== next.trainingDays,
  }
}
