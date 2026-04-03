/**
 * PLANNER TRUTH AUDIT
 * 
 * =============================================================================
 * PURPOSE: Final safety gate to detect when generated weeks are still too generic
 * =============================================================================
 * 
 * This audit runs AFTER generation and BEFORE a week is treated as valid/saved.
 * It compares the user's actual resolved planner truth against the actual generated
 * week and detects when the week still collapses into a generic shell.
 * 
 * LOG PREFIX: [planner-truth-audit]
 * 
 * AUDIT CATEGORIES:
 * 1. Selected skill expression - meaningful weekly exposure
 * 2. Weighted eligibility vs actual output
 * 3. Session role differentiation
 * 4. Primary goal compression / generic shell detection
 * 5. Limiter influence verification
 * 6. Rationale vs actual exercise alignment
 */

import type { AdaptiveProgram, AdaptiveSession, AdaptiveExercise } from './adaptive-program-builder'
import type { CanonicalProgrammingProfile } from './canonical-profile-service'
import { getCanonicalProfile } from './canonical-profile-service'

// =============================================================================
// AUDIT SEVERITY LEVELS
// =============================================================================

export type AuditSeverity = 
  | 'pass'                  // Week is valid and reflects truth
  | 'pass_with_warnings'    // Week is valid but has minor concerns
  | 'soft_fail_rebuildable' // Week has issues but inputs preserved for retry
  | 'hard_fail_invalid'     // Week is fundamentally broken

// =============================================================================
// [TASK 5] SPECIFIC REASON CLASSES FOR QUALITY NOTICE
// =============================================================================

/**
 * [TASK 5] Specific reason why the program quality score is reduced.
 * The first applicable reason is the "top true issue" shown to the user.
 */
export type ProgramQualityIssueReason =
  | 'selected_skills_overloaded_for_week'  // Too many skills selected for weekly capacity
  | 'skills_under_expressed'               // Selected skills not adequately trained
  | 'rationale_overclaim'                  // Rationale claims things not visible in exercises
  | 'limiter_not_visible'                  // Claimed limiter not addressed in exercises
  | 'session_density_underbuilt'           // Sessions have fewer exercises than expected
  | 'weighted_load_truth_gap'              // Weighted exercises missing expected loads
  | 'near_template_repetition'             // Sessions are too similar to each other
  | 'primary_goal_under_expressed'         // Primary goal not adequately represented
  | 'none'                                 // No issues detected

// =============================================================================
// AUDIT REPORT TYPES
// =============================================================================

export interface SkillExpressionAudit {
  skill: string
  skillLabel: string
  expectedExpressionLevel: 'primary' | 'secondary' | 'tertiary'
  actualExpressionType: 'direct' | 'technical' | 'support' | 'prerequisite' | 'none'
  exercisesExpressingSkill: string[]
  sessionDaysAppearing: number[]
  expressionScore: number // 0-100
  isUnderExpressed: boolean
  isCosmetic: boolean // True if only appears in warmup/cooldown
  auditNote: string
}

export interface WeightedEligibilityAudit {
  exerciseId: string
  exerciseName: string
  wasEligible: boolean
  eligibilityReason: string
  weightedAppeared: boolean
  prescribedLoad: string | null
  blockingReason: string | null
  absenceClassification: 'justified' | 'suspicious' | 'invalid' | 'not_applicable'
}

export interface SessionDifferentiationAudit {
  day1: number
  day2: number
  day1Role: string
  day2Role: string
  exerciseFamilyOverlap: number // 0-100%
  directVsTechnicalDifference: boolean
  weightedVsBodyweightDifference: boolean
  neuralDemandDifference: boolean
  isDifferentiated: boolean
  differentiationScore: number // 0-100
  auditNote: string
}

export interface GenericShellAudit {
  primaryGoalDominance: number // 0-100%
  selectedSkillUnderExpression: number // Count of under-expressed skills
  genericSupportDominance: number // 0-100%
  exerciseFamilyRepetition: number // How many families repeat across sessions
  dayStructureSimilarity: number // 0-100% similar
  rationaleOverclaim: boolean
  overclaimDetails: string[]
  isGenericShell: boolean
  genericityScore: number // 0-100 (higher = more generic)
  auditNote: string
}

export interface LimiterInfluenceAudit {
  currentLimiter: string | null
  limiterClaimedInRationale: boolean
  limiterVisibleInExercises: boolean
  limiterExercises: string[]
  limiterInfluenceScore: number // 0-100
  isInfluenceMissing: boolean
  auditNote: string
}

export interface PlannerTruthAuditReport {
  // Meta
  auditTimestamp: string
  auditVersion: '1.0'
  programId: string
  
  // Overall severity
  severity: AuditSeverity
  overallScore: number // 0-100 (100 = perfect truth alignment)
  
  // [TASK 5] Top issue reason - the most load-bearing actual problem
  topIssueReason: ProgramQualityIssueReason
  topIssueDescription: string
  
  // Audit summaries
  skillExpressionAudit: {
    skillsAudited: number
    skillsWellExpressed: number
    skillsUnderExpressed: number
    skillsCosmetic: number
    overallScore: number
    details: SkillExpressionAudit[]
  }
  
  weightedEligibilityAudit: {
    eligibleOpportunities: number
    weightedActuallyAppeared: number
    suspiciousAbsences: number
    invalidAbsences: number
    overallScore: number
    details: WeightedEligibilityAudit[]
  }
  
