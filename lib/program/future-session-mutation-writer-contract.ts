/**
 * FUTURE SESSION MUTATION WRITER CONTRACT — MASTER-8B.7
 *
 * =============================================================================
 * OFFICIAL TYPED MUTATION WRITER DESIGN CONTRACT
 * =============================================================================
 *
 * This module defines the typed contracts for the official MASTER-8B.7 guarded
 * future-session mutation writer. Unlike the legacy Phase 13 auto-mutation,
 * this contract:
 *
 * - Requires explicit user confirmation before any mutation
 * - Only targets future uncompleted sessions
 * - Protects completed sessions absolutely
 * - Does not modify Program Cards in this gate
 * - Does not modify Live Workout in this gate
 * - Does not write to localStorage in this design step
 * - Returns design previews only, not applied mutations
 *
 * CRITICAL GUARANTEES:
 *   - Pure TypeScript, side-effect free, JSON-safe
 *   - No React imports, no UI imports, no generator imports
 *   - No localStorage/sessionStorage, no window access
 *   - No database calls, no mutation functions
 *   - mutationAllowedNow is always false in MASTER-8B.7 design gate
 *   - requiresUserConfirmation is always true
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.7 Design Gate
 */

// =============================================================================
// WRITER MODE
// =============================================================================

/**
 * The current mode/status of the future-session mutation writer.
 */
export type FutureSessionMutationWriterMode =
  | 'design_only'
  | 'preview_only'
  | 'user_confirmed_required'
  | 'disabled_no_writer'
  | 'ready_for_future_apply'

// =============================================================================
// TARGET SCOPE
// =============================================================================

/**
 * What scope the mutation writer targets.
 */
export type FutureSessionMutationTargetScope =
  | 'future_uncompleted_sessions_only'
  | 'completed_sessions_protected'
  | 'program_cards_not_changed_yet'
  | 'live_workout_not_changed_yet'

// =============================================================================
// ACTION TYPES
// =============================================================================

/**
 * Types of actions the mutation writer could propose.
 * Aligned with Program Balance Future Candidate action types.
 */
export type FutureSessionMutationActionType =
  | 'skill_frequency_adjustment'
  | 'movement_family_rebalance'
  | 'volume_adjustment'
  | 'tissue_protection'
  | 'weighted_anchor_restore'
  | 'method_density_adjustment'
  | 'warmup_cooldown_adjustment'
  | 'watch_only'

// =============================================================================
// SAFETY INVARIANT
// =============================================================================

/**
 * Safety invariant that must always be true for the writer.
 * These flags prove the writer respects all MASTER-8B.7 guarantees.
 */
export interface FutureSessionMutationSafetyInvariant {
  /** Completed sessions are never modified */
  readonly completedSessionsProtected: true
  /** Saved program is not mutated in this design gate */
  readonly savedProgramUnchanged: true
  /** User must confirm before any mutation can apply */
  readonly userConfirmationRequired: true
  /** Live workout runtime is not modified in this gate */
  readonly liveWorkoutUnchanged: true
  /** Program Cards are not modified in this gate */
  readonly programCardsUnchanged: true
  /** No automatic/silent mutation occurs */
  readonly noAutomaticMutation: true
  /** No localStorage write from this contract */
  readonly noLocalStorageWrite: true
  /** No session deletion in this design gate */
  readonly noSessionDeletion: true
}

/**
 * The canonical safety invariant for MASTER-8B.7 design gate.
 * All flags are locked to safe values.
 */
export const MASTER_8B_7_SAFETY_INVARIANT: FutureSessionMutationSafetyInvariant = {
  completedSessionsProtected: true,
  savedProgramUnchanged: true,
  userConfirmationRequired: true,
  liveWorkoutUnchanged: true,
  programCardsUnchanged: true,
  noAutomaticMutation: true,
  noLocalStorageWrite: true,
  noSessionDeletion: true,
} as const

// =============================================================================
// DESIGN PREVIEW
// =============================================================================

/**
 * A single mutation design preview for a future session candidate.
 * This is NOT an applied mutation - it's a read-only design showing what
 * COULD happen if the user confirms in a future gate.
 */
export interface FutureSessionMutationDesignPreview {
  /** Unique ID for this preview */
  readonly id: string
  /** Source candidate ID from Program Balance (if available) */
  readonly sourceCandidateId?: string
  /** Source finding ID (if available) */
  readonly sourceFindingId?: string
  /** What type of action is proposed */
  readonly actionType: FutureSessionMutationActionType
  /** Coach-readable headline */
  readonly headline: string
  /** What problem was detected */
  readonly problemDetected: string
  /** What future action is proposed */
  readonly proposedFutureAction: string
  /** What scope would be targeted */
  readonly targetScope: FutureSessionMutationTargetScope
  /** Confidence/readiness label */
  readonly confidenceLabel: 'high' | 'moderate' | 'low' | 'needs_more_data'
  /** Why mutation is blocked now */
  readonly blockedReason: string
  /** What data is needed before mutation */
  readonly dataNeeded: readonly string[]
  /** What should be preserved/protected */
  readonly preservationGuardrails: string
  /** Safety invariant proof */
  readonly safetyInvariant: FutureSessionMutationSafetyInvariant
  /** Always false in MASTER-8B.7 design gate */
  readonly mutationAllowedNow: false
  /** Always true - user must confirm */
  readonly requiresUserConfirmation: true
  /** Writer status label */
  readonly writerStatus: 'design_gate' | 'preview_only' | 'pending_user_confirmation'
}

// =============================================================================
// DESIGN BUNDLE
// =============================================================================

/**
 * Complete bundle of mutation design previews from MASTER-8B.7.
 */
export interface FutureSessionMutationDesignBundle {
  /** Source step identifier */
  readonly sourceStep: 'MASTER_8B_7'
  /** Current writer mode */
  readonly mode: FutureSessionMutationWriterMode
  /** All design previews */
  readonly previews: readonly FutureSessionMutationDesignPreview[]
  /** Count by action type */
  readonly counts: {
    readonly total: number
    readonly byActionType: Partial<Record<FutureSessionMutationActionType, number>>
  }
  /** Global safety invariant */
  readonly safetyInvariant: FutureSessionMutationSafetyInvariant
  /** Next allowed step after this gate */
  readonly nextAllowedStep: 'MASTER_8B_7_apply_gate' | 'MASTER_8B_8'
  /** Visible summary for UI */
  readonly visibleSummary: string
  /** Is any mutation currently allowed? */
  readonly mutationAllowedNow: false
}

// =============================================================================
// BUNDLE BUILDER
// =============================================================================

/**
 * Create an empty design bundle with all safety invariants.
 * Used when no candidates exist or writer is disabled.
 */
export function createEmptyDesignBundle(): FutureSessionMutationDesignBundle {
  return {
    sourceStep: 'MASTER_8B_7',
    mode: 'design_only',
    previews: [],
    counts: {
      total: 0,
      byActionType: {},
    },
    safetyInvariant: MASTER_8B_7_SAFETY_INVARIANT,
    nextAllowedStep: 'MASTER_8B_7_apply_gate',
    visibleSummary: 'MASTER-8B.7 design gate — no mutation candidates',
    mutationAllowedNow: false,
  }
}
