/**
 * PUBLIC Route Group Layout - Minimal Server-Safe Shell
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
 * DO NOT add to this layout:
 * - ClerkProvider
 * - OwnerSimulationToggleWrapper
 * - AnalyticsProvider (already in root layout)
 * - GlobalErrorBoundary (client component - use in app layout only)
 * - Toaster (client component - use in app layout only)
 * - Any component that uses useAuth, useUser, or Clerk hooks
 * - Any component that requires auth context during SSR
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Pure pass-through - no client wrappers for maximum prerender safety
  return <>{children}</>
}
