/**
 * Weekly Stimulus Allocation Contract
 * [WEEKLY-STIMULUS-ALLOCATION] Authoritative owner for how weekly training budget is distributed
 * 
 * This contract determines BEFORE session completion:
 * 1. Primary skill weekly emphasis (% of total budget)
 * 2. Secondary/tertiary exposure budget
 * 3. Direct vs support work budget
 * 4. Push/pull/static/dynamic/trunk allocation
 * 5. Fatigue-sensitive placement across the week
 * 6. Support redundancy control
 * 7. Recovery-aware sequencing
 * 8. Method density placement
 */

import type { SkillType } from './training-principles-engine'
import type { TrainingStyleMode } from './unified-coaching-engine'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Canonical truth context for weekly allocation decisions
 */
export interface WeeklyStimulusContext {
  // Primary goal drives the spine of the week
  primaryGoal: string
  // Secondary goal receives maintenance exposure
  secondaryGoal: string | null
  // Tertiary goals receive minimal but intentional exposure
  tertiaryGoals: string[]
  // Selected skills for allocation
  selectedSkills: string[]
  // Experience level affects volume tolerance
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  // Training days determines budget capacity
  trainingDaysPerWeek: number
  // Training style affects balance
  trainingStyle: TrainingStyleMode
  // Current working progressions affect emphasis
  currentProgressions: Record<string, { currentProgression: string | null; historicalCeiling: string | null }> | null
  // Joint cautions affect recovery sequencing
  jointCautions: string[]
  // Fatigue state affects intensity distribution
  fatigueState: 'fresh' | 'moderate' | 'accumulated' | 'needs_deload'
}

/**
 * Budget allocation percentages for the week
 */
export interface WeeklyBudgetAllocation {
  // Skill-based allocation
  primarySkillPercent: number      // % of week dedicated to primary skill
  secondarySkillPercent: number    // % for secondary skill
  tertiarySkillPercent: number     // % for tertiary skills combined
  
  // Work type allocation
  directWorkPercent: number        // High-demand skill/strength work
  carryoverWorkPercent: number     // Strength carryover for skills
  supportWorkPercent: number       // Accessories and support
  conditioningPercent: number      // Density/conditioning work
  recoveryWorkPercent: number      // Joint health, prehab
  
  // Movement pattern allocation
  pushPercent: number
  pullPercent: number
  staticHoldPercent: number
  dynamicMovementPercent: number
  trunkCompressionPercent: number
}

/**
 * Session-level stimulus allocation
 */
export interface SessionStimulusAllocation {
  dayIndex: number
  sessionRole: 'primary_exposure' | 'strength_carryover' | 'support_accumulation' | 'recovery_technique' | 'density_conditioning'
  
  // What this session should emphasize
  primaryEmphasis: string
  secondaryEmphasis: string | null
  
  // Budget for this session
  directWorkSlots: number
  carryoverSlots: number
  supportSlots: number
  conditioningSlots: number
  
  // Fatigue characteristics
  fatigueLoad: 'high' | 'moderate' | 'low'
  neuralDemand: 'high' | 'moderate' | 'low'
  
  // Method eligibility for this session
  methodIntensity: 'aggressive' | 'moderate' | 'conservative'
  supersetsAllowed: boolean
  circuitsAllowed: boolean
  densityAllowed: boolean
  
  // Movement pattern emphasis
  pushEmphasis: boolean
  pullEmphasis: boolean
  staticEmphasis: boolean
  
  // Allocation rationale
  allocationReason: string
}

/**
 * Complete weekly stimulus contract
 */
export interface WeeklyStimulusContract {
  // Overall week structure
  weeklyBudget: WeeklyBudgetAllocation
  
  // Per-session allocations
  sessionAllocations: SessionStimulusAllocation[]
  
  // Weekly coordination rules
  coordination: {
    maxConsecutiveHighFatigue: number
    pushPullBalance: 'push_biased' | 'pull_biased' | 'balanced'
    staticHoldSpacing: number // Minimum days between heavy static work
    trunkFrequency: number    // How many days include trunk work
    jointCareFrequency: number
  }
  
