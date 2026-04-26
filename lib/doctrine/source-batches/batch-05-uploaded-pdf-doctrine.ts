/**
 * UPLOADED PDF DOCTRINE — BATCH 05
 *
 * Pure source-data file. Mirrors Batch 1/2/3/4 layout exactly so the runtime
 * contract, builder, save/load, and Program UI stay untouched.
 *
 * Sources covered (9):
 *   1. BL/FL 3x Weekly Training        — LP3
 *   2. Gladiolus 6-Day PPL Arnold      — G6
 *   3. Gladiolus 5-Day PPL Upper/Lower — G5
 *   4. Gladiolus 4-Day P/P/L/Sh-Arms   — G4
 *   5. Gladiolus 3-Day Full Body U/L   — G3
 *   6. Monster Maker Total Body        — MM
 *   7. Nicky Lyan Actual Get Better    — NLT (theory/recovery)
 *   8. Nicolas Lyan How to Start       — NLS (foundations)
 *   9. Nicky Lyan Master the Handstand — NLH
 *
 * Provenance: derived_from_prompt_section_5_summary; evidence_snippet null
 * (raw PDFs not attached this turn). Recorded honestly per atom.
 *
 * Runtime rule: consumed only via `./index.ts` aggregator. The runtime
 * contract decides DB-vs-fallback per-batch and merges; this file never
 * decides generation directly.
 *
 * Atom count: 140 (≥ minimum 140) across 7 categories.
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
export const BATCH_05_SOURCES: DoctrineSource[] = [
  { id: 'src_batch_05_bl_fl_3x_weekly',          source_key: 'bl_fl_3x_weekly_training_uploaded_pdf_batch_05',                title: 'BL/FL 3x Weekly Training',           confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_05_gladiolus_6day_ppl_arnold', source_key: 'gladiolus_6_day_ppl_arnold_uploaded_pdf_batch_05',              title: 'Gladiolus 6-Day PPL Arnold',         confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_05_gladiolus_5day_ppl_ul',     source_key: 'gladiolus_5_day_ppl_upper_lower_uploaded_pdf_batch_05',         title: 'Gladiolus 5-Day PPL + Upper/Lower',  confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_05_gladiolus_4day_ppl_sh',     source_key: 'gladiolus_4_day_push_pull_legs_shoulders_arms_uploaded_pdf_batch_05', title: 'Gladiolus 4-Day P/P/L/Sh-Arms', confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_05_gladiolus_3day_fb_ul',      source_key: 'gladiolus_3_day_full_body_upper_lower_uploaded_pdf_batch_05',   title: 'Gladiolus 3-Day Full Body + U/L',    confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_05_monster_maker',             source_key: 'monster_maker_total_body_muscle_building_uploaded_pdf_batch_05', title: 'Monster Maker Total Body',           confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_05_nl_theory',                 source_key: 'nicky_lyan_actual_get_better_calisthenics_uploaded_pdf_batch_05', title: 'Nicky Lyan: Actually Get Better',    confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_05_nl_start',                  source_key: 'nicolas_lyan_how_to_start_calisthenics_uploaded_pdf_batch_05',   title: 'Nicolas Lyan: How to Start',         confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
  { id: 'src_batch_05_nl_handstand',              source_key: 'nicky_lyan_master_the_handstand_uploaded_pdf_batch_05',          title: 'Nicky Lyan: Master the Handstand',   confidence_tier: 'high', is_active: true } as unknown as DoctrineSource,
]

const LP3 = 'src_batch_05_bl_fl_3x_weekly'
const G6  = 'src_batch_05_gladiolus_6day_ppl_arnold'
const G5  = 'src_batch_05_gladiolus_5day_ppl_ul'
const G4  = 'src_batch_05_gladiolus_4day_ppl_sh'
const G3  = 'src_batch_05_gladiolus_3day_fb_ul'
const MM  = 'src_batch_05_monster_maker'
const NLT = 'src_batch_05_nl_theory'
const NLS = 'src_batch_05_nl_start'
const NLH = 'src_batch_05_nl_handstand'

const COMMON_TAGS = { provenance: 'derived_from_prompt_section_5_summary', evidence_snippet: null }

const BATCH_05_PRINCIPLES: DoctrinePrinciple[] = []
const BATCH_05_PROGRESSION: ProgressionRule[] = []
const BATCH_05_METHOD: MethodRule[] = []
const BATCH_05_PRESCRIPTION: PrescriptionRule[] = []
const BATCH_05_SELECTION: ExerciseSelectionRule[] = []
const BATCH_05_CARRYOVER: CarryoverRule[] = []

let _n = 0
const nid = (pfx: string) => `${pfx}_b05_${String(++_n).padStart(3, '0')}`

type AddP = { src: string; fam: string; key: string; title: string; sum: string; w?: number; t?: 'hard_constraint' | 'soft_preference' | 'recommendation'; ev: string }
function p(a: AddP) {
  BATCH_05_PRINCIPLES.push({ id: nid('pr'), source_id: a.src, doctrine_family: a.fam, principle_key: a.key, principle_title: a.title, principle_summary: a.sum, safety_priority: a.w ?? 1, priority_type: a.t ?? 'soft_preference', is_base_intelligence: true, is_phase_modulation: false, applies_when_json: {}, does_not_apply_when_json: {}, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as DoctrinePrinciple)
}
type AddR = { src: string; fam: string; key: string; applies: Record<string, unknown>; rule: Record<string, unknown>; ev: string; t?: 'hard_constraint' | 'soft_preference' | 'recommendation' }
function progr(a: AddR) { BATCH_05_PROGRESSION.push({ id: nid('prog'), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? 'soft_preference', tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as ProgressionRule) }
function meth(a: AddR) { BATCH_05_METHOD.push({ id: nid('meth'), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? 'soft_preference', tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as MethodRule) }
function rx(a: AddR) { BATCH_05_PRESCRIPTION.push({ id: nid('rx'), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? 'soft_preference', tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as PrescriptionRule) }
function sel(a: AddR) { BATCH_05_SELECTION.push({ id: nid('sel'), source_id: a.src, doctrine_family: a.fam, rule_key: a.key, applies_when_json: a.applies, rule_json: a.rule, priority_type: a.t ?? 'soft_preference', tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as ExerciseSelectionRule) }
type AddC = { src: string; fam: string; sourceKey: string; targetSkill: string; type: string; strength: number; ev: string }
function carry(a: AddC) { BATCH_05_CARRYOVER.push({ id: nid('carry'), source_id: a.src, doctrine_family: a.fam, source_exercise_or_skill_key: a.sourceKey, target_skill_key: a.targetSkill, carryover_type: a.type, carryover_strength: a.strength, tags_json: { ...COMMON_TAGS, userVisibleEvidenceLabel: a.ev } } as unknown as CarryoverRule) }

// =====================================================================
// 1. BL/FL 3x Weekly Training (LP3) — 18 atoms
// =====================================================================
p({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_direct_expression', title: 'BL/FL must be expressed directly when selected and ready', sum: 'When back/front lever is selected and readiness allows, direct holds, pulls, eccentrics, or banded direct work appear in the program.', w: 2, ev: 'Lever skill represented directly' })
p({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_three_day_distribution', title: 'BL/FL stress distributed across the 3-day week', sum: 'Lever exposures are distributed across all three weekly sessions instead of stacked into one fatigue spike.', w: 2, ev: 'BL/FL exposure distributed across 3 weekly sessions' })
p({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_accessory_role', title: 'Lever accessories are support, not skill', sum: 'Reverse hyper, dragon flag, scap pulls, scap push-ups, biceps and triceps work support the lever pattern but are never relabeled as direct skill work.', w: 1, ev: 'Lever accessories labeled as carryover/support' })
sel({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_direct_pool', applies: { selectedSkills: { includesAny: ['back_lever', 'front_lever'] } }, rule: { directPool: ['back_lever_pull', 'back_lever_hold', 'back_lever_eccentric', 'front_lever_pull', 'front_lever_hold', 'front_lever_eccentric', 'three_sixty_pull', 'banded_lever_hold'] }, ev: 'Lever skill represented directly' })
sel({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_accessory_pool', applies: { selectedSkills: { includesAny: ['back_lever', 'front_lever'] } }, rule: { accessoryPool: ['dragon_flag', 'horizontal_scap_pull', 'scap_push_up', 'reverse_hyper', 'bicep_curl', 'tricep_kickback'], label: 'support_carryover' }, ev: 'Lever accessories labeled as carryover/support' })
sel({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_no_direct_double_session', applies: { availableDays: 3, selectedSkills: { includesAny: ['back_lever', 'front_lever'] } }, rule: { stackingPolicy: 'no_two_lever_pull_or_eccentric_in_same_day' }, ev: 'BL/FL exposure distributed across 3 weekly sessions' })
sel({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_360_pull', applies: { selectedSkills: { includesAny: ['back_lever', 'front_lever'] }, readinessTier: { gte: 'intermediate' } }, rule: { include: ['three_sixty_pull'] }, ev: 'Lever skill represented directly' })
meth({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_main_work_order', applies: { selectedSkills: { includesAny: ['back_lever', 'front_lever'] } }, rule: { sessionOrder: ['direct_skill_isometric_or_pull', 'eccentric_or_dynamic', 'accessory'] }, ev: 'Lever session ordered direct skill before accessories' })
meth({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_no_consecutive_focus', applies: { selectedSkills: { includesAny: ['back_lever', 'front_lever'] }, availableDays: { lte: 4 } }, rule: { consecutiveSameLeverFocus: 'forbidden' }, t: 'hard_constraint', ev: 'Lever frequency protected by recovery spacing' })
meth({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_eccentric_stress_cap', applies: { method: 'lever_eccentric' }, rule: { weeklyMaxSessions: 2, dailyMaxSets: 4 }, t: 'hard_constraint', ev: 'Lever eccentric stress capped by readiness' })
meth({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_progressive_set_volume', applies: { selectedSkills: { includesAny: ['back_lever', 'front_lever'] } }, rule: { weekProgression: 'increase_set_count_or_hold_seconds_gradually' }, ev: 'Lever set/rep progression scales week over week' })
rx({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_main_rest_3min', applies: { exerciseRole: 'primary_lever_pull_or_hold_or_eccentric' }, rule: { restSec: 180 }, ev: 'Main lever work assigned long-rest skill strength spacing' })
rx({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_iso_dosage', applies: { method: 'lever_isometric' }, rule: { holdSec: { strengthRange: [8, 15], volumeRange: [10, 20] } }, ev: 'Lever hold duration matched training intent' })
rx({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_pull_dosage', applies: { method: 'lever_pull' }, rule: { reps: { min: 3, max: 6 }, sets: { min: 3, max: 5 } }, ev: 'Lever pulls dosed at 3-6 reps' })
progr({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_eccentric_unlock', applies: { selectedSkills: { includesAny: ['back_lever', 'front_lever'] } }, rule: { unlockEccentricWhen: 'tuck_or_advanced_tuck_hold_>=8s' }, ev: 'Lever eccentric stress capped by readiness' })
progr({ src: LP3, fam: 'bl_fl_three_day_split', key: 'lp3_band_taper', applies: { method: 'banded_lever_hold' }, rule: { taperBy: 'reduce_band_resistance_when_hold_>=15s' }, ev: 'Banded lever hold tapers as athlete advances' })
carry({ src: LP3, fam: 'bl_fl_three_day_split', sourceKey: 'reverse_hyper', targetSkill: 'back_lever', type: 'support', strength: 0.55, ev: 'Lever accessories labeled as carryover/support' })
carry({ src: LP3, fam: 'bl_fl_three_day_split', sourceKey: 'dragon_flag', targetSkill: 'front_lever', type: 'support', strength: 0.7, ev: 'Lever accessories labeled as carryover/support' })

// =====================================================================
// 2. Gladiolus 6-Day PPL Arnold (G6) — 12 atoms
// =====================================================================
p({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_high_freq_gate', title: '6-day PPL/Arnold split requires recovery and time', sum: '6-day high-frequency hypertrophy splits are only selected when schedule, recovery, and explicit hypertrophy goal support that frequency.', w: 2, t: 'hard_constraint', ev: 'High-frequency hypertrophy split selected only when recovery/time supports it' })
p({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_skill_priority_preserved', title: 'Hypertrophy split must preserve selected skill priority', sum: 'Selected calisthenics skills retain direct or labeled carryover representation even inside a 6-day hypertrophy split.', w: 2, t: 'hard_constraint', ev: 'Hypertrophy split supports but does not replace selected skills' })
sel({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_push_day_pool', applies: { split: 'six_day_ppl_arnold', day: 'push' }, rule: { include: ['incline_barbell_press', 'machine_shoulder_press', 'decline_cable_fly', 'skull_crusher', 'lateral_raise', 'overhead_extension', 'bench_press'] }, ev: 'Push day populated from doctrine source' })
sel({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_split_eligibility', applies: { goal: { includesAny: ['hypertrophy', 'hybrid'] }, availableDays: 6, recoveryTier: { gte: 'good' } }, rule: { allowSplit: 'six_day_ppl_arnold' }, ev: 'High-frequency hypertrophy split selected only when recovery/time supports it' })
sel({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_skill_first_blocks', applies: { split: 'six_day_ppl_arnold', selectedSkillCount: { gte: 1 } }, rule: { sessionOrder: ['selected_skill_direct_or_carryover', 'hypertrophy_accessory'] }, ev: 'Hypertrophy split supports but does not replace selected skills' })
meth({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_no_force_six_days', applies: { availableDays: { lt: 6 } }, rule: { blockSplits: ['six_day_ppl_arnold'] }, t: 'hard_constraint', ev: 'High-frequency hypertrophy split selected only when recovery/time supports it' })
meth({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_no_skill_replace', applies: { selectedSkillCount: { gte: 1 } }, rule: { rejectIf: 'split_replaces_direct_skill_with_only_hypertrophy_accessory' }, t: 'hard_constraint', ev: 'Hypertrophy split supports but does not replace selected skills' })
meth({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_volume_distribution', applies: { split: 'six_day_ppl_arnold' }, rule: { volumePerMuscleGroup: { weeklyTouches: { min: 2, max: 3 } } }, ev: 'Volume distributed across high-frequency week' })
rx({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_set_rep_default', applies: { split: 'six_day_ppl_arnold', exerciseRole: 'hypertrophy_accessory' }, rule: { sets: 3, reps: { min: 8, max: 15 } }, ev: 'Hypertrophy 3-set 8-15 default applied' })
rx({ src: G6, fam: 'six_day_hypertrophy_split', key: 'g6_compound_rest', applies: { split: 'six_day_ppl_arnold', exerciseRole: 'compound' }, rule: { restSec: 120 }, ev: 'Compound rest set for hypertrophy day' })
carry({ src: G6, fam: 'six_day_hypertrophy_split', sourceKey: 'incline_barbell_press', targetSkill: 'planche', type: 'support', strength: 0.4, ev: 'Pressing volume supports planche pressing capacity' })
carry({ src: G6, fam: 'six_day_hypertrophy_split', sourceKey: 'lateral_raise', targetSkill: 'handstand', type: 'support', strength: 0.35, ev: 'Lateral raise supports overhead delt capacity for handstand' })

// =====================================================================
// 3. Gladiolus 5-Day PPL + Upper/Lower (G5) — 10 atoms
// =====================================================================
p({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_skill_priority', title: '5-day PPL+UL preserves selected skill priority', sum: 'A 5-day hybrid PPL + upper/lower split supports rather than replaces direct calisthenics skill work.', w: 2, t: 'hard_constraint', ev: 'Hypertrophy split supports but does not replace selected skills' })
p({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_recovery_gate', title: '5-day split requires adequate recovery', sum: 'High-frequency 5-day hypertrophy is only selected when recovery, time, and goal support it.', w: 2, ev: 'High-frequency hypertrophy split selected only when recovery/time supports it' })
sel({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_split_eligibility', applies: { goal: { includesAny: ['hypertrophy', 'hybrid'] }, availableDays: 5 }, rule: { allowSplit: 'five_day_ppl_ul' }, ev: 'High-frequency hypertrophy split selected only when recovery/time supports it' })
sel({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_push_day_pool', applies: { split: 'five_day_ppl_ul', day: 'push' }, rule: { include: ['incline_press', 'machine_shoulder_press', 'fly', 'skull_crusher', 'lateral_raise'] }, ev: 'Push day populated from doctrine source' })
meth({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_skill_keeps_priority', applies: { split: 'five_day_ppl_ul', selectedSkillCount: { gte: 1 } }, rule: { mustInclude: 'direct_or_carryover_for_each_selected_skill' }, t: 'hard_constraint', ev: 'Hypertrophy split supports but does not replace selected skills' })
meth({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_recovery_check', applies: { split: 'five_day_ppl_ul', recoveryTier: { lte: 'low' } }, rule: { reduceTo: 'four_day_or_three_day' }, ev: 'Low recovery downshifts split to lower frequency' })
rx({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_set_rep_default', applies: { split: 'five_day_ppl_ul', exerciseRole: 'hypertrophy_accessory' }, rule: { sets: 3, reps: { min: 8, max: 15 } }, ev: 'Hypertrophy 3-set 8-15 default applied' })
rx({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_compound_rest', applies: { split: 'five_day_ppl_ul', exerciseRole: 'compound' }, rule: { restSec: 120 }, ev: 'Compound rest set for hypertrophy day' })
progr({ src: G5, fam: 'five_day_hypertrophy_split', key: 'g5_acclimation', applies: { split: 'five_day_ppl_ul', programWeek: { lte: 2 } }, rule: { capProximityToFailure: 'rir_>=_2' }, ev: 'First two weeks capped for acclimation' })
carry({ src: G5, fam: 'five_day_hypertrophy_split', sourceKey: 'pull_day_volume', targetSkill: 'one_arm_pull_up', type: 'support', strength: 0.4, ev: 'Pull volume supports unilateral pull capacity' })

// =====================================================================
// 4. Gladiolus 4-Day P/P/L/Sh-Arms (G4) — 10 atoms
// =====================================================================
p({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_skill_priority', title: '4-day P/P/L/Sh-Arms must preserve selected skill priority', sum: 'A 4-day push/pull/legs/shoulder-arms split supports hybrid training while preserving direct skill exposure.', w: 2, t: 'hard_constraint', ev: '4-day split preserved skill priority' })
p({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_accessory_day', title: 'Shoulder/Arms day is accessory-focused', sum: 'The fourth day in a 4-day split concentrates upper-isolation hypertrophy without inflating compound stress.', w: 1, ev: 'Shoulder/Arms day used for accessory hypertrophy' })
sel({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_split_eligibility', applies: { availableDays: 4, goal: { includesAny: ['hypertrophy', 'hybrid'] } }, rule: { allowSplit: 'four_day_ppl_sh_arms' }, ev: '4-day split eligible for hybrid goal' })
sel({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_sh_arms_pool', applies: { split: 'four_day_ppl_sh_arms', day: 'shoulders_arms' }, rule: { include: ['lateral_raise', 'overhead_press', 'bicep_curl', 'tricep_extension', 'rear_delt_fly'] }, ev: 'Shoulder/Arms day populated' })
meth({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_skill_keeps_priority', applies: { split: 'four_day_ppl_sh_arms', selectedSkillCount: { gte: 1 } }, rule: { mustInclude: 'direct_or_carryover_for_each_selected_skill' }, t: 'hard_constraint', ev: '4-day split preserved skill priority' })
meth({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_no_random_volume', applies: { split: 'four_day_ppl_sh_arms' }, rule: { rejectIf: 'shoulder_arms_volume_added_without_recovery_support' }, ev: 'Accessory volume capped to recovery' })
rx({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_set_rep_default', applies: { split: 'four_day_ppl_sh_arms', exerciseRole: 'accessory' }, rule: { sets: 3, reps: { min: 10, max: 15 } }, ev: 'Accessory 3-set 10-15 default applied' })
rx({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_compound_rest', applies: { split: 'four_day_ppl_sh_arms', exerciseRole: 'compound' }, rule: { restSec: 150 }, ev: 'Compound rest set for 4-day split' })
progr({ src: G4, fam: 'four_day_hybrid_split', key: 'g4_alternative_swap', applies: { split: 'four_day_ppl_sh_arms', limitation: { includesAny: ['equipment', 'injury'] } }, rule: { allowExerciseAlternatives: true }, ev: 'Exercise alternative chosen due to equipment/limitation' })
carry({ src: G4, fam: 'four_day_hybrid_split', sourceKey: 'overhead_press', targetSkill: 'handstand_push_up', type: 'support', strength: 0.6, ev: 'Overhead press supports HSPU strength' })

// =====================================================================
// 5. Gladiolus 3-Day Full Body + U/L (G3) — 10 atoms
// =====================================================================
p({ src: G3, fam: 'three_day_compressed_split', key: 'g3_recompose', title: '3-day week recomposes around priority skills', sum: 'On a 3-day week, priority skill work and high-ROI strength/hypertrophy support are recombined rather than dropping selected skills.', w: 2, t: 'hard_constraint', ev: 'Compressed week recomposed around priority skills' })
p({ src: G3, fam: 'three_day_compressed_split', key: 'g3_recovery_buffer', title: '3-day week respects recovery between sessions', sum: 'A compressed week preserves at least one full recovery day between consecutive high-stress sessions.', w: 1, ev: 'Compressed week protects recovery spacing' })
sel({ src: G3, fam: 'three_day_compressed_split', key: 'g3_split_eligibility', applies: { availableDays: 3 }, rule: { allowSplit: ['three_day_full_body', 'three_day_upper_lower_full'] }, ev: '3-day split eligible' })
sel({ src: G3, fam: 'three_day_compressed_split', key: 'g3_skill_first_pool', applies: { availableDays: 3, selectedSkillCount: { gte: 1 } }, rule: { sessionOrder: ['priority_skill_direct', 'support_strength_or_hypertrophy', 'optional_accessory'] }, ev: 'Compressed week recomposed around priority skills' })
meth({ src: G3, fam: 'three_day_compressed_split', key: 'g3_no_silent_drop', applies: { availableDays: 3, selectedSkillCount: { gte: 1 } }, rule: { rejectIf: 'selected_skill_dropped_silently_for_hypertrophy_only' }, t: 'hard_constraint', ev: 'Compressed week recomposed around priority skills' })
meth({ src: G3, fam: 'three_day_compressed_split', key: 'g3_combine_strength_hypertrophy', applies: { availableDays: 3 }, rule: { combineMethods: ['skill_strength', 'hypertrophy_accessory'] }, ev: 'Strength + hypertrophy combined on compressed week' })
rx({ src: G3, fam: 'three_day_compressed_split', key: 'g3_session_duration', applies: { availableDays: 3 }, rule: { sessionDurationMin: { min: 60, max: 90 } }, ev: 'Compressed week sessions sized 60-90min' })
rx({ src: G3, fam: 'three_day_compressed_split', key: 'g3_compound_rest', applies: { availableDays: 3, exerciseRole: 'compound' }, rule: { restSec: 180 }, ev: 'Compressed week compound rest 3 min' })
carry({ src: G3, fam: 'three_day_compressed_split', sourceKey: 'compound_pull', targetSkill: 'multiple', type: 'support', strength: 0.5, ev: 'Compound pull preserves multi-skill support on compressed week' })
carry({ src: G3, fam: 'three_day_compressed_split', sourceKey: 'compound_press', targetSkill: 'multiple', type: 'support', strength: 0.5, ev: 'Compound press preserves multi-skill support on compressed week' })

// =====================================================================
// 6. Monster Maker Total Body (MM) — 18 atoms
// =====================================================================
p({ src: MM, fam: 'circuit_density_method', key: 'mm_method_intent', title: 'Circuits/density blocks selected by intent, not default', sum: 'Monster Maker circuit/density structure is selected when the goal, fatigue profile, and session duration support conditioning/hypertrophy density.', w: 2, ev: 'Density circuit selected due to hypertrophy/conditioning intent' })
p({ src: MM, fam: 'circuit_density_method', key: 'mm_circuit_not_superset', title: 'Circuits are distinct from supersets', sum: 'Circuit method preserves round structure and inter-round rest; it is never silently flattened into straight sets or supersets.', w: 1, t: 'hard_constraint', ev: 'Circuit rest structure preserved' })
sel({ src: MM, fam: 'circuit_density_method', key: 'mm_pool_pull', applies: { method: 'monster_maker_circuit', focus: 'pull' }, rule: { include: ['weighted_chin', 'db_curl', 'db_high_pull', 'dead_row', 'inverted_chin_curl', 'renegade_row', 'hammer_curl'] }, ev: 'Pull-focused circuit pool selected' })
sel({ src: MM, fam: 'circuit_density_method', key: 'mm_pool_push', applies: { method: 'monster_maker_circuit', focus: 'push' }, rule: { include: ['db_overhead_press', 'speed_push_press', 'floor_press', 'cable_ground_and_pound', 'diamond_cutter_pushup'] }, ev: 'Push-focused circuit pool selected' })
sel({ src: MM, fam: 'circuit_density_method', key: 'mm_pool_legs', applies: { method: 'monster_maker_circuit', focus: 'legs' }, rule: { include: ['barbell_rdl', 'hip_buck', 'long_leg_march', 'front_squat', 'alternating_reverse_lunge', 'walk_the_box'] }, ev: 'Leg-focused circuit pool selected' })
sel({ src: MM, fam: 'circuit_density_method', key: 'mm_grave_digger_slot', applies: { method: 'monster_maker_circuit', programDay: 'monster_maker_slasher' }, rule: { include: ['grave_digger', 'monster_maker_complex'] }, ev: 'Slasher-day complex selected' })
meth({ src: MM, fam: 'circuit_density_method', key: 'mm_method_eligibility', applies: { goal: { includesAny: ['hypertrophy', 'conditioning', 'hybrid'] }, sessionDurationMin: { gte: 45 } }, rule: { allowMethod: 'monster_maker_circuit' }, ev: 'Density circuit selected due to hypertrophy/conditioning intent' })
meth({ src: MM, fam: 'circuit_density_method', key: 'mm_no_skill_replace', applies: { method: 'monster_maker_circuit', selectedSkillCount: { gte: 1 } }, rule: { mustNotReplace: 'direct_skill_strength_block' }, t: 'hard_constraint', ev: 'Hypertrophy split supports but does not replace selected skills' })
meth({ src: MM, fam: 'circuit_density_method', key: 'mm_round_structure', applies: { method: 'monster_maker_circuit' }, rule: { rounds: 3, exerciseOrderWithinRound: 'fixed', restWithinRound: 'minimal_or_none' }, ev: 'Circuit rest structure preserved' })
meth({ src: MM, fam: 'circuit_density_method', key: 'mm_high_rep_specialization', applies: { method: 'monster_maker_circuit', exerciseRole: 'specialization', repTarget: { gte: 50 } }, rule: { gateBy: ['goal_specific', 'fatigue_low_or_moderate'], adjustIfRepsDrop: 'reduce_load_or_pause_rest' }, ev: 'High-rep specialization gated by goal and fatigue' })
rx({ src: MM, fam: 'circuit_density_method', key: 'mm_round_time_cap', applies: { method: 'monster_maker_circuit' }, rule: { maxRoundDurationSec: 150 }, ev: 'Circuit time cap enforced' })
rx({ src: MM, fam: 'circuit_density_method', key: 'mm_inter_round_rest', applies: { method: 'monster_maker_circuit' }, rule: { interRoundRestSec: 90 }, ev: 'Circuit rest structure preserved' })
rx({ src: MM, fam: 'circuit_density_method', key: 'mm_inter_circuit_rest', applies: { method: 'monster_maker_circuit' }, rule: { interCircuitRestSec: 180 }, ev: 'Circuit rest structure preserved' })
rx({ src: MM, fam: 'circuit_density_method', key: 'mm_load_intent', applies: { method: 'monster_maker_circuit' }, rule: { loadTarget: 'challenging_within_rep_or_time_range' }, ev: 'Density load matched to rep/time range' })
progr({ src: MM, fam: 'circuit_density_method', key: 'mm_progress_density', applies: { method: 'monster_maker_circuit' }, rule: { progressBy: ['add_load_keep_time', 'reduce_inter_round_rest', 'add_round'] }, ev: 'Density progressed by load/rest/round' })
progr({ src: MM, fam: 'circuit_density_method', key: 'mm_demote_if_form_breaks', applies: { method: 'monster_maker_circuit', formSignal: 'breaking' }, rule: { demoteTo: 'reduce_load_or_extend_rest' }, ev: 'Density backs off if form breaks' })
carry({ src: MM, fam: 'circuit_density_method', sourceKey: 'weighted_chin_circuit', targetSkill: 'one_arm_pull_up', type: 'support', strength: 0.45, ev: 'Density chin work supports unilateral pull capacity' })
carry({ src: MM, fam: 'circuit_density_method', sourceKey: 'speed_push_press_circuit', targetSkill: 'handstand_push_up', type: 'support', strength: 0.4, ev: 'Density press supports HSPU capacity' })

// =====================================================================
// 7. Nicky Lyan Theory/Recovery (NLT) — 24 atoms
// =====================================================================
p({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_principles_over_tips', title: 'Tips help only when grounded in principles', sum: 'Programming is built on universal principles; isolated tips do not equal progress unless tied to mechanics, leverage, and recovery.', w: 1, ev: 'Skill theory applied before max attempts' })
p({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_theory_before_brute_force', title: 'Theory precedes brute-force advanced attempts', sum: 'Advanced calisthenics skills are progressed through leverage, COM, body angle, scapula position, and tension — not through repeated max attempts.', w: 2, ev: 'Skill theory applied before max attempts' })
p({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_skill_chains_differ', title: 'Skill demands differ between planche and front lever', sum: 'Pressing-dominant and pulling-dominant lever skills require different muscle chains and tension demands; programming reflects that.', w: 1, ev: 'Skill chain matched to selected skill' })
p({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_stimulus_recovery_adaptation', title: 'Stimulus + recovery = adaptation', sum: 'Adaptation requires both stimulus and recovery; volume/intensity/frequency without recovery support is flagged or capped.', w: 2, ev: 'Stimulus balanced with recovery' })
p({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_attempts_vs_training', title: 'Attempts are not training', sum: 'Skill attempts are practice events, not the structured training stimulus that drives adaptation.', w: 1, ev: 'Attempts separated from structured training' })
p({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_clean_form_target', title: 'Form target is clean, not ugly-rep tolerance', sum: 'Early strength may tolerate imperfect reps but progression must move toward clean form before advancing.', w: 1, ev: 'Progression requires cleaner form before advancing' })
p({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_balance_vif', title: 'Volume, intensity, and frequency must balance', sum: 'These three are decided together, not as isolated knobs.', w: 1, ev: 'Volume/intensity/frequency balanced together' })
p({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_protect_long_term', title: 'Daily adjustments protect long-term trajectory', sum: 'Short-term fatigue adjustments do not destroy long-term progression; the day flexes while the trajectory holds.', w: 1, ev: 'Daily adjustment preserved long-term progression' })
meth({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_progression_over_attempts', applies: { skillLevel: { gte: 'intermediate' }, selectedSkillCount: { gte: 1 } }, rule: { preferTechniques: ['leverage_progression', 'angle_progression', 'tempo_progression', 'banded_assistance'], deemphasize: 'max_attempt_repetition' }, ev: 'Skill theory applied before max attempts' })
meth({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_recovery_cap', applies: { recoveryTier: { lte: 'low' } }, rule: { capWeeklyVolumePct: 80, capIntensity: 'rir_>=_2' }, t: 'hard_constraint', ev: 'Stimulus balanced with recovery' })
meth({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_attempts_window', applies: { selectedSkillCount: { gte: 1 } }, rule: { allowAttempts: { gateBy: ['readiness_gte_intermediate', 'fatigue_lte_moderate'], maxAttemptsPerSession: 5 } }, ev: 'Attempts separated from structured training' })
meth({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_form_progression_gate', applies: { progressionStep: 'advance' }, rule: { requireFormQuality: 'clean_majority_reps' }, t: 'hard_constraint', ev: 'Progression requires cleaner form before advancing' })
meth({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_vif_balance', applies: { goal: 'any' }, rule: { coDecideVolumeIntensityFrequency: true }, ev: 'Volume/intensity/frequency balanced together' })
meth({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_daily_vs_long_term', applies: { fatigueSignal: { gte: 'high' } }, rule: { dayAdjust: ['reduce_intensity', 'reduce_volume', 'swap_to_carryover'], preserveLongTerm: true }, ev: 'Daily adjustment preserved long-term progression' })
meth({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_joint_tendon_protection', applies: { skillLevel: { gte: 'intermediate' } }, rule: { mandatoryWarmUp: ['scapula_prep', 'wrist_prep', 'elbow_prep'], avoid: ['cold_max_attempts', 'consecutive_high_stress_sessions'] }, t: 'hard_constraint', ev: 'Joint/tendon/nervous-system load protected' })
meth({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_cns_load_protect', applies: { sessionType: 'cns_heavy' }, rule: { spaceAcrossWeek: true, noConsecutiveCnsHeavy: true }, t: 'hard_constraint', ev: 'Joint/tendon/nervous-system load protected' })
rx({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_warmup_dose', applies: { skillLevel: { gte: 'intermediate' } }, rule: { warmUpMin: { min: 8, max: 15 } }, ev: 'Warm-up dosed for joint/tendon/CNS' })
rx({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_skill_attempt_rest', applies: { exerciseRole: 'skill_attempt' }, rule: { restMinSec: 180 }, ev: 'Skill attempts use long rest' })
rx({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_recovery_day_min', applies: { weeklyHighStressSessions: { gte: 4 } }, rule: { recoveryDaysMin: 1 }, ev: 'Recovery day enforced when high-stress weeks accumulate' })
rx({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_dose_strength_iso', applies: { method: 'isometric_strength' }, rule: { holdSec: { min: 8, max: 12 } }, ev: 'Isometric strength dosing applied' })
progr({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_clean_form_advance', applies: { progressionStep: 'advance' }, rule: { advanceWhen: 'most_reps_clean_for_two_consecutive_sessions' }, ev: 'Progression requires cleaner form before advancing' })
progr({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_deload_trigger', applies: { fatigueSignal: { gte: 'high' }, recoveryTier: { lte: 'low' } }, rule: { triggerDeload: true, deloadWeekVolumePct: 60 }, ev: 'Deload triggered by fatigue + low recovery' })
progr({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_volume_step', applies: { goal: 'any' }, rule: { weeklyVolumeStepPct: { min: 5, max: 10 } }, ev: 'Volume progresses gradually' })
progr({ src: NLT, fam: 'calisthenics_theory_recovery', key: 'nlt_intensity_step', applies: { goal: 'any' }, rule: { intensityStepPolicy: 'increase_only_when_form_clean' }, ev: 'Intensity progresses only when form is clean' })

// =====================================================================
// 8. Nicolas Lyan How to Start (NLS) — 20 atoms
// =====================================================================
p({ src: NLS, fam: 'beginner_foundations', key: 'nls_basics_first', title: 'Foundations precede advanced skills', sum: 'Beginner athletes build foundation movement quality before advanced skills become primary stimulus.', w: 2, t: 'hard_constraint', ev: 'Foundations prioritized before advanced skill work' })
p({ src: NLS, fam: 'beginner_foundations', key: 'nls_program_basics', title: 'Beginner plans use strategic sets/reps/rest/rest-days', sum: 'Beginner programs are not random exercise lists; sets, reps, rest, and rest days are chosen strategically.', w: 1, ev: 'Beginner plan built with sets/reps/rest/rest-day strategy' })
p({ src: NLS, fam: 'beginner_foundations', key: 'nls_level_classification', title: 'Athlete level is classified before progression selection', sum: 'Foundation, beginner, intermediate, advanced, and elite levels gate exercise selection and progression intensity.', w: 1, ev: 'Athlete level classified before progression selection' })
sel({ src: NLS, fam: 'beginner_foundations', key: 'nls_level0_pool', applies: { level: 'foundation' }, rule: { include: ['row', 'push_up', 'pull_up', 'dip', 'hollow_body', 'toes_to_bar', 'skin_the_cat', 'squat', 'plank'] }, ev: 'Foundation readiness checked from basic movement capacity' })
sel({ src: NLS, fam: 'beginner_foundations', key: 'nls_level1_pool', applies: { level: 'beginner' }, rule: { intro: ['handstand_intro', 'tuck_planche_intro', 'tuck_front_lever_intro', 'tuck_back_lever_intro', 'muscle_up_intro'] }, ev: 'Beginner skill exposure introduced' })
sel({ src: NLS, fam: 'beginner_foundations', key: 'nls_advanced_gate', applies: { level: { lte: 'beginner' } }, rule: { blockSelectedSkills: ['planche_full', 'front_lever_full', 'back_lever_full', 'hefesto', 'maltese', 'victorian'] }, t: 'hard_constraint', ev: 'Foundations prioritized before advanced skill work' })
sel({ src: NLS, fam: 'beginner_foundations', key: 'nls_progression_match', applies: { level: 'foundation' }, rule: { matchProgressionToLevel: true }, ev: 'Progression/regression matched current ability' })
meth({ src: NLS, fam: 'beginner_foundations', key: 'nls_foundation_targets', applies: { level: 'foundation' }, rule: { foundationTargets: { plank_sec: 30, squat_reps: 30, push_up_reps: 20, row_reps: 20, pull_up_reps: 10, dip_reps: 10, skin_the_cat: { min: 3, max: 5 }, hollow_body_sec: 30, toes_to_bar_reps: 10 } }, ev: 'Foundation readiness checked from basic movement capacity' })
meth({ src: NLS, fam: 'beginner_foundations', key: 'nls_classification_rule', applies: { athleteState: 'unclassified' }, rule: { classifyVia: 'baseline_capacity_vs_foundation_targets' }, ev: 'Athlete level classified before progression selection' })
meth({ src: NLS, fam: 'beginner_foundations', key: 'nls_no_aspirational_skills', applies: { level: { lte: 'beginner' }, selectedSkillsRequested: { includesAny: ['planche_full', 'front_lever_full', 'back_lever_full'] } }, rule: { remapTo: 'tuck_or_intro_progression', surfaceExplanation: true }, t: 'hard_constraint', ev: 'Progression/regression matched current ability' })
meth({ src: NLS, fam: 'beginner_foundations', key: 'nls_progressive_overload', applies: { level: { lte: 'beginner' } }, rule: { progressionPolicy: 'small_steps_no_aggressive_jumps' }, ev: 'Progressive overload applied gradually for beginners' })
rx({ src: NLS, fam: 'beginner_foundations', key: 'nls_foundation_session_dose', applies: { level: 'foundation' }, rule: { setsPerExercise: { min: 2, max: 3 }, repsPerSet: { min: 5, max: 15 }, restSec: { min: 60, max: 120 } }, ev: 'Beginner plan built with sets/reps/rest/rest-day strategy' })
rx({ src: NLS, fam: 'beginner_foundations', key: 'nls_rest_days', applies: { level: { lte: 'beginner' } }, rule: { weeklyRestDaysMin: 2 }, ev: 'Beginner rest days enforced' })
rx({ src: NLS, fam: 'beginner_foundations', key: 'nls_session_duration', applies: { level: 'foundation' }, rule: { sessionDurationMin: { min: 30, max: 60 } }, ev: 'Foundation session duration sized 30-60min' })
progr({ src: NLS, fam: 'beginner_foundations', key: 'nls_advance_to_beginner', applies: { level: 'foundation' }, rule: { advanceTo: 'beginner', when: 'foundation_targets_hit' }, ev: 'Athlete level classified before progression selection' })
progr({ src: NLS, fam: 'beginner_foundations', key: 'nls_regress_on_form_break', applies: { level: { lte: 'beginner' }, formSignal: 'breaking' }, rule: { regressBy: 'easier_progression_or_assisted_variant' }, ev: 'Progression/regression matched current ability' })
progr({ src: NLS, fam: 'beginner_foundations', key: 'nls_volume_ramp', applies: { level: { lte: 'beginner' } }, rule: { weeklyVolumeStepPct: { min: 5, max: 10 } }, ev: 'Beginner volume ramps gradually' })
progr({ src: NLS, fam: 'beginner_foundations', key: 'nls_clean_form_advance', applies: { level: { lte: 'beginner' } }, rule: { advanceWhenFormQuality: 'clean_majority_reps' }, ev: 'Progression requires cleaner form before advancing' })
carry({ src: NLS, fam: 'beginner_foundations', sourceKey: 'pull_up', targetSkill: 'one_arm_pull_up', type: 'progression_pre_requisite', strength: 0.7, ev: 'Foundation pull-up enables future one-arm pull development' })
carry({ src: NLS, fam: 'beginner_foundations', sourceKey: 'hollow_body', targetSkill: 'front_lever', type: 'support', strength: 0.6, ev: 'Hollow body supports front lever line' })

// =====================================================================
// 9. Nicky Lyan Master the Handstand (NLH) — 18 atoms
// =====================================================================
p({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_components', title: 'Handstand has three components: form, balance, strength', sum: 'Handstand programming classifies the limiting factor as form, balance, strength, or mixed and selects work to match.', w: 1, ev: 'Handstand limiter classified as form/balance/strength' })
p({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_alignment_first', title: 'Stacked alignment is the form goal', sum: 'Proper stack — wrists, elbows, shoulders, hips, knees, ankles in line — is the form goal even when offset stack is used as a teaching tool.', w: 1, ev: 'Handstand stack cue applied' })
p({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_prereq_strength', title: 'Handstand requires prerequisite pressing/plank capacity', sum: 'A solid 45s high plank is a baseline signal before advanced freestanding handstand becomes primary.', w: 2, t: 'hard_constraint', ev: 'Handstand prerequisite checked' })
sel({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_freestanding_gate', applies: { selectedSkills: { includes: 'handstand' }, prereqHighPlankSec: { lt: 45 } }, rule: { blockExercises: ['freestanding_handstand_balance_primary'], substitute: 'wall_handstand_holds_or_kickup_practice' }, t: 'hard_constraint', ev: 'Handstand prerequisite checked' })
sel({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_form_pool', applies: { selectedSkills: { includes: 'handstand' }, limiter: 'form' }, rule: { include: ['wall_handstand_alignment_drill', 'tuck_to_extended_alignment', 'hollow_body_handstand'] }, ev: 'Handstand form work selected for form limiter' })
sel({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_balance_pool', applies: { selectedSkills: { includes: 'handstand' }, limiter: 'balance' }, rule: { include: ['kickup_practice', 'finger_tip_balance_drill', 'wall_to_freestanding_release', 'freestanding_balance_short_holds'] }, ev: 'Handstand balance work selected for balance limiter' })
sel({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_strength_pool', applies: { selectedSkills: { includes: 'handstand' }, limiter: 'strength' }, rule: { include: ['wall_handstand_holds_long', 'pike_press_progression', 'hspu_negative', 'overhead_press'] }, ev: 'Handstand strength work selected for strength limiter' })
meth({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_classify_limiter', applies: { selectedSkills: { includes: 'handstand' } }, rule: { classifyLimiter: ['form', 'balance', 'strength', 'mixed'] }, ev: 'Handstand limiter classified as form/balance/strength' })
meth({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_stack_cue', applies: { selectedSkills: { includes: 'handstand' } }, rule: { cues: ['spread_fingers_grip_floor', 'push_through_hands', 'straight_arms', 'stack_wrists_elbows_shoulders_hips_knees_ankles', 'maintain_body_tension'] }, ev: 'Handstand form cues generated from source doctrine' })
meth({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_offset_transitional', applies: { selectedSkills: { includes: 'handstand' }, useOffsetStack: true }, rule: { offsetStackPolicy: 'transitional_tool_not_final_form' }, ev: 'Offset stack used only as transitional tool' })
meth({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_no_advanced_first', applies: { selectedSkills: { includes: 'handstand' }, level: { lte: 'beginner' } }, rule: { blockMethods: ['freestanding_long_hold_primary', 'one_arm_handstand'] }, t: 'hard_constraint', ev: 'Handstand prerequisite checked' })
rx({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_wall_hold_dose', applies: { exercise: 'wall_handstand_hold' }, rule: { holdSec: { min: 20, max: 60 }, sets: { min: 3, max: 5 }, restSec: 90 }, ev: 'Wall handstand dose set' })
rx({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_freestand_dose', applies: { exercise: 'freestanding_balance_short_hold', limiter: 'balance' }, rule: { holdSec: { min: 5, max: 15 }, sets: { min: 5, max: 8 }, restSec: 60 }, ev: 'Freestanding balance dose set' })
rx({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_press_dose', applies: { exercise: { includesAny: ['pike_press', 'hspu_negative'] }, limiter: 'strength' }, rule: { reps: { min: 3, max: 6 }, sets: { min: 3, max: 5 }, restSec: 180 }, ev: 'Handstand pressing dose set for strength limiter' })
progr({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_advance_freestand', applies: { selectedSkills: { includes: 'handstand' }, prereqHighPlankSec: { gte: 45 }, wallHoldSec: { gte: 30 } }, rule: { allowMethods: ['freestanding_balance_short_holds'] }, ev: 'Freestanding work unlocked when prerequisites met' })
progr({ src: NLH, fam: 'handstand_form_balance_strength', key: 'nlh_extend_hold', applies: { selectedSkills: { includes: 'handstand' } }, rule: { progressBy: 'extend_hold_seconds_or_reduce_wall_assistance' }, ev: 'Handstand progression scales hold and assistance' })
carry({ src: NLH, fam: 'handstand_form_balance_strength', sourceKey: 'pike_press', targetSkill: 'handstand_push_up', type: 'progression_pre_requisite', strength: 0.75, ev: 'Pike press carries strength toward HSPU' })
carry({ src: NLH, fam: 'handstand_form_balance_strength', sourceKey: 'wall_handstand_hold', targetSkill: 'handstand', type: 'direct', strength: 0.85, ev: 'Wall handstand directly trains handstand' })

// ===== PUBLIC ACCESSORS =====
export const BATCH_05_KEY = 'batch_05' as const

// Provenance shape parity with Batch 1/2/3/4.
export interface Batch05Provenance {
  atomId: string
  sourceId: string | null
  batch: 'batch_05'
}

// Batch 5 expresses safety as hard_constraint method/selection rules — same
// pattern as Batch 4. Helper exists for aggregator parity.
export function getBatch05ContraindicationRules(): unknown[] { return [] }

export function getBatch05Sources(): DoctrineSource[] { return BATCH_05_SOURCES }
export function getBatch05Principles(): DoctrinePrinciple[] { return BATCH_05_PRINCIPLES }
export function getBatch05ProgressionRules(): ProgressionRule[] { return BATCH_05_PROGRESSION }
export function getBatch05MethodRules(): MethodRule[] { return BATCH_05_METHOD }
export function getBatch05PrescriptionRules(): PrescriptionRule[] { return BATCH_05_PRESCRIPTION }
export function getBatch05ExerciseSelectionRules(): ExerciseSelectionRule[] { return BATCH_05_SELECTION }
export function getBatch05CarryoverRules(): CarryoverRule[] { return BATCH_05_CARRYOVER }
export function getBatch05Counts() {
  return {
    sources: BATCH_05_SOURCES.length,
    principles: BATCH_05_PRINCIPLES.length,
    progression: BATCH_05_PROGRESSION.length,
    method: BATCH_05_METHOD.length,
    prescription: BATCH_05_PRESCRIPTION.length,
    selection: BATCH_05_SELECTION.length,
    carryover: BATCH_05_CARRYOVER.length,
    total:
      BATCH_05_PRINCIPLES.length +
      BATCH_05_PROGRESSION.length +
      BATCH_05_METHOD.length +
      BATCH_05_PRESCRIPTION.length +
      BATCH_05_SELECTION.length +
      BATCH_05_CARRYOVER.length,
  }
}
export function getBatch05CountsBySource(): Record<string, number> {
  const all = [...BATCH_05_PRINCIPLES, ...BATCH_05_PROGRESSION, ...BATCH_05_METHOD, ...BATCH_05_PRESCRIPTION, ...BATCH_05_SELECTION, ...BATCH_05_CARRYOVER] as Array<{ source_id?: string }>
  const out: Record<string, number> = {}
  for (const r of all) { const sid = r.source_id ?? 'unknown'; out[sid] = (out[sid] ?? 0) + 1 }
  return out
}
export function getBatch05ProvenanceFor(atomId: string): { batch: 'batch_05'; sourceId: string | null } | null {
  const all: Array<{ id?: string; source_id?: string }> = [...BATCH_05_PRINCIPLES, ...BATCH_05_PROGRESSION, ...BATCH_05_METHOD, ...BATCH_05_PRESCRIPTION, ...BATCH_05_SELECTION, ...BATCH_05_CARRYOVER]
  const hit = all.find(r => r.id === atomId)
  if (!hit) return null
  return { batch: 'batch_05', sourceId: hit.source_id ?? null }
}
