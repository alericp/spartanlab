'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

/**
 * Route-Aware Owner Simulation Toggle Wrapper
 * 
 * Only renders the auth-aware OwnerSimulationToggle on authenticated app routes.
 * Excludes it from public SEO/marketing pages to enable static prerendering.
 * 
 * Public routes that should NOT render auth-aware components:
 * - Landing page (/)
 * - SEO content pages (/guides/*, /tools/*, /calisthenics-*, etc.)
 * - Calculator pages (/calculators/*, /*-calculator, /*-readiness-calculator)
 * - Marketing pages (/pricing, /about, etc.)
 * - Authentication pages (/sign-in, /sign-up)
 * 
 * Auth-aware app routes that SHOULD render this component:
 * - /dashboard, /programs, /history, /performance, /settings, /upgrade, etc.
 */

// Dynamically import the actual toggle to prevent it from being bundled on public routes
const OwnerSimulationToggle = dynamic(
  () => import('./OwnerSimulationToggle').then(mod => ({ default: mod.OwnerSimulationToggle })),
  { ssr: false }
)

// Public route prefixes that should NOT have auth-aware global widgets
const PUBLIC_ROUTE_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/guides',
  '/tools',
  '/calculators',
  '/pricing',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/faq',
]

// Exact public routes
const PUBLIC_EXACT_ROUTES = [
  '/',
]

// Public route patterns (regex-style matching)
const PUBLIC_ROUTE_PATTERNS = [
  /^\/[a-z-]+-readiness-calculator$/,  // e.g., /front-lever-readiness-calculator
  /^\/[a-z-]+-calculator$/,             // e.g., /weighted-pull-up-calculator
  /^\/[a-z-]+-progression$/,            // e.g., /front-lever-progression
  /^\/[a-z-]+-strength-standards$/,     // e.g., /calisthenics-strength-standards
  /^\/weighted-[a-z-]+-strength-standards$/, // e.g., /weighted-dip-strength-standards
]

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_EXACT_ROUTES.includes(pathname)) {
    return true
  }
  
  // Check prefix matches
  if (PUBLIC_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true
  }
  
  // Check pattern matches
  if (PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(pathname))) {
    return true
  }
  
  return false
}

export function OwnerSimulationToggleWrapper() {
  const pathname = usePathname()
  
  // Don't render on public routes - these need to be prerenderable
  if (isPublicRoute(pathname)) {
    return null
  }
  
  // Only render on authenticated app routes
  return <OwnerSimulationToggle />
}
