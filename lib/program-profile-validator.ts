/**
 * PROGRAM-PROFILE VALIDATOR
 * 
 * =============================================================================
 * PURPOSE: Deterministic validation that generated programs match saved profile truth
 * =============================================================================
 * 
 * This validator answers:
 * - Did the program honor the saved primary goal?
 * - Did it honor the saved secondary goal?
 * - Did selected skills materially affect the week?
 * - Did adaptive/fixed schedule truth survive?
 * - Did adaptive/fixed duration truth survive?
 * - Did strength metrics affect weighted prescriptions when applicable?
 * - Is the generated week structurally aligned with the saved profile?
 * 
 * LOG PREFIX: [program-profile-validate]
 * 
 * RULES:
 * - DO NOT mutate the program here - only detect and report mismatches
 * - Keep structured and reusable
 * - Provide actionable diagnostic output
 */

import type { CanonicalProgrammingProfile } from './canonical-profile-service'
// Note: AdaptiveProgram is imported via type to avoid circular dependency
// The actual validation function receives the program as a parameter
import type { AdaptiveProgram, AdaptiveSession, AdaptiveExercise } from './adaptive-program-builder'

// Re-export ValidationSeverity for external use
export type { ValidationSeverity }

// =============================================================================
// TYPES
// =============================================================================

export type ValidationSeverity = 'pass' | 'warning' | 'mismatch' | 'critical'

export interface ValidationCheck {
  category: string
  subcategory: string
  severity: ValidationSeverity
  profileValue: string | number | boolean | null | undefined
  programValue: string | number | boolean | null | undefined
  message: string
  details?: string
}

export interface SkillExpressionCheck {
  skill: string
  skillLabel: string
  wasExpressed: boolean
  expressionType: 'direct' | 'technical' | 'support' | 'warmup' | 'rotated' | 'none'
  exercisesFound: string[]
  omissionJustifiable: boolean
  omissionReason?: string
}

export interface ScheduleDurationCheck {
  scheduleMode: {
    saved: 'static' | 'flexible'
    resolved: 'static' | 'flexible'
    matches: boolean
    issue?: string
  }
  trainingDays: {
    saved: number | null
    resolved: number
    matches: boolean
    withinFlexibleRange: boolean
    issue?: string
  }
  sessionDuration: {
    mode: 'static' | 'adaptive'
    savedTarget: number
    averageGenerated: number
    variance: number
    matches: boolean
    issue?: string
  }
}

export interface WeightedPrescriptionCheck {
  hasWeightedData: boolean
  weightedPullUpData: boolean
  weightedDipData: boolean
  weightedExercisesAppeared: boolean
  prescribedLoadsAttached: boolean
  pullUpPrescribed: { appeared: boolean; loadAttached: boolean; load?: string }
  dipPrescribed: { appeared: boolean; loadAttached: boolean; load?: string }
  omissionExplainable: boolean
  omissionReasons: string[]
}

export interface SummaryRationaleCheck {
  claimsSkillInfluence: string[]
  actualSkillExpression: string[]
  claimsGoalFocus: string | null
  actualGoalAlignment: boolean
  claimsMismatch: boolean
  mismatchDetails: string[]
}

export interface ProgramProfileValidationResult {
  isValid: boolean
  overallScore: number  // 0-100
  timestamp: string
  
  // Summary counts
  passCount: number
  warningCount: number
  mismatchCount: number
  criticalCount: number
  
  // Detailed checks
  checks: ValidationCheck[]
  skillExpression: SkillExpressionCheck[]
  scheduleDuration: ScheduleDurationCheck
  weightedPrescription: WeightedPrescriptionCheck
  summaryRationale: SummaryRationaleCheck
  
  // Quick lookups
  passed: string[]
  warnings: string[]
  failures: string[]
  
  // Debug summaries
  profileSummary: ProfileSummary
  programSummary: ProgramSummary
}

interface ProfileSummary {
  primaryGoal: string | null
  secondaryGoal: string | null
  selectedSkills: string[]
  scheduleMode: 'static' | 'flexible'
  trainingDaysPerWeek: number | null
  sessionDurationMode: 'static' | 'adaptive'
  sessionLengthMinutes: number
  hasWeightedPullUp: boolean
  hasWeightedDip: boolean
  hasAllTimePRs: boolean
  experienceLevel: string
}

interface ProgramSummary {
  primaryGoal: string
  secondaryGoal: string | null
  goalLabel: string
  sessionCount: number
  scheduleMode: 'static' | 'flexible' | undefined
  currentWeekFrequency: number | undefined
  averageSessionMinutes: number
  hasWeightedPrescriptions: boolean
  exerciseCategories: string[]
  skillsExpressed: string[]
}

