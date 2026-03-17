'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Trophy,
  Clock,
  Dumbbell,
  Target,
  TrendingUp,
  Save,
  Home,
  ArrowLeft,
  CheckCircle2,
  Flame,
  BarChart3,
} from 'lucide-react'
import type { SessionStats, CompletedSetData } from '@/hooks/useWorkoutSession'
import { UpgradeTriggerPanel, UPGRADE_TRIGGERS } from '@/components/premium/PremiumFeature'
import { PostWorkoutUpgradePrompt } from '@/components/upgrade/UpgradePromptCard'
import { SessionPerformanceCard } from './SessionPerformanceCard'
import {
  getSessionPerformance,
  createPerformanceInputFromStats,
  type SessionPerformanceResult,
} from '@/lib/session-performance'
import { getDailyReadiness } from '@/lib/daily-readiness'

interface WorkoutSessionSummaryProps {
  stats: SessionStats
  completedSets: CompletedSetData[]
  sessionName: string
  onSave: (notes?: string) => Promise<boolean>
  onReturnToDashboard: () => void
  onReturnToProgram: () => void
}

export function WorkoutSessionSummary({
  stats,
  completedSets,
  sessionName,
  onSave,
  onReturnToDashboard,
  onReturnToProgram,
}: WorkoutSessionSummaryProps) {
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Group sets by exercise for display
  const exerciseSummaries = completedSets.reduce((acc, set) => {
    if (!acc[set.exerciseName]) {
      acc[set.exerciseName] = {
        name: set.exerciseName,
        category: set.exerciseCategory,
        sets: [],
        totalReps: 0,
        avgRPE: 0,
      }
    }
    acc[set.exerciseName].sets.push(set)
    acc[set.exerciseName].totalReps += set.actualReps
    return acc
  }, {} as Record<string, { name: string; category: string; sets: CompletedSetData[]; totalReps: number; avgRPE: number }>)

  // Calculate average RPE per exercise
  Object.values(exerciseSummaries).forEach(ex => {
    ex.avgRPE = ex.sets.reduce((sum, s) => sum + s.actualRPE, 0) / ex.sets.length
  })

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const handleSave = async () => {
    setIsSaving(true)
    const success = await onSave(notes || undefined)
    setIsSaving(false)
    if (success) {
      setIsSaved(true)
    }
  }

  // Determine performance rating based on average RPE
  const getPerformanceRating = () => {
    if (!stats.averageRPE) return { label: 'Good', color: 'text-green-400' }
    if (stats.averageRPE <= 7) return { label: 'Controlled', color: 'text-blue-400' }
    if (stats.averageRPE <= 8) return { label: 'Productive', color: 'text-green-400' }
    if (stats.averageRPE <= 8.5) return { label: 'Challenging', color: 'text-amber-400' }
    return { label: 'Maximum Effort', color: 'text-red-400' }
  }

  const performance = getPerformanceRating()

  // Calculate session performance score
  const readiness = getDailyReadiness()
  const performanceInput = createPerformanceInputFromStats(
    stats,
    completedSets,
    'mixed', // Default session type
    sessionName,
    readiness
  )
  const sessionPerformance = getSessionPerformance(performanceInput)

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500/20 to-[#1A1F26] p-6 border-b border-[#2B313A]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#E6E9EF]">Workout Complete!</h2>
            <p className="text-[#A4ACB8]">{sessionName}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Duration */}
          <div className="bg-[#0F1115] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#C1121F]" />
              <span className="text-xs text-[#6B7280] uppercase tracking-wide">Duration</span>
            </div>
            <p className="text-2xl font-bold text-[#E6E9EF]">
              {formatDuration(stats.elapsedSeconds)}
            </p>
          </div>

          {/* Sets Completed */}
          <div className="bg-[#0F1115] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-[#C1121F]" />
              <span className="text-xs text-[#6B7280] uppercase tracking-wide">Sets</span>
            </div>
            <p className="text-2xl font-bold text-[#E6E9EF]">
              {stats.completedSets}
              <span className="text-sm text-[#6B7280] font-normal">/{stats.totalSets}</span>
            </p>
          </div>

          {/* Average RPE */}
          <div className="bg-[#0F1115] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#C1121F]" />
              <span className="text-xs text-[#6B7280] uppercase tracking-wide">Avg RPE</span>
            </div>
            <p className="text-2xl font-bold text-[#E6E9EF]">
              {stats.averageRPE?.toFixed(1) || '-'}
            </p>
          </div>

          {/* Performance */}
          <div className="bg-[#0F1115] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-[#C1121F]" />
              <span className="text-xs text-[#6B7280] uppercase tracking-wide">Effort</span>
            </div>
            <p className={`text-lg font-bold ${performance.color}`}>
              {performance.label}
            </p>
          </div>
        </div>

        {/* Session Performance Score */}
        <div>
          <h3 className="text-sm font-medium text-[#A4ACB8] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Session Performance
          </h3>
          <SessionPerformanceCard result={sessionPerformance} />
        </div>

        {/* Exercise Breakdown */}
        <div>
          <h3 className="text-sm font-medium text-[#A4ACB8] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Exercise Summary
          </h3>
          <div className="space-y-2">
            {Object.values(exerciseSummaries).map((ex) => (
              <div
                key={ex.name}
                className="bg-[#0F1115] rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-[#E6E9EF]">{ex.name}</p>
                  <p className="text-sm text-[#6B7280]">
                    {ex.sets.length} sets • {ex.totalReps} total reps
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`
                    ${ex.avgRPE <= 7 ? 'border-blue-500/30 text-blue-400' : ''}
                    ${ex.avgRPE > 7 && ex.avgRPE <= 8 ? 'border-green-500/30 text-green-400' : ''}
                    ${ex.avgRPE > 8 && ex.avgRPE <= 8.5 ? 'border-amber-500/30 text-amber-400' : ''}
                    ${ex.avgRPE > 8.5 ? 'border-red-500/30 text-red-400' : ''}
                  `}
                >
                  RPE {ex.avgRPE.toFixed(1)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Input */}
        {!isSaved && (
          <div>
            <label className="text-sm font-medium text-[#A4ACB8] mb-2 block">
              Session Notes (optional)
            </label>
            <Textarea
              placeholder="How did the workout feel? Any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] placeholder:text-[#6B7280] resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Save Status */}
        {isSaved && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-medium text-green-400">Session Saved to Your History</p>
              <p className="text-sm text-[#A4ACB8]">
                Recorded for progress tracking and fatigue analysis. {stats.prsHit > 0 && `${stats.prsHit} new PR${stats.prsHit > 1 ? 's' : ''} tracked.`}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isSaved ? (
            <Button
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white py-6"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="animate-pulse">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Session
                </>
              )}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#2B313A] py-6"
                onClick={onReturnToProgram}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Program
              </Button>
              <Button
                className="bg-[#C1121F] hover:bg-[#A30F1A] text-white py-6"
                onClick={onReturnToDashboard}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          )}

          {!isSaved && (
            <Button
              variant="ghost"
              className="w-full text-[#6B7280] hover:text-[#A4ACB8]"
              onClick={onReturnToProgram}
            >
              Skip saving and return to program
            </Button>
          )}
        </div>

        {/* Strategic Upgrade Prompt - Post Workout (frequency controlled) */}
        {isSaved && (
          <PostWorkoutUpgradePrompt className="mt-2" />
        )}
      </div>
    </Card>
  )
}
