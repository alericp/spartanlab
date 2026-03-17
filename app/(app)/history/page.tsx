'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { PageContainer, SectionHeader, DashboardSkeleton } from '@/components/layout'
import { HistoryHub } from '@/components/history'
import { History, Archive } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import type { 
  WorkoutSessionHistory, 
  ProgramHistory, 
  PersonalRecordHistory 
} from '@/types/history'

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchHistoryData(userId: string) {
  try {
    const response = await fetch(`/api/history?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch history')
    }
    return await response.json()
  } catch (error) {
    console.error('[HistoryPage] Error fetching data:', error)
    return {
      workoutHistory: [],
      programHistory: [],
      recentPRs: [],
      totalPRs: 0,
    }
  }
}

// =============================================================================
// MAIN PAGE
// =============================================================================

function HistoryPageContent() {
  const { userId, isLoaded } = useAuth()
  const [loading, setLoading] = useState(true)
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSessionHistory[]>([])
  const [programHistory, setProgramHistory] = useState<ProgramHistory[]>([])
  const [recentPRs, setRecentPRs] = useState<PersonalRecordHistory[]>([])
  const [totalPRs, setTotalPRs] = useState(0)

  useEffect(() => {
    async function loadData() {
      if (!userId) return
      
      setLoading(true)
      const data = await fetchHistoryData(userId)
      setWorkoutHistory(data.workoutHistory || [])
      setProgramHistory(data.programHistory || [])
      setRecentPRs(data.recentPRs || [])
      setTotalPRs(data.totalPRs || 0)
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
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-[#1A1F26] border border-[#2B313A]">
            <Archive className="w-6 h-6 text-[#C1121F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E6E9EF] mb-1">
              Training History
            </h1>
            <p className="text-sm text-[#A4ACB8]">
              Your complete training archive — workouts, programs, and personal records.
            </p>
          </div>
        </div>

        {/* History Hub Content */}
        <HistoryHub
          workoutHistory={workoutHistory}
          programHistory={programHistory}
          recentPRs={recentPRs}
          totalPRs={totalPRs}
        />
      </div>
    </PageContainer>
  )
}

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryPageContent />
    </AuthGuard>
  )
}
