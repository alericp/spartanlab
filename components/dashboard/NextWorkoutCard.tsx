'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Play, 
  RotateCcw, 
  Zap, 
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  Flame,
  RefreshCw,
} from 'lucide-react'
import { getCoachDecision, type CoachDecision } from '@/lib/training-coach'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import { getWorkoutLogs } from '@/lib/workout-log-service'
import { getLatestProgram, type GeneratedProgram } from '@/lib/program-service'
import { getLatestAdaptiveProgram, type AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { analyzeDifficultyTrends } from '@/lib/adaptive-progression-engine'

const WORKOUT_STORAGE_KEY = 'spartanlab_workout_session'

interface NextWorkoutCardProps {
  className?: string
}

type WorkoutState = 
  | 'first_workout'
  | 'resume_session'
  | 'next_session'
  | 'recovery_day'
  | 'no_program'
  | 'week_complete'

interface WorkoutContext {
  state: WorkoutState
  sessionName: string
  focusAreas: string[]
  estimatedMinutes: number
  intensityLevel: 'low' | 'moderate' | 'high'
  adaptiveNote?: string
  dayNumber?: number
  totalDays?: number
  streakDays?: number
}

export function NextWorkoutCard({ className }: NextWorkoutCardProps) {
  const [workoutContext, setWorkoutContext] = useState<WorkoutContext | null>(null)
  const [coachDecision, setCoachDecision] = useState<CoachDecision | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const analyzeWorkoutState = () => {
      // Check for active workout session
      let hasActiveSession = false
      try {
        const savedSession = localStorage.getItem(WORKOUT_STORAGE_KEY)
        if (savedSession) {
          const session = JSON.parse(savedSession)
          const isRecent = session.startTime && (Date.now() - session.startTime) < 24 * 60 * 60 * 1000
          const isInProgress = session.status === 'active' || session.status === 'paused'
          hasActiveSession = isRecent && isInProgress
        }
      } catch {
        hasActiveSession = false
      }

      // Check workout history
      let workoutLogs: ReturnType<typeof getWorkoutLogs> = []
      let isFirstWorkout = false
      try {
        workoutLogs = getWorkoutLogs()
        isFirstWorkout = workoutLogs.length === 0
      } catch {
        isFirstWorkout = true
      }

      // Get program info
      let program: GeneratedProgram | null = null
      let adaptiveProgram: AdaptiveProgram | null = null
      try {
        program = getLatestProgram()
        adaptiveProgram = getLatestAdaptiveProgram()
      } catch {
        // No program
      }

      // Get coach decision
      let decision: CoachDecision | null = null
      try {
        decision = getCoachDecision()
        setCoachDecision(decision)
      } catch {
        // Coach unavailable
      }

      // Get adaptive insights
      let adaptiveNote: string | undefined
      try {
        const difficultyTrends = analyzeDifficultyTrends()
        if (difficultyTrends.recommendation !== 'maintain') {
          adaptiveNote = difficultyTrends.coachMessage
        }
      } catch {
        // No adaptive data
      }

      // Calculate streak
      let streakDays = 0
      if (workoutLogs.length > 0) {
        const sortedLogs = [...workoutLogs].sort(
          (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
        )
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (const log of sortedLogs) {
          const logDate = new Date(log.sessionDate)
          logDate.setHours(0, 0, 0, 0)
          const daysAgo = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysAgo <= streakDays + 1) {
            streakDays++
          } else {
            break
          }
        }
      }

      // Determine workout state and context
      let state: WorkoutState = 'next_session'
      let sessionName = 'Training Session'
      let focusAreas: string[] = []
      let estimatedMinutes = 45
      let intensityLevel: 'low' | 'moderate' | 'high' = 'moderate'
      let dayNumber: number | undefined
      let totalDays: number | undefined

      // No program case
      if (!program && !adaptiveProgram) {
        state = 'no_program'
        sessionName = 'No Active Program'
        focusAreas = ['Build your first program to get started']
      }
      // First workout case
      else if (isFirstWorkout) {
        state = 'first_workout'
        sessionName = 'Your First Spartan Session'
        focusAreas = getGoalFocusAreas(program?.primaryGoal || 'general')
        estimatedMinutes = program?.sessionLength ? normalizeSessionLength(program.sessionLength) : 45
      }
      // Resume session case
      else if (hasActiveSession) {
        state = 'resume_session'
        sessionName = 'Resume Your Workout'
        focusAreas = decision?.primaryLimiter ? [decision.primaryLimiter.label] : ['Continue where you left off']
      }
      // Recovery day case
      else if (decision?.sessionRecommendation.type === 'recovery_session') {
        state = 'recovery_day'
        sessionName = 'Recovery & Mobility'
        focusAreas = ['Active recovery', 'Mobility work', 'Light stretching']
        estimatedMinutes = 20
        intensityLevel = 'low'
        adaptiveNote = 'Your body needs recovery today. Light movement will help you come back stronger.'
      }
      // Normal next session
      else {
        state = 'next_session'
        
        // Use coach decision for session details
        if (decision) {
          sessionName = decision.sessionRecommendation.label || 'Training Session'
          intensityLevel = decision.sessionRecommendation.intensity
          
          if (decision.primaryLimiter) {
            focusAreas.push(decision.primaryLimiter.label)
          }
          if (decision.primaryLimiter.recommendedFocus) {
            focusAreas.push(decision.primaryLimiter.recommendedFocus)
          }
        }

        // Add program-specific focus
        if (program) {
          const goalFocus = getGoalLabel(program.primaryGoal)
          if (!focusAreas.includes(goalFocus)) {
            focusAreas.unshift(goalFocus)
          }
          estimatedMinutes = normalizeSessionLength(program.sessionLength)
          totalDays = program.trainingDaysPerWeek
          
          // Calculate approximate day number based on workouts this week
          const thisWeekWorkouts = workoutLogs.filter(log => {
            const logDate = new Date(log.sessionDate)
            const startOfWeek = new Date()
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
            return logDate >= startOfWeek
          }).length
          dayNumber = thisWeekWorkouts + 1
        }
      }

      // Check if week is complete
      if (dayNumber && totalDays && dayNumber > totalDays) {
        state = 'week_complete'
        sessionName = 'Week Complete'
        focusAreas = ['All planned sessions done', 'Rest or optional work']
        adaptiveNote = 'Great work this week! Your next training week starts soon.'
      }

      setWorkoutContext({
        state,
        sessionName,
        focusAreas: focusAreas.slice(0, 3),
        estimatedMinutes,
        intensityLevel,
        adaptiveNote,
        dayNumber,
        totalDays,
        streakDays,
      })
      
      setIsLoading(false)
    }

    analyzeWorkoutState()
  }, [])

  if (isLoading) {
    return (
      <Card className={`bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-[#2B313A] rounded" />
          <div className="h-4 w-full bg-[#2B313A] rounded" />
          <div className="h-12 w-36 bg-[#2B313A] rounded" />
        </div>
      </Card>
    )
  }

  if (!workoutContext) return null

  const { state, sessionName, focusAreas, estimatedMinutes, intensityLevel, adaptiveNote, dayNumber, totalDays, streakDays } = workoutContext

  // Render based on state
  return (
    <Card className={`overflow-hidden ${getCardStyle(state)} ${className}`}>
      <div className="p-6">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getIconBgStyle(state)}`}>
              {getStateIcon(state)}
            </div>
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              {getHeaderLabel(state)}
            </span>
          </div>
          
          {/* Day counter or streak */}
          {dayNumber && totalDays && state === 'next_session' && (
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Day {dayNumber} of {totalDays}</span>
            </div>
          )}
          {streakDays && streakDays > 1 && state !== 'recovery_day' && (
            <div className="flex items-center gap-1.5 text-xs text-amber-500">
              <Flame className="w-3.5 h-3.5" />
              <span>{streakDays} day streak</span>
            </div>
          )}
        </div>

        {/* Session Title */}
        <h2 className={`font-bold text-[#E6E9EF] mb-2 ${state === 'first_workout' ? 'text-2xl' : 'text-xl'}`}>
          {sessionName}
        </h2>

        {/* Focus Areas */}
        <div className="flex flex-wrap gap-2 mb-4">
          {focusAreas.map((focus, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1A1F26] border border-[#2B313A] rounded-full text-xs text-[#A4ACB8]"
            >
              {idx === 0 && <Target className="w-3 h-3 text-[#C1121F]" />}
              {focus}
            </span>
          ))}
        </div>

        {/* Session Info */}
        {state !== 'no_program' && (
          <div className="flex items-center gap-4 mb-4 text-sm text-[#6B7280]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{estimatedMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${getIntensityColor(intensityLevel)}`} />
              <span className="capitalize">{intensityLevel} intensity</span>
            </div>
          </div>
        )}

        {/* Adaptive Note */}
        {adaptiveNote && (
          <div className="flex items-start gap-2 p-3 bg-[#1A1F26]/50 border border-[#2B313A]/50 rounded-lg mb-4">
            <RefreshCw className="w-4 h-4 text-[#4F6D8A] mt-0.5 shrink-0" />
            <p className="text-xs text-[#A4ACB8] leading-relaxed">{adaptiveNote}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {renderActionButton(state)}
          {renderSecondaryAction(state)}
        </div>

        {/* First workout benefit hint */}
        {state === 'first_workout' && (
          <p className="text-xs text-[#6B7280] mt-4 pt-4 border-t border-[#2B313A]/50">
            Complete your first workout to unlock your Spartan Score, personalized insights, and adaptive programming.
          </p>
        )}
      </div>
    </Card>
  )
}

// Helper functions
function getCardStyle(state: WorkoutState): string {
  switch (state) {
    case 'first_workout':
      return 'bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#0F1115] border-[#C1121F]/30'
    case 'resume_session':
      return 'bg-gradient-to-br from-amber-600/10 via-[#1A1F26] to-[#0F1115] border-amber-500/30'
    case 'recovery_day':
      return 'bg-gradient-to-br from-emerald-600/10 via-[#1A1F26] to-[#0F1115] border-emerald-500/30'
    case 'week_complete':
      return 'bg-gradient-to-br from-[#4F6D8A]/10 via-[#1A1F26] to-[#0F1115] border-[#4F6D8A]/30'
    case 'no_program':
      return 'bg-[#1A1F26] border-[#2B313A] border-dashed'
    default:
      return 'bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A]'
  }
}

function getIconBgStyle(state: WorkoutState): string {
  switch (state) {
    case 'first_workout':
      return 'bg-[#C1121F]/20'
    case 'resume_session':
      return 'bg-amber-500/20'
    case 'recovery_day':
      return 'bg-emerald-500/20'
    case 'week_complete':
      return 'bg-[#4F6D8A]/20'
    case 'no_program':
      return 'bg-[#2B313A]'
    default:
      return 'bg-[#C1121F]/10'
  }
}

function getStateIcon(state: WorkoutState) {
  switch (state) {
    case 'first_workout':
      return <Sparkles className="w-4 h-4 text-[#C1121F]" />
    case 'resume_session':
      return <RotateCcw className="w-4 h-4 text-amber-500" />
    case 'recovery_day':
      return <RefreshCw className="w-4 h-4 text-emerald-500" />
    case 'week_complete':
      return <CheckCircle2 className="w-4 h-4 text-[#4F6D8A]" />
    case 'no_program':
      return <AlertCircle className="w-4 h-4 text-[#6B7280]" />
    default:
      return <Zap className="w-4 h-4 text-[#C1121F]" />
  }
}

function getHeaderLabel(state: WorkoutState): string {
  switch (state) {
    case 'first_workout':
      return 'Your Next Step'
    case 'resume_session':
      return 'Continue Training'
    case 'recovery_day':
      return 'Active Recovery'
    case 'week_complete':
      return 'Week Complete'
    case 'no_program':
      return 'Get Started'
    default:
      return 'Next Spartan Session'
  }
}

function getIntensityColor(intensity: 'low' | 'moderate' | 'high'): string {
  switch (intensity) {
    case 'high':
      return 'bg-[#C1121F]'
    case 'moderate':
      return 'bg-amber-500'
    default:
      return 'bg-emerald-500'
  }
}

function renderActionButton(state: WorkoutState) {
  switch (state) {
    case 'resume_session':
      return (
        <Link href="/workout/session">
          <Button 
            size="lg" 
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold"
          >
            <RotateCcw className="w-5 h-5" />
            Resume Workout
          </Button>
        </Link>
      )
    case 'recovery_day':
      return (
        <Link href="/workout/session?mode=recovery">
          <Button 
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
          >
            <RefreshCw className="w-5 h-5" />
            Start Recovery
          </Button>
        </Link>
      )
    case 'week_complete':
      return (
        <Link href="/programs">
          <Button 
            size="lg" 
            variant="outline"
            className="border-[#4F6D8A] text-[#4F6D8A] hover:bg-[#4F6D8A]/10 gap-2 font-semibold"
          >
            <Calendar className="w-5 h-5" />
            View Program
          </Button>
        </Link>
      )
    case 'no_program':
      return (
        <Link href="/programs">
          <Button 
            size="lg" 
            className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2 font-semibold"
          >
            <Dumbbell className="w-5 h-5" />
            Build Program
          </Button>
        </Link>
      )
    case 'first_workout':
      return (
        <Link href="/workout/session">
          <Button 
            size="lg" 
            className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2 font-semibold px-8"
          >
            <Play className="w-5 h-5" />
            Start First Workout
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      )
    default:
      return (
        <Link href="/workout/session">
          <Button 
            size="lg" 
            className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2 font-semibold"
          >
            <Play className="w-5 h-5" />
            Start Workout
          </Button>
        </Link>
      )
  }
}

function renderSecondaryAction(state: WorkoutState) {
  if (state === 'first_workout' || state === 'no_program') return null
  
  if (state === 'recovery_day' || state === 'week_complete') {
    return (
      <Link href="/workout/log">
        <Button 
          variant="outline" 
          size="lg"
          className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#1A1F26]"
        >
          Log Activity
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/programs">
      <Button 
        variant="outline" 
        size="lg"
        className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#1A1F26]"
      >
        View Program
      </Button>
    </Link>
  )
}

function getGoalFocusAreas(goal: string): string[] {
  switch (goal) {
    case 'planche':
      return ['Planche progression', 'Push strength', 'Core compression']
    case 'front_lever':
      return ['Front lever progression', 'Pull strength', 'Core control']
    case 'muscle_up':
      return ['Muscle-up technique', 'Explosive pulling', 'Transition strength']
    case 'handstand_pushup':
      return ['HSPU progression', 'Overhead strength', 'Balance work']
    case 'weighted_strength':
      return ['Weighted calisthenics', 'Strength building', 'Progressive overload']
    default:
      return ['Skill development', 'Strength building', 'Movement quality']
  }
}

function getGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    planche: 'Planche Focus',
    front_lever: 'Front Lever Focus',
    muscle_up: 'Muscle-Up Focus',
    handstand_pushup: 'HSPU Focus',
    weighted_strength: 'Weighted Strength',
    general: 'General Training',
    skill: 'Skill Development',
    strength: 'Strength Building',
  }
  return labels[goal] || 'Training Session'
}

function normalizeSessionLength(length: number | string): number {
  if (typeof length === 'number') return length
  // Handle range strings like '30-45'
  const ranges: Record<string, number> = {
    '10-20': 15,
    '20-30': 25,
    '30-45': 40,
    '45-60': 50,
    '60+': 75,
  }
  return ranges[length] || 45
}

// Compact version for sidebar placement
export function NextWorkoutCompact({ className }: NextWorkoutCardProps) {
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [isFirstWorkout, setIsFirstWorkout] = useState(false)

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(WORKOUT_STORAGE_KEY)
      if (savedSession) {
        const session = JSON.parse(savedSession)
        const isRecent = session.startTime && (Date.now() - session.startTime) < 24 * 60 * 60 * 1000
        const isInProgress = session.status === 'active' || session.status === 'paused'
        setHasActiveSession(isRecent && isInProgress)
      }
    } catch {
      setHasActiveSession(false)
    }

    try {
      const logs = getWorkoutLogs()
      setIsFirstWorkout(logs.length === 0)
    } catch {
      setIsFirstWorkout(false)
    }
  }, [])

  return (
    <Link 
      href="/workout/session"
      className={`block bg-[#1A1F26] border border-[#2B313A] rounded-xl p-4 hover:border-[#C1121F]/50 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            hasActiveSession ? 'bg-amber-600/10' : 'bg-[#C1121F]/10'
          }`}>
            {hasActiveSession ? (
              <RotateCcw className="w-5 h-5 text-amber-500" />
            ) : isFirstWorkout ? (
              <Sparkles className="w-5 h-5 text-[#C1121F]" />
            ) : (
              <Play className="w-5 h-5 text-[#C1121F]" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E6E9EF]">
              {hasActiveSession 
                ? 'Resume Workout' 
                : isFirstWorkout 
                ? 'Start First Workout' 
                : 'Start Workout'}
            </p>
            <p className="text-xs text-[#6B7280]">
              {hasActiveSession 
                ? 'Continue your session' 
                : isFirstWorkout
                ? 'Unlock your Spartan Score'
                : 'Begin today\'s training'}
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[#6B7280]" />
      </div>
    </Link>
  )
}
