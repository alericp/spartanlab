'use client'

/**
 * CalisthenicsStrengthCalculator - Client Island Component
 * 
 * This is the ONLY client component for the /calisthenics-strength-standards page.
 * It contains all interactive logic (useState, form handling, analytics tracking).
 * 
 * The parent page is a server component that handles:
 * - Static SEO content (hero, FAQs, reference tables)
 * - JSON-LD schemas
 * - Metadata
 * 
 * DO NOT import auth-aware components here:
 * - No useAuth, useUser, or Clerk hooks
 * - No ToolConversionCardClient
 * - No HeaderAuthCTA
 * - No app navigation components
 */

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackToolUsed } from '@/lib/analytics'

// Strength level classifications
type StrengthLevel = 'Beginner' | 'Developing' | 'Intermediate' | 'Advanced' | 'Elite'

interface StrengthResult {
  overallScore: number
  overallLevel: StrengthLevel
  pullScore: number
  pullLevel: StrengthLevel
  pushScore: number
  pushLevel: StrengthLevel
  coreScore: number
  coreLevel: StrengthLevel
  movementBias: 'balanced' | 'pull_dominant' | 'push_dominant' | 'core_weak'
  biasDescription: string
  skillsReady: string[]
  skillsNotReady: string[]
  recommendation: string
}

// Calculate individual category score (0-100)
function calculatePullScore(pullUps: number, weightedPullUp: number): number {
  let pullUpScore = 0
  if (pullUps >= 25) pullUpScore = 50
  else if (pullUps >= 20) pullUpScore = 45
  else if (pullUps >= 15) pullUpScore = 38
  else if (pullUps >= 12) pullUpScore = 30
  else if (pullUps >= 10) pullUpScore = 24
  else if (pullUps >= 8) pullUpScore = 18
  else if (pullUps >= 5) pullUpScore = 12
  else if (pullUps >= 3) pullUpScore = 6
  else pullUpScore = Math.min(pullUps * 2, 5)
  
  let weightedScore = 0
  if (weightedPullUp >= 100) weightedScore = 50
  else if (weightedPullUp >= 70) weightedScore = 42
  else if (weightedPullUp >= 50) weightedScore = 34
  else if (weightedPullUp >= 35) weightedScore = 26
  else if (weightedPullUp >= 25) weightedScore = 20
  else if (weightedPullUp >= 15) weightedScore = 14
  else if (weightedPullUp >= 10) weightedScore = 8
  else weightedScore = Math.floor(weightedPullUp * 0.8)
  
  return pullUpScore + weightedScore
}

function calculatePushScore(pushUps: number, dips: number, weightedDip: number): number {
  let pushUpScore = 0
  if (pushUps >= 50) pushUpScore = 30
  else if (pushUps >= 40) pushUpScore = 26
  else if (pushUps >= 30) pushUpScore = 22
  else if (pushUps >= 25) pushUpScore = 18
  else if (pushUps >= 20) pushUpScore = 14
  else if (pushUps >= 15) pushUpScore = 10
  else if (pushUps >= 10) pushUpScore = 6
  else pushUpScore = Math.floor(pushUps * 0.6)
  
  let dipScore = 0
  if (dips >= 30) dipScore = 35
  else if (dips >= 25) dipScore = 30
  else if (dips >= 20) dipScore = 25
  else if (dips >= 15) dipScore = 20
  else if (dips >= 12) dipScore = 16
  else if (dips >= 10) dipScore = 12
  else if (dips >= 8) dipScore = 8
  else if (dips >= 5) dipScore = 5
  else dipScore = Math.min(dips, 4)
  
  let weightedDipScore = 0
  if (weightedDip >= 110) weightedDipScore = 35
  else if (weightedDip >= 70) weightedDipScore = 28
  else if (weightedDip >= 50) weightedDipScore = 22
  else if (weightedDip >= 35) weightedDipScore = 17
  else if (weightedDip >= 25) weightedDipScore = 12
  else if (weightedDip >= 15) weightedDipScore = 8
  else weightedDipScore = Math.floor(weightedDip * 0.5)
  
  return pushUpScore + dipScore + weightedDipScore
}