// =============================================================================
// SKILL MAPPING HELPERS
// =============================================================================

/**
 * Map skill identifiers to exercise patterns that express them
 */
const SKILL_EXERCISE_PATTERNS: Record<string, { direct: string[]; support: string[]; technical: string[] }> = {
  front_lever: {
    direct: ['front lever', 'front-lever', 'fl '],
    support: ['pull', 'row', 'lat', 'scap', 'hollow', 'core'],
    technical: ['front lever tuck', 'advanced tuck', 'straddle', 'one leg', 'full fl'],
  },
  back_lever: {
    direct: ['back lever', 'back-lever', 'bl '],
    support: ['row', 'dip', 'german hang', 'shoulder'],
    technical: ['back lever tuck', 'advanced tuck', 'straddle', 'full bl'],
  },
  planche: {
    direct: ['planche', 'lean'],
    support: ['push', 'press', 'dip', 'hollow', 'shoulder'],
    technical: ['planche lean', 'tuck planche', 'adv tuck', 'straddle planche'],
  },
  muscle_up: {
    direct: ['muscle up', 'muscle-up'],
    support: ['pull', 'dip', 'high pull', 'kip', 'swing'],
    technical: ['transition', 'negative muscle up', 'jumping muscle up'],
  },
  handstand: {
    direct: ['handstand', 'hs '],
    support: ['pike', 'shoulder', 'wrist', 'core', 'hollow'],
    technical: ['wall hs', 'freestanding', 'hs hold', 'hs walk'],
  },
  handstand_pushup: {
    direct: ['hspu', 'handstand push', 'handstand press'],
    support: ['pike push', 'shoulder press', 'wall hs', 'negative hspu'],
    technical: ['wall hspu', 'deficit hspu', 'freestanding hspu', 'pike pushup'],
  },
  l_sit: {
    direct: ['l-sit', 'l sit'],
    support: ['tuck sit', 'compression', 'hip flexor', 'core'],
    technical: ['floor l-sit', 'parallel l-sit', 'l-sit hold'],
  },
  v_sit: {
    direct: ['v-sit', 'v sit', 'manna'],
    support: ['l-sit', 'compression', 'pike', 'core'],
    technical: ['v-sit progression', 'manna prep'],
  },
  one_arm_pull_up: {
    direct: ['one arm pull', 'oapu', 'archer pull'],
    support: ['weighted pull', 'typewriter', 'assisted one arm'],
    technical: ['negative one arm', 'archer', 'assisted oapu'],
  },
  one_arm_chin_up: {
    direct: ['one arm chin', 'oacu', 'archer chin'],
    support: ['weighted chin', 'typewriter chin'],
    technical: ['negative one arm chin', 'archer chin'],
  },
  dragon_flag: {
    direct: ['dragon flag'],
    support: ['hollow', 'hanging leg raise', 'core'],
    technical: ['tuck dragon flag', 'straddle dragon flag'],
  },
  human_flag: {
    direct: ['human flag'],
    support: ['side plank', 'lat', 'oblique'],
    technical: ['clutch flag', 'press flag'],
  },
  iron_cross: {
    direct: ['iron cross', 'cross pull'],
    support: ['ring', 'maltese', 'rto'],
    technical: ['iron cross prep', 'wide ring'],
  },
  // Flexibility skills
  pancake: {
    direct: ['pancake'],
    support: ['pike', 'straddle', 'hip'],
    technical: ['seated pancake', 'pancake stretch'],
  },
  front_splits: {
    direct: ['front split', 'split'],
    support: ['hip flexor', 'hamstring', 'lunge'],
    technical: ['half split', 'front split progression'],
  },
  side_splits: {
    direct: ['side split', 'middle split', 'straddle'],
    support: ['adductor', 'hip', 'frog'],
    technical: ['side split progression', 'pancake'],
  },
}

/**
 * Get a human-readable label for a skill
 */
const SKILL_LABELS: Record<string, string> = {
  front_lever: 'Front Lever',
  back_lever: 'Back Lever',
  planche: 'Planche',
  muscle_up: 'Muscle Up',
  handstand: 'Handstand',
  handstand_pushup: 'HSPU',
  l_sit: 'L-Sit',
  v_sit: 'V-Sit',
  one_arm_pull_up: 'One-Arm Pull-Up',
  one_arm_chin_up: 'One-Arm Chin-Up',
  dragon_flag: 'Dragon Flag',
  human_flag: 'Human Flag',
  iron_cross: 'Iron Cross',
  pancake: 'Pancake',
  front_splits: 'Front Splits',
  side_splits: 'Side Splits',
}

// =============================================================================
// CORE VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if an exercise name matches skill patterns
 */
