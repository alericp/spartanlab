import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { PRODUCTION_AUTH_DOMAINS, isProductionDomainFromHostname } from '@/lib/auth-environment'

/**
 * Middleware with preview-safe Clerk integration
 * 
 * Uses the single source of truth from auth-environment.ts
 * 
 * On preview domains (*.vusercontent.net, etc.): bypasses Clerk entirely
 * On production (spartanlab.app): applies Clerk auth middleware
 */

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
  const hostname = request.headers.get('host')
  
  // CRITICAL: On non-production domains, bypass Clerk entirely
  // This prevents Clerk from trying to authenticate on preview domains
  if (!isProductionDomainFromHostname(hostname)) {
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
