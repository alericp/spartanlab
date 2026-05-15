/**
 * PROGRAM BALANCE READ-ONLY ANALYZER — MASTER-8B.3
 *
 * =============================================================================
 * READ-ONLY PROGRAM BALANCE ANALYSIS IMPLEMENTATION
 * =============================================================================
 *
 * This module implements the read-only program balance analyzer that consumes
 * the B2 exercise/skill knowledge seed and the current program structure to
 * detect balance issues, skill expression gaps, and future adaptation candidates.
 *
 * CRITICAL GUARANTEES:
 *   - Does NOT mutate any input objects
 *   - Does NOT write to storage
 *   - Does NOT call APIs
 *   - Does NOT auto-run at module load
 *   - Does NOT import React/UI
 *   - Does NOT import generator
 *   - Does NOT import live workout runtime
 *
 * SEED SCOPE:
 *   The B2 seed is REPRESENTATIVE ONLY. Unknown exercises produce knowledge
 *   coverage gaps, not crashes. Confidence is reduced when data is missing.
 *   Full database expansion is deferred to MASTER-8C / MASTER-8C+.
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.3
 */

import type {
  ProgramBalanceBranchInput,
  ProgramBalanceReadOnlyResult,
  ProgramBalanceExerciseResolution,
  ProgramBalanceKnowledgeCoverageSummary,
  ProgramBalanceSkillExpression,
  ProgramBalanceMovementFamilySummary,
  ProgramBalanceWeightedAnchorSummary,
  ProgramBalanceTissueStressSummary,
  ProgramBalanceFinding,
  ProgramBalanceProof,
  FutureSessionCandidate,
  ProgramBalanceSeverity,
  ProgramBalanceConfidence,
  SkillExpressionStatus,
  AnchorStatus,
  ProgramBalanceExerciseInput,
} from './program-balance-intelligence-contract'

import {
  getExerciseSkillKnowledgeEntries,
  getSkillKnowledgeEntries,
  findKnowledgeByAlias,
} from './exercise-skill-knowledge-validation'

import {
  buildFutureSessionPlanningDetail,
  type FuturePlanningContext,
} from './program-balance-future-planning'

import {
  summarizeExerciseIdentityCoverage,
  getExerciseSourceCounts,
} from './program-balance-exercise-identity-coverage'

// =============================================================================
// UNAVAILABLE RESULT HELPER
// =============================================================================

/**
 * Returns an unavailable result with a reason
 */
export function getProgramBalanceReadOnlyUnavailable(
  reason: string
): ProgramBalanceReadOnlyResult {
  return {
    status: 'unavailable',
    mutationAllowedNow: false,
    sourceStep: 'MASTER_8B_3',
    analyzedSessionCount: 0,
    analyzedExerciseCount: 0,
    knowledgeMatchedExerciseCount: 0,
    knowledgeMissingExerciseCount: 0,
    selectedSkillCount: 0,
    knowledgeCoverageSummary: {
      seedIsRepresentativeOnly: true,
      knownExerciseCount: 0,
      unknownExerciseCount: 0,
      knownExerciseIds: [],
      unknownExerciseIds: [],
      knownExerciseNames: [],
      unknownExerciseNames: [],
      missingCoverageWarnings: [reason],
      fullDatabaseDeferredTo: 'MASTER_8C',
      mayUnderestimateBalanceIssues: true,
      mayUnderestimateAnchorSupport: true,
      mayUnderestimateWarmupCooldownNeeds: true,
    },
    findings: [],
    skillExpression: [],
    movementFamilySummary: [],
    weightedAnchorSummary: {
      weightedPullUpPresent: false,
      weightedDipPresent: false,
      pullAnchorStatus: 'unknown_coverage',
      dipAnchorStatus: 'unknown_coverage',
      missingReason: reason,
      severity: 'blocked',
      rationale: reason,
      confidence: 'low',
      missingKnowledgeCoverage: true,
    },
    tissueStressSummary: [],
    futureSessionCandidates: [],
    missingData: [reason],
    proof: {
      consumedKnowledgeSeed: false,
      consumedRepresentativeSeedOnly: true,
      fullKnowledgeBaseComplete: false,
      fullKnowledgeBaseDeferredTo: 'MASTER_8C',
      consumedSelectedSkills: false,
      consumedProgramSessions: false,
      consumedCompletionState: false,
      consumedMethodSummary: false,
      consumedAdaptiveFoundation: false,
      noMutationPerformed: true,
      noGeneratorChange: true,
      safeForUiReadOnlyConsumption: false,
    },
    nextAllowedStep: 'MASTER_8B_4',
  }
}

// =============================================================================
// EXERCISE RESOLUTION
// =============================================================================

/**
 * Resolve an exercise against the B2 knowledge seed
 */
