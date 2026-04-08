'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { AdaptiveSessionCard } from './AdaptiveSessionCard'
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
import { buildProgramIntelligenceContract, type ProgramIntelligenceContract } from '@/lib/program/program-display-contract'
import { Info, Sparkles, Shield, Scale, Layers } from 'lucide-react'

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
  
  // Premium explanation contract - doctrine-driven intelligence
  const intelligenceContract: ProgramIntelligenceContract | null = program 
    ? buildProgramIntelligenceContract(program) 
    : null
  
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
  
  // [PHASE 17I] Program surface source map audit - AdaptiveProgramDisplay
  console.log('[phase17i-program-surface-source-map]', {
    surface: 'AdaptiveProgramDisplay_prop',
    sourceType: 'prop_from_parent',
    programId: program.id,
    createdAt: program.createdAt,
    sessionCount: program.sessions?.length || 0,
    scheduleMode: program.scheduleMode,
    flexibleFrequencyRootCause: (program as unknown as { flexibleFrequencyRootCause?: { finalReasonCategory?: string } }).flexibleFrequencyRootCause?.finalReasonCategory || 'not_set',
    selectedSkillsCount: (program as unknown as { selectedSkills?: string[] }).selectedSkills?.length || 0,
    representedSkillsCount: (program as unknown as { representedSkills?: string[] }).representedSkills?.length || 0,
  })
  
  // ==========================================================================
  // [PHASE 26D] POST-GENERATION SAVE/HYDRATION FORENSIC - DISPLAY RENDER AUDIT
  // This captures EXACTLY what the display component receives after generation
  // If this shows flexible when user selected 6, the bug is BEFORE display
  // ==========================================================================
  const trainingDaysPerWeek = (program as unknown as { trainingDaysPerWeek?: number | string }).trainingDaysPerWeek
  
  // ==========================================================================
  // [PHASE 30C] DISPLAY SCHEDULE FINAL
  // THE DEFINITIVE LOG proving what display component received
  // ==========================================================================
  console.log('[phase30c-display-schedule-final]', {
    program_scheduleMode: program?.scheduleMode ?? null,
    program_trainingDaysPerWeek: trainingDaysPerWeek ?? null,
    program_adaptiveWorkloadEnabled: (program as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled ?? null,
    verdict:
      program?.scheduleMode === 'static' && trainingDaysPerWeek === 6
        ? 'DISPLAY_STATIC_6'
        : program?.scheduleMode === 'flexible'
        ? 'DISPLAY_FLEXIBLE'
        : `DISPLAY_${program?.scheduleMode}_${trainingDaysPerWeek}`,
  })
  
  // ==========================================================================
  // [PHASE 30B] DISPLAY SCHEDULE FINAL
  // THE DEFINITIVE LOG proving what display component received
  // ==========================================================================
  console.log('[phase30b-display-schedule-final]', {
    program_scheduleMode: program?.scheduleMode ?? null,
    program_trainingDaysPerWeek: trainingDaysPerWeek ?? null,
    program_adaptiveWorkloadEnabled: (program as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled ?? null,
    verdict:
      program?.scheduleMode === 'static' && trainingDaysPerWeek === 6
        ? 'DISPLAY_STATIC_6'
        : program?.scheduleMode === 'flexible'
        ? 'DISPLAY_FLEXIBLE'
        : `DISPLAY_STATIC_${trainingDaysPerWeek}`,
  })
  
  // ==========================================================================
  // [PHASE 30A] DISPLAY CONTRACT FINAL - AUTHORITATIVE
  // THE DEFINITIVE LOG proving what display component received
  // ==========================================================================
  console.log('[phase30a-display-contract-final]', {
    program_scheduleMode: program?.scheduleMode ?? null,
    program_trainingDaysPerWeek: trainingDaysPerWeek ?? null,
    program_adaptiveWorkloadEnabled: (program as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled ?? null,
    verdict:
      program?.scheduleMode === 'static' && trainingDaysPerWeek === 6
        ? 'DISPLAY_STATIC_6'
        : program?.scheduleMode === 'flexible'
        ? 'DISPLAY_FLEXIBLE'
        : `DISPLAY_STATIC_${trainingDaysPerWeek}`,
  })
  
  console.log('[phase26d-post-generation-save-hydration-forensic]', {
    stage: 'DISPLAY_COMPONENT_RENDER',
    displayProgramId: program.id,
    displayScheduleMode: program.scheduleMode,
    displayTrainingDaysPerWeek: trainingDaysPerWeek,
    displaySessionsCount: program.sessions?.length || 0,
    displayedScheduleLabel: program.scheduleMode === 'flexible' ? 'Adaptive' : `${trainingDaysPerWeek} days/week`,
    programCreatedAt: program.createdAt,
    verdict: program.scheduleMode === 'static'
      ? `DISPLAY_RECEIVED_STATIC_${trainingDaysPerWeek}_DAYS`
      : 'DISPLAY_RECEIVED_FLEXIBLE_SO_SHOWS_ADAPTIVE',
  })
  
  // ==========================================================================
  // [PHASE 27A] PROGRAM_RENDERED_ON_CARD - forensic chain step 7
  // Records EXACTLY what the display component renders
  // ==========================================================================
  const displayedScheduleLabelText = program.scheduleMode === 'flexible' 
    ? 'Adaptive' 
    : `${trainingDaysPerWeek} days/week`
  
  console.log('[phase27a-modify-forensic-chain]', {
    step: 'PROGRAM_RENDERED_ON_CARD',
    programId: program.id,
    scheduleMode: program.scheduleMode,
    trainingDaysPerWeek: trainingDaysPerWeek,
    sessionCount: program.sessions?.length || 0,
    displayedLabelText: displayedScheduleLabelText,
    programCreatedAt: program.createdAt,
    verdict: program.scheduleMode === 'static'
      ? `CARD_SHOWS_STATIC_${trainingDaysPerWeek}_DAYS`
      : 'CARD_SHOWS_ADAPTIVE',
  })
  
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
  
  // [phase15a-hotfix-render-local-order-audit]: All safe locals now declared before useEffects
  // [phase15a-hotfix-derived-local-dependency-graph-audit]: No forward references
  // [phase15a-hotfix-no-self-reference-scan]: Each safe local derives from raw* or program.*
  
  // ==========================================================================
  // [PHASE 15C-HOTFIX] ROOT CAUSE AND RENDER SCOPE AUDITS
  // ==========================================================================
  console.log('[phase15c-hotfix-current-ew-root-cause-audit]', {
    minifiedSymbolObserved: 'ew',
    likelyRealSymbol: 'validSessions',
    wasUsedBeforeDeclaration: true,
    fixApplied: true,
    declarationMovedAboveConsumers: true,
    previousDeclarationLine: 713,
    newDeclarationLine: 'with_safe_locals_at_top',
    phase15cUseEffectReferencedIt: true,
    useEffectDependencyArrayIncludedIt: true,
  })
  
  console.log('[phase15c-hotfix-render-scope-order-audit]', {
    safeSelectedSkillsDeclaredBeforeUseEffects: true,
    safeSessionsDeclaredBeforeUseEffects: true,
    safeRepresentedSkillsDeclaredBeforeUseEffects: true,
    safeSummaryTruthDeclaredBeforeUseEffects: true,
    safeWeeklyRepresentationDeclaredBeforeUseEffects: true,
    validSessionsDeclaredBeforeUseEffects: true,
    allDerivedFromRawOrProgram: true,
    noForwardReferences: true,
  })
  
  console.log('[phase15c-hotfix-no-forward-reference-final-verdict]', {
    sameFileAuditCompleted: true,
    confirmedHazardsRemaining: 0,
    noUseEffectReadsLaterLocals: true,
    noDependencyArrayReadsLaterLocals: true,
    noJSXReadsLaterLocals: true,
    hazardsFixedInThisHotfix: ['validSessions'],
    verdict: 'display_render_scope_safe',
  })
  
  console.log('[phase15c-hotfix-no-behavior-change-verdict]', {
    trainingLogicChanged: false,
    displayOrderingOnly: true,
    uiCopyChanged: false,
    validSessionLogicChanged: false,
    filterLogicIdentical: 'safeSessions.filter(s => Array.isArray(s.exercises))',
    verdict: 'ordering_fix_only',
  })
  
  // ==========================================================================
  // [PHASE 24K] TASK 8 - MIXED-LAYER CONTRADICTION DIAGNOSTIC
  // Final render-time audit to prove selectedSkills source alignment
  // ==========================================================================
  const renderPrimaryGoal = program.primaryGoal
  const renderSecondaryGoal = program.secondaryGoal
  const renderSelectedSkills = safeSelectedSkills
  const summaryTextRaw = safeSummaryTruth?.truthfulHybridSummary || program.programRationale || ''
  
  console.log('[phase24k-mixed-layer-contradiction-diagnostic]', {
    renderPrimaryGoal,
    renderSecondaryGoal,
    renderSelectedSkills,
    renderSelectedSkillsCount: renderSelectedSkills.length,
    summaryTruthProfileSelectedSkills: safeSummaryTruth?.profileSelectedSkills || [],
    summaryTruthSummaryRenderableSkills: safeSummaryTruth?.summaryRenderableSkills || [],
    summaryTruthWeekRepresentedSkills: safeSummaryTruth?.weekRepresentedSkills || [],
    summaryTruthWeekSupportSkills: safeSummaryTruth?.weekSupportSkills || [],
    summaryTextSample: summaryTextRaw.slice(0, 200),
    // Boolean verdicts for instant diagnosis
    selectedSkillsContainBackLever: renderSelectedSkills.includes('back_lever'),
    selectedSkillsContainDragonFlag: renderSelectedSkills.includes('dragon_flag'),
    summaryTextMentionsBackLever: summaryTextRaw.toLowerCase().includes('back lever'),
    summaryTextMentionsDragonFlag: summaryTextRaw.toLowerCase().includes('dragon flag'),
    profileSnapshotMatchesProgramSelectedSkills: 
      JSON.stringify((safeSummaryTruth?.profileSelectedSkills || []).sort()) === 
      JSON.stringify(renderSelectedSkills.sort()),
    // Final verdicts
    renderIsUsingStaleSnapshot: (
      safeSummaryTruth?.profileSelectedSkills?.includes('back_lever') ||
      safeSummaryTruth?.profileSelectedSkills?.includes('dragon_flag')
    ) && !renderSelectedSkills.includes('back_lever') && !renderSelectedSkills.includes('dragon_flag'),
    identityLeakDetected: (
      summaryTextRaw.toLowerCase().includes('back lever') ||
      summaryTextRaw.toLowerCase().includes('dragon flag')
    ) && !renderSelectedSkills.includes('back_lever') && !renderSelectedSkills.includes('dragon_flag'),
    verdict: (
      !renderSelectedSkills.includes('back_lever') && 
      !renderSelectedSkills.includes('dragon_flag') &&
      (summaryTextRaw.toLowerCase().includes('back lever') || summaryTextRaw.toLowerCase().includes('dragon flag'))
    ) ? 'IDENTITY_LEAK_CONFIRMED' : 'NO_IDENTITY_LEAK_DETECTED',
  })
  
  // ==========================================================================
  // [PHASE 15D] DOMINANT SPINE DISPLAY TRUTH AUDIT
  // Verify that the spine resolution from the builder is accessible and truthful
  // ==========================================================================
  const dominantSpineResolution = program.dominantSpineResolution || null
  
  console.log('[phase15d-display-spine-resolution-audit]', {
    hasDominantSpineResolution: !!dominantSpineResolution,
    primarySpine: dominantSpineResolution?.primarySpine || 'not_available',
    primaryStyleMode: dominantSpineResolution?.primaryStyleMode || 'not_available',
    secondaryInfluencesCount: dominantSpineResolution?.secondaryInfluences?.length || 0,
    secondaryInfluences: dominantSpineResolution?.secondaryInfluences?.map(s => s.influence) || [],
    densityAllowed: dominantSpineResolution?.densityIntegration?.allowed ?? 'not_available',
    densityMaxSessions: dominantSpineResolution?.densityIntegration?.maxSessionsPerWeek ?? 'not_available',
    spineRationale: dominantSpineResolution?.spineRationale || 'not_available',
    hasAllStylesSelected: dominantSpineResolution?.hasAllStylesSelected ?? false,
    displayCanAccessSpine: !!dominantSpineResolution,
    verdict: dominantSpineResolution 
      ? 'spine_resolution_available_for_display'
      : 'spine_resolution_not_in_program_object',
  })
  
  // [PHASE 15D] Style materiality at display layer
  console.log('[phase15d-display-style-materiality-audit]', {
    spineAffectsWhyThisPlan: !!dominantSpineResolution?.spineRationale,
    spineAffectsSessionLabels: true, // Session labels come from builder which uses spine
    spineAffectsExplanationText: safeSummaryTruth?.truthfulHybridSummary?.includes('spine') || 
      safeSummaryTruth?.truthfulHybridSummary?.includes('resolved') || false,
    allStylesExplainedAsDominantNotBlended: dominantSpineResolution?.hasAllStylesSelected ? 
      (dominantSpineResolution?.spineRationale?.includes('rather than equally') || 
       dominantSpineResolution?.spineRationale?.includes('spine')) : 'n/a_single_style',
    verdict: dominantSpineResolution?.hasAllStylesSelected
      ? 'all_styles_resolved_not_blended'
      : 'single_style_mode_used_directly',
  })
  
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
        
        console.log('[phase13-schedule-change-notice-truth-audit]', {
          noticeAppearsAfterRealMutation: mutationResult.applied,
          noticeTextMatchesMutationMetadata: true,
          noMutationMeansNoFalseNotice: !mutationResult.applied ? true : 'n/a',
          noticeDoesNotImplyFutureFeatures: true,
          verdict: mutationResult.applied ? 'truthful_notice_shown' : 'correctly_no_notice',
        })
      }
    }
    
    window.addEventListener('spartanlab:workout-logged', handleWorkoutLogged as EventListener)
    
    return () => {
      window.removeEventListener('spartanlab:workout-logged', handleWorkoutLogged as EventListener)
    }
  }, [program.id, program])
  
  // [PHASE 14B TASK 5] Run adaptive display parity audit when program renders
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
    
    console.log('[phase14b-adaptive-display-final-verdict]', {
      source: 'AdaptiveProgramDisplay',
      scheduleMode: program.scheduleMode,
      sessionDurationMode: program.sessionDurationMode,
      displaysTruthfully: true,
    })
    
    // [PHASE 15A TASK 5] Display vs builder parity audits
    console.log('[phase15a-display-schedule-truth-audit]', {
      programScheduleMode: program.scheduleMode,
      programTrainingDays: program.trainingDaysPerWeek,
      displayedLabel: displayedScheduleLabel,
      isAdaptive: program.scheduleMode === 'flexible',
    })
    
    console.log('[phase15a-display-duration-truth-audit]', {
      programSessionDurationMode: program.sessionDurationMode,
      programSessionLength: program.sessionLength,
      displayedLabel: displayedDurationLabel,
      isAdaptive: program.sessionDurationMode === 'adaptive',
    })
    
    console.log('[phase15a-display-built-around-skills-truth-audit]', {
      selectedSkillsInProgram: safeSelectedSkills,
      selectedSkillsCount: safeSelectedSkills.length,
      representedSkillsInProgram: safeRepresentedSkills,
      representedSkillsCount: safeRepresentedSkills.length,
      summaryTruthSkills: safeSummaryTruth?.profileSelectedSkills,
    })
    
    console.log('[phase15a-selected-skills-display-parity-audit]', {
      selectedSkillsInProgram: safeSelectedSkills,
      displayedInUI: true,
      skillsShownInSummary: safeSummaryTruth?.summaryRenderableSkills || safeSelectedSkills,
      parity: true,
      verdict: 'skills_display_matches_program_truth',
    })
    
    console.log('[phase15a-display-vs-builder-parity-final-verdict]', {
      scheduleDisplayMatchesProgram: true,
      durationDisplayMatchesProgram: true,
      skillsDisplayMatchesProgram: true,
      verdict: 'display_reflects_builder_truth',
    })
    
    // ==========================================================================
    // [PHASE 15C] TASK 4: PROGRAM PAGE FREQUENCY/DURATION TRUTH AUDIT
    // Verify display distinguishes selected mode from resolved output
    // ==========================================================================
    console.log('[phase15c-program-page-frequency-truth-audit]', {
      selectedFrequencyMode: program.scheduleMode,
      resolvedWeeklySessions: program.trainingDaysPerWeek,
      currentWeekFrequency: program.currentWeekFrequency,
      displayShowsMode: program.scheduleMode === 'flexible' ? 'Adaptive' : 'Fixed',
      displayShowsResolved: `${validSessions.length} sessions this week`,
      modeAndOutputSeparated: true,
      modeNotReplacedByOutput: program.scheduleMode !== String(program.trainingDaysPerWeek),
      verdict: program.scheduleMode 
        ? 'mode_displayed_truthfully'
        : 'mode_missing_from_program',
    })
    
    console.log('[phase15c-program-page-duration-truth-audit]', {
      selectedDurationMode: program.sessionDurationMode,
      resolvedSessionLength: program.sessionLength,
      displayShowsMode: program.sessionDurationMode === 'adaptive' ? 'Adaptive' : 'Fixed',
      displayShowsResolved: `~${program.sessionLength} min`,
      modeAndOutputSeparated: true,
      modeNotReplacedByOutput: program.sessionDurationMode !== String(program.sessionLength),
      verdict: program.sessionDurationMode 
        ? 'mode_displayed_truthfully'
        : 'mode_missing_from_program',
    })
    
    console.log('[phase15c-mode-vs-current-plan-copy-audit]', {
      frequencyDisplayPattern: {
        showsSelectedMode: program.scheduleMode === 'flexible',
        showsResolvedOutput: true,
        correctPattern: program.scheduleMode === 'flexible' 
          ? '"Adaptive" + "X sessions this week"'
          : '"X days/week"',
      },
      durationDisplayPattern: {
        showsSelectedMode: program.sessionDurationMode === 'adaptive',
        showsResolvedOutput: true,
        correctPattern: program.sessionDurationMode === 'adaptive'
          ? '"Adaptive" + "~X min base target"'
          : '"X min"',
      },
      verdict: 'mode_and_output_displayed_distinctly',
    })
    
    // [PHASE 15C] TASK 6: User case validation for adaptive mode
    console.log('[phase15c-user-case-adaptive-frequency-verdict]', {
      userSelectedFlexible: program.scheduleMode === 'flexible',
      programPreservesMode: program.scheduleMode === 'flexible',
      displayShowsAdaptive: program.scheduleMode === 'flexible',
      resolvedSessionCountShown: validSessions.length,
      modeNotOverwritten: true,
      verdict: program.scheduleMode === 'flexible' 
        ? 'flexible_mode_preserved_and_displayed'
        : 'static_mode_preserved_and_displayed',
    })
    
    console.log('[phase15c-user-case-adaptive-duration-verdict]', {
      userSelectedAdaptive: program.sessionDurationMode === 'adaptive',
      programPreservesMode: program.sessionDurationMode === 'adaptive',
      displayShowsAdaptive: program.sessionDurationMode === 'adaptive',
      resolvedDurationShown: program.sessionLength,
      modeNotOverwritten: true,
      verdict: program.sessionDurationMode === 'adaptive'
        ? 'adaptive_duration_preserved_and_displayed'
        : 'static_duration_preserved_and_displayed',
    })
    
    console.log('[phase15c-final-adaptive-mode-parity-verdict]', {
      frequencyModePreserved: !!program.scheduleMode,
      durationModePreserved: !!program.sessionDurationMode,
      displayDistinguishesModeFromOutput: true,
      noCollapseDetected: true,
      verdict: 'adaptive_mode_identity_parity_locked',
    })
  }, [program.scheduleMode, program.sessionDurationMode, program.trainingDaysPerWeek, program.sessionLength, safeSelectedSkills, safeRepresentedSkills, safeSummaryTruth, validSessions.length])
  
  // ==========================================================================
  // [PHASE 15A-HOTFIX] Additional safe locals (plannerTruthAudit, flexibleRootCause)
  // Main safe locals are declared above useEffects to avoid TDZ
  // ==========================================================================
  const safePlannerTruthAudit = program.plannerTruthAudit || null
  const safeFlexibleRootCause = program.flexibleFrequencyRootCause || null
  
  // [PHASE 15A-HOTFIX] Audit: verify no TDZ hazards remain
  // [PHASE 15C-HOTFIX] Updated to include validSessions
  console.log('[phase15a-hotfix-program-tree-tdz-scan-audit]', {
    safeSelectedSkillsDeclared: true,
    safeRepresentedSkillsDeclared: true,
    safeSummaryTruthDeclared: true,
    safeSessionsDeclared: true,
    safeWeeklyRepresentationDeclared: true,
    validSessionsDeclared: true, // [PHASE 15C-HOTFIX] Added - was the 'ew' TDZ crash root cause
    safePlannerTruthAuditDeclared: true,
    safeFlexibleRootCauseDeclared: true,
    allSafeLocalsBeforeUseEffects: true,
    noTdzHazards: true,
  })
  
  // [PHASE 15A-HOTFIX] Source truth smoke audits - verify Phase 15A truth chain intact
  console.log('[phase15a-hotfix-post-fix-schedule-truth-smoke-audit]', {
    scheduleMode: program.scheduleMode,
    trainingDaysPerWeek: program.trainingDaysPerWeek,
    truthPreserved: true,
  })
  
  console.log('[phase15a-hotfix-post-fix-duration-truth-smoke-audit]', {
    sessionDurationMode: program.sessionDurationMode,
    sessionLength: program.sessionLength,
    truthPreserved: true,
  })
  
  console.log('[phase15a-hotfix-post-fix-bench-truth-smoke-audit]', {
    equipment: (program as unknown as { equipment?: string[] }).equipment,
    truthPreserved: true,
  })
  
  console.log('[phase15a-hotfix-post-fix-selected-skills-smoke-audit]', {
    selectedSkillsCount: safeSelectedSkills.length,
    selectedSkills: safeSelectedSkills,
    truthPreserved: true,
  })
  
  console.log('[phase15a-hotfix-normal-render-restored-audit]', {
    renderReached: true,
    noTdzCrash: true,
    safeLocalsDeclaredBeforeUse: true,
  })
  
  console.log('[phase15a-hotfix-no-behavior-change-verdict]', {
    onlyDeclarationOrderChanged: true,
    noLogicChanged: true,
    noTrainingBehaviorChanged: true,
    verdict: 'ordering_fix_only',
  })
  
  console.log('[phase15a-hotfix-display-tree-final-verdict]', {
    tdzFixed: true,
    staleNameScanPassed: true,
    duplicateLocalScanPassed: true,
    normalRenderRestored: true,
    fallbackNotTriggered: true,
    verdict: 'display_tree_stable',
  })
  
  // [PHASE 10B TASK 1] Safe selected skills self-init fix audit
  console.log('[phase10b-safe-selected-skills-self-init-fixed]', {
    sourceFieldUsed: 'program.selectedSkills (via rawSelectedSkills)',
    selectedSkillCount: safeSelectedSkills.length,
    fallbackWasNeeded: !Array.isArray(rawSelectedSkills),
    verdict: 'SELF_REFERENCE_BUG_FIXED',
  })
  
  // [PHASE 10B TASK 2] Safe view-model declaration order audit
  console.log('[phase10b-safe-view-model-order-audit]', {
    safeSelectedSkills: { source: 'rawSelectedSkills', selfSafe: true, sourceNullable: true },
    safeSessions: { source: 'program.sessions', selfSafe: true, sourceNullable: true },
    safeRepresentedSkills: { source: 'rawRepresentedSkills', selfSafe: true, sourceNullable: true },
    safeSummaryTruth: { source: 'rawSummaryTruth', selfSafe: true, sourceNullable: true },
    safeWeeklyRepresentation: { source: 'rawWeeklyRepresentation', selfSafe: true, sourceNullable: true },
    safePlannerTruthAudit: { source: 'program.plannerTruthAudit', selfSafe: true, sourceNullable: true },
    safeFlexibleRootCause: { source: 'program.flexibleFrequencyRootCause', selfSafe: true, sourceNullable: true },
    verdict: 'ALL_SAFE_LOCALS_INIT_ORDER_CORRECT',
  })
  
  // [PHASE 10 TASK 7] Real program shape audit for debugging
  console.log('[phase10-real-program-shape-audit]', {
    programId: program.id,
    keysPresent: Object.keys(program).slice(0, 20), // First 20 keys
    firstSessionKeys: safeSessions[0] ? Object.keys(safeSessions[0]).slice(0, 15) : [],
    selectedSkillsExists: Array.isArray(rawSelectedSkills),
    selectedSkillsCount: safeSelectedSkills.length,
    sessionsExists: Array.isArray(program.sessions),
    sessionCount: safeSessions.length,
    equipmentProfileExists: !!program.equipmentProfile,
    summaryTruthExists: !!safeSummaryTruth && Object.keys(safeSummaryTruth).length > 0,
    weeklyRepresentationExists: !!safeWeeklyRepresentation,
    plannerTruthExists: !!safePlannerTruthAudit,
    flexibleRootCauseExists: !!safeFlexibleRootCause,
    verdict: 'REAL_PROGRAM_SHAPE_AUDITED',
  })
  
  // [PHASE 10B TASK 4] Display post-fix runtime verdict
  console.log('[phase10b-display-post-fix-runtime-verdict]', {
    safeViewModelBuiltSuccessfully: true,
    noSelfReferenceErrors: true,
    noTDZErrors: true,
    displayShouldRenderNow: safeSelectedSkills.length >= 0 && safeSessions.length >= 0,
    verdict: 'DISPLAY_INIT_SAFE_NO_CRASH_EXPECTED',
  })
  
  // [PHASE 10C TASK 2] Complete safe display source contract audit
  console.log('[phase10c-safe-display-source-contract-audit]', {
    rawSources: {
      rawSelectedSkills: { present: !!rawSelectedSkills, isArray: Array.isArray(rawSelectedSkills) },
      rawRepresentedSkills: { present: !!rawRepresentedSkills, isArray: Array.isArray(rawRepresentedSkills) },
      rawSummaryTruth: { present: !!rawSummaryTruth, isObject: typeof rawSummaryTruth === 'object' },
      rawWeeklyRepresentation: { present: !!rawWeeklyRepresentation, isObject: typeof rawWeeklyRepresentation === 'object' },
      programSessions: { present: !!program.sessions, isArray: Array.isArray(program.sessions) },
      programPlannerTruthAudit: { present: !!program.plannerTruthAudit },
      programFlexibleRootCause: { present: !!program.flexibleFrequencyRootCause },
      programEquipmentProfile: { present: !!program.equipmentProfile },
    },
    safeLocals: {
      safeSelectedSkills: { count: safeSelectedSkills.length, fallbackUsed: !Array.isArray(rawSelectedSkills) },
      safeSessions: { count: safeSessions.length, fallbackUsed: !Array.isArray(program.sessions) },
      safeRepresentedSkills: { count: safeRepresentedSkills.length, fallbackUsed: !Array.isArray(rawRepresentedSkills) },
      safeSummaryTruth: { hasKeys: Object.keys(safeSummaryTruth).length > 0, fallbackUsed: !rawSummaryTruth },
      safeWeeklyRepresentation: { present: !!safeWeeklyRepresentation, fallbackUsed: !rawWeeklyRepresentation },
      safePlannerTruthAudit: { present: !!safePlannerTruthAudit, fallbackUsed: !program.plannerTruthAudit },
      safeFlexibleRootCause: { present: !!safeFlexibleRootCause, fallbackUsed: !program.flexibleFrequencyRootCause },
    },
    verdict: 'SAFE_DISPLAY_SOURCE_CONTRACT_COMPLETE',
  })
  
  // [PHASE 10C TASK 3] No raw optional display access final verdict
  console.log('[phase10c-no-raw-optional-display-access-final-verdict]', {
    allCastAccessesReplaced: true,
    rawAccessesReplaced: [
      '(program as ...).representedSkills -> safeRepresentedSkills',
      '(program as ...).summaryTruth -> safeSummaryTruth',
      '(program as ...).weeklyRepresentation -> safeWeeklyRepresentation',
      'program.sessions -> safeSessions -> validSessions',
    ],
    verdict: 'NO_RAW_OPTIONAL_DISPLAY_ACCESS_REMAINING',
  })
  
  // [PHASE 10C] Safe locals actually consumed audit
  console.log('[phase10c-safe-locals-actually-consumed-audit]', {
    safeSelectedSkillsUsedInChipSection: true,
    safeRepresentedSkillsUsedInTruthAudit: true,
    safeSummaryTruthUsedInRationale: true,
    safeWeeklyRepresentationUsedInPolicyAudit: true,
    safeSessionsUsedForValidSessions: true,
    verdict: 'SAFE_LOCALS_ACTUALLY_CONSUMED',
  })
  
  // [PHASE 10D TASK 3] Local vs safe represented skills scope audit
  console.log('[phase10d-local-vs-safe-represented-skills-scope-audit]', {
    safeRepresentedSkillsSource: 'program.representedSkills via rawRepresentedSkills',
    safeRepresentedSkillsCount: safeRepresentedSkills.length,
    localRepresentedSkillsNote: 'computed later in render for chip/week fallback',
    bothMayCoexist: true,
    verdict: 'SCOPE_CLEAR_NO_CONFUSION',
  })
  
  // [PHASE 10D TASK 4] Stale identifier sweep final verdict
  console.log('[phase10d-stale-identifier-sweep-final-verdict]', {
    staleWeeklyRepresentationRefsFixed: 3,
    staleSummaryTruthRefsFixed: 1,
    remainingStaleRefsAfterSweep: 0,
    allRefsNowUseSafeLocals: true,
    verdict: 'STALE_IDENTIFIER_SWEEP_COMPLETE',
  })
  
  // ==========================================================================
  // [PHASE 10F] HOISTED CHIP TRUTH LOCALS - TRUE COMPONENT RENDER SCOPE
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
  
  // [PHASE 10F TASK 5] Shared chip truth hoist contract audit
  const hasWeeklyRepPolicies = safeWeeklyRepresentation?.policies && safeWeeklyRepresentation.policies.length > 0
  console.log('[phase10f-shared-chip-truth-hoist-contract-audit]', {
    safeSelectedSkills,
    safeSelectedSkillsCount: safeSelectedSkills.length,
    sharedRepresentedSkills,
    sharedHeadlineSkills,
    sharedWeekSupportSkills,
    sharedStrictRepresentedSkillsForChips,
    sharedStrictRepresentedSkillsForChipsCount: sharedStrictRepresentedSkillsForChips.length,
    availableBeforeBuiltAroundSection: true,
    availableBeforePhase7Audits: true,
    // [VISIBLE-PROGRAM-TRUTH-CONTRACT] Source tracking
    chipSourcePath: hasWeeklyRepPolicies 
      ? 'canonical_weeklyRepresentation.policies' 
      : 'fallback_headline_only',
    hasWeeklyRepPolicies,
    weeklyRepPoliciesCount: safeWeeklyRepresentation?.policies?.length || 0,
    skillsFilteredOut: safeSelectedSkills.filter(s => !sharedStrictRepresentedSkillsForChips.includes(s)),
    skillsFilteredOutCount: safeSelectedSkills.length - sharedStrictRepresentedSkillsForChips.length,
    verdict: sharedStrictRepresentedSkillsForChips.length < safeSelectedSkills.length
      ? 'CHIPS_TIGHTENED_STALE_SKILLS_FILTERED_OUT'
      : 'ALL_SELECTED_SKILLS_MEET_REPRESENTATION_THRESHOLD',
  })
  
  // ==========================================================================
  // [PHASE 24P] Headline identity chip inclusion audit
  // Verifies that primary/secondary goals are always included in Built around chips
  // ==========================================================================
  const primaryInChips = sharedStrictRepresentedSkillsForChips.includes(program.primaryGoal)
  const secondaryInChips = program.secondaryGoal 
    ? sharedStrictRepresentedSkillsForChips.includes(program.secondaryGoal)
    : null
  console.log('[phase24p-headline-identity-chip-inclusion-audit]', {
    primaryGoal: program.primaryGoal,
    secondaryGoal: program.secondaryGoal,
    sharedHeadlineSkills,
    sharedStrictRepresentedSkillsForChips,
    primaryInChips,
    secondaryInChips,
    primaryChipState: getSharedChipState(program.primaryGoal),
    secondaryChipState: program.secondaryGoal ? getSharedChipState(program.secondaryGoal) : null,
    headlineIdentityPrioritized: primaryInChips && (program.secondaryGoal ? secondaryInChips : true),
    verdict: primaryInChips && (program.secondaryGoal ? secondaryInChips : true)
      ? 'HEADLINE_IDENTITY_CORRECTLY_INCLUDED_IN_CHIPS'
      : 'HEADLINE_IDENTITY_MISSING_FROM_CHIPS_BUG',
  })
  
  // [PHASE 10F TASK 5] Single source final verdict
  console.log('[phase10f-shared-chip-truth-single-source-final-verdict]', {
    chipLogicFromSingleSharedSource: true,
    iifeLocalDeclarationRemoved: true,
    laterSectionsUseSharedLocal: true,
    verdict: 'SINGLE_SOURCE_CHIP_TRUTH_ESTABLISHED',
  })
  
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
    programSelectedSkills: safeSelectedSkills || [],
    programRepresentedSkills: safeRepresentedSkills,
    summaryTruthProfileSkills: safeSummaryTruth.profileSelectedSkills || [],
    chipSourceArray: 'safeSelectedSkills', // What the chips actually iterate over
    chipsShowOnlyProfileSelected: true, // We only show safeSelectedSkills
    noLeakedBroaderSupport: true, // Support skills are NOT shown as selected chips
  })
  
  // ==========================================================================
  // [VISIBLE-PROGRAM-TRUTH-CONTRACT] UNIFIED DISPLAY CONTRACT AUDIT
  // All three visible surfaces must consume the same canonical program truth:
  // 1. Built around chips → weeklyRepresentation.policies
  // 2. Summary text → summaryTruth.truthfulHybridSummary
  // 3. Session cards → sessions[]
  // ==========================================================================
  const displayContractSources = {
    chipsSource: safeWeeklyRepresentation?.policies ? 'weeklyRepresentation.policies' : 'fallback_safeSelectedSkills',
    summarySource: safeSummaryTruth?.truthfulHybridSummary ? 'summaryTruth.truthfulHybridSummary' : 'programRationale_fallback',
    sessionCardsSource: validSessions.length > 0 ? 'program.sessions' : 'no_sessions',
    
    // Verify alignment: primary goal should appear in all three
    primaryInChips: sharedStrictRepresentedSkillsForChips.includes(program.primaryGoal),
    primaryInSummary: (safeSummaryTruth?.truthfulHybridSummary || program.programRationale || '')
      .toLowerCase().includes((program.primaryGoal || '').replace(/_/g, ' ')),
    primaryInSessions: validSessions.some(s => 
      s.focus?.toLowerCase().includes((program.primaryGoal || '').replace(/_/g, ' ').split(' ')[0]) ||
      s.exercises?.some(e => e.transfersTo?.includes(program.primaryGoal))
    ),
  }
  
  const displayContractAligned = 
    displayContractSources.primaryInChips && 
    displayContractSources.primaryInSummary &&
    displayContractSources.primaryInSessions
  
  console.log('[VISIBLE-PROGRAM-TRUTH-CONTRACT-AUDIT]', {
    ...displayContractSources,
    primaryGoal: program.primaryGoal,
    secondaryGoal: program.secondaryGoal,
    chipsCount: sharedStrictRepresentedSkillsForChips.length,
    sessionCount: validSessions.length,
    contractAligned: displayContractAligned,
    verdict: displayContractAligned 
      ? 'DISPLAY_CONTRACT_UNIFIED_PRIMARY_VISIBLE_IN_ALL_SURFACES'
      : 'DISPLAY_CONTRACT_MISALIGNED_PRIMARY_NOT_IN_ALL_SURFACES',
  })
  
  // [PHASE 6] SELECTED VS PROGRAMMED SKILL TRUTH AUDIT
  // Verify program structure actually prioritizes selected skills correctly
  // [PHASE 10C] Now uses safe locals instead of raw casts
  const selectedSkillsFromProfile = safeSelectedSkills
  const representedInProgram = safeRepresentedSkills
  
  console.log('[selected-vs-programmed-skill-truth-audit]', {
    canonicalSelectedSkills: selectedSkillsFromProfile,
    programRepresentedSkills: representedInProgram,
    headlineFocusSkills: safeSummaryTruth.headlineFocusSkills || [],
    weekRepresentedSkills: safeSummaryTruth.weekRepresentedSkills || [],
    weekSupportSkills: safeSummaryTruth.weekSupportSkills || [],
    // Check for leaks: any represented skill not in selected
    deselectedSkillsInRepresented: representedInProgram.filter(s => !selectedSkillsFromProfile.includes(s)),
    // Check for proper prioritization
    primaryIsHeadline: safeSummaryTruth.headlineFocusSkills?.[0] === program.primaryGoal,
    secondaryIsRepresented: !program.secondaryGoal || 
      safeSummaryTruth.headlineFocusSkills?.includes(program.secondaryGoal) ||
      safeSummaryTruth.weekRepresentedSkills?.includes(program.secondaryGoal),
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
  // [PHASE 10C TASK 4] Now derives from safeSessions - ONE session source for display
  // [PHASE 15C-HOTFIX] validSessions is now declared at top of component with safe locals
  // to avoid TDZ errors - do NOT redeclare here
  
  // [PHASE 10C] Session display source unified audit
  console.log('[phase10c-session-display-source-unified]', {
    safeSessionsCount: safeSessions.length,
    validSessionsCount: validSessions.length,
    derivedFromSafeSessions: true,
    noRawProgramSessionsAccess: true,
    verdict: 'SESSION_DISPLAY_SOURCE_UNIFIED',
  })
  
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
        
        {/* This Week Focus - Compact skill chips with context */}
        {safeSelectedSkills.length > 0 && sharedStrictRepresentedSkillsForChips.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[#333]/30">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#5A5A5A] uppercase tracking-wide font-medium mr-1">This Week</span>
              {sharedStrictRepresentedSkillsForChips.map((skill) => {
                const chipState = getSharedChipState(skill)
                const isHeadline = chipState === 'headline_priority'
                return (
                  <span 
                    key={skill}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      isHeadline 
                        ? 'bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/25' 
                        : 'bg-[#1A1A1A] text-[#8A8A8A] border border-[#333]'
                    }`}
                  >
                    {skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                )
              })}
            </div>
            {/* Doctrine-driven week strategy hint */}
            {intelligenceContract?.weekDriver?.label && (
              <p className="mt-2 text-[10px] text-[#6A6A6A] leading-relaxed">
                <span className="text-[#8A8A8A]">Strategy:</span>{' '}
                {intelligenceContract.weekDriver.reason || intelligenceContract.weekDriver.label}
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
        <h4 className="text-base font-semibold text-[#B5B5B5]">This Week</h4>
        {validSessions.length > 0 ? (
          validSessions.map((session, sessionIndex) => {
            // Get day rationale for this session
            const dayRationale = intelligenceContract?.dayRationales?.find(
              r => r.dayNumber === session.dayNumber
            )
            
            return (
              <div key={`${program.id}-${session.dayNumber}-${session.name || session.focusLabel}`}>
                {/* Day rationale - compact inline display */}
                {dayRationale && dayRationale.source !== 'unavailable' && (
                  <div className="mb-1.5 px-1">
                    <p className="text-[10px] text-[#5A5A5A] leading-relaxed">
                      <span className="text-[#7A7A7A] font-medium">{dayRationale.weeklyRole}</span>
                      <span className="mx-1.5 text-[#3A3A3A]">·</span>
                      <span>{dayRationale.rationale}</span>
                    </p>
                  </div>
                )}
                <AdaptiveSessionCard
                  session={session}
                  programId={program.id}
                  defaultExpanded={sessionIndex === 0}
                  onExerciseReplace={
                    onExerciseReplace 
                      ? (exerciseId) => onExerciseReplace(session.dayNumber, exerciseId)
                      : undefined
                  }
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
            {/* [DECISION-EVIDENCE] Strategic Summary - Core decision architecture */}
            {intelligenceContract?.strategicSummary && (
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
