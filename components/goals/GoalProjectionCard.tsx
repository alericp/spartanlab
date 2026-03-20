'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  type GoalProjection, 
  getConfidenceColor, 
  getConfidenceLabel 
} from '@/lib/goal-projection-engine'
import { Target, CheckCircle, Clock, TrendingUp, AlertCircle, Zap, ArrowRight, Lock, ChevronRight } from 'lucide-react'

interface GoalProjectionCardProps {
  projection: GoalProjection
  showFullActions?: boolean
}

export function GoalProjectionCard({ projection, showFullActions = true }: GoalProjectionCardProps) {
  const confidenceColor = getConfidenceColor(projection.confidence)
  
  // Status-based styling
  const getStatusBadge = () => {
    switch (projection.status) {
      case 'goal_reached':
        return (
          <div className="px-3 py-1.5 bg-amber-500/10 rounded-full">
            <span className="text-amber-400 text-sm font-semibold">Achieved</span>
          </div>
        )
      case 'on_track':
        return (
          <div className="px-3 py-1.5 bg-green-500/10 rounded-full">
            <span className="text-green-400 text-sm font-semibold">On Track</span>
          </div>
        )
      case 'building':
        return (
          <div className="px-3 py-1.5 bg-[#C1121F]/10 rounded-full">
            <span className="text-[#C1121F] text-sm font-semibold">Building</span>
          </div>
        )
      case 'needs_data':
        return (
          <div className="px-3 py-1.5 bg-[#6B7280]/10 rounded-full">
            <span className="text-[#6B7280] text-sm font-semibold">Needs Data</span>
          </div>
        )
    }
  }
  
  const getStrengthIcon = () => {
    switch (projection.factors.strengthSupport) {
      case 'strong': return <Zap className="w-3.5 h-3.5 text-green-400" />
      case 'moderate': return <Zap className="w-3.5 h-3.5 text-[#C1121F]" />
      case 'weak': return <Zap className="w-3.5 h-3.5 text-orange-400" />
      default: return <Zap className="w-3.5 h-3.5 text-[#6B7280]" />
    }
  }
  
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            projection.status === 'goal_reached' 
              ? 'bg-amber-500/10' 
              : 'bg-[#C1121F]/10'
          }`}>
            {projection.status === 'goal_reached' ? (
              <CheckCircle className="w-5 h-5 text-amber-400" />
            ) : (
              <Target className="w-5 h-5 text-[#C1121F]" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-[#E6E9EF] text-lg">{projection.goalName}</h3>
            <p className="text-sm text-[#A4ACB8] mt-0.5">
              {projection.currentLevelName}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>
      
      {/* Content - Active Projection */}
      {projection.status !== 'goal_reached' && projection.status !== 'needs_data' && (
        <div className="space-y-4">
          {/* Next Milestone */}
          <div className="flex items-center justify-between py-3 px-4 bg-[#0F1115] rounded-lg">
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Next Milestone</p>
              <p className="text-[#E6E9EF] font-semibold">{projection.nextLevelName}</p>
            </div>
            {projection.timeRange && (
              <div className="text-right">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Estimated</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#A4ACB8]" />
                  <span className="text-[#E6E9EF] font-semibold">{projection.timeRange.label}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Main Limiter */}
          {projection.mainLimiter && projection.mainLimiter !== 'None - On Track' && (
            <div className="py-3 px-4 bg-[#C1121F]/5 border border-[#C1121F]/20 rounded-lg">
              <p className="text-xs text-[#C1121F] uppercase tracking-wider mb-1.5 font-semibold">Main Factor</p>
              <p className="text-[#E6E9EF] font-medium">{projection.mainLimiter}</p>
              {projection.action && (
                <p className="text-sm text-[#A4ACB8] mt-1">{projection.action.reasoning}</p>
              )}
            </div>
          )}
          
          {/* Recommended Focus */}
          {showFullActions && projection.action && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Recommended Focus</p>
                <p className="text-xs text-[#A4ACB8]">{projection.action.primary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {projection.action.exercises.map((exercise, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 bg-[#0F1115] border border-[#2B313A] rounded-md text-sm text-[#E6E9EF]"
                  >
                    {exercise}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Factors Row */}
          <div className="flex items-center justify-between text-sm pt-2">
            <div className="flex items-center gap-4">
              {/* Strength Support */}
              <div className="flex items-center gap-1.5">
                {getStrengthIcon()}
                <span className="text-[#A4ACB8] capitalize">
                  {projection.factors.strengthSupport === 'unknown' ? 'Strength ?' : `${projection.factors.strengthSupport} strength`}
                </span>
              </div>
              
              {/* Consistency */}
              <div className="flex items-center gap-1.5">
                <TrendingUp className={`w-3.5 h-3.5 ${
                  projection.factors.trainingConsistency === 'high' ? 'text-green-400' :
                  projection.factors.trainingConsistency === 'moderate' ? 'text-[#C1121F]' :
                  projection.factors.trainingConsistency === 'low' ? 'text-orange-400' :
                  'text-[#6B7280]'
                }`} />
                <span className="text-[#A4ACB8] capitalize">
                  {projection.factors.trainingConsistency === 'unknown' ? 'Consistency ?' : `${projection.factors.trainingConsistency} consistency`}
                </span>
              </div>
            </div>
            
            {/* Confidence */}
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: confidenceColor }}
              />
              <span className="text-[#6B7280]">
                {getConfidenceLabel(projection.confidence)} confidence
              </span>
            </div>
          </div>
          
          {/* Generate Program CTA - routes to canonical /program */}
          {showFullActions && (
            <div className="pt-4 border-t border-[#2B313A]">
              <Link href="/program">
                <Button 
                  className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2"
                >
                  Open Your Program
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-xs text-[#6B7280] text-center mt-2">
                Your program is tailored to your goals and readiness
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Needs Data State */}
      {projection.status === 'needs_data' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 py-3 px-4 bg-[#0F1115] rounded-lg">
            <AlertCircle className="w-5 h-5 text-[#6B7280] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[#A4ACB8]">
                {projection.explanation}
              </p>
            </div>
          </div>
          
          {showFullActions && projection.action && (
            <div className="space-y-2">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">To get started</p>
              <div className="flex flex-wrap gap-2">
                {projection.action.exercises.map((item, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 bg-[#0F1115] border border-[#2B313A] rounded-md text-sm text-[#A4ACB8]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Goal Reached State */}
      {projection.status === 'goal_reached' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 py-3 px-4 bg-amber-500/5 rounded-lg border border-amber-500/10">
            <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[#A4ACB8]">
                {projection.explanation}
              </p>
            </div>
          </div>
          
          {showFullActions && projection.action && (
            <div className="space-y-3">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Continue mastering</p>
              <div className="flex flex-wrap gap-2">
                {projection.action.exercises.map((exercise, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 bg-[#0F1115] border border-amber-500/20 rounded-md text-sm text-[#E6E9EF]"
                  >
                    {exercise}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// Compact version for dashboard use
export function GoalProjectionCardCompact({ projection }: { projection: GoalProjection }) {
  return (
    <Link href="/goals" className="block">
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/30 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              projection.status === 'goal_reached' 
                ? 'bg-amber-500/10' 
                : 'bg-[#C1121F]/10'
            }`}>
              {projection.status === 'goal_reached' ? (
                <CheckCircle className="w-4 h-4 text-amber-400" />
              ) : (
                <Target className="w-4 h-4 text-[#C1121F]" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-[#E6E9EF] text-sm">{projection.goalName}</h4>
              <p className="text-xs text-[#6B7280]">
                {projection.currentLevelName} {projection.nextLevelName ? `→ ${projection.nextLevelName}` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {projection.timeRange && (
              <span className="text-sm text-[#A4ACB8] font-medium">
                {projection.timeRange.label}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          </div>
        </div>
        
        {projection.mainLimiter && projection.mainLimiter !== 'None - On Track' && (
          <div className="mt-3 pt-3 border-t border-[#2B313A]">
            <p className="text-xs text-[#6B7280]">
              <span className="text-[#C1121F] font-medium">Focus:</span> {projection.action?.primary}
            </p>
          </div>
        )}
      </Card>
    </Link>
  )
}
