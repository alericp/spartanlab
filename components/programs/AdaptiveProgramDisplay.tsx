'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { AdaptiveSessionCard } from './AdaptiveSessionCard'
import { WhyThisPlanBlock } from './WhyThisWorkoutBlock'
import type { UnifiedStalenessResult } from '@/lib/canonical-profile-service'
import { 
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  Target,
  Calendar,
  Dumbbell,
  TrendingUp,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { 
  consumePendingScheduleNotice, 
  evaluateActiveWeekMutation,
  getCompletedSessionDayNumbers,
  runPhase13FinalVerdict,
  type ScheduleChangeNotice,
} from '@/lib/active-week-mutation-service'
import { runAdaptiveDisplayParityAudit } from '@/lib/adaptive-display-contract'
import { 
  buildProgramIntelligenceContract, 
  getProgramSurfaceSignals,
  getSessionSurfaceSignals,
  buildAllSessionCardSurfaces,
  type ProgramIntelligenceContract,
  type SessionCardSurface,
} from '@/lib/program/program-display-contract'
import { getCompactSessionExplanation } from '@/lib/coaching-explanation-contract'
import { 
  advanceToNextWeek, 
  advanceToWeek,
  getWeekProgressionState,
  type WeekProgressionState,
  type WeekAdvancementResult,
} from '@/lib/week-advancement-service'
import { Info, Sparkles, Shield, Scale, Layers, ChevronRight, ArrowRight, Loader2, ChevronLeft, Zap } from 'lucide-react'
import { 
  getWeekDosageScaling, 
  scaleSessionsForWeek, 
  getWeekPhaseLabel, 
  getWeekVolumeIndicator,
  type ScaledSession 
} from '@/lib/week-dosage-scaling'

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
  
  // Why This Fits You - premium explanation sheet state
  const [showWhySheet, setShowWhySheet] = useState(false)
  
  // [PHASE 13] Schedule change notice state
  const [scheduleNotice, setScheduleNotice] = useState<ScheduleChangeNotice | null>(null)
  
  // [WEEK-ADVANCEMENT] Week progression state for advancing to next week
  const [weekProgression, setWeekProgression] = useState<WeekProgressionState | null>(null)
  const [isAdvancingWeek, setIsAdvancingWeek] = useState(false)
  const [weekAdvancementResult, setWeekAdvancementResult] = useState<WeekAdvancementResult | null>(null)
  
  // Premium explanation contract - doctrine-driven intelligence
  const intelligenceContract: ProgramIntelligenceContract | null = program 
    ? buildProgramIntelligenceContract(program) 
    : null
  
  // [SURFACE-SIGNALS] Compact surface signals for main card display
  const programSurfaceSignals = program ? getProgramSurfaceSignals(program) : null
  
  // ==========================================================================
  // [PHASE 15A-HOTFIX] SAFE DISPLAY VIEW-MODEL - MOVED ABOVE useEffects
  // These MUST be declared before any useEffect that references them
  // to avoid TDZ (Temporal Dead Zone) errors
  // 
  // ROOT CAUSE OF TDZ BUG:
  // - Phase 15A added audit logs to useEffect at ~line 112-171
  // - These logs referenced safeSelectedSkills, safeRepresentedSkills, safeSummaryTruth
  // - Those variables were declared AFTER the useEffect (~line 180-199)
  // - JavaScript hoists const/let but doesn't initialize until declaration
  // - Accessing them in useEffect deps array caused TDZ error
  // - Minified as 'ee' in production build
  //
  // [phase15a-hotfix-tdz-source-map-audit]:
  //   file: components/programs/AdaptiveProgramDisplay.tsx
  //   minifiedSymbol: 'ee'
  //   realSymbol: 'safeSelectedSkills' (or safeRepresentedSkills/safeSummaryTruth)
  //   location: useEffect dependency array at line 171
  //   declaredAt: line 187 (was after the useEffect)
  //
  // [phase15a-hotfix-real-symbol-identity-audit]:
  //   minified: 'ee'
  //   actual: safeSelectedSkills, safeRepresentedSkills, safeSummaryTruth
  //   type: const declarations
  //   issue: used in useEffect before declaration
  //
  // [phase15a-hotfix-root-cause-classification-verdict]:
  //   category: pre-declaration-access
  //   cause: Phase 15A audit logs added to useEffect referenced safe* locals
  //   fix: move safe* locals declarations above the useEffect
  //   risk: none - pure ordering change, no logic change
  //
  // [phase15a-hotfix-ordering-hazard-removed-audit]: declarations moved above consumers
  // ==========================================================================
  
  // Get training days and displayed label
  const trainingDaysPerWeek = (program as unknown as { trainingDaysPerWeek?: number | string }).trainingDaysPerWeek
  const displayedScheduleLabelText = program.scheduleMode === 'flexible' 
    ? 'Adaptive' 
    : `${trainingDaysPerWeek} days/week`
  
  // Get raw program fields with type assertions for optional fields
  const rawSelectedSkills = (program as unknown as { selectedSkills?: string[] }).selectedSkills
  const rawRepresentedSkills = (program as unknown as { representedSkills?: string[] }).representedSkills
  const rawSummaryTruth = (program as unknown as { summaryTruth?: object }).summaryTruth
  const rawWeeklyRepresentation = (program as unknown as { weeklyRepresentation?: object }).weeklyRepresentation
  
  // Build safe locals from raw fields - NO self-references allowed
  const safeSelectedSkills = Array.isArray(rawSelectedSkills) ? rawSelectedSkills : []
  const safeSessions = Array.isArray(program.sessions) 
    ? program.sessions.filter(s => s && typeof s === 'object') 
    : []
  // [PHASE 15C-HOTFIX] validSessions MUST be declared here, BEFORE any useEffect that references it
  // ROOT CAUSE: Phase 15C added useEffect audits at ~line 246/289 that referenced validSessions.length
  // But validSessions was declared at line 713, causing TDZ error (minified as 'ew')
  const validSessions = safeSessions.filter(s => Array.isArray(s.exercises))
  
  // ==========================================================================
  // [WEEK-PROGRESSION-TRUTH] Apply week-specific dosage scaling
  // Week 1 uses stored acclimation values, Week 2+ get progressively scaled dosage
  // CRITICAL FIX: Use weekProgression?.currentWeek as AUTHORITATIVE source when available
  // This ensures UI updates immediately when user changes week via navigation
  // ==========================================================================
  const currentWeekNumber = weekProgression?.currentWeek ?? program.weekNumber ?? 1
  const weekDosageScaling = getWeekDosageScaling(currentWeekNumber)
  const scaledSessions: ScaledSession[] = scaleSessionsForWeek(validSessions, currentWeekNumber)
  const weekVolumeIndicator = getWeekVolumeIndicator(currentWeekNumber)
  const weekPhaseLabel = getWeekPhaseLabel(currentWeekNumber)
  

  
  const safeRepresentedSkills = Array.isArray(rawRepresentedSkills) ? rawRepresentedSkills : []
  const safeSummaryTruth = rawSummaryTruth && typeof rawSummaryTruth === 'object'
    ? (rawSummaryTruth as { 
        headlineFocusSkills?: string[]
        weekRepresentedSkills?: string[]
        weekSupportSkills?: string[]
        truthfulHybridSummary?: string
        profileSelectedSkills?: string[]
        summaryRenderableSkills?: string[]
      })
    : null
  const safeWeeklyRepresentation = rawWeeklyRepresentation && typeof rawWeeklyRepresentation === 'object'
    ? rawWeeklyRepresentation
    : null
  
  // Build authoritative per-card display surfaces
  const sessionCardSurfaces: SessionCardSurface[] = validSessions.length > 0
    ? buildAllSessionCardSurfaces(
        validSessions as Parameters<typeof buildAllSessionCardSurfaces>[0],
        {
          isFirstWeek: program.weekAdaptationDecision?.firstWeekGovernor?.active ?? false,
          adaptationPhase: program.weekAdaptationDecision?.phase,
          totalSessions: validSessions.length,
          primaryGoal: program.primaryGoal,
          secondaryGoal: program.secondaryGoal,
        }
      )
    : []
  
  // Build render context for skills
  const renderPrimaryGoal = program.primaryGoal
  const renderSecondaryGoal = program.secondaryGoal
  const renderSelectedSkills = safeSelectedSkills
  const summaryTextRaw = safeSummaryTruth?.truthfulHybridSummary || program.programRationale || ''
  
  // Dominant spine resolution from builder
  const dominantSpineResolution = program.dominantSpineResolution || null
  
  // [PHASE 13] Listen for workout completion and check for pending notices
  useEffect(() => {
    // Check for pending notice on mount
    const pendingNotice = consumePendingScheduleNotice()
    if (pendingNotice && pendingNotice.type !== 'no_change') {
      setScheduleNotice(pendingNotice)
    }
    
    // Listen for workout logged events
    const handleWorkoutLogged = (event: CustomEvent) => {
      const { programId } = event.detail || {}
      
      if (programId && program.id?.includes(programId)) {
        // Evaluate active week mutation
        const completedDays = getCompletedSessionDayNumbers(program.id)
        const mutationResult = evaluateActiveWeekMutation(program, completedDays)
        
        // Run final verdict audit
        runPhase13FinalVerdict(mutationResult)
        
        // Show notice if mutation happened
        if (mutationResult.noticePayload && mutationResult.applied) {
          setScheduleNotice(mutationResult.noticePayload)
        }
      }
    }
    
    window.addEventListener('spartanlab:workout-logged', handleWorkoutLogged as EventListener)
    
    return () => {
      window.removeEventListener('spartanlab:workout-logged', handleWorkoutLogged as EventListener)
    }
  }, [program.id, program])
  
  // [WEEK-ADVANCEMENT] Load week progression state and listen for advancement events
  useEffect(() => {
    // Load current week progression state
    const state = getWeekProgressionState()
    setWeekProgression(state)
    
    // Listen for week advancement events to update state
    const handleWeekAdvanced = () => {
      const newState = getWeekProgressionState()
      setWeekProgression(newState)
      // Clear any previous advancement result after a short delay
      setTimeout(() => setWeekAdvancementResult(null), 3000)
    }
    
    window.addEventListener('spartanlab:week-advanced', handleWeekAdvanced)
    
    return () => {
      window.removeEventListener('spartanlab:week-advanced', handleWeekAdvanced)
    }
  }, [program.id])
  
  // [WEEK-ADVANCEMENT] Handler for advancing to next week
  const handleAdvanceWeek = async () => {
    setIsAdvancingWeek(true)
    setWeekAdvancementResult(null)
    
    try {
      const result = advanceToNextWeek()
      setWeekAdvancementResult(result)
      
      if (result.success) {
        // Update local state immediately
        const newState = getWeekProgressionState()
        setWeekProgression(newState)
      }
    } catch (err) {
      console.error('Error advancing week:', err)
      setWeekAdvancementResult({
        success: false,
        previousWeek: weekProgression?.currentWeek || 1,
        newWeek: weekProgression?.currentWeek || 1,
        programId: program.id,
        advancedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsAdvancingWeek(false)
    }
  }
  
  // [WEEK-ADVANCEMENT] Handler for going to a specific week (forward or backward)
  const handleGoToWeek = async (targetWeek: number) => {
    setIsAdvancingWeek(true)
    setWeekAdvancementResult(null)
    
    try {
      const result = advanceToWeek(targetWeek)
      setWeekAdvancementResult(result)
      
      if (result.success) {
        // Update local state immediately
        const newState = getWeekProgressionState()
        setWeekProgression(newState)
      }
    } catch (err) {
      console.error('Error changing week:', err)
      setWeekAdvancementResult({
        success: false,
        previousWeek: weekProgression?.currentWeek || 1,
        newWeek: weekProgression?.currentWeek || 1,
        programId: program.id,
        advancedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsAdvancingWeek(false)
    }
  }
  
  // Run adaptive display parity audit when program renders
  useEffect(() => {
    const displayedScheduleLabel = program.scheduleMode === 'flexible' ? 'Adaptive' : `${program.trainingDaysPerWeek} days/week`
    const displayedDurationLabel = program.sessionDurationMode === 'adaptive' ? 'Adaptive' : `${program.sessionLength} min`
    
    runAdaptiveDisplayParityAudit(
      'AdaptiveProgramDisplay',
      program.scheduleMode,
      program.trainingDaysPerWeek,
      program.sessionDurationMode,
      program.sessionLength,
      displayedScheduleLabel,
      displayedDurationLabel
    )
  }, [program.scheduleMode, program.sessionDurationMode, program.trainingDaysPerWeek, program.sessionLength])
  
  // Additional safe locals
  const safePlannerTruthAudit = program.plannerTruthAudit || null
  const safeFlexibleRootCause = program.flexibleFrequencyRootCause || null
  
  // Hoisted chip truth locals - true component render scope
  // These must be defined OUTSIDE the built-around IIFE so Phase 7 audits can access them
  // ==========================================================================
  
  // A. Compute representedSkills from server or client fallback
  const sharedRepresentedSkills: string[] = (() => {
    if (safeRepresentedSkills.length > 0) {
      return safeRepresentedSkills
    }
    // Client-side fallback computation
    const allExerciseNames = safeSessions.flatMap(s => 
      s.exercises?.map(e => (e.exercise?.name || '').toLowerCase()) || []
    ) || []
    
    const skillKeywords: Record<string, string[]> = {
      'planche': ['planche', 'lean', 'tuck', 'pseudo'],
      'front_lever': ['front lever', 'front-lever', 'tuck lever', 'adv tuck'],
      'back_lever': ['back lever', 'back-lever', 'german hang'],
      'handstand': ['handstand', 'pike', 'wall walk', 'freestanding'],
      'muscle_up': ['muscle up', 'muscle-up', 'transition'],
    }
    
    return safeSelectedSkills.filter(skill => {
      const keywords = skillKeywords[skill] || [skill.replace(/_/g, ' ')]
      return keywords.some(kw => allExerciseNames.some(name => name.includes(kw)))
    })
  })()
  
  // B. Compute unrepresentedSkills
  const sharedUnrepresentedSkills = safeSelectedSkills.filter(s => !sharedRepresentedSkills.includes(s))
  
  // C. Compute headline skills
  const sharedHeadlineSkills = safeSummaryTruth.headlineFocusSkills || [program.primaryGoal, program.secondaryGoal].filter(Boolean)
  
  // D. Compute week support skills
  const sharedWeekSupportSkills = safeSummaryTruth.weekSupportSkills || []
  
  // E. ChipState type and getChipState helper
  type SharedChipState = 'headline_priority' | 'represented_broader' | 'support_only' | 'selected_not_represented'
  
  const getSharedChipState = (skill: string): SharedChipState => {
    // ==========================================================================
    // [PHASE 24P] CRITICAL FIX: Check headline identity FIRST, before weeklyRepresentation
    // Primary and secondary goals are always headline_priority regardless of week-level expression
    // This prevents secondary goals from being downgraded by stricter representation thresholds
    // ==========================================================================
    const isHeadlineIdentity = sharedHeadlineSkills.includes(skill)
    if (isHeadlineIdentity) {
      return 'headline_priority'
    }
    
    // For non-headline skills, check weekly representation policies if available
    if (safeWeeklyRepresentation?.policies) {
      const policy = safeWeeklyRepresentation.policies.find(p => p.skill === skill)
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
    
    // Fallback to summary truth based logic for non-headline skills
    if (sharedRepresentedSkills.includes(skill)) return 'represented_broader'
    if (sharedWeekSupportSkills.includes(skill)) return 'support_only'
    return 'selected_not_represented'
  }
  
  // F. Compute sharedStrictRepresentedSkillsForChips - THE KEY HOISTED LOCAL
  // [VISIBLE-PROGRAM-TRUTH-CONTRACT] This is the SINGLE owner of "Built around" chip content
  // Only skills that meet strict representation thresholds appear as chips
  const sharedStrictRepresentedSkillsForChips = safeSelectedSkills.filter(skill => {
    const chipState = getSharedChipState(skill)
    const policy = safeWeeklyRepresentation?.policies?.find(p => p.skill === skill)
    const directExposure = policy?.actualExposure?.direct || 0
    const totalExposure = policy?.actualExposure?.total || 0
    
    // [PHASE 6B TASK 2] TIGHTENED MEANINGFUL REPRESENTATION THRESHOLDS
    const isHeadline = chipState === 'headline_priority'
    const hasMeaningfulDirect = directExposure >= 2
    const hasSignificantTotal = totalExposure >= 3
    const isRepresentedBroaderWithSubstance = chipState === 'represented_broader' && (hasMeaningfulDirect || hasSignificantTotal)
    
    // [VISIBLE-PROGRAM-TRUTH-CONTRACT] TASK 3 - TIGHTER FALLBACK
    // When weeklyRepresentation policies are unavailable, ONLY show headline skills
    // Do NOT show broader skills from fallback client-side exercise name matching
    // This prevents stale/generic chips when canonical truth is unavailable
    const hasWeeklyRepPolicies = safeWeeklyRepresentation?.policies && safeWeeklyRepresentation.policies.length > 0
    
    if (!hasWeeklyRepPolicies) {
      // Fallback: only headline identity chips, no others
      return isHeadline
    }
    
    return isHeadline || isRepresentedBroaderWithSubstance
  })
  
  // ==========================================================================
  // [SKILL-REPRESENTATION-TRUTH] PART B: Show ALL selected skills with representation labels
  // Skills that don't meet strict threshold are still shown but labeled as indirect/support
  // This ensures NO SKILL SILENTLY DISAPPEARS
  // ==========================================================================
  type SkillRepresentationType = 'primary' | 'direct' | 'support' | 'accessory'
  
  interface SkillWithRepresentation {
    skill: string
    representationType: SkillRepresentationType
    label: string
    isPrimary: boolean
  }
  
  const allSelectedSkillsWithRepresentation: SkillWithRepresentation[] = safeSelectedSkills.map(skill => {
    const chipState = getSharedChipState(skill)
    const policy = (safeWeeklyRepresentation as { policies?: Array<{ skill: string; actualExposure?: { direct?: number; total?: number } }> })?.policies?.find(p => p.skill === skill)
    const directExposure = policy?.actualExposure?.direct || 0
    const totalExposure = policy?.actualExposure?.total || 0
    
    const isHeadline = chipState === 'headline_priority'
    const hasMeaningfulDirect = directExposure >= 2
    const hasSignificantTotal = totalExposure >= 3
    
    // Determine representation type
    let representationType: SkillRepresentationType
    let label: string
    
    if (isHeadline) {
      representationType = 'primary'
      label = skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    } else if (hasMeaningfulDirect) {
      representationType = 'direct'
      label = skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    } else if (hasSignificantTotal || chipState === 'support_only' || sharedWeekSupportSkills.includes(skill)) {
      representationType = 'support'
      label = `${skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} (Support)`
    } else {
      // Still selected but only represented through accessory/carryover work
      representationType = 'accessory'
      label = `${skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} (Accessory)`
    }
    
    return {
      skill,
      representationType,
      label,
      isPrimary: isHeadline,
    }
  })
  
  // Separate into primary/direct skills and support/accessory skills
  const primaryDirectSkills = allSelectedSkillsWithRepresentation.filter(
    s => s.representationType === 'primary' || s.representationType === 'direct'
  )
  const supportAccessorySkills = allSelectedSkillsWithRepresentation.filter(
    s => s.representationType === 'support' || s.representationType === 'accessory'
  )
  

  
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
  
  // Determine session structure for variant handling
  const hasVariants = validSessions.some(s => s.variants && s.variants.length > 1)

  return (
    <div className="space-y-4">
      {/* Program Command Header - Premium coaching dashboard */}
      <Card className="bg-gradient-to-b from-[#2A2A2A] to-[#252525] border-[#3A3A3A] overflow-hidden">
        {/* Hero Zone - Program Identity */}
        <div className="relative px-4 pt-4 pb-3">
          {/* Subtle accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E63946]/40 to-transparent" />
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Truthful Program Title - reflects actual week content */}
              <div className="flex items-center gap-2.5 mb-1">
                <h3 className="text-xl font-bold tracking-tight">
                  {/* Show primary + secondary if both exist, otherwise just goalLabel */}
                  {program.secondaryGoal 
                    ? `${program.goalLabel?.split(' ')[0] || program.primaryGoal?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} + ${program.secondaryGoal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
                    : program.goalLabel}
                </h3>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#E63946]/70 px-2 py-0.5 bg-[#E63946]/10 rounded">
                  Active
                </span>
              </div>
              {/* Training architecture with decision clarity */}
              <p className="text-sm text-[#8A8A8A]">
                {intelligenceContract?.strategicSummary?.architectureLabel 
                  ? `${intelligenceContract.strategicSummary.architectureLabel} · `
                  : intelligenceContract?.trainingSpine?.label 
                    ? `${intelligenceContract.trainingSpine.label} · `
                    : ''}
                {validSessions.length} days/week · {program.sessionLength || 60}min sessions
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* Why This Fits You - premium explanation trigger */}
              <Button
                variant="ghost"
                size="sm"
                className="text-[#6A6A6A] hover:text-[#E63946] h-8 w-8 p-0 rounded-full hover:bg-[#E63946]/10"
                onClick={() => setShowWhySheet(true)}
                title="Why this program fits you"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              {(onRestart || onDelete) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#5A5A5A] hover:text-amber-400 h-8 w-8 p-0 rounded-full hover:bg-[#333]"
                  onClick={() => setShowRestartConfirm(true)}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Compact Summary Strip - key facts at a glance */}
        <div className="px-4 py-2.5 bg-[#1E1E1E]/40 border-t border-[#333]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-[#E63946]" />
                <span className="text-[#C8C8C8] font-medium capitalize">{program.experienceLevel}</span>
              </div>
              <div className="w-px h-3 bg-[#3A3A3A]" />
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#6A6A6A]" />
                <span className="text-[#9A9A9A]">{program.scheduleMode === 'flexible' ? 'Adaptive' : 'Fixed'} schedule</span>
              </div>
              {/* Premium confidence indicator */}
              {intelligenceContract?.premiumConfidence && (
                <>
                  <div className="w-px h-3 bg-[#3A3A3A]" />
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      intelligenceContract.premiumConfidence.level === 'high' ? 'bg-green-500' :
                      intelligenceContract.premiumConfidence.level === 'moderate' ? 'bg-amber-500' :
                      'bg-[#5A5A5A]'
                    }`} />
                    <span className="text-[#6A6A6A] text-[10px]">
                      {intelligenceContract.premiumConfidence.level === 'high' ? 'High confidence' :
                       intelligenceContract.premiumConfidence.level === 'moderate' ? 'Good confidence' :
                       'Building confidence'}
                    </span>
                  </div>
                </>
              )}
            </div>
            {/* Learn more link */}
            <button 
              onClick={() => setShowWhySheet(true)}
              className="text-[10px] text-[#E63946]/70 hover:text-[#E63946] font-medium uppercase tracking-wide"
            >
              View decisions
            </button>
          </div>
        </div>
        
        {/* [SKILL-REPRESENTATION-TRUTH] All Skills Focus - Show ALL selected skills with representation type */}
        {safeSelectedSkills.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[#333]/30">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#5A5A5A] uppercase tracking-wide font-medium mr-1">Your Goals</span>
              {/* Primary/Direct Skills - shown prominently */}
              {primaryDirectSkills.map(({ skill, representationType, isPrimary }) => (
                <span 
                  key={skill}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                    isPrimary 
                      ? 'bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/25' 
                      : 'bg-[#1A1A1A] text-[#8A8A8A] border border-[#333]'
                  }`}
                >
                  {skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              ))}
              {/* Support/Accessory Skills - visually distinct styling per type */}
              {supportAccessorySkills.map(({ skill, representationType }) => (
                <span 
                  key={skill}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                    representationType === 'support'
                      ? 'bg-amber-500/8 text-amber-400/80 border border-amber-500/15'
                      : 'bg-[#1A1A1A]/50 text-[#6A6A6A] border border-[#2A2A2A]'
                  }`}
                  title={representationType === 'support' 
                    ? 'Developed through support work this week' 
                    : 'Developed through accessory/carryover work'}
                >
                  {skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              ))}
            </div>

          </div>
        )}
        
        {/* [WEEK-ADVANCEMENT] Week Progression Control - Safe advancement without regeneration */}
        {weekProgression && (
          <div className="px-4 py-2.5 border-t border-[#333]/30 bg-[#1A1A1A]/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Week number with phase label */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#C8C8C8]">
                    Week {weekProgression.currentWeek}
                  </span>
                  <span className="text-[10px] text-[#6A6A6A]">
                    of {weekProgression.totalWeeksInCycle}
                  </span>
                </div>
                
                {/* [WEEK-PROGRESSION-TRUTH] Phase label chip */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium ${
                  weekPhaseLabel === 'Acclimation' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : weekPhaseLabel === 'Ramp Up'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : weekPhaseLabel === 'Peak'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                }`}>
                  <Zap className="w-2.5 h-2.5" />
                  {weekPhaseLabel}
                </span>
                
                {/* Volume indicator */}
                <span className="text-[9px] text-[#5A5A5A]">
                  {weekVolumeIndicator.percentage}% volume
                </span>
              </div>
              
              {/* Week navigation buttons */}
              <div className="flex items-center gap-1.5">
                {/* Go back button */}
                {weekProgression.currentWeek > 1 && (
                  <button
                    onClick={() => handleGoToWeek(weekProgression.currentWeek - 1)}
                    disabled={isAdvancingWeek}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#6A6A6A] hover:text-[#8A8A8A] bg-[#1A1A1A] hover:bg-[#252525] rounded border border-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Go back to Week ${weekProgression.currentWeek - 1}`}
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Week {weekProgression.currentWeek - 1}</span>
                  </button>
                )}
                
                {/* Advance button */}
                {weekProgression.canAdvance ? (
                  <button
                    onClick={handleAdvanceWeek}
                    disabled={isAdvancingWeek}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#E63946] bg-[#E63946]/10 hover:bg-[#E63946]/20 rounded-md border border-[#E63946]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdvancingWeek ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Advancing...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Week {weekProgression.currentWeek + 1}</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[10px] text-[#5A5A5A]">
                    {weekProgression.cannotAdvanceReason || 'Final week'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Success/Error feedback */}
            {weekAdvancementResult && (
              <div className={`mt-2 text-[10px] ${weekAdvancementResult.success ? 'text-green-500' : 'text-amber-500'}`}>
                {weekAdvancementResult.success 
                  ? `Advanced to Week ${weekAdvancementResult.newWeek}`
                  : weekAdvancementResult.error || 'Could not advance week'}
              </div>
            )}
          </div>
        )}
        
        {/* [MAIN-PAGE-AI-VISIBILITY] Weekly Intelligence Strip - visible without opening modal */}
        {intelligenceContract && (
          <div className="px-4 py-3 border-t border-[#333]/30 bg-[#1A1A1A]/30">
            {/* [SURFACE-SIGNALS] Protective week dosage banner - only when real prescription changes applied */}
            {programSurfaceSignals?.isProtectiveWeek && programSurfaceSignals.signals.length > 0 && (
              <div className="mb-2.5 flex items-start gap-2 p-2 rounded-md bg-[#E63946]/5 border border-[#E63946]/15">
                <Shield className="w-3.5 h-3.5 text-[#E63946]/70 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {programSurfaceSignals.dosageMessage && (
                    <p className="text-[11px] text-[#E63946]/90 font-medium leading-snug">
                      {programSurfaceSignals.dosageMessage}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    {programSurfaceSignals.signals.map((signal, i) => (
                      <span key={i} className="text-[10px] text-[#9A9A9A]">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* [COACHING-EXPLANATION-CONTRACT] PRIMARY VISIBLE IMPACT: Coach-style headline */}
            {/* Priority 1: Use authoritative coaching headline */}
            {/* Priority 2: Fall back to strategic summary if coaching unavailable */}
            {intelligenceContract.coachingExplanation?.program?.headline ? (
              <p className="text-[13px] text-[#C8C8C8] font-medium leading-relaxed mb-2.5">
                {intelligenceContract.coachingExplanation.program.headline}
              </p>
            ) : intelligenceContract.strategicSummary?.headline && (
              <p className="text-xs text-[#A4ACB8] leading-relaxed mb-2.5">
                {intelligenceContract.strategicSummary.headline}
              </p>
            )}
            
            {/* Weekly structure signals - compact row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px]">
              {/* Structure identity */}
              {intelligenceContract.weeklyDecisionLogic?.structureIdentity && (
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#E63946]/60" />
                  <span className="text-[#8A8A8A]">{intelligenceContract.weeklyDecisionLogic.structureIdentity}</span>
                </div>
              )}
              
              {/* Primary tradeoff */}
              {intelligenceContract.tradeoffs?.[0] && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500/50" />
                  <span className="text-[#7A7A7A]">{intelligenceContract.tradeoffs[0].prioritized}</span>
                  <span className="text-[#4A4A4A]">/</span>
                  <span className="text-[#5A5A5A]">{intelligenceContract.tradeoffs[0].limited}</span>
                </div>
              )}
              
              {/* Protected constraint */}
              {intelligenceContract.protectedConstraints?.[0] && (
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-amber-500/50" />
                  <span className="text-[#6A6A6A]">{intelligenceContract.protectedConstraints[0].label}</span>
                </div>
              )}
            </div>
            
            {/* Key architectural decision (if any) - skip if already showing in surface signals */}
            {intelligenceContract.weeklyDecisionLogic?.architecturalDecisions?.[0] && 
             !programSurfaceSignals?.isProtectiveWeek && (
              <p className="mt-2 text-[10px] text-[#5A5A5A] leading-relaxed">
                {intelligenceContract.weeklyDecisionLogic.architecturalDecisions[0]}
              </p>
            )}
          </div>
        )}
        
        {/* Quality notice - only show when significant */}
        {program.plannerTruthAudit?.shouldWarn && 
         program.plannerTruthAudit.topIssueReason && 
         program.plannerTruthAudit.topIssueReason !== 'none' &&
         program.plannerTruthAudit.overallScore !== undefined &&
         program.plannerTruthAudit.overallScore < 70 && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-400/90 line-clamp-1">
              {program.plannerTruthAudit.topIssueDescription || 'Some preferences may not be fully reflected'}
            </p>
          </div>
        )}
      </Card>

      {/* [PHASE 13 TASK 6] Schedule Change Notice - only shown after real mutation */}
      {scheduleNotice && scheduleNotice.type !== 'no_change' && (
        <div className="mb-4 p-3 rounded-lg bg-[#1A2A1A] border border-[#2A3A2A]">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#E6E9EF]">
                {scheduleNotice.headline}
              </p>
              <p className="text-xs text-[#8A9A8A] mt-0.5">
                {scheduleNotice.reason}
              </p>
              {scheduleNotice.preservedCompleted && (
                <p className="text-[10px] text-[#6A7A6A] mt-1">
                  Completed sessions preserved
                </p>
              )}
            </div>
            <button 
              onClick={() => setScheduleNotice(null)}
              className="text-[#6A7A6A] hover:text-[#9AAA9A] transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* [MAIN-PAGE-AI-VISIBILITY] Section header with session count and structure hint */}
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-[#B5B5B5]">
            Weekly Structure
            <span className="ml-2 text-xs font-normal text-[#6A6A6A]">
              {validSessions.length} sessions
            </span>
          </h4>
          {intelligenceContract?.weeklyDecisionLogic?.frequencyReason && (
            <span className="text-[10px] text-[#5A5A5A] max-w-[180px] text-right leading-tight">
              {intelligenceContract.weeklyDecisionLogic.frequencyReason.split('.')[0]}
            </span>
          )}
        </div>
        
        {/* [MAIN-PAGE-AI-VISIBILITY] Compact tradeoffs summary - visible without modal */}
        {intelligenceContract?.tradeoffs && intelligenceContract.tradeoffs.length > 1 && (
          <div className="p-2.5 bg-[#1A1A1A]/50 rounded-lg border border-[#2A2A2A]">
            <div className="flex items-center gap-1.5 mb-2">
              <Scale className="w-3 h-3 text-[#E63946]/50" />
              <span className="text-[10px] text-[#7A7A7A] font-medium uppercase tracking-wide">Design Tradeoffs</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {intelligenceContract.tradeoffs.slice(0, 3).map((tradeoff, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] bg-[#222]/60 px-2 py-1 rounded">
                  <span className="text-green-500/70">+</span>
                  <span className="text-[#8A8A8A]">{tradeoff.prioritized}</span>
                  <span className="text-[#3A3A3A]">/</span>
                  <span className="text-[#5A5A5A]">-{tradeoff.limited}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* [WEEK-PROGRESSION-TRUTH] Render scaled sessions with week-appropriate dosage */}
        {scaledSessions.length > 0 ? (
          scaledSessions.map((session, sessionIndex) => {
            // [SESSION-CARD-SURFACE] Get authoritative card surface for this session
            const cardSurface = sessionCardSurfaces[sessionIndex]
            
            // Get day rationale for this session (fallback/supplementary)
            const dayRationale = intelligenceContract?.dayRationales?.find(
              r => r.dayNumber === session.dayNumber
            )
            
            // [SURFACE-SIGNALS] Get session-level surface signals for prescription changes
            const sessionSurfaceSignals = getSessionSurfaceSignals(session as Parameters<typeof getSessionSurfaceSignals>[0])
            
            // [COACHING-EXPLANATION-CONTRACT] Get authoritative session explanation
            const coachingSessionExpl = intelligenceContract?.coachingExplanation 
              ? getCompactSessionExplanation(intelligenceContract.coachingExplanation, session.dayNumber) 
              : null
            
            // Determine if we have authoritative card surface to show
            const hasAuthoritativeSurface = cardSurface && cardSurface.source === 'authoritative'
            const hasAnyChips = cardSurface && (
              cardSurface.primaryIntentChips.length > 0 || 
              cardSurface.protectionSignals.length > 0 ||
              cardSurface.methodSignals.length > 0
            )
            const hasCoachingExplanation = !!coachingSessionExpl?.purpose
            
            return (
              <div key={`${program.id}-${session.dayNumber}-${session.name || session.focusLabel}`}>
                {/* [SESSION-CARD-SURFACE] Authoritative per-card identity display */}
                {/* [COACHING-EXPLANATION-CONTRACT] Show header when we have coaching explanation */}
                {(hasAuthoritativeSurface || hasAnyChips || hasCoachingExplanation || sessionSurfaceSignals.hasPrescriptionChanges || (dayRationale && dayRationale.source !== 'unavailable')) ? (
                  <div className={`mb-2 px-2 py-1.5 bg-[#1A1A1A]/40 rounded-md border-l-2 ${
                    cardSurface?.protectionSignals.length 
                      ? 'border-[#E63946]/40' 
                      : hasAuthoritativeSurface
                        ? 'border-[#E63946]/30'
                        : 'border-[#E63946]/20'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                        cardSurface?.protectionSignals.length 
                          ? 'bg-[#E63946]/15' 
                          : 'bg-[#E63946]/10'
                      }`}>
                        <span className={`text-[8px] font-bold ${
                          cardSurface?.protectionSignals.length 
                            ? 'text-[#E63946]/90' 
                            : 'text-[#E63946]/70'
                        }`}>{session.dayNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* A. Session headline - authoritative identity line */}
                        {cardSurface?.sessionHeadline && (
                          <p className="text-[11px] text-[#9A9A9A] font-medium leading-snug">
                            {cardSurface.sessionHeadline}
                          </p>
                        )}
                        
                        {/* B. Truth chips row - primary intent + protection + method signals */}
                        {hasAnyChips && (
                          <div className="flex flex-wrap gap-x-1.5 gap-y-1 mt-1">
                            {/* Primary intent chips */}
                            {cardSurface.primaryIntentChips.map((chip, i) => (
                              <span 
                                key={`intent-${i}`} 
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[#E63946]/8 text-[#C8C8C8] font-medium"
                              >
                                {chip}
                              </span>
                            ))}
                            {/* Protection signals */}
                            {cardSurface.protectionSignals.map((chip, i) => (
                              <span 
                                key={`protect-${i}`} 
                                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80 font-medium"
                              >
                                {chip}
                              </span>
                            ))}
                            {/* Method signals */}
                            {cardSurface.methodSignals.map((chip, i) => (
                              <span 
                                key={`method-${i}`} 
                                className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400/70 font-medium"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* [COACHING-EXPLANATION-CONTRACT] Session purpose - prefer coaching explanation */}
                        {coachingSessionExpl?.purpose && (
                          <p className="text-[10px] text-[#8A8A8A] mt-1 leading-relaxed">
                            {coachingSessionExpl.purpose}
                          </p>
                        )}
                        
                        {/* C. Evidence label - only show if no coaching purpose */}
                        {!coachingSessionExpl?.purpose && cardSurface?.evidenceLabel && (
                          <p className="text-[10px] text-[#6A6A6A] mt-1 leading-relaxed">
                            {cardSurface.evidenceLabel}
                          </p>
                        )}
                        
                        {/* D. Fallback to day rationale if no authoritative surface */}
                        {!cardSurface?.sessionHeadline && !coachingSessionExpl?.purpose && dayRationale?.weeklyRole && (
                          <p className="text-[11px] text-[#9A9A9A] font-medium leading-snug">
                            {dayRationale.weeklyRole}
                          </p>
                        )}
                        {!hasAnyChips && sessionSurfaceSignals.microSignals.length > 0 && (
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                            {sessionSurfaceSignals.microSignals.map((signal, i) => (
                              <span key={i} className="text-[9px] text-[#E63946]/70 font-medium">
                                {signal}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* [COACHING-EXPLANATION-CONTRACT] Only show day rationale as last fallback */}
                        {!coachingSessionExpl?.purpose && !cardSurface?.evidenceLabel && !sessionSurfaceSignals.hasPrescriptionChanges && dayRationale?.rationale && (
                          <p className="text-[10px] text-[#6A6A6A] mt-0.5 leading-relaxed">
                            {dayRationale.rationale}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
<AdaptiveSessionCard
  session={session}
  programId={program.id}
  primaryGoal={program.primaryGoal}
  secondaryGoal={program.secondaryGoal}
  defaultExpanded={sessionIndex === 0}
  onExerciseReplace={
  onExerciseReplace
  ? (exerciseId) => onExerciseReplace(session.dayNumber, exerciseId)
  : undefined
  }
  // [COACHING-EXPLANATION-CONTRACT] Pass authoritative coaching explanation surface
  coachingExplanation={intelligenceContract?.coachingExplanation || null}
  />
              </div>
            )
          })
        ) : (
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6 text-center">
            <p className="text-sm text-[#6A6A6A]">No training sessions available</p>
          </Card>
        )}
      </div>

      {/* Why This Fits You - Premium evidence-driven explanation sheet */}
      <Dialog open={showWhySheet} onOpenChange={setShowWhySheet}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF] flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#E63946]/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#E63946]" />
              </div>
              Program Intelligence
            </DialogTitle>
            <DialogDescription className="text-[#A4ACB8] pt-1">
              Decision evidence for your engineered training plan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {/* [COACHING-EXPLANATION-CONTRACT] PRIMARY: Coach-style program fit explanation */}
            {intelligenceContract?.coachingExplanation?.program && (
              <div className="p-4 bg-gradient-to-br from-[#E63946]/8 to-[#0F1115] rounded-lg border border-[#E63946]/25">
                <p className="text-sm text-[#F5F5F5] font-medium leading-relaxed mb-3">
                  {intelligenceContract.coachingExplanation.program.headline}
                </p>
                
                {/* Primary coaching explanations */}
                <ul className="space-y-1.5 mb-3">
                  {/* Goal fit explanation - the main "why this fits you" */}
                  {intelligenceContract.coachingExplanation.program.goalFitExplanation && (
                    <li className="text-xs text-[#A5A5A5] flex items-start gap-2">
                      <span className="text-[#E63946] mt-0.5 shrink-0">·</span>
                      {intelligenceContract.coachingExplanation.program.goalFitExplanation}
                    </li>
                  )}
                  {/* Week focus insight */}
                  {intelligenceContract.coachingExplanation.program.weekFocusInsight && (
                    <li className="text-xs text-[#A5A5A5] flex items-start gap-2">
                      <span className="text-[#E63946] mt-0.5 shrink-0">·</span>
                      {intelligenceContract.coachingExplanation.program.weekFocusInsight}
                    </li>
                  )}
                  {/* Structure fit explanation */}
                  {intelligenceContract.coachingExplanation.program.structureFitExplanation && (
                    <li className="text-xs text-[#A5A5A5] flex items-start gap-2">
                      <span className="text-[#E63946] mt-0.5 shrink-0">·</span>
                      {intelligenceContract.coachingExplanation.program.structureFitExplanation}
                    </li>
                  )}
                  {/* First tradeoff if meaningful */}
                  {intelligenceContract.coachingExplanation.program.tradeoffExplanations?.[0] && (
                    <li className="text-xs text-[#8A8A8A] flex items-start gap-2">
                      <span className="text-amber-500/70 mt-0.5 shrink-0">·</span>
                      {intelligenceContract.coachingExplanation.program.tradeoffExplanations[0]}
                    </li>
                  )}
                </ul>
                
                {/* Schedule fit */}
                {intelligenceContract.coachingExplanation.program.scheduleFitExplanation && (
                  <p className="text-xs text-[#8A8A8A] border-l-2 border-[#E63946]/30 pl-2">
                    {intelligenceContract.coachingExplanation.program.scheduleFitExplanation}
                  </p>
                )}
                
                {/* Progression insight */}
                {intelligenceContract.coachingExplanation.program.progressionInsight && (
                  <p className="text-[11px] text-[#6A6A6A] italic mt-2">
                    {intelligenceContract.coachingExplanation.program.progressionInsight}
                  </p>
                )}
              </div>
            )}
            
            {/* [DECISION-EVIDENCE] Strategic Summary - Core decision architecture (fallback if no coaching explanation) */}
            {!intelligenceContract?.coachingExplanation?.program && intelligenceContract?.strategicSummary && (
              <div className="p-3 bg-gradient-to-br from-[#E63946]/5 to-[#0F1115] rounded-lg border border-[#E63946]/20">
                <p className="text-sm text-[#E6E9EF] font-medium leading-relaxed">
                  {intelligenceContract.strategicSummary.headline}
                </p>
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-[#A4ACB8]">
                    <span className="text-[#E63946]">Architecture:</span> {intelligenceContract.strategicSummary.architectureLabel}
                  </p>
                  <p className="text-xs text-[#8A8A8A]">
                    {intelligenceContract.strategicSummary.fitReason}
                  </p>
                </div>
              </div>
            )}
            
            {/* [DECISION-EVIDENCE] Weekly Decision Logic - Why this frequency/structure */}
            {intelligenceContract?.weeklyDecisionLogic && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Weekly Decision Logic</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-[#C8C8C8]">
                    {intelligenceContract.weeklyDecisionLogic.structureIdentity}
                  </p>
                  <p className="text-xs text-[#8A8A8A]">
                    {intelligenceContract.weeklyDecisionLogic.frequencyReason}
                  </p>
                  {intelligenceContract.weeklyDecisionLogic.architecturalDecisions.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {intelligenceContract.weeklyDecisionLogic.architecturalDecisions.slice(0, 3).map((decision, i) => (
                        <li key={i} className="text-[11px] text-[#6A6A6A] flex items-start gap-1.5">
                          <span className="text-[#E63946] mt-0.5">·</span>
                          {decision}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            
            {/* Protected Constraints - What doctrine protects */}
            {intelligenceContract?.protectedConstraints && intelligenceContract.protectedConstraints.length > 0 && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Protected Constraints</h4>
                </div>
                <ul className="space-y-1.5">
                  {intelligenceContract.protectedConstraints.slice(0, 4).map((constraint, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="text-green-500/80 shrink-0 mt-0.5">✓</span>
                      <div>
                        <span className="text-[#A4ACB8]">{constraint.label}</span>
                        {constraint.reason && (
                          <span className="text-[#5A5A5A]"> - {constraint.reason}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Tradeoffs - What was balanced */}
            {intelligenceContract?.tradeoffs && intelligenceContract.tradeoffs.length > 0 && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Tradeoff Decisions</h4>
                </div>
                <ul className="space-y-2">
                  {intelligenceContract.tradeoffs.slice(0, 3).map((tradeoff, i) => (
                    <li key={i} className="text-xs">
                      <div className="flex items-center gap-1.5 text-[#A4ACB8]">
                        <span className="text-green-500/80">+</span>
                        <span>{tradeoff.prioritized}</span>
                        <span className="text-[#3A3A3A]">/</span>
                        <span className="text-amber-500/60">-</span>
                        <span className="text-[#6A6A6A]">{tradeoff.limited}</span>
                      </div>
                      {tradeoff.reason && (
                        <p className="mt-0.5 ml-3.5 text-[10px] text-[#5A5A5A]">
                          {tradeoff.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Secondary Skill Integration */}
            {intelligenceContract?.secondarySkillHandling && 
             intelligenceContract.secondarySkillHandling.strategy && 
             intelligenceContract.secondarySkillHandling.strategy !== 'none' && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Secondary Integration</h4>
                </div>
                <p className="text-xs text-[#8A8A8A] leading-relaxed">
                  {intelligenceContract.secondarySkillHandling.strategy.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} approach
                  {intelligenceContract.secondarySkillHandling.skills?.length > 0 && (
                    <span className="text-[#A4ACB8]"> for {intelligenceContract.secondarySkillHandling.skills.map(s => s.replace(/_/g, ' ')).join(', ')}</span>
                  )}
                </p>
              </div>
            )}
            
            {/* Decision Inputs - What truth the engine used */}
            {intelligenceContract?.decisionInputs && intelligenceContract.decisionInputs.length > 0 && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Decision Inputs</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {intelligenceContract.decisionInputs.slice(0, 8).map((input, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[10px] text-[#5A5A5A] uppercase tracking-wide">{input.label}</span>
                      <span className="text-xs text-[#A4ACB8]">{input.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* [DECISION-EVIDENCE] Premium Confidence Block - Evidence-backed */}
            {intelligenceContract?.premiumConfidence && (
              <div className="p-3 bg-[#0F1115]/70 rounded-lg border border-[#2B313A]/50">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${
                    intelligenceContract.premiumConfidence.level === 'high' ? 'text-green-400' :
                    intelligenceContract.premiumConfidence.level === 'moderate' ? 'text-amber-400' :
                    'text-[#8A8A8A]'
                  }`}>
                    {intelligenceContract.premiumConfidence.label}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    intelligenceContract.premiumConfidence.level === 'high' ? 'bg-green-500' :
                    intelligenceContract.premiumConfidence.level === 'moderate' ? 'bg-amber-500' :
                    'bg-[#5A5A5A]'
                  }`} />
                </div>
                <p className="text-[11px] text-[#6A6A6A] mb-2">
                  {intelligenceContract.premiumConfidence.sublabel}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {intelligenceContract.premiumConfidence.strongSignals.map((signal, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400/80 rounded border border-green-500/20">
                      {signal}
                    </span>
                  ))}
                  {intelligenceContract.premiumConfidence.limitedSignals.map((signal, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#2A2A2A] text-[#6A6A6A] rounded border border-[#333]">
                      {signal} (building)
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-[#5A5A5A]">
                  {intelligenceContract.premiumConfidence.sourceCoverage}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWhySheet(false)}
              className="w-full border-[#3A3A3A] text-[#A4ACB8] hover:bg-[#2A2A2A]"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
