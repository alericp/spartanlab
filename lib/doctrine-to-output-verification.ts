/**
 * DOCTRINE-TO-OUTPUT VERIFICATION CONTRACT
 * 
 * =============================================================================
 * PURPOSE: Verify that generated programs truly match athlete truth and doctrine
 * =============================================================================
 * 
 * This is the AUTHORITATIVE verification layer that proves whether the final
 * program output is actually aligned with:
 * - Onboarding truth (goals, skills, equipment, schedule)
 * - Canonical profile truth (current stage, limitations, recovery)
 * - Training doctrine (progressive overload, recovery spacing, specificity)
 * - Weekly structure expectations (coherence, differentiation, balance)
 * 
 * This is NOT a quality score for marketing.
 * This is a truth-checking system that tells us where the program is aligned,
 * where it is weak, and where it is generic or mismatched.
 * 
 * LOG PREFIX: [doctrine-verification]
 */

import type { AdaptiveProgram, AdaptiveSession, AdaptiveExercise } from './adaptive-program-builder'
import type { CanonicalProgrammingProfile } from './canonical-profile-service'
import { getCanonicalProfile } from './canonical-profile-service'
import { runPlannerTruthAudit, type PlannerTruthAuditReport } from './planner-truth-audit'

// =============================================================================
// VERDICT TYPES
// =============================================================================

export type VerificationVerdict = 
  | 'PASS'           // Fully aligned with truth/doctrine
  | 'PARTIAL'        // Partially aligned, some gaps
  | 'FAIL'           // Not aligned, significant mismatch
  | 'NOT_APPLICABLE' // This dimension doesn't apply to this profile

export type DoctrineCategory =
  | 'goal_alignment'
  | 'skill_exposure'
  | 'stage_realism'
  | 'weekly_structure'
  | 'exercise_specificity'
  | 'dosage_quality'
  | 'recovery_overlap'
  | 'equipment_alignment'
  | 'time_budget'
  | 'anti_genericity'
  | 'doctrine_shape'
  | 'progression_suitability'

// =============================================================================
// DIMENSION VERDICTS
// =============================================================================

export interface DimensionVerdict {
  category: DoctrineCategory
  verdict: VerificationVerdict
  score: number // 0-100
  truthSource: string // Where the truth comes from
  outputEvidence: string // What the output shows
  reason: string // Why this verdict
  doctrineRule: string // What doctrine says should happen
  recommendation: string | null // How to fix if not PASS
}

// =============================================================================
// VERIFICATION REPORT
// =============================================================================

export interface DoctrineVerificationReport {
  // Meta
  verificationVersion: '1.0.0'
  verificationTimestamp: string
  programId: string
  
  // Overall assessment
  overallVerdict: VerificationVerdict
  overallScore: number // 0-100
  overallReason: string
  
  // Per-dimension verdicts
  dimensions: DimensionVerdict[]
  
  // Summary counts
  passCount: number
  partialCount: number
  failCount: number
  notApplicableCount: number
  
  // Key findings
  strongestAlignment: string
  weakestAlignment: string
  mostCriticalGap: string | null
  
  // Profile snapshot (what we're verifying against)
  profileSnapshot: {
    primaryGoal: string | null
    secondaryGoal: string | null
    selectedSkillCount: number
    selectedSkills: string[]
    scheduleMode: string
    trainingDays: number
    sessionDuration: string
    equipmentAvailable: string[]
    experienceLevel: string
    recoveryQuality: string | null
    jointCautions: string[]
  }
  
  // Program snapshot (what was generated)
  programSnapshot: {
    sessionCount: number
    totalExercises: number
    directWorkCount: number
    technicalWorkCount: number
    supportWorkCount: number
    weightedExerciseCount: number
    uniqueFamilies: number
    averageExercisesPerSession: number
  }
  
  // Underlying audit (for deep inspection)
  underlyingAudit: PlannerTruthAuditReport | null
}

// =============================================================================
// MAIN VERIFICATION FUNCTION
// =============================================================================

/**
 * Run complete doctrine-to-output verification on a generated program.
 * 
 * This is the authoritative function that proves whether the program
 * truly reflects the athlete's truth and follows coaching doctrine.
 */
