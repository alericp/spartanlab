import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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
])

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes without authentication
  if (isPublicRoute(request)) {
    return
  }
  
  // Protect all other routes - require authentication
  await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files (including manifest.json)
    '/((?!_next|manifest\\.json|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
