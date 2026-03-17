'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  type ResistanceBandColor,
  ALL_BAND_COLORS,
  BAND_LABELS,
  BAND_SHORT_LABELS,
  BAND_COLORS,
  BAND_ASSISTANCE_LEVEL,
  getLastBandUsed,
  getRecommendedStartingBand,
  analyzeProgression,
} from '@/lib/band-progression-engine'
import { Info, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react'

// =============================================================================
// BAND SELECTOR COMPONENT
// =============================================================================

interface BandSelectorProps {
  exerciseId: string
  exerciseName: string
  value: ResistanceBandColor | null | undefined
  onChange: (band: ResistanceBandColor | null) => void
  showInsight?: boolean
  compact?: boolean
  disabled?: boolean
}

export function BandSelector({
  exerciseId,
  exerciseName,
  value,
  onChange,
  showInsight = true,
  compact = false,
  disabled = false,
}: BandSelectorProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  // Get progression analysis for insights
  const analysis = showInsight ? analyzeProgression(exerciseId, exerciseName) : null
  const lastUsed = getLastBandUsed(exerciseId)
  const recommended = getRecommendedStartingBand(exerciseId)
  
  // Determine suggestion
  const suggestedBand = analysis?.recommendedBand || lastUsed || recommended
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={value || 'none'}
          onValueChange={(v) => onChange(v === 'none' ? null : v as ResistanceBandColor)}
          disabled={disabled}
        >
          <SelectTrigger className="w-24 h-7 bg-[#2A2A2A] border-[#3A3A3A] text-xs">
            <SelectValue placeholder="Band" />
          </SelectTrigger>
          <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
            <SelectItem value="none">
              <span className="text-[#A5A5A5]">No band</span>
            </SelectItem>
            {ALL_BAND_COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', getBandDotColor(color))} />
                  <span>{BAND_SHORT_LABELS[color]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {value && (
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs',
              BAND_COLORS[value].bg,
              BAND_COLORS[value].text,
              BAND_COLORS[value].border
            )}
          >
            {BAND_SHORT_LABELS[value]}
          </Badge>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-[#A5A5A5]">Band</label>
        
        <Select
          value={value || 'none'}
          onValueChange={(v) => onChange(v === 'none' ? null : v as ResistanceBandColor)}
          disabled={disabled}
        >
          <SelectTrigger className="w-32 h-8 bg-[#2A2A2A] border-[#3A3A3A]">
            <SelectValue placeholder="Select band" />
          </SelectTrigger>
          <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
            <SelectItem value="none">
              <span className="text-[#A5A5A5]">No band (unassisted)</span>
            </SelectItem>
            {ALL_BAND_COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <span className={cn('w-3 h-3 rounded-full', getBandDotColor(color))} />
                  <span>{BAND_SHORT_LABELS[color]}</span>
                  {color === suggestedBand && (
                    <span className="text-xs text-[#6B7280]">(suggested)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {showInsight && analysis && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#6B7280] hover:text-[#A5A5A5]"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Info className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      
      {/* Progression Insight */}
      {showDetails && analysis && (
        <BandProgressionInsight analysis={analysis} />
      )}
      
      {/* Quick suggestion when no band selected */}
      {!value && suggestedBand && !showDetails && (
        <button
          onClick={() => onChange(suggestedBand)}
          className="text-xs text-[#6B7280] hover:text-[#A5A5A5] flex items-center gap-1"
        >
          <span>Suggested:</span>
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs cursor-pointer hover:opacity-80',
              BAND_COLORS[suggestedBand].bg,
              BAND_COLORS[suggestedBand].text,
              BAND_COLORS[suggestedBand].border
            )}
          >
            {BAND_SHORT_LABELS[suggestedBand]}
          </Badge>
        </button>
      )}
    </div>
  )
}

// =============================================================================
// BAND COLOR PILLS (Alternative compact UI)
// =============================================================================

interface BandColorPillsProps {
  value: ResistanceBandColor | null | undefined
  onChange: (band: ResistanceBandColor | null) => void
  showNone?: boolean
  disabled?: boolean
}

export function BandColorPills({
  value,
  onChange,
  showNone = true,
  disabled = false,
}: BandColorPillsProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {showNone && (
        <button
          onClick={() => !disabled && onChange(null)}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs transition-colors',
            value === null || value === undefined
              ? 'bg-[#3A3A3A] text-white'
              : 'bg-[#2A2A2A] text-[#6B7280] hover:bg-[#3A3A3A]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          None
        </button>
      )}
      
      {ALL_BAND_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => !disabled && onChange(color)}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs transition-colors flex items-center gap-1',
            value === color
              ? cn(BAND_COLORS[color].bg, BAND_COLORS[color].text, 'ring-1', BAND_COLORS[color].border)
              : 'bg-[#2A2A2A] text-[#6B7280] hover:bg-[#3A3A3A]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={cn('w-2 h-2 rounded-full', getBandDotColor(color))} />
          {BAND_SHORT_LABELS[color]}
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// BAND PROGRESSION INSIGHT (Expandable detail)
// =============================================================================

interface BandProgressionInsightProps {
  analysis: ReturnType<typeof analyzeProgression>
}

function BandProgressionInsight({ analysis }: BandProgressionInsightProps) {
  const statusConfig = {
    progressing: { icon: CheckCircle2, color: 'text-green-400', label: 'Progressing' },
    ready_to_reduce: { icon: TrendingDown, color: 'text-blue-400', label: 'Ready to reduce' },
    stagnating: { icon: AlertCircle, color: 'text-yellow-400', label: 'Plateau detected' },
    regressing: { icon: AlertCircle, color: 'text-red-400', label: 'Needs more assistance' },
    maintaining: { icon: CheckCircle2, color: 'text-[#A5A5A5]', label: 'Maintaining' },
    new: { icon: Info, color: 'text-[#6B7280]', label: 'New exercise' },
  }
  
  const config = statusConfig[analysis.status]
  const Icon = config.icon
  
  return (
    <div className="bg-[#1A1A1A] rounded-lg p-3 text-xs space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5', config.color)} />
        <span className={config.color}>{config.label}</span>
        <span className="text-[#6B7280]">
          ({analysis.confidence}% confidence)
        </span>
      </div>
      
      <p className="text-[#A5A5A5]">{analysis.recommendation}</p>
      
      {analysis.fatigueWarning && (
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle className="w-3 h-3" />
          <span>{analysis.fatigueReason}</span>
        </div>
      )}
      
      {/* Performance signals */}
      <div className="flex flex-wrap gap-2 pt-1">
        {analysis.signals.averageHoldTime && (
          <Badge variant="outline" className="text-xs bg-[#2A2A2A]">
            Avg hold: {Math.round(analysis.signals.averageHoldTime)}s
          </Badge>
        )}
        {analysis.signals.averageReps && (
          <Badge variant="outline" className="text-xs bg-[#2A2A2A]">
            Avg reps: {Math.round(analysis.signals.averageReps)}
          </Badge>
        )}
        {analysis.signals.recentRPE && (
          <Badge variant="outline" className="text-xs bg-[#2A2A2A]">
            RPE: {analysis.signals.recentRPE.toFixed(1)}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs bg-[#2A2A2A]">
          {analysis.signals.sessionsAtCurrentBand} sessions
        </Badge>
      </div>
    </div>
  )
}

// =============================================================================
// BAND BADGE DISPLAY (Read-only display)
// =============================================================================

interface BandBadgeProps {
  band: ResistanceBandColor | null | undefined
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function BandBadge({ band, showLabel = true, size = 'md' }: BandBadgeProps) {
  if (!band) {
    return showLabel ? (
      <span className="text-xs text-[#6B7280]">Unassisted</span>
    ) : null
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs',
        BAND_COLORS[band].bg,
        BAND_COLORS[band].text,
        BAND_COLORS[band].border
      )}
    >
      <span className={cn('rounded-full mr-1', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', getBandDotColor(band))} />
      {showLabel && BAND_SHORT_LABELS[band]}
    </Badge>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function getBandDotColor(band: ResistanceBandColor): string {
  const colors: Record<ResistanceBandColor, string> = {
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
    black: 'bg-neutral-400',
    purple: 'bg-purple-400',
    green: 'bg-green-400',
    blue: 'bg-blue-400',
  }
  return colors[band]
}
