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
import { PREMIUM_FEATURES, type PremiumFeatureId, useSubscriptionInfo, useIsOwner } from '@/components/premium/PremiumFeature'
import { upgradeToPro, startTrial, hasProAccess } from '@/lib/feature-access'
import { trackUpgradeStarted, trackUpgradeCompleted } from '@/lib/analytics'

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
    title: 'Adaptive Program Adjustments',
    description: 'Your program evolves automatically based on your performance, fatigue, and recovery signals.',
  },
  {
    icon: BarChart3,
    title: 'Deeper Performance Insights',
    description: 'See what is actually limiting your progress and how to address it.',
  },
  {
    icon: Target,
    title: 'Skill Progression Intelligence',
    description: 'Know exactly when you are ready to progress and which weak points to target.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Forecasting',
    description: 'Estimated timelines for your next skill milestone based on current progress velocity.',
  },
  {
    icon: Activity,
    title: 'Advanced Fatigue Intelligence',
    description: 'Deep fatigue analysis with recovery predictions and deload timing.',
  },
  {
    icon: Zap,
    title: 'Daily Training Adjustments',
    description: 'Personalized workout modifications based on your current readiness state.',
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const isOwner = useIsOwner()

  useEffect(() => {
    setMounted(true)
    setIsPro(hasProAccess())
  }, [])

  const handleUpgrade = () => {
    trackUpgradeStarted('upgrade_page')
    upgradeToPro()
    setIsPro(true)
    trackUpgradeCompleted('upgrade_page')
    // Redirect to dashboard after short delay
    setTimeout(() => router.push('/dashboard'), 500)
  }

  const handleStartTrial = () => {
    startTrial(7)
    setIsPro(true)
    setTimeout(() => router.push('/dashboard'), 500)
  }

  if (!mounted) return null

  // Show owner state
  if (isOwner) {
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
  
  // Show success state if already pro
  if (isPro) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#E6E9EF] mb-2">You're on SpartanLab Pro!</h1>
          <p className="text-[#A4ACB8] mb-6">All advanced features are now unlocked.</p>
          <Link href="/dashboard">
            <Button className="bg-[#C1121F] hover:bg-[#9A0F19] text-white">
              Go to Dashboard
            </Button>
          </Link>
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
            Unlock Adaptive Training Intelligence
          </h1>
          <p className="text-xl text-[#A4ACB8] max-w-2xl mx-auto mb-6 text-balance">
            See what is actually limiting your progress. Get deeper performance insights.
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
                <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Not Just Tracking. Intelligence.</h2>
                <p className="text-[#A4ACB8] leading-relaxed">
                  SpartanLab Pro transforms your training data into actionable intelligence. It identifies what is limiting your progress, when to push harder, and when to recover.
                </p>
              </div>
            </div>
            <p className="text-[#6B7280] text-sm pl-14">
              Your program adapts automatically based on fatigue signals, performance trends, and recovery patterns. Every workout is optimized for your current state.
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
              <span className="text-4xl font-bold text-[#E6E9EF]">$15</span>
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
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button 
              onClick={handleStartTrial}
              variant="outline"
              className="w-full mt-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              Start 7-Day Free Trial
            </Button>
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