export function verifyDoctrineToOutput(
  program: AdaptiveProgram,
  profile?: CanonicalProgrammingProfile | null
): DoctrineVerificationReport {
  // Get canonical profile if not provided
  const resolvedProfile = profile || getCanonicalProfile()
  
  // Run underlying planner truth audit
  const underlyingAudit = runPlannerTruthAudit(program, resolvedProfile)
  
  // Build dimension verdicts
  const dimensions: DimensionVerdict[] = [
    verifyGoalAlignment(program, resolvedProfile, underlyingAudit),
    verifySkillExposure(program, resolvedProfile, underlyingAudit),
    verifyStageRealism(program, resolvedProfile),
    verifyWeeklyStructure(program, resolvedProfile, underlyingAudit),
    verifyExerciseSpecificity(program, resolvedProfile, underlyingAudit),
    verifyDosageQuality(program, resolvedProfile),
    verifyRecoveryOverlap(program, resolvedProfile),
    verifyEquipmentAlignment(program, resolvedProfile),
    verifyTimeBudget(program, resolvedProfile),
    verifyAntiGenericity(program, resolvedProfile, underlyingAudit),
    verifyDoctrineShape(program, resolvedProfile),
    verifyProgressionSuitability(program, resolvedProfile),
  ]
  
  // Calculate summary
  const passCount = dimensions.filter(d => d.verdict === 'PASS').length
  const partialCount = dimensions.filter(d => d.verdict === 'PARTIAL').length
  const failCount = dimensions.filter(d => d.verdict === 'FAIL').length
  const notApplicableCount = dimensions.filter(d => d.verdict === 'NOT_APPLICABLE').length
  
  // Calculate overall score (weighted average of applicable dimensions)
  const applicableDimensions = dimensions.filter(d => d.verdict !== 'NOT_APPLICABLE')
  const overallScore = applicableDimensions.length > 0
    ? Math.round(applicableDimensions.reduce((sum, d) => sum + d.score, 0) / applicableDimensions.length)
    : 100
  
  // Determine overall verdict
  let overallVerdict: VerificationVerdict = 'PASS'
  let overallReason = 'Program is well-aligned with athlete truth and training doctrine.'
  
  if (failCount >= 3 || overallScore < 40) {
    overallVerdict = 'FAIL'
    overallReason = `Program has significant misalignment with athlete truth (${failCount} failed dimensions).`
  } else if (failCount >= 1 || partialCount >= 3 || overallScore < 60) {
    overallVerdict = 'PARTIAL'
    overallReason = `Program is partially aligned but has gaps (${failCount} failed, ${partialCount} partial dimensions).`
  }
  
  // Find key findings
  const sortedByScore = [...applicableDimensions].sort((a, b) => b.score - a.score)
  const strongestAlignment = sortedByScore[0]?.category || 'none'
  const weakestAlignment = sortedByScore[sortedByScore.length - 1]?.category || 'none'
  const mostCriticalGap = dimensions.find(d => d.verdict === 'FAIL')?.reason || null
  
  // Build profile snapshot
  const profileSnapshot = {
    primaryGoal: resolvedProfile.primaryGoal,
    secondaryGoal: resolvedProfile.secondaryGoal,
    selectedSkillCount: (resolvedProfile.selectedSkills || []).length,
    selectedSkills: resolvedProfile.selectedSkills || [],
    scheduleMode: resolvedProfile.scheduleMode || 'static',
    trainingDays: resolvedProfile.trainingDays || program.sessions.length,
    sessionDuration: resolvedProfile.sessionDurationMode || 'medium',
    equipmentAvailable: resolvedProfile.equipmentAvailable || [],
    experienceLevel: resolvedProfile.experienceLevel || 'intermediate',
    recoveryQuality: resolvedProfile.recoveryQuality || null,
    jointCautions: resolvedProfile.jointCautions || [],
  }
  
  // Build program snapshot
  const programSnapshot = buildProgramSnapshot(program)
  
  const report: DoctrineVerificationReport = {
    verificationVersion: '1.0.0',
    verificationTimestamp: new Date().toISOString(),
    programId: program.weekNumber?.toString() || 'current',
    overallVerdict,
    overallScore,
    overallReason,
    dimensions,
    passCount,
    partialCount,
    failCount,
    notApplicableCount,
    strongestAlignment,
    weakestAlignment,
    mostCriticalGap,
    profileSnapshot,
    programSnapshot,
    underlyingAudit,
  }
  
  // Log verification result
  console.log('[doctrine-verification] Verification complete:', {
    overallVerdict,
    overallScore,
    passCount,
    partialCount,
    failCount,
    strongestAlignment,
    weakestAlignment,
  })
  
  return report
}

// =============================================================================
// DIMENSION VERIFIERS
// =============================================================================

