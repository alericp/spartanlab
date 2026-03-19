'use client'

/**
 * DashboardFullContent - Import-Isolated Dashboard Implementation
 * 
 * TRUE IMPORT ISOLATION: This file contains ONLY minimal imports.
 * Heavy dashboard modules are loaded via dynamic import ONLY when their
 * section flags are enabled. This prevents import-time crashes from
 * disabled sections.
 */

import { useState, useEffect, Suspense, lazy, ComponentType } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  PageContainer, 
  SectionStack, 
  DashboardSkeleton 
} from '@/components/layout'
import { useAuth } from '@clerk/nextjs'

// =============================================================================
// SECTION ISOLATION FLAGS - Binary search for crash isolation
// Set sections to false to disable them and narrow down the crash source
// =============================================================================
const ENABLE_SECTION_HEADER = true           // Dashboard intro/header - MINIMAL

// =============================================================================
// WIDGET ISOLATION FLAGS - Fine-grained control for header widgets
// These can be toggled independently to isolate which widget causes issues
// =============================================================================
const ENABLE_WIDGET_WELCOME_BANNER = true    // WelcomeBanner widget
const ENABLE_WIDGET_WELCOME_CARD = true      // WelcomeCard widget
const ENABLE_SECTION_FIRST_RUN = false       // First run guide
const ENABLE_SECTION_NEXT_WORKOUT = false    // Next workout card
const ENABLE_SECTION_CONSISTENCY = false     // Training consistency
const ENABLE_SECTION_READINESS = false       // Daily readiness + program snapshot
const ENABLE_SECTION_TRAINING_EMPHASIS = false // Training emphasis + progression insights
const ENABLE_SECTION_SKILL_PROGRESS = false  // Skill progress section + heatmap
const ENABLE_SECTION_SKILL_READINESS = false // Skill readiness panel
const ENABLE_SECTION_ROADMAPS = false        // Skill roadmaps
const ENABLE_SECTION_ACHIEVEMENTS = false    // Achievements card
const ENABLE_SECTION_CHALLENGES = false      // Challenges card + H2H
const ENABLE_SECTION_LEADERBOARD = false     // Leaderboard preview
const ENABLE_SECTION_GOAL_PROJECTIONS = false // Goal timeline projections
const ENABLE_SECTION_DETAILED_INSIGHTS = false // Detailed analysis section
const ENABLE_SECTION_STRENGTH_PROGRESS = false // Strength progress cards
const ENABLE_SECTION_PROGRESS_TRACKING = false // Progress dashboard
const ENABLE_SECTION_PERFORMANCE_OVERVIEW = false // Spartan score + forecast
const ENABLE_SECTION_QUICK_ACTIONS = false   // Quick actions + vault
const ENABLE_SECTION_NOTIFICATIONS = false   // Achievement/challenge notifications

// Check if ANY heavy section is enabled - only then load heavy content
const ANY_HEAVY_SECTION_ENABLED = 
  ENABLE_SECTION_FIRST_RUN ||
  ENABLE_SECTION_NEXT_WORKOUT ||
  ENABLE_SECTION_CONSISTENCY ||
  ENABLE_SECTION_READINESS ||
  ENABLE_SECTION_TRAINING_EMPHASIS ||
  ENABLE_SECTION_SKILL_PROGRESS ||
  ENABLE_SECTION_SKILL_READINESS ||
  ENABLE_SECTION_ROADMAPS ||
  ENABLE_SECTION_ACHIEVEMENTS ||
  ENABLE_SECTION_CHALLENGES ||
  ENABLE_SECTION_LEADERBOARD ||
  ENABLE_SECTION_GOAL_PROJECTIONS ||
  ENABLE_SECTION_DETAILED_INSIGHTS ||
  ENABLE_SECTION_STRENGTH_PROGRESS ||
  ENABLE_SECTION_PROGRESS_TRACKING ||
  ENABLE_SECTION_PERFORMANCE_OVERVIEW ||
  ENABLE_SECTION_QUICK_ACTIONS ||
  ENABLE_SECTION_NOTIFICATIONS

// =============================================================================
// MINIMAL HEADER-ONLY IMPORTS (only loaded when header section enabled)
// =============================================================================