  sessionDifferentiationAudit: {
    sessionPairsChecked: number
    pairsDifferentiated: number
    pairsNearIdentical: number
    overallScore: number
    details: SessionDifferentiationAudit[]
  }
  
  genericShellAudit: GenericShellAudit
  
  limiterInfluenceAudit: LimiterInfluenceAudit
  
  // Failure reasons (empty if pass)
  failureReasons: string[]
  warnings: string[]
  recommendations: string[]
  
  // Resolved planner input snapshot (for debugging)
  plannerInputSnapshot: {
    primaryGoal: string | null
    secondaryGoal: string | null
    selectedSkills: string[]
    scheduleMode: string
    sessionDurationMode: string
    equipmentAvailable: string[]
    hasLoadableEquipment: boolean
    experienceLevel: string
  }
  
  // Generated week summary (for comparison)
  weekSummary: {
    sessionCount: number
    totalExercises: number
    uniqueExerciseFamilies: number
    weightedExerciseCount: number
    directWorkCount: number
    technicalWorkCount: number
    supportWorkCount: number
  }
}

// =============================================================================
// SKILL EXPRESSION AUDIT
// =============================================================================

function auditSkillExpression(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram
): PlannerTruthAuditReport['skillExpressionAudit'] {
  const selectedSkills = profile.selectedSkills || []
  const primaryGoal = profile.primaryGoal
  const secondaryGoal = profile.secondaryGoal
  
  const details: SkillExpressionAudit[] = []
  let wellExpressed = 0
  let underExpressed = 0
  let cosmetic = 0
  
  // Get all exercises from all sessions
  const allExercises: { exercise: AdaptiveExercise; dayNumber: number }[] = []
  for (const session of program.sessions) {
    for (const ex of session.exercises) {
      allExercises.push({ exercise: ex, dayNumber: session.dayNumber })
    }
    // Also check warmup/cooldown
    for (const ex of session.warmup || []) {
      allExercises.push({ exercise: ex as AdaptiveExercise, dayNumber: session.dayNumber })
    }
    for (const ex of session.cooldown || []) {
      allExercises.push({ exercise: ex as AdaptiveExercise, dayNumber: session.dayNumber })
    }
  }
  
  for (const skill of selectedSkills) {
    const expectedLevel = skill === primaryGoal ? 'primary' : 
                          skill === secondaryGoal ? 'secondary' : 'tertiary'
    
    // Find exercises that express this skill
    const expressingExercises: string[] = []
    const sessionDays: Set<number> = new Set()
    let isInMainWork = false
    let isInWarmupOnly = true
    
    // [EXERCISE-SELECTION-HARDENING] Safe string operations
    for (const { exercise, dayNumber } of allExercises) {
      const exLower = (exercise.id || exercise.name || '').toLowerCase()
      const skillLower = (skill ?? '').toLowerCase().replace(/_/g, '')
      
      // Check if exercise relates to skill
      const relatesTo = exLower.includes(skillLower) || 
                        exLower.includes(skill.replace(/_/g, '-')) ||
                        isSkillRelatedExercise(skill, exercise.id || '')
      
      if (relatesTo) {
        expressingExercises.push(exercise.name)
        sessionDays.add(dayNumber)
        
        // Check if it's in main work (not warmup/cooldown)
        const session = program.sessions.find(s => s.dayNumber === dayNumber)
        if (session?.exercises.some(e => e.id === exercise.id)) {
          isInMainWork = true
          isInWarmupOnly = false
        }
      }
    }
    
    // Determine expression type
    let actualType: SkillExpressionAudit['actualExpressionType'] = 'none'
    if (expressingExercises.length > 0) {
      if (expectedLevel === 'primary') {
        actualType = isInMainWork ? 'direct' : 'support'
      } else if (expectedLevel === 'secondary') {
        actualType = isInMainWork ? 'technical' : 'support'
      } else {
        actualType = isInMainWork ? 'support' : 'prerequisite'
      }
    }
    
    // Calculate score
    let score = 0
    if (expressingExercises.length > 0) {
      score = Math.min(100, expressingExercises.length * 20)
      if (isInMainWork) score = Math.min(100, score + 30)
      if (sessionDays.size >= 2) score = Math.min(100, score + 20)
    }
    
    const isCosmetic = expressingExercises.length > 0 && isInWarmupOnly
    
    // [TASK 6] Apply weighted thresholds based on priority level
    // Primary/secondary goals are weighted much more heavily than tertiary skills
    // Multi-skill advanced users should not be unfairly penalized for having many saved skills
    const isUnder = (expectedLevel === 'primary' && score < 60) ||
                    (expectedLevel === 'secondary' && score < 40) ||
                    (expectedLevel === 'tertiary' && score < 15) // Lowered threshold for tertiary
    
    if (isCosmetic) {
      cosmetic++
    } else if (isUnder) {
      underExpressed++
    } else if (expressingExercises.length > 0) {
      wellExpressed++
    } else {
      // [TASK 6] Tertiary skills with no expression are acceptable if there are many
      // Primary/secondary must still be expressed
      if (expectedLevel === 'tertiary' && selectedSkills.length > 5) {
        // Large skill library - don't penalize missing tertiary
        wellExpressed++ // Count as acceptable
      } else {
        underExpressed++
      }
    }
    
    details.push({
      skill,
      skillLabel: getSkillLabel(skill),
      expectedExpressionLevel: expectedLevel,
      actualExpressionType: actualType,
      exercisesExpressingSkill: expressingExercises,
      sessionDaysAppearing: Array.from(sessionDays),
      expressionScore: score,
      isUnderExpressed: isUnder,
      isCosmetic,
      auditNote: getSkillAuditNote(skill, score, isCosmetic, isUnder, expectedLevel),
    })
  }
  
  // [TASK 6] Calculate weighted overall score
  // Primary goal: 50% weight, Secondary goal: 30% weight, Tertiary skills: 20% total weight
  const primarySkillDetail = details.find(d => d.expectedExpressionLevel === 'primary')
  const secondarySkillDetail = details.find(d => d.expectedExpressionLevel === 'secondary')
  const tertiarySkillDetails = details.filter(d => d.expectedExpressionLevel === 'tertiary')
  
  const primaryScore = primarySkillDetail?.expressionScore || 0
  const secondaryScore = secondarySkillDetail?.expressionScore || 100 // No secondary = full marks
  const tertiaryAvgScore = tertiarySkillDetails.length > 0
    ? tertiarySkillDetails.reduce((sum, d) => sum + d.expressionScore, 0) / tertiarySkillDetails.length
    : 100 // No tertiary = full marks
  
  // Weighted calculation
  const overallScore = Math.round(
    (primaryScore * 0.5) + (secondaryScore * 0.3) + (tertiaryAvgScore * 0.2)
  )
  
  // [TASK 6] Log weighted score breakdown
  console.log('[planner-truth-audit] Skill expression weighted breakdown:', {
    primarySkill: primarySkillDetail?.skill,
    primaryScore,
    primaryWeight: 0.5,
    secondarySkill: secondarySkillDetail?.skill,
    secondaryScore,
    secondaryWeight: 0.3,
    tertiarySkillCount: tertiarySkillDetails.length,
    tertiaryAvgScore,
    tertiaryWeight: 0.2,
    weightedOverallScore: overallScore,
  })
  
  console.log('[planner-truth-audit] Skill expression audit:', {
    skillsAudited: selectedSkills.length,
    wellExpressed,
    underExpressed,
    cosmetic,
    overallScore,
  })
  
  return {
    skillsAudited: selectedSkills.length,
    skillsWellExpressed: wellExpressed,
    skillsUnderExpressed: underExpressed,
    skillsCosmetic: cosmetic,
    overallScore,
    details,
  }
}

