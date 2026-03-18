'use client'

/**
 * First Session Page - Import-Isolated Entry Point
 * 
 * TRUE IMPORT ISOLATION: This page contains NO heavy imports at the top level.
 * Heavy services are only loaded when FIRST_SESSION_SAFE_MODE is false,
 * via dynamic import. This prevents import-time crashes from affecting the shell.
 */

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Dumbbell, ArrowRight, Sparkles } from 'lucide-react'

// =============================================================================
// FIRST SESSION SAFE MODE - Internal isolation flag
// When true, renders polished prep shell WITHOUT loading heavy services
// When false, dynamically imports the full heavy content
// =============================================================================
const FIRST_SESSION_SAFE_MODE = true

// Heavy content - ONLY loaded when safe mode is disabled
const FirstSessionHeavyContent = !FIRST_SESSION_SAFE_MODE 
  ? dynamic(() => import('@/components/first-session/FirstSessionHeavyContent'), {
      ssr: false,
      loading: () => (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )
    })
  : null

// =============================================================================
// POLISHED PREPARATION SHELL - Production-ready first session entry
// =============================================================================

function FirstSessionPrepShell() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showReady, setShowReady] = useState(false)

  // Simulate brief preparation animation
  useEffect(() => {
    const timer = setTimeout(() => setShowReady(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const handleStartWorkout = () => {
    setIsLoading(true)
    // Navigate to workout session with first-session flag
    router.push('/workout/session?day=1&first=true')
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <Card className="bg-gradient-to-b from-[#1A1A1A] to-[#151515] border-[#2A2A2A] p-8 max-w-md w-full relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#E63946]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E63946]/20 to-[#E63946]/5 border border-[#E63946]/20 flex items-center justify-center transition-all duration-500 ${showReady ? 'scale-100 opacity-100' : 'scale-95 opacity-70'}`}>
              {showReady ? (
                <Sparkles className="w-8 h-8 text-[#E63946]" />
              ) : (
                <Dumbbell className="w-8 h-8 text-[#E63946] animate-pulse" />
              )}
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-[#F5F5F5] text-center mb-3">
            {showReady ? 'Your Session is Ready' : 'Preparing Your First Session'}
          </h1>
          
          {/* Body copy */}
          <p className="text-[#A5A5A5] text-center mb-2 leading-relaxed">
            {showReady 
              ? "Everything is set up and ready to go. Your personalized workout awaits."
              : "We're getting your training session ready."
            }
          </p>
          
          <p className="text-sm text-[#6A6A6A] text-center mb-8">
            {showReady
              ? "Track your progress as you complete each exercise."
              : "This usually takes just a moment."
            }
          </p>
          
          {/* Progress indicator when not ready */}
          {!showReady && (
            <div className="flex justify-center mb-8">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleStartWorkout}
              disabled={!showReady || isLoading}
              className="w-full bg-[#E63946] hover:bg-[#D62828] text-white h-12 text-base font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
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
              disabled={isLoading}
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
  // Safe mode: render polished preparation shell
  if (FIRST_SESSION_SAFE_MODE) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <FirstSessionPrepShell />
      </Suspense>
    )
  }

  // Normal mode: load heavy content dynamically
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {FirstSessionHeavyContent && <FirstSessionHeavyContent />}
    </Suspense>
  )
}
