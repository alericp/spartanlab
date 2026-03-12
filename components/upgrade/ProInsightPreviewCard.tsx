'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Lock,
  Brain,
  Activity,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasProAccess } from '@/lib/feature-access'

// =============================================================================
// PRO INSIGHT PREVIEW CONFIGURATIONS
// =============================================================================

export type ProInsightType = 
  | 'fatigue-intelligence'
  | 'progress-forecast'
  | 'adaptive-adjustments'
  | 'skill-insights'
  | 'session-analysis'
  | 'band-progression'

interface InsightConfig {
  title: string
  subtitle: string
  icon: LucideIcon
  previewItems: string[]
  ctaText: string
  valueProp: string
}

const INSIGHT_CONFIGS: Record<ProInsightType, InsightConfig> = {
  'fatigue-intelligence': {
    title: 'Fatigue Intelligence',
    subtitle: 'See what your body is telling you',
    icon: Activity,
    previewItems: [
      'Deep fatigue trend analysis',
      'Recovery predictions',
      'Deload timing recommendations',
    ],
    ctaText: 'Unlock Fatigue AI',
    valueProp: 'Know exactly when to push and when to recover',
  },
  'progress-forecast': {
    title: 'Progress Forecast',
    subtitle: 'See your training trajectory',
    icon: TrendingUp,
    previewItems: [
      'Skill milestone timelines',
      'Strength progression rates',
      'Goal achievement estimates',
    ],
    ctaText: 'Unlock Forecasting',
    valueProp: 'Understand when you will reach your next milestone',
  },
  'adaptive-adjustments': {
    title: 'Adaptive Training',
    subtitle: 'Intelligent workout adjustments',
    icon: Brain,
    previewItems: [
      'Auto-adjusted workout intensity',
      'Recovery-based exercise selection',
      'Volume optimization',
    ],
    ctaText: 'Unlock Adaptive Engine',
    valueProp: 'Let your program evolve with your performance',
  },
  'skill-insights': {
    title: 'Skill Progression Insights',
    subtitle: 'Detailed skill analysis',
    icon: Target,
    previewItems: [
      'Weak point identification',
      'Progression pathway mapping',
      'Readiness scoring per skill',
    ],
    ctaText: 'Unlock Skill Intelligence',
    valueProp: 'See what is actually limiting your skill progress',
  },
  'session-analysis': {
    title: 'Deeper Session Analysis',
    subtitle: 'Performance breakdown',
    icon: Zap,
    previewItems: [
      'Set-by-set performance trends',
      'Fatigue impact analysis',
      'Optimal training time detection',
    ],
    ctaText: 'Unlock Session Analysis',
    valueProp: 'Understand what made this session effective',
  },
  'band-progression': {
    title: 'Band Progression Intelligence',
    subtitle: 'Smart assistance tracking',
    icon: Activity,
    previewItems: [
      'When to reduce band assistance',
      'Progress velocity tracking',
      'Optimal progression timing',
    ],
    ctaText: 'Unlock Band AI',
    valueProp: 'Know exactly when to progress to a lighter band',
  },
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface ProInsightPreviewCardProps {
  insightType: ProInsightType
  variant?: 'full' | 'compact' | 'inline'
  className?: string
  showOnlyForFree?: boolean
}

export function ProInsightPreviewCard({
  insightType,
  variant = 'compact',
  className,
  showOnlyForFree = true,
}: ProInsightPreviewCardProps) {
  // Don't show if user has Pro and showOnlyForFree is true
  if (showOnlyForFree && hasProAccess()) return null

  const config = INSIGHT_CONFIGS[insightType]
  const Icon = config.icon

  // Inline variant - minimal
  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20",
        className
      )}>
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#E6E9EF]">{config.title}</p>
          <p className="text-xs text-[#6B7280] truncate">{config.valueProp}</p>
        </div>
        <Link href="/upgrade">
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-amber-400 hover:text-amber-300 text-xs shrink-0"
          >
            Upgrade
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={cn(
        "bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-amber-500/20 p-4 relative overflow-hidden",
        className
      )}>
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
                <Crown className="w-2.5 h-2.5 mr-1" />
                Pro
              </Badge>
            </div>
          </div>
          
          <p className="text-sm font-semibold text-[#E6E9EF] mb-1">{config.title}</p>
          <p className="text-xs text-[#6B7280] mb-3">{config.valueProp}</p>
          
          <Link href="/upgrade">
            <Button 
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-400 border border-amber-500/30 text-xs"
            >
              <Crown className="w-3.5 h-3.5 mr-1.5" />
              {config.ctaText}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // Full variant with preview items
  return (
    <Card className={cn(
      "bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-amber-500/20 p-5 relative overflow-hidden",
      className
    )}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#E6E9EF]">{config.title}</p>
              <p className="text-xs text-[#6B7280]">{config.subtitle}</p>
            </div>
          </div>
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
            <Crown className="w-2.5 h-2.5 mr-1" />
            Pro
          </Badge>
        </div>
        
        {/* Locked preview items */}
        <div className="space-y-2 mb-4">
          {config.previewItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0F1115]/50 border border-[#2B313A]/50">
              <Lock className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
              <span className="text-xs text-[#6B7280]">{item}</span>
            </div>
          ))}
        </div>
        
        {/* Value proposition */}
        <p className="text-xs text-[#A4ACB8] mb-4 italic">
          &ldquo;{config.valueProp}&rdquo;
        </p>
        
        <Link href="/upgrade">
          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm"
          >
            <Crown className="w-4 h-4 mr-2" />
            {config.ctaText}
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// =============================================================================
// VALUE HIGHLIGHT CARD
// =============================================================================

