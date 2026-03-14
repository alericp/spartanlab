'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2,
  User,
  Target,
  Zap,
  Dumbbell,
  StretchHorizontal,
  Settings,
  Calendar,
  Heart,
  CheckCircle2
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { trackOnboardingCompleted } from '@/lib/analytics'
import {
  type OnboardingProfile,
  type Sex,
  type TrainingExperience,
  type HeightRange,
  type WeightRange,
  type BodyFatRange,
  type GoalCategory,
  type PrimaryGoalType,
  type SkillGoal,
  type FlexibilityGoal,
  type PullUpCapacity,
  type PushUpCapacity,
  type DipCapacity,
  type WallHSPUReps,
  type FrontLeverProgression,
  type PlancheProgression,
  type MuscleUpReadiness,
  type HSPUProgression,
  type LSitHoldCapacity,
  type VSitHoldCapacity,
  type FlexibilityLevel,
  type RangeTrainingIntent,
  type EquipmentType,
  type TrainingDaysPerWeek,
  type SessionLengthPreference,
  type SessionStylePreference,
  type RecoveryQuality,
  TRAINING_EXPERIENCE_LABELS,
  TRAINING_EXPERIENCE_DESCRIPTIONS,
  HEIGHT_LABELS,
  WEIGHT_LABELS,
  BODY_FAT_LABELS,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_DESCRIPTIONS,
  SKILL_GOAL_LABELS,
  FLEXIBILITY_GOAL_LABELS,
  PULLUP_LABELS,
  PUSHUP_LABELS,
  DIP_LABELS,
  WALL_HSPU_LABELS,
  FRONT_LEVER_LABELS,
  PLANCHE_LABELS,
  MUSCLE_UP_LABELS,
  HSPU_LABELS,
  LSIT_HOLD_LABELS,
  VSIT_HOLD_LABELS,
  FLEXIBILITY_LEVEL_LABELS,
  RANGE_INTENT_LABELS,
  RANGE_INTENT_DESCRIPTIONS,
  EQUIPMENT_LABELS,
  SESSION_LENGTH_LABELS,
  SESSION_STYLE_LABELS,
  RECOVERY_LABELS,
  saveOnboardingProfile,
  createEmptyOnboardingProfile,
} from '@/lib/athlete-profile'

// =============================================================================
// SECTION DEFINITIONS
// =============================================================================

type SectionId = 
  | 'athlete_profile'
  | 'goals'
  | 'skill_selection'
  | 'strength_benchmarks'
  | 'skill_benchmarks'
  | 'flexibility_benchmarks'
  | 'equipment'
  | 'schedule'
  | 'recovery'
  | 'review'

interface Section {
  id: SectionId
  title: string
  subtitle: string
  icon: typeof User
  showIf?: (profile: OnboardingProfile) => boolean
}

const SECTIONS: Section[] = [
  {
    id: 'athlete_profile',
    title: 'Athlete Profile',
    subtitle: 'Basic information to calibrate your training',
    icon: User,
  },
  {
    id: 'goals',
    title: 'Your Goals',
    subtitle: 'What do you want to achieve?',
    icon: Target,
  },
  {
    id: 'skill_selection',
    title: 'Skill Selection',
    subtitle: 'Choose the skills you want to pursue',
    icon: Zap,
    showIf: (profile) => profile.goalCategories.includes('skill_mastery') || 
                         profile.goalCategories.includes('flexibility') ||
                         profile.goalCategories.includes('mobility'),
  },
  {
    id: 'strength_benchmarks',
    title: 'Strength Benchmarks',
    subtitle: 'Your current strength levels',
    icon: Dumbbell,
  },
  {
    id: 'skill_benchmarks',
    title: 'Skill Benchmarks',
    subtitle: 'Your current skill progressions',
    icon: Zap,
    showIf: (profile) => profile.selectedSkills.length > 0,
  },
  {
    id: 'flexibility_benchmarks',
    title: 'Flexibility Benchmarks',
    subtitle: 'Your current flexibility levels',
    icon: StretchHorizontal,
    showIf: (profile) => profile.selectedFlexibility.length > 0,
  },
  {
    id: 'equipment',
    title: 'Equipment',
    subtitle: 'What do you have access to?',
    icon: Settings,
  },
  {
    id: 'schedule',
    title: 'Training Schedule',
    subtitle: 'How much time can you dedicate?',
    icon: Calendar,
  },
  {
    id: 'recovery',
    title: 'Recovery & Lifestyle',
    subtitle: 'Factors that affect your training',
    icon: Heart,
  },
  {
    id: 'review',
    title: 'Final Review',
    subtitle: 'Confirm your profile',
    icon: CheckCircle2,
  },
]

