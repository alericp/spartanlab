'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight, Clock, Target } from 'lucide-react'
import { getProgramSummary, getDashboardOverview, type ProgramSummary } from '@/lib/dashboard-service'

interface ProgramSnapshotCardProps {
  className?: string
}

export function ProgramSnapshotCard({ className }: ProgramSnapshotCardProps) {
  const [program, setProgram] = useState<ProgramSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const overview = getDashboardOverview()
      const summary = getProgramSummary(overview)
      setProgram(summary)
    } catch (error) {
      console.error('Failed to load program summary:', error)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-[#2B313A] rounded" />
          <div className="h-3 w-48 bg-[#2B313A] rounded" />
        </div>
      </Card>
    )
  }

  if (!program) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#4F6D8A]/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#4F6D8A]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#E6E9EF] mb-1">Training Program</h3>
            <p className="text-xs text-[#6B7280] mb-3">
              No program configured. Create one to get structured training guidance.
            </p>
            <Link href="/programs">
              <Button variant="outline" size="sm" className="border-[#2B313A] text-[#A4ACB8]">
                Build Program
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4F6D8A]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#4F6D8A]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#E6E9EF]">Current Program</h3>
              <p className="text-xs text-[#6B7280]">{program.programName || 'Custom Program'}</p>
            </div>
          </div>
        </div>

        {/* Weekly Structure */}
        {program.weeklyStructure && (
          <div className="py-3 px-4 bg-[#0F1115] rounded-lg">
            <p className="text-xs text-[#6B7280] mb-1">Weekly Structure</p>
            <p className="text-sm font-medium text-[#E6E9EF]">
              {program.weeklyStructure}
            </p>
          </div>
        )}

        {/* Next Session */}
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-[#A4ACB8]" />
          <span className="text-[#6B7280]">Next session:</span>
          <span className="text-[#E6E9EF] font-medium">
            {program.nextSessionFocus || 'Based on readiness'}
          </span>
        </div>

        {/* Action */}
        <Link 
          href="/programs" 
          className="inline-flex items-center gap-1 text-xs text-[#C1121F] hover:underline"
        >
          View Program
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  )
}
