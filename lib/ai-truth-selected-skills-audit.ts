/**
 * AI-TRUTH-BREADTH-AUDIT: End-to-end selected skills trace utility
 * 
 * Phase 3: Proves exactly where selectedSkills breadth is lost in the pipeline.
 * This audit does NOT modify any data - it only traces and reports.
 */

export interface SkillBreadthAuditLayer {
  label: string
  skills: string[]
  count: number
  hasPrimary: boolean
  hasSecondary: boolean
  tertiaryPlusCount: number
  previousLayerSkills?: string[]
  skillsLostFromPrevious: string[]
  source: string
}

export type BreadthLossVerdict =
  | 'BREADTH_TRUTH_CLEAN'
  | 'ONBOARDING_TO_CANONICAL_LOSS'
  | 'CANONICAL_TO_BUILDER_LOSS'
  | 'BUILDER_TO_MATERIALITY_LOSS'
  | 'MATERIALITY_TO_INTENT_LOSS'
  | 'INTENT_TO_ALLOCATION_LOSS'
  | 'ALLOCATION_TO_SAVED_PROGRAM_LOSS'
  | 'SAVED_PROGRAM_TO_RENDER_LOSS'
  | 'PROFILE_ONLY_HAS_TWO_SKILLS'
  | 'UNKNOWN_REQUIRES_MANUAL_REVIEW'

export interface SkillBreadthAuditReport {
  layers: SkillBreadthAuditLayer[]
  firstLossPoint: string | null
  firstLossPointSkillsLost: string[]
  finalVerdict: BreadthLossVerdict
  profileTrulyHasOnlyTwoSkills: boolean
  sixSessionLogicTouched: boolean
  timestamp: string
}

/**
 * Log a single audit layer with the standard diagnostic prefix
 */
export function logBreadthAuditLayer(
  layerLabel: string,
  skills: string[],
  primaryGoal: string | null,
  secondaryGoal: string | null,
  previousLayerSkills?: string[],
  source?: string
): SkillBreadthAuditLayer {
  const skillSet = new Set(skills)
  const prevSet = previousLayerSkills ? new Set(previousLayerSkills) : null
  const lostSkills = prevSet 
    ? previousLayerSkills!.filter(s => !skillSet.has(s))
    : []
  
  const layer: SkillBreadthAuditLayer = {
    label: layerLabel,
    skills: [...skills],
    count: skills.length,
    hasPrimary: primaryGoal ? skillSet.has(primaryGoal) : false,
    hasSecondary: secondaryGoal ? skillSet.has(secondaryGoal) : false,
    tertiaryPlusCount: skills.filter(s => s !== primaryGoal && s !== secondaryGoal).length,
    previousLayerSkills: previousLayerSkills ? [...previousLayerSkills] : undefined,
    skillsLostFromPrevious: lostSkills,
    source: source || 'unknown',
  }
  
  // Log with diagnostic prefix
  console.log(`[AI-TRUTH-BREADTH-AUDIT:${layerLabel.toUpperCase().replace(/ /g, '_')}]`, {
    skills: layer.skills,
    count: layer.count,
    hasPrimary: layer.hasPrimary,
    hasSecondary: layer.hasSecondary,
    tertiaryPlusCount: layer.tertiaryPlusCount,
    skillsLostFromPrevious: layer.skillsLostFromPrevious,
    lossDetected: layer.skillsLostFromPrevious.length > 0,
    source: layer.source,
  })
  
  return layer
}

/**
 * Determine the final verdict based on all layers
 */