// =============================================================================
// OPTION BUTTON COMPONENT
// =============================================================================

interface OptionButtonProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  description?: string
  className?: string
}

function OptionButton({ selected, onClick, children, description, className = '' }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center gap-2 text-left ${
        selected
          ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF] ring-1 ring-[#C1121F]/30'
          : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A] hover:text-[#E6E9EF]'
      } ${className}`}
    >
      {selected && <Check className="w-4 h-4 text-[#C1121F] shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="truncate block">{children}</span>
        {description && (
          <span className="text-xs text-[#6B7280] block mt-0.5">{description}</span>
        )}
      </div>
    </button>
  )
}

// =============================================================================
// SECTION CONTENT COMPONENTS
// =============================================================================

interface SectionProps {
  profile: OnboardingProfile
  updateProfile: (updates: Partial<OnboardingProfile>) => void
}

function AthleteProfileSection({ profile, updateProfile }: SectionProps) {
  return (
    <div className="space-y-6">
      {/* Sex */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Biological sex</label>
        <p className="text-xs text-[#6B7280] -mt-1">Helps calibrate strength and leverage baselines</p>
        <div className="grid grid-cols-2 gap-2">
          {(['male', 'female'] as Sex[]).map((sex) => (
            <OptionButton
              key={sex}
              selected={profile.sex === sex}
              onClick={() => updateProfile({ sex })}
            >
              {sex === 'male' ? 'Male' : 'Female'}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Training Experience */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Training experience</label>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(TRAINING_EXPERIENCE_LABELS) as TrainingExperience[]).map((exp) => (
            <OptionButton
              key={exp}
              selected={profile.trainingExperience === exp}
              onClick={() => updateProfile({ trainingExperience: exp })}
              description={TRAINING_EXPERIENCE_DESCRIPTIONS[exp]}
            >
              {TRAINING_EXPERIENCE_LABELS[exp]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Height</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(HEIGHT_LABELS) as HeightRange[]).map((height) => (
            <OptionButton
              key={height}
              selected={profile.heightRange === height}
              onClick={() => updateProfile({ heightRange: height })}
            >
              {HEIGHT_LABELS[height]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Weight */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Weight</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(WEIGHT_LABELS) as WeightRange[]).map((weight) => (
            <OptionButton
              key={weight}
              selected={profile.weightRange === weight}
              onClick={() => updateProfile({ weightRange: weight })}
            >
              {WEIGHT_LABELS[weight]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Body Fat (Optional) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Estimated body fat % <span className="text-[#6B7280]">(optional)</span></label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(BODY_FAT_LABELS) as BodyFatRange[]).map((bf) => (
            <OptionButton
              key={bf}
              selected={profile.bodyFatRange === bf}
              onClick={() => updateProfile({ bodyFatRange: bf })}
            >
              {BODY_FAT_LABELS[bf]}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}

function GoalsSection({ profile, updateProfile }: SectionProps) {
  const toggleCategory = (cat: GoalCategory) => {
    const current = profile.goalCategories
    const updated = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat]
    updateProfile({ goalCategories: updated })
  }

  const goalOptions: PrimaryGoalType[] = [
    'front_lever', 'planche', 'muscle_up', 'handstand_pushup', 'handstand',
    'l_sit', 'v_sit', 'pancake', 'front_splits', 'side_splits',
    'weighted_pull', 'weighted_dip', 'general_strength', 'muscle_building', 'work_capacity'
  ]

  const goalLabels: Record<PrimaryGoalType, string> = {
    'front_lever': 'Front Lever',
    'planche': 'Planche',
    'muscle_up': 'Muscle-Up',
    'handstand_pushup': 'Handstand Push-Up',
    'handstand': 'Handstand',
    'l_sit': 'L-Sit',
    'v_sit': 'V-Sit',
    'pancake': 'Pancake',
    'front_splits': 'Front Splits',
    'side_splits': 'Side Splits',
    'toe_touch': 'Toe Touch',
    'weighted_pull': 'Weighted Pull-ups',
    'weighted_dip': 'Weighted Dips',
    'general_strength': 'General Strength',
    'muscle_building': 'Muscle Building',
    'work_capacity': 'Work Capacity / Endurance',
  }

  return (
    <div className="space-y-6">
      {/* Goal Categories */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">What areas are you focused on?</label>
        <p className="text-xs text-[#6B7280] -mt-1">Select all that apply</p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(GOAL_CATEGORY_LABELS) as GoalCategory[]).map((cat) => (
            <OptionButton
              key={cat}
              selected={profile.goalCategories.includes(cat)}
              onClick={() => toggleCategory(cat)}
              description={GOAL_CATEGORY_DESCRIPTIONS[cat]}
            >
              {GOAL_CATEGORY_LABELS[cat]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Primary Goal */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Primary goal</label>
        <p className="text-xs text-[#6B7280] -mt-1">Your main training focus</p>
        <div className="grid grid-cols-2 gap-2">
          {goalOptions.map((goal) => (
            <OptionButton
              key={goal}
              selected={profile.primaryGoal === goal}
              onClick={() => updateProfile({ primaryGoal: goal })}
            >
              {goalLabels[goal]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Secondary Goal (Optional) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Secondary goal <span className="text-[#6B7280]">(optional)</span></label>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton
            selected={profile.secondaryGoal === null}
            onClick={() => updateProfile({ secondaryGoal: null })}
          >
            None
          </OptionButton>
          {goalOptions.filter(g => g !== profile.primaryGoal).map((goal) => (
            <OptionButton
              key={goal}
              selected={profile.secondaryGoal === goal}
              onClick={() => updateProfile({ secondaryGoal: goal })}
            >
              {goalLabels[goal]}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkillSelectionSection({ profile, updateProfile }: SectionProps) {
  const toggleSkill = (skill: SkillGoal) => {
    const current = profile.selectedSkills
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill]
    updateProfile({ selectedSkills: updated })
  }

  const toggleFlexibility = (goal: FlexibilityGoal) => {
    const current = profile.selectedFlexibility
    const updated = current.includes(goal)
      ? current.filter(g => g !== goal)
      : [...current, goal]
    updateProfile({ selectedFlexibility: updated })
  }

  const showSkills = profile.goalCategories.includes('skill_mastery')
  const showFlexibility = profile.goalCategories.includes('flexibility') || profile.goalCategories.includes('mobility')

  return (
    <div className="space-y-6">
      {/* Skills */}
      {showSkills && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Skills you want to pursue</label>
          <p className="text-xs text-[#6B7280] -mt-1">Select all that interest you</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SKILL_GOAL_LABELS) as SkillGoal[]).map((skill) => (
              <OptionButton
                key={skill}
                selected={profile.selectedSkills.includes(skill)}
                onClick={() => toggleSkill(skill)}
              >
                {SKILL_GOAL_LABELS[skill]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Flexibility Goals */}
      {showFlexibility && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Flexibility / mobility goals</label>
          <p className="text-xs text-[#6B7280] -mt-1">Select your targets</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FLEXIBILITY_GOAL_LABELS) as FlexibilityGoal[]).map((goal) => (
              <OptionButton
                key={goal}
                selected={profile.selectedFlexibility.includes(goal)}
                onClick={() => toggleFlexibility(goal)}
              >
                {FLEXIBILITY_GOAL_LABELS[goal]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StrengthBenchmarksSection({ profile, updateProfile }: SectionProps) {
  return (
    <div className="space-y-6">
      {/* Max Pull-ups */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Max pull-ups</label>
        <p className="text-xs text-[#6B7280] -mt-1">Strict form, full range of motion</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(PULLUP_LABELS) as PullUpCapacity[]).map((cap) => (
            <OptionButton
              key={cap}
              selected={profile.pullUpMax === cap}
              onClick={() => updateProfile({ pullUpMax: cap })}
            >
              {PULLUP_LABELS[cap]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Max Dips */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Max dips</label>
        <p className="text-xs text-[#6B7280] -mt-1">Parallel bar dips, full depth</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(DIP_LABELS) as DipCapacity[]).map((cap) => (
            <OptionButton
              key={cap}
              selected={profile.dipMax === cap}
              onClick={() => updateProfile({ dipMax: cap })}
            >
              {DIP_LABELS[cap]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Max Push-ups */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Max push-ups</label>
        <p className="text-xs text-[#6B7280] -mt-1">Full range, chest to ground</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PUSHUP_LABELS) as PushUpCapacity[]).map((cap) => (
            <OptionButton
              key={cap}
              selected={profile.pushUpMax === cap}
              onClick={() => updateProfile({ pushUpMax: cap })}
            >
              {PUSHUP_LABELS[cap]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Wall HSPU */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Wall handstand push-ups</label>
        <p className="text-xs text-[#6B7280] -mt-1">Full range against wall</p>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(WALL_HSPU_LABELS) as WallHSPUReps[]).map((reps) => (
            <OptionButton
              key={reps}
              selected={profile.wallHSPUReps === reps}
              onClick={() => updateProfile({ wallHSPUReps: reps })}
            >
              {WALL_HSPU_LABELS[reps]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Weighted Pull-up */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Best weighted pull-up <span className="text-[#6B7280]">(optional)</span></label>
        <p className="text-xs text-[#6B7280] -mt-1">Weight added for 1-3 reps</p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Weight"
            value={profile.weightedPullUp?.load || ''}
            onChange={(e) => updateProfile({
              weightedPullUp: {
                load: e.target.value ? parseInt(e.target.value) : null,
                unit: profile.weightedPullUp?.unit || 'lbs',
              }
            })}
            className="flex-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
          />
          <div className="flex gap-1">
            <OptionButton
              selected={profile.weightedPullUp?.unit === 'lbs'}
              onClick={() => updateProfile({
                weightedPullUp: { ...profile.weightedPullUp, unit: 'lbs', load: profile.weightedPullUp?.load ?? null }
              })}
              className="px-3"
            >
              lbs
            </OptionButton>
            <OptionButton
              selected={profile.weightedPullUp?.unit === 'kg'}
              onClick={() => updateProfile({
                weightedPullUp: { ...profile.weightedPullUp, unit: 'kg', load: profile.weightedPullUp?.load ?? null }
              })}
              className="px-3"
            >
              kg
            </OptionButton>
          </div>
        </div>
      </div>

      {/* Weighted Dip */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Best weighted dip <span className="text-[#6B7280]">(optional)</span></label>
        <p className="text-xs text-[#6B7280] -mt-1">Weight added for 1-3 reps</p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Weight"
            value={profile.weightedDip?.load || ''}
            onChange={(e) => updateProfile({
              weightedDip: {
                load: e.target.value ? parseInt(e.target.value) : null,
                unit: profile.weightedDip?.unit || 'lbs',
              }
            })}
            className="flex-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
          />
          <div className="flex gap-1">
            <OptionButton
              selected={profile.weightedDip?.unit === 'lbs'}
              onClick={() => updateProfile({
                weightedDip: { ...profile.weightedDip, unit: 'lbs', load: profile.weightedDip?.load ?? null }
              })}
              className="px-3"
            >
              lbs
            </OptionButton>
            <OptionButton
              selected={profile.weightedDip?.unit === 'kg'}
              onClick={() => updateProfile({
                weightedDip: { ...profile.weightedDip, unit: 'kg', load: profile.weightedDip?.load ?? null }
              })}
              className="px-3"
            >
              kg
            </OptionButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillBenchmarksSection({ profile, updateProfile }: SectionProps) {
  const hasSkill = (skill: SkillGoal) => profile.selectedSkills.includes(skill)

  return (
    <div className="space-y-6">
      {/* Front Lever */}
      {hasSkill('front_lever') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Front Lever progression</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FRONT_LEVER_LABELS) as FrontLeverProgression[]).map((prog) => (
              <OptionButton
                key={prog}
                selected={profile.frontLever?.progression === prog}
                onClick={() => updateProfile({
                  frontLever: { progression: prog, holdSeconds: profile.frontLever?.holdSeconds }
                })}
              >
                {FRONT_LEVER_LABELS[prog]}
              </OptionButton>
            ))}
          </div>
          {profile.frontLever?.progression && profile.frontLever.progression !== 'none' && (
            <div className="mt-2">
              <label className="text-xs text-[#6B7280]">Best hold (seconds)</label>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={profile.frontLever?.holdSeconds || ''}
                onChange={(e) => updateProfile({
                  frontLever: {
                    progression: profile.frontLever?.progression || 'none',
                    holdSeconds: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="mt-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] w-24"
              />
            </div>
          )}
        </div>
      )}

      {/* Planche */}
      {hasSkill('planche') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Planche progression</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PLANCHE_LABELS) as PlancheProgression[]).map((prog) => (
              <OptionButton
                key={prog}
                selected={profile.planche?.progression === prog}
                onClick={() => updateProfile({
                  planche: { progression: prog, holdSeconds: profile.planche?.holdSeconds }
                })}
              >
                {PLANCHE_LABELS[prog]}
              </OptionButton>
            ))}
          </div>
          {profile.planche?.progression && profile.planche.progression !== 'none' && (
            <div className="mt-2">
              <label className="text-xs text-[#6B7280]">Best hold (seconds)</label>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={profile.planche?.holdSeconds || ''}
                onChange={(e) => updateProfile({
                  planche: {
                    progression: profile.planche?.progression || 'none',
                    holdSeconds: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="mt-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] w-24"
              />
            </div>
          )}
        </div>
      )}

      {/* Muscle-Up */}
      {hasSkill('muscle_up') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Muscle-Up readiness</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MUSCLE_UP_LABELS) as MuscleUpReadiness[]).map((level) => (
              <OptionButton
                key={level}
                selected={profile.muscleUp === level}
                onClick={() => updateProfile({ muscleUp: level })}
              >
                {MUSCLE_UP_LABELS[level]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* HSPU */}
      {hasSkill('handstand_pushup') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">HSPU progression</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(HSPU_LABELS) as HSPUProgression[]).map((prog) => (
              <OptionButton
                key={prog}
                selected={profile.hspu?.progression === prog}
                onClick={() => updateProfile({
                  hspu: { progression: prog, reps: profile.hspu?.reps }
                })}
              >
                {HSPU_LABELS[prog]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* L-Sit */}
      {hasSkill('l_sit') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">L-Sit hold</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(LSIT_HOLD_LABELS) as LSitHoldCapacity[]).map((hold) => (
              <OptionButton
                key={hold}
                selected={profile.lSitHold === hold}
                onClick={() => updateProfile({ lSitHold: hold })}
              >
                {LSIT_HOLD_LABELS[hold]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* V-Sit */}
      {hasSkill('v_sit') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">V-Sit hold</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(VSIT_HOLD_LABELS) as VSitHoldCapacity[]).map((hold) => (
              <OptionButton
                key={hold}
                selected={profile.vSitHold === hold}
                onClick={() => updateProfile({ vSitHold: hold })}
              >
                {VSIT_HOLD_LABELS[hold]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FlexibilityBenchmarksSection({ profile, updateProfile }: SectionProps) {
  const hasGoal = (goal: FlexibilityGoal) => profile.selectedFlexibility.includes(goal)

  const updateFlexBenchmark = (
    key: 'pancake' | 'toeTouch' | 'frontSplits' | 'sideSplits',
    level: FlexibilityLevel
  ) => {
    updateProfile({
      [key]: {
        level,
        rangeIntent: profile[key]?.rangeIntent || null,
      }
    })
  }

  const updateRangeIntent = (
    key: 'pancake' | 'toeTouch' | 'frontSplits' | 'sideSplits',
    intent: RangeTrainingIntent
  ) => {
    updateProfile({
      [key]: {
        level: profile[key]?.level || 'beginner',
        rangeIntent: intent,
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Pancake */}
      {hasGoal('pancake') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Pancake</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FLEXIBILITY_LEVEL_LABELS) as FlexibilityLevel[]).map((level) => (
              <OptionButton
                key={level}
                selected={profile.pancake?.level === level}
                onClick={() => updateFlexBenchmark('pancake', level)}
              >
                {FLEXIBILITY_LEVEL_LABELS[level]}
              </OptionButton>
            ))}
          </div>
          <div className="mt-2">
            <label className="text-xs text-[#6B7280]">Training focus</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(Object.keys(RANGE_INTENT_LABELS) as RangeTrainingIntent[]).map((intent) => (
                <OptionButton
                  key={intent}
                  selected={profile.pancake?.rangeIntent === intent}
                  onClick={() => updateRangeIntent('pancake', intent)}
                >
                  {RANGE_INTENT_LABELS[intent]}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toe Touch */}
      {hasGoal('toe_touch') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Toe Touch / Forward Fold</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FLEXIBILITY_LEVEL_LABELS) as FlexibilityLevel[]).map((level) => (
              <OptionButton
                key={level}
                selected={profile.toeTouch?.level === level}
                onClick={() => updateFlexBenchmark('toeTouch', level)}
              >
                {FLEXIBILITY_LEVEL_LABELS[level]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Front Splits */}
      {hasGoal('front_splits') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Front Splits</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FLEXIBILITY_LEVEL_LABELS) as FlexibilityLevel[]).map((level) => (
              <OptionButton
                key={level}
                selected={profile.frontSplits?.level === level}
                onClick={() => updateFlexBenchmark('frontSplits', level)}
              >
                {FLEXIBILITY_LEVEL_LABELS[level]}
              </OptionButton>
            ))}
          </div>
          <div className="mt-2">
            <label className="text-xs text-[#6B7280]">Training focus</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(Object.keys(RANGE_INTENT_LABELS) as RangeTrainingIntent[]).map((intent) => (
                <OptionButton
                  key={intent}
                  selected={profile.frontSplits?.rangeIntent === intent}
                  onClick={() => updateRangeIntent('frontSplits', intent)}
                >
                  {RANGE_INTENT_LABELS[intent]}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Side Splits */}
      {hasGoal('side_splits') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Side Splits</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FLEXIBILITY_LEVEL_LABELS) as FlexibilityLevel[]).map((level) => (
              <OptionButton
                key={level}
                selected={profile.sideSplits?.level === level}
                onClick={() => updateFlexBenchmark('sideSplits', level)}
              >
                {FLEXIBILITY_LEVEL_LABELS[level]}
              </OptionButton>
            ))}
          </div>
          <div className="mt-2">
            <label className="text-xs text-[#6B7280]">Training focus</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(Object.keys(RANGE_INTENT_LABELS) as RangeTrainingIntent[]).map((intent) => (
                <OptionButton
                  key={intent}
                  selected={profile.sideSplits?.rangeIntent === intent}
                  onClick={() => updateRangeIntent('sideSplits', intent)}
                >
                  {RANGE_INTENT_LABELS[intent]}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EquipmentSection({ profile, updateProfile }: SectionProps) {
  const toggleEquipment = (eq: EquipmentType) => {
    const current = profile.equipment
    // Special handling for minimal
    if (eq === 'minimal') {
      updateProfile({ equipment: ['minimal'] })
      return
    }
    // Remove minimal if selecting other equipment
    const filtered = current.filter(e => e !== 'minimal')
    const updated = filtered.includes(eq)
      ? filtered.filter(e => e !== eq)
      : [...filtered, eq]
    updateProfile({ equipment: updated.length > 0 ? updated : [] })
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#A4ACB8]">Equipment available</label>
      <p className="text-xs text-[#6B7280] -mt-1">Select all you have access to</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).map((eq) => (
          <OptionButton
            key={eq}
            selected={profile.equipment.includes(eq)}
            onClick={() => toggleEquipment(eq)}
          >
            {EQUIPMENT_LABELS[eq]}
          </OptionButton>
        ))}
      </div>
    </div>
  )
}

function ScheduleSection({ profile, updateProfile }: SectionProps) {
  const days: TrainingDaysPerWeek[] = [2, 3, 4, 5, 6]
  const lengths: SessionLengthPreference[] = [30, 45, 60, 75]

  return (
    <div className="space-y-6">
      {/* Days per week */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Training days per week</label>
        <div className="flex gap-2">
          {days.map((day) => (
            <OptionButton
              key={day}
              selected={profile.trainingDaysPerWeek === day}
              onClick={() => updateProfile({ trainingDaysPerWeek: day })}
              className="flex-1 justify-center"
            >
              {day}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Session length */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Typical session length</label>
        <div className="grid grid-cols-4 gap-2">
          {lengths.map((len) => (
            <OptionButton
              key={len}
              selected={profile.sessionLengthMinutes === len}
              onClick={() => updateProfile({ sessionLengthMinutes: len })}
            >
              {SESSION_LENGTH_LABELS[len]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Session style */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Session style preference</label>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(SESSION_STYLE_LABELS) as SessionStylePreference[]).map((style) => (
            <OptionButton
              key={style}
              selected={profile.sessionStyle === style}
              onClick={() => updateProfile({ sessionStyle: style })}
            >
              {SESSION_STYLE_LABELS[style]}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecoverySection({ profile, updateProfile }: SectionProps) {
  const updateRecovery = (key: keyof NonNullable<OnboardingProfile['recovery']>, value: RecoveryQuality) => {
    updateProfile({
      recovery: {
        sleepQuality: profile.recovery?.sleepQuality || 'normal',
        energyLevel: profile.recovery?.energyLevel || 'normal',
        stressLevel: profile.recovery?.stressLevel || 'normal',
        recoveryConfidence: profile.recovery?.recoveryConfidence || 'normal',
        [key]: value,
      }
    })
  }

  const qualities: RecoveryQuality[] = ['good', 'normal', 'poor']

  return (
    <div className="space-y-6">
      {/* Sleep Quality */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Sleep quality</label>
        <div className="flex gap-2">
          {qualities.map((q) => (
            <OptionButton
              key={q}
              selected={profile.recovery?.sleepQuality === q}
              onClick={() => updateRecovery('sleepQuality', q)}
              className="flex-1 justify-center"
            >
              {RECOVERY_LABELS[q]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Energy Level */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Typical energy level</label>
        <div className="flex gap-2">
          {qualities.map((q) => (
            <OptionButton
              key={q}
              selected={profile.recovery?.energyLevel === q}
              onClick={() => updateRecovery('energyLevel', q)}
              className="flex-1 justify-center"
            >
              {RECOVERY_LABELS[q]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Stress Level */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Life stress level</label>
        <div className="flex gap-2">
          {qualities.map((q) => (
            <OptionButton
              key={q}
              selected={profile.recovery?.stressLevel === q}
              onClick={() => updateRecovery('stressLevel', q)}
              className="flex-1 justify-center"
            >
              {RECOVERY_LABELS[q]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Recovery Confidence */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Recovery confidence</label>
        <p className="text-xs text-[#6B7280] -mt-1">How well do you bounce back between sessions?</p>
        <div className="flex gap-2">
          {qualities.map((q) => (
            <OptionButton
              key={q}
              selected={profile.recovery?.recoveryConfidence === q}
              onClick={() => updateRecovery('recoveryConfidence', q)}
              className="flex-1 justify-center"
            >
              {RECOVERY_LABELS[q]}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewSection({ profile }: { profile: OnboardingProfile }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#A4ACB8]">
        Review your profile before generating your personalized program.
      </p>
      
      <div className="space-y-3 text-sm">
        {/* Athlete Profile */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="text-[#6B7280] text-xs uppercase tracking-wide mb-1">Profile</div>
          <div className="text-[#E6E9EF]">
            {profile.sex ? (profile.sex === 'male' ? 'Male' : 'Female') : 'Not set'} 
            {profile.trainingExperience && ` • ${TRAINING_EXPERIENCE_LABELS[profile.trainingExperience]}`}
          </div>
        </div>

        {/* Goals */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="text-[#6B7280] text-xs uppercase tracking-wide mb-1">Primary Goal</div>
          <div className="text-[#E6E9EF]">
            {profile.primaryGoal || 'Not set'}
            {profile.secondaryGoal && ` + ${profile.secondaryGoal}`}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="text-[#6B7280] text-xs uppercase tracking-wide mb-1">Schedule</div>
          <div className="text-[#E6E9EF]">
            {profile.trainingDaysPerWeek || '?'} days/week
            {profile.sessionLengthMinutes && ` • ${profile.sessionLengthMinutes} min sessions`}
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="text-[#6B7280] text-xs uppercase tracking-wide mb-1">Equipment</div>
          <div className="text-[#E6E9EF]">
            {profile.equipment.length > 0 
              ? profile.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')
              : 'None selected'}
          </div>
        </div>
      </div>

      <p className="text-xs text-[#6B7280] pt-2">
        You can update these details anytime from your profile settings.
      </p>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AthleteOnboarding() {
  const router = useRouter()
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<OnboardingProfile>(createEmptyOnboardingProfile())

  // Filter sections based on showIf conditions
  const visibleSections = useMemo(() => {
    return SECTIONS.filter(section => !section.showIf || section.showIf(profile))
  }, [profile])

  const currentSection = visibleSections[currentSectionIndex]
  const totalSections = visibleSections.length
  const isLastSection = currentSectionIndex === totalSections - 1
  const progress = ((currentSectionIndex + 1) / totalSections) * 100

  const updateProfile = useCallback((updates: Partial<OnboardingProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  // Check if current section has minimum required data
  const canProceed = useMemo(() => {
    if (!currentSection) return false
    
    switch (currentSection.id) {
      case 'athlete_profile':
        return profile.sex !== null && profile.trainingExperience !== null
      case 'goals':
        return profile.primaryGoal !== null
      case 'skill_selection':
        return true // Optional selections
      case 'strength_benchmarks':
        return profile.pullUpMax !== null || profile.dipMax !== null
      case 'skill_benchmarks':
        return true // All optional within context
      case 'flexibility_benchmarks':
        return true // All optional within context
      case 'equipment':
        return profile.equipment.length > 0
      case 'schedule':
        return profile.trainingDaysPerWeek !== null && profile.sessionLengthMinutes !== null
      case 'recovery':
        return true // All optional
      case 'review':
        return true
      default:
        return true
    }
  }, [currentSection, profile])

  const handleNext = () => {
    if (!canProceed) return
    
    if (isLastSection) {
      handleSubmit()
    } else {
      setCurrentSectionIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Mark as complete and save
      const finalProfile = { ...profile, onboardingComplete: true }
      saveOnboardingProfile(finalProfile)
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Track completion
      trackOnboardingCompleted('onboarding')
      
      // Navigate to dashboard
      router.push('/dashboard?welcome=true')
    } catch (error) {
      console.error('Failed to save profile:', error)
      setIsSubmitting(false)
    }
  }

  // Render section content
  const renderSectionContent = () => {
    if (!currentSection) return null
    
    const props = { profile, updateProfile }
    
    switch (currentSection.id) {
      case 'athlete_profile':
        return <AthleteProfileSection {...props} />
      case 'goals':
        return <GoalsSection {...props} />
      case 'skill_selection':
        return <SkillSelectionSection {...props} />
      case 'strength_benchmarks':
        return <StrengthBenchmarksSection {...props} />
      case 'skill_benchmarks':
        return <SkillBenchmarksSection {...props} />
      case 'flexibility_benchmarks':
        return <FlexibilityBenchmarksSection {...props} />
      case 'equipment':
        return <EquipmentSection {...props} />
      case 'schedule':
        return <ScheduleSection {...props} />
      case 'recovery':
        return <RecoverySection {...props} />
      case 'review':
        return <ReviewSection profile={profile} />
      default:
        return null
    }
  }

  if (!currentSection) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-[#A4ACB8] mb-4">Unable to load onboarding. Please refresh.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    )
  }

  const Icon = currentSection.icon

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#2B313A] z-50">
        <div 
          className="h-full bg-[#C1121F] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-start justify-center p-4 pt-8 pb-24 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <SpartanIcon size={36} />
            </div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
              {currentSectionIndex === 0 
                ? 'Quick setup'
                : `Step ${currentSectionIndex + 1} of ${totalSections}`
              }
            </p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Icon className="w-5 h-5 text-[#C1121F]" />
              <h1 className="text-xl md:text-2xl font-bold text-[#E6E9EF]">
                {currentSection.title}
              </h1>
            </div>
            <p className="text-sm text-[#6B7280]">
              {currentSection.subtitle}
            </p>
          </div>

          {/* Content Card */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 md:p-6">
            {renderSectionContent()}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[#2B313A]">
              {currentSectionIndex > 0 && (
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
                disabled={!canProceed || isSubmitting}
                className={`bg-[#C1121F] hover:bg-[#A30F1A] text-white py-5 md:py-6 font-medium gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentSectionIndex === 0 ? 'flex-1' : 'flex-[2]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Building Program...
                  </>
                ) : isLastSection ? (
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

          {/* Section Indicators */}
          <div className="flex justify-center gap-1 mt-4 md:mt-6 flex-wrap">
            {visibleSections.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSectionIndex
                    ? 'w-5 bg-[#C1121F]'
                    : i < currentSectionIndex
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