function matchesSkillPattern(exerciseName: string, patterns: string[]): boolean {
  const normalized = exerciseName.toLowerCase()
  return patterns.some(pattern => normalized.includes(pattern.toLowerCase()))
}

/**
 * Determine how a skill is expressed in a session
 */
function checkSkillExpressionInSession(
  skill: string, 
  exercises: AdaptiveExercise[]
): { type: 'direct' | 'technical' | 'support' | 'warmup' | 'none'; exercises: string[] } {
  const patterns = SKILL_EXERCISE_PATTERNS[skill]
  if (!patterns) {
    return { type: 'none', exercises: [] }
  }
  
  const foundExercises: string[] = []
  let expressionType: 'direct' | 'technical' | 'support' | 'warmup' | 'none' = 'none'
  
  for (const ex of exercises) {
    const name = ex.name
    
    // Check for direct expression (highest priority)
    if (matchesSkillPattern(name, patterns.direct)) {
      expressionType = 'direct'
      foundExercises.push(name)
    }
    // Check for technical progression
    else if (matchesSkillPattern(name, patterns.technical)) {
      if (expressionType !== 'direct') expressionType = 'technical'
      foundExercises.push(name)
    }
    // Check for support work
    else if (matchesSkillPattern(name, patterns.support)) {
      if (expressionType !== 'direct' && expressionType !== 'technical') {
        expressionType = 'support'
      }
      foundExercises.push(name)
    }
  }
  
  return { type: expressionType, exercises: foundExercises }
}

/**
 * Check skill expression across the entire program
 */
function validateSkillExpression(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram
): SkillExpressionCheck[] {
  const results: SkillExpressionCheck[] = []
  const selectedSkills = profile.selectedSkills || []
  
  for (const skill of selectedSkills) {
    let wasExpressed = false
    let expressionType: 'direct' | 'technical' | 'support' | 'warmup' | 'rotated' | 'none' = 'none'
    const allFoundExercises: string[] = []
    let directSessionCount = 0
    
    // Check all sessions
    for (const session of program.sessions || []) {
      const allExercises = [
        ...(session.exercises || []),
        ...(session.warmup || []),
      ]
      
      const result = checkSkillExpressionInSession(skill, allExercises)
      if (result.type !== 'none') {
        wasExpressed = true
        if (result.type === 'direct' || result.type === 'technical') {
          directSessionCount++
        }
        allFoundExercises.push(...result.exercises)
        
        // Track highest expression type
        if (result.type === 'direct') expressionType = 'direct'
        else if (result.type === 'technical' && expressionType !== 'direct') expressionType = 'technical'
        else if (result.type === 'support' && expressionType === 'none') expressionType = 'support'
      }
    }
    
    // Determine if omission is justifiable
    let omissionJustifiable = false
    let omissionReason: string | undefined
    
    if (!wasExpressed) {
      // Check if skill might be rotated (not every skill every week)
      if (selectedSkills.length > 3) {
        omissionJustifiable = true
        omissionReason = 'Skill rotation: too many selected skills for single week focus'
      }
      // Check if recovery constraints
      else if (program.recoveryLevel === 'LOW' || program.deloadRecommendation?.shouldDeload) {
        omissionJustifiable = true
        omissionReason = 'Recovery priority: deload or low recovery state'
      }
      // Check session count
      else if ((program.sessions?.length || 0) <= 2) {
        omissionJustifiable = true
        omissionReason = 'Limited sessions: not enough days for all skills'
      }
    }
    
    results.push({
      skill,
      skillLabel: SKILL_LABELS[skill] || skill,
      wasExpressed,
      expressionType,
      exercisesFound: [...new Set(allFoundExercises)].slice(0, 5), // Dedupe and limit
      omissionJustifiable,
      omissionReason,
    })
  }
  
  return results
}

/**
 * Validate schedule and duration alignment
 */
