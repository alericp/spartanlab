'use client'

/**
 * DashboardFullContent - Heavy dashboard implementation
 * 
 * This file contains ALL heavy imports and the full dashboard logic.
 * It is dynamically imported by the dashboard page ONLY when safe mode is disabled.
 * This isolation allows us to definitively identify whether crashes are in:
 * - The app shell (if safe mode still crashes)
 * - The dashboard content (if safe mode works but full dashboard crashes)
 */

// =============================================================================
// SECTION ISOLATION FLAGS - Binary search for crash isolation
// Set sections to false to disable them and narrow down the crash source
// =============================================================================
const ENABLE_SECTION_HEADER = true           // Dashboard intro/header - MINIMAL
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

// Helper to skip expensive calculations when sections are disabled
const SKIP_HEAVY_CALCULATIONS = !(
  ENABLE_SECTION_SKILL_PROGRESS || 
  ENABLE_SECTION_GOAL_PROJECTIONS || 
  ENABLE_SECTION_DETAILED_INSIGHTS ||
  ENABLE_SECTION_PERFORMANCE_OVERVIEW ||
  ENABLE_SECTION_TRAINING_EMPHASIS
)

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  PageContainer, 
  SectionStack, 
  Section, 
  SectionHeader, 
  DashboardSkeleton 
} from '@/components/layout'
import { useAuth } from '@clerk/nextjs'

// Heavy dashboard widget imports
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

