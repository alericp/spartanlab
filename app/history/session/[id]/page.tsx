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
import type { WorkoutSessionHistory } from '@/types/history'

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchSession(sessionId: string): Promise<WorkoutSessionHistory | null> {
  try {
    const response = await fetch(`/api/history/session/${sessionId}`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('[SessionPage] Error fetching session:', error)
    return null
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

  useEffect(() => {
    async function loadData() {
      if (!userId || !id) return
      
      setLoading(true)
      const data = await fetchSession(id)
      setSession(data)
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
    return (
      <PageContainer>
        <Card className="bg-[#1A1F26] border-[#2B313A] p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
            Session Not Found
          </h2>
          <p className="text-sm text-[#A4ACB8] mb-6">
            This workout session could not be found or may have been removed.
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
      <SessionDetail session={session} />
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
