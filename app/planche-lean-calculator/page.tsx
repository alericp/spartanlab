'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { 
  Calculator, 
  RefreshCw,
  ChevronRight,
  Target,
  Dumbbell,
  HelpCircle,
  ChevronDown,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { ToolConversionCard } from '@/components/tools/ToolConversionCard'
import { cn } from '@/lib/utils'

// Types for the calculator
interface PlancheLeanResult {
  score: number
  classification: string
  classificationColor: string
  limitingFactors: string[]
  recommendations: string[]
  nextMilestone: string
  breakdown: {
    leanQuality: number
    holdDuration: number
    supportingStrength: number
  }
}

// Classification levels
const CLASSIFICATIONS = [
  { min: 0, max: 20, label: 'Foundational', color: 'text-red-400', description: 'Building basic wrist and shoulder tolerance' },
  { min: 20, max: 40, label: 'Early Planche Prep', color: 'text-orange-400', description: 'Developing lean capacity and wrist strength' },
  { min: 40, max: 60, label: 'Strong Planche Prep', color: 'text-yellow-400', description: 'Solid lean foundation with good hold times' },
  { min: 60, max: 80, label: 'Advanced Lean Capacity', color: 'text-green-400', description: 'Ready to transition to tuck planche work' },
  { min: 80, max: 100, label: 'Tuck Planche Ready', color: 'text-emerald-400', description: 'Excellent lean capacity for progression' },
]

// FAQ Data
const faqs = [
  {
    question: 'How far should I lean for planche?',
    answer: 'A quality planche lean has shoulders significantly past wrists - typically 4-8 inches (10-20cm). Beginners start with 2-4 inches. Advanced practitioners can hold 8-12 inches of lean with control.'
  },
  {
    question: 'How long should I hold a planche lean?',
    answer: 'Start with 10-15 second holds. Progress to 30-60 seconds at moderate lean before increasing distance. Quality lean with 30+ seconds indicates readiness for tuck planche work.'
  },
  {
    question: 'Why do my wrists hurt during planche leans?',
    answer: 'Wrist pain is common with insufficient wrist conditioning. Always warm up wrists thoroughly. Use parallettes to reduce wrist extension. Build lean capacity gradually over weeks/months.'
  },
  {
    question: 'Is planche lean enough to build a planche?',
    answer: 'Planche leans are foundational but not sufficient alone. You also need pseudo planche push-ups, straight-arm strength, and eventually tuck planche holds. Leans develop wrist tolerance and shoulder angle awareness.'
  },
]

