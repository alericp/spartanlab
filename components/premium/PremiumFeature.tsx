'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Lock, 
  Crown, 
  Brain, 
  Activity, 
  TrendingUp, 
  Zap,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  hasProAccess, 
  hasFeatureAccess, 
  type FeatureId, 
  FEATURES,
  getCurrentTier,
  isInTrial,
  getTrialDaysRemaining,
  isOwnerAccount,
} from '@/lib/feature-access'
import { useEntitlement } from '@/hooks/useEntitlement'
import { TRIAL } from '@/lib/billing/pricing'

// =============================================================================
// PREMIUM FEATURE DEFINITIONS (for UI display)
// =============================================================================

export type PremiumFeatureId = 
  | 'adaptive-engine'
  | 'fatigue-intelligence'
  | 'daily-adjustments'
  | 'progress-forecast'
  | 'advanced-insights'
  | 'deload-detection'
  | 'constraint-analysis'

// Map UI feature IDs to system feature IDs
export const FEATURE_ID_MAP: Record<PremiumFeatureId, FeatureId> = {
  'adaptive-engine': 'adaptive_adjustments',
  'fatigue-intelligence': 'fatigue_intelligence',
  'daily-adjustments': 'daily_adjustments',
  'progress-forecast': 'progress_projections',
  'advanced-insights': 'training_analytics_advanced',
  'deload-detection': 'deload_detection',
  'constraint-analysis': 'constraint_analysis',
}

export interface PremiumFeatureInfo {
  id: PremiumFeatureId
  title: string
  shortTitle: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  benefits: string[]
}

export const PREMIUM_FEATURES: Record<PremiumFeatureId, PremiumFeatureInfo> = {
  'adaptive-engine': {
    id: 'adaptive-engine',
    title: 'Adaptive Training Engine',
    shortTitle: 'Adaptive Engine',
    description: 'Automatically adjusts your workouts based on fatigue, training volume, and recovery signals.',
    icon: Brain,
    benefits: [
      'Real-time workout adjustments',
      'Fatigue-aware programming',
      'Recovery optimization',
    ],
  },
  'fatigue-intelligence': {
    id: 'fatigue-intelligence',
    title: 'Fatigue Intelligence',
    shortTitle: 'Fatigue AI',
    description: 'Advanced fatigue detection and recovery recommendations based on your training patterns.',
    icon: Activity,
    benefits: [
      'Fatigue score tracking',
      'Recovery predictions',
      'Overtraining alerts',
    ],
  },
  'daily-adjustments': {
    id: 'daily-adjustments',
    title: 'Daily Training Adjustments',
    shortTitle: 'Daily Adjustments',
    description: 'Get personalized daily workout modifications based on your current readiness state.',
    icon: Zap,
    benefits: [
      'Auto-adjusted volume',
      'Exercise substitutions',
      'Rest day recommendations',
    ],
  },
  'progress-forecast': {
    id: 'progress-forecast',
    title: 'Progress Forecast',
    shortTitle: 'Forecasts',
    description: 'See estimated timelines for your next skill milestone based on current progress rate.',
    icon: TrendingUp,
    benefits: [
      'Milestone projections',
      'Timeline estimates',
      'Progress tracking',
    ],
  },
  'advanced-insights': {
    id: 'advanced-insights',
    title: 'Advanced Training Insights',
    shortTitle: 'Insights',
    description: 'Deep analysis of your training patterns, limiters, and optimization opportunities.',
    icon: Sparkles,
    benefits: [
      'Training limiter detection',
      'Volume optimization',
      'Movement balance analysis',
    ],
  },
  'deload-detection': {
    id: 'deload-detection',
    title: 'Deload Detection',
    shortTitle: 'Deload AI',
    description: 'Automatically detects when you need a deload week based on accumulated fatigue.',
    icon: Activity,
    benefits: [
      'Auto deload scheduling',
      'Fatigue accumulation tracking',
      'Recovery week planning',
    ],
  },
  'constraint-analysis': {
    id: 'constraint-analysis',
    title: 'Constraint Analysis',
    shortTitle: 'Limiters',
    description: 'Identifies what is currently limiting your progress and how to address it.',
    icon: Brain,
    benefits: [
      'Primary limiter detection',
      'Focus recommendations',
      'Weakness analysis',
    ],
  },
}

