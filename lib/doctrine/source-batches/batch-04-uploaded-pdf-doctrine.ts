/**
 * UPLOADED PDF DOCTRINE — BATCH 04
 *
 * Pure source-data file. Mirrors Batch 1/2/3 layout.
 *
 * Sources covered (9):
 *   1. Pull-Up Pro Phase 1 (foundation)
 *   2. Pull-Up Pro Phase 2 (assisted transition)
 *   3. Pull-Up Pro Phase 3 (advanced eccentric)
 *   4. Mathew Zlat Weighted Calisthenics Guide
 *   5. Mathew Zlat Weighted Calisthenics — duplicate confirmation
 *   6. BWS 5-Day Full Body
 *   7. Lever Pro
 *   8. Lever Pro 4x BL/FL Training
 *   9. BWS 4-Day Upper-Lower
 *  (LP_2020 treated as duplicate confirmation of Lever Pro.)
 *
 * Provenance: derived_from_prompt_section_5_summary; evidence_snippet null.
 *
 * Runtime rule: consumed only via `./index.ts` aggregator.
 */

import type {
  DoctrineSource,
  DoctrinePrinciple,
  ProgressionRule,
  MethodRule,
  PrescriptionRule,
  CarryoverRule,
  ExerciseSelectionRule,
} from '../../doctrine-db'

