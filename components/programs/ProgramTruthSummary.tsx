'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getSafeSkillTrace } from '@/lib/safe-access'

/**
 * PROGRAM TRUTH SUMMARY COMPONENT
 * 
 * Displays a clean, expandable summary of why the program looks the way it does.
 * This surfaces the AI decision-making process in a user-friendly way.
 */

interface MethodApplicationSummary {
  actuallyApplied: string[]
  perSessionMethods: Array<{
    dayNumber: number
    dayFocus: string
    appliedMethods: string[]
    hasSuperset: boolean
    hasCircuit: boolean
    hasDensity: boolean
    structureDescription: string
  }>
  sessionsWithSupersets: number
  sessionsWithCircuits: number
  sessionsWithDensity: number
  sessionsWithOnlyStraightSets: number
  expressionSummary: string
}

interface MethodMaterialityReport {
  userSelectedMethods: string[]
  appliedMethods: string[]
  selectedButNotApplied: string[]
  nonApplicationReasons: Array<{
    method: string
    reason: string
  }>
  verdict: 'FULLY_EXPRESSED' | 'MOSTLY_EXPRESSED' | 'LIGHTLY_EXPRESSED' | 'NOT_EXPRESSED' | 'NO_PREFERENCES'
  explanationForUser: string
}

// [PHASE 2 MULTI-SKILL] Broader skill coverage contract types
interface SkillCoverageEntry {
  skill: string
  priorityLevel: 'primary' | 'secondary' | 'tertiary' | 'support'
  targetExposure: number
  allocatedSessions: number
  materiallyExpressedSessions: number
  coverageStatus: 'fully_represented' | 'broadly_represented' | 'support_only' | 'deferred'
  deferralReason: string | null
}

interface BroaderSkillCoverageContract {
  entries: SkillCoverageEntry[]
  coverageVerdict: 'strong' | 'adequate' | 'weak'
  representedSkills: string[]
  deferredSkills: Array<{ skill: string; reason: string }>
  supportOnlySkills: string[]
  // [PHASE 2 MULTI-SKILL] New fields from allocation contract
  supportExpressedSkills?: string[]
  supportRotationalSkills?: string[]
}

interface TruthExplanation {
  identityPrimary: string | null
  identitySecondary: string | null
  identityLabel: string
  selectedSkillsUsed: string[]
  representedSkillsInWeek: string[]
  underexpressedSkills: string[]
  // [PHASE 2 MULTI-SKILL] Broader skill coverage contract
  broaderSkillCoverage?: BroaderSkillCoverageContract | null
  scheduleModeUsed: 'static' | 'flexible'
  baselineSessions: number
  currentSessions: number
  frequencyWasAdapted: boolean
  frequencyAdaptationReason: string | null
  durationModeUsed: 'static' | 'adaptive'
  durationTargetUsed: number
  experienceLevelUsed: string
  equipmentUsed: string[]
  weightedLoadingUsed: boolean
  flexibilityGoalsUsed: string[]
  flexibilityIntegrated: boolean
  trainingPathUsed: string | null
  goalCategoriesUsed: string[]
  trainingMethodsUsed: string[]
  sessionStyleUsed: string | null
  // [PHASE 2] Method preferences materiality
  methodPreferencesApplied?: MethodApplicationSummary
  methodPreferencesMateriality?: MethodMaterialityReport
  jointCautionsConsidered: string[]
  weakPointAddressed: string | null
  limiterAddressed: string | null
  recoveryLevelUsed: string | null
  explanationFactors: Array<{
    factor: string
    label: string
    wasUsed: boolean
    isVisible: boolean
    importance: 'high' | 'medium' | 'low'
  }>
  hiddenTruthNotSurfaced: string[]
  truthfulSummary: string
  explanationQualityVerdict: string
  generatedAt?: string
  triggerSource?: string
  // [CURRENT-PROGRESSION-TRUTH-CONTRACT] Current working progressions vs historical ceiling
  currentWorkingProgressions?: {
    planche: {
      currentWorkingProgression: string | null
      historicalCeiling: string | null
      truthSource: string
      truthNote: string | null
      isConservative: boolean
    }
    frontLever: {
      currentWorkingProgression: string | null
      historicalCeiling: string | null
      truthSource: string
      truthNote: string | null
      isConservative: boolean
    }
    hspu: {
      currentWorkingProgression: string | null
      historicalCeiling: string | null
      truthSource: string
      truthNote: string | null
      isConservative: boolean
    }
    anyConservativeStart: boolean
    anyHistoricalCeiling: boolean
  } | null
  progressionTruthNote?: string | null
  // [DOCTRINE RUNTIME CONTRACT] Doctrine influence data
  doctrineInfluence?: {
    available: boolean
    source: 'db_live' | 'fallback_none'
    influenceLevel: 'none' | 'minimal' | 'moderate' | 'strong'
    headlineReasons: string[]
    userVisibleSummary: string[]
    methodsInfluenced: boolean
    progressionInfluenced: boolean
    prescriptionInfluenced: boolean
  } | null
  // [SESSION ARCHITECTURE TRUTH] Architecture and materiality truth
  sessionArchitectureTruth?: {
    sourceVerdict: 'FULL_TRUTH_AVAILABLE' | 'PARTIAL_TRUTH_AVAILABLE' | 'MINIMAL_TRUTH_FALLBACK'
    complexity: 'low' | 'moderate' | 'high'
    primarySpineSkills: string[]
    secondaryAnchorSkills: string[]
    supportRotationSkills: string[]
    deferredSkills: Array<{ skill: string; reason: string; details: string }>
    currentWorkingCapsCount: number
    historicalCeilingBlockedCount: number
    weeklyMaterialityVerdict: 'TOO_CLOSE_TO_FOUNDATIONAL_DEFAULT' | 'ACCEPTABLY_DIFFERENT' | 'STRONGLY_PERSONALIZED'
    doctrineArchitectureBias: {
      sessionRoleBias: string
      supportAllocationBias: string
      methodPackagingBias: string
    }
    // [PHASE 1 AI-TRUTH-ESCALATION] Additional architecture truth fields
    flexibilityIntegration?: {
      hasFlexibilityGoals: boolean
      integrationMode: 'dedicated_block' | 'warmup_integrated' | 'cooldown_integrated' | 'none'
      flexibilityTimeReserved: number
    }
    methodPackaging?: {
      preferredMethods: string[]
      actualMethodsApplied: string[]
      packagingDecision: string
      rationale: string
    }
    visibleDifferenceScore?: number
    templateEscapeRequired?: boolean
  } | null
  // [SESSION-ARCHITECTURE-MATERIALIZATION] Skill materialization verdict
  // [MATERIALIZATION-TRUTH-SOURCE-FIX] Now includes normalized expression buckets
  materializationVerdict?: {
    verdict: 'PASS' | 'WARN' | 'FAIL'
    issues: string[]
    skillCoverage: {
      selected: number
      expressed: number
      dropped: string[]
    }
    // Normalized expression buckets from authoritative truth
    normalizedExpression?: {
      directlyExpressed?: string[]
      technicallyExpressed?: string[]
      supportExpressed?: string[]
      carryoverOnly?: string[]
      deferredSkills?: string[]
      trulyDropped?: string[]
      truthSourceUsed?: 'visibleWeekAudit' | 'authoritativeIntent' | 'sessionArchitecture' | 'legacyFallback'
    }
    exerciseClassification: {
      total: number
      genericFallback: number
      doctrineDriven: number
      genericRatio: number
    }
    consistencyCheck?: {
      contradictionDetected: boolean
      visibleAuditSkillCount: number
      visiblyExpressedCount: number
    }
  } | null
  // [CHECKLIST 1 OF 5] Authoritative Multi-Skill Intent Contract
  authoritativeMultiSkillIntentContract?: {
    selectedSkills: string[]
    primarySkill: string | null
    secondarySkill: string | null
    supportSkills: string[]
    deferredSkills: Array<{
      skill: string
      reasonCode: string
      reasonLabel: string
      details?: string
    }>
    materiallyExpressedSkills: string[]
    reducedThisCycleSkills: string[]
    skillPriorityOrder: Array<{
      skill: string
      role: 'primary' | 'secondary' | 'tertiary' | 'support' | 'deferred'
      priorityScore: number
      exposureSessions: number
      currentWorkingProgression?: string | null
      historicalCeiling?: string | null
    }>
    coverageVerdict: 'strong' | 'adequate' | 'weak'
    sourceTruthCount: number
    materiallyUsedCount: number
    auditTrail: {
      canonicalSourceSkillCount: number
      builderInputSkillCount: number
      weightedAllocationSkillCount: number
      sessionArchitectureSkillCount: number
      skillsLostInPipeline: string[]
      skillsNarrowedReason: string | null
    }
  } | null
  // [VISIBLE-WEEK-EXPRESSION-FIX] Visible week skill expression audit
  visibleWeekSkillExpressionAudit?: {
    selectedSkillsCount: number
    primarySkill: string
    secondarySkill: string | null
    visibleWeekSkillCount: number
    skillsWithDirectBlocks: string[]
    skillsWithTechnicalSlots: string[]
    skillsWithSupportBlocks: string[]
    skillsWithMixedDayPresence: string[]
    skillsCarryoverOnly: string[]
    deferredSkills: string[]
    finalVerdict: 'VISIBLE_WEEK_EXPRESSION_STRONG' | 'VISIBLE_WEEK_EXPRESSION_ADEQUATE' | 'VISIBLE_WEEK_EXPRESSION_NARROW'
  } | null
}

