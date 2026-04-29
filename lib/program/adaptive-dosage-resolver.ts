// =============================================================================
// ADAPTIVE EXERCISE DOSAGE RESOLVER (Step 5 of 19)
//
// Single authoritative resolver for an exercise's training dosage.
//
// WHY THIS EXISTS
// ----------------
// Step 4B fixed unit truth (a Wall Handstand Hold no longer renders reps).
// But the resulting prescription was "3 × 6s" — technically time-based and
// still wrong for the athlete. Root cause: the upstream skill-prescription
// rule (getSkillPrescriptionRules in lib/engine-quality-contract.ts) keyed
// hold duration off the USER'S primary goal (planche / front_lever / etc.),
// NOT off the exercise's identity. So a Wall Handstand Hold inherited
// `static_planche` rules (holdSecondsRange = [3, 6]) when the user's primary
// goal was planche, and the row rendered as a planche-shaped 6-second hold
// despite being a handstand-position drill.
//
// This module:
//
//   1. Infers a SKILL IDENTITY from the exercise itself
//      (id / transferTo / movementPattern / name) — not from the user's goal.
//   2. Returns a profile-calibrated dosage object (sets, duration / rep
//      range, RPE, rest, progression mode, purpose, visible coach reason)
//      tied to that identity and the athlete's level.
//   3. Applies a minimum-effective-dose guardrail so a main skill exposure
//      cannot collapse into a useless primer dose without explicit reason.
//
// Scope for Step 5
// -----------------
// We intentionally keep the resolver narrow: handstand-position holds are
// the exercise family that produced the visible "3 × 6s" failure and the
// one with the clearest mis-routing today. Other skill identities
// (lever holds, planche holds, compression holds) continue to flow through
// the existing goal-keyed path until a future step audits them with the
// same approach. The resolver returns `null` when it cannot confidently
// classify, so the caller can fall back to the existing logic without
// regression risk.
//
// Output shape — visible coach reason
// -----------------------------------
// `visibleCoachReason` is computed from the resolved purpose + athlete
// level + role; it is NOT cosmetic copy invented from thin air. The
// structured object travels with the SelectedExercise so any future card
// renderer can surface it (Step 5+ does not yet wire the new copy into
// the visible card surface — that is a stage-2 task once dosage truth is
// stable). The dosage NUMBERS, however, do flow through to the Program
// page and the live workout via the existing repsOrTime / sets fields,
// which is what the user sees today.
// =============================================================================

import type { Exercise } from '../adaptive-exercise-pool'
import type { ExperienceLevel } from '../program-service'

// -----------------------------------------------------------------------------
// PUBLIC TYPES
// -----------------------------------------------------------------------------

export type AdaptiveSkillIdentity =
  | 'handstand_position' // Wall HS hold, chest-to-wall HS hold, box pike HS hold
  | 'unknown'

export type AdaptiveProgressionMode =
  | 'duration_then_progression' // Add seconds, then move to a harder shape
  | 'add_reps' // Add reps within band
  | 'add_load' // Add weight
  | 'reduce_assistance' // Drop band color / reduce help
  | 'maintain' // Hold steady — recovery / acclimation

export type AdaptivePurpose =
  | 'handstand_line_reacclimation' // Rebuild stacked position after layoff
  | 'handstand_position_strength' // Capacity / time-under-tension at line
  | 'hspu_prerequisite' // Position quality required for HSPU
  | 'primer_micro_dose' // Tiny exposure before heavier work
  | 'unknown'

