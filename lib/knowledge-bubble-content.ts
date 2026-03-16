/**
 * Knowledge Bubble Content Database
 * 
 * Centralized coaching explanations for exercises, progressions, protocols,
 * and workout structure decisions. Used to help athletes understand
 * the reasoning behind SpartanLab's intelligent training recommendations.
 * 
 * Design Principles:
 * - Concise, coach-like language
 * - Focus on actionable understanding
 * - No fluff or excessive motivation
 * - Clear cause-and-effect explanations
 */

// =============================================================================
// TYPES
// =============================================================================

export type KnowledgeBubbleType =
  | 'exercise_reason'
  | 'progression_reason'
  | 'override_warning'
  | 'protocol_reason'
  | 'workout_structure_reason'
  | 'skill_readiness_reason'
  | 'joint_protocol_reason'
  | 'recovery_reason'
  | 'deload_reason'

export type KnowledgePriority = 'low' | 'medium' | 'high' | 'critical'

export interface KnowledgeBubbleContent {
  id: string
  type: KnowledgeBubbleType
  title: string
  shortText: string
  context?: string
  priority: KnowledgePriority
  skillRelevance?: string[]
  triggers?: string[]
}

export interface ExerciseKnowledge {
  exerciseId: string
  exerciseName: string
  shortReason: string
  skillCarryover?: string[]
  safetyNote?: string
  commonMistake?: string
}

export interface ProgressionKnowledge {
  fromStage: string
  toStage: string
  reason: string
  limitingFactor?: string
  readinessNote?: string
}

export interface ProtocolKnowledge {
  protocolId: string
  protocolName: string
  shortReason: string
  jointRegion: string
  skillConnection?: string[]
}

export interface StructureKnowledge {
  structureType: string
  reason: string
  benefit: string
}

// =============================================================================
// EXERCISE KNOWLEDGE DATABASE
// =============================================================================