  // Audit trail
  audit: {
    primaryGoalDominance: boolean
    secondaryContained: boolean
    fatigueDistributed: boolean
    supportCoordinated: boolean
    methodsAppropriate: boolean
  }
  
  // Human-readable summary
  weekSummary: string
}

// =============================================================================
// BUDGET CALCULATION
// =============================================================================

/**
 * Calculate weekly budget allocation from canonical truth
 */
function calculateWeeklyBudget(ctx: WeeklyStimulusContext): WeeklyBudgetAllocation {
  // Base allocations vary by training style
  let baseAllocations = {
    primarySkillPercent: 40,
    secondarySkillPercent: 20,
    tertiarySkillPercent: 10,
    directWorkPercent: 35,
    carryoverWorkPercent: 25,
    supportWorkPercent: 25,
    conditioningPercent: 10,
    recoveryWorkPercent: 5,
    pushPercent: 40,
    pullPercent: 40,
    staticHoldPercent: 30,
    dynamicMovementPercent: 50,
    trunkCompressionPercent: 20,
  }
  
  // Adjust based on training style
  if (ctx.trainingStyle === 'skill') {
    baseAllocations.primarySkillPercent = 50
    baseAllocations.directWorkPercent = 40
    baseAllocations.staticHoldPercent = 40
    baseAllocations.carryoverWorkPercent = 20
  } else if (ctx.trainingStyle === 'strength') {
    baseAllocations.primarySkillPercent = 35
    baseAllocations.directWorkPercent = 30
    baseAllocations.carryoverWorkPercent = 30
    baseAllocations.dynamicMovementPercent = 40
  }
  
  // Adjust based on experience level
  if (ctx.experienceLevel === 'beginner') {
    baseAllocations.directWorkPercent -= 5
    baseAllocations.supportWorkPercent += 5
    baseAllocations.recoveryWorkPercent += 5
  } else if (ctx.experienceLevel === 'advanced' || ctx.experienceLevel === 'elite') {
    baseAllocations.directWorkPercent += 5
    baseAllocations.carryoverWorkPercent += 5
    baseAllocations.supportWorkPercent -= 5
  }
  
  // Adjust based on fatigue state
  if (ctx.fatigueState === 'accumulated' || ctx.fatigueState === 'needs_deload') {
    baseAllocations.directWorkPercent -= 10
    baseAllocations.recoveryWorkPercent += 10
    baseAllocations.conditioningPercent -= 5
  }
  
  // Adjust based on joint cautions
  if (ctx.jointCautions.length > 0) {
    baseAllocations.recoveryWorkPercent += ctx.jointCautions.length * 3
    baseAllocations.directWorkPercent -= ctx.jointCautions.length * 2
  }
  
  // Adjust based on primary goal characteristics
  const isPushGoal = ['planche', 'handstand_pushup'].includes(ctx.primaryGoal)
  const isPullGoal = ['front_lever', 'muscle_up', 'back_lever'].includes(ctx.primaryGoal)
  const isStaticGoal = ['planche', 'front_lever', 'back_lever', 'human_flag'].includes(ctx.primaryGoal)
  
  if (isPushGoal) {
    baseAllocations.pushPercent = 55
    baseAllocations.pullPercent = 35
  } else if (isPullGoal) {
    baseAllocations.pullPercent = 55
    baseAllocations.pushPercent = 35
  }
  
  if (isStaticGoal) {
    baseAllocations.staticHoldPercent = 45
    baseAllocations.dynamicMovementPercent = 35
  }
  
  // Ensure no secondary/tertiary if not selected
  if (!ctx.secondaryGoal) {
    baseAllocations.primarySkillPercent += baseAllocations.secondarySkillPercent
    baseAllocations.secondarySkillPercent = 0
  }
  
  if (ctx.tertiaryGoals.length === 0) {
    baseAllocations.primarySkillPercent += Math.floor(baseAllocations.tertiarySkillPercent / 2)
    baseAllocations.supportWorkPercent += Math.ceil(baseAllocations.tertiarySkillPercent / 2)
    baseAllocations.tertiarySkillPercent = 0
  }
  
  return baseAllocations
}

// =============================================================================
// SESSION ROLE DETERMINATION
// =============================================================================

