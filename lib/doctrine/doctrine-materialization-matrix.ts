// =============================================================================
// [PHASE 4H] DOCTRINE MATERIALIZATION MATRIX + FULL ONBOARDING TRUTH MAP
// =============================================================================
//
// PURPOSE
// -------
// Phase 4H diagnostic. NOT a generator. NOT a materializer. NOT a second
// doctrine engine. This file builds two pure, JSON-safe audit objects from
// data the program builder has already computed, so the runtime can answer
// honestly:
//
//   1. For every doctrine category, did rules read → become relevant →
//      become eligible → get selected → materialize a real program field?
//   2. For every onboarding/profile input the user actually provided, did
//      it reach a decision surface, and what did it influence?
//
// WHY DIAGNOSTIC ONLY
// -------------------
// Phase 4H's prompt is explicit: "Do not create a second engine. Do not
// rewrite the generator. Do not let explanation text change while the
// actual program stays unchanged." Adding new mutators for prescription /
// progression / mobility would change athlete dosage and safety surfaces
// in ways that need their own dedicated phase. So this phase makes the
// honest truth visible without mutating any program field. If a category
// is currently scoring-only or audit-only, the matrix says exactly that —
// it does NOT pretend it is "applied".
//
// SOURCES OF TRUTH USED (read-only)
// ---------------------------------
// • runtimeContract.doctrineCoverage  → per-category rulesRead counts
// • runtimeContract.{progression,method,prescription,skill,exercise}Doctrine
//   → already-computed per-skill / global summaries
// • doctrineCausalChallenge.diffSummary → rulesMatched / rulesChanged
// • doctrineCausalChallenge.materialProgramChanged
// • doctrineCausalChallenge.unchangedVerdict
// • inputs (athlete profile) → onboarding consumption flags
//
// NON-NEGOTIABLES OBEYED
// ----------------------
//   ✓ no new dependencies
//   ✓ no new generation logic
//   ✓ no UI changes
//   ✓ no schema changes
//   ✓ no fake "applied" labels
//   ✓ JSON-serializable (survives DB save / API roundtrip)
//   ✓ pure function (no side effects, no I/O)
// =============================================================================

import type { DoctrineRuntimeContract } from '@/lib/doctrine-runtime-contract'

// -----------------------------------------------------------------------------
// Status taxonomy — matches Phase 1 of the Phase 4H prompt exactly.
// -----------------------------------------------------------------------------
export type DoctrineCategoryStatus =
  | 'CONNECTED_AND_MATERIAL'     // rules reach a decision surface AND can change a real program field
  | 'READ_BUT_SCORING_ONLY'      // rules influence candidate scoring/ordering but do not mutate fields
  | 'READ_BUT_AUDIT_ONLY'        // rules are loaded into an audit object but no decision surface consumes them
  | 'NOT_READ'                   // rules are not loaded into the runtime path at all
  | 'BLOCKED_WITH_REASON'        // rules were eligible but a named safety/equipment/progression gate blocked them
  | 'NOT_RELEVANT_TO_CURRENT_PROFILE' // category does not apply to this athlete's profile
  | 'NOT_IN_SCHEMA'              // category does not exist as a doctrine rule type in this codebase
  // [PHASE 4I] rules ARE read (typically inside another rule_type) but no
  // category-specific materializer consumes them yet. Distinct from
  // NOT_IN_SCHEMA (no rules exist) and NOT_READ (rules exist but never reach
  // the runtime path). This is the honest classification for mobility/warmup/
  // prehab in Phase 4I, where batch 09 ships rules but no consumer is wired.
  | 'MATERIALIZER_NOT_CONNECTED'

// -----------------------------------------------------------------------------
// Onboarding truth status — matches Phase 2 of the Phase 4H prompt.
// -----------------------------------------------------------------------------
export type OnboardingTruthStatus =
  | 'materialized'        // input reached a decision surface and changed a field
  | 'consumed_no_change'  // input reached a decision surface but did not change anything (legitimately)
  | 'blocked_with_reason' // input would have changed something but was blocked by a named gate
  | 'not_relevant'        // input does not apply to current generation context
  | 'missing_connection'  // input is collected from the user but not wired to any decision surface
  | 'not_observed_in_inputs' // input slot is not present in the inputs the builder received

export interface DoctrineCategoryRow {
  /** Stable category key matching Phase 3 of the Phase 4H prompt. */
  category:
    | 'exercise_selection'
    | 'carryover_support'
    | 'method_selection'
    /** [PHASE 4J] honest split — see registry comment. */
    | 'method_selection_row_level'
    | 'prescription'
    | 'progression'
    | 'contraindication_safety'
    | 'mobility_warmup_prehab'
    | 'cooldown_flexibility'
    | 'weekly_architecture'
  status: DoctrineCategoryStatus
  /** Total rules of this category loaded into the runtime path. */
  rulesRead: number
  /** Rules that potentially apply to this athlete (best-effort heuristic). */
  rulesRelevant: number
  /** Rules that survived eligibility checks during scoring/decision. */
  rulesEligible: number
  /** Rules that were chosen as inputs to a decision. */
  rulesSelected: number
  /** Rules that mutated a real program field. */
  rulesMaterialized: number
  /** Rules blocked by safety/equipment/progression/session-budget. */
  rulesBlocked: number
  /** Concrete program fields this category is permitted to write. */
  allowedProgramFields: string[]
  /**
   * Program fields this category actually changed in this generation run, if
   * any. Empty array does not automatically mean "broken" — it must be paired
   * with `noChangeReason` for honesty.
   */
  changedProgramFields: string[]
  /** Where the user can see proof of this category's effect (UI surfaces). */
  visibleSurfaces: string[]
  /** Specific reason if rulesMaterialized = 0. */
  noChangeReason: string | null
  /** Plain-English honest summary for diagnostics. */
  notes: string
}