// [CHECKLIST 1 OF 4] Selected Skill Trace Contract
interface SkillTraceEntry {
  skill: string
  inCanonicalProfile: boolean
  wasPrimaryGoal: boolean
  wasSecondaryGoal: boolean
  inWeightedAllocation: boolean
  weightedPriorityLevel: 'primary' | 'secondary' | 'tertiary' | 'support' | null
  weightedExposureSessions: number
  finalRole: 'primary_spine' | 'secondary_anchor' | 'tertiary' | 'support' | 'deferred'
  materiallyAllocated: boolean
  representationOutcome: 'direct' | 'support' | 'rotational' | 'deferred'
  deferralReasonCode: string | null
  deferralReasonLabel: string | null
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  isConservative: boolean
  progressionDroveDecision: boolean
}

interface SelectedSkillTraceContract {
  sourceSelectedSkills: string[]
  sourcePrimaryGoal: string | null
  sourceSecondaryGoal: string | null
  sourceSkillCount: number
  skillTraces: SkillTraceEntry[]
  weightedAllocationCount: number
  primarySpineCount: number
  secondaryAnchorCount: number
  tertiaryCount: number
  supportCount: number
  deferredCount: number
  finalWeekExpression: {
    directlyRepresentedSkills: string[]
    supportExpressedSkills: string[]
    rotationalSkills: string[]
    deferredSkills: Array<{
      skill: string
      reasonCode: string | null
      reasonLabel: string
      details: string | null
    }>
    coverageVerdict: 'strong' | 'adequate' | 'weak'
    coverageRatio: number
  }
}

interface ProgramTruthSummaryProps {
  truthExplanation: TruthExplanation | null | undefined
  selectedSkillTrace?: SelectedSkillTraceContract | null
  className?: string
}

