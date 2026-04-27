/**
 * =============================================================================
 * PHASE O — PERSISTENT PERFORMANCE TREND INTELLIGENCE + COACH DECISION LAYER
 * =============================================================================
 *
 * PURE, JSON-SAFE, DETERMINISTIC, SIDE-EFFECT FREE.
 *
 * Phase O sits BETWEEN persisted CompletedSetEvidence (written by Phase L
 * during a live workout, persisted to Neon by Phase N, read back into the
 * authoritative generator by Phase M) and the existing Phase L/M resolver.
 *
 * What this layer does:
 *   - Groups persisted set evidence by exercise AND by movement pattern.
 *   - Distinguishes acute / repeated / improving / mixed / insufficient
 *     signals across the bounded recent-history window.
 *   - Converts repeated notes ("too much tension", pain flags, capacity
 *     limiters) into structured trend codes.
 *   - Produces a deterministic CoachDecision per exercise (recommend only;
 *     mutation ownership stays with performance-feedback-adaptation-contract).
 *
 * What this layer does NOT do:
 *   - It does NOT mutate the program.
 *   - It does NOT decide final sets / reps / RPE / rest changes — those
 *     belong to deriveFuturePrescriptionMutations + applyFuturePrescriptionMutations.
 *   - It does NOT touch localStorage / window / fetch / React / DB.
 *   - It does NOT duplicate Phase L numeric mutation rules or bounds.
 *   - It does NOT render UI.
 *
 * Hand-off:
 *   - Each Mutation produced by Phase L can carry a `trendIntelligence` and
 *     `coachDecision` slice attached by the resolver. Those slices are then
 *     stamped onto `exercise.performanceAdaptation` so the Program card can
 *     render concise proof under the existing chip — without inventing a
 *     separate UI surface or a separate adaptation pipeline.
 *
 * NO IMPORT of `localStorage`, `window`, `fetch`, React, or anything stateful.
 */

import type {
  CompletedSetEvidence,
  ExerciseClass,
  PerformanceSignalType,
} from './performance-feedback-adaptation-contract'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * Trend codes — deterministic structured labels the coach decision layer and
 * UI proof line can consume directly. Unlike PerformanceSignalType, these
 * describe the multi-session trajectory of an exercise / pattern, not the
 * outcome of a single working set.
 */
export type PerformanceTrendCode =
  | 'insufficient_data'
  | 'stable_on_target'
  | 'progressing_well'
  | 'high_effort_on_target'
  | 'repeated_high_rpe'
  | 'repeated_under_target'
  | 'capacity_limiter_detected'
  | 'skill_tension_limiter_detected'
  | 'recovery_pressure_detected'
  | 'joint_caution_pressure_detected'
  | 'overreaching_risk'
  | 'ready_for_small_progression'
  | 'hold_progression'
  | 'reduce_volume'
  | 'lower_rpe_target'
  | 'extend_rest'
  | 'preserve_current_dose'

export type TrendSeverity = 'low' | 'moderate' | 'high'
export type TrendConfidence = 'low' | 'medium' | 'high'

/**
 * Movement patterns — coarser groupings than ExerciseClass so the trend
 * layer can detect e.g. "all straight-arm work limited" vs "weighted dip
 * specifically limited". Stays as `unknown` when we cannot classify with
 * confidence — never invents a label.
 */
export type MovementPattern =
  | 'planche'
  | 'front_lever'
  | 'back_lever'
  | 'handstand'
  | 'vertical_pull'
  | 'horizontal_pull'
  | 'weighted_pull'
  | 'weighted_dip'
  | 'horizontal_press'
  | 'vertical_press'
  | 'explosive_pull'
  | 'core_compression'
  | 'lower_body'
  | 'mobility'
  | 'accessory'
  | 'unknown'

/** Optional reason codes, structured for downstream consumption. */
export type TrendReasonCode =
  | 'high_rpe_repeated_3plus'
  | 'high_rpe_repeated_2'
  | 'under_target_repeated'
  | 'on_target_stable'
  | 'beat_target_repeated'
  | 'tension_note_repeated'
  | 'pain_or_caution_flag'
  | 'capacity_note'
  | 'single_acute_event'
  | 'mixed_signal'
  | 'window_too_small'

export interface ExerciseTrend {
  /** Lower-cased exercise key the resolver matches on. */
  exerciseKey: string
  /** Best display name we observed across the window. */
  exerciseName: string
  /** Deterministic class from the persisted evidence (Phase L taxonomy). */
  exerciseClass: ExerciseClass
  /** Coarser movement pattern derived from name + class. */
  movementPattern: MovementPattern
  /** Codes that materially apply to this exercise across the window. */
  trendCodes: PerformanceTrendCode[]
  /** Highest severity across the codes. */
  severity: TrendSeverity
  /** Confidence given evidence count + clarity. */
  confidence: TrendConfidence
  /** Structured reason codes (audit / UI). */
  reasonCodes: TrendReasonCode[]
  /** Concise human-readable explanation (one sentence). */
  conciseExplanation: string
  /** Number of sets observed in window. */
  setCount: number
  /** Number of distinct sessions observed in window. */
  sessionCount: number
  /** Last timestamp we have for this exercise. */
  latestTimestamp?: string
}

