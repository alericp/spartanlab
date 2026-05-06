// =============================================================================
// [AB11-1] PROGRAM CALIBRATION RECOMMENDATION ENGINE
// =============================================================================
//
// Pure, source-owned, deterministic helper that consumes the user's
// CURRENT PROGRAM TRUTH (selected skills / primary goal / experience level /
// equipment) and produces a typed list of recommended baseline / progress
// tests for the Program page Calibration Checkpoint surface.
//
// CONTRACTS (source-of-truth):
//   - The catalog of tests is OWNED by `lib/benchmark-testing-engine.ts`
//     (`BASELINE_TESTS: BaselineTestDefinition[]`). We DO NOT redefine tests
//     here. We only project / filter / annotate that catalog.
//   - The skill keys are OWNED by `lib/skill-state-service.ts`
//     (`SkillKey`).
//   - The visible Program-page card reads ONLY from the typed
//     `ProgramCalibrationRecommendation` object returned by this engine.
//     There is no parallel cosmetic copy in the UI layer.
//
// SCOPE:
//   - AB11-1 surfaces RECOMMENDATIONS only. Result capture is deferred to
//     AB11-2 (the existing `createBenchmark()` server function in
//     `lib/benchmark-testing-engine.ts` is the canonical capture path; no
//     parallel storage is created here).
//   - This engine NEVER mutates the program. It is a derived display helper.
//   - This engine is PURE: no I/O, no DB, no fetch. Server pages may pass
//     in optional benchmark history; if absent, the engine degrades
//     honestly ("Not enough logged history yet — start with baseline").
//
// =============================================================================

import {
  BASELINE_TESTS,
  type BaselineTestDefinition,
  type BenchmarkMovementFamily,
  type TestCategory,
  type TestUnit,
} from '../benchmark-testing-engine'
import type { SkillKey } from '../skill-state-service'

// =============================================================================
// PUBLIC CONTRACT
// =============================================================================

/**
 * High-level test category surfaced to the UI. A superset of the
 * `BaselineTestDefinition.testCategory` from the engine, because we want
 * room for future categories (mobility / readiness) without re-shaping
 * existing benchmark records. Producer = this file. Consumer =
 * `CalibrationCheckpointCard.tsx`.
 */
export type CalibrationTestSurfaceCategory =
  | 'skill_hold_test'
  | 'strength_rep_test'
  | 'weighted_strength_test'
  | 'endurance_capacity_test'
  | 'mobility_range_test'
  | 'joint_tolerance_test'
  | 'recovery_readiness_test'

/**
 * The reason category for why a test was recommended. Drives UI tone
 * (default / urgent / advisory) and is honest about whether a test is
 * mandatory, suggested, or simply a starting baseline.
 */
export type CalibrationRecommendationReasonCode =
  | 'no_baseline_yet'
  | 'goal_alignment'
  | 'skill_alignment'
  | 'essential_baseline'
  | 'plateau_suspected'
  | 'overdue_retest'
  | 'protective_check_before_progression'

/**
 * Athlete-facing limiter hypothesis. Conservative — only set when there
 * is enough signal (a goal/skill mapping AND a real test recommendation).
 * If we cannot prove a limiter we leave it `null`.
 */
export type CalibrationLimiterType =
  | 'pull_strength'
  | 'push_strength'
  | 'straight_arm_pull_strength'
  | 'straight_arm_push_strength'
  | 'compression_strength'
  | 'overhead_stability'
  | 'ring_stability'
  | 'mobility_range'
  | 'unknown'

/**
 * Whether testing is appropriate today, conservatively.
 *  - `unknown` = we have no readiness signal and we will not pretend to
 *  - `safe`    = positive signal (or default when no contraindication)
 *  - `delay`   = a contraindication was passed in (e.g. recent hard
 *                session), with reason in `blockedReasons`
 */
export type CalibrationSafetyStatus = 'safe' | 'delay' | 'unknown'

/**
 * One recommended test, projected from the canonical
 * `BaselineTestDefinition` plus our reason annotation.
 *
 * EVERY display-visible field is derived from the test definition or from
 * the typed reason object — there is no separate cosmetic copy.
 */
