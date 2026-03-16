'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Save } from 'lucide-react'
import { WorkoutExerciseRow } from './WorkoutExerciseRow'
import {
  type WorkoutLog,
  type WorkoutExercise,
  type SessionType,
  type FocusArea,
  type PerceivedDifficulty,
  SESSION_TYPE_LABELS,
  FOCUS_AREA_LABELS,
  DIFFICULTY_LABELS,
  saveWorkoutLog,
} from '@/lib/workout-log-service'
import { onTrainingEvent } from '@/lib/achievements/achievement-engine'
import { showAchievementNotifications } from '@/components/achievements/achievement-notification'
import { onTrainingEventForChallenges } from '@/lib/challenges/challenge-engine'
import { showChallengeNotifications } from '@/components/challenges/challenge-notification'

interface WorkoutLogFormProps {
  onSave: (log: WorkoutLog) => void
  onCancel?: () => void
}

export function WorkoutLogForm({ onSave, onCancel }: WorkoutLogFormProps) {
  const [sessionName, setSessionName] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('mixed')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [focusArea, setFocusArea] = useState<FocusArea>('general')
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<PerceivedDifficulty>('normal')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [saving, setSaving] = useState(false)

  const addExercise = () => {
    const newExercise: WorkoutExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      category: 'push',
      sets: 3,
      completed: true,
    }
    setExercises([...exercises, newExercise])
  }

  const updateExercise = (index: number, updated: WorkoutExercise) => {
    const newExercises = [...exercises]
    newExercises[index] = updated
    setExercises(newExercises)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!sessionName.trim()) return
    if (exercises.length === 0) return

    setSaving(true)

    try {
      const log = saveWorkoutLog({
        sessionName: sessionName.trim(),
        sessionType,
        sessionDate,
        durationMinutes,
        focusArea,
        perceivedDifficulty,
        notes: notes.trim() || undefined,
        exercises: exercises.filter(e => e.name.trim()),
      })
      
      // Check for newly unlocked achievements
      const newAchievements = onTrainingEvent()
      if (newAchievements.length > 0) {
        showAchievementNotifications(newAchievements)
      }
      
      // Check for completed challenges
      const completedChallenges = onTrainingEventForChallenges()
      if (completedChallenges.length > 0) {
        showChallengeNotifications(completedChallenges)
      }
      
      onSave(log)
      
      // Reset form
      setSessionName('')
      setSessionType('mixed')
      setSessionDate(new Date().toISOString().split('T')[0])
      setDurationMinutes(45)
      setFocusArea('general')
      setPerceivedDifficulty('normal')
      setNotes('')
      setExercises([])
    } finally {
      setSaving(false)
    }
  }

  const isValid = sessionName.trim() && exercises.length > 0 && exercises.some(e => e.name.trim())

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <h3 className="text-lg font-semibold mb-4">Log New Session</h3>
      
      <div className="space-y-4">
        {/* Session details row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-sm text-[#A5A5A5]">Session Name</Label>
            <Input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. Planche Push Day"
              className="bg-[#1A1A1A] border-[#3A3A3A] mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm text-[#A5A5A5]">Type</Label>
            <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm text-[#A5A5A5]">Focus</Label>
            <Select value={focusArea} onValueChange={(v) => setFocusArea(v as FocusArea)}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                {Object.entries(FOCUS_AREA_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date and duration row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm text-[#A5A5A5]">Date</Label>
            <Input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="bg-[#1A1A1A] border-[#3A3A3A] mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm text-[#A5A5A5]">Duration (min)</Label>
            <Input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              className="bg-[#1A1A1A] border-[#3A3A3A] mt-1"
              min={5}
              max={180}
            />
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-[#A5A5A5]">Exercises ({exercises.length})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addExercise}
              className="border-[#3A3A3A] hover:bg-[#3A3A3A] gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </Button>
          </div>
          
          {exercises.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-lg p-6 text-center">
              <p className="text-[#A5A5A5] text-sm">No exercises added yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={addExercise}
                className="mt-2 text-[#E63946]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add your first exercise
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <WorkoutExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  onUpdate={(updated) => updateExercise(index, updated)}
                  onRemove={() => removeExercise(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Perceived Difficulty */}
        <div>
          <Label className="text-sm text-[#A5A5A5] mb-2 block">How did this workout feel?</Label>
          <div className="flex gap-2">
            {(['easy', 'normal', 'hard'] as PerceivedDifficulty[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPerceivedDifficulty(level)}
                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  perceivedDifficulty === level
                    ? level === 'easy'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : level === 'normal'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-[#1A1A1A] border-[#3A3A3A] text-[#A5A5A5] hover:border-[#4A4A4A]'
                }`}
              >
                {level === 'easy' ? 'Easy' : level === 'normal' ? 'Normal' : 'Hard'}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6B6B6B] mt-1.5">
            {DIFFICULTY_LABELS[perceivedDifficulty]}
          </p>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-sm text-[#A5A5A5]">Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the session feel? Any PRs?"
            className="bg-[#1A1A1A] border-[#3A3A3A] mt-1 resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-[#3A3A3A] hover:bg-[#3A3A3A]"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || saving}
            className="bg-[#E63946] hover:bg-[#D62828] gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Session'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