/**
 * Determine the role of each session based on weekly budget
 */
function determineSessionRoles(
  ctx: WeeklyStimulusContext,
  budget: WeeklyBudgetAllocation
): Array<SessionStimulusAllocation['sessionRole']> {
  const days = ctx.trainingDaysPerWeek
  const roles: Array<SessionStimulusAllocation['sessionRole']> = []
  
  // Minimum primary exposure days based on frequency
  const primaryExposureDays = Math.max(1, Math.floor(days * (budget.primarySkillPercent / 100) * 0.7))
  
  // Minimum carryover days
  const carryoverDays = days >= 4 ? Math.max(1, Math.floor(days * (budget.carryoverWorkPercent / 100) * 0.6)) : 0
  
  // Support/accumulation days
  const supportDays = days >= 3 ? Math.max(1, Math.floor(days * (budget.supportWorkPercent / 100) * 0.5)) : 0
  
  // Recovery days (only at higher frequencies)
  const recoveryDays = days >= 5 ? Math.max(1, Math.floor(days * (budget.recoveryWorkPercent / 100) * 0.8)) : 0
  
  // Conditioning days
  const conditioningDays = Math.max(0, days - primaryExposureDays - carryoverDays - supportDays - recoveryDays)
  
  // Build role sequence with optimal fatigue distribution
  // Pattern: Primary -> Carryover -> Support -> Primary -> Conditioning -> Recovery
  
  for (let i = 0; i < days; i++) {
    if (i === 0) {
      // First day is always primary exposure
      roles.push('primary_exposure')
    } else if (i === 1 && carryoverDays > 0) {
      // Second day is carryover if available
      roles.push('strength_carryover')
    } else if (i === 2 && supportDays > 0) {
      // Third day is support accumulation
      roles.push('support_accumulation')
    } else if (i === days - 1 && recoveryDays > 0) {
      // Last day is recovery if available
      roles.push('recovery_technique')
    } else if (roles.filter(r => r === 'primary_exposure').length < primaryExposureDays) {
      // Add more primary exposure
      roles.push('primary_exposure')
    } else if (roles.filter(r => r === 'strength_carryover').length < carryoverDays) {
      // Add more carryover
      roles.push('strength_carryover')
    } else if (roles.filter(r => r === 'density_conditioning').length < conditioningDays) {
      // Add conditioning
      roles.push('density_conditioning')
    } else {
      // Default to support
      roles.push('support_accumulation')
    }
  }
  
  return roles
}

// =============================================================================
// SESSION ALLOCATION BUILDING
// =============================================================================

/**
 * Build detailed allocation for each session
 */
