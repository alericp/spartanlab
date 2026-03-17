import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { GlobalErrorBoundary } from '@/components/shared/GlobalErrorBoundary'
import { Toaster } from '@/components/ui/toaster'

/**
 * PUBLIC Route Group Layout
 * 
 * This layout wraps ALL public SEO/marketing pages that must be prerenderable.
 * 
 * CRITICAL: This layout does NOT include ClerkProvider or any auth-aware components.
 * This ensures all pages in this route group can be statically generated at build time.
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
 * - Any component that uses useAuth, useUser, or Clerk hooks
 * - Any component that requires auth context during SSR
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AnalyticsProvider>
      <GlobalErrorBoundary>
        {children}
        <Toaster />
      </GlobalErrorBoundary>
    </AnalyticsProvider>
  )
}
