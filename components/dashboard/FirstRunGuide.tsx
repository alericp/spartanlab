'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  ArrowRight, 
  Calendar, 
  Target, 
  Dumbbell,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import { getLatestAdaptiveProgram } from '@/lib/adaptive-program-builder'
import { getWorkoutLogs } from '@/lib/workout-log-service'

const FIRST_RUN_KEY = 'spartanlab_first_run_dismissed'

interface SetupStep {
  id: string
  label: string
  description: string
  href: string
  icon: React.ElementType
  isComplete: boolean
}

/**
 * First Run Guide - Shows new users exactly what to do next
 * Displays when: no program exists and user hasn't completed onboarding steps
 */
export function FirstRunGuide() {
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [steps, setSteps] = useState<SetupStep[]>([])
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if dismissed
    try {
      const wasDismissed = localStorage.getItem(FIRST_RUN_KEY)
      if (wasDismissed) {
        setDismissed(true)
        return
      }
    } catch {}

    // Determine completion status
    const profile = getOnboardingProfile()
    const program = getLatestAdaptiveProgram()
    const logs = getWorkoutLogs()
    
    const hasProfile = profile && profile.primaryGoal
    const hasProgram = program !== null
    const hasWorkout = logs.length > 0

    // Build steps with completion status
    const setupSteps: SetupStep[] = [
      {
        id: 'profile',
        label: 'Set Your Goals',
        description: 'Tell us about your training goals and experience',
        href: '/onboarding',
        icon: Target,
        isComplete: hasProfile,
      },
      {
        id: 'program',
        label: 'Create Your Program',
        description: 'Build a personalized training plan',
        href: '/programs',
        icon: Calendar,
        isComplete: hasProgram,
      },
      {
        id: 'workout',
        label: 'Complete First Workout',
        description: 'Start training with your new program',
        href: '/workout/session',
        icon: Dumbbell,
        isComplete: hasWorkout,
      },
    ]

    setSteps(setupSteps)
    
    // Show guide if not all steps are complete
    const allComplete = setupSteps.every(s => s.isComplete)
    setShowGuide(!allComplete)
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(FIRST_RUN_KEY, 'true')
    } catch {}
    setDismissed(true)
  }

  if (!mounted || dismissed || !showGuide) {
    return null
  }

  const completedCount = steps.filter(s => s.isComplete).length
  const nextStep = steps.find(s => !s.isComplete)
  const progress = (completedCount / steps.length) * 100

  return (
    <Card className="bg-gradient-to-br from-[#1A1F26] via-[#1A1F26] to-[#0F1115] border-[#2B313A] overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C1121F]/20 to-[#C1121F]/5 border border-[#C1121F]/20 flex items-center justify-center">
              <SpartanIcon size={24} className="text-[#C1121F]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E6E9EF]">
                {nextStep?.id === 'workout' ? 'Ready to Train' : 'Get Started'}
              </h2>
              <p className="text-sm text-[#6B7280]">
                {nextStep?.id === 'workout' 
                  ? 'Complete your first workout to unlock insights'
                  : 'Complete setup to unlock your personalized program'}
              </p>
            </div>
          </div>
          {/* Only show skip after first step is complete */}
          {completedCount >= 1 && (
            <button 
              onClick={handleDismiss}
              className="text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              Skip
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden mb-1">
          <div 
            className="h-full bg-gradient-to-r from-[#C1121F] to-[#E63946] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#6B7280]">
          {completedCount} of {steps.length} complete
        </p>
      </div>

      {/* Steps */}
      <div className="px-6 pb-4 space-y-2">
        {steps.map((step, index) => {
          const isNext = step.id === nextStep?.id
          const Icon = step.icon
          
          return (
            <Link 
              key={step.id}
              href={step.isComplete ? '#' : step.href}
              className={`block ${step.isComplete ? 'pointer-events-none' : ''}`}
            >
              <div className={`
                flex items-center gap-4 p-4 rounded-xl transition-all
                ${isNext 
                  ? 'bg-[#C1121F]/10 border border-[#C1121F]/30 hover:bg-[#C1121F]/15' 
                  : step.isComplete 
                    ? 'bg-[#0F1115]/50 border border-transparent'
                    : 'bg-[#0F1115] border border-[#2B313A] hover:border-[#3A3A3A]'
                }
              `}>
                {/* Step Number / Check */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${step.isComplete 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : isNext
                      ? 'bg-[#C1121F] text-white'
                      : 'bg-[#2B313A] text-[#6B7280]'
                  }
                `}>
                  {step.isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.isComplete ? 'text-[#6B7280] line-through' : 'text-[#E6E9EF]'
                  }`}>
                    {step.label}
                  </p>
                  {!step.isComplete && (
                    <p className="text-xs text-[#6B7280]">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                {!step.isComplete && (
                  <ChevronRight className={`w-5 h-5 shrink-0 ${
                    isNext ? 'text-[#C1121F]' : 'text-[#6B7280]'
                  }`} />
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* CTA for next step */}
      {nextStep && (
        <div className="px-6 pb-6">
          <Link href={nextStep.href}>
            <Button className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2">
              <nextStep.icon className="w-4 h-4" />
              {nextStep.label}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}

/**
 * Compact banner version for users who are mid-setup
 */
export function SetupReminderBanner() {
  const [nextStep, setNextStep] = useState<SetupStep | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const profile = getOnboardingProfile()
    const program = getLatestAdaptiveProgram()
    
    if (!profile?.primaryGoal) {
      setNextStep({
        id: 'profile',
        label: 'Complete your profile',
        description: 'Set your training goals',
        href: '/onboarding',
        icon: Target,
        isComplete: false,
      })
    } else if (!program) {
      setNextStep({
        id: 'program',
        label: 'Create your training program',
        description: 'Get started with structured training',
        href: '/programs',
        icon: Calendar,
        isComplete: false,
      })
    }
  }, [])

  if (!mounted || !nextStep) {
    return null
  }

  return (
    <Link href={nextStep.href}>
      <div className="flex items-center gap-3 p-4 bg-[#1A1F26] border border-[#2B313A] rounded-xl hover:border-[#C1121F]/30 transition-colors group">
        <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
          <nextStep.icon className="w-5 h-5 text-[#C1121F]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#E6E9EF]">{nextStep.label}</p>
          <p className="text-xs text-[#6B7280]">{nextStep.description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#C1121F] transition-colors" />
      </div>
    </Link>
  )
}