export interface DoctrineMaterializationMatrix {
  version: 'phase4h-doctrine-materialization-matrix-v1'
  generatedAt: string
  /** Whether the runtime contract was actually built and available. */
  doctrineRuntimeAvailable: boolean
  /** Whether `materialProgramChanged` was true in the Phase 4E A/B audit. */
  materialProgramChanged: boolean
  /** Categories indexed by stable key for O(1) lookup. */
  categories: DoctrineCategoryRow[]
  /** Aggregate counts so UI can render compact summaries without recomputing. */
  totals: {
    categoriesConnectedAndMaterial: number
    categoriesReadButScoringOnly: number
    categoriesReadButAuditOnly: number
    categoriesNotRead: number
    categoriesBlockedWithReason: number
    categoriesNotRelevant: number
    categoriesNotInSchema: number
    /** [PHASE 4I] count of categories with status MATERIALIZER_NOT_CONNECTED. */
    categoriesMaterializerNotConnected: number
    totalRulesRead: number
    totalRulesMaterialized: number
  }
  /**
   * Honest one-line verdict. Must NOT say "fully applied" / "aligned" /
   * "intelligent" unless every relevant category is CONNECTED_AND_MATERIAL.
   */
  verdict:
    | 'DOCTRINE_FULLY_MATERIALIZED_FOR_RELEVANT_CATEGORIES'
    | 'DOCTRINE_PARTIALLY_MATERIALIZED'
    | 'DOCTRINE_READ_BUT_NOT_MATERIALIZED'
    | 'DOCTRINE_NOT_AVAILABLE'
}

// -----------------------------------------------------------------------------
// FullOnboardingTruthMaterializationMap shape
// -----------------------------------------------------------------------------
export interface OnboardingTruthRow {
  inputKey: string
  /** Group label so UI can section the table. */
  group:
    | 'goals'
    | 'schedule'
    | 'equipment'
    | 'strength_ability'
    | 'recovery_joint'
    | 'training_style'
    | 'flexibility_mobility'
  /** Was the value present and non-empty in the inputs object? */
  consumed: boolean
  status: OnboardingTruthStatus
  /** Decision surfaces this input reached. */
  decisionSurfacesAffected: string[]
  /** Program fields this input changed in this generation run. */
  changedFields: string[]
  noChangeReason: string | null
  /** Where the user can see this input's effect on the Program page. */
  visibleProofLocation: string | null
  /** Plain-English honest note. */
  notes: string
}

export interface FullOnboardingTruthMaterializationMap {
  version: 'phase4h-onboarding-truth-materialization-map-v1'
  generatedAt: string
  rows: OnboardingTruthRow[]
  totals: {
    inputsConsumed: number
    inputsMaterialized: number
    inputsConsumedNoChange: number
    inputsBlocked: number
    inputsNotRelevant: number
    inputsMissingConnection: number
    inputsNotObserved: number
  }
  /** Honest verdict — never claims "fully aligned" without proof. */
  verdict:
    | 'ONBOARDING_TRUTH_FULLY_CONSUMED'
    | 'ONBOARDING_TRUTH_PARTIALLY_CONSUMED'
    | 'ONBOARDING_TRUTH_MOSTLY_NOT_OBSERVED'
}

// =============================================================================
// MATRIX BUILDER
// =============================================================================

/**
 * Builder inputs we read from. All fields are optional and defensively
 * accessed — this builder never throws because the audit object must always
 * be available, even if upstream returns partial data.
 */
export interface BuildMatrixArgs {
  runtimeContract: DoctrineRuntimeContract | null | undefined
  /** The Phase 4E A/B causal challenge stamp from the same generation run. */
  causalChallenge?: {
    materialProgramChanged?: boolean
    sessionsTopCandidateChanged?: number
    diffSummary?: {
      changedExerciseCount?: number
      selectionRulesMatchedTotal?: number
      carryoverRulesMatchedTotal?: number
      contraindicationRulesMatchedTotal?: number
    }
    unchangedVerdict?: string
  } | null
  /**
   * Athlete profile inputs as the builder received them. Defensively typed —
   * we only read fields we recognize, missing ones default to "not_observed".
   */
  athleteInputs?: Record<string, unknown> | null
  /**
   * [PHASE 4I] Optional cooldown/flexibility materialization output from
   * `buildDoctrineFlexibilityCooldownMaterialization`. When present, the
   * matrix's `cooldown_flexibility` row reflects real materialized blocks.
   * When absent, the row is reported honestly as MATERIALIZER_NOT_CONNECTED.
   */
  cooldownFlexibilityMaterialization?: {
    verdict?: string
    totals?: {
      eligibleGoalsCount?: number
      sessionsConsidered?: number
      sessionsMaterialized?: number
      blocksEmitted?: number
    }
    recognizedGoals?: string[]
    unmatchedGoals?: { goal: string; reason: string }[]
  } | null
}