function calculateCoreScore(lSitHold: number, hollowHold: number, frontLeverHold: number, plancheLean: number): number {
  let lSitScore = 0
  if (lSitHold >= 60) lSitScore = 40
  else if (lSitHold >= 45) lSitScore = 35
  else if (lSitHold >= 30) lSitScore = 28
  else if (lSitHold >= 20) lSitScore = 22
  else if (lSitHold >= 15) lSitScore = 16
  else if (lSitHold >= 10) lSitScore = 12
  else if (lSitHold >= 5) lSitScore = 6
  else lSitScore = Math.floor(lSitHold)
  
  let hollowScore = 0
  if (hollowHold >= 90) hollowScore = 20
  else if (hollowHold >= 60) hollowScore = 16
  else if (hollowHold >= 45) hollowScore = 12
  else if (hollowHold >= 30) hollowScore = 8
  else if (hollowHold >= 15) hollowScore = 4
  else hollowScore = Math.floor(hollowHold / 4)
  
  let skillBonus = 0
  if (frontLeverHold >= 10) skillBonus += 15
  else if (frontLeverHold >= 5) skillBonus += 10
  else if (frontLeverHold > 0) skillBonus += 5
  
  if (plancheLean >= 60) skillBonus += 25
  else if (plancheLean >= 45) skillBonus += 20
  else if (plancheLean >= 30) skillBonus += 15
  else if (plancheLean >= 20) skillBonus += 10
  else if (plancheLean > 0) skillBonus += 5
  
  return Math.min(100, lSitScore + hollowScore + skillBonus)
}

function getLevel(score: number): StrengthLevel {
  if (score >= 85) return 'Elite'
  if (score >= 65) return 'Advanced'
  if (score >= 40) return 'Intermediate'
  if (score >= 20) return 'Developing'
  return 'Beginner'
}

function calculateStrengthStandards(
  pullUps: number,
  weightedPullUp: number,
  pushUps: number,
  dips: number,
  weightedDip: number,
  lSitHold: number,
  hollowHold: number,
  frontLeverHold: number,
  plancheLean: number
): StrengthResult {
  const pullScore = calculatePullScore(pullUps, weightedPullUp)
  const pushScore = calculatePushScore(pushUps, dips, weightedDip)
  const coreScore = calculateCoreScore(lSitHold, hollowHold, frontLeverHold, plancheLean)
  
  const overallScore = Math.round((pullScore * 0.35 + pushScore * 0.35 + coreScore * 0.30))
  
  const pullLevel = getLevel(pullScore)
  const pushLevel = getLevel(pushScore)
  const coreLevel = getLevel(coreScore)
  const overallLevel = getLevel(overallScore)
  
  let movementBias: 'balanced' | 'pull_dominant' | 'push_dominant' | 'core_weak' = 'balanced'
  let biasDescription = 'Your strength is well-balanced across movement patterns.'
  
  const pullPushDiff = pullScore - pushScore
  const coreDeficit = Math.min(pullScore, pushScore) - coreScore
  
  if (coreDeficit > 25) {
    movementBias = 'core_weak'
    biasDescription = 'Your core strength is significantly behind your limb strength. This will limit skill progression.'
  } else if (pullPushDiff > 20) {
    movementBias = 'pull_dominant'
    biasDescription = 'You are pull-dominant. Consider increasing pushing volume to balance your development.'
  } else if (pullPushDiff < -20) {
    movementBias = 'push_dominant'
    biasDescription = 'You are push-dominant. Consider increasing pulling volume to balance your development.'
  }
  
  const skillsReady: string[] = []
  const skillsNotReady: string[] = []
  
  if (pullUps >= 12 && dips >= 15 && (weightedPullUp >= 25 || pullUps >= 15)) {
    skillsReady.push('Muscle-Up')
  } else {
    skillsNotReady.push('Muscle-Up')
  }
  
  if (pullUps >= 15 && weightedPullUp >= 50 && hollowHold >= 45) {
    skillsReady.push('Front Lever')
  } else {
    skillsNotReady.push('Front Lever')
  }
  
  if (dips >= 20 && weightedDip >= 70 && plancheLean >= 45) {
    skillsReady.push('Planche')
  } else {
    skillsNotReady.push('Planche')
  }
  
  if (pushUps >= 30 && dips >= 15) {
    skillsReady.push('Handstand Push-Up')
  } else {
    skillsNotReady.push('Handstand Push-Up')
  }
  
  if (pullUps >= 20 && weightedPullUp >= 70 && dips >= 25 && weightedDip >= 100) {
    skillsReady.push('Iron Cross (Foundation)')
  } else {
    skillsNotReady.push('Iron Cross')
  }
  
  let recommendation = ''
  if (overallLevel === 'Beginner') {
    recommendation = 'Focus on building foundational strength with consistent training. Prioritize full range of motion and proper form.'
  } else if (overallLevel === 'Developing') {
    recommendation = 'You have a base established. Work on progressive overload and begin incorporating weighted exercises.'
  } else if (overallLevel === 'Intermediate') {
    recommendation = 'Solid foundation in place. You are ready to begin skill-specific training while continuing strength work.'
  } else if (overallLevel === 'Advanced') {
    recommendation = 'Strong overall. Focus on skill mastery and addressing any remaining imbalances.'
  } else {
    recommendation = 'Elite level strength. Focus on advanced skill mastery and maintaining your current level.'
  }
  
  return {
    overallScore,
    overallLevel,
    pullScore,
    pullLevel,
    pushScore,
    pushLevel,
    coreScore,
    coreLevel,
    movementBias,
    biasDescription,
    skillsReady,
    skillsNotReady,
    recommendation,
  }
}

