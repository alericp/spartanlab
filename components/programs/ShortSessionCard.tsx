'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Zap,
  TrendingUp,
  Triangle,
  Layers,
  Target,
  ChevronDown,
  ChevronUp,
  Info,
  Play,
  Dumbbell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GeneratedShortSession, ShortSessionFormat } from '@/lib/short-session-generation'

// =============================================================================
// FORMAT ICONS
// =============================================================================

const FORMAT_ICONS: Record<ShortSessionFormat, typeof Clock> = {
  emom: Clock,
  ladder: TrendingUp,
  pyramid: Triangle,
  density_block: Layers,
  express: Zap,
  skill_micro: Target,
}

// =============================================================================
// SHORT SESSION CARD
// =============================================================================

interface ShortSessionCardProps {
  session: GeneratedShortSession
  onStart?: () => void
  onViewDetails?: () => void
  compact?: boolean
}

export function ShortSessionCard({ session, onStart, onViewDetails, compact = false }: ShortSessionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const FormatIcon = FORMAT_ICONS[session.format]
  
  // Fatigue badge color
  const fatigueBadgeColor = {
    very_low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  }[session.fatigueCost]
  
  if (compact) {
    return (
      <Card className="bg-[#0D0F12] border-[#2B313A] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/20 flex items-center justify-center">
              <FormatIcon className="w-5 h-5 text-[#C1121F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#E6E9EF]">{session.formatLabel}</span>
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-[#2B313A]">
                  {session.durationMinutes} min
                </Badge>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {session.exercises.length} exercises
              </p>
            </div>
          </div>
          {onStart && (
            <Button
              size="sm"
              onClick={onStart}
              className="bg-[#C1121F] hover:bg-[#A50E1A] text-white"
            >
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          )}
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="bg-[#0D0F12] border-[#2B313A] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#2B313A]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/20 flex items-center justify-center">
              <FormatIcon className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[#E6E9EF]">{session.formatLabel} Session</h3>
                <Badge variant="outline" className="text-xs border-[#2B313A]">
                  {session.durationMinutes} min
                </Badge>
              </div>
              <p className="text-sm text-[#6B7280] mt-0.5">
                {session.formatDescription}
              </p>
            </div>
          </div>
          <Badge className={cn('text-xs border', fatigueBadgeColor)}>
            {session.fatigueCost === 'very_low' ? 'Very Low' : session.fatigueCost.charAt(0).toUpperCase() + session.fatigueCost.slice(1)} Fatigue
          </Badge>
        </div>
      </div>
      
      {/* Structure Info */}
      <div className="px-4 py-3 bg-[#0A0C0F] border-b border-[#2B313A]">
        <div className="flex items-center gap-4 text-xs text-[#A4ACB8]">
          {session.structure.rounds && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B7280]">Rounds:</span>
              <span className="text-[#E6E9EF]">{session.structure.rounds}</span>
            </div>
          )}
          {session.structure.repScheme && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B7280]">Reps:</span>
              <span className="text-[#E6E9EF]">{session.structure.repScheme}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B7280]">Density:</span>
            <span className="text-[#E6E9EF] capitalize">{session.structure.density}</span>
          </div>
        </div>
      </div>
      
      {/* Coaching Explanation */}
      <div className="px-4 py-3 border-b border-[#2B313A]">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[#4F6D8A] shrink-0 mt-0.5" />
          <p className="text-sm text-[#A4ACB8] leading-relaxed">
            {session.coachingExplanation}
          </p>
        </div>
      </div>
      
      {/* Focus Areas */}
      {session.focusAreas.length > 0 && (
        <div className="px-4 py-3 border-b border-[#2B313A]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#6B7280]">Focus:</span>
            {session.focusAreas.map((area, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs border-[#C1121F]/30 text-[#C1121F]"
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Exercises (Expandable) */}
      <div className="border-b border-[#2B313A]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1A1F26]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#6B7280]" />
            <span className="text-sm font-medium text-[#E6E9EF]">
              {session.exercises.length} Exercises
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>
        
        {expanded && (
          <div className="px-4 pb-4 space-y-2">
            {session.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between py-2 border-t border-[#2B313A]/50 first:border-t-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-[#1A1F26] flex items-center justify-center text-xs text-[#6B7280]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm text-[#E6E9EF]">{exercise.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {exercise.sets} sets × {exercise.reps} • Rest {exercise.rest}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    exercise.tier === 'tier1_core' && 'border-[#C1121F]/30 text-[#C1121F]',
                    exercise.tier === 'tier2_support' && 'border-[#4F6D8A]/30 text-[#4F6D8A]',
                    exercise.tier === 'tier3_optional' && 'border-[#6B7280]/30 text-[#6B7280]'
                  )}
                >
                  {exercise.tier === 'tier1_core' ? 'Core' : exercise.tier === 'tier2_support' ? 'Support' : 'Optional'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Safety Notes */}
      {session.safetyNotes.length > 0 && (
        <div className="px-4 py-3 bg-[#0A0C0F] border-b border-[#2B313A]">
          <p className="text-xs text-[#6B7280] mb-1.5">Safety Notes:</p>
          <ul className="space-y-1">
            {session.safetyNotes.slice(0, 2).map((note, i) => (
              <li key={i} className="text-xs text-[#A4ACB8] flex items-start gap-1.5">
                <span className="text-[#C1121F]">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Actions */}
      <div className="p-4 flex gap-2">
        {onStart && (
          <Button
            onClick={onStart}
            className="flex-1 bg-[#C1121F] hover:bg-[#A50E1A] text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Session
          </Button>
        )}
        {onViewDetails && (
          <Button
            variant="outline"
            onClick={onViewDetails}
            className="border-[#2B313A] hover:bg-[#1A1F26]"
          >
            View Details
          </Button>
        )}
      </div>
    </Card>
  )
}

// =============================================================================
// SHORT SESSION FORMAT SELECTOR
// =============================================================================

interface ShortSessionFormatSelectorProps {
  selectedFormat: ShortSessionFormat | 'auto'
  onSelectFormat: (format: ShortSessionFormat | 'auto') => void
  disabled?: boolean
}

export function ShortSessionFormatSelector({
  selectedFormat,
  onSelectFormat,
  disabled = false,
}: ShortSessionFormatSelectorProps) {
  const formats: Array<{ value: ShortSessionFormat | 'auto'; label: string; description: string }> = [
    { value: 'auto', label: 'Auto', description: 'AI selects best format' },
    { value: 'emom', label: 'EMOM', description: 'Every Minute On the Minute' },
    { value: 'ladder', label: 'Ladder', description: 'Progressive reps' },
    { value: 'pyramid', label: 'Pyramid', description: 'Up then down' },
    { value: 'density_block', label: 'Density', description: 'Timed block' },
    { value: 'express', label: 'Express', description: 'Quick standard' },
  ]
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#E6E9EF]">Session Format</label>
      <div className="grid grid-cols-3 gap-2">
        {formats.map((format) => {
          const Icon = format.value === 'auto' ? Zap : FORMAT_ICONS[format.value as ShortSessionFormat]
          const isSelected = selectedFormat === format.value
          
          return (
            <button
              key={format.value}
              onClick={() => onSelectFormat(format.value)}
              disabled={disabled}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                isSelected
                  ? 'border-[#C1121F] bg-[#C1121F]/10'
                  : 'border-[#2B313A] bg-[#0D0F12] hover:border-[#3B424D]',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('w-4 h-4', isSelected ? 'text-[#C1121F]' : 'text-[#6B7280]')} />
                <span className={cn('text-sm font-medium', isSelected ? 'text-[#E6E9EF]' : 'text-[#A4ACB8]')}>
                  {format.label}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">{format.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// SHORT SESSION DURATION SELECTOR
// =============================================================================

interface ShortSessionDurationSelectorProps {
  selectedDuration: 10 | 15 | 20 | 25
  onSelectDuration: (duration: 10 | 15 | 20 | 25) => void
  disabled?: boolean
}

export function ShortSessionDurationSelector({
  selectedDuration,
  onSelectDuration,
  disabled = false,
}: ShortSessionDurationSelectorProps) {
  const durations: Array<{ value: 10 | 15 | 20 | 25; label: string }> = [
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 20, label: '20 min' },
    { value: 25, label: '25 min' },
  ]
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#E6E9EF]">Duration</label>
      <div className="flex gap-2">
        {durations.map((duration) => {
          const isSelected = selectedDuration === duration.value
          
          return (
            <button
              key={duration.value}
              onClick={() => onSelectDuration(duration.value)}
              disabled={disabled}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all',
                isSelected
                  ? 'border-[#C1121F] bg-[#C1121F]/10 text-[#E6E9EF]'
                  : 'border-[#2B313A] bg-[#0D0F12] text-[#A4ACB8] hover:border-[#3B424D]',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {duration.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
