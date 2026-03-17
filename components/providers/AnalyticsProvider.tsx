'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

/**
 * Analytics Provider Component
 * 
 * Initializes PostHog and Google Analytics 4, tracks page views automatically.
 * CRITICAL: This component must NEVER crash the app. All analytics
 * operations are wrapped in try/catch for production safety.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
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