function verifyGoalAlignment(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile,
  audit: PlannerTruthAuditReport
): DimensionVerdict {
  const primaryGoal = profile.primaryGoal
  const secondaryGoal = profile.secondaryGoal
  
  if (!primaryGoal) {
    return {
      category: 'goal_alignment',
      verdict: 'NOT_APPLICABLE',
      score: 100,
      truthSource: 'No primary goal set in profile',
      outputEvidence: 'N/A',
      reason: 'No primary goal to verify against',
      doctrineRule: 'Primary goal should dominate weekly structure',
      recommendation: null,
    }
  }
  
  // Check if primary goal is well-expressed
  const primaryAudit = audit.skillExpressionAudit.details.find(
    d => d.skill === primaryGoal && d.expectedExpressionLevel === 'primary'
  )
  
  const primaryScore = primaryAudit?.expressionScore || 0
  const isPrimaryWellExpressed = primaryScore >= 60
  
  // Check secondary if present
  const secondaryAudit = secondaryGoal ? audit.skillExpressionAudit.details.find(
    d => d.skill === secondaryGoal && d.expectedExpressionLevel === 'secondary'
  ) : null
  const secondaryScore = secondaryAudit?.expressionScore || 100
  const isSecondaryAdequate = !secondaryGoal || secondaryScore >= 40
  
  // Combined score
  const combinedScore = secondaryGoal 
    ? Math.round(primaryScore * 0.7 + secondaryScore * 0.3)
    : primaryScore
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = `Primary goal "${primaryGoal}" is well-expressed with ${primaryScore}/100 score.`
  
  if (!isPrimaryWellExpressed) {
    verdict = 'FAIL'
    reason = `Primary goal "${primaryGoal}" is under-expressed (${primaryScore}/100). Week does not adequately train main focus.`
  } else if (!isSecondaryAdequate) {
    verdict = 'PARTIAL'
    reason = `Secondary goal "${secondaryGoal}" is under-expressed (${secondaryScore}/100) despite primary being adequate.`
  }
  
  return {
    category: 'goal_alignment',
    verdict,
    score: combinedScore,
    truthSource: `Primary: ${primaryGoal}, Secondary: ${secondaryGoal || 'none'}`,
    outputEvidence: `Primary expression: ${primaryScore}/100, Secondary: ${secondaryScore}/100`,
    reason,
    doctrineRule: 'Primary goal should receive 50-60% of training emphasis, secondary 25-30%.',
    recommendation: verdict !== 'PASS' 
      ? `Increase direct work for ${verdict === 'FAIL' ? primaryGoal : secondaryGoal}`
      : null,
  }
}

function verifySkillExposure(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile,
  audit: PlannerTruthAuditReport
): DimensionVerdict {
  const selectedSkills = profile.selectedSkills || []
  
  if (selectedSkills.length === 0) {
    return {
      category: 'skill_exposure',
      verdict: 'NOT_APPLICABLE',
      score: 100,
      truthSource: 'No skills selected',
      outputEvidence: 'N/A',
      reason: 'No selected skills to verify',
      doctrineRule: 'Selected skills should receive meaningful weekly exposure',
      recommendation: null,
    }
  }
  
  const wellExpressed = audit.skillExpressionAudit.skillsWellExpressed
  const underExpressed = audit.skillExpressionAudit.skillsUnderExpressed
  const cosmetic = audit.skillExpressionAudit.skillsCosmetic
  
  const expressionRatio = wellExpressed / selectedSkills.length
  const score = audit.skillExpressionAudit.overallScore
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = `${wellExpressed}/${selectedSkills.length} skills are well-expressed.`
  
  if (expressionRatio < 0.3 || score < 40) {
    verdict = 'FAIL'
    reason = `Only ${wellExpressed}/${selectedSkills.length} skills are adequately trained. ${underExpressed} are under-expressed.`
  } else if (expressionRatio < 0.6 || score < 70) {
    verdict = 'PARTIAL'
    reason = `${wellExpressed}/${selectedSkills.length} skills well-expressed. ${underExpressed} could use more attention.`
  }
  
  return {
    category: 'skill_exposure',
    verdict,
    score,
    truthSource: `${selectedSkills.length} selected skills: ${selectedSkills.slice(0, 3).join(', ')}${selectedSkills.length > 3 ? '...' : ''}`,
    outputEvidence: `Well-expressed: ${wellExpressed}, Under-expressed: ${underExpressed}, Cosmetic: ${cosmetic}`,
    reason,
    doctrineRule: 'Each selected skill should receive at least support-level expression weekly.',
    recommendation: verdict !== 'PASS'
      ? `Review under-expressed skills: ${audit.skillExpressionAudit.details.filter(d => d.isUnderExpressed).map(d => d.skill).join(', ')}`
      : null,
  }
}

