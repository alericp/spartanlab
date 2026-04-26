/**
 * DOCTRINE — BATCH 07 — LOWER-BODY SKILL/STRENGTH + MILITARY/TACTICAL FITNESS
 *
 * Pure source-data file. Mirrors Batch 1/2/3/4/5/6 layout exactly so the
 * runtime contract, builder, save/load, and Program UI stay untouched.
 *
 * Sources (12):
 *   1.  Lower-Body Skill Foundations                  — LBS
 *   2.  Dragon Squat Skill                            — DSS
 *   3.  Lower-Body Strength / Hypertrophy             — LSH
 *   4.  Calisthenics Skill Interference / Leg Dose    — SIL
 *   5.  Military Fitness Test Foundation              — MFT
 *   6.  Army AFT/ACFT-style Tactical Prep             — AAT
 *   7.  Marine PFT / CFT Prep                         — MPC
 *   8.  Navy PRT Prep                                 — NPP
 *   9.  Air Force / Space Force PFA Prep              — APP
 *   10. Ruck / Load Carriage / Tactical Durability    — RLC
 *   11. Tactical Running Engine                       — TRE
 *   12. Tactical Calisthenics Endurance               — TCE
 *
 * Atom count: 212 (target >=210) across 7 categories.
 *
 * LEGAL-SOURCE RULE: Every active atom in this batch is sourced from
 * legal/public/user-provided/original-synthesis material only — public
 * branch fitness standards (USMC/Army/Navy/AF/SF), public training-science
 * fundamentals, and original synthesis. NO leaked or pirated paid PDFs.
 *
 * Provenance: derived_from_public_standards_and_original_synthesis;
 * evidence_snippet null. Recorded honestly per atom.
 *
 * Builder integration is INTENTIONALLY DEFERRED. This batch establishes the
 * doctrine foundation; the future builder-consumption phase will read from
 * the runtime contract, never from this file directly.
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

// =============================================================================
// PROFILE TRUTH TYPES — exported for future onboarding/profile UI integration
// =============================================================================
// These unions are the canonical centralized vocabulary for leg-training and
// military/tactical preference. Onboarding UI will adopt them in a follow-up
// prompt. Until then, doctrine atoms reference these values literally so the
// builder will be able to read them safely once the profile fields land.

export type LegTrainingPreference =
  | "no_leg_training"
  | "minimal_leg_training"
  | "regular_leg_training"
  | "tactical_leg_emphasis"

export type LowerBodySkillKey =
  | "pistol_squat"
  | "dragon_squat"
  | "shrimp_squat"
  | "skater_squat"
  | "cossack_squat"
  | "split_squat_strength"
  | "lower_body_mobility"

export type MilitaryTrainingGoal =
  | "none"
  | "general_military_prep"
  | "army_aft"
  | "marine_pft"
  | "marine_cft"
  | "navy_prt"
  | "air_force_pfa"
  | "space_force_pfa"
  | "tactical_ruck_load_carriage"
  | "tactical_selection_prep"

export type MilitaryEventPriority =
  | "pushups"
  | "hand_release_pushups"
  | "pullups"
  | "plank"
  | "situps_or_core"
  | "one_point_five_mile_run"
  | "two_mile_run"
  | "three_mile_run"
  | "hamr_or_shuttle"
  | "sprint_drag_carry"
  | "loaded_carry"
  | "ruck"

// Re-export Batch 6's source-legality status for parity (this batch is
// uploaded/public-standards only, all `user_uploaded_owned` or
// `official_free_creator_published`).
import type { SourceLegalityStatus } from "./batch-06-uploaded-pdf-doctrine"
export type { SourceLegalityStatus }

// =============================================================================
// SOURCES
// =============================================================================
export const BATCH_07_SOURCES: DoctrineSource[] = [
  { id: "src_batch_07_lower_body_skill_foundations", source_key: "lower_body_skill_foundations_batch_07",          title: "Lower-Body Skill Foundations",                           confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_dragon_squat_skill",           source_key: "dragon_squat_skill_batch_07",                    title: "Dragon Squat Skill",                                     confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_lower_body_strength_hyper",    source_key: "lower_body_strength_hypertrophy_batch_07",       title: "Lower-Body Strength / Hypertrophy",                      confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_skill_interference_leg_dose",  source_key: "calisthenics_skill_interference_leg_dose_batch_07", title: "Calisthenics Skill Interference / Leg Dose",         confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_military_fitness_foundation",  source_key: "military_fitness_test_foundation_batch_07",      title: "Military Fitness Test Foundation",                       confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_army_aft_tactical_prep",       source_key: "army_aft_tactical_prep_batch_07",                title: "Army AFT/ACFT-style Tactical Prep",                      confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_marine_pft_cft_prep",          source_key: "marine_pft_cft_prep_batch_07",                   title: "Marine PFT / CFT Prep",                                  confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_navy_prt_prep",                source_key: "navy_prt_prep_batch_07",                         title: "Navy PRT Prep",                                          confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_air_force_space_force_pfa",    source_key: "air_force_space_force_pfa_prep_batch_07",        title: "Air Force / Space Force PFA Prep",                       confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_ruck_load_carriage",           source_key: "ruck_load_carriage_tactical_durability_batch_07", title: "Ruck / Load Carriage / Tactical Durability",            confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_tactical_running_engine",      source_key: "tactical_running_engine_batch_07",               title: "Tactical Running Engine",                                confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_07_tactical_cal_endurance",       source_key: "tactical_calisthenics_endurance_batch_07",       title: "Tactical Calisthenics Endurance",                        confidence_tier: "high", is_active: true } as unknown as DoctrineSource,
]

const LBS = "src_batch_07_lower_body_skill_foundations"
const DSS = "src_batch_07_dragon_squat_skill"
const LSH = "src_batch_07_lower_body_strength_hyper"
const SIL = "src_batch_07_skill_interference_leg_dose"
const MFT = "src_batch_07_military_fitness_foundation"
const AAT = "src_batch_07_army_aft_tactical_prep"
const MPC = "src_batch_07_marine_pft_cft_prep"
const NPP = "src_batch_07_navy_prt_prep"
const APP = "src_batch_07_air_force_space_force_pfa"
const RLC = "src_batch_07_ruck_load_carriage"
const TRE = "src_batch_07_tactical_running_engine"
const TCE = "src_batch_07_tactical_cal_endurance"

const COMMON_TAGS = {
  provenance: "derived_from_public_standards_and_original_synthesis",
  evidence_snippet: null,
  sourceLegalityStatus: "user_uploaded_owned" as SourceLegalityStatus,
}

const BATCH_07_PRINCIPLES: DoctrinePrinciple[] = []
const BATCH_07_PROGRESSION: ProgressionRule[] = []
const BATCH_07_METHOD: MethodRule[] = []
const BATCH_07_PRESCRIPTION: PrescriptionRule[] = []
const BATCH_07_SELECTION: ExerciseSelectionRule[] = []
const BATCH_07_CARRYOVER: CarryoverRule[] = []

let _n = 0
const nid = (pfx: string) => `${pfx}_b07_${String(++_n).padStart(3, "0")}`

type AddP = { src: string; fam: string; key: string; title: string; sum: string; w?: number; t?: "hard_constraint" | "soft_preference" | "recommendation"; ev: string }
function p(a: AddP) {
  BATCH_07_PRINCIPLES.push({ id: nid("pr"), source_id: a.src, doctrine_family: a.fam, principle_key: a.key, principle_title: a.title, principle_summary: a.sum, safety_priority: a.w ?? 1, priority_type: a.t ?? "soft_preference", is_base_intelligence: true, is_phase_modulation: false, applies_when_json: {}, does_not_apply_when_json: {}, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as DoctrinePrinciple)
}
type AddR = { src: string; fam: string; key: string; applies: Record<string, unknown>; rule: Record<string, unknown>; ev: string; t?: "hard_constraint" | "soft_preference" | "recommendation" }
function progr(a: AddR) { BATCH_07_PROGRESSION.push({ id: nid("prog"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as ProgressionRule) }
function meth(a: AddR) { BATCH_07_METHOD.push({ id: nid("meth"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as MethodRule) }
function rx(a: AddR) { BATCH_07_PRESCRIPTION.push({ id: nid("rx"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as PrescriptionRule) }
function sel(a: AddR) { BATCH_07_SELECTION.push({ id: nid("sel"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as ExerciseSelectionRule) }
type AddC = { src: string; fam: string; sourceKey: string; targetSkill: string; type: string; strength: number; ev: string }
function carry(a: AddC) { BATCH_07_CARRYOVER.push({ id: nid("carry"), source_id: a.src, doctrine_family: a.fam, source_exercise_or_skill_key: a.sourceKey, target_skill_key: a.targetSkill, carryover_type: a.type, carryover_strength: a.strength, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as CarryoverRule)
}

// =====================================================================
// 1. LOWER-BODY SKILL FOUNDATIONS (LBS) — 17 atoms
// =====================================================================
p({ src: LBS, fam: "lower_body_skill", key: "lbs_unilateral_priority", title: "Unilateral squat skill is gated by control, not bravery", sum: "Pistol/shrimp/skater squat readiness depends on demonstrated control (mobility, knee tracking, stable trunk), not on willingness to attempt the movement.", w: 2, ev: "Unilateral squat readiness gated by control" })
p({ src: LBS, fam: "lower_body_skill", key: "lbs_substitute_when_blocked", title: "Substitute when joint or mobility blocks the target skill", sum: "If a target unilateral skill is blocked by mobility/knee/hip restrictions, substitute with split squat, step-up, skater, shrimp, or assisted/box variant labeled as carryover work.", w: 2, ev: "Unilateral squat substitute selected for readiness" })
sel({ src: LBS, fam: "lower_body_skill", key: "lbs_pistol_pool", applies: { selectedLowerBodySkills: { includes: "pistol_squat" } }, rule: { ladder: ["box_pistol_high", "box_pistol_low", "assisted_pistol_band", "assisted_pistol_pole", "negative_pistol", "full_pistol", "tempo_pistol", "weighted_pistol"] }, ev: "Pistol squat progression gated by control" })
sel({ src: LBS, fam: "lower_body_skill", key: "lbs_shrimp_pool", applies: { selectedLowerBodySkills: { includes: "shrimp_squat" } }, rule: { ladder: ["assisted_shrimp_pole", "hand_assisted_shrimp", "shrimp_to_box", "full_shrimp", "advanced_shrimp"] }, ev: "Shrimp squat progression gated by control" })
sel({ src: LBS, fam: "lower_body_skill", key: "lbs_skater_pool", applies: { selectedLowerBodySkills: { includes: "skater_squat" } }, rule: { ladder: ["assisted_skater", "skater_to_box", "full_skater", "weighted_skater"] }, ev: "Skater squat progression gated by control" })
sel({ src: LBS, fam: "lower_body_skill", key: "lbs_split_squat_pool", applies: { selectedLowerBodySkills: { includes: "split_squat_strength" } }, rule: { ladder: ["bodyweight_split_squat", "rear_foot_elevated_split_squat", "bulgarian_split_squat", "weighted_bulgarian_split_squat"] }, ev: "Split squat progression for unilateral strength" })
sel({ src: LBS, fam: "lower_body_skill", key: "lbs_step_up_pool", applies: { lowerBodyBlock: "unilateral_strength" }, rule: { ladder: ["low_step_up", "knee_height_step_up", "high_step_up", "weighted_step_up"] }, ev: "Step-up provides knee-friendly unilateral pattern" })
sel({ src: LBS, fam: "lower_body_skill", key: "lbs_mobility_pool", applies: { selectedLowerBodySkills: { includes: "lower_body_mobility" } }, rule: { include: ["ankle_dorsiflexion_drill", "hip_90_90", "deep_squat_hold", "cossack_mobility", "tibialis_raise"] }, ev: "Lower-body mobility supports skill access" })
progr({ src: LBS, fam: "lower_body_skill", key: "lbs_pistol_progression", applies: { selectedLowerBodySkills: { includes: "pistol_squat" } }, rule: { gates: { box_pistol_to_assisted: "controlled_eccentric_3s", assisted_to_negative: "controlled_eccentric_5s_hand_assist_only_for_concentric", negative_to_full: "clean_negative_5s_then_first_full_attempt", full_to_tempo: "5_clean_pistols_each_side", tempo_to_weighted: "10_clean_pistols_each_side" } }, ev: "Pistol squat progression gated by control" })
progr({ src: LBS, fam: "lower_body_skill", key: "lbs_knee_friendly_default", applies: { athleteContext: { kneeSensitivity: true } }, rule: { defaultLadder: ["box_pistol_high", "split_squat", "step_up", "skater_to_box"], avoid: ["deep_pistol", "deep_dragon", "sissy_squat_loaded"] }, t: "hard_constraint", ev: "Knee-sensitive leg progression protected" })
progr({ src: LBS, fam: "lower_body_skill", key: "lbs_balance_first", applies: { selectedLowerBodySkills: { includesAny: ["pistol_squat", "skater_squat", "shrimp_squat"] }, athleteLevel: "beginner" }, rule: { prerequisite: "single_leg_balance_30s_each_side" }, ev: "Balance prerequisite before unilateral squat skill" })
meth({ src: LBS, fam: "lower_body_skill", key: "lbs_volume_default", applies: { lowerBodyBlock: "skill" }, rule: { setsPerSide: [3, 5], repsPerSide: [3, 6], restSec: [120, 180] }, ev: "Unilateral skill dose is moderate sets/low reps" })
rx({ src: LBS, fam: "lower_body_skill", key: "lbs_session_dose_default", applies: { lowerBodyBlock: "skill" }, rule: { totalMinRange: [20, 35], priority: "skill_quality_over_volume" }, ev: "Unilateral skill session is short and quality-first" })
rx({ src: LBS, fam: "lower_body_skill", key: "lbs_warmup_required", applies: { lowerBodyBlock: "skill" }, rule: { warmupIncludes: ["ankle_dorsiflexion", "hip_90_90", "deep_squat_hold_30s"] }, ev: "Unilateral skill requires mobility warm-up" })
carry({ src: LBS, fam: "lower_body_skill", sourceKey: "split_squat", targetSkill: "pistol_squat", type: "support", strength: 0.55, ev: "Split squat strength supports pistol squat" })
carry({ src: LBS, fam: "lower_body_skill", sourceKey: "step_up", targetSkill: "pistol_squat", type: "support", strength: 0.5, ev: "Step-up supports unilateral squat readiness" })
carry({ src: LBS, fam: "lower_body_skill", sourceKey: "deep_squat_hold", targetSkill: "dragon_squat", type: "mobility_prerequisite", strength: 0.7, ev: "Deep squat mobility feeds dragon squat" })

// =====================================================================
// 2. DRAGON SQUAT SKILL (DSS) — 14 atoms
// =====================================================================
p({ src: DSS, fam: "dragon_squat_skill", key: "dss_mobility_first", title: "Dragon squat is mobility-and-control gated, not strength-gated", sum: "Dragon squat requires ankle dorsiflexion, hip rotation/control, knee tracking tolerance, trunk rotation, and deep squat mobility before any meaningful loading.", w: 2, t: "hard_constraint", ev: "Dragon squat gated by mobility and control" })
p({ src: DSS, fam: "dragon_squat_skill", key: "dss_no_aggressive_loading", title: "No aggressive loading until clean control exists", sum: "Loaded dragon squat is locked behind clean unloaded reps; aggressive load before control causes knee/ankle/hip stress.", w: 2, t: "hard_constraint", ev: "Dragon squat gated by mobility and control" })
sel({ src: DSS, fam: "dragon_squat_skill", key: "dss_progression_pool", applies: { selectedLowerBodySkills: { includes: "dragon_squat" } }, rule: { ladder: ["cossack_squat_mobility", "split_squat_mobility", "assisted_dragon_squat_pole", "partial_rom_dragon_squat", "eccentric_dragon_squat", "controlled_full_dragon_squat", "tempo_dragon_squat", "loaded_dragon_squat"] }, ev: "Dragon squat progression ladder" })
sel({ src: DSS, fam: "dragon_squat_skill", key: "dss_substitutes", applies: { selectedLowerBodySkills: { includes: "dragon_squat" }, mobilityLimited: true }, rule: { substitute: ["cossack_squat", "split_squat", "rear_foot_elevated_split_squat"] }, ev: "Dragon squat substitute when mobility-limited" })
progr({ src: DSS, fam: "dragon_squat_skill", key: "dss_prereq_gate", applies: { selectedLowerBodySkills: { includes: "dragon_squat" } }, rule: { prerequisites: { ankleDorsiflexion: "knee_past_toe_5cm_min", deepSquatHold: "60s_with_heels_down", cossackSquatRom: "controlled_full_rom_each_side", singleLegBalance: "30s_each_side" } }, t: "hard_constraint", ev: "Dragon squat gated by mobility and control" })
progr({ src: DSS, fam: "dragon_squat_skill", key: "dss_eccentric_first", applies: { dragonSquatStage: "intro" }, rule: { method: "controlled_eccentric_only_first_2_weeks", tempo: "5s_descent" }, ev: "Dragon squat introduced via controlled eccentric" })
progr({ src: DSS, fam: "dragon_squat_skill", key: "dss_load_lockout", applies: { dragonSquatStage: { in: ["intro", "partial", "eccentric"] } }, rule: { externalLoad: "forbidden" }, t: "hard_constraint", ev: "Dragon squat load locked until clean control" })
meth({ src: DSS, fam: "dragon_squat_skill", key: "dss_default_method", applies: { dragonSquatStage: "controlled_full" }, rule: { setsPerSide: [3, 4], repsPerSide: [2, 4], restSec: 180, tempo: "3s_descent_pause_1s_drive" }, ev: "Dragon squat dose is low-rep tempo" })
meth({ src: DSS, fam: "dragon_squat_skill", key: "dss_assisted_method", applies: { dragonSquatStage: { in: ["intro", "partial"] } }, rule: { assistanceAllowed: true, options: ["pole_assist", "trx_strap", "wall_hand_support"] }, ev: "Dragon squat may use pole/strap assist" })
rx({ src: DSS, fam: "dragon_squat_skill", key: "dss_session_dose", applies: { selectedLowerBodySkills: { includes: "dragon_squat" } }, rule: { perWeek: [1, 2], perSessionTotalMin: [15, 25] }, ev: "Dragon squat 1-2x/week, short doses" })
rx({ src: DSS, fam: "dragon_squat_skill", key: "dss_warmup_extended", applies: { selectedLowerBodySkills: { includes: "dragon_squat" } }, rule: { warmupMinExtra: 8, includes: ["ankle_drill", "hip_90_90", "deep_squat_hold", "cossack_mobility"] }, ev: "Dragon squat needs extended mobility warm-up" })
carry({ src: DSS, fam: "dragon_squat_skill", sourceKey: "cossack_squat", targetSkill: "dragon_squat", type: "mobility_prerequisite", strength: 0.65, ev: "Cossack mobility feeds dragon squat" })
carry({ src: DSS, fam: "dragon_squat_skill", sourceKey: "split_squat", targetSkill: "dragon_squat", type: "support", strength: 0.5, ev: "Split squat supports dragon squat strength" })
carry({ src: DSS, fam: "dragon_squat_skill", sourceKey: "deep_squat_hold", targetSkill: "dragon_squat", type: "mobility_prerequisite", strength: 0.7, ev: "Deep squat mobility feeds dragon squat" })

// =====================================================================
// 3. LOWER-BODY STRENGTH / HYPERTROPHY (LSH) — 21 atoms
// =====================================================================
p({ src: LSH, fam: "lower_body_strength", key: "lsh_squat_hinge_balance", title: "Programs balance squat (knee-dominant) and hinge (hip-dominant)", sum: "Lower-body programming includes both knee-dominant (squat/lunge/split squat) and hip-dominant (hinge/RDL/deadlift/glute bridge) patterns to protect joints and develop carryover.", w: 2, ev: "Squat and hinge balance preserved" })
p({ src: LSH, fam: "lower_body_strength", key: "lsh_unilateral_inclusion", title: "Unilateral pattern is included in regular leg training", sum: "At least one unilateral pattern (split squat / lunge / step-up / pistol regression) appears alongside bilateral work to address asymmetries.", w: 1, ev: "Regular lower-body balance included" })
p({ src: LSH, fam: "lower_body_strength", key: "lsh_calf_inclusion", title: "Calves and ankle/foot tissue are not skipped", sum: "Calf and ankle/foot durability work is included even in minimal-leg programs because they limit running, jumping, and rucking.", w: 1, ev: "Lower-leg durability supports running/rucking" })
sel({ src: LSH, fam: "lower_body_strength", key: "lsh_squat_pool", applies: { lowerBodyBlock: "knee_dominant" }, rule: { include: ["back_squat", "front_squat", "goblet_squat", "bulgarian_split_squat", "lunge_walking", "lunge_reverse"] }, ev: "Knee-dominant squat pool" })
sel({ src: LSH, fam: "lower_body_strength", key: "lsh_hinge_pool", applies: { lowerBodyBlock: "hip_dominant" }, rule: { include: ["conventional_deadlift", "trap_bar_deadlift", "romanian_deadlift", "stiff_leg_deadlift", "hip_thrust", "glute_bridge"] }, ev: "Hip-dominant hinge pool" })
sel({ src: LSH, fam: "lower_body_strength", key: "lsh_unilateral_pool", applies: { lowerBodyBlock: "unilateral" }, rule: { include: ["bulgarian_split_squat", "rear_foot_elevated_split_squat", "lunge_walking", "step_up", "single_leg_rdl"] }, ev: "Unilateral strength pool" })
sel({ src: LSH, fam: "lower_body_strength", key: "lsh_calf_pool", applies: { lowerBodyBlock: "calf_ankle" }, rule: { include: ["standing_calf_raise", "seated_calf_raise", "single_leg_calf_raise", "tibialis_raise", "ankle_eversion_inversion"] }, ev: "Calf/ankle pool" })
sel({ src: LSH, fam: "lower_body_strength", key: "lsh_glute_pool", applies: { lowerBodyBlock: "glute" }, rule: { include: ["hip_thrust", "glute_bridge", "single_leg_glute_bridge", "kas_glute_bridge", "cable_pull_through"] }, ev: "Glute pool" })
sel({ src: LSH, fam: "lower_body_strength", key: "lsh_hamstring_pool", applies: { lowerBodyBlock: "hamstring" }, rule: { include: ["nordic_curl_assisted", "nordic_curl_full", "leg_curl_machine", "single_leg_rdl", "good_morning"] }, ev: "Hamstring pool" })
progr({ src: LSH, fam: "lower_body_strength", key: "lsh_pattern_balance", applies: { goalPriority: { in: ["hypertrophy", "hybrid_strength", "general_strength"] } }, rule: { weeklyPatterns: { knee_dominant_min: 1, hip_dominant_min: 1, unilateral_min: 1, calf_min: 1 } }, ev: "Squat and hinge balance preserved" })
progr({ src: LSH, fam: "lower_body_strength", key: "lsh_dose_progression", applies: { lowerBodyBlock: "strength" }, rule: { progression: "double_progression", repRange: [5, 12], setRange: [3, 5] }, ev: "Lower-body strength uses double progression" })
progr({ src: LSH, fam: "lower_body_strength", key: "lsh_hinge_dose_around_pulling", applies: { dayHasHeavyPulling: true }, rule: { hingeDose: "reduced_or_moved_to_other_day", reason: "shared_lower_back_fatigue_with_pulling" }, t: "soft_preference", ev: "Hinge strength dosed around skill and tactical load" })
meth({ src: LSH, fam: "lower_body_strength", key: "lsh_compound_first", applies: { lowerBodyBlock: "strength" }, rule: { order: ["compound_pattern_first", "unilateral_second", "isolation_last"] }, ev: "Compound lower-body work ordered first" })
meth({ src: LSH, fam: "lower_body_strength", key: "lsh_squat_form_cap", applies: { exercise: { in: ["back_squat", "front_squat", "goblet_squat"] } }, rule: { rom: "to_quality_depth_not_to_failure", failureAllowed: false }, ev: "Squat ROM/quality capped before failure" })
meth({ src: LSH, fam: "lower_body_strength", key: "lsh_deadlift_form_cap", applies: { exercise: { in: ["conventional_deadlift", "romanian_deadlift", "stiff_leg_deadlift", "trap_bar_deadlift"] } }, rule: { stopOnFormBreak: true, failureAllowed: false }, t: "hard_constraint", ev: "Deadlift stops on form break, not at failure" })
rx({ src: LSH, fam: "lower_body_strength", key: "lsh_session_dose_regular", applies: { legTrainingPreference: "regular_leg_training" }, rule: { perWeek: [2, 3], perSessionMinRange: [40, 70] }, ev: "Regular lower-body 2-3x/week" })
rx({ src: LSH, fam: "lower_body_strength", key: "lsh_session_dose_minimal", applies: { legTrainingPreference: "minimal_leg_training" }, rule: { perWeek: [1, 2], perSessionMinRange: [15, 25] }, ev: "Minimal leg dose protects skill consistency" })
rx({ src: LSH, fam: "lower_body_strength", key: "lsh_calf_required_minimum", applies: { legTrainingPreference: { in: ["minimal_leg_training", "regular_leg_training", "tactical_leg_emphasis"] } }, rule: { calfWorkMinPerWeek: 1 }, ev: "Lower-leg durability supports running/rucking" })
carry({ src: LSH, fam: "lower_body_strength", sourceKey: "trap_bar_deadlift", targetSkill: "ruck", type: "support", strength: 0.6, ev: "Hinge strength supports load carriage" })
carry({ src: LSH, fam: "lower_body_strength", sourceKey: "bulgarian_split_squat", targetSkill: "sprint_drag_carry", type: "support", strength: 0.55, ev: "Unilateral strength supports tactical shuttle" })
carry({ src: LSH, fam: "lower_body_strength", sourceKey: "calf_raise", targetSkill: "two_mile_run", type: "durability_support", strength: 0.45, ev: "Calf durability supports running" })

// =====================================================================
// 4. SKILL INTERFERENCE / LEG DOSE (SIL) — 18 atoms
// =====================================================================
p({ src: SIL, fam: "leg_skill_interference", key: "sil_preference_respected", title: "Leg-training preference is user truth, surfaced honestly", sum: "Programs respect legTrainingPreference (no/minimal/regular/tactical) and surface a clear imbalance warning when the user picks no_leg_training.", w: 2, ev: "Leg preference respected with imbalance warning" })
p({ src: SIL, fam: "leg_skill_interference", key: "sil_no_leg_warning", title: "No-leg training carries an honest imbalance warning", sum: "Skipping leg training can create strength, durability, and balance gaps. The user choice is allowed but the warning is shown.", w: 2, ev: "Leg preference respected with imbalance warning" })
p({ src: SIL, fam: "leg_skill_interference", key: "sil_minimal_default_for_skill", title: "Minimal leg training is the recommended default for calisthenics skill athletes", sum: "Handstand/planche/front-lever/back-lever athletes default to minimal_leg_training (1-2 short exposures/wk) to preserve joint integrity without wrecking skill consistency.", w: 1, ev: "Minimal leg dose protects skill consistency" })
p({ src: SIL, fam: "leg_skill_interference", key: "sil_tactical_overrides_minimal", title: "Tactical/military goal overrides toward stronger leg emphasis", sum: "Military or tactical goals require sufficient lower-body durability for running/sprinting/rucking/carries — minimal_leg_training is upgraded toward tactical_leg_emphasis unless the user explicitly refuses.", w: 2, ev: "Military goal increases lower-body durability priority" })
sel({ src: SIL, fam: "leg_skill_interference", key: "sil_minimal_leg_pool", applies: { legTrainingPreference: "minimal_leg_training" }, rule: { include: ["bulgarian_split_squat", "step_up", "single_leg_rdl", "single_leg_glute_bridge", "calf_raise", "tibialis_raise", "ankle_mobility"], exclude_default: ["heavy_back_squat_5x5", "heavy_conventional_deadlift_5x5"] }, ev: "Minimal leg dose protects skill consistency" })
sel({ src: SIL, fam: "leg_skill_interference", key: "sil_no_leg_optional_pool", applies: { legTrainingPreference: "no_leg_training" }, rule: { optional: ["short_walk", "calf_raise", "ankle_mobility", "hip_mobility"], required: [] }, ev: "Leg preference respected with imbalance warning" })
progr({ src: SIL, fam: "leg_skill_interference", key: "sil_skill_day_buffer", applies: { dayHasHighSkillPriority: true }, rule: { heavyLegWork: "not_immediately_before_skill_day", buffer: "schedule_after_high_skill_or_on_lower_priority_day" }, t: "soft_preference", ev: "Leg soreness managed around skill days" })
progr({ src: SIL, fam: "leg_skill_interference", key: "sil_dose_when_skill_consistency_priority", applies: { athleteContext: { skillConsistencyPriority: true } }, rule: { legDose: "low_soreness_options", avoid: ["high_eccentric_volume_immediately_before_skill"] }, ev: "Leg soreness managed around skill days" })
progr({ src: SIL, fam: "leg_skill_interference", key: "sil_no_leg_warning_required", applies: { legTrainingPreference: "no_leg_training" }, rule: { mustShowWarning: true, copyKey: "leg_imbalance_warning" }, t: "hard_constraint", ev: "Leg preference respected with imbalance warning" })
progr({ src: SIL, fam: "leg_skill_interference", key: "sil_tactical_no_leg_warning", applies: { legTrainingPreference: "no_leg_training", militaryTrainingGoal: { not: "none" } }, rule: { mustShowWarning: true, copyKey: "tactical_no_leg_warning", recommendation: "tactical_leg_emphasis" }, t: "hard_constraint", ev: "No-leg choice warned for tactical goal" })
meth({ src: SIL, fam: "leg_skill_interference", key: "sil_low_interference_pattern", applies: { legTrainingPreference: "minimal_leg_training" }, rule: { method: "low_volume_low_eccentric", setsPerExercise: [2, 3], repsPerSet: [6, 12], restSec: [90, 120] }, ev: "Minimal leg dose protects skill consistency" })
meth({ src: SIL, fam: "leg_skill_interference", key: "sil_avoid_dom_inducing_combos", applies: { legTrainingPreference: { in: ["minimal_leg_training", "regular_leg_training"] }, dayHasHighSkillPriority: true }, rule: { avoid: ["nordic_curls_to_failure", "bulgarian_split_squat_to_failure", "deep_pistol_volume"] }, ev: "DOMS-inducing leg combos avoided near skill days" })
rx({ src: SIL, fam: "leg_skill_interference", key: "sil_minimal_dose", applies: { legTrainingPreference: "minimal_leg_training" }, rule: { perWeek: [1, 2], perSessionMinRange: [12, 25] }, ev: "Minimal leg dose protects skill consistency" })
rx({ src: SIL, fam: "leg_skill_interference", key: "sil_tactical_dose", applies: { legTrainingPreference: "tactical_leg_emphasis" }, rule: { perWeek: [2, 4], perSessionMinRange: [25, 60], includes: ["hinge_strength", "unilateral_strength", "calf_durability", "running_or_rucking_carryover"] }, ev: "Military goal increases lower-body durability priority" })
rx({ src: SIL, fam: "leg_skill_interference", key: "sil_no_leg_dose", applies: { legTrainingPreference: "no_leg_training" }, rule: { perWeek: [0, 1], optionalIncludes: ["calf_raise", "ankle_mobility", "hip_mobility"] }, ev: "Leg preference respected with imbalance warning" })
rx({ src: SIL, fam: "leg_skill_interference", key: "sil_warning_copy_leg_imbalance", applies: { copyKey: "leg_imbalance_warning" }, rule: { text: "Skipping leg training can create strength, durability, and balance gaps. For calisthenics skill athletes, SpartanLab recommends at least minimal lower-body work to support joints, posture, and long-term athletic balance. You can still choose no leg training if that is your preference." }, ev: "Leg-imbalance warning copy defined" })
rx({ src: SIL, fam: "leg_skill_interference", key: "sil_warning_copy_tactical_no_leg", applies: { copyKey: "tactical_no_leg_warning" }, rule: { text: "Military/tactical goals rely heavily on running, sprinting, load carriage, rucking, carries, and lower-body durability. SpartanLab strongly recommends at least minimal tactical leg preparation for this goal." }, ev: "Tactical no-leg warning copy defined" })
carry({ src: SIL, fam: "leg_skill_interference", sourceKey: "calf_raise", targetSkill: "handstand", type: "indirect_durability", strength: 0.2, ev: "Calf/ankle durability indirectly supports skill standing/balance" })

// =====================================================================
// 5. MILITARY FITNESS TEST FOUNDATION (MFT) — 22 atoms
// =====================================================================
p({ src: MFT, fam: "military_fitness", key: "mft_test_specificity", title: "Military prep is matched to selected test events first", sum: "Programs identify the target test/events before prescribing volume; generic hard PT does not replace event-specific preparation.", w: 2, t: "hard_constraint", ev: "Military prep matched to selected test events" })
p({ src: MFT, fam: "military_fitness", key: "mft_weakest_event_priority", title: "Weakest event receives priority without neglecting the rest", sum: "The limiting event drives priority and additional exposure, but total-test readiness is preserved (no event drops below maintenance).", w: 1, ev: "Weakest event prioritized without neglecting total test" })
p({ src: MFT, fam: "military_fitness", key: "mft_no_smoke_session", title: "Military prep is not a random punishment circuit", sum: "Programs avoid 'smoke session' fatigue that wrecks recovery and yields little improvement; goal is efficient score and durability gains.", w: 2, ev: "Military prep avoids random smoke-session fatigue" })
p({ src: MFT, fam: "military_fitness", key: "mft_taper_required", title: "A taper precedes the test", sum: "The week before the test reduces fatigue, preserves event rhythm, sharpens pacing, avoids new exercises, and avoids hard leg soreness.", w: 1, ev: "Test week tapers fatigue while preserving event rhythm" })
sel({ src: MFT, fam: "military_fitness", key: "mft_pushup_pool", applies: { militaryEventPriorities: { includesAny: ["pushups", "hand_release_pushups"] } }, rule: { include: ["pushup_volume_set", "pushup_density_emom", "pushup_ladder", "pushup_test_pace_practice", "incline_pushup_volume", "negative_pushup", "hand_release_pushup"] }, ev: "Push-up endurance built with submaximal volume" })
sel({ src: MFT, fam: "military_fitness", key: "mft_pullup_pool", applies: { militaryEventPriorities: { includes: "pullups" } }, rule: { include: ["pullup_ladder", "pullup_volume_submax", "negative_pullup", "assisted_pullup_band", "weighted_pullup_low_volume"] }, ev: "Pull-up test prep uses volume without max-out abuse" })
sel({ src: MFT, fam: "military_fitness", key: "mft_plank_pool", applies: { militaryEventPriorities: { includes: "plank" } }, rule: { include: ["plank_progressive_hold", "plank_variations", "anti_extension_drill", "rkc_plank", "plank_test_pace_practice"] }, ev: "Plank endurance progressed with position quality" })
sel({ src: MFT, fam: "military_fitness", key: "mft_situp_pool", applies: { militaryEventPriorities: { includes: "situps_or_core" } }, rule: { include: ["situp_volume", "cross_leg_reverse_crunch", "trunk_endurance_circuit", "situp_test_pace_practice"] }, ev: "Core test option trained specifically" })
progr({ src: MFT, fam: "military_fitness", key: "mft_pushup_progression", applies: { militaryEventPriorities: { includesAny: ["pushups", "hand_release_pushups"] } }, rule: { weeklyMix: { volume_submax_sessions: 2, density_emom_sessions: 1, test_pace_session: 1 }, formCap: "stop_at_form_break_not_failure" }, ev: "Push-up endurance built with submaximal volume" })
progr({ src: MFT, fam: "military_fitness", key: "mft_pullup_progression", applies: { militaryEventPriorities: { includes: "pullups" } }, rule: { weeklyMix: { ladder_session: 1, volume_submax_session: 1, attempts_session_optional: "1_max_per_2_weeks" } }, ev: "Pull-up test prep uses volume without max-out abuse" })
progr({ src: MFT, fam: "military_fitness", key: "mft_run_progression", applies: { militaryEventPriorities: { includesAny: ["one_point_five_mile_run", "two_mile_run", "three_mile_run"] } }, rule: { weeklyMix: { easy_aerobic: 2, intervals_or_repeats: 1, tempo_or_threshold: 1, test_pace_practice_per_2_weeks: 1 }, hardRunAvoidance: "not_every_run_hard" }, ev: "Run prep uses base, speed, pace, and taper" })
progr({ src: MFT, fam: "military_fitness", key: "mft_no_max_every_day", applies: { militaryEventPriorities: { includesAny: ["pushups", "hand_release_pushups", "pullups", "situps_or_core"] } }, rule: { rule: "do_not_max_test_event_every_session", maxAttemptCadence: "every_2_to_4_weeks" }, t: "hard_constraint", ev: "Push-up endurance built with submaximal volume" })
meth({ src: MFT, fam: "military_fitness", key: "mft_taper_method", applies: { sessionContext: "test_week" }, rule: { volumeReduction: 0.4, intensityPreserve: true, avoidNewExercises: true, avoidHardLegSoreness: true }, ev: "Test week tapers fatigue while preserving event rhythm" })
meth({ src: MFT, fam: "military_fitness", key: "mft_diagnostic_to_official", applies: { hasTestDate: true }, rule: { phases: ["base", "build", "specific", "taper"], diagnosticEvery: "4_weeks_or_as_needed" }, ev: "Periodized prep with diagnostic checkpoints" })
meth({ src: MFT, fam: "military_fitness", key: "mft_event_pacing_practice", applies: { phase: "specific" }, rule: { rule: "practice_event_pacing_with_partial_distance_or_time" }, ev: "Test-pace practice in specific phase" })
rx({ src: MFT, fam: "military_fitness", key: "mft_session_total_default", applies: { militaryTrainingGoal: { not: "none" } }, rule: { perWeek: [4, 6], perSessionMinRange: [45, 75] }, ev: "Military prep ~4-6 sessions/week" })
rx({ src: MFT, fam: "military_fitness", key: "mft_warmup_running", applies: { sessionContext: "running" }, rule: { warmupMin: 8, includes: ["dynamic_drills", "leg_swings", "easy_run_buildup"] }, ev: "Run sessions warm up dynamically" })
rx({ src: MFT, fam: "military_fitness", key: "mft_warmup_strength", applies: { sessionContext: "strength_or_endurance_test_event" }, rule: { warmupMin: 8, includes: ["mobility_drill", "specific_movement_pattern_buildup"] }, ev: "Strength sessions warm up specifically" })
rx({ src: MFT, fam: "military_fitness", key: "mft_test_event_pacing", applies: { phase: "specific" }, rule: { runPaceTarget: "test_pace_minus_5_to_10_seconds_per_distance_unit", repPaceTarget: "controlled_rhythm_at_or_below_max_sustainable" }, ev: "Test-pace practice in specific phase" })
rx({ src: MFT, fam: "military_fitness", key: "mft_recovery_protect", applies: { militaryTrainingGoal: { not: "none" } }, rule: { sleepMinHr: 7, easyDayPerWeek: 1 }, ev: "Recovery protected to enable adaptation" })
carry({ src: MFT, fam: "military_fitness", sourceKey: "pushup_volume_set", targetSkill: "pushups", type: "direct", strength: 0.85, ev: "Pushup volume directly improves pushup test" })
carry({ src: MFT, fam: "military_fitness", sourceKey: "plank_progressive_hold", targetSkill: "plank", type: "direct", strength: 0.9, ev: "Plank holds directly improve plank test" })

// =====================================================================
// 6. ARMY AFT/ACFT-style TACTICAL PREP (AAT) — 18 atoms
// =====================================================================
p({ src: AAT, fam: "army_tactical", key: "aat_six_event_balance", title: "Army-style prep balances strength, power, anaerobic, core, run", sum: "AFT/ACFT-style prep covers deadlift strength, hand-release push-up endurance, sprint-drag-carry/shuttle anaerobic power, core, and 2-mile run — none neglected.", w: 2, ev: "Branch test events mapped before programming" })
p({ src: AAT, fam: "army_tactical", key: "aat_lower_body_priority", title: "Lower-body durability is a priority for Army-style prep", sum: "Sprinting, drag/carry, shuttle, and 2-mile run all load the lower body — leg work is not minimized for Army prep.", w: 1, ev: "Military goal increases lower-body durability priority" })
sel({ src: AAT, fam: "army_tactical", key: "aat_deadlift_pool", applies: { militaryTrainingGoal: "army_aft", militaryEventPriorities: { includes: "loaded_carry" } }, rule: { include: ["trap_bar_deadlift", "conventional_deadlift", "romanian_deadlift", "kettlebell_deadlift", "single_leg_rdl"] }, ev: "Deadlift strength supports tactical events" })
sel({ src: AAT, fam: "army_tactical", key: "aat_hrp_pool", applies: { militaryTrainingGoal: "army_aft", militaryEventPriorities: { includes: "hand_release_pushups" } }, rule: { include: ["hand_release_pushup", "pushup_volume_set", "pushup_density_emom", "pushup_ladder"] }, ev: "Hand-release push-up endurance" })
sel({ src: AAT, fam: "army_tactical", key: "aat_sdc_pool", applies: { militaryTrainingGoal: "army_aft", militaryEventPriorities: { includes: "sprint_drag_carry" } }, rule: { include: ["shuttle_run_25m", "sled_drag", "lateral_shuffle", "kettlebell_carry", "sandbag_carry"] }, ev: "Shuttle/carry event trained with repeat power" })
sel({ src: AAT, fam: "army_tactical", key: "aat_core_pool", applies: { militaryTrainingGoal: "army_aft", militaryEventPriorities: { includesAny: ["plank", "situps_or_core"] } }, rule: { include: ["plank_progressive_hold", "rkc_plank", "anti_extension_drill", "leg_tuck_progression"] }, ev: "Plank endurance progressed with position quality" })
sel({ src: AAT, fam: "army_tactical", key: "aat_run_pool", applies: { militaryTrainingGoal: "army_aft", militaryEventPriorities: { includes: "two_mile_run" } }, rule: { include: ["easy_aerobic_run", "tempo_run", "400m_repeats", "800m_repeats", "two_mile_test_pace"] }, ev: "Run prep uses base, speed, pace, and taper" })
progr({ src: AAT, fam: "army_tactical", key: "aat_deadlift_progression", applies: { militaryTrainingGoal: "army_aft" }, rule: { sessionsPerWeek: [1, 2], setsRange: [3, 5], repRange: [3, 6], progression: "linear_then_double_progression", formCap: "stop_on_form_break" }, ev: "Hinge strength dosed around skill and tactical load" })
progr({ src: AAT, fam: "army_tactical", key: "aat_sdc_progression", applies: { militaryTrainingGoal: "army_aft", militaryEventPriorities: { includes: "sprint_drag_carry" } }, rule: { sessionsPerWeek: [1, 2], roundsRange: [4, 8], rest: "1_to_2x_work_time" }, ev: "Shuttle/carry event trained with repeat power" })
progr({ src: AAT, fam: "army_tactical", key: "aat_two_mile_progression", applies: { militaryTrainingGoal: "army_aft", militaryEventPriorities: { includes: "two_mile_run" } }, rule: { weeklyMix: { easy: 2, tempo_or_threshold: 1, repeats: 1 }, testPaceCadence: "every_2_weeks_in_specific_phase" }, ev: "Run prep uses base, speed, pace, and taper" })
meth({ src: AAT, fam: "army_tactical", key: "aat_hrp_density", applies: { militaryTrainingGoal: "army_aft", militaryEventPriorities: { includes: "hand_release_pushups" } }, rule: { method: "emom_or_ladder", repsPerMinuteCap: "submax_60_to_70_pct", durationMin: [8, 12] }, ev: "Push-up endurance built with submaximal volume" })
meth({ src: AAT, fam: "army_tactical", key: "aat_event_order_fatigue", applies: { sessionContext: "test_simulation" }, rule: { eventOrder: ["acft_deadlift", "acft_spt", "acft_hrp", "acft_sdc", "acft_ltk", "acft_run"], rationale: "matches_official_test_order_to_train_fatigue_interaction" }, ev: "Test order rehearsed for fatigue interaction" })
rx({ src: AAT, fam: "army_tactical", key: "aat_session_template", applies: { militaryTrainingGoal: "army_aft" }, rule: { weeklySessions: [4, 5], sessionTemplates: ["strength_lower", "endurance_upper", "anaerobic_shuttle", "long_run_or_tempo", "core_durability"] }, ev: "Branch test events mapped before programming" })
rx({ src: AAT, fam: "army_tactical", key: "aat_warmup_sdc", applies: { sessionContext: "sprint_drag_carry" }, rule: { warmupMin: 12, includes: ["dynamic_leg_swings", "ankle_pogo", "10m_acceleration_buildup", "lateral_shuffle"] }, ev: "Shuttle warmup includes acceleration prep" })
rx({ src: AAT, fam: "army_tactical", key: "aat_recovery_around_sdc", applies: { sessionContext: "sprint_drag_carry" }, rule: { restDayAfter: true, avoidHeavyLegNextDay: true }, ev: "Anaerobic shuttle recovery protected" })
carry({ src: AAT, fam: "army_tactical", sourceKey: "trap_bar_deadlift", targetSkill: "acft_deadlift", type: "direct", strength: 0.95, ev: "Trap-bar deadlift directly improves ACFT deadlift" })
carry({ src: AAT, fam: "army_tactical", sourceKey: "kettlebell_carry", targetSkill: "sprint_drag_carry", type: "support", strength: 0.6, ev: "Loaded carry supports SDC carry segment" })
carry({ src: AAT, fam: "army_tactical", sourceKey: "tempo_run", targetSkill: "two_mile_run", type: "support", strength: 0.7, ev: "Tempo run supports 2-mile pacing" })

// =====================================================================
// 7. MARINE PFT/CFT PREP (MPC) — 18 atoms
// =====================================================================
p({ src: MPC, fam: "marine_tactical", key: "mpc_pft_event_balance", title: "PFT prep balances pull/push, plank, and 3-mile run", sum: "PFT prep covers pull-ups (or push-ups option), plank, and 3-mile run with event-specific endurance and pacing.", w: 2, ev: "Branch test events mapped before programming" })
p({ src: MPC, fam: "marine_tactical", key: "mpc_cft_anaerobic_emphasis", title: "CFT prep is anaerobic and combat-style, not steady-state", sum: "CFT MTC/AL/MUF events demand sprint conditioning, overhead pressing endurance, loaded carries, and combat-style circuits.", w: 2, ev: "Shuttle/carry event trained with repeat power" })
sel({ src: MPC, fam: "marine_tactical", key: "mpc_pullup_or_pushup", applies: { militaryTrainingGoal: "marine_pft" }, rule: { eventOptionPool: { pullup: ["pullup_ladder", "pullup_volume_submax", "negative_pullup", "assisted_pullup_band"], pushup: ["pushup_volume_set", "pushup_density_emom", "pushup_ladder"] }, defaultIf: { canDoPullups5: "pullup", else: "pushup" } }, ev: "PFT pull-up or push-up option mapped" })
sel({ src: MPC, fam: "marine_tactical", key: "mpc_three_mile_pool", applies: { militaryTrainingGoal: "marine_pft", militaryEventPriorities: { includes: "three_mile_run" } }, rule: { include: ["easy_aerobic_run", "tempo_run", "800m_repeats", "1mi_repeats", "three_mile_test_pace"] }, ev: "Run prep uses base, speed, pace, and taper" })
sel({ src: MPC, fam: "marine_tactical", key: "mpc_cft_mtc_pool", applies: { militaryTrainingGoal: "marine_cft" }, rule: { include: ["880yd_sprint_intervals", "400m_repeats_fast", "hill_repeats", "mtc_test_pace"] }, ev: "MTC trained with sprint intervals" })
sel({ src: MPC, fam: "marine_tactical", key: "mpc_cft_al_pool", applies: { militaryTrainingGoal: "marine_cft" }, rule: { include: ["dumbbell_overhead_press_emom", "kettlebell_clean_press", "ammo_can_lift_30lb_emom", "push_press_volume"] }, ev: "Ammo lift trained with overhead pressing endurance" })
sel({ src: MPC, fam: "marine_tactical", key: "mpc_cft_muf_pool", applies: { militaryTrainingGoal: "marine_cft" }, rule: { include: ["bear_crawl", "low_crawl", "fireman_carry_partner", "loaded_carry_zigzag", "ball_throw_tactical", "shuttle_with_drag"] }, ev: "MUF trained with combat-style circuits" })
progr({ src: MPC, fam: "marine_tactical", key: "mpc_three_mile_progression", applies: { militaryTrainingGoal: "marine_pft", militaryEventPriorities: { includes: "three_mile_run" } }, rule: { weeklyMix: { easy: 2, tempo_or_threshold: 1, repeats: 1 }, longRunBuild: "10pct_per_week_max" }, ev: "Run prep uses base, speed, pace, and taper" })
progr({ src: MPC, fam: "marine_tactical", key: "mpc_cft_anaerobic_progression", applies: { militaryTrainingGoal: "marine_cft" }, rule: { sessionsPerWeek: [2, 3], roundsRange: [4, 8], rest: "1_to_3x_work_time", testSimulationCadence: "every_3_weeks" }, ev: "CFT anaerobic capacity progressed" })
progr({ src: MPC, fam: "marine_tactical", key: "mpc_pullup_volume_progression", applies: { militaryTrainingGoal: "marine_pft", militaryEventPriorities: { includes: "pullups" } }, rule: { weeklyMix: { ladder: 1, volume_submax: 1, attempt_max: "1_per_2_weeks" }, repCap: "submax_60_to_75_pct" }, ev: "Pull-up test prep uses volume without max-out abuse" })
meth({ src: MPC, fam: "marine_tactical", key: "mpc_test_simulation", applies: { sessionContext: "test_simulation" }, rule: { fullSimulationCadence: "every_4_weeks", partialSimulationCadence: "every_2_weeks", restBetweenEventsMin: [5, 10] }, ev: "Test simulation rehearses event order" })
meth({ src: MPC, fam: "marine_tactical", key: "mpc_pullup_no_kip", applies: { militaryTrainingGoal: "marine_pft", militaryEventPriorities: { includes: "pullups" } }, rule: { repStandard: "dead_hang_strict_or_test_eligible_form" }, ev: "PFT pull-up form standard enforced" })
meth({ src: MPC, fam: "marine_tactical", key: "mpc_cft_circuit_method", applies: { militaryTrainingGoal: "marine_cft" }, rule: { method: "amrap_or_emom_combat_circuit", durationMin: [10, 20] }, ev: "CFT trained as combat-style circuit" })
rx({ src: MPC, fam: "marine_tactical", key: "mpc_pft_session_template", applies: { militaryTrainingGoal: "marine_pft" }, rule: { weeklySessions: [4, 5], sessionTemplates: ["pull_or_push_volume", "core_plank", "easy_aerobic_run", "interval_run", "tempo_run"] }, ev: "Branch test events mapped before programming" })
rx({ src: MPC, fam: "marine_tactical", key: "mpc_cft_session_template", applies: { militaryTrainingGoal: "marine_cft" }, rule: { weeklySessions: [4, 5], sessionTemplates: ["mtc_intervals", "al_overhead_endurance", "muf_circuit", "lower_body_strength", "easy_aerobic_run"] }, ev: "Branch test events mapped before programming" })
carry({ src: MPC, fam: "marine_tactical", sourceKey: "1mi_repeats", targetSkill: "three_mile_run", type: "support", strength: 0.7, ev: "1mi repeats support 3-mile pacing" })
carry({ src: MPC, fam: "marine_tactical", sourceKey: "kettlebell_clean_press", targetSkill: "ammo_can_lifts", type: "support", strength: 0.65, ev: "Overhead pressing endurance supports ammo lift" })
carry({ src: MPC, fam: "marine_tactical", sourceKey: "880yd_sprint_intervals", targetSkill: "movement_to_contact", type: "direct", strength: 0.85, ev: "880yd sprint intervals directly support MTC" })

// =====================================================================
// 8. NAVY PRT PREP (NPP) — 14 atoms
// =====================================================================
p({ src: NPP, fam: "navy_tactical", key: "npp_event_balance", title: "PRT prep balances push-ups, forearm plank, and 1.5-mile run", sum: "PRT covers push-up endurance, forearm plank endurance, and 1.5-mile run; cardio alternatives may apply where supported.", w: 1, ev: "Branch test events mapped before programming" })
p({ src: NPP, fam: "navy_tactical", key: "npp_durability_protected", title: "Shoulder/elbow durability protected by submax volume", sum: "Push-up volume is dosed submaximally to protect shoulder/elbow tissue across a Navy prep block.", w: 1, ev: "Push-up endurance built with submaximal volume" })
sel({ src: NPP, fam: "navy_tactical", key: "npp_pushup_pool", applies: { militaryTrainingGoal: "navy_prt" }, rule: { include: ["pushup_volume_set", "pushup_density_emom", "pushup_ladder", "incline_pushup_volume", "pushup_test_pace_practice"] }, ev: "Push-up endurance built with submaximal volume" })
sel({ src: NPP, fam: "navy_tactical", key: "npp_plank_pool", applies: { militaryTrainingGoal: "navy_prt" }, rule: { include: ["forearm_plank_progressive", "rkc_plank", "side_plank", "anti_extension_drill"] }, ev: "Forearm plank endurance progressed" })
sel({ src: NPP, fam: "navy_tactical", key: "npp_run_pool", applies: { militaryTrainingGoal: "navy_prt", militaryEventPriorities: { includes: "one_point_five_mile_run" } }, rule: { include: ["easy_aerobic_run", "400m_repeats", "tempo_run", "1.5mi_test_pace"] }, ev: "Run prep uses base, speed, pace, and taper" })
progr({ src: NPP, fam: "navy_tactical", key: "npp_pushup_progression", applies: { militaryTrainingGoal: "navy_prt" }, rule: { weeklyMix: { volume_submax: 2, density_emom: 1, test_pace: 1 }, formCap: "stop_at_form_break" }, ev: "Push-up endurance built with submaximal volume" })
progr({ src: NPP, fam: "navy_tactical", key: "npp_plank_progression", applies: { militaryTrainingGoal: "navy_prt" }, rule: { holdProgression: "add_5_to_10s_per_week", positionQualityFirst: true }, ev: "Plank endurance progressed with position quality" })
progr({ src: NPP, fam: "navy_tactical", key: "npp_one_five_mile_progression", applies: { militaryTrainingGoal: "navy_prt", militaryEventPriorities: { includes: "one_point_five_mile_run" } }, rule: { weeklyMix: { easy: 2, intervals: 1, tempo: 1 }, testPaceCadence: "every_2_weeks_specific_phase" }, ev: "Run prep uses base, speed, pace, and taper" })
meth({ src: NPP, fam: "navy_tactical", key: "npp_pushup_emom_method", applies: { militaryTrainingGoal: "navy_prt", sessionType: "density" }, rule: { method: "emom", repsPerMinute: "submax_50_to_70_pct_of_2min_max", durationMin: [8, 12] }, ev: "Push-up density via EMOM" })
meth({ src: NPP, fam: "navy_tactical", key: "npp_swim_alternative", applies: { militaryTrainingGoal: "navy_prt", cardioAlternative: "swim_500m" }, rule: { swimWeeklyMix: { easy: 1, intervals: 1, test_pace: 1 } }, ev: "Swim alternative trained where supported" })
rx({ src: NPP, fam: "navy_tactical", key: "npp_session_template", applies: { militaryTrainingGoal: "navy_prt" }, rule: { weeklySessions: [4, 5], sessionTemplates: ["pushup_volume", "plank_block", "easy_aerobic_run", "interval_run", "tempo_run_or_swim"] }, ev: "Branch test events mapped before programming" })
rx({ src: NPP, fam: "navy_tactical", key: "npp_warmup_run", applies: { sessionContext: "running" }, rule: { warmupMin: 8, includes: ["dynamic_drills", "easy_run_buildup"] }, ev: "Run sessions warm up dynamically" })
carry({ src: NPP, fam: "navy_tactical", sourceKey: "incline_pushup_volume", targetSkill: "pushups", type: "support", strength: 0.5, ev: "Incline pushup volume supports test pushup" })
carry({ src: NPP, fam: "navy_tactical", sourceKey: "400m_repeats", targetSkill: "one_point_five_mile_run", type: "support", strength: 0.7, ev: "400m repeats support 1.5-mile pacing" })

// =====================================================================
// 9. AIR FORCE / SPACE FORCE PFA PREP (APP) — 14 atoms
// =====================================================================
p({ src: APP, fam: "air_force_tactical", key: "app_event_options", title: "PFA includes optional events; user picks strengths", sum: "Air Force/Space Force PFA supports run/HAMR options, push-up or hand-release push-up options, sit-up/cross-leg-reverse-crunch/plank options, and waist-to-height body composition awareness.", w: 1, ev: "Branch test events mapped before programming" })
p({ src: APP, fam: "air_force_tactical", key: "app_one_min_max_specificity", title: "1-minute max-rep events demand pacing practice", sum: "1-min push-up and 1-min sit-up events are paced events; pacing practice (target rep cadence) is a specific-phase requirement.", w: 1, ev: "Test-pace practice in specific phase" })
sel({ src: APP, fam: "air_force_tactical", key: "app_pushup_pool", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] } }, rule: { include: ["pushup_volume_set", "pushup_density_emom", "pushup_ladder", "hand_release_pushup", "1min_pace_pushup_practice"] }, ev: "1-min pushup pacing practiced" })
sel({ src: APP, fam: "air_force_tactical", key: "app_situp_pool", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] }, militaryEventPriorities: { includes: "situps_or_core" } }, rule: { include: ["situp_1min_pace_practice", "cross_leg_reverse_crunch", "trunk_endurance_circuit", "plank_progressive_hold"] }, ev: "Core test option trained specifically" })
sel({ src: APP, fam: "air_force_tactical", key: "app_run_pool", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] }, militaryEventPriorities: { includesAny: ["one_point_five_mile_run", "hamr_or_shuttle"] } }, rule: { include: ["easy_aerobic_run", "400m_repeats", "tempo_run", "1.5mi_test_pace", "hamr_shuttle_practice"] }, ev: "Run/HAMR option trained" })
progr({ src: APP, fam: "air_force_tactical", key: "app_pushup_pacing", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] } }, rule: { paceTarget: "target_reps_per_15s_to_match_score_goal", densitySession: "1_per_week" }, ev: "1-min pushup pacing practiced" })
progr({ src: APP, fam: "air_force_tactical", key: "app_situp_pacing", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] }, militaryEventPriorities: { includes: "situps_or_core" } }, rule: { paceTarget: "target_reps_per_15s", coreEnduranceMix: "alternate_pacing_and_endurance" }, ev: "Sit-up pacing practiced" })
progr({ src: APP, fam: "air_force_tactical", key: "app_run_progression", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] } }, rule: { weeklyMix: { easy: 2, intervals: 1, tempo: 1 }, testPaceCadence: "every_2_weeks_specific_phase" }, ev: "Run prep uses base, speed, pace, and taper" })
meth({ src: APP, fam: "air_force_tactical", key: "app_event_picker", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] } }, rule: { ruleByStrength: { strongRunner: "select_run", strongShuttle: "select_hamr", strongPushup: "select_pushup", strongHrp: "select_hrp", strongCore: "select_situp_or_plank" } }, ev: "Event chosen by strength when allowed" })
meth({ src: APP, fam: "air_force_tactical", key: "app_body_comp_awareness", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] } }, rule: { rule: "support_body_composition_awareness_via_nutrition_and_aerobic_volume_only_no_diet_prescription_in_app" }, ev: "Body composition awareness without prescription" })
rx({ src: APP, fam: "air_force_tactical", key: "app_session_template", applies: { militaryTrainingGoal: { in: ["air_force_pfa", "space_force_pfa"] } }, rule: { weeklySessions: [4, 5], sessionTemplates: ["pushup_or_hrp_volume", "core_pacing_block", "easy_aerobic_run", "interval_run_or_hamr", "tempo_run"] }, ev: "Branch test events mapped before programming" })
rx({ src: APP, fam: "air_force_tactical", key: "app_warmup_run", applies: { sessionContext: "running" }, rule: { warmupMin: 8, includes: ["dynamic_drills", "easy_run_buildup"] }, ev: "Run sessions warm up dynamically" })
carry({ src: APP, fam: "air_force_tactical", sourceKey: "1min_pace_pushup_practice", targetSkill: "pushups", type: "direct", strength: 0.85, ev: "1-min pushup pace practice directly supports test" })
carry({ src: APP, fam: "air_force_tactical", sourceKey: "400m_repeats", targetSkill: "one_point_five_mile_run", type: "support", strength: 0.7, ev: "400m repeats support 1.5-mile pacing" })

// =====================================================================
// 10. RUCK / LOAD CARRIAGE / TACTICAL DURABILITY (RLC) — 18 atoms
// =====================================================================
p({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_gradual_progression", title: "Ruck progresses load, distance, pace, terrain, frequency gradually", sum: "Ruck and load-carriage progresses one variable at a time and avoids sudden spikes that injure feet, shins, calves, knees, hips, and low back.", w: 2, t: "hard_constraint", ev: "Ruck load progressed gradually" })
p({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_durability_priority", title: "Durability comes before pace under load", sum: "Tissue tolerance (feet/shins/calves/knees/hips/low back) is built before chasing pace under load.", w: 2, ev: "Tactical durability supports test and field demands" })
p({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_strength_supports_load", title: "Strength training supports load carriage", sum: "Hinge, unilateral leg, calf, and trunk strength reduce injury risk and improve ruck efficiency.", w: 1, ev: "Hinge strength dosed around skill and tactical load" })
sel({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_ruck_pool", applies: { militaryTrainingGoal: { in: ["tactical_ruck_load_carriage", "tactical_selection_prep"] } }, rule: { include: ["ruck_easy_pace_short", "ruck_moderate_pace_medium", "ruck_long_slow", "ruck_hill", "ruck_intervals"] }, ev: "Ruck pool" })
sel({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_carry_pool", applies: { militaryEventPriorities: { includes: "loaded_carry" } }, rule: { include: ["farmers_carry", "suitcase_carry", "front_loaded_carry", "sandbag_bear_hug_carry", "kettlebell_rack_carry", "yoke_carry_substitute"] }, ev: "Loaded carry pool" })
sel({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_durability_pool", applies: { militaryTrainingGoal: { in: ["tactical_ruck_load_carriage", "tactical_selection_prep", "army_aft", "marine_cft"] } }, rule: { include: ["calf_raise", "tibialis_raise", "ankle_eversion_inversion", "single_leg_calf_raise", "foot_intrinsic_drill", "hip_thrust", "single_leg_rdl", "trunk_endurance_circuit"] }, ev: "Lower-body durability pool" })
progr({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_load_progression", applies: { militaryTrainingGoal: { in: ["tactical_ruck_load_carriage", "tactical_selection_prep"] } }, rule: { startLoadLb: 25, increaseEveryWeeksLb: 5, capLoadLb: 65, holdAtCap: "hold_for_2_to_4_weeks_before_next_step" }, t: "hard_constraint", ev: "Ruck load progressed gradually" })
progr({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_distance_progression", applies: { militaryTrainingGoal: { in: ["tactical_ruck_load_carriage", "tactical_selection_prep"] } }, rule: { startDistanceMi: 2, increasePerWeekMaxPct: 10, longRuckCadenceWeeks: 2 }, t: "hard_constraint", ev: "Ruck distance progressed gradually" })
progr({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_terrain_progression", applies: { militaryTrainingGoal: "tactical_selection_prep" }, rule: { phases: ["flat_road", "mixed_road_trail", "hill_trail", "rough_trail"], phaseMinWeeks: 2 }, ev: "Ruck terrain progressed gradually" })
progr({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_no_simultaneous_spikes", applies: { militaryTrainingGoal: { in: ["tactical_ruck_load_carriage", "tactical_selection_prep"] } }, rule: { rule: "do_not_increase_load_distance_pace_terrain_in_same_week" }, t: "hard_constraint", ev: "Ruck variables not spiked simultaneously" })
meth({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_pace_default", applies: { exercise: { in: ["ruck_easy_pace_short", "ruck_moderate_pace_medium", "ruck_long_slow"] } }, rule: { paceTarget: "conversational_to_threshold_below_running", monitorMinSec: "15_to_18_min_per_mile_default" }, ev: "Ruck pace conversational by default" })
meth({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_recovery_spacing", applies: { sessionContext: "ruck_long" }, rule: { restDayAfter: true, avoidHardRunNextDay: true, avoidHeavyLegNextDay: true }, ev: "Ruck recovery spaced from hard days" })
rx({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_session_dose", applies: { militaryTrainingGoal: { in: ["tactical_ruck_load_carriage", "tactical_selection_prep"] } }, rule: { ruckPerWeek: [1, 2], strengthSupportPerWeek: [2, 3], durabilityPerWeek: [2, 3] }, ev: "Tactical durability supports test and field demands" })
rx({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_warmup_ruck", applies: { sessionContext: "ruck" }, rule: { warmupMin: 10, includes: ["ankle_pogo", "calf_raise", "hip_90_90", "easy_walk_buildup_5min"] }, ev: "Ruck warmup includes lower-leg prep" })
rx({ src: RLC, fam: "ruck_tactical_durability", key: "rlc_taper_pre_event", applies: { sessionContext: "ruck_event_week" }, rule: { lastHardRuckDaysBefore: 6, lightShakeoutRuckDaysBefore: 3 }, ev: "Ruck taper preserves event readiness" })
carry({ src: RLC, fam: "ruck_tactical_durability", sourceKey: "trap_bar_deadlift", targetSkill: "ruck", type: "support", strength: 0.65, ev: "Hinge strength supports ruck" })
carry({ src: RLC, fam: "ruck_tactical_durability", sourceKey: "single_leg_calf_raise", targetSkill: "ruck", type: "durability_support", strength: 0.6, ev: "Calf durability supports ruck" })
carry({ src: RLC, fam: "ruck_tactical_durability", sourceKey: "farmers_carry", targetSkill: "loaded_carry", type: "direct", strength: 0.85, ev: "Farmers carry directly supports loaded carry events" })

// =====================================================================
// 11. TACTICAL RUNNING ENGINE (TRE) — 20 atoms
// =====================================================================
p({ src: TRE, fam: "tactical_running", key: "tre_aerobic_base_required", title: "Aerobic base is the foundation of any military run", sum: "Easy aerobic running anchors the engine; quality work sits on top of base, not in place of it.", w: 2, ev: "Run prep uses base, speed, pace, and taper" })
p({ src: TRE, fam: "tactical_running", key: "tre_not_every_run_hard", title: "Not every run is hard", sum: "Programs avoid running everything at threshold; easy/tempo/interval/repeat distribution is required.", w: 2, t: "hard_constraint", ev: "Run prep uses base, speed, pace, and taper" })
p({ src: TRE, fam: "tactical_running", key: "tre_test_pace_specificity", title: "Test pace is practiced before test day", sum: "Specific-phase weeks include partial-distance test-pace practice so pacing is automatic at test time.", w: 1, ev: "Test-pace practice in specific phase" })
sel({ src: TRE, fam: "tactical_running", key: "tre_easy_pool", applies: { runSessionType: "easy" }, rule: { include: ["easy_aerobic_run_30min", "easy_aerobic_run_45min", "easy_long_run_60_to_90min", "recovery_jog_20min"] }, ev: "Easy aerobic run pool" })
sel({ src: TRE, fam: "tactical_running", key: "tre_tempo_pool", applies: { runSessionType: "tempo" }, rule: { include: ["tempo_run_20min", "tempo_run_30min", "tempo_intervals_4x5min"] }, ev: "Tempo/threshold pool" })
sel({ src: TRE, fam: "tactical_running", key: "tre_interval_pool", applies: { runSessionType: "intervals" }, rule: { include: ["400m_repeats", "800m_repeats", "1mi_repeats", "1km_repeats"] }, ev: "Interval pool" })
sel({ src: TRE, fam: "tactical_running", key: "tre_strides_hills", applies: { runSessionType: { in: ["strides", "hills"] } }, rule: { include: ["100m_strides_6_to_10", "hill_repeats_30s_to_60s_4_to_8", "long_hill_repeats_2_to_4min"] }, ev: "Strides and hills pool" })
sel({ src: TRE, fam: "tactical_running", key: "tre_test_pace_pool", applies: { runSessionType: "test_pace" }, rule: { include: ["1mi_at_2mi_test_pace", "1.5mi_at_test_pace", "3mi_at_test_pace_negative_split"] }, ev: "Test-pace practice in specific phase" })
progr({ src: TRE, fam: "tactical_running", key: "tre_weekly_distribution", applies: { militaryEventPriorities: { includesAny: ["one_point_five_mile_run", "two_mile_run", "three_mile_run"] } }, rule: { distribution: { easy: 0.6, tempo: 0.15, intervals: 0.15, strides_or_hills: 0.05, test_pace: 0.05 } }, ev: "Run prep uses base, speed, pace, and taper" })
progr({ src: TRE, fam: "tactical_running", key: "tre_weekly_volume_progression", applies: { militaryEventPriorities: { includesAny: ["one_point_five_mile_run", "two_mile_run", "three_mile_run"] } }, rule: { weeklyVolumeIncreaseMaxPct: 10, deloadEvery4Weeks: true }, ev: "Run volume progressed at 10pct max/week" })
progr({ src: TRE, fam: "tactical_running", key: "tre_one_five_mi_specific", applies: { militaryEventPriorities: { includes: "one_point_five_mile_run" } }, rule: { intervalEmphasis: ["400m_repeats", "tempo_run_20min"] }, ev: "1.5-mi targets 400m repeats and tempo" })
progr({ src: TRE, fam: "tactical_running", key: "tre_two_mi_specific", applies: { militaryEventPriorities: { includes: "two_mile_run" } }, rule: { intervalEmphasis: ["800m_repeats", "tempo_run_20min", "1mi_repeats"] }, ev: "2-mi targets 800m repeats and tempo" })
progr({ src: TRE, fam: "tactical_running", key: "tre_three_mi_specific", applies: { militaryEventPriorities: { includes: "three_mile_run" } }, rule: { intervalEmphasis: ["1mi_repeats", "1km_repeats", "tempo_run_30min"] }, ev: "3-mi targets 1mi repeats and tempo" })
meth({ src: TRE, fam: "tactical_running", key: "tre_pace_definitions", applies: { sessionContext: "running" }, rule: { paces: { easy: "conversational", tempo: "comfortably_hard_can_speak_short_sentences", threshold: "10k_pace", interval_400_800: "5k_pace_or_faster", repeats_1mi_1km: "5k_pace", test_pace: "exact_target" } }, ev: "Pace definitions standardized" })
meth({ src: TRE, fam: "tactical_running", key: "tre_easy_protect", applies: { runSessionType: "easy" }, rule: { rule: "do_not_drift_into_tempo_on_easy_days" }, t: "hard_constraint", ev: "Easy days protected from drift" })
meth({ src: TRE, fam: "tactical_running", key: "tre_strides_finisher", applies: { runSessionType: "easy" }, rule: { optionalFinisher: { strides: "4_to_6_x_100m_at_5k_pace_full_recovery" } }, ev: "Strides as easy-day finisher" })
rx({ src: TRE, fam: "tactical_running", key: "tre_session_dose", applies: { militaryEventPriorities: { includesAny: ["one_point_five_mile_run", "two_mile_run", "three_mile_run"] } }, rule: { runsPerWeek: [3, 5], hardRunsPerWeek: [1, 2] }, ev: "Run dose 3-5 sessions/wk, 1-2 hard" })
rx({ src: TRE, fam: "tactical_running", key: "tre_warmup_quality", applies: { runSessionType: { in: ["intervals", "tempo", "test_pace"] } }, rule: { warmupMin: 12, includes: ["easy_jog_8min", "dynamic_drills", "strides_2_to_4"] }, ev: "Quality run warmups extended" })
rx({ src: TRE, fam: "tactical_running", key: "tre_cooldown_quality", applies: { runSessionType: { in: ["intervals", "tempo", "test_pace"] } }, rule: { cooldownMin: 8, includes: ["easy_jog", "walking", "calf_stretch"] }, ev: "Quality run cooldowns required" })
carry({ src: TRE, fam: "tactical_running", sourceKey: "tempo_run_20min", targetSkill: "two_mile_run", type: "support", strength: 0.7, ev: "Tempo run supports 2-mile pacing" })

// =====================================================================
// 12. TACTICAL CALISTHENICS ENDURANCE (TCE) — 18 atoms
// =====================================================================
p({ src: TCE, fam: "tactical_cal_endurance", key: "tce_density_principle", title: "Density training builds calisthenics endurance without daily maxing", sum: "EMOMs, ladders, and submax volume sets build push-up/pull-up/sit-up endurance with less wear than daily max attempts.", w: 1, ev: "Push-up endurance built with submaximal volume" })
p({ src: TCE, fam: "tactical_cal_endurance", key: "tce_tendon_protection", title: "Volume must respect elbow/shoulder/wrist tendons", sum: "High-volume calisthenics work tracks elbow/shoulder/wrist symptoms and reduces volume on flare-ups; pain is a stop signal.", w: 2, ev: "Push-up endurance built with submaximal volume" })
sel({ src: TCE, fam: "tactical_cal_endurance", key: "tce_pushup_endurance_pool", applies: { militaryEventPriorities: { includesAny: ["pushups", "hand_release_pushups"] } }, rule: { include: ["pushup_emom", "pushup_ladder", "pushup_amrap_capped", "incline_pushup_volume", "pushup_test_pace_practice"] }, ev: "Push-up endurance built with submaximal volume" })
sel({ src: TCE, fam: "tactical_cal_endurance", key: "tce_pullup_endurance_pool", applies: { militaryEventPriorities: { includes: "pullups" } }, rule: { include: ["pullup_ladder", "pullup_emom", "pullup_volume_submax", "negative_pullup", "assisted_pullup_band"] }, ev: "Pull-up test prep uses volume without max-out abuse" })
sel({ src: TCE, fam: "tactical_cal_endurance", key: "tce_situp_endurance_pool", applies: { militaryEventPriorities: { includes: "situps_or_core" } }, rule: { include: ["situp_emom", "situp_ladder", "cross_leg_reverse_crunch_volume", "trunk_endurance_circuit"] }, ev: "Core test option trained specifically" })
progr({ src: TCE, fam: "tactical_cal_endurance", key: "tce_density_progression", applies: { sessionType: "density" }, rule: { repsPerMinuteCap: "submax_50_to_70_pct_of_2min_max", durationMinRange: [8, 15], weeklyProgression: "add_1_to_2_min_or_5pct_reps_per_week" }, ev: "Density progressed by minutes or rep cap" })
progr({ src: TCE, fam: "tactical_cal_endurance", key: "tce_ladder_progression", applies: { sessionType: "ladder" }, rule: { ladderPattern: "1_to_n_then_back_or_pyramids", topRepCap: "submax_70pct_of_max", restPattern: "1_to_1_to_1_to_2x_work_time" }, ev: "Ladder progressed by top rep and rest" })
progr({ src: TCE, fam: "tactical_cal_endurance", key: "tce_gtg_optional", applies: { militaryEventPriorities: { includes: "pullups" }, athleteContext: { hasBarAccess: true } }, rule: { method: "grease_the_groove_optional", repsPerSet: "50pct_of_max", setsPerDay: [4, 8], notToFailure: true }, ev: "GTG optional, never to failure" })
progr({ src: TCE, fam: "tactical_cal_endurance", key: "tce_no_daily_max", applies: { sessionType: "density" }, rule: { rule: "do_not_perform_max_attempts_daily" }, t: "hard_constraint", ev: "No daily max-out abuse" })
meth({ src: TCE, fam: "tactical_cal_endurance", key: "tce_emom_template", applies: { sessionType: "emom" }, rule: { duration: [10, 15], repsPerMinute: "5_to_10_pushup_or_3_to_6_pullup", restAtEndOfMinute: true }, ev: "EMOM template defined" })
meth({ src: TCE, fam: "tactical_cal_endurance", key: "tce_amrap_capped", applies: { sessionType: "amrap" }, rule: { rule: "stop_at_form_break_or_2_reps_in_reserve_not_failure", durationMin: [3, 8] }, ev: "AMRAP capped, not to failure" })
meth({ src: TCE, fam: "tactical_cal_endurance", key: "tce_pain_stop", applies: { athleteContext: { tendonPain: true } }, rule: { reduceVolumePct: 50, switchToIsometricOrIncline: true, considerOneWeekDeload: true }, t: "hard_constraint", ev: "Pain triggers volume reduction or deload" })
rx({ src: TCE, fam: "tactical_cal_endurance", key: "tce_session_dose", applies: { sessionType: { in: ["density", "ladder", "amrap"] } }, rule: { perWeek: [2, 4], perSessionMinRange: [12, 25] }, ev: "Density 2-4x/week, 12-25 min" })
rx({ src: TCE, fam: "tactical_cal_endurance", key: "tce_warmup_volume_block", applies: { sessionContext: "calisthenics_volume" }, rule: { warmupMin: 8, includes: ["wrist_prep", "scapular_prep", "submax_set_buildup"] }, ev: "Volume block warmup includes joint prep" })
carry({ src: TCE, fam: "tactical_cal_endurance", sourceKey: "pushup_emom", targetSkill: "pushups", type: "direct", strength: 0.85, ev: "EMOM pushups directly support pushup test" })
carry({ src: TCE, fam: "tactical_cal_endurance", sourceKey: "pullup_ladder", targetSkill: "pullups", type: "direct", strength: 0.85, ev: "Pull-up ladder directly supports pullup test" })
carry({ src: TCE, fam: "tactical_cal_endurance", sourceKey: "trunk_endurance_circuit", targetSkill: "plank", type: "support", strength: 0.55, ev: "Trunk endurance supports plank" })
carry({ src: TCE, fam: "tactical_cal_endurance", sourceKey: "cross_leg_reverse_crunch_volume", targetSkill: "situps_or_core", type: "direct", strength: 0.7, ev: "Reverse crunch supports situp/core test" })

// =====================================================================
// INACTIVE ADVANCED LOWER-BODY / TACTICAL CANDIDATES (data only)
// =====================================================================
// Recorded for future legal-source enrichment. MUST NOT inflate active rule
// counts. Reuses Batch 6's `InactiveAdvancedSourceCandidate` shape via
// duck-typed object literals; the type lives in Batch 6 and is the single
// source of truth.
export const BATCH_07_INACTIVE_ADVANCED_CANDIDATES = [
  { desiredSkillKey: "natural_hamstring_curl_full",     desiredDoctrineNeed: "Nordic curl progressions, eccentric prescription, contraindications",   requiredSourceQuality: "official creator-published or peer-reviewed", legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal source attached yet", notes: "General fundamentals available; deeper rehab/progression source recommended." },
  { desiredSkillKey: "single_leg_squat_advanced",       desiredDoctrineNeed: "advanced unilateral progressions beyond pistol/dragon",                requiredSourceQuality: "official creator-published or user-owned",     legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal source attached yet", notes: "Beyond LBS/DSS scope." },
  { desiredSkillKey: "selection_prep_full",             desiredDoctrineNeed: "selection-prep block periodization (SFAS/BUDS-adjacent)",                requiredSourceQuality: "official paid user-owned or official military prep",  legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal source attached yet", notes: "Tactical selection prep is high-stakes; requires legal/official source." },
  { desiredSkillKey: "swim_distance_long",              desiredDoctrineNeed: "long-distance swim doctrine for Navy/SEAL prep",                        requiredSourceQuality: "official Navy publication or coach-licensed",  legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal source attached yet", notes: "Beyond NPP scope." },
  { desiredSkillKey: "obstacle_course_advanced",        desiredDoctrineNeed: "OCS/obstacle course doctrine",                                          requiredSourceQuality: "official course-published or user-owned",      legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal source attached yet", notes: "Out of scope for Batch 7." },
]

// =====================================================================
// EXPORTS — aggregator-facing API (parity with Batch 1-6)
// =====================================================================
// Batch 7 expresses safety as hard_constraint method/progression rules — same
// pattern as Batch 4/5/6. Helper exists for aggregator parity.
export function getBatch07ContraindicationRules(): unknown[] { return [] }

export function getBatch07Sources(): DoctrineSource[] { return BATCH_07_SOURCES }
export function getBatch07Principles(): DoctrinePrinciple[] { return BATCH_07_PRINCIPLES }
export function getBatch07ProgressionRules(): ProgressionRule[] { return BATCH_07_PROGRESSION }
export function getBatch07MethodRules(): MethodRule[] { return BATCH_07_METHOD }
export function getBatch07PrescriptionRules(): PrescriptionRule[] { return BATCH_07_PRESCRIPTION }
export function getBatch07ExerciseSelectionRules(): ExerciseSelectionRule[] { return BATCH_07_SELECTION }
export function getBatch07CarryoverRules(): CarryoverRule[] { return BATCH_07_CARRYOVER }

export function getBatch07Counts() {
  return {
    sources: BATCH_07_SOURCES.length,
    principles: BATCH_07_PRINCIPLES.length,
    progression: BATCH_07_PROGRESSION.length,
    method: BATCH_07_METHOD.length,
    prescription: BATCH_07_PRESCRIPTION.length,
    selection: BATCH_07_SELECTION.length,
    carryover: BATCH_07_CARRYOVER.length,
    total:
      BATCH_07_PRINCIPLES.length +
      BATCH_07_PROGRESSION.length +
      BATCH_07_METHOD.length +
      BATCH_07_PRESCRIPTION.length +
      BATCH_07_SELECTION.length +
      BATCH_07_CARRYOVER.length,
    inactiveAdvancedCandidates: BATCH_07_INACTIVE_ADVANCED_CANDIDATES.length,
  }
}

export function getBatch07CountsBySource(): Record<string, number> {
  const all = [...BATCH_07_PRINCIPLES, ...BATCH_07_PROGRESSION, ...BATCH_07_METHOD, ...BATCH_07_PRESCRIPTION, ...BATCH_07_SELECTION, ...BATCH_07_CARRYOVER] as Array<{ source_id?: string }>
  const out: Record<string, number> = {}
  for (const r of all) { const sid = r.source_id ?? "unknown"; out[sid] = (out[sid] ?? 0) + 1 }
  return out
}

export function getBatch07ProvenanceFor(atomId: string): { batch: "batch_07"; sourceId: string | null } | null {
  const all: Array<{ id?: string; source_id?: string }> = [...BATCH_07_PRINCIPLES, ...BATCH_07_PROGRESSION, ...BATCH_07_METHOD, ...BATCH_07_PRESCRIPTION, ...BATCH_07_SELECTION, ...BATCH_07_CARRYOVER]
  const hit = all.find(r => r.id === atomId)
  if (!hit) return null
  return { batch: "batch_07", sourceId: hit.source_id ?? null }
}

export type Batch07Provenance = { batch: "batch_07"; sourceId: string | null }
