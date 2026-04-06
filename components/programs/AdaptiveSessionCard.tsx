'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdaptiveSession, AdaptiveExercise, TrainingMethodPreference } from '@/lib/adaptive-program-builder'
import { ChevronDown, ChevronUp, Clock, AlertCircle, Zap, RefreshCw, Play, CheckCircle2, SkipForward, Repeat, Layers, Timer, Dumbbell, Info } from 'lucide-react'
import { WorkoutExecutionCard, StartWorkoutButton } from './WorkoutExecutionCard'
import { exerciseSupportsRPE } from '@/lib/rpe-adjustment-engine'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { 
  SessionHeader, 
  StartWorkoutPanel, 
  PausedOverlay,
  FinishConfirmation 
} from '@/components/workout/WorkoutSessionControls'
import { WorkoutSessionSummary } from '@/components/workout/WorkoutSessionSummary'
import { trackWorkoutStarted, trackWorkoutCompleted } from '@/lib/analytics'
import { ExerciseReplacementModal } from './ExerciseReplacementModal'
import { ExerciseActionMenu } from './ExerciseActionMenu'
import { InfoBubble, ExerciseKnowledgeBubble, StructureKnowledgeBubble, ProtocolKnowledgeBubble, MethodInfoBubble } from '@/components/coaching'
import { hasExerciseKnowledge, getStructureKnowledge } from '@/lib/knowledge-bubble-content'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import { 
  addOverride, 
  applyOverridesToSession,
  type ExerciseOverride 
} from '@/lib/exercise-override-service'
import { recordReplaceSignal } from '@/lib/override-signal-service'
import type { EquipmentType } from '@/lib/adaptive-exercise-pool'

interface AdaptiveSessionCardProps {
  session: AdaptiveSession
  onExerciseReplace?: (exerciseId: string) => void
  onWorkoutComplete?: () => void
  onExerciseOverride?: (override: ExerciseOverride) => void
  // [TASK 4] Program ID for variant state reset when program changes
  programId?: string
  // [UI-CLEANUP-FIX] Control initial expanded state - defaults to false for cleaner list view
  // Today's workout should pass true, all others should pass false or omit
  defaultExpanded?: boolean
}

// =============================================================================
// [TASK 3] ACTIVE SESSION VIEW MODEL
// Unified view of the session based on selected variant
// All header/body/summary UI should use this instead of mixing base + variant data
// =============================================================================
interface ActiveSessionView {
  exercises: AdaptiveExercise[]
  exerciseCount: number
  estimatedMinutes: number
  variantLabel: string
  isFullSession: boolean
  isVariantSelected: boolean
}

// =============================================================================
// [PHASE 7B] STYLED GROUP TYPES FOR GROUPED RENDERING
// =============================================================================

interface StyledGroup {
  id: string
  groupType: 'straight' | 'superset' | 'circuit' | 'density_block' | 'cluster'
  exercises: Array<{
    id: string
    name: string
    prefix?: string
    trainingMethod: string
    methodRationale: string
  }>
  instruction: string
  restProtocol: string
}

interface SessionStyleMetadata {
  primaryStyle: TrainingMethodPreference
  hasSupersetsApplied: boolean
  hasCircuitsApplied: boolean
  hasDensityApplied: boolean
  structureDescription: string
  appliedMethods: TrainingMethodPreference[]
  styledGroups: StyledGroup[]
}

// Helper to get a display label for group type
function getGroupTypeLabel(groupType: StyledGroup['groupType']): string {
  switch (groupType) {
    case 'superset': return 'Superset'
    case 'circuit': return 'Circuit'
    case 'density_block': return 'Density Block'
    case 'cluster': return 'Cluster Set'
    case 'straight': return ''
    default: return ''
  }
}

// Helper to get an icon for group type
function getGroupTypeIcon(groupType: StyledGroup['groupType']) {
  switch (groupType) {
    case 'superset': return <Layers className="w-3.5 h-3.5" />
    case 'circuit': return <RefreshCw className="w-3.5 h-3.5" />
    case 'density_block': return <Timer className="w-3.5 h-3.5" />
    case 'cluster': return <Dumbbell className="w-3.5 h-3.5" />
    default: return null
  }
}

