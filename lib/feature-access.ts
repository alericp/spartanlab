/**
 * SpartanLab Feature Access System
 * 
 * Manages subscription tiers and feature gating for free vs pro users.
 * Integrates with Stripe subscriptions stored in the database.
 * 
 * Owner accounts bypass all subscription checks.
 */

import { isOwner, checkOwnerByEmail } from './owner-access'
import { getSimulationMode, isSimulationActive } from './billing/subscription-simulation'

// Re-export for component usage
export { isOwner as isOwnerAccount } from './owner-access'
export { checkOwnerByEmail } from './owner-access'

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

export type SubscriptionTier = 'free' | 'pro'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'

export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: SubscriptionStatus
  expiresAt: string | null // ISO date string
  trialEndsAt: string | null
  // For future billing integration
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

// Default subscription for new users
const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  tier: 'free',
  status: 'none',
  expiresAt: null,
  trialEndsAt: null,
}

// =============================================================================
// FEATURE DEFINITIONS
// =============================================================================

export type FeatureId =
  // Free Features
  | 'basic_program'
  | 'workout_logging'
  | 'skill_tracking_basic'
  | 'guides'
  | 'tool_calculators'
  | 'daily_readiness_basic'
  | 'onboarding_program'
  | 'band_tracking'
  | 'warmup_cooldown'
  // Pro Features
  | 'adaptive_adjustments'
  | 'fatigue_intelligence'
  | 'training_analytics_advanced'
  | 'progress_projections'
  | 'band_progression_intelligence'
  | 'performance_insights'
  | 'advanced_program_builder'
  | 'readiness_deep_insights'
  | 'skill_progression_detailed'
  | 'deload_detection'
  | 'constraint_analysis'
  | 'session_performance_detailed'
  | 'daily_adjustments'

export interface FeatureDefinition {
  id: FeatureId
  name: string
  description: string
  tier: SubscriptionTier
  category: 'training' | 'analytics' | 'tools' | 'intelligence'
}

// Feature registry - defines what's free vs pro
export const FEATURES: Record<FeatureId, FeatureDefinition> = {
  // ===== FREE FEATURES =====
  basic_program: {
    id: 'basic_program',
    name: 'Basic Program Generation',
    description: 'Generate personalized weekly training programs based on your goals',
    tier: 'free',
    category: 'training',
  },
  workout_logging: {
    id: 'workout_logging',
    name: 'Workout Logging',
    description: 'Log sets, reps, and track your training sessions',
    tier: 'free',
    category: 'training',
  },
  skill_tracking_basic: {
    id: 'skill_tracking_basic',
    name: 'Skill Progress Tracking',
    description: 'Track your progress toward calisthenics skills',
    tier: 'free',
    category: 'training',
  },
  guides: {
    id: 'guides',
    name: 'Training Guides',
    description: 'Access skill guides and training education',
    tier: 'free',
    category: 'tools',
  },
  tool_calculators: {
    id: 'tool_calculators',
    name: 'Training Calculators',
    description: 'Skill readiness, strength calculators and more',
    tier: 'free',
    category: 'tools',
  },
  daily_readiness_basic: {
    id: 'daily_readiness_basic',
    name: 'Daily Readiness Score',
    description: 'See your daily training readiness estimate',
    tier: 'free',
    category: 'intelligence',
  },
  onboarding_program: {
    id: 'onboarding_program',
    name: 'First Program Generation',
    description: 'Get your personalized program after onboarding',
    tier: 'free',
    category: 'training',
  },
  band_tracking: {
    id: 'band_tracking',
    name: 'Band Usage Tracking',
    description: 'Track resistance band usage during exercises',
    tier: 'free',
    category: 'training',
  },
  warmup_cooldown: {
    id: 'warmup_cooldown',
    name: 'Warm-Up & Cool-Down',
    description: 'Dynamic warm-ups and structured cool-downs',
    tier: 'free',
    category: 'training',
  },

  // ===== PRO FEATURES =====
  adaptive_adjustments: {
    id: 'adaptive_adjustments',
    name: 'Adaptive Program Adjustments',
    description: 'Automatic workout adjustments based on fatigue and performance',
    tier: 'pro',
    category: 'intelligence',
  },
  fatigue_intelligence: {
    id: 'fatigue_intelligence',
    name: 'Advanced Fatigue Intelligence',
    description: 'Deep fatigue analysis with recovery predictions and alerts',
    tier: 'pro',
    category: 'intelligence',
  },
  training_analytics_advanced: {
    id: 'training_analytics_advanced',
    name: 'Advanced Training Analytics',
    description: 'Detailed volume analysis, trends, and optimization insights',
    tier: 'pro',
    category: 'analytics',
  },
  progress_projections: {
    id: 'progress_projections',
    name: 'Progress Projections',
    description: 'Estimated timelines to your next skill milestones',
    tier: 'pro',
    category: 'analytics',
  },
  band_progression_intelligence: {
    id: 'band_progression_intelligence',
    name: 'Band Progression Intelligence',
    description: 'Smart recommendations for when to reduce band assistance',
    tier: 'pro',
    category: 'intelligence',
  },
  performance_insights: {
    id: 'performance_insights',
    name: 'Performance Trend Insights',
    description: 'Identify patterns and optimization opportunities in your training',
    tier: 'pro',
    category: 'analytics',
  },
  advanced_program_builder: {
    id: 'advanced_program_builder',
    name: 'Advanced Program Builder',
    description: 'Full control over program structure, phases, and periodization',
    tier: 'pro',
    category: 'training',
  },
  readiness_deep_insights: {
    id: 'readiness_deep_insights',
    name: 'Readiness Deep Insights',
    description: 'Detailed breakdown of factors affecting your daily readiness',
    tier: 'pro',
    category: 'intelligence',
  },
  skill_progression_detailed: {
    id: 'skill_progression_detailed',
    name: 'Detailed Skill Progression',
    description: 'In-depth skill readiness analysis and progression pathways',
    tier: 'pro',
    category: 'analytics',
  },
  deload_detection: {
    id: 'deload_detection',
    name: 'Deload Detection',
    description: 'Automatic detection of when you need recovery weeks',
    tier: 'pro',
    category: 'intelligence',
  },
  constraint_analysis: {
    id: 'constraint_analysis',
    name: 'Constraint Analysis',
    description: 'Identify what is limiting your progress and how to address it',
    tier: 'pro',
    category: 'analytics',
  },
  session_performance_detailed: {
    id: 'session_performance_detailed',
    name: 'Detailed Session Analysis',
    description: 'In-depth post-workout performance breakdown and signals',
    tier: 'pro',
    category: 'analytics',
  },
  daily_adjustments: {
    id: 'daily_adjustments',
    name: 'Daily Training Adjustments',
    description: 'Personalized daily workout modifications based on readiness',
    tier: 'pro',
    category: 'intelligence',
  },
}

