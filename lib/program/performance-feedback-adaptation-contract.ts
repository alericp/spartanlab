/**
 * PHASE L — POST-WORKOUT PERFORMANCE FEEDBACK → FUTURE PRESCRIPTION ADAPTATION
 *
 * =============================================================================
 * PURE, JSON-SAFE, DETERMINISTIC, SIDE-EFFECT FREE.
 * =============================================================================
 *
 * Converts logged workout truth (per-exercise outcome, RPE proxies, exercise
 * notes/flags, free-text keywords) into bounded mutations on FUTURE sessions
 * of the canonical AdaptiveProgram.
 *
 * RULES:
 *   - Completed sessions are NEVER mutated.
 *   - Only future / next exposure of an exercise is adjusted.
 *   - Selected skills (planche / front lever / back lever / muscle-up / HSPU)
 *     are NEVER removed; they may have dose / RPE / progression held.
 *   - methodStructures, doctrineBlockResolution, styledGroups, blockId,
 *     methodLabel, prescribedLoad, executionTruth, coachingMeta, stress*
 *     fields, and PhaseJ live-resume fields are PRESERVED verbatim.
 *   - All numeric changes obey safe bounds (sets -1 max, RPE -1 max, hold/rep
 *     reductions in target format, ~10–20% trim unless pain/high severity).
 *   - Adaptation metadata is stamped IN PLACE on the affected exercise via
 *     `performanceAdaptation` so the visible Program card is reading the SAME
 *     mutated prescription, not a parallel cosmetic banner.
 *   - When evidence is insufficient, returns `insufficient_data` with no
 *     mutations and no fake explanations.
 *   - When a mutation is blocked by safety bounds, returns `blocked` reason
 *     for that mutation rather than silently pretending it applied.
 *
 * NO IMPORT of `localStorage`, `window`, `fetch`, React, or anything stateful.
 */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export type PerformanceSignalType =
  | 'under_target_high_rpe'
  | 'under_target_normal_rpe'
  | 'on_target_high_rpe'
  | 'on_target_normal_rpe'
  | 'above_target_low_rpe'
  | 'repeated_skill_fatigue'
  | 'repeated_strength_fatigue'
  | 'note_tension_warning'
  | 'note_pain_warning'
  | 'note_capacity_warning'
  | 'recovery_protection_triggered'
  | 'insufficient_data'

export type SignalSeverity = 'info' | 'mild' | 'moderate' | 'high'
export type SignalConfidence = 'low' | 'medium' | 'high'

export type ExerciseClass =
  | 'straight_arm_skill'
  | 'weighted_strength'
  | 'bodyweight_strength'
  | 'accessory'
  | 'mobility'
  | 'unknown'

export interface CompletedSetEvidence {
  /** Exercise display name (matched against future session exercises by lower-case). */
  exerciseName: string
  /** Stable id when available (preferred over name match). */
  exerciseId?: string
  /** Source session id (from workout log). */
  sessionId?: string
  /** Day number in current program week, when derivable from log payload. */
  dayNumber?: number
  /** 1-indexed set number; -1 means aggregated (per-exercise summary). */
  setNumber: number
  /** Prescribed reps (number) or hold (seconds) — whichever applies. */
  prescribedReps?: number
  prescribedHoldSeconds?: number
  /** Best actual reps / hold the athlete logged for this set/exercise. */
  actualReps?: number
  actualHoldSeconds?: number
  /** Prescribed load (lb/kg) when weighted. */
  prescribedLoad?: number
  actualLoad?: number
  /** Target RPE from prescription (8 default for strength). */
  prescribedRPE?: number
  /** Actual reported RPE. */
  actualRPE?: number
  /** Free-text note from set or exercise notes. */
  note?: string
  /** Structured flags from exercise notes (pain / too_hard / etc). */
  noteFlags?: string[]
  /** ISO timestamp when set/session was completed. */
  timestamp?: string
  /** Computed class so the mutator knows how protective to be. */
  exerciseClass?: ExerciseClass
  /** Convenience: completed flag from per-exercise summary. */
  completed?: boolean
  /** Whether this evidence is "trusted" (real user, not demo). */
  trusted?: boolean
}

export interface PerformanceSignal {
  signalType: PerformanceSignalType
  severity: SignalSeverity
  confidence: SignalConfidence
  exerciseName: string
  exerciseId?: string
  affectedPattern?: string
  affectedSkill?: string
  affectedSessionIds: string[]
  evidenceSummary: string
  recommendedAction: string
  exerciseClass: ExerciseClass
}

export type FutureMutationType =
  | 'reduce_next_exposure_volume'
  | 'hold_progression'
  | 'reduce_rpe_target'
  | 'extend_rest_guidance'
  | 'preserve_prescription'
  | 'increase_progression_slightly'
  | 'swap_to_regression_candidate'
  | 'add_recovery_note_only'

export type SafetyLevel = 'safe' | 'caution' | 'blocked'

export interface FuturePrescriptionMutation {
  /** Day number in program (1-based). */
  targetDayNumber: number
  /** Stable exercise id when present, else name match. */
  targetExerciseId?: string
  targetExerciseName: string
  targetPattern?: string
  mutationType: FutureMutationType
  boundsApplied: string[]
  before: {
    sets?: number
    repsOrTime?: string
    targetRPE?: number
    restSeconds?: number
  }
  after: {
    sets?: number
    repsOrTime?: string
    targetRPE?: number
    restSeconds?: number
  }
  reasonCodes: string[]
  userVisibleExplanation: string
  safetyLevel: SafetyLevel
  shouldApply: boolean
  blockedReason?: string
}

export type AdaptationStatus =
  | 'healthy'
  | 'partial'
  | 'insufficient_data'
  | 'blocked'

