'use client'

/**
 * DashboardHeavyContent - All Heavy Dashboard Imports
 * 
 * This file is ONLY dynamically imported when ANY_HEAVY_SECTION_ENABLED = true.
 * It contains all the heavy widgets, engines, and calculation logic.
 * 
 * If this file has an import-time crash, the dashboard shell will still render
 * with the header section, proving the crash is in this import graph.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  SectionStack, 
  Section, 
  SectionHeader, 
  DashboardSkeleton 
} from '@/components/layout'

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
  getDashboardUserState,
  type DashboardOverview,
  type PrimarySkillSummary,
  type StrengthSummary,
  type ProgramSummary,
  type CurrentFocus,
  type DashboardUserState,
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
import { PWAInstallCard } from '@/components/dashboard/PWAInstallCard'
import { NextWorkoutCard } from '@/components/dashboard/NextWorkoutCard'
import { ProgramSnapshotCard } from '@/components/dashboard/ProgramSnapshotCard'
import { TrainingInsightQuote } from '@/components/dashboard/TrainingInsightQuote'
import { TrainingConsistencyCard } from '@/components/dashboard/TrainingConsistencyCard'
import { H2HPanel } from '@/components/h2h'
import { SkillRoadmapsCard } from '@/components/roadmap'
import { SkillProgressHeatmap } from '@/components/dashboard/SkillProgressHeatmap'
import { SensorEngineVisualization } from '@/components/shared/AdaptiveEngineBadge'
import { TrainingEmphasis } from '@/components/dashboard/TrainingEmphasis'
import { ProgressionInsights } from '@/components/dashboard/ProgressionInsights'
import { GoalProjectionCard } from '@/components/dashboard/GoalProjectionCard'
import { selectMethodProfiles, getCoachingMessage, type SelectionContext, type SelectedMethods } from '@/lib/training-principles-engine'
import { getProgressionInsights, type ProgressionInsight } from '@/lib/adaptive-progression-engine'
import { FirstRunGuide } from '@/components/dashboard/FirstRunGuide'
import { UpdateMetricsCard } from '@/components/dashboard/UpdateMetricsCard'
import { SafeWidget } from '@/components/shared/WidgetErrorBoundary'
import { AchievementsSummaryCard } from '@/components/achievements/achievements-panel'
import { ChallengesSummaryCard } from '@/components/challenges/challenges-panel'
import { ChallengesCard } from '@/components/challenges/ChallengesCard'
import { AchievementsCard } from '@/components/dashboard/AchievementsCard'
import { AchievementNotification } from '@/components/achievements/AchievementNotification'
import { SkillReadinessPanel } from '@/components/readiness/SkillReadinessPanel'
import { LeaderboardPreviewCard } from '@/components/leaderboards/LeaderboardTabs'
import { ProgressDashboard } from '@/components/dashboard/ProgressDashboard'
import { ChallengeNotification } from '@/components/challenges/ChallengeNotification'
import { ProgressSignals } from '@/components/dashboard/ProgressSignals'
import { SessionCounter } from '@/components/dashboard/DailyEngagement'
import { SmartUpgradeBanner } from '@/components/upgrade/SmartUpgradeTrigger'
import { HowSpartanLabWorksButton, TrainingSystemsLink } from '@/components/dashboard/DashboardIntroduction'

interface DashboardHeavyContentProps {
  showWelcome: boolean
  setShowWelcome: (show: boolean) => void
  showIntroduction: boolean
  setShowIntroduction: (show: boolean) => void
}

// All sections enabled by default (production mode)
const ENABLE_SECTION_FIRST_RUN = true
const ENABLE_SECTION_NEXT_WORKOUT = true
const ENABLE_SECTION_CONSISTENCY = true
const ENABLE_SECTION_READINESS = true
const ENABLE_SECTION_TRAINING_EMPHASIS = true
const ENABLE_SECTION_SKILL_PROGRESS = true
const ENABLE_SECTION_SKILL_READINESS = true
const ENABLE_SECTION_ROADMAPS = true
const ENABLE_SECTION_ACHIEVEMENTS = true
const ENABLE_SECTION_CHALLENGES = true
const ENABLE_SECTION_LEADERBOARD = true
const ENABLE_SECTION_GOAL_PROJECTIONS = true
const ENABLE_SECTION_DETAILED_INSIGHTS = true
const ENABLE_SECTION_STRENGTH_PROGRESS = true
const ENABLE_SECTION_PROGRESS_TRACKING = true
const ENABLE_SECTION_PERFORMANCE_OVERVIEW = true
const ENABLE_SECTION_QUICK_ACTIONS = true
const ENABLE_SECTION_NOTIFICATIONS = true

export default function DashboardHeavyContent({ 
  showWelcome, 
  setShowWelcome, 
  showIntroduction, 
  setShowIntroduction
}: DashboardHeavyContentProps) {
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
  const [loaded, setLoaded] = useState(false)
  const [userState, setUserState] = useState<DashboardUserState | null>(null)

  useEffect(() => {
    // Load canonical user state first - this gates what we display
    const dashboardState = getDashboardUserState()
    setUserState(dashboardState)
    
    // Sync program to history if needed
    syncProgramToHistory().then(result => {
      if (result?.success) {
        console.log('[v0] DashboardHeavy: Synced program to history')
      }
    }).catch(err => {
      console.error('[v0] DashboardHeavy: Failed to sync:', err)
    })
    
    // Load dashboard data
    let data: DashboardOverview | null = null
    
    try {
      data = getDashboardOverview()
      setOverview(data)
    } catch (e) {
      console.error('[v0] DashboardHeavy CRASH at getDashboardOverview:', e)
      setOverview({ profile: null as any, progressions: [], workouts: [], goals: [] })
      setLoaded(true)
      return
    }
    
    // Run calculations based on enabled sections
    try { setSkillSummary(getPrimarySkillSummary(data)) } catch (e) { console.error('[v0] getPrimarySkillSummary:', e) }
    try { setStrengthSummary(getStrengthSummary(data)) } catch (e) { console.error('[v0] getStrengthSummary:', e) }
    try { setProgramSummary(getProgramSummary(data)) } catch (e) { console.error('[v0] getProgramSummary:', e) }
    try { setFocusSummary(getCurrentFocusSummary(data)) } catch (e) { console.error('[v0] getCurrentFocusSummary:', e) }
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
    
    // Training methods
    if (ENABLE_SECTION_TRAINING_EMPHASIS && data.profile) {
      try {
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
      } catch (e) {
        console.error('[v0] selectMethodProfiles:', e)
      }
    }
    
    // Progression insights
    if (ENABLE_SECTION_TRAINING_EMPHASIS) {
      try {
        const insights = getProgressionInsights()
        setProgressionInsights(insights)
      } catch { /* Silent fail */ }
    }
    
    setLoaded(true)
    
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
  }, [ENABLE_SECTION_TRAINING_EMPHASIS])

  if (!loaded || !overview || !userState) {
    return <DashboardSkeleton />
  }

  // Use canonical truth state for gating decisions
  // isEarlyStageUser: user has workouts but less than 3 trusted ones
  const isEarlyStageUser = userState.isEarlyProgramState
  // Pre-workout state: program exists but no real workouts yet
  const isPreWorkoutState = userState.isPreWorkoutState
  // Show mature widgets only for users with trusted performance data (>= 3 workouts)
  const showMatureWidgets = userState.isMatureTrainingState
  // Has any real workout data at all
  const hasAnyWorkoutData = userState.hasRealWorkoutLogs
  
  // Diagnostic: log dashboard truth state for debugging
  console.log('[dashboard-truth] render', userState.stateLabel, {
    hasProgram: userState.hasUsableProgram,
    hasWorkouts: userState.hasRealWorkoutLogs,
    trustedWorkoutCount: userState.trustedWorkoutCount,
    dataConfidence: userState.dataConfidence,
    showMatureWidgets,
    isPreWorkoutState,
    isEarlyStageUser,
  })
  const safeProgressOverview = progressOverview && typeof progressOverview === 'object' ? progressOverview : null
  const safeSkills = safeProgressOverview && Array.isArray(safeProgressOverview.skills) ? safeProgressOverview.skills : []
  const safeStrength = safeProgressOverview && Array.isArray(safeProgressOverview.strength) ? safeProgressOverview.strength : []

  return (
    <>
      {/* SECTION: FIRST RUN GUIDE */}
      {ENABLE_SECTION_FIRST_RUN && (
        <SafeWidget name="FirstRunGuide" hideOnError>
          <FirstRunGuide />
        </SafeWidget>
      )}
      
      {/* SECTION: NEXT WORKOUT */}
      {ENABLE_SECTION_NEXT_WORKOUT && (
        <>
          <SafeWidget name="NextWorkoutCard">
            <NextWorkoutCard />
          </SafeWidget>
          
          {/* Only show milestone notifications for users with real workout data */}
          {hasAnyWorkoutData && unseenMilestones.length > 0 && (
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
      
      {/* SECTION: TRAINING CONSISTENCY - Only show when user has at least one real workout */}
      {ENABLE_SECTION_CONSISTENCY && hasAnyWorkoutData && (
        <>
          <SafeWidget name="TrainingConsistencyCard">
            <TrainingConsistencyCard />
          </SafeWidget>
          
          <SafeWidget name="ProgressSignals" hideOnError>
            <div className="px-4">
              <ProgressSignals variant="inline" />
            </div>
          </SafeWidget>
        </>
      )}
      
      {/* SECTION: READINESS + PROGRAM SNAPSHOT - Only show with real program and workout data */}
      {ENABLE_SECTION_READINESS && userState.hasUsableProgram && userState.hasRealWorkoutLogs && (
        <div className="grid gap-4 md:grid-cols-2">
          <SafeWidget name="DailyReadinessCard" hideOnError>
            <DailyReadinessCard compact />
          </SafeWidget>
          
          <SafeWidget name="ProgramSnapshotCard" hideOnError>
            <ProgramSnapshotCard />
          </SafeWidget>
        </div>
      )}
      
      {/* SECTION: TRAINING EMPHASIS - Only show with real program and workout data */}
      {ENABLE_SECTION_TRAINING_EMPHASIS && userState.hasUsableProgram && userState.hasRealWorkoutLogs && (
        <>
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
          
          {Array.isArray(progressionInsights) && progressionInsights.length > 0 && (
            <SafeWidget name="ProgressionInsights" hideOnError>
              <div className="px-4">
                <ProgressionInsights insights={progressionInsights} />
              </div>
            </SafeWidget>
          )}
        </>
      )}
      
      {/* SECTION: SKILL PROGRESS - Only show if user has real workout data and actual skill progress */}
      {ENABLE_SECTION_SKILL_PROGRESS && hasAnyWorkoutData && safeSkills.filter(s => s && (s.progressPercent > 0 || s.sessionsThisMonth > 0)).length > 0 && (
        <>
          <Section id="skill-progress" priority="primary">
            <SectionHeader 
              title="Skill Progress"
              description="Your progression toward skill milestones"
              icon={Target}
              action={
                <Link href="/my-skills">
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
                goalSummaries={[]}
                maxDisplay={4}
              />
            </SafeWidget>
          </Section>
          
          {!isEarlyStageUser && (
            <div className="px-4">
              <SafeWidget name="SkillProgressHeatmap">
                <SkillProgressHeatmap maxSkills={6} />
              </SafeWidget>
            </div>
          )}
        </>
      )}
      
      {/* SECTION: SKILL READINESS - Only show for users with real workout data */}
      {ENABLE_SECTION_SKILL_READINESS && showMatureWidgets && overview?.profile && (
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
      
      {/* SECTION: ROADMAPS - Only show for users with real workout data */}
      {ENABLE_SECTION_ROADMAPS && showMatureWidgets && (
        <SafeWidget name="SkillRoadmapsCard">
          <SkillRoadmapsCard maxDisplay={4} />
        </SafeWidget>
      )}
      
      {/* SECTION: ACHIEVEMENTS - Only show if user has real workout data */}
      {ENABLE_SECTION_ACHIEVEMENTS && hasAnyWorkoutData && (
        <SafeWidget name="AchievementsCard">
          <AchievementsCard maxDisplay={isEarlyStageUser ? 3 : 6} />
        </SafeWidget>
      )}
      
      {/* SECTION: CHALLENGES + H2H - Only show for users with meaningful real data */}
      {ENABLE_SECTION_CHALLENGES && showMatureWidgets && (
        <>
          <SafeWidget name="ChallengesCard">
            <ChallengesCard maxDisplay={3} />
          </SafeWidget>
          
          <SafeWidget name="H2HPanel">
            <H2HPanel compact />
          </SafeWidget>
        </>
      )}
      
      {/* SECTION: LEADERBOARD - Only show for users with meaningful real data */}
      {ENABLE_SECTION_LEADERBOARD && showMatureWidgets && (
        <SafeWidget name="LeaderboardPreviewCard">
          <LeaderboardPreviewCard />
        </SafeWidget>
      )}
      
      {/* SECTION: GOAL PROJECTIONS - Only show for users with trusted performance data */}
      {ENABLE_SECTION_GOAL_PROJECTIONS && nextMilestone && showMatureWidgets && (
        <>
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
          
          <SafeWidget name="TrainingInsightQuote" hideOnError>
            <TrainingInsightQuote />
          </SafeWidget>
          
          <SafeWidget name="PWAInstallCard" hideOnError>
            <PWAInstallCard />
          </SafeWidget>
          
          <SafeWidget name="SensorEngineVisualization" hideOnError>
            <SensorEngineVisualization variant="full" />
          </SafeWidget>
          
          {trainingMomentum && (
            <SafeWidget name="TrainingMomentumCard" hideOnError>
              <TrainingMomentumCard momentum={trainingMomentum} />
            </SafeWidget>
          )}
          
          {deloadAssessment && deloadAssessment.status !== 'no_deload_needed' && (
            <SafeWidget name="DeloadStatusCard" hideOnError>
              <DeloadStatusCard status={deloadAssessment} />
            </SafeWidget>
          )}
        </>
      )}

      {/* SECTION: DETAILED INSIGHTS - Only show for users with trusted performance data */}
      {ENABLE_SECTION_DETAILED_INSIGHTS && showMatureWidgets && (
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
      )}

      {/* SECTION: STRENGTH PROGRESS - Only show for users with real workout data and actual strength records */}
      {ENABLE_SECTION_STRENGTH_PROGRESS && hasAnyWorkoutData && safeStrength.filter(s => s && s.currentBest > 0).length > 0 && (
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
      
      {/* SECTION: PROGRESS TRACKING - Only show for users with trusted performance data */}
      {ENABLE_SECTION_PROGRESS_TRACKING && showMatureWidgets && (
        <>
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
      
      {/* SECTION: PERFORMANCE OVERVIEW - Only show for users with trusted performance data */}
      {ENABLE_SECTION_PERFORMANCE_OVERVIEW && showMatureWidgets && (
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
      )}

      {/* SECTION: QUICK ACTIONS - Gate mature widgets for users with trusted performance data */}
      {ENABLE_SECTION_QUICK_ACTIONS && (
        <>
          {/* Only show Training Hub with mature data surfaces when user has mature training state */}
          {showMatureWidgets && (
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
          )}
          
          {/* Show session counter only when user has real workout data */}
          {hasAnyWorkoutData && (
            <div className="sm:hidden flex flex-col items-center gap-3 pt-4 pb-8">
              <SafeWidget name="SessionCounter" hideOnError>
                <SessionCounter />
              </SafeWidget>
              <TrainingSystemsLink />
              <HowSpartanLabWorksButton 
                onOpen={() => setShowIntroduction(true)} 
              />
            </div>
          )}
        </>
      )}
      
      {/* SECTION: NOTIFICATIONS - Only show for users with real workout data */}
      {ENABLE_SECTION_NOTIFICATIONS && hasAnyWorkoutData && (
        <>
          <SafeWidget name="AchievementNotification" hideOnError>
            <AchievementNotification />
          </SafeWidget>
          
          <SafeWidget name="ChallengeNotification" hideOnError>
            <ChallengeNotification />
          </SafeWidget>
        </>
      )}
    </>
  )
}