export function resolveProgramBalanceExercise(
  exercise: ProgramBalanceExerciseInput
): ProgramBalanceExerciseResolution {
  const knowledgeEntries = getExerciseSkillKnowledgeEntries()

  // Try exact ID match
  let entry = knowledgeEntries.find((e) => e.exerciseId === exercise.id)

  // Try alias match by name
  if (!entry) {
    const aliasResult = findKnowledgeByAlias(exercise.name)
    if (aliasResult) {
      entry = aliasResult
    }
  }

  // Try alias match by ID as name
  if (!entry) {
    const aliasResult = findKnowledgeByAlias(exercise.id)
    if (aliasResult) {
      entry = aliasResult
    }
  }

  if (!entry) {
    return {
      originalExerciseId: exercise.id,
      originalExerciseName: exercise.name,
      resolvedKnowledgeId: null,
      resolvedCanonicalName: null,
      knowledgeFound: false,
      prescriptionUnit: null,
      movementFamilies: [],
      trainingPurposes: [],
      skillTransfers: [],
      tissueStressRegions: [],
      weightedStrengthAnchor: false,
      methodCompatibilitySummary: null,
      taxonomyWarnings: [],
      unknownReason: 'Exercise not found in representative B2 seed (full database in MASTER-8C)',
      seedCoverageOnly: true,
    }
  }

  return {
    originalExerciseId: exercise.id,
    originalExerciseName: exercise.name,
    resolvedKnowledgeId: entry.exerciseId,
    resolvedCanonicalName: entry.canonicalName,
    knowledgeFound: true,
    prescriptionUnit: entry.prescriptionUnit,
    movementFamilies: entry.movementFamilies,
    trainingPurposes: entry.trainingPurposes,
    skillTransfers: entry.skillTransfers.map((st) => ({
      skillId: st.skillId,
      transferStrength: st.transferStrength,
    })),
    tissueStressRegions: entry.tissueStressProfile.map((ts) => ts.region),
    weightedStrengthAnchor: entry.weightedStrengthAnchor,
    methodCompatibilitySummary: entry.methodCompatibility
      .filter((mc) => mc.verdict === 'preferred' || mc.verdict === 'allowed')
      .map((mc) => mc.methodId)
      .join(', ') || null,
    taxonomyWarnings: entry.knownTaxonomyWarnings,
    unknownReason: null,
    seedCoverageOnly: true,
  }
}

// =============================================================================
// KNOWLEDGE COVERAGE SUMMARY
// =============================================================================

/**
 * Summarize knowledge coverage for the analyzed program
 * MASTER-8C.1: Added currentProgramCoverageComplete computation
 * MASTER-8C.1.2: Added identity coverage breakdown (full science vs basic identity vs truly unknown)
 */
export function summarizeProgramBalanceKnowledgeCoverage(
  resolutions: readonly ProgramBalanceExerciseResolution[]
): ProgramBalanceKnowledgeCoverageSummary {
  const known = resolutions.filter((r) => r.knowledgeFound)
  const unknown = resolutions.filter((r) => !r.knowledgeFound)

  // MASTER-8C.1.2: Compute identity coverage breakdown
  const exercises = resolutions.map((r) => ({
    id: r.originalExerciseId,
    name: r.originalExerciseName,
  }))
  const identityCoverage = summarizeExerciseIdentityCoverage(exercises)
  const sourceCounts = getExerciseSourceCounts()

  const warnings: string[] = []
  // MASTER-8C.1.2: Only warn about truly unknown exercises (not in any source)
  if (identityCoverage.trulyUnknownCount > 0) {
    warnings.push(
      `${identityCoverage.trulyUnknownCount} exercise(s) not found in any source: ${identityCoverage.trulyUnknownNames.join(', ')}`
    )
  }
  // Warn if many exercises lack full science coverage
  if (identityCoverage.basicIdentityKnownCount > 0) {
    warnings.push(
      `${identityCoverage.basicIdentityKnownCount} exercise(s) found in app pool but lack full science coverage`
    )
  }
  if (unknown.length > known.length) {
    warnings.push('Majority of exercises lack full science coverage - balance analysis has reduced confidence')
  }

  // MASTER-8C.1: Compute current-program coverage (distinct from global DB)
  // MASTER-8C.1.2: Use full science coverage for structural eligibility
  const currentProgramCoverageComplete = identityCoverage.fullScienceCoverageComplete

  return {
    seedIsRepresentativeOnly: true,
    knownExerciseCount: known.length,
    unknownExerciseCount: unknown.length,
    knownExerciseIds: known.map((k) => k.resolvedKnowledgeId!),
    unknownExerciseIds: unknown.map((u) => u.originalExerciseId),
    knownExerciseNames: known.map((k) => k.resolvedCanonicalName!),
    unknownExerciseNames: unknown.map((u) => u.originalExerciseName),
    missingCoverageWarnings: warnings,
    fullDatabaseDeferredTo: 'MASTER_8C',
    mayUnderestimateBalanceIssues: unknown.length > 0,
    mayUnderestimateAnchorSupport: unknown.length > 0,
    mayUnderestimateWarmupCooldownNeeds: unknown.length > 0,
    currentProgramCoverageComplete,
    // MASTER-8C.1.2: Identity coverage breakdown
    fullScienceKnownCount: identityCoverage.fullScienceKnownCount,
    basicIdentityKnownCount: identityCoverage.basicIdentityKnownCount,
    aliasResolvedCount: identityCoverage.aliasResolvedCount,
    trulyUnknownCount: identityCoverage.trulyUnknownCount,
    trulyUnknownIds: identityCoverage.trulyUnknownIds,
    trulyUnknownNames: identityCoverage.trulyUnknownNames,
    fullScienceCoverageComplete: identityCoverage.fullScienceCoverageComplete,
    basicIdentityCoverageComplete: identityCoverage.basicIdentityCoverageComplete,
    sourceCounts: {
      fullScienceSeedTotal: sourceCounts.fullScienceSeedCount,
      adaptivePoolTotal: sourceCounts.adaptivePoolCount,
    },
  }
}

