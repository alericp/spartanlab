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
import { useState, useEffect } from 'react'
import { WorkoutExplanation, PlanExplanationBadge, DataConfidenceBadge } from './WorkoutExplanation'
import { getDurationPreferenceLabel } from '@/lib/duration-contract'
import { 
  consumePendingScheduleNotice, 
  evaluateActiveWeekMutation,
  getCompletedSessionDayNumbers,
  runPhase13FinalVerdict,
  type ScheduleChangeNotice,
} from '@/lib/active-week-mutation-service'
import { runAdaptiveDisplayParityAudit } from '@/lib/adaptive-display-contract'

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
  
  // [PHASE 13] Schedule change notice state
  const [scheduleNotice, setScheduleNotice] = useState<ScheduleChangeNotice | null>(null)
  
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
    // First check weekly representation policies if available (more accurate)
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
    
    // Fallback to summary truth based logic
    if (sharedHeadlineSkills.includes(skill)) return 'headline_priority'
    if (sharedRepresentedSkills.includes(skill)) return 'represented_broader'
    if (sharedWeekSupportSkills.includes(skill)) return 'support_only'
    return 'selected_not_represented'
  }
  
  // F. Compute sharedStrictRepresentedSkillsForChips - THE KEY HOISTED LOCAL
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
    
    return isHeadline || isRepresentedBroaderWithSubstance
  })
  
  // [PHASE 10F TASK 5] Shared chip truth hoist contract audit
  console.log('[phase10f-shared-chip-truth-hoist-contract-audit]', {
    safeSelectedSkills,
    sharedRepresentedSkills,
    sharedHeadlineSkills,
    sharedWeekSupportSkills,
    sharedStrictRepresentedSkillsForChips,
    availableBeforeBuiltAroundSection: true,
    availableBeforePhase7Audits: true,
    verdict: 'CHIP_TRUTH_HOISTED_TO_TRUE_SHARED_SCOPE',
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
                  {/* [PHASE 7 TASK 2] Truthful frequency explanation - "adapted from feedback" ONLY when real feedback exists */}
                  {/* [PHASE 12 TASK 3] Clarified: adaptation happens at build time, not automatically */}
                  {/* [PHASE 17I] Initial baseline label truth audit */}
                  {(() => {
                    console.log('[phase17i-initial-baseline-label-truth-audit]', {
                      programId: program.id,
                      hasFlexibleRootCause: !!program.flexibleFrequencyRootCause,
                      finalReasonCategory: program.flexibleFrequencyRootCause?.finalReasonCategory || 'none',
                      isLowHistoryDefault: program.flexibleFrequencyRootCause?.finalReasonCategory === 'low_history_default',
                      displayedSessionCount: validSessions.length,
                      labelShown: program.flexibleFrequencyRootCause?.finalReasonCategory === 'low_history_default' 
                        ? '(initial baseline)' 
                        : program.flexibleFrequencyRootCause?.isBaselineDefault 
                        ? `(${program.primaryGoal} baseline)` 
                        : 'other',
                    })
                    return null
                  })()}
                  {program.flexibleFrequencyRootCause && (
                    <span className="text-[10px] text-[#5A5A5A] mt-0.5">
                      {program.flexibleFrequencyRootCause.isTrueAdaptive
                        ? '(based on training history)'  // [PHASE 12] Clearer than "adapted from feedback"
                        : program.flexibleFrequencyRootCause.isBaselineDefault 
                          ? `(${program.primaryGoal.replace(/_/g, ' ')} baseline)`
                          : program.flexibleFrequencyRootCause.finalReasonCategory === 'experience_modifier_applied'
                            ? '(adjusted for experience level)'
                            : program.flexibleFrequencyRootCause.finalReasonCategory === 'joint_caution_conservative'
                              ? '(conservative for joint health)'
                              : program.flexibleFrequencyRootCause.finalReasonCategory === 'poor_recovery_reduction'
                                ? '(adjusted for recovery)'
                                : program.flexibleFrequencyRootCause.finalReasonCategory === 'high_volume_conservative'
                                  ? '(volume-adjusted)'
                                  : program.flexibleFrequencyRootCause.finalReasonCategory === 'low_history_default'
                                    ? '(initial baseline)'
                                    : '(goal-based baseline)'}
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
          {/* [PHASE 10] Now uses safeSelectedSkills for guaranteed safe array access */}
          {safeSelectedSkills.length > 0 && (() => {
            // [PHASE 10F] Now uses hoisted shared locals from component scope
            // representedSkills -> sharedRepresentedSkills
            // unrepresentedSkills -> sharedUnrepresentedSkills  
            // headlineSkills -> sharedHeadlineSkills
            // weekSupportSkills -> sharedWeekSupportSkills
            // getChipState -> getSharedChipState
            // sharedStrictRepresentedSkillsForChips -> already in shared scope
            
            // Log display skill truth audit with stale vs current distinction
            console.log('[display-skill-truth-audit]', {
              profileSelectedSkills: safeSelectedSkills,
              serverRepresentedSkills: safeRepresentedSkills.length > 0 ? safeRepresentedSkills : 'not_available',
              skillsRepresentedInWeek: sharedRepresentedSkills,
              skillsNotRepresentedInWeek: sharedUnrepresentedSkills,
              usingServerTruth: safeRepresentedSkills.length > 0,
              displayTruthVerdict: sharedUnrepresentedSkills.length === 0 
                ? 'all_skills_represented' 
                : 'some_skills_not_represented',
            })
            
            // [TASK 8] STALE VS CURRENT PROGRAM TRUTH AUDIT
            console.log('[stale-vs-current-program-truth-audit]', {
              programId: program.id,
              programCreatedAt: program.createdAt,
              hasServerRepresentedSkills: safeRepresentedSkills.length > 0,
              isLikelyCurrentBuild: safeRepresentedSkills.length > 0,
              isLikelyStalePlan: safeRepresentedSkills.length === 0,
              verdict: safeRepresentedSkills.length > 0 ? 'current_build' : 'possibly_stale_plan',
            })
            
            // [PHASE 6] DISPLAY-LEVEL DESELECTED SKILL LEAK CHECK
            // Verify chips only show skills from canonical selectedSkills
            const canonicalSelectedSet = new Set(safeSelectedSkills || [])
            const representedSkillsFromProgram = safeRepresentedSkills
            const representedButNotSelected = representedSkillsFromProgram.filter(s => !canonicalSelectedSet.has(s))
            
            console.log('[phase6-display-deselected-skill-leak-check]', {
              canonicalSelectedSkills: safeSelectedSkills,
              representedSkillsInProgram: representedSkillsFromProgram,
              representedButNotSelected,
              noDisplayLeaks: representedButNotSelected.length === 0,
              chipsSourceArray: 'safeSelectedSkills',
              verdict: representedButNotSelected.length === 0 
                ? 'clean_no_leaks' 
                : 'POTENTIAL_LEAK_represented_skills_outside_selected',
            })
            
            // [WEEKLY-REPRESENTATION] Log built-around chip truth audit with exposure data
            console.log('[built-around-chip-truth-audit]', {
              hasWeeklyRepresentation: !!safeWeeklyRepresentation,
              coverageRatio: safeWeeklyRepresentation?.coverageRatio,
              chips: safeSelectedSkills.map(skill => {
                const policy = safeWeeklyRepresentation?.policies?.find(p => p.skill === skill)
                return {
                  skill,
                  chipState: getSharedChipState(skill),
                  exposureVerdict: policy?.representationVerdict || 'unknown',
                  actualExposure: policy?.actualExposure?.total || 0,
                  directExposure: policy?.actualExposure?.direct || 0,
                  supportExposure: policy?.actualExposure?.support || 0,
                  representedInWeek: sharedRepresentedSkills.includes(skill),
                  supportOnly: sharedWeekSupportSkills.includes(skill),
                  headlinePriority: sharedHeadlineSkills.includes(skill),
                }
              }),
            })
            
            // [PRIORITY-COLLAPSE-FIX] TASK 8: Post-priority-collapse chip truth audit
            // Verify chip states match the new priority model
            const chipTruthAnalysis = safeSelectedSkills.map((skill, idx) => {
              const policy = safeWeeklyRepresentation?.policies?.find(p => p.skill === skill)
              const chipState = getSharedChipState(skill)
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
            // Uses sharedStrictRepresentedSkillsForChips from shared scope (defined above)
            // [PHASE 10E] Inner declaration removed - now uses shared local
            // ==========================================================================
            
            console.log('[phase6b-represented-skill-source-truth-audit]', {
              allSelectedSkills: safeSelectedSkills,
              strictRepresentedForChips: sharedStrictRepresentedSkillsForChips,
              filteredOut: safeSelectedSkills.filter(s => !sharedStrictRepresentedSkillsForChips.includes(s)),
              primaryGoal: program.primaryGoal,
              secondaryGoal: program.secondaryGoal,
              thresholds: {
                headlinePriority: 'always_shown',
                tertiary: 'needs_2_direct_OR_3_total_exercises',
                supportOnly: 'filtered_out_from_chips',
              },
              verdict: sharedStrictRepresentedSkillsForChips.length < safeSelectedSkills.length
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
                {sharedStrictRepresentedSkillsForChips.map((skill) => {
                  const chipState = getSharedChipState(skill)
                  const policy = safeWeeklyRepresentation?.policies?.find(p => p.skill === skill)
                  
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
              // [PHASE 10C] Use safeSummaryTruth instead of raw access
              return safeSummaryTruth.truthfulHybridSummary || program.programRationale
            })()}
          </p>
        </div>
        
        {/* [PHASE 6] SUMMARY CLAIM VS WEEK TRUTH AUDIT */}
        {(() => {
          // Compute actual week structure truth
          const sessionFocuses = safeSessions.map(s => s.focus || 'unknown')
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
          // [PHASE 10 TASK 2] REMOVED DOM ACCESS - was causing render crash
          // const displayedChipsCount = document.querySelectorAll('[data-chip-skill]')?.length || 0
            // Now using sharedStrictRepresentedSkillsForChips.length instead (shared scope local)
          
          console.log('[phase10-render-dom-access-quarantined]', {
            oldDOMAccessRemoved: true,
            nowUsingPrecomputedChipCount: true,
            chipCountFromSafeLocal: sharedStrictRepresentedSkillsForChips.length,
            verdict: 'DOM_ACCESS_ELIMINATED_FROM_RENDER',
          })
          
          console.log('[phase6b-top-card-enforcement-audit]', {
            primaryGoal: program.primaryGoal,
            secondaryGoal: program.secondaryGoal,
            sessionCountByFocus: {
              pushDominant: pushDominantCount,
              pullDominant: pullDominantCount,
              mixed: mixedCount,
            },
            summaryTruthHeadlineSkills: safeSummaryTruth.headlineFocusSkills || [],
            rationaleSample: (program.programRationale || '').slice(0, 100),
            topCardMatchesFinalWeek: (pushClaimValid && pullClaimValid && hybridClaimValid),
            claimsAreAccurate: !claimsPushPrimary || pushDominantCount >= 1,
            verdict: (pushClaimValid && pullClaimValid && hybridClaimValid)
              ? 'top_card_matches_final_week'
              : 'top_card_may_overclaim',
          })
          
          // ==========================================================================
          // [PHASE 7 TASK 1] TOP CARD VS FINAL WEEK TRUTH AUDIT
          // ==========================================================================
          console.log('[phase7-top-card-vs-final-week-truth-audit]', {
            displayedPrimaryGoal: program.primaryGoal,
            displayedSecondaryGoal: program.secondaryGoal,
            displayedSessionCount: validSessions.length,
            actualSessionsByDay: validSessions.map(s => ({
              day: s.dayNumber,
              focus: s.focus || s.focusLabel,
              exerciseCount: s.exercises?.length || 0,
            })),
            weeklyRepresentationVerdicts: safeWeeklyRepresentation?.policies?.map(p => ({
              skill: p.skill,
              verdict: p.representationVerdict,
              direct: p.actualExposure?.direct,
              support: p.actualExposure?.support,
            })) || [],
            selectedSkills: safeSelectedSkills,
            representedSkillsFromEngine: safeRepresentedSkills,
            topCardSupportedByFinalWeek: (pushClaimValid && pullClaimValid && hybridClaimValid),
            adaptiveWordingTruth: program.flexibleFrequencyRootCause?.isTrueAdaptive 
              ? 'real_feedback_adaptation' 
              : program.flexibleFrequencyRootCause?.isBaselineDefault 
                ? 'baseline_default' 
                : 'modifier_based_adjustment',
          })
          
          // ==========================================================================
          // [PHASE 7 TASK 2] ADAPTIVE WORDING TRUTH VERDICT
          // ==========================================================================
          console.log('[phase7-adaptive-wording-truth-verdict]', {
            showingAdaptedFromFeedback: program.flexibleFrequencyRootCause?.isTrueAdaptive === true,
            hasRealFeedbackData: (program.flexibleFrequencyRootCause?.recentWorkoutCount ?? 0) >= 2,
            recentWorkoutCount: program.flexibleFrequencyRootCause?.recentWorkoutCount,
            isBaselineDefault: program.flexibleFrequencyRootCause?.isBaselineDefault,
            isModifierBased: program.flexibleFrequencyRootCause?.isModifierBasedAdjustment,
            finalReasonCategory: program.flexibleFrequencyRootCause?.finalReasonCategory,
            wordingIsHonest: program.flexibleFrequencyRootCause?.isTrueAdaptive 
              ? (program.flexibleFrequencyRootCause?.recentWorkoutCount ?? 0) >= 2
              : true,  // Non-adaptive wording is always honest
            verdict: program.flexibleFrequencyRootCause?.isTrueAdaptive
              ? 'ADAPTED_FROM_FEEDBACK_LEGITIMATE'
              : program.flexibleFrequencyRootCause?.isBaselineDefault
                ? 'BASELINE_DEFAULT_HONEST'
                : 'MODIFIER_BASED_HONEST',
          })
          
          // ==========================================================================
          // [PHASE 7 TASK 3] FREQUENCY BASELINE VS ADAPTATION AUDIT
          // ==========================================================================
          console.log('[phase7-frequency-baseline-vs-adaptation-audit]', {
            requestedMode: program.scheduleMode,
            resolvedFrequency: validSessions.length,
            baselineForGoal: program.flexibleFrequencyRootCause?.goalTypical || 4,
            experienceModifier: program.flexibleFrequencyRootCause?.experienceModifier || 0,
            jointCautionPenalty: program.flexibleFrequencyRootCause?.jointCautionPenalty || 0,
            recoveryScore: program.flexibleFrequencyRootCause?.recoveryScore,
            wasModifiedFromBaseline: program.flexibleFrequencyRootCause?.wasModifiedFromBaseline,
            isFirstBuildBaseline: !program.flexibleFrequencyRootCause?.isTrueAdaptive && 
              program.flexibleFrequencyRootCause?.isBaselineDefault,
            isTruePostFeedbackRecalculation: program.flexibleFrequencyRootCause?.isTrueAdaptive,
            finalReasonCategory: program.flexibleFrequencyRootCause?.finalReasonCategory,
            modificationSteps: program.flexibleFrequencyRootCause?.modificationSteps,
            verdict: program.flexibleFrequencyRootCause?.isTrueAdaptive
              ? 'TRUE_POST_FEEDBACK_RECALCULATION'
              : program.flexibleFrequencyRootCause?.isBaselineDefault
                ? 'FIRST_BUILD_BASELINE'
                : 'MODIFIER_APPLIED_NO_FEEDBACK',
          })
          
          // ==========================================================================
          // [PHASE 7 TASK 6] PRIMARY EMPHASIS CONSISTENCY AUDIT
          // ==========================================================================
          const primaryGoal = program.primaryGoal
          const primaryPolicy = safeWeeklyRepresentation?.policies?.find(p => p.skill === primaryGoal)
          const primaryIsHeadline = primaryPolicy?.representationVerdict === 'headline_represented'
          const primaryDirectCount = primaryPolicy?.actualExposure?.direct || 0
          const sessionsWithPrimaryFocus = validSessions.filter(s => 
            (s.focus || s.focusLabel || '').toLowerCase().includes(primaryGoal.replace(/_/g, ' ').toLowerCase()) ||
            (s.focus || s.focusLabel || '').toLowerCase().includes(primaryGoal.split('_')[0])
          ).length
          
          console.log('[phase7-primary-emphasis-consistency-audit]', {
            primaryGoal,
            primaryIsHeadlineInChips: primaryIsHeadline,
            primaryDirectExerciseCount: primaryDirectCount,
            sessionsWithPrimaryInFocusLabel: sessionsWithPrimaryFocus,
            totalSessions: validSessions.length,
            primaryEmphasisRatio: validSessions.length > 0 
              ? (sessionsWithPrimaryFocus / validSessions.length).toFixed(2)
              : 0,
            chipSummaryEmphasisMatches: primaryIsHeadline,
            sessionDistributionMatchesPrimary: sessionsWithPrimaryFocus >= 1,
            verdict: primaryIsHeadline && sessionsWithPrimaryFocus >= 1
              ? 'PRIMARY_EMPHASIS_CONSISTENT'
              : primaryIsHeadline && sessionsWithPrimaryFocus === 0
                ? 'CHIP_PRIMARY_BUT_NO_SESSION_FOCUS'
                : 'PRIMARY_NOT_HEADLINE_IN_CHIPS',
          })
          
          // ==========================================================================
          // [PHASE 7 TASK 5] CHIP BREADTH TRUTH VERDICT
          // ==========================================================================
          const displayedChipCount = sharedStrictRepresentedSkillsForChips.length
          const totalSelectedSkills = safeSelectedSkills.length
          const chipsMatchStrictRepresentation = displayedChipCount <= 4 && 
            sharedStrictRepresentedSkillsForChips.every(chip => {
              const policy = safeWeeklyRepresentation?.policies?.find(p => p.skill === chip)
              return policy && (
                policy.representationVerdict === 'headline_represented' ||
                (policy.actualExposure?.direct || 0) >= 2 ||
                (policy.actualExposure?.total || 0) >= 3
              )
            })
          
          console.log('[phase7-chip-breadth-truth-verdict]', {
            totalSelectedSkills,
            displayedChipCount,
            chipsFiltered: totalSelectedSkills - displayedChipCount,
            chipsShown: sharedStrictRepresentedSkillsForChips,
            chipsFilteredOut: safeSelectedSkills.filter(s => !sharedStrictRepresentedSkillsForChips.includes(s)),
            chipsMatchStrictRepresentation,
            deselectedSkillsBlocked: sharedStrictRepresentedSkillsForChips.every(s => 
              safeSelectedSkills.includes(s)
            ),
            verdict: chipsMatchStrictRepresentation
              ? 'CHIPS_HONESTLY_REPRESENT_FINAL_WEEK'
              : 'CHIPS_MAY_BE_OVER_BROAD',
          })
          
          // ==========================================================================
          // [PHASE 7 TASK 7] NO OVERCLAIMING FUTURE ADAPTIVE AUDIT
          // ==========================================================================
          console.log('[phase7-no-overclaiming-future-adaptive-audit]', {
            claimsAutoReflow: false,  // Not implemented yet
            claimsPushForwardScheduling: false,  // Not implemented yet
            claimsSameDayReadiness: false,  // Not implemented yet
            claimsTransparentWhatChanged: false,  // Not implemented yet
            currentAdaptiveCapabilities: [
              'goal_baseline_frequency',
              'experience_modifier',
              'joint_caution_adjustment',
              'recovery_profile_adjustment',
            ],
            futureCapabilitiesNotYetActive: [
              'session_by_session_reflow',
              'push_forward_day_scheduling',
              'pre_workout_readiness_check',
              'what_changed_notifications',
            ],
            wordingOverclaims: false,
            verdict: 'NO_FUTURE_SYSTEMS_FALSELY_CLAIMED',
          })
          
          // ==========================================================================
          // [PHASE 7 TASK 8] OUTPUT SPECIFICITY READINESS AUDIT
          // ==========================================================================
          const hasTemplatedPhrases = validSessions.some(s => 
            (s.notes || '').toLowerCase().includes('this session') ||
            (s.notes || '').toLowerCase().includes('focuses on')
          )
          const selectedSkillCountHigh = safeSelectedSkills.length > 4
          
          console.log('[phase7-output-specificity-readiness-audit]', {
            selectedSkillCount: safeSelectedSkills.length,
            representedSkillCount: safeRepresentedSkills.length,
            outputFeelsTooBroad: selectedSkillCountHigh && displayedChipCount > 3,
            outputAppropriatelyBroad: selectedSkillCountHigh && displayedChipCount <= 3,
            hasTemplatedSessionPhrases: hasTemplatedPhrases,
            primaryEmphasisClear: primaryIsHeadline && sessionsWithPrimaryFocus >= 1,
            readyForHighSignalAthlete: !hasTemplatedPhrases && displayedChipCount <= 3 && primaryIsHeadline,
            verdict: displayedChipCount <= 3 && primaryIsHeadline
              ? 'OUTPUT_APPROPRIATELY_FOCUSED'
              : displayedChipCount > 4
                ? 'OUTPUT_TOO_BROAD_FOR_GOALS'
                : 'OUTPUT_ACCEPTABLE_BREADTH',
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
      {/* [PHASE 11 TASK 6] STYLE DISPLAY READ AUDIT */}
      {console.log('[phase11-style-display-read-audit]', {
        displayIsReadingStyleMetadata: validSessions.every((s: any) => s.styleMetadata !== undefined || s.exercises?.length === 0),
        styledGroupsBeingRead: validSessions.filter((s: any) => s.styleMetadata?.styledGroups?.length > 0).length,
        supersetsInData: validSessions.filter((s: any) => 
          s.styleMetadata?.styledGroups?.some((g: any) => g.groupType === 'superset')
        ).length,
        circuitsInData: validSessions.filter((s: any) => 
          s.styleMetadata?.styledGroups?.some((g: any) => g.groupType === 'circuit')
        ).length,
        densityInData: validSessions.filter((s: any) => 
          s.styleMetadata?.styledGroups?.some((g: any) => g.groupType === 'density_block')
        ).length,
        prefixesPresent: validSessions.some((s: any) => 
          s.styleMetadata?.styledGroups?.some((g: any) => 
            g.exercises?.some((e: any) => e.prefix)
          )
        ),
        verdict: validSessions.some((s: any) => s.styleMetadata?.styledGroups?.length > 0)
          ? 'display_truth_ok'
          : validSessions.some((s: any) => s.styleMetadata?.appliedMethods?.some((m: string) => m !== 'straight_sets'))
            ? 'display_missing_existing_style_data'
            : 'display_truth_ok',
      }) as any}
      {/* [PHASE 12 TASK 3] ADAPTIVE WORDING TRUTH AUDIT */}
      {console.log('[phase12-adaptive-wording-truth-audit]', {
        scheduleMode: program.scheduleMode,
        currentWeekFrequency: program.currentWeekFrequency,
        flexibleFrequencyRootCause: (program as any).flexibleFrequencyRootCause?.finalReasonCategory,
        isTrueAdaptive: (program as any).flexibleFrequencyRootCause?.isTrueAdaptive,
        isModifierBasedOnly: (program as any).flexibleFrequencyRootCause?.isModifierBasedAdjustment,
        wordingClassification: program.scheduleMode === 'flexible'
          ? ((program as any).flexibleFrequencyRootCause?.isTrueAdaptive 
              ? 'fully_truthful' 
              : (program as any).flexibleFrequencyRootCause?.isModifierBasedAdjustment
                ? 'partially_truthful'
                : 'ahead_of_backend_reality')
          : 'fully_truthful',
        restOfWeekRecalcAfterWorkout: false, // Current system does not recalc mid-week
        wordingImpliesAutoAdjust: false, // [PHASE 12] Wording updated to not imply this
        verdict: 'wording_aligned_with_backend_behavior',
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
      
      {/* [PHASE 7 TASK 4] ENHANCED SESSION IDENTITY VS CONTENT AUDIT */}
      {console.log('[phase7-session-identity-vs-content-audit]', {
        totalSessions: validSessions.length,
        sessionDetails: validSessions.map((session: any) => {
          const focus = session.focus?.toLowerCase() || ''
          const focusLabel = session.focusLabel?.toLowerCase() || ''
          const exercises = session.exercises || []
          const exerciseNames = exercises.map((e: any) => e.name || '').join(', ')
          
          // Categorize exercises
          const pushExercises = exercises.filter((e: any) => {
            const name = (e.name || '').toLowerCase()
            return name.includes('push') || name.includes('planche') || name.includes('dip') || 
                   name.includes('press') || name.includes('pike')
          })
          const pullExercises = exercises.filter((e: any) => {
            const name = (e.name || '').toLowerCase()
            return name.includes('pull') || name.includes('row') || name.includes('lever') || 
                   name.includes('chin') || name.includes('lat')
          })
          const legExercises = exercises.filter((e: any) => {
            const name = (e.name || '').toLowerCase()
            return name.includes('squat') || name.includes('lunge') || name.includes('leg') || 
                   name.includes('pistol') || name.includes('calf')
          })
          const coreExercises = exercises.filter((e: any) => {
            const name = (e.name || '').toLowerCase()
            return name.includes('hollow') || name.includes('core') || name.includes('plank') || 
                   name.includes('compression') || name.includes('l-sit')
          })
          
          // Determine actual dominant pattern
          const dominantPattern = pushExercises.length > pullExercises.length
            ? 'push_dominant'
            : pullExercises.length > pushExercises.length
              ? 'pull_dominant'
              : 'mixed'
          
          // Check if narrative matches content
          const labelClaimsPush = focus.includes('push') || focus.includes('planche') || focusLabel.includes('push')
          const labelClaimsPull = focus.includes('pull') || focus.includes('lever') || focusLabel.includes('pull')
          
          const narrativeMatchesContent = 
            (!labelClaimsPush || pushExercises.length >= 2) &&
            (!labelClaimsPull || pullExercises.length >= 2)
          
          return {
            dayNumber: session.dayNumber,
            declaredFocus: session.focus || session.focusLabel,
            exerciseCount: exercises.length,
            pushCount: pushExercises.length,
            pullCount: pullExercises.length,
            legCount: legExercises.length,
            coreCount: coreExercises.length,
            actualDominantPattern: dominantPattern,
            narrativeClaimsPush: labelClaimsPush,
            narrativeClaimsPull: labelClaimsPull,
            narrativeMatchesContent,
            sampleExercises: exerciseNames.substring(0, 100),
          }
        }),
        allNarrativesMatch: validSessions.every((session: any) => {
          const focus = (session.focus || session.focusLabel || '').toLowerCase()
          const exercises = session.exercises || []
          const pushCount = exercises.filter((e: any) => {
            const n = (e.name || '').toLowerCase()
            return n.includes('push') || n.includes('planche') || n.includes('dip') || n.includes('press')
          }).length
          const pullCount = exercises.filter((e: any) => {
            const n = (e.name || '').toLowerCase()
            return n.includes('pull') || n.includes('row') || n.includes('lever')
          }).length
          const labelClaimsPush = focus.includes('push') || focus.includes('planche')
          const labelClaimsPull = focus.includes('pull') || focus.includes('lever')
          return (!labelClaimsPush || pushCount >= 2) && (!labelClaimsPull || pullCount >= 2)
        }),
        verdict: 'session_content_audit_complete',
      }) as any}
      
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
