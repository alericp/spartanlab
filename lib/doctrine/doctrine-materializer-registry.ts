// =============================================================================
// [PHASE 4I] DOCTRINE MATERIALIZER REGISTRY
// =============================================================================
//
// PURPOSE
// -------
// Single, authoritative, JSON-serializable registry that maps every doctrine
// category to its current owner module and status. This is THE source of
// truth that the Phase 4H DoctrineMaterializationMatrix derives from — it
// replaces hardcoded heuristics with documented, traceable reality.
//
// WHAT THIS IS
// ------------
//   • A static configuration file (no I/O, no side effects, no async).
//   • An explicit map of category → { owner, ownerModule, status,
//     allowedFields, notes }.
//   • The single place to declare "this category has a real materializer"
//     vs "this category is read but not yet materialized".
//
// WHAT THIS IS NOT
// ----------------
//   • NOT a second program generator.
//   • NOT a second doctrine engine.
//   • NOT a runtime mutator — it does not call materializers; it only names
//     them.
//   • NOT a shadow display builder — UI consumes the matrix, not the
//     registry directly.
//
// HONESTY RULES
// -------------
//   1. A category may only have status 'CONNECTED_AND_MATERIAL' if a
//      materializer actually exists at the named ownerModule path AND that
//      materializer can mutate at least one of the allowedFields.
//   2. If a materializer does not yet exist, the status MUST be
//      'MATERIALIZER_NOT_CONNECTED' — never 'CONNECTED_AND_MATERIAL'.
//   3. If a category is intentionally not relevant to the current codebase
//      (e.g. military conditioning when the user is a calisthenics athlete),
//      the status should be 'NOT_RELEVANT_TO_CURRENT_PROFILE' computed at
//      runtime; this static registry uses 'PROFILE_GATED' to mean
//      "relevance depends on profile, decide at runtime".
//
// PHASE 4I DELTA FROM PHASE 4H
// ----------------------------
// Phase 4H matrix marked mobility_warmup_prehab and cooldown_flexibility as
// 'NOT_IN_SCHEMA'. That was incorrect — batch 09 doctrine exists, it just
// rides inside the existing 6 rule_types (method/prescription/exercise-
// selection/etc.). Phase 4I corrects this honestly: those categories are
// 'MATERIALIZER_NOT_CONNECTED' (no consumer for mobility/warmup/prehab) or
// 'CONNECTED_AND_MATERIAL' (cooldown/flexibility, via the new flexibility
// cooldown materializer in this phase).
// =============================================================================

import { FLEXIBILITY_GOAL_SUPPORT_MATRIX } from '@/lib/doctrine/source-batches'

// -----------------------------------------------------------------------------
// CATEGORY KEYS — must match the Phase 4H matrix and the Phase 4I prompt.
// -----------------------------------------------------------------------------
export type DoctrineMaterializerCategoryKey =
  | 'exercise_selection'
  | 'carryover_support'
  | 'method_selection'
  /**
   * [PHASE 4J] Honest split: row-level methods (top_set_backoff / drop_set /
   * rest_pause / endurance_density) have NO materializer in the codebase.
   * `method_selection` covers grouped methods (super/circuit/density/cluster)
   * that ARE materialized by `applySessionStylePreferences`. This second key
   * surfaces the row-level gap honestly instead of hiding it inside a single
   * "method_selection: CONNECTED_AND_MATERIAL" claim.
   */
  | 'method_selection_row_level'
  | 'prescription'
  | 'progression'
  | 'contraindication_safety'
  | 'mobility_warmup_prehab'
  | 'cooldown_flexibility'
  | 'weekly_architecture'

// -----------------------------------------------------------------------------
// REGISTRY STATUS — three honest possibilities at registry compile-time.
// Runtime status (e.g. NOT_RELEVANT_TO_CURRENT_PROFILE) is computed by the
// matrix from registry status + actual profile data.
// -----------------------------------------------------------------------------
export type DoctrineMaterializerRegistryStatus =
  /** A real materializer exists at ownerModule that can mutate at least one allowedField. */
  | 'CONNECTED_AND_MATERIAL'
  /** Rules are read into a runtime contract / cache but no mutator consumes them yet. */
  | 'MATERIALIZER_NOT_CONNECTED'
  /** Rules influence candidate scoring/ranking but no mutator changes a field. */
  | 'SCORING_ONLY_NO_MUTATOR'
  /** Relevance is conditional on profile inputs — let the matrix decide at runtime. */
  | 'PROFILE_GATED'