// =============================================================================
// SKILL EXPRESSION ANALYSIS
// =============================================================================

/**
 * Summarize selected skill expression across the program
 */
export function summarizeSelectedSkillExpression(
  selectedSkillIds: readonly string[],
  resolutions: readonly ProgramBalanceExerciseResolution[],
  sessionCount: number
): readonly ProgramBalanceSkillExpression[] {
  const skillKnowledge = getSkillKnowledgeEntries()

  return selectedSkillIds.map((skillId) => {
    const skillEntry = skillKnowledge.find((sk) => sk.skillId === skillId)
    const skillName = skillEntry?.canonicalName ?? skillId

    // Find exercises that transfer to this skill
    const directPrimary: { resolution: ProgramBalanceExerciseResolution; dayIndex: number }[] = []
    const directSecondary: { resolution: ProgramBalanceExerciseResolution; dayIndex: number }[] = []
    const support: { resolution: ProgramBalanceExerciseResolution; dayIndex: number }[] = []
    const maintenance: { resolution: ProgramBalanceExerciseResolution; dayIndex: number }[] = []

    // We need day indexes, but resolutions don't have them directly
    // This is a limitation - we'll work with counts for now
    for (const res of resolutions) {
      const transfer = res.skillTransfers.find((st) => st.skillId === skillId)
      if (transfer) {
        const item = { resolution: res, dayIndex: 0 } // Day index not tracked in resolution
        switch (transfer.transferStrength) {
          case 'direct_primary':
            directPrimary.push(item)
            break
          case 'direct_secondary':
            directSecondary.push(item)
            break
          case 'indirect_support':
            support.push(item)
            break
          case 'maintenance':
            maintenance.push(item)
            break
        }
      }
    }

    // Determine expression status
    let expressionStatus: SkillExpressionStatus
    let severity: ProgramBalanceSeverity
    let rationale: string

    const directCount = directPrimary.length + directSecondary.length
    const supportCount = support.length
    const maintenanceCount = maintenance.length
    const totalCount = directCount + supportCount + maintenanceCount

    if (!skillEntry) {
      expressionStatus = 'unknown'
      severity = 'watch'
      rationale = `Skill "${skillId}" not in B2 seed - cannot assess expression`
    } else if (directPrimary.length >= 2) {
      expressionStatus = 'direct_primary'
      severity = 'none'
      rationale = `Good direct primary exposure (${directPrimary.length} exercises)`
    } else if (directCount >= 2) {
      expressionStatus = 'direct_secondary'
      severity = 'mild'
      rationale = `Has direct exposure but limited primary (${directPrimary.length} primary, ${directSecondary.length} secondary)`
    } else if (supportCount >= 2) {
      expressionStatus = 'support_only'
      severity = 'moderate'
      rationale = `Only support exercises, no direct skill work`
    } else if (totalCount > 0 && directCount === 0) {
      // Has some exposure but no direct work - underexpressed
      expressionStatus = 'underexpressed'
      severity = 'moderate'
      rationale = `Selected skill has insufficient direct exposure (${totalCount} indirect only)`
    } else if (totalCount > 0) {
      expressionStatus = 'maintenance_only'
      severity = 'moderate'
      rationale = `Minimal exposure, maintenance level only`
    } else {
      expressionStatus = 'absent'
      severity = 'high'
      rationale = `Selected skill has no detected exposure in program`
    }

    // Calculate confidence based on knowledge coverage
    const unknownExercises = resolutions.filter((r) => !r.knowledgeFound).length
    const confidence: ProgramBalanceConfidence =
      unknownExercises > resolutions.length / 2 ? 'low' :
      unknownExercises > 0 ? 'moderate' : 'high'

    return {
      skillId,
      skillName,
      expressionStatus,
      directExposureCount: directCount,
      supportExposureCount: supportCount,
      maintenanceExposureCount: maintenanceCount,
      dayIndexes: [], // Would need session tracking
      longestGapDays: sessionCount > 1 ? sessionCount - 1 : 0, // Simplified
      clusteredExposure: directCount > 2 && sessionCount > 3,
      severity,
      rationale,
      recommendedReadOnlyNextStep:
        expressionStatus === 'underexpressed' || expressionStatus === 'absent'
          ? 'Review skill coverage in MASTER-8B.4'
          : null,
      confidence,
      missingKnowledgeCoverage: !skillEntry || unknownExercises > 0,
    }
  })
}

