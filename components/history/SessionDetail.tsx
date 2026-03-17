'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Clock,
  Dumbbell,
  Trophy,
  CheckCircle2,
  SkipForward,
  Calendar,
  Target,
  Flame,
  Hash,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  WorkoutSessionHistory, 
  ExerciseResultSnapshot,
  PRHitSnapshot,
  PRType,
} from '@/types/history'

// =============================================================================
// TYPES
// =============================================================================

interface SessionDetailProps {
  session: WorkoutSessionHistory
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

const PR_TYPE_CONFIG: Record<PRType, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = {
  max_weight: { label: 'Max Weight', icon: Dumbbell, color: 'text-amber-400' },
  best_reps: { label: 'Best Reps', icon: Hash, color: 'text-emerald-400' },
  best_hold: { label: 'Best Hold', icon: Timer, color: 'text-blue-400' },
  best_volume: { label: 'Best Volume', icon: TrendingUp, color: 'text-purple-400' },
  best_density: { label: 'Best Density', icon: Flame, color: 'text-orange-400' },
  best_level: { label: 'Best Level', icon: Target, color: 'text-cyan-400' },
  best_sets: { label: 'Best Sets', icon: Hash, color: 'text-emerald-400' },
  first_unlock: { label: 'First Unlock', icon: Trophy, color: 'text-amber-400' },
}

// =============================================================================
// PR BADGE
// =============================================================================

function PRBadge({ pr }: { pr: PRHitSnapshot }) {
  const config = PR_TYPE_CONFIG[pr.prType] || PR_TYPE_CONFIG.max_weight
  const Icon = config.icon
  
  return (
    <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
      <Trophy className="w-4 h-4 text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#E6E9EF] truncate">
          {pr.exerciseName}
        </p>
        <p className="text-xs text-amber-400">
          {pr.newValue} {pr.unit} ({config.label})
          {pr.improvementPercent && pr.improvementPercent > 0 && (
            <span className="text-emerald-400 ml-1">
              +{pr.improvementPercent.toFixed(1)}%
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// EXERCISE RESULT ROW
// =============================================================================

function ExerciseResultRow({ exercise }: { exercise: ExerciseResultSnapshot }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      exercise.wasSkipped 
        ? "bg-[#1A1F26]/50 border-[#2B313A]/50 opacity-60"
        : exercise.wasCompleted 
          ? "bg-[#1A1F26] border-[#2B313A]"
          : "bg-[#1A1F26] border-amber-500/20"
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status Icon */}
        {exercise.wasSkipped ? (
          <SkipForward className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
        ) : exercise.wasCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-[#6B7280] flex-shrink-0" />
        )}
        
        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#E6E9EF] truncate">
              {exercise.exerciseName}
            </p>
            {exercise.isPR && (
              <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-[#6B7280]">
            {exercise.category}
          </p>
        </div>
      </div>
      
      {/* Performance Data */}
      <div className="text-right flex-shrink-0 ml-3">
        {!exercise.wasSkipped && (
          <>
            <p className="text-sm font-medium text-[#E6E9EF]">
              {exercise.actual.setsCompleted} sets
              {exercise.actual.repsPerSet && exercise.actual.repsPerSet.length > 0 && (
                <span className="text-[#A4ACB8] font-normal">
                  {' '}x {Math.round(exercise.actual.repsPerSet.reduce((a, b) => a + b, 0) / exercise.actual.repsPerSet.length)}
                </span>
              )}
              {exercise.actual.holdPerSet && exercise.actual.holdPerSet.length > 0 && (
                <span className="text-[#A4ACB8] font-normal">
                  {' '}@ {Math.round(exercise.actual.holdPerSet.reduce((a, b) => a + b, 0) / exercise.actual.holdPerSet.length)}s
                </span>
              )}
            </p>
            {exercise.actual.weightUsed && exercise.actual.weightUsed > 0 && (
              <p className="text-xs text-[#A4ACB8]">
                +{exercise.actual.weightUsed} lb
              </p>
            )}
          </>
        )}
        {exercise.wasSkipped && (
          <p className="text-xs text-[#6B7280]">Skipped</p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN SESSION DETAIL
// =============================================================================

export function SessionDetail({ session }: SessionDetailProps) {
  const prsHit = session.prsHitSnapshot || []
  const exercises = session.exerciseResultsSnapshot || []
  const metrics = session.sessionMetricsSnapshot || {}
  
  const completedCount = exercises.filter(e => e.wasCompleted).length
  const skippedCount = exercises.filter(e => e.wasSkipped).length
  
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
          <h1 className="text-xl font-semibold text-[#E6E9EF] mb-1">
            {session.workoutName || session.dayLabel || 'Workout Session'}
          </h1>
          <p className="text-sm text-[#A4ACB8]">
            {formatDate(session.workoutDate)}
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

      {/* Summary Message */}
      {session.summaryMessage && (
        <Card className="bg-gradient-to-br from-[#1A1F26] to-[#1E242D] border-[#2B313A] p-4">
          <p className="text-sm text-[#E6E9EF] leading-relaxed">
            {session.summaryMessage}
          </p>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 text-center">
          <Clock className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
          <p className="text-lg font-semibold text-[#E6E9EF]">
            {session.durationMinutes || metrics.actualDurationMinutes || '--'}
          </p>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">minutes</p>
        </Card>
        
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 text-center">
          <Dumbbell className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
          <p className="text-lg font-semibold text-[#E6E9EF]">
            {completedCount}
          </p>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">exercises</p>
        </Card>
        
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 text-center">
          <Hash className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
          <p className="text-lg font-semibold text-[#E6E9EF]">
            {metrics.totalSets || '--'}
          </p>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">sets</p>
        </Card>
        
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 text-center">
          <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-semibold text-[#E6E9EF]">
            {prsHit.length}
          </p>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">PRs</p>
        </Card>
      </div>

      {/* PRs Section */}
      {prsHit.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Personal Records
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {prsHit.map((pr, idx) => (
              <PRBadge key={idx} pr={pr} />
            ))}
          </div>
        </section>
      )}

      {/* Exercises Section */}
      <section>
        <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-[#C1121F]" />
          Exercises ({completedCount} completed{skippedCount > 0 && `, ${skippedCount} skipped`})
        </h3>
        <div className="space-y-2">
          {exercises.length > 0 ? (
            exercises.map((exercise, idx) => (
              <ExerciseResultRow key={idx} exercise={exercise} />
            ))
          ) : (
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 text-center">
              <p className="text-sm text-[#6B7280]">No exercise data recorded</p>
            </Card>
          )}
        </div>
      </section>

      {/* Additional Metrics */}
      {(metrics.averageRPE || metrics.completionRate || session.difficultyRating) && (
        <section>
          <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3">
            Performance Metrics
          </h3>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
            <div className="grid grid-cols-3 gap-4">
              {metrics.averageRPE && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-0.5">Avg RPE</p>
                  <p className="text-sm font-medium text-[#E6E9EF]">
                    {metrics.averageRPE.toFixed(1)}
                  </p>
                </div>
              )}
              {metrics.completionRate && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-0.5">Completion</p>
                  <p className="text-sm font-medium text-[#E6E9EF]">
                    {Math.round(metrics.completionRate)}%
                  </p>
                </div>
              )}
              {session.difficultyRating && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-0.5">Difficulty</p>
                  <p className="text-sm font-medium text-[#E6E9EF]">
                    {session.difficultyRating}/10
                  </p>
                </div>
              )}
            </div>
          </Card>
        </section>
      )}
      
      {/* Subtle value reinforcement footer */}
      <div className="text-center py-4 border-t border-[#2B313A]">
        <p className="text-xs text-[#6B7280]">
          This session is part of your permanent training archive.
        </p>
      </div>
    </div>
  )
}
