'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Target, 
  TrendingUp, 
  ChevronRight,
  Zap,
  Dumbbell,
  ArrowRight,
  Award,
  CheckCircle2
} from 'lucide-react'

// Strength levels
type StrengthLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'master'

interface StrengthResult {
  level: StrengthLevel
  levelLabel: string
  percentile: string
  insight: string
  nextMilestone: number | null
  currentReps: number
  milestoneProgress: number
}

interface InputValues {
  bodyweight: number
  unit: 'lbs' | 'kg'
  maxPullUps: number
  weightedPullUp: number
}

// Milestone definitions
const MILESTONES = [5, 10, 15, 20, 25, 30]

// Calculate strength level from inputs
function calculateStrengthLevel(inputs: InputValues): StrengthResult {
  const { maxPullUps, bodyweight, weightedPullUp, unit } = inputs
  
  // Determine level based on max pull-ups
  let level: StrengthLevel
  let levelLabel: string
  let percentile: string
  let insight: string
  
  if (maxPullUps <= 3) {
    level = 'beginner'
    levelLabel = 'Beginner'
    percentile = 'Building foundation'
    insight = 'Focus on basic pulling strength and assisted pull-up volume. Negative pull-ups and band-assisted reps will build the foundation.'
  } else if (maxPullUps <= 9) {
    level = 'intermediate'
    levelLabel = 'Intermediate'
    percentile = 'Top 50-60% of athletes'
    insight = 'Build pulling endurance and begin weighted pull-up training. Add 1-2 reps weekly to reach advanced levels.'
  } else if (maxPullUps <= 17) {
    level = 'advanced'
    levelLabel = 'Advanced'
    percentile = 'Top 20-30% of athletes'
    insight = 'Weighted pulling and explosive pull-ups can help you reach elite levels. Consider adding muscle-ups to your training.'
  } else if (maxPullUps <= 25) {
    level = 'elite'
    levelLabel = 'Elite'
    percentile = 'Top 5-10% of athletes'
    insight = 'Your pulling strength is exceptional. Focus on weighted variations and advanced skills like front lever rows.'
  } else {
    level = 'master'
    levelLabel = 'Master'
    percentile = 'Top 1-2% of athletes'
    insight = 'You have mastered bodyweight pulling. Challenge yourself with one-arm progressions and heavy weighted variations.'
  }
  
  // Adjust insight based on weighted pull-up data
  if (weightedPullUp > 0 && bodyweight > 0) {
    const bwKg = unit === 'lbs' ? bodyweight * 0.453592 : bodyweight
    const addedKg = unit === 'lbs' ? weightedPullUp * 0.453592 : weightedPullUp
    const ratio = addedKg / bwKg
    
    if (ratio >= 0.5) {
      insight += ' Your weighted strength is elite-level.'
    } else if (ratio >= 0.25 && level === 'beginner') {
      insight = 'Your weighted strength shows good potential. Continue building rep volume alongside weighted work.'
    }
  }
  
  // Calculate next milestone
  let nextMilestone: number | null = null
  for (const milestone of MILESTONES) {
    if (maxPullUps < milestone) {
      nextMilestone = milestone
      break
    }
  }
  
  // Calculate progress toward next milestone
  let milestoneProgress = 0
  if (nextMilestone !== null) {
    const previousMilestone = MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] || 0
    const range = nextMilestone - previousMilestone
    const progress = maxPullUps - previousMilestone
    milestoneProgress = Math.min(100, Math.max(0, (progress / range) * 100))
  } else {
    milestoneProgress = 100
  }
  
  return {
    level,
    levelLabel,
    percentile,
    insight,
    nextMilestone,
    currentReps: maxPullUps,
    milestoneProgress,
  }
}

// Level colors
const LEVEL_COLORS: Record<StrengthLevel, { bg: string; text: string; border: string; glow: string }> = {
  beginner: { 
    bg: 'bg-slate-500/10', 
    text: 'text-slate-400', 
    border: 'border-slate-500/30',
    glow: 'shadow-slate-500/20'
  },
  intermediate: { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-400', 
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20'
  },
  advanced: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-400', 
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20'
  },
  elite: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-400', 
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20'
  },
  master: { 
    bg: 'bg-purple-500/10', 
    text: 'text-purple-400', 
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20'
  },
}

interface PullUpStrengthCalculatorProps {
  showCTA?: boolean
}

