/**
 * DOCTRINE BATCH 1 — UPLOADED PDF DOCTRINE (CODE FALLBACK)
 *
 * PURPOSE
 * -------
 * In-code source-of-truth-shape mirror of the SQL seed in
 * `scripts/017-doctrine-batch1-atoms.sql`.
 *
 * It is consumed by `lib/doctrine-runtime-contract.ts` as a fallback ONLY when
 * the doctrine DB returns zero atoms (DB unavailable, tables empty, or live read
 * failed). When the DB is healthy with rules, this file is NOT used — DB wins.
 *
 * PROVENANCE / HONESTY
 * --------------------
 * Every atom here is paraphrased from the user-provided summary in the
 * "DOCTRINE BATCH 1 INGESTION + TRUTH-TO-UI DELIVERY LOCK" prompt, Section 3.
 * The raw PDFs were not attached to the ingestion turn.
 *
 * Each atom carries `internalRationale` starting with
 * "derived_from_prompt_section_3_summary" so it is unambiguous that this is a
 * paraphrased summary, not literal PDF evidence. A future refinement pass can
 * upgrade `priorityType` and add literal `evidenceSnippet` quotes once the raw
 * PDFs are attached.
 *
 * SHAPE
 * -----
 * Atoms are typed against the existing DB-row interfaces in
 * `lib/doctrine-db.ts`. This guarantees the runtime contract's builder helpers
 * consume in-code atoms identically to DB rows — single assembly path, zero
 * parallel logic.
 *
 * Each atom additionally exposes a "rich provenance" field via a small
 * `Batch01Provenance` extension. The runtime contract does not require these
 * fields; they are surfaced through helpers in this module for the ingestion
 * validator and the optional UI proof line.
 */

import type {
  DoctrineSource,
  DoctrinePrinciple,
  ProgressionRule,
  ExerciseSelectionRule,
  ContraindicationRule,
  MethodRule,
  PrescriptionRule,
  CarryoverRule,
} from "../../doctrine-db"

// =============================================================================
// PROVENANCE EXTENSION
// =============================================================================

export type Batch01PriorityType = "hard_constraint" | "strong_preference" | "soft_preference" | "example_only"
export type Batch01IntelligenceTier = "base_week_intelligence" | "phase_week_modulation" | "cross_cutting"

/**
 * Lookup of rich provenance per atom id. Keyed by atom id (UUID-like string).
 * The base DB-row types intentionally do NOT carry these fields so that
 * `lib/doctrine-db.ts` accessors remain unchanged.
 *
 * Consumers that want rich provenance call `getBatch01ProvenanceFor(id)`.
 */
export interface Batch01Provenance {
  atomId: string
  sourceKey: string
  priorityType: Batch01PriorityType
  intelligenceTier: Batch01IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  plainLanguageRule: string
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  internalRationale: string
  safetyNotes: string | null
  conflictGroup: string | null
}

const PROVENANCE_NOTE = "derived_from_prompt_section_3_summary"

// =============================================================================
// SOURCES (9)
// =============================================================================

export const BATCH_01_SOURCE_KEY_PREFIX = "batch_01_"

const BATCH_01_VERSION = "v1"

/**
 * Build a deterministic UUID-like id for atoms. This is a stable string id, NOT
 * a real UUID — but the DB row interfaces type id as `string` so this is safe
 * for the in-code path. The SQL seed uses real `gen_random_uuid()`. Parity is
 * defined as "same atom counts and same source coverage", not "same ids".
 */
function atomId(prefix: string, n: number): string {
  return `${prefix}_${String(n).padStart(3, "0")}`
}

const NOW = new Date("2025-01-01T00:00:00.000Z")

export const BATCH_01_SOURCES: DoctrineSource[] = [
  {
    id: "src_batch_01_hybrid_ppl",
    sourceKey: "hybrid_ppl_uploaded_pdf_batch_01",
    title: "Hybrid Push/Pull/Legs (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "6-day Pull/Push/Legs hybrid hypertrophy + strength support. Heavy compounds 6-8 reps, accessories 8-20 reps, week progression by adding sets/reps. Reference for hybrid hypertrophy, not a skill-specific replacement.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_01_forearm_health",
    sourceKey: "forearm_health_uploaded_pdf_batch_01",
    title: "Forearm Health (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Tendon support: wrist pronation/extension/supination/flexion, 2x15 reps, low rest, paired/circuit. Joint support for pulling, planche, lever, rings. Never replaces primary strength or skill work.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_01_pup_phase_1",
    sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
    title: "Pull-Up Pro Phase 1 (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Vertical pull foundation: two-arm vertical pull as primary, rows as support, hangs for grip/scap, external rotation/face pulls, curls. Two pull exposures per week. Foundational, not advanced one-arm specialization.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_01_pup_phase_2",
    sourceKey: "pull_up_pro_phase_2_uploaded_pdf_batch_01",
    title: "Pull-Up Pro Phase 2 (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Assisted one-arm pull transition: assisted one-arm appears before eccentric-heavy one-arm. Low reps, long rest. Two-arm vertical pull remains in support, plus rows/scap pulls/hangs/external rotations/curls.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_01_pup_phase_3",
    sourceKey: "pull_up_pro_phase_3_uploaded_pdf_batch_01",
    title: "Pull-Up Pro Phase 3 (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Eccentric one-arm pull specialization: eccentrics as primary advanced exposure, one-arm bodyweight rows and one-arm hangs become more relevant. Frequency can rise to 3 pull exposures. Long rest remains important.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_01_front_lever",
    sourceKey: "front_lever_uploaded_pdf_batch_01",
    title: "Front Lever Skill + Carryover (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Front lever direct holds + pulls/eccentrics + band-assisted holds. Dragon flags, horizontal scap pulls, FL pulldowns as carryover. 3x/week exposure can be valid when recovery and priority justify. Carryover-only representation is allowed but must be visible.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_01_lower_body_b",
    sourceKey: "lower_body_b_uploaded_pdf_batch_01",
    title: "Lower Body B (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Step-ups, hamstring curls, sissy squat progressions, glute bridge variations, calf raises. Level-based progression from assisted/basic to unilateral/eccentric. Lower-body work supports whole-athlete development without hijacking upper-body skill recovery.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_01_body_by_rings",
    sourceKey: "body_by_rings_uploaded_pdf_batch_01",
    title: "Body By Rings (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Rings hypertrophy via ring height/body angle adjustment. Push-up/pull-up/dip prerequisite. Hypertrophy-biased, not optimal as direct planche/FL skill protocol. SAID principle. Push/pull split ~4 sessions/week sweet spot. Dynamic warm-up 10-15min pre, static stretching post.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_01_cardio_guide",
    sourceKey: "cardio_guide_uploaded_pdf_batch_01",
    title: "Cardio Guide (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "HIIT alternates near-max and rest periods, time-efficient but recovery-taxing and higher injury risk. LISS lower injury risk, less systemically taxing, requires more time. Cardio respects recovery, injury risk, lower-body fatigue, and primary goal.",
    version: BATCH_01_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
]

// Provenance index, populated as atoms are declared below.
const PROVENANCE: Record<string, Batch01Provenance> = {}

function recordProvenance(p: Batch01Provenance): void {
  PROVENANCE[p.atomId] = p
}

// =============================================================================
// PRINCIPLES
// =============================================================================

export const BATCH_01_PRINCIPLES: DoctrinePrinciple[] = []

function addPrinciple(args: {
  n: number
  sourceId: string
  sourceKey: string
  doctrineFamily: string
  principleKey: string
  principleTitle: string
  principleSummary: string
  athleteLevelScope: string[]
  goalScope: string[] | null
  appliesToSkillTypes: string[] | null
  appliesToTrainingStyles: string[] | null
  safetyPriority: number
  priorityWeight: number
  priorityType: Batch01PriorityType
  intelligenceTier: Batch01IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  safetyNotes?: string
  conflictGroup?: string
}): void {
  const id = atomId("ppl", args.n)
  BATCH_01_PRINCIPLES.push({
    id,
    sourceId: args.sourceId,
    doctrineFamily: args.doctrineFamily,
    principleKey: args.principleKey,
    principleTitle: args.principleTitle,
    principleSummary: args.principleSummary,
    athleteLevelScope: args.athleteLevelScope,
    goalScope: args.goalScope,
    appliesToSkillTypes: args.appliesToSkillTypes,
    appliesToTrainingStyles: args.appliesToTrainingStyles,
    safetyPriority: args.safetyPriority,
    priorityWeight: args.priorityWeight,
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.appliesWhen,
    doesNotApplyWhen: args.doesNotApplyWhen,
    plainLanguageRule: args.principleSummary,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: args.safetyNotes ?? null,
    conflictGroup: args.conflictGroup ?? null,
  })
}

// --- Body By Rings principles (6) ---
addPrinciple({
  n: 1,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  doctrineFamily: "skill_specificity_logic",
  principleKey: "said_principle_skill_specificity",
  principleTitle: "SAID: skill goals require specific repeated practice",
  principleSummary:
    "If a user selects a skill (planche, front lever, back lever, HSPU, muscle-up), the program must include direct skill exposure or explicitly labeled carryover. Pure hypertrophy substitutions are not enough unless intentionally marked as carryover.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: ["bodyweight_skill", "calisthenics_skill", "front_lever", "planche", "back_lever", "muscle_up", "hspu"],
  appliesToSkillTypes: ["isometric", "dynamic_skill"],
  appliesToTrainingStyles: ["calisthenics", "hybrid"],
  safetyPriority: 5,
  priorityWeight: 0.95,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { hasSelectedSkills: true },
  doesNotApplyWhen: { onlyGoalIsHypertrophy: true },
  computationFriendlyRule: {
    eachSelectedSkill: "must_resolve_to_one_of",
    options: ["direct_block", "microdose", "carryover_only", "deferred_with_reason", "omitted_due_to_constraint"],
    uiMustNotClaimRepresentationWithoutEvidence: true,
  },
  userVisibleEvidenceLabel: "Skill specificity (SAID): selected skills get direct exposure or labeled carryover",
})

addPrinciple({
  n: 2,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  doctrineFamily: "frequency_logic",
  principleKey: "rings_push_pull_4_session_sweet_spot",
  principleTitle: "Push/pull split around 4 sessions/week is a hypertrophy sweet spot",
  principleSummary:
    "An upper-body push/pull split of approximately 4 sessions per week is favored for hypertrophy quality. 5 upper-body sessions can compromise recovery for hypertrophy quality.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy", "hybrid", "calisthenics_strength"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["calisthenics", "hybrid", "rings"],
  safetyPriority: 3,
  priorityWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoal: ["hypertrophy", "hybrid"], availableSessionsPerWeek: { gte: 4 } },
  doesNotApplyWhen: { primaryGoal: ["pure_skill_specialization"] },
  computationFriendlyRule: { upperBodySessionsPerWeek: { preferred: 4, max: 5, warnIfAbove: 5 } },
  userVisibleEvidenceLabel: "4 upper-body sessions/week is the hypertrophy sweet spot",
})

