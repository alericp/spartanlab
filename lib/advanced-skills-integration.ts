/**
 * Advanced Skills Integration
 * 
 * Maps advanced skill progression nodes to readiness factors,
 * weak point detection, and coaching guidance.
 */

import type { SkillGraphId, ProgressionNode } from './skill-progression-graph-engine'
import type { WeakPointType } from './weak-point-engine'

// =============================================================================
// ADVANCED SKILL READINESS FACTOR MAPPINGS
// =============================================================================

export const ADVANCED_SKILL_READINESS_FACTORS: Record<SkillGraphId, {
  primaryFactors: string[]
  secondaryFactors: string[]
  weightings: Record<string, number>
}> = {
  maltese: {
    primaryFactors: ['straight_arm_push', 'ring_support', 'shoulder_stability'],
    secondaryFactors: ['shoulder_tendon', 'scapular_control', 'wrist_tolerance'],
    weightings: {
      straight_arm_push: 0.35,
      ring_support: 0.30,
      shoulder_stability: 0.25,
      shoulder_tendon: 0.10,
    },
  },
  planche_pushup: {
    primaryFactors: ['straight_arm_push', 'dynamic_push', 'wrist_tolerance'],
    secondaryFactors: ['shoulder_stability', 'scapular_control'],
    weightings: {
      straight_arm_push: 0.35,
      dynamic_push: 0.30,
      wrist_tolerance: 0.20,
      shoulder_stability: 0.15,
    },
  },
  pseudo_planche_pushup: {
    primaryFactors: ['dynamic_push', 'shoulder_stability'],
    secondaryFactors: ['wrist_tolerance'],
    weightings: {
      dynamic_push: 0.50,
      shoulder_stability: 0.35,
      wrist_tolerance: 0.15,
    },
  },
  front_lever_pullup: {
    primaryFactors: ['straight_arm_pull', 'dynamic_pull', 'compression', 'scapular_control'],
    secondaryFactors: ['shoulder_stability', 'lat_strength'],
    weightings: {
      straight_arm_pull: 0.30,
      dynamic_pull: 0.25,
      compression: 0.20,
      scapular_control: 0.15,
      lat_strength: 0.10,
    },
  },
  one_arm_front_lever_row: {
    primaryFactors: ['straight_arm_pull', 'dynamic_pull', 'scapular_control', 'core_stability'],
    secondaryFactors: ['lat_strength', 'shoulder_stability'],
    weightings: {
      straight_arm_pull: 0.30,
      scapular_control: 0.25,
      core_stability: 0.20,
      dynamic_pull: 0.15,
      lat_strength: 0.10,
    },
  },
  slow_muscle_up: {
    primaryFactors: ['explosive_pull', 'dip_strength', 'transition_control', 'shoulder_stability'],
    secondaryFactors: ['lockout_strength', 'elbow_stability'],
    weightings: {
      explosive_pull: 0.30,
      dip_strength: 0.25,
      transition_control: 0.25,
      shoulder_stability: 0.15,
      lockout_strength: 0.05,
    },
  },
  weighted_muscle_up: {
    primaryFactors: ['explosive_pull', 'dip_strength', 'shoulder_stability'],
    secondaryFactors: ['lockout_strength', 'core_stability'],
    weightings: {
      explosive_pull: 0.35,
      dip_strength: 0.30,
      shoulder_stability: 0.20,
      lockout_strength: 0.10,
      core_stability: 0.05,
    },
  },
  // Map to existing skills if needed
  front_lever: {
    primaryFactors: ['straight_arm_pull', 'compression', 'scapular_control'],
    secondaryFactors: ['lat_strength', 'core_stability'],
    weightings: {
      straight_arm_pull: 0.35,
      compression: 0.30,
      scapular_control: 0.25,
      lat_strength: 0.10,
    },
  },
  planche: {
    primaryFactors: ['straight_arm_push', 'compression', 'shoulder_stability'],
    secondaryFactors: ['wrist_tolerance', 'scapular_control'],
    weightings: {
      straight_arm_push: 0.35,
      compression: 0.30,
      shoulder_stability: 0.25,
      wrist_tolerance: 0.10,
    },
  },
  muscle_up: {
    primaryFactors: ['explosive_pull', 'dip_strength', 'transition_control'],
    secondaryFactors: ['shoulder_stability', 'lockout_strength'],
    weightings: {
      explosive_pull: 0.35,
      dip_strength: 0.30,
      transition_control: 0.25,
      shoulder_stability: 0.10,
    },
  },
  back_lever: {
    primaryFactors: ['straight_arm_pull', 'scapular_control'],
    secondaryFactors: ['shoulder_stability'],
    weightings: {
      straight_arm_pull: 0.50,
      scapular_control: 0.40,
      shoulder_stability: 0.10,
    },
  },
  handstand: {
    primaryFactors: ['shoulder_stability', 'scapular_control', 'wrist_tolerance'],
    secondaryFactors: ['core_stability'],
    weightings: {
      shoulder_stability: 0.40,
      scapular_control: 0.30,
      wrist_tolerance: 0.20,
      core_stability: 0.10,
    },
  },
  hspu: {
    primaryFactors: ['shoulder_stability', 'lockout_strength', 'wrist_tolerance'],
    secondaryFactors: ['core_stability'],
    weightings: {
      shoulder_stability: 0.40,
      lockout_strength: 0.30,
      wrist_tolerance: 0.20,
      core_stability: 0.10,
    },
  },
  l_sit: {
    primaryFactors: ['compression', 'shoulder_stability', 'core_stability'],
    secondaryFactors: ['hip_flexibility'],
    weightings: {
      compression: 0.40,
      shoulder_stability: 0.30,
      core_stability: 0.30,
    },
  },
  v_sit: {
    primaryFactors: ['compression', 'hip_flexibility', 'core_stability'],
    secondaryFactors: ['shoulder_stability'],
    weightings: {
      compression: 0.40,
      hip_flexibility: 0.35,
      core_stability: 0.25,
    },
  },
  iron_cross: {
    primaryFactors: ['straight_arm_push', 'ring_support', 'shoulder_stability', 'shoulder_tendon'],
    secondaryFactors: ['scapular_control'],
    weightings: {
      straight_arm_push: 0.30,
      ring_support: 0.25,
      shoulder_stability: 0.25,
      shoulder_tendon: 0.15,
      scapular_control: 0.05,
    },
  },
  one_arm_pull_up: {
    primaryFactors: ['dynamic_pull', 'lat_strength', 'shoulder_stability'],
    secondaryFactors: ['core_stability', 'grip_strength'],
    weightings: {
      dynamic_pull: 0.40,
      lat_strength: 0.30,
      shoulder_stability: 0.20,
      core_stability: 0.10,
    },
  },
  ring_muscle_up: {
    primaryFactors: ['explosive_pull', 'ring_support', 'transition_control'],
    secondaryFactors: ['shoulder_stability', 'lockout_strength'],
    weightings: {
      explosive_pull: 0.30,
      ring_support: 0.25,
      transition_control: 0.25,
      shoulder_stability: 0.15,
      lockout_strength: 0.05,
    },
  },
}

