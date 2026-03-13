import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

/**
 * Middleware with preview-safe Clerk integration
 * 
 * On preview domains (*.vusercontent.net, etc.): bypasses Clerk entirely
 * On production (spartanlab.app): applies Clerk auth middleware
 */

// Production domains where Clerk should run
const PRODUCTION_DOMAINS = ['spartanlab.app', 'www.spartanlab.app']

// Define public routes that don't require authentication
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
  // SEO pages
  '/front-lever-progression',
  '/planche-progression',
  '/weighted-pull-up-calculator',
  // API routes that should be public
  '/api/public(.*)',
  // Dashboard should be accessible in preview (will show preview fallback)
  '/dashboard(.*)',
  '/onboarding(.*)',
])

/**
 * Check if the request is from a production domain
 */
function isProductionDomain(request: NextRequest): boolean {
  const hostname = request.headers.get('host')?.split(':')[0] ?? ''
  return PRODUCTION_DOMAINS.includes(hostname)
}

// Create the Clerk middleware once
const authMiddleware = clerkMiddleware(async (auth, req) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return
  }
  
  // Protect all other routes - require authentication
  await auth.protect()
})

/**
 * Main middleware function
 */
export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  // CRITICAL: On non-production domains, bypass Clerk entirely
  // This prevents Clerk from trying to authenticate on preview domains
  if (!isProductionDomain(request)) {
    return NextResponse.next()
  }
  
  // Production domain: use Clerk middleware
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
