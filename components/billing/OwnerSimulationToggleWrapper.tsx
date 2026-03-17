'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { isPublicRoute } from '@/lib/routes/public-routes'

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
 */

// Dynamically import the actual toggle to prevent it from being bundled on public routes
const OwnerSimulationToggle = dynamic(
  () => import('./OwnerSimulationToggle').then(mod => ({ default: mod.OwnerSimulationToggle })),
  { ssr: false }
)

export function OwnerSimulationToggleWrapper() {
  const pathname = usePathname()
  
  // Don't render on public routes - these need to be prerenderable
  if (isPublicRoute(pathname)) {
    return null
  }
  
  // Only render on authenticated app routes
  return <OwnerSimulationToggle />
}
