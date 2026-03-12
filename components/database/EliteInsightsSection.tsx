'use client'

import { Card } from '@/components/ui/card'
import { Sparkles, TrendingUp, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import type { EliteInsightsSnapshot, EliteInsight } from '@/lib/elite-insight-engine'

interface EliteInsightsSectionProps {
  snapshot: EliteInsightsSnapshot
}

function getInsightIcon(significance: 'positive' | 'neutral' | 'attention') {
  switch (significance) {
    case 'positive':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />
    case 'attention':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />
    case 'neutral':
    default:
      return <Info className="w-4 h-4 text-[#6A6A6A]" />
  }
}

function getInsightStyle(significance: 'positive' | 'neutral' | 'attention') {
  switch (significance) {
    case 'positive':
      return 'border-l-green-400'
    case 'attention':
      return 'border-l-amber-500'
    case 'neutral':
    default:
      return 'border-l-[#6A6A6A]'
  }
}

export function EliteInsightsSection({ snapshot }: EliteInsightsSectionProps) {
  if (!snapshot.hasData) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E63946]/20 to-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Premium Insights</h2>
            <p className="text-xs text-[#6A6A6A]">Advanced analytics</p>
          </div>
        </div>
        <p className="text-sm text-[#6A6A6A]">
          More training data is needed to generate personalized insights.
        </p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E63946]/20 to-amber-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Premium Insights</h2>
          <p className="text-xs text-[#6A6A6A]">{snapshot.insights.length} active insights</p>
        </div>
      </div>
      
      {/* Primary insight highlight */}
      {snapshot.primaryInsight && (
        <Card className="bg-gradient-to-r from-[#E63946]/10 to-amber-500/5 border-[#E63946]/30 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-[#E63946] font-medium mb-1">{snapshot.primaryInsight.title}</p>
              <p className="text-lg font-semibold mb-2">{snapshot.primaryInsight.value}</p>
              <p className="text-sm text-[#A5A5A5]">{snapshot.primaryInsight.explanation}</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Other insights */}
      {snapshot.insights.filter(i => i !== snapshot.primaryInsight).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {snapshot.insights
            .filter(i => i !== snapshot.primaryInsight)
            .slice(0, 4)
            .map((insight, index) => (
              <Card 
                key={`${insight.type}-${index}`}
                className={`bg-[#2A2A2A] border-[#3A3A3A] border-l-2 p-4 ${getInsightStyle(insight.significance)}`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.significance)}
                  <div>
                    <p className="text-xs text-[#6A6A6A] mb-1">{insight.title}</p>
                    <p className="font-medium mb-1">{insight.value}</p>
                    <p className="text-xs text-[#6A6A6A]">{insight.explanation}</p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
