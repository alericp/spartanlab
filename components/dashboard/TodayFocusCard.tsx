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
  Dumbbell,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react'
import { getCoachDecision, getQuickCoachInsights, type CoachDecision } from '@/lib/training-coach'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import { getWorkoutLogs } from '@/lib/workout-log-service'

const WORKOUT_STORAGE_KEY = 'spartanlab_workout_session'

interface TodayFocusCardProps {
  className?: string
}

export function TodayFocusCard({ className }: TodayFocusCardProps) {
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [coachDecision, setCoachDecision] = useState<CoachDecision | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstWorkout, setIsFirstWorkout] = useState(false)

  useEffect(() => {
    // Check for active workout session
    try {
      const savedSession = localStorage.getItem(WORKOUT_STORAGE_KEY)
      if (savedSession) {
        const session = JSON.parse(savedSession)
        // Check if session is valid and not too old (24 hours)
        const isRecent = session.startTime && (Date.now() - session.startTime) < 24 * 60 * 60 * 1000
        const isInProgress = session.status === 'active' || session.status === 'paused'
        setHasActiveSession(isRecent && isInProgress)
      }
    } catch {
      setHasActiveSession(false)
    }

    // Check if this is the user's first workout
    try {
      const logs = getWorkoutLogs()
      setIsFirstWorkout(logs.length === 0)
    } catch {
      setIsFirstWorkout(false)
    }

    // Get coach decision for today's focus
    try {
      const decision = getCoachDecision()
      setCoachDecision(decision)
    } catch (error) {
      console.error('Failed to get coach decision:', error)
    }
    
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-[#2B313A] rounded" />
          <div className="h-4 w-full bg-[#2B313A] rounded" />
          <div className="h-10 w-36 bg-[#2B313A] rounded" />
        </div>
      </Card>
    )
  }

  // Get today's focus label
  const getTodayFocusLabel = () => {
    // Special messaging for first workout
    if (isFirstWorkout) {
      return 'Your First Workout'
    }
    
    if (!coachDecision) return 'Training Session'
    
    const { sessionRecommendation, primaryLimiter } = coachDecision
    
    if (sessionRecommendation.type === 'recovery_session') {
      return 'Recovery & Mobility'
    }
    
    if (sessionRecommendation.type === 'skill_focus') {
      return 'Skill Practice'
    }
    
    if (primaryLimiter.category === 'compression') {
      return 'Compression & Skill Work'
    }
    
    if (primaryLimiter.category === 'strength') {
      if (primaryLimiter.label.toLowerCase().includes('pull')) {
        return 'Pull Strength Focus'
      }
      if (primaryLimiter.label.toLowerCase().includes('push')) {
        return 'Push Strength Focus'
      }
      return 'Strength Development'
    }
    
    return sessionRecommendation.label || 'Full Training Session'
  }

  // Get explanation text
  const getExplanation = () => {
    // Special messaging for first workout
    if (isFirstWorkout) {
      return 'Complete your first session to unlock personalized insights, progress tracking, and adaptive programming tailored to your performance.'
    }
    
    if (!coachDecision) {
      return 'Start your training session to build towards your goals.'
    }
    
    const { sessionRecommendation, primaryLimiter, coachNotes } = coachDecision
    
    // Use coach notes if available, they're more contextual
    if (coachNotes && coachNotes.length > 0) {
      return coachNotes[0]
    }
    
    // Fallback to session recommendation explanation
    return sessionRecommendation.explanation || primaryLimiter.whyItMatters || 
      'Today\'s program is designed to support your primary goals.'
  }

  return (
    <Card className={`overflow-hidden ${
      isFirstWorkout 
        ? 'bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#0F1115] border-[#C1121F]/30' 
        : 'bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A]'
    } ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isFirstWorkout ? 'bg-[#C1121F]/20' : 'bg-[#C1121F]/10'
          }`}>
            {isFirstWorkout ? (
              <Sparkles className="w-4 h-4 text-[#C1121F]" />
            ) : (
              <Zap className="w-4 h-4 text-[#C1121F]" />
            )}
          </div>
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            {isFirstWorkout ? 'Your Next Step' : 'Today\'s Training Focus'}
          </span>
        </div>

        {/* Focus Title */}
        <h2 className={`font-bold text-[#E6E9EF] mb-2 ${isFirstWorkout ? 'text-2xl' : 'text-xl'}`}>
          {getTodayFocusLabel()}
        </h2>

        {/* Explanation */}
        <p className="text-sm text-[#A4ACB8] mb-6 leading-relaxed">
          {getExplanation()}
        </p>

        {/* Action Button - More prominent for first workout */}
        <div className="flex items-center gap-3">
          {hasActiveSession ? (
            <Link href="/workout/session">
              <Button 
                size="lg" 
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold"
              >
                <RotateCcw className="w-5 h-5" />
                Resume Workout
              </Button>
            </Link>
          ) : (
            <Link href="/workout/session">
              <Button 
                size={isFirstWorkout ? 'lg' : 'lg'} 
                className={`gap-2 font-semibold ${
                  isFirstWorkout 
                    ? 'bg-[#C1121F] hover:bg-[#A30F1A] text-white px-8' 
                    : 'bg-[#C1121F] hover:bg-[#A30F1A] text-white'
                }`}
              >
                <Play className="w-5 h-5" />
                {isFirstWorkout ? 'Start First Workout' : 'Start Workout'}
                {isFirstWorkout && <ArrowRight className="w-4 h-4" />}
              </Button>
            </Link>
          )}
          
          {!isFirstWorkout && (
            <Link href="/my-programs">
              <Button 
                variant="outline" 
                size="lg"
                className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#1A1F26]"
              >
                View Program
              </Button>
            </Link>
          )}
        </div>

        {/* Subtle intensity indicator - only for returning users */}
        {coachDecision && !isFirstWorkout && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2B313A]/50">
            <span className="text-xs text-[#6B7280]">Suggested intensity:</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              coachDecision.sessionRecommendation.intensity === 'high' 
                ? 'bg-[#C1121F]/10 text-[#C1121F]'
                : coachDecision.sessionRecommendation.intensity === 'moderate'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-green-500/10 text-green-500'
            }`}>
              {coachDecision.sessionRecommendation.intensity.charAt(0).toUpperCase() + 
               coachDecision.sessionRecommendation.intensity.slice(1)}
            </span>
          </div>
        )}
        
        {/* First workout benefit hint */}
        {isFirstWorkout && (
          <p className="text-xs text-[#6B7280] mt-4 pt-4 border-t border-[#2B313A]/50">
            After your first workout, you'll see your Spartan Score, training insights, and personalized recommendations.
          </p>
        )}
      </div>
    </Card>
  )
}

// Compact version for sidebar or secondary placement
export function TodayFocusCompact({ className }: TodayFocusCardProps) {
  const [hasActiveSession, setHasActiveSession] = useState(false)

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
            ) : (
              <Play className="w-5 h-5 text-[#C1121F]" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E6E9EF]">
              {hasActiveSession ? 'Resume Workout' : 'Start Workout'}
            </p>
            <p className="text-xs text-[#6B7280]">
              {hasActiveSession ? 'Continue your session' : 'Begin today\'s training'}
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[#6B7280]" />
      </div>
    </Link>
  )
}
