/**
 * PROGRAM QUALITY / DOCTRINE SHARPNESS AUDIT CONTRACT — PHASE P
 *
 * =============================================================================
 * CANONICAL POST-PHASE-O QUALITY AUDIT + SAFE BOUNDED CORRECTION
 * =============================================================================
 *
 * SpartanLab already runs:
 *   onboarding/profile/settings truth
 *   → base generator / builder
 *   → doctrine / method / progression selection
 *   → Phase J/K weekly stress + recovery distribution
 *   → Phase L post-workout performance feedback adaptation
 *   → Phase M server-side parity + idempotency
 *   → Phase N persisted Neon evidence reader
 *   → Phase O deterministic trend + coach decision intelligence
 *
 * Phase P sits AFTER all of those, on the final adapted program object, and
 * answers a single question:
 *
 *   "Is this prescription doctrine-sharp, or is the chip lying about quality?"
 *
 * It is a pure deterministic resolver. It does NOT:
 *   - run another generator
 *   - swap exercises
 *   - delete selected-skill work
 *   - inject new methods or grouped structures
 *   - override Phase L safety bounds (RPE ±1, sets ±1, RPE floor 6, sets floor 2)
 *   - modify Phase O trend / coach conclusions
 *   - mutate completed days
 *   - touch user settings, onboarding, or evidence
 *   - introduce new dependencies
 *
 * It performs five audit passes and at most two bounded corrections:
 *   1. Skill carryover attribution           (audit only — proof slice)
 *   2. Tendon-protective RPE cap             (CORRECTION: targetRPE ↓ at most 1)
 *   3. Unilateral per-side note              (CORRECTION: optional note field only)
 *   4. Session-length realism warning        (audit only — Phase Q owns the lock)
 *   5. Cross-session straight-arm overlap    (audit only — session warning)
 *
 * Every correction is bounded, doctrine-obvious, completed-day-safe, and
 * recorded with explicit reason codes. Every "no change" path also records a
 * reason so consumers can verify Phase P actually ran instead of silently
 * skipping.
 *
 * The result of Phase P is:
 *   - exercise.qualityAudit  (per-row proof slice — JSON-safe)
 *   - session.qualityAudit   (per-session proof slice — JSON-safe)
 *   - top-level audit summary the diagnostic log + blueprint can consume
 *
 * NO localStorage. NO window. NO fetch. NO React. NO DB. NO Date.now in the
 * core resolver — clock is injected via options.nowIso so tests are
 * deterministic. Every output field is optional and additive so save/load
 * via whole-object spread continues to round-trip cleanly.
 */

import type {
  AdaptiveProgram,
  AdaptiveSession,
  AdaptiveExercise,
} from '../adaptive-program-builder'

// =============================================================================
// PUBLIC TYPES — all fields optional / JSON-safe / additive
// =============================================================================

/** Phase P correction kinds. Used both as audit codes and as reason tokens. */
export type QualityAuditCorrectionType =
  | 'skill_carryover_attributed'
  | 'tendon_rpe_capped'
  | 'unilateral_per_side_note_added'
  | 'session_length_warning_attached'
  | 'straight_arm_overlap_warning_attached'
  | 'no_change'

/** Stable machine reason codes — never user-facing. */
export type QualityAuditReasonCode =
  // skip / defer reasons
  | 'phase_p_completed_day_skipped'
  | 'phase_p_phase_l_mutation_takes_precedence'
  | 'phase_p_phase_o_recommends_against_correction'
  | 'phase_p_carryover_low_confidence_skipped'
  | 'phase_p_unilateral_already_noted'
  | 'phase_p_rpe_already_at_or_below_cap'
  | 'phase_p_rpe_missing_no_correction'
  | 'phase_p_session_length_within_tolerance'
  | 'phase_p_no_overlap_detected'
  | 'phase_p_overlap_already_protected_by_governor'
  // correction reasons
  | 'phase_p_tendon_rpe_cap_doctrine'
  | 'phase_p_unilateral_pattern_detected'
  | 'phase_p_carryover_high_confidence'
  | 'phase_p_carryover_medium_confidence'
  | 'phase_p_session_length_over_tolerance'
  | 'phase_p_session_length_under_tolerance'
  | 'phase_p_repeated_high_stress_pattern'

/** JSON-safe per-exercise audit stamp. Optional. */
export interface ExerciseQualityAuditStamp {
  /** True when at least one correction was applied to THIS row. */
  applied: boolean
  /** Stable correction codes applied to this row. */
  corrections: QualityAuditCorrectionType[]
  /** Stable reason codes (correction OR no-change). */
  reasonCodes: QualityAuditReasonCode[]
  /** Tiny chip label, e.g. "DOCTRINE: TENDON RPE CAP". Optional. */
  shortLabel?: string
  /** One-line plain English explanation suitable for the card. */
  conciseExplanation?: string

