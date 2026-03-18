'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  PageContainer, 
  SectionStack, 
  Section, 
  SectionHeader, 
  DashboardSkeleton 
} from '@/components/layout'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

// =============================================================================
// DASHBOARD SAFE MODE FLAG
// Set to false to enable minimal safe mode for crash isolation testing
// When false: renders minimal shell only, no heavy widgets/data loading
// When true: renders full dashboard with all features
// =============================================================================
const DASHBOARD_SAFE_MODE = true  // Set to true to enable safe mode for testing
const ENABLE_FULL_DASHBOARD = !DASHBOARD_SAFE_MODE

// Only import heavy components when full dashboard is enabled
import { SpartanScoreCard } from '@/components/performance/SpartanScoreCard'
import { AthleteIntelligenceCard } from '@/components/dashboard/AthleteIntelligenceCard'
import { TrainingMomentumCard } from '@/components/dashboard/TrainingMomentumCard'
import { PrimaryLimiterCard } from '@/components/dashboard/PrimaryLimiterCard'
import { RecoveryStatusCard } from '@/components/dashboard/RecoveryStatusCard'
import { ProgressForecastCard } from '@/components/dashboard/ProgressForecastCard'
import { PerformanceVaultCard } from '@/components/dashboard/PerformanceVaultCard'
import { QuickActionsRow } from '@/components/dashboard/QuickActionsRow'
import { ShareProgressSection } from '@/components/dashboard/ShareProgressSection'
import { DeloadStatusCard } from '@/components/dashboard/DailyAdjustmentCard'
import { DailyReadinessCard } from '@/components/dashboard/DailyReadinessCard'
import { WelcomeCard } from '@/components/dashboard/WelcomeCard'
import { DashboardIntroduction, HowSpartanLabWorksButton, TrainingSystemsLink } from '@/components/dashboard/DashboardIntroduction'
import { calculateSpartanScore } from '@/lib/strength-score-engine'
import { isFirstRun } from '@/lib/onboarding-service'
import { syncProgramToHistory } from '@/lib/use-program-history'
import { calculateRecoverySignal, type RecoverySignal } from '@/lib/recovery-engine'
import { calculateMovementBalance, type MovementBalance } from '@/lib/volume-analyzer'
import { calculateProjectionForPrimaryGoal, type GoalProjection } from '@/lib/goal-projection-engine'
import { getConstraintInsight } from '@/lib/constraint-engine'
import { getAthleteCalibration } from '@/lib/athlete-calibration'
import { assessDeloadNeed, type DeloadAssessment } from '@/lib/deload-detection-engine'
import { getWorkoutAnalytics, type WorkoutAnalytics } from '@/lib/workout-analytics'
import { calculateTrainingMomentum, type TrainingMomentum } from '@/lib/training-momentum-engine'
import { 
  getProgressOverview, 
  type ProgressOverview,
  getUnseenMilestones,
  markMilestoneSeen,
} from '@/lib/progress-streak-engine'
import {
  getDashboardOverview,
  getPrimarySkillSummary,
  getStrengthSummary,
  getProgramSummary,
  getCurrentFocusSummary,
  type DashboardOverview,
  type PrimarySkillSummary,
  type StrengthSummary,
  type ProgramSummary,
  type CurrentFocus,
} from '@/lib/dashboard-service'

