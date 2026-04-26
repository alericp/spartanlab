/**
 * BATCH 3 — UPLOADED PDF DOCTRINE
 * =============================================================================
 *
 * Pure-data doctrine atoms ingested from the Section-5 uploaded-PDF set.
 * Same architecture as Batch 1 / Batch 2 — no decision-time logic lives here.
 *
 * Sources (9):
 *   1. Lower Body A (duplicate confirmation)
 *   2. MZ Intermediate Weighted Calisthenics
 *   3. Forearm Health (duplicate confirmation)
 *   4. Kinevo Bodyweight Strength Foundation
 *   5. No-BS Nutrition System
 *   6. BSF Training Log / Warm-up / Hypertrophy
 *   7. Ian Barseagle Weighted & Bodyweight Calisthenics
 *   8. Flexibility Notes
 *   9. Muscle & Strength Pyramid Training
 *
 * Provenance: every atom is `derived_from_prompt_section_5_summary` until a
 * verbatim PDF excerpt is supplied. Required computable rules A–W (Section 7
 * of the ingestion prompt) are all represented; see the `// [Rule X]` markers.
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

const NOW = new Date()
const NOW_DATE = NOW
const BATCH_03_VERSION = "batch_03_v1"
const PROVENANCE_NOTE = "derived_from_prompt_section_5_summary"

export type Batch03PriorityType =
  | "hard_constraint"
  | "strong_preference"
  | "soft_preference"
  | "example_only"
export type Batch03IntelligenceTier =
  | "base_week_intelligence"
  | "phase_week_modulation"
  | "cross_cutting"

export interface Batch03Provenance {
  atomId: string
  sourceKey: string
  priorityType: Batch03PriorityType
  intelligenceTier: Batch03IntelligenceTier
  appliesWhen: Record<string, unknown>
  doesNotApplyWhen: Record<string, unknown>
  plainLanguageRule: string
  computationFriendlyRule: Record<string, unknown>
  userVisibleEvidenceLabel: string
  internalRationale: string
  safetyNotes: string | null
  conflictGroup: string | null
}

export interface Batch03Counts {
  sources: number
  principles: number
  progressionRules: number
  exerciseSelectionRules: number
  contraindicationRules: number
  methodRules: number
  prescriptionRules: number
  carryoverRules: number
  total: number
}

function aid(prefix: string, n: number): string {
  return `${prefix}-b03-${String(n).padStart(4, "0")}`
}

// =============================================================================
// SOURCES
// =============================================================================

const SOURCES: DoctrineSource[] = [
  {
    id: "src_batch_03_lower_body_a_dup",
    sourceKey: "lower_body_a_uploaded_pdf_batch_03_duplicate_confirmation",
    title: "Lower Body Workout A — duplicate confirmation",
    sourceType: "extracted_pdf",
    description:
      "Repeats Lower Body A level progression (pistol-squat box, glute-ham hinge, wall squat, calf raises). Increases provenance/confidence; must NOT duplicate visible blocks.",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
  {
    id: "src_batch_03_mz_intermediate_weighted",
    sourceKey: "mz_intermediate_weighted_calisthenics_uploaded_pdf_batch_03",
    title: "MZ Intermediate Weighted Calisthenics",
    sourceType: "extracted_pdf",
    description:
      "Stage-1 weekly cycle for intermediate weighted dip/pull-up athletes: heavy 3x3 RIR 0–2 Mon, paused/deadstop assistance 3x3–6 RIR 0–2 Tue, single-set PR 3–6 reps RIR 0 Fri.",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
  {
    id: "src_batch_03_forearm_health_dup",
    sourceKey: "forearm_health_uploaded_pdf_batch_03_duplicate_confirmation",
    title: "Forearm Health — duplicate confirmation",
    sourceType: "extracted_pdf",
    description:
      "Confirms wrist pronation, extension, supination, flexion at 2x15 with short rest. Increases prehab confidence; must NOT duplicate visible prehab blocks.",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
  {
    id: "src_batch_03_kinevo_bw_foundation",
    sourceKey: "kinevo_bodyweight_strength_foundation_uploaded_pdf_batch_03",
    title: "Kinevo Bodyweight Strength Foundation",
    sourceType: "extracted_pdf",
    description:
      "Upper-body calisthenics strength foundation. Builds strength via leverage manipulation. Bands recommended <8 pull-ups; free-weight progression viable >8 pull-ups.",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
  {
    id: "src_batch_03_no_bs_nutrition",
    sourceKey: "no_bs_nutrition_system_uploaded_pdf_batch_03",
    title: "No-BS Nutrition System",
    sourceType: "extracted_pdf",
    description:
      "Adherence-first nutrition for muscle gain / leanness. Calories + protein + consistency dominate over obsessive macro tracking.",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
  {
    id: "src_batch_03_bsf_training_log",
    sourceKey: "bsf_training_log_warmup_hypertrophy_uploaded_pdf_batch_03",
    title: "BSF Training Log — Warm-up / Phase 1 Hypertrophy",
    sourceType: "extracted_pdf",
    description:
      "Upper-body warm-up sequence + Phase-1 hypertrophy structure (3 weekly sessions, progression held constant while reps/sets advance week-to-week).",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
  {
    id: "src_batch_03_ian_barseagle_weighted",
    sourceKey: "ian_barseagle_weighted_bodyweight_calisthenics_uploaded_pdf_batch_03",
    title: "Ian Barseagle Weighted & Bodyweight Calisthenics",
    sourceType: "extracted_pdf",
    description:
      "Bodyweight prerequisite ramp (15+ pull-ups / 20+ dips before weighted plan). Movement-specific warm-up incl. ~50% working-load warm-up reps.",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
  {
    id: "src_batch_03_flexibility_notes",
    sourceKey: "flexibility_notes_uploaded_pdf_batch_03",
    title: "Flexibility Notes — Active/Passive, Skill Support, Planche Wrist",
    sourceType: "extracted_pdf",
    description:
      "Active vs passive flexibility, mobility role in skill control, planche wrist stress, recovery-supportive stretching. Reduces injury risk; never eliminates it.",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
  {
    id: "src_batch_03_mns_pyramid",
    sourceKey: "muscle_strength_pyramid_training_uploaded_pdf_batch_03",
    title: "Muscle & Strength Pyramid (Training)",
    sourceType: "extracted_pdf",
    description:
      "Helms-style pyramid: adherence → VIF → progression → exercise selection → rest/tempo. Acts as high-level conflict resolution, not as override of skill-specific calisthenics doctrine.",
    version: BATCH_03_VERSION,
    isActive: true,
    createdAt: NOW_DATE,
    updatedAt: NOW_DATE,
  },
]

// =============================================================================
// ATOM ARRAYS + provenance
// =============================================================================

const PRINCIPLES: DoctrinePrinciple[] = []
const PROGRESSION_RULES: ProgressionRule[] = []
const SELECTION_RULES: ExerciseSelectionRule[] = []
const CONTRA_RULES: ContraindicationRule[] = []
const METHOD_RULES: MethodRule[] = []
const RX_RULES: PrescriptionRule[] = []
const CARRYOVER_RULES: CarryoverRule[] = []
const PROVENANCE: Map<string, Batch03Provenance> = new Map()

interface ProvShared {
  sourceKey: string
  priorityType: Batch03PriorityType
  intelligenceTier: Batch03IntelligenceTier
  appliesWhen?: Record<string, unknown>
  doesNotApplyWhen?: Record<string, unknown>
  plainLanguageRule: string
  computationFriendlyRule?: Record<string, unknown>
  userVisibleEvidenceLabel: string
  internalRationale?: string
  safetyNotes?: string | null
  conflictGroup?: string | null
}

function trackProv(atomId: string, p: ProvShared) {
  PROVENANCE.set(atomId, {
    atomId,
    sourceKey: p.sourceKey,
    priorityType: p.priorityType,
    intelligenceTier: p.intelligenceTier,
    appliesWhen: p.appliesWhen ?? {},
    doesNotApplyWhen: p.doesNotApplyWhen ?? {},
    plainLanguageRule: p.plainLanguageRule,
    computationFriendlyRule: p.computationFriendlyRule ?? {},
    userVisibleEvidenceLabel: p.userVisibleEvidenceLabel,
    internalRationale: p.internalRationale ?? PROVENANCE_NOTE,
    safetyNotes: p.safetyNotes ?? null,
    conflictGroup: p.conflictGroup ?? null,
  })
}

interface PrincipleArgs extends ProvShared {
  n: number
  sourceId: string
  doctrineFamily: string
  principleKey: string
  principleTitle: string
  principleSummary: string
  athleteLevelScope: string[]
  goalScope?: string[] | null
  appliesToSkillTypes?: string[] | null
  appliesToTrainingStyles?: string[] | null
  safetyPriority?: number
  priorityWeight?: number
}
function addPrinciple(a: PrincipleArgs) {
  const id = aid("prn", a.n)
  PRINCIPLES.push({
    id,
    sourceId: a.sourceId,
    doctrineFamily: a.doctrineFamily,
    principleKey: a.principleKey,
    principleTitle: a.principleTitle,
    principleSummary: a.principleSummary,
    athleteLevelScope: a.athleteLevelScope,
    goalScope: a.goalScope ?? null,
    appliesToSkillTypes: a.appliesToSkillTypes ?? null,
    appliesToTrainingStyles: a.appliesToTrainingStyles ?? null,
    safetyPriority: a.safetyPriority ?? 0,
    priorityWeight: a.priorityWeight ?? 1,
  })
  trackProv(id, a)
}

interface ProgressionArgs extends ProvShared {
  n: number
  sourceId: string
  skillKey: string
  currentLevelKey: string
  nextLevelKey: string
  requiredPrerequisitesJson?: Record<string, string> | null
  minReadinessJson?: Record<string, string> | null
  progressionRuleSummary?: string | null
  cautionFlagsJson?: string[] | null
  confidenceWeight?: number
}
function addProgression(a: ProgressionArgs) {
  const id = aid("pro", a.n)
  PROGRESSION_RULES.push({
    id,
    sourceId: a.sourceId,
    skillKey: a.skillKey,
    currentLevelKey: a.currentLevelKey,
    nextLevelKey: a.nextLevelKey,
    requiredPrerequisitesJson: a.requiredPrerequisitesJson ?? null,
    minReadinessJson: a.minReadinessJson ?? null,
    progressionRuleSummary: a.progressionRuleSummary ?? null,
    cautionFlagsJson: a.cautionFlagsJson ?? null,
    confidenceWeight: a.confidenceWeight ?? 1,
  })
  trackProv(id, a)
}

interface SelectionArgs extends ProvShared {
  n: number
  sourceId: string
  goalKey?: string | null
  skillKey?: string | null
  exerciseKey: string
  roleKey?: string | null
  levelScope: string[]
  equipmentRequirementsJson?: Record<string, boolean> | null
  preferredWhenJson?: Record<string, unknown> | null
  avoidWhenJson?: Record<string, unknown> | null
  selectionWeight?: number
}
function addSelection(a: SelectionArgs) {
  const id = aid("sel", a.n)
  SELECTION_RULES.push({
    id,
    sourceId: a.sourceId,
    goalKey: a.goalKey ?? null,
    skillKey: a.skillKey ?? null,
    exerciseKey: a.exerciseKey,
    roleKey: a.roleKey ?? null,
    levelScope: a.levelScope,
    equipmentRequirementsJson: a.equipmentRequirementsJson ?? null,
    preferredWhenJson: a.preferredWhenJson ?? null,
    avoidWhenJson: a.avoidWhenJson ?? null,
    selectionWeight: a.selectionWeight ?? 1,
  })
  trackProv(id, a)
}

interface ContraArgs extends ProvShared {
  n: number
  sourceId: string
  exerciseKey: string
  blockedJointJson?: string[] | null
  blockedContextJson?: Record<string, boolean> | null
  modificationGuidance?: string | null
  severity: "warning" | "caution" | "blocked"
}
function addContra(a: ContraArgs) {
  const id = aid("ctr", a.n)
  CONTRA_RULES.push({
    id,
    sourceId: a.sourceId,
    exerciseKey: a.exerciseKey,
    blockedJointJson: a.blockedJointJson ?? null,
    blockedContextJson: a.blockedContextJson ?? null,
    modificationGuidance: a.modificationGuidance ?? null,
    severity: a.severity,
  })
  trackProv(id, a)
}

interface MethodArgs extends ProvShared {
  n: number
  sourceId: string
  methodKey: string
  category?: string | null
  compatibleGoalsJson?: string[] | null
  compatibleLevelsJson?: string[] | null
  bestUseCasesJson?: string[] | null
  avoidUseCasesJson?: string[] | null
  structureBiasJson?: Record<string, unknown> | null
}
function addMethod(a: MethodArgs) {
  const id = aid("mtd", a.n)
  METHOD_RULES.push({
    id,
    sourceId: a.sourceId,
    methodKey: a.methodKey,
    category: a.category ?? null,
    compatibleGoalsJson: a.compatibleGoalsJson ?? null,
    compatibleLevelsJson: a.compatibleLevelsJson ?? null,
    bestUseCasesJson: a.bestUseCasesJson ?? null,
    avoidUseCasesJson: a.avoidUseCasesJson ?? null,
    structureBiasJson: a.structureBiasJson ?? null,
  })
  trackProv(id, a)
}

interface RxArgs extends ProvShared {
  n: number
  sourceId: string
  levelScope?: string[] | null
  goalScope?: string[] | null
  exerciseRoleScope?: string[] | null
  repRangeJson?: Record<string, unknown> | null
  setRangeJson?: Record<string, unknown> | null
  holdRangeJson?: Record<string, unknown> | null
  restRangeJson?: Record<string, unknown> | null
  rpeGuidanceJson?: Record<string, unknown> | null
  progressionGuidance?: string | null
}
function addRx(a: RxArgs) {
  const id = aid("rx", a.n)
  RX_RULES.push({
    id,
    sourceId: a.sourceId,
    levelScope: a.levelScope ?? null,
    goalScope: a.goalScope ?? null,
    exerciseRoleScope: a.exerciseRoleScope ?? null,
    repRangeJson: a.repRangeJson ?? null,
    setRangeJson: a.setRangeJson ?? null,
    holdRangeJson: a.holdRangeJson ?? null,
    restRangeJson: a.restRangeJson ?? null,
    rpeGuidanceJson: a.rpeGuidanceJson ?? null,
    progressionGuidance: a.progressionGuidance ?? null,
  })
  trackProv(id, a)
}

interface CarryoverArgs extends ProvShared {
  n: number
  sourceId: string
  sourceExerciseOrSkillKey: string
  targetSkillKey: string
  carryoverType: "direct" | "indirect" | "prerequisite" | "accessory"
  carryoverStrength: number
  rationale?: string | null
}
function addCarryover(a: CarryoverArgs) {
  const id = aid("car", a.n)
  CARRYOVER_RULES.push({
    id,
    sourceId: a.sourceId,
    sourceExerciseOrSkillKey: a.sourceExerciseOrSkillKey,
    targetSkillKey: a.targetSkillKey,
    carryoverType: a.carryoverType,
    carryoverStrength: a.carryoverStrength,
    rationale: a.rationale ?? null,
  })
  trackProv(id, a)
}

// =============================================================================
// SOURCE 1 — Lower Body A duplicate confirmation (5 atoms)
// =============================================================================

const LBA_SRC = "src_batch_03_lower_body_a_dup"
const LBA_KEY = "lower_body_a_uploaded_pdf_batch_03_duplicate_confirmation"

// [Rule W] Duplicate-source confidence — applies to entire Batch 3 family but anchored here.
addPrinciple({
  n: 1,
  sourceId: LBA_SRC,
  sourceKey: LBA_KEY,
  doctrineFamily: "duplicate_source_confidence",
  principleKey: "duplicate_source_confidence_lower_body_a",
  principleTitle: "Duplicate source increases confidence, not block volume",
  principleSummary:
    "Lower Body A repeats prior doctrine across Levels 1–3 (pistol box, glute ham hinge, wall squat, calf raises). Treat as confidence boost; never duplicate visible blocks.",
  athleteLevelScope: ["beginner", "intermediate"],
  goalScope: ["lower_body", "general_fitness"],
  appliesToTrainingStyles: ["calisthenics_lower_body"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { sourceFamilyDuplicateOf: "lower_body_a_uploaded_pdf_batch_01" },
  computationFriendlyRule: {
    increaseProvenanceConfidence: true,
    duplicateVisibleBlocks: false,
  },
  userVisibleEvidenceLabel: "Duplicate source confirmed doctrine without duplicating blocks",
  conflictGroup: "duplicate_handling",
})

addSelection({
  n: 1,
  sourceId: LBA_SRC,
  sourceKey: LBA_KEY,
  exerciseKey: "pistol_squat_box",
  roleKey: "primary_lower_unilateral",
  levelScope: ["beginner"],
  preferredWhenJson: { lowerBodyLevel: 1 },
  selectionWeight: 0.6,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "Level 1 lower body confirmed: pistol-squat to box for unilateral squat introduction.",
  userVisibleEvidenceLabel: "Lower Body A Level 1 confirmed (pistol-to-box)",
})

addSelection({
  n: 2,
  sourceId: LBA_SRC,
  sourceKey: LBA_KEY,
  exerciseKey: "wall_squat",
  roleKey: "isometric_lower",
  levelScope: ["beginner", "intermediate"],
  preferredWhenJson: { lowerBodyLevel: { min: 1, max: 3 } },
  selectionWeight: 0.5,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "Wall squat hold reaffirmed across Levels 1–3 with progressively longer holds and single-leg variant at Level 3.",
  userVisibleEvidenceLabel: "Wall squat reaffirmed L1–L3",
})

addSelection({
  n: 3,
  sourceId: LBA_SRC,
  sourceKey: LBA_KEY,
  exerciseKey: "single_leg_calf_raise",
  roleKey: "accessory_lower",
  levelScope: ["intermediate"],
  preferredWhenJson: { lowerBodyLevel: { min: 2, max: 3 } },
  selectionWeight: 0.5,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "Single-leg calf raise reaffirmed at Level 2/3, paired with bent-leg calf raise.",
  userVisibleEvidenceLabel: "Single-leg calf raise reaffirmed L2/L3",
})

addCarryover({
  n: 1,
  sourceId: LBA_SRC,
  sourceKey: LBA_KEY,
  sourceExerciseOrSkillKey: "glute_ham_hinge",
  targetSkillKey: "posterior_chain_strength",
  carryoverType: "accessory",
  carryoverStrength: 0.55,
  rationale:
    "Glute-ham hinge reaffirmed as posterior-chain accessory across L1–L3; supports squat and pulling capacity.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule:
    "Glute-ham hinge accessory carryover reaffirmed; supports posterior-chain capacity used in squat patterns.",
  userVisibleEvidenceLabel: "Glute-ham hinge → posterior chain (accessory)",
})

// =============================================================================
// SOURCE 2 — MZ Intermediate Weighted Calisthenics (14 atoms)
// =============================================================================

const MZ_SRC = "src_batch_03_mz_intermediate_weighted"
const MZ_KEY = "mz_intermediate_weighted_calisthenics_uploaded_pdf_batch_03"

// [Rule C] Intermediate overcomplication guard
addPrinciple({
  n: 2,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  doctrineFamily: "intermediate_weighted_progression",
  principleKey: "intermediate_overcomplication_guard",
  principleTitle: "Intermediate weighted: stable progression beats method-hopping",
  principleSummary:
    "Intermediate is where overcomplication kills progress. Hold a stable weekly heavy/assistance/PR rotation before introducing advanced complexity.",
  athleteLevelScope: ["intermediate"],
  goalScope: ["weighted_pull_up", "weighted_dip"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  appliesWhen: { level: "intermediate", goalAnyOf: ["weighted_pull_up", "weighted_dip"] },
  computationFriendlyRule: { stableProgressionMinWeeks: 4, methodHoppingAllowed: false },
  userVisibleEvidenceLabel: "Intermediate plan kept progression stable instead of overcomplicated",
  conflictGroup: "intermediate_progression",
})

// [Rule A] heavy/PR linkage
addMethod({
  n: 1,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  methodKey: "heavy_assistance_pr_weekly",
  category: "weighted_calisthenics_weekly_structure",
  compatibleGoalsJson: ["weighted_pull_up", "weighted_dip", "strength"],
  compatibleLevelsJson: ["intermediate"],
  bestUseCasesJson: ["intermediate_strength_progression", "weighted_dip_pull_up"],
  avoidUseCasesJson: ["beginner_pull_up_under_8_reps"],
  structureBiasJson: {
    weeklyTemplate: { heavyDay: "monday", assistanceDay: "tuesday", prDay: "friday" },
    heavyAndPrShareLoad: true,
    weeklyIncrementDriver: "pr_set_reps",
  },
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule:
    "Stage-1 weekly cycle links heavy 3x3 work and PR-set work at the same load. PR-set reps determine the next heavy/PR load.",
  userVisibleEvidenceLabel: "Intermediate weighted progression linked heavy work to PR-set performance",
  conflictGroup: "weighted_weekly_structure",
})

// [Rule B] assistance progression independence
addMethod({
  n: 2,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  methodKey: "assistance_independent_progression",
  category: "weighted_calisthenics_assistance",
  compatibleGoalsJson: ["weighted_pull_up", "weighted_dip"],
  compatibleLevelsJson: ["intermediate"],
  bestUseCasesJson: ["paused_dips", "deadstop_pull_ups"],
  structureBiasJson: {
    progressionDriver: "hardest_set_reps_and_rir",
    coupledToHeavyOrPr: false,
  },
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule:
    "Paused dips and deadstop pull-ups (assistance) progress independently based on hardest-set reps/RIR, not the main heavy/PR load.",
  userVisibleEvidenceLabel: "Assistance work progressed independently from main lift",
  conflictGroup: "weighted_weekly_structure",
})

addRx({
  n: 1,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  levelScope: ["intermediate"],
  goalScope: ["weighted_pull_up", "weighted_dip"],
  exerciseRoleScope: ["primary_weighted_pull", "primary_weighted_dip"],
  repRangeJson: { min: 3, max: 3 },
  setRangeJson: { min: 3, max: 3 },
  restRangeJson: { minMinutes: 3, maxMinutes: 5 },
  rpeGuidanceJson: { rir: { min: 0, max: 2 } },
  progressionGuidance:
    "Heavy Monday: 3x3 weighted dips and pull-ups at RIR 0–2. Same load shared with Friday PR set.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Heavy 3x3 RIR 0–2 anchors the intermediate week.",
  userVisibleEvidenceLabel: "Heavy 3x3 RIR 0–2 (Monday)",
})

addRx({
  n: 2,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  levelScope: ["intermediate"],
  goalScope: ["weighted_pull_up", "weighted_dip"],
  exerciseRoleScope: ["assistance_weighted_pull", "assistance_weighted_dip"],
  repRangeJson: { min: 3, max: 6 },
  setRangeJson: { min: 3, max: 3 },
  restRangeJson: { minMinutes: 2, maxMinutes: 4 },
  rpeGuidanceJson: { rir: { min: 0, max: 2 } },
  progressionGuidance:
    "Assistance Tuesday: paused dips / deadstop pull-ups 3x3–6 RIR 0–2. Independent progression from main lift.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Paused/deadstop assistance 3x3–6 RIR 0–2 (Tuesday).",
  userVisibleEvidenceLabel: "Assistance 3x3–6 RIR 0–2 (Tuesday)",
})

addRx({
  n: 3,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  levelScope: ["intermediate"],
  goalScope: ["weighted_pull_up", "weighted_dip"],
  exerciseRoleScope: ["pr_weighted_pull", "pr_weighted_dip"],
  repRangeJson: { min: 3, max: 6 },
  setRangeJson: { min: 1, max: 1 },
  restRangeJson: { minMinutes: 5, maxMinutes: 8 },
  rpeGuidanceJson: { rir: { min: 0, max: 0 } },
  progressionGuidance:
    "Friday PR: single set of 3–6 reps at RIR 0. PR-set reps determine next-cycle load increment.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule: "Single PR set of 3–6 reps at RIR 0 anchors weekly load progression.",
  userVisibleEvidenceLabel: "PR set 1x3–6 RIR 0 (Friday)",
})

addProgression({
  n: 1,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  skillKey: "weighted_pull_up",
  currentLevelKey: "intermediate_3x3_heavy_plus_pr",
  nextLevelKey: "intermediate_3x3_load_increment",
  minReadinessJson: { prSetReps: ">=4" },
  progressionRuleSummary:
    "If PR-set hits ≥4 reps at RIR 0, increment heavy/PR load next cycle by smallest available step.",
  cautionFlagsJson: ["watch_elbow_load", "watch_shoulder_load"],
  confidenceWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule:
    "PR-set rep count drives heavy/PR load increment for the next intermediate weighted cycle.",
  userVisibleEvidenceLabel: "PR reps drove next-cycle weighted load",
})

// [Rule D] pull-up/dip prerequisite gate (as contraindication)
addContra({
  n: 1,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  exerciseKey: "weighted_pull_up_heavy",
  blockedContextJson: { bodyweightPullUpsUnder: 15 },
  modificationGuidance:
    "If athlete cannot do 15+ strict bodyweight pull-ups, do not load with the heavy intermediate plan. Use bodyweight/banded/negative progressions first.",
  severity: "blocked",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  plainLanguageRule:
    "Weighted plan gated by bodyweight prerequisite: 15+ pull-ups, 20+ dips before heavy weighted plan applies.",
  userVisibleEvidenceLabel: "Weighted plan gated by bodyweight prerequisite",
  conflictGroup: "weighted_prerequisite",
})

addContra({
  n: 2,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  exerciseKey: "weighted_dip_heavy",
  blockedContextJson: { bodyweightDipsUnder: 20 },
  modificationGuidance:
    "If athlete cannot do 20+ bodyweight dips, do not run heavy intermediate weighted dip plan.",
  severity: "blocked",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Weighted dip plan gated by 20+ bodyweight dip prerequisite.",
  userVisibleEvidenceLabel: "Weighted dip gated by 20+ bodyweight dip prerequisite",
  conflictGroup: "weighted_prerequisite",
})

// [Rule E] early pull-up low-rep practice
addRx({
  n: 4,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  levelScope: ["beginner"],
  goalScope: ["pull_up_strength"],
  exerciseRoleScope: ["primary_pull"],
  repRangeJson: { min: 1, max: 3 },
  setRangeJson: { min: 6, max: 8 },
  restRangeJson: { minMinutes: 3, maxMinutes: 4 },
  rpeGuidanceJson: { rir: { min: 1, max: 2 } },
  progressionGuidance:
    "Athlete with 1–3 strict pull-ups: practice 6–8 sets of low reps with 3–4 minute rest. Add reps gradually toward 8 reps per set.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Low-rep pull-up practice (6–8 sets, 1–3 reps, 3–4 min rest) builds base capacity.",
  userVisibleEvidenceLabel: "Low-rep pull-up practice used to build base",
})

// [Rule F] pull-up 8-rep transition
addRx({
  n: 5,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  levelScope: ["beginner", "intermediate"],
  goalScope: ["pull_up_strength"],
  exerciseRoleScope: ["primary_pull"],
  repRangeJson: { min: 8, max: 15 },
  setRangeJson: { min: 3, max: 4 },
  restRangeJson: { minMinutes: 5, maxMinutes: 6 },
  rpeGuidanceJson: { rir: { min: 0, max: 1 } },
  progressionGuidance:
    "Once athlete hits ~8 reps per set, switch to 3–4 max-rep sets with 5–6 minute rest to build toward 15+ pull-ups.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule:
    "At 8-rep capacity, transition to 3–4 max-effort sets with 5–6 min rest to grow toward 15+ reps.",
  userVisibleEvidenceLabel: "Pull-up progression moved from low-rep practice to max-rep capacity work",
})

addPrinciple({
  n: 3,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  doctrineFamily: "intermediate_weighted_progression",
  principleKey: "session_role_spacing_intermediate",
  principleTitle: "Heavy / Assistance / PR sessions need spacing",
  principleSummary:
    "Heavy Mon, Assistance Tue, PR Fri preserves recovery between high-intent sessions. Avoid stacking heavy work back-to-back.",
  athleteLevelScope: ["intermediate"],
  goalScope: ["weighted_pull_up", "weighted_dip"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  computationFriendlyRule: { minRestDaysBetweenHeavyAndPr: 2 },
  userVisibleEvidenceLabel: "Heavy and PR sessions spaced for recovery",
})

addPrinciple({
  n: 4,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  doctrineFamily: "intermediate_weighted_progression",
  principleKey: "weekly_increment_driver",
  principleTitle: "Weekly increments are PR-set-driven, not arbitrary",
  principleSummary:
    "Do not increment load on the schedule alone. Let PR-set reps and RIR earn the next-cycle load step.",
  athleteLevelScope: ["intermediate"],
  goalScope: ["weighted_pull_up", "weighted_dip"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  computationFriendlyRule: { incrementGate: "pr_set_reps_and_rir" },
  userVisibleEvidenceLabel: "Load increments earned by PR-set performance",
})

addCarryover({
  n: 2,
  sourceId: MZ_SRC,
  sourceKey: MZ_KEY,
  sourceExerciseOrSkillKey: "paused_dip",
  targetSkillKey: "weighted_dip",
  carryoverType: "accessory",
  carryoverStrength: 0.7,
  rationale:
    "Paused dips train bottom-position strength and control, supporting heavy weighted dips without replacing them.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Paused dips support weighted-dip strength as independent assistance.",
  userVisibleEvidenceLabel: "Paused dip supports weighted dip (accessory)",
})

// =============================================================================
// SOURCE 3 — Forearm Health duplicate confirmation (4 atoms)
// =============================================================================

const FH_SRC = "src_batch_03_forearm_health_dup"
const FH_KEY = "forearm_health_uploaded_pdf_batch_03_duplicate_confirmation"

addRx({
  n: 6,
  sourceId: FH_SRC,
  sourceKey: FH_KEY,
  levelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["prehab", "wrist_forearm_support"],
  exerciseRoleScope: ["prehab_wrist_pronation"],
  repRangeJson: { min: 15, max: 15 },
  setRangeJson: { min: 2, max: 2 },
  restRangeJson: { minMinutes: 0, maxMinutes: 1 },
  progressionGuidance: "Wrist pronation 2x15 with short rest reaffirmed.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Wrist pronation 2x15 short-rest reaffirmed for forearm prehab confidence.",
  userVisibleEvidenceLabel: "Wrist pronation 2x15 (prehab)",
})

addRx({
  n: 7,
  sourceId: FH_SRC,
  sourceKey: FH_KEY,
  levelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["prehab", "wrist_forearm_support"],
  exerciseRoleScope: ["prehab_wrist_extension"],
  repRangeJson: { min: 15, max: 15 },
  setRangeJson: { min: 2, max: 2 },
  restRangeJson: { minMinutes: 0, maxMinutes: 1 },
  progressionGuidance: "Wrist extension 2x15 short-rest reaffirmed.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Wrist extension 2x15 short-rest reaffirmed for forearm prehab confidence.",
  userVisibleEvidenceLabel: "Wrist extension 2x15 (prehab)",
})

addRx({
  n: 8,
  sourceId: FH_SRC,
  sourceKey: FH_KEY,
  levelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["prehab", "wrist_forearm_support"],
  exerciseRoleScope: ["prehab_wrist_supination"],
  repRangeJson: { min: 15, max: 15 },
  setRangeJson: { min: 2, max: 2 },
  restRangeJson: { minMinutes: 0, maxMinutes: 1 },
  progressionGuidance: "Wrist supination 2x15 short-rest reaffirmed.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Wrist supination 2x15 short-rest reaffirmed for forearm prehab confidence.",
  userVisibleEvidenceLabel: "Wrist supination 2x15 (prehab)",
})

addRx({
  n: 9,
  sourceId: FH_SRC,
  sourceKey: FH_KEY,
  levelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["prehab", "wrist_forearm_support"],
  exerciseRoleScope: ["prehab_wrist_flexion"],
  repRangeJson: { min: 15, max: 15 },
  setRangeJson: { min: 2, max: 2 },
  restRangeJson: { minMinutes: 0, maxMinutes: 1 },
  progressionGuidance: "Wrist flexion 2x15 short-rest reaffirmed.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Wrist flexion 2x15 short-rest reaffirmed for forearm prehab confidence.",
  userVisibleEvidenceLabel: "Wrist flexion 2x15 (prehab)",
})

// =============================================================================
// SOURCE 4 — Kinevo Bodyweight Strength Foundation (10 atoms)
// =============================================================================

const KIN_SRC = "src_batch_03_kinevo_bw_foundation"
const KIN_KEY = "kinevo_bodyweight_strength_foundation_uploaded_pdf_batch_03"

// [Rule K] bodyweight leverage progression
addPrinciple({
  n: 5,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  doctrineFamily: "bodyweight_strength_foundation",
  principleKey: "leverage_progression",
  principleTitle: "Calisthenics progresses through leverage, not only added weight",
  principleSummary:
    "Bodyweight difficulty is adjusted by changing body position and leverage (e.g. tuck → straddle → full lever).",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["bodyweight_strength", "skill", "hypertrophy"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { trainingStyle: "calisthenics" },
  computationFriendlyRule: { progressionMode: "leverage_first" },
  userVisibleEvidenceLabel: "Bodyweight difficulty adjusted through leverage",
  conflictGroup: "progression_mode",
})

addPrinciple({
  n: 6,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  doctrineFamily: "bodyweight_strength_foundation",
  principleKey: "upper_body_calisthenics_focus",
  principleTitle: "Foundation program is upper-body calisthenics oriented",
  principleSummary:
    "Mission is strength, muscle, and coordination for upper-body bodyweight mastery; lower-body work supplements but is not the focus.",
  athleteLevelScope: ["beginner", "intermediate"],
  goalScope: ["bodyweight_strength"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Foundation focused on upper-body calisthenics",
})

addPrinciple({
  n: 7,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  doctrineFamily: "bodyweight_strength_foundation",
  principleKey: "regression_progression_pair",
  principleTitle: "Always provide a regression and a progression",
  principleSummary:
    "Each level pairs a regression (easier) and progression (harder) so the athlete can match current capacity.",
  athleteLevelScope: ["beginner", "intermediate"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Each level offers a regression and a progression",
})

// [Rule L] band equipment gate
addSelection({
  n: 4,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  exerciseKey: "banded_pull_up",
  roleKey: "primary_pull_assisted",
  levelScope: ["beginner"],
  equipmentRequirementsJson: { resistanceBand: true, pullUpBar: true },
  preferredWhenJson: { bodyweightPullUpsUnder: 8 },
  selectionWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "If athlete cannot perform 8 strict pull-ups, prefer banded pull-ups over weighted progressions.",
  userVisibleEvidenceLabel: "Equipment choice matched pull-up strength level (band gate)",
  conflictGroup: "weighted_prerequisite",
})

addSelection({
  n: 5,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  exerciseKey: "weighted_pull_up_light",
  roleKey: "primary_pull_loaded",
  levelScope: ["intermediate", "advanced"],
  equipmentRequirementsJson: { dipBelt: true, pullUpBar: true },
  preferredWhenJson: { bodyweightPullUpsAtLeast: 8 },
  selectionWeight: 0.7,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "Once athlete exceeds 8 strict pull-ups, free-weight loading becomes appropriate.",
  userVisibleEvidenceLabel: "Free-weight pull-up loading appropriate above 8-rep threshold",
  conflictGroup: "weighted_prerequisite",
})

addSelection({
  n: 6,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  exerciseKey: "ring_dip",
  roleKey: "primary_push",
  levelScope: ["intermediate"],
  equipmentRequirementsJson: { rings: true },
  selectionWeight: 0.6,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Rings recommended for intermediate dip variants when available.",
  userVisibleEvidenceLabel: "Rings used when available",
})

addProgression({
  n: 2,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  skillKey: "pull_up",
  currentLevelKey: "banded_pull_up",
  nextLevelKey: "strict_pull_up",
  minReadinessJson: { bandedReps: ">=10" },
  progressionRuleSummary: "Move from banded to strict once 10+ banded reps with light band are achieved.",
  confidenceWeight: 0.9,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Banded → strict pull-up once 10+ banded reps with light band are reliable.",
  userVisibleEvidenceLabel: "Banded → strict pull-up at 10+ light-band reps",
})

addCarryover({
  n: 3,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  sourceExerciseOrSkillKey: "banded_pull_up",
  targetSkillKey: "strict_pull_up",
  carryoverType: "prerequisite",
  carryoverStrength: 0.85,
  rationale:
    "Banded pull-ups develop the prerequisite pulling strength and pattern for strict pull-ups.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Banded pull-up is direct prerequisite for strict pull-up.",
  userVisibleEvidenceLabel: "Banded → strict pull-up (prerequisite)",
})

addPrinciple({
  n: 8,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  doctrineFamily: "bodyweight_strength_foundation",
  principleKey: "equipment_minimums",
  principleTitle: "Pull-up bar is the minimum required equipment",
  principleSummary:
    "Foundation requires a pull-up bar; rings and dip bar add value; bands assist sub-8-rep athletes.",
  athleteLevelScope: ["beginner", "intermediate"],
  priorityWeight: 1,
  priorityType: "hard_constraint",
  intelligenceTier: "base_week_intelligence",
  computationFriendlyRule: { equipmentMinimums: ["pull_up_bar"] },
  userVisibleEvidenceLabel: "Pull-up bar required; bands/rings/dip-bar enrich plan",
})

addPrinciple({
  n: 9,
  sourceId: KIN_SRC,
  sourceKey: KIN_KEY,
  doctrineFamily: "bodyweight_strength_foundation",
  principleKey: "coordination_alongside_strength",
  principleTitle: "Strength + muscle + coordination are co-trained",
  principleSummary:
    "Calisthenics targets strength, hypertrophy, and motor coordination together; do not isolate one at the cost of the others in foundation phase.",
  athleteLevelScope: ["beginner", "intermediate"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Coordination trained alongside strength and hypertrophy",
})

// =============================================================================
// SOURCE 5 — No-BS Nutrition System (8 atoms)
// =============================================================================

const NUT_SRC = "src_batch_03_no_bs_nutrition"
const NUT_KEY = "no_bs_nutrition_system_uploaded_pdf_batch_03"

// [Rule P] no spot-fat-loss / nutrition truth
addPrinciple({
  n: 10,
  sourceId: NUT_SRC,
  sourceKey: NUT_KEY,
  doctrineFamily: "nutrition_adherence_system",
  principleKey: "no_spot_fat_loss_truth",
  principleTitle: "Body composition follows energy balance + protein, not specific exercises",
  principleSummary:
    "Belly fat / weight goals depend primarily on calories, protein, consistency, and training. No exercise spot-burns fat.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["fat_loss", "muscle_gain", "general_fitness"],
  priorityWeight: 2,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: { allowSpotFatLossClaims: false },
  userVisibleEvidenceLabel: "Nutrition guidance focused on calories/protein/consistency",
  conflictGroup: "nutrition_truth",
})

// [Rule Q] nutrition adherence
addPrinciple({
  n: 11,
  sourceId: NUT_SRC,
  sourceKey: NUT_KEY,
  doctrineFamily: "nutrition_adherence_system",
  principleKey: "consistency_over_obsessive_tracking",
  principleTitle: "Long-term consistency beats obsessive macro counting (default)",
  principleSummary:
    "Default to simple, sustainable nutrition (calories + protein + consistency). Detailed tracking is opt-in for users who want it.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { userOptedIntoDetailedTracking: false },
  computationFriendlyRule: { defaultStyle: "calories_plus_protein", advancedStyle: "macro_tracking" },
  userVisibleEvidenceLabel: "Nutrition guidance prioritized consistency",
  conflictGroup: "nutrition_truth",
})

addPrinciple({
  n: 12,
  sourceId: NUT_SRC,
  sourceKey: NUT_KEY,
  doctrineFamily: "nutrition_adherence_system",
  principleKey: "calories_protein_anchor",
  principleTitle: "Calories and protein are the two anchors",
  principleSummary:
    "Right calorie target and adequate protein drive hypertrophy and leanness more than any micronutrient micromanagement.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Calories + protein are the anchor levers",
})

addPrinciple({
  n: 13,
  sourceId: NUT_SRC,
  sourceKey: NUT_KEY,
  doctrineFamily: "nutrition_adherence_system",
  principleKey: "strategic_cheat_meals",
  principleTitle: "Cheat meals can fit into adherence",
  principleSummary:
    "Strategic cheat meals do not destroy progress when overall consistency is maintained.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 0,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Adherence allows strategic flexibility",
})

addPrinciple({
  n: 14,
  sourceId: NUT_SRC,
  sourceKey: NUT_KEY,
  doctrineFamily: "nutrition_adherence_system",
  principleKey: "nutrition_supports_training",
  principleTitle: "Nutrition supports training and adaptation",
  principleSummary:
    "Diet should fuel training, recovery, and adaptation; do not pretend it replaces training stimulus.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Nutrition supports training, does not replace it",
})

addPrinciple({
  n: 15,
  sourceId: NUT_SRC,
  sourceKey: NUT_KEY,
  doctrineFamily: "nutrition_adherence_system",
  principleKey: "not_medical_advice",
  principleTitle: "Nutrition guidance is not medical advice",
  principleSummary:
    "Recommendations are general training-support nutrition. Athletes with medical conditions should consult a clinician.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 2,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: { allowMedicalAdviceFraming: false },
  userVisibleEvidenceLabel: "Nutrition guidance framed as non-medical",
  conflictGroup: "nutrition_truth",
})

addPrinciple({
  n: 16,
  sourceId: NUT_SRC,
  sourceKey: NUT_KEY,
  doctrineFamily: "nutrition_adherence_system",
  principleKey: "weight_goal_supports",
  principleTitle: "Weight goals are calorie-driven first",
  principleSummary:
    "Whether the goal is muscle gain or leanness, calorie target relative to maintenance comes before food-by-food choices.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["fat_loss", "muscle_gain"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Calorie target leads weight-goal logic",
})

addPrinciple({
  n: 17,
  sourceId: NUT_SRC,
  sourceKey: NUT_KEY,
  doctrineFamily: "nutrition_adherence_system",
  principleKey: "training_priority_over_nutrition_for_generation",
  principleTitle: "Nutrition does not override training generation",
  principleSummary:
    "Nutrition doctrine informs guidance and recovery; it must not override skill/strength program generation.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 2,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: { canOverrideTrainingGeneration: false },
  userVisibleEvidenceLabel: "Nutrition is supportive, not generative",
  conflictGroup: "nutrition_truth",
})

// =============================================================================
// SOURCE 6 — BSF Training Log / Warm-up / Hypertrophy (14 atoms)
// =============================================================================

const BSF_SRC = "src_batch_03_bsf_training_log"
const BSF_KEY = "bsf_training_log_warmup_hypertrophy_uploaded_pdf_batch_03"

// [Rule H] upper-body warm-up minimal-rest sequence
addMethod({
  n: 3,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  methodKey: "upper_body_warmup_minimal_rest",
  category: "warmup",
  compatibleGoalsJson: ["bodyweight_strength", "hypertrophy", "skill"],
  compatibleLevelsJson: ["beginner", "intermediate", "advanced"],
  bestUseCasesJson: ["before_upper_body_session"],
  structureBiasJson: {
    sequence: [
      "arm_circles",
      "cross_body_arm_swings",
      "shoulder_rotation",
      "trunk_rotation",
      "wrist_stretches",
      "child_pose_lat_stretch",
      "scap_pushup",
      "band_pull_apart_or_reverse_fly",
    ],
    interSetRest: "minimal",
  },
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "Before upper-body work, run an 8-piece minimal-rest warm-up covering shoulders, lats, scap, wrists.",
  userVisibleEvidenceLabel: "Upper-body warm-up prepared wrists/scap/shoulders/lats",
  conflictGroup: "warmup_structure",
})

// [Rule I] warm-up reps are readiness-guided
addPrinciple({
  n: 18,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  doctrineFamily: "warmup_structure",
  principleKey: "warmup_dosage_readiness_guided",
  principleTitle: "Warm-up reps are readiness-guided, not fixed",
  principleSummary:
    "Reps/holds in warm-up are guides; athlete should perform enough to feel warm, mobilized, and prepared rather than blindly counting.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  computationFriendlyRule: { warmupRepsAreFixed: false, repsAreReadinessGuides: true },
  userVisibleEvidenceLabel: "Warm-up dosage adjusted by readiness",
  conflictGroup: "warmup_structure",
})

// [Rule J] hypertrophy phase progression-stability
addProgression({
  n: 3,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  skillKey: "hypertrophy_phase_one",
  currentLevelKey: "phase_one_week_one",
  nextLevelKey: "phase_one_week_two",
  minReadinessJson: { weekOneCompleted: "true" },
  progressionRuleSummary:
    "Week-to-week, increase reps or sets while keeping the progression (exercise variant) constant. Target +1 rep per exercise vs Week 1.",
  cautionFlagsJson: ["avoid_swapping_progressions_within_phase"],
  confidenceWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule:
    "Hypertrophy Phase 1 holds the progression constant and advances reps/sets weekly (Week 2 = Week 1 +1 rep target).",
  userVisibleEvidenceLabel: "Progression held constant while reps/sets advanced",
  conflictGroup: "hypertrophy_progression",
})

addPrinciple({
  n: 19,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  doctrineFamily: "hypertrophy_phase",
  principleKey: "phase_one_three_sessions_per_week",
  principleTitle: "Phase 1 = 3 weekly sessions with rest day spacing",
  principleSummary:
    "Phase 1 has three workouts per week, each performed once with at least one rest day between.",
  athleteLevelScope: ["beginner", "intermediate"],
  goalScope: ["hypertrophy", "bodyweight_strength"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  computationFriendlyRule: { weeklySessions: 3, minRestDayBetweenSessions: 1 },
  userVisibleEvidenceLabel: "Phase 1: 3 sessions/week with spacing",
})

addPrinciple({
  n: 20,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  doctrineFamily: "hypertrophy_phase",
  principleKey: "select_progression_can_complete",
  principleTitle: "Select a progression you can actually complete for required reps/sets",
  principleSummary:
    "Athlete should pick the hardest variant they can still finish for prescribed reps/sets, not aspirational variants they cannot complete.",
  athleteLevelScope: ["beginner", "intermediate"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Variant selected by what athlete can complete",
})

addSelection({
  n: 7,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  exerciseKey: "pike_pushup_eccentric",
  roleKey: "primary_push_skill",
  levelScope: ["beginner", "intermediate"],
  preferredWhenJson: { goal: ["hypertrophy", "skill"] },
  selectionWeight: 0.7,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Pike push-up eccentric is a Phase-1 hybrid skill/hypertrophy choice.",
  userVisibleEvidenceLabel: "Pike push-up eccentric (Phase-1 hybrid)",
})

addSelection({
  n: 8,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  exerciseKey: "tuck_planche_lift",
  roleKey: "primary_skill",
  skillKey: "planche",
  levelScope: ["intermediate"],
  preferredWhenJson: { selectedSkillsIncludesAny: ["planche"] },
  selectionWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Tuck-planche lift represents the planche line in Phase 1.",
  userVisibleEvidenceLabel: "Tuck-planche lift represents planche line",
})

addSelection({
  n: 9,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  exerciseKey: "front_lever_concentric",
  roleKey: "primary_skill",
  skillKey: "front_lever",
  levelScope: ["intermediate"],
  preferredWhenJson: { selectedSkillsIncludesAny: ["front_lever"] },
  selectionWeight: 0.75,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Front-lever concentric is a Phase-1 skill expression.",
  userVisibleEvidenceLabel: "Front-lever concentric represents front-lever line",
})

addSelection({
  n: 10,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  exerciseKey: "archer_pushup_typewriter",
  roleKey: "accessory_push_unilateral",
  levelScope: ["intermediate"],
  selectionWeight: 0.55,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "Archer/typewriter push-up is unilateral push hypertrophy/control accessory in Phase 1.",
  userVisibleEvidenceLabel: "Archer/typewriter push-up (unilateral push)",
})

addSelection({
  n: 11,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  exerciseKey: "bent_arm_planche_lean",
  roleKey: "skill_isometric",
  skillKey: "planche",
  levelScope: ["intermediate"],
  preferredWhenJson: { selectedSkillsIncludesAny: ["planche"] },
  selectionWeight: 0.6,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Bent-arm planche lean develops planche-specific scapular protraction strength.",
  userVisibleEvidenceLabel: "Bent-arm planche lean for planche line",
})

addRx({
  n: 10,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  levelScope: ["beginner", "intermediate"],
  goalScope: ["hypertrophy"],
  exerciseRoleScope: ["primary_push", "primary_pull", "primary_skill"],
  repRangeJson: { progressionStable: true, weekOnePlusOneRepWeekTwo: true },
  setRangeJson: { progressionStable: true, weekOnePlusOneSetAllowed: true },
  progressionGuidance:
    "Week 2 target = Week 1 + 1 rep per exercise (or +1 set where reps cap is reached) while progression variant is held constant.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule: "Add reps/sets while keeping the progression variant constant.",
  userVisibleEvidenceLabel: "Reps/sets advance while variant stays constant",
  conflictGroup: "hypertrophy_progression",
})

addCarryover({
  n: 4,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  sourceExerciseOrSkillKey: "pull_up_eccentric",
  targetSkillKey: "front_lever",
  carryoverType: "indirect",
  carryoverStrength: 0.5,
  rationale:
    "Pull-up eccentric loads the lat and scapular retractor pattern shared with front-lever pulling.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Pull-up eccentric supports front-lever pulling capacity (indirect).",
  userVisibleEvidenceLabel: "Pull-up eccentric → front lever (indirect)",
})

addPrinciple({
  n: 21,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  doctrineFamily: "warmup_structure",
  principleKey: "warmup_protects_wrists_and_scap",
  principleTitle: "Wrist and scap warm-up protect upper-body skill work",
  principleSummary:
    "Wrist stretches and scap push-ups precede heavy push/pull and skill isometrics to reduce wrist/scap stress.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Wrist + scap warm-up protect skill work",
  conflictGroup: "warmup_structure",
})

addPrinciple({
  n: 22,
  sourceId: BSF_SRC,
  sourceKey: BSF_KEY,
  doctrineFamily: "hypertrophy_phase",
  principleKey: "hybrid_skill_hypertrophy_selection",
  principleTitle: "Phase 1 blends skill and hypertrophy on purpose",
  principleSummary:
    "Selection mixes skill expressions (tuck planche lift, front-lever concentric, bent-arm planche lean) with hypertrophy work (push-ups, rows, curls, tricep extension).",
  athleteLevelScope: ["beginner", "intermediate"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Phase 1 blends skill and hypertrophy lines",
})

// =============================================================================
// SOURCE 7 — Ian Barseagle Weighted & Bodyweight Calisthenics (14 atoms)
// =============================================================================

const IAN_SRC = "src_batch_03_ian_barseagle_weighted"
const IAN_KEY = "ian_barseagle_weighted_bodyweight_calisthenics_uploaded_pdf_batch_03"

// [Rule G] weighted movement ramp-up
addMethod({
  n: 4,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  methodKey: "weighted_movement_specific_rampup",
  category: "warmup",
  compatibleGoalsJson: ["weighted_pull_up", "weighted_dip", "strength"],
  compatibleLevelsJson: ["intermediate", "advanced"],
  bestUseCasesJson: ["before_weighted_dips_or_pull_ups"],
  structureBiasJson: {
    sequence: [
      "light_jog_or_dynamic",
      "dynamic_chest_shoulder_stretch",
      "bodyweight_reps",
      "approx_50_pct_working_load",
      "longer_rest_as_load_rises",
    ],
  },
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "Before weighted dips/pull-ups, ramp via dynamic stretches → bodyweight reps → ~50% working-load warm-up. Lengthen rest as load rises.",
  userVisibleEvidenceLabel: "Weighted ramp-up included bodyweight + partial-load warm-up",
  conflictGroup: "warmup_structure",
})

addRx({
  n: 11,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  levelScope: ["beginner"],
  goalScope: ["pull_up_strength"],
  exerciseRoleScope: ["primary_pull"],
  repRangeJson: { min: 1, max: 3 },
  setRangeJson: { min: 6, max: 8 },
  restRangeJson: { minMinutes: 3, maxMinutes: 4 },
  progressionGuidance:
    "1–3 strict pull-ups → 6–8 sets of low reps with 3–4 minute rest, gradually adding reps until 8 reps per set is reliable.",
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Low-rep practice ramps a sub-3-rep athlete toward 8 reps per set.",
  userVisibleEvidenceLabel: "Sub-3-rep athlete used 6–8 sets, low reps, 3–4 min rest",
})

addRx({
  n: 12,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  levelScope: ["intermediate"],
  goalScope: ["pull_up_strength"],
  exerciseRoleScope: ["primary_pull"],
  repRangeJson: { min: 8, max: 15 },
  setRangeJson: { min: 3, max: 4 },
  restRangeJson: { minMinutes: 5, maxMinutes: 6 },
  progressionGuidance:
    "After 8 reps capacity: 3–4 max-rep sets, 5–6 minute rest, building toward 15 strict pull-ups.",
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule:
    "8-rep capacity unlocks 3–4 max-rep sets with 5–6 min rest toward 15-rep capacity.",
  userVisibleEvidenceLabel: "Max-rep capacity work after 8-rep transition",
})

addRx({
  n: 13,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  levelScope: ["intermediate"],
  goalScope: ["weighted_dip"],
  exerciseRoleScope: ["primary_weighted_dip"],
  repRangeJson: { min: 3, max: 6 },
  setRangeJson: { min: 3, max: 5 },
  restRangeJson: { minMinutes: 3, maxMinutes: 5 },
  progressionGuidance:
    "Same low-rep / capacity ramp method applies for dips: build base reps, then add load.",
  priorityType: "soft_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule: "Pull-up ramp method is mirrored for dips.",
  userVisibleEvidenceLabel: "Dip ramp mirrors pull-up ramp",
})

addContra({
  n: 3,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  exerciseKey: "weighted_pull_up",
  blockedContextJson: { bodyweightPullUpsUnder: 15 },
  modificationGuidance:
    "Use negatives, banded pull-ups, and low-rep practice instead of weighted pull-ups until 15+ strict reps are reliable.",
  severity: "caution",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Hold weighted pull-up plan until 15+ strict reps. Use bands/negatives first.",
  userVisibleEvidenceLabel: "Negative/banded/low-rep before weighted plan",
  conflictGroup: "weighted_prerequisite",
})

addPrinciple({
  n: 23,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  doctrineFamily: "weighted_calisthenics_warmup",
  principleKey: "rest_scales_with_warmup_intensity",
  principleTitle: "Rest must scale up as warm-up intensity scales up",
  principleSummary:
    "Light warm-up uses short rest; ~50% load warm-up needs longer rest before working sets.",
  athleteLevelScope: ["intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  computationFriendlyRule: { restScalesWithLoad: true },
  userVisibleEvidenceLabel: "Rest grew with warm-up load",
  conflictGroup: "warmup_structure",
})

addPrinciple({
  n: 24,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  doctrineFamily: "weighted_calisthenics_warmup",
  principleKey: "blood_flow_band_warmup",
  principleTitle: "Light band back work primes blood flow before pulling",
  principleSummary:
    "Before pulling work, light band rows / pull-aparts increase blood flow around target muscles without fatiguing them.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Light band work primed pulling muscles",
})

addSelection({
  n: 12,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  exerciseKey: "negative_pull_up",
  roleKey: "primary_pull_eccentric",
  levelScope: ["beginner"],
  preferredWhenJson: { bodyweightPullUpsUnder: 1 },
  selectionWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "Athlete with 0 strict pull-ups uses controlled negatives to build initial pulling strength.",
  userVisibleEvidenceLabel: "Negative pull-up for sub-1-rep athletes",
})

addSelection({
  n: 13,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  exerciseKey: "banded_pull_up",
  roleKey: "primary_pull_assisted",
  levelScope: ["beginner"],
  preferredWhenJson: { bodyweightPullUpsBetween: { min: 0, max: 5 } },
  selectionWeight: 0.8,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Banded pull-ups support 0–5 rep athletes alongside negatives and low-rep practice.",
  userVisibleEvidenceLabel: "Banded pull-ups for 0–5 rep athletes",
})

addProgression({
  n: 4,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  skillKey: "pull_up",
  currentLevelKey: "low_rep_practice_under_8",
  nextLevelKey: "max_rep_capacity_8_to_15",
  minReadinessJson: { strictPullUpReps: ">=8" },
  progressionRuleSummary:
    "Once 8 strict reps are reliable, switch from low-rep practice to max-rep capacity work toward 15 reps.",
  cautionFlagsJson: ["watch_elbow", "watch_shoulder"],
  confidenceWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  plainLanguageRule: "8 strict reps unlocks max-rep capacity progression toward 15 strict reps.",
  userVisibleEvidenceLabel: "8-rep gate unlocked capacity work",
})

addProgression({
  n: 5,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  skillKey: "weighted_pull_up",
  currentLevelKey: "bodyweight_15_plus_reps",
  nextLevelKey: "weighted_intermediate_plan",
  minReadinessJson: { strictPullUpReps: ">=15", strictDipReps: ">=20" },
  progressionRuleSummary:
    "Heavy weighted plan applies after 15+ strict pull-ups and 20+ strict dips.",
  confidenceWeight: 1,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Bodyweight prerequisites must be met before weighted plan begins.",
  userVisibleEvidenceLabel: "Weighted plan unlocked at 15+/20+ bodyweight reps",
  conflictGroup: "weighted_prerequisite",
})

addPrinciple({
  n: 25,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  doctrineFamily: "weighted_calisthenics_warmup",
  principleKey: "movement_specific_warmup",
  principleTitle: "Warm-up reps mirror the working movement",
  principleSummary:
    "Movement-specific warm-up reps make the actual movement pattern ready, not generic stretching alone.",
  athleteLevelScope: ["intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Warm-up patterned the working movement",
})

addCarryover({
  n: 5,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  sourceExerciseOrSkillKey: "negative_pull_up",
  targetSkillKey: "strict_pull_up",
  carryoverType: "prerequisite",
  carryoverStrength: 0.8,
  rationale: "Eccentric pull-up loading builds first-rep capacity needed for strict pull-up.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Negative pull-up is a prerequisite carryover for the first strict pull-up.",
  userVisibleEvidenceLabel: "Negative pull-up → first strict pull-up (prerequisite)",
})

addPrinciple({
  n: 26,
  sourceId: IAN_SRC,
  sourceKey: IAN_KEY,
  doctrineFamily: "weighted_calisthenics_warmup",
  principleKey: "rest_before_working_sets",
  principleTitle: "Rest before working sets must be intentional",
  principleSummary:
    "After warm-up, take dedicated rest before first working set so the warm-up does not eat performance.",
  athleteLevelScope: ["intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Dedicated rest separated warm-up from working sets",
})

// =============================================================================
// SOURCE 8 — Flexibility Notes (12 atoms)
// =============================================================================

const FLEX_SRC = "src_batch_03_flexibility_notes"
const FLEX_KEY = "flexibility_notes_uploaded_pdf_batch_03"

// [Rule N] active vs passive flexibility distinction
addPrinciple({
  n: 27,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  doctrineFamily: "flexibility_mobility",
  principleKey: "active_vs_passive_flexibility",
  principleTitle: "Active and passive flexibility differ; skill needs active",
  principleSummary:
    "Passive stretching tolerates a range without contraction. Active flexibility holds range with contraction. Skill work needs active flexibility/mobility.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: { skillRequiresActiveFlexibility: true },
  userVisibleEvidenceLabel: "Mobility chosen for active skill control",
  conflictGroup: "flexibility_truth",
})

addPrinciple({
  n: 28,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  doctrineFamily: "flexibility_mobility",
  principleKey: "mobility_is_active_movement",
  principleTitle: "Mobility = active movement enabled by flexibility",
  principleSummary:
    "Mobility is movement under control through a range; flexibility alone is not sufficient for skill expression.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Mobility = active movement, not just stretch",
})

// [Rule O] flexibility injury-risk support (not eliminate)
addPrinciple({
  n: 29,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  doctrineFamily: "flexibility_mobility",
  principleKey: "flexibility_supports_not_eliminates_injury_risk",
  principleTitle: "Flexibility/mobility supports tolerance; pain rules still apply",
  principleSummary:
    "Mobility can reduce stress and improve tolerance, but does not eliminate injury risk. Pain rules still override training.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 2,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: { allowEliminatesInjuryRiskClaim: false },
  userVisibleEvidenceLabel: "Mobility supports tolerance; pain rules still apply",
  conflictGroup: "flexibility_truth",
})

// [Rule M] planche wrist mobility support
addPrinciple({
  n: 30,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  doctrineFamily: "flexibility_mobility",
  principleKey: "planche_wrist_mobility_support",
  principleTitle: "Planche forward lean stresses wrists; mobility support is required",
  principleSummary:
    "Planche pressure on wrists rises with forward lean. Wrist mobility/prehab must be emphasized when planche is selected or wrist discomfort exists.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["planche", "skill"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkillsIncludesAny: ["planche"], wristDiscomfortAny: true },
  computationFriendlyRule: { addWristMobility: true, addWristPrehab: true },
  userVisibleEvidenceLabel: "Planche wrist support added due to forward-lean demand",
  conflictGroup: "planche_safety",
})

addContra({
  n: 4,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  exerciseKey: "planche_lean",
  blockedJointJson: ["wrist"],
  blockedContextJson: { acuteWristPain: true },
  modificationGuidance:
    "If wrist pain is acute, postpone planche-lean work; substitute with paralette planche lean (neutral wrist) and increase wrist mobility/prehab.",
  severity: "blocked",
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Acute wrist pain blocks planche-lean variants until resolved.",
  userVisibleEvidenceLabel: "Planche-lean blocked on acute wrist pain",
  conflictGroup: "planche_safety",
})

addSelection({
  n: 14,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  exerciseKey: "wrist_mobility_prep_circuit",
  roleKey: "prehab_wrist",
  levelScope: ["intermediate", "advanced"],
  preferredWhenJson: { selectedSkillsIncludesAny: ["planche", "handstand", "manna"] },
  selectionWeight: 0.85,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule:
    "When planche, handstand, or manna are selected, prepend a wrist mobility prep circuit.",
  userVisibleEvidenceLabel: "Wrist mobility prep added for skill stress",
  conflictGroup: "planche_safety",
})

addSelection({
  n: 15,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  exerciseKey: "v_sit_progression",
  roleKey: "primary_skill_compression",
  skillKey: "v_sit",
  levelScope: ["intermediate", "advanced"],
  preferredWhenJson: { selectedSkillsIncludesAny: ["v_sit", "manna", "hollowback"] },
  selectionWeight: 0.7,
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule:
    "V-sit / manna / hollowback handstand explicitly require flexibility-loaded compression progressions.",
  userVisibleEvidenceLabel: "V-sit/manna/hollowback need flexibility-loaded progressions",
})

addPrinciple({
  n: 31,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  doctrineFamily: "flexibility_mobility",
  principleKey: "stretching_supports_recovery",
  principleTitle: "Stretching supports recovery and tendon tension reduction",
  principleSummary:
    "Targeted stretching can reduce tendon tension and assist recovery, complementing training.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Stretching supported recovery",
})

addPrinciple({
  n: 32,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  doctrineFamily: "flexibility_mobility",
  principleKey: "beginner_strength_lean_pressure",
  principleTitle: "Lower beginner strength forces more lean and wrist pressure",
  principleSummary:
    "Beginner planche athletes with lower strength take a steeper forward lean, which increases wrist load. Plan accordingly.",
  athleteLevelScope: ["beginner"],
  goalScope: ["planche"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  appliesWhen: { selectedSkillsIncludesAny: ["planche"], level: "beginner" },
  userVisibleEvidenceLabel: "Beginner planche forward lean increased wrist load",
  conflictGroup: "planche_safety",
})

addCarryover({
  n: 6,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  sourceExerciseOrSkillKey: "wrist_mobility_prep_circuit",
  targetSkillKey: "planche",
  carryoverType: "accessory",
  carryoverStrength: 0.6,
  rationale:
    "Wrist mobility/prehab supports tolerance for planche-related forward-lean wrist load.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Wrist mobility supports planche tolerance, not direct strength.",
  userVisibleEvidenceLabel: "Wrist mobility supports planche tolerance",
  conflictGroup: "planche_safety",
})

addMethod({
  n: 5,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  methodKey: "active_mobility_warmup",
  category: "warmup",
  compatibleGoalsJson: ["skill", "bodyweight_strength"],
  bestUseCasesJson: ["before_skill_isometric_work"],
  structureBiasJson: { preferActiveOverPassive: true },
  priorityType: "strong_preference",
  intelligenceTier: "base_week_intelligence",
  plainLanguageRule: "Before skill isometrics, prefer active mobility over static passive stretching.",
  userVisibleEvidenceLabel: "Active mobility before skill isometrics",
})

addPrinciple({
  n: 33,
  sourceId: FLEX_SRC,
  sourceKey: FLEX_KEY,
  doctrineFamily: "flexibility_mobility",
  principleKey: "stretch_tolerance_is_neural",
  principleTitle: "Flexibility includes stretch tolerance",
  principleSummary:
    "Range gains are partly neurological tolerance, not only tissue length. Consistent exposure matters.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Range improved partly via stretch tolerance",
})

// =============================================================================
// SOURCE 9 — Muscle & Strength Pyramid (18 atoms)
// =============================================================================

const PYR_SRC = "src_batch_03_mns_pyramid"
const PYR_KEY = "muscle_strength_pyramid_training_uploaded_pdf_batch_03"

// [Rule R] priority hierarchy (Helms pyramid)
addPrinciple({
  n: 34,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "pyramid_priority_hierarchy",
  principleTitle: "Big rocks beat small details",
  principleSummary:
    "Resolve programming conflicts by hierarchy: adherence → volume/intensity/frequency → progression → exercise selection → rest/tempo. Do not flip the order.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 3,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: {
    hierarchy: ["adherence", "vif", "progression", "exercise_selection", "rest_tempo"],
  },
  userVisibleEvidenceLabel: "Programming resolved by priority hierarchy",
  conflictGroup: "pyramid_resolution",
})

addPrinciple({
  n: 35,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "adherence_foundation",
  principleTitle: "Adherence is the foundation",
  principleSummary:
    "A realistic, enjoyable, flexible plan that the athlete actually follows beats a theoretically optimal plan they abandon.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 3,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Adherence treated as foundation",
  conflictGroup: "pyramid_resolution",
})

// [Rule S] VIF balance
addPrinciple({
  n: 36,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "vif_balance_against_recovery",
  principleTitle: "Volume / Intensity / Frequency must balance against recovery",
  principleSummary:
    "Do not push volume, intensity, and frequency aggressively at the same time. Recovery is the gating constraint.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: { simultaneousVifPushAllowed: false },
  userVisibleEvidenceLabel: "Volume/intensity/frequency balanced against recovery",
  conflictGroup: "pyramid_resolution",
})

addPrinciple({
  n: 37,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "volume_for_hypertrophy_diminishing_returns",
  principleTitle: "Hypertrophy volume has a recovery ceiling",
  principleSummary:
    "More volume helps hypertrophy up to a point, then becomes destructive without sufficient recovery.",
  athleteLevelScope: ["intermediate", "advanced"],
  goalScope: ["hypertrophy"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Hypertrophy volume capped by recovery",
})

addPrinciple({
  n: 38,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "intensity_is_rep_range_and_proximity",
  principleTitle: "Intensity = rep range and proximity to failure",
  principleSummary:
    "Intensity is captured by rep range and RPE/RIR proximity to failure, not load alone.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Intensity tracked by rep range + RIR/RPE",
})

addPrinciple({
  n: 39,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "frequency_supports_skill_practice",
  principleTitle: "Frequency aids skill learning and recovery",
  principleSummary:
    "Higher frequency helps skill learning and per-session manageability; recovery still constrains the upper bound.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Frequency aided skill practice",
})

addProgression({
  n: 6,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  skillKey: "novice_strength_progression",
  currentLevelKey: "novice_linear_progression",
  nextLevelKey: "intermediate_weekly_progression",
  minReadinessJson: { trainingAgeMonths: ">=6" },
  progressionRuleSummary:
    "Novices can linear-progress; intermediates need weekly modulation; advanced need block/phase modulation.",
  cautionFlagsJson: ["dont_apply_advanced_protocol_to_novice"],
  confidenceWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule:
    "Match progression structure to training age (novice / intermediate / advanced).",
  userVisibleEvidenceLabel: "Progression matched to training age",
})

addPrinciple({
  n: 40,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "deloads_are_legitimate",
  principleTitle: "Deloads / tapers / intro cycles are legitimate tools",
  principleSummary:
    "Reducing volume/intensity periodically is a legitimate strategy, not weakness; supports long-term progression.",
  athleteLevelScope: ["intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "phase_week_modulation",
  userVisibleEvidenceLabel: "Deload accepted as a legitimate tool",
})

// [Rule T] exercise selection specificity
addSelection({
  n: 16,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  exerciseKey: "specificity_first_selection",
  roleKey: "selection_meta",
  levelScope: ["beginner", "intermediate", "advanced"],
  preferredWhenJson: { goalAnyOf: ["skill", "strength"] },
  selectionWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule:
    "For strength/skill, exercise selection must be specific to the target movement; for hypertrophy, efficient compounds + targeted accessories.",
  userVisibleEvidenceLabel: "Exercise selection matched stated goal",
  conflictGroup: "pyramid_resolution",
})

addPrinciple({
  n: 41,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "weak_point_consideration",
  principleTitle: "Exercise selection considers weak points",
  principleSummary:
    "Selection should account for individual weak points alongside specificity, ROM, and movement pattern.",
  athleteLevelScope: ["intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Weak points reflected in selection",
})

addPrinciple({
  n: 42,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "rom_matters",
  principleTitle: "Range of motion matters in selection",
  principleSummary:
    "Full or skill-appropriate ROM is part of selection; collapsing ROM for cosmetic load is discouraged.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  userVisibleEvidenceLabel: "Selection respected appropriate ROM",
})

// [Rule U] rest-period specificity
addRx({
  n: 14,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  levelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["strength", "skill"],
  exerciseRoleScope: ["primary_strength", "primary_skill"],
  restRangeJson: { minMinutes: 3, maxMinutes: 6 },
  progressionGuidance:
    "Heavy strength/skill sets need 3–6 minutes rest; do not blindly apply short rest from hypertrophy circuits.",
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Heavy strength/skill rest 3–6 min; accessories/prehab can use shorter rest.",
  userVisibleEvidenceLabel: "Rest periods matched movement demand",
  conflictGroup: "rest_specificity",
})

addRx({
  n: 15,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  levelScope: ["beginner", "intermediate", "advanced"],
  goalScope: ["hypertrophy"],
  exerciseRoleScope: ["accessory", "prehab", "warmup"],
  restRangeJson: { minMinutes: 0, maxMinutes: 2 },
  progressionGuidance:
    "Accessory, prehab, warm-up, and pump-style work tolerate 0–2 minute rest.",
  priorityType: "soft_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule: "Short rest is for accessories/prehab/warm-up, not primary strength work.",
  userVisibleEvidenceLabel: "Short rest reserved for accessories",
  conflictGroup: "rest_specificity",
})

// [Rule V] tempo purpose
addMethod({
  n: 6,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  methodKey: "tempo_serves_intent",
  category: "tempo",
  compatibleGoalsJson: ["strength", "hypertrophy", "skill"],
  compatibleLevelsJson: ["beginner", "intermediate", "advanced"],
  bestUseCasesJson: ["control_under_load", "rings_tempo_work"],
  avoidUseCasesJson: ["arbitrarily_slow_tempo_that_kills_load_volume"],
  structureBiasJson: { tempoPurpose: "serve_goal", overSlowdownAllowed: false },
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  plainLanguageRule:
    "Tempo serves control and intent. Excessively slow tempo that destroys load/volume quality is discouraged unless source/method demands it.",
  userVisibleEvidenceLabel: "Tempo selected for control without killing training quality",
  conflictGroup: "tempo_truth",
})

addPrinciple({
  n: 43,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "autoregulation_is_a_tool",
  principleTitle: "Autoregulation is a legitimate tool",
  principleSummary:
    "Days off, load adjustments, deloads, and exercise swaps are valid responses to readiness without breaking the plan.",
  athleteLevelScope: ["intermediate", "advanced"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "phase_week_modulation",
  computationFriendlyRule: { autoregulationAllowed: true },
  userVisibleEvidenceLabel: "Autoregulation used to protect long-term progress",
})

addPrinciple({
  n: 44,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "pyramid_does_not_override_calisthenics_specifics",
  principleTitle: "Pyramid principles do not flatten calisthenics-specific doctrine",
  principleSummary:
    "Helms-style hierarchy resolves general programming conflicts but must yield to skill-specific doctrine when the specific source is more directly applicable (e.g. planche wrist support).",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 2,
  priorityType: "hard_constraint",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: { specificBeatsGeneralWhenDomainMatch: true },
  userVisibleEvidenceLabel: "Specific calisthenics doctrine outranked general hierarchy when domain matched",
  conflictGroup: "pyramid_resolution",
})

addPrinciple({
  n: 45,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "movement_pattern_balance",
  principleTitle: "Movement-pattern balance is part of selection",
  principleSummary:
    "Push/pull, hinge/squat, and skill expressions should balance over the week; do not over-index one pattern.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 1,
  priorityType: "soft_preference",
  intelligenceTier: "base_week_intelligence",
  userVisibleEvidenceLabel: "Movement patterns balanced over the week",
})

addPrinciple({
  n: 46,
  sourceId: PYR_SRC,
  sourceKey: PYR_KEY,
  doctrineFamily: "pyramid_priority_hierarchy",
  principleKey: "recovery_is_active_lever",
  principleTitle: "Recovery (sleep, stress, fatigue) is an active programming lever",
  principleSummary:
    "Recovery state modulates volume, intensity, and frequency in real time; ignore it and the rest of the hierarchy collapses.",
  athleteLevelScope: ["beginner", "intermediate", "advanced"],
  priorityWeight: 2,
  priorityType: "strong_preference",
  intelligenceTier: "cross_cutting",
  computationFriendlyRule: { recoveryModulatesVif: true },
  userVisibleEvidenceLabel: "Recovery state modulated weekly load",
  conflictGroup: "pyramid_resolution",
})

// =============================================================================
// PUBLIC ACCESSORS
// =============================================================================

export function getBatch03Sources(): DoctrineSource[] {
  return [...SOURCES]
}
export function getBatch03Principles(): DoctrinePrinciple[] {
  return [...PRINCIPLES]
}
export function getBatch03ProgressionRules(): ProgressionRule[] {
  return [...PROGRESSION_RULES]
}
export function getBatch03ExerciseSelectionRules(): ExerciseSelectionRule[] {
  return [...SELECTION_RULES]
}
export function getBatch03ContraindicationRules(): ContraindicationRule[] {
  return [...CONTRA_RULES]
}
export function getBatch03MethodRules(): MethodRule[] {
  return [...METHOD_RULES]
}
export function getBatch03PrescriptionRules(): PrescriptionRule[] {
  return [...RX_RULES]
}
export function getBatch03CarryoverRules(): CarryoverRule[] {
  return [...CARRYOVER_RULES]
}
export function getBatch03ProvenanceFor(atomId: string): Batch03Provenance | null {
  return PROVENANCE.get(atomId) ?? null
}

export function getBatch03Counts(): Batch03Counts {
  return {
    sources: SOURCES.length,
    principles: PRINCIPLES.length,
    progressionRules: PROGRESSION_RULES.length,
    exerciseSelectionRules: SELECTION_RULES.length,
    contraindicationRules: CONTRA_RULES.length,
    methodRules: METHOD_RULES.length,
    prescriptionRules: RX_RULES.length,
    carryoverRules: CARRYOVER_RULES.length,
    total:
      PRINCIPLES.length +
      PROGRESSION_RULES.length +
      SELECTION_RULES.length +
      CONTRA_RULES.length +
      METHOD_RULES.length +
      RX_RULES.length +
      CARRYOVER_RULES.length,
  }
}

export function getBatch03CountsBySource(): Record<string, number> {
  const out: Record<string, number> = {}
  const all: { sourceId: string }[] = [
    ...PRINCIPLES,
    ...PROGRESSION_RULES,
    ...SELECTION_RULES,
    ...CONTRA_RULES,
    ...METHOD_RULES,
    ...RX_RULES,
    ...CARRYOVER_RULES,
  ]
  // Map sourceId → sourceKey for human-readable counts.
  const idToKey = new Map(SOURCES.map((s) => [s.id, s.sourceKey]))
  for (const a of all) {
    const key = idToKey.get(a.sourceId) ?? a.sourceId
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}