  // ---- correction-specific proof slices (all optional) ----

  /** Phase P attached an indirect skill-carryover attribution to this row. */
  skillCarryover?: {
    skill: string
    confidence: 'low' | 'medium' | 'high'
    rationale: string
  }
  /** Phase P capped a tendon-protective RPE target. */
  rpeCap?: {
    before: number
    after: number
    bound: 'phase_p_tendon_rpe_cap'
    reason: string
  }
  /** Phase P added a "per side" note to a unilateral exercise. */
  unilateralPerSide?: {
    addedNote: 'per side'
    detectedFrom: 'name_pattern'
  }
}

/** JSON-safe per-session audit stamp. Optional. */
export interface SessionQualityAuditStamp {
  applied: boolean
  corrections: QualityAuditCorrectionType[]
  reasonCodes: QualityAuditReasonCode[]
  shortLabel?: string
  conciseExplanation?: string

  /** Session-length realism finding. Phase P never mutates estimatedMinutes;
   *  Phase Q owns the structural lock. Phase P only stamps a verdict. */
  sessionLengthRealism?: {
    estimatedMinutes: number
    expectedMinutesLowerBound: number
    expectedMinutesUpperBound: number
    verdict: 'within_tolerance' | 'over' | 'under'
    delta: number
  }
  /** Cross-session straight-arm overlap warning. Phase K governor remains the
   *  numeric owner; Phase P only attaches a warning when both adjacent
   *  sessions are HIGH stress AND share a straight-arm pattern AND the
   *  governor did not already protect the second session. */
  straightArmOverlap?: {
    pattern: string
    previousDayNumber: number
    explanation: string
  }
  /** Roll-up of carryover skills expressed indirectly across this session. */
  carryoverSkillsExpressed?: string[]
}

/** Top-level Phase P result — JSON-safe diagnostics for logs / blueprint. */
export interface ProgramQualityAuditResult {
  changed: boolean
  /** Number of rows that received a Phase P stamp (any kind). */
  exerciseStampsApplied: number
  /** Number of sessions that received a Phase P stamp. */
  sessionStampsApplied: number
  /** Stable diagnostic counters. */
  proof: {
    sessionsAudited: number
    completedSessionsSkipped: number
    skillCarryoversAttached: number
    rpeCapsApplied: number
    unilateralNotesAdded: number
    sessionLengthWarnings: number
    sessionLengthOverWarnings: number
    sessionLengthUnderWarnings: number
    straightArmOverlapWarnings: number
  }
  reasonCodes: QualityAuditReasonCode[]
  summary: string
}

/** Phase P input options. All bounds are conservative defaults. */
export interface ProgramQualityAuditOptions {
  /** Day numbers (1-based) of sessions that have already been completed.
   *  Phase P never mutates rows or sessions whose dayNumber is in this set. */
  completedDayNumbers?: number[]
  /** RPE ceiling for tendon-protective straight-arm skill work. Default: 8. */
  tendonRpeCap?: number
  /** Tolerance band for session-length realism. ±25% of expected by default. */
  sessionLengthTolerancePct?: number
  /** Optional injected ISO clock — not used by the core algorithm but kept
   *  for forward compatibility with future windowed audits. */
  nowIso?: string
}

// =============================================================================
// PUBLIC CONSTANTS — exposed for tests / docs
// =============================================================================

export const PHASE_P_BOUNDS = Object.freeze({
  /** Maximum amount Phase P will lower targetRPE in a single correction. */
  MAX_RPE_DROP: 1,
  /** Floor for any Phase P RPE correction. Mirrors Phase L's MIN_RPE_FLOOR. */
  MIN_RPE_FLOOR: 6,
  /** Default tendon-protective RPE cap. */
  DEFAULT_TENDON_RPE_CAP: 8,
  /** Default session-length tolerance band. */
  DEFAULT_SESSION_LENGTH_TOLERANCE_PCT: 0.25,
  /** Per-set work + transition seconds used in the realism estimator. This
   *  is intentionally a coarse heuristic — Phase Q owns the precise structural
   *  lock for Full / 45 / 30 minute modes. */
  PER_SET_WORK_SECONDS: 45,
  /** Default rest seconds applied when an exercise has no restSeconds field. */
  DEFAULT_REST_SECONDS: 90,
} as const)

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

