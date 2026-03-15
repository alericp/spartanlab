'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  type SpartanStrengthResult,
  getScoreColor,
  getLevelColor,
  getLevelBgColor,
  generateShareableText,
} from '@/lib/strength/spartan-strength-score'
import {
  Trophy,
  Target,
  Dumbbell,
  Zap,
  TrendingUp,
  Copy,
  Check,
  Share2,
  ChevronRight,
  Flame,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SpartanScoreCardProps {
  result: SpartanStrengthResult
  showShareButton?: boolean
  showLinks?: boolean
  compact?: boolean
}

export function SpartanScoreCard({
  result,
  showShareButton = true,
  showLinks = true,
  compact = false,
}: SpartanScoreCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyResults = async () => {
    const text = generateShareableText(result)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const categoryIcons = {
    pullStrength: Dumbbell,
    pushStrength: Target,
    coreStrength: Flame,
    skillReadiness: Zap,
  }

  const categoryLabels = {
    pullStrength: 'Pull Strength',
    pushStrength: 'Push Strength',
    coreStrength: 'Core Strength',
    skillReadiness: 'Skill Readiness',
  }

  return (
    <div className="space-y-4">
      {/* Main Score Display */}
      <div
        className={cn(
          'rounded-xl border p-6',
          getLevelBgColor(result.overallLevel),
          compact ? 'p-4' : 'p-6'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className={cn('w-6 h-6', getLevelColor(result.overallLevel))} />
            <span className="text-sm font-medium text-[#A4ACB8]">Spartan Strength Score</span>
          </div>
          {showShareButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyResults}
              className="text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#1A1F26]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </>
              )}
            </Button>
          )}
        </div>

        {/* Score Circle */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center relative">
            {/* Circular Progress Background */}
            <svg className={cn('transform -rotate-90', compact ? 'w-28 h-28' : 'w-36 h-36')}>
              <circle
                cx="50%"
                cy="50%"
                r={compact ? '48' : '64'}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-[#1A1F26]"
              />
              <circle
                cx="50%"
                cy="50%"
                r={compact ? '48' : '64'}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={compact ? '301.6' : '402.1'}
                strokeDashoffset={
                  compact
                    ? 301.6 - (result.overallScore / 100) * 301.6
                    : 402.1 - (result.overallScore / 100) * 402.1
                }
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-1000',
                  result.overallScore >= 85 && 'text-purple-500',
                  result.overallScore >= 60 && result.overallScore < 85 && 'text-emerald-500',
                  result.overallScore >= 35 && result.overallScore < 60 && 'text-yellow-500',
                  result.overallScore < 35 && 'text-orange-500'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('font-bold', getScoreColor(result.overallScore), compact ? 'text-3xl' : 'text-4xl')}>
                {result.overallScore}
              </span>
              <span className="text-xs text-[#A4ACB8]">/ 100</span>
            </div>
          </div>
        </div>

        {/* Level Label */}
        <div className="text-center">
          <span className={cn('text-lg font-semibold', getLevelColor(result.overallLevel))}>
            {result.overallLabel}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#E6E9EF] mb-3">Category Breakdown</h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(result.categories) as Array<keyof typeof result.categories>).map((key) => {
            const category = result.categories[key]
            const Icon = categoryIcons[key]
            return (
              <div key={key} className="bg-[#1A1F26] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-[#C1121F]" />
                  <span className="text-xs text-[#A4ACB8]">{categoryLabels[key]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn('font-semibold text-sm', getLevelColor(category.level))}>
                    {category.label}
                  </span>
                  <span className="text-xs text-[#6B7280]">{category.score}</span>
                </div>
                {/* Mini progress bar */}
                <div className="mt-2 h-1 bg-[#0F1115] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      category.level === 'elite' && 'bg-purple-500',
                      category.level === 'advanced' && 'bg-emerald-500',
                      category.level === 'intermediate' && 'bg-yellow-500',
                      category.level === 'beginner' && 'bg-orange-500'
                    )}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Skill Pathway */}
      <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-[#C1121F]" />
          <span className="text-sm font-semibold text-[#E6E9EF]">Your Skill Pathway</span>
        </div>
        <p className="text-[#E6E9EF] font-medium">{result.skillPathway}</p>
        <p className="text-sm text-[#A4ACB8] mt-1">{result.recommendedFocus}</p>
      </div>

      {/* Copy Button (Mobile-friendly) */}
      {showShareButton && (
        <Button
          variant="outline"
          onClick={handleCopyResults}
          className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-emerald-400" />
              Results Copied to Clipboard
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Results to Share
            </>
          )}
        </Button>
      )}

      {/* Action Links */}
      {showLinks && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          <Link href="/calisthenics-program-builder">
            <Button className="w-full bg-[#C1121F] hover:bg-[#A50E1A] text-white">
              Build Training Program
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link href="/calisthenics-strength-standards">
            <Button variant="outline" className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
              View Strength Standards
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPACT INLINE VERSION
// =============================================================================

interface SpartanScoreInlineProps {
  score: number
  label: string
  skillPathway: string
}

export function SpartanScoreInline({ score, label, skillPathway }: SpartanScoreInlineProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#0F1115] border border-[#2B313A] rounded-xl">
      <div className="flex items-center gap-3">
        <Trophy className={cn('w-8 h-8', getScoreColor(score))} />
        <div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
            <span className="text-sm text-[#6B7280]">/ 100</span>
          </div>
          <span className="text-xs text-[#A4ACB8]">Spartan Score</span>
        </div>
      </div>
      <div className="border-l border-[#2B313A] pl-4 ml-2">
        <div className="text-sm font-medium text-[#E6E9EF]">{label}</div>
        <div className="text-xs text-[#A4ACB8]">{skillPathway}</div>
      </div>
    </div>
  )
}