function validateScheduleDuration(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram
): ScheduleDurationCheck {
  const savedScheduleMode = profile.scheduleMode || 'static'
  const resolvedScheduleMode = program.scheduleMode || 'static'
  
  const savedDays = profile.trainingDaysPerWeek
  const resolvedDays = program.currentWeekFrequency || program.trainingDaysPerWeek || program.sessions?.length || 0
  
  const savedDurationMode = profile.sessionDurationMode || 'static'
  const savedTarget = profile.sessionLengthMinutes || 45
  
  // Calculate average session duration
  const sessionDurations = (program.sessions || []).map(s => s.estimatedMinutes || 45)
  const avgDuration = sessionDurations.length > 0 
    ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length 
    : 45
  const variance = sessionDurations.length > 0
    ? Math.sqrt(sessionDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / sessionDurations.length)
    : 0
  
  // Check schedule mode match
  const scheduleModeMatches = savedScheduleMode === resolvedScheduleMode
  let scheduleIssue: string | undefined
  if (!scheduleModeMatches) {
    scheduleIssue = `Schedule mode drift: saved ${savedScheduleMode}, got ${resolvedScheduleMode}`
  }
  
  // Check training days
  const daysMatch = savedScheduleMode === 'flexible' || savedDays === null || savedDays === resolvedDays
  const withinFlexibleRange = savedScheduleMode === 'flexible' || 
    (resolvedDays >= (savedDays || 3) - 1 && resolvedDays <= (savedDays || 3) + 1)
  let daysIssue: string | undefined
  if (!daysMatch && !withinFlexibleRange) {
    daysIssue = `Training days mismatch: saved ${savedDays}, got ${resolvedDays}`
  }
  
  // Check session duration
  const durationTolerance = savedDurationMode === 'adaptive' ? 15 : 10
  const durationMatches = Math.abs(avgDuration - savedTarget) <= durationTolerance
  let durationIssue: string | undefined
  if (!durationMatches) {
    durationIssue = `Duration drift: target ${savedTarget}min, avg ${Math.round(avgDuration)}min`
  }
  
  return {
    scheduleMode: {
      saved: savedScheduleMode,
      resolved: resolvedScheduleMode,
      matches: scheduleModeMatches,
      issue: scheduleIssue,
    },
    trainingDays: {
      saved: savedDays,
      resolved: resolvedDays,
      matches: daysMatch,
      withinFlexibleRange,
      issue: daysIssue,
    },
    sessionDuration: {
      mode: savedDurationMode,
      savedTarget,
      averageGenerated: Math.round(avgDuration),
      variance: Math.round(variance),
      matches: durationMatches,
      issue: durationIssue,
    },
  }
}

/**
 * Validate weighted prescription usage
 */
function validateWeightedPrescription(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram
): WeightedPrescriptionCheck {
  const hasWeightedPullUp = !!(profile.weightedPullUp?.addedWeight && profile.weightedPullUp.addedWeight > 0)
  const hasWeightedDip = !!(profile.weightedDip?.addedWeight && profile.weightedDip.addedWeight > 0)
  const hasWeightedData = hasWeightedPullUp || hasWeightedDip
  
  // Check for weighted exercises in program
  let weightedPullUpAppeared = false
  let weightedDipAppeared = false
  let pullUpLoadAttached = false
  let dipLoadAttached = false
  let pullUpLoad: string | undefined
  let dipLoad: string | undefined
  
  for (const session of program.sessions || []) {
    for (const ex of session.exercises || []) {
      const nameLower = ex.name.toLowerCase()
      
      // Check for weighted pull-ups
      if (nameLower.includes('weighted pull') || 
          (nameLower.includes('pull') && nameLower.includes('weighted'))) {
        weightedPullUpAppeared = true
        if (ex.prescribedLoad?.load) {
          pullUpLoadAttached = true
          pullUpLoad = `+${ex.prescribedLoad.load} ${ex.prescribedLoad.unit}`
        }
      }
      
      // Check for weighted dips
      if (nameLower.includes('weighted dip') || 
          (nameLower.includes('dip') && nameLower.includes('weighted'))) {
        weightedDipAppeared = true
        if (ex.prescribedLoad?.load) {
          dipLoadAttached = true
          dipLoad = `+${ex.prescribedLoad.load} ${ex.prescribedLoad.unit}`
        }
      }
    }
  }
  
  const weightedExercisesAppeared = weightedPullUpAppeared || weightedDipAppeared
  const prescribedLoadsAttached = pullUpLoadAttached || dipLoadAttached
  
  // Determine if omission is explainable
  const omissionReasons: string[] = []
  let omissionExplainable = false
  
  if (hasWeightedData && !weightedExercisesAppeared) {
    // Check for valid omission reasons
    if (program.recoveryLevel === 'LOW') {
      omissionExplainable = true
      omissionReasons.push('Low recovery state - weighted work de-prioritized')
    }
    if (program.deloadRecommendation?.shouldDeload) {
      omissionExplainable = true
      omissionReasons.push('Deload week - intensity reduced')
    }
    if (profile.primaryGoal === 'flexibility') {
      omissionExplainable = true
      omissionReasons.push('Flexibility primary goal - strength secondary')
    }
    if ((program.sessions?.length || 0) <= 2) {
      omissionExplainable = true
      omissionReasons.push('Limited sessions - skill work prioritized')
    }
  }
  
  return {
    hasWeightedData,
    weightedPullUpData: hasWeightedPullUp,
    weightedDipData: hasWeightedDip,
    weightedExercisesAppeared,
    prescribedLoadsAttached,
    pullUpPrescribed: {
      appeared: weightedPullUpAppeared,
      loadAttached: pullUpLoadAttached,
      load: pullUpLoad,
    },
    dipPrescribed: {
      appeared: weightedDipAppeared,
      loadAttached: dipLoadAttached,
      load: dipLoad,
    },
    omissionExplainable,
    omissionReasons,
  }
}