const lower = (s: string | undefined | null): string =>
  typeof s === 'string' ? s.toLowerCase() : ''

/** Lightweight straight-arm / tendon-protective skill detector. Doctrine-true
 *  set: planche, front lever, back lever, iron cross, maltese, victorian,
 *  manna, dragon flag (compression w/ straight-arm support). Returns the
 *  canonical pattern label or null. */
function detectStraightArmPattern(name: string, category: string): string | null {
  const n = lower(name)
  const c = lower(category)
  if (!n) return null
  if (n.includes('planche')) return 'planche'
  if (n.includes('front lever') || n.includes('front_lever')) return 'front_lever'
  if (n.includes('back lever') || n.includes('back_lever')) return 'back_lever'
  if (n.includes('iron cross')) return 'iron_cross'
  if (n.includes('maltese')) return 'maltese'
  if (n.includes('manna')) return 'manna'
  if (n.includes('victorian')) return 'victorian'
  // dragon flag is straight-arm-supported core compression
  if (n.includes('dragon flag')) return 'dragon_flag'
  // Some categories explicitly tag straight-arm work.
  if (c.includes('straight') && c.includes('arm')) return 'straight_arm_generic'
  return null
}

/** Detect unilateral exercises by name. Bounded keyword set so we never flag
 *  bilateral work as unilateral by accident. */
function detectUnilateral(name: string): boolean {
  const n = lower(name)
  if (!n) return false
  const keywords = [
    'pistol squat',
    'shrimp squat',
    'single-leg',
    'single leg',
    'one-leg',
    'one leg',
    'one-arm',
    'one arm',
    'single-arm',
    'single arm',
    'archer',         // archer pull-up / archer push-up
    'sl rdl',         // single-leg romanian deadlift
    'bulgarian split',
    'split squat',
    'lunge',          // generic lunge is per-side prescribed
    'step-up',
    'step up',
    'side plank',
    'copenhagen',
    'cossack',
  ]
  return keywords.some((k) => n.includes(k))
}

/** Detect carryover relationships between selected skills and an exercise.
 *  Conservative whitelist — returns null when uncertain so we don't invent
 *  attribution. Confidence is doctrine-graded:
 *    - high: direct accessory taught as a primary carryover (e.g. tuck FL row → front lever)
 *    - medium: same plane / same chain support (e.g. low-angle pull → front lever)
 *    - low: weak relationship (skipped by Phase P)
 */