// =============================================================================
// MOVEMENT FAMILY BALANCE
// =============================================================================

/**
 * Summarize movement family balance
 */
export function summarizeMovementFamilyBalance(
  resolutions: readonly ProgramBalanceExerciseResolution[]
): readonly ProgramBalanceMovementFamilySummary[] {
  const familyCounts = new Map<string, number>()
  const knownResolutions = resolutions.filter((r) => r.knowledgeFound)

  for (const res of knownResolutions) {
    for (const family of res.movementFamilies) {
      familyCounts.set(family, (familyCounts.get(family) || 0) + 1)
    }
  }

  // Key families to track
  const keyFamilies = [
    'vertical_pull',
    'horizontal_pull',
    'explosive_pull',
    'straight_arm_pull',
    'vertical_push',
    'horizontal_push',
    'dip_pattern',
    'straight_arm_push',
    'compression_core',
    'anti_extension_core',
  ]

  const pullFamilies = ['vertical_pull', 'horizontal_pull', 'explosive_pull', 'straight_arm_pull']
  const pushFamilies = ['vertical_push', 'horizontal_push', 'dip_pattern', 'straight_arm_push']

  const totalPull = pullFamilies.reduce((sum, f) => sum + (familyCounts.get(f) || 0), 0)
  const totalPush = pushFamilies.reduce((sum, f) => sum + (familyCounts.get(f) || 0), 0)

  const unknownCount = resolutions.filter((r) => !r.knowledgeFound).length
  const confidence: ProgramBalanceConfidence =
    unknownCount > resolutions.length / 2 ? 'low' :
    unknownCount > 0 ? 'moderate' : 'high'

  const summaries: ProgramBalanceMovementFamilySummary[] = []

  for (const family of keyFamilies) {
    const count = familyCounts.get(family) || 0
    let severity: ProgramBalanceSeverity = 'none'
    let rationale = `${count} exposures`

    if (pullFamilies.includes(family) && totalPull > totalPush * 2 && count > 0) {
      severity = 'moderate'
      rationale = `Pull-heavy program (${totalPull} pull vs ${totalPush} push)`
    } else if (pushFamilies.includes(family) && totalPush < totalPull / 2 && count === 0) {
      severity = 'high'
      rationale = `No ${family} exposure in push-deficit program`
    } else if (count === 0 && keyFamilies.includes(family)) {
      severity = 'mild'
      rationale = `No ${family} exposure detected`
    }

    summaries.push({
      family,
      exposureCount: count,
      hardExposureCount: count, // Simplified - would need intensity data
      dayIndexes: [],
      consecutiveDayStreak: 0, // Would need session tracking
      severity,
      rationale,
      confidence,
      missingKnowledgeCoverage: unknownCount > 0,
    })
  }

  return summaries
}

// =============================================================================
// WEIGHTED ANCHOR SUMMARY
// =============================================================================

/**
 * Summarize weighted anchor presence
 */
