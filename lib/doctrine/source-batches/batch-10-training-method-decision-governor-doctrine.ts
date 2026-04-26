// =====================================================================
// SPARTANLAB DOCTRINE — BATCH 10
// Training Method Decision Governor / Top Sets / Drop Sets / Supersets /
// Circuits / Density / Endurance / Hypertrophy / Strength Protocols
// =====================================================================
//
// Purpose: Computable, decision-usable source-backed doctrine governing
// method selection (straight set, top set, back-off set, drop set,
// mechanical drop set, rest-pause, cluster, antagonist/same-muscle
// superset, circuit, density block, repeat-effort endurance) — including
// per-method rejection rules, compatibility-with-exercise-category rules,
// fatigue/recovery gating, time-constrained compression, user override
// warning logic, and method materialization truth-guards.
//
// This batch is doctrine FOUNDATION ONLY. It does NOT change runtime
// behavior, does NOT alter live workout, and does NOT wire into the
// builder. Method-profile-registry (lib/doctrine/method-profile-registry.ts)
// already governs SESSION-SHAPE profiles (neural_strength,
// mixed_strength_hypertrophy, density_condensed, recovery_technical,
// weighted_basics, flexibility_integration, skill_frequency). Batch 10
// adds the missing source-backed METHOD-LEVEL decision doctrine the
// builder will need in the upcoming Neon-doctrine-to-builder phase.
//
// Mirrors Batch 9 exactly:
//  - Same compact p()/progr()/meth()/rx()/sel()/carry() factories
//  - Same scopes/doctrine_family BASE
//  - Same DoctrineSource/Principle/Rule struct casts
//  - Same export surface (getBatch10*, getBatch10ProvenanceFor)
//  - Aggregator wires Batch 10 the same way as Batch 9
//  - Runtime contract auto-includes batch_10 via
//    Object.keys(fallbackCountsByBatch) — no runtime edit needed
//
// Legal-source: public evidence-informed strength-and-conditioning
// principles + SpartanLab user-authored coaching doctrine (clearly
// marked) + codebase-observed runtime (clearly marked). No leaked
// material, no copyrighted text reproduced.
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
// TYPES — exported for downstream builder/UI consumption (deferred phase)
// =====================================================================

export type MethodKey =
  | "straight_set"
  | "top_set"
  | "back_off_set"
  | "drop_set"
  | "mechanical_drop_set"
  | "rest_pause"
  | "cluster"
  | "superset_antagonist"
  | "superset_same_muscle"
  | "skill_plus_low_cost_support"
  | "circuit"
  | "density_block"
  | "repeat_effort_endurance"
  | "emom_finisher"
  | "amrap_density"

export type ExerciseCategoryKey =
  | "high_skill_isometrics"
  | "heavy_weighted_basics"
  | "stable_hypertrophy_accessories"
  | "prehab_joint_integrity"
  | "core_compression"
  | "military_test_calisthenics"
  | "lower_body_strength_hypertrophy"
  | "flexibility_mobility"

export type MethodCompatibilityLevel =
  | "preferred"
  | "allowed"
  | "caution"
  | "avoid"
  | "forbidden"

export type MethodSourceConfidence =
  | "public_evidence_informed"
  | "user_authored_preference"
  | "codebase_observed_runtime"
  | "general_consensus"
  | "gap"

export type MethodCompatibilityEntry = {
  method: MethodKey
  category: ExerciseCategoryKey
  level: MethodCompatibilityLevel
  rationale: string
  visibleEvidence: string
}

// =====================================================================
// SOURCES — 14 source registrations
// =====================================================================

