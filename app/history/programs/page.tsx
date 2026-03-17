'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { PageContainer, SectionHeader, DashboardSkeleton } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgramHistoryCard } from '@/components/history'
import { Calendar, ArrowLeft, Layers } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import type { ProgramHistory } from '@/types/history'

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchProgramHistory(userId: string): Promise<ProgramHistory[]> {
  try {
    const response = await fetch(`/api/history/programs?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch programs')
    }
    const data = await response.json()
    return data.programs || []
  } catch (error) {
    console.error('[ProgramsPage] Error fetching data:', error)
    return []
  }
}

// =============================================================================
// MAIN PAGE
// =============================================================================

function ProgramsPageContent() {
  const { userId, isLoaded } = useAuth()
  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState<ProgramHistory[]>([])

  useEffect(() => {
    async function loadData() {
      if (!userId) return
      
      setLoading(true)
      const data = await fetchProgramHistory(userId)
      setPrograms(data)
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

  // Separate active from archived
  const activeProgram = programs.find(p => p.status === 'active')
  const archivedPrograms = programs.filter(p => p.status !== 'active')

  return (
    <PageContainer>
      <div className="space-y-8">
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
              All Programs
            </h1>
            <p className="text-sm text-[#A4ACB8]">
              {programs.length} program{programs.length !== 1 ? 's' : ''} in your history
            </p>
          </div>
        </div>

        {/* Active Program */}
        {activeProgram && (
          <section>
            <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Current Active Program
            </h3>
            <ProgramHistoryCard program={activeProgram} />
          </section>
        )}

        {/* Archived Programs */}
        {archivedPrograms.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6B7280]" />
              Previous Programs ({archivedPrograms.length})
            </h3>
            <div className="space-y-3">
              {archivedPrograms.map((program) => (
                <ProgramHistoryCard key={program.id} program={program} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {programs.length === 0 && (
          <Card className="bg-[#1A1F26] border-[#2B313A] p-8 text-center">
            <Calendar className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
              No Program History
            </h2>
            <p className="text-sm text-[#A4ACB8] mb-6">
              Generate your first training program to get started.
            </p>
            <Link href="/programs">
              <Button className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
                Create a Program
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}

export default function ProgramsPage() {
  return (
    <AuthGuard>
      <ProgramsPageContent />
    </AuthGuard>
  )
}
