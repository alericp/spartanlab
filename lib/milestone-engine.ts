// Milestone Engine
// Detects and tracks meaningful athletic milestones from logged data

import { getSkillSessions } from './skill-session-service'
import { getStrengthRecords, type ExerciseType } from './strength-service'
import { getWorkoutLogs } from './workout-log-service'
import { getSkillProgressions, getAthleteProfile } from './data-service'
import { SKILL_DEFINITIONS } from './skills'

// =============================================================================
// TYPES
// =============================================================================

export type MilestoneCategory = 'skill' | 'strength' | 'training' | 'consistency'

export interface Milestone {
  id: string
  category: MilestoneCategory
  title: string
  description: string
  dateAchieved: string
  value?: number
  unit?: string
  significance: 'notable' | 'significant' | 'major'
}

export interface MilestoneSnapshot {
  milestones: Milestone[]
  recentMilestones: Milestone[]
  totalMilestones: number
  lastUpdated: string
}

// =============================================================================
// SKILL MILESTONES
// =============================================================================

function detectSkillMilestones(): Milestone[] {
  const progressions = getSkillProgressions()
  const sessions = getSkillSessions()
  const milestones: Milestone[] = []
  
  // Milestone for reaching each skill level
  progressions.forEach(progression => {
    const skillDef = SKILL_DEFINITIONS[progression.skillName as keyof typeof SKILL_DEFINITIONS]
    if (!skillDef) return
    
    const levelName = skillDef.levels[progression.currentLevel] || 'Unknown'
    const isAdvanced = progression.currentLevel >= 2
    
    milestones.push({
      id: `skill-level-${progression.skillName}-${progression.currentLevel}`,
      category: 'skill',
      title: `${skillDef.name}: ${levelName}`,
      description: `Achieved ${levelName} level in ${skillDef.name}`,
      dateAchieved: progression.lastUpdated,
      significance: isAdvanced ? 'major' : 'notable',
    })
  })
  
  // Milestones for hold time achievements
  const skillKeys = ['planche', 'front_lever', 'muscle_up', 'handstand_pushup'] as const
  
  skillKeys.forEach(skillKey => {
    const skillSessions = sessions.filter(s => s.skillName === skillKey)
    const skillDef = SKILL_DEFINITIONS[skillKey]
    
    if (skillSessions.length === 0) return
    
    // Find best hold
    let bestHold = 0
    let bestHoldDate = ''
    
    skillSessions.forEach(session => {
      session.sets.forEach(set => {
        if (set.holdSeconds > bestHold) {
          bestHold = set.holdSeconds
          bestHoldDate = session.sessionDate
        }
      })
    })
    
    // Add milestone for notable hold times
    if (bestHold >= 5) {
      milestones.push({
        id: `hold-time-${skillKey}-5s`,
        category: 'skill',
        title: `${skillDef?.name || skillKey}: 5+ Second Hold`,
        description: `First clean 5+ second hold achieved`,
        dateAchieved: bestHoldDate,
        value: bestHold,
        unit: 'seconds',
        significance: 'notable',
      })
    }
    
    if (bestHold >= 10) {
      milestones.push({
        id: `hold-time-${skillKey}-10s`,
        category: 'skill',
        title: `${skillDef?.name || skillKey}: 10+ Second Hold`,
        description: `Achieved 10+ second hold - solid control`,
        dateAchieved: bestHoldDate,
        value: bestHold,
        unit: 'seconds',
        significance: 'significant',
      })
    }
    
    if (bestHold >= 15) {
      milestones.push({
        id: `hold-time-${skillKey}-15s`,
        category: 'skill',
        title: `${skillDef?.name || skillKey}: 15+ Second Hold`,
        description: `Elite-level hold time achieved`,
        dateAchieved: bestHoldDate,
        value: bestHold,
        unit: 'seconds',
        significance: 'major',
      })
    }
  })
  
  return milestones
}

// =============================================================================
// STRENGTH MILESTONES
// =============================================================================

