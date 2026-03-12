'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { 
  saveStrengthRecord, 
  calculateOneRM,
  type ExerciseType 
} from '@/lib/strength-service'

interface StrengthLoggerProps {
  exercise: ExerciseType
  exerciseName: string
  onRecordSaved: () => void
}

export function StrengthLogger({ exercise, exerciseName, onRecordSaved }: StrengthLoggerProps) {
  const [weightAdded, setWeightAdded] = useState('')
  const [reps, setReps] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const weightNum = parseFloat(weightAdded) || 0
  const repsNum = parseInt(reps) || 0
  const estimatedOneRM = weightNum > 0 && repsNum > 0 ? calculateOneRM(weightNum, repsNum) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (weightNum <= 0 || repsNum <= 0) return
    
    setSaving(true)
    
    try {
      saveStrengthRecord(exercise, weightNum, repsNum, date)
      setWeightAdded('')
      setReps('')
      setDate(new Date().toISOString().split('T')[0])
      onRecordSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <h3 className="text-xl font-semibold mb-6">Log {exerciseName}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="weight">Weight Added (lbs)</FieldLabel>
            <Input
              id="weight"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g., 45"
              value={weightAdded}
              onChange={(e) => setWeightAdded(e.target.value)}
              className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]"
            />
          </Field>
          
          <Field>
            <FieldLabel htmlFor="reps">Reps Performed</FieldLabel>
            <Input
              id="reps"
              type="number"
              min="1"
              max="30"
              placeholder="e.g., 5"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]"
            />
          </Field>
          
          <Field>
            <FieldLabel htmlFor="date">Date</FieldLabel>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]"
            />
          </Field>
        </FieldGroup>

        {/* Estimated 1RM Preview */}
        {estimatedOneRM > 0 && (
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3A3A3A]">
            <p className="text-sm text-[#A5A5A5] mb-1">Estimated 1RM (Epley)</p>
            <p className="text-2xl font-bold text-[#E63946]">+{estimatedOneRM} lbs</p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={saving || weightNum <= 0 || repsNum <= 0}
          className="w-full bg-[#E63946] hover:bg-[#D62828] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Log Strength Record'}
        </Button>
      </form>
    </Card>
  )
}
