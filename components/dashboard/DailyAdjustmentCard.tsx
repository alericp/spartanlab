'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Battery,
  BatteryLow,
  BatteryMedium,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { SessionAdjustment, WellnessState, QuickAdjustmentPreset } from '@/lib/daily-adjustment-engine'
import { QUICK_ADJUSTMENT_PRESETS } from '@/lib/daily-adjustment-engine'

interface DailyAdjustmentCardProps {
  adjustment: SessionAdjustment
  onUseAdjusted: () => void
  onKeepOriginal: () => void
  onChangeState: (wellness: WellnessState, minutes: number) => void
}

export function DailyAdjustmentCard({
  adjustment,
  onUseAdjusted,
  onKeepOriginal,
  onChangeState,
}: DailyAdjustmentCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  
  const getAdjustmentColor = () => {
    switch (adjustment.type) {
      case 'keep_as_planned':
        return 'text-green-400'
      case 'shorten_session':
      case 'reduce_volume':
        return 'text-yellow-400'
      case 'shift_emphasis':
        return 'text-blue-400'
      case 'recovery_bias':
        return 'text-orange-400'
      default:
        return 'text-[#A5A5A5]'
    }
  }
  
  const getAdjustmentIcon = () => {
    switch (adjustment.type) {
      case 'keep_as_planned':
        return <Check className="w-4 h-4" />
      case 'shorten_session':
        return <Clock className="w-4 h-4" />
      case 'reduce_volume':
        return <BatteryMedium className="w-4 h-4" />
      case 'shift_emphasis':
        return <RefreshCw className="w-4 h-4" />
      case 'recovery_bias':
        return <BatteryLow className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }
  
  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`${getAdjustmentColor()}`}>
              {getAdjustmentIcon()}
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#A5A5A5]">
              Today's Session
            </h3>
          </div>
          <p className={`font-semibold ${getAdjustmentColor()}`}>
            {adjustment.label}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPresets(!showPresets)}
          className="text-[#6A6A6A] hover:text-white"
        >
          Adjust
          {showPresets ? (
            <ChevronUp className="w-4 h-4 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1" />
          )}
        </Button>
      </div>
      
      {/* Quick Presets */}
      {showPresets && (
        <div className="mb-4 pb-4 border-b border-[#3A3A3A]">
          <p className="text-xs text-[#6A6A6A] mb-2 uppercase tracking-wider">Quick Adjust</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ADJUSTMENT_PRESETS.slice(0, 4).map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  onChangeState(preset.wellness, preset.minutes)
                  setShowPresets(false)
                }}
                className="p-2 rounded bg-[#1A1A1A] hover:bg-[#333] text-left transition-colors"
              >
                <p className="text-sm font-medium text-white">{preset.label}</p>
                <p className="text-xs text-[#6A6A6A]">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Explanation */}
      <p className="text-sm text-[#A5A5A5] mb-4">
        {adjustment.explanation}
      </p>
      
      {/* What's Preserved */}
      {adjustment.wasAdjusted && adjustment.whatToKeep.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">
            Preserved
          </p>
          <div className="flex flex-wrap gap-1.5">
            {adjustment.whatToKeep.slice(0, 4).map(exercise => (
              <span
                key={exercise}
                className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs"
              >
                {exercise}
              </span>
            ))}
            {adjustment.whatToKeep.length > 4 && (
              <span className="px-2 py-0.5 rounded bg-[#1A1A1A] text-[#6A6A6A] text-xs">
                +{adjustment.whatToKeep.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* What's Cut */}
      {adjustment.whatToCut.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">
            Removed
          </p>
          <div className="flex flex-wrap gap-1.5">
            {adjustment.whatToCut.map(exercise => (
              <span
                key={exercise}
                className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-xs"
              >
                {exercise}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Details Toggle */}
      {adjustment.whatToModify.length > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-[#6A6A6A] hover:text-white mb-4 flex items-center gap-1"
        >
          {showDetails ? 'Hide' : 'Show'} set adjustments
          {showDetails ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
      
      {showDetails && adjustment.whatToModify.length > 0 && (
        <div className="mb-4 p-3 rounded bg-[#1A1A1A]">
          <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">
            Set Adjustments
          </p>
          <ul className="space-y-1">
            {adjustment.whatToModify.map((mod, idx) => (
              <li key={idx} className="text-xs text-[#A5A5A5]">
                {mod}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Actions */}
      {adjustment.wasAdjusted && (
        <div className="flex gap-2">
          <Button
            onClick={onUseAdjusted}
            className="flex-1 bg-[#E63946] hover:bg-[#E63946]/90 text-white"
          >
            Use Adjusted
          </Button>
          <Button
            variant="outline"
            onClick={onKeepOriginal}
            className="flex-1 border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#3A3A3A] hover:text-white"
          >
            Keep Original
          </Button>
        </div>
      )}
      
      {!adjustment.wasAdjusted && (
        <Button
          onClick={onKeepOriginal}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4 mr-2" />
          Start Session
        </Button>
      )}
    </Card>
  )
}

// =============================================================================
// DELOAD STATUS CARD
// =============================================================================

interface DeloadStatusCardProps {
  status: {
    status: string
    label: string
    confidence: string
    score: number
    explanation: string
    recommendation: string
    suggestedApproach?: string[]
  }
}

export function DeloadStatusCard({ status }: DeloadStatusCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const getStatusColor = () => {
    switch (status.status) {
      case 'no_deload_needed':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'watch_recovery':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'lighten_next_session':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'deload_recommended':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-[#1A1A1A] text-[#A5A5A5] border-[#3A3A3A]'
    }
  }
  
  const getStatusIcon = () => {
    switch (status.status) {
      case 'no_deload_needed':
        return <Battery className="w-4 h-4" />
      case 'watch_recovery':
        return <BatteryMedium className="w-4 h-4" />
      case 'lighten_next_session':
        return <BatteryLow className="w-4 h-4" />
      case 'deload_recommended':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Battery className="w-4 h-4" />
    }
  }
  
  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-1">
            Recovery Status
          </p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="font-medium text-sm">{status.label}</span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-[#6A6A6A]">Confidence</p>
          <p className="text-sm font-medium text-[#A5A5A5] capitalize">{status.confidence}</p>
        </div>
      </div>
      
      <p className="text-sm text-[#A5A5A5] mb-3">
        {status.explanation}
      </p>
      
      {status.status !== 'no_deload_needed' && (
        <>
          <p className="text-sm text-white mb-3">
            {status.recommendation}
          </p>
          
          {status.suggestedApproach && status.suggestedApproach.length > 0 && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-[#E63946] hover:text-[#E63946]/80 mb-2 flex items-center gap-1"
              >
                {showDetails ? 'Hide' : 'Show'} suggested approach
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {showDetails && (
                <ul className="space-y-1.5 p-3 rounded bg-[#1A1A1A]">
                  {status.suggestedApproach.map((item, idx) => (
                    <li key={idx} className="text-xs text-[#A5A5A5] flex items-start gap-2">
                      <span className="text-[#E63946] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </Card>
  )
}

// =============================================================================
// WEEK STATUS CARD
// =============================================================================

interface WeekStatusCardProps {
  weekStatus: {
    isOnTrack: boolean
    missedCount: number
    completedCount: number
    remainingCount: number
    recommendation: string
    urgency: 'none' | 'low' | 'medium' | 'high'
  }
  onViewAdjustment: () => void
}

export function WeekStatusCard({ weekStatus, onViewAdjustment }: WeekStatusCardProps) {
  const getUrgencyColor = () => {
    switch (weekStatus.urgency) {
      case 'none':
        return 'text-green-400'
      case 'low':
        return 'text-yellow-400'
      case 'medium':
        return 'text-orange-400'
      case 'high':
        return 'text-red-400'
      default:
        return 'text-[#A5A5A5]'
    }
  }
  
  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-1">
            Week Progress
          </p>
          <p className={`font-semibold ${getUrgencyColor()}`}>
            {weekStatus.isOnTrack ? 'On Track' : `${weekStatus.missedCount} Missed`}
          </p>
        </div>
        
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">{weekStatus.completedCount}</p>
            <p className="text-xs text-[#6A6A6A]">Done</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#A5A5A5]">{weekStatus.remainingCount}</p>
            <p className="text-xs text-[#6A6A6A]">Left</p>
          </div>
          {weekStatus.missedCount > 0 && (
            <div>
              <p className="text-lg font-bold text-red-400">{weekStatus.missedCount}</p>
              <p className="text-xs text-[#6A6A6A]">Missed</p>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-sm text-[#A5A5A5] mb-3">
        {weekStatus.recommendation}
      </p>
      
      {!weekStatus.isOnTrack && (
        <Button
          onClick={onViewAdjustment}
          variant="outline"
          size="sm"
          className="w-full border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#3A3A3A] hover:text-white"
        >
          View Week Adjustment
        </Button>
      )}
    </Card>
  )
}
