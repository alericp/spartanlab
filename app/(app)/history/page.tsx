'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { PageContainer, SectionHeader, DashboardSkeleton } from '@/components/layout'
import { HistoryHub } from '@/components/history'
import { History, Archive } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Card } from '@/components/ui/card'
import { classifyHistoryHttp, historyLoadCopy } from '@/lib/workout/history-progress'
import type { 
  WorkoutSessionHistory, 
  ProgramHistory, 
  PersonalRecordHistory 
} from '@/types/history'

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchHistoryData(userId: string): Promise<
  | {
      status: 'ready'
      workoutHistory: WorkoutSessionHistory[]
      programHistory: ProgramHistory[]
      recentPRs: PersonalRecordHistory[]
      totalPRs: number
    }
  | { status: 'error' }
> {
  try {
    const response = await fetch(`/api/history?userId=${userId}`)
    if (classifyHistoryHttp(response.status) !== 'ready') {
      return { status: 'error' }
    }
    const data = await response.json()
    return {
      status: 'ready',
      workoutHistory: data.workoutHistory || [],
      programHistory: data.programHistory || [],
      recentPRs: data.recentPRs || [],
      totalPRs: data.totalPRs || 0,
    }
  } catch (error) {
    console.error('[HistoryPage] Error fetching data:', error)
    return { status: 'error' }
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
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!userId) return
      
      setLoading(true)
      const data = await fetchHistoryData(userId)
      if (data.status === 'error') {
        setLoadError(true)
        setWorkoutHistory([])
        setProgramHistory([])
        setRecentPRs([])
        setTotalPRs(0)
      } else {
        setLoadError(false)
        setWorkoutHistory(data.workoutHistory)
        setProgramHistory(data.programHistory)
        setRecentPRs(data.recentPRs)
        setTotalPRs(data.totalPRs)
      }
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

        {loadError ? (
          <Card className="bg-[#1A1F26] border-[#2B313A] p-8 text-center">
            <History className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
              {historyLoadCopy('error', 'archive').title}
            </h2>
            <p className="text-sm text-[#A4ACB8]">
              {historyLoadCopy('error', 'archive').detail}
            </p>
          </Card>
        ) : (
          <HistoryHub
            workoutHistory={workoutHistory}
            programHistory={programHistory}
            recentPRs={recentPRs}
            totalPRs={totalPRs}
          />
        )}
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