function verifyStageRealism(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile
): DimensionVerdict {
  const experienceLevel = profile.experienceLevel || 'intermediate'
  const primaryGoal = profile.primaryGoal
  
  // Check exercise progressions against experience level
  const allExercises = program.sessions.flatMap(s => s.exercises)
  
  // Count progressions that seem too advanced for beginner
  let realisticCount = 0
  let inflatedCount = 0
  
  const advancedProgressions = ['full_planche', 'full_front_lever', 'iron_cross', 'maltese', 'one_arm_pull_up']
  const intermediateProgressions = ['straddle_planche', 'straddle_front_lever', 'ring_muscle_up']
  
  for (const ex of allExercises) {
    const exId = (ex.id || ex.name || '').toLowerCase()
    
    if (experienceLevel === 'beginner') {
      if (advancedProgressions.some(p => exId.includes(p)) || intermediateProgressions.some(p => exId.includes(p))) {
        inflatedCount++
      } else {
        realisticCount++
      }
    } else if (experienceLevel === 'intermediate') {
      if (advancedProgressions.some(p => exId.includes(p))) {
        inflatedCount++
      } else {
        realisticCount++
      }
    } else {
      realisticCount++ // Advanced can do anything
    }
  }
  
  const totalChecked = realisticCount + inflatedCount
  const realisticRatio = totalChecked > 0 ? realisticCount / totalChecked : 1
  const score = Math.round(realisticRatio * 100)
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = `Exercise progressions are appropriate for ${experienceLevel} level.`
  
  if (realisticRatio < 0.7) {
    verdict = 'FAIL'
    reason = `${inflatedCount} exercises appear too advanced for ${experienceLevel} level. Risk of fantasy programming.`
  } else if (realisticRatio < 0.9) {
    verdict = 'PARTIAL'
    reason = `Most exercises are realistic but ${inflatedCount} may be slightly ambitious for current stage.`
  }
  
  return {
    category: 'stage_realism',
    verdict,
    score,
    truthSource: `Experience level: ${experienceLevel}`,
    outputEvidence: `Realistic: ${realisticCount}, Potentially inflated: ${inflatedCount}`,
    reason,
    doctrineRule: 'Progressions must match current ability, not historical peaks or aspirations.',
    recommendation: verdict !== 'PASS'
      ? 'Consider regressing to more appropriate progressions for current stage'
      : null,
  }
}

function verifyWeeklyStructure(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile,
  audit: PlannerTruthAuditReport
): DimensionVerdict {
  const sessionCount = program.sessions.length
  const targetDays = profile.trainingDays || sessionCount
  
  // Check session differentiation
  const diffAudit = audit.sessionDifferentiationAudit
  const differentiationRatio = diffAudit.sessionPairsChecked > 0
    ? diffAudit.pairsDifferentiated / diffAudit.sessionPairsChecked
    : 1
  
  const score = diffAudit.overallScore
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = `Week has ${sessionCount} sessions with good differentiation (${Math.round(differentiationRatio * 100)}%).`
  
  if (sessionCount !== targetDays) {
    verdict = 'PARTIAL'
    reason = `Generated ${sessionCount} sessions but profile requests ${targetDays}. Structure may not match schedule.`
  } else if (differentiationRatio < 0.5) {
    verdict = 'FAIL'
    reason = `Sessions are too similar (${Math.round(differentiationRatio * 100)}% differentiated). Week lacks intentional structure.`
  } else if (differentiationRatio < 0.8) {
    verdict = 'PARTIAL'
    reason = `Some session pairs are near-identical. Could benefit from more variety.`
  }
  
  return {
    category: 'weekly_structure',
    verdict,
    score,
    truthSource: `Target days: ${targetDays}, Schedule mode: ${profile.scheduleMode || 'static'}`,
    outputEvidence: `Sessions: ${sessionCount}, Pairs differentiated: ${diffAudit.pairsDifferentiated}/${diffAudit.sessionPairsChecked}`,
    reason,
    doctrineRule: 'Each session should have a distinct role and complement other sessions.',
    recommendation: verdict !== 'PASS'
      ? 'Review session intent assignment for better week-level coherence'
      : null,
  }
}

function verifyExerciseSpecificity(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile,
  audit: PlannerTruthAuditReport
): DimensionVerdict {
  const genericShell = audit.genericShellAudit
  const specificityScore = 100 - genericShell.genericityScore
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = 'Exercises are specifically chosen for athlete goals and profile.'
  
  if (genericShell.isGenericShell) {
    verdict = 'FAIL'
    reason = `Program detected as generic shell (${genericShell.genericityScore}/100 genericity). Lacks athlete-specific exercise selection.`
  } else if (genericShell.genericSupportDominance > 50) {
    verdict = 'PARTIAL'
    reason = `${genericShell.genericSupportDominance}% of exercises are generic support. Could be more specific to goals.`
  }
  
  return {
    category: 'exercise_specificity',
    verdict,
    score: specificityScore,
    truthSource: `Goals: ${profile.primaryGoal}, ${profile.secondaryGoal || 'none'}`,
    outputEvidence: `Generic support: ${genericShell.genericSupportDominance}%, Family repetition: ${genericShell.exerciseFamilyRepetition}`,
    reason,
    doctrineRule: 'Exercises should be chosen for direct carryover to target skills, not generic fitness.',
    recommendation: verdict !== 'PASS'
      ? 'Replace generic exercises with skill-specific progressions and support work'
      : null,
  }
}

