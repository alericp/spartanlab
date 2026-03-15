// Spartan Strength Score Engine
// Deterministic performance scoring based on skill progress, weighted strength, readiness, and consistency
// Scale: 0-1000 (Beginner 0-200, Developing 200-400, Intermediate 400-600, Advanced 600-800, Elite 800-1000)

import { getSkillProgressions, getAthleteProfile, type SkillProgression } from './data-service'
import { getPersonalRecords, getStrengthRecords, type StrengthRecord, type ExerciseType } from './strength-service'
import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getConstraintInsight } from './constraint-engine'
import { getSkillSessions } from './skill-session-service'
import { getUnlockedAchievements, ACHIEVEMENTS, type AchievementTier } from './achievements/achievement-definitions'

export interface ScoreComponent {
  raw: number      // 0-100 raw score
  weighted: number // After applying weight
  weight: number   // Weight percentage (0-1)
  label: string
  description: string
}

export interface StrengthScoreBreakdown {
  // Component scores (0-100 each)
  skillScore: number
  strengthScore: number
  readinessScore: number
  consistencyScore: number
  achievementScore: number
  
  // Detailed components
  components: ScoreComponent[]
  
  // Final score (0-1000)
  totalScore: number
  
  // Level classification
  level: SpartanLevel
  levelProgress: number // Progress within current level (0-100%)
  
  // Explanation
  explanation: string
  focusAreas: string[]
  strengths: string[]
  
  // Data quality
  dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent'
  hasEnoughData: boolean
  
  // Decay info (for transparency)
  decayInfo?: {
    daysInactive: number
    decayAmount: number
    decayApplied: boolean
    message: string
  }
}

export type SpartanLevel = 'Beginner' | 'Developing' | 'Intermediate' | 'Advanced' | 'Elite'

// Skill level mappings for each skill (0-100 scale)
// Level 0 = beginner, Level 4 = advanced/full
const SKILL_LEVEL_MAPPINGS: Record<string, Record<number, number>> = {
  planche: { 0: 10, 1: 30, 2: 55, 3: 80, 4: 100 },       // Tuck → Adv Tuck → Straddle → Full → Maltese
  front_lever: { 0: 10, 1: 30, 2: 55, 3: 80, 4: 100 },   // Tuck → Adv Tuck → Straddle → Full → Wide
  muscle_up: { 0: 20, 1: 50, 2: 75, 3: 90, 4: 100 },     // Kipping → Strict → Weighted → Slow → One Arm
  handstand_pushup: { 0: 15, 1: 40, 2: 65, 3: 85, 4: 100 }, // Pike → Wall → Freestanding → Deficit → 90deg
}

// Skill names for display
const SKILL_LABELS: Record<string, string> = {
  planche: 'Planche',
  front_lever: 'Front Lever',
  muscle_up: 'Muscle-Up',
  handstand_pushup: 'HSPU',
}

// Strength level mappings (1RM values in lbs added weight)
// Based on reasonable calisthenics strength standards
const STRENGTH_LEVEL_MAPPINGS: Record<ExerciseType, Record<number, number>> = {
  weighted_pull_up: { 0: 15, 25: 35, 45: 55, 70: 75, 90: 90, 115: 100 },
  weighted_dip: { 0: 10, 35: 30, 55: 50, 80: 70, 100: 85, 135: 100 },
  weighted_muscle_up: { 0: 30, 15: 55, 30: 75, 50: 90, 70: 100 },
}

// Strength names for display
const STRENGTH_LABELS: Record<ExerciseType, string> = {
  weighted_pull_up: 'Weighted Pull-Up',
  weighted_dip: 'Weighted Dip',
  weighted_muscle_up: 'Weighted Muscle-Up',
}

