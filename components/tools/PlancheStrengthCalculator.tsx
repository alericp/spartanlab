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

type ReadinessLevel = 'foundation' | 'developing' | 'advanced' | 'ready'
type PlancheProgression = 'Tuck Planche' | 'Advanced Tuck' | 'Straddle Planche' | 'Full Planche'

interface TestResult {
  score: number
  level: ReadinessLevel
  levelLabel: string
  message: string
  pushingStrengthScore: number
  leanAngleScore: number
  compressionScore: number
  recommendations: string[]
  recommendedProgression: PlancheProgression
}

interface InputValues {
  bodyweight: number
  unit: 'lbs' | 'kg'
  pseudoPlanchePushups: number
  plancheLeanHold: number
  weightedDip: number
  maxDips: number
}

function calculatePlancheReadiness(inputs: InputValues): TestResult {
  const { bodyweight, unit, pseudoPlanchePushups, plancheLeanHold, weightedDip, maxDips } = inputs
  
  // Convert to kg for calculations
  const bwKg = unit === 'lbs' ? bodyweight * 0.453592 : bodyweight
  const addedDipKg = unit === 'lbs' ? weightedDip * 0.453592 : weightedDip
  
  const recommendations: string[] = []
  
  // 1. Pushing Strength Score (40% weight)
  // Target: +50% BW weighted dip for straddle planche
  let pushingStrengthScore = 0
  const relativeDipStrength = bwKg > 0 ? addedDipKg / bwKg : 0
  
  if (relativeDipStrength >= 0.75) {
    pushingStrengthScore = 100
  } else if (relativeDipStrength >= 0.55) {
    pushingStrengthScore = 85
  } else if (relativeDipStrength >= 0.40) {
    pushingStrengthScore = 70
  } else if (relativeDipStrength >= 0.25) {
    pushingStrengthScore = 55
    recommendations.push('Build weighted dip to +40% BW')
  } else if (maxDips >= 20) {
    pushingStrengthScore = 45
    recommendations.push('Start weighted dip training')
  } else if (maxDips >= 10) {
    pushingStrengthScore = 30
    recommendations.push('Increase dip volume to 20+ reps')
  } else {
    pushingStrengthScore = Math.min(25, maxDips * 2.5)
    recommendations.push('Focus on building dip base strength')
  }
  
  // 2. Lean Angle Tolerance Score (35% weight)
  // Based on planche lean hold time
  let leanAngleScore = 0
  if (plancheLeanHold >= 60) {
    leanAngleScore = 100
  } else if (plancheLeanHold >= 45) {
    leanAngleScore = 85
  } else if (plancheLeanHold >= 30) {
    leanAngleScore = 70
  } else if (plancheLeanHold >= 20) {
    leanAngleScore = 55
    recommendations.push('Increase planche lean hold to 30+ seconds')
  } else if (plancheLeanHold >= 10) {
    leanAngleScore = 40
    recommendations.push('Build planche lean endurance')
  } else {
    leanAngleScore = Math.min(35, plancheLeanHold * 3.5)
    recommendations.push('Start with basic planche lean holds')
  }
  
  // 3. Core Compression Score (25% weight)
  // Estimated from pseudo planche push-up performance
  let compressionScore = 0
  if (pseudoPlanchePushups >= 15) {
    compressionScore = 100
  } else if (pseudoPlanchePushups >= 12) {
    compressionScore = 85
  } else if (pseudoPlanchePushups >= 8) {
    compressionScore = 70
  } else if (pseudoPlanchePushups >= 5) {
    compressionScore = 50
    recommendations.push('Build pseudo planche push-up volume to 12+ reps')
  } else if (pseudoPlanchePushups >= 3) {
    compressionScore = 35
    recommendations.push('Focus on deep pseudo planche push-ups')
  } else {
    compressionScore = Math.min(30, pseudoPlanchePushups * 10)
    recommendations.push('Develop pseudo planche push-up strength')
  }
  
  // Calculate weighted total score
  const totalScore = Math.round(
    (pushingStrengthScore * 0.40) +
    (leanAngleScore * 0.35) +
    (compressionScore * 0.25)
  )
  
  // Determine readiness level and recommended progression
  let level: ReadinessLevel
  let levelLabel: string
  let message: string
  let recommendedProgression: PlancheProgression
  
  if (totalScore >= 85) {
    level = 'ready'
    levelLabel = 'Advanced Planche Ready'
    message = 'You have exceptional pushing strength. Focus on straddle and full planche training.'
    recommendedProgression = 'Straddle Planche'
  } else if (totalScore >= 65) {
    level = 'advanced'
    levelLabel = 'Advanced Tuck Ready'
    message = 'You are ready for advanced tuck planche work. Build lean angle tolerance.'
    recommendedProgression = 'Advanced Tuck'
  } else if (totalScore >= 40) {
    level = 'developing'
    levelLabel = 'Building Strength'
    message = 'Continue developing pushing strength and planche lean capacity.'
    recommendedProgression = 'Tuck Planche'
  } else {
    level = 'foundation'
    levelLabel = 'Foundation Phase'
    message = 'Focus on building base pushing strength before planche-specific training.'
    recommendedProgression = 'Tuck Planche'
  }
  
  return {
    score: totalScore,
    level,
    levelLabel,
    message,
    pushingStrengthScore,
    leanAngleScore,
    compressionScore,
    recommendations: recommendations.slice(0, 3),
    recommendedProgression
  }
}

