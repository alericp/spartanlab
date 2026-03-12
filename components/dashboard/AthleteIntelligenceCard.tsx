'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2, 
  Zap,
  Battery,
  Activity,
  Minus,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { AdaptiveEngineBadge, ENGINE_MESSAGES } from '@/components/shared/AdaptiveEngineBadge'
import { InsightUpgradeHint } from '@/components/premium/PremiumFeature'
import {
  getAthleteEngineSnapshot,
  type AthleteEngineSnapshot,
  type MomentumState,
  type AthleteEngineInsight,
} from '@/lib/adaptive-athlete-engine'

// =============================================================================
// MOMENTUM INDICATOR
// =============================================================================

function MomentumIndicator({ momentum, score }: { momentum: MomentumState; score: number }) {
  const config = {
    improving: { 
      icon: TrendingUp, 
      color: 'text-green-400', 
      bg: 'bg-green-400/10',
      label: 'Improving' 
    },
    stable: { 
      icon: Minus, 
      color: 'text-[#A4ACB8]', 
      bg: 'bg-[#A4ACB8]/10',
      label: 'Stable' 
    },
    plateauing: { 
      icon: Minus, 
      color: 'text-amber-400', 
      bg: 'bg-amber-400/10',
      label: 'Plateauing' 
    },
    regressing: { 
      icon: TrendingDown, 
      color: 'text-red-400', 
      bg: 'bg-red-400/10',
      label: 'Regressing' 
    },
  }
  
  const { icon: Icon, color, bg, label } = config[momentum]
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-medium ${color}`}>{label}</span>
    </div>
  )
}

// =============================================================================
// INSIGHT ROW
// =============================================================================

function InsightRow({ insight }: { insight: AthleteEngineInsight }) {
  const significanceConfig = {
    positive: { color: 'text-green-400', icon: Zap },
    neutral: { color: 'text-[#A4ACB8]', icon: Activity },
    attention: { color: 'text-amber-400', icon: Target },
    warning: { color: 'text-red-400', icon: AlertTriangle },
  }
  
  const { color, icon: Icon } = significanceConfig[insight.significance]
  
  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-[#A4ACB8]">{insight.title}</span>
          <span className={`text-sm font-medium ${color}`}>{insight.value}</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PRIMARY FOCUS CARD
// =============================================================================

function PrimaryFocusCard({ 
  label, 
  reason, 
  suggestions, 
  urgency 
}: { 
  label: string
  reason: string
  suggestions: string[]
  urgency: 'high' | 'medium' | 'low'
}) {
  const urgencyConfig = {
    high: { border: 'border-red-500/30', accent: 'bg-red-500' },
    medium: { border: 'border-amber-500/30', accent: 'bg-amber-500' },
    low: { border: 'border-[#2B313A]', accent: 'bg-[#C1121F]' },
  }
  
  const { border, accent } = urgencyConfig[urgency]
  
  return (
    <div className={`rounded-lg border ${border} bg-[#0F1115] p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${accent}`} />
        <span className="text-sm font-semibold text-[#E6E9EF]">{label}</span>
      </div>
      <p className="text-xs text-[#A4ACB8] mb-3">{reason}</p>
      <div className="space-y-1.5">
        {suggestions.slice(0, 3).map((suggestion, i) => (
          <div key={i} className="flex items-start gap-2">
            <ChevronRight className="w-3 h-3 text-[#6B7280] mt-0.5 flex-shrink-0" />
            <span className="text-xs text-[#E6E9EF]">{suggestion}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-[#2B313A]">
          <Brain className="w-6 h-6 text-[#6B7280]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#E6E9EF] mb-1">
            Athlete Intelligence
          </h3>
          <p className="text-sm text-[#A4ACB8] mb-4">
            Log workouts, skills, and strength data to unlock personalized training intelligence.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/skills">
              <Button variant="outline" size="sm" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]">
                Log Skills
              </Button>
            </Link>
            <Link href="/strength">
              <Button variant="outline" size="sm" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]">
                Log Strength
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AthleteIntelligenceCard() {
  const [snapshot, setSnapshot] = useState<AthleteEngineSnapshot | null>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setSnapshot(getAthleteEngineSnapshot())
  }, [])
  
  if (!mounted) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-6 animate-pulse">
        <div className="h-8 bg-[#2B313A] rounded w-1/3 mb-4" />
        <div className="h-24 bg-[#2B313A] rounded mb-4" />
        <div className="h-16 bg-[#2B313A] rounded" />
      </Card>
    )
  }
  
  if (!snapshot || !snapshot.hasData) {
    return <EmptyState />
  }
  
  const { state, primaryFocus, insights } = snapshot
  
  // Show top 4 most relevant insights
  const displayInsights = insights.slice(0, 4)
  
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2B313A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#C1121F]/20 to-[#C1121F]/5">
            <Brain className="w-5 h-5 text-[#C1121F]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#E6E9EF]">Athlete Intelligence</h3>
            <p className="text-xs text-[#6B7280]">Adaptive training insights</p>
          </div>
        </div>
        <MomentumIndicator momentum={state.trainingMomentum} score={state.momentumScore} />
      </div>
      
      {/* Primary Focus */}
      <div className="px-5 py-4 border-b border-[#2B313A]">
        <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-3">
          Primary Focus
        </div>
        <PrimaryFocusCard
          label={primaryFocus.focusLabel}
          reason={primaryFocus.reason}
          suggestions={primaryFocus.suggestions}
          urgency={primaryFocus.urgency}
        />
      </div>
      
      {/* Insights Grid */}
      <div className="px-5 py-4">
        <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
          Key Insights
        </div>
        <div className="divide-y divide-[#2B313A]">
          {displayInsights.map((insight, i) => (
            <InsightRow key={i} insight={insight} />
          ))}
        </div>
      </div>
      
      {/* Footer with recommendations */}
      {snapshot.recommendations.length > 0 && (
        <div className="px-5 py-3 bg-[#0F1115] border-t border-[#2B313A]">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="text-xs text-[#A4ACB8]">
              {snapshot.recommendations[0]}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

// =============================================================================
// COMPACT WIDGET VERSION
// =============================================================================

export function AthleteIntelligenceWidget() {
  const [snapshot, setSnapshot] = useState<AthleteEngineSnapshot | null>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setSnapshot(getAthleteEngineSnapshot())
  }, [])
  
  if (!mounted || !snapshot || !snapshot.hasData) {
    return null
  }
  
  const { state, primaryFocus, topInsight } = snapshot
  
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#C1121F]" />
          <span className="text-sm font-medium text-[#E6E9EF]">Training Intelligence</span>
        </div>
        <MomentumIndicator momentum={state.trainingMomentum} score={state.momentumScore} />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">Focus</span>
          <span className="text-xs font-medium text-[#E6E9EF]">{primaryFocus.focusLabel}</span>
        </div>
        {topInsight && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">{topInsight.title}</span>
            <span className={`text-xs font-medium ${
              topInsight.significance === 'positive' ? 'text-green-400' :
              topInsight.significance === 'warning' ? 'text-red-400' :
              topInsight.significance === 'attention' ? 'text-amber-400' :
              'text-[#A4ACB8]'
            }`}>{topInsight.value}</span>
          </div>
        )}
        {state.primaryConstraint && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">Limiter</span>
            <span className="text-xs font-medium text-amber-400">{state.constraintLabel}</span>
          </div>
        )}
      </div>

      {/* Engine Branding */}
      <div className="mt-4 pt-3 border-t border-[#2B313A]/50">
        <AdaptiveEngineBadge variant="minimal" message={ENGINE_MESSAGES.trainingSignals} />
      </div>

      {/* Insight Upgrade Hint */}
      <InsightUpgradeHint className="mt-3" />
    </Card>
  )
}