export function determineBreadthVerdict(layers: SkillBreadthAuditLayer[]): {
  verdict: BreadthLossVerdict
  firstLossPoint: string | null
  firstLossPointSkillsLost: string[]
  profileTrulyHasOnlyTwoSkills: boolean
} {
  // Find the first layer where skills were lost
  let firstLossPoint: string | null = null
  let firstLossPointSkillsLost: string[] = []
  
  for (const layer of layers) {
    if (layer.skillsLostFromPrevious.length > 0) {
      firstLossPoint = layer.label
      firstLossPointSkillsLost = layer.skillsLostFromPrevious
      break
    }
  }
  
  // Check if the profile truly only has 2 skills from the start
  const onboardingLayer = layers.find(l => l.label.toLowerCase().includes('onboarding'))
  const canonicalLayer = layers.find(l => l.label.toLowerCase().includes('canonical'))
  const sourceLayer = onboardingLayer || canonicalLayer || layers[0]
  
  const profileTrulyHasOnlyTwoSkills = sourceLayer ? sourceLayer.count <= 2 : false
  
  // Determine verdict
  let verdict: BreadthLossVerdict = 'BREADTH_TRUTH_CLEAN'
  
  if (profileTrulyHasOnlyTwoSkills && !firstLossPoint) {
    verdict = 'PROFILE_ONLY_HAS_TWO_SKILLS'
  } else if (!firstLossPoint) {
    verdict = 'BREADTH_TRUTH_CLEAN'
  } else {
    // Map loss point to verdict
    const lossLabel = firstLossPoint.toLowerCase()
    if (lossLabel.includes('canonical')) {
      verdict = 'ONBOARDING_TO_CANONICAL_LOSS'
    } else if (lossLabel.includes('builder') && lossLabel.includes('entry')) {
      verdict = 'CANONICAL_TO_BUILDER_LOSS'
    } else if (lossLabel.includes('materiality')) {
      verdict = 'BUILDER_TO_MATERIALITY_LOSS'
    } else if (lossLabel.includes('intent')) {
      verdict = 'MATERIALITY_TO_INTENT_LOSS'
    } else if (lossLabel.includes('allocation')) {
      verdict = 'INTENT_TO_ALLOCATION_LOSS'
    } else if (lossLabel.includes('saved') || lossLabel.includes('program')) {
      verdict = 'ALLOCATION_TO_SAVED_PROGRAM_LOSS'
    } else if (lossLabel.includes('render') || lossLabel.includes('page')) {
      verdict = 'SAVED_PROGRAM_TO_RENDER_LOSS'
    } else {
      verdict = 'UNKNOWN_REQUIRES_MANUAL_REVIEW'
    }
  }
  
  return {
    verdict,
    firstLossPoint,
    firstLossPointSkillsLost,
    profileTrulyHasOnlyTwoSkills,
  }
}

/**
 * Build the final audit report with all layers
 */
export function buildBreadthAuditReport(layers: SkillBreadthAuditLayer[]): SkillBreadthAuditReport {
  const verdictResult = determineBreadthVerdict(layers)
  
  const report: SkillBreadthAuditReport = {
    layers,
    firstLossPoint: verdictResult.firstLossPoint,
    firstLossPointSkillsLost: verdictResult.firstLossPointSkillsLost,
    finalVerdict: verdictResult.verdict,
    profileTrulyHasOnlyTwoSkills: verdictResult.profileTrulyHasOnlyTwoSkills,
    sixSessionLogicTouched: false, // This audit does not touch 6-session logic
    timestamp: new Date().toISOString(),
  }
  
  // Log final verdict
  console.log('[AI-TRUTH-BREADTH-FINAL-VERDICT]', {
    verdict: report.finalVerdict,
    firstLossPoint: report.firstLossPoint,
    firstLossPointSkillsLost: report.firstLossPointSkillsLost,
    profileTrulyHasOnlyTwoSkills: report.profileTrulyHasOnlyTwoSkills,
    totalLayersAudited: layers.length,
    layerSummary: layers.map(l => ({
      layer: l.label,
      count: l.count,
      lossCount: l.skillsLostFromPrevious.length,
    })),
  })
  
  return report
}

/**
 * Run a quick breadth check without full layer tracking
 * Useful for inline diagnostics
 */
export function quickBreadthCheck(
  sourceSkills: string[],
  targetSkills: string[],
  sourceLabel: string,
  targetLabel: string
): {
  hasLoss: boolean
  lostSkills: string[]
  sourceCount: number
  targetCount: number
} {
  const sourceSet = new Set(sourceSkills)
  const targetSet = new Set(targetSkills)
  const lostSkills = sourceSkills.filter(s => !targetSet.has(s))
  
  const result = {
    hasLoss: lostSkills.length > 0,
    lostSkills,
    sourceCount: sourceSkills.length,
    targetCount: targetSkills.length,
  }
  
  if (result.hasLoss) {
    console.log('[AI-TRUTH-BREADTH-QUICK-CHECK]', {
      source: sourceLabel,
      target: targetLabel,
      lossDetected: true,
      lostSkills,
      sourceCount: result.sourceCount,
      targetCount: result.targetCount,
    })
  }
  
  return result
}

