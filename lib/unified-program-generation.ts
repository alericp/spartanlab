// Unified Program Generation
// Connects the unified coaching engine to actual program output
// Ensures all systems feed into one coherent training plan

import {
  buildUnifiedContext,
  type UnifiedEngineContext,
  type AthleteContext,
  type SkillContext,
  type ConstraintContext,
  type EnvelopeContext,
  type FatigueContext,
  type TrainingStyleMode,
  type SessionAdjustments,
  type MovementBiasContext,
} from './unified-coaching-engine'
import { applyBiasToVolume } from './movement-bias-detection-engine'
import { selectMethodProfiles, type SelectedMethods, type SelectionContext } from './training-principles-engine'
import { getSmartSubstitutions, mapEquipmentArray } from './exercise-family-integration'
import { type MovementFamily, type EquipmentTag } from './movement-family-registry'
import { 
  getRepRangeForStyle, 
  getRestPeriodForStyle,
  getRecommendedAccessoryVolume,
  getStyleEquipmentExercises,
  getComboBlocksForSkill,
  getStyleCoachingSummary,
  refineStyleWithEnvelope,
  type StyleProgrammingRules,
  type ComboBlock
} from './training-style-service'

// =============================================================================
// TYPES
// =============================================================================

export interface UnifiedSessionPlan {
  dayNumber: number
  dayLabel: string
  focus: string
  focusLabel: string
  isPrimaryDay: boolean
  
  // Blocks
  warmupBlock: ProgramBlock
  skillBlock: ProgramBlock
  strengthBlock: ProgramBlock
  accessoryBlock: ProgramBlock | null
  cooldownBlock: ProgramBlock
  
  // Adjustments applied
  appliedAdjustments: string[]
  
  // Timing
  estimatedMinutes: number
  canCompress: boolean
  compressedMinutes: number
  
  // Coaching notes
  coachingNotes: string[]
  rationale: string
}

export interface ProgramBlock {
  name: string
  exercises: ProgramExercise[]
  estimatedMinutes: number
  priority: 'essential' | 'important' | 'optional'
  canSkip: boolean
}

export interface ProgramExercise {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  notes: string[]
  movementFamily: MovementFamily
  isSubstitutable: boolean
  substitutionOptions?: string[]
}

export interface UnifiedProgramOutput {
  sessions: UnifiedSessionPlan[]
  weeklyStructure: WeeklyStructure
  coachingSummary: string
  constraintEmphasis: string | null
  styleMode: TrainingStyleMode
  fatigueStatus: string
  recommendations: string[]
  engineVersion: string
}

