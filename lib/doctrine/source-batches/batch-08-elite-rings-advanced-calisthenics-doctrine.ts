/**
 * DOCTRINE — BATCH 08 — ELITE RINGS + ADVANCED CALISTHENICS GAP-FILL
 *
 * Pure source-data file. Mirrors Batch 1/2/3/4/5/6/7 layout exactly so the
 * runtime contract, builder, save/load, and Program UI stay untouched.
 *
 * Sources (9):
 *   1. FIG MAG Code of Points — Rings Element Classification     — FCP
 *   2. FIG Named Elements (Men's Gymnastics)                     — FNE
 *   3. Advanced Isometrics Programming (public coaching corpus)  — OGI
 *   4. Iron Cross / Ring Pulling Doctrine (public corpus)        — OGC
 *   5. FitnessFAQs FL/Planche/Row/Push-Up Advanced (public)      — FFA
 *   6. GymnasticBodies-style Historical Strength (public)        — GBH
 *   7. Elite Ring Skill Source Gap (governance)                  — ESG
 *   8. Advanced Carryover Mapping (synthesis)                    — ACM
 *   9. Advanced Onboarding Guardrails (synthesis)                — AOG
 *
 * Atom target: >=180. Distribution by source group:
 *   FCP=18, FNE=12, OGI=28, OGC=20, FFA=34, GBH=14, ESG=18, ACM=34, AOG=16.
 *   Total = 194.
 *
 * LEGAL-SOURCE RULE
 * -----------------
 * No leaked, pirated, or unauthorized paid PDF was ingested. Atoms in OGI/OGC/
 * FFA/GBH families are paraphrased from publicly accessible articles, videos,
 * and free-tier creator content; no paid book contents were transcribed. Where
 * direct elite programming detail would require paid material, the atom is
 * either marked sourceConfidence="medium" / "gap" or routed through the ESG
 * source-gap honesty source. FIG Code of Points and FIG Named Elements are
 * official public gymnastics documents (sourceConfidence="official").
 *
 * NO INVENTED ELITE PROGRAMMING
 * -----------------------------
 * Existing project code (lib/advanced-skill-progression-graphs.ts,
 * lib/advanced-skills-integration.ts, lib/explanation-resolver.ts) already
 * contains victorian/maltese/iron_cross/azarian-adjacent stage stubs. Batch 8
 * does NOT validate or duplicate those graph stubs — it acts as the truth
 * classification layer that distinguishes:
 *   DIRECT_SOURCE_BACKED  — direct programming permitted when readiness met
 *   CARRYOVER_SUPPORTED_ONLY — only prerequisite/carryover paths permitted
 *   SOURCE_GAP_UNSUPPORTED — long-term goal only, no direct prescription
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
// ADVANCED-SKILL VOCABULARY — exported for future onboarding/profile UI
// =============================================================================
// These unions are the canonical centralized advanced-skill vocabulary. Future
// onboarding (advanced optional layer) will adopt them. Until then, doctrine
// atoms reference these literal values so the builder will read them safely
// once the profile fields land.

export type AdvancedSkillKey =
  | "victorian"
  | "maltese"
  | "one_arm_front_lever"
  | "one_arm_back_lever"
  | "front_lever_row_advanced"
  | "one_arm_front_lever_row"
  | "planche_push_up_advanced"
  | "full_planche_push_up"
  | "press_to_planche"
  | "azarian"
  | "nakayama"
  | "archer_pull_pathway"
  | "archer_push_pathway"
  | "rings_transition_strength"

export type AdvancedSkillFamily =
  | "elite_rings"
  | "advanced_front_lever"
  | "advanced_back_lever"
  | "advanced_planche"
  | "advanced_archer"
  | "ring_transition"

export type AdvancedSkillSupportLevel =
  | "DIRECT_SOURCE_BACKED"
  | "CARRYOVER_SUPPORTED_ONLY"
  | "SOURCE_GAP_UNSUPPORTED"

export type AdvancedSourceConfidence = "official" | "high" | "medium" | "gap"

export type DoctrineStrength = "none" | "weak" | "moderate" | "strong"

export type ContraindicationLevel = "normal" | "high" | "elite_only"

// Re-export Batch 6's source-legality status for parity.
import type { SourceLegalityStatus } from "./batch-06-uploaded-pdf-doctrine"
export type { SourceLegalityStatus }

// =============================================================================
// SOURCES
// =============================================================================
export const BATCH_08_SOURCES: DoctrineSource[] = [
  { id: "src_batch_08_fig_code_of_points_rings",     source_key: "fig_mag_code_of_points_rings_batch_08",            title: "FIG MAG Code of Points - Rings Element Classification",     confidence_tier: "official", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_08_fig_named_elements_mag",       source_key: "fig_named_elements_mens_gymnastics_batch_08",      title: "FIG Named Elements (Men's Gymnastics)",                     confidence_tier: "official", is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_08_advanced_isometrics_corpus",   source_key: "overcoming_gravity_advanced_isometrics_batch_08",  title: "Advanced Isometrics Programming (public coaching corpus)",  confidence_tier: "high",     is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_08_iron_cross_corpus",            source_key: "overcoming_gravity_iron_cross_batch_08",           title: "Iron Cross / Ring Pulling Doctrine (public corpus)",        confidence_tier: "high",     is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_08_fitnessfaqs_advanced",         source_key: "fitnessfaqs_front_lever_planche_advanced_batch_08", title: "FitnessFAQs FL/Planche/Row/Push-Up Advanced (public)",     confidence_tier: "high",     is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_08_gymnasticbodies_historical",   source_key: "gymnasticbodies_historical_strength_batch_08",     title: "GymnasticBodies-style Historical Strength (public)",        confidence_tier: "medium",   is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_08_elite_ring_source_gap",        source_key: "elite_ring_skill_source_gap_batch_08",             title: "Elite Ring Skill Source Gap (governance)",                  confidence_tier: "high",     is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_08_advanced_carryover_mapping",   source_key: "advanced_carryover_mapping_batch_08",              title: "Advanced Carryover Mapping (synthesis)",                    confidence_tier: "high",     is_active: true } as unknown as DoctrineSource,
  { id: "src_batch_08_advanced_onboarding_guards",   source_key: "advanced_onboarding_guardrails_batch_08",          title: "Advanced Onboarding Guardrails (synthesis)",                confidence_tier: "high",     is_active: true } as unknown as DoctrineSource,
]

const FCP = "src_batch_08_fig_code_of_points_rings"
const FNE = "src_batch_08_fig_named_elements_mag"
const OGI = "src_batch_08_advanced_isometrics_corpus"
const OGC = "src_batch_08_iron_cross_corpus"
const FFA = "src_batch_08_fitnessfaqs_advanced"
const GBH = "src_batch_08_gymnasticbodies_historical"
const ESG = "src_batch_08_elite_ring_source_gap"
const ACM = "src_batch_08_advanced_carryover_mapping"
const AOG = "src_batch_08_advanced_onboarding_guards"

const COMMON_TAGS = {
  provenance: "derived_from_public_creator_content_and_original_synthesis",
  evidence_snippet: null,
  sourceLegalityStatus: "official_free_creator_published" as SourceLegalityStatus,
}

const BATCH_08_PRINCIPLES: DoctrinePrinciple[] = []
const BATCH_08_PROGRESSION: ProgressionRule[] = []
const BATCH_08_METHOD: MethodRule[] = []
const BATCH_08_PRESCRIPTION: PrescriptionRule[] = []
const BATCH_08_SELECTION: ExerciseSelectionRule[] = []
const BATCH_08_CARRYOVER: CarryoverRule[] = []

let _n = 0
const nid = (pfx: string) => `${pfx}_b08_${String(++_n).padStart(3, "0")}`

type AddP = { src: string; fam: string; key: string; title: string; sum: string; w?: number; t?: "hard_constraint" | "soft_preference" | "recommendation"; ev: string; conf?: AdvancedSourceConfidence; supportLevel?: AdvancedSkillSupportLevel; skillKeys?: AdvancedSkillKey[] }
function p(a: AddP) {
  BATCH_08_PRINCIPLES.push({ id: nid("pr"), source_id: a.src, doctrine_family: a.fam, principle_key: a.key, principle_title: a.title, principle_summary: a.sum, safety_priority: a.w ?? 1, priority_type: a.t ?? "soft_preference", is_base_intelligence: true, is_phase_modulation: false, applies_when_json: {}, does_not_apply_when_json: {}, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev, sourceConfidence: a.conf ?? "high", supportLevel: a.supportLevel ?? null, skillKeys: a.skillKeys ?? [], inventingAllowed: false } } as unknown as DoctrinePrinciple)
}
type AddR = { src: string; fam: string; key: string; applies: Record<string, unknown>; rule: Record<string, unknown>; ev: string; t?: "hard_constraint" | "soft_preference" | "recommendation"; conf?: AdvancedSourceConfidence; supportLevel?: AdvancedSkillSupportLevel; skillKeys?: AdvancedSkillKey[] }
function progr(a: AddR) { BATCH_08_PROGRESSION.push({ id: nid("prog"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev, sourceConfidence: a.conf ?? "high", supportLevel: a.supportLevel ?? null, skillKeys: a.skillKeys ?? [], inventingAllowed: false } } as unknown as ProgressionRule) }
function meth(a: AddR) { BATCH_08_METHOD.push({ id: nid("meth"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev, sourceConfidence: a.conf ?? "high", supportLevel: a.supportLevel ?? null, skillKeys: a.skillKeys ?? [], inventingAllowed: false } } as unknown as MethodRule) }
function rx(a: AddR) { BATCH_08_PRESCRIPTION.push({ id: nid("rx"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev, sourceConfidence: a.conf ?? "high", supportLevel: a.supportLevel ?? null, skillKeys: a.skillKeys ?? [], inventingAllowed: false } } as unknown as PrescriptionRule) }
function sel(a: AddR) { BATCH_08_SELECTION.push({ id: nid("sel"), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? "soft_preference", tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev, sourceConfidence: a.conf ?? "high", supportLevel: a.supportLevel ?? null, skillKeys: a.skillKeys ?? [], inventingAllowed: false } } as unknown as ExerciseSelectionRule) }
type AddC = { src: string; fam: string; sourceKey: string; targetSkill: string; type: string; strength: number; ev: string; conf?: AdvancedSourceConfidence; supportLevel?: AdvancedSkillSupportLevel }
function carry(a: AddC) { BATCH_08_CARRYOVER.push({ id: nid("carry"), source_id: a.src, doctrine_family: a.fam, source_exercise_or_skill_key: a.sourceKey, target_skill_key: a.targetSkill, carryover_type: a.type, carryover_strength: a.strength, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev, sourceConfidence: a.conf ?? "high", supportLevel: a.supportLevel ?? null, inventingAllowed: false } } as unknown as CarryoverRule) }

// =====================================================================
// 1. FIG CODE OF POINTS — RINGS (FCP) — 18 atoms
// =====================================================================
// Official classification source. Confirms what skills exist and how they
// are classified. Does NOT create direct programming.
p({ src: FCP, fam: "fig_classification", key: "fcp_official_classification_principle", title: "FIG Code of Points classifies, does not prescribe", sum: "Official rings element classification confirms a skill exists and its difficulty group, but classification alone does not authorize direct training prescription.", w: 2, t: "hard_constraint", ev: "Official classification confirmed; direct programming requires coaching source support", conf: "official" })
p({ src: FCP, fam: "fig_classification", key: "fcp_two_second_hold_standard", title: "Held strength elements require 2-second control", sum: "FIG MAG strength holds (cross, planche, maltese, etc.) require a controlled 2-second presentation in competition; sub-2-second is not the same skill.", w: 1, ev: "Official classification confirmed; direct programming requires coaching source support", conf: "official" })
p({ src: FCP, fam: "fig_classification", key: "fcp_strength_vs_swing_distinction", title: "Strength and swing elements are not interchangeable", sum: "FIG distinguishes static strength holds, swinging-to-static transitions, and pure swing skills; carryover differs by element type.", w: 1, ev: "Official classification confirmed; direct programming requires coaching source support", conf: "official" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_classification_truth", applies: { skill: { in: ["iron_cross", "maltese", "victorian", "azarian", "nakayama"] } }, rule: { officialElement: true, classificationDoesNotEqualPrescription: true }, ev: "Official classification confirmed; direct programming requires coaching source support", conf: "official", t: "hard_constraint" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_iron_cross_classification", applies: { skill: "iron_cross" }, rule: { officialGroup: "static_hold", competitionStandardSec: 2, supportLevel: "DIRECT_SOURCE_BACKED" }, ev: "Iron cross classified as static hold; direct programming source-backed", conf: "official", supportLevel: "DIRECT_SOURCE_BACKED" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_maltese_classification", applies: { skill: "maltese" }, rule: { officialGroup: "static_hold", competitionStandardSec: 2, supportLevel: "CARRYOVER_SUPPORTED_ONLY" }, ev: "Maltese classified as elite static hold; carryover-only without coach source", conf: "official", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["maltese"] })
meth({ src: FCP, fam: "fig_classification", key: "fcp_victorian_classification", applies: { skill: "victorian" }, rule: { officialGroup: "static_hold", competitionStandardSec: 2, supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Victorian classified as elite static hold; direct programming unsupported", conf: "official", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["victorian"] })
meth({ src: FCP, fam: "fig_classification", key: "fcp_azarian_classification", applies: { skill: "azarian" }, rule: { officialGroup: "swing_to_static_or_strength_transition", supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Azarian classified as elite rings transition", conf: "official", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["azarian"] })
meth({ src: FCP, fam: "fig_classification", key: "fcp_nakayama_classification", applies: { skill: "nakayama" }, rule: { officialGroup: "swing_to_static_or_strength_transition", supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Nakayama classified as elite rings transition", conf: "official", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["nakayama"] })
meth({ src: FCP, fam: "fig_classification", key: "fcp_planche_classification", applies: { skill: "planche" }, rule: { officialGroup: "static_hold", competitionStandardSec: 2, supportLevel: "DIRECT_SOURCE_BACKED" }, ev: "Planche classified as static hold; direct programming source-backed", conf: "official" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_front_lever_classification", applies: { skill: "front_lever" }, rule: { officialGroup: "static_hold", competitionStandardSec: 2, supportLevel: "DIRECT_SOURCE_BACKED" }, ev: "Front lever classified as static hold; direct programming source-backed", conf: "official" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_back_lever_classification", applies: { skill: "back_lever" }, rule: { officialGroup: "static_hold", competitionStandardSec: 2, supportLevel: "DIRECT_SOURCE_BACKED" }, ev: "Back lever classified as static hold; direct programming source-backed", conf: "official" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_unilateral_holds_not_competition_standard", applies: { skill: { in: ["one_arm_front_lever", "one_arm_back_lever"] } }, rule: { officialGymnasticsCompetitionStandard: false, calisthenicsCommunityElement: true }, ev: "Unilateral lever holds are calisthenics-community elements, not FIG competition standards", conf: "official", supportLevel: "CARRYOVER_SUPPORTED_ONLY" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_competition_strength_grouping", applies: { sessionContext: "elite_rings_classification" }, rule: { groups: { static_holds: ["iron_cross", "maltese", "victorian", "planche", "front_lever", "back_lever"], transitions: ["azarian", "nakayama", "li_donghua", "balandin", "yamawaki"] } }, ev: "Official competition grouping recorded for downstream classification", conf: "official" })
p({ src: FCP, fam: "fig_classification", key: "fcp_classification_safety_context", title: "FIG difficulty group implies tendon stress class", sum: "Higher difficulty groups (D, E, F, G) on rings imply higher connective-tissue and shoulder loading; classification should inform recovery spacing even when used only as classification.", w: 1, ev: "Official classification confirmed; direct programming requires coaching source support", conf: "official" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_classification_no_direct_prescription", applies: { onlySource: "fig_classification" }, rule: { directProgrammingFromClassificationAlone: false }, ev: "Classification alone is insufficient to prescribe direct elite skill training", conf: "official", t: "hard_constraint" })
p({ src: FCP, fam: "fig_classification", key: "fcp_named_element_recognition", title: "Named elements signal legitimacy, not method", sum: "Recognizing a named element confirms it exists in the official body of gymnastics, but says nothing about how to train toward it safely.", w: 1, ev: "Official classification confirmed; direct programming requires coaching source support", conf: "official" })
meth({ src: FCP, fam: "fig_classification", key: "fcp_audit_visibility", applies: { audit: true }, rule: { exposeClassificationStatusToAudit: true, exposeSupportLevelToAudit: true }, ev: "Advanced doctrine support status available for audit", conf: "official" })

// =====================================================================
// 2. FIG NAMED ELEMENTS (FNE) — 12 atoms
// =====================================================================
// Confirms named elite transitions exist; does not prescribe how to train them.
p({ src: FNE, fam: "fig_named_elements", key: "fne_named_element_principle", title: "Named elements confirm existence, not method", sum: "Skills attributed to named gymnasts (Azarian, Nakayama, Yamawaki, etc.) are recognized elements, but recognition is not training prescription.", w: 1, ev: "Azarian classified as elite rings transition", conf: "official" })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_azarian_attribution", applies: { skill: "azarian" }, rule: { namedAfter: "Albert Azarian", elementType: "rings_transition_to_or_through_cross", supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Azarian classified as elite rings transition", conf: "official", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["azarian"] })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_nakayama_attribution", applies: { skill: "nakayama" }, rule: { namedAfter: "Akinori Nakayama", elementType: "rings_strength_transition", supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Nakayama classified as elite rings transition", conf: "official", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["nakayama"] })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_yamawaki_classification", applies: { skill: "yamawaki" }, rule: { namedAfter: "Hiroshi Yamawaki", elementType: "rings_swing_transition", supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Yamawaki classified as elite rings transition", conf: "official" })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_balandin_classification", applies: { skill: "balandin" }, rule: { elementType: "rings_swing_to_handstand", supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Balandin classified as elite rings transition", conf: "official" })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_li_donghua_classification", applies: { skill: "li_donghua" }, rule: { elementType: "rings_strength_transition", supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Li Donghua classified as elite rings transition", conf: "official" })
p({ src: FNE, fam: "fig_named_elements", key: "fne_attribution_does_not_imply_method", title: "Athlete attribution does not imply training method", sum: "Knowing a skill is named after an athlete does not mean we know how that athlete trained it; method requires coaching/source material.", w: 1, ev: "Direct doctrine gap detected; using prerequisite/carryover only", conf: "official" })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_transition_class_marker", applies: { skill: { in: ["azarian", "nakayama", "yamawaki", "balandin", "li_donghua"] } }, rule: { transitionClass: "elite", recoverySpacingClass: "elite" }, ev: "Ring transition gated by cross/support readiness", conf: "official" })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_uses_iron_cross_pathway", applies: { skill: { in: ["azarian", "nakayama"] } }, rule: { sharedFoundation: "iron_cross_strength_and_ring_pulling" }, ev: "Ring transition gated by cross/support readiness", conf: "official", skillKeys: ["azarian", "nakayama"] })
p({ src: FNE, fam: "fig_named_elements", key: "fne_carryover_legitimacy", title: "Foundational carryover is legitimate even when direct method is unknown", sum: "When direct method is unknown, prerequisite carryover (cross strength, lever strength, ring pulling) is still a legitimate path to long-term readiness without inventing technique.", w: 1, ev: "Advanced skill represented through prerequisite carryover, not direct prescription", conf: "high" })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_no_method_invention", applies: { skill: { in: ["azarian", "nakayama", "yamawaki", "balandin", "li_donghua"] } }, rule: { inventingProgressionsBeyondClassification: false }, ev: "Direct doctrine gap detected; using prerequisite/carryover only", conf: "official", t: "hard_constraint" })
meth({ src: FNE, fam: "fig_named_elements", key: "fne_audit_named_element_visibility", applies: { audit: true }, rule: { exposeNamedElementStatusToAudit: true }, ev: "Advanced doctrine support status available for audit", conf: "official" })

// =====================================================================
// 3. ADVANCED ISOMETRICS PROGRAMMING (OGI) — 28 atoms
// =====================================================================
// Public coaching-corpus paraphrase: weakness identification, plateau
// management, exercise category separation, dose control. No paid book copy.
p({ src: OGI, fam: "advanced_isometrics", key: "ogi_weakness_first_principle", title: "Identify the weakest link before adding volume", sum: "Advanced isometric progress stalls when volume is added before weakness identification; address the limiting factor (mobility, scapular control, straight-arm tendons, leverage) first.", w: 2, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
p({ src: OGI, fam: "advanced_isometrics", key: "ogi_category_separation_principle", title: "Separate hold work, leverage work, and dynamic work", sum: "Conflating max-hold attempts, leverage progression, and dynamic skill reps causes false plateaus; each category needs its own dose.", w: 1, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
p({ src: OGI, fam: "advanced_isometrics", key: "ogi_max_hold_versus_volume", title: "Max-hold attempts and volume holds are different stimuli", sum: "Max-hold attempts test skill at near-maximum leverage; volume holds build capacity at sub-maximum leverage. Programming must distinguish them.", w: 1, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
p({ src: OGI, fam: "advanced_isometrics", key: "ogi_tendon_adaptation_lag", title: "Tendons adapt slower than muscle in advanced isometrics", sum: "Connective tissue adaptation lags muscle adaptation by weeks to months; advanced isometric progressions must respect that lag or risk overuse injury.", w: 2, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
p({ src: OGI, fam: "advanced_isometrics", key: "ogi_leverage_progression_principle", title: "Progress leverage incrementally, not in big jumps", sum: "Leverage progressions (tuck -> advanced tuck -> straddle -> half-lay -> full) advance only when sub-maximum holds are clean at the current leverage.", w: 1, ev: "Front lever row progression matched lever strength", conf: "high" })
progr({ src: OGI, fam: "advanced_isometrics", key: "ogi_hold_volume_progression", applies: { rep: { in: ["isometric", "lever_hold"] } }, rule: { weeklyTotalHoldSecondsCap: { intermediate: 60, advanced: 120, elite: 180 }, weeklyIncreaseMaxPct: 10, deloadEvery4to6Weeks: true }, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
progr({ src: OGI, fam: "advanced_isometrics", key: "ogi_leverage_step_gate", applies: { rep: "leverage_step_attempt" }, rule: { gate: { previousLeverageCleanHoldSec: 10, twoSessionsConfirmation: true } }, ev: "Front lever row progression matched lever strength", conf: "high" })
progr({ src: OGI, fam: "advanced_isometrics", key: "ogi_max_attempt_frequency_cap", applies: { rep: "max_hold_attempt" }, rule: { perWeekMax: 1, perMonthMaxIfTendonSensitive: 2 }, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
progr({ src: OGI, fam: "advanced_isometrics", key: "ogi_no_consecutive_high_intensity_days", applies: { rep: "isometric", intensity: "high" }, rule: { backToBackHardDays: false }, ev: "Elite straight-arm stress protected by recovery spacing", conf: "high", t: "hard_constraint" })
progr({ src: OGI, fam: "advanced_isometrics", key: "ogi_plateau_diagnosis_protocol", applies: { stalled: { weeks: { gte: 4 } } }, rule: { steps: ["audit_volume", "audit_leverage_progression", "audit_recovery", "consider_short_deload", "consider_alternative_leverage"] }, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
meth({ src: OGI, fam: "advanced_isometrics", key: "ogi_two_second_clean_standard", applies: { holdQuality: "competition_or_skill_check" }, rule: { mustHaveCleanHoldSec: 2, scoringFromCleanHoldOnly: true }, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
meth({ src: OGI, fam: "advanced_isometrics", key: "ogi_form_first_progression", applies: { holdQuality: "form_break_detected" }, rule: { regressOneLeverageStep: true, holdLastCleanLeverageForBlock: { weeks: [2, 4] } }, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
meth({ src: OGI, fam: "advanced_isometrics", key: "ogi_warmup_skill_specific", applies: { sessionContext: "advanced_isometric_session" }, rule: { warmupMin: 12, includes: ["wrist_prep", "scapular_prep", "shoulder_prep", "submaximal_lever_buildup"] }, ev: "Elite straight-arm stress protected by recovery spacing", conf: "high" })
meth({ src: OGI, fam: "advanced_isometrics", key: "ogi_recovery_spacing", applies: { sessionTopic: "advanced_isometric" }, rule: { restBetweenAdvancedSkillSessionsHours: { min: 48 } }, ev: "Elite straight-arm stress protected by recovery spacing", conf: "high" })
meth({ src: OGI, fam: "advanced_isometrics", key: "ogi_no_stack_high_load", applies: { sessionTopic: { includesAll: ["planche", "front_lever", "iron_cross"] } }, rule: { stackThreeHighLoadInOneDay: false }, ev: "Elite straight-arm stress protected by recovery spacing", conf: "high", t: "hard_constraint" })
meth({ src: OGI, fam: "advanced_isometrics", key: "ogi_pain_stop", applies: { athleteContext: { connectiveTissuePain: true } }, rule: { reduceIsometricVolumePct: 50, switchToBandAssistedOrShorterLeverage: true, considerOneToTwoWeekDeload: true }, ev: "Connective tissue adaptation controls progression speed", conf: "high", t: "hard_constraint" })
rx({ src: OGI, fam: "advanced_isometrics", key: "ogi_session_dose_template", applies: { sessionTopic: "advanced_isometric" }, rule: { setsPerSkill: [3, 6], holdSecPerSet: [4, 12], intersetRestSec: [120, 240], skillsPerSession: [1, 2] }, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
rx({ src: OGI, fam: "advanced_isometrics", key: "ogi_weekly_skill_frequency", applies: { sessionTopic: "advanced_isometric" }, rule: { perSkillSessionsPerWeek: [2, 3], hardSessionsPerWeek: [1, 2] }, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
sel({ src: OGI, fam: "advanced_isometrics", key: "ogi_leverage_pool", applies: { skill: { in: ["planche", "front_lever", "back_lever"] } }, rule: { include: ["tuck_hold", "advanced_tuck_hold", "straddle_hold", "half_lay_hold", "full_hold"] }, ev: "Front lever row progression matched lever strength", conf: "high" })
sel({ src: OGI, fam: "advanced_isometrics", key: "ogi_assistance_pool", applies: { skill: { in: ["maltese", "victorian", "iron_cross"] } }, rule: { include: ["band_assistance_heavy", "band_assistance_light", "spotter_assistance", "partial_rom_negative"] }, ev: "Maltese prepared through planche/cross/back-lever carryover", conf: "high" })
carry({ src: OGI, fam: "advanced_isometrics", sourceKey: "tuck_planche_hold", targetSkill: "planche", type: "direct", strength: 0.85, ev: "Tuck planche hold supports planche progression", conf: "high" })
carry({ src: OGI, fam: "advanced_isometrics", sourceKey: "advanced_tuck_front_lever_hold", targetSkill: "front_lever", type: "direct", strength: 0.85, ev: "Advanced tuck front lever hold supports front lever progression", conf: "high" })
carry({ src: OGI, fam: "advanced_isometrics", sourceKey: "straddle_back_lever_hold", targetSkill: "back_lever", type: "direct", strength: 0.85, ev: "Straddle back lever hold supports back lever progression", conf: "high" })
carry({ src: OGI, fam: "advanced_isometrics", sourceKey: "band_assisted_iron_cross_hold", targetSkill: "iron_cross", type: "direct", strength: 0.7, ev: "Band-assisted iron cross supports cross strength", conf: "high" })
p({ src: OGI, fam: "advanced_isometrics", key: "ogi_no_invented_progressions", title: "Do not invent progressions beyond the public coaching corpus", sum: "When public material does not describe a specific progression for an elite skill, the doctrine refuses to invent one and routes through carryover or source-gap labels.", w: 2, ev: "Direct doctrine gap detected; using prerequisite/carryover only", conf: "high", t: "hard_constraint" })
meth({ src: OGI, fam: "advanced_isometrics", key: "ogi_audit_visibility", applies: { audit: true }, rule: { exposeIsometricDoseToAudit: true }, ev: "Advanced doctrine support status available for audit", conf: "high" })
meth({ src: OGI, fam: "advanced_isometrics", key: "ogi_periodization_block_principle", applies: { sessionTopic: "advanced_isometric" }, rule: { blockWeeks: [4, 8], blockFocus: { primarySkill: 1, secondaryCarryover: { count: [1, 2] } } }, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
p({ src: OGI, fam: "advanced_isometrics", key: "ogi_direct_priority_when_safe", title: "Direct skill work first when readiness is met", sum: "When direct doctrine is strong and readiness is met, direct skill work should come before generic accessories in the session order.", w: 1, ev: "Direct advanced skill work prioritized when safe", conf: "high" })

// =====================================================================
// 4. IRON CROSS / RING PULLING DOCTRINE (OGC) — 20 atoms
// =====================================================================
p({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_cross_high_risk_principle", title: "Iron cross is high tendon-load and high biceps stress", sum: "Cross loading concentrates torque at the biceps tendon and elbow; progression must respect biceps tendon adaptation.", w: 2, ev: "Connective tissue adaptation controls progression speed", conf: "high" })
p({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_band_progression_principle", title: "Band-assisted progression is the primary cross path", sum: "The standard public path is heavy-band assistance -> medium -> light -> assisted negatives -> partial -> full, with months between meaningful jumps.", w: 1, ev: "Iron cross prepared through band/negative progression", conf: "high" })
p({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_ring_pulling_distinct_from_general_pulling", title: "Ring pulling differs from bar pulling", sum: "Cross-relevant pulling is straight-arm/short-arc rings work, not generic bar pull-ups; mistaking the two delays cross progression.", w: 1, ev: "Ring transition gated by cross/support readiness", conf: "high" })
progr({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_band_step_gate", applies: { rep: "iron_cross_band_step" }, rule: { gate: { currentBandHoldSec: 10, twoSessionsConfirmation: true, noElbowOrBicepsPain: true } }, ev: "Iron cross prepared through band/negative progression", conf: "high" })
progr({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_negative_introduction_gate", applies: { rep: "iron_cross_negative" }, rule: { prerequisiteBandHoldSec: 10, prerequisiteRingSupportHoldSec: 30 }, ev: "Iron cross prepared through band/negative progression", conf: "high" })
progr({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_partial_rom_progression", applies: { rep: "iron_cross_partial_rom" }, rule: { partialDepthDeg: { min: 30, max: 60 }, increaseDepthOnlyWithCleanForm: true }, ev: "Iron cross prepared through band/negative progression", conf: "high" })
progr({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_full_attempt_gate", applies: { rep: "iron_cross_full_attempt" }, rule: { prerequisiteLightBandHoldSec: 10, prerequisiteCleanNegativeReps: 5, noElbowOrBicepsPainPriorWeeks: 4 }, ev: "Iron cross prepared through band/negative progression", conf: "high" })
meth({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_elbow_lock_form", applies: { rep: { in: ["iron_cross_band", "iron_cross_negative", "iron_cross_partial_rom", "iron_cross_full_attempt"] } }, rule: { elbowFullyLockedRequired: true, scapularDepressionRequired: true, ringTurnoutRequired: true }, ev: "Iron cross prepared through band/negative progression", conf: "high", t: "hard_constraint" })
meth({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_pain_stop", applies: { athleteContext: { elbowOrBicepsPain: true } }, rule: { stopCrossProgression: true, regressToRingSupportPlusBandHold: true, considerTwoToFourWeekDeload: true }, ev: "Connective tissue adaptation controls progression speed", conf: "high", t: "hard_constraint" })
meth({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_warmup_specific", applies: { sessionContext: "iron_cross_session" }, rule: { warmupMin: 15, includes: ["wrist_prep", "biceps_tendon_prep", "scapular_prep", "ring_turnout_prep", "submax_band_buildup"] }, ev: "Iron cross prepared through band/negative progression", conf: "high" })
rx({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_session_dose", applies: { sessionTopic: "iron_cross" }, rule: { setsPerSession: [3, 5], holdSecPerSet: [4, 10], intersetRestSec: [180, 300], sessionsPerWeek: [1, 2] }, ev: "Iron cross prepared through band/negative progression", conf: "high" })
rx({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_pulling_carryover_dose", applies: { sessionTopic: "iron_cross_carryover" }, rule: { ringSupportHoldsPerWeek: [2, 4], scapularPullsPerWeek: [2, 3], biceps_tendon_eccentrics_per_week: [1, 2] }, ev: "Iron cross prepared through band/negative progression", conf: "high" })
sel({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_carryover_pool", applies: { skill: "iron_cross" }, rule: { include: ["ring_support_hold", "band_iron_cross_hold", "iron_cross_negative", "ring_pull_to_inverted", "supinated_eccentric_chinup", "scapular_depression_drill"] }, ev: "Iron cross prepared through band/negative progression", conf: "high" })
sel({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_no_substitute_pool", applies: { skill: "iron_cross" }, rule: { exclude: ["lat_pulldown_machine", "cable_pullover_only"] }, ev: "Ring pulling differs from bar pulling", conf: "high" })
carry({ src: OGC, fam: "iron_cross_doctrine", sourceKey: "ring_support_hold", targetSkill: "iron_cross", type: "direct", strength: 0.6, ev: "Ring support builds direct foundation", conf: "high" })
carry({ src: OGC, fam: "iron_cross_doctrine", sourceKey: "band_iron_cross_hold", targetSkill: "iron_cross", type: "direct", strength: 0.85, ev: "Band cross is the direct progression", conf: "high" })
carry({ src: OGC, fam: "iron_cross_doctrine", sourceKey: "iron_cross_negative", targetSkill: "iron_cross", type: "direct", strength: 0.8, ev: "Cross negatives directly support full cross", conf: "high" })
carry({ src: OGC, fam: "iron_cross_doctrine", sourceKey: "ring_support_hold", targetSkill: "azarian", type: "support", strength: 0.5, ev: "Ring support supports cross-derived transitions", conf: "high" })
carry({ src: OGC, fam: "iron_cross_doctrine", sourceKey: "band_iron_cross_hold", targetSkill: "nakayama", type: "support", strength: 0.45, ev: "Band cross supports cross-derived transitions", conf: "medium" })
p({ src: OGC, fam: "iron_cross_doctrine", key: "ogc_transitions_require_cross", title: "Cross-derived elite transitions require cross strength first", sum: "Azarian and Nakayama derive from cross strength; without cross readiness, direct prescription of these transitions is unsafe and unsupported.", w: 2, ev: "Ring transition gated by cross/support readiness", conf: "high", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["azarian", "nakayama"] })

// =====================================================================
// 5. FITNESSFAQS FL/PLANCHE/ROW/PUSH-UP ADVANCED (FFA) — 34 atoms
// =====================================================================
p({ src: FFA, fam: "fl_planche_advanced", key: "ffa_protraction_principle", title: "Scapular protraction is the planche signature", sum: "Planche progressions live or die by scapular protraction strength; weak protraction is the most common planche limiter.", w: 1, ev: "Planche push-up gated by hold + press readiness", conf: "high" })
p({ src: FFA, fam: "fl_planche_advanced", key: "ffa_depression_retraction_principle", title: "Front lever depends on scapular depression and retraction", sum: "Front lever progress requires aggressive scapular depression plus retraction; weak depression makes the lever heavy and the rows messy.", w: 1, ev: "Front lever row quality enforced before progression", conf: "high" })
p({ src: FFA, fam: "fl_planche_advanced", key: "ffa_row_quality_principle", title: "Row quality precedes row progression", sum: "Front lever rows require bodyline control, full ROM, and absence of hip pike or momentum; quality before leverage step.", w: 1, ev: "Front lever row quality enforced before progression", conf: "high" })
p({ src: FFA, fam: "fl_planche_advanced", key: "ffa_pseudo_planche_pushup_principle", title: "Pseudo planche push-ups bridge planche and pressing", sum: "Pseudo planche push-ups are the primary bridge between planche leans and planche-derived pressing; they are not a planche replacement.", w: 1, ev: "Planche push-up progression staged by leverage", conf: "high" })
p({ src: FFA, fam: "fl_planche_advanced", key: "ffa_full_planche_pushup_lockout", title: "Full planche push-ups assume full planche control", sum: "Full planche push-ups are not a beginner accessory; they assume a controlled full planche hold plus bent-arm pressing strength.", w: 2, ev: "Full planche push-up locked behind full planche control", conf: "high", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["full_planche_push_up"] })
progr({ src: FFA, fam: "fl_planche_advanced", key: "ffa_fl_row_leverage_progression", applies: { skill: "front_lever_row_advanced" }, rule: { stages: ["tuck_row", "advanced_tuck_row", "straddle_row", "full_row"], gate: { previousStageCleanReps: 5, twoSessionsConfirmation: true } }, ev: "Front lever row progression matched lever strength", conf: "high", supportLevel: "DIRECT_SOURCE_BACKED", skillKeys: ["front_lever_row_advanced"] })
progr({ src: FFA, fam: "fl_planche_advanced", key: "ffa_fl_row_quality_gate", applies: { skill: "front_lever_row_advanced" }, rule: { hipPike: false, momentum: false, fullROM: true, scapularDepressionMaintained: true }, ev: "Front lever row quality enforced before progression", conf: "high", t: "hard_constraint" })
progr({ src: FFA, fam: "fl_planche_advanced", key: "ffa_planche_pushup_progression", applies: { skill: "planche_push_up_advanced" }, rule: { stages: ["pseudo_planche_pushup", "tuck_planche_pushup", "advanced_tuck_planche_pushup", "straddle_planche_pushup", "full_planche_pushup"], gate: { previousStageCleanReps: 5, holdAtStageSec: 5 } }, ev: "Planche push-up progression staged by leverage", conf: "high", supportLevel: "DIRECT_SOURCE_BACKED", skillKeys: ["planche_push_up_advanced"] })
progr({ src: FFA, fam: "fl_planche_advanced", key: "ffa_planche_pushup_readiness_gate", applies: { skill: "planche_push_up_advanced" }, rule: { prerequisitePlancheHoldSec: 5, prerequisitePseudoPlancheCleanReps: 8 }, ev: "Planche push-up gated by hold + press readiness", conf: "high", t: "hard_constraint" })
progr({ src: FFA, fam: "fl_planche_advanced", key: "ffa_full_planche_pushup_gate", applies: { skill: "full_planche_push_up" }, rule: { prerequisiteFullPlancheHoldSec: 5, prerequisiteStraddlePlanchePushupReps: 5 }, ev: "Full planche push-up locked behind full planche control", conf: "high", t: "hard_constraint", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["full_planche_push_up"] })
progr({ src: FFA, fam: "fl_planche_advanced", key: "ffa_press_to_planche_route", applies: { skill: "press_to_planche" }, rule: { stages: ["compression_drill", "tuck_press_to_tuck_planche", "advanced_tuck_press", "straddle_press_to_planche", "full_press_to_planche"], gate: { plancheHoldAtTargetLeverageSec: 5, compressionScore: "high" } }, ev: "Press-to-planche mapped as transition strength, not generic pressing", conf: "high", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["press_to_planche"] })
progr({ src: FFA, fam: "fl_planche_advanced", key: "ffa_oafl_prerequisite_gate", applies: { skill: "one_arm_front_lever" }, rule: { prerequisiteFullFrontLeverHoldSec: 10, prerequisiteFullFrontLeverRowReps: 5 }, ev: "One-arm front lever blocked until full front lever foundation", conf: "high", t: "hard_constraint", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["one_arm_front_lever"] })
progr({ src: FFA, fam: "fl_planche_advanced", key: "ffa_oafl_unilateral_progression", applies: { skill: "one_arm_front_lever" }, rule: { stages: ["uneven_front_lever_band", "uneven_front_lever_no_band", "side_lever_assist", "one_arm_negative", "one_arm_partial"], gate: { previousStageCleanHoldSec: 5, antiRotationCoreScore: "high" } }, ev: "One-arm front lever prepared through full lever and unilateral pulling carryover", conf: "medium", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["one_arm_front_lever"] })
meth({ src: FFA, fam: "fl_planche_advanced", key: "ffa_pseudo_planche_pushup_form", applies: { rep: "pseudo_planche_pushup" }, rule: { handsBelowHips: true, scapularProtractionMaintained: true, elbowsFlared: false, elbowsBack: true }, ev: "Planche push-up progression staged by leverage", conf: "high" })
meth({ src: FFA, fam: "fl_planche_advanced", key: "ffa_full_planche_pushup_form", applies: { rep: "full_planche_pushup" }, rule: { lockoutInFullPlanche: true, scapularProtractionMaintained: true, fullROM: true }, ev: "Full planche push-up locked behind full planche control", conf: "high", t: "hard_constraint" })
meth({ src: FFA, fam: "fl_planche_advanced", key: "ffa_fl_row_form", applies: { rep: "front_lever_row" }, rule: { hipPike: false, momentum: false, scapularDepressionMaintained: true, fullROM: true, tempoEccentricSec: { min: 2 } }, ev: "Front lever row quality enforced before progression", conf: "high" })
meth({ src: FFA, fam: "fl_planche_advanced", key: "ffa_oafl_anti_rotation", applies: { rep: { in: ["uneven_front_lever_band", "uneven_front_lever_no_band", "one_arm_negative", "one_arm_partial"] } }, rule: { antiRotationCoreActive: true, hipsLevel: true }, ev: "One-arm front lever prepared through full lever and unilateral pulling carryover", conf: "medium" })
meth({ src: FFA, fam: "fl_planche_advanced", key: "ffa_press_to_planche_form", applies: { rep: "press_to_planche" }, rule: { compressionMaintained: true, scapularProtractionMaintained: true, ascendsThroughPlancheLockout: true }, ev: "Press-to-planche mapped as transition strength, not generic pressing", conf: "high" })
rx({ src: FFA, fam: "fl_planche_advanced", key: "ffa_fl_row_dose", applies: { skill: "front_lever_row_advanced" }, rule: { setsPerSession: [3, 5], repsPerSet: [3, 8], sessionsPerWeek: [2, 3] }, ev: "Front lever row progression matched lever strength", conf: "high" })
rx({ src: FFA, fam: "fl_planche_advanced", key: "ffa_planche_pushup_dose", applies: { skill: "planche_push_up_advanced" }, rule: { setsPerSession: [3, 5], repsPerSet: [3, 8], sessionsPerWeek: [2, 3] }, ev: "Planche push-up progression staged by leverage", conf: "high" })
rx({ src: FFA, fam: "fl_planche_advanced", key: "ffa_full_planche_pushup_dose", applies: { skill: "full_planche_push_up" }, rule: { setsPerSession: [2, 4], repsPerSet: [1, 4], sessionsPerWeek: [1, 2] }, ev: "Full planche push-up locked behind full planche control", conf: "high" })
rx({ src: FFA, fam: "fl_planche_advanced", key: "ffa_press_to_planche_dose", applies: { skill: "press_to_planche" }, rule: { setsPerSession: [3, 5], repsPerSet: [1, 4], sessionsPerWeek: [1, 2] }, ev: "Press-to-planche mapped as transition strength, not generic pressing", conf: "high" })
sel({ src: FFA, fam: "fl_planche_advanced", key: "ffa_fl_row_pool", applies: { skill: "front_lever_row_advanced" }, rule: { include: ["tuck_front_lever_row", "advanced_tuck_front_lever_row", "straddle_front_lever_row", "full_front_lever_row"] }, ev: "Front lever row progression matched lever strength", conf: "high" })
sel({ src: FFA, fam: "fl_planche_advanced", key: "ffa_planche_pushup_pool", applies: { skill: "planche_push_up_advanced" }, rule: { include: ["pseudo_planche_pushup", "tuck_planche_pushup", "advanced_tuck_planche_pushup", "straddle_planche_pushup", "full_planche_pushup"] }, ev: "Planche push-up progression staged by leverage", conf: "high" })
sel({ src: FFA, fam: "fl_planche_advanced", key: "ffa_press_to_planche_pool", applies: { skill: "press_to_planche" }, rule: { include: ["compression_drill", "tuck_press_to_tuck_planche", "advanced_tuck_press", "straddle_press_to_planche", "full_press_to_planche"] }, ev: "Press-to-planche mapped as transition strength, not generic pressing", conf: "high" })
sel({ src: FFA, fam: "fl_planche_advanced", key: "ffa_oafl_pool", applies: { skill: "one_arm_front_lever" }, rule: { include: ["uneven_front_lever_band", "uneven_front_lever_no_band", "side_lever_assist", "one_arm_negative", "one_arm_partial"] }, ev: "One-arm front lever prepared through full lever and unilateral pulling carryover", conf: "medium" })
carry({ src: FFA, fam: "fl_planche_advanced", sourceKey: "tuck_front_lever_row", targetSkill: "front_lever_row_advanced", type: "direct", strength: 0.85, ev: "Tuck FL row directly supports advanced FL row", conf: "high" })
carry({ src: FFA, fam: "fl_planche_advanced", sourceKey: "advanced_tuck_front_lever_row", targetSkill: "front_lever_row_advanced", type: "direct", strength: 0.9, ev: "Advanced tuck FL row directly supports advanced FL row", conf: "high" })
carry({ src: FFA, fam: "fl_planche_advanced", sourceKey: "pseudo_planche_pushup", targetSkill: "planche_push_up_advanced", type: "direct", strength: 0.75, ev: "Pseudo planche push-up directly supports planche pushup pathway", conf: "high" })
carry({ src: FFA, fam: "fl_planche_advanced", sourceKey: "tuck_planche_pushup", targetSkill: "planche_push_up_advanced", type: "direct", strength: 0.85, ev: "Tuck planche push-up directly supports planche pushup pathway", conf: "high" })
carry({ src: FFA, fam: "fl_planche_advanced", sourceKey: "straddle_planche_pushup", targetSkill: "full_planche_push_up", type: "support", strength: 0.7, ev: "Straddle planche pushup supports full planche pushup", conf: "high" })
carry({ src: FFA, fam: "fl_planche_advanced", sourceKey: "uneven_front_lever_band", targetSkill: "one_arm_front_lever", type: "support", strength: 0.55, ev: "Band uneven FL supports OAFL pathway", conf: "medium" })
carry({ src: FFA, fam: "fl_planche_advanced", sourceKey: "tuck_press_to_tuck_planche", targetSkill: "press_to_planche", type: "direct", strength: 0.7, ev: "Tuck press supports press-to-planche pathway", conf: "high" })
meth({ src: FFA, fam: "fl_planche_advanced", key: "ffa_no_oafl_row_prescription_without_source", applies: { skill: "one_arm_front_lever_row" }, rule: { directPrescription: false, supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "One-arm front lever row blocked by elite readiness/source support", conf: "gap", t: "hard_constraint", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["one_arm_front_lever_row"] })

// =====================================================================
// 6. GYMNASTICBODIES-STYLE HISTORICAL STRENGTH (GBH) — 14 atoms
// =====================================================================
// Public commentary only; secondary support; never the sole source for an
// elite prescription.
p({ src: GBH, fam: "historical_strength", key: "gbh_long_timeline_principle", title: "Elite ring strength has historically taken years", sum: "Public coaching commentary repeatedly emphasizes that elite ring strength (Maltese, Victorian) is a multi-year goal, not a multi-month one.", w: 1, ev: "Connective tissue adaptation controls progression speed", conf: "medium" })
p({ src: GBH, fam: "historical_strength", key: "gbh_foundations_first", title: "Foundations precede elite ambition", sum: "Public commentary urges deep foundation work (handstand, basic strength holds, full ROM control) before chasing elite-named elements.", w: 1, ev: "Foundations prioritized before advanced skill work", conf: "medium" })
p({ src: GBH, fam: "historical_strength", key: "gbh_no_shortcut_principle", title: "There are no leverage shortcuts to elite skills", sum: "Public commentary warns that band shortcuts and partial-ROM heroics do not replace progressive leverage and tendon adaptation.", w: 1, ev: "Connective tissue adaptation controls progression speed", conf: "medium" })
meth({ src: GBH, fam: "historical_strength", key: "gbh_secondary_only", applies: { sole_source_for_prescription: true }, rule: { allowedAsSoleSource: false }, ev: "Direct doctrine gap detected; using prerequisite/carryover only", conf: "medium", t: "hard_constraint" })
meth({ src: GBH, fam: "historical_strength", key: "gbh_supports_prerequisites", applies: { skill: { in: ["maltese", "victorian"] } }, rule: { mayInformPrerequisitePath: true, mayPrescribeDirectElitePosition: false }, ev: "Maltese prepared through planche/cross/back-lever carryover", conf: "medium", supportLevel: "CARRYOVER_SUPPORTED_ONLY" })
meth({ src: GBH, fam: "historical_strength", key: "gbh_audit_visibility", applies: { audit: true }, rule: { exposeSecondarySupportToAudit: true }, ev: "Advanced doctrine support status available for audit", conf: "medium" })
sel({ src: GBH, fam: "historical_strength", key: "gbh_foundation_emphasis_pool", applies: { skill: { in: ["maltese", "victorian"] } }, rule: { include: ["handstand_full_lockout", "ring_support_hold", "german_hang_progression", "skin_the_cat_progression", "tuck_planche_hold", "tuck_front_lever_hold", "tuck_back_lever_hold"] }, ev: "Maltese prepared through planche/cross/back-lever carryover", conf: "medium" })
carry({ src: GBH, fam: "historical_strength", sourceKey: "ring_support_hold", targetSkill: "maltese", type: "support", strength: 0.55, ev: "Ring support supports Maltese prerequisite path", conf: "medium" })
carry({ src: GBH, fam: "historical_strength", sourceKey: "german_hang_progression", targetSkill: "maltese", type: "support", strength: 0.4, ev: "German hang supports straight-arm rings tolerance for Maltese", conf: "medium" })
carry({ src: GBH, fam: "historical_strength", sourceKey: "ring_support_hold", targetSkill: "victorian", type: "support", strength: 0.45, ev: "Ring support supports Victorian prerequisite path", conf: "medium" })
carry({ src: GBH, fam: "historical_strength", sourceKey: "skin_the_cat_progression", targetSkill: "victorian", type: "support", strength: 0.35, ev: "Skin-the-cat supports rings/shoulder mobility for Victorian path", conf: "medium" })
p({ src: GBH, fam: "historical_strength", key: "gbh_no_invented_elite_method", title: "Public commentary does not invent elite method", sum: "When public commentary stops short of full elite-method detail, the doctrine routes to source-gap rather than invent specifics.", w: 2, ev: "Direct doctrine gap detected; using prerequisite/carryover only", conf: "medium", t: "hard_constraint" })
meth({ src: GBH, fam: "historical_strength", key: "gbh_handstand_priority", applies: { skill: { in: ["maltese", "victorian", "press_to_planche"] } }, rule: { handstandFoundationRequired: true }, ev: "Foundations prioritized before advanced skill work", conf: "medium" })
meth({ src: GBH, fam: "historical_strength", key: "gbh_recovery_emphasis", applies: { sessionTopic: "elite_rings_pathway" }, rule: { recoveryEmphasisHigh: true, sleepEmphasisHigh: true }, ev: "Connective tissue adaptation controls progression speed", conf: "medium" })

// =====================================================================
// 7. ELITE RING SKILL SOURCE GAP (ESG) — 18 atoms
// =====================================================================
// Honesty source. Records where direct doctrine is missing.
p({ src: ESG, fam: "source_gap_honesty", key: "esg_source_gap_principle", title: "Source gap is recorded honestly, never papered over", sum: "When SpartanLab lacks trusted direct doctrine for an elite skill, that gap is recorded as data, not hidden behind generic content.", w: 2, ev: "Direct doctrine gap detected; using prerequisite/carryover only", conf: "high", t: "hard_constraint" })
p({ src: ESG, fam: "source_gap_honesty", key: "esg_carryover_label_principle", title: "Carryover work is labeled as carryover", sum: "If a program contains only prerequisite/carryover work for an advanced skill, that program must label the work as preparation, not as direct skill training.", w: 2, ev: "Advanced skill represented through prerequisite carryover, not direct prescription", conf: "high", t: "hard_constraint" })
p({ src: ESG, fam: "source_gap_honesty", key: "esg_no_fake_advanced_label", title: "No fake advanced label", sum: "The Program page must not claim 'Victorian training' or 'Maltese training' if the program only contains general shoulder/lever work.", w: 2, ev: "Advanced skill label reflects direct vs carryover truth", conf: "high", t: "hard_constraint" })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_victorian_gap", applies: { skill: "victorian" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Victorian locked behind elite straight-arm readiness", conf: "gap", t: "hard_constraint", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["victorian"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_one_arm_back_lever_gap", applies: { skill: "one_arm_back_lever" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "One-arm back lever treated as high-risk source-gap unless supported", conf: "gap", t: "hard_constraint", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["one_arm_back_lever"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_oafl_row_gap", applies: { skill: "one_arm_front_lever_row" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "One-arm front lever row blocked by elite readiness/source support", conf: "gap", t: "hard_constraint", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["one_arm_front_lever_row"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_azarian_gap", applies: { skill: "azarian" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Azarian direct prescription blocked without source-backed readiness", conf: "gap", t: "hard_constraint", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["azarian"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_nakayama_gap", applies: { skill: "nakayama" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "SOURCE_GAP_UNSUPPORTED" }, ev: "Nakayama direct prescription blocked without source-backed readiness", conf: "gap", t: "hard_constraint", supportLevel: "SOURCE_GAP_UNSUPPORTED", skillKeys: ["nakayama"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_maltese_carryover", applies: { skill: "maltese" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "CARRYOVER_SUPPORTED_ONLY" }, ev: "Maltese locked behind planche/cross readiness", conf: "medium", t: "hard_constraint", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["maltese"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_oafl_carryover", applies: { skill: "one_arm_front_lever" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "CARRYOVER_SUPPORTED_ONLY" }, ev: "One-arm front lever blocked until full front lever foundation", conf: "medium", t: "hard_constraint", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["one_arm_front_lever"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_full_planche_pushup_carryover", applies: { skill: "full_planche_push_up" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "CARRYOVER_SUPPORTED_ONLY" }, ev: "Full planche push-up locked behind full planche control", conf: "medium", t: "hard_constraint", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["full_planche_push_up"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_press_to_planche_carryover", applies: { skill: "press_to_planche" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "CARRYOVER_SUPPORTED_ONLY" }, ev: "Press-to-planche mapped as transition strength, not generic pressing", conf: "medium", t: "hard_constraint", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["press_to_planche"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_planche_pushup_direct", applies: { skill: "planche_push_up_advanced" }, rule: { directProgrammingPermitted: true, supportLevel: "DIRECT_SOURCE_BACKED" }, ev: "Direct advanced skill work prioritized when safe", conf: "high", supportLevel: "DIRECT_SOURCE_BACKED", skillKeys: ["planche_push_up_advanced"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_fl_row_direct", applies: { skill: "front_lever_row_advanced" }, rule: { directProgrammingPermitted: true, supportLevel: "DIRECT_SOURCE_BACKED" }, ev: "Direct advanced skill work prioritized when safe", conf: "high", supportLevel: "DIRECT_SOURCE_BACKED", skillKeys: ["front_lever_row_advanced"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_archer_pull_direct", applies: { skill: "archer_pull_pathway" }, rule: { directProgrammingPermitted: true, supportLevel: "DIRECT_SOURCE_BACKED" }, ev: "Archer pull-up assigned to unilateral pulling pathway", conf: "high", supportLevel: "DIRECT_SOURCE_BACKED", skillKeys: ["archer_pull_pathway"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_archer_push_direct", applies: { skill: "archer_push_pathway" }, rule: { directProgrammingPermitted: true, supportLevel: "DIRECT_SOURCE_BACKED" }, ev: "Archer push-up used as support, not planche replacement", conf: "high", supportLevel: "DIRECT_SOURCE_BACKED", skillKeys: ["archer_push_pathway"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_rings_transition_carryover", applies: { skill: "rings_transition_strength" }, rule: { directProgrammingPermitted: false, longTermGoalAllowed: true, supportLevel: "CARRYOVER_SUPPORTED_ONLY" }, ev: "Ring transition gated by cross/support readiness", conf: "medium", t: "hard_constraint", supportLevel: "CARRYOVER_SUPPORTED_ONLY", skillKeys: ["rings_transition_strength"] })
meth({ src: ESG, fam: "source_gap_honesty", key: "esg_audit_visibility", applies: { audit: true }, rule: { exposeSourceGapStatusToAudit: true, exposeSupportLevelToAudit: true }, ev: "Advanced doctrine support status available for audit", conf: "high" })

// =====================================================================
// 8. ADVANCED CARRYOVER MAPPING (ACM) — 34 atoms
// =====================================================================
p({ src: ACM, fam: "advanced_carryover", key: "acm_carryover_principle", title: "Direct vs carryover is a programming truth axis", sum: "Every advanced-skill prescription is either direct (skill is trained as itself) or carryover (skill is trained through prerequisites). The doctrine never blurs the line.", w: 2, ev: "Advanced skill represented through prerequisite carryover, not direct prescription", conf: "high", t: "hard_constraint" })
p({ src: ACM, fam: "advanced_carryover", key: "acm_readiness_gate_principle", title: "Readiness gates protect advanced skills", sum: "Each advanced skill has a readiness gate: prerequisite hold time, prerequisite reps, prior-pain history. Failing the gate routes the skill to long-term goal, not direct work.", w: 2, ev: "Advanced skill represented through prerequisite carryover, not direct prescription", conf: "high", t: "hard_constraint" })
p({ src: ACM, fam: "advanced_carryover", key: "acm_priority_when_safe", title: "Direct work first when readiness met", sum: "When direct doctrine is strong and readiness is met, direct skill work comes before generic accessories.", w: 1, ev: "Direct advanced skill work prioritized when safe", conf: "high" })
p({ src: ACM, fam: "advanced_carryover", key: "acm_fallback_when_gap", title: "Source-gap routes to prerequisite path", sum: "When direct doctrine is missing, the carryover engine prescribes prerequisite foundations rather than inventing direct progressions.", w: 2, ev: "Source gap fallback uses prerequisite path", conf: "high", t: "hard_constraint" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "front_lever_full_hold", targetSkill: "victorian", type: "support", strength: 0.55, ev: "Victorian prepared through front lever + ring pulling carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "iron_cross_band_hold", targetSkill: "victorian", type: "support", strength: 0.5, ev: "Victorian prepared through front lever + ring pulling carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "ring_pull_to_inverted", targetSkill: "victorian", type: "support", strength: 0.45, ev: "Victorian prepared through front lever + ring pulling carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "scapular_depression_drill", targetSkill: "victorian", type: "support", strength: 0.4, ev: "Victorian prepared through front lever + ring pulling carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "planche_full_hold", targetSkill: "maltese", type: "support", strength: 0.65, ev: "Maltese prepared through planche/cross/back-lever carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "iron_cross_band_hold", targetSkill: "maltese", type: "support", strength: 0.55, ev: "Maltese prepared through planche/cross/back-lever carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "back_lever_full_hold", targetSkill: "maltese", type: "support", strength: 0.5, ev: "Maltese prepared through planche/cross/back-lever carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "maltese_lean_drill", targetSkill: "maltese", type: "support", strength: 0.5, ev: "Maltese prepared through planche/cross/back-lever carryover", conf: "medium" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "ring_support_hold", targetSkill: "maltese", type: "support", strength: 0.4, ev: "Maltese prepared through planche/cross/back-lever carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "front_lever_full_hold", targetSkill: "one_arm_front_lever", type: "direct", strength: 0.7, ev: "One-arm front lever prepared through full lever and unilateral pulling carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "tuck_front_lever_row", targetSkill: "one_arm_front_lever", type: "support", strength: 0.5, ev: "One-arm front lever prepared through full lever and unilateral pulling carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "archer_pull_up", targetSkill: "one_arm_front_lever", type: "support", strength: 0.45, ev: "One-arm front lever prepared through full lever and unilateral pulling carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "anti_rotation_core_drill", targetSkill: "one_arm_front_lever", type: "support", strength: 0.4, ev: "One-arm front lever prepared through full lever and unilateral pulling carryover", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "back_lever_full_hold", targetSkill: "one_arm_back_lever", type: "support", strength: 0.5, ev: "One-arm back lever prepared via prerequisite back lever foundation", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "german_hang_progression", targetSkill: "one_arm_back_lever", type: "support", strength: 0.35, ev: "Shoulder extension tolerance prepared via german hang", conf: "medium" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "biceps_tendon_eccentric", targetSkill: "one_arm_back_lever", type: "support", strength: 0.35, ev: "Biceps tendon prep for one-arm back lever path", conf: "medium" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "full_front_lever_row", targetSkill: "one_arm_front_lever_row", type: "support", strength: 0.55, ev: "One-arm FL row prepared via full FL row prerequisite", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "iron_cross_full_hold", targetSkill: "azarian", type: "support", strength: 0.5, ev: "Azarian carryover via cross strength only", conf: "medium" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "ring_pull_to_inverted", targetSkill: "azarian", type: "support", strength: 0.4, ev: "Azarian carryover via ring pulling pattern", conf: "medium" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "iron_cross_full_hold", targetSkill: "nakayama", type: "support", strength: 0.45, ev: "Nakayama carryover via cross strength only", conf: "medium" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "back_lever_full_hold", targetSkill: "nakayama", type: "support", strength: 0.4, ev: "Nakayama carryover via back lever lever-transition strength", conf: "medium" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "archer_pull_up", targetSkill: "one_arm_pull_up", type: "direct", strength: 0.85, ev: "Archer pull-up assigned to unilateral pulling pathway", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "archer_row", targetSkill: "horizontal_unilateral_pull", type: "direct", strength: 0.8, ev: "Archer variation matched pull direction", conf: "high" })
carry({ src: ACM, fam: "advanced_carryover", sourceKey: "archer_push_up", targetSkill: "horizontal_unilateral_push", type: "direct", strength: 0.8, ev: "Archer push-up used as support, not planche replacement", conf: "high" })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_archer_pull_pathway_match", applies: { skill: "archer_pull_pathway" }, rule: { mapsTo: "one_arm_pull_up_pathway", notFiller: true }, ev: "Archer pull-up assigned to unilateral pulling pathway", conf: "high", supportLevel: "DIRECT_SOURCE_BACKED", skillKeys: ["archer_pull_pathway"] })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_archer_row_pull_distinction", applies: { skill: { in: ["archer_pull_pathway"] } }, rule: { archerRowDistinct: true, archerRowSupportsHorizontalPull: true, archerPullSupportsVerticalPull: true }, ev: "Archer variation matched pull direction", conf: "high" })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_archer_push_pathway_match", applies: { skill: "archer_push_pathway" }, rule: { mapsTo: "horizontal_unilateral_press", notPlancheReplacement: true }, ev: "Archer push-up used as support, not planche replacement", conf: "high", supportLevel: "DIRECT_SOURCE_BACKED", skillKeys: ["archer_push_pathway"] })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_carryover_label_required", applies: { advancedSkillContext: { directPermitted: false } }, rule: { displayLabel: "preparation", forbiddenLabels: ["direct_skill_training"] }, ev: "Advanced skill label reflects direct vs carryover truth", conf: "high", t: "hard_constraint" })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_no_stack_high_load", applies: { advancedSkillContext: { count: { gte: 2 } } }, rule: { stackThreeHighLoadInOneDay: false, restBetweenAdvancedSkillSessionsHours: { min: 48 } }, ev: "Elite straight-arm stress protected by recovery spacing", conf: "high", t: "hard_constraint" })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_audit_visibility", applies: { audit: true }, rule: { exposeCarryoverPathToAudit: true }, ev: "Advanced doctrine support status available for audit", conf: "high" })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_recovery_spacing_advanced", applies: { advancedSkillContext: true }, rule: { hardSessionsPerWeek: [1, 2], restBetweenHardDays: { hours: { min: 48 } } }, ev: "Elite straight-arm stress protected by recovery spacing", conf: "high" })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_maltese_prereq_redirect", applies: { skill: "maltese", readiness: { plancheHoldSec: { lt: 5 } } }, rule: { redirectTo: ["planche_progression", "back_lever_progression", "iron_cross_band_progression"] }, ev: "Maltese goal redirected to prerequisite strength", conf: "high" })
meth({ src: ACM, fam: "advanced_carryover", key: "acm_victorian_prereq_redirect", applies: { skill: "victorian", readiness: { frontLeverHoldSec: { lt: 5 } } }, rule: { redirectTo: ["front_lever_progression", "ring_pulling_progression", "scapular_depression_progression"] }, ev: "Victorian goal redirected to front lever prerequisite", conf: "high" })

// =====================================================================
// 9. ADVANCED ONBOARDING GUARDRAILS (AOG) — 16 atoms
// =====================================================================
// Doctrine only. Onboarding UI is intentionally not implemented in this batch.
p({ src: AOG, fam: "onboarding_guardrails", key: "aog_optional_advanced_layer_principle", title: "Advanced skills live in an optional skippable layer", sum: "Future onboarding should expose advanced skills (Victorian, Maltese, OAFL, OABL, Azarian, Nakayama, full planche pushup, press-to-planche, OAFL row) only as optional sub-goals, never as default selections.", w: 1, ev: "Advanced goal saved without forcing unsafe direct training", conf: "high" })
p({ src: AOG, fam: "onboarding_guardrails", key: "aog_no_required_advanced_principle", title: "Advanced skills are never required", sum: "The app must never force or imply that beginners need to pick an advanced skill; the layer must be skippable.", w: 2, ev: "Advanced goal saved without forcing unsafe direct training", conf: "high", t: "hard_constraint" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_dropdown_under_front_lever", applies: { foundationalSkill: "front_lever" }, rule: { optionalSubGoals: ["standard_front_lever", "front_lever_row_advanced", "one_arm_front_lever", "victorian_preparation"] }, ev: "Advanced goal saved without forcing unsafe direct training", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_dropdown_under_planche", applies: { foundationalSkill: "planche" }, rule: { optionalSubGoals: ["standard_planche", "planche_push_up_advanced", "press_to_planche", "maltese_preparation"] }, ev: "Advanced goal saved without forcing unsafe direct training", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_dropdown_under_back_lever_rings", applies: { foundationalSkill: { in: ["back_lever", "iron_cross"] } }, rule: { optionalSubGoals: ["back_lever", "iron_cross_band_progression", "maltese_preparation", "azarian_long_term", "nakayama_long_term"] }, ev: "Advanced goal saved without forcing unsafe direct training", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_victorian_warning_required", applies: { selectedAdvancedSkill: "victorian", readiness: { frontLeverHoldSec: { lt: 5 } } }, rule: { warning: "long_term_goal_only", redirectFoundation: "front_lever" }, ev: "Victorian goal redirected to front lever prerequisite", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_maltese_warning_required", applies: { selectedAdvancedSkill: "maltese", readiness: { plancheHoldSec: { lt: 5 } } }, rule: { warning: "long_term_goal_only", redirectFoundation: ["planche", "back_lever", "iron_cross"] }, ev: "Maltese goal redirected to prerequisite strength", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_oafl_warning_required", applies: { selectedAdvancedSkill: "one_arm_front_lever", readiness: { fullFrontLeverHoldSec: { lt: 5 } } }, rule: { warning: "long_term_goal_only", redirectFoundation: "front_lever" }, ev: "One-arm front lever blocked until full front lever foundation", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_azarian_warning_required", applies: { selectedAdvancedSkill: "azarian", readiness: { ironCrossHoldSec: { lt: 2 } } }, rule: { warning: "long_term_goal_only", redirectFoundation: "iron_cross" }, ev: "Azarian direct prescription blocked without source-backed readiness", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_nakayama_warning_required", applies: { selectedAdvancedSkill: "nakayama", readiness: { ironCrossHoldSec: { lt: 2 } } }, rule: { warning: "long_term_goal_only", redirectFoundation: "iron_cross" }, ev: "Nakayama direct prescription blocked without source-backed readiness", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_full_planche_pushup_warning", applies: { selectedAdvancedSkill: "full_planche_push_up", readiness: { fullPlancheHoldSec: { lt: 5 } } }, rule: { warning: "long_term_goal_only", redirectFoundation: "planche" }, ev: "Full planche push-up locked behind full planche control", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_save_long_term_goal", applies: { selectedAdvancedSkill: { any: true } }, rule: { saveAsLongTermGoal: true, doNotPrescribeDirectWorkWhenSourceGap: true }, ev: "Advanced goal saved without forcing unsafe direct training", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_warning_copy_victorian", applies: { selectedAdvancedSkill: "victorian" }, rule: { copy: "You can keep Victorian as a long-term goal, but your current inputs suggest the correct path starts with front lever strength, straight-arm pulling capacity, and ring support preparation before direct Victorian work." }, ev: "Victorian goal redirected to front lever prerequisite", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_warning_copy_maltese", applies: { selectedAdvancedSkill: "maltese" }, rule: { copy: "Maltese is an elite ring strength element. Your current inputs suggest the correct path starts with planche, back lever, and iron cross prerequisites before direct Maltese work." }, ev: "Maltese goal redirected to prerequisite strength", conf: "high" })
p({ src: AOG, fam: "onboarding_guardrails", key: "aog_no_ui_in_this_batch", title: "Doctrine only; UI implementation deferred", sum: "Batch 8 stores advanced-onboarding behavior as doctrine but does not implement onboarding UI. UI exposure is a separate follow-up prompt.", w: 1, ev: "Advanced doctrine support status available for audit", conf: "high" })
meth({ src: AOG, fam: "onboarding_guardrails", key: "aog_audit_visibility", applies: { audit: true }, rule: { exposeOnboardingGuardrailsToAudit: true }, ev: "Advanced doctrine support status available for audit", conf: "high" })

// =====================================================================
// ADVANCED-SKILL SUPPORT MATRIX — exported for builder/audit consumption
// =====================================================================
export interface AdvancedSkillSupportEntry {
  skillKey: AdvancedSkillKey
  displayName: string
  family: AdvancedSkillFamily
  supportLevel: AdvancedSkillSupportLevel
  sourceConfidence: AdvancedSourceConfidence
  directDoctrineStrength: DoctrineStrength
  prerequisiteDoctrineStrength: DoctrineStrength
  directTrainingAllowed: boolean
  carryoverTrainingAllowed: boolean
  contraindicationLevel: ContraindicationLevel
  primarySourceKeys: string[]
  prerequisiteSkillKeys: string[]
  minimumPrerequisiteExamples: string[]
  recommendedFoundationPath: string[]
  userFacingGuidance: string
  builderUse: string
  auditNotes: string
}

export const ADVANCED_SKILL_SUPPORT_MATRIX: Record<AdvancedSkillKey, AdvancedSkillSupportEntry> = {
  victorian: {
    skillKey: "victorian", displayName: "Victorian", family: "elite_rings",
    supportLevel: "SOURCE_GAP_UNSUPPORTED", sourceConfidence: "gap",
    directDoctrineStrength: "none", prerequisiteDoctrineStrength: "moderate",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "elite_only",
    primarySourceKeys: ["fig_mag_code_of_points_rings_batch_08", "elite_ring_skill_source_gap_batch_08", "advanced_carryover_mapping_batch_08"],
    prerequisiteSkillKeys: ["front_lever", "iron_cross", "ring_support"],
    minimumPrerequisiteExamples: ["full front lever 5s+", "iron cross band 5s+", "scapular depression strength"],
    recommendedFoundationPath: ["front_lever_progression", "ring_pulling_progression", "scapular_depression_progression"],
    userFacingGuidance: "Victorian locked behind elite straight-arm readiness; long-term goal only.",
    builderUse: "Save as long-term goal. Prescribe prerequisites only. Never claim 'Victorian training'.",
    auditNotes: "Victorian classification confirmed by FIG; direct programming requires coach source not currently in project.",
  },
  maltese: {
    skillKey: "maltese", displayName: "Maltese", family: "elite_rings",
    supportLevel: "CARRYOVER_SUPPORTED_ONLY", sourceConfidence: "medium",
    directDoctrineStrength: "weak", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "elite_only",
    primarySourceKeys: ["fig_mag_code_of_points_rings_batch_08", "advanced_carryover_mapping_batch_08", "gymnasticbodies_historical_strength_batch_08"],
    prerequisiteSkillKeys: ["planche", "back_lever", "iron_cross"],
    minimumPrerequisiteExamples: ["full planche 5s+", "back lever full 5s+", "iron cross band 10s+"],
    recommendedFoundationPath: ["planche_progression", "back_lever_progression", "iron_cross_band_progression"],
    userFacingGuidance: "Maltese locked behind planche/cross/back-lever readiness; carryover preparation only.",
    builderUse: "Carryover via planche/cross/back-lever. Never prescribe full Maltese position to non-elite athlete.",
    auditNotes: "Existing project graph stubs (advanced-skill-progression-graphs.ts) describe Maltese stages, but those are graph data, not source-backed direct doctrine.",
  },
  one_arm_front_lever: {
    skillKey: "one_arm_front_lever", displayName: "One-Arm Front Lever", family: "advanced_front_lever",
    supportLevel: "CARRYOVER_SUPPORTED_ONLY", sourceConfidence: "medium",
    directDoctrineStrength: "weak", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "high",
    primarySourceKeys: ["fitnessfaqs_front_lever_planche_advanced_batch_08", "advanced_carryover_mapping_batch_08"],
    prerequisiteSkillKeys: ["front_lever"],
    minimumPrerequisiteExamples: ["full front lever 10s+", "full FL row 5+ reps"],
    recommendedFoundationPath: ["front_lever_progression", "front_lever_row_progression", "anti_rotation_core"],
    userFacingGuidance: "OAFL requires strong full front lever foundation; unilateral specialization carryover only.",
    builderUse: "Block direct OAFL holds until full FL gate. Use uneven/band variations as carryover.",
    auditNotes: "Direct OAFL holds outside the public corpus; map to prerequisite + unilateral pulling.",
  },
  one_arm_back_lever: {
    skillKey: "one_arm_back_lever", displayName: "One-Arm Back Lever", family: "advanced_back_lever",
    supportLevel: "SOURCE_GAP_UNSUPPORTED", sourceConfidence: "gap",
    directDoctrineStrength: "none", prerequisiteDoctrineStrength: "moderate",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "elite_only",
    primarySourceKeys: ["elite_ring_skill_source_gap_batch_08", "advanced_carryover_mapping_batch_08"],
    prerequisiteSkillKeys: ["back_lever"],
    minimumPrerequisiteExamples: ["full back lever 10s+", "biceps tendon eccentric tolerance", "german hang tolerance"],
    recommendedFoundationPath: ["back_lever_progression", "german_hang_progression", "biceps_tendon_eccentric"],
    userFacingGuidance: "OABL is high biceps/shoulder risk; long-term goal only without source-backed coach material.",
    builderUse: "Refuse direct OABL prescription. Carryover via back lever foundation and shoulder-extension tolerance only.",
    auditNotes: "Insufficient public direct doctrine; maintain as goal with prerequisite-only path.",
  },
  front_lever_row_advanced: {
    skillKey: "front_lever_row_advanced", displayName: "Front Lever Row (Advanced)", family: "advanced_front_lever",
    supportLevel: "DIRECT_SOURCE_BACKED", sourceConfidence: "high",
    directDoctrineStrength: "strong", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: true, carryoverTrainingAllowed: true, contraindicationLevel: "high",
    primarySourceKeys: ["fitnessfaqs_front_lever_planche_advanced_batch_08", "advanced_isometrics_corpus_batch_08"],
    prerequisiteSkillKeys: ["front_lever"],
    minimumPrerequisiteExamples: ["tuck FL hold 15s+", "tuck FL row 5+ reps with form"],
    recommendedFoundationPath: ["tuck_row -> advanced_tuck_row -> straddle_row -> full_row"],
    userFacingGuidance: "Front lever row progression staged by lever shape and row quality.",
    builderUse: "Direct prescription permitted at the appropriate leverage stage. Form gate is hard constraint.",
    auditNotes: "Public coaching corpus describes the staged progression in detail.",
  },
  one_arm_front_lever_row: {
    skillKey: "one_arm_front_lever_row", displayName: "One-Arm Front Lever Row", family: "advanced_front_lever",
    supportLevel: "SOURCE_GAP_UNSUPPORTED", sourceConfidence: "gap",
    directDoctrineStrength: "none", prerequisiteDoctrineStrength: "moderate",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "elite_only",
    primarySourceKeys: ["elite_ring_skill_source_gap_batch_08", "advanced_carryover_mapping_batch_08"],
    prerequisiteSkillKeys: ["front_lever_row_advanced"],
    minimumPrerequisiteExamples: ["full FL row 5+ reps", "OAFL prerequisites met"],
    recommendedFoundationPath: ["front_lever_row_advanced", "one_arm_front_lever_carryover"],
    userFacingGuidance: "OAFL row is elite-only; long-term goal without specific coach source.",
    builderUse: "Refuse direct OAFL row prescription. Carryover via full FL row mastery.",
    auditNotes: "Direct programming source not available in current project corpus.",
  },
  planche_push_up_advanced: {
    skillKey: "planche_push_up_advanced", displayName: "Planche Push-Up (Advanced)", family: "advanced_planche",
    supportLevel: "DIRECT_SOURCE_BACKED", sourceConfidence: "high",
    directDoctrineStrength: "strong", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: true, carryoverTrainingAllowed: true, contraindicationLevel: "high",
    primarySourceKeys: ["fitnessfaqs_front_lever_planche_advanced_batch_08", "advanced_isometrics_corpus_batch_08"],
    prerequisiteSkillKeys: ["planche"],
    minimumPrerequisiteExamples: ["pseudo planche pushup 8+ reps clean", "planche hold at target leverage 5s+"],
    recommendedFoundationPath: ["pseudo_planche_pushup -> tuck_planche_pushup -> advanced_tuck -> straddle -> full"],
    userFacingGuidance: "Planche push-up gated by hold + press readiness.",
    builderUse: "Direct prescription permitted at the appropriate leverage stage.",
    auditNotes: "Public corpus describes the staged progression in detail.",
  },
  full_planche_push_up: {
    skillKey: "full_planche_push_up", displayName: "Full Planche Push-Up", family: "advanced_planche",
    supportLevel: "CARRYOVER_SUPPORTED_ONLY", sourceConfidence: "medium",
    directDoctrineStrength: "weak", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "elite_only",
    primarySourceKeys: ["fitnessfaqs_front_lever_planche_advanced_batch_08", "elite_ring_skill_source_gap_batch_08"],
    prerequisiteSkillKeys: ["planche", "planche_push_up_advanced"],
    minimumPrerequisiteExamples: ["full planche 5s+", "straddle planche pushup 5+ reps"],
    recommendedFoundationPath: ["planche_progression", "planche_push_up_advanced -> straddle -> full"],
    userFacingGuidance: "Full planche push-up locked behind full planche control and bent-arm readiness.",
    builderUse: "Allow only after full planche + straddle pushup gate. Treated as high-intensity capped dose.",
    auditNotes: "Direct full-leverage push-up programming weak in public corpus; carryover from prerequisites is well-supported.",
  },
  press_to_planche: {
    skillKey: "press_to_planche", displayName: "Press-to-Planche", family: "advanced_planche",
    supportLevel: "CARRYOVER_SUPPORTED_ONLY", sourceConfidence: "medium",
    directDoctrineStrength: "moderate", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "high",
    primarySourceKeys: ["fitnessfaqs_front_lever_planche_advanced_batch_08", "advanced_carryover_mapping_batch_08"],
    prerequisiteSkillKeys: ["planche", "handstand"],
    minimumPrerequisiteExamples: ["planche hold at target leverage 5s+", "compression score high", "handstand wall lockout"],
    recommendedFoundationPath: ["compression_drill", "tuck_press_to_tuck_planche", "advanced_tuck_press", "straddle_press_to_planche", "full_press_to_planche"],
    userFacingGuidance: "Press-to-planche is transition strength; not generic pressing.",
    builderUse: "Carryover via planche + compression + transition drills until target leverage gate met.",
    auditNotes: "Stage labels from public corpus; full elite-leverage transition still requires coach material.",
  },
  azarian: {
    skillKey: "azarian", displayName: "Azarian", family: "ring_transition",
    supportLevel: "SOURCE_GAP_UNSUPPORTED", sourceConfidence: "gap",
    directDoctrineStrength: "none", prerequisiteDoctrineStrength: "moderate",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "elite_only",
    primarySourceKeys: ["fig_named_elements_mens_gymnastics_batch_08", "elite_ring_skill_source_gap_batch_08", "iron_cross_corpus_batch_08"],
    prerequisiteSkillKeys: ["iron_cross"],
    minimumPrerequisiteExamples: ["iron cross hold 2s+ (FIG standard)", "ring pulling tendon tolerance"],
    recommendedFoundationPath: ["iron_cross_band_progression", "ring_pulling_progression"],
    userFacingGuidance: "Azarian classified as elite rings transition; direct prescription blocked without coach source.",
    builderUse: "Refuse direct Azarian prescription. Carryover via iron cross strength only.",
    auditNotes: "FIG named element confirmed; direct method requires coach source.",
  },
  nakayama: {
    skillKey: "nakayama", displayName: "Nakayama", family: "ring_transition",
    supportLevel: "SOURCE_GAP_UNSUPPORTED", sourceConfidence: "gap",
    directDoctrineStrength: "none", prerequisiteDoctrineStrength: "moderate",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "elite_only",
    primarySourceKeys: ["fig_named_elements_mens_gymnastics_batch_08", "elite_ring_skill_source_gap_batch_08", "iron_cross_corpus_batch_08"],
    prerequisiteSkillKeys: ["iron_cross", "back_lever"],
    minimumPrerequisiteExamples: ["iron cross 2s+", "back lever full 10s+"],
    recommendedFoundationPath: ["iron_cross_band_progression", "back_lever_progression"],
    userFacingGuidance: "Nakayama classified as elite rings transition; direct prescription blocked without coach source.",
    builderUse: "Refuse direct Nakayama prescription. Carryover via cross + back lever transition strength only.",
    auditNotes: "FIG named element confirmed; direct method requires coach source.",
  },
  archer_pull_pathway: {
    skillKey: "archer_pull_pathway", displayName: "Archer Pull-Up Pathway", family: "advanced_archer",
    supportLevel: "DIRECT_SOURCE_BACKED", sourceConfidence: "high",
    directDoctrineStrength: "strong", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: true, carryoverTrainingAllowed: true, contraindicationLevel: "normal",
    primarySourceKeys: ["fitnessfaqs_front_lever_planche_advanced_batch_08", "advanced_carryover_mapping_batch_08"],
    prerequisiteSkillKeys: ["pull_up"],
    minimumPrerequisiteExamples: ["clean weighted pull-up reps", "scapular control"],
    recommendedFoundationPath: ["pull_up -> archer_pull_up -> typewriter -> assisted_one_arm -> one_arm_pull_up"],
    userFacingGuidance: "Archer pull-up assigned to unilateral pulling pathway, not random accessory.",
    builderUse: "Direct prescription permitted; map to one-arm pull-up pathway, not row.",
    auditNotes: "Public corpus describes archer-to-OAP path in detail.",
  },
  archer_push_pathway: {
    skillKey: "archer_push_pathway", displayName: "Archer Push-Up Pathway", family: "advanced_archer",
    supportLevel: "DIRECT_SOURCE_BACKED", sourceConfidence: "high",
    directDoctrineStrength: "strong", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: true, carryoverTrainingAllowed: true, contraindicationLevel: "normal",
    primarySourceKeys: ["fitnessfaqs_front_lever_planche_advanced_batch_08", "advanced_carryover_mapping_batch_08"],
    prerequisiteSkillKeys: ["push_up"],
    minimumPrerequisiteExamples: ["clean push-up volume", "scapular control"],
    recommendedFoundationPath: ["push_up -> archer_push_up -> typewriter_push_up -> assisted_one_arm_push_up"],
    userFacingGuidance: "Archer push-up is unilateral horizontal pressing support, not a planche replacement.",
    builderUse: "Direct prescription permitted as horizontal-press support; never as planche substitute.",
    auditNotes: "Public corpus distinguishes archer push from planche-specific work.",
  },
  rings_transition_strength: {
    skillKey: "rings_transition_strength", displayName: "Rings Transition Strength", family: "ring_transition",
    supportLevel: "CARRYOVER_SUPPORTED_ONLY", sourceConfidence: "medium",
    directDoctrineStrength: "moderate", prerequisiteDoctrineStrength: "strong",
    directTrainingAllowed: false, carryoverTrainingAllowed: true, contraindicationLevel: "high",
    primarySourceKeys: ["iron_cross_corpus_batch_08", "advanced_carryover_mapping_batch_08", "fig_named_elements_mens_gymnastics_batch_08"],
    prerequisiteSkillKeys: ["iron_cross", "back_lever", "ring_support"],
    minimumPrerequisiteExamples: ["iron cross band 10s+", "ring support 30s+", "back lever 10s+"],
    recommendedFoundationPath: ["iron_cross_band_progression", "back_lever_progression", "ring_support_progression"],
    userFacingGuidance: "Rings transition strength is carryover for named elite transitions; direct elite transitions remain source-gap.",
    builderUse: "Carryover only. Refuse direct named-elite-transition prescriptions (Azarian/Nakayama) regardless.",
    auditNotes: "Carryover well-supported; named transitions remain in source-gap.",
  },
}

// =====================================================================
// INACTIVE ADVANCED CANDIDATES (data only)
// =====================================================================
// Recorded for future legal-source enrichment. MUST NOT inflate active rule
// counts. Reuses Batch 6's `InactiveAdvancedSourceCandidate` shape via
// duck-typed object literals; the canonical type lives in Batch 6.
export const BATCH_08_INACTIVE_ADVANCED_CANDIDATES = [
  { desiredSkillKey: "victorian", desiredDoctrineNeed: "Direct Victorian programming progressions, dose, contraindications", requiredSourceQuality: "official paid user-owned coach material or official creator-published",                  legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal direct-method source attached", notes: "Existing graph stubs are not source-backed direct doctrine." },
  { desiredSkillKey: "azarian",   desiredDoctrineNeed: "Direct Azarian transition method",                                  requiredSourceQuality: "official gymnastics-coaching paid user-owned or creator-published",                   legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal direct-method source attached", notes: "FIG names the element; method is gap." },
  { desiredSkillKey: "nakayama",  desiredDoctrineNeed: "Direct Nakayama transition method",                                 requiredSourceQuality: "official gymnastics-coaching paid user-owned or creator-published",                   legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal direct-method source attached", notes: "FIG names the element; method is gap." },
  { desiredSkillKey: "one_arm_back_lever",        desiredDoctrineNeed: "Direct OABL programming and biceps-tendon protocol", requiredSourceQuality: "rehab-aware paid user-owned or creator-published",                                  legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal direct-method source attached", notes: "High biceps tendon risk; needs explicit protocol." },
  { desiredSkillKey: "one_arm_front_lever_row",   desiredDoctrineNeed: "Direct OAFL row programming",                       requiredSourceQuality: "elite calisthenics paid user-owned or creator-published",                            legalSourceStatus: "unknown_requires_review" as SourceLegalityStatus, active: false as const, reasonInactive: "No verified legal direct-method source attached", notes: "Direct method scarce in public corpus." },
]

// =====================================================================
// EXPORTS — aggregator-facing API (parity with Batch 1-7)
// =====================================================================
// Batch 8 expresses safety as hard_constraint method/progression rules — same
// pattern as Batch 4/5/6/7. Helper exists for aggregator parity.
export function getBatch08ContraindicationRules(): unknown[] { return [] }

export function getBatch08Sources(): DoctrineSource[] { return BATCH_08_SOURCES }
export function getBatch08Principles(): DoctrinePrinciple[] { return BATCH_08_PRINCIPLES }
export function getBatch08ProgressionRules(): ProgressionRule[] { return BATCH_08_PROGRESSION }
export function getBatch08MethodRules(): MethodRule[] { return BATCH_08_METHOD }
export function getBatch08PrescriptionRules(): PrescriptionRule[] { return BATCH_08_PRESCRIPTION }
export function getBatch08ExerciseSelectionRules(): ExerciseSelectionRule[] { return BATCH_08_SELECTION }
export function getBatch08CarryoverRules(): CarryoverRule[] { return BATCH_08_CARRYOVER }

export function getBatch08Counts() {
  return {
    sources: BATCH_08_SOURCES.length,
    principles: BATCH_08_PRINCIPLES.length,
    progression: BATCH_08_PROGRESSION.length,
    method: BATCH_08_METHOD.length,
    prescription: BATCH_08_PRESCRIPTION.length,
    selection: BATCH_08_SELECTION.length,
    carryover: BATCH_08_CARRYOVER.length,
    total:
      BATCH_08_PRINCIPLES.length +
      BATCH_08_PROGRESSION.length +
      BATCH_08_METHOD.length +
      BATCH_08_PRESCRIPTION.length +
      BATCH_08_SELECTION.length +
      BATCH_08_CARRYOVER.length,
    inactiveAdvancedCandidates: BATCH_08_INACTIVE_ADVANCED_CANDIDATES.length,
    advancedSkillsClassified: Object.keys(ADVANCED_SKILL_SUPPORT_MATRIX).length,
  }
}

export function getBatch08CountsBySource(): Record<string, number> {
  const all = [...BATCH_08_PRINCIPLES, ...BATCH_08_PROGRESSION, ...BATCH_08_METHOD, ...BATCH_08_PRESCRIPTION, ...BATCH_08_SELECTION, ...BATCH_08_CARRYOVER] as Array<{ source_id?: string }>
  const out: Record<string, number> = {}
  for (const r of all) { const sid = r.source_id ?? "unknown"; out[sid] = (out[sid] ?? 0) + 1 }
  return out
}

export function getBatch08ProvenanceFor(atomId: string): { batch: "batch_08"; sourceId: string | null } | null {
  const all: Array<{ id?: string; source_id?: string }> = [...BATCH_08_PRINCIPLES, ...BATCH_08_PROGRESSION, ...BATCH_08_METHOD, ...BATCH_08_PRESCRIPTION, ...BATCH_08_SELECTION, ...BATCH_08_CARRYOVER]
  const hit = all.find(r => r.id === atomId)
  if (!hit) return null
  return { batch: "batch_08", sourceId: hit.source_id ?? null }
}

export type Batch08Provenance = { batch: "batch_08"; sourceId: string | null }
