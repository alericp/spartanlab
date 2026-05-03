'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, Flame, Zap, Clock } from 'lucide-react'
import {
  type PerceivedDifficulty,
  type SessionType,
  type FocusArea,
  quickLogWorkout,
  DIFFICULTY_LABELS,
} from '@/lib/workout-log-service'
import { onTrainingEvent } from '@/lib/achievements/achievement-engine'
import { showAchievementNotifications } from '@/components/achievements/achievement-notification'
import { onTrainingEventForChallenges } from '@/lib/challenges/challenge-engine'
import { showChallengeNotifications } from '@/components/challenges/challenge-notification'

interface QuickLogModalProps {
  open: boolean
  onClose: () => void
  workoutName?: string
  workoutId?: string
  sessionType?: SessionType
  focusArea?: FocusArea
  estimatedDuration?: number
  onComplete?: () => void
}

export function QuickLogModal({
  open,
  onClose,
  workoutName = 'Training Session',
  workoutId,
  sessionType = 'mixed',
  focusArea = 'general',
  estimatedDuration = 45,
  onComplete,
}: QuickLogModalProps) {
  const [difficulty, setDifficulty] = useState<PerceivedDifficulty>('normal')
  const [duration, setDuration] = useState(estimatedDuration)
  const [pullUps, setPullUps] = useState<string>('')
  const [dips, setDips] = useState<string>('')
  const [pushUps, setPushUps] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)

    try {
      // Build key performance if provided
      const keyPerformance: { pullUps?: number; dips?: number; pushUps?: number } = {}
      if (pullUps && parseInt(pullUps) > 0) keyPerformance.pullUps = parseInt(pullUps)
      if (dips && parseInt(dips) > 0) keyPerformance.dips = parseInt(dips)
      if (pushUps && parseInt(pushUps) > 0) keyPerformance.pushUps = parseInt(pushUps)

      quickLogWorkout({
        sessionName: workoutName,
        sessionType,
        focusArea,
        durationMinutes: duration,
        perceivedDifficulty: difficulty,
        generatedWorkoutId: workoutId,
        keyPerformance: Object.keys(keyPerformance).length > 0 ? keyPerformance : undefined,
      })

      // Check for newly unlocked achievements
      // [ACHIEVEMENT-EVENT-TYPE-REQUIRED] onTrainingEvent now requires
      // a TrainingEventType. Use 'workout_complete' to mirror the call
      // in useWorkoutSession.ts:400.
      const newAchievements = onTrainingEvent('workout_complete')
      if (newAchievements.length > 0) {
        showAchievementNotifications(newAchievements)
      }

      // Check for completed challenges
      const completedChallenges = onTrainingEventForChallenges()
      if (completedChallenges.length > 0) {
        showChallengeNotifications(completedChallenges)
      }

      setSaved(true)
      setTimeout(() => {
        onComplete?.()
        onClose()
        // Reset state for next time
        setSaved(false)
        setDifficulty('normal')
        setPullUps('')
        setDips('')
        setPushUps('')
      }, 1500)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-[#E6E9EF] mb-2">Workout Logged!</h3>
            <p className="text-[#A5A5A5] text-center">
              Great work! Your training has been recorded.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#E6E9EF]">Log Workout</DialogTitle>
          <DialogDescription className="text-[#A5A5A5]">
            Quick log your completed workout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Workout Name */}
          <div className="bg-[#2A2A2A] rounded-lg p-3">
            <p className="text-sm text-[#A5A5A5]">Workout</p>
            <p className="font-medium text-[#E6E9EF]">{workoutName}</p>
          </div>

          {/* Duration */}
          <div>
            <Label className="text-sm text-[#A5A5A5] mb-2 block">Duration (minutes)</Label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6B6B6B]" />
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="bg-[#2A2A2A] border-[#3A3A3A] w-24"
                min={5}
                max={180}
              />
              <span className="text-sm text-[#A5A5A5]">min</span>
            </div>
          </div>

          {/* Perceived Difficulty */}
          <div>
            <Label className="text-sm text-[#A5A5A5] mb-2 block">How did it feel?</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as PerceivedDifficulty[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-3 px-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    difficulty === level
                      ? level === 'easy'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : level === 'normal'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'bg-[#2A2A2A] border-[#3A3A3A] text-[#A5A5A5] hover:border-[#4A4A4A]'
                  }`}
                >
                  {level === 'easy' ? (
                    <Flame className="w-5 h-5" />
                  ) : level === 'normal' ? (
                    <Zap className="w-5 h-5" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  <span className="capitalize">{level}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1.5 text-center">
              {DIFFICULTY_LABELS[difficulty]}
            </p>
          </div>

          {/* Key Performance (Optional) */}
          <div className="pt-2 border-t border-[#2A2A2A]">
            <Label className="text-sm text-[#A5A5A5] mb-2 block">
              Key Performance (optional)
            </Label>
            <p className="text-xs text-[#6B6B6B] mb-3">
              Log your best set for tracking progress
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-[#6B6B6B]">Pull-ups</Label>
                <Input
                  type="number"
                  value={pullUps}
                  onChange={(e) => setPullUps(e.target.value)}
                  placeholder="0"
                  className="bg-[#2A2A2A] border-[#3A3A3A] mt-1"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-xs text-[#6B6B6B]">Dips</Label>
                <Input
                  type="number"
                  value={dips}
                  onChange={(e) => setDips(e.target.value)}
                  placeholder="0"
                  className="bg-[#2A2A2A] border-[#3A3A3A] mt-1"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-xs text-[#6B6B6B]">Push-ups</Label>
                <Input
                  type="number"
                  value={pushUps}
                  onChange={(e) => setPushUps(e.target.value)}
                  placeholder="0"
                  className="bg-[#2A2A2A] border-[#3A3A3A] mt-1"
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#3A3A3A] hover:bg-[#2A2A2A]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#E63946] hover:bg-[#D62828]"
          >
            {saving ? 'Saving...' : 'Log Workout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
