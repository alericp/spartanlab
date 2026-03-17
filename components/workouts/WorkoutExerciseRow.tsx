'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, GripVertical } from 'lucide-react'
import {
  type WorkoutExercise,
  type ExerciseCategory,
  CATEGORY_LABELS,
  EXERCISE_TEMPLATES,
} from '@/lib/workout-log-service'
import { BandSelector, BandBadge } from './BandSelector'
import { supportsBandAssistance, type ResistanceBandColor } from '@/lib/band-progression-engine'

interface WorkoutExerciseRowProps {
  exercise: WorkoutExercise
  onUpdate: (exercise: WorkoutExercise) => void
  onRemove: () => void
}

export function WorkoutExerciseRow({
  exercise,
  onUpdate,
  onRemove,
}: WorkoutExerciseRowProps) {
  const handleNameChange = (name: string) => {
    // Auto-detect category from template
    const template = EXERCISE_TEMPLATES.find(t => t.name === name)
    // Check if exercise supports band assistance
    const exerciseId = name.toLowerCase().replace(/\s+/g, '_')
    const bandSupported = supportsBandAssistance(exerciseId)
    
    onUpdate({
      ...exercise,
      name,
      category: template?.category || exercise.category,
      supportsBandAssistance: bandSupported,
      // Clear band if exercise doesn't support it
      band: bandSupported ? exercise.band : undefined,
    })
  }
  
  const handleBandChange = (band: ResistanceBandColor | null) => {
    onUpdate({
      ...exercise,
      band: band ? { bandColor: band, assisted: true } : undefined,
    })
  }
  
  // Determine if this exercise supports bands
  const exerciseId = exercise.name.toLowerCase().replace(/\s+/g, '_')
  const showBandSelector = exercise.supportsBandAssistance || supportsBandAssistance(exerciseId)

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-[#4A4A4A]" />
        
        {/* Exercise name - either select from templates or type custom */}
        <div className="flex-1">
          <Select value={exercise.name} onValueChange={handleNameChange}>
            <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A]">
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A] max-h-60">
              {EXERCISE_TEMPLATES.map((template) => (
                <SelectItem key={template.name} value={template.name}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category badge */}
        <span className="text-xs px-2 py-1 bg-[#2A2A2A] rounded text-[#A5A5A5]">
          {CATEGORY_LABELS[exercise.category]}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="text-[#A5A5A5] hover:text-[#E63946] h-8 w-8"
          onClick={onRemove}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Exercise details row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#A5A5A5]">Sets</label>
          <Input
            type="number"
            value={exercise.sets}
            onChange={(e) => onUpdate({ ...exercise, sets: parseInt(e.target.value) || 0 })}
            className="w-16 h-8 bg-[#2A2A2A] border-[#3A3A3A] text-center"
            min={1}
            max={20}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[#A5A5A5]">Reps</label>
          <Input
            type="number"
            value={exercise.reps || ''}
            onChange={(e) => onUpdate({ ...exercise, reps: parseInt(e.target.value) || undefined })}
            className="w-16 h-8 bg-[#2A2A2A] border-[#3A3A3A] text-center"
            placeholder="-"
            min={1}
            max={100}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[#A5A5A5]">Load (lbs)</label>
          <Input
            type="number"
            value={exercise.load || ''}
            onChange={(e) => onUpdate({ ...exercise, load: parseInt(e.target.value) || undefined })}
            className="w-20 h-8 bg-[#2A2A2A] border-[#3A3A3A] text-center"
            placeholder="-"
            min={0}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[#A5A5A5]">Hold (s)</label>
          <Input
            type="number"
            value={exercise.holdSeconds || ''}
            onChange={(e) => onUpdate({ ...exercise, holdSeconds: parseInt(e.target.value) || undefined })}
            className="w-16 h-8 bg-[#2A2A2A] border-[#3A3A3A] text-center"
            placeholder="-"
            min={0}
          />
        </div>
        
        {/* Band assistance selector - only show for supported exercises */}
        {showBandSelector && (
          <BandSelector
            exerciseId={exerciseId}
            exerciseName={exercise.name}
            value={exercise.band?.bandColor}
            onChange={handleBandChange}
            showInsight={true}
            compact={true}
          />
        )}
      </div>
      
      {/* Show band badge if band is selected */}
      {exercise.band?.bandColor && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-[#6B7280]">Assistance:</span>
          <BandBadge band={exercise.band.bandColor} size="sm" />
        </div>
      )}
    </div>
  )
}