/**
 * Validate summary/rationale claims against actual content
 */
function validateSummaryRationale(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram,
  skillExpression: SkillExpressionCheck[]
): SummaryRationaleCheck {
  const rationale = program.programRationale || ''
  const goalLabel = program.goalLabel || ''
  
  // Extract claimed skill influences from rationale
  const claimsSkillInfluence: string[] = []
  for (const skill of Object.keys(SKILL_LABELS)) {
    const label = SKILL_LABELS[skill]
    if (rationale.toLowerCase().includes(skill.replace('_', ' ')) ||
        rationale.toLowerCase().includes(label.toLowerCase())) {
      claimsSkillInfluence.push(label)
    }
  }
  
  // Get actual expressed skills
  const actualSkillExpression = skillExpression
    .filter(s => s.wasExpressed)
    .map(s => s.skillLabel)
  
  // Check goal focus claim
  const claimsGoalFocus = goalLabel
  const actualGoalAlignment = program.primaryGoal === profile.primaryGoal
  
  // Detect mismatches
  const mismatchDetails: string[] = []
  let claimsMismatch = false
  
  // Check if claimed skills were actually expressed
  for (const claimed of claimsSkillInfluence) {
    if (!actualSkillExpression.includes(claimed)) {
      claimsMismatch = true
      mismatchDetails.push(`Summary claims ${claimed} influence but skill not expressed in sessions`)
    }
  }
  
  // Check if goal alignment is claimed correctly
  if (!actualGoalAlignment) {
    claimsMismatch = true
    mismatchDetails.push(`Goal mismatch: profile has ${profile.primaryGoal}, program shows ${program.primaryGoal}`)
  }
  
  return {
    claimsSkillInfluence,
    actualSkillExpression,
    claimsGoalFocus,
    actualGoalAlignment,
    claimsMismatch,
    mismatchDetails,
  }
}

/**
 * Build profile summary for logging
 */
function buildProfileSummary(profile: CanonicalProgrammingProfile): ProfileSummary {
  return {
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    selectedSkills: profile.selectedSkills || [],
    scheduleMode: profile.scheduleMode || 'static',
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    sessionDurationMode: profile.sessionDurationMode || 'static',
    sessionLengthMinutes: profile.sessionLengthMinutes || 45,
    hasWeightedPullUp: !!(profile.weightedPullUp?.addedWeight),
    hasWeightedDip: !!(profile.weightedDip?.addedWeight),
    hasAllTimePRs: !!(profile.allTimePRPullUp || profile.allTimePRDip),
    experienceLevel: profile.experienceLevel || 'intermediate',
  }
}

/**
 * Build program summary for logging
 */
function buildProgramSummary(program: AdaptiveProgram): ProgramSummary {
  const sessions = program.sessions || []
  const allExercises = sessions.flatMap(s => s.exercises || [])
  const categories = [...new Set(allExercises.map(e => e.category))]
  
  const avgMinutes = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + (s.estimatedMinutes || 45), 0) / sessions.length
    : 45
  
  // Check for weighted prescriptions
  const hasWeightedPrescriptions = allExercises.some(e => e.prescribedLoad?.load)
  
  // Get expressed skills (simplified)
  const expressedSkills: string[] = []
  for (const skill of Object.keys(SKILL_EXERCISE_PATTERNS)) {
    const patterns = SKILL_EXERCISE_PATTERNS[skill]
    if (allExercises.some(e => matchesSkillPattern(e.name, [...patterns.direct, ...patterns.technical]))) {
      expressedSkills.push(SKILL_LABELS[skill] || skill)
    }
  }
  
  return {
    primaryGoal: program.primaryGoal,
    secondaryGoal: program.secondaryGoal || null,
    goalLabel: program.goalLabel,
    sessionCount: sessions.length,
    scheduleMode: program.scheduleMode,
    currentWeekFrequency: program.currentWeekFrequency,
    averageSessionMinutes: Math.round(avgMinutes),
    hasWeightedPrescriptions,
    exerciseCategories: categories,
    skillsExpressed: expressedSkills,
  }
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate generated program against canonical profile.
 * 
 * [program-profile-validate] Use this prefix to filter logs.
 */