// -----------------------------------------------------------------------------
// REGISTRY ENTRY SHAPE.
// -----------------------------------------------------------------------------
export interface DoctrineMaterializerRegistryEntry {
  category: DoctrineMaterializerCategoryKey
  /**
   * Plain-English owner name shown in diagnostics. `null` means no
   * materializer exists yet — status MUST be 'MATERIALIZER_NOT_CONNECTED'
   * or 'SCORING_ONLY_NO_MUTATOR'.
   */
  owner: string | null
  /**
   * Module path of the consumer that turns rules into program-field changes.
   * `null` means no materializer exists yet — status MUST be
   * 'MATERIALIZER_NOT_CONNECTED' or 'SCORING_ONLY_NO_MUTATOR'.
   */
  ownerModule: string | null
  /** Function name inside ownerModule that performs the mutation. */
  ownerEntryFunction: string | null
  status: DoctrineMaterializerRegistryStatus
  /**
   * Concrete program/session/exercise field names this category may write.
   * Must be a closed list — the matrix uses it for `allowedProgramFields`.
   */
  allowedFields: string[]
  /**
   * Source-batch keys that contribute rules to this category. Diagnostic-only —
   * the runtime contract reads them via the existing aggregator.
   */
  sourceBatches: string[]
  /** Honest plain-English note about the current state. */
  notes: string
}