export const EXERCISE_KNOWLEDGE: Record<string, ExerciseKnowledge> = {
  // Pulling exercises
  'weighted_pull_up': {
    exerciseId: 'weighted_pull_up',
    exerciseName: 'Weighted Pull-Up',
    shortReason: 'Builds foundational pulling strength required for front lever and muscle-up.',
    skillCarryover: ['front_lever', 'muscle_up', 'one_arm_pull_up'],
    commonMistake: 'Avoid kipping. Control the negative for maximum strength transfer.',
  },
  'front_lever_row': {
    exerciseId: 'front_lever_row',
    exerciseName: 'Front Lever Row',
    shortReason: 'Builds horizontal pulling strength with direct front lever carryover.',
    skillCarryover: ['front_lever'],
    safetyNote: 'Keep core tight and body in a straight line throughout the movement.',
  },
  'archer_pull_up': {
    exerciseId: 'archer_pull_up',
    exerciseName: 'Archer Pull-Up',
    shortReason: 'Develops unilateral pulling strength toward one-arm pull-up.',
    skillCarryover: ['one_arm_pull_up', 'muscle_up'],
  },
  'muscle_up': {
    exerciseId: 'muscle_up',
    exerciseName: 'Muscle-Up',
    shortReason: 'Combines explosive pull with transition strength for complete upper body power.',
    skillCarryover: ['ring_muscle_up'],
    safetyNote: 'Master strict pull-ups to chin level before attempting.',
  },
  'chest_to_bar_pull_up': {
    exerciseId: 'chest_to_bar_pull_up',
    exerciseName: 'Chest-to-Bar Pull-Up',
    shortReason: 'Develops the high pull strength needed for muscle-up transition.',
    skillCarryover: ['muscle_up', 'ring_muscle_up'],
  },
  
  // Pushing exercises
  'weighted_dip': {
    exerciseId: 'weighted_dip',
    exerciseName: 'Weighted Dip',
    shortReason: 'Builds foundational pushing strength for planche and HSPU.',
    skillCarryover: ['planche', 'handstand_pushup'],
    safetyNote: 'Keep shoulders down and elbows tracking backward.',
  },
  'ring_dip': {
    exerciseId: 'ring_dip',
    exerciseName: 'Ring Dip',
    shortReason: 'Develops shoulder stability and control required for ring work.',
    skillCarryover: ['planche', 'iron_cross', 'ring_muscle_up'],
    safetyNote: 'Master ring support hold first.',
  },
  'ring_push_up': {
    exerciseId: 'ring_push_up',
    exerciseName: 'Ring Push-Up',
    shortReason: 'Builds shoulder stability and scapular control before ring dips.',
    skillCarryover: ['ring_dip', 'planche'],
  },
  'pike_push_up': {
    exerciseId: 'pike_push_up',
    exerciseName: 'Pike Push-Up',
    shortReason: 'Foundation for vertical pressing toward handstand push-up.',
    skillCarryover: ['handstand_pushup'],
  },
  'wall_hspu': {
    exerciseId: 'wall_hspu',
    exerciseName: 'Wall Handstand Push-Up',
    shortReason: 'Builds overhead pressing strength with wall support for balance.',
    skillCarryover: ['handstand_pushup', 'freestanding_hspu'],
  },
  'pseudo_planche_pushup': {
    exerciseId: 'pseudo_planche_pushup',
    exerciseName: 'Pseudo Planche Push-Up',
    shortReason: 'Develops forward lean strength and shoulder conditioning for planche.',
    skillCarryover: ['planche'],
    safetyNote: 'Progress lean gradually to protect wrists and shoulders.',
  },
  'planche_lean': {
    exerciseId: 'planche_lean',
    exerciseName: 'Planche Lean',
    shortReason: 'Conditions shoulders and wrists for the extreme forward lean of planche.',
    skillCarryover: ['planche'],
    safetyNote: 'Hold for time rather than pushing through pain.',
  },
  'straight_bar_dip': {
    exerciseId: 'straight_bar_dip',
    exerciseName: 'Straight Bar Dip',
    shortReason: 'Supports muscle-up lockout strength and transition control.',
    skillCarryover: ['muscle_up'],
  },
  
  // Straight-arm pulling
  'tuck_front_lever': {
    exerciseId: 'tuck_front_lever',
    exerciseName: 'Tuck Front Lever',
    shortReason: 'Entry-level front lever hold building straight-arm strength.',
    skillCarryover: ['front_lever'],
  },
  'advanced_tuck_front_lever': {
    exerciseId: 'advanced_tuck_front_lever',
    exerciseName: 'Advanced Tuck Front Lever',
    shortReason: 'Increases lever length while maintaining core engagement.',
    skillCarryover: ['front_lever'],
  },
  'straddle_front_lever': {
    exerciseId: 'straddle_front_lever',
    exerciseName: 'Straddle Front Lever',
    shortReason: 'Near-full extension with reduced lever arm from straddle position.',
    skillCarryover: ['front_lever'],
  },
  
  // Straight-arm pushing
  'tuck_planche': {
    exerciseId: 'tuck_planche',
    exerciseName: 'Tuck Planche',
    shortReason: 'Entry-level planche hold building straight-arm pressing strength.',
    skillCarryover: ['planche'],
    safetyNote: 'Ensure wrist warm-up before practice.',
  },
  'straddle_planche': {
    exerciseId: 'straddle_planche',
    exerciseName: 'Straddle Planche',
    shortReason: 'Advanced planche progression with extended lever length.',
    skillCarryover: ['planche', 'full_planche'],
  },
  
  // Back lever
  'tuck_back_lever': {
    exerciseId: 'tuck_back_lever',
    exerciseName: 'Tuck Back Lever',
    shortReason: 'Develops supinated hang strength and bicep tendon conditioning.',
    skillCarryover: ['back_lever', 'iron_cross'],
    safetyNote: 'Enter and exit slowly to protect biceps.',
  },
  'german_hang': {
    exerciseId: 'german_hang',
    exerciseName: 'German Hang',
    shortReason: 'Stretches and strengthens shoulders for back lever entry.',
    skillCarryover: ['back_lever'],
    safetyNote: 'Start with bent arms if new to this position.',
  },
  
  // Iron Cross progressions
  'ring_support_hold': {
    exerciseId: 'ring_support_hold',
    exerciseName: 'Ring Support Hold',
    shortReason: 'Foundation for all advanced rings work. Builds shoulder stability and straight-arm strength.',
    skillCarryover: ['iron_cross', 'ring_dip', 'muscle_up'],
    safetyNote: 'Rings should be stable against the body. Do not allow excessive shaking.',
  },
  'rto_support_hold': {
    exerciseId: 'rto_support_hold',
    exerciseName: 'RTO Support Hold',
    shortReason: 'Develops the turned-out shoulder position required for cross and advanced rings skills.',
    skillCarryover: ['iron_cross', 'maltese'],
    safetyNote: 'Progress rotation gradually. Stop if shoulder discomfort occurs.',
  },
  'assisted_cross_hold': {
    exerciseId: 'assisted_cross_hold',
    exerciseName: 'Assisted Cross Hold',
    shortReason: 'Allows tendon adaptation to cross position before attempting unsupported holds.',
    skillCarryover: ['iron_cross'],
    safetyNote: 'Use appropriate band resistance. Do not ego-lift with too little assistance.',
    commonMistake: 'Rushing to reduce assistance before tendons are ready.',
  },
  'cross_negatives': {
    exerciseId: 'cross_negatives',
    exerciseName: 'Cross Negatives',
    shortReason: 'Eccentric cross training builds strength through the full ROM while conditioning tendons.',
    skillCarryover: ['iron_cross'],
    safetyNote: 'Use 5+ second descents. Stop immediately if sharp pain occurs.',
    commonMistake: 'Descending too fast - control is more important than volume.',
  },
  'partial_cross_hold': {
    exerciseId: 'partial_cross_hold',
    exerciseName: 'Partial Cross Hold',
    shortReason: 'Builds cross strength at reduced lever arm before attempting full horizontal.',
    skillCarryover: ['iron_cross'],
    safetyNote: 'Progress arm angle gradually over months, not weeks.',
  },
  'full_iron_cross': {
    exerciseId: 'full_iron_cross',
    exerciseName: 'Full Iron Cross',
    shortReason: 'Elite rings skill requiring years of preparation. Peak straight-arm shoulder strength.',
    skillCarryover: ['maltese', 'victorian'],
    safetyNote: 'This skill requires years of progressive tendon conditioning. Never rush this progression.',
    commonMistake: 'Attempting full cross before partial holds are solid. This leads to injury.',
  },
  
  // Core / Compression
  'compression_hold': {
    exerciseId: 'compression_hold',
    exerciseName: 'Compression Hold',
    shortReason: 'Improves hip flexor and core compression needed for levers and L-sit.',
    skillCarryover: ['l_sit', 'v_sit', 'front_lever', 'planche'],
  },
  'l_sit': {
    exerciseId: 'l_sit',
    exerciseName: 'L-Sit',
    shortReason: 'Core compression skill that builds foundation for V-sit and manna.',
    skillCarryover: ['v_sit', 'manna'],
  },
  'hollow_body_hold': {
    exerciseId: 'hollow_body_hold',
    exerciseName: 'Hollow Body Hold',
    shortReason: 'Develops anti-extension core strength for levers and handstands.',
    skillCarryover: ['front_lever', 'handstand'],
  },
  'dragon_flag': {
    exerciseId: 'dragon_flag',
    exerciseName: 'Dragon Flag',
    shortReason: 'Intense anti-extension work with direct front lever carryover.',
    skillCarryover: ['front_lever'],
  },
  'hanging_leg_raise': {
    exerciseId: 'hanging_leg_raise',
    exerciseName: 'Hanging Leg Raise',
    shortReason: 'Combines compression strength with grip and scapular control.',
    skillCarryover: ['front_lever', 'l_sit'],
  },
  
  // Ring support
  'ring_support_hold': {
    exerciseId: 'ring_support_hold',
    exerciseName: 'Ring Support Hold',
    shortReason: 'Foundational ring stability required before any ring pressing.',
    skillCarryover: ['ring_dip', 'iron_cross', 'muscle_up'],
  },
  'rto_support': {
    exerciseId: 'rto_support',
    exerciseName: 'Rings Turned Out Support',
    shortReason: 'Advanced support position building toward iron cross.',
    skillCarryover: ['iron_cross', 'ring_dip'],
  },
}