export function summarizeWeightedAnchors(
  resolutions: readonly ProgramBalanceExerciseResolution[]
): ProgramBalanceWeightedAnchorSummary {
  const weightedPullUp = resolutions.find(
    (r) => r.resolvedKnowledgeId === 'weighted_pull_up' && r.knowledgeFound
  )
  const weightedDip = resolutions.find(
    (r) => r.resolvedKnowledgeId === 'weighted_dip' && r.knowledgeFound
  )

  const weightedPullUpPresent = !!weightedPullUp
  const weightedDipPresent = !!weightedDip

  const unknownCount = resolutions.filter((r) => !r.knowledgeFound).length
  const confidence: ProgramBalanceConfidence =
    unknownCount > resolutions.length / 2 ? 'low' :
    unknownCount > 0 ? 'moderate' : 'high'

  let pullAnchorStatus: AnchorStatus
  let dipAnchorStatus: AnchorStatus
  let severity: ProgramBalanceSeverity = 'none'
  let rationale: string
  let missingReason: string | null = null

  if (weightedPullUpPresent) {
    pullAnchorStatus = 'present'
  } else if (unknownCount > 0) {
    pullAnchorStatus = 'unknown_coverage'
    missingReason = 'Cannot confirm - some exercises not in B2 seed'
  } else {
    pullAnchorStatus = 'missing_caution'
    missingReason = 'Weighted Pull-Up not found in program'
    severity = 'moderate'
  }

  if (weightedDipPresent) {
    dipAnchorStatus = 'present'
  } else if (unknownCount > 0) {
    dipAnchorStatus = 'unknown_coverage'
    if (!missingReason) missingReason = 'Cannot confirm - some exercises not in B2 seed'
  } else {
    dipAnchorStatus = 'missing_caution'
    if (!missingReason) missingReason = 'Weighted Dip not found in program'
    severity = severity === 'moderate' ? 'high' : 'moderate'
  }

  if (weightedPullUpPresent && weightedDipPresent) {
    rationale = 'Both weighted anchors present'
    severity = 'none'
  } else if (weightedPullUpPresent || weightedDipPresent) {
    rationale = `Only ${weightedPullUpPresent ? 'Weighted Pull-Up' : 'Weighted Dip'} present`
  } else if (unknownCount > 0) {
    rationale = 'Anchor presence uncertain due to incomplete knowledge coverage'
    severity = 'watch'
  } else {
    rationale = 'Neither weighted anchor found in program'
  }

  return {
    weightedPullUpPresent,
    weightedDipPresent,
    pullAnchorStatus,
    dipAnchorStatus,
    missingReason,
    severity,
    rationale,
    confidence,
    missingKnowledgeCoverage: unknownCount > 0,
  }
}

// =============================================================================
// TISSUE STRESS SUMMARY
// =============================================================================

/**
 * Summarize tissue stress accumulation
 */
export function summarizeTissueStress(
  resolutions: readonly ProgramBalanceExerciseResolution[]
): readonly ProgramBalanceTissueStressSummary[] {
  const regionCounts = new Map<string, number>()
  const knownResolutions = resolutions.filter((r) => r.knowledgeFound)

  for (const res of knownResolutions) {
    for (const region of res.tissueStressRegions) {
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1)
    }
  }

  const criticalRegions = [
    'elbow',
    'biceps_tendon',
    'wrist',
    'shoulder_anterior',
    'shoulder_general',
    'forearm_grip',
  ]

  const unknownCount = resolutions.filter((r) => !r.knowledgeFound).length
  const confidence: ProgramBalanceConfidence =
    unknownCount > resolutions.length / 2 ? 'low' :
    unknownCount > 0 ? 'moderate' : 'high'

  const summaries: ProgramBalanceTissueStressSummary[] = []

  for (const region of criticalRegions) {
    const count = regionCounts.get(region) || 0
    let severity: ProgramBalanceSeverity = 'none'
    let rationale = `${count} exposures`
    let safeguardNeed: string | null = null

    if (count >= 6) {
      severity = 'high'
      rationale = `High ${region} stress accumulation (${count} exposures)`
      safeguardNeed = `Consider ${region} recovery protocol`
    } else if (count >= 4) {
      severity = 'moderate'
      rationale = `Moderate ${region} stress (${count} exposures)`
      safeguardNeed = `Monitor ${region} fatigue`
    } else if (count >= 2) {
      severity = 'mild'
      rationale = `Some ${region} stress (${count} exposures)`
    }

    summaries.push({
      region,
      exposureCount: count,
      highStressExposureCount: count > 3 ? count - 3 : 0,
      consecutiveExposureDays: 0, // Would need session tracking
      severity,
      rationale,
      futureSafeguardNeed: safeguardNeed,
      confidence,
      missingKnowledgeCoverage: unknownCount > 0,
    })
  }

  return summaries
}

// =============================================================================
// BUILD FINDINGS
// =============================================================================

let findingCounter = 0

/**
 * Build balance findings from analysis results
 */