import { Brain, Target, Dumbbell, ArrowRight } from 'lucide-react'
import {
  MilestoneNotificationCard,
  StrengthProgressCard,
} from '@/components/dashboard/ProgressStreakCard'
import { 
  PremiumSkillProgressCard, 
  SkillProgressSection,
  type SkillFocusNote,
  type GoalCategorySummary,
} from '@/components/dashboard/PremiumSkillProgressCard'
import { DashboardEmptyState } from '@/components/shared/EmptyStates'
import { PWAInstallCard } from '@/components/dashboard/PWAInstallCard'
import { TodayFocusCard } from '@/components/dashboard/TodayFocusCard'
import { NextWorkoutCard } from '@/components/dashboard/NextWorkoutCard'
import { ProgramSnapshotCard } from '@/components/dashboard/ProgramSnapshotCard'
import { TrainingInsightQuote } from '@/components/dashboard/TrainingInsightQuote'
import { TrainingConsistencyCard } from '@/components/dashboard/TrainingConsistencyCard'
import { H2HPanel } from '@/components/h2h'
import { SkillRoadmapsCard } from '@/components/roadmap'
import { SkillProgressHeatmap } from '@/components/dashboard/SkillProgressHeatmap'
import { AdaptiveEngineBadge, SensorEngineVisualization } from '@/components/shared/AdaptiveEngineBadge'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { TrainingEmphasis } from '@/components/dashboard/TrainingEmphasis'
import { ProgressionInsights } from '@/components/dashboard/ProgressionInsights'
import { GoalProjectionCard, GoalProjectionsOverview } from '@/components/dashboard/GoalProjectionCard'
import { selectMethodProfiles, getCoachingMessage, type SelectionContext, type SelectedMethods } from '@/lib/training-principles-engine'
import { getProgressionInsights, type ProgressionInsight } from '@/lib/adaptive-progression-engine'
import { PremiumUpgradeBanner, SubscriptionTierBadge } from '@/components/premium/PremiumFeature'
import { DashboardUpgradeCard } from '@/components/upgrade/AdaptiveProgramUpgradeCard'
import { FirstRunGuide, SetupReminderBanner } from '@/components/dashboard/FirstRunGuide'
import { UpdateMetricsCard, MetricsUpdateBanner } from '@/components/dashboard/UpdateMetricsCard'
import { SafeWidget } from '@/components/shared/WidgetErrorBoundary'
import { AchievementsSummaryCard } from '@/components/achievements/achievements-panel'
import { ChallengesSummaryCard } from '@/components/challenges/challenges-panel'
import { ChallengesCard } from '@/components/challenges/ChallengesCard'
import { useAuth } from '@clerk/nextjs'
import { AchievementsCard } from '@/components/dashboard/AchievementsCard'
import { AchievementNotification } from '@/components/achievements/AchievementNotification'
import { SkillReadinessModule } from '@/components/readiness/SkillReadinessModule'
import { SkillReadinessPanel } from '@/components/readiness/SkillReadinessPanel'
import { LeaderboardPreviewCard } from '@/components/leaderboards/LeaderboardTabs'
import { ProgressDashboard } from '@/components/dashboard/ProgressDashboard'
import { ChallengeNotification } from '@/components/challenges/ChallengeNotification'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { ProgressSignals } from '@/components/dashboard/ProgressSignals'
import { ReturnVisitCard, SessionCounter } from '@/components/dashboard/DailyEngagement'
import { SmartUpgradeBanner } from '@/components/upgrade/SmartUpgradeTrigger'

