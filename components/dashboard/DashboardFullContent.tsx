'use client'

/**
 * DashboardFullContent - Main Dashboard Implementation
 * 
 * Uses dynamic imports for components to enable bundle splitting and
 * prevent module-level crashes from cascading.
 */

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { 
  PageContainer, 
  SectionStack, 
  DashboardSkeleton 
} from '@/components/layout'
import { useAuth } from '@clerk/nextjs'

// =============================================================================
// DYNAMIC IMPORTS - Bundle-split dashboard components
// =============================================================================
const SafeWidget = dynamic(() => import('@/components/shared/WidgetErrorBoundary').then(m => ({ default: m.SafeWidget })), { ssr: false })
const WelcomeBanner = dynamic(() => import('@/components/dashboard/WelcomeBanner').then(m => ({ default: m.WelcomeBanner })), { ssr: false })
const WelcomeCard = dynamic(() => import('@/components/dashboard/WelcomeCard').then(m => ({ default: m.WelcomeCard })), { ssr: false })
const DashboardIntroduction = dynamic(() => import('@/components/dashboard/DashboardIntroduction').then(m => ({ default: m.DashboardIntroduction })), { ssr: false })
const HowSpartanLabWorksButton = dynamic(() => import('@/components/dashboard/DashboardIntroduction').then(m => ({ default: m.HowSpartanLabWorksButton })), { ssr: false })
const TrainingSystemsLink = dynamic(() => import('@/components/dashboard/DashboardIntroduction').then(m => ({ default: m.TrainingSystemsLink })), { ssr: false })
const SubscriptionTierBadge = dynamic(() => import('@/components/premium/PremiumFeature').then(m => ({ default: m.SubscriptionTierBadge })), { ssr: false })
const DashboardEmptyState = dynamic(() => import('@/components/shared/EmptyStates').then(m => ({ default: m.DashboardEmptyState })), { ssr: false })
const DashboardHeavyContent = dynamic(() => import('./DashboardHeavyContent'), { 
  ssr: false,
  loading: () => <DashboardSkeleton />
})

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DashboardFullContent() {
  const { isLoaded: isAuthLoaded } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showIntroduction, setShowIntroduction] = useState(false)
  const [hasMeaningfulData, setHasMeaningfulData] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
    console.log('[DashboardFullContent] Mounted, checking first-load state')
    
    // Check if this is a first-run welcome scenario
    // CRITICAL: Welcome detection happens FIRST and takes priority
    let isWelcomeFlow = false
    try {
      if (typeof window !== 'undefined' && window.location?.search) {
        const urlParams = new URLSearchParams(window.location.search)
        isWelcomeFlow = urlParams.get('welcome') === 'true'
        
        if (isWelcomeFlow) {
          console.log('[DashboardFullContent] Welcome flow detected via ?welcome=true, setting showWelcome=true')
          setShowWelcome(true)
          try {
            window.history.replaceState({}, '', '/dashboard')
          } catch {
            // history.replaceState may fail in some contexts, ignore
          }
        }
      }
    } catch (err) {
      console.error('[DashboardFullContent] Error parsing URL params (non-fatal):', err)
    }
    
    // Quick check for meaningful data (lightweight)
    // FIX: Use correct storage key 'spartanlab_workout_logs' (matches workout-log-service.ts)
    // Also check legacy key 'spartanlab_workouts' for backward compatibility
    try {
      if (typeof window === 'undefined') {
        // If welcome flow is active, don't short-circuit to empty state
        setHasMeaningfulData(isWelcomeFlow ? true : false)
        return
      }
      
      // Check canonical key first
      let workouts: unknown[] = []
      const storedLogs = localStorage.getItem('spartanlab_workout_logs')
      if (storedLogs) {
        try {
          const parsed = JSON.parse(storedLogs)
          workouts = Array.isArray(parsed) ? parsed : []
        } catch {
          workouts = []
        }
      }
      
      // Also check legacy key for backward compatibility
      if (workouts.length === 0) {
        const storedLegacy = localStorage.getItem('spartanlab_workouts')
        if (storedLegacy) {
          try {
            const parsed = JSON.parse(storedLegacy)
            workouts = Array.isArray(parsed) ? parsed : []
          } catch {
            workouts = []
          }
        }
      }
      
      const hasData = workouts.length > 0
      console.log('[DashboardFullContent] Data check:', { 
        hasData, 
        workoutCount: workouts.length, 
        isWelcomeFlow,
        branch: isWelcomeFlow ? 'welcome-flow' : (hasData ? 'content' : 'empty-state')
      })
      
      // CRITICAL: If welcome flow is active, treat as having data to prevent empty-state preemption
      // This ensures the welcome experience renders before empty-state logic takes over
      setHasMeaningfulData(isWelcomeFlow ? true : hasData)
    } catch (err) {
      console.error('[DashboardFullContent] Error checking workout data:', err)
      // On error, allow welcome flow to proceed, otherwise default to empty-state
      setHasMeaningfulData(isWelcomeFlow ? true : false)
    }
  }, [])

  // Loading state
  if (!mounted || !isAuthLoaded) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    )
  }

  // Show empty state for first-time users (only if we've checked data)
  if (hasMeaningfulData === false) {
    return (
      <PageContainer>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardEmptyState />
        </Suspense>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SectionStack gap="xl">
        
        {/* Welcome Banner for Post-Onboarding */}
        <Suspense fallback={<div className="h-32 bg-[#1A1D23] rounded-xl animate-pulse" />}>
          <SafeWidget name="WelcomeBanner" hideOnError>
            <WelcomeBanner />
          </SafeWidget>
          
          {/* Welcome Card for First-Run Users */}
          {showWelcome && (
            <SafeWidget name="WelcomeCard" hideOnError>
              <WelcomeCard 
                onDismiss={() => setShowWelcome(false)}
              />
            </SafeWidget>
          )}
          
          {/* Dashboard Introduction for New Users */}
          {!showWelcome && (
            <SafeWidget name="DashboardIntroduction" hideOnError>
              <DashboardIntroduction 
                forceShow={showIntroduction}
                onComplete={() => setShowIntroduction(false)}
              />
            </SafeWidget>
          )}
          
          {/* Dashboard Header with Intelligence Explanation */}
          {!showWelcome && (
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <p className="text-sm text-[#6B7280] max-w-xl">
                  Your training data is analyzed to identify what limits your progress and how to solve it.
                </p>
                <SubscriptionTierBadge className="hidden sm:inline-flex" />
              </div>
              <div className="hidden sm:flex items-center gap-4 shrink-0">
                <TrainingSystemsLink />
                <HowSpartanLabWorksButton 
                  onOpen={() => setShowIntroduction(true)} 
                />
              </div>
            </div>
          )}
        </Suspense>
        
        {/* Heavy Dashboard Sections */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardHeavyContent 
            showWelcome={showWelcome}
            setShowWelcome={setShowWelcome}
            showIntroduction={showIntroduction}
            setShowIntroduction={setShowIntroduction}
          />
        </Suspense>
        
      </SectionStack>
    </PageContainer>
  )
}