addPrinciple({
  n: 3,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  doctrineFamily: "warmup_logic",
  principleKey: "dynamic_warmup_pre_strength",
  principleTitle: "Dynamic warm-up ~10–15 min before strength/skill work",
  principleSummary:
    "Warm-ups before strength/skill work should be dynamic, joint-specific, and approximately 10–15 minutes when session length allows.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["calisthenics", "hybrid", "rings", "weighted"],
  safetyPriority: 7,
  priorityWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { sessionLengthMinutes: { gte: 30 } },
  doesNotApplyWhen: { sessionType: "pure_mobility_recovery" },
  computationFriendlyRule: {
    warmupStyle: "dynamic",
    durationMinutes: { min: 10, max: 15 },
    includeJoints: ["wrists", "scap", "shoulders"],
    placeBeforeSkillOrStrengthBlock: true,
  },
  userVisibleEvidenceLabel: "Dynamic warm-up (10–15 min) included before strength/skill",
  safetyNotes: "Particularly important for upper-body skill, ring, and pulling work.",
})

addPrinciple({
  n: 4,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  doctrineFamily: "warmup_logic",
  principleKey: "static_stretching_post_not_pre",
  principleTitle: "Static stretching belongs after, not before, strength/skill",
  principleSummary:
    "Static stretching is not primary pre-strength prep and is better placed after training than before power/strength work.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 4,
  priorityWeight: 0.6,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { warmupGenerationActive: true },
  doesNotApplyWhen: { sessionType: "mobility_only" },
  computationFriendlyRule: { staticStretchPlacement: "post_session", preventPreStrength: true },
  userVisibleEvidenceLabel: "Static stretching moved to post-session",
})

addPrinciple({
  n: 5,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  doctrineFamily: "recovery_protection_logic",
  principleKey: "no_random_extra_upper_body",
  principleTitle: "Don't randomly add extra upper-body work to complete sessions",
  principleSummary:
    "Adding extra upper-body exercises on top of already-complete sessions degrades hypertrophy quality and recovery. Session structure should be respected.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["calisthenics", "hybrid", "rings"],
  safetyPriority: 5,
  priorityWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { sessionAlreadyMeetsTargetVolume: true },
  doesNotApplyWhen: { athleteRequestedExtraVolumeIntentionally: true },
  computationFriendlyRule: {
    blockBehavior: "do_not_append_extra_upper_body_exercises_when_session_complete",
  },
  userVisibleEvidenceLabel: "Session volume respected — no random extra upper-body work added",
})

