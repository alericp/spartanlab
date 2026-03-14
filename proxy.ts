import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Clerk Middleware for Next.js 16 (proxy.ts)
 * 
 * Uses native Clerk patterns only - no custom domain detection.
 * Public routes are always accessible, protected routes require auth.
 */

// Public routes that never require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/landing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/features',
  '/how-it-works',
  '/tools(.*)',
  '/guides(.*)',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/front-lever-progression',
  '/planche-progression',
  '/weighted-pull-up-calculator',
  '/api/public(.*)',
  '/api/webhooks(.*)',
])

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