// =============================================================================
// WEAK POINT BLOCKERS FOR ADVANCED SKILLS
// =============================================================================

export const ADVANCED_SKILL_BLOCKERS: Record<SkillGraphId, {
  nodeId: string
  blockedByWeakPoints: WeakPointType[]
  blockingThreshold: number
}[]> = {
  // [WEAK-POINT-TYPE-CONTRACT] All values below are now canonical
  // WeakPointType members from lib/weak-point-engine.ts:43-77.
  // High-confidence stale → canonical mappings applied:
  //   shoulder_tendon       → tendon_tolerance (label "Tendon Tolerance")
  //   ring_support          → ring_support_stability (label match)
  //   straight_arm_push     → straight_arm_push_strength (1:1)
  //   straight_arm_pull     → straight_arm_pull_strength (1:1)
  //   compression           → compression_strength (label "Compression Strength")
  //   explosive_pull        → explosive_power (label "Explosive Pull Power")
  //   transition_control    → transition_strength (label "Transition Strength")
  //   dynamic_pull          → explosive_power (same canonical "explosive pull" concept)
  //   core_stability        → core_control (canonical "Core Control")
  // Stale values with no canonical equivalent are LEFT IN PLACE (will surface
  // as targeted TS2322 errors for product-decision review, NOT silently
  // mis-mapped): dynamic_push, lockout_strength.
  // The doctrine intent of every entry — which weak points block which skill
  // node and at what threshold — is preserved verbatim.
  maltese: [
    {
      nodeId: 'mal_4_band_assisted',
      blockedByWeakPoints: ['shoulder_stability', 'tendon_tolerance'],
      blockingThreshold: 35,
    },
    {
      nodeId: 'mal_5_negative',
      blockedByWeakPoints: ['tendon_tolerance', 'ring_support_stability'],
      blockingThreshold: 40,
    },
    {
      nodeId: 'mal_6_partial',
      blockedByWeakPoints: ['tendon_tolerance', 'straight_arm_push_strength'],
      blockingThreshold: 45,
    },
  ],
  planche_pushup: [
    {
      nodeId: 'ppu_3_tuck_assisted',
      blockedByWeakPoints: ['dynamic_push', 'straight_arm_push_strength'],
      blockingThreshold: 35,
    },
    {
      nodeId: 'ppu_4_tuck',
      blockedByWeakPoints: ['straight_arm_push_strength', 'wrist_tolerance'],
      blockingThreshold: 40,
    },
    {
      nodeId: 'ppu_6_straddle',
      blockedByWeakPoints: ['straight_arm_push_strength', 'shoulder_stability'],
      blockingThreshold: 45,
    },
  ],
  front_lever_pullup: [
    {
      nodeId: 'flpu_3_one_leg_row',
      blockedByWeakPoints: ['scapular_control', 'straight_arm_pull_strength'],
      blockingThreshold: 35,
    },
    {
      nodeId: 'flpu_4_straddle_row',
      blockedByWeakPoints: ['explosive_power', 'scapular_control'],
      blockingThreshold: 40,
    },
    {
      nodeId: 'flpu_5_fl_pullup',
      blockedByWeakPoints: ['straight_arm_pull_strength', 'compression_strength'],
      blockingThreshold: 45,
    },
  ],
  slow_muscle_up: [
    {
      nodeId: 'smu_2_slow',
      blockedByWeakPoints: ['transition_strength', 'explosive_power'],
      blockingThreshold: 40,
    },
    {
      nodeId: 'smu_3_tempo',
      blockedByWeakPoints: ['transition_strength', 'lockout_strength'],
      blockingThreshold: 45,
    },
    {
      nodeId: 'smu_4_weighted_light',
      blockedByWeakPoints: ['dip_strength', 'shoulder_stability'],
      blockingThreshold: 40,
    },
  ],
  weighted_muscle_up: [
    {
      nodeId: 'light_weighted_mu',
      blockedByWeakPoints: ['explosive_power', 'dip_strength'],
      blockingThreshold: 40,
    },
    {
      nodeId: 'moderate_weighted_mu',
      blockedByWeakPoints: ['dip_strength', 'lockout_strength'],
      blockingThreshold: 45,
    },
    {
      nodeId: 'heavy_weighted_mu',
      blockedByWeakPoints: ['dip_strength', 'shoulder_stability'],
      blockingThreshold: 50,
    },
  ],
  one_arm_front_lever_row: [
    {
      nodeId: 'assisted_oafl_row',
      blockedByWeakPoints: ['straight_arm_pull_strength', 'scapular_control'],
      blockingThreshold: 40,
    },
    {
      nodeId: 'negative_oafl_row',
      blockedByWeakPoints: ['scapular_control', 'core_control'],
      blockingThreshold: 45,
    },
    {
      nodeId: 'one_arm_fl_row',
      blockedByWeakPoints: ['straight_arm_pull_strength', 'shoulder_stability'],
      blockingThreshold: 50,
    },
  ],
  // Placeholder arrays for existing skills
  front_lever: [],
  back_lever: [],
  planche: [],
  pseudo_planche_pushup: [],
  muscle_up: [],
  handstand: [],
  hspu: [],
  l_sit: [],
  v_sit: [],
  iron_cross: [],
  one_arm_pull_up: [],
  ring_muscle_up: [],
}

