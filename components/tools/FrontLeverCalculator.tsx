'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Dumbbell,
  Timer,
  ArrowRight
} from 'lucide-react'

// Readiness stages
type ReadinessStage = 'early' | 'intermediate' | 'advanced' | 'ready'

interface ReadinessResult {
  percentage: number
  stage: ReadinessStage
  stageLabel: string
  explanation: string
  focusAreas: string[]
  strengths: string[]
  primaryLimiter: string | null
  suggestedProgression: string
}

interface InputValues {
  bodyweight: number
  height: number
  heightUnit: 'in' | 'cm'
  unit: 'lbs' | 'kg'
  maxPullUps: number
  weightedPullUp: number
  frontLeverHold: number
  advTuckHold: number
  ringRows: number
  hangingLegRaise: number
}

// Calculate readiness score from inputs
function calculateReadiness(inputs: InputValues): ReadinessResult {
  const { 
    bodyweight, 
    maxPullUps, 
    weightedPullUp, 
    frontLeverHold, 
    advTuckHold, 
    ringRows, 
    hangingLegRaise,
    unit
  } = inputs
  
  // Convert to kg for calculations if needed
  const bwKg = unit === 'lbs' ? bodyweight * 0.453592 : bodyweight
  const addedKg = unit === 'lbs' ? weightedPullUp * 0.453592 : weightedPullUp
  
  // Score components (0-100 each)
  const scores: Record<string, number> = {}
  const strengths: string[] = []
  const focusAreas: string[] = []
  
  // 1. Pull strength score (weighted heavily)
  // Target: 15+ pull-ups or +40% BW weighted pull-up
  let pullScore = 0
  if (maxPullUps >= 20) {
    pullScore = 100
    strengths.push('Excellent pulling endurance')
  } else if (maxPullUps >= 15) {
    pullScore = 80
    strengths.push('Strong pulling endurance')
  } else if (maxPullUps >= 10) {
    pullScore = 60
  } else if (maxPullUps >= 5) {
    pullScore = 35
    focusAreas.push('Build pull-up volume to 15+ reps')
  } else {
    pullScore = Math.min(30, maxPullUps * 6)
    focusAreas.push('Focus on pull-up progressions')
  }
  scores.pull = pullScore
  
  // 2. Weighted pull-up score
  // Target: +40% BW for advanced progressions
  let weightedScore = 0
  if (bwKg > 0 && addedKg > 0) {
    const relativeStrength = addedKg / bwKg
    if (relativeStrength >= 0.5) {
      weightedScore = 100
      strengths.push('Elite pulling strength')
    } else if (relativeStrength >= 0.4) {
      weightedScore = 85
      strengths.push('Strong weighted pull-up')
    } else if (relativeStrength >= 0.25) {
      weightedScore = 65
    } else if (relativeStrength >= 0.1) {
      weightedScore = 40
      focusAreas.push('Increase weighted pull-up strength')
    } else {
      weightedScore = 20
    }
  } else if (maxPullUps >= 15) {
    // No weighted data but good pull-up count
    weightedScore = 50
  }
  scores.weighted = weightedScore
  
  // 3. Core strength score
  // Target: 15+ hanging leg raises
  let coreScore = 0
  if (hangingLegRaise >= 15) {
    coreScore = 100
    strengths.push('Excellent core strength')
  } else if (hangingLegRaise >= 10) {
    coreScore = 75
  } else if (hangingLegRaise >= 5) {
    coreScore = 50
    focusAreas.push('Increase hanging leg raise volume')
  } else {
    coreScore = Math.min(40, hangingLegRaise * 8)
    focusAreas.push('Build core anti-extension strength')
  }
  scores.core = coreScore
  
  // 4. Lever progression score
  // Target: 10s+ adv tuck hold or any front lever hold
  let leverScore = 0
  if (frontLeverHold >= 5) {
    leverScore = 100
    strengths.push('Strong front lever skill')
  } else if (frontLeverHold >= 3) {
    leverScore = 85
    strengths.push('Developing front lever')
  } else if (advTuckHold >= 15) {
    leverScore = 75
    strengths.push('Solid adv tuck hold')
  } else if (advTuckHold >= 10) {
    leverScore = 60
  } else if (advTuckHold >= 5) {
    leverScore = 40
    focusAreas.push('Build adv tuck hold duration')
  } else {
    leverScore = Math.min(35, advTuckHold * 7)
    focusAreas.push('Practice tuck front lever holds')
  }
  scores.lever = leverScore
  
  // 5. Row strength score
  // Target: 20+ ring rows
  let rowScore = 0
  if (ringRows >= 25) {
    rowScore = 100
    strengths.push('Strong horizontal pull')
  } else if (ringRows >= 20) {
    rowScore = 80
  } else if (ringRows >= 15) {
    rowScore = 60
  } else if (ringRows >= 10) {
    rowScore = 40
    focusAreas.push('Increase ring row volume')
  } else {
    rowScore = Math.min(35, ringRows * 3.5)
    focusAreas.push('Build horizontal pulling strength')
  }
  scores.row = rowScore
  
  // Calculate weighted average
  // Pull strength: 25%, Weighted: 20%, Core: 20%, Lever: 25%, Rows: 10%
  const totalScore = Math.round(
    scores.pull * 0.25 +
    scores.weighted * 0.20 +
    scores.core * 0.20 +
    scores.lever * 0.25 +
    scores.row * 0.10
  )
  
  // Determine stage
  let stage: ReadinessStage
  let stageLabel: string
  let explanation: string
  
  if (totalScore >= 85) {
    stage = 'ready'
    stageLabel = 'Front Lever Ready'
    explanation = 'Your pulling strength, core stability, and lever skill indicate you have the prerequisites for the full front lever. Focus on skill practice and progressive overload.'
  } else if (totalScore >= 65) {
    stage = 'advanced'
    stageLabel = 'Advanced Preparation'
    explanation = 'Your pulling strength is strong enough to support the front lever, but additional lever hold practice and core compression work may still be needed.'
  } else if (totalScore >= 40) {
    stage = 'intermediate'
    stageLabel = 'Intermediate Progress'
    explanation = 'You have built a foundation of pulling strength. Continue building weighted pull-up strength and practicing lever progressions.'
  } else {
    stage = 'early'
    stageLabel = 'Early Strength Stage'
    explanation = 'Focus on building foundational pulling strength through pull-ups, rows, and core work before attempting lever progressions.'
  }
  
  // Limit arrays
  const uniqueStrengths = [...new Set(strengths)].slice(0, 3)
  const uniqueFocus = [...new Set(focusAreas)].slice(0, 4)
  
  // Determine primary limiter
  let primaryLimiter: string | null = null
  const scoreEntries = Object.entries(scores)
  const lowestScore = scoreEntries.reduce((min, [key, val]) => val < min.val ? { key, val } : min, { key: '', val: 100 })
  
  if (lowestScore.val < 60) {
    if (lowestScore.key === 'pull') {
      primaryLimiter = 'Pulling strength may be limiting your front lever progression.'
    } else if (lowestScore.key === 'weighted') {
      primaryLimiter = 'Maximum pulling strength needs development for advanced lever positions.'
    } else if (lowestScore.key === 'core') {
      primaryLimiter = 'Core anti-extension strength may be limiting your front lever hold.'
    } else if (lowestScore.key === 'lever') {
      primaryLimiter = 'More lever skill practice needed. Focus on building hold duration.'
    } else if (lowestScore.key === 'row') {
      primaryLimiter = 'Horizontal pulling strength needs development.'
    }
  }
  
  // Suggest appropriate progression
  let suggestedProgression: string
  if (totalScore >= 85) {
    suggestedProgression = 'One-Leg Front Lever or Straddle Front Lever'
  } else if (totalScore >= 65) {
    suggestedProgression = 'Advanced Tuck Front Lever'
  } else if (totalScore >= 40) {
    suggestedProgression = 'Tuck Front Lever'
  } else {
    suggestedProgression = 'Tuck Front Lever (with assistance)'
  }
  
  return {
    percentage: totalScore,
    stage,
    stageLabel,
    explanation,
    focusAreas: uniqueFocus,
    strengths: uniqueStrengths,
    primaryLimiter,
    suggestedProgression,
  }
}

