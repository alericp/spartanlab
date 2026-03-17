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
  Dumbbell,
  Timer,
  ArrowRight,
  Zap
} from 'lucide-react'
import { trackToolUsed } from '@/lib/analytics'

type ReadinessLevel = 'not_ready' | 'building' | 'close' | 'ready'

interface TestResult {
  score: number
  level: ReadinessLevel
  levelLabel: string
  message: string
  pullStrengthScore: number
  coreStrengthScore: number
  leverageScore: number
  recommendations: string[]
  estimatedProgression: string
}

interface InputValues {
  bodyweight: number
  unit: 'lbs' | 'kg'
  maxPullUps: number
  weightedPullUp: number
  frontLeverHoldTime: number
}

function calculateFrontLeverReadiness(inputs: InputValues): TestResult {
  const { bodyweight, unit, maxPullUps, weightedPullUp, frontLeverHoldTime } = inputs
  
  // Convert to kg for calculations
  const bwKg = unit === 'lbs' ? bodyweight * 0.453592 : bodyweight
  const addedKg = unit === 'lbs' ? weightedPullUp * 0.453592 : weightedPullUp
  
  const recommendations: string[] = []
  
  // 1. Pull Strength Score (40% weight)
  // Target: +50% BW weighted pull-up for full FL
  let pullStrengthScore = 0
  const relativeStrength = bwKg > 0 ? addedKg / bwKg : 0
  
  if (relativeStrength >= 0.65) {
    pullStrengthScore = 100
  } else if (relativeStrength >= 0.50) {
    pullStrengthScore = 85
  } else if (relativeStrength >= 0.35) {
    pullStrengthScore = 70
  } else if (relativeStrength >= 0.20) {
    pullStrengthScore = 50
    recommendations.push('Build weighted pull-up to +35% BW')
  } else if (maxPullUps >= 15) {
    pullStrengthScore = 45
    recommendations.push('Start weighted pull-up training')
  } else if (maxPullUps >= 10) {
    pullStrengthScore = 30
    recommendations.push('Increase pull-up volume to 15+ reps')
  } else {
    pullStrengthScore = Math.min(25, maxPullUps * 3)
    recommendations.push('Focus on building pull-up base strength')
  }
  
  // 2. Core Strength Score (30% weight)
  // Estimated from pull-up and weighted performance
  let coreStrengthScore = 0
  if (maxPullUps >= 20 && relativeStrength >= 0.4) {
    coreStrengthScore = 90
  } else if (maxPullUps >= 15 && relativeStrength >= 0.25) {
    coreStrengthScore = 75
  } else if (maxPullUps >= 12) {
    coreStrengthScore = 60
    recommendations.push('Add hanging leg raises and dragon flag negatives')
  } else if (maxPullUps >= 8) {
    coreStrengthScore = 45
    recommendations.push('Build core anti-extension strength')
  } else {
    coreStrengthScore = 30
    recommendations.push('Develop foundational core stability')
  }
  
  // 3. Leverage Score (30% weight)
  // Based on current hold time
  let leverageScore = 0
  if (frontLeverHoldTime >= 8) {
    leverageScore = 100
  } else if (frontLeverHoldTime >= 5) {
    leverageScore = 85
  } else if (frontLeverHoldTime >= 3) {
    leverageScore = 70
  } else if (frontLeverHoldTime >= 1) {
    leverageScore = 50
    recommendations.push('Practice straddle front lever for longer holds')
  } else {
    leverageScore = Math.max(20, Math.min(40, pullStrengthScore * 0.5))
    recommendations.push('Start with tuck front lever progressions')
  }
  
  // Calculate weighted total score
  const totalScore = Math.round(
    (pullStrengthScore * 0.40) +
    (coreStrengthScore * 0.30) +
    (leverageScore * 0.30)
  )
  
  // Determine readiness level
  let level: ReadinessLevel
  let levelLabel: string
  let message: string
  let estimatedProgression: string
  
  if (totalScore >= 85) {
    level = 'ready'
    levelLabel = 'Front Lever Ready'
    message = 'You have the strength foundation for a solid front lever. Focus on hold time and body tension.'
    estimatedProgression = 'Full Front Lever'
  } else if (totalScore >= 65) {
    level = 'close'
    levelLabel = 'Nearly There'
    message = 'You are close to achieving the front lever. Keep building pulling strength and practice progressions.'
    estimatedProgression = 'Straddle Front Lever'
  } else if (totalScore >= 40) {
    level = 'building'
    levelLabel = 'Building Foundation'
    message = 'You are on the path. Continue developing your pulling strength and core stability.'
    estimatedProgression = 'Advanced Tuck Front Lever'
  } else {
    level = 'not_ready'
    levelLabel = 'Foundation Phase'
    message = 'Focus on building base strength before intensive front lever training.'
    estimatedProgression = 'Tuck Front Lever'
  }
  
  return {
    score: totalScore,
    level,
    levelLabel,
    message,
    pullStrengthScore,
    coreStrengthScore,
    leverageScore,
    recommendations: recommendations.slice(0, 3),
    estimatedProgression
  }
}

