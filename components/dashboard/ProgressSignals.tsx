'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Activity, Shield, Zap, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWorkoutLogs } from '@/lib/workout-log-service'
import { getStrengthRecords } from '@/lib/strength-service'
import { calculateTrainingStreak } from '@/lib/progress-streak-engine'

// =============================================================================
// PROGRESS SIGNALS COMPONENT
// Lightweight indicators showing user progress without heavy metrics
// =============================================================================

interface ProgressSignal {
  id: string
  icon: typeof TrendingUp
  message: string
  type: 'positive' | 'neutral' | 'action'
  color: string
}

// [PRE-AB6 BUILD GREEN GATE / WORKOUTLOG TIMESTAMP CONTRACT]
// WorkoutLog (lib/workout-log-service.ts:40) exposes `sessionDate: string`
// and `createdAt: string` — there is no `date` field. Resolve a usable
// timestamp from real fields only, falling back from the user-perceived
// session date to the storage createdAt, and skip when neither parses.
type DashboardWorkoutLog = ReturnType<typeof getWorkoutLogs>[number]

function getWorkoutLogTime(log: DashboardWorkoutLog): number | null {
  const rawDate = log.sessionDate ?? log.createdAt
  if (!rawDate) return null

  const time = new Date(rawDate).getTime()
  return Number.isFinite(time) ? time : null
}

function generateProgressSignals(): ProgressSignal[] {
  const signals: ProgressSignal[] = []
  
  try {
    const workoutLogs = getWorkoutLogs()
    const strengthRecords = getStrengthRecords()
    const streak = calculateTrainingStreak()
    
    // Check workout completion trend
    if (workoutLogs.length >= 3) {
      const recentWorkouts = workoutLogs.slice(0, 5)
      const avgCompletion = recentWorkouts.reduce((sum, log) => {
        const completed = log.exercises?.filter(e => e.completed).length || 0
        const total = log.exercises?.length || 1
        return sum + (completed / total)
      }, 0) / recentWorkouts.length
      
      if (avgCompletion >= 0.9) {
        signals.push({
          id: 'completion',
          icon: CheckCircle2,
          message: 'Training consistency improving',
          type: 'positive',
          color: 'text-emerald-400',
        })
      }
    }
    
    // Check strength progress
    // [PRE-AB6 BUILD GREEN GATE / STRENGTHRECORD ARRAY CONTRACT]
    // getStrengthRecords() returns StrengthRecord[] (lib/strength-service.ts:189),
    // not an object map. The authoritative StrengthRecord shape (lib/strength-service.ts:29)
    // owns { exercise, weightAdded, reps, estimatedOneRM, dateLogged, ... } —
    // no `value` field, no object keys. The only pull-related ExerciseType is
    // 'weighted_pull_up' (lib/strength-service.ts:5). Filter as an array, sort
    // newest-first by dateLogged, and compare via estimatedOneRM.
    if (strengthRecords.length > 0) {
      const pullRecords = strengthRecords
        .filter((record) => record.exercise === 'weighted_pull_up')
        .slice()
        .sort(
          (a, b) =>
            new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime()
        )
      if (pullRecords.length >= 2) {
        const recent = pullRecords[0]
        const previous = pullRecords[1]
        if (recent.estimatedOneRM > previous.estimatedOneRM) {
          signals.push({
            id: 'pull_strength',
            icon: TrendingUp,
            message: 'Pull strength increasing',
            type: 'positive',
            color: 'text-blue-400',
          })
        }
      }
    }
    
    // Check streak status
    if (streak.currentStreak >= 3) {
      signals.push({
        id: 'streak',
        icon: Zap,
        message: `${streak.currentStreak}-day training streak`,
        type: 'positive',
        color: 'text-amber-400',
      })
    }
    
    // Recovery signal (based on training frequency)
    if (workoutLogs.length >= 2) {
      const lastTwo = workoutLogs.slice(0, 2)
      const firstTime = getWorkoutLogTime(lastTwo[0])
      const secondTime = getWorkoutLogTime(lastTwo[1])

      if (firstTime !== null && secondTime !== null) {
        const daysBetween = Math.abs((firstTime - secondTime) / (1000 * 60 * 60 * 24))

        if (daysBetween >= 1 && daysBetween <= 3) {
          signals.push({
            id: 'recovery',
            icon: Shield,
            message: 'Recovery balanced',
            type: 'positive',
            color: 'text-purple-400',
          })
        }
      }
    }
    
    // Default signal for new users
    if (signals.length === 0 && workoutLogs.length < 3) {
      signals.push({
        id: 'getting_started',
        icon: Activity,
        message: 'Building your training baseline',
        type: 'neutral',
        color: 'text-[#A4ACB8]',
      })
    }
    
  } catch (error) {
    // Silent fail - return empty signals
  }
  
  // Return max 3 signals
  return signals.slice(0, 3)
}

interface ProgressSignalsProps {
  className?: string
  variant?: 'inline' | 'stacked'
}

export function ProgressSignals({ className, variant = 'inline' }: ProgressSignalsProps) {
  const [signals, setSignals] = useState<ProgressSignal[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSignals(generateProgressSignals())
  }, [])

  if (!mounted || signals.length === 0) {
    return null
  }

  if (variant === 'stacked') {
    return (
      <div className={cn('space-y-2', className)}>
        {signals.map((signal) => (
          <div 
            key={signal.id}
            className="flex items-center gap-2 text-sm"
          >
            <signal.icon className={cn('w-4 h-4', signal.color)} />
            <span className="text-[#A4ACB8]">{signal.message}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {signals.map((signal) => (
        <div 
          key={signal.id}
          className="flex items-center gap-1.5 text-xs bg-[#1A1F26] px-2.5 py-1.5 rounded-full border border-[#2B313A]"
        >
          <signal.icon className={cn('w-3.5 h-3.5', signal.color)} />
          <span className="text-[#A4ACB8]">{signal.message}</span>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// COMPACT PROGRESS INDICATOR
// Single-line progress indicator for headers/footers
// =============================================================================

export function CompactProgressIndicator({ className }: { className?: string }) {
  const [signal, setSignal] = useState<ProgressSignal | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const signals = generateProgressSignals()
    if (signals.length > 0) {
      setSignal(signals[0])
    }
  }, [])

  if (!mounted || !signal) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <signal.icon className={cn('w-3 h-3', signal.color)} />
      <span className="text-[#6B7280]">{signal.message}</span>
    </div>
  )
}