// =============================================================================
// PROGRESSION KNOWLEDGE DATABASE
// =============================================================================

export const PROGRESSION_KNOWLEDGE: Record<string, ProgressionKnowledge> = {
  'tuck_to_adv_tuck_fl': {
    fromStage: 'Tuck Front Lever',
    toStage: 'Advanced Tuck Front Lever',
    reason: 'Chosen because your pulling strength is strong enough, but full lever length would exceed current compression readiness.',
    limitingFactor: 'compression',
  },
  'adv_tuck_to_one_leg_fl': {
    fromStage: 'Advanced Tuck Front Lever',
    toStage: 'One Leg Front Lever',
    reason: 'Extending one leg increases lever length while maintaining control.',
    limitingFactor: 'straight_arm_strength',
  },
  'one_leg_to_straddle_fl': {
    fromStage: 'One Leg Front Lever',
    toStage: 'Straddle Front Lever',
    reason: 'Straddle position is near-full extension with reduced moment arm.',
    limitingFactor: 'lat_strength',
  },
  'ring_pushup_to_ring_dip': {
    fromStage: 'Ring Push-Up',
    toStage: 'Ring Dip',
    reason: 'Ring dips require the shoulder stability built through ring push-ups.',
    limitingFactor: 'shoulder_stability',
    readinessNote: 'You should hold RTO push-up position confidently before progressing.',
  },
  'tuck_to_adv_tuck_planche': {
    fromStage: 'Tuck Planche',
    toStage: 'Advanced Tuck Planche',
    reason: 'Hip extension increases demand on shoulder and core stability.',
    limitingFactor: 'shoulder_strength',
  },
  'pike_to_wall_hspu': {
    fromStage: 'Pike Push-Up',
    toStage: 'Wall HSPU',
    reason: 'Wall support allows vertical pressing development before freestanding work.',
    limitingFactor: 'overhead_pressing_strength',
  },
  'wall_hspu_to_deficit_hspu': {
    fromStage: 'Wall HSPU',
    toStage: 'Deficit Wall HSPU',
    reason: 'Increased range of motion builds full pressing strength.',
    limitingFactor: 'pressing_range',
  },
}