export interface CalibrationRecommendedTest {
  /** Engine-canonical test name (e.g. `max_pull_ups`). */
  testName: string
  /** Engine-canonical display name (e.g. `Max Pull-Ups`). */
  displayName: string
  /** Engine-canonical movement family. */
  movementFamily: BenchmarkMovementFamily
  /** Coarse surface category for UI tone (skill_hold / strength_rep / ...). */
  surfaceCategory: CalibrationTestSurfaceCategory
  /** Engine priority (`essential` | `recommended` | `optional`). */
  priority: BaselineTestDefinition['priority']
  /**
   * [AB11-2] Canonical test category from the catalog. Required by the
   * result-entry payload for `POST /api/benchmarks` so the UI never
   * guesses. Producer: this engine. Consumer: `CalibrationCheckpointCard`
   * (submit) / `app/api/benchmarks/route.ts` (validation).
   */
  testCategory: TestCategory
  /**
   * [AB11-2] Canonical measurement unit from the catalog (`reps` |
   * `seconds` | `kg` | `lbs` | `progression_level` | `percentage`).
   * Required for the result-entry payload. Producer: this engine.
   * Consumer: `CalibrationCheckpointCard` + benchmark API.
   */
  testUnit: TestUnit
  /** Estimated time-on-task in minutes (engine-canonical). */
  estimatedTimeMinutes: number
  /** One-line athlete-facing description (engine-canonical). */
  description: string
  /** Reason code driving UI tone. */
  reasonCode: CalibrationRecommendationReasonCode
  /**
   * Athlete-facing reason, derived from the test definition (skillsAffected,
   * displayName, movementFamily) and the reason code. NEVER hand-written
   * copy that can drift from the canonical test.
   */
  reasonText: string
  /**
   * Which selected skill(s) this test informs. Empty if the test was
   * picked as an essential baseline rather than a goal-aligned test.
   */
  influencesSkills: SkillKey[]
  /**
   * What the result will influence in future programming. Plain-English
   * but DERIVED from the test definition's `skillsAffected` +
   * `movementFamily`.
   */
  programInfluenceNote: string
  /**
   * [AB11-2] Whether the user has at least one persisted benchmark for
   * this `testName`. Computed from the optional
   * `latestBenchmarksByTestName` map on the input. Used by the UI to
   * default `isBaseline` to `false` on submit and to render a "Latest"
   * line when a known result exists.
   */
  alreadyTested: boolean
  /**
   * [AB11-2] Latest known benchmark for this `testName`, if any. Pure
   * projection from the input map — this engine never fetches. The shape
   * is deliberately narrow (no internal `Benchmark` fields) so the
   * engine stays I/O-free and the UI stays honest about what it knows.
   */
  latestKnownResult:
    | {
        value: number
        unit: TestUnit
        testedAt: string
        changePercent: number | null
      }
    | null
}

/**
 * [AB11-2] Narrow projection of a stored `Benchmark` row that the engine
 * accepts as input. Producer: caller (e.g. `CalibrationCheckpointCard`
 * after fetching `GET /api/benchmarks?action=list`). Consumer: this
 * engine. Kept narrow so the engine cannot accidentally take a hard
 * dependency on the wider `Benchmark` shape.
 */
export interface LatestBenchmarkSummary {
  testValue: number
  testUnit: TestUnit
  testDate: string
  changePercent: number | null
}

/**
 * The full recommendation object consumed by the Program-page surface.
 * AB11-2 / AB11-3 may extend this with `latestKnownResult` and
 * `nextRetestWindow` fields once result capture is wired.
 */
export interface ProgramCalibrationRecommendation {
  /** 0–3 tests, ranked. May be empty if the program has no usable signal. */
  recommendedTests: CalibrationRecommendedTest[]
  /** One-sentence athlete-facing roll-up of why these tests were picked. */
  reasonSummary: string
  /** Best-guess limiter, conservatively null when we cannot prove one. */
  primaryLimiterHypothesis: CalibrationLimiterType | null
  /** The single highest-priority next test (mirrors recommendedTests[0]). */
  nextCalibrationPriority: string | null
  /** 0..1. Increases with goal/skill alignment AND test count. */
  confidence: number
  /** Whether testing is safe today, conservatively. */
  safeToTestToday: CalibrationSafetyStatus
  /** Reasons testing should be delayed today (empty unless `delay`). */
  blockedReasons: string[]
  /**
   * Per-area program-influence notes. Derived from the recommended test
   * set so the UI never invents copy beyond the typed object.
   */
  programInfluenceNotes: string[]
  /**
   * Audit: which engine version produced this recommendation. AB11-2
   * adds the `latestBenchmarksByTestName` input + `testCategory` /
   * `testUnit` / `alreadyTested` / `latestKnownResult` outputs without
   * removing any AB11-1 field.
   */
  engineVersion:
    | 'ab11-1-baseline-progress-recommender'
    | 'ab11-2-result-entry-recommender'
}