function isSkillRelatedExercise(skill: string, exerciseId: string): boolean {
  const skillMappings: Record<string, string[]> = {
    planche: ['planche', 'lean', 'tuck', 'straddle', 'protraction'],
    front_lever: ['front_lever', 'fl_', 'lever'],
    handstand: ['handstand', 'hs_', 'wall_', 'freestanding'],
    muscle_up: ['muscle_up', 'mu_', 'transition'],
    back_lever: ['back_lever', 'bl_'],
    iron_cross: ['iron_cross', 'cross_', 'rings_'],
    v_sit: ['v_sit', 'l_sit', 'compression'],
    manna: ['manna', 'v_sit', 'compression'],
  }
  
  const related = skillMappings[skill] || [skill]
  const idLower = exerciseId.toLowerCase()
  return related.some(r => idLower.includes(r))
}

function getSkillLabel(skill: string): string {
  const labels: Record<string, string> = {
    planche: 'Planche',
    front_lever: 'Front Lever',
    handstand: 'Handstand',
    muscle_up: 'Muscle Up',
    back_lever: 'Back Lever',
    iron_cross: 'Iron Cross',
    v_sit: 'V-Sit',
    manna: 'Manna',
  }
  return labels[skill] || skill
}

function getSkillAuditNote(
  skill: string, 
  score: number, 
  isCosmetic: boolean, 
  isUnder: boolean,
  level: string
): string {
  if (isCosmetic) {
    return `${getSkillLabel(skill)} only appears in warmup/cooldown - cosmetic exposure only`
  }
  if (isUnder) {
    return `${getSkillLabel(skill)} is under-expressed for ${level} priority (score: ${score}/100)`
  }
  if (score >= 80) {
    return `${getSkillLabel(skill)} is well-expressed with strong weekly exposure`
  }
  return `${getSkillLabel(skill)} has adequate expression (score: ${score}/100)`
}

// =============================================================================
// WEIGHTED ELIGIBILITY AUDIT
// =============================================================================