// Calculator logic
function calculatePlancheLeanScore(inputs: {
  leanDistance: number // in inches
  holdTime: number // in seconds
  bodyweight?: number
  maxPushUps?: number
  maxDips?: number
  weightedDip?: number
  lSitHold?: number
  pppuReps?: number
}): PlancheLeanResult {
  const { leanDistance, holdTime, bodyweight, maxPushUps, maxDips, weightedDip, lSitHold, pppuReps } = inputs
  
  // Score lean quality (0-100) - based on lean distance
  // <2" = minimal, 2-4" = developing, 4-6" = solid, 6-8" = advanced, 8+" = excellent
  let leanQualityScore = 0
  if (leanDistance < 2) {
    leanQualityScore = (leanDistance / 2) * 20
  } else if (leanDistance < 4) {
    leanQualityScore = 20 + ((leanDistance - 2) / 2) * 25
  } else if (leanDistance < 6) {
    leanQualityScore = 45 + ((leanDistance - 4) / 2) * 25
  } else if (leanDistance < 8) {
    leanQualityScore = 70 + ((leanDistance - 6) / 2) * 20
  } else {
    leanQualityScore = Math.min(100, 90 + ((leanDistance - 8) / 4) * 10)
  }
  
  // Score hold duration (0-100)
  // <10s = minimal, 10-20s = developing, 20-30s = solid, 30-45s = advanced, 45s+ = excellent
  let holdDurationScore = 0
  if (holdTime < 10) {
    holdDurationScore = (holdTime / 10) * 25
  } else if (holdTime < 20) {
    holdDurationScore = 25 + ((holdTime - 10) / 10) * 25
  } else if (holdTime < 30) {
    holdDurationScore = 50 + ((holdTime - 20) / 10) * 20
  } else if (holdTime < 45) {
    holdDurationScore = 70 + ((holdTime - 30) / 15) * 20
  } else {
    holdDurationScore = Math.min(100, 90 + ((holdTime - 45) / 30) * 10)
  }
  
  // Score supporting strength (0-100) - optional factors
  let supportingStrengthScore = 50 // Default if no supporting data
  let supportingFactors = 0
  let supportingTotal = 0
  
  if (maxPushUps !== undefined && maxPushUps > 0) {
    supportingFactors++
    // 20+ pushups = solid, 30+ = good, 40+ = excellent
    const pushScore = Math.min(100, (maxPushUps / 40) * 100)
    supportingTotal += pushScore
  }
  
  if (maxDips !== undefined && maxDips > 0) {
    supportingFactors++
    // 10+ dips = solid, 15+ = good, 20+ = excellent
    const dipScore = Math.min(100, (maxDips / 20) * 100)
    supportingTotal += dipScore
  }
  
  if (weightedDip !== undefined && weightedDip > 0 && bodyweight) {
    supportingFactors++
    // Weighted dip as % of bodyweight: 25% = solid, 50% = good, 75%+ = excellent
    const dipPercent = (weightedDip / bodyweight) * 100
    const wDipScore = Math.min(100, (dipPercent / 75) * 100)
    supportingTotal += wDipScore
  }
  
  if (lSitHold !== undefined && lSitHold > 0) {
    supportingFactors++
    // L-sit: 10s = developing, 20s = solid, 30s+ = excellent
    const lsitScore = Math.min(100, (lSitHold / 30) * 100)
    supportingTotal += lsitScore
  }
  
  if (pppuReps !== undefined && pppuReps > 0) {
    supportingFactors++
    // PPPU: 5 = developing, 10 = solid, 15+ = excellent
    const pppuScore = Math.min(100, (pppuReps / 15) * 100)
    supportingTotal += pppuScore * 1.2 // Extra weight - PPPU is very relevant
  }
  
  if (supportingFactors > 0) {
    supportingStrengthScore = supportingTotal / supportingFactors
  }
  
  // Calculate total score - weighted average
  // Lean quality and hold time are most important
  const totalScore = Math.round(
    (leanQualityScore * 0.40) + 
    (holdDurationScore * 0.35) + 
    (supportingStrengthScore * 0.25)
  )
  
  // Get classification
  const classification = CLASSIFICATIONS.find(c => totalScore >= c.min && totalScore < c.max) || CLASSIFICATIONS[CLASSIFICATIONS.length - 1]
  
  // Identify limiting factors
  const limitingFactors: string[] = []
  
  if (leanQualityScore < 50) {
    limitingFactors.push('lean distance / shoulder angle tolerance')
  }
  if (holdDurationScore < 50) {
    limitingFactors.push('hold duration / wrist endurance')
  }
  if (leanQualityScore >= 50 && holdDurationScore >= 50 && leanQualityScore < 70) {
    limitingFactors.push('progressive lean depth')
  }
  if (maxPushUps !== undefined && maxPushUps < 25) {
    limitingFactors.push('baseline pushing strength')
  }
  if (maxDips !== undefined && maxDips < 12) {
    limitingFactors.push('dip strength foundation')
  }
  if (pppuReps !== undefined && pppuReps < 8) {
    limitingFactors.push('pseudo planche push-up capacity')
  }
  if (lSitHold !== undefined && lSitHold < 15) {
    limitingFactors.push('core compression strength')
  }
  if (leanDistance >= 4 && holdTime < 20) {
    limitingFactors.push('wrist tolerance under lean stress')
  }
  
  if (limitingFactors.length === 0) {
    limitingFactors.push('continue building overall lean capacity')
  }
  
  // Generate recommendations
  const recommendations: string[] = []
  
  if (leanQualityScore < 40) {
    recommendations.push('Focus on gradually increasing lean distance over time')
  }
  if (holdDurationScore < 40) {
    recommendations.push('Build hold duration at current lean depth before progressing')
  }
  if (leanQualityScore >= 40 && holdDurationScore >= 40 && totalScore < 60) {
    recommendations.push('Add pseudo planche push-ups to build dynamic lean strength')
  }
  if (maxPushUps !== undefined && maxPushUps < 30) {
    recommendations.push('Improve baseline push-up endurance')
  }
  if (maxDips !== undefined && maxDips < 15) {
    recommendations.push('Strengthen dip capacity for scapular depression')
  }
  if (lSitHold !== undefined && lSitHold < 20) {
    recommendations.push('Develop L-sit hold for compression and body tension')
  }
  if (totalScore >= 60 && totalScore < 80) {
    recommendations.push('Begin tuck planche attempts with band assistance')
  }
  if (totalScore >= 80) {
    recommendations.push('Ready for unassisted tuck planche training')
  }
  
  // Always recommend wrist prep
  if (recommendations.length < 3) {
    recommendations.push('Maintain consistent wrist warm-up and conditioning')
  }
  
  // Determine next milestone
  let nextMilestone = ''
  if (totalScore < 20) {
    nextMilestone = '2-4 inch lean with 15+ second holds'
  } else if (totalScore < 40) {
    nextMilestone = '4-6 inch lean with 20+ second holds'
  } else if (totalScore < 60) {
    nextMilestone = '6+ inch lean with 30+ second holds'
  } else if (totalScore < 80) {
    nextMilestone = 'Tuck planche attempts with band support'
  } else {
    nextMilestone = 'Freestanding tuck planche holds'
  }
  
  return {
    score: totalScore,
    classification: classification.label,
    classificationColor: classification.color,
    limitingFactors: limitingFactors.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    nextMilestone,
    breakdown: {
      leanQuality: Math.round(leanQualityScore),
      holdDuration: Math.round(holdDurationScore),
      supportingStrength: Math.round(supportingStrengthScore),
    }
  }
}

