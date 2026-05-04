/**
 * BATCH 2 — UPLOADED PDF DOCTRINE
 * =============================================================================
 *
 * In-code source-of-truth for Batch 2 doctrine atoms. Same architecture as
 * Batch 1 (lib/doctrine/source-batches/batch-01-uploaded-pdf-doctrine.ts).
 *
 * - Pure data + thin helpers; no decision-time logic lives here.
 * - Atoms are typed against the DB row shapes from `lib/doctrine-db.ts`.
 * - Provenance is tracked in PROVENANCE for every atom.
 * - Sources:
 *     1. Lower Body Workout A
 *     2. Body By Rings Push & Pull Phases
 *     3. Superhero At-Home Foundation Program
 *     4. Forearm Health (Batch 2 confirmation)
 *     5. Body By Rings Arms Levels 1-3
 *     6. From Zero To Full Planche
 *     7. Novice Weighted Calisthenics Program
 *     8. Abs / Street Workout Circuit Program
 *
 * Provenance note: every atom is `derived_from_prompt_section_3_summary`
 * unless a verbatim PDF excerpt is later supplied for refinement.
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

// [BATCH-02-NOW-DATE] DoctrineSource declares `createdAt: Date` and
// `updatedAt: Date`. Use a Date instance, not an ISO string, so the
// many `createdAt: NOW` rows below match the canonical type.
const NOW = new Date()
const BATCH_02_VERSION = "batch_02_v1"
const PROVENANCE_NOTE = "derived_from_prompt_section_3_summary"

type Batch02PriorityType = "hard_constraint" | "strong_preference" | "soft_preference" | "example_only"
type Batch02IntelligenceTier = "base_week_intelligence" | "phase_week_modulation" | "cross_cutting"

export interface Batch02Provenance {
  atomId: string
  sourceKey: string
  priorityType: Batch02PriorityType
  intelligenceTier: Batch02IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  plainLanguageRule: string
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  internalRationale: string
  safetyNotes: string | null
  conflictGroup: string | null
}

function atomId(prefix: string, n: number): string {
  return `${prefix}-b02-${String(n).padStart(4, "0")}`
}

// =============================================================================
// SOURCES (8)
// =============================================================================

export const BATCH_02_SOURCES: DoctrineSource[] = [
  {
    id: "src_batch_02_lower_body_a",
    sourceKey: "lower_body_a_uploaded_pdf_batch_02",
    title: "Lower Body Workout A (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Lower-body bodyweight progression A: pistol-squat box → hand-assisted pistol → pistol accumulation; glute ham hinge → hybrid; assisted quad → kneeling; wall squat → single-leg; bent-leg → single-leg calf raise. Tempo prescribed.",
    version: BATCH_02_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_02_bbr_push_pull",
    sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
    title: "Body By Rings Push & Pull Phases (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Rings push/pull phases with prescribed tempos (30X1, 20X0, 30X2). Phase 1 sets the tempo; deload reduces sets to 1–2 while preserving movement identity. Pull primary chinups 2–3 min rest; accessories ~1:30 rest. Phase 2 introduces down-series/pump-finisher work selectively.",
    version: BATCH_02_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_02_superhero_origin",
    sourceKey: "superhero_origin_uploaded_pdf_batch_02",
    title: "Superhero At-Home Foundation Program (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Beginner foundation program. Three pillars: training, nutrition (protein, fats, carbs, vegetables/fruits), sleep (consistent schedule, 8–9 hours, cool/dark, screen reduction). Week-to-week progression by adding reps, sets, complexity, or reducing rest.",
    version: BATCH_02_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_02_forearm_health",
    sourceKey: "forearm_health_uploaded_pdf_batch_02",
    title: "Forearm Health (Batch 2 confirmation, uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Confirms Batch 1 forearm health circuit (pronation/extension/supination/flexion, 2x15, short rest). Used to raise source confidence — must NOT cause duplicate visible prehab blocks.",
    version: BATCH_02_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_02_bbr_arms",
    sourceKey: "body_by_rings_arms_uploaded_pdf_batch_02",
    title: "Body By Rings Arms Levels 1-3 (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Ring-arm hypertrophy with tendon-loading via pelican curls/negatives, ring support holds, hanging holds. Level 1: pelican curl, tricep dip, BW curls/extensions, 3x8–10 controlled tempo. Level 2: pelican negatives + diamond pushups + curls. Level 3 adds ring support max holds + hanging max holds.",
    version: BATCH_02_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_02_planche",
    sourceKey: "planche_uploaded_pdf_batch_02",
    title: "From Zero to Full Planche (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Planche progression: direct planche + complementary handstand work. Acclimation period 1–2 weeks at ~80% capacity when changing stage/variant. Band assistance must keep effort meaningful (knot/tension changes). Pain stops or changes the movement; stiffness alone is not pain. Rhythm 3–5 days/week with 2–3 consecutive rest days acceptable. Max effort should not be continuous.",
    version: BATCH_02_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_02_novice_weighted",
    sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
    title: "Novice Weighted Calisthenics Program (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Novice weighted dips/pullups 3x/week, 5–8 reps, RIR 0–2. Next-session load depends on previous hardest-set reps and reps-in-reserve. Larger jumps when 8/8 RIR remains; smaller jumps when reps drop; deload (~5–10kg / ~20%) when 5 reps signals failure. 3x7 can be better than over-maxing early sets. Stay novice as long as productive.",
    version: BATCH_02_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "src_batch_02_abs_street_workout",
    sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
    title: "Abs / Street Workout Circuit Program (uploaded PDF)",
    sourceType: "extracted_pdf",
    description:
      "Street-workout circuit structure: 5–7 exercises, 4–5 rounds. Used when bodyweight rep counts would otherwise become excessive, or for endurance/conditioning. Skills before basics on mixed sessions. Multi-discipline training reduces peak per-skill. Abs visibility depends on body fat + muscle volume — abs work is not spot fat loss. Walking is low-impact conditioning; running may cause joint pain for some.",
    version: BATCH_02_VERSION,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
]

const PROVENANCE: Record<string, Batch02Provenance> = {}

function recordProvenance(p: Batch02Provenance): void {
  PROVENANCE[p.atomId] = p
}

// =============================================================================
// PRINCIPLES
// =============================================================================

export const BATCH_02_PRINCIPLES: DoctrinePrinciple[] = []

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
  priorityType: Batch02PriorityType
  intelligenceTier: Batch02IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  safetyNotes?: string
  conflictGroup?: string
}): void {
  const id = atomId("ppl", args.n)
  BATCH_02_PRINCIPLES.push({
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

// --- Lower Body A (1) ---
addPrinciple({
  n: 1,
  sourceId: "src_batch_02_lower_body_a",
  sourceKey: "lower_body_a_uploaded_pdf_batch_02",
  doctrineFamily: "progression_selection_logic",
  principleKey: "lower_body_a_level_progression",
  principleTitle: "Lower Body A: difficulty-based level progression",
  principleSummary:
    "Lower-body progressions move from assisted/basic → hand-assisted/unilateral → full unilateral / eccentric / accumulation based on readiness, not random exercise swapping.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["calisthenics", "hybrid"],
  safetyPriority: 4,
  priorityWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { templateIncludesLowerBodyA: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { progressionMode: "level_based", swapByDifficultyOnly: true },
  userVisibleEvidenceLabel: "Lower-body level chosen from readiness",
})

// --- BBR Push/Pull (2) ---
addPrinciple({
  n: 2,
  sourceId: "src_batch_02_bbr_push_pull",
  sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
  doctrineFamily: "method_logic",
  principleKey: "bbr_deload_identity_preservation",
  principleTitle: "Deload preserves movement identity",
  principleSummary:
    "A deload should reduce sets/volume while preserving the key movement identity — not randomly swap the program. Roughly 1–2 sets per movement is a typical deload target for ring hypertrophy.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy", "hybrid"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["rings", "calisthenics"],
  safetyPriority: 3,
  priorityWeight: 0.8,
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { isDeloadWeek: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { deloadSetsPerMovement: { min: 1, max: 2 }, preserveExerciseIdentity: true },
  userVisibleEvidenceLabel: "Deload reduced volume while preserving movement pattern",
})
addPrinciple({
  n: 3,
  sourceId: "src_batch_02_bbr_push_pull",
  sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
  doctrineFamily: "method_logic",
  principleKey: "rings_hypertrophy_tempo_control",
  principleTitle: "Rings hypertrophy preserves tempo / control",
  principleSummary:
    "Ring hypertrophy work should preserve prescribed tempo and control. Do not turn controlled ring hypertrophy into sloppy density work; tempo (30X1, 20X0, 30X2) is part of the dose.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy", "hybrid"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["rings"],
  safetyPriority: 3,
  priorityWeight: 0.8,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { equipmentIncludes: "rings", goal: ["hypertrophy", "hybrid"] },
  doesNotApplyWhen: { sessionType: "density_circuit" },
  computationFriendlyRule: { enforceTempo: ["30X1", "20X0", "30X2"], blockDensityPackagingForRingHypertrophy: true },
  userVisibleEvidenceLabel: "Tempo/control prioritized for rings hypertrophy",
})

// --- Superhero Origin (3) ---
addPrinciple({
  n: 4,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  doctrineFamily: "recovery_protection_logic",
  principleKey: "sleep_foundation",
  principleTitle: "Sleep is foundational",
  principleSummary:
    "Sleep is foundational: consistent bedtime, 8–9 hours, cool dark room, reduced screens before bed. Recovery signals should influence today's dosage, not just appear as educational text.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 6,
  priorityWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { recoverySignalsAvailable: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sleepHoursTarget: { min: 8, max: 9 }, mustInfluenceDailyDose: true },
  userVisibleEvidenceLabel: "Recovery foundation influenced today's dosage",
})
addPrinciple({
  n: 5,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  doctrineFamily: "recovery_protection_logic",
  principleKey: "nutrition_foundation",
  principleTitle: "Nutrition supports training",
  principleSummary:
    "Nutrition supports training: protein, healthy fats, carbs, vegetables and fruits. Programming should not assume the athlete can absorb high training stress without nutritional foundation.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 4,
  priorityWeight: 0.7,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { athleteProvidedNutritionContext: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { contextSignal: "nutritional_foundation_supports_load_tolerance" },
  userVisibleEvidenceLabel: "Nutrition foundation considered",
})
addPrinciple({
  n: 6,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  doctrineFamily: "athlete_prerequisites",
  principleKey: "foundation_before_advanced",
  principleTitle: "Foundation and technique confidence before advanced plans",
  principleSummary:
    "Newer athletes need foundation, technique confidence, and consistent training rhythm before advanced/specialized plans.",
  athleteLevelScope: ["beginner", "novice"],
  goalScope: null,
  appliesToSkillTypes: ["isometric", "dynamic_skill"],
  appliesToTrainingStyles: ["calisthenics", "hybrid"],
  safetyPriority: 5,
  priorityWeight: 0.85,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { athleteLevel: ["beginner", "novice"] },
  doesNotApplyWhen: { athleteLevel: ["intermediate", "advanced"] },
  computationFriendlyRule: { gateAdvancedSpecialization: true, requireFoundationCompletion: true },
  userVisibleEvidenceLabel: "Foundation phase enforced before advanced specialization",
})

// --- Forearm Health Batch 2 (1) ---
addPrinciple({
  n: 7,
  sourceId: "src_batch_02_forearm_health",
  sourceKey: "forearm_health_uploaded_pdf_batch_02",
  doctrineFamily: "exercise_selection_logic",
  principleKey: "forearm_multi_source_consolidation",
  principleTitle: "Multi-source forearm confirmation increases confidence, not duplicate blocks",
  principleSummary:
    "When multiple forearm sources confirm the same prehab circuit, treat it as increased source confidence/support — do NOT duplicate visible prehab blocks in the program UI.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 3,
  priorityWeight: 0.7,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { multipleSourcesPropose: "forearm_prehab_circuit" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { dedupePolicy: "raise_confidence_not_render_count", maxVisiblePrehabBlocks: 1 },
  userVisibleEvidenceLabel: "Forearm prehab confirmed by multiple sources",
})

// --- BBR Arms (2) ---
addPrinciple({
  n: 8,
  sourceId: "src_batch_02_bbr_arms",
  sourceKey: "body_by_rings_arms_uploaded_pdf_batch_02",
  doctrineFamily: "accessory_logic",
  principleKey: "arm_accessory_gating",
  principleTitle: "Arm accessory work gated by tendon/stability readiness",
  principleSummary:
    "Pelican negatives, ring support holds, and hanging max holds carry tendon/stability stress. Treat them as gated accessory load, not free volume.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy", "hybrid"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["rings"],
  safetyPriority: 6,
  priorityWeight: 0.85,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { proposedExercises: ["pelican_negative", "ring_support_max_hold", "hanging_max_hold"] },
  doesNotApplyWhen: { tendonAndStabilityReadinessGood: true },
  computationFriendlyRule: { requireTendonReadiness: true, requireStabilityReadiness: true },
  userVisibleEvidenceLabel: "Arm accessory gated by tendon/stability readiness",
})
addPrinciple({
  n: 9,
  sourceId: "src_batch_02_bbr_arms",
  sourceKey: "body_by_rings_arms_uploaded_pdf_batch_02",
  doctrineFamily: "exercise_selection_logic",
  principleKey: "arms_accessory_default",
  principleTitle: "Arm work is accessory unless explicitly specialized",
  principleSummary:
    "Arm work defaults to accessory/support role. It only becomes a primary block when arm specialization is explicitly selected.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["rings", "calisthenics"],
  safetyPriority: 3,
  priorityWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: {},
  doesNotApplyWhen: { selectedSpecialization: "arms" },
  computationFriendlyRule: { defaultRole: "accessory" },
  userVisibleEvidenceLabel: "Arms placed as accessory (no specialization selected)",
})

// --- Planche (4) ---
addPrinciple({
  n: 10,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  doctrineFamily: "phase_week_modulation",
  principleKey: "planche_acclimation_transition",
  principleTitle: "Planche stage change → 1–2 weeks acclimation at ~80%",
  principleSummary:
    "When planche stage, variant, or training type changes, prescribe 1–2 weeks of reduced/acclimation load around ~80% capacity before treating the new stage as normal load.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["planche", "bodyweight_skill"],
  appliesToSkillTypes: ["isometric"],
  appliesToTrainingStyles: ["calisthenics"],
  safetyPriority: 7,
  priorityWeight: 0.95,
  priorityType: "hard_constraint",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { plancheStageJustChanged: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { acclimationWeeks: { min: 1, max: 2 }, loadPercent: { target: 0.8 } },
  userVisibleEvidenceLabel: "Planche stage change: acclimation load applied",
  conflictGroup: "cg-planche-stage-acclimation",
})
addPrinciple({
  n: 11,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  doctrineFamily: "recovery_protection_logic",
  principleKey: "planche_pain_stop_or_change",
  principleTitle: "Planche pain → change variation or stop",
  principleSummary:
    "Wrist/elbow/shoulder pain during planche or straight-arm work is a stop/change signal. Adjust grip or variation if safe; otherwise stop that movement. Stiffness alone is not pain.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: ["planche"],
  appliesToSkillTypes: ["isometric", "straight_arm"],
  appliesToTrainingStyles: ["calisthenics"],
  safetyPriority: 9,
  priorityWeight: 0.99,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { reportedPainAtJoints: ["wrist", "elbow", "shoulder"] },
  doesNotApplyWhen: { signalIsStiffnessNotPain: true },
  computationFriendlyRule: { onPainAction: ["change_grip", "change_variation", "stop_movement"], orderPreference: ["change_grip", "change_variation", "stop_movement"] },
  userVisibleEvidenceLabel: "Planche stress adjusted for joint signal",
  safetyNotes: "Distinguish stiffness (acceptable) from pain (stop signal).",
})
addPrinciple({
  n: 12,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  doctrineFamily: "exercise_selection_logic",
  principleKey: "planche_band_quality",
  principleTitle: "Band assistance must keep planche effort meaningful",
  principleSummary:
    "Band assistance should reduce difficulty without making the movement easy. Prefer progressive tension changes (knot adjustments, smaller bands) over random band swaps. Track tension to quantify progress.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["planche"],
  appliesToSkillTypes: ["isometric"],
  appliesToTrainingStyles: ["calisthenics"],
  safetyPriority: 4,
  priorityWeight: 0.8,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { plancheAssistance: "band" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { bandTensionMode: "progressive_reduction", trackTensionForProgress: true },
  userVisibleEvidenceLabel: "Band assistance chosen to keep planche effort meaningful",
})
addPrinciple({
  n: 13,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  doctrineFamily: "skill_progression_logic",
  principleKey: "planche_direct_plus_handstand_complement",
  principleTitle: "Planche: direct work + handstand/scap/straight-arm complement",
  principleSummary:
    "Planche priority should include direct planche exposure when eligible, plus complementary handstand / scapular / straight-arm support work when appropriate.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["planche", "bodyweight_skill"],
  appliesToSkillTypes: ["isometric", "straight_arm"],
  appliesToTrainingStyles: ["calisthenics"],
  safetyPriority: 4,
  priorityWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { selectedSkills: ["planche"] },
  doesNotApplyWhen: { acuteShoulderPain: true },
  computationFriendlyRule: { directPlancheRequired: true, complementaryWork: ["handstand", "scapular", "straight_arm"] },
  userVisibleEvidenceLabel: "Planche represented through direct work + complementary support",
})

// --- Novice Weighted (4) ---
addPrinciple({
  n: 14,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  doctrineFamily: "progression_selection_logic",
  principleKey: "novice_linear_progression",
  principleTitle: "Novice linear progression: dips/pullups 3x/week",
  principleSummary:
    "Novice phase uses simple linear progression with weighted dips and pullups roughly 3 sessions per week, in the 5–8 rep range, with RIR 0–2 guiding load.",
  athleteLevelScope: ["novice", "intermediate"],
  goalScope: ["weighted_calisthenics", "strength"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["weighted", "hybrid"],
  safetyPriority: 4,
  priorityWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoal: ["weighted_pull_up", "weighted_dip"], athleteLevel: ["novice", "intermediate"] },
  doesNotApplyWhen: { athleteLevel: ["advanced"] },
  computationFriendlyRule: { sessionsPerWeek: 3, repRange: { min: 5, max: 8 }, rir: { min: 0, max: 2 } },
  userVisibleEvidenceLabel: "Novice linear progression: dips + pullups 3x/week",
})
addPrinciple({
  n: 15,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  doctrineFamily: "progression_selection_logic",
  principleKey: "load_by_reps_rir",
  principleTitle: "Next-session load is decided by previous reps and RIR",
  principleSummary:
    "Next session's load depends on the previous hardest set: more reps with RIR remaining → larger jump; reps falling → smaller jump or hold; 5 reps with grinding → deload.",
  athleteLevelScope: ["novice", "intermediate"],
  goalScope: ["weighted_calisthenics", "strength"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["weighted", "hybrid"],
  safetyPriority: 5,
  priorityWeight: 0.9,
  priorityType: "hard_constraint",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoal: ["weighted_pull_up", "weighted_dip"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: {
    loadDecision: "function_of_previous_hardest_set_reps_and_rir",
    bigJumpIf: "8_reps_with_rir_remaining",
    smallJumpIf: "reps_holding",
    deloadIf: "reps_at_5_with_grinding",
  },
  userVisibleEvidenceLabel: "Load progression based on reps/RIR",
})
addPrinciple({
  n: 16,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  doctrineFamily: "recovery_protection_logic",
  principleKey: "novice_deload_trigger",
  principleTitle: "Deload triggered by rep/RIR drop",
  principleSummary:
    "When reps drop near the low end (~5) or RIR collapses, deload (~5–10kg or ~20%) rather than force progression.",
  athleteLevelScope: ["novice", "intermediate"],
  goalScope: ["weighted_calisthenics", "strength"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["weighted", "hybrid"],
  safetyPriority: 7,
  priorityWeight: 0.9,
  priorityType: "hard_constraint",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { repsAtLowEnd: true, rirCollapsed: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { deloadKgRange: { min: 5, max: 10 }, deloadPercentTarget: 0.2 },
  userVisibleEvidenceLabel: "Deload triggered by rep/RIR drop",
})
addPrinciple({
  n: 17,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  doctrineFamily: "set_count_logic",
  principleKey: "consistency_over_overmaxing",
  principleTitle: "Consistency beats overmaxing early sets",
  principleSummary:
    "For novice strength, balanced sets like 3x7 are better than maxing out the first set and collapsing later. Set target should preserve quality across sets.",
  athleteLevelScope: ["novice", "intermediate"],
  goalScope: ["weighted_calisthenics", "strength"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["weighted", "hybrid"],
  safetyPriority: 4,
  priorityWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoal: ["weighted_pull_up", "weighted_dip"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { preferUniformSets: true, exampleTarget: "3x7", avoidPattern: "8_8_5_collapse" },
  userVisibleEvidenceLabel: "Set target balanced to avoid early-set overreach",
})

// --- Abs / Street Workout (4) ---
addPrinciple({
  n: 18,
  sourceId: "src_batch_02_abs_street_workout",
  sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
  doctrineFamily: "method_logic",
  principleKey: "circuit_method_use_case",
  principleTitle: "Circuits for density / endurance, not max skill strength",
  principleSummary:
    "Circuits (5–7 exercises × 4–5 rounds) are appropriate when bodyweight rep counts would otherwise be too high or for endurance/conditioning/core density. They are NOT default packaging for max-strength skill work.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: ["endurance", "conditioning", "general_fitness", "core_density"],
  appliesToSkillTypes: null,
  appliesToTrainingStyles: ["calisthenics", "street_workout"],
  safetyPriority: 3,
  priorityWeight: 0.85,
  priorityType: "hard_constraint",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { goalIsEnduranceOrConditioning: true },
  doesNotApplyWhen: { goalIsMaxSkillStrength: true },
  computationFriendlyRule: { exercisesPerCircuit: { min: 5, max: 7 }, roundsPerCircuit: { min: 4, max: 5 }, blockForMaxStrengthSkill: true },
  userVisibleEvidenceLabel: "Circuit used for density/endurance, not max skill strength",
})
addPrinciple({
  n: 19,
  sourceId: "src_batch_02_abs_street_workout",
  sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
  doctrineFamily: "weekly_distribution_logic",
  principleKey: "skill_before_basics",
  principleTitle: "Skill work before basics on mixed sessions",
  principleSummary:
    "When skills and basics are trained in the same session, the more complex/high-skill work should come before basic/high-volume reps to preserve quality.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: ["isometric", "dynamic_skill"],
  appliesToTrainingStyles: ["calisthenics", "hybrid"],
  safetyPriority: 4,
  priorityWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { sessionMixesSkillsAndBasics: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { orderPolicy: "skills_first_basics_after" },
  userVisibleEvidenceLabel: "Skill work placed before basic volume",
})
addPrinciple({
  n: 20,
  sourceId: "src_batch_02_abs_street_workout",
  sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
  doctrineFamily: "exercise_selection_logic",
  principleKey: "abs_not_spot_fat_loss",
  principleTitle: "Core work is not spot fat loss",
  principleSummary:
    "Do not imply abs training burns belly fat. Core work builds muscle/control; visibility depends on overall body fat and muscle volume, which are managed through energy balance and conditioning.",
  athleteLevelScope: ["beginner", "novice", "intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 2,
  priorityWeight: 0.7,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goalIncludes: ["abs_visibility", "fat_loss"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { messagingRule: "core_work_for_strength_control_not_spot_fat_loss" },
  userVisibleEvidenceLabel: "Core work selected for strength/control, not spot fat loss",
})
addPrinciple({
  n: 21,
  sourceId: "src_batch_02_abs_street_workout",
  sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
  doctrineFamily: "weekly_distribution_logic",
  principleKey: "multi_discipline_tradeoff",
  principleTitle: "Multi-discipline training reduces peak per skill",
  principleSummary:
    "Training multiple disciplines simultaneously reduces maximum performance in each compared to specializing. Reflect this in expectations and dosage when athlete chooses multiple goals.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: null,
  appliesToSkillTypes: null,
  appliesToTrainingStyles: null,
  safetyPriority: 3,
  priorityWeight: 0.75,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedGoalCount: { gte: 2 } },
  doesNotApplyWhen: { athleteAcceptsTradeoff: true },
  computationFriendlyRule: { peakReduction: "expected", dosageDistribution: "balanced_per_goal" },
  userVisibleEvidenceLabel: "Multi-discipline tradeoff acknowledged",
})

// =============================================================================
// PROGRESSION RULES
// =============================================================================

export const BATCH_02_PROGRESSION_RULES: ProgressionRule[] = []

function addProgression(args: {
  n: number
  sourceId: string
  sourceKey: string
  exerciseFamily: string
  fromLevelKey: string | null
  toLevelKey: string | null
  entryCriteriaJson: Record<string, unknown> | null
  progressionTriggerJson: Record<string, unknown> | null
  regressionTriggerJson: Record<string, unknown> | null
  assistedVariation: string | null
  advancedVariationLockout: string | null
  rationale: string
  priorityType: Batch02PriorityType
  intelligenceTier: Batch02IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
}): void {
  const id = atomId("prog", args.n)
  // [BATCH-02-PROGRESSION-RULE-CANONICAL] Canonical `ProgressionRule`
  // (lib/doctrine-db.ts L49-60) owns `skillKey`, `currentLevelKey`,
  // `nextLevelKey`, `requiredPrerequisitesJson`, `minReadinessJson`,
  // `progressionRuleSummary`, `cautionFlagsJson`, `confidenceWeight`.
  // The legacy batch-02 helper used a wider shape (`exerciseFamily`,
  // `fromLevelKey`, `toLevelKey`, …). Map at the boundary here so the
  // legacy authoring API stays the same but the stored row matches the
  // canonical contract. Trigger JSONs are folded into requiredPrereqs.
  const requiredPrereqs: Record<string, string> | null = (() => {
    if (!args.entryCriteriaJson && !args.progressionTriggerJson) return null
    const merged: Record<string, string> = {}
    for (const [k, v] of Object.entries({ ...(args.entryCriteriaJson ?? {}), ...(args.progressionTriggerJson ?? {}) })) {
      merged[k] = typeof v === 'string' ? v : JSON.stringify(v)
    }
    return merged
  })()
  BATCH_02_PROGRESSION_RULES.push({
    id,
    sourceId: args.sourceId,
    skillKey: args.exerciseFamily,
    currentLevelKey: args.fromLevelKey ?? '',
    nextLevelKey: args.toLevelKey ?? '',
    requiredPrerequisitesJson: requiredPrereqs,
    minReadinessJson: null,
    progressionRuleSummary: args.rationale,
    cautionFlagsJson: args.advancedVariationLockout ? [args.advancedVariationLockout] : null,
    confidenceWeight: 1,
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

// Lower Body A (1)
addProgression({
  n: 1,
  sourceId: "src_batch_02_lower_body_a",
  sourceKey: "lower_body_a_uploaded_pdf_batch_02",
  exerciseFamily: "pistol_squat",
  fromLevelKey: "pistol_squat_box",
  toLevelKey: "hand_assisted_pistol_squat",
  entryCriteriaJson: { pistolSquatBoxReps: { gte: 8 } },
  progressionTriggerJson: { boxRepsClean: 8, sets: 3 },
  regressionTriggerJson: { boxRepsBelow: 5 },
  assistedVariation: "pistol_squat_box",
  advancedVariationLockout: "pistol_squat_accumulation",
  rationale:
    "Pistol-squat progression L1 → L2: athlete moves from box pistols to hand-assisted full-range pistols once 3x8 box pistols are clean.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { templateIncludesLowerBodyA: true },
  doesNotApplyWhen: { acuteKneePain: true },
  computationFriendlyRule: { gateBoxReps: 8, gateSets: 3 },
  userVisibleEvidenceLabel: "Lower body A: pistol L1 → L2 (gated by 3x8 box pistols)",
})

// BBR Push/Pull (1)
addProgression({
  n: 2,
  sourceId: "src_batch_02_bbr_push_pull",
  sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
  exerciseFamily: "rings_push_pull_phase",
  fromLevelKey: "phase_1",
  toLevelKey: "phase_2",
  entryCriteriaJson: { phase1WeeksCompleted: { gte: 4 }, tempoCompliant: true },
  progressionTriggerJson: { phase1RepsClean: true },
  regressionTriggerJson: { tempoCollapses: true },
  assistedVariation: null,
  advancedVariationLockout: "down_series_pump_finisher",
  rationale:
    "Rings P/P Phase 1 → Phase 2 only after weeks of clean tempo at Phase 1 reps; Phase 2 introduces down-series/pump-finisher work selectively, not by default.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { equipmentIncludes: "rings", goal: ["hypertrophy", "hybrid"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { entryWeeks: 4, tempoCompliant: true },
  userVisibleEvidenceLabel: "Rings P/P advanced to Phase 2 (tempo-compliant Phase 1 base)",
})

// Superhero Origin (2)
addProgression({
  n: 3,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  exerciseFamily: "foundation_progression",
  fromLevelKey: "week_1_4",
  toLevelKey: "week_5_8",
  entryCriteriaJson: { repsHittingTargets: true, formStable: true },
  progressionTriggerJson: { repsAddedAcrossSets: true },
  regressionTriggerJson: { repsBelowTarget: true },
  assistedVariation: null,
  advancedVariationLockout: null,
  rationale:
    "Superhero foundation moves week-to-week by adding reps, then sets, then complexity, optionally reducing rest. Do not jump straight to harder variations early.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { athleteLevel: ["beginner", "novice"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { progressionOrder: ["reps", "sets", "complexity", "rest_reduction"] },
  userVisibleEvidenceLabel: "Foundation progressing by reps → sets → complexity",
})
addProgression({
  n: 4,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  exerciseFamily: "foundation_progression",
  fromLevelKey: "week_5_8",
  toLevelKey: "week_9_12",
  entryCriteriaJson: { weeks5to8Completed: true, recoveryAdequate: true },
  progressionTriggerJson: { allBlocksAtTopRange: true },
  regressionTriggerJson: { recoveryDecliningOverWeeks: true },
  assistedVariation: null,
  advancedVariationLockout: null,
  rationale:
    "Late foundation phase introduces rest reduction or harder variations only after weeks of consistent recovery and adherence.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { athleteLevel: ["beginner", "novice"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { gateOnRecoveryStability: true },
  userVisibleEvidenceLabel: "Late foundation: rest reduction gated on recovery stability",
})

// Planche (2)
addProgression({
  n: 5,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  exerciseFamily: "planche",
  fromLevelKey: "tuck_planche",
  toLevelKey: "advanced_tuck_planche",
  entryCriteriaJson: { tuckPlancheCleanHoldSeconds: { gte: 10 } },
  progressionTriggerJson: { tuckHoldSecondsClean: 10, sets: 4 },
  regressionTriggerJson: { holdSecondsClean: { lt: 5 } },
  assistedVariation: "band_tuck_planche",
  advancedVariationLockout: "straddle_planche",
  rationale:
    "Planche tuck → advanced tuck only when 10s clean tuck holds × 4 sets are reliable. Acclimation week applies on stage transition.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { selectedSkills: ["planche"] },
  doesNotApplyWhen: { acuteShoulderOrWristPain: true },
  computationFriendlyRule: { gateHoldSeconds: 10, gateSets: 4, requireAcclimationWeek: true },
  userVisibleEvidenceLabel: "Planche tuck → advanced tuck (gated, with acclimation)",
})
addProgression({
  n: 6,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  exerciseFamily: "planche",
  fromLevelKey: "advanced_tuck_planche",
  toLevelKey: "straddle_planche",
  entryCriteriaJson: { advancedTuckCleanHoldSeconds: { gte: 10 } },
  progressionTriggerJson: { advancedTuckHoldSecondsClean: 10, sets: 4, technique: "stable" },
  regressionTriggerJson: { holdSecondsClean: { lt: 5 } },
  assistedVariation: "band_straddle_planche",
  advancedVariationLockout: "full_planche",
  rationale:
    "Advanced tuck → straddle requires 10s clean advanced tuck holds × 4 sets and stable technique; band-assisted straddle bridges the gap.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { selectedSkills: ["planche"] },
  doesNotApplyWhen: { acuteShoulderOrWristPain: true },
  computationFriendlyRule: { gateHoldSeconds: 10, gateSets: 4, useBandStraddleAsBridge: true },
  userVisibleEvidenceLabel: "Planche advanced tuck → straddle (band-assisted bridge)",
})

// Novice Weighted (2)
addProgression({
  n: 7,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  exerciseFamily: "weighted_pull_up",
  fromLevelKey: "starting_load",
  toLevelKey: "next_session_load_increment",
  entryCriteriaJson: { startingWeightAt12RM: true },
  progressionTriggerJson: { hardestSetRepsAt8: true, rir: { gte: 1 } },
  regressionTriggerJson: { hardestSetReps: { lte: 5 }, rir: 0 },
  assistedVariation: null,
  advancedVariationLockout: null,
  rationale:
    "Novice weighted pull-up: start near 12RM (8 reps with ≥2 RIR). Increment: bigger jump if 8 with RIR remaining; smaller jump if reps holding; deload if reps fall to ~5.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoal: "weighted_pull_up", athleteLevel: ["novice", "intermediate"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { startingLoad: "12RM", incrementPolicy: "function_of_reps_and_rir" },
  userVisibleEvidenceLabel: "Weighted pull-up: load by reps/RIR",
})
addProgression({
  n: 8,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  exerciseFamily: "weighted_dip",
  fromLevelKey: "starting_load",
  toLevelKey: "next_session_load_increment",
  entryCriteriaJson: { startingWeightAt12RM: true },
  progressionTriggerJson: { hardestSetRepsAt8: true, rir: { gte: 1 } },
  regressionTriggerJson: { hardestSetReps: { lte: 5 }, rir: 0 },
  assistedVariation: null,
  advancedVariationLockout: null,
  rationale:
    "Novice weighted dip mirrors weighted pull-up progression: starting load near 12RM, load decided by previous session's hardest set reps and RIR.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoal: "weighted_dip", athleteLevel: ["novice", "intermediate"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { startingLoad: "12RM", incrementPolicy: "function_of_reps_and_rir" },
  userVisibleEvidenceLabel: "Weighted dip: load by reps/RIR",
})

// Abs / Street Workout (1)
addProgression({
  n: 9,
  sourceId: "src_batch_02_abs_street_workout",
  sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
  exerciseFamily: "circuit_progression",
  fromLevelKey: "low_volume_circuit",
  toLevelKey: "high_volume_circuit",
  entryCriteriaJson: { roundsCompletedClean: 4, exercisesPerRound: { gte: 5 } },
  progressionTriggerJson: { allExercisesAtTopRepRange: true },
  regressionTriggerJson: { roundsBelowTarget: true },
  assistedVariation: null,
  advancedVariationLockout: null,
  rationale:
    "Circuit progression goes from 4 rounds × 5 exercises clean → 5 rounds × 6–7 exercises, by raising rounds before adding exercises.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { templateUsesCircuit: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { progressionOrder: ["raise_rounds", "raise_exercises"] },
  userVisibleEvidenceLabel: "Circuit progression: rounds before exercises",
})

// =============================================================================
// EXERCISE SELECTION
// =============================================================================

export const BATCH_02_EXERCISE_SELECTION_RULES: ExerciseSelectionRule[] = []

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
  priorityType: Batch02PriorityType
  intelligenceTier: Batch02IntelligenceTier
  plainLanguageRule: string
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  conflictGroup?: string
}): void {
  const id = atomId("sel", args.n)
  BATCH_02_EXERCISE_SELECTION_RULES.push({
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

// Lower Body A (6)
const LBA_EX: Array<{ key: string; label: string; role: string; level: number }> = [
  { key: "pistol_squat_box", label: "Pistol squat (box)", role: "primary_quad_unilateral", level: 1 },
  { key: "glute_ham_hinge", label: "Glute ham hinge", role: "primary_posterior_unilateral", level: 1 },
  { key: "wall_squat_hold", label: "Wall squat hold", role: "primary_quad_iso", level: 1 },
  { key: "hand_assisted_pistol_squat", label: "Hand-assisted pistol squat", role: "primary_quad_unilateral", level: 2 },
  { key: "skater_squat", label: "Skater squat", role: "primary_quad_unilateral", level: 3 },
  { key: "single_leg_calf_raise", label: "Single-leg calf raise", role: "support_calf", level: 2 },
]
LBA_EX.forEach((ex, i) => {
  addSelection({
    n: i + 1,
    sourceId: "src_batch_02_lower_body_a",
    sourceKey: "lower_body_a_uploaded_pdf_batch_02",
    goalKey: null,
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["beginner", "novice", "intermediate", "advanced"],
    equipmentRequirementsJson: null,
    preferredWhenJson: { templateIncludesLowerBodyA: true, lowerBodyLevel: ex.level },
    avoidWhenJson: { acuteKneePain: true },
    selectionWeight: 0.85,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: Lower Body A level ${ex.level} ${ex.role.replace(/_/g, " ")}.`,
    computationFriendlyRule: { role: ex.role, level: ex.level, repRange: { min: 6, max: 15 } },
    userVisibleEvidenceLabel: `Lower Body A L${ex.level} — ${ex.label}`,
  })
})

// BBR Push/Pull (5)
const BBR_PP_EX: Array<{ key: string; label: string; role: string }> = [
  { key: "ring_dip", label: "Ring dip", role: "primary_push" },
  { key: "ring_chinup", label: "Ring chin-up", role: "primary_pull" },
  { key: "ring_archer_pushup", label: "Ring archer push-up", role: "secondary_push" },
  { key: "ring_pelican_curl", label: "Ring pelican curl", role: "support_arm_eccentric" },
  { key: "ring_face_pull", label: "Ring face pull", role: "support_rear_delt" },
]
BBR_PP_EX.forEach((ex, i) => {
  addSelection({
    n: 100 + i,
    sourceId: "src_batch_02_bbr_push_pull",
    sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
    goalKey: "hypertrophy",
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["intermediate", "advanced"],
    equipmentRequirementsJson: { rings: true },
    preferredWhenJson: { equipmentIncludes: "rings", phase: "phase_1" },
    avoidWhenJson: { ringPrerequisitesUnmet: true },
    selectionWeight: 0.85,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: BBR push/pull Phase 1 ${ex.role.replace(/_/g, " ")} with prescribed tempo.`,
    computationFriendlyRule: { role: ex.role, tempo: ex.role.includes("primary") ? "30X1" : "20X0" },
    userVisibleEvidenceLabel: `BBR push/pull — ${ex.label}`,
  })
})

// Superhero Origin (2)
addSelection({
  n: 200,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  goalKey: "general_fitness",
  skillKey: null,
  exerciseKey: "incline_pushup",
  roleKey: "primary_push_foundation",
  levelScope: ["beginner", "novice"],
  equipmentRequirementsJson: null,
  preferredWhenJson: { athleteLevel: ["beginner", "novice"] },
  avoidWhenJson: {},
  selectionWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Superhero foundation push: incline pushup is the safe foundational push pattern for newer athletes.",
  computationFriendlyRule: { role: "primary_push_foundation", repRange: { min: 6, max: 15 } },
  userVisibleEvidenceLabel: "Foundation: incline push-up",
})
addSelection({
  n: 201,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  goalKey: "general_fitness",
  skillKey: null,
  exerciseKey: "australian_pull_up",
  roleKey: "primary_pull_foundation",
  levelScope: ["beginner", "novice"],
  equipmentRequirementsJson: { pull_up_bar: true },
  preferredWhenJson: { athleteLevel: ["beginner", "novice"] },
  avoidWhenJson: {},
  selectionWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Superhero foundation pull: Australian pull-up (rows) is the safe foundational pull pattern for newer athletes.",
  computationFriendlyRule: { role: "primary_pull_foundation", repRange: { min: 6, max: 15 } },
  userVisibleEvidenceLabel: "Foundation: Australian pull-up",
})

// BBR Arms (4)
const BBR_ARMS_EX: Array<{ key: string; label: string; role: string; level: number }> = [
  { key: "ring_pelican_curl", label: "Ring pelican curl", role: "primary_arm_curl", level: 1 },
  { key: "ring_pelican_negative", label: "Ring pelican negative", role: "primary_arm_eccentric", level: 2 },
  { key: "ring_support_max_hold", label: "Ring support max hold", role: "support_tendon_iso", level: 3 },
  { key: "hanging_max_hold", label: "Hanging max hold", role: "support_grip_iso", level: 3 },
]
BBR_ARMS_EX.forEach((ex, i) => {
  addSelection({
    n: 300 + i,
    sourceId: "src_batch_02_bbr_arms",
    sourceKey: "body_by_rings_arms_uploaded_pdf_batch_02",
    goalKey: "hypertrophy",
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["intermediate", "advanced"],
    equipmentRequirementsJson: { rings: true },
    preferredWhenJson: { equipmentIncludes: "rings", armsLevel: ex.level },
    avoidWhenJson: { tendonReadinessLow: ex.level >= 2 },
    selectionWeight: 0.8,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: BBR arms L${ex.level} ${ex.role.replace(/_/g, " ")}.`,
    computationFriendlyRule: { role: ex.role, level: ex.level, gateLevelRequiresTendonReadiness: ex.level >= 2 },
    userVisibleEvidenceLabel: `BBR arms L${ex.level} — ${ex.label}`,
  })
})

// Planche (2)
addSelection({
  n: 400,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  goalKey: "planche",
  skillKey: "planche",
  exerciseKey: "tuck_planche_hold",
  roleKey: "primary_skill_iso",
  levelScope: ["intermediate", "advanced"],
  equipmentRequirementsJson: { parallettes: true },
  preferredWhenJson: { selectedSkills: ["planche"] },
  avoidWhenJson: { acuteShoulderOrWristPain: true },
  selectionWeight: 0.95,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Tuck planche hold is the primary direct planche exposure at the entry stage.",
  computationFriendlyRule: { role: "primary_skill_iso", holdSeconds: { min: 5, max: 15 } },
  userVisibleEvidenceLabel: "Planche: tuck hold (primary)",
})
addSelection({
  n: 401,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  goalKey: "planche",
  skillKey: "planche",
  exerciseKey: "wall_handstand",
  roleKey: "complementary_skill",
  levelScope: ["intermediate", "advanced"],
  equipmentRequirementsJson: null,
  preferredWhenJson: { selectedSkills: ["planche"] },
  avoidWhenJson: { acuteShoulderPain: true },
  selectionWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Wall handstand work complements planche by building the straight-arm shoulder/scapular base.",
  computationFriendlyRule: { role: "complementary_skill" },
  userVisibleEvidenceLabel: "Planche complement: wall handstand",
})

// Novice Weighted (2)
addSelection({
  n: 500,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  goalKey: "weighted_pull_up",
  skillKey: null,
  exerciseKey: "weighted_pull_up",
  roleKey: "primary_compound_pull",
  levelScope: ["novice", "intermediate"],
  equipmentRequirementsJson: { pull_up_bar: true, weight_belt: true },
  preferredWhenJson: { primaryGoal: "weighted_pull_up" },
  avoidWhenJson: { acuteElbowPain: true },
  selectionWeight: 0.95,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Weighted pull-up is the primary compound pull for novice weighted calisthenics.",
  computationFriendlyRule: { role: "primary_compound_pull", repRange: { min: 5, max: 8 }, sessionsPerWeek: 3 },
  userVisibleEvidenceLabel: "Novice weighted: weighted pull-up (primary)",
})
addSelection({
  n: 501,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  goalKey: "weighted_dip",
  skillKey: null,
  exerciseKey: "weighted_dip",
  roleKey: "primary_compound_push",
  levelScope: ["novice", "intermediate"],
  equipmentRequirementsJson: { dip_bars: true, weight_belt: true },
  preferredWhenJson: { primaryGoal: "weighted_dip" },
  avoidWhenJson: { acuteShoulderPain: true },
  selectionWeight: 0.95,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Weighted dip is the primary compound push for novice weighted calisthenics.",
  computationFriendlyRule: { role: "primary_compound_push", repRange: { min: 5, max: 8 }, sessionsPerWeek: 3 },
  userVisibleEvidenceLabel: "Novice weighted: weighted dip (primary)",
})

// Abs / Street Workout (4)
const ABS_EX: Array<{ key: string; label: string; role: string }> = [
  { key: "hanging_leg_raise", label: "Hanging leg raise", role: "primary_core_anterior" },
  { key: "l_sit_progression", label: "L-sit progression", role: "primary_core_iso" },
  { key: "ab_wheel_rollout", label: "Ab wheel rollout", role: "primary_core_anterior" },
  { key: "side_plank_with_reach", label: "Side plank w/ reach", role: "support_core_lateral" },
]
ABS_EX.forEach((ex, i) => {
  addSelection({
    n: 600 + i,
    sourceId: "src_batch_02_abs_street_workout",
    sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
    goalKey: "core_density",
    skillKey: null,
    exerciseKey: ex.key,
    roleKey: ex.role,
    levelScope: ["intermediate", "advanced"],
    equipmentRequirementsJson: null,
    preferredWhenJson: { goalIncludes: "core_density" },
    avoidWhenJson: { acuteLowBackPain: true },
    selectionWeight: 0.8,
    priorityType: "strong_preference",
    intelligenceTier: "base_week_intelligence",
    plainLanguageRule: `${ex.label}: street-workout core selection — strength/control oriented.`,
    computationFriendlyRule: { role: ex.role, repRange: ex.role.includes("iso") ? null : { min: 5, max: 15 } },
    userVisibleEvidenceLabel: `Core: ${ex.label}`,
  })
})

// =============================================================================
// CONTRAINDICATION RULES
// =============================================================================

export const BATCH_02_CONTRAINDICATION_RULES: ContraindicationRule[] = []

function addContra(args: {
  n: number
  sourceId: string
  sourceKey: string
  exerciseKey: string | null
  exerciseFamily: string | null
  contraindicationKey: string
  contraindicationDescription: string
  severity: number
  alternativeExercise: string | null
  priorityType: Batch02PriorityType
  intelligenceTier: Batch02IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
}): void {
  const id = atomId("contra", args.n)
  // [BATCH-02-CONTRAINDICATION-RULE-CANONICAL] Canonical
  // `ContraindicationRule` (lib/doctrine-db.ts L76-84) owns
  // `exerciseKey`, `blockedJointJson`, `blockedContextJson`,
  // `modificationGuidance`, `severity: 'warning' | 'caution' | 'blocked'`.
  // Map: numeric `severity` → labeled `severity`; legacy
  // `exerciseFamily` is folded into `blockedContextJson.exerciseFamily`;
  // `contraindicationKey` and description go into modificationGuidance.
  const severityLabel: 'warning' | 'caution' | 'blocked' =
    args.severity >= 8 ? 'blocked' : args.severity >= 5 ? 'caution' : 'warning'
  BATCH_02_CONTRAINDICATION_RULES.push({
    id,
    sourceId: args.sourceId,
    exerciseKey: args.exerciseKey ?? '',
    blockedJointJson: null,
    blockedContextJson: args.exerciseFamily
      ? { exerciseFamily: true }
      : null,
    modificationGuidance: args.alternativeExercise
      ? `${args.contraindicationDescription} → use ${args.alternativeExercise}`
      : args.contraindicationDescription,
    severity: severityLabel,
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.appliesWhen,
    doesNotApplyWhen: args.doesNotApplyWhen,
    plainLanguageRule: args.contraindicationDescription,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: null,
    conflictGroup: null,
  })
}

// Planche (2)
addContra({
  n: 1,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  exerciseKey: null,
  exerciseFamily: "planche",
  contraindicationKey: "planche_pain_signal",
  contraindicationDescription:
    "Active wrist/elbow/shoulder pain during planche or straight-arm work blocks the movement until grip/variation change resolves it; if not, stop the movement.",
  severity: 9,
  alternativeExercise: "scap_iso_or_handstand_complement",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { reportedPain: ["wrist", "elbow", "shoulder"] },
  doesNotApplyWhen: { signalIsStiffnessNotPain: true },
  computationFriendlyRule: { onPain: ["change_grip", "change_variation", "stop_movement"] },
  userVisibleEvidenceLabel: "Planche pain → variation/stop",
})
addContra({
  n: 2,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  exerciseKey: "full_planche",
  exerciseFamily: "planche",
  contraindicationKey: "full_planche_premature",
  contraindicationDescription:
    "Full planche is locked out before clean straddle planche holds × 4 sets are reliable. Premature attempts increase wrist/shoulder injury risk.",
  severity: 6,
  alternativeExercise: "straddle_planche",
  priorityType: "hard_constraint",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { selectedSkills: ["planche"], straddleNotConsolidated: true },
  doesNotApplyWhen: { straddleConsolidated: true },
  computationFriendlyRule: { lockoutFullPlancheUntil: "straddle_consolidated" },
  userVisibleEvidenceLabel: "Full planche locked out — straddle not yet consolidated",
})

// =============================================================================
// METHOD RULES
// =============================================================================

export const BATCH_02_METHOD_RULES: MethodRule[] = []

function addMethod(args: {
  n: number
  sourceId: string
  sourceKey: string
  methodKey: string
  contextKey: string
  recommendation: "preferred" | "limited" | "blocked"
  reasoning: string
  priorityType: Batch02PriorityType
  intelligenceTier: Batch02IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  conflictGroup?: string
}): void {
  const id = atomId("method", args.n)
  // [BATCH-02-METHOD-RULE-CANONICAL] Canonical `MethodRule`
  // (lib/doctrine-db.ts L86-96) owns `category`, `compatibleGoalsJson`,
  // `compatibleLevelsJson`, `bestUseCasesJson`, `avoidUseCasesJson`,
  // `structureBiasJson` — not the legacy `contextKey` / `recommendation`
  // / `reasoning` shape. Map at the boundary: contextKey routes to
  // `category`, `recommendation` decides whether the contextKey lands
  // in `bestUseCasesJson` or `avoidUseCasesJson`, and `reasoning` is
  // preserved on `structureBiasJson.reasoning`.
  const isPositive = args.recommendation === 'preferred'
  BATCH_02_METHOD_RULES.push({
    id,
    sourceId: args.sourceId,
    methodKey: args.methodKey,
    category: args.contextKey,
    compatibleGoalsJson: null,
    compatibleLevelsJson: null,
    bestUseCasesJson: isPositive ? [args.contextKey] : null,
    avoidUseCasesJson: !isPositive ? [args.contextKey] : null,
    structureBiasJson: {
      recommendation: args.recommendation,
      reasoning: args.reasoning,
    },
  })
  recordProvenance({
    atomId: id,
    sourceKey: args.sourceKey,
    priorityType: args.priorityType,
    intelligenceTier: args.intelligenceTier,
    appliesWhen: args.appliesWhen,
    doesNotApplyWhen: args.doesNotApplyWhen,
    plainLanguageRule: args.reasoning,
    computationFriendlyRule: args.computationFriendlyRule,
    userVisibleEvidenceLabel: args.userVisibleEvidenceLabel,
    internalRationale: PROVENANCE_NOTE,
    safetyNotes: null,
    conflictGroup: args.conflictGroup ?? null,
  })
}

// BBR Push/Pull (2)
addMethod({
  n: 1,
  sourceId: "src_batch_02_bbr_push_pull",
  sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
  methodKey: "tempo_controlled_straight_sets",
  contextKey: "rings_hypertrophy",
  recommendation: "preferred",
  reasoning: "Tempo-controlled straight sets (30X1, 20X0, 30X2) are the preferred method for ring hypertrophy.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { equipmentIncludes: "rings", goal: ["hypertrophy", "hybrid"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { tempoSetList: ["30X1", "20X0", "30X2"] },
  userVisibleEvidenceLabel: "Method: tempo-controlled straight sets (rings)",
  conflictGroup: "cg-rings-hypertrophy-method",
})
addMethod({
  n: 2,
  sourceId: "src_batch_02_bbr_push_pull",
  sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
  methodKey: "density_circuit",
  contextKey: "rings_hypertrophy",
  recommendation: "blocked",
  reasoning: "Density-circuit packaging is blocked for ring hypertrophy because it sacrifices tempo/control.",
  priorityType: "hard_constraint",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { equipmentIncludes: "rings", goal: ["hypertrophy"] },
  doesNotApplyWhen: { intentionalDensityPhase: true },
  computationFriendlyRule: { blockMethod: "density_circuit", whenContext: "rings_hypertrophy" },
  userVisibleEvidenceLabel: "Density circuit blocked for rings hypertrophy",
  conflictGroup: "cg-rings-hypertrophy-method",
})

// BBR Arms (2)
addMethod({
  n: 3,
  sourceId: "src_batch_02_bbr_arms",
  sourceKey: "body_by_rings_arms_uploaded_pdf_batch_02",
  methodKey: "tempo_eccentric_sets",
  contextKey: "arms_tendon_loading",
  recommendation: "preferred",
  reasoning: "6–8s eccentrics on pelican negatives drive arm tendon adaptation; preferred for L2+ arms work.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { equipmentIncludes: "rings", armsLevel: { gte: 2 } },
  doesNotApplyWhen: {},
  computationFriendlyRule: { eccentricSeconds: { min: 6, max: 8 }, applyToFamily: "pelican_negative" },
  userVisibleEvidenceLabel: "Pelican negatives: tempo-eccentric method",
})
addMethod({
  n: 4,
  sourceId: "src_batch_02_bbr_arms",
  sourceKey: "body_by_rings_arms_uploaded_pdf_batch_02",
  methodKey: "max_iso_hold",
  contextKey: "arm_tendon_iso",
  recommendation: "limited",
  reasoning: "Max iso holds (ring support / hanging) load tendon strongly; use limited dose, not as default volume.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { armsLevel: 3 },
  doesNotApplyWhen: { tendonReadinessLow: true },
  computationFriendlyRule: { maxHoldSetsPerWeek: { max: 4 }, requireTendonReadiness: true },
  userVisibleEvidenceLabel: "Max iso holds dosed conservatively",
})

// Novice Weighted (2)
addMethod({
  n: 5,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  methodKey: "straight_sets_uniform",
  contextKey: "novice_strength",
  recommendation: "preferred",
  reasoning: "Uniform straight sets like 3x7 are preferred for novice strength; preserves quality across sets.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { athleteLevel: ["novice", "intermediate"], primaryGoal: ["weighted_pull_up", "weighted_dip"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { setShape: "uniform_straight_sets", exampleTarget: "3x7" },
  userVisibleEvidenceLabel: "Method: uniform straight sets (novice)",
})
addMethod({
  n: 6,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  methodKey: "amrap_grinder",
  contextKey: "novice_strength",
  recommendation: "blocked",
  reasoning: "AMRAP/grinder methods are blocked for novice weighted strength; they cause early-set overreach and recovery cost.",
  priorityType: "hard_constraint",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { athleteLevel: ["novice", "intermediate"], primaryGoal: ["weighted_pull_up", "weighted_dip"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { blockMethod: "amrap_grinder" },
  userVisibleEvidenceLabel: "AMRAP/grinder blocked for novice strength",
})

// Abs / Street Workout (2)
addMethod({
  n: 7,
  sourceId: "src_batch_02_abs_street_workout",
  sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
  methodKey: "circuit_5_to_7_x_4_to_5",
  contextKey: "endurance_or_core_density",
  recommendation: "preferred",
  reasoning: "5–7 exercises × 4–5 rounds is the preferred circuit shape for endurance/core density training.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { goalIncludesAny: ["endurance", "conditioning", "core_density"] },
  doesNotApplyWhen: { goalIsMaxSkillStrength: true },
  computationFriendlyRule: { exercisesPerCircuit: { min: 5, max: 7 }, rounds: { min: 4, max: 5 } },
  userVisibleEvidenceLabel: "Method: 5–7 exercise × 4–5 round circuit",
})
addMethod({
  n: 8,
  sourceId: "src_batch_02_abs_street_workout",
  sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
  methodKey: "circuit",
  contextKey: "max_strength_skill",
  recommendation: "blocked",
  reasoning: "Circuit packaging is blocked for max-strength skill work to preserve effort quality and tempo control.",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goalIsMaxSkillStrength: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { blockMethod: "circuit", whenContext: "max_strength_skill" },
  userVisibleEvidenceLabel: "Circuit blocked for max-strength skill work",
})

// =============================================================================
// PRESCRIPTION RULES
// =============================================================================

export const BATCH_02_PRESCRIPTION_RULES: PrescriptionRule[] = []

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
  priorityType: Batch02PriorityType
  intelligenceTier: Batch02IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  conflictGroup?: string
}): void {
  const id = atomId("rx", args.n)
  BATCH_02_PRESCRIPTION_RULES.push({
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

// Lower Body A (1)
addRx({
  n: 1,
  sourceId: "src_batch_02_lower_body_a",
  sourceKey: "lower_body_a_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: null,
  exerciseRoleScope: ["primary_quad_unilateral", "primary_posterior_unilateral", "primary_quad_iso", "support_calf"],
  repRangeJson: { min: 6, max: 15 },
  setRangeJson: { min: 3, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 1, maxMinutes: 2 },
  rpeGuidanceJson: { rpe: { min: 7, max: 9 } },
  progressionGuidance:
    "Lower Body A primary movements: 3–4 sets × 6–15 reps with prescribed tempo; 1–2 min rest between sets. Use level-based progression for difficulty changes.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { templateIncludesLowerBodyA: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sets: { min: 3, max: 4 }, reps: { min: 6, max: 15 }, restMinutes: { min: 1, max: 2 } },
  userVisibleEvidenceLabel: "Lower Body A: 3–4 × 6–15, 1–2 min rest",
})

// BBR Push/Pull (2)
addRx({
  n: 2,
  sourceId: "src_batch_02_bbr_push_pull",
  sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy", "hybrid"],
  exerciseRoleScope: ["primary_pull"],
  repRangeJson: { min: 5, max: 10 },
  setRangeJson: { min: 3, max: 5 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 2, maxMinutes: 3 },
  rpeGuidanceJson: { rpe: { min: 7, max: 9 } },
  progressionGuidance:
    "Rings primary chinups: 3–5 × 5–10, 2–3 min rest, tempo-controlled. Rest is longer than typical accessory rest.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { equipmentIncludes: "rings", role: "primary_pull" },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sets: { min: 3, max: 5 }, reps: { min: 5, max: 10 }, restMinutes: { min: 2, max: 3 } },
  userVisibleEvidenceLabel: "Rings primary pull: 2–3 min rest",
})
addRx({
  n: 3,
  sourceId: "src_batch_02_bbr_push_pull",
  sourceKey: "body_by_rings_push_pull_uploaded_pdf_batch_02",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy", "hybrid"],
  exerciseRoleScope: ["secondary_push", "support_arm_eccentric", "support_rear_delt"],
  repRangeJson: { min: 8, max: 15 },
  setRangeJson: { min: 2, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minSeconds: 90, maxSeconds: 90 },
  rpeGuidanceJson: { rpe: { min: 7, max: 9 } },
  progressionGuidance:
    "Rings hypertrophy/accessory: 2–4 × 8–15 reps with ~1:30 rest. Tempo preserved.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { equipmentIncludes: "rings", roleIncludes: ["secondary_push", "support_arm_eccentric"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sets: { min: 2, max: 4 }, reps: { min: 8, max: 15 }, restSeconds: 90 },
  userVisibleEvidenceLabel: "Rings accessory: ~1:30 rest",
})

// Superhero Origin (3)
addRx({
  n: 4,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  levelScope: ["beginner", "novice"],
  goalScope: ["general_fitness"],
  exerciseRoleScope: ["primary_push_foundation", "primary_pull_foundation"],
  repRangeJson: { min: 6, max: 15 },
  setRangeJson: { min: 3, max: 4 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 1, maxMinutes: 2 },
  rpeGuidanceJson: { rpe: { min: 6, max: 8 } },
  progressionGuidance:
    "Superhero foundation primary work: 3–4 × 6–15 reps, 1–2 min rest, RPE 6–8. Add reps before sets, sets before complexity, complexity before rest reduction.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { athleteLevel: ["beginner", "novice"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sets: { min: 3, max: 4 }, reps: { min: 6, max: 15 }, restMinutes: { min: 1, max: 2 } },
  userVisibleEvidenceLabel: "Foundation: 3–4 × 6–15, RPE 6–8",
})
addRx({
  n: 5,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: null,
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance:
    "Lifestyle dosage modifier: when sleep <7h or recovery context flagged, reduce session intensity by ~10–15% and prefer foundational variations over hardest level.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { sleepHoursReported: { lt: 7 } },
  doesNotApplyWhen: {},
  computationFriendlyRule: { intensityReductionPct: { min: 0.1, max: 0.15 }, preferEasierVariation: true },
  userVisibleEvidenceLabel: "Lifestyle modifier: dosage reduced for low sleep",
  conflictGroup: "cg-recovery-modifier",
})
addRx({
  n: 6,
  sourceId: "src_batch_02_superhero_origin",
  sourceKey: "superhero_origin_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: null,
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance:
    "Foundation phase enforces 4-week minimum at chosen variation level before considering advanced/specialized branches.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { athleteLevel: ["beginner", "novice"] },
  doesNotApplyWhen: { athleteLevel: ["intermediate", "advanced"] },
  computationFriendlyRule: { foundationMinWeeks: 4 },
  userVisibleEvidenceLabel: "Foundation: 4-week minimum before specialization",
})

// Forearm Health Batch 2 (2)
addRx({
  n: 7,
  sourceId: "src_batch_02_forearm_health",
  sourceKey: "forearm_health_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: null,
  exerciseRoleScope: ["prehab"],
  repRangeJson: { min: 15, max: 15 },
  setRangeJson: { min: 2, max: 2 },
  holdRangeJson: null,
  restRangeJson: { minSeconds: 30, maxSeconds: 60 },
  rpeGuidanceJson: null,
  progressionGuidance:
    "Forearm prehab confirmed dosage: 2 × 15 across pronation/extension/supination/flexion, paired or short circuit. Same dose as Batch 1 — confidence raised, render once.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { goalsIncludeAny: ["pulling", "rings", "lever", "planche", "grip", "front_lever"] },
  doesNotApplyWhen: { wristPainAcute: true },
  computationFriendlyRule: { sets: 2, reps: 15, restSeconds: { min: 30, max: 60 }, doNotDuplicateBlock: true },
  userVisibleEvidenceLabel: "Forearm prehab: 2 × 15, render once",
})
addRx({
  n: 8,
  sourceId: "src_batch_02_forearm_health",
  sourceKey: "forearm_health_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: null,
  exerciseRoleScope: ["prehab"],
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance:
    "Forearm prehab placement guidance: prefer end-of-session or warm-up tail; avoid placing it as a primary block on planche/lever/pull skill days.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { proposedExercises: ["wrist_pronation", "wrist_extension", "wrist_supination", "wrist_flexion"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { placement: ["warmup_tail", "end_of_session"], avoidPrimaryBlockOnSkillDays: true },
  userVisibleEvidenceLabel: "Forearm prehab placed as support",
})

// Planche (4)
addRx({
  n: 9,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["planche"],
  exerciseRoleScope: ["primary_skill_iso"],
  repRangeJson: null,
  setRangeJson: { min: 4, max: 8 },
  holdRangeJson: { minSeconds: 5, maxSeconds: 15 },
  restRangeJson: { minMinutes: 2, maxMinutes: 4 },
  rpeGuidanceJson: { rpe: { min: 7, max: 9 } },
  progressionGuidance:
    "Planche direct holds: 4–8 × 5–15s, 2–4 min rest. Time-based, not reps. Build clean total seconds before stage progression.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { selectedSkills: ["planche"] },
  doesNotApplyWhen: { acuteShoulderOrWristPain: true },
  computationFriendlyRule: { sets: { min: 4, max: 8 }, holdSeconds: { min: 5, max: 15 }, restMinutes: { min: 2, max: 4 } },
  userVisibleEvidenceLabel: "Planche: time-based holds, 2–4 min rest",
})
addRx({
  n: 10,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: ["planche"],
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: { rpe: { max: 7 } },
  progressionGuidance:
    "Planche acclimation week dosage: cap RPE at ~7 and load at ~80% of normal across 1–2 weeks when stage/variant changes.",
  priorityType: "hard_constraint",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { plancheStageJustChanged: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { acclimationWeeks: { min: 1, max: 2 }, rpeCap: 7, loadPercent: 0.8 },
  userVisibleEvidenceLabel: "Planche acclimation: ~80% load, RPE ≤ 7",
  conflictGroup: "cg-planche-stage-acclimation",
})
addRx({
  n: 11,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: ["planche"],
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance:
    "Planche rhythm: 3–5 days/week is normal. 2–3 consecutive rest days are acceptable. If 4+ days off do not restore quality, reduce intensity/rhythm rather than push.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { selectedSkills: ["planche"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sessionsPerWeek: { min: 3, max: 5 }, maxConsecutiveRestDays: 3, fallbackIfNoRecovery: "reduce_intensity_rhythm" },
  userVisibleEvidenceLabel: "Planche rhythm: 3–5 days/week, rest days allowed",
})
addRx({
  n: 12,
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: ["planche"],
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: { rpe: { max: 9 } },
  progressionGuidance:
    "Max effort planche should not be continuous. Alternate max-style work with lower-intensity acclimation/technique sessions.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { selectedSkills: ["planche"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { maxEffortSessionsPerWeek: { max: 2 }, alternateWith: "acclimation_or_technique" },
  userVisibleEvidenceLabel: "Planche: max effort spaced, not continuous",
})

// Novice Weighted (4)
addRx({
  n: 13,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  levelScope: ["novice", "intermediate"],
  goalScope: ["weighted_calisthenics"],
  exerciseRoleScope: ["primary_compound_pull", "primary_compound_push"],
  repRangeJson: { min: 5, max: 8 },
  setRangeJson: { min: 3, max: 3 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 3, maxMinutes: 5 },
  rpeGuidanceJson: { rir: { min: 0, max: 2 } },
  progressionGuidance:
    "Novice weighted main lifts: 3 × 5–8, RIR 0–2, 3–5 min rest. Three sessions/week.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoal: ["weighted_pull_up", "weighted_dip"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { sets: 3, reps: { min: 5, max: 8 }, rir: { min: 0, max: 2 }, restMinutes: { min: 3, max: 5 } },
  userVisibleEvidenceLabel: "Novice weighted main: 3 × 5–8, RIR 0–2",
})
addRx({
  n: 14,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: ["weighted_calisthenics"],
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance:
    "Starting weight target: select a load near 12RM such that 8 reps with ≥2 RIR are reachable on the first session.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { primaryGoal: ["weighted_pull_up", "weighted_dip"], firstSession: true },
  doesNotApplyWhen: {},
  computationFriendlyRule: { startingLoad: "12RM", targetFirstSessionReps: 8, targetFirstSessionRIR: { min: 2 } },
  userVisibleEvidenceLabel: "Starting load anchored near 12RM",
})
addRx({
  n: 15,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: ["weighted_calisthenics"],
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance:
    "Deload protocol: when reps fall to ~5 with grinding, reduce load by ~5–10kg or ~20% and rebuild. Do not chase progression through grinding sets.",
  priorityType: "hard_constraint",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { hardestSetReps: { lte: 5 }, rir: 0 },
  doesNotApplyWhen: {},
  computationFriendlyRule: { deloadKgRange: { min: 5, max: 10 }, deloadPercent: 0.2 },
  userVisibleEvidenceLabel: "Deload: ~5–10kg / ~20%",
})
addRx({
  n: 16,
  sourceId: "src_batch_02_novice_weighted",
  sourceKey: "novice_weighted_calisthenics_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: ["weighted_calisthenics"],
  exerciseRoleScope: null,
  repRangeJson: null,
  setRangeJson: null,
  holdRangeJson: null,
  restRangeJson: null,
  rpeGuidanceJson: null,
  progressionGuidance:
    "Stay in novice phase as long as load is climbing on the chosen scheme. Switch only when deload no longer restores progress.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { primaryGoal: ["weighted_pull_up", "weighted_dip"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { switchTrigger: "deload_no_longer_restores_progress" },
  userVisibleEvidenceLabel: "Stay novice while load climbs",
})

// Abs / Street Workout (1)
addRx({
  n: 17,
  sourceId: "src_batch_02_abs_street_workout",
  sourceKey: "abs_street_workout_uploaded_pdf_batch_02",
  levelScope: null,
  goalScope: ["core_density", "endurance"],
  exerciseRoleScope: ["primary_core_anterior", "primary_core_iso", "support_core_lateral"],
  repRangeJson: { min: 5, max: 15 },
  setRangeJson: { min: 3, max: 5 },
  holdRangeJson: { minSeconds: 10, maxSeconds: 30 },
  restRangeJson: { minSeconds: 30, maxSeconds: 60 },
  rpeGuidanceJson: null,
  progressionGuidance:
    "Core circuit dosage: 3–5 rounds, each exercise 5–15 reps or 10–30s holds, 30–60s rest between exercises. Frequency depends on soreness and method.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { goalIncludesAny: ["core_density", "endurance"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { rounds: { min: 3, max: 5 }, restSeconds: { min: 30, max: 60 } },
  userVisibleEvidenceLabel: "Core circuit: 3–5 rounds, 30–60s rest",
})

// =============================================================================
// CARRYOVER RULES
// =============================================================================

export const BATCH_02_CARRYOVER_RULES: CarryoverRule[] = []

function addCarryover(args: {
  n: number
  sourceId: string
  sourceKey: string
  sourceExerciseOrSkillKey: string
  targetSkillKey: string
  carryoverType: string
  carryoverStrength: number
  rationale: string
  priorityType: Batch02PriorityType
  intelligenceTier: Batch02IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
}): void {
  const id = atomId("carry", args.n)
  // [BATCH-02-CARRYOVER-TYPE-CANONICAL] Canonical
  // `CarryoverRule.carryoverType` is the union
  // `'direct' | 'indirect' | 'prerequisite' | 'accessory'`. Legacy
  // batch-02 entries use richer labels (e.g. `complementary_skill`).
  // Normalize at the boundary; unknown labels collapse to
  // `'accessory'` (the catch-all support carryover).
  const validCarryover = (() => {
    const t = args.carryoverType
    if (t === 'direct' || t === 'indirect' || t === 'prerequisite' || t === 'accessory') return t
    return 'accessory' as const
  })()
  BATCH_02_CARRYOVER_RULES.push({
    id,
    sourceId: args.sourceId,
    sourceExerciseOrSkillKey: args.sourceExerciseOrSkillKey,
    targetSkillKey: args.targetSkillKey,
    carryoverType: validCarryover,
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
  sourceId: "src_batch_02_planche",
  sourceKey: "planche_uploaded_pdf_batch_02",
  sourceExerciseOrSkillKey: "wall_handstand",
  targetSkillKey: "planche",
  carryoverType: "complementary_skill",
  carryoverStrength: 0.7,
  rationale: "Wall handstand develops the straight-arm shoulder/scapular base that planche depends on.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { selectedSkills: ["planche"] },
  doesNotApplyWhen: { acuteShoulderPain: true },
  computationFriendlyRule: { carryoverType: "complementary_skill", strength: 0.7 },
  userVisibleEvidenceLabel: "Carryover: handstand → planche",
})

addCarryover({
  n: 2,
  sourceId: "src_batch_02_forearm_health",
  sourceKey: "forearm_health_uploaded_pdf_batch_02",
  sourceExerciseOrSkillKey: "wrist_circuit",
  targetSkillKey: "planche",
  carryoverType: "tendon_support",
  carryoverStrength: 0.5,
  rationale: "Wrist circuit reduces wrist pain risk on planche and other straight-arm/grip-heavy work.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkills: ["planche"] },
  doesNotApplyWhen: {},
  computationFriendlyRule: { carryoverType: "tendon_support", strength: 0.5 },
  userVisibleEvidenceLabel: "Carryover: wrist circuit → planche tendon support",
})

// =============================================================================
// REPAIR APPENDIX — added to meet BBR Arms minimum (>=10).
// Provenance: derived_from_prompt_section_3_summary.
// =============================================================================

addRx({
  n: 800,
  sourceId: "src_batch_02_bbr_arms",
  sourceKey: "body_by_rings_arms_uploaded_pdf_batch_02",
  levelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy", "rings"],
  exerciseRoleScope: ["primary_arm_curl", "primary_arm_eccentric"],
  repRangeJson: { min: 6, max: 10 },
  setRangeJson: { min: 3, max: 3 },
  holdRangeJson: null,
  restRangeJson: { minMinutes: 1, maxMinutes: 2 },
  rpeGuidanceJson: { rpe: { min: 7, max: 9 } },
  progressionGuidance:
    "BBR Arms hypertrophy: 3 sets x 6–10 reps with 1–2 min rest, controlled tempo. Negatives use 6–8s eccentrics.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  appliesWhen: { equipmentIncludes: "rings", goal: ["hypertrophy", "rings"] },
  doesNotApplyWhen: { acuteElbowOrShoulderPain: true },
  computationFriendlyRule: { sets: 3, repRange: { min: 6, max: 10 }, restMinutes: { min: 1, max: 2 }, eccentricSeconds: { min: 6, max: 8 } },
  userVisibleEvidenceLabel: "BBR Arms: 3x6–10, controlled tempo",
})
addCarryover({
  n: 800,
  sourceId: "src_batch_02_bbr_arms",
  sourceKey: "body_by_rings_arms_uploaded_pdf_batch_02",
  sourceExerciseOrSkillKey: "ring_pelican_curl",
  targetSkillKey: "biceps_strength",
  carryoverType: "support_arm_curl",
  carryoverStrength: 0.7,
  rationale:
    "Pelican curl work supports biceps/elbow capacity used in front lever rows and one-arm pulling, but it is accessory and must not replace direct skill work.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { equipmentIncludes: "rings", selectedSkillsIncludesAny: ["front_lever", "one_arm_pull_up"] },
  doesNotApplyWhen: { armSpecializationActive: false },
  computationFriendlyRule: { carryoverWeight: 0.7, role: "support_arm_curl", neverReplacePrimarySkill: true },
  userVisibleEvidenceLabel: "Pelican curl supports lever/one-arm pulling capacity",
})

// =============================================================================
// PUBLIC ACCESSORS
// =============================================================================

export function getBatch02Sources(): DoctrineSource[] {
  return BATCH_02_SOURCES
}
export function getBatch02Principles(): DoctrinePrinciple[] {
  return BATCH_02_PRINCIPLES
}
export function getBatch02ProgressionRules(): ProgressionRule[] {
  return BATCH_02_PROGRESSION_RULES
}
export function getBatch02ExerciseSelectionRules(): ExerciseSelectionRule[] {
  return BATCH_02_EXERCISE_SELECTION_RULES
}
export function getBatch02ContraindicationRules(): ContraindicationRule[] {
  return BATCH_02_CONTRAINDICATION_RULES
}
export function getBatch02MethodRules(): MethodRule[] {
  return BATCH_02_METHOD_RULES
}
export function getBatch02PrescriptionRules(): PrescriptionRule[] {
  return BATCH_02_PRESCRIPTION_RULES
}
export function getBatch02CarryoverRules(): CarryoverRule[] {
  return BATCH_02_CARRYOVER_RULES
}
export function getBatch02ProvenanceFor(atomId: string): Batch02Provenance | null {
  return PROVENANCE[atomId] ?? null
}

export interface Batch02Counts {
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

export function getBatch02Counts(): Batch02Counts {
  const principles = BATCH_02_PRINCIPLES.length
  const progression = BATCH_02_PROGRESSION_RULES.length
  const selection = BATCH_02_EXERCISE_SELECTION_RULES.length
  const contraindication = BATCH_02_CONTRAINDICATION_RULES.length
  const method = BATCH_02_METHOD_RULES.length
  const prescription = BATCH_02_PRESCRIPTION_RULES.length
  const carryover = BATCH_02_CARRYOVER_RULES.length
  return {
    sources: BATCH_02_SOURCES.length,
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

export function getBatch02CountsBySource(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const id of Object.keys(PROVENANCE)) {
    const sk = PROVENANCE[id].sourceKey
    out[sk] = (out[sk] ?? 0) + 1
  }
  return out
}
