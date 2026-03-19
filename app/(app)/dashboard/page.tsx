'use client'

/**
 * Dashboard Page - Protected entry point
 * 
 * Uses dynamic import for DashboardFullContent to enable bundle splitting.
 * All heavy imports are isolated in DashboardFullContent.tsx.
 */

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { PageContainer, DashboardSkeleton } from '@/components/layout'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AuthGuard } from '@/components/auth/AuthGuard'

// =============================================================================
// DYNAMIC IMPORT - Bundle-split the dashboard content
// =============================================================================
const DashboardFullContent = dynamic(
  () => import('@/components/dashboard/DashboardFullContent').then(mod => mod.DashboardFullContent),
  {
    loading: () => (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    ),
    ssr: false,
  }
)

// =============================================================================
// ERROR FALLBACK - Shown if dashboard crashes after loading
// =============================================================================
function DashboardErrorFallback() {
  return (
    <PageContainer>
      <div className="py-12">
        <div className="bg-[#1A1D23] border border-[#2A2F38] rounded-xl p-8 text-center max-w-md mx-auto">
          <h1 className="text-xl font-semibold text-[#E6E9EF] mb-2">Something went wrong</h1>
          <p className="text-[#A4ACB8] text-sm mb-4">
            We had trouble loading your dashboard. Please try refreshing the page.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#C1121F] hover:bg-[#A30F1A]"
            size="sm"
          >
            Refresh Dashboard
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}

// =============================================================================
// DASHBOARD PAGE - Protected entry point
// =============================================================================
export default function DashboardPage() {
  return (
    <AuthGuard redirectTo="/sign-in">
      <ErrorBoundary fallback={<DashboardErrorFallback />}>
        <DashboardFullContent />
      </ErrorBoundary>
    </AuthGuard>
  )
}
