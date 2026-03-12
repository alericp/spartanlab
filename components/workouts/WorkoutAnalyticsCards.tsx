'use client'

import { Card } from '@/components/ui/card'
import { Calendar, Dumbbell, Target, Clock } from 'lucide-react'
import { type WorkoutAnalytics, formatWorkoutDate } from '@/lib/workout-analytics'

interface WorkoutAnalyticsCardsProps {
  analytics: WorkoutAnalytics
}

export function WorkoutAnalyticsCards({ analytics }: WorkoutAnalyticsCardsProps) {
  const cards = [
    {
      label: 'This Week',
      value: analytics.workoutsThisWeek,
      unit: analytics.workoutsThisWeek === 1 ? 'workout' : 'workouts',
      icon: Calendar,
    },
    {
      label: 'Exercises Logged',
      value: analytics.exercisesThisWeek,
      unit: 'this week',
      icon: Dumbbell,
    },
    {
      label: 'Top Focus',
      value: analytics.mostCommonFocusLabel,
      unit: null,
      icon: Target,
    },
    {
      label: 'Last Workout',
      value: analytics.lastWorkoutDate ? formatWorkoutDate(analytics.lastWorkoutDate) : 'None',
      unit: analytics.lastWorkoutName || null,
      icon: Clock,
    },
  ]

  if (analytics.totalWorkouts === 0) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <p className="text-[#A5A5A5] text-sm text-center">
          Log your first workout to see analytics
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="bg-[#2A2A2A] border-[#3A3A3A] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className="w-4 h-4 text-[#E63946]" />
            <span className="text-xs text-[#A5A5A5]">{card.label}</span>
          </div>
          <div className="text-xl font-bold">{card.value}</div>
          {card.unit && (
            <div className="text-xs text-[#A5A5A5] mt-0.5 truncate">{card.unit}</div>
          )}
        </Card>
      ))}
    </div>
  )
}

// Compact version for dashboard
interface WorkoutAnalyticsCompactProps {
  analytics: WorkoutAnalytics
}

export function WorkoutAnalyticsCompact({ analytics }: WorkoutAnalyticsCompactProps) {
  if (analytics.totalWorkouts === 0) {
    return (
      <div className="text-sm text-[#A5A5A5]">
        No workouts logged yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#A5A5A5]">This week</span>
        <span className="font-medium">{analytics.workoutsThisWeek} workouts</span>
      </div>
      {analytics.lastWorkoutDate && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#A5A5A5]">Last session</span>
          <span className="text-sm">{analytics.lastWorkoutName || 'Unknown'}</span>
        </div>
      )}
      {analytics.mostCommonFocus && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#A5A5A5]">Top focus</span>
          <span className="text-sm text-[#E63946]">{analytics.mostCommonFocusLabel}</span>
        </div>
      )}
    </div>
  )
}
