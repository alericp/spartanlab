'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ClipboardList, 
  Calendar, 
  Trophy, 
  ChevronRight, 
  Clock,
  Dumbbell,
  Target,
  Sparkles,
  Archive,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  WorkoutSessionHistory, 
  ProgramHistory, 
  PersonalRecordHistory,
  PRHitSnapshot,
} from '@/types/history'

// =============================================================================
// TYPES
// =============================================================================

interface HistoryHubProps {
  workoutHistory: WorkoutSessionHistory[]
  programHistory: ProgramHistory[]
  recentPRs: PersonalRecordHistory[]
  totalPRs: number
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return formatDate(dateStr)
}

// =============================================================================
// WORKOUT SESSION CARD
// =============================================================================

interface WorkoutSessionCardProps {
  session: WorkoutSessionHistory
}

function WorkoutSessionCard({ session }: WorkoutSessionCardProps) {
  const prsHit = session.prsHitSnapshot?.length || 0
  
  return (
    <Link href={`/history/session/${session.id}`}>
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:bg-[#1E242D] hover:border-[#3B424D] transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Date and Status */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#6B7280] font-medium">
                {formatRelativeDate(session.workoutDate)}
              </span>
              {session.sessionStatus === 'completed' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            
            {/* Workout Name */}
            <h4 className="text-sm font-medium text-[#E6E9EF] truncate mb-1">
              {session.workoutName || session.dayLabel || 'Workout Session'}
            </h4>
            
            {/* Summary Message */}
            {session.summaryMessage && (
              <p className="text-xs text-[#A4ACB8] line-clamp-2 mb-2">
                {session.summaryMessage}
              </p>
            )}
            
            {/* Stats Row */}
            <div className="flex items-center gap-3 text-xs text-[#6B7280]">
              {session.durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {session.durationMinutes}m
                </span>
              )}
              {session.exercisesCompleted && (
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" />
                  {session.exercisesCompleted} exercises
                </span>
              )}
              {prsHit > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Trophy className="w-3 h-3" />
                  {prsHit} PR{prsHit > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#A4ACB8] transition-colors flex-shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  )
}

// =============================================================================
// PROGRAM HISTORY CARD
// =============================================================================

interface ProgramHistoryCardProps {
  program: ProgramHistory
}

function ProgramHistoryCard({ program }: ProgramHistoryCardProps) {
  const isActive = program.status === 'active'
  
  return (
    <Link href={`/history/program/${program.id}`}>
      <Card className={cn(
        "border p-4 hover:border-[#3B424D] transition-all cursor-pointer group",
        isActive 
          ? "bg-[#1A1F26] border-[#C1121F]/30" 
          : "bg-[#1A1F26] border-[#2B313A]"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-1">
              {isActive ? (
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-medium text-[#6B7280] bg-[#2B313A] px-1.5 py-0.5 rounded uppercase">
                  {program.status}
                </span>
              )}
              <span className="text-xs text-[#6B7280]">
                v{program.versionNumber}
              </span>
            </div>
            
            {/* Program Name */}
            <h4 className="text-sm font-medium text-[#E6E9EF] truncate mb-1">
              {program.programName}
            </h4>
            
            {/* Reason Summary */}
            {program.reasonSummary && (
              <p className="text-xs text-[#A4ACB8] line-clamp-2 mb-2">
                {program.reasonSummary}
              </p>
            )}
            
            {/* Stats Row */}
            <div className="flex items-center gap-3 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(program.createdAt)}
              </span>
              {program.trainingDaysPerWeek && (
                <span>{program.trainingDaysPerWeek}x/week</span>
              )}
              {program.totalSessionsCompleted > 0 && (
                <span>{program.totalSessionsCompleted} sessions</span>
              )}
            </div>
          </div>
          
          <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#A4ACB8] transition-colors flex-shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyHistoryStateProps {
  type: 'workouts' | 'programs' | 'prs'
}

function EmptyHistoryState({ type }: EmptyHistoryStateProps) {
  const config = {
    workouts: {
      icon: ClipboardList,
      title: 'No workout history yet',
      description: 'Your completed sessions will appear here.',
    },
    programs: {
      icon: Calendar,
      title: 'No program history yet',
      description: 'Your training programs will be preserved here.',
    },
    prs: {
      icon: Trophy,
      title: 'No PRs tracked yet',
      description: 'Personal records will appear as you train.',
    },
  }[type]
  
  const Icon = config.icon
  
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[#6B7280]" />
      </div>
      <p className="text-sm text-[#A4ACB8] mb-1">{config.title}</p>
      <p className="text-xs text-[#6B7280]">{config.description}</p>
    </div>
  )
}

// =============================================================================
// SECTION HEADER
// =============================================================================

interface SectionHeaderProps {
  title: string
  icon: React.ReactNode
  action?: {
    label: string
    href: string
  }
}

function SectionHeader({ title, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-[#1A1F26] border border-[#2B313A]">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-[#E6E9EF]">{title}</h3>
      </div>
      {action && (
        <Link href={action.href}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-[#A4ACB8] hover:text-[#E6E9EF] h-7 px-2"
          >
            {action.label}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  )
}

// =============================================================================
// MAIN HISTORY HUB
// =============================================================================

export function HistoryHub({
  workoutHistory,
  programHistory,
  recentPRs,
  totalPRs,
}: HistoryHubProps) {
  const recentWorkouts = workoutHistory.slice(0, 5)
  const recentPrograms = programHistory.slice(0, 3)
  const mostRecentPR = recentPRs[0]

  return (
    <div className="space-y-8">
      {/* Workout History Section */}
      <section>
        <SectionHeader
          title="Workout History"
          icon={<ClipboardList className="w-4 h-4 text-[#C1121F]" />}
          action={workoutHistory.length > 5 ? { label: 'View All', href: '/history/workouts' } : undefined}
        />
        
        {recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((session) => (
              <WorkoutSessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <Card className="bg-[#1A1F26] border-[#2B313A]">
            <EmptyHistoryState type="workouts" />
          </Card>
        )}
      </section>

      {/* Program History Section */}
      <section>
        <SectionHeader
          title="Program History"
          icon={<Calendar className="w-4 h-4 text-[#C1121F]" />}
          action={programHistory.length > 3 ? { label: 'View All', href: '/history/programs' } : undefined}
        />
        
        {recentPrograms.length > 0 ? (
          <div className="space-y-3">
            {recentPrograms.map((program) => (
              <ProgramHistoryCard key={program.id} program={program} />
            ))}
          </div>
        ) : (
          <Card className="bg-[#1A1F26] border-[#2B313A]">
            <EmptyHistoryState type="programs" />
          </Card>
        )}
      </section>

      {/* PR Archive Entry */}
      <section>
        <SectionHeader
          title="PR Archive"
          icon={<Trophy className="w-4 h-4 text-amber-400" />}
        />
        
        <Link href="/prs">
          <Card className="bg-[#1A1F26] border-[#2B313A] p-5 hover:bg-[#1E242D] hover:border-[#3B424D] transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-2xl font-bold text-[#E6E9EF]">
                      {totalPRs}
                    </span>
                    <span className="text-sm text-[#6B7280]">
                      personal records
                    </span>
                  </div>
                  {mostRecentPR ? (
                    <p className="text-xs text-[#A4ACB8]">
                      Latest: {mostRecentPR.exerciseName} on {formatDate(mostRecentPR.achievedAt)}
                    </p>
                  ) : (
                    <p className="text-xs text-[#6B7280]">
                      Track your lifetime bests
                    </p>
                  )}
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[#A4ACB8] hover:text-[#E6E9EF] group-hover:bg-[#2B313A]"
              >
                View Archive
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </Link>
      </section>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { WorkoutSessionCard, ProgramHistoryCard, EmptyHistoryState }