function auditWeightedEligibility(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram
): PlannerTruthAuditReport['weightedEligibilityAudit'] {
  const hasLoadableEquipment = profile.equipmentAvailable?.includes('weights') || false
  const hasWeightedPullUp = !!(profile.weightedPullUp?.addedWeight && profile.weightedPullUp.addedWeight > 0)
  const hasWeightedDip = !!(profile.weightedDip?.addedWeight && profile.weightedDip.addedWeight > 0)
  
  const details: WeightedEligibilityAudit[] = []
  let eligibleCount = 0
  let actuallyAppeared = 0
  let suspiciousAbsences = 0
  let invalidAbsences = 0
  
  // Find all weighted-capable exercises
  for (const session of program.sessions) {
    for (const ex of session.exercises) {
      const isWeightedCapable = ex.id?.includes('weighted_pull') || 
                                 ex.id?.includes('weighted_dip') ||
                                 ex.name?.toLowerCase().includes('weighted')
      
      if (!isWeightedCapable && !ex.id?.includes('pull_up') && !ex.id?.includes('dip')) {
        continue
      }
      
      const isPullUp = ex.id?.includes('pull') || ex.name?.toLowerCase().includes('pull')
      const isDip = ex.id?.includes('dip') || ex.name?.toLowerCase().includes('dip')
      
      // Determine eligibility
      let eligible = false
      let eligibilityReason = ''
      
      if (!hasLoadableEquipment) {
        eligible = false
        eligibilityReason = 'No loadable equipment available'
      } else if (isPullUp && !hasWeightedPullUp) {
        eligible = false
        eligibilityReason = 'No weighted pull-up data in profile'
      } else if (isDip && !hasWeightedDip) {
        eligible = false
        eligibilityReason = 'No weighted dip data in profile'
      } else if (isPullUp && hasWeightedPullUp) {
        eligible = true
        eligibilityReason = 'Has loadable equipment and weighted pull-up data'
        eligibleCount++
      } else if (isDip && hasWeightedDip) {
        eligible = true
        eligibilityReason = 'Has loadable equipment and weighted dip data'
        eligibleCount++
      }
      
      // Check if weighted actually appeared
      const hasLoad = ex.prescribedLoad && ex.prescribedLoad.load > 0
      if (hasLoad) actuallyAppeared++
      
      // Classify absence
      let absence: WeightedEligibilityAudit['absenceClassification'] = 'not_applicable'
      let blockingReason: string | null = null
      
      if (eligible && !hasLoad) {
        // This is suspicious - eligible but no load
        absence = 'suspicious'
        blockingReason = 'Exercise was eligible for weighted load but none was prescribed'
        suspiciousAbsences++
      } else if (!eligible) {
        absence = 'justified'
        blockingReason = eligibilityReason
      } else if (hasLoad) {
        absence = 'not_applicable'
      }
      
      details.push({
        exerciseId: ex.id || 'unknown',
        exerciseName: ex.name,
        wasEligible: eligible,
        eligibilityReason,
        weightedAppeared: hasLoad,
        prescribedLoad: hasLoad ? `+${ex.prescribedLoad!.load}${ex.prescribedLoad!.unit}` : null,
        blockingReason,
        absenceClassification: absence,
      })
    }
  }
  
  const overallScore = eligibleCount > 0 
    ? Math.round((actuallyAppeared / eligibleCount) * 100)
    : 100 // No eligible opportunities means no failure
  
  console.log('[planner-truth-audit] Weighted eligibility audit:', {
    eligibleOpportunities: eligibleCount,
    actuallyAppeared,
    suspiciousAbsences,
    overallScore,
  })
  
  return {
    eligibleOpportunities: eligibleCount,
    weightedActuallyAppeared: actuallyAppeared,
    suspiciousAbsences,
    invalidAbsences,
    overallScore,
    details,
  }
}

// =============================================================================
// SESSION DIFFERENTIATION AUDIT
// =============================================================================

function auditSessionDifferentiation(
  program: AdaptiveProgram
): PlannerTruthAuditReport['sessionDifferentiationAudit'] {
  const sessions = program.sessions
  const details: SessionDifferentiationAudit[] = []
  let differentiated = 0
  let nearIdentical = 0
  
  // Compare each session pair
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const s1 = sessions[i]
      const s2 = sessions[j]
      
      // Calculate exercise family overlap
      const families1 = new Set(s1.exercises.map(e => getExerciseFamily(e.id || e.name)))
      const families2 = new Set(s2.exercises.map(e => getExerciseFamily(e.id || e.name)))
      const intersection = new Set([...families1].filter(f => families2.has(f)))
      const union = new Set([...families1, ...families2])
      const familyOverlap = union.size > 0 ? Math.round((intersection.size / union.size) * 100) : 0
      
      // Check direct vs technical difference
      const s1DirectCount = s1.exercises.filter(e => e.category === 'direct' || e.selectionReason?.includes('direct')).length
      const s2DirectCount = s2.exercises.filter(e => e.category === 'direct' || e.selectionReason?.includes('direct')).length
      const directDiff = Math.abs(s1DirectCount - s2DirectCount) >= 1
      
      // Check weighted vs bodyweight difference
      const s1WeightedCount = s1.exercises.filter(e => e.prescribedLoad && e.prescribedLoad.load > 0).length
      const s2WeightedCount = s2.exercises.filter(e => e.prescribedLoad && e.prescribedLoad.load > 0).length
      const weightedDiff = Math.abs(s1WeightedCount - s2WeightedCount) >= 1
      
      // Check neural demand difference (based on sets/reps)
      const s1TotalSets = s1.exercises.reduce((sum, e) => sum + e.sets, 0)
      const s2TotalSets = s2.exercises.reduce((sum, e) => sum + e.sets, 0)
      const neuralDiff = Math.abs(s1TotalSets - s2TotalSets) >= 2
      
      // Calculate differentiation score
      let score = 100
      if (familyOverlap > 70) score -= 30
      if (!directDiff) score -= 20
      if (!weightedDiff) score -= 15
      if (!neuralDiff) score -= 15
      score = Math.max(0, score)
      
      const isDiff = score >= 50
      if (isDiff) {
        differentiated++
      } else {
        nearIdentical++
      }
      
      details.push({
        day1: s1.dayNumber,
        day2: s2.dayNumber,
        day1Role: s1.focus || 'unknown',
        day2Role: s2.focus || 'unknown',
        exerciseFamilyOverlap: familyOverlap,
        directVsTechnicalDifference: directDiff,
        weightedVsBodyweightDifference: weightedDiff,
        neuralDemandDifference: neuralDiff,
        isDifferentiated: isDiff,
        differentiationScore: score,
        auditNote: isDiff 
          ? `Days ${s1.dayNumber} and ${s2.dayNumber} are adequately differentiated`
          : `Days ${s1.dayNumber} and ${s2.dayNumber} are near-identical despite different roles`,
      })
    }
  }
  
  const pairsChecked = details.length
  const overallScore = pairsChecked > 0 
    ? Math.round((differentiated / pairsChecked) * 100)
    : 100
  
  console.log('[planner-truth-audit] Session differentiation audit:', {
    pairsChecked,
    differentiated,
    nearIdentical,
    overallScore,
  })
  
  return {
    sessionPairsChecked: pairsChecked,
    pairsDifferentiated: differentiated,
    pairsNearIdentical: nearIdentical,
    overallScore,
    details,
  }
}

