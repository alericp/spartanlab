'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Target, Calendar, Clock, Wrench, ArrowRight, ArrowLeft, Check, Dumbbell, Zap, StretchHorizontal } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { saveAthleteProfile } from '@/lib/repositories/profile-repository'
import type { Equipment, SessionLengthMinutes } from '@/types/domain'
import { RANGE_MODE_COPY, type RangeTrainingMode } from '@/lib/range-training-system'

// =============================================================================
// TYPES
// =============================================================================

type GoalCategory = 'strength' | 'skills' | 'flexibility'
type SkillGoal = 'front_lever' | 'planche' | 'muscle_up' | 'handstand' | 'l_sit' | 'muscle_up_bar'
type FlexibilityGoal = 'pancake' | 'toe_touch' | 'front_splits' | 'side_splits'
type StrengthGoal = 'general_strength' | 'weighted_pull' | 'weighted_dip'
type TrainingDays = 2 | 3 | 4 | 5 | 6

interface FormData {
  // Step 1: Goal category
  goalCategory: GoalCategory | null
  
  // Step 2: Specific goals (multi-select)
  selectedSkills: SkillGoal[]
  selectedFlexibility: FlexibilityGoal[]
  selectedStrength: StrengthGoal[]
  
  // Step 3: Range approach (only for flexibility)
  rangeApproach: RangeTrainingMode | null
  
  // Step 4: Training schedule
  trainingDaysPerWeek: TrainingDays | null
  sessionLengthMinutes: SessionLengthMinutes | null
  equipmentAvailable: Equipment[]
  
  // Step 5: Strength inputs
  pullUpMax: string
  dipMax: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const GOAL_CATEGORIES: { value: GoalCategory; label: string; description: string; icon: typeof Target }[] = [
  { 
    value: 'skills', 
    label: 'Skills', 
    description: 'Master advanced movements',
    icon: Zap,
  },
  { 
    value: 'flexibility', 
    label: 'Flexibility', 
    description: 'Increase range of motion',
    icon: StretchHorizontal,
  },
  { 
    value: 'strength', 
    label: 'Strength', 
    description: 'Build raw strength',
    icon: Dumbbell,
  },
]

const SKILL_OPTIONS: { value: SkillGoal; label: string }[] = [
  { value: 'planche', label: 'Planche' },
  { value: 'front_lever', label: 'Front Lever' },
  { value: 'muscle_up', label: 'Muscle-Up' },
  { value: 'handstand', label: 'Handstand' },
  { value: 'l_sit', label: 'L-Sit' },
]

const FLEXIBILITY_OPTIONS: { value: FlexibilityGoal; label: string }[] = [
  { value: 'pancake', label: 'Pancake' },
  { value: 'toe_touch', label: 'Toe Touch' },
  { value: 'front_splits', label: 'Front Splits' },
  { value: 'side_splits', label: 'Side Splits' },
]

const STRENGTH_OPTIONS: { value: StrengthGoal; label: string }[] = [
  { value: 'general_strength', label: 'General Strength' },
  { value: 'weighted_pull', label: 'Weighted Pull-ups' },
  { value: 'weighted_dip', label: 'Weighted Dips' },
]

const RANGE_APPROACHES: { value: RangeTrainingMode; label: string }[] = [
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'hybrid', label: 'Hybrid' },
]

const TRAINING_DAYS: TrainingDays[] = [2, 3, 4, 5, 6]

const SESSION_LENGTHS: { value: SessionLengthMinutes; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
]