interface ValueHighlightCardProps {
  title: string
  description: string
  icon: LucideIcon
  className?: string
}

export function ValueHighlightCard({
  title,
  description,
  icon: Icon,
  className,
}: ValueHighlightCardProps) {
  return (
    <Card className={cn(
      "bg-[#1A1F26]/50 border-[#2B313A]/50 p-4",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#C1121F]/10 border border-[#C1121F]/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#C1121F]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E6E9EF] mb-1">{title}</p>
          <p className="text-xs text-[#A4ACB8] leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// CONTEXTUAL UPGRADE PROMPT
// =============================================================================

interface ContextualUpgradePromptProps {
  context: 'post-workout' | 'analytics' | 'skill-view' | 'program-view'
  className?: string
  onDismiss?: () => void
}

const CONTEXT_MESSAGES: Record<string, { title: string; description: string }> = {
  'post-workout': {
    title: 'Want deeper performance insights?',
    description: 'SpartanLab Pro reveals what limited your session and how to optimize your next workout.',
  },
  'analytics': {
    title: 'Unlock advanced training analytics',
    description: 'See deeper patterns in your training data with Pro-level performance analysis.',
  },
  'skill-view': {
    title: 'Get detailed skill progression insights',
    description: 'Pro members see personalized skill timelines and targeted weak point analysis.',
  },
  'program-view': {
    title: 'Let your program adapt to you',
    description: 'Pro enables automatic workout adjustments based on your fatigue and performance.',
  },
}

export function ContextualUpgradePrompt({
  context,
  className,
  onDismiss,
}: ContextualUpgradePromptProps) {
  if (hasProAccess()) return null

  const message = CONTEXT_MESSAGES[context]

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#1A1F26] to-amber-500/5 border border-amber-500/20",
      className
    )}>
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#E6E9EF]">{message.title}</p>
          <p className="text-xs text-[#A4ACB8]">{message.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/upgrade">
          <Button 
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs"
          >
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Upgrade
          </Button>
        </Link>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-[#6B7280] hover:text-[#A4ACB8]"
          >
            Later
          </button>
        )}
      </div>
    </div>
  )
}
