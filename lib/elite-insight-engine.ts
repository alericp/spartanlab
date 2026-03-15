// Premium Insight Engine (formerly Elite Insight Engine)
// Synthesizes high-value insights for the Pro tier performance dashboard
// NOTE: These premium features are included in Pro tier ($14.99/month)

import { getSkillHistorySnapshots, getStrengthHistorySnapshots, getTrainingHistorySnapshot } from './history-snapshot-engine'
import { getMilestones } from './milestone-engine'
import { getPRVault } from './pr-vault-engine'
import { getConstraintInsight } from './constraint-engine'
import { getQuickEngineStatus } from './adaptive-athlete-engine'
import type { TrendDirection } from './strength-trend-engine'

// =============================================================================
// TYPES
// =============================================================================

export type InsightType = 
  | 'biggest_improvement'
  | 'plateau_watch'
  | 'weakest_area'
  | 'best_momentum'
  | 'consistency_insight'
  | 'milestone_insight'

export interface EliteInsight {
  type: InsightType
  title: string
  value: string
  explanation: string
  significance: 'positive' | 'neutral' | 'attention'
}

export interface EliteInsightsSnapshot {
  insights: EliteInsight[]
  primaryInsight: EliteInsight | null
  hasData: boolean
  lastUpdated: string
}

// =============================================================================
// INSIGHT DETECTION
// =============================================================================

function detectBiggestImprovement(): EliteInsight | null {
  const skillSnapshots = getSkillHistorySnapshots()
  const strengthSnapshots = getStrengthHistorySnapshots()
  
  let bestImprovement: { area: string; improvement: number; type: 'skill' | 'strength' } | null = null
  
  // Check skill improvements (hold time increase)
  skillSnapshots.forEach(skill => {
    if (!skill.hasData || skill.previousBestHold === 0) return
    
    const improvement = skill.bestHoldSeconds - skill.previousBestHold
    if (improvement > 0) {
      const percentImprovement = (improvement / skill.previousBestHold) * 100
      if (!bestImprovement || percentImprovement > bestImprovement.improvement) {
        bestImprovement = {
          area: skill.skillLabel,
          improvement: percentImprovement,
          type: 'skill',
        }
      }
    }
  })
  
  // Check strength improvements (1RM increase)
  strengthSnapshots.forEach(strength => {
    if (!strength.hasData || strength.previousOneRM === 0) return
    
    const improvement = strength.estimatedOneRM - strength.previousOneRM
    if (improvement > 0) {
      const percentImprovement = (improvement / strength.previousOneRM) * 100
      if (!bestImprovement || percentImprovement > bestImprovement.improvement) {
        bestImprovement = {
          area: strength.exerciseLabel,
          improvement: percentImprovement,
          type: 'strength',
        }
      }
    }
  })
  
  if (!bestImprovement) return null
  
  return {
    type: 'biggest_improvement',
    title: 'Biggest Improvement',
    value: bestImprovement.area,
    explanation: `${bestImprovement.area} improved ${Math.round(bestImprovement.improvement)}% compared to your previous best - this is your strongest recent progress.`,
    significance: 'positive',
  }
}

function detectPlateauWatch(): EliteInsight | null {
  const skillSnapshots = getSkillHistorySnapshots()
  const strengthSnapshots = getStrengthHistorySnapshots()
  
  const plateauedAreas: string[] = []
  
  // Check for skill plateaus
  skillSnapshots.forEach(skill => {
    if (!skill.hasData) return
    if (skill.holdTrend === 'stable' && skill.totalSessions >= 4) {
      plateauedAreas.push(skill.skillLabel)
    }
  })
  
  // Check for strength plateaus
  strengthSnapshots.forEach(strength => {
    if (!strength.hasData) return
    if (strength.trend === 'stable' && strength.totalRecords >= 4) {
      plateauedAreas.push(strength.exerciseLabel)
    }
  })
  
  if (plateauedAreas.length === 0) return null
  
  const primaryPlateau = plateauedAreas[0]
  const additionalCount = plateauedAreas.length - 1
  
  return {
    type: 'plateau_watch',
    title: 'Plateau Watch',
    value: primaryPlateau,
    explanation: additionalCount > 0
      ? `${primaryPlateau} and ${additionalCount} other area${additionalCount > 1 ? 's have' : ' has'} shown stable performance - consider adjusting training stimulus.`
      : `${primaryPlateau} has been stable recently - this may indicate a need for training variation or deload.`,
    significance: 'attention',
  }
}

function detectWeakestArea(): EliteInsight | null {
  const constraintInsight = getConstraintInsight()
  
  if (!constraintInsight || !constraintInsight.hasInsight || constraintInsight.confidence === 'low') {
    return null
  }
  
  if (constraintInsight.label === 'Training Balanced') {
    return null // Not a constraint
  }
  
  return {
    type: 'weakest_area',
    title: 'Current Limiter',
    value: constraintInsight.label,
    explanation: constraintInsight.explanation,
    significance: 'attention',
  }
}