function getExerciseFamily(idOrName: string): string {
  const lower = idOrName.toLowerCase()
  
  if (lower.includes('pull_up') || lower.includes('pullup')) return 'pull_up'
  if (lower.includes('push_up') || lower.includes('pushup')) return 'push_up'
  if (lower.includes('dip')) return 'dip'
  if (lower.includes('row')) return 'row'
  if (lower.includes('squat')) return 'squat'
  if (lower.includes('lunge')) return 'lunge'
  if (lower.includes('planche')) return 'planche'
  if (lower.includes('lever')) return 'lever'
  if (lower.includes('handstand') || lower.includes('hs')) return 'handstand'
  if (lower.includes('l_sit') || lower.includes('l-sit')) return 'l_sit'
  if (lower.includes('pike')) return 'pike'
  if (lower.includes('hollow')) return 'hollow'
  
  return 'other'
}

// =============================================================================
// GENERIC SHELL AUDIT
// =============================================================================

function auditGenericShell(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram,
  skillAudit: PlannerTruthAuditReport['skillExpressionAudit']
): GenericShellAudit {
  const sessions = program.sessions
  const primaryGoal = profile.primaryGoal
  
  // Calculate primary goal dominance
  let primaryGoalExercises = 0
  let totalExercises = 0
  
  for (const session of sessions) {
    for (const ex of session.exercises) {
      totalExercises++
      if (primaryGoal && isSkillRelatedExercise(primaryGoal, ex.id || ex.name)) {
        primaryGoalExercises++
      }
    }
  }
  
  const primaryGoalDominance = totalExercises > 0 
    ? Math.round((primaryGoalExercises / totalExercises) * 100)
    : 0
  
  // Count under-expressed skills
  const underExpressedCount = skillAudit.skillsUnderExpressed + skillAudit.skillsCosmetic
  
  // Calculate generic support dominance
  const genericSupportPatterns = ['plank', 'hollow_hold', 'dead_hang', 'shoulder_tap', 'wall_slide']
  let genericSupportCount = 0
  let supportCount = 0
  
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.category === 'support' || ex.selectionReason?.includes('support')) {
        supportCount++
        const idLower = (ex.id || ex.name || '').toLowerCase()
        if (genericSupportPatterns.some(p => idLower.includes(p))) {
          genericSupportCount++
        }
      }
    }
  }
  
  const genericSupportDominance = supportCount > 0 
    ? Math.round((genericSupportCount / supportCount) * 100)
    : 0
  
  // Calculate exercise family repetition across sessions
  const sessionFamilies: Set<string>[] = sessions.map(s => 
    new Set(s.exercises.map(e => getExerciseFamily(e.id || e.name)))
  )
  
  let totalOverlap = 0
  let comparisons = 0
  for (let i = 0; i < sessionFamilies.length; i++) {
    for (let j = i + 1; j < sessionFamilies.length; j++) {
      const intersection = new Set([...sessionFamilies[i]].filter(f => sessionFamilies[j].has(f)))
      const union = new Set([...sessionFamilies[i], ...sessionFamilies[j]])
      if (union.size > 0) {
        totalOverlap += intersection.size / union.size
        comparisons++
      }
    }
  }
  const familyRepetition = comparisons > 0 ? Math.round((totalOverlap / comparisons) * 100) : 0
  
  // Calculate day structure similarity
  const sessionProfiles = sessions.map(s => ({
    exerciseCount: s.exercises.length,
    sets: s.exercises.reduce((sum, e) => sum + e.sets, 0),
    categories: new Set(s.exercises.map(e => e.category)),
  }))
  
  let structureSimilarity = 0
  let structureComparisons = 0
  for (let i = 0; i < sessionProfiles.length; i++) {
    for (let j = i + 1; j < sessionProfiles.length; j++) {
      const p1 = sessionProfiles[i]
      const p2 = sessionProfiles[j]
      
      // Compare exercise counts
      const countSim = 1 - Math.abs(p1.exerciseCount - p2.exerciseCount) / Math.max(p1.exerciseCount, p2.exerciseCount, 1)
      const setSim = 1 - Math.abs(p1.sets - p2.sets) / Math.max(p1.sets, p2.sets, 1)
      
      structureSimilarity += (countSim + setSim) / 2
      structureComparisons++
    }
  }
  const dayStructureSimilarity = structureComparisons > 0 
    ? Math.round((structureSimilarity / structureComparisons) * 100)
    : 0
  
  // Check rationale overclaim
  const overclaimDetails: string[] = []
  let rationaleOverclaim = false
  
  // Check if rationale claims skills that aren't expressed
  for (const skill of skillAudit.details) {
    if (skill.isUnderExpressed || skill.isCosmetic) {
      // Check if this skill is mentioned in program rationale
      // [EXERCISE-SELECTION-HARDENING] Safe string operations
      const rationale = program.programRationale?.toLowerCase() || ''
      if (rationale.includes((skill.skill ?? '').toLowerCase()) || rationale.includes((skill.skillLabel ?? '').toLowerCase())) {
        rationaleOverclaim = true
        overclaimDetails.push(`Rationale claims ${skill.skillLabel} but it's ${skill.isCosmetic ? 'only cosmetically expressed' : 'under-expressed'}`)
      }
    }
  }
  
  // Calculate overall genericity score
  let genericityScore = 0
  if (primaryGoalDominance > 80) genericityScore += 25
  if (underExpressedCount >= 2) genericityScore += 25
  if (genericSupportDominance > 60) genericityScore += 20
  if (familyRepetition > 70) genericityScore += 15
  if (dayStructureSimilarity > 80) genericityScore += 15
  
  const isGeneric = genericityScore >= 50
  
  const auditNote = isGeneric 
    ? `Week appears to be a generic shell (score: ${genericityScore}/100). Consider rebuilding.`
    : `Week shows adequate variety and truth alignment (genericity: ${genericityScore}/100)`
  
  console.log('[generic-shell-detect] Generic shell audit:', {
    primaryGoalDominance,
    underExpressedCount,
    genericSupportDominance,
    familyRepetition,
    dayStructureSimilarity,
    genericityScore,
    isGeneric,
  })
  
  return {
    primaryGoalDominance,
    selectedSkillUnderExpression: underExpressedCount,
    genericSupportDominance,
    exerciseFamilyRepetition: familyRepetition,
    dayStructureSimilarity,
    rationaleOverclaim,
    overclaimDetails,
    isGenericShell: isGeneric,
    genericityScore,
    auditNote,
  }
}

