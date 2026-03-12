'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Timer,
  BarChart3,
  Lock
} from 'lucide-react'
import { SKILL_PROGRESSIONS, getSkillProgression, getSkillLevel } from '@/lib/skill-progression-rules'
import Link from 'next/link'

// Skill options for the sensor
const SKILL_OPTIONS = [
  { key: 'front_lever', name: 'Front Lever', icon: Target },
  { key: 'planche', name: 'Planche', icon: Target },
  { key: 'handstand_pushup', name: 'Handstand Push-Up', icon: Target },
  { key: 'muscle_up', name: 'Muscle-Up', icon: Zap },
]

// Training frequency options
const FREQUENCY_OPTIONS = [
  { value: 1, label: '1x/week' },
  { value: 2, label: '2x/week' },
  { value: 3, label: '3x/week' },
  { value: 4, label: '4+/week' },
]

interface ReadinessResult {
  status: 'ready' | 'developing' | 'building' | 'insufficient'
  score: number
  label: string
  color: string
  explanation: string
  focusAreas: string[]
  nextStep: string
}

function calculateReadiness(
  skillKey: string,
  levelIndex: number,
  holdTime: number,
  frequency: number
): ReadinessResult {
  const skillDef = getSkillProgression(skillKey)
  const levelDef = getSkillLevel(skillKey, levelIndex)
  
  if (!skillDef || !levelDef) {
    return {
      status: 'insufficient',
      score: 0,
      label: 'No Data',
      color: '#6B7280',
      explanation: 'Select a skill and progression level to begin.',
      focusAreas: [],
      nextStep: 'Enter your training data above.',
    }
  }
  
  const minHold = levelDef.minHoldForOwnership
  const targetHold = levelDef.targetHold
  const isIsometric = skillDef.isIsometric
  
  // Calculate hold score (0-100)
  let holdScore = 0
  if (holdTime > 0) {
    if (holdTime >= targetHold) {
      holdScore = 100
    } else if (holdTime >= minHold) {
      holdScore = 60 + ((holdTime - minHold) / (targetHold - minHold)) * 40
    } else {
      holdScore = (holdTime / minHold) * 60
    }
  }
  
  // Calculate frequency score (0-100)
  let frequencyScore = 0
  if (frequency >= 3) frequencyScore = 100
  else if (frequency === 2) frequencyScore = 70
  else if (frequency === 1) frequencyScore = 40
  
  // Combined score with weights
  const totalScore = Math.round(holdScore * 0.7 + frequencyScore * 0.3)
  
  // Determine readiness status
  let status: ReadinessResult['status']
  let label: string
  let color: string
  let explanation: string
  let focusAreas: string[] = []
  let nextStep: string
  
  const isAtMaxLevel = levelIndex >= skillDef.levels.length - 1
  const nextLevelDef = !isAtMaxLevel ? skillDef.levels[levelIndex + 1] : null
  const microProg = levelDef.microToNext
  
  if (totalScore >= 85 && !isAtMaxLevel) {
    status = 'ready'
    label = 'Ready to Progress'
    color = '#22C55E'
    explanation = `Your ${isIsometric ? 'hold time' : 'rep count'} and training consistency indicate strong ownership of ${levelDef.name}. You are ready to attempt ${nextLevelDef?.name || 'the next progression'}.`
    focusAreas = ['Maintain current level density', 'Begin exposure to next progression']
    nextStep = nextLevelDef ? `Start working on ${nextLevelDef.name} holds` : 'Focus on increasing hold duration'
  } else if (totalScore >= 65) {
    status = 'developing'
    label = 'Developing'
    color = '#4F6D8A'
    if (microProg && !isAtMaxLevel) {
      explanation = `You are building solid ownership of ${levelDef.name}. Consider ${microProg.name} as an intermediate challenge while continuing to build density.`
      nextStep = microProg.name
    } else {
      explanation = `Good progress on ${levelDef.name}. Continue building ${isIsometric ? 'hold time' : 'rep capacity'} and consistency.`
      nextStep = `Target ${targetHold}${isIsometric ? 's holds' : ' reps'}`
    }
    focusAreas = holdScore < frequencyScore 
      ? ['Increase hold duration', 'Quality over quantity']
      : ['Increase training frequency', 'Add more weekly volume']
  } else if (totalScore >= 40) {
    status = 'building'
    label = 'Building Foundation'
    color = '#A4ACB8'
    explanation = `You are in the early stages of ${levelDef.name} development. Focus on accumulating quality ${isIsometric ? 'hold time' : 'reps'} and training consistency.`
    focusAreas = ['Build repeatable clean holds', 'Train this skill 2-3x per week']
    nextStep = `Work toward ${minHold}${isIsometric ? 's clean holds' : ' clean reps'}`
  } else {
    status = 'insufficient'
    label = 'Needs Work'
    color = '#6B7280'
    explanation = holdTime === 0 
      ? 'Enter your best hold time to receive a readiness assessment.'
      : `Continue building foundational strength for ${levelDef.name}. Your current ${isIsometric ? 'hold time' : 'rep count'} indicates more development is needed.`
    focusAreas = ['Focus on regression exercises', 'Build prerequisite strength']
    nextStep = 'Work on support strength and easier progressions'
  }
  
  // Override for max level
  if (isAtMaxLevel && totalScore >= 65) {
    status = 'ready'
    label = 'Elite Level'
    color = '#FFD700'
    explanation = `You have achieved ${levelDef.name} - the highest progression. Focus on increasing hold times, adding volume, or exploring weighted variations.`
    focusAreas = ['Increase max hold duration', 'Add training volume', 'Explore weighted variations']
    nextStep = 'Master your current level with longer holds'
  }
  
  return {
    status,
    score: totalScore,
    label,
    color,
    explanation,
    focusAreas,
    nextStep,
  }
}