// =============================================================================
// SUPPORT EXERCISE MAPPINGS
// =============================================================================

/**
 * Suggested support exercises when athlete is blocked from advancing
 * on an advanced skill progression.
 */
export const ADVANCED_SKILL_SUPPORT_EXERCISES: Record<string, {
  exerciseId: string
  exerciseName: string
  purpose: string
  focus: WeakPointType
}[]> = {
  // [WEAK-POINT-TYPE-CONTRACT] All `focus` values below are now canonical
  // WeakPointType members. Same alias→canonical mapping table as the
  // ADVANCED_SKILL_BLOCKERS comment above. The exerciseId, exerciseName,
  // and purpose strings are unchanged — only the canonical-typed `focus`
  // field has been migrated. Stale values with no canonical equivalent
  // (`dynamic_push`, `lat_strength`) are mapped here only when an obvious
  // canonical exists; lat_strength → pull_strength (lat is the primary
  // pulling muscle; canonical has only one pull-strength member).
  maltese: [
    {
      exerciseId: 'ring_support_hold',
      exerciseName: 'Ring Support Hold',
      purpose: 'Foundation ring stability',
      focus: 'ring_support_stability',
    },
    {
      exerciseId: 'assisted_ring_dips',
      exerciseName: 'Assisted Ring Dips',
      purpose: 'Develop dipping strength for ring work',
      focus: 'shoulder_stability',
    },
    {
      exerciseId: 'shoulder_prehab',
      exerciseName: 'Shoulder Prehab Circuit',
      purpose: 'Tendon conditioning',
      focus: 'tendon_tolerance',
    },
    {
      exerciseId: 'scapular_control_work',
      exerciseName: 'Scapular Pulls & Holds',
      purpose: 'Improve scapular control',
      focus: 'scapular_control',
    },
  ],
  planche_pushup: [
    {
      exerciseId: 'pseudo_planche_pushup',
      exerciseName: 'Pseudo Planche Push-Up',
      purpose: 'Dynamic pressing foundation',
      focus: 'dynamic_push',
    },
    {
      exerciseId: 'planche_lean_hold',
      exerciseName: 'Planche Lean Hold',
      purpose: 'Build straight-arm position strength',
      focus: 'straight_arm_push_strength',
    },
    {
      exerciseId: 'wrist_mobility_work',
      exerciseName: 'Wrist Mobility & Conditioning',
      purpose: 'Improve wrist tolerance',
      focus: 'wrist_tolerance',
    },
    {
      exerciseId: 'shoulder_prehab',
      exerciseName: 'Shoulder Prehab',
      purpose: 'Shoulder stability',
      focus: 'shoulder_stability',
    },
  ],
  front_lever_pullup: [
    {
      exerciseId: 'tuck_front_lever_hold',
      exerciseName: 'Tuck Front Lever Hold',
      purpose: 'Lever position strength',
      focus: 'straight_arm_pull_strength',
    },
    {
      exerciseId: 'scapular_pulls',
      exerciseName: 'Scapular Pulls',
      purpose: 'Scapular control and engagement',
      focus: 'scapular_control',
    },
    {
      exerciseId: 'compression_holds',
      exerciseName: 'Compression Holds',
      purpose: 'Core tension and compression',
      focus: 'compression_strength',
    },
    {
      exerciseId: 'lat_pulldowns',
      exerciseName: 'Lat Pulldowns',
      purpose: 'Lat pulling strength',
      focus: 'pull_strength',
    },
  ],
  slow_muscle_up: [
    {
      exerciseId: 'explosive_pull_ups',
      exerciseName: 'Explosive Pull-Ups',
      purpose: 'Build explosive pulling power',
      focus: 'explosive_power',
    },
    {
      exerciseId: 'bar_dips',
      exerciseName: 'Straight Bar Dips',
      purpose: 'Dipping strength foundation',
      focus: 'dip_strength',
    },
    {
      exerciseId: 'muscle_up_transitions',
      exerciseName: 'Muscle-Up Transition Work',
      purpose: 'Transition control practice',
      focus: 'transition_strength',
    },
    {
      exerciseId: 'shoulder_prehab',
      exerciseName: 'Shoulder Prehab',
      purpose: 'Shoulder stability and health',
      focus: 'shoulder_stability',
    },
  ],
}