// =============================================================================
// HOOKS (using canonical useEntitlement system)
// [PHASE 14C TASK 2] Migrated to use useEntitlement as single source of truth
// =============================================================================

/**
 * Hook to check if user has premium access
 * [PHASE 14C] Now uses canonical useEntitlement hook
 */
export function useIsPremium(): boolean {
  const entitlement = useEntitlement()
  return entitlement.hasProAccess
}

/**
 * Hook to check if current user is the platform owner
 * [PHASE 14C] Now uses canonical useEntitlement hook
 */
export function useIsOwner(): boolean {
  const entitlement = useEntitlement()
  return entitlement.isOwner
}

/**
 * Hook to get current subscription info
 * [PHASE 14C] Now uses canonical useEntitlement hook
 */
export function useSubscriptionInfo(): {
  isPro: boolean
  tier: 'free' | 'pro'
  isTrialing: boolean
  trialDaysRemaining: number
  isOwner: boolean
} {
  const entitlement = useEntitlement()
  
  return {
    isPro: entitlement.hasProAccess,
    tier: entitlement.plan,
    isTrialing: entitlement.isTrialing,
    trialDaysRemaining: 0, // Would need API enhancement for actual days
    isOwner: entitlement.isOwner,
  }
}

/**
 * Hook to check if a specific feature is available
 */
export function useFeatureAccess(featureId: PremiumFeatureId): {
  isAvailable: boolean
  isPremium: boolean
  feature: PremiumFeatureInfo
} {
  const isPremium = useIsPremium()
  const systemFeatureId = FEATURE_ID_MAP[featureId]
  const isAvailable = typeof window !== 'undefined' ? hasFeatureAccess(systemFeatureId) : false
  
  return {
    isAvailable,
    isPremium,
    feature: PREMIUM_FEATURES[featureId],
  }
}

/**
 * Hook to check system feature access directly
 */
