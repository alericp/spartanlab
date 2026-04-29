// =============================================================================
// ADAPTIVE EXERCISE DOSAGE RESOLVER (Step 5 of 19)
//
// Single authoritative resolver for an exercise's training dosage.
//
// Step 5A — UNIT TRUTH + HANDSTAND POSITION
//   Fixed Wall Handstand Hold "3 × 6s" by classifying handstand-position
//   holds from the EXERCISE itself (not the user's primary goal) and
//   returning a profile-calibrated duration band.
//
// Step 5B — INTENT-SPECIFIC NARROW RANGES
//   The Step 5A resolver only intercepted skill-hold modes. Pulling and
//   pushing strength rows still flowed through the generic
//   `weighted_strength` (3–8 reps) and `bodyweight_strength` (6–15 reps)
//   templates in `prescription-contract.ts`, so Archer Pull-Ups,
//   Explosive Pull-Ups, Chest-to-Bar Pull-Ups, Weighted Pull-Ups,
//   Weighted Dips, Wall HSPU variants, Pike Push-Ups, and Pseudo Planche
//   Push-Ups all rendered as "3–8 reps" or "6–15 reps" — broad ranges
//   that did not communicate the actual training intent.
//
//   Step 5B extends the resolver with additional skill identities so the
//   SAME authoritative path produces intent-specific narrow ranges for
//   pulling and pushing strength work:
//
//     • unilateral_pull         (Archer / Typewriter Pull-Ups)
//     • power_pull              (Explosive Pull-Ups)
//     • high_rom_pull           (Chest-to-Bar Pull-Ups)
//     • weighted_strength_pull  (Weighted Pull-Ups)
//     • standard_pull           (Pull-Ups, Chin-Ups)
//     • weighted_strength_push  (Weighted Dips)
//     • ring_dip                (Ring Dips — extra stability cost)
//     • muscle_up_transition_push (Straight-Bar Dips)
//     • hspu_strength           (Wall HSPU, HSPU Negatives, Deficit HSPU)
//     • pike_push               (Pike Push-Ups, Elevated Pike Push-Ups)
//     • planche_pushup_strength (PPPU, Planche Lean PU, Tuck Planche PU)
//
//   Each identity has an INTENT (e.g. unilateral_strength, power_output,
//   max_strength, muscle_up_support, hspu_prerequisite,
//   planche_skill_strength) which determines:
//
//     – sets / reps band (kept narrow — width ≤ 3 for high-skill work)
//     – per-side flag for unilateral movements
//     – RPE target band
//     – rest range
//     – band-assistance recommendation (where relevant)
//     – stop rule (for power movements: stop when speed/height drops)
//     – visible coach reason
//
//   The resolver is the AUTHORITATIVE source: `getPrescriptionAwarePrescription`
//   calls it BEFORE falling through to the generic prescription-contract
//   templates, so any classified exercise gets the narrow intent-specific
//   prescription. Unclassified exercises continue to fall through to the
//   existing logic — no regression risk.
// =============================================================================

import type { Exercise } from '../adaptive-exercise-pool'
import type { ExperienceLevel } from '../program-service'
import {
  type DayIntensity,
  type RangeIntent,
  snapToCanonicalRepBand,
  snapToCanonicalHoldBand,
} from './canonical-range-grammar'

export type { DayIntensity } from './canonical-range-grammar'

// -----------------------------------------------------------------------------
// PUBLIC TYPES
// -----------------------------------------------------------------------------

export type AdaptiveSkillIdentity =
  // Step 5A
  | 'handstand_position'
  // Step 5B — pulling
  | 'unilateral_pull'
  | 'power_pull'
  | 'high_rom_pull'
  | 'weighted_strength_pull'
  | 'standard_pull'
  // Step 5B — pushing
  | 'weighted_strength_push'
  | 'ring_dip'
  | 'muscle_up_transition_push'
  | 'hspu_strength'
  | 'pike_push'
  | 'planche_pushup_strength'
  | 'unknown'

export type AdaptiveProgressionMode =
  | 'duration_then_progression'
  | 'add_reps'
  | 'add_load'
  | 'reduce_assistance'
  | 'maintain'
  | 'add_reps_then_reduce_assistance'
  | 'add_reps_then_harder_variation'

export type AdaptivePurpose =
  // Step 5A
  | 'handstand_line_reacclimation'
  | 'handstand_position_strength'
  | 'hspu_prerequisite'
  | 'primer_micro_dose'
  // Step 5B — intent-specific
  | 'unilateral_strength'
  | 'skill_strength'
  | 'power_output'
  | 'power_endurance'
  | 'max_strength'
  | 'strength_volume'
  | 'hypertrophy_support'
  | 'muscle_up_support'
  | 'hspu_strength'
  | 'planche_skill_strength'
  | 'technique_practice'
  | 'unknown'