// =============================================================================
// FRAMEWORK COMPATIBILITY
// =============================================================================

/**
 * Which coaching frameworks are well-suited for each advanced skill.
 */
export const ADVANCED_SKILL_FRAMEWORK_COMPATIBILITY: Record<SkillGraphId, {
  primaryFrameworks: string[]
  secondaryFrameworks: string[]
  recommendedFrequency: string
}> = {
  maltese: {
    primaryFrameworks: ['tendon_conservative', 'skill_frequency'],
    secondaryFrameworks: ['strength_conversion'],
    recommendedFrequency: '2x per week, 6-10 minutes per session',
  },
  planche_pushup: {
    primaryFrameworks: ['strength_conversion', 'skill_frequency'],
    secondaryFrameworks: ['tendon_conservative'],
    recommendedFrequency: '2-3x per week, 8-15 minutes per session',
  },
  front_lever_pullup: {
    primaryFrameworks: ['strength_conversion', 'skill_frequency'],
    secondaryFrameworks: ['barseagle_strength'],
    recommendedFrequency: '2-3x per week, 10-20 minutes per session',
  },
  slow_muscle_up: {
    primaryFrameworks: ['strength_conversion', 'tendon_conservative'],
    secondaryFrameworks: ['skill_frequency'],
    recommendedFrequency: '1-2x per week, 5-10 minutes per session',
  },
  weighted_muscle_up: {
    primaryFrameworks: ['barseagle_strength', 'strength_conversion'],
    secondaryFrameworks: [],
    recommendedFrequency: '2x per week, 8-12 minutes per session',
  },
  one_arm_front_lever_row: {
    primaryFrameworks: ['skill_frequency', 'strength_conversion'],
    secondaryFrameworks: ['barseagle_strength'],
    recommendedFrequency: '2-3x per week, 10-15 minutes per session',
  },
  pseudo_planche_pushup: {
    primaryFrameworks: ['skill_frequency', 'strength_conversion'],
    secondaryFrameworks: [],
    recommendedFrequency: '2-3x per week, 5-10 minutes per session',
  },
  // Existing skills
  front_lever: {
    primaryFrameworks: ['skill_frequency', 'strength_conversion'],
    secondaryFrameworks: [],
    recommendedFrequency: '3-4x per week, 10-20 minutes per session',
  },
  planche: {
    primaryFrameworks: ['skill_frequency', 'strength_conversion'],
    secondaryFrameworks: ['tendon_conservative'],
    recommendedFrequency: '3-4x per week, 15-25 minutes per session',
  },
  muscle_up: {
    primaryFrameworks: ['strength_conversion', 'barseagle_strength'],
    secondaryFrameworks: ['skill_frequency'],
    recommendedFrequency: '2-3x per week, 10-20 minutes per session',
  },
  back_lever: {
    primaryFrameworks: ['skill_frequency'],
    secondaryFrameworks: ['strength_conversion'],
    recommendedFrequency: '2-3x per week, 10-15 minutes per session',
  },
  handstand: {
    primaryFrameworks: ['skill_frequency'],
    secondaryFrameworks: [],
    recommendedFrequency: '4-5x per week, 10-20 minutes per session',
  },
  hspu: {
    primaryFrameworks: ['strength_conversion', 'skill_frequency'],
    secondaryFrameworks: [],
    recommendedFrequency: '2-3x per week, 10-15 minutes per session',
  },
  l_sit: {
    primaryFrameworks: ['skill_frequency'],
    secondaryFrameworks: ['strength_conversion'],
    recommendedFrequency: '4-5x per week, 5-10 minutes per session',
  },
  v_sit: {
    primaryFrameworks: ['skill_frequency', 'strength_conversion'],
    secondaryFrameworks: [],
    recommendedFrequency: '3-4x per week, 5-10 minutes per session',
  },
  iron_cross: {
    primaryFrameworks: ['tendon_conservative', 'strength_conversion'],
    secondaryFrameworks: ['skill_frequency'],
    recommendedFrequency: '2x per week, 8-12 minutes per session',
  },
  one_arm_pull_up: {
    primaryFrameworks: ['strength_conversion', 'barseagle_strength'],
    secondaryFrameworks: ['skill_frequency'],
    recommendedFrequency: '2-3x per week, 10-20 minutes per session',
  },
  ring_muscle_up: {
    primaryFrameworks: ['strength_conversion', 'skill_frequency'],
    secondaryFrameworks: [],
    recommendedFrequency: '2-3x per week, 10-20 minutes per session',
  },
}
