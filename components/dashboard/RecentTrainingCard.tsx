'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, ArrowRight, Calendar } from 'lucide-react'
import { type WorkoutAnalytics, formatWorkoutDate } from '@/lib/workout-analytics'

interface RecentTrainingCardProps {
  analytics: WorkoutAnalytics
}

export function RecentTrainingCard({ analytics }: RecentTrainingCardProps) {
  const hasWorkouts = analytics.totalWorkouts > 0

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-[#E63946]" />
          </div>
          <h3 className="font-semibold">Recent Training</h3>
        </div>
        <Link href="/workouts">
          <Button variant="ghost" size="sm" className="text-[#A5A5A5] hover:text-[#F5F5F5] gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {hasWorkouts ? (
        <div className="space-y-3">
          {/* This week summary */}
          <div className="flex items-center justify-between py-2 px-3 bg-[#1A1A1A] rounded">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#A5A5A5]" />
              <span className="text-sm text-[#A5A5A5]">This week</span>
            </div>
            <span className="font-medium">
              {analytics.workoutsThisWeek} {analytics.workoutsThisWeek === 1 ? 'workout' : 'workouts'}
            </span>
          </div>

          {/* Last workout */}
          {analytics.lastWorkoutDate && (
            <div className="px-3">
              <p className="text-xs text-[#A5A5A5] mb-1">Last session</p>
              <p className="font-medium text-sm">{analytics.lastWorkoutName}</p>
              <p className="text-xs text-[#A5A5A5]">{formatWorkoutDate(analytics.lastWorkoutDate)}</p>
            </div>
          )}

          {/* Top focus */}
          {analytics.mostCommonFocus && (
            <div className="px-3">
              <p className="text-xs text-[#A5A5A5] mb-1">Top focus</p>
              <span className="text-sm px-2 py-0.5 bg-[#E63946]/10 text-[#E63946] rounded">
                {analytics.mostCommonFocusLabel}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-[#A5A5A5] text-sm mb-3">
            No workouts logged yet
          </p>
          <Link href="/workouts">
            <Button size="sm" className="bg-[#E63946] hover:bg-[#D62828]">
              Log First Workout
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
