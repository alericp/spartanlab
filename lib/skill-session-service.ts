// Skill Session Service
// Manages skill session logging and retrieval for the readiness engine

import type { SkillSession, SkillSet, HoldQuality } from '@/types/skill-readiness'
import { calculateSessionDensity } from './skill-density-engine'

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'spartanlab_skill_sessions'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// =============================================================================
// GET SESSIONS
// =============================================================================

/**
 * Get all skill sessions
 */
export function getSkillSessions(): SkillSession[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

/**
 * Get sessions for a specific skill
 */
export function getSessionsBySkill(skillName: string): SkillSession[] {
  return getSkillSessions()
    .filter(s => s.skillName === skillName)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
}

/**
 * Get sessions for a specific skill and level
 */
export function getSessionsBySkillAndLevel(skillName: string, level: number): SkillSession[] {
  return getSkillSessions()
    .filter(s => s.skillName === skillName && s.level === level)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
}

/**
 * Get the most recent session for a skill
 */
export function getLatestSession(skillName: string): SkillSession | null {
  const sessions = getSessionsBySkill(skillName)
  return sessions[0] ?? null
}

/**
 * Get sessions from the last N days
 */
export function getRecentSessions(skillName: string, days: number = 7): SkillSession[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  return getSkillSessions()
    .filter(s => 
      s.skillName === skillName && 
      new Date(s.sessionDate) >= cutoff
    )
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
}

/**
 * Get all skill sessions from the last N days (across all skills)
 */
export function getRecentSkillSessions(days: number = 14): SkillSession[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  return getSkillSessions()
    .filter(s => new Date(s.sessionDate) >= cutoff)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
}

// =============================================================================
// SAVE SESSION
// =============================================================================

export interface SaveSessionInput {
  skillName: string
  level: number
  sets: SkillSet[]
  sessionDate?: string
  notes?: string
}

/**
 * Save a new skill session
 */
export function saveSkillSession(input: SaveSessionInput): SkillSession {
  const sessionDate = input.sessionDate || new Date().toISOString().split('T')[0]
  const sessionDensity = calculateSessionDensity(input.sets)
  
  const session: SkillSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    skillName: input.skillName,
    level: input.level,
    sets: input.sets,
    sessionDate,
    sessionDensity,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  }
  
  if (!isBrowser()) return session
  
  const sessions = getSkillSessions()
  sessions.push(session)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  
  return session
}

/**
 * Quick log helper - creates a session from simple inputs
 */
export function quickLogSession(
  skillName: string,
  level: number,
  holdTimes: number[],
  quality: HoldQuality = 'clean',
  sessionDate?: string
): SkillSession {
  const sets: SkillSet[] = holdTimes.map(holdSeconds => ({
    holdSeconds,
    quality,
  }))
  
  return saveSkillSession({
    skillName,
    level,
    sets,
    sessionDate,
  })
}

// =============================================================================
// UPDATE SESSION
// =============================================================================

/**
 * Update an existing session
 */
export function updateSkillSession(
  sessionId: string,
  updates: Partial<Omit<SkillSession, 'id' | 'createdAt'>>
): SkillSession | null {
  if (!isBrowser()) return null
  
  const sessions = getSkillSessions()
  const index = sessions.findIndex(s => s.id === sessionId)
  
  if (index === -1) return null
  
  const session = sessions[index]
  const updatedSession: SkillSession = {
    ...session,
    ...updates,
    sessionDensity: updates.sets 
      ? calculateSessionDensity(updates.sets) 
      : session.sessionDensity,
  }
  
  sessions[index] = updatedSession
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  
  return updatedSession
}

// =============================================================================
// DELETE SESSION
// =============================================================================

/**
 * Delete a skill session
 */
export function deleteSkillSession(sessionId: string): boolean {
  if (!isBrowser()) return false
  
  const sessions = getSkillSessions()
  const filtered = sessions.filter(s => s.id !== sessionId)
  
  if (filtered.length === sessions.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// =============================================================================
// AGGREGATE HELPERS
// =============================================================================

/**
 * Get aggregate stats across all sessions for a skill/level
 */
export function getSkillSessionStats(skillName: string, level: number): {
  totalSessions: number
  totalSets: number
  totalHoldTime: number
  bestHold: number
  averageHold: number
  lastSessionDate: string | null
} {
  const sessions = getSessionsBySkillAndLevel(skillName, level)
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalSets: 0,
      totalHoldTime: 0,
      bestHold: 0,
      averageHold: 0,
      lastSessionDate: null,
    }
  }
  
  const allSets = sessions.flatMap(s => s.sets)
  const totalHoldTime = allSets.reduce((sum, s) => sum + s.holdSeconds, 0)
  const bestHold = Math.max(...allSets.map(s => s.holdSeconds))
  const averageHold = allSets.length > 0 
    ? Math.round((totalHoldTime / allSets.length) * 10) / 10 
    : 0
  
  return {
    totalSessions: sessions.length,
    totalSets: allSets.length,
    totalHoldTime,
    bestHold,
    averageHold,
    lastSessionDate: sessions[0].sessionDate,
  }
}

