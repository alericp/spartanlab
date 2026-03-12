'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Lightbulb, Brain, Target, TrendingUp, Zap } from 'lucide-react'
import { getQuickCoachInsights, type QuickCoachInsight } from '@/lib/training-coach'
import { getConstraintInsight } from '@/lib/constraint-engine'

interface TrainingInsightQuoteProps {
  className?: string
}

export function TrainingInsightQuote({ className }: TrainingInsightQuoteProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [insightType, setInsightType] = useState<'limiter' | 'progress' | 'tip'>('tip')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // Try to get constraint insight first (most actionable)
      const constraintInsight = getConstraintInsight()
      
      if (constraintInsight?.hasInsight && constraintInsight.label) {
        // Format as a coach-like statement
        const limiterStatements: Record<string, string> = {
          'Pulling Strength': 'Your pulling strength is currently limiting your back lever and front lever progression.',
          'Pushing Strength': 'Building pushing strength will unlock faster progress on your planche and handstand goals.',
          'Compression': 'Compression strength is the key bottleneck for your L-sit and V-sit progression.',
          'Shoulder Stability': 'Shoulder stability work will support safer progress on your skill goals.',
          'Core Stability': 'Core strength is essential for the skill progressions you\'re working toward.',
        }
        
        const matchingInsight = Object.entries(limiterStatements).find(
          ([key]) => constraintInsight.label.includes(key)
        )
        
        if (matchingInsight) {
          setInsight(matchingInsight[1])
          setInsightType('limiter')
        } else {
          setInsight(`${constraintInsight.label} is currently your primary training limiter.`)
          setInsightType('limiter')
        }
      } else {
        // Fallback to quick coach insights
        const coachInsights = getQuickCoachInsights()
        if (coachInsights && coachInsights.length > 0) {
          setInsight(coachInsights[0].text)
          setInsightType(coachInsights[0].significance === 'positive' ? 'progress' : 'tip')
        } else {
          // Default encouraging insight
          setInsight('Consistency is the foundation of progress. Keep showing up and trust the process.')
          setInsightType('tip')
        }
      }
    } catch (error) {
      // Graceful fallback
      setInsight('Your training data is being analyzed to provide personalized insights.')
      setInsightType('tip')
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] p-4 ${className}`}>
        <div className="animate-pulse flex items-start gap-3">
          <div className="w-8 h-8 bg-[#2B313A] rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full bg-[#2B313A] rounded" />
            <div className="h-3 w-3/4 bg-[#2B313A] rounded" />
          </div>
        </div>
      </Card>
    )
  }

  if (!insight) return null

  const getIcon = () => {
    switch (insightType) {
      case 'limiter':
        return <Target className="w-4 h-4 text-amber-500" />
      case 'progress':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      default:
        return <Lightbulb className="w-4 h-4 text-[#4F6D8A]" />
    }
  }

  const getBgColor = () => {
    switch (insightType) {
      case 'limiter':
        return 'bg-amber-500/10'
      case 'progress':
        return 'bg-green-500/10'
      default:
        return 'bg-[#4F6D8A]/10'
    }
  }

  return (
    <Card className={`bg-[#1A1F26] border-[#2B313A] p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${getBgColor()} flex items-center justify-center shrink-0`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
            Training Insight
          </p>
          <p className="text-sm text-[#E6E9EF] leading-relaxed">
            {insight}
          </p>
        </div>
      </div>
    </Card>
  )
}