// =============================================================================
// PROTOCOL KNOWLEDGE DATABASE
// =============================================================================

export const PROTOCOL_KNOWLEDGE: Record<string, ProtocolKnowledge> = {
  'wrist_prep': {
    protocolId: 'wrist_prep',
    protocolName: 'Wrist Integrity Protocol',
    shortReason: 'Wrist integrity work was added to support planche and handstand training.',
    jointRegion: 'wrist',
    skillConnection: ['planche', 'handstand', 'handstand_pushup'],
  },
  'shoulder_stability': {
    protocolId: 'shoulder_stability',
    protocolName: 'Shoulder Stability Protocol',
    shortReason: 'Scapular activation improves front lever control and shoulder stability.',
    jointRegion: 'shoulder',
    skillConnection: ['front_lever', 'planche', 'muscle_up', 'iron_cross'],
  },
  'elbow_prehab': {
    protocolId: 'elbow_prehab',
    protocolName: 'Elbow Integrity Protocol',
    shortReason: 'Elbow conditioning protects against strain during straight-arm work.',
    jointRegion: 'elbow',
    skillConnection: ['planche', 'iron_cross', 'back_lever'],
  },
  'hip_mobility': {
    protocolId: 'hip_mobility',
    protocolName: 'Hip Mobility Protocol',
    shortReason: 'Hip flexibility supports straddle positions and compression work.',
    jointRegion: 'hip',
    skillConnection: ['v_sit', 'straddle_front_lever', 'straddle_planche'],
  },
  'scapular_activation': {
    protocolId: 'scapular_activation',
    protocolName: 'Scapular Activation',
    shortReason: 'Scapular control is essential for stable pulling and pushing.',
    jointRegion: 'scapula',
    skillConnection: ['front_lever', 'muscle_up', 'planche'],
  },
}

