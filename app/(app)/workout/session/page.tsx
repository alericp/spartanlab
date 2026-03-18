'use client'

import { useState, useEffect, Suspense, Component, type ReactNode, type ErrorInfo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StreamlinedWorkoutSession } from '@/components/workout/StreamlinedWorkoutSession'
import { type AdaptiveSession } from '@/lib/adaptive-program-builder'
import { getProgramState } from '@/lib/program-state'
import type { WorkoutReasoningSummary } from '@/lib/readiness/canonical-readiness-engine'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Dumbbell, AlertTriangle } from 'lucide-react'

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
    // Wrap EVERYTHING in try-catch to ensure no crash can escape
    try {
      // DEMO MODE: Always allow, completely isolated from program state
      // Demo must work regardless of any other conditions
      if (demoMode) {
        try {
          const normalizedDemo = normalizeSession(DEMO_SESSION)
          if (normalizedDemo && isRunnableSession(normalizedDemo)) {
            setSession(normalizedDemo)
          } else {
            // Fallback if demo session is somehow invalid (should never happen)
            setSession(DEMO_SESSION)
          }
        } catch {
          // If demo normalization fails, use raw demo session
          setSession(DEMO_SESSION)
        }
        setLoading(false)
        return
      }
      
      // Use unified program state check for consistency
      // Wrapped in try-catch for safety - must never crash
      let hasUsableProgram = false
      let adaptiveProgram = null
      
      try {
        const programState = getProgramState()
        // Use hasUsableWorkoutProgram for stricter validation
        hasUsableProgram = programState.hasUsableWorkoutProgram === true
        adaptiveProgram = programState.adaptiveProgram
      } catch {
        // If program state check fails, treat as no program
        hasUsableProgram = false
        adaptiveProgram = null
      }
      
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
          setReasoningSummary(adaptiveProgram.workoutReasoningSummary)
        }
      } catch {
        // Reasoning summary is optional, don't fail if it can't be read
      }
      setLoading(false)
    } catch (e) {
      // Catch-all: if anything unexpected happens, show a safe error
      console.error('[Workout Session] Unexpected error during initialization:', e)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }, [dayParam, demoMode, isFirstSession])
  
  const handleComplete = () => {
    router.push('/dashboard?workout=completed')
  }
  
  const handleCancel = () => {
    router.back()
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
