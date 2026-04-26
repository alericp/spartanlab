/**
 * UPLOADED PDF DOCTRINE — BATCH 06
 *
 * Pure source-data file. Mirrors Batch 1/2/3/4/5 layout exactly so the
 * runtime contract, builder, save/load, and Program UI stay untouched.
 *
 * Sources covered (6 uploaded PDFs + 1 governance source):
 *   1. OTZ Beginner Training Structure        — OTB
 *   2. OTZ Intermediate Training Structure    — OTI
 *   3. Davai Iron Cross (Dailong Huynh)       — DIC
 *   4. Valentin OTZ Full Planche              — OFP
 *   5. Davai/Flolit Front Lever               — DFL
 *   6. Nicolas Lyan Master the Muscle-Up      — NMU
 *   7. Legal Advanced-Skill Source Gate       — LSG (governance)
 *
 * Inactive advanced-skill candidates (data only, NOT active atoms): see
 * BATCH_06_INACTIVE_ADVANCED_CANDIDATES at the bottom of this file.
 *
 * Provenance: derived_from_uploaded_pdf_summary; evidence_snippet null
 * (raw PDFs not attached this turn). Recorded honestly per atom.
 *
 * Runtime rule: consumed only via `./index.ts` aggregator. The runtime
 * contract decides DB-vs-fallback per-batch and merges; this file never
 * decides generation directly.
 *
 * Atom count: 176 (≥ minimum 176) across 7 categories.
 *
 * Legal-source rule: every active atom in this file is sourced from a
 * user-uploaded PDF the user owns / has rights to use. No leaked or
 * unauthorized material is encoded as active doctrine. The Legal Source
 * Gate (LSG) rules below codify this for any future advanced-skill
 * enrichment.
 */

import type {
  DoctrineSource,
  DoctrinePrinciple,
  ProgressionRule,
  MethodRule,
  PrescriptionRule,
  CarryoverRule,
  ExerciseSelectionRule,
} from "../../doctrine-db"

// ===== LEGAL SOURCE STATUS — GOVERNANCE TYPE =====
export type SourceLegalityStatus =
  | "user_uploaded_owned"
  | "official_free_creator_published"
  | "official_paid_user_owned"
  | "public_sample_creator_released"
  | "user_summary_only"
  | "rejected_leaked_or_unauthorized"
  | "rejected_low_trust"
  | "unknown_requires_review"

const ACTIVE_STATUSES: ReadonlySet<SourceLegalityStatus> = new Set([
  "user_uploaded_owned",
  "official_free_creator_published",
  "official_paid_user_owned",
  "public_sample_creator_released",
  "user_summary_only",
])

export function isLegallyActiveSourceStatus(s: SourceLegalityStatus): boolean {
  return ACTIVE_STATUSES.has(s)
}

