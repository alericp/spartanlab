/**
 * PUBLIC Route Group Layout - Minimal Server-Safe Shell
 * 
 * =============================================================================
 * REGRESSION GUARD: PUBLIC PRERENDER SAFETY - DO NOT BREAK BUILD
 * =============================================================================
 * 
 * This layout wraps ALL public SEO/marketing pages that must be prerenderable.
 * 
 * CRITICAL ARCHITECTURAL DECISIONS:
 * 
 * 1. This layout is a PURE PASS-THROUGH with NO client components.
 *    - AnalyticsProvider is already in root layout - no need to duplicate
 *    - GlobalErrorBoundary is moved to (app) layout only (authenticated routes need it more)
 *    - Toaster is moved to (app) layout only (public pages don't show toasts)
 * 
 * 2. This ensures all pages in this route group can be statically generated at build time
 *    with the smallest possible client-side JavaScript bundle.
 * 
 * 3. Public SEO pages should use server components where possible, with small
 *    client islands for interactivity (calculators, forms, etc.)
 * 
 * Pages in this group:
 * - Landing/marketing pages (/, /pricing, /features, /how-it-works, etc.)
 * - SEO content pages (/guides/*, /tools/*, /calculators/*, etc.)
 * - Strength standards pages (/calisthenics-strength-standards, etc.)
 * - Calculator pages (/*-readiness-calculator, /*-calculator, etc.)
 * - Progression pages (/*-progression)
 * - Static program info pages (/programs/*-program)
 * - Legal pages (/terms, /privacy, /about)
 * 
 * =============================================================================
 * REGRESSION PREVENTION: DO NOT ADD THESE TO THIS LAYOUT OR ITS CHILDREN
 * =============================================================================
 * 
 * The following will BREAK the build if added directly to public pages:
 * - ClerkProvider (requires client context)
 * - OwnerSimulationToggleWrapper (requires auth)
 * - Any component that uses useAuth, useUser, useClerk hooks
 * - Any component that imports from @clerk/nextjs directly
 * - GlobalErrorBoundary (client component)
 * - Toaster (client component)
 * 
 * If you need auth-aware behavior on a public page:
 * 1. Keep the page itself a server component
 * 2. Create a client island component that checks auth
 * 3. Do NOT import auth hooks at the page level
 * 4. Test build locally with `npm run build` before committing
 * 
 * Previous build failures were caused by:
 * - Importing useAuth/useUser in pricing/page.tsx
 * - Importing ToolConversionCardClient (which used useAuth) in SEO pages
 * - Adding ClerkProvider to this layout
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Pure pass-through - no client wrappers for maximum prerender safety
  return <>{children}</>
}
