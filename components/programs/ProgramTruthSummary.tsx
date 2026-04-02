'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
  } | null
}

interface ProgramTruthSummaryProps {
  truthExplanation: TruthExplanation | null | undefined
  className?: string
}

export function ProgramTruthSummary({ truthExplanation, className }: ProgramTruthSummaryProps) {
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
    // [PHASE 2 MULTI-SKILL] Use richer coverage data when available
    const representedCount = broaderSkillCoverage?.representedSkills.length || representedSkillsInWeek.length
    const totalSelected = selectedSkillsUsed.length
    const skillsDisplay = selectedSkillsUsed.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ')
    const hasMore = totalSelected > 3
    const deferredCount = broaderSkillCoverage?.deferredSkills.length || underexpressedSkills.length
    
    keyDecisions.push({
      label: 'Skills Targeted',
      value: deferredCount > 0 
        ? `${skillsDisplay}${hasMore ? ` (+${totalSelected - 3} more)` : ''} (${deferredCount} reduced)`
        : `${skillsDisplay}${hasMore ? ` (+${totalSelected - 3} more)` : ''}`,
      type: deferredCount > 0 ? 'warning' : 'success',
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
  // Now uses currentWorkingProgressions for accurate current ability display
  if (skillStrengthProfile && skillStrengthMateriallyApplied) {
    const strengthParts: string[] = []
    const isConservative = currentWorkingProgressions?.anyConservativeStart ?? false
    
    // Add skill progressions if present (these now reflect CURRENT working level, not historical)
    if (skillStrengthProfile.plancheProgression) {
      const plancheLabel = skillStrengthProfile.plancheProgression.replace(/_/g, ' ')
      // Show conservative indicator if applicable
      const conservativeIndicator = currentWorkingProgressions?.planche?.isConservative ? ' *' : ''
      strengthParts.push(`Planche: ${plancheLabel}${conservativeIndicator}`)
    }
    if (skillStrengthProfile.frontLeverProgression) {
      const flLabel = skillStrengthProfile.frontLeverProgression.replace(/_/g, ' ')
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
            
            {/* Skills coverage - [PHASE 2 MULTI-SKILL] Enhanced with deferred reasons */}
            {selectedSkillsUsed.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Skill Coverage
                </h4>
                {broaderSkillCoverage ? (
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