/**
 * Band-assistance guidance for movements where assistance materially
 * changes the training effect (Archer Pull-Ups, Ring Dips, etc.).
 */
export interface AdaptiveAssistanceHint {
  /** Whether assistance is required, optional, or not appropriate. */
  mode: 'none' | 'optional' | 'required'
  /** Coaching recommendation surfaced to the athlete. */
  recommendation: string
  /** Why this assistance category — supports future progression logic. */
  reason: string
}

export interface AdaptiveDosageDecision {
  skillIdentity: AdaptiveSkillIdentity
  sets: number
  /** Display string the renderer + live workout already consume. */
  repsOrTime: string
  target: {
    type: 'duration' | 'reps'
    min: number
    max: number
    /** Pre-formatted string matching `repsOrTime`. */
    display: string
    /** True if reps are PER SIDE rather than total reps. */
    perSide?: boolean
  }
  rpeTarget: string
  rpeNumeric: number
  restSeconds: { min: number; max: number; recommended: number }
  progressionMode: AdaptiveProgressionMode
  purpose: AdaptivePurpose
  /** Human-readable intent label for display (e.g. "Unilateral Strength"). */
  intentLabel?: string
  /** Stop rule for power movements (e.g. "Stop when speed or height drops"). */
  stopRule?: string
  /** Assistance hint for band-eligible movements. */
  assistance?: AdaptiveAssistanceHint
  confidence: 'profile_backed' | 'default_calibrated' | 'fallback'
  safetyReason:
    | 'conservative_re_entry'
    | 'beginner_acclimation'
    | 'intermediate_progression'
    | 'advanced_quality_focus'
    | 'primer_role'
    | 'power_quality_cap'
    | 'unilateral_symmetry_cap'
    | 'skill_strength_cap'
  visibleCoachReason: string
}

export interface AdaptiveDosageInput {
  exercise: Exercise
  experienceLevel: ExperienceLevel
  exerciseRoleHint?: 'primer' | 'main_skill' | 'support' | null
  fatigueState?: 'fresh' | 'moderate' | 'fatigued' | null
  abilityAnchors?: {
    handstandHoldSeconds?: number | null
    hadFreestandingHspu?: boolean | null
  } | null
  /**
   * Step 5C — Day-level training intensity. Drives which canonical
   * rep band the resolver picks for a given intent so high/moderate/
   * low days visibly differ for the same movement family. Defaults
   * to 'moderate' when not provided.
   */
  dayIntensity?: DayIntensity | null
}

// -----------------------------------------------------------------------------
// IDENTITY INFERENCE
// -----------------------------------------------------------------------------

function isHandstandPositionHold(exercise: Exercise): boolean {
  const id = (exercise.id || '').toLowerCase()
  const name = (exercise.name || '').toLowerCase()
  const transferTo = exercise.transferTo || []
  const isHoldShape = exercise.isIsometric === true || /\bhold\b/.test(name)
  if (!isHoldShape) return false

  if (id === 'wall_hs_hold') return true
  if (id === 'wall_handstand_hold') return true
  if (id === 'c2w_handstand_hold' || id === 'chest_to_wall_handstand_hold') return true
  if (id === 'box_pike_handstand_hold' || id === 'box_pike_hold') return true
  if (id === 'elevated_pike_handstand_hold') return true

  if (/\b(?:wall|chest[\s-]?to[\s-]?wall|c2w)\s+(?:handstand|hs)\s+hold\b/.test(name)) return true
  if (/\bbox\s+pike\s+(?:handstand\s+)?hold\b/.test(name)) return true
  if (/\belevated\s+pike\s+(?:handstand\s+)?hold\b/.test(name)) return true

  const transfersToHspu = transferTo.some((t) => /handstand_pushup|hspu|handstand_push_up/.test(t))
  if (transfersToHspu && exercise.movementPattern === 'vertical_push') {
    if (/\bhold\b/.test(name) || exercise.isIsometric === true) return true
  }
  return false
}

/**
 * Public identity inference. Resolves all Step 5A/5B identities; everything
 * else returns 'unknown' so the caller falls back to existing logic.
 */