function verifyDosageQuality(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile
): DimensionVerdict {
  const allExercises = program.sessions.flatMap(s => s.exercises)
  
  // Check for reasonable set/rep ranges
  let wellDosedCount = 0
  let oddDosageCount = 0
  
  for (const ex of allExercises) {
    const sets = ex.sets || 0
    const reps = ex.reps || 0
    const holdTime = ex.holdTime || 0
    
    // Basic dosage sanity checks
    const hasSets = sets >= 2 && sets <= 8
    const hasReps = reps >= 1 && reps <= 30
    const hasHold = holdTime >= 5 && holdTime <= 60
    const hasAnyDosage = hasSets || hasReps || hasHold
    
    // RPE should be specified for main work
    const hasRPE = ex.rpe !== undefined && ex.rpe >= 1 && ex.rpe <= 10
    
    if (hasAnyDosage && hasSets) {
      wellDosedCount++
    } else {
      oddDosageCount++
    }
  }
  
  const totalChecked = wellDosedCount + oddDosageCount
  const dosageRatio = totalChecked > 0 ? wellDosedCount / totalChecked : 1
  const score = Math.round(dosageRatio * 100)
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = `${wellDosedCount}/${totalChecked} exercises have appropriate dosage.`
  
  if (dosageRatio < 0.7) {
    verdict = 'FAIL'
    reason = `${oddDosageCount} exercises have missing or unusual dosage. Prescription quality is poor.`
  } else if (dosageRatio < 0.9) {
    verdict = 'PARTIAL'
    reason = `Most exercises are well-dosed but ${oddDosageCount} have gaps.`
  }
  
  return {
    category: 'dosage_quality',
    verdict,
    score,
    truthSource: `Experience: ${profile.experienceLevel || 'intermediate'}`,
    outputEvidence: `Well-dosed: ${wellDosedCount}, Gaps: ${oddDosageCount}`,
    reason,
    doctrineRule: 'Every exercise should have intentional sets, reps/hold, and effort guidance.',
    recommendation: verdict !== 'PASS'
      ? 'Review exercises with missing dosage and add appropriate prescriptions'
      : null,
  }
}

function verifyRecoveryOverlap(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile
): DimensionVerdict {
  const sessions = program.sessions
  
  // Check for consecutive days with same muscle group focus
  let overlapCount = 0
  let checkedPairs = 0
  
  for (let i = 0; i < sessions.length - 1; i++) {
    const s1 = sessions[i]
    const s2 = sessions[i + 1]
    
    // Check if same focus appears on consecutive days
    const s1Focus = s1.focus?.toLowerCase() || ''
    const s2Focus = s2.focus?.toLowerCase() || ''
    
    checkedPairs++
    
    // Same push/pull/full focus on consecutive days is concerning
    if (s1Focus && s2Focus && s1Focus === s2Focus && s1Focus !== 'recovery') {
      overlapCount++
    }
    
    // Check for same skill emphasis on consecutive days
    const s1Exercises = s1.exercises.map(e => e.id || e.name || '')
    const s2Exercises = s2.exercises.map(e => e.id || e.name || '')
    
    // Count overlapping exercise families
    const s1Families = new Set(s1Exercises.map(getExerciseFamily))
    const s2Families = new Set(s2Exercises.map(getExerciseFamily))
    const overlap = [...s1Families].filter(f => s2Families.has(f)).length
    
    if (overlap > 3) {
      overlapCount++
    }
  }
  
  const overlapRatio = checkedPairs > 0 ? overlapCount / checkedPairs : 0
  const score = Math.round((1 - overlapRatio) * 100)
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = 'Week has good recovery spacing between similar stressors.'
  
  if (overlapRatio > 0.5) {
    verdict = 'FAIL'
    reason = `${overlapCount} consecutive session pairs have significant overlap. Recovery may be compromised.`
  } else if (overlapRatio > 0.2) {
    verdict = 'PARTIAL'
    reason = `Some consecutive sessions have similar focus. Consider alternating patterns.`
  }
  
  return {
    category: 'recovery_overlap',
    verdict,
    score,
    truthSource: `Recovery quality: ${profile.recoveryQuality || 'normal'}`,
    outputEvidence: `Overlapping pairs: ${overlapCount}/${checkedPairs}`,
    reason,
    doctrineRule: 'Similar muscle groups and skills need 48-72h recovery between max efforts.',
    recommendation: verdict !== 'PASS'
      ? 'Alternate push/pull/skill focus across consecutive days'
      : null,
  }
}

