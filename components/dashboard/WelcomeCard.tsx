'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, Calendar, Target, Dumbbell, X, TrendingUp, TrendingDown, Minus, Play, ArrowRight } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import {
  getOnboardingSummary,
  getProgramReasoning,
  getFirstProgram,
  type FirstRunResult,
  type ProgramReasoning,
} from '@/lib/onboarding-service'
import { getProgramState } from '@/lib/program-state'
import { getOnboardingProfile, hasEstimatedValues } from '@/lib/athlete-profile'
import { AlertCircle } from 'lucide-react'

interface WelcomeCardProps {
  onDismiss?: () => void
  onProgramReady?: (result: FirstRunResult) => void
}

/**
 * WelcomeCard - READ-ONLY component
 * 
 * CRITICAL: This card displays an already-generated program.
 * It does NOT generate the program itself.
 * Program generation happens in /onboarding/complete/page.tsx
 */
export function WelcomeCard({ onDismiss, onProgramReady }: WelcomeCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [result, setResult] = useState<FirstRunResult | null>(null)
  const [summary, setSummary] = useState<ReturnType<typeof getOnboardingSummary>>(null)
  const [reasoning, setReasoning] = useState<ProgramReasoning | null>(null)

  useEffect(() => {
    // READ existing program state - do NOT regenerate
    const loadExistingProgram = async () => {
      setIsLoading(true)
      console.log('[WelcomeCard] Loading existing program state')
      
      // Small delay for smooth UX transition
      await new Promise(resolve => setTimeout(resolve, 300))
      
      try {
        // Get existing program from program-state (the safe unified source)
        const { adaptiveProgram, hasUsableWorkoutProgram } = getProgramState()
        console.log('[WelcomeCard] Program state:', { hasUsableWorkoutProgram, programExists: !!adaptiveProgram })
        
        if (hasUsableWorkoutProgram && adaptiveProgram) {
          // Program exists - create display result from existing data
          const displayResult: FirstRunResult = {
            success: true,
            program: adaptiveProgram,
            calibration: null, // Not needed for display
            welcomeMessage: 'Your personalized program is ready.',
          }
          setResult(displayResult)
          setSummary(getOnboardingSummary())
          setReasoning(getProgramReasoning(adaptiveProgram))
          
          if (onProgramReady) {
            onProgramReady(displayResult)
          }
        } else {
          // No valid program - show error state
          console.log('[WelcomeCard] No valid program found, showing fallback')
          setResult({
            success: false,
            program: null,
            calibration: null,
            welcomeMessage: 'No program found.',
            error: 'Program not generated yet. Please complete onboarding.',
          })
        }
      } catch (err) {
        console.error('[WelcomeCard] Error loading program:', err)
        setResult({
          success: false,
          program: null,
          calibration: null,
          welcomeMessage: 'Error loading program.',
          error: 'An error occurred while loading your program.',
        })
      }
      
      setIsLoading(false)
    }
    
    loadExistingProgram()
  }, [onProgramReady])

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-6 relative overflow-hidden">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-pulse mb-4">
            <SpartanIcon size={48} />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
            Loading Your Program
          </h2>
          <p className="text-sm text-[#6B7280] text-center">
            Preparing your training dashboard...
          </p>
          <div className="mt-4 flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#C1121F] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!result?.success) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
        <div className="text-center py-4">
          <p className="text-[#A4ACB8]">
            {result?.error || 'Unable to generate program. Please try refreshing.'}
          </p>
        </div>
      </Card>
    )
  }

  const profile = getOnboardingProfile()
  const hasEstimates = profile ? hasEstimatedValues(profile) : false

  return (
    <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#C1121F]/30 p-6 relative overflow-hidden">
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Estimated values notice */}
      {hasEstimates && (
        <div className="bg-[#4F6D8A]/10 border border-[#4F6D8A]/30 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#4F6D8A] mt-0.5 shrink-0" />
          <p className="text-xs text-[#A4ACB8]">
            <span className="text-[#4F6D8A] font-medium">Estimated values used.</span>{' '}
            Update your strength metrics anytime to refine your program.
          </p>
        </div>
      )}

      {/* Success Icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#C1121F]/10 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#E6E9EF]">
            Your Program Is Ready
          </h2>
          <p className="text-sm text-[#6B7280]">
            Personalized for your goals
          </p>
        </div>
      </div>

      {/* Welcome Message */}
      <p className="text-sm text-[#A4ACB8] mb-4 leading-relaxed">
        {result.welcomeMessage}
      </p>

      {/* Program Summary */}
      {result.program && Array.isArray(result.program.sessions) && result.program.sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#0F1115] rounded-lg p-3 text-center">
            <Calendar className="w-4 h-4 text-[#4F6D8A] mx-auto mb-1" />
            <p className="text-lg font-bold text-[#E6E9EF]">
              {typeof result.program.trainingDaysPerWeek === 'number' 
                ? result.program.trainingDaysPerWeek 
                : result.program.sessions.length}
            </p>
            <p className="text-xs text-[#6B7280]">Days/Week</p>
          </div>
          <div className="bg-[#0F1115] rounded-lg p-3 text-center">
            <Target className="w-4 h-4 text-[#C1121F] mx-auto mb-1" />
            <p className="text-lg font-bold text-[#E6E9EF] capitalize">
              {(typeof result.program.goalLabel === 'string' && result.program.goalLabel)
                ? result.program.goalLabel.split(' ')[0]
                : 'Strength'}
            </p>
            <p className="text-xs text-[#6B7280]">Focus</p>
          </div>
          <div className="bg-[#0F1115] rounded-lg p-3 text-center">
            <Dumbbell className="w-4 h-4 text-[#4F6D8A] mx-auto mb-1" />
            <p className="text-lg font-bold text-[#E6E9EF]">
              {result.program.sessions.length}
            </p>
            <p className="text-xs text-[#6B7280]">Sessions</p>
          </div>
        </div>
      )}

      {/* Training Strategy */}
      {reasoning && Array.isArray(reasoning.strategyFocus) && reasoning.strategyFocus.length > 0 && (
        <div className="border-t border-[#2B313A] pt-4 mt-4">
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">
            Training Strategy
          </p>
          <div className="space-y-1.5">
            {reasoning.strategyFocus.map((focus, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F]" />
                <span className="text-sm text-[#E6E9EF]">{focus}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* First Session Preview */}
      {reasoning?.firstSession && (
        <div className="bg-gradient-to-r from-[#C1121F]/10 to-transparent rounded-lg p-3 border border-[#C1121F]/20 mt-4">
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">First Spartan Session</p>
          <p className="text-sm font-semibold text-[#E6E9EF] mb-1">{reasoning.firstSession.title}</p>
          <div className="flex items-center gap-3 text-xs text-[#A4ACB8]">
            <span>{reasoning.firstSession.estimatedMinutes} min</span>
            <span>•</span>
            <span>{reasoning.firstSession.primaryFocus}</span>
          </div>
        </div>
      )}

      {/* Adaptive Coach Messages */}
      {reasoning?.hasAdaptations && Array.isArray(reasoning.adaptiveMessages) && reasoning.adaptiveMessages.length > 0 && (
        <div className="bg-[#C1121F]/5 border border-[#C1121F]/20 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2 mb-2">
            {reasoning.trainingBehavior?.progressTrend?.overallTrend === 'improving' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : reasoning.trainingBehavior?.progressTrend?.overallTrend === 'declining' ? (
              <TrendingDown className="w-4 h-4 text-amber-400" />
            ) : (
              <Minus className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-xs font-medium text-[#C1121F]">Adaptive Coaching</span>
          </div>
          <ul className="space-y-1">
            {reasoning.adaptiveMessages.slice(0, 2).map((msg, idx) => (
              <li key={idx} className="text-sm text-[#A4ACB8]">{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Calibration Highlights */}
      {summary && typeof summary === 'object' && (
        <div className="border-t border-[#2B313A] pt-3 mt-4">
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">
            Calibration Profile
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-[#0F1115] rounded text-xs text-[#A4ACB8] capitalize">
              {(typeof summary.strengthTier === 'string' ? summary.strengthTier : 'intermediate').replace('_', ' ')} level
            </span>
            {Array.isArray(summary.skillInterests) && summary.skillInterests.slice(0, 2).map(skill => (
              <span
                key={typeof skill === 'string' ? skill : String(skill)}
                className="px-2 py-0.5 bg-[#C1121F]/10 rounded text-xs text-[#C1121F] capitalize"
              >
                {typeof skill === 'string' ? skill.replace('_', ' ') : 'skill'}
              </span>
            ))}
            {summary.hasFlexibilityGoals && (
              <span className="px-2 py-0.5 bg-[#4F6D8A]/10 rounded text-xs text-[#4F6D8A]">
                + Flexibility
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 space-y-2">
        <Link href="/first-session" className="block">
          <Button
            className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Start First Session
          </Button>
        </Link>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full text-center text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors py-2"
          >
            View Dashboard First
            <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        )}
      </div>
    </Card>
  )
}