export function inferExerciseSkillIdentity(exercise: Exercise): AdaptiveSkillIdentity {
  if (isHandstandPositionHold(exercise)) return 'handstand_position'

  const id = (exercise.id || '').toLowerCase()
  const name = (exercise.name || '').toLowerCase()

  // ===== PULLING IDENTITIES =====

  // Unilateral pull: Archer / Typewriter Pull-Ups + One-Arm Row Progression
  if (
    id === 'archer_pull_up' ||
    id === 'typewriter_pull_up' ||
    id === 'one_arm_row_progression' ||
    /\barcher\s+pull/.test(name) ||
    /\btypewriter\s+pull/.test(name) ||
    /\bone[-\s]?arm\s+row/.test(name)
  ) {
    return 'unilateral_pull'
  }

  // Power pull: Explosive / Plyo Pull-Ups
  if (id === 'explosive_pull_up' || /\b(?:explosive|plyo)\s+pull/.test(name)) {
    return 'power_pull'
  }

  // High-ROM pull: Chest-to-Bar Pull-Ups
  if (id === 'chest_to_bar_pull_up' || /\bchest[\s-]?to[\s-]?bar/.test(name)) {
    return 'high_rom_pull'
  }

  // Weighted pull
  if (id === 'weighted_pull_up' || /\bweighted\s+(?:pull|chin)/.test(name)) {
    return 'weighted_strength_pull'
  }

  // Standard bodyweight pull (Pull-Ups, Chin-Ups)
  if (id === 'chin_up' || id === 'pull_up' || id === 'pullup' || /^(?:strict\s+)?(?:chin|pull)[-\s]?ups?$/.test(name)) {
    return 'standard_pull'
  }

  // ===== PUSHING IDENTITIES =====

  // Weighted dip
  if (id === 'weighted_dip' || /\bweighted\s+dip/.test(name)) {
    return 'weighted_strength_push'
  }

  // Ring dip
  if (id === 'ring_dip' || /\bring\s+dip/.test(name)) {
    return 'ring_dip'
  }

  // Muscle-up transition push: Straight-Bar Dips
  if (id === 'straight_bar_dip' || /\bstraight[\s-]?bar\s+dip/.test(name)) {
    return 'muscle_up_transition_push'
  }

  // HSPU strength: Wall HSPU (full / partial / negatives), Deficit HSPU
  if (
    id === 'wall_hspu' ||
    id === 'wall_hspu_full' ||
    id === 'wall_hspu_negative' ||
    id === 'wall_hspu_partial' ||
    id === 'deficit_hspu' ||
    /\bwall\s+hspu\b/.test(name) ||
    /\bwall\s+handstand\s+push/.test(name) ||
    /\bhspu\s+(?:negative|partial)/.test(name) ||
    /\bdeficit\s+(?:handstand\s+)?push/.test(name)
  ) {
    return 'hspu_strength'
  }

  // Pike push: Pike Push-Ups, Elevated Pike Push-Ups
  if (id === 'pike_pushup' || id === 'pike_pushup_elevated' || /\bpike\s+push[-\s]?up/.test(name)) {
    return 'pike_push'
  }

  // Planche push-up strength: PPPU, Planche Lean PU, Tuck Planche PU
  if (
    id === 'pppu' ||
    id === 'planche_lean_pushup' ||
    id === 'tuck_planche_pushup' ||
    /\bpseudo\s+planche\s+push/.test(name) ||
    /\bplanche\s+lean\s+push/.test(name) ||
    /\btuck\s+planche\s+push/.test(name)
  ) {
    return 'planche_pushup_strength'
  }

  return 'unknown'
}

// -----------------------------------------------------------------------------
// HANDSTAND-POSITION DOSAGE BANDS (Step 5A — unchanged)
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

const HANDSTAND_BANDS: Record<'beginner' | 'intermediate' | 'advanced', HandstandBand> = {
  beginner: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    durationMin: 15, durationMax: 25,
    rpeNumeric: 6, rpeText: 'RPE 6',
    restMin: 60, restMax: 120, restRecommended: 90,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    durationMin: 20, durationMax: 35,
    rpeNumeric: 7, rpeText: 'RPE 6.5-7.5',
    restMin: 75, restMax: 120, restRecommended: 90,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    durationMin: 25, durationMax: 45,
    rpeNumeric: 7, rpeText: 'RPE 7',
    restMin: 90, restMax: 150, restRecommended: 120,
  },
}

function pickHandstandTier(
  level: ExperienceLevel,
  anchors?: AdaptiveDosageInput['abilityAnchors'],
): 'beginner' | 'intermediate' | 'advanced' {
  let base: 'beginner' | 'intermediate' | 'advanced'
  if (level === 'beginner') base = 'beginner'
  else if (level === 'intermediate') base = 'intermediate'
  else base = 'advanced'

  const anchorBoost =
    !!anchors &&
    (((anchors.handstandHoldSeconds ?? 0) >= 30) || anchors.hadFreestandingHspu === true)

  if (!anchorBoost) return base
  if (base === 'beginner') return 'intermediate'
  if (base === 'intermediate') return 'advanced'
  return 'advanced'
}

