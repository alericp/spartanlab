'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  BookOpen,
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { TRIAL, PRICING } from '@/lib/billing/pricing'
import { hasProAccess } from '@/lib/feature-access'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import { generateFirstProgram, getProgramReasoning, type FirstRunResult, type ProgramReasoning } from '@/lib/onboarding-service'
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
    title: 'Adaptive Program Generation',
    description: 'Training that evolves based on skill readiness, constraints, and performance response',
  },
  {
    icon: BarChart3,
    title: 'Constraint Detection Engine',
    description: 'Identifies the specific factors limiting your skill progress',
  },
  {
    icon: Trophy,
    title: 'Joint Integrity Protocols',
    description: 'Durability work integrated into every session to protect your joints',
  },
  {
    icon: TrendingUp,
    title: 'Performance Envelope Learning',
    description: 'The engine learns your optimal rep ranges, volume tolerance, and fatigue thresholds',
  },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function OnboardingComplete({ onContinue }: OnboardingCompleteProps) {
  const router = useRouter()
  const [step, setStep] = useState<'generating' | 'readiness' | 'upgrade' | 'ready'>('generating')
  const [programResult, setProgramResult] = useState<FirstRunResult | null>(null)
  const [programReasoning, setProgramReasoning] = useState<ProgramReasoning | null>(null)
  const [spartanScore, setSpartanScore] = useState<number | null>(null)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    // Check Pro status
    setIsPro(hasProAccess())

    // Generate program with error handling
    const generateProgram = async () => {
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      try {
        const result = generateFirstProgram()
        setProgramResult(result)
        
        if (!result.success || !result.program) {
          console.error('[OnboardingComplete] Generation failed:', result.error)
          // Still continue to allow user to retry or use demo
          setStep('ready')
          return
        }
        
        // Generate program reasoning
        const reasoning = getProgramReasoning(result.program)
        setProgramReasoning(reasoning)
        
        // Calculate initial Spartan Score
        const score = calculateSpartanScore()
        setSpartanScore(score.totalScore)
        
        // Create program history entry via API (if authenticated)
        // This runs in background - don't block the UI flow
        fetch('/api/program/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program: result.program,
            isInitial: true,
            reason: 'onboarding_initial_generation',
          }),
        }).catch(err => {
          // Silent fail - history will be created later if needed
          console.error('[OnboardingComplete] Failed to create program history:', err)
        })
        
        // Show readiness for 2 seconds
        setStep('readiness')
        await new Promise(resolve => setTimeout(resolve, 2500))
        
        // If already Pro, skip upgrade step
        if (hasProAccess()) {
          setStep('ready')
        } else {
          setStep('upgrade')
        }
      } catch (err) {
        console.error('[OnboardingComplete] Caught exception:', err)
        // Still allow user to continue
        setStep('ready')
      }
    }
    
    generateProgram()
  }, [])

  const handleStartTraining = () => {
    if (onContinue) {
      onContinue()
    } else {
      // Route directly to first session ready page for immediate training
      router.push('/first-session?from=onboarding')
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
            Analyzing Your Profile
          </h2>
          <div className="space-y-1.5 mb-6">
            <p className="text-sm text-[#A4ACB8]">
              Reading your strength benchmarks...
            </p>
            <p className="text-sm text-[#6B7280]">
              Designing your starting program
            </p>
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

  // Readiness analysis step
  if (step === 'readiness') {
    const profile = getOnboardingProfile()
    
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#C1121F]/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6E9EF]">
                Profile Analyzed
              </h2>
              <p className="text-sm text-[#6B7280]">
                Building your personalized program
              </p>
            </div>
          </div>

          {/* Detected athlete insights */}
          <div className="space-y-2.5 mb-5">
            {/* Strength level */}
            {programReasoning?.detectedStrength && (
              <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell className="w-3.5 h-3.5 text-[#4F6D8A]" />
                  <span className="text-xs text-[#6B7280] uppercase tracking-wide">Strength Level</span>
                </div>
                <p className="text-sm font-medium text-[#E6E9EF]">
                  {programReasoning.detectedStrength.label}
                </p>
                {programReasoning.detectedStrength.detail && (
                  <p className="text-xs text-[#A4ACB8] mt-0.5">
                    {programReasoning.detectedStrength.detail}
                  </p>
                )}
              </div>
            )}
            
            {/* Detected skills */}
            {programReasoning?.detectedSkills && programReasoning.detectedSkills.length > 0 && (
              <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3.5 h-3.5 text-[#C1121F]" />
                  <span className="text-xs text-[#6B7280] uppercase tracking-wide">Current Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {programReasoning.detectedSkills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#C1121F]/10 rounded text-xs text-[#E6E9EF]">
                      {s.skill}: {s.level}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Skill interests (if no detected skills) */}
            {(!programReasoning?.detectedSkills || programReasoning.detectedSkills.length === 0) && 
              profile?.selectedSkills && profile.selectedSkills.length > 0 && (
              <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3.5 h-3.5 text-[#C1121F]" />
                  <span className="text-xs text-[#6B7280] uppercase tracking-wide">Skill Focus</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.selectedSkills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-[#C1121F]/10 rounded text-xs text-[#E6E9EF] capitalize">
                      {skill.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Detected Development Focus */}
            {programReasoning?.weakPointSummary && programReasoning.weakPointSummary.primaryFocus !== 'balanced_development' && (
              <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3.5 h-3.5 text-[#4F6D8A]" />
                  <span className="text-xs text-[#6B7280] uppercase tracking-wide">Development Focus</span>
                </div>
                <p className="text-sm font-medium text-[#E6E9EF]">
                  {programReasoning.weakPointSummary.primaryFocusLabel}
                </p>
                <p className="text-xs text-[#A4ACB8] mt-0.5">
                  {programReasoning.weakPointSummary.primaryFocusReason}
                </p>
              </div>
            )}
            
            {/* Spartan Score */}
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
        <Card className="bg-[#1A1F26] border-[#2B313A] p-5 max-w-lg w-full">
          {/* Program ready header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6E9EF]">
                Your Program Is Ready
              </h2>
              <p className="text-sm text-[#6B7280]">
                Personalized for your goals
              </p>
            </div>
          </div>
          
          {/* Program Reasoning Summary */}
          {programReasoning && (
            <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A] mb-4">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Your Starting Focus</p>
              <div className="space-y-1.5">
                {programReasoning.strategyFocus.map((focus, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F]" />
                    <span className="text-sm text-[#E6E9EF]">{focus}</span>
                  </div>
                ))}
              </div>
              {programReasoning.weakPointSummary?.primaryFocusReason && 
               programReasoning.weakPointSummary.primaryFocus !== 'balanced_development' && (
                <p className="text-xs text-[#A4ACB8] mt-2 italic">
                  {programReasoning.weakPointSummary.primaryFocusReason}
                </p>
              )}
              <p className="text-xs text-[#6B7280] mt-2">
                {programReasoning.volumeLevel}
              </p>
            </div>
          )}

          {/* Program summary */}
          {programResult?.program && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#0F1115] rounded-lg p-2.5 text-center border border-[#2B313A]">
                <Calendar className="w-3.5 h-3.5 text-[#4F6D8A] mx-auto mb-1" />
                <p className="text-base font-bold text-[#E6E9EF]">
                  {programResult.program.trainingDaysPerWeek}
                </p>
                <p className="text-[10px] text-[#6B7280]">Days/Week</p>
              </div>
              <div className="bg-[#0F1115] rounded-lg p-2.5 text-center border border-[#2B313A]">
                <Target className="w-3.5 h-3.5 text-[#C1121F] mx-auto mb-1" />
                <p className="text-base font-bold text-[#E6E9EF] capitalize truncate">
                  {programResult.program.goalLabel.split(' ')[0]}
                </p>
                <p className="text-[10px] text-[#6B7280]">Focus</p>
              </div>
              <div className="bg-[#0F1115] rounded-lg p-2.5 text-center border border-[#2B313A]">
                <Dumbbell className="w-3.5 h-3.5 text-[#4F6D8A] mx-auto mb-1" />
                <p className="text-base font-bold text-[#E6E9EF]">
                  {programResult.program.sessions.length}
                </p>
                <p className="text-[10px] text-[#6B7280]">Sessions</p>
              </div>
            </div>
          )}
          
          {/* First Session Preview */}
          {programReasoning?.firstSession && (
            <div className="bg-gradient-to-r from-[#C1121F]/10 to-transparent rounded-lg p-3 border border-[#C1121F]/20 mb-4">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">First Spartan Session</p>
              <p className="text-sm font-semibold text-[#E6E9EF] mb-1">{programReasoning.firstSession.title}</p>
              <div className="flex items-center gap-3 text-xs text-[#A4ACB8]">
                <span>{programReasoning.firstSession.estimatedMinutes} min</span>
                <span>•</span>
                <span>{programReasoning.firstSession.primaryFocus}</span>
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
      <Card className="bg-[#1A1F26] border-[#2B313A] p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#E6E9EF]">
              You're All Set!
            </h2>
            <p className="text-sm text-[#6B7280]">
              Your program is built and ready
            </p>
          </div>
        </div>
        
        {/* Why This Program Works - First Win Section */}
        <div className="bg-[#0F1115] rounded-lg p-4 border border-emerald-500/20 mb-4">
          <p className="text-xs text-emerald-400 uppercase tracking-wide font-medium mb-3">Why This Program Works For You</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-sm text-[#E6E9EF]">Built from your current strength levels</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-sm text-[#E6E9EF]">Balanced volume for sustainable recovery</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-sm text-[#E6E9EF]">Progression logic targets your primary goal</span>
            </div>
          </div>
        </div>

        {/* Program Reasoning Summary */}
        {programReasoning && (
          <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A] mb-4">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Training Strategy</p>
            <div className="space-y-1.5">
              {programReasoning.strategyFocus.map((focus, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F]" />
                  <span className="text-sm text-[#E6E9EF]">{focus}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* First Session Preview */}
        {programReasoning?.firstSession && (
          <div className="bg-gradient-to-r from-[#C1121F]/10 to-transparent rounded-lg p-4 border border-[#C1121F]/20 mb-4">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">First Spartan Session</p>
            <p className="text-base font-semibold text-[#E6E9EF] mb-1">{programReasoning.firstSession.title}</p>
            <div className="flex items-center gap-3 text-xs text-[#A4ACB8] mb-3">
              <span>{programReasoning.firstSession.estimatedMinutes} min</span>
              <span>•</span>
              <span>{programReasoning.firstSession.primaryFocus}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <Dumbbell className="w-3 h-3" />
              <span>{programReasoning.firstSession.exerciseCount} exercises</span>
            </div>
          </div>
        )}

        {spartanScore !== null && (
          <div className="flex items-center justify-between bg-[#0F1115] rounded-lg p-3 border border-[#2B313A] mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#C1121F]" />
              <span className="text-sm text-[#A4ACB8]">Starting Spartan Score</span>
            </div>
            <span className="text-xl font-bold text-[#C1121F]">{spartanScore}</span>
          </div>
        )}

        <Button
          onClick={handleStartTraining}
          className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
          size="lg"
        >
          Start First Session
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        {/* Training Systems link */}
        <Link
          href="/training-systems"
          className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          How your training is built
        </Link>
      </Card>
    </div>
  )
}
