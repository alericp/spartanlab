'use client'

import { TrendingUp, AlertTriangle, Zap, ChevronRight } from 'lucide-react'
import { type ProgressionInsight } from '@/lib/adaptive-progression-engine'

interface ProgressionInsightsProps {
  insights: ProgressionInsight[]
  compact?: boolean
}

export function ProgressionInsights({ insights, compact = false }: ProgressionInsightsProps) {
  if (insights.length === 0) {
    return null
  }
  
  const getIcon = (type: ProgressionInsight['type']) => {
    switch (type) {
      case 'ready_to_progress':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'plateau_detected':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />
      case 'good_progress':
        return <Zap className="w-4 h-4 text-blue-400" />
      case 'needs_recovery':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <Zap className="w-4 h-4 text-[#A4ACB8]" />
    }
  }
  
  const getBorderColor = (type: ProgressionInsight['type']) => {
    switch (type) {
      case 'ready_to_progress':
        return 'border-green-500/30'
      case 'plateau_detected':
        return 'border-amber-500/30'
      case 'good_progress':
        return 'border-blue-500/30'
      case 'needs_recovery':
        return 'border-red-500/30'
      default:
        return 'border-[#2B313A]'
    }
  }
  
  if (compact) {
    // Single line compact view for dashboard header
    const primary = insights[0]
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getBorderColor(primary.type)} bg-[#0F1115]/50`}>
        {getIcon(primary.type)}
        <span className="text-sm text-[#E6E9EF]">{primary.message}</span>
        {insights.length > 1 && (
          <span className="text-xs text-[#6B7280]">+{insights.length - 1} more</span>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#A4ACB8] flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Progression Status
      </h3>
      
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getBorderColor(insight.type)} bg-[#0F1115]/50`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{getIcon(insight.type)}</div>
                <div>
                  <p className="text-sm font-medium text-[#E6E9EF]">{insight.title}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{insight.message}</p>
                  {insight.exercises.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {insight.exercises.map((ex, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded bg-[#1A1D23] text-[#A4ACB8]"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#4F6D8A] flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
