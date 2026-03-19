/**
 * Canonical Explanation Types
 * 
 * Single source of truth for program/session explanation metadata.
 * All explanations shown to users must be backed by real engine outputs.
 * 
 * DESIGN PRINCIPLES:
 * - Machine-readable reason codes first, human text second
 * - Every displayed reason must map to actual engine decision
 * - Flexible mode explanations never imply static choice
 * - Short, grounded, non-hype language only
 */

import type { ScheduleMode, DayStressLevel } from '../flexible-schedule-engine'
import type { MovementFamily, SkillCarryover } from '../movement-family-registry'

// =============================================================================
// REASON CODES - Machine-readable decision markers
// =============================================================================

/**
 * Core reason codes for program-level decisions.
 * Each code represents a real engine decision point.
 */
export type ProgramReasonCode =
  // Goal-related
  | 'primary_goal_direct'           // Session directly targets primary goal
  | 'secondary_goal_support'        // Session supports secondary outcomes
  
  // Weak point / limiter
  | 'weak_point_support'            // Support work addresses detected weak point
  | 'limiter_addressed'             // Specific limiter is being worked on
  
  // Progression
  | 'progression_hold'              // Progression held due to incomplete data
  | 'progression_advance'           // Progression advanced based on performance
  | 'progression_regress'           // Progression reduced for recovery/safety
  
  // Fatigue / Recovery
  | 'fatigue_high_reduce_volume'    // Volume reduced due to high fatigue
  | 'fatigue_stable_maintain'       // Volume maintained with stable fatigue
  | 'recovery_bias_day'             // Day biased toward recovery
  | 'high_neural_day'               // High neural/skill demand day
  | 'lower_fatigue_day'             // Lower fatigue cost day
  
  // Flexible scheduling
  | 'flexible_frequency_contract'   // Flexible mode reduced frequency
  | 'flexible_frequency_expand'     // Flexible mode increased frequency
  | 'flexible_frequency_maintain'   // Flexible mode kept current frequency
  | 'static_schedule_set'           // Static schedule as user selected
  
  // Movement intelligence
  | 'joint_stress_downrank'         // Exercise downranked due to joint stress
  | 'straight_arm_load_control'     // Straight-arm volume managed
  | 'vertical_push_support'         // Vertical pushing support added
  | 'vertical_pull_support'         // Vertical pulling support added
  | 'horizontal_push_support'       // Horizontal pushing support added
  | 'horizontal_pull_support'       // Horizontal pulling support added
  | 'straight_arm_pull_support'     // Straight-arm pull support (FL family)
  | 'straight_arm_push_support'     // Straight-arm push support (PL family)
  | 'compression_support'           // Core compression support added
  | 'anti_extension_support'        // Anti-extension core support added
  | 'scapular_control_support'      // Scapular stability work added
  
  // Session balance
  | 'schedule_balance_reason'       // Day choice for weekly balance
  | 'skill_transfer_reason'         // Exercise chosen for skill transfer
  | 'time_budget_reason'            // Session compressed for time
  | 'equipment_constraint_reason'   // Equipment limited choices
  
  // Stability / no-change
  | 'no_change_due_to_stability'    // Program stable, no changes needed
  | 'no_progress_due_to_incomplete_data'  // Not enough data for adaptation
  | 'maintained_for_consistency'    // Kept same for training consistency

// =============================================================================
// EXPLANATION METADATA STRUCTURES
// =============================================================================

/**
 * Single exercise explanation - why this specific exercise was chosen
 */
export interface ExerciseExplanation {
  exerciseId: string
  displayName: string
  reasonCodes: ProgramReasonCode[]
  shortReason: string  // Human-readable, max 2 sentences
  movementPattern?: MovementFamily
  skillTransfer?: SkillCarryover[]
  isSubstitutable: boolean
}

/**
 * Day/session explanation - why this day looks the way it does
 */
export interface DayExplanation {
  dayKey: string              // e.g., "day_1", "day_2"
  dayNumber: number
  title: string               // e.g., "Primary Skill Day"
  primaryIntent: string       // e.g., "front_lever_focus"
  stressLevel: DayStressLevel
  reasonCodes: ProgramReasonCode[]
  whyThisDay: string          // Human-readable, 1-2 sentences
  whyLighterOrHeavier?: string  // Optional: why stress level differs
  limiterSupport?: string[]   // Limiters being addressed this day
  exerciseExplanations: ExerciseExplanation[]
}

/**
 * Week structure explanation - why the week is organized this way
 */
export interface WeekStructureExplanation {
  currentWeekFrequency: number
  scheduleMode: ScheduleMode
  reasonCodes: ProgramReasonCode[]
  rationale: string           // Human-readable, 1-2 sentences
  stressDistribution: string  // How stress is spread across days
  frequencyBasis?: string     // What the frequency decision was based on
}

/**
 * Change explanation - what changed and why (or why it stayed the same)
 */