function verifyEquipmentAlignment(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile
): DimensionVerdict {
  const availableEquipment = profile.equipmentAvailable || []
  const hasWeights = availableEquipment.includes('weights')
  const hasRings = availableEquipment.includes('rings')
  const hasPBar = availableEquipment.includes('parallettes') || availableEquipment.includes('p_bars')
  
  if (availableEquipment.length === 0) {
    return {
      category: 'equipment_alignment',
      verdict: 'NOT_APPLICABLE',
      score: 100,
      truthSource: 'No equipment restrictions specified',
      outputEvidence: 'N/A',
      reason: 'Equipment not constrained in profile',
      doctrineRule: 'Exercise selection must respect available equipment',
      recommendation: null,
    }
  }
  
  // Check exercises for equipment requirements
  const allExercises = program.sessions.flatMap(s => s.exercises)
  let compatibleCount = 0
  let incompatibleCount = 0
  
  for (const ex of allExercises) {
    const exId = (ex.id || ex.name || '').toLowerCase()
    
    // Check for weighted exercises
    if (exId.includes('weighted') && !hasWeights) {
      incompatibleCount++
      continue
    }
    
    // Check for ring exercises
    if ((exId.includes('ring') || exId.includes('iron_cross')) && !hasRings) {
      incompatibleCount++
      continue
    }
    
    compatibleCount++
  }
  
  const totalChecked = compatibleCount + incompatibleCount
  const compatibilityRatio = totalChecked > 0 ? compatibleCount / totalChecked : 1
  const score = Math.round(compatibilityRatio * 100)
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = `All ${compatibleCount} exercises are compatible with available equipment.`
  
  if (incompatibleCount > 0) {
    verdict = compatibilityRatio >= 0.8 ? 'PARTIAL' : 'FAIL'
    reason = `${incompatibleCount} exercises require equipment not in profile (${availableEquipment.join(', ')}).`
  }
  
  return {
    category: 'equipment_alignment',
    verdict,
    score,
    truthSource: `Equipment: ${availableEquipment.join(', ') || 'none specified'}`,
    outputEvidence: `Compatible: ${compatibleCount}, Incompatible: ${incompatibleCount}`,
    reason,
    doctrineRule: 'Never prescribe exercises requiring unavailable equipment.',
    recommendation: verdict !== 'PASS'
      ? 'Replace incompatible exercises with equipment-appropriate alternatives'
      : null,
  }
}

function verifyTimeBudget(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile
): DimensionVerdict {
  const durationMode = profile.sessionDurationMode || 'medium'
  
  // Target exercise counts by duration
  const targetExercises: Record<string, { min: number; max: number }> = {
    'short': { min: 3, max: 5 },
    'medium': { min: 4, max: 7 },
    'long': { min: 6, max: 10 },
  }
  
  const target = targetExercises[durationMode] || targetExercises['medium']
  
  // Check each session
  let withinBudgetCount = 0
  let overBudgetCount = 0
  let underBudgetCount = 0
  
  for (const session of program.sessions) {
    const exCount = session.exercises.length
    if (exCount >= target.min && exCount <= target.max) {
      withinBudgetCount++
    } else if (exCount > target.max) {
      overBudgetCount++
    } else {
      underBudgetCount++
    }
  }
  
  const totalSessions = program.sessions.length
  const budgetRatio = totalSessions > 0 ? withinBudgetCount / totalSessions : 1
  const score = Math.round(budgetRatio * 100)
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = `${withinBudgetCount}/${totalSessions} sessions fit ${durationMode} time budget.`
  
  if (budgetRatio < 0.5) {
    verdict = 'FAIL'
    reason = `Most sessions don't fit ${durationMode} time budget. ${overBudgetCount} over, ${underBudgetCount} under.`
  } else if (budgetRatio < 0.8) {
    verdict = 'PARTIAL'
    reason = `Some sessions exceed ${durationMode} time budget.`
  }
  
  return {
    category: 'time_budget',
    verdict,
    score,
    truthSource: `Session duration: ${durationMode}`,
    outputEvidence: `Within budget: ${withinBudgetCount}, Over: ${overBudgetCount}, Under: ${underBudgetCount}`,
    reason,
    doctrineRule: 'Session content must fit athlete time availability.',
    recommendation: verdict !== 'PASS'
      ? `Adjust exercise count to fit ${durationMode} session target (${target.min}-${target.max} exercises)`
      : null,
  }
}