// =============================================================================
// INPUT CONTRACT
// =============================================================================

/**
 * Minimal program-derived inputs. Every field is optional / honestly
 * narrow — the helper degrades gracefully when fields are missing.
 */
export interface ProgramCalibrationInput {
  /** Selected skills from canonical profile (free strings; we narrow internally). */
  selectedSkills?: readonly string[] | null
  /** Primary goal string from canonical profile. */
  primaryGoal?: string | null
  /** Optional secondary goal string. */
  secondaryGoal?: string | null
  /** Equipment list — used to drop tests requiring unavailable equipment. */
  equipmentAvailable?: readonly string[] | null
  /**
   * Whether the user has already logged at least one benchmark for a given
   * test name. We do NOT fetch the DB here — the page passes this set in
   * (or omits it). Absent set = treat all as un-tested.
   *
   * NOTE: When `latestBenchmarksByTestName` is supplied, the engine
   * derives "already tested" from its keys and `alreadyTestedNames`
   * becomes redundant. Either input is sufficient on its own.
   */
  alreadyTestedNames?: ReadonlySet<string> | null
  /**
   * [AB11-2] Optional map of the user's latest benchmark per `testName`,
   * sourced by the caller from `GET /api/benchmarks?action=list` (or the
   * in-process equivalent). The engine uses it for two things:
   *   1. Computes `alreadyTested` per recommended test.
   *   2. Projects `latestKnownResult` onto the recommended test row.
   *
   * The engine never reads any other field; it never fetches; it never
   * mutates the map. Absent map = treat all as un-tested with no latest
   * result, exactly as in AB11-1.
   */
  latestBenchmarksByTestName?:
    | ReadonlyMap<string, LatestBenchmarkSummary>
    | null
  /**
   * Optional contraindication signal from the readiness layer. If
   * provided and `kind === 'delay'`, the engine returns `delay` with the
   * given reason.
   */
  readinessContraindication?: { kind: 'delay'; reason: string } | null
}

// =============================================================================
// INTERNAL: GOAL / SKILL → SKILLKEY MAPPING
// =============================================================================

const SKILL_KEY_VALUES: readonly SkillKey[] = [
  'front_lever',
  'back_lever',
  'planche',
  'hspu',
  'muscle_up',
  'l_sit',
] as const

/**
 * Loose, conservative mapping of free-string goal/skill tokens onto the
 * canonical SkillKey set. Returns null if no confident mapping exists.
 * We only map tokens we can prove out of the canonical SkillKey list,
 * with a small set of well-known aliases for `handstand` and `core`.
 */
function normalizeToSkillKey(token: string | null | undefined): SkillKey | null {
  if (!token) return null
  const t = token.toLowerCase().replace(/[\s-]+/g, '_')

  for (const key of SKILL_KEY_VALUES) {
    if (t === key) return key
    if (t.includes(key)) return key
  }

  // Well-known aliases (conservative; only for tokens we can prove map
  // 1:1 to a canonical SkillKey).
  if (t === 'handstand' || t === 'handstands') return 'hspu'
  if (t === 'lsit' || t === 'l_sit_hold') return 'l_sit'
  if (t === 'frontlever') return 'front_lever'
  if (t === 'backlever') return 'back_lever'
  if (t === 'muscleup' || t === 'mu') return 'muscle_up'

  return null
}

function mapSkillsFromInput(
  input: ProgramCalibrationInput,
): { primarySkill: SkillKey | null; allSkills: SkillKey[] } {
  const primarySkill = normalizeToSkillKey(input.primaryGoal ?? null)

  const seen = new Set<SkillKey>()
  if (primarySkill) seen.add(primarySkill)

  const secondarySkill = normalizeToSkillKey(input.secondaryGoal ?? null)
  if (secondarySkill) seen.add(secondarySkill)

  for (const raw of input.selectedSkills ?? []) {
    const k = normalizeToSkillKey(raw)
    if (k) seen.add(k)
  }

  return { primarySkill, allSkills: Array.from(seen) }
}

