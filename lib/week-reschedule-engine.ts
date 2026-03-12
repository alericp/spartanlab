// Week Reschedule Engine
// Handles missed days, shifted schedules, and weekly priority preservation

import type { AdaptiveSession, AdaptiveProgram } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export type WeekAdjustmentType = 
  | 'keep_week_as_planned'
  | 'do_missed_now'
  | 'merge_priority_work'
  | 'compress_week'
  | 'drop_lowest_priority'
  | 'shift_schedule'

export interface WeekState {
  totalPlannedDays: number
  completedDays: number[]
  missedDays: number[]
  remainingDays: number
  currentDayInWeek: number // 1-7
}

export interface WeekAdjustment {
  type: WeekAdjustmentType
  label: string
  explanation: string
  originalSchedule: AdaptiveSession[]
  adjustedSchedule: AdaptiveSession[]
  priorityPreserved: string[]
  droppedSessions: string[]
  mergedSessions: { from: string; into: string; exercises: string[] }[]
  wasAdjusted: boolean
}

export interface SessionPriority {
  session: AdaptiveSession
  score: number
  isPrimary: boolean
  goalRelevance: 'high' | 'medium' | 'low'
  canBeMerged: boolean
  canBeDropped: boolean
}

// =============================================================================
// CALCULATE WEEK STATE
// =============================================================================

export function calculateWeekState(
  program: AdaptiveProgram,
  completedSessionIds: string[]
): WeekState {
  const totalDays = program.sessions.length
  const completedDays: number[] = []
  const missedDays: number[] = []
  
  // Get current day of week (1=Monday, 7=Sunday)
  const now = new Date()
  const currentDayInWeek = now.getDay() === 0 ? 7 : now.getDay()
  
  // Simple logic: sessions before current day that weren't completed are missed
  program.sessions.forEach((session, idx) => {
    const dayNum = idx + 1
    const sessionId = `${program.id}-day-${dayNum}`
    
    if (completedSessionIds.includes(sessionId)) {
      completedDays.push(dayNum)
    } else if (dayNum < currentDayInWeek && dayNum <= totalDays) {
      // Only mark as missed if we're past that day
      missedDays.push(dayNum)
    }
  })
  
  const remainingDays = Math.max(0, 7 - currentDayInWeek)
  
  return {
    totalPlannedDays: totalDays,
    completedDays,
    missedDays,
    remainingDays,
    currentDayInWeek,
  }
}

// =============================================================================
// CALCULATE SESSION PRIORITIES
// =============================================================================

export function calculateSessionPriorities(sessions: AdaptiveSession[]): SessionPriority[] {
  return sessions.map(session => {
    // Base score from session properties
    let score = 50
    
    // Primary sessions are highest priority
    if (session.isPrimary) {
      score += 30
    }
    
    // Skill-focused sessions are high priority
    if (session.focus.includes('skill') || session.focusLabel.toLowerCase().includes('skill')) {
      score += 20
    }
    
    // Strength support sessions are medium-high priority
    if (session.focus.includes('strength')) {
      score += 15
    }
    
    // Check exercise composition
    const hasSkillWork = session.exercises.some(e => e.category === 'skill')
    const hasStrengthWork = session.exercises.some(e => e.category === 'strength')
    
    if (hasSkillWork) score += 10
    if (hasStrengthWork) score += 5
    
    // Determine goal relevance
    let goalRelevance: 'high' | 'medium' | 'low' = 'medium'
    if (session.isPrimary || score > 80) {
      goalRelevance = 'high'
    } else if (score < 50) {
      goalRelevance = 'low'
    }
    
    // Determine if can be merged/dropped
    const canBeMerged = !session.isPrimary && session.exercises.length <= 5
    const canBeDropped = goalRelevance === 'low' || (!session.isPrimary && !hasSkillWork)
    
    return {
      session,
      score,
      isPrimary: session.isPrimary,
      goalRelevance,
      canBeMerged,
      canBeDropped,
    }
  }).sort((a, b) => b.score - a.score)
}

// =============================================================================
// MAIN RESCHEDULE FUNCTION
// =============================================================================

