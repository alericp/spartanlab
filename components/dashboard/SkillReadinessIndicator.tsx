'use client'

import { Card } from '@/components/ui/card'
import { 
  Target, 
  AlertTriangle, 
  ChevronRight,
  TrendingUp,
  Zap,
  CircleCheck,
  Circle,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { UnifiedReadinessResult, WeakPoint } from '@/lib/readiness/skill-readiness'

interface SkillReadinessIndicatorProps {
  result: UnifiedReadinessResult
  compact?: boolean
  showWeakPoints?: boolean
  calculatorHref?: string
}

/**
 * Dashboard component for showing personalized skill readiness indicators.
 * Displays score, tier, and primary weak points in a compact, premium format.
 */
export function SkillReadinessIndicator({
  result,
  compact = false,
  showWeakPoints = true,
  calculatorHref,
}: SkillReadinessIndicatorProps) {
  const { skillName, score, tier, primaryWeakPoint, topWeakPoints, suggestion } = result
  
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold",
            tier.bgClass
          )}>
            {score}
          </div>
          <div>
            <p className="font-medium text-[#F5F5F5] text-sm">{skillName}</p>
            <p className={cn("text-xs", tier.colorClass)}>{tier.label}</p>
          </div>
        </div>
        {primaryWeakPoint && (
          <div className="text-right">
            <p className="text-xs text-[#A5A5A5]">Limiter</p>
            <p className="text-xs text-[#F5F5F5]">{primaryWeakPoint.name}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("p-4 border", tier.bgClass)}>
      {/* Header with Score */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[#F5F5F5]">{skillName} Readiness</h3>
          <p className={cn("text-sm", tier.colorClass)}>{tier.label}</p>
        </div>
        <div className="text-right">
          <span className={cn("text-3xl font-bold", tier.colorClass)}>{score}</span>
          <span className="text-[#A5A5A5] text-sm">/100</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#1A1A1A] rounded-full overflow-hidden mb-3">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            score >= 85 && "bg-emerald-500",
            score >= 70 && score < 85 && "bg-green-500",
            score >= 50 && score < 70 && "bg-yellow-500",
            score >= 25 && score < 50 && "bg-orange-500",
            score < 25 && "bg-red-500",
          )}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Weak Points */}
      {showWeakPoints && topWeakPoints.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-[#A5A5A5] mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Limiting Factors
          </p>
          <div className="space-y-1">
            {topWeakPoints.map((wp, i) => (
              <WeakPointItem key={i} weakPoint={wp} />
            ))}
          </div>
        </div>
      )}

      {/* Suggestion */}
      <p className="text-xs text-[#A5A5A5] leading-relaxed mb-3 line-clamp-2">
        {suggestion}
      </p>

      {/* Calculator Link */}
      {calculatorHref && (
        <Link 
          href={calculatorHref}
          className="flex items-center justify-between text-sm text-[#E63946] hover:text-[#C1121F] transition-colors"
        >
          <span>View Full Analysis</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </Card>
  )
}

function WeakPointItem({ weakPoint }: { weakPoint: WeakPoint }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          weakPoint.severity === 'critical' && "bg-red-500",
          weakPoint.severity === 'moderate' && "bg-yellow-500",
          weakPoint.severity === 'minor' && "bg-blue-500",
        )} />
        <span className="text-[#E5E5E5]">{weakPoint.name}</span>
      </div>
      <span className={cn(
        "text-xs",
        weakPoint.severity === 'critical' && "text-red-400",
        weakPoint.severity === 'moderate' && "text-yellow-400",
        weakPoint.severity === 'minor' && "text-blue-400",
      )}>
        {weakPoint.percentOfMax}%
      </span>
    </div>
  )
}

interface SkillReadinessOverviewProps {
  results: UnifiedReadinessResult[]
  title?: string
}

/**
 * Dashboard section showing readiness for multiple skills
 */
export function SkillReadinessOverview({ results, title = "Skill Readiness" }: SkillReadinessOverviewProps) {
  if (results.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#F5F5F5] flex items-center gap-2">
          <Target className="w-5 h-5 text-[#E63946]" />
          {title}
        </h2>
        <Link 
          href="/calculators/skill-readiness-score"
          className="text-sm text-[#A5A5A5] hover:text-[#E63946] transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((result) => {
          const calculatorHref = getCalculatorHref(result.skillType)
          return (
            <SkillReadinessIndicator 
              key={result.skillType}
              result={result}
              calculatorHref={calculatorHref}
            />
          )
        })}
      </div>
    </div>
  )
}

function getCalculatorHref(skillType: string): string {
  switch (skillType) {
    case 'front-lever': return '/front-lever-readiness-calculator'
    case 'planche': return '/planche-readiness-calculator'
    case 'muscle-up': return '/muscle-up-readiness-calculator'
    case 'hspu': return '/hspu-readiness-calculator'
    default: return '/calculators/skill-readiness-score'
  }
}

/**
 * Compact readiness tier display for use in coaching summaries
 */
export function ReadinessTierBadge({ 
  score, 
  label,
  size = 'sm' 
}: { 
  score: number
  label: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  const colorClasses = cn(
    "rounded-full font-medium inline-flex items-center gap-1",
    score >= 85 && "bg-emerald-500/20 text-emerald-400",
    score >= 70 && score < 85 && "bg-green-500/20 text-green-400",
    score >= 50 && score < 70 && "bg-yellow-500/20 text-yellow-400",
    score >= 25 && score < 50 && "bg-orange-500/20 text-orange-400",
    score < 25 && "bg-red-500/20 text-red-400",
  )

  return (
    <span className={cn(colorClasses, sizeClasses[size])}>
      {score >= 85 ? <CircleCheck className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
      {label}
    </span>
  )
}

/**
 * Inline readiness status for use in program/coaching summaries
 */
export function InlineReadinessStatus({
  skillName,
  score,
  tierLabel,
  primaryLimiter,
}: {
  skillName: string
  score: number
  tierLabel: string
  primaryLimiter?: string
}) {
  const colorClass = cn(
    score >= 85 && "text-emerald-400",
    score >= 70 && score < 85 && "text-green-400",
    score >= 50 && score < 70 && "text-yellow-400",
    score >= 25 && score < 50 && "text-orange-400",
    score < 25 && "text-red-400",
  )

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[#A5A5A5]">{skillName}:</span>
      <span className={cn("font-medium", colorClass)}>{score}%</span>
      <span className="text-[#6B7280]">({tierLabel})</span>
      {primaryLimiter && (
        <>
          <span className="text-[#6B7280]">-</span>
          <span className="text-[#A5A5A5]">{primaryLimiter}</span>
        </>
      )}
    </div>
  )
}
