'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Component, ReactNode } from 'react'

// Defensive wrapper to prevent any crash from propagating
class WrapperErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error) {
    console.error('[v0] OwnerSimulationToggleWrapper crashed (caught safely):', error.message)
  }
  
  render() {
    if (this.state.hasError) {
      return null // Silently hide on error - never crash the app
    }
    return this.props.children
  }
}

/**
 * Route-Aware Owner Simulation Toggle Wrapper
 * 
 * Only renders the auth-aware OwnerSimulationToggle on authenticated app routes.
 * Excludes it from public SEO/marketing pages to enable static prerendering.
 * 
 * Uses centralized public route config from lib/routes/public-routes.ts
 * to ensure consistent route classification across the app.
 * 
 * Auth-aware app routes that SHOULD render this component:
 * - /dashboard, /programs (user's programs), /history, /performance, /settings, /upgrade, etc.
 * 
 * CRITICAL: This wrapper is fail-soft. If anything fails (route detection, 
 * dynamic import, or the toggle itself), it silently returns null rather
 * than crashing the authenticated app layout.
 */

// Dynamically import the actual toggle to prevent it from being bundled on public routes
const OwnerSimulationToggle = dynamic(
  () => import('./OwnerSimulationToggle').then(mod => ({ default: mod.OwnerSimulationToggle })).catch(() => {
    console.error('[v0] OwnerSimulationToggle: dynamic import failed')
    return { default: () => null }
  }),
  { ssr: false }
)

// Safe route check that never throws
function safeIsPublicRoute(pathname: string | null): boolean {
  if (!pathname) return true // Treat unknown as public (don't render)
  
  try {
    // Inline check instead of importing to avoid potential module crashes
    const publicPrefixes = [
      '/', '/landing', '/programs', '/training', '/calculators', '/guides',
      '/skills', '/exercises', '/tools', '/about', '/pricing', '/blog',
      '/sign-in', '/sign-up', '/privacy', '/terms', '/contact'
    ]
    
    // Exact matches
    if (publicPrefixes.includes(pathname)) return true
    
    // Prefix matches (e.g., /guides/*)
    const publicPathPrefixes = ['/guides/', '/skills/', '/exercises/', '/calculators/', '/programs/', '/training/']
    if (publicPathPrefixes.some(prefix => pathname.startsWith(prefix))) return true
    
    // SEO pages with specific patterns
    if (pathname.includes('-strength-') || pathname.includes('-training-') || 
        pathname.includes('-requirements') || pathname.includes('-standards') ||
        pathname.includes('why-you-cant') || pathname.includes('-vs-')) return true
    
    return false
  } catch {
    return true // On error, treat as public (don't render toggle)
  }
}

export function OwnerSimulationToggleWrapper() {
  let pathname: string | null = null
  
  try {
    pathname = usePathname()
  } catch (e) {
    console.error('[v0] OwnerSimulationToggleWrapper: usePathname failed:', e)
    return null
  }
  
  // Don't render on public routes - these need to be prerenderable
  if (safeIsPublicRoute(pathname)) {
    return null
  }
  
  // Only render on authenticated app routes, wrapped in error boundary
  return (
    <WrapperErrorBoundary>
      <OwnerSimulationToggle />
    </WrapperErrorBoundary>
  )
}
