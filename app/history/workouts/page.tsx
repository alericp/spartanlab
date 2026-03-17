'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { PageContainer, SectionHeader, DashboardSkeleton } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkoutSessionCard } from '@/components/history'
import { ClipboardList, ArrowLeft, Trophy, CheckCircle2 } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { cn } from '@/lib/utils'
import type { WorkoutSessionHistory } from '@/types/history'

type FilterType = 'all' | 'pr_days' | 'completed'

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchWorkoutHistory(userId: string): Promise<WorkoutSessionHistory[]> {
  try {
    const response = await fetch(`/api/history/workouts?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch workouts')
    }
    const data = await response.json()
    return data.workouts || []
  } catch (error) {
    console.error('[WorkoutsPage] Error fetching data:', error)
    return []
  }
}

// =============================================================================
// MAIN PAGE
// =============================================================================

function WorkoutsPageContent() {
  const { userId, isLoaded } = useAuth()
  const [loading, setLoading] = useState(true)
  const [workouts, setWorkouts] = useState<WorkoutSessionHistory[]>([])
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    async function loadData() {
      if (!userId) return
      
      setLoading(true)
      const data = await fetchWorkoutHistory(userId)
      setWorkouts(data)
      setLoading(false)
    }

    if (isLoaded && userId) {
      loadData()
    }
  }, [userId, isLoaded])

  // Filter workouts based on selected filter
  const filteredWorkouts = useMemo(() => {
    switch (filter) {
      case 'pr_days':
        return workouts.filter(w => (w.prsHitSnapshot?.length || 0) > 0)
      case 'completed':
        return workouts.filter(w => w.sessionStatus === 'completed')
      default:
        return workouts
    }
  }, [workouts, filter])

  const filterCounts = useMemo(() => ({
    all: workouts.length,
    pr_days: workouts.filter(w => (w.prsHitSnapshot?.length || 0) > 0).length,
    completed: workouts.filter(w => w.sessionStatus === 'completed').length,
  }), [workouts])

  if (!isLoaded || loading) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/history">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#1A1F26] h-9 w-9"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[#E6E9EF] mb-1">
              All Workout Sessions
            </h1>
            <p className="text-sm text-[#A4ACB8]">
              {filteredWorkouts.length} of {workouts.length} sessions
            </p>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        {workouts.length > 0 && (
          <div className="flex items-center gap-2 p-1 bg-[#1A1F26] rounded-lg border border-[#2B313A] w-fit">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                filter === 'all' 
                  ? "bg-[#0F1115] text-[#E6E9EF] border border-[#2B313A]" 
                  : "text-[#6B7280] hover:text-[#A4ACB8]"
              )}
            >
              All
              <span className="text-xs text-[#6B7280]">({filterCounts.all})</span>
            </button>
            <button
              onClick={() => setFilter('pr_days')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                filter === 'pr_days' 
                  ? "bg-[#0F1115] text-amber-400 border border-[#2B313A]" 
                  : "text-[#6B7280] hover:text-[#A4ACB8]"
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              PR Days
              <span className="text-xs text-[#6B7280]">({filterCounts.pr_days})</span>
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                filter === 'completed' 
                  ? "bg-[#0F1115] text-emerald-400 border border-[#2B313A]" 
                  : "text-[#6B7280] hover:text-[#A4ACB8]"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </button>
          </div>
        )}

        {/* Workouts List */}
        {filteredWorkouts.length > 0 ? (
          <div className="space-y-3">
            {filteredWorkouts.map((session) => (
              <WorkoutSessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : workouts.length > 0 ? (
          <Card className="bg-[#1A1F26] border-[#2B313A] p-8 text-center">
            <p className="text-sm text-[#A4ACB8]">
              No workouts match this filter.
            </p>
          </Card>
        ) : (
          <Card className="bg-[#1A1F26] border-[#2B313A] p-8 text-center">
            <ClipboardList className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
              No Workout History
            </h2>
            <p className="text-sm text-[#A4ACB8] mb-6">
              Complete your first workout to start building your training history.
            </p>
            <Link href="/workout/session">
              <Button className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
                Start a Workout
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}

export default function WorkoutsPage() {
  return (
    <AuthGuard>
      <WorkoutsPageContent />
    </AuthGuard>
  )
}
