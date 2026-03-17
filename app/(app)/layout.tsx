import { ClerkProvider } from '@clerk/nextjs'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { GlobalErrorBoundary } from '@/components/shared/GlobalErrorBoundary'
import { OwnerSimulationToggleWrapper } from '@/components/billing/OwnerSimulationToggleWrapper'
import { Toaster } from '@/components/ui/toaster'

/**
 * AUTHENTICATED App Route Group Layout
 * 
 * This layout wraps all authenticated application routes that require Clerk auth.
 * 
 * CRITICAL: Only routes that REQUIRE authentication should be in this group.
 * This layout includes ClerkProvider and auth-aware components.
 * 
 * Pages in this group:
 * - Dashboard (/dashboard)
 * - User programs (/program, /programs when viewing user's programs)
 * - Training pages (/today, /week, /workouts, /workout/*)
 * - History (/history/*)
 * - Performance (/performance, /prs, /strength)
 * - Settings (/settings)
 * - Upgrade (/upgrade)
 * - Onboarding (/onboarding/*)
 * - User-specific pages (/goals, /achievements, /recovery, /results, etc.)
 * - Sign-in/Sign-up pages (/sign-in, /sign-up)
 * 
 * DO NOT add public/SEO pages to this group - they belong in (public).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <AnalyticsProvider>
        <GlobalErrorBoundary>
          {children}
          {/* Owner-only simulation toggle - for testing billing states */}
          <OwnerSimulationToggleWrapper />
          <Toaster />
        </GlobalErrorBoundary>
      </AnalyticsProvider>
    </ClerkProvider>
  )
}