export interface AdaptiveDosageDecision {
  /** Resolved skill identity, derived from the exercise (not the user's goal). */
  skillIdentity: AdaptiveSkillIdentity
  /** Number of working sets. */
  sets: number
  /** Display string the renderer + live workout already consume (e.g. "25-40s"). */
  repsOrTime: string
  /**
   * Structured target. `type='duration'` for holds. min/max are seconds for
   * duration targets, reps for rep targets.
   */
  target: {
    type: 'duration' | 'reps'
    min: number
    max: number
    /** Pre-formatted string matching `repsOrTime`. */
    display: string
  }
  /** Coaching RPE band, e.g. "RPE 6.5-7.5". */
  rpeTarget: string
  /** Numeric RPE used by downstream display contracts. */
  rpeNumeric: number
  /** Rest range in seconds. */
  restSeconds: { min: number; max: number; recommended: number }
  /** Selected progression strategy for the next session. */
  progressionMode: AdaptiveProgressionMode
  /** Intent of the row — what the dosage is FOR. */
  purpose: AdaptivePurpose
  /**
   * Confidence in the dosage decision.
   *  - profile_backed: athlete profile / level supplied a clear calibration
   *  - default_calibrated: profile thin, used a level-keyed default
   *  - fallback: input was ambiguous, used safest credible band
   */
  confidence: 'profile_backed' | 'default_calibrated' | 'fallback'
  /** Why this is conservative (when applicable). */
  safetyReason:
    | 'conservative_re_entry'
    | 'beginner_acclimation'
    | 'intermediate_progression'
    | 'advanced_quality_focus'
    | 'primer_role'
  /**
   * Visible coach reason, derived from the structured fields above. Not
   * cosmetic — every clause is tied to a resolved field. Safe to render
   * directly in the card if a future step wires it into the surface.
   */
  visibleCoachReason: string
}

export interface AdaptiveDosageInput {
  exercise: Exercise
  experienceLevel: ExperienceLevel
  /**
   * Optional role hint from the session-architecture layer. When present,
   * a 'primer' role downshifts dosage and renames the purpose; everything
   * else uses the main-skill calibration.
   */
  exerciseRoleHint?: 'primer' | 'main_skill' | 'support' | null
  /**
   * Optional fatigue hint. 'fatigued' nudges sets/duration to the lower
   * end of the band but never below minimum effective dose unless a
   * primer / safety reason is supplied.
   */
  fatigueState?: 'fresh' | 'moderate' | 'fatigued' | null
  /**
   * Optional ability anchors from onboarding. Future steps will populate
   * these from the onboarding hydration layer; for Step 5 they are
   * accepted but optional. Presence of any anchor moves the dosage one
   * tier higher than experienceLevel alone would suggest.
   */
  abilityAnchors?: {
    /** True if athlete reports a meaningful wall handstand hold history. */
    handstandHoldSeconds?: number | null
    /** True if athlete reports prior freestanding HSPU strength. */
    hadFreestandingHspu?: boolean | null
  } | null
}

// -----------------------------------------------------------------------------
// IDENTITY INFERENCE
// -----------------------------------------------------------------------------

/**
 * Decide whether the exercise is a HANDSTAND POSITION HOLD.
 *
 * We require positive evidence on identity AND on the prescription being
 * a hold (isIsometric or "hold" in the name). This avoids accidentally
 * classifying Wall Walks / Wall Toe Pulls / Handstand Shoulder Taps —
 * those are reps-shaped drills and are correctly excluded.
 */
function isHandstandPositionHold(exercise: Exercise): boolean {
  const id = (exercise.id || '').toLowerCase()
  const name = (exercise.name || '').toLowerCase()
  const transferTo = exercise.transferTo || []
  const isHoldShape = exercise.isIsometric === true || /\bhold\b/.test(name)
  if (!isHoldShape) return false

  // ID-driven matches (most reliable signal)
  if (id === 'wall_hs_hold') return true
  if (id === 'wall_handstand_hold') return true
  if (id === 'c2w_handstand_hold' || id === 'chest_to_wall_handstand_hold') return true
  if (id === 'box_pike_handstand_hold' || id === 'box_pike_hold') return true
  if (id === 'elevated_pike_handstand_hold') return true

  // Name-driven matches for entries that reach the resolver via display
  // pipelines without canonical ids (live workout normalizer, etc.).
  if (/\b(?:wall|chest[\s-]?to[\s-]?wall|c2w)\s+(?:handstand|hs)\s+hold\b/.test(name)) return true
  if (/\bbox\s+pike\s+(?:handstand\s+)?hold\b/.test(name)) return true
  if (/\belevated\s+pike\s+(?:handstand\s+)?hold\b/.test(name)) return true

  // transferTo-based fallback: a hold that explicitly transfers to HSPU
  // and lives in the vertical-push pattern is a handstand-position drill.
  const transfersToHspu = transferTo.some((t) =>
    /handstand_pushup|hspu|handstand_push_up/.test(t),
  )
  if (transfersToHspu && exercise.movementPattern === 'vertical_push') {
    // Only accept when the name contains "hold" or the pool flagged it
    // isometric — guards against rep drills that also transfer to HSPU.
    if (/\bhold\b/.test(name) || exercise.isIsometric === true) return true
  }
  return false
}