// Normalize a 1RM value against the strength mapping
function normalizeStrengthScore(oneRM: number, mapping: Record<number, number>): number {
  const thresholds = Object.keys(mapping)
    .map(Number)
    .sort((a, b) => a - b)
  
  if (oneRM >= thresholds[thresholds.length - 1]) {
    return 100
  }
  
  if (oneRM <= thresholds[0]) {
    return mapping[thresholds[0]]
  }
  
  // Find the two closest thresholds for interpolation
  for (let i = 0; i < thresholds.length - 1; i++) {
    const lower = thresholds[i]
    const upper = thresholds[i + 1]
    
    if (oneRM >= lower && oneRM <= upper) {
      const lowerScore = mapping[lower]
      const upperScore = mapping[upper]
      const ratio = (oneRM - lower) / (upper - lower)
      return Math.round(lowerScore + (upperScore - lowerScore) * ratio)
    }
  }
  
  return 0
}

// Component weights (must sum to 1.0)
const WEIGHTS = {
  skill: 0.30,       // 30% - Skill progression level
  strength: 0.30,    // 30% - Weighted strength capacity
  readiness: 0.15,   // 15% - Skill readiness / progression proximity
  consistency: 0.15, // 15% - Training consistency
  achievements: 0.10 // 10% - Achievement unlocks
}

// Achievement tier point values for scoring
const ACHIEVEMENT_TIER_POINTS: Record<AchievementTier, number> = {
  bronze: 10,
  silver: 25,
  gold: 50,
  elite: 100
}

// Calculate skill score (35% weight)
export function calculateSkillScore(): { score: number; details: { skill: string; level: number; score: number }[] } {
  const progressions = getSkillProgressions()
  const details: { skill: string; level: number; score: number }[] = []
  
  if (progressions.length === 0) {
    return { score: 0, details }
  }
  
  let totalScore = 0
  let count = 0
  
  for (const progression of progressions) {
    const skillName = progression.skillName
    const mapping = SKILL_LEVEL_MAPPINGS[skillName]
    
    if (mapping) {
      const currentLevel = Math.min(progression.currentLevel, Object.keys(mapping).length - 1)
      const scoreValue = mapping[currentLevel] || 0
      totalScore += scoreValue
      count++
      details.push({
        skill: SKILL_LABELS[skillName] || skillName,
        level: currentLevel,
        score: scoreValue
      })
    }
  }
  
  return { 
    score: count > 0 ? Math.round(totalScore / count) : 0,
    details
  }
}

// Calculate strength score (35% weight)
export function calculateStrengthScore(): { score: number; details: { exercise: string; oneRM: number; score: number }[] } {
  const records = getPersonalRecords()
  const exercises: ExerciseType[] = ['weighted_pull_up', 'weighted_dip', 'weighted_muscle_up']
  const details: { exercise: string; oneRM: number; score: number }[] = []
  
  let totalScore = 0
  let count = 0
  
  for (const exercise of exercises) {
    const record = records[exercise]
    if (record) {
      const mapping = STRENGTH_LEVEL_MAPPINGS[exercise]
      const normalizedScore = normalizeStrengthScore(record.estimatedOneRM, mapping)
      totalScore += normalizedScore
      count++
      details.push({
        exercise: STRENGTH_LABELS[exercise],
        oneRM: record.estimatedOneRM,
        score: normalizedScore
      })
    }
  }
  
  return { 
    score: count > 0 ? Math.round(totalScore / count) : 0,
    details
  }
}

