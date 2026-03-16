'use client'

import { AlertTriangle, Shield, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DeloadAlertProps {
  shouldDeload: boolean
  deloadType: string
  fatigueLevel: string
  coachingMessage: string
  volumeReductionPercent: number
  recommendedProtocols: string[]
  className?: string
}

const DELOAD_TYPE_LABELS: Record<string, string> = {
  'volume_reduction': 'Volume Reduction',
  'intensity_reduction': 'Intensity Reduction',
  'frequency_reduction': 'Frequency Reduction',
  'full_deload': 'Recovery Week',
  'active_recovery': 'Active Recovery',
}

const FATIGUE_LEVEL_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  'LOW': { label: 'Low', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  'MODERATE': { label: 'Moderate', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  'HIGH': { label: 'Elevated', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  'RECOVERY_REQUIRED': { label: 'Recovery Needed', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
}

const PROTOCOL_LABELS: Record<string, string> = {
  'wrist_integrity_protocol': 'Wrist Integrity Protocol',
  'elbow_tendon_health_protocol': 'Elbow Tendon Health Protocol',
  'shoulder_stability_protocol': 'Shoulder Stability Protocol',
  'scapular_control_protocol': 'Scapular Control Protocol',
  'hip_compression_protocol': 'Hip Compression Protocol',
  'knee_stability_protocol': 'Knee Stability Protocol',
  'ankle_mobility_protocol': 'Ankle Mobility Protocol',
}

export function DeloadAlert({
  shouldDeload,
  deloadType,
  fatigueLevel,
  coachingMessage,
  volumeReductionPercent,
  recommendedProtocols,
  className,
}: DeloadAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Don't show if no deload needed
  if (!shouldDeload) {
    return null
  }
  
  const levelConfig = FATIGUE_LEVEL_CONFIG[fatigueLevel] || FATIGUE_LEVEL_CONFIG['MODERATE']
  const deloadLabel = DELOAD_TYPE_LABELS[deloadType] || 'Recovery Adjustment'
  
  return (
    <div className={cn(
      'rounded-lg border p-4',
      levelConfig.bgColor,
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 rounded-full p-1.5',
            fatigueLevel === 'RECOVERY_REQUIRED' ? 'bg-red-100' : 'bg-amber-100'
          )}>
            {fatigueLevel === 'RECOVERY_REQUIRED' ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Shield className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <div>
            <h4 className={cn('text-sm font-semibold', levelConfig.color)}>
              {deloadLabel} Recommended
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {coachingMessage}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
          {/* Volume reduction */}
          {volumeReductionPercent > 0 && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Volume reduced by {volumeReductionPercent}%
              </span>
            </div>
          )}
          
          {/* Fatigue level badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Fatigue level:</span>
            <span className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              fatigueLevel === 'RECOVERY_REQUIRED' ? 'bg-red-100 text-red-700' :
              fatigueLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
              fatigueLevel === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            )}>
              {levelConfig.label}
            </span>
          </div>
          
          {/* Recommended protocols */}
          {recommendedProtocols.length > 0 && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Joint Protocols Recommended:
              </span>
              <ul className="ml-4 list-disc text-sm text-muted-foreground">
                {recommendedProtocols.map(protocol => (
                  <li key={protocol}>
                    {PROTOCOL_LABELS[protocol] || protocol}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recovery guidance */}
          <div className="rounded-md bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">
              Recovery supports long-term progress. This adjustment helps restore training capacity 
              while preserving skill work and core strength development.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