function buildSessionAllocations(
  ctx: WeeklyStimulusContext,
  budget: WeeklyBudgetAllocation,
  roles: Array<SessionStimulusAllocation['sessionRole']>
): SessionStimulusAllocation[] {
  const allocations: SessionStimulusAllocation[] = []
  
  // Track patterns for coordination
  let lastHighFatigue = -3
  let lastStaticEmphasis = -3
  let pushDays = 0
  let pullDays = 0
  
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i]
    const daysSinceHighFatigue = i - lastHighFatigue
    const daysSinceStatic = i - lastStaticEmphasis
    
    // Determine emphasis based on role and primary goal
    let primaryEmphasis = ctx.primaryGoal
    let secondaryEmphasis: string | null = ctx.secondaryGoal
    
    // Determine slots based on role
    let directSlots = 2
    let carryoverSlots = 2
    let supportSlots = 2
    let conditioningSlots = 0
    
    // Determine fatigue characteristics
    let fatigueLoad: 'high' | 'moderate' | 'low' = 'moderate'
    let neuralDemand: 'high' | 'moderate' | 'low' = 'moderate'
    
    // Determine method eligibility
    let methodIntensity: 'aggressive' | 'moderate' | 'conservative' = 'moderate'
    let supersetsAllowed = true
    let circuitsAllowed = false
    let densityAllowed = false
    
    // Movement pattern emphasis
    const isPushGoal = ['planche', 'handstand_pushup'].includes(ctx.primaryGoal)
    const isPullGoal = ['front_lever', 'muscle_up', 'back_lever'].includes(ctx.primaryGoal)
    const isStaticGoal = ['planche', 'front_lever', 'back_lever', 'human_flag'].includes(ctx.primaryGoal)
    
    // Alternate push/pull emphasis for balance
    const shouldEmphasizePush = isPushGoal ? (pushDays <= pullDays) : (pushDays < pullDays)
    const shouldEmphasizePull = isPullGoal ? (pullDays <= pushDays) : (pullDays < pushDays)
    
    let pushEmphasis = shouldEmphasizePush
    let pullEmphasis = shouldEmphasizePull
    let staticEmphasis = isStaticGoal && daysSinceStatic >= 2
    
    // Adjust based on role
    switch (role) {
      case 'primary_exposure':
        directSlots = 3
        carryoverSlots = 2
        supportSlots = 1
        fatigueLoad = daysSinceHighFatigue >= 2 ? 'high' : 'moderate'
        neuralDemand = 'high'
        methodIntensity = 'conservative' // Quality over volume
        supersetsAllowed = false // No supersets for primary skill work
        if (fatigueLoad === 'high') lastHighFatigue = i
        if (staticEmphasis) lastStaticEmphasis = i
        break
        
      case 'strength_carryover':
        directSlots = 1
        carryoverSlots = 3
        supportSlots = 2
        fatigueLoad = 'moderate'
        neuralDemand = 'moderate'
        methodIntensity = 'moderate'
        supersetsAllowed = true
        staticEmphasis = false // Carryover is dynamic strength
        break
        
      case 'support_accumulation':
        directSlots = 1
        carryoverSlots = 1
        supportSlots = 3
        conditioningSlots = 1
        fatigueLoad = 'low'
        neuralDemand = 'low'
        methodIntensity = 'aggressive'
        supersetsAllowed = true
        circuitsAllowed = true
        primaryEmphasis = secondaryEmphasis || primaryEmphasis
        secondaryEmphasis = ctx.tertiaryGoals[0] || null
        staticEmphasis = false
        break
        
      case 'recovery_technique':
        directSlots = 1
        carryoverSlots = 1
        supportSlots = 2
        conditioningSlots = 0
        fatigueLoad = 'low'
        neuralDemand = 'low'
        methodIntensity = 'conservative'
        supersetsAllowed = false
        staticEmphasis = false
        break
        
      case 'density_conditioning':
        directSlots = 1
        carryoverSlots = 1
        supportSlots = 2
        conditioningSlots = 2
        fatigueLoad = 'moderate'
        neuralDemand = 'low'
        methodIntensity = 'aggressive'
        supersetsAllowed = true
        circuitsAllowed = true
        densityAllowed = true
        primaryEmphasis = ctx.secondaryGoal || ctx.primaryGoal
        staticEmphasis = false
        break
    }
    
    // Track push/pull balance
    if (pushEmphasis) pushDays++
    if (pullEmphasis) pullDays++
    
    // Build allocation reason
    const allocationReason = buildAllocationReason(
      role,
      primaryEmphasis,
      i + 1,
      ctx.trainingDaysPerWeek,
      fatigueLoad,
      daysSinceHighFatigue
    )
    
    allocations.push({
      dayIndex: i,
      sessionRole: role,
      primaryEmphasis,
      secondaryEmphasis,
      directWorkSlots: directSlots,
      carryoverSlots,
      supportSlots,
      conditioningSlots,
      fatigueLoad,
      neuralDemand,
      methodIntensity,
      supersetsAllowed,
      circuitsAllowed,
      densityAllowed,
      pushEmphasis,
      pullEmphasis,
      staticEmphasis,
      allocationReason,
    })
  }
  
  return allocations
}

/**
 * Build human-readable allocation reason
 */