export function FrontLeverStrengthTest({ showCTA = true }: { showCTA?: boolean }) {
  const [inputs, setInputs] = useState<InputValues>({
    bodyweight: 170,
    unit: 'lbs',
    maxPullUps: 10,
    weightedPullUp: 25,
    frontLeverHoldTime: 0
  })
  
  const [hasCalculated, setHasCalculated] = useState(false)
  
  const result = useMemo(() => calculateFrontLeverReadiness(inputs), [inputs])
  
  const handleCalculate = () => {
    setHasCalculated(true)
    trackToolUsed('front_lever_strength_test')
  }
  
  const updateInput = (field: keyof InputValues, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    if (hasCalculated) setHasCalculated(false)
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400'
    if (score >= 65) return 'text-amber-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }
  
  const getLevelColor = (level: ReadinessLevel) => {
    switch (level) {
      case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'close': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'building': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default: return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Bodyweight */}
        <div>
          <label className="block text-sm text-[#A4ACB8] mb-2">Bodyweight</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputs.bodyweight}
              onChange={(e) => updateInput('bodyweight', parseFloat(e.target.value) || 0)}
              className="flex-1 bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            />
            <select
              value={inputs.unit}
              onChange={(e) => updateInput('unit', e.target.value)}
              className="bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>
        
        {/* Max Pull-ups */}
        <div>
          <label className="block text-sm text-[#A4ACB8] mb-2">Max Pull-Up Reps (strict)</label>
          <input
            type="number"
            value={inputs.maxPullUps}
            onChange={(e) => updateInput('maxPullUps', parseInt(e.target.value) || 0)}
            className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            placeholder="e.g., 12"
          />
        </div>
        
        {/* Weighted Pull-up */}
        <div>
          <label className="block text-sm text-[#A4ACB8] mb-2">Weighted Pull-Up (added weight)</label>
          <input
            type="number"
            value={inputs.weightedPullUp}
            onChange={(e) => updateInput('weightedPullUp', parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            placeholder={`e.g., 45 ${inputs.unit}`}
          />
          <p className="text-xs text-[#6B7280] mt-1">Enter 0 if you don't train weighted</p>
        </div>
        
        {/* Front Lever Hold */}
        <div>
          <label className="block text-sm text-[#A4ACB8] mb-2">Front Lever Hold Time (seconds)</label>
          <input
            type="number"
            value={inputs.frontLeverHoldTime}
            onChange={(e) => updateInput('frontLeverHoldTime', parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            placeholder="e.g., 3"
          />
          <p className="text-xs text-[#6B7280] mt-1">Full front lever hold, 0 if not yet achieved</p>
        </div>
      </div>
      
      {/* Calculate Button */}
      <Button 
        onClick={handleCalculate}
        className="w-full bg-[#C1121F] hover:bg-[#A30F1A] h-12"
      >
        <Target className="w-4 h-4 mr-2" />
        Calculate Front Lever Readiness
      </Button>
      
      {/* Results */}
      {hasCalculated && (
        <div className="space-y-6 pt-4 border-t border-[#2B313A]">
          {/* Score Display */}
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">
              <span className={getScoreColor(result.score)}>{result.score}</span>
              <span className="text-2xl text-[#6B7280]"> / 100</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${getLevelColor(result.level)}`}>
              {result.level === 'ready' ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              {result.levelLabel}
            </div>
            <p className="text-[#A4ACB8] mt-3 max-w-md mx-auto">{result.message}</p>
          </div>
          
          {/* Score Breakdown */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-4">
            <h4 className="font-medium text-[#E6E9EF] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C1121F]" />
              Score Breakdown
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A4ACB8]">Pull Strength (40%)</span>
                  <span className="text-[#E6E9EF]">{result.pullStrengthScore}/100</span>
                </div>
                <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C1121F] rounded-full transition-all"
                    style={{ width: `${result.pullStrengthScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A4ACB8]">Core Strength (30%)</span>
                  <span className="text-[#E6E9EF]">{result.coreStrengthScore}/100</span>
                </div>
                <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C1121F] rounded-full transition-all"
                    style={{ width: `${result.coreStrengthScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A4ACB8]">Leverage Factor (30%)</span>
                  <span className="text-[#E6E9EF]">{result.leverageScore}/100</span>
                </div>
                <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C1121F] rounded-full transition-all"
                    style={{ width: `${result.leverageScore}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
          
          {/* Estimated Progression */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/20">
            <Target className="w-5 h-5 text-[#C1121F] shrink-0" />
            <div>
              <p className="text-sm text-[#A4ACB8]">Recommended Training Level</p>
              <p className="font-semibold text-[#E6E9EF]">{result.estimatedProgression}</p>
            </div>
          </div>
          
          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-[#E6E9EF] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Focus Areas
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                    <Dumbbell className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* CTA */}
          {showCTA && (
            <div className="pt-4 border-t border-[#2B313A]">
              <Link href="/my-programs">
                <Button className="w-full bg-[#C1121F] hover:bg-[#A30F1A] h-12">
                  Generate Front Lever Training Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