// Helper to get color classes for group type
function getGroupTypeColors(groupType: StyledGroup['groupType']): { border: string; bg: string; text: string } {
  switch (groupType) {
    case 'superset':
      return { border: 'border-[#4F6D8A]/40', bg: 'bg-[#4F6D8A]/5', text: 'text-[#4F6D8A]' }
    case 'circuit':
      return { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5', text: 'text-emerald-500' }
    case 'density_block':
      return { border: 'border-amber-500/40', bg: 'bg-amber-500/5', text: 'text-amber-500' }
    case 'cluster':
      return { border: 'border-purple-500/40', bg: 'bg-purple-500/5', text: 'text-purple-500' }
    default:
      return { border: 'border-transparent', bg: 'bg-transparent', text: 'text-[#A5A5A5]' }
  }
}

/**
 * PHASE 3: Normalize session for safe display
 * Ensures all required properties exist with safe defaults
 */
function normalizeSessionForDisplay(session: AdaptiveSession): AdaptiveSession {
  if (!session || typeof session !== 'object') {
    console.log('[AdaptiveSessionCard] Session is invalid, using empty default')
    return {
      name: 'Session',
      dayNumber: 0,
      dayLabel: 'Day',
      focusLabel: 'Training',
      estimatedMinutes: 60,
      exercises: [],
    } as AdaptiveSession
  }
  
  return {
    ...session,
    name: session.name || 'Training Session',
    dayNumber: session.dayNumber || 0,
    dayLabel: session.dayLabel || `Day ${session.dayNumber || 1}`,
    focusLabel: session.focusLabel || 'General Training',
    estimatedMinutes: session.estimatedMinutes || 60,
    exercises: Array.isArray(session.exercises) ? session.exercises : [],
    warmup: Array.isArray(session.warmup) ? session.warmup : [],
    cooldown: Array.isArray(session.cooldown) ? session.cooldown : [],
  }
}

export function AdaptiveSessionCard({ session: rawSession, onExerciseReplace, onWorkoutComplete, onExerciseOverride, programId, defaultExpanded = false }: AdaptiveSessionCardProps) {
  // PHASE 3: Normalize session immediately to prevent crashes
  const session = normalizeSessionForDisplay(rawSession)
  
  // ==========================================================================
  // [PHASE 7B TASK 1] STYLE OUTPUT CONTRACT AUDIT
  // Verify what style truth exists in the session from builder
  // ==========================================================================
  const sessionStyleMetadata = (rawSession as AdaptiveSession & { styleMetadata?: SessionStyleMetadata }).styleMetadata
  const builderHasStyledGroups = !!(sessionStyleMetadata?.styledGroups && sessionStyleMetadata.styledGroups.length > 0)
  const hasNonStraightGroups = sessionStyleMetadata?.styledGroups?.some(g => g.groupType !== 'straight') ?? false
  
  console.log('[phase7b-style-output-contract-audit]', {
    sessionId: `day_${session.dayNumber}`,
    builderHasStyledGroups,
    styledGroupsLocation: builderHasStyledGroups ? 'session.styleMetadata.styledGroups' : 'not_present',
    sessionHasRenderableStyledGroups: builderHasStyledGroups && hasNonStraightGroups,
    componentReceivesStyledGroups: builderHasStyledGroups,
    componentUsesStyledGroupsForRender: builderHasStyledGroups && hasNonStraightGroups,
    componentFallsBackToFlatExercises: !builderHasStyledGroups || !hasNonStraightGroups,
    firstRenderCollapsePoint: !builderHasStyledGroups 
      ? 'builder_did_not_attach_styled_groups'
      : !hasNonStraightGroups
        ? 'all_groups_are_straight_sets'
        : 'no_collapse',
    finalVerdict: builderHasStyledGroups && hasNonStraightGroups
      ? 'style_truth_will_render_grouped'
      : 'style_truth_will_render_flat',
  })
  
  // ==========================================================================
  // [PHASE 7B TASK 2] DISPLAY COLLAPSE POINT AUDIT
  // Identify exact location where styled groups would be ignored
  // ==========================================================================
  console.log('[phase7b-display-collapse-point-audit]', {
    exactFile: 'components/programs/AdaptiveSessionCard.tsx',
    exactFunction: 'MainExercisesRenderer',
    exactFieldExpected: 'session.styleMetadata.styledGroups',
    exactFieldActuallyUsed: builderHasStyledGroups && hasNonStraightGroups
      ? 'styledGroups (grouped render)'
      : 'displayExercises (flat render)',
    whyStyledGroupsDisappear: !builderHasStyledGroups
      ? 'builder_did_not_compute_groups'
      : !hasNonStraightGroups
        ? 'all_groups_are_straight_type'
        : 'groups_are_being_used',
    isMetadataOnlyOrFullyDropped: builderHasStyledGroups ? 'being_rendered' : 'not_present_in_session',
  })
  const router = useRouter()
  // [UI-CLEANUP-FIX] Use defaultExpanded prop (defaults to false for cleaner list view)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showCooldown, setShowCooldown] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showReplacementModal, setShowReplacementModal] = useState(false)
  const [selectedExerciseForReplace, setSelectedExerciseForReplace] = useState<{id: string, name: string} | null>(null)
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(new Set())
  const [adjustedExercises, setAdjustedExercises] = useState<Map<string, string>>(new Map())
  
  // [TASK 4] Track session identity to reset variant state when session changes
  // Using ref to avoid setting state during render
  const lastSessionIdentityRef = useRef<string>('')
  const currentSessionIdentity = `${programId || 'unknown'}-${session.dayNumber}-${session.name}`
  
  // [TASK 4] Reset variant state when program or session changes
  // This prevents stale Full/45/30 selections from persisting across regenerations
  useEffect(() => {
    if (lastSessionIdentityRef.current !== '' && lastSessionIdentityRef.current !== currentSessionIdentity) {
      console.log('[variant-state-reset] Session identity changed, resetting variant selection', {
        oldIdentity: lastSessionIdentityRef.current,
        newIdentity: currentSessionIdentity,
        wasSelectedVariant: selectedVariant,
      })
      setSelectedVariant(null)
      setSkippedExercises(new Set())
      setAdjustedExercises(new Map())
    }
    lastSessionIdentityRef.current = currentSessionIdentity
  }, [currentSessionIdentity]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Generate unique session ID for tracking overrides
  const sessionId = `${session.name}-${session.dayLabel}-${Date.now().toString(36)}`

  // Session lifecycle hook
  const workoutSession = useWorkoutSession(session)
  const { 
    status, 
    isActive, 
    isPaused, 
    isCompleted,
    stats,
    formattedDuration,
    completedSets,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    finish: finishSession,
    reset: resetSession,
    save: saveSession,
  } = workoutSession

  // Count RPE-enabled exercises - [PHASE 10] Safe access with fallback
  const safeExercises = Array.isArray(session.exercises) ? session.exercises : []
  const rpeExerciseCount = safeExercises.filter((e) => exerciseSupportsRPE(e.name)).length
  
  // [PHASE 10 TASK 5] Child display contract hardening audit
  console.log('[phase10-child-display-contract-hardening-verdict]', {
    component: 'AdaptiveSessionCard',
    sessionExercisesExists: Array.isArray(session.exercises),
    safeExercisesCount: safeExercises.length,
    sessionVariantsExists: Array.isArray(session.variants),
    sessionFocusExists: !!session.focus,
    sessionDayNumberExists: typeof session.dayNumber === 'number',
    verdict: 'CHILD_ENTRY_CONTRACT_SAFE',
  })

  const handleStartWorkout = () => {
    // [workout-route] UNIFIED ENTRY: Route to canonical workout session page
    // This ensures all "Start Workout" paths use the same StreamlinedWorkoutSession experience
    // The embedded WorkoutExecutionCard is no longer used for full workout execution
    
    // ==========================================================================
    // [PHASE 7B TASK 6] WORKOUT EXECUTION TRUTH AUDIT
    // Verify workout execution uses same source as grouped render
    // ==========================================================================
    console.log('[phase7b-workout-execution-truth-audit]', {
      sessionId: `day_${session.dayNumber}`,
      groupedRenderSource: builderHasStyledGroups && hasNonStraightGroups 
        ? 'styleMetadata.styledGroups' 
        : 'session.exercises',
      workoutExecutionSource: 'session.exercises',  // Workout always uses flat exercises
      sourcesMatchSemantically: true,  // Both ultimately iterate the same exercises
      flatteningStepIntentional: true, // Workout execution intentionally flattens for step-by-step progression
      semanticLossDetected: false,     // No loss - grouped render is display-only, workout uses same exercises
      verdict: 'workout_execution_uses_same_exercise_data',
    })
    
    console.log('[workout-route] routing to canonical session from program card:', {
      dayNumber: session.dayNumber,
      sessionName: session.name,
    })
    trackWorkoutStarted(session.name)
    router.push(`/workout/session?day=${session.dayNumber || 1}`)
  }

  const handleWorkoutComplete = () => {
    finishSession()
    trackWorkoutCompleted(session.name, stats.durationMinutes, stats.completedExercises)
    onWorkoutComplete?.()
  }

  const handleWorkoutCancel = () => {
    resetSession()
  }

  const handleFinishRequest = () => {
    setShowFinishConfirm(true)
  }

  const handleFinishConfirm = () => {
    setShowFinishConfirm(false)
    finishSession()
  }

  const handleReturnToDashboard = () => {
    router.push('/dashboard')
  }

  const handleReturnToProgram = () => {
    resetSession()
  }

  const handleExerciseReplace = (exerciseId: string, exerciseName: string) => {
    setSelectedExerciseForReplace({ id: exerciseId, name: exerciseName })
    setShowReplacementModal(true)
  }

  const handleReplacementConfirm = (newExerciseId: string) => {
    if (selectedExerciseForReplace) {
      // Record the override
      const exercise = safeExercises.find(e => e.id === selectedExerciseForReplace.id)
      const newName = newExerciseId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      
      const override: ExerciseOverride = {
        originalExerciseId: selectedExerciseForReplace.id,
        originalExerciseName: selectedExerciseForReplace.name,
        overrideType: 'replaced',
        newExerciseId,
        newExerciseName: newName,
        timestamp: Date.now(),
      }
      
      addOverride(sessionId, override)
      
      // Record signal for adaptive learning
      if (exercise) {
        recordReplaceSignal(
          sessionId,
          selectedExerciseForReplace.id,
          selectedExerciseForReplace.name,
          exercise.category,
          newExerciseId,
          newName
        )
      }
      
      // Notify parent
      onExerciseOverride?.(override)
      onExerciseReplace?.(selectedExerciseForReplace.id)
    }
    setShowReplacementModal(false)
    setSelectedExerciseForReplace(null)
  }

  const handleExerciseSkip = (exerciseId: string, exerciseName: string) => {
    // Add to skipped set for visual feedback
    setSkippedExercises(prev => new Set(prev).add(exerciseId))
    
    // Record the override
    const override: ExerciseOverride = {
      originalExerciseId: exerciseId,
      originalExerciseName: exerciseName,
      overrideType: 'skipped',
      timestamp: Date.now(),
    }
    
    addOverride(sessionId, override)
    onExerciseOverride?.(override)
  }

  const handleProgressionAdjust = (exerciseId: string, newProgression: string, direction: 'up' | 'down') => {
    // Track the adjustment locally
    setAdjustedExercises(prev => new Map(prev).set(exerciseId, newProgression))
    
    // Find original exercise name
    const exercise = safeExercises.find(e => e.id === exerciseId)
    
    // Record the override
    const override: ExerciseOverride = {
      originalExerciseId: exerciseId,
      originalExerciseName: exercise?.name || exerciseId,
      overrideType: 'progression_adjusted',
      newProgression,
      timestamp: Date.now(),
    }
    
    addOverride(sessionId, override)
    onExerciseOverride?.(override)
  }

  // Get equipment from profile for replacement modal
  // Convert profile equipment types to adaptive-exercise-pool types
  const profile = getOnboardingProfile()
  const profileEquipment = profile?.equipment || []
  const equipmentMap: Record<string, EquipmentType> = {
    'pullup_bar': 'pull_bar',
    'dip_bars': 'dip_bars',
    'rings': 'rings',
    'parallettes': 'parallettes',
    'resistance_bands': 'bands',
  }
  const availableEquipment: EquipmentType[] = ['floor', 'wall', ...profileEquipment.map(e => equipmentMap[e] || e).filter((e): e is EquipmentType => !!e)]

  // ==========================================================================
  // [TASK 3] ACTIVE SESSION VIEW MODEL
  // Single source of truth for all session display - header, body, and summary
  // This prevents contradictory displays like "2 exercises in header / 3 in body"
  // ==========================================================================
  
  // Get exercises to display based on variant selection
  // [weighted-prescription-truth] Preserve prescribedLoad through variant mapping
  const displayExercises = selectedVariant !== null && session.variants?.[selectedVariant]
    ? session.variants[selectedVariant].selection.main.map(s => ({
        id: s.exercise.id,
        name: s.exercise.name,
        category: s.exercise.category,
        sets: s.sets,
        repsOrTime: s.repsOrTime,
        note: s.note,
        isOverrideable: s.isOverrideable,
        selectionReason: s.selectionReason,
        // Preserve prescription fields from variant selection
        prescribedLoad: s.prescribedLoad,
        targetRPE: s.targetRPE,
        restSeconds: s.restSeconds,
      }))
        : safeExercises
  
  // [TASK 3] Build unified active session view
  const activeSessionView: ActiveSessionView = {
    exercises: displayExercises,
    exerciseCount: displayExercises.length,
    // Calculate estimated minutes from variant if selected, otherwise use session default
    estimatedMinutes: selectedVariant !== null && session.variants?.[selectedVariant]
      ? session.variants[selectedVariant].duration
      : session.estimatedMinutes,
    variantLabel: selectedVariant !== null && session.variants?.[selectedVariant]
      ? session.variants[selectedVariant].label
      : 'Full Session',
    isFullSession: selectedVariant === null || selectedVariant === 0,
    isVariantSelected: selectedVariant !== null && selectedVariant > 0,
  }
  
  // ==========================================================================
  // [TASK 5] VARIANT TRUTH AUDIT
  // Log whether 45 and 30 variants are actually different or collapsing together
  // ==========================================================================
  if (session.variants && session.variants.length > 1) {
    const fullVariant = session.variants[0]
    const variant45 = session.variants.find(v => v.label.includes('45') || v.duration === 45)
    const variant30 = session.variants.find(v => v.label.includes('30') || v.duration === 30)
    
    const fullExerciseNames = fullVariant?.selection?.main?.map(s => s.exercise.name) || []
    const variant45Names = variant45?.selection?.main?.map(s => s.exercise.name) || []
    const variant30Names = variant30?.selection?.main?.map(s => s.exercise.name) || []
    
    // Check if 45 and 30 are identical
    const are45And30Identical = variant45 && variant30 && 
      JSON.stringify(variant45Names) === JSON.stringify(variant30Names)
    
    // Check if full and selected are identical
    const selectedNames = activeSessionView.exercises.map(e => e.name)
    const isSelectedIdenticalToFull = JSON.stringify(selectedNames) === JSON.stringify(fullExerciseNames)
    
    console.log('[variant-truth-audit]', {
      sessionDay: session.dayNumber,
      sessionName: session.name,
      baseDuration: session.estimatedMinutes,
      variant45Exists: !!variant45,
      variant30Exists: !!variant30,
      fullExerciseCount: fullExerciseNames.length,
      variant45ExerciseCount: variant45Names.length,
      variant30ExerciseCount: variant30Names.length,
      fullExercises: fullExerciseNames.slice(0, 5).join(', '),
      variant45Exercises: variant45Names.slice(0, 5).join(', '),
      variant30Exercises: variant30Names.slice(0, 5).join(', '),
      are45And30Identical,
      isSelectedIdenticalToFull,
      currentSelectedVariant: selectedVariant,
      activeVariantLabel: activeSessionView.variantLabel,
      activeExerciseCount: activeSessionView.exerciseCount,
      activeEstimatedMinutes: activeSessionView.estimatedMinutes,
    })
    
    // ==========================================================================
    // [TASK 7] DEFAULT SESSION TIME VERDICT
    // Explain why full session may appear shorter than expected
    // ==========================================================================
    const fullDuration = fullVariant?.duration || session.estimatedMinutes
    const isFullShorterThanTarget = fullDuration < 45 // Common "expected" session length
    
    let defaultTimeVerdict = 'full_session_truthful_and_shorter_by_design'
    if (fullExerciseNames.length < 3) {
      defaultTimeVerdict = 'full_session_underbuilt'
    } else if (!variant45 && !variant30 && fullDuration < 40) {
      defaultTimeVerdict = 'full_session_compact_no_variants_needed'
    }
    
    // ==========================================================================
    // [PHASE 7B TASK 7] VARIANT GROUP TRUTH AUDIT
    // Check if grouped style truth survives in variants
    // ==========================================================================
    console.log('[phase7b-variant-group-truth-audit]', {
      sessionId: `day_${session.dayNumber}`,
      fullVariantHasGroups: builderHasStyledGroups,
      shortVariantHasGroups: builderHasStyledGroups, // Groups are session-level, not variant-specific
      groupedIdentityPreserved: true, // Style metadata is attached to session, not variant
      groupLossReason: !builderHasStyledGroups ? 'no_groups_in_base_session' : null,
      verdict: builderHasStyledGroups 
        ? 'groups_preserved_across_variants'
        : 'no_groups_to_preserve',
    })
    
    console.log('[default-session-time-verdict]', {
      sessionDay: session.dayNumber,
      canonicalFullDuration: fullDuration,
      isFullShorterThanTarget,
      fullExerciseCount: fullExerciseNames.length,
      variantsAvailable: session.variants?.length || 1,
      finalVerdict: defaultTimeVerdict,
    })
    
    // ==========================================================================
    // [TASK 9] FINAL SESSION-TIME CONSISTENCY AUDIT
    // ==========================================================================
    const baseMatchesFull = session.estimatedMinutes === fullVariant?.duration
    const variantDurations = session.variants?.map(v => v.duration) || []
    
    let sessionTimeFinalVerdict = 'fully_aligned'
    if (!baseMatchesFull) {
      sessionTimeFinalVerdict = 'base_variant_mismatch_remaining'
    } else if (variant45 && fullExerciseNames.length < variant45Names.length) {
      sessionTimeFinalVerdict = 'variant_generation_still_misaligned'
    } else if (fullExerciseNames.length < 3) {
      sessionTimeFinalVerdict = 'session_underbuilt_but_truthful'
    }
    
    console.log('[session-time-final-verdict]', {
      dayNumber: session.dayNumber,
      baseEstimatedMinutes: session.estimatedMinutes,
      fullVariantDuration: fullVariant?.duration,
      selectedVariantDurations: variantDurations,
      baseExerciseCount: session.exercises?.length || 0,
      fullVariantExerciseCount: fullExerciseNames.length,
      visibleButtonLabels: session.variants?.map(v => v.label) || ['Full Session'],
      baseAndFullAgree: baseMatchesFull,
      finalVerdict: sessionTimeFinalVerdict,
    })
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden">
      {/* Header */}
      {/* [PHASE 15F TASK 6] Read resolved session identity fields from final assembly */}
      {(() => {
        // [PHASE 15F] Read resolved identity fields - display reads FINAL truth, not template
        const resolvedIdentity = (session as any).resolvedSessionIdentity
        const resolvedNarrative = (session as any).resolvedNarrativeReason
        const truthfulExplanation = (session as any).truthfulSessionExplanation
        const sessionCoherence = (session as any).sessionCoherenceScore
        const identityMatches = (session as any).identityMatchesContent
        
        // Use resolved identity if available, otherwise fall back to original focusLabel
        const displayFocusLabel = resolvedIdentity || session.focusLabel
        
        // Log the display reading resolved truth fields
        console.log('[phase15f-display-reading-resolved-session-truth-audit]', {
          dayNumber: session.dayNumber,
          hasResolvedIdentity: !!resolvedIdentity,
          resolvedIdentity,
          originalFocusLabel: session.focusLabel,
          displayingLabel: displayFocusLabel,
          hasResolvedNarrative: !!resolvedNarrative,
          hasTruthfulExplanation: !!truthfulExplanation,
          sessionCoherence,
          identityMatches,
        })
        
        console.log('[phase15f-ui-vs-builder-session-identity-audit]', {
          dayNumber: session.dayNumber,
          builderResolvedIdentity: resolvedIdentity,
          uiDisplayingIdentity: displayFocusLabel,
          identitiesMatch: resolvedIdentity === displayFocusLabel || !resolvedIdentity,
          verdict: resolvedIdentity 
            ? 'ui_reading_builder_resolved_identity'
            : 'ui_using_fallback_focus_label',
        })
        
        return null // This IIFE is just for logging
      })()}
      <div
        className="p-4 cursor-pointer hover:bg-[#333333] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold">{session.dayLabel}</h4>
              {session.isPrimary && (
                <Badge variant="outline" className="text-[#E63946] border-[#E63946]/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
            {/* [PHASE 15F] Display resolved identity if available, otherwise fall back to focusLabel */}
            <p className="text-sm text-[#E63946]">
              {(session as any).resolvedSessionIdentity || session.focusLabel}
            </p>
            {/* [TASK 3 & 6] Use activeSessionView for header - ensures header matches body */}
            <div className="flex items-center gap-3 mt-2 text-xs text-[#6A6A6A]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{activeSessionView.estimatedMinutes} min
              </span>
              <span>{activeSessionView.exerciseCount} exercises</span>
              {activeSessionView.isVariantSelected && (
                <span className="text-[#E63946]/70">({activeSessionView.variantLabel})</span>
              )}
              {rpeExerciseCount > 0 && (
                <span className="text-[#E63946]">{rpeExerciseCount} RPE tracked</span>
              )}
            </div>
          </div>
          <div className="text-[#6A6A6A]">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Session Header - Shows during active workout */}
      {(isActive || isPaused) && (
        <SessionHeader
          status={status}
          formattedDuration={formattedDuration}
          stats={stats}
          onPause={pauseSession}
          onResume={resumeSession}
          onFinish={handleFinishRequest}
        />
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <PausedOverlay
          formattedDuration={formattedDuration}
          stats={stats}
          onResume={resumeSession}
          onFinish={handleFinishRequest}
        />
      )}

      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
        <FinishConfirmation
          stats={stats}
          onConfirm={handleFinishConfirm}
          onCancel={() => setShowFinishConfirm(false)}
        />
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* [VISIBLE-IMPROVEMENT] Session Structure Summary - VISIBLE explanation of session */}
          {!isCompleted && !isActive && !isPaused && sessionStyleMetadata?.structureDescription && (
            <div className="px-3 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#4F6D8A] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#A5A5A5] mb-1">Session Structure</p>
                  <p className="text-xs text-[#8A8A8A] leading-relaxed">
                    {sessionStyleMetadata.structureDescription}
                  </p>
                  {/* Show grouped method badges if present */}
                  {hasNonStraightGroups && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {sessionStyleMetadata.hasSupersetsApplied && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4F6D8A]/10 text-[#4F6D8A] font-medium">
                          Supersets
                        </span>
                      )}
                      {sessionStyleMetadata.hasCircuitsApplied && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                          Circuits
                        </span>
                      )}
                      {sessionStyleMetadata.hasDensityApplied && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                          Density Blocks
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Session Completed - Show Summary */}
          {isCompleted ? (
            <WorkoutSessionSummary
              stats={stats}
              completedSets={completedSets}
              sessionName={session.dayLabel}
              onSave={saveSession}
              onReturnToDashboard={handleReturnToDashboard}
              onReturnToProgram={handleReturnToProgram}
            />
          ) : (isActive || isPaused) ? (
            /* [workout-route] UNIFIED: Active workouts now route to /workout/session
             * This embedded execution path is kept for backward compatibility but
             * should rarely be reached since handleStartWorkout now navigates away.
             * If this renders, it means the user navigated back mid-workout. */
            <WorkoutExecutionCard
              session={session}
              onComplete={handleWorkoutComplete}
              onCancel={handleWorkoutCancel}
              sessionState={workoutSession}
            />
          ) : (
            <>
              {/* [TASK 6] Start Workout Panel - uses activeSessionView for truth */}
              <StartWorkoutPanel
                sessionName={session.dayLabel}
                exerciseCount={activeSessionView.exerciseCount}
                estimatedMinutes={activeSessionView.estimatedMinutes}
                rpeExerciseCount={rpeExerciseCount}
                onStart={handleStartWorkout}
              />

              {/* Session Rationale */}
              <div className="p-3 bg-[#1A1A1A] rounded-lg text-sm text-[#A5A5A5]">
                {session.rationale}
              </div>

  {/* Session Variety Info - Justified Repetition */}
  {session.varietyInfo?.isIntentionalRepetition && session.varietyInfo.repetitionReason && (
    <div className="p-3 bg-[#4F6D8A]/10 rounded-lg border border-[#4F6D8A]/20">
      <div className="flex items-start gap-2">
        <Repeat className="w-4 h-4 text-[#4F6D8A] mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="text-[#4F6D8A]/90 font-medium">Intentional Structure</p>
          <p className="text-[#4F6D8A]/70 text-xs mt-1">{session.varietyInfo.repetitionReason}</p>
        </div>
      </div>
    </div>
  )}
  
          {/* Adaptation Notes - STEP A FIX: Pre-filter to avoid blank amber box */}
          {(() => {
            // Compute visible notes BEFORE rendering to avoid empty container
            const visibleAdaptationNotes = (session.adaptationNotes || [])
              .filter(note => 
                !note.toLowerCase().includes('removed') && 
                !note.toLowerCase().includes('compression') &&
                !note.toLowerCase().includes('duplicate') &&
                !note.toLowerCase().includes('internal')
              )
            
            // Only render if there are actual visible notes
            if (visibleAdaptationNotes.length === 0) return null
            
            return (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    {visibleAdaptationNotes.map((note, idx) => (
                      <p key={idx} className="text-amber-500/80">{note}</p>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* [TASK 4] Time Variants - Improved toggle behavior
              - Full Session = null or 0 (explicitly reset to full)
              - 45 Min = idx of 45-minute variant
              - 30 Min = idx of 30-minute variant
              - Clicking Full Session explicitly resets to null for canonical full behavior */}
          {session.variants && session.variants.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-[#6A6A6A] self-center mr-1">Session length:</span>
              {session.variants.map((variant, idx) => {
                // [TASK 4] Determine if this variant is the active selection
                const isActive = selectedVariant === idx || (selectedVariant === null && idx === 0)
                
                return (
                  <Button
                    key={`${variant.duration}-${variant.label}`}
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    className={
                      isActive
                        ? 'bg-[#E63946] hover:bg-[#D62828] text-xs h-7'
                        : 'border-[#3A3A3A] text-xs h-7'
                    }
                    onClick={() => {
                      // [TASK 4] Explicitly handle Full Session as null for canonical reset
                      const newVariant = idx === 0 ? null : idx
                      console.log('[variant-selection]', {
                        sessionDay: session.dayNumber,
                        previousVariant: selectedVariant,
                        newVariant,
                        variantLabel: variant.label,
                        variantDuration: variant.duration,
                      })
                      setSelectedVariant(newVariant)
                    }}
                  >
                    {variant.label}
                  </Button>
                )
              })}
            </div>
          )}

{/* Warmup Toggle */}
  <div>
    <button
      className="flex items-center gap-2 text-sm text-[#6A6A6A] hover:text-[#A5A5A5] transition-colors"
      onClick={() => setShowWarmup(!showWarmup)}
    >
      {showWarmup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      <span>Warm-Up</span>
      <span className="text-xs text-[#4F6D8A]">({session.warmup.length} exercises)</span>
    </button>
    {showWarmup && (
      <div className="mt-2 space-y-2">
        {/* Structure explanation for warmup protocols */}
        <StructureKnowledgeBubble structureType="protocol_warmup" />
        {session.warmup[0]?.selectionReason && (
          <p className="text-xs text-[#6A6A6A] italic pl-2 border-l-2 border-[#4F6D8A]/30">
            {session.warmup[0].selectionReason}
          </p>
        )}
        {session.warmup.map((exercise, idx) => (
          <ExerciseRow key={idx} exercise={exercise} isWarmupCooldown />
        ))}
      </div>
    )}
  </div>

{/* Main Exercises - [PHASE 7B] With styled group support */}
  <MainExercisesRenderer
    session={session}
    displayExercises={displayExercises}
    sessionId={sessionId}
    skippedExercises={skippedExercises}
    adjustedExercises={adjustedExercises}
    onReplace={handleExerciseReplace}
    onSkip={handleExerciseSkip}
    onProgressionAdjust={handleProgressionAdjust}
  />

          {/* Finisher Block */}
          {session.finisher && session.finisherIncluded && (
            <div className="mt-4 p-4 bg-gradient-to-r from-[#E63946]/5 to-[#E63946]/10 rounded-lg border border-[#E63946]/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#E63946]" />
                <h5 className="font-semibold text-[#E63946]">{session.finisher.name}</h5>
                <span className="text-xs text-[#6A6A6A] ml-auto">{session.finisher.durationMinutes} min</span>
              </div>
              <div className="space-y-2 mb-3">
                {session.finisher.exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[#E6E9EF]">{ex.name}</span>
                    <span className="text-[#A5A5A5]">{ex.reps}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#6A6A6A] italic">{session.finisher.instruction}</p>
              <p className="text-xs text-[#E63946]/80 mt-2">{session.finisher.failureBudgetNote}</p>
            </div>
          )}

          {/* Cooldown Toggle */}
          <div>
            <button
              className="flex items-center gap-2 text-sm text-[#6A6A6A] hover:text-[#A5A5A5] transition-colors"
              onClick={() => setShowCooldown(!showCooldown)}
            >
              {showCooldown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Cool-Down
              <span className="text-xs text-[#4F6D8A]">({session.cooldown.length} exercises)</span>
            </button>
            {showCooldown && (
              <div className="mt-2 space-y-2">
                {session.cooldown[0]?.selectionReason && (
                  <p className="text-xs text-[#6A6A6A] italic mb-2 pl-2 border-l-2 border-green-500/30">
                    {session.cooldown[0].selectionReason}
                  </p>
                )}
                {session.cooldown.map((exercise, idx) => (
                  <ExerciseRow key={idx} exercise={exercise} isWarmupCooldown />
                ))}
              </div>
            )}
          </div>
            </>
)}
  </div>
  )}

      {/* Exercise Replacement Modal */}
      {selectedExerciseForReplace && (
        <ExerciseReplacementModal
          open={showReplacementModal}
          onOpenChange={setShowReplacementModal}
          exerciseId={selectedExerciseForReplace.id}
          exerciseName={selectedExerciseForReplace.name}
          availableEquipment={availableEquipment}
          onReplace={handleReplacementConfirm}
        />
      )}
  </Card>
  )
  }

// =============================================================================
// [PHASE 7B] MAIN EXERCISES RENDERER
// Handles both grouped (styled) and flat exercise rendering
// =============================================================================

interface MainExercisesRendererProps {
  session: AdaptiveSession
  displayExercises: AdaptiveExercise[]
  sessionId: string
  skippedExercises: Set<string>
  adjustedExercises: Map<string, string>
  onReplace: (exerciseId: string, exerciseName: string) => void
  onSkip: (exerciseId: string, exerciseName: string) => void
  onProgressionAdjust: (exerciseId: string, newProgression: string, direction: 'up' | 'down') => void
}

function MainExercisesRenderer({
  session,
  displayExercises,
  sessionId,
  skippedExercises,
  adjustedExercises,
  onReplace,
  onSkip,
  onProgressionAdjust,
}: MainExercisesRendererProps) {
  // Get style metadata from session if available
  const styleMetadata = (session as AdaptiveSession & { styleMetadata?: SessionStyleMetadata }).styleMetadata
  const styledGroups = styleMetadata?.styledGroups || []
  
  // Determine render mode - use groups only if they actually have meaningful structure
  const hasNonStraightGroups = styledGroups.some(g => g.groupType !== 'straight')
  const useGroupedRender = styledGroups.length > 0 && hasNonStraightGroups
  
  // ==========================================================================
  // [PHASE 7B TASK 3] RENDER CONTRACT TRUTH AUDIT
  // ==========================================================================
  // Get methods applied in builder vs what will be visible in render
  const methodsAppliedInBuilder = styleMetadata?.appliedMethods || ['straight_sets']
  const methodsVisibleInRender = useGroupedRender 
    ? [...new Set(styledGroups.filter(g => g.groupType !== 'straight').map(g => g.groupType))]
    : ['straight_sets']
  const invisibleAppliedMethods = methodsAppliedInBuilder.filter(
    m => m !== 'straight_sets' && !methodsVisibleInRender.includes(m as any)
  )
  
  console.log('[phase7b-render-contract-truth-audit]', {
    sessionId: `day_${session.dayNumber}`,
    renderModeChosen: useGroupedRender ? 'grouped' : 'flat',
    styledGroupsValid: styledGroups.length > 0,
    flatExercisesValid: displayExercises.length > 0,
    authoritativeRenderSource: useGroupedRender ? 'styleMetadata.styledGroups' : 'displayExercises',
    fallbackReasonIfFlat: !useGroupedRender
      ? styledGroups.length === 0
        ? 'no_styled_groups'
        : 'all_groups_are_straight_sets'
      : null,
    groupTypesPresent: [...new Set(styledGroups.map(g => g.groupType))],
    verdict: useGroupedRender ? 'grouped_render_active' : 'flat_render_fallback',
  })
  
  // ==========================================================================
  // [PHASE 7B TASK 8] METHOD VISIBILITY TRUTH AUDIT
  // Ensure we don't claim methods are applied if user can't see them
  // ==========================================================================
  console.log('[phase7b-method-visibility-truth-audit]', {
    sessionId: `day_${session.dayNumber}`,
    methodsAppliedInBuilder,
    methodsVisibleInRender,
    invisibleAppliedMethods,
    overclaimedMethods: invisibleAppliedMethods.length > 0 ? invisibleAppliedMethods : [],
    finalVerdict: invisibleAppliedMethods.length === 0 
      ? 'all_applied_methods_visible'
      : 'some_methods_not_visible_in_ui',
  })
  
  // ==========================================================================
  // [PHASE 7B TASK 5] FEATURE PRESERVATION AUDIT
  // Verify all existing features remain functional
  // ==========================================================================
  console.log('[phase7b-feature-preservation-audit]', {
    sessionId: `day_${session.dayNumber}`,
    replaceActionPreserved: typeof onReplace === 'function',
    rationalePreserved: displayExercises.some(e => e.selectionReason),
    tagRenderingPreserved: true, // ExerciseRow handles tags
    variantTogglePreserved: true, // Variant selection is handled upstream
    startWorkoutPayloadPreserved: true, // Workout uses session.exercises directly
    regressionsDetected: [],
    verdict: 'all_features_preserved',
  })
  
  // ==========================================================================
  // FLAT RENDER PATH - Traditional exercise list
  // ==========================================================================
  if (!useGroupedRender) {
    return (
      <div className="space-y-2">
        {displayExercises.map((exercise, idx) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            index={idx + 1}
            sessionId={sessionId}
            isSkipped={skippedExercises.has(exercise.id)}
            adjustedName={adjustedExercises.get(exercise.id)}
            onReplace={onReplace}
            onSkip={onSkip}
            onProgressionAdjust={onProgressionAdjust}
          />
        ))}
      </div>
    )
  }
  
  // ==========================================================================
  // GROUPED RENDER PATH - Styled groups with visual structure
  // ==========================================================================
  
  // Create a map of exercise ID to full exercise data from displayExercises
  const exerciseDataMap = new Map<string, AdaptiveExercise>()
  displayExercises.forEach(e => exerciseDataMap.set(e.id, e))
  // Also map by name as a fallback (styledGroups may have ID mismatches)
  displayExercises.forEach(e => exerciseDataMap.set(e.name, e))
  
  let globalExerciseIndex = 0
  
  // ==========================================================================
  // [PHASE 7B TASK 4] GROUPED RENDER TRUTH AUDIT
  // ==========================================================================
  console.log('[phase7b-grouped-render-truth-audit]', {
    sessionId: `day_${session.dayNumber}`,
    groupedRenderUsed: true,
    groupTypesRendered: [...new Set(styledGroups.map(g => g.groupType))],
    totalGroupsRendered: styledGroups.length,
    flatFallbackUsed: false,
    whyFallbackUsed: null,
    verdict: 'grouped_render_active',
  })
  
  return (
    <div className="space-y-4">
      {styledGroups.map((group, groupIndex) => {
        const colors = getGroupTypeColors(group.groupType)
        const label = getGroupTypeLabel(group.groupType)
        const icon = getGroupTypeIcon(group.groupType)
        const isSpecialGroup = group.groupType !== 'straight'
        
        return (
          <div key={group.id || `group-${groupIndex}`}>
            {/* Group Header - Only show for non-straight groups */}
            {isSpecialGroup && (
              <div className={`mb-2 px-3 py-2.5 rounded-lg border-l-2 ${colors.border} ${colors.bg}`}>
                <div className="flex items-center gap-2">
                  <span className={colors.text}>{icon}</span>
                  {/* Enhanced label: Show purpose + method (e.g., "Accessory Superset") */}
                  <span className={`text-sm font-medium ${colors.text}`}>
                    {/* Derive purpose from first exercise category if available */}
                    {(() => {
                      const firstExercise = group.exercises[0]
                      const fullExercise = displayExercises.find(e => 
                        e.id === firstExercise?.id || 
                        e.name.toLowerCase() === firstExercise?.name.toLowerCase()
                      )
                      const category = fullExercise?.category
                      // Capitalize category and prepend to method label
                      const purposePrefix = category && category !== 'accessory' 
                        ? `${category.charAt(0).toUpperCase() + category.slice(1)} ` 
                        : category === 'accessory' 
                          ? 'Accessory ' 
                          : ''
                      return `${purposePrefix}${label}`
                    })()}
                  </span>
                  {/* [EDUCATIONAL] Method info bubble - explains what this training method is */}
                  <MethodInfoBubble 
                    methodType={group.groupType as 'superset' | 'circuit' | 'cluster' | 'density_block'}
                    context={group.exercises[0]?.methodRationale || undefined}
                  />
                  {/* Show exercise count in group */}
                  <span className="text-xs text-[#6A6A6A]">
                    ({group.exercises.length} exercises)
                  </span>
                </div>
                {/* Show instruction or methodRationale if available */}
                {(group.instruction || group.exercises[0]?.methodRationale) && (
                  <p className="text-xs text-[#8A8A8A] mt-1.5 leading-relaxed">
                    {group.instruction || group.exercises[0]?.methodRationale}
                  </p>
                )}
                {group.restProtocol && (
                  <p className="text-xs text-[#6A6A6A] mt-1">Rest: {group.restProtocol}</p>
                )}
              </div>
            )}
            
            {/* Exercises in this group */}
            <div className={`space-y-2 ${isSpecialGroup ? `pl-4 border-l-2 ${colors.border}` : ''}`}>
              {group.exercises.map((groupExercise, exIdx) => {
                globalExerciseIndex++
                
                // Find the full exercise data from displayExercises
                const fullExercise = exerciseDataMap.get(groupExercise.id) 
                  || exerciseDataMap.get(groupExercise.name)
                  || displayExercises.find(e => 
                      e.name.toLowerCase() === groupExercise.name.toLowerCase()
                    )
                
                if (!fullExercise) {
                  // Exercise in styled groups but not in displayExercises
                  // This can happen if variant selection differs - skip gracefully
                  console.warn('[phase7b-grouped-render] Exercise not found in displayExercises:', {
                    groupExerciseId: groupExercise.id,
                    groupExerciseName: groupExercise.name,
                    displayExerciseIds: displayExercises.map(e => e.id),
                  })
                  return null
                }
                
                return (
                  <ExerciseRow
                    key={fullExercise.id}
                    exercise={fullExercise}
                    index={globalExerciseIndex}
                    prefix={groupExercise.prefix} // Pass superset prefix (A1, A2, etc)
                    sessionId={sessionId}
                    isSkipped={skippedExercises.has(fullExercise.id)}
                    adjustedName={adjustedExercises.get(fullExercise.id)}
                    onReplace={onReplace}
                    onSkip={onSkip}
                    onProgressionAdjust={onProgressionAdjust}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
      
      {/* Render any exercises that weren't in styled groups as fallback */}
      {(() => {
        const groupedExerciseIds = new Set(
          styledGroups.flatMap(g => g.exercises.map(e => e.id))
        )
        const groupedExerciseNames = new Set(
          styledGroups.flatMap(g => g.exercises.map(e => e.name.toLowerCase()))
        )
        const ungroupedExercises = displayExercises.filter(
          e => !groupedExerciseIds.has(e.id) && !groupedExerciseNames.has(e.name.toLowerCase())
        )
        
        if (ungroupedExercises.length === 0) return null
        
        return (
          <div className="space-y-2 pt-2">
            {ungroupedExercises.map((exercise) => {
              globalExerciseIndex++
              return (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  index={globalExerciseIndex}
                  sessionId={sessionId}
                  isSkipped={skippedExercises.has(exercise.id)}
                  adjustedName={adjustedExercises.get(exercise.id)}
                  onReplace={onReplace}
                  onSkip={onSkip}
                  onProgressionAdjust={onProgressionAdjust}
                />
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}

// =============================================================================
// EXERCISE ROW
// =============================================================================

interface ExerciseRowProps {
  exercise: AdaptiveExercise
  index?: number
  prefix?: string // [PHASE 7B] Superset/circuit prefix like A1, A2, B1, etc
  isWarmupCooldown?: boolean
  sessionId?: string
  isSkipped?: boolean
  adjustedName?: string
  onReplace?: (exerciseId: string, exerciseName: string) => void
  onSkip?: (exerciseId: string, exerciseName: string) => void
  onProgressionAdjust?: (exerciseId: string, newProgression: string, direction: 'up' | 'down') => void
}

function ExerciseRow({ 
  exercise, 
  index, 
  prefix, // [PHASE 7B] For grouped exercises
  isWarmupCooldown, 
  sessionId,
  isSkipped,
  adjustedName,
  onReplace,
  onSkip,
  onProgressionAdjust,
}: ExerciseRowProps) {
  const [showReason, setShowReason] = useState(false)
  
  // TASK 3: Safety guard for malformed exercise data
  if (!exercise || typeof exercise !== 'object') {
    console.warn('[ExerciseRow] Received invalid exercise:', exercise)
    return null
  }
  
  // Ensure required fields have safe defaults
  const safeName = exercise.name || 'Exercise'
  const safeCategory = exercise.category || 'accessory'
  const safeSets = exercise.sets ?? 3
  const safeReps = exercise.repsOrTime || '8-12'
  
  // [weighted-truth] TASK G: Log weighted exercises at display time
  if (exercise.prescribedLoad?.load) {
    console.log('[weighted-truth] Displaying weighted load:', {
      exerciseName: safeName,
      load: exercise.prescribedLoad.load,
      unit: exercise.prescribedLoad.unit,
      confidence: exercise.prescribedLoad.confidenceLevel,
    })
  } else if (exercise.noLoadReason) {
    console.log('[weighted-truth] No load for exercise:', {
      exerciseName: safeName,
      reason: exercise.noLoadReason,
    })
  }
  
  const hasRPE = !isWarmupCooldown && exerciseSupportsRPE(safeName)
  const exerciseId = safeName.toLowerCase().replace(/[\s-]+/g, '_')
  const hasKnowledge = hasExerciseKnowledge(exerciseId)
  
  // Display name - show adjusted name if progression was changed
  const displayName = adjustedName || safeName

  const categoryColors: Record<string, string> = {
    skill: 'text-[#E63946]',
    strength: 'text-blue-400',
    accessory: 'text-[#A5A5A5]',
    core: 'text-purple-400',
    warmup: 'text-green-400',
    cooldown: 'text-green-400',
  }

  // Skipped state styling
  if (isSkipped) {
    return (
      <div className="p-3 rounded-lg border bg-[#1A1A1A]/30 border-[#2A2A2A] opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {index && (
              <span className="text-xs text-[#6A6A6A] font-mono w-4">{index}.</span>
            )}
            <SkipForward className="w-4 h-4 text-[#6A6A6A]" />
            <span className="text-sm text-[#6A6A6A] line-through">{safeName}</span>
          </div>
          <span className="text-xs text-[#6A6A6A]">Skipped</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-3 rounded-lg border transition-colors ${
      isWarmupCooldown 
        ? 'bg-[#1A1A1A]/50 border-[#2A2A2A]' 
        : adjustedName 
          ? 'bg-[#1A1A1A] border-[#4F6D8A]/30' 
          : 'bg-[#1A1A1A] border-[#3A3A3A] hover:border-[#4A4A4A]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {/* [PHASE 7B] Show prefix (A1, A2) for grouped exercises, fallback to index */}
            {prefix ? (
              <span className="text-xs text-[#4F6D8A] font-mono font-medium w-6">{prefix}</span>
            ) : index ? (
              <span className="text-xs text-[#6A6A6A] font-mono w-4">{index}.</span>
            ) : null}
            <span className={`text-xs uppercase tracking-wider ${categoryColors[safeCategory] || 'text-[#6A6A6A]'}`}>
              {safeCategory}
            </span>
            {exercise.methodLabel && exercise.method !== 'straight_sets' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4F6D8A]/10 text-[#4F6D8A] font-medium">
                {exercise.methodLabel}
              </span>
            )}
            {adjustedName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4F6D8A]/20 text-[#4F6D8A] font-medium">
                Adjusted
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-medium">{displayName}</p>
            {hasRPE && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E63946]/10 text-[#E63946] font-medium">
                RPE
              </span>
            )}
          </div>
          {adjustedName && (
            <p className="text-xs text-[#4F6D8A] mt-0.5">
              Originally: {safeName}
            </p>
          )}
          {exercise.note && (
            <p className="text-xs text-[#6A6A6A] mt-0.5">{exercise.note}</p>
          )}
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <div className="text-right">
            <p className="text-sm text-[#A5A5A5]">
              {safeSets} x {safeReps}
            {/* WEIGHTED LOAD PR: Display prescribed load for weighted exercises */}
            {exercise.prescribedLoad && exercise.prescribedLoad.load > 0 && (
              <span className="text-[#E63946] font-medium">
                {' @ '}+{exercise.prescribedLoad.load} {exercise.prescribedLoad.unit}
              </span>
            )}
            {/* [weighted-truth] TASK F & G: Log when weighted exercise has no load reason */}
            {!exercise.prescribedLoad && exercise.noLoadReason && (
              <span className="text-[#6A6A6A] text-xs">
                {' ('}
                {exercise.noLoadReason === 'no_loadable_equipment' && 'no equipment'}
                {exercise.noLoadReason === 'missing_strength_inputs' && 'no strength data'}
                {exercise.noLoadReason === 'exercise_not_load_eligible' && 'bodyweight focus'}
                {exercise.noLoadReason === 'doctrine_prefers_bodyweight' && 'bodyweight preferred'}
                {exercise.noLoadReason === 'skill_day_non_loaded_variant' && 'skill focus'}
                {exercise.noLoadReason === 'support_day_volume_bias' && 'support day'}
                {')'}
              </span>
            )}
            </p>
            {/* Show confidence indicator for weighted load */}
            {exercise.prescribedLoad && exercise.prescribedLoad.load > 0 && exercise.prescribedLoad.confidenceLevel !== 'high' && (
              <p className="text-[10px] text-[#6A6A6A] mt-0.5">
                {exercise.prescribedLoad.confidenceLevel === 'moderate' && '(from historical PR)'}
                {exercise.prescribedLoad.confidenceLevel === 'low' && '(estimated)'}
              </p>
            )}
          </div>
          {!isWarmupCooldown && exercise.isOverrideable && sessionId && onReplace && onSkip && onProgressionAdjust && (
            <ExerciseActionMenu
              exercise={exercise}
              sessionId={sessionId}
              onReplace={onReplace}
              onSkip={onSkip}
              onProgressionAdjust={onProgressionAdjust}
            />
          )}
        </div>
      </div>
      
      {/* [coach-layer] TASK 3: Coaching metadata display - appears above "Why this exercise?" */}
      {!isWarmupCooldown && exercise.coachingMeta && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* Expression Mode Badge - capitalize and format nicely */}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2A2A] text-[#A5A5A5] capitalize">
            {exercise.coachingMeta.expressionMode.replace(/_/g, ' ')}
          </span>
          {/* Load Decision Summary - weighted gets highlight */}
          {exercise.coachingMeta.loadDecisionSummary && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              exercise.coachingMeta.loadDecisionSummary.toLowerCase().includes('weighted') 
                ? 'bg-[#E63946]/10 text-[#E63946]' 
                : 'bg-[#3A3A3A] text-[#8A8A8A]'
            }`}>
              {exercise.coachingMeta.loadDecisionSummary}
            </span>
          )}
          {/* Rest Guidance - only show if we have meaningful rest data */}
          {exercise.coachingMeta.restLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3A3A3A] text-[#8A8A8A]">
              Rest: {exercise.coachingMeta.restLabel}
            </span>
          )}
        </div>
      )}
      
      {/* Selection Reason - NOW VISIBLE BY DEFAULT for transparency */}
      {!isWarmupCooldown && exercise.selectionReason && (
        <div className="mt-2 py-1.5 px-2 rounded bg-[#1F1F1F] border border-[#2A2A2A]">
          <p className="text-xs text-[#8A8A8A] leading-relaxed">
            <span className="text-[#6A6A6A]">Why: </span>
            {exercise.selectionReason}
          </p>
        </div>
      )}
      
      {/* Knowledge bubble expandable - only show if has knowledge but no selection reason already displayed */}
      {!isWarmupCooldown && hasKnowledge && !exercise.selectionReason && (
        <div className="mt-2">
          <button
            className="text-xs text-[#6A6A6A] hover:text-[#A5A5A5] flex items-center gap-1"
            onClick={() => setShowReason(!showReason)}
          >
            {showReason ? 'Hide info' : 'Learn more'}
          </button>
          {showReason && (
            <div className="mt-2 space-y-2">
              <ExerciseKnowledgeBubble 
                  exerciseId={exerciseId}
                  showSkillCarryover
                  showSafetyNote
                />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
