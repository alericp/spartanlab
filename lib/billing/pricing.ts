/**
 * Centralized Pricing & Trial Constants
 * 
 * Single source of truth for public-facing pricing display and trial terms.
 * This does NOT change Stripe checkout behavior - it only normalizes UI copy.
 */

export const TRIAL = {
  days: 7,
  display: '7-day',
  ctaText: 'Start 7-Day Free Trial',
  ctaTextShort: 'Start Free Trial',
  explanation: 'Card required. You won\'t be charged until your 7-day trial ends. Cancel anytime.',
  explanationShort: 'Try free for 7 days. Cancel anytime.',
} as const

export const PRICING = {
  // Pro tier pricing
  pro: {
    monthly: 15,
    display: '$15',
    displayWithPeriod: '$15/month',
    description: 'Full access to adaptive training, analytics, and all premium features',
    trialDays: TRIAL.days,
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

export function getTrialCtaText(): string {
  return TRIAL.ctaText
}

export function getTrialExplanation(): string {
  return TRIAL.explanation
}