export function buildProgramBalanceFindings(
  skillExpression: readonly ProgramBalanceSkillExpression[],
  movementFamilySummary: readonly ProgramBalanceMovementFamilySummary[],
  weightedAnchorSummary: ProgramBalanceWeightedAnchorSummary,
  tissueStressSummary: readonly ProgramBalanceTissueStressSummary[],
  knowledgeCoverage: ProgramBalanceKnowledgeCoverageSummary
): readonly ProgramBalanceFinding[] {
  const findings: ProgramBalanceFinding[] = []

  // Skill expression findings
  for (const skill of skillExpression) {
    if (skill.expressionStatus === 'underexpressed' || skill.expressionStatus === 'absent') {
      findings.push({
        id: `finding_${++findingCounter}`,
        type: skill.expressionStatus === 'absent' ? 'selected_skill_absent' : 'selected_skill_underexpressed',
        severity: skill.severity,
        title: `${skill.skillName} ${skill.expressionStatus === 'absent' ? 'Absent' : 'Underexpressed'}`,
        summary: skill.rationale,
        affectedSkillIds: [skill.skillId],
        affectedExerciseIds: [],
        affectedDayIndexes: skill.dayIndexes,
        evidence: [skill.rationale],
        missingData: skill.missingKnowledgeCoverage ? ['Incomplete knowledge coverage'] : [],
        readOnlyRecommendation: skill.recommendedReadOnlyNextStep,
        futureMutationCandidate: true,
        futureMutationType: 'skill_frequency_adjustment',
        mutationAllowedNow: false,
        confidence: skill.confidence,
        seedCoverageLimited: skill.missingKnowledgeCoverage,
      })
    } else if (skill.expressionStatus === 'unknown') {
      findings.push({
        id: `finding_${++findingCounter}`,
        type: 'selected_skill_unknown',
        severity: 'watch',
        title: `${skill.skillName} Expression Unknown`,
        summary: `Cannot assess skill expression - not in B2 knowledge seed`,
        affectedSkillIds: [skill.skillId],
        affectedExerciseIds: [],
        affectedDayIndexes: [],
        evidence: ['Skill not in full science seed'],
        missingData: ['Full knowledge base deferred to MASTER-8C'],
        readOnlyRecommendation: 'Will be assessable after MASTER-8C knowledge expansion',
        futureMutationCandidate: false,
        futureMutationType: 'none',
        mutationAllowedNow: false,
        confidence: 'low',
        seedCoverageLimited: true,
      })
    }
  }

  // Movement family findings - check for pull dominance / push underrepresentation
  const pullFamilies = movementFamilySummary.filter((m) =>
    ['vertical_pull', 'horizontal_pull', 'explosive_pull', 'straight_arm_pull'].includes(m.family)
  )
  const pushFamilies = movementFamilySummary.filter((m) =>
    ['vertical_push', 'horizontal_push', 'dip_pattern', 'straight_arm_push'].includes(m.family)
  )

  const totalPull = pullFamilies.reduce((sum, f) => sum + f.exposureCount, 0)
  const totalPush = pushFamilies.reduce((sum, f) => sum + f.exposureCount, 0)

  if (totalPull > totalPush * 2 && totalPull > 4) {
    findings.push({
      id: `finding_${++findingCounter}`,
      type: 'pull_dominance',
      severity: 'moderate',
      title: 'Pull Dominance Detected',
      summary: `Program is pull-heavy: ${totalPull} pull exposures vs ${totalPush} push exposures`,
      affectedSkillIds: [],
      affectedExerciseIds: [],
      affectedDayIndexes: [],
      evidence: [`Pull: ${totalPull}`, `Push: ${totalPush}`],
      missingData: knowledgeCoverage.unknownExerciseCount > 0 ? ['Some exercises unknown'] : [],
      readOnlyRecommendation: 'Consider push-side balance in future sessions',
      futureMutationCandidate: true,
      futureMutationType: 'movement_family_rebalance',
      mutationAllowedNow: false,
      confidence: knowledgeCoverage.unknownExerciseCount > 0 ? 'moderate' : 'high',
      seedCoverageLimited: knowledgeCoverage.unknownExerciseCount > 0,
    })
  }

  if (totalPush < 2 && totalPull >= 4) {
    findings.push({
      id: `finding_${++findingCounter}`,
      type: 'push_underrepresentation',
      severity: 'high',
      title: 'Push Underrepresentation',
      summary: `Very limited push exposure (${totalPush}) compared to pull (${totalPull})`,
      affectedSkillIds: [],
      affectedExerciseIds: [],
      affectedDayIndexes: [],
      evidence: [`Push: ${totalPush}`, `Pull: ${totalPull}`],
      missingData: knowledgeCoverage.unknownExerciseCount > 0 ? ['Some exercises unknown'] : [],
      readOnlyRecommendation: 'Push-side exercises needed for balance',
      futureMutationCandidate: true,
      futureMutationType: 'movement_family_rebalance',
      mutationAllowedNow: false,
      confidence: knowledgeCoverage.unknownExerciseCount > 0 ? 'moderate' : 'high',
      seedCoverageLimited: knowledgeCoverage.unknownExerciseCount > 0,
    })
  }

  // Weighted anchor findings
  if (weightedAnchorSummary.severity !== 'none' && !weightedAnchorSummary.weightedPullUpPresent) {
    findings.push({
      id: `finding_${++findingCounter}`,
      type: 'weighted_pull_anchor_missing',
      severity: weightedAnchorSummary.severity,
      title: 'Weighted Pull-Up Anchor Missing',
      summary: weightedAnchorSummary.rationale,
      affectedSkillIds: [],
      affectedExerciseIds: [],
      affectedDayIndexes: [],
      evidence: [weightedAnchorSummary.rationale],
      missingData: weightedAnchorSummary.missingKnowledgeCoverage ? ['Incomplete coverage'] : [],
      readOnlyRecommendation: 'Review weighted pull-up inclusion',
      futureMutationCandidate: true,
      futureMutationType: 'weighted_anchor_restore',
      mutationAllowedNow: false,
      confidence: weightedAnchorSummary.confidence,
      seedCoverageLimited: weightedAnchorSummary.missingKnowledgeCoverage,
    })
  }

  if (weightedAnchorSummary.severity !== 'none' && !weightedAnchorSummary.weightedDipPresent) {
    findings.push({
      id: `finding_${++findingCounter}`,
      type: 'weighted_dip_anchor_missing',
      severity: weightedAnchorSummary.severity,
      title: 'Weighted Dip Anchor Missing',
      summary: weightedAnchorSummary.rationale,
      affectedSkillIds: [],
      affectedExerciseIds: [],
      affectedDayIndexes: [],
      evidence: [weightedAnchorSummary.rationale],
      missingData: weightedAnchorSummary.missingKnowledgeCoverage ? ['Incomplete coverage'] : [],
      readOnlyRecommendation: 'Review weighted dip inclusion',
      futureMutationCandidate: true,
      futureMutationType: 'weighted_anchor_restore',
      mutationAllowedNow: false,
      confidence: weightedAnchorSummary.confidence,
      seedCoverageLimited: weightedAnchorSummary.missingKnowledgeCoverage,
    })
  }

  // Tissue stress findings
  for (const tissue of tissueStressSummary) {
    if (tissue.severity === 'high' || tissue.severity === 'moderate') {
      const findingType =
        tissue.region === 'elbow' || tissue.region === 'biceps_tendon'
          ? 'high_elbow_biceps_tendon_accumulation'
          : tissue.region === 'wrist'
            ? 'high_wrist_extension_accumulation'
            : tissue.region.includes('shoulder')
              ? 'high_anterior_shoulder_accumulation'
              : 'high_grip_forearm_accumulation'

      findings.push({
        id: `finding_${++findingCounter}`,
        type: findingType,
        severity: tissue.severity,
        title: `${tissue.region.replace('_', ' ')} Stress Accumulation`,
        summary: tissue.rationale,
        affectedSkillIds: [],
        affectedExerciseIds: [],
        affectedDayIndexes: [],
        evidence: [tissue.rationale],
        missingData: tissue.missingKnowledgeCoverage ? ['Tissue stress may be underestimated'] : [],
        readOnlyRecommendation: tissue.futureSafeguardNeed,
        futureMutationCandidate: true,
        futureMutationType: 'volume_adjustment',
        mutationAllowedNow: false,
        confidence: tissue.confidence,
        seedCoverageLimited: tissue.missingKnowledgeCoverage,
      })
    }
  }

  // Knowledge coverage gap finding
  if (knowledgeCoverage.unknownExerciseCount > 0) {
    findings.push({
      id: `finding_${++findingCounter}`,
      type: 'knowledge_coverage_gap',
      severity: knowledgeCoverage.unknownExerciseCount > knowledgeCoverage.knownExerciseCount ? 'moderate' : 'watch',
      title: 'Knowledge Coverage Gap',
      summary: `${knowledgeCoverage.unknownExerciseCount} exercise(s) lack full Program Balance science coverage`,
      affectedSkillIds: [],
      affectedExerciseIds: knowledgeCoverage.unknownExerciseIds.slice(),
      affectedDayIndexes: [],
      evidence: knowledgeCoverage.missingCoverageWarnings.slice(),
      missingData: ['Full database expansion in MASTER-8C'],
      readOnlyRecommendation: 'Balance analysis confidence limited until MASTER-8C',
      futureMutationCandidate: false,
      futureMutationType: 'none',
      mutationAllowedNow: false,
      confidence: 'low',
      seedCoverageLimited: true,
    })
  }

  return findings
}

