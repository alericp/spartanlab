import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { isProductionDomainFromHostname } from '@/lib/auth-environment'

/**
 * Middleware with preview-safe Clerk integration
 *
 * Rules:
 * - Preview/non-production domains bypass Clerk
 * - Production domains enforce authentication for app routes
 * - Marketing and auth pages remain public
 */

// Public routes that never require auth
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
])

const authMiddleware = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return
  }

  // All other routes require authentication
  await auth.protect()
})

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const hostname = request.headers.get('host')

  // Preview domains bypass Clerk entirely
  if (!isProductionDomainFromHostname(hostname)) {
    return NextResponse.next()
  }

  // Production domains enforce auth middleware
  return authMiddleware(request, event)
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files (including manifest.json)
    '/((?!_next|manifest\\.json|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
