'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdaptiveSession, AdaptiveExercise, TrainingMethodPreference } from '@/lib/adaptive-program-builder'
import { ChevronDown, ChevronUp, Clock, AlertCircle, Zap, RefreshCw, Play, CheckCircle2, SkipForward, Repeat, Layers, Timer, Dumbbell } from 'lucide-react'
import { WorkoutExecutionCard, StartWorkoutButton } from './WorkoutExecutionCard'
import { exerciseSupportsRPE } from '@/lib/rpe-adjustment-engine'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import {
  SessionHeader,
  PausedOverlay,
  FinishConfirmation,
} from '@/components/workout/WorkoutSessionControls'
import { WorkoutSessionSummary } from '@/components/workout/WorkoutSessionSummary'
import { trackWorkoutStarted, trackWorkoutCompleted } from '@/lib/analytics'
import { ExerciseReplacementModal } from './ExerciseReplacementModal'
import { ExerciseActionMenu } from './ExerciseActionMenu'
import { InfoBubble, ExerciseKnowledgeBubble, StructureKnowledgeBubble, ProtocolKnowledgeBubble, MethodInfoBubble } from '@/components/coaching'
import { buildExerciseCardContract, buildExerciseRowSurface, type ExerciseRowSurface } from '@/lib/program/program-display-contract'
import type { ProgramExplanationSurface } from '@/lib/coaching-explanation-contract'
// [SINGLE-TRUTH-FIX] Removed: getCompactExerciseExplanation - was source of contradictory text
import { buildSessionAiEvidenceSurface, deduplicateSessionEvidence, alignRowWithSessionEvidence, getCategoryDisplayContract, buildFullSessionRoutineSurface, buildSessionMainPreviewSurface, buildFullVisibleRoutineExercises, type SessionAiEvidenceSurface, type FullSessionRoutineSurface, type SessionMainPreviewSurface, type FullRoutineExercise } from '@/lib/program/program-ai-evidence-bridge'
// [SINGLE-TRUTH-FIX] Removed: getExerciseRowVisibility, shouldShowRowIntelligence, deduplicateRowDisplay, DEFAULT_DENSITY_MODE
// These were used by the ROW 2.5 chip block which was a stale secondary text path
import { hasExerciseKnowledge, getStructureKnowledge } from '@/lib/knowledge-bubble-content'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import { 
  addOverride, 
  applyOverridesToSession,
  type ExerciseOverride 
} from '@/lib/exercise-override-service'
import { recordReplaceSignal } from '@/lib/override-signal-service'
import type { EquipmentType } from '@/lib/adaptive-exercise-pool'

// [DOCTRINE-STRENGTHENING] Week character flags for visible differentiation
interface WeekCharacter {
  densityAllowed: boolean
  finishersAllowed: boolean
  skillExposureLevel: 'conservative' | 'moderate' | 'full'
  sessionIntensityCap: number
  phaseLabel: 'acclimation' | 'ramp_up' | 'peak' | 'consolidation'
}

