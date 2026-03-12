'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dumbbell, 
  TrendingUp, 
  Target,
  Info,
  ChevronRight,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Strength standards for various lifts
const STRENGTH_STANDARDS = {
  weighted_pull_up: {
    name: 'Weighted Pull-Up',
    unit: 'lbs',
    levels: [
      { level: 'Beginner', min: 0, max: 20, color: '#6B7280', description: 'Building foundation' },
      { level: 'Developing', min: 20, max: 40, color: '#22C55E', description: 'Solid base strength' },
      { level: 'Intermediate', min: 40, max: 70, color: '#EAB308', description: 'Front lever foundation' },
      { level: 'Advanced', min: 70, max: 100, color: '#F97316', description: 'Elite pulling power' },
      { level: 'Elite', min: 100, max: 200, color: '#C1121F', description: 'Peak performance' },
    ],
    skillCorrelations: [
      { skill: 'Front Lever Tuck', threshold: 25 },
      { skill: 'Front Lever Adv Tuck', threshold: 40 },
      { skill: 'Front Lever Straddle', threshold: 60 },
      { skill: 'Full Front Lever', threshold: 80 },
      { skill: 'Muscle-Up', threshold: 35 },
    ],
  },
  weighted_dip: {
    name: 'Weighted Dip',
    unit: 'lbs',
    levels: [
      { level: 'Beginner', min: 0, max: 15, color: '#6B7280', description: 'Building foundation' },
      { level: 'Developing', min: 15, max: 35, color: '#22C55E', description: 'Solid base strength' },
      { level: 'Intermediate', min: 35, max: 55, color: '#EAB308', description: 'Planche foundation' },
      { level: 'Advanced', min: 55, max: 80, color: '#F97316', description: 'Elite pushing power' },
      { level: 'Elite', min: 80, max: 200, color: '#C1121F', description: 'Peak performance' },
    ],
    skillCorrelations: [
      { skill: 'Tuck Planche', threshold: 30 },
      { skill: 'Advanced Tuck Planche', threshold: 45 },
      { skill: 'Straddle Planche', threshold: 65 },
      { skill: 'Wall HSPU', threshold: 25 },
      { skill: 'Freestanding HSPU', threshold: 50 },
    ],
  },
}

type ExerciseType = keyof typeof STRENGTH_STANDARDS

interface CalculatorResult {
  estimated1RM: number
  addedWeight1RM: number
  relativeStrength: number
  level: string
  levelColor: string
  levelDescription: string
  unlockedSkills: string[]
  nextSkill: { skill: string; threshold: number } | null
  progressToNext: number
}

function calculate1RM(bodyweight: number, addedWeight: number, reps: number): number {
  const totalWeight = bodyweight + addedWeight
  // Brzycki formula - most accurate for 1-10 reps
  if (reps === 1) return totalWeight
  return totalWeight * (36 / (37 - reps))
}

function getStrengthLevel(
  relativeStrength: number, 
  exerciseType: ExerciseType
): { level: string; color: string; description: string } {
  const standards = STRENGTH_STANDARDS[exerciseType]
  for (const level of standards.levels) {
    if (relativeStrength >= level.min && relativeStrength < level.max) {
      return { level: level.level, color: level.color, description: level.description }
    }
  }
  return { level: 'Elite', color: '#C1121F', description: 'Peak performance' }
}

function getSkillCorrelations(
  relativeStrength: number,
  exerciseType: ExerciseType
): { unlocked: string[]; next: { skill: string; threshold: number } | null; progress: number } {
  const standards = STRENGTH_STANDARDS[exerciseType]
  const unlocked: string[] = []
  let next: { skill: string; threshold: number } | null = null
  let progress = 0

  for (const correlation of standards.skillCorrelations) {
    if (relativeStrength >= correlation.threshold) {
      unlocked.push(correlation.skill)
    } else if (!next) {
      next = correlation
      progress = (relativeStrength / correlation.threshold) * 100
    }
  }

  return { unlocked, next, progress }
}

interface StrengthCalculatorProps {
  exerciseType: ExerciseType
  showProUpgrade?: boolean
}

