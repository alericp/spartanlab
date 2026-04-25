// =============================================================================
// [LIVE-CORRIDOR-TRUTH-CONSOLIDATION] PRESCRIPTION DEFAULTS
//
// Single authoritative helper for resolving the DEFAULT input value the user
// should see when they open a logging card for a fresh set.
//
// CONTRACT:
//   - If the prescription specifies a rep RANGE (e.g. "4-6", "4 to 6", "4–6"),
//     the default MUST be the LOW END of the range (4).
//   - If the prescription specifies a single value (e.g. "8 reps"), use it.
//   - If the prescription string includes a leading set-count prefix
//     (e.g. "3 sets x 4-6", "3x4-6"), that leading set count MUST be ignored.
//   - For hold-based prescriptions (e.g. "30s hold", "20-30 sec"), the same
//     low-end-of-range rule applies on the seconds value.
//   - If no number is found, fall back to a documented safe default.
//
// WHY THIS HELPER EXISTS:
//   Previously, four separate sites in StreamlinedWorkoutSession.tsx and one
//   helper in buildUnifiedTransitionSnapshot all called
//   `text.match(/(\d+)/)` and used the first capture. That regex grabs the
//   FIRST number anywhere in the string - so "3 sets x 4-6" returned 3,
//   not 4, and the active card opened at 3 even though the prescription
//   range was 4-6. This helper closes that gap once and for all four sites
//   share its output bit-identically.
// =============================================================================

export interface PrescriptionSeedInput {
  /** The exercise's effective (week-scaled) repsOrTime text. */
  repsOrTime: string
  /** Whether this exercise is hold-based (seconds) vs reps-based. */
  isHold: boolean
}

/**
 * Resolve the default input seed value the user should see on a fresh set.
 *
 * Returns the LOW END of the prescribed range, or the single prescribed
 * value, or a safe fallback.
 */
export function getPrescriptionSeedValue(input: PrescriptionSeedInput): number {
  const { repsOrTime, isHold } = input
  const text = (repsOrTime || '').toString()
  const fallback = isHold ? 30 : 8

  if (!text) return fallback

  // Strip any leading "X sets" or "X x" prefix so the parser does not
  // mistake the set count for the rep low-end.
  //
  // Examples we want to neutralize:
  //   "3 sets x 4-6 reps"   -> "4-6 reps"
  //   "3 sets of 4 to 6"    -> "4 to 6"
  //   "3x4-6"               -> "4-6"
  //   "3 x 4-6"             -> "4-6"
  //   "3 sets, 8 reps"      -> "8 reps"
  //
  // We deliberately do NOT touch text that does not match a set-count prefix,
  // so prescriptions like "4-6 reps" pass through unchanged.
  const setPrefixStripped = text
    .replace(/^\s*\d+\s*(?:sets?\s+(?:of|x|×)\s+|sets?\s*[,:]\s*|x\s+|×\s+|x|×)/i, '')
    .trim()

  // Range pattern: "4-6", "4–6" (en dash), "4—6" (em dash), "4 to 6"
  // First capture group is the LOW end.
  const rangeMatch = setPrefixStripped.match(
    /(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)/i
  )
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1])
    if (Number.isFinite(low) && low > 0) {
      return Math.round(low)
    }
  }

  // Single-value pattern after stripping set prefix.
  const singleMatch = setPrefixStripped.match(/(\d+(?:\.\d+)?)/)
  if (singleMatch) {
    const v = parseFloat(singleMatch[1])
    if (Number.isFinite(v) && v > 0) {
      return Math.round(v)
    }
  }

  return fallback
}

/**
 * Convenience wrapper for the very common `match(/(\d+)/)`-style call sites
 * that historically only had `repsOrTime` and an isHold inference. Returns
 * the canonical low-end seed value.
 */
export function parseLowEndReps(repsOrTime: string | null | undefined): number {
  return getPrescriptionSeedValue({
    repsOrTime: repsOrTime || '',
    isHold: false,
  })
}
