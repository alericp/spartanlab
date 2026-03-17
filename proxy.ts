import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { CLERK_PUBLIC_ROUTE_PATTERNS } from '@/lib/routes/public-routes'

/**
 * Clerk Middleware for Next.js 16 (proxy.ts)
 * 
 * Uses native Clerk patterns only - no custom domain detection.
 * Public routes are always accessible, protected routes require auth.
 * 
 * IMPORTANT: All public SEO pages must be listed in lib/routes/public-routes.ts
 * This ensures consistent public route classification across:
 * - Clerk middleware (this file)
 * - Auth-aware global widget gating (OwnerSimulationToggleWrapper)
 */

// Public routes that never require authentication
// Uses centralized route patterns from lib/routes/public-routes.ts
const isPublicRoute = createRouteMatcher(CLERK_PUBLIC_ROUTE_PATTERNS)

export default clerkMiddleware(async (auth, req) => {
  // Public routes - no auth required
  if (isPublicRoute(req)) {
    return
  }

  // Protected routes - require authentication
  await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|manifest\\.json|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
