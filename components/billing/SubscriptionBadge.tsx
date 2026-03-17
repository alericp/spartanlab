'use client'

import { Badge } from '@/components/ui/badge'
import { Crown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEntitlement } from '@/hooks/useEntitlement'

// UI status type for component props
export type UISubscriptionStatus = 'free' | 'trial' | 'pro'

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
  const entitlement = useEntitlement()
  // Derive status from entitlement
  const derivedStatus: UISubscriptionStatus = entitlement.isTrialing ? 'trial' : (entitlement.hasProAccess ? 'pro' : 'free')
  const status = statusOverride ?? derivedStatus
  
  // Free users don't get a badge
  if (status === 'free') return null
  
  const isPro = status === 'pro'
  const isTrial = status === 'trial'
  
  // Badge content based on status
  const Icon = isPro ? Crown : Sparkles
  // Note: We don't have exact trial days from entitlement API, just show "Trial"
  const label = isPro ? 'Pro' : 'Trial'
  
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
  const entitlement = useEntitlement()
  
  if (!entitlement.hasProAccess) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm text-[#6B7280]">Free Plan</span>
      </div>
    )
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SubscriptionBadge size="md" />
      {entitlement.isTrialing && (
        <span className="text-xs text-[#6B7280]">
          Trial active
        </span>
      )}
    </div>
  )
}

// =============================================================================
// RE-EXPORT HOOK FOR CONVENIENCE
// =============================================================================

// Re-export the new entitlement hook for components that import from here
export { useEntitlement } from '@/hooks/useEntitlement'

// Legacy re-export (deprecated - use useEntitlement instead)
export { useSubscriptionDisplay } from '@/lib/billing/subscription-status'