// Get all features by tier
export function getFeaturesByTier(tier: SubscriptionTier): FeatureDefinition[] {
  return Object.values(FEATURES).filter(f => f.tier === tier)
}

// Get free features
export function getFreeFeatures(): FeatureDefinition[] {
  return getFeaturesByTier('free')
}

// Get pro features
export function getProFeatures(): FeatureDefinition[] {
  return getFeaturesByTier('pro')
}

// =============================================================================
// SUBSCRIPTION STORAGE (localStorage for demo, DB in production)
// =============================================================================

const SUBSCRIPTION_KEY = 'spartanlab_subscription'

export function getSubscription(): SubscriptionInfo {
  if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTION
  
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_KEY)
    if (!stored) return DEFAULT_SUBSCRIPTION
    
    const parsed = JSON.parse(stored) as SubscriptionInfo
    
    // Check if subscription has expired
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      // Expired - revert to free
      const expired: SubscriptionInfo = {
        ...parsed,
        tier: 'free',
        status: 'canceled',
      }
      saveSubscription(expired)
      return expired
    }
    
    return parsed
  } catch {
    return DEFAULT_SUBSCRIPTION
  }
}

export function saveSubscription(subscription: SubscriptionInfo): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription))
}

// =============================================================================
// ACCESS CHECK FUNCTIONS
// =============================================================================

/**
 * Check if user has Pro subscription
 * Owner accounts respect simulation mode if active
 */
export function hasProAccess(): boolean {
  // Owner with simulation - respect simulated state
  if (isOwner()) {
    if (isSimulationActive()) {
      return getSimulationMode() === 'pro'
    }
    // Owner without simulation - check real subscription state
    const subscription = getSubscription()
    return subscription.tier === 'pro' && 
           (subscription.status === 'active' || subscription.status === 'trialing')
  }
  
  // Regular users - standard check
  const subscription = getSubscription()
  return subscription.tier === 'pro' && 
         (subscription.status === 'active' || subscription.status === 'trialing')
}

/**
 * Check if a specific feature is available to the user
 * Owner accounts respect simulation mode
 */
