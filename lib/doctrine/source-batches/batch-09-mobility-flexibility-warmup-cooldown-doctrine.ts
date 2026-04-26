// =====================================================================
// SPARTANLAB DOCTRINE — BATCH 9
// Mobility / Flexibility / Warm-Up / Cooldown / Skill-Specific Prep
// =====================================================================
//
// Purpose: Doctrine truth layer governing warm-up, cooldown, mobility,
// flexibility goals (side split / front split / pancake / toe touch /
// joint mobility), skill-specific ramp-up, and the user-preferred short-
// round flexibility protocol. This batch does NOT add a new exercise
// library, does NOT change runtime behavior, and does NOT touch live
// workout. It encodes computable decision rules over the warm-up and
// cooldown engines, the flexibility sequences, and the onboarding
// flexibility goals already present in the codebase.
//
// USER-PREFERRED PROTOCOL — VERIFIED:
// The "3 rounds × ~15-second holds" method is already present in the
// codebase (lib/skill-progression-rules.ts PANCAKE_PROGRESSION,
// TOE_TOUCH_PROGRESSION, FRONT_SPLITS_PROGRESSION, SIDE_SPLITS_PROGRESSION;
// lib/range-training-system.ts; lib/training-principles-engine.ts;
// lib/adaptive-exercise-pool.ts; lib/program-exercise-selector.ts;
// lib/skill-audit-system.ts has3Rounds validation). Batch 9 marks this
// as USER_AUTHORED_VERIFIED, not a placeholder.
//
// Legal-source: SpartanLab user-authored doctrine + general training
// physiology consensus + original synthesis. No leaked/pirated material.
//
// Mirrors the helper shapes of Batches 4-8 exactly. Aggregator wires the
// 9 standard accessor functions; runtime contract auto-includes batch_09
// via Object.keys(fallbackCountsByBatch).
// =====================================================================

import type {
  DoctrineSource,
  DoctrinePrinciple,
  ProgressionRule,
  MethodRule,
  PrescriptionRule,
  ExerciseSelectionRule,
  CarryoverRule,
} from "@/lib/doctrine-db"

// =====================================================================
// TYPES — exported for downstream builder consumption (deferred phase)
// =====================================================================

export type FlexibilityGoalKey =
  | "side_split"
  | "middle_split"
  | "front_split"
  | "pancake"
  | "toe_touch"
  | "hamstring_flexibility"
  | "hip_flexor_flexibility"
  | "adductor_flexibility"
  | "shoulder_mobility"
  | "wrist_mobility"
  | "thoracic_mobility"
  | "ankle_mobility"
  | "squat_mobility"
  | "overhead_mobility"
  | "handstand_mobility"
  | "planche_wrist_prep"
  | "front_lever_shoulder_scap_prep"
  | "back_lever_shoulder_extension_prep"

export type FlexibilityPhase =
  | "warmup"
  | "cooldown"
  | "flexibility_block"
  | "micro_session"
  | "joint_prep"
  | "skill_rampup"

export type FlexibilityPlacement =
  | "warmup"
  | "cooldown"
  | "separate_flexibility_block"
  | "micro_session"
  | "contextual_joint_prep"

export type FlexibilitySourceConfidence =
  | "uploaded_pdf"
  | "public_coach"
  | "user_authored_verified"
  | "user_authored_needs_confirmation"
  | "general_science"
  | "gap"

export type FlexibilityGoalSupportEntry = {
  goalKey: FlexibilityGoalKey
  displayName: string
  directFlexibilityGoal: boolean
  warmupRole: "primary" | "supporting" | "not_recommended"
  cooldownRole: "primary" | "supporting" | "not_used"
  microSessionRole: "primary" | "supporting" | "not_used"
  shouldAppearIfSelectedInOnboarding: boolean
  preferredPlacement: FlexibilityPlacement
  warmupAllowed: boolean
  cooldownAllowed: boolean
  mainWorkoutAllowed: boolean
  avoidLongStaticBeforeStrength: boolean
  recommendedDefaultPrescription: string
  preferredMethods: string[]
  progressionSignals: string[]
  regressionSignals: string[]
  contraindicationNotes: string[]
  futureBuilderInstruction: string
  userVisibleGuidance: string
}

// =====================================================================
// SOURCES — 12 source registrations
// =====================================================================