interface FrontLeverCalculatorProps {
  showCTA?: boolean
}

export function FrontLeverCalculator({ showCTA = true }: FrontLeverCalculatorProps) {
  const [inputs, setInputs] = useState<InputValues>({
    bodyweight: 0,
    height: 0,
    heightUnit: 'in',
    unit: 'lbs',
    maxPullUps: 0,
    weightedPullUp: 0,
    frontLeverHold: 0,
    advTuckHold: 0,
    ringRows: 0,
    hangingLegRaise: 0,
  })
  
  const [hasCalculated, setHasCalculated] = useState(false)
  
  const result = useMemo(() => {
    if (!hasCalculated) return null
    return calculateReadiness(inputs)
  }, [inputs, hasCalculated])
  
  const handleInputChange = (field: keyof InputValues, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    setHasCalculated(false)
  }
  
  const handleCalculate = () => {
    setHasCalculated(true)
  }
  
  const getStageColor = (stage: ReadinessStage) => {
    switch (stage) {
      case 'ready': return '#22C55E'
      case 'advanced': return '#C1121F'
      case 'intermediate': return '#4F6D8A'
      case 'early': return '#6B7280'
    }
  }
  
  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="space-y-6">
        {/* Bodyweight & Height Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
              Bodyweight
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="500"
                value={inputs.bodyweight || ''}
                onChange={(e) => handleInputChange('bodyweight', Number(e.target.value))}
                placeholder="Enter weight"
                className="flex-1 bg-[#0F1115] border border-[#2B313A] rounded-lg px-4 py-3 text-[#E6E9EF] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
              />
              <select
                value={inputs.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-3 text-[#E6E9EF] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
              Height
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="300"
                value={inputs.height || ''}
                onChange={(e) => handleInputChange('height', Number(e.target.value))}
                placeholder="Enter height"
                className="flex-1 bg-[#0F1115] border border-[#2B313A] rounded-lg px-4 py-3 text-[#E6E9EF] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
              />
              <select
                value={inputs.heightUnit}
                onChange={(e) => handleInputChange('heightUnit', e.target.value)}
                className="bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-3 text-[#E6E9EF] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
              >
                <option value="in">in</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Pull-ups Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
              Max Pull-Ups
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={inputs.maxPullUps || ''}
              onChange={(e) => handleInputChange('maxPullUps', Number(e.target.value))}
              placeholder="Max reps"
              className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-4 py-3 text-[#E6E9EF] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
              Max Weighted Pull-Up ({inputs.unit})
              <span className="text-[#6B7280] ml-1">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              max="300"
              value={inputs.weightedPullUp || ''}
              onChange={(e) => handleInputChange('weightedPullUp', Number(e.target.value))}
              placeholder="Added weight"
              className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-4 py-3 text-[#E6E9EF] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
            />
          </div>
        </div>
        
        {/* Adv Tuck Hold & Ring Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
              Advanced Tuck Hold (seconds)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={inputs.advTuckHold || ''}
              onChange={(e) => handleInputChange('advTuckHold', Number(e.target.value))}
              placeholder="Best hold time"
              className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-4 py-3 text-[#E6E9EF] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
              Hanging Leg Raises (max reps)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={inputs.hangingLegRaise || ''}
              onChange={(e) => handleInputChange('hangingLegRaise', Number(e.target.value))}
              placeholder="Max reps"
              className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-4 py-3 text-[#E6E9EF] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
            />
          </div>
        </div>
        
        
        
        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white py-3 text-base font-semibold"
        >
          Calculate Readiness
        </Button>
      </div>
      
      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Main Score */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="text-center mb-6">
              <p className="text-[#A4ACB8] text-sm uppercase tracking-wide mb-2">
                Front Lever Readiness Score
              </p>
              <div 
                className="text-6xl font-bold mb-2"
                style={{ color: getStageColor(result.stage) }}
              >
                {result.percentage}%
              </div>
              <p 
                className="text-lg font-semibold"
                style={{ color: getStageColor(result.stage) }}
              >
                {result.stageLabel}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#2B313A] rounded-full overflow-hidden mb-6">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${result.percentage}%`,
                  backgroundColor: getStageColor(result.stage)
                }}
              />
            </div>
            
            {/* Stage Labels */}
            <div className="flex justify-between text-xs text-[#6B7280] mb-6">
              <span>0%</span>
              <span>40%</span>
              <span>65%</span>
              <span>85%</span>
              <span>100%</span>
            </div>
            
            {/* Suggested Progression */}
            <div className="bg-[#1A1F26] rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[#C1121F]" />
                <span className="text-sm font-medium text-[#E6E9EF]">Suggested Progression</span>
              </div>
              <p className="text-lg font-semibold text-[#E6E9EF]">
                {result.suggestedProgression}
              </p>
            </div>
            
            {/* Limiter Detection */}
            {result.primaryLimiter && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-amber-400">Primary Limiter Detected</span>
                    <p className="text-[#A4ACB8] text-sm mt-1">
                      {result.primaryLimiter}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Explanation */}
            <div className="bg-[#1A1F26] rounded-lg p-4">
              <p className="text-[#A4ACB8] leading-relaxed">
                {result.explanation}
              </p>
            </div>
          </Card>
          
          {/* Strengths & Focus Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            {result.strengths.length > 0 && (
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  <h3 className="font-semibold text-[#E6E9EF]">Your Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {result.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#A4ACB8] text-sm">
                      <Zap className="w-4 h-4 text-[#22C55E] mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            
            {/* Focus Areas */}
            {result.focusAreas.length > 0 && (
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-[#C1121F]" />
                  <h3 className="font-semibold text-[#E6E9EF]">Recommended Focus</h3>
                </div>
                <ul className="space-y-2">
                  {result.focusAreas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#A4ACB8] text-sm">
                      <ChevronRight className="w-4 h-4 text-[#C1121F] mt-0.5 flex-shrink-0" />
                      {area}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
          
          {/* Training Recommendations */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-5 h-5 text-[#4F6D8A]" />
              <h3 className="font-semibold text-[#E6E9EF]">Training Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.stage === 'early' && (
                <>
                  <RecommendationItem text="Pull-up progressions (3x/week)" />
                  <RecommendationItem text="Inverted rows (high volume)" />
                  <RecommendationItem text="Hanging knee raises" />
                  <RecommendationItem text="Dead hangs for grip" />
                </>
              )}
              {result.stage === 'intermediate' && (
                <>
                  <RecommendationItem text="Weighted pull-ups (2x/week)" />
                  <RecommendationItem text="Tuck front lever holds" />
                  <RecommendationItem text="Front lever rows (tuck)" />
                  <RecommendationItem text="Hanging leg raises" />
                </>
              )}
              {result.stage === 'advanced' && (
                <>
                  <RecommendationItem text="Advanced tuck front lever holds" />
                  <RecommendationItem text="Front lever rows" />
                  <RecommendationItem text="Compression lifts" />
                  <RecommendationItem text="Ice cream makers" />
                </>
              )}
              {result.stage === 'ready' && (
                <>
                  <RecommendationItem text="One-leg / Straddle front lever" />
                  <RecommendationItem text="Front lever raises" />
                  <RecommendationItem text="Front lever pulls" />
                  <RecommendationItem text="Skill practice (high frequency)" />
                </>
              )}
            </div>
          </Card>
          
          {/* CTA Section */}
          {showCTA && (
            <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#C1121F]/30 p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#E6E9EF] mb-3">
                  Want a personalized front lever training plan based on your current level?
                </h3>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  Generate your SpartanLab training program. Our adaptive engine will build workouts tailored to your strengths, weaknesses, and available time.
                </p>
                <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] text-white px-8 py-3 font-semibold">
                  <Link href="/sign-up">
                    Start Training
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function RecommendationItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[#A4ACB8] text-sm bg-[#0F1115] rounded-lg px-3 py-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F]" />
      {text}
    </div>
  )
}