export interface PerformanceFeedbackAdaptationProof {
  completedSetsRead: number
  sessionsRead: number
  highRpeCount: number
  underTargetCount: number
  noteWarningsCount: number
  mutationsApplied: number
  mutationsBlocked: number
  currentProgramPreserved: boolean
}

export interface PerformanceFeedbackAdaptationResult {
  status: AdaptationStatus
  signals: PerformanceSignal[]
  mutations: FuturePrescriptionMutation[]
  summary: string
  blockedReasons: string[]
  proof: PerformanceFeedbackAdaptationProof
}

// Minimal AdaptiveExercise / AdaptiveSession / AdaptiveProgram shapes needed
// by the mutator. We keep the structural typing local so this contract has
// zero coupling beyond what it actually reads/writes.
export interface PhaseLExerciseShape {
  id?: string
  name?: string
  category?: string
  sets?: number
  repsOrTime?: string
  targetRPE?: number
  restSeconds?: number
  selectionReason?: string
  blockId?: string
  method?: string
  setExecutionMethod?: string
  performanceAdaptation?: ExercisePerformanceAdaptationStamp
}

export interface PhaseLSessionShape {
  dayNumber?: number
  dayLabel?: string
  focus?: string
  exercises?: PhaseLExerciseShape[]
  // PhaseK fields preserved verbatim
  stressLevel?: string
  recoveryCost?: string
  stressDistributionProof?: unknown
  // Method materialization preserved verbatim
  methodStructures?: unknown
  doctrineBlockResolution?: unknown
  styleMetadata?: unknown
}

export interface PhaseLProgramShape {
  id?: string
  trainingDaysPerWeek?: number
  selectedSkills?: string[] | unknown
  sessions?: PhaseLSessionShape[]
}

export interface ExercisePerformanceAdaptationStamp {
  applied: boolean
  reasonCodes: string[]
  evidenceSummary: string
  before: FuturePrescriptionMutation['before']
  after: FuturePrescriptionMutation['after']
  userVisibleExplanation: string
  source: 'phase_l_performance_feedback'
  mutationType: FutureMutationType
  safetyLevel: SafetyLevel
  /** Day this was decided for; future mutations only. */
  targetDayNumber: number
  /** ISO timestamp the overlay was computed. */
  computedAt: string
  /** Backing signal types so dev tooling can audit. */
  signalTypes: PerformanceSignalType[]
  /** Compact uppercase chip label used by the Program card. Derived
   *  deterministically from `mutationType` so the chip always agrees with
   *  the underlying mutation. */
  shortLabel: string
  /** Mutation status for display. `applied` means the bounded mutation
   *  succeeded. `blocked_by_safety_bound` means the contract chose not to
   *  apply because the change would violate a Phase L safety bound. */
  status: 'applied' | 'blocked_by_safety_bound'
}

export interface PerformanceFeedbackInput {
  currentProgram: PhaseLProgramShape | null | undefined
  /** Pre-extracted set-level evidence from canonical workout history. */
  completedSetEvidence: CompletedSetEvidence[]
  /** Day numbers (1-based, matching session.dayNumber) that have been completed
   *  this week; mutations are skipped for these and any earlier day numbers. */
  completedDayNumbers?: number[]
  /** Optional current week (1-based). Reserved for week-aware logic. */
  currentWeekNumber?: number
  /** Optional current day pointer (1-based). */
  currentDayNumber?: number
  /** ISO clock injection for deterministic tests. */
  nowIso?: string
}

// =============================================================================
// CLASSIFICATION HELPERS — pure
// =============================================================================

/** Return-true straight-arm / tendon-protective family detector. */
const STRAIGHT_ARM_KEYWORDS = [
  'planche',
  'front lever',
  'back lever',
  'iron cross',
  'maltese',
  'skin the cat',
  'dragon flag',
  'tuck lever',
  'straddle lever',
  'l-sit',
  'manna',
  'victorian',
] as const

const WEIGHTED_STRENGTH_KEYWORDS = [
  'weighted dip',
  'weighted pull',
  'weighted chin',
  'weighted muscle',
  'weighted push',
] as const

const SKILL_KEYWORDS = [
  'handstand',
  'hspu',
  'muscle-up',
  'muscle up',
  'press',
] as const

const PAIN_TOKENS = ['pain', 'sharp', 'pinch', 'tweak', 'injury', 'hurt']
const TENSION_TOKENS = [
  'too much tension',
  'tension',
  'fried',
  'fatigue',
  'fatigued',
  'overcooked',
  'shaky',
  'spasm',
]
const CAPACITY_TOKENS = [
  'capacity',
  'build capacity',
  'need to build',
  'need more time',
  'cant hold',
  "can't hold",
  'short hold',
  'gassed',
  'no juice',
]

