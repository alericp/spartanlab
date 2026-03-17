/**
 * Public Routes Configuration
 * 
 * Single source of truth for public route classification.
 * Used by:
 * - proxy.ts (Clerk middleware) to skip auth protection
 * - OwnerSimulationToggleWrapper to exclude auth-aware widgets
 * - Any future route-aware logic
 * 
 * IMPORTANT: Public routes must be statically prerenderable.
 * They should NOT depend on auth context during build.
 */

// =============================================================================
// ROUTE PATTERNS FOR CLERK MIDDLEWARE (proxy.ts)
// =============================================================================

/**
 * Clerk route matcher patterns for public routes.
 * These use Clerk's pattern syntax (similar to path-to-regexp).
 */
export const CLERK_PUBLIC_ROUTE_PATTERNS = [
  // Core pages
  '/',
  '/landing',
  
  // Auth pages (handled by Clerk)
  '/sign-in(.*)',
  '/sign-up(.*)',
  
  // Marketing pages
  '/pricing',
  '/features',
  '/how-it-works',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/faq',
  '/why-spartanlab-works',
  '/training-philosophy',
  
  // SEO content hubs
  '/tools(.*)',
  '/guides(.*)',
  '/calculators(.*)',
  '/exercises(.*)',
  '/skills(.*)',
  
  // Public program info pages (not user programs)
  '/programs/front-lever-program',
  '/programs/planche-program',
  '/programs/muscle-up-program',
  '/programs/handstand-push-up-program',
  '/programs/calisthenics-beginner-program',
  
  // SEO calculator pages (pattern-based)
  '/front-lever-readiness-calculator',
  '/muscle-up-readiness-calculator',
  '/planche-readiness-calculator',
  '/iron-cross-readiness-calculator',
  '/hspu-readiness-calculator',
  '/planche-lean-calculator',
  '/weighted-pull-up-calculator',
  
  // SEO strength standards pages
  '/calisthenics-strength-standards',
  '/pull-up-strength-standards',
  '/push-up-strength-standards',
  '/dip-strength-standards',
  '/weighted-pull-up-strength-standards',
  '/weighted-dip-strength-standards',
  
  // SEO progression pages
  '/front-lever-progression',
  '/planche-progression',
  
  // Public API routes
  '/api/public(.*)',
  '/api/webhooks(.*)',
]


// =============================================================================
// ROUTE PATTERNS FOR CLIENT-SIDE CHECKS (OwnerSimulationToggleWrapper)
// =============================================================================

/**
 * Exact public routes that should not render auth-aware global widgets.
 */
export const PUBLIC_EXACT_ROUTES = [
  '/',
  '/landing',
  '/pricing',
  '/features',
  '/how-it-works',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/faq',
  '/why-spartanlab-works',
  '/training-philosophy',
]

/**
 * Route prefixes that indicate public pages.
 * Any path starting with these is considered public.
 */
export const PUBLIC_ROUTE_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/guides',
  '/tools',
  '/calculators',
  '/exercises',
  '/skills',
]

/**
 * Regex patterns for public SEO pages.
 * These catch dynamic patterns like /*-calculator, /*-strength-standards, etc.
 */
export const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  // Calculator pages
  /^\/[a-z-]+-readiness-calculator$/,
  /^\/[a-z-]+-calculator$/,
  /^\/weighted-[a-z-]+-calculator$/,
  
  // Strength standards pages
  /^\/[a-z-]+-strength-standards$/,
  /^\/weighted-[a-z-]+-strength-standards$/,
  
  // Progression pages
  /^\/[a-z-]+-progression$/,
  
  // Public program info pages (not user's programs at /programs/[id])
  /^\/programs\/[a-z-]+-program$/,
]

/**
 * Check if a pathname is a public route.
 * Used by client-side route-aware components.
 */
export function isPublicRoute(pathname: string): boolean {
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
