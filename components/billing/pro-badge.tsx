'use client'

import { Badge } from '@/components/ui/badge'
import { Crown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEntitlement, type Entitlement } from '@/hooks/useEntitlement'
import { isSimulationActive } from '@/lib/billing/subscription-simulation'

// =============================================================================
// PRO BADGE COMPONENT
// =============================================================================

export type ProBadgeVariant = 'pro' | 'trial' | 'auto'
export type ProBadgeSize = 'xs' | 'sm' | 'md'

interface ProBadgeProps {
  /** Force a specific variant, or 'auto' to detect from subscription */
  variant?: ProBadgeVariant
  /** Size of the badge */
  size?: ProBadgeSize
  /** Show crown icon */
  showIcon?: boolean
  /** Additional className */
  className?: string
}

// =============================================================================
// LOCAL ENTITLEMENT → UI STATUS PROJECTION
// =============================================================================
// [PRE-AB6 BUILD GREEN GATE / CANONICAL ENTITLEMENT MIGRATION]
// The legacy `useSubscriptionStatus` hook was removed from
// `lib/billing/subscription-status`. The canonical client-side
// entitlement source is now `useEntitlement` (hooks/useEntitlement.ts),
// which exposes `isTrialing`, `hasProAccess`, `isOwner`, etc., but
// does NOT expose `trialDaysRemaining` or `planLabel`. This local
// projection preserves the legacy hook's visible UI surface
// (status / isTrial / trialDaysRemaining / planLabel / isOwner)
// without reintroducing localStorage truth or stacking a new
// useSubscriptionStatus hook on top of the canonical system.
// `trialDaysRemaining` defaults to 0 per the migration spec since
// the canonical entitlement API does not expose exact day counts.
type LegacyDisplayStatus = 'free' | 'trial' | 'pro'

interface LegacyDisplayShape {
  status: LegacyDisplayStatus
  isTrial: boolean
  trialDaysRemaining: number
  planLabel: string
  isOwner: boolean
}

function projectEntitlementToLegacyDisplay(entitlement: Entitlement): LegacyDisplayShape {
  const status: LegacyDisplayStatus = entitlement.isTrialing
    ? 'trial'
    : entitlement.hasProAccess
      ? 'pro'
      : 'free'
  const planLabel = status === 'pro' ? 'Pro' : status === 'trial' ? 'Trial' : 'Free'
  return {
    status,
    isTrial: entitlement.isTrialing,
    trialDaysRemaining: 0,
    planLabel,
    isOwner: entitlement.isOwner,
  }
}

/**
 * Pro Badge - Premium identity indicator
 * 
 * Usage:
 * - <ProBadge /> - Auto-detects subscription status
 * - <ProBadge variant="pro" /> - Force Pro badge
 * - <ProBadge variant="trial" /> - Force Trial badge
 */
export function ProBadge({ 
  variant = 'auto', 
  size = 'sm',
  showIcon = true,
  className,
}: ProBadgeProps) {
  const entitlement = useEntitlement()
  const { status, isTrial, trialDaysRemaining } = projectEntitlementToLegacyDisplay(entitlement)
  
  // Determine which variant to show
  let displayVariant: 'pro' | 'trial'
  if (variant === 'auto') {
    displayVariant = isTrial ? 'trial' : 'pro'
  } else {
    displayVariant = variant
  }
  
  // Don't render for free users when auto-detecting
  if (variant === 'auto' && status === 'free') {
    return null
  }
  
  const isPro = displayVariant === 'pro'
  const isTr = displayVariant === 'trial'
  
  // Size classes
  const sizeClasses = {
    xs: 'text-[9px] px-1 py-0 gap-0.5',
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1',
  }
  
  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  }
  
  // Trial badge text
  const trialText = trialDaysRemaining > 0 ? `Trial (${trialDaysRemaining}d)` : 'Trial'
  
  return (
    <Badge 
      className={cn(
        'font-medium border shrink-0 inline-flex items-center',
        sizeClasses[size],
        // Pro variant styling
        isPro && 'bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-400 border-amber-500/30',
        isPro && 'hover:from-amber-500/25 hover:to-amber-600/20',
        // Trial variant styling - slightly different to indicate temporary
        isTr && 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-400/90 border-amber-500/25',
        isTr && 'hover:from-amber-500/20 hover:to-orange-500/15',
        className
      )}
    >
      {showIcon && (
        isPro 
          ? <Crown className={iconSizes[size]} />
          : <Sparkles className={iconSizes[size]} />
      )}
      {isPro ? 'Pro' : trialText}
    </Badge>
  )
}

// =============================================================================
// PLAN STATUS BADGE
// =============================================================================

