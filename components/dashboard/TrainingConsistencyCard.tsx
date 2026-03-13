'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flame, Calendar, CheckCircle2, TrendingUp, Activity, RefreshCw } from 'lucide-react'
import {
  calculateTrainingStreak,
  calculateWeeklyProgress,
  getStreakColor,
  type TrainingStreak,
  type WeeklyProgress,
} from '@/lib/progress-streak-engine'
import {
  getConsistencyStatus,
  type ConsistencyStatus,
  type ConsistencyState,
} from '@/lib/consistency-momentum-engine'

// =============================================================================
// TRAINING CONSISTENCY CARD
// Lightweight card combining streak and weekly progress
// =============================================================================

export function TrainingConsistencyCard() {
  const [streak, setStreak] = useState<TrainingStreak | null>(null)
  const [weekly, setWeekly] = useState<WeeklyProgress | null>(null)
  const [consistency, setConsistency] = useState<ConsistencyStatus | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setStreak(calculateTrainingStreak())
    setWeekly(calculateWeeklyProgress())
    try {
      setConsistency(getConsistencyStatus())
    } catch {
      // Silent fail - consistency engine is optional
    }
  }, [])

  if (!mounted || !streak || !weekly) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4 animate-pulse">
        <div className="h-24 bg-[#0F1115] rounded" />
      </Card>
    )
  }

  const streakColor = getStreakColor(streak.currentStreak)
  const weekComplete = weekly.completedSessions >= weekly.targetSessions

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-4 sm:p-5">
      <div className="space-y-4">
        {/* Header Row: Streak + Weekly Progress Side by Side on Desktop */}
        <div className="grid grid-cols-2 gap-4">
          {/* Training Streak */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${streakColor}15` }}
              >
                <Flame className="w-4 h-4" style={{ color: streakColor }} />
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Streak</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold" style={{ color: streakColor }}>
                    {streak.currentStreak}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    {streak.currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Streak status */}
            {streak.hasData && (
              <div className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${
                streak.streakActive 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                {streak.streakActive ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    Active
                  </>
                ) : (
                  <>
                    <Calendar className="w-3 h-3" />
                    Train today
                  </>
                )}
              </div>
            )}
          </div>

          {/* Weekly Progress */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                weekComplete ? 'bg-green-500/10' : 'bg-[#4F6D8A]/10'
              }`}>
                {weekComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Calendar className="w-4 h-4 text-[#4F6D8A]" />
                )}
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">This Week</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${weekComplete ? 'text-green-500' : 'text-[#E6E9EF]'}`}>
                    {weekly.completedSessions}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    / {weekly.targetSessions}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-2 rounded-full bg-[#0F1115] overflow-hidden border border-[#2B313A]/30">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  weekComplete 
                    ? 'bg-gradient-to-r from-green-600 to-green-500' 
                    : 'bg-gradient-to-r from-[#C1121F]/80 to-[#C1121F]'
                }`}
                style={{ width: `${weekly.progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Comeback Notice */}
        {consistency?.comebackConfig.isComeback && (
          <div className="p-3 bg-[#C1121F]/10 border border-[#C1121F]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-[#C1121F]" />
              <span className="text-sm font-medium text-[#C1121F]">Comeback Session</span>
            </div>
            <p className="text-xs text-[#A4ACB8]">
              {consistency.comebackConfig.message}
            </p>
          </div>
        )}

        {/* Motivational Message */}
        <div className="pt-3 border-t border-[#2B313A]/50">
          <p className="text-sm text-[#A4ACB8]">
            {consistency?.coachMessage || weekly.message}
          </p>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

export function TrainingConsistencyCompact() {
  const [streak, setStreak] = useState<TrainingStreak | null>(null)
  const [weekly, setWeekly] = useState<WeeklyProgress | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setStreak(calculateTrainingStreak())
    setWeekly(calculateWeeklyProgress())
  }, [])

  if (!mounted || !streak || !weekly) {
    return null
  }

  const streakColor = getStreakColor(streak.currentStreak)
  const weekComplete = weekly.completedSessions >= weekly.targetSessions

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1115] border border-[#2B313A]">
      {/* Streak */}
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4" style={{ color: streakColor }} />
        <span className="text-sm font-semibold" style={{ color: streakColor }}>
          {streak.currentStreak}
        </span>
        <span className="text-xs text-[#6B7280]">day streak</span>
      </div>
      
      {/* Divider */}
      <div className="w-px h-4 bg-[#2B313A]" />
      
      {/* Weekly */}
      <div className="flex items-center gap-2">
        {weekComplete ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <Calendar className="w-4 h-4 text-[#4F6D8A]" />
        )}
        <span className={`text-sm font-semibold ${weekComplete ? 'text-green-500' : 'text-[#E6E9EF]'}`}>
          {weekly.completedSessions}/{weekly.targetSessions}
        </span>
        <span className="text-xs text-[#6B7280]">this week</span>
      </div>
    </div>
  )
}