export function hasFeatureAccess(featureId: FeatureId): boolean {
  const feature = FEATURES[featureId]
  if (!feature) return false
  
  // Free features are always available
  if (feature.tier === 'free') return true
  
  // Pro features require pro subscription (hasProAccess handles owner simulation)
  return hasProAccess()
}

/**
 * Get current subscription tier
 * Owner accounts respect simulation mode
 */
export function getCurrentTier(): SubscriptionTier {
  if (isOwner()) {
    if (isSimulationActive()) {
      return getSimulationMode() === 'pro' ? 'pro' : 'free'
    }
    // Without simulation, return real tier
    return getSubscription().tier
  }
  return getSubscription().tier
}

/**
 * Check if user is in trial period
 */
export function isInTrial(): boolean {
  const subscription = getSubscription()
  return subscription.status === 'trialing' && 
         subscription.trialEndsAt !== null &&
         new Date(subscription.trialEndsAt) > new Date()
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(): number {
  const subscription = getSubscription()
  if (!subscription.trialEndsAt) return 0
  
  const endDate = new Date(subscription.trialEndsAt)
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT (for demo purposes)
// =============================================================================

/**
 * Upgrade to Pro (demo function - would integrate with Stripe in production)
 */
export function upgradeToPro(): void {
  const subscription: SubscriptionInfo = {
    tier: 'pro',
    status: 'active',
    expiresAt: null, // Subscription doesn't expire
    trialEndsAt: null,
  }
  saveSubscription(subscription)
}

/**
 * @deprecated Use Stripe checkout with trial_period_days instead.
 * This was a demo function - real trials are now handled via Stripe.
 * The real trial flow: /api/stripe/create-checkout-session with subscription_data.trial_period_days
 */
export function startTrial(_durationDays: number = 7): void {
  console.warn('[SpartanLab] startTrial() is deprecated. Use Stripe checkout for real trials.')
  // No-op - real trials are handled by Stripe checkout
}

/**
 * Cancel subscription (demo function)
 */
export function cancelSubscription(): void {
  const current = getSubscription()
  const subscription: SubscriptionInfo = {
    ...current,
    tier: 'free',
    status: 'canceled',
  }
  saveSubscription(subscription)
}

/**
 * Reset to free tier (for testing)
 */
export function resetToFree(): void {
  saveSubscription(DEFAULT_SUBSCRIPTION)
}

// =============================================================================
// FEATURE GATING HELPERS
// =============================================================================

export interface FeatureGateResult {
  allowed: boolean
  feature: FeatureDefinition | null
  requiredTier: SubscriptionTier
  currentTier: SubscriptionTier
  upgradeReason: string
}

/**
 * Check feature gate with detailed result
 */
export function checkFeatureGate(featureId: FeatureId): FeatureGateResult {
  const feature = FEATURES[featureId]
  const currentTier = getCurrentTier()
  const allowed = hasFeatureAccess(featureId)
  
  return {
    allowed,
    feature: feature || null,
    requiredTier: feature?.tier || 'pro',
    currentTier,
    upgradeReason: feature 
      ? `Upgrade to Pro to unlock ${feature.name}` 
      : 'Upgrade to Pro for advanced features',
  }
}

/**
 * Get all features user has access to
 */
export function getAccessibleFeatures(): FeatureDefinition[] {
  return Object.values(FEATURES).filter(f => hasFeatureAccess(f.id))
}

/**
 * Get all locked features for current user
 */
export function getLockedFeatures(): FeatureDefinition[] {
  return Object.values(FEATURES).filter(f => !hasFeatureAccess(f.id))
}

// =============================================================================
// PRO FEATURE CATEGORIES FOR UI
// =============================================================================

export interface ProFeatureCategory {
  id: string
  name: string
  description: string
  features: FeatureId[]
}

export const PRO_FEATURE_CATEGORIES: ProFeatureCategory[] = [
  {
    id: 'intelligence',
    name: 'Training Intelligence',
    description: 'Adaptive coaching that learns from your performance',
    features: [
      'adaptive_adjustments',
      'fatigue_intelligence',
      'daily_adjustments',
      'deload_detection',
      'readiness_deep_insights',
    ],
  },
  {
    id: 'analytics',
    name: 'Performance Analytics',
    description: 'Deep insights into your training patterns and progress',
    features: [
      'training_analytics_advanced',
      'progress_projections',
      'performance_insights',
      'constraint_analysis',
      'session_performance_detailed',
    ],
  },
  {
    id: 'progression',
    name: 'Skill Progression',
    description: 'Intelligent guidance for advancing your skills',
    features: [
      'skill_progression_detailed',
      'band_progression_intelligence',
      'advanced_program_builder',
    ],
  },
]
