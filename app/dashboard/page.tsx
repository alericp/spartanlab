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

// =============================================================================
// ISOLATION TEST FLAG - Set to true for normal operation
// =============================================================================
const ENABLE_FULL_DASHBOARD = true

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
import { DashboardIntroduction, HowSpartanLabWorksButton } from '@/components/dashboard/DashboardIntroduction'
import { calculateSpartanScore } from '@/lib/strength-score-engine'
import { isFirstRun } from '@/lib/onboarding-service'
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

function DashboardContent() {
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
  // ISOLATION TEST MODE - Minimal shell to prove route/auth works
  // =============================================================================
  if (!ENABLE_FULL_DASHBOARD) {
    return (
      <PageContainer>
        <div className="py-12">
          <div className="bg-[#1A1D23] border border-[#2A2F38] rounded-xl p-8 text-center">
            <h1 className="text-2xl font-semibold text-[#E6E9EF] mb-2">Dashboard Alive</h1>
            <p className="text-[#6B7280] mb-4">
              Isolation test mode active. Route and auth are working.
            </p>
            <p className="text-xs text-[#4B5563] font-mono">
              Set ENABLE_FULL_DASHBOARD = true to restore full dashboard
            </p>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Check if user has meaningful data
  const hasWorkoutData = workoutAnalytics && workoutAnalytics.totalWorkouts > 0
  const hasSkillData = skillSummary && skillSummary.level !== 'none'
  const hasStrengthData = strengthSummary && strengthSummary.topExercises && strengthSummary.topExercises.length > 0
  const hasMeaningfulData = hasWorkoutData || hasSkillData || hasStrengthData
  
  // Detect early-stage users (fewer than 3 workouts) for conditional UI prioritization
  const isEarlyStageUser = !workoutAnalytics || workoutAnalytics.totalWorkouts < 3

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
        <WelcomeBanner />
        
        {/* Welcome Card for First-Run Users */}
        {showWelcome && (
          <WelcomeCard 
            onDismiss={() => setShowWelcome(false)}
          />
        )}
        
        {/* Dashboard Introduction for New Users */}
        {!showWelcome && (
          <DashboardIntroduction 
            forceShow={showIntroduction}
            onComplete={() => setShowIntroduction(false)}
          />
        )}
        
        {/* Dashboard Header with Intelligence Explanation */}
        {!showWelcome && (
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <p className="text-sm text-[#6B7280] max-w-xl">
                {athleteCalibration?.calibrationComplete 
                  ? 'Your training data is analyzed and calibrated for your body type and goals.'
                  : 'Your training data is analyzed to identify the most effective exercises and progressions for your goals.'}
              </p>
              <SubscriptionTierBadge className="hidden sm:inline-flex" />
            </div>
            <HowSpartanLabWorksButton 
              onOpen={() => setShowIntroduction(true)} 
              className="hidden sm:flex shrink-0"
            />
          </div>
        )}
        
        {/* ============================================================= */}
        {/* FIRST RUN GUIDE - Shows new users exactly what to do */}
        {/* ============================================================= */}
        
        <FirstRunGuide />
        
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
        
        {/* ============================================================= */}
        {/* PRIORITY 3: READINESS + PROGRAM SNAPSHOT - Quick Status */}
        {/* ============================================================= */}
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Daily Readiness - Compact version */}
          <DailyReadinessCard compact />
          
          {/* Program Snapshot */}
          <ProgramSnapshotCard />
        </div>
        
        {/* Training Emphasis - Shows current methodology focus */}
        {trainingMethods && (
          <TrainingEmphasis
            primaryEmphasis={trainingMethods.primary.publicLabel}
            secondaryEmphasis={trainingMethods.secondary?.publicLabel}
            rationale={trainingMethods.explanation}
            coachingTip={getCoachingMessage(trainingMethods)}
          />
        )}
        
        {/* Progression Insights - Show exercises ready for progression */}
        {progressionInsights.length > 0 && (
          <div className="px-4">
            <ProgressionInsights insights={progressionInsights} />
          </div>
        )}
        
        {/* ============================================================= */}
        {/* PRIORITY 4: SKILL PROGRESS - Visual motivation */}
        {/* Premium progress cards for active skills */}
        {/* ============================================================= */}
        
        {progressOverview && progressOverview.skills.filter(s => s.progressPercent > 0 || s.sessionsThisMonth > 0).length > 0 && (
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
                skills={progressOverview.skills}
                focusNotes={constraintInsight?.hasInsight ? [{
                  skillName: focusSummary?.skillName || '',
                  note: constraintInsight.label || '',
                  type: 'limiter' as const,
                }] : []}
                goalSummaries={(() => {
                  // Calculate goal summaries from active skills
                  const activeSkills = progressOverview.skills.filter(s => s.progressPercent > 0)
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
                  const strengthSkills = progressOverview.strength.filter(s => s.currentBest > 0)
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
        
        <TrainingInsightQuote />
        
        {/* PWA Install Prompt - Non-intrusive */}
        <PWAInstallCard />
        
        {/* Adaptive Training Engine Visualization - Collapsed by default */}
        <SafeWidget name="SensorEngineVisualization" hideOnError>
          <SensorEngineVisualization variant="full" />
        </SafeWidget>
        
        {/* Training Momentum - Secondary info */}
        {trainingMomentum && <TrainingMomentumCard momentum={trainingMomentum} />}
        
        {/* Deload Warning - Only show if needed */}
        {deloadAssessment && deloadAssessment.status !== 'no_deload_needed' && (
          <DeloadStatusCard status={deloadAssessment} />
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
              <PrimaryLimiterCard insight={constraintInsight} />
            )}
            
            {/* Recovery & Fatigue Details */}
            {recoverySignal && movementBalance && (
              <RecoveryStatusCard recovery={recoverySignal} balance={movementBalance} />
            )}
            
            {/* Athlete Intelligence */}
            <SafeWidget name="AthleteIntelligenceCard">
              <AthleteIntelligenceCard />
            </SafeWidget>
            
            {/* Update Metrics - Allow users to refine their program */}
            <UpdateMetricsCard />
            
            {/* Pro upgrade prompt - non-intrusive card */}
            <DashboardUpgradeCard />
          </div>
        </Section>

        {/* ============================================================= */}
        {/* SECTION: STRENGTH PROGRESS */}
        {/* ============================================================= */}
        
        {progressOverview && progressOverview.strength.filter(s => s.currentBest > 0).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-[#A4ACB8]">Strength Progress</h4>
              <Link href="/strength" className="text-xs text-[#C1121F] hover:underline">
                View All
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {progressOverview.strength
                .filter(s => s.currentBest > 0)
                .slice(0, 3)
                .map(strength => (
                  <StrengthProgressCard key={strength.exerciseName} strength={strength} />
                ))
              }
            </div>
          </div>
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
          {spartanScore && <SpartanScoreCard score={spartanScore} />}
          
          {/* Next Milestone */}
          <ProgressForecastCard nextMilestone={nextMilestone} />
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
            <QuickActionsRow />
            
            {/* Performance Database */}
            <PerformanceVaultCard />
            
            {/* Share Progress Cards */}
            <SafeWidget name="ShareProgressSection">
              <ShareProgressSection />
            </SafeWidget>
          </div>
        </Section>
        
        {/* Mobile Help Link */}
        <div className="sm:hidden flex justify-center pt-4 pb-8">
          <HowSpartanLabWorksButton 
            onOpen={() => setShowIntroduction(true)} 
          />
        </div>
        
      </SectionStack>
      
      {/* Achievement Unlock Notification */}
      <AchievementNotification />
      
      {/* Challenge Completion Notification */}
      <ChallengeNotification />
    </PageContainer>
  )
}

// Dashboard route - Protected by AuthGuard to prevent mixed auth state
export default function DashboardPage() {
  return (
    <AuthGuard redirectTo="/sign-in">
      <DashboardContent />
    </AuthGuard>
  )
}
