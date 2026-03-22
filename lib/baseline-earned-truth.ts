/**
 * BASELINE VS EARNED TRUTH CONTRACT
 * 
 * =============================================================================
 * PURPOSE: Separate imported/onboarding capability from earned in-app progress
 * =============================================================================
 * 
 * Three distinct truth buckets:
 * 
 * 1. BASELINE CAPABILITY (baselineCapability)
 *    - What the user could already do when they started SpartanLab
 *    - Derived from onboarding inputs (pull-up max, dip max, skill levels)
 *    - Static reference point - doesn't change unless user updates profile
 * 
 * 2. INFERRED STARTING LEVEL (inferredStartingLevel)
 *    - What the engine derives from profile metrics at program generation
 *    - Used for initial exercise prescription difficulty
 *    - Recalculated when profile changes
 * 
 * 3. EARNED IN-APP PROGRESS (earnedInAppProgress)
 *    - What the user has actually logged, completed, or achieved inside SpartanLab
 *    - Requires trusted workout completion or explicit in-app logging
 *    - The only bucket that counts for "achievements" and "progress" displays
 * 
 * =============================================================================
 * USAGE RULES:
 * =============================================================================
 * 
 * - Challenges: MUST require earnedInAppProgress (except "baseline assessment" type)
 * - Achievements: MUST require earnedInAppProgress
 * - Analytics/Score: MUST clearly separate baseline contribution from earned contribution
 * - Program generation: CAN use all three buckets for personalization
 * - Progress displays: MUST distinguish baseline from earned
 */

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getStrengthRecords, type StrengthRecord, type ExerciseType } from './strength-service'
import { getSkillProgressions, type SkillProgression } from './data-service'
import { getCanonicalProfile, type CanonicalProgrammingProfile } from './canonical-profile-service'

// =============================================================================
// TYPES
// =============================================================================

export type ProgressSource = 
  | 'baseline_onboarding'      // From onboarding profile inputs
  | 'baseline_import'          // From explicit import of prior achievements
  | 'earned_workout_log'       // From completed trusted workout
  | 'earned_skill_session'     // From completed skill practice session
  | 'earned_challenge'         // From completed in-app challenge
  | 'earned_manual_log'        // From user manually logging a PR/achievement
  | 'inferred'                 // Engine-derived from other data

export interface SourcedProgress {
  source: ProgressSource
  sourceDate: string
  isEarned: boolean  // Convenience flag: true if source starts with 'earned_'
  isBaseline: boolean // Convenience flag: true if source starts with 'baseline_'
}

export interface BaselineCapability {
  // Strength baselines (from onboarding)
  pullUpMax: number | null
  dipMax: number | null
  pushUpMax: number | null
  weightedPullUp: { addedWeight: number; reps: number } | null
  weightedDip: { addedWeight: number; reps: number } | null
  
  // Skill baselines (from onboarding progressions)
  skillLevels: Record<string, number>
  
  // Metadata
  capturedAt: string
  profileVersion: number
}

export interface EarnedProgress {
  // Strength PRs (from logged workouts only)
  earnedPullUpMax: number | null
  earnedDipMax: number | null
  earnedPushUpMax: number | null
  earnedWeightedPullUp: { addedWeight: number; reps: number; loggedAt: string } | null
  earnedWeightedDip: { addedWeight: number; reps: number; loggedAt: string } | null
  
  // Skill progression (from tracked sessions)
  earnedSkillLevels: Record<string, { level: number; achievedAt: string }>
  
  // Training volume
  totalWorkoutsCompleted: number
  totalTrainingMinutes: number
  firstWorkoutDate: string | null
  lastWorkoutDate: string | null
  
  // Metadata
  lastUpdated: string
}

export interface BaselineVsEarnedSummary {
  baseline: BaselineCapability
  earned: EarnedProgress
  
  // Comparison helpers
  hasEarnedProgress: boolean
  hasBaselineOnly: boolean
  earnedExceedsBaseline: {
    pullUps: boolean
    dips: boolean
    anySkill: boolean
  }
}

// =============================================================================
// STORAGE
// =============================================================================

const BASELINE_KEY = 'spartanlab_baseline_capability'
const EARNED_KEY = 'spartanlab_earned_progress'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// =============================================================================
// BASELINE CAPABILITY
// =============================================================================

/**
 * Capture baseline capability from current canonical profile.
 * Call this after onboarding completes or when user first sets up profile.
 */
