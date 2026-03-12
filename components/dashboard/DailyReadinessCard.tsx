'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import {
  getDailyReadiness,
  getReadinessTierLabel,
  getRecommendationLabel,
  getReadinessTierColor,
  getRecommendationColor,
  type DailyReadinessResult,
} from '@/lib/daily-readiness'
import { Activity, ChevronDown, ChevronUp, TrendingUp, Zap, Battery, Crown } from 'lucide-react'
import { hasProAccess } from '@/lib/feature-access'
import Link from 'next/link'

interface DailyReadinessCardProps {
  className?: string
  compact?: boolean
}

export function DailyReadinessCard({ className, compact = false }: DailyReadinessCardProps) {
  const [readiness, setReadiness] = useState<DailyReadinessResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Calculate readiness on mount
    try {
      const result = getDailyReadiness()
      setReadiness(result)
    } catch (error) {
      console.error('Failed to calculate readiness:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-[#2B313A] rounded" />
          <div className="h-12 w-20 bg-[#2B313A] rounded" />
        </div>
      </Card>
    )
  }

  if (!readiness) {
    return null
  }

  const tierColor = getReadinessTierColor(readiness.readinessTier)
  const recColor = getRecommendationColor(readiness.recommendation)

  // Compact version for mobile or secondary placement
  if (compact) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
            >
              {readiness.readinessScore}
            </div>
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wider">Readiness</div>
              <div className="text-sm font-semibold text-[#E6E9EF]">
                {getReadinessTierLabel(readiness.readinessTier)}
              </div>
            </div>
          </div>
          <div 
            className="px-3 py-1.5 rounded text-xs font-semibold"
            style={{ backgroundColor: `${recColor}20`, color: recColor }}
          >
            {getRecommendationLabel(readiness.recommendation)}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[#C1121F]" />
        <h3 className="text-lg font-semibold text-[#E6E9EF]">Daily Readiness</h3>
        {readiness.confidence === 'low' && (
          <span className="text-xs text-[#6B7280] ml-auto">Limited data</span>
        )}
      </div>

      {/* Main Score Display */}
      <div className="flex items-start gap-5 mb-4">
        {/* Score Circle */}
        <div className="relative">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center border-4"
            style={{ 
              borderColor: tierColor,
              backgroundColor: `${tierColor}10`,
            }}
          >
            <span 
              className="text-3xl font-bold"
              style={{ color: tierColor }}
            >
              {readiness.readinessScore}
            </span>
          </div>
        </div>

        {/* Tier and Recommendation */}
        <div className="flex-1 pt-1">
          <div 
            className="text-lg font-bold mb-1"
            style={{ color: tierColor }}
          >
            {getReadinessTierLabel(readiness.readinessTier)}
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-[#6B7280]">Recommendation:</span>
            <span 
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ backgroundColor: `${recColor}20`, color: recColor }}
            >
              {getRecommendationLabel(readiness.recommendation)}
            </span>
          </div>

          {/* Explanation */}
          <p className="text-sm text-[#A4ACB8] leading-relaxed">
            {readiness.explanation}
          </p>
        </div>
      </div>

      {/* Contributing Signals Toggle */}
      {readiness.contributingSignals.length > 0 && (
        <div className="border-t border-[#2B313A] pt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors w-full"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>View signals ({readiness.contributingSignals.length})</span>
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2">
              {/* Signal Tags */}
              <div className="flex flex-wrap gap-2">
                {readiness.contributingSignals.map((signal, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-[#0F1115] border border-[#2B313A] text-[#A4ACB8]"
                  >
                    <SignalIcon signal={signal} />
                    {signal}
                  </span>
                ))}
              </div>

              {/* Raw Signals (for transparency) */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                {readiness.signals.fatigueScore !== null && (
                  <div className="bg-[#0F1115] rounded p-2 border border-[#2B313A]">
                    <span className="text-[#6B7280]">Fatigue:</span>{' '}
                    <span className="text-[#E6E9EF]">{readiness.signals.fatigueScore}</span>
                  </div>
                )}
                {readiness.signals.momentumScore !== null && (
                  <div className="bg-[#0F1115] rounded p-2 border border-[#2B313A]">
                    <span className="text-[#6B7280]">Momentum:</span>{' '}
                    <span className="text-[#E6E9EF]">{readiness.signals.momentumScore}</span>
                  </div>
                )}
                <div className="bg-[#0F1115] rounded p-2 border border-[#2B313A]">
                  <span className="text-[#6B7280]">Last 7d:</span>{' '}
                  <span className="text-[#E6E9EF]">{readiness.signals.workoutsLast7Days} workouts</span>
                </div>
                {readiness.signals.daysSinceLastWorkout !== null && (
                  <div className="bg-[#0F1115] rounded p-2 border border-[#2B313A]">
                    <span className="text-[#6B7280]">Last workout:</span>{' '}
                    <span className="text-[#E6E9EF]">
                      {readiness.signals.daysSinceLastWorkout === 0 
                        ? 'Today' 
                        : `${readiness.signals.daysSinceLastWorkout}d ago`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pro Deep Insights Teaser */}
      {showDetails && !hasProAccess() && readiness.confidence !== 'low' && (
        <Link href="/upgrade" className="block mt-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors cursor-pointer">
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs text-[#A4ACB8]">
              <span className="text-amber-400 font-medium">Pro:</span> Get adaptive daily adjustments based on your readiness
            </span>
          </div>
        </Link>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-[#4B5563] mt-4 leading-relaxed">
        Training readiness estimate based on logged workouts. Not a medical assessment.
      </p>
    </Card>
  )
}

// Helper component for signal icons
function SignalIcon({ signal }: { signal: string }) {
  if (signal.includes('recover') || signal.includes('fatigue')) {
    return <Battery className="w-3 h-3" />
  }
  if (signal.includes('consistency') || signal.includes('momentum')) {
    return <TrendingUp className="w-3 h-3" />
  }
  if (signal.includes('effort') || signal.includes('demanding')) {
    return <Zap className="w-3 h-3" />
  }
  return <Activity className="w-3 h-3" />
}

// Hook for using readiness data
export function useReadiness() {
  const [readiness, setReadiness] = useState<DailyReadinessResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const result = getDailyReadiness()
      setReadiness(result)
    } catch (error) {
      console.error('Failed to calculate readiness:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { readiness, isLoading }
}