/**
 * Assert that no skills are lost between layers
 * Throws detailed error if skills are lost (for development debugging)
 */
export function assertNoBreadthLoss(
  sourceSkills: string[],
  targetSkills: string[],
  sourceLabel: string,
  targetLabel: string,
  options?: { throwOnLoss?: boolean }
): boolean {
  const check = quickBreadthCheck(sourceSkills, targetSkills, sourceLabel, targetLabel)
  
  if (check.hasLoss && options?.throwOnLoss) {
    throw new Error(
      `[AI-TRUTH-BREADTH] Skills lost between ${sourceLabel} and ${targetLabel}: ` +
      `${check.lostSkills.join(', ')} (${check.sourceCount} → ${check.targetCount})`
    )
  }
  
  return !check.hasLoss
}

/**
 * Classify skill coverage from an authoritative contract
 */
export function classifySkillCoverage(
  selectedSkills: string[],
  materiallyExpressed: string[],
  supportSkills: string[],
  deferredSkills: Array<{ skill: string; reason: string }>,
  primaryGoal: string | null,
  secondaryGoal: string | null
): {
  directlyExpressed: string[]
  supportExpressed: string[]
  deferredWithReason: Array<{ skill: string; reason: string }>
  vanishedSkills: string[]
  coveragePolicy: 'full' | 'partial' | 'minimal'
} {
  const expressedSet = new Set(materiallyExpressed)
  const supportSet = new Set(supportSkills)
  const deferredSet = new Set(deferredSkills.map(d => d.skill))
  
  const directlyExpressed: string[] = []
  const supportExpressed: string[] = []
  const deferredWithReason: Array<{ skill: string; reason: string }> = []
  const vanishedSkills: string[] = []
  
  for (const skill of selectedSkills) {
    if (expressedSet.has(skill) && !supportSet.has(skill)) {
      directlyExpressed.push(skill)
    } else if (supportSet.has(skill)) {
      supportExpressed.push(skill)
    } else if (deferredSet.has(skill)) {
      const deferred = deferredSkills.find(d => d.skill === skill)
      deferredWithReason.push({ skill, reason: deferred?.reason || 'unknown' })
    } else {
      vanishedSkills.push(skill)
    }
  }
  
  // Determine coverage policy
  const totalSelected = selectedSkills.length
  const totalCovered = directlyExpressed.length + supportExpressed.length + deferredWithReason.length
  const coverageRatio = totalSelected > 0 ? totalCovered / totalSelected : 1
  
  let coveragePolicy: 'full' | 'partial' | 'minimal' = 'minimal'
  if (coverageRatio >= 1) {
    coveragePolicy = 'full'
  } else if (coverageRatio >= 0.5) {
    coveragePolicy = 'partial'
  }
  
  console.log('[AI-TRUTH-BREADTH-COVERAGE-CLASSIFICATION]', {
    totalSelected,
    directlyExpressedCount: directlyExpressed.length,
    supportExpressedCount: supportExpressed.length,
    deferredCount: deferredWithReason.length,
    vanishedCount: vanishedSkills.length,
    coverageRatio: coverageRatio.toFixed(2),
    coveragePolicy,
    vanishedSkills,
  })
  
  return {
    directlyExpressed,
    supportExpressed,
    deferredWithReason,
    vanishedSkills,
    coveragePolicy,
  }
}

/**
 * No-breakage verdict for 6-session logic
 */
export function logNoBreakageVerdict(
  sixSessionLogicTouched: boolean,
  currentWorkingProgressionsTouched: boolean,
  restartModifyRebuildTouched: boolean,
  programGenerationSucceeds: boolean
): void {
  console.log('[AI-TRUTH-BREADTH-NO-BREAKAGE-VERDICT]', {
    sixSessionLogicUntouched: !sixSessionLogicTouched,
    currentWorkingProgressionsUntouched: !currentWorkingProgressionsTouched,
    restartModifyRebuildUntouched: !restartModifyRebuildTouched,
    programGenerationStillSucceeds: programGenerationSucceeds,
    finalVerdict: (
      !sixSessionLogicTouched &&
      !currentWorkingProgressionsTouched &&
      !restartModifyRebuildTouched &&
      programGenerationSucceeds
    ) ? 'ALL_STABLE' : 'BREAKAGE_DETECTED',
  })
}
