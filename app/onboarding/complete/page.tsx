'use client'

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================
// This page is a SIDE-EFFECT route that runs generateFirstProgram() on mount.
// It must NOT be cached, prefetched as stale content, or treated as static.
// The dynamic export ensures Next.js treats this as a fresh render each time.

// Module-safe init check - this logs at import time to confirm no import-time crashes
if (typeof window !== 'undefined') {
  console.log('[OnboardingComplete] Module evaluation complete - no import-time crashes')
}

/**
 * Onboarding Complete Page
 * 
 * CRITICAL: This page MUST call generateFirstProgram() to actually create
 * the user's program. Without this, the user has onboarding data but no
 * usable workout program.
 * 
 * Flow:
 * 1. Show "generating" state
 * 2. Call generateFirstProgram() to create program from onboarding data
 * 3. Save program to canonical storage
 * 4. Route to first-session (which will now find a real program)
 * 
 * IDEMPOTENCY: Generation is guarded by a ref + sessionStorage token to prevent
 * duplicate execution from remounts, history navigation, or cache revalidation.
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CheckCircle2,
  Crown,
  Sparkles,
  ArrowRight,
  Target,
  Dumbbell,
  Zap,
  Calendar,
  TrendingUp,
  Brain,
  Activity,
  Shield,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { getOnboardingProfile, calculateReadinessScores } from '@/lib/athlete-profile'
import { generateFirstProgram, getProgramReasoning, type FirstRunResult } from '@/lib/onboarding-service'
import { hasProAccess, isInTrial, getTrialDaysRemaining } from '@/lib/feature-access'
import { PRICING } from '@/lib/billing/pricing'
import { trackSignupCompleted, trackProgramGenerated } from '@/lib/analytics'

// Pro feature highlights
const PRO_FEATURES = [
  {
    icon: Brain,
    title: 'Adaptive Programming',
    description: 'Your program evolves based on your performance and recovery',
  },
  {
    icon: TrendingUp,
    title: 'Progress Forecasting',
    description: 'See predicted timelines for reaching your skill goals',
  },
  {
    icon: Activity,
    title: 'Training Analytics',
    description: 'Deep insights into your training patterns and progress',
  },
  {
    icon: Shield,
    title: 'Spartan Score',
    description: 'Track your overall calisthenics performance rating',
  },
]

type PageStep = 'generating' | 'ready' | 'error'

// Session-scoped idempotency key for this specific onboarding completion flow
const GENERATION_SESSION_KEY = 'spartanlab_onboarding_generation_attempted'

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<PageStep>('generating')
  const [isPro, setIsPro] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [trialDays, setTrialDays] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<ReturnType<typeof getOnboardingProfile> | null>(null)
  const [programResult, setProgramResult] = useState<FirstRunResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // IDEMPOTENCY GUARD: Prevent duplicate generation from remounts/history/cache
  const generationAttemptedRef = useRef(false)
  const [generationSkipped, setGenerationSkipped] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('[OnboardingComplete] useEffect mount started')
    
    // Branch setup calls - wrapped defensively to prevent crashes
    // CRITICAL: Capture results locally so we can use them in diagnostics
    let localIsPro = false
    let localIsTrial = false
    let localTrialDays = 0
    
    try {
      localIsPro = hasProAccess()
      setIsPro(localIsPro)
      console.log('[OnboardingComplete] hasProAccess succeeded:', localIsPro)
    } catch (err) {
      console.error('[OnboardingComplete] hasProAccess failed, defaulting to false:', err)
      setIsPro(false)
    }
    
    try {
      localIsTrial = isInTrial()
      setIsTrial(localIsTrial)
      console.log('[OnboardingComplete] isInTrial succeeded:', localIsTrial)
    } catch (err) {
      console.error('[OnboardingComplete] isInTrial failed, defaulting to false:', err)
      setIsTrial(false)
    }
    
    try {
      localTrialDays = getTrialDaysRemaining()
      setTrialDays(localTrialDays)
      console.log('[OnboardingComplete] getTrialDaysRemaining succeeded:', localTrialDays)
    } catch (err) {
      console.error('[OnboardingComplete] getTrialDaysRemaining failed, defaulting to 0:', err)
      setTrialDays(0)
    }
    
    let loadedProfile = null
    try {
      loadedProfile = getOnboardingProfile()
      // Diagnostic: confirm normalized profile shape
      if (loadedProfile) {
        console.log('[OnboardingComplete] Profile loaded (normalized):', {
          hasArrayFields: {
            equipment: Array.isArray(loadedProfile.equipment),
            selectedSkills: Array.isArray(loadedProfile.selectedSkills),
            jointCautions: Array.isArray(loadedProfile.jointCautions),
          },
          hasNumericFields: {
            trainingDaysPerWeek: typeof loadedProfile.trainingDaysPerWeek,
            sessionLengthMinutes: typeof loadedProfile.sessionLengthMinutes,
          },
        })
      }
    } catch (err) {
      console.error('[OnboardingComplete] getOnboardingProfile failed:', err)
    }
    setProfile(loadedProfile)
    
    // CRITICAL: Generate the program from onboarding data
    const generateProgram = async () => {
      // =======================================================================
      // IDEMPOTENCY CHECK: Prevent duplicate generation
      // =======================================================================
      // Check 1: In-memory ref guard (handles React strict mode double-mount)
      if (generationAttemptedRef.current) {
        console.log('[OnboardingComplete] IDEMPOTENCY: Generation already attempted in this mount cycle, skipping')
        setGenerationSkipped(true)
        return
      }
      generationAttemptedRef.current = true
      
      // Check 2: Session storage guard (handles browser back/forward, cache revalidation)
      // Only check this if we haven't already successfully generated in this session
      try {
        const sessionToken = sessionStorage.getItem(GENERATION_SESSION_KEY)
        if (sessionToken) {
          const tokenData = JSON.parse(sessionToken)
          // If generation completed successfully in this session, skip and go to ready
          if (tokenData.completed && tokenData.timestamp) {
            const elapsed = Date.now() - tokenData.timestamp
            // Token valid for 5 minutes (prevents stale session data issues)
            if (elapsed < 5 * 60 * 1000) {
              console.log('[OnboardingComplete] IDEMPOTENCY: Generation already completed in this session, showing ready state')
              setGenerationSkipped(true)
              setStep('ready')
              return
            }
          }
        }
      } catch (err) {
        console.error('[OnboardingComplete] Session token check failed (non-fatal):', err)
      }
      
      console.log('[OnboardingComplete] IDEMPOTENCY: Fresh generation starting')
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        // This saves the program to canonical storage (spartanlab_adaptive_programs)
        // AND to backward-compatible storage (spartanlab_first_program)
        const result = generateFirstProgram()
        setProgramResult(result)
        
        if (result.success && result.program) {
          // VERIFICATION STEP: Confirm program is actually readable from canonical storage
          // This prevents routing to first-session if save didn't work
          const { getProgramState } = await import('@/lib/program-state')
          const verificationState = getProgramState()
          
          if (!verificationState.hasUsableWorkoutProgram) {
            console.error('[OnboardingComplete] Program saved but not readable from program-state')
            setErrorMessage('Program was created but could not be verified. Please try again.')
            setStep('error')
            return
          }
          
          console.log('[OnboardingComplete] Verification passed, program ready for dashboard')
          
          // IDEMPOTENCY: Mark generation as completed in session storage
          // This prevents duplicate generation if user navigates back to this page
          try {
            sessionStorage.setItem(GENERATION_SESSION_KEY, JSON.stringify({
              completed: true,
              timestamp: Date.now(),
            }))
            console.log('[OnboardingComplete] Session token set for idempotency')
          } catch (err) {
            console.error('[OnboardingComplete] Failed to set session token (non-fatal):', err)
          }
          
          // Track analytics - non-blocking, wrapped so failures don't crash the route
          try {
            trackSignupCompleted()
            trackProgramGenerated('onboarding', loadedProfile?.primaryGoal)
          } catch (analyticsErr) {
            console.error('[OnboardingComplete] Analytics failed (non-fatal):', analyticsErr)
          }
          
          // Create program history entry via API (if authenticated)
          fetch('/api/program/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              program: result.program,
              isInitial: true,
              reason: 'onboarding_initial_generation',
            }),
          }).catch(err => {
            console.error('[OnboardingComplete] Failed to create program history:', err)
          })
          
          console.log('[OnboardingComplete] SUCCESS: Setting step to ready', { 
            isPro: localIsPro, 
            isTrial: localIsTrial, 
            sessionCount: verificationState.sessionCount,
            branch: localIsPro ? 'pro-success' : 'free-preview'
          })
          setStep('ready')
        } else {
          console.error('[OnboardingComplete] Generation failed:', result.error)
          setErrorMessage(result.error || 'Failed to generate program')
          setStep('error')
        }
      } catch (err) {
        console.error('[OnboardingComplete] Exception during generation:', err)
        setErrorMessage(String(err))
        setStep('error')
      }
    }
    
    generateProgram()
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Calculate readiness if profile exists - wrapped defensively
  let readiness = null
  if (profile) {
    try {
      readiness = calculateReadinessScores(profile)
    } catch (err) {
      console.error('[OnboardingComplete] calculateReadinessScores failed:', err)
    }
  }

  // Get primary goal display
  const getPrimaryGoalDisplay = () => {
    if (!profile?.primaryGoal) return 'General Fitness'
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

  const handleStartTrial = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.error) {
        console.error('Checkout error:', data.error)
        if (response.status === 401) {
          router.push('/sign-in?redirect_url=/upgrade')
          return
        }
        setIsLoading(false)
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setIsLoading(false)
    }
  }

  // Generating state
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="bg-[#1A1F26] border-[#2B313A] p-8 max-w-md w-full text-center">
          <div className="animate-pulse mb-6">
            <SpartanIcon size={56} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">
            Building Your Program
          </h2>
          <div className="space-y-1.5 mb-6">
            <p className="text-sm text-[#A4ACB8]">
              Analyzing your profile and generating personalized workouts...
            </p>
          </div>
          <div className="flex justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </Card>
      </div>
    )
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="bg-[#1A1F26] border-[#2B313A] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">
            Generation Issue
          </h2>
          <p className="text-sm text-[#A4ACB8] mb-6">
            {errorMessage || 'There was an issue generating your program. You can try again or use a demo workout.'}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={async () => {
                console.log('[OnboardingComplete] RETRY: User explicitly requested retry')
                setStep('generating')
                setErrorMessage(null)
                setGenerationSkipped(false)
                
                // CRITICAL: Clear idempotency guards for explicit retry
                generationAttemptedRef.current = false
                try {
                  sessionStorage.removeItem(GENERATION_SESSION_KEY)
                } catch {
                  // Ignore sessionStorage errors
                }
                
                try {
                  const result = generateFirstProgram()
                  setProgramResult(result)
                  if (result.success && result.program) {
                    // Verify program is readable
                    const { getProgramState } = await import('@/lib/program-state')
                    const verificationState = getProgramState()
                    if (verificationState.hasUsableWorkoutProgram) {
                      // Set session token on successful retry
                      try {
                        sessionStorage.setItem(GENERATION_SESSION_KEY, JSON.stringify({
                          completed: true,
                          timestamp: Date.now(),
                        }))
                      } catch {
                        // Ignore
                      }
                      setStep('ready')
                    } else {
                      setErrorMessage('Program was created but could not be verified.')
                      setStep('error')
                    }
                  } else {
                    setErrorMessage(result.error || 'Failed to generate program')
                    setStep('error')
                  }
                } catch (err) {
                  setErrorMessage(String(err))
                  setStep('error')
                }
              }}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            >
              Try Again
            </Button>
            <Link href="/workout/session?demo=true" className="block">
              <Button variant="outline" className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]">
                <Dumbbell className="w-4 h-4 mr-2" />
                Try Demo Workout
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // If already Pro, show success and go to first session
  if (isPro) {
    console.log('[OnboardingComplete] BRANCH: pro success', { isTrial, trialDays })
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-3">
            Your Program is Ready
          </h1>
          
          <p className="text-[#A4ACB8] mb-2">
            SpartanLab has analyzed your profile and generated a personalized program targeting your goals.
          </p>
          
          {isTrial && trialDays > 0 && (
            <p className="text-sm text-amber-400 mb-6">
              {trialDays} days remaining in your Pro trial
            </p>
          )}
          
          <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5 text-[#C1121F]" />
              <span className="text-[#E6E9EF] font-medium">Primary Goal</span>
            </div>
            <p className="text-lg text-[#E6E9EF] font-semibold">{getPrimaryGoalDisplay()}</p>
            {typeof profile?.trainingDaysPerWeek === 'number' && profile.trainingDaysPerWeek > 0 && (
              <p className="text-sm text-[#6B7280] mt-1">
                {profile.trainingDaysPerWeek} training days per week
              </p>
            )}
          </div>
          
          <Button 
            onClick={() => {
              console.log('[OnboardingComplete] Navigating to first-session (replace)')
              router.replace('/first-session?from=onboarding')
            }}
            className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white py-6 text-lg font-medium"
          >
            Start First Session
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => {
              console.log('[OnboardingComplete] Navigating to dashboard (replace)')
              router.replace('/dashboard?welcome=true')
            }}
            className="w-full text-[#6B7280] hover:text-[#A4ACB8] mt-3"
          >
            View Dashboard First
          </Button>
        </div>
      </div>
    )
  }

  // Free user - show program preview with upgrade opportunity
  console.log('[OnboardingComplete] BRANCH: free preview', {
    hasProfile: !!profile,
    hasSelectedSkills: Array.isArray(profile?.selectedSkills),
    hasReadiness: !!readiness,
    primaryGoal: profile?.primaryGoal ?? 'none',
  })
  return (
    <div className="min-h-screen bg-[#0F1115] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-2">
            Your Program is Ready!
          </h1>
          <p className="text-[#A4ACB8]">
            Based on your profile, here's what we've built for you
          </p>
        </div>

        {/* Program Summary Card */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-5 mb-6">
          <div className="space-y-4">
            {/* Primary Goal */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Primary Goal</p>
                <p className="text-lg text-[#E6E9EF] font-semibold">{getPrimaryGoalDisplay()}</p>
              </div>
            </div>

            {/* Training Schedule */}
            {typeof profile?.trainingDaysPerWeek === 'number' && profile.trainingDaysPerWeek > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4F6D8A]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#4F6D8A]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Schedule</p>
                  <p className="text-[#E6E9EF]">
                    {profile.trainingDaysPerWeek} days/week
                    {typeof profile.sessionLengthMinutes === 'number' && profile.sessionLengthMinutes > 0 && ` • ${profile.sessionLengthMinutes} min sessions`}
                  </p>
                </div>
              </div>
            )}

            {/* Readiness Summary */}
            {readiness && typeof readiness === 'object' && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Your Readiness</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-[#A4ACB8]">Strength</span>
                      <span className="text-sm text-[#E6E9EF] font-medium">
                        {typeof readiness.strengthPotentialScore === 'number' ? readiness.strengthPotentialScore : 50}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-[#A4ACB8]">Skill</span>
                      <span className="text-sm text-[#E6E9EF] font-medium">
                        {typeof readiness.skillAdaptationScore === 'number' ? readiness.skillAdaptationScore : 50}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills to Train */}
            {Array.isArray(profile?.selectedSkills) && profile.selectedSkills.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Skills to Master</p>
                  <p className="text-[#E6E9EF] text-sm">
                    {profile.selectedSkills.map(s => {
                      const labels: Record<string, string> = {
                        front_lever: 'Front Lever',
                        planche: 'Planche',
                        muscle_up: 'Muscle-Up',
                        handstand: 'Handstand',
                        l_sit: 'L-Sit',
                        v_sit: 'V-Sit',
                      }
                      return typeof s === 'string' ? (labels[s] || s) : String(s)
                    }).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Pro Upgrade Section */}
        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-600/5 border-amber-500/20 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-[#E6E9EF]">Unlock Adaptive Training</h2>
          </div>
          
          <p className="text-sm text-[#A4ACB8] mb-4">
            Your starter program is ready. Upgrade to Pro to unlock intelligent programming that adapts to your progress.
          </p>

          {/* Pro Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {PRO_FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-2.5">
                <feature.icon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-[#E6E9EF] font-medium">{feature.title}</p>
                  <p className="text-xs text-[#6B7280]">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trial CTA */}
          <div className="bg-[#0F1115]/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-[#E6E9EF] font-medium">7-Day Free Trial</span>
              </div>
              <span className="text-sm text-[#6B7280]">Then {PRICING.pro.displayWithPeriod}</span>
            </div>
            <p className="text-xs text-[#6B7280]">
              No charge until your trial ends. Cancel anytime.
            </p>
          </div>

          <Button
            onClick={handleStartTrial}
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black py-5 font-semibold"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <>
                Start 7-Day Free Trial
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </Button>
        </Card>

        {/* Continue Free Option */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              console.log('[OnboardingComplete] Free user navigating to first-session (replace)')
              router.replace('/first-session?from=onboarding')
            }}
            className="text-[#6B7280] hover:text-[#A4ACB8] hover:bg-transparent"
          >
            Start First Session
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <p className="text-xs text-[#4A5568] mt-2">
            You can upgrade anytime from Settings
          </p>
        </div>
      </div>
    </div>
  )
}
