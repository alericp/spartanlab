'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Calendar, Target, Dumbbell, X } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import {
  generateFirstProgram,
  getOnboardingSummary,
  getProgramReasoning,
  type FirstRunResult,
  type ProgramReasoning,
} from '@/lib/onboarding-service'
import { getOnboardingProfile, hasEstimatedValues } from '@/lib/athlete-profile'
import { AlertCircle } from 'lucide-react'

interface WelcomeCardProps {
  onDismiss?: () => void
  onProgramReady?: (result: FirstRunResult) => void
}

export function WelcomeCard({ onDismiss, onProgramReady }: WelcomeCardProps) {
  const [isGenerating, setIsGenerating] = useState(true)
  const [result, setResult] = useState<FirstRunResult | null>(null)
  const [summary, setSummary] = useState<ReturnType<typeof getOnboardingSummary>>(null)
  const [reasoning, setReasoning] = useState<ProgramReasoning | null>(null)

  useEffect(() => {
    // Generate the first program
    const generateProgram = async () => {
      setIsGenerating(true)
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const programResult = generateFirstProgram()
      setResult(programResult)
      setSummary(getOnboardingSummary())
      setReasoning(getProgramReasoning(programResult.program))
      setIsGenerating(false)
      
      if (programResult.success && onProgramReady) {
        onProgramReady(programResult)
      }
    }
    
    generateProgram()
  }, [onProgramReady])

  if (isGenerating) {
    return (
      <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-6 relative overflow-hidden">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-pulse mb-4">
            <SpartanIcon size={48} />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
            Building Your Program
          </h2>
          <p className="text-sm text-[#6B7280] text-center">
            Calibrating the adaptive training engine...
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
      {result.program && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#0F1115] rounded-lg p-3 text-center">
            <Calendar className="w-4 h-4 text-[#4F6D8A] mx-auto mb-1" />
            <p className="text-lg font-bold text-[#E6E9EF]">
              {result.program.trainingDaysPerWeek}
            </p>
            <p className="text-xs text-[#6B7280]">Days/Week</p>
          </div>
          <div className="bg-[#0F1115] rounded-lg p-3 text-center">
            <Target className="w-4 h-4 text-[#C1121F] mx-auto mb-1" />
            <p className="text-lg font-bold text-[#E6E9EF] capitalize">
              {result.program.goalLabel.split(' ')[0]}
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
      {reasoning && reasoning.strategyFocus.length > 0 && (
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

      {/* Calibration Highlights */}
      {summary && (
        <div className="border-t border-[#2B313A] pt-3 mt-4">
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">
            Calibration Profile
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-[#0F1115] rounded text-xs text-[#A4ACB8] capitalize">
              {summary.strengthTier.replace('_', ' ')} level
            </span>
            {summary.skillInterests.slice(0, 2).map(skill => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-[#C1121F]/10 rounded text-xs text-[#C1121F] capitalize"
              >
                {skill.replace('_', ' ')}
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
      <div className="mt-4">
        <Button
          onClick={onDismiss}
          className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
        >
          Start Session
        </Button>
      </div>
    </Card>
  )
}
