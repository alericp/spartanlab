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
const WORKOUT_SESSION_ROUTE_VERSION = 'phase_x_session_contract_v1'

import { useState, useEffect, Suspense, Component, type ReactNode, type ErrorInfo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StreamlinedWorkoutSession } from '@/components/workout/StreamlinedWorkoutSession'
import { type AdaptiveSession } from '@/lib/adaptive-program-builder'
// REMOVED: import { getProgramState } from '@/lib/program-state' - now lazily imported
import type { WorkoutReasoningSummary } from '@/lib/readiness/canonical-readiness-engine'
import { 
  buildWorkoutReasoningDisplayContract, 
  getReasoningShapeDiagnostic,
  type WorkoutReasoningDisplayContract,
} from '@/lib/workout-reasoning-display-contract'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Dumbbell, AlertTriangle } from 'lucide-react'
// [PHASE-X] Authoritative session contract and normalizer
import { 
  normalizeWorkoutSession, 
  normalizeAndValidateSession,
  createFallbackSession,
} from '@/lib/workout/normalize-workout-session'
import { getSessionDiagnostic } from '@/lib/workout/validate-session'
import type { WorkoutSessionContract } from '@/lib/contracts/workout-session-contract'

// =============================================================================
// LAZY PROGRAM STATE RESOLVER - Never throws, always returns a safe result
// =============================================================================

interface LazyProgramStateResult {
  hasUsableProgram: boolean
  adaptiveProgram: { sessions: AdaptiveSession[]; workoutReasoningSummary?: WorkoutReasoningSummary } | null
}