// ===== SOURCES =====
export const BATCH_04_SOURCES: DoctrineSource[] = [
  { id: 'src_batch_04_pull_up_pro_phase_1', source_key: 'pull_up_pro_phase_1_uploaded_pdf_batch_04', title: 'Pull-Up Pro Phase 1', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_04_pull_up_pro_phase_2', source_key: 'pull_up_pro_phase_2_uploaded_pdf_batch_04', title: 'Pull-Up Pro Phase 2', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_04_pull_up_pro_phase_3', source_key: 'pull_up_pro_phase_3_uploaded_pdf_batch_04', title: 'Pull-Up Pro Phase 3', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_04_mz_weighted_guide', source_key: 'mathew_zlat_weighted_calisthenics_guide_uploaded_pdf_batch_04', title: 'Mathew Zlat Weighted Guide', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_04_mz_weighted_dup', source_key: 'mathew_zlat_weighted_calisthenics_duplicate_batch_04', title: 'Mathew Zlat Weighted Duplicate', confidence_tier: 'duplicate_confirmation', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_04_bws_5day_full_body', source_key: 'bws_5_day_full_body_uploaded_pdf_batch_04', title: 'BWS 5-Day Full Body', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_04_lever_pro', source_key: 'lever_pro_uploaded_pdf_batch_04', title: 'Lever Pro', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_04_lever_pro_4x', source_key: 'lever_pro_4x_bl_fl_training_uploaded_pdf_batch_04', title: 'Lever Pro 4x BL/FL', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_04_bws_4day_upper_lower', source_key: 'bws_4_day_upper_lower_uploaded_pdf_batch_04', title: 'BWS 4-Day Upper/Lower', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
]

const PUP1 = 'src_batch_04_pull_up_pro_phase_1'
const PUP2 = 'src_batch_04_pull_up_pro_phase_2'
const PUP3 = 'src_batch_04_pull_up_pro_phase_3'
const MZW = 'src_batch_04_mz_weighted_guide'
const MZD = 'src_batch_04_mz_weighted_dup'
const BWS5 = 'src_batch_04_bws_5day_full_body'
const LP = 'src_batch_04_lever_pro'
const LP4 = 'src_batch_04_lever_pro_4x'
const BWS4 = 'src_batch_04_bws_4day_upper_lower'

const COMMON_TAGS = { provenance: 'derived_from_prompt_section_5_summary', evidence_snippet: null }

const BATCH_04_PRINCIPLES: DoctrinePrinciple[] = []
const BATCH_04_PROGRESSION: ProgressionRule[] = []
const BATCH_04_METHOD: MethodRule[] = []
const BATCH_04_PRESCRIPTION: PrescriptionRule[] = []
const BATCH_04_SELECTION: ExerciseSelectionRule[] = []
const BATCH_04_CARRYOVER: CarryoverRule[] = []

let _n = 0
const nid = (pfx: string) => `${pfx}_b04_${String(++_n).padStart(3, '0')}`

type AddP = { src: string; fam: string; key: string; title: string; sum: string; w?: number; t?: 'hard_constraint' | 'soft_preference' | 'recommendation'; ev: string }
function p(a: AddP) {
  BATCH_04_PRINCIPLES.push({ id: nid('pr'), source_id: a.src, doctrine_family: a.fam, principle_key: a.key, principle_title: a.title, principle_summary: a.sum, safety_priority: a.w ?? 1, priority_type: a.t ?? 'soft_preference', is_base_intelligence: true, is_phase_modulation: false, applies_when_json: {}, does_not_apply_when_json: {}, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as DoctrinePrinciple)
}
type AddR = { src: string; fam: string; key: string; applies: Record<string, unknown>; rule: Record<string, unknown>; ev: string; t?: 'hard_constraint' | 'soft_preference' | 'recommendation' }
function progr(a: AddR) { BATCH_04_PROGRESSION.push({ id: nid('prog'), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? 'soft_preference', tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as ProgressionRule) }
function meth(a: AddR) { BATCH_04_METHOD.push({ id: nid('meth'), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? 'soft_preference', tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as MethodRule) }
function rx(a: AddR) { BATCH_04_PRESCRIPTION.push({ id: nid('rx'), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? 'soft_preference', tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as PrescriptionRule) }
function sel(a: AddR) { BATCH_04_SELECTION.push({ id: nid('sel'), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? 'soft_preference', tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as ExerciseSelectionRule) }
type AddC = { src: string; fam: string; sourceKey: string; targetSkill: string; type: string; strength: number; ev: string }
function carry(a: AddC) { BATCH_04_CARRYOVER.push({ id: nid('carry'), source_id: a.src, doctrine_family: a.fam, source_exercise_or_skill_key: a.sourceKey, target_skill_key: a.targetSkill, carryover_type: a.type, carryover_strength: a.strength, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as CarryoverRule) }

// ===== 1. PUP Phase 1 (>=10) =====
p({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'phase_1_priority', title: 'Phase 1 prioritizes two-arm vertical pull + row + hang support', sum: 'Foundation pulling builds the strength and tendon tolerance one-arm work later requires.', w: 2, ev: 'One-arm pull foundation built through vertical pull + row + hang support' })
sel({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'pup1_pull1', applies: { selectedSkill: 'one_arm_pull_up', phase: 'foundation' }, rule: { include: ['two_arm_vertical_pull', 'two_arm_bodyweight_row', 'two_arm_hang', 'external_rotation', 'bicep_curl'] }, ev: 'Foundation pull session 1 selected' })
sel({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'pup1_pull2', applies: { selectedSkill: 'one_arm_pull_up', phase: 'foundation', session: 'pull_2' }, rule: { include: ['assisted_one_arm_intro', 'two_arm_vertical_pull', 'two_arm_hang', 'face_pull', 'bicep_curl'] }, ev: 'Foundation pull session 2 selected' })
rx({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'pup1_primary_rest', applies: { phase: 'foundation', exerciseRole: 'primary' }, rule: { restMinSec: 180, restMaxSec: 300 }, ev: 'Long rest assigned to high-intensity pulling' })
rx({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'pup1_row_hang_rest', applies: { phase: 'foundation', exerciseRole: 'row_or_hang' }, rule: { restSec: 180 }, ev: 'Rows and hangs use ~3 minutes rest' })
rx({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'pup1_acc_rest', applies: { phase: 'foundation', exerciseRole: 'accessory' }, rule: { restMinSec: 60, restMaxSec: 120 }, ev: 'Rotator cuff and curl accessories use shorter support rest' })
progr({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'pup1_week_4_assisted', applies: { phase: 'foundation', week: 4 }, rule: { introduce: ['assisted_one_arm_low_volume'] }, ev: 'Week 4 introduces assisted one-arm exposure' })
meth({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'pup1_no_eccentric', applies: { phase: 'foundation' }, rule: { blockMethods: ['one_arm_eccentric_low_rep_long_rest'] }, t: 'hard_constraint', ev: 'Eccentric one-arm work withheld until later phases' })
meth({ src: PUP1, fam: 'one_arm_pull_up_foundation', key: 'pup1_form_standard', applies: { phase: 'foundation', exercise: 'pull_up' }, rule: { startStraightArms: true, finishChinOverBar: true, controlledLower: true, kipping: 'forbidden' }, t: 'hard_constraint', ev: 'Pull-up standard enforced for strength progression' })
carry({ src: PUP1, fam: 'one_arm_pull_up_foundation', sourceKey: 'two_arm_vertical_pull', targetSkill: 'one_arm_pull_up', type: 'progression_pre_requisite', strength: 0.8, ev: 'Two-arm vertical pull builds foundation for one-arm pull' })
carry({ src: PUP1, fam: 'one_arm_pull_up_foundation', sourceKey: 'two_arm_bodyweight_row', targetSkill: 'one_arm_pull_up', type: 'support', strength: 0.6, ev: 'Bodyweight row supports horizontal pull capacity' })

// ===== 2. PUP Phase 2 (>=10) =====
p({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'phase_2_assisted_primary', title: 'Phase 2 makes assisted one-arm work primary', sum: 'When foundation pulling exists but eccentric readiness is not yet met, assisted one-arm becomes the primary stimulus.', w: 2, ev: 'Assisted one-arm transition selected before eccentrics' })
sel({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'pup2_pattern', applies: { phase: 'assisted_transition' }, rule: { primary: 'assisted_one_arm_pull', support: ['two_arm_vertical_pull', 'two_arm_bodyweight_row', 'scapula_pulls', 'two_arm_hang', 'external_rotation', 'bicep_curl'] }, ev: 'Phase 2 pattern selected' })
progr({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'pup2_band_decrement', applies: { phase: 'assisted_transition' }, rule: { progressBy: 'reduce_band_assist_or_increase_reps' }, ev: 'Assisted one-arm progressed by reducing band assistance' })
rx({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'pup2_primary_rest', applies: { phase: 'assisted_transition', exerciseRole: 'primary' }, rule: { restMinSec: 180, restMaxSec: 300 }, ev: 'Primary assisted one-arm pulls use 3-5 minute rest' })
rx({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'pup2_support_rest', applies: { phase: 'assisted_transition', exerciseRole: 'support' }, rule: { restSec: 180 }, ev: 'Two-arm vertical and rows held as support with 3 min rest' })
meth({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'pup2_eccentric_blocked', applies: { phase: 'assisted_transition' }, rule: { blockMethods: ['one_arm_eccentric_low_rep_long_rest'] }, ev: 'Eccentric one-arm still gated until advanced readiness' })
meth({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'pup2_scap_required', applies: { phase: 'assisted_transition' }, rule: { include: ['scapula_pulls'] }, ev: 'Scapula pulls included as essential support' })
carry({ src: PUP2, fam: 'one_arm_pull_up_transition', sourceKey: 'assisted_one_arm_pull', targetSkill: 'one_arm_pull_up', type: 'direct', strength: 0.8, ev: 'Assisted one-arm directly trains the target pattern' })
progr({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'pup2_advance_gate', applies: { phase: 'assisted_transition' }, rule: { advanceWhen: { assistedOneArmReps: '>=3_per_side_minimal_band' } }, ev: 'Phase 3 unlocked once assisted reps stabilize' })
sel({ src: PUP2, fam: 'one_arm_pull_up_transition', key: 'pup2_avoid_churn', applies: { phase: 'assisted_transition' }, rule: { exerciseChurn: 'avoid' }, ev: 'Exercise churn avoided to preserve adaptation' })

// ===== 3. PUP Phase 3 (>=12) =====
p({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'phase_3_eccentric', title: 'Phase 3 unlocks one-arm eccentrics, rows, and hangs', sum: 'Advanced pulling readiness allows high-stress eccentric exposure to push the one-arm pattern toward concentric.', w: 2, ev: 'Eccentric one-arm work gated to advanced readiness' })
sel({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_three_exposures', applies: { phase: 'advanced_eccentric' }, rule: { primary: ['one_arm_eccentric', 'one_arm_bodyweight_row', 'one_arm_hang'], support: ['assisted_one_arm', 'external_rotation', 'bicep_curl'] }, ev: 'Phase 3 selected three direct exposures plus support' })
rx({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_eccentric_dosage', applies: { phase: 'advanced_eccentric', method: 'eccentric' }, rule: { reps: { min: 1, max: 3 }, lowerSec: { min: 5, max: 8 }, sets: { min: 3, max: 5 }, restMinSec: 240 }, ev: 'Eccentric tempo used only when method calls for it' })
rx({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_long_rest', applies: { phase: 'advanced_eccentric', exerciseRole: 'primary' }, rule: { restMinSec: 240, restMaxSec: 360 }, ev: 'High-stress one-arm work uses long rest' })
meth({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_volume_cap', applies: { phase: 'advanced_eccentric' }, rule: { dailyMaxOneArmEccentricSets: 5, weeklyMaxSessions: 2 }, t: 'hard_constraint', ev: 'One-arm eccentric volume capped to manage stress' })
meth({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_pain_blocks', applies: { phase: 'advanced_eccentric', signal: 'elbow_or_shoulder_pain' }, rule: { blockMethods: ['eccentric'], substitute: 'assisted_one_arm' }, t: 'hard_constraint', ev: 'Pain pulls athlete back to assisted progression' })
progr({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_progression', applies: { phase: 'advanced_eccentric' }, rule: { progressBy: 'extend_eccentric_duration_or_reduce_band' }, ev: 'Progression from eccentric duration before adding load' })
carry({ src: PUP3, fam: 'one_arm_pull_up_advanced', sourceKey: 'one_arm_eccentric', targetSkill: 'one_arm_pull_up', type: 'direct', strength: 0.95, ev: 'One-arm eccentric is the most direct preparation' })
carry({ src: PUP3, fam: 'one_arm_pull_up_advanced', sourceKey: 'one_arm_bodyweight_row', targetSkill: 'one_arm_pull_up', type: 'direct', strength: 0.7, ev: 'One-arm row builds unilateral pulling under load' })
carry({ src: PUP3, fam: 'one_arm_pull_up_advanced', sourceKey: 'one_arm_hang', targetSkill: 'one_arm_pull_up', type: 'support', strength: 0.65, ev: 'One-arm hang builds grip and shoulder integrity' })
sel({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_external_rotation', applies: { phase: 'advanced_eccentric' }, rule: { include: ['external_rotation', 'bicep_curl'] }, ev: 'Rotator cuff and bicep support retained' })
sel({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_phase_gate', applies: { selectedSkill: 'one_arm_pull_up' }, rule: { selectPhase: { foundation: 'pulling_readiness < intermediate', assisted: 'intermediate', eccentric: 'advanced' } }, t: 'hard_constraint', ev: 'One-arm pull phase gated by pulling readiness' })
p({ src: PUP3, fam: 'one_arm_pull_up_advanced', key: 'pup3_negative_vs_normal', title: 'Slow eccentrics are a method, not the default', sum: 'Normal lowering is controlled but not ultra-slow unless the prescribed method calls for it.', w: 1, ev: 'Eccentric tempo used only when method calls for it' })

// ===== 4. MZ Weighted Guide (>=16) =====
p({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_pullup_dip_foundation', title: 'Pull-ups and dips are foundational to weighted calisthenics', sum: 'Weighted dips/pull-ups build strength/muscle and carry over to skills and powerlifting basics.', w: 2, ev: 'Weighted basics support skill strength but do not replace direct skill work' })
p({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_quality_first', title: 'Form quality precedes load', sum: 'Form standards are non-negotiable before adding external load.', w: 2, t: 'hard_constraint', ev: 'Pull-up standard enforced for strength progression' })
meth({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_pullup_form', applies: { exercise: 'pull_up' }, rule: { startStraightArms: true, finishChinOverBar: true, gripWidth: 'about_1_5x_shoulder_overhand', initiation: 'fast_lats_arms_slight_back_path', lowering: 'controlled_to_lockout' }, t: 'hard_constraint', ev: 'Pull-up form standard enforced for weighted progression' })
meth({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_pullup_anti', applies: { exercise: 'pull_up' }, rule: { forbid: ['jump_start', 'bent_arm_start', 'no_chin_over_bar', 'kipping', 'uncontrolled_swing'] }, t: 'hard_constraint', ev: 'Bad pull-up patterns reduce or block load' })
meth({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_dip_form', applies: { exercise: 'dip' }, rule: { startStraightArms: true, lowerToFullDepth: true, controlled: true, noBouncing: true }, t: 'hard_constraint', ev: 'Dip standard enforced for weighted progression' })
meth({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_load_control', applies: { method: 'weighted_calisthenics' }, rule: { invalidateRepIf: 'load_swings_or_form_breaks', fix: ['reduce_load', 'change_setup'] }, t: 'hard_constraint', ev: 'Weighted pull-up load controlled before progression' })
meth({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_normal_lower', applies: { exercise: ['pull_up', 'dip'], method: 'standard_load' }, rule: { lowering: 'controlled_not_ultra_slow' }, ev: 'Eccentric tempo used only when method calls for it' })
sel({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_grip_default', applies: { exercise: 'pull_up' }, rule: { grip: 'overhand', width: '~1.5x_shoulder' }, ev: 'Default weighted pull-up grip set' })
progr({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_load_progression', applies: { method: 'weighted_calisthenics' }, rule: { progressLoadOnlyIf: 'all_reps_clean', otherwise: 'hold_load_or_drop_reps' }, ev: 'Load progresses only when reps remain clean' })
progr({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_band_taper', applies: { phase: 'transitional', cannotMeetReps: true }, rule: { useBands: true, taperBy: 'session_or_microcycle' }, ev: 'Bands taper when athlete cannot meet rep target' })
rx({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_strength_range', applies: { method: 'weighted_calisthenics', goal: 'strength' }, rule: { reps: { min: 3, max: 6 }, sets: { min: 3, max: 5 }, restMinSec: 180 }, ev: 'Strength rep range with long rest assigned' })
rx({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_hyper_range', applies: { method: 'weighted_calisthenics', goal: 'hypertrophy' }, rule: { reps: { min: 6, max: 10 }, sets: { min: 3, max: 5 }, restMinSec: 120 }, ev: 'Hypertrophy rep range assigned for weighted basics' })
carry({ src: MZW, fam: 'weighted_calisthenics_form_standards', sourceKey: 'weighted_pull_up', targetSkill: 'one_arm_pull_up', type: 'support', strength: 0.55, ev: 'Weighted pull-up carries strength toward unilateral pull' })
carry({ src: MZW, fam: 'weighted_calisthenics_form_standards', sourceKey: 'weighted_dip', targetSkill: 'planche', type: 'support', strength: 0.5, ev: 'Weighted dip carries pressing capacity toward planche' })
sel({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_skill_priority', applies: { selectedSkillCount: '>=1', method: 'weighted_calisthenics' }, rule: { keepDirectSkillExposure: true, weightedAsSupport: true }, t: 'hard_constraint', ev: 'Weighted basics support skill strength but do not replace direct skill work' })
p({ src: MZW, fam: 'weighted_calisthenics_form_standards', key: 'wc_streetlift_carry', title: 'Streetlifting basics carry to skills and powerlifting', sum: 'Pull-up/dip strength is broadly transferable when form standards are maintained.', w: 1, ev: 'Streetlifting carryover noted' })

// ===== 5. MZ Duplicate (>=4) =====
p({ src: MZD, fam: 'weighted_calisthenics_duplicate', key: 'wcd_confirmed', title: 'Duplicate source confirms weighted form standards', sum: 'A second source aligns with the same pull-up/dip form/load standards.', w: 1, ev: 'Duplicate weighted source confirmed standards without duplicating volume' })
p({ src: MZD, fam: 'weighted_calisthenics_duplicate', key: 'wcd_no_block_dup', title: 'Duplicate source must not duplicate visible blocks', sum: 'Confirmation only raises confidence/provenance, never doubles exercise prescriptions.', w: 2, t: 'hard_constraint', ev: 'Duplicate source confirmed doctrine without duplicating blocks' })
sel({ src: MZD, fam: 'weighted_calisthenics_duplicate', key: 'wcd_no_dup_sel', applies: { duplicateSourceMatch: true }, rule: { effect: 'increase_confidence_only', duplicateExerciseInsertion: 'forbidden' }, t: 'hard_constraint', ev: 'Duplicate source did not insert exercises' })
progr({ src: MZD, fam: 'weighted_calisthenics_duplicate', key: 'wcd_confidence', applies: { duplicateSourceMatch: true }, rule: { confidenceMultiplier: 1.15 }, ev: 'Duplicate source raised standards confidence' })

// ===== 6. BWS 5-Day (>=12) =====
p({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_two_rest', title: '5-day full body requires at least 2 rest days', sum: 'Day-of-week placement matters less than spacing two recovery days into the week.', w: 2, t: 'hard_constraint', ev: '5-day full-body selected only when recovery/time supports it' })
p({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_acclimation', title: 'First two weeks avoid pushing close to failure', sum: 'Allow soreness to settle before adding intensity.', w: 2, ev: 'First two weeks capped for acclimation' })
sel({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_distribution', applies: { template: '5_day_full_body' }, rule: { weeklyPattern: 'squat_press_curl_pull_hinge_row_calf_dip_lateral_raise' }, ev: '5-day full-body distribution applied' })
sel({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_alternatives', applies: { template: '5_day_full_body', limitation: ['equipment', 'injury', 'preference'] }, rule: { allowAlternatives: true, randomNovelty: 'forbidden' }, ev: 'Exercise alternative chosen due to equipment/limitation' })
rx({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_acc_rir', applies: { template: '5_day_full_body', week: { min: 1, max: 2 } }, rule: { rir: { min: 2, max: 4 }, avoidFailure: true }, ev: 'Weeks 1-2 use higher RIR cap' })
rx({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_post_acc', applies: { template: '5_day_full_body', week: { min: 3 } }, rule: { rir: { min: 0, max: 2 }, addLoad: true }, ev: 'Post-acclimation pushes closer to failure' })
progr({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_progression', applies: { template: '5_day_full_body' }, rule: { progressBy: ['add_reps', 'add_load_when_top_set_clean'] }, ev: 'Progression adds reps then load' })
meth({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_skill_priority', applies: { template: '5_day_full_body', selectedSkillCount: '>=1' }, rule: { traditionalDoesNotReplaceSkills: true, addSkillSession: true }, t: 'hard_constraint', ev: 'Hypertrophy structure preserved skill priority' })
meth({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_readiness', applies: { template: '5_day_full_body' }, rule: { requireSchedule: '5_days_available', requireRecovery: 'normal_or_better' }, t: 'hard_constraint', ev: '5-day full-body selected only when recovery/time supports it' })
sel({ src: BWS5, fam: 'traditional_hypertrophy_full_body', key: 'bws5_no_churn', applies: { template: '5_day_full_body' }, rule: { weeklyExerciseChurn: 'avoid' }, ev: 'Stable exercise selection across weeks' })
carry({ src: BWS5, fam: 'traditional_hypertrophy_full_body', sourceKey: 'overhead_press', targetSkill: 'handstand_push_up', type: 'support', strength: 0.4, ev: 'Overhead press carries to vertical pressing skills' })
carry({ src: BWS5, fam: 'traditional_hypertrophy_full_body', sourceKey: 'pull_up', targetSkill: 'one_arm_pull_up', type: 'support', strength: 0.45, ev: 'Pull-up volume carries toward one-arm pull' })

// ===== 7. Lever Pro (>=22) =====
p({ src: LP, fam: 'lever_progression', key: 'lp_systematic', title: 'Levers require systematic, patient progression', sum: 'Smart, leverage-based progression beats hurried band drops or premature full-lay attempts.', w: 2, ev: 'Lever skill represented directly' })
p({ src: LP, fam: 'lever_progression', key: 'lp_individual_factors', title: 'Lever progress depends on many individual factors', sum: 'Height, weight, training age, injury history, sleep, mobility, and pulling/pushing strength all gate lever progress.', w: 1, ev: 'Lever progress recognized as individual' })
p({ src: LP, fam: 'lever_progression', key: 'lp_bl_biceps', title: 'Rushing back lever raises biceps injury risk', sum: 'Back lever loads biceps in lengthened position; rushing volume is a specific injury hazard.', w: 2, t: 'hard_constraint', ev: 'Back lever progressed cautiously to protect biceps' })
sel({ src: LP, fam: 'lever_progression', key: 'lp_fl_direct', applies: { selectedSkill: 'front_lever' }, rule: { include: ['front_lever_hold', 'front_lever_pull_dynamic', 'front_lever_eccentric', 'banded_front_lever_hold'] }, t: 'hard_constraint', ev: 'Lever skill represented directly' })
sel({ src: LP, fam: 'lever_progression', key: 'lp_bl_direct', applies: { selectedSkill: 'back_lever' }, rule: { include: ['back_lever_hold', 'back_lever_pull_dynamic', 'back_lever_eccentric', 'banded_back_lever_hold'] }, t: 'hard_constraint', ev: 'Lever skill represented directly' })
rx({ src: LP, fam: 'lever_progression', key: 'lp_iso_strength', applies: { method: 'isometric', intent: 'strength' }, rule: { holdSec: { min: 8, max: 12 }, sets: { min: 3, max: 5 }, restSec: 180 }, ev: 'Lever hold duration matched training intent' })
rx({ src: LP, fam: 'lever_progression', key: 'lp_iso_volume', applies: { method: 'isometric', intent: 'volume_endurance_resilience' }, rule: { holdSec: { min: 15, max: 30 }, sets: { min: 2, max: 4 }, restSec: 120 }, ev: 'Lever hold duration matched training intent' })
rx({ src: LP, fam: 'lever_progression', key: 'lp_eccentric', applies: { method: 'eccentric', skill: ['front_lever', 'back_lever'] }, rule: { reps: { min: 3, max: 5 }, lowerSec: { min: 5, max: 8 }, sets: { min: 3, max: 5 }, restSec: 180 }, ev: 'Lever eccentric dosage capped for stress' })
rx({ src: LP, fam: 'lever_progression', key: 'lp_band_hold', applies: { method: 'banded_hold', skill: ['front_lever', 'back_lever'] }, rule: { holdSec: { min: 15, max: 30 }, sets: { min: 2, max: 4 }, restSec: 90 }, ev: 'Banded lever holds use moderate hold and short rest' })
meth({ src: LP, fam: 'lever_progression', key: 'lp_sequencing', applies: { skill: ['front_lever', 'back_lever'] }, rule: { sessionOrder: ['direct_isometric', 'dynamics_eccentrics', 'accessories_carryover'] }, ev: 'Lever session ordered direct skill before accessories' })
meth({ src: LP, fam: 'lever_progression', key: 'lp_frequency', applies: { skill: ['front_lever', 'back_lever'] }, rule: { sessionsPerWeek: { min: 3, max: 4 }, avoidConsecutiveSameFocus: true }, t: 'hard_constraint', ev: 'Lever frequency protected by recovery spacing' })
meth({ src: LP, fam: 'lever_progression', key: 'lp_band_use', applies: { method: 'banded_hold' }, rule: { useWhen: 'cannot_hold_full_lay', taperBand: 'over_microcycle' }, ev: 'Bands used as graded assistance, not random' })
progr({ src: LP, fam: 'lever_progression', key: 'lp_leverage', applies: { skill: ['front_lever', 'back_lever'] }, rule: { progressBy: ['decrease_leverage_via_extending_body', 'increase_hold_duration', 'reduce_band_assist'] }, ev: 'Leverage progression elongates body to add load' })
progr({ src: LP, fam: 'lever_progression', key: 'lp_fl_prereq', applies: { skill: 'front_lever' }, rule: { requirePullingStrength: 'intermediate', requireScapStrength: 'intermediate' }, ev: 'Front lever gated by pulling readiness' })
progr({ src: LP, fam: 'lever_progression', key: 'lp_bl_prereq', applies: { skill: 'back_lever' }, rule: { requireShoulderExtensionMobility: 'safe', requireBicepConditioning: 'present' }, t: 'hard_constraint', ev: 'Back lever gated by shoulder mobility and bicep conditioning' })
sel({ src: LP, fam: 'lever_progression', key: 'lp_fl_scap', applies: { skill: 'front_lever' }, rule: { scapulaCue: 'retracted_depressed' }, ev: 'Lever scapula cue matched selected skill' })
sel({ src: LP, fam: 'lever_progression', key: 'lp_bl_scap', applies: { skill: 'back_lever' }, rule: { scapulaCue: 'protracted_depressed' }, ev: 'Lever scapula cue matched selected skill' })
sel({ src: LP, fam: 'lever_progression', key: 'lp_supplementary', applies: { skill: ['front_lever', 'back_lever'] }, rule: { supplementary: ['scap_pulls', 'scap_push_ups', 'reverse_hyper', 'curl_for_bl', 'tricep_kickback_for_fl'] }, ev: 'Supplementary work reduces ache risk' })
carry({ src: LP, fam: 'lever_progression', sourceKey: 'front_lever_pulldown', targetSkill: 'front_lever', type: 'carryover', strength: 0.6, ev: 'Front lever pulldown carries toward front lever' })
carry({ src: LP, fam: 'lever_progression', sourceKey: 'back_lever_pulldown', targetSkill: 'back_lever', type: 'carryover', strength: 0.6, ev: 'Back lever pulldown carries toward back lever' })
carry({ src: LP, fam: 'lever_progression', sourceKey: 'dragon_flag', targetSkill: 'front_lever', type: 'support', strength: 0.55, ev: 'Dragon flag supports front lever core demand' })
carry({ src: LP, fam: 'lever_progression', sourceKey: 'reverse_hyper', targetSkill: 'back_lever', type: 'support', strength: 0.4, ev: 'Reverse hyper supports back lever posterior chain' })

// ===== 8. Lever Pro 4x (>=16) =====
p({ src: LP4, fam: 'lever_4x_split', key: 'lp4_separated', title: '4x BL/FL split separates back-lever and front-lever exposures', sum: 'When training both levers four days per week, BL and FL get separate days with rest spacing.', w: 2, ev: 'Back lever and front lever split across week' })
sel({ src: LP4, fam: 'lever_4x_split', key: 'lp4_weekly', applies: { selectedSkills: ['front_lever', 'back_lever'], availableDays: 4 }, rule: { schedule: 'BL_FL_REST_BL_FL_REST_REST' }, ev: '4x BL/FL split scheduled' })
sel({ src: LP4, fam: 'lever_4x_split', key: 'lp4_bl_session', applies: { sessionFocus: 'back_lever' }, rule: { exercises: ['back_lever_hold', 'back_lever_eccentric', 'banded_back_lever_hold', 'reverse_hyper', 'back_lever_pulldown', 'scap_push_up', 'bicep_curl'] }, ev: 'Back lever session pattern selected' })
sel({ src: LP4, fam: 'lever_4x_split', key: 'lp4_fl_session', applies: { sessionFocus: 'front_lever' }, rule: { exercises: ['front_lever_hold', 'front_lever_pull', 'banded_front_lever_hold', 'dragon_flag', 'horizontal_scap_pull', 'front_lever_pulldown', 'tricep_kickback'] }, ev: 'Front lever session pattern selected' })
rx({ src: LP4, fam: 'lever_4x_split', key: 'lp4_hold', applies: { method: 'lever_hold' }, rule: { holdSec: { min: 8, max: 15 }, sets: { min: 3, max: 5 }, restSec: 180 }, ev: 'Lever hold dosage assigned for weekly program' })
rx({ src: LP4, fam: 'lever_4x_split', key: 'lp4_pull_ecc', applies: { method: 'lever_pull_or_eccentric' }, rule: { reps: { min: 3, max: 6 }, sets: { min: 3, max: 5 }, restSec: 180 }, ev: 'Lever pull/eccentric dosage assigned' })
rx({ src: LP4, fam: 'lever_4x_split', key: 'lp4_band_hold', applies: { method: 'banded_lever_hold' }, rule: { holdSec: { min: 15, max: 30 }, sets: { min: 2, max: 4 }, restSec: 90 }, ev: 'Banded lever hold dosage assigned' })
rx({ src: LP4, fam: 'lever_4x_split', key: 'lp4_acc_rest', applies: { exerciseRole: 'accessory' }, rule: { reps: { min: 8, max: 15 }, restSec: { min: 60, max: 90 } }, ev: 'Accessories use shorter rest and higher reps' })
progr({ src: LP4, fam: 'lever_4x_split', key: 'lp4_weekly_progression', applies: { template: '4x_bl_fl' }, rule: { progressBy: ['add_set', 'add_rep', 'reduce_band'] }, ev: 'Weekly progression adds sets/reps before adding leverage' })
meth({ src: LP4, fam: 'lever_4x_split', key: 'lp4_no_consec', applies: { template: '4x_bl_fl' }, rule: { blockConsecutiveSameFocus: true }, t: 'hard_constraint', ev: 'Same-focus consecutive sessions blocked' })
meth({ src: LP4, fam: 'lever_4x_split', key: 'lp4_sequencing', applies: { sessionFocus: ['front_lever', 'back_lever'] }, rule: { order: ['hold', 'pull_or_eccentric', 'banded_hold_or_accessories'] }, ev: 'Lever session ordered direct skill before accessories' })
sel({ src: LP4, fam: 'lever_4x_split', key: 'lp4_bl_acc', applies: { sessionFocus: 'back_lever' }, rule: { accessories: ['reverse_hyper', 'back_lever_pulldown', 'scap_push_up', 'bicep_curl'] }, ev: 'Lever accessories mapped to selected skill' })
sel({ src: LP4, fam: 'lever_4x_split', key: 'lp4_fl_acc', applies: { sessionFocus: 'front_lever' }, rule: { accessories: ['dragon_flag', 'horizontal_scap_pull', 'front_lever_pulldown', 'tricep_kickback'] }, ev: 'Lever accessories mapped to selected skill' })
carry({ src: LP4, fam: 'lever_4x_split', sourceKey: 'banded_front_lever_hold', targetSkill: 'front_lever', type: 'direct', strength: 0.7, ev: 'Banded FL hold trains FL position directly' })
carry({ src: LP4, fam: 'lever_4x_split', sourceKey: 'banded_back_lever_hold', targetSkill: 'back_lever', type: 'direct', strength: 0.7, ev: 'Banded BL hold trains BL position directly' })
p({ src: LP4, fam: 'lever_4x_split', key: 'lp4_carry_constrained', title: 'Carryover replaces direct exposure only when constrained', sum: 'If readiness/time forces removing direct lever holds, use carryover with explicit support label.', w: 1, ev: 'Lever represented through carryover due to constraint' })

// ===== 9. BWS 4-Day Upper/Lower (>=14) =====
p({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_balance', title: '4-day upper/lower balances gains and time', sum: 'Two upper and two lower sessions per week with 3+ rest days.', w: 1, ev: 'Upper/lower schedule protected by rest spacing' })
p({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_max_two', title: 'No more than two workout days in a row', sum: 'Recovery quality requires spacing.', w: 2, t: 'hard_constraint', ev: 'Upper/lower schedule protected by rest spacing' })
p({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_rest_after_lower', title: 'Rest day ideally follows lower session', sum: 'Lower-day fatigue benefits most from a following rest day.', w: 1, ev: '4-day upper/lower placed rest after lower' })
sel({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_upper_pattern', applies: { sessionType: 'upper' }, rule: { exercises: ['incline_press', 'pull_up', 'lateral_raise', 'chest_supported_row', 'banded_push_up', 'bench_press', 'cable_row', 'overhead_press', 'fly', 'curl', 'face_pull'] }, ev: 'Upper session pattern selected' })
sel({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_lower_pattern', applies: { sessionType: 'lower' }, rule: { exercises: ['squat', 'rdl_or_deadlift', 'leg_extension', 'calf_raise', 'pallof_press', 'lunge', 'leg_curl', 'bird_dog'] }, ev: 'Lower session pattern selected' })
sel({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_alternatives', applies: { template: '4_day_upper_lower', limitation: ['equipment', 'injury', 'preference'] }, rule: { allowAlternatives: true, randomNovelty: 'forbidden' }, ev: 'Exercise alternative chosen due to equipment/limitation' })
rx({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_acc_rir', applies: { template: '4_day_upper_lower', week: { min: 1, max: 2 } }, rule: { rir: { min: 2, max: 4 } }, ev: 'First two weeks capped for acclimation' })
rx({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_post_acc', applies: { template: '4_day_upper_lower', week: { min: 3 } }, rule: { rir: { min: 0, max: 2 }, addLoad: true }, ev: 'Post-acclimation pushes closer to failure' })
progr({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_progression', applies: { template: '4_day_upper_lower' }, rule: { progressBy: ['add_reps', 'add_load_when_top_set_clean'] }, ev: 'Progression adds reps then load' })
meth({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_three_rest', applies: { template: '4_day_upper_lower' }, rule: { weeklyRestDays: { min: 3 } }, t: 'hard_constraint', ev: 'Upper/lower schedule protected by rest spacing' })
meth({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_skill_priority', applies: { template: '4_day_upper_lower', selectedSkillCount: '>=1' }, rule: { traditionalDoesNotReplaceSkills: true, addSkillSession: true }, t: 'hard_constraint', ev: 'Hypertrophy structure preserved skill priority' })
sel({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', key: 'bws4_no_churn', applies: { template: '4_day_upper_lower' }, rule: { weeklyExerciseChurn: 'avoid' }, ev: 'Stable exercise selection across weeks' })
carry({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', sourceKey: 'pull_up', targetSkill: 'one_arm_pull_up', type: 'support', strength: 0.4, ev: 'Upper-day pull-up volume supports unilateral pull' })
carry({ src: BWS4, fam: 'traditional_hypertrophy_upper_lower', sourceKey: 'rdl_or_deadlift', targetSkill: 'pistol_squat', type: 'support', strength: 0.3, ev: 'Lower posterior-chain volume supports unilateral squat' })

// ===== PUBLIC ACCESSORS =====
export const BATCH_04_KEY = 'batch_04' as const

export function getBatch04Sources(): DoctrineSource[] { return BATCH_04_SOURCES }
export function getBatch04Principles(): DoctrinePrinciple[] { return BATCH_04_PRINCIPLES }
export function getBatch04ProgressionRules(): ProgressionRule[] { return BATCH_04_PROGRESSION }
export function getBatch04MethodRules(): MethodRule[] { return BATCH_04_METHOD }
export function getBatch04PrescriptionRules(): PrescriptionRule[] { return BATCH_04_PRESCRIPTION }
export function getBatch04ExerciseSelectionRules(): ExerciseSelectionRule[] { return BATCH_04_SELECTION }
export function getBatch04CarryoverRules(): CarryoverRule[] { return BATCH_04_CARRYOVER }
export function getBatch04Counts() {
  return {
    sources: BATCH_04_SOURCES.length,
    principles: BATCH_04_PRINCIPLES.length,
    progression: BATCH_04_PROGRESSION.length,
    method: BATCH_04_METHOD.length,
    prescription: BATCH_04_PRESCRIPTION.length,
    selection: BATCH_04_SELECTION.length,
    carryover: BATCH_04_CARRYOVER.length,
    total:
      BATCH_04_PRINCIPLES.length +
      BATCH_04_PROGRESSION.length +
      BATCH_04_METHOD.length +
      BATCH_04_PRESCRIPTION.length +
      BATCH_04_SELECTION.length +
      BATCH_04_CARRYOVER.length,
  }
}
export function getBatch04CountsBySource(): Record<string, number> {
  const all = [...BATCH_04_PRINCIPLES, ...BATCH_04_PROGRESSION, ...BATCH_04_METHOD, ...BATCH_04_PRESCRIPTION, ...BATCH_04_SELECTION, ...BATCH_04_CARRYOVER] as Array<{ source_id?: string }>
  const out: Record<string, number> = {}
  for (const r of all) { const sid = r.source_id ?? 'unknown'; out[sid] = (out[sid] ?? 0) + 1 }
  return out
}
export function getBatch04ProvenanceFor(atomId: string): { batch: 'batch_04'; sourceId: string | null } | null {
  const all: Array<{ id?: string; source_id?: string }> = [...BATCH_04_PRINCIPLES, ...BATCH_04_PROGRESSION, ...BATCH_04_METHOD, ...BATCH_04_PRESCRIPTION, ...BATCH_04_SELECTION, ...BATCH_04_CARRYOVER]
  const hit = all.find(r => r.id === atomId)
  if (!hit) return null
  return { batch: 'batch_04', sourceId: hit.source_id ?? null }
}
