'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Target, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  Activity,
  Sparkles
} from 'lucide-react'
import { UnifiedPredictionCard } from './UnifiedPredictionCard'
import { 
  getAllSkillPredictions,
  LIMITER_LABELS,
  type BatchPredictionResult 
} from '@/lib/prediction'
import { ProBadge } from '@/components/premium/PremiumFeature'
import Link from 'next/link'

interface PredictionDashboardProps {
  showAllSkills?: boolean
  maxSkills?: number
}

/**
 * PredictionDashboard
 * 
 * A dashboard view that shows predictions for all active skills
 * with global insights and recommendations.
 */
export function PredictionDashboard({ 
  showAllSkills = false,
  maxSkills = 4 
}: PredictionDashboardProps) {
  // Get all predictions
  const batchResult: BatchPredictionResult = useMemo(() => {
    return getAllSkillPredictions()
  }, [])
  
  const predictions = Object.values(batchResult.predictions)
  const displayedPredictions = showAllSkills 
    ? predictions 
    : predictions.slice(0, maxSkills)
  
  // Get global limiter label
  const globalLimiterLabel = batchResult.globalInsights.primaryLimiterPattern
    ? LIMITER_LABELS[batchResult.globalInsights.primaryLimiterPattern] || null
    : null
  
  // Overall readiness label
  const getReadinessLabel = () => {
    switch (batchResult.globalInsights.overallReadiness) {
      case 'ready': return { text: 'Ready to Progress', color: 'text-green-400' }
      case 'building': return { text: 'Building Foundation', color: 'text-[#C1121F]' }
      case 'needs_work': return { text: 'Needs Work', color: 'text-orange-400' }
      default: return { text: 'Needs Data', color: 'text-[#6B7280]' }
    }
  }
  
  const readinessInfo = getReadinessLabel()
  
  return (
    <div className="space-y-6">
      {/* Global Insights Card */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C1121F]" />
            <h3 className="font-semibold text-[#E6E9EF]">Progress Predictions</h3>
            <ProBadge size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#A4ACB8]" />
            <span className={`text-sm font-medium ${readinessInfo.color}`}>
              {readinessInfo.text}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Skills Being Tracked */}
          <div className="py-3 px-4 bg-[#0F1115] rounded-lg">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Skills Tracked</p>
            <p className="text-2xl font-bold text-[#E6E9EF]">{predictions.length}</p>
          </div>
          
          {/* Global Limiter */}
          {globalLimiterLabel && (
            <div className="py-3 px-4 bg-[#C1121F]/5 border border-[#C1121F]/20 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C1121F]" />
                <p className="text-xs text-[#C1121F] uppercase tracking-wider">Common Limiter</p>
              </div>
              <p className="text-sm font-medium text-[#E6E9EF]">{globalLimiterLabel}</p>
              <p className="text-xs text-[#A4ACB8] mt-1">
                Affecting {batchResult.globalInsights.affectedSkills.length} skills
              </p>
            </div>
          )}
        </div>
        
        {/* Top Recommendation */}
        {batchResult.globalInsights.topRecommendation && (
          <div className="py-3 px-4 bg-[#0F1115] rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <p className="text-xs text-[#6B7280] uppercase tracking-wider">Top Recommendation</p>
            </div>
            <p className="text-sm text-[#E6E9EF]">
              {batchResult.globalInsights.topRecommendation}
            </p>
          </div>
        )}
      </Card>
      
      {/* Individual Skill Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayedPredictions.map((prediction) => (
          <UnifiedPredictionCard 
            key={prediction.skillId}
            prediction={prediction}
            showDetails={!showAllSkills}
          />
        ))}
      </div>
      
      {/* View All Link */}
      {!showAllSkills && predictions.length > maxSkills && (
        <div className="text-center">
          <Link href="/goals">
            <Button 
              variant="ghost" 
              className="text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#2B313A]"
            >
              View All {predictions.length} Predictions
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
      
      {/* Disclaimer */}
      <p className="text-xs text-[#6B7280] text-center">
        Timeline estimates are projections based on your training data and are not guarantees.
        Individual results vary based on consistency, recovery, and other factors.
      </p>
    </div>
  )
}