function verifyAntiGenericity(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile,
  audit: PlannerTruthAuditReport
): DimensionVerdict {
  const genericShell = audit.genericShellAudit
  const antiGenericityScore = 100 - genericShell.genericityScore
  
  // Also check for rationale overclaim
  const hasOverclaim = genericShell.rationaleOverclaim
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = 'Program is specifically tailored to athlete profile, not a generic template.'
  
  if (genericShell.isGenericShell) {
    verdict = 'FAIL'
    reason = `Program is a generic shell (${genericShell.genericityScore}/100). Does not reflect athlete individuality.`
  } else if (hasOverclaim || genericShell.genericityScore > 40) {
    verdict = 'PARTIAL'
    reason = `Program has generic tendencies (${genericShell.genericityScore}/100 genericity).`
  }
  
  return {
    category: 'anti_genericity',
    verdict,
    score: antiGenericityScore,
    truthSource: `Profile complexity: ${(profile.selectedSkills || []).length} skills, ${profile.primaryGoal} primary`,
    outputEvidence: `Genericity: ${genericShell.genericityScore}/100, Overclaim: ${hasOverclaim}`,
    reason,
    doctrineRule: 'Program must visibly reflect individual athlete profile, not fit-anyone templates.',
    recommendation: verdict !== 'PASS'
      ? 'Replace generic exercises with athlete-specific selections'
      : null,
  }
}

function verifyDoctrineShape(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile
): DimensionVerdict {
  const primaryGoal = profile.primaryGoal
  const trainingPath = profile.trainingPath || 'hybrid'
  
  // Check if week structure matches doctrine expectations
  const sessions = program.sessions
  const totalExercises = sessions.flatMap(s => s.exercises).length
  
  // Doctrine: primary skill should appear in 50-60% of sessions
  const primarySkillSessions = sessions.filter(s => {
    const exercises = s.exercises
    return exercises.some(e => {
      const exId = (e.id || e.name || '').toLowerCase()
      return primaryGoal && exId.includes(primaryGoal.toLowerCase().replace(/_/g, ''))
    })
  }).length
  
  const primaryRatio = sessions.length > 0 ? primarySkillSessions / sessions.length : 0
  
  let score = 100
  let verdict: VerificationVerdict = 'PASS'
  let reason = `Primary goal appears in ${Math.round(primaryRatio * 100)}% of sessions, matching doctrine.`
  
  if (primaryRatio < 0.3) {
    verdict = 'FAIL'
    score = Math.round(primaryRatio * 200) // 0-60 range
    reason = `Primary goal only in ${Math.round(primaryRatio * 100)}% of sessions. Should be 50-60%.`
  } else if (primaryRatio < 0.5) {
    verdict = 'PARTIAL'
    score = Math.round(50 + primaryRatio * 100) // 50-100 range
    reason = `Primary goal in ${Math.round(primaryRatio * 100)}% of sessions. Could be stronger.`
  }
  
  return {
    category: 'doctrine_shape',
    verdict,
    score,
    truthSource: `Primary: ${primaryGoal}, Path: ${trainingPath}`,
    outputEvidence: `Primary in ${primarySkillSessions}/${sessions.length} sessions (${Math.round(primaryRatio * 100)}%)`,
    reason,
    doctrineRule: 'Primary goal should receive dominant weekly emphasis (50-60% of sessions).',
    recommendation: verdict !== 'PASS'
      ? 'Increase primary skill presence across more sessions'
      : null,
  }
}

