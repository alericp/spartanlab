'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { PageContainer, DashboardSkeleton } from '@/components/layout'
import { ProgramDetail } from '@/components/history'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { classifyHistoryHttp, historyLoadCopy } from '@/lib/workout/history-progress'
import type { ProgramHistory } from '@/types/history'

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchProgram(programId: string): Promise<
  | { status: 'ready'; program: ProgramHistory }
  | { status: 'missing' }
  | { status: 'error' }
> {
  try {
    const response = await fetch(`/api/history/program/${programId}`)
    const kind = classifyHistoryHttp(response.status)
    if (kind === 'missing') return { status: 'missing' }
    if (kind !== 'ready') return { status: 'error' }
    return { status: 'ready', program: await response.json() }
  } catch (error) {
    console.error('[ProgramPage] Error fetching program:', error)
    return { status: 'error' }
  }
}

// =============================================================================
// MAIN PAGE
// =============================================================================

interface ProgramPageProps {
  params: Promise<{ id: string }>
}

function ProgramPageContent({ params }: ProgramPageProps) {
  const { id } = use(params)
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState<ProgramHistory | null>(null)
  const [loadKind, setLoadKind] = useState<'ready' | 'missing' | 'error'>('ready')

  useEffect(() => {
    async function loadData() {
      if (!userId || !id) return
      
      setLoading(true)
      const data = await fetchProgram(id)
      if (data.status === 'ready') {
        setProgram(data.program)
        setLoadKind('ready')
      } else {
        setProgram(null)
        setLoadKind(data.status)
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

  if (!program) {
    return (
      <PageContainer>
        <Card className="bg-[#1A1F26] border-[#2B313A] p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
            {historyLoadCopy(loadKind === 'error' ? 'error' : 'missing', 'program').title}
          </h2>
          <p className="text-sm text-[#A4ACB8] mb-6">
            {historyLoadCopy(loadKind === 'error' ? 'error' : 'missing', 'program').detail}
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
      <ProgramDetail program={program} />
    </PageContainer>
  )
}

export default function ProgramPage({ params }: ProgramPageProps) {
  return (
    <AuthGuard>
      <ProgramPageContent params={params} />
    </AuthGuard>
  )
}