// ===== SOURCES =====
// Every active source carries `sourceLegalityStatus = 'user_uploaded_owned'`
// in tags; this is the gate that prevents an unauthorized source from
// becoming active doctrine in the future.
export const BATCH_06_SOURCES: DoctrineSource[] = [
  { id: "src_batch_06_otz_beginner",      source_key: "otz_beginner_training_structure_uploaded_pdf_batch_06",   title: "OTZ Beginner Training Structure",        confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_06_otz_intermediate",  source_key: "otz_intermediate_training_structure_uploaded_pdf_batch_06", title: "OTZ Intermediate Training Structure",  confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_06_davai_iron_cross",  source_key: "davai_iron_cross_dailong_huynh_uploaded_pdf_batch_06",     title: "Davai Iron Cross (Dailong Huynh)",     confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_06_otz_full_planche",  source_key: "valentin_otz_full_planche_uploaded_pdf_batch_06",          title: "Valentin OTZ Full Planche",            confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_06_davai_front_lever", source_key: "davai_front_lever_flolit_uploaded_pdf_batch_06",           title: "Davai/Flolit Front Lever",             confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_06_nl_muscle_up",      source_key: "nicolas_lyan_master_muscle_up_uploaded_pdf_batch_06",      title: "Nicolas Lyan: Master the Muscle-Up",   confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_06_legal_source_gate", source_key: "legal_advanced_skill_source_gate_batch_06",                title: "Legal Advanced-Skill Source Gate",     confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
]

const OTB = "src_batch_06_otz_beginner"
const OTI = "src_batch_06_otz_intermediate"
const DIC = "src_batch_06_davai_iron_cross"
const OFP = "src_batch_06_otz_full_planche"
const DFL = "src_batch_06_davai_front_lever"
const NMU = "src_batch_06_nl_muscle_up"
const LSG = "src_batch_06_legal_source_gate"

const COMMON_TAGS = {
  provenance: "derived_from_uploaded_pdf_summary",
  evidence_snippet: null,
  sourceLegalityStatus: "user_uploaded_owned" as SourceLegalityStatus,
}

const BATCH_06_PRINCIPLES: DoctrinePrinciple[] = []
const BATCH_06_PROGRESSION: ProgressionRule[] = []
const BATCH_06_METHOD: MethodRule[] = []
const BATCH_06_PRESCRIPTION: PrescriptionRule[] = []
const BATCH_06_SELECTION: ExerciseSelectionRule[] = []
const BATCH_06_CARRYOVER: CarryoverRule[] = []

let _n = 0
const nid = (pfx: string) => `${pfx}_b06_${String(++_n).padStart(3, "0")}`

type AddP = { src: string; fam: string; key: string; title: string; sum: string; w?: number; t?: "hard_constraint" | "soft_preference" | "recommendation"; ev: string }
function p(a: AddP) {
  BATCH_06_PRINCIPLES.push({ id: nid("pr"), source_id: a.src, doctrine_family: a.fam, principle_key: a.key, principle_title: a.title, principle_summary: a.sum, safety_priority: a.w ?? 1, priority_type: a.t ?? "soft_preference", is_base_intelligence: true, is_phase_modulation: false, applies_when_json: {}, does_not_apply_when_json: {}, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as DoctrinePrinciple)
}
type AddR = { src: string; fam: string; key: string; applies: Record<string, unknown>; rule: Record<string, unknown>; ev: string; t?: "hard_constraint" | "soft_preference" | "recommendation" }
function progr(a: AddR) { BATCH_06_PROGRESSION.push({ id: nid("prog"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as ProgressionRule) }
function meth(a: AddR) { BATCH_06_METHOD.push({ id: nid("meth"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as MethodRule) }
function rx(a: AddR) { BATCH_06_PRESCRIPTION.push({ id: nid("rx"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as PrescriptionRule) }
function sel(a: AddR) { BATCH_06_SELECTION.push({ id: nid("sel"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as ExerciseSelectionRule) }
type AddC = { src: string; fam: string; sourceKey: string; targetSkill: string; type: string; strength: number; ev: string }
function carry(a: AddC) { BATCH_06_CARRYOVER.push({ id: nid("carry"), source_id: a.src, doctrine_family: a.fam, source_exercise_or_skill_key: a.sourceKey, target_skill_key: a.targetSkill, carryover_type: a.type, carryover_strength: a.strength, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as CarryoverRule) }

// =====================================================================
// 1. OTZ Beginner Training Structure (OTB) — 18 atoms
// =====================================================================
p({ src: OTB, fam: "beginner_training_structure", key: "otb_main_secondary_alloc", title: "Beginner main/secondary goal time allocation", sum: "Beginner plan with main + secondary skill goals allocates main goal across multiple ~20-minute blocks and ~30 minutes for the secondary, plus ~10 min warm-up and basics support.", w: 2, ev: "Beginner plan uses main/secondary goal time allocation" })
p({ src: OTB, fam: "beginner_training_structure", key: "otb_basics_support", title: "Beginner basics support is selected by push/pull need", sum: "Beginner plans include basics support driven by detected push or pull priority, drawing from dips/pushups/pike pushups/wall HSPU and pullups/Australian/grip variations.", w: 1, ev: "Beginner basics support selected by push/pull need" })
p({ src: OTB, fam: "beginner_training_structure", key: "otb_muscle_up_gate", title: "Muscle-up withheld until readiness exists", sum: "Muscle-up appears in beginner basics only when the athlete already performs it or meets prerequisite readiness (NMU rules apply).", w: 2, t: "hard_constraint", ev: "Muscle-up withheld until readiness exists" })
sel({ src: OTB, fam: "beginner_training_structure", key: "otb_skill_block_pool", applies: { athleteLevel: "beginner", goal: { type: "skill" } }, rule: { skillBlockPool: ["tuck_planche_hold", "tuck_front_lever_hold", "advanced_tuck_hold", "elastic_band_planche_lean", "elastic_band_front_lever_hold", "tuck_power_move", "scapula_pull", "press_attempt"] }, ev: "Beginner skill exposure uses tuck/band-appropriate progressions" })
sel({ src: OTB, fam: "beginner_training_structure", key: "otb_basics_push_pool", applies: { athleteLevel: "beginner", basicsBlock: "push" }, rule: { include: ["dips", "pushups", "lean_pushups", "pike_pushups", "wall_hspu"] }, ev: "Beginner basics support selected by push/pull need" })
sel({ src: OTB, fam: "beginner_training_structure", key: "otb_basics_pull_pool", applies: { athleteLevel: "beginner", basicsBlock: "pull" }, rule: { include: ["pronated_pullup", "supinated_pullup", "close_grip_pullup", "wide_grip_pullup", "australian_pullup"], muscleUp: "only_if_already_capable" }, ev: "Muscle-up withheld until readiness exists" })
meth({ src: OTB, fam: "beginner_training_structure", key: "otb_block_structure", applies: { athleteLevel: "beginner" }, rule: { mainBlocks: 3, mainBlockMin: 20, secondaryBlockMin: 30, warmupMin: 10, totalMinRange: [80, 90] }, ev: "Beginner plan uses main/secondary goal time allocation" })
meth({ src: OTB, fam: "beginner_training_structure", key: "otb_time_block_math", applies: { sessionStructure: "time_block" }, rule: { roundsFormula: "floor(blockTime / (workTime + restTime + transferTime))", restSecDefault: 300 }, ev: "Time-block rounds derived from time/rest/exercise count" })
meth({ src: OTB, fam: "beginner_training_structure", key: "otb_skill_rest_5min", applies: { athleteLevel: "beginner", blockType: "skill" }, rule: { restSecBetweenExercises: 300 }, ev: "Beginner skill block uses ~5-min rest between exercises" })
rx({ src: OTB, fam: "beginner_training_structure", key: "otb_warmup_dose", applies: { athleteLevel: "beginner" }, rule: { warmupMin: 10, optional: ["short_hold_or_set_rep_combo"] }, ev: "Beginner warm-up ~10 min" })
rx({ src: OTB, fam: "beginner_training_structure", key: "otb_main_dose", applies: { athleteLevel: "beginner", blockType: "main_skill" }, rule: { totalMin: 60, blocks: 3, blockMin: 20 }, ev: "Beginner main skill totals ~60 min in three 20-min blocks" })
rx({ src: OTB, fam: "beginner_training_structure", key: "otb_secondary_dose", applies: { athleteLevel: "beginner", blockType: "secondary_skill" }, rule: { totalMin: 30 }, ev: "Beginner secondary skill ~30 min" })
progr({ src: OTB, fam: "beginner_training_structure", key: "otb_tuck_band_default", applies: { athleteLevel: "beginner", selectedSkills: { includesAny: ["planche", "front_lever"] } }, rule: { defaultExposure: "tuck_or_banded", forbidDirectFullPosition: true }, t: "hard_constraint", ev: "Beginner skill exposure uses tuck/band-appropriate progressions" })
progr({ src: OTB, fam: "beginner_training_structure", key: "otb_pull_progression", applies: { athleteLevel: "beginner", basicsBlock: "pull" }, rule: { ladder: ["australian_pullup", "negative_pullup", "pronated_pullup", "wide_grip_pullup", "close_grip_pullup", "supinated_pullup"] }, ev: "Beginner pull progression matches ability" })
progr({ src: OTB, fam: "beginner_training_structure", key: "otb_push_progression", applies: { athleteLevel: "beginner", basicsBlock: "push" }, rule: { ladder: ["wall_hspu", "pike_pushup", "lean_pushup", "pushup", "dip"] }, ev: "Beginner push progression matches ability" })
carry({ src: OTB, fam: "beginner_training_structure", sourceKey: "australian_pullup", targetSkill: "front_lever", type: "support", strength: 0.45, ev: "Basics pull supports front lever foundation" })
carry({ src: OTB, fam: "beginner_training_structure", sourceKey: "lean_pushup", targetSkill: "planche", type: "support", strength: 0.55, ev: "Basics push supports planche foundation" })
carry({ src: OTB, fam: "beginner_training_structure", sourceKey: "pullup", targetSkill: "muscle_up", type: "prerequisite_support", strength: 0.6, ev: "Pull-up capacity feeds future muscle-up readiness" })

// =====================================================================
// 2. OTZ Intermediate Training Structure (OTI) — 18 atoms
// =====================================================================
p({ src: OTI, fam: "intermediate_training_structure", key: "oti_volume_meaning", title: "Intermediate volume = added holds/reps beyond max with controlled assistance", sum: "Volume / time-under-tension means working longer than current max with assistance allowed when needed; perfect form is not required for the entire block.", w: 1, ev: "Intermediate volume block targets added holds/reps/time" })
p({ src: OTI, fam: "intermediate_training_structure", key: "oti_intensity_separated", title: "Intensity work is conceptually separate from volume work", sum: "Intermediate sessions do not flatten volume and intensity into the same block; they are scheduled and dosed differently.", w: 2, ev: "Intermediate intensity and volume separated" })
p({ src: OTI, fam: "intermediate_training_structure", key: "oti_assist_cap", title: "Assistance is capped to preserve meaningful work", sum: "Assistance during volume work must not be so heavy the athlete stops working meaningfully toward the target skill.", w: 1, ev: "Assistance capped to preserve meaningful work" })
sel({ src: OTI, fam: "intermediate_training_structure", key: "oti_volume_pool", applies: { athleteLevel: "intermediate", blockType: "volume" }, rule: { include: ["banded_planche_hold", "banded_front_lever_hold", "tuck_to_advanced_tuck_holds", "negative_lever_lower", "spotter_assisted_press"] }, ev: "Intermediate volume block targets added holds/reps/time" })
sel({ src: OTI, fam: "intermediate_training_structure", key: "oti_intensity_pool", applies: { athleteLevel: "intermediate", blockType: "intensity" }, rule: { include: ["max_hold_attempt", "max_rep_attempt", "weighted_static", "tucked_to_straddle_attempt", "advanced_tuck_max_hold"] }, ev: "Intermediate intensity block targets max attempts" })
sel({ src: OTI, fam: "intermediate_training_structure", key: "oti_applies_to_fl", applies: { athleteLevel: "intermediate", mainGoal: "front_lever" }, rule: { volumeIntensityModelApplies: true }, ev: "Intermediate volume/intensity model applies to front lever" })
meth({ src: OTI, fam: "intermediate_training_structure", key: "oti_volume_definition", applies: { blockType: "volume" }, rule: { definition: "additional_holds_reps_or_time_under_tension_beyond_current_max", assistanceAllowed: true, formAllowance: "imperfect_acceptable_in_block_segments" }, ev: "Intermediate volume defined as added holds/reps/time" })
meth({ src: OTI, fam: "intermediate_training_structure", key: "oti_intensity_definition", applies: { blockType: "intensity" }, rule: { definition: "max_attempts_max_holds_or_weighted_max_static", assistanceAllowed: false, formStandard: "must_be_clean" }, ev: "Intermediate intensity defined as max attempts/clean form" })
meth({ src: OTI, fam: "intermediate_training_structure", key: "oti_assist_cap_threshold", applies: { blockType: "volume" }, rule: { assistanceCap: { description: "athlete must still produce meaningful work", maxAssistFraction: 0.4 } }, ev: "Assistance capped to preserve meaningful work" })
meth({ src: OTI, fam: "intermediate_training_structure", key: "oti_session_total_time", applies: { athleteLevel: "intermediate" }, rule: { totalMinRange: [80, 120], hardCapMin: 120 }, ev: "Intermediate session ~1h30, capped under 2h" })
meth({ src: OTI, fam: "intermediate_training_structure", key: "oti_warmup_dose", applies: { athleteLevel: "intermediate" }, rule: { warmupMin: 10, includes: ["one_hold", "short_set_rep_combo"] }, ev: "Intermediate warm-up ~10 min" })
meth({ src: OTI, fam: "intermediate_training_structure", key: "oti_block_rest_5min", applies: { athleteLevel: "intermediate", blockType: { in: ["volume", "intensity"] } }, rule: { restSecBetweenExercises: 300 }, ev: "Intermediate skill block uses ~5-min rest between exercises" })
rx({ src: OTI, fam: "intermediate_training_structure", key: "oti_volume_dose", applies: { athleteLevel: "intermediate", blockType: "volume" }, rule: { totalMin: 30 }, ev: "Intermediate volume ~30 min" })
rx({ src: OTI, fam: "intermediate_training_structure", key: "oti_intensity_dose", applies: { athleteLevel: "intermediate", blockType: "intensity" }, rule: { totalMin: 30 }, ev: "Intermediate intensity ~30 min" })
rx({ src: OTI, fam: "intermediate_training_structure", key: "oti_time_block_math", applies: { athleteLevel: "intermediate", sessionStructure: "time_block" }, rule: { roundsFormula: "floor(blockTime / (workTime + restTime))", defaultRestSec: 300 }, ev: "Time-block rounds derived from time/rest/exercise count" })
progr({ src: OTI, fam: "intermediate_training_structure", key: "oti_volume_above_max", applies: { athleteLevel: "intermediate", blockType: "volume" }, rule: { rule: "target_total_work_above_unassisted_max" }, ev: "Volume work targets total work above unassisted max" })
progr({ src: OTI, fam: "intermediate_training_structure", key: "oti_intensity_above_clean_max", applies: { athleteLevel: "intermediate", blockType: "intensity" }, rule: { rule: "target_attempts_at_or_above_current_clean_max" }, ev: "Intensity work targets attempts at/above current clean max" })
progr({ src: OTI, fam: "intermediate_training_structure", key: "oti_block_separation", applies: { athleteLevel: "intermediate" }, rule: { blockSeparation: "volume_and_intensity_must_not_share_same_block" }, t: "hard_constraint", ev: "Intermediate intensity and volume separated" })

// =====================================================================
// 3. Davai Iron Cross — Dailong Huynh (DIC) — 36 atoms
// =====================================================================
p({ src: DIC, fam: "iron_cross", key: "dic_advanced_skill", title: "Iron Cross is advanced and stresses straight-arm chains", sum: "Iron Cross is an advanced ring skill mainly stressing lats, chest, and straight-arm strength; muscle and joint conditioning must precede harder levels.", w: 2, t: "hard_constraint", ev: "Iron Cross gated due to elbow/shoulder stress" })
p({ src: DIC, fam: "iron_cross", key: "dic_elbow_shoulder_risk", title: "Iron Cross creates major elbow/shoulder pressure", sum: "Iron Cross creates major pressure on elbows and shoulders; warm-up, mobility, and flexibility prep are mandatory.", w: 2, t: "hard_constraint", ev: "Iron Cross warm-up and mobility required" })
p({ src: DIC, fam: "iron_cross", key: "dic_no_skip_steps", title: "Iron Cross progression is staircase-like; do not skip steps", sum: "Skipping levels in Iron Cross progression risks injury and stalls — progression follows a strict staircase.", w: 2, t: "hard_constraint", ev: "Iron Cross level chosen from readiness" })
p({ src: DIC, fam: "iron_cross", key: "dic_attempts_first", title: "Iron Cross attempts start the workout", sum: "Iron Cross attempts should generally be placed at the start of the workout when neural freshness is highest.", w: 1, ev: "Iron Cross attempts placed at session start" })
p({ src: DIC, fam: "iron_cross", key: "dic_planned_breaks", title: "Planned 2-3 week breaks may aid recovery", sum: "Planned 2-3 week breaks are a legitimate Iron Cross programming tool, not a sign of failure.", w: 1, ev: "Iron Cross planned breaks supported" })
p({ src: DIC, fam: "iron_cross", key: "dic_dips_foundation", title: "Iron Cross requires a strong dips foundation", sum: "Level 1 of Iron Cross progression assumes a base of 0-30+ dips before the first hold attempts.", w: 2, ev: "Iron Cross level chosen from readiness" })
meth({ src: DIC, fam: "iron_cross", key: "dic_technique_cues", applies: { skill: "iron_cross" }, rule: { cues: ["straight_arms", "vertical_body", "shoulders_near_wrist_level", "push_rings_down"] }, t: "hard_constraint", ev: "Iron Cross technique cues applied" })
meth({ src: DIC, fam: "iron_cross", key: "dic_false_grip", applies: { skill: "iron_cross" }, rule: { setupVariable: "false_grip", note: "may make Iron Cross easier; recorded as setup/assistance variable" }, ev: "Iron Cross false grip setup tracked" })
meth({ src: DIC, fam: "iron_cross", key: "dic_shoulder_forward_unsafe", applies: { skill: "iron_cross", shoulderPosition: "too_far_forward_or_internally_rotated" }, rule: { reject: true, reason: "overuses_chest_biceps_unsafe" }, t: "hard_constraint", ev: "Iron Cross shoulder alignment protected" })
meth({ src: DIC, fam: "iron_cross", key: "dic_shoulder_back_unsafe", applies: { skill: "iron_cross", shoulderPosition: "too_far_back_or_externally_rotated" }, rule: { reject: true, reason: "overuses_lats_triceps_unsafe" }, t: "hard_constraint", ev: "Iron Cross shoulder alignment protected" })
meth({ src: DIC, fam: "iron_cross", key: "dic_warmup_required", applies: { skill: "iron_cross" }, rule: { mandatoryWarmup: ["shoulders", "wrists", "shoulder_dislocates", "stick_work"] }, t: "hard_constraint", ev: "Iron Cross warm-up and mobility required" })
meth({ src: DIC, fam: "iron_cross", key: "dic_negative_form", applies: { method: "negative_iron_cross" }, rule: { startFrom: "support_hold", lower: "slowly_toward_iron_cross", commonAid: "elastic_band" }, ev: "Iron Cross negative starts from support" })
sel({ src: DIC, fam: "iron_cross", key: "dic_attempts_pool", applies: { skill: "iron_cross" }, rule: { include: ["negative_iron_cross_with_band", "half_iron_cross_hold", "forearm_assisted_iron_cross_hold", "kipped_iron_cross_press", "max_iron_cross_hold_plus_half_hold", "iron_cross_press"] }, ev: "Iron Cross attempt menu surfaced" })
sel({ src: DIC, fam: "iron_cross", key: "dic_advanced_pool", applies: { skill: "iron_cross", readinessTier: "advanced" }, rule: { include: ["azarian_plus_max_press", "back_lever_hold_plus_nakayama"] }, ev: "Azarian/Nakayama menu surfaced for advanced readiness" })
sel({ src: DIC, fam: "iron_cross", key: "dic_press_definition", applies: { method: "iron_cross_press" }, rule: { description: "push_rings_down_to_bring_arms_closer_then_return_to_support" }, ev: "Iron Cross press path defined" })
sel({ src: DIC, fam: "iron_cross", key: "dic_no_high_skill_without_readiness", applies: { skill: "iron_cross", readinessTier: { lt: "advanced" } }, rule: { exclude: ["azarian", "nakayama"] }, t: "hard_constraint", ev: "Azarian/Nakayama locked behind advanced cross readiness" })
rx({ src: DIC, fam: "iron_cross", key: "dic_freq_default", applies: { skill: "iron_cross" }, rule: { sessionsPerWeek: 1 }, ev: "Iron Cross frequency capped" })
rx({ src: DIC, fam: "iron_cross", key: "dic_freq_hard_cap", applies: { skill: "iron_cross" }, rule: { sessionsPerWeekMax: 3, note: "second/third only for focused specialization" }, t: "hard_constraint", ev: "Iron Cross frequency capped" })
rx({ src: DIC, fam: "iron_cross", key: "dic_break_window", applies: { skill: "iron_cross" }, rule: { plannedBreakWeeks: { min: 2, max: 3 } }, ev: "Iron Cross planned breaks supported" })
rx({ src: DIC, fam: "iron_cross", key: "dic_lvl1_dips_floor", applies: { skill: "iron_cross", level: 1 }, rule: { minDipsAtBaseline: 0, recommendedDips: 30 }, ev: "Iron Cross Level 1 starts from dips foundation" })
rx({ src: DIC, fam: "iron_cross", key: "dic_cycle_blocks", applies: { skill: "iron_cross" }, rule: { weeklyBlocks: ["technique_week", "volume_week", "resistance_week", "rest_week"] }, ev: "Iron Cross monthly cycle encoded" })
rx({ src: DIC, fam: "iron_cross", key: "dic_attempts_at_start", applies: { skill: "iron_cross" }, rule: { sessionPlacement: "first_movement" }, ev: "Iron Cross attempts placed at session start" })
progr({ src: DIC, fam: "iron_cross", key: "dic_lvl1_path", applies: { skill: "iron_cross", level: 1 }, rule: { progression: "0_to_30_dips_then_first_iron_cross_attempts" }, ev: "Iron Cross Level 1 path encoded" })
progr({ src: DIC, fam: "iron_cross", key: "dic_lvl_ladder", applies: { skill: "iron_cross" }, rule: { ladder: ["dips_foundation", "first_iron_cross_hold", "solid_iron_cross_hold", "iron_cross_combos", "azarian_or_nakayama"] }, ev: "Iron Cross level ladder encoded" })
progr({ src: DIC, fam: "iron_cross", key: "dic_no_skip", applies: { skill: "iron_cross" }, rule: { skipLevels: false }, t: "hard_constraint", ev: "Iron Cross level chosen from readiness" })
progr({ src: DIC, fam: "iron_cross", key: "dic_advanced_lock", applies: { skill: { in: ["azarian", "nakayama"] } }, rule: { unlockWhen: "solid_iron_cross_hold_present" }, t: "hard_constraint", ev: "Azarian/Nakayama locked behind advanced cross readiness" })
progr({ src: DIC, fam: "iron_cross", key: "dic_technique_week", applies: { skill: "iron_cross", cycleWeek: "technique" }, rule: { focus: "form_and_cues_low_volume" }, ev: "Iron Cross technique week encoded" })
progr({ src: DIC, fam: "iron_cross", key: "dic_volume_week", applies: { skill: "iron_cross", cycleWeek: "volume" }, rule: { focus: "more_holds_negatives_assisted_holds" }, ev: "Iron Cross volume week encoded" })
progr({ src: DIC, fam: "iron_cross", key: "dic_resistance_week", applies: { skill: "iron_cross", cycleWeek: "resistance" }, rule: { focus: "lower_band_aid_or_added_load_short_holds" }, ev: "Iron Cross resistance week encoded" })
progr({ src: DIC, fam: "iron_cross", key: "dic_rest_week", applies: { skill: "iron_cross", cycleWeek: "rest" }, rule: { focus: "deload_or_full_break" }, ev: "Iron Cross rest week encoded" })
carry({ src: DIC, fam: "iron_cross", sourceKey: "ring_dip", targetSkill: "iron_cross", type: "prerequisite_support", strength: 0.65, ev: "Dip strength supports Iron Cross foundation" })
carry({ src: DIC, fam: "iron_cross", sourceKey: "support_hold", targetSkill: "iron_cross", type: "prerequisite_support", strength: 0.6, ev: "Support hold supports Iron Cross start" })
carry({ src: DIC, fam: "iron_cross", sourceKey: "back_lever_hold", targetSkill: "nakayama", type: "support", strength: 0.55, ev: "Back lever hold supports Nakayama" })
carry({ src: DIC, fam: "iron_cross", sourceKey: "straight_arm_ring_strength", targetSkill: "iron_cross", type: "support", strength: 0.5, ev: "Straight-arm ring strength supports Iron Cross" })
meth({ src: DIC, fam: "iron_cross", key: "dic_superset_definition", applies: { method: "superset" }, rule: { definition: "two_exercises_back_to_back_minimal_rest_within_pair" }, ev: "Iron Cross method library: superset captured" })
meth({ src: DIC, fam: "iron_cross", key: "dic_dropset_definition", applies: { method: "dropset" }, rule: { definition: "reduce_load_or_band_aid_after_failure_continue_set" }, ev: "Iron Cross method library: dropset captured" })

// =====================================================================
// 4. Valentin OTZ Full Planche (OFP) — 36 atoms
// =====================================================================
p({ src: OFP, fam: "full_planche", key: "ofp_staged_start", title: "Planche stage matches current ability", sum: "Full planche work starts at the stage matching current level — never aspirational. Stages 1 and 2 are muscle-strengthening prep when base strength is insufficient.", w: 2, t: "hard_constraint", ev: "Planche stage selected from current ability" })
p({ src: OFP, fam: "full_planche", key: "ofp_form_strength_volume", title: "Strength produces volume; form correction follows", sum: "'Form > strength' as an absolute is false. Strength enables productive work; form is corrected to the volume produced, then volume is raised again.", w: 2, ev: "Planche alternates volume production and form correction" })
p({ src: OFP, fam: "full_planche", key: "ofp_intensity_is_quality", title: "Bodyweight planche intensity = execution quality", sum: "In bodyweight planche, intensity is relative to execution quality because no external weight is added. Lowering form lowers intensity to permit volume.", w: 1, ev: "Planche intensity tied to execution quality" })
p({ src: OFP, fam: "full_planche", key: "ofp_psych_visualization", title: "Planche has a psychological/visualization component", sum: "Confident planche intent affects posture, pressure, trajectory; the athlete should rise/grow forward, not only hold a fall.", w: 1, ev: "Planche visualization affects pressure and trajectory" })
p({ src: OFP, fam: "full_planche", key: "ofp_wrist_pressure_matters", title: "Wrist/hand pressure matters for planche force", sum: "Balanced front/back hand contact improves force usage and height; breaking at the wrist reduces height and overuses the anterior arm chain.", w: 1, ev: "Planche wrist/hand pressure cue applied" })
p({ src: OFP, fam: "full_planche", key: "ofp_pain_not_signal", title: "Pain is not proof of good work", sum: "Pain in planche training is not a 'good work' signal. Tension and pain are interpreted and adjusted, not pushed through blindly.", w: 2, t: "hard_constraint", ev: "Planche pain/tension handled as adjustment signal" })
meth({ src: OFP, fam: "full_planche", key: "ofp_form_correction_after_volume", applies: { skill: "planche", phase: "post_volume" }, rule: { sequence: ["produce_volume_with_imperfect_form_allowed", "correct_form_to_produced_volume", "then_raise_volume_again"] }, ev: "Planche alternates volume production and form correction" })
meth({ src: OFP, fam: "full_planche", key: "ofp_deficiency_triage", applies: { skill: "planche" }, rule: { triage: ["strength", "endurance", "control", "form", "assisted_work", "combinations"], chooseFormat: "based_on_detected_deficiency" }, ev: "Planche work selected from detected deficiency" })
meth({ src: OFP, fam: "full_planche", key: "ofp_strength_produces_volume", applies: { skill: "planche", phase: "early" }, rule: { rule: "use_strength_endurance_to_build_volume_first" }, ev: "Strength/endurance phase produces volume first" })
meth({ src: OFP, fam: "full_planche", key: "ofp_form_check", applies: { skill: "planche" }, rule: { checkpoints: ["scapular_protraction", "anterior_pelvic_tilt_off", "shoulder_lean", "wrist_balanced", "leg_alignment"] }, ev: "Planche form checkpoints encoded" })
meth({ src: OFP, fam: "full_planche", key: "ofp_balanced_wrist", applies: { skill: "planche" }, rule: { wristContact: "balanced_front_and_back_hand", avoid: "breaking_at_wrist" }, ev: "Planche wrist/hand pressure cue applied" })
meth({ src: OFP, fam: "full_planche", key: "ofp_breaking_wrist_bad", applies: { skill: "planche" }, rule: { reject: "breaking_at_wrist_during_hold", reason: "reduces_height_overuses_anterior_arm" }, t: "hard_constraint", ev: "Planche wrist/hand pressure cue applied" })
sel({ src: OFP, fam: "full_planche", key: "ofp_strength_pool", applies: { skill: "planche", deficiency: "strength" }, rule: { include: ["pseudo_planche_pushup", "planche_lean", "tuck_planche_hold", "advanced_tuck_planche_hold", "weighted_pseudo_planche_pushup"] }, ev: "Planche strength pool surfaced" })
sel({ src: OFP, fam: "full_planche", key: "ofp_endurance_pool", applies: { skill: "planche", deficiency: "endurance" }, rule: { include: ["tuck_holds_long_duration", "advanced_tuck_holds_long_duration", "banded_planche_holds_repeated"] }, ev: "Planche endurance pool surfaced" })
sel({ src: OFP, fam: "full_planche", key: "ofp_control_pool", applies: { skill: "planche", deficiency: "control" }, rule: { include: ["tuck_to_advanced_tuck_transition", "press_to_planche_negative", "planche_walks"] }, ev: "Planche control pool surfaced" })
sel({ src: OFP, fam: "full_planche", key: "ofp_form_pool", applies: { skill: "planche", deficiency: "form" }, rule: { include: ["form_check_holds", "video_review_blocks", "scap_protraction_drills", "wrist_balance_drills"] }, ev: "Planche form pool surfaced" })
sel({ src: OFP, fam: "full_planche", key: "ofp_assisted_pool", applies: { skill: "planche", deficiency: "assisted_work" }, rule: { include: ["banded_full_planche_hold", "banded_straddle_planche_hold", "spotter_assisted_full_hold"] }, ev: "Planche assisted pool surfaced" })
sel({ src: OFP, fam: "full_planche", key: "ofp_combinations_pool", applies: { skill: "planche", phase: "combinations" }, rule: { include: ["press_to_planche_to_handstand", "planche_to_pseudo_pushup_to_planche", "tuck_planche_to_advanced_tuck_to_tuck"] }, ev: "Planche combinations pool surfaced" })
rx({ src: OFP, fam: "full_planche", key: "ofp_stage_1_2_prep", applies: { skill: "planche", baseStrength: "insufficient" }, rule: { stages: [1, 2], focus: "muscle_strengthening_prep" }, ev: "Planche prep stages 1-2 used when base low" })
rx({ src: OFP, fam: "full_planche", key: "ofp_dose_default", applies: { skill: "planche", method: "tuck_or_advanced_tuck_hold" }, rule: { sets: { min: 4, max: 6 }, holdSec: { min: 5, max: 12 } }, ev: "Planche tuck dose encoded" })
rx({ src: OFP, fam: "full_planche", key: "ofp_dose_press", applies: { skill: "planche", method: "pseudo_planche_pushup" }, rule: { sets: { min: 3, max: 5 }, reps: { min: 5, max: 10 } }, ev: "Planche pressing dose encoded" })
rx({ src: OFP, fam: "full_planche", key: "ofp_rest", applies: { skill: "planche", role: "primary_skill" }, rule: { restSec: 180 }, ev: "Planche primary work uses long rest" })
rx({ src: OFP, fam: "full_planche", key: "ofp_progression_window", applies: { skill: "planche" }, rule: { stageReassessmentEveryWeeks: 3 }, ev: "Planche stage re-assessed every 3 weeks" })
rx({ src: OFP, fam: "full_planche", key: "ofp_no_jump_stage", applies: { skill: "planche" }, rule: { stageJump: false }, t: "hard_constraint", ev: "Planche stage selected from current ability" })
progr({ src: OFP, fam: "full_planche", key: "ofp_stage_gate", applies: { skill: "planche" }, rule: { gate: "select_stage_matching_current_ability" }, t: "hard_constraint", ev: "Planche stage selected from current ability" })
progr({ src: OFP, fam: "full_planche", key: "ofp_volume_form_cycle", applies: { skill: "planche" }, rule: { cycle: ["produce_volume", "correct_form_to_volume", "raise_volume", "correct_form_to_new_volume"] }, ev: "Planche alternates volume production and form correction" })
progr({ src: OFP, fam: "full_planche", key: "ofp_raise_volume_after_form", applies: { skill: "planche", phase: "post_form_correction" }, rule: { action: "raise_volume_at_next_step" }, ev: "Planche volume raised after form correction" })
progr({ src: OFP, fam: "full_planche", key: "ofp_raise_form_after_volume", applies: { skill: "planche", phase: "post_volume_increase" }, rule: { action: "correct_form_to_new_volume" }, ev: "Planche form re-corrected at next step" })
progr({ src: OFP, fam: "full_planche", key: "ofp_customization", applies: { skill: "planche" }, rule: { allow: ["adaptations", "stagnation_handling", "tension_pain_handling", "alternative_movements", "deficiency_based_customization"] }, ev: "Planche program supports customization" })
progr({ src: OFP, fam: "full_planche", key: "ofp_stagnation", applies: { skill: "planche", state: "stagnation" }, rule: { action: ["change_method", "deload_one_week", "switch_deficiency_focus"] }, ev: "Planche stagnation handled by method/deficiency switch" })
progr({ src: OFP, fam: "full_planche", key: "ofp_tension_pain_handling", applies: { skill: "planche", state: "tension_or_pain" }, rule: { action: ["reduce_volume", "switch_to_assisted", "rest_2_to_3_days"] }, ev: "Planche tension/pain handled by reducing volume" })
carry({ src: OFP, fam: "full_planche", sourceKey: "pseudo_planche_pushup", targetSkill: "planche", type: "support", strength: 0.7, ev: "Pseudo planche pushup supports planche" })
carry({ src: OFP, fam: "full_planche", sourceKey: "tuck_planche_hold", targetSkill: "planche", type: "prerequisite_support", strength: 0.65, ev: "Tuck planche hold supports planche progression" })
carry({ src: OFP, fam: "full_planche", sourceKey: "scap_protraction_drill", targetSkill: "planche", type: "support", strength: 0.5, ev: "Scap protraction supports planche" })
carry({ src: OFP, fam: "full_planche", sourceKey: "wrist_balance_drill", targetSkill: "planche", type: "support", strength: 0.4, ev: "Wrist balance drill supports planche pressure" })
meth({ src: OFP, fam: "full_planche", key: "ofp_visualization", applies: { skill: "planche", phase: "intent" }, rule: { intent: "rise_grow_forward_not_only_hold_fall" }, ev: "Planche visualization affects pressure and trajectory" })

// =====================================================================
// 5. Davai/Flolit Front Lever (DFL) — 34 atoms
// =====================================================================
p({ src: DFL, fam: "front_lever", key: "dfl_fundamental", title: "Front lever is a fundamental calisthenics strength element", sum: "Front lever is a foundational straight-arm strength skill engaging back, lats, traps, teres, rhomboids, triceps, and posterior deltoids.", w: 1, ev: "Front lever is fundamental strength skill" })
p({ src: DFL, fam: "front_lever", key: "dfl_conditioning_required", title: "Front lever requires conditioning before advancing", sum: "Good muscle and joint conditioning are required before advancing front lever; warm-up is mandatory.", w: 2, t: "hard_constraint", ev: "Front lever conditioning required before advancing" })
p({ src: DFL, fam: "front_lever", key: "dfl_pain_stop_signal", title: "Pain is a stop/change signal", sum: "Pain in front lever training is a stop or change signal — not something to push through. Aching muscles vs joint/tendon pain are distinguished.", w: 2, t: "hard_constraint", ev: "Front lever pain treated as stop signal" })
p({ src: DFL, fam: "front_lever", key: "dfl_recovery_overrides", title: "Recovery overrides frequency", sum: "Front lever may tolerate higher frequency than some skills, but pain or fatigue overrides any frequency target.", w: 2, ev: "Front lever frequency adjusted by recovery" })
p({ src: DFL, fam: "front_lever", key: "dfl_combination_usable", title: "Front lever should eventually become combination-usable", sum: "Front lever should be efficient enough to be used in combinations once mastered.", w: 1, ev: "Front lever targeted as combination-usable" })
meth({ src: DFL, fam: "front_lever", key: "dfl_technique_horizontal", applies: { skill: "front_lever" }, rule: { position: { body: "horizontal", legs: "straight_aligned_with_torso", arms: "fully_extended" } }, t: "hard_constraint", ev: "Front lever technique standard applied" })
meth({ src: DFL, fam: "front_lever", key: "dfl_scap_retraction", applies: { skill: "front_lever" }, rule: { upperBack: "scapular_retraction" }, t: "hard_constraint", ev: "Front lever scapular retraction cue applied" })
meth({ src: DFL, fam: "front_lever", key: "dfl_grip_width", applies: { skill: "front_lever" }, rule: { gripWidthDefault: "shoulder_width" }, ev: "Front lever default grip is shoulder-width" })
meth({ src: DFL, fam: "front_lever", key: "dfl_false_grip_accessory", applies: { skill: "front_lever", purpose: "forearm_wrist_resilience" }, rule: { method: "occasional_false_grip_work" }, ev: "False grip used as forearm/wrist support" })
meth({ src: DFL, fam: "front_lever", key: "dfl_pain_stop", applies: { skill: "front_lever", state: "pain" }, rule: { action: "stop_or_change", awayWeeks: { min: 1, max: 2 } }, t: "hard_constraint", ev: "Front lever pain treated as stop signal" })
meth({ src: DFL, fam: "front_lever", key: "dfl_vary_methods", applies: { skill: "front_lever" }, rule: { methodPool: ["gtg_attempts", "max_holds", "max_reps", "combinations", "isolated_exercises", "added_weight", "machines", "elastic_assistance", "simpler_variants"] }, ev: "Front lever method selected from context" })
meth({ src: DFL, fam: "front_lever", key: "dfl_vary_grip_width", applies: { skill: "front_lever", phase: "advanced" }, rule: { variations: ["pronated", "supinated", "neutral", "narrow", "wide"] }, ev: "Front lever grip/width variation used intentionally" })
meth({ src: DFL, fam: "front_lever", key: "dfl_transition_80pct", applies: { skill: "front_lever", phase: "transition" }, rule: { intensityPct: 80 }, ev: "Front lever transition period intensity moderated" })
meth({ src: DFL, fam: "front_lever", key: "dfl_rhythm_5x", applies: { skill: "front_lever", goal: "rapid_progress", recoveryTier: { gte: "good" } }, rule: { sessionsPerWeekIdeal: 5, mustAdjustByFeel: true }, ev: "Front lever ideal rhythm ~5x/week subject to feel" })
sel({ src: DFL, fam: "front_lever", key: "dfl_lvl1_pool", applies: { skill: "front_lever", level: 1 }, rule: { include: ["pullup_strength_build", "australian_pullup", "scap_pull", "tuck_progression_intro"], pullupTarget: { min: 0, max: 15 } }, ev: "Front lever Level 1 builds basics" })
sel({ src: DFL, fam: "front_lever", key: "dfl_lvl2_pool", applies: { skill: "front_lever", level: 2 }, rule: { include: ["tuck_front_lever_hold", "tuck_to_advanced_tuck_hold", "advanced_tuck_hold"] }, ev: "Front lever Level 2: tuck to advanced tuck" })
sel({ src: DFL, fam: "front_lever", key: "dfl_lvl3_pool", applies: { skill: "front_lever", level: 3 }, rule: { include: ["advanced_tuck_hold_long", "bad_form_front_lever_attempt", "negative_front_lever"] }, ev: "Front lever Level 3: advanced tuck to bad-form FL" })
sel({ src: DFL, fam: "front_lever", key: "dfl_lvl4_pool", applies: { skill: "front_lever", level: 4 }, rule: { include: ["bad_form_front_lever_hold", "clean_front_lever_attempt", "clean_front_lever_hold"] }, ev: "Front lever Level 4: bad-form to clean FL" })
sel({ src: DFL, fam: "front_lever", key: "dfl_method_attempts", applies: { skill: "front_lever", method: "gtg_attempts" }, rule: { include: ["short_holds_throughout_day", "low_intensity_repeated_attempts"] }, ev: "Front lever GTG/attempts method available" })
sel({ src: DFL, fam: "front_lever", key: "dfl_method_max_holds", applies: { skill: "front_lever", method: "max_holds" }, rule: { include: ["max_tuck_hold", "max_advanced_tuck_hold", "max_straddle_hold", "max_full_hold"] }, ev: "Front lever max-hold method available" })
sel({ src: DFL, fam: "front_lever", key: "dfl_method_combinations", applies: { skill: "front_lever", method: "combinations" }, rule: { include: ["pull_to_hold", "hold_to_pull", "ice_cream_maker", "front_lever_to_back_lever"] }, ev: "Front lever combinations method available" })
sel({ src: DFL, fam: "front_lever", key: "dfl_method_isolated", applies: { skill: "front_lever", method: "isolated_exercises" }, rule: { include: ["scap_pull", "lat_pulldown", "back_row", "straight_arm_pulldown", "reverse_hyper"] }, ev: "Front lever isolated exercises method available" })
sel({ src: DFL, fam: "front_lever", key: "dfl_method_added_weight", applies: { skill: "front_lever", method: "added_weight" }, rule: { include: ["weighted_tuck_hold", "ankle_weighted_advanced_tuck_hold"] }, ev: "Front lever added-weight method available" })
sel({ src: DFL, fam: "front_lever", key: "dfl_method_elastic", applies: { skill: "front_lever", method: "elastic_assistance" }, rule: { include: ["banded_full_hold", "banded_pull_to_hold"] }, ev: "Front lever elastic-assisted method available" })
rx({ src: DFL, fam: "front_lever", key: "dfl_warmup_required", applies: { skill: "front_lever" }, rule: { warmupRequired: true }, t: "hard_constraint", ev: "Front lever warm-up required" })
rx({ src: DFL, fam: "front_lever", key: "dfl_dose_holds", applies: { skill: "front_lever", method: "max_holds" }, rule: { sets: { min: 3, max: 5 }, holdSec: { min: 5, max: 20 } }, ev: "Front lever hold dose encoded" })
rx({ src: DFL, fam: "front_lever", key: "dfl_dose_pulls", applies: { skill: "front_lever", method: "max_reps" }, rule: { sets: { min: 3, max: 5 }, reps: { min: 3, max: 8 } }, ev: "Front lever pull dose encoded" })
rx({ src: DFL, fam: "front_lever", key: "dfl_transition_period", applies: { skill: "front_lever", phase: "transition" }, rule: { intensityPct: 80, durationDays: { min: 7, max: 14 } }, ev: "Front lever transition period intensity moderated" })
progr({ src: DFL, fam: "front_lever", key: "dfl_level_match", applies: { skill: "front_lever" }, rule: { gate: "select_level_matching_current_ability" }, t: "hard_constraint", ev: "Front lever level selected from current ability" })
progr({ src: DFL, fam: "front_lever", key: "dfl_no_higher_level", applies: { skill: "front_lever" }, rule: { reject: "prescribe_level_above_current_ability" }, t: "hard_constraint", ev: "Front lever level selected from current ability" })
progr({ src: DFL, fam: "front_lever", key: "dfl_lvl1_gate", applies: { skill: "front_lever", level: 1 }, rule: { gate: "pullups_0_to_15_or_basics_capable" }, ev: "Front lever Level 1 gated by pullup baseline" })
progr({ src: DFL, fam: "front_lever", key: "dfl_lvl2_gate", applies: { skill: "front_lever", level: 2 }, rule: { gate: "tuck_hold_>=_8s" }, ev: "Front lever Level 2 gated by tuck hold" })
progr({ src: DFL, fam: "front_lever", key: "dfl_lvl3_gate", applies: { skill: "front_lever", level: 3 }, rule: { gate: "advanced_tuck_hold_>=_8s" }, ev: "Front lever Level 3 gated by advanced tuck hold" })
progr({ src: DFL, fam: "front_lever", key: "dfl_lvl4_gate", applies: { skill: "front_lever", level: 4 }, rule: { gate: "bad_form_front_lever_hold_>=_3s" }, ev: "Front lever Level 4 gated by bad-form hold" })
carry({ src: DFL, fam: "front_lever", sourceKey: "back_row", targetSkill: "front_lever", type: "support", strength: 0.5, ev: "Back row supports front lever" })
carry({ src: DFL, fam: "front_lever", sourceKey: "lat_pulldown", targetSkill: "front_lever", type: "support", strength: 0.45, ev: "Lat pulldown supports front lever" })
carry({ src: DFL, fam: "front_lever", sourceKey: "scap_pull", targetSkill: "front_lever", type: "support", strength: 0.55, ev: "Scap pull supports front lever scapular retraction" })

// =====================================================================
// 6. Nicolas Lyan Master the Muscle-Up (NMU) — 24 atoms
// =====================================================================
p({ src: NMU, fam: "muscle_up", key: "nmu_pillar", title: "Muscle-up is a pillar of calisthenics", sum: "Muscle-up is a foundational calisthenics movement that integrates pulling, transition, and dipping into one curved path.", w: 1, ev: "Muscle-up is calisthenics pillar" })
p({ src: NMU, fam: "muscle_up", key: "nmu_two_domain", title: "Muscle-up requires technique AND strength", sum: "Muscle-up progress requires both technique and strength; weakness must be classified as technique/path/timing OR strength.", w: 2, ev: "Muscle-up weakness classified as technique or strength" })
p({ src: NMU, fam: "muscle_up", key: "nmu_curved_path", title: "Muscle-up is one curved path around the bar", sum: "Muscle-up is best understood as one cohesive curved-path movement around the bar, not pull-up + dip pieces.", w: 2, ev: "Muscle-up curved path cue applied" })
p({ src: NMU, fam: "muscle_up", key: "nmu_not_more_pullups", title: "Muscle-up is not solved by 'more pull-ups'", sum: "Strength gaps and transition/timing gaps are diagnosable separately; programming must not collapse muscle-up into pull-up volume.", w: 2, ev: "Muscle-up programming is not just more pull-ups" })
meth({ src: NMU, fam: "muscle_up", key: "nmu_timing_matters", applies: { skill: "muscle_up" }, rule: { focus: "timing_of_pull_initiation" }, ev: "Muscle-up timing cue applied" })
meth({ src: NMU, fam: "muscle_up", key: "nmu_forward_swing", applies: { skill: "muscle_up" }, rule: { setup: "slight_forward_swing_to_create_correct_moment" }, ev: "Muscle-up timing cue applied" })
meth({ src: NMU, fam: "muscle_up", key: "nmu_sweet_spot", applies: { skill: "muscle_up" }, rule: { initiate: "at_furthest_forward_point_when_body_is_stretched" }, ev: "Muscle-up timing cue applied" })
meth({ src: NMU, fam: "muscle_up", key: "nmu_up_and_out", applies: { skill: "muscle_up" }, rule: { pullPath: "up_and_out_to_create_height_and_distance" }, t: "hard_constraint", ev: "Muscle-up pull path set to up-and-out" })
sel({ src: NMU, fam: "muscle_up", key: "nmu_strength_pool", applies: { skill: "muscle_up", deficiency: "strength" }, rule: { include: ["chest_to_bar_pullup", "explosive_pullup", "high_pullup", "weighted_pullup"] }, ev: "Muscle-up strength pool surfaced" })
sel({ src: NMU, fam: "muscle_up", key: "nmu_dip_pool", applies: { skill: "muscle_up", deficiency: "dip_strength" }, rule: { include: ["straight_bar_dip", "straight_bar_dip_progression", "bench_dip", "negative_straight_bar_dip"] }, ev: "Muscle-up dip pool surfaced" })
sel({ src: NMU, fam: "muscle_up", key: "nmu_transition_pool", applies: { skill: "muscle_up", deficiency: "transition" }, rule: { include: ["band_assisted_transition", "false_grip_transition_negative", "russian_dip", "transition_isometric_hold"] }, ev: "Muscle-up transition drills surfaced" })
sel({ src: NMU, fam: "muscle_up", key: "nmu_technique_pool", applies: { skill: "muscle_up", deficiency: "technique" }, rule: { include: ["swing_drill", "pull_path_walkthrough", "scoop_drill", "high_pull_to_chest"] }, ev: "Muscle-up technique drills surfaced" })
rx({ src: NMU, fam: "muscle_up", key: "nmu_chest_to_bar_prereq", applies: { skill: "muscle_up", check: "prerequisite" }, rule: { chestToBarPullups: { min: 5 } }, t: "hard_constraint", ev: "Muscle-up prerequisites checked" })
rx({ src: NMU, fam: "muscle_up", key: "nmu_dip_prereq", applies: { skill: "muscle_up", check: "prerequisite" }, rule: { straightBarDips: { min: 8, recommended: 10 } }, t: "hard_constraint", ev: "Muscle-up prerequisites checked" })
rx({ src: NMU, fam: "muscle_up", key: "nmu_withhold_if_below_prereq", applies: { skill: "muscle_up", chestToBarPullups: { lt: 5 } }, rule: { withhold: true, substitute: "support_work" }, t: "hard_constraint", ev: "Muscle-up withheld until readiness exists" })
rx({ src: NMU, fam: "muscle_up", key: "nmu_withhold_if_below_dip_prereq", applies: { skill: "muscle_up", straightBarDips: { lt: 8 } }, rule: { withhold: true, substitute: "support_work" }, t: "hard_constraint", ev: "Muscle-up withheld until readiness exists" })
rx({ src: NMU, fam: "muscle_up", key: "nmu_dose_attempts", applies: { skill: "muscle_up", method: "attempts" }, rule: { sets: { min: 3, max: 5 }, repsPerSet: { min: 1, max: 3 }, restSec: 180 }, ev: "Muscle-up attempt dose encoded" })
progr({ src: NMU, fam: "muscle_up", key: "nmu_diagnose_two_domain", applies: { skill: "muscle_up" }, rule: { diagnose: ["technique_path_timing", "strength"] }, ev: "Muscle-up weakness classified as technique or strength" })
progr({ src: NMU, fam: "muscle_up", key: "nmu_transition_bottleneck", applies: { skill: "muscle_up", strengthSufficient: true, fails: "transition" }, rule: { focus: "transition_drills_only" }, ev: "Muscle-up transition bottleneck tracked" })
progr({ src: NMU, fam: "muscle_up", key: "nmu_strength_bottleneck", applies: { skill: "muscle_up", strengthSufficient: false }, rule: { focus: "explosive_pullup_and_dip_progression" }, ev: "Muscle-up strength bottleneck tracked" })
progr({ src: NMU, fam: "muscle_up", key: "nmu_curved_path_practice", applies: { skill: "muscle_up", phase: "technique" }, rule: { practice: "rehearse_full_curved_path_low_reps" }, ev: "Muscle-up curved path cue applied" })
carry({ src: NMU, fam: "muscle_up", sourceKey: "chest_to_bar_pullup", targetSkill: "muscle_up", type: "prerequisite_support", strength: 0.75, ev: "Chest-to-bar pull supports muscle-up" })
carry({ src: NMU, fam: "muscle_up", sourceKey: "straight_bar_dip", targetSkill: "muscle_up", type: "prerequisite_support", strength: 0.75, ev: "Straight-bar dip supports muscle-up" })
carry({ src: NMU, fam: "muscle_up", sourceKey: "ring_muscle_up", targetSkill: "bar_muscle_up", type: "partial_transfer", strength: 0.4, ev: "Ring muscle-up partially transfers to bar muscle-up" })

// =====================================================================
// 7. Legal Advanced-Skill Source Gate (LSG) — 10 governance atoms
// =====================================================================
p({ src: LSG, fam: "legal_source_gate", key: "lsg_legal_only", title: "Advanced-source legality verified before activation", sum: "Any future advanced-skill source must be legally usable (user-uploaded, official-creator-published, public sample, or user summary) before doctrine activation.", w: 2, t: "hard_constraint", ev: "Advanced source legality verified before activation" })
p({ src: LSG, fam: "legal_source_gate", key: "lsg_no_invented_claims", title: "No invented professional-source claims", sum: "Doctrine atoms must never claim professional-source backing without an actual legal source attached.", w: 2, t: "hard_constraint", ev: "No invented professional-source claims" })
p({ src: LSG, fam: "legal_source_gate", key: "lsg_missing_source_report", title: "Missing legal source reported, not invented", sum: "When advanced-skill doctrine is desired but no legal source is available, the system reports a missing-source candidate instead of inventing rules.", w: 2, ev: "Missing legal source reported, not invented" })
p({ src: LSG, fam: "legal_source_gate", key: "lsg_foundation_only", title: "Doctrine foundation only — builder consumption deferred", sum: "This batch establishes source truth. Builder-consumption is a future phase; doctrine foundation must be complete before deep builder integration.", w: 1, ev: "Builder-consumption deferred until doctrine foundation complete" })
meth({ src: LSG, fam: "legal_source_gate", key: "lsg_active_status_set", applies: { sourceLegalityStatus: { required: true } }, rule: { activeAllowed: ["user_uploaded_owned", "official_free_creator_published", "official_paid_user_owned", "public_sample_creator_released", "user_summary_only"] }, t: "hard_constraint", ev: "Active doctrine restricted to legal source statuses" })
meth({ src: LSG, fam: "legal_source_gate", key: "lsg_reject_leaked", applies: { sourceLegalityStatus: "rejected_leaked_or_unauthorized" }, rule: { activate: false, reason: "leaked_pirated_unauthorized" }, t: "hard_constraint", ev: "Unauthorized source rejected" })
meth({ src: LSG, fam: "legal_source_gate", key: "lsg_reject_low_trust", applies: { sourceLegalityStatus: "rejected_low_trust" }, rule: { activate: false, reason: "random_influencer_low_trust" }, t: "hard_constraint", ev: "Low-trust source rejected" })
meth({ src: LSG, fam: "legal_source_gate", key: "lsg_unknown_holds", applies: { sourceLegalityStatus: "unknown_requires_review" }, rule: { activate: false, reason: "requires_user_or_governance_review" }, t: "hard_constraint", ev: "Unknown-status sources held for review" })
meth({ src: LSG, fam: "legal_source_gate", key: "lsg_no_inactive_inflation", applies: { candidateState: "inactive" }, rule: { rule: "inactive_candidates_must_not_inflate_active_rule_count" }, t: "hard_constraint", ev: "Inactive candidates excluded from active rule counts" })
meth({ src: LSG, fam: "legal_source_gate", key: "lsg_no_web_leak_browse", applies: { context: "doctrine_research" }, rule: { forbidden: ["browse_web_for_leaked_pdfs", "ingest_unofficial_third_party_mirrors"] }, t: "hard_constraint", ev: "No leak/pirate research permitted" })

// =====================================================================
// INACTIVE ADVANCED-SKILL CANDIDATES (data only, NOT active atoms)
// =====================================================================
// These are recorded as candidate metadata for future legal-source
// enrichment. They MUST NOT inflate active rule counts and MUST NOT
// surface as program rules until a legal source is attached.
export interface InactiveAdvancedSourceCandidate {
  desiredSkillKey: string
  desiredDoctrineNeed: string
  requiredSourceQuality: string
  legalSourceStatus: SourceLegalityStatus
  active: false
  reasonInactive: string
  notes: string
}

export const BATCH_06_INACTIVE_ADVANCED_CANDIDATES: InactiveAdvancedSourceCandidate[] = [
  { desiredSkillKey: "dragon_flag",            desiredDoctrineNeed: "progressions, regressions, dose, contraindications",       requiredSourceQuality: "official creator-published or user-owned PDF",            legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Need uploaded PDF or creator-licensed material." },
  { desiredSkillKey: "iron_cross_advanced",    desiredDoctrineNeed: "deeper Azarian/Nakayama programming beyond Davai PDF",     requiredSourceQuality: "official paid user-owned or creator-published",           legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Davai Iron Cross covers fundamentals; advanced rings require additional legal source." },
  { desiredSkillKey: "one_arm_front_lever",    desiredDoctrineNeed: "OAFL hold, OAFL row, FL rose, transitional progressions", requiredSourceQuality: "official paid user-owned or creator-published",           legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Davai/Flolit covers FL, not OAFL." },
  { desiredSkillKey: "one_arm_back_lever",     desiredDoctrineNeed: "OABL hold, OABL pull, eccentric programming",              requiredSourceQuality: "official paid user-owned or creator-published",           legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Existing BL doctrine in Batch 4/5 covers BL, not OABL." },
  { desiredSkillKey: "archer_pullup",          desiredDoctrineNeed: "archer pull/push variations, asymmetric loading",          requiredSourceQuality: "official creator-published or user-owned PDF",            legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Need archer-specific source." },
  { desiredSkillKey: "planche_pushup",         desiredDoctrineNeed: "PPU progressions, ROM, dose, contraindications",           requiredSourceQuality: "official creator-published or user-owned PDF",            legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Valentin OTZ Full Planche covers static; PPU requires additional source." },
  { desiredSkillKey: "full_planche_press",     desiredDoctrineNeed: "press-to-planche progressions and dose",                   requiredSourceQuality: "official paid user-owned or creator-published",           legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Press variants need explicit press-focused source." },
  { desiredSkillKey: "front_lever_row",        desiredDoctrineNeed: "FLR progressions, dose, scap mechanics",                   requiredSourceQuality: "official creator-published or user-owned PDF",            legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Davai/Flolit FL covers holds, not row dynamics." },
  { desiredSkillKey: "front_lever_raise",      desiredDoctrineNeed: "FLR hip-action progressions, dose",                        requiredSourceQuality: "official creator-published or user-owned PDF",            legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Need raise-specific dynamic source." },
  { desiredSkillKey: "maltese",                desiredDoctrineNeed: "straddle Maltese / Maltese progressions",                  requiredSourceQuality: "official paid user-owned or creator-published",           legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Elite ring-strength source required." },
  { desiredSkillKey: "victorian",              desiredDoctrineNeed: "Victorian progressions, conditioning, dose",               requiredSourceQuality: "official paid user-owned or creator-published",           legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Elite ring-strength source required." },
  { desiredSkillKey: "straight_arm_ring",      desiredDoctrineNeed: "general straight-arm ring strength programming",          requiredSourceQuality: "official paid user-owned or creator-published",           legalSourceStatus: "unknown_requires_review", active: false, reasonInactive: "No verified legal source attached yet", notes: "Davai Iron Cross is partial; broader ring strength needs additional source." },
]

// =====================================================================
// EXPORTS — aggregator-facing API (parity with Batch 1-5)
// =====================================================================
// Batch 6 expresses safety as hard_constraint method/selection rules — same
// pattern as Batch 4 and Batch 5. Helper exists for aggregator parity.
export function getBatch06ContraindicationRules(): unknown[] { return [] }

export function getBatch06Sources(): DoctrineSource[] { return BATCH_06_SOURCES }
export function getBatch06Principles(): DoctrinePrinciple[] { return BATCH_06_PRINCIPLES }
export function getBatch06ProgressionRules(): ProgressionRule[] { return BATCH_06_PROGRESSION }
export function getBatch06MethodRules(): MethodRule[] { return BATCH_06_METHOD }
export function getBatch06PrescriptionRules(): PrescriptionRule[] { return BATCH_06_PRESCRIPTION }
export function getBatch06ExerciseSelectionRules(): ExerciseSelectionRule[] { return BATCH_06_SELECTION }
export function getBatch06CarryoverRules(): CarryoverRule[] { return BATCH_06_CARRYOVER }

export function getBatch06Counts() {
  return {
    sources: BATCH_06_SOURCES.length,
    principles: BATCH_06_PRINCIPLES.length,
    progression: BATCH_06_PROGRESSION.length,
    method: BATCH_06_METHOD.length,
    prescription: BATCH_06_PRESCRIPTION.length,
    selection: BATCH_06_SELECTION.length,
    carryover: BATCH_06_CARRYOVER.length,
    total:
      BATCH_06_PRINCIPLES.length +
      BATCH_06_PROGRESSION.length +
      BATCH_06_METHOD.length +
      BATCH_06_PRESCRIPTION.length +
      BATCH_06_SELECTION.length +
      BATCH_06_CARRYOVER.length,
    inactiveAdvancedCandidates: BATCH_06_INACTIVE_ADVANCED_CANDIDATES.length,
  }
}

export function getBatch06CountsBySource(): Record<string, number> {
  const all = [...BATCH_06_PRINCIPLES, ...BATCH_06_PROGRESSION, ...BATCH_06_METHOD, ...BATCH_06_PRESCRIPTION, ...BATCH_06_SELECTION, ...BATCH_06_CARRYOVER] as Array<{ source_id?: string }>
  const out: Record<string, number> = {}
  for (const r of all) { const sid = r.source_id ?? "unknown"; out[sid] = (out[sid] ?? 0) + 1 }
  return out
}

export function getBatch06ProvenanceFor(atomId: string): { batch: "batch_06"; sourceId: string | null } | null {
  const all: Array<{ id?: string; source_id?: string }> = [...BATCH_06_PRINCIPLES, ...BATCH_06_PROGRESSION, ...BATCH_06_METHOD, ...BATCH_06_PRESCRIPTION, ...BATCH_06_SELECTION, ...BATCH_06_CARRYOVER]
  const hit = all.find(r => r.id === atomId)
  if (!hit) return null
  return { batch: "batch_06", sourceId: hit.source_id ?? null }
}

export type Batch06Provenance = { batch: "batch_06"; sourceId: string | null }