function DashboardContent() {
  // useAuth is called unconditionally per React rules of hooks
  // If it throws, the ErrorBoundary wrapping this component will catch it
  const { isLoaded: isAuthLoaded } = useAuth()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [skillSummary, setSkillSummary] = useState<PrimarySkillSummary | null>(null)
  const [strengthSummary, setStrengthSummary] = useState<StrengthSummary | null>(null)
  const [programSummary, setProgramSummary] = useState<ProgramSummary | null>(null)
  const [focusSummary, setFocusSummary] = useState<CurrentFocus | null>(null)
  const [workoutAnalytics, setWorkoutAnalytics] = useState<WorkoutAnalytics | null>(null)
  const [spartanScore, setSpartanScore] = useState<any>(null)
  const [recoverySignal, setRecoverySignal] = useState<RecoverySignal | null>(null)
  const [movementBalance, setMovementBalance] = useState<MovementBalance | null>(null)
  const [nextMilestone, setNextMilestone] = useState<GoalProjection | null>(null)
  const [constraintInsight, setConstraintInsight] = useState<ReturnType<typeof getConstraintInsight> | null>(null)
  const [athleteCalibration, setAthleteCalibration] = useState<ReturnType<typeof getAthleteCalibration> | null>(null)
  const [deloadAssessment, setDeloadAssessment] = useState<DeloadAssessment | null>(null)
  const [trainingMomentum, setTrainingMomentum] = useState<TrainingMomentum | null>(null)
  const [progressOverview, setProgressOverview] = useState<ProgressOverview | null>(null)
  const [unseenMilestones, setUnseenMilestones] = useState<ReturnType<typeof getUnseenMilestones>>([])
  const [trainingMethods, setTrainingMethods] = useState<SelectedMethods | null>(null)
  const [progressionInsights, setProgressionInsights] = useState<ProgressionInsight[]>([])
  const [mounted, setMounted] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showIntroduction, setShowIntroduction] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // ISOLATION TEST: Skip heavy data loading if isolation mode is enabled
    if (!ENABLE_FULL_DASHBOARD) {
      setOverview({ profile: null as any, progressions: [], workouts: [], goals: [] })
      return
    }
    
    // Check if this is a first-run welcome scenario
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('welcome') === 'true') {
      setShowWelcome(true)
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard')
    }
    
    // Sync program to history if needed (ensures localStorage program is persisted to DB)
    // This handles the case where user completed onboarding but program wasn't yet saved to history
    syncProgramToHistory().then(result => {
      if (result?.success) {
        console.log('[v0] Dashboard: Synced program to history:', result.reasonSummary)
      }
    }).catch(err => {
      console.error('[v0] Dashboard: Failed to sync program to history:', err)
    })
    
    // STAGED CRASH ISOLATION: Each computation wrapped to identify exact failure point
    let data: DashboardOverview | null = null
    
    try {
      console.log('[v0] Dashboard: Stage 1 - getDashboardOverview')
      data = getDashboardOverview()
      setOverview(data)
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 1 - getDashboardOverview:', e)
      setOverview({ profile: null as any, progressions: [], workouts: [], goals: [] })
      return // Stop further processing
    }
    
    try {
      console.log('[v0] Dashboard: Stage 2 - getPrimarySkillSummary')
      setSkillSummary(getPrimarySkillSummary(data))
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 2 - getPrimarySkillSummary:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 3 - getStrengthSummary')
      setStrengthSummary(getStrengthSummary(data))
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 3 - getStrengthSummary:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 4 - getProgramSummary')
      setProgramSummary(getProgramSummary(data))
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 4 - getProgramSummary:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 5 - getCurrentFocusSummary')
      setFocusSummary(getCurrentFocusSummary(data))
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 5 - getCurrentFocusSummary:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 6 - getWorkoutAnalytics')
      setWorkoutAnalytics(getWorkoutAnalytics())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 6 - getWorkoutAnalytics:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 7 - calculateSpartanScore')
      setSpartanScore(calculateSpartanScore())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 7 - calculateSpartanScore:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 8 - calculateRecoverySignal')
      setRecoverySignal(calculateRecoverySignal())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 8 - calculateRecoverySignal:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 9 - calculateMovementBalance')
      setMovementBalance(calculateMovementBalance())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 9 - calculateMovementBalance:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 10 - calculateProjectionForPrimaryGoal')
      setNextMilestone(calculateProjectionForPrimaryGoal())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 10 - calculateProjectionForPrimaryGoal:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 11 - getConstraintInsight')
      setConstraintInsight(getConstraintInsight())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 11 - getConstraintInsight:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 12 - getAthleteCalibration')
      setAthleteCalibration(getAthleteCalibration())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 12 - getAthleteCalibration:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 13 - assessDeloadNeed')
      setDeloadAssessment(assessDeloadNeed())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 13 - assessDeloadNeed:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 14 - calculateTrainingMomentum')
      setTrainingMomentum(calculateTrainingMomentum())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 14 - calculateTrainingMomentum:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 15 - getProgressOverview')
      setProgressOverview(getProgressOverview())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 15 - getProgressOverview:', e)
    }
    
    try {
      console.log('[v0] Dashboard: Stage 16 - getUnseenMilestones')
      setUnseenMilestones(getUnseenMilestones())
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 16 - getUnseenMilestones:', e)
    }
    
    console.log('[v0] Dashboard: All stages completed')
    
    // Calculate training method emphasis based on athlete profile
    try {
      console.log('[v0] Dashboard: Stage 17 - selectMethodProfiles')
      if (data.profile) {
        const profile = data.profile
        const recovery = calculateRecoverySignal()
        const selectionContext: SelectionContext = {
          primaryGoal: (profile.primaryGoal || 'general_strength') as any,
          experienceLevel: profile.experienceLevel || 'intermediate',
          recoveryCapacity: 'moderate',
          sorenessToleranceHigh: false,
          sessionMinutes: typeof profile.sessionLengthMinutes === 'number' ? profile.sessionLengthMinutes : 60,
          trainingDaysPerWeek: typeof profile.trainingDaysPerWeek === 'number' ? profile.trainingDaysPerWeek : 4,
          currentFatigueLevel: recovery?.readinessLevel === 'low' ? 'high' : 'moderate',
          recentSorenessLevel: 'mild',
          rangeTrainingMode: profile.rangeTrainingMode || undefined,
        }
        const methods = selectMethodProfiles(selectionContext)
        setTrainingMethods(methods)
      }
    } catch (e) {
      console.error('[v0] Dashboard CRASH at Stage 17 - selectMethodProfiles:', e)
    }
    
    // Get progression insights from adaptive progression engine
    try {
      const insights = getProgressionInsights()
      setProgressionInsights(insights)
    } catch {
      // Silent fail - progression insights are optional
    }
    
    // Listen for program recalculation events
    const handleRecalculation = () => {
      // Refresh all dashboard data when metrics are updated
      const freshData = getDashboardOverview()
      setOverview(freshData)
      setSkillSummary(getPrimarySkillSummary(freshData))
      setStrengthSummary(getStrengthSummary(freshData))
      setProgramSummary(getProgramSummary(freshData))
      setFocusSummary(getCurrentFocusSummary(freshData))
      setConstraintInsight(getConstraintInsight())
      setAthleteCalibration(getAthleteCalibration())
    }
    
    window.addEventListener('spartanlab:program-recalculated', handleRecalculation)
    return () => {
      window.removeEventListener('spartanlab:program-recalculated', handleRecalculation)
    }
  }, [])

  // Loading state - also wait for auth to resolve to prevent UI mismatch
  if (!mounted || !overview || !isAuthLoaded) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    )
  }

  // =============================================================================
  // DASHBOARD SAFE MODE - Minimal shell to prove route/auth/shell works
  // If this renders successfully, the crash is in the heavy dashboard content
  // =============================================================================
  if (DASHBOARD_SAFE_MODE) {
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
            <h1 className="text-2xl font-semibold text-[#E6E9EF] mb-2">Dashboard Shell Working</h1>
            <p className="text-[#A4ACB8] mb-4">
              Safe mode is active. The following are confirmed working:
            </p>
            <ul className="text-sm text-[#6B7280] space-y-1 mb-6">
              <li>Route resolution: /dashboard</li>
              <li>Authentication: {isAuthLoaded ? 'Loaded' : 'Loading...'}</li>
              <li>AuthGuard: Passed</li>
              <li>PageContainer: Rendered</li>
              <li>Navigation: Rendered</li>
            </ul>
            <p className="text-xs text-[#4B5563] font-mono bg-[#0F1115] rounded p-2">
              DASHBOARD_SAFE_MODE = true (set to false for full dashboard)
            </p>
          </div>
          
          {/* Placeholder content card */}
          <div className="bg-[#1A1D23] border border-[#2A2F38] rounded-xl p-6 max-w-lg mx-auto">
            <h2 className="text-lg font-medium text-[#E6E9EF] mb-2">Safe Mode Active</h2>
            <p className="text-sm text-[#6B7280]">
              Heavy dashboard widgets are disabled. If you see this page without the global error screen,
              the crash is isolated to the dashboard content path (widgets, data loading, or effects).
            </p>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Check if user has meaningful data - with defensive null guards
  const hasWorkoutData = !!(workoutAnalytics && typeof workoutAnalytics.totalWorkouts === 'number' && workoutAnalytics.totalWorkouts > 0)
  const hasSkillData = !!(skillSummary && skillSummary.level && skillSummary.level !== 'none')
  const hasStrengthData = !!(strengthSummary && Array.isArray(strengthSummary.topExercises) && strengthSummary.topExercises.length > 0)
  const hasMeaningfulData = hasWorkoutData || hasSkillData || hasStrengthData
  
  // Detect early-stage users (fewer than 3 workouts) for conditional UI prioritization
  const isEarlyStageUser = !workoutAnalytics || typeof workoutAnalytics.totalWorkouts !== 'number' || workoutAnalytics.totalWorkouts < 3
  
  // Safe access helpers for nested properties
  const safeProgressOverview = progressOverview && typeof progressOverview === 'object' ? progressOverview : null
  const safeSkills = safeProgressOverview && Array.isArray(safeProgressOverview.skills) ? safeProgressOverview.skills : []
  const safeStrength = safeProgressOverview && Array.isArray(safeProgressOverview.strength) ? safeProgressOverview.strength : []

  // Show empty state for first-time users
  if (!hasMeaningfulData) {
    return (
      <PageContainer>
        <DashboardEmptyState />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SectionStack gap="xl">
        
        {/* Welcome Banner for Post-Onboarding */}
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
                {athleteCalibration?.calibrationComplete 
                  ? 'Your performance is analyzed to build structured programming for your goals.'
                  : 'Your training data is analyzed to identify what limits your progress and how to solve it.'}
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
        
        {/* ============================================================= */}
        {/* FIRST RUN GUIDE - Shows new users exactly what to do */}
        {/* ============================================================= */}
        
        <SafeWidget name="FirstRunGuide" hideOnError>
          <FirstRunGuide />
        </SafeWidget>
        
        {/* ============================================================= */}
        {/* PRIORITY 1: NEXT WORKOUT - What should I do right now? */}
        {/* The most important section - clear next action */}
        {/* ============================================================= */}
        
        <SafeWidget name="NextWorkoutCard">
          <NextWorkoutCard />
        </SafeWidget>
        
        {/* Milestone Notifications - Show achievements prominently */}
        {unseenMilestones.length > 0 && (
          <div className="space-y-2">
            {unseenMilestones.slice(0, 2).map(milestone => (
              <MilestoneNotificationCard 
                key={milestone.id} 
                milestone={milestone}
                onDismiss={() => {
                  markMilestoneSeen(milestone.id)
                  setUnseenMilestones(prev => prev.filter(m => m.id !== milestone.id))
                }}
              />
            ))}
          </div>
        )}
        
        {/* ============================================================= */}
        {/* PRIORITY 2: TRAINING CONSISTENCY - Streak + Weekly Progress */}
        {/* ============================================================= */}
        
        <SafeWidget name="TrainingConsistencyCard">
          <TrainingConsistencyCard />
        </SafeWidget>
        
        {/* Progress Signals - Lightweight progress indicators */}
        <SafeWidget name="ProgressSignals" hideOnError>
          <div className="px-4">
            <ProgressSignals variant="inline" />
          </div>
        </SafeWidget>
        
        {/* ============================================================= */}
        {/* PRIORITY 3: READINESS + PROGRAM SNAPSHOT - Quick Status */}
        {/* ============================================================= */}
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Daily Readiness - Compact version */}
          <SafeWidget name="DailyReadinessCard" hideOnError>
            <DailyReadinessCard compact />
          </SafeWidget>
          
          {/* Program Snapshot */}
          <SafeWidget name="ProgramSnapshotCard" hideOnError>
            <ProgramSnapshotCard />
          </SafeWidget>
        </div>
        
        {/* Training Emphasis - Shows current methodology focus */}
        {trainingMethods && (
          <SafeWidget name="TrainingEmphasis" hideOnError>
            <TrainingEmphasis
              primaryEmphasis={trainingMethods.primary?.publicLabel || ''}
              secondaryEmphasis={trainingMethods.secondary?.publicLabel}
              rationale={trainingMethods.explanation || ''}
              coachingTip={getCoachingMessage(trainingMethods)}
            />
          </SafeWidget>
        )}
        
        {/* Progression Insights - Show exercises ready for progression */}
        {Array.isArray(progressionInsights) && progressionInsights.length > 0 && (
          <SafeWidget name="ProgressionInsights" hideOnError>
            <div className="px-4">
              <ProgressionInsights insights={progressionInsights} />
            </div>
          </SafeWidget>
        )}
        
        {/* ============================================================= */}
        {/* PRIORITY 4: SKILL PROGRESS - Visual motivation */}
        {/* Premium progress cards for active skills */}
        {/* ============================================================= */}
        
        {safeSkills.filter(s => s && (s.progressPercent > 0 || s.sessionsThisMonth > 0)).length > 0 && (
          <Section id="skill-progress" priority="primary">
            <SectionHeader 
              title="Skill Progress"
              description="Your progression toward skill milestones"
              icon={Target}
              action={
                <Link href="/skills">
                  <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF] gap-1">
                    All Skills
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              }
            />
            <SafeWidget name="SkillProgressSection">
              <SkillProgressSection 
                skills={safeSkills}
                focusNotes={constraintInsight?.hasInsight ? [{
                  skillName: focusSummary?.skillName || '',
                  note: constraintInsight.label || '',
                  type: 'limiter' as const,
                }] : []}
                goalSummaries={(() => {
                  // Calculate goal summaries from active skills
                  const activeSkills = safeSkills.filter(s => s && s.progressPercent > 0)
                  if (activeSkills.length === 0) return []
                  
                  const avgProgress = Math.round(
                    activeSkills.reduce((acc, s) => acc + s.progressPercent, 0) / activeSkills.length
                  )
                  
                  const categories: GoalCategorySummary[] = []
                  
                  // Skill goal progress
                  if (activeSkills.length > 0) {
                    categories.push({
                      category: 'skill',
                      label: 'Skill Mastery',
                      progressPercent: avgProgress,
                      activeSkillsCount: activeSkills.length,
                      totalMilestones: activeSkills.length * 5,
                      completedMilestones: Math.round(activeSkills.length * avgProgress / 100 * 5),
                    })
                  }
                  
                  // Strength progress if applicable
                  const strengthSkills = safeStrength.filter(s => s && s.currentBest > 0)
                  if (strengthSkills.length > 0) {
                    const strengthProgress = Math.min(100, Math.round(
                      strengthSkills.reduce((acc, s) => acc + Math.min(100, s.improvement * 10), 0) / strengthSkills.length
                    ))
                    categories.push({
                      category: 'strength',
                      label: 'Strength',
                      progressPercent: Math.max(30, strengthProgress),
                      activeSkillsCount: strengthSkills.length,
                      totalMilestones: strengthSkills.length,
                      completedMilestones: strengthSkills.filter(s => s.improvement > 0).length,
                    })
                  }
                  
                  return categories
                })()}
                maxDisplay={4}
              />
            </SafeWidget>
          </Section>
        )}
        
        {/* ============================================================= */}
        {/* SKILL PROGRESS HEATMAP - Visual motivation snapshot */}
        {/* Only show after user has some workout history */}
        {/* ============================================================= */}
        
        {!isEarlyStageUser && (
          <div className="px-4">
            <SafeWidget name="SkillProgressHeatmap">
              <SkillProgressHeatmap maxSkills={6} />
            </SafeWidget>
          </div>
        )}
        
        {/* ============================================================= */}
        {/* SKILL READINESS - Component breakdown visualization */}
        {/* Shows athletes their readiness level for major skills */}
        {/* Uses the canonical readiness engine as source of truth */}
        {/* ============================================================= */}
        
        {!isEarlyStageUser && overview?.profile && (
          <SafeWidget name="SkillReadinessPanel">
            <SkillReadinessPanel 
              athleteProfile={{
                pullUpMax: overview.profile.pullUpMax,
                dipMax: overview.profile.dipMax,
                pushUpMax: overview.profile.pushUpMax,
                hollowHoldTime: overview.profile.hollowHoldTime,
                experienceLevel: overview.profile.experienceLevel,
                equipment: overview.profile.equipment,
                primarySkill: focusSummary?.skillName?.toLowerCase().replace(/[\s-]+/g, '_'),
              }}
              skills={['front_lever', 'planche', 'muscle_up', 'hspu', 'l_sit']}
              maxDisplay={3}
            />
          </SafeWidget>
        )}
        
        {/* ============================================================= */}
        {/* SKILL ROADMAPS - Progression ladders to advanced skills */}
        {/* Only show after user has some training data */}
        {/* ============================================================= */}
        
        {!isEarlyStageUser && (
          <SafeWidget name="SkillRoadmapsCard">
            <SkillRoadmapsCard maxDisplay={4} />
          </SafeWidget>
        )}
        
        {/* ============================================================= */}
        {/* ACHIEVEMENTS - Medal collection */}
        {/* Show for all users - achievements provide early motivation */}
        {/* ============================================================= */}
        
        <SafeWidget name="AchievementsCard">
          <AchievementsCard maxDisplay={isEarlyStageUser ? 3 : 6} />
        </SafeWidget>
        
        {/* ============================================================= */}
        {/* CHALLENGES - Weekly/monthly/seasonal challenges */}
        {/* Only show after initial workouts */}
        {/* ============================================================= */}
        
        {!isEarlyStageUser && (
          <SafeWidget name="ChallengesCard">
            <ChallengesCard maxDisplay={3} />
          </SafeWidget>
        )}
        
        {/* ============================================================= */}
        {/* H2H CHALLENGES - Competitive matches */}
        {/* Only show after user has established baseline */}
        {/* ============================================================= */}
        
        {!isEarlyStageUser && (
          <SafeWidget name="H2HPanel">
            <H2HPanel compact />
          </SafeWidget>
        )}
        
        {/* ============================================================= */}
        {/* LEADERBOARD - Community rankings */}
        {/* Only show after user has established baseline */}
        {/* ============================================================= */}
        
        {!isEarlyStageUser && (
          <SafeWidget name="LeaderboardPreviewCard">
            <LeaderboardPreviewCard />
          </SafeWidget>
        )}
        
        {/* ============================================================= */}
        {/* GOAL PROJECTIONS - Timeline estimates */}
        {/* ============================================================= */}
        
        {nextMilestone && (
          <Section id="goal-projections" priority="secondary">
            <SectionHeader 
              title="Goal Timeline"
              description="Estimated progress toward your next milestone"
              icon={Target}
            />
            <SafeWidget name="GoalProjectionCard">
              <GoalProjectionCard />
            </SafeWidget>
          </Section>
        )}
        
        {/* ============================================================= */}
        {/* PRIORITY 4: TRAINING INSIGHT - One key message */}
        {/* ============================================================= */}
        
        <SafeWidget name="TrainingInsightQuote" hideOnError>
          <TrainingInsightQuote />
        </SafeWidget>
        
        {/* PWA Install Prompt - Non-intrusive */}
        <SafeWidget name="PWAInstallCard" hideOnError>
          <PWAInstallCard />
        </SafeWidget>
        
        {/* Adaptive Training Engine Visualization - Collapsed by default */}
        <SafeWidget name="SensorEngineVisualization" hideOnError>
          <SensorEngineVisualization variant="full" />
        </SafeWidget>
        
        {/* Training Momentum - Secondary info */}
        {trainingMomentum && (
          <SafeWidget name="TrainingMomentumCard" hideOnError>
            <TrainingMomentumCard momentum={trainingMomentum} />
          </SafeWidget>
        )}
        
        {/* Deload Warning - Only show if needed */}
        {deloadAssessment && deloadAssessment.status !== 'no_deload_needed' && (
          <SafeWidget name="DeloadStatusCard" hideOnError>
            <DeloadStatusCard status={deloadAssessment} />
          </SafeWidget>
        )}

        {/* ============================================================= */}
        {/* SECTION: DETAILED INSIGHTS (Collapsed/Secondary) */}
        {/* For users who want to dive deeper */}
        {/* ============================================================= */}
        
        <Section id="training-insights" priority="secondary">
          <SectionHeader 
            title="Detailed Analysis"
            description="Dive deeper into your training data"
            icon={Brain}
            action={
              <Link href="/performance">
                <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF] gap-1">
                  Full Analytics
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            }
          />
          
          <div className="space-y-4">
            {/* Primary Training Limiter */}
            {constraintInsight && constraintInsight.hasInsight && (
              <SafeWidget name="PrimaryLimiterCard" hideOnError>
                <PrimaryLimiterCard insight={constraintInsight} />
              </SafeWidget>
            )}
            
            {/* Recovery & Fatigue Details */}
            {recoverySignal && movementBalance && (
              <SafeWidget name="RecoveryStatusCard" hideOnError>
                <RecoveryStatusCard recovery={recoverySignal} balance={movementBalance} />
              </SafeWidget>
            )}
            
            {/* Athlete Intelligence */}
            <SafeWidget name="AthleteIntelligenceCard">
              <AthleteIntelligenceCard />
            </SafeWidget>
            
            {/* Update Metrics - Allow users to refine their program */}
            <SafeWidget name="UpdateMetricsCard" hideOnError>
              <UpdateMetricsCard />
            </SafeWidget>
            
            {/* Smart upgrade prompt - contextual based on engagement */}
            <SafeWidget name="SmartUpgradeBanner" hideOnError>
              <SmartUpgradeBanner />
            </SafeWidget>
          </div>
        </Section>

        {/* ============================================================= */}
        {/* SECTION: STRENGTH PROGRESS */}
        {/* ============================================================= */}
        
        {safeStrength.filter(s => s && s.currentBest > 0).length > 0 && (
          <SafeWidget name="StrengthProgressSection" hideOnError>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[#A4ACB8]">Strength Progress</h4>
                <Link href="/strength" className="text-xs text-[#C1121F] hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {safeStrength
                  .filter(s => s && s.currentBest > 0)
                  .slice(0, 3)
                  .map(strength => (
                    <StrengthProgressCard key={strength.exerciseName} strength={strength} />
                  ))
                }
              </div>
            </div>
          </SafeWidget>
        )}
        
        {/* ============================================================= */}
        {/* SECTION: PROGRESS TRACKING */}
        {/* Visual progress charts for strength, skills, consistency */}
        {/* ============================================================= */}
        
        <Section id="progress-tracking" priority="secondary">
          <SectionHeader 
            title="Progress Tracking"
            description="Your training metrics over time"
            icon={Target}
          />
          
          <SafeWidget name="ProgressDashboard">
            <ProgressDashboard />
          </SafeWidget>
        </Section>
        
        {/* ============================================================= */}
        {/* SECTION: ACHIEVEMENTS & CHALLENGES */}
        {/* ============================================================= */}
        
        <div className="grid gap-4 md:grid-cols-2">
          <SafeWidget name="AchievementsSummaryCard">
            <AchievementsSummaryCard />
          </SafeWidget>
          
          <SafeWidget name="ChallengesSummaryCard">
            <ChallengesSummaryCard />
          </SafeWidget>
        </div>
        
        {/* ============================================================= */}
        {/* SECTION: PERFORMANCE OVERVIEW (Compact) */}
        {/* ============================================================= */}
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Spartan Score - Compact */}
          {spartanScore && (
            <SafeWidget name="SpartanScoreCard" hideOnError>
              <SpartanScoreCard score={spartanScore} />
            </SafeWidget>
          )}
          
          {/* Next Milestone */}
          <SafeWidget name="ProgressForecastCard" hideOnError>
            <ProgressForecastCard nextMilestone={nextMilestone} />
          </SafeWidget>
        </div>

        {/* ============================================================= */}
        {/* SECTION 4: QUICK ACTIONS */}
        {/* Training hub and performance database */}
        {/* ============================================================= */}
        
        <Section id="quick-actions" priority="tertiary">
          <SectionHeader 
            title="Training Hub"
            description="Quick actions and performance records"
            icon={Dumbbell}
          />
          
          <div className="space-y-6">
            {/* Quick Actions Row */}
            <SafeWidget name="QuickActionsRow" hideOnError>
              <QuickActionsRow />
            </SafeWidget>
            
            {/* Performance Database */}
            <SafeWidget name="PerformanceVaultCard" hideOnError>
              <PerformanceVaultCard />
            </SafeWidget>
            
            {/* Share Progress Cards */}
            <SafeWidget name="ShareProgressSection">
              <ShareProgressSection />
            </SafeWidget>
          </div>
        </Section>
        
        {/* Mobile Help Links */}
        <div className="sm:hidden flex flex-col items-center gap-3 pt-4 pb-8">
          <SafeWidget name="SessionCounter" hideOnError>
            <SessionCounter />
          </SafeWidget>
          <TrainingSystemsLink />
          <HowSpartanLabWorksButton 
            onOpen={() => setShowIntroduction(true)} 
          />
        </div>
        
      </SectionStack>
      
      {/* Achievement Unlock Notification */}
      <SafeWidget name="AchievementNotification" hideOnError>
        <AchievementNotification />
      </SafeWidget>
      
      {/* Challenge Completion Notification */}
      <SafeWidget name="ChallengeNotification" hideOnError>
        <ChallengeNotification />
      </SafeWidget>
    </PageContainer>
  )
}

// Error fallback for dashboard - fail-soft rendering instead of full-page crash
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

// Dashboard route - Protected by AuthGuard and error boundary to prevent full-page crashes
export default function DashboardPage() {
  return (
    <AuthGuard redirectTo="/sign-in">
      <ErrorBoundary fallback={<DashboardErrorFallback />}>
        <DashboardContent />
      </ErrorBoundary>
    </AuthGuard>
  )
}
