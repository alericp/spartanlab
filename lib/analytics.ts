/**
 * SpartanLab Product Analytics
 * 
 * Lightweight analytics system supporting both PostHog and Google Analytics 4.
 * Uses PostHog for detailed product analytics and GA4 for traffic/SEO analysis.
 * 
 * Environment variables:
 * - NEXT_PUBLIC_POSTHOG_KEY (optional)
 * - NEXT_PUBLIC_POSTHOG_HOST (optional, defaults to PostHog cloud)
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID (optional, for GA4)
 */

import posthog from 'posthog-js'

// Google Analytics 4 types
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// Analytics event names - centralized for consistency
export const AnalyticsEvents = {
  // Page Views
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  DASHBOARD_VIEWED: 'dashboard_viewed',
  PRICING_VIEWED: 'pricing_viewed',
  TOOL_PAGE_VIEWED: 'tool_page_viewed',
  
  // Auth Events
  SIGN_UP_STARTED: 'sign_up_started',
  ACCOUNT_CREATED: 'account_created',
  SIGN_IN_COMPLETED: 'sign_in_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  
  // Conversion Events
  UPGRADE_STARTED: 'upgrade_started',
  UPGRADE_COMPLETED: 'upgrade_completed',
  
  // Engagement Events
  TOOL_USED: 'tool_used',
  WORKOUT_STARTED: 'workout_started',
  WORKOUT_COMPLETED: 'workout_completed',
  PROGRAM_CREATED: 'program_created',
  
  // Feature Usage
  SKILL_TRACKED: 'skill_tracked',
  STRENGTH_LOGGED: 'strength_logged',
  
  // CTA and Conversion
  CTA_CLICKED: 'spartanlab_cta_click',
  PROGRAM_GENERATED: 'program_generated',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
} as const

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]

// Initialize analytics - call once at app startup
let posthogInitialized = false
let ga4Initialized = false

// Initialize Google Analytics 4
export function initGA4(): void {
  if (typeof window === 'undefined') return
  if (ga4Initialized) return
  
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  
  if (!measurementId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] GA4 measurement ID not configured')
    }
    return
  }
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }
  
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    page_path: window.location.pathname,
    send_page_view: false, // We'll track manually for SPA
  })
  
  ga4Initialized = true
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] GA4 initialized')
  }
}

// Initialize PostHog
export function initPostHog(): void {
  if (typeof window === 'undefined') return
  if (posthogInitialized) return
  
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  
  if (!posthogKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] PostHog key not configured')
    }
    return
  }
  
  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll capture manually for better control
    capture_pageleave: true,
    autocapture: false, // Disable auto-capture for cleaner data
    persistence: 'localStorage',
    loaded: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] PostHog initialized')
      }
    },
  })
  
  posthogInitialized = true
}

// Initialize all analytics providers
export function initAnalytics(): void {
  initPostHog()
  initGA4()
}

// Identify user after authentication
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  if (!posthogInitialized && !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  
  posthog.identify(userId, properties)
}

// Reset user identity on logout
export function resetUser(): void {
  if (typeof window === 'undefined') return
  if (!posthogInitialized && !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  
  posthog.reset()
}

// Track a custom event (sends to both PostHog and GA4)
export function trackEvent(
  event: AnalyticsEvent | string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  
  // Send to PostHog
  if (posthogInitialized || process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, properties)
  }
  
  // Send to GA4
  if (ga4Initialized && window.gtag) {
    window.gtag('event', event, properties)
  }
}

// Track page view (sends to both PostHog and GA4)
export function trackPageView(pageName: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  
  // Send to PostHog
  if (posthogInitialized || process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
      ...properties,
    })
  }
  
  // Send to GA4
  if (ga4Initialized && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...properties,
    })
  }
}

// ============================================
// Convenience functions for specific events
// ============================================

// Auth Events
export function trackSignUpStarted(source?: string): void {
  trackEvent(AnalyticsEvents.SIGN_UP_STARTED, { source })
}

export function trackAccountCreated(userId: string, email?: string): void {
  identifyUser(userId, { email, created_at: new Date().toISOString() })
  trackEvent(AnalyticsEvents.ACCOUNT_CREATED, { user_id: userId })
}

