'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X, Sparkles, ArrowRight, Target, Calendar, Dumbbell, ChevronRight } from 'lucide-react'
import { getOnboardingProfile, type OnboardingProfile } from '@/lib/athlete-profile'
import { hasProAccess, isInTrial, getTrialDaysRemaining } from '@/lib/feature-access'
import { cn } from '@/lib/utils'

const WELCOME_DISMISSED_KEY = 'spartanlab_welcome_dismissed'

// Inner component that uses useSearchParams (requires Suspense boundary)
function WelcomeBannerInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [trialDays, setTrialDays] = useState(0)

  // Safe access to search params with fallbacks
  let isWelcome = false
  let trialStarted = false
  try {
    isWelcome = searchParams?.get('welcome') === 'true'
    trialStarted = searchParams?.get('trial') === 'started'
  } catch {
    // searchParams may be null during SSR or in certain edge cases
    console.log('[WelcomeBanner] searchParams access failed, using defaults')
  }

  useEffect(() => {
    setMounted(true)
    
    // Defensively wrap all localStorage/feature-access calls
    try {
      setProfile(getOnboardingProfile())
    } catch (err) {
      console.error('[WelcomeBanner] getOnboardingProfile failed:', err)
    }
    
    try {
      setIsPro(hasProAccess())
    } catch (err) {
      console.error('[WelcomeBanner] hasProAccess failed:', err)
      setIsPro(false)
    }
    
    try {
      setIsTrial(isInTrial())
    } catch (err) {
      console.error('[WelcomeBanner] isInTrial failed:', err)
      setIsTrial(false)
    }
    
    try {
      setTrialDays(getTrialDaysRemaining())
    } catch (err) {
      console.error('[WelcomeBanner] getTrialDaysRemaining failed:', err)
      setTrialDays(0)
    }

    // Check if already dismissed
    try {
      if (typeof window !== 'undefined') {
        const dismissed = sessionStorage.getItem(WELCOME_DISMISSED_KEY)
        if (dismissed === 'true') {
          setIsDismissed(true)
        }
      }
    } catch (err) {
      console.error('[WelcomeBanner] sessionStorage check failed:', err)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(WELCOME_DISMISSED_KEY, 'true')
      // Remove query params from URL
      router.replace('/dashboard', { scroll: false })
    }
  }

  // Don't render if not welcome or already dismissed
  if (!mounted || !isWelcome || isDismissed) {
    console.log('[WelcomeBanner] Not rendering:', { mounted, isWelcome, isDismissed })
    return null
  }
  
  console.log('[WelcomeBanner] Rendering welcome banner')

  // Get primary goal display
  const getPrimaryGoalDisplay = () => {
    if (!profile?.primaryGoal) return 'your goals'
    const goalMap: Record<string, string> = {
      front_lever: 'Front Lever',
      planche: 'Planche',
      muscle_up: 'Muscle-Up',
      handstand_pushup: 'Handstand Push-Up',
      weighted_pull: 'Weighted Pull-Ups',
      weighted_dip: 'Weighted Dips',
      general_strength: 'General Strength',
    }
    return goalMap[profile.primaryGoal] || profile.primaryGoal
  }

  // Trial just started
  if (trialStarted && isTrial) {
    return (
      <div className="relative bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-4 mb-6">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-[#E6E9EF] font-semibold mb-1">
              Pro Trial Activated!
            </h3>
            <p className="text-sm text-[#A4ACB8] mb-3">
              You have {trialDays} days to explore adaptive programming, analytics, and all Pro features.
              Your training program is now fully personalized.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/program">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-medium">
                  View Your Program
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard welcome (free or pro)
  return (
    <div className="relative bg-gradient-to-r from-[#C1121F]/10 to-[#C1121F]/5 border border-[#C1121F]/20 rounded-xl p-5 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#C1121F]/20 flex items-center justify-center shrink-0">
          <Dumbbell className="w-6 h-6 text-[#C1121F]" />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="text-lg text-[#E6E9EF] font-semibold mb-1">
            Your Adaptive Program is Ready
          </h3>
          <p className="text-sm text-[#A4ACB8] mb-3">
            Your first session is personalized for {getPrimaryGoalDisplay()} training. 
            Complete it to activate adaptive adjustments.
          </p>
          
          {/* Why this program works - First Win Section */}
          <div className="bg-[#0F1115]/50 rounded-md p-3 mb-4 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-medium mb-2">Why This Program Works For You</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-[#A4ACB8]">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                Built from your current strength levels
              </div>
              <div className="flex items-center gap-2 text-xs text-[#A4ACB8]">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                Balanced volume for sustainable recovery
              </div>
              <div className="flex items-center gap-2 text-xs text-[#A4ACB8]">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                Progression logic targets {getPrimaryGoalDisplay()}
              </div>
            </div>
          </div>
          
          {/* Primary CTA - Start First Session */}
          <Link href="/first-session">
            <Button className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2">
              <Dumbbell className="w-4 h-4" />
              Start First Session
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Exported wrapper with Suspense boundary for WelcomeBanner
export function WelcomeBanner() {
  return (
    <Suspense fallback={null}>
      <WelcomeBannerInner />
    </Suspense>
  )
}

// Compact first workout CTA for dashboard
export function FirstWorkoutCTA() {
  const [mounted, setMounted] = useState(false)
  const [hasWorkouts, setHasWorkouts] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Check if user has any workout history
    if (typeof window !== 'undefined') {
      const workoutLogs = localStorage.getItem('spartanlab_workout_logs')
      try {
        const logs = workoutLogs ? JSON.parse(workoutLogs) : []
        setHasWorkouts(logs.length > 0)
      } catch {
        setHasWorkouts(false)
      }
    }
  }, [])

  if (!mounted || hasWorkouts) {
    return null
  }

  return (
    <Link href="/first-session" className="block">
      <div className="bg-[#1A1F26] border border-[#2B313A] hover:border-[#C1121F]/30 rounded-xl p-4 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center group-hover:bg-[#C1121F]/20 transition-colors">
              <Dumbbell className="w-5 h-5 text-[#C1121F]" />
            </div>
            <div>
              <p className="text-[#E6E9EF] font-medium">Ready to train?</p>
              <p className="text-sm text-[#6B7280]">Start your first session</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#C1121F] transition-colors" />
        </div>
      </div>
    </Link>
  )
}