export function buildDoctrineMaterializationMatrix(
  args: BuildMatrixArgs
): DoctrineMaterializationMatrix {
  const { runtimeContract, causalChallenge } = args
  const generatedAt = new Date().toISOString()
  const doctrineRuntimeAvailable = !!runtimeContract && runtimeContract.available === true

  const cov = runtimeContract?.doctrineCoverage
  const causal = causalChallenge ?? null
  const materialProgramChanged = !!causal?.materialProgramChanged

  const selectionRulesMatched = causal?.diffSummary?.selectionRulesMatchedTotal ?? 0
  const carryoverRulesMatched = causal?.diffSummary?.carryoverRulesMatchedTotal ?? 0
  const contraRulesMatched = causal?.diffSummary?.contraindicationRulesMatchedTotal ?? 0
  const sessionsChanged = causal?.sessionsTopCandidateChanged ?? 0

  // Common helpers ------------------------------------------------------------
  const safeCount = (n: number | null | undefined): number =>
    typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : 0

  const rows: DoctrineCategoryRow[] = []

  // ---------------------------------------------------------------------------
  // 1. exercise_selection
  // PATH: prefetchDoctrineRules cache → applyDoctrineScoringSyncAndSort
  //       → can flip top winner → session.exercises[]
  // ---------------------------------------------------------------------------
  rows.push({
    category: 'exercise_selection',
    status: doctrineRuntimeAvailable
      ? sessionsChanged > 0
        ? 'CONNECTED_AND_MATERIAL'
        : selectionRulesMatched > 0
          ? 'READ_BUT_SCORING_ONLY'
          : 'CONNECTED_AND_MATERIAL'
      : 'NOT_READ',
    rulesRead: safeCount(cov?.exerciseSelectionRuleCount),
    rulesRelevant: selectionRulesMatched,
    rulesEligible: selectionRulesMatched,
    rulesSelected: selectionRulesMatched,
    rulesMaterialized: sessionsChanged > 0 ? selectionRulesMatched : 0,
    rulesBlocked: 0,
    allowedProgramFields: [
      'session.exercises[]',
      'exercise.id',
      'exercise.name',
      'exercise.role',
      'exercise.skillTags',
      'exercise.selectionReason',
    ],
    changedProgramFields: sessionsChanged > 0 ? ['session.exercises[]'] : [],
    visibleSurfaces: ['Program page exercise list', 'AdaptiveSessionCard exercise rows'],
    noChangeReason:
      sessionsChanged > 0
        ? null
        : selectionRulesMatched > 0
          ? 'doctrine influenced candidate ranking but base selection already matched the doctrine-preferred exercise — no winner flip needed'
          : causal?.unchangedVerdict === 'doctrine_cache_empty'
            ? 'doctrine rule cache was empty for this profile / skill set'
            : 'no doctrine selection rule matched any candidate in any session',
    notes:
      'Phase 4G fix wired full selectedSkills + secondaryGoal + primaryGoal into the prefetch cache, ' +
      'so candidates are scored against rules for every skill the athlete picked, not just primary.',
  })

  // ---------------------------------------------------------------------------
  // 2. carryover_support
  // PATH: prefetchDoctrineRules cache → carryover bonus in scorer
  // (`runtimeContract.skillDoctrine` is computed but currently has no consumer.)
  // ---------------------------------------------------------------------------
  rows.push({
    category: 'carryover_support',
    status: doctrineRuntimeAvailable
      ? carryoverRulesMatched > 0
        ? 'CONNECTED_AND_MATERIAL'
        : 'READ_BUT_SCORING_ONLY'
      : 'NOT_READ',
    rulesRead: safeCount(cov?.carryoverRuleCount),
    rulesRelevant: carryoverRulesMatched,
    rulesEligible: carryoverRulesMatched,
    rulesSelected: carryoverRulesMatched,
    rulesMaterialized: carryoverRulesMatched > 0 && sessionsChanged > 0 ? carryoverRulesMatched : 0,
    rulesBlocked: 0,
    allowedProgramFields: [
      'support slot exercises',
      'exercise.role = support_carryover',
      'skillSupportTags',
    ],
    changedProgramFields:
      carryoverRulesMatched > 0 && sessionsChanged > 0 ? ['exercise.role', 'skillSupportTags'] : [],
    visibleSurfaces: ['Program page support exercises', 'session card support rows'],
    noChangeReason:
      carryoverRulesMatched > 0 && sessionsChanged === 0
        ? 'carryover rules influenced candidate scores but did not change top winner — base support choices already aligned'
        : carryoverRulesMatched === 0
          ? 'no carryover rule matched any candidate in any session'
          : null,
    notes:
      'runtimeContract.skillDoctrine.carryoverMap is also computed and stamped on the program but no ' +
      'downstream consumer currently reads it for support-slot allocation — the active carryover path is ' +
      'the per-candidate scoring bonus in the prefetch cache.',
  })

  // ---------------------------------------------------------------------------
  // 3. method_selection  (GROUPED — Phase 4J honest narrative)
  // PATH: runtimeContract.methodDoctrine + applySessionStylePreferences
  //       → session.styleMetadata.styledGroups (superset / circuit /
  //         density_block) + exercise.setExecutionMethod (cluster only)
  // OWNER: lib/training-methods.ts::applySessionStylePreferences
  // AUDITOR (post-build, not materializer): lib/program/method-decision-engine.ts
  // ---------------------------------------------------------------------------
  const methodCount = safeCount(cov?.methodRuleCount)
  const methodPreferredCount = safeCount(runtimeContract?.methodDoctrine?.preferredMethods?.length)
  const methodBlockedCount = safeCount(runtimeContract?.methodDoctrine?.blockedMethods?.length)
  rows.push({
    category: 'method_selection',
    status: doctrineRuntimeAvailable
      ? methodPreferredCount > 0 || methodBlockedCount > 0
        ? 'CONNECTED_AND_MATERIAL'
        : methodCount > 0
          ? 'READ_BUT_AUDIT_ONLY'
          : 'NOT_RELEVANT_TO_CURRENT_PROFILE'
      : 'NOT_READ',
    rulesRead: methodCount,
    rulesRelevant: methodPreferredCount + methodBlockedCount,
    rulesEligible: methodPreferredCount + methodBlockedCount,
    rulesSelected: methodPreferredCount,
    rulesMaterialized: methodPreferredCount,
    rulesBlocked: methodBlockedCount,
    allowedProgramFields: [
      'session.styleMetadata.styledGroups[]',
      'exercise.method',
      'exercise.methodLabel',
      'exercise.setExecutionMethod (cluster only)',
      'exercise.blockId',
      'methodMaterializationSummary',
    ],
    changedProgramFields:
      methodPreferredCount > 0
        ? ['session.styleMetadata.styledGroups', 'exercise.method', 'methodMaterializationSummary']
        : [],
    visibleSurfaces: ['session card method label', 'styled groups display', 'method materialization summary chip'],
    noChangeReason:
      methodPreferredCount === 0 && methodCount > 0
        ? 'method rules loaded but the runtime context (profile / experience / goal) did not surface any preferred or blocked methods'
        : null,
    notes:
      'Phase 4J corrected scope: applySessionStylePreferences in lib/training-methods.ts is the GROUPED ' +
      'materializer (superset / circuit / density_block / cluster). method-decision-engine is a POST-BUILD ' +
      'AUDITOR that stamps session.methodDecision; it does NOT mutate exercises. Row-level methods ' +
      '(top_set / drop_set / rest_pause / endurance_density) have no materializer — see the next row.',
  })

  // ---------------------------------------------------------------------------
  // 3b. method_selection_row_level  (Phase 4J — honest gap row)
  // No materializer in the codebase writes top_set_backoff / drop_set /
  // rest_pause / endurance_density. The auditor reasons about them and
  // surfaces zero counts in actualMaterialization.rowExecutionCounts.
  // ---------------------------------------------------------------------------
  rows.push({
    category: 'method_selection_row_level',
    status: 'MATERIALIZER_NOT_CONNECTED',
    rulesRead: 0,
    rulesRelevant: 0,
    rulesEligible: 0,
    rulesSelected: 0,
    rulesMaterialized: 0,
    rulesBlocked: 0,
    allowedProgramFields: [
      'exercise.setExecutionMethod (top_set / drop_set / rest_pause)',
      'exercise.topSetPrescription',
      'exercise.backoffPrescription',
      'exercise.dropSetPrescription',
    ],
    changedProgramFields: [],
    visibleSurfaces: [],
    noChangeReason:
      'no row-level materializer exists for top_set_backoff / drop_set / rest_pause / endurance_density. ' +
      'method-decision-engine reasons about these and surfaces zero counts in ' +
      'session.methodDecision.actualMaterialization.rowExecutionCounts. Drop-set logic exists in ' +
      'training-methods.ts (CALISTHENICS_DROP_SETS, evaluateDropSet) but is not called by any session builder.',
    notes:
      'Phase 4J honest split. lib/program/weekly-method-representation.ts surfaces this per-method to the ' +
      'Program page. Building safe row-level dosage mutators is deferred for the same safety reason that ' +
      'blocked the prescription / progression mutators in Phase 4I.',
  })

  // ---------------------------------------------------------------------------
  // 4. prescription
  // PATH: runtimeContract.prescriptionDoctrine → method engine fatigue/time-efficiency
  //       notes ONLY. Does NOT mutate sets / reps / hold / rest / RPE numbers.
  //
  // HONESTY: this is the biggest legitimate scoring-only-not-material gap in
  // Phase 4H. Building a real prescription mutator that overrides the existing
  // dosage/prescription resolver requires a dedicated phase with its own
  // safety bounds. Until that ships, we MUST report this honestly.
  // ---------------------------------------------------------------------------
  const px = runtimeContract?.prescriptionDoctrine
  const pxRationaleCount = safeCount(px?.rationale?.length)
  const pxHasBias = !!(px?.intensityBias || px?.volumeBias || px?.densityBias || px?.holdBias)
  rows.push({
    category: 'prescription',
    status: doctrineRuntimeAvailable
      ? pxHasBias
        ? 'READ_BUT_SCORING_ONLY'
        : pxRationaleCount > 0
          ? 'READ_BUT_AUDIT_ONLY'
          : safeCount(cov?.prescriptionRuleCount) > 0
            ? 'READ_BUT_AUDIT_ONLY'
            : 'NOT_RELEVANT_TO_CURRENT_PROFILE'
      : 'NOT_READ',
    rulesRead: safeCount(cov?.prescriptionRuleCount),
    rulesRelevant: pxRationaleCount,
    rulesEligible: pxRationaleCount,
    rulesSelected: pxRationaleCount,
    // CRITICAL: prescription doctrine does not currently mutate sets/reps numbers.
    rulesMaterialized: 0,
    rulesBlocked: 0,
    allowedProgramFields: [
      'exercise.sets',
      'exercise.reps',
      'exercise.holdSeconds',
      'exercise.restSeconds',
      'exercise.rpe',
      'exercise.tempo',
    ],
    changedProgramFields: [],
    visibleSurfaces: ['method engine fatigue/time notes (only)', 'method-materialization-summary rationale'],
    noChangeReason:
      'prescription rules are summarized into bias flags (intensityBias / volumeBias / densityBias / holdBias) ' +
      'and rationale strings consumed by method-decision-engine for fatigue and time-efficiency notes, but ' +
      'the existing per-exercise sets/reps/hold/rest/RPE resolver does not currently consume those biases as ' +
      'numeric mutators. Connecting prescription doctrine to actual dosage numbers requires a dedicated ' +
      'safety phase and is intentionally not done in Phase 4H.',
    notes:
      'This is the largest "evaluated but not material" gap in the current architecture. Phase 4H surfaces ' +
      'it honestly rather than hiding it behind UI labels.',
  })

  // ---------------------------------------------------------------------------
  // 5. progression
  // PATH: runtimeContract.progressionDoctrine → bias flags only
  //       (globalConservativeBias / globalAssistedBias / perSkill).
  //       Does NOT mutate exercise.progressionLevel directly today.
  // ---------------------------------------------------------------------------
  const prog = runtimeContract?.progressionDoctrine
  const perSkillCount = safeCount(prog ? Object.keys(prog.perSkill || {}).length : 0)
  rows.push({
    category: 'progression',
    status: doctrineRuntimeAvailable
      ? perSkillCount > 0 || prog?.globalConservativeBias || prog?.globalAssistedBias
        ? 'READ_BUT_SCORING_ONLY'
        : safeCount(cov?.progressionRuleCount) > 0
          ? 'READ_BUT_AUDIT_ONLY'
          : 'NOT_RELEVANT_TO_CURRENT_PROFILE'
      : 'NOT_READ',
    rulesRead: safeCount(cov?.progressionRuleCount),
    rulesRelevant: perSkillCount,
    rulesEligible: perSkillCount,
    rulesSelected: perSkillCount,
    rulesMaterialized: 0,
    rulesBlocked: 0,
    allowedProgramFields: [
      'exercise.progressionLevel',
      'progressionPath',
      'currentWorkingLevel',
      'nextProgression',
    ],
    changedProgramFields: [],
    visibleSurfaces: ['method engine bias notes (only)'],
    noChangeReason:
      'progression rules are summarized into per-skill bias flags but the existing progression-slot picker ' +
      'does not currently consume those flags as numeric or path mutators.',
    notes:
      'Same architectural shape as prescription: bias-flags exist, mutators do not. Wiring them requires a ' +
      'dedicated phase that respects current working level vs historical max.',
  })

  // ---------------------------------------------------------------------------
  // 6. contraindication_safety
  // PATH: prefetchDoctrineRules cache → hard filter in scorer
  // ---------------------------------------------------------------------------
  rows.push({
    category: 'contraindication_safety',
    status: doctrineRuntimeAvailable
      ? 'CONNECTED_AND_MATERIAL'
      : 'NOT_READ',
    // Note: contraindication rules are loaded by prefetchDoctrineRules separately
    // from the runtime contract; coverage doesn't surface their count here.
    rulesRead: contraRulesMatched, // best available signal
    rulesRelevant: contraRulesMatched,
    rulesEligible: contraRulesMatched,
    rulesSelected: contraRulesMatched,
    rulesMaterialized: contraRulesMatched, // hard filter materializes by removing candidates
    rulesBlocked: 0,
    allowedProgramFields: [
      'removedCandidateIds',
      'modifiedExerciseIds',
      'substitutionReason',
    ],
    changedProgramFields: contraRulesMatched > 0 ? ['removedCandidateIds'] : [],
    visibleSurfaces: ['exercise list (omissions)', 'substitution reason chips'],
    noChangeReason:
      contraRulesMatched === 0
        ? 'no contraindication rule matched any candidate — either no joint cautions on profile or no risky exercises in candidate pool'
        : null,
    notes: 'Hard filter: when a contraindication matches, the candidate is removed pre-scoring.',
  })

  // ---------------------------------------------------------------------------
  // 7. mobility_warmup_prehab  (Phase 4I — honest reclassification)
  //
  // Phase 4H labelled this NOT_IN_SCHEMA. That was wrong. Batch 09 ships
  // mobility / warmup / prehab / skill-rampup doctrine inside the existing
  // 6 rule_types (no separate "mobility" rule_type by design). What is
  // missing is the materializer that selects compact 1-3 item warmup/prehab
  // blocks. Phase 4I deliberately does NOT build this — the safe scope for
  // this phase is the cooldown/flexibility materializer below.
  // ---------------------------------------------------------------------------
  rows.push({
    category: 'mobility_warmup_prehab',
    status: 'MATERIALIZER_NOT_CONNECTED',
    rulesRead: 0,
    rulesRelevant: 0,
    rulesEligible: 0,
    rulesSelected: 0,
    rulesMaterialized: 0,
    rulesBlocked: 0,
    allowedProgramFields: [
      'session.warmup',
      'session.prehab',
      'session.prepBlocks',
      'exercise.prepNotes',
      'session.jointPrepFocus',
      'session.skillPrepFocus',
    ],
    changedProgramFields: [],
    visibleSurfaces: [],
    noChangeReason:
      'batch 09 mobility/warmup/prehab/skill-rampup doctrine is loaded via the existing 6 rule_types, ' +
      'but no consumer turns those rules into session.warmup / session.prehab blocks. The flexibility ' +
      'cooldown materializer (Phase 4I) handles direct flexibility goals; warmup/prehab is Phase 4J.',
    notes:
      'Phase 4I correction: previously labelled NOT_IN_SCHEMA, which was inaccurate. The honest ' +
      'classification is MATERIALIZER_NOT_CONNECTED — rules exist, consumer does not.',
  })

  // ---------------------------------------------------------------------------
  // 8. cooldown_flexibility  (Phase 4I — first real Batch 09 consumer)
  //
  // When the builder passes `cooldownFlexibilityMaterialization` from the new
  // materializer, this row reflects that materialization. When the materializer
  // returns NOT_RELEVANT_TO_CURRENT_PROFILE (no flexibility goals selected),
  // this row reflects that honestly. When the args field is absent, the row
  // reports MATERIALIZER_NOT_CONNECTED rather than pretending success.
  // ---------------------------------------------------------------------------
  const flexMat = args.cooldownFlexibilityMaterialization
  if (flexMat) {
    const blocksEmitted = flexMat.totals?.blocksEmitted ?? 0
    const sessionsMaterialized = flexMat.totals?.sessionsMaterialized ?? 0
    const eligibleGoalsCount = flexMat.totals?.eligibleGoalsCount ?? 0
    const recognizedGoals = Array.isArray(flexMat.recognizedGoals) ? flexMat.recognizedGoals : []
    const unmatchedGoals = Array.isArray(flexMat.unmatchedGoals) ? flexMat.unmatchedGoals : []

    let cfStatus: DoctrineCategoryStatus
    let cfNoChangeReason: string | null
    if (flexMat.verdict === 'NOT_RELEVANT_TO_CURRENT_PROFILE') {
      cfStatus = 'NOT_RELEVANT_TO_CURRENT_PROFILE'
      cfNoChangeReason = 'athlete did not select any flexibility goals during onboarding'
    } else if (flexMat.verdict === 'NO_GOALS_RECOGNIZED') {
      cfStatus = 'BLOCKED_WITH_REASON'
      cfNoChangeReason =
        'flexibility goals were selected but none survived the FLEXIBILITY_GOAL_SUPPORT_MATRIX classification'
    } else if (flexMat.verdict === 'BLOCKED_NO_ELIGIBLE_SESSIONS') {
      cfStatus = 'BLOCKED_WITH_REASON'
      cfNoChangeReason = 'eligible goals exist but the program had no sessions to attach blocks to'
    } else if (blocksEmitted > 0) {
      cfStatus = 'CONNECTED_AND_MATERIAL'
      cfNoChangeReason = null
    } else {
      cfStatus = 'BLOCKED_WITH_REASON'
      cfNoChangeReason = 'materializer ran but emitted zero blocks (no eligible session/goal pairing)'
    }

    rows.push({
      category: 'cooldown_flexibility',
      status: cfStatus,
      rulesRead: eligibleGoalsCount,
      rulesRelevant: eligibleGoalsCount,
      rulesEligible: eligibleGoalsCount,
      rulesSelected: blocksEmitted,
      rulesMaterialized: blocksEmitted,
      rulesBlocked: unmatchedGoals.length,
      allowedProgramFields: [
        'program.cooldownFlexibilityMaterialization',
        'program.cooldownFlexibilityMaterialization.materializedSessions[]',
        'program.cooldownFlexibilityMaterialization.materializedSessions[].blocks[]',
      ],
      changedProgramFields:
        blocksEmitted > 0
          ? [
              'program.cooldownFlexibilityMaterialization',
              'program.cooldownFlexibilityMaterialization.materializedSessions[].blocks[]',
            ]
          : [],
      visibleSurfaces:
        blocksEmitted > 0
          ? ['Program page cooldown/flexibility line', 'session diagnostic chip']
          : [],
      noChangeReason: cfNoChangeReason,
      notes:
        `Phase 4I materializer: ${eligibleGoalsCount} eligible goal(s) ` +
        `(${recognizedGoals.join(', ') || 'none'}), ${blocksEmitted} block(s) across ${sessionsMaterialized} session(s). ` +
        `Output is additive on program.cooldownFlexibilityMaterialization — does not mutate session.cooldown directly to keep live workout handoff safe.`,
    })
  } else {
    // Builder did not pass the materializer output. Report honestly.
    rows.push({
      category: 'cooldown_flexibility',
      status: 'MATERIALIZER_NOT_CONNECTED',
      rulesRead: 0,
      rulesRelevant: 0,
      rulesEligible: 0,
      rulesSelected: 0,
      rulesMaterialized: 0,
      rulesBlocked: 0,
      allowedProgramFields: [
        'program.cooldownFlexibilityMaterialization',
      ],
      changedProgramFields: [],
      visibleSurfaces: [],
      noChangeReason:
        'flexibility cooldown materialization was not provided to the matrix builder ' +
        '(buildDoctrineMaterializationMatrix called without cooldownFlexibilityMaterialization arg)',
      notes:
        'Phase 4I materializer exists at lib/program/doctrine-flexibility-cooldown-materializer.ts but its ' +
        'output was not passed to the matrix in this run.',
    })
  }

  // ---------------------------------------------------------------------------
  // 9. weekly_architecture
  //    Driven primarily by athlete inputs (requestedTrainingDays, sessionStyle,
  //    selectedSkills) and by session-architecture-truth, not by a single
  //    doctrine rule_type. Counts as CONNECTED_AND_MATERIAL because the inputs
  //    do mutate session count, day focus, and session role.
  // ---------------------------------------------------------------------------
  rows.push({
    category: 'weekly_architecture',
    status: 'CONNECTED_AND_MATERIAL',
    rulesRead: 0,
    rulesRelevant: 0,
    rulesEligible: 0,
    rulesSelected: 0,
    rulesMaterialized: 0,
    rulesBlocked: 0,
    allowedProgramFields: [
      'weeks[].days[].dayType',
      'weeks[].days[].dayFocus',
      'sessionRole',
      'session count',
    ],
    changedProgramFields: ['weeks[].days[].dayType', 'weeks[].days[].dayFocus'],
    visibleSurfaces: ['Program page weekly grid', 'session card day-focus label'],
    noChangeReason: null,
    notes:
      'Weekly architecture is driven by athlete profile + session-architecture-truth, not a doctrine rule_type.',
  })

  // Aggregates ---------------------------------------------------------------
  const totals = {
    categoriesConnectedAndMaterial: rows.filter(r => r.status === 'CONNECTED_AND_MATERIAL').length,
    categoriesReadButScoringOnly: rows.filter(r => r.status === 'READ_BUT_SCORING_ONLY').length,
    categoriesReadButAuditOnly: rows.filter(r => r.status === 'READ_BUT_AUDIT_ONLY').length,
    categoriesNotRead: rows.filter(r => r.status === 'NOT_READ').length,
    categoriesBlockedWithReason: rows.filter(r => r.status === 'BLOCKED_WITH_REASON').length,
    categoriesNotRelevant: rows.filter(r => r.status === 'NOT_RELEVANT_TO_CURRENT_PROFILE').length,
    categoriesNotInSchema: rows.filter(r => r.status === 'NOT_IN_SCHEMA').length,
    // [PHASE 4I] new honest status counter
    categoriesMaterializerNotConnected: rows.filter(r => r.status === 'MATERIALIZER_NOT_CONNECTED').length,
    totalRulesRead: rows.reduce((sum, r) => sum + r.rulesRead, 0),
    totalRulesMaterialized: rows.reduce((sum, r) => sum + r.rulesMaterialized, 0),
  }

  // Verdict ------------------------------------------------------------------
  // [PHASE 4I] verdict logic must treat MATERIALIZER_NOT_CONNECTED as a
  // partial-materialization signal too. Any non-zero count of unconnected
  // materializers means we cannot honestly call the system fully materialized.
  let verdict: DoctrineMaterializationMatrix['verdict']
  if (!doctrineRuntimeAvailable) {
    verdict = 'DOCTRINE_NOT_AVAILABLE'
  } else if (
    totals.categoriesReadButScoringOnly === 0 &&
    totals.categoriesReadButAuditOnly === 0 &&
    totals.categoriesMaterializerNotConnected === 0
  ) {
    verdict = 'DOCTRINE_FULLY_MATERIALIZED_FOR_RELEVANT_CATEGORIES'
  } else if (totals.totalRulesMaterialized > 0 || totals.categoriesConnectedAndMaterial > 0) {
    verdict = 'DOCTRINE_PARTIALLY_MATERIALIZED'
  } else {
    verdict = 'DOCTRINE_READ_BUT_NOT_MATERIALIZED'
  }

  return {
    version: 'phase4h-doctrine-materialization-matrix-v1',
    generatedAt,
    doctrineRuntimeAvailable,
    materialProgramChanged,
    categories: rows,
    totals,
    verdict,
  }
}

