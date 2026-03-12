'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { hasProAccess } from '@/lib/feature-access'
import {
  type SessionPerformanceResult,
  type PerformanceTier,
  getPerformanceTierLabel,
  getPerformanceTierColor,
} from '@/lib/session-performance'
import {
  analyzeFatigue,
  type FatigueIndicators,
  type RecoveryStatus,
} from '@/lib/fatigue-engine'
import {
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Target,
  ArrowRight,
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Clock,
  Activity,
  Crown,
  Brain,
  ChevronRight,
  Lock,
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface PostWorkoutSummaryProps {
  performance: SessionPerformanceResult
  sessionStats: {
    completedSets: number
    totalSets: number
    completedExercises: number
    totalExercises: number
    elapsedSeconds: number
    averageRPE?: number
  }
  sessionName: string
  onReturnToDashboard: () => void
  onViewProgram?: () => void
  bandProgressNote?: string | null
  skillSignal?: string | null
  className?: string
}

interface TrainingSignal {
  type: 'positive' | 'neutral' | 'caution'
  message: string
  icon: typeof TrendingUp
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hrs}h ${remainingMins}m`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getPerformanceIcon(tier: PerformanceTier) {
  switch (tier) {
    case 'excellent':
      return TrendingUp
    case 'strong':
      return TrendingUp
    case 'solid':
      return Minus
    case 'low':
      return TrendingDown
  }
}

function getRecoveryIcon(status: RecoveryStatus) {
  switch (status) {
    case 'recovered':
      return BatteryFull
    case 'recovering':
      return BatteryMedium
    case 'fatigued':
      return BatteryLow
    case 'overtrained':
      return Battery
  }
}

function getRecoveryColor(status: RecoveryStatus) {
  switch (status) {
    case 'recovered':
      return 'text-green-400'
    case 'recovering':
      return 'text-yellow-400'
    case 'fatigued':
      return 'text-orange-400'
    case 'overtrained':
      return 'text-red-400'
  }
}

function getRecoveryRecommendation(fatigue: FatigueIndicators): { message: string; type: 'good' | 'moderate' | 'caution' } {
  const { recoveryStatus, fatigueScore, fatigueTrend } = fatigue
  
  if (recoveryStatus === 'recovered' && fatigueScore.level === 'low') {
    return {
      message: 'Ready for normal training tomorrow.',
      type: 'good',
    }
  }
  
  if (recoveryStatus === 'recovering' || fatigueScore.level === 'moderate') {
    return {
      message: 'Moderate fatigue detected. Listen to your body.',
      type: 'moderate',
    }
  }
  
  if (recoveryStatus === 'fatigued' || fatigueScore.level === 'elevated') {
    return {
      message: 'Keep next session conservative. Recovery is building.',
      type: 'caution',
    }
  }
  
  if (recoveryStatus === 'overtrained' || fatigueScore.level === 'high') {
    return {
      message: 'Consider a rest day or light recovery work.',
      type: 'caution',
    }
  }
  
  // Default based on trend
  if (fatigueTrend.direction === 'worsening') {
    return {
      message: 'Fatigue trending up. Monitor your recovery.',
      type: 'moderate',
    }
  }
  
  return {
    message: 'Recovery on track. Continue as planned.',
    type: 'good',
  }
}

function generateTrainingSignal(
  performance: SessionPerformanceResult,
  stats: PostWorkoutSummaryProps['sessionStats']
): TrainingSignal {
  // Based on performance tier and contributing signals
  const { performanceTier, adjustmentSignal, contributingSignals } = performance
  
  // Check for specific signals in the contributing signals
  const hasQualitySignal = contributingSignals.some(s => 
    s.toLowerCase().includes('quality') || s.toLowerCase().includes('strong')
  )
  const hasEffortSignal = contributingSignals.some(s => 
    s.toLowerCase().includes('effort') || s.toLowerCase().includes('productive')
  )
  const hasCompletionSignal = contributingSignals.some(s => 
    s.toLowerCase().includes('completion') || s.toLowerCase().includes('full session')
  )
  
  // Generate contextual signal
  if (performanceTier === 'excellent') {
    if (hasQualitySignal) {
      return { type: 'positive', message: 'Training quality was exceptional today.', icon: TrendingUp }
    }
    return { type: 'positive', message: 'Strong session execution across the board.', icon: TrendingUp }
  }
  
  if (performanceTier === 'strong') {
    if (hasEffortSignal) {
      return { type: 'positive', message: 'Effort matched your readiness well.', icon: TrendingUp }
    }
    if (stats.averageRPE && stats.averageRPE >= 7.5) {
      return { type: 'positive', message: 'Solid work at productive intensity.', icon: Activity }
    }
    return { type: 'positive', message: 'Good training stimulus delivered.', icon: TrendingUp }
  }
  
  if (performanceTier === 'solid') {
    if (adjustmentSignal === 'stay_conservative') {
      return { type: 'neutral', message: 'Smart conservative approach today.', icon: Minus }
    }
    return { type: 'neutral', message: 'Maintenance session completed.', icon: Minus }
  }
  
  // Low performance
  if (hasCompletionSignal && stats.completedSets < stats.totalSets * 0.7) {
    return { type: 'caution', message: 'Session cut short. Recovery may be needed.', icon: TrendingDown }
  }
  
  return { type: 'caution', message: 'Listen to your body for next session.', icon: TrendingDown }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PostWorkoutSummary({
  performance,
  sessionStats,
  sessionName,
  onReturnToDashboard,
  onViewProgram,
  bandProgressNote,
  skillSignal,
  className,
}: PostWorkoutSummaryProps) {
  // Get fatigue indicators
  const fatigueIndicators = useMemo(() => {
    try {
      return analyzeFatigue()
    } catch {
      return null
    }
  }, [])
  
  // Generate training signal
  const trainingSignal = useMemo(
    () => generateTrainingSignal(performance, sessionStats),
    [performance, sessionStats]
  )
  
  // Get recovery recommendation
  const recoveryRec = useMemo(() => {
    if (fatigueIndicators) {
      return getRecoveryRecommendation(fatigueIndicators)
    }
    return { message: 'Recovery on track. Continue as planned.', type: 'good' as const }
  }, [fatigueIndicators])
  
  const tierLabel = getPerformanceTierLabel(performance.performanceTier)
  const tierColor = getPerformanceTierColor(performance.performanceTier)
  const PerformanceIcon = getPerformanceIcon(performance.performanceTier)
  const RecoveryIcon = fatigueIndicators ? getRecoveryIcon(fatigueIndicators.recoveryStatus) : BatteryMedium
  const recoveryColor = fatigueIndicators ? getRecoveryColor(fatigueIndicators.recoveryStatus) : 'text-[#A4ACB8]'
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Session Complete Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <Badge className="bg-green-500/10 text-green-400 border-0 mb-2">
          Session Complete
        </Badge>
        <h2 className="text-xl font-bold text-[#E6E9EF]">{sessionName}</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          {formatDuration(sessionStats.elapsedSeconds)} • {sessionStats.completedSets} sets
        </p>
      </div>
      
      {/* Performance Score Card */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
        <div className="flex items-center gap-4">
          {/* Score Circle */}
          <div className="relative">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center border-2',
              performance.performanceTier === 'excellent' && 'border-green-500 bg-green-500/10',
              performance.performanceTier === 'strong' && 'border-blue-500 bg-blue-500/10',
              performance.performanceTier === 'solid' && 'border-yellow-500 bg-yellow-500/10',
              performance.performanceTier === 'low' && 'border-orange-500 bg-orange-500/10',
            )}>
              <span className={cn('text-xl font-bold', tierColor)}>
                {performance.performanceScore}
              </span>
            </div>
          </div>
          
          {/* Performance Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PerformanceIcon className={cn('w-4 h-4', tierColor)} />
              <span className={cn('font-semibold', tierColor)}>{tierLabel}</span>
            </div>
            <p className="text-sm text-[#A4ACB8] line-clamp-2">{performance.summary}</p>
          </div>
        </div>
      </Card>
      
      {/* Training Signal Card */}
      <Card className={cn(
        'border p-4',
        trainingSignal.type === 'positive' && 'bg-green-500/5 border-green-500/20',
        trainingSignal.type === 'neutral' && 'bg-[#1A1F26] border-[#2B313A]',
        trainingSignal.type === 'caution' && 'bg-orange-500/5 border-orange-500/20',
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
            trainingSignal.type === 'positive' && 'bg-green-500/10',
            trainingSignal.type === 'neutral' && 'bg-[#2B313A]',
            trainingSignal.type === 'caution' && 'bg-orange-500/10',
          )}>
            <trainingSignal.icon className={cn(
              'w-4 h-4',
              trainingSignal.type === 'positive' && 'text-green-400',
              trainingSignal.type === 'neutral' && 'text-[#A4ACB8]',
              trainingSignal.type === 'caution' && 'text-orange-400',
            )} />
          </div>
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">Training Signal</p>
            <p className="text-sm text-[#E6E9EF] font-medium">{trainingSignal.message}</p>
          </div>
        </div>
      </Card>
      
      {/* Recovery & Fatigue Card */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
        <div className="flex items-start gap-3">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#2B313A]')}>
            <RecoveryIcon className={cn('w-4 h-4', recoveryColor)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Recovery Status</p>
              {fatigueIndicators && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-[10px] border',
                    recoveryColor,
                    fatigueIndicators.recoveryStatus === 'recovered' && 'border-green-500/30',
                    fatigueIndicators.recoveryStatus === 'recovering' && 'border-yellow-500/30',
                    fatigueIndicators.recoveryStatus === 'fatigued' && 'border-orange-500/30',
                    fatigueIndicators.recoveryStatus === 'overtrained' && 'border-red-500/30',
                  )}
                >
                  {fatigueIndicators.fatigueScore.level} fatigue
                </Badge>
              )}
            </div>
            <p className={cn(
              'text-sm font-medium',
              recoveryRec.type === 'good' && 'text-green-400',
              recoveryRec.type === 'moderate' && 'text-yellow-400',
              recoveryRec.type === 'caution' && 'text-orange-400',
            )}>
              {recoveryRec.message}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Skill Signal (if present) */}
      {skillSignal && (
        <Card className="bg-purple-500/5 border-purple-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">Skill Progress</p>
              <p className="text-sm text-purple-300 font-medium">{skillSignal}</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Band Progress Note (if present) */}
      {bandProgressNote && (
        <Card className="bg-blue-500/5 border-blue-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">Band Progression</p>
              <p className="text-sm text-blue-300 font-medium">{bandProgressNote}</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Quick Stats */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-[#6B7280]" />
            </div>
            <p className="text-lg font-bold text-[#E6E9EF]">{sessionStats.completedSets}</p>
            <p className="text-[10px] text-[#6B7280] uppercase">Sets</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
            </div>
            <p className="text-lg font-bold text-[#E6E9EF]">{formatDuration(sessionStats.elapsedSeconds)}</p>
            <p className="text-[10px] text-[#6B7280] uppercase">Duration</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-3.5 h-3.5 text-[#6B7280]" />
            </div>
            <p className="text-lg font-bold text-[#C1121F]">
              {sessionStats.averageRPE?.toFixed(1) || '-'}
            </p>
            <p className="text-[10px] text-[#6B7280] uppercase">Avg RPE</p>
          </div>
        </div>
      </Card>
      
      {/* Pro Insights Preview - Only show for free users */}
      {!hasProAccess() && (
        <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-amber-500/20 p-4 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Pro Insight</p>
                <p className="text-sm font-medium text-[#E6E9EF]">Deeper Performance Analysis</p>
              </div>
            </div>
            
            {/* Locked preview items */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0F1115]/50 border border-[#2B313A]/50">
                <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">What limited your performance today</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0F1115]/50 border border-[#2B313A]/50">
                <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">Optimal training adjustment for tomorrow</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0F1115]/50 border border-[#2B313A]/50">
                <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">Skill progression timeline update</span>
              </div>
            </div>
            
            <Link href="/upgrade">
              <Button 
                size="sm"
                className="w-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-400 border border-amber-500/30 text-xs"
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Unlock Training Intelligence
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      )}
      
      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={onReturnToDashboard}
          className="w-full h-12 bg-[#C1121F] hover:bg-[#A30F1A] text-white font-semibold"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
        
        {onViewProgram && (
          <Button
            variant="outline"
            onClick={onViewProgram}
            className="w-full h-12 border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#1A1F26]"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View Program
          </Button>
        )}
      </div>
    </div>
  )
}