// =============================================================================
// LIMITER INFLUENCE AUDIT
// =============================================================================

function auditLimiterInfluence(
  profile: CanonicalProgrammingProfile,
  program: AdaptiveProgram
): LimiterInfluenceAudit {
  // Get current limiter from profile diagnostics
  const currentLimiter = profile.limiterIdentification?.currentLimiter || null
  const limiterClaimedInRationale = currentLimiter 
    ? (program.programRationale?.toLowerCase()?.includes(currentLimiter.toLowerCase()) || false)
    : false
  
  // Look for limiter-related exercises
  const limiterExercises: string[] = []
  
  if (currentLimiter) {
    const limiterPatterns = getLimiterPatterns(currentLimiter)
    
    for (const session of program.sessions) {
      for (const ex of session.exercises) {
        const idLower = (ex.id || ex.name || '').toLowerCase()
        if (limiterPatterns.some(p => idLower.includes(p))) {
          limiterExercises.push(ex.name)
        }
      }
    }
  }
  
  const limiterVisible = limiterExercises.length > 0
  
  // Calculate influence score
  let influenceScore = 100
  if (currentLimiter) {
    if (!limiterVisible) influenceScore -= 50
    if (!limiterClaimedInRationale && currentLimiter) influenceScore -= 20
    if (limiterExercises.length < 2) influenceScore -= 30
  }
  influenceScore = Math.max(0, influenceScore)
  
  const isInfluenceMissing = currentLimiter !== null && !limiterVisible
  
  const auditNote = !currentLimiter 
    ? 'No limiter identified in profile - no limiter influence expected'
    : isInfluenceMissing
      ? `Limiter "${currentLimiter}" is claimed but not visible in exercises`
      : `Limiter "${currentLimiter}" is addressed with ${limiterExercises.length} exercises`
  
  console.log('[planner-truth-audit] Limiter influence audit:', {
    currentLimiter,
    limiterClaimedInRationale,
    limiterVisible,
    limiterExercisesCount: limiterExercises.length,
    influenceScore,
  })
  
  return {
    currentLimiter,
    limiterClaimedInRationale,
    limiterVisibleInExercises: limiterVisible,
    limiterExercises,
    limiterInfluenceScore: influenceScore,
    isInfluenceMissing,
    auditNote,
  }
}

function getLimiterPatterns(limiter: string): string[] {
  const patterns: Record<string, string[]> = {
    shoulder_strength: ['shoulder', 'delt', 'overhead', 'press'],
    shoulder_flexibility: ['shoulder', 'german_hang', 'skin_the_cat', 'dislocate'],
    core_compression: ['compression', 'pike', 'l_sit', 'v_sit', 'pancake'],
    straight_arm_strength: ['planche', 'lever', 'maltese', 'iron_cross'],
    pulling_strength: ['pull_up', 'row', 'front_lever', 'muscle_up'],
    pushing_strength: ['push_up', 'dip', 'planche', 'press'],
    wrist_conditioning: ['wrist', 'planche_lean', 'frog_stand'],
    hip_flexibility: ['pike', 'pancake', 'straddle', 'middle_split'],
  }
  
  return patterns[limiter.toLowerCase().replace(/\s+/g, '_')] || [limiter.toLowerCase()]
}

// =============================================================================
// MAIN AUDIT FUNCTION
// =============================================================================

