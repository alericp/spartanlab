'use client'

/**
 * Onboarding Complete Client Component
 * 
 * CRITICAL: This component runs generateFirstProgram() on mount to create
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
 * 
 * [PHASE 14D] Owner detection: Uses useOwnerBootstrap (canonical provider) and
 * useEntitlement (canonical hook) to properly detect platform owner before
 * checking pro access. Stale closure issues are prevented by proper effect deps.
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
import { useOwnerBootstrap, auditOwnerFlow } from '@/components/providers/OwnerBootstrapProvider'
import { useEntitlement } from '@/hooks/useEntitlement'
import { getCompactScheduleLabel, getCompactDurationLabel } from '@/lib/adaptive-display-contract'

// =============================================================================
// IMPORT SAFETY: Heavy runtime helpers are now dynamically imported
// This prevents module-evaluation failures from crashing the entire page bundle
// =============================================================================

// Type-only imports are safe at module scope
import type { FirstRunResult } from '@/lib/onboarding-service'
import type { OnboardingProfile, ReadinessScores } from '@/lib/athlete-profile'

// PRICING is a static const object - check if safe to keep at module scope
// Moving to dynamic import for maximum safety
// import { PRICING } from '@/lib/billing/pricing'

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

export default function OnboardingCompleteClient() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<PageStep>('generating')
  const [isPro, setIsPro] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [trialDays, setTrialDays] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [readiness, setReadiness] = useState<ReadinessScores | null>(null)
  const [programResult, setProgramResult] = useState<FirstRunResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pricingData, setPricingData] = useState<{ pro: { displayWithPeriod: string } } | null>(null)
  
  // [PHASE 14C TASK 1] Use OwnerBootstrapProvider context for reliable owner detection
  // This ensures owner state is available before making branch decisions
  const ownerState = useOwnerBootstrap()
  const { isOwner, isLoaded: ownerLoaded, userEmail, simulationMode } = ownerState
  
  // [PHASE 14C TASK 2] Use canonical useEntitlement hook as the single source of truth
  const entitlement = useEntitlement()
  
  // [PHASE 14C TASK 1] Gate flag - only evaluate branches when both owner and entitlement are ready
  const isEntitlementReady = ownerLoaded && !entitlement.isLoading
  
  // IDEMPOTENCY GUARD: Prevent duplicate generation from remounts/history/cache
  const generationAttemptedRef = useRef(false)
  const [generationSkipped, setGenerationSkipped] = useState(false)
  
  // [PHASE 16A TASK 4] Generation progress tracking
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const [generationElapsed, setGenerationElapsed] = useState(0)
  const [isSlowGeneration, setIsSlowGeneration] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Analyzing your profile...')
  
  // Status messages for progress indication
  const STATUS_MESSAGES = [
    'Analyzing your profile...',
    'Processing goals and equipment...',
    'Building personalized exercises...',
    'Optimizing weekly structure...',
    'Finalizing your program...',
  ]
  
  // Thresholds (in milliseconds)
  const SLOW_THRESHOLD_MS = 8000 // 8 seconds
  const VERY_SLOW_THRESHOLD_MS = 15000 // 15 seconds

  // [PHASE 14D TASK 1] Mount effect - ONLY sets mounted flag
  // This is the ONLY effect that should have [] dependencies
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // [PHASE 16A TASK 4] Generation progress tracking effect
  useEffect(() => {
    if (step !== 'generating' || !generationStartTime) return
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - generationStartTime
      setGenerationElapsed(elapsed)
      
      // Update status message based on elapsed time
      const messageIndex = Math.min(
        Math.floor(elapsed / 3000), // Change message every 3 seconds
        STATUS_MESSAGES.length - 1
      )
      setStatusMessage(STATUS_MESSAGES[messageIndex])
      
      // Check for slow generation
      if (elapsed >= SLOW_THRESHOLD_MS && !isSlowGeneration) {
        setIsSlowGeneration(true)
        console.log('[phase16a-generation-slow-threshold-audit]', {
          elapsedMs: elapsed,
          threshold: SLOW_THRESHOLD_MS,
          triggered: true,
        })
      }
      
      // Log very slow generation
      if (elapsed >= VERY_SLOW_THRESHOLD_MS) {
        console.log('[phase16a-generation-timeout-ui-verdict]', {
          elapsedMs: elapsed,
          threshold: VERY_SLOW_THRESHOLD_MS,
          showingSlowMessage: true,
          userCanRetry: true,
        })
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [step, generationStartTime, isSlowGeneration])
  
  // [PHASE 14D TASK 1] Bootstrap effect - runs when entitlement is READY
  // This effect has proper dependencies to avoid stale closures
  useEffect(() => {
    // [PHASE 14D] Audit: Log effect dependencies state
    console.log('[phase14d-onboarding-effect-deps-audit]', {
      ownerLoaded,
      isOwner,
      simulationMode,
      entitlementLoading: entitlement.isLoading,
      entitlementHasProAccess: entitlement.hasProAccess,
      isEntitlementReady,
      effectWillRun: isEntitlementReady,
    })
    
    // [PHASE 14D] Block stale closure: Do NOT run bootstrap until entitlement is truly ready
    if (!isEntitlementReady) {
      console.log('[phase14d-onboarding-stale-closure-blocked-audit]', {
        blocked: true,
        reason: 'entitlement_not_ready',
        ownerLoaded,
        entitlementLoading: entitlement.isLoading,
      })
      return
    }
    
    console.log('[OnboardingCompleteClient] Bootstrap effect running - entitlement ready')
    
    // =======================================================================
    // BOOTSTRAP: Load all heavy modules via dynamic import
    // This prevents module-evaluation failures from black-screening the page
    // =======================================================================
    const bootstrap = async () => {
      let localIsPro = false
      let localIsTrial = false
      let localTrialDays = 0
      let loadedProfile: OnboardingProfile | null = null
      
      // [PHASE 14C TASK 2] Use canonical entitlement hook as single source of truth
      // Instead of calling hasProAccess() which can race, use the hook values directly
      
      // [PHASE 14C] Audit: Branch ready gate
      console.log('[phase14c-onboarding-branch-ready-gate-audit]', {
        ownerLoaded,
        entitlementLoading: entitlement.isLoading,
        isEntitlementReady,
        gateStatus: isEntitlementReady ? 'passed' : 'waiting',
      })
      
      // [PHASE 14C TASK 2] Get entitlement from canonical hook
      // The useEntitlement hook already handles owner simulation overlay
      localIsPro = entitlement.hasProAccess
      localIsTrial = entitlement.isTrialing
      localTrialDays = 0 // Trial days are not exposed via useEntitlement yet
      
      // Set state from canonical source
      setIsPro(localIsPro)
      setIsTrial(localIsTrial)
      setTrialDays(localTrialDays)
      
      // [PHASE 14D TASK 4] Audit owner flow
      auditOwnerFlow(ownerState, entitlement, 'onboarding-complete')
      
      // [PHASE 14D] True runtime branch verdict - this is the ACTUAL branch decision
      // NOT a stale closure value, but the current canonical entitlement state
      console.log('[phase14d-onboarding-true-runtime-branch-verdict]', {
        isOwner,
        simulationMode,
        entitlementHasProAccess: entitlement.hasProAccess,
        entitlementAccessSource: entitlement.accessSource,
        finalIsPro: localIsPro,
        branchWillBe: localIsPro ? 'pro-success' : 'free-preview',
        reason: isOwner 
          ? (simulationMode === 'off' ? 'owner_bypass' : `owner_simulation_${simulationMode}`)
          : entitlement.accessSource,
        staleClosureBlocked: true,
        effectDepsIncludeEntitlement: true,
      })
      
      // Load athlete-profile module dynamically
      try {
        console.log('[OnboardingCompleteClient] Loading athlete-profile module...')
        const athleteModule = await import('@/lib/athlete-profile')
        
        try {
          loadedProfile = athleteModule.getOnboardingProfile()
          if (loadedProfile) {
            console.log('[OnboardingCompleteClient] Profile loaded (normalized):', {
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
            setProfile(loadedProfile)
            
            // Calculate readiness scores
            try {
              const scores = athleteModule.calculateReadinessScores(loadedProfile)
              setReadiness(scores)
              console.log('[OnboardingCompleteClient] Readiness calculated')
            } catch (err) {
              console.error('[OnboardingCompleteClient] calculateReadinessScores failed:', err)
              setReadiness(null)
            }
          }
        } catch (err) {
          console.error('[OnboardingCompleteClient] getOnboardingProfile failed:', err)
        }
        
        console.log('[OnboardingCompleteClient] athlete-profile module loaded successfully')
      } catch (err) {
        console.error('[OnboardingCompleteClient] Failed to load athlete-profile module:', err)
        setProfile(null)
        setReadiness(null)
      }
      
      // Load pricing module dynamically
      try {
        const pricingModule = await import('@/lib/billing/pricing')
        setPricingData(pricingModule.PRICING)
        console.log('[OnboardingCompleteClient] Pricing module loaded successfully')
      } catch (err) {
        console.error('[OnboardingCompleteClient] Failed to load pricing module:', err)
        setPricingData(null)
      }
      
      return { localIsPro, localIsTrial, localTrialDays, loadedProfile }
    }
    
    // CRITICAL: Generate the program from onboarding data
    const generateProgram = async () => {
      // =======================================================================
      // IDEMPOTENCY CHECK: Prevent duplicate generation
      // =======================================================================
      // Check 1: In-memory ref guard (handles React strict mode double-mount)
      if (generationAttemptedRef.current) {
        console.log('[OnboardingCompleteClient] IDEMPOTENCY: Generation already attempted in this mount cycle, skipping')
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
              console.log('[OnboardingCompleteClient] IDEMPOTENCY: Generation already completed in this session, showing ready state')
              setGenerationSkipped(true)
              setStep('ready')
              return
            }
          }
        }
      } catch (err) {
        console.error('[OnboardingCompleteClient] Session token check failed (non-fatal):', err)
      }
      
      console.log('[OnboardingCompleteClient] IDEMPOTENCY: Fresh generation starting')
      
      // [PHASE 16A TASK 4] Start generation timer
      const genStartTime = Date.now()
      setGenerationStartTime(genStartTime)
      setIsSlowGeneration(false)
      setStatusMessage(STATUS_MESSAGES[0])
      
      console.log('[phase16a-generation-start-audit]', {
        startTime: genStartTime,
        timestamp: new Date(genStartTime).toISOString(),
      })
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        // =======================================================================
        // DYNAMIC IMPORT: Load generation module at runtime
        // =======================================================================
        console.log('[OnboardingCompleteClient] Loading onboarding-service module...')
        const onboardingModule = await import('@/lib/onboarding-service')
        console.log('[OnboardingCompleteClient] onboarding-service module loaded successfully')
        
        // This saves the program to canonical storage (spartanlab_adaptive_programs)
        // AND to backward-compatible storage (spartanlab_first_program)
        const result = onboardingModule.generateFirstProgram()
        setProgramResult(result)
        
        if (result.success && result.program) {
          // VERIFICATION STEP: Confirm program is actually readable from canonical storage
          // This prevents routing to first-session if save didn't work
          const { getProgramState } = await import('@/lib/program-state')
          const verificationState = getProgramState()
          
          if (!verificationState.hasUsableWorkoutProgram) {
            console.error('[OnboardingCompleteClient] Program saved but not readable from program-state')
            setErrorMessage('Program was created but could not be verified. Please try again.')
            setStep('error')
            return
          }
          
          console.log('[OnboardingCompleteClient] Verification passed, program ready for dashboard')
          
          // IDEMPOTENCY: Mark generation as completed in session storage
          // This prevents duplicate generation if user navigates back to this page
          try {
            sessionStorage.setItem(GENERATION_SESSION_KEY, JSON.stringify({
              completed: true,
              timestamp: Date.now(),
            }))
            console.log('[OnboardingCompleteClient] Session token set for idempotency')
          } catch (err) {
            console.error('[OnboardingCompleteClient] Failed to set session token (non-fatal):', err)
          }
          
          // Track analytics - non-blocking, wrapped so failures don't crash the route
          try {
            const analyticsModule = await import('@/lib/analytics')
            analyticsModule.trackSignupCompleted()
            analyticsModule.trackProgramGenerated('onboarding', bootstrapData?.loadedProfile?.primaryGoal)
            console.log('[OnboardingCompleteClient] Analytics tracked successfully')
          } catch (analyticsErr) {
            console.error('[OnboardingCompleteClient] Analytics failed (non-fatal):', analyticsErr)
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
            console.error('[OnboardingCompleteClient] Failed to create program history:', err)
          })
          
          console.log('[OnboardingCompleteClient] SUCCESS: Setting step to ready', { 
            isPro: bootstrapData?.localIsPro, 
            isTrial: bootstrapData?.localIsTrial, 
            sessionCount: verificationState.sessionCount,
            branch: bootstrapData?.localIsPro ? 'pro-success' : 'free-preview'
          })
          setStep('ready')
        } else {
          console.error('[OnboardingCompleteClient] Generation failed:', result.error)
          setErrorMessage(result.error || 'Failed to generate program')
          setStep('error')
        }
      } catch (err) {
        console.error('[OnboardingCompleteClient] Exception during generation:', err)
        setErrorMessage(String(err))
        setStep('error')
      }
    }
    
    // Chain: bootstrap first, then generate
    let bootstrapData: { localIsPro: boolean; localIsTrial: boolean; localTrialDays: number; loadedProfile: OnboardingProfile | null } | null = null
    
    const run = async () => {
      bootstrapData = await bootstrap()
      await generateProgram()
    }
    
    run()
  // [PHASE 14D] Proper dependencies - NOT empty array
  // This ensures we re-run bootstrap when canonical entitlement state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEntitlementReady, ownerLoaded, isOwner, simulationMode, entitlement.hasProAccess, entitlement.isLoading])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Note: readiness is now computed during bootstrap and stored in state
  // No render-time calculation needed

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

  // =======================================================================
  // [PHASE 14C TASK 5] ENTITLEMENT READY GATE
  // Prevent premature branch decisions before owner/entitlement state resolves
  // =======================================================================
  if (!isEntitlementReady) {
    // [PHASE 14C] Audit: Log that we're gating
    console.log('[phase14c-entitlement-ready-gate-audit]', {
      gateActive: true,
      ownerLoaded,
      entitlementLoading: entitlement.isLoading,
      preventedPrematureFreeRender: true,
    })
    
    // Show neutral loading state - NOT the free preview
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="bg-[#1A1F26] border-[#2B313A] p-8 max-w-md w-full text-center">
          <div className="animate-pulse mb-6">
            <SpartanIcon size={56} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">
            Loading...
          </h2>
          <div className="flex justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </Card>
      </div>
    )
  }
  
  // [PHASE 14C] Audit: Gate passed - no premature free branch
  console.log('[phase14c-no-premature-free-branch-verdict]', {
    gateStatus: 'passed',
    ownerLoaded: true,
    entitlementReady: true,
    finalBranch: isPro ? 'pro' : 'free',
    isOwner,
    simulationMode,
  })

  // [PHASE 16A TASK 4] Enhanced generating state with progress and slow-path handling
  if (step === 'generating') {
    const elapsedSeconds = Math.floor(generationElapsed / 1000)
    const isVerySlow = generationElapsed >= VERY_SLOW_THRESHOLD_MS
    
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
            {/* Dynamic status message */}
            <p className="text-sm text-[#A4ACB8] transition-opacity duration-300">
              {statusMessage}
            </p>
            
            {/* Slow generation warning */}
            {isSlowGeneration && !isVerySlow && (
              <p className="text-xs text-[#6B7280] mt-2">
                Still working... This can take a bit longer when processing more data.
              </p>
            )}
            
            {/* Very slow / potential hang warning */}
            {isVerySlow && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-amber-500">
                  This is taking longer than usual ({elapsedSeconds}s).
                </p>
                <p className="text-xs text-[#6B7280]">
                  If nothing happens soon, try refreshing the page.
                </p>
              </div>
            )}
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#C1121F] animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          
          {/* Show retry button for very slow generation */}
          {isVerySlow && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A] hover:text-[#E6E9EF]"
              onClick={async () => {
                console.log('[phase16a-generation-retry-safety-audit]', {
                  retryRequested: true,
                  elapsedBeforeRetry: generationElapsed,
                  clearingIdempotencyGuards: true,
                })
                
                // Reset state for retry
                setGenerationStartTime(null)
                setGenerationElapsed(0)
                setIsSlowGeneration(false)
                setStatusMessage(STATUS_MESSAGES[0])
                generationAttemptedRef.current = false
                
                // Clear session storage guard
                try {
                  sessionStorage.removeItem(GENERATION_SESSION_KEY)
                } catch {
                  // Ignore
                }
                
                // Force a page reload for clean retry
                window.location.reload()
              }}
            >
              Retry Generation
            </Button>
          )}
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
                console.log('[OnboardingCompleteClient] RETRY: User explicitly requested retry')
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
                  // =======================================================================
                  // DYNAMIC IMPORT: Load generation module for retry
                  // =======================================================================
                  const onboardingModule = await import('@/lib/onboarding-service')
                  const result = onboardingModule.generateFirstProgram()
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
                      
                      // Track analytics for retry success
                      try {
                        const analyticsModule = await import('@/lib/analytics')
                        analyticsModule.trackSignupCompleted()
                        analyticsModule.trackProgramGenerated('onboarding-retry', profile?.primaryGoal)
                      } catch (analyticsErr) {
                        console.error('[OnboardingCompleteClient] Retry analytics failed:', analyticsErr)
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
    // [PHASE 14B] Audit: Log the owner branch decision
    console.log('[phase14b-onboarding-owner-branch-verdict]', {
      isOwner,
      simulationMode,
      entitlementResult: 'pro',
      branchChosen: 'pro-success',
      reason: isOwner && simulationMode === 'off' 
        ? 'owner_bypass' 
        : isOwner 
          ? `owner_simulation_${simulationMode}` 
          : 'regular_pro',
    })
    console.log('[OnboardingCompleteClient] BRANCH: pro success', { isTrial, trialDays })
    
    // [PHASE 14B TASK 5] Get truthful adaptive display labels
    const scheduleLabel = getCompactScheduleLabel(
      profile?.scheduleMode,
      profile?.trainingDaysPerWeek
    )
    const durationLabel = getCompactDurationLabel(
      profile?.sessionDurationMode,
      profile?.sessionLengthMinutes
    )
    
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
            {/* [PHASE 14B TASK 5] Truthful adaptive display */}
            <p className="text-sm text-[#6B7280] mt-1">
              {scheduleLabel} {durationLabel ? `\u2022 ${durationLabel}` : ''}
            </p>
          </div>
          
          <Button 
            onClick={() => {
              console.log('[OnboardingCompleteClient] Navigating to first-session (replace)')
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
              console.log('[OnboardingCompleteClient] Navigating to dashboard (replace)')
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
  // [PHASE 14B] Audit: Log the free branch decision
  console.log('[phase14b-onboarding-owner-branch-verdict]', {
    isOwner,
    simulationMode,
    entitlementResult: 'free',
    branchChosen: 'free-preview',
    reason: isOwner && simulationMode === 'free' 
      ? 'owner_simulation_free' 
      : 'regular_free',
  })
  console.log('[OnboardingCompleteClient] BRANCH: free preview', {
    hasProfile: !!profile,
    hasSelectedSkills: Array.isArray(profile?.selectedSkills),
    hasReadiness: !!readiness,
    primaryGoal: profile?.primaryGoal ?? 'none',
  })
  
  // [PHASE 14B TASK 5] Get truthful adaptive display labels for free branch
  const scheduleLabel = getCompactScheduleLabel(
    profile?.scheduleMode,
    profile?.trainingDaysPerWeek
  )
  const durationLabel = getCompactDurationLabel(
    profile?.sessionDurationMode,
    profile?.sessionLengthMinutes
  )
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

            {/* Training Schedule - [PHASE 14B TASK 5] Truthful adaptive display */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#4F6D8A]/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#4F6D8A]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Schedule</p>
                <p className="text-[#E6E9EF]">
                  {scheduleLabel}
                  {durationLabel && ` \u2022 ${durationLabel}`}
                </p>
              </div>
            </div>

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
              <span className="text-sm text-[#6B7280]">Then {pricingData?.pro?.displayWithPeriod || '$19.99/month'}</span>
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
              console.log('[OnboardingCompleteClient] Free user navigating to first-session (replace)')
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