// -----------------------------------------------------------------------------
// THE REGISTRY.
//
// Order matters only for diagnostics output; lookups use the .find / index.
// Keep this list short, accurate, and honest.
// -----------------------------------------------------------------------------
export const DOCTRINE_MATERIALIZER_REGISTRY: ReadonlyArray<DoctrineMaterializerRegistryEntry> = [
  // ---------------------------------------------------------------------------
  // 1. EXERCISE SELECTION  (Phase 4G — full skill-set query + scorer winner flip)
  // ---------------------------------------------------------------------------
  {
    category: 'exercise_selection',
    owner: 'doctrine exercise scorer',
    ownerModule: '@/lib/doctrine-exercise-scorer',
    ownerEntryFunction: 'applyDoctrineScoringSyncAndSort',
    status: 'CONNECTED_AND_MATERIAL',
    allowedFields: [
      'session.exercises[]',
      'exercise.id',
      'exercise.name',
      'exercise.role',
      'exercise.skillTags',
      'exercise.selectionReason',
    ],
    sourceBatches: [
      'batch_01', 'batch_02', 'batch_03', 'batch_04', 'batch_05',
      'batch_06', 'batch_07', 'batch_08', 'batch_10',
    ],
    notes:
      'Phase 4G widened the prefetch cache to query the full skill set ' +
      '(primary + secondary + selectedSkills) so exercise-selection rules for ' +
      'every selected skill can score candidates. Materialization happens via ' +
      'top-candidate winner flip; the Phase 4E causal challenge audit records ' +
      'sessionsTopCandidateChanged as the literal proof.',
  },

  // ---------------------------------------------------------------------------
  // 2. CARRYOVER SUPPORT  (scorer bonus only — slot allocator NOT yet built)
  // ---------------------------------------------------------------------------
  {
    category: 'carryover_support',
    owner: 'doctrine exercise scorer (per-candidate carryover bonus)',
    ownerModule: '@/lib/doctrine-exercise-scorer',
    ownerEntryFunction: 'applyDoctrineScoringSyncAndSort',
    status: 'SCORING_ONLY_NO_MUTATOR',
    allowedFields: [
      'support slot exercises',
      'exercise.role = support_carryover',
      'exercise.skillSupportTags',
      'exercise.carryoverReason',
      'session.supportSkillExposure',
      'weeklySkillExpression.supportSlots',
    ],
    sourceBatches: ['batch_01', 'batch_03', 'batch_05', 'batch_06', 'batch_07', 'batch_08'],
    notes:
      'Carryover rules currently apply only as per-candidate score bonuses inside ' +
      'the scorer. They can flip a top winner into a doctrine-supported carryover, ' +
      'but the runtimeContract.skillDoctrine.carryoverMap (a per-skill summary) has ' +
      'no support-slot allocator consuming it. Building a true support-slot owner ' +
      'is deferred to Phase 4J.',
  },

  // ---------------------------------------------------------------------------
  // 3. METHOD SELECTION  (Phase 4J — honest correction)
  //
  // The Phase 4G/4H entry blanket-claimed "CONNECTED_AND_MATERIAL" naming
  // method-decision-engine as the owner. That was inaccurate. Phase 4J audit
  // (see lib/program/weekly-method-representation.ts header) found:
  //
  //   1. The actual MATERIALIZER for grouped methods is
  //      `applySessionStylePreferences` in `lib/training-methods.ts`. It
  //      writes session.styleMetadata.styledGroups[].groupType for
  //      'superset' | 'circuit' | 'density_block' | 'cluster' | 'straight'.
  //
  //   2. `method-decision-engine` is a POST-BUILD AUDITOR — it stamps
  //      `session.methodDecision` with the engine's recommendation and the
  //      reconciled `actualMaterialization` counts. It does NOT mutate
  //      exercises.
  //
  //   3. [PHASE 4K UPDATE] Row-level methods `top_set_backoff` / `drop_set` /
  //      `rest_pause` / `cluster` ARE NOW MATERIALIZED. The Phase 4J version
  //      of this comment claimed no materializer existed; that was true at
  //      Phase 4J authoring time but is FALSE on the current branch.
  //      `lib/adaptive-program-builder.ts` lines ~13549-13960 ship a hardened
  //      row-level mutator block with explicit doctrine-locked safety gates
  //      (skill-pillar protection, skill-adjacent token blocklist, weekly-role
  //      density gating, late-position requirement, strength-category
  //      exclusion for drop_set). `endurance_density` remains the only
  //      row-level method with no dedicated writer — `density_block` (grouped)
  //      is the closest materialized form for that profile.
  //
  // We split the entry into two honest rows so the matrix and Program page
  // can render the truth.
  // ---------------------------------------------------------------------------
  {
    category: 'method_selection',
    owner: 'training-methods grouped-style materializer',
    ownerModule: '@/lib/training-methods',
    ownerEntryFunction: 'applySessionStylePreferences',
    status: 'CONNECTED_AND_MATERIAL',
    allowedFields: [
      'session.styleMetadata.styledGroups[]',
      'session.styleMetadata.styledGroups[].groupType',
      'exercise.method',
      'exercise.methodLabel',
      'exercise.setExecutionMethod (cluster only)',
      'exercise.blockId',
      'session.styleMetadata.methodMaterializationSummary',
    ],
    sourceBatches: ['batch_01', 'batch_02', 'batch_06', 'batch_10'],
    notes:
      'Phase 4J honest split — grouped row. applySessionStylePreferences writes ' +
      'styledGroups for superset / circuit / density_block, plus row-level cluster via ' +
      'setExecutionMethod. method-decision-engine.stampMethodDecisionsOnSessions runs ' +
      'AFTER the builder and reconciles a per-session methodDecision auditor stamp; it ' +
      'is not the materializer. Phase 4A.actualMaterialization is the authoritative ' +
      'reconciliation surface.',
  },
  {
    category: 'method_selection_row_level',
    owner: 'adaptive-program-builder row-level method mutator block',
    ownerModule: '@/lib/adaptive-program-builder',
    // No single exported function — the mutator is an inline block inside the
    // session-build path, gated by `sessionMethodIntentContract.userWants{Top,Drop,RestPause}`.
    ownerEntryFunction: null,
    status: 'CONNECTED_AND_MATERIAL',
    allowedFields: [
      'exercise.setExecutionMethod (top_set / drop_set / rest_pause / cluster)',
      'exercise.method',
      'exercise.methodLabel',
    ],
    sourceBatches: ['batch_01', 'batch_02', 'batch_10'],
    notes:
      'Phase 4K honest reconciliation. The Phase 4J entry claimed no materializer ' +
      'existed for top_set_backoff / drop_set / rest_pause; that claim is no longer ' +
      'true. lib/adaptive-program-builder.ts lines ~13549-13960 ship a doctrine-locked ' +
      'row-level writer with explicit safety gates: skill-pillar protection ' +
      '(planche / front lever / back lever / handstand / iron cross / v-sit / manna / ' +
      'muscle-up name + category checks), skill-adjacent token blocklist (chest-to-bar / ' +
      'archer / typewriter / muscle-up) for drop_set, late-position requirement ' +
      '(lateBoundary = max(2, ceil(N/2))), weekly-role density gating ' +
      '(roleBlocksDropSet on low-intensity / density-blocked roles), ' +
      'strength-category exclusion for drop_set, and "already has method or blockId" ' +
      'skip. [PHASE 4L UPDATE] endurance_density NOW has a dedicated row-level ' +
      'writer in lib/program/row-level-method-prescription-mutator.ts ' +
      '(applyRowLevelMethodPrescriptionMutations). It applies to a safe ' +
      'late-position accessory / core / conditioning row when the profile asks ' +
      'for endurance/conditioning context AND no grouped density_block was ' +
      'already applied. lib/program/weekly-method-representation.ts surfaces ' +
      'per-method APPLIED / BLOCKED_BY_SAFETY / NOT_NEEDED_FOR_PROFILE / ' +
      'MATERIALIZER_NOT_CONNECTED, and the Phase 4L mutator rollup ' +
      '(program.rowLevelMutatorRollup) is consumed by ' +
      'WeeklyMethodChallengeLine to upgrade endurance_density to APPLIED ' +
      'when the mutator fired (the auditor cannot see method=endurance_density ' +
      'writes because they are not in materializationRollup totals).',
  },

  // ---------------------------------------------------------------------------
  // 4. PRESCRIPTION  (HONEST GAP — bias flags exist, numeric mutator does not)
  // ---------------------------------------------------------------------------
  {
    category: 'prescription',
    owner: null,
    ownerModule: null,
    ownerEntryFunction: null,
    status: 'SCORING_ONLY_NO_MUTATOR',
    allowedFields: [
      'exercise.sets',
      'exercise.reps',
      'exercise.holdSeconds',
      'exercise.restSeconds',
      'exercise.rpe',
      'exercise.tempo',
    ],
    sourceBatches: [
      'batch_01', 'batch_02', 'batch_03', 'batch_04', 'batch_05',
      'batch_06', 'batch_07', 'batch_08', 'batch_09', 'batch_10',
    ],
    notes:
      'Prescription rules are summarized into bias flags (intensityBias / volumeBias / ' +
      'densityBias / holdBias) and rationale strings consumed by method-decision-engine ' +
      'for fatigue and time-efficiency notes. The existing per-exercise sets/reps/hold/' +
      'rest/RPE resolver does NOT consume those biases as numeric mutators. Wiring ' +
      'decisive numeric dose mutation requires a dedicated safety phase that respects ' +
      'week phase, current working level, joint cautions, and method/exercise category ' +
      'bounds. [PHASE 4L UPDATE] lib/program/row-level-method-prescription-mutator.ts ' +
      'now provides a per-row bounds WITNESS (currentValue + doctrineMin/Max + verdict ' +
      'ALREADY_WITHIN_BOUNDS / OUT_OF_BOUNDS_NOT_MUTATED / MISSING_DOCTRINE_BOUNDS) ' +
      'attached to exercise.prescriptionBoundsProof and rolled up onto ' +
      'program.rowLevelMutatorRollup.rowsWithinBounds / rowsOutOfBounds / ' +
      'rowsMissingBounds. The witness does not mutate dose — Phase 4L still honors the ' +
      'safety deferral. Status remains SCORING_ONLY_NO_MUTATOR because no numeric ' +
      'sets/reps/hold/rest/RPE field is overwritten; the bounds witness is a proof ' +
      'surface, not a mutator.',
  },

  // ---------------------------------------------------------------------------
  // 5. PROGRESSION  (HONEST GAP — bias flags exist, slot mutator does not)
  // ---------------------------------------------------------------------------
  {
    category: 'progression',
    owner: null,
    ownerModule: null,
    ownerEntryFunction: null,
    status: 'SCORING_ONLY_NO_MUTATOR',
    allowedFields: [
      'exercise.progressionLevel',
      'exercise.currentWorkingLevel',
      'exercise.progressionPath',
      'exercise.nextProgression',
      'exercise.regressionFallback',
      'exercise.readinessGate',
      'exercise.progressionReason',
    ],
    sourceBatches: [
      'batch_01', 'batch_02', 'batch_03', 'batch_04', 'batch_05',
      'batch_06', 'batch_07', 'batch_08',
    ],
    notes:
      'Progression rules are summarized into per-skill bias flags (perSkill, ' +
      'globalConservativeBias, globalAssistedBias). The existing progression-slot ' +
      'picker does not consume those flags as numeric/path mutators. Wiring them ' +
      'requires a dedicated phase that separates currentWorkingLevel from ' +
      'historicalBest and respects readiness gates. Honest gap.',
  },

  // ---------------------------------------------------------------------------
  // 6. CONTRAINDICATION SAFETY  (hard filter in scorer)
  // ---------------------------------------------------------------------------
  {
    category: 'contraindication_safety',
    owner: 'doctrine exercise scorer (hard filter)',
    ownerModule: '@/lib/doctrine-exercise-scorer',
    ownerEntryFunction: 'applyDoctrineScoringSyncAndSort',
    status: 'CONNECTED_AND_MATERIAL',
    allowedFields: [
      'removedCandidateIds',
      'modifiedExerciseIds',
      'exercise.substitutionReason',
      'exercise.jointProtectionReason',
      'exercise.safetyBlockedReason',
    ],
    sourceBatches: [
      'batch_01', 'batch_02', 'batch_03', 'batch_04', 'batch_05',
      'batch_06', 'batch_07', 'batch_08', 'batch_09', 'batch_10',
    ],
    notes:
      'Hard filter: when a contraindication matches, the candidate is removed ' +
      'pre-scoring. Materialization is observable as candidates absent from the ' +
      'final exercise list. Joint cautions from inputs.jointCautions feed the rule ' +
      'matcher.',
  },

  // ---------------------------------------------------------------------------
  // 7. MOBILITY / WARMUP / PREHAB
  //
  // Phase 4H called this 'NOT_IN_SCHEMA' — that was wrong. Batch 09 ships
  // mobility/warmup/prehab doctrine inside method/prescription/exercise-
  // selection rule buckets. What's missing is the materializer that builds
  // session.warmup/prehab blocks from those rules. Honestly: gap, not absence.
  // ---------------------------------------------------------------------------
  {
    category: 'mobility_warmup_prehab',
    owner: null,
    ownerModule: null,
    ownerEntryFunction: null,
    status: 'MATERIALIZER_NOT_CONNECTED',
    allowedFields: [
      'session.warmup',
      'session.prehab',
      'session.prepBlocks',
      'exercise.prepNotes',
      'session.jointPrepFocus',
      'session.skillPrepFocus',
    ],
    sourceBatches: ['batch_09'],
    notes:
      'Batch 09 provides mobility / warmup / prehab / skill-rampup doctrine inside ' +
      'the existing 6 rule_types (no separate "mobility" rule_type exists in the ' +
      'schema, by design). What is missing is the materializer that selects ' +
      'compact 1-3 item warmup/prehab blocks based on inputs.jointCautions, ' +
      'selectedSkills, and session role. Phase 4I deliberately does NOT build this — ' +
      'the safe scope for this phase is the cooldown/flexibility materializer below. ' +
      'Mobility/warmup materializer is Phase 4J.',
  },

  // ---------------------------------------------------------------------------
  // 8. COOLDOWN / FLEXIBILITY  (NEW IN PHASE 4I — first real Batch 09 consumer)
  //
  // Pure additive materializer. Stamps a new field on the program when (and
  // only when) inputs.flexibilityGoals is non-empty. Otherwise marks
  // NOT_RELEVANT_TO_CURRENT_PROFILE.
  // ---------------------------------------------------------------------------
  {
    category: 'cooldown_flexibility',
    owner: 'doctrine flexibility cooldown materializer (Phase 4I)',
    ownerModule: '@/lib/program/doctrine-flexibility-cooldown-materializer',
    ownerEntryFunction: 'buildDoctrineFlexibilityCooldownMaterialization',
    status: 'PROFILE_GATED',
    allowedFields: [
      // The materializer writes a single top-level program field that lists
      // per-session cooldown/flexibility blocks. It does NOT mutate
      // session.cooldown directly — Phase 4I keeps the change additive so
      // existing session-shape consumers cannot break. Phase 4J will wire
      // these blocks into session.cooldown when the consumer audit is done.
      'program.cooldownFlexibilityMaterialization',
      'program.cooldownFlexibilityMaterialization.materializedSessions[]',
      'program.cooldownFlexibilityMaterialization.materializedSessions[].blocks[]',
      'program.cooldownFlexibilityMaterialization.materializedSessions[].blocks[].sourceRuleIds[]',
    ],
    sourceBatches: ['batch_09'],
    notes:
      'Materializer reads inputs.flexibilityGoals + FLEXIBILITY_GOAL_SUPPORT_MATRIX ' +
      'and emits per-session cooldown blocks bounded by max 2 goals/session and ' +
      'max 3 sessions/week. Each block records sourceRuleIds for save/load proof. ' +
      'When inputs.flexibilityGoals is empty, status becomes NOT_RELEVANT_TO_CURRENT_PROFILE ' +
      'with no blocks emitted. Phase 4I keeps the output additive so live workout ' +
      'handoff and existing session-shape consumers are not affected.',
  },

  // ---------------------------------------------------------------------------
  // 9. WEEKLY ARCHITECTURE  (input-driven; doctrine influence is bounded)
  // ---------------------------------------------------------------------------
  {
    category: 'weekly_architecture',
    owner: 'weekly skill expression allocator + session architecture truth',
    ownerModule: '@/lib/program/weekly-skill-expression-allocator',
    ownerEntryFunction: 'allocateWeeklySkillExpression',
    status: 'CONNECTED_AND_MATERIAL',
    allowedFields: [
      'weeks[].days[].sessionRole',
      'weeks[].days[].dayFocus',
      'weeks[].days[].dayType',
      'sessionArchitectureTruth',
      'weeklySkillExpression',
    ],
    sourceBatches: ['batch_07', 'batch_08'],
    notes:
      'Weekly architecture is primarily input-driven (requestedTrainingDays, ' +
      'sessionDurationTarget, primaryGoal, selectedSkills) — user inputs remain ' +
      'authoritative per the Phase 4I non-negotiable. Doctrine influence is bounded ' +
      'to session role / focus / skill exposure shaping inside the allocator. ' +
      'No phase changes day-count or schedule against user input.',
  },
] as const