export function runPlannerTruthAudit(
  program: AdaptiveProgram,
  profile?: CanonicalProgrammingProfile
): PlannerTruthAuditReport {
  const resolvedProfile = profile || getCanonicalProfile()
  
  console.log('[planner-truth-audit] Starting comprehensive audit...')
  
  // Run individual audits
  const skillExpressionAudit = auditSkillExpression(resolvedProfile, program)
  const weightedEligibilityAudit = auditWeightedEligibility(resolvedProfile, program)
  const sessionDifferentiationAudit = auditSessionDifferentiation(program)
  const genericShellAudit = auditGenericShell(resolvedProfile, program, skillExpressionAudit)
  const limiterInfluenceAudit = auditLimiterInfluence(resolvedProfile, program)
  
  // Collect failures and warnings
  const failureReasons: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Evaluate skill expression
  if (skillExpressionAudit.skillsUnderExpressed > 0) {
    warnings.push(`${skillExpressionAudit.skillsUnderExpressed} selected skill(s) are under-expressed`)
    recommendations.push('Consider adjusting exercise selection to better express selected skills')
  }
  if (skillExpressionAudit.skillsCosmetic > 0) {
    warnings.push(`${skillExpressionAudit.skillsCosmetic} skill(s) only appear in warmup/cooldown`)
  }
  
  // Evaluate weighted eligibility
  if (weightedEligibilityAudit.suspiciousAbsences > 0) {
    warnings.push(`${weightedEligibilityAudit.suspiciousAbsences} weighted-eligible exercise(s) missing prescribed load`)
    recommendations.push('Check weightedBenchmarks are passed to exercise selector')
  }
  if (weightedEligibilityAudit.invalidAbsences > 0) {
    failureReasons.push(`${weightedEligibilityAudit.invalidAbsences} weighted exercise(s) have invalid absence`)
  }
  
  // Evaluate session differentiation
  if (sessionDifferentiationAudit.pairsNearIdentical > 0) {
    warnings.push(`${sessionDifferentiationAudit.pairsNearIdentical} session pair(s) are near-identical despite different roles`)
    recommendations.push('Review session intent assignment for better variety')
  }
  
  // Evaluate generic shell
  if (genericShellAudit.isGenericShell) {
    failureReasons.push(`Week detected as generic shell (score: ${genericShellAudit.genericityScore}/100)`)
    recommendations.push('Week structure is too generic - consider rebuilding with different intent')
  }
  if (genericShellAudit.rationaleOverclaim) {
    warnings.push('Rationale claims skill influence not reflected in exercises')
    for (const detail of genericShellAudit.overclaimDetails) {
      warnings.push(detail)
    }
  }
  
  // Evaluate limiter influence
  if (limiterInfluenceAudit.isInfluenceMissing) {
    warnings.push(`Limiter "${limiterInfluenceAudit.currentLimiter}" not visible in exercise selection`)
    recommendations.push('Add exercises that address the identified limiter')
  }
  
  // Calculate overall score
  const scores = [
    skillExpressionAudit.overallScore,
    weightedEligibilityAudit.overallScore,
    sessionDifferentiationAudit.overallScore,
    100 - genericShellAudit.genericityScore, // Invert: lower genericity = higher score
    limiterInfluenceAudit.limiterInfluenceScore,
  ]
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  
  // Determine severity
  let severity: AuditSeverity = 'pass'
  if (failureReasons.length > 0 && overallScore < 40) {
    severity = 'hard_fail_invalid'
  } else if (failureReasons.length > 0 || overallScore < 50) {
    severity = 'soft_fail_rebuildable'
  } else if (warnings.length > 2 || overallScore < 70) {
    severity = 'pass_with_warnings'
  }
  
  // ==========================================================================
  // [TASK 5] DETERMINE TOP ISSUE REASON
  // Priority order: primary goal -> sessions -> skills -> limiter -> rationale -> templates
  // ==========================================================================
  let topIssueReason: ProgramQualityIssueReason = 'none'
  let topIssueDescription = 'Program quality meets expectations'
  
  // Check in priority order - first match wins
  const primarySkillAudit = skillExpressionAudit.details.find(
    d => d.expectedExpressionLevel === 'primary'
  )
  
  if (primarySkillAudit && primarySkillAudit.isUnderExpressed) {
    // Primary goal not adequately represented - highest priority issue
    topIssueReason = 'primary_goal_under_expressed'
    topIssueDescription = `Primary goal "${primarySkillAudit.skillLabel}" is under-expressed (score: ${primarySkillAudit.expressionScore}/100). The week may not adequately train your main focus.`
  } else if (weekSummary.totalExercises < program.sessions.length * 3) {
    // Sessions are sparse - likely underbuilt
    topIssueReason = 'session_density_underbuilt'
    topIssueDescription = `Sessions average only ${Math.round(weekSummary.totalExercises / program.sessions.length)} exercises. Consider regenerating for fuller training days.`
  } else if (selectedSkills.length > 5 && skillExpressionAudit.skillsUnderExpressed > 2) {
    // Too many skills for weekly capacity
    topIssueReason = 'selected_skills_overloaded_for_week'
    topIssueDescription = `You have ${selectedSkills.length} selected skills but ${skillExpressionAudit.skillsUnderExpressed} are under-expressed this week. Consider focusing on fewer skills or extending your training cycle.`
  } else if (skillExpressionAudit.skillsUnderExpressed > 1) {
    // General skill under-expression
    topIssueReason = 'skills_under_expressed'
    topIssueDescription = `${skillExpressionAudit.skillsUnderExpressed} selected skill(s) are not adequately trained this week.`
  } else if (limiterInfluenceAudit.isInfluenceMissing) {
    // Limiter claimed but not visible
    topIssueReason = 'limiter_not_visible'
    topIssueDescription = `Your identified limiter "${limiterInfluenceAudit.currentLimiter}" is not addressed in the exercises. Consider adding limiter-specific work.`
  } else if (weightedEligibilityAudit.suspiciousAbsences > 0) {
    // Weighted loads missing
    topIssueReason = 'weighted_load_truth_gap'
    topIssueDescription = `${weightedEligibilityAudit.suspiciousAbsences} exercise(s) could have weighted loads but don't. Check your weighted benchmarks.`
  } else if (genericShellAudit.rationaleOverclaim) {
    // Rationale claims things not visible
    topIssueReason = 'rationale_overclaim'
    topIssueDescription = `The program rationale claims skill influence not reflected in actual exercises.`
  } else if (sessionDifferentiationAudit.pairsNearIdentical > 0) {
    // Sessions too similar
    topIssueReason = 'near_template_repetition'
    topIssueDescription = `${sessionDifferentiationAudit.pairsNearIdentical} session pair(s) are nearly identical. Consider adding more variety.`
  }
  
  console.log('[planner-truth-audit] Top issue classification:', {
    topIssueReason,
    topIssueDescription: topIssueDescription.slice(0, 100),
    overallScore,
    severity,
  })
  
  // Build planner input snapshot
  const plannerInputSnapshot = {
    primaryGoal: resolvedProfile.primaryGoal,
    secondaryGoal: resolvedProfile.secondaryGoal,
    selectedSkills: resolvedProfile.selectedSkills || [],
    scheduleMode: resolvedProfile.scheduleMode || 'static',
    sessionDurationMode: resolvedProfile.sessionDurationMode || 'static',
    equipmentAvailable: resolvedProfile.equipmentAvailable || [],
    hasLoadableEquipment: resolvedProfile.equipmentAvailable?.includes('weights') || false,
    experienceLevel: resolvedProfile.experienceLevel || 'intermediate',
  }
  
  // Build week summary
  let totalExercises = 0
  let weightedCount = 0
  let directCount = 0
  let technicalCount = 0
  let supportCount = 0
  const families = new Set<string>()
  
  for (const session of program.sessions) {
    for (const ex of session.exercises) {
      totalExercises++
      families.add(getExerciseFamily(ex.id || ex.name))
      
      if (ex.prescribedLoad && ex.prescribedLoad.load > 0) weightedCount++
      if (ex.category === 'direct') directCount++
      if (ex.category === 'technical') technicalCount++
      if (ex.category === 'support') supportCount++
    }
  }
  
  const weekSummary = {
    sessionCount: program.sessions.length,
    totalExercises,
    uniqueExerciseFamilies: families.size,
    weightedExerciseCount: weightedCount,
    directWorkCount: directCount,
    technicalWorkCount: technicalCount,
    supportWorkCount: supportCount,
  }
  
  const report: PlannerTruthAuditReport = {
    auditTimestamp: new Date().toISOString(),
    auditVersion: '1.0',
    programId: program.weekNumber?.toString() || 'current',
    severity,
    overallScore,
    // [TASK 5] Include top issue classification
    topIssueReason,
    topIssueDescription,
    skillExpressionAudit,
    weightedEligibilityAudit,
    sessionDifferentiationAudit,
    genericShellAudit,
    limiterInfluenceAudit,
    failureReasons,
    warnings,
    recommendations,
    plannerInputSnapshot,
    weekSummary,
  }
  
  console.log('[audit-severity] Final audit result:', {
    severity,
    overallScore,
    failureCount: failureReasons.length,
    warningCount: warnings.length,
    recommendationCount: recommendations.length,
  })
  
  return report
}

