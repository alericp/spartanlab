'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Target, Dumbbell, Activity, Calendar, TrendingUp, AlertCircle, Share2, Trophy, Zap } from 'lucide-react'
import { StrengthScoreBreakdown, getLevelColor, getLevelGradient } from '@/lib/strength-score-engine'
import { ShareScoreButton } from './ScoreShareCard'

interface SpartanScoreCardProps {
  score: StrengthScoreBreakdown
}

export function SpartanScoreCard({ score }: SpartanScoreCardProps) {
  const levelColor = getLevelColor(score.level)
  const levelGradient = getLevelGradient(score.level)
  
  // Empty state
  if (!score.hasEnoughData) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-6 sm:p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#0F1115] flex items-center justify-center">
            <Target className="w-8 h-8 text-[#6B7280]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Spartan Strength Score</h3>
            <p className="text-sm text-[#A4ACB8] mt-1 max-w-md mx-auto">
              Log workouts and skill progress to calculate your Spartan Strength Score.
            </p>
          </div>
          <Link href="/workout">
            <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
              Log Your First Workout
            </Button>
          </Link>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className={`bg-gradient-to-br ${levelGradient} bg-[#1A1F26] border-[#2B313A] p-6 sm:p-8 overflow-hidden relative`}>
      {/* Accent line */}
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: levelColor }}
      />
      
      <div className="space-y-6">
        {/* Main score display */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-[#A4ACB8] uppercase tracking-wider">Spartan Strength Score</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold tabular-nums" style={{ color: levelColor }}>
                {score.totalScore}
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-[#E6E9EF]">
                  {score.level}
                </div>
                <div className="text-xs text-[#6B7280]">
                  / 1000
                </div>
              </div>
            </div>
          </div>

          {/* Level badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#0F1115] border border-[#2B313A] flex flex-col items-center justify-center flex-shrink-0">
            <div
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: levelColor }}
            >
              {Math.round(score.totalScore / 10)}
            </div>
            <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mt-1">
              Level
            </div>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#6B7280]">
            <span>{score.level}</span>
            <span>{score.levelProgress}% to next level</span>
          </div>
          <div className="h-2 bg-[#0F1115] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${score.levelProgress}%`,
                backgroundColor: levelColor 
              }}
            />
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-[#0F1115]/50 rounded-lg p-4 border border-[#2B313A]/50">
          <p className="text-sm text-[#A4ACB8] leading-relaxed">
            {score.explanation}
          </p>
          
          {/* Focus areas */}
          {score.focusAreas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {score.focusAreas.map((area, i) => (
                <span 
                  key={i}
                  className="text-xs px-2 py-1 rounded bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/20"
                >
                  Focus: {area}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score breakdown - Primary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <ScoreBreakdownItem 
            icon={Target}
            label="Skills"
            score={score.skillScore}
            weight={30}
          />
          <ScoreBreakdownItem 
            icon={Dumbbell}
            label="Strength"
            score={score.strengthScore}
            weight={30}
          />
          <ScoreBreakdownItem 
            icon={Calendar}
            label="Consistency"
            score={score.consistencyScore}
            weight={20}
          />
        </div>
        
        {/* Score breakdown - Secondary metrics */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <ScoreBreakdownItem 
            icon={Zap}
            label="Readiness"
            score={score.readinessScore}
            weight={10}
          />
          <ScoreBreakdownItem 
            icon={Trophy}
            label="Achievements"
            score={score.achievementScore}
            weight={10}
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link href="/performance" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-[#2B313A] hover:bg-[#2B313A] gap-2"
            >
              View Full Analysis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <ShareScoreButton 
            score={score} 
            limiterLabel={score.focusAreas[0]}
          />
        </div>
      </div>
    </Card>
  )
}

// Score breakdown item component
function ScoreBreakdownItem({ 
  icon: Icon, 
  label, 
  score, 
  weight 
}: { 
  icon: React.ElementType
  label: string
  score: number
  weight: number
}) {
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-400'
    if (s >= 40) return 'text-blue-400'
    return 'text-[#A4ACB8]'
  }
  
  return (
    <div className="bg-[#0F1115] rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-[#6B7280]" />
        <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(score)}`}>
          {score}
        </p>
        <p className="text-[10px] text-[#6B7280]">/{weight}%</p>
      </div>
    </div>
  )
}

// Compact version for dashboard
export function SpartanScoreCompact({ score }: SpartanScoreCardProps) {
  const levelColor = getLevelColor(score.level)
  
  if (!score.hasEnoughData) {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
        <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center">
          <Target className="w-5 h-5 text-[#6B7280]" />
        </div>
        <div>
          <p className="text-xs text-[#6B7280]">Spartan Score</p>
          <p className="text-sm text-[#A4ACB8]">Log data to unlock</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-3 p-3 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${levelColor}20` }}
      >
        <span className="text-lg font-bold" style={{ color: levelColor }}>
          {Math.round(score.totalScore / 10)}
        </span>
      </div>
      <div>
        <p className="text-xs text-[#6B7280]">Spartan Score</p>
        <p className="text-sm font-semibold" style={{ color: levelColor }}>
          {score.totalScore} - {score.level}
        </p>
      </div>
    </div>
  )
}
