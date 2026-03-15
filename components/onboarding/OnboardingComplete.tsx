'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  CheckCircle2, 
  Target, 
  Dumbbell, 
  TrendingUp,
  Sparkles,
  ArrowRight,
  Calendar,
  Zap,
  Trophy,
  BarChart3,
  RefreshCcw,
  Crown,
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { TRIAL, PRICING } from '@/lib/billing/pricing'
import { hasProAccess } from '@/lib/feature-access'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import { generateFirstProgram, type FirstRunResult } from '@/lib/onboarding-service'
import { calculateSpartanScore } from '@/lib/strength-score-engine'

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingCompleteProps {
  onContinue?: () => void
}

// =============================================================================
// PRO FEATURES LIST
// =============================================================================

const PRO_FEATURES = [
  {
    icon: RefreshCcw,
    title: 'Adaptive Programming',
    description: 'Training that adjusts to your progress, fatigue, and recovery',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Deep insights into your strength, skills, and consistency',
  },
  {
    icon: Trophy,
    title: 'Spartan Score Tracking',
    description: 'Unified performance metric combining all your training data',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Progression Logic',
    description: 'Smart skill and strength progressions that accelerate results',
  },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function OnboardingComplete({ onContinue }: OnboardingCompleteProps) {
  const router = useRouter()
  const [step, setStep] = useState<'generating' | 'readiness' | 'upgrade' | 'ready'>('generating')
  const [programResult, setProgramResult] = useState<FirstRunResult | null>(null)
  const [spartanScore, setSpartanScore] = useState<number | null>(null)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    // Check Pro status
    setIsPro(hasProAccess())

    // Generate program
    const generateProgram = async () => {
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      const result = generateFirstProgram()
      setProgramResult(result)
      
      // Calculate initial Spartan Score
      const score = calculateSpartanScore()
      setSpartanScore(score.totalScore)
      
      // Show readiness for 2 seconds
      setStep('readiness')
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // If already Pro, skip upgrade step
      if (hasProAccess()) {
        setStep('ready')
      } else {
        setStep('upgrade')
      }
    }
    
    generateProgram()
  }, [])

  const handleStartTraining = () => {
    if (onContinue) {
      onContinue()
    } else {
      router.push('/dashboard')
    }
  }

  const handleStartTrial = () => {
    router.push('/upgrade')
  }

  // Generating step
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
          <p className="text-sm text-[#6B7280] mb-6">
            Calibrating the adaptive training engine...
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#C1121F] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  // Readiness analysis step
  if (step === 'readiness') {
    const profile = getOnboardingProfile()
    
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="bg-[#1A1F26] border-[#2B313A] p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#C1121F]/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#E6E9EF]">
                Profile Analyzed
              </h2>
              <p className="text-sm text-[#6B7280]">
                Here's what we found
              </p>
            </div>
          </div>

          {/* Readiness insights */}
          <div className="space-y-3 mb-6">
            {profile?.selectedSkills.slice(0, 2).map(skill => (
              <div key={skill} className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C1121F]" />
                  <span className="text-sm font-medium text-[#E6E9EF] capitalize">
                    {skill.replace('_', ' ')} Training
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  Progression path identified based on your benchmarks
                </p>
              </div>
            ))}
            
            {spartanScore !== null && (
              <div className="bg-gradient-to-r from-[#C1121F]/10 to-transparent rounded-lg p-3 border border-[#C1121F]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C1121F]" />
                    <span className="text-sm font-medium text-[#E6E9EF]">
                      Starting Spartan Score
                    </span>
                  </div>
                  <span className="text-lg font-bold text-[#C1121F]">
                    {spartanScore}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  Your baseline performance metric — watch it grow!
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#C1121F] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  // Upgrade decision step
  if (step === 'upgrade') {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 max-w-lg w-full">
          {/* Program ready header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#E6E9EF]">
                Your Program Is Ready
              </h2>
              <p className="text-sm text-[#6B7280]">
                Personalized for your goals
              </p>
            </div>
          </div>

          {/* Program summary */}
          {programResult?.program && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#0F1115] rounded-lg p-3 text-center border border-[#2B313A]">
                <Calendar className="w-4 h-4 text-[#4F6D8A] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#E6E9EF]">
                  {programResult.program.trainingDaysPerWeek}
                </p>
                <p className="text-xs text-[#6B7280]">Days/Week</p>
              </div>
              <div className="bg-[#0F1115] rounded-lg p-3 text-center border border-[#2B313A]">
                <Target className="w-4 h-4 text-[#C1121F] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#E6E9EF] capitalize truncate">
                  {programResult.program.goalLabel.split(' ')[0]}
                </p>
                <p className="text-xs text-[#6B7280]">Focus</p>
              </div>
              <div className="bg-[#0F1115] rounded-lg p-3 text-center border border-[#2B313A]">
                <Dumbbell className="w-4 h-4 text-[#4F6D8A] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#E6E9EF]">
                  {programResult.program.sessions.length}
                </p>
                <p className="text-xs text-[#6B7280]">Sessions</p>
              </div>
            </div>
          )}

          {/* Pro upgrade value proposition */}
          <div className="bg-gradient-to-br from-[#C1121F]/10 to-transparent rounded-xl p-4 border border-[#C1121F]/20 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-[#C1121F]" />
              <h3 className="text-base font-semibold text-[#E6E9EF]">
                Unlock Your Full Potential
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {PRO_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <feature.icon className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#E6E9EF]">{feature.title}</p>
                    <p className="text-xs text-[#6B7280]">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trial CTA */}
            <Button
              onClick={handleStartTrial}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white mb-2"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {TRIAL.ctaText}
            </Button>
            <p className="text-xs text-center text-[#6B7280]">
              {TRIAL.explanationShort} • {PRICING.pro.displayWithPeriod} after trial.
            </p>
          </div>

          {/* Continue without Pro */}
          <button
            onClick={handleStartTraining}
            className="w-full text-center text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors py-2"
          >
            Continue with Free Plan
            <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        </Card>
      </div>
    )
  }

  // Ready to train step (for Pro users or after skipping upgrade)
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      <Card className="bg-[#1A1F26] border-[#2B313A] p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-[#E6E9EF] mb-2">
          You're All Set!
        </h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Your personalized training program is ready. Let's start your first session.
        </p>

        {spartanScore !== null && (
          <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2B313A] mb-6">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
              Starting Spartan Score
            </p>
            <p className="text-3xl font-bold text-[#C1121F]">{spartanScore}</p>
          </div>
        )}

        <Button
          onClick={handleStartTraining}
          className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
          size="lg"
        >
          <Dumbbell className="w-4 h-4 mr-2" />
          Start Training
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    </div>
  )
}