// -----------------------------------------------------------------------------
// REGISTRY HELPERS  (pure, JSON-safe, no I/O)
// -----------------------------------------------------------------------------

/** Look up a single registry entry by category. */
export function getDoctrineMaterializerEntry(
  category: DoctrineMaterializerCategoryKey
): DoctrineMaterializerRegistryEntry | null {
  return DOCTRINE_MATERIALIZER_REGISTRY.find(e => e.category === category) ?? null
}

/**
 * Returns the count of FLEXIBILITY_GOAL_SUPPORT_MATRIX entries that are
 * eligible for cooldown placement. Used by the Phase 4I matrix to honestly
 * report what the cooldown materializer can draw from.
 */
export function countCooldownEligibleFlexibilityGoals(): number {
  let count = 0
  for (const key of Object.keys(FLEXIBILITY_GOAL_SUPPORT_MATRIX)) {
    const entry = (FLEXIBILITY_GOAL_SUPPORT_MATRIX as Record<string, { cooldownAllowed?: boolean; directFlexibilityGoal?: boolean }>)[key]
    if (entry?.cooldownAllowed === true && entry?.directFlexibilityGoal === true) {
      count += 1
    }
  }
  return count
}

/**
 * Snapshot of the registry shaped for the Phase 4H matrix. The matrix imports
 * this so its `allowedProgramFields` and `materializerExists` come from the
 * registry instead of hardcoded heuristics.
 */