function lower(value: string | undefined): string {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function classifyExerciseFromName(name: string | undefined): ExerciseClass {
  const lc = lower(name)
  if (!lc) return 'unknown'
  for (const k of STRAIGHT_ARM_KEYWORDS) if (lc.includes(k)) return 'straight_arm_skill'
  for (const k of WEIGHTED_STRENGTH_KEYWORDS) if (lc.includes(k)) return 'weighted_strength'
  for (const k of SKILL_KEYWORDS) if (lc.includes(k)) return 'bodyweight_strength'
  if (
    lc.includes('row') ||
    lc.includes('dip') ||
    lc.includes('pull-up') ||
    lc.includes('pullup') ||
    lc.includes('push-up') ||
    lc.includes('pushup') ||
    lc.includes('squat') ||
    lc.includes('lunge')
  ) {
    return 'bodyweight_strength'
  }
  if (lc.includes('stretch') || lc.includes('mobility') || lc.includes('cars')) {
    return 'mobility'
  }
  return 'accessory'
}

function tokenInText(tokens: readonly string[], text: string): boolean {
  for (const t of tokens) {
    if (text.includes(t)) return true
  }
  return false
}

function parsePrescribedRepsOrHold(repsOrTime: string | undefined): {
  reps?: number
  holdSeconds?: number
  isHold: boolean
} {
  const lc = lower(repsOrTime)
  if (!lc) return { isHold: false }
  const isHold = lc.includes('s') && (lc.includes('sec') || lc.includes('hold') || /\d+s\b/.test(lc))
  // Take the LOW end of the range as the "minimum acceptable"
  const numbers = lc.match(/\d+/g)?.map((n) => Number.parseInt(n, 10)) ?? []
  if (numbers.length === 0) return { isHold }
  const lowVal = numbers[0]
  if (isHold) return { holdSeconds: lowVal, isHold: true }
  return { reps: lowVal, isHold: false }
}

// =============================================================================
// EXTRACT EVIDENCE — exposed for the integration layer
// =============================================================================

/**
 * Extract per-exercise / per-set evidence from a canonical WorkoutLog-shaped
 * object. The integration layer is responsible for calling this once per log
 * and concatenating the results before passing into resolvePerformanceFeedbackAdaptation.
 *
 * Defensive: missing optional fields are tolerated; classification falls back
 * to 'unknown' rather than crashing.
 */
export interface MinimalWorkoutLogShape {
  id?: string
  sessionDate?: string
  createdAt?: string
  trusted?: boolean
  sourceRoute?: string
  generatedWorkoutId?: string
  perceivedDifficulty?: 'easy' | 'normal' | 'hard'
  exercises?: Array<{
    id?: string
    name?: string
    category?: string
    sets?: number
    reps?: number
    holdSeconds?: number
    completed?: boolean
  }>
  exerciseNotes?: Array<{
    exerciseIndex?: number
    exerciseName?: string
    flags?: string[]
    freeText?: string
  }>
  /** Optional per-set ledger (Phase L extension; preserved when present). */
  completedSetEvidence?: CompletedSetEvidence[]
}

export function extractCompletedSetEvidence(
  log: MinimalWorkoutLogShape,
  programSessionByDayNumber?: Record<number, PhaseLSessionShape>,
): CompletedSetEvidence[] {
  // Demo / untrusted logs never feed Phase L mutations.
  if (log.trusted === false) return []
  if (log.sourceRoute === 'demo') return []

  // 1) Prefer rich per-set ledger if present.
  if (Array.isArray(log.completedSetEvidence) && log.completedSetEvidence.length > 0) {
    return log.completedSetEvidence.map((ev) => ({
      ...ev,
      sessionId: ev.sessionId ?? log.id,
      timestamp: ev.timestamp ?? log.createdAt ?? log.sessionDate,
      exerciseClass: ev.exerciseClass ?? classifyExerciseFromName(ev.exerciseName),
      trusted: log.trusted !== false,
    }))
  }

  // 2) Fall back to per-exercise summary (best-rep / best-hold / completed).
  const evidence: CompletedSetEvidence[] = []
  const exercises = Array.isArray(log.exercises) ? log.exercises : []
  const notes = Array.isArray(log.exerciseNotes) ? log.exerciseNotes : []

  // High RPE proxy from perceivedDifficulty: 'hard' -> ~9, 'normal' -> ~7-8, 'easy' -> ~5-6.
  // We only stamp the proxy when no explicit RPE is available.
  const rpeProxy =
    log.perceivedDifficulty === 'hard' ? 9 : log.perceivedDifficulty === 'easy' ? 5 : 7

  // Try to match the workout to a program day so prescription is comparable.
  // generatedWorkoutId format example: "<programId>_session_day-N" (best effort).
  let matchedSession: PhaseLSessionShape | undefined
  if (log.generatedWorkoutId && programSessionByDayNumber) {
    const dayMatch = log.generatedWorkoutId.match(/day[-_]?(\d+)/i)
    if (dayMatch) {
      const dayNum = Number.parseInt(dayMatch[1], 10)
      if (Number.isFinite(dayNum)) matchedSession = programSessionByDayNumber[dayNum]
    }
  }
  const sessionExercisesByName = new Map<string, PhaseLExerciseShape>()
  for (const ex of matchedSession?.exercises ?? []) {
    if (typeof ex.name === 'string') sessionExercisesByName.set(lower(ex.name), ex)
  }

  for (let i = 0; i < exercises.length; i += 1) {
    const ex = exercises[i]
    if (!ex || !ex.name) continue
    const note = notes.find((n) => n.exerciseIndex === i || n.exerciseName === ex.name)
    const prescribed = sessionExercisesByName.get(lower(ex.name))
    const parsed = parsePrescribedRepsOrHold(prescribed?.repsOrTime)
    evidence.push({
      exerciseName: ex.name,
      exerciseId: ex.id,
      sessionId: log.id,
      dayNumber: matchedSession?.dayNumber,
      setNumber: -1,
      prescribedReps: parsed.reps,
      prescribedHoldSeconds: parsed.holdSeconds,
      actualReps: typeof ex.reps === 'number' ? ex.reps : undefined,
      actualHoldSeconds: typeof ex.holdSeconds === 'number' ? ex.holdSeconds : undefined,
      prescribedRPE: prescribed?.targetRPE,
      actualRPE: rpeProxy,
      note: note?.freeText,
      noteFlags: note?.flags,
      timestamp: log.createdAt ?? log.sessionDate,
      exerciseClass: classifyExerciseFromName(ex.name),
      completed: ex.completed,
      trusted: log.trusted !== false,
    })
  }
  return evidence
}

// =============================================================================
// SIGNAL CLASSIFICATION
// =============================================================================

interface ClassificationContext {
  evidence: CompletedSetEvidence[]
}

export function classifyPerformanceSignals(
  evidence: CompletedSetEvidence[],
): PerformanceSignal[] {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return [
      {
        signalType: 'insufficient_data',
        severity: 'info',
        confidence: 'low',
        exerciseName: '',
        affectedSessionIds: [],
        evidenceSummary: 'No completed evidence available',
        recommendedAction: 'preserve_prescription',
        exerciseClass: 'unknown',
      },
    ]
  }

  // Group evidence by exercise name (lower-case) so we can detect "repeated"
  // signals across multiple sets / sessions.
  const byExercise = new Map<string, CompletedSetEvidence[]>()
  for (const ev of evidence) {
    if (!ev.exerciseName) continue
    if (ev.trusted === false) continue
    const key = lower(ev.exerciseName)
    if (!byExercise.has(key)) byExercise.set(key, [])
    byExercise.get(key)!.push(ev)
  }

  const signals: PerformanceSignal[] = []

  for (const [, group] of byExercise) {
    const sample = group[0]
    const cls = sample.exerciseClass ?? classifyExerciseFromName(sample.exerciseName)
    const sessionIds = Array.from(
      new Set(group.map((g) => g.sessionId).filter((id): id is string => !!id)),
    )

    let highRpeCount = 0
    let underTargetCount = 0
    let onTargetCount = 0
    let aboveTargetCount = 0
    let painNote = false
    let tensionNote = false
    let capacityNote = false

    for (const ev of group) {
      const rpe = typeof ev.actualRPE === 'number' ? ev.actualRPE : null
      const targetRpe = typeof ev.prescribedRPE === 'number' ? ev.prescribedRPE : 8
      const targetReps = ev.prescribedReps
      const targetHold = ev.prescribedHoldSeconds
      const actualReps = ev.actualReps
      const actualHold = ev.actualHoldSeconds

      const isHigh = rpe !== null && rpe >= targetRpe + 1
      const isVeryHigh = rpe !== null && rpe >= targetRpe + 2
      if (isHigh) highRpeCount += 1

      let metTarget = true
      let beatTarget = false
      if (typeof targetReps === 'number' && typeof actualReps === 'number') {
        metTarget = actualReps >= targetReps
        beatTarget = actualReps > targetReps
      } else if (typeof targetHold === 'number' && typeof actualHold === 'number') {
        metTarget = actualHold >= targetHold
        beatTarget = actualHold > targetHold
      } else if (typeof ev.completed === 'boolean') {
        metTarget = ev.completed
      }

      if (!metTarget) underTargetCount += 1
      else if (beatTarget && rpe !== null && rpe <= targetRpe - 1) aboveTargetCount += 1
      else onTargetCount += 1

      const flags = (ev.noteFlags ?? []).map(lower)
      const text = lower(ev.note)
      if (flags.includes('pain') || tokenInText(PAIN_TOKENS, text)) painNote = true
      if (flags.includes('too_hard') || flags.includes('technique_breakdown') || tokenInText(TENSION_TOKENS, text))
        tensionNote = true
      if (flags.includes('sleep_fatigue') || flags.includes('grip_issue') || tokenInText(CAPACITY_TOKENS, text))
        capacityNote = true

      // Very-high RPE on a straight-arm skill auto-elevates tension.
      if (isVeryHigh && cls === 'straight_arm_skill') tensionNote = true
    }

    // PAIN note is the highest-priority outcome — never under-react.
    if (painNote) {
      signals.push({
        signalType: 'note_pain_warning',
        severity: 'high',
        confidence: 'high',
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: 'User reported pain / discomfort during this exercise.',
        recommendedAction: 'hold_progression',
        exerciseClass: cls,
      })
      continue
    }

    if (tensionNote) {
      const isStraightArm = cls === 'straight_arm_skill'
      signals.push({
        signalType: 'note_tension_warning',
        severity: isStraightArm ? 'high' : 'moderate',
        confidence: 'medium',
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: isStraightArm
          ? 'Reported high tension on tendon-demanding skill work.'
          : 'Reported high tension / fatigue.',
        recommendedAction: isStraightArm ? 'hold_progression' : 'reduce_rpe_target',
        exerciseClass: cls,
      })
    }

    if (capacityNote) {
      signals.push({
        signalType: 'note_capacity_warning',
        severity: 'mild',
        confidence: 'medium',
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: 'Need to build capacity / fatigue limited the work.',
        recommendedAction: 'extend_rest_guidance',
        exerciseClass: cls,
      })
    }

    if (underTargetCount >= 1 && highRpeCount >= 1) {
      // Repeated misses across sets escalate severity / confidence.
      const severity: SignalSeverity =
        underTargetCount >= 2 || cls === 'straight_arm_skill' ? 'moderate' : 'mild'
      const confidence: SignalConfidence =
        underTargetCount + highRpeCount >= 3 ? 'high' : 'medium'
      signals.push({
        signalType: 'under_target_high_rpe',
        severity,
        confidence,
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: `Missed target on ${underTargetCount} of ${group.length} set(s) at high RPE.`,
        recommendedAction: cls === 'straight_arm_skill' ? 'hold_progression' : 'reduce_next_exposure_volume',
        exerciseClass: cls,
      })
    } else if (highRpeCount >= 1 && underTargetCount === 0) {
      signals.push({
        signalType: 'on_target_high_rpe',
        severity: 'info',
        confidence: 'medium',
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: 'Target met but at hard RPE — productive working set.',
        recommendedAction: 'preserve_prescription',
        exerciseClass: cls,
      })
    } else if (aboveTargetCount >= 2 && underTargetCount === 0 && !tensionNote && !capacityNote) {
      signals.push({
        signalType: 'above_target_low_rpe',
        severity: 'info',
        confidence: 'medium',
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: 'Beat target multiple times at low RPE — small progression candidate.',
        recommendedAction: 'increase_progression_slightly',
        exerciseClass: cls,
      })
    } else if (onTargetCount >= 1 && highRpeCount === 0 && underTargetCount === 0) {
      signals.push({
        signalType: 'on_target_normal_rpe',
        severity: 'info',
        confidence: 'medium',
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: 'On target at expected effort.',
        recommendedAction: 'preserve_prescription',
        exerciseClass: cls,
      })
    }

    // Repeated skill-fatigue escalation across multiple sessions
    if (cls === 'straight_arm_skill' && (underTargetCount >= 2 || tensionNote)) {
      signals.push({
        signalType: 'repeated_skill_fatigue',
        severity: 'high',
        confidence: 'medium',
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: 'Repeated skill fatigue on straight-arm work — protect next exposure.',
        recommendedAction: 'hold_progression',
        exerciseClass: cls,
      })
    } else if (cls === 'weighted_strength' && underTargetCount >= 2 && highRpeCount >= 2) {
      signals.push({
        signalType: 'repeated_strength_fatigue',
        severity: 'moderate',
        confidence: 'medium',
        exerciseName: sample.exerciseName,
        exerciseId: sample.exerciseId,
        affectedSessionIds: sessionIds,
        evidenceSummary: 'Repeated under-target sets at high RPE on weighted strength.',
        recommendedAction: 'reduce_next_exposure_volume',
        exerciseClass: cls,
      })
    }
  }

  if (signals.length === 0) {
    return [
      {
        signalType: 'insufficient_data',
        severity: 'info',
        confidence: 'low',
        exerciseName: '',
        affectedSessionIds: [],
        evidenceSummary: 'No actionable signals from completed evidence.',
        recommendedAction: 'preserve_prescription',
        exerciseClass: 'unknown',
      },
    ]
  }
  return signals
}