// =============================================================================
// GATING HELPER
// =============================================================================

export interface AuditGatingResult {
  canSave: boolean
  shouldWarn: boolean
  shouldBlock: boolean
  userMessage: string | null
  preserveInputs: boolean
}

/**
 * Determines how to gate save/display based on audit severity.
 * [audit-severity] TASK 7: Save/display gating
 */
export function getAuditGatingResult(audit: PlannerTruthAuditReport): AuditGatingResult {
  switch (audit.severity) {
    case 'pass':
      return {
        canSave: true,
        shouldWarn: false,
        shouldBlock: false,
        userMessage: null,
        preserveInputs: false,
      }
    
    case 'pass_with_warnings':
      return {
        canSave: true,
        shouldWarn: true,
        shouldBlock: false,
        userMessage: `Program generated with ${audit.warnings.length} minor concern(s). Check program details.`,
        preserveInputs: false,
      }
    
    case 'soft_fail_rebuildable':
      return {
        canSave: true, // Allow save but mark as suboptimal
        shouldWarn: true,
        shouldBlock: false,
        userMessage: `Program may not fully reflect your preferences. ${audit.recommendations[0] || 'Consider regenerating.'}`,
        preserveInputs: true,
      }
    
    case 'hard_fail_invalid':
      return {
        canSave: false,
        shouldWarn: true,
        shouldBlock: true,
        userMessage: `Program could not properly reflect your profile. ${audit.failureReasons[0] || 'Please try regenerating.'}`,
        preserveInputs: true,
      }
  }
}