/**
 * Public identity inference. Currently only resolves the handstand-position
 * family; everything else returns 'unknown' so the caller falls back to
 * existing logic.
 */
export function inferExerciseSkillIdentity(exercise: Exercise): AdaptiveSkillIdentity {
  if (isHandstandPositionHold(exercise)) return 'handstand_position'
  return 'unknown'
}

// -----------------------------------------------------------------------------
// HANDSTAND-POSITION DOSAGE BANDS
// -----------------------------------------------------------------------------

interface HandstandBand {
  setsMin: number
  setsRecommended: number
  setsMax: number
  durationMin: number
  durationMax: number
  rpeNumeric: number
  rpeText: string
  restMin: number
  restMax: number
  restRecommended: number
}

/**
 * Profile-calibrated dosage bands for handstand-position holds.
 *
 * These guardrails are chosen so a main skill exposure produces a
 * coaching-credible duration that actually rebuilds line quality without
 * grinding into fatigue. They differentiate beginner / intermediate /
 * advanced re-entry — distinct from the old "all conservative = beginner"
 * conflation that produced 3 × 6s for an advanced athlete.
 */
const HANDSTAND_BANDS: Record<'beginner' | 'intermediate' | 'advanced', HandstandBand> = {
  beginner: {
    setsMin: 3,
    setsRecommended: 3,
    setsMax: 4,
    durationMin: 15,
    durationMax: 25,
    rpeNumeric: 6,
    rpeText: 'RPE 6',
    restMin: 60,
    restMax: 120,
    restRecommended: 90,
  },
  intermediate: {
    setsMin: 3,
    setsRecommended: 3,
    setsMax: 4,
    durationMin: 20,
    durationMax: 35,
    rpeNumeric: 7,
    rpeText: 'RPE 6.5-7.5',
    restMin: 75,
    restMax: 120,
    restRecommended: 90,
  },
  advanced: {
    setsMin: 3,
    setsRecommended: 4,
    setsMax: 5,
    durationMin: 25,
    durationMax: 45,
    rpeNumeric: 7,
    rpeText: 'RPE 7',
    restMin: 90,
    restMax: 150,
    restRecommended: 120,
  },
}

/**
 * Pick the dosage tier from athlete level + ability anchors. Anchors that
 * indicate prior strength (≥ 30s wall handstand, or prior freestanding
 * HSPU) bump the tier up by one — so a 'beginner'-tagged user with
 * relevant history still gets calibrated re-entry dosage rather than
 * baby dosage.
 */
function pickHandstandTier(
  level: ExperienceLevel,
  anchors?: AdaptiveDosageInput['abilityAnchors'],
): 'beginner' | 'intermediate' | 'advanced' {
  let base: 'beginner' | 'intermediate' | 'advanced'
  if (level === 'beginner') base = 'beginner'
  else if (level === 'intermediate') base = 'intermediate'
  else base = 'advanced' // advanced or anything else maps to advanced

  const anchorBoost =
    !!anchors &&
    (((anchors.handstandHoldSeconds ?? 0) >= 30) ||
      anchors.hadFreestandingHspu === true)

  if (!anchorBoost) return base
  if (base === 'beginner') return 'intermediate'
  if (base === 'intermediate') return 'advanced'
  return 'advanced'
}

function safetyReasonFor(
  tier: 'beginner' | 'intermediate' | 'advanced',
): AdaptiveDosageDecision['safetyReason'] {
  if (tier === 'beginner') return 'beginner_acclimation'
  if (tier === 'intermediate') return 'intermediate_progression'
  return 'advanced_quality_focus'
}

