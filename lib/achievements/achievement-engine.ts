/**
 * SpartanLab Achievement Engine
 * 
 * Evaluates achievement conditions against user training data.
 * Detects newly unlocked achievements and prevents duplicates.
 */

import { 
  ACHIEVEMENTS, 
  type AchievementDefinition, 
  type UnlockedAchievement,
  type AchievementCondition,
  getAchievementById,
} from './achievement-definitions'

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'spartanlab_achievements'

/**
 * Get all unlocked achievements from storage
 */
export function getUnlockedAchievements(): UnlockedAchievement[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as UnlockedAchievement[]
  } catch {
    return []
  }
}

/**
 * Save an unlocked achievement
 */
function saveUnlockedAchievement(achievement: UnlockedAchievement): void {
  if (typeof window === 'undefined') return
  
  const current = getUnlockedAchievements()
  
  // Prevent duplicates
  if (current.some(a => a.achievementId === achievement.achievementId)) {
    return
  }
  
  const updated = [...current, achievement]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

/**
 * Check if an achievement is already unlocked
 */
export function isAchievementUnlocked(achievementId: string): boolean {
  const unlocked = getUnlockedAchievements()
  return unlocked.some(a => a.achievementId === achievementId)
}

// =============================================================================
// METRIC COLLECTION
// =============================================================================

interface TrainingMetrics {
  totalWorkouts: number
  currentStreak: number
  longestStreak: number
  totalReps: number
  pullUpMax: number
  pushUpMax: number
  dipMax: number
  weightedPullUpLoad: number
  weightedDipLoad: number
  frontLeverLevel: number
  plancheLevel: number
  muscleUpLevel: number
  handstandPushUpLevel: number
}

/**
 * Gather current training metrics from localStorage
 */
export function gatherTrainingMetrics(): TrainingMetrics {
  if (typeof window === 'undefined') {
    return getDefaultMetrics()
  }
  
  try {
    // Get athlete profile for benchmarks
    const profileStr = localStorage.getItem('spartanlab_athlete_profile')
    const profile = profileStr ? JSON.parse(profileStr) : null
    
    // Get workout logs for counts
    const workoutsStr = localStorage.getItem('spartanlab_workouts')
    const workouts = workoutsStr ? JSON.parse(workoutsStr) : []
    
    // Get skill progressions
    const skillsStr = localStorage.getItem('spartanlab_skills')
    const skills = skillsStr ? JSON.parse(skillsStr) : []
    
    // Get strength records
    const strengthStr = localStorage.getItem('spartanlab_strength')
    const strengthRecords = strengthStr ? JSON.parse(strengthStr) : []
    
    // Get progress/streak data
    const progressStr = localStorage.getItem('spartanlab_progress')
    const progress = progressStr ? JSON.parse(progressStr) : null
    
    // Calculate total reps from workout logs
    let totalReps = 0
    if (Array.isArray(workouts)) {
      workouts.forEach((workout: any) => {
        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach((ex: any) => {
            const sets = ex.sets || 1
            const reps = ex.reps || 0
            totalReps += sets * reps
          })
        }
      })
    }
    
    // Get skill levels
    const getSkillLevel = (skillName: string): number => {
      const skill = skills.find((s: any) => 
        s.skillName === skillName || s.skill_name === skillName
      )
      return skill?.currentLevel || skill?.current_level || 0
    }
    
    // Get max weighted load for an exercise
    const getMaxWeight = (exercise: string): number => {
      const records = strengthRecords.filter((r: any) => r.exercise === exercise)
      if (records.length === 0) return 0
      return Math.max(...records.map((r: any) => r.weightAdded || r.weight_added || 0))
    }
    
    return {
      totalWorkouts: Array.isArray(workouts) ? workouts.length : 0,
      currentStreak: progress?.currentStreak || 0,
      longestStreak: progress?.longestStreak || progress?.currentStreak || 0,
      totalReps,
      pullUpMax: profile?.pullUpMax || 0,
      pushUpMax: profile?.pushUpMax || 0,
      dipMax: profile?.dipMax || 0,
      weightedPullUpLoad: profile?.weightedPullUpLoad || getMaxWeight('weighted_pull_up'),
      weightedDipLoad: profile?.weightedDipLoad || getMaxWeight('weighted_dip'),
      frontLeverLevel: getSkillLevel('front_lever'),
      plancheLevel: getSkillLevel('planche'),
      muscleUpLevel: getSkillLevel('muscle_up'),
      handstandPushUpLevel: getSkillLevel('handstand_pushup'),
    }
  } catch (e) {
    console.error('[Achievements] Error gathering metrics:', e)
    return getDefaultMetrics()
  }
}

function getDefaultMetrics(): TrainingMetrics {
  return {
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalReps: 0,
    pullUpMax: 0,
    pushUpMax: 0,
    dipMax: 0,
    weightedPullUpLoad: 0,
    weightedDipLoad: 0,
    frontLeverLevel: 0,
    plancheLevel: 0,
    muscleUpLevel: 0,
    handstandPushUpLevel: 0,
  }
}

// =============================================================================
// CONDITION EVALUATION
// =============================================================================

/**
 * Check if a single condition is met
 */
