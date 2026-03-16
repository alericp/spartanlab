'use client'

import { useState, useEffect } from 'react'
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
  Timer,
  ChevronRight,
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { getOnboardingProfile, calculateReadinessScores } from '@/lib/athlete-profile'
import { hasProAccess, isInTrial, getTrialDaysRemaining } from '@/lib/feature-access'
import { PRICING, TRIAL } from '@/lib/billing/pricing'

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

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [trialDays, setTrialDays] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<ReturnType<typeof getOnboardingProfile> | null>(null)

  useEffect(() => {
    setMounted(true)
    setIsPro(hasProAccess())
    setIsTrial(isInTrial())
    setTrialDays(getTrialDaysRemaining())
    setProfile(getOnboardingProfile())
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Calculate readiness if profile exists
  const readiness = profile ? calculateReadinessScores(profile) : null

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
      // Use canonical checkout path - no body params needed
      // Route uses PRICING.pro.trialDays and env vars for all config
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.error) {
        console.error('Checkout error:', data.error)
        // If authentication failed, redirect to sign-in with return URL
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

  // If already Pro, show success and go to dashboard
  if (isPro) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-3">
            Your Program is Ready!
          </h1>
          
          <p className="text-[#A4ACB8] mb-2">
            We've built a personalized training program based on your goals and current abilities.
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
            {profile?.trainingDaysPerWeek && (
              <p className="text-sm text-[#6B7280] mt-1">
                {profile.trainingDaysPerWeek} training days per week
              </p>
            )}
          </div>
          
          <Link href="/workout/session">
            <Button className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white py-6 text-lg font-medium">
              Start First Workout
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          
          <Link href="/dashboard?welcome=true" className="block mt-3">
            <Button 
              variant="ghost" 
              className="w-full text-[#6B7280] hover:text-[#A4ACB8]"
            >
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Free user - show program preview with upgrade opportunity
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
            {profile?.trainingDaysPerWeek && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4F6D8A]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#4F6D8A]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Schedule</p>
                  <p className="text-[#E6E9EF]">
                    {profile.trainingDaysPerWeek} days/week
                    {profile.sessionLengthMinutes && typeof profile.sessionLengthMinutes === 'number' && ` • ${profile.sessionLengthMinutes} min sessions`}
                  </p>
                </div>
              </div>
            )}

            {/* Readiness Summary */}
            {readiness && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Your Readiness</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-[#A4ACB8]">Strength</span>
                      <span className="text-sm text-[#E6E9EF] font-medium">{readiness.strengthReadiness}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-[#A4ACB8]">Skill</span>
                      <span className="text-sm text-[#E6E9EF] font-medium">{readiness.skillReadiness}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills to Train */}
            {profile?.selectedSkills && profile.selectedSkills.length > 0 && (
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
                      return labels[s] || s
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
          <Link href="/workout/session">
            <Button
              variant="ghost"
              className="text-[#6B7280] hover:text-[#A4ACB8] hover:bg-transparent"
            >
              Start Free Workout
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <p className="text-xs text-[#4A5568] mt-2">
            You can upgrade anytime from Settings
          </p>
        </div>
      </div>
    </div>
  )
}