// =============================================================================
// MAIN ANALYZER
// =============================================================================

/**
 * Analyze program balance (read-only)
 */
export function analyzeProgramBalanceReadOnly(
  input: ProgramBalanceBranchInput
): ProgramBalanceReadOnlyResult {
  // Validate input
  if (!input.sessions || input.sessions.length === 0) {
    return getProgramBalanceReadOnlyUnavailable('No sessions provided')
  }

  if (!input.selectedSkillIds || input.selectedSkillIds.length === 0) {
    return getProgramBalanceReadOnlyUnavailable('No selected skills provided')
  }

  // Collect all exercises
  const allExercises: ProgramBalanceExerciseInput[] = []
  for (const session of input.sessions) {
    for (const exercise of session.exercises) {
      allExercises.push(exercise)
    }
  }

  if (allExercises.length === 0) {
    return getProgramBalanceReadOnlyUnavailable('No exercises found in sessions')
  }

  // Resolve exercises against knowledge seed
  const resolutions = allExercises.map((ex) => resolveProgramBalanceExercise(ex))

  // Build summaries
  const knowledgeCoverage = summarizeProgramBalanceKnowledgeCoverage(resolutions)
  const skillExpression = summarizeSelectedSkillExpression(
    input.selectedSkillIds,
    resolutions,
    input.sessions.length
  )
  const movementFamilySummary = summarizeMovementFamilyBalance(resolutions)
  const weightedAnchorSummary = summarizeWeightedAnchors(resolutions)
  const tissueStressSummary = summarizeTissueStress(resolutions)

  // Build findings
  const findings = buildProgramBalanceFindings(
    skillExpression,
    movementFamilySummary,
    weightedAnchorSummary,
    tissueStressSummary,
    knowledgeCoverage
  )

  // Build future session candidates from high-severity findings
  // MASTER-8B.6: Now includes detailed planning information
  const planningContext: FuturePlanningContext = {
    skillExpression,
    movementFamilySummary,
    weightedAnchorSummary,
    tissueStressSummary,
    knowledgeCoverage,
    sessionCount: input.sessions.length,
    completedDayIndexes: input.sessions
      .filter(s => s.completed)
      .map(s => s.dayIndex),
  }
  
  const futureSessionCandidates: FutureSessionCandidate[] = findings
    .filter((f) => f.futureMutationCandidate && (f.severity === 'high' || f.severity === 'moderate'))
    .map((f) => ({
      candidateType: f.futureMutationType,
      targetDayIndexes: f.affectedDayIndexes.slice(),
      rationale: f.summary,
      priority: f.severity,
      confidence: f.confidence,
      requiresFullKnowledgeBase: f.seedCoverageLimited,
      planningDetail: buildFutureSessionPlanningDetail(f, f.futureMutationType, planningContext),
    }))

  // Determine result status
  const status =
    knowledgeCoverage.unknownExerciseCount > knowledgeCoverage.knownExerciseCount
      ? 'partial'
      : 'ready'

  // Build missing data - MASTER-8C.1: Distinguish current program vs global DB
  const missingData: string[] = []
  if (knowledgeCoverage.unknownExerciseCount > 0) {
    missingData.push(`${knowledgeCoverage.unknownExerciseCount} exercises not in knowledge seed`)
  }
  if (!input.existingMethodSummary) {
    missingData.push('Method summary not provided')
  }
  if (!input.adaptiveFoundationSummary) {
    missingData.push('Adaptive Foundation analyzer input not linked (tile may exist separately)')
  }
  if (!input.recoveryReadinessSummary) {
    missingData.push('Recovery/readiness summary not provided')
  }

  // Build proof - MASTER-8C.1: Added currentProgramKnowledgeCoverageComplete
  const proof: ProgramBalanceProof = {
    consumedKnowledgeSeed: true,
    consumedRepresentativeSeedOnly: true,
    fullKnowledgeBaseComplete: false,
    fullKnowledgeBaseDeferredTo: 'MASTER_8C',
    currentProgramKnowledgeCoverageComplete: knowledgeCoverage.currentProgramCoverageComplete,
    consumedSelectedSkills: true,
    consumedProgramSessions: true,
    consumedCompletionState: input.sessions.some((s) => s.completed !== undefined),
    consumedMethodSummary: !!input.existingMethodSummary,
    consumedAdaptiveFoundation: !!input.adaptiveFoundationSummary,
    noMutationPerformed: true,
    noGeneratorChange: true,
    safeForUiReadOnlyConsumption: true,
  }

  return {
    status,
    mutationAllowedNow: false,
    sourceStep: 'MASTER_8B_6',
    analyzedSessionCount: input.sessions.length,
    analyzedExerciseCount: allExercises.length,
    knowledgeMatchedExerciseCount: knowledgeCoverage.knownExerciseCount,
    knowledgeMissingExerciseCount: knowledgeCoverage.unknownExerciseCount,
    selectedSkillCount: input.selectedSkillIds.length,
    knowledgeCoverageSummary: knowledgeCoverage,
    findings,
    skillExpression,
    movementFamilySummary,
    weightedAnchorSummary,
    tissueStressSummary,
    futureSessionCandidates,
    missingData,
    proof,
    nextAllowedStep: 'MASTER_8B_7',
  }
}
