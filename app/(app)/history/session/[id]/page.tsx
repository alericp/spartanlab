'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { PageContainer, DashboardSkeleton } from '@/components/layout'
import { SessionDetail } from '@/components/history'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { classifyHistoryHttp, historyLoadCopy, previousExerciseSnapshots } from '@/lib/workout/history-progress'
import type { ExerciseResultSnapshot, WorkoutSessionHistory } from '@/types/history'

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchSession(sessionId: string): Promise<
  | { status: 'ready'; session: WorkoutSessionHistory }
  | { status: 'missing' }
  | { status: 'error' }
> {
  try {
    const response = await fetch(`/api/history/sessions/${sessionId}`)
    const kind = classifyHistoryHttp(response.status)
    if (kind === 'missing') return { status: 'missing' }
    if (kind !== 'ready') return { status: 'error' }
    const data = await response.json()
    if (!data.session) return { status: 'missing' }
    return { status: 'ready', session: data.session }
  } catch (error) {
    console.error('[SessionPage] Error fetching session:', error)
    return { status: 'error' }
  }
}

async function fetchPreviousExercises(
  userId: string,
  sessionId: string,
): Promise<{ snapshots: ExerciseResultSnapshot[] | null; unavailable: boolean }> {
  try {
    const response = await fetch(`/api/history/workouts?userId=${userId}`)
    if (classifyHistoryHttp(response.status) !== 'ready') {
      return { snapshots: null, unavailable: true }
    }
    const data = await response.json()
    return {
      snapshots: previousExerciseSnapshots(data.workouts || [], sessionId),
      unavailable: false,
    }
  } catch (error) {
    console.error('[SessionPage] Error fetching earlier sessions:', error)
    return { snapshots: null, unavailable: true }
  }
}

// =============================================================================
// MAIN PAGE
// =============================================================================

interface SessionPageProps {
  params: Promise<{ id: string }>
}

function SessionPageContent({ params }: SessionPageProps) {
  const { id } = use(params)
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<WorkoutSessionHistory | null>(null)
  const [loadKind, setLoadKind] = useState<'ready' | 'missing' | 'error'>('ready')
  const [previousExercises, setPreviousExercises] = useState<ExerciseResultSnapshot[] | null>(null)
  const [comparisonUnavailable, setComparisonUnavailable] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!userId || !id) return
      
      setLoading(true)
      const data = await fetchSession(id)
      if (data.status === 'ready') {
        setSession(data.session)
        setLoadKind('ready')
        const earlier = await fetchPreviousExercises(userId, id)
        setPreviousExercises(earlier.snapshots)
        setComparisonUnavailable(earlier.unavailable)
      } else {
        setSession(null)
        setLoadKind(data.status)
        setPreviousExercises(null)
        setComparisonUnavailable(false)
      }
      setLoading(false)
    }

    if (isLoaded && userId) {
      loadData()
    }
  }, [userId, isLoaded, id])

  if (!isLoaded || loading) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    )
  }

  if (!session) {
    const copy = historyLoadCopy(loadKind === 'error' ? 'error' : 'missing', 'session')
    return (
      <PageContainer>
        <Card className="bg-[#1A1F26] border-[#2B313A] p-8 text-center">
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${loadKind === 'error' ? 'text-amber-400' : 'text-[#6B7280]'}`} />
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
            {copy.title}
          </h2>
          <p className="text-sm text-[#A4ACB8] mb-6">
            {copy.detail}
          </p>
          <Link href="/history">
            <Button variant="outline" className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </Link>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SessionDetail
        session={session}
        previousExercises={previousExercises}
        comparisonUnavailable={comparisonUnavailable}
      />
    </PageContainer>
  )
}

export default function SessionPage({ params }: SessionPageProps) {
  return (
    <AuthGuard>
      <SessionPageContent params={params} />
    </AuthGuard>
  )
}
