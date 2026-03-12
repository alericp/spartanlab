'use client'

import { Card } from '@/components/ui/card'
import { type TrainingInsight } from '@/lib/training-insights'
import { Lightbulb, AlertTriangle, Info, TrendingUp } from 'lucide-react'

interface TrainingInsightsCardProps {
  insights: TrainingInsight[]
}

function getInsightIcon(type: TrainingInsight['type']) {
  switch (type) {
    case 'volume':
      return TrendingUp
    case 'balance':
      return AlertTriangle
    case 'consistency':
      return Info
    case 'recovery':
      return Lightbulb
    case 'info':
    default:
      return Info
  }
}

function getInsightStyle(priority: TrainingInsight['priority']) {
  switch (priority) {
    case 'high':
      return 'border-l-[#E63946] bg-red-500/5'
    case 'medium':
      return 'border-l-[#EAB308] bg-yellow-500/5'
    case 'low':
    default:
      return 'border-l-[#4ECDC4] bg-teal-500/5'
  }
}

export function TrainingInsightsCard({ insights }: TrainingInsightsCardProps) {
  if (insights.length === 0) {
    return (
      <Card className="bg-[#1E1E1E] border-[#3A3A3A] p-5">
        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Training Insights</h3>
        <div className="text-center py-6 text-[#A5A5A5]">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Log more workouts to generate insights.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1E1E1E] border-[#3A3A3A] p-5">
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Training Insights</h3>
      
      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = getInsightIcon(insight.type)
          return (
            <div
              key={insight.id}
              className={`p-3 rounded-lg border-l-4 ${getInsightStyle(insight.priority)}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 text-[#A5A5A5] shrink-0" />
                <p className="text-sm text-[#F5F5F5]">{insight.message}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