export function PlancheStrengthCalculator({ showCTA = true }: { showCTA?: boolean }) {
  const [inputs, setInputs] = useState<InputValues>({
    bodyweight: 170,
    unit: 'lbs',
    pseudoPlanchePushups: 5,
    plancheLeanHold: 15,
    weightedDip: 25,
    maxDips: 15
  })
  
  const [hasCalculated, setHasCalculated] = useState(false)
  
  const result = useMemo(() => calculatePlancheReadiness(inputs), [inputs])
  
  const handleCalculate = () => {
    setHasCalculated(true)
    trackToolUsed('planche_strength_calculator')
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
      case 'advanced': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'developing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default: return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }
  
  const getProgressionColor = (prog: PlancheProgression) => {
    switch (prog) {
      case 'Full Planche': return 'text-green-400'
      case 'Straddle Planche': return 'text-amber-400'
      case 'Advanced Tuck': return 'text-orange-400'
      default: return 'text-[#C1121F]'
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
        
        {/* Pseudo Planche Push-ups */}
        <div>
          <label className="block text-sm text-[#A4ACB8] mb-2">Pseudo Planche Push-Up Reps</label>
          <input
            type="number"
            value={inputs.pseudoPlanchePushups}
            onChange={(e) => updateInput('pseudoPlanchePushups', parseInt(e.target.value) || 0)}
            className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            placeholder="e.g., 8"
          />
        </div>
        
        {/* Planche Lean Hold */}
        <div>
          <label className="block text-sm text-[#A4ACB8] mb-2">Planche Lean Hold (seconds)</label>
          <input
            type="number"
            value={inputs.plancheLeanHold}
            onChange={(e) => updateInput('plancheLeanHold', parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            placeholder="e.g., 30"
          />
          <p className="text-xs text-[#6B7280] mt-1">Maximum hold at lean angle</p>
        </div>
        
        {/* Weighted Dip */}
        <div>
          <label className="block text-sm text-[#A4ACB8] mb-2">Weighted Dip (added weight)</label>
          <input
            type="number"
            value={inputs.weightedDip}
            onChange={(e) => updateInput('weightedDip', parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            placeholder={`e.g., 45 ${inputs.unit}`}
          />
          <p className="text-xs text-[#6B7280] mt-1">Enter 0 if you don't train weighted</p>
        </div>
        
        {/* Max Dips */}
        <div className="sm:col-span-2">
          <label className="block text-sm text-[#A4ACB8] mb-2">Max Dip Reps (bodyweight)</label>
          <input
            type="number"
            value={inputs.maxDips}
            onChange={(e) => updateInput('maxDips', parseInt(e.target.value) || 0)}
            className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-3 py-2 text-[#E6E9EF] focus:border-[#C1121F] focus:outline-none"
            placeholder="e.g., 20"
          />
        </div>
      </div>
      
      {/* Calculate Button */}
      <Button 
        onClick={handleCalculate}
        className="w-full bg-[#C1121F] hover:bg-[#A30F1A] h-12"
      >
        <Target className="w-4 h-4 mr-2" />
        Calculate Planche Readiness
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
                  <span className="text-[#A4ACB8]">Horizontal Pushing Strength (40%)</span>
                  <span className="text-[#E6E9EF]">{result.pushingStrengthScore}/100</span>
                </div>
                <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C1121F] rounded-full transition-all"
                    style={{ width: `${result.pushingStrengthScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A4ACB8]">Lean Angle Tolerance (35%)</span>
                  <span className="text-[#E6E9EF]">{result.leanAngleScore}/100</span>
                </div>
                <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C1121F] rounded-full transition-all"
                    style={{ width: `${result.leanAngleScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A4ACB8]">Core Compression Strength (25%)</span>
                  <span className="text-[#E6E9EF]">{result.compressionScore}/100</span>
                </div>
                <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C1121F] rounded-full transition-all"
                    style={{ width: `${result.compressionScore}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
          
          {/* Recommended Progression */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/20">
            <Target className="w-5 h-5 text-[#C1121F] shrink-0" />
            <div>
              <p className="text-sm text-[#A4ACB8]">Recommended Progression</p>
              <p className={`font-semibold ${getProgressionColor(result.recommendedProgression)}`}>
                {result.recommendedProgression}
              </p>
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
              <Link href="/programs">
                <Button className="w-full bg-[#C1121F] hover:bg-[#A30F1A] h-12">
                  Generate Planche Training Program
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