// Calculate readiness score (15% weight) - how close to progression
export function calculateReadinessScore(): { score: number; description: string } {
  const sessions = getSkillSessions()
  const progressions = getSkillProgressions()
  
  if (sessions.length < 3 || progressions.length === 0) {
    return { score: 0, description: 'Need more session data' }
  }
  
  // Calculate based on recent hold quality and density
  const recentSessions = sessions.slice(0, 10)
  const totalSets = recentSessions.reduce((sum, s) => sum + s.sets.length, 0)
  const cleanSets = recentSessions.reduce((sum, s) => 
    sum + s.sets.filter(set => set.quality === 'clean').length, 0
  )
  
  const cleanRatio = totalSets > 0 ? cleanSets / totalSets : 0
  
  // Get average hold time trend
  const recentHolds = recentSessions.flatMap(s => s.sets.map(set => set.holdSeconds))
  const avgHold = recentHolds.length > 0 
    ? recentHolds.reduce((a, b) => a + b, 0) / recentHolds.length 
    : 0
  
  // Score based on clean ratio and hold consistency
  const cleanScore = cleanRatio * 60 // Up to 60 points for clean sets
  const holdScore = Math.min(40, avgHold * 5) // Up to 40 points for hold duration
  
  const score = Math.round(cleanScore + holdScore)
  
  let description = 'Building foundation'
  if (score >= 80) description = 'High readiness for progression'
  else if (score >= 60) description = 'Approaching progression threshold'
  else if (score >= 40) description = 'Developing skill ownership'
  
  return { score: Math.min(100, score), description }
}

