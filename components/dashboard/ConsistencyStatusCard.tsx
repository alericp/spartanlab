'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, TrendingUp, TrendingDown, Minus, Calendar, Flame } from 'lucide-react'
import {
  getConsistencyStatus,
  type ConsistencyStatus,
  type ConsistencyState,
} from '@/lib/consistency-momentum-engine'

// State colors matching SpartanLab theme
const STATE_STYLES: Record<ConsistencyState, { bg: string; text: string; icon: string }> = {
  strong: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400' },
  building: { bg: 'bg-[#C1121F]/10', text: 'text-[#C1121F]', icon: 'text-[#C1121F]' },
  rebuilding: { bg: 'bg-[#4F6D8A]/10', text: 'text-[#4F6D8A]', icon: 'text-[#4F6D8A]' },
  starting: { bg: 'bg-[#2B313A]/20', text: 'text-[#A4ACB8]', icon: 'text-[#A4ACB8]' },
}

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="w-4 h-4 text-emerald-400" />
    case 'declining':
      return <TrendingDown className="w-4 h-4 text-amber-400" />
    default:
      return <Minus className="w-4 h-4 text-[#A4ACB8]" />
  }
}

export function ConsistencyStatusCard() {
  const [status, setStatus] = useState<ConsistencyStatus | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const consistencyStatus = getConsistencyStatus()
      setStatus(consistencyStatus)
    } catch {
      // Silent fail
    }
  }, [])

  if (!mounted || !status) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A]">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 w-24 bg-[#2B313A] rounded mb-2" />
            <div className="h-6 w-32 bg-[#2B313A] rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const styles = STATE_STYLES[status.state]
  const { metrics, comebackConfig } = status

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A]">
      <CardContent className="p-4">
        {/* Header with badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${styles.icon}`} />
            <span className="text-xs font-medium text-[#A4ACB8] uppercase tracking-wide">
              Consistency
            </span>
          </div>
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${styles.bg} ${styles.text}`}>
            {status.shortLabel}
          </div>
        </div>

        {/* Coach message */}
        <p className="text-sm text-[#E6E9EF] mb-3">
          {status.coachMessage}
        </p>

        {/* Comeback notice */}
        {comebackConfig.isComeback && (
          <div className="bg-[#C1121F]/10 border border-[#C1121F]/20 rounded-lg p-3 mb-3">
            <p className="text-xs text-[#C1121F] font-medium">
              Comeback Workout
            </p>
            <p className="text-xs text-[#A4ACB8] mt-1">
              Intensity reduced to {Math.round(comebackConfig.intensityMultiplier * 100)}%
            </p>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-[#A4ACB8]" />
            </div>
            <div className="text-lg font-semibold text-[#E6E9EF]">
              {metrics.sessionsThisWeek}/{metrics.targetSessionsPerWeek}
            </div>
            <div className="text-[10px] text-[#A4ACB8]">This Week</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-3 h-3 text-[#A4ACB8]" />
            </div>
            <div className="text-lg font-semibold text-[#E6E9EF]">
              {metrics.currentStreak}
            </div>
            <div className="text-[10px] text-[#A4ACB8]">Day Streak</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendIcon trend={metrics.momentumTrend} />
            </div>
            <div className="text-lg font-semibold text-[#E6E9EF]">
              {metrics.averageWeeklyFrequency}
            </div>
            <div className="text-[10px] text-[#A4ACB8]">Avg/Week</div>
          </div>
        </div>

        {/* Encouragement */}
        <div className="mt-3 pt-3 border-t border-[#2B313A]">
          <p className="text-xs text-[#A4ACB8] italic">
            {status.encouragement}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact badge for inline display
 */
export function ConsistencyBadge() {
  const [status, setStatus] = useState<ConsistencyStatus | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      setStatus(getConsistencyStatus())
    } catch {
      // Silent fail
    }
  }, [])

  if (!mounted || !status) return null

  const styles = STATE_STYLES[status.state]

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${styles.bg}`}>
      <Activity className={`w-3 h-3 ${styles.icon}`} />
      <span className={`text-xs font-medium ${styles.text}`}>
        {status.shortLabel}
      </span>
    </div>
  )
}