// =============================================================================
// INTERNAL: SURFACE CATEGORY MAPPING
// =============================================================================

function surfaceCategoryFor(
  def: BaselineTestDefinition,
): CalibrationTestSurfaceCategory {
  if (def.testCategory === 'flexibility') return 'mobility_range_test'
  if (def.testCategory === 'endurance') return 'endurance_capacity_test'
  if (def.testCategory === 'skill') return 'skill_hold_test'
  // strength branch: weighted vs rep
  if (def.testUnit === 'kg' || def.testUnit === 'lbs') return 'weighted_strength_test'
  return 'strength_rep_test'
}

// =============================================================================
// INTERNAL: LIMITER HYPOTHESIS
// =============================================================================

function limiterFromMovementFamily(
  family: BenchmarkMovementFamily,
): CalibrationLimiterType {
  switch (family) {
    case 'vertical_pull':
    case 'horizontal_pull':
    case 'explosive_pull':
      return 'pull_strength'
    case 'straight_arm_pull':
      return 'straight_arm_pull_strength'
    case 'vertical_push':
    case 'dip_pattern':
      return 'push_strength'
    case 'straight_arm_push':
      return 'straight_arm_push_strength'
    case 'compression_core':
      return 'compression_strength'
    case 'handstand':
      return 'overhead_stability'
    case 'ring_support':
      return 'ring_stability'
    default:
      return 'unknown'
  }
}

// =============================================================================
// INTERNAL: REASON-TEXT BUILDERS (derived from the test definition)
// =============================================================================

function humanizeFamily(family: BenchmarkMovementFamily): string {
  return family.replace(/_/g, ' ')
}

function humanizeSkill(skill: SkillKey): string {
  return skill.replace(/_/g, ' ')
}

function reasonTextFor(
  def: BaselineTestDefinition,
  reasonCode: CalibrationRecommendationReasonCode,
  alignedSkills: SkillKey[],
): string {
  const family = humanizeFamily(def.movementFamily)
  switch (reasonCode) {
    case 'no_baseline_yet':
      return `No ${def.displayName} baseline recorded yet — calibrates ${family} for future progression decisions.`
    case 'goal_alignment':
    case 'skill_alignment': {
      const skill = alignedSkills[0]
      const skillLabel = skill ? humanizeSkill(skill) : family
      return `Calibrates ${family} as a primary indicator for your ${skillLabel} work.`
    }
    case 'essential_baseline':
      return `Essential baseline — ${def.displayName} anchors ${family} dosage decisions.`
    case 'plateau_suspected':
      return `${def.displayName} progress may have stalled — retest to confirm before changing stimulus.`
    case 'overdue_retest':
      return `It has been a while since your last ${def.displayName} test — refresh the baseline.`
    case 'protective_check_before_progression':
      return `Protective check — confirms ${family} tolerance before increasing ${def.displayName} load.`
  }
}

function programInfluenceNoteFor(
  def: BaselineTestDefinition,
  alignedSkills: SkillKey[],
): string {
  const skillsTxt = alignedSkills.length
    ? alignedSkills.map(humanizeSkill).join(', ')
    : humanizeFamily(def.movementFamily)
  return `Result feeds dosage and progression decisions for ${skillsTxt}.`
}

// =============================================================================
// INTERNAL: EQUIPMENT GATING
// =============================================================================

/**
 * Drop tests whose movement family clearly cannot be performed with the
 * user's available equipment. Conservative: when in doubt we KEEP the
 * test (the engine has its own instruction text). We only filter the
 * cases we can prove.
 *
 * This intentionally only matches the equipment tokens already used by
 * the program profile (e.g. `pull_up_bar`, `parallel_bars`, `rings`,
 * `parallettes`). If the equipment list is missing or empty we keep all.
 */
