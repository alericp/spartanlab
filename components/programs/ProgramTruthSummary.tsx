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

interface TruthExplanation {
  identityPrimary: string | null
  identitySecondary: string | null
  identityLabel: string
  selectedSkillsUsed: string[]
  representedSkillsInWeek: string[]
  underexpressedSkills: string[]
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
  
  if (selectedSkillsUsed.length > 0) {
    keyDecisions.push({
      label: 'Skills Targeted',
      value: selectedSkillsUsed.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', '),
      type: 'success',
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
            
            {/* Skills coverage */}
            {selectedSkillsUsed.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Skill Coverage
                </h4>
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