// -----------------------------------------------------------------------------
// STEP 5B — INTENT-SPECIFIC DOSAGE BANDS
// -----------------------------------------------------------------------------

/** Tiered band for a rep-based identity. */
interface RepBand {
  setsMin: number
  setsRecommended: number
  setsMax: number
  repsMin: number
  repsMax: number
  perSide?: boolean
  rpeMin: number
  rpeMax: number
  rpeNumeric: number
  restMin: number
  restMax: number
  restRecommended: number
}

type Tier = 'beginner' | 'intermediate' | 'advanced'

/**
 * Pick a strength tier from athlete level. Unlike handstand_position, we
 * do NOT auto-promote beginners — these movements are already gated by
 * the selector's difficultyLevel filter and are appropriate to the
 * athlete's proven capacity.
 */
function pickStrengthTier(level: ExperienceLevel): Tier {
  if (level === 'beginner') return 'beginner'
  if (level === 'intermediate') return 'intermediate'
  return 'advanced'
}

/** Width-limit for high-skill work: never widen beyond 3 reps. */
function clampRangeWidth(
  min: number,
  max: number,
  maxWidth: number,
): { min: number; max: number } {
  if (max - min <= maxWidth) return { min, max }
  // Prefer the lower half of the band (quality over chasing top reps).
  return { min, max: min + maxWidth }
}

// ---- UNILATERAL PULL (Archer / Typewriter / One-Arm Row) -------------------
const UNILATERAL_PULL_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 2, setsRecommended: 3, setsMax: 3,
    repsMin: 3, repsMax: 5, perSide: true,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 6,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 3, repsMax: 5, perSide: true,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
  advanced: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 2, repsMax: 4, perSide: true,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 8,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
}

// ---- POWER PULL (Explosive Pull-Ups) ---------------------------------------
const POWER_PULL_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 2, setsRecommended: 3, setsMax: 3,
    repsMin: 3, repsMax: 5,
    rpeMin: 5, rpeMax: 6, rpeNumeric: 6,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 3, repsMax: 5,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 6,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    repsMin: 3, repsMax: 5,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
}

// ---- HIGH-ROM PULL (Chest-to-Bar Pull-Ups) ---------------------------------
const HIGH_ROM_PULL_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 3, repsMax: 5,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 4, repsMax: 6,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    repsMin: 5, repsMax: 7,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
}

// ---- WEIGHTED STRENGTH (Pull / Dip) ----------------------------------------
const WEIGHTED_STRENGTH_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 3, repsMax: 5,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    repsMin: 3, repsMax: 5,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 8,
    restMin: 150, restMax: 240, restRecommended: 180,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    repsMin: 3, repsMax: 5,
    rpeMin: 7, rpeMax: 9, rpeNumeric: 8,
    restMin: 150, restMax: 240, restRecommended: 180,
  },
}

// ---- STANDARD PULL (Pull-Ups, Chin-Ups) ------------------------------------
const STANDARD_PULL_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 4, repsMax: 6,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 4, setsMax: 4,
    repsMin: 5, repsMax: 7,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    repsMin: 6, repsMax: 8,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
}

// ---- RING DIP (extra stability cost) ---------------------------------------
const RING_DIP_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 3, repsMax: 5,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 4, setsMax: 4,
    repsMin: 4, repsMax: 6,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    repsMin: 5, repsMax: 7,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
}

// ---- MUSCLE-UP TRANSITION PUSH (Straight-Bar Dips) -------------------------
const MUP_TRANSITION_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 4, repsMax: 6,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 4, setsMax: 4,
    repsMin: 4, repsMax: 6,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    repsMin: 5, repsMax: 7,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
}

// ---- HSPU STRENGTH (Wall HSPU + Negatives + Deficit) -----------------------
const HSPU_STRENGTH_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 2, setsRecommended: 3, setsMax: 3,
    repsMin: 2, repsMax: 4,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 3, repsMax: 5,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 5,
    repsMin: 3, repsMax: 5,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 8,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
}

// ---- PIKE PUSH (HSPU prerequisite) -----------------------------------------
const PIKE_PUSH_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 6, repsMax: 8,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 7,
    restMin: 60, restMax: 120, restRecommended: 90,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 6, repsMax: 8,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 4,
    repsMin: 8, repsMax: 10,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
}

// ---- PLANCHE PUSH-UP STRENGTH (PPPU / Lean / Tuck) -------------------------
const PLANCHE_PUSHUP_BANDS: Record<Tier, RepBand> = {
  beginner: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 4, repsMax: 6,
    rpeMin: 6, rpeMax: 7, rpeNumeric: 7,
    restMin: 90, restMax: 120, restRecommended: 105,
  },
  intermediate: {
    setsMin: 3, setsRecommended: 3, setsMax: 4,
    repsMin: 4, repsMax: 6,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 90, restMax: 150, restRecommended: 120,
  },
  advanced: {
    setsMin: 3, setsRecommended: 4, setsMax: 4,
    repsMin: 5, repsMax: 7,
    rpeMin: 7, rpeMax: 8, rpeNumeric: 7,
    restMin: 120, restMax: 180, restRecommended: 150,
  },
}

