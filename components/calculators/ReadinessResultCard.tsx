'use client'

import { cn } from '@/lib/utils'
import { 
  type ReadinessResult, 
  getScoreColor, 
  getLevelBgColor, 
  getStatusColor 
} from '@/lib/readiness/skill-readiness'
import { 
  Target, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp,
  BarChart3,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ReadinessResultCardProps {
  result: ReadinessResult
  skillName: string
  progressionHref: string
  strengthStandardsHref?: string
}

export function ReadinessResultCard({
  result,
  skillName,
  progressionHref,
  strengthStandardsHref = '/calisthenics-strength-standards',
}: ReadinessResultCardProps) {
  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <div className={cn(
        "rounded-xl border p-6 text-center",
        getLevelBgColor(result.level)
      )}>
        <div className="mb-2">
          <span className={cn("text-5xl font-bold", getScoreColor(result.score))}>
            {result.score}
          </span>
          <span className="text-2xl text-[#A4ACB8]">/100</span>
        </div>
        <div className="text-xl font-semibold text-[#E6E9EF] mb-1">
          {result.label}
        </div>
        <div className="text-sm text-[#A4ACB8]">
          {skillName} Readiness
        </div>
      </div>

      {/* Limiting Factor */}
      <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-[#E6E9EF] mb-1">Primary Limiting Factor</h3>
            <p className="text-[#C1121F] font-medium">{result.limitingFactor}</p>
          </div>
        </div>
        <p className="text-sm text-[#A4ACB8] leading-relaxed pl-8">
          {result.limitingFactorExplanation}
        </p>
      </div>

      {/* Recommendation */}
      <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <TrendingUp className="w-5 h-5 text-[#C1121F] mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-[#E6E9EF] mb-1">Recommendation</h3>
          </div>
        </div>
        <p className="text-sm text-[#A4ACB8] leading-relaxed pl-8">
          {result.recommendation}
        </p>
      </div>

      {/* Next Progression */}
      <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-[#E6E9EF] mb-1">Next Training Step</h3>
            <p className="text-[#E6E9EF] font-medium">{result.nextProgression}</p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#C1121F]" />
          <h3 className="font-semibold text-[#E6E9EF]">Score Breakdown</h3>
        </div>
        <div className="space-y-3">
          {result.breakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#A4ACB8]">{item.factor}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-[#1A1F26] rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.status === 'strong' && "bg-emerald-500",
                      item.status === 'adequate' && "bg-green-500",
                      item.status === 'developing' && "bg-yellow-500",
                      item.status === 'weak' && "bg-red-500"
                    )}
                    style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                  />
                </div>
                <span className={cn("text-sm font-medium w-12 text-right", getStatusColor(item.status))}>
                  {item.score}/{item.maxScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA - Generate Program based on this assessment */}
      <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#C1121F]/5 border-[#C1121F]/20 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#C1121F]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#E6E9EF] mb-1">Build a Program for This Skill</h3>
            <p className="text-sm text-[#A4ACB8]">
              SpartanLab will generate a training program targeting your {result.limitingFactor.toLowerCase()} 
              {' '}to accelerate your {skillName.toLowerCase()} progress.
            </p>
          </div>
        </div>
        <Link href="/onboarding">
          <Button className="w-full bg-[#C1121F] hover:bg-[#A50E1A] text-white">
            Generate {skillName} Program
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <p className="text-xs text-[#6B7280] text-center mt-2">
          Free to start. Takes about 3 minutes.
        </p>
      </Card>

      {/* Secondary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={progressionHref} className="flex-1">
          <Button variant="outline" className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
            View {skillName} Progression
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Link href={strengthStandardsHref} className="flex-1">
          <Button variant="outline" className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
            Strength Standards
            <Target className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
