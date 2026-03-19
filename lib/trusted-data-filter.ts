/**
 * Trusted Data Filter
 * 
 * Provides filtering utilities to ensure only trusted/real user data
 * is used for metrics, achievements, challenges, and dashboard calculations.
 * 
 * IMPORTANT: This module is part of the truth-state integrity system.
 * Demo/seed/preview data should NEVER affect real user metrics.
 */

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getStrengthRecords, type StrengthRecord } from './strength-service'
import { getSkillSessions, type SkillSession } from './skill-session-service'

/**
 * Filter workout logs to only trusted data
 * Excludes: demo workouts, seed workouts, and explicitly untrusted logs
 */
export function getTrustedWorkoutLogs(): WorkoutLog[] {
  return getWorkoutLogs().filter(log => {
    // Reject demo workouts
    if (log.sourceRoute === 'demo' || (log as any).isDemo === true) return false
    // Only include explicitly trusted logs or logs without the flag (legacy data)
    return log.trusted !== false
  })
}

/**
 * Filter strength records to only trusted data
 */
export function getTrustedStrengthRecords(): StrengthRecord[] {
  return getStrengthRecords().filter(record => {
    // Check for demo/seed markers if they exist
    const rec = record as StrengthRecord & { sourceRoute?: string; isDemo?: boolean }
    if (rec.sourceRoute === 'demo' || rec.isDemo === true) return false
    return true
  })
}

/**
 * Filter skill sessions to only trusted data
 */
export function getTrustedSkillSessions(): SkillSession[] {
  return getSkillSessions().filter(session => {
    // Check for demo/seed markers if they exist
    const sess = session as SkillSession & { sourceRoute?: string; isDemo?: boolean; trusted?: boolean }
    if (sess.sourceRoute === 'demo' || sess.isDemo === true) return false
    if (sess.trusted === false) return false
    return true
  })
}

/**
 * Count trusted workout logs
 */
export function getTrustedWorkoutCount(): number {
  return getTrustedWorkoutLogs().length
}

/**
 * Check if user has any trusted workout data
 */
export function hasTrustedWorkoutData(): boolean {
  return getTrustedWorkoutCount() > 0
}

/**
 * Check if user has enough trusted data for mature metrics (>= 3 workouts)
 */
export function hasMatureTrustedData(): boolean {
  return getTrustedWorkoutCount() >= 3
}
