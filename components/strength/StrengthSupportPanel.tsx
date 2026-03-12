'use client'

import { Card } from '@/components/ui/card'
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  ArrowRight,
  Scale,
  Lightbulb,
} from 'lucide-react'
import type { 
  SkillSupportAssessment, 
  PushPullBalance, 
  StrengthWeakPoint 
} from '@/lib/strength-support-rules'
import { getSupportStatusColor } from '@/lib/strength-guidance-engine'

interface StrengthSupportPanelProps {
  skillSupport: SkillSupportAssessment[]
  pushPullBalance: PushPullBalance
  weakPoint: StrengthWeakPoint
  primaryRecommendation: string
  secondaryRecommendations: string[]
}

const SupportIcon = {
  strong_support: CheckCircle2,
  adequate_support: CheckCircle2,
  borderline_support: AlertTriangle,
  likely_limiter: XCircle,
  no_data: HelpCircle,
}

export function StrengthSupportPanel({
  skillSupport,
  pushPullBalance,
  weakPoint,
  primaryRecommendation,
  secondaryRecommendations,
}: StrengthSupportPanelProps) {
  return (
    <div className="space-y-4">
      {/* Skill Support Grid */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#6A6A6A] mb-4">
          Skill Support Status
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {skillSupport.map((assessment) => {
            const Icon = SupportIcon[assessment.supportLevel]
            return (
              <div
                key={assessment.skill}
                className="bg-[#1A1A1A] rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{assessment.skillLabel}</span>
                  <Icon className={`w-4 h-4 ${getSupportStatusColor(assessment.supportLevel)}`} />
                </div>
                <p className={`text-xs ${getSupportStatusColor(assessment.supportLevel)}`}>
                  {assessment.supportLabel}
                </p>
              </div>
            )
          })}
        </div>

        {/* Explanations for limiters */}
        {skillSupport.some(s => s.supportLevel === 'likely_limiter' || s.supportLevel === 'borderline_support') && (
          <div className="mt-4 pt-3 border-t border-[#3A3A3A] space-y-2">
            {skillSupport
              .filter(s => s.supportLevel === 'likely_limiter' || s.supportLevel === 'borderline_support')
              .slice(0, 2)
              .map((assessment) => (
                <p key={assessment.skill} className="text-xs text-[#6A6A6A]">
                  <span className="text-[#A5A5A5]">{assessment.skillLabel}:</span>{' '}
                  {assessment.explanation}
                </p>
              ))}
          </div>
        )}
      </Card>

      {/* Push/Pull Balance */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#6A6A6A]">
            Push/Pull Balance
          </h3>
          <Scale className="w-4 h-4 text-[#6A6A6A]" />
        </div>

        <div className="flex items-center gap-3 mb-3">
          {/* Pull Side */}
          <div className="flex-1 text-center">
            <p className="text-xs text-[#6A6A6A] mb-1">Pull</p>
            <p className="text-sm font-medium">
              {pushPullBalance.pullTier 
                ? pushPullBalance.pullTier.charAt(0).toUpperCase() + pushPullBalance.pullTier.slice(1)
                : '—'}
            </p>
          </div>

          {/* Balance Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-1 rounded-full ${
              pushPullBalance.status === 'pull_stronger' ? 'bg-blue-400' : 'bg-[#3A3A3A]'
            }`} />
            <div className={`w-2 h-2 rounded-full ${
              pushPullBalance.status === 'balanced' ? 'bg-green-400' : 'bg-[#3A3A3A]'
            }`} />
            <div className={`w-8 h-1 rounded-full ${
              pushPullBalance.status === 'push_stronger' ? 'bg-[#E63946]' : 'bg-[#3A3A3A]'
            }`} />
          </div>

          {/* Push Side */}
          <div className="flex-1 text-center">
            <p className="text-xs text-[#6A6A6A] mb-1">Push</p>
            <p className="text-sm font-medium">
              {pushPullBalance.pushTier 
                ? pushPullBalance.pushTier.charAt(0).toUpperCase() + pushPullBalance.pushTier.slice(1)
                : '—'}
            </p>
          </div>
        </div>

        <p className="text-xs text-[#6A6A6A]">{pushPullBalance.explanation}</p>
      </Card>

      {/* Primary Insight & Recommendations */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-[#E63946]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#6A6A6A]">
            Guidance
          </h3>
        </div>

        {/* Weak Point */}
        {weakPoint.type !== 'unknown' && weakPoint.type !== 'balanced' && (
          <div className="bg-[#1A1A1A] rounded-lg p-3 mb-3">
            <p className="text-sm text-[#A5A5A5]">
              <span className="text-[#E63946] font-medium">Weak Point: </span>
              {weakPoint.message}
            </p>
          </div>
        )}

        {/* Primary Recommendation */}
        <p className="text-sm text-[#F5F5F5] mb-3">{primaryRecommendation}</p>

        {/* Secondary Recommendations */}
        {secondaryRecommendations.length > 0 && (
          <div className="space-y-1.5">
            {secondaryRecommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#A5A5A5]">
                <ArrowRight className="w-3 h-3 mt-0.5 text-[#6A6A6A]" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
