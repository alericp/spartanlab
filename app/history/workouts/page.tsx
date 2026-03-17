'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { PageContainer, SectionHeader, DashboardSkeleton } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkoutSessionCard } from '@/components/history'
import { ClipboardList, ArrowLeft, Calendar, Filter } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import type { WorkoutSessionHistory } from '@/types/history'

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
              {workouts.length} sessions recorded
            </p>
          </div>
        </div>

        {/* Workouts List */}
        {workouts.length > 0 ? (
          <div className="space-y-3">
            {workouts.map((session) => (
              <WorkoutSessionCard key={session.id} session={session} />
            ))}
          </div>
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
