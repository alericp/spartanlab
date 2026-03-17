/**
 * Skill Readiness Engine
 * 
 * Core engine for calculating skill readiness.
 * Re-exports the calculator functions with additional engine-level utilities.
 * 
 * This file provides backwards compatibility and a clean import path
 * for the unified readiness calculation system.
 */

import {
  calculateSkillReadiness,
  calculateAllSkillReadiness,
  analyzeSkillProfile,
  getSkillPrerequisites,
  getSupportedSkills,
  interpretReadinessScore,
  getRecommendedFocus,
  type SkillReadinessInput,
  type SkillReadinessResult,
} from './skillReadinessService'

import type { SkillType } from '../readiness/canonical-readiness-engine'

// =============================================================================
// ENGINE API
// =============================================================================

/**
 * Main engine interface for skill readiness calculation
 */
export const SkillReadinessEngine = {
  /**
   * Calculate readiness for a single skill
   */
  calculate: calculateSkillReadiness,
  
  /**
   * Calculate readiness for all supported skills
   */
  calculateAll: calculateAllSkillReadiness,
  
  /**
   * Analyze skill profile across all skills
   */
  analyzeProfile: analyzeSkillProfile,
  
  /**
   * Get prerequisites for a skill
   */
  getPrerequisites: getSkillPrerequisites,
  
  /**
   * Get list of supported skills
   */
  getSupportedSkills,
  
  /**
   * Interpret a score into classification
   */
  interpretScore: interpretReadinessScore,
  
  /**
   * Get recommended focus areas
   */
  getRecommendedFocus,
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick readiness check - returns just the score and classification
 */
export function quickReadinessCheck(
  skill: SkillType,
  input: SkillReadinessInput
): { score: number; classification: string; ready: boolean } {
  const result = calculateSkillReadiness(skill, input)
  return {
    score: result.readinessScore,
    classification: result.classification,
    ready: result.classification === 'Ready' || result.classification === 'Advanced',
  }
}

/**
 * Get the primary limiting factor for a skill
 */
export function getPrimaryLimiter(
  skill: SkillType,
  input: SkillReadinessInput
): { factor: string; explanation: string; recommendation: string } | null {
  const result = calculateSkillReadiness(skill, input)
  
  if (result.limitingFactors.length === 0) {
    return null
  }
  
  const primary = result.limitingFactors[0]
  return {
    factor: primary.factor,
    explanation: primary.explanation,
    recommendation: primary.recommendation,
  }
}

/**
 * Check if athlete meets baseline requirements for a skill
 */
export function meetsBaselineRequirements(
  skill: SkillType,
  input: SkillReadinessInput
): { meets: boolean; missingRequirements: string[] } {
  const prereqs = getSkillPrerequisites(skill)
  const missing: string[] = []
  
  for (const metric of prereqs.requiredMetrics) {
    if (metric.importance === 'critical') {
      // Check if the critical metric has any data
      switch (metric.name.toLowerCase()) {
        case 'pull-ups':
          if (!input.pullups || input.pullups < (metric.baselineTarget as number) * 0.5) {
            missing.push(`${metric.name}: need at least ${Math.round((metric.baselineTarget as number) * 0.5)} ${metric.unit}`)
          }
          break
        case 'dips':
          if (!input.dips || input.dips < (metric.baselineTarget as number) * 0.5) {
            missing.push(`${metric.name}: need at least ${Math.round((metric.baselineTarget as number) * 0.5)} ${metric.unit}`)
          }
          break
        case 'hollow hold':
          if (!input.hollowHoldSeconds || input.hollowHoldSeconds < (metric.baselineTarget as number) * 0.5) {
            missing.push(`${metric.name}: need at least ${Math.round((metric.baselineTarget as number) * 0.5)} ${metric.unit}`)
          }
          break
        case 'l-sit hold':
          if (!input.lSitHoldSeconds || input.lSitHoldSeconds < (metric.baselineTarget as number) * 0.5) {
            missing.push(`${metric.name}: need at least ${Math.round((metric.baselineTarget as number) * 0.5)} ${metric.unit}`)
          }
          break
      }
    }
  }
  
  return {
    meets: missing.length === 0,
    missingRequirements: missing,
  }
}

/**
 * Get training recommendations based on readiness
 */
export function getTrainingRecommendations(
  skill: SkillType,
  input: SkillReadinessInput
): {
  priority: 'high' | 'medium' | 'low'
  focus: string[]
  exercises: string[]
  weeklyFrequency: string
} {
  const result = calculateSkillReadiness(skill, input)
  
  // Determine priority based on classification
  let priority: 'high' | 'medium' | 'low'
  let weeklyFrequency: string
  
  if (result.classification === 'Beginner' || result.classification === 'Developing') {
    priority = 'high'
    weeklyFrequency = '2-3 sessions per week on foundation work'
  } else if (result.classification === 'Nearly Ready') {
    priority = 'medium'
    weeklyFrequency = '3-4 sessions per week including skill work'
  } else {
    priority = 'low'
    weeklyFrequency = '2-3 dedicated skill sessions per week'
  }
  
  // Get exercises based on limiting factors
  const exercises: string[] = []
  for (const limiter of result.limitingFactors) {
    switch (limiter.factor) {
      case 'Pulling Strength':
        exercises.push('Weighted pull-ups', 'Pull-up negatives', 'Rows')
        break
      case 'Pushing Strength':
        exercises.push('Weighted dips', 'Push-up variations', 'Pike push-ups')
        break
      case 'Compression Strength':
        exercises.push('Hollow body holds', 'Pike compressions', 'L-sit progressions')
        break
      case 'Straight-Arm Pull Strength':
        exercises.push('Front lever rows', 'Straight-arm pulldowns', 'Active hangs')
        break
      case 'Straight-Arm Push Strength':
        exercises.push('Planche leans', 'Pseudo planche push-ups', 'Ring support')
        break
      default:
        exercises.push('Progressive skill work', 'General strength training')
    }
  }
  
  return {
    priority,
    focus: result.recommendedNextFocus,
    exercises: [...new Set(exercises)].slice(0, 5), // Unique exercises, max 5
    weeklyFrequency,
  }
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export {
  calculateSkillReadiness,
  calculateAllSkillReadiness,
  analyzeSkillProfile,
  getSkillPrerequisites,
  getSupportedSkills,
  interpretReadinessScore,
  getRecommendedFocus,
  type SkillReadinessInput,
  type SkillReadinessResult,
}

export type { SkillType }
