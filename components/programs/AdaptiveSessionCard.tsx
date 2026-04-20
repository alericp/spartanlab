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
import { buildGroupedDisplayModel, minMembersFor, type GroupedDisplayModel, type RenderBlock } from './lib/session-group-display'
import { 
  addOverride, 
  applyOverridesToSession,
  type ExerciseOverride 
} from '@/lib/exercise-override-service'
import { recordReplaceSignal } from '@/lib/override-signal-service'
import type { EquipmentType } from '@/lib/adaptive-exercise-pool'

// ============================================================================
// [GROUPED-BODY-PRIORITY]
// Production rule: whenever the grouped render contract reports grouped
// truth, the grouped body wins priority over COMPLETED_SUMMARY /
// ACTIVE_WORKOUT_CARD. The prior debug-era `FORCE_LAST_VISIBLE_BODY_PROOF`
// / `FORCE_GROUPED_RUNTIME_PROOF` constants and their giant proof panels
// have been removed; grouped display is owned by `MainExercisesRenderer`
// via its real rich / raw-fallback / flat dispatch.
// ============================================================================

// [TEMP-INSTRUMENTATION] Module-level dedupe guard for the fire-and-forget
// POST to /api/_funnel-audit. Keys are `${dayNumber}|${verdict}|${variantLabel}`.
// Prevents re-posting on every render/re-mount within a single tab session.
// Remove along with the fetch block and the /api/_funnel-audit/route.ts file
// once the tested session's first-failing-stage verdict has been captured.
const __funnelAuditPostedKeys: Set<string> = new Set()

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
  // [ALWAYS-VISIBLE-PROBE] Force probe to render unconditionally
  forceProbe?: boolean
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
// [GROUPED-VISIBLE-OWNERSHIP] The card body must visibly assert grouped truth
// as the dominant session structure whenever grouped truth exists upstream.
// Earlier palette used `/5` background and `/40` border, which rendered grouped
// blocks almost indistinguishable from flat rows on the dark card background --
// ownership was correct in the contract but lost visually. We now expose two
// background tiers:
//   - `bg`:      the header pill tint (moderate -- `/15`)
//   - `blockBg`: the surrounding block-container tint (subtle but present --
//                `/[0.08]`) so members visibly belong to the group, not the
//                flat list above/below.
// Border goes to `/60` so the left-border accent on members is unmistakable.
// Text colors stay on-brand (superset uses blue-gray palette tone instead of
// a flat muted hex so contrast lifts without adding a new color family).
function getGroupTypeColors(groupType: StyledGroup['groupType']): { border: string; bg: string; blockBg: string; text: string } {
  switch (groupType) {
    case 'superset':
      return { border: 'border-[#4F6D8A]/60', bg: 'bg-[#4F6D8A]/15', blockBg: 'bg-[#4F6D8A]/[0.08]', text: 'text-[#7FA8CC]' }
    case 'circuit':
      return { border: 'border-emerald-500/60', bg: 'bg-emerald-500/15', blockBg: 'bg-emerald-500/[0.08]', text: 'text-emerald-300' }
    case 'density_block':
      return { border: 'border-amber-500/60', bg: 'bg-amber-500/15', blockBg: 'bg-amber-500/[0.08]', text: 'text-amber-300' }
    case 'cluster':
      return { border: 'border-purple-500/60', bg: 'bg-purple-500/15', blockBg: 'bg-purple-500/[0.08]', text: 'text-purple-300' }
    default:
      return { border: 'border-transparent', bg: 'bg-transparent', blockBg: 'bg-transparent', text: 'text-[#A5A5A5]' }
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

export function AdaptiveSessionCard({ session: rawSession, onExerciseReplace, onWorkoutComplete, onExerciseOverride, programId, primaryGoal, secondaryGoal, sessionEvidence: providedEvidence, defaultExpanded = false, coachingExplanation, weekCharacter, showProbe: _showProbe = false, forceProbe: _forceProbe = false }: AdaptiveSessionCardProps) {
  // [PROBES-HARD-DISABLED] Session truth probes are retired. They caused
  // debug-looking text ("PROBE ACTIVE", instance-id letter fragments, etc.)
  // to leak into production UI when accidentally enabled via query param.
  // The probeActive flag is permanently false here -- probe JSX blocks below
  // are dead code that never renders. showProbe/forceProbe props are kept for
  // interface compatibility but are not honored. To revive probes, wire a
  // new explicitly dev-only gate behind process.env.NODE_ENV checks.
  const cardInstanceId = `card-${rawSession.dayNumber}-${rawSession.name?.slice(0,10) || 'session'}-${Date.now().toString(36).slice(-4)}`
  const probeActive = false as boolean
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
  const [showMethodDecisions, setShowMethodDecisions] = useState(false)
  
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
  // [GROUPED-RENDER-CONTRACT] SINGLE AUTHORITATIVE grouped render contract.
  // Computed ONCE per card mount. All three consumers below (FUNNEL-AUDIT probe,
  // method-summary chip row, and MainExercisesRenderer body) read from this
  // exact object.
  //
  // [VARIANT-PRUNE-LOCK] When a variant is selected (45 or 30 mode), the
  // card's visible exercise list is already trimmed to the variant's
  // subset via `fullVisibleExercises`. But `sessionStyleMetadata` is the
  // FULL session's metadata -- its styledGroups may reference exercises
  // that are NO LONGER present in the variant. Feeding the raw metadata
  // to the adapter makes it return "group with 2 members" for a pair
  // whose second member was dropped; the renderer then hydrates one row
  // and text-fallbacks the other, producing a broken-looking group.
  //
  // The fix: prune styledGroups to only members present in
  // `fullVisibleExercises` BEFORE handing to the adapter. Groups that
  // lose too many members to still be that method (e.g. superset below
  // 2 members) are dropped entirely. This keeps the grouped contract
  // and the visible variant body in lockstep, mirroring the same prune
  // already applied in the live workout route at
  // app/(app)/workout/session/page.tsx.
  // ==========================================================================
  const variantPrunedStyleMetadata: SessionStyleMetadata | undefined = (() => {
    if (!sessionStyleMetadata?.styledGroups || sessionStyleMetadata.styledGroups.length === 0) {
      return sessionStyleMetadata
    }
    if (!selectedVariantData) {
      return sessionStyleMetadata
    }
    const normalizeKey = (s: string): string =>
      (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
    const survivingIds = new Set(fullVisibleExercises.map(e => e.id).filter(Boolean))
    const survivingNames = new Set(fullVisibleExercises.map(e => normalizeKey(e.name)).filter(Boolean))
    const prunedGroups = sessionStyleMetadata.styledGroups
      .map(g => {
        const keptMembers = g.exercises.filter(m =>
          survivingIds.has(m.id) || survivingNames.has(normalizeKey(m.name))
        )
        return { ...g, exercises: keptMembers }
      })
      .filter(g => {
        // [METHOD-MIN-MEMBERS-AUTHORITY] Method-specific minimums -- NOT a
        // blanket `>= 2`. The prior blanket rule silently dropped legitimate
        // single-exercise cluster groups (clusters are emitted as 1-member
        // groups by adaptive-program-builder.ts line 12286), making every
        // cluster invisible on the Program card. Now reuses the canonical
        // `minMembersFor()` helper so this rule is identical across the card
        // variant prune, Start-Workout variant prune, and the adapter's own
        // partial-validity filter -- single source of truth.
        return g.exercises.length >= minMembersFor(g.groupType)
      })
    return {
      ...sessionStyleMetadata,
      styledGroups: prunedGroups,
    }
  })()

  const groupedRenderContract: GroupedDisplayModel = buildGroupedDisplayModel(
    variantPrunedStyleMetadata,
    fullVisibleExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      blockId: (ex as unknown as { blockId?: string }).blockId,
      method: (ex as unknown as { method?: string }).method,
      methodLabel: (ex as unknown as { methodLabel?: string }).methodLabel,
    }))
  )
  // [DISPLAY-FIRST-FALLBACK] Two separate gates, each with a precise meaning:
  //   - hasGroupedTruth:         upstream grouped truth exists (raw signal,
  //                              pre-partial-validity filtering).
  //   - hasRichRenderableGroups: the rich grouped contract is strong enough
  //                              for the preferred grouped renderer.
  //
  // The card renders via this priority:
  //   1. hasRichRenderableGroups === true  -> rich grouped path
  //   2. hasGroupedTruth === true          -> raw grouped fallback path
  //   3. neither                            -> honest flat path
  //
  // `hasRenderableGroups` is preserved as an alias of `hasRichRenderableGroups`
  // for the chip/audit consumers that already read it.
  const hasGroupedTruth = groupedRenderContract.hasGroupedTruth
  const hasRichRenderableGroups = groupedRenderContract.hasRichRenderableGroups
  const hasRenderableGroups = hasRichRenderableGroups

  // ==========================================================================
  // [OUTER-BODY-DECISION] SINGLE AUTHORITATIVE OWNER
  //
  // `chosenOuterBodyMode` is the ONE source of truth for which expanded-body
  // branch is rendered. Both the visible debug panel and the JSX branch chain
  // below consume this same variable, so they can never disagree.
  //
  // `shouldRenderGroupedProgramBody` is the ONE source of truth for whether a
  // card is grouped-eligible. It derives from the authoritative grouped render
  // contract (`hasGroupedTruth`), not from cosmetic/debug booleans. When it is
  // true, grouped display MUST win over the completed/active/paused branches
  // because those branches were silently stealing grouped-eligible Program
  // cards that had stale completion/session flags.
  //
  // Priority order:
  //   1. shouldRenderGroupedProgramBody       -> GROUPED_PROGRAM_BODY
  //   2. isCompleted                          -> COMPLETED_SUMMARY
  //   3. isActive || isPaused                 -> ACTIVE_WORKOUT_CARD
  //   4. (else)                               -> NORMAL_EXPANDED_BODY
  // ==========================================================================
  const shouldRenderGroupedProgramBody = hasGroupedTruth

  type OuterBodyMode =
    | 'GROUPED_PROGRAM_BODY'
    | 'COMPLETED_SUMMARY'
    | 'ACTIVE_WORKOUT_CARD'
    | 'NORMAL_EXPANDED_BODY'
  let chosenOuterBodyMode: OuterBodyMode
  if (shouldRenderGroupedProgramBody) {
    chosenOuterBodyMode = 'GROUPED_PROGRAM_BODY'
  } else if (isCompleted) {
    chosenOuterBodyMode = 'COMPLETED_SUMMARY'
  } else if (isActive || isPaused) {
    chosenOuterBodyMode = 'ACTIVE_WORKOUT_CARD'
  } else {
    chosenOuterBodyMode = 'NORMAL_EXPANDED_BODY'
  }

  // ==========================================================================
  // [FUNNEL-AUDIT] One-shot compact stage comparison for THIS session only.
  // Emits ONE line per card mount covering the ENTIRE render-population
  // corridor (Stage 1 session prop -> Stage 6 fullVisibleExercises -> Stage 7
  // grouped display adapter output -> Stage 8 render branch decision). This is
  // the single authoritative probe for narrowing the first failing stage when
  // the visible card body does not show grouped structure. Prior noisier
  // per-session / per-render logs have been demoted to fire only on truth-loss.
  // ==========================================================================
  if (typeof window !== 'undefined' && session.dayNumber) {
    const s1Ex = Array.isArray(rawSession.exercises) ? rawSession.exercises : []
    const s1StyledGroups = sessionStyleMetadata?.styledGroups ?? []
    const s1NonStraight = s1StyledGroups.filter(g => g.groupType !== 'straight').length
    const s1ExWithBlockId = s1Ex.filter(e => !!(e as { blockId?: string }).blockId).length
    const s1ExWithNonStraightMethod = s1Ex.filter(e => {
      const m = (e as { method?: string }).method
      return !!m && m !== 'straight'
    }).length
    const s6ExWithBlockId = fullVisibleExercises.filter(
      e => !!(e as unknown as { blockId?: string }).blockId
    ).length
    const s6ExWithNonStraightMethod = fullVisibleExercises.filter(e => {
      const m = (e as unknown as { method?: string }).method
      return !!m && m !== 'straight'
    }).length

    // [FUNNEL-AUDIT] Stage 7: consume the SINGLE authoritative grouped render
    // contract. This probe is observational only -- it reads the same object
    // the chip summary and the renderer body consume, so its verdict is never
    // allowed to disagree with what actually renders.
    const s7Model = groupedRenderContract

    // Final verdict: the exact first failing stage (or honest flat attribution).
    let verdict: string
    if (!sessionStyleMetadata && s1ExWithBlockId === 0 && s1ExWithNonStraightMethod === 0) {
      verdict = 'STAGE1_FLAT_NO_UPSTREAM_GROUPED_TRUTH'
    } else if (s1NonStraight === 0 && s1ExWithNonStraightMethod === 0) {
      verdict = 'STAGE1_ONLY_STRAIGHT_GROUPED_TRUTH'
    } else if (s6ExWithBlockId < s1ExWithBlockId || s6ExWithNonStraightMethod < s1ExWithNonStraightMethod) {
      verdict = 'STAGE5_6_BRIDGE_LOST_PER_EXERCISE_GROUPED_FIELDS'
    } else if ((s1NonStraight > 0 || s1ExWithNonStraightMethod > 0) && !s7Model.hasGroups) {
      verdict = 'STAGE7_ADAPTER_REJECTED_GROUPED_TRUTH'
    } else if (s7Model.hasGroups && s7Model.nonStraightGroupCount === 0) {
      verdict = 'STAGE7_ADAPTER_RETURNED_ONLY_STRAIGHT_GROUPS'
    } else if (s7Model.hasGroups && s7Model.nonStraightGroupCount > 0 && !hasRenderableGroups) {
      verdict = 'STAGE8_CONTRACT_SAYS_GROUPED_BUT_RENDER_BRANCH_FLAT'
    } else if (hasRichRenderableGroups) {
      verdict = 'STAGE8_RICH_GROUPED_RENDER_BRANCH_ACTIVE'
    } else if (hasGroupedTruth && s7Model.rawFallbackBlocks.length > 0) {
      verdict = 'STAGE8_RAW_GROUPED_FALLBACK_BRANCH_ACTIVE'
    } else if (hasGroupedTruth) {
      verdict = 'STAGE8_GROUPED_TRUTH_EXISTS_BUT_NO_FALLBACK_BLOCKS'
    } else {
      verdict = 'STAGE1_THROUGH_STAGE8_UNCLASSIFIED'
    }
    const funnelAuditPayload = {
      day: session.dayNumber,
      // Stage 1: session prop as received by the card
      s1_hasStyleMeta: !!sessionStyleMetadata,
      s1_styledGroups: s1StyledGroups.length,
      s1_nonStraight: s1NonStraight,
      s1_exCount: s1Ex.length,
      s1_exWithBlockId: s1ExWithBlockId,
      s1_exWithNonStraightMethod: s1ExWithNonStraightMethod,
      // Stage 6: fullVisibleExercises (what the renderer actually walks)
      s6_exCount: fullVisibleExercises.length,
      s6_exWithBlockId: s6ExWithBlockId,
      s6_exWithNonStraightMethod: s6ExWithNonStraightMethod,
      // Stage 7: single grouped render contract (what decides grouped-vs-flat)
      s7_sourceUsed: s7Model.sourceUsed,
      s7_flatReason: s7Model.flatReason,
      s7_hasGroups: s7Model.hasGroups,
      s7_totalGroups: s7Model.totalGroupCount,
      s7_nonStraightGroups: s7Model.nonStraightGroupCount,
      s7_supersetCount: s7Model.supersetCount,
      s7_circuitCount: s7Model.circuitCount,
      s7_densityCount: s7Model.densityCount,
      s7_clusterCount: s7Model.clusterCount,
      // Stage 8: final render branch
      s8_useGroupedRender: hasRenderableGroups,
      // [DISPLAY-FIRST-FALLBACK] Explicit two-gate signals
      s8_hasGroupedTruth: hasGroupedTruth,
      s8_hasRichRenderableGroups: hasRichRenderableGroups,
      s8_rawFallbackBlockCount: s7Model.rawFallbackBlocks.length,
      // Variant identity for reproducibility of the tested case
      selectedVariant: activeSessionView.variantLabel,
      // Final first-failing-stage verdict
      verdict,
    }
    console.log('[v0] [FUNNEL-AUDIT] Day', session.dayNumber, funnelAuditPayload)

    // [TEMP-INSTRUMENTATION] Fire-and-forget POST to the server sink at
    // /api/_funnel-audit so the payload lands in SERVER logs (readable by the
    // agent via user_read_only_context/v0_debug_logs.log) even when client
    // console output is not accessible. Guarded by a module-level Set keyed on
    // (dayNumber, verdict, variant) so each distinct verdict POSTs at most
    // once per tab session. Remove this block and the route file when done.
    const dedupeKey = `${session.dayNumber}|${verdict}|${activeSessionView.variantLabel}`
    if (!__funnelAuditPostedKeys.has(dedupeKey)) {
      __funnelAuditPostedKeys.add(dedupeKey)
      try {
        void fetch('/api/_funnel-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(funnelAuditPayload),
          keepalive: true,
        }).catch(() => { /* swallow: telemetry is best-effort */ })
      } catch {
        /* swallow: telemetry is best-effort */
      }
    }
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
  
  // [REMOVED] Top-level debug probe computations (computeTopProbeFlatReason,
  // computeTopProbeVerdict, topProbeFlatReason, topProbeVerdict). They fed
  // the now-removed fuchsia SESSION TRUTH PROBE banner and had no production
  // consumer.

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
            {/* [REMOVED] GROUPED_TRUTH s4/s5/s7 breadcrumb chip. Grouped days are
                now visibly recognized through the production method-summary
                chips (Superset/Circuit/Density/Cluster) and the colored grouped
                block headers inside MainExercisesRenderer, not via a debug chip. */}

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
          {/* ==========================================================================
              [OUTER-BODY-DISPATCH] Single consumer of `chosenOuterBodyMode`.
              Priority enforced: GROUPED_PROGRAM_BODY wins over completed / active /
              paused for any card whose contract reports grouped truth. Both
              GROUPED_PROGRAM_BODY and NORMAL_EXPANDED_BODY render the same real
              production body; `MainExercisesRenderer` inside that body performs
              the grouped-vs-flat internal dispatch via its `rawFallbackBlocks`
              path, so grouped-eligible cards visibly render grouped structure.
              ========================================================================== */}
          {chosenOuterBodyMode === 'COMPLETED_SUMMARY' ? (
            <WorkoutSessionSummary
              stats={stats}
              completedSets={completedSets}
              sessionName={session.dayLabel}
              onSave={saveSession}
              onReturnToDashboard={handleReturnToDashboard}
              onReturnToProgram={handleReturnToProgram}
            />
          ) : chosenOuterBodyMode === 'ACTIVE_WORKOUT_CARD' ? (
            /* [workout-route] UNIFIED: Active workouts now route to /workout/session */
            <WorkoutExecutionCard
              session={session}
              onComplete={handleWorkoutComplete}
              onCancel={handleWorkoutCancel}
              sessionState={workoutSession}
            />
          ) : (
            /* =====================================================================
               [SHARED PRODUCTION BODY] Rendered for BOTH `GROUPED_PROGRAM_BODY`
               and `NORMAL_EXPANDED_BODY`. Grouped-vs-flat rendering is delegated
               to `MainExercisesRenderer` (which uses the single authoritative
               grouped render contract). No parallel grouped UI path exists; one
               owner drives the visible body.
               ===================================================================== */
            <>
              {/* [REMOVED] Tiny mode/grouped diagnostic chip. Grouped branch
                  ownership is still enforced by `chosenOuterBodyMode` above
                  (GROUPED_PROGRAM_BODY wins over COMPLETED / ACTIVE whenever
                  grouped truth exists), but the visible chip is no longer
                  needed; grouped days are recognized through real production
                  UI (method chips + colored grouped block headers). */}
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

          {/* [REMOVED] SESSION TRUTH PROBE (dev only) dump. Debug-era diagnostic
              panel that printed raw style-metadata, variant state, render
              decisions, and verdict strings. No replacement UI is needed; the
              grouped render contract already drives the production method chips
              and grouped block headers below. */}

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
              Warm-Up
              <span className="text-xs text-[#4F6D8A]">({session.warmup.length} exercises)</span>
            </button>
            {showWarmup && (
              <div className="mt-2 space-y-2">
                {/* [WARM-UP-STRUCTURE-CONTRACT] Prior intended warm-up surface: the
                    structure-explanation KnowledgeBubble ("Joint protocols appear in
                    warm-up to prepare specific areas for main work.") sits ABOVE the
                    selectionReason italic and the per-exercise rows. Removing it was
                    a regression; this block restores the earlier contract exactly. */}
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

{/* =========================================================================
    [GROUPED-METHOD-SUMMARY] Visible session methodology indicator
    Uses the unified display adapter for consistent grouped truth consumption
    ========================================================================= */}
{(() => {
  // [GROUPED-RENDER-CONTRACT] Consume the SINGLE authoritative grouped render
  // contract hoisted above. The chip and the body are now guaranteed to agree:
  // chip visibility is gated by the EXACT same object that drives the body's
  // grouped-vs-flat decision. No parallel computation, no drift.
  const groupedDisplay = groupedRenderContract
  if (!hasRenderableGroups) return null
  
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {groupedDisplay.supersetCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25">
          <Layers className="w-3.5 h-3.5" />
          {groupedDisplay.supersetCount} Superset{groupedDisplay.supersetCount > 1 ? 's' : ''}
        </span>
      )}
      {groupedDisplay.circuitCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-500/15 text-orange-300 border border-orange-500/25">
          <Zap className="w-3.5 h-3.5" />
          {groupedDisplay.circuitCount} Circuit{groupedDisplay.circuitCount > 1 ? 's' : ''}
        </span>
      )}
      {groupedDisplay.densityCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25">
          <Timer className="w-3.5 h-3.5" />
          {groupedDisplay.densityCount} Density Block{groupedDisplay.densityCount > 1 ? 's' : ''}
        </span>
      )}
      {groupedDisplay.clusterCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
          <Layers className="w-3.5 h-3.5" />
          {groupedDisplay.clusterCount} Cluster Set{groupedDisplay.clusterCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
})()}

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
  showProbe={probeActive}
  forceProbe={probeActive}
  cardInstanceId={cardInstanceId}
  // [GROUPED-RENDER-CONTRACT] Pass the SINGLE authoritative contract down so
  // the renderer does not recompute and cannot diverge from the chip/audit.
  groupedRenderContract={groupedRenderContract}
  hasRenderableGroups={hasRenderableGroups}
  hasGroupedTruth={hasGroupedTruth}
  />

          {/* [METHOD-DECISIONS-DISCLOSURE] Clean athlete-facing explanation of structure choices.
              [TRUTH-CONTRACT] Applied methods MUST derive from actual final styledGroups with
              non-straight blocks, NOT from upstream intent metadata. This prevents false-positive
              "Supersets applied" messages when the final session is actually flat. */}
          {(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const styleMeta: any = (session as any).styleMetadata
            if (!styleMeta) return null
            const userSelected: string[] = styleMeta.methodIntentContract?.userPreferences || []
            // Only surface grouped-corridor methods; top_set/drop_set are per-exercise, not this corridor
            const groupedCorridor = ['supersets', 'circuits', 'density_blocks', 'cluster_sets']
            const userSelectedGrouped = userSelected.filter((m: string) => groupedCorridor.includes(m))
            
            // =================================================================
            // [TRUTH-CONTRACT-FIX] Derive applied methods from ACTUAL final
            // styledGroups with non-straight blocks, NOT from intent metadata.
            // This enforces: GROUPED METHOD APPLIED = FINAL SESSION HAS NON-STRAIGHT GROUPED STRUCTURE
            // =================================================================
            const styledGroups: Array<{ groupType: string }> = styleMeta.styledGroups || []
            const actualNonStraightGroups = styledGroups.filter(g => g.groupType !== 'straight')
            
            // Map group types to method names for truthful "applied" reporting
            const groupTypeToMethod: Record<string, string> = {
              'superset': 'supersets',
              'circuit': 'circuits',
              'density_block': 'density_blocks',
              'cluster': 'cluster_sets',
            }
            
            // Build applied array from ACTUAL final grouped truth only
            const applied: string[] = [...new Set(
              actualNonStraightGroups
                .map(g => groupTypeToMethod[g.groupType])
                .filter((m): m is string => !!m && groupedCorridor.includes(m))
            )]
            
            // Build rejected array: methods user selected that did NOT materialize in final groups
            const intentApplied: string[] = (styleMeta.appliedMethods || []).filter((m: string) => groupedCorridor.includes(m))
            const falsePositiveApplied = intentApplied.filter(m => !applied.includes(m))
            
            // Start with explicit rejected methods from builder
            const builderRejected: Array<{ method: string; reason: string }> = (styleMeta.rejectedMethods || [])
              .filter((r: unknown): r is { method: string; reason: string } =>
                !!r && typeof r === 'object' && 'method' in r && 'reason' in r && groupedCorridor.includes((r as { method: string }).method))
              // De-duplicate by method, keeping the first (most specific) reason
              .filter((r, idx, arr) => arr.findIndex((x) => x.method === r.method) === idx)
            
            // [TRUTH-CONTRACT] Add false-positive "applied" methods to rejected with honest reason
            // These are methods that upstream intent marked as applied, but no actual grouped blocks exist
            const falsePositiveRejected: Array<{ method: string; reason: string }> = falsePositiveApplied
              .filter(m => !builderRejected.some(r => r.method === m))
              .map(m => ({
                method: m,
                reason: 'No eligible exercise pairs found for grouping in final session structure.'
              }))
            
            // Combine builder rejected + false-positive rejected
            const rejected = [...builderRejected, ...falsePositiveRejected]

            // Nothing meaningful to say? Don't render the surface.
            if (userSelectedGrouped.length === 0 && applied.length === 0) return null

            const methodLabel = (m: string): string => {
              switch (m) {
                case 'supersets': return 'Supersets'
                case 'circuits': return 'Circuits'
                case 'density_blocks': return 'Density blocks'
                case 'cluster_sets': return 'Cluster sets'
                default: return m
              }
            }

            // One-sentence summary of why the applied structure was chosen
            let appliedSummary = ''
            if (applied.length > 0) {
              const primary = styleMeta.primaryStyle || applied[0]
              if (primary === 'supersets' || applied.includes('supersets')) {
                appliedSummary = 'Supersets applied to accessory work to save time without compromising the main quality exposure.'
              } else if (primary === 'circuits' || applied.includes('circuits')) {
                appliedSummary = 'Circuits applied to the accessory tail for conditioning density.'
              } else if (primary === 'cluster_sets' || applied.includes('cluster_sets')) {
                appliedSummary = 'Cluster sets applied to preserve output on heavy or skill work.'
              } else if (primary === 'density_blocks' || applied.includes('density_blocks')) {
                appliedSummary = 'Density block applied to the accessory tail to build work capacity.'
              }
            } else {
              appliedSummary = 'Straight sets today — today\'s composition favors focused quality over grouping.'
            }

            return (
              <div className="mt-4 border-t border-[#2A2A2A] pt-3">
                <button
                  className="flex items-center gap-2 text-xs text-[#8A8A8A] hover:text-[#C5C5C5] transition-colors w-full"
                  onClick={() => setShowMethodDecisions(!showMethodDecisions)}
                  aria-expanded={showMethodDecisions}
                >
                  {showMethodDecisions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span className="font-medium">Method decisions</span>
                  <span className="text-[10px] text-[#6A6A6A] ml-auto">
                    {applied.length > 0 ? `${applied.length} applied` : 'Straight sets'}
                    {rejected.length > 0 && ` · ${rejected.length} not used`}
                  </span>
                </button>

                {showMethodDecisions && (
                  <div className="mt-3 space-y-3 text-xs">
                    {/* Applied methods summary */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-[#6A6A6A] mb-1.5">
                        Today&apos;s structure
                      </div>
                      <p className="text-[#C5C5C5] leading-relaxed">
                        {appliedSummary}
                      </p>
                      {applied.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {applied.map(m => (
                            <span
                              key={m}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#2A2A2A] text-[#C5C5C5] border border-[#3A3A3A]"
                            >
                              {methodLabel(m)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rejected methods (only those the user selected) */}
                    {rejected.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-[#6A6A6A] mb-1.5">
                          Selected styles not used today
                        </div>
                        <ul className="space-y-1.5">
                          {rejected.map((r, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-[#6A6A6A] shrink-0">·</span>
                              <span className="text-[#A5A5A5] leading-relaxed">
                                <span className="text-[#C5C5C5] font-medium">{methodLabel(r.method)}:</span>{' '}
                                {r.reason}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

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
  // [ALWAYS-VISIBLE-PROBE] Force probe unconditionally
  forceProbe?: boolean
  // [ALWAYS-VISIBLE-PROBE] Card instance ID for correlation
  cardInstanceId?: string
  // [GROUPED-RENDER-CONTRACT] SINGLE authoritative grouped render contract,
  // computed once in the parent card. Passing it as a required prop makes the
  // renderer a pure consumer -- it CANNOT disagree with the chip/audit.
  groupedRenderContract: GroupedDisplayModel
  // [DISPLAY-FIRST-FALLBACK] Rich grouped render is possible. Alias of
  // `groupedRenderContract.hasRichRenderableGroups` forwarded from the parent.
  hasRenderableGroups: boolean
  // [DISPLAY-FIRST-FALLBACK] Upstream grouped truth exists at all (raw
  // pre-filter signal). When true but hasRenderableGroups is false, the
  // renderer takes the raw grouped fallback branch instead of falling to flat.
  hasGroupedTruth: boolean
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
  showProbe: _innerShowProbe = false,
  forceProbe: _innerForceProbe = false,
  cardInstanceId = 'unknown',
  groupedRenderContract,
  hasRenderableGroups,
  hasGroupedTruth,
}: MainExercisesRendererProps) {
  // Get style metadata from session if available
  const styleMetadata = (session as AdaptiveSession & { styleMetadata?: SessionStyleMetadata }).styleMetadata
  
  // ==========================================================================
  // [GROUPED-RENDER-CONTRACT] Renderer is a PURE CONSUMER of the single
  // authoritative contract computed in the parent card. No recomputation here.
  // This guarantees the body's grouped-vs-flat decision is IDENTICAL to the
  // chip summary's decision and to the FUNNEL-AUDIT probe's verdict. The stale
  // parallel decision path (recomputing buildGroupedDisplayModel inside the
  // renderer) has been removed entirely.
  // ==========================================================================
  const groupedDisplayModel = groupedRenderContract
  const useGroupedRender = hasRenderableGroups
  const hasNonStraightGroups = groupedDisplayModel.nonStraightGroupCount > 0
  const styledGroups = groupedDisplayModel.groups
  
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
    compositionMetadata: compositionMeta ? {
      spineSessionType: compositionMeta.spineSessionType,
      sessionIntent: compositionMeta.sessionIntent,
    } : undefined,
  }
  
  // [REMOVED] DEV-TRUTH-PROBE computations (flatReasonCode, nonStraightGroups,
  // groupedExerciseNamesFromTruth, matchedGroupedNames, missingGroupedNames,
  // overlapScore, doctrineVerdict) and the DevRenderBranchBanner component.
  // These fed the retired debug banners and have no production consumer. The
  // grouped render contract is already the single authoritative source of
  // truth for grouped-vs-flat decisions below.
  
  // ==========================================================================
  // [REMOVED] FORCE_GROUPED_RUNTIME_PROOF temporary dominant override.
  // The yellow "GROUPED RUNTIME PROOF MODE ACTIVE" panel that previously
  // replaced the entire exercise body for grouped-eligible cards has been
  // deleted. Grouped-eligible sessions now fall through to the raw grouped
  // fallback path (display-first, visible grouped structure) or the rich
  // grouped path below, both of which produce the real production grouped
  // card body with colored section headers + hydrated ExerciseRow members.
  // ==========================================================================

  // ==========================================================================
  // [DISPLAY-FIRST-FALLBACK] RAW GROUPED FALLBACK PATH
  //
  // Priority:
  //   1. hasRichRenderableGroups === true  -> rich grouped path (below)
  //   2. hasGroupedTruth === true          -> THIS raw fallback path
  //   3. neither                            -> flat path (further below)
  //
  // This intermediate branch activates when upstream grouped truth exists
  // (styledGroups had non-straight groups, or exercises had blockId+method
  // grouping) but the rich path could not produce renderable groups --
  // typically because partial-validity filters dropped too many members.
  //
  // The branch renders grouped headers + member rows using the contract's
  // rawFallbackBlocks (permissive: >=1 usable member per block, no min-count
  // gate). Rows are hydrated to full ExerciseRow when displayExercises can
  // resolve the member by id/name; otherwise a minimal text row is rendered.
  // Either way, visible grouped structure is guaranteed whenever grouped
  // truth exists upstream.
  // ==========================================================================
  if (!useGroupedRender && hasGroupedTruth && groupedDisplayModel.rawFallbackBlocks.length > 0) {
    const fallbackBlocks = groupedDisplayModel.rawFallbackBlocks
    const normalizeKey = (s: string): string =>
      (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
    const hydrateMap = new Map<string, AdaptiveExercise>()
    displayExercises.forEach(e => {
      if (e.id) hydrateMap.set(e.id, e)
      if (e.name) {
        hydrateMap.set(e.name, e)
        hydrateMap.set(e.name.toLowerCase(), e)
        const norm = normalizeKey(e.name)
        if (norm) hydrateMap.set(norm, e)
      }
    })
    let rawIdx = 0
    return (
      <div className="space-y-4">
        {fallbackBlocks.map((block, bIdx) => {
          const colors = getGroupTypeColors(block.groupType)
          const icon = getGroupTypeIcon(block.groupType)
          return (
            <div
              key={block.groupId || `raw-${bIdx}`}
              // [GROUPED-VISIBLE-OWNERSHIP] Same dominant container treatment as
              // the rich grouped path so the raw-fallback branch (grouped truth
              // exists upstream but rich hydration incomplete) still visibly
              // wins ownership of the card body instead of looking flat.
              className={`rounded-lg border ${colors.border} ${colors.blockBg} p-2`}
            >
              <div className={`mb-2 flex items-center gap-2 flex-wrap px-2.5 py-1.5 rounded-md ${colors.bg}`}>
                <span className={colors.text}>{icon}</span>
                <span className={`text-sm font-semibold ${colors.text}`}>{block.label}</span>
                <span className="text-[11px] text-[#8A8A8A]">
                  · {block.members.length} {block.members.length === 1 ? 'exercise' : 'exercises'}
                </span>
              </div>
              <div className={`space-y-2 pl-4 border-l-2 ${colors.border}`}>
                {block.members.map((member, mIdx) => {
                  rawIdx++
                  const hydrated =
                    (member.id ? hydrateMap.get(member.id) : undefined) ||
                    (member.name ? hydrateMap.get(member.name) : undefined) ||
                    (member.name ? hydrateMap.get(member.name.toLowerCase()) : undefined) ||
                    (member.name ? hydrateMap.get(normalizeKey(member.name)) : undefined)
                  if (hydrated) {
                    return (
                      <ExerciseRow
                        key={hydrated.id}
                        exercise={hydrated}
                        index={rawIdx}
                        prefix={member.prefix}
                        sessionId={sessionId}
                        isSkipped={skippedExercises.has(hydrated.id)}
                        adjustedName={adjustedExercises.get(hydrated.id)}
                        sessionContext={sessionContextForRows}
                        sessionEvidence={sessionEvidence}
                        coachingExplanation={coachingExplanation}
                        onReplace={onReplace}
                        onSkip={onSkip}
                        onProgressionAdjust={onProgressionAdjust}
                      />
                    )
                  }
                  // Minimal text fallback row. Display-first: name must be
                  // visible even when rich hydration cannot resolve it.
                  const safeName = (member.name || '').trim()
                  if (safeName.length < 2) return null
                  return (
                    <div
                      key={member.id || `${block.groupId}-${mIdx}`}
                      className="flex items-baseline gap-2 py-1.5 text-sm text-[#C8C8C8]"
                    >
                      {member.prefix && (
                        <span className={`text-[11px] font-semibold ${colors.text} shrink-0`}>
                          {member.prefix}
                        </span>
                      )}
                      <span className="truncate">{safeName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ==========================================================================
  // [FLAT-WINNER-LOCKOUT] FLAT RENDER PATH - category-sectioned layout
  //
  // CRITICAL GATE: this path now ONLY fires for true flat sessions
  // (`!hasGroupedTruth`). Previously the gate was just `!useGroupedRender`,
  // which silently swallowed grouped-truth sessions where the rich grouped
  // path could not produce renderable groups AND `rawFallbackBlocks` happened
  // to be 0 (e.g. styledGroups present but all member names blank). Those
  // grouped-intent days were being painted with SKILL / STRENGTH / ACCESSORY
  // / OTHER category headers -- visually indistinguishable from a flat day,
  // which is exactly the "still looks flat" symptom.
  //
  // Now:
  //   - hasGroupedTruth === false  -> this flat category layout (correct)
  //   - hasGroupedTruth === true   -> grouped paths above OR the honest
  //                                   simple-ordered fallback below
  //                                   (never this category layout)
  // ==========================================================================
  if (!useGroupedRender && !hasGroupedTruth) {
    // ==========================================================================
    // [CANONICAL-ORDER-CONTRACT] Flat render path.
    //
    // Previously this branch bucketed exercises by category (skill / strength /
    // accessory / other) and emitted them in that fixed order. That quietly
    // reordered the numbered workout away from canonical session order, so the
    // Program card could show a different sequence than Start Workout. The
    // renderer now walks displayExercises in canonical order and only emits a
    // category header when the category changes between adjacent rows, so the
    // visual "sections" remain but the exercise sequence matches the order the
    // live workout machine consumes.
    // ==========================================================================
    const normalizeCat = (cat?: string): string => {
      if (!cat) return 'other'
      return ['skill', 'strength', 'accessory'].includes(cat) ? cat : 'other'
    }

    let lastCat: string | null = null
    return (
      <div className="space-y-4">
        {displayExercises.map((exercise, idx) => {
          const thisCat = normalizeCat(exercise.category)
          const emitHeader = thisCat !== lastCat
          lastCat = thisCat
          const contract = emitHeader ? getCategoryDisplayContract(thisCat, sessionEvidence) : null
          return (
            <div key={exercise.id} className="space-y-2">
              {emitHeader && contract && (
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
              )}
              <ExerciseRow
                exercise={exercise}
                index={idx + 1}
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
            </div>
          )
        })}
      </div>
    )
  }

  // ==========================================================================
  // [FLAT-WINNER-LOCKOUT] GROUPED-INTENT SIMPLE-ORDER FALLBACK
  //
  // Fires only when `!useGroupedRender && hasGroupedTruth` AND the raw-fallback
  // branch above did not engage (rawFallbackBlocks was empty because all
  // upstream grouped members failed the usable-name filter). In that case we
  // have grouped intent but nothing renderable as a grouped block.
  //
  // Rather than silently fall through to the category-sectioned flat layout
  // (which paints a session as a flat categorized day and hides the fact
  // that grouped truth existed), render a simple ordered list of the actual
  // exercises. This is honest about what we can show: no fake category
  // headers, no fake group headers, just the session's exercises in order.
  // ==========================================================================
  if (!useGroupedRender && hasGroupedTruth) {
    let globalIdx = 0
    return (
      <div className="space-y-2">
        {displayExercises.map((exercise) => {
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
  
  // ==========================================================================
  // GROUPED RENDER PATH - Styled groups with visual structure
  // ==========================================================================
  
  // [UNIFIED-RENDER-OWNERSHIP] Robust render-surface maps so grouped block
  // members always resolve back to a FULL displayExercise row (with sets,
  // reps, RPE, rest, prescribedLoad). When name/id lookups fail due to
  // variant-rename drift, the blockId map below is authoritative.
  // Four lookup tiers on exerciseDataMap: raw id, raw name, lowercased name,
  // normalized name (punctuation/whitespace collapsed -- matches bridge).
  const exerciseDataMap = new Map<string, AdaptiveExercise>()
  const normalizeExerciseKey = (s: string): string =>
    (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
  // blockId -> list of displayExercises with that blockId, in canonical order.
  // This is the authoritative render-surface member list per group and is the
  // preferred lookup for grouped block rendering.
  const blockIdToDisplayExercises = new Map<string, AdaptiveExercise[]>()
  displayExercises.forEach(e => {
    if (e.id) exerciseDataMap.set(e.id, e)
    if (e.name) {
      exerciseDataMap.set(e.name, e)
      const lowered = e.name.toLowerCase()
      if (!exerciseDataMap.has(lowered)) exerciseDataMap.set(lowered, e)
      const norm = normalizeExerciseKey(e.name)
      if (norm && !exerciseDataMap.has(norm)) exerciseDataMap.set(norm, e)
    }
    const bId = (e as unknown as { blockId?: string }).blockId
    if (bId) {
      if (!blockIdToDisplayExercises.has(bId)) blockIdToDisplayExercises.set(bId, [])
      blockIdToDisplayExercises.get(bId)!.push(e)
    }
  })
  
  // ==========================================================================
  // [GROUPED-RENDER-CONTRACT] SINGLE render source. The adapter now owns the
  // full ordered list of render blocks (groups + interleaved standalone
  // exercises) including canonical ordering and the rescue pass for groups
  // whose members failed id/name/blockId matching. The renderer's prior local
  // canonical-walk (displayBlocks / exerciseToGroupIndex / blockIdToGroupIndex
  // / groupedExerciseIds / groupedExerciseNames / processedExerciseIds /
  // processedGroupIndices / rescue append) has been removed entirely. This
  // removes the split display ownership that previously let "grouped branch =
  // yes" coexist with a flat-looking body.
  // ==========================================================================
  const renderBlocks: RenderBlock[] = groupedDisplayModel.renderBlocks

  // [GROUPED-TRUTH-TRACE] Failure-only diagnostic. Now that ownership is
  // unified inside the contract, this should never fire -- keep it as a
  // structural defense so any future regression is loud.
  if (typeof window !== 'undefined') {
    const nonStraightInContract = groupedDisplayModel.nonStraightGroupCount
    const renderedNonStraightBlocks = renderBlocks.filter(
      b => b.type === 'group' && b.group.groupType !== 'straight'
    ).length
    if (nonStraightInContract > 0 && renderedNonStraightBlocks < nonStraightInContract) {
      console.log('[v0] [GROUPED-TRUTH-TRACE] CONTRACT_VIOLATION', {
        sessionDay: session.dayNumber,
        focus: session.focus || session.focusLabel,
        nonStraightInContract,
        renderedNonStraightBlocks,
        sourceUsed: groupedDisplayModel.sourceUsed,
        flatReason: groupedDisplayModel.flatReason,
        displayExerciseCount: displayExercises.length,
      })
    }
  }

  let globalExerciseIndex = 0
  
  return (
    <div className="space-y-4">
      {renderBlocks.map((block, blockIdx) => {
        // [GROUPED-RENDER-CONTRACT] Handle ungrouped exercise -- hydrate the
        // row from exerciseDataMap (pure enrichment; NOT block ownership).
        // If hydration fails, render a minimal fallback so the contract's
        // choice is still honored.
        if (block.type === 'exercise') {
          globalExerciseIndex++
          const fullExercise =
            (block.exerciseId && exerciseDataMap.get(block.exerciseId)) ||
            (block.exerciseName && exerciseDataMap.get(block.exerciseName)) ||
            (block.exerciseName && exerciseDataMap.get(block.exerciseName.toLowerCase())) ||
            (block.exerciseName && exerciseDataMap.get(normalizeExerciseKey(block.exerciseName)))

          if (!fullExercise) {
            const safeName = (block.exerciseName || '').trim()
            if (!safeName || safeName.length < 2) return null
            return (
              <div
                key={block.exerciseId || `ex-${blockIdx}`}
                className="flex items-baseline gap-2 py-2 px-3 rounded-lg border bg-[#171717] border-[#282828] text-sm text-[#C8C8C8]"
              >
                <span className="text-[10px] text-[#4A4A4A] font-mono shrink-0">{globalExerciseIndex}.</span>
                <span className="truncate">{safeName}</span>
              </div>
            )
          }

          return (
            <ExerciseRow
              key={fullExercise.id}
              exercise={fullExercise}
              index={globalExerciseIndex}
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
        }

        // Handle grouped block (contract-owned; renderer does not decide set/order)
        const { group } = block
        const colors = getGroupTypeColors(group.groupType)
        const label = getGroupTypeLabel(group.groupType)
        const icon = getGroupTypeIcon(group.groupType)
        const isSpecialGroup = group.groupType !== 'straight'
        
        return (
          <div
            key={group.id || `group-${blockIdx}`}
            // [GROUPED-VISIBLE-OWNERSHIP] Wrap the entire grouped block (header +
            // members) in a tinted container so grouped structure is the visually
            // dominant unit in the card body. Previously the header was a small
            // pill and members only carried a thin left border, so a 2-row
            // superset inside a 7-row session read as "mostly flat with a colored
            // pill". With a container tint + padding, the group is unmistakably
            // a distinct structural block.
            className={isSpecialGroup ? `rounded-lg border ${colors.border} ${colors.blockBg} p-2` : ''}
          >
            {/* [CLEAN-GROUP-HEADER-RESTORED] Compact but clearly visible header.
                Previous pass made it too quiet (text-xs + opacity-80) which flattened grouped
                truth visually. Restored to text-sm, full opacity, with a subtle tinted background
                pill so grouped blocks are immediately recognizable without debug clutter. */}
            {isSpecialGroup && (
              <div className={`mb-2 flex items-center gap-2 flex-wrap px-2.5 py-1.5 rounded-md ${colors.bg}`}>
                <span className={colors.text}>{icon}</span>
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {(() => {
                    // [UNIFIED-RENDER-OWNERSHIP] Resolve the first member from
                    // the render surface (blockId first, then id/name fallbacks)
                    // so the header category prefix matches what actually renders
                    // inside the block.
                    const firstExercise = group.exercises[0]
                    const renderSurfaceFirst = group.id
                      ? blockIdToDisplayExercises.get(group.id)?.[0]
                      : undefined
                    const fullExercise = renderSurfaceFirst
                      || (firstExercise ? (exerciseDataMap.get(firstExercise.id)
                        || exerciseDataMap.get(firstExercise.name)
                        || exerciseDataMap.get(firstExercise.name.toLowerCase())
                        || exerciseDataMap.get(normalizeExerciseKey(firstExercise.name))) : undefined)
                    const category = fullExercise?.category
                    const purposePrefix = category && category !== 'accessory' 
                      ? `${category.charAt(0).toUpperCase() + category.slice(1)} ` 
                      : category === 'accessory' 
                        ? 'Accessory ' 
                        : ''
                    return `${purposePrefix}${label}`
                  })()}
                </span>
                <span className="text-[11px] text-[#8A8A8A]">
                  · {group.exercises.length} exercises
                </span>
                {group.restProtocol && (
                  <span className="text-[11px] text-[#8A8A8A]">
                    · Rest {group.restProtocol}
                  </span>
                )}
                <MethodInfoBubble 
                  methodType={group.groupType as 'superset' | 'circuit' | 'cluster' | 'density_block'}
                  context={group.exercises[0]?.methodRationale || group.instruction || undefined}
                />
              </div>
            )}
            
            {/* Exercises in this group */}
            <div className={`space-y-2 ${isSpecialGroup ? `pl-4 border-l-2 ${colors.border}` : ''}`}>
              {group.exercises.map((groupExercise, exIdx) => {
                globalExerciseIndex++
                
                // [UNIFIED-RENDER-OWNERSHIP] Prefer the RENDER surface as the
                // authoritative member source. Order of preference:
                //   1. blockId + positional index  (most reliable; survives rename)
                //   2. exact id                     (exact identity match)
                //   3. exact raw name
                //   4. lowercased name
                //   5. normalized name              (handles "Pull-Ups" vs "Pull Ups")
                // When all five miss, we fall through to the minimal-row rescue
                // below so the group header still renders honestly.
                const renderSurfaceMembers = group.id
                  ? blockIdToDisplayExercises.get(group.id)
                  : undefined
                const fullExercise =
                  (renderSurfaceMembers && renderSurfaceMembers[exIdx])
                  || exerciseDataMap.get(groupExercise.id)
                  || exerciseDataMap.get(groupExercise.name)
                  || exerciseDataMap.get(groupExercise.name.toLowerCase())
                  || exerciseDataMap.get(normalizeExerciseKey(groupExercise.name))
                
                if (!fullExercise) {
                  // Exercise in styled groups but not in displayExercises.
                  // [GROUPED-TRUTH-RESCUE] Render a minimal row from styledGroups'
                  // authoritative truth so grouped structure stays visible.
                  // [JUNK-TEXT-GUARD] If the grouped truth has no usable name,
                  // drop the row entirely rather than rendering a lone prefix
                  // (e.g. "A1" with no exercise) or a stray letter fragment.
                  const safeName = (groupExercise.name || '').trim()
                  if (!safeName || safeName.length < 2) {
                    return null
                  }
                  return (
                    <div
                      key={groupExercise.id || `${safeName}-${exIdx}`}
                      className="flex items-baseline gap-2 py-1.5 text-sm text-[#C8C8C8]"
                    >
                      {groupExercise.prefix && (
                        <span className={`text-[11px] font-semibold ${colors.text} shrink-0`}>
                          {groupExercise.prefix}
                        </span>
                      )}
                      <span className="truncate">{safeName}</span>
                    </div>
                  )
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

  // [WARM-UP-ROW-CONTRACT-RESTORED] Warm-up rows previously had their own
  // richer contract: a green identity accent (left border + WARMUP tag) plus
  // the per-row `selectionReason` italic subtitle so each warm-up exercise
  // showed WHY it was prescribed. A recent regression collapsed warm-up rows
  // into a near-silent gray variant of the main row (name + prescription line
  // only), which is what "plain stripped warm-up" refers to. This block
  // restores the prior warm-up row contract without re-introducing main-row
  // surfaces that were intentionally suppressed for warm-up rows (no intent
  // label, no InfoBubble, no knowledge expansion, no action menu).
  const warmupReason = isWarmupCooldown ? (exercise.selectionReason || '').trim() : ''

  return (
    <div className={`py-2 px-3 rounded-lg border transition-colors ${
      isWarmupCooldown
        // [WARM-UP-STYLE-DEMOTED] Keep the richer row contract (identity tag +
        // per-row reason italic) but strip the heavy emerald-washed background
        // and left-accent border. Rows now sit on the same dark container as
        // main rows (`bg-[#151515] border-[#222]`), with green expressed ONLY
        // through the small `Warm-Up` tag -- cleaner, less saturated, closer
        // to the pre-regression look. Structure and contract unchanged.
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
          {isWarmupCooldown ? (
            // [WARM-UP-STYLE-DEMOTED] Warm-up identity tag remains the sole
            // green accent in the row -- small, restrained, not saturated.
            <span className="text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 shrink-0">
              Warm-Up
            </span>
          ) : (
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

      {/* ROW 3a: [WARM-UP-ROW-CONTRACT-RESTORED] Per-row warm-up selectionReason.
          This is the "prior supporting subtitle / intent line behavior" that the
          regression stripped. Main rows have their own whyLine/detailExplanation
          contract below, which remains gated by !isWarmupCooldown.
          [WARM-UP-STYLE-DEMOTED] Uses the same neutral italic treatment as the
          main-row whyLine (`text-[#6A6A6A]`) so warm-up rows no longer feel
          green-washed -- the only green in the row is the small identity tag. */}
      {isWarmupCooldown && warmupReason && (
        <p className="text-[10px] text-[#6A6A6A] italic mt-1">
          {warmupReason}
        </p>
      )}

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