/**
 * Get weekly summary for a skill
 */
export function getWeeklySummary(skillName: string, level: number): {
  sessionsThisWeek: number
  totalDensity: number
  avgSessionDensity: number
} {
  const sessions = getRecentSessions(skillName, 7)
    .filter(s => s.level === level)
  
  if (sessions.length === 0) {
    return {
      sessionsThisWeek: 0,
      totalDensity: 0,
      avgSessionDensity: 0,
    }
  }
  
  const totalDensity = sessions.reduce((sum, s) => sum + s.sessionDensity, 0)
  
  return {
    sessionsThisWeek: sessions.length,
    totalDensity,
    avgSessionDensity: Math.round(totalDensity / sessions.length),
  }
}

// =============================================================================
// MIGRATION HELPER
// =============================================================================

import { saveStrengthRecord, getStrengthRecords } from './strength-service'
import { saveSkillProgression, getSkillProgressions } from './data-service'
import { saveWorkoutLog, getWorkoutLogs } from './workout-log-service'

/**
 * Seed sample sessions for testing/demo
 * Only use in development or for initial demo data
 */
export function seedSampleSessions(): void {
  if (!isBrowser()) return
  
  // Only seed if no sessions exist
  const existing = getSkillSessions()
  if (existing.length > 0) return
  
  // Sample front lever sessions over past 2 weeks
  const now = new Date()
  const sampleSessions: SaveSessionInput[] = [
    {
      skillName: 'front_lever',
      level: 1, // Advanced Tuck
      sets: [
        { holdSeconds: 9, quality: 'clean' },
        { holdSeconds: 8, quality: 'clean' },
        { holdSeconds: 7, quality: 'clean' },
        { holdSeconds: 6, quality: 'shaky' },
      ],
      sessionDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      skillName: 'front_lever',
      level: 1,
      sets: [
        { holdSeconds: 7, quality: 'clean' },
        { holdSeconds: 7, quality: 'clean' },
        { holdSeconds: 6, quality: 'clean' },
        { holdSeconds: 6, quality: 'clean' },
      ],
      sessionDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      skillName: 'front_lever',
      level: 1,
      sets: [
        { holdSeconds: 6, quality: 'clean' },
        { holdSeconds: 5, quality: 'clean' },
        { holdSeconds: 5, quality: 'shaky' },
        { holdSeconds: 4, quality: 'shaky' },
      ],
      sessionDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      skillName: 'front_lever',
      level: 1,
      sets: [
        { holdSeconds: 5, quality: 'clean' },
        { holdSeconds: 5, quality: 'clean' },
        { holdSeconds: 4, quality: 'shaky' },
      ],
      sessionDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    // Planche samples
    {
      skillName: 'planche',
      level: 0, // Tuck
      sets: [
        { holdSeconds: 12, quality: 'clean' },
        { holdSeconds: 11, quality: 'clean' },
        { holdSeconds: 10, quality: 'clean' },
      ],
      sessionDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      skillName: 'planche',
      level: 0,
      sets: [
        { holdSeconds: 10, quality: 'clean' },
        { holdSeconds: 9, quality: 'clean' },
        { holdSeconds: 8, quality: 'clean' },
      ],
      sessionDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    // Muscle up samples
    {
      skillName: 'muscle_up',
      level: 1, // Strict
      sets: [
        { holdSeconds: 3, quality: 'clean' },
        { holdSeconds: 3, quality: 'clean' },
        { holdSeconds: 2, quality: 'shaky' },
      ],
      sessionDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ]
  
  sampleSessions.forEach(s => saveSkillSession(s))
  
  // Seed strength records (with progression history)
  const existingStrength = getStrengthRecords()
  if (existingStrength.length === 0) {
    // Weighted pull-ups with progression
    saveStrengthRecord('weighted_pull_up', 25, 5, new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    saveStrengthRecord('weighted_pull_up', 30, 5, new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    saveStrengthRecord('weighted_pull_up', 35, 4, new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    saveStrengthRecord('weighted_pull_up', 40, 3, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    saveStrengthRecord('weighted_pull_up', 45, 3, new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    
    // Weighted dips with progression
    saveStrengthRecord('weighted_dip', 35, 5, new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    saveStrengthRecord('weighted_dip', 45, 5, new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    saveStrengthRecord('weighted_dip', 50, 4, new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    saveStrengthRecord('weighted_dip', 55, 3, new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    
    // Weighted muscle-up
    saveStrengthRecord('weighted_muscle_up', 10, 2, new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  }
  
  // Seed skill progressions
  const existingProgressions = getSkillProgressions()
  if (existingProgressions.length === 0) {
    saveSkillProgression('front_lever', 1, 3) // Advanced Tuck -> Straddle
    saveSkillProgression('planche', 0, 2) // Tuck -> Advanced Tuck -> Straddle
    saveSkillProgression('muscle_up', 1, 2) // Strict -> Weighted
  }
  
  // Seed workout logs
  const existingWorkouts = getWorkoutLogs()
  if (existingWorkouts.length === 0) {
    // Sample workouts over the past several weeks
    saveWorkoutLog({
      sessionName: 'Pull Day',
      sessionType: 'mixed',
      sessionDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMinutes: 65,
      focusArea: 'front_lever',
      exercises: [
        { id: '1', name: 'Front Lever Holds', category: 'skill', sets: 4, holdSeconds: 7, completed: true },
        { id: '2', name: 'Weighted Pull-Ups', category: 'pull', sets: 5, reps: 5, load: 45, completed: true },
        { id: '3', name: 'Bodyweight Rows', category: 'pull', sets: 3, reps: 12, completed: true },
        { id: '4', name: 'Hollow Body Hold', category: 'core', sets: 3, holdSeconds: 30, completed: true },
      ],
    })
    
    saveWorkoutLog({
      sessionName: 'Push Day',
      sessionType: 'mixed',
      sessionDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMinutes: 55,
      focusArea: 'planche',
      exercises: [
        { id: '1', name: 'Tuck Planche Hold', category: 'skill', sets: 4, holdSeconds: 10, completed: true },
        { id: '2', name: 'Weighted Dips', category: 'push', sets: 5, reps: 4, load: 55, completed: true },
        { id: '3', name: 'Pseudo Planche Push-Ups', category: 'push', sets: 3, reps: 10, completed: true },
        { id: '4', name: 'L-Sit Hold', category: 'core', sets: 3, holdSeconds: 20, completed: true },
      ],
    })
    
    saveWorkoutLog({
      sessionName: 'Skill Day',
      sessionType: 'skill',
      sessionDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMinutes: 45,
      focusArea: 'muscle_up',
      exercises: [
        { id: '1', name: 'Muscle-Up', category: 'skill', sets: 5, reps: 3, completed: true },
        { id: '2', name: 'Pull-Ups', category: 'pull', sets: 3, reps: 10, completed: true },
        { id: '3', name: 'Dips', category: 'push', sets: 3, reps: 12, completed: true },
      ],
    })
    
    saveWorkoutLog({
      sessionName: 'Full Body',
      sessionType: 'mixed',
      sessionDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMinutes: 70,
      focusArea: 'general',
      exercises: [
        { id: '1', name: 'Weighted Pull-Ups', category: 'pull', sets: 4, reps: 5, load: 40, completed: true },
        { id: '2', name: 'Weighted Dips', category: 'push', sets: 4, reps: 5, load: 50, completed: true },
        { id: '3', name: 'Front Lever Holds', category: 'skill', sets: 3, holdSeconds: 6, completed: true },
        { id: '4', name: 'Dragon Flags', category: 'core', sets: 3, reps: 8, completed: true },
      ],
    })
    
    saveWorkoutLog({
      sessionName: 'Pull Focus',
      sessionType: 'strength',
      sessionDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMinutes: 50,
      focusArea: 'weighted_strength',
      exercises: [
        { id: '1', name: 'Weighted Pull-Ups', category: 'pull', sets: 5, reps: 4, load: 35, completed: true },
        { id: '2', name: 'Archer Pull-Ups', category: 'pull', sets: 3, reps: 5, completed: true },
        { id: '3', name: 'Hanging Knee Raises', category: 'core', sets: 3, reps: 15, completed: true },
      ],
    })
    
    saveWorkoutLog({
      sessionName: 'Push Focus',
      sessionType: 'strength',
      sessionDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMinutes: 55,
      focusArea: 'weighted_strength',
      exercises: [
        { id: '1', name: 'Weighted Dips', category: 'push', sets: 5, reps: 5, load: 45, completed: true },
        { id: '2', name: 'Pike Push-Ups', category: 'push', sets: 3, reps: 12, completed: true },
        { id: '3', name: 'Planche Lean', category: 'skill', sets: 3, holdSeconds: 20, completed: true },
      ],
    })
  }
}