const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: 'pullup_bar', label: 'Pull-up Bar' },
  { value: 'dip_bars', label: 'Dip Bars' },
  { value: 'parallettes', label: 'Parallettes' },
  { value: 'rings', label: 'Rings' },
  { value: 'resistance_bands', label: 'Bands' },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function TrainingSetup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    goalCategory: null,
    selectedSkills: [],
    selectedFlexibility: [],
    selectedStrength: [],
    rangeApproach: null,
    trainingDaysPerWeek: null,
    sessionLengthMinutes: null,
    equipmentAvailable: [],
    pullUpMax: '',
    dipMax: '',
  })

  // Determine total steps based on goal category
  const needsRangeStep = formData.goalCategory === 'flexibility' && formData.selectedFlexibility.length > 0
  const totalSteps = needsRangeStep ? 5 : 4
  
  // Validation per step
  const isStep1Valid = formData.goalCategory !== null
  const isStep2Valid = 
    (formData.goalCategory === 'skills' && formData.selectedSkills.length > 0) ||
    (formData.goalCategory === 'flexibility' && formData.selectedFlexibility.length > 0) ||
    (formData.goalCategory === 'strength' && formData.selectedStrength.length > 0)
  const isStep3Valid = !needsRangeStep || formData.rangeApproach !== null
  const isStep4Valid = formData.trainingDaysPerWeek !== null && formData.sessionLengthMinutes !== null
  const isStep5Valid = true // Strength inputs are optional
  
  const canProceed = 
    (step === 1 && isStep1Valid) ||
    (step === 2 && isStep2Valid) ||
    (step === 3 && isStep3Valid) ||
    (step === 4 && isStep4Valid) ||
    (step === 5 && isStep5Valid)

  const toggleEquipment = (equipment: Equipment) => {
    setFormData(prev => ({
      ...prev,
      equipmentAvailable: prev.equipmentAvailable.includes(equipment)
        ? prev.equipmentAvailable.filter(e => e !== equipment)
        : [...prev.equipmentAvailable, equipment]
    }))
  }

  const toggleSkill = (skill: SkillGoal) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
    }))
  }

  const toggleFlexibility = (goal: FlexibilityGoal) => {
    setFormData(prev => ({
      ...prev,
      selectedFlexibility: prev.selectedFlexibility.includes(goal)
        ? prev.selectedFlexibility.filter(g => g !== goal)
        : [...prev.selectedFlexibility, goal]
    }))
  }

  const toggleStrength = (goal: StrengthGoal) => {
    setFormData(prev => ({
      ...prev,
      selectedStrength: prev.selectedStrength.includes(goal)
        ? prev.selectedStrength.filter(g => g !== goal)
        : [...prev.selectedStrength, goal]
    }))
  }

  const handleNext = () => {
    if (step === 2 && !needsRangeStep) {
      // Skip range step if not flexibility
      setStep(4)
    } else if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step === 4 && !needsRangeStep) {
      // Skip back to step 2 if no range step
      setStep(2)
    } else if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Determine primary goal
      let primaryGoal: string
      if (formData.goalCategory === 'skills' && formData.selectedSkills.length > 0) {
        primaryGoal = formData.selectedSkills[0]
      } else if (formData.goalCategory === 'flexibility' && formData.selectedFlexibility.length > 0) {
        primaryGoal = formData.selectedFlexibility[0]
      } else if (formData.goalCategory === 'strength' && formData.selectedStrength.length > 0) {
        primaryGoal = formData.selectedStrength[0]
      } else {
        primaryGoal = 'general_strength'
      }

      // Map range approach to intent
      const rangeIntent = formData.rangeApproach === 'flexibility' 
        ? 'deeper_range' as const
        : formData.rangeApproach === 'mobility'
          ? 'stronger_control' as const
          : formData.rangeApproach === 'hybrid'
            ? 'both' as const
            : null

      saveAthleteProfile({
        goalCategory: formData.goalCategory,
        selectedSkills: formData.selectedSkills,
        selectedFlexibility: formData.selectedFlexibility,
        selectedStrength: formData.selectedStrength,
        primaryGoal,
        trainingDaysPerWeek: formData.trainingDaysPerWeek!,
        sessionLengthMinutes: formData.sessionLengthMinutes!,
        equipmentAvailable: formData.equipmentAvailable,
        rangeIntent,
        rangeTrainingMode: formData.rangeApproach,
        pullUpMax: formData.pullUpMax ? parseInt(formData.pullUpMax) : null,
        dipMax: formData.dipMax ? parseInt(formData.dipMax) : null,
        onboardingComplete: true,
      })
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save training setup:', error)
      setIsSubmitting(false)
    }
  }

  // Get actual step number for display (accounting for skipped range step)
  const getDisplayStep = () => {
    if (!needsRangeStep && step >= 4) {
      return step - 1
    }
    return step
  }

  const displayTotalSteps = needsRangeStep ? 5 : 4

  return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <SpartanIcon size={40} />
          </div>
          <h1 className="text-xl font-semibold text-[#E6E9EF] mb-1">Training Setup</h1>
          <p className="text-[#6B7280] text-sm">
            Step {getDisplayStep()} of {displayTotalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-6">
          {Array.from({ length: displayTotalSteps }).map((_, i) => (
            <div 
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < getDisplayStep() ? 'bg-[#C1121F]' : 'bg-[#2B313A]'
              }`}
            />
          ))}
        </div>

        {/* Form Card */}
        <Card className="bg-[#12141A] border-[#1E2329] p-6">
          
          {/* Step 1: Goal Category */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-medium text-[#E6E9EF]">What's your focus?</h2>
              </div>
              <div className="space-y-3">
                {GOAL_CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = formData.goalCategory === cat.value
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        goalCategory: cat.value,
                        selectedSkills: [],
                        selectedFlexibility: [],
                        selectedStrength: [],
                        rangeApproach: null,
                      }))}
                      className={`w-full py-4 px-5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-[#C1121F]/10 border-[#C1121F]'
                          : 'bg-[#0A0B0D] border-[#1E2329] hover:border-[#3B4552]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#C1121F]/20' : 'bg-[#1E2329]'}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-[#C1121F]' : 'text-[#6B7280]'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isSelected ? 'text-[#E6E9EF]' : 'text-[#A4ACB8]'}`}>
                            {cat.label}
                          </p>
                          <p className="text-xs text-[#6B7280]">{cat.description}</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-[#C1121F]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Specific Goals */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-medium text-[#E6E9EF]">
                  {formData.goalCategory === 'skills' && 'Select your skills'}
                  {formData.goalCategory === 'flexibility' && 'Select flexibility goals'}
                  {formData.goalCategory === 'strength' && 'Select strength goals'}
                </h2>
                <p className="text-xs text-[#6B7280] mt-1">Select one or more</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {formData.goalCategory === 'skills' && SKILL_OPTIONS.map((skill) => {
                  const isSelected = formData.selectedSkills.includes(skill.value)
                  return (
                    <button
                      key={skill.value}
                      type="button"
                      onClick={() => toggleSkill(skill.value)}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]'
                          : 'bg-[#0A0B0D] border-[#1E2329] text-[#A4ACB8] hover:border-[#3B4552]'
                      }`}
                    >
                      <span>{skill.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#C1121F]" />}
                    </button>
                  )
                })}
                
                {formData.goalCategory === 'flexibility' && FLEXIBILITY_OPTIONS.map((goal) => {
                  const isSelected = formData.selectedFlexibility.includes(goal.value)
                  return (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => toggleFlexibility(goal.value)}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]'
                          : 'bg-[#0A0B0D] border-[#1E2329] text-[#A4ACB8] hover:border-[#3B4552]'
                      }`}
                    >
                      <span>{goal.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#C1121F]" />}
                    </button>
                  )
                })}
                
                {formData.goalCategory === 'strength' && STRENGTH_OPTIONS.map((goal) => {
                  const isSelected = formData.selectedStrength.includes(goal.value)
                  return (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => toggleStrength(goal.value)}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]'
                          : 'bg-[#0A0B0D] border-[#1E2329] text-[#A4ACB8] hover:border-[#3B4552]'
                      }`}
                    >
                      <span>{goal.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#C1121F]" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Range Approach (Flexibility only) */}
          {step === 3 && needsRangeStep && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-medium text-[#E6E9EF]">Choose your approach</h2>
              </div>
              
              <div className="space-y-3">
                {RANGE_APPROACHES.map((approach) => {
                  const isSelected = formData.rangeApproach === approach.value
                  const copy = RANGE_MODE_COPY[approach.value]
                  return (
                    <button
                      key={approach.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rangeApproach: approach.value }))}
                      className={`w-full py-4 px-5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-[#C1121F]/10 border-[#C1121F]'
                          : 'bg-[#0A0B0D] border-[#1E2329] hover:border-[#3B4552]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isSelected ? 'text-[#E6E9EF]' : 'text-[#A4ACB8]'}`}>
                          {approach.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#C1121F]" />}
                      </div>
                      <p className="text-sm text-[#C1121F] mb-1">{copy.tagline}</p>
                      <p className="text-xs text-[#6B7280]">{copy.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4: Training Schedule */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-medium text-[#E6E9EF]">Training schedule</h2>
              </div>

              {/* Training Days */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-[#A4ACB8]">
                  <Calendar className="w-4 h-4" />
                  Days per week
                </label>
                <div className="flex gap-2">
                  {TRAINING_DAYS.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, trainingDaysPerWeek: days }))}
                      className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.trainingDaysPerWeek === days
                          ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]'
                          : 'bg-[#0A0B0D] border-[#1E2329] text-[#A4ACB8] hover:border-[#3B4552]'
                      }`}
                    >
                      {days}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Length */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-[#A4ACB8]">
                  <Clock className="w-4 h-4" />
                  Session length
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SESSION_LENGTHS.map((length) => (
                    <button
                      key={length.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sessionLengthMinutes: length.value }))}
                      className={`py-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.sessionLengthMinutes === length.value
                          ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]'
                          : 'bg-[#0A0B0D] border-[#1E2329] text-[#A4ACB8] hover:border-[#3B4552]'
                      }`}
                    >
                      {length.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-[#A4ACB8]">
                  <Wrench className="w-4 h-4" />
                  Equipment
                  <span className="text-xs text-[#6B7280] font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map((item) => {
                    const isSelected = formData.equipmentAvailable.includes(item.value)
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleEquipment(item.value)}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]'
                            : 'bg-[#0A0B0D] border-[#1E2329] text-[#6B7280] hover:border-[#3B4552]'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Strength Inputs */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-medium text-[#E6E9EF]">Strength baseline</h2>
                <p className="text-xs text-[#6B7280] mt-1">Optional - helps calibrate your program</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#A4ACB8]">
                    Max pull-ups (unweighted)
                  </label>
                  <input
                    type="number"
                    value={formData.pullUpMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, pullUpMax: e.target.value }))}
                    placeholder="e.g., 12"
                    className="w-full py-3 px-4 rounded-lg border bg-[#0A0B0D] border-[#1E2329] text-[#E6E9EF] placeholder:text-[#6B7280] text-sm focus:outline-none focus:border-[#C1121F]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#A4ACB8]">
                    Max dips (unweighted)
                  </label>
                  <input
                    type="number"
                    value={formData.dipMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, dipMax: e.target.value }))}
                    placeholder="e.g., 15"
                    className="w-full py-3 px-4 rounded-lg border bg-[#0A0B0D] border-[#1E2329] text-[#E6E9EF] placeholder:text-[#6B7280] text-sm focus:outline-none focus:border-[#C1121F]"
                  />
                </div>
              </div>

              <p className="text-xs text-[#6B7280] text-center">
                Skip if unsure - we'll assess during training.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 py-5 border-[#1E2329] bg-transparent text-[#A4ACB8] hover:bg-[#1E2329] hover:text-[#E6E9EF]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="flex-1 py-5 bg-[#C1121F] hover:bg-[#9E0F19] text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-5 bg-[#C1121F] hover:bg-[#9E0F19] text-white disabled:opacity-40"
              >
                {isSubmitting ? 'Starting...' : 'Start Training'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-[#4B5563] mt-6">
          You can update this anytime in Settings.
        </p>
      </div>
    </div>
  )
}