function detectBestMomentum(): EliteInsight | null {
  const skillSnapshots = getSkillHistorySnapshots()
  const strengthSnapshots = getStrengthHistorySnapshots()
  
  const improvingAreas: string[] = []
  
  skillSnapshots.forEach(skill => {
    if (skill.hasData && skill.holdTrend === 'improving') {
      improvingAreas.push(skill.skillLabel)
    }
  })
  
  strengthSnapshots.forEach(strength => {
    if (strength.hasData && strength.trend === 'improving') {
      improvingAreas.push(strength.exerciseLabel)
    }
  })
  
  if (improvingAreas.length === 0) return null
  
  const bestArea = improvingAreas[0]
  
  return {
    type: 'best_momentum',
    title: 'Best Momentum',
    value: bestArea,
    explanation: improvingAreas.length > 1
      ? `${bestArea} and ${improvingAreas.length - 1} other area${improvingAreas.length > 2 ? 's are' : ' is'} trending upward - your training is producing results.`
      : `${bestArea} is showing strong upward momentum - keep the current approach.`,
    significance: 'positive',
  }
}

function detectConsistencyInsight(): EliteInsight | null {
  const trainingSnapshot = getTrainingHistorySnapshot()
  
  if (!trainingSnapshot.hasData) return null
  
  const score = trainingSnapshot.consistencyScore
  
  if (score >= 80) {
    return {
      type: 'consistency_insight',
      title: 'Consistency',
      value: 'Excellent',
      explanation: `You've trained ${Math.round(score / 12.5)} out of the last 8 weeks - this consistency is a major factor in long-term progress.`,
      significance: 'positive',
    }
  } else if (score >= 50) {
    return {
      type: 'consistency_insight',
      title: 'Consistency',
      value: 'Moderate',
      explanation: `You've trained ${Math.round(score / 12.5)} out of the last 8 weeks - more consistent training would accelerate your progress.`,
      significance: 'neutral',
    }
  } else if (score > 0) {
    return {
      type: 'consistency_insight',
      title: 'Consistency',
      value: 'Needs Attention',
      explanation: `Training has been inconsistent recently - focusing on regular sessions would help unlock your potential.`,
      significance: 'attention',
    }
  }
  
  return null
}

function detectMilestoneInsight(): EliteInsight | null {
  const milestones = getMilestones()
  
  if (milestones.recentMilestones.length === 0) return null
  
  const recentMajor = milestones.recentMilestones.find(m => m.significance === 'major')
  const recentSignificant = milestones.recentMilestones.find(m => m.significance === 'significant')
  
  const featured = recentMajor || recentSignificant || milestones.recentMilestones[0]
  
  return {
    type: 'milestone_insight',
    title: 'Recent Achievement',
    value: featured.title,
    explanation: featured.description,
    significance: 'positive',
  }
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function getEliteInsights(): EliteInsightsSnapshot {
  const insights: EliteInsight[] = []
  
  // Try to detect each insight type
  const biggestImprovement = detectBiggestImprovement()
  if (biggestImprovement) insights.push(biggestImprovement)
  
  const bestMomentum = detectBestMomentum()
  if (bestMomentum) insights.push(bestMomentum)
  
  const plateauWatch = detectPlateauWatch()
  if (plateauWatch) insights.push(plateauWatch)
  
  const weakestArea = detectWeakestArea()
  if (weakestArea) insights.push(weakestArea)
  
  const consistencyInsight = detectConsistencyInsight()
  if (consistencyInsight) insights.push(consistencyInsight)
  
  const milestoneInsight = detectMilestoneInsight()
  if (milestoneInsight) insights.push(milestoneInsight)
  
  // Add training momentum insight from Adaptive Athlete Engine
  const engineStatus = getQuickEngineStatus()
  if (engineStatus.hasData) {
    const momentumInsight: EliteInsight = {
      type: 'best_momentum' as InsightType,
      title: 'Training Momentum',
      value: engineStatus.momentumLabel,
      explanation: engineStatus.momentum === 'improving'
        ? 'Performance trends are positive across your key metrics. Keep the current approach.'
        : engineStatus.momentum === 'regressing'
        ? 'Recent performance has declined. Prioritize recovery and review training load.'
        : engineStatus.momentum === 'plateauing'
        ? 'Progress has stalled. Consider varying intensity or exercise selection.'
        : 'Performance is holding steady. Consistent training is maintaining your level.',
      significance: engineStatus.momentum === 'improving' ? 'positive' :
                    engineStatus.momentum === 'regressing' ? 'attention' : 'neutral',
    }
    // Replace existing momentum insight if present, otherwise add
    const existingMomentumIdx = insights.findIndex(i => i.title === 'Best Momentum')
    if (existingMomentumIdx >= 0) {
      insights[existingMomentumIdx] = momentumInsight
    } else {
      insights.unshift(momentumInsight) // Add at start for visibility
    }
  }
  
  // Select primary insight (prioritize positive, then attention)
  const positiveInsights = insights.filter(i => i.significance === 'positive')
  const attentionInsights = insights.filter(i => i.significance === 'attention')
  
  const primaryInsight = positiveInsights[0] || attentionInsights[0] || insights[0] || null
  
  return {
    insights,
    primaryInsight,
    hasData: insights.length > 0,
    lastUpdated: new Date().toISOString(),
  }
}

// Get a quick summary for dashboard widgets
export function getQuickInsightSummary(): {
  topInsight: string | null
  topInsightType: 'positive' | 'neutral' | 'attention' | null
  totalInsights: number
} {
  const { insights, primaryInsight } = getEliteInsights()
  
  return {
    topInsight: primaryInsight?.value || null,
    topInsightType: primaryInsight?.significance || null,
    totalInsights: insights.length,
  }
}
