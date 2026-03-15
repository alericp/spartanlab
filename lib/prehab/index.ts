/**
 * Prehab Module Index
 * 
 * Unified intelligent preparation system for SpartanLab
 * 
 * Consolidates and extends:
 * - warmup-engine.ts (reused)
 * - cooldown-engine.ts (referenced for placement)
 * - weak-point-priority-engine.ts (integrated)
 * - comprehensive-skill-progressions.ts (skill requirements)
 * 
 * Architecture:
 * - prehab-preparation-engine.ts: Core joint stress mapping and exercise selection
 * - prehab-intelligence-engine.ts: Weak point integration and adaptive logic
 */

// =============================================================================
// CORE PREHAB ENGINE
// =============================================================================

export {
  // Types
  type JointArea,
  type StressType,
  type LoadingIntensity,
  type JointStress,
  type PrehabExercise,
  type PrehabBlock,
  type PrehabGenerationContext,
  type GeneratedPrehabWarmup,
  
  // Joint Stress Mappings
  SKILL_JOINT_MAPPINGS,
  EXERCISE_JOINT_MAPPINGS,
  
  // Exercise Library
  PREHAB_EXERCISE_LIBRARY,
  
  // Core Functions
  analyzeJointStress,
  calculatePrehabDuration,
  selectPrehabExercises,
  generateSafetyNotes,
  generatePrehabWarmup,
  prehabToExerciseBlock,
  generateSkillFocusedPrehab,
} from './prehab-preparation-engine'

// =============================================================================
// INTELLIGENCE ENGINE
// =============================================================================

export {
  // Types
  type PrehabPlacement,
  type PrehabPlacementRule,
  type WeakPointPrehabAdjustment,
  type IntelligentPrehabResult,
  type IntelligentPrehabContext,
  type SkillGuidePrehabSection,
  
  // Configuration
  WEAK_POINT_PREHAB_ADJUSTMENTS,
  PREHAB_PLACEMENT_RULES,
  SKILL_PREHAB_RECOMMENDATIONS,
  
  // Intelligent Generation
  generateIntelligentPrehab,
  getSkillPrehabRecommendations,
  validatePrehabSpecificity,
  
  // Guide Integration
  generateGuidePrehabSection,
} from './prehab-intelligence-engine'

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { generatePrehabWarmup, type PrehabGenerationContext } from './prehab-preparation-engine'
import { generateIntelligentPrehab, type IntelligentPrehabContext } from './prehab-intelligence-engine'
import type { SkillGoal } from '../athlete-profile'

/**
 * Quick prehab generation for common scenarios
 */
export function quickPrehab(skills: SkillGoal[], sessionMinutes: number = 60): ReturnType<typeof generatePrehabWarmup> {
  return generatePrehabWarmup({
    plannedExercises: [],
    sessionDuration: sessionMinutes,
    skillGoals: skills,
    hasRings: true,
    hasWeights: false,
    hasBands: true,
  })
}

/**
 * Full intelligent prehab with weak point adaptation
 */
export function adaptivePrehab(context: IntelligentPrehabContext): ReturnType<typeof generateIntelligentPrehab> {
  return generateIntelligentPrehab(context)
}

/**
 * Check if the prehab system would produce a session-specific warm-up
 * vs a generic template
 */
export function isPrehabSessionSpecific(
  context: PrehabGenerationContext
): boolean {
  // Session-specific if:
  // 1. Has specific skill goals
  // 2. Has planned exercises analyzed
  // 3. Uses equipment detection
  // 4. Considers user injury history
  
  const hasSkillGoals = context.skillGoals.length > 0
  const hasPlannedExercises = context.plannedExercises.length > 0
  const hasInjuryConsideration = context.userHasShoulderIssues !== undefined ||
    context.userHasElbowIssues !== undefined ||
    context.userHasWristIssues !== undefined
  
  return hasSkillGoals || hasPlannedExercises || hasInjuryConsideration
}