function buildAllocationReason(
  role: SessionStimulusAllocation['sessionRole'],
  emphasis: string,
  dayNum: number,
  totalDays: number,
  fatigue: 'high' | 'moderate' | 'low',
  daysSinceHighFatigue: number
): string {
  const roleLabels: Record<SessionStimulusAllocation['sessionRole'], string> = {
    'primary_exposure': 'Primary skill development',
    'strength_carryover': 'Strength carryover for skill support',
    'support_accumulation': 'Support and accessory work',
    'recovery_technique': 'Recovery-focused technique refinement',
    'density_conditioning': 'Conditioning and work capacity',
  }
  
  const emphasisLabel = formatGoalLabel(emphasis)
  const fatigueNote = fatigue === 'high' 
    ? ` (high demand day after ${daysSinceHighFatigue} days recovery)`
    : fatigue === 'low'
    ? ' (lower intensity for recovery)'
    : ''
  
  return `Day ${dayNum}/${totalDays}: ${roleLabels[role]} - ${emphasisLabel} emphasis${fatigueNote}`
}

/**
 * Format goal ID to readable label
 */
function formatGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    'planche': 'Planche',
    'front_lever': 'Front Lever',
    'handstand_pushup': 'HSPU',
    'muscle_up': 'Muscle-Up',
    'back_lever': 'Back Lever',
    'human_flag': 'Human Flag',
    'weighted_strength': 'Weighted Strength',
    'flexibility': 'Flexibility',
  }
  return labels[goal] || goal.replace(/_/g, ' ')
}

// =============================================================================
// COORDINATION RULES
// =============================================================================

/**
 * Build coordination rules for the week
 */
