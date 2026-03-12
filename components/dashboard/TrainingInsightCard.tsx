'use client'

import { Card } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, Info, Target, ChevronRight } from 'lucide-react'

interface TrainingInsightCardProps {
  insight: {
    hasInsight: boolean
    label: string
    category: string
    focus: string[]
    explanation: string
    confidence: string
  }
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'skill':
      return <Target className="w-4 h-4" />
    case 'strength':
      return <AlertTriangle className="w-4 h-4" />
    case 'volume':
      return <Info className="w-4 h-4" />
    case 'recovery':
      return <AlertTriangle className="w-4 h-4" />
    case 'balanced':
      return <CheckCircle2 className="w-4 h-4" />
    default:
      return <Info className="w-4 h-4" />
  }
}

function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'skill':
      return 'text-[#4F6D8A] bg-[#4F6D8A]/10'
    case 'strength':
      return 'text-orange-400 bg-orange-400/10'
    case 'volume':
      return 'text-amber-400 bg-amber-400/10'
    case 'recovery':
      return 'text-red-400 bg-red-400/10'
    case 'balanced':
      return 'text-green-400 bg-green-400/10'
    default:
      return 'text-[#6B7280] bg-[#6B7280]/10'
  }
}

function getConfidenceDots(confidence: string) {
  const dots = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1
  return (
    <div className="flex items-center gap-0.5" title={`${confidence} confidence`}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= dots ? 'bg-[#C1121F]' : 'bg-[#2B313A]'
          }`}
        />
      ))}
    </div>
  )
}

export function TrainingInsightCard({ insight }: TrainingInsightCardProps) {
  const categoryColor = getCategoryColor(insight.category)
  
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColor}`}>
            {getCategoryIcon(insight.category)}
          </div>
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-0.5">
              Training Insight
            </p>
            <h3 className="font-semibold text-[#E6E9EF]">
              {insight.label}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${categoryColor}`}>
            {insight.category}
          </span>
          {getConfidenceDots(insight.confidence)}
        </div>
      </div>
      
      {/* Focus Items */}
      {insight.focus.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">
            Focus This Week
          </p>
          <ul className="space-y-1.5">
            {insight.focus.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                <ChevronRight className="w-4 h-4 text-[#C1121F] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Explanation */}
      <div className="pt-3 border-t border-[#2B313A]">
        <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1.5">
          Why
        </p>
        <p className="text-sm text-[#A4ACB8] leading-relaxed">
          {insight.explanation}
        </p>
      </div>
    </Card>
  )
}

// Empty state version
export function TrainingInsightEmptyState() {
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-[#0F1115] border border-[#2B313A] flex items-center justify-center">
          <Target className="w-4 h-4 text-[#6B7280]" />
        </div>
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-0.5">
            Training Insight
          </p>
          <h3 className="font-semibold text-[#6B7280]">
            Awaiting Data
          </h3>
        </div>
      </div>
      <p className="text-sm text-[#6B7280]">
        Log strength records, skill sessions, and workouts to unlock personalized constraint analysis.
      </p>
    </Card>
  )
}
