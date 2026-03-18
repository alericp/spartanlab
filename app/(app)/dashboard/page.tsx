'use client'

/**
 * Dashboard Page - TRUE ISOLATION TEST
 * 
 * This file imports ONLY minimal dependencies needed for the shell.
 * ALL heavy dashboard imports are isolated in DashboardFullContent.tsx
 * and loaded via next/dynamic ONLY when safe mode is disabled.
 * 
 * This allows us to definitively determine if crashes are in:
 * - The app shell (Navigation, AuthGuard, PageContainer) - if safe mode crashes
 * - The dashboard content (widgets, engines) - if safe mode works but full crashes
 */

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { PageContainer, DashboardSkeleton } from '@/components/layout'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AuthGuard } from '@/components/auth/AuthGuard'

// =============================================================================
// TRUE DASHBOARD SAFE MODE FLAG
// When true: NO heavy imports are loaded at all (true isolation)
// When false: Full dashboard is dynamically loaded
// =============================================================================
const DASHBOARD_SAFE_MODE = false

// =============================================================================
// DYNAMIC IMPORT - Only loaded when safe mode is OFF
// This ensures NO heavy imports are evaluated when safe mode is ON
// =============================================================================
const DashboardFullContent = dynamic(
  () => import('@/components/dashboard/DashboardFullContent').then(mod => mod.DashboardFullContent),
  {
    loading: () => (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    ),
    ssr: false, // Disable SSR to avoid server-side import issues
  }
)

// =============================================================================
// SAFE MODE CONTENT - Minimal shell with zero heavy imports
// =============================================================================
function DashboardSafeMode() {
  return (
    <PageContainer>
      <div className="py-12 space-y-6">
        {/* Success confirmation card */}
        <div className="bg-[#1A1D23] border border-green-500/30 rounded-xl p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#E6E9EF] mb-2">TRUE Safe Mode Working</h1>
          <p className="text-[#A4ACB8] mb-4">
            This is a TRUE isolation test. NO heavy imports were loaded.
          </p>
          <ul className="text-sm text-[#6B7280] space-y-1 mb-6 text-left max-w-xs mx-auto">
            <li>Route resolution: /dashboard</li>
            <li>AuthGuard: Passed</li>
            <li>PageContainer: Rendered</li>
            <li>Navigation: Rendered</li>
            <li>Heavy imports: NOT loaded</li>
          </ul>
          <div className="bg-[#0F1115] rounded p-3 mb-4">
            <p className="text-xs text-green-400 font-mono">
              RESULT: Crash is inside DashboardFullContent or its import graph
            </p>
          </div>
          <p className="text-xs text-[#4B5563] font-mono">
            Set DASHBOARD_SAFE_MODE = false to load full dashboard
          </p>
        </div>
        
        {/* Explanation card */}
        <div className="bg-[#1A1D23] border border-[#2A2F38] rounded-xl p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-medium text-[#E6E9EF] mb-2">What This Proves</h2>
          <p className="text-sm text-[#6B7280] mb-3">
            If you see this page instead of the global error screen:
          </p>
          <ul className="text-sm text-[#6B7280] space-y-2 list-disc list-inside">
            <li>The app shell (layout, Navigation, AuthGuard) works correctly</li>
            <li>The crash is definitively inside the heavy dashboard content</li>
            <li>The DashboardFullContent.tsx file or its imports have the bug</li>
          </ul>
        </div>
      </div>
    </PageContainer>
  )
}

// =============================================================================
// ERROR FALLBACK - Shown if dashboard crashes after loading
// =============================================================================
function DashboardErrorFallback() {
  return (
    <PageContainer>
      <div className="py-12">
        <div className="bg-[#1A1D23] border border-[#2A2F38] rounded-xl p-8 text-center max-w-md mx-auto">
          <h1 className="text-xl font-semibold text-[#E6E9EF] mb-2">Dashboard Loading</h1>
          <p className="text-[#A4ACB8] text-sm mb-4">
            The dashboard is temporarily unavailable. Please try refreshing the page.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#C1121F] hover:bg-[#A30F1A]"
            size="sm"
          >
            Refresh Dashboard
          </Button>
          <p className="text-xs text-[#6B7280] mt-4">
            If this persists, please try clearing your browser cache.
          </p>
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
        {DASHBOARD_SAFE_MODE ? (
          <DashboardSafeMode />
        ) : (
          <DashboardFullContent />
        )}
      </ErrorBoundary>
    </AuthGuard>
  )
}