interface PlanStatusBadgeProps {
  /** Additional className */
  className?: string
  /** Size */
  size?: ProBadgeSize
}

/**
 * Plan Status Badge - Shows current plan status
 * Free users see nothing, Trial/Pro users see their badge
 * Owner in simulation mode shows simulated state badge
 */
export function PlanStatusBadge({ className, size = 'sm' }: PlanStatusBadgeProps) {
  const entitlement = useEntitlement()
  const { status, isOwner } = projectEntitlementToLegacyDisplay(entitlement)
  const simActive = isOwner && isSimulationActive()
  
  // Owner in simulation mode - show simulated state badge (not Owner badge)
  if (isOwner && simActive) {
    if (status === 'free') return null
    return <ProBadge variant="auto" size={size} className={className} />
  }
  
  // Owner without simulation - show Owner badge only if actually Pro
  if (isOwner && !simActive) {
    if (status === 'free') return null
    if (status === 'pro' || status === 'trial') {
      return <ProBadge variant="auto" size={size} className={className} />
    }
    return null
  }
  
  // Free users don't show a badge
  if (status === 'free') {
    return null
  }
  
  // Pro/Trial users show the ProBadge
  return <ProBadge variant="auto" size={size} className={className} />
}

// =============================================================================
// SUBSCRIPTION STATUS INDICATOR
// =============================================================================

interface SubscriptionStatusIndicatorProps {
  /** Show in compact mode */
  compact?: boolean
  /** Additional className */
  className?: string
}

/**
 * Subscription Status Indicator - For settings/billing pages
 * Shows full subscription status with appropriate styling
 * Owner in simulation shows simulated state
 */
export function SubscriptionStatusIndicator({ 
  compact = false, 
  className 
}: SubscriptionStatusIndicatorProps) {
  const entitlement = useEntitlement()
  const { status, planLabel, trialDaysRemaining, isOwner } = projectEntitlementToLegacyDisplay(entitlement)
  const simActive = isOwner && isSimulationActive()
  
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-sm text-[#A4ACB8]">Plan:</span>
        <span className="text-sm font-medium text-[#E6E9EF]">{planLabel}</span>
        {status === 'trial' && trialDaysRemaining > 0 && (
          <span className="text-xs text-[#6B7280]">
            ({trialDaysRemaining} days left)
          </span>
        )}
      </div>
    )
  }
  
  // Full indicator with styling based on effective status
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg',
      status === 'pro' && 'bg-amber-500/10 border border-amber-500/20',
      status === 'trial' && 'bg-amber-500/5 border border-amber-500/15',
      status === 'free' && 'bg-[#1A1F26] border border-[#2B313A]',
      className
    )}>
      {/* Icon */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center',
        status === 'pro' && 'bg-amber-500/20',
        status === 'trial' && 'bg-amber-500/15',
        status === 'free' && 'bg-[#2A2A2A]',
      )}>
        <Crown className={cn(
          'w-4 h-4',
          status === 'pro' && 'text-amber-400',
          status === 'trial' && 'text-amber-400/80',
          status === 'free' && 'text-[#6B7280]',
        )} />
      </div>
      
      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#E6E9EF]">{planLabel}</span>
          {status !== 'free' && (
            <Badge 
              variant="outline" 
              className={cn(
                'text-[9px] px-1.5 py-0',
                status === 'pro' && 'text-amber-400 border-amber-500/30',
                status === 'trial' && 'text-amber-400/80 border-amber-500/20',
              )}
            >
              {status === 'pro' ? 'Active' : 'Trial'}
            </Badge>
          )}
          {simActive && (
            <Badge 
              variant="outline" 
              className="text-[9px] px-1.5 py-0 text-zinc-400 border-zinc-600"
            >
              Sim
            </Badge>
          )}
        </div>
        {status === 'trial' && trialDaysRemaining > 0 && (
          <span className="text-xs text-[#6B7280]">
            Trial ends in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}
          </span>
        )}
        {status === 'free' && !simActive && (
          <span className="text-xs text-[#6B7280]">
            Upgrade to unlock Pro features
          </span>
        )}
        {status === 'free' && simActive && (
          <span className="text-xs text-zinc-500">
            Simulating Free tier
          </span>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

// [PRE-AB6 BUILD GREEN GATE / CANONICAL ENTITLEMENT MIGRATION]
// Re-export the canonical entitlement hook so any external consumer
// previously importing the (now-removed) `useSubscriptionStatus`
// from this module can migrate to the canonical hook directly.
// Grep confirmed zero external consumers of `useSubscriptionStatus`
// before this change, so removing that re-export is safe.
export { useEntitlement } from '@/hooks/useEntitlement'