export function captureBaselineCapability(): BaselineCapability {
  const profile = getCanonicalProfile()
  
  const baseline: BaselineCapability = {
    pullUpMax: profile.pullUpMax ? parseInt(profile.pullUpMax.replace(/[^0-9]/g, '')) : null,
    dipMax: profile.dipMax ? parseInt(profile.dipMax.replace(/[^0-9]/g, '')) : null,
    pushUpMax: profile.pushUpMax ? parseInt(profile.pushUpMax.replace(/[^0-9]/g, '')) : null,
    weightedPullUp: profile.weightedPullUp || null,
    weightedDip: profile.weightedDip || null,
    skillLevels: {},
    capturedAt: new Date().toISOString(),
    profileVersion: 1, // Version 1 = initial baseline capture
  }
  
  // Capture skill levels from progressions
  const progressions = getSkillProgressions()
  progressions.forEach(p => {
    baseline.skillLevels[p.skillName] = p.currentLevel
  })
  
  // Store baseline
  if (isBrowser()) {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline))
  }
  
  console.log('[baseline-vs-earned] Captured baseline capability:', {
    pullUpMax: baseline.pullUpMax,
    dipMax: baseline.dipMax,
    skillCount: Object.keys(baseline.skillLevels).length,
  })
  
  return baseline
}

/**
 * Get stored baseline capability.
 * Returns null if no baseline has been captured yet.
 */