export function trackSignInCompleted(userId: string): void {
  identifyUser(userId)
  trackEvent(AnalyticsEvents.SIGN_IN_COMPLETED, { user_id: userId })
}

export function trackOnboardingCompleted(userId: string): void {
  trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, { user_id: userId })
}

// Page Views
export function trackLandingPageViewed(): void {
  trackPageView('landing')
  trackEvent(AnalyticsEvents.LANDING_PAGE_VIEWED)
}

export function trackDashboardViewed(isNewUser?: boolean): void {
  trackPageView('dashboard')
  trackEvent(AnalyticsEvents.DASHBOARD_VIEWED, { is_new_user: isNewUser })
}

export function trackPricingViewed(source?: string): void {
  trackPageView('pricing')
  trackEvent(AnalyticsEvents.PRICING_VIEWED, { source })
}

export function trackToolPageViewed(toolName: string): void {
  trackPageView(`tool_${toolName}`)
  trackEvent(AnalyticsEvents.TOOL_PAGE_VIEWED, { tool_name: toolName })
}

// Conversion Events
export function trackUpgradeStarted(source?: string, plan?: string): void {
  trackEvent(AnalyticsEvents.UPGRADE_STARTED, { source, plan: plan || 'pro' })
}

export function trackUpgradeCompleted(userId: string, plan?: string): void {
  trackEvent(AnalyticsEvents.UPGRADE_COMPLETED, { 
    user_id: userId, 
    plan: plan || 'pro',
    completed_at: new Date().toISOString()
  })
}

// Engagement Events
export function trackToolUsed(toolName: string, result?: Record<string, unknown>): void {
  trackEvent(AnalyticsEvents.TOOL_USED, { 
    tool_name: toolName,
    has_result: !!result,
  })
}

export function trackWorkoutStarted(workoutType?: string): void {
  trackEvent(AnalyticsEvents.WORKOUT_STARTED, { 
    workout_type: workoutType,
    started_at: new Date().toISOString()
  })
}

export function trackWorkoutCompleted(
  workoutType?: string, 
  durationMinutes?: number,
  exerciseCount?: number
): void {
  trackEvent(AnalyticsEvents.WORKOUT_COMPLETED, { 
    workout_type: workoutType,
    duration_minutes: durationMinutes,
    exercise_count: exerciseCount,
    completed_at: new Date().toISOString()
  })
}

export function trackProgramCreated(programType?: string): void {
  trackEvent(AnalyticsEvents.PROGRAM_CREATED, { program_type: programType })
}

export function trackSkillTracked(skillName: string): void {
  trackEvent(AnalyticsEvents.SKILL_TRACKED, { skill_name: skillName })
}

export function trackStrengthLogged(exerciseType: string): void {
  trackEvent(AnalyticsEvents.STRENGTH_LOGGED, { exercise_type: exerciseType })
}

// CTA and Conversion Events
export function trackCTAClicked(sourceTool: string, destination?: string): void {
  trackEvent(AnalyticsEvents.CTA_CLICKED, { 
    source_tool: sourceTool,
    destination: destination || 'onboarding',
    clicked_at: new Date().toISOString()
  })
}

export function trackProgramGenerated(programType?: string, skillFocus?: string): void {
  try {
    trackEvent(AnalyticsEvents.PROGRAM_GENERATED, { 
      program_type: programType,
      skill_focus: skillFocus,
      generated_at: new Date().toISOString()
    })
  } catch (err) {
    console.error('[Analytics] trackProgramGenerated failed (non-fatal):', err)
  }
}

export function trackSignupStarted(source?: string): void {
  trackEvent(AnalyticsEvents.SIGNUP_STARTED, { 
    source,
    started_at: new Date().toISOString()
  })
}

export function trackSignupCompleted(userId?: string): void {
  try {
    trackEvent(AnalyticsEvents.SIGNUP_COMPLETED, { 
      user_id: userId,
      completed_at: new Date().toISOString()
    })
  } catch (err) {
    console.error('[Analytics] trackSignupCompleted failed (non-fatal):', err)
  }
}