export function validateProgramAgainstProfile(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram
): ProgramProfileValidationResult {
  const checks: ValidationCheck[] = []
  const passed: string[] = []
  const warnings: string[] = []
  const failures: string[] = []
  
  // Build summaries first
  const profileSummary = buildProfileSummary(profile)
  const programSummary = buildProgramSummary(program)
  
  // ==========================================================================
  // ISSUE A: PRIMARY GOAL ALIGNMENT
  // ==========================================================================
  const primaryGoalMatch = profile.primaryGoal === program.primaryGoal
  checks.push({
    category: 'goals',
    subcategory: 'primary_goal',
    severity: primaryGoalMatch ? 'pass' : 'critical',
    profileValue: profile.primaryGoal,
    programValue: program.primaryGoal,
    message: primaryGoalMatch 
      ? 'Primary goal matches' 
      : `Primary goal mismatch: saved "${profile.primaryGoal}", got "${program.primaryGoal}"`,
  })
  if (primaryGoalMatch) passed.push('primary_goal')
  else failures.push('primary_goal')
  
  // ==========================================================================
  // ISSUE A: SECONDARY GOAL ALIGNMENT
  // ==========================================================================
  if (profile.secondaryGoal) {
    const secondaryGoalMatch = profile.secondaryGoal === program.secondaryGoal
    checks.push({
      category: 'goals',
      subcategory: 'secondary_goal',
      severity: secondaryGoalMatch ? 'pass' : 'warning',
      profileValue: profile.secondaryGoal,
      programValue: program.secondaryGoal,
      message: secondaryGoalMatch 
        ? 'Secondary goal matches' 
        : `Secondary goal drift: saved "${profile.secondaryGoal}", got "${program.secondaryGoal || 'none'}"`,
    })
    if (secondaryGoalMatch) passed.push('secondary_goal')
    else warnings.push('secondary_goal')
  }
  
  // ==========================================================================
  // ISSUE B: SELECTED SKILL EXPRESSION
  // ==========================================================================
  const skillExpression = validateSkillExpression(profile, program)
  
  let unexpressedSkillCount = 0
  let unjustifiedOmissionCount = 0
  
  for (const check of skillExpression) {
    if (!check.wasExpressed) {
      unexpressedSkillCount++
      if (!check.omissionJustifiable) {
        unjustifiedOmissionCount++
      }
    }
    
    checks.push({
      category: 'skill_expression',
      subcategory: check.skill,
      severity: check.wasExpressed ? 'pass' 
        : check.omissionJustifiable ? 'warning' 
        : 'mismatch',
      profileValue: `selected: ${check.skillLabel}`,
      programValue: check.wasExpressed 
        ? `${check.expressionType}: ${check.exercisesFound.slice(0, 3).join(', ')}`
        : 'not expressed',
      message: check.wasExpressed 
        ? `${check.skillLabel} expressed via ${check.expressionType}`
        : check.omissionJustifiable
          ? `${check.skillLabel} not expressed (justifiable: ${check.omissionReason})`
          : `${check.skillLabel} not expressed - UNJUSTIFIED`,
    })
    
    if (check.wasExpressed) {
      passed.push(`skill_${check.skill}`)
    } else if (check.omissionJustifiable) {
      warnings.push(`skill_${check.skill}`)
    } else {
      failures.push(`skill_${check.skill}`)
    }
  }
  
  // ==========================================================================
  // ISSUE C: SCHEDULE / DURATION ALIGNMENT
  // ==========================================================================
  const scheduleDuration = validateScheduleDuration(profile, program)
  
  // Schedule mode check
  checks.push({
    category: 'schedule',
    subcategory: 'schedule_mode',
    severity: scheduleDuration.scheduleMode.matches ? 'pass' : 'mismatch',
    profileValue: scheduleDuration.scheduleMode.saved,
    programValue: scheduleDuration.scheduleMode.resolved,
    message: scheduleDuration.scheduleMode.matches 
      ? 'Schedule mode matches'
      : scheduleDuration.scheduleMode.issue || 'Schedule mode mismatch',
  })
  if (scheduleDuration.scheduleMode.matches) passed.push('schedule_mode')
  else failures.push('schedule_mode')
  
  // Training days check
  const daysOk = scheduleDuration.trainingDays.matches || scheduleDuration.trainingDays.withinFlexibleRange
  checks.push({
    category: 'schedule',
    subcategory: 'training_days',
    severity: daysOk ? 'pass' : 'warning',
    profileValue: scheduleDuration.trainingDays.saved,
    programValue: scheduleDuration.trainingDays.resolved,
    message: daysOk 
      ? 'Training days aligned'
      : scheduleDuration.trainingDays.issue || 'Training days mismatch',
  })
  if (daysOk) passed.push('training_days')
  else warnings.push('training_days')
  
  // Session duration check
  checks.push({
    category: 'duration',
    subcategory: 'session_length',
    severity: scheduleDuration.sessionDuration.matches ? 'pass' : 'warning',
    profileValue: `${scheduleDuration.sessionDuration.savedTarget}min (${scheduleDuration.sessionDuration.mode})`,
    programValue: `${scheduleDuration.sessionDuration.averageGenerated}min avg (±${scheduleDuration.sessionDuration.variance}min)`,
    message: scheduleDuration.sessionDuration.matches 
      ? 'Session duration aligned'
      : scheduleDuration.sessionDuration.issue || 'Session duration drift',
  })
  if (scheduleDuration.sessionDuration.matches) passed.push('session_duration')
  else warnings.push('session_duration')
  
  // ==========================================================================
  // ISSUE D: WEIGHTED PRESCRIPTION
  // ==========================================================================
  const weightedPrescription = validateWeightedPrescription(profile, program)
  
  if (weightedPrescription.hasWeightedData) {
    const weightedOk = weightedPrescription.weightedExercisesAppeared
    checks.push({
      category: 'weighted_strength',
      subcategory: 'prescription_usage',
      severity: weightedOk ? 'pass' 
        : weightedPrescription.omissionExplainable ? 'warning' 
        : 'mismatch',
      profileValue: `Pull: ${weightedPrescription.weightedPullUpData}, Dip: ${weightedPrescription.weightedDipData}`,
      programValue: weightedOk 
        ? `Pull: ${weightedPrescription.pullUpPrescribed.load || 'appeared'}, Dip: ${weightedPrescription.dipPrescribed.load || 'appeared'}`
        : 'No weighted exercises',
      message: weightedOk 
        ? 'Weighted strength data used'
        : weightedPrescription.omissionExplainable
          ? `Weighted exercises omitted (${weightedPrescription.omissionReasons.join('; ')})`
          : 'Weighted data available but NOT used in program',
    })
    
    if (weightedOk) passed.push('weighted_prescription')
    else if (weightedPrescription.omissionExplainable) warnings.push('weighted_prescription')
    else failures.push('weighted_prescription')
    
    // Check if loads were attached when exercises appeared
    if (weightedPrescription.weightedExercisesAppeared && !weightedPrescription.prescribedLoadsAttached) {
      checks.push({
        category: 'weighted_strength',
        subcategory: 'load_attachment',
        severity: 'warning',
        profileValue: 'Weighted data available',
        programValue: 'Exercises appeared but no loads prescribed',
        message: 'Weighted exercises present but specific loads not attached',
      })
      warnings.push('weighted_load_attachment')
    }
  }
  
  // ==========================================================================
  // ISSUE E: SUMMARY / RATIONALE TRUTH
  // ==========================================================================
  const summaryRationale = validateSummaryRationale(profile, program, skillExpression)
  
  checks.push({
    category: 'summary',
    subcategory: 'rationale_truth',
    severity: summaryRationale.claimsMismatch ? 'warning' : 'pass',
    profileValue: `Goals: ${profile.primaryGoal}, Skills: ${(profile.selectedSkills || []).slice(0, 3).join(', ')}`,
    programValue: `Claims: ${summaryRationale.claimsGoalFocus}, Expressed: ${summaryRationale.actualSkillExpression.join(', ')}`,
    message: summaryRationale.claimsMismatch 
      ? `Summary overclaims: ${summaryRationale.mismatchDetails.join('; ')}`
      : 'Summary rationale aligned with content',
    details: summaryRationale.mismatchDetails.length > 0 ? summaryRationale.mismatchDetails.join('\n') : undefined,
  })
  
  if (!summaryRationale.claimsMismatch) passed.push('summary_rationale')
  else warnings.push('summary_rationale')
  
  // ==========================================================================
  // CALCULATE OVERALL SCORE
  // ==========================================================================
  const passCount = passed.length
  const warningCount = warnings.length
  const mismatchCount = failures.filter(f => !failures.includes(f)).length // avoid double count
  const criticalCount = checks.filter(c => c.severity === 'critical').length
  
  // Score: pass=100%, warning=60%, mismatch=20%, critical=0%
  const totalChecks = checks.length
  const passScore = checks.filter(c => c.severity === 'pass').length * 100
  const warningScore = checks.filter(c => c.severity === 'warning').length * 60
  const mismatchScore = checks.filter(c => c.severity === 'mismatch').length * 20
  const criticalScore = checks.filter(c => c.severity === 'critical').length * 0
  
  const overallScore = totalChecks > 0 
    ? Math.round((passScore + warningScore + mismatchScore + criticalScore) / totalChecks)
    : 0
  
  const isValid = criticalCount === 0 && failures.length === 0
  
  const result: ProgramProfileValidationResult = {
    isValid,
    overallScore,
    timestamp: new Date().toISOString(),
    passCount,
    warningCount,
    mismatchCount: failures.length,
    criticalCount,
    checks,
    skillExpression,
    scheduleDuration,
    weightedPrescription,
    summaryRationale,
    passed,
    warnings,
    failures,
    profileSummary,
    programSummary,
  }
  
  // ==========================================================================
  // TASK 7: DEV-SAFE LOGGING
  // ==========================================================================
  console.log('[program-profile-validate] Validation complete:', {
    isValid,
    overallScore,
    passCount,
    warningCount,
    failureCount: failures.length,
    criticalCount,
  })
  
  console.log('[program-profile-validate] Profile summary:', profileSummary)
  console.log('[program-profile-validate] Program summary:', programSummary)
  
  if (failures.length > 0) {
    console.log('[program-profile-validate] FAILURES:', failures)
  }
  if (warnings.length > 0) {
    console.log('[program-profile-validate] WARNINGS:', warnings)
  }
  
  // Detailed skill expression log
  const unexpressedSkills = skillExpression.filter(s => !s.wasExpressed)
  if (unexpressedSkills.length > 0) {
    console.log('[program-profile-validate] Unexpressed skills:', 
      unexpressedSkills.map(s => ({
        skill: s.skillLabel,
        justifiable: s.omissionJustifiable,
        reason: s.omissionReason,
      }))
    )
  }
  
  // Weighted prescription log
  if (weightedPrescription.hasWeightedData) {
    console.log('[program-profile-validate] Weighted prescription:', {
      hasData: true,
      appeared: weightedPrescription.weightedExercisesAppeared,
      loadsAttached: weightedPrescription.prescribedLoadsAttached,
      pullUp: weightedPrescription.pullUpPrescribed,
      dip: weightedPrescription.dipPrescribed,
    })
  }
  
  return result
}

