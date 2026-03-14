'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { trackOnboardingCompleted } from '@/lib/analytics'
import {
  type OnboardingProfile,
  type HeightRange,
  type WeightRange,
  type PullUpCapacity,
  type PushUpCapacity,
  type DipCapacity,
  type LSitCapacity,
  type TrainingTimeRange,
  type WeeklyTrainingDays,
  type OnboardingGoal,
  type SkillInterest,
  type FlexibilityFocus,
  type FlexibilityGoal,
  type EquipmentType,
  type EnduranceInterest,
  HEIGHT_LABELS,
  WEIGHT_LABELS,
  PULLUP_LABELS,
  PUSHUP_LABELS,
  DIP_LABELS,
  LSIT_LABELS,
  TRAINING_TIME_LABELS,
  WEEKLY_TRAINING_LABELS,
  GOAL_LABELS,
  SKILL_INTEREST_LABELS,
  FLEXIBILITY_FOCUS_LABELS,
  FLEXIBILITY_GOAL_LABELS,
  EQUIPMENT_LABELS,
  ENDURANCE_INTEREST_LABELS,
  saveOnboardingProfile,
  createEmptyOnboardingProfile,
} from '@/lib/athlete-profile'

// Step types
type StepType = 'single' | 'multi'

interface StepConfig {
  key: keyof OnboardingProfile
  question: string
  subtitle?: string
  options: { value: string; label: string }[]
  columns?: number
  type: StepType
  showIf?: (profile: OnboardingProfile) => boolean
}

// All onboarding steps
const ALL_STEPS: StepConfig[] = [
  // Basic Profile
  {
    key: 'sex',
    question: 'Biological sex',
    subtitle: 'Helps calibrate leverage and strength baselines',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
    columns: 2,
    type: 'single',
  },
  {
    key: 'heightRange',
    question: 'Your height',
    options: Object.entries(HEIGHT_LABELS).map(([value, label]) => ({ value, label })),
    columns: 2,
    type: 'single',
  },
  {
    key: 'weightRange',
    question: 'Your weight',
    options: Object.entries(WEIGHT_LABELS).map(([value, label]) => ({ value, label })),
    columns: 2,
    type: 'single',
  },
  
  // Strength Indicators
  {
    key: 'pullUpCapacity',
    question: 'How many pull-ups can you perform?',
    subtitle: 'Strict form, full range of motion',
    options: Object.entries(PULLUP_LABELS).map(([value, label]) => ({ value, label })),
    columns: 4,
    type: 'single',
  },
  {
    key: 'pushUpCapacity',
    question: 'How many push-ups can you perform?',
    subtitle: 'Full range, chest to ground',
    options: Object.entries(PUSHUP_LABELS).map(([value, label]) => ({ value, label })),
    columns: 3,
    type: 'single',
  },
  {
    key: 'dipCapacity',
    question: 'Max dips',
    subtitle: 'Parallel bar dips, full depth',
    options: Object.entries(DIP_LABELS).map(([value, label]) => ({ value, label })),
    columns: 4,
    type: 'single',
  },
  {
    key: 'lSitCapacity',
    question: 'Can you hold an L-sit?',
    subtitle: 'On parallettes or floor',
    options: Object.entries(LSIT_LABELS).map(([value, label]) => ({ value, label })),
    columns: 2,
    type: 'single',
  },
  
  // Goal Selection
  {
    key: 'primaryGoal',
    question: 'Main training goal',
    options: Object.entries(GOAL_LABELS).map(([value, label]) => ({ value, label })),
    columns: 2,
    type: 'single',
  },
  
  // Skill Interests
  {
    key: 'skillInterests',
    question: 'Skills you want to pursue',
    subtitle: 'Select all that interest you',
    options: Object.entries(SKILL_INTEREST_LABELS).map(([value, label]) => ({ value, label })),
    columns: 2,
    type: 'multi',
  },
  
  // Flexibility
  {
    key: 'flexibilityFocus',
    question: 'Flexibility focus',
    options: Object.entries(FLEXIBILITY_FOCUS_LABELS).map(([value, label]) => ({ value, label })),
    columns: 1,
    type: 'single',
  },
  {
    key: 'flexibilityGoals',
    question: 'Flexibility goals',
    subtitle: 'Select your targets',
    options: Object.entries(FLEXIBILITY_GOAL_LABELS).map(([value, label]) => ({ value, label })),
    columns: 2,
    type: 'multi',
    showIf: (profile) => profile.flexibilityFocus !== 'none' && profile.flexibilityFocus !== null,
  },
  
  // Training Setup
  {
    key: 'weeklyTraining',
    question: 'Training days per week',
    options: Object.entries(WEEKLY_TRAINING_LABELS).map(([value, label]) => ({ value, label })),
    columns: 4,
    type: 'single',
  },
  {
    key: 'trainingTime',
    question: 'Typical session length',
    options: Object.entries(TRAINING_TIME_LABELS).map(([value, label]) => ({ value, label })),
    columns: 3,
    type: 'single',
  },
  
  // Equipment
  {
    key: 'equipment',
    question: 'Equipment available',
    subtitle: 'Select all you have access to',
    options: Object.entries(EQUIPMENT_LABELS).map(([value, label]) => ({ value, label })),
    columns: 2,
    type: 'multi',
  },
  
  // Endurance
  {
    key: 'enduranceInterest',
    question: 'Circuit training interest',
    subtitle: 'Endurance-style finishers and conditioning',
    options: Object.entries(ENDURANCE_INTEREST_LABELS).map(([value, label]) => ({ value, label })),
    columns: 1,
    type: 'single',
  },
]