function isTestEquipmentReachable(
  def: BaselineTestDefinition,
  equipment: readonly string[] | null | undefined,
): boolean {
  if (!equipment || equipment.length === 0) return true
  const eq = new Set(equipment.map((e) => e.toLowerCase()))

  switch (def.movementFamily) {
    case 'vertical_pull':
    case 'straight_arm_pull':
    case 'explosive_pull':
      return eq.has('pull_up_bar') || eq.has('rings') || eq.has('bar')
    case 'dip_pattern':
      return (
        eq.has('parallel_bars') ||
        eq.has('rings') ||
        eq.has('parallettes') ||
        eq.has('dip_bars')
      )
    case 'ring_support':
      return eq.has('rings')
    case 'handstand':
      // Wall handstand needs only a wall — universally available.
      return true
    case 'compression_core':
      // L-sit can be done on floor/parallettes/bars — broadly reachable.
      return true
    default:
      return true
  }
}

// =============================================================================
// PUBLIC: BUILD RECOMMENDATION
// =============================================================================

/**
 * Build a typed program-aware calibration recommendation.
 * Pure / deterministic. No I/O. Safe to call client-side.
 */
export function buildProgramCalibrationRecommendation(
  input: ProgramCalibrationInput,
): ProgramCalibrationRecommendation {
  // ----- 1. Readiness contraindication (caller-passed) ----------------------
  const blockedReasons: string[] = []
  let safeToTestToday: CalibrationSafetyStatus = 'unknown'
  if (input.readinessContraindication?.kind === 'delay') {
    safeToTestToday = 'delay'
    blockedReasons.push(input.readinessContraindication.reason)
  } else {
    // No explicit signal: leave `unknown` so the UI can render an honest
    // "we don't have a recovery signal yet" line instead of pretending.
    safeToTestToday = 'unknown'
  }

  // ----- 2. Map goals → SkillKey set ---------------------------------------
  const { primarySkill, allSkills } = mapSkillsFromInput(input)
  // [AB11-2] Build the canonical "already tested" set from EITHER input.
  // The benchmarks-by-name map is the richer source (also drives
  // latestKnownResult); alreadyTestedNames is supported for backward
  // compatibility with AB11-1 callers.
  const benchmarksMap = input.latestBenchmarksByTestName ?? null
  const alreadyTested: ReadonlySet<string> = (() => {
    if (input.alreadyTestedNames && input.alreadyTestedNames.size > 0) {
      const merged = new Set<string>(input.alreadyTestedNames)
      if (benchmarksMap) for (const k of benchmarksMap.keys()) merged.add(k)
      return merged
    }
    if (benchmarksMap) return new Set<string>(benchmarksMap.keys())
    return new Set<string>()
  })()
  const equipment = input.equipmentAvailable ?? null

  // ----- 3. Score each catalog test ----------------------------------------
  type Scored = {
    def: BaselineTestDefinition
    score: number
    alignedSkills: SkillKey[]
    reasonCode: CalibrationRecommendationReasonCode
    alreadyTested: boolean
  }

  const scored: Scored[] = []
  for (const def of BASELINE_TESTS) {
    if (!isTestEquipmentReachable(def, equipment)) continue

    const aligned = def.skillsAffected.filter((s) => allSkills.includes(s))
    const wasTested = alreadyTested.has(def.testName)
    const isUnTested = !wasTested

    let score = 0
    let reasonCode: CalibrationRecommendationReasonCode = 'essential_baseline'

    // Strong: aligns with primary skill
    if (primarySkill && def.skillsAffected.includes(primarySkill)) {
      score += 100
      reasonCode = 'goal_alignment'
    }
    // Medium: aligns with any selected skill
    if (aligned.length > 0 && reasonCode !== 'goal_alignment') {
      score += 60
      reasonCode = 'skill_alignment'
    }
    // Baseline boost
    if (def.priority === 'essential') score += 25
    if (def.priority === 'recommended') score += 10
    // Unbenched athletes get every relevant essential first
    if (isUnTested && def.priority === 'essential') {
      score += 20
      if (reasonCode === 'essential_baseline') reasonCode = 'no_baseline_yet'
    }
    // [AB11-2] Already-tested deprioritization. Goal-aligned tests are
    // still essential to retest, so they keep most of their score; plain
    // essential baselines tested once are gently pushed below new tests
    // so the checkpoint surfaces the next missing baseline first.
    if (wasTested) {
      if (reasonCode === 'goal_alignment') {
        score -= 5
        reasonCode = 'overdue_retest'
      } else if (reasonCode === 'skill_alignment') {
        score -= 10
        reasonCode = 'overdue_retest'
      } else {
        score -= 20
      }
    }
    // Cheap tests beat expensive ones at the margin
    score += Math.max(0, 5 - def.estimatedTimeMinutes)

    if (score <= 0) continue
    scored.push({
      def,
      score,
      alignedSkills: aligned,
      reasonCode,
      alreadyTested: wasTested,
    })
  }

  scored.sort((a, b) => b.score - a.score)

  // ----- 4. Pick top 3, dedup by movement family ---------------------------
  const seenFamilies = new Set<BenchmarkMovementFamily>()
  const picks: Scored[] = []
  for (const s of scored) {
    if (seenFamilies.has(s.def.movementFamily)) continue
    seenFamilies.add(s.def.movementFamily)
    picks.push(s)
    if (picks.length >= 3) break
  }

  // ----- 5. Project to public shape ----------------------------------------
  const recommendedTests: CalibrationRecommendedTest[] = picks.map((s) => {
    // [AB11-2] Honest latest-result projection. Falls back to null when
    // no map was provided OR the testName is missing — never invented.
    const latest = benchmarksMap?.get(s.def.testName) ?? null
    const latestKnownResult = latest
      ? {
          value: latest.testValue,
          unit: latest.testUnit,
          testedAt: latest.testDate,
          changePercent: latest.changePercent,
        }
      : null
    return {
      testName: s.def.testName,
      displayName: s.def.displayName,
      movementFamily: s.def.movementFamily,
      surfaceCategory: surfaceCategoryFor(s.def),
      priority: s.def.priority,
      // [AB11-2] Canonical category/unit projected from the catalog so
      // the UI never guesses when building the `BenchmarkInput` payload.
      testCategory: s.def.testCategory,
      testUnit: s.def.testUnit,
      estimatedTimeMinutes: s.def.estimatedTimeMinutes,
      description: s.def.description,
      reasonCode: s.reasonCode,
      reasonText: reasonTextFor(s.def, s.reasonCode, s.alignedSkills),
      influencesSkills: s.alignedSkills,
      programInfluenceNote: programInfluenceNoteFor(s.def, s.alignedSkills),
      alreadyTested: s.alreadyTested,
      latestKnownResult,
    }
  })

  // ----- 6. Aggregate roll-up fields ---------------------------------------
  const primaryPick = picks[0] ?? null
  const primaryLimiterHypothesis: CalibrationLimiterType | null = primaryPick
    ? limiterFromMovementFamily(primaryPick.def.movementFamily)
    : null

  const reasonSummary = (() => {
    if (recommendedTests.length === 0) {
      return 'Not enough goal or skill signal yet to recommend a calibration test. Pick a primary goal or selected skill to start.'
    }
    if (primarySkill && recommendedTests[0].influencesSkills.includes(primarySkill)) {
      return `Calibration anchored to your primary goal (${humanizeSkill(primarySkill)}). Tests are picked to inform progression decisions, not to add training volume.`
    }
    if (recommendedTests.some((t) => t.reasonCode === 'no_baseline_yet')) {
      return 'No baseline benchmarks recorded yet. Start with these short tests to anchor future progression decisions.'
    }
    return 'Essential baselines that inform dosage and progression decisions across your program.'
  })()

  // confidence: alignment quality + count
  let confidence = 0
  if (primaryPick) confidence += 0.4
  if (primarySkill && primaryPick && primaryPick.def.skillsAffected.includes(primarySkill)) {
    confidence += 0.3
  }
  confidence += Math.min(0.3, recommendedTests.length * 0.1)
  confidence = Math.min(1, Math.max(0, confidence))

  const programInfluenceNotes = Array.from(
    new Set(recommendedTests.map((t) => t.programInfluenceNote)),
  )

  return {
    recommendedTests,
    reasonSummary,
    primaryLimiterHypothesis,
    nextCalibrationPriority: recommendedTests[0]?.testName ?? null,
    confidence,
    safeToTestToday,
    blockedReasons,
    programInfluenceNotes,
    engineVersion: 'ab11-2-result-entry-recommender',
  }
}
