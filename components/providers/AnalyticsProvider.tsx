'use client'

import { useEffect, useState, Component, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

/**
 * Error boundary to ensure analytics never crashes the app
 */
class AnalyticsErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error) {
    console.error('[v0] AnalyticsProvider crashed (caught safely):', error.message)
  }
  
  render() {
    if (this.state.hasError) {
      // On error, just render children without analytics
      return this.props.children
    }
    return this.props.children
  }
}

/**
 * Inner Analytics Provider with hook calls
 */
function AnalyticsProviderInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  
  // Safely mark as mounted
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Initialize analytics on mount - fail silently
  useEffect(() => {
    if (!mounted) return
    
    try {
      // Dynamically import to prevent any module-level errors from crashing
      import('@/lib/analytics').then(({ initAnalytics }) => {
        try {
          initAnalytics()
        } catch {
          // Analytics init failed - continue silently
        }
      }).catch(() => {
        // Module import failed - continue silently
      })
      
      // [baseline-vs-earned] ISSUE F: Initialize baseline tracking for existing users
      // This ensures baseline is captured even for users who completed onboarding
      // before this feature was added
      import('@/lib/baseline-earned-truth').then(({ initializeBaselineTracking }) => {
        try {
          initializeBaselineTracking()
        } catch {
          // Baseline init failed - continue silently
        }
      }).catch(() => {
        // Module import failed - continue silently
      })
    } catch {
      // Outer try-catch for any unexpected errors
    }
  }, [mounted])
  
  // Track page views on route changes - fail silently
  useEffect(() => {
    if (!mounted || !pathname) return
    
    try {
      import('@/lib/analytics').then(({ trackPageView }) => {
        try {
          const pageName = pathname === '/' 
            ? 'home' 
            : pathname.replace(/^\//, '').replace(/\//g, '_')
          
          trackPageView(pageName)
        } catch {
          // Page view tracking failed - continue silently
        }
      }).catch(() => {
        // Module import failed - continue silently
      })
    } catch {
      // Outer try-catch for any unexpected errors
    }
  }, [mounted, pathname])
  
  return (
    <>
      {/* Google Analytics 4 Script - loads asynchronously */}
      {gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', {
                page_path: window.location.pathname,
                send_page_view: false
              });
            `}
          </Script>
        </>
      )}
      {children}
    </>
  )
}

/**
 * Analytics Provider Component
 * 
 * Initializes PostHog and Google Analytics 4, tracks page views automatically.
 * CRITICAL: This component must NEVER crash the app. Wrapped in error boundary
 * to ensure any analytics failure doesn't take down the app.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsProviderInner>{children}</AnalyticsProviderInner>
    </AnalyticsErrorBoundary>
  )
}