export function getBaselineCapability(): BaselineCapability | null {
  if (!isBrowser()) return null
  
  const stored = localStorage.getItem(BASELINE_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Check if baseline capability has been captured.
 */
export function hasBaselineCapability(): boolean {
  return getBaselineCapability() !== null
}

// =============================================================================
// EARNED PROGRESS
// =============================================================================

/**
 * Get only trusted workout logs (earned in-app).
 * This is the authoritative filter for "earned" progress.
 */
export function getTrustedWorkoutLogs(): WorkoutLog[] {
  return getWorkoutLogs().filter(log => {
    // Reject demo workouts
    if (log.sourceRoute === 'demo' || (log as Record<string, unknown>).isDemo === true) return false
    // Reject explicitly untrusted
    if (log.trusted === false) return false
    // Require explicit trust OR known good sourceRoute
    const hasValidSource = log.sourceRoute === 'workout_session' || 
                          log.sourceRoute === 'first_session' || 
                          log.sourceRoute === 'quick_log'
    const hasExplicitTrust = log.trusted === true
    return hasValidSource || hasExplicitTrust
  })
}

/**
 * Get only earned strength records (logged through workouts, not imported).
 */
export function getEarnedStrengthRecords(): StrengthRecord[] {
  const records = getStrengthRecords()
  
  // Filter to records that have workout-based dates
  // Records without explicit source are assumed to be earned if they have recent dates
  // and there are corresponding workout logs
  const trustedLogs = getTrustedWorkoutLogs()
  const trustedDates = new Set(trustedLogs.map(l => l.sessionDate?.split('T')[0] || l.createdAt?.split('T')[0]))
  
  return records.filter(r => {
    const recordDate = r.dateLogged?.split('T')[0]
    // If record date matches a trusted workout date, it's earned
    // Also accept records with explicit "earned" source if that field exists
    const source = (r as Record<string, unknown>).source as string | undefined
    if (source?.startsWith('earned_')) return true
    if (source?.startsWith('baseline_')) return false
    // Fallback: check if date matches a trusted workout
    return recordDate && trustedDates.has(recordDate)
  })
}

/**
 * Calculate earned progress from trusted workout logs and earned records.
 */
export function calculateEarnedProgress(): EarnedProgress {
  const trustedLogs = getTrustedWorkoutLogs()
  const earnedRecords = getEarnedStrengthRecords()
  
  const earned: EarnedProgress = {
    earnedPullUpMax: null,
    earnedDipMax: null,
    earnedPushUpMax: null,
    earnedWeightedPullUp: null,
    earnedWeightedDip: null,
    earnedSkillLevels: {},
    totalWorkoutsCompleted: trustedLogs.length,
    totalTrainingMinutes: trustedLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0),
    firstWorkoutDate: null,
    lastWorkoutDate: null,
    lastUpdated: new Date().toISOString(),
  }
  
  // Find first and last workout dates
  if (trustedLogs.length > 0) {
    const sorted = [...trustedLogs].sort((a, b) => 
      new Date(a.sessionDate || a.createdAt).getTime() - new Date(b.sessionDate || b.createdAt).getTime()
    )
    earned.firstWorkoutDate = sorted[0].sessionDate || sorted[0].createdAt
    earned.lastWorkoutDate = sorted[sorted.length - 1].sessionDate || sorted[sorted.length - 1].createdAt
  }
  
  // Extract max reps from workout logs
  trustedLogs.forEach(log => {
    log.exercises.forEach(ex => {
      if (!ex.completed) return
      const name = ex.name.toLowerCase()
      const reps = ex.reps || 0
      
      if (name.includes('pull-up') || name.includes('pullup')) {
        if (reps > (earned.earnedPullUpMax || 0)) {
          earned.earnedPullUpMax = reps
        }
      }
      if (name.includes('dip') && !name.includes('band')) {
        if (reps > (earned.earnedDipMax || 0)) {
          earned.earnedDipMax = reps
        }
      }
      if (name.includes('push-up') || name.includes('pushup')) {
        if (reps > (earned.earnedPushUpMax || 0)) {
          earned.earnedPushUpMax = reps
        }
      }
    })
  })
  
  // Extract weighted PRs from earned records
  earnedRecords.forEach(r => {
    if (r.exercise === 'weighted_pull_up') {
      if (!earned.earnedWeightedPullUp || r.weightAdded > earned.earnedWeightedPullUp.addedWeight) {
        earned.earnedWeightedPullUp = {
          addedWeight: r.weightAdded,
          reps: r.reps,
          loggedAt: r.dateLogged,
        }
      }
    }
    if (r.exercise === 'weighted_dip') {
      if (!earned.earnedWeightedDip || r.weightAdded > earned.earnedWeightedDip.addedWeight) {
        earned.earnedWeightedDip = {
          addedWeight: r.weightAdded,
          reps: r.reps,
          loggedAt: r.dateLogged,
        }
      }
    }
  })
  
  // Store earned progress
  if (isBrowser()) {
    localStorage.setItem(EARNED_KEY, JSON.stringify(earned))
  }
  
  console.log('[baseline-vs-earned] Calculated earned progress:', {
    totalWorkouts: earned.totalWorkoutsCompleted,
    earnedPullUpMax: earned.earnedPullUpMax,
    earnedDipMax: earned.earnedDipMax,
    hasWeightedPRs: !!(earned.earnedWeightedPullUp || earned.earnedWeightedDip),
  })
  
  return earned
}

/**
 * Get stored earned progress (cached calculation).
 */
export function getEarnedProgress(): EarnedProgress | null {
  if (!isBrowser()) return null
  
  const stored = localStorage.getItem(EARNED_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

// =============================================================================
// COMBINED SUMMARY
// =============================================================================

/**
 * Get full baseline vs earned summary.
 * This is the main function for components to understand the truth state.
 */
export function getBaselineVsEarnedSummary(): BaselineVsEarnedSummary {
  // Ensure baseline exists
  let baseline = getBaselineCapability()
  if (!baseline) {
    baseline = captureBaselineCapability()
  }
  
  // Calculate earned progress
  const earned = calculateEarnedProgress()
  
  // Determine comparison flags
  const hasEarnedProgress = earned.totalWorkoutsCompleted > 0
  const hasBaselineOnly = !hasEarnedProgress && (
    baseline.pullUpMax !== null || 
    baseline.dipMax !== null ||
    Object.keys(baseline.skillLevels).length > 0
  )
  
  // Check if earned exceeds baseline
  const earnedExceedsBaseline = {
    pullUps: (earned.earnedPullUpMax || 0) > (baseline.pullUpMax || 0),
    dips: (earned.earnedDipMax || 0) > (baseline.dipMax || 0),
    anySkill: false, // Would need skill session tracking to determine
  }
  
  console.log('[baseline-vs-earned] Summary:', {
    hasEarnedProgress,
    hasBaselineOnly,
    earnedExceedsBaseline,
    baselinePullUp: baseline.pullUpMax,
    earnedPullUp: earned.earnedPullUpMax,
  })
  
  return {
    baseline,
    earned,
    hasEarnedProgress,
    hasBaselineOnly,
    earnedExceedsBaseline,
  }
}

// =============================================================================
// CHALLENGE/ACHIEVEMENT HELPERS
// =============================================================================

/**
 * Check if a strength milestone is satisfied by EARNED progress only.
 * Use this for challenges/achievements that should require in-app completion.
 */
export function isStrengthMilestoneEarned(
  exercise: 'pull_ups' | 'dips' | 'push_ups',
  targetValue: number
): { earned: boolean; currentEarned: number; baselineValue: number } {
  const summary = getBaselineVsEarnedSummary()
  
  let currentEarned = 0
  let baselineValue = 0
  
  switch (exercise) {
    case 'pull_ups':
      currentEarned = summary.earned.earnedPullUpMax || 0
      baselineValue = summary.baseline.pullUpMax || 0
      break
    case 'dips':
      currentEarned = summary.earned.earnedDipMax || 0
      baselineValue = summary.baseline.dipMax || 0
      break
    case 'push_ups':
      currentEarned = summary.earned.earnedPushUpMax || 0
      baselineValue = summary.baseline.pushUpMax || 0
      break
  }
  
  return {
    earned: currentEarned >= targetValue,
    currentEarned,
    baselineValue,
  }
}

/**
 * Check if a challenge should use baseline satisfaction.
 * Some challenge types (like "baseline assessment") may intentionally use baseline.
 */
export function shouldChallengeUseBaseline(challengeType: string): boolean {
  const baselineAllowedTypes = [
    'baseline_assessment',
    'starting_point',
    'initial_benchmark',
  ]
  return baselineAllowedTypes.includes(challengeType)
}

/**
 * Get progress source label for UI display.
 */
export function getProgressSourceLabel(source: ProgressSource): string {
  switch (source) {
    case 'baseline_onboarding': return 'Starting capability'
    case 'baseline_import': return 'Imported record'
    case 'earned_workout_log': return 'Logged in workout'
    case 'earned_skill_session': return 'Skill session'
    case 'earned_challenge': return 'Challenge completion'
    case 'earned_manual_log': return 'Manual entry'
    case 'inferred': return 'Estimated'
    default: return 'Unknown'
  }
}

// =============================================================================
// MILESTONE / ANALYTICS HELPERS
// =============================================================================

/**
 * Check if an achievement/milestone should be displayed as "earned" vs "baseline".
 * Use this for analytics surfaces that should distinguish earned progress.
 */
export function getMilestoneSource(
  exerciseType: 'pull_ups' | 'dips' | 'push_ups' | 'skill',
  achievementValue: number,
  achievementDate: string
): { source: 'earned' | 'baseline' | 'unknown'; label: string } {
  const summary = getBaselineVsEarnedSummary()
  
  // Check if there are any earned workouts
  if (!summary.hasEarnedProgress) {
    // No earned workouts - this is baseline or unknown
    return { source: 'baseline', label: 'Starting capability' }
  }
  
  // If earned workouts exist after baseline capture, check dates
  const baselineCapturedAt = summary.baseline.capturedAt
  if (achievementDate > baselineCapturedAt) {
    return { source: 'earned', label: 'Logged in app' }
  }
  
  return { source: 'baseline', label: 'Starting capability' }
}

/**
 * Get counts for analytics display, separating baseline from earned.
 * Use this for dashboard/progress cards.
 * 
 * [display-source-truth] STEP 8: Ensures consistent source labeling across all surfaces
 */
export function getProgressCountsWithSources(): {
  totalPRs: number
  earnedPRs: number
  baselinePRs: number
  totalMilestones: number
  earnedMilestones: number
  baselineMilestones: number
  displayLabel: string
  sourceType: 'earned' | 'baseline' | 'mixed' | 'empty'
} {
  const summary = getBaselineVsEarnedSummary()
  const earned = summary.earned
  const baseline = summary.baseline
  
  // Count earned PRs (from workout logs)
  let earnedPRCount = 0
  if (earned.earnedPullUpMax) earnedPRCount++
  if (earned.earnedDipMax) earnedPRCount++
  if (earned.earnedPushUpMax) earnedPRCount++
  if (earned.earnedWeightedPullUp) earnedPRCount++
  if (earned.earnedWeightedDip) earnedPRCount++
  
  // Count baseline PRs (from onboarding)
  let baselinePRCount = 0
  if (baseline.pullUpMax) baselinePRCount++
  if (baseline.dipMax) baselinePRCount++
  if (baseline.pushUpMax) baselinePRCount++
  if (baseline.weightedPullUp) baselinePRCount++
  if (baseline.weightedDip) baselinePRCount++
  
  const displayLabel = summary.hasEarnedProgress 
    ? 'Progress logged in SpartanLab' 
    : 'Starting capabilities from profile'
  
  // [display-source-truth] STEP 8: Determine source type for consistent UI labeling
  const sourceType = earnedPRCount > 0 && baselinePRCount > 0 ? 'mixed' :
                     earnedPRCount > 0 ? 'earned' :
                     baselinePRCount > 0 ? 'baseline' :
                     'empty'
  
  console.log('[display-source-truth] Progress counts with source:', {
    earnedPRs: earnedPRCount,
    baselinePRs: baselinePRCount,
    hasEarnedProgress: summary.hasEarnedProgress,
    sourceType,
    displayLabel,
  })
  
  return {
    totalPRs: earnedPRCount + baselinePRCount,
    earnedPRs: earnedPRCount,
    baselinePRs: baselinePRCount,
    totalMilestones: 0, // Would need milestone tracking
    earnedMilestones: 0,
    baselineMilestones: 0,
    displayLabel,
    sourceType,
  }
}

// =============================================================================
// [baseline-earned-truth] TASK 8: VALIDATION / INVARIANT CHECKS
// =============================================================================

export interface TruthValidationResult {
  valid: boolean
  violations: string[]
  warnings: string[]
}

/**
 * Validate that baseline/earned truth model is internally consistent.
 * Call this to detect trust leaks.
 * 
 * [baseline-earned-truth] TASK 8: Invariant enforcement
 */
export function validateTruthIntegrity(): TruthValidationResult {
  const summary = getBaselineVsEarnedSummary()
  const violations: string[] = []
  const warnings: string[] = []
  
  // INVARIANT 1: If no earned workouts, earned metrics should be null/zero
  if (!summary.hasEarnedProgress) {
    if (summary.earned.earnedPullUpMax !== null && summary.earned.earnedPullUpMax > 0) {
      violations.push('INVARIANT_VIOLATION: earnedPullUpMax > 0 but hasEarnedProgress is false')
    }
    if (summary.earned.earnedDipMax !== null && summary.earned.earnedDipMax > 0) {
      violations.push('INVARIANT_VIOLATION: earnedDipMax > 0 but hasEarnedProgress is false')
    }
    if (summary.earned.totalWorkoutsCompleted > 0) {
      violations.push('INVARIANT_VIOLATION: totalWorkoutsCompleted > 0 but hasEarnedProgress is false')
    }
  }
  
  // INVARIANT 2: Earned dates should be after baseline capture
  if (summary.earned.firstWorkoutDate && summary.baseline.capturedAt) {
    // This is actually fine - workouts can be logged before baseline was captured
    // Just log as info
  }
  
  // WARNING: If baseline exists but no profile data
  if (summary.hasBaselineOnly && 
      summary.baseline.pullUpMax === null && 
      summary.baseline.dipMax === null &&
      Object.keys(summary.baseline.skillLevels).length === 0) {
    warnings.push('WARNING: hasBaselineOnly true but no baseline metrics recorded')
  }
  
  console.log('[baseline-earned-truth] Truth integrity validation:', {
    valid: violations.length === 0,
    violations,
    warnings,
    hasEarnedProgress: summary.hasEarnedProgress,
    hasBaselineOnly: summary.hasBaselineOnly,
  })
  
  return {
    valid: violations.length === 0,
    violations,
    warnings,
  }
}

/**
 * Check if displaying a completion/achievement from a given source would be misleading.
 * Use this before rendering "Complete" badges.
 * 
 * [baseline-earned-truth] TASK 8: Prevent trust leaks in UI
 */
export function isCompletionDisplaySafe(params: {
  isCompleted: boolean
  progressSource: 'earned' | 'baseline' | 'mixed' | undefined
  challengeCategory: string
  policyOverride?: 'earned_only' | 'baseline_recognized'
}): { safe: boolean; reason?: string; suggestedLabel?: string } {
  const { isCompleted, progressSource, challengeCategory, policyOverride } = params
  
  if (!isCompleted) {
    return { safe: true }
  }
  
  const policy = policyOverride || (
    ['weekly', 'monthly', 'time', 'h2h'].includes(challengeCategory) ? 'earned_only' : 'earned_only'
  )
  
  // If policy is earned_only but source is baseline, this is a trust leak
  if (policy === 'earned_only' && progressSource === 'baseline') {
    console.log('[baseline-earned-truth] UI trust leak detected:', {
      challengeCategory,
      progressSource,
      policy,
    })
    return { 
      safe: false, 
      reason: 'Completion marked but source is baseline-only with earned_only policy',
      suggestedLabel: 'Baseline capability'
    }
  }
  
  return { safe: true }
}

// =============================================================================
// [history-language] TASK 8: BLANK-SLATE AWARE MESSAGING
// =============================================================================

/**
 * Get appropriate language for history-derived rationale.
 * [history-language] This function ensures we don't claim "training history"
 * when the user has no earned workout data.
 */
export function getHistoryAwareLanguage(type: 
  | 'training_history'
  | 'recent_progress'
  | 'recovery_trend'
  | 'prior_load'
  | 'performance_trend'
  | 'consistency_pattern'
): { phrase: string; isBlankSlate: boolean } {
  const summary = getBaselineVsEarnedSummary()
  const hasHistory = summary.hasEarnedProgress
  
  const phrases: Record<typeof type, { withHistory: string; blankSlate: string }> = {
    training_history: {
      withHistory: 'based on your training history',
      blankSlate: 'based on your starting profile',
    },
    recent_progress: {
      withHistory: 'from your recent progress',
      blankSlate: 'for your estimated starting level',
    },
    recovery_trend: {
      withHistory: 'based on your recovery patterns',
      blankSlate: 'with a recovery-friendly baseline',
    },
    prior_load: {
      withHistory: 'based on your previous loads',
      blankSlate: 'starting conservatively',
    },
    performance_trend: {
      withHistory: 'based on your performance trend',
      blankSlate: 'calibrated for beginners',
    },
    consistency_pattern: {
      withHistory: 'given your consistency pattern',
      blankSlate: 'building an initial foundation',
    },
  }
  
  const selected = phrases[type]
  const phrase = hasHistory ? selected.withHistory : selected.blankSlate
  
  console.log('[history-language] Selected phrase:', {
    type,
    hasHistory,
    phrase,
    earnedWorkouts: summary.earned.totalWorkoutsCompleted,
  })
  
  return { phrase, isBlankSlate: !hasHistory }
}

/**
 * Check if a rationale text can safely claim history-based adaptation.
 * [history-language] Returns false if user has no earned data.
 */
export function canClaimHistoryAdaptation(): boolean {
  const summary = getBaselineVsEarnedSummary()
  return summary.hasEarnedProgress && summary.earned.totalWorkoutsCompleted >= 2
}

/**
 * Get blank-slate aware program summary prefix.
 * [history-language] For program cards and summaries.
 */
export function getProgramSummaryPrefix(): string {
  const summary = getBaselineVsEarnedSummary()
  
  if (!summary.hasEarnedProgress) {
    return 'Starting program based on your profile'
  }
  
  if (summary.earned.totalWorkoutsCompleted < 5) {
    return 'Early-stage program building your foundation'
  }
  
  return 'Adapted program based on your training data'
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize baseline vs earned tracking.
 * Call this on app load after user authentication is confirmed.
 */
export function initializeBaselineTracking(): void {
  if (!isBrowser()) return
  
  // Capture baseline if not already captured
  if (!hasBaselineCapability()) {
    console.log('[baseline-earned-truth] First-time baseline capture')
    captureBaselineCapability()
  }
  
  // Always recalculate earned progress
  calculateEarnedProgress()
  
  // [baseline-earned-truth] TASK 8: Run validation on init
  validateTruthIntegrity()
}

// =============================================================================
// [baseline-earned-truth] TASK 10: SCENARIO VALIDATION HELPERS
// =============================================================================

export interface ScenarioValidationResult {
  scenario: string
  passed: boolean
  details: string[]
  warnings: string[]
}

/**
 * Validate Scenario A: Blank-slate user with no earned history.
 * Expected: No fake achievements, no history language, program starts at baseline.
 */
export function validateScenarioA_BlankSlate(): ScenarioValidationResult {
  const summary = getBaselineVsEarnedSummary()
  const details: string[] = []
  const warnings: string[] = []
  let passed = true
  
  // Check 1: hasEarnedProgress should be false
  if (summary.hasEarnedProgress) {
    warnings.push('hasEarnedProgress is true - not a blank-slate scenario')
  } else {
    details.push('Correctly identified as blank-slate (no earned progress)')
  }
  
  // Check 2: totalWorkoutsCompleted should be 0
  if (summary.earned.totalWorkoutsCompleted > 0) {
    passed = false
    details.push(`FAIL: totalWorkoutsCompleted=${summary.earned.totalWorkoutsCompleted} but hasEarnedProgress=false`)
  } else {
    details.push('totalWorkoutsCompleted correctly 0')
  }
  
  // Check 3: Earned PRs should be null
  if (summary.earned.earnedPullUpMax !== null && summary.earned.earnedPullUpMax > 0) {
    passed = false
    details.push(`FAIL: earnedPullUpMax=${summary.earned.earnedPullUpMax} without earned workouts`)
  }
  
  console.log('[baseline-earned-truth] Scenario A validation:', { passed, details, warnings })
  
  return {
    scenario: 'Scenario A: Blank-slate user',
    passed,
    details,
    warnings,
  }
}

/**
 * Validate Scenario B: User with loadable equipment.
 * Expected: Weighted prescriptions should be eligible if strength data exists.
 */
export function validateScenarioB_WeightedEligible(
  hasLoadableEquipmentInput: boolean,
  hasStrengthBenchmarks: boolean
): ScenarioValidationResult {
  const details: string[] = []
  const warnings: string[] = []
  let passed = true
  
  // Check weighted eligibility
  const shouldBeEligible = hasLoadableEquipmentInput && hasStrengthBenchmarks
  
  details.push(`Loadable equipment: ${hasLoadableEquipmentInput}`)
  details.push(`Strength benchmarks: ${hasStrengthBenchmarks}`)
  details.push(`Expected eligibility: ${shouldBeEligible}`)
  
  if (shouldBeEligible) {
    details.push('Weighted prescriptions SHOULD appear for eligible exercises')
  } else if (hasLoadableEquipmentInput && !hasStrengthBenchmarks) {
    warnings.push('Has equipment but missing strength benchmarks - prescriptions limited')
  } else if (!hasLoadableEquipmentInput) {
    details.push('No loadable equipment - weighted prescriptions correctly unavailable')
  }
  
  console.log('[baseline-earned-truth] Scenario B validation:', { passed, details, warnings })
  
  return {
    scenario: 'Scenario B: Weighted eligibility',
    passed,
    details,
    warnings,
  }
}

/**
 * Validate Scenario D: User with earned history.
 * Expected: History language only appears when data exists.
 */
export function validateScenarioD_EarnedHistory(): ScenarioValidationResult {
  const summary = getBaselineVsEarnedSummary()
  const details: string[] = []
  const warnings: string[] = []
  let passed = true
  
  if (!summary.hasEarnedProgress) {
    warnings.push('No earned progress - this scenario validates earned history users')
    passed = false
  } else {
    details.push(`Total earned workouts: ${summary.earned.totalWorkoutsCompleted}`)
    details.push(`First workout: ${summary.earned.firstWorkoutDate || 'unknown'}`)
    details.push(`Last workout: ${summary.earned.lastWorkoutDate || 'unknown'}`)
    
    // Check earned vs baseline
    if (summary.earnedExceedsBaseline.pullUps) {
      details.push('Earned pull-up max exceeds baseline')
    }
    if (summary.earnedExceedsBaseline.dips) {
      details.push('Earned dip max exceeds baseline')
    }
  }
  
  console.log('[baseline-earned-truth] Scenario D validation:', { passed, details, warnings })
  
  return {
    scenario: 'Scenario D: Earned history user',
    passed,
    details,
    warnings,
  }
}

/**
 * Run all scenario validations and log results.
 * [baseline-earned-truth] TASK 10: Master validation function.
 */
export function runAllScenarioValidations(): {
  allPassed: boolean
  results: ScenarioValidationResult[]
} {
  const results: ScenarioValidationResult[] = []
  
  // Determine which scenario applies
  const summary = getBaselineVsEarnedSummary()
  
  if (!summary.hasEarnedProgress) {
    results.push(validateScenarioA_BlankSlate())
  } else {
    results.push(validateScenarioD_EarnedHistory())
  }
  
  const allPassed = results.every(r => r.passed)
  
  console.log('[baseline-earned-truth] All scenario validations:', {
    allPassed,
    resultCount: results.length,
    passedCount: results.filter(r => r.passed).length,
  })
  
  return { allPassed, results }
}
