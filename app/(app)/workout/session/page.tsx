'use client'

/**
 * Workout Session Page
 * 
 * CRITICAL: Uses LAZY dynamic imports for heavy modules to prevent module-level crashes.
 * The route must be able to render even if program-state or other heavy modules fail to load.
 * 
 * [LIVE-SESSION-LOCK] Version stamp for execution proof
 */

// =============================================================================
// AUTHORITATIVE ROUTE VERSION - PROOF OF EXECUTION
// =============================================================================
const WORKOUT_SESSION_ROUTE_VERSION = 'phase_x_plus_1_authority_corridor_v2'

import { useState, useEffect, Suspense, Component, type ReactNode, type ErrorInfo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StreamlinedWorkoutSession } from '@/components/workout/StreamlinedWorkoutSession'
import { type AdaptiveSession } from '@/lib/adaptive-program-builder'
// [PHASE-X+1] Program state is loaded internally by loadAuthoritativeSession
import { 
  buildWorkoutReasoningDisplayContract, 
  getReasoningShapeDiagnostic,
  type WorkoutReasoningDisplayContract,
} from '@/lib/workout-reasoning-display-contract'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Dumbbell, AlertTriangle } from 'lucide-react'
// [PHASE-X] Kept for potential local use - main loading is via authoritative loader
import { getSessionDiagnostic } from '@/lib/workout/validate-session'
// [PHASE-X+1] Authoritative session loader - SINGLE ENTRY POINT
import { 
  loadAuthoritativeSession, 
  calculateSessionIndex,
  type SessionMeta,
  type AuthoritativeSessionResult,
} from '@/lib/workout/load-authoritative-session'

// =============================================================================
// LOCAL ERROR BOUNDARY - Catches workout engine crashes locally
// =============================================================================

