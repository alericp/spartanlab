// ============================================================================
// [STEP-4I — 2 OF 3] Program Page → canonical staleness evaluator contract
// adapter.
//
// Purpose:
//   `app/(app)/program/page.tsx` calls
//   `evaluateUnifiedProgramStaleness(...)` from
//   `lib/canonical-profile-service.ts`. The evaluator's parameter has a
//   STRICT canonical contract:
//
//     {
//       primaryGoal?:         string | null
//       secondaryGoal?:       string | null
//       trainingDaysPerWeek?: number | null
//       sessionLength?:       number | null
//       scheduleMode?:        string | null
//       sessionDurationMode?: string | null
//       equipment?:           string[] | null
//       jointCautions?:       string[] | null
//       experienceLevel?:     string | null
//       selectedSkills?:      string[] | null
//       profileSnapshot?:     ProfileSnapshot | null
//     }
//
//   But the values held on `AdaptiveProgram` / `AdaptiveProgramInputs` /
//   loose page state carry RAW UI/builder unions:
//
//     - `SessionLength`           = 30 | 45 | 60 | 75 | 90 | 120
//                                  | '10-20' | '20-30' | '30-45' | '45-60' | '60+'
//     - `TrainingDaysPerWeek`     = 2 | 3 | 4 | 5 | 6 | 7 | 'flexible'
//     - `ScheduleMode`            = 'static' | 'flexible'
//
//   Passing these raw values directly into the evaluator fails the
//   `number | null` contract for sessionLength / trainingDaysPerWeek.
//   That mismatch was the root of the repeating Program Page build
//   blocker chain (PrimaryGoal scope → sessionDurationMode excess key →
//   visibleProgram.equipment invalid read → 'flexible'→number →
//   SessionLength string→number).
//
//   This file is the shared, typed, pure adapter that converts raw
//   Program Page values into evaluator-safe values, ONCE. Every
//   call into `evaluateUnifiedProgramStaleness` from the Program Page
//   routes through `buildStalenessEvaluatorProgram`. No ad-hoc local
//   normalizers. No `as any`. No fake defaults. No widening of the
//   evaluator type. No widening of `AdaptiveProgramInputs`.
//
// Doctrine alignment:
//   - 'flexible' must remain `scheduleMode`, never become a numeric day count.
//   - Non-numeric session length tokens ('60+', '10-20', '20-30',
//     '30-45', '45-60', '', undefined) become `null`. The evaluator
//     handles null correctly; inventing 60 here would corrupt
//     stale-banner truth.
//   - Empty/non-array equipment becomes `[]` (not null) — matches
//     evaluator's expected `string[] | null | undefined` shape and the
//     canonical equipment empty-state convention used elsewhere.
//   - profileSnapshot is pass-through: if it is plausibly a
//     `ProfileSnapshot`-shaped object, it is forwarded; otherwise null.
//     The evaluator already null-handles missing snapshots.
//
// Purity:
//   - No React. No browser globals (window, document, localStorage).
//   - No console output. No side effects. Idempotent.
//   - Type-only import of `ProfileSnapshot` (avoids runtime cycle with
//     canonical-profile-service.ts).
// ============================================================================

import type { ProfileSnapshot } from '@/lib/canonical-profile-service'

// The exact parameter shape `evaluateUnifiedProgramStaleness` accepts at
// `lib/canonical-profile-service.ts:1842`. Hand-mirrored here (not derived
// via `Parameters<typeof ...>`) so this file does NOT need a runtime import
// of canonical-profile-service. That keeps the adapter zero-cycle and lets
// it be safely imported from any Program Page entry point.
export interface StalenessEvaluatorInput {
  primaryGoal?: string | null
  secondaryGoal?: string | null
  trainingDaysPerWeek?: number | null
  sessionLength?: number | null
  scheduleMode?: string | null
  sessionDurationMode?: string | null
  equipment?: string[] | null
  jointCautions?: string[] | null
  experienceLevel?: string | null
  selectedSkills?: string[] | null
  profileSnapshot?: ProfileSnapshot | null
}

/**
 * Raw Program Page source shape. Every field is `unknown` so any caller
 * (AdaptiveProgram, AdaptiveProgramInputs, loose JSON snapshots, post-build
 * generator output, modify-entry construction) can pass its values through
 * without TypeScript needing to pre-narrow union members. All narrowing
 * happens inside the adapter.
 */
export interface StalenessEvaluatorRawSource {
  primaryGoal?: unknown
  secondaryGoal?: unknown
  trainingDaysPerWeek?: unknown
  sessionLength?: unknown
  scheduleMode?: unknown
  sessionDurationMode?: unknown
  equipment?: unknown
  jointCautions?: unknown
  experienceLevel?: unknown
  selectedSkills?: unknown
  profileSnapshot?: unknown
}

