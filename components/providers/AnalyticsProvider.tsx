'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Analytics Provider Component
 * 
 * Initializes PostHog analytics and tracks page views automatically.
 * CRITICAL: This component must NEVER crash the app. All analytics
 * operations are wrapped in try/catch for production safety.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
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
  
  return <>{children}</>
}
