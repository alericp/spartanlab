'use client'

import { useState, useEffect, useCallback } from 'react'
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

  // TASK F FIX: Memoized loader function for fresh reads
  const loadProgramSummary = useCallback(() => {
    try {
      // TASK 7: Log fresh read from source
      console.log('[ProgramSnapshotCard] TASK 4: Loading program from SINGLE source (getProgramState)')
      const overview = getDashboardOverview()
      const summary = getProgramSummary(overview)
      
      // TASK 7: Log what was loaded
      console.log('[ProgramSnapshotCard] TASK 4: Loaded program summary:', {
        hasData: summary.hasData,
        goalLabel: summary.goalLabel,
        programName: summary.programName,
        weeklyStructure: summary.weeklyStructure,
      })
      
      setProgram(summary)
    } catch (error) {
      console.error('Failed to load program summary:', error)
    }
    setIsLoading(false)
  }, [])

  // TASK F FIX: Load on mount
  useEffect(() => {
    loadProgramSummary()
  }, [loadProgramSummary])
  
  // TASK F FIX: Re-load when window regains focus (handles returning from program page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[ProgramSnapshotCard] TASK F: Window focus - refreshing program data')
      loadProgramSummary()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadProgramSummary])
  
  // TASK F FIX: Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      // Refresh if adaptive programs storage changed
      if (e.key === 'spartanlab_adaptive_programs' || e.key === 'spartanlab_first_program') {
        console.log('[ProgramSnapshotCard] TASK F: Storage changed - refreshing program data')
        loadProgramSummary()
      }
    }
    
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [loadProgramSummary])

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

  // TASK B FIX: Check hasData flag (not just null) since getProgramSummary always returns object
  if (!program || !program.hasData) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] border-dashed p-5 ${className}`}>
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-[#C1121F]" />
          </div>
          <h3 className="text-sm font-medium text-[#E6E9EF] mb-1">No Program Yet</h3>
          <p className="text-xs text-[#6B7280] mb-4">
            Create a program to get structured training
          </p>
          {/* Route to /onboarding/complete for program generation (consistent with FirstRunGuide) */}
          <Link href="/onboarding/complete">
            <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2">
              <Calendar className="w-4 h-4" />
              Create Program
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 ${className}`}>
      <div className="space-y-4">
        {/* Header with Primary/Secondary Goal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4F6D8A]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#4F6D8A]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#E6E9EF]">Current Program</h3>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-[#6B7280]">{program.goalLabel}</p>
                {program.secondaryGoal && (
                  <>
                    <span className="text-xs text-[#4A4A4A]">+</span>
                    <p className="text-xs text-[#6B7280]">
                      {program.secondaryGoal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Duration Identity - Show adaptive vs fixed truthfully */}
        <div className="flex flex-wrap gap-2">
          {/* Schedule Mode Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0F1115] rounded text-xs">
            <Calendar className="w-3 h-3 text-[#6B7280]" />
            <span className="text-[#A4ACB8]">
              {program.scheduleMode === 'flexible' 
                ? 'Adaptive Schedule' 
                : `${program.daysPerWeek} days/week`}
            </span>
          </div>
          {/* Duration Mode Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0F1115] rounded text-xs">
            <Clock className="w-3 h-3 text-[#6B7280]" />
            <span className="text-[#A4ACB8]">
              {program.sessionDurationMode === 'adaptive'
                ? 'Adaptive Duration'
                : `~${program.sessionLength} min`}
            </span>
          </div>
        </div>

        {/* Built Around - Shows selected skill mix concisely */}
        {program.selectedSkills && program.selectedSkills.length > 0 && (
          <div className="py-2 px-3 bg-[#0F1115] rounded-lg">
            <p className="text-xs text-[#6B7280] mb-1">Built around</p>
            <p className="text-xs text-[#A4ACB8]">
              {program.selectedSkills.slice(0, 3).map(s => 
                s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
              ).join(', ')}
              {program.selectedSkills.length > 3 && ` +${program.selectedSkills.length - 3} more`}
            </p>
          </div>
        )}

        {/* Weekly Structure - only if no selectedSkills shown */}
        {(!program.selectedSkills || program.selectedSkills.length === 0) && program.weeklyStructure && (
          <div className="py-2 px-3 bg-[#0F1115] rounded-lg">
            <p className="text-xs text-[#A4ACB8]">
              {program.weeklyStructure}
            </p>
          </div>
        )}

        {/* Next Session */}
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-[#A4ACB8]" />
          <span className="text-[#6B7280]">Next:</span>
          <span className="text-[#E6E9EF] font-medium">
            {program.nextSessionFocus || 'Based on readiness'}
          </span>
        </div>

        {/* Action */}
        <Link 
          href="/program" 
          className="inline-flex items-center gap-1 text-xs text-[#C1121F] hover:underline"
        >
          View Program
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  )
}
