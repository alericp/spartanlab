'use client'

import { Badge } from '@/components/ui/badge'
import { Crown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscriptionDisplay, type UISubscriptionStatus } from '@/lib/billing/subscription-status'

// =============================================================================
// SUBSCRIPTION BADGE COMPONENT
// =============================================================================

interface SubscriptionBadgeProps {
  /** Override the status (otherwise uses current user's status) */
  status?: UISubscriptionStatus
  /** Size variant */
  size?: 'sm' | 'md'
  /** Show trial days remaining */
  showTrialDays?: boolean
  /** Additional classes */
  className?: string
}

/**
 * SubscriptionBadge - Displays user's subscription status
 * 
 * - Pro: Gold crown badge
 * - Trial: Gold sparkle badge with optional days remaining
 * - Free: No badge shown (returns null)
 */
export function SubscriptionBadge({ 
  status: statusOverride, 
  size = 'sm',
  showTrialDays = true,
  className,
}: SubscriptionBadgeProps) {
  const subscriptionInfo = useSubscriptionDisplay()
  const status = statusOverride ?? subscriptionInfo.status
  
  // Free users don't get a badge
  if (status === 'free') return null
  
  const isPro = status === 'pro'
  const isTrial = status === 'trial'
  
  // Badge content based on status
  const Icon = isPro ? Crown : Sparkles
  const label = isPro ? 'Pro' : (showTrialDays && subscriptionInfo.trialDaysRemaining > 0 
    ? `Trial · ${subscriptionInfo.trialDaysRemaining}d` 
    : 'Trial')
  
  return (
    <Badge 
      className={cn(
        // Base styles - premium gold theme
        "border transition-colors",
        isPro && "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30 hover:from-amber-500/30 hover:to-amber-600/30",
        isTrial && "bg-gradient-to-r from-amber-400/15 to-amber-500/15 text-amber-300 border-amber-400/25 hover:from-amber-400/25 hover:to-amber-500/25",
        // Size variants
        size === 'sm' && "text-[10px] px-1.5 py-0.5 gap-1",
        size === 'md' && "text-xs px-2 py-0.5 gap-1.5",
        className
      )}
    >
      <Icon className={cn(
        size === 'sm' ? "w-2.5 h-2.5" : "w-3 h-3"
      )} />
      {label}
    </Badge>
  )
}

// =============================================================================
// SUBSCRIPTION STATUS INDICATOR (for settings/account pages)
// =============================================================================

interface SubscriptionStatusCardProps {
  className?: string
}

/**
 * Compact subscription status display for account/settings areas
 */
export function SubscriptionStatusIndicator({ className }: SubscriptionStatusCardProps) {
  const info = useSubscriptionDisplay()
  
  if (info.status === 'free') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm text-[#6B7280]">Free Plan</span>
      </div>
    )
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SubscriptionBadge size="md" />
      {info.isTrialing && info.trialDaysRemaining > 0 && (
        <span className="text-xs text-[#6B7280]">
          ends in {info.trialDaysRemaining} day{info.trialDaysRemaining !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

// =============================================================================
// RE-EXPORT HOOK FOR CONVENIENCE
// =============================================================================

export { useSubscriptionDisplay } from '@/lib/billing/subscription-status'