// -----------------------------------------------------------------------------
// DOSAGE DECISION BUILDER
// -----------------------------------------------------------------------------

interface BuildDecisionInput {
  identity: AdaptiveSkillIdentity
  band: RepBand
  tier: Tier
  fatigueState?: AdaptiveDosageInput['fatigueState']
  isPrimer: boolean
  purpose: AdaptivePurpose
  intentLabel: string
  progressionMode: AdaptiveProgressionMode
  safetyReason: AdaptiveDosageDecision['safetyReason']
  /** Optional stop rule for power movements. */
  stopRule?: string
  /** Optional band-assistance hint. */
  assistance?: AdaptiveAssistanceHint
  /** Optional cue appended to visible coach reason. */
  shortCue?: string
  /** Step 5C — day intensity for canonical-band selection. */
  dayIntensity: DayIntensity
}

/**
 * Map the resolver's internal AdaptivePurpose to the canonical
 * RangeIntent vocabulary used by the canonical range grammar.
 */
function purposeToRangeIntent(purpose: AdaptivePurpose): RangeIntent {
  switch (purpose) {
    case 'max_strength':
      return 'max_strength'
    case 'strength_volume':
      return 'strength_volume'
    case 'hypertrophy_support':
      return 'hypertrophy_support'
    case 'power_output':
      return 'power_output'
    case 'power_endurance':
      return 'power_endurance'
    case 'unilateral_strength':
      return 'unilateral_strength'
    case 'skill_strength':
      return 'skill_strength'
    case 'muscle_up_support':
      return 'muscle_up_support'
    case 'hspu_strength':
      return 'hspu_strength'
    case 'hspu_prerequisite':
      return 'hspu_prerequisite'
    case 'planche_skill_strength':
      return 'planche_skill_strength'
    case 'technique_practice':
      return 'technique_practice'
    case 'primer_micro_dose':
    case 'handstand_line_reacclimation':
    case 'handstand_position_strength':
    case 'unknown':
    default:
      return 'unknown'
  }
}

function buildRepDecision(args: BuildDecisionInput): AdaptiveDosageDecision {
  const { band, fatigueState, isPrimer, dayIntensity } = args
  // Width-limit at 3 reps for high-skill movements (max_strength,
  // unilateral_strength, power_output, planche, hspu, muscle-up support).
  // For broader hypertrophy intents (pike push at advanced, standard pull),
  // allow 3 — already enforced by the band tables.
  const clamped = clampRangeWidth(band.repsMin, band.repsMax, 3)

  let sets = band.setsRecommended
  if (fatigueState === 'fatigued' && !isPrimer) {
    sets = Math.max(band.setsMin, sets - 1)
  }
  if (isPrimer) sets = Math.max(2, band.setsMin)

  // Step 5C — apply intensity-day rep adjustments BEFORE canonical snap
  // so high/moderate/low days visibly differ for the same identity.
  const preIntensityMin = isPrimer ? Math.max(2, Math.floor(clamped.min * 0.6)) : clamped.min
  const preIntensityMax = isPrimer
    ? Math.max(preIntensityMin + 1, Math.floor(clamped.max * 0.6))
    : clamped.max

  // Snap to the canonical band selected by intent + day intensity.
  // Primers always pass through with their reduced range; the band list
  // for 'technique_practice' covers their post-snap target appropriately.
  const intentForSnap: RangeIntent = isPrimer
    ? 'technique_practice'
    : purposeToRangeIntent(args.purpose)
  const snap = snapToCanonicalRepBand(
    preIntensityMin,
    preIntensityMax,
    intentForSnap,
    dayIntensity,
  )
  const repsMin = snap.band.min
  const repsMax = snap.band.max
  const perSide = !!band.perSide

  // Step 5C — derive an RPE cap for technical / low-intensity days so
  // the resolver does not push max-strength or skill-strength to RPE 8
  // on what was supposed to be a quality / motor-pattern day. Other day
  // intensities preserve the existing band RPE.
  let rpeMin = band.rpeMin
  let rpeMax = band.rpeMax
  let rpeNumeric = band.rpeNumeric
  if (dayIntensity === 'low' && !isPrimer) {
    rpeMin = Math.max(5, Math.min(band.rpeMin, 7))
    rpeMax = Math.max(rpeMin, Math.min(band.rpeMax, 7))
    rpeNumeric = Math.min(band.rpeNumeric, 7)
  }

  const display = formatRepDisplay(repsMin, repsMax, perSide)
  const rpeText = rpeMin === rpeMax ? `RPE ${rpeMin}` : `RPE ${rpeMin}-${rpeMax}`

  const rest = {
    min: isPrimer ? Math.max(45, Math.floor(band.restMin * 0.5)) : band.restMin,
    max: isPrimer ? Math.max(60, Math.floor(band.restMax * 0.5)) : band.restMax,
    recommended: isPrimer ? Math.max(60, Math.floor(band.restRecommended * 0.5)) : band.restRecommended,
  }

  // Build visible coach reason: "{Intent} · RPE x-y · {cue}".
  // When the canonical snap moved the range, we surface a brief
  // intensity-day note so the explanation chip reflects the resolver's
  // real decision rather than inventing one after the fact.
  const cue = args.shortCue ?? defaultCueFor(args.purpose, perSide)
  const intensityNote = intensityNoteFor(args.purpose, dayIntensity)
  const visibleCoachReason = [
    args.intentLabel,
    rpeText,
    cue,
    intensityNote,
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    skillIdentity: args.identity,
    sets,
    repsOrTime: display,
    target: {
      type: 'reps',
      min: repsMin,
      max: repsMax,
      display,
      perSide,
    },
    rpeTarget: rpeText,
    rpeNumeric,
    restSeconds: rest,
    progressionMode: args.progressionMode,
    purpose: args.purpose,
    intentLabel: args.intentLabel,
    stopRule: args.stopRule,
    assistance: args.assistance,
    confidence: 'default_calibrated',
    safetyReason: args.safetyReason,
    visibleCoachReason,
  }
}