addPrinciple({
  n: 6,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  doctrineFamily: "movement_pattern_logic",
  principleKey: "rings_intensity_via_height_angle",
  principleTitle: "Rings adjust intensity via ring height / body angle",
  principleSummary:
    "Rings are strong for upper-body hypertrophy because exercise intensity can be adjusted by ring height/body angle. Use this rather than artificial loading where possible.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: ["hypertrophy", "hybrid", "calisthenics_strength"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["rings", "calisthenics"],
  safetyPriority: 3,
  priorityWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { equipmentIncludes: "rings" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { progressionLever: "ring_height_or_body_angle", preferOver: ["external_load"] },
  userVisibleEvidenceLabel: "Rings progressed via ring height / body angle",
})

// --- Cardio Guide principles (4) ---
addPrinciple({
  n: 7,
  sourceId: "src_batch_01_cardio_guide",
  sourceKey: "cardio_guide_uploaded_pdf_batch_01",
  doctrineFamily: "recovery_protection_logic",
  principleKey: "hiit_recovery_cost",
  principleTitle: "HIIT carries high recovery cost and injury risk",
  principleSummary:
    "HIIT alternates near-max effort with easy/rest periods. Time-efficient and can stimulate muscle, but recovery-taxing and higher injury risk. Restrict during dense strength/skill weeks and high lower-body fatigue.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 7,
  priorityWeight: 0.85,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: {
    cardioRequested: true,
    contextMatchesAny: ["lower_body_fatigue_high", "weekly_strength_load_high", "skill_priority_high", "recovery_low", "injury_risk_high"],
  },
  doesNotApplyWhen: { primaryGoal: ["fat_loss"], recoveryGood: true, weekDensityLow: true },
  computationFriendlyRule: { hiitEligibility: "restricted_when_recovery_or_load_compromised", fallbackTo: "liss_or_omit" },
  userVisibleEvidenceLabel: "HIIT limited due to recovery cost",
  conflictGroup: "cg-cardio-method-selection",
})

addPrinciple({
  n: 8,
  sourceId: "src_batch_01_cardio_guide",
  sourceKey: "cardio_guide_uploaded_pdf_batch_01",
  doctrineFamily: "recovery_protection_logic",
  principleKey: "liss_lower_systemic_cost",
  principleTitle: "LISS is lower-impact and less systemically taxing",
  principleSummary:
    "LISS (low-intensity steady state) has lower injury risk and less systemic taxation, but requires more time. Prefer when recovery is compromised or weekly load is already high.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 4,
  priorityWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { cardioRequested: true, recoveryOrLoadCompromised: true },
  doesNotApplyWhen: { sessionTimeBudgetVeryLow: true },
  computationFriendlyRule: { lissPreferredWhen: "recovery_or_load_compromised", durationMinutes: { min: 30, max: 60 } },
  userVisibleEvidenceLabel: "LISS preferred — lower recovery cost",
  conflictGroup: "cg-cardio-method-selection",
})

addPrinciple({
  n: 9,
  sourceId: "src_batch_01_cardio_guide",
  sourceKey: "cardio_guide_uploaded_pdf_batch_01",
  doctrineFamily: "recovery_protection_logic",
  principleKey: "cardio_respects_primary_goal",
  principleTitle: "Cardio selection respects recovery, injury risk, and primary goal",
  principleSummary:
    "Cardio selection must respect recovery state, injury risk, lower-body fatigue, and the user's primary goal. Do not blindly add HIIT to demanding strength/skill weeks.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 6,
  priorityWeight: 0.8,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { cardioInScope: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { cardioGate: ["recovery", "injury_risk", "lower_body_fatigue", "primary_goal"] },
  userVisibleEvidenceLabel: "Cardio gated by recovery + primary goal",
})

addPrinciple({
  n: 10,
  sourceId: "src_batch_01_cardio_guide",
  sourceKey: "cardio_guide_uploaded_pdf_batch_01",
  doctrineFamily: "method_selection_logic",
  principleKey: "no_blind_hiit_finisher",
  principleTitle: "Do not blindly add HIIT finishers to dense weeks",
  principleSummary:
    "When the strength/skill priority is high and the week is already dense, HIIT finishers should be avoided. Default to LISS or omit conditioning rather than stack risk.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["calisthenics_strength", "calisthenics_skill", "hybrid", "front_lever", "planche", "muscle_up"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 6,
  priorityWeight: 0.8,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { weekDensityHigh: true, primaryGoalIsStrengthOrSkill: true },
  doesNotApplyWhen: { primaryGoal: ["fat_loss", "general_conditioning"], recoveryGood: true },
  computationFriendlyRule: { hiitFinisher: "blocked_when_weekly_load_high" },
  userVisibleEvidenceLabel: "No HIIT finisher — week already dense",
})

// --- Front Lever principle (1) ---
addPrinciple({
  n: 11,
  sourceId: "src_batch_01_front_lever",
  sourceKey: "front_lever_uploaded_pdf_batch_01",
  doctrineFamily: "skill_progression_logic",
  principleKey: "fl_carryover_visible_when_no_direct",
  principleTitle: "Front lever may be represented through carryover, but it must be visible",
  principleSummary:
    "If direct front lever exposure is omitted for recovery, level, or schedule reasons, the system may represent front lever through carryover work, but the UI must explicitly label the carryover reason. Missing direct skill does not automatically mean the skill is missing if carryover work is intentional.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: ["front_lever", "bodyweight_skill"],
  appliesToSkillTypes: ["isometric"],
  appliesToTrainingStyles: ["calisthenics", "rings"],
  safetyPriority: 4,
  priorityWeight: 0.9,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkillsIncludes: "front_lever" },
  doesNotApplyWhen: { weekRepresentationAlreadyHasDirect: true },
  computationFriendlyRule: {
    if: { directFLExerciseInWeek: false, carryoverExercisesPresent: true },
    then: { weekRepresentationMark: "carryover_only", uiMustLabelCarryoverReason: true },
  },
  userVisibleEvidenceLabel: "Front lever represented through carryover (direct work deferred)",
})

// --- Pull-Up Pro Phase 1 principle (1) ---
addPrinciple({
  n: 12,
  sourceId: "src_batch_01_pup_phase_1",
  sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
  doctrineFamily: "athlete_prerequisites",
  principleKey: "two_arm_pull_base_before_one_arm",
  principleTitle: "Two-arm pulling foundation precedes one-arm specialization",
  principleSummary:
    "One-arm pull-up specialization must progress from two-arm vertical pull + rows + hangs (Phase 1) to assisted one-arm work (Phase 2) before eccentric-heavy one-arm work (Phase 3). Foundation is gated by current pulling benchmark.",
  athleteLevelScope: ["beginner", "novice", "intermediate"],
  goalScope: ["one_arm_pull_up", "vertical_pull_specialization"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["calisthenics"],
  safetyPriority: 7,
  priorityWeight: 0.95,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { primaryGoal: ["one_arm_pull_up"], pullingBenchmarkBelowAdvanced: true },
  doesNotApplyWhen: { pullingBenchmarkAdvanced: true },
  computationFriendlyRule: {
    phaseGate: { phase1: "two_arm_pull_plus_rows_plus_hangs", phase2: "assisted_one_arm", phase3: "eccentric_one_arm" },
    skipPhasesNotAllowedUnless: "advanced_readiness_documented",
  },
  userVisibleEvidenceLabel: "One-arm work gated by pulling foundation",
})

// --- Lower Body B principle (1) ---
addPrinciple({
  n: 13,
  sourceId: "src_batch_01_lower_body_b",
  sourceKey: "lower_body_b_uploaded_pdf_batch_01",
  doctrineFamily: "lower_body_integration_logic",
  principleKey: "lower_body_does_not_compromise_upper_skill",
  principleTitle: "Lower-body work must not compromise upper-body skill recovery",
  principleSummary:
    "Lower-body work should be progressive and complete. When the user's primary goal is upper-body calisthenics skill, lower-body frequency/volume must not compromise upper-body recovery.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["calisthenics", "hybrid"],
  safetyPriority: 5,
  priorityWeight: 0.8,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoalIsUpperBodySkill: true },
  doesNotApplyWhen: { primaryGoalIsLowerBody: true },
  computationFriendlyRule: { lowerBodyVolumeCap: "do_not_overload_skill_focused_week", scaleByAvailableDays: true },
  userVisibleEvidenceLabel: "Lower-body volume calibrated to protect upper-body skill recovery",
})

// --- Forearm Health principle (1) ---
addPrinciple({
  n: 14,
  sourceId: "src_batch_01_forearm_health",
  sourceKey: "forearm_health_uploaded_pdf_batch_01",
  doctrineFamily: "accessory_logic",
  principleKey: "forearm_prehab_support_only",
  principleTitle: "Forearm prehab is support, not primary work",
  principleSummary:
    "Forearm health work supports grip, rings, pulling, and straight-arm stress but remains low-volume support. It must never replace primary pulling/skill work.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["calisthenics", "rings", "hybrid"],
  safetyPriority: 4,
  priorityWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goalsIncludeAny: ["pulling", "rings", "lever", "planche", "grip"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { forearmLane: "prehab_or_accessory_only", neverReplacePrimary: true },
  userVisibleEvidenceLabel: "Forearm prehab added as tendon support",
})

// --- Hybrid PPL principle (1) ---
addPrinciple({
  n: 15,
  sourceId: "src_batch_01_hybrid_ppl",
  sourceKey: "hybrid_ppl_uploaded_pdf_batch_01",
  doctrineFamily: "weekly_distribution_logic",
  principleKey: "ppl_hybrid_hypertrophy_strength_support",
  principleTitle: "PPL is hybrid hypertrophy/strength support, not skill replacement",
  principleSummary:
    "Hybrid PPL is useful for hypertrophy and strength support, not as a skill-specific replacement. When a more specialized doctrine exists (FL, planche, one-arm pull), specialized doctrine wins.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy", "hybrid", "strength_support"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["hybrid", "weighted"],
  safetyPriority: 3,
  priorityWeight: 0.6,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { availableSessionsPerWeek: { gte: 5 }, primaryGoal: ["hypertrophy", "hybrid"] },
  doesNotApplyWhen: { primaryGoalIsSkillSpecialization: true },
  computationFriendlyRule: { templateRoleForHybridPPL: "reference_only_when_specialized_doctrine_present" },
  userVisibleEvidenceLabel: "Hybrid PPL used as hypertrophy support, not skill replacement",
})

// --- BBR objective tracking principle (1) ---
addPrinciple({
  n: 16,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  doctrineFamily: "technique_exposure_logic",
  principleKey: "objective_tracking_required",
  principleTitle: "Objective tracking is required for progression decisions",
  principleSummary:
    "Progression decisions should be informed by objective tracking (reps, holds, RPE, completed sets), not by feel alone.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 3,
  priorityWeight: 0.6,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { progressionDecisionPending: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { progressionTriggerRequires: ["objective_metric_met"] },
  userVisibleEvidenceLabel: "Progression based on objective tracking",
})

// =============================================================================
// PROGRESSION RULES
// =============================================================================

export const BATCH_01_PROGRESSION_RULES: ProgressionRule[] = []

function addProgression(args: {
  n: number
  sourceId: string
  sourceKey: string
  skillKey: string
  currentLevelKey: string
  nextLevelKey: string
  requiredPrerequisitesJson: Record<string, string> | null
  minReadinessJson: Record<string, string> | null
  progressionRuleSummary: string
  cautionFlagsJson: string[] | null
  confidenceWeight: number
  priorityType: Batch01PriorityType
  intelligenceTier: Batch01IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  safetyNotes?: string
  conflictGroup?: string
}): void {
  const id = atomId("prg", args.n)
  BATCH_01_PROGRESSION_RULES.push({
    id,
    sourceId: args.sourceId,
    skillKey: args.skillKey,
    currentLevelKey: args.currentLevelKey,
    nextLevelKey: args.nextLevelKey,
    requiredPrerequisitesJson: args.requiredPrerequisitesJson,
    minReadinessJson: args.minReadinessJson,
    progressionRuleSummary: args.progressionRuleSummary,
    cautionFlagsJson: args.cautionFlagsJson,
    confidenceWeight: args.confidenceWeight,
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.appliesWhen,
    doesNotApplyWhen: args.doesNotApplyWhen,
    plainLanguageRule: args.progressionRuleSummary,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: args.safetyNotes ?? null,
    conflictGroup: args.conflictGroup ?? null,
  })
}

// PUP Phase 1 internal progression
addProgression({
  n: 1,
  sourceId: "src_batch_01_pup_phase_1",
  sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
  skillKey: "pull_up",
  currentLevelKey: "scapular_pulls",
  nextLevelKey: "negative_pull_ups",
  requiredPrerequisitesJson: { passive_hang: "30s_hold", scap_pull: "8_reps_strict" },
  minReadinessJson: { shoulder_pain: "none", grip_capacity: "moderate" },
  progressionRuleSummary:
    "Phase 1 internal progression: scapular pulls → negative pull-ups when 30s passive hang and 8 strict scap pulls are met.",
  cautionFlagsJson: ["conservative_when_shoulder_irritation"],
  confidenceWeight: 0.9,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { goal: ["pull_up", "vertical_pull_specialization"], phase: "phase_1" },
  doesNotApplyWhen: { shoulderPainActive: true },
  computationFriendlyRule: { progressionGate: { passive_hang_seconds: 30, scap_pull_reps: 8 } },
  userVisibleEvidenceLabel: "Pull-Up Pro Phase 1: scap pulls → negative pull-ups",
})

addProgression({
  n: 2,
  sourceId: "src_batch_01_pup_phase_1",
  sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
  skillKey: "pull_up",
  currentLevelKey: "negative_pull_ups",
  nextLevelKey: "full_pull_up",
  requiredPrerequisitesJson: { negative_pull_up: "5_reps_5_sec_descent" },
  minReadinessJson: { shoulder_pain: "none" },
  progressionRuleSummary: "Phase 1: progress from negatives to full pull-ups when 5 controlled 5-sec negatives can be performed.",
  cautionFlagsJson: null,
  confidenceWeight: 0.9,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { goal: ["pull_up"], phase: "phase_1" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { progressionGate: { negative_5sec_reps: 5 } },
  userVisibleEvidenceLabel: "Pull-Up Pro Phase 1: negatives → full pull-ups",
})

// PUP Phase 1 → Phase 2 transition
addProgression({
  n: 3,
  sourceId: "src_batch_01_pup_phase_2",
  sourceKey: "pull_up_pro_phase_2_uploaded_pdf_batch_01",
  skillKey: "one_arm_pull_up",
  currentLevelKey: "phase_1_complete",
  nextLevelKey: "assisted_one_arm_pull_up",
  requiredPrerequisitesJson: { full_pull_up_strict: "10_reps", weighted_pull_up: "+25%_bw_5_reps" },
  minReadinessJson: { shoulder_pain: "none", elbow_pain: "none" },
  progressionRuleSummary:
    "Enter Phase 2 (assisted one-arm) only after 10 strict pull-ups and weighted pull-ups at +25% BW for 5 reps. Two-arm vertical pull remains in support.",
  cautionFlagsJson: ["conservative", "long_rest_required"],
  confidenceWeight: 0.95,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goal: ["one_arm_pull_up"], currentPhaseComplete: "phase_1" },
  doesNotApplyWhen: { phase1Incomplete: true },
  computationFriendlyRule: {
    phase2EntryGate: { full_pull_up_strict_reps: 10, weighted_pull_up_pct_bw: 25, weighted_pull_up_reps: 5 },
  },
  userVisibleEvidenceLabel: "Phase 2 unlocked: assisted one-arm work begins",
  conflictGroup: "cg-pull-up-rep-rx",
})

// Phase 2 internal progression
addProgression({
  n: 4,
  sourceId: "src_batch_01_pup_phase_2",
  sourceKey: "pull_up_pro_phase_2_uploaded_pdf_batch_01",
  skillKey: "one_arm_pull_up",
  currentLevelKey: "assisted_one_arm_pull_up",
  nextLevelKey: "assisted_one_arm_pull_up_low_assist",
  requiredPrerequisitesJson: { assisted_one_arm: "3_reps_each_side" },
  minReadinessJson: { elbow_pain: "none" },
  progressionRuleSummary:
    "Within Phase 2, reduce assistance gradually. Move to lower-assistance band/finger only when 3 strict reps each side are achieved. Long rest (3–5 min) is required.",
  cautionFlagsJson: ["long_rest_required", "low_reps"],
  confidenceWeight: 0.9,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { goal: ["one_arm_pull_up"], phase: "phase_2" },
  doesNotApplyWhen: { elbowPainActive: true },
  computationFriendlyRule: { repsPerSide: 3, restMinutes: { min: 3, max: 5 }, assistanceReduction: "gradual" },
  userVisibleEvidenceLabel: "Phase 2: assisted one-arm progressing, long rest preserved",
})

// Phase 2 → Phase 3 transition
addProgression({
  n: 5,
  sourceId: "src_batch_01_pup_phase_3",
  sourceKey: "pull_up_pro_phase_3_uploaded_pdf_batch_01",
  skillKey: "one_arm_pull_up",
  currentLevelKey: "phase_2_complete",
  nextLevelKey: "eccentric_one_arm_pull_up",
  requiredPrerequisitesJson: { assisted_one_arm_low_assist: "3_reps_each_side", weighted_pull_up: "+50%_bw_3_reps" },
  minReadinessJson: { elbow_pain: "none", shoulder_pain: "none", recovery_capacity: "moderate_or_better" },
  progressionRuleSummary:
    "Enter Phase 3 (eccentric one-arm) only when low-assist Phase 2 work is solid AND weighted pull-ups at +50% BW for 3 reps. Eccentrics are higher-tax — long rest stays.",
  cautionFlagsJson: ["conservative", "long_rest_required", "elbow_load_high"],
  confidenceWeight: 0.95,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goal: ["one_arm_pull_up"], currentPhaseComplete: "phase_2" },
  doesNotApplyWhen: { elbowOrShoulderPainActive: true },
  computationFriendlyRule: {
    phase3EntryGate: { weighted_pull_up_pct_bw: 50, weighted_pull_up_reps: 3, low_assist_reps: 3 },
  },
  userVisibleEvidenceLabel: "Phase 3 unlocked: eccentric one-arm exposure begins",
  conflictGroup: "cg-pull-up-rep-rx",
})

// Front lever progression
addProgression({
  n: 6,
  sourceId: "src_batch_01_front_lever",
  sourceKey: "front_lever_uploaded_pdf_batch_01",
  skillKey: "front_lever",
  currentLevelKey: "tuck_fl",
  nextLevelKey: "advanced_tuck_fl",
  requiredPrerequisitesJson: { tuck_fl_hold: "10s_strict" },
  minReadinessJson: { shoulder_pain: "none", elbow_pain: "none" },
  progressionRuleSummary:
    "Front lever skill ladder: tuck FL → advanced tuck FL → straddle FL → full FL. Progress when current variation reaches 10s strict hold.",
  cautionFlagsJson: ["assisted_volume_via_band_acceptable"],
  confidenceWeight: 0.9,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { selectedSkills: ["front_lever"] },
  doesNotApplyWhen: { shoulderOrElbowPainActive: true },
  computationFriendlyRule: { holdTriggerSeconds: 10, ladder: ["tuck_fl", "advanced_tuck_fl", "straddle_fl", "full_fl"] },
  userVisibleEvidenceLabel: "Front lever ladder advances at 10s strict hold",
})

// Lower body B progression
addProgression({
  n: 7,
  sourceId: "src_batch_01_lower_body_b",
  sourceKey: "lower_body_b_uploaded_pdf_batch_01",
  skillKey: "pistol_squat",
  currentLevelKey: "assisted_pistol_squat",
  nextLevelKey: "step_up_pistol_squat",
  requiredPrerequisitesJson: { assisted_pistol: "8_reps_each_side", step_up: "10_reps_each_side_bodyweight" },
  minReadinessJson: { knee_pain: "none" },
  progressionRuleSummary: "Lower body B: assisted pistol → step-up pistol when 8 assisted reps + 10 BW step-ups each side.",
  cautionFlagsJson: null,
  confidenceWeight: 0.85,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { lowerBodyTrainingActive: true },
  doesNotApplyWhen: { kneePainActive: true },
  computationFriendlyRule: { progressionGate: { assisted_pistol_reps: 8, step_up_reps: 10 } },
  userVisibleEvidenceLabel: "Lower body B: pistol progression",
})

// =============================================================================
// EXERCISE SELECTION RULES
// =============================================================================

export const BATCH_01_EXERCISE_SELECTION_RULES: ExerciseSelectionRule[] = []

function addSelection(args: {
  n: number
  sourceId: string
  sourceKey: string
  goalKey: string | null
  skillKey: string | null
  exerciseKey: string
  roleKey: string | null
  levelScope: string[]
  equipmentRequirementsJson: Record<string, boolean> | null
  preferredWhenJson: Record<string, unknown> | null
  avoidWhenJson: Record<string, unknown> | null
  selectionWeight: number
  priorityType: Batch01PriorityType
  intelligenceTier: Batch01IntelligenceTier
  plainLanguageRule: string
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  conflictGroup?: string
}): void {
  const id = atomId("sel", args.n)
  BATCH_01_EXERCISE_SELECTION_RULES.push({
    id,
    sourceId: args.sourceId,
    goalKey: args.goalKey,
    skillKey: args.skillKey,
    exerciseKey: args.exerciseKey,
    roleKey: args.roleKey,
    levelScope: args.levelScope,
    equipmentRequirementsJson: args.equipmentRequirementsJson,
    preferredWhenJson: args.preferredWhenJson,
    avoidWhenJson: args.avoidWhenJson,
    selectionWeight: args.selectionWeight,
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.preferredWhenJson ?? {},
    doesNotApplyWhen: args.avoidWhenJson ?? {},
    plainLanguageRule: args.plainLanguageRule,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: null,
    conflictGroup: args.conflictGroup ?? null,
  })
}

// Forearm Health (4)
const FOREARM_VARIANTS: Array<{ key: string; label: string }> = [
  { key: "wrist_pronation", label: "Wrist pronation" },
  { key: "wrist_extension", label: "Wrist extension" },
  { key: "wrist_supination", label: "Wrist supination" },
  { key: "wrist_flexion", label: "Wrist flexion" },
]
FOREARM_VARIANTS.forEach((v, i) => {
  addSelection({
    n: i + 1,
    sourceId: "src_batch_01_forearm_health",
    sourceKey: "forearm_health_uploaded_pdf_batch_01",
    goalKey: null,
    skillKey: null,
    exerciseKey: v.key,
    roleKey: "prehab",
    levelScope: ["beginner", "novice", "intermediate", "advanced"],
    equipmentRequirementsJson: null,
    preferredWhenJson: { goalsIncludeAny: ["pulling", "rings", "lever", "planche", "grip", "front_lever"] },
    avoidWhenJson: { wristPainAcute: true },
    selectionWeight: 0.7,
    priorityType: "soft_preference",
    intelligenceTier: "cross_cutting",
    plainLanguageRule: `${v.label}: tendon support for grip and straight-arm stress. 2x15 reps, short rest, paired/circuit.`,
    computationFriendlyRule: { sets: 2, reps: 15, restSeconds: { min: 30, max: 60 }, lane: "prehab_or_accessory" },
    userVisibleEvidenceLabel: `Forearm prehab: ${v.label}`,
  })
})

// Front Lever (6)
const FL_EXERCISES: Array<{ key: string; label: string; role: string }> = [
  { key: "front_lever_hold", label: "Front lever hold (current progression)", role: "primary_skill" },
  { key: "front_lever_pull", label: "Front lever pull", role: "dynamic_strength" },
  { key: "front_lever_eccentric", label: "Front lever eccentric", role: "dynamic_strength" },
  { key: "band_front_lever_hold", label: "Band-assisted front lever hold", role: "assisted_volume" },
  { key: "dragon_flag", label: "Dragon flag", role: "carryover_anterior_chain" },
  { key: "front_lever_pulldown", label: "Front lever pulldown / horizontal scap pull", role: "carryover_scap_lat" },
]
FL_EXERCISES.forEach((ex, i) => {
  addSelection({
    n: 5 + i,
    sourceId: "src_batch_01_front_lever",
    sourceKey: "front_lever_uploaded_pdf_batch_01",
    goalKey: "front_lever",
    skillKey: "front_lever",
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["beginner", "novice", "intermediate", "advanced"],
    equipmentRequirementsJson: ex.key === "band_front_lever_hold" ? { bands: true } : { pull_up_bar: true },
    preferredWhenJson: { selectedSkills: ["front_lever"] },
    avoidWhenJson: { shoulderOrElbowPainActive: true },
    selectionWeight: ex.role === "primary_skill" ? 1.0 : ex.role === "dynamic_strength" ? 0.85 : 0.7,
    priorityType: ex.role === "primary_skill" ? "strong_preference" : "soft_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: role=${ex.role}.`,
    computationFriendlyRule: { role: ex.role },
    userVisibleEvidenceLabel: `Front lever — ${ex.label}`,
  })
})

// Pull-Up Pro Phase 1 supports (5)
const PUP1_SUPPORT: Array<{ key: string; label: string; role: string }> = [
  { key: "inverted_row", label: "Inverted row", role: "horizontal_pull_support" },
  { key: "passive_dead_hang", label: "Passive dead hang", role: "grip_scap_capacity" },
  { key: "scap_pull", label: "Scapular pull-up", role: "scap_capacity" },
  { key: "external_rotation_face_pull", label: "External rotation / face pull", role: "shoulder_balance" },
  { key: "biceps_curl", label: "Biceps curl", role: "accessory_support" },
]
PUP1_SUPPORT.forEach((ex, i) => {
  addSelection({
    n: 11 + i,
    sourceId: "src_batch_01_pup_phase_1",
    sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
    goalKey: "vertical_pull_specialization",
    skillKey: "pull_up",
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["beginner", "novice", "intermediate"],
    equipmentRequirementsJson: ex.key === "biceps_curl" ? { dumbbells: true } : { pull_up_bar: true },
    preferredWhenJson: { phase: "phase_1", goal: ["pull_up", "one_arm_pull_up"] },
    avoidWhenJson: null,
    selectionWeight: ex.role === "horizontal_pull_support" || ex.role === "grip_scap_capacity" ? 0.9 : 0.7,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: ${ex.role} for Phase 1 vertical pull foundation.`,
    computationFriendlyRule: { role: ex.role, phase: "phase_1" },
    userVisibleEvidenceLabel: `Pull-Up Pro Phase 1 support — ${ex.label}`,
  })
})

// Pull-Up Pro Phase 2 (3)
const PUP2_EX: Array<{ key: string; label: string; role: string }> = [
  { key: "assisted_one_arm_pull_up_band", label: "Band-assisted one-arm pull-up", role: "primary_advanced_pull" },
  { key: "assisted_one_arm_pull_up_finger", label: "Finger-assisted one-arm pull-up", role: "primary_advanced_pull" },
  { key: "two_arm_weighted_pull_up", label: "Two-arm weighted pull-up", role: "vertical_pull_strength_support" },
]
PUP2_EX.forEach((ex, i) => {
  addSelection({
    n: 16 + i,
    sourceId: "src_batch_01_pup_phase_2",
    sourceKey: "pull_up_pro_phase_2_uploaded_pdf_batch_01",
    goalKey: "one_arm_pull_up",
    skillKey: "one_arm_pull_up",
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["intermediate", "advanced"],
    equipmentRequirementsJson:
      ex.key === "assisted_one_arm_pull_up_band"
        ? { bands: true, pull_up_bar: true }
        : ex.key === "two_arm_weighted_pull_up"
          ? { pull_up_bar: true, weight_belt: true }
          : { pull_up_bar: true },
    preferredWhenJson: { phase: "phase_2", goal: ["one_arm_pull_up"] },
    avoidWhenJson: { phase1Incomplete: true, elbowPainActive: true },
    selectionWeight: ex.role === "primary_advanced_pull" ? 1.0 : 0.8,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: ${ex.role} for Phase 2 assisted one-arm transition.`,
    computationFriendlyRule: { role: ex.role, phase: "phase_2" },
    userVisibleEvidenceLabel: `Pull-Up Pro Phase 2 — ${ex.label}`,
  })
})

// Pull-Up Pro Phase 3 (3)
const PUP3_EX: Array<{ key: string; label: string; role: string }> = [
  { key: "one_arm_pull_up_eccentric", label: "One-arm pull-up eccentric", role: "primary_advanced_pull" },
  { key: "one_arm_inverted_row", label: "One-arm inverted row", role: "horizontal_pull_advanced" },
  { key: "one_arm_passive_hang", label: "One-arm passive hang", role: "grip_scap_advanced" },
]
PUP3_EX.forEach((ex, i) => {
  addSelection({
    n: 19 + i,
    sourceId: "src_batch_01_pup_phase_3",
    sourceKey: "pull_up_pro_phase_3_uploaded_pdf_batch_01",
    goalKey: "one_arm_pull_up",
    skillKey: "one_arm_pull_up",
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["advanced"],
    equipmentRequirementsJson: { pull_up_bar: true },
    preferredWhenJson: { phase: "phase_3", goal: ["one_arm_pull_up"], pullingBenchmarkAdvanced: true },
    avoidWhenJson: { phase2Incomplete: true, elbowPainActive: true, recoveryLow: true },
    selectionWeight: ex.role === "primary_advanced_pull" ? 1.0 : 0.85,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: ${ex.role} for Phase 3 eccentric/one-arm specialization.`,
    computationFriendlyRule: { role: ex.role, phase: "phase_3", longRestRequired: true },
    userVisibleEvidenceLabel: `Pull-Up Pro Phase 3 — ${ex.label}`,
  })
})

// Lower Body B (5)
const LBB_EX: Array<{ key: string; label: string; role: string }> = [
  { key: "step_up", label: "Step-up", role: "unilateral_squat_pattern" },
  { key: "hamstring_curl_bodyweight", label: "Bodyweight hamstring curl", role: "knee_flexion" },
  { key: "sissy_squat", label: "Sissy squat progression", role: "knee_extension_quad" },
  { key: "glute_bridge", label: "Glute bridge", role: "hip_extension_glute" },
  { key: "calf_raise", label: "Calf raise", role: "ankle_plantarflexion" },
]
LBB_EX.forEach((ex, i) => {
  addSelection({
    n: 22 + i,
    sourceId: "src_batch_01_lower_body_b",
    sourceKey: "lower_body_b_uploaded_pdf_batch_01",
    goalKey: null,
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["beginner", "novice", "intermediate", "advanced"],
    equipmentRequirementsJson: null,
    preferredWhenJson: { lowerBodyTrainingActive: true },
    avoidWhenJson: { kneePainActiveAndExerciseIs: ["sissy_squat", "step_up"] },
    selectionWeight: 0.7,
    priorityType: "soft_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: ${ex.role} pattern; level-based progression from assisted/basic to harder unilateral/eccentric.`,
    computationFriendlyRule: { role: ex.role, tempoMatters: true, scaleByAvailableDays: true },
    userVisibleEvidenceLabel: `Lower body B — ${ex.label}`,
  })
})

// Body By Rings (4)
const BBR_EX: Array<{ key: string; label: string; role: string }> = [
  { key: "ring_push_up", label: "Ring push-up", role: "horizontal_push_hypertrophy" },
  { key: "ring_row", label: "Ring row", role: "horizontal_pull_hypertrophy" },
  { key: "ring_dip", label: "Ring dip", role: "vertical_push_hypertrophy" },
  { key: "ring_chin_up", label: "Ring chin-up", role: "vertical_pull_hypertrophy" },
]
BBR_EX.forEach((ex, i) => {
  addSelection({
    n: 27 + i,
    sourceId: "src_batch_01_body_by_rings",
    sourceKey: "body_by_rings_uploaded_pdf_batch_01",
    goalKey: "hypertrophy",
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["beginner", "novice", "intermediate", "advanced"],
    equipmentRequirementsJson: { rings: true },
    preferredWhenJson: { equipmentIncludes: "rings", basicCompetencePresent: true },
    avoidWhenJson: { ringPrerequisitesMissing: true },
    selectionWeight: 0.85,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: ${ex.role} via ring height/body angle.`,
    computationFriendlyRule: { role: ex.role, progressionLever: "ring_height_or_body_angle" },
    userVisibleEvidenceLabel: `Rings — ${ex.label}`,
  })
})

// Hybrid PPL (2)
const PPL_EX: Array<{ key: string; label: string; role: string }> = [
  { key: "weighted_pull_up", label: "Weighted pull-up", role: "primary_compound_pull" },
  { key: "weighted_dip", label: "Weighted dip", role: "primary_compound_push" },
]
PPL_EX.forEach((ex, i) => {
  addSelection({
    n: 31 + i,
    sourceId: "src_batch_01_hybrid_ppl",
    sourceKey: "hybrid_ppl_uploaded_pdf_batch_01",
    goalKey: "hybrid",
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["intermediate", "advanced"],
    equipmentRequirementsJson: { pull_up_bar: true, weight_belt: true },
    preferredWhenJson: { templateStyle: "ppl_hybrid", availableSessionsPerWeek: { gte: 5 } },
    avoidWhenJson: { primaryGoalIsSkillSpecialization: true },
    selectionWeight: 0.85,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: heavy compound for hybrid PPL hypertrophy/strength support.`,
    computationFriendlyRule: { role: ex.role, repRange: { min: 6, max: 8 }, restMinutes: { min: 3, max: 4 } },
    userVisibleEvidenceLabel: `Hybrid PPL — ${ex.label} (heavy compound)`,
  })
})

// Hybrid PPL — additional compounds (2 more, to meet ≥8 minimum)
const PPL_EX_EXTRA: Array<{ key: string; label: string; role: string }> = [
  { key: "barbell_squat", label: "Barbell back squat", role: "primary_compound_squat" },
  { key: "barbell_bench_press", label: "Barbell bench press", role: "primary_compound_push" },
]
PPL_EX_EXTRA.forEach((ex, i) => {
  addSelection({
    n: 33 + i,
    sourceId: "src_batch_01_hybrid_ppl",
    sourceKey: "hybrid_ppl_uploaded_pdf_batch_01",
    goalKey: "hybrid",
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["intermediate", "advanced"],
    equipmentRequirementsJson: { barbell: true, rack: true },
    preferredWhenJson: { templateStyle: "ppl_hybrid", availableSessionsPerWeek: { gte: 5 } },
    avoidWhenJson: { primaryGoalIsSkillSpecialization: true },
    selectionWeight: 0.85,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: heavy compound for hybrid PPL hypertrophy/strength support.`,
    computationFriendlyRule: { role: ex.role, repRange: { min: 6, max: 8 }, restMinutes: { min: 3, max: 4 } },
    userVisibleEvidenceLabel: `Hybrid PPL — ${ex.label} (heavy compound)`,
  })
})

// Cardio (2)
const CARDIO_EX: Array<{ key: string; label: string; role: string }> = [
  { key: "hiit_intervals", label: "HIIT intervals", role: "conditioning_high_intensity" },
  { key: "liss_steady_state", label: "LISS steady state", role: "conditioning_low_intensity" },
]
CARDIO_EX.forEach((ex, i) => {
  addSelection({
    n: 35 + i,
    sourceId: "src_batch_01_cardio_guide",
    sourceKey: "cardio_guide_uploaded_pdf_batch_01",
    goalKey: null,
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["beginner", "novice", "intermediate", "advanced"],
    equipmentRequirementsJson: null,
    preferredWhenJson:
      ex.key === "hiit_intervals"
        ? { primaryGoal: ["fat_loss", "general_conditioning"], recoveryGood: true, weekDensityLow: true }
        : { recoveryOrLoadCompromised: true },
    avoidWhenJson:
      ex.key === "hiit_intervals"
        ? { weekDensityHigh: true, lowerBodyFatigueHigh: true, injuryRiskHigh: true, primaryGoalIsStrengthOrSkill: true }
        : { sessionTimeBudgetVeryLow: true },
    selectionWeight: ex.key === "liss_steady_state" ? 0.8 : 0.5,
    priorityType: "soft_preference",
    intelligenceTier: "cross_cutting",
    plainLanguageRule: `${ex.label}: ${ex.role}.`,
    computationFriendlyRule:
      ex.key === "hiit_intervals"
        ? { eligibility: "restricted_when_recovery_or_load_compromised" }
        : { durationMinutes: { min: 30, max: 60 }, eligibility: "preferred_under_compromise" },
    userVisibleEvidenceLabel: ex.key === "hiit_intervals" ? "Cardio: HIIT intervals (gated)" : "Cardio: LISS steady state",
    conflictGroup: "cg-cardio-method-selection",
  })
})

// =============================================================================
// CONTRAINDICATION RULES
// =============================================================================

export const BATCH_01_CONTRAINDICATION_RULES: ContraindicationRule[] = []

function addContra(args: {
  n: number
  sourceId: string
  sourceKey: string
  exerciseKey: string
  blockedJointJson: string[] | null
  blockedContextJson: Record<string, boolean> | null
  modificationGuidance: string
  severity: "warning" | "caution" | "blocked"
  priorityType: Batch01PriorityType
  intelligenceTier: Batch01IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
}): void {
  const id = atomId("ctr", args.n)
  BATCH_01_CONTRAINDICATION_RULES.push({
    id,
    sourceId: args.sourceId,
    exerciseKey: args.exerciseKey,
    blockedJointJson: args.blockedJointJson,
    blockedContextJson: args.blockedContextJson,
    modificationGuidance: args.modificationGuidance,
    severity: args.severity,
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.appliesWhen,
    doesNotApplyWhen: args.doesNotApplyWhen,
    plainLanguageRule: args.modificationGuidance,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: null,
    conflictGroup: null,
  })
}

addContra({
  n: 1,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  exerciseKey: "advanced_ring_instability",
  blockedJointJson: ["shoulder", "elbow"],
  blockedContextJson: { ringPrerequisitesMissing: true },
  modificationGuidance:
    "Regress advanced ring instability work to a stable or assisted ring variation when basic push-up/pull-up/dip competence is not yet present.",
  severity: "blocked",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { equipmentIncludes: "rings", ringPrerequisitesMissing: true },
  doesNotApplyWhen: { ringPrerequisitesMet: true },
  computationFriendlyRule: { regressTo: "stable_or_assisted_ring_variation" },
  userVisibleEvidenceLabel: "Ring variation regressed for stability foundation",
})

addContra({
  n: 2,
  sourceId: "src_batch_01_pup_phase_2",
  sourceKey: "pull_up_pro_phase_2_uploaded_pdf_batch_01",
  exerciseKey: "assisted_one_arm_pull_up_band",
  blockedJointJson: ["elbow", "shoulder"],
  blockedContextJson: { phase1Incomplete: true },
  modificationGuidance:
    "Block assisted one-arm work when Phase 1 (10 strict pull-ups, +25% BW weighted x5) is not yet met. Regress to two-arm vertical pull + rows + hangs.",
  severity: "blocked",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goal: ["one_arm_pull_up"], phase1Incomplete: true },
  doesNotApplyWhen: { phase1Complete: true },
  computationFriendlyRule: { regressTo: "phase_1_two_arm_pull_plus_rows_plus_hangs" },
  userVisibleEvidenceLabel: "One-arm work blocked — Phase 1 base required",
})

addContra({
  n: 3,
  sourceId: "src_batch_01_pup_phase_3",
  sourceKey: "pull_up_pro_phase_3_uploaded_pdf_batch_01",
  exerciseKey: "one_arm_pull_up_eccentric",
  blockedJointJson: ["elbow", "shoulder"],
  blockedContextJson: { phase2Incomplete: true, recoveryLow: true },
  modificationGuidance:
    "Block eccentric one-arm work when Phase 2 (low-assist + +50% BW weighted x3) is not yet met or recovery is low. Regress to assisted one-arm.",
  severity: "blocked",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goal: ["one_arm_pull_up"], phase2Incomplete: true },
  doesNotApplyWhen: { phase2Complete: true, recoveryGood: true },
  computationFriendlyRule: { regressTo: "phase_2_assisted_one_arm" },
  userVisibleEvidenceLabel: "Eccentric one-arm work blocked — Phase 2 base required",
})

addContra({
  n: 4,
  sourceId: "src_batch_01_cardio_guide",
  sourceKey: "cardio_guide_uploaded_pdf_batch_01",
  exerciseKey: "hiit_intervals",
  blockedJointJson: null,
  blockedContextJson: { weekDensityHigh: true, lowerBodyFatigueHigh: true, primaryGoalIsStrengthOrSkill: true },
  modificationGuidance:
    "Restrict HIIT intervals when the strength/skill week is dense, lower-body fatigue is high, or recovery is compromised. Replace with LISS or omit conditioning.",
  severity: "caution",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { weekDensityHigh: true, primaryGoalIsStrengthOrSkill: true },
  doesNotApplyWhen: { primaryGoal: ["fat_loss"], recoveryGood: true, weekDensityLow: true },
  computationFriendlyRule: { fallbackTo: "liss_or_omit" },
  userVisibleEvidenceLabel: "HIIT limited due to recovery cost",
})

addContra({
  n: 5,
  sourceId: "src_batch_01_lower_body_b",
  sourceKey: "lower_body_b_uploaded_pdf_batch_01",
  exerciseKey: "heavy_lower_body_block",
  blockedJointJson: null,
  blockedContextJson: { primaryGoalIsUpperBodySkill: true, weekDensityHigh: true },
  modificationGuidance:
    "Avoid stacking a heavy lower-body block in a week where the primary goal is upper-body skill and density is already high. Reduce volume or shift to support-only patterns.",
  severity: "warning",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { primaryGoalIsUpperBodySkill: true, weekDensityHigh: true },
  doesNotApplyWhen: { primaryGoalIsLowerBody: true },
  computationFriendlyRule: { reduceLowerBodyVolumeWhen: "upper_body_skill_dense_week" },
  userVisibleEvidenceLabel: "Lower-body volume reduced to protect upper-body skill recovery",
})

// =============================================================================
// METHOD RULES
// =============================================================================

export const BATCH_01_METHOD_RULES: MethodRule[] = []

function addMethod(args: {
  n: number
  sourceId: string
  sourceKey: string
  methodKey: string
  category: string
  compatibleGoalsJson: string[] | null
  compatibleLevelsJson: string[] | null
  bestUseCasesJson: string[] | null
  avoidUseCasesJson: string[] | null
  structureBiasJson: Record<string, unknown> | null
  priorityType: Batch01PriorityType
  intelligenceTier: Batch01IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  plainLanguageRule: string
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  conflictGroup?: string
}): void {
  const id = atomId("mth", args.n)
  BATCH_01_METHOD_RULES.push({
    id,
    sourceId: args.sourceId,
    methodKey: args.methodKey,
    category: args.category,
    compatibleGoalsJson: args.compatibleGoalsJson,
    compatibleLevelsJson: args.compatibleLevelsJson,
    bestUseCasesJson: args.bestUseCasesJson,
    avoidUseCasesJson: args.avoidUseCasesJson,
    structureBiasJson: args.structureBiasJson,
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.appliesWhen,
    doesNotApplyWhen: args.doesNotApplyWhen,
    plainLanguageRule: args.plainLanguageRule,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: null,
    conflictGroup: args.conflictGroup ?? null,
  })
}

addMethod({
  n: 1,
  sourceId: "src_batch_01_cardio_guide",
  sourceKey: "cardio_guide_uploaded_pdf_batch_01",
  methodKey: "hiit",
  category: "conditioning",
  compatibleGoalsJson: ["fat_loss", "general_conditioning"],
  compatibleLevelsJson: ["intermediate", "advanced"],
  bestUseCasesJson: ["fat_loss", "time_constrained_conditioning_when_recovery_good"],
  avoidUseCasesJson: ["dense_strength_week", "skill_priority_week", "recovery_compromised", "high_lower_body_fatigue"],
  structureBiasJson: { intervalRatio: "near_max_to_easy", placement: "off_day_or_finisher_when_eligible" },
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { cardioRequested: true, primaryGoalAllowsHIIT: true, weekDensityLow: true },
  doesNotApplyWhen: { weekDensityHigh: true, recoveryLow: true },
  plainLanguageRule: "HIIT is time-efficient and stimulates conditioning, but recovery-taxing and higher injury risk.",
  computationFriendlyRule: { eligibility: "gated_by_recovery_and_load" },
  userVisibleEvidenceLabel: "HIIT enabled (recovery and load permit)",
  conflictGroup: "cg-cardio-method-selection",
})

addMethod({
  n: 2,
  sourceId: "src_batch_01_cardio_guide",
  sourceKey: "cardio_guide_uploaded_pdf_batch_01",
  methodKey: "liss",
  category: "conditioning",
  compatibleGoalsJson: ["recovery", "fat_loss", "general_conditioning", "hybrid"],
  compatibleLevelsJson: ["beginner", "novice", "intermediate", "advanced"],
  bestUseCasesJson: ["recovery_compromised_week", "high_strength_load_week", "post_session_decompression"],
  avoidUseCasesJson: ["session_time_budget_very_low"],
  structureBiasJson: { steady_state_minutes: { min: 30, max: 60 } },
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { cardioRequested: true },
  doesNotApplyWhen: {},
  plainLanguageRule: "LISS is lower-impact and less systemically taxing. Prefer when recovery or load is compromised.",
  computationFriendlyRule: { defaultCardioWhen: "recovery_or_load_compromised" },
  userVisibleEvidenceLabel: "LISS preferred — lower recovery cost",
  conflictGroup: "cg-cardio-method-selection",
})

addMethod({
  n: 3,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  methodKey: "straight_sets",
  category: "set_structure",
  compatibleGoalsJson: ["calisthenics_skill", "calisthenics_strength", "hypertrophy", "front_lever", "planche", "muscle_up"],
  compatibleLevelsJson: ["beginner", "novice", "intermediate", "advanced"],
  bestUseCasesJson: ["primary_skill_block", "primary_strength_block"],
  avoidUseCasesJson: ["pure_density_finisher_block"],
  structureBiasJson: { preferredFor: ["primary_skill", "primary_strength"] },
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { sessionBlockType: ["primary_skill", "primary_strength"] },
  doesNotApplyWhen: { sessionBlockType: ["finisher_density"] },
  plainLanguageRule: "Straight sets preferred for skill quality and primary strength expression.",
  computationFriendlyRule: { straightSetsPreferred: true },
  userVisibleEvidenceLabel: "Straight sets used for skill quality",
})

addMethod({
  n: 4,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  methodKey: "density",
  category: "set_structure",
  compatibleGoalsJson: ["hypertrophy", "general_conditioning"],
  compatibleLevelsJson: ["intermediate", "advanced"],
  bestUseCasesJson: ["accessory_finisher", "time_compressed_hypertrophy"],
  avoidUseCasesJson: ["primary_skill_block", "primary_strength_block"],
  structureBiasJson: { densityAllowed: false, densityAllowedForAccessory: true },
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { sessionBlockType: ["accessory_finisher"] },
  doesNotApplyWhen: { sessionBlockType: ["primary_skill", "primary_strength"] },
  plainLanguageRule: "Density work limited for skill/strength preservation; allowed for accessory finisher only.",
  computationFriendlyRule: { densityAllowed: false, densityAllowedForAccessory: true },
  userVisibleEvidenceLabel: "Density limited for skill/strength preservation",
})

addMethod({
  n: 5,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  methodKey: "superset",
  category: "set_structure",
  compatibleGoalsJson: ["hypertrophy", "hybrid"],
  compatibleLevelsJson: ["intermediate", "advanced"],
  bestUseCasesJson: ["antagonist_pairing_accessory", "prehab_with_accessory"],
  avoidUseCasesJson: ["primary_skill_block", "heavy_primary_compound_block"],
  structureBiasJson: { supersetsAllowedForAccessoryAndPrehab: true },
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { sessionBlockType: ["accessory", "prehab"] },
  doesNotApplyWhen: { sessionBlockType: ["primary_skill", "primary_strength"] },
  plainLanguageRule: "Supersets preferred for accessory/prehab pairing, not primary skill/strength.",
  computationFriendlyRule: { supersetsAllowed: true, supersetsForAccessoryOnly: true },
  userVisibleEvidenceLabel: "Supersets used for accessory pairing only",
})

addMethod({
  n: 6,
  sourceId: "src_batch_01_pup_phase_3",
  sourceKey: "pull_up_pro_phase_3_uploaded_pdf_batch_01",
  methodKey: "eccentric",
  category: "tempo_method",
  compatibleGoalsJson: ["one_arm_pull_up", "vertical_pull_specialization"],
  compatibleLevelsJson: ["advanced"],
  bestUseCasesJson: ["one_arm_pull_specialization_phase_3"],
  avoidUseCasesJson: ["phase_2_or_earlier", "elbow_pain_active", "recovery_low"],
  structureBiasJson: { tempo: "5_to_8_sec_descent", longRestRequired: true },
  priorityType: "hard_constraint",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { goal: ["one_arm_pull_up"], phase: "phase_3" },
  doesNotApplyWhen: { phase: ["phase_1", "phase_2"], elbowPainActive: true },
  plainLanguageRule: "Eccentric method is Phase 3 primary advanced exposure with long rest.",
  computationFriendlyRule: { tempo: { descentSeconds: { min: 5, max: 8 } }, restMinutes: { min: 3, max: 5 } },
  userVisibleEvidenceLabel: "Eccentric method gated to Phase 3 with long rest",
})

// =============================================================================
// PRESCRIPTION RULES
// =============================================================================

export const BATCH_01_PRESCRIPTION_RULES: PrescriptionRule[] = []

function addRx(args: {
  n: number
  sourceId: string
  sourceKey: string
  levelScope: string[] | null
  goalScope: string[] | null
  exerciseRoleScope: string[] | null
  repRangeJson: Record<string, unknown> | null
  setRangeJson: Record<string, unknown> | null
  holdRangeJson: Record<string, unknown> | null
  restRangeJson: Record<string, unknown> | null
  rpeGuidanceJson: Record<string, unknown> | null
  progressionGuidance: string
  priorityType: Batch01PriorityType
  intelligenceTier: Batch01IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  conflictGroup?: string
}): void {
  const id = atomId("rx", args.n)
  BATCH_01_PRESCRIPTION_RULES.push({
    id,
    sourceId: args.sourceId,
    levelScope: args.levelScope,
    goalScope: args.goalScope,
    exerciseRoleScope: args.exerciseRoleScope,
    repRangeJson: args.repRangeJson,
    setRangeJson: args.setRangeJson,
    holdRangeJson: args.holdRangeJson,
    restRangeJson: args.restRangeJson,
    rpeGuidanceJson: args.rpeGuidanceJson,
    progressionGuidance: args.progressionGuidance,
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.appliesWhen,
    doesNotApplyWhen: args.doesNotApplyWhen,
    plainLanguageRule: args.progressionGuidance,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: null,
    conflictGroup: args.conflictGroup ?? null,
  })
}

// Hybrid PPL — heavy compound (primary)
addRx({
  n: 1,
  sourceId: "src_batch_01_hybrid_ppl",
  sourceKey: "hybrid_ppl_uploaded_pdf_batch_01",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["hybrid", "hypertrophy"],
  exerciseRoleScope: ["primary_compound", "primary_compound_pull", "primary_compound_push"],
  repRangeJson: { min: 6, max: 8 },
  setRangeJson: { min: 3, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 3, maxMinutes: 4 },
  rpeGuidanceJson: { rpe: { min: 7, max: 9 } },
  progressionGuidance:
    "Hybrid PPL heavy compounds: 3–4 sets x 6–8 reps, 3–4 min rest. Week progression by adding sets/reps while preserving exercise identity.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { templateStyle: "ppl_hybrid", role: "primary_compound" },
  doesNotApplyWhen: { primaryGoalIsSkillSpecialization: true },
  computationFriendlyRule: {
    role: "primary_compound",
    sets: { min: 3, max: 4 },
    reps: { min: 6, max: 8 },
    restMinutes: { min: 3, max: 4 },
  },
  userVisibleEvidenceLabel: "Hybrid PPL primary compound: 3–4 x 6–8 @ 3–4 min rest",
  conflictGroup: "cg-weighted-strength-vol",
})

// Hybrid PPL — accessory
addRx({
  n: 2,
  sourceId: "src_batch_01_hybrid_ppl",
  sourceKey: "hybrid_ppl_uploaded_pdf_batch_01",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["hybrid", "hypertrophy"],
  exerciseRoleScope: ["accessory", "isolation"],
  repRangeJson: { min: 8, max: 20 },
  setRangeJson: { min: 3, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 1, maxMinutes: 2 },
  rpeGuidanceJson: { rpe: { min: 7, max: 9 } },
  progressionGuidance:
    "Hybrid PPL accessories: 3–4 sets x 8–20 reps, 1–2 min rest. Higher reps for hypertrophy emphasis.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { templateStyle: "ppl_hybrid", role: "accessory" },
  doesNotApplyWhen: {},
  computationFriendlyRule: {
    role: "accessory",
    sets: { min: 3, max: 4 },
    reps: { min: 8, max: 20 },
    restMinutes: { min: 1, max: 2 },
  },
  userVisibleEvidenceLabel: "Hybrid PPL accessory: 3–4 x 8–20 @ 1–2 min rest",
})

// Hybrid PPL — week progression
addRx({
  n: 3,
  sourceId: "src_batch_01_hybrid_ppl",
  sourceKey: "hybrid_ppl_uploaded_pdf_batch_01",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["hybrid", "hypertrophy"],
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance: "Add sets or reps across weeks while preserving exercise identity. Do not silently swap exercises.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { templateStyle: "ppl_hybrid", weekIndex: { gte: 1 } },
  doesNotApplyWhen: { weekIsDeload: true },
  computationFriendlyRule: { weekProgression: "add_sets_or_reps_preserve_exercise_identity" },
  userVisibleEvidenceLabel: "Week progression: add sets/reps, preserve exercise identity",
})

// Forearm prehab
addRx({
  n: 4,
  sourceId: "src_batch_01_forearm_health",
  sourceKey: "forearm_health_uploaded_pdf_batch_01",
  levelScope: null,
  goalScope: null,
  exerciseRoleScope: ["prehab"],
  repRangeJson: { exact: 15 },
  setRangeJson: { exact: 2 },
  holdRangeJson: null,
  restRangeJson: { minSeconds: 30, maxSeconds: 60 },
  rpeGuidanceJson: { rpe: { min: 5, max: 7 } },
  progressionGuidance: "Forearm prehab: 2 sets x 15 reps, 30–60s rest. Pair with primary work as prehab.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { role: "prehab", goalsIncludeAny: ["pulling", "rings", "lever", "planche", "grip"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sets: 2, reps: 15, restSeconds: { min: 30, max: 60 } },
  userVisibleEvidenceLabel: "Forearm prehab: 2 x 15 @ 30–60s rest",
})

// Pull-Up Pro Phase 1 prescription
addRx({
  n: 5,
  sourceId: "src_batch_01_pup_phase_1",
  sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
  levelScope: ["beginner", "novice", "intermediate"],
  goalScope: ["pull_up", "vertical_pull_specialization"],
  exerciseRoleScope: ["primary_skill", "vertical_pull_strength"],
  repRangeJson: { min: 5, max: 8 },
  setRangeJson: { min: 3, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 2, maxMinutes: 3 },
  rpeGuidanceJson: { rpe: { min: 7, max: 8 } },
  progressionGuidance:
    "Phase 1 vertical pull: 3–4 sets x 5–8 strict reps, 2–3 min rest. Two pull exposures per week.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { phase: "phase_1", goal: ["pull_up"] },
  doesNotApplyWhen: { phase: ["phase_2", "phase_3"] },
  computationFriendlyRule: {
    sets: { min: 3, max: 4 },
    reps: { min: 5, max: 8 },
    restMinutes: { min: 2, max: 3 },
    weeklyExposures: 2,
  },
  userVisibleEvidenceLabel: "Pull-Up Pro Phase 1: 3–4 x 5–8 @ 2–3 min rest, 2x/week",
})

// PUP Phase 2 — assisted one-arm
addRx({
  n: 6,
  sourceId: "src_batch_01_pup_phase_2",
  sourceKey: "pull_up_pro_phase_2_uploaded_pdf_batch_01",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["one_arm_pull_up"],
  exerciseRoleScope: ["primary_advanced_pull"],
  repRangeJson: { min: 2, max: 4 },
  setRangeJson: { min: 3, max: 5 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 3, maxMinutes: 5 },
  rpeGuidanceJson: { rpe: { min: 7, max: 8 } },
  progressionGuidance: "Phase 2 assisted one-arm: 3–5 sets x 2–4 reps each side, 3–5 min rest. Long rest is required.",
  priorityType: "hard_constraint",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { phase: "phase_2", goal: ["one_arm_pull_up"] },
  doesNotApplyWhen: { phase: ["phase_1"] },
  computationFriendlyRule: { sets: { min: 3, max: 5 }, repsPerSide: { min: 2, max: 4 }, restMinutes: { min: 3, max: 5 } },
  userVisibleEvidenceLabel: "Phase 2 assisted one-arm: 3–5 x 2–4/side @ 3–5 min rest",
  conflictGroup: "cg-pull-up-rep-rx",
})

// PUP Phase 2 — two-arm support
addRx({
  n: 7,
  sourceId: "src_batch_01_pup_phase_2",
  sourceKey: "pull_up_pro_phase_2_uploaded_pdf_batch_01",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["one_arm_pull_up"],
  exerciseRoleScope: ["vertical_pull_strength_support"],
  repRangeJson: { min: 5, max: 8 },
  setRangeJson: { min: 3, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 2, maxMinutes: 3 },
  rpeGuidanceJson: { rpe: { min: 7, max: 8 } },
  progressionGuidance: "Phase 2 two-arm vertical pull support: 3–4 sets x 5–8 reps, 2–3 min rest.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { phase: "phase_2", role: "vertical_pull_strength_support" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sets: { min: 3, max: 4 }, reps: { min: 5, max: 8 }, restMinutes: { min: 2, max: 3 } },
  userVisibleEvidenceLabel: "Phase 2 two-arm support: 3–4 x 5–8 @ 2–3 min rest",
})

// PUP Phase 3 — eccentric
addRx({
  n: 8,
  sourceId: "src_batch_01_pup_phase_3",
  sourceKey: "pull_up_pro_phase_3_uploaded_pdf_batch_01",
  levelScope: ["advanced"],
  goalScope: ["one_arm_pull_up"],
  exerciseRoleScope: ["primary_advanced_pull"],
  repRangeJson: { min: 1, max: 3 },
  setRangeJson: { min: 3, max: 5 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 3, maxMinutes: 5 },
  rpeGuidanceJson: { rpe: { min: 8, max: 9 } },
  progressionGuidance: "Phase 3 eccentric one-arm: 3–5 sets x 1–3 reps each side, 3–5 min rest, 5–8s descent.",
  priorityType: "hard_constraint",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { phase: "phase_3", goal: ["one_arm_pull_up"] },
  doesNotApplyWhen: { phase: ["phase_1", "phase_2"] },
  computationFriendlyRule: {
    sets: { min: 3, max: 5 },
    repsPerSide: { min: 1, max: 3 },
    restMinutes: { min: 3, max: 5 },
    descentSeconds: { min: 5, max: 8 },
  },
  userVisibleEvidenceLabel: "Phase 3 eccentric one-arm: 3–5 x 1–3/side @ 3–5 min rest, 5–8s descent",
  conflictGroup: "cg-pull-up-rep-rx",
})

// PUP Phase 3 — frequency rise
addRx({
  n: 9,
  sourceId: "src_batch_01_pup_phase_3",
  sourceKey: "pull_up_pro_phase_3_uploaded_pdf_batch_01",
  levelScope: ["advanced"],
  goalScope: ["one_arm_pull_up"],
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance: "Phase 3 frequency can rise to 3 pull exposures per week when recovery permits.",
  priorityType: "soft_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { phase: "phase_3", recoveryGood: true },
  doesNotApplyWhen: { recoveryLow: true },
  computationFriendlyRule: { weeklyExposures: { max: 3, default: 2 } },
  userVisibleEvidenceLabel: "Phase 3 frequency: up to 3 pull exposures/week",
})

// Front Lever — direct hold
addRx({
  n: 10,
  sourceId: "src_batch_01_front_lever",
  sourceKey: "front_lever_uploaded_pdf_batch_01",
  levelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: ["front_lever"],
  exerciseRoleScope: ["primary_skill"],
  repRangeJson: null,
  setRangeJson: { min: 3, max: 5 },
  holdRangeJson: { minSeconds: 5, maxSeconds: 15 },
  restRangeJson: { minMinutes: 2, maxMinutes: 3 },
  rpeGuidanceJson: { rpe: { min: 7, max: 8 } },
  progressionGuidance: "Front lever direct hold: 3–5 sets x 5–15s hold, 2–3 min rest. Skill quality first.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { selectedSkills: ["front_lever"], role: "primary_skill" },
  doesNotApplyWhen: { shoulderOrElbowPainActive: true },
  computationFriendlyRule: { sets: { min: 3, max: 5 }, holdSeconds: { min: 5, max: 15 }, restMinutes: { min: 2, max: 3 } },
  userVisibleEvidenceLabel: "Front lever hold: 3–5 x 5–15s @ 2–3 min rest",
  conflictGroup: "cg-front-lever-vol",
})

// Front Lever — pull/eccentric
addRx({
  n: 11,
  sourceId: "src_batch_01_front_lever",
  sourceKey: "front_lever_uploaded_pdf_batch_01",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["front_lever"],
  exerciseRoleScope: ["dynamic_strength"],
  repRangeJson: { min: 3, max: 6 },
  setRangeJson: { min: 3, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 2, maxMinutes: 3 },
  rpeGuidanceJson: { rpe: { min: 7, max: 8 } },
  progressionGuidance: "Front lever pulls/eccentrics: 3–4 sets x 3–6 reps, 2–3 min rest.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { selectedSkills: ["front_lever"], role: "dynamic_strength" },
  doesNotApplyWhen: { shoulderOrElbowPainActive: true },
  computationFriendlyRule: { sets: { min: 3, max: 4 }, reps: { min: 3, max: 6 }, restMinutes: { min: 2, max: 3 } },
  userVisibleEvidenceLabel: "Front lever pull/eccentric: 3–4 x 3–6 @ 2–3 min rest",
})

// Lower Body B prescription
addRx({
  n: 12,
  sourceId: "src_batch_01_lower_body_b",
  sourceKey: "lower_body_b_uploaded_pdf_batch_01",
  levelScope: null,
  goalScope: null,
  exerciseRoleScope: ["unilateral_squat_pattern", "knee_extension_quad", "knee_flexion", "hip_extension_glute", "ankle_plantarflexion"],
  repRangeJson: { min: 8, max: 15 },
  setRangeJson: { min: 3, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 1, maxMinutes: 2 },
  rpeGuidanceJson: { rpe: { min: 7, max: 8 } },
  progressionGuidance:
    "Lower Body B: 3–4 sets x 8–15 reps, 1–2 min rest. Tempo matters; level-based progression from assisted to unilateral/eccentric.",
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { lowerBodyTrainingActive: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sets: { min: 3, max: 4 }, reps: { min: 8, max: 15 }, restMinutes: { min: 1, max: 2 } },
  userVisibleEvidenceLabel: "Lower Body B: 3–4 x 8–15 @ 1–2 min rest",
})

// =============================================================================
// CARRYOVER RULES
// =============================================================================

export const BATCH_01_CARRYOVER_RULES: CarryoverRule[] = []

function addCarryover(args: {
  n: number
  sourceId: string
  sourceKey: string
  sourceExerciseOrSkillKey: string
  targetSkillKey: string
  carryoverType: "direct" | "indirect" | "prerequisite" | "accessory"
  carryoverStrength: number
  rationale: string
  priorityType: Batch01PriorityType
  intelligenceTier: Batch01IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
}): void {
  const id = atomId("car", args.n)
  BATCH_01_CARRYOVER_RULES.push({
    id,
    sourceId: args.sourceId,
    sourceExerciseOrSkillKey: args.sourceExerciseOrSkillKey,
    targetSkillKey: args.targetSkillKey,
    carryoverType: args.carryoverType,
    carryoverStrength: args.carryoverStrength,
    rationale: args.rationale,
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.appliesWhen,
    doesNotApplyWhen: args.doesNotApplyWhen,
    plainLanguageRule: args.rationale,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: null,
    conflictGroup: null,
  })
}

addCarryover({
  n: 1,
  sourceId: "src_batch_01_front_lever",
  sourceKey: "front_lever_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "dragon_flag",
  targetSkillKey: "front_lever",
  carryoverType: "indirect",
  carryoverStrength: 0.7,
  rationale: "Dragon flag supports anterior chain compression and shoulder bracing relevant to front lever.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkills: ["front_lever"] },
  doesNotApplyWhen: { lowerBackPainActive: true },
  computationFriendlyRule: { carryoverType: "indirect", strength: 0.7 },
  userVisibleEvidenceLabel: "Carryover: dragon flag → front lever (anterior chain)",
})

addCarryover({
  n: 2,
  sourceId: "src_batch_01_front_lever",
  sourceKey: "front_lever_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "front_lever_pulldown",
  targetSkillKey: "front_lever",
  carryoverType: "direct",
  carryoverStrength: 0.8,
  rationale: "Horizontal scap pull / FL pulldown directly trains scap-lat capacity used in the FL hold.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkills: ["front_lever"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "direct", strength: 0.8 },
  userVisibleEvidenceLabel: "Carryover: scap pull / FL pulldown → front lever",
})

addCarryover({
  n: 3,
  sourceId: "src_batch_01_front_lever",
  sourceKey: "front_lever_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "band_front_lever_hold",
  targetSkillKey: "front_lever",
  carryoverType: "direct",
  carryoverStrength: 0.85,
  rationale: "Band-assisted FL hold provides position practice and assisted volume relevant to direct FL.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkills: ["front_lever"], equipmentIncludes: "bands" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "direct", strength: 0.85 },
  userVisibleEvidenceLabel: "Carryover: band FL hold → front lever",
})

addCarryover({
  n: 4,
  sourceId: "src_batch_01_pup_phase_1",
  sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "inverted_row",
  targetSkillKey: "pull_up",
  carryoverType: "accessory",
  carryoverStrength: 0.7,
  rationale: "Inverted row builds horizontal pulling capacity that supports vertical pulling strength.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goal: ["pull_up", "vertical_pull_specialization"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "accessory", strength: 0.7 },
  userVisibleEvidenceLabel: "Carryover: rows → pull-up",
})

addCarryover({
  n: 5,
  sourceId: "src_batch_01_pup_phase_1",
  sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "passive_dead_hang",
  targetSkillKey: "pull_up",
  carryoverType: "prerequisite",
  carryoverStrength: 0.8,
  rationale: "Passive dead hang builds grip and scapular capacity required for pulling.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goal: ["pull_up", "one_arm_pull_up"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "prerequisite", strength: 0.8 },
  userVisibleEvidenceLabel: "Carryover: hangs → pull-up (prerequisite)",
})

addCarryover({
  n: 6,
  sourceId: "src_batch_01_pup_phase_1",
  sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "external_rotation_face_pull",
  targetSkillKey: "pull_up",
  carryoverType: "indirect",
  carryoverStrength: 0.5,
  rationale: "External rotation / face pull balances shoulder for pulling volume.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goal: ["pull_up", "one_arm_pull_up"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "indirect", strength: 0.5 },
  userVisibleEvidenceLabel: "Carryover: external rotation → shoulder balance for pulling",
})

addCarryover({
  n: 7,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "ring_chin_up",
  targetSkillKey: "muscle_up",
  carryoverType: "prerequisite",
  carryoverStrength: 0.7,
  rationale: "Ring chin-up builds vertical pulling competence required for muscle-up transition.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkills: ["muscle_up"], equipmentIncludes: "rings" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "prerequisite", strength: 0.7 },
  userVisibleEvidenceLabel: "Carryover: ring chin-up → muscle-up (prerequisite)",
})

addCarryover({
  n: 8,
  sourceId: "src_batch_01_body_by_rings",
  sourceKey: "body_by_rings_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "ring_dip",
  targetSkillKey: "muscle_up",
  carryoverType: "prerequisite",
  carryoverStrength: 0.7,
  rationale: "Ring dip builds vertical pushing competence required for muscle-up lockout.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkills: ["muscle_up"], equipmentIncludes: "rings" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "prerequisite", strength: 0.7 },
  userVisibleEvidenceLabel: "Carryover: ring dip → muscle-up (prerequisite)",
})

addCarryover({
  n: 9,
  sourceId: "src_batch_01_lower_body_b",
  sourceKey: "lower_body_b_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "step_up",
  targetSkillKey: "pistol_squat",
  carryoverType: "prerequisite",
  carryoverStrength: 0.7,
  rationale: "Step-up builds unilateral leg strength required for pistol squat progression.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkills: ["pistol_squat"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "prerequisite", strength: 0.7 },
  userVisibleEvidenceLabel: "Carryover: step-up → pistol squat (prerequisite)",
})

addCarryover({
  n: 10,
  sourceId: "src_batch_01_pup_phase_1",
  sourceKey: "pull_up_pro_phase_1_uploaded_pdf_batch_01",
  sourceExerciseOrSkillKey: "pull_up",
  targetSkillKey: "one_arm_pull_up",
  carryoverType: "prerequisite",
  carryoverStrength: 0.95,
  rationale: "Two-arm pull-up at strict 10 reps + weighted +25% BW x 5 is the prerequisite for assisted one-arm work.",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkills: ["one_arm_pull_up"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "prerequisite", strength: 0.95, gateReps: 10, gateWeightedPctBw: 25 },
  userVisibleEvidenceLabel: "Carryover: two-arm pull-up → one-arm pull-up (prerequisite gate)",
})

// =============================================================================
// PUBLIC ACCESSORS — same shape as DB accessors, used by runtime contract
// =============================================================================

export function getBatch01Sources(): DoctrineSource[] {
  return BATCH_01_SOURCES
}

export function getBatch01Principles(): DoctrinePrinciple[] {
  return BATCH_01_PRINCIPLES
}

export function getBatch01ProgressionRules(): ProgressionRule[] {
  return BATCH_01_PROGRESSION_RULES
}

export function getBatch01ExerciseSelectionRules(): ExerciseSelectionRule[] {
  return BATCH_01_EXERCISE_SELECTION_RULES
}

export function getBatch01ContraindicationRules(): ContraindicationRule[] {
  return BATCH_01_CONTRAINDICATION_RULES
}

export function getBatch01MethodRules(): MethodRule[] {
  return BATCH_01_METHOD_RULES
}

export function getBatch01PrescriptionRules(): PrescriptionRule[] {
  return BATCH_01_PRESCRIPTION_RULES
}

export function getBatch01CarryoverRules(): CarryoverRule[] {
  return BATCH_01_CARRYOVER_RULES
}

export function getBatch01ProvenanceFor(atomId: string): Batch01Provenance | null {
  return PROVENANCE[atomId] ?? null
}

/**
 * Counts by table — used by the runtime contract logger and by the parity validator.
 */
export interface Batch01Counts {
  sources: number
  principles: number
  progressionRules: number
  exerciseSelectionRules: number
  contraindicationRules: number
  methodRules: number
  prescriptionRules: number
  carryoverRules: number
  totalAtoms: number
}

export function getBatch01Counts(): Batch01Counts {
  const principles = BATCH_01_PRINCIPLES.length
  const progression = BATCH_01_PROGRESSION_RULES.length
  const selection = BATCH_01_EXERCISE_SELECTION_RULES.length
  const contraindication = BATCH_01_CONTRAINDICATION_RULES.length
  const method = BATCH_01_METHOD_RULES.length
  const prescription = BATCH_01_PRESCRIPTION_RULES.length
  const carryover = BATCH_01_CARRYOVER_RULES.length
  return {
    sources: BATCH_01_SOURCES.length,
    principles,
    progressionRules: progression,
    exerciseSelectionRules: selection,
    contraindicationRules: contraindication,
    methodRules: method,
    prescriptionRules: prescription,
    carryoverRules: carryover,
    totalAtoms: principles + progression + selection + contraindication + method + prescription + carryover,
  }
}

/**
 * Counts atoms grouped by sourceKey via provenance index. Used by the parity
 * validator to enforce per-source minimums declared in the prompt.
 */
export function getBatch01CountsBySource(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const id of Object.keys(PROVENANCE)) {
    const sk = PROVENANCE[id].sourceKey
    out[sk] = (out[sk] ?? 0) + 1
  }
  return out
}