function evaluateCondition(condition: AchievementCondition, metrics: TrainingMetrics): { met: boolean; value: number } {
  switch (condition.type) {
    case 'workout_count':
      return { met: metrics.totalWorkouts >= condition.threshold, value: metrics.totalWorkouts }
    
    case 'streak_days':
      // Check both current and longest streak
      const bestStreak = Math.max(metrics.currentStreak, metrics.longestStreak)
      return { met: bestStreak >= condition.threshold, value: bestStreak }
    
    case 'total_reps':
      return { met: metrics.totalReps >= condition.threshold, value: metrics.totalReps }
    
    case 'bodyweight_reps':
      let bwValue = 0
      if (condition.target === 'pull_up') bwValue = metrics.pullUpMax
      else if (condition.target === 'push_up') bwValue = metrics.pushUpMax
      else if (condition.target === 'dip') bwValue = metrics.dipMax
      return { met: bwValue >= condition.threshold, value: bwValue }
    
    case 'weighted_load':
      let loadValue = 0
      if (condition.target === 'weighted_pull_up') loadValue = metrics.weightedPullUpLoad
      else if (condition.target === 'weighted_dip') loadValue = metrics.weightedDipLoad
      return { met: loadValue >= condition.threshold, value: loadValue }
    
    case 'skill_level':
      let skillValue = 0
      if (condition.target === 'front_lever') skillValue = metrics.frontLeverLevel
      else if (condition.target === 'planche') skillValue = metrics.plancheLevel
      else if (condition.target === 'muscle_up') skillValue = metrics.muscleUpLevel
      else if (condition.target === 'handstand_pushup') skillValue = metrics.handstandPushUpLevel
      return { met: skillValue >= condition.threshold, value: skillValue }
    
    case 'first_action':
      // Generic first action - handled by workout_count with threshold 1
      return { met: metrics.totalWorkouts >= 1, value: metrics.totalWorkouts }
    
    default:
      return { met: false, value: 0 }
  }
}

// =============================================================================
// ENGINE FUNCTIONS
// =============================================================================

export interface AchievementCheckResult {
  newlyUnlocked: AchievementDefinition[]
  alreadyUnlocked: string[]
  totalUnlocked: number
  totalPoints: number
}

/**
 * Check all achievements and return newly unlocked ones
 */
export function checkAchievements(): AchievementCheckResult {
  const metrics = gatherTrainingMetrics()
  const currentlyUnlocked = getUnlockedAchievements()
  const unlockedIds = new Set(currentlyUnlocked.map(a => a.achievementId))
  
  const newlyUnlocked: AchievementDefinition[] = []
  
  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) continue
    
    // Evaluate condition
    const { met, value } = evaluateCondition(achievement.condition, metrics)
    
    if (met) {
      // Unlock the achievement
      const unlocked: UnlockedAchievement = {
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
        triggerValue: value,
      }
      saveUnlockedAchievement(unlocked)
      newlyUnlocked.push(achievement)
      unlockedIds.add(achievement.id)
    }
  }
  
  // Calculate total points
  let totalPoints = 0
  for (const id of unlockedIds) {
    const achievement = getAchievementById(id)
    if (achievement) totalPoints += achievement.pointValue
  }
  
  return {
    newlyUnlocked,
    alreadyUnlocked: Array.from(unlockedIds),
    totalUnlocked: unlockedIds.size,
    totalPoints,
  }
}

/**
 * Get achievements with unlock status and progress
 */
export interface AchievementWithProgress extends AchievementDefinition {
  unlocked: boolean
  unlockedAt?: string
  currentValue: number
  progressPercent: number
}

export function getAchievementsWithProgress(): AchievementWithProgress[] {
  const metrics = gatherTrainingMetrics()
  const unlocked = getUnlockedAchievements()
  const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u]))
  
  return ACHIEVEMENTS.map(achievement => {
    const { met, value } = evaluateCondition(achievement.condition, metrics)
    const unlockedData = unlockedMap.get(achievement.id)
    
    // Calculate progress percentage
    const threshold = achievement.condition.threshold
    const progressPercent = Math.min(100, Math.round((value / threshold) * 100))
    
    return {
      ...achievement,
      unlocked: !!unlockedData || met,
      unlockedAt: unlockedData?.unlockedAt,
      currentValue: value,
      progressPercent,
    }
  })
}

/**
 * Get summary statistics
 */
export interface AchievementSummary {
  totalAchievements: number
  unlockedCount: number
  totalPoints: number
  earnedPoints: number
  percentComplete: number
  recentUnlocks: UnlockedAchievement[]
}

export function getAchievementSummary(): AchievementSummary {
  const unlocked = getUnlockedAchievements()
  const unlockedIds = unlocked.map(u => u.achievementId)
  
  let earnedPoints = 0
  for (const id of unlockedIds) {
    const achievement = getAchievementById(id)
    if (achievement) earnedPoints += achievement.pointValue
  }
  
  const totalPoints = ACHIEVEMENTS.reduce((sum, a) => sum + a.pointValue, 0)
  
  // Get recent unlocks (last 5, sorted by date)
  const recentUnlocks = [...unlocked]
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 5)
  
  return {
    totalAchievements: ACHIEVEMENTS.length,
    unlockedCount: unlocked.length,
    totalPoints,
    earnedPoints,
    percentComplete: Math.round((unlocked.length / ACHIEVEMENTS.length) * 100),
    recentUnlocks,
  }
}

/**
 * Force check achievements on relevant events
 * Call this after workout completion, profile updates, etc.
 */
export function onTrainingEvent(): AchievementDefinition[] {
  const result = checkAchievements()
  return result.newlyUnlocked
}