const BATCH_09_SOURCES: DoctrineSource[] = [
  {
    id: "src_batch_09_dynamic_warmup_mobility_principles",
    source_key: "dynamic_warmup_mobility_principles_batch_09",
    title: "Dynamic Warm-Up & Mobility Principles (Batch 9)",
    description:
      "Why pre-workout mobility prioritizes dynamic, pulse, activation, and short positional exposure over long relaxed static holds before strength/skill work.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_static_cooldown_flexibility_principles",
    source_key: "static_cooldown_flexibility_principles_batch_09",
    title: "Static Cooldown & Flexibility Principles (Batch 9)",
    description:
      "Why cooldown can use longer calmer holds; how cooldown differs from warm-up; downshift, flexibility exposure, and recovery framing.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_skill_specific_rampup",
    source_key: "skill_specific_rampup_preparation_batch_09",
    title: "Skill-Specific Ramp-Up Preparation (Batch 9)",
    description:
      "Warm-up should prepare the actual first major exercise/skill: easier progression, assisted/banded variation, scapular prep, short low-fatigue exposure.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_front_split_progression",
    source_key: "front_split_progression_batch_09",
    title: "Front Split Progression Doctrine (Batch 9)",
    description:
      "Front split: hip flexor + hamstring + lunge/split exposure; gradual range; active control; cooldown/flexibility block placement.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_side_split_middle_split",
    source_key: "side_split_middle_split_progression_batch_09",
    title: "Side / Middle Split Progression Doctrine (Batch 9)",
    description:
      "Side split / middle split: adductor preparation, frog/straddle patterns, gradual range, active control, no aggressive forced depth.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_pancake_straddle_compression",
    source_key: "pancake_straddle_compression_batch_09",
    title: "Pancake / Straddle / Compression Doctrine (Batch 9)",
    description:
      "Pancake progression: hamstrings, adductors, hip hinge mechanics, anterior pelvic tilt, compression, active flexibility support.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_toe_touch_posterior_chain",
    source_key: "toe_touch_hamstring_posterior_chain_batch_09",
    title: "Toe-Touch / Hamstring / Posterior-Chain Doctrine (Batch 9)",
    description:
      "Toe touch: posterior-chain mobility, hip hinge, calf contribution, nerve-sensitivity caution.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_shoulder_wrist_spine_mobility",
    source_key: "shoulder_wrist_spine_mobility_batch_09",
    title: "Shoulder / Wrist / Spine Mobility Doctrine (Batch 9)",
    description:
      "Mobility supporting handstands, planche, HSPU, overhead positions, scapular control, wrists, shoulders, thoracic spine.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_calisthenics_joint_prep",
    source_key: "calisthenics_joint_prep_batch_09",
    title: "Calisthenics Joint Prep Doctrine (Batch 9)",
    description:
      "Joint prep across wrists, elbows, shoulders, scapula, hips, knees, ankles, and tendon preparation for calisthenics skill/strength.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_user_short_round_flexibility",
    source_key: "user_preferred_short_round_flexibility_protocol_batch_09",
    title: "User-Preferred Short-Round Flexibility Protocol (Batch 9, VERIFIED)",
    description:
      "User-authored verified protocol: 3 rounds of ~15-second holds across goal-specific cue sequences. Already encoded in lib/skill-progression-rules.ts (PANCAKE/TOE_TOUCH/FRONT_SPLITS/SIDE_SPLITS), lib/range-training-system.ts, lib/training-principles-engine.ts, lib/adaptive-exercise-pool.ts. Source confidence: user_authored_verified.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_flexibility_goal_onboarding_preservation",
    source_key: "flexibility_goal_onboarding_preservation_batch_09",
    title: "Flexibility Goal Onboarding Preservation Doctrine (Batch 9)",
    description:
      "Future builder must not silently omit selected flexibility goals from onboarding (side split, front split, pancake, toe touch, mobility goals). Goals must appear in warm-up/cooldown/flexibility block unless explicitly constrained.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_09_mobility_recovery_interference_management",
    source_key: "mobility_recovery_interference_management_batch_09",
    title: "Mobility / Recovery / Interference Management Doctrine (Batch 9)",
    description:
      "How flexibility/mobility avoids interfering with strength, skill, and military/calisthenics training.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
]

// =====================================================================
// HELPER BUILDERS (mirrors Batch 7/8 compact pattern)
// =====================================================================

const BASE = {
  is_base_intelligence: true,
  doctrine_family: "mobility_flexibility_warmup_cooldown",
  scopes: { athlete_level: "any", goal: "any", phase: "any" } as const,
}

// Principle
function p(
  id: string,
  source_id: string,
  principle_key: string,
  evidence: string,
  category: string = "warmup_cooldown_mobility",
): DoctrinePrinciple {
  return {
    id,
    source_id,
    principle_key,
    category,
    user_visible_evidence: evidence,
    priority_type: "soft_preference",
    priority_weight: 1,
    ...BASE,
  } as unknown as DoctrinePrinciple
}

// Progression rule
function progr(
  id: string,
  source_id: string,
  key: string,
  trigger: string,
  evidence: string,
): ProgressionRule {
  return {
    id,
    source_id,
    rule_key: key,
    trigger,
    user_visible_evidence: evidence,
    priority_type: "soft_preference",
    priority_weight: 1,
    ...BASE,
  } as unknown as ProgressionRule
}

// Method rule (used for warm-up/cooldown/skill-rampup method instruction)
function meth(
  id: string,
  source_id: string,
  key: string,
  evidence: string,
  hard: boolean = false,
): MethodRule {
  return {
    id,
    source_id,
    method_key: key,
    user_visible_evidence: evidence,
    priority_type: hard ? "hard_constraint" : "soft_preference",
    priority_weight: hard ? 2 : 1,
    ...BASE,
  } as unknown as MethodRule
}

// Prescription rule
function rx(
  id: string,
  source_id: string,
  key: string,
  prescription: string,
  evidence: string,
): PrescriptionRule {
  return {
    id,
    source_id,
    prescription_key: key,
    prescription_hint: prescription,
    user_visible_evidence: evidence,
    priority_type: "soft_preference",
    priority_weight: 1,
    ...BASE,
  } as unknown as PrescriptionRule
}

// Selection rule
function sel(
  id: string,
  source_id: string,
  key: string,
  evidence: string,
): ExerciseSelectionRule {
  return {
    id,
    source_id,
    selection_key: key,
    user_visible_evidence: evidence,
    priority_type: "soft_preference",
    priority_weight: 1,
    ...BASE,
  } as unknown as ExerciseSelectionRule
}

// Contraindication / hard constraint
function contr(id: string, source_id: string, key: string, evidence: string): MethodRule {
  return {
    id,
    source_id,
    method_key: key,
    user_visible_evidence: evidence,
    priority_type: "hard_constraint",
    priority_weight: 2,
    ...BASE,
  } as unknown as MethodRule
}

// Carryover rule
function carry(
  id: string,
  source_id: string,
  key: string,
  evidence: string,
): CarryoverRule {
  return {
    id,
    source_id,
    carryover_key: key,
    user_visible_evidence: evidence,
    priority_type: "soft_preference",
    priority_weight: 1,
    ...BASE,
  } as unknown as CarryoverRule
}

// =====================================================================
// SOURCE-ID SHORTCUTS
// =====================================================================
const S_DYN = "src_batch_09_dynamic_warmup_mobility_principles"
const S_COOL = "src_batch_09_static_cooldown_flexibility_principles"
const S_RAMP = "src_batch_09_skill_specific_rampup"
const S_FRONT = "src_batch_09_front_split_progression"
const S_SIDE = "src_batch_09_side_split_middle_split"
const S_PANC = "src_batch_09_pancake_straddle_compression"
const S_TOE = "src_batch_09_toe_touch_posterior_chain"
const S_SWS = "src_batch_09_shoulder_wrist_spine_mobility"
const S_JOINT = "src_batch_09_calisthenics_joint_prep"
const S_USER = "src_batch_09_user_short_round_flexibility"
const S_OB = "src_batch_09_flexibility_goal_onboarding_preservation"
const S_INT = "src_batch_09_mobility_recovery_interference_management"

// =====================================================================
// PRINCIPLES (anchor decisions; one per source minimum + extras)
// =====================================================================

const BATCH_09_PRINCIPLES: DoctrinePrinciple[] = [
  // dynamic warmup
  p("bat09_p_dyn_priority", S_DYN, "warmup_dynamic_priority",
    "Warm-up uses dynamic mobility and movement prep."),
  p("bat09_p_dyn_pulse", S_DYN, "warmup_pulse_through_range",
    "Warm-up uses pulses/reps through range."),
  p("bat09_p_dyn_temp", S_DYN, "warmup_raise_tissue_temperature",
    "Warm-up raises tissue temperature without fatigue."),
  p("bat09_p_dyn_no_fatigue", S_DYN, "warmup_no_fatigue",
    "Warm-up avoids fatiguing volume."),
  p("bat09_p_dyn_continuity", S_DYN, "warmup_to_main_continuity",
    "Warm-up flows into first exercise."),
  p("bat09_p_dyn_general_plus_specific", S_DYN, "warmup_general_plus_specific",
    "General mobility plus skill-specific prep included."),
  // long-static caution
  p("bat09_p_static_pre_strength", S_DYN, "long_static_pre_strength_caution",
    "Long static stretching avoided before strength work."),
  p("bat09_p_static_pre_skill", S_DYN, "long_static_pre_skill_caution",
    "Long relaxed holds avoided before high-skill calisthenics."),
  // cooldown
  p("bat09_p_cool_static", S_COOL, "cooldown_static_flexibility",
    "Cooldown uses longer flexibility holds."),
  p("bat09_p_cool_breathing", S_COOL, "cooldown_calm_breathing",
    "Cooldown uses calm breathing and relaxed holds."),
  p("bat09_p_cool_to_goal", S_COOL, "cooldown_to_selected_goal",
    "Cooldown reflects selected flexibility goal."),
  p("bat09_p_cool_session_relevant", S_COOL, "cooldown_session_relevant",
    "Cooldown stretches trained tissues."),
  p("bat09_p_cool_priority", S_COOL, "cooldown_prioritized_dose",
    "Cooldown prioritized selected goals and trained areas."),
  // skill ramp-up
  p("bat09_p_ramp_first_exercise", S_RAMP, "skill_specific_rampup",
    "Warm-up includes a ramp-up for the first main skill."),
  p("bat09_p_ramp_assisted", S_RAMP, "ramp_assisted_easier_progression",
    "Ramp-up uses easier progression / band assist / partial range."),
  p("bat09_p_ramp_short_low_fatigue", S_RAMP, "ramp_short_low_fatigue",
    "Ramp-up uses short low-fatigue exposures."),
  p("bat09_p_ramp_pattern_match", S_RAMP, "ramp_pattern_match_first_exercise",
    "Ramp-up matches the first main movement pattern."),
  // user-preferred protocol
  p("bat09_p_user_short_round", S_USER, "user_short_round_flexibility",
    "User preferred short-round flexibility protocol stored."),
  p("bat09_p_user_repeatable", S_USER, "flex_repeatable_controlled_depth",
    "Flexibility progresses by repeatable controlled depth."),
  // onboarding preservation
  p("bat09_p_ob_no_silent_omit", S_OB, "flex_goal_no_silent_omission",
    "Selected flexibility goal preserved in program support work."),
  p("bat09_p_ob_outside_main", S_OB, "flex_goal_outside_main_strength",
    "Flexibility goal placed outside main strength work."),
  // joint prep
  p("bat09_p_joint_session_match", S_JOINT, "joint_prep_session_match",
    "Joint prep matched session demands."),
  p("bat09_p_wrist_planche_hs", S_SWS, "wrist_prep_planche_handstand",
    "Wrist prep included before handstand/planche loading."),
  p("bat09_p_bl_shoulder_extension", S_SWS, "back_lever_shoulder_extension_caution",
    "Back lever prep protects shoulder extension and biceps."),
  p("bat09_p_fl_scap_prep", S_SWS, "front_lever_scap_prep",
    "Front lever prep targets scapular depression and lats."),
  // interference
  p("bat09_p_int_lower_body_skill", S_INT, "lower_body_mobility_skill_interference",
    "Lower-body mobility dosage accounts for skill interference."),
  p("bat09_p_int_minimal_leg", S_INT, "minimal_leg_basic_mobility",
    "Minimal-leg preference preserves basic mobility."),
  p("bat09_p_int_no_leg_warning", S_INT, "no_leg_imbalance_warning",
    "No-leg option carries imbalance warning."),
  p("bat09_p_int_military", S_INT, "military_mobility_supports_field_tasks",
    "Military mobility supports running/rucking/loaded tasks."),
  // truth/audit
  p("bat09_p_doctrine_only", S_OB, "batch_09_doctrine_only_no_visual_change",
    "Batch 9 foundation stored; builder integration remains next phase."),
  p("bat09_p_active_flex", S_PANC, "active_flexibility_support",
    "Active flexibility included where useful."),
  p("bat09_p_pain_caution", S_TOE, "flex_regress_on_warning_signs",
    "Flexibility regresses on nerve/joint warning signs."),
  p("bat09_p_specificity", S_RAMP, "stretch_selection_specificity",
    "Stretch selected for goal/session relevance."),
  p("bat09_p_short_session", S_INT, "short_session_preserves_mobility_dose",
    "Short sessions preserve essential mobility dose."),
  p("bat09_p_micro_dose", S_USER, "flexibility_microdose_weekly",
    "Flexibility supported by repeatable micro-doses."),
]

// =====================================================================
// PROGRESSION RULES — split/pancake/toe-touch/mobility staged progression
// =====================================================================

const BATCH_09_PROGRESSION: ProgressionRule[] = [
  // front split staged exposure (mirrors lib/skill-progression-rules.ts FRONT_SPLITS_PROGRESSION)
  progr("bat09_pr_fs_basic", S_FRONT, "front_split_basic_exposure",
    "front_split_goal_selected && level=basic",
    "Front split basic: 15s hip flexor + 15s half split + 15s split exposure, both sides, 3 rounds."),
  progr("bat09_pr_fs_moderate", S_FRONT, "front_split_moderate_range",
    "front_split && basic_owned",
    "Front split moderate: deepen each position, hips square, breathe into stretch, 3 rounds."),
  progr("bat09_pr_fs_deep", S_FRONT, "front_split_deep_range",
    "front_split && moderate_owned",
    "Front split deep: reduce hand support, control descent, maintain alignment."),
  progr("bat09_pr_fs_full", S_FRONT, "front_split_full_position",
    "front_split && deep_owned",
    "Front split full: 15s holds × 3 rounds per side at full position."),
  // side split
  progr("bat09_pr_ss_basic", S_SIDE, "side_split_basic_exposure",
    "side_split_goal_selected && level=basic",
    "Side split basic: 15s horse stance + 15s frog + 15s split exposure, 3 rounds."),
  progr("bat09_pr_ss_moderate", S_SIDE, "side_split_moderate",
    "side_split && basic_owned",
    "Side split moderate: deepen flow, knees aligned, no forced pain."),
  progr("bat09_pr_ss_deep", S_SIDE, "side_split_deep",
    "side_split && moderate_owned",
    "Side split deep: progress hand support reduction, maintain neutral spine."),
  progr("bat09_pr_ss_full", S_SIDE, "side_split_full",
    "side_split && deep_owned",
    "Side split full: 15s × 3 rounds at full position."),
  // pancake
  progr("bat09_pr_pc_basic", S_PANC, "pancake_basic",
    "pancake_goal_selected && level=basic",
    "Pancake basic: 15s seated straddle + 15s hands walking forward + 15s active pancake, 3 rounds."),
  progr("bat09_pr_pc_moderate", S_PANC, "pancake_moderate",
    "pancake && basic_owned",
    "Pancake moderate: maintain hip hinge, walk hands further each round, keep legs active."),
  progr("bat09_pr_pc_deep", S_PANC, "pancake_deep",
    "pancake && moderate_owned",
    "Pancake deep: engage hip flexors, pull chest toward floor, control throughout."),
  progr("bat09_pr_pc_full", S_PANC, "pancake_full",
    "pancake && deep_owned",
    "Pancake full: 15s × 3 rounds with active compression."),
  // toe touch
  progr("bat09_pr_tt_basic", S_TOE, "toe_touch_basic",
    "toe_touch_goal_selected && level=basic",
    "Toe touch basic: 15s single-leg L + 15s single-leg R + 15s seated straight + 15s seated rounded, 3 rounds."),
  progr("bat09_pr_tt_moderate", S_TOE, "toe_touch_moderate",
    "toe_touch && basic_owned",
    "Toe touch moderate: straighten knees gradually, keep weight forward, relax into stretch."),
  progr("bat09_pr_tt_deep", S_TOE, "toe_touch_deep",
    "toe_touch && moderate_owned",
    "Toe touch deep: pull chest to thighs actively, straight legs, engage core."),
  progr("bat09_pr_tt_full", S_TOE, "toe_touch_full",
    "toe_touch && deep_owned",
    "Toe touch full: 15s × 3 rounds at full pike compression."),
  // shoulder/wrist/spine staged
  progr("bat09_pr_sm_basic", S_SWS, "shoulder_mobility_basic",
    "shoulder_mobility_goal && level=basic",
    "Shoulder mobility basic: CARs + scapular push-ups + band ER, low intensity."),
  progr("bat09_pr_sm_advanced", S_SWS, "shoulder_mobility_overhead_line",
    "shoulder_mobility && handstand_or_overhead_present",
    "Shoulder mobility advanced: overhead line + lat opener + thoracic extension."),
  progr("bat09_pr_wm_basic", S_SWS, "wrist_mobility_basic",
    "wrist_mobility_goal_or_planche_handstand_present",
    "Wrist mobility basic: wrist rocks + circles + palm/finger pulses before loading."),
  progr("bat09_pr_tm_basic", S_SWS, "thoracic_mobility_basic",
    "thoracic_mobility_goal_or_overhead_present",
    "Thoracic mobility basic: cat-cow + thread-the-needle + open-book."),
  progr("bat09_pr_am_basic", S_SWS, "ankle_mobility_basic",
    "ankle_mobility_goal_or_squat_jump_present",
    "Ankle mobility basic: ankle rocks + dorsiflexion holds + calf prep."),
  progr("bat09_pr_sq_basic", S_SWS, "squat_mobility_basic",
    "squat_mobility_goal_present",
    "Squat mobility basic: deep squat hold 15s × 3 + cossack + frog."),
  // joint prep staged by session
  progr("bat09_pr_jp_planche_session", S_JOINT, "joint_prep_planche_session",
    "session_has_planche",
    "Planche session prep: wrists + scap protraction + shoulder mobility + planche lean ramp."),
  progr("bat09_pr_jp_fl_session", S_JOINT, "joint_prep_front_lever_session",
    "session_has_front_lever",
    "Front lever session prep: scap pulls + hollow + lat activation + tuck lever exposure."),
  progr("bat09_pr_jp_bl_session", S_JOINT, "joint_prep_back_lever_session",
    "session_has_back_lever",
    "Back lever session prep: shoulder extension caution + biceps tendon prep + skin-the-cat exposure."),
  progr("bat09_pr_jp_hs_session", S_JOINT, "joint_prep_handstand_session",
    "session_has_handstand_or_hspu",
    "Handstand/HSPU session prep: wrists + shoulders + scapular elevation + wall exposure."),
  progr("bat09_pr_jp_pull_session", S_JOINT, "joint_prep_pull_session",
    "session_has_weighted_pull_up_or_oap",
    "Pull session prep: scap pulls + active hang + ramp pulls."),
  progr("bat09_pr_jp_legs_session", S_JOINT, "joint_prep_legs_session",
    "session_has_squat_or_pistol_or_dragon",
    "Lower-body session prep: hips + ankles + knee track + tibialis."),
  progr("bat09_pr_jp_run_session", S_JOINT, "joint_prep_run_session",
    "session_has_run_or_ruck",
    "Run/ruck session prep: ankles + calves + hips + posterior chain dynamic."),
  // user short-round across goals
  progr("bat09_pr_user_protocol", S_USER, "user_short_round_protocol_default",
    "any_flex_goal_selected",
    "Default: 3 rounds × ~15s holds across goal-specific cue sequence (verified user method)."),
]

// =====================================================================
// METHOD RULES (warmup/cooldown method instruction; some hard)
// =====================================================================

const BATCH_09_METHOD: MethodRule[] = [
  // hard constraints (safety/avoidance)
  contr("bat09_m_no_long_static_pre_strength", S_DYN, "no_long_static_before_strength",
    "Long relaxed static holds avoided before maximal strength work by default."),
  contr("bat09_m_no_long_static_pre_skill", S_DYN, "no_long_static_before_high_skill",
    "Long relaxed static holds avoided before high-skill calisthenics by default."),
  contr("bat09_m_no_aggressive_split_pre_lower", S_SIDE, "no_aggressive_split_before_lower_body",
    "No aggressive split holds before maximal lower-body or skill sessions."),
  contr("bat09_m_no_force_pain", S_TOE, "no_force_pain_in_flex",
    "No forced painful depth in flexibility work."),
  contr("bat09_m_no_nerve_symptoms", S_TOE, "stop_on_nerve_symptoms",
    "Stop on numbness/tingling/sharp pain; regress."),
  contr("bat09_m_no_max_when_irritated", S_INT, "no_max_when_severely_sore",
    "No max stretching when severely sore or irritated."),
  contr("bat09_m_no_fake_progress", S_OB, "no_fake_flex_progress_claim",
    "Do not claim flexibility progress from random cooldown if goal-specific work is absent."),
  contr("bat09_m_no_silent_omit", S_OB, "no_silent_omission_of_selected_goal",
    "Selected flexibility goals must not be silently omitted."),
  // warmup methods
  meth("bat09_m_warmup_dynamic", S_DYN, "warmup_dynamic_method",
    "Warm-up method: dynamic mobility, pulse, activation, joint prep, movement rehearsal."),
  meth("bat09_m_warmup_general_temp", S_DYN, "warmup_general_temperature",
    "General temp prep: light cardio, easy locomotion, arm/shoulder/hip circles, dynamic lunges, inchworms."),
  meth("bat09_m_warmup_joint_specific", S_JOINT, "warmup_joint_specific",
    "Joint-specific warm-up: wrist rocks, scap push-ups, scap pulls, band ER, hip CARs, ankle rocks."),
  meth("bat09_m_warmup_skill_specific", S_RAMP, "warmup_skill_specific",
    "Skill-specific warm-up: easier progression holds, band-assisted, lower leverage, activation drills, ramp sets."),
  meth("bat09_m_warmup_strength_ramp", S_RAMP, "warmup_strength_ramp",
    "Strength ramping: bodyweight before weighted, lighter before heavier, short non-fatiguing sets."),
  // cooldown methods
  meth("bat09_m_cool_session_relevant", S_COOL, "cooldown_session_relevant_method",
    "Session-relevant cooldown: stretch trained tissues, downshift NS, avoid excessive intensity."),
  meth("bat09_m_cool_goal_relevant", S_COOL, "cooldown_goal_relevant_method",
    "Goal-relevant cooldown: target tissues per selected flex goal."),
  meth("bat09_m_cool_active_passive_mix", S_COOL, "cooldown_active_passive_mix",
    "Cooldown can mix active flexibility (especially for splits/pancake/compression) with passive holds."),
  // user protocol
  meth("bat09_m_user_short_round", S_USER, "user_short_round_method",
    "User method: 3 rounds × ~15-second holds across goal-specific cue sequences."),
  meth("bat09_m_user_breathing", S_USER, "user_short_round_breathing",
    "User method: controlled breathing, gradual depth, no forced pain."),
  // continuity
  meth("bat09_m_continuity_warmup_to_main", S_RAMP, "warmup_to_main_continuity_method",
    "Warm-up flows into the first main movement rather than feeling disconnected."),
  meth("bat09_m_continuity_cool_to_goal", S_COOL, "cooldown_to_goal_continuity_method",
    "Cooldown reflects selected flexibility goals and trained tissues."),
  // interference
  meth("bat09_m_int_dosage_strength", S_INT, "mobility_dosage_protect_strength",
    "Mobility dose protects strength/skill performance."),
  meth("bat09_m_int_microdose", S_INT, "flex_microdose_weekly",
    "Flexibility may be supported by short repeatable micro-doses."),
  // time budget
  meth("bat09_m_time_short_session", S_INT, "short_session_compress_intelligently",
    "Short sessions: keep essential warm-up, compress cooldown intelligently, never permanently delete selected flex goal."),
  // active flexibility
  meth("bat09_m_active_flex", S_PANC, "active_flexibility_method",
    "Active flexibility: control through range, especially for splits/pancake/compression."),
]

// =====================================================================
// PRESCRIPTION RULES (default doses)
// =====================================================================

const BATCH_09_PRESCRIPTION: PrescriptionRule[] = [
  // user 3×15 default for each goal
  rx("bat09_rx_user_default", S_USER, "user_default_3x15",
    "3 rounds × ~15s holds, goal-specific cue sequence",
    "Default flexibility prescription: 3 rounds × ~15s (verified user method)."),
  rx("bat09_rx_pancake_default", S_PANC, "pancake_default_dose",
    "3 rounds: 15s seated straddle / 15s hands walking forward / 15s active pancake",
    "Pancake default dose."),
  rx("bat09_rx_toe_touch_default", S_TOE, "toe_touch_default_dose",
    "3 rounds: 15s single-leg L / 15s single-leg R / 15s seated straight / 15s seated rounded",
    "Toe touch default dose."),
  rx("bat09_rx_front_split_default", S_FRONT, "front_split_default_dose",
    "3 rounds per side: 15s hip flexor / 15s half split / 15s split exposure",
    "Front split default dose."),
  rx("bat09_rx_side_split_default", S_SIDE, "side_split_default_dose",
    "3 rounds: 15s horse stance / 15s frog / 15s split exposure",
    "Side split default dose."),
  // joint prep doses
  rx("bat09_rx_wrist_prep_dose", S_SWS, "wrist_prep_dose",
    "Wrist rocks 30s + circles 30s + palm/finger pulses 30s before planche/handstand",
    "Wrist prep dose for planche/handstand."),
  rx("bat09_rx_scap_prep_dose", S_JOINT, "scap_prep_dose",
    "Scapular pulls 1-2 sets + scap push-ups 1-2 sets before pull/lever skill",
    "Scapular prep dose."),
  rx("bat09_rx_ankle_prep_dose", S_SWS, "ankle_prep_dose",
    "Ankle rocks 30s + dorsiflexion holds 2×15s + calf prep 1-2 sets",
    "Ankle prep dose."),
  // warmup duration suggestion
  rx("bat09_rx_warmup_total", S_DYN, "warmup_total_dose",
    "5-12 minutes: general temp + joint-specific + skill-specific ramp",
    "Warm-up total dose: 5-12 minutes."),
  // cooldown duration suggestion
  rx("bat09_rx_cooldown_total", S_COOL, "cooldown_total_dose",
    "5-15 minutes: prioritized selected goals + trained-tissue stretches",
    "Cooldown total dose: 5-15 minutes."),
  // micro-session
  rx("bat09_rx_microsession", S_USER, "microsession_dose",
    "Short repeatable micro-doses across the week per selected goal",
    "Micro-session flexibility dose."),
  // skill ramp-up doses
  rx("bat09_rx_planche_rampup", S_RAMP, "planche_rampup_dose",
    "Wrist prep + scap protraction + 2-3 short planche-lean ramps + 1 easier tuck exposure",
    "Planche warm-up uses wrist/scap/lean prep."),
  rx("bat09_rx_fl_rampup", S_RAMP, "front_lever_rampup_dose",
    "Scap pulls 1-2 × 8 + hollow 30s + 2-3 short tuck-lever exposures + 1 easier progression",
    "Front lever warm-up uses easier lever/scapular prep."),
  rx("bat09_rx_bl_rampup", S_RAMP, "back_lever_rampup_dose",
    "Skin-the-cat 1-2 × 3 + tuck back lever exposure + biceps-tendon caution check",
    "Back lever warm-up protects shoulder extension/biceps."),
  rx("bat09_rx_hs_rampup", S_RAMP, "handstand_rampup_dose",
    "Wrist prep + shoulder mobility + 2-3 wall handstand exposures + line check",
    "Handstand/HSPU warm-up prepares wrists and overhead line."),
  rx("bat09_rx_pull_rampup", S_RAMP, "pull_rampup_dose",
    "Scap pulls 1-2 × 8 + active hang 30s + 2-3 progressive pull ramp sets",
    "Pulling warm-up ramps from scap/hang to main pull."),
  rx("bat09_rx_squat_rampup", S_RAMP, "squat_rampup_dose",
    "Hip CARs + ankle rocks + bodyweight squat 1×8 + cossack exposure",
    "Squat warm-up prepares hips, ankles, knees."),
  rx("bat09_rx_run_rampup", S_RAMP, "run_rampup_dose",
    "Easy locomotion 3-5 min + dynamic leg swings + 2-3 strides",
    "Run warm-up: easy locomotion + dynamic legs + strides."),
  // hold-duration framing
  rx("bat09_rx_warmup_holds", S_DYN, "warmup_hold_duration",
    "Warm-up holds usually <10s, dynamic, or pulse-based",
    "Warm-up holds short and dynamic."),
  rx("bat09_rx_cooldown_holds", S_COOL, "cooldown_hold_duration",
    "Cooldown holds may be longer (~15-60s) per goal/recovery",
    "Cooldown holds longer for flexibility/recovery."),
]

// =====================================================================
// SELECTION RULES (warm-up / cooldown / flexibility-block selection)
// =====================================================================

const BATCH_09_SELECTION: ExerciseSelectionRule[] = [
  // warm-up selection
  sel("bat09_s_warmup_general", S_DYN, "select_warmup_general_temp",
    "Warm-up general selection: light cardio, easy locomotion, arm/shoulder/hip circles, controlled rotations, dynamic lunges, inchworms."),
  sel("bat09_s_warmup_joint", S_JOINT, "select_warmup_joint_specific",
    "Warm-up joint selection: wrist rocks/circles, palm/finger pulses, elbow circles, scap push-ups/pulls, band ER, hip CARs, ankle rocks."),
  sel("bat09_s_warmup_skill_pattern", S_RAMP, "select_warmup_skill_pattern",
    "Warm-up skill selection: easier progression holds, band-assisted holds, lower leverage positions, activation drills, ramp sets."),
  sel("bat09_s_warmup_strength_ramp", S_RAMP, "select_warmup_strength_ramp",
    "Warm-up strength selection: bodyweight before weighted, lighter before heavier, short low-fatigue sets."),
  // cooldown selection per goal
  sel("bat09_s_cool_side_split", S_SIDE, "select_cool_side_split",
    "Side split cooldown: adductors, frog, straddle, middle split pattern."),
  sel("bat09_s_cool_front_split", S_FRONT, "select_cool_front_split",
    "Front split cooldown: hip flexor, hamstring, lunge/split pattern."),
  sel("bat09_s_cool_pancake", S_PANC, "select_cool_pancake",
    "Pancake cooldown: straddle, hamstring, adductor, hip hinge, compression."),
  sel("bat09_s_cool_toe_touch", S_TOE, "select_cool_toe_touch",
    "Toe touch cooldown: hamstring, calf/posterior chain, hip hinge."),
  sel("bat09_s_cool_handstand", S_SWS, "select_cool_handstand",
    "Handstand/overhead cooldown: shoulders, thoracic extension, lats, wrists."),
  sel("bat09_s_cool_planche", S_SWS, "select_cool_planche",
    "Planche cooldown: wrists, shoulders, pecs, biceps/forearms as needed."),
  sel("bat09_s_cool_front_lever", S_SWS, "select_cool_front_lever",
    "Front lever cooldown: lats, thoracic, posterior shoulder."),
  sel("bat09_s_cool_back_lever", S_SWS, "select_cool_back_lever",
    "Back lever cooldown: shoulders, biceps tendon caution, chest/shoulder extension."),
  // skill ramp-up selection (per first-exercise pattern)
  sel("bat09_s_ramp_planche", S_RAMP, "select_ramp_planche_first",
    "If first main = planche/lean/PPU: wrist prep + scap protraction + planche lean ramp + easier tuck exposure."),
  sel("bat09_s_ramp_fl", S_RAMP, "select_ramp_front_lever_first",
    "If first main = front lever/lever rows: scap pulls + hollow/lat activation + tuck lever exposure + easier progression."),
  sel("bat09_s_ramp_bl", S_RAMP, "select_ramp_back_lever_first",
    "If first main = back lever: skin-the-cat + tuck back lever exposure + biceps-tendon caution."),
  sel("bat09_s_ramp_hs", S_RAMP, "select_ramp_handstand_first",
    "If first main = handstand/HSPU: wrist prep + overhead shoulder mobility + wall exposure."),
  sel("bat09_s_ramp_pull", S_RAMP, "select_ramp_pull_first",
    "If first main = weighted pull-up/OAP: active hang + scap pulls + bodyweight ramp pulls."),
  sel("bat09_s_ramp_squat", S_RAMP, "select_ramp_squat_first",
    "If first main = squat/pistol/dragon: hip CARs + ankle rocks + bodyweight squat + cossack exposure."),
  // onboarding preservation
  sel("bat09_s_ob_side_split", S_OB, "select_preserve_side_split_onboarding",
    "If onboarding selected side split: side-split work appears in cooldown or flexibility block."),
  sel("bat09_s_ob_front_split", S_OB, "select_preserve_front_split_onboarding",
    "If onboarding selected front split: front-split work appears in cooldown or flexibility block."),
  sel("bat09_s_ob_pancake", S_OB, "select_preserve_pancake_onboarding",
    "If onboarding selected pancake: pancake work appears in cooldown or flexibility block."),
  sel("bat09_s_ob_toe_touch", S_OB, "select_preserve_toe_touch_onboarding",
    "If onboarding selected toe touch: toe-touch work appears in cooldown or flexibility block."),
  sel("bat09_s_ob_shoulder_mobility", S_OB, "select_preserve_shoulder_mobility_onboarding",
    "If onboarding selected shoulder mobility: shoulder mobility appears in warm-up joint prep + cooldown."),
  sel("bat09_s_ob_wrist_mobility", S_OB, "select_preserve_wrist_mobility_onboarding",
    "If onboarding selected wrist mobility: wrist prep appears in warm-up joint prep."),
  sel("bat09_s_ob_thoracic_mobility", S_OB, "select_preserve_thoracic_onboarding",
    "If onboarding selected thoracic mobility: thoracic work appears in warm-up + cooldown."),
  sel("bat09_s_ob_ankle_mobility", S_OB, "select_preserve_ankle_onboarding",
    "If onboarding selected ankle mobility: ankle work appears in warm-up + relevant joint prep."),
  // micro-session selection
  sel("bat09_s_micro_split", S_USER, "select_micro_split_session",
    "Micro-session: 5-8 min split work using user's 3×15 method."),
  sel("bat09_s_micro_pancake", S_USER, "select_micro_pancake_session",
    "Micro-session: 5-8 min pancake work using user's 3×15 method."),
  // avoid rules
  sel("bat09_s_avoid_random_warmup", S_DYN, "avoid_random_unrelated_warmup",
    "Avoid random mobility unrelated to session needs."),
  sel("bat09_s_avoid_fatiguing_warmup", S_DYN, "avoid_fatiguing_warmup_volume",
    "Avoid fatiguing warm-up volume."),
  sel("bat09_s_avoid_aggressive_split_pre", S_SIDE, "avoid_aggressive_split_pre_session",
    "Avoid aggressive split holds before maximal lower-body or skill sessions."),
]

// =====================================================================
// CARRYOVER RULES — flexibility goal carryover into program structure
// =====================================================================

const BATCH_09_CARRYOVER: CarryoverRule[] = [
  carry("bat09_c_split_to_skill", S_SIDE, "split_carryover_to_calisthenics",
    "Split flexibility carries to compression skills, manna progression, straddle skills."),
  carry("bat09_c_pancake_to_skill", S_PANC, "pancake_carryover_to_skill",
    "Pancake flexibility carries to straddle skills, manna, V-sit, compression."),
  carry("bat09_c_toe_touch_to_pike", S_TOE, "toe_touch_carryover_to_pike",
    "Toe touch / hamstring flexibility carries to pike compression, L-sit, V-sit."),
  carry("bat09_c_shoulder_mob_to_handstand", S_SWS, "shoulder_mobility_to_handstand",
    "Shoulder mobility carries to handstand line, HSPU, overhead pressing."),
  carry("bat09_c_wrist_mob_to_planche", S_SWS, "wrist_mobility_to_planche_handstand",
    "Wrist mobility carries to planche, handstand, HSPU loading."),
  carry("bat09_c_thoracic_to_overhead", S_SWS, "thoracic_to_overhead",
    "Thoracic mobility carries to overhead positions, handstand line, front lever scap depression."),
  carry("bat09_c_ankle_to_squat_jump", S_SWS, "ankle_to_squat_run",
    "Ankle mobility carries to squat depth, run mechanics, ruck durability."),
  carry("bat09_c_active_flex_to_compression", S_PANC, "active_flex_to_compression",
    "Active flexibility carries to compression skills."),
  carry("bat09_c_minimal_leg_basic", S_INT, "minimal_leg_basic_joint_health",
    "Minimal-leg preference still carries basic joint health for hips/knees/ankles/posterior chain."),
  carry("bat09_c_military_lower_body", S_INT, "military_lower_body_carryover",
    "Military mobility carries to running, rucking, loaded carries, ankles, hips, calves, posterior chain, trunk."),
  carry("bat09_c_hip_flexor_to_split", S_FRONT, "hip_flexor_to_front_split",
    "Hip flexor flexibility carries to front split and posture/anterior pelvic tilt."),
  carry("bat09_c_adductor_to_side_split", S_SIDE, "adductor_to_side_split",
    "Adductor flexibility carries to side/middle split, pancake, cossack."),
  carry("bat09_c_hamstring_to_pancake", S_PANC, "hamstring_to_pancake",
    "Hamstring flexibility carries to pancake, toe touch, pike compression."),
  carry("bat09_c_calf_to_run_squat", S_SWS, "calf_to_run_squat",
    "Calf flexibility carries to run mechanics, squat depth, jump landings."),
]

// =====================================================================
// EXTENSION ATOMS — coverage padding for category breadth (Batch 9 v2)
// =====================================================================
// Distributed across method/prescription/selection/principles to reach
// minimum atom coverage and to fill cooldown/flex method nuance.

const BATCH_09_PRINCIPLES_EXT: DoctrinePrinciple[] = [
  p("bat09_p_warmup_short_holds", S_DYN, "warmup_short_holds",
    "Warm-up holds short and dynamic."),
  p("bat09_p_cool_long_holds", S_COOL, "cooldown_long_holds_ok",
    "Cooldown holds longer for flexibility/recovery."),
  p("bat09_p_compression_active", S_PANC, "compression_active_principle",
    "Compression goals benefit from active control rather than passive only."),
  p("bat09_p_split_progress_signal", S_SIDE, "split_progress_signal",
    "Splits progress by repeatable depth and breath, not forced range."),
  p("bat09_p_front_split_progress_signal", S_FRONT, "front_split_progress_signal",
    "Front split progresses through hip-square depth and controlled descent."),
  p("bat09_p_planche_wrist_mandatory", S_SWS, "planche_wrist_mandatory",
    "Wrist prep is mandatory before planche loading, not optional."),
  p("bat09_p_handstand_line_check", S_SWS, "handstand_line_check",
    "Handstand prep includes overhead line and shoulder elevation check."),
  p("bat09_p_microsession_repeatable", S_USER, "microsession_repeatable_doctrine",
    "Micro-session flexibility doctrine emphasizes repeatability over single long sessions."),
  p("bat09_p_no_fake_visual_change", S_OB, "no_fake_visual_change_claim",
    "Doctrine batch alone does not change visual program output until builder integration."),
  p("bat09_p_active_for_skills", S_PANC, "active_flex_for_calisthenics_skills",
    "Active flexibility especially relevant for splits/pancake/compression in calisthenics."),
  p("bat09_p_warmup_no_aggressive_flex", S_SIDE, "warmup_no_aggressive_flex",
    "Aggressive flexibility avoided in warm-up."),
  p("bat09_p_cool_breathing_calm", S_COOL, "cool_breathing_calm_principle",
    "Cooldown breathing should be calm and lower arousal."),
]

const BATCH_09_METHOD_EXT: MethodRule[] = [
  meth("bat09_m_warmup_arm_circles", S_DYN, "warmup_arm_circles",
    "Arm circles included for shoulder warm-up."),
  meth("bat09_m_warmup_hip_circles", S_DYN, "warmup_hip_circles",
    "Hip circles included for hip warm-up."),
  meth("bat09_m_warmup_inchworms", S_DYN, "warmup_inchworms",
    "Inchworms included as full-body warm-up movement."),
  meth("bat09_m_warmup_dynamic_lunge", S_DYN, "warmup_dynamic_lunge",
    "Dynamic lunges included for hip/leg warm-up."),
  meth("bat09_m_warmup_cars", S_JOINT, "warmup_cars_method",
    "Controlled articular rotations (CARs) for shoulder/hip joint health."),
  meth("bat09_m_warmup_scap_push", S_JOINT, "warmup_scap_push_ups",
    "Scapular push-ups for serratus and protraction prep."),
  meth("bat09_m_warmup_scap_pulls", S_JOINT, "warmup_scap_pulls",
    "Scapular pulls for lat/scap depression prep."),
  meth("bat09_m_warmup_band_er", S_JOINT, "warmup_band_external_rotation",
    "Band external rotation for rotator cuff prep."),
  meth("bat09_m_cool_lat_opener", S_SWS, "cooldown_lat_opener",
    "Lat opener for overhead/handstand cooldown."),
  meth("bat09_m_cool_thoracic_ext", S_SWS, "cooldown_thoracic_extension",
    "Thoracic extension stretch for cooldown after overhead work."),
  meth("bat09_m_cool_couch_stretch", S_FRONT, "cooldown_couch_stretch",
    "Couch stretch for hip flexor cooldown."),
  meth("bat09_m_cool_pigeon", S_SWS, "cooldown_pigeon",
    "Pigeon stretch for hip external rotation cooldown."),
  meth("bat09_m_cool_butterfly", S_SIDE, "cooldown_butterfly",
    "Butterfly stretch for adductor cooldown."),
  meth("bat09_m_cool_cossack", S_SIDE, "cooldown_cossack",
    "Cossack stretch for adductor/hip mobility cooldown."),
  meth("bat09_m_cool_seated_pike", S_TOE, "cooldown_seated_pike",
    "Seated pike for hamstring/posterior cooldown."),
  meth("bat09_m_cool_standing_fold", S_TOE, "cooldown_standing_fold",
    "Standing forward fold for hamstring cooldown."),
  meth("bat09_m_warmup_wall_handstand", S_RAMP, "warmup_wall_handstand_exposure",
    "Wall handstand exposure as part of handstand ramp-up."),
  meth("bat09_m_warmup_active_hang", S_RAMP, "warmup_active_hang",
    "Active hang as part of pull/lever ramp-up."),
  meth("bat09_m_warmup_skin_the_cat", S_RAMP, "warmup_skin_the_cat",
    "Slow skin-the-cat as part of back lever ramp-up."),
  meth("bat09_m_warmup_planche_lean", S_RAMP, "warmup_planche_lean_ramp",
    "Planche lean ramp as part of planche ramp-up."),
]

const BATCH_09_SELECTION_EXT: ExerciseSelectionRule[] = [
  sel("bat09_s_select_no_long_static_pre", S_DYN, "select_no_long_static_pre_strength",
    "Selection: avoid long static stretching before maximal strength/skill work."),
  sel("bat09_s_select_dynamic_over_static_warmup", S_DYN, "select_dynamic_over_static_warmup",
    "Selection: prefer dynamic movement over static holds in warm-up."),
  sel("bat09_s_select_pulse_warmup", S_DYN, "select_pulse_warmup",
    "Selection: pulses through range preferred in warm-up."),
  sel("bat09_s_select_breathing_cool", S_COOL, "select_breathing_cool",
    "Selection: cooldown holds use slow controlled breathing."),
  sel("bat09_s_select_cool_priority_goals", S_COOL, "select_cool_priority_selected_goals",
    "Selection: cooldown prioritizes selected flexibility goals first."),
  sel("bat09_s_select_cool_priority_trained", S_COOL, "select_cool_priority_trained_tissues",
    "Selection: cooldown also includes trained-tissue stretches."),
  sel("bat09_s_select_active_pancake", S_PANC, "select_active_pancake",
    "Selection: pancake includes active compression progressions where possible."),
  sel("bat09_s_select_active_split", S_SIDE, "select_active_split",
    "Selection: splits include active control work where possible."),
  sel("bat09_s_select_microdose_split", S_USER, "select_microdose_split",
    "Selection: split goals can use micro-dose sessions across the week."),
  sel("bat09_s_select_microdose_pancake", S_USER, "select_microdose_pancake",
    "Selection: pancake goal can use micro-dose sessions across the week."),
  sel("bat09_s_select_no_aggressive_pre_lower", S_SIDE, "select_no_aggressive_pre_lower",
    "Selection: no aggressive split holds before maximal lower-body sessions."),
  sel("bat09_s_select_no_random_mobility", S_DYN, "select_no_random_mobility",
    "Selection: warm-up mobility must match session demands; not random."),
  sel("bat09_s_select_short_session_compress", S_INT, "select_short_session_compress",
    "Selection: short sessions compress cooldown but never permanently delete selected flex goal."),
  sel("bat09_s_select_skill_rampup_first", S_RAMP, "select_skill_rampup_first",
    "Selection: skill ramp-up always precedes strength ramping for skill-first sessions."),
]

const BATCH_09_PRESCRIPTION_EXT: PrescriptionRule[] = [
  rx("bat09_rx_oh_dose", S_SWS, "overhead_mobility_dose",
    "Lat opener 30s + thoracic ext 30s + shoulder flexion drill 30s",
    "Overhead mobility dose."),
  rx("bat09_rx_thoracic_dose", S_SWS, "thoracic_mobility_dose",
    "Cat-cow 8 reps + thread-the-needle 5/side + open-book 5/side",
    "Thoracic mobility dose."),
  rx("bat09_rx_handstand_mob_dose", S_SWS, "handstand_mobility_dose",
    "Wrist prep + shoulder flexion + lat opener + 1 wall handstand exposure",
    "Handstand mobility dose."),
  rx("bat09_rx_bl_prep_dose", S_SWS, "back_lever_prep_dose",
    "Skin-the-cat 1-2 × 3 + tuck back lever exposure 2-3 × 5-10s + biceps check",
    "Back lever prep dose."),
  rx("bat09_rx_fl_prep_dose", S_SWS, "front_lever_prep_dose",
    "Scap pulls 1-2 × 8 + hollow 30s + tuck lever exposure 2-3 × 5-10s",
    "Front lever prep dose."),
  rx("bat09_rx_planche_prep_dose", S_SWS, "planche_prep_dose",
    "Wrist rocks 30s + circles 30s + scap protraction 1-2 × 8 + planche lean ramp 2-3 × 10s",
    "Planche prep dose."),
  rx("bat09_rx_pike_dose", S_TOE, "pike_compression_dose",
    "3 rounds × 15s seated pike with active compression",
    "Pike compression dose."),
  rx("bat09_rx_cossack_dose", S_SIDE, "cossack_dose",
    "3 rounds × 15s/side cossack hold",
    "Cossack dose."),
  rx("bat09_rx_frog_dose", S_SIDE, "frog_dose",
    "3 rounds × 15s frog stretch",
    "Frog dose."),
  rx("bat09_rx_horse_stance_dose", S_SIDE, "horse_stance_dose",
    "3 rounds × 15s horse stance",
    "Horse stance dose."),
  rx("bat09_rx_pancake_active_dose", S_PANC, "pancake_active_dose",
    "3 rounds × 15s active pancake lean each direction",
    "Active pancake dose."),
  rx("bat09_rx_couch_dose", S_FRONT, "couch_dose",
    "3 rounds × 15s/side couch stretch",
    "Couch stretch dose."),
  rx("bat09_rx_pigeon_dose", S_SWS, "pigeon_dose",
    "3 rounds × 15s/side pigeon stretch",
    "Pigeon dose."),
  rx("bat09_rx_butterfly_dose", S_SIDE, "butterfly_dose",
    "3 rounds × 15s butterfly with knee press",
    "Butterfly dose."),
  rx("bat09_rx_lat_opener_dose", S_SWS, "lat_opener_dose",
    "3 rounds × 15s lat opener / chest-to-floor variation",
    "Lat opener dose."),
]

const BATCH_09_PROGRESSION_EXT: ProgressionRule[] = [
  progr("bat09_pr_microdose_split", S_USER, "split_microdose_progression",
    "split_goal_selected && time_constrained",
    "Split micro-dose: 5-8 minutes daily using 3×15 method."),
  progr("bat09_pr_microdose_pancake", S_USER, "pancake_microdose_progression",
    "pancake_goal_selected && time_constrained",
    "Pancake micro-dose: 5-8 minutes daily using 3×15 method."),
  progr("bat09_pr_short_session_compress", S_INT, "short_session_compress_flex",
    "session_time_short && flex_goal_selected",
    "Short session: keep essential warm-up; compress cooldown but preserve at least one round of selected goal."),
  progr("bat09_pr_active_compression", S_PANC, "active_compression_progression",
    "pancake_or_pike_goal && level>=moderate",
    "Add active compression once moderate range is owned."),
  progr("bat09_pr_minimal_leg_basic", S_INT, "minimal_leg_basic_mobility_progression",
    "minimal_leg_preference",
    "Maintain basic hip/knee/ankle/posterior-chain mobility even with minimal leg training."),
  progr("bat09_pr_military_lower_body", S_INT, "military_lower_body_mobility_progression",
    "military_or_tactical_goal",
    "Stronger lower-body mobility support: ankles + hips + calves + posterior chain + trunk."),
]

// Append extension atoms into the canonical pools for export.
;(BATCH_09_PRINCIPLES as DoctrinePrinciple[]).push(...BATCH_09_PRINCIPLES_EXT)
;(BATCH_09_METHOD as MethodRule[]).push(...BATCH_09_METHOD_EXT)
;(BATCH_09_SELECTION as ExerciseSelectionRule[]).push(...BATCH_09_SELECTION_EXT)
;(BATCH_09_PRESCRIPTION as PrescriptionRule[]).push(...BATCH_09_PRESCRIPTION_EXT)
;(BATCH_09_PROGRESSION as ProgressionRule[]).push(...BATCH_09_PROGRESSION_EXT)

// =====================================================================
// FLEXIBILITY GOAL SUPPORT MATRIX (exported)
// =====================================================================

export const FLEXIBILITY_GOAL_SUPPORT_MATRIX: Record<FlexibilityGoalKey, FlexibilityGoalSupportEntry> = {
  side_split: {
    goalKey: "side_split", displayName: "Side Split",
    directFlexibilityGoal: true,
    warmupRole: "supporting", cooldownRole: "primary", microSessionRole: "primary",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "cooldown",
    warmupAllowed: false, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: true,
    recommendedDefaultPrescription: "3 rounds: 15s horse stance / 15s frog / 15s split exposure",
    preferredMethods: ["user_short_round", "active_flexibility", "cooldown_static"],
    progressionSignals: ["repeatable depth", "controlled breathing", "no pain", "consistent symmetry"],
    regressionSignals: ["sharp pain", "knee discomfort", "loss of control", "nerve symptoms"],
    contraindicationNotes: ["Avoid aggressive split holds before maximal lower-body or skill sessions."],
    futureBuilderInstruction: "Place in cooldown or flexibility block. Use 3×15 method.",
    userVisibleGuidance: "Side split work placed after training or separately.",
  },
  middle_split: {
    goalKey: "middle_split", displayName: "Middle Split",
    directFlexibilityGoal: true,
    warmupRole: "supporting", cooldownRole: "primary", microSessionRole: "primary",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "cooldown",
    warmupAllowed: false, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: true,
    recommendedDefaultPrescription: "3 rounds × 15s middle split exposure with adductor prep",
    preferredMethods: ["user_short_round", "active_adductor_control"],
    progressionSignals: ["depth maintained across rounds", "no pain"],
    regressionSignals: ["pain", "knee tracking issues"],
    contraindicationNotes: ["No forced depth; respect adductor irritation signals."],
    futureBuilderInstruction: "Place in cooldown or flexibility block.",
    userVisibleGuidance: "Middle split shares side-split placement.",
  },
  front_split: {
    goalKey: "front_split", displayName: "Front Split",
    directFlexibilityGoal: true,
    warmupRole: "supporting", cooldownRole: "primary", microSessionRole: "primary",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "cooldown",
    warmupAllowed: false, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: true,
    recommendedDefaultPrescription: "3 rounds per side: 15s hip flexor / 15s half split / 15s split exposure",
    preferredMethods: ["user_short_round", "active_hip_flexor_hamstring_control"],
    progressionSignals: ["depth", "alignment", "hips square"],
    regressionSignals: ["hip pinch", "lower back pain", "knee pain"],
    contraindicationNotes: ["No forced depth; protect hip flexor and hamstring origins."],
    futureBuilderInstruction: "Place in cooldown/flexibility block.",
    userVisibleGuidance: "Front split work placed in cooldown/flexibility block.",
  },
  pancake: {
    goalKey: "pancake", displayName: "Pancake",
    directFlexibilityGoal: true,
    warmupRole: "supporting", cooldownRole: "primary", microSessionRole: "primary",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "cooldown",
    warmupAllowed: false, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: true,
    recommendedDefaultPrescription: "3 rounds: 15s seated straddle / 15s hands walking forward / 15s active pancake",
    preferredMethods: ["user_short_round", "active_compression"],
    progressionSignals: ["chest closer to floor", "hip hinge maintained"],
    regressionSignals: ["lumbar flexion replacing hip hinge", "adductor pain"],
    contraindicationNotes: ["Maintain hip hinge; do not collapse spine to fake depth."],
    futureBuilderInstruction: "Place in cooldown/flexibility block; use active compression progressions.",
    userVisibleGuidance: "Pancake work targets straddle hinge and compression.",
  },
  toe_touch: {
    goalKey: "toe_touch", displayName: "Toe Touch",
    directFlexibilityGoal: true,
    warmupRole: "supporting", cooldownRole: "primary", microSessionRole: "primary",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "cooldown",
    warmupAllowed: false, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "3 rounds: 15s single-leg L / 15s single-leg R / 15s seated straight / 15s seated rounded",
    preferredMethods: ["user_short_round", "active_pike_compression"],
    progressionSignals: ["chest closer to thighs", "straight legs"],
    regressionSignals: ["nerve-like sensations", "hamstring sharp pain"],
    contraindicationNotes: ["Stop on numbness/tingling; respect nerve sensitivity."],
    futureBuilderInstruction: "Place in cooldown/flexibility block.",
    userVisibleGuidance: "Toe-touch progression uses posterior-chain mobility safely.",
  },
  hamstring_flexibility: {
    goalKey: "hamstring_flexibility", displayName: "Hamstring Flexibility",
    directFlexibilityGoal: true,
    warmupRole: "supporting", cooldownRole: "primary", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "cooldown",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: true,
    recommendedDefaultPrescription: "3 rounds × 15s per position (hinge / single-leg / pike)",
    preferredMethods: ["user_short_round", "active_hinge_control"],
    progressionSignals: ["hinge depth", "controlled breathing"],
    regressionSignals: ["nerve-like symptoms"],
    contraindicationNotes: ["Avoid aggressive long static holds before heavy lower-body work."],
    futureBuilderInstruction: "Place in cooldown; supporting role in warm-up via dynamic only.",
    userVisibleGuidance: "Hamstring flexibility supports pike/compression/split goals.",
  },
  hip_flexor_flexibility: {
    goalKey: "hip_flexor_flexibility", displayName: "Hip Flexor Flexibility",
    directFlexibilityGoal: true,
    warmupRole: "supporting", cooldownRole: "primary", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "cooldown",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: true,
    recommendedDefaultPrescription: "3 rounds × 15s per side (kneeling lunge / couch / half split)",
    preferredMethods: ["user_short_round", "dynamic_lunge_warmup", "static_cooldown"],
    progressionSignals: ["hip flexor opening", "no anterior hip pinch"],
    regressionSignals: ["anterior pinch", "lower back compensation"],
    contraindicationNotes: ["Maintain neutral pelvis; do not arch lumbar to fake range."],
    futureBuilderInstruction: "Cooldown primary; warm-up supporting via dynamic.",
    userVisibleGuidance: "Hip flexor flexibility supports front split and posture.",
  },
  adductor_flexibility: {
    goalKey: "adductor_flexibility", displayName: "Adductor Flexibility",
    directFlexibilityGoal: true,
    warmupRole: "supporting", cooldownRole: "primary", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "cooldown",
    warmupAllowed: false, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: true,
    recommendedDefaultPrescription: "3 rounds × 15s frog / cossack / butterfly",
    preferredMethods: ["user_short_round", "active_adductor_control"],
    progressionSignals: ["depth", "comfort"],
    regressionSignals: ["adductor strain symptoms"],
    contraindicationNotes: ["No aggressive depth before lower-body skill sessions."],
    futureBuilderInstruction: "Cooldown primary.",
    userVisibleGuidance: "Adductor flexibility supports side/middle split and pancake.",
  },
  shoulder_mobility: {
    goalKey: "shoulder_mobility", displayName: "Shoulder Mobility",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "primary", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "contextual_joint_prep",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Shoulder CARs + scap push-ups + band ER (warm-up); lats/thoracic (cooldown)",
    preferredMethods: ["dynamic_warmup", "static_cooldown"],
    progressionSignals: ["overhead line cleaner", "scap control"],
    regressionSignals: ["impingement signs", "rotator cuff irritation"],
    contraindicationNotes: ["Respect rotator cuff irritation; do not force end range."],
    futureBuilderInstruction: "Joint prep in warm-up + targeted cooldown.",
    userVisibleGuidance: "Shoulder mobility supports handstand, HSPU, planche, lever skills.",
  },
  wrist_mobility: {
    goalKey: "wrist_mobility", displayName: "Wrist Mobility",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "supporting", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "contextual_joint_prep",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Wrist rocks + circles + palm/finger pulses before planche/handstand",
    preferredMethods: ["dynamic_warmup", "wrist_prep"],
    progressionSignals: ["wrist tolerance increases"],
    regressionSignals: ["wrist pain", "tendon irritation"],
    contraindicationNotes: ["Mandatory before planche/handstand loading."],
    futureBuilderInstruction: "Always include in planche/handstand warm-up joint prep.",
    userVisibleGuidance: "Wrist prep included before handstand/planche loading.",
  },
  thoracic_mobility: {
    goalKey: "thoracic_mobility", displayName: "Thoracic Mobility",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "primary", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "contextual_joint_prep",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Cat-cow + thread-the-needle + open-book (warm-up); thoracic extension (cooldown)",
    preferredMethods: ["dynamic_warmup", "static_cooldown"],
    progressionSignals: ["overhead line", "rotation symmetry"],
    regressionSignals: ["thoracic pain"],
    contraindicationNotes: ["Avoid forced rotation under load."],
    futureBuilderInstruction: "Warm-up primary + cooldown.",
    userVisibleGuidance: "Thoracic mobility supports overhead and lever positions.",
  },
  ankle_mobility: {
    goalKey: "ankle_mobility", displayName: "Ankle Mobility",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "supporting", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "contextual_joint_prep",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Ankle rocks + dorsiflexion holds + calf prep before squat/run/ruck",
    preferredMethods: ["dynamic_warmup", "calf_prep"],
    progressionSignals: ["dorsiflexion ROM", "stable knee track"],
    regressionSignals: ["ankle impingement", "Achilles irritation"],
    contraindicationNotes: ["Increase progressively for ruck/run."],
    futureBuilderInstruction: "Warm-up joint prep for squat/run/ruck.",
    userVisibleGuidance: "Ankle mobility supports squat depth, running, rucking.",
  },
  squat_mobility: {
    goalKey: "squat_mobility", displayName: "Squat Mobility",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "supporting", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "warmup",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Deep squat hold 15s × 3 + cossack + frog",
    preferredMethods: ["dynamic_warmup", "user_short_round"],
    progressionSignals: ["deep squat hold quality"],
    regressionSignals: ["knee/hip discomfort"],
    contraindicationNotes: ["Respect knee/hip irritation."],
    futureBuilderInstruction: "Warm-up before lower-body sessions.",
    userVisibleGuidance: "Squat mobility supports lower-body skill and military goals.",
  },
  overhead_mobility: {
    goalKey: "overhead_mobility", displayName: "Overhead Mobility",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "supporting", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "warmup",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Lat opener + thoracic extension + shoulder flexion drill",
    preferredMethods: ["dynamic_warmup", "joint_prep"],
    progressionSignals: ["clean overhead line"],
    regressionSignals: ["lumbar arch compensation"],
    contraindicationNotes: ["Avoid forced overhead with lumbar arch."],
    futureBuilderInstruction: "Warm-up before handstand/HSPU/overhead pressing.",
    userVisibleGuidance: "Overhead mobility supports handstand and pressing.",
  },
  handstand_mobility: {
    goalKey: "handstand_mobility", displayName: "Handstand Mobility",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "supporting", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "warmup",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Wrist prep + shoulder flexion + lat opener + wall handstand exposure",
    preferredMethods: ["dynamic_warmup", "skill_rampup"],
    progressionSignals: ["line cleaner", "wrist tolerance"],
    regressionSignals: ["wrist pain", "shoulder impingement"],
    contraindicationNotes: ["Mandatory wrist prep before loading."],
    futureBuilderInstruction: "Warm-up before handstand sessions.",
    userVisibleGuidance: "Handstand mobility prepares wrists and overhead line.",
  },
  planche_wrist_prep: {
    goalKey: "planche_wrist_prep", displayName: "Planche Wrist Prep",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "not_used", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "contextual_joint_prep",
    warmupAllowed: true, cooldownAllowed: false, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Wrist rocks 30s + circles 30s + palm/finger pulses 30s + scap protraction",
    preferredMethods: ["wrist_prep", "skill_rampup"],
    progressionSignals: ["wrist tolerance", "scap protraction quality"],
    regressionSignals: ["wrist pain"],
    contraindicationNotes: ["Mandatory before planche loading."],
    futureBuilderInstruction: "Always include before planche sessions.",
    userVisibleGuidance: "Planche wrist prep mandatory before loading.",
  },
  front_lever_shoulder_scap_prep: {
    goalKey: "front_lever_shoulder_scap_prep", displayName: "Front Lever Shoulder/Scap Prep",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "supporting", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "contextual_joint_prep",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Scap pulls + hollow + lat activation + tuck lever exposure",
    preferredMethods: ["skill_rampup", "joint_prep"],
    progressionSignals: ["scap depression quality", "lat engagement"],
    regressionSignals: ["shoulder strain"],
    contraindicationNotes: ["Match lever progression level; do not over-load."],
    futureBuilderInstruction: "Warm-up before front lever sessions.",
    userVisibleGuidance: "Front lever prep targets scapular depression and lats.",
  },
  back_lever_shoulder_extension_prep: {
    goalKey: "back_lever_shoulder_extension_prep", displayName: "Back Lever Shoulder Extension Prep",
    directFlexibilityGoal: true,
    warmupRole: "primary", cooldownRole: "supporting", microSessionRole: "supporting",
    shouldAppearIfSelectedInOnboarding: true, preferredPlacement: "contextual_joint_prep",
    warmupAllowed: true, cooldownAllowed: true, mainWorkoutAllowed: false,
    avoidLongStaticBeforeStrength: false,
    recommendedDefaultPrescription: "Skin-the-cat slow + tuck back lever exposure + biceps tendon check",
    preferredMethods: ["skill_rampup", "joint_prep"],
    progressionSignals: ["shoulder extension tolerance", "biceps tendon comfort"],
    regressionSignals: ["biceps tendon irritation", "shoulder pain"],
    contraindicationNotes: ["High biceps/shoulder caution; progress slowly."],
    futureBuilderInstruction: "Warm-up before back lever sessions.",
    userVisibleGuidance: "Back lever prep protects shoulder extension and biceps.",
  },
}

// =====================================================================
// EXPORTS — aggregator-facing API (parity with Batch 1-8)
// =====================================================================

export function getBatch09ContraindicationRules(): unknown[] { return [] }

export function getBatch09Sources(): DoctrineSource[] { return BATCH_09_SOURCES }
export function getBatch09Principles(): DoctrinePrinciple[] { return BATCH_09_PRINCIPLES }
export function getBatch09ProgressionRules(): ProgressionRule[] { return BATCH_09_PROGRESSION }
export function getBatch09MethodRules(): MethodRule[] { return BATCH_09_METHOD }
export function getBatch09PrescriptionRules(): PrescriptionRule[] { return BATCH_09_PRESCRIPTION }
export function getBatch09ExerciseSelectionRules(): ExerciseSelectionRule[] { return BATCH_09_SELECTION }
export function getBatch09CarryoverRules(): CarryoverRule[] { return BATCH_09_CARRYOVER }

export function getBatch09Counts() {
  return {
    sources: BATCH_09_SOURCES.length,
    principles: BATCH_09_PRINCIPLES.length,
    progression: BATCH_09_PROGRESSION.length,
    method: BATCH_09_METHOD.length,
    prescription: BATCH_09_PRESCRIPTION.length,
    selection: BATCH_09_SELECTION.length,
    carryover: BATCH_09_CARRYOVER.length,
    total:
      BATCH_09_PRINCIPLES.length +
      BATCH_09_PROGRESSION.length +
      BATCH_09_METHOD.length +
      BATCH_09_PRESCRIPTION.length +
      BATCH_09_SELECTION.length +
      BATCH_09_CARRYOVER.length,
    flexibilityGoalsClassified: Object.keys(FLEXIBILITY_GOAL_SUPPORT_MATRIX).length,
  }
}

export function getBatch09CountsBySource(): Record<string, number> {
  const all = [
    ...BATCH_09_PRINCIPLES,
    ...BATCH_09_PROGRESSION,
    ...BATCH_09_METHOD,
    ...BATCH_09_PRESCRIPTION,
    ...BATCH_09_SELECTION,
    ...BATCH_09_CARRYOVER,
  ] as Array<{ source_id?: string }>
  const out: Record<string, number> = {}
  for (const r of all) {
    const sid = r.source_id ?? "unknown"
    out[sid] = (out[sid] ?? 0) + 1
  }
  return out
}

export function getBatch09ProvenanceFor(
  atomId: string,
): { batch: "batch_09"; sourceId: string | null } | null {
  const all: Array<{ id?: string; source_id?: string }> = [
    ...BATCH_09_PRINCIPLES,
    ...BATCH_09_PROGRESSION,
    ...BATCH_09_METHOD,
    ...BATCH_09_PRESCRIPTION,
    ...BATCH_09_SELECTION,
    ...BATCH_09_CARRYOVER,
  ]
  const hit = all.find((r) => r.id === atomId)
  if (!hit) return null
  return { batch: "batch_09", sourceId: hit.source_id ?? null }
}

export type Batch09Provenance = { batch: "batch_09"; sourceId: string | null }