export interface MovementPatternTrend {
  pattern: MovementPattern
  trendCodes: PerformanceTrendCode[]
  severity: TrendSeverity
  confidence: TrendConfidence
  /** Exercise keys that contributed to this pattern bucket. */
  exerciseKeys: string[]
  /** Total sets across all contributing exercises. */
  setCount: number
  sessionCount: number
}

export interface ReadinessPressureSignal {
  pattern: MovementPattern
  severity: TrendSeverity
  reason: TrendReasonCode
}

export interface PerformanceTrendIntelligence {
  /** Empty / sparse evidence is a first-class outcome. */
  hasEvidence: boolean
  /** Top-level summary — one short sentence. */
  trendSummary: string
  /** Per-exercise trend rows, keyed by exerciseKey. */
  exerciseTrends: ExerciseTrend[]
  /** Roll-up across exercises grouped by movement pattern. */
  movementPatternTrends: MovementPatternTrend[]
  /** Readiness pressure (recovery / capacity / joint caution) flags. */
  readinessPressureSignals: ReadinessPressureSignal[]
  /** Recovery-debt flags derived from repeated high-RPE under-target work. */
  recoveryDebtSignals: ReadinessPressureSignal[]
  /** Patterns where evidence supports a small progression. */
  progressionReadinessSignals: ReadinessPressureSignal[]
  /** Patterns where the layer recommends caution (pain / joint flags). */
  cautionFlags: ReadinessPressureSignal[]
  /** Bounded windowing audit. */
  evidenceWindow: {
    setCount: number
    sessionCount: number
    daysBack: number
    earliestTimestamp?: string
    latestTimestamp?: string
  }
  /** Aggregate confidence over the whole intelligence. */
  confidence: TrendConfidence
  /** Audit / debug fields. */
  proof: {
    exerciseGroupCount: number
    movementPatternCount: number
    isolatedAcuteSuppressedCount: number
    repeatedPatternCount: number
  }
}

// =============================================================================
// COACH DECISION TYPES
// =============================================================================

export type CoachDecisionAction =
  | 'hold_progression'
  | 'reduce_volume'
  | 'lower_rpe_target'
  | 'extend_rest'
  | 'preserve_current_dose'
  | 'small_progression'
  | 'maintain_and_monitor'
  | 'technique_focus'
  | 'deload_candidate'
  | 'insufficient_data_no_change'

export type CoachAllowedMutation =
  | 'reduce_next_exposure_volume'
  | 'hold_progression'
  | 'reduce_rpe_target'
  | 'extend_rest_guidance'
  | 'increase_progression_slightly'
  | 'preserve_prescription'
  | 'add_recovery_note_only'

export interface CoachDecision {
  /** Lower-cased exercise key (matches ExerciseTrend.exerciseKey). */
  exerciseKey: string
  exerciseName: string
  movementPattern: MovementPattern
  recommendedAction: CoachDecisionAction
  severity: TrendSeverity
  /**
   * Scope this decision applies to — the same exercise, the whole pattern,
   * or session-level recovery pressure.
   */
  targetScope: 'exercise' | 'movement_pattern' | 'session_recovery'
  /** Mutation types the resolver is allowed to apply for this row. */
  allowedMutationTypes: CoachAllowedMutation[]
  /** Mutation types the resolver MUST NOT apply for this row. */
  blockedMutationTypes: CoachAllowedMutation[]
  reasonCodes: TrendReasonCode[]
  trendCodes: PerformanceTrendCode[]
  conciseExplanation: string
  confidence: TrendConfidence
  /** Stable list of session ids the decision was derived from. */
  evidenceSessionIds: string[]
  /** Set count contributing to this decision. */
  evidenceSetCount: number
}

// =============================================================================
// CONFIG / CONSTANTS
// =============================================================================

const DEFAULT_DAYS_BACK = 21
const SHORT_WINDOW_DAYS = 7
const MIN_SETS_FOR_REPEATED_PATTERN = 2
const MIN_SETS_FOR_HIGH_CONFIDENCE = 4
const MIN_SETS_FOR_PROGRESSION_READINESS = 3

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

// =============================================================================
// HELPERS — pure
// =============================================================================

