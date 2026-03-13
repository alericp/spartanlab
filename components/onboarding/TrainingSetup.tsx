'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Target, Calendar, Clock, Wrench, ArrowRight, Check } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { saveAthleteProfile } from '@/lib/repositories/profile-repository'
import type { Equipment, SessionLengthMinutes } from '@/types/domain'

type PrimaryGoal = 'front_lever' | 'planche' | 'muscle_up' | 'general_strength' | 'pancake' | 'toe_touch' | 'front_splits' | 'side_splits' | 'flexibility'
type TrainingDays = 2 | 3 | 4 | 5 | 6

interface FormData {
  primaryGoal: PrimaryGoal | null
  trainingDaysPerWeek: TrainingDays | null
  sessionLengthMinutes: SessionLengthMinutes | null
  equipmentAvailable: Equipment[]
}

const GOALS: { value: PrimaryGoal; label: string }[] = [
  { value: 'front_lever', label: 'Front Lever' },
  { value: 'planche', label: 'Planche' },
  { value: 'muscle_up', label: 'Muscle-Up' },
  { value: 'general_strength', label: 'General Strength' },
  { value: 'pancake', label: 'Pancake' },
  { value: 'toe_touch', label: 'Toe Touch' },
  { value: 'front_splits', label: 'Front Splits' },
  { value: 'side_splits', label: 'Side Splits' },
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
  { value: 'resistance_bands', label: 'Resistance Bands' },
]

export function TrainingSetup() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    primaryGoal: null,
    trainingDaysPerWeek: null,
    sessionLengthMinutes: null,
    equipmentAvailable: [],
  })

  const isValid = 
    formData.primaryGoal !== null && 
    formData.trainingDaysPerWeek !== null &&
    formData.sessionLengthMinutes !== null

  const toggleEquipment = (equipment: Equipment) => {
    setFormData(prev => ({
      ...prev,
      equipmentAvailable: prev.equipmentAvailable.includes(equipment)
        ? prev.equipmentAvailable.filter(e => e !== equipment)
        : [...prev.equipmentAvailable, equipment]
    }))
  }

  const handleSubmit = async () => {
    if (!isValid) return
    
    setIsSubmitting(true)
    
    try {
      saveAthleteProfile({
        primaryGoal: formData.primaryGoal,
        trainingDaysPerWeek: formData.trainingDaysPerWeek!,
        sessionLengthMinutes: formData.sessionLengthMinutes!,
        equipmentAvailable: formData.equipmentAvailable,
        onboardingComplete: true,
      })
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save training setup:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SpartanIcon size={48} />
          </div>
          <h1 className="text-2xl font-bold text-[#E6E9EF] mb-2">Training Setup</h1>
          <p className="text-[#A4ACB8] text-sm">
            This helps SpartanLab generate your optimal training program.
          </p>
        </div>

        {/* Form Card */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
          <div className="space-y-6">
            
            {/* Primary Goal */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[#E6E9EF]">
                <Target className="w-4 h-4 text-[#A4ACB8]" />
                Primary Goal
              </label>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, primaryGoal: goal.value }))}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      formData.primaryGoal === goal.value
                        ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]'
                        : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A]'
                    }`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Training Days Per Week */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[#E6E9EF]">
                <Calendar className="w-4 h-4 text-[#A4ACB8]" />
                Training Days Per Week
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
                        : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A]'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Length */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[#E6E9EF]">
                <Clock className="w-4 h-4 text-[#A4ACB8]" />
                Session Length
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
                        : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A]'
                    }`}
                  >
                    {length.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Available */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[#E6E9EF]">
                <Wrench className="w-4 h-4 text-[#A4ACB8]" />
                Equipment Available
                <span className="text-xs text-[#6B7280] font-normal">(Select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {EQUIPMENT.map((item) => {
                  const isSelected = formData.equipmentAvailable.includes(item.value)
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => toggleEquipment(item.value)}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]'
                          : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#C1121F]" />}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-[#6B7280]">
                {formData.equipmentAvailable.length === 0 
                  ? 'No equipment selected - bodyweight only programs will be generated'
                  : `${formData.equipmentAvailable.length} item${formData.equipmentAvailable.length > 1 ? 's' : ''} selected`
                }
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white py-6 text-base font-medium gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Starting...' : 'Start Training'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs text-[#6B7280] mt-6">
          You can update this information anytime in Settings.
        </p>
      </div>
    </div>
  )
}