interface WorkoutErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class WorkoutErrorBoundary extends Component<{ children: ReactNode }, WorkoutErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): WorkoutErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // [LIVE-SESSION-LOCK] Comprehensive diagnostic logging with stage identification
    // [LIVE-SESSION-FIX] Enhanced crash corridor detection including reference errors
    const errorMsg = error.message || ''
    const crashCorridor = errorMsg.includes('is not defined') 
      ? 'reference_error_missing_import'
      : errorMsg.includes('toLowerCase') || errorMsg.includes('toUpperCase')
        ? 'unsafe_string_operation' 
        : errorMsg.includes('undefined') || errorMsg.includes('null')
          ? 'null_reference'
          : errorMsg.includes('map') || errorMsg.includes('filter') || errorMsg.includes('reduce')
            ? 'array_operation'
            : errorMsg.includes('split') || errorMsg.includes('charAt')
              ? 'string_method_crash'
              : error.name === 'ReferenceError'
                ? 'reference_error'
                : 'unknown'
    
    // Extract likely stage from stack trace
    const stackLines = error.stack?.split('\n') || []
    // [PHASE-X] Added normalizeWorkoutSession and getLatestAdaptiveProgram to tracked stages
    const likelyStage = stackLines.find(line => 
      line.includes('normalizeWorkoutSession') ||
      line.includes('normalizeSession') || 
      line.includes('loadSessionFromStorage') ||
      line.includes('buildSessionRuntimeTruth') ||
      line.includes('buildExerciseRuntimeTruth') ||
      line.includes('getExerciseSelectionInsight') ||
      line.includes('safeWorkoutSessionContract') ||
      line.includes('safeCurrentExercise') ||
      line.includes('getLatestAdaptiveProgram') ||
      line.includes('PostWorkoutSummary') ||
      line.includes('nextSession')
    )?.match(/at\s+(\w+)/)?.[1] || 'render_unknown'
    
    // Get last known stage from window if available
    const lastKnownStage = typeof window !== 'undefined' 
      ? (window as unknown as { __spartanlabWorkoutStage?: string }).__spartanlabWorkoutStage || 'unknown'
      : 'ssr'
    
    // Get session context if available in sessionStorage
    let sessionContext: { 
      sessionId: string
      dayLabel: string
      dayNumber: number
      isDemo: boolean
      exerciseCount?: number
      currentExerciseIndex?: number
    } = { sessionId: 'unknown', dayLabel: 'unknown', dayNumber: 0, isDemo: false }
    try {
      if (typeof sessionStorage !== 'undefined') {
        const ctx = sessionStorage.getItem('spartanlab_workout_stage_context')
        if (ctx) sessionContext = JSON.parse(ctx)
      }
    } catch {}
    
    // [LIVE-SESSION-FIX] Get current URL search params for additional context
    let urlParams = 'unknown'
    try {
      if (typeof window !== 'undefined') {
        urlParams = window.location.search || 'none'
      }
    } catch {}
    
    // [LIVE-SESSION-FIX] Enhanced crash logging with full context and session fingerprint
    console.error('[workout-route-crash] BOUNDARY_TRIGGERED', {
      routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
      lastKnownStage,
      inferredStage: likelyStage,
      crashCorridor,
      urlParams,
      sessionFingerprint: {
        sessionId: sessionContext.sessionId,
        dayLabel: sessionContext.dayLabel,
        dayNumber: sessionContext.dayNumber,
        exerciseCount: sessionContext.exerciseCount || 'unknown',
        currentExerciseIndex: sessionContext.currentExerciseIndex ?? 'unknown',
      },
      isDemo: sessionContext.isDemo,
      errorName: error.name,
      errorMessage: error.message,
      stack: stackLines.slice(0, 8).join('\n'),
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'),
      timestamp: new Date().toISOString(),
    })
    
    // Log helpful debugging summary
    console.error('[workout-route-crash] QUICK DIAGNOSIS:', {
      cause: crashCorridor,
      failedAt: likelyStage || 'unknown',
      hint: crashCorridor === 'reference_error_missing_import' || crashCorridor === 'reference_error'
        ? 'A function or variable is used but not defined/imported'
        : crashCorridor === 'unsafe_string_operation' 
          ? 'A string method (toLowerCase/toUpperCase) was called on undefined'
          : crashCorridor === 'null_reference'
            ? 'A property was accessed on null/undefined'
            : crashCorridor === 'array_operation'
              ? 'An array method (map/filter/reduce) was called on non-array'
              : 'Unknown crash type - check stack trace',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Workout Session Issue</h2>
            <p className="text-[#A4ACB8] mb-6">
              Something went wrong loading your workout. Please try again or start fresh.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
              >
                Try Again
              </Button>
              <Link href="/workout/session?demo=true" className="block">
                <Button variant="outline" className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26] gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Try Demo Workout
                </Button>
              </Link>
              <Link href="/dashboard" className="block">
                <Button variant="ghost" className="w-full text-[#6B7280] hover:text-[#A4ACB8]">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// =============================================================================
// SESSION NORMALIZER - Ensures all sessions have valid, safe structure
// =============================================================================

function normalizeSession(rawSession: AdaptiveSession | null | undefined): AdaptiveSession | null {
  if (!rawSession) return null
  
  // [LIVE-WORKOUT-CRASH-FIX] Log normalization for debugging
  console.log('[workout-normalization] Starting session normalization:', {
    dayLabel: rawSession.dayLabel,
    exerciseCount: rawSession.exercises?.length ?? 0,
  })
  
  // [prescription-render] ISSUE E: Preserve prescribedLoad through normalization
  // Normalize exercises array while keeping all original fields
  const normalizedExercises = (rawSession.exercises ?? []).map((ex, idx) => {
    // [LIVE-WORKOUT-CRASH-FIX] Skip null/undefined exercise entries
    if (!ex) {
      console.warn('[workout-normalization] Skipping null exercise at index', idx)
      return null
    }
    
    const normalized = {
      // [LIVE-WORKOUT-CRASH-FIX] CRITICAL: Ensure id and name are ALWAYS strings, never undefined
      id: typeof ex?.id === 'string' && ex.id ? ex.id : `exercise-${idx}`,
      name: typeof ex?.name === 'string' && ex.name ? ex.name : 'Unknown Exercise',
      category: typeof ex?.category === 'string' ? ex.category : 'general',
      sets: typeof ex?.sets === 'number' && ex.sets > 0 ? ex.sets : 3,
      repsOrTime: typeof ex?.repsOrTime === 'string' && ex.repsOrTime ? ex.repsOrTime : '8-12 reps',
      note: typeof ex?.note === 'string' ? ex.note : '',
      isOverrideable: ex?.isOverrideable ?? true,
      selectionReason: typeof ex?.selectionReason === 'string' ? ex.selectionReason : '',
      // [prescription-render] TASK 2: Preserve prescribedLoad through snapshot/read path
      prescribedLoad: ex?.prescribedLoad,
      // [weighted-prescription-truth] ISSUE E: Preserve targetRPE and restSeconds
      targetRPE: ex?.targetRPE,
      restSeconds: ex?.restSeconds,
      // Preserve other optional fields that might exist
      method: ex?.method,
      methodLabel: ex?.methodLabel,
      blockId: ex?.blockId,
      wasAdapted: ex?.wasAdapted,
      source: ex?.source,
      progressionDecision: ex?.progressionDecision,
      // [coach-meta-survival] TASK 5: Preserve coachingMeta through workout normalization
      coachingMeta: ex?.coachingMeta,
      // [LIVE-WORKOUT-CRASH-FIX] Preserve executionTruth for band recommendations
      executionTruth: ex?.executionTruth,
    }
    
    // [prescription-render] TASK 6: Log if prescribedLoad exists
    if (normalized.prescribedLoad && normalized.prescribedLoad.load > 0) {
      console.log('[prescription-render] Preserved prescribedLoad in normalization:', {
        exerciseName: normalized.name,
        load: normalized.prescribedLoad.load,
        unit: normalized.prescribedLoad.unit,
        confidence: normalized.prescribedLoad.confidenceLevel,
      })
    }
    
    // [coach-meta-survival] Log coaching meta survival
    if (normalized.coachingMeta) {
      console.log('[coach-meta-survival] Preserved coachingMeta in workout normalization:', {
        exerciseName: normalized.name,
        expressionMode: normalized.coachingMeta.expressionMode,
        loadDecision: normalized.coachingMeta.loadDecisionSummary,
      })
    }
    
    return normalized
  }).filter((ex): ex is NonNullable<typeof ex> => ex !== null)
  
  // [LIVE-WORKOUT-CRASH-FIX] Log final exercise count after filtering
  console.log('[workout-normalization] Normalization complete:', {
    inputExercises: rawSession.exercises?.length ?? 0,
    outputExercises: normalizedExercises.length,
  })
  
  return {
    ...rawSession,
    dayNumber: typeof rawSession.dayNumber === 'number' ? rawSession.dayNumber : 1,
    dayLabel: typeof rawSession.dayLabel === 'string' && rawSession.dayLabel ? rawSession.dayLabel : 'Workout',
    focus: typeof rawSession.focus === 'string' ? rawSession.focus : 'general',
    focusLabel: typeof rawSession.focusLabel === 'string' ? rawSession.focusLabel : 'Training',
    rationale: typeof rawSession.rationale === 'string' ? rawSession.rationale : '',
    exercises: normalizedExercises,
    warmup: rawSession.warmup ?? [],
    cooldown: rawSession.cooldown ?? [],
    estimatedMinutes: typeof rawSession.estimatedMinutes === 'number' ? rawSession.estimatedMinutes : 45,
    isPrimary: rawSession.isPrimary ?? true,
    finisherIncluded: rawSession.finisherIncluded ?? false,
  }
}

// =============================================================================
// SESSION VALIDATION - EXECUTION-SAFE CONTRACT VERIFICATION
// =============================================================================

interface SessionValidationResult {
  isValid: boolean
  reasons: string[]
  safeExerciseCount: number
  droppedExerciseIndexes: number[]
  fieldCoercions: string[]
}

function validateNormalizedWorkoutSession(session: AdaptiveSession | null): SessionValidationResult {
  const reasons: string[] = []
  const droppedExerciseIndexes: number[] = []
  const fieldCoercions: string[] = []
  
  if (!session) {
    return { isValid: false, reasons: ['session_null'], safeExerciseCount: 0, droppedExerciseIndexes: [], fieldCoercions: [] }
  }
  
  if (!Array.isArray(session.exercises)) {
    return { isValid: false, reasons: ['exercises_not_array'], safeExerciseCount: 0, droppedExerciseIndexes: [], fieldCoercions: [] }
  }
  
  // Validate each exercise
  let validCount = 0
  session.exercises.forEach((ex, idx) => {
    if (!ex) {
      reasons.push(`exercise_${idx}_null`)
      droppedExerciseIndexes.push(idx)
      return
    }
    if (typeof ex.name !== 'string' || ex.name.trim() === '' || ex.name === 'Unknown Exercise') {
      reasons.push(`exercise_${idx}_invalid_name`)
    }
    if (typeof ex.sets !== 'number' || ex.sets <= 0) {
      reasons.push(`exercise_${idx}_invalid_sets`)
    }
    if (typeof ex.repsOrTime !== 'string' || ex.repsOrTime.trim() === '') {
      reasons.push(`exercise_${idx}_invalid_repsOrTime`)
    }
    // Count as valid if has usable name and sets
    if (typeof ex.name === 'string' && ex.name.trim() !== '' && typeof ex.sets === 'number' && ex.sets > 0) {
      validCount++
    }
  })
  
  // Session is valid if it has at least 1 valid exercise
  const isValid = validCount > 0
  
  if (!isValid && reasons.length === 0) {
    reasons.push('no_valid_exercises')
  }
  
  return {
    isValid,
    reasons,
    safeExerciseCount: validCount,
    droppedExerciseIndexes,
    fieldCoercions,
  }
}

function isRunnableSession(session: AdaptiveSession | null): boolean {
  const validation = validateNormalizedWorkoutSession(session)
  return validation.isValid
}

// =============================================================================
// DEMO SESSION
// =============================================================================

// Demo session for testing when no program exists
// CRITICAL: This must be a complete AdaptiveSession shape to avoid downstream errors
// IMPORTANT: dayLabel uses 'DEMO-' prefix to ensure unique storage key and prevent collisions
const DEMO_SESSION: AdaptiveSession = {
  dayNumber: 0, // Use 0 to indicate demo mode
  dayLabel: 'DEMO-Workout', // DEMO- prefix ensures unique sessionId in StreamlinedWorkoutSession
  focus: 'skill',
  focusLabel: 'Skill Focus',
  isPrimary: true,
  rationale: 'Demo session - experience the SpartanLab workout interface',
  exercises: [
    {
      id: 'demo-ex-1',
      name: 'Front Lever Progression',
      category: 'skill',
      sets: 4,
      repsOrTime: '8 seconds',
      note: 'Use band assistance as needed. Focus on body tension.',
      isOverrideable: false,
      selectionReason: 'Demo exercise - core skill work',
    },
    {
      id: 'demo-ex-2',
      name: 'Weighted Pull-Ups',
      category: 'pull',
      sets: 4,
      repsOrTime: '5-8 reps',
      note: 'Control the eccentric. Full range of motion.',
      isOverrideable: false,
      selectionReason: 'Demo exercise - pulling strength',
      // [prescription-render] Demo prescribed load to show feature
      prescribedLoad: {
        load: 25,
        unit: 'lbs' as const,
        basis: 'estimated' as const,
        confidenceLevel: 'moderate' as const,
        targetReps: 6,
        intensityBand: 'strength' as const,
      },
    },
    {
      id: 'demo-ex-3',
      name: 'Planche Lean',
      category: 'skill',
      sets: 3,
      repsOrTime: '15 seconds',
      note: 'Protract shoulders and lean forward gradually.',
      isOverrideable: false,
      selectionReason: 'Demo exercise - planche foundation',
    },
    {
      id: 'demo-ex-4',
      name: 'Weighted Dips',
      category: 'push',
      sets: 3,
      repsOrTime: '6-10 reps',
      note: 'Keep elbows tucked. Full lockout at top.',
      isOverrideable: false,
      selectionReason: 'Demo exercise - pushing strength',
      // [prescription-render] Demo prescribed load for dips
      prescribedLoad: {
        load: 35,
        unit: 'lbs' as const,
        basis: 'current_benchmark' as const,
        confidenceLevel: 'high' as const,
        targetReps: 8,
        intensityBand: 'strength' as const,
      },
    },
  ],
  warmup: [],
  cooldown: [],
  estimatedMinutes: 35,
  finisherIncluded: false,
}

function WorkoutSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayParam = searchParams.get('day')
  const demoMode = searchParams.get('demo') === 'true'
  const isFirstSession = searchParams.get('first') === 'true'
  
  const [session, setSession] = useState<AdaptiveSession | null>(null)
  // [PHASE-X+1] Session metadata for tracking source and recovery status
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null)
  // [DISPLAY-CONTRACT] Use safe display contract instead of raw reasoning
  const [reasoningSummary, setReasoningSummary] = useState<WorkoutReasoningDisplayContract | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  // [PHASE-X+1] Error state removed - authoritative loader handles all errors internally
  
  useEffect(() => {
    let mounted = true
    
    async function initializeSession() {
      // =======================================================================
      // [PHASE-X+1] AUTHORITATIVE SESSION LOADING
      // =======================================================================
      // This uses the SINGLE ENTRY POINT for session loading.
      // The loadAuthoritativeSession function GUARANTEES:
      // 1. NEVER returns null - always returns valid session
      // 2. NEVER throws - all errors caught and recovered
      // 3. Full diagnostic logging at every stage
      // =======================================================================
      
      console.log('[PHASE-X+1] SESSION_LOAD_INIT', {
        routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
        demoMode,
        isFirstSession,
        dayParam,
        timestamp: new Date().toISOString(),
      })
      
      // Calculate session index (only needed for non-demo mode, but we need a default)
      // For demo mode, this is ignored. For real mode, we calculate based on params.
      let sessionIndex = 0
      if (!demoMode) {
        // Get total session count (we'll get actual count from loader, use 6 as safe default)
        const estimatedSessions = 6
        sessionIndex = calculateSessionIndex(dayParam, isFirstSession, estimatedSessions)
      }
      
      // Load session using AUTHORITATIVE LOADER
      // This function NEVER throws and NEVER returns null
      const result: AuthoritativeSessionResult = await loadAuthoritativeSession(sessionIndex, {
        isDemo: demoMode,
        isFirstSession,
      })
      
      if (!mounted) return
      
      // Log the result
      console.log('[PHASE-X+1] SESSION_LOAD_COMPLETE', {
        routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
        source: result.meta.source,
        validationPassed: result.meta.validationPassed,
        recovered: result.meta.recovered,
        fallbackReason: result.meta.fallbackReason,
        dayLabel: result.session.dayLabel,
        exerciseCount: result.session.exercises.length,
      })
      
      // Set session and meta - GUARANTEED to have valid session
      setSession(result.session)
      setSessionMeta(result.meta)
      
      // [workout-init] Log normalized session data for debugging
      console.log('[workout-init] session ready:', {
        dayLabel: result.session.dayLabel,
        exerciseCount: result.session.exercises.length,
        setCountPerExercise: result.session.exercises.map(ex => ({ name: ex.name, sets: ex.sets })),
        totalSets: result.session.exercises.reduce((sum, ex) => sum + ex.sets, 0),
        source: result.meta.source,
      })
      
      // [prescription-render] Log prescription data
      const exercisesWithLoads = result.session.exercises.filter(
        (ex: { prescribedLoad?: { load: number } }) => ex.prescribedLoad && ex.prescribedLoad.load > 0
      )
      if (exercisesWithLoads.length > 0) {
        console.log('[prescription-render] Exercises with prescribedLoad:', {
          count: exercisesWithLoads.length,
          exercises: exercisesWithLoads.map((ex: { name: string; prescribedLoad?: { load: number; unit: string; confidenceLevel: string } }) => ({
            name: ex.name,
            load: ex.prescribedLoad?.load,
            unit: ex.prescribedLoad?.unit,
            confidence: ex.prescribedLoad?.confidenceLevel,
          })),
        })
      }
      
      // [DISPLAY-CONTRACT] Extract and normalize workout reasoning
      if (result.reasoningSummary) {
        try {
          const shapeDiag = getReasoningShapeDiagnostic(result.reasoningSummary)
          console.log('[reasoning-shape-diagnostic]', {
            routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
            ...shapeDiag,
          })
          
          const safeContract = buildWorkoutReasoningDisplayContract(result.reasoningSummary)
          if (safeContract) {
            console.log('[reasoning-contract] normalized', {
              status: 'normalized',
              hasWhyThisWorkout: !!safeContract.whyThisWorkout,
              hasPrimaryLimiter: !!safeContract.primaryLimiter?.label,
            })
            setReasoningSummary(safeContract)
          }
        } catch {
          console.log('[reasoning-contract] error during normalization - continuing without reasoning')
        }
      }
      
      setLoading(false)
    }
    
    initializeSession()
    
    return () => {
      mounted = false
    }
  }, [dayParam, demoMode, isFirstSession])
  
  // [freshness-sync] TASK 3: Listen for snapshot replacement events
  // If a new program replaces the old one, we should NOT be showing stale session data
  useEffect(() => {
    if (demoMode) return // Demo mode doesn't care about freshness
    
    const handleSnapshotReplaced = () => {
      console.log('[surface-drift] Workout session received snapshot-replaced event - session may be stale')
      // Don't auto-reload during active workout to avoid losing progress
      // Just log the drift - user will see fresh data on next visit
    }
    
    window.addEventListener('spartanlab:snapshot-replaced', handleSnapshotReplaced)
    
    return () => {
      window.removeEventListener('spartanlab:snapshot-replaced', handleSnapshotReplaced)
    }
  }, [demoMode])
  
  const handleComplete = () => {
    router.push('/dashboard?workout=completed')
  }
  
  // Deterministic exit routing - never use router.back() for critical paths
  const handleCancel = () => {
    if (isFirstSession) {
      // Coming from first-session flow - return there
      router.push('/first-session')
    } else if (demoMode) {
      // Demo mode - go to dashboard
      router.push('/dashboard')
    } else {
      // Normal workout - go to dashboard
      router.push('/dashboard')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-[#C1121F] mx-auto mb-4" />
          <p className="text-[#A4ACB8]">Loading workout...</p>
        </div>
      </div>
    )
  }
  
  // [PHASE-X+1] With authoritative loader, session should ALWAYS exist
  // Only show error UI for genuine edge cases (e.g., loader promise rejected before mount)
  if (!session) {
    console.warn('[PHASE-X+1] Session is null after loading - this should not happen with authoritative loader')
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-[#C1121F]" />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Ready to Train?</h2>
          <p className="text-[#A4ACB8] mb-6">
            Create a personalized program to unlock your workouts, or try a demo session to explore SpartanLab.
          </p>
          <div className="space-y-3">
            <Link href="/onboarding" className="block">
              <Button className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2">
                Create Your Program
              </Button>
            </Link>
            <Link href="/workout/session?demo=true" className="block">
              <Button variant="outline" className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26] gap-2">
                <Dumbbell className="w-4 h-4" />
                Try Demo Workout
              </Button>
            </Link>
            <Link href="/dashboard" className="block">
              <Button variant="ghost" className="w-full text-[#6B7280] hover:text-[#A4ACB8]">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // [PHASE-X+1] Log session meta for debugging (visible in console only)
  if (sessionMeta && process.env.NODE_ENV === 'development') {
    console.log('[PHASE-X+1] Session meta:', sessionMeta)
  }
  
  return (
    <WorkoutErrorBoundary>
      <StreamlinedWorkoutSession
        session={session}
        reasoningSummary={reasoningSummary}
        onComplete={handleComplete}
        onCancel={handleCancel}
        isDemo={demoMode}
        isFirstSession={isFirstSession}
      />
      {/* [PHASE-X+1] Dev badge for session source - only in development */}
      {process.env.NODE_ENV === 'development' && sessionMeta?.recovered && (
        <div className="fixed bottom-4 left-4 bg-amber-500/20 border border-amber-500/50 rounded px-2 py-1 text-xs text-amber-400">
          Session recovered: {sessionMeta.fallbackReason || 'fallback'}
        </div>
      )}
    </WorkoutErrorBoundary>
  )
}

export default function WorkoutSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-[#C1121F]" />
      </div>
    }>
      <WorkoutSessionContent />
    </Suspense>
  )
}
