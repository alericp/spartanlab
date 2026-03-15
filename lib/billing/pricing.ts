/**
 * Centralized Pricing Constants
 * 
 * Single source of truth for public-facing pricing display.
 * This does NOT change Stripe checkout behavior - it only normalizes UI copy.
 */

export const PRICING = {
  // Pro tier pricing
  pro: {
    monthly: 15,
    display: '$15',
    displayWithPeriod: '$15/month',
    description: 'Full access to adaptive training, analytics, and all premium features',
  },
  
  // Free tier
  free: {
    monthly: 0,
    display: 'Free',
    displayWithPeriod: 'Free forever',
    description: 'Limited access to educational content and basic tools',
  },
} as const

// Helper functions for consistent formatting
export function formatPrice(tier: 'pro' | 'free'): string {
  return PRICING[tier].display
}

export function formatPriceWithPeriod(tier: 'pro' | 'free'): string {
  return PRICING[tier].displayWithPeriod
}
