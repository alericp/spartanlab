'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Archive,
  Sparkles,
  Layers,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProgramHistory, ProgramStructureSnapshot } from '@/types/history'

// =============================================================================
// TYPES
// =============================================================================

interface ProgramDetailProps {
  program: ProgramHistory
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// =============================================================================
// STATUS BADGE
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { label: 'Active', className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
    archived: { label: 'Archived', className: 'bg-[#2B313A] text-[#A4ACB8] border-[#3B424D]' },
    replaced: { label: 'Replaced', className: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
    completed: { label: 'Completed', className: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
    paused: { label: 'Paused', className: 'bg-[#2B313A] text-[#6B7280] border-[#3B424D]' },
  }[status] || { label: status, className: 'bg-[#2B313A] text-[#A4ACB8] border-[#3B424D]' }

  return (
    <span className={cn(
      "text-xs font-medium px-2 py-0.5 rounded border uppercase",
      config.className
    )}>
      {config.label}
    </span>
  )
}

// =============================================================================
// DAY STRUCTURE CARD
// =============================================================================

interface DayStructureCardProps {
  day: ProgramStructureSnapshot['days'][0]
  expanded?: boolean
  onToggle?: () => void
}

function DayStructureCard({ day, expanded, onToggle }: DayStructureCardProps) {
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
      {/* Day Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-[#1E242D] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F1115] border border-[#2B313A] flex items-center justify-center text-sm font-bold text-[#E6E9EF]">
            {day.dayNumber}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-[#E6E9EF]">
              {day.dayLabel}
            </p>
            <p className="text-xs text-[#6B7280]">
              {day.focus} • {day.exercises.length} exercises
            </p>
          </div>
        </div>
        {expanded !== undefined && (
          expanded ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )
        )}
      </button>
      
      {/* Exercises List (Expandable) */}
      {expanded && (
        <div className="border-t border-[#2B313A] p-3 space-y-2">
          {day.exercises.map((exercise, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between py-2 px-3 rounded-md bg-[#0F1115]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#E6E9EF] truncate">
                  {exercise.exerciseName}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {exercise.category}
                </p>
              </div>
              <div className="text-right text-xs text-[#A4ACB8] flex-shrink-0 ml-3">
                {exercise.sets && (
                  <span>{exercise.sets} sets</span>
                )}
                {exercise.reps && (
                  <span> x {exercise.reps}</span>
                )}
                {exercise.hold && (
                  <span> @ {exercise.hold}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// =============================================================================
// MAIN PROGRAM DETAIL
// =============================================================================

export function ProgramDetail({ program }: ProgramDetailProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  
  const structure = program.programStructureSnapshot
  const goals = program.goalsSnapshot
  const inputs = program.athleteInputsSnapshot
  
  const toggleDay = (dayNumber: number) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber)
    } else {
      newExpanded.add(dayNumber)
    }
    setExpandedDays(newExpanded)
  }
  
  const expandAll = () => {
    if (structure?.days) {
      setExpandedDays(new Set(structure.days.map(d => d.dayNumber)))
    }
  }
  
  const collapseAll = () => {
    setExpandedDays(new Set())
  }
  
  return (
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
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={program.status} />
            <span className="text-xs text-[#6B7280]">v{program.versionNumber}</span>
          </div>
          <h1 className="text-xl font-semibold text-[#E6E9EF] mb-1">
            {program.programName}
          </h1>
          <p className="text-sm text-[#A4ACB8]">
            Created {formatShortDate(program.createdAt)}
            {program.archivedAt && (
              <span className="text-[#6B7280]">
                {' '}• Archived {formatShortDate(program.archivedAt)}
              </span>
            )}
          </p>
        </div>
        {/* Quick return to current training */}
        <Link href="/dashboard">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs text-[#6B7280] hover:text-[#E6E9EF] hover:bg-[#1A1F26]"
          >
            <Flame className="w-3 h-3 mr-1" />
            Current Training
          </Button>
        </Link>
      </div>

      {/* Why This Program */}
      {program.reasonSummary && (
        <Card className="bg-gradient-to-br from-[#1A1F26] to-[#1E242D] border-[#2B313A] p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#0F1115] border border-[#2B313A]">
              <Sparkles className="w-4 h-4 text-[#C1121F]" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                Why This Program
              </h3>
              <p className="text-sm text-[#E6E9EF] leading-relaxed">
                {program.reasonSummary}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 text-center">
          <Calendar className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
          <p className="text-lg font-semibold text-[#E6E9EF]">
            {program.trainingDaysPerWeek || structure?.daysPerWeek || '--'}
          </p>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">days/week</p>
        </Card>
        
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 text-center">
          <Clock className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
          <p className="text-lg font-semibold text-[#E6E9EF]">
            {program.sessionLengthMinutes || structure?.sessionLengthMinutes || '--'}
          </p>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">min/session</p>
        </Card>
        
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 text-center">
          <CheckCircle2 className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
          <p className="text-lg font-semibold text-[#E6E9EF]">
            {program.totalSessionsCompleted}
          </p>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">sessions</p>
        </Card>
        
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 text-center">
          <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-semibold text-[#E6E9EF]">
            {program.totalPRsAchieved}
          </p>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">PRs</p>
        </Card>
      </div>

      {/* Goals at Generation */}
      {goals && (goals.primaryGoal || goals.selectedSkills?.length) && (
        <section>
          <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#C1121F]" />
            Goals at Generation
          </h3>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
            <div className="space-y-3">
              {goals.primaryGoal && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Primary Goal</p>
                  <p className="text-sm font-medium text-[#E6E9EF]">
                    {goals.primaryGoalLabel || goals.primaryGoal}
                  </p>
                </div>
              )}
              {goals.selectedSkills && goals.selectedSkills.length > 0 && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Target Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {goals.selectedSkills.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-[#0F1115] border border-[#2B313A] px-2 py-0.5 rounded text-[#A4ACB8]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Program Structure */}
      {structure?.days && structure.days.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#E6E9EF] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C1121F]" />
              Program Structure
            </h3>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={expandAll}
                className="text-xs h-7 px-2 text-[#A4ACB8] hover:text-[#E6E9EF]"
              >
                Expand All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={collapseAll}
                className="text-xs h-7 px-2 text-[#A4ACB8] hover:text-[#E6E9EF]"
              >
                Collapse
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {structure.days.map((day) => (
              <DayStructureCard
                key={day.dayNumber}
                day={day}
                expanded={expandedDays.has(day.dayNumber)}
                onToggle={() => toggleDay(day.dayNumber)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Coaching Notes */}
      {structure?.coachingNotes && structure.coachingNotes.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3">
            Coaching Notes
          </h3>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
            <ul className="space-y-2">
              {structure.coachingNotes.map((note, idx) => (
                <li key={idx} className="text-sm text-[#A4ACB8] flex items-start gap-2">
                  <span className="text-[#C1121F] mt-1">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Block Summary */}
      {program.blockSummary && (
        <section>
          <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3">
            Block Summary
          </h3>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
            <p className="text-sm text-[#A4ACB8] leading-relaxed">
              {program.blockSummary}
            </p>
          </Card>
        </section>
      )}
    </div>
  )
}