export interface WeeklyStructure {
  totalDays: number
  primaryDays: number[]
  supportDays: number[]
  restDays: number[]
  weeklyVolume: {
    skill: number
    strength: number
    accessory: number
  }
  biasAdjustment?: {
    pushVolumeRatio: number
    pullVolumeRatio: number
    emphasizePush: boolean
    emphasizePull: boolean
  }
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

/**
 * Generate a complete training program using the unified engine context
 */
export async function generateUnifiedProgram(userId: string): Promise<UnifiedProgramOutput> {
  // Build unified context - single source of truth
  const context = await buildUnifiedContext(userId)
  
  // Determine weekly structure
  const weeklyStructure = buildWeeklyStructure(context)
  
  // Generate each session
  const sessions: UnifiedSessionPlan[] = []
  for (let day = 1; day <= context.athlete.trainingDaysPerWeek; day++) {
    const session = generateSession(context, day, weeklyStructure)
    sessions.push(session)
  }
  
  // Build recommendations
  const recommendations = buildRecommendations(context)
  
  return {
    sessions,
    weeklyStructure,
    coachingSummary: context.coachingSummary.headline,
    constraintEmphasis: context.constraints.primaryConstraint?.replace(/_/g, ' ') || null,
    styleMode: context.athlete.trainingStyle,
    fatigueStatus: context.fatigue.fatigueLevel,
    recommendations,
    engineVersion: context.engineVersion,
  }
}

// =============================================================================
// WEEKLY STRUCTURE
// =============================================================================

function buildWeeklyStructure(context: UnifiedEngineContext): WeeklyStructure {
  const days = context.athlete.trainingDaysPerWeek
  const primaryDays: number[] = []
  const supportDays: number[] = []
  const restDays: number[] = []
  
  // Distribute days based on frequency
  if (days >= 3) {
    // At least 3 days: skill focus on days 1, 3, optional 5
    primaryDays.push(1, 3)
    if (days >= 5) primaryDays.push(5)
    
    // Support days fill the gaps
    for (let i = 1; i <= days; i++) {
      if (!primaryDays.includes(i)) supportDays.push(i)
    }
  } else {
    // 1-2 days: all primary
    for (let i = 1; i <= days; i++) primaryDays.push(i)
  }
  
  // Rest days
  for (let i = 1; i <= 7; i++) {
    if (!primaryDays.includes(i) && !supportDays.includes(i)) {
      restDays.push(i)
    }
  }
  
  // Calculate weekly volume based on style and fatigue
  const baseVolume = getBaseVolume(context.athlete.trainingStyle, context.athlete.styleProgrammingRules)
  const volumeMultiplier = context.fatigue.sessionAdjustments.volumeMultiplier
  
  // Apply movement bias adjustments to volume distribution
  // This ensures pull-dominant athletes get more push volume and vice versa
  const biasAdjustment = context.movementBias.volumeAdjustment
  const pushPullRatio = {
    push: biasAdjustment.pushVolumeRatio,
    pull: biasAdjustment.pullVolumeRatio,
  }
  
  // Calculate bias-adjusted strength volume
  // If athlete is pull-dominant, increase push volume within strength allocation
  const strengthVolume = Math.round(baseVolume.strength * volumeMultiplier)
  
  return {
    totalDays: days,
    primaryDays,
    supportDays,
    restDays,
    weeklyVolume: {
      skill: Math.round(baseVolume.skill * volumeMultiplier),
      strength: strengthVolume,
      accessory: Math.round(baseVolume.accessory * volumeMultiplier),
    },
    // Include bias adjustment ratios for session-level use
    biasAdjustment: {
      pushVolumeRatio: pushPullRatio.push,
      pullVolumeRatio: pushPullRatio.pull,
      emphasizePush: biasAdjustment.emphasizePush,
      emphasizePull: biasAdjustment.emphasizePull,
    },
  }
}

function getBaseVolume(
  style: TrainingStyleMode,
  rules?: StyleProgrammingRules
): { skill: number; strength: number; accessory: number } {
  // Base volumes per style, then apply rules multipliers
  const baseVolumes: Record<TrainingStyleMode, { skill: number; strength: number; accessory: number }> = {
    skill_focused: { skill: 12, strength: 8, accessory: 4 },
    strength_focused: { skill: 8, strength: 14, accessory: 6 },
    power_focused: { skill: 8, strength: 10, accessory: 4 },
    endurance_focused: { skill: 10, strength: 8, accessory: 8 },
    hypertrophy_supported: { skill: 8, strength: 10, accessory: 10 },
    balanced_hybrid: { skill: 10, strength: 10, accessory: 6 },
  }
  
  const base = baseVolumes[style] || baseVolumes.balanced_hybrid
  
  // Apply style programming rules if provided
  if (rules) {
    return {
      skill: Math.round(base.skill * rules.skillExposureMultiplier),
      strength: Math.round(base.strength * rules.strengthVolumeMultiplier),
      accessory: Math.round(base.accessory * rules.accessoryVolumeMultiplier),
    }
  }
  
  return base
}

// =============================================================================
// SESSION GENERATION
// =============================================================================

function generateSession(
  context: UnifiedEngineContext,
  dayNumber: number,
  structure: WeeklyStructure
): UnifiedSessionPlan {
  const isPrimaryDay = structure.primaryDays.includes(dayNumber)
  const adjustments = context.fatigue.sessionAdjustments
  const appliedAdjustments: string[] = [...adjustments.notes]
  const coachingNotes: string[] = []
  
  // Determine focus for this day
  const focus = isPrimaryDay ? context.athlete.primaryGoal : 'support'
  const focusLabel = isPrimaryDay 
    ? context.athlete.primaryGoalLabel 
    : 'Support & Recovery'
  
  // Day label
  const dayLabel = getDayLabel(dayNumber, isPrimaryDay, focus)
  
  // Build blocks
  const warmupBlock = buildWarmupBlock(context, isPrimaryDay)
  const skillBlock = buildSkillBlock(context, isPrimaryDay, adjustments)
  const strengthBlock = buildStrengthBlock(context, isPrimaryDay, adjustments)
  const accessoryBlock = adjustments.skipAccessories 
    ? null 
    : buildAccessoryBlock(context, isPrimaryDay, adjustments)
  const cooldownBlock = buildCooldownBlock(context, adjustments.includeExtraRecovery)
  
  // Calculate timing
  const blocks = [warmupBlock, skillBlock, strengthBlock, accessoryBlock, cooldownBlock].filter(Boolean) as ProgramBlock[]
  const estimatedMinutes = blocks.reduce((sum, b) => sum + b.estimatedMinutes, 0)
  
  // Build rationale
  const rationale = buildSessionRationale(context, isPrimaryDay, focus)
  
  // Add coaching notes
  if (context.coachingSummary.constraintNote) {
    coachingNotes.push(context.coachingSummary.constraintNote)
  }
  if (isPrimaryDay && context.skills.primarySkillState?.nextMilestone) {
    coachingNotes.push(`Working toward ${context.skills.primarySkillState.nextMilestone}`)
  }
  
  return {
    dayNumber,
    dayLabel,
    focus,
    focusLabel,
    isPrimaryDay,
    warmupBlock,
    skillBlock,
    strengthBlock,
    accessoryBlock,
    cooldownBlock,
    appliedAdjustments,
    estimatedMinutes,
    canCompress: estimatedMinutes > 30,
    compressedMinutes: Math.round(estimatedMinutes * 0.7),
    coachingNotes,
    rationale,
  }
}

function getDayLabel(day: number, isPrimary: boolean, focus: string): string {
  const dayNames = ['', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
  const prefix = isPrimary ? 'Primary' : 'Support'
  const goalLabel = focus.replace(/_/g, ' ')
  return `${dayNames[day]} - ${prefix}: ${goalLabel}`
}

// =============================================================================
// BLOCK BUILDERS
// =============================================================================

function buildWarmupBlock(context: UnifiedEngineContext, isPrimaryDay: boolean): ProgramBlock {
  const exercises: ProgramExercise[] = []
  const protocols = context.protocols.warmupProtocols
  
  // Add standard warmup
  exercises.push({
    id: 'general_warmup',
    name: 'General Warmup',
    sets: 1,
    reps: '5 minutes',
    rest: '-',
    notes: ['Light cardio or dynamic movement'],
    movementFamily: 'mobility',
    isSubstitutable: false,
  })
  
  // Add skill-specific prep if primary day
  if (isPrimaryDay && context.skills.primarySkillState) {
    const skill = context.skills.primarySkillState.skill
    exercises.push({
      id: `${skill}_prep`,
      name: `${context.athlete.primaryGoalLabel} Preparation`,
      sets: 2,
      reps: '30-60s holds or 5-8 reps',
      rest: '30s',
      notes: ['Focus on activation and position quality'],
      movementFamily: 'skill_isometric',
      isSubstitutable: false,
    })
  }
  
  // Add protocol exercises
  protocols.slice(0, 2).forEach(protocol => {
    exercises.push({
      id: protocol.id,
      name: protocol.name,
      sets: 2,
      reps: protocol.prescription || '8-12 reps',
      rest: '30s',
      notes: [protocol.rationale || ''],
      movementFamily: 'joint_integrity',
      isSubstitutable: true,
    })
  })
  
  return {
    name: 'Warmup',
    exercises,
    estimatedMinutes: isPrimaryDay ? 10 : 7,
    priority: 'essential',
    canSkip: false,
  }
}

function buildSkillBlock(
  context: UnifiedEngineContext,
  isPrimaryDay: boolean,
  adjustments: SessionAdjustments
): ProgramBlock {
  const exercises: ProgramExercise[] = []
  const skill = context.skills.primarySkillState
  const equipment = mapEquipmentArray(context.athlete.equipment)
  
  if (!isPrimaryDay || !skill) {
    // Support day: lighter skill exposure
    exercises.push({
      id: 'skill_exposure',
      name: 'Skill Position Practice',
      sets: 2,
      reps: '3-5 holds',
      rest: '60s',
      notes: ['Maintain position quality', 'Lower intensity exposure'],
      movementFamily: 'skill_isometric',
      isSubstitutable: true,
    })
    
    return {
      name: 'Skill Practice',
      exercises,
      estimatedMinutes: 8,
      priority: 'important',
      canSkip: false,
    }
  }
  
  // Primary day: focused skill work
  const baseSets = context.athlete.trainingStyle === 'skill_focused' ? 5 : 4
  const sets = Math.round(baseSets * adjustments.volumeMultiplier)
  
  // Get exercise based on current level
  const levelName = skill.currentLevel ? `Level ${skill.currentLevel}` : 'Current progression'
  
  exercises.push({
    id: `${skill.skill}_main`,
    name: `${context.athlete.primaryGoalLabel} - ${levelName}`,
    sets,
    reps: getSkillReps(skill.skill, context.athlete.trainingStyle),
    rest: getSkillRest(context.athlete.trainingStyle),
    notes: getSkillNotes(skill, context.constraints),
    movementFamily: getSkillMovementFamily(skill.skill),
    isSubstitutable: false,
  })
  
  // Add skill support exercise based on limiting factor
  if (skill.limitingFactor) {
    const supportExercise = getSkillSupportExercise(skill.limitingFactor, equipment)
    if (supportExercise) {
      exercises.push(supportExercise)
    }
  }
  
  return {
    name: 'Skill Development',
    exercises,
    estimatedMinutes: 15,
    priority: 'essential',
    canSkip: false,
  }
}

function buildStrengthBlock(
  context: UnifiedEngineContext,
  isPrimaryDay: boolean,
  adjustments: SessionAdjustments
): ProgramBlock {
  const exercises: ProgramExercise[] = []
  const equipment = mapEquipmentArray(context.athlete.equipment)
  const constraints = context.constraints
  
  // Get rep range from envelope or style
  const repRange = context.envelope.recommendations.preferredRepRange 
    || getDefaultRepRange(context.athlete.trainingStyle)
  
  // Determine which strength movements to prioritize
  const priorityFamilies: MovementFamily[] = []
  
  // Add movements based on constraints
  if (constraints.volumeAdjustments.increasePriority.includes('weighted_pull')) {
    priorityFamilies.push('vertical_pull')
  }
  if (constraints.volumeAdjustments.increasePriority.includes('weighted_dip')) {
    priorityFamilies.push('dip_pattern')
  }
  if (constraints.volumeAdjustments.increasePriority.includes('straight_arm_pull')) {
    priorityFamilies.push('straight_arm_pull')
  }
  
  // Default to vertical pull and push if no specific constraints
  if (priorityFamilies.length === 0) {
    priorityFamilies.push('vertical_pull', 'vertical_push')
  }
  
  // Build exercises for each priority family
  const baseSets = context.athlete.trainingStyle === 'strength_focused' ? 4 : 3
  const sets = Math.round(baseSets * adjustments.volumeMultiplier)
  
  priorityFamilies.slice(0, 2).forEach(family => {
    const exercise = buildStrengthExercise(family, sets, repRange, equipment, context)
    if (exercise) exercises.push(exercise)
  })
  
  // Add secondary strength if time allows
  if (!adjustments.skipAccessories && exercises.length < 3) {
    const secondaryFamilies = constraints.volumeAdjustments.maintainPriority
    secondaryFamilies.slice(0, 1).forEach(movementType => {
      const family = mapMovementTypeToFamily(movementType)
      if (family && !priorityFamilies.includes(family)) {
        const exercise = buildStrengthExercise(family, sets - 1, repRange, equipment, context)
        if (exercise) exercises.push(exercise)
      }
    })
  }
  
  return {
    name: 'Strength Development',
    exercises,
    estimatedMinutes: exercises.length * 6,
    priority: 'essential',
    canSkip: false,
  }
}

function buildAccessoryBlock(
  context: UnifiedEngineContext,
  isPrimaryDay: boolean,
  adjustments: SessionAdjustments
): ProgramBlock {
  const exercises: ProgramExercise[] = []
  const equipment = mapEquipmentArray(context.athlete.equipment)
  
  // Only include hypertrophy accessories if style supports it
  const includeHypertrophy = 
    context.athlete.trainingStyle === 'hypertrophy_supported' ||
    context.athlete.trainingStyle === 'balanced_hybrid'
  
  // Compression work is always included if relevant
  if (context.constraints.volumeAdjustments.increasePriority.includes('compression')) {
    exercises.push({
      id: 'compression_work',
      name: 'Compression Training',
      sets: 3,
      reps: '20-30s holds',
      rest: '45s',
      notes: ['Focus on hip flexor engagement', 'Progress to pike compression'],
      movementFamily: 'compression_core',
      isSubstitutable: true,
      substitutionOptions: ['l_sit', 'pike_compression', 'v_up'],
    })
  }
  
  // Add scapular work if needed
  if (context.constraints.volumeAdjustments.increasePriority.includes('scapular')) {
    exercises.push({
      id: 'scapular_work',
      name: 'Scapular Control',
      sets: 2,
      reps: '10-12 reps',
      rest: '45s',
      notes: ['Full range of motion', 'Control the movement'],
      movementFamily: 'scapular_control',
      isSubstitutable: true,
    })
  }
  
  // Add calisthenics-first hypertrophy if applicable
  if (includeHypertrophy && exercises.length < 3) {
    // Prioritize exercises with skill carryover
    const primarySkill = context.skills.primarySkillState?.skill
    
    if (primarySkill === 'front_lever' && equipment.includes('rings' as EquipmentTag)) {
      exercises.push({
        id: 'row_variation',
        name: 'Low Angle Row',
        sets: 3,
        reps: '8-12 reps',
        rest: '60s',
        notes: ['Front lever carryover', 'Focus on scapular retraction'],
        movementFamily: 'horizontal_pull',
        isSubstitutable: true,
        substitutionOptions: ['inverted_row', 'ring_row', 'cable_row'],
      })
    }
    
    if (primarySkill === 'muscle_up') {
      exercises.push({
        id: 'straight_bar_dip',
        name: 'Straight Bar Dip',
        sets: 3,
        reps: '6-10 reps',
        rest: '90s',
        notes: ['Muscle-up carryover', 'Deep range of motion'],
        movementFamily: 'dip_pattern',
        isSubstitutable: true,
        substitutionOptions: ['ring_dip', 'weighted_dip'],
      })
    }
    
    // Add curl variation for pulling support
    if (exercises.length < 3 && equipment.includes('dumbbells' as EquipmentTag)) {
      exercises.push({
        id: 'curl_variation',
        name: 'Incline Curl',
        sets: 2,
        reps: '10-12 reps',
        rest: '45s',
        notes: ['Bicep development for pulling support'],
        movementFamily: 'hypertrophy_accessory',
        isSubstitutable: true,
        substitutionOptions: ['hammer_curl', 'spider_curl'],
      })
    }
  }
  
  return {
    name: 'Accessory Work',
    exercises,
    estimatedMinutes: exercises.length * 4,
    priority: 'optional',
    canSkip: true,
  }
}

function buildCooldownBlock(context: UnifiedEngineContext, includeExtra: boolean): ProgramBlock {
  const exercises: ProgramExercise[] = []
  
  exercises.push({
    id: 'stretching',
    name: 'Static Stretching',
    sets: 1,
    reps: '5-7 minutes',
    rest: '-',
    notes: ['Hold each stretch 30-60 seconds', 'Focus on worked muscle groups'],
    movementFamily: 'mobility',
    isSubstitutable: false,
  })
  
  // Add recovery protocols
  if (includeExtra) {
    context.protocols.recoveryProtocols.slice(0, 2).forEach(protocol => {
      exercises.push({
        id: protocol.id,
        name: protocol.name,
        sets: 1,
        reps: protocol.prescription || '2 minutes',
        rest: '-',
        notes: [protocol.rationale || 'Recovery support'],
        movementFamily: 'mobility',
        isSubstitutable: true,
      })
    })
  }
  
  return {
    name: 'Cooldown',
    exercises,
    estimatedMinutes: includeExtra ? 10 : 5,
    priority: 'important',
    canSkip: false,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getSkillReps(skill: string, style: TrainingStyleMode): string {
  if (style === 'skill_focused') {
    return '5-8 sec holds x 3-5 reps'
  }
  if (style === 'strength_focused') {
    return '8-12 sec holds x 3-4 reps'
  }
  return '5-10 sec holds x 4-5 reps'
}

function getSkillRest(style: TrainingStyleMode): string {
  if (style === 'endurance_focused') return '60-90s'
  if (style === 'strength_focused') return '2-3 min'
  return '90-120s'
}

function getSkillNotes(skill: SkillContext['primarySkillState'], constraints: ConstraintContext): string[] {
  const notes: string[] = ['Focus on position quality over duration']
  
  if (skill?.limitingFactor) {
    notes.push(`Address ${skill.limitingFactor.replace(/_/g, ' ')} in subsequent sets`)
  }
  
  if (constraints.primaryConstraint) {
    notes.push(`Current emphasis: ${constraints.primaryConstraint.replace(/_/g, ' ')}`)
  }
  
  return notes
}

function getSkillMovementFamily(skill: string): MovementFamily {
  const skillFamilies: Record<string, MovementFamily> = {
    front_lever: 'straight_arm_pull',
    back_lever: 'straight_arm_pull',
    planche: 'straight_arm_push',
    hspu: 'vertical_push',
    muscle_up: 'explosive_pull',
    l_sit: 'compression_core',
  }
  return skillFamilies[skill] || 'skill_isometric'
}

function getSkillSupportExercise(
  limitingFactor: string,
  equipment: EquipmentTag[]
): ProgramExercise | null {
  const supportMap: Record<string, ProgramExercise> = {
    pull_strength: {
      id: 'pull_support',
      name: 'Weighted Pull-Up',
      sets: 3,
      reps: '5-8 reps',
      rest: '2 min',
      notes: ['Build pulling strength foundation'],
      movementFamily: 'vertical_pull',
      isSubstitutable: true,
      substitutionOptions: ['pull_up', 'lat_pulldown'],
    },
    compression_strength: {
      id: 'compression_support',
      name: 'Pike Compression',
      sets: 3,
      reps: '15-20 sec holds',
      rest: '45s',
      notes: ['Active hip flexor engagement'],
      movementFamily: 'compression_core',
      isSubstitutable: true,
    },
    straight_arm_pull_strength: {
      id: 'sa_pull_support',
      name: 'Front Lever Raise',
      sets: 3,
      reps: '5-8 reps',
      rest: '90s',
      notes: ['Controlled eccentric'],
      movementFamily: 'straight_arm_pull',
      isSubstitutable: true,
    },
    straight_arm_push_strength: {
      id: 'sa_push_support',
      name: 'Planche Lean',
      sets: 3,
      reps: '20-30 sec holds',
      rest: '60s',
      notes: ['Protract shoulders, lean forward'],
      movementFamily: 'straight_arm_push',
      isSubstitutable: true,
    },
    shoulder_stability: {
      id: 'shoulder_support',
      name: 'Shoulder Stabilization',
      sets: 2,
      reps: '10-12 reps',
      rest: '45s',
      notes: ['Control through full range'],
      movementFamily: 'scapular_control',
      isSubstitutable: true,
    },
  }
  
  return supportMap[limitingFactor] || null
}

function getDefaultRepRange(style: TrainingStyleMode): { min: number; max: number } {
  switch (style) {
    case 'strength_focused':
      return { min: 3, max: 6 }
    case 'hypertrophy_supported':
      return { min: 8, max: 12 }
    case 'endurance_focused':
      return { min: 12, max: 20 }
    case 'power_focused':
      return { min: 3, max: 5 }
    default:
      return { min: 5, max: 8 }
  }
}

function buildStrengthExercise(
  family: MovementFamily,
  sets: number,
  repRange: { min: number; max: number },
  equipment: EquipmentTag[],
  context: UnifiedEngineContext
): ProgramExercise | null {
  const familyExercises: Record<MovementFamily, { name: string; id: string }> = {
    vertical_pull: { name: 'Weighted Pull-Up', id: 'weighted_pull_up' },
    vertical_push: { name: 'Weighted Dip', id: 'weighted_dip' },
    horizontal_pull: { name: 'Row', id: 'row' },
    horizontal_push: { name: 'Push-Up Variation', id: 'push_up' },
    straight_arm_pull: { name: 'Front Lever Row', id: 'fl_row' },
    straight_arm_push: { name: 'Pseudo Planche Push-Up', id: 'pseudo_planche_pu' },
    dip_pattern: { name: 'Ring Dip', id: 'ring_dip' },
    compression_core: { name: 'L-Sit', id: 'l_sit' },
    explosive_pull: { name: 'Explosive Pull-Up', id: 'explosive_pull_up' },
    explosive_push: { name: 'Clap Push-Up', id: 'clap_push_up' },
    squat_pattern: { name: 'Pistol Squat', id: 'pistol_squat' },
    hinge_pattern: { name: 'Nordic Curl', id: 'nordic_curl' },
    unilateral_leg: { name: 'Bulgarian Split Squat', id: 'bss' },
    scapular_control: { name: 'Scapular Pull-Up', id: 'scap_pull_up' },
    anti_extension_core: { name: 'Ab Wheel', id: 'ab_wheel' },
    anti_rotation_core: { name: 'Pallof Press', id: 'pallof_press' },
    joint_integrity: { name: 'Joint Prep', id: 'joint_prep' },
    mobility: { name: 'Mobility Work', id: 'mobility' },
    skill_isometric: { name: 'Skill Hold', id: 'skill_hold' },
    hypertrophy_accessory: { name: 'Accessory', id: 'accessory' },
  }
  
  const exercise = familyExercises[family]
  if (!exercise) return null
  
  // Adjust rest based on style
  const rest = context.athlete.trainingStyle === 'strength_focused' ? '2-3 min' :
               context.athlete.trainingStyle === 'endurance_focused' ? '60-90s' : '90-120s'
  
  return {
    id: exercise.id,
    name: exercise.name,
    sets,
    reps: `${repRange.min}-${repRange.max} reps`,
    rest,
    notes: [],
    movementFamily: family,
    isSubstitutable: true,
  }
}

function mapMovementTypeToFamily(movementType: string): MovementFamily | null {
  const mapping: Record<string, MovementFamily> = {
    weighted_pull: 'vertical_pull',
    pull_up: 'vertical_pull',
    row: 'horizontal_pull',
    weighted_dip: 'dip_pattern',
    dip: 'dip_pattern',
    push_up: 'horizontal_push',
    front_lever_raise: 'straight_arm_pull',
    straight_arm_pull: 'straight_arm_pull',
    planche_lean: 'straight_arm_push',
    straight_arm_push: 'straight_arm_push',
    l_sit: 'compression_core',
    compression: 'compression_core',
    pike_compression: 'compression_core',
    scap_work: 'scapular_control',
    scapular: 'scapular_control',
  }
  return mapping[movementType] || null
}

function buildSessionRationale(
  context: UnifiedEngineContext,
  isPrimaryDay: boolean,
  focus: string
): string {
  const parts: string[] = []
  
  if (isPrimaryDay) {
    parts.push(`Primary ${context.athlete.primaryGoalLabel} development session.`)
  } else {
    parts.push('Support session focused on strength and recovery.')
  }
  
  if (context.constraints.primaryConstraint) {
    parts.push(`Emphasis on ${context.constraints.primaryConstraint.replace(/_/g, ' ')} based on current assessment.`)
  }
  
  if (context.fatigue.fatigueLevel !== 'fresh') {
    parts.push(`Volume adjusted for ${context.fatigue.fatigueLevel} recovery state.`)
  }
  
  return parts.join(' ')
}

function buildRecommendations(context: UnifiedEngineContext): string[] {
  const recommendations: string[] = []
  
  // Add constraint-based recommendation
  if (context.constraints.primaryConstraint) {
    recommendations.push(
      `Focus on ${context.constraints.primaryConstraint.replace(/_/g, ' ')} exercises to address your primary limitation.`
    )
  }
  
  // Add fatigue-based recommendation
  if (context.fatigue.fatigueLevel === 'fatigued') {
    recommendations.push('Consider extra rest days or reduced intensity this week.')
  }
  
  // Add envelope-based recommendation
  if (context.envelope.hasHighConfidenceData && context.envelope.recommendations.preferredRepRange) {
    const { min, max } = context.envelope.recommendations.preferredRepRange
    recommendations.push(`Your training data suggests ${min}-${max} rep ranges work well for strength development.`)
  }
  
  // Add style-based recommendation
  const styleRecs: Record<TrainingStyleMode, string> = {
    skill_focused: 'Maintain high-frequency skill exposure with adequate rest between attempts.',
    strength_focused: 'Progressive overload is key. Track weights and aim for small increases weekly.',
    power_focused: 'Quality over quantity. Each rep should be explosive and controlled.',
    endurance_focused: 'Build work capacity gradually. Monitor recovery between sessions.',
    hypertrophy_supported: 'Accessory work supports your skills. Keep it secondary to calisthenics.',
    balanced_hybrid: 'Balanced approach. Adjust based on how you respond to different stimuli.',
  }
  recommendations.push(styleRecs[context.athlete.trainingStyle])
  
  return recommendations
}