// These are lightweight components needed for header only
const SafeWidget = dynamic(() => import('@/components/shared/WidgetErrorBoundary').then(m => ({ default: m.SafeWidget })), { ssr: false })
const WelcomeBanner = dynamic(() => import('@/components/dashboard/WelcomeBanner').then(m => ({ default: m.WelcomeBanner })), { ssr: false })
const WelcomeCard = dynamic(() => import('@/components/dashboard/WelcomeCard').then(m => ({ default: m.WelcomeCard })), { ssr: false })
const DashboardIntroduction = dynamic(() => import('@/components/dashboard/DashboardIntroduction').then(m => ({ default: m.DashboardIntroduction })), { ssr: false })
const HowSpartanLabWorksButton = dynamic(() => import('@/components/dashboard/DashboardIntroduction').then(m => ({ default: m.HowSpartanLabWorksButton })), { ssr: false })
const TrainingSystemsLink = dynamic(() => import('@/components/dashboard/DashboardIntroduction').then(m => ({ default: m.TrainingSystemsLink })), { ssr: false })
const SubscriptionTierBadge = dynamic(() => import('@/components/premium/PremiumFeature').then(m => ({ default: m.SubscriptionTierBadge })), { ssr: false })
const DashboardEmptyState = dynamic(() => import('@/components/shared/EmptyStates').then(m => ({ default: m.DashboardEmptyState })), { ssr: false })

// =============================================================================
// HEAVY DASHBOARD CONTENT - Only loaded when ANY_HEAVY_SECTION_ENABLED
// =============================================================================

// Dynamic import of the heavy dashboard content module
const DashboardHeavyContent = ANY_HEAVY_SECTION_ENABLED 
  ? dynamic(() => import('./DashboardHeavyContent'), { 
      ssr: false,
      loading: () => <DashboardSkeleton />
    })
  : null

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
        
        {/* SECTION: HEADER - Minimal dashboard confirmation */}
        {ENABLE_SECTION_HEADER && (
          <Suspense fallback={<div className="h-32 bg-[#1A1D23] rounded-xl animate-pulse" />}>
            {/* Welcome Banner for Post-Onboarding */}
            {ENABLE_WIDGET_WELCOME_BANNER && (
              <SafeWidget name="WelcomeBanner" hideOnError>
                <WelcomeBanner />
              </SafeWidget>
            )}
            
            {/* Welcome Card for First-Run Users */}
            {showWelcome && ENABLE_WIDGET_WELCOME_CARD && (
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
            
            {/* Import Isolation confirmation */}
            <div className="bg-[#1A1D23] border border-green-500/30 rounded-xl p-6 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#E6E9EF] mb-1">Dashboard Shell Loaded</h2>
              <p className="text-sm text-[#6B7280]">
                TRUE import isolation active. Heavy modules NOT imported.
              </p>
              <p className="text-xs text-[#4B5563] mt-2 font-mono">
                ENABLE_SECTION_HEADER = true | ANY_HEAVY_SECTION_ENABLED = {String(ANY_HEAVY_SECTION_ENABLED)}
              </p>
            </div>
          </Suspense>
        )}
        
        {/* HEAVY SECTIONS - Only rendered if any heavy section is enabled */}
        {ANY_HEAVY_SECTION_ENABLED && DashboardHeavyContent && (
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardHeavyContent 
              showWelcome={showWelcome}
              setShowWelcome={setShowWelcome}
              showIntroduction={showIntroduction}
              setShowIntroduction={setShowIntroduction}
              sectionFlags={{
                ENABLE_SECTION_FIRST_RUN,
                ENABLE_SECTION_NEXT_WORKOUT,
                ENABLE_SECTION_CONSISTENCY,
                ENABLE_SECTION_READINESS,
                ENABLE_SECTION_TRAINING_EMPHASIS,
                ENABLE_SECTION_SKILL_PROGRESS,
                ENABLE_SECTION_SKILL_READINESS,
                ENABLE_SECTION_ROADMAPS,
                ENABLE_SECTION_ACHIEVEMENTS,
                ENABLE_SECTION_CHALLENGES,
                ENABLE_SECTION_LEADERBOARD,
                ENABLE_SECTION_GOAL_PROJECTIONS,
                ENABLE_SECTION_DETAILED_INSIGHTS,
                ENABLE_SECTION_STRENGTH_PROGRESS,
                ENABLE_SECTION_PROGRESS_TRACKING,
                ENABLE_SECTION_PERFORMANCE_OVERVIEW,
                ENABLE_SECTION_QUICK_ACTIONS,
                ENABLE_SECTION_NOTIFICATIONS,
              }}
            />
          </Suspense>
        )}
        
      </SectionStack>
    </PageContainer>
  )
}