export default function PlancheLeanCalculator() {
  // Form state
  const [bodyweight, setBodyweight] = useState('')
  const [leanDistance, setLeanDistance] = useState('')
  const [holdTime, setHoldTime] = useState('')
  const [maxPushUps, setMaxPushUps] = useState('')
  const [maxDips, setMaxDips] = useState('')
  const [weightedDip, setWeightedDip] = useState('')
  const [lSitHold, setLSitHold] = useState('')
  const [pppuReps, setPppuReps] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Result state
  const [result, setResult] = useState<PlancheLeanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const lean = parseFloat(leanDistance) || 0
    const hold = parseFloat(holdTime) || 0
    
    if (lean === 0 || hold === 0) {
      setError('Please enter both lean distance and hold time')
      return
    }
    
    const inputs = {
      leanDistance: lean,
      holdTime: hold,
      bodyweight: parseFloat(bodyweight) || undefined,
      maxPushUps: parseInt(maxPushUps) || undefined,
      maxDips: parseInt(maxDips) || undefined,
      weightedDip: parseFloat(weightedDip) || undefined,
      lSitHold: parseFloat(lSitHold) || undefined,
      pppuReps: parseInt(pppuReps) || undefined,
    }
    
    const calcResult = calculatePlancheLeanScore(inputs)
    setResult(calcResult)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setBodyweight('')
    setLeanDistance('')
    setHoldTime('')
    setMaxPushUps('')
    setMaxDips('')
    setWeightedDip('')
    setLSitHold('')
    setPppuReps('')
    setShowAdvanced(false)
  }

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0C0F]">
      {/* Header */}
      <header className="border-b border-[#2B313A] bg-[#0F1115]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SpartanIcon className="w-8 h-8 text-[#C1121F]" />
            <span className="text-xl font-bold text-[#E6E9EF]">SpartanLab</span>
          </Link>
          <Link href="/onboarding">
            <Button variant="outline" size="sm" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
              Start Training
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#E6E9EF] mb-4">
            Planche Lean Calculator
          </h1>
          <p className="text-[#A4ACB8] text-lg max-w-2xl mx-auto mb-3">
            Measure your planche lean strength and see how close you are to harder planche progressions.
            Enter your lean hold data and supporting stats to get your result.
          </p>
          <p className="text-xs text-[#6B7280] max-w-lg mx-auto">
            Built using structured calisthenics readiness principles for real planche progression.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calculator Card */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-[#C1121F]" />
              <h2 className="text-lg font-semibold text-[#E6E9EF]">Enter Your Stats</h2>
            </div>

            <div className="space-y-5">
              {/* Lean Distance - Required */}
              <div className="space-y-2">
                <Label htmlFor="leanDistance" className="text-[#E6E9EF] flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#C1121F]" />
                  Lean Distance (inches)
                </Label>
                <Input
                  id="leanDistance"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 4"
                  value={leanDistance}
                  onChange={(e) => setLeanDistance(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Distance shoulders travel past wrists (2-4" = beginner, 6-8" = advanced)</p>
              </div>

              {/* Hold Time - Required */}
              <div className="space-y-2">
                <Label htmlFor="holdTime" className="text-[#E6E9EF] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C1121F]" />
                  Max Hold Time (seconds)
                </Label>
                <Input
                  id="holdTime"
                  type="number"
                  placeholder="e.g., 30"
                  value={holdTime}
                  onChange={(e) => setHoldTime(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Longest hold at your working lean distance</p>
              </div>

              {/* Bodyweight - Optional but helps */}
              <div className="space-y-2">
                <Label htmlFor="bodyweight" className="text-[#E6E9EF]">
                  Bodyweight (lbs) <span className="text-[#6B7280]">- optional</span>
                </Label>
                <Input
                  id="bodyweight"
                  type="number"
                  placeholder="e.g., 165"
                  value={bodyweight}
                  onChange={(e) => setBodyweight(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
              </div>

              {/* PPPU Reps - Optional but highly relevant */}
              <div className="space-y-2">
                <Label htmlFor="pppu" className="text-[#E6E9EF]">
                  Pseudo Planche Push-Up Reps <span className="text-[#6B7280]">- optional</span>
                </Label>
                <Input
                  id="pppu"
                  type="number"
                  placeholder="e.g., 8"
                  value={pppuReps}
                  onChange={(e) => setPppuReps(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Reps with meaningful forward lean</p>
              </div>

              {/* Advanced Options Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-[#C1121F] hover:text-[#A50E1A] flex items-center gap-1 mt-2"
              >
                {showAdvanced ? 'Hide' : 'Show'} supporting strength metrics
                <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
              </button>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-[#2B313A]">
                  {/* Max Push-Ups */}
                  <div className="space-y-2">
                    <Label htmlFor="pushups" className="text-[#E6E9EF]">
                      Max Push-Ups <span className="text-[#6B7280]">- optional</span>
                    </Label>
                    <Input
                      id="pushups"
                      type="number"
                      placeholder="e.g., 30"
                      value={maxPushUps}
                      onChange={(e) => setMaxPushUps(e.target.value)}
                      className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                    />
                  </div>
                  
                  {/* Max Dips */}
                  <div className="space-y-2">
                    <Label htmlFor="dips" className="text-[#E6E9EF]">
                      Max Dips <span className="text-[#6B7280]">- optional</span>
                    </Label>
                    <Input
                      id="dips"
                      type="number"
                      placeholder="e.g., 15"
                      value={maxDips}
                      onChange={(e) => setMaxDips(e.target.value)}
                      className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                    />
                  </div>
                  
                  {/* Weighted Dip */}
                  <div className="space-y-2">
                    <Label htmlFor="weightedDip" className="text-[#E6E9EF]">
                      Weighted Dip Load (lbs) <span className="text-[#6B7280]">- optional</span>
                    </Label>
                    <Input
                      id="weightedDip"
                      type="number"
                      placeholder="e.g., 45"
                      value={weightedDip}
                      onChange={(e) => setWeightedDip(e.target.value)}
                      className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                    />
                  </div>
                  
                  {/* L-Sit Hold */}
                  <div className="space-y-2">
                    <Label htmlFor="lsit" className="text-[#E6E9EF]">
                      L-Sit Hold (seconds) <span className="text-[#6B7280]">- optional</span>
                    </Label>
                    <Input
                      id="lsit"
                      type="number"
                      placeholder="e.g., 20"
                      value={lSitHold}
                      onChange={(e) => setLSitHold(e.target.value)}
                      className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleCalculate}
                  className="flex-1 bg-[#C1121F] hover:bg-[#A50E1A] text-white"
                >
                  Calculate Lean Score
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Results Card */}
          <div className="space-y-6">
            {result ? (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6">
                <h3 className="text-lg font-semibold text-[#E6E9EF] mb-4">Your Planche Lean Assessment</h3>
                
                {/* Score Display */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#1A1F26] border-4 border-[#2B313A] mb-3">
                    <span className="text-3xl font-bold text-[#E6E9EF]">{result.score}</span>
                  </div>
                  <div className={cn("text-lg font-semibold", result.classificationColor)}>
                    {result.classification}
                  </div>
                </div>
                
                {/* Score Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#A4ACB8]">Lean Quality</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#1A1F26] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#C1121F] rounded-full transition-all"
                          style={{ width: `${result.breakdown.leanQuality}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#6B7280] w-8">{result.breakdown.leanQuality}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#A4ACB8]">Hold Duration</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#1A1F26] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#C1121F] rounded-full transition-all"
                          style={{ width: `${result.breakdown.holdDuration}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#6B7280] w-8">{result.breakdown.holdDuration}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#A4ACB8]">Supporting Strength</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#1A1F26] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#C1121F] rounded-full transition-all"
                          style={{ width: `${result.breakdown.supportingStrength}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#6B7280] w-8">{result.breakdown.supportingStrength}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Next Milestone */}
                <div className="bg-[#1A1F26] rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-[#C1121F]" />
                    <span className="text-sm font-medium text-[#E6E9EF]">Next Milestone</span>
                  </div>
                  <p className="text-sm text-[#A4ACB8]">{result.nextMilestone}</p>
                </div>
                
                {/* Limiting Factors */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[#E6E9EF] mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Limiting Factors
                  </h4>
                  <ul className="space-y-1">
                    {result.limitingFactors.map((factor, i) => (
                      <li key={i} className="text-sm text-[#A4ACB8] flex items-start gap-2">
                        <span className="text-orange-400 mt-1">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Recommendations */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#E6E9EF] mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-[#A4ACB8] flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* CTA */}
                <Link href="/onboarding">
                  <Button className="w-full bg-[#C1121F] hover:bg-[#A50E1A] text-white">
                    Generate My Planche Program
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-[#6B7280] mt-2">
                  Free to start. No credit card required.
                </p>
              </Card>
            ) : (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-[#1A1F26] flex items-center justify-center mx-auto mb-4">
                    <Ruler className="w-8 h-8 text-[#6B7280]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">Enter Your Lean Stats</h3>
                  <p className="text-sm text-[#6B7280]">
                    Fill in your planche lean distance and hold time to see your assessment
                  </p>
                </div>
              </Card>
            )}

            {/* How to Measure Card */}
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-4">How to Measure Lean Distance</h3>
              <ol className="space-y-3 text-sm text-[#A4ACB8]">
                <li className="flex gap-3">
                  <span className="text-[#C1121F] font-medium">1.</span>
                  <span>Start in a plank position with wrists directly under shoulders</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#C1121F] font-medium">2.</span>
                  <span>Mark your wrist position on the floor</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#C1121F] font-medium">3.</span>
                  <span>Lean forward while keeping arms straight and core tight</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#C1121F] font-medium">4.</span>
                  <span>Measure from wrist mark to where shoulders align vertically</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#C1121F] font-medium">5.</span>
                  <span>Hold at max controllable lean and time your hold</span>
                </li>
              </ol>
            </Card>
          </div>
        </div>

        {/* What Planche Lean Measures Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">What a Planche Lean Measures</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-[#0F1115] border-[#2B313A] p-4">
              <h3 className="text-[#E6E9EF] font-medium mb-2">Shoulder Angle Tolerance</h3>
              <p className="text-sm text-[#A4ACB8]">
                The forward lean shifts load onto shoulders at an extreme angle - the same angle required for planche.
              </p>
            </Card>
            <Card className="bg-[#0F1115] border-[#2B313A] p-4">
              <h3 className="text-[#E6E9EF] font-medium mb-2">Straight-Arm Push Preparation</h3>
              <p className="text-sm text-[#A4ACB8]">
                Develops the specific strength pattern needed for planche - pushing with locked elbows under forward load.
              </p>
            </Card>
            <Card className="bg-[#0F1115] border-[#2B313A] p-4">
              <h3 className="text-[#E6E9EF] font-medium mb-2">Wrist Loading Readiness</h3>
              <p className="text-sm text-[#A4ACB8]">
                Planche puts extreme stress on wrists. Lean work builds tolerance gradually to prevent injury.
              </p>
            </Card>
            <Card className="bg-[#0F1115] border-[#2B313A] p-4">
              <h3 className="text-[#E6E9EF] font-medium mb-2">Body Tension and Control</h3>
              <p className="text-sm text-[#A4ACB8]">
                Maintaining a straight body line while leaning requires full-body tension - core, glutes, and protraction.
              </p>
            </Card>
          </div>
          <p className="text-[#A4ACB8] mt-4 text-sm">
            <strong className="text-[#E6E9EF]">Why this matters:</strong> Planche progression depends on more than basic pushing strength. 
            The lean builds specific adaptations that protect joints and prepare the body for the extreme demands of planche holds.
          </p>
        </section>

        {/* FAQ Section */}
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-[#C1121F]" />
            <h2 className="text-2xl font-bold text-[#E6E9EF]">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-[#0F1115] border-[#2B313A] overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1A1F26]/50 transition-colors"
                >
                  <span className="text-[#E6E9EF] font-medium pr-4">{faq.question}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-[#6B7280] transition-transform flex-shrink-0",
                    openFaqs.includes(index) && "rotate-180"
                  )} />
                </button>
                {openFaqs.includes(index) && (
                  <div className="px-4 pb-4 text-[#A4ACB8] text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Related Tools - Internal Linking */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Related Tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/planche-readiness-calculator" className="block">
              <Card className="bg-[#0F1115] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="text-[#E6E9EF] font-medium text-sm">Planche Readiness Calculator</h3>
                <p className="text-xs text-[#6B7280] mt-1">Full planche readiness assessment</p>
              </Card>
            </Link>
            <Link href="/calisthenics-strength-standards" className="block">
              <Card className="bg-[#0F1115] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="text-[#E6E9EF] font-medium text-sm">Strength Standards</h3>
                <p className="text-xs text-[#6B7280] mt-1">Test your overall strength level</p>
              </Card>
            </Link>
            <Link href="/front-lever-readiness-calculator" className="block">
              <Card className="bg-[#0F1115] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="text-[#E6E9EF] font-medium text-sm">Front Lever Calculator</h3>
                <p className="text-xs text-[#6B7280] mt-1">Check your front lever readiness</p>
              </Card>
            </Link>
            <Link href="/guides/planche-progression" className="block">
              <Card className="bg-[#0F1115] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="text-[#E6E9EF] font-medium text-sm">Planche Progression Guide</h3>
                <p className="text-xs text-[#6B7280] mt-1">Complete planche training roadmap</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="mt-12">
          <ToolConversionCard
            context="planche-lean"
            toolData={result ? {
              plancheLeanHold: leanHoldTime ? parseInt(leanHoldTime) : undefined,
              plancheLeanDistance: leanDistance ? parseFloat(leanDistance) : undefined,
              maxPushUps: pushUps ? parseInt(pushUps) : undefined,
              maxDips: dips ? parseInt(dips) : undefined,
              weightedDip: weightedDip ? parseFloat(weightedDip) : undefined,
              lSitHold: lSitHold ? parseInt(lSitHold) : undefined,
              bodyweight: bodyweight ? parseFloat(bodyweight) : undefined,
              readinessScore: result.score,
              classification: result.classification,
              limitingFactors: result.limitingFactors,
            } : undefined}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2B313A] mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-[#6B7280]">
          <p>© {new Date().getFullYear()} SpartanLab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