export interface DoctrineMaterializerRegistrySnapshot {
  version: 'phase4i-doctrine-materializer-registry-v1'
  entries: DoctrineMaterializerRegistryEntry[]
  totals: {
    categoriesConnectedAndMaterial: number
    categoriesScoringOnlyNoMutator: number
    categoriesMaterializerNotConnected: number
    categoriesProfileGated: number
  }
}

export function buildDoctrineMaterializerRegistrySnapshot(): DoctrineMaterializerRegistrySnapshot {
  let connected = 0
  let scoring = 0
  let notConnected = 0
  let gated = 0
  for (const e of DOCTRINE_MATERIALIZER_REGISTRY) {
    switch (e.status) {
      case 'CONNECTED_AND_MATERIAL':
        connected += 1
        break
      case 'SCORING_ONLY_NO_MUTATOR':
        scoring += 1
        break
      case 'MATERIALIZER_NOT_CONNECTED':
        notConnected += 1
        break
      case 'PROFILE_GATED':
        gated += 1
        break
    }
  }
  return {
    version: 'phase4i-doctrine-materializer-registry-v1',
    entries: DOCTRINE_MATERIALIZER_REGISTRY.map(e => ({ ...e })),
    totals: {
      categoriesConnectedAndMaterial: connected,
      categoriesScoringOnlyNoMutator: scoring,
      categoriesMaterializerNotConnected: notConnected,
      categoriesProfileGated: gated,
    },
  }
}