export interface ChangeExplanation {
  changed: boolean
  comparedToPrior: boolean    // Whether we had a prior program to compare
  reasonCodes: ProgramReasonCode[]
  majorReasons: string[]      // Primary reasons for change/stability
  preservedReasons?: string[] // Why certain things were kept the same
  summary: string             // 1-2 sentence summary
}

/**
 * Summary explanation - high-level program rationale
 */
export interface SummaryExplanation {
  primaryGoalReason: string
  scheduleReason: string
  progressionReason?: string
  recoveryReason?: string
  reasonCodes: ProgramReasonCode[]
}

/**
 * Complete program explanation metadata
 * This is the canonical shape saved with the program
 */
export interface ProgramExplanation {
  // Version for forward compatibility
  version: 1
  generatedAt: string
  
  // High-level summary
  summary: SummaryExplanation
  
  // Week structure explanation
  weekStructure: WeekStructureExplanation
  
  // Per-day explanations
  dayExplanations: DayExplanation[]
  
  // Change tracking (if regenerated/adjusted)
  changeExplanation?: ChangeExplanation
  
  // All active reason codes (for validation)
  activeReasonCodes: ProgramReasonCode[]
  
  // Data confidence
  dataConfidence: 'none' | 'low' | 'medium' | 'high'
}

// =============================================================================
// REASON CODE TO TEXT MAPPING
// =============================================================================

/**
 * Human-readable labels for reason codes.
 * Used by the explanation resolver.
 */
export const REASON_CODE_LABELS: Record<ProgramReasonCode, string> = {
  // Goal-related
  primary_goal_direct: 'Directly targets your primary goal',
  secondary_goal_support: 'Supports your secondary training outcomes',
  
  // Weak point / limiter
  weak_point_support: 'Addresses detected weak point',
  limiter_addressed: 'Works on current limiting factor',
  
  // Progression
  progression_hold: 'Progression maintained (building consistency)',
  progression_advance: 'Progression advanced based on recent performance',
  progression_regress: 'Progression adjusted for better recovery',
  
  // Fatigue / Recovery
  fatigue_high_reduce_volume: 'Volume reduced due to elevated fatigue',
  fatigue_stable_maintain: 'Volume maintained with stable recovery',
  recovery_bias_day: 'Recovery-focused session',
  high_neural_day: 'High neural demand for skill development',
  lower_fatigue_day: 'Lower fatigue cost to preserve recovery',
  
  // Flexible scheduling
  flexible_frequency_contract: 'Flexible schedule reduced for recovery',
  flexible_frequency_expand: 'Flexible schedule expanded for progress',
  flexible_frequency_maintain: 'Flexible schedule at current balance',
  static_schedule_set: 'Following your selected training days',
  
  // Movement intelligence
  joint_stress_downrank: 'Adjusted for joint stress management',
  straight_arm_load_control: 'Straight-arm volume managed',
  vertical_push_support: 'Vertical pushing support added',
  vertical_pull_support: 'Vertical pulling support added',
  horizontal_push_support: 'Horizontal pushing support added',
  horizontal_pull_support: 'Horizontal pulling support added',
  straight_arm_pull_support: 'Straight-arm pull strength for lever work',
  straight_arm_push_support: 'Straight-arm push strength for planche work',
  compression_support: 'Core compression for skill transfer',
  anti_extension_support: 'Anti-extension strength for body control',
  scapular_control_support: 'Scapular stability for shoulder health',
  
  // Session balance
  schedule_balance_reason: 'Balanced across the training week',
  skill_transfer_reason: 'Chosen for skill transfer value',
  time_budget_reason: 'Optimized for available time',
  equipment_constraint_reason: 'Selected for available equipment',
  
  // Stability
  no_change_due_to_stability: 'No changes needed - program is working',
  no_progress_due_to_incomplete_data: 'More training data needed for adaptation',
  maintained_for_consistency: 'Maintained for training consistency',
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if a reason code is valid
 */
export function isValidReasonCode(code: string): code is ProgramReasonCode {
  return code in REASON_CODE_LABELS
}

/**
 * Get label for reason code, with fallback
 */
export function getReasonLabel(code: ProgramReasonCode): string {
  return REASON_CODE_LABELS[code] || code.replace(/_/g, ' ')
}

/**
 * Validate that explanation has grounded reason codes
 */
export function validateExplanation(explanation: ProgramExplanation): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check all reason codes are valid
  for (const code of explanation.activeReasonCodes) {
    if (!isValidReasonCode(code)) {
      issues.push(`Invalid reason code: ${code}`)
    }
  }
  
  // Check summary has at least one reason
  if (explanation.summary.reasonCodes.length === 0) {
    issues.push('Summary has no reason codes')
  }
  
  // Check each day explanation is grounded
  for (const day of explanation.dayExplanations) {
    if (day.reasonCodes.length === 0 && day.exerciseExplanations.length === 0) {
      issues.push(`Day ${day.dayNumber} has no explanation`)
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  }
}