interface AdaptiveSessionCardProps {
  session: AdaptiveSession
  onExerciseReplace?: (exerciseId: string) => void
  onWorkoutComplete?: () => void
  onExerciseOverride?: (override: ExerciseOverride) => void
  // [TASK 4] Program ID for variant state reset when program changes
  programId?: string
  // [EXERCISE-ROW-SURFACE] Primary goal for session-aware purpose lines
  primaryGoal?: string
  // [AI-EVIDENCE-BRIDGE] Secondary goal for row alignment
  secondaryGoal?: string | null
  // [AI-EVIDENCE-BRIDGE] Pre-built session evidence for unified display
  sessionEvidence?: SessionAiEvidenceSurface
  // [UI-CLEANUP-FIX] Control initial expanded state - defaults to false for cleaner list view
  // Today's workout should pass true, all others should pass false or omit
  defaultExpanded?: boolean
  // [COACHING-EXPLANATION-CONTRACT] Authoritative coaching explanation surface
  coachingExplanation?: ProgramExplanationSurface | null
  // [DOCTRINE-STRENGTHENING] Week-specific training character for visible differentiation
  weekCharacter?: WeekCharacter
  // [PREVIEW-VISIBLE-PROBE] Enable visible truth probe via ?programProbe=1 query param
  // This bypasses NODE_ENV checks to show diagnostics in Preview/production
  showProbe?: boolean
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

export function AdaptiveSessionCard({ session: rawSession, onExerciseReplace, onWorkoutComplete, onExerciseOverride, programId, primaryGoal, secondaryGoal, sessionEvidence: providedEvidence, defaultExpanded = false, coachingExplanation, weekCharacter, showProbe = false }: AdaptiveSessionCardProps) {
  // PHASE 3: Normalize session immediately to prevent crashes
  const session = normalizeSessionForDisplay(rawSession)
  
  // ==========================================================================
  // [PHASE 7B TASK 1] STYLE OUTPUT CONTRACT AUDIT
  // Verify what style truth exists in the session from builder
  // ==========================================================================
  const sessionStyleMetadata = (rawSession as AdaptiveSession & { styleMetadata?: SessionStyleMetadata }).styleMetadata
  const builderHasStyledGroups = !!(sessionStyleMetadata?.styledGroups && sessionStyleMetadata.styledGroups.length > 0)
  const hasNonStraightGroups = sessionStyleMetadata?.styledGroups?.some(g => g.groupType !== 'straight') ?? false
  
  // ==========================================================================
  // [AI-EVIDENCE-BRIDGE] Build unified session evidence surface
  // Single source of truth for session-level AI reasoning display
  // ==========================================================================
  const sessionEvidence: SessionAiEvidenceSurface = providedEvidence || (() => {
    const rawEvidence = buildSessionAiEvidenceSurface(
      {
        dayNumber: session.dayNumber,
        name: session.name,
        dayLabel: session.dayLabel,
        focus: session.focus,
        focusLabel: session.focusLabel,
        isPrimary: session.isPrimary,
        rationale: session.rationale,
        prescriptionPropagationAudit: (rawSession as any).prescriptionPropagationAudit,
        compositionMetadata: (rawSession as any).compositionMetadata,
        skillExpressionMetadata: (rawSession as any).skillExpressionMetadata,
        styleMetadata: sessionStyleMetadata,
      },
      {
        primaryGoal: primaryGoal || 'training',
        secondaryGoal: secondaryGoal,
        isFirstWeek: false,
      }
    )
    return deduplicateSessionEvidence(rawEvidence)
  })()
  

  
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
  
  const handleStartWorkout = () => {
    // [workout-route] UNIFIED ENTRY: Route to canonical workout session page
    // This ensures all "Start Workout" paths use the same StreamlinedWorkoutSession experience
    // The embedded WorkoutExecutionCard is no longer used for full workout execution
    
    // ==========================================================================
    // [LIVE-WORKOUT-AUTHORITY] Determine execution mode from selected variant
    // ==========================================================================
    const variant = selectedVariant !== null ? session.variants?.[selectedVariant] : session.variants?.[0]
    const variantDuration = variant?.duration || session.estimatedMinutes
    
    // Map variant duration to execution mode
    let executionMode: '30_min' | '45_min' | 'full' = 'full'
    if (variantDuration && variantDuration <= 35) {
      executionMode = '30_min'
    } else if (variantDuration && variantDuration <= 50) {
      executionMode = '45_min'
    }
    
    trackWorkoutStarted(session.name)
    // [LIVE-WORKOUT-AUTHORITY] Pass execution mode and variant index to workout route
    router.push(`/workout/session?day=${session.dayNumber || 1}&mode=${executionMode}&variant=${selectedVariant ?? 0}`)
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
  // [FULL-SESSION-ROUTINE-SURFACE] Build COMPLETE day routine from ALL families
  // This is the PRIMARY authoritative output for prescription-first display
  // Replaces narrowed displayExercises with full session truth
  // ==========================================================================
  const selectedVariantData = selectedVariant !== null && session.variants?.[selectedVariant]
    ? session.variants[selectedVariant]
    : null
    
  const fullRoutineSurface: FullSessionRoutineSurface = buildFullSessionRoutineSurface(
    {
      dayNumber: session.dayNumber,
      dayLabel: session.dayLabel,
      name: session.name,
      focus: session.focus,
      focusLabel: session.focusLabel,
      isPrimary: session.isPrimary,
      estimatedMinutes: session.estimatedMinutes,
      exercises: safeExercises, // Use FULL exercises, not narrowed displayExercises
      warmup: session.warmup,
      cooldown: session.cooldown,
      finisher: session.finisher,
      finisherIncluded: session.finisherIncluded,
    },
    selectedVariantData, // Pass variant for variant-aware routine building
    sessionEvidence
  )
  
  // ==========================================================================
  // [SESSION-MAIN-PREVIEW] Build display-priority preview (secondary context)
  // This provides warmup/cooldown counts and finisher presence for footer
  // ==========================================================================
  const mainPreview: SessionMainPreviewSurface = buildSessionMainPreviewSurface(fullRoutineSurface)
  
  // ==========================================================================
  // [FULL-VISIBLE-ROUTINE-EXERCISES] Build card body exercises from FULL routine
  // This replaces narrowed displayExercises as the live card body owner
  // Includes ALL non-warmup/non-cooldown exercises (main + secondary + accessory + core + mobility + finisher)
  // ==========================================================================
  const fullVisibleExercises: FullRoutineExercise[] = buildFullVisibleRoutineExercises(
    fullRoutineSurface,
    safeExercises,
    selectedVariantData?.selection || null
  )
  
  // ==========================================================================
  // [v0] AUTHORITATIVE ROUTINE OWNERSHIP AUDIT
  // Verify full routine truth is flowing through correctly
  // ==========================================================================
  if (process.env.NODE_ENV === 'development') {
    const familyBreakdown = fullVisibleExercises.reduce((acc, ex) => {
      acc[ex.routineFamily] = (acc[ex.routineFamily] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
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
    
  }
  
  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden">
      {/* Header - Collapsible day summary */}
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
            {/* Compact meta line - time + exercise count only */}
            <div className="flex items-center gap-3 mt-1 text-xs text-[#6A6A6A]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activeSessionView.estimatedMinutes} min
              </span>
              <span>{fullVisibleExercises.length} exercises</span>
              {activeSessionView.isVariantSelected && (
                <span className="text-[#E63946]/70">({activeSessionView.variantLabel})</span>
              )}
            </div>
            
            {/* [DOCTRINE-STRENGTHENING] Week-specific character badges */}
            {weekCharacter && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {/* Intensity cap badge */}
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  weekCharacter.sessionIntensityCap <= 7
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : weekCharacter.sessionIntensityCap >= 9
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  RPE ≤{weekCharacter.sessionIntensityCap}
                </span>
                
                {/* Skill exposure badge */}
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  weekCharacter.skillExposureLevel === 'conservative'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : weekCharacter.skillExposureLevel === 'full'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {weekCharacter.skillExposureLevel === 'conservative' && 'Conservative'}
                  {weekCharacter.skillExposureLevel === 'moderate' && 'Building'}
                  {weekCharacter.skillExposureLevel === 'full' && 'Full Exposure'}
                </span>
                
                {/* Density badge - only show if blocked or explicitly allowed */}
                {!weekCharacter.densityAllowed && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    No Density
                  </span>
                )}
                
                {/* Finishers badge - only show if blocked */}
                {!weekCharacter.finishersAllowed && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    No Finishers
                  </span>
                )}
                
                {/* Peak week indicator */}
                {weekCharacter.phaseLabel === 'peak' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    <Zap className="w-2.5 h-2.5" />
                    Peak Week
                  </span>
                )}
              </div>
            )}
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
            /* [workout-route] UNIFIED: Active workouts now route to /workout/session */
            <WorkoutExecutionCard
              session={session}
              onComplete={handleWorkoutComplete}
              onCancel={handleWorkoutCancel}
              sessionState={workoutSession}
            />
          ) : (
            <>
              {/* =================================================================
                  [SESSION-PRESCRIPTION-SURFACE] PRESCRIPTION-FIRST COMPACT VIEW
                  Primary display: actual routine. Secondary: AI explanation.
                  ================================================================= */}
              {/* Start Button - Primary Action (above detailed workout) */}
              <div className="mb-4">
                <Button
                  onClick={handleStartWorkout}
                  className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2 h-10"
                >
                  <Play className="w-4 h-4" />
                  Start Workout
                </Button>
              </div>

          {/* ==========================================================================
              [PREVIEW-VISIBLE-PROBE] SESSION TRUTH CHIP BLOCK
              Enable via ?programProbe=1 query param - bypasses NODE_ENV for Preview visibility
              ========================================================================== */}
          {showProbe && (
            <div className="mb-4 p-3 bg-red-900/40 border-2 border-red-500 rounded font-mono text-[10px] space-y-1.5">
              <div className="text-red-400 font-bold text-xs border-b border-red-500/30 pb-1 mb-2">
                SESSION TRUTH PROBE (dev only)
              </div>
              
              {/* Session Identity */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-red-300/80">
                <div>dayLabel:</div>
                <div className="text-white">{session.dayLabel}</div>
                
                <div>dayNumber:</div>
                <div className="text-white">{session.dayNumber}</div>
                
                <div>resolvedIdentity:</div>
                <div className="text-white truncate">{(session as any).resolvedSessionIdentity || 'none'}</div>
                
                <div>session.id:</div>
                <div className="text-white truncate">{(session as any).id || 'none'}</div>
              </div>
              
              {/* Variant State */}
              <div className="mt-2 pt-2 border-t border-red-500/30">
                <div className="text-amber-400 font-semibold mb-1">Variant State</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-amber-300/80">
                  <div>selectedVariant:</div>
                  <div className="text-white">{selectedVariant === null ? 'null (Full)' : selectedVariant}</div>
                  
                  <div>variantLabel:</div>
                  <div className="text-white">{activeSessionView.variantLabel || 'Full Session'}</div>
                  
                  <div>duration:</div>
                  <div className="text-white">{activeSessionView.estimatedMinutes} min</div>
                  
                  <div>isVariantSelected:</div>
                  <div className="text-white">{activeSessionView.isVariantSelected ? 'YES' : 'NO'}</div>
                  
                  <div>exerciseSource:</div>
                  <div className="text-white">{activeSessionView.isVariantSelected ? 'variant' : 'base session'}</div>
                </div>
              </div>
              
              {/* Style Metadata Truth */}
              <div className="mt-2 pt-2 border-t border-red-500/30">
                <div className="text-cyan-400 font-semibold mb-1">styleMetadata Truth</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-cyan-300/80">
                  <div>hasStyleMetadata:</div>
                  <div className={sessionStyleMetadata ? 'text-green-400' : 'text-red-400'}>{sessionStyleMetadata ? 'YES' : 'NO'}</div>
                  
                  <div>styledGroups count:</div>
                  <div className="text-white">{sessionStyleMetadata?.styledGroups?.length || 0}</div>
                  
                  <div>non-straight groups:</div>
                  <div className={hasNonStraightGroups ? 'text-green-400 font-bold' : 'text-red-400'}>
                    {sessionStyleMetadata?.styledGroups?.filter(g => g.groupType !== 'straight').length || 0}
                  </div>
                  
                  <div>groupTypes:</div>
                  <div className="text-white">
                    {sessionStyleMetadata?.styledGroups?.map(g => g.groupType).join(', ') || 'none'}
                  </div>
                  
                  <div>primaryStyle:</div>
                  <div className="text-white">{sessionStyleMetadata?.primaryStyle || 'none'}</div>
                  
                  <div>appliedMethods:</div>
                  <div className="text-white">{sessionStyleMetadata?.appliedMethods?.join(', ') || 'none'}</div>
                </div>
              </div>
              
              {/* Display Exercises Truth */}
              <div className="mt-2 pt-2 border-t border-red-500/30">
                <div className="text-purple-400 font-semibold mb-1">Display Exercises</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-purple-300/80">
                  <div>fullVisibleExercises:</div>
                  <div className="text-white">{fullVisibleExercises.length}</div>
                  
                  <div>first 5 names:</div>
                  <div className="text-white text-[9px]">{fullVisibleExercises.slice(0, 5).map(e => e.name).join(', ')}</div>
                </div>
              </div>
              
              {/* Grouped Exercise Names from Truth */}
              <div className="mt-2 pt-2 border-t border-red-500/30">
                <div className="text-green-400 font-semibold mb-1">Grouped Exercise Names (from styledGroups)</div>
                <div className="text-green-300/80 text-[9px]">
                  {sessionStyleMetadata?.styledGroups
                    ?.filter(g => g.groupType !== 'straight')
                    .flatMap(g => g.exercises?.map(e => e.name) || [])
                    .join(', ') || 'none (all straight)'}
                </div>
              </div>
              
              {/* Render Decision */}
              <div className="mt-2 pt-2 border-t border-red-500/30">
                <div className="text-yellow-400 font-semibold mb-1">Render Decision</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-yellow-300/80">
                  <div>builderHasStyledGroups:</div>
                  <div className={builderHasStyledGroups ? 'text-green-400' : 'text-red-400'}>{builderHasStyledGroups ? 'YES' : 'NO'}</div>
                  
                  <div>hasNonStraightGroups:</div>
                  <div className={hasNonStraightGroups ? 'text-green-400' : 'text-red-400'}>{hasNonStraightGroups ? 'YES' : 'NO'}</div>
                  
                  <div>useGroupedRender:</div>
                  <div className={hasNonStraightGroups ? 'text-green-400 font-bold' : 'text-amber-400'}>
                    {hasNonStraightGroups ? 'GROUPED' : 'FLAT'}
                  </div>
                </div>
              </div>
              
              {/* Final Verdict */}
              <div className="mt-2 pt-2 border-t border-red-500/30">
                <div className={`text-sm font-bold ${
                  hasNonStraightGroups 
                    ? 'text-green-400' 
                    : 'text-blue-400'
                }`}>
                  {hasNonStraightGroups 
                    ? 'GROUPED_TRUTH_EXISTS - UI SHOULD SHOW GROUPED BLOCKS'
                    : 'DOCTRINE_CHOSE_FLAT - No non-straight groups in session truth'
                  }
                </div>
              </div>
            </div>
          )}

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
        {/* [TRUTH-ENFORCEMENT] selectionReason is authoritative builder output - safe direct access */}
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

{/* Main Exercises - [FULL-VISIBLE-ROUTINE] Uses full routine truth, not narrowed displayExercises */}
<MainExercisesRenderer
  session={session}
  displayExercises={fullVisibleExercises}
  sessionId={sessionId}
  skippedExercises={skippedExercises}
  adjustedExercises={adjustedExercises}
  primaryGoal={primaryGoal}
  sessionEvidence={sessionEvidence}
  coachingExplanation={coachingExplanation}
  onReplace={handleExerciseReplace}
  onSkip={handleExerciseSkip}
  onProgressionAdjust={handleProgressionAdjust}
  showProbe={showProbe}
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
                    <div className="flex items-center gap-2">
                      <span className="text-[#E6E9EF]">{ex.name}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded bg-[#E63946]/10 text-[#E63946]/60">Finisher</span>
                    </div>
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
                {/* [TRUTH-ENFORCEMENT] selectionReason is authoritative builder output - safe direct access */}
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
  // [FULL-VISIBLE-ROUTINE] Now accepts full routine exercises (all non-warmup/cooldown)
  displayExercises: (AdaptiveExercise | FullRoutineExercise)[]
  sessionId: string
  skippedExercises: Set<string>
  adjustedExercises: Map<string, string>
  // [EXERCISE-ROW-SURFACE] Primary goal for session-aware purpose lines
  primaryGoal?: string
  // [AI-EVIDENCE-BRIDGE] Session evidence for row alignment
  sessionEvidence?: SessionAiEvidenceSurface
  // [COACHING-EXPLANATION-CONTRACT] Authoritative coaching explanation surface
  coachingExplanation?: ProgramExplanationSurface | null
  onReplace: (exerciseId: string, exerciseName: string) => void
  onSkip: (exerciseId: string, exerciseName: string) => void
  onProgressionAdjust: (exerciseId: string, newProgression: string, direction: 'up' | 'down') => void
  // [PREVIEW-VISIBLE-PROBE] Enable visible probe via query param
  showProbe?: boolean
}

function MainExercisesRenderer({
  session,
  displayExercises,
  sessionId,
  skippedExercises,
  adjustedExercises,
  primaryGoal,
  sessionEvidence,
  coachingExplanation,
  onReplace,
  onSkip,
  onProgressionAdjust,
  showProbe = false,
}: MainExercisesRendererProps) {
  // Get style metadata from session if available
  const styleMetadata = (session as AdaptiveSession & { styleMetadata?: SessionStyleMetadata }).styleMetadata
  const styledGroups = styleMetadata?.styledGroups || []
  
  // [EXERCISE-ROW-SURFACE] Build session context for exercise row surfaces
  // [EXPLAIN-OWNER-LOCK] Ensure primaryGoal (program's skill) is passed to explanation engine
  const compositionMeta = (session as unknown as { compositionMetadata?: { spineSessionType?: string; sessionIntent?: string } }).compositionMetadata
  const sessionContextForRows = {
    sessionFocus: session.focusLabel || session.focus || '',
    isPrimarySession: session.isPrimary || false,
    // [EXPLAIN-OWNER-LOCK] Use passed primaryGoal (program's skill) - this is the AUTHORITATIVE goal
    primaryGoal: primaryGoal || (session as unknown as { primaryGoal?: string }).primaryGoal || undefined,
    prescriptionPropagationAudit: (session as unknown as { prescriptionPropagationAudit?: { appliedReductions?: { setsReduced?: boolean; rpeReduced?: boolean } } }).prescriptionPropagationAudit,
    styleMetadata: styleMetadata ? {
      primaryStyle: styleMetadata.primaryStyle,
      hasSupersetsApplied: styleMetadata.hasSupersetsApplied,
      hasDensityApplied: styleMetadata.hasDensityApplied,
    } : undefined,
    // [EXPLAIN-OWNER-LOCK] Pass compositionMetadata for full explanation context
    compositionMetadata: compositionMeta,
    compositionMetadata: compositionMeta ? {
      spineSessionType: compositionMeta.spineSessionType,
      sessionIntent: compositionMeta.sessionIntent,
    } : undefined,
  }
  
  // Determine render mode - use groups only if they actually have meaningful structure
  const hasNonStraightGroups = styledGroups.some(g => g.groupType !== 'straight')
  const useGroupedRender = styledGroups.length > 0 && hasNonStraightGroups
  
  // ==========================================================================
  // [DEV-TRUTH-PROBE] Compute explicit flat reason code
  // ==========================================================================
  type FlatReasonCode = 
    | 'NO_STYLE_METADATA'
    | 'NO_STYLED_GROUPS'
    | 'ONLY_STRAIGHT_GROUPS'
    | 'GROUPED_MATCHING_WOULD_FAIL'
    | 'GROUPED_BRANCH_ACTIVE'
  
  const computeFlatReason = (): FlatReasonCode => {
    if (!styleMetadata) return 'NO_STYLE_METADATA'
    if (!styledGroups || styledGroups.length === 0) return 'NO_STYLED_GROUPS'
    if (!hasNonStraightGroups) return 'ONLY_STRAIGHT_GROUPS'
    if (useGroupedRender) return 'GROUPED_BRANCH_ACTIVE'
    return 'GROUPED_MATCHING_WOULD_FAIL'
  }
  const flatReasonCode = computeFlatReason()
  
  // [DEV-TRUTH-PROBE] Compute grouped-vs-visible overlap
  const nonStraightGroups = styledGroups.filter(g => g.groupType !== 'straight')
  const groupedExerciseNamesFromTruth = nonStraightGroups.flatMap(g => g.exercises?.map(e => e.name) || [])
  const displayExerciseNames = displayExercises.map(e => e.name)
  const matchedGroupedNames = groupedExerciseNamesFromTruth.filter(name => 
    displayExerciseNames.some(dn => dn.toLowerCase() === name.toLowerCase())
  )
  const missingGroupedNames = groupedExerciseNamesFromTruth.filter(name => 
    !displayExerciseNames.some(dn => dn.toLowerCase() === name.toLowerCase())
  )
  const overlapScore = groupedExerciseNamesFromTruth.length > 0 
    ? Math.round((matchedGroupedNames.length / groupedExerciseNamesFromTruth.length) * 100)
    : 0
  
  // [DEV-TRUTH-PROBE] Doctrine verdict
  const doctrineVerdict = nonStraightGroups.length > 0 && !useGroupedRender
    ? 'GROUPED_TRUTH_EXISTS_BUT_UI_NOT_SHOWING_IT'
    : nonStraightGroups.length === 0
      ? 'DOCTRINE_APPEARS_TO_HAVE_CHOSEN_FLAT'
      : 'GROUPED_RENDER_ACTIVE'
  
  // ==========================================================================
  // [PREVIEW-VISIBLE-PROBE] RENDER BRANCH BANNER
  // Visible when showProbe is true (via ?programProbe=1 query param)
  // ==========================================================================
  const DevRenderBranchBanner = () => {
    if (!showProbe) return null
    
    if (useGroupedRender) {
      const firstNonStraightGroup = nonStraightGroups[0]
      return (
        <div className="mb-3 p-2 bg-green-900/50 border-2 border-green-500 rounded font-mono text-[10px]">
          <div className="text-green-400 font-bold text-xs mb-1">GROUPED RENDER ACTIVE</div>
          <div className="text-green-300/80 space-y-0.5">
            <div>Session: Day {session.dayNumber} - {session.focus || session.focusLabel}</div>
            <div>Grouped blocks: {nonStraightGroups.length}</div>
            <div>First group type: {firstNonStraightGroup?.groupType}</div>
            <div>First grouped exercises: {firstNonStraightGroup?.exercises?.map(e => e.name).join(', ')}</div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="mb-3 p-2 bg-amber-900/50 border-2 border-amber-500 rounded font-mono text-[10px]">
        <div className="text-amber-400 font-bold text-xs mb-1">FLAT RENDER ACTIVE</div>
        <div className="text-amber-300/80 space-y-0.5">
          <div>Flat reason: <span className="text-red-400 font-bold">{flatReasonCode}</span></div>
          <div>styleMetadata exists: {styleMetadata ? 'YES' : 'NO'}</div>
          <div>styledGroups count: {styledGroups.length}</div>
          <div>Non-straight groups: {nonStraightGroups.length}</div>
          <div>Overlap score: {overlapScore}% ({matchedGroupedNames.length}/{groupedExerciseNamesFromTruth.length})</div>
          {missingGroupedNames.length > 0 && (
            <div className="text-red-400">Missing from display: {missingGroupedNames.join(', ')}</div>
          )}
          <div className="mt-1 pt-1 border-t border-amber-500/30">
            <span className={doctrineVerdict === 'DOCTRINE_APPEARS_TO_HAVE_CHOSEN_FLAT' ? 'text-blue-400' : 'text-red-400'}>
              Verdict: {doctrineVerdict}
            </span>
          </div>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // FLAT RENDER PATH - [VISIBLE-IMPROVEMENT] Now groups by category for clarity
  // ==========================================================================
  if (!useGroupedRender) {
    // Group exercises by category for visual organization
    const skillExercises = displayExercises.filter(e => e.category === 'skill')
    const strengthExercises = displayExercises.filter(e => e.category === 'strength')
    const accessoryExercises = displayExercises.filter(e => e.category === 'accessory')
    const otherExercises = displayExercises.filter(e => !['skill', 'strength', 'accessory'].includes(e.category || ''))
    
    let globalIdx = 0
    
    // [TRUTH-ENFORCEMENT] Use centralized category contract instead of hardcoded values
    const renderCategorySection = (
      exercises: typeof displayExercises, 
      category: string
    ) => {
      if (exercises.length === 0) return null
      // Get centralized contract - components are renderers, not reasoners
      const contract = getCategoryDisplayContract(category, sessionEvidence)
      return (
        <div className="space-y-2">
          {/* Category header from centralized contract */}
          <div className="flex items-center gap-2 pt-1">
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${contract.color}`}>
              {contract.label}
            </span>
            {contract.description && (
              <span className="text-[10px] text-[#6A6A6A]">
                {contract.description}
              </span>
            )}
            <div className="flex-1 h-px bg-[#2A2A2A]" />
          </div>
          {exercises.map((exercise) => {
            globalIdx++
            return (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                index={globalIdx}
                sessionId={sessionId}
                isSkipped={skippedExercises.has(exercise.id)}
                adjustedName={adjustedExercises.get(exercise.id)}
                sessionContext={sessionContextForRows}
                sessionEvidence={sessionEvidence}
                coachingExplanation={coachingExplanation}
                onReplace={onReplace}
                onSkip={onSkip}
                onProgressionAdjust={onProgressionAdjust}
              />
            )
          })}
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        <DevRenderBranchBanner />
        {renderCategorySection(skillExercises, 'skill')}
        {renderCategorySection(strengthExercises, 'strength')}
        {renderCategorySection(accessoryExercises, 'accessory')}
        {renderCategorySection(otherExercises, 'other')}
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
  
  // ==========================================================================
  // [FIX] CANONICAL DISPLAY BLOCKS - Preserve TRUE session order
  // Instead of rendering all groups first then ungrouped, we interleave based on 
  // the actual position of exercises in displayExercises (canonical order)
  // ==========================================================================
  type DisplayBlock = 
    | { type: 'group'; group: typeof styledGroups[0]; groupIndex: number }
    | { type: 'exercise'; exercise: typeof displayExercises[0] }
  
  const displayBlocks: DisplayBlock[] = []
  const processedGroupIndices = new Set<number>()
  const processedExerciseIds = new Set<string>()
  
  // Build maps for quick lookup
  const groupedExerciseIds = new Set(styledGroups.flatMap(g => g.exercises.map(e => e.id)))
  const groupedExerciseNames = new Set(styledGroups.flatMap(g => g.exercises.map(e => e.name.toLowerCase())))
  
  // Map each exercise to its group
  const exerciseToGroupIndex = new Map<string, number>()
  styledGroups.forEach((group, idx) => {
    group.exercises.forEach(e => {
      exerciseToGroupIndex.set(e.id, idx)
      exerciseToGroupIndex.set(e.name.toLowerCase(), idx)
    })
  })
  
  // Walk through displayExercises in canonical order
  displayExercises.forEach(exercise => {
    const isGrouped = groupedExerciseIds.has(exercise.id) || groupedExerciseNames.has(exercise.name.toLowerCase())
    
    if (isGrouped) {
      // Find the group index
      const gIdx = exerciseToGroupIndex.get(exercise.id) ?? exerciseToGroupIndex.get(exercise.name.toLowerCase())
      if (gIdx !== undefined && !processedGroupIndices.has(gIdx)) {
        // First encounter of this group - add the entire group block here
        displayBlocks.push({ type: 'group', group: styledGroups[gIdx], groupIndex: gIdx })
        processedGroupIndices.add(gIdx)
        // Mark all exercises in this group as processed
        styledGroups[gIdx].exercises.forEach(e => {
          processedExerciseIds.add(e.id)
          processedExerciseIds.add(e.name.toLowerCase())
        })
      }
    } else {
      // Ungrouped exercise - render at canonical position
      if (!processedExerciseIds.has(exercise.id)) {
        displayBlocks.push({ type: 'exercise', exercise })
        processedExerciseIds.add(exercise.id)
      }
    }
  })
  
  let globalExerciseIndex = 0
  
  return (
    <div className="space-y-4">
      <DevRenderBranchBanner />
      {displayBlocks.map((block, blockIdx) => {
        // Handle ungrouped exercise
        if (block.type === 'exercise') {
          globalExerciseIndex++
          return (
            <ExerciseRow
              key={block.exercise.id}
              exercise={block.exercise}
              index={globalExerciseIndex}
              sessionId={sessionId}
              isSkipped={skippedExercises.has(block.exercise.id)}
              adjustedName={adjustedExercises.get(block.exercise.id)}
              sessionContext={sessionContextForRows}
              sessionEvidence={sessionEvidence}
              coachingExplanation={coachingExplanation}
              onReplace={onReplace}
              onSkip={onSkip}
              onProgressionAdjust={onProgressionAdjust}
            />
          )
        }
        
        // Handle grouped block
        const { group, groupIndex } = block
        const colors = getGroupTypeColors(group.groupType)
        const label = getGroupTypeLabel(group.groupType)
        const icon = getGroupTypeIcon(group.groupType)
        const isSpecialGroup = group.groupType !== 'straight'
        
        return (
          <div key={group.id || `group-${groupIndex}`}>
            {/* [VISIBLE-IMPROVEMENT] Group Header - Enhanced with educational context */}
            {isSpecialGroup && (
              <div className={`mb-3 px-3 py-3 rounded-lg border-l-4 ${colors.border} ${colors.bg}`}>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`${colors.text} text-lg`}>{icon}</span>
                  {/* Enhanced label: Show purpose + method (e.g., "Accessory Superset") */}
                  <span className={`text-sm font-semibold ${colors.text}`}>
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
                  <span className="text-xs text-[#6A6A6A] bg-[#2A2A2A] px-1.5 py-0.5 rounded">
                    {group.exercises.length} exercises
                  </span>
                </div>
                {/* Show instruction or methodRationale if available, otherwise show default educational text */}
                <p className="text-xs text-[#8A8A8A] mt-2 leading-relaxed">
                  {group.instruction || group.exercises[0]?.methodRationale || (() => {
                    // Provide default educational text based on group type
                    switch (group.groupType) {
                      case 'superset':
                        return 'Perform these exercises back-to-back with minimal rest between them. This increases training efficiency and muscular endurance.'
                      case 'circuit':
                        return 'Complete all exercises in sequence before resting. This builds work capacity and cardiovascular conditioning.'
                      case 'density_block':
                        return 'Complete as many quality rounds as possible in the time block. Focus on maintaining form over speed.'
                      case 'cluster':
                        return 'Perform sets with short intra-set rest periods to maintain power output while accumulating volume.'
                      default:
                        return 'Perform these exercises as a group for optimal training effect.'
                    }
                  })()}
                </p>
                {group.restProtocol && (
                  <p className="text-xs text-[#6A6A6A] mt-1.5 flex items-center gap-1">
                    <span className="font-medium">Rest:</span> {group.restProtocol}
                  </p>
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
                    sessionContext={sessionContextForRows}
                    sessionEvidence={sessionEvidence}
                    coachingExplanation={coachingExplanation}
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
  // [EXERCISE-ROW-SURFACE] Session context for building authoritative row surface
  sessionContext?: {
    sessionFocus?: string
    isPrimarySession?: boolean
    prescriptionPropagationAudit?: {
      appliedReductions?: {
        setsReduced?: boolean
        rpeReduced?: boolean
      }
    }
    styleMetadata?: {
      primaryStyle?: string
      hasSupersetsApplied?: boolean
      hasDensityApplied?: boolean
    }
  }
  // [AI-EVIDENCE-BRIDGE] Session evidence for row alignment
  sessionEvidence?: SessionAiEvidenceSurface
  // [COACHING-EXPLANATION-CONTRACT] Authoritative exercise explanation from coaching surface
  coachingExplanation?: ProgramExplanationSurface | null
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
  sessionContext, // [EXERCISE-ROW-SURFACE] Session context for row surface
  sessionEvidence, // [AI-EVIDENCE-BRIDGE] For row alignment
  coachingExplanation, // [COACHING-EXPLANATION-CONTRACT] Authoritative coaching surface
  onReplace,
  onSkip,
  onProgressionAdjust,
}: ExerciseRowProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  // TASK 3: Safety guard for malformed exercise data
  if (!exercise || typeof exercise !== 'object') {
    console.warn('[ExerciseRow] Received invalid exercise:', exercise)
    return null
  }
  
  // [WEEK-PROGRESSION-TRUTH] Prefer scaled values when available
  // ScaledExercise adds scaledSets, scaledReps, scaledTargetRPE for week-adjusted dosage
  const scaledExercise = exercise as unknown as { 
    scaledSets?: number
    scaledReps?: string
    scaledTargetRPE?: number
    weekScalingApplied?: boolean 
  }
  const effectiveSets = scaledExercise.scaledSets ?? exercise.sets ?? 3
  const effectiveReps = scaledExercise.scaledReps ?? exercise.repsOrTime ?? '8-12'
  const effectiveTargetRPE = scaledExercise.scaledTargetRPE ?? exercise.targetRPE
  const weekScalingApplied = scaledExercise.weekScalingApplied ?? false
  
  // [EXERCISE-CARD-CONTRACT] Build canonical display contract
  // [RICH-EXPLANATION-FIX] Pass sessionContext to enable goal-aware reasoning in purpose/effort builders
  const card = buildExerciseCardContract({
    name: exercise.name || 'Exercise',
    category: exercise.category || 'accessory',
    sets: effectiveSets,
    repsOrTime: effectiveReps,
    selectionReason: exercise.selectionReason,
    targetRPE: effectiveTargetRPE,
    restSeconds: exercise.restSeconds,
    prescribedLoad: exercise.prescribedLoad as Parameters<typeof buildExerciseCardContract>[0]['prescribedLoad'],
    coachingMeta: exercise.coachingMeta as Parameters<typeof buildExerciseCardContract>[0]['coachingMeta'],
  }, sessionContext ? {
    sessionFocus: sessionContext.sessionFocus,
    isPrimarySession: sessionContext.isPrimarySession,
    primaryGoal: sessionContext.primaryGoal,
    compositionMetadata: sessionContext.compositionMetadata
  } : undefined)
  
  // [EXERCISE-ROW-SURFACE] Build authoritative row surface for enhanced display
  // [WEEK-PROGRESSION-TRUTH] Use scaled values for week-appropriate dosage display
  const rowSurface = !isWarmupCooldown ? buildExerciseRowSurface(
    {
      id: exercise.id,
      name: exercise.name || 'Exercise',
      category: exercise.category || 'accessory',
      sets: effectiveSets,
      repsOrTime: effectiveReps,
      targetRPE: effectiveTargetRPE,
      restSeconds: exercise.restSeconds,
      selectionReason: exercise.selectionReason,
      isProtected: (exercise as unknown as { isProtected?: boolean }).isProtected,
      isPrimary: (exercise as unknown as { isPrimary?: boolean }).isPrimary,
      prescribedLoad: exercise.prescribedLoad as Parameters<typeof buildExerciseRowSurface>[0]['prescribedLoad'],
      coachingMeta: exercise.coachingMeta as Parameters<typeof buildExerciseRowSurface>[0]['coachingMeta'],
      constraintApplied: (exercise as unknown as { constraintApplied?: string }).constraintApplied,
      groupId: (exercise as unknown as { groupId?: string }).groupId,
    },
    sessionContext
  ) : null
  
  // [AI-EVIDENCE-BRIDGE] Align row surface with session evidence for consistency
  const alignedRowSurface = rowSurface && sessionEvidence 
    ? alignRowWithSessionEvidence(rowSurface, sessionEvidence)
    : rowSurface
  
  const hasRPE = !isWarmupCooldown && exerciseSupportsRPE(card.displayTitle)
  const exerciseId = card.displayTitle.toLowerCase().replace(/[\s-]+/g, '_')
  const hasKnowledge = hasExerciseKnowledge(exerciseId)
  
  // Display name - show adjusted name if progression was changed
  const displayName = adjustedName || card.displayTitle

  // Skipped state - compact
  if (isSkipped) {
    return (
      <div className="py-2 px-3 rounded-lg border bg-[#141414] border-[#222] opacity-50">
        <div className="flex items-center gap-2">
          {index && <span className="text-[10px] text-[#4A4A4A] font-mono">{index}.</span>}
          <SkipForward className="w-3 h-3 text-[#4A4A4A]" />
          <span className="text-xs text-[#5A5A5A] line-through">{card.displayTitle}</span>
          <span className="text-[9px] text-[#4A4A4A] ml-auto">skipped</span>
        </div>
      </div>
    )
  }

  // Build unified prescription line - clean, scannable
  const prescriptionParts: string[] = [card.prescriptionLine]
  if (card.loadBadge) prescriptionParts.push(card.loadBadge)
  if (hasRPE && card.intensityBadge) prescriptionParts.push(card.intensityBadge)
  if (card.restGuidance) prescriptionParts.push(card.restGuidance)
  const unifiedPrescription = prescriptionParts.join(' · ')
  
  // Intent determines accent color
  const intentAccent: Record<string, string> = {
    max_strength: 'text-blue-400',
    strength_volume: 'text-blue-300',
    skill_acquisition: 'text-[#E63946]',
    skill_intensity: 'text-[#E63946]',
    explosive_power: 'text-amber-400',
    hypertrophy: 'text-purple-400',
    support_strength: 'text-[#6A6A6A]',
    technical_carryover: 'text-teal-400',
    tissue_prep: 'text-[#6A6A6A]',
    density_conditioning: 'text-orange-400',
  }
  
  // [SINGLE-TRUTH-FIX] showContextCue removed - prescriptionContext was a stale secondary path

  return (
    <div className={`py-2 px-3 rounded-lg border transition-colors ${
      isWarmupCooldown 
        ? 'bg-[#151515] border-[#222]' 
        : adjustedName 
          ? 'bg-[#171717] border-[#4F6D8A]/20' 
          : 'bg-[#171717] border-[#282828] hover:border-[#3A3A3A]'
    }`}>
      {/* ROW 1: Name + Intent + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {(prefix || index) && (
            <span className="text-[10px] text-[#4A4A4A] font-mono shrink-0">{prefix || `${index}.`}</span>
          )}
          <p className="font-medium text-[#E5E5E5] text-[13px] truncate">{displayName}</p>
          {!isWarmupCooldown && (
            <span className={`text-[9px] shrink-0 ${intentAccent[card.prescriptionIntent] || 'text-[#5A5A5A]'}`}>
              {card.intentLabel}
            </span>
          )}
          {adjustedName && (
            <span className="text-[8px] px-1 rounded bg-[#4F6D8A]/10 text-[#4F6D8A] shrink-0">adj</span>
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
      
      {/* ROW 2: Unified prescription - SINGLE VISIBLE DOSAGE TRUTH */}
      {/* [CANONICAL-DISPLAY-CONTRACT] All fields from buildExerciseCardContract in program-display-contract.ts */}
      {/* DOSAGE OWNER: prescriptionLine, intensityBadge, restGuidance */}
      {/* EXPLANATION OWNER: prescriptionContext (derived from same prescriptionIntent) */}
      {/* BANNED STALE SOURCES: exercise.note (doctrineFinalNote), alignedRowSurface chips, getBestRowSublabel */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[13px] font-medium text-[#CACACA]">{card.prescriptionLine}</span>
        {card.intensityBadge && hasRPE && (
          <span className="text-[11px] text-[#7A7A7A]">{card.intensityBadge}</span>
        )}
        {card.restGuidance && (
          <span className="text-[10px] text-[#5A5A5A]">{card.restGuidance}</span>
        )}
      </div>
      
      {/* ROW 3: Canonical explanation - TWO LEVELS from SAME canonical contract */}
      {/* [SUMMARY-OWNER] whyLine = visible card summary (concise WHY) */}
      {/* [DETAIL-OWNER] detailExplanation = InfoBubble content (richer purpose + effort) */}
      {/* [COMPACT-CUE] prescriptionContext = fallback execution cue */}
      {/* All from buildExerciseCardContract - same canonical source, no contradiction possible */}
      {/* BANNED: exercise.note, alignedRowSurface, getBestRowSublabel, old coaching fallbacks */}
      {!isWarmupCooldown && (card.whyLine || card.prescriptionContext) && (
        <div className="flex items-center gap-1 mt-1">
          <p className="text-[10px] text-[#6A6A6A] italic">
            {/* Summary: prefer whyLine (WHY this exercise) over prescriptionContext (HOW to execute) */}
            {card.whyLine || card.prescriptionContext}
          </p>
          {/* InfoBubble: richer detail from same canonical contract */}
          {card.detailExplanation && card.detailExplanation !== card.whyLine && (
            <InfoBubble content={card.detailExplanation} />
          )}
        </div>
      )}
      
      {/* Constraint note kept - this is safety/equipment info, not prescription wording */}
      {card.constraintNote && (
        <p className="text-[10px] text-amber-400/70 mt-1">{card.constraintNote}</p>
      )}
      
      {/* Knowledge expansion - only for main exercises with knowledge */}
      {!isWarmupCooldown && hasKnowledge && (
        showDetails ? (
          <div className="mt-1.5 pt-1.5 border-t border-[#222]">
            <button className="text-[9px] text-[#5A5A5A] hover:text-[#7A7A7A] mb-1.5" onClick={() => setShowDetails(false)}>
              − hide
            </button>
            <ExerciseKnowledgeBubble exerciseId={exerciseId} showSkillCarryover showSafetyNote />
          </div>
        ) : (
          <button className="mt-1 text-[9px] text-[#3A3A3A] hover:text-[#6A6A6A]" onClick={() => setShowDetails(true)}>
            + info
          </button>
        )
      )}
    </div>
  )
}