// =============================================================================
// WORKOUT STRUCTURE KNOWLEDGE
// =============================================================================

export const STRUCTURE_KNOWLEDGE: Record<string, StructureKnowledge> = {
  'skill_first': {
    structureType: 'skill_first',
    reason: 'Skill work comes first so technique quality stays high before fatigue sets in.',
    benefit: 'Maximizes neurological adaptation and movement quality.',
  },
  'strength_before_accessory': {
    structureType: 'strength_before_accessory',
    reason: 'Compound strength work appears before accessories to prioritize main adaptations.',
    benefit: 'Ensures you have energy for the exercises that matter most.',
  },
  'accessory_support': {
    structureType: 'accessory_support',
    reason: 'Accessory work supports muscle balance without reducing main skill quality.',
    benefit: 'Builds supporting muscles that protect joints and improve main lifts.',
  },
  'limiter_priority': {
    structureType: 'limiter_priority',
    reason: 'Your current limiting factor receives priority positioning in the session.',
    benefit: 'Addresses your specific weakness when energy is highest.',
  },
  'protocol_warmup': {
    structureType: 'protocol_warmup',
    reason: 'Joint protocols appear in warm-up to prepare specific areas for main work.',
    benefit: 'Reduces injury risk and improves movement quality.',
  },
  'density_grouping': {
    structureType: 'density_grouping',
    reason: 'Related exercises are grouped to maintain training density efficiently.',
    benefit: 'Saves time while keeping related muscles warm.',
  },
  'recovery_placement': {
    structureType: 'recovery_placement',
    reason: 'Mobility and recovery work is placed at session end when muscles are warm.',
    benefit: 'Maximizes flexibility gains and aids recovery.',
  },
}

// =============================================================================
// SKILL READINESS EXPLANATIONS
// =============================================================================