function detectSkillCarryover(
  exercise: AdaptiveExercise,
  selectedSkills: readonly string[],
): { skill: string; confidence: 'low' | 'medium' | 'high'; rationale: string } | null {
  const name = lower(exercise.name)
  const category = lower(exercise.category)
  if (!name) return null

  // Build a canonical skill set for O(1) lookup.
  const skillSet = new Set(selectedSkills.map(lower))

  // ---- planche carryover ----
  if (skillSet.has('planche')) {
    if (name.includes('pseudo planche') || name.includes('pseudo-planche')) {
      return { skill: 'planche', confidence: 'high', rationale: 'pseudo-planche directly trains planche tension and lean' }
    }
    if (name.includes('planche lean')) {
      return { skill: 'planche', confidence: 'high', rationale: 'planche lean is the core capacity drill for planche' }
    }
    if (name.includes('straight arm') && (name.includes('plank') || name.includes('protraction'))) {
      return { skill: 'planche', confidence: 'medium', rationale: 'straight-arm scapular work supports planche stability' }
    }
    if (name.includes('hollow body') || name.includes('hollow hold')) {
      return { skill: 'planche', confidence: 'medium', rationale: 'hollow body builds the line position planche requires' }
    }
  }

  // ---- front lever carryover ----
  if (skillSet.has('front_lever') || skillSet.has('front lever')) {
    if (name.includes('tuck front lever') || name.includes('tuck fl')) {
      return { skill: 'front_lever', confidence: 'high', rationale: 'tuck front lever is the direct progression rung' }
    }
    if (name.includes('front lever row') || name.includes('fl row')) {
      return { skill: 'front_lever', confidence: 'high', rationale: 'front lever rows directly train the FL pull' }
    }
    if (name.includes('low row') || (name.includes('inverted row') && !name.includes('archer'))) {
      return { skill: 'front_lever', confidence: 'medium', rationale: 'low-angle pulling supports front lever scapular pull' }
    }
    if (name.includes('hollow body') || name.includes('hollow hold')) {
      return { skill: 'front_lever', confidence: 'medium', rationale: 'hollow body trains the line position FL requires' }
    }
  }

  // ---- back lever carryover ----
  if (skillSet.has('back_lever') || skillSet.has('back lever')) {
    if (name.includes('tuck back lever')) {
      return { skill: 'back_lever', confidence: 'high', rationale: 'tuck back lever is the direct progression rung' }
    }
    if (name.includes('skin the cat')) {
      return { skill: 'back_lever', confidence: 'medium', rationale: 'skin-the-cat opens the shoulder pattern back lever requires' }
    }
  }

  // ---- handstand / HSPU carryover ----
  if (skillSet.has('handstand') || skillSet.has('handstand_pushup') || skillSet.has('hspu')) {
    if (name.includes('pike push-up') || name.includes('pike pushup') || name.includes('pike push up')) {
      return { skill: 'handstand_pushup', confidence: 'high', rationale: 'pike push-ups directly train the HSPU vertical press pattern' }
    }
    if (name.includes('wall handstand') || name.includes('wall hs') || name.includes('wall walk')) {
      return { skill: 'handstand', confidence: 'high', rationale: 'wall handstand work is the direct line/balance drill' }
    }
    if (name.includes('overhead press') || name.includes('shoulder press')) {
      return { skill: 'handstand_pushup', confidence: 'medium', rationale: 'overhead pressing supports the vertical press strength HSPU needs' }
    }
  }

  // ---- muscle-up carryover ----
  if (skillSet.has('muscle_up') || skillSet.has('muscle-up') || skillSet.has('muscleup')) {
    if (name.includes('explosive pull') || name.includes('chest-to-bar') || name.includes('chest to bar')) {
      return { skill: 'muscle_up', confidence: 'high', rationale: 'explosive pulling is the direct prerequisite for muscle-up transition' }
    }
    if (name.includes('straight bar dip') || name.includes('ring dip')) {
      return { skill: 'muscle_up', confidence: 'high', rationale: 'straight-bar/ring dips train the muscle-up press-out' }
    }
    if (name.includes('weighted pull')) {
      return { skill: 'muscle_up', confidence: 'medium', rationale: 'weighted pulling builds the strength baseline for muscle-up' }
    }
  }

  // ---- dragon flag carryover ----
  if (skillSet.has('dragon_flag') || skillSet.has('dragon flag')) {
    if (name.includes('hollow body') || name.includes('hollow hold')) {
      return { skill: 'dragon_flag', confidence: 'medium', rationale: 'hollow body trains the rigid line dragon flag requires' }
    }
    if (category.includes('core') && name.includes('lever')) {
      return { skill: 'dragon_flag', confidence: 'medium', rationale: 'leg-lever core work supports dragon flag' }
    }
  }

  return null
}

/** Estimate session minutes from prescription. Coarse heuristic — Phase Q
 *  owns the precise structural lock. We deliberately accept a wide tolerance
 *  band so we only flag sessions where the gap is genuinely material. */
function estimateSessionMinutesFromPrescription(session: AdaptiveSession): number {
  if (!session || !Array.isArray(session.exercises)) return 0
  const PER_SET = PHASE_P_BOUNDS.PER_SET_WORK_SECONDS
  const DEFAULT_REST = PHASE_P_BOUNDS.DEFAULT_REST_SECONDS
  let totalSeconds = 0
  for (const ex of session.exercises) {
    if (!ex) continue
    const sets = typeof ex.sets === 'number' && ex.sets > 0 ? ex.sets : 1
    const rest = typeof ex.restSeconds === 'number' && ex.restSeconds > 0
      ? ex.restSeconds
      : DEFAULT_REST
    // Each set: PER_SET seconds of work + rest. The last set's rest does not
    // count toward session length — we approximate by (sets * PER_SET) +
    // ((sets - 1) * rest).
    totalSeconds += sets * PER_SET + Math.max(0, sets - 1) * rest
  }
  // Add a fixed warm-up / cooldown overhead estimate that is a rough function
  // of warm-up + cooldown counts.
  const warmupSets = (session.warmup ?? []).length
  const cooldownSets = (session.cooldown ?? []).length
  totalSeconds += (warmupSets + cooldownSets) * 60
  return totalSeconds / 60
}

// =============================================================================
// PHASE P — MAIN ENTRY POINT
// =============================================================================

/**
 * Run the Phase P quality / doctrine sharpness audit on a finalized program
 * (post-Phase-O). Returns the same program reference (or a shallow-cloned
 * variant of any session/exercise that was actually corrected) plus a
 * structured audit result. NEVER mutates the input object's session / exercise
 * sub-objects in place — corrections produce shallow copies so callers that
 * still hold references to the pre-Phase-P shape see no surprise mutations.
 */
