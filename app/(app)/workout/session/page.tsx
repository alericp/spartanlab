'use client'

/**
 * Workout Session Page
 * 
 * CRITICAL: Uses LAZY dynamic imports for heavy modules to prevent module-level crashes.
 * The route must be able to render even if program-state or other heavy modules fail to load.
 */

// Force dynamic rendering to prevent stale cached output during debugging
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState, useEffect, Suspense, Component, type ReactNode, type ErrorInfo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StreamlinedWorkoutSession } from '@/components/workout/StreamlinedWorkoutSession'
import { type AdaptiveSession } from '@/lib/adaptive-program-builder'
// REMOVED: import { getProgramState } from '@/lib/program-state' - now lazily imported
import type { WorkoutReasoningSummary } from '@/lib/readiness/canonical-readiness-engine'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Dumbbell, AlertTriangle } from 'lucide-react'

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
    // Log error for debugging but don't crash the app
    console.error('[Workout Error Boundary]', error, errorInfo)
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
  
  // Normalize exercises array
  const normalizedExercises = (rawSession.exercises ?? []).map((ex, idx) => ({
    id: ex?.id || `exercise-${idx}`,
    name: ex?.name || 'Unknown Exercise',
    category: ex?.category || 'general',
    sets: typeof ex?.sets === 'number' && ex.sets > 0 ? ex.sets : 3,
    repsOrTime: ex?.repsOrTime || '8-12 reps',
    note: ex?.note || '',
    isOverrideable: ex?.isOverrideable ?? true,
    selectionReason: ex?.selectionReason || '',
  }))
  
  return {
    ...rawSession,
    dayNumber: typeof rawSession.dayNumber === 'number' ? rawSession.dayNumber : 1,
    dayLabel: rawSession.dayLabel || 'Workout',
    focus: rawSession.focus || 'general',
    focusLabel: rawSession.focusLabel || 'Training',
    rationale: rawSession.rationale || '',
    exercises: normalizedExercises,
    warmup: rawSession.warmup ?? [],
    cooldown: rawSession.cooldown ?? [],
    estimatedMinutes: typeof rawSession.estimatedMinutes === 'number' ? rawSession.estimatedMinutes : 45,
    isPrimary: rawSession.isPrimary ?? true,
    finisherIncluded: rawSession.finisherIncluded ?? false,
  }
}

function isRunnableSession(session: AdaptiveSession | null): boolean {
  if (!session) return false
  if (!Array.isArray(session.exercises)) return false
  if (session.exercises.length === 0) return false
  
  // Validate ALL exercises have required fields
  const allExercisesValid = session.exercises.every(ex => {
    if (!ex) return false
    if (typeof ex.name !== 'string' || ex.name.trim() === '') return false
    if (typeof ex.sets !== 'number' || ex.sets <= 0) return false
    if (typeof ex.repsOrTime !== 'string' || ex.repsOrTime.trim() === '') return false
    return true
  })
  
  return allExercisesValid
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
      name: 'Dips',
      category: 'push',
      sets: 3,
      repsOrTime: '8-12 reps',
      note: 'Keep elbows tucked. Full lockout at top.',
      isOverrideable: false,
      selectionReason: 'Demo exercise - pushing strength',
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
  const [reasoningSummary, setReasoningSummary] = useState<WorkoutReasoningSummary | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let mounted = true
    
    async function initializeSession() {
      try {
        // Route diagnostic to confirm latest code is executing
        console.log('[workout/session] live-init v3', {
          demoMode,
          isFirstSession,
          dayParam,
          timestamp: new Date().toISOString(),
        })
        
        // DEMO MODE: Always allow, completely isolated from program state
        // Demo must work regardless of any other conditions
        // CRITICAL: Demo does NOT call resolveProgramStateLazily() - fully isolated
        if (demoMode) {
          console.log('[workout/session] initializing demo mode')
          try {
            const normalizedDemo = normalizeSession(DEMO_SESSION)
            if (mounted) {
              if (normalizedDemo && isRunnableSession(normalizedDemo)) {
                setSession(normalizedDemo)
              } else {
                setSession(DEMO_SESSION)
              }
              setLoading(false)
            }
          } catch {
            if (mounted) {
              setSession(DEMO_SESSION)
              setLoading(false)
            }
          }
          return
        }
        
        console.log('[workout/session] initializing real workout mode')
        
        // LAZY import and resolve program state
        const { hasUsableProgram, adaptiveProgram } = await resolveProgramStateLazily()
        
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
        
        // Normalize session to ensure all fields are safe
        let normalizedSession = null
        try {
          normalizedSession = normalizeSession(rawSession)
        } catch {
          setError('This workout session could not be loaded.')
          setLoading(false)
          return
        }
        
        if (!normalizedSession || !isRunnableSession(normalizedSession)) {
          setError('This workout session is not properly configured.')
          setLoading(false)
          return
        }
        
        setSession(normalizedSession)
        // Extract workout reasoning summary from the program
        try {
          if (adaptiveProgram.workoutReasoningSummary) {
            setReasoningSummary(adaptiveProgram.workoutReasoningSummary as WorkoutReasoningSummary)
          }
        } catch {
          // Reasoning summary is optional, don't fail if it can't be read
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