interface SkillProgressSensorProps {
  initialSkill?: string
  showProUpgrade?: boolean
}

export function SkillProgressSensor({ 
  initialSkill = 'front_lever',
  showProUpgrade = true
}: SkillProgressSensorProps) {
  const [selectedSkill, setSelectedSkill] = useState(initialSkill)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [holdTime, setHoldTime] = useState(0)
  const [frequency, setFrequency] = useState(2)
  
  const skillDef = useMemo(() => getSkillProgression(selectedSkill), [selectedSkill])
  const levels = skillDef?.levels || []
  
  const readiness = useMemo(() => 
    calculateReadiness(selectedSkill, selectedLevel, holdTime, frequency),
    [selectedSkill, selectedLevel, holdTime, frequency]
  )
  
  // Reset level when skill changes
  const handleSkillChange = (skill: string) => {
    setSelectedSkill(skill)
    setSelectedLevel(0)
    setHoldTime(0)
  }
  
  return (
    <div className="space-y-6">
      {/* Skill Selection */}
      <div>
        <label className="block text-sm font-medium text-[#A4ACB8] mb-3">
          Select Skill
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SKILL_OPTIONS.map((skill) => {
            const Icon = skill.icon
            const isSelected = selectedSkill === skill.key
            return (
              <button
                key={skill.key}
                onClick={() => handleSkillChange(skill.key)}
                className={`
                  p-3 rounded-lg border text-sm font-medium transition-all
                  ${isSelected 
                    ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]' 
                    : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A]'}
                `}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? 'text-[#C1121F]' : 'text-[#6B7280]'}`} />
                {skill.name}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Progression Level */}
      <div>
        <label className="block text-sm font-medium text-[#A4ACB8] mb-3">
          Current Progression Level
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {levels.map((level, index) => {
            const isSelected = selectedLevel === index
            return (
              <button
                key={index}
                onClick={() => setSelectedLevel(index)}
                className={`
                  p-3 rounded-lg border text-sm font-medium transition-all text-center
                  ${isSelected 
                    ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]' 
                    : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A]'}
                `}
              >
                {level.name}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Hold Time Input */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#A4ACB8] mb-3">
            <Timer className="w-4 h-4 inline mr-1.5" />
            Best {skillDef?.isIsometric ? 'Hold Time' : 'Rep Count'}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="60"
              value={holdTime || ''}
              onChange={(e) => setHoldTime(Number(e.target.value))}
              placeholder="0"
              className="w-full px-4 py-3 bg-[#0F1115] border border-[#2B313A] rounded-lg text-[#E6E9EF] text-lg font-medium focus:border-[#C1121F] focus:outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">
              {skillDef?.isIsometric ? 'seconds' : 'reps'}
            </span>
          </div>
          {levels[selectedLevel] && (
            <p className="text-xs text-[#6B7280] mt-2">
              Target: {levels[selectedLevel].targetHold}{skillDef?.isIsometric ? 's' : ''} / 
              Minimum: {levels[selectedLevel].minHoldForOwnership}{skillDef?.isIsometric ? 's' : ''}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#A4ACB8] mb-3">
            <BarChart3 className="w-4 h-4 inline mr-1.5" />
            Training Frequency
          </label>
          <div className="grid grid-cols-4 gap-2">
            {FREQUENCY_OPTIONS.map((opt) => {
              const isSelected = frequency === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`
                    py-3 rounded-lg border text-sm font-medium transition-all
                    ${isSelected 
                      ? 'bg-[#C1121F]/10 border-[#C1121F] text-[#E6E9EF]' 
                      : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A]'}
                  `}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Readiness Result */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#E6E9EF]">Progression Readiness</h3>
            <p className="text-sm text-[#6B7280]">{levels[selectedLevel]?.name || 'Select a level'}</p>
          </div>
          <div className="text-right">
            <div 
              className="text-3xl font-bold tabular-nums"
              style={{ color: readiness.color }}
            >
              {readiness.score}
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: readiness.color }}
            >
              {readiness.label}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-[#0F1115] rounded-full overflow-hidden mb-6">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${readiness.score}%`,
              backgroundColor: readiness.color
            }}
          />
        </div>
        
        {/* Explanation */}
        <div className="mb-6">
          <p className="text-[#A4ACB8] leading-relaxed">
            {readiness.explanation}
          </p>
        </div>
        
        {/* Focus Areas */}
        {readiness.focusAreas.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-[#E6E9EF] mb-3">Focus Areas</h4>
            <div className="flex flex-wrap gap-2">
              {readiness.focusAreas.map((area, i) => (
                <span 
                  key={i}
                  className="px-3 py-1.5 bg-[#0F1115] border border-[#2B313A] rounded-full text-sm text-[#A4ACB8]"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Next Step */}
        <div className="flex items-center gap-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
          {readiness.status === 'ready' ? (
            <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
          ) : readiness.status === 'developing' ? (
            <TrendingUp className="w-5 h-5 text-[#4F6D8A] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#6B7280] flex-shrink-0" />
          )}
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Next Step</p>
            <p className="text-sm text-[#E6E9EF] font-medium">{readiness.nextStep}</p>
          </div>
        </div>
      </Card>
      
      {/* Pro Upgrade CTA */}
      {showProUpgrade && (
        <Card className="bg-gradient-to-r from-[#C1121F]/10 to-[#1A1F26] border-[#C1121F]/30 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#E6E9EF] mb-1">
                  Unlock Adaptive Training Engine
                </h4>
                <p className="text-sm text-[#A4ACB8]">
                  Generate personalized training programs based on your skill data, strength levels, and recovery state.
                </p>
              </div>
            </div>
            <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
              <Link href="/program">
                Generate Training Plan
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
