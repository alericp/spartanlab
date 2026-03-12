'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Activity,
  Target,
  Wrench,
  Brain,
  Sparkles,
  HelpCircle,
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  hasSeenDashboardIntro, 
  markDashboardIntroSeen,
} from '@/lib/athlete-profile'
import { cn } from '@/lib/utils'

// Introduction steps
const INTRO_STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Welcome to SpartanLab',
    description: 'Your training program has been created using your athlete profile and goals.',
    detail: 'SpartanLab continuously adapts your training based on performance, fatigue signals, and progress trends.',
    highlight: null,
  },
  {
    id: 'workout',
    icon: Calendar,
    title: "Today's Workout",
    description: 'Your daily workout is generated using SpartanLab\'s adaptive training engine.',
    detail: 'It adjusts training difficulty based on your progress, fatigue signals, and performance trends.',
    highlight: 'today-workout',
  },
  {
    id: 'readiness',
    icon: Activity,
    title: 'Daily Readiness',
    description: 'Your readiness score estimates how prepared you are for today\'s training.',
    detail: 'Based on recent sessions and recovery patterns, this helps guide how hard you should push.',
    highlight: 'daily-readiness',
  },
  {
    id: 'skills',
    icon: Target,
    title: 'Skill Progress Tracking',
    description: 'Track your progress toward advanced calisthenics skills.',
    detail: 'Monitor front lever, planche, muscle-up, and other skills as you work toward them.',
    highlight: 'skill-progress',
  },
  {
    id: 'tools',
    icon: Wrench,
    title: 'Training Tools',
    description: 'SpartanLab includes powerful training tools to help you improve faster.',
    detail: 'Skill readiness calculators, program builder, training analytics, and performance tracking.',
    highlight: 'tools',
  },
  {
    id: 'adaptive',
    icon: Brain,
    title: 'Adaptive Training Engine',
    description: 'SpartanLab is not just a workout tracker.',
    detail: 'It analyzes your training data and adjusts your program automatically to help you progress efficiently.',
    highlight: null,
  },
] as const

interface DashboardIntroductionProps {
  onComplete?: () => void
  forceShow?: boolean
}

export function DashboardIntroduction({ onComplete, forceShow = false }: DashboardIntroductionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Check if we should show the intro
    if (forceShow) {
      setIsVisible(true)
      return
    }
    
    const shouldShow = !hasSeenDashboardIntro()
    setIsVisible(shouldShow)
  }, [forceShow])

  const handleDismiss = () => {
    setIsExiting(true)
    markDashboardIntroSeen()
    
    setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 200)
  }

  const handleNext = () => {
    if (currentStep < INTRO_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleDismiss()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    handleDismiss()
  }

  if (!isVisible) {
    return null
  }

  const step = INTRO_STEPS[currentStep]
  const Icon = step.icon
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === INTRO_STEPS.length - 1

  return (
    <Card 
      className={cn(
        'bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#C1121F]/20 p-5 relative overflow-hidden transition-opacity duration-200',
        isExiting && 'opacity-0'
      )}
    >
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C1121F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 p-1.5 text-[#6B7280] hover:text-[#A4ACB8] transition-colors z-10"
        aria-label="Skip introduction"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="relative">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {INTRO_STEPS.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                index === currentStep 
                  ? 'w-6 bg-[#C1121F]' 
                  : index < currentStep 
                    ? 'w-2 bg-[#C1121F]/50'
                    : 'w-2 bg-[#2B313A]'
              )}
            />
          ))}
          <span className="ml-2 text-xs text-[#6B7280]">
            {currentStep + 1} of {INTRO_STEPS.length}
          </span>
        </div>

        {/* Icon and title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-[#C1121F]/10 text-[#C1121F]">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#E6E9EF] mb-1">
              {step.title}
            </h3>
            <p className="text-sm text-[#A4ACB8] leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        {/* Detail */}
        <div className="bg-[#0F1115]/60 rounded-lg p-3 mb-4 border border-[#2B313A]/50">
          <p className="text-sm text-[#8B939F] leading-relaxed">
            {step.detail}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={isFirstStep}
            className={cn(
              'text-[#6B7280] hover:text-[#A4ACB8] hover:bg-[#2B313A]/50',
              isFirstStep && 'invisible'
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-[#6B7280] hover:text-[#A4ACB8] hover:bg-transparent"
          >
            Skip
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="bg-[#C1121F] hover:bg-[#A50F1A] text-white"
          >
            {isLastStep ? 'Get Started' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Help button to re-access the introduction
interface HowSpartanLabWorksButtonProps {
  onOpen: () => void
  className?: string
}

export function HowSpartanLabWorksButton({ onOpen, className }: HowSpartanLabWorksButtonProps) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors',
        className
      )}
    >
      <HelpCircle className="w-3.5 h-3.5" />
      How SpartanLab Works
    </button>
  )
}

// Compact inline hint for specific features
interface FeatureHintProps {
  feature: 'readiness' | 'workout' | 'skills' | 'tools'
  className?: string
}

const FEATURE_HINTS: Record<string, string> = {
  readiness: 'Your readiness score guides how hard to push today.',
  workout: 'Training adapts based on your progress and recovery.',
  skills: 'Track your journey toward advanced skills.',
  tools: 'Use these tools to optimize your training.',
}

export function FeatureHint({ feature, className }: FeatureHintProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div 
      className={cn(
        'flex items-center gap-2 text-xs text-[#6B7280] bg-[#1A1F26] rounded-md px-2.5 py-1.5 border border-[#2B313A]/50',
        className
      )}
    >
      <Sparkles className="w-3 h-3 text-[#C1121F]/70" />
      <span>{FEATURE_HINTS[feature]}</span>
      <button 
        onClick={() => setIsVisible(false)}
        className="ml-1 p-0.5 hover:text-[#A4ACB8] transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
