// Recovery Engine service for training readiness estimation
// Simple deterministic recovery signal based on training patterns
// 
// [PROFILE-TRUTH-CONSUMPTION] UPGRADED: Now incorporates canonical profile
// recovery data (sleepQuality, energyLevel, stressLevel, recoveryConfidence)
// alongside workout-derived signals.

import { getWorkoutsLastNDays, calculateWeeklyVolume } from './volume-analyzer'
import { getLatestWorkout } from './workout-log-service'
import { getCanonicalProfile } from './canonical-profile-service'

export type RecoveryLevel = 'HIGH' | 'MODERATE' | 'LOW'

export interface RecoverySignal {
  level: RecoveryLevel
  score: number // 0-100
  message: string
  factors: {
    volumeLoad: 'low' | 'moderate' | 'high'
    trainingFrequency: 'low' | 'moderate' | 'high'
    recencyGap: 'optimal' | 'short' | 'long'
    /** [PROFILE-TRUTH-CONSUMPTION] Profile-derived recovery modifier */
    profileRecoveryModifier?: 'good' | 'normal' | 'poor' | null
  }
}

// Calculate days since last workout
function getDaysSinceLastWorkout(): number {
  const lastWorkout = getLatestWorkout()
  if (!lastWorkout) return 999 // No workouts logged
  
  const lastDate = new Date(lastWorkout.sessionDate)
  const now = new Date()
  const diffMs = now.getTime() - lastDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * [PROFILE-TRUTH-CONSUMPTION] Get recovery modifier from canonical profile.
 * Uses athlete's self-reported recovery context to adjust training recommendations.
 */
function getProfileRecoveryModifier(): { modifier: number; quality: 'good' | 'normal' | 'poor' | null } {
  try {
    const profile = getCanonicalProfile()
    const recoveryQuality = profile.recoveryQuality
    const recoveryRaw = profile.recoveryRaw
    
    // If we have raw recovery data, compute from that
    if (recoveryRaw) {
      const values = [
        recoveryRaw.sleepQuality,
        recoveryRaw.energyLevel,
        recoveryRaw.stressLevel,  // 'good' = low stress
        recoveryRaw.recoveryConfidence,
      ].filter(Boolean) as Array<'good' | 'normal' | 'poor'>
      
      if (values.length >= 2) {
        const poorCount = values.filter(v => v === 'poor').length
        const goodCount = values.filter(v => v === 'good').length
        
        if (poorCount >= 2) {
          console.log('[profile-truth-consumption] Recovery profile indicates poor recovery:', recoveryRaw)
          return { modifier: -15, quality: 'poor' }
        }
        if (goodCount >= 3) {
          console.log('[profile-truth-consumption] Recovery profile indicates good recovery:', recoveryRaw)
          return { modifier: 10, quality: 'good' }
        }
        return { modifier: 0, quality: 'normal' }
      }
    }
    
    // Fall back to derived recoveryQuality
    if (recoveryQuality === 'poor') {
      return { modifier: -15, quality: 'poor' }
    }
    if (recoveryQuality === 'good') {
      return { modifier: 10, quality: 'good' }
    }
    
    return { modifier: 0, quality: null }
  } catch {
    return { modifier: 0, quality: null }
  }
}

// Calculate recovery signal based on training patterns
export function calculateRecoverySignal(): RecoverySignal {
  const weeklyVolume = calculateWeeklyVolume()
  const last7Days = getWorkoutsLastNDays(7)
  const daysSinceWorkout = getDaysSinceLastWorkout()
  
  // [PROFILE-TRUTH-CONSUMPTION] Get profile-based recovery adjustment
  const profileRecovery = getProfileRecoveryModifier()
  
  // Base score starts at 70 (neutral)
  let score = 70
  
  // Factor 1: Volume load (based on total sets this week)
  let volumeLoad: 'low' | 'moderate' | 'high'
  if (weeklyVolume.totalSets < 30) {
    volumeLoad = 'low'
    score += 15
  } else if (weeklyVolume.totalSets < 60) {
    volumeLoad = 'moderate'
    score += 5
  } else {
    volumeLoad = 'high'
    score -= 15
  }
  
  // Factor 2: Training frequency (workouts in last 7 days)
  let trainingFrequency: 'low' | 'moderate' | 'high'
  if (last7Days.length <= 2) {
    trainingFrequency = 'low'
    score += 10
  } else if (last7Days.length <= 4) {
    trainingFrequency = 'moderate'
    score += 0
  } else {
    trainingFrequency = 'high'
    score -= 10
  }
  
  // Factor 3: Days since last workout (recency gap)
  let recencyGap: 'optimal' | 'short' | 'long'
  if (daysSinceWorkout >= 1 && daysSinceWorkout <= 2) {
    recencyGap = 'optimal'
    score += 5
  } else if (daysSinceWorkout < 1) {
    recencyGap = 'short'
    score -= 5
  } else if (daysSinceWorkout > 3) {
    recencyGap = 'long'
    score += 10 // More rest = higher readiness
  } else {
    recencyGap = 'optimal'
  }
  
  // ==========================================================================
  // [PROFILE-TRUTH-CONSUMPTION] Factor 4: Profile-based recovery context
  // ==========================================================================
  // Apply modifier from athlete's self-reported recovery profile
  // This ensures user-reported sleep/stress/energy affects program construction
  score += profileRecovery.modifier
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))
  
  // Determine level and message
  let level: RecoveryLevel
  let message: string
  
  if (score >= 70) {
    level = 'HIGH'
    message = 'Training volume is manageable and recovery gaps are present. Ready for intense training.'
  } else if (score >= 40) {
    level = 'MODERATE'
    message = 'Training load is consistent. Monitor fatigue and consider lighter sessions if needed.'
  } else {
    level = 'LOW'
    message = 'High training density detected. Consider a deload or active recovery day.'
  }
  
  // Edge case: no data
  if (weeklyVolume.workoutsThisWeek === 0 && daysSinceWorkout > 7) {
    level = 'HIGH'
    score = 90
    message = 'Fully rested. Ready to begin a new training block.'
  }
  
  return {
    level,
    score,
    message,
    factors: {
      volumeLoad,
      trainingFrequency,
      recencyGap,
      profileRecoveryModifier: profileRecovery.quality,
    },
  }
}

// Get recovery level color
export function getRecoveryLevelColor(level: RecoveryLevel): string {
  switch (level) {
    case 'HIGH':
      return '#22C55E' // green
    case 'MODERATE':
      return '#EAB308' // yellow
    case 'LOW':
      return '#EF4444' // red
  }
}

// Get recovery level background
export function getRecoveryLevelBg(level: RecoveryLevel): string {
  switch (level) {
    case 'HIGH':
      return 'bg-green-500/10'
    case 'MODERATE':
      return 'bg-yellow-500/10'
    case 'LOW':
      return 'bg-red-500/10'
  }
}