export function StrengthCalculator({ 
  exerciseType,
  showProUpgrade = true 
}: StrengthCalculatorProps) {
  const [bodyweight, setBodyweight] = useState('')
  const [addedWeight, setAddedWeight] = useState('')
  const [reps, setReps] = useState('')
  
  const standards = STRENGTH_STANDARDS[exerciseType]
  
  const result = useMemo<CalculatorResult | null>(() => {
    const bw = parseFloat(bodyweight)
    const added = parseFloat(addedWeight)
    const r = parseInt(reps)
    
    if (isNaN(bw) || bw <= 0 || isNaN(added) || isNaN(r) || r < 1 || r > 15) {
      return null
    }
    
    const estimated1RM = calculate1RM(bw, added, r)
    const addedWeight1RM = estimated1RM - bw
    const relativeStrength = (addedWeight1RM / bw) * 100
    const levelInfo = getStrengthLevel(relativeStrength, exerciseType)
    const correlations = getSkillCorrelations(relativeStrength, exerciseType)
    
    return {
      estimated1RM: Math.round(estimated1RM * 10) / 10,
      addedWeight1RM: Math.round(addedWeight1RM * 10) / 10,
      relativeStrength: Math.round(relativeStrength),
      level: levelInfo.level,
      levelColor: levelInfo.color,
      levelDescription: levelInfo.description,
      unlockedSkills: correlations.unlocked,
      nextSkill: correlations.next,
      progressToNext: Math.round(correlations.progress),
    }
  }, [bodyweight, addedWeight, reps, exerciseType])
  
  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
            Bodyweight
          </label>
          <div className="relative">
            <input
              type="number"
              min="50"
              max="400"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
              placeholder="175"
              className="w-full px-4 py-3 bg-[#0F1115] border border-[#2B313A] rounded-lg text-[#E6E9EF] text-lg font-medium focus:border-[#C1121F] focus:outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">
              {standards.unit}
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
            Added Weight
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="300"
              value={addedWeight}
              onChange={(e) => setAddedWeight(e.target.value)}
              placeholder="45"
              className="w-full px-4 py-3 bg-[#0F1115] border border-[#2B313A] rounded-lg text-[#E6E9EF] text-lg font-medium focus:border-[#C1121F] focus:outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">
              {standards.unit}
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
            Reps Completed
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="15"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="5"
              className="w-full px-4 py-3 bg-[#0F1115] border border-[#2B313A] rounded-lg text-[#E6E9EF] text-lg font-medium focus:border-[#C1121F] focus:outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">
              reps
            </span>
          </div>
        </div>
      </div>
      
      {/* Formula Note */}
      <div className="flex items-start gap-2 text-sm text-[#6B7280]">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Uses the Brzycki formula for 1RM estimation. Most accurate with 1-10 rep sets.
        </p>
      </div>
      
      {/* Results Section */}
      {result ? (
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#E6E9EF]">Your Results</h3>
              <p className="text-sm text-[#6B7280]">{standards.name} Strength Analysis</p>
            </div>
            <div className="text-right">
              <div 
                className="text-3xl font-bold tabular-nums"
                style={{ color: result.levelColor }}
              >
                +{result.relativeStrength}%
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: result.levelColor }}
              >
                {result.level}
              </div>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Estimated 1RM</p>
              <p className="text-2xl font-bold text-[#E6E9EF] tabular-nums">
                {result.estimated1RM} <span className="text-sm text-[#6B7280]">{standards.unit}</span>
              </p>
            </div>
            <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Added Weight 1RM</p>
              <p className="text-2xl font-bold text-[#C1121F] tabular-nums">
                +{result.addedWeight1RM} <span className="text-sm text-[#6B7280]">{standards.unit}</span>
              </p>
            </div>
            <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Relative Strength</p>
              <p className="text-2xl font-bold text-[#E6E9EF] tabular-nums">
                +{result.relativeStrength}% <span className="text-sm text-[#6B7280]">BW</span>
              </p>
            </div>
          </div>
          
          {/* Skill Correlations */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-[#E6E9EF] mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#C1121F]" />
              Skill Readiness Based on Strength
            </h4>
            
            {/* Unlocked Skills */}
            {result.unlockedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {result.unlockedSkills.map((skill) => (
                  <span 
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-full text-sm text-[#22C55E]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {skill}
                  </span>
                ))}
              </div>
            )}
            
            {/* Next Skill Progress */}
            {result.nextSkill && (
              <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#4F6D8A]" />
                    <span className="text-sm text-[#A4ACB8]">Next Goal: {result.nextSkill.skill}</span>
                  </div>
                  <span className="text-sm text-[#6B7280]">
                    Need +{result.nextSkill.threshold}% BW
                  </span>
                </div>
                <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#4F6D8A] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(result.progressToNext, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[#6B7280] mt-2">
                  {result.progressToNext}% of required strength
                </p>
              </div>
            )}
          </div>
          
          {/* Level Description */}
          <div className="flex items-center gap-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
            <TrendingUp 
              className="w-5 h-5 flex-shrink-0"
              style={{ color: result.levelColor }}
            />
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider">Your Level</p>
              <p className="text-sm text-[#E6E9EF] font-medium">
                {result.level} - {result.levelDescription}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-[#0F1115] border-[#2B313A] border-dashed p-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#1A1F26] flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-7 h-7 text-[#6B7280]" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-[#E6E9EF]">Enter Your Data</h3>
            <p className="text-[#6B7280] text-sm max-w-md mx-auto">
              Input your bodyweight, added weight, and reps completed to calculate your estimated 1RM and see your strength level.
            </p>
          </div>
        </Card>
      )}
      
      {/* Strength Standards Reference */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
        <h4 className="text-sm font-medium text-[#E6E9EF] mb-4">Strength Standards Reference</h4>
        <div className="grid grid-cols-5 gap-2">
          {standards.levels.map((level) => (
            <div 
              key={level.level}
              className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A] text-center"
            >
              <p 
                className="text-xs font-medium mb-1"
                style={{ color: level.color }}
              >
                {level.level}
              </p>
              <p className="text-sm font-bold text-[#E6E9EF]">
                +{level.min}-{level.max === 200 ? '100+' : level.max}%
              </p>
            </div>
          ))}
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
                  Track Strength Over Time
                </h4>
                <p className="text-sm text-[#A4ACB8]">
                  Log your PRs, see progress trends, and get adaptive program recommendations based on your strength data.
                </p>
              </div>
            </div>
            <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
              <Link href="/strength">
                Open Strength Tracker
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

// Export types for use in other components
export type { ExerciseType, CalculatorResult }
export { STRENGTH_STANDARDS }