/**
 * Quick validation check - returns true/false only
 */
export function isProgramAlignedWithProfile(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram
): boolean {
  const result = validateProgramAgainstProfile(profile, program)
  return result.isValid
}

/**
 * Get human-readable validation summary
 */
export function getValidationSummary(
  result: ProgramProfileValidationResult
): string {
  const lines: string[] = []
  
  lines.push(`Program-Profile Validation: ${result.isValid ? 'PASS' : 'ISSUES DETECTED'}`)
  lines.push(`Score: ${result.overallScore}/100`)
  lines.push(`Passed: ${result.passCount}, Warnings: ${result.warningCount}, Failures: ${result.mismatchCount}, Critical: ${result.criticalCount}`)
  
  if (result.failures.length > 0) {
    lines.push(`\nFailures: ${result.failures.join(', ')}`)
  }
  
  if (result.warnings.length > 0) {
    lines.push(`\nWarnings: ${result.warnings.join(', ')}`)
  }
  
  return lines.join('\n')
}

/**
 * Re-validate an existing program against current canonical profile.
 * Useful for debugging or when profile has changed after generation.
 * 
 * @param program - The existing AdaptiveProgram to validate
 * @returns Validation result or null if canonical profile unavailable
 */
export function revalidateExistingProgram(
  program: AdaptiveProgram
): ProgramProfileValidationResult | null {
  try {
    // Dynamic import to avoid circular dependency
    const { getCanonicalProfile } = require('./canonical-profile-service')
    const profile = getCanonicalProfile()
    
    if (!profile) {
      console.log('[program-profile-validate] Cannot revalidate: no canonical profile')
      return null
    }
    
    console.log('[program-profile-validate] Re-validating existing program against current profile...')
    return validateProgramAgainstProfile(profile, program)
  } catch (err) {
    console.error('[program-profile-validate] Re-validation failed:', err)
    return null
  }
}

/**
 * Get specific skill expression details from a validation result.
 * Useful for UI display of "why isn't my skill in the program?"
 */
export function getSkillExpressionDetails(
  result: ProgramProfileValidationResult,
  skillId: string
): SkillExpressionCheck | null {
  return result.skillExpression.find(s => s.skill === skillId) || null
}

/**
 * Check if a specific skill is meaningfully expressed in the validation result.
 */
export function isSkillExpressed(
  result: ProgramProfileValidationResult,
  skillId: string
): boolean {
  const check = result.skillExpression.find(s => s.skill === skillId)
  return check?.wasExpressed || false
}

/**
 * Get all unexpressed skills from validation result.
 */
export function getUnexpressedSkills(
  result: ProgramProfileValidationResult
): SkillExpressionCheck[] {
  return result.skillExpression.filter(s => !s.wasExpressed)
}

/**
 * Get all mismatches from validation result for display.
 */
export function getValidationMismatches(
  result: ProgramProfileValidationResult
): { category: string; message: string; severity: ValidationSeverity }[] {
  return result.checks
    .filter(c => c.severity === 'mismatch' || c.severity === 'critical')
    .map(c => ({
      category: c.category,
      message: c.message,
      severity: c.severity,
    }))
}