/**
 * Step 5C — short, structured note about how day intensity shaped the
 * dosage. Surfaced via visibleCoachReason without long debug text.
 */
function intensityNoteFor(
  purpose: AdaptivePurpose,
  dayIntensity: DayIntensity,
): string {
  if (dayIntensity === 'high') {
    if (purpose === 'max_strength') return 'High-intensity day: heavy repeatable output'
    if (purpose === 'power_output') return 'High-intensity day: speed-priority cap'
    if (purpose === 'strength_volume') return 'High-intensity day: tight strength volume'
    return ''
  }
  if (dayIntensity === 'low') {
    if (purpose === 'max_strength' || purpose === 'strength_volume')
      return 'Technical day: quality bias, RPE capped'
    if (purpose === 'skill_strength' || purpose === 'planche_skill_strength' || purpose === 'hspu_strength')
      return 'Technical day: skill quality over volume'
    return ''
  }
  if (dayIntensity === 'density') {
    if (purpose === 'strength_volume' || purpose === 'hypertrophy_support')
      return 'Density day: higher canonical range'
    return ''
  }
  return ''
}

function formatRepDisplay(min: number, max: number, perSide: boolean): string {
  if (perSide) {
    return min === max ? `${min} / side` : `${min}-${max} / side`
  }
  return min === max ? `${min} reps` : `${min}-${max} reps`
}

function defaultCueFor(purpose: AdaptivePurpose, perSide: boolean): string {
  switch (purpose) {
    case 'unilateral_strength':
      return perSide
        ? 'Strict control; keep both sides even'
        : 'Strict control on the working arm'
    case 'skill_strength':
      return 'Quality reps only — stop before form breaks'
    case 'power_output':
      return 'Stop when speed or height drops'
    case 'power_endurance':
      return 'Maintain bar speed across reps'
    case 'max_strength':
      return 'Add load only if all sets stay clean'
    case 'strength_volume':
      return 'Repeatable output across all sets'
    case 'hypertrophy_support':
      return 'Controlled tempo, full ROM'
    case 'muscle_up_support':
      return 'Bar-path control, full lockout'
    case 'hspu_strength':
      return 'Strict ROM, full lockout'
    case 'hspu_prerequisite':
      return 'Vertical line, full ROM'
    case 'planche_skill_strength':
      return 'Maintain lean angle and scap protraction'
    case 'handstand_line_reacclimation':
      return 'Stacked shoulders, ribs in'
    case 'primer_micro_dose':
      return 'Wake up the pattern — not a working set'
    case 'technique_practice':
      return 'Clean reps, no grinders'
    default:
      return ''
  }
}

// -----------------------------------------------------------------------------
// PUBLIC RESOLVER
// -----------------------------------------------------------------------------

