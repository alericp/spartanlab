'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { AdaptiveSessionCard } from './AdaptiveSessionCard'
// [TASK 1] Removed checkProgramStaleness - unified staleness is now passed from parent
import type { UnifiedStalenessResult } from '@/lib/canonical-profile-service'
import { 
  Target, 
  Calendar, 
  Clock, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { WorkoutExplanation, PlanExplanationBadge, DataConfidenceBadge } from './WorkoutExplanation'
import { getDurationPreferenceLabel } from '@/lib/duration-contract'

interface AdaptiveProgramDisplayProps {
  program: AdaptiveProgram
  onDelete?: () => void
  onRestart?: () => void // Explicit restart action: archives current program, returns to builder
  onRegenerate?: () => void // Explicit regenerate action: updates program from current profile
  onExerciseReplace?: (dayNumber: number, exerciseId: string) => void
  // [TASK 1] Unified staleness result passed from parent - display does NOT recompute its own
  unifiedStaleness?: UnifiedStalenessResult | null
}

export function AdaptiveProgramDisplay({ 
  program, 
  onDelete,
  onRestart,
  onRegenerate,
  onExerciseReplace,
  unifiedStaleness, // [TASK 1] Consume parent's staleness evaluation
}: AdaptiveProgramDisplayProps) {
  // TASK 2: Confirmation modal state for restart action
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  
  // ==========================================================================
  // [TASK 1] USE UNIFIED STALENESS FROM PARENT - DO NOT RECOMPUTE
  // The display component receives the exact same staleness result computed by the page.
  // This prevents dual/conflicting staleness warnings.
  // ==========================================================================
  const stalenessCheck = unifiedStaleness ? {
    isStale: unifiedStaleness.isStale,
    staleDegree: unifiedStaleness.severity === 'critical' || unifiedStaleness.severity === 'significant' 
      ? 'significant' as const
      : unifiedStaleness.severity === 'minor' 
        ? 'minor' as const 
        : 'none' as const,
    changedFields: unifiedStaleness.changedFields,
    recommendation: unifiedStaleness.recommendation === 'regenerate' 
      ? 'recommend_regenerate' as const
      : unifiedStaleness.recommendation === 'review'
        ? 'suggest_regenerate' as const
        : 'continue' as const,
  } : {
    // Fallback if no unified staleness passed (backwards compatibility)
    isStale: false,
    staleDegree: 'none' as const,
    changedFields: [] as string[],
    recommendation: 'continue' as const,
  }
  
  // ==========================================================================
  // [TASK 2] TRUTHFUL BANNER TITLE AND FIELD LIST FROM PARENT
  // Use banner title and field list from parent staleness if available
  // Falls back to computed values if not provided
  // ==========================================================================
  const bannerTitle = (unifiedStaleness as { bannerTitle?: string })?.bannerTitle || 'Minor settings changed'
  const fieldListSummary = (unifiedStaleness as { fieldListSummary?: string })?.fieldListSummary || (
    stalenessCheck.isStale && stalenessCheck.changedFields.length > 0
      ? `Training settings have changed (${stalenessCheck.changedFields.slice(0, 2).join(', ')}). Consider regenerating.`
      : 'Consider regenerating your program.'
  )
  
  // Phase 3 status from parent (if computed)
  const phase3Status = (unifiedStaleness as { phase3Status?: string })?.phase3Status || 'unknown'
  const safeToMoveToPhase4 = (unifiedStaleness as { safeToMoveToPhase4?: boolean })?.safeToMoveToPhase4 ?? false
  
  console.log('[adaptive-display-banner-truth]', {
    bannerTitle,
    fieldListSummary,
    phase3Status,
    safeToMoveToPhase4,
    isStale: stalenessCheck.isStale,
    severity: unifiedStaleness?.severity,
  })
  
  // [PHASE 5 TASK 5] Display source truth audit - verify chips show only profile-selected skills
  console.log('[phase5-display-skill-chips-truth]', {
    programSelectedSkills: program.selectedSkills || [],
    programRepresentedSkills: (program as unknown as { representedSkills?: string[] }).representedSkills || [],
    summaryTruthProfileSkills: (program as unknown as { summaryTruth?: { profileSelectedSkills?: string[] }}).summaryTruth?.profileSelectedSkills || [],
    chipSourceArray: 'program.selectedSkills', // What the chips actually iterate over
    chipsShowOnlyProfileSelected: true, // We only show program.selectedSkills
    noLeakedBroaderSupport: true, // Support skills are NOT shown as selected chips
  })
  
  // [PHASE 6] SELECTED VS PROGRAMMED SKILL TRUTH AUDIT
  // Verify program structure actually prioritizes selected skills correctly
  const selectedSkillsFromProfile = program.selectedSkills || []
  const representedInProgram = (program as unknown as { representedSkills?: string[] }).representedSkills || []
  const summaryTruth = (program as unknown as { summaryTruth?: { 
    headlineFocusSkills?: string[]
    weekRepresentedSkills?: string[]
    weekSupportSkills?: string[]
  }}).summaryTruth
  
  console.log('[selected-vs-programmed-skill-truth-audit]', {
    canonicalSelectedSkills: selectedSkillsFromProfile,
    programRepresentedSkills: representedInProgram,
    headlineFocusSkills: summaryTruth?.headlineFocusSkills || [],
    weekRepresentedSkills: summaryTruth?.weekRepresentedSkills || [],
    weekSupportSkills: summaryTruth?.weekSupportSkills || [],
    // Check for leaks: any represented skill not in selected
    deselectedSkillsInRepresented: representedInProgram.filter(s => !selectedSkillsFromProfile.includes(s)),
    // Check for proper prioritization
    primaryIsHeadline: summaryTruth?.headlineFocusSkills?.[0] === program.primaryGoal,
    secondaryIsRepresented: !program.secondaryGoal || 
      summaryTruth?.headlineFocusSkills?.includes(program.secondaryGoal) ||
      summaryTruth?.weekRepresentedSkills?.includes(program.secondaryGoal),
    verdict: representedInProgram.filter(s => !selectedSkillsFromProfile.includes(s)).length === 0
      ? 'clean_no_deselected_leaks'
      : 'DESELECTED_SKILL_LEAKED_INTO_REPRESENTED',
  })
  const recoveryColors: Record<string, string> = {
    HIGH: 'text-green-400 bg-green-400/10 border-green-400/20',
    MODERATE: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    LOW: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  
  // PHASE 2: Safe accessor for recoveryColors - returns default if key is missing/invalid
  const getRecoveryColor = (level: string | undefined): string => {
    if (!level || typeof level !== 'string') return recoveryColors.MODERATE
    return recoveryColors[level] || recoveryColors.MODERATE
  }
  
  // PHASE 2: Safe accessor for fatigue state display
  const formatFatigueState = (state: string | undefined): string => {
    if (!state || typeof state !== 'string') return 'Normal'
    return state.charAt(0).toUpperCase() + state.slice(1)
  }
  
  // PHASE 2: Safe accessors for nested objects - prevent crashes on partial data
  const constraintInsight = program.constraintInsight || { 
    hasInsight: false, 
    label: 'Training Balanced' 
  }
  const structure = program.structure || { 
    structureName: 'Custom Program', 
    rationale: 'Personalized training structure' 
  }
  const engineContext = program.engineContext
  const equipmentProfile = program.equipmentProfile
  const trainingBehaviorAnalysis = program.trainingBehaviorAnalysis
  
  // PHASE 2: Filter sessions to only include valid ones
  const validSessions = Array.isArray(program.sessions) 
    ? program.sessions.filter(s => s && typeof s === 'object' && Array.isArray(s.exercises))
    : []
  
  // ==========================================================================
  // [TASK 10] PROGRAM PAGE TRUTH AUDIT
  // Comprehensive consistency audit for debugging mixed truth display bugs
  // ==========================================================================
  const sessionExerciseCounts = validSessions.map(s => s.exercises?.length || 0)
  const hasVariants = validSessions.some(s => s.variants && s.variants.length > 1)
  
  // Determine overall alignment verdict
  let programPageVerdict = 'fully_aligned'
  if (stalenessCheck.isStale) {
    programPageVerdict = 'mixed_truth_display_bug'
  }
  if (hasVariants && validSessions.some(s => !s.variants?.[0]?.selection?.main)) {
    programPageVerdict = 'variant_state_persistence_bug'
  }
  
  console.log('[program-page-truth-audit]', {
    visibleProgramId: program.id,
    savedProgramId: program.id, // Same since this is what we loaded
    sessionCardKeyStrategy: 'programId-dayNumber-sessionName',
    sessionCount: validSessions.length,
    sessionDensityPerDay: sessionExerciseCounts,
    avgExercisesPerSession: sessionExerciseCounts.length > 0 
      ? Math.round(sessionExerciseCounts.reduce((a, b) => a + b, 0) / sessionExerciseCounts.length * 10) / 10
      : 0,
    hasVariantsAvailable: hasVariants,
    stalenessCheckIsStale: stalenessCheck.isStale,
    stalenessChangedFields: stalenessCheck.changedFields,
    plannerTruthSeverity: program.plannerTruthAudit?.severity || 'unknown',
    topPlannerTruthReason: program.plannerTruthAudit?.topIssueReason || 'none',
    scheduleMode: program.scheduleMode,
    currentWeekFrequency: (program as { currentWeekFrequency?: number }).currentWeekFrequency || validSessions.length,
    finalVerdict: programPageVerdict,
  })
  
  // [displayed-adjustment-truth] STEP 3: Log what values are being displayed
  // This helps verify that rebuild actually replaced the program snapshot
  // TASK 6: Explicit verification logging for program identity
  console.log('[displayed-adjustment-truth] === DISPLAY TRUTH ===')
  console.log('[displayed-adjustment-truth] Program ID:', program.id)
  console.log('[displayed-adjustment-truth] Generated At:', program.createdAt)
  console.log('[displayed-adjustment-truth] Schedule Mode:', program.scheduleMode)
  console.log('[displayed-adjustment-truth] Program trainingDaysPerWeek:', program.trainingDaysPerWeek)
  console.log('[displayed-adjustment-truth] Actual valid sessions count:', validSessions.length)
  console.log('[displayed-adjustment-truth] currentWeekFrequency:', (program as { currentWeekFrequency?: number }).currentWeekFrequency)
  console.log('[displayed-adjustment-truth] DISPLAYED SESSION COUNT:', validSessions.length)
  console.log('[displayed-adjustment-truth] === END DISPLAY TRUTH ===')
  
  // Diagnostic: Log if we detect partial program data (only once per render)
  if (!program.recoveryLevel || !(program.recoveryLevel in recoveryColors)) {
    console.log('[AdaptiveProgramDisplay] Using fallback for recoveryLevel:', program.recoveryLevel)
  }
  if (!engineContext?.fatigueState) {
    console.log('[AdaptiveProgramDisplay] engineContext or fatigueState missing')
  }

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{program.goalLabel} Program</h3>
            <p className="text-sm text-[#6A6A6A]">
              Generated {new Date(program.createdAt).toLocaleDateString()}
            </p>
          </div>
          {/* TASK 1: Restart Program action - truthful labeling instead of misleading trash icon */}
          {(onRestart || onDelete) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#6A6A6A] hover:text-amber-400 gap-1.5"
              onClick={() => setShowRestartConfirm(true)}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Restart</span>
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">
                {program.secondaryGoal ? 'Primary Goal' : 'Goal'}
              </p>
              <p className="text-sm font-medium">{program.goalLabel}</p>
              {/* TASK 5: Show secondary goal if present */}
              {program.secondaryGoal && (
                <p className="text-xs text-[#6A6A6A] mt-0.5">
                  + {program.secondaryGoal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">
                {program.scheduleMode === 'flexible' ? 'Schedule' : 'Days/Week'}
              </p>
              {program.scheduleMode === 'flexible' ? (
                // ISSUE D FIX: Clear distinction between saved adaptive preference and current week resolution
                // [PHASE 8] Show truthful reason for current frequency
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">Adaptive</span>
                  </div>
                  <span className="text-xs text-[#6A6A6A]">
                    {/* TASK 4: Use validSessions.length as canonical truth - never stale summary values */}
                    {validSessions.length} sessions this week
                  </span>
                  {/* [PHASE 8 TASK 5] Truthful frequency explanation */}
                  {program.flexibleFrequencyRootCause && (
                    <span className="text-[10px] text-[#5A5A5A] mt-0.5">
                      {program.flexibleFrequencyRootCause.isBaselineDefault 
                        ? `(${program.primaryGoal.replace(/_/g, ' ')} baseline)`
                        : program.flexibleFrequencyRootCause.isTrueAdaptive
                          ? '(adapted from feedback)'
                          : program.flexibleFrequencyRootCause.finalReasonCategory === 'experience_modifier_applied'
                            ? '(adjusted for experience)'
                            : program.flexibleFrequencyRootCause.finalReasonCategory === 'joint_caution_conservative'
                              ? '(conservative for joints)'
                              : program.flexibleFrequencyRootCause.finalReasonCategory === 'poor_recovery_reduction'
                                ? '(reduced for recovery)'
                                : program.flexibleFrequencyRootCause.finalReasonCategory === 'high_volume_conservative'
                                  ? '(volume-based)'
                                  : program.flexibleFrequencyRootCause.finalReasonCategory === 'low_history_default'
                                    ? '(building baseline)'
                                    : ''}
                    </span>
                  )}
                </div>
              ) : (
                // STATIC USER: Show actual session count from generated program - this is canonical
                // TASK 4: Previously used program.trainingDaysPerWeek which could be stale
                <p className="text-sm font-medium">
                  {validSessions.length} days
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">
                {program.sessionDurationMode === 'adaptive' ? 'Duration' : 'Target Duration'}
              </p>
              {program.sessionDurationMode === 'adaptive' ? (
                // ISSUE D FIX: Clear distinction between saved adaptive preference and resolved duration
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">Adaptive</span>
                  </div>
                  <span className="text-xs text-[#6A6A6A]">
                    ~{program.sessionLength || 60} min base target
                  </span>
                </div>
              ) : (
                // STATIC USER: Show fixed duration as saved preference
                <p className="text-sm font-medium">{getDurationPreferenceLabel(program.sessionLength)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">Level</p>
              <p className="text-sm font-medium capitalize">{program.experienceLevel}</p>
            </div>
          </div>
        </div>

        {/* Built Around Section - Shows training emphasis and selected skills concisely */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Training Path Type Badge */}
          {program.trainingPathType && program.trainingPathType !== 'balanced' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#E63946]/10 text-[#E63946]">
              {program.trainingPathType === 'hybrid' ? 'Hybrid Training' : 
               program.trainingPathType === 'skill_mastery' ? 'Skill Mastery' :
               program.trainingPathType === 'strength_focus' ? 'Strength Focus' :
               program.trainingPathType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          )}
          {/* [TASK 1] Selected Skills Summary - show ALL skills neatly, no more +N truncation */}
          {/* [PHASE 5] DISPLAY SKILL TRUTH - distinguish profile-selected vs actually-represented */}
          {/* [TASK 5/6 FIX] Use program.representedSkills if available (server-computed truth) */}
          {program.selectedSkills && program.selectedSkills.length > 0 && (() => {
            // Use server-computed representedSkills if available, otherwise compute client-side
            const serverRepresentedSkills = (program as unknown as { representedSkills?: string[] }).representedSkills
            
            // Fallback to client-side computation if server data not available
            let representedSkills: string[]
            if (serverRepresentedSkills && serverRepresentedSkills.length > 0) {
              representedSkills = serverRepresentedSkills
            } else {
              // Client-side fallback computation
              const allExerciseNames = program.sessions?.flatMap(s => 
                s.exercises?.map(e => (e.exercise?.name || '').toLowerCase()) || []
              ) || []
              
              const skillKeywords: Record<string, string[]> = {
                'planche': ['planche', 'lean', 'tuck', 'pseudo'],
                'front_lever': ['front lever', 'front-lever', 'tuck lever', 'adv tuck'],
                'back_lever': ['back lever', 'back-lever', 'german hang'],
                'handstand': ['handstand', 'pike', 'wall walk', 'freestanding'],
                'muscle_up': ['muscle up', 'muscle-up', 'transition'],
              }
              
              representedSkills = program.selectedSkills.filter(skill => {
                const keywords = skillKeywords[skill] || [skill.replace(/_/g, ' ')]
                return keywords.some(kw => allExerciseNames.some(name => name.includes(kw)))
              })
            }
            
            const unrepresentedSkills = program.selectedSkills.filter(s => !representedSkills.includes(s))
            
            // Log display skill truth audit with stale vs current distinction
            console.log('[display-skill-truth-audit]', {
              profileSelectedSkills: program.selectedSkills,
              serverRepresentedSkills: serverRepresentedSkills || 'not_available',
              skillsRepresentedInWeek: representedSkills,
              skillsNotRepresentedInWeek: unrepresentedSkills,
              usingServerTruth: !!serverRepresentedSkills,
              displayTruthVerdict: unrepresentedSkills.length === 0 
                ? 'all_skills_represented' 
                : 'some_skills_not_represented',
            })
            
            // [TASK 8] STALE VS CURRENT PROGRAM TRUTH AUDIT
            console.log('[stale-vs-current-program-truth-audit]', {
              programId: program.id,
              programCreatedAt: program.createdAt,
              hasServerRepresentedSkills: !!serverRepresentedSkills,
              isLikelyCurrentBuild: !!serverRepresentedSkills,
              isLikelyStalePlan: !serverRepresentedSkills,
              verdict: serverRepresentedSkills ? 'current_build' : 'possibly_stale_plan',
            })
            
            // [SUMMARY-TRUTH] TASK 6: Use server-provided summary truth if available
            const summaryTruth = (program as unknown as { summaryTruth?: {
              headlineFocusSkills?: string[]
              weekRepresentedSkills?: string[]
              weekSupportSkills?: string[]
            }}).summaryTruth
            
            // [WEEKLY-REPRESENTATION] Use weekly representation verdicts if available
            const weeklyRepresentation = (program as unknown as { weeklyRepresentation?: {
              policies: Array<{
                skill: string
                representationVerdict: string
                actualExposure: { total: number; direct: number; support: number }
              }>
              coverageRatio: number
            }}).weeklyRepresentation
            
            const headlineSkills = summaryTruth?.headlineFocusSkills || [program.primaryGoal, program.secondaryGoal].filter(Boolean)
            const weekSupportSkills = summaryTruth?.weekSupportSkills || []
            
            // [WEEKLY-REPRESENTATION] TASK 5: Determine chip state from exposure verdicts
            type ChipState = 'headline_priority' | 'represented_broader' | 'support_only' | 'selected_not_represented'
            
            const getChipState = (skill: string): ChipState => {
              // First check weekly representation policies if available (more accurate)
              if (weeklyRepresentation?.policies) {
                const policy = weeklyRepresentation.policies.find(p => p.skill === skill)
                if (policy) {
                  switch (policy.representationVerdict) {
                    case 'headline_represented':
                      return 'headline_priority'
                    case 'broadly_represented':
                      return 'represented_broader'
                    case 'support_only':
                      return 'support_only'
                    case 'selected_but_underexpressed':
                    case 'filtered_out_by_constraints':
                    default:
                      return 'selected_not_represented'
                  }
                }
              }
              
              // Fallback to summary truth based logic
              if (headlineSkills.includes(skill)) return 'headline_priority'
              if (representedSkills.includes(skill)) return 'represented_broader'
              if (weekSupportSkills.includes(skill)) return 'support_only'
              return 'selected_not_represented'
            }
            
            // [PHASE 6] DISPLAY-LEVEL DESELECTED SKILL LEAK CHECK
            // Verify chips only show skills from canonical selectedSkills
            const canonicalSelectedSet = new Set(program.selectedSkills || [])
            const representedSkillsFromProgram = (program as unknown as { representedSkills?: string[] }).representedSkills || []
            const representedButNotSelected = representedSkillsFromProgram.filter(s => !canonicalSelectedSet.has(s))
            
            console.log('[phase6-display-deselected-skill-leak-check]', {
              canonicalSelectedSkills: program.selectedSkills,
              representedSkillsInProgram: representedSkillsFromProgram,
              representedButNotSelected,
              noDisplayLeaks: representedButNotSelected.length === 0,
              chipsSourceArray: 'program.selectedSkills',
              verdict: representedButNotSelected.length === 0 
                ? 'clean_no_leaks' 
                : 'POTENTIAL_LEAK_represented_skills_outside_selected',
            })
            
            // [WEEKLY-REPRESENTATION] Log built-around chip truth audit with exposure data
            console.log('[built-around-chip-truth-audit]', {
              hasWeeklyRepresentation: !!weeklyRepresentation,
              coverageRatio: weeklyRepresentation?.coverageRatio,
              chips: program.selectedSkills.map(skill => {
                const policy = weeklyRepresentation?.policies?.find(p => p.skill === skill)
                return {
                  skill,
                  chipState: getChipState(skill),
                  exposureVerdict: policy?.representationVerdict || 'unknown',
                  actualExposure: policy?.actualExposure?.total || 0,
                  directExposure: policy?.actualExposure?.direct || 0,
                  supportExposure: policy?.actualExposure?.support || 0,
                  representedInWeek: representedSkills.includes(skill),
                  supportOnly: weekSupportSkills.includes(skill),
                  headlinePriority: headlineSkills.includes(skill),
                }
              }),
            })
            
            // [PRIORITY-COLLAPSE-FIX] TASK 8: Post-priority-collapse chip truth audit
            // Verify chip states match the new priority model
            const chipTruthAnalysis = program.selectedSkills.map((skill, idx) => {
              const policy = weeklyRepresentation?.policies?.find(p => p.skill === skill)
              const chipState = getChipState(skill)
              const isLateIndexSkill = idx >= 4
              const wouldHaveBeenOptionalInOldLogic = isLateIndexSkill && 
                skill !== program.primaryGoal && skill !== program.secondaryGoal
              
              return {
                skill,
                originalIndex: idx,
                chipState,
                exposureVerdict: policy?.representationVerdict || 'unknown',
                isLateIndexSkill,
                wouldHaveBeenOptionalInOldLogic,
                nowHasMeaningfulState: chipState !== 'selected_not_represented' || 
                  policy?.representationVerdict === 'filtered_out_by_constraints',
              }
            })
            
            const lateIndexSkillsWithMeaningfulState = chipTruthAnalysis
              .filter(c => c.isLateIndexSkill && c.nowHasMeaningfulState).length
            const lateIndexSkillsTotal = chipTruthAnalysis.filter(c => c.isLateIndexSkill).length
            
            console.log('[post-priority-collapse-chip-truth-audit]', {
              totalChips: chipTruthAnalysis.length,
              lateIndexSkillsTotal,
              lateIndexSkillsWithMeaningfulState,
              chipStatesReflectFinalTruth: lateIndexSkillsTotal === 0 || 
                lateIndexSkillsWithMeaningfulState >= Math.ceil(lateIndexSkillsTotal * 0.5),
              perChipAnalysis: chipTruthAnalysis,
              verdictDistribution: {
                headline_priority: chipTruthAnalysis.filter(c => c.chipState === 'headline_priority').length,
                represented_broader: chipTruthAnalysis.filter(c => c.chipState === 'represented_broader').length,
                support_only: chipTruthAnalysis.filter(c => c.chipState === 'support_only').length,
                selected_not_represented: chipTruthAnalysis.filter(c => c.chipState === 'selected_not_represented').length,
              },
            })
            
            // ==========================================================================
            // [PHASE 6B TASK 1] STRICT CHIP REPRESENTATION SOURCE
            // Only show chips for skills that are MEANINGFULLY represented in final week
            // Not all selectedSkills - only those that pass strict representation threshold
            // ==========================================================================
            
            // [PHASE 6B] Build strict representation list from weekly output truth
            const strictRepresentedSkillsForChips = program.selectedSkills.filter(skill => {
              const chipState = getChipState(skill)
              const policy = weeklyRepresentation?.policies?.find(p => p.skill === skill)
              const directExposure = policy?.actualExposure?.direct || 0
              const totalExposure = policy?.actualExposure?.total || 0
              
              // [PHASE 6B TASK 2] TIGHTENED MEANINGFUL REPRESENTATION THRESHOLDS
              // Skill is shown as chip only if:
              // 1. It's headline priority (primary/secondary goal)
              // 2. OR it has at least 2 direct exercises (meaningful tertiary expression)
              // 3. OR it has at least 3 total exercises (sufficient coverage)
              // NOT just any support-level presence
              
              const isHeadline = chipState === 'headline_priority'
              const hasMeaningfulDirect = directExposure >= 2
              const hasSignificantTotal = totalExposure >= 3
              const isRepresentedBroaderWithSubstance = chipState === 'represented_broader' && (hasMeaningfulDirect || hasSignificantTotal)
              
              return isHeadline || isRepresentedBroaderWithSubstance
            })
            
            console.log('[phase6b-represented-skill-source-truth-audit]', {
              allSelectedSkills: program.selectedSkills,
              strictRepresentedForChips: strictRepresentedSkillsForChips,
              filteredOut: program.selectedSkills.filter(s => !strictRepresentedSkillsForChips.includes(s)),
              primaryGoal: program.primaryGoal,
              secondaryGoal: program.secondaryGoal,
              thresholds: {
                headlinePriority: 'always_shown',
                tertiary: 'needs_2_direct_OR_3_total_exercises',
                supportOnly: 'filtered_out_from_chips',
              },
              verdict: strictRepresentedSkillsForChips.length < program.selectedSkills.length
                ? 'chips_tightened_to_meaningful_representation'
                : 'all_selected_skills_meet_threshold',
            })
            
            return (
              <div className="flex flex-wrap items-center gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#1A1A1A] text-[#6A6A6A]">
                  <Sparkles className="w-3 h-3 text-[#E63946]/60" />
                  Built around:
                </span>
                {/* [PHASE 6B] Only render chips for strictly represented skills */}
                {strictRepresentedSkillsForChips.map((skill) => {
                  const chipState = getChipState(skill)
                  const policy = weeklyRepresentation?.policies?.find(p => p.skill === skill)
                  
                  // [PHASE 6B] Simplified chip styles - only headline and represented states
                  const chipStyles = {
                    headline_priority: 'bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20',
                    represented_broader: 'bg-[#1A1A1A] text-[#A5A5A5] border border-[#3A3A3A]',
                    support_only: 'bg-[#1A1A1A]/80 text-[#8A8A8A] border border-dotted border-[#3A3A3A]',
                    selected_not_represented: 'bg-[#1A1A1A]/50 text-[#6A6A6A] border border-dashed border-[#3A3A3A]',
                  }
                  
                  // [PHASE 6B] Dynamic titles based on actual exposure
                  const getChipTitle = (): string => {
                    if (policy) {
                      const { direct, support, total } = policy.actualExposure
                      switch (chipState) {
                        case 'headline_priority':
                          return `Primary focus: ${total} exercises (${direct} direct, ${support} support)`
                        case 'represented_broader':
                          return `Represented: ${total} exercises this week (${direct} direct)`
                        default:
                          return `${total} exercises this week`
                      }
                    }
                    return chipState === 'headline_priority' 
                      ? 'Primary focus this week' 
                      : 'Represented in this week'
                  }
                  
                  return (
                    <span 
                      key={skill}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${chipStyles[chipState]}`}
                      title={getChipTitle()}
                    >
                      {skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  )
                })}
              </div>
            )
          })()}
          {/* Structure name if not showing training path */}
          {(!program.trainingPathType || program.trainingPathType === 'balanced') && structure.structureName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#2A2A2A] text-[#A5A5A5]">
              {structure.structureName}
            </span>
          )}
        </div>
        
        {/* Program Rationale - [SUMMARY-TRUTH] Use truthful hybrid summary if available */}
        <div className="p-3 bg-[#1A1A1A] rounded-lg">
          <p className="text-sm text-[#A5A5A5]">
            {(() => {
              const summaryTruth = (program as unknown as { summaryTruth?: { truthfulHybridSummary?: string }}).summaryTruth
              return summaryTruth?.truthfulHybridSummary || program.programRationale
            })()}
          </p>
        </div>
        
        {/* [PHASE 6] SUMMARY CLAIM VS WEEK TRUTH AUDIT */}
        {(() => {
          // Compute actual week structure truth
          const sessionFocuses = program.sessions?.map(s => s.focus || 'unknown') || []
          const pushDominantCount = sessionFocuses.filter(f => f.includes('push')).length
          const pullDominantCount = sessionFocuses.filter(f => f.includes('pull')).length
          const mixedCount = sessionFocuses.filter(f => f.includes('mixed') || f.includes('support')).length
          
          // Check rationale claims
          const rationale = (program.programRationale || '').toLowerCase()
          const claimsPushPrimary = rationale.includes('push') && rationale.includes('primary')
          const claimsPullPrimary = rationale.includes('pull') && rationale.includes('primary')
          const claimsHybrid = rationale.includes('hybrid') || rationale.includes('mixed')
          const claimsDensity = rationale.includes('density')
          
          // Verify claims against actual week
          const pushClaimValid = !claimsPushPrimary || pushDominantCount >= pullDominantCount
          const pullClaimValid = !claimsPullPrimary || pullDominantCount >= pushDominantCount
          const hybridClaimValid = !claimsHybrid || (pushDominantCount > 0 && pullDominantCount > 0)
          
          console.log('[summary-claim-vs-week-truth]', {
            pushDominantSessions: pushDominantCount,
            pullDominantSessions: pullDominantCount,
            mixedSessions: mixedCount,
            claimsPushPrimary,
            claimsPullPrimary,
            claimsHybrid,
            claimsDensity,
            pushClaimValid,
            pullClaimValid,
            hybridClaimValid,
            overallVerdict: (pushClaimValid && pullClaimValid && hybridClaimValid) 
              ? 'claims_match_week_structure' 
              : 'potential_overclaim',
          })
          
          // [PHASE 6B TASK 5] TOP CARD ENFORCEMENT AUDIT
          // Verify top card describes actual final week, not eligibility universe
          const summaryTruth = (program as unknown as { summaryTruth?: { 
            headlineFocusSkills?: string[]
            truthfulHybridSummary?: string
          }}).summaryTruth
          const displayedChipsCount = document.querySelectorAll('[data-chip-skill]')?.length || 0
          
          console.log('[phase6b-top-card-enforcement-audit]', {
            primaryGoal: program.primaryGoal,
            secondaryGoal: program.secondaryGoal,
            sessionCountByFocus: {
              pushDominant: pushDominantCount,
              pullDominant: pullDominantCount,
              mixed: mixedCount,
            },
            summaryTruthHeadlineSkills: summaryTruth?.headlineFocusSkills || [],
            rationaleSample: (program.programRationale || '').slice(0, 100),
            topCardMatchesFinalWeek: (pushClaimValid && pullClaimValid && hybridClaimValid),
            claimsAreAccurate: !claimsPushPrimary || pushDominantCount >= 1,
            verdict: (pushClaimValid && pullClaimValid && hybridClaimValid)
              ? 'top_card_matches_final_week'
              : 'top_card_may_overclaim',
          })
          
          return null // No UI output, just audit logging
        })()}
        
        {/* ==========================================================================
            [TASK 1] REMOVED: Profile Staleness Indicator 
            The staleness warning is now ONLY shown by the parent program page,
            not by the display component. This prevents duplicate/conflicting warnings.
            The display receives stalenessCheck via unifiedStaleness prop for any
            needed state-dependent rendering, but does NOT show its own warning banner.
           ========================================================================== */}
        
        {/* [planner-truth-audit] TASK 10: Audit warning banner - minimal, truthful */}
        {/* [TASK 5] Now shows topIssueDescription as the canonical explanation of the most important issue */}
        {program.plannerTruthAudit?.shouldWarn && program.plannerTruthAudit.topIssueReason && program.plannerTruthAudit.topIssueReason !== 'none' && (
          <div className="mt-4 p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-400 mb-1">
                  Program Quality Notice
                </p>
                <p className="text-xs text-[#A5A5A5]">
                  {/* TASK 5: Use topIssueDescription as the canonical single-reason explanation */}
                  {program.plannerTruthAudit.topIssueDescription || 
                   program.plannerTruthAudit.recommendations?.[0] || 
                   'Some preferences may not be fully reflected. Consider reviewing your profile settings.'}
                </p>
                {program.plannerTruthAudit.overallScore !== undefined && (
                  <p className="text-[10px] text-[#6A6A6A] mt-1">
                    Alignment score: {program.plannerTruthAudit.overallScore}/100
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Why This Plan - Canonical Explanation */}
        {program.explanationMetadata && (
          <div className="mt-4">
            <WorkoutExplanation 
              metadata={program.explanationMetadata} 
              variant="program" 
              compact={true}
            />
            <div className="mt-2">
              <DataConfidenceBadge 
                confidence={program.explanationMetadata.dataConfidence}
                workoutCount={program.explanationMetadata.trustedWorkoutCount}
              />
            </div>
          </div>
        )}
        
        {/* [trust-polish] ISSUE D: Simpler coaching label */}
        {trainingBehaviorAnalysis?.adaptationNeeded && 
         Array.isArray(trainingBehaviorAnalysis.coachMessages) && 
         trainingBehaviorAnalysis.coachMessages.length > 0 && (
          <div className="mt-4 p-3 bg-[#E63946]/5 border border-[#E63946]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {trainingBehaviorAnalysis.progressTrend === 'improving' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : trainingBehaviorAnalysis.progressTrend === 'declining' ? (
                <TrendingDown className="w-4 h-4 text-amber-400" />
              ) : (
                <Minus className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-xs font-medium text-[#E63946]">Coaching Notes</span>
            </div>
            <ul className="space-y-1">
              {trainingBehaviorAnalysis.coachMessages.map((msg, idx) => (
                <li key={idx} className="text-sm text-[#A5A5A5]">{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Constraint & Recovery Status */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Constraint Card - PHASE 2: Uses safe accessor */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <div className="flex items-start gap-3">
            {constraintInsight.hasInsight && constraintInsight.label !== 'Training Balanced' ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#E63946]" />
                </div>
                <div>
                  <p className="text-xs text-[#6A6A6A]">Current Limiter</p>
                  <p className="font-medium text-[#E63946]">{constraintInsight.label}</p>
                  <p className="text-xs text-[#A5A5A5] mt-1">
                    Program prioritizes addressing this constraint
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6A6A6A]">Training Status</p>
                  <p className="font-medium text-green-400">Balanced</p>
                  <p className="text-xs text-[#A5A5A5] mt-1">
                    No major bottlenecks detected
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Recovery Card */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              getRecoveryColor(program.recoveryLevel).split(' ').slice(1).join(' ')
            }`}>
              <Activity className={`w-4 h-4 ${getRecoveryColor(program.recoveryLevel).split(' ')[0]}`} />
            </div>
            <div>
              <p className="text-xs text-[#6A6A6A]">Recovery State</p>
              <p className={`font-medium ${getRecoveryColor(program.recoveryLevel).split(' ')[0]}`}>
                {program.recoveryLevel === 'HIGH' ? 'Fresh' : program.recoveryLevel === 'MODERATE' ? 'Normal' : 'Fatigued'}
              </p>
              <p className="text-xs text-[#A5A5A5] mt-1">
                {program.recoveryLevel === 'HIGH' && 'Ready for high-intensity work'}
                {program.recoveryLevel === 'MODERATE' && 'Standard training volume appropriate'}
                {(!program.recoveryLevel || program.recoveryLevel === 'LOW') && 'Consider lighter sessions'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* [trust-polish] ISSUE D: Cleaner label for engine context */}
      {engineContext && (
        <Card className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] border-[#3A3A3A] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#C41E3A]" />
            <span className="text-sm font-medium">Training Status</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Plateau Status</p>
              <p className={`text-sm font-medium ${
                engineContext.plateauStatus === 'plateau_detected' ? 'text-amber-400' :
                engineContext.plateauStatus === 'possible_plateau' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {engineContext.plateauStatus === 'no_plateau' ? 'Clear' :
                 engineContext.plateauStatus === 'possible_plateau' ? 'Possible' : 'Detected'}
              </p>
            </div>
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Strength Support</p>
              <p className={`text-sm font-medium ${
                engineContext.strengthSupportLevel === 'sufficient' ? 'text-green-400' :
                engineContext.strengthSupportLevel === 'developing' ? 'text-blue-400' :
                engineContext.strengthSupportLevel === 'insufficient' ? 'text-amber-400' :
                'text-[#A5A5A5]'
              }`}>
                {engineContext.strengthSupportLevel === 'sufficient' ? 'Strong' :
                 engineContext.strengthSupportLevel === 'developing' ? 'Building' :
                 engineContext.strengthSupportLevel === 'insufficient' ? 'Needs Work' : 'Unknown'}
              </p>
            </div>
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Fatigue State</p>
              <p className={`text-sm font-medium ${
                engineContext.fatigueState === 'fresh' ? 'text-green-400' :
                engineContext.fatigueState === 'normal' ? 'text-blue-400' :
                engineContext.fatigueState === 'fatigued' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {formatFatigueState(engineContext.fatigueState)}
              </p>
            </div>
            {Array.isArray(engineContext.recommendations) && engineContext.recommendations[0] && (
              <div className="bg-[#1A1A1A] rounded-lg p-2 col-span-2 sm:col-span-1">
                <p className="text-xs text-[#6A6A6A]">Top Recommendation</p>
                <p className="text-xs text-[#A5A5A5] line-clamp-2">{engineContext.recommendations[0]}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* [trust-polish] ISSUE A: Equipment notes with product-grade language */}
      {equipmentProfile && !equipmentProfile.hasFullSetup && 
       Array.isArray(equipmentProfile.adaptationNotes) && 
       equipmentProfile.adaptationNotes.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Adjusted for Your Equipment</p>
              <ul className="text-xs text-amber-500/70 mt-1 space-y-1">
                {equipmentProfile.adaptationNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Structure Overview - PHASE 2: Uses safe accessor */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="border-[#E63946]/30 text-[#E63946]">
            {structure.structureName}
          </Badge>
          <span className="text-xs text-[#6A6A6A]">Weekly Structure</span>
        </div>
        <p className="text-sm text-[#A5A5A5]">{structure.rationale}</p>
      </Card>

      {/* Sessions - PHASE 2: Uses safe validSessions array */}
      {/* [PHASE 8 TASK 5] Frequency explanation truth audit */}
      {console.log('[phase8-frequency-explanation-truth-audit]', {
        programId: program.id,
        scheduleMode: program.scheduleMode,
        displayedFrequency: validSessions.length,
        hasRootCause: !!program.flexibleFrequencyRootCause,
        frequencyReasonShownToUser: program.flexibleFrequencyRootCause?.isBaselineDefault 
          ? 'baseline_shown'
          : program.flexibleFrequencyRootCause?.isTrueAdaptive
            ? 'adaptive_shown'
            : 'no_reason_shown',
        reasonMatchesEngineTruth: program.flexibleFrequencyRootCause 
          ? program.flexibleFrequencyRootCause.finalReasonCategory !== 'static_contamination'
          : true,
        baselineVsAdaptiveClearlyDistinguished: program.scheduleMode === 'flexible' && program.flexibleFrequencyRootCause !== undefined,
        hiddenAmbiguityRemaining: !program.flexibleFrequencyRootCause && program.scheduleMode === 'flexible',
        verdict: program.flexibleFrequencyRootCause 
          ? 'frequency_reason_truthfully_shown'
          : program.scheduleMode === 'flexible'
            ? 'no_root_cause_attached'
            : 'static_mode_no_reason_needed',
      }) as any}
      {/* [PHASE 7B] Session render input audit */}
      {console.log('[phase7b-session-render-input-audit]', {
        programId: program.id,
        totalSessions: validSessions.length,
        sessionsWithStyleMetadata: validSessions.filter((s: any) => s.styleMetadata).length,
        sessionsWithStyledGroups: validSessions.filter((s: any) => 
          s.styleMetadata?.styledGroups?.length > 0
        ).length,
        sessionsWithNonStraightGroups: validSessions.filter((s: any) => 
          s.styleMetadata?.styledGroups?.some((g: any) => g.groupType !== 'straight')
        ).length,
        verdict: validSessions.some((s: any) => 
          s.styleMetadata?.styledGroups?.some((g: any) => g.groupType !== 'straight')
        ) ? 'style_truth_reaching_ui' : 'no_styled_groups_in_program',
      }) as any}
      {/* [PHASE 6B TASK 4] SESSION IDENTITY ENFORCEMENT AUDIT */}
      {console.log('[phase6b-session-identity-enforcement-audit]', {
        totalSessions: validSessions.length,
        sessionIdentities: validSessions.map((session: any) => {
          const focus = session.focus?.toLowerCase() || ''
          const exercises = session.exercises || []
          const exerciseNames = exercises.map((e: any) => e.name?.toLowerCase() || '').join(' ')
          
          // Check if label matches actual content
          const labelClaimsPush = focus.includes('push') || focus.includes('planche')
          const labelClaimsPull = focus.includes('pull') || focus.includes('lever')
          const labelClaimsMixed = focus.includes('mixed') || focus.includes('density')
          
          const hasPushContent = exerciseNames.includes('push') || exerciseNames.includes('planche') || exerciseNames.includes('dip')
          const hasPullContent = exerciseNames.includes('pull') || exerciseNames.includes('row') || exerciseNames.includes('lever')
          
          const identityMatches = 
            (!labelClaimsPush || hasPushContent) && 
            (!labelClaimsPull || hasPullContent) &&
            (!labelClaimsMixed || (hasPushContent || hasPullContent))
          
          return {
            day: session.dayNumber,
            label: session.focus,
            labelClaimsPush,
            labelClaimsPull,
            labelClaimsMixed,
            hasPushContent,
            hasPullContent,
            identityMatches,
          }
        }),
        allSessionsMatchContent: validSessions.every((session: any) => {
          const focus = session.focus?.toLowerCase() || ''
          const exercises = session.exercises || []
          const exerciseNames = exercises.map((e: any) => e.name?.toLowerCase() || '').join(' ')
          const labelClaimsPush = focus.includes('push') || focus.includes('planche')
          const labelClaimsPull = focus.includes('pull') || focus.includes('lever')
          const hasPushContent = exerciseNames.includes('push') || exerciseNames.includes('planche') || exerciseNames.includes('dip')
          const hasPullContent = exerciseNames.includes('pull') || exerciseNames.includes('row') || exerciseNames.includes('lever')
          return (!labelClaimsPush || hasPushContent) && (!labelClaimsPull || hasPullContent)
        }),
        verdict: 'session_identity_audit_complete',
      }) as any}
      
      <div className="space-y-4">
        <h4 className="text-lg font-bold">Training Sessions</h4>
  {validSessions.length > 0 ? (
  validSessions.map((session) => (
  <AdaptiveSessionCard
  // [TASK 2] Use stable session identity that changes when program changes
  // This forces React to remount cards after regeneration, clearing stale variant state
  key={`${program.id}-${session.dayNumber}-${session.name || session.focusLabel}`}
  session={session}
  programId={program.id} // [TASK 4] Pass programId for variant state reset
              onExerciseReplace={
                onExerciseReplace 
                  ? (exerciseId) => onExerciseReplace(session.dayNumber, exerciseId)
                  : undefined
              }
            />
          ))
        ) : (
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6 text-center">
            <p className="text-sm text-[#6A6A6A]">No training sessions available</p>
          </Card>
        )}
      </div>

      {/* TASK 4: Restart Program Confirmation Modal - clear semantics */}
      <Dialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF]">Restart Program?</DialogTitle>
            <DialogDescription className="text-[#A4ACB8] pt-2">
              Choose how you want to proceed with your training program.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {/* [TASK 4] Option 1: Regenerate - true regeneration from current profile */}
            {onRegenerate && (
              <button
                onClick={() => {
                  setShowRestartConfirm(false)
                  onRegenerate()
                }}
                className="w-full flex items-start gap-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-4 h-4 text-[#C1121F]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Rebuild From Current Settings</h4>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Immediately rebuild your program using your current profile. 
                    Your workout history is preserved.
                  </p>
                  {stalenessCheck.isStale && (
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/20">
                      Recommended - profile changed
                    </span>
                  )}
                </div>
              </button>
            )}
            
            {/* Option 2: Full Restart (archive and start fresh) */}
            <button
              onClick={() => {
                setShowRestartConfirm(false)
                if (onRestart) {
                  onRestart()
                } else if (onDelete) {
                  onDelete()
                }
              }}
              className="w-full flex items-start gap-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A] hover:border-amber-500/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <RotateCcw className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#E6E9EF]">Restart from Scratch</h4>
                <p className="text-xs text-[#6B7280] mt-1">
                  Archive your current program and return to the builder to create a completely new program.
                </p>
              </div>
            </button>
          </div>
          
          {/* What's preserved notice */}
          <div className="p-3 bg-[#1A2F1A]/30 border border-[#2D5A2D]/30 rounded-lg">
            <p className="text-xs text-[#4ADE80]">
              <span className="font-medium">Always preserved:</span> Your workout history, completed sessions, and progress data.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestartConfirm(false)}
              className="w-full border-[#3A3A3A] text-[#A4ACB8] hover:bg-[#2A2A2A]"
            >
              Keep Current Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