// =============================================================================
// FULL ONBOARDING TRUTH MAP BUILDER
// =============================================================================

/** Heuristic: did the inputs object contain a usable value for this key? */
function isPresent(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  return false
}

export function buildFullOnboardingTruthMaterializationMap(
  args: BuildMatrixArgs
): FullOnboardingTruthMaterializationMap {
  const inputs = (args.athleteInputs ?? {}) as Record<string, unknown>
  const causal = args.causalChallenge
  const sessionsChanged = causal?.sessionsTopCandidateChanged ?? 0
  const generatedAt = new Date().toISOString()

  const rows: OnboardingTruthRow[] = []

  // Helper: build one row defensively.
  const row = (
    inputKey: string,
    group: OnboardingTruthRow['group'],
    decisionSurfacesAffected: string[],
    visibleProofLocation: string | null,
    notes: string,
    materializedWhen?: () => boolean,
    consumedNoChangeReason?: string | null
  ): OnboardingTruthRow => {
    const present = isPresent(inputs[inputKey])
    let status: OnboardingTruthStatus
    let changedFields: string[] = []
    let noChangeReason: string | null = null
    if (!present) {
      status = 'not_observed_in_inputs'
      noChangeReason = 'value not present on builder inputs object'
    } else if (decisionSurfacesAffected.length === 0) {
      status = 'missing_connection'
      noChangeReason = 'input is collected but no decision surface currently consumes it'
    } else if (materializedWhen && materializedWhen()) {
      status = 'materialized'
      changedFields = decisionSurfacesAffected
    } else {
      status = 'consumed_no_change'
      noChangeReason =
        consumedNoChangeReason ??
        'input reached its decision surface but did not produce a visible field change in this run'
    }
    return {
      inputKey,
      group,
      consumed: present,
      status,
      decisionSurfacesAffected,
      changedFields,
      noChangeReason,
      visibleProofLocation,
      notes,
    }
  }

  // Goals -------------------------------------------------------------------
  rows.push(
    row(
      'primaryGoal',
      'goals',
      ['exercise selection scorer', 'method engine', 'runtime contract per-skill'],
      'Program page primary skill emphasis',
      'Always consumed — drives prefetch cache and runtime contract.',
      () => sessionsChanged > 0
    )
  )
  rows.push(
    row(
      'secondaryGoal',
      'goals',
      ['exercise selection scorer (Phase 4G)', 'runtime contract'],
      'Program page secondary skill emphasis',
      'Phase 4G widened the prefetch cache to include secondary goal rules.',
      () => sessionsChanged > 0
    )
  )
  rows.push(
    row(
      'selectedSkills',
      'goals',
      ['exercise selection scorer (Phase 4G)', 'runtime contract per-skill', 'weekly skill expression allocator'],
      'Program page weekly skill exposure',
      'Phase 4G widened the prefetch cache to include all selected skills.',
      () => sessionsChanged > 0
    )
  )
  rows.push(
    row(
      'currentWorkingProgressions',
      'goals',
      ['runtime contract progressionDoctrine'],
      null,
      'Consumed by progressionDoctrine but not yet wired to numeric mutators (see matrix progression row).'
    )
  )

  // Schedule ----------------------------------------------------------------
  rows.push(
    row(
      'requestedTrainingDays',
      'schedule',
      ['weekly architecture', 'session count'],
      'Program page weekly grid',
      'Drives session count.',
      () => true
    )
  )
  rows.push(
    row(
      'sessionDurationTarget',
      'schedule',
      ['session composition', 'method engine time-budget gate'],
      'session card duration label',
      'Bounds method choices and session content.',
      () => true
    )
  )

  // Equipment ---------------------------------------------------------------
  rows.push(
    row(
      'equipmentAvailable',
      'equipment',
      ['exercise candidate filter', 'runtime contract'],
      'exercise list (excluded equipment-blocked options)',
      'Hard filter on candidate pool.',
      () => true
    )
  )

  // Strength / ability ------------------------------------------------------
  rows.push(
    row(
      'experienceLevel',
      'strength_ability',
      ['runtime contract', 'method engine', 'progressionDoctrine'],
      'method labels and progression labels',
      'Used by both method engine and progression bias.',
      () => true
    )
  )
  rows.push(
    row(
      'trainingMethodPreferences',
      'training_style',
      ['method engine', 'methodDoctrine'],
      'session card method labels',
      'Consumed by method-decision-engine.',
      () => true
    )
  )
  rows.push(
    row(
      'sessionStyle',
      'training_style',
      ['session composition', 'runtime contract'],
      'session card style chip',
      'Drives dominant weekly spine.',
      () => true
    )
  )

  // Recovery / joint --------------------------------------------------------
  rows.push(
    row(
      'jointCautions',
      'recovery_joint',
      ['contraindication filter', 'progressionDoctrine'],
      'exercise omissions and substitution chips',
      'Hard filter via contraindications + biasing via progression doctrine.',
      () => (causal?.diffSummary?.contraindicationRulesMatchedTotal ?? 0) > 0
    )
  )

  // Flexibility / mobility --------------------------------------------------
  rows.push(
    row(
      'flexibilityGoals',
      'flexibility_mobility',
      [],
      null,
      'Currently has no first-class doctrine consumer — see matrix mobility_warmup_prehab and cooldown_flexibility rows.'
    )
  )

  // Aggregates --------------------------------------------------------------
  const totals = {
    inputsConsumed: rows.filter(r => r.consumed).length,
    inputsMaterialized: rows.filter(r => r.status === 'materialized').length,
    inputsConsumedNoChange: rows.filter(r => r.status === 'consumed_no_change').length,
    inputsBlocked: rows.filter(r => r.status === 'blocked_with_reason').length,
    inputsNotRelevant: rows.filter(r => r.status === 'not_relevant').length,
    inputsMissingConnection: rows.filter(r => r.status === 'missing_connection').length,
    inputsNotObserved: rows.filter(r => r.status === 'not_observed_in_inputs').length,
  }

  let verdict: FullOnboardingTruthMaterializationMap['verdict']
  if (totals.inputsConsumed === rows.length && totals.inputsMissingConnection === 0) {
    verdict = 'ONBOARDING_TRUTH_FULLY_CONSUMED'
  } else if (totals.inputsConsumed >= Math.ceil(rows.length / 2)) {
    verdict = 'ONBOARDING_TRUTH_PARTIALLY_CONSUMED'
  } else {
    verdict = 'ONBOARDING_TRUTH_MOSTLY_NOT_OBSERVED'
  }

  return {
    version: 'phase4h-onboarding-truth-materialization-map-v1',
    generatedAt,
    rows,
    totals,
    verdict,
  }
}
