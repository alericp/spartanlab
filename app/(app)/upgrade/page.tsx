'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Check, 
  Brain, 
  Activity, 
  TrendingUp, 
  Zap,
  Sparkles,
  ArrowLeft,
  Shield,
  Target,
  BarChart3,
  Dumbbell,
} from 'lucide-react'
import { PREMIUM_FEATURES, type PremiumFeatureId } from '@/components/premium/PremiumFeature'
import { trackUpgradeStarted, trackUpgradeCompleted } from '@/lib/analytics'
import { PRICING, TRIAL } from '@/lib/billing/pricing'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { useOwnerBootstrap } from '@/components/providers/OwnerBootstrapProvider'
import { useEntitlement } from '@/hooks/useEntitlement'

const FREE_FEATURES = [
  'Workout generation & logging',
  'Skill progress tracking',
  'Training history & logging',
  'Basic program builder',
  'Free calculators & tools',
  'Training guides',
]

const PRO_FEATURE_IDS: PremiumFeatureId[] = [
  'adaptive-engine',
  'fatigue-intelligence',
  'daily-adjustments',
  'progress-forecast',
  'advanced-insights',
  'deload-detection',
]

// Key value highlights for the upgrade page
const VALUE_HIGHLIGHTS = [
  {
    icon: Brain,
    title: 'Skill Readiness Analysis',
    description: 'Component-level analysis of what specifically limits your front lever, planche, or muscle-up progress.',
  },
  {
    icon: BarChart3,
    title: 'Constraint Detection Engine',
    description: 'Identifies strength gaps, mobility deficits, or stability needs blocking your skill development.',
  },
  {
    icon: Target,
    title: 'Adaptive Program Generation',
    description: 'Programs that evolve based on readiness, performance response, and fatigue signals.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Envelope Learning',
    description: 'The engine learns your optimal rep ranges, volume tolerance, and fatigue thresholds.',
  },
  {
    icon: Activity,
    title: 'Joint Integrity Protocols',
    description: 'Durability work for wrists, elbows, shoulders, and scapulae integrated into every session.',
  },
  {
    icon: Zap,
    title: 'Training Style Personalization',
    description: 'Skill-focused, strength-focused, or hypertrophy-supported approaches while preserving progression logic.',
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // [PHASE 14C TASK 2] Use canonical useEntitlement hook as single source of truth
  const entitlement = useEntitlement()
  const ownerState = useOwnerBootstrap()
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  
  // [PHASE 14C TASK 4] Derive state from canonical entitlement hook
  const isPro = entitlement.hasProAccess
  const isTrial = entitlement.isTrialing
  const trialDays = 0 // Trial days would need API enhancement
  
  // Derive owner bypass: owner with simulation off = bypass checkout
  const isOwnerBypassActive = ownerState.isOwner && ownerState.simulationMode === 'off'
  // Derive if owner is intentionally simulating free state
  const isOwnerSimulatingFree = ownerState.isOwner && ownerState.simulationMode === 'free'
  
  // [PHASE 14C TASK 5] Gate: wait for entitlement to be ready
  const isEntitlementReady = ownerState.isLoaded && !entitlement.isLoading

  useEffect(() => {
    setMounted(true)
    
    // [PHASE 14C] Owner route branch audit
    console.log('[phase14c-owner-route-branch-audit]', {
      route: '/upgrade',
      ownerVerdict: ownerState.isOwner,
      simulationMode: ownerState.simulationMode,
      ownerBypassActive: isOwnerBypassActive,
      entitlementHasProAccess: entitlement.hasProAccess,
      entitlementAccessSource: entitlement.accessSource,
      checkoutOffered: !isOwnerBypassActive && !isPro,
    })
    
    // [PHASE 14C TASK 4] Checkout prevention audit
    console.log('[phase14c-owner-checkout-prevention-verdict]', {
      isOwner: ownerState.isOwner,
      simulationMode: ownerState.simulationMode,
      checkoutPrevented: isOwnerBypassActive,
      reason: isOwnerBypassActive 
        ? 'owner_bypass_active' 
        : ownerState.isOwner && ownerState.simulationMode === 'free'
          ? 'owner_intentionally_simulating_free'
          : 'regular_user_or_pro',
      verdict: isOwnerBypassActive 
        ? 'checkout_bypassed_for_owner' 
        : 'checkout_available',
    })
  }, [ownerState, entitlement, isOwnerBypassActive, isPro])

const handleUpgrade = async () => {
    // Wait for auth to fully load before making any decisions
    if (!isAuthLoaded) {
      // Auth still loading - show loading state and wait
      setIsLoading(true)
      return
    }
    
    // If not authenticated, redirect to sign-in with return URL
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/upgrade')
      return
    }

    // User is authenticated - proceed directly to checkout
    setIsLoading(true)
    trackUpgradeStarted('upgrade_page')
    
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
      })

      const data = await res.json()

      if (data.error) {
        if (res.status === 401) {
          // Session expired or invalid - redirect to sign-in
          router.push('/sign-in?redirect_url=/upgrade')
          return
        }
        toast.error('Failed to start checkout. Please try again.')
        console.error('Checkout error:', data.error)
        setIsLoading(false)
        return
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (error) {
console.error('Checkout error:', error)
    toast.error('Unable to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  // [PHASE 14B TASK 4] Show owner bypass state only when simulation is off
  // When owner simulates free, fall through to show upgrade page
  if (isOwnerBypassActive) {
    console.log('[phase14b-owner-checkout-bypass-verdict]', {
      verdict: 'owner_bypass_active',
      showingOwnerPage: true,
      checkoutOffered: false,
    })
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#E6E9EF] mb-2">Owner Account</h1>
          <p className="text-[#A4ACB8] mb-2">Subscription not required.</p>
          <p className="text-sm text-[#6B7280] mb-6">All Pro features are unlocked for your account.</p>
          <Link href="/dashboard">
            <Button className="bg-[#C1121F] hover:bg-[#9A0F19] text-white">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }
  
  // Show success state if already pro (including trial)
  if (isPro) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
            {isTrial ? (
              <Sparkles className="w-8 h-8 text-amber-400" />
            ) : (
              <Crown className="w-8 h-8 text-amber-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#E6E9EF] mb-2">
            {isTrial ? 'Your Pro Trial is Active!' : "You're on SpartanLab Pro!"}
          </h1>
          <p className="text-[#A4ACB8] mb-2">All advanced features are now unlocked.</p>
          {isTrial && trialDays > 0 && (
            <p className="text-sm text-[#6B7280] mb-4">
              {trialDays} day{trialDays !== 1 ? 's' : ''} remaining in your trial.
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="bg-[#C1121F] hover:bg-[#9A0F19] text-white">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="border-[#3A4553] text-[#A4ACB8] hover:bg-[#1A1F26]">
                Manage Billing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <div className="border-b border-[#2B313A]/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6">
            <Crown className="w-4 h-4" />
            SpartanLab Pro
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF] mb-4 text-balance">
            Unlock Full Training Intelligence
          </h1>
          <p className="text-xl text-[#A4ACB8] max-w-2xl mx-auto mb-6 text-balance">
            Adaptive programming that evolves with your performance. Built from real training methodologies.
          </p>
        </div>

        {/* Value Explanation */}
        <div className="max-w-3xl mx-auto mb-16">
          <Card className="bg-[#1A1F26]/50 border-[#2B313A] p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/30 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Analysis, Not Automation</h2>
                <p className="text-[#A4ACB8] leading-relaxed">
                  SpartanLab Pro analyzes your performance to build structured training programs. It identifies what limits your progress and adjusts programming based on real training data.
                </p>
              </div>
            </div>
            <p className="text-[#6B7280] text-sm pl-14">
              Programs adapt based on fatigue signals, performance trends, and recovery patterns. Designed for long-term performance, not quick fixes.
            </p>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold text-[#E6E9EF] text-center mb-8">
            What You Get with Pro
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALUE_HIGHLIGHTS.map((highlight, i) => {
              const Icon = highlight.icon
              return (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-[#1A1F26]/30 border border-[#2B313A]/50">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">{highlight.title}</h3>
                    <p className="text-xs text-[#6B7280] leading-relaxed">{highlight.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pricing Comparison */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold text-[#E6E9EF] text-center mb-8">
            Choose Your Plan
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#E6E9EF] mb-2">Free</h2>
              <p className="text-sm text-[#A4ACB8]">Essential tracking for your training</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-[#E6E9EF]">$0</span>
              <span className="text-[#6B7280]">/month</span>
            </div>

            <ul className="space-y-3 mb-6">
              {FREE_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#A4ACB8]">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button variant="outline" className="w-full border-[#3A4553] text-[#A4ACB8]" disabled>
              Current Plan
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="relative bg-gradient-to-br from-[#1A1F26] to-amber-500/5 border-amber-500/30 p-6 overflow-hidden">
            {/* Popular badge */}
            <Badge className="absolute top-4 right-4 bg-amber-500 text-black font-semibold">
              Most Popular
            </Badge>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-[#E6E9EF]">Pro</h2>
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm text-[#A4ACB8]">Full adaptive training intelligence</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-[#E6E9EF]">{PRICING.pro.display}</span>
              <span className="text-[#6B7280]">/month</span>
              <p className="text-xs text-[#6B7280] mt-1">Full access to adaptive training intelligence</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3 text-sm text-[#A4ACB8]">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                Everything in Free
              </li>
              {PRO_FEATURE_IDS.map((featureId) => {
                const feature = PREMIUM_FEATURES[featureId]
                return (
                  <li key={featureId} className="flex items-start gap-3 text-sm text-[#E6E9EF]">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    {feature.title}
                  </li>
                )
              })}
            </ul>

            <Button 
              onClick={handleUpgrade}
              disabled={isLoading || !isAuthLoaded}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold disabled:opacity-50"
            >
              {isLoading || !isAuthLoaded ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {!isAuthLoaded ? 'Loading...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  {TRIAL.ctaText}
                </>
              )}
            </Button>
            <p className="text-xs text-center text-[#6B7280] mt-3">
              {TRIAL.explanation}
            </p>
          </Card>
          </div>
        </div>

        {/* Feature Details */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold text-[#E6E9EF] text-center mb-8">
            Pro Features in Detail
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRO_FEATURE_IDS.map((featureId) => {
              const feature = PREMIUM_FEATURES[featureId]
              const Icon = feature.icon
              return (
                <Card key={featureId} className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-[#E6E9EF] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#A4ACB8] mb-3">{feature.description}</p>
                  <ul className="space-y-1.5">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-[#6B7280]">
                        <Check className="w-3 h-3 text-amber-400/70" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Trust Section */}
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-[#1A1F26]/30 border-[#2B313A]/50 p-6">
            <p className="text-[#A4ACB8] mb-4">
              SpartanLab is designed for serious calisthenics athletes who want smarter training decisions without guesswork.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[#6B7280]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Secure payment via Stripe
              </div>
              <span className="hidden sm:inline text-[#3A4553]">|</span>
              <div>Cancel anytime, no questions asked</div>
            </div>
            <p className="text-xs text-[#6B7280] mt-4">
              By subscribing, you agree to our{' '}
              <Link href="/terms" className="text-[#A4ACB8] hover:text-[#E6E9EF] underline underline-offset-2">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#A4ACB8] hover:text-[#E6E9EF] underline underline-offset-2">Privacy Policy</Link>
              . Billing questions?{' '}
              <a href="mailto:billing@spartanlab.app" className="text-[#A4ACB8] hover:text-[#E6E9EF] underline underline-offset-2">billing@spartanlab.app</a>
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