export function ProgramTruthSummary({ truthExplanation, selectedSkillTrace, className }: ProgramTruthSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!truthExplanation) {
    return null
  }
  
  const {
    identityPrimary,
    identitySecondary,
    selectedSkillsUsed,
    representedSkillsInWeek,
    underexpressedSkills,
    // [PHASE 2 MULTI-SKILL] Broader skill coverage contract
    broaderSkillCoverage,
    scheduleModeUsed,
    baselineSessions,
    currentSessions,
    frequencyWasAdapted,
    frequencyAdaptationReason,
    durationTargetUsed,
    experienceLevelUsed,
    equipmentUsed,
    weightedLoadingUsed,
    jointCautionsConsidered,
    weakPointAddressed,
    recoveryLevelUsed,
    explanationFactors,
    hiddenTruthNotSurfaced,
    explanationQualityVerdict,
    // [PHASE 2] Method preferences materiality
    methodPreferencesApplied,
    methodPreferencesMateriality,
    // [SESSION-STYLE-TRUTH] Session style preference
    sessionStyleUsed,
    // [SESSION-STYLE-MATERIALITY] Session style materiality
    sessionStyleMateriallyApplied,
    sessionStyleAdjustmentReason,
    // [FLEXIBILITY-TRUTH-CONTRACT] Flexibility goals
    flexibilityGoalsUsed,
    flexibilityIntegrated,
    // [PHASE 7] Training path type
    trainingPathUsed,
  // [SKILL-STRENGTH-TRUTH-CONTRACT] Skill and strength profile
  skillStrengthProfile,
  // [DOCTRINE RUNTIME CONTRACT] Doctrine influence data
  doctrineInfluence,
  // [SESSION ARCHITECTURE TRUTH] Architecture and materiality truth
  sessionArchitectureTruth,
  // [SESSION-ARCHITECTURE-MATERIALIZATION] Skill materialization verdict
  materializationVerdict,
    skillStrengthMateriallyApplied,
    // [CURRENT-PROGRESSION-TRUTH-CONTRACT] Current working progressions
    currentWorkingProgressions,
    progressionTruthNote,
    // [PHASE 6] Output quality materiality
    outputQualityReport,
    // [PHASE 7] Visible difference verdict
    visibleDifferenceReport,
  } = truthExplanation
  
  // Determine overall status
  const hasWarnings = underexpressedSkills.length > 0 || hiddenTruthNotSurfaced.length > 2
  const isStrong = explanationQualityVerdict === 'EXPLANATION_STRONG'
  
  // Format goal for display
  const formatGoal = (goal: string | null) => {
    if (!goal) return null
    return goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  // Build key decision points
  const keyDecisions: Array<{ label: string; value: string; type: 'info' | 'success' | 'warning' }> = []
  
  if (identityPrimary) {
    keyDecisions.push({
      label: 'Primary Focus',
      value: formatGoal(identityPrimary) || '',
      type: 'success',
    })
  }
  
  if (identitySecondary) {
    keyDecisions.push({
      label: 'Secondary Focus',
      value: formatGoal(identitySecondary) || '',
      type: 'info',
    })
  }
  
  // [PHASE 7] Add training path type key decision - shows hybrid/skill/strength identity
  if (trainingPathUsed && trainingPathUsed !== 'balanced') {
    const pathLabels: Record<string, string> = {
      'skill_progression': 'Skill-Focused',
      'strength_endurance': 'Strength-Focused', 
      'hybrid': 'Hybrid Training',
      'mobility_focused': 'Mobility-Focused',
    }
    keyDecisions.push({
      label: 'Training Path',
      value: pathLabels[trainingPathUsed] || trainingPathUsed.replace(/_/g, ' '),
      type: 'info',
    })
  }
  
  if (selectedSkillsUsed.length > 0) {
    // [CHECKLIST 1 OF 5] Use authoritative multi-skill intent contract FIRST, then fall back
    const authContract = truthExplanation.authoritativeMultiSkillIntentContract
    
    // Prefer authoritative contract for accurate skill representation
    const totalSelected = authContract?.sourceTruthCount || selectedSkillsUsed.length
    const materiallyUsed = authContract?.materiallyUsedCount || 
      (broaderSkillCoverage?.representedSkills.length || representedSkillsInWeek.length)
    const deferredCount = authContract?.deferredSkills.length || 
      broaderSkillCoverage?.deferredSkills.length || 
      underexpressedSkills.length
    const supportSkillsCount = authContract?.supportSkills.length || 
      broaderSkillCoverage?.supportExpressedSkills?.length || 0
    
    // Use authoritative skill list if available
    const skillsToDisplay = authContract?.selectedSkills || selectedSkillsUsed
    const skillsDisplay = skillsToDisplay.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ')
    const hasMore = totalSelected > 3
    
    // Build skill status display
    let skillStatusText = ''
    if (deferredCount > 0) {
      skillStatusText = ` (${deferredCount} deferred)`
    } else if (supportSkillsCount > 0) {
      skillStatusText = ` (+${supportSkillsCount} support)`
    }
    
    keyDecisions.push({
      label: 'Skills Targeted',
      value: `${skillsDisplay}${hasMore ? ` (+${totalSelected - 3} more)` : ''}${skillStatusText}`,
      type: deferredCount > 0 ? 'warning' : materiallyUsed >= totalSelected * 0.8 ? 'success' : 'info',
    })
  }
  
  keyDecisions.push({
    label: 'Schedule Mode',
    value: scheduleModeUsed === 'flexible' ? `Flexible (${currentSessions} sessions)` : `Static (${currentSessions} days/week)`,
    type: 'info',
  })
  
  if (frequencyWasAdapted && frequencyAdaptationReason) {
    keyDecisions.push({
      label: 'Frequency Adapted',
      value: frequencyAdaptationReason,
      type: 'warning',
    })
  }
  
  if (experienceLevelUsed) {
    keyDecisions.push({
      label: 'Experience Level',
      value: experienceLevelUsed.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: 'info',
    })
  }
  
  if (weightedLoadingUsed) {
    keyDecisions.push({
      label: 'Weighted Loading',
      value: 'Integrated',
      type: 'success',
    })
  }
  
  if (jointCautionsConsidered.length > 0) {
    keyDecisions.push({
      label: 'Joint Protection',
      value: jointCautionsConsidered.slice(0, 2).join(', '),
      type: 'warning',
    })
  }
  
  if (weakPointAddressed) {
  keyDecisions.push({
  label: 'Weak Point Focus',
  value: weakPointAddressed.replace(/_/g, ' '),
  type: 'info',
  })
  }
  
  // [DOCTRINE RUNTIME CONTRACT] Add doctrine influence key decision
  if (doctrineInfluence && doctrineInfluence.available && doctrineInfluence.influenceLevel !== 'none') {
    const influenceLabel = doctrineInfluence.influenceLevel === 'strong' 
      ? 'Strong' 
      : doctrineInfluence.influenceLevel === 'moderate'
        ? 'Moderate'
        : 'Light'
  keyDecisions.push({
  label: 'Training Science',
  value: `${influenceLabel} doctrine influence`,
  type: 'success',
  })
  }
  
  // [SESSION ARCHITECTURE TRUTH] Add architecture verdict key decision
  if (sessionArchitectureTruth) {
    const verdictLabel = sessionArchitectureTruth.weeklyMaterialityVerdict === 'STRONGLY_PERSONALIZED'
      ? 'Personalized'
      : sessionArchitectureTruth.weeklyMaterialityVerdict === 'ACCEPTABLY_DIFFERENT'
        ? 'Tailored'
        : 'Standard'
    keyDecisions.push({
      label: 'Program Style',
      value: verdictLabel,
      type: sessionArchitectureTruth.weeklyMaterialityVerdict === 'STRONGLY_PERSONALIZED' ? 'success' : 'info',
    })
    
    // Show current working progression if historical ceiling was blocked
    if (sessionArchitectureTruth.historicalCeilingBlockedCount > 0) {
      keyDecisions.push({
        label: 'Progression',
        value: 'Conservative start',
        type: 'warning',
      })
    }
  }
  
  // [SESSION-STYLE-MATERIALITY] Add session style preference key decision with materiality
  if (sessionStyleUsed) {
    const styleLabel = sessionStyleUsed === 'longer_complete' 
      ? 'Complete Sessions' 
      : sessionStyleUsed === 'shorter_focused' 
        ? 'Focused Sessions' 
        : sessionStyleUsed.replace(/_/g, ' ')
    
    // Show materiality status if style was materially applied
    const styleValue = sessionStyleMateriallyApplied 
      ? styleLabel // Show as success if materially applied
      : styleLabel
    const styleType: 'info' | 'success' | 'warning' = sessionStyleMateriallyApplied ? 'success' : 'info'
    
    keyDecisions.push({
      label: 'Session Style',
      value: styleValue,
      type: styleType,
    })
  }
  
  // [PHASE 2] Add training style methods key decision
  if (methodPreferencesMateriality && methodPreferencesMateriality.verdict !== 'NO_PREFERENCES') {
    const appliedCount = methodPreferencesApplied?.actuallyApplied?.filter(m => m !== 'straight_sets').length || 0
    const selectedCount = methodPreferencesMateriality.userSelectedMethods?.filter(m => m !== 'straight_sets').length || 0
    
    let styleValue = ''
    let styleType: 'info' | 'success' | 'warning' = 'info'
    
    if (methodPreferencesMateriality.verdict === 'FULLY_EXPRESSED') {
      styleValue = `${appliedCount} method${appliedCount > 1 ? 's' : ''} applied`
      styleType = 'success'
    } else if (methodPreferencesMateriality.verdict === 'MOSTLY_EXPRESSED') {
      styleValue = `${appliedCount}/${selectedCount} methods used`
      styleType = 'success'
    } else if (methodPreferencesMateriality.verdict === 'LIGHTLY_EXPRESSED') {
      styleValue = `${appliedCount}/${selectedCount} methods used`
      styleType = 'info'
    } else {
      styleValue = 'Skill-focused training'
      styleType = 'info'
    }
    
    keyDecisions.push({
      label: 'Training Style',
      value: styleValue,
      type: styleType,
    })
  }
  
  // [FLEXIBILITY-TRUTH-CONTRACT] Add flexibility goals key decision
  if (flexibilityGoalsUsed && flexibilityGoalsUsed.length > 0) {
    const flexTargets = flexibilityGoalsUsed.slice(0, 2).map((f: string) => 
      f.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    ).join(', ')
    const moreCount = flexibilityGoalsUsed.length > 2 ? flexibilityGoalsUsed.length - 2 : 0
    
    keyDecisions.push({
      label: 'Flexibility Focus',
      value: moreCount > 0 ? `${flexTargets} +${moreCount}` : flexTargets,
      type: flexibilityIntegrated ? 'success' : 'info',
    })
  }
  
  // [CURRENT-PROGRESSION-TRUTH-CONTRACT] Add skill/strength profile key decision
  // [CANONICAL-PROFILE-SKILL-CALIBRATION-FIX] Now PREFERS currentWorkingProgressions as authoritative source
  // Falls back to skillStrengthProfile only for legacy programs that don't have currentWorkingProgressions
  if (skillStrengthProfile && skillStrengthMateriallyApplied) {
    const strengthParts: string[] = []
    const isConservative = currentWorkingProgressions?.anyConservativeStart ?? false
    
    // [CANONICAL-PROFILE-SKILL-CALIBRATION-FIX] Use currentWorkingProgressions as primary truth source
    // This ensures we display the conservative/downgraded progression, not the historical ceiling
    const plancheCurrent = currentWorkingProgressions?.planche?.currentWorkingProgression
    const frontLeverCurrent = currentWorkingProgressions?.frontLever?.currentWorkingProgression
    
    // Add skill progressions - prefer currentWorkingProgressions, fall back to skillStrengthProfile
    if (plancheCurrent || skillStrengthProfile.plancheProgression) {
      const plancheLabel = (plancheCurrent || skillStrengthProfile.plancheProgression || '').replace(/_/g, ' ')
      const conservativeIndicator = currentWorkingProgressions?.planche?.isConservative ? ' *' : ''
      strengthParts.push(`Planche: ${plancheLabel}${conservativeIndicator}`)
    }
    if (frontLeverCurrent || skillStrengthProfile.frontLeverProgression) {
      const flLabel = (frontLeverCurrent || skillStrengthProfile.frontLeverProgression || '').replace(/_/g, ' ')
      const conservativeIndicator = currentWorkingProgressions?.frontLever?.isConservative ? ' *' : ''
      strengthParts.push(`FL: ${flLabel}${conservativeIndicator}`)
    }
    
    // Add weighted strength if present
    if (skillStrengthProfile.weightedPullUp && skillStrengthProfile.weightedPullUp > 0) {
      strengthParts.push(`Pull +${skillStrengthProfile.weightedPullUp}kg`)
    }
    if (skillStrengthProfile.weightedDip && skillStrengthProfile.weightedDip > 0) {
      strengthParts.push(`Dip +${skillStrengthProfile.weightedDip}kg`)
    }
    
    if (strengthParts.length > 0) {
      keyDecisions.push({
        label: isConservative ? 'Current Ability *' : 'Current Ability',
        value: strengthParts.slice(0, 2).join(' | '),
        type: 'success',
      })
      
      // Add conservative start note if applicable
      if (isConservative && progressionTruthNote) {
        keyDecisions.push({
          label: 'Note',
          value: progressionTruthNote,
          type: 'info',
        })
      }
    }
  }
  
  // [PHASE 6] Add output quality key decision
  if (outputQualityReport) {
    const { sessionRoleDifferentiation, exerciseComplexity, overallVerdict } = outputQualityReport
    
    // Session differentiation badge
    if (sessionRoleDifferentiation.distinctRolesCount > 1) {
      keyDecisions.push({
        label: 'Session Variety',
        value: `${sessionRoleDifferentiation.distinctRolesCount} distinct types`,
        type: sessionRoleDifferentiation.verdict === 'WELL_DIFFERENTIATED' ? 'success' : 'info',
      })
    }
    
    // Exercise quality badge for advanced athletes
    if (exerciseComplexity.advancedProgressionsUsed.length > 0) {
      keyDecisions.push({
        label: 'Progressions',
        value: exerciseComplexity.advancedProgressionsUsed.slice(0, 2).map(p => 
          p.split(' ').slice(0, 2).join(' ')
        ).join(', '),
        type: 'success',
      })
    }
  }
  
  return (
    <Card className={cn('bg-[#2A2A2A] border-[#3A3A3A]', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base text-[#E8E4D9] flex items-center gap-2">
              {isStrong ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : hasWarnings ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <Info className="w-4 h-4 text-blue-400" />
              )}
              Why This Plan
            </CardTitle>
            {!isStrong && (
              <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                {hiddenTruthNotSurfaced.length} hidden factors
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#8A8A8A] hover:text-[#E8E4D9] h-7 px-2"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Always visible summary */}
        <div className="space-y-3">
          {/* Primary decisions - always show first 3 */}
          <div className="flex flex-wrap gap-2">
            {keyDecisions.slice(0, 3).map((decision, idx) => (
              <div
                key={idx}
                className={cn(
                  'text-xs px-2 py-1 rounded-md',
                  decision.type === 'success' && 'bg-green-500/10 text-green-400',
                  decision.type === 'info' && 'bg-blue-500/10 text-blue-400',
                  decision.type === 'warning' && 'bg-amber-500/10 text-amber-400'
                )}
              >
                <span className="text-[#6A6A6A]">{decision.label}:</span>{' '}
                <span className="font-medium">{decision.value}</span>
              </div>
            ))}
          </div>
          
          {/* Underexpressed skills warning */}
          {underexpressedSkills.length > 0 && (
            <div className="text-xs text-amber-400/80 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                {underexpressedSkills.length === 1 
                  ? `${underexpressedSkills[0].replace(/_/g, ' ')} may have limited direct work this week`
                  : `${underexpressedSkills.length} skills have limited direct work this week`
                }
              </span>
            </div>
          )}
          
          {/* [PHASE 7] Visible difference notice - when rebuild produces same structure */}
          {visibleDifferenceReport && visibleDifferenceReport.verdict === 'NO_MEANINGFUL_CHANGE_SAME_INPUT_SAME_OUTPUT' && (
            <div className="text-xs text-blue-400/80 flex items-start gap-1.5 bg-blue-500/5 rounded px-2 py-1.5 -mx-2">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{visibleDifferenceReport.userFacingExplanation}</span>
            </div>
          )}
          
          {/* [PHASE 7] Minor changes notice */}
          {visibleDifferenceReport && visibleDifferenceReport.verdict === 'INTERNAL_CHANGE_ONLY_NOT_VISIBLE' && (
            <div className="text-xs text-[#8A8A8A] flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{visibleDifferenceReport.userFacingExplanation}</span>
            </div>
          )}
        </div>
        
        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#3A3A3A] space-y-4">
            {/* All key decisions */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                Decision Factors
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {keyDecisions.map((decision, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-[#1E1E1E] rounded px-2.5 py-1.5"
                  >
                    <span className="text-[#6A6A6A]">{decision.label}:</span>{' '}
                    <span className={cn(
                      'font-medium',
                      decision.type === 'success' && 'text-green-400',
                      decision.type === 'info' && 'text-[#E8E4D9]',
                      decision.type === 'warning' && 'text-amber-400'
                    )}>
                      {decision.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skills coverage - [CHECKLIST 1 OF 5] Use authoritative contract first */}
            {selectedSkillsUsed.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Skill Coverage
                </h4>
                {/* [CHECKLIST 1 OF 5] Display authoritative contract when available */}
                {truthExplanation.authoritativeMultiSkillIntentContract ? (
                  <>
                    {/* Priority order with roles */}
                    <div className="flex flex-wrap gap-1.5">
                      {truthExplanation.authoritativeMultiSkillIntentContract.skillPriorityOrder.map((entry) => {
                        const roleColor = 
                          entry.role === 'primary' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : entry.role === 'secondary' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : entry.role === 'tertiary' ? 'bg-purple-500/10 text-purple-400'
                          : entry.role === 'support' ? 'bg-indigo-500/10 text-indigo-400'
                          : 'bg-amber-500/10 text-amber-400'
                        
                        const roleLabel = 
                          entry.role === 'primary' ? ''
                          : entry.role === 'secondary' ? ''
                          : entry.role === 'tertiary' ? ' (tertiary)'
                          : entry.role === 'support' ? ' (support)'
                          : ' (deferred)'
                        
                        return (
                          <span
                            key={entry.skill}
                            className={cn('text-xs px-2 py-0.5 rounded', roleColor)}
                            title={`${entry.exposureSessions} session(s), priority: ${entry.priorityScore}`}
                          >
                            {entry.skill.replace(/_/g, ' ')}{roleLabel}
                          </span>
                        )
                      })}
                    </div>
                    
                    {/* Deferred skills with reasons */}
                    {truthExplanation.authoritativeMultiSkillIntentContract.deferredSkills.length > 0 && (
                      <div className="text-xs text-[#6A6A6A] pt-1 space-y-1">
                        <p className="font-medium text-[#8A8A8A]">Deferred this cycle:</p>
                        {truthExplanation.authoritativeMultiSkillIntentContract.deferredSkills.map(({ skill, reasonLabel }) => (
                          <p key={skill} className="pl-2">
                            {skill.replace(/_/g, ' ')}: {reasonLabel}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Coverage verdict with audit info */}
                    <div className="text-xs pt-1 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#6A6A6A]">Coverage:</span>
                        <span className={cn(
                          'font-medium',
                          truthExplanation.authoritativeMultiSkillIntentContract.coverageVerdict === 'strong' && 'text-green-400',
                          truthExplanation.authoritativeMultiSkillIntentContract.coverageVerdict === 'adequate' && 'text-blue-400',
                          truthExplanation.authoritativeMultiSkillIntentContract.coverageVerdict === 'weak' && 'text-amber-400'
                        )}>
                          {truthExplanation.authoritativeMultiSkillIntentContract.coverageVerdict === 'strong' && 'Strong multi-skill expression'}
                          {truthExplanation.authoritativeMultiSkillIntentContract.coverageVerdict === 'adequate' && 'Adequate expression'}
                          {truthExplanation.authoritativeMultiSkillIntentContract.coverageVerdict === 'weak' && 'Focused on primary goals'}
                        </span>
                        <span className="text-[#5A5A5A]">
                          ({truthExplanation.authoritativeMultiSkillIntentContract.materiallyUsedCount}/{truthExplanation.authoritativeMultiSkillIntentContract.sourceTruthCount} skills expressed)
                        </span>
                      </div>
                      
                      {/* Audit trail if skills were narrowed */}
                      {truthExplanation.authoritativeMultiSkillIntentContract.auditTrail.skillsNarrowedReason && (
                        <div className="text-[#5A5A5A] pl-2 italic">
                          Note: {truthExplanation.authoritativeMultiSkillIntentContract.auditTrail.skillsNarrowedReason.replace(/_/g, ' ')}
                        </div>
                      )}
                      
                      {/* [VISIBLE-WEEK-EXPRESSION-FIX] Visible Week Skill Expression section */}
                      {truthExplanation.visibleWeekSkillExpressionAudit && (
                        <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
                          <p className="font-medium text-[#9A9A9A] mb-2">Visible Week Skill Expression</p>
                          
                          {/* Skills with direct blocks (primary + secondary) */}
                          {truthExplanation.visibleWeekSkillExpressionAudit.skillsWithDirectBlocks.length > 0 && (
                            <div className="text-xs mb-2">
                              <span className="text-[#6A6A6A]">Direct blocks: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {truthExplanation.visibleWeekSkillExpressionAudit.skillsWithDirectBlocks.map((skill) => (
                                  <Badge key={skill} variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                                    {skill.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Skills with technical slots (tertiary with visibility) */}
                          {truthExplanation.visibleWeekSkillExpressionAudit.skillsWithTechnicalSlots.length > 0 && (
                            <div className="text-xs mb-2">
                              <span className="text-[#6A6A6A]">Technical slots: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {truthExplanation.visibleWeekSkillExpressionAudit.skillsWithTechnicalSlots.map((skill) => (
                                  <Badge key={skill} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                    {skill.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Skills with mixed day presence */}
                          {truthExplanation.visibleWeekSkillExpressionAudit.skillsWithMixedDayPresence.length > 0 && (
                            <div className="text-xs mb-2">
                              <span className="text-[#6A6A6A]">Mixed day presence: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {truthExplanation.visibleWeekSkillExpressionAudit.skillsWithMixedDayPresence.map((skill) => (
                                  <Badge key={skill} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                                    {skill.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Skills carryover only */}
                          {truthExplanation.visibleWeekSkillExpressionAudit.skillsCarryoverOnly.length > 0 && (
                            <div className="text-xs mb-2">
                              <span className="text-[#6A6A6A]">Carryover only: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {truthExplanation.visibleWeekSkillExpressionAudit.skillsCarryoverOnly.map((skill) => (
                                  <Badge key={skill} variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                                    {skill.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Visible week expression verdict */}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#2A2A2A]">
                            <span className={cn(
                              'text-xs font-medium',
                              truthExplanation.visibleWeekSkillExpressionAudit.finalVerdict === 'VISIBLE_WEEK_EXPRESSION_STRONG' && 'text-green-400',
                              truthExplanation.visibleWeekSkillExpressionAudit.finalVerdict === 'VISIBLE_WEEK_EXPRESSION_ADEQUATE' && 'text-blue-400',
                              truthExplanation.visibleWeekSkillExpressionAudit.finalVerdict === 'VISIBLE_WEEK_EXPRESSION_NARROW' && 'text-amber-400'
                            )}>
                              {truthExplanation.visibleWeekSkillExpressionAudit.finalVerdict === 'VISIBLE_WEEK_EXPRESSION_STRONG' && 'Strong visible expression'}
                              {truthExplanation.visibleWeekSkillExpressionAudit.finalVerdict === 'VISIBLE_WEEK_EXPRESSION_ADEQUATE' && 'Adequate visible expression'}
                              {truthExplanation.visibleWeekSkillExpressionAudit.finalVerdict === 'VISIBLE_WEEK_EXPRESSION_NARROW' && 'Focused visible expression'}
                            </span>
                            <span className="text-[#5A5A5A] text-xs">
                              ({truthExplanation.visibleWeekSkillExpressionAudit.visibleWeekSkillCount}/{truthExplanation.visibleWeekSkillExpressionAudit.selectedSkillsCount} visible)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : broaderSkillCoverage ? (
                  // Use richer contract data when available
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {broaderSkillCoverage.entries.map((entry) => {
                        const statusColor = 
                          entry.coverageStatus === 'fully_represented' ? 'bg-green-500/10 text-green-400'
                          : entry.coverageStatus === 'broadly_represented' ? 'bg-blue-500/10 text-blue-400'
                          : entry.coverageStatus === 'support_only' ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-amber-500/10 text-amber-400'
                        
                        const label = 
                          entry.coverageStatus === 'fully_represented' ? ''
                          : entry.coverageStatus === 'broadly_represented' ? ''
                          : entry.coverageStatus === 'support_only' ? ' (support)'
                          : ' (reduced)'
                        
                        return (
                          <span
                            key={entry.skill}
                            className={cn('text-xs px-2 py-0.5 rounded', statusColor)}
                          >
                            {entry.skill.replace(/_/g, ' ')}{label}
                          </span>
                        )
                      })}
                    </div>
                    
                    {/* Support expressed skills - explicit support work scheduled */}
                    {broaderSkillCoverage.supportExpressedSkills && broaderSkillCoverage.supportExpressedSkills.length > 0 && (
                      <div className="text-xs text-[#6A6A6A] pt-1 space-y-1">
                        <p className="font-medium text-[#8A8A8A]">Support work included:</p>
                        <div className="flex flex-wrap gap-1 pl-2">
                          {broaderSkillCoverage.supportExpressedSkills.map((skill) => (
                            <span key={skill} className="text-purple-400">
                              {skill.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Support rotational skills - rotated through sessions */}
                    {broaderSkillCoverage.supportRotationalSkills && broaderSkillCoverage.supportRotationalSkills.length > 0 && (
                      <div className="text-xs text-[#6A6A6A] pt-1 space-y-1">
                        <p className="font-medium text-[#8A8A8A]">Maintenance rotation:</p>
                        <div className="flex flex-wrap gap-1 pl-2">
                          {broaderSkillCoverage.supportRotationalSkills.map((skill) => (
                            <span key={skill} className="text-blue-300">
                              {skill.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Deferred skills with reasons */}
                    {broaderSkillCoverage.deferredSkills.length > 0 && (
                      <div className="text-xs text-[#6A6A6A] pt-1 space-y-1">
                        <p className="font-medium text-[#8A8A8A]">Reduced this cycle:</p>
                        {broaderSkillCoverage.deferredSkills.map(({ skill, reason }) => (
                          <p key={skill} className="pl-2">
                            {skill.replace(/_/g, ' ')}: {reason}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Coverage verdict */}
                    {broaderSkillCoverage.coverageVerdict && (
                      <div className="text-xs pt-1 flex items-center gap-1.5">
                        <span className="text-[#6A6A6A]">Coverage:</span>
                        <span className={cn(
                          'font-medium',
                          broaderSkillCoverage.coverageVerdict === 'strong' && 'text-green-400',
                          broaderSkillCoverage.coverageVerdict === 'adequate' && 'text-blue-400',
                          broaderSkillCoverage.coverageVerdict === 'weak' && 'text-amber-400'
                        )}>
                          {broaderSkillCoverage.coverageVerdict === 'strong' && 'Strong multi-skill coverage'}
                          {broaderSkillCoverage.coverageVerdict === 'adequate' && 'Adequate coverage'}
                          {broaderSkillCoverage.coverageVerdict === 'weak' && 'Focused on primary goals'}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  // Fallback to basic display
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkillsUsed.map((skill) => {
                      const isRepresented = representedSkillsInWeek.includes(skill)
                      return (
                        <span
                          key={skill}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            isRepresented
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-amber-500/10 text-amber-400'
                          )}
                        >
                          {skill.replace(/_/g, ' ')}
                          {!isRepresented && ' (limited)'}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* [PHASE 1] Selected Skill Trace - Shows exact skill disposition */}
            {/* [UI CONTRACT ALIGNMENT] Use safe accessor to prevent undefined crashes */}
            {(() => {
              // Safe access: get normalized skill trace with all fields guaranteed
              const safeTrace = selectedSkillTrace ? getSafeSkillTrace(selectedSkillTrace) : null
              if (!safeTrace || safeTrace.sourceSkillCount < 1) return null
              
              const weekExpr = safeTrace.finalWeekExpression
              
              return (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                    Skill Expression This Cycle ({safeTrace.sourceSkillCount} selected)
                  </h4>
                  <div className="text-xs bg-[#1E1E1E] rounded p-2.5 space-y-2">
                    {/* Direct expression */}
                    {weekExpr.directlyRepresentedSkills.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[#6A6A6A] shrink-0">Direct:</span>
                        <div className="flex flex-wrap gap-1">
                          {weekExpr.directlyRepresentedSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                              {skill.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Support expression */}
                    {weekExpr.supportExpressedSkills.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[#6A6A6A] shrink-0">Support:</span>
                        <div className="flex flex-wrap gap-1">
                          {weekExpr.supportExpressedSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                              {skill.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Rotational expression */}
                    {weekExpr.rotationalSkills.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[#6A6A6A] shrink-0">Rotational:</span>
                        <div className="flex flex-wrap gap-1">
                          {weekExpr.rotationalSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                              {skill.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Deferred skills with detailed reasons */}
                    {weekExpr.deferredSkills.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[#6A6A6A] shrink-0">Deferred:</span>
                        <div className="space-y-1">
                          {weekExpr.deferredSkills.map(({ skill, reasonLabel }) => (
                            <div key={skill} className="flex items-center gap-1">
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                                {skill.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-[#5A5A5A] italic">{reasonLabel || 'deferred'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Coverage summary */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-[#2A2A2A] mt-2">
                      <span className={cn(
                        'text-xs font-medium',
                        weekExpr.coverageVerdict === 'strong' && 'text-green-400',
                        weekExpr.coverageVerdict === 'adequate' && 'text-blue-400',
                        weekExpr.coverageVerdict === 'weak' && 'text-amber-400'
                      )}>
                        {weekExpr.coverageVerdict === 'strong' && 'Strong coverage'}
                        {weekExpr.coverageVerdict === 'adequate' && 'Adequate coverage'}
                        {weekExpr.coverageVerdict === 'weak' && 'Focused coverage'}
                      </span>
                      <span className="text-[#5A5A5A] text-xs">
                        ({Math.round(weekExpr.coverageRatio * 100)}% of {safeTrace.sourceSkillCount} skills expressed)
                      </span>
                    </div>
                    
                    {/* Multi-skill explanation when narrowed */}
                    {safeTrace.sourceSkillCount > weekExpr.directlyRepresentedSkills.length + weekExpr.supportExpressedSkills.length && (
                      <p className="text-[#5A5A5A] text-xs italic pt-1">
                        This cycle prioritizes {safeTrace.primarySpineCount + safeTrace.secondaryAnchorCount} skills directly while preserving {safeTrace.tertiaryCount + safeTrace.supportCount} others as support/rotational based on recovery, schedule budget, and current readiness.
                      </p>
                    )}
                    
                    {/* [PHASE 1] Current Working Progression Truth */}
                    {safeTrace.skillTraces && safeTrace.skillTraces.length > 0 && safeTrace.skillTraces.some((t: Record<string, unknown>) => t.currentWorkingProgression || t.historicalCeiling) && (
                      <div className="pt-2 mt-2 border-t border-[#2A2A2A]">
                        <div className="text-[#6A6A6A] text-xs mb-1.5">Current Working Levels:</div>
                        <div className="space-y-1">
                          {(safeTrace.skillTraces as Array<{skill?: string; currentWorkingProgression?: string; historicalCeiling?: string; isConservative?: boolean}>)
                            .filter(t => t.currentWorkingProgression || t.historicalCeiling)
                            .slice(0, 4) // Show top 4 skills
                            .map((trace, idx) => (
                              <div key={trace.skill || idx} className="flex items-center gap-2 text-xs">
                                <span className="text-[#8A8A8A] capitalize">{(trace.skill || '').replace(/_/g, ' ')}:</span>
                                {trace.currentWorkingProgression ? (
                                  <span className="text-[#A4ACB8]">
                                    {trace.currentWorkingProgression.replace(/_/g, ' ')}
                                    {trace.isConservative && (
                                      <span className="text-[#5A5A5A] ml-1">(conservative)</span>
                                    )}
                                  </span>
                                ) : trace.historicalCeiling ? (
                                  <span className="text-[#5A5A5A] italic">
                                    Historical: {trace.historicalCeiling.replace(/_/g, ' ')}
                                  </span>
                                ) : null}
                                {trace.historicalCeiling && trace.currentWorkingProgression && 
                                 trace.historicalCeiling !== trace.currentWorkingProgression && (
                                  <span className="text-[#4A4A4A] text-[10px]">
                                    (ceiling: {trace.historicalCeiling.replace(/_/g, ' ')})
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
            
            {/* [DOCTRINE RUNTIME CONTRACT] Doctrine Influence Section */}
            {doctrineInfluence && doctrineInfluence.available && doctrineInfluence.influenceLevel !== 'none' && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Training Science Applied
                </h4>
                <div className="text-xs bg-[#1E1E1E] rounded p-2.5 space-y-2">
                  {/* Influence level badge */}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded font-medium',
                      doctrineInfluence.influenceLevel === 'strong' && 'bg-green-500/10 text-green-400',
                      doctrineInfluence.influenceLevel === 'moderate' && 'bg-blue-500/10 text-blue-400',
                      doctrineInfluence.influenceLevel === 'minimal' && 'bg-purple-500/10 text-purple-400'
                    )}>
                      {doctrineInfluence.influenceLevel === 'strong' ? 'Strong' : 
                       doctrineInfluence.influenceLevel === 'moderate' ? 'Moderate' : 'Light'} doctrine influence
                    </span>
                  </div>
                  
                  {/* User visible summary */}
                  {doctrineInfluence.userVisibleSummary && doctrineInfluence.userVisibleSummary.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {doctrineInfluence.userVisibleSummary.map((summary, idx) => (
                        <p key={idx} className="text-[#9A9A9A]">
                          {summary}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* Specific influences */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {doctrineInfluence.progressionInfluenced && (
                      <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                        Progression pacing
                      </span>
                    )}
                    {doctrineInfluence.methodsInfluenced && (
                      <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                        Method selection
                      </span>
                    )}
                    {doctrineInfluence.prescriptionInfluenced && (
                      <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                        Prescription style
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* [SESSION ARCHITECTURE TRUTH] Program Architecture Section */}
            {sessionArchitectureTruth && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Program Architecture
                </h4>
                <div className="text-xs bg-[#1E1E1E] rounded p-2.5 space-y-2">
                  {/* Architecture verdict badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded font-medium',
                      sessionArchitectureTruth.weeklyMaterialityVerdict === 'STRONGLY_PERSONALIZED' && 'bg-green-500/10 text-green-400',
                      sessionArchitectureTruth.weeklyMaterialityVerdict === 'ACCEPTABLY_DIFFERENT' && 'bg-blue-500/10 text-blue-400',
                      sessionArchitectureTruth.weeklyMaterialityVerdict === 'TOO_CLOSE_TO_FOUNDATIONAL_DEFAULT' && 'bg-amber-500/10 text-amber-400'
                    )}>
                      {sessionArchitectureTruth.weeklyMaterialityVerdict === 'STRONGLY_PERSONALIZED' 
                        ? 'Strongly personalized' 
                        : sessionArchitectureTruth.weeklyMaterialityVerdict === 'ACCEPTABLY_DIFFERENT'
                          ? 'Tailored program'
                          : 'Standard template'}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      sessionArchitectureTruth.complexity === 'high' && 'bg-purple-500/10 text-purple-400',
                      sessionArchitectureTruth.complexity === 'moderate' && 'bg-blue-500/10 text-blue-400',
                      sessionArchitectureTruth.complexity === 'low' && 'bg-[#2A2A2A] text-[#6A6A6A]'
                    )}>
                      {sessionArchitectureTruth.complexity} complexity
                    </span>
                  </div>
                  
                  {/* Skill classification */}
                  <div className="space-y-1.5 pt-1">
                    {sessionArchitectureTruth.primarySpineSkills.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[#6A6A6A] min-w-[70px]">Primary:</span>
                        <span className="text-[#E8E4D9]">
                          {sessionArchitectureTruth.primarySpineSkills.map(s => s.replace(/_/g, ' ')).join(', ')}
                        </span>
                      </div>
                    )}
                    {sessionArchitectureTruth.secondaryAnchorSkills.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[#6A6A6A] min-w-[70px]">Secondary:</span>
                        <span className="text-[#E8E4D9]">
                          {sessionArchitectureTruth.secondaryAnchorSkills.map(s => s.replace(/_/g, ' ')).join(', ')}
                        </span>
                      </div>
                    )}
                    {sessionArchitectureTruth.supportRotationSkills.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[#6A6A6A] min-w-[70px]">Support:</span>
                        <span className="text-green-400">
                          {sessionArchitectureTruth.supportRotationSkills.map(s => s.replace(/_/g, ' ')).join(', ')}
                        </span>
                      </div>
                    )}
                    {sessionArchitectureTruth.deferredSkills.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[#6A6A6A] min-w-[70px]">Deferred:</span>
                        <span className="text-amber-400">
                          {sessionArchitectureTruth.deferredSkills.map(d => d.skill.replace(/_/g, ' ')).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Current working progression note */}
                  {sessionArchitectureTruth.historicalCeilingBlockedCount > 0 && (
                    <div className="pt-1 text-xs text-amber-400/80 flex items-start gap-1.5">
                      <span className="shrink-0">⚠</span>
                      <span>
                        Programming from your current ability level, not historical peak
                        ({sessionArchitectureTruth.historicalCeilingBlockedCount} skill{sessionArchitectureTruth.historicalCeilingBlockedCount > 1 ? 's' : ''} adjusted)
                      </span>
                    </div>
                  )}
                  
                  {/* Doctrine architecture bias */}
                  {sessionArchitectureTruth.doctrineArchitectureBias && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        sessionArchitectureTruth.doctrineArchitectureBias.supportAllocationBias === 'generous' 
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-[#2A2A2A] text-[#6A6A6A]'
                      )}>
                        {sessionArchitectureTruth.doctrineArchitectureBias.supportAllocationBias} support
                      </span>
                      <span className="text-xs bg-[#2A2A2A] text-[#6A6A6A] px-2 py-0.5 rounded">
                        {sessionArchitectureTruth.doctrineArchitectureBias.sessionRoleBias.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* [SESSION-ARCHITECTURE-MATERIALIZATION] Skill Materialization Section */}
            {/* [MATERIALIZATION-TRUTH-SOURCE-FIX] Now uses normalized buckets from authoritative truth */}
            {materializationVerdict && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Skill Expression
                </h4>
                <div className="text-xs bg-[#1E1E1E] rounded p-2.5 space-y-2">
                  {/* Verdict badge - use normalized expression if available */}
                  {(() => {
                    const normalized = materializationVerdict.normalizedExpression
                    const visibleCount = normalized 
                      ? (normalized.directlyExpressed?.length || 0) + (normalized.technicallyExpressed?.length || 0)
                      : materializationVerdict.skillCoverage.expressed
                    const totalExpressed = normalized
                      ? visibleCount + (normalized.supportExpressed?.length || 0) + (normalized.carryoverOnly?.length || 0)
                      : materializationVerdict.skillCoverage.expressed
                    
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded font-medium',
                          materializationVerdict.verdict === 'PASS' && 'bg-green-500/10 text-green-400',
                          materializationVerdict.verdict === 'WARN' && 'bg-amber-500/10 text-amber-400',
                          materializationVerdict.verdict === 'FAIL' && 'bg-red-500/10 text-red-400'
                        )}>
                          {materializationVerdict.verdict === 'PASS'
                            ? 'Skills well expressed'
                            : materializationVerdict.verdict === 'WARN'
                              ? 'Good expression with some support-level'
                              : 'Skill expression needs review'}
                        </span>
                        <span className="text-xs bg-[#2A2A2A] text-[#6A6A6A] px-2 py-0.5 rounded">
                          {totalExpressed}/{materializationVerdict.skillCoverage.selected} skills covered
                        </span>
                      </div>
                    )
                  })()}
                  
                  {/* [MATERIALIZATION-TRUTH-SOURCE-FIX] Show normalized expression buckets */}
                  {materializationVerdict.normalizedExpression && (
                    <div className="space-y-1.5 pt-1">
                      {/* Directly expressed (primary/secondary) */}
                      {materializationVerdict.normalizedExpression.directlyExpressed?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-green-400 text-xs shrink-0">Direct:</span>
                          <span className="text-[#E8E4D9] text-xs">
                            {materializationVerdict.normalizedExpression.directlyExpressed.map(s => s.replace(/_/g, ' ')).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Technically expressed (tertiary with visibility) */}
                      {materializationVerdict.normalizedExpression.technicallyExpressed?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 text-xs shrink-0">Technical:</span>
                          <span className="text-[#E8E4D9] text-xs">
                            {materializationVerdict.normalizedExpression.technicallyExpressed.map(s => s.replace(/_/g, ' ')).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Support expressed */}
                      {materializationVerdict.normalizedExpression.supportExpressed?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs shrink-0">Support:</span>
                          <span className="text-[#E8E4D9] text-xs">
                            {materializationVerdict.normalizedExpression.supportExpressed.map(s => s.replace(/_/g, ' ')).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Carryover only */}
                      {materializationVerdict.normalizedExpression.carryoverOnly?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-amber-400 text-xs shrink-0">Carryover:</span>
                          <span className="text-[#9A9A9A] text-xs">
                            {materializationVerdict.normalizedExpression.carryoverOnly.map(s => s.replace(/_/g, ' ')).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Deferred (with reason - not "dropped") */}
                      {materializationVerdict.normalizedExpression.deferredSkills?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#6A6A6A] text-xs shrink-0">Deferred:</span>
                          <span className="text-[#6A6A6A] text-xs">
                            {materializationVerdict.normalizedExpression.deferredSkills.map(s => s.replace(/_/g, ' ')).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Legacy fallback: Only show dropped if no normalized expression AND truly dropped */}
                  {!materializationVerdict.normalizedExpression && materializationVerdict.skillCoverage.dropped.length > 0 && (
                    <div className="flex items-start gap-2 pt-1">
                      <span className="text-amber-400 text-xs">Reduced focus:</span>
                      <span className="text-[#E8E4D9] text-xs">
                        {materializationVerdict.skillCoverage.dropped.map(s => s.replace(/_/g, ' ')).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Truly dropped (from normalized) - only if actually dropped without deferral */}
                  {materializationVerdict.normalizedExpression?.trulyDropped?.length > 0 && (
                    <div className="flex items-start gap-2 pt-1">
                      <span className="text-red-400 text-xs">Unexpectedly missing:</span>
                      <span className="text-[#E8E4D9] text-xs">
                        {materializationVerdict.normalizedExpression.trulyDropped.map(s => s.replace(/_/g, ' ')).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Issues - only show if verdict is not PASS */}
                  {materializationVerdict.verdict !== 'PASS' && materializationVerdict.issues.length > 0 && (
                    <div className="pt-1 text-xs text-amber-400/80 flex items-start gap-1.5">
                      <span className="shrink-0">Note:</span>
                      <span>{materializationVerdict.issues[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* [PHASE 6] Output Quality Materiality */}
            {outputQualityReport && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Program Expression Quality
                </h4>
                <div className="text-xs bg-[#1E1E1E] rounded p-2.5 space-y-2">
                  {/* User-facing explanation */}
                  <p className="text-[#E8E4D9]">
                    {outputQualityReport.explanationForUser}
                  </p>
                  
                  {/* Quality metrics */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      outputQualityReport.sessionRoleDifferentiation.verdict === 'WELL_DIFFERENTIATED' 
                        ? 'bg-green-500/10 text-green-400'
                        : outputQualityReport.sessionRoleDifferentiation.verdict === 'PARTIALLY_DIFFERENTIATED'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-[#2A2A2A] text-[#6A6A6A]'
                    )}>
                      {outputQualityReport.sessionRoleDifferentiation.distinctRolesCount} session types
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      outputQualityReport.exerciseComplexity.verdict === 'ADVANCED_EXPRESSION'
                        ? 'bg-green-500/10 text-green-400'
                        : outputQualityReport.exerciseComplexity.verdict === 'MODERATE_EXPRESSION'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-[#2A2A2A] text-[#6A6A6A]'
                    )}>
                      {outputQualityReport.exerciseComplexity.averageExercisesPerSession.toFixed(1)} exercises/session
                    </span>
                    {outputQualityReport.loadingQuality.hasWeightedExercises && (
                      <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                        Weighted loading
                      </span>
                    )}
                    {outputQualityReport.loadingQuality.hasHoldTargets && (
                      <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                        Hold targets
                      </span>
                    )}
                  </div>
                  
                  {/* Overall verdict */}
                  <div className="pt-1 text-[#6A6A6A] text-xs flex items-center gap-1.5">
                    <span>Overall:</span>
                    <span className={cn(
                      'font-medium',
                      outputQualityReport.overallVerdict === 'STRONGLY_EXPRESSED' && 'text-green-400',
                      outputQualityReport.overallVerdict === 'PARTIALLY_EXPRESSED' && 'text-blue-400',
                      outputQualityReport.overallVerdict === 'UNDEREXPRESSED' && 'text-amber-400'
                    )}>
                      {outputQualityReport.overallVerdict === 'STRONGLY_EXPRESSED' && 'Profile well-expressed'}
                      {outputQualityReport.overallVerdict === 'PARTIALLY_EXPRESSED' && 'Profile partially expressed'}
                      {outputQualityReport.overallVerdict === 'UNDEREXPRESSED' && 'Foundational structure'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* [PHASE 2] Training Style Methods */}
            {methodPreferencesMateriality && methodPreferencesMateriality.verdict !== 'NO_PREFERENCES' && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Training Style Expression
                </h4>
                <div className="text-xs bg-[#1E1E1E] rounded p-2.5 space-y-2">
                  {/* User-facing explanation */}
                  <p className="text-[#E8E4D9]">
                    {methodPreferencesMateriality.explanationForUser}
                  </p>
                  
                  {/* Per-session breakdown if methods were applied */}
                  {methodPreferencesApplied && (methodPreferencesApplied.sessionsWithSupersets > 0 || 
                    methodPreferencesApplied.sessionsWithCircuits > 0 || 
                    methodPreferencesApplied.sessionsWithDensity > 0) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {methodPreferencesApplied.sessionsWithSupersets > 0 && (
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                          Supersets: {methodPreferencesApplied.sessionsWithSupersets} session{methodPreferencesApplied.sessionsWithSupersets > 1 ? 's' : ''}
                        </span>
                      )}
                      {methodPreferencesApplied.sessionsWithCircuits > 0 && (
                        <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                          Circuits: {methodPreferencesApplied.sessionsWithCircuits} session{methodPreferencesApplied.sessionsWithCircuits > 1 ? 's' : ''}
                        </span>
                      )}
                      {methodPreferencesApplied.sessionsWithDensity > 0 && (
                        <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                          Density: {methodPreferencesApplied.sessionsWithDensity} session{methodPreferencesApplied.sessionsWithDensity > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Methods not applied with reasons */}
                  {methodPreferencesMateriality.selectedButNotApplied.length > 0 && (
                    <div className="pt-1 text-[#6A6A6A] text-xs">
                      <span className="text-amber-400/70">Limited:</span>{' '}
                      {methodPreferencesMateriality.nonApplicationReasons.map((r, i) => (
                        <span key={r.method}>
                          {r.method.replace(/_/g, ' ')}{i < methodPreferencesMateriality.nonApplicationReasons.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      <span className="text-[#5A5A5A]"> (skill quality priority)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Equipment */}
            {equipmentUsed.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Equipment Used
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {equipmentUsed.slice(0, 6).map((eq) => (
                    <span
                      key={eq}
                      className="text-xs bg-[#1E1E1E] text-[#8A8A8A] px-2 py-0.5 rounded"
                    >
                      {eq.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {equipmentUsed.length > 6 && (
                    <span className="text-xs text-[#6A6A6A]">
                      +{equipmentUsed.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Hidden factors */}
            {hiddenTruthNotSurfaced.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Additional Factors (Not Displayed Elsewhere)
                </h4>
                <div className="text-xs text-[#6A6A6A] bg-[#1E1E1E] rounded p-2">
                  {hiddenTruthNotSurfaced.join(' • ')}
                </div>
              </div>
            )}
            
            {/* Explanation quality footer */}
            <div className="pt-2 border-t border-[#3A3A3A]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6A6A6A]">Explanation Quality</span>
                <span className={cn(
                  'font-medium',
                  explanationQualityVerdict === 'EXPLANATION_STRONG' && 'text-green-400',
                  explanationQualityVerdict === 'EXPLANATION_THIN' && 'text-amber-400',
                  explanationQualityVerdict === 'GENERATION_MAY_BE_RIGHT_BUT_PROOF_IS_WEAK' && 'text-amber-400',
                  explanationQualityVerdict === 'USER_TRUTH_NOT_SUFFICIENTLY_SURFACED' && 'text-red-400'
                )}>
                  {explanationQualityVerdict === 'EXPLANATION_STRONG' && 'Strong'}
                  {explanationQualityVerdict === 'EXPLANATION_THIN' && 'Basic'}
                  {explanationQualityVerdict === 'GENERATION_MAY_BE_RIGHT_BUT_PROOF_IS_WEAK' && 'Limited Proof'}
                  {explanationQualityVerdict === 'USER_TRUTH_NOT_SUFFICIENTLY_SURFACED' && 'Hidden Factors'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
