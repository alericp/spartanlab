// Share Card Data Service
// Generates shareable progress card data from real user data

import { getStrengthProgressData, getSkillProgressData, getConsistencyProgressData, getSpartanScoreProgressData } from './progress-data-service'
import { calculateSpartanScore, getLevelColor } from './strength-score-engine'
import { getWorkoutLogs } from './workout-log-service'
import type { 
  StrengthProgressCardData, 
  SkillProgressCardData, 
  SpartanScoreCardData, 
  ConsistencyCardData,
  ShareCardData
} from '@/components/share/ShareableProgressCards'

// =============================================================================
// STRENGTH PROGRESS CARDS
// =============================================================================

export function getStrengthShareCards(): StrengthProgressCardData[] {
  const strengthData = getStrengthProgressData()
  
  return strengthData
    .filter(data => data.hasData && data.currentValue > 0)
    .map(data => ({
      type: 'strength' as const,
      exerciseName: data.exerciseLabel,
      beforeValue: data.startValue,
      afterValue: data.currentValue,
      unit: 'lbs',
      timeframe: data.dataPoints.length > 1 
        ? `${data.dataPoints.length} sessions logged` 
        : undefined,
    }))
}

export function getBestStrengthShareCard(): StrengthProgressCardData | null {
  const cards = getStrengthShareCards()
  if (cards.length === 0) return null
  
  // Return the one with the biggest improvement
  return cards.reduce((best, current) => {
    const currentImprovement = current.afterValue - current.beforeValue
    const bestImprovement = best.afterValue - best.beforeValue
    return currentImprovement > bestImprovement ? current : best
  })
}

// =============================================================================
// SKILL PROGRESS CARDS
// =============================================================================

const SKILL_LEVEL_NAMES: Record<string, string[]> = {
  planche: ['Lean', 'Tuck', 'Adv. Tuck', 'Straddle', 'Full'],
  front_lever: ['Tuck', 'Adv. Tuck', 'Straddle', 'Half Lay', 'Full'],
  muscle_up: ['Assisted', 'Kipping', 'Strict', 'Weighted', 'One Arm'],
  handstand_pushup: ['Pike', 'Wall HSPU', 'Free HSPU', 'Deficit', '90° Push'],
}

export function getSkillShareCards(): SkillProgressCardData[] {
  const skillData = getSkillProgressData()
  
  return skillData
    .filter(data => data.hasData && data.currentLevel > 0)
    .map(data => {
      const levels = SKILL_LEVEL_NAMES[data.skillName] || ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'Master']
      const beforeIndex = 0
      const afterIndex = Math.min(data.currentLevel, levels.length - 1)
      
      return {
        type: 'skill' as const,
        skillName: data.skillLabel,
        beforeLevel: levels[beforeIndex] || 'Beginner',
        afterLevel: levels[afterIndex] || data.currentLevelName,
        beforeIndex,
        afterIndex,
      }
    })
}

export function getBestSkillShareCard(): SkillProgressCardData | null {
  const cards = getSkillShareCards()
  if (cards.length === 0) return null
  
  // Return the highest level skill
  return cards.reduce((best, current) => {
    return (current.afterIndex || 0) > (best.afterIndex || 0) ? current : best
  })
}

// =============================================================================
// SPARTAN SCORE CARD
// =============================================================================

export function getSpartanScoreShareCard(): SpartanScoreCardData | null {
  const scoreProgress = getSpartanScoreProgressData()
  
  if (!scoreProgress.hasData || scoreProgress.currentScore <= 0) {
    return null
  }
  
  // Get first recorded score as "before"
  const beforeScore = scoreProgress.dataPoints.length > 1 
    ? scoreProgress.dataPoints[0]?.value 
    : undefined

  try {
    const scoreData = calculateSpartanScore()
    return {
      type: 'spartan_score' as const,
      beforeScore,
      afterScore: scoreProgress.currentScore,
      level: scoreData.level,
      levelColor: getLevelColor(scoreData.level),
    }
  } catch {
    return {
      type: 'spartan_score' as const,
      beforeScore,
      afterScore: scoreProgress.currentScore,
      level: 'Initiate',
      levelColor: '#6B7280',
    }
  }
}

// =============================================================================
// CONSISTENCY CARD
// =============================================================================

export function getConsistencyShareCard(): ConsistencyCardData | null {
  const consistencyData = getConsistencyProgressData()
  const logs = getWorkoutLogs()
  
  if (!consistencyData.hasData || logs.length === 0) {
    return null
  }
  
  // Calculate current streak
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sortedLogs = logs
    .map(log => new Date(log.sessionDate))
    .sort((a, b) => b.getTime() - a.getTime())
  
  let streak = 0
  let checkDate = new Date(today)
  
  for (const logDate of sortedLogs) {
    const logDay = new Date(logDate)
    logDay.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((checkDate.getTime() - logDay.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) {
      streak++
      checkDate = logDay
    } else {
      break
    }
  }
  
  // Get workouts this month
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const workoutsThisMonth = logs.filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
  }).length
  
  const monthName = today.toLocaleDateString('en-US', { month: 'long' })
  
  // Return streak card if streak is meaningful, otherwise monthly count
  if (streak >= 3) {
    return {
      type: 'consistency' as const,
      streak,
      workoutsThisMonth,
      monthName,
    }
  }
  
  if (workoutsThisMonth > 0) {
    return {
      type: 'consistency' as const,
      streak: undefined,
      workoutsThisMonth,
      monthName,
    }
  }
  
  return null
}

// =============================================================================
// GET ALL AVAILABLE SHARE CARDS
// =============================================================================

export interface AvailableShareCards {
  strength: StrengthProgressCardData | null
  skill: SkillProgressCardData | null
  spartanScore: SpartanScoreCardData | null
  consistency: ConsistencyCardData | null
  allCards: ShareCardData[]
  hasAnyCards: boolean
}

export function getAvailableShareCards(): AvailableShareCards {
  const strength = getBestStrengthShareCard()
  const skill = getBestSkillShareCard()
  const spartanScore = getSpartanScoreShareCard()
  const consistency = getConsistencyShareCard()
  
  const allCards: ShareCardData[] = []
  
  if (spartanScore) allCards.push(spartanScore)
  if (strength) allCards.push(strength)
  if (skill) allCards.push(skill)
  if (consistency) allCards.push(consistency)
  
  return {
    strength,
    skill,
    spartanScore,
    consistency,
    allCards,
    hasAnyCards: allCards.length > 0,
  }
}

// =============================================================================
// CHECK IF USER HAS ENOUGH DATA FOR MEANINGFUL CARDS
// =============================================================================

export function hasEnoughDataForShareCards(): {
  ready: boolean
  missing: string[]
  suggestion: string
} {
  const logs = getWorkoutLogs()
  const strengthData = getStrengthProgressData()
  const skillData = getSkillProgressData()
  
  const missing: string[] = []
  
  if (logs.length < 3) {
    missing.push('workout logs')
  }
  
  if (!strengthData.some(d => d.hasData)) {
    missing.push('strength records')
  }
  
  if (!skillData.some(d => d.hasData)) {
    missing.push('skill sessions')
  }
  
  if (missing.length === 0) {
    return {
      ready: true,
      missing: [],
      suggestion: 'Your progress cards are ready to share!'
    }
  }
  
  if (missing.length === 3) {
    return {
      ready: false,
      missing,
      suggestion: 'Start logging workouts to unlock shareable progress cards.'
    }
  }
  
  return {
    ready: false,
    missing,
    suggestion: `Log more ${missing.join(' and ')} to unlock all progress cards.`
  }
}