export function useSystemFeatureAccess(featureId: FeatureId): boolean {
  if (typeof window === 'undefined') return false
  return hasFeatureAccess(featureId)
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Pro Badge - Small badge indicating premium feature
 */
interface ProBadgeProps {
  size?: 'sm' | 'md'
  className?: string
}

export function ProBadge({ size = 'sm', className }: ProBadgeProps) {
  return (
    <Badge 
      className={cn(
        "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30",
        "hover:from-amber-500/30 hover:to-amber-600/30",
        size === 'sm' && "text-[10px] px-1.5 py-0.5",
        size === 'md' && "text-xs px-2 py-0.5",
        className
      )}
    >
      <Crown className={cn("mr-1", size === 'sm' ? "w-2.5 h-2.5" : "w-3 h-3")} />
      Pro
    </Badge>
  )
}

/**
 * Locked Feature Icon - Lock overlay for feature icons
 */
interface LockedFeatureIconProps {
  icon: React.ComponentType<{ className?: string }>
  className?: string
}

export function LockedFeatureIcon({ icon: Icon, className }: LockedFeatureIconProps) {
  return (
    <div className={cn("relative", className)}>
      <Icon className="w-full h-full opacity-40" />
      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1A1F26] border border-[#3A4553] flex items-center justify-center">
        <Lock className="w-2.5 h-2.5 text-amber-400" />
      </div>
    </div>
  )
}

/**
 * Premium Feature Lock Card - Full locked feature placeholder
 */
interface PremiumFeatureLockCardProps {
  featureId: PremiumFeatureId
  variant?: 'full' | 'compact' | 'inline'
  className?: string
  showBenefits?: boolean
}

export function PremiumFeatureLockCard({ 
  featureId, 
  variant = 'full',
  className,
  showBenefits = true,
}: PremiumFeatureLockCardProps) {
  const feature = PREMIUM_FEATURES[featureId]
  const Icon = feature.icon

  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-[#1A1F26]/50 border border-[#2B313A]/50",
        className
      )}>
        <LockedFeatureIcon icon={Icon} className="w-5 h-5 text-[#6B7280]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#A4ACB8]">{feature.shortTitle}</span>
            <ProBadge size="sm" />
          </div>
          <p className="text-xs text-[#6B7280] truncate">{feature.description}</p>
        </div>
        <Link href="/upgrade">
          <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
            Unlock
          </Button>
        </Link>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={cn(
        "bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A]/70 overflow-hidden",
        className
      )}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2B313A]/50 border border-[#3A4553]/30 flex items-center justify-center">
              <LockedFeatureIcon icon={Icon} className="w-5 h-5 text-[#6B7280]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-[#E6E9EF]">{feature.shortTitle}</h3>
                <ProBadge size="sm" />
              </div>
              <p className="text-xs text-[#6B7280] line-clamp-2">{feature.description}</p>
            </div>
          </div>
          <Link href="/upgrade" className="block mt-3">
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-400 border border-amber-500/30"
            >
<Crown className="w-3.5 h-3.5 mr-1.5" />
  {TRIAL.ctaTextShort}
  </Button>
  </Link>
  </div>
      </Card>
    )
  }

  // Full variant
  return (
    <Card className={cn(
      "relative bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A]/70 overflow-hidden",
      className
    )}>
      {/* Subtle locked pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 11px)',
        }}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2B313A]/80 to-[#1A1F26] border border-[#3A4553]/40 flex items-center justify-center">
            <LockedFeatureIcon icon={Icon} className="w-6 h-6 text-[#6B7280]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-[#E6E9EF]">{feature.title}</h3>
              <ProBadge size="md" />
            </div>
            <p className="text-sm text-[#A4ACB8]">{feature.description}</p>
          </div>
        </div>

        {/* Benefits */}
        {showBenefits && (
          <div className="mb-4 p-3 rounded-lg bg-[#0F1115]/50 border border-[#2B313A]/50">
            <p className="text-[10px] uppercase tracking-wider text-[#6B7280] mb-2">What you unlock</p>
            <ul className="space-y-1.5">
              {feature.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-[#A4ACB8]">
                  <ChevronRight className="w-3 h-3 text-amber-400/70" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
<Link href="/upgrade">
  <Button
  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold"
  >
  <Crown className="w-4 h-4 mr-2" />
  {TRIAL.ctaText}
  </Button>
  </Link>
  <p className="text-xs text-center text-[#6B7280] mt-2">{TRIAL.explanationShort}</p>
  </div>
  </Card>
  )
}

/**
 * Premium Upgrade Banner - Dashboard promotion card
 */
interface PremiumUpgradeBannerProps {
  className?: string
}

export function PremiumUpgradeBanner({ className }: PremiumUpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const isPremium = useIsPremium()

  // Don't show to Pro users or if dismissed
  if (isPremium || dismissed) return null

  return (
    <Card className={cn(
      "relative bg-gradient-to-r from-[#1A1F26] via-[#1A1F26] to-amber-500/5 border-amber-500/20 overflow-hidden",
      className
    )}>
      {/* Subtle glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
              <Brain className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-[#E6E9EF]">Get Deeper Performance Insights</h3>
              <ProBadge size="sm" />
            </div>
            <p className="text-sm text-[#A4ACB8] leading-relaxed">
              See what is actually limiting your progress. Unlock adaptive program adjustments and detailed fatigue intelligence.
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/upgrade">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold whitespace-nowrap">
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Upgrade
              </Button>
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-[#6B7280] hover:text-[#A4ACB8] px-2"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Premium Helper Text - Subtle upgrade prompt
 */
interface PremiumHelperTextProps {
  message: string
  className?: string
}

export function PremiumHelperText({ message, className }: PremiumHelperTextProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20",
      className
    )}>
      <Lock className="w-3.5 h-3.5 text-amber-400/70 flex-shrink-0" />
      <p className="text-xs text-[#A4ACB8] flex-1">{message}</p>
      <Link href="/upgrade">
        <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 text-xs px-2 h-7">
          Upgrade
        </Button>
      </Link>
    </div>
  )
}

/**
 * Feature Gate - Conditionally renders content based on premium status
 */
interface FeatureGateProps {
  featureId: PremiumFeatureId
  children: React.ReactNode
  fallback?: React.ReactNode
  lockVariant?: 'full' | 'compact' | 'inline'
}

export function FeatureGate({ 
  featureId, 
  children, 
  fallback,
  lockVariant = 'full',
}: FeatureGateProps) {
  const isPremium = useIsPremium()

  if (isPremium) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return <PremiumFeatureLockCard featureId={featureId} variant={lockVariant} />
}

// =============================================================================
// UPGRADE TRIGGER PANELS
// =============================================================================

/**
 * UpgradeTriggerPanel - Contextual upgrade prompt that appears after high-value interactions
 */
interface UpgradeTriggerPanelProps {
  title: string
  description: string
  variant?: 'default' | 'success' | 'insight'
  className?: string
  onDismiss?: () => void
  showDismiss?: boolean
}

export function UpgradeTriggerPanel({
  title,
  description,
  variant = 'default',
  className,
  onDismiss,
  showDismiss = true,
}: UpgradeTriggerPanelProps) {
  const isPremium = useIsPremium()
  
  // Don't show to premium users
  if (isPremium) return null

  const variantStyles = {
    default: 'from-[#1A1F26] to-[#0F1115] border-[#2B313A]',
    success: 'from-[#1A1F26] to-[#0F1115] border-emerald-500/20',
    insight: 'from-[#C1121F]/5 to-[#1A1F26] border-[#C1121F]/20',
  }

  const iconStyles = {
    default: 'from-[#C1121F]/20 to-[#C1121F]/5 text-[#C1121F]',
    success: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
    insight: 'from-amber-500/20 to-amber-500/5 text-amber-400',
  }

  return (
    <div className={cn(
      "relative rounded-xl bg-gradient-to-br border overflow-hidden",
      variantStyles[variant],
      className
    )}>
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C1121F]/5 to-transparent pointer-events-none" />
      
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
            iconStyles[variant]
          )}>
            <Sparkles className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#E6E9EF] mb-1">{title}</h4>
            <p className="text-xs text-[#A4ACB8] leading-relaxed mb-3">{description}</p>
            
            <div className="flex items-center gap-3">
<Link href="/upgrade">
  <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A] text-white text-xs h-8 px-4">
  <Crown className="w-3.5 h-3.5 mr-1.5" />
  {TRIAL.ctaTextShort}
  </Button>
  </Link>
              {showDismiss && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
                >
                  Maybe later
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * PostActionUpgradePrompt - Compact inline prompt after completing an action
 */
interface PostActionUpgradePromptProps {
  message: string
  benefit: string
  className?: string
}

export function PostActionUpgradePrompt({ message, benefit, className }: PostActionUpgradePromptProps) {
  const isPremium = useIsPremium()
  
  if (isPremium) return null

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg bg-[#1A1F26]/50 border border-[#2B313A]/70",
      className
    )}>
      <div className="flex items-center gap-2 flex-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[#E6E9EF] font-medium">{message}</p>
          <p className="text-[10px] text-[#6B7280]">{benefit}</p>
        </div>
      </div>
      <Link href="/upgrade" className="flex-shrink-0">
        <Button size="sm" variant="outline" className="border-[#C1121F]/30 text-[#C1121F] hover:bg-[#C1121F]/10 text-xs h-7 px-3">
          Learn More
        </Button>
      </Link>
    </div>
  )
}