export function resolveAdaptiveExerciseDosage(
  input: AdaptiveDosageInput,
): AdaptiveDosageDecision | null {
  const identity = inferExerciseSkillIdentity(input.exercise)
  if (identity === 'unknown') return null

  if (identity === 'handstand_position') {
    return resolveHandstandPositionDosage(input)
  }

  // Step 5B identities all use the rep-based decision builder. We pick the
  // band table + intent metadata per identity.
  const tier = pickStrengthTier(input.experienceLevel)
  const isPrimer = input.exerciseRoleHint === 'primer'
  // Step 5C — day intensity drives canonical-band selection inside the
  // rep-decision builder so high/moderate/low days visibly differ.
  const dayIntensity: DayIntensity = input.dayIntensity ?? 'moderate'

  switch (identity) {
    case 'unilateral_pull': {
      const band = UNILATERAL_PULL_BANDS[tier]
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose: 'unilateral_strength',
        intentLabel: 'Unilateral Strength',
        progressionMode: 'add_reps_then_reduce_assistance',
        safetyReason: 'unilateral_symmetry_cap',
        dayIntensity,
        assistance: {
          mode: 'optional',
          recommendation: 'Light band only if needed to keep both sides strict',
          reason: 'Avoid turning unilateral strength into assisted volume',
        },
      })
    }

    case 'power_pull': {
      const band = POWER_PULL_BANDS[tier]
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose: 'power_output',
        intentLabel: 'Power',
        progressionMode: 'add_reps_then_harder_variation',
        safetyReason: 'power_quality_cap',
        stopRule: 'Stop when bar height or speed drops',
        dayIntensity,
        assistance: {
          mode: 'optional',
          recommendation: 'Use only enough assistance to preserve explosive height',
          reason: 'Band assistance is fine if it preserves power intent — not for volume',
        },
      })
    }

    case 'high_rom_pull': {
      const band = HIGH_ROM_PULL_BANDS[tier]
      // Step 5C — Chest-to-Bar Pull-Ups carry two valid intents depending
      // on day role: max_strength on a high day (heavy depth pulls) and
      // muscle_up_support on a moderate / volume day (transition reps).
      const purpose: AdaptivePurpose =
        dayIntensity === 'high' ? 'max_strength' : 'muscle_up_support'
      const intentLabel =
        dayIntensity === 'high' ? 'Max Strength' : 'Muscle-Up Support'
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose,
        intentLabel,
        progressionMode: 'add_reps',
        safetyReason: 'skill_strength_cap',
        shortCue: 'Lower-chest contact, no kip',
        dayIntensity,
      })
    }

    case 'weighted_strength_pull':
    case 'weighted_strength_push': {
      const band = WEIGHTED_STRENGTH_BANDS[tier]
      // Step 5C — weighted strength varies with day intensity:
      // high  -> max_strength (3-5 / 4-6)
      // moderate -> strength_volume (5-8 / 6-8)
      // low/density -> hypertrophy_support window with capped RPE
      const purpose: AdaptivePurpose =
        dayIntensity === 'moderate' || dayIntensity === 'mixed'
          ? 'strength_volume'
          : dayIntensity === 'density'
            ? 'hypertrophy_support'
            : 'max_strength'
      const intentLabel =
        purpose === 'strength_volume'
          ? 'Strength Volume'
          : purpose === 'hypertrophy_support'
            ? 'Hypertrophy Support'
            : 'Max Strength'
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose,
        intentLabel,
        progressionMode: 'add_load',
        safetyReason:
          tier === 'beginner' ? 'beginner_acclimation' : 'advanced_quality_focus',
        dayIntensity,
      })
    }

    case 'standard_pull': {
      const band = STANDARD_PULL_BANDS[tier]
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose: 'strength_volume',
        intentLabel: 'Strength Volume',
        progressionMode: 'add_reps',
        safetyReason:
          tier === 'beginner' ? 'beginner_acclimation' : 'intermediate_progression',
        dayIntensity,
      })
    }

    case 'ring_dip': {
      const band = RING_DIP_BANDS[tier]
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose: 'strength_volume',
        intentLabel: 'Strength Volume',
        progressionMode: 'add_reps',
        safetyReason: 'intermediate_progression',
        shortCue: 'Stable rings, full ROM',
        dayIntensity,
        assistance: {
          mode: 'optional',
          recommendation: 'Use band only if reps drop below target with form intact',
          reason: 'Ring stability cost is part of the training effect',
        },
      })
    }

    case 'muscle_up_transition_push': {
      const band = MUP_TRANSITION_BANDS[tier]
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose: 'muscle_up_support',
        intentLabel: 'Muscle-Up Support',
        progressionMode: 'add_reps',
        safetyReason: 'skill_strength_cap',
        shortCue: 'Bar-path control, strong lockout',
        dayIntensity,
      })
    }

    case 'hspu_strength': {
      const band = HSPU_STRENGTH_BANDS[tier]
      const isNegative =
        /negative/i.test(input.exercise.name || '') ||
        (input.exercise.id || '').includes('negative')
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose: 'hspu_strength',
        intentLabel: 'HSPU Strength',
        progressionMode: 'add_reps',
        safetyReason: 'skill_strength_cap',
        shortCue: isNegative ? 'Slow eccentric, control to bottom' : 'Strict ROM, full lockout',
        dayIntensity,
      })
    }

    case 'pike_push': {
      const band = PIKE_PUSH_BANDS[tier]
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose: 'hspu_prerequisite',
        intentLabel: 'HSPU Prerequisite',
        progressionMode: 'add_reps_then_harder_variation',
        safetyReason: 'intermediate_progression',
        shortCue: 'Vertical line, full ROM',
        dayIntensity,
      })
    }

    case 'planche_pushup_strength': {
      const band = PLANCHE_PUSHUP_BANDS[tier]
      return buildRepDecision({
        identity,
        band,
        tier,
        fatigueState: input.fatigueState,
        isPrimer,
        purpose: 'planche_skill_strength',
        intentLabel: 'Planche Skill-Strength',
        progressionMode: 'add_reps_then_harder_variation',
        safetyReason: 'skill_strength_cap',
        shortCue: 'Maintain lean angle and scap protraction',
        dayIntensity,
      })
    }

    default:
      return null
  }
}

