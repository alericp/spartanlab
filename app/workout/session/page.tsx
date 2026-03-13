'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StreamlinedWorkoutSession } from '@/components/workout/StreamlinedWorkoutSession'
import { getLatestAdaptiveProgram, type AdaptiveSession, type AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Dumbbell } from 'lucide-react'

// Demo session for testing when no program exists
const DEMO_SESSION: AdaptiveSession = {
  dayNumber: 1,
  dayLabel: 'Demo Workout',
  focus: 'skill',
  focusLabel: 'Skill Focus',
  isPrimary: true,
  rationale: 'Demo session for testing the workout interface',
  exercises: [
    {
      id: 'demo-1',
      name: 'Front Lever Progression',
      category: 'skill',
      sets: 4,
      repsOrTime: '8 seconds',
      note: 'Use band assistance as needed',
      isOverrideable: false,
      selectionReason: 'Demo exercise',
    },
    {
      id: 'demo-2',
      name: 'Weighted Pull-Ups',
      category: 'pull',
      sets: 4,
      repsOrTime: '5-8 reps',
      isOverrideable: false,
      selectionReason: 'Demo exercise',
    },
    {
      id: 'demo-3',
      name: 'Planche Lean',
      category: 'skill',
      sets: 3,
      repsOrTime: '15 seconds',
      isOverrideable: false,
      selectionReason: 'Demo exercise',
    },
    {
      id: 'demo-4',
      name: 'Dips',
      category: 'push',
      sets: 3,
      repsOrTime: '8-12 reps',
      isOverrideable: false,
      selectionReason: 'Demo exercise',
    },
  ],
  warmup: [],
  cooldown: [],
  estimatedMinutes: 45,
  finisherIncluded: false,
}

function WorkoutSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayParam = searchParams.get('day')
  const demoMode = searchParams.get('demo') === 'true'
  
  const [session, setSession] = useState<AdaptiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Demo mode for testing
    if (demoMode) {
      setSession(DEMO_SESSION)
      setLoading(false)
      return
    }
    
    const program = getLatestAdaptiveProgram()
    
    if (!program) {
      setError('No active program found. Please create a program first.')
      setLoading(false)
      return
    }
    
    // Find the session for the requested day (or today)
    // Sessions array contains all workout days, ordered by dayNumber
    const today = new Date().getDay() // 0=Sunday through 6=Saturday
    const sessionIndex = dayParam 
      ? parseInt(dayParam, 10) 
      : Math.min(today === 0 ? 6 : today - 1, program.sessions.length - 1)
    
    const targetSession = program.sessions[sessionIndex] || program.sessions[0]
    
    if (!targetSession) {
      setError('No workout scheduled for this day.')
      setLoading(false)
      return
    }
    
    setSession(targetSession)
    setLoading(false)
  }, [dayParam, demoMode])
  
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
            Create a program first, or try a demo workout to explore SpartanLab.
          </p>
          <div className="space-y-3">
            <Link href="/programs" className="block">
              <Button className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2">
                Create Your Program
              </Button>
            </Link>
            <Link href="/workout/session?demo=true" className="block">
              <Button variant="outline" className="w-full border-[#2B313A] text-[#A4ACB8] gap-2">
                <Dumbbell className="w-4 h-4" />
                Try Demo Workout
              </Button>
            </Link>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-[#6B7280] hover:text-[#A4ACB8] underline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <StreamlinedWorkoutSession
      session={session}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
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