// Calculate consistency score (15% weight)
export function calculateConsistencyScore(): { score: number; weeklyWorkouts: number; daysSinceLastWorkout: number } {
  const logs = getWorkoutLogs()
  
  if (logs.length === 0) {
    return { score: 0, weeklyWorkouts: 0, daysSinceLastWorkout: 999 }
  }
  
  // Calculate workouts this week
  const startOfWeek = getStartOfWeek()
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  
  const weeklyWorkouts = logs.filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= startOfWeek && logDate < endOfWeek
  }).length
  
  // Also count last 7 days for better accuracy
  const last7Days = logs.filter(log => {
    const logDate = new Date(log.sessionDate)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return logDate >= sevenDaysAgo
  }).length
  
  const workoutsToScore = Math.max(weeklyWorkouts, last7Days)
  
  let weeklyScore = 0
  if (workoutsToScore === 0) weeklyScore = 0
  else if (workoutsToScore === 1) weeklyScore = 30
  else if (workoutsToScore === 2) weeklyScore = 55
  else if (workoutsToScore === 3) weeklyScore = 75
  else if (workoutsToScore === 4) weeklyScore = 90
  else weeklyScore = 100
  
  // Apply recency modifier
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  )
  const lastWorkout = sortedLogs[0]
  
  const daysSinceLastWorkout = lastWorkout 
    ? Math.floor((Date.now() - new Date(lastWorkout.sessionDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999
  
  let recencyModifier = 0
  if (daysSinceLastWorkout <= 1) recencyModifier = 10
  else if (daysSinceLastWorkout <= 2) recencyModifier = 5
  else if (daysSinceLastWorkout > 5) recencyModifier = -10
  else if (daysSinceLastWorkout > 7) recencyModifier = -20
  
  return { 
    score: Math.max(0, Math.min(100, weeklyScore + recencyModifier)),
    weeklyWorkouts: workoutsToScore,
    daysSinceLastWorkout
  }
}

// Calculate achievement score (10% weight)
export function calculateAchievementScore(): { score: number; unlockedCount: number; totalPossible: number } {
  const unlocked = getUnlockedAchievements()
  
  if (unlocked.length === 0) {
    return { score: 0, unlockedCount: 0, totalPossible: ACHIEVEMENTS.length }
  }
  
  let totalPoints = 0
  let maxPossiblePoints = 0
  
  // Calculate points from unlocked achievements
  unlocked.forEach(ua => {
    const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId)
    if (achievement) {
      totalPoints += ACHIEVEMENT_TIER_POINTS[achievement.tier]
    }
  })
  
  // Calculate max possible points
  ACHIEVEMENTS.forEach(a => {
    maxPossiblePoints += ACHIEVEMENT_TIER_POINTS[a.tier]
  })
  
  // Normalize to 0-100 scale
  const score = maxPossiblePoints > 0 
    ? Math.round((totalPoints / maxPossiblePoints) * 100)
    : 0
  
  return { 
    score: Math.min(100, score), 
    unlockedCount: unlocked.length,
    totalPossible: ACHIEVEMENTS.length
  }
}

// =============================================================================
// SPARTAN SCORE DECAY SYSTEM
// =============================================================================
// Philosophy: Light, fair decay that only penalizes true inactivity
// - No punishment for lower-frequency training plans
// - No punishment based on rep totals
// - Only decay after meaningful inactivity (4+ days)
// - Always recoverable, never demoralizing

const DECAY_CONFIG = {
  gracePeriodDays: 3,      // No decay for first 3 rest days
  smallDecayDays: 4,       // After 4 days: small decay
  mediumDecayDays: 7,      // After 7 days: medium decay
  largeDecayDays: 14,      // After 14 days: larger decay
  smallDecayAmount: 3,     // -3 points after 4 days
  mediumDecayAmount: 5,    // -5 additional after 7 days
  largeDecayAmount: 8,     // -8 additional after 14 days
  minimumScore: 50,        // Score floor - never drops below this
}

interface DecayInfo {
  daysInactive: number
  decayAmount: number
  decayApplied: boolean
  message: string
}

/**
 * Calculate score decay based on inactivity
 * Returns the decay amount to subtract from the total score
 */
export function calculateScoreDecay(): DecayInfo {
  const logs = getWorkoutLogs()
  
  if (logs.length === 0) {
    return {
      daysInactive: 0,
      decayAmount: 0,
      decayApplied: false,
      message: 'Start training to build your score',
    }
  }
  
  // Get the most recent workout date
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  )
  const lastWorkoutDate = new Date(sortedLogs[0].sessionDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastWorkoutDate.setHours(0, 0, 0, 0)
  
  const daysInactive = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // No decay within grace period
  if (daysInactive <= DECAY_CONFIG.gracePeriodDays) {
    return {
      daysInactive,
      decayAmount: 0,
      decayApplied: false,
      message: 'Score stable',
    }
  }
  
  // Calculate decay based on inactivity level
  let decayAmount = 0
  let message = ''
  
  if (daysInactive >= DECAY_CONFIG.largeDecayDays) {
    decayAmount = DECAY_CONFIG.smallDecayAmount + DECAY_CONFIG.mediumDecayAmount + DECAY_CONFIG.largeDecayAmount
    message = `${daysInactive} days since last workout. Train to recover your score.`
  } else if (daysInactive >= DECAY_CONFIG.mediumDecayDays) {
    decayAmount = DECAY_CONFIG.smallDecayAmount + DECAY_CONFIG.mediumDecayAmount
    message = `${daysInactive} days rest. A workout will restore your momentum.`
  } else if (daysInactive >= DECAY_CONFIG.smallDecayDays) {
    decayAmount = DECAY_CONFIG.smallDecayAmount
    message = `${daysInactive} days since last session. Time to get back to it.`
  }
  
  return {
    daysInactive,
    decayAmount,
    decayApplied: decayAmount > 0,
    message,
  }
}

/**
 * Get the decay-adjusted minimum score floor
 */
function getScoreFloor(): number {
  return DECAY_CONFIG.minimumScore
}

// Calculate total Spartan Strength Score (0-1000 scale)
export function calculateSpartanScore(): StrengthScoreBreakdown {
  const skillResult = calculateSkillScore()
  const strengthResult = calculateStrengthScore()
  const readinessResult = calculateReadinessScore()
  const consistencyResult = calculateConsistencyScore()
  const achievementResult = calculateAchievementScore()
  
  // Check data quality
  const hasSkillData = skillResult.details.length > 0
  const hasStrengthData = strengthResult.details.length > 0
  const hasSessionData = readinessResult.score > 0
  const hasWorkoutData = consistencyResult.weeklyWorkouts > 0
  const hasAchievementData = achievementResult.unlockedCount > 0
  
  let dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent' = 'insufficient'
  if (hasSkillData && hasStrengthData && hasSessionData && hasWorkoutData) {
    dataQuality = 'excellent'
  } else if ((hasSkillData || hasStrengthData) && (hasSessionData || hasWorkoutData)) {
    dataQuality = 'good'
  } else if (hasSkillData || hasStrengthData || hasSessionData || hasWorkoutData || hasAchievementData) {
    dataQuality = 'partial'
  }
  
  const hasEnoughData = dataQuality !== 'insufficient'
  
  // Calculate weighted score (0-100 base)
  const baseScore = 
    (skillResult.score * WEIGHTS.skill) +
    (strengthResult.score * WEIGHTS.strength) +
    (consistencyResult.score * WEIGHTS.consistency) +
    (readinessResult.score * WEIGHTS.readiness) +
    (achievementResult.score * WEIGHTS.achievements)
  
  // Convert to 0-1000 scale
  let totalScore = Math.round(Math.max(0, Math.min(1000, baseScore * 10)))
  
  // Apply inactivity decay (light, fair, recoverable)
  const decayInfo = calculateScoreDecay()
  if (decayInfo.decayApplied) {
    totalScore = Math.max(getScoreFloor(), totalScore - decayInfo.decayAmount)
  }
  
  const level = getSpartanLevel(totalScore)
  const levelProgress = getLevelProgress(totalScore)
  
  // Build components for detailed breakdown
  const components: ScoreComponent[] = [
    {
      raw: skillResult.score,
      weighted: Math.round(skillResult.score * WEIGHTS.skill * 10),
      weight: WEIGHTS.skill,
      label: 'Skill Progress',
      description: skillResult.details.length > 0 
        ? `Based on ${skillResult.details.map(d => d.skill).join(', ')}`
        : 'No skills tracked yet'
    },
    {
      raw: strengthResult.score,
      weighted: Math.round(strengthResult.score * WEIGHTS.strength * 10),
      weight: WEIGHTS.strength,
      label: 'Weighted Strength',
      description: strengthResult.details.length > 0
        ? `Based on ${strengthResult.details.map(d => d.exercise).join(', ')}`
        : 'No strength records yet'
    },
    {
      raw: consistencyResult.score,
      weighted: Math.round(consistencyResult.score * WEIGHTS.consistency * 10),
      weight: WEIGHTS.consistency,
      label: 'Training Consistency',
      description: consistencyResult.weeklyWorkouts > 0 
        ? `${consistencyResult.weeklyWorkouts} workouts this week`
        : 'No recent workouts'
    },
    {
      raw: achievementResult.score,
      weighted: Math.round(achievementResult.score * WEIGHTS.achievements * 10),
      weight: WEIGHTS.achievements,
      label: 'Achievements',
      description: achievementResult.unlockedCount > 0 
        ? `${achievementResult.unlockedCount} of ${achievementResult.totalPossible} unlocked`
        : 'No achievements yet'
    }
  ]
  
  // Generate explanation and focus areas
  const { explanation, focusAreas, strengths } = generateScoreExplanation(
    skillResult, strengthResult, readinessResult, consistencyResult, level
  )
  
  return {
    skillScore: skillResult.score,
    strengthScore: strengthResult.score,
    readinessScore: readinessResult.score,
    consistencyScore: consistencyResult.score,
    achievementScore: achievementResult.score,
    components,
    totalScore,
    level,
    levelProgress,
    explanation,
  focusAreas,
  strengths,
  dataQuality,
  hasEnoughData,
  decayInfo,
  }
  }

// Generate explanation based on scores
function generateScoreExplanation(
  skillResult: { score: number; details: { skill: string; level: number; score: number }[] },
  strengthResult: { score: number; details: { exercise: string; oneRM: number; score: number }[] },
  readinessResult: { score: number; description: string },
  consistencyResult: { score: number; weeklyWorkouts: number; daysSinceLastWorkout: number },
  achievementResult: { score: number; unlockedCount: number; totalCount: number; earnedPoints: number },
  level: SpartanLevel
): { explanation: string; focusAreas: string[]; strengths: string[] } {
  const focusAreas: string[] = []
  const strengths: string[] = []
  
  // Analyze each component
  if (skillResult.score >= 60) {
    strengths.push('Strong skill progression')
  } else if (skillResult.score < 40 && skillResult.details.length > 0) {
    focusAreas.push('Skill progression')
  }
  
  if (strengthResult.score >= 60) {
    strengths.push('Solid weighted strength')
  } else if (strengthResult.score < 40 && strengthResult.details.length > 0) {
    focusAreas.push('Weighted strength development')
  }
  
  if (consistencyResult.score >= 60) {
    strengths.push('Consistent training')
  } else if (consistencyResult.score < 40) {
    focusAreas.push('Training consistency')
  }
  
  if (readinessResult.score >= 60) {
    strengths.push('High progression readiness')
  } else if (readinessResult.score < 40) {
    focusAreas.push('Build skill density')
  }
  
  if (achievementResult.score >= 60) {
    strengths.push('Achievement hunter')
  }
  
  // Get constraint insight for additional focus
  const constraint = getConstraintInsight()
  if (constraint.hasInsight && constraint.label !== 'Training Balanced') {
    focusAreas.unshift(constraint.label)
  }
  
  // Build explanation
  let explanation = ''
  if (strengths.length > 0 && focusAreas.length > 0) {
    explanation = `Your ${strengths[0].toLowerCase()} is a strength. Focus on ${focusAreas[0].toLowerCase()} to continue progressing.`
  } else if (strengths.length > 0) {
    explanation = `Strong performance across all areas. Maintain your ${strengths[0].toLowerCase()} while pushing for new personal records.`
  } else if (focusAreas.length > 0) {
    explanation = `Building your foundation. Prioritize ${focusAreas[0].toLowerCase()} to see the most improvement.`
  } else {
    explanation = 'Log workouts and skill sessions to unlock personalized insights.'
  }
  
  return { explanation, focusAreas: focusAreas.slice(0, 3), strengths: strengths.slice(0, 3) }
}

// Get Spartan level based on score (0-1000 scale)
export function getSpartanLevel(score: number): SpartanLevel {
  if (score >= 800) return 'Elite'
  if (score >= 600) return 'Advanced'
  if (score >= 400) return 'Intermediate'
  if (score >= 200) return 'Developing'
  return 'Beginner'
}

// Get progress within current level (0-100%)
export function getLevelProgress(score: number): number {
  const levelThresholds = [0, 200, 400, 600, 800, 1000]
  for (let i = 0; i < levelThresholds.length - 1; i++) {
    if (score < levelThresholds[i + 1]) {
      const levelStart = levelThresholds[i]
      const levelEnd = levelThresholds[i + 1]
      return Math.round(((score - levelStart) / (levelEnd - levelStart)) * 100)
    }
  }
  return 100
}

// Get color for level
export function getLevelColor(level: SpartanLevel): string {
  switch (level) {
    case 'Elite':
      return '#FFD700' // Gold
    case 'Advanced':
      return '#E63946' // Red  
    case 'Intermediate':
      return '#60A5FA' // Blue
    case 'Developing':
      return '#A0AEC0' // Gray
    case 'Beginner':
    default:
      return '#718096' // Darker gray
  }
}

// Get background gradient for level
export function getLevelGradient(level: SpartanLevel): string {
  switch (level) {
    case 'Elite':
      return 'from-amber-500/20 to-yellow-500/10'
    case 'Advanced':
      return 'from-red-500/20 to-rose-500/10'
    case 'Intermediate':
      return 'from-blue-500/20 to-cyan-500/10'
    case 'Developing':
      return 'from-slate-500/20 to-gray-500/10'
    case 'Beginner':
    default:
      return 'from-gray-500/20 to-slate-500/10'
  }
}

// Helper to get start of week
function getStartOfWeek(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}