export function calculateWeekAdjustment(
  program: AdaptiveProgram,
  weekState: WeekState
): WeekAdjustment {
  const { missedDays, remainingDays, totalPlannedDays } = weekState
  
  // No adjustment needed if no missed days
  if (missedDays.length === 0) {
    return {
      type: 'keep_week_as_planned',
      label: 'Keep Week As Planned',
      explanation: 'No schedule conflicts detected. Continue with planned sessions.',
      originalSchedule: program.sessions,
      adjustedSchedule: program.sessions,
      priorityPreserved: program.sessions.map(s => s.focusLabel),
      droppedSessions: [],
      mergedSessions: [],
      wasAdjusted: false,
    }
  }
  
  // Calculate priorities
  const priorities = calculateSessionPriorities(program.sessions)
  
  // Get missed sessions
  const missedSessions = missedDays.map(day => program.sessions[day - 1]).filter(Boolean)
  const remainingSessions = program.sessions.filter((_, idx) => !missedDays.includes(idx + 1))
  
  // Determine strategy based on situation
  let adjustmentType: WeekAdjustmentType
  let adjustedSchedule: AdaptiveSession[]
  let droppedSessions: string[] = []
  let mergedSessions: { from: string; into: string; exercises: string[] }[] = []
  let explanation: string
  
  if (missedDays.length === 1 && remainingDays >= 1) {
    // Single missed day with time remaining - can do it now or merge
    const missedSession = missedSessions[0]
    const missedPriority = priorities.find(p => p.session.dayNumber === missedSession.dayNumber)
    
    if (missedPriority?.isPrimary || missedPriority?.goalRelevance === 'high') {
      // High priority - do it now
      adjustmentType = 'do_missed_now'
      adjustedSchedule = [missedSession, ...remainingSessions]
      explanation = `Priority session was missed. Recommended to complete today before continuing the week.`
    } else {
      // Can merge into next session
      adjustmentType = 'merge_priority_work'
      const nextSession = remainingSessions[0]
      const mergedExercises = missedSession.exercises
        .filter(e => e.category === 'skill' || e.category === 'strength')
        .slice(0, 2)
      
      if (nextSession && mergedExercises.length > 0) {
        const merged: AdaptiveSession = {
          ...nextSession,
          exercises: [...mergedExercises, ...nextSession.exercises].slice(0, 7),
          adaptationNotes: [
            ...(nextSession.adaptationNotes || []),
            `Key exercises from Day ${missedSession.dayNumber} merged into this session.`
          ],
        }
        adjustedSchedule = [merged, ...remainingSessions.slice(1)]
        mergedSessions = [{
          from: missedSession.focusLabel,
          into: nextSession.focusLabel,
          exercises: mergedExercises.map(e => e.name),
        }]
        explanation = `Priority exercises from missed session merged into next workout to preserve training stimulus.`
      } else {
        adjustedSchedule = remainingSessions
        droppedSessions = [missedSession.focusLabel]
        explanation = `Lower-priority session dropped to prevent fatigue accumulation.`
        adjustmentType = 'drop_lowest_priority'
      }
    }
  } else if (missedDays.length >= 2 || remainingDays < missedDays.length) {
    // Multiple missed days or not enough time - compress week
    adjustmentType = 'compress_week'
    
    // Keep only high-priority sessions
    const highPrioritySessions = priorities
      .filter(p => p.goalRelevance === 'high' || p.isPrimary)
      .slice(0, remainingDays)
      .map(p => p.session)
    
    adjustedSchedule = highPrioritySessions
    
    const keptIds = new Set(highPrioritySessions.map(s => s.dayNumber))
    droppedSessions = program.sessions
      .filter(s => !keptIds.has(s.dayNumber))
      .map(s => s.focusLabel)
    
    explanation = `Week compressed to preserve ${highPrioritySessions.length} highest-priority sessions while avoiding excessive training density.`
  } else {
    // Shift schedule forward
    adjustmentType = 'shift_schedule'
    
    // Reorder: remaining planned sessions first, then missed sessions if time
    adjustedSchedule = [...remainingSessions]
    
    if (remainingDays > remainingSessions.length) {
      const extraSlots = remainingDays - remainingSessions.length
      const missedToAdd = missedSessions
        .sort((a, b) => {
          const pa = priorities.find(p => p.session.dayNumber === a.dayNumber)?.score || 0
          const pb = priorities.find(p => p.session.dayNumber === b.dayNumber)?.score || 0
          return pb - pa
        })
        .slice(0, extraSlots)
      
      adjustedSchedule = [...adjustedSchedule, ...missedToAdd]
    } else {
      droppedSessions = missedSessions.map(s => s.focusLabel)
    }
    
    explanation = `Schedule shifted to accommodate missed days. ${droppedSessions.length > 0 ? `Lower-priority sessions dropped: ${droppedSessions.join(', ')}.` : 'All priority work preserved.'}`
  }
  
  return {
    type: adjustmentType,
    label: getWeekAdjustmentLabel(adjustmentType),
    explanation,
    originalSchedule: program.sessions,
    adjustedSchedule,
    priorityPreserved: adjustedSchedule.map(s => s.focusLabel),
    droppedSessions,
    mergedSessions,
    wasAdjusted: true,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function getWeekAdjustmentLabel(type: WeekAdjustmentType): string {
  const labels: Record<WeekAdjustmentType, string> = {
    keep_week_as_planned: 'Keep Week As Planned',
    do_missed_now: 'Do Missed Session Today',
    merge_priority_work: 'Merge Key Exercises',
    compress_week: 'Compress Week',
    drop_lowest_priority: 'Drop Lower Priority',
    shift_schedule: 'Shift Schedule',
  }
  return labels[type]
}

// =============================================================================
// QUICK WEEK STATUS
// =============================================================================

export interface QuickWeekStatus {
  isOnTrack: boolean
  missedCount: number
  completedCount: number
  remainingCount: number
  recommendation: string
  urgency: 'none' | 'low' | 'medium' | 'high'
}

export function getQuickWeekStatus(
  program: AdaptiveProgram,
  completedSessionIds: string[]
): QuickWeekStatus {
  const weekState = calculateWeekState(program, completedSessionIds)
  
  const isOnTrack = weekState.missedDays.length === 0
  const missedCount = weekState.missedDays.length
  const completedCount = weekState.completedDays.length
  const remainingCount = weekState.totalPlannedDays - completedCount - missedCount
  
  let recommendation: string
  let urgency: 'none' | 'low' | 'medium' | 'high' = 'none'
  
  if (isOnTrack) {
    recommendation = 'On track. Continue with planned sessions.'
  } else if (missedCount === 1) {
    recommendation = 'One session missed. Consider completing it today or merging key work.'
    urgency = 'low'
  } else if (missedCount === 2) {
    recommendation = 'Multiple sessions missed. Week will be compressed to preserve priorities.'
    urgency = 'medium'
  } else {
    recommendation = 'Significant schedule disruption. Focus only on highest-priority work this week.'
    urgency = 'high'
  }
  
  return {
    isOnTrack,
    missedCount,
    completedCount,
    remainingCount,
    recommendation,
    urgency,
  }
}