function lower(value: string | undefined | null): string {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function tokenInText(tokens: readonly string[], text: string): boolean {
  if (!text) return false
  for (const t of tokens) {
    if (text.includes(t)) return true
  }
  return false
}

/**
 * Coarser movement-pattern classifier above the Phase L exerciseClass.
 *
 * Uses BOTH the existing exerciseClass (so a row already classified as
 * `straight_arm_skill` is never demoted) AND keyword matching on the name to
 * separate planche from front lever from handstand etc. Returns `'unknown'`
 * when we are not confident — never invents a pattern.
 */
export function classifyMovementPattern(
  exerciseName: string | undefined | null,
  exerciseClass?: ExerciseClass,
): MovementPattern {
  const lc = lower(exerciseName)
  if (!lc) return 'unknown'

  // Straight-arm skills — fine-grained sub-patterns
  if (lc.includes('planche')) return 'planche'
  if (lc.includes('front lever')) return 'front_lever'
  if (lc.includes('back lever')) return 'back_lever'
  if (lc.includes('iron cross') || lc.includes('maltese') || lc.includes('victorian')) {
    return 'planche' // grouped with other extreme straight-arm work
  }

  if (lc.includes('handstand') || lc.includes('hspu') || lc.includes('hand stand')) {
    return 'handstand'
  }

  // Weighted variants take priority over bodyweight ancestors so a
  // "weighted pull-up" doesn't fall into vertical_pull.
  if (lc.includes('weighted dip')) return 'weighted_dip'
  if (lc.includes('weighted pull') || lc.includes('weighted chin')) return 'weighted_pull'

  if (lc.includes('muscle-up') || lc.includes('muscle up') || lc.includes('explosive pull')) {
    return 'explosive_pull'
  }

  if (lc.includes('pull-up') || lc.includes('pullup') || lc.includes('chin-up') || lc.includes('chinup')) {
    return 'vertical_pull'
  }
  if (lc.includes('row')) return 'horizontal_pull'

  if (lc.includes('dip')) return 'horizontal_press'
  if (lc.includes('press') && !lc.includes('compression')) return 'vertical_press'
  if (lc.includes('push-up') || lc.includes('pushup') || lc.includes('push up')) {
    return 'horizontal_press'
  }

  if (lc.includes('l-sit') || lc.includes('compression') || lc.includes('hollow') || lc.includes('manna')) {
    return 'core_compression'
  }
  if (lc.includes('squat') || lc.includes('lunge') || lc.includes('pistol')) return 'lower_body'

  if (lc.includes('stretch') || lc.includes('mobility') || lc.includes('cars')) return 'mobility'

  if (exerciseClass === 'straight_arm_skill') return 'planche' // worst-case grouping
  if (exerciseClass === 'mobility') return 'mobility'
  if (exerciseClass === 'accessory') return 'accessory'

  return 'unknown'
}

function pickHigher<T extends 'low' | 'moderate' | 'high' | 'medium'>(
  a: T,
  b: T,
  ordering: readonly T[],
): T {
  return ordering.indexOf(a) >= ordering.indexOf(b) ? a : b
}

const SEVERITY_ORDER = ['low', 'moderate', 'high'] as const
const CONFIDENCE_ORDER = ['low', 'medium', 'high'] as const

function maxSeverity(a: TrendSeverity, b: TrendSeverity): TrendSeverity {
  return pickHigher(a, b, SEVERITY_ORDER)
}

function maxConfidence(a: TrendConfidence, b: TrendConfidence): TrendConfidence {
  return pickHigher(a, b, CONFIDENCE_ORDER)
}

function timestampMs(ts: string | undefined | null): number {
  if (!ts) return 0
  const parsed = Date.parse(ts)
  return Number.isFinite(parsed) ? parsed : 0
}

function isHighRpe(ev: CompletedSetEvidence): boolean {
  if (typeof ev.actualRPE !== 'number') return false
  const target = typeof ev.prescribedRPE === 'number' ? ev.prescribedRPE : 8
  return ev.actualRPE >= target + 1
}

function metTarget(ev: CompletedSetEvidence): boolean | null {
  if (typeof ev.prescribedReps === 'number' && typeof ev.actualReps === 'number') {
    return ev.actualReps >= ev.prescribedReps
  }
  if (typeof ev.prescribedHoldSeconds === 'number' && typeof ev.actualHoldSeconds === 'number') {
    return ev.actualHoldSeconds >= ev.prescribedHoldSeconds
  }
  if (typeof ev.completed === 'boolean') return ev.completed
  return null
}

function beatTarget(ev: CompletedSetEvidence): boolean {
  if (typeof ev.prescribedReps === 'number' && typeof ev.actualReps === 'number') {
    return ev.actualReps > ev.prescribedReps
  }
  if (typeof ev.prescribedHoldSeconds === 'number' && typeof ev.actualHoldSeconds === 'number') {
    return ev.actualHoldSeconds > ev.prescribedHoldSeconds
  }
  return false
}

// =============================================================================
// CORE TREND ANALYSIS
// =============================================================================

export interface AnalyzePerformanceTrendsInput {
  evidence: CompletedSetEvidence[]
  /** Optional ISO clock injection for deterministic tests. */
  nowIso?: string
  /** Override the default 21-day window. Capped at 45. */
  daysBack?: number
}

/**
 * Pure deterministic trend analyzer.
 *
 * Bounded by daysBack window. Returns a structured `PerformanceTrendIntelligence`
 * object with `hasEvidence: false` + a single `insufficient_data` row when
 * there is nothing usable to read. Never throws on missing fields.
 */
export function analyzePerformanceTrends(
  input: AnalyzePerformanceTrendsInput,
): PerformanceTrendIntelligence {
  const daysBack = Math.min(Math.max(input.daysBack ?? DEFAULT_DAYS_BACK, 1), 45)
  const nowMs = timestampMs(input.nowIso) || Date.now()
  const earliestMs = nowMs - daysBack * 24 * 60 * 60 * 1000

  const empty = (): PerformanceTrendIntelligence => ({
    hasEvidence: false,
    trendSummary: 'Insufficient evidence for trend analysis.',
    exerciseTrends: [],
    movementPatternTrends: [],
    readinessPressureSignals: [],
    recoveryDebtSignals: [],
    progressionReadinessSignals: [],
    cautionFlags: [],
    evidenceWindow: { setCount: 0, sessionCount: 0, daysBack },
    confidence: 'low',
    proof: {
      exerciseGroupCount: 0,
      movementPatternCount: 0,
      isolatedAcuteSuppressedCount: 0,
      repeatedPatternCount: 0,
    },
  })

  if (!Array.isArray(input.evidence) || input.evidence.length === 0) return empty()

  // Filter to bounded window + trusted rows.
  const inWindow = input.evidence.filter((ev) => {
    if (!ev || ev.trusted === false) return false
    if (!ev.exerciseName) return false
    const t = timestampMs(ev.timestamp)
    if (t === 0) return true // unknown timestamp — keep, recency unknown
    return t >= earliestMs
  })
  if (inWindow.length === 0) return empty()

  // Group by exerciseKey (lower(exerciseName)) — deterministic and matches
  // the Phase L resolver's findFutureExerciseMatch fallback.
  const byExercise = new Map<string, CompletedSetEvidence[]>()
  for (const ev of inWindow) {
    const key = lower(ev.exerciseName)
    if (!key) continue
    if (!byExercise.has(key)) byExercise.set(key, [])
    byExercise.get(key)!.push(ev)
  }

  const exerciseTrends: ExerciseTrend[] = []
  let isolatedAcuteSuppressedCount = 0
  let repeatedPatternCount = 0
  let earliestTimestamp: string | undefined
  let latestTimestamp: string | undefined
  const allSessionIds = new Set<string>()

  for (const [exerciseKey, group] of byExercise) {
    const sample = group[0]
    const exerciseClass: ExerciseClass = sample.exerciseClass ?? 'unknown'
    const movementPattern = classifyMovementPattern(sample.exerciseName, exerciseClass)

    let highRpeCount = 0
    let underTargetCount = 0
    let onTargetCount = 0
    let beatTargetCount = 0
    let painNote = false
    let tensionNote = false
    let capacityNote = false
    const sessionIds = new Set<string>()
    let groupLatest: string | undefined

    for (const ev of group) {
      if (ev.sessionId) {
        sessionIds.add(ev.sessionId)
        allSessionIds.add(ev.sessionId)
      }
      if (ev.timestamp) {
        if (!earliestTimestamp || timestampMs(ev.timestamp) < timestampMs(earliestTimestamp)) {
          earliestTimestamp = ev.timestamp
        }
        if (!latestTimestamp || timestampMs(ev.timestamp) > timestampMs(latestTimestamp)) {
          latestTimestamp = ev.timestamp
        }
        if (!groupLatest || timestampMs(ev.timestamp) > timestampMs(groupLatest)) {
          groupLatest = ev.timestamp
        }
      }

      const target = metTarget(ev)
      const high = isHighRpe(ev)
      const beat = beatTarget(ev)
      if (high) highRpeCount += 1
      if (target === false) underTargetCount += 1
      else if (beat) beatTargetCount += 1
      else if (target === true) onTargetCount += 1

      const flags = (ev.noteFlags ?? []).map(lower)
      const text = lower(ev.note)
      if (flags.includes('pain') || tokenInText(PAIN_TOKENS, text)) painNote = true
      if (
        flags.includes('too_hard') ||
        flags.includes('technique_breakdown') ||
        tokenInText(TENSION_TOKENS, text)
      ) {
        tensionNote = true
      }
      if (
        flags.includes('sleep_fatigue') ||
        flags.includes('grip_issue') ||
        tokenInText(CAPACITY_TOKENS, text)
      ) {
        capacityNote = true
      }
    }

    const setCount = group.length
    const sessionCount = sessionIds.size
    const trendCodes: PerformanceTrendCode[] = []
    const reasonCodes: TrendReasonCode[] = []
    let severity: TrendSeverity = 'low'

    // --- Pain / joint caution (highest priority) -----------------------------
    if (painNote) {
      trendCodes.push('joint_caution_pressure_detected', 'hold_progression')
      reasonCodes.push('pain_or_caution_flag')
      severity = 'high'
    }

    // --- Repeated tension on skill / straight-arm work -----------------------
    const isStraightArm = exerciseClass === 'straight_arm_skill'
    if (tensionNote && (isStraightArm || setCount >= MIN_SETS_FOR_REPEATED_PATTERN)) {
      trendCodes.push('skill_tension_limiter_detected')
      if (isStraightArm) trendCodes.push('hold_progression')
      else trendCodes.push('lower_rpe_target')
      reasonCodes.push('tension_note_repeated')
      severity = maxSeverity(severity, isStraightArm ? 'high' : 'moderate')
    }

    if (capacityNote) {
      trendCodes.push('capacity_limiter_detected', 'extend_rest')
      reasonCodes.push('capacity_note')
      severity = maxSeverity(severity, 'moderate')
    }

    // --- Repeated high RPE across multiple sets ------------------------------
    if (highRpeCount >= 3) {
      trendCodes.push('repeated_high_rpe')
      reasonCodes.push('high_rpe_repeated_3plus')
      severity = maxSeverity(severity, 'high')
    } else if (highRpeCount >= 2) {
      trendCodes.push('repeated_high_rpe')
      reasonCodes.push('high_rpe_repeated_2')
      severity = maxSeverity(severity, 'moderate')
    }

    // --- Repeated under-target ----------------------------------------------
    if (underTargetCount >= MIN_SETS_FOR_REPEATED_PATTERN) {
      trendCodes.push('repeated_under_target')
      reasonCodes.push('under_target_repeated')
      severity = maxSeverity(severity, 'moderate')
    }

    // --- Isolated acute event vs repeated pattern ----------------------------
    // ONE bad set in window does NOT trigger an aggressive label. We mark it
    // as a single_acute_event so the coach decision falls through to
    // `maintain_and_monitor`.
    if (setCount === 1 && (highRpeCount === 1 || underTargetCount === 1)) {
      reasonCodes.push('single_acute_event')
      isolatedAcuteSuppressedCount += 1
    }

    // --- Stable / progressing on weighted strength etc. ----------------------
    const allMetTarget = onTargetCount + beatTargetCount === setCount && setCount > 0
    const allBeatTarget = beatTargetCount === setCount && setCount > 0
    if (
      allBeatTarget &&
      setCount >= MIN_SETS_FOR_PROGRESSION_READINESS &&
      !painNote &&
      !tensionNote &&
      !capacityNote &&
      highRpeCount === 0
    ) {
      trendCodes.push('progressing_well', 'ready_for_small_progression')
      reasonCodes.push('beat_target_repeated')
    } else if (
      allMetTarget &&
      setCount >= MIN_SETS_FOR_REPEATED_PATTERN &&
      !painNote &&
      !tensionNote &&
      highRpeCount === 0
    ) {
      trendCodes.push('stable_on_target', 'preserve_current_dose')
      reasonCodes.push('on_target_stable')
    } else if (
      allMetTarget &&
      setCount >= MIN_SETS_FOR_REPEATED_PATTERN &&
      highRpeCount >= 1 &&
      !painNote &&
      !tensionNote
    ) {
      trendCodes.push('high_effort_on_target', 'preserve_current_dose')
      reasonCodes.push('on_target_stable')
    }

    // --- Mixed / overreaching risk -------------------------------------------
    if (highRpeCount >= 2 && underTargetCount >= 2 && (isStraightArm || tensionNote)) {
      trendCodes.push('overreaching_risk')
      severity = maxSeverity(severity, 'high')
    } else if (
      trendCodes.length > 0 &&
      onTargetCount > 0 &&
      (highRpeCount > 0 || underTargetCount > 0) &&
      !trendCodes.includes('progressing_well') &&
      !trendCodes.includes('stable_on_target')
    ) {
      // mixed signal flag, kept low-severity — Phase L resolver still owns
      // any numeric mutation outcome.
      reasonCodes.push('mixed_signal')
    }

    // --- Insufficient data fallback ------------------------------------------
    if (trendCodes.length === 0) {
      trendCodes.push('insufficient_data', 'preserve_current_dose')
      if (setCount < MIN_SETS_FOR_REPEATED_PATTERN) reasonCodes.push('window_too_small')
    }

    // --- Confidence ---------------------------------------------------------
    let confidence: TrendConfidence = 'low'
    if (setCount >= MIN_SETS_FOR_HIGH_CONFIDENCE && sessionCount >= 2) confidence = 'high'
    else if (setCount >= MIN_SETS_FOR_REPEATED_PATTERN) confidence = 'medium'
    if (
      trendCodes.includes('insufficient_data') ||
      reasonCodes.includes('single_acute_event') ||
      reasonCodes.includes('window_too_small')
    ) {
      confidence = 'low'
    }

    // --- Concise explanation ------------------------------------------------
    const conciseExplanation = buildExerciseExplanation({
      trendCodes,
      reasonCodes,
      setCount,
      sessionCount,
      highRpeCount,
      underTargetCount,
      tensionNote,
      painNote,
      capacityNote,
      movementPattern,
    })

    if (
      trendCodes.includes('repeated_high_rpe') ||
      trendCodes.includes('repeated_under_target') ||
      trendCodes.includes('skill_tension_limiter_detected') ||
      trendCodes.includes('capacity_limiter_detected') ||
      trendCodes.includes('overreaching_risk') ||
      trendCodes.includes('progressing_well') ||
      trendCodes.includes('stable_on_target')
    ) {
      repeatedPatternCount += 1
    }

    exerciseTrends.push({
      exerciseKey,
      exerciseName: sample.exerciseName,
      exerciseClass,
      movementPattern,
      trendCodes,
      severity,
      confidence,
      reasonCodes,
      conciseExplanation,
      setCount,
      sessionCount,
      latestTimestamp: groupLatest,
    })
  }

  // Roll up to movement patterns.
  const patternBuckets = new Map<MovementPattern, MovementPatternTrend>()
  for (const t of exerciseTrends) {
    const bucket =
      patternBuckets.get(t.movementPattern) ??
      ({
        pattern: t.movementPattern,
        trendCodes: [],
        severity: 'low',
        confidence: 'low',
        exerciseKeys: [],
        setCount: 0,
        sessionCount: 0,
      } as MovementPatternTrend)
    bucket.exerciseKeys.push(t.exerciseKey)
    bucket.setCount += t.setCount
    bucket.sessionCount = Math.max(bucket.sessionCount, t.sessionCount)
    bucket.severity = maxSeverity(bucket.severity, t.severity)
    bucket.confidence = maxConfidence(bucket.confidence, t.confidence)
    for (const c of t.trendCodes) {
      if (!bucket.trendCodes.includes(c)) bucket.trendCodes.push(c)
    }
    patternBuckets.set(t.movementPattern, bucket)
  }
  const movementPatternTrends = Array.from(patternBuckets.values())

  // Derive readiness / recovery / caution / progression-readiness signals.
  const readinessPressureSignals: ReadinessPressureSignal[] = []
  const recoveryDebtSignals: ReadinessPressureSignal[] = []
  const progressionReadinessSignals: ReadinessPressureSignal[] = []
  const cautionFlags: ReadinessPressureSignal[] = []
  for (const m of movementPatternTrends) {
    if (m.trendCodes.includes('joint_caution_pressure_detected')) {
      cautionFlags.push({
        pattern: m.pattern,
        severity: m.severity,
        reason: 'pain_or_caution_flag',
      })
    }
    if (m.trendCodes.includes('repeated_high_rpe') || m.trendCodes.includes('overreaching_risk')) {
      recoveryDebtSignals.push({
        pattern: m.pattern,
        severity: m.severity,
        reason: 'high_rpe_repeated_2',
      })
    }
    if (
      m.trendCodes.includes('skill_tension_limiter_detected') ||
      m.trendCodes.includes('capacity_limiter_detected')
    ) {
      readinessPressureSignals.push({
        pattern: m.pattern,
        severity: m.severity,
        reason: m.trendCodes.includes('skill_tension_limiter_detected')
          ? 'tension_note_repeated'
          : 'capacity_note',
      })
    }
    if (m.trendCodes.includes('ready_for_small_progression')) {
      progressionReadinessSignals.push({
        pattern: m.pattern,
        severity: 'low',
        reason: 'beat_target_repeated',
      })
    }
  }

  const overallConfidence: TrendConfidence = exerciseTrends.reduce<TrendConfidence>(
    (acc, t) => maxConfidence(acc, t.confidence),
    'low',
  )

  return {
    hasEvidence: true,
    trendSummary: buildTrendSummary({
      exerciseTrends,
      cautionFlags,
      recoveryDebtSignals,
      readinessPressureSignals,
      progressionReadinessSignals,
    }),
    exerciseTrends,
    movementPatternTrends,
    readinessPressureSignals,
    recoveryDebtSignals,
    progressionReadinessSignals,
    cautionFlags,
    evidenceWindow: {
      setCount: inWindow.length,
      sessionCount: allSessionIds.size,
      daysBack,
      earliestTimestamp,
      latestTimestamp,
    },
    confidence: overallConfidence,
    proof: {
      exerciseGroupCount: exerciseTrends.length,
      movementPatternCount: movementPatternTrends.length,
      isolatedAcuteSuppressedCount,
      repeatedPatternCount,
    },
  }
}

// =============================================================================
// EXPLANATION BUILDERS
// =============================================================================

function buildExerciseExplanation(args: {
  trendCodes: PerformanceTrendCode[]
  reasonCodes: TrendReasonCode[]
  setCount: number
  sessionCount: number
  highRpeCount: number
  underTargetCount: number
  tensionNote: boolean
  painNote: boolean
  capacityNote: boolean
  movementPattern: MovementPattern
}): string {
  const { trendCodes, setCount, highRpeCount, underTargetCount } = args
  if (trendCodes.includes('joint_caution_pressure_detected')) {
    return `Pain or caution flag reported across ${setCount} set(s) — protect next exposure.`
  }
  if (trendCodes.includes('skill_tension_limiter_detected')) {
    return `Repeated tension on tendon-demanding work across ${setCount} set(s).`
  }
  if (trendCodes.includes('overreaching_risk')) {
    return `${highRpeCount} high-RPE / ${underTargetCount} under-target set(s) — overreaching risk.`
  }
  if (trendCodes.includes('repeated_under_target')) {
    return `${underTargetCount} under-target set(s) at high effort across recent sessions.`
  }
  if (trendCodes.includes('repeated_high_rpe')) {
    return `${highRpeCount} sets above target RPE across recent sessions.`
  }
  if (trendCodes.includes('capacity_limiter_detected')) {
    return `Capacity / fatigue notes repeated across recent sessions.`
  }
  if (trendCodes.includes('progressing_well')) {
    return `Beat target across ${setCount} sets at moderate effort — small progression candidate.`
  }
  if (trendCodes.includes('stable_on_target')) {
    return `On target across ${setCount} sets — preserve current dose.`
  }
  if (trendCodes.includes('high_effort_on_target')) {
    return `Hit target at high effort — productive working sets.`
  }
  if (args.reasonCodes.includes('single_acute_event')) {
    return `Isolated bad set in window — maintain and monitor.`
  }
  return `Insufficient repeated evidence for a trend yet.`
}

function buildTrendSummary(args: {
  exerciseTrends: ExerciseTrend[]
  cautionFlags: ReadinessPressureSignal[]
  recoveryDebtSignals: ReadinessPressureSignal[]
  readinessPressureSignals: ReadinessPressureSignal[]
  progressionReadinessSignals: ReadinessPressureSignal[]
}): string {
  if (args.exerciseTrends.length === 0) {
    return 'Insufficient evidence for trend analysis.'
  }
  const parts: string[] = []
  if (args.cautionFlags.length > 0) {
    parts.push(`${args.cautionFlags.length} caution flag(s)`)
  }
  if (args.recoveryDebtSignals.length > 0) {
    parts.push(`${args.recoveryDebtSignals.length} recovery-pressure pattern(s)`)
  }
  if (args.readinessPressureSignals.length > 0) {
    parts.push(`${args.readinessPressureSignals.length} capacity / tension limiter(s)`)
  }
  if (args.progressionReadinessSignals.length > 0) {
    parts.push(`${args.progressionReadinessSignals.length} progression-ready pattern(s)`)
  }
  if (parts.length === 0) {
    return `${args.exerciseTrends.length} exercise(s) tracked — no material trend signal.`
  }
  return `Detected ${parts.join(', ')} across recent sessions.`
}

// =============================================================================
// COACH DECISION LAYER
// =============================================================================

export interface DeriveCoachDecisionsInput {
  intelligence: PerformanceTrendIntelligence
  /** Evidence used to populate evidenceSessionIds per decision. */
  evidence: CompletedSetEvidence[]
  /** Optional selected-skills set so coach can avoid overriding doctrine on protected skills. */
  selectedSkillKeys?: string[]
}

/**
 * Convert `PerformanceTrendIntelligence` into one CoachDecision per exercise.
 *
 * Coach decisions are RECOMMENDATIONS only. The Phase L resolver
 * (`deriveFuturePrescriptionMutations`) and the applier
 * (`applyFuturePrescriptionMutations`) remain the final mutation owners and
 * obey their own numeric bounds. This function just expresses what the
 * trend intelligence is asking for in structured form.
 */
export function deriveCoachDecisionsFromPerformanceTrends(
  input: DeriveCoachDecisionsInput,
): CoachDecision[] {
  const intel = input.intelligence
  if (!intel.hasEvidence || intel.exerciseTrends.length === 0) return []

  const evidenceByKey = new Map<string, CompletedSetEvidence[]>()
  for (const ev of input.evidence) {
    if (!ev || !ev.exerciseName) continue
    const k = lower(ev.exerciseName)
    if (!evidenceByKey.has(k)) evidenceByKey.set(k, [])
    evidenceByKey.get(k)!.push(ev)
  }

  const out: CoachDecision[] = []
  for (const t of intel.exerciseTrends) {
    const groupEvidence = evidenceByKey.get(t.exerciseKey) ?? []
    const evidenceSessionIds = Array.from(
      new Set(groupEvidence.map((e) => e.sessionId).filter((s): s is string => !!s)),
    )

    let action: CoachDecisionAction = 'maintain_and_monitor'
    const allowed: CoachAllowedMutation[] = []
    const blocked: CoachAllowedMutation[] = []

    const codes = t.trendCodes
    const isStraightArm = t.exerciseClass === 'straight_arm_skill'

    if (codes.includes('joint_caution_pressure_detected')) {
      action = 'hold_progression'
      allowed.push('hold_progression', 'add_recovery_note_only', 'reduce_rpe_target')
      blocked.push('increase_progression_slightly')
    } else if (codes.includes('overreaching_risk')) {
      action = isStraightArm ? 'hold_progression' : 'reduce_volume'
      allowed.push('hold_progression', 'reduce_next_exposure_volume', 'reduce_rpe_target')
      blocked.push('increase_progression_slightly')
    } else if (codes.includes('skill_tension_limiter_detected')) {
      action = 'hold_progression'
      allowed.push('hold_progression', 'reduce_rpe_target')
      blocked.push('increase_progression_slightly')
    } else if (codes.includes('repeated_high_rpe') && codes.includes('repeated_under_target')) {
      action = isStraightArm ? 'hold_progression' : 'reduce_volume'
      allowed.push(
        'reduce_next_exposure_volume',
        'hold_progression',
        'reduce_rpe_target',
        'extend_rest_guidance',
      )
      blocked.push('increase_progression_slightly')
    } else if (codes.includes('repeated_high_rpe')) {
      action = 'lower_rpe_target'
      allowed.push('reduce_rpe_target', 'hold_progression', 'extend_rest_guidance')
      blocked.push('increase_progression_slightly')
    } else if (codes.includes('repeated_under_target')) {
      action = isStraightArm ? 'hold_progression' : 'reduce_volume'
      allowed.push('reduce_next_exposure_volume', 'hold_progression')
      blocked.push('increase_progression_slightly')
    } else if (codes.includes('capacity_limiter_detected')) {
      action = 'extend_rest'
      allowed.push('extend_rest_guidance', 'preserve_prescription')
      blocked.push('increase_progression_slightly')
    } else if (codes.includes('progressing_well') || codes.includes('ready_for_small_progression')) {
      // Skill progression remains doctrine-owned. Only weighted strength / accessory
      // can take a small progression bump from this layer.
      if (isStraightArm) {
        action = 'preserve_current_dose'
        allowed.push('preserve_prescription')
        blocked.push('increase_progression_slightly')
      } else {
        action = 'small_progression'
        allowed.push('increase_progression_slightly', 'preserve_prescription')
      }
    } else if (codes.includes('stable_on_target') || codes.includes('high_effort_on_target')) {
      action = 'preserve_current_dose'
      allowed.push('preserve_prescription')
      blocked.push('increase_progression_slightly')
    } else if (codes.includes('insufficient_data')) {
      action = 'insufficient_data_no_change'
      allowed.push('preserve_prescription')
      blocked.push('reduce_next_exposure_volume', 'increase_progression_slightly')
    } else {
      action = 'maintain_and_monitor'
      allowed.push('preserve_prescription')
    }

    out.push({
      exerciseKey: t.exerciseKey,
      exerciseName: t.exerciseName,
      movementPattern: t.movementPattern,
      recommendedAction: action,
      severity: t.severity,
      targetScope: 'exercise',
      allowedMutationTypes: allowed,
      blockedMutationTypes: blocked,
      reasonCodes: t.reasonCodes,
      trendCodes: t.trendCodes,
      conciseExplanation: t.conciseExplanation,
      confidence: t.confidence,
      evidenceSessionIds,
      evidenceSetCount: t.setCount,
    })
  }

  return out
}

// =============================================================================
// LIGHT STAMP SHAPES — what gets attached to a Phase L mutation / stamp.
//
// These are intentionally narrow / serializable subsets of ExerciseTrend +
// CoachDecision so the JSON-safe `performanceAdaptation` stamp on each
// exercise can carry the proof line without bloating saved program objects.
// =============================================================================

export interface ExerciseTrendStamp {
  trendCodes: PerformanceTrendCode[]
  movementPattern: MovementPattern
  severity: TrendSeverity
  confidence: TrendConfidence
  reasonCodes: TrendReasonCode[]
  conciseExplanation: string
  setCount: number
  sessionCount: number
  /**
   * The Phase L `PerformanceSignalType` codes this trend would have
   * upgraded / suppressed if the resolver were trend-aware. Useful for the
   * trend corridor proof in dev tooling.
   */
  upgradedSignalTypes?: PerformanceSignalType[]
}

export interface CoachDecisionStamp {
  action: CoachDecisionAction
  targetScope: CoachDecision['targetScope']
  allowedMutationTypes: CoachAllowedMutation[]
  blockedMutationTypes: CoachAllowedMutation[]
  explanation: string
}

/** Pick the small JSON-safe subset of `ExerciseTrend` for the stamp. */
export function pickExerciseTrendStamp(trend: ExerciseTrend): ExerciseTrendStamp {
  return {
    trendCodes: trend.trendCodes,
    movementPattern: trend.movementPattern,
    severity: trend.severity,
    confidence: trend.confidence,
    reasonCodes: trend.reasonCodes,
    conciseExplanation: trend.conciseExplanation,
    setCount: trend.setCount,
    sessionCount: trend.sessionCount,
  }
}

/** Pick the small JSON-safe subset of `CoachDecision` for the stamp. */
export function pickCoachDecisionStamp(decision: CoachDecision): CoachDecisionStamp {
  return {
    action: decision.recommendedAction,
    targetScope: decision.targetScope,
    allowedMutationTypes: decision.allowedMutationTypes,
    blockedMutationTypes: decision.blockedMutationTypes,
    explanation: decision.conciseExplanation,
  }
}

// =============================================================================
// PUBLIC RE-EXPORTS — bounds for tests / docs
// =============================================================================

export const PHASE_O_TREND_CONSTANTS = {
  DEFAULT_DAYS_BACK,
  SHORT_WINDOW_DAYS,
  MIN_SETS_FOR_REPEATED_PATTERN,
  MIN_SETS_FOR_HIGH_CONFIDENCE,
  MIN_SETS_FOR_PROGRESSION_READINESS,
} as const