// Level badge component
function LevelBadge({ level }: { level: StrengthLevel }) {
  return (
    <Badge className={cn(
      'text-xs',
      level === 'Elite' && 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      level === 'Advanced' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      level === 'Intermediate' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      level === 'Developing' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      level === 'Beginner' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    )}>
      {level}
    </Badge>
  )
}

// Score bar component
function ScoreBar({ score, label, level }: { score: number; label: string; level: StrengthLevel }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-[#A4ACB8]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#E6E9EF]">{score}/100</span>
          <LevelBadge level={level} />
        </div>
      </div>
      <div className="w-full h-2.5 bg-[#2B313A] rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500 rounded-full",
            level === 'Elite' && 'bg-purple-500',
            level === 'Advanced' && 'bg-emerald-500',
            level === 'Intermediate' && 'bg-blue-500',
            level === 'Developing' && 'bg-yellow-500',
            level === 'Beginner' && 'bg-orange-500',
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// Props for passing data back to parent for CTA
export interface CalculatorData {
  pullUps?: number
  weightedPullUp?: number
  pushUps?: number
  dips?: number
  weightedDip?: number
  lSitHold?: number
  hollowHold?: number
  frontLeverHold?: number
  plancheLean?: number
  overallLevel?: StrengthLevel
}

interface Props {
  onResultChange?: (data: CalculatorData | null) => void
}

export function CalisthenicsStrengthCalculator({ onResultChange }: Props) {
  // Form state
  const [pullUps, setPullUps] = useState('')
  const [weightedPullUp, setWeightedPullUp] = useState('')
  const [pushUps, setPushUps] = useState('')
  const [dips, setDips] = useState('')
  const [weightedDip, setWeightedDip] = useState('')
  const [lSitHold, setLSitHold] = useState('')
  const [hollowHold, setHollowHold] = useState('')
  const [frontLeverHold, setFrontLeverHold] = useState('')
  const [plancheLean, setPlancheLean] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Result state
  const [result, setResult] = useState<StrengthResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    setError(null)
    
    const pullUpsVal = parseInt(pullUps) || 0
    const weightedPullUpVal = parseFloat(weightedPullUp) || 0
    const pushUpsVal = parseInt(pushUps) || 0
    const dipsVal = parseInt(dips) || 0
    const weightedDipVal = parseFloat(weightedDip) || 0
    const lSitHoldVal = parseInt(lSitHold) || 0
    const hollowHoldVal = parseInt(hollowHold) || 0
    const frontLeverHoldVal = parseInt(frontLeverHold) || 0
    const plancheLeanVal = parseInt(plancheLean) || 0
    
    if (pullUpsVal === 0 && dipsVal === 0 && pushUpsVal === 0) {
      setError('Please enter at least your pull-ups, dips, or push-ups')
      return
    }
    
    const calcResult = calculateStrengthStandards(
      pullUpsVal,
      weightedPullUpVal,
      pushUpsVal,
      dipsVal,
      weightedDipVal,
      lSitHoldVal,
      hollowHoldVal,
      frontLeverHoldVal,
      plancheLeanVal
    )
    setResult(calcResult)
    
    // Track tool usage (safe - no auth required)
    trackToolUsed('strength_standards', { overall_level: calcResult.overallLevel })
    
    // Notify parent of result change
    onResultChange?.({
      pullUps: pullUpsVal || undefined,
      weightedPullUp: weightedPullUpVal || undefined,
      pushUps: pushUpsVal || undefined,
      dips: dipsVal || undefined,
      weightedDip: weightedDipVal || undefined,
      lSitHold: lSitHoldVal || undefined,
      hollowHold: hollowHoldVal || undefined,
      frontLeverHold: frontLeverHoldVal || undefined,
      plancheLean: plancheLeanVal || undefined,
      overallLevel: calcResult.overallLevel,
    })
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setPullUps('')
    setWeightedPullUp('')
    setPushUps('')
    setDips('')
    setWeightedDip('')
    setLSitHold('')
    setHollowHold('')
    setFrontLeverHold('')
    setPlancheLean('')
    setShowAdvanced(false)
    onResultChange?.(null)
  }

  return (
    <>
      {/* Calculator Section */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <h2 className="text-lg font-semibold text-[#E6E9EF] mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#C1121F]" />
                Enter Your Stats
              </h2>
              
              <div className="space-y-5">
                {/* Pulling Strength */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#C1121F] uppercase tracking-wide">Pulling Strength</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pullups" className="text-[#A4ACB8] text-sm">Max Pull-Ups</Label>
                      <Input
                        id="pullups"
                        type="number"
                        placeholder="e.g., 12"
                        value={pullUps}
                        onChange={(e) => setPullUps(e.target.value)}
                        className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weightedPullup" className="text-[#A4ACB8] text-sm">Weighted +lbs <span className="text-[#6B7280]">(opt)</span></Label>
                      <Input
                        id="weightedPullup"
                        type="number"
                        placeholder="e.g., 35"
                        value={weightedPullUp}
                        onChange={(e) => setWeightedPullUp(e.target.value)}
                        className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Pushing Strength */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#C1121F] uppercase tracking-wide">Pushing Strength</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pushups" className="text-[#A4ACB8] text-sm">Max Push-Ups</Label>
                      <Input
                        id="pushups"
                        type="number"
                        placeholder="e.g., 30"
                        value={pushUps}
                        onChange={(e) => setPushUps(e.target.value)}
                        className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dips" className="text-[#A4ACB8] text-sm">Max Dips</Label>
                      <Input
                        id="dips"
                        type="number"
                        placeholder="e.g., 15"
                        value={dips}
                        onChange={(e) => setDips(e.target.value)}
                        className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weightedDip" className="text-[#A4ACB8] text-sm">Weighted Dip +lbs <span className="text-[#6B7280]">(optional)</span></Label>
                    <Input
                      id="weightedDip"
                      type="number"
                      placeholder="e.g., 45"
                      value={weightedDip}
                      onChange={(e) => setWeightedDip(e.target.value)}
                      className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                    />
                  </div>
                </div>
                
                {/* Core Strength */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#C1121F] uppercase tracking-wide">Core Strength</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="lsit" className="text-[#A4ACB8] text-sm">L-Sit Hold (sec)</Label>
                      <Input
                        id="lsit"
                        type="number"
                        placeholder="e.g., 15"
                        value={lSitHold}
                        onChange={(e) => setLSitHold(e.target.value)}
                        className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hollow" className="text-[#A4ACB8] text-sm">Hollow Hold (sec)</Label>
                      <Input
                        id="hollow"
                        type="number"
                        placeholder="e.g., 45"
                        value={hollowHold}
                        onChange={(e) => setHollowHold(e.target.value)}
                        className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-[#C1121F] hover:text-[#A50E1A] flex items-center gap-1"
                >
                  {showAdvanced ? 'Hide' : 'Show'} skill-specific metrics
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                </button>
                
                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-3 pt-2 border-t border-[#2B313A]">
                    <p className="text-xs text-[#6B7280]">Optional: improves skill readiness predictions</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="frontLever" className="text-[#A4ACB8] text-sm">Tuck FL Hold (sec)</Label>
                        <Input
                          id="frontLever"
                          type="number"
                          placeholder="e.g., 10"
                          value={frontLeverHold}
                          onChange={(e) => setFrontLeverHold(e.target.value)}
                          className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="plancheLean" className="text-[#A4ACB8] text-sm">Planche Lean (sec)</Label>
                        <Input
                          id="plancheLean"
                          type="number"
                          placeholder="e.g., 30"
                          value={plancheLean}
                          onChange={(e) => setPlancheLean(e.target.value)}
                          className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleCalculate}
                    className="flex-1 bg-[#C1121F] hover:bg-[#A50E1A] text-white"
                  >
                    Calculate My Level
                  </Button>
                  {result && (
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      className="border-[#2B313A] hover:bg-[#2B313A]"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Results Card */}
            <div>
              {result ? (
                <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
                  {/* Overall Score */}
                  <div className="text-center mb-6 pb-6 border-b border-[#2B313A]">
                    <p className="text-sm text-[#6B7280] mb-2">Overall Strength Level</p>
                    <div className={cn(
                      'text-5xl font-bold mb-3',
                      result.overallLevel === 'Elite' && 'text-purple-400',
                      result.overallLevel === 'Advanced' && 'text-emerald-400',
                      result.overallLevel === 'Intermediate' && 'text-blue-400',
                      result.overallLevel === 'Developing' && 'text-yellow-400',
                      result.overallLevel === 'Beginner' && 'text-orange-400',
                    )}>
                      {result.overallScore}
                    </div>
                    <LevelBadge level={result.overallLevel} />
                  </div>
                  
                  {/* Category Breakdown */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-medium text-[#E6E9EF]">Strength Breakdown</h3>
                    <ScoreBar score={result.pullScore} label="Pulling Strength" level={result.pullLevel} />
                    <ScoreBar score={result.pushScore} label="Pushing Strength" level={result.pushLevel} />
                    <ScoreBar score={result.coreScore} label="Core Strength" level={result.coreLevel} />
                  </div>
                  
                  {/* Movement Bias */}
                  <div className="bg-[#0F1115] rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      {result.movementBias === 'balanced' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#E6E9EF] mb-1">
                          {result.movementBias === 'balanced' && 'Balanced Strength'}
                          {result.movementBias === 'pull_dominant' && 'Pull-Dominant'}
                          {result.movementBias === 'push_dominant' && 'Push-Dominant'}
                          {result.movementBias === 'core_weak' && 'Core Deficit Detected'}
                        </p>
                        <p className="text-xs text-[#A4ACB8]">{result.biasDescription}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skill Readiness */}
                  <div className="space-y-3 mb-4">
                    <h3 className="text-sm font-medium text-[#E6E9EF]">Skill Readiness</h3>
                    {result.skillsReady.length > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Ready to pursue:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.skillsReady.map((skill) => (
                            <Badge key={skill} className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.skillsNotReady.length > 0 && (
                      <div className="bg-[#0F1115] border border-[#2B313A] rounded-lg p-3">
                        <p className="text-xs text-[#6B7280] font-medium mb-2">Build more strength first:</p>
                        <div className="flex flex-wrap gap-2">
                          {result.skillsNotReady.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-[#6B7280] border-[#2B313A] text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Recommendation */}
                  <div className="bg-[#0F1115] rounded-lg p-4">
                    <p className="text-sm text-[#A4ACB8]">{result.recommendation}</p>
                  </div>
                </Card>
              ) : (
                <Card className="bg-[#0F1115] border-[#2B313A] p-6 h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                  <TrendingUp className="w-12 h-12 text-[#2B313A] mb-4" />
                  <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                    Enter Your Stats
                  </h3>
                  <p className="text-sm text-[#6B7280] max-w-xs">
                    Fill in your max reps and hold times to calculate your calisthenics strength level.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - only shown after calculation */}
      {result && (
        <section className="py-8 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-[#C1121F]/20 to-[#1C1F26] border border-[#C1121F]/30 rounded-xl p-8 text-center">
              <h2 className="text-xl font-bold mb-3 text-[#E6E9EF]">Build a Program Based on Your Level</h2>
              <p className="text-[#A5A5A5] mb-6 max-w-xl mx-auto">
                SpartanLab creates personalized training programs that target your weak points 
                and prepare you for the skills you want to achieve.
              </p>
              <Link href="/onboarding">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white px-8 py-3 rounded-lg gap-2">
                  Generate My Training Program
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-xs text-[#6B7280] mt-3">Free to start. No credit card required.</p>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