function verifyProgressionSuitability(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile
): DimensionVerdict {
  const experienceLevel = profile.experienceLevel || 'intermediate'
  const selectedSkills = profile.selectedSkills || []
  
  // Check if progressions match skill selections
  const allExercises = program.sessions.flatMap(s => s.exercises)
  
  let matchingProgressionCount = 0
  let totalSkillExercises = 0
  
  for (const skill of selectedSkills) {
    const skillLower = skill.toLowerCase().replace(/_/g, '')
    const skillExercises = allExercises.filter(e => {
      const exId = (e.id || e.name || '').toLowerCase()
      return exId.includes(skillLower)
    })
    
    if (skillExercises.length > 0) {
      totalSkillExercises += skillExercises.length
      
      // Check if progressions are appropriate
      for (const ex of skillExercises) {
        const exId = (ex.id || ex.name || '').toLowerCase()
        
        // Beginner-appropriate progressions
        if (experienceLevel === 'beginner') {
          if (exId.includes('tuck') || exId.includes('band') || exId.includes('negative') || exId.includes('hold')) {
            matchingProgressionCount++
          }
        } else if (experienceLevel === 'intermediate') {
          if (exId.includes('tuck') || exId.includes('straddle') || exId.includes('adv')) {
            matchingProgressionCount++
          }
        } else {
          matchingProgressionCount++ // Advanced can do anything
        }
      }
    }
  }
  
  const matchRatio = totalSkillExercises > 0 ? matchingProgressionCount / totalSkillExercises : 1
  const score = Math.round(matchRatio * 100)
  
  let verdict: VerificationVerdict = 'PASS'
  let reason = `Progressions are well-suited to ${experienceLevel} level.`
  
  if (matchRatio < 0.5) {
    verdict = 'PARTIAL'
    reason = `Some progressions may be mismatched for ${experienceLevel} level.`
  }
  
  return {
    category: 'progression_suitability',
    verdict,
    score,
    truthSource: `Experience: ${experienceLevel}, Skills: ${selectedSkills.length}`,
    outputEvidence: `Suitable progressions: ${matchingProgressionCount}/${totalSkillExercises}`,
    reason,
    doctrineRule: 'Progressions must match current ability and build toward goals appropriately.',
    recommendation: verdict !== 'PASS'
      ? 'Review progressions for appropriate difficulty level'
      : null,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function buildProgramSnapshot(program: AdaptiveProgram): DoctrineVerificationReport['programSnapshot'] {
  const allExercises = program.sessions.flatMap(s => s.exercises)
  const families = new Set<string>()
  let directCount = 0
  let technicalCount = 0
  let supportCount = 0
  let weightedCount = 0
  
  for (const ex of allExercises) {
    families.add(getExerciseFamily(ex.id || ex.name || ''))
    
    if (ex.category === 'direct' || ex.category === 'skill') directCount++
    if (ex.category === 'technical') technicalCount++
    if (ex.category === 'support' || ex.category === 'accessory') supportCount++
    if (ex.prescribedLoad && ex.prescribedLoad.load > 0) weightedCount++
  }
  
  return {
    sessionCount: program.sessions.length,
    totalExercises: allExercises.length,
    directWorkCount: directCount,
    technicalWorkCount: technicalCount,
    supportWorkCount: supportCount,
    weightedExerciseCount: weightedCount,
    uniqueFamilies: families.size,
    averageExercisesPerSession: program.sessions.length > 0 
      ? Math.round(allExercises.length / program.sessions.length * 10) / 10
      : 0,
  }
}

function getExerciseFamily(exerciseIdOrName: string): string {
  const id = exerciseIdOrName.toLowerCase()
  
  if (id.includes('pull_up') || id.includes('pullup') || id.includes('chin')) return 'vertical_pull'
  if (id.includes('row')) return 'horizontal_pull'
  if (id.includes('dip')) return 'vertical_push'
  if (id.includes('push_up') || id.includes('pushup')) return 'horizontal_push'
  if (id.includes('planche')) return 'planche'
  if (id.includes('front_lever') || id.includes('fl_')) return 'front_lever'
  if (id.includes('back_lever') || id.includes('bl_')) return 'back_lever'
  if (id.includes('handstand') || id.includes('hs_')) return 'handstand'
  if (id.includes('muscle_up') || id.includes('mu_')) return 'muscle_up'
  if (id.includes('l_sit') || id.includes('v_sit')) return 'compression'
  if (id.includes('core') || id.includes('hollow')) return 'core'
  
  return 'other'
}

// =============================================================================
// COMPACT VERDICT SUMMARY (for UI surfacing)
// =============================================================================

export interface CompactVerificationSummary {
  overallVerdict: VerificationVerdict
  overallScore: number
  passCount: number
  partialCount: number
  failCount: number
  topStrength: string
  topWeakness: string
  criticalGap: string | null
  oneLineReason: string
}

/**
 * Get a compact summary suitable for UI display.
 */
export function getCompactVerificationSummary(report: DoctrineVerificationReport): CompactVerificationSummary {
  const categoryLabels: Record<DoctrineCategory, string> = {
    goal_alignment: 'Goal Alignment',
    skill_exposure: 'Skill Exposure',
    stage_realism: 'Stage Realism',
    weekly_structure: 'Weekly Structure',
    exercise_specificity: 'Exercise Specificity',
    dosage_quality: 'Dosage Quality',
    recovery_overlap: 'Recovery Spacing',
    equipment_alignment: 'Equipment Match',
    time_budget: 'Time Budget',
    anti_genericity: 'Program Uniqueness',
    doctrine_shape: 'Doctrine Shape',
    progression_suitability: 'Progression Fit',
  }
  
  return {
    overallVerdict: report.overallVerdict,
    overallScore: report.overallScore,
    passCount: report.passCount,
    partialCount: report.partialCount,
    failCount: report.failCount,
    topStrength: categoryLabels[report.strongestAlignment as DoctrineCategory] || report.strongestAlignment,
    topWeakness: categoryLabels[report.weakestAlignment as DoctrineCategory] || report.weakestAlignment,
    criticalGap: report.mostCriticalGap,
    oneLineReason: report.overallReason,
  }
}