/**
 * InsightUpgradeHint - Subtle hint when viewing insights
 */
interface InsightUpgradeHintProps {
  className?: string
}

export function InsightUpgradeHint({ className }: InsightUpgradeHintProps) {
  const isPremium = useIsPremium()
  
  if (isPremium) return null

  return (
    <div className={cn(
      "flex items-center gap-2 py-2 px-3 rounded-lg bg-[#C1121F]/5 border border-[#C1121F]/10",
      className
    )}>
      <Brain className="w-3.5 h-3.5 text-[#C1121F]/70" />
      <p className="text-[10px] text-[#A4ACB8] flex-1">
        Unlock deeper training intelligence with SpartanLab Pro
      </p>
      <Link href="/upgrade" className="text-[10px] text-[#C1121F] hover:text-[#E63946] font-medium">
        Upgrade
      </Link>
    </div>
  )
}

// =============================================================================
// PRESET TRIGGER MESSAGES
// =============================================================================

export const UPGRADE_TRIGGERS = {
  programGenerated: {
    title: 'Let your program evolve with you',
    description: 'Unlock adaptive training intelligence that adjusts your program based on your performance and recovery.',
  },
  workoutCompleted: {
    title: 'Want deeper performance insights?',
    description: 'See what limited your session and get adaptive adjustments for tomorrow.',
  },
  toolAnalysis: {
    title: 'Unlock progression intelligence',
    description: 'See what is actually limiting your progress and when you will reach your next milestone.',
  },
  insightViewed: {
    title: 'Get the full picture',
    description: 'Unlock advanced fatigue intelligence, progress forecasts, and adaptive program adjustments.',
  },
} as const