/**
 * Normalize a value to `number | null`. Accepts finite numbers and
 * trimmed numeric strings ('45', '60'). Rejects empty strings, all
 * non-numeric strings ('flexible', '60+', '10-20', '20-30', '30-45',
 * '45-60'), NaN, Infinity, objects, arrays, booleans, undefined, null.
 *
 * Never invents a default. Never converts 'flexible' to 7. Never
 * converts a non-numeric session-length token to 60.
 */
export function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/**
 * Normalize a value to `string | null`. Accepts non-empty strings
 * (after trimming). Rejects everything else, including empty strings.
 */
export function normalizeStringOrNull(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

/**
 * Normalize a value to `string[]`. Accepts arrays of non-empty strings;
 * filters out any non-string or empty-string elements. Rejects
 * non-array values entirely (returns []).
 */
export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is string => typeof item === 'string' && item.length > 0,
  )
}

/**
 * Pass-through guard for `ProfileSnapshot`. If the value is a plain
 * object (not array, not null, not primitive), forward it as-is — the
 * evaluator only reads documented fields and tolerates extra keys. If
 * not plausibly snapshot-shaped, return null. The cast at the return is
 * a controlled `unknown → ProfileSnapshot` narrowing at the adapter
 * edge (the prompt explicitly allows narrow `unknown`-to-specific casts
 * here; the alternative would be a deep validator that this corridor
 * does not need).
 */
function normalizeProfileSnapshot(value: unknown): ProfileSnapshot | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'object') return null
  if (Array.isArray(value)) return null
  return value as ProfileSnapshot
}

/**
 * Build the evaluator-safe program object from raw Program Page values.
 *
 * Single owner of the canonical contract boundary. Every
 * `evaluateUnifiedProgramStaleness(...)` call from
 * `app/(app)/program/page.tsx` must route through this function instead
 * of constructing its own evaluator object. The output is a
 * `StalenessEvaluatorInput` that mirrors the evaluator's accepted
 * parameter shape exactly, validated at compile time via `satisfies`.
 *
 * Field-by-field contract:
 *   - primaryGoal       string|null  (no fake 'general_fitness'; preserves PrimaryGoal as a string token)
 *   - secondaryGoal     string|null
 *   - trainingDaysPerWeek number|null  ('flexible' → null; identity preserved via scheduleMode)
 *   - sessionLength     number|null  ('60+' / '10-20' / similar → null)
 *   - scheduleMode      string|null  ('static' / 'flexible' preserved)
 *   - sessionDurationMode string|null
 *   - equipment         string[]     (always array; non-array → [])
 *   - jointCautions     string[]
 *   - experienceLevel   string|null
 *   - selectedSkills    string[]
 *   - profileSnapshot   ProfileSnapshot|null
 */
export function buildStalenessEvaluatorProgram(
  source: StalenessEvaluatorRawSource,
): StalenessEvaluatorInput {
  return {
    primaryGoal: normalizeStringOrNull(source.primaryGoal),
    secondaryGoal: normalizeStringOrNull(source.secondaryGoal),
    trainingDaysPerWeek: normalizeNullableNumber(source.trainingDaysPerWeek),
    sessionLength: normalizeNullableNumber(source.sessionLength),
    scheduleMode: normalizeStringOrNull(source.scheduleMode),
    sessionDurationMode: normalizeStringOrNull(source.sessionDurationMode),
    equipment: normalizeStringArray(source.equipment),
    jointCautions: normalizeStringArray(source.jointCautions),
    experienceLevel: normalizeStringOrNull(source.experienceLevel),
    selectedSkills: normalizeStringArray(source.selectedSkills),
    profileSnapshot: normalizeProfileSnapshot(source.profileSnapshot),
  } satisfies StalenessEvaluatorInput
}

/**
 * Greppable runtime sentinel — lets a downstream audit verify the
 * deployed bundle actually contains the Step 4I adapter extraction.
 * Pattern matches the existing `STEP4D_PROGRAM_PAGE_TYPE_SYNC_SENTINEL`
 * convention from `app/(app)/program/page.tsx`.
 */
export const STEP_4I_PROGRAM_PAGE_CONTRACT_ADAPTER_SENTINEL = {
  id: 'STEP4I_PROGRAM_PAGE_CONTRACT_ADAPTER_EXTRACTION',
  purpose:
    'Confirms the shared Program Page → staleness evaluator contract adapter is present and exported from lib/program/program-page-contract-adapter.ts',
  helperName: 'buildStalenessEvaluatorProgram',
  evaluatorOwner: 'evaluateUnifiedProgramStaleness',
  forbidsFakeDefaults: true,
  forbidsAsAny: true,
  forbidsTsIgnore: true,
  preservesFlexibleScheduleIdentity: true,
  preservesNonNumericSessionLengthAsNull: true,
  timestamp: '2026-04-29-step4i-2-of-3',
} as const