function detectStrengthMilestones(): Milestone[] {
  const records = getStrengthRecords()
  const profile = getAthleteProfile()
  const bodyweight = profile.bodyweight || 160
  const milestones: Milestone[] = []
  
  const exerciseLabels: Record<ExerciseType, string> = {
    weighted_pull_up: 'Weighted Pull-Up',
    weighted_dip: 'Weighted Dip',
    weighted_muscle_up: 'Weighted Muscle-Up',
  }
  
  // Weight thresholds for milestones
  const thresholds: Record<ExerciseType, number[]> = {
    weighted_pull_up: [25, 45, 70, 90],
    weighted_dip: [45, 70, 90, 135],
    weighted_muscle_up: [10, 25, 45],
  }
  
  // Track best records per exercise
  const bestByExercise: Record<ExerciseType, { weight: number; date: string } | null> = {
    weighted_pull_up: null,
    weighted_dip: null,
    weighted_muscle_up: null,
  }
  
  records.forEach(record => {
    const current = bestByExercise[record.exercise]
    if (!current || record.weightAdded > current.weight) {
      bestByExercise[record.exercise] = {
        weight: record.weightAdded,
        date: record.dateLogged,
      }
    }
  })
  
  // Generate milestones for crossed thresholds
  Object.entries(bestByExercise).forEach(([exercise, best]) => {
    if (!best) return
    
    const exerciseType = exercise as ExerciseType
    const exerciseThresholds = thresholds[exerciseType]
    const label = exerciseLabels[exerciseType]
    
    exerciseThresholds.forEach(threshold => {
      if (best.weight >= threshold) {
        const significance: Milestone['significance'] = 
          threshold >= 90 ? 'major' :
          threshold >= 45 ? 'significant' : 'notable'
        
        milestones.push({
          id: `strength-${exercise}-${threshold}`,
          category: 'strength',
          title: `${label}: +${threshold}lbs`,
          description: `Lifted +${threshold}lbs added weight`,
          dateAchieved: best.date,
          value: threshold,
          unit: 'lbs',
          significance,
        })
      }
    })
    
    // Bodyweight ratio milestones
    const ratio = best.weight / bodyweight
    if (ratio >= 0.25) {
      milestones.push({
        id: `ratio-${exercise}-25`,
        category: 'strength',
        title: `${label}: 25% BW`,
        description: `Added 25% of bodyweight`,
        dateAchieved: best.date,
        significance: 'notable',
      })
    }
    if (ratio >= 0.5) {
      milestones.push({
        id: `ratio-${exercise}-50`,
        category: 'strength',
        title: `${label}: 50% BW`,
        description: `Added 50% of bodyweight - strong`,
        dateAchieved: best.date,
        significance: 'significant',
      })
    }
    if (ratio >= 0.75) {
      milestones.push({
        id: `ratio-${exercise}-75`,
        category: 'strength',
        title: `${label}: 75% BW`,
        description: `Added 75% of bodyweight - elite level`,
        dateAchieved: best.date,
        significance: 'major',
      })
    }
  })
  
  return milestones
}

// =============================================================================
// TRAINING MILESTONES
// =============================================================================

function detectTrainingMilestones(): Milestone[] {
  const logs = getWorkoutLogs()
  const milestones: Milestone[] = []
  
  if (logs.length === 0) return milestones
  
  // First workout milestone
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
  )
  
  milestones.push({
    id: 'first-workout',
    category: 'training',
    title: 'First Workout Logged',
    description: 'Started tracking with SpartanLab',
    dateAchieved: sortedLogs[0].sessionDate,
    significance: 'notable',
  })
  
  // Workout count milestones
  const workoutCounts = [10, 25, 50, 100]
  workoutCounts.forEach(count => {
    if (logs.length >= count) {
      const significance: Milestone['significance'] =
        count >= 100 ? 'major' :
        count >= 50 ? 'significant' : 'notable'
      
      milestones.push({
        id: `workout-count-${count}`,
        category: 'training',
        title: `${count} Workouts Completed`,
        description: `Logged ${count} training sessions`,
        dateAchieved: sortedLogs[count - 1].sessionDate,
        value: count,
        unit: 'workouts',
        significance,
      })
    }
  })
  
  // Weekly consistency milestones
  const weeksWithWorkouts = getWeeksWithWorkouts(logs)
  const weekCounts = [4, 8, 12, 24]
  
  weekCounts.forEach(count => {
    if (weeksWithWorkouts >= count) {
      const significance: Milestone['significance'] =
        count >= 24 ? 'major' :
        count >= 12 ? 'significant' : 'notable'
      
      milestones.push({
        id: `weeks-trained-${count}`,
        category: 'consistency',
        title: `${count} Weeks of Training`,
        description: `Trained for at least ${count} different weeks`,
        dateAchieved: new Date().toISOString().split('T')[0],
        value: count,
        unit: 'weeks',
        significance,
      })
    }
  })
  
  return milestones
}

function getWeeksWithWorkouts(logs: ReturnType<typeof getWorkoutLogs>): number {
  const weeksSet = new Set<string>()
  
  logs.forEach(log => {
    const date = new Date(log.sessionDate)
    const weekStart = getWeekStart(date)
    weeksSet.add(weekStart.toISOString().split('T')[0])
  })
  
  return weeksSet.size
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function getMilestones(): MilestoneSnapshot {
  const skillMilestones = detectSkillMilestones()
  const strengthMilestones = detectStrengthMilestones()
  const trainingMilestones = detectTrainingMilestones()
  
  // Combine and deduplicate
  const allMilestones = [...skillMilestones, ...strengthMilestones, ...trainingMilestones]
  const uniqueMilestones = Array.from(
    new Map(allMilestones.map(m => [m.id, m])).values()
  )
  
  // Sort by date (most recent first)
  const sorted = uniqueMilestones.sort(
    (a, b) => new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime()
  )
  
  // Get milestones from the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentMilestones = sorted.filter(
    m => new Date(m.dateAchieved) >= thirtyDaysAgo
  )
  
  return {
    milestones: sorted,
    recentMilestones,
    totalMilestones: sorted.length,
    lastUpdated: new Date().toISOString(),
  }
}