function buildVisibleCoachReason(
  purpose: AdaptivePurpose,
  tier: 'beginner' | 'intermediate' | 'advanced',
  band: HandstandBand,
): string {
  if (purpose === 'primer_micro_dose') {
    return `Primer only — short exposure to wake up the line before main pressing work. Main HSPU dose lives elsewhere in the session.`
  }
  if (tier === 'advanced') {
    return `Line reacclimation — ${band.durationMin}–${band.durationMax}s holds long enough to rebuild stacked-shoulder position quality without grinding into fatigue. Foundation for HSPU strength carryover.`
  }
  if (tier === 'intermediate') {
    return `HSPU position work — ${band.durationMin}–${band.durationMax}s holds reinforce stacked wrists/shoulders and prep for vertical pressing volume.`
  }
  return `Handstand line practice — ${band.durationMin}–${band.durationMax}s holds build inverted comfort and shoulder stability before adding pressing reps.`
}

// -----------------------------------------------------------------------------
// PUBLIC RESOLVER
// -----------------------------------------------------------------------------

/**
 * Resolve adaptive dosage for an exercise.
 *
 * Returns a structured decision when the resolver classifies the exercise
 * (currently: handstand-position holds), or `null` to signal the caller
 * should fall back to existing logic.
 */
export function resolveAdaptiveExerciseDosage(
  input: AdaptiveDosageInput,
): AdaptiveDosageDecision | null {
  const identity = inferExerciseSkillIdentity(input.exercise)
  if (identity === 'unknown') return null

  if (identity === 'handstand_position') {
    return resolveHandstandPositionDosage(input)
  }
  return null
}

function resolveHandstandPositionDosage(
  input: AdaptiveDosageInput,
): AdaptiveDosageDecision {
  const tier = pickHandstandTier(input.experienceLevel, input.abilityAnchors)
  const band = HANDSTAND_BANDS[tier]

  // Role: primer downshifts dosage and renames purpose. Otherwise main.
  const isPrimer = input.exerciseRoleHint === 'primer'

  // Fatigue: nudge sets to floor when fatigued; never below minimum
  // effective dose unless a primer or safety reason justifies it.
  let sets = band.setsRecommended
  if (input.fatigueState === 'fatigued' && !isPrimer) {
    sets = Math.max(band.setsMin, sets - 1)
  }
  if (isPrimer) {
    sets = 2
  }

  // Duration band: primer collapses to a short controlled exposure;
  // otherwise the full tier band is preserved (this is the key fix —
  // we no longer shrink "advanced" to a 6s hold).
  const durationMin = isPrimer ? 8 : band.durationMin
  const durationMax = isPrimer ? 12 : band.durationMax
  const display = `${durationMin}-${durationMax}s`

  const purpose: AdaptivePurpose = isPrimer
    ? 'primer_micro_dose'
    : tier === 'advanced'
      ? 'handstand_line_reacclimation'
      : tier === 'intermediate'
        ? 'hspu_prerequisite'
        : 'handstand_line_reacclimation'

  const safetyReason: AdaptiveDosageDecision['safetyReason'] = isPrimer
    ? 'primer_role'
    : safetyReasonFor(tier)

  const confidence: AdaptiveDosageDecision['confidence'] = input.abilityAnchors
    ? 'profile_backed'
    : 'default_calibrated'

  return {
    skillIdentity: 'handstand_position',
    sets,
    repsOrTime: display,
    target: {
      type: 'duration',
      min: durationMin,
      max: durationMax,
      display,
    },
    rpeTarget: isPrimer ? 'RPE 5-6' : band.rpeText,
    rpeNumeric: isPrimer ? 5 : band.rpeNumeric,
    restSeconds: {
      min: isPrimer ? 30 : band.restMin,
      max: isPrimer ? 60 : band.restMax,
      recommended: isPrimer ? 45 : band.restRecommended,
    },
    progressionMode: isPrimer ? 'maintain' : 'duration_then_progression',
    purpose,
    confidence,
    safetyReason,
    visibleCoachReason: buildVisibleCoachReason(purpose, tier, band),
  }
}
