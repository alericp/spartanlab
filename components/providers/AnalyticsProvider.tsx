'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initAnalytics, trackPageView } from '@/lib/analytics'

/**
 * Analytics Provider Component
 * 
 * Initializes PostHog analytics and tracks page views automatically.
 * Wrap your app layout with this provider.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics()
  }, [])
  
  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      // Derive page name from pathname
      const pageName = pathname === '/' 
        ? 'home' 
        : pathname.replace(/^\//, '').replace(/\//g, '_')
      
      trackPageView(pageName)
    }
  }, [pathname, searchParams])
  
  return <>{children}</>
}