export const READINESS_EXPLANATIONS: Record<string, string> = {
  // Front Lever limiters
  'fl_compression': 'Compression is currently the main factor holding back your Front Lever.',
  'fl_pulling': 'Pulling strength needs development for your current Front Lever stage.',
  'fl_scapular': 'Scapular control is limiting your Front Lever stability.',
  'fl_straight_arm': 'Straight-arm strength is the primary gap in your Front Lever readiness.',
  
  // Planche limiters
  'pl_shoulder': 'Shoulder stability is the limiting factor for your current Planche progression.',
  'pl_straight_arm': 'Straight-arm pressing strength is your main Planche limiter.',
  'pl_wrist': 'Wrist tolerance needs development before advancing your Planche.',
  'pl_lean': 'Forward lean tolerance is limiting your Planche progression.',
  
  // Muscle-Up limiters
  'mu_explosive': 'Explosive pull strength is the largest gap in your Muscle-Up readiness.',
  'mu_transition': 'Transition strength needs work for clean Muscle-Up execution.',
  'mu_height': 'Pull height (chest-to-bar) is limiting your Muscle-Up potential.',
  'mu_dip': 'Dip lockout strength is needed for completing the Muscle-Up.',
  
  // HSPU limiters
  'hspu_pressing': 'Overhead pressing strength is your main HSPU limiter.',
  'hspu_balance': 'Handstand balance is limiting your freestanding HSPU work.',
  'hspu_shoulder': 'Shoulder mobility needs improvement for full range HSPU.',
  
  // L-Sit limiters
  'lsit_compression': 'Hip flexor and compression strength is limiting your L-Sit.',
  'lsit_tricep': 'Tricep lockout endurance needs development for longer L-Sit holds.',
  
  // Iron Cross limiters
  'ic_ring_support': 'Ring support stability is the foundation you need to build for Cross work.',
  'ic_rto': 'RTO (Rings Turned Out) support strength is limiting your Cross progression.',
  'ic_straight_arm': 'Straight-arm shoulder strength is the primary gap in your Iron Cross readiness.',
  'ic_scapular': 'Scapular depression strength needs development for Cross holds.',
  'ic_shoulder': 'Shoulder stability is critical for Iron Cross. Build this before advancing.',
  'ic_tendon': 'Tendon tolerance requires years of conditioning. Do not rush Cross progressions.',
  
  // Strong areas
  'strong_pulling': 'Pulling strength is already strong enough for your current stage.',
  'strong_pushing': 'Pushing strength is well developed for your current goals.',
  'strong_compression': 'Compression strength is ahead of other components.',
  'strong_stability': 'Shoulder stability is a relative strength for you.',
  'strong_ring_support': 'Ring support stability is solid for your current Cross progression.',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get knowledge bubble content for an exercise
 */
export function getExerciseKnowledge(exerciseId: string): ExerciseKnowledge | undefined {
  const normalizedId = exerciseId.toLowerCase().replace(/[\s-]+/g, '_')
  return EXERCISE_KNOWLEDGE[normalizedId]
}

/**
 * Get progression explanation for a stage transition
 */
export function getProgressionKnowledge(fromStage: string, toStage: string): ProgressionKnowledge | undefined {
  const key = `${fromStage.toLowerCase().replace(/[\s-]+/g, '_')}_to_${toStage.toLowerCase().replace(/[\s-]+/g, '_')}`
  return PROGRESSION_KNOWLEDGE[key]
}

/**
 * Get protocol explanation
 */
export function getProtocolKnowledge(protocolId: string): ProtocolKnowledge | undefined {
  return PROTOCOL_KNOWLEDGE[protocolId.toLowerCase().replace(/[\s-]+/g, '_')]
}

/**
 * Get workout structure explanation
 */
export function getStructureKnowledge(structureType: string): StructureKnowledge | undefined {
  return STRUCTURE_KNOWLEDGE[structureType]
}

/**
 * Get readiness explanation for a limiting factor
 */
export function getReadinessExplanation(skill: string, limitingFactor: string): string | undefined {
  const key = `${skill.toLowerCase().substring(0, 2)}_${limitingFactor.toLowerCase().replace(/[\s-]+/g, '_')}`
  return READINESS_EXPLANATIONS[key]
}

/**
 * Get strong area explanation
 */
export function getStrongAreaExplanation(area: string): string | undefined {
  const key = `strong_${area.toLowerCase().replace(/[\s-]+/g, '_')}`
  return READINESS_EXPLANATIONS[key]
}

/**
 * Check if an exercise has knowledge content
 */
export function hasExerciseKnowledge(exerciseId: string): boolean {
  return !!getExerciseKnowledge(exerciseId)
}

/**
 * Determine if knowledge bubble should be shown based on context
 */
export function shouldShowKnowledgeBubble(
  context: {
    isFirstTimeSeeing?: boolean
    isOverrideAttempt?: boolean
    isProtocolAddition?: boolean
    isLimitingFactor?: boolean
    hasSafetyNote?: boolean
    userPreference?: 'always' | 'smart' | 'never'
  }
): boolean {
  // Never show if user disabled
  if (context.userPreference === 'never') return false
  
  // Always show if user prefers
  if (context.userPreference === 'always') return true
  
  // Smart triggers - show in meaningful moments
  return !!(
    context.isFirstTimeSeeing ||
    context.isOverrideAttempt ||
    context.isProtocolAddition ||
    context.isLimitingFactor ||
    context.hasSafetyNote
  )
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: KnowledgePriority): string {
  switch (priority) {
    case 'critical': return 'text-red-500'
    case 'high': return 'text-amber-500'
    case 'medium': return 'text-[#4F6D8A]'
    case 'low': return 'text-[#6B7280]'
    default: return 'text-[#6B7280]'
  }
}
