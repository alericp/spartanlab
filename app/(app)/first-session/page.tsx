'use client'

/**
 * First Session Page - Import-Isolated Entry Point
 * 
 * This page checks if a program exists and either:
 * 1. Shows a "ready" state if program exists → navigate to workout session
 * 2. Shows a "needs setup" state if no program → offer demo or program creation
 * 
 * Light imports only - program check uses dynamic import for isolation
 */

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Dumbbell, ArrowRight, Sparkles, Target } from 'lucide-react'

// =============================================================================
// FIRST SESSION SHELL - Checks program availability and shows appropriate UI
// =============================================================================

function FirstSessionShell() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasProgram, setHasProgram] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Check if a program exists on mount
  useEffect(() => {
    const checkProgram = async () => {
      try {
        // Dynamic import to avoid heavy dependencies at module level
        const { getLatestAdaptiveProgram } = await import('@/lib/adaptive-program-builder')
        const program = getLatestAdaptiveProgram()
        setHasProgram(!!program && Array.isArray(program.sessions) && program.sessions.length > 0)
      } catch {
        setHasProgram(false)
      } finally {
        setIsLoading(false)
      }
    }
    checkProgram()
  }, [])

  const handleStartWorkout = () => {
    setIsNavigating(true)
    router.push('/workout/session?day=1&first=true')
  }

  const handleTryDemo = () => {
    setIsNavigating(true)
    router.push('/workout/session?demo=true')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <Card className="bg-gradient-to-b from-[#1A1A1A] to-[#151515] border-[#2A2A2A] p-8 max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#E63946]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E63946]/20 to-[#E63946]/5 border border-[#E63946]/20 flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-[#E63946] animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] text-center mb-3">
              Preparing Your Session
            </h1>
            <p className="text-[#A5A5A5] text-center mb-6">
              Checking your training program...
            </p>
            <div className="flex justify-center">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Program exists - show ready state
  if (hasProgram) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <Card className="bg-gradient-to-b from-[#1A1A1A] to-[#151515] border-[#2A2A2A] p-8 max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#E63946]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E63946]/20 to-[#E63946]/5 border border-[#E63946]/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#E63946]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] text-center mb-3">
              Your Session is Ready
            </h1>
            <p className="text-[#A5A5A5] text-center mb-2 leading-relaxed">
              Everything is set up and ready to go. Your personalized workout awaits.
            </p>
            <p className="text-sm text-[#6A6A6A] text-center mb-8">
              Track your progress as you complete each exercise.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleStartWorkout}
                disabled={isNavigating}
                className="w-full bg-[#E63946] hover:bg-[#D62828] text-white h-12 text-base font-semibold gap-2 disabled:opacity-50"
              >
                {isNavigating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Workout
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                className="w-full text-[#6A6A6A] hover:text-[#A5A5A5] hover:bg-[#1A1A1A]"
                disabled={isNavigating}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // No program - show setup options
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <Card className="bg-gradient-to-b from-[#1A1A1A] to-[#151515] border-[#2A2A2A] p-8 max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#E63946]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E63946]/20 to-[#E63946]/5 border border-[#E63946]/20 flex items-center justify-center">
              <Target className="w-8 h-8 text-[#E63946]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] text-center mb-3">
            Let's Get Started
          </h1>
          <p className="text-[#A5A5A5] text-center mb-2 leading-relaxed">
            Create a personalized program to unlock your first workout, or try a demo session to explore SpartanLab.
          </p>
          <p className="text-sm text-[#6A6A6A] text-center mb-8">
            Your program will be tailored to your goals and experience level.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/onboarding')}
              disabled={isNavigating}
              className="w-full bg-[#E63946] hover:bg-[#D62828] text-white h-12 text-base font-semibold gap-2"
            >
              <Target className="w-5 h-5" />
              Create Your Program
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleTryDemo}
              variant="outline"
              disabled={isNavigating}
              className="w-full border-[#2A2A2A] text-[#A5A5A5] hover:bg-[#1A1A1A] hover:text-[#F5F5F5] h-11 gap-2"
            >
              {isNavigating ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#A5A5A5]/30 border-t-[#A5A5A5] rounded-full animate-spin" />
                  Loading Demo...
                </>
              ) : (
                <>
                  <Dumbbell className="w-4 h-4" />
                  Try Demo Workout
                </>
              )}
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="w-full text-[#6A6A6A] hover:text-[#A5A5A5] hover:bg-[#1A1A1A]"
              disabled={isNavigating}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function FirstSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FirstSessionShell />
    </Suspense>
  )
}