// =============================================================================
// FUTURE PRESCRIPTION MUTATION DERIVATION + APPLICATION
// =============================================================================

const SAFE_BOUNDS = {
  MAX_VOLUME_DROP_SETS: 1,
  MIN_SETS_FLOOR: 2,
  MAX_RPE_DROP: 1,
  MIN_RPE_FLOOR: 6,
  MAX_PROGRESSION_BUMP_SETS: 1,
  MAX_HOLD_TRIM_FRACTION: 0.2,
  MAX_REP_TRIM_FRACTION: 0.2,
} as const

function findFutureExerciseMatch(
  program: PhaseLProgramShape,
  signal: PerformanceSignal,
  completedDayNumbers: number[],
): { dayNumber: number; exercise: PhaseLExerciseShape; session: PhaseLSessionShape } | null {
  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  const completedSet = new Set(completedDayNumbers ?? [])
  const targetName = lower(signal.exerciseName)
  // Prefer the EARLIEST future session that contains a matching exercise.
  for (const sess of sessions) {
    const dn = typeof sess.dayNumber === 'number' ? sess.dayNumber : -1
    if (dn < 0) continue
    if (completedSet.has(dn)) continue
    const exercises = Array.isArray(sess.exercises) ? sess.exercises : []
    let match: PhaseLExerciseShape | undefined
    if (signal.exerciseId) {
      match = exercises.find((e) => e.id === signal.exerciseId)
    }
    if (!match && targetName) {
      match = exercises.find((e) => lower(e.name) === targetName)
    }
    if (match) {
      return { dayNumber: dn, exercise: match, session: sess }
    }
  }
  return null
}

