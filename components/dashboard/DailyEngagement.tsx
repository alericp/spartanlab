'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Play, 
  TrendingUp, 
  Dumbbell, 
  Target,
  ArrowRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWorkoutLogs } from '@/lib/workout-log-service'
import { getLatestProgram } from '@/lib/program-service'
import { getOnboardingProfile } from '@/lib/athlete-profile'

// =============================================================================
// DAILY ENGAGEMENT HOOK
// Shows personalized message when user returns to dashboard
// =============================================================================

interface DailyContext {
  hasProgram: boolean
  lastWorkoutDate: string | null
  lastWorkoutFocus: string | null
  totalSessions: number
  nextSessionFocus: string
  primaryGoal: string
  daysSinceLastWorkout: number
}

function getDailyContext(): DailyContext {
  const defaultContext: DailyContext = {
    hasProgram: false,
    lastWorkoutDate: null,
    lastWorkoutFocus: null,
    totalSessions: 0,
    nextSessionFocus: 'Training Session',
    primaryGoal: 'your goals',
    daysSinceLastWorkout: 0,
  }
  
  try {
    const profile = getOnboardingProfile()
    const program = getLatestProgram()
    const logs = getWorkoutLogs()
    
    defaultContext.hasProgram = !!program
    defaultContext.totalSessions = logs.length
    
    // Get primary goal display
    if (profile?.primaryGoal) {
      const goalMap: Record<string, string> = {
        front_lever: 'Front Lever',
        planche: 'Planche',
        muscle_up: 'Muscle-Up',
        handstand_pushup: 'HSPU',
        weighted_pull: 'Weighted Pull-Ups',
        weighted_dip: 'Weighted Dips',
        general_strength: 'Strength',
      }
      defaultContext.primaryGoal = goalMap[profile.primaryGoal] || profile.primaryGoal
    }
    
    // Get last workout info
    if (logs.length > 0) {
      const lastLog = logs[0]
      defaultContext.lastWorkoutDate = lastLog.date
      
      // Calculate days since last workout
      const lastDate = new Date(lastLog.date)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - lastDate.getTime())
      defaultContext.daysSinceLastWorkout = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      // Determine last workout focus
      const exercises = lastLog.exercises || []
      const hasPull = exercises.some(e => 
        e.name?.toLowerCase().includes('pull') || 
        e.name?.toLowerCase().includes('row')
      )
      const hasPush = exercises.some(e => 
        e.name?.toLowerCase().includes('push') || 
        e.name?.toLowerCase().includes('dip')
      )
      
      if (hasPull && hasPush) {
        defaultContext.lastWorkoutFocus = 'Full Body'
      } else if (hasPull) {
        defaultContext.lastWorkoutFocus = 'Pull-focused'
      } else if (hasPush) {
        defaultContext.lastWorkoutFocus = 'Push-focused'
      } else {
        defaultContext.lastWorkoutFocus = 'Training session'
      }
    }
    
    // Determine next session focus
    if (program?.sessions && program.sessions.length > 0) {
      const nextIndex = logs.length % program.sessions.length
      const nextSession = program.sessions[nextIndex]
      defaultContext.nextSessionFocus = nextSession?.name || 'Training Session'
    }
    
  } catch {
    // Silent fail - return defaults
  }
  
  return defaultContext
}

// =============================================================================
// RETURN VISIT CARD
// Shows when user returns to dashboard with previous session summary
// =============================================================================

interface ReturnVisitCardProps {
  className?: string
}

export function ReturnVisitCard({ className }: ReturnVisitCardProps) {
  const [context, setContext] = useState<DailyContext | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setContext(getDailyContext())
  }, [])

  if (!mounted || !context || context.totalSessions === 0) {
    return null
  }

  // Generate personalized message
  const getMessage = () => {
    if (context.daysSinceLastWorkout === 0) {
      return 'Great work today! Rest and recover.'
    }
    if (context.daysSinceLastWorkout === 1) {
      return 'Ready for your next session.'
    }
    if (context.daysSinceLastWorkout <= 3) {
      return `${context.daysSinceLastWorkout} days since training. Good time to train.`
    }
    return 'Time to get back on track.'
  }

  return (
    <Card className={cn('bg-[#1A1F26] border-[#2B313A] p-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Previous session summary */}
          {context.lastWorkoutFocus && (
            <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last: {context.lastWorkoutFocus}</span>
              {context.daysSinceLastWorkout > 0 && (
                <>
                  <span className="text-[#2B313A]">|</span>
                  <span>{context.daysSinceLastWorkout}d ago</span>
                </>
              )}
            </div>
          )}
          
          {/* Today's direction */}
          <div className="mb-3">
            <p className="text-sm font-medium text-[#E6E9EF] mb-0.5">
              Today: {context.nextSessionFocus}
            </p>
            <p className="text-xs text-[#A4ACB8]">
              Building toward {context.primaryGoal}
            </p>
          </div>
          
          {/* Status message */}
          <p className="text-xs text-[#6B7280]">
            {getMessage()}
          </p>
        </div>
        
        <Link href="/workout">
          <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A] text-white shrink-0">
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Start
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// =============================================================================
// COMPACT DAILY HOOK
// Single line daily engagement for header area
// =============================================================================

interface CompactDailyHookProps {
  className?: string
}

export function CompactDailyHook({ className }: CompactDailyHookProps) {
  const [context, setContext] = useState<DailyContext | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setContext(getDailyContext())
  }, [])

  if (!mounted || !context || !context.hasProgram) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div className="w-5 h-5 rounded bg-[#C1121F]/10 flex items-center justify-center">
        <Target className="w-3 h-3 text-[#C1121F]" />
      </div>
      <span className="text-[#A4ACB8]">
        Today: <span className="text-[#E6E9EF] font-medium">{context.nextSessionFocus}</span>
      </span>
    </div>
  )
}

// =============================================================================
// SESSION COUNTER
// Shows total sessions completed
// =============================================================================

interface SessionCounterProps {
  className?: string
}

export function SessionCounter({ className }: SessionCounterProps) {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const logs = getWorkoutLogs()
      setCount(logs.length)
    } catch {
      setCount(0)
    }
  }, [])

  if (!mounted) return null

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <Dumbbell className="w-3.5 h-3.5 text-[#6B7280]" />
      <span className="text-[#6B7280]">
        {count} {count === 1 ? 'session' : 'sessions'} logged
      </span>
    </div>
  )
}