// =============================================================================
// PRESET MESSAGES
// =============================================================================

export const PREMIUM_MESSAGES = {
  dailyAdjustment: 'Upgrade to unlock automatic daily workout adjustments based on fatigue signals.',
  progressForecast: 'Upgrade to see estimated timelines for your next skill milestone.',
  fatigueIntelligence: 'Upgrade to access advanced fatigue detection and recovery recommendations.',
  adaptiveEngine: 'Adaptive programs that adjust automatically are available with SpartanLab Pro.',
  constraintAnalysis: 'Upgrade to identify what is currently limiting your progress.',
  deloadDetection: 'Upgrade to get automatic deload recommendations based on accumulated fatigue.',
} as const

// =============================================================================
// SYSTEM FEATURE GATE (uses feature-access.ts directly)
// =============================================================================

interface SystemFeatureGateProps {
  featureId: FeatureId
  children: React.ReactNode
  fallback?: React.ReactNode
  fallbackMessage?: string
  showLockCard?: boolean
  lockCardVariant?: 'full' | 'compact' | 'inline'
}

/**
 * SystemFeatureGate - Gates content based on feature-access system
 * Use this for gating any feature by its system FeatureId
 */
export function SystemFeatureGate({ 
  featureId, 
  children, 
  fallback,
  fallbackMessage,
  showLockCard = false,
  lockCardVariant = 'compact',
}: SystemFeatureGateProps) {
  const hasAccess = useSystemFeatureAccess(featureId)
  const feature = FEATURES[featureId]

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showLockCard) {
    // Find matching premium feature ID for the lock card
    const premiumFeatureId = Object.entries(FEATURE_ID_MAP).find(
      ([_, sysId]) => sysId === featureId
    )?.[0] as PremiumFeatureId | undefined

    if (premiumFeatureId) {
      return <PremiumFeatureLockCard featureId={premiumFeatureId} variant={lockCardVariant} />
    }
  }

  // Default minimal fallback
  return (
    <div className="p-4 rounded-lg bg-[#1A1F26]/50 border border-[#2B313A]/50">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-[#A4ACB8]">
          {fallbackMessage || feature?.name || 'This feature'} requires Pro
        </span>
        <Link href="/upgrade">
          <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 text-xs ml-auto">
            Upgrade
          </Button>
        </Link>
      </div>
    </div>
  )
}

// =============================================================================
// TIER INDICATOR COMPONENTS
// =============================================================================

/**
 * SubscriptionTierBadge - Shows current subscription tier
 */
interface SubscriptionTierBadgeProps {
  className?: string
}

export function SubscriptionTierBadge({ className }: SubscriptionTierBadgeProps) {
  const { isPro, isTrialing, trialDaysRemaining } = useSubscriptionInfo()
  
  if (isPro) {
    return (
      <Badge 
        className={cn(
          "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30",
          className
        )}
      >
        <Crown className="w-3 h-3 mr-1" />
        {isTrialing ? `Pro Trial (${trialDaysRemaining}d)` : 'Pro'}
      </Badge>
    )
  }
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "text-[#6B7280] border-[#3A4553]",
        className
      )}
    >
      Free
    </Badge>
  )
}

/**
 * ProOnlyIndicator - Small indicator for Pro-only features
 */
interface ProOnlyIndicatorProps {
  className?: string
  showText?: boolean
}

export function ProOnlyIndicator({ className, showText = true }: ProOnlyIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Crown className="w-3 h-3 text-amber-400" />
      {showText && <span className="text-[10px] text-amber-400 font-medium">Pro</span>}
    </span>
  )
}