function resolveHandstandPositionDosage(
  input: AdaptiveDosageInput,
): AdaptiveDosageDecision {
  const tier = pickHandstandTier(input.experienceLevel, input.abilityAnchors)
  const band = HANDSTAND_BANDS[tier]
  const isPrimer = input.exerciseRoleHint === 'primer'

  let sets = band.setsRecommended
  if (input.fatigueState === 'fatigued' && !isPrimer) {
    sets = Math.max(band.setsMin, sets - 1)
  }
  if (isPrimer) sets = 2

  const rawMin = isPrimer ? 8 : band.durationMin
  const rawMax = isPrimer ? 12 : band.durationMax
  // Step 5C — snap to a canonical hold band so the resolver never
  // emits arbitrary spreads like 23-47s. Tight intentional ranges
  // (<= 5s) are preserved unchanged.
  const holdSnap = snapToCanonicalHoldBand(rawMin, rawMax)
  const durationMin = holdSnap.band.min
  const durationMax = holdSnap.band.max
  const display = holdSnap.display

  const purpose: AdaptivePurpose = isPrimer
    ? 'primer_micro_dose'
    : tier === 'advanced'
      ? 'handstand_line_reacclimation'
      : tier === 'intermediate'
        ? 'hspu_prerequisite'
        : 'handstand_line_reacclimation'

  const safetyReason: AdaptiveDosageDecision['safetyReason'] = isPrimer
    ? 'primer_role'
    : tier === 'beginner'
      ? 'beginner_acclimation'
      : tier === 'intermediate'
        ? 'intermediate_progression'
        : 'advanced_quality_focus'

  const confidence: AdaptiveDosageDecision['confidence'] = input.abilityAnchors
    ? 'profile_backed'
    : 'default_calibrated'

  const intentLabel = isPrimer
    ? 'Primer'
    : tier === 'advanced'
      ? 'Handstand Line'
      : tier === 'intermediate'
        ? 'HSPU Prerequisite'
        : 'Handstand Line'

  const visibleCoachReason = isPrimer
    ? `Primer only — short exposure to wake up the line before main pressing work. Main HSPU dose lives elsewhere in the session.`
    : tier === 'advanced'
      ? `Line reacclimation — ${durationMin}-${durationMax}s holds long enough to rebuild stacked-shoulder position quality without grinding into fatigue.`
      : tier === 'intermediate'
        ? `HSPU position work — ${durationMin}-${durationMax}s holds reinforce stacked wrists/shoulders.`
        : `Handstand line practice — ${durationMin}-${durationMax}s holds build inverted comfort.`

  return {
    skillIdentity: 'handstand_position',
    sets,
    repsOrTime: display,
    target: { type: 'duration', min: durationMin, max: durationMax, display },
    rpeTarget: isPrimer ? 'RPE 5-6' : band.rpeText,
    rpeNumeric: isPrimer ? 5 : band.rpeNumeric,
    restSeconds: {
      min: isPrimer ? 30 : band.restMin,
      max: isPrimer ? 60 : band.restMax,
      recommended: isPrimer ? 45 : band.restRecommended,
    },
    progressionMode: isPrimer ? 'maintain' : 'duration_then_progression',
    purpose,
    intentLabel,
    confidence,
    safetyReason,
    visibleCoachReason,
  }
}