export function PullUpStrengthCalculator({ showCTA = true }: PullUpStrengthCalculatorProps) {
  const [inputs, setInputs] = useState<InputValues>({
    bodyweight: 0,
    unit: 'lbs',
    maxPullUps: 0,
    weightedPullUp: 0,
  })
  
  const [showResults, setShowResults] = useState(false)
  
  const result = useMemo(() => {
    if (inputs.maxPullUps > 0 || inputs.bodyweight > 0) {
      return calculateStrengthLevel(inputs)
    }
    return null
  }, [inputs])
  
  const handleInputChange = (field: keyof InputValues, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    if (field === 'maxPullUps' && typeof value === 'number' && value > 0) {
      setShowResults(true)
    }
  }
  
  const handleCalculate = () => {
    if (inputs.maxPullUps > 0) {
      setShowResults(true)
    }
  }
  
  const colors = result ? LEVEL_COLORS[result.level] : LEVEL_COLORS.beginner
  
  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-6">
        {/* Max Pull-Ups - Primary Input */}
        <div>
          <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
            Maximum Pull-Ups (strict form)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={inputs.maxPullUps || ''}
            onChange={(e) => handleInputChange('maxPullUps', Number(e.target.value))}
            placeholder="Enter your max reps"
            className="w-full bg-[#0F1115] border border-[#2B313A] rounded-lg px-4 py-3 text-[#E6E9EF] text-lg placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:border-[#C1121F]"
          />
        </div>
        
        {/* Bodyweight & Weighted Pull-Up Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#A4ACB8] mb-2">
              Body Weight
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
              Weighted Pull-Up Max ({inputs.unit})
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
        
        {/* Calculate Button */}
        {!showResults && (
          <Button 
            onClick={handleCalculate}
            disabled={inputs.maxPullUps <= 0}
            className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white py-3 font-semibold"
          >
            Calculate Strength Level
          </Button>
        )}
      </div>
      
      {/* Results Section */}
      {showResults && result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Strength Rating Card */}
          <Card className={`${colors.bg} ${colors.border} border p-6 shadow-lg ${colors.glow}`}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1115]/50 mb-4">
                <Award className="w-4 h-4 text-[#C1121F]" />
                <span className="text-xs font-medium text-[#A4ACB8]">Pull-Up Strength Rating</span>
              </div>
              
              <div className="mb-2">
                <span className="text-[#A4ACB8] text-sm">Your max:</span>
                <span className="text-3xl font-bold text-[#E6E9EF] ml-2">
                  {result.currentReps} pull-ups
                </span>
              </div>
              
              <div className={`text-4xl font-bold ${colors.text} mb-2`}>
                {result.levelLabel}
              </div>
              
              <div className="text-[#A4ACB8] text-sm">
                Estimated ranking: <span className="text-[#E6E9EF]">{result.percentile}</span>
              </div>
            </div>
            
            {/* Level Indicator */}
            <div className="flex justify-between items-center gap-1 mb-6">
              {(['beginner', 'intermediate', 'advanced', 'elite', 'master'] as StrengthLevel[]).map((lvl) => {
                const isActive = lvl === result.level
                const isPast = ['beginner', 'intermediate', 'advanced', 'elite', 'master'].indexOf(lvl) < 
                               ['beginner', 'intermediate', 'advanced', 'elite', 'master'].indexOf(result.level)
                const lvlColors = LEVEL_COLORS[lvl]
                
                return (
                  <div 
                    key={lvl}
                    className={`flex-1 h-2 rounded-full ${
                      isActive || isPast ? lvlColors.bg.replace('/10', '/40') : 'bg-[#2B313A]'
                    } ${isActive ? 'ring-2 ring-offset-1 ring-offset-[#1A1F26]' : ''}`}
                    style={{ 
                      boxShadow: isActive ? `0 0 10px ${lvlColors.text.replace('text-', '').replace('-400', '')}` : 'none' 
                    }}
                  />
                )
              })}
            </div>
            
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Beginner</span>
              <span>Master</span>
            </div>
          </Card>
          
          {/* Training Insight */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#E6E9EF] mb-1">Training Insight</h3>
                <p className="text-[#A4ACB8] text-sm leading-relaxed">
                  {result.insight}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Milestone Progress */}
          {result.nextMilestone !== null && (
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Next Milestone</h3>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-[#E6E9EF]">
                  {result.nextMilestone} pull-ups
                </span>
                <span className="text-sm text-[#A4ACB8]">
                  {result.nextMilestone - result.currentReps} reps to go
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-4 bg-[#0F1115] rounded-full overflow-hidden mb-2">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#C1121F] to-[#E63946] rounded-full transition-all duration-700"
                  style={{ width: `${result.milestoneProgress}%` }}
                />
                {/* Glow effect */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#C1121F]/50 to-transparent blur-sm rounded-full"
                  style={{ width: `${result.milestoneProgress}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-[#6B7280]">
                <span>{result.currentReps} reps</span>
                <span>{result.nextMilestone} reps</span>
              </div>
              
              {/* Milestone Markers */}
              <div className="flex justify-between mt-4 pt-4 border-t border-[#2B313A]">
                {MILESTONES.slice(0, 5).map((milestone) => {
                  const isCompleted = result.currentReps >= milestone
                  const isCurrent = milestone === result.nextMilestone
                  
                  return (
                    <div key={milestone} className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCompleted 
                          ? 'bg-[#C1121F]/20 text-[#C1121F] border border-[#C1121F]/30' 
                          : isCurrent
                            ? 'bg-[#2B313A] text-[#E6E9EF] border border-[#A4ACB8]/30 ring-2 ring-[#C1121F]/30'
                            : 'bg-[#2B313A] text-[#6B7280]'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : milestone}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
          
          {/* All Milestones Completed */}
          {result.nextMilestone === null && (
            <Card className="bg-gradient-to-br from-purple-500/10 to-[#1A1F26] border-purple-500/30 p-5">
              <div className="text-center">
                <Award className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-[#E6E9EF] mb-2">All Milestones Achieved!</h3>
                <p className="text-[#A4ACB8] text-sm">
                  You've surpassed all standard pull-up milestones. You're in the top tier of calisthenics athletes.
                </p>
              </div>
            </Card>
          )}
          
          {/* CTA Section */}
          {showCTA && (
            <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#C1121F]/30 p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#E6E9EF] mb-3">
                  Want a program designed to increase your pull-up strength?
                </h3>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  SpartanLab builds calisthenics workouts based on your strength level and goals. Get adaptive training that evolves with your progress.
                </p>
                <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] text-white px-8 py-3 font-semibold">
                  <Link href="/signup">
                    Generate Training Plan
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