function buildCoordinationRules(
  ctx: WeeklyStimulusContext,
  allocations: SessionStimulusAllocation[]
): WeeklyStimulusContract['coordination'] {
  const isPushGoal = ['planche', 'handstand_pushup'].includes(ctx.primaryGoal)
  const isPullGoal = ['front_lever', 'muscle_up', 'back_lever'].includes(ctx.primaryGoal)
  
  // Count trunk days
  const trunkFrequency = Math.min(ctx.trainingDaysPerWeek, Math.max(2, Math.floor(ctx.trainingDaysPerWeek * 0.6)))
  
  // Joint care frequency based on cautions
  const jointCareFrequency = ctx.jointCautions.length > 0
    ? Math.max(2, Math.floor(ctx.trainingDaysPerWeek * 0.5))
    : Math.max(1, Math.floor(ctx.trainingDaysPerWeek * 0.3))
  
  return {
    maxConsecutiveHighFatigue: ctx.experienceLevel === 'beginner' ? 1 : 2,
    pushPullBalance: isPushGoal ? 'push_biased' : isPullGoal ? 'pull_biased' : 'balanced',
    staticHoldSpacing: ctx.experienceLevel === 'beginner' ? 2 : 1,
    trunkFrequency,
    jointCareFrequency,
  }
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * [WEEKLY-STIMULUS-ALLOCATION] Build the authoritative weekly stimulus contract
 * This is the single owner for weekly budget decisions
 */
export function buildWeeklyStimulusContract(ctx: WeeklyStimulusContext): WeeklyStimulusContract {
  // Calculate overall budget from canonical truth
  const weeklyBudget = calculateWeeklyBudget(ctx)
  
  // Determine session roles
  const sessionRoles = determineSessionRoles(ctx, weeklyBudget)
  
  // Build detailed allocations for each session
  const sessionAllocations = buildSessionAllocations(ctx, weeklyBudget, sessionRoles)
  
  // Build coordination rules
  const coordination = buildCoordinationRules(ctx, sessionAllocations)
  
  // Audit the contract
  const highFatigueDays = sessionAllocations.filter(a => a.fatigueLoad === 'high').length
  const primaryExposureDays = sessionAllocations.filter(a => a.sessionRole === 'primary_exposure').length
  const supportDays = sessionAllocations.filter(a => a.sessionRole === 'support_accumulation').length
  
  const audit = {
    primaryGoalDominance: primaryExposureDays >= Math.ceil(ctx.trainingDaysPerWeek * 0.3),
    secondaryContained: !ctx.secondaryGoal || sessionAllocations.filter(a => a.secondaryEmphasis === ctx.secondaryGoal).length <= Math.ceil(ctx.trainingDaysPerWeek * 0.4),
    fatigueDistributed: highFatigueDays <= Math.ceil(ctx.trainingDaysPerWeek * 0.4),
    supportCoordinated: supportDays >= 1 && supportDays <= Math.ceil(ctx.trainingDaysPerWeek * 0.4),
    methodsAppropriate: sessionAllocations.every(a => 
      a.sessionRole !== 'primary_exposure' || !a.circuitsAllowed
    ),
  }
  
  // Build week summary
  const weekSummary = buildWeekSummary(ctx, sessionAllocations, audit)
  
  // Log the contract
  console.log('[WEEKLY-STIMULUS-ALLOCATION-CONTRACT]', {
    primaryGoal: ctx.primaryGoal,
    secondaryGoal: ctx.secondaryGoal,
    trainingDays: ctx.trainingDaysPerWeek,
    budget: {
      primarySkillPercent: weeklyBudget.primarySkillPercent,
      directWorkPercent: weeklyBudget.directWorkPercent,
      supportWorkPercent: weeklyBudget.supportWorkPercent,
    },
    sessionRoles: sessionAllocations.map(a => a.sessionRole),
    fatiguePattern: sessionAllocations.map(a => a.fatigueLoad),
    audit,
    verdict: Object.values(audit).every(v => v)
      ? 'WEEKLY_ALLOCATION_FROM_CANONICAL_TRUTH'
      : 'WEEKLY_ALLOCATION_NEEDS_REVIEW',
  })
  
  return {
    weeklyBudget,
    sessionAllocations,
    coordination,
    audit,
    weekSummary,
  }
}

/**
 * Build human-readable week summary
 */
function buildWeekSummary(
  ctx: WeeklyStimulusContext,
  allocations: SessionStimulusAllocation[],
  audit: WeeklyStimulusContract['audit']
): string {
  const primaryLabel = formatGoalLabel(ctx.primaryGoal)
  const primaryDays = allocations.filter(a => a.sessionRole === 'primary_exposure').length
  const carryoverDays = allocations.filter(a => a.sessionRole === 'strength_carryover').length
  const supportDays = allocations.filter(a => a.sessionRole === 'support_accumulation').length
  
  let summary = `${ctx.trainingDaysPerWeek}-day week focused on ${primaryLabel}`
  
  if (primaryDays > 0) {
    summary += ` with ${primaryDays} primary exposure day${primaryDays > 1 ? 's' : ''}`
  }
  
  if (carryoverDays > 0) {
    summary += `, ${carryoverDays} strength carryover day${carryoverDays > 1 ? 's' : ''}`
  }
  
  if (ctx.secondaryGoal) {
    const secondaryLabel = formatGoalLabel(ctx.secondaryGoal)
    summary += `. ${secondaryLabel} maintained as secondary priority`
  }
  
  if (ctx.fatigueState === 'accumulated' || ctx.fatigueState === 'needs_deload') {
    summary += '. Volume adjusted for fatigue management'
  }
  
  return summary
}

/**
 * Convert session allocation to session distribution format for compatibility
 */
export function allocationToDistribution(
  allocation: SessionStimulusAllocation
): { type: string; isPrimary: boolean; variant: 'A' | 'B' | 'C'; supportVariant: 'primary' | 'secondary' | 'tertiary' } {
  // Map session role to existing session types
  const typeMap: Record<SessionStimulusAllocation['sessionRole'], string> = {
    'primary_exposure': 'skill_exposure',
    'strength_carryover': 'strength_emphasis',
    'support_accumulation': 'support_volume',
    'recovery_technique': 'technique_day',
    'density_conditioning': 'density_day',
  }
  
  // Determine variant based on day index
  const variants: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C']
  const variant = variants[allocation.dayIndex % 3]
  
  // Determine support variant based on role priority
  const supportVariantMap: Record<SessionStimulusAllocation['sessionRole'], 'primary' | 'secondary' | 'tertiary'> = {
    'primary_exposure': 'primary',
    'strength_carryover': 'secondary',
    'support_accumulation': 'tertiary',
    'recovery_technique': 'tertiary',
    'density_conditioning': 'secondary',
  }
  
  return {
    type: typeMap[allocation.sessionRole],
    isPrimary: allocation.sessionRole === 'primary_exposure' || allocation.sessionRole === 'strength_carryover',
    variant,
    supportVariant: supportVariantMap[allocation.sessionRole],
  }
}