async function resolveProgramStateLazily(): Promise<LazyProgramStateResult> {
  try {
    // Dynamic import to avoid module-level evaluation crashes
    const { getProgramState } = await import('@/lib/program-state')
    const programState = getProgramState()
    return {
      hasUsableProgram: programState.hasUsableWorkoutProgram === true,
      adaptiveProgram: programState.adaptiveProgram,
    }
  } catch (error) {
    console.error('[workout/session] Failed to resolve program state:', error)
    return {
      hasUsableProgram: false,
      adaptiveProgram: null,
    }
  }
}

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
    const crashCorridor = error.message.includes('toLowerCase') || error.message.includes('toUpperCase')
      ? 'unsafe_string_operation' 
      : error.message.includes('undefined') || error.message.includes('null')
        ? 'null_reference'
        : error.message.includes('map') || error.message.includes('filter') || error.message.includes('reduce')
          ? 'array_operation'
          : error.message.includes('split') || error.message.includes('charAt')
            ? 'string_method_crash'
            : 'unknown'
    
    // Extract likely stage from stack trace
    const stackLines = error.stack?.split('\n') || []
    // [PHASE-X] Added normalizeWorkoutSession to tracked stages
    const likelyStage = stackLines.find(line => 
      line.includes('normalizeWorkoutSession') ||
      line.includes('normalizeSession') || 
      line.includes('loadSessionFromStorage') ||
      line.includes('buildSessionRuntimeTruth') ||
      line.includes('buildExerciseRuntimeTruth') ||
      line.includes('getExerciseSelectionInsight') ||
      line.includes('safeWorkoutSessionContract') ||
      line.includes('safeCurrentExercise')
    )?.match(/at\s+(\w+)/)?.[1] || 'render_unknown'
    
    // Get last known stage from window if available
    const lastKnownStage = typeof window !== 'undefined' 
      ? (window as unknown as { __spartanlabWorkoutStage?: string }).__spartanlabWorkoutStage || 'unknown'
      : 'ssr'
    
    // Get session context if available in sessionStorage
    let sessionContext = { sessionId: 'unknown', dayLabel: 'unknown', dayNumber: 0, isDemo: false }
    try {
      if (typeof sessionStorage !== 'undefined') {
        const ctx = sessionStorage.getItem('spartanlab_workout_stage_context')
        if (ctx) sessionContext = JSON.parse(ctx)
      }
    } catch {}
    
    // [LIVE-SESSION-FIX] Enhanced crash logging with full context
    console.error('[workout-route-crash] BOUNDARY_TRIGGERED', {
      routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
      lastKnownStage,
      inferredStage: likelyStage,
      crashCorridor,
      sessionId: sessionContext.sessionId,
      dayLabel: sessionContext.dayLabel,
      dayNumber: sessionContext.dayNumber,
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
      hint: crashCorridor === 'unsafe_string_operation' 
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
  // [DISPLAY-CONTRACT] Use safe display contract instead of raw reasoning
  const [reasoningSummary, setReasoningSummary] = useState<WorkoutReasoningDisplayContract | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let mounted = true
    
    async function initializeSession() {
      try {
        // [LIVE-SESSION-LOCK] Route execution proof with version stamp
        console.log('[workout-route-proof]', {
          routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
          stage: 'route_init',
          demoMode,
          isFirstSession,
          dayParam,
          timestamp: new Date().toISOString(),
        })
        
        // DEMO MODE: Always allow, completely isolated from program state
        // Demo must work regardless of any other conditions
        // CRITICAL: Demo does NOT call resolveProgramStateLazily() - fully isolated
        if (demoMode) {
          console.log('[PHASE-X] Initializing demo mode', {
            routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
            stage: 'demo_init',
          })
          try {
            const normalizedDemo = normalizeSession(DEMO_SESSION)
            if (mounted) {
              if (normalizedDemo && isRunnableSession(normalizedDemo)) {
                console.log('[PHASE-X] Demo session normalized successfully')
                setSession(normalizedDemo)
              } else {
                console.log('[PHASE-X] Demo session using raw DEMO_SESSION')
                setSession(DEMO_SESSION)
              }
              setLoading(false)
            }
          } catch (demoError) {
            console.warn('[PHASE-X] Demo normalization failed, using raw:', demoError)
            if (mounted) {
              setSession(DEMO_SESSION)
              setLoading(false)
            }
          }
          return
        }
        
        console.log('[workout/session] safe route loaded - initializing real workout mode')
        
        // LAZY import and resolve program state
        const { hasUsableProgram, adaptiveProgram } = await resolveProgramStateLazily()
        console.log('[workout/session] program state resolved', { hasUsableProgram, hasAdaptiveProgram: !!adaptiveProgram })
        
        if (!mounted) return
        
        if (!hasUsableProgram || !adaptiveProgram) {
          setError('No active program found. Please create a program first.')
          setLoading(false)
          return
        }
        
        // Validate sessions array exists and has content
        if (!Array.isArray(adaptiveProgram.sessions) || adaptiveProgram.sessions.length === 0) {
          setError('No workout sessions available. Please create a program first.')
          setLoading(false)
          return
        }
        
        // Find the session for the requested day (or today)
        // Sessions array contains all workout days, ordered by dayNumber
        // If coming from first-session flow, always use day 1 (index 0)
        let sessionIndex: number
        if (isFirstSession || dayParam === '1') {
          sessionIndex = 0
        } else if (dayParam) {
          // dayParam is 1-indexed, convert to 0-indexed
          const parsed = parseInt(dayParam, 10)
          sessionIndex = isNaN(parsed) ? 0 : Math.max(0, parsed - 1)
        } else {
          const today = new Date().getDay() // 0=Sunday through 6=Saturday
          sessionIndex = Math.min(today === 0 ? 6 : today - 1, adaptiveProgram.sessions.length - 1)
        }
        
        // Clamp session index to valid range
        sessionIndex = Math.max(0, Math.min(sessionIndex, adaptiveProgram.sessions.length - 1))
        
        const rawSession = adaptiveProgram.sessions[sessionIndex] || adaptiveProgram.sessions[0]
        
        if (!rawSession) {
          setError('No workout scheduled for this day.')
          setLoading(false)
          return
        }
        
        // [PHASE-X] Enhanced session normalization with contract validation
        // Step 1: Log raw session diagnostic before any normalization
        const rawDiagnostic = getSessionDiagnostic(rawSession)
        console.log('[PHASE-X] Raw session diagnostic:', {
          routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
          stage: 'pre_normalization',
          sessionIndex,
          ...rawDiagnostic,
        })
        
        // Step 2: Normalize session using local normalizer (preserves AdaptiveSession type)
        let normalizedSession = null
        try {
          normalizedSession = normalizeSession(rawSession)
        } catch (normError) {
          console.error('[PHASE-X] Local normalization failed:', normError)
          
          // Step 2b: Fallback to contract-based normalizer
          try {
            const contractResult = normalizeAndValidateSession(rawSession)
            if (contractResult.session && contractResult.validation.isValid) {
              console.log('[PHASE-X] Contract-based fallback normalization succeeded')
              // Cast to AdaptiveSession since the shapes are compatible
              normalizedSession = contractResult.session as unknown as AdaptiveSession
            }
          } catch (contractError) {
            console.error('[PHASE-X] Contract normalization also failed:', contractError)
          }
          
          if (!normalizedSession) {
            setError('This workout session could not be loaded.')
            setLoading(false)
            return
          }
        }
        
        // [PHASE-X] Validate normalized session with detailed diagnostics
        const validation = validateNormalizedWorkoutSession(normalizedSession)
        if (!validation.isValid) {
          console.error('[PHASE-X] session_validate_failed', { 
            routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
            stage: 'session_validate',
            hasNormalized: !!normalizedSession, 
            validationResult: validation,
            dayLabel: normalizedSession?.dayLabel,
            exerciseCount: normalizedSession?.exercises?.length ?? 0,
          })
          
          // [PHASE-X] Last resort: Create fallback session instead of showing error
          console.warn('[PHASE-X] Attempting fallback session creation')
          const fallbackSession = createFallbackSession('validation_failed')
          if (fallbackSession) {
            console.log('[PHASE-X] Using fallback session - workout will have limited exercises')
            setSession(fallbackSession as unknown as AdaptiveSession)
            setLoading(false)
            return
          }
          
          setError('This workout session is not properly configured.')
          setLoading(false)
          return
        }
        
        console.log('[PHASE-X] session_validated', {
          routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
          stage: 'session_validate_success',
          safeExerciseCount: validation.safeExerciseCount,
          dayLabel: normalizedSession.dayLabel,
          dayNumber: normalizedSession.dayNumber,
          verdict: 'SESSION_RUNTIME_CONTRACT_VALID',
        })
        
        // [workout-init] Log normalized session data for debugging set progression
        console.log('[workout-init] session normalized successfully:', {
          dayLabel: normalizedSession.dayLabel,
          exerciseCount: normalizedSession.exercises.length,
          setCountPerExercise: normalizedSession.exercises.map(ex => ({ name: ex.name, sets: ex.sets })),
          totalSets: normalizedSession.exercises.reduce((sum, ex) => sum + ex.sets, 0),
        })
        
        // [prescription-render] TASK 6: Log prescription data reaching UI
        const exercisesWithLoads = normalizedSession.exercises.filter(
          (ex: { prescribedLoad?: { load: number } }) => ex.prescribedLoad && ex.prescribedLoad.load > 0
        )
        console.log('[prescription-render] Exercises with prescribedLoad reaching UI:', {
          count: exercisesWithLoads.length,
          exercises: exercisesWithLoads.map((ex: { name: string; prescribedLoad?: { load: number; unit: string; confidenceLevel: string } }) => ({
            name: ex.name,
            load: ex.prescribedLoad?.load,
            unit: ex.prescribedLoad?.unit,
            confidence: ex.prescribedLoad?.confidenceLevel,
          })),
        })
        
        setSession(normalizedSession)
        
        // [DISPLAY-CONTRACT] Extract and normalize workout reasoning with safe contract
        // This guarantees all nested fields used by WhyThisWorkout have safe defaults
        try {
          const rawReasoning = adaptiveProgram.workoutReasoningSummary
          
          // Log shape diagnostic BEFORE normalization for debugging
          const shapeDiag = getReasoningShapeDiagnostic(rawReasoning)
          console.log('[reasoning-shape-diagnostic]', {
            routeVersion: WORKOUT_SESSION_ROUTE_VERSION,
            ...shapeDiag,
          })
          
          if (rawReasoning) {
            const safeContract = buildWorkoutReasoningDisplayContract(rawReasoning)
            if (safeContract) {
              console.log('[reasoning-contract] normalized', {
                status: 'normalized',
                hasWhyThisWorkout: !!safeContract.whyThisWorkout,
                hasPrimaryLimiter: !!safeContract.primaryLimiter?.label,
              })
              setReasoningSummary(safeContract)
            } else {
              console.log('[reasoning-contract] malformed_fallback - contract returned null')
            }
          } else {
            console.log('[reasoning-contract] absent - no reasoning summary in program')
          }
        } catch {
          // Reasoning summary is optional, don't fail if it can't be read
          console.log('[reasoning-contract] error during normalization - continuing without reasoning')
        }
        setLoading(false)
      } catch (e) {
        // Catch-all: if anything unexpected happens, show a safe error
        console.error('[workout/session] Unexpected error during initialization:', e)
        if (mounted) {
          setError('An unexpected error occurred. Please try again.')
          setLoading(false)
        }
      }
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
  
  if (error || !session) {
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