function trimRepsOrTime(repsOrTime: string | undefined, fraction: number): string | undefined {
  if (typeof repsOrTime !== 'string' || repsOrTime.length === 0) return repsOrTime
  // Trim only the LOW end of the range to keep the format identical.
  const numbers = repsOrTime.match(/\d+/g)
  if (!numbers || numbers.length === 0) return repsOrTime
  // Replace each number with floor(n * (1 - fraction)) but keep min 1.
  let i = 0
  return repsOrTime.replace(/\d+/g, (raw) => {
    const orig = Number.parseInt(raw, 10)
    if (!Number.isFinite(orig)) return raw
    const trimmed = Math.max(1, Math.floor(orig * (1 - fraction)))
    i += 1
    void i
    return String(trimmed)
  })
}

export function deriveFuturePrescriptionMutations(
  signals: PerformanceSignal[],
  program: PhaseLProgramShape,
  completedDayNumbers: number[],
): FuturePrescriptionMutation[] {
  if (!program || !Array.isArray(program.sessions) || program.sessions.length === 0) {
    return []
  }
  const mutations: FuturePrescriptionMutation[] = []
  // Track per-(day,exerciseId) so we don't stack multiple mutations on the
  // same row from overlapping signals.
  const claimed = new Set<string>()

  for (const signal of signals) {
    if (signal.signalType === 'insufficient_data') continue
    if (signal.signalType === 'on_target_normal_rpe') continue
    if (signal.signalType === 'on_target_high_rpe') continue

    const match = findFutureExerciseMatch(program, signal, completedDayNumbers)
    if (!match) continue
    const claimKey = `${match.dayNumber}::${match.exercise.id ?? lower(match.exercise.name)}`
    if (claimed.has(claimKey)) continue

    const before = {
      sets: match.exercise.sets,
      repsOrTime: match.exercise.repsOrTime,
      targetRPE: match.exercise.targetRPE,
      restSeconds: match.exercise.restSeconds,
    }
    const isStraightArm = signal.exerciseClass === 'straight_arm_skill'
    const isPainSignal = signal.signalType === 'note_pain_warning'

    let mutationType: FutureMutationType = 'preserve_prescription'
    let after = { ...before }
    const bounds: string[] = []
    const reasonCodes: string[] = [signal.signalType]
    let safetyLevel: SafetyLevel = 'safe'
    let blockedReason: string | undefined
    let userVisible = ''

    switch (signal.signalType) {
      case 'note_pain_warning': {
        // Hold progression: drop one set if possible, drop RPE by 1 if possible.
        // Never go below safety floors. We do NOT auto-swap for a regression here
        // — that's a coach decision; we surface a "pain warning" recovery note.
        mutationType = 'hold_progression'
        const newSets =
          typeof before.sets === 'number'
            ? Math.max(SAFE_BOUNDS.MIN_SETS_FLOOR, before.sets - SAFE_BOUNDS.MAX_VOLUME_DROP_SETS)
            : before.sets
        const newRpe =
          typeof before.targetRPE === 'number'
            ? Math.max(SAFE_BOUNDS.MIN_RPE_FLOOR, before.targetRPE - SAFE_BOUNDS.MAX_RPE_DROP)
            : before.targetRPE
        after = { ...before, sets: newSets, targetRPE: newRpe }
        bounds.push(`sets ≥ ${SAFE_BOUNDS.MIN_SETS_FLOOR}`, `RPE ≥ ${SAFE_BOUNDS.MIN_RPE_FLOOR}`)
        safetyLevel = 'caution'
        reasonCodes.push('pain_warning_caution')
        userVisible = 'Adjusted from last workout: pain warning — progression held and intensity softened.'
        break
      }
      case 'repeated_skill_fatigue':
      case 'note_tension_warning': {
        // Hold progression for skill / tension cases. For straight-arm work we
        // prefer a SET drop AND a small RPE trim because tendon recovery is
        // the limiter. For non-skill, we only trim RPE.
        mutationType = 'hold_progression'
        if (isStraightArm) {
          const newSets =
            typeof before.sets === 'number'
              ? Math.max(SAFE_BOUNDS.MIN_SETS_FLOOR, before.sets - SAFE_BOUNDS.MAX_VOLUME_DROP_SETS)
              : before.sets
          const newRpe =
            typeof before.targetRPE === 'number'
              ? Math.max(SAFE_BOUNDS.MIN_RPE_FLOOR, before.targetRPE - SAFE_BOUNDS.MAX_RPE_DROP)
              : before.targetRPE
          after = { ...before, sets: newSets, targetRPE: newRpe }
          bounds.push(`sets ≥ ${SAFE_BOUNDS.MIN_SETS_FLOOR}`, `RPE ≥ ${SAFE_BOUNDS.MIN_RPE_FLOOR}`)
          userVisible =
            'Adjusted from last workout: progression held after high-RPE under-target skill work.'
        } else {
          const newRpe =
            typeof before.targetRPE === 'number'
              ? Math.max(SAFE_BOUNDS.MIN_RPE_FLOOR, before.targetRPE - SAFE_BOUNDS.MAX_RPE_DROP)
              : before.targetRPE
          after = { ...before, targetRPE: newRpe }
          bounds.push(`RPE ≥ ${SAFE_BOUNDS.MIN_RPE_FLOOR}`)
          userVisible =
            typeof before.targetRPE === 'number' && typeof newRpe === 'number'
              ? `Next exposure protected: RPE target lowered from ${before.targetRPE} to ${newRpe}.`
              : 'Next exposure protected after high tension on last working set.'
        }
        safetyLevel = 'safe'
        break
      }
      case 'note_capacity_warning': {
        mutationType = 'extend_rest_guidance'
        const baseRest = typeof before.restSeconds === 'number' ? before.restSeconds : 90
        const newRest = Math.min(240, Math.round(baseRest * 1.25))
        after = { ...before, restSeconds: newRest }
        bounds.push('rest ≤ 240s')
        safetyLevel = 'safe'
        userVisible =
          typeof before.restSeconds === 'number'
            ? `Rest emphasis: extra recovery preserved (rest extended ${before.restSeconds}s → ${newRest}s).`
            : 'Rest emphasis: extra recovery preserved on next exposure.'
        break
      }
      case 'under_target_high_rpe': {
        if (isStraightArm) {
          mutationType = 'hold_progression'
          const newSets =
            typeof before.sets === 'number'
              ? Math.max(SAFE_BOUNDS.MIN_SETS_FLOOR, before.sets - SAFE_BOUNDS.MAX_VOLUME_DROP_SETS)
              : before.sets
          after = { ...before, sets: newSets }
          bounds.push(`sets ≥ ${SAFE_BOUNDS.MIN_SETS_FLOOR}`)
          userVisible =
            'Adjusted from last workout: progression held after high-RPE under-target skill set.'
        } else {
          mutationType = 'reduce_next_exposure_volume'
          const newSets =
            typeof before.sets === 'number'
              ? Math.max(SAFE_BOUNDS.MIN_SETS_FLOOR, before.sets - SAFE_BOUNDS.MAX_VOLUME_DROP_SETS)
              : before.sets
          const newReps =
            signal.severity === 'moderate' || signal.severity === 'high'
              ? trimRepsOrTime(before.repsOrTime, SAFE_BOUNDS.MAX_REP_TRIM_FRACTION)
              : before.repsOrTime
          after = { ...before, sets: newSets, repsOrTime: newReps }
          bounds.push(
            `sets ≥ ${SAFE_BOUNDS.MIN_SETS_FLOOR}`,
            `rep/hold trim ≤ ${Math.round(SAFE_BOUNDS.MAX_REP_TRIM_FRACTION * 100)}%`,
          )
          userVisible =
            typeof before.sets === 'number' && typeof newSets === 'number' && newSets < before.sets
              ? `Next exposure trimmed: ${before.sets} → ${newSets} sets after under-target high-RPE work.`
              : 'Next exposure trimmed after under-target high-RPE work.'
        }
        safetyLevel = 'safe'
        break
      }
      case 'repeated_strength_fatigue': {
        mutationType = 'reduce_next_exposure_volume'
        const newSets =
          typeof before.sets === 'number'
            ? Math.max(SAFE_BOUNDS.MIN_SETS_FLOOR, before.sets - SAFE_BOUNDS.MAX_VOLUME_DROP_SETS)
            : before.sets
        const newRpe =
          typeof before.targetRPE === 'number'
            ? Math.max(SAFE_BOUNDS.MIN_RPE_FLOOR, before.targetRPE - SAFE_BOUNDS.MAX_RPE_DROP)
            : before.targetRPE
        after = { ...before, sets: newSets, targetRPE: newRpe }
        bounds.push(`sets ≥ ${SAFE_BOUNDS.MIN_SETS_FLOOR}`, `RPE ≥ ${SAFE_BOUNDS.MIN_RPE_FLOOR}`)
        safetyLevel = 'safe'
        userVisible = 'Next exposure trimmed after repeated under-target strength work.'
        break
      }
      case 'above_target_low_rpe': {
        // Slight progression: only bump if not skill, not weighted-strength
        // primary, and bounds allow it. Skill progression is doctrine-owned.
        if (isStraightArm) {
          mutationType = 'preserve_prescription'
          after = { ...before }
          bounds.push('skill progression owned by doctrine')
          safetyLevel = 'safe'
          userVisible = 'Skill steady — progression decisions remain doctrine-owned.'
        } else {
          mutationType = 'increase_progression_slightly'
          const newSets =
            typeof before.sets === 'number'
              ? before.sets + SAFE_BOUNDS.MAX_PROGRESSION_BUMP_SETS
              : before.sets
          after = { ...before, sets: newSets }
          bounds.push(`+${SAFE_BOUNDS.MAX_PROGRESSION_BUMP_SETS} set max`)
          safetyLevel = 'safe'
          userVisible =
            typeof newSets === 'number' && typeof before.sets === 'number'
              ? `Slight progression: ${before.sets} → ${newSets} sets after repeated above-target low-RPE work.`
              : 'Slight progression after repeated above-target low-RPE work.'
        }
        break
      }
      default: {
        mutationType = 'preserve_prescription'
        after = { ...before }
        userVisible = ''
        break
      }
    }

    // Block mutations that would violate floors or that produce no net change.
    const noNetChange =
      after.sets === before.sets &&
      after.repsOrTime === before.repsOrTime &&
      after.targetRPE === before.targetRPE &&
      after.restSeconds === before.restSeconds
    let shouldApply = !noNetChange
    if (typeof after.sets === 'number' && after.sets < SAFE_BOUNDS.MIN_SETS_FLOOR) {
      shouldApply = false
      blockedReason = `sets floor (${SAFE_BOUNDS.MIN_SETS_FLOOR}) would be violated`
      safetyLevel = 'blocked'
    }
    if (typeof after.targetRPE === 'number' && after.targetRPE < SAFE_BOUNDS.MIN_RPE_FLOOR) {
      shouldApply = false
      blockedReason = `RPE floor (${SAFE_BOUNDS.MIN_RPE_FLOOR}) would be violated`
      safetyLevel = 'blocked'
    }
    if (mutationType === 'preserve_prescription' && noNetChange) {
      shouldApply = false
    }
    // Pain warnings are still valuable as a recovery note even if numeric
    // floors block the trim — escalate to add_recovery_note_only.
    if (!shouldApply && isPainSignal) {
      mutationType = 'add_recovery_note_only'
      shouldApply = true
      after = { ...before }
      bounds.push('numeric trim blocked by floor — recovery note retained')
      safetyLevel = 'caution'
      userVisible =
        userVisible ||
        'Adjusted from last workout: pain warning — keep effort conservative on next exposure.'
      blockedReason = undefined
    }

    mutations.push({
      targetDayNumber: match.dayNumber,
      targetExerciseId: match.exercise.id,
      targetExerciseName: match.exercise.name ?? signal.exerciseName,
      targetPattern: signal.affectedPattern,
      mutationType,
      boundsApplied: bounds,
      before,
      after,
      reasonCodes,
      userVisibleExplanation: userVisible,
      safetyLevel,
      shouldApply,
      blockedReason,
    })
    if (shouldApply) claimed.add(claimKey)
  }
  return mutations
}