export function AthleteOnboarding() {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<OnboardingProfile>(createEmptyOnboardingProfile())

  // Filter steps based on showIf conditions
  const visibleSteps = useMemo(() => {
    return ALL_STEPS.filter(step => !step.showIf || step.showIf(profile))
  }, [profile])

  const step = visibleSteps[currentStepIndex]
  const totalSteps = visibleSteps.length
  const isLastStep = currentStepIndex === totalSteps - 1
  const progress = ((currentStepIndex + 1) / totalSteps) * 100

  // Guard against undefined step (shouldn't happen, but prevents crashes)
  if (!step) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-[#A4ACB8] mb-4">Unable to load onboarding step. Please refresh.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    )
  }

  // Get current value for this step
  const getCurrentValue = () => {
    const value = profile[step.key]
    if (step.type === 'multi') {
      return value as string[] || []
    }
    return value as string | null
  }

  const currentValue = getCurrentValue()

  // Check if we can proceed
  const canGoNext = step.type === 'multi' 
    ? (currentValue as string[]).length > 0 || step.key === 'skillInterests' || step.key === 'flexibilityGoals'
    : currentValue !== null

  // Handle single selection
  const handleSingleSelect = (value: string) => {
    setProfile(prev => ({ ...prev, [step.key]: value }))
  }

  // Handle multi selection
  const handleMultiSelect = (value: string) => {
    const currentArray = (profile[step.key] as string[]) || []
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value]
    
    // Special handling for 'none' equipment
    if (step.key === 'equipment') {
      if (value === 'none') {
        setProfile(prev => ({ ...prev, [step.key]: ['none'] }))
        return
      }
      // Remove 'none' if selecting other equipment
      const filtered = newArray.filter(v => v !== 'none')
      setProfile(prev => ({ ...prev, [step.key]: filtered.length > 0 ? filtered : [] }))
      return
    }
    
    setProfile(prev => ({ ...prev, [step.key]: newArray }))
  }

  const handleNext = () => {
    if (!canGoNext) return
    
    if (isLastStep) {
      handleSubmit()
    } else {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Save onboarding profile
      saveOnboardingProfile(profile)
      
      // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Track onboarding completion
    trackOnboardingCompleted('onboarding')
    
    // Navigate to dashboard - the program will be generated there
    router.push('/dashboard?welcome=true')
    } catch (error) {
      console.error('Failed to save profile:', error)
      setIsSubmitting(false)
    }
  }

  const isSelected = (value: string) => {
    if (step.type === 'multi') {
      return ((currentValue as string[]) || []).includes(value)
    }
    return currentValue === value
  }

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#2B313A] z-50">
        <div 
          className="h-full bg-[#C1121F] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 pt-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <SpartanIcon size={36} />
            </div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
              {currentStepIndex === 0 
                ? `Quick setup · ~2 minutes`
                : `Step ${currentStepIndex + 1} of ${totalSteps}`
              }
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-[#E6E9EF]">
              {step.question}
            </h1>
            {step.subtitle && (
              <p className="text-sm text-[#6B7280] mt-1">
                {step.subtitle}
              </p>
            )}
          </div>

          {/* Options Card */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 md:p-6">
            <div 
              className="grid gap-2 md:gap-3"
              style={{ 
                gridTemplateColumns: `repeat(${Math.min(step.columns || 2, 2)}, minmax(0, 1fr))` 
              }}
            >
              {step.options.map((option) => {
                const selected = isSelected(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => step.type === 'multi' 
                      ? handleMultiSelect(option.value) 
                      : handleSingleSelect(option.value)
                    }
                    className={`py-3 md:py-4 px-3 md:px-4 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 ${
                      selected
                        ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF] ring-1 ring-[#C1121F]/30'
                        : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A] hover:text-[#E6E9EF]'
                    }`}
                  >
                    {selected && <Check className="w-4 h-4 text-[#C1121F] shrink-0" />}
                    <span className="truncate">{option.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Skip option for optional multi-select steps */}
            {step.type === 'multi' && (step.key === 'skillInterests' || step.key === 'flexibilityGoals') && (
              <button
                type="button"
                onClick={handleNext}
                className="w-full mt-3 py-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
              >
                Skip for now
              </button>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-4 md:mt-6">
              {currentStepIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-[#2B313A] hover:bg-[#2B313A] text-[#A4ACB8] py-5 md:py-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canGoNext || isSubmitting}
                className={`bg-[#C1121F] hover:bg-[#A30F1A] text-white py-5 md:py-6 font-medium gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentStepIndex === 0 ? 'flex-1' : 'flex-[2]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Building Program...
                  </>
                ) : isLastStep ? (
                  'Generate My Program'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Step Indicators */}
          <div className="flex justify-center gap-1 mt-4 md:mt-6 flex-wrap">
            {visibleSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStepIndex
                    ? 'w-5 bg-[#C1121F]'
                    : i < currentStepIndex
                      ? 'w-1.5 bg-[#C1121F]/50'
                      : 'w-1.5 bg-[#2B313A]'
                }`}
              />
            ))}
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-[#6B7280] mt-4 md:mt-6 px-4">
            SpartanLab uses this to calibrate your personalized training program.
          </p>
        </div>
      </div>
    </div>
  )
}