const BATCH_10_SOURCES: DoctrineSource[] = [
  {
    id: "src_batch_10_strength_quality_principles",
    source_key: "method_governor_batch10_strength_quality_public_principles",
    title: "Strength Method Quality Principles (Batch 10)",
    description:
      "Why maximal strength prioritizes quality reps, longer rest, low technical degradation, and progressive overload over fatigue-heavy compression methods.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_hypertrophy_principles",
    source_key: "method_governor_batch10_hypertrophy_public_principles",
    title: "Hypertrophy Method Selection Principles (Batch 10)",
    description:
      "Why hypertrophy programming may use straight sets, back-off sets, drop sets, supersets, density, or circuits depending on muscle group, fatigue, time, equipment, and stability.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_density_endurance_principles",
    source_key: "method_governor_batch10_density_endurance_public_principles",
    title: "Density / Endurance / Work-Capacity Method Principles (Batch 10)",
    description:
      "Why density blocks and repeat-effort work fit conditioning, calisthenics endurance, work capacity, time-constrained sessions, and military event preparation — under quality and pacing constraints.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_calisthenics_skill_priority",
    source_key: "method_governor_batch10_calisthenics_skill_priority_user_doctrine",
    title: "Calisthenics Skill-Priority Protection (Batch 10, USER-AUTHORED)",
    description:
      "User-authored SpartanLab coaching doctrine: selected calisthenics skills receive direct or labeled-carryover representation before optional hypertrophy/endurance methods dominate session structure. High-skill isometrics protected from drop-set / same-muscle superset / random density.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_top_back_off_decision",
    source_key: "method_governor_batch10_top_set_backoff_set_decision",
    title: "Top Set / Back-Off Set Decision Doctrine (Batch 10)",
    description:
      "When top sets and back-off sets are appropriate, when they are rejected, ramp-up requirements, load reduction ranges, and placement order in the session.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_drop_mechanical_drop_decision",
    source_key: "method_governor_batch10_drop_set_mechanical_drop_set_decision",
    title: "Drop Set / Mechanical Drop Set Decision Doctrine (Batch 10)",
    description:
      "When drop sets fit hypertrophy accessory work, when they are rejected for primary skill / max load / unstable patterns, and how mechanical drops use safer regressions through similar movement patterns.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_superset_pairing_decision",
    source_key: "method_governor_batch10_superset_pairing_decision",
    title: "Superset Pairing Decision Doctrine (Batch 10)",
    description:
      "Antagonist vs same-muscle vs skill+low-cost-support superset taxonomy, fatigue cost, when supersets are preferred for time efficiency, and how skill primaries stay protected.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_circuit_density_decision",
    source_key: "method_governor_batch10_circuit_density_decision",
    title: "Circuit / Density Block Decision Doctrine (Batch 10)",
    description:
      "Circuits for work-capacity / accessory / military / time-efficient flows; density blocks for time-capped quality accumulation; rejection rules for max strength and early-acquisition skill.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_rest_pause_cluster_decision",
    source_key: "method_governor_batch10_rest_pause_cluster_decision",
    title: "Rest-Pause / Cluster Decision Doctrine (Batch 10)",
    description:
      "Rest-pause for advanced stable hypertrophy; cluster sets as intra-set execution to preserve rep quality under fatigue; rejection rules for skill, painful joints, and beginner sessions.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_fatigue_recovery_rejection",
    source_key: "method_governor_batch10_fatigue_recovery_rejection_rules",
    title: "Fatigue / Recovery Method Rejection Rules (Batch 10)",
    description:
      "How readiness, soreness, joint irritation, accumulated method stress, acclimation phase, and deload/taper context reduce, move, or reject high-fatigue methods.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_time_constraint_compression",
    source_key: "method_governor_batch10_time_constraint_compression_rules",
    title: "Time-Constrained Method Compression Rules (Batch 10)",
    description:
      "Order of compression under short-session constraints: accessories first, then density structure, never primary skill quality or essential warm-up for high-stress movements.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_method_materialization_truth",
    source_key: "method_governor_batch10_method_materialization_truth_guard",
    title: "Method Materialization Truth Guard (Batch 10)",
    description:
      "Method claims must reflect what the final materialized program object actually contains. UI explanations must derive from the same final program truth that built the session structure. No fake 'AI optimized' claims without input-driven decision.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_existing_code_observed_methods",
    source_key: "method_governor_batch10_existing_code_observed_method_registry",
    title: "Existing Code-Observed Method Registry (Batch 10, CODEBASE-OBSERVED)",
    description:
      "Codebase-observed method profiles already present in lib/doctrine/method-profile-registry.ts (skill_frequency, neural_strength, mixed_strength_hypertrophy, density_condensed, recovery_technical, weighted_basics, flexibility_integration). Batch 10 reinforces, does not replace.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
  {
    id: "src_batch_10_existing_pdf_doctrine_reinforcement",
    source_key: "method_governor_batch10_existing_pdf_doctrine_reinforcement",
    title: "Existing PDF Doctrine Reinforcement (Batch 10)",
    description:
      "Reinforcement bridge to incidental method anchors already encoded in Batches 1-9 (e.g. Batch 1 antagonist_pairing_accessory; Batch 4 add_load_when_top_set_clean). Batch 10 makes those anchors decision-usable across all session contexts.",
    source_type: "extracted_pdf",
    version: "1.0.0",
    is_active: true,
  } as unknown as DoctrineSource,
]

// =====================================================================
// HELPER BUILDERS (mirrors Batch 9 compact pattern exactly)
// =====================================================================

const BASE = {
  is_base_intelligence: true,
  doctrine_family: "training_method_decision_governor",
  scopes: { athlete_level: "any", goal: "any", phase: "any" } as const,
}

function p(
  id: string,
  source_id: string,
  principle_key: string,
  evidence: string,
  category: string = "training_method_decision",
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
const S_STR = "src_batch_10_strength_quality_principles"
const S_HYP = "src_batch_10_hypertrophy_principles"
const S_DEN = "src_batch_10_density_endurance_principles"
const S_CSP = "src_batch_10_calisthenics_skill_priority"
const S_TOP = "src_batch_10_top_back_off_decision"
const S_DROP = "src_batch_10_drop_mechanical_drop_decision"
const S_SUP = "src_batch_10_superset_pairing_decision"
const S_CIR = "src_batch_10_circuit_density_decision"
const S_RPC = "src_batch_10_rest_pause_cluster_decision"
const S_FAT = "src_batch_10_fatigue_recovery_rejection"
const S_TIME = "src_batch_10_time_constraint_compression"
const S_TRUTH = "src_batch_10_method_materialization_truth"
const S_CODE = "src_batch_10_existing_code_observed_methods"
const S_PDF = "src_batch_10_existing_pdf_doctrine_reinforcement"

// =====================================================================
// PRINCIPLES — strength / hypertrophy / density / skill / fatigue / truth
// =====================================================================

const BATCH_10_PRINCIPLES: DoctrinePrinciple[] = [
  // Strength quality
  p("bat10_p_str_quality_first", S_STR, "strength_quality_first",
    "Strength method prioritized quality and rest."),
  p("bat10_p_str_progressive_overload", S_STR, "strength_progressive_overload",
    "Strength method supports progressive overload."),
  p("bat10_p_str_low_tech_degradation", S_STR, "strength_low_technical_degradation",
    "Strength method preserved technique under load."),
  p("bat10_p_str_measurable_output", S_STR, "strength_measurable_output",
    "Strength method preserved measurable performance output."),
  p("bat10_p_str_long_rest", S_STR, "strength_long_rest_default",
    "Heavy strength uses longer rest by default."),
  p("bat10_p_str_no_failure_default", S_STR, "strength_no_failure_default",
    "Heavy strength avoids failure on primary work."),
  p("bat10_p_str_straight_default", S_STR, "strength_straight_set_default",
    "Straight sets remain default for heavy primary strength."),

  // Hypertrophy
  p("bat10_p_hyp_context_dependent", S_HYP, "hypertrophy_method_context_dependent",
    "Hypertrophy method chosen by muscle/equipment/fatigue context."),
  p("bat10_p_hyp_volume_quality_balance", S_HYP, "hypertrophy_volume_quality_balance",
    "Hypertrophy balances volume and rep quality."),
  p("bat10_p_hyp_fatigue_cost_tracked", S_HYP, "hypertrophy_fatigue_cost_tracked",
    "Hypertrophy method choice tracks fatigue cost."),
  p("bat10_p_hyp_stable_safe_for_intensity", S_HYP, "hypertrophy_stable_safe_for_intensity",
    "Stable patterns tolerate higher intensity techniques."),
  p("bat10_p_hyp_no_random_failure", S_HYP, "hypertrophy_no_random_failure",
    "Hypertrophy avoids random failure when joints irritated."),

  // Density / endurance
  p("bat10_p_den_quality_capped", S_DEN, "density_quality_capped",
    "Density capped by quality standard."),
  p("bat10_p_den_not_random_fatigue", S_DEN, "density_not_random_fatigue",
    "Density block is not random fatigue."),
  p("bat10_p_den_pacing_principle", S_DEN, "density_pacing_principle",
    "Density block paced for sustainable output."),
  p("bat10_p_den_form_break_reduce", S_DEN, "density_form_break_reduce_or_swap",
    "Density reduces reps or swaps exercises if form breaks."),
  p("bat10_p_end_repeat_effort_test", S_DEN, "endurance_repeat_effort_for_test",
    "Repeat effort selected for test/event endurance."),
  p("bat10_p_end_pacing_not_smoke", S_DEN, "endurance_pacing_not_smoke_session",
    "Endurance work paced rather than smoke-session."),
  p("bat10_p_end_strength_separation", S_DEN, "endurance_strength_separation",
    "Endurance block placed after primary strength/skill."),

  // Calisthenics skill priority (USER-AUTHORED)
  p("bat10_p_csp_selected_skill_priority", S_CSP, "selected_skill_priority",
    "Selected skill priority preserved over method variety."),
  p("bat10_p_csp_skill_unpaired_default", S_CSP, "skill_unpaired_default",
    "Skill work kept unpaired to preserve quality."),
  p("bat10_p_csp_skill_first_in_session", S_CSP, "skill_first_in_session",
    "Selected calisthenics skills represented before optional methods."),
  p("bat10_p_csp_high_skill_neural_protect", S_CSP, "high_skill_neural_protection",
    "High-skill / high-neural work protected from fatigue methods."),
  p("bat10_p_csp_carryover_labeled", S_CSP, "skill_carryover_labeled",
    "Carryover work labeled as supporting selected skill."),
  p("bat10_p_csp_user_authored_protocol", S_CSP, "calisthenics_skill_priority_user_authored",
    "Calisthenics skill-priority is user-authored SpartanLab doctrine."),

  // Top set / back-off
  p("bat10_p_top_strength_expression", S_TOP, "top_set_strength_expression",
    "Top set selected for strength expression before volume."),
  p("bat10_p_top_after_rampup", S_TOP, "top_set_after_rampup",
    "Top set follows ramp-up — not from cold."),
  p("bat10_p_backoff_quality_volume", S_TOP, "back_off_quality_volume",
    "Back-off volume added after heavy top set."),
  p("bat10_p_backoff_load_reduction", S_TOP, "back_off_load_reduction_range",
    "Back-off reduces load to preserve form."),
  p("bat10_p_top_reject_recovery", S_TOP, "top_set_reject_recovery_phase",
    "Top set rejected to protect recovery/skill quality."),

  // Drop / mechanical drop
  p("bat10_p_drop_hypertrophy_accessory", S_DROP, "drop_set_hypertrophy_accessory",
    "Drop set used for hypertrophy accessory, not primary skill."),
  p("bat10_p_drop_reject_skill", S_DROP, "drop_set_reject_skill_or_max",
    "Drop set rejected because primary skill quality would degrade."),
  p("bat10_p_mech_drop_safer_regression", S_DROP, "mechanical_drop_safer_regression",
    "Mechanical drop selected through safer regression path."),
  p("bat10_p_mech_drop_no_intent_change", S_DROP, "mechanical_drop_no_intent_change",
    "Mechanical drop preserves movement intent."),

  // Rest-pause
  p("bat10_p_rp_advanced_stable", S_RPC, "rest_pause_advanced_stable",
    "Rest-pause reserved for advanced stable hypertrophy work."),
  p("bat10_p_rp_reject_form_collapse", S_RPC, "rest_pause_reject_form_collapse",
    "Rest-pause rejected to prevent form collapse."),

  // Cluster
  p("bat10_p_cluster_intra_set", S_RPC, "cluster_intra_set_method",
    "Cluster treated as intra-set execution method."),
  p("bat10_p_cluster_quality_preserve", S_RPC, "cluster_quality_preservation",
    "Cluster selected to preserve rep quality."),
  p("bat10_p_cluster_reject_simple", S_RPC, "cluster_reject_simple_structure",
    "Cluster rejected because straight/density structure is clearer."),

  // Superset
  p("bat10_p_sup_paired_method", S_SUP, "superset_paired_method",
    "Superset classified as paired exercise method."),
  p("bat10_p_sup_antagonist_efficiency", S_SUP, "superset_antagonist_efficiency",
    "Non-competing superset selected for time efficiency."),
  p("bat10_p_sup_same_muscle_caution", S_SUP, "superset_same_muscle_caution",
    "Same-muscle superset restricted to accessory hypertrophy."),
  p("bat10_p_sup_low_cost_skill_pairing", S_SUP, "skill_low_cost_support_pairing",
    "Low-cost support paired without reducing skill quality."),

  // Circuit
  p("bat10_p_cir_work_capacity", S_CIR, "circuit_work_capacity_focus",
    "Circuit selected for work capacity/accessory flow."),
  p("bat10_p_cir_reject_max_strength", S_CIR, "circuit_reject_max_strength_skill",
    "Circuit rejected to protect strength/skill quality."),

  // Density
  p("bat10_p_den_selected_block", S_CIR, "density_block_selected",
    "Density block selected for quality work in fixed time."),
  p("bat10_p_den_reject_high_complexity", S_CIR, "density_reject_high_complexity",
    "Density rejected due to quality/recovery risk."),

  // Fatigue / recovery / acclimation / deload
  p("bat10_p_fat_intensity_reduction", S_FAT, "fatigue_method_intensity_reduction",
    "Method intensity reduced by readiness/fatigue."),
  p("bat10_p_fat_acclimation_delay", S_FAT, "acclimation_delay_advanced_methods",
    "Advanced methods delayed during acclimation."),
  p("bat10_p_fat_taper_lower_fatigue", S_FAT, "deload_taper_method_selection",
    "Method selection tapered for test week/deload."),
  p("bat10_p_fat_joint_irritation_caution", S_FAT, "joint_irritation_method_caution",
    "Methods reduced when joints irritated."),

  // Time-constrained compression
  p("bat10_p_time_compress_accessory_first", S_TIME, "time_compress_accessory_first",
    "Accessory work compressed before primary skill."),
  p("bat10_p_time_warmup_preserved", S_TIME, "warmup_preserved_under_compression",
    "Warm-up preserved before method compression."),

  // Method variety / stacking
  p("bat10_p_variety_cap", S_PDF, "method_variety_cap",
    "Method stacking capped to prevent chaos."),

  // User override
  p("bat10_p_override_with_warning", S_TRUTH, "user_override_with_warning",
    "Override allowed with safety warning and reduced risk."),

  // Materialization truth
  p("bat10_p_truth_method_materialized", S_TRUTH, "method_materialization_truth",
    "Method proof reflects final materialized method."),
  p("bat10_p_truth_explanation_parity", S_TRUTH, "method_explanation_parity",
    "Method explanation matches materialized session."),
  p("bat10_p_truth_no_fake_ai_claim", S_TRUTH, "method_no_fake_ai_claim",
    "Method claim backed by input-driven decision."),
  p("bat10_p_truth_no_visual_change_yet", S_TRUTH, "no_visual_change_until_builder",
    "Doctrine batch alone does not change program output until builder integration."),

  // Existing code observed
  p("bat10_p_code_method_profile_registry", S_CODE, "method_profile_registry_observed",
    "Existing method profiles observed in method-profile-registry."),
  p("bat10_p_code_density_engine_observed", S_CODE, "density_engine_observed",
    "Existing density/endurance engines observed in skill-density-engine and endurance-density-config."),
  p("bat10_p_code_materialization_summary", S_CODE, "materialization_summary_observed",
    "Existing method-materialization-summary observed in lib/program/method-materialization-summary."),

  // Existing PDF doctrine reinforcement
  p("bat10_p_pdf_antagonist_anchor", S_PDF, "antagonist_pairing_anchor_reinforced",
    "Batch 1 antagonist_pairing_accessory anchor reinforced as decision-usable."),
  p("bat10_p_pdf_top_set_anchor", S_PDF, "top_set_clean_anchor_reinforced",
    "Batch 4 add_load_when_top_set_clean anchor reinforced as decision-usable."),
]

// =====================================================================
// METHOD RULES — execution + hard contraindications
// =====================================================================

const BATCH_10_METHOD: MethodRule[] = [
  // Straight sets
  meth("bat10_m_straight_primary_skill", S_STR, "straight_set_for_primary_skill",
    "Straight sets preserved primary quality."),
  meth("bat10_m_straight_new_movement", S_STR, "straight_set_for_new_movement",
    "Straight sets used for new movement learning."),

  // Top / back-off
  meth("bat10_m_top_set_use", S_TOP, "top_set_method_use",
    "Top set placed after warm-up, before back-off and accessories."),
  meth("bat10_m_back_off_after_top", S_TOP, "back_off_after_top_set",
    "Back-off sets follow top set with reduced load."),
  meth("bat10_m_top_reject_high_soreness", S_TOP, "top_set_reject_high_soreness",
    "No top sets when soreness/recovery low.", true),
  meth("bat10_m_top_reject_test_week", S_TOP, "top_set_reject_test_week",
    "No heavy top sets during test-week taper.", true),

  // Drop / mechanical drop
  meth("bat10_m_drop_stable_only", S_DROP, "drop_set_stable_pattern_only",
    "Drop sets restricted to safer accessory or stable patterns."),
  meth("bat10_m_drop_reject_iso_skill", S_DROP, "drop_set_reject_high_skill_iso",
    "No drop sets on high-skill isometrics.", true),
  meth("bat10_m_drop_reject_max_load", S_DROP, "drop_set_reject_near_max_load",
    "No drop sets on heavy weighted basics at near-max load.", true),
  meth("bat10_m_drop_reject_painful_joint", S_DROP, "drop_set_reject_painful_joint",
    "No drop sets when joints are pain-sensitive.", true),
  meth("bat10_m_drop_reject_unstable", S_DROP, "drop_set_reject_unstable_exercise",
    "No drop sets on unstable exercises (rings strength, ungoverned skill work).", true),
  meth("bat10_m_mech_drop_path", S_DROP, "mechanical_drop_path_method",
    "Mechanical drops use harder→easier same-pattern variations."),
  meth("bat10_m_mech_drop_examples", S_DROP, "mechanical_drop_canonical_examples",
    "Examples: pseudo planche push-up → push-up; hard row angle → easier row angle; hard curl → easier curl variation."),

  // Rest-pause
  meth("bat10_m_rp_advanced_use", S_RPC, "rest_pause_method_use",
    "Rest-pause uses short intra-set pauses on stable hypertrophy work."),
  meth("bat10_m_rp_reject_skill", S_RPC, "rest_pause_reject_skill_acquisition",
    "No rest-pause on skill acquisition / fragile technique.", true),
  meth("bat10_m_rp_reject_painful", S_RPC, "rest_pause_reject_painful_joint",
    "No rest-pause when form would collapse or joints are painful.", true),
  meth("bat10_m_rp_reject_taper", S_RPC, "rest_pause_reject_taper",
    "No rest-pause during deload/test-week taper.", true),

  // Cluster
  meth("bat10_m_cluster_intra_rest", S_RPC, "cluster_intra_set_rest_method",
    "Cluster uses ~10–30s intra-set rest to preserve rep quality."),
  meth("bat10_m_cluster_skill_strength", S_RPC, "cluster_for_skill_strength",
    "Cluster preferred when target reps are at risk under fatigue."),
  meth("bat10_m_cluster_reject_metabolic", S_RPC, "cluster_reject_metabolic_burn",
    "No cluster when goal is metabolic burn / continuous endurance."),

  // Supersets
  meth("bat10_m_sup_antagonist_use", S_SUP, "superset_antagonist_method",
    "Antagonist superset pairs non-competing patterns."),
  meth("bat10_m_sup_antagonist_examples", S_SUP, "superset_antagonist_examples",
    "Examples: pull + push, upper + lower, accessory + mobility, core + non-competing strength."),
  meth("bat10_m_sup_same_muscle_accessory", S_SUP, "superset_same_muscle_accessory_only",
    "Same-muscle superset reserved for accessory hypertrophy.", true),
  meth("bat10_m_sup_skill_low_cost", S_SUP, "skill_low_cost_support_pairing_method",
    "Skill paired only with low-cost support (wrist prep / mobility / breathing)."),
  meth("bat10_m_sup_skill_unpaired_when_risk", S_SUP, "skill_unpaired_when_quality_at_risk",
    "Skill kept unpaired if pairing reduces technical quality.", true),

  // Circuits
  meth("bat10_m_circuit_use", S_CIR, "circuit_method_use",
    "Circuit sequences accessory / conditioning / military / mobility flows."),
  meth("bat10_m_circuit_reject_max", S_CIR, "circuit_reject_max_strength",
    "No circuits on maximal strength primary work.", true),
  meth("bat10_m_circuit_reject_skill_learn", S_CIR, "circuit_reject_skill_learning",
    "No circuits during early technical skill learning.", true),
  meth("bat10_m_circuit_reject_heavy_weighted", S_CIR, "circuit_reject_heavy_weighted_basics",
    "No circuits for heavy weighted pull-up / dip / press primary work.", true),

  // Density
  meth("bat10_m_density_window", S_CIR, "density_block_window_method",
    "Density block uses fixed time window for quality accumulation."),
  meth("bat10_m_density_quality_cap", S_CIR, "density_block_quality_cap",
    "Density caps reps when form breaks rather than chasing fatigue."),
  meth("bat10_m_density_reject_complex_skill", S_CIR, "density_reject_complex_skill",
    "No density blocks on complex skill attempts / max attempts.", true),

  // Endurance / repeat-effort
  meth("bat10_m_repeat_effort_use", S_DEN, "repeat_effort_method_use",
    "Repeat-effort uses repeated quality output under fatigue."),
  meth("bat10_m_repeat_effort_test_specific", S_DEN, "repeat_effort_test_specific",
    "Repeat-effort matches event/test-specific intervals."),
  meth("bat10_m_emom_finisher_use", S_DEN, "emom_finisher_method_use",
    "EMOM-style finisher uses every-minute interval pacing."),
  meth("bat10_m_amrap_density_use", S_DEN, "amrap_density_method_use",
    "AMRAP-style density uses time-capped quality reps."),
  meth("bat10_m_endurance_overwrite_strength_only_if_primary", S_DEN, "endurance_no_overwrite_strength",
    "Endurance does not overwrite primary strength/skill unless endurance is the primary goal.", true),

  // Fatigue / recovery rejection
  meth("bat10_m_fat_reject_high_method_low_readiness", S_FAT, "reject_high_fatigue_methods_low_readiness",
    "High-fatigue methods rejected when readiness low.", true),
  meth("bat10_m_fat_reject_high_method_high_soreness", S_FAT, "reject_high_fatigue_methods_high_soreness",
    "High-fatigue methods rejected when soreness high.", true),
  meth("bat10_m_fat_acclimation_simple", S_FAT, "acclimation_simple_methods_only",
    "Acclimation phase keeps simple straight sets and low-fatigue accessories."),
  meth("bat10_m_fat_taper_no_finishers", S_FAT, "taper_no_high_soreness_finishers",
    "Test-week taper avoids high-soreness finishers and heavy drop sets.", true),
  meth("bat10_m_fat_method_stack_cap", S_FAT, "method_stack_per_session_cap",
    "Only one primary method theme per session unless conditioning circuit."),

  // Time-constrained
  meth("bat10_m_time_short_compress_accessory", S_TIME, "short_session_compress_accessory_first",
    "Short sessions compress accessories before primary work."),
  meth("bat10_m_time_short_keep_warmup", S_TIME, "short_session_keep_warmup",
    "Short sessions preserve essential warm-up for high-stress movements.", true),
  meth("bat10_m_time_short_use_antagonist_sup", S_TIME, "short_session_use_antagonist_superset",
    "Short sessions may use antagonist supersets for non-competing accessory pairs."),

  // User override
  meth("bat10_m_override_safe_allowed", S_TRUTH, "user_override_safe_allowed",
    "User override allowed when safe with warning and reduced risk placement."),
  meth("bat10_m_override_unsafe_block", S_TRUTH, "user_override_unsafe_block",
    "User override blocked when unsafe; safer regression required.", true),

  // Materialization truth
  meth("bat10_m_truth_no_unmaterialized_claim", S_TRUTH, "no_unmaterialized_method_claim",
    "No method claim unless materialized in final program object.", true),
]

// =====================================================================
// EXERCISE SELECTION RULES — method-to-exercise pairing decisions
// =====================================================================

const BATCH_10_SELECTION: ExerciseSelectionRule[] = [
  // High-skill isometrics
  sel("bat10_s_iso_straight_only", S_CSP, "iso_skill_straight_set_only",
    "Selection: high-skill isometrics use straight sets and protected rest."),
  sel("bat10_s_iso_no_drop", S_CSP, "iso_skill_no_drop_set",
    "Selection: no drop sets on high-skill isometrics."),
  sel("bat10_s_iso_no_circuit", S_CSP, "iso_skill_no_random_circuit",
    "Selection: no random circuits on high-skill isometrics."),
  sel("bat10_s_iso_no_same_muscle_sup", S_CSP, "iso_skill_no_same_muscle_superset",
    "Selection: no same-muscle supersets before high-skill isometrics."),
  sel("bat10_s_iso_no_rest_pause", S_CSP, "iso_skill_no_rest_pause",
    "Selection: no rest-pause on high-skill isometrics."),

  // Heavy weighted basics
  sel("bat10_s_hw_top_back_off", S_TOP, "heavy_weighted_top_back_off_preferred",
    "Selection: heavy weighted basics prefer top set + back-off."),
  sel("bat10_s_hw_clusters_for_quality", S_RPC, "heavy_weighted_cluster_for_quality",
    "Selection: heavy weighted basics may use cluster for quality."),
  sel("bat10_s_hw_no_drop_at_max", S_DROP, "heavy_weighted_no_drop_at_max",
    "Selection: no drop sets on near-max heavy weighted basics."),
  sel("bat10_s_hw_no_same_muscle_pre", S_SUP, "heavy_weighted_no_same_muscle_pre",
    "Selection: no same-muscle supersets before heavy weighted basics."),
  sel("bat10_s_hw_no_circuit", S_CIR, "heavy_weighted_no_circuit",
    "Selection: no circuits during heavy weighted basics primary work."),

  // Stable hypertrophy accessories
  sel("bat10_s_stab_drop_allowed", S_DROP, "stable_accessory_drop_allowed",
    "Selection: stable accessories may use drop sets."),
  sel("bat10_s_stab_rp_allowed", S_RPC, "stable_accessory_rest_pause_allowed",
    "Selection: stable accessories may use rest-pause."),
  sel("bat10_s_stab_sup_allowed", S_SUP, "stable_accessory_supersets_allowed",
    "Selection: stable accessories may be supersetted."),
  sel("bat10_s_stab_density_allowed", S_CIR, "stable_accessory_density_allowed",
    "Selection: stable accessories may use density."),
  sel("bat10_s_stab_caution_irritation", S_HYP, "stable_accessory_caution_irritation",
    "Selection: stable accessories reduce intensity if joints irritated."),

  // Prehab / joint integrity
  sel("bat10_s_prehab_low_fatigue_circuit", S_CIR, "prehab_low_fatigue_circuit",
    "Selection: prehab uses low-fatigue circuits or activation sequences."),
  sel("bat10_s_prehab_no_failure", S_FAT, "prehab_no_failure",
    "Selection: prehab avoids failure / heavy drop sets."),
  sel("bat10_s_prehab_warmup_integration", S_TIME, "prehab_warmup_integration",
    "Selection: prehab can integrate with warm-up."),

  // Core / compression
  sel("bat10_s_core_straight_default", S_CSP, "core_straight_set_default",
    "Selection: core compression defaults to straight sets."),
  sel("bat10_s_core_density_after_skill", S_CIR, "core_density_after_skill",
    "Selection: core density placed after primary skill if it would weaken body tension first."),
  sel("bat10_s_core_skill_pairing", S_SUP, "core_skill_low_cost_pairing",
    "Selection: core may pair with skill as low-cost support."),

  // Military / test calisthenics
  sel("bat10_s_mil_repeat_effort", S_DEN, "military_repeat_effort_preferred",
    "Selection: military test calisthenics use repeat-effort and density."),
  sel("bat10_s_mil_pacing_practice", S_DEN, "military_pacing_practice",
    "Selection: military training includes pacing practice."),
  sel("bat10_s_mil_no_random_smoke", S_DEN, "military_no_random_smoke",
    "Selection: military training avoids random smoke sessions."),
  sel("bat10_s_mil_event_sequencing", S_DEN, "military_event_sequencing",
    "Selection: military training sequences exercises by event order."),

  // Lower body strength / hypertrophy
  sel("bat10_s_lb_top_back_off", S_TOP, "lower_body_top_back_off",
    "Selection: lower-body strength prefers top set + back-off."),
  sel("bat10_s_lb_hyp_methods", S_HYP, "lower_body_hypertrophy_methods",
    "Selection: lower-body hypertrophy may use straight sets, supersets, or density on accessories."),
  sel("bat10_s_lb_no_density_pre_priority", S_CSP, "lower_body_no_density_pre_priority_skill",
    "Selection: avoid high-soreness leg density before priority handstand/planche/FL skill sessions if user selected minimal legs."),

  // Flexibility / mobility — bridge to Batch 9
  sel("bat10_s_flex_no_long_static_pre", S_TIME, "flex_no_long_static_pre_strength",
    "Selection: long static stretching avoided before strength/skill (Batch 9 alignment)."),
  sel("bat10_s_flex_user_short_round_user", S_CSP, "flex_user_short_round_method",
    "Selection: 3×15s short-round flex method reused as user-authored preference (Batch 9 USER_AUTHORED_VERIFIED)."),

  // Skill priority pairing
  sel("bat10_s_skill_first_position", S_CSP, "skill_first_position_in_session",
    "Selection: selected skill placed at session start before fatigue methods."),
  sel("bat10_s_skill_no_pairing_fatigue", S_CSP, "skill_no_fatiguing_pairing",
    "Selection: skill not paired with fatiguing antagonist work that drops quality."),
  sel("bat10_s_skill_carryover_labeled", S_CSP, "skill_carryover_label_required",
    "Selection: carryover work labeled as skill-supporting."),

  // Override & truth
  sel("bat10_s_override_warn", S_TRUTH, "override_warn_safer_placement",
    "Selection: user override warned and given safer placement when allowed."),
  sel("bat10_s_truth_no_cosmetic_method", S_TRUTH, "no_cosmetic_method_only_label",
    "Selection: method labels only when method is materialized."),
]

// =====================================================================
// PRESCRIPTION RULES — typical doses / structures
// =====================================================================

const BATCH_10_PRESCRIPTION: PrescriptionRule[] = [
  rx("bat10_rx_top_set", S_TOP, "top_set_typical_dose",
    "1 working top set after 2-4 ramp-up sets",
    "Top-set dose: 1 working top set after 2-4 ramp-up sets."),
  rx("bat10_rx_back_off", S_TOP, "back_off_typical_dose",
    "2-4 back-off sets at 10-25% reduced load",
    "Back-off dose: 2-4 sets at 10-25% reduced load."),
  rx("bat10_rx_drop_set", S_DROP, "drop_set_typical_dose",
    "1 working set + 1-2 drops with 15-25% load reduction each",
    "Drop-set dose: 1 working set + 1-2 drops with 15-25% load reduction."),
  rx("bat10_rx_mech_drop", S_DROP, "mechanical_drop_typical_dose",
    "harder variation × N → easier variation × N (same set, no rest)",
    "Mechanical drop dose: harder→easier variation in same set."),
  rx("bat10_rx_rest_pause", S_RPC, "rest_pause_typical_dose",
    "1 working set + 2-3 mini-sets with 10-15s rest each, stable exercise only",
    "Rest-pause dose: 1 working + 2-3 mini-sets at 10-15s rest, stable only."),
  rx("bat10_rx_cluster", S_RPC, "cluster_typical_dose",
    "3-5 mini-clusters of 2-3 reps with 10-30s intra-set rest",
    "Cluster dose: 3-5 mini-sets of 2-3 reps with 10-30s intra-rest."),
  rx("bat10_rx_sup_antagonist", S_SUP, "antagonist_superset_typical_dose",
    "Pair A + B back-to-back, 60-90s rest after pair, 3-4 rounds",
    "Antagonist superset: A+B back-to-back, 60-90s rest, 3-4 rounds."),
  rx("bat10_rx_sup_same_muscle", S_SUP, "same_muscle_superset_typical_dose",
    "Same-muscle pair only on stable accessories, 2-3 rounds, full rest after",
    "Same-muscle superset: stable accessories only, 2-3 rounds, full rest after."),
  rx("bat10_rx_circuit", S_CIR, "circuit_typical_dose",
    "3-6 exercises × 30-45s work / 15-30s transition × 2-4 rounds",
    "Circuit dose: 3-6 stations × 30-45s work / 15-30s transition × 2-4 rounds."),
  rx("bat10_rx_density_block", S_CIR, "density_block_typical_dose",
    "5-12 minute window, 1-3 exercises, quality reps capped",
    "Density block dose: 5-12 min window, quality-capped reps."),
  rx("bat10_rx_emom", S_DEN, "emom_finisher_typical_dose",
    "Every minute on the minute × 6-12 minutes; rest = remainder of minute",
    "EMOM dose: 6-12 minutes, every-minute interval."),
  rx("bat10_rx_amrap", S_DEN, "amrap_density_typical_dose",
    "AMRAP 6-15 minutes with quality cap per round",
    "AMRAP dose: 6-15 minute time-cap with quality reps."),
  rx("bat10_rx_repeat_effort", S_DEN, "repeat_effort_typical_dose",
    "5-10 sets × 30-60% of max reps with 60-120s rest, test-event-specific",
    "Repeat-effort dose: 5-10 sets × 30-60% max reps, 60-120s rest."),
  rx("bat10_rx_strength_straight", S_STR, "strength_straight_set_typical_dose",
    "3-5 working sets × 3-6 reps, 2-4 min rest, RPE 7-9",
    "Strength straight-set dose: 3-5×3-6, 2-4 min rest, RPE 7-9."),
  rx("bat10_rx_hyp_straight", S_HYP, "hypertrophy_straight_set_typical_dose",
    "3-4 working sets × 6-12 reps, 60-120s rest, RPE 7-9",
    "Hypertrophy straight-set dose: 3-4×6-12, 60-120s rest."),
  rx("bat10_rx_skill_iso", S_CSP, "skill_iso_typical_dose",
    "3-6 sets × 3-8s clean iso hold + scapular cue + full rest",
    "Skill-iso dose: 3-6 × 3-8s clean holds + full rest."),
  rx("bat10_rx_skill_dynamic", S_CSP, "skill_dynamic_typical_dose",
    "3-5 sets × 1-3 quality reps + full rest",
    "Skill-dynamic dose: 3-5 × 1-3 quality reps + full rest."),
  rx("bat10_rx_short_session", S_TIME, "short_session_compression_dose",
    "30-min: 5-7 min warm-up + 15-18 min primary + 7-10 min compressed accessory",
    "Short-session dose: warm-up + primary intact + compressed accessory."),
  rx("bat10_rx_acclimation", S_FAT, "acclimation_phase_dose",
    "Weeks 1-2: simple straight sets, no rest-pause/drop, RPE ≤8",
    "Acclimation dose: simple straight sets only, RPE ≤8."),
  rx("bat10_rx_taper", S_FAT, "deload_taper_dose",
    "Test-week taper: ~50% volume, no finishers, RPE ≤7",
    "Taper dose: ~50% volume, no finishers, RPE ≤7."),
]

// =====================================================================
// PROGRESSION RULES — method scaling / escalation
// =====================================================================

const BATCH_10_PROGRESSION: ProgressionRule[] = [
  progr("bat10_pr_top_set_progress", S_TOP, "top_set_progression",
    "top_set_clean && hit_target_reps",
    "Top set: add load when reps clean across all sets (Batch 4 anchor honored)."),
  progr("bat10_pr_back_off_progress", S_TOP, "back_off_progression",
    "back_off_volume_completed && rpe_target_held",
    "Back-off: add reps before adding load."),
  progr("bat10_pr_drop_progress", S_DROP, "drop_set_progression",
    "stable_accessory && joints_clean",
    "Drop: only when stable + joints clean; reduce load 15-25% per drop."),
  progr("bat10_pr_rp_progress", S_RPC, "rest_pause_progression",
    "advanced_user && stable_pattern && form_consistent",
    "Rest-pause: only when form consistent and pattern stable."),
  progr("bat10_pr_cluster_progress", S_RPC, "cluster_progression",
    "target_reps_at_risk_under_fatigue",
    "Cluster: progress reps before reducing intra-rest."),
  progr("bat10_pr_density_progress", S_CIR, "density_progression",
    "form_clean_in_window",
    "Density: increase reps in window before increasing window length."),
  progr("bat10_pr_endurance_progress", S_DEN, "endurance_progression",
    "test_or_event_proximity && prior_repeat_effort_clean",
    "Endurance: progress total reps then progress pacing."),
  progr("bat10_pr_skill_first_progress", S_CSP, "skill_first_progression",
    "selected_skill && skill_quality_held",
    "Skill: progress skill first; only then escalate accessory method intensity."),
  progr("bat10_pr_acclimation_unlock", S_FAT, "acclimation_unlock_advanced_methods",
    "weeks_completed >= 2 && soreness_tolerable && form_clean",
    "Acclimation: unlock advanced methods only after 1-2 clean weeks."),
  progr("bat10_pr_short_session_compress", S_TIME, "short_session_method_compression",
    "session_minutes <= 30",
    "Short session: compress accessories first; preserve primary skill/strength."),
]

// =====================================================================
// CARRYOVER RULES — method outcome carryover
// =====================================================================

const BATCH_10_CARRYOVER: CarryoverRule[] = [
  carry("bat10_c_strength_to_skill", S_STR, "strength_quality_to_skill_quality",
    "Strength quality methods carry to skill quality output."),
  carry("bat10_c_density_to_endurance", S_DEN, "density_to_endurance_carryover",
    "Density methods carry to endurance/work-capacity output."),
  carry("bat10_c_repeat_effort_to_test", S_DEN, "repeat_effort_to_test_event_carryover",
    "Repeat-effort training carries to test/event output."),
  carry("bat10_c_skill_priority_to_progression", S_CSP, "skill_priority_to_progression_progress",
    "Skill-priority protection carries to skill progression rate."),
  carry("bat10_c_method_truth_to_ui", S_TRUTH, "method_truth_to_ui_explanation",
    "Method materialization carries directly into UI explanation parity."),
]

// =====================================================================
// METHOD COMPATIBILITY MATRIX (12 methods × 8 categories = 96 entries)
// =====================================================================

const VE = (m: string, c: string, level: MethodCompatibilityLevel) =>
  `${m} ${level === "preferred" ? "preferred for" : level === "allowed" ? "allowed on" : level === "caution" ? "used with caution on" : level === "avoid" ? "avoided on" : "forbidden on"} ${c}.`

function mc(
  method: MethodKey,
  category: ExerciseCategoryKey,
  level: MethodCompatibilityLevel,
  rationale: string,
): MethodCompatibilityEntry {
  return {
    method,
    category,
    level,
    rationale,
    visibleEvidence: VE(method, category, level),
  }
}

export const METHOD_COMPATIBILITY_MATRIX: ReadonlyArray<MethodCompatibilityEntry> = [
  // 1. high_skill_isometrics
  mc("straight_set", "high_skill_isometrics", "preferred", "Quality + technique + neural output."),
  mc("top_set", "high_skill_isometrics", "caution", "Only when isometric supports measurable hold progression."),
  mc("back_off_set", "high_skill_isometrics", "allowed", "Lower-leverage exposure after top hold."),
  mc("drop_set", "high_skill_isometrics", "forbidden", "Form/joint risk; technical degradation."),
  mc("mechanical_drop_set", "high_skill_isometrics", "caution", "Only via clearly easier lever (e.g. tuck FL after straddle)."),
  mc("rest_pause", "high_skill_isometrics", "forbidden", "Form collapse risk."),
  mc("cluster", "high_skill_isometrics", "allowed", "Intra-set rest preserves clean exposure."),
  mc("superset_antagonist", "high_skill_isometrics", "caution", "Only with low-cost support that does not reduce neural output."),
  mc("superset_same_muscle", "high_skill_isometrics", "forbidden", "Pre-fatigue degrades skill quality."),
  mc("skill_plus_low_cost_support", "high_skill_isometrics", "preferred", "Wrist prep / mobility / breathing between sets."),
  mc("circuit", "high_skill_isometrics", "avoid", "Conditioning chaos degrades technique."),
  mc("density_block", "high_skill_isometrics", "avoid", "Random fatigue degrades technique."),
  mc("repeat_effort_endurance", "high_skill_isometrics", "avoid", "Endurance dilutes neural output."),
  mc("emom_finisher", "high_skill_isometrics", "avoid", "Time pressure degrades technique."),
  mc("amrap_density", "high_skill_isometrics", "avoid", "Quantity over quality dilutes skill."),

  // 2. heavy_weighted_basics
  mc("straight_set", "heavy_weighted_basics", "preferred", "Quality + measurable progression."),
  mc("top_set", "heavy_weighted_basics", "preferred", "Heavy expression after ramp-up."),
  mc("back_off_set", "heavy_weighted_basics", "preferred", "Quality volume after top set."),
  mc("drop_set", "heavy_weighted_basics", "avoid", "Near-max load + drops increases injury risk."),
  mc("mechanical_drop_set", "heavy_weighted_basics", "allowed", "Loaded → bodyweight transition can be safe."),
  mc("rest_pause", "heavy_weighted_basics", "caution", "Stable patterns only; no near-max loads."),
  mc("cluster", "heavy_weighted_basics", "preferred", "Preserve rep quality at heavy loads."),
  mc("superset_antagonist", "heavy_weighted_basics", "caution", "Avoid pairing if it reduces output."),
  mc("superset_same_muscle", "heavy_weighted_basics", "forbidden", "Pre-fatigue + max load = injury risk."),
  mc("skill_plus_low_cost_support", "heavy_weighted_basics", "allowed", "Mobility/breathing between sets."),
  mc("circuit", "heavy_weighted_basics", "forbidden", "Conditioning destroys strength expression."),
  mc("density_block", "heavy_weighted_basics", "avoid", "Fatigue compromises measurable progression."),
  mc("repeat_effort_endurance", "heavy_weighted_basics", "avoid", "Endurance overrides strength target."),
  mc("emom_finisher", "heavy_weighted_basics", "avoid", "Time pressure degrades quality."),
  mc("amrap_density", "heavy_weighted_basics", "avoid", "Quality over quantity for heavy weighted basics."),

  // 3. stable_hypertrophy_accessories
  mc("straight_set", "stable_hypertrophy_accessories", "preferred", "Volume + quality balance."),
  mc("top_set", "stable_hypertrophy_accessories", "allowed", "When measurable progression is desired."),
  mc("back_off_set", "stable_hypertrophy_accessories", "preferred", "Volume after top set."),
  mc("drop_set", "stable_hypertrophy_accessories", "preferred", "Time-efficient hypertrophy."),
  mc("mechanical_drop_set", "stable_hypertrophy_accessories", "preferred", "Safer-pattern regression."),
  mc("rest_pause", "stable_hypertrophy_accessories", "preferred", "Advanced stable hypertrophy fit."),
  mc("cluster", "stable_hypertrophy_accessories", "allowed", "When rep quality at risk."),
  mc("superset_antagonist", "stable_hypertrophy_accessories", "preferred", "Time efficiency."),
  mc("superset_same_muscle", "stable_hypertrophy_accessories", "allowed", "Hypertrophy stimulus, not pre-strength."),
  mc("skill_plus_low_cost_support", "stable_hypertrophy_accessories", "allowed", "If skill is the session priority."),
  mc("circuit", "stable_hypertrophy_accessories", "allowed", "For time-efficient hypertrophy/conditioning."),
  mc("density_block", "stable_hypertrophy_accessories", "preferred", "Time-capped quality volume."),
  mc("repeat_effort_endurance", "stable_hypertrophy_accessories", "allowed", "When endurance is goal."),
  mc("emom_finisher", "stable_hypertrophy_accessories", "allowed", "Pacing-controlled volume."),
  mc("amrap_density", "stable_hypertrophy_accessories", "allowed", "Quality-capped time challenge."),

  // 4. prehab_joint_integrity
  mc("straight_set", "prehab_joint_integrity", "preferred", "Quality activation + tissue prep."),
  mc("top_set", "prehab_joint_integrity", "avoid", "Prehab is not max-effort."),
  mc("back_off_set", "prehab_joint_integrity", "avoid", "Prehab is light."),
  mc("drop_set", "prehab_joint_integrity", "forbidden", "No failure on tissue prep."),
  mc("mechanical_drop_set", "prehab_joint_integrity", "avoid", "Defeats prehab purpose."),
  mc("rest_pause", "prehab_joint_integrity", "forbidden", "No failure on tissue prep."),
  mc("cluster", "prehab_joint_integrity", "avoid", "Unnecessary fatigue."),
  mc("superset_antagonist", "prehab_joint_integrity", "preferred", "Pairs with accessories or warm-up."),
  mc("superset_same_muscle", "prehab_joint_integrity", "avoid", "Pre-fatigue defeats prehab."),
  mc("skill_plus_low_cost_support", "prehab_joint_integrity", "preferred", "Natural fit with skill primary."),
  mc("circuit", "prehab_joint_integrity", "preferred", "Low-fatigue activation flows."),
  mc("density_block", "prehab_joint_integrity", "avoid", "Prehab is quality-paced."),
  mc("repeat_effort_endurance", "prehab_joint_integrity", "avoid", "Prehab is not endurance."),
  mc("emom_finisher", "prehab_joint_integrity", "avoid", "Prehab is not time-pressured."),
  mc("amrap_density", "prehab_joint_integrity", "avoid", "Prehab is quality-paced."),

  // 5. core_compression
  mc("straight_set", "core_compression", "preferred", "Tension quality + control."),
  mc("top_set", "core_compression", "allowed", "Hold/lever progression."),
  mc("back_off_set", "core_compression", "allowed", "Volume after top hold."),
  mc("drop_set", "core_compression", "caution", "Only on stable patterns."),
  mc("mechanical_drop_set", "core_compression", "allowed", "Easier compression after harder hold."),
  mc("rest_pause", "core_compression", "caution", "Only on stable progressions."),
  mc("cluster", "core_compression", "allowed", "Quality preservation."),
  mc("superset_antagonist", "core_compression", "allowed", "Pair with non-competing pattern."),
  mc("superset_same_muscle", "core_compression", "caution", "Avoid pre-fatigue before lever skills."),
  mc("skill_plus_low_cost_support", "core_compression", "preferred", "Core supports primary lever skill."),
  mc("circuit", "core_compression", "allowed", "Core circuits common."),
  mc("density_block", "core_compression", "preferred", "Time-capped tension blocks fit."),
  mc("repeat_effort_endurance", "core_compression", "allowed", "Hold-time endurance."),
  mc("emom_finisher", "core_compression", "allowed", "Pacing-controlled core."),
  mc("amrap_density", "core_compression", "allowed", "Quality-capped time challenge."),

  // 6. military_test_calisthenics
  mc("straight_set", "military_test_calisthenics", "allowed", "Foundational quality work."),
  mc("top_set", "military_test_calisthenics", "allowed", "When strength expression is sub-goal."),
  mc("back_off_set", "military_test_calisthenics", "allowed", "Volume support."),
  mc("drop_set", "military_test_calisthenics", "avoid", "Not test-specific output."),
  mc("mechanical_drop_set", "military_test_calisthenics", "allowed", "Safer regression to maintain reps."),
  mc("rest_pause", "military_test_calisthenics", "caution", "Stable patterns only."),
  mc("cluster", "military_test_calisthenics", "preferred", "Preserve target reps under fatigue."),
  mc("superset_antagonist", "military_test_calisthenics", "allowed", "Time efficiency."),
  mc("superset_same_muscle", "military_test_calisthenics", "avoid", "Pre-fatigue degrades test output."),
  mc("skill_plus_low_cost_support", "military_test_calisthenics", "allowed", "Pacing/breathing support."),
  mc("circuit", "military_test_calisthenics", "preferred", "Event-sequence + work capacity."),
  mc("density_block", "military_test_calisthenics", "preferred", "Time-capped event prep."),
  mc("repeat_effort_endurance", "military_test_calisthenics", "preferred", "Test-event-specific output."),
  mc("emom_finisher", "military_test_calisthenics", "preferred", "Event-pacing practice."),
  mc("amrap_density", "military_test_calisthenics", "allowed", "Time-capped event simulation."),

  // 7. lower_body_strength_hypertrophy
  mc("straight_set", "lower_body_strength_hypertrophy", "preferred", "Quality + measurable progression."),
  mc("top_set", "lower_body_strength_hypertrophy", "preferred", "Strength expression after ramp."),
  mc("back_off_set", "lower_body_strength_hypertrophy", "preferred", "Volume after top set."),
  mc("drop_set", "lower_body_strength_hypertrophy", "allowed", "Stable hypertrophy accessories only (not heavy squat/DL)."),
  mc("mechanical_drop_set", "lower_body_strength_hypertrophy", "allowed", "Loaded→unloaded path can work."),
  mc("rest_pause", "lower_body_strength_hypertrophy", "caution", "Stable patterns only; no max load."),
  mc("cluster", "lower_body_strength_hypertrophy", "allowed", "Quality preservation under load."),
  mc("superset_antagonist", "lower_body_strength_hypertrophy", "allowed", "With non-competing upper or core."),
  mc("superset_same_muscle", "lower_body_strength_hypertrophy", "caution", "Hypertrophy accessory only."),
  mc("skill_plus_low_cost_support", "lower_body_strength_hypertrophy", "allowed", "Mobility/breathing between sets."),
  mc("circuit", "lower_body_strength_hypertrophy", "allowed", "Conditioning/accessory only."),
  mc("density_block", "lower_body_strength_hypertrophy", "caution", "Avoid pre-priority skill if minimal-leg pref selected."),
  mc("repeat_effort_endurance", "lower_body_strength_hypertrophy", "allowed", "Run/ruck/carry endurance fits."),
  mc("emom_finisher", "lower_body_strength_hypertrophy", "allowed", "Pacing-controlled volume."),
  mc("amrap_density", "lower_body_strength_hypertrophy", "allowed", "Quality-capped time challenge."),

  // 8. flexibility_mobility
  mc("straight_set", "flexibility_mobility", "preferred", "Goal-specific holds."),
  mc("top_set", "flexibility_mobility", "avoid", "Flexibility is not max-load."),
  mc("back_off_set", "flexibility_mobility", "avoid", "Flexibility is hold-based."),
  mc("drop_set", "flexibility_mobility", "forbidden", "No load drop in flex."),
  mc("mechanical_drop_set", "flexibility_mobility", "forbidden", "No load drop in flex."),
  mc("rest_pause", "flexibility_mobility", "forbidden", "Flex holds use breath, not failure."),
  mc("cluster", "flexibility_mobility", "preferred", "User-authored 3×15s short-round protocol fits cluster pattern (Batch 9 verified)."),
  mc("superset_antagonist", "flexibility_mobility", "allowed", "Pair with low-cost support."),
  mc("superset_same_muscle", "flexibility_mobility", "avoid", "Pre-fatigue defeats range work."),
  mc("skill_plus_low_cost_support", "flexibility_mobility", "preferred", "Wrist/shoulder prep + skill."),
  mc("circuit", "flexibility_mobility", "allowed", "Mobility flow circuits fit."),
  mc("density_block", "flexibility_mobility", "avoid", "Flex is quality-paced."),
  mc("repeat_effort_endurance", "flexibility_mobility", "avoid", "Flex is not endurance."),
  mc("emom_finisher", "flexibility_mobility", "avoid", "Flex is not time-pressured fatigue."),
  mc("amrap_density", "flexibility_mobility", "avoid", "Flex is quality-paced."),
] as const

// =====================================================================
// EXPORTS — aggregator-facing API (parity with Batch 1-9)
// =====================================================================

export function getBatch10ContraindicationRules(): unknown[] {
  return []
}

export function getBatch10Sources(): DoctrineSource[] {
  return BATCH_10_SOURCES
}
export function getBatch10Principles(): DoctrinePrinciple[] {
  return BATCH_10_PRINCIPLES
}
export function getBatch10ProgressionRules(): ProgressionRule[] {
  return BATCH_10_PROGRESSION
}
export function getBatch10MethodRules(): MethodRule[] {
  return BATCH_10_METHOD
}
export function getBatch10PrescriptionRules(): PrescriptionRule[] {
  return BATCH_10_PRESCRIPTION
}
export function getBatch10ExerciseSelectionRules(): ExerciseSelectionRule[] {
  return BATCH_10_SELECTION
}
export function getBatch10CarryoverRules(): CarryoverRule[] {
  return BATCH_10_CARRYOVER
}

export function getBatch10Counts() {
  return {
    sources: BATCH_10_SOURCES.length,
    principles: BATCH_10_PRINCIPLES.length,
    progression: BATCH_10_PROGRESSION.length,
    method: BATCH_10_METHOD.length,
    prescription: BATCH_10_PRESCRIPTION.length,
    selection: BATCH_10_SELECTION.length,
    carryover: BATCH_10_CARRYOVER.length,
    total:
      BATCH_10_PRINCIPLES.length +
      BATCH_10_PROGRESSION.length +
      BATCH_10_METHOD.length +
      BATCH_10_PRESCRIPTION.length +
      BATCH_10_SELECTION.length +
      BATCH_10_CARRYOVER.length,
    methodCompatibilityEntries: METHOD_COMPATIBILITY_MATRIX.length,
  }
}

export function getBatch10CountsBySource(): Record<string, number> {
  const all = [
    ...BATCH_10_PRINCIPLES,
    ...BATCH_10_PROGRESSION,
    ...BATCH_10_METHOD,
    ...BATCH_10_PRESCRIPTION,
    ...BATCH_10_SELECTION,
    ...BATCH_10_CARRYOVER,
  ] as Array<{ source_id?: string }>
  const out: Record<string, number> = {}
  for (const r of all) {
    const sid = r.source_id ?? "unknown"
    out[sid] = (out[sid] ?? 0) + 1
  }
  return out
}

export function getBatch10ProvenanceFor(
  atomId: string,
): { batch: "batch_10"; sourceId: string | null } | null {
  const all: Array<{ id?: string; source_id?: string }> = [
    ...BATCH_10_PRINCIPLES,
    ...BATCH_10_PROGRESSION,
    ...BATCH_10_METHOD,
    ...BATCH_10_PRESCRIPTION,
    ...BATCH_10_SELECTION,
    ...BATCH_10_CARRYOVER,
  ]
  const hit = all.find((r) => r.id === atomId)
  if (!hit) return null
  return { batch: "batch_10", sourceId: hit.source_id ?? null }
}

export type Batch10Provenance = { batch: "batch_10"; sourceId: string | null }