// =============================================================================
// APPLY MUTATIONS — preserves entire program shape; stamps performanceAdaptation
// =============================================================================

export function applyFuturePrescriptionMutations<T extends PhaseLProgramShape>(
  program: T,
  mutations: FuturePrescriptionMutation[],
  nowIso?: string,
): T {
  if (!program || !Array.isArray(program.sessions) || mutations.length === 0) return program
  const ts = nowIso ?? new Date().toISOString()
  // Build a quick lookup: targetDayNumber -> mutations
  const byDay = new Map<number, FuturePrescriptionMutation[]>()
  for (const m of mutations) {
    if (!m.shouldApply) continue
    if (!byDay.has(m.targetDayNumber)) byDay.set(m.targetDayNumber, [])
    byDay.get(m.targetDayNumber)!.push(m)
  }
  if (byDay.size === 0) return program

  const newSessions = program.sessions.map((sess) => {
    const dn = typeof sess.dayNumber === 'number' ? sess.dayNumber : -1
    const dayMutations = byDay.get(dn)
    if (!dayMutations || !Array.isArray(sess.exercises)) return sess

    const newExercises = sess.exercises.map((ex) => {
      const m = dayMutations.find(
        (mm) =>
          (mm.targetExerciseId && mm.targetExerciseId === ex.id) ||
          lower(mm.targetExerciseName) === lower(ex.name),
      )
      if (!m) return ex

      // Deterministic short chip label per mutation type. Single owner so
      // the Program card chip and the underlying numeric mutation can never
      // disagree.
      const shortLabel: string = (() => {
        switch (m.mutationType) {
          case 'reduce_next_exposure_volume':
            return 'VOLUME REDUCED'
          case 'hold_progression':
            return 'PROGRESSION HELD'
          case 'reduce_rpe_target':
            return 'RPE LOWERED'
          case 'extend_rest_guidance':
            return 'REST EXTENDED'
          case 'preserve_prescription':
            return 'PRESCRIPTION PRESERVED'
          case 'increase_progression_slightly':
            return 'PROGRESSION ADVANCED'
          case 'swap_to_regression_candidate':
            return 'REGRESSION SUGGESTED'
          case 'add_recovery_note_only':
            return 'RECOVERY NOTE'
          default:
            return 'ADAPTED'
        }
      })()

      const stamp: ExercisePerformanceAdaptationStamp = {
        applied: true,
        reasonCodes: m.reasonCodes,
        evidenceSummary: m.userVisibleExplanation,
        before: m.before,
        after: m.after,
        userVisibleExplanation: m.userVisibleExplanation,
        source: 'phase_l_performance_feedback',
        mutationType: m.mutationType,
        safetyLevel: m.safetyLevel,
        targetDayNumber: m.targetDayNumber,
        computedAt: ts,
        signalTypes: m.reasonCodes.filter((c) =>
          [
            'under_target_high_rpe',
            'note_pain_warning',
            'note_tension_warning',
            'note_capacity_warning',
            'repeated_skill_fatigue',
            'repeated_strength_fatigue',
            'above_target_low_rpe',
          ].includes(c),
        ) as PerformanceSignalType[],
        shortLabel,
        status: 'applied',
      }

      // Spread original first so we never drop unknown fields, then assign
      // the bounded numeric overrides + stamp explicitly.
      return {
        ...ex,
        sets: typeof m.after.sets === 'number' ? m.after.sets : ex.sets,
        repsOrTime: typeof m.after.repsOrTime === 'string' ? m.after.repsOrTime : ex.repsOrTime,
        targetRPE: typeof m.after.targetRPE === 'number' ? m.after.targetRPE : ex.targetRPE,
        restSeconds:
          typeof m.after.restSeconds === 'number' ? m.after.restSeconds : ex.restSeconds,
        performanceAdaptation: stamp,
      }
    })

    return { ...sess, exercises: newExercises }
  })

  return { ...program, sessions: newSessions }
}

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export function resolvePerformanceFeedbackAdaptation(
  input: PerformanceFeedbackInput,
): PerformanceFeedbackAdaptationResult {
  const proof: PerformanceFeedbackAdaptationProof = {
    completedSetsRead: 0,
    sessionsRead: 0,
    highRpeCount: 0,
    underTargetCount: 0,
    noteWarningsCount: 0,
    mutationsApplied: 0,
    mutationsBlocked: 0,
    currentProgramPreserved: true,
  }

  const program = input.currentProgram
  const evidence = Array.isArray(input.completedSetEvidence) ? input.completedSetEvidence : []
  proof.completedSetsRead = evidence.length
  proof.sessionsRead = new Set(
    evidence.map((e) => e.sessionId).filter((id): id is string => !!id),
  ).size
  proof.highRpeCount = evidence.filter(
    (e) =>
      typeof e.actualRPE === 'number' &&
      typeof e.prescribedRPE === 'number' &&
      e.actualRPE >= e.prescribedRPE + 1,
  ).length
  proof.underTargetCount = evidence.filter((e) => {
    if (typeof e.prescribedReps === 'number' && typeof e.actualReps === 'number') {
      return e.actualReps < e.prescribedReps
    }
    if (typeof e.prescribedHoldSeconds === 'number' && typeof e.actualHoldSeconds === 'number') {
      return e.actualHoldSeconds < e.prescribedHoldSeconds
    }
    return e.completed === false
  }).length
  proof.noteWarningsCount = evidence.filter((e) => {
    const flags = (e.noteFlags ?? []).map(lower)
    return (
      flags.includes('pain') ||
      flags.includes('too_hard') ||
      flags.includes('technique_breakdown') ||
      flags.includes('sleep_fatigue') ||
      flags.includes('grip_issue') ||
      typeof e.note === 'string'
    )
  }).length

  if (!program || !Array.isArray(program.sessions) || program.sessions.length === 0) {
    return {
      status: 'insufficient_data',
      signals: [
        {
          signalType: 'insufficient_data',
          severity: 'info',
          confidence: 'low',
          exerciseName: '',
          affectedSessionIds: [],
          evidenceSummary: 'No program available to adapt.',
          recommendedAction: 'preserve_prescription',
          exerciseClass: 'unknown',
        },
      ],
      mutations: [],
      summary: 'No program to adapt.',
      blockedReasons: ['no_program'],
      proof,
    }
  }
  if (evidence.length === 0) {
    return {
      status: 'insufficient_data',
      signals: classifyPerformanceSignals(evidence),
      mutations: [],
      summary: 'No completed evidence to adapt from.',
      blockedReasons: ['no_evidence'],
      proof,
    }
  }

  const signals = classifyPerformanceSignals(evidence)
  const completedDayNumbers = Array.isArray(input.completedDayNumbers)
    ? input.completedDayNumbers
    : []
  const mutations = deriveFuturePrescriptionMutations(signals, program, completedDayNumbers)
  proof.mutationsApplied = mutations.filter((m) => m.shouldApply).length
  proof.mutationsBlocked = mutations.filter((m) => !m.shouldApply).length

  const status: AdaptationStatus =
    mutations.length === 0
      ? 'insufficient_data'
      : proof.mutationsApplied === 0
        ? 'blocked'
        : proof.mutationsApplied === mutations.length
          ? 'healthy'
          : 'partial'

  const summary =
    proof.mutationsApplied > 0
      ? `${proof.mutationsApplied} future row(s) adjusted from logged performance.`
      : status === 'blocked'
        ? 'All proposed mutations blocked by safety bounds.'
        : 'No actionable adaptation from current evidence.'

  const blockedReasons = mutations
    .filter((m) => !m.shouldApply)
    .map((m) => m.blockedReason ?? `${m.mutationType}_blocked`)

  return {
    status,
    signals,
    mutations,
    summary,
    blockedReasons,
    proof,
  }
}

// =============================================================================
// PUBLIC RE-EXPORTS — bounds for tests / docs
// =============================================================================

export const PHASE_L_SAFE_BOUNDS = SAFE_BOUNDS
