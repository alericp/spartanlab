'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  Dumbbell, 
  Activity,
  Battery,
  Lock,
  ChevronRight,
  Zap
} from 'lucide-react'
import { InsightExplanation, generateLimiterExplanation } from '@/components/shared/InsightExplanation'
import { AdaptiveEngineBadge, ENGINE_MESSAGES } from '@/components/shared/AdaptiveEngineBadge'
import { ProBadge, InsightUpgradeHint, useIsPremium } from '@/components/premium/PremiumFeature'
import { SkillLimiterUpgradePrompt } from '@/components/upgrade/AdaptiveProgramUpgradeCard'

interface PrimaryLimiterCardProps {
  insight: {
    hasInsight: boolean
    label: string
    category: string
    focus: string[]
    explanation: string
    confidence: string
  }
  isProUnlocked?: boolean
}

// Category icons based on limiter type
function getLimiterIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'skill':
      return Target
    case 'strength':
      return Dumbbell
    case 'volume':
      return Activity
    case 'recovery':
      return Battery
    case 'balanced':
      return CheckCircle2
    default:
      return AlertTriangle
  }
}

// Category colors
function getCategoryStyles(category: string): { bg: string; text: string; border: string } {
  switch (category.toLowerCase()) {
    case 'skill':
      return { 
        bg: 'bg-[#4F6D8A]/10', 
        text: 'text-[#4F6D8A]',
        border: 'border-[#4F6D8A]/30'
      }
    case 'strength':
      return { 
        bg: 'bg-orange-500/10', 
        text: 'text-orange-400',
        border: 'border-orange-500/30'
      }
    case 'volume':
      return { 
        bg: 'bg-amber-500/10', 
        text: 'text-amber-400',
        border: 'border-amber-500/30'
      }
    case 'recovery':
      return { 
        bg: 'bg-rose-500/10', 
        text: 'text-rose-400',
        border: 'border-rose-500/30'
      }
    case 'balanced':
      return { 
        bg: 'bg-emerald-500/10', 
        text: 'text-emerald-400',
        border: 'border-emerald-500/30'
      }
    default:
      return { 
        bg: 'bg-[#2B313A]', 
        text: 'text-[#6B7280]',
        border: 'border-[#2B313A]'
      }
  }
}

// Confidence indicator
function ConfidenceIndicator({ confidence }: { confidence: string }) {
  const level = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1
  return (
    <div className="flex items-center gap-1" title={`${confidence} confidence`}>
      <span className="text-[10px] text-[#6B7280] uppercase tracking-wider mr-1">Confidence</span>
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-sm ${
              i <= level ? 'bg-[#C1121F]' : 'bg-[#2B313A]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function PrimaryLimiterCard({ insight, isProUnlocked = false }: PrimaryLimiterCardProps) {
  const Icon = getLimiterIcon(insight.category)
  const styles = getCategoryStyles(insight.category)
  const isBalanced = insight.category.toLowerCase() === 'balanced'
  
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
      {/* Main Content */}
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${styles.bg} ${styles.text}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
<div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Primary Training Limiter</p>
            <ProBadge size="sm" />
          </div>
              <h3 className="text-lg font-semibold text-[#E6E9EF]">
                {insight.label}
              </h3>
            </div>
          </div>
          
          {/* Category Badge + Confidence */}
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${styles.bg} ${styles.text} border ${styles.border}`}>
              {insight.category}
            </span>
            <ConfidenceIndicator confidence={insight.confidence} />
          </div>
        </div>

        {/* Why This Matters */}
        <div className="mb-5">
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">Why this matters</p>
          <p className="text-sm text-[#A4ACB8] leading-relaxed">
            {insight.explanation}
          </p>
        </div>

        {/* Recommended Focus */}
        {insight.focus.length > 0 && (
          <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2B313A]">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-3.5 h-3.5" />
              Recommended Focus
            </p>
            <ul className="space-y-2">
              {insight.focus.map((item, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-2.5 text-sm"
                >
                  <ChevronRight className="w-4 h-4 text-[#C1121F] shrink-0 mt-0.5" />
                  <span className="text-[#E6E9EF]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explanation Layer */}
        <InsightExplanation
          explanation={generateLimiterExplanation(
            insight.category,
            insight.confidence,
            insight.focus
          )}
          variant="bordered"
        />

        {/* Engine Branding */}
        <div className="pt-3 border-t border-[#2B313A]/50 mt-4">
          <AdaptiveEngineBadge variant="minimal" message={ENGINE_MESSAGES.limiter} />
        </div>

        {/* Pro upgrade hint - detailed explanation + exercises */}
        {!isProUnlocked && (
          <div className="mt-4 flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <Lock className="w-3.5 h-3.5 text-amber-400/70" />
            <p className="text-[10px] text-[#A4ACB8] flex-1">
              Detailed explanation and recommended exercises available in Pro
            </p>
            <Link href="/upgrade" className="text-[10px] text-amber-400 hover:text-amber-300 font-medium">
              Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Pro Upgrade Prompt - Only show if not unlocked and has a real limiter */}
      {!isProUnlocked && !isBalanced && insight.hasInsight && (
        <div className="px-5 sm:px-6 py-4 bg-[#0F1115] border-t border-[#2B313A]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#C1121F]/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#C1121F]" />
              </div>
              <p className="text-xs sm:text-sm text-[#A4ACB8]">
                Generate an optimal program to correct this limiter
              </p>
            </div>
            <Link href="/program">
              <Button 
                size="sm" 
                className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-1.5 text-xs shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unlock Adaptive Engine</span>
                <span className="sm:hidden">Unlock</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}

// Empty state when no data is available
export function PrimaryLimiterEmptyState() {
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg bg-[#0F1115] border border-[#2B313A] flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-[#6B7280]" />
        </div>
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
            Primary Training Limiter
          </p>
          <h3 className="text-lg font-semibold text-[#6B7280]">
            Awaiting Data
          </h3>
        </div>
      </div>
      
      <p className="text-sm text-[#6B7280] mb-4">
        Log workouts and skill sessions to unlock personalized constraint analysis.
      </p>
      
      <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2B313A]">
        <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">
          Required Data
        </p>
        <ul className="space-y-1.5 text-sm text-[#6B7280]">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2B313A]" />
            Strength records (weighted pulls, dips)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2B313A]" />
            Skill sessions (holds, progressions)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2B313A]" />
            Workout logs (volume, frequency)
          </li>
        </ul>
      </div>
    </Card>
  )
}

// Compact version for smaller spaces
export function PrimaryLimiterCompact({ insight }: { insight: PrimaryLimiterCardProps['insight'] }) {
  const Icon = getLimiterIcon(insight.category)
  const styles = getCategoryStyles(insight.category)
  
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${styles.bg} ${styles.text}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">
            Primary Limiter
          </p>
          <p className="text-sm font-medium text-[#E6E9EF] truncate">
            {insight.label}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${styles.bg} ${styles.text}`}>
          {insight.category}
        </span>
      </div>
    </Card>
  )
}