export function runProgramQualityDoctrineAudit<T extends AdaptiveProgram>(
  program: T,
  options: ProgramQualityAuditOptions = {},
): { program: T; audit: ProgramQualityAuditResult } {
  const tendonCap = Math.max(
    PHASE_P_BOUNDS.MIN_RPE_FLOOR,
    options.tendonRpeCap ?? PHASE_P_BOUNDS.DEFAULT_TENDON_RPE_CAP,
  )
  const tolerancePct = Math.max(
    0.05,
    Math.min(0.5, options.sessionLengthTolerancePct ?? PHASE_P_BOUNDS.DEFAULT_SESSION_LENGTH_TOLERANCE_PCT),
  )
  const completedSet = new Set<number>(
    Array.isArray(options.completedDayNumbers) ? options.completedDayNumbers : [],
  )

  const result: ProgramQualityAuditResult = {
    changed: false,
    exerciseStampsApplied: 0,
    sessionStampsApplied: 0,
    proof: {
      sessionsAudited: 0,
      completedSessionsSkipped: 0,
      skillCarryoversAttached: 0,
      rpeCapsApplied: 0,
      unilateralNotesAdded: 0,
      sessionLengthWarnings: 0,
      sessionLengthOverWarnings: 0,
      sessionLengthUnderWarnings: 0,
      straightArmOverlapWarnings: 0,
    },
    reasonCodes: [],
    summary: '',
  }

  if (!program || !Array.isArray(program.sessions) || program.sessions.length === 0) {
    result.summary = 'No sessions to audit.'
    return { program, audit: result }
  }

  const selectedSkills: readonly string[] = Array.isArray(program.selectedSkills)
    ? program.selectedSkills
    : []

  // Build a working copy of sessions so corrections produce shallow copies.
  const newSessions: AdaptiveSession[] = []
  let anyChange = false

  for (let i = 0; i < program.sessions.length; i++) {
    const session = program.sessions[i]
    if (!session) {
      newSessions.push(session)
      continue
    }
    result.proof.sessionsAudited += 1

    // Completed days are NEVER touched. Stamp a "skipped" reason on the
    // top-level reasonCodes so audit consumers see we considered them.
    if (completedSet.has(session.dayNumber)) {
      result.proof.completedSessionsSkipped += 1
      if (!result.reasonCodes.includes('phase_p_completed_day_skipped')) {
        result.reasonCodes.push('phase_p_completed_day_skipped')
      }
      newSessions.push(session)
      continue
    }

    // Per-session audit accumulator.
    const sessionCorrections: QualityAuditCorrectionType[] = []
    const sessionReasonCodes: QualityAuditReasonCode[] = []
    const carryoverSkillsExpressed = new Set<string>()
    let sessionChanged = false

    // -----------------------------------------------------------------------
    // PASS A — per-exercise corrections / attributions
    // -----------------------------------------------------------------------
    const newExercises: AdaptiveExercise[] = []

    for (const ex of session.exercises ?? []) {
      if (!ex) {
        newExercises.push(ex)
        continue
      }

      const exCorrections: QualityAuditCorrectionType[] = []
      const exReasonCodes: QualityAuditReasonCode[] = []
      let exChanged = false

      const phaseLApplied =
        // Phase L stamp signals the row already received a bounded mutation.
        // Phase P defers and records "phase_l takes precedence" — we do NOT
        // apply our RPE cap on top of a Phase L decision.
        !!(ex as unknown as { performanceAdaptation?: { applied?: boolean } })
          .performanceAdaptation?.applied

      // -------- A1: skill carryover attribution (audit-only) --------
      let carryoverProof:
        | { skill: string; confidence: 'low' | 'medium' | 'high'; rationale: string }
        | undefined
      const carryover = detectSkillCarryover(ex, selectedSkills)
      if (carryover) {
        if (carryover.confidence === 'low') {
          exReasonCodes.push('phase_p_carryover_low_confidence_skipped')
        } else {
          carryoverProof = carryover
          exCorrections.push('skill_carryover_attributed')
          exReasonCodes.push(
            carryover.confidence === 'high'
              ? 'phase_p_carryover_high_confidence'
              : 'phase_p_carryover_medium_confidence',
          )
          carryoverSkillsExpressed.add(carryover.skill)
          result.proof.skillCarryoversAttached += 1
        }
      }

      // -------- A2: tendon-protective RPE cap (correction) --------
      let nextTargetRPE = ex.targetRPE
      let rpeCapProof: ExerciseQualityAuditStamp['rpeCap'] | undefined
      const straightArmPattern = detectStraightArmPattern(ex.name, ex.category)
      if (straightArmPattern) {
        if (typeof ex.targetRPE !== 'number') {
          exReasonCodes.push('phase_p_rpe_missing_no_correction')
        } else if (phaseLApplied) {
          exReasonCodes.push('phase_p_phase_l_mutation_takes_precedence')
        } else if (ex.targetRPE <= tendonCap) {
          exReasonCodes.push('phase_p_rpe_already_at_or_below_cap')
        } else {
          // Apply bounded cap: lower at most MAX_RPE_DROP per pass, but never
          // below tendonCap. Phase L floor (MIN_RPE_FLOOR) is the absolute
          // lower bound — we never go below it even if a future
          // configuration sets tendonCap lower.
          const after = Math.max(
            PHASE_P_BOUNDS.MIN_RPE_FLOOR,
            Math.max(tendonCap, ex.targetRPE - PHASE_P_BOUNDS.MAX_RPE_DROP),
          )
          if (after < ex.targetRPE) {
            rpeCapProof = {
              before: ex.targetRPE,
              after,
              bound: 'phase_p_tendon_rpe_cap',
              reason: `${straightArmPattern} is straight-arm tendon-protective work; RPE held at ${after} to preserve connective tissue capacity.`,
            }
            nextTargetRPE = after
            exCorrections.push('tendon_rpe_capped')
            exReasonCodes.push('phase_p_tendon_rpe_cap_doctrine')
            exChanged = true
            result.proof.rpeCapsApplied += 1
          } else {
            exReasonCodes.push('phase_p_rpe_already_at_or_below_cap')
          }
        }
      }

      // -------- A3: unilateral per-side note (correction) --------
      let nextNote = ex.note
      let unilateralProof: ExerciseQualityAuditStamp['unilateralPerSide'] | undefined
      if (detectUnilateral(ex.name)) {
        const existingNote = lower(ex.note)
        const existingReps = lower(ex.repsOrTime)
        const alreadyMarked =
          existingNote.includes('per side') ||
          existingNote.includes('each side') ||
          existingNote.includes('per leg') ||
          existingNote.includes('per arm') ||
          existingReps.includes('per side') ||
          existingReps.includes('each side') ||
          existingReps.includes('per leg') ||
          existingReps.includes('per arm')
        if (alreadyMarked) {
          exReasonCodes.push('phase_p_unilateral_already_noted')
        } else {
          // Conservative: only add a `note` if note is currently empty. We
          // never overwrite a coach-facing note with our token. If a note
          // exists but doesn't mention sides, we still attach the audit
          // proof so the card can render "per side" hint without losing the
          // existing note.
          unilateralProof = { addedNote: 'per side', detectedFrom: 'name_pattern' }
          if (!ex.note || ex.note.trim().length === 0) {
            nextNote = 'Per side'
            exChanged = true
          }
          exCorrections.push('unilateral_per_side_note_added')
          exReasonCodes.push('phase_p_unilateral_pattern_detected')
          result.proof.unilateralNotesAdded += 1
        }
      }

      // -------- assemble the per-row audit stamp --------
      const hasAnyAudit =
        exCorrections.length > 0 || exReasonCodes.length > 0 || !!carryoverProof || !!rpeCapProof

      if (!hasAnyAudit) {
        newExercises.push(ex)
        continue
      }

      // Build the concise explanation + short label from the dominant correction.
      let shortLabel: string | undefined
      let conciseExplanation: string | undefined
      if (exCorrections.includes('tendon_rpe_capped') && rpeCapProof) {
        shortLabel = 'TENDON RPE CAP'
        conciseExplanation = rpeCapProof.reason
      } else if (exCorrections.includes('skill_carryover_attributed') && carryoverProof) {
        shortLabel = 'SKILL CARRYOVER'
        conciseExplanation = `Supports ${carryoverProof.skill.replace(/_/g, ' ')}: ${carryoverProof.rationale}.`
      } else if (exCorrections.includes('unilateral_per_side_note_added') && unilateralProof) {
        shortLabel = 'PER SIDE'
        conciseExplanation = 'Unilateral exercise — sets / reps prescribed per side.'
      }

      const qualityAudit: ExerciseQualityAuditStamp = {
        applied: exChanged,
        corrections: exCorrections.length > 0 ? exCorrections : ['no_change'],
        reasonCodes: exReasonCodes,
        shortLabel,
        conciseExplanation,
        skillCarryover: carryoverProof,
        rpeCap: rpeCapProof,
        unilateralPerSide: unilateralProof,
      }

      // Accumulate session-level corrections from each row that materially
      // changed (so the session header can show a roll-up).
      for (const c of exCorrections) {
        if (!sessionCorrections.includes(c)) sessionCorrections.push(c)
      }
      for (const r of exReasonCodes) {
        if (!sessionReasonCodes.includes(r)) sessionReasonCodes.push(r)
      }

      if (exChanged) {
        sessionChanged = true
        result.exerciseStampsApplied += 1
        // Shallow-copy this row so the original is untouched.
        const corrected: AdaptiveExercise = {
          ...ex,
          targetRPE: nextTargetRPE,
          note: nextNote,
          qualityAudit,
        }
        newExercises.push(corrected)
      } else {
        // Even when nothing was numerically changed, we still attach the
        // audit slice so the card can render attribution / no-change reason.
        result.exerciseStampsApplied += 1
        const stamped: AdaptiveExercise = {
          ...ex,
          qualityAudit,
        }
        newExercises.push(stamped)
      }
    }

    // -----------------------------------------------------------------------
    // PASS B — session-length realism (audit-only)
    // -----------------------------------------------------------------------
    let sessionLengthRealism: SessionQualityAuditStamp['sessionLengthRealism']
    {
      const expected = estimateSessionMinutesFromPrescription({
        ...session,
        exercises: newExercises,
      })
      const stated = typeof session.estimatedMinutes === 'number' && session.estimatedMinutes > 0
        ? session.estimatedMinutes
        : 0
      if (stated > 0 && expected > 0) {
        const lowerBound = expected * (1 - tolerancePct)
        const upperBound = expected * (1 + tolerancePct)
        const delta = stated - expected
        let verdict: 'within_tolerance' | 'over' | 'under' = 'within_tolerance'
        if (stated > upperBound) verdict = 'under' // stated label is HIGHER than expected band → session likely under-runs the label
        else if (stated < lowerBound) verdict = 'over' // stated label is LOWER than expected band → session likely over-runs the label
        sessionLengthRealism = {
          estimatedMinutes: Math.round(stated),
          expectedMinutesLowerBound: Math.round(lowerBound),
          expectedMinutesUpperBound: Math.round(upperBound),
          verdict,
          delta: Math.round(delta),
        }
        if (verdict === 'within_tolerance') {
          sessionReasonCodes.push('phase_p_session_length_within_tolerance')
        } else if (verdict === 'over') {
          sessionReasonCodes.push('phase_p_session_length_over_tolerance')
          sessionCorrections.push('session_length_warning_attached')
          result.proof.sessionLengthWarnings += 1
          result.proof.sessionLengthOverWarnings += 1
        } else {
          sessionReasonCodes.push('phase_p_session_length_under_tolerance')
          sessionCorrections.push('session_length_warning_attached')
          result.proof.sessionLengthWarnings += 1
          result.proof.sessionLengthUnderWarnings += 1
        }
      }
    }

    // -----------------------------------------------------------------------
    // PASS C — cross-session straight-arm overlap (audit-only)
    // -----------------------------------------------------------------------
    let straightArmOverlap: SessionQualityAuditStamp['straightArmOverlap']
    if (i > 0) {
      const prev = program.sessions[i - 1]
      const prevHigh = prev?.stressLevel === 'HIGH'
      const thisHigh = session.stressLevel === 'HIGH'
      if (prevHigh && thisHigh && Array.isArray(prev?.exercises)) {
        const prevPatterns = new Set(
          prev.exercises
            .map((e) => (e ? detectStraightArmPattern(e.name, e.category) : null))
            .filter((p): p is string => !!p),
        )
        const thisPatterns: string[] = newExercises
          .map((e) => (e ? detectStraightArmPattern(e.name, e.category) : null))
          .filter((p): p is string => !!p)
        const overlap = thisPatterns.find((p) => prevPatterns.has(p))
        // If Phase K governor already softened THIS row's prescription, do
        // NOT add a duplicate warning — we defer to the governor's proof.
        const governorAlreadyProtected = newExercises.some(
          (e) => !!(e as unknown as { stressAdjustmentDelta?: unknown }).stressAdjustmentDelta,
        )
        if (overlap && !governorAlreadyProtected) {
          straightArmOverlap = {
            pattern: overlap,
            previousDayNumber: prev.dayNumber,
            explanation: `Repeated ${overlap.replace(/_/g, ' ')} stress on consecutive HIGH-stress days — monitor connective tissue load.`,
          }
          sessionCorrections.push('straight_arm_overlap_warning_attached')
          sessionReasonCodes.push('phase_p_repeated_high_stress_pattern')
          result.proof.straightArmOverlapWarnings += 1
        } else if (governorAlreadyProtected) {
          sessionReasonCodes.push('phase_p_overlap_already_protected_by_governor')
        } else {
          sessionReasonCodes.push('phase_p_no_overlap_detected')
        }
      } else {
        sessionReasonCodes.push('phase_p_no_overlap_detected')
      }
    }

    // -----------------------------------------------------------------------
    // Stamp session-level audit
    // -----------------------------------------------------------------------
    const hasSessionFinding =
      sessionCorrections.length > 0 ||
      sessionReasonCodes.length > 0 ||
      carryoverSkillsExpressed.size > 0 ||
      !!sessionLengthRealism ||
      !!straightArmOverlap

    let nextSession: AdaptiveSession = sessionChanged
      ? { ...session, exercises: newExercises }
      : session

    if (hasSessionFinding) {
      let shortLabel: string | undefined
      let conciseExplanation: string | undefined
      if (sessionCorrections.includes('straight_arm_overlap_warning_attached') && straightArmOverlap) {
        shortLabel = 'OVERLAP WATCH'
        conciseExplanation = straightArmOverlap.explanation
      } else if (sessionCorrections.includes('session_length_warning_attached') && sessionLengthRealism) {
        shortLabel = 'TIME REALISM'
        conciseExplanation =
          sessionLengthRealism.verdict === 'over'
            ? 'Estimated duration may run longer than the selected mode.'
            : 'Estimated duration may finish earlier than the selected mode.'
      } else if (carryoverSkillsExpressed.size > 0) {
        shortLabel = 'SKILL CARRYOVER'
        conciseExplanation = `Indirect support for ${[...carryoverSkillsExpressed].join(', ').replace(/_/g, ' ')}.`
      }

      const sessionAudit: SessionQualityAuditStamp = {
        applied: sessionCorrections.length > 0 && sessionCorrections.some((c) => c !== 'no_change'),
        corrections: sessionCorrections.length > 0 ? sessionCorrections : ['no_change'],
        reasonCodes: sessionReasonCodes,
        shortLabel,
        conciseExplanation,
        sessionLengthRealism,
        straightArmOverlap,
        carryoverSkillsExpressed:
          carryoverSkillsExpressed.size > 0 ? [...carryoverSkillsExpressed] : undefined,
      }

      nextSession = {
        ...nextSession,
        qualityAudit: sessionAudit,
      }
      result.sessionStampsApplied += 1

      // Roll session reason codes up to the top-level aggregate.
      for (const r of sessionReasonCodes) {
        if (!result.reasonCodes.includes(r)) result.reasonCodes.push(r)
      }
    }

    if (sessionChanged || hasSessionFinding) anyChange = true
    newSessions.push(nextSession)
  }

  result.changed = anyChange

  // Build a concise top-level summary string for the diagnostic log.
  const parts: string[] = []
  if (result.proof.skillCarryoversAttached > 0) {
    parts.push(`${result.proof.skillCarryoversAttached} carryover${result.proof.skillCarryoversAttached === 1 ? '' : 's'}`)
  }
  if (result.proof.rpeCapsApplied > 0) {
    parts.push(`${result.proof.rpeCapsApplied} tendon RPE cap${result.proof.rpeCapsApplied === 1 ? '' : 's'}`)
  }
  if (result.proof.unilateralNotesAdded > 0) {
    parts.push(
      `${result.proof.unilateralNotesAdded} per-side note${result.proof.unilateralNotesAdded === 1 ? '' : 's'}`,
    )
  }
  if (result.proof.sessionLengthWarnings > 0) {
    parts.push(
      `${result.proof.sessionLengthWarnings} session-length warning${result.proof.sessionLengthWarnings === 1 ? '' : 's'}`,
    )
  }
  if (result.proof.straightArmOverlapWarnings > 0) {
    parts.push(
      `${result.proof.straightArmOverlapWarnings} overlap warning${result.proof.straightArmOverlapWarnings === 1 ? '' : 's'}`,
    )
  }
  if (result.proof.completedSessionsSkipped > 0) {
    parts.push(
      `${result.proof.completedSessionsSkipped} completed-day skip${result.proof.completedSessionsSkipped === 1 ? '' : 's'}`,
    )
  }
  result.summary = parts.length > 0 ? parts.join(', ') : 'No quality findings.'

  if (!anyChange) {
    return { program, audit: result }
  }

  // Shallow-clone the program with the new sessions array. We deliberately
  // preserve the input reference's prototype / extra fields by spreading.
  const nextProgram = { ...program, sessions: newSessions } as T
  return { program: nextProgram, audit: result }
}