export function DashboardFullContent() {
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
    
    // Check if this is a first-run welcome scenario
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('welcome') === 'true') {
      setShowWelcome(true)
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard')
    }
    
    // Sync program to history if needed
    syncProgramToHistory().then(result => {
      if (result?.success) {
        console.log('[v0] Dashboard: Synced program to history:', result.reasonSummary)
      }
    }).catch(err => {
      console.error('[v0] Dashboard: Failed to sync program to history:', err)
    })
    
    // Load dashboard data with staged error handling
    let data: DashboardOverview | null = null
    
    try {
      data = getDashboardOverview()
      setOverview(data)
    } catch (e) {
      console.error('[v0] Dashboard CRASH at getDashboardOverview:', e)
      setOverview({ profile: null as any, progressions: [], workouts: [], goals: [] })
      return
    }
    
    // GATED CALCULATIONS - Skip expensive operations when sections are disabled
    console.log('[v0] Dashboard: Starting gated calculations, SKIP_HEAVY_CALCULATIONS =', SKIP_HEAVY_CALCULATIONS)
    
    try { setSkillSummary(getPrimarySkillSummary(data)) } catch (e) { console.error('[v0] getPrimarySkillSummary:', e) }
    try { setStrengthSummary(getStrengthSummary(data)) } catch (e) { console.error('[v0] getStrengthSummary:', e) }
    try { setProgramSummary(getProgramSummary(data)) } catch (e) { console.error('[v0] getProgramSummary:', e) }
    try { setFocusSummary(getCurrentFocusSummary(data)) } catch (e) { console.error('[v0] getCurrentFocusSummary:', e) }
    
    // Heavy calculations - skip if not needed
    if (!SKIP_HEAVY_CALCULATIONS) {
      console.log('[v0] Dashboard: Running heavy calculations...')
      try { setWorkoutAnalytics(getWorkoutAnalytics()) } catch (e) { console.error('[v0] getWorkoutAnalytics:', e) }
      try { setSpartanScore(calculateSpartanScore()) } catch (e) { console.error('[v0] calculateSpartanScore:', e) }
      try { setRecoverySignal(calculateRecoverySignal()) } catch (e) { console.error('[v0] calculateRecoverySignal:', e) }
      try { setMovementBalance(calculateMovementBalance()) } catch (e) { console.error('[v0] calculateMovementBalance:', e) }
      try { setNextMilestone(calculateProjectionForPrimaryGoal()) } catch (e) { console.error('[v0] calculateProjectionForPrimaryGoal:', e) }
      try { setConstraintInsight(getConstraintInsight()) } catch (e) { console.error('[v0] getConstraintInsight:', e) }
      try { setAthleteCalibration(getAthleteCalibration()) } catch (e) { console.error('[v0] getAthleteCalibration:', e) }
      try { setDeloadAssessment(assessDeloadNeed()) } catch (e) { console.error('[v0] assessDeloadNeed:', e) }
      try { setTrainingMomentum(calculateTrainingMomentum()) } catch (e) { console.error('[v0] calculateTrainingMomentum:', e) }
      try { setProgressOverview(getProgressOverview()) } catch (e) { console.error('[v0] getProgressOverview:', e) }
      try { setUnseenMilestones(getUnseenMilestones()) } catch (e) { console.error('[v0] getUnseenMilestones:', e) }
    } else {
      console.log('[v0] Dashboard: Skipping heavy calculations (sections disabled)')
      // Set safe defaults
      setWorkoutAnalytics({ totalWorkouts: 1 } as any)
    }
    
    // Calculate training method emphasis - only if section enabled
    if (ENABLE_SECTION_TRAINING_EMPHASIS) {
      try {
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
        console.error('[v0] selectMethodProfiles:', e)
      }
    }
    
    // Get progression insights - only if section enabled
    if (ENABLE_SECTION_TRAINING_EMPHASIS) {
      try {
        const insights = getProgressionInsights()
        setProgressionInsights(insights)
      } catch { /* Silent fail */ }
    }
    
    // Listen for program recalculation events
    const handleRecalculation = () => {
      const freshData = getDashboardOverview()
      setOverview(freshData)
      try { setSkillSummary(getPrimarySkillSummary(freshData)) } catch {}
      try { setStrengthSummary(getStrengthSummary(freshData)) } catch {}
      try { setProgramSummary(getProgramSummary(freshData)) } catch {}
      try { setFocusSummary(getCurrentFocusSummary(freshData)) } catch {}
      try { setConstraintInsight(getConstraintInsight()) } catch {}
      try { setAthleteCalibration(getAthleteCalibration()) } catch {}
    }
    
    window.addEventListener('spartanlab:program-recalculated', handleRecalculation)
    return () => {
      window.removeEventListener('spartanlab:program-recalculated', handleRecalculation)
    }
  }, [])

  // Loading state
  if (!mounted || !overview || !isAuthLoaded) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    )
  }

  // Check if user has meaningful data
  const hasWorkoutData = !!(workoutAnalytics && typeof workoutAnalytics.totalWorkouts === 'number' && workoutAnalytics.totalWorkouts > 0)
  const hasSkillData = !!(skillSummary && skillSummary.level && skillSummary.level !== 'none')
  const hasStrengthData = !!(strengthSummary && Array.isArray(strengthSummary.topExercises) && strengthSummary.topExercises.length > 0)
  const hasMeaningfulData = hasWorkoutData || hasSkillData || hasStrengthData
  
  const isEarlyStageUser = !workoutAnalytics || typeof workoutAnalytics.totalWorkouts !== 'number' || workoutAnalytics.totalWorkouts < 3
  
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
        
        {/* SECTION: HEADER - Minimal dashboard confirmation */}
        {ENABLE_SECTION_HEADER && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_HEADER')}
            
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
            
            {/* Isolation test confirmation */}
            <div className="bg-[#1A1D23] border border-green-500/30 rounded-xl p-6 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#E6E9EF] mb-1">DashboardFullContent Loaded</h2>
              <p className="text-sm text-[#6B7280]">
                Section isolation active. Header section rendered successfully.
              </p>
              <p className="text-xs text-[#4B5563] mt-2 font-mono">
                Enable more sections to continue binary search
              </p>
            </div>
          </>
        )}
        
        {/* SECTION: FIRST RUN GUIDE */}
        {ENABLE_SECTION_FIRST_RUN && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_FIRST_RUN')}
            <SafeWidget name="FirstRunGuide" hideOnError>
              <FirstRunGuide />
            </SafeWidget>
          </>
        )}
        
        {/* SECTION: NEXT WORKOUT */}
        {ENABLE_SECTION_NEXT_WORKOUT && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_NEXT_WORKOUT')}
            <SafeWidget name="NextWorkoutCard">
              <NextWorkoutCard />
            </SafeWidget>
            
            {/* Milestone Notifications */}
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
          </>
        )}
        
        {/* SECTION: TRAINING CONSISTENCY */}
        {ENABLE_SECTION_CONSISTENCY && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_CONSISTENCY')}
            <SafeWidget name="TrainingConsistencyCard">
              <TrainingConsistencyCard />
            </SafeWidget>
            
            {/* Progress Signals */}
            <SafeWidget name="ProgressSignals" hideOnError>
              <div className="px-4">
                <ProgressSignals variant="inline" />
              </div>
            </SafeWidget>
          </>
        )}
        
        {/* SECTION: READINESS + PROGRAM SNAPSHOT */}
        {ENABLE_SECTION_READINESS && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_READINESS')}
            <div className="grid gap-4 md:grid-cols-2">
              <SafeWidget name="DailyReadinessCard" hideOnError>
                <DailyReadinessCard compact />
              </SafeWidget>
              
              <SafeWidget name="ProgramSnapshotCard" hideOnError>
                <ProgramSnapshotCard />
              </SafeWidget>
            </div>
          </>
        )}
        
        {/* SECTION: TRAINING EMPHASIS */}
        {ENABLE_SECTION_TRAINING_EMPHASIS && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_TRAINING_EMPHASIS')}
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
            
            {/* Progression Insights */}
            {Array.isArray(progressionInsights) && progressionInsights.length > 0 && (
              <SafeWidget name="ProgressionInsights" hideOnError>
                <div className="px-4">
                  <ProgressionInsights insights={progressionInsights} />
                </div>
              </SafeWidget>
            )}
          </>
        )}
        
        {/* SECTION: SKILL PROGRESS */}
        {ENABLE_SECTION_SKILL_PROGRESS && safeSkills.filter(s => s && (s.progressPercent > 0 || s.sessionsThisMonth > 0)).length > 0 && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_SKILL_PROGRESS')}
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
                    const activeSkills = safeSkills.filter(s => s && s.progressPercent > 0)
                    if (activeSkills.length === 0) return []
                    
                    const avgProgress = Math.round(
                      activeSkills.reduce((acc, s) => acc + s.progressPercent, 0) / activeSkills.length
                    )
                    
                    const categories: GoalCategorySummary[] = []
                    
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
            
            {/* SKILL PROGRESS HEATMAP */}
            {!isEarlyStageUser && (
              <div className="px-4">
                <SafeWidget name="SkillProgressHeatmap">
                  <SkillProgressHeatmap maxSkills={6} />
                </SafeWidget>
              </div>
            )}
          </>
        )}
        
        {/* SECTION: SKILL READINESS */}
        {ENABLE_SECTION_SKILL_READINESS && !isEarlyStageUser && overview?.profile && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_SKILL_READINESS')}
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
          </>
        )}
        
        {/* SECTION: ROADMAPS */}
        {ENABLE_SECTION_ROADMAPS && !isEarlyStageUser && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_ROADMAPS')}
            <SafeWidget name="SkillRoadmapsCard">
              <SkillRoadmapsCard maxDisplay={4} />
            </SafeWidget>
          </>
        )}
        
        {/* SECTION: ACHIEVEMENTS */}
        {ENABLE_SECTION_ACHIEVEMENTS && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_ACHIEVEMENTS')}
            <SafeWidget name="AchievementsCard">
              <AchievementsCard maxDisplay={isEarlyStageUser ? 3 : 6} />
            </SafeWidget>
          </>
        )}
        
        {/* SECTION: CHALLENGES + H2H */}
        {ENABLE_SECTION_CHALLENGES && !isEarlyStageUser && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_CHALLENGES')}
            <SafeWidget name="ChallengesCard">
              <ChallengesCard maxDisplay={3} />
            </SafeWidget>
            
            <SafeWidget name="H2HPanel">
              <H2HPanel compact />
            </SafeWidget>
          </>
        )}
        
        {/* SECTION: LEADERBOARD */}
        {ENABLE_SECTION_LEADERBOARD && !isEarlyStageUser && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_LEADERBOARD')}
            <SafeWidget name="LeaderboardPreviewCard">
              <LeaderboardPreviewCard />
            </SafeWidget>
          </>
        )}
        
        {/* SECTION: GOAL PROJECTIONS */}
        {ENABLE_SECTION_GOAL_PROJECTIONS && nextMilestone && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_GOAL_PROJECTIONS')}
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
            
            {/* TRAINING INSIGHT */}
            <SafeWidget name="TrainingInsightQuote" hideOnError>
              <TrainingInsightQuote />
            </SafeWidget>
            
            {/* PWA Install Prompt */}
            <SafeWidget name="PWAInstallCard" hideOnError>
              <PWAInstallCard />
            </SafeWidget>
            
            {/* Adaptive Training Engine Visualization */}
            <SafeWidget name="SensorEngineVisualization" hideOnError>
              <SensorEngineVisualization variant="full" />
            </SafeWidget>
            
            {/* Training Momentum */}
            {trainingMomentum && (
              <SafeWidget name="TrainingMomentumCard" hideOnError>
                <TrainingMomentumCard momentum={trainingMomentum} />
              </SafeWidget>
            )}
            
            {/* Deload Warning */}
            {deloadAssessment && deloadAssessment.status !== 'no_deload_needed' && (
              <SafeWidget name="DeloadStatusCard" hideOnError>
                <DeloadStatusCard status={deloadAssessment} />
              </SafeWidget>
            )}
          </>
        )}

        {/* SECTION: DETAILED INSIGHTS */}
        {ENABLE_SECTION_DETAILED_INSIGHTS && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_DETAILED_INSIGHTS')}
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
                {constraintInsight && constraintInsight.hasInsight && (
                  <SafeWidget name="PrimaryLimiterCard" hideOnError>
                    <PrimaryLimiterCard insight={constraintInsight} />
                  </SafeWidget>
                )}
                
                {recoverySignal && movementBalance && (
                  <SafeWidget name="RecoveryStatusCard" hideOnError>
                    <RecoveryStatusCard recovery={recoverySignal} balance={movementBalance} />
                  </SafeWidget>
                )}
                
                <SafeWidget name="AthleteIntelligenceCard">
                  <AthleteIntelligenceCard />
                </SafeWidget>
                
                <SafeWidget name="UpdateMetricsCard" hideOnError>
                  <UpdateMetricsCard />
                </SafeWidget>
                
                <SafeWidget name="SmartUpgradeBanner" hideOnError>
                  <SmartUpgradeBanner />
                </SafeWidget>
              </div>
            </Section>
          </>
        )}

        {/* SECTION: STRENGTH PROGRESS */}
        {ENABLE_SECTION_STRENGTH_PROGRESS && safeStrength.filter(s => s && s.currentBest > 0).length > 0 && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_STRENGTH_PROGRESS')}
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
          </>
        )}
        
        {/* SECTION: PROGRESS TRACKING */}
        {ENABLE_SECTION_PROGRESS_TRACKING && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_PROGRESS_TRACKING')}
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
            
            {/* ACHIEVEMENTS & CHALLENGES SUMMARY */}
            <div className="grid gap-4 md:grid-cols-2">
              <SafeWidget name="AchievementsSummaryCard">
                <AchievementsSummaryCard />
              </SafeWidget>
              
              <SafeWidget name="ChallengesSummaryCard">
                <ChallengesSummaryCard />
              </SafeWidget>
            </div>
          </>
        )}
        
        {/* SECTION: PERFORMANCE OVERVIEW */}
        {ENABLE_SECTION_PERFORMANCE_OVERVIEW && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_PERFORMANCE_OVERVIEW')}
            <div className="grid gap-4 md:grid-cols-2">
              {spartanScore && (
                <SafeWidget name="SpartanScoreCard" hideOnError>
                  <SpartanScoreCard score={spartanScore} />
                </SafeWidget>
              )}
              
              <SafeWidget name="ProgressForecastCard" hideOnError>
                <ProgressForecastCard nextMilestone={nextMilestone} />
              </SafeWidget>
            </div>
          </>
        )}

        {/* SECTION: QUICK ACTIONS */}
        {ENABLE_SECTION_QUICK_ACTIONS && (
          <>
            {console.log('[v0] Dashboard: Rendering SECTION_QUICK_ACTIONS')}
            <Section id="quick-actions" priority="tertiary">
              <SectionHeader 
                title="Training Hub"
                description="Quick actions and performance records"
                icon={Dumbbell}
              />
              
              <div className="space-y-6">
                <SafeWidget name="QuickActionsRow" hideOnError>
                  <QuickActionsRow />
                </SafeWidget>
                
                <SafeWidget name="PerformanceVaultCard" hideOnError>
                  <PerformanceVaultCard />
                </SafeWidget>
                
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
          </>
        )}
        
      </SectionStack>
      
      {/* SECTION: NOTIFICATIONS */}
      {ENABLE_SECTION_NOTIFICATIONS && (
        <>
          {console.log('[v0] Dashboard: Rendering SECTION_NOTIFICATIONS')}
          {/* Achievement Unlock Notification */}
          <SafeWidget name="AchievementNotification" hideOnError>
            <AchievementNotification />
          </SafeWidget>
          
          {/* Challenge Completion Notification */}
          <SafeWidget name="ChallengeNotification" hideOnError>
            <ChallengeNotification />
          </SafeWidget>
        </>
      )}
    </PageContainer>
  )
}
