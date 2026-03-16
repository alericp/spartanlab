// Constraint Detection Engine
// Elite calisthenics coaching logic for identifying true limiting factors
// Integrates with AthleteProfile, SkillState, CANONICAL readiness engine, and fatigue detection
// 
// IMPORTANT: This engine consumes readiness from the canonical readiness engine.
// All readiness data comes through readiness-service which stores canonical calculations.

import { getAthleteProfile, type AthleteProfile } from './data-service'
import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getSkillReadiness, getAthleteSkillReadiness, type SkillReadinessData } from './readiness-service'
import { getQuickFatigueDecision, type TrainingDecision } from './fatigue-decision-engine'
import { analyzeConstraints, type ConstraintResult } from './constraint-engine'
import type { SkillState } from './skill-state-service'
import type { LimitingFactor } from './readiness/canonical-readiness-engine'

// =============================================================================
// CONSTRAINT CATEGORIES
// =============================================================================

export type ConstraintCategory =
  // Strength-based constraints
  | 'pull_strength'
  | 'push_strength'
  | 'straight_arm_pull_strength'
  | 'straight_arm_push_strength'
  | 'compression_strength'
  | 'core_control'
  | 'scapular_control'
  | 'shoulder_stability'
  | 'wrist_tolerance'
  | 'explosive_pull_power'
  | 'transition_strength' // For muscle-up transition
  | 'vertical_push_strength' // For HSPU
  // Non-strength constraints
  | 'mobility'
  | 'shoulder_extension_mobility' // For back lever
  | 'skill_coordination'
  | 'balance_control' // For handstand work
  // Recovery and schedule constraints
  | 'fatigue_recovery'
  | 'schedule_time_constraint'
  | 'training_consistency'
  // Data quality
  | 'insufficient_data'
  | 'none'

export const CONSTRAINT_CATEGORY_LABELS: Record<ConstraintCategory, string> = {
  pull_strength: 'Pulling Strength',
  push_strength: 'Pushing Strength',
  straight_arm_pull_strength: 'Straight-Arm Pull Strength',
  straight_arm_push_strength: 'Straight-Arm Push Strength',
  compression_strength: 'Compression Strength',
  core_control: 'Core Control',
  scapular_control: 'Scapular Control',
  shoulder_stability: 'Shoulder Stability',
  wrist_tolerance: 'Wrist Tolerance',
  explosive_pull_power: 'Explosive Pull Power',
  transition_strength: 'Transition Strength',
  vertical_push_strength: 'Vertical Push Strength',
  mobility: 'General Mobility',
  shoulder_extension_mobility: 'Shoulder Extension Mobility',
  skill_coordination: 'Skill Coordination',
  balance_control: 'Balance Control',
  fatigue_recovery: 'Recovery / Fatigue',
  schedule_time_constraint: 'Time Availability',
  training_consistency: 'Training Consistency',
  insufficient_data: 'More Data Needed',
  none: 'No Constraint',
}

// =============================================================================
// SKILL-SPECIFIC CONSTRAINT REQUIREMENTS
// =============================================================================

export type SkillType = 'front_lever' | 'back_lever' | 'planche' | 'hspu' | 'muscle_up' | 'l_sit' | 'iron_cross'

interface SkillConstraintRequirements {
  primaryConstraints: ConstraintCategory[]
  secondaryConstraints: ConstraintCategory[]
  weights: Partial<Record<ConstraintCategory, number>>
}

export const SKILL_CONSTRAINT_REQUIREMENTS: Record<SkillType, SkillConstraintRequirements> = {
  front_lever: {
    primaryConstraints: ['pull_strength', 'straight_arm_pull_strength', 'compression_strength', 'scapular_control'],
    secondaryConstraints: ['core_control', 'shoulder_stability', 'mobility'],
    weights: {
      pull_strength: 0.30,
      straight_arm_pull_strength: 0.25,
      compression_strength: 0.25,
      scapular_control: 0.15,
      core_control: 0.05,
    },
  },
  back_lever: {
    primaryConstraints: ['straight_arm_pull_strength', 'shoulder_extension_mobility', 'scapular_control'],
    secondaryConstraints: ['shoulder_stability', 'core_control', 'mobility'],
    weights: {
      straight_arm_pull_strength: 0.30,
      shoulder_extension_mobility: 0.25,
      scapular_control: 0.25,
      shoulder_stability: 0.15,
      core_control: 0.05,
    },
  },
  planche: {
    primaryConstraints: ['push_strength', 'straight_arm_push_strength', 'shoulder_stability', 'wrist_tolerance'],
    secondaryConstraints: ['compression_strength', 'core_control', 'scapular_control'],
    weights: {
      push_strength: 0.25,
      straight_arm_push_strength: 0.25,
      shoulder_stability: 0.20,
      wrist_tolerance: 0.15,
      compression_strength: 0.10,
      core_control: 0.05,
    },
  },
  hspu: {
    primaryConstraints: ['vertical_push_strength', 'shoulder_stability', 'balance_control'],
    secondaryConstraints: ['core_control', 'wrist_tolerance', 'mobility'],
    weights: {
      vertical_push_strength: 0.35,
      shoulder_stability: 0.25,
      balance_control: 0.20,
      core_control: 0.10,
      wrist_tolerance: 0.10,
    },
  },
  muscle_up: {
    primaryConstraints: ['explosive_pull_power', 'transition_strength', 'pull_strength'],
    secondaryConstraints: ['push_strength', 'skill_coordination', 'scapular_control'],
    weights: {
      explosive_pull_power: 0.30,
      transition_strength: 0.25,
      pull_strength: 0.20,
      push_strength: 0.15,
      skill_coordination: 0.10,
    },
  },
  l_sit: {
    primaryConstraints: ['compression_strength', 'core_control', 'shoulder_stability'],
    secondaryConstraints: ['mobility', 'wrist_tolerance'],
    weights: {
      compression_strength: 0.40,
      core_control: 0.30,
      shoulder_stability: 0.15,
      mobility: 0.10,
      wrist_tolerance: 0.05,
    },
  },
  iron_cross: {
    primaryConstraints: ['straight_arm_push_strength', 'shoulder_stability', 'scapular_control'],
    secondaryConstraints: ['core_control', 'wrist_tolerance'],
    weights: {
      straight_arm_push_strength: 0.35,
      shoulder_stability: 0.25,
      scapular_control: 0.20,
      core_control: 0.10,
      wrist_tolerance: 0.10,
    },
  },
}

// =============================================================================
// CONSTRAINT SEVERITY THRESHOLDS
// =============================================================================

export type ConstraintSeverity = 'not_limiting' | 'minor_limiter' | 'primary_limiter' | 'severe_limiter'

export const SEVERITY_THRESHOLDS = {
  not_limiting: { min: 0, max: 20 },
  minor_limiter: { min: 20, max: 50 },
  primary_limiter: { min: 50, max: 80 },
  severe_limiter: { min: 80, max: 100 },
}

export function getConstraintSeverity(score: number): ConstraintSeverity {
  if (score >= 80) return 'severe_limiter'
  if (score >= 50) return 'primary_limiter'
  if (score >= 20) return 'minor_limiter'
  return 'not_limiting'
}

export const SEVERITY_LABELS: Record<ConstraintSeverity, string> = {
  not_limiting: 'Not Limiting',
  minor_limiter: 'Minor Limiter',
  primary_limiter: 'Primary Limiter',
  severe_limiter: 'Severe Limiter',
}

// =============================================================================
// CONSTRAINT INTERVENTIONS
// =============================================================================

export interface ConstraintIntervention {
  constraintCategory: ConstraintCategory
  severity: ConstraintSeverity
  exercises: string[]
  volumeAdjustment: 'increase_high' | 'increase_moderate' | 'maintain' | 'decrease'
  frequencyRecommendation: string
  coachingNote: string
}

export const CONSTRAINT_INTERVENTIONS: Record<ConstraintCategory, Omit<ConstraintIntervention, 'severity' | 'constraintCategory'>> = {
  pull_strength: {
    exercises: ['weighted_pull_up', 'pull_up', 'bent_over_row', 'chin_up'],
    volumeAdjustment: 'increase_high',
    frequencyRecommendation: '2-3x per week',
    coachingNote: 'Build pulling base before advancing lever progressions.',
  },
  push_strength: {
    exercises: ['weighted_dip', 'dip', 'push_up', 'ring_push_up'],
    volumeAdjustment: 'increase_high',
    frequencyRecommendation: '2-3x per week',
    coachingNote: 'Strengthen pushing base for planche and pressing skills.',
  },
  straight_arm_pull_strength: {
    exercises: ['front_lever_raise', 'tuck_front_lever', 'straight_arm_pulldown', 'inverted_hang'],
    volumeAdjustment: 'increase_moderate',
    frequencyRecommendation: '2-3x per week with longer rest between sessions',
    coachingNote: 'Straight-arm work requires tendon conditioning. Progress slowly.',
  },
  straight_arm_push_strength: {
    exercises: ['planche_lean', 'pseudo_planche_push_up', 'ring_support_hold', 'rto_support'],
    volumeAdjustment: 'increase_moderate',
    frequencyRecommendation: '2-3x per week with adequate recovery',
    coachingNote: 'Straight-arm pushing is highly demanding on shoulders. Build gradually.',
  },
  compression_strength: {
    exercises: ['l_sit', 'hanging_leg_raise', 'pike_compression', 'v_up', 'tuck_compression_hold'],
    volumeAdjustment: 'increase_high',
    frequencyRecommendation: '3-4x per week, can train frequently',
    coachingNote: 'Compression can be trained often and is essential for levers.',
  },
  core_control: {
    exercises: ['hollow_body_hold', 'plank', 'dead_bug', 'arch_hold'],
    volumeAdjustment: 'increase_moderate',
    frequencyRecommendation: 'Daily or 4-5x per week',
    coachingNote: 'Core tension is foundational for all skills. Train consistently.',
  },
  scapular_control: {
    exercises: ['scapular_pull_up', 'scapular_push_up', 'active_hang', 'scapular_depression_hold'],
    volumeAdjustment: 'increase_moderate',
    frequencyRecommendation: '3-4x per week as part of warm-up or main work',
    coachingNote: 'Scapular control improves skill quality and reduces injury risk.',
  },
  shoulder_stability: {
    exercises: ['external_rotation', 'face_pull', 'shoulder_tap', 'ring_support_hold'],
    volumeAdjustment: 'increase_moderate',
    frequencyRecommendation: 'Daily prehab + 2-3x strength work',
    coachingNote: 'Shoulder health enables all upper body skill progression.',
  },
  wrist_tolerance: {
    exercises: ['wrist_circles', 'wrist_push_up', 'finger_flexor_stretch', 'wrist_rock'],
    volumeAdjustment: 'maintain',
    frequencyRecommendation: 'Daily as part of warm-up',
    coachingNote: 'Wrist prep is essential for planche and handstand work.',
  },
  explosive_pull_power: {
    exercises: ['high_pull', 'explosive_pull_up', 'kipping_pull_up', 'chest_to_bar'],
    volumeAdjustment: 'increase_high',
    frequencyRecommendation: '2x per week with full recovery',
    coachingNote: 'Explosive pulling is the key to muscle-up transition.',
  },
  transition_strength: {
    exercises: ['muscle_up_transition', 'straight_bar_dip', 'deep_dip', 'muscle_up_negative'],
    volumeAdjustment: 'increase_moderate',
    frequencyRecommendation: '2-3x per week',
    coachingNote: 'Transition strength bridges pulling and pushing in muscle-up.',
  },
  vertical_push_strength: {
    exercises: ['pike_push_up', 'elevated_pike_push_up', 'wall_hspu', 'hspu_negative'],
    volumeAdjustment: 'increase_high',
    frequencyRecommendation: '2-3x per week',
    coachingNote: 'Vertical pushing strength is essential for HSPU progress.',
  },
  mobility: {
    exercises: ['shoulder_dislocates', 'hip_flexor_stretch', 'thoracic_rotation', 'pancake_stretch'],
    volumeAdjustment: 'maintain',
    frequencyRecommendation: 'Daily, 10-15 minutes',
    coachingNote: 'Mobility supports skill positions and reduces compensation patterns.',
  },
  shoulder_extension_mobility: {
    exercises: ['german_hang', 'skin_the_cat', 'behind_back_stretch', 'bridge'],
    volumeAdjustment: 'maintain',
    frequencyRecommendation: 'Daily, progress slowly',
    coachingNote: 'Shoulder extension is critical for back lever. Build gradually.',
  },
  skill_coordination: {
    exercises: ['skill_practice', 'technique_drills', 'partial_rom_work'],
    volumeAdjustment: 'increase_moderate',
    frequencyRecommendation: '3-5x per week, low fatigue',
    coachingNote: 'Skill coordination improves with quality practice volume.',
  },
  balance_control: {
    exercises: ['wall_handstand', 'freestanding_handstand', 'handstand_holds', 'balance_drills'],
    volumeAdjustment: 'increase_moderate',
    frequencyRecommendation: '4-6x per week, short sessions',
    coachingNote: 'Balance improves with frequent, focused practice.',
  },
  fatigue_recovery: {
    exercises: ['deload_session', 'active_recovery', 'mobility_work'],
    volumeAdjustment: 'decrease',
    frequencyRecommendation: 'Reduce training load for 3-7 days',
    coachingNote: 'Recovery is training. Respect fatigue signals.',
  },
  schedule_time_constraint: {
    exercises: ['compound_movements', 'supersets', 'priority_exercises'],
    volumeAdjustment: 'maintain',
    frequencyRecommendation: 'Focus on highest-impact exercises',
    coachingNote: 'When time is limited, prioritize compound skill work.',
  },
  training_consistency: {
    exercises: ['shorter_sessions', 'minimum_effective_dose', 'habit_building'],
    volumeAdjustment: 'maintain',
    frequencyRecommendation: 'Build consistent 3x per week habit first',
    coachingNote: 'Consistency beats intensity. Start with achievable frequency.',
  },
  insufficient_data: {
    exercises: [],
    volumeAdjustment: 'maintain',
    frequencyRecommendation: 'Continue training and logging',
    coachingNote: 'More training data will improve constraint detection accuracy.',
  },
  none: {
    exercises: [],
    volumeAdjustment: 'maintain',
    frequencyRecommendation: 'Continue current training approach',
    coachingNote: 'No significant constraints detected. Continue progressing.',
  },
}

export function getConstraintIntervention(
  category: ConstraintCategory,
  score: number
): ConstraintIntervention {
  const intervention = CONSTRAINT_INTERVENTIONS[category]
  const severity = getConstraintSeverity(score)
  
  return {
    constraintCategory: category,
    severity,
    ...intervention,
  }
}

// =============================================================================
// CONSTRAINT DETECTION RESULT TYPES
// =============================================================================

export interface ConstraintScore {
  category: ConstraintCategory
  score: number // 0-100, higher = more limiting (lower capability)
  confidence: 'high' | 'medium' | 'low'
  dataSource: string
}

export interface SkillConstraintResult {
  skill: SkillType
  primaryConstraint: ConstraintCategory
  secondaryConstraint: ConstraintCategory | null
  strongQualities: ConstraintCategory[]
  constraintScores: ConstraintScore[]
  overallReadiness: number // 0-100
  recommendations: string[]
  explanation: string
}

export interface GlobalConstraintResult {
  primaryConstraint: ConstraintCategory
  secondaryConstraint: ConstraintCategory | null
  strongQualities: ConstraintCategory[]
  skillResults: Record<SkillType, SkillConstraintResult | null>
  fatigueStatus: {
    isFatigued: boolean
    decision: TrainingDecision
    recommendation: string
  }
  scheduleStatus: {
    isTimeLimited: boolean
    averageSessionMinutes: number
    shortenedSessionRate: number
    recommendation: string
  }
  overallRecommendations: string[]
  dataQuality: 'excellent' | 'good' | 'partial' | 'insufficient'
}

// =============================================================================
// CONSTRAINT SCORE CALCULATION
// =============================================================================

function calculateConstraintScores(
  readinessData: SkillReadinessData | null,
  profile: AthleteProfile,
  skill: SkillType
): ConstraintScore[] {
  const scores: ConstraintScore[] = []
  
  // If we have readiness data, use it directly
  if (readinessData) {
    // Map readiness component scores to constraint scores
    // Lower readiness = higher constraint score (more limiting)
    scores.push({
      category: 'pull_strength',
      score: 100 - readinessData.pullStrengthScore,
      confidence: 'high',
      dataSource: 'readiness_engine',
    })
    
    scores.push({
      category: 'compression_strength',
      score: 100 - readinessData.compressionScore,
      confidence: 'high',
      dataSource: 'readiness_engine',
    })
    
    scores.push({
      category: 'scapular_control',
      score: 100 - readinessData.scapularControlScore,
      confidence: 'high',
      dataSource: 'readiness_engine',
    })
    
    scores.push({
      category: 'straight_arm_pull_strength',
      score: 100 - readinessData.straightArmScore,
      confidence: 'high',
      dataSource: 'readiness_engine',
    })
    
    scores.push({
      category: 'mobility',
      score: 100 - readinessData.mobilityScore,
      confidence: 'high',
      dataSource: 'readiness_engine',
    })
  }
  
  // Add profile-based constraint scores
  if (profile.weakestArea) {
    const weaknessMapping: Partial<Record<string, ConstraintCategory>> = {
      'pulling_strength': 'pull_strength',
      'pushing_strength': 'push_strength',
      'core_strength': 'core_control',
      'shoulder_stability': 'shoulder_stability',
      'hip_mobility': 'mobility',
      'hamstring_flexibility': 'mobility',
    }
    const mappedCategory = weaknessMapping[profile.weakestArea]
    if (mappedCategory) {
      // Add or increase the score for self-reported weakness
      const existingIdx = scores.findIndex(s => s.category === mappedCategory)
      if (existingIdx >= 0) {
        scores[existingIdx].score = Math.min(100, scores[existingIdx].score + 15)
      } else {
        scores.push({
          category: mappedCategory,
          score: 70, // Default high constraint score for self-reported weakness
          confidence: 'medium',
          dataSource: 'athlete_profile',
        })
      }
    }
  }
  
  // Add joint caution-based constraints
  if (profile.jointCautions && profile.jointCautions.length > 0) {
    for (const caution of profile.jointCautions) {
      switch (caution) {
        case 'wrists':
          scores.push({
            category: 'wrist_tolerance',
            score: 65,
            confidence: 'medium',
            dataSource: 'joint_cautions',
          })
          break
        case 'shoulders':
          scores.push({
            category: 'shoulder_stability',
            score: 60,
            confidence: 'medium',
            dataSource: 'joint_cautions',
          })
          break
        case 'elbows':
          // Elbow issues affect straight-arm work
          scores.push({
            category: 'straight_arm_pull_strength',
            score: 55,
            confidence: 'medium',
            dataSource: 'joint_cautions',
          })
          scores.push({
            category: 'straight_arm_push_strength',
            score: 55,
            confidence: 'medium',
            dataSource: 'joint_cautions',
          })
          break
      }
    }
  }
  
  // Fill in missing categories with neutral scores based on profile data
  const allCategories = SKILL_CONSTRAINT_REQUIREMENTS[skill].primaryConstraints
    .concat(SKILL_CONSTRAINT_REQUIREMENTS[skill].secondaryConstraints)
  
  for (const category of allCategories) {
    if (!scores.find(s => s.category === category)) {
      scores.push({
        category,
        score: 50, // Neutral score when no data
        confidence: 'low',
        dataSource: 'default',
      })
    }
  }
  
  return scores
}

// =============================================================================
// SKILL-SPECIFIC CONSTRAINT DETECTION
// =============================================================================

export function detectSkillConstraints(
  skill: SkillType,
  readinessData: SkillReadinessData | null,
  profile: AthleteProfile
): SkillConstraintResult {
  const requirements = SKILL_CONSTRAINT_REQUIREMENTS[skill]
  const constraintScores = calculateConstraintScores(readinessData, profile, skill)
  
  // Calculate weighted scores for relevant constraints
  const weightedScores: { category: ConstraintCategory; weightedScore: number }[] = []
  
  for (const score of constraintScores) {
    const weight = requirements.weights[score.category] || 0.05
    weightedScores.push({
      category: score.category,
      weightedScore: score.score * weight,
    })
  }
  
  // Sort by weighted score (highest = most limiting)
  weightedScores.sort((a, b) => b.weightedScore - a.weightedScore)
  
  // Determine primary and secondary constraints
  const primaryConstraint = weightedScores[0]?.category || 'insufficient_data'
  const secondaryConstraint = weightedScores[1]?.category || null
  
  // Identify strong qualities (low constraint scores)
  const strongQualities = constraintScores
    .filter(s => s.score < 40)
    .map(s => s.category)
  
  // Calculate overall readiness
  let overallReadiness = 0
  let totalWeight = 0
  for (const score of constraintScores) {
    const weight = requirements.weights[score.category] || 0.05
    overallReadiness += (100 - score.score) * weight
    totalWeight += weight
  }
  overallReadiness = Math.round(overallReadiness / (totalWeight || 1))
  
  // Generate recommendations
  const recommendations = generateSkillRecommendations(
    skill,
    primaryConstraint,
    secondaryConstraint,
    strongQualities
  )
  
  // Generate explanation
  const explanation = generateSkillExplanation(
    skill,
    primaryConstraint,
    secondaryConstraint,
    constraintScores
  )
  
  return {
    skill,
    primaryConstraint,
    secondaryConstraint,
    strongQualities,
    constraintScores,
    overallReadiness,
    recommendations,
    explanation,
  }
}

// =============================================================================
// RECOMMENDATION GENERATION
// =============================================================================

function generateSkillRecommendations(
  skill: SkillType,
  primary: ConstraintCategory,
  secondary: ConstraintCategory | null,
  strongQualities: ConstraintCategory[]
): string[] {
  const recommendations: string[] = []
  
  // Primary constraint recommendations
  const primaryRecs = getConstraintRecommendation(primary, 'increase')
  if (primaryRecs) recommendations.push(primaryRecs)
  
  // Secondary constraint recommendations
  if (secondary) {
    const secondaryRecs = getConstraintRecommendation(secondary, 'add')
    if (secondaryRecs) recommendations.push(secondaryRecs)
  }
  
  // Strong quality recommendations
  if (strongQualities.length > 0) {
    const strongLabels = strongQualities
      .slice(0, 2)
      .map(q => CONSTRAINT_CATEGORY_LABELS[q].toLowerCase())
      .join(' and ')
    recommendations.push(`Maintain ${strongLabels} with current volume`)
  }
  
  // Skill-specific exposure recommendation
  const skillLabel = skill.replace(/_/g, ' ')
  recommendations.push(`Continue ${skillLabel} exposure at current progression`)
  
  return recommendations
}

function getConstraintRecommendation(
  constraint: ConstraintCategory,
  action: 'increase' | 'add' | 'maintain'
): string | null {
  const actionVerb = {
    increase: 'Increase',
    add: 'Add',
    maintain: 'Maintain',
  }[action]
  
  const recommendations: Partial<Record<ConstraintCategory, string>> = {
    pull_strength: `${actionVerb} weighted pulling work (pull-ups, rows)`,
    push_strength: `${actionVerb} weighted pushing work (dips, push-ups)`,
    straight_arm_pull_strength: `${actionVerb} straight-arm pulling (FL raises, tuck FL)`,
    straight_arm_push_strength: `${actionVerb} straight-arm pushing (planche leans, pseudo planche)`,
    compression_strength: `${actionVerb} compression work (L-sit, V-ups, leg lifts)`,
    core_control: `${actionVerb} hollow body and core tension drills`,
    scapular_control: `${actionVerb} scapular pull-ups and controlled hangs`,
    shoulder_stability: `${actionVerb} shoulder prep and stability work`,
    wrist_tolerance: `${actionVerb} wrist conditioning and prep`,
    explosive_pull_power: `${actionVerb} explosive pull training (high pulls, kipping)`,
    transition_strength: `${actionVerb} transition drills and straight bar dip work`,
    vertical_push_strength: `${actionVerb} pike push-ups and overhead pressing`,
    mobility: `${actionVerb} targeted mobility work`,
    shoulder_extension_mobility: `${actionVerb} German hang and shoulder extension stretches`,
    skill_coordination: `${actionVerb} skill practice volume with technique focus`,
    balance_control: `${actionVerb} handstand balance work`,
    fatigue_recovery: 'Reduce volume and prioritize recovery',
    schedule_time_constraint: 'Focus on highest-priority exercises in limited time',
    training_consistency: 'Focus on building consistent training habits',
  }
  
  return recommendations[constraint] || null
}

function generateSkillExplanation(
  skill: SkillType,
  primary: ConstraintCategory,
  secondary: ConstraintCategory | null,
  scores: ConstraintScore[]
): string {
  const skillLabel = skill.replace(/_/g, ' ')
  const primaryLabel = CONSTRAINT_CATEGORY_LABELS[primary]
  
  const primaryScore = scores.find(s => s.category === primary)
  
  let explanation = `Your ${skillLabel} is primarily limited by ${primaryLabel.toLowerCase()}`
  
  if (primaryScore && primaryScore.confidence === 'high') {
    explanation += ` (${100 - primaryScore.score}% readiness)`
  }
  
  if (secondary) {
    const secondaryLabel = CONSTRAINT_CATEGORY_LABELS[secondary]
    explanation += `, with ${secondaryLabel.toLowerCase()} as a secondary limiter`
  }
  
  explanation += '.'
  
  return explanation
}

// =============================================================================
// SCHEDULE CONSTRAINT DETECTION
// =============================================================================

function detectScheduleConstraints(logs: WorkoutLog[]): {
  isTimeLimited: boolean
  averageSessionMinutes: number
  shortenedSessionRate: number
  recommendation: string
} {
  if (logs.length === 0) {
    return {
      isTimeLimited: false,
      averageSessionMinutes: 0,
      shortenedSessionRate: 0,
      recommendation: 'Start logging workouts to track time patterns',
    }
  }
  
  // Analyze recent logs (last 14 days)
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  
  const recentLogs = logs.filter(log => 
    new Date(log.sessionDate) >= twoWeeksAgo
  )
  
  if (recentLogs.length === 0) {
    return {
      isTimeLimited: false,
      averageSessionMinutes: 0,
      shortenedSessionRate: 0,
      recommendation: 'Resume training to analyze time patterns',
    }
  }
  
  // Calculate average session duration
  const totalMinutes = recentLogs.reduce((sum, log) => sum + log.durationMinutes, 0)
  const averageSessionMinutes = Math.round(totalMinutes / recentLogs.length)
  
  // Check for shortened sessions (with time optimization data)
  const shortenedLogs = recentLogs.filter(log => 
    log.timeOptimization?.wasOptimized === true
  )
  const shortenedSessionRate = shortenedLogs.length / recentLogs.length
  
  // Determine if time-limited
  const isTimeLimited = shortenedSessionRate > 0.3 || averageSessionMinutes < 40
  
  let recommendation = ''
  if (isTimeLimited) {
    if (shortenedSessionRate > 0.5) {
      recommendation = 'Consider adjusting session length in settings to match available time'
    } else if (averageSessionMinutes < 30) {
      recommendation = 'Very short sessions detected - prioritize compound movements'
    } else {
      recommendation = 'Moderate time constraints - use time optimization features'
    }
  } else {
    recommendation = 'Session length is adequate for full programming'
  }
  
  return {
    isTimeLimited,
    averageSessionMinutes,
    shortenedSessionRate: Math.round(shortenedSessionRate * 100) / 100,
    recommendation,
  }
}

// =============================================================================
// MAIN CONSTRAINT DETECTION FUNCTION
// =============================================================================

export async function detectConstraints(
  athleteId: string
): Promise<GlobalConstraintResult> {
  // Gather all data
  const profile = getAthleteProfile()
  const logs = getWorkoutLogs()
  const fatigueDecision = getQuickFatigueDecision()
  const existingConstraints = analyzeConstraints()
  
  // Get readiness data for all skills
  let readinessData: SkillReadinessData[] = []
  try {
    readinessData = await getAthleteSkillReadiness(athleteId)
  } catch (error) {
    console.warn('[ConstraintEngine] Could not fetch readiness data:', error)
  }
  
  // Detect schedule constraints
  const scheduleStatus = detectScheduleConstraints(logs)
  
  // Detect fatigue status
  const fatigueStatus = {
    isFatigued: fatigueDecision.decision !== 'TRAIN_AS_PLANNED',
    decision: fatigueDecision.decision,
    recommendation: fatigueDecision.shortGuidance,
  }
  
  // Detect constraints for each skill
  const skillResults: Record<SkillType, SkillConstraintResult | null> = {
    front_lever: null,
    back_lever: null,
    planche: null,
    hspu: null,
    muscle_up: null,
    l_sit: null,
  }
  
  const skills: SkillType[] = ['front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit']
  
  for (const skill of skills) {
    const skillReadiness = readinessData.find(r => r.skill === skill) || null
    skillResults[skill] = detectSkillConstraints(skill, skillReadiness, profile)
  }
  
  // Determine global primary constraint
  // Priority: fatigue > schedule > skill-based
  let primaryConstraint: ConstraintCategory = 'none'
  let secondaryConstraint: ConstraintCategory | null = null
  const strongQualities: ConstraintCategory[] = []
  
  if (fatigueStatus.isFatigued && fatigueStatus.decision === 'DELOAD_RECOMMENDED') {
    primaryConstraint = 'fatigue_recovery'
  } else if (scheduleStatus.isTimeLimited && scheduleStatus.shortenedSessionRate > 0.5) {
    primaryConstraint = 'schedule_time_constraint'
  } else {
    // Use skill-based constraint detection
    // Focus on primary goal skill
    const primaryGoal = profile.primaryGoal as SkillType | null
    if (primaryGoal && skillResults[primaryGoal]) {
      primaryConstraint = skillResults[primaryGoal]!.primaryConstraint
      secondaryConstraint = skillResults[primaryGoal]!.secondaryConstraint
      strongQualities.push(...skillResults[primaryGoal]!.strongQualities)
    } else {
      // Fall back to existing constraint engine
      const existingMapping: Partial<Record<string, ConstraintCategory>> = {
        'pull_strength_deficit': 'pull_strength',
        'push_strength_deficit': 'push_strength',
        'core_tension_deficit': 'core_control',
        'fatigue_accumulation': 'fatigue_recovery',
        'recovery_deficit': 'fatigue_recovery',
      }
      primaryConstraint = existingMapping[existingConstraints.primaryConstraint] || 'insufficient_data'
    }
  }
  
  // Determine data quality
  let dataQuality: 'excellent' | 'good' | 'partial' | 'insufficient' = 'insufficient'
  if (readinessData.length >= 4 && logs.length >= 10) {
    dataQuality = 'excellent'
  } else if (readinessData.length >= 2 && logs.length >= 5) {
    dataQuality = 'good'
  } else if (readinessData.length >= 1 || logs.length >= 3) {
    dataQuality = 'partial'
  }
  
  // Generate overall recommendations
  const overallRecommendations: string[] = []
  
  if (primaryConstraint !== 'none' && primaryConstraint !== 'insufficient_data') {
    const primaryRec = getConstraintRecommendation(primaryConstraint, 'increase')
    if (primaryRec) overallRecommendations.push(primaryRec)
  }
  
  if (fatigueStatus.isFatigued) {
    overallRecommendations.push(fatigueStatus.recommendation)
  }
  
  if (scheduleStatus.isTimeLimited) {
    overallRecommendations.push(scheduleStatus.recommendation)
  }
  
  if (strongQualities.length > 0) {
    const strongLabels = strongQualities
      .slice(0, 2)
      .map(q => CONSTRAINT_CATEGORY_LABELS[q].toLowerCase())
      .join(' and ')
    overallRecommendations.push(`Maintain ${strongLabels} - these are already strong`)
  }
  
  return {
    primaryConstraint,
    secondaryConstraint,
    strongQualities,
    skillResults,
    fatigueStatus,
    scheduleStatus,
    overallRecommendations,
    dataQuality,
  }
}

// =============================================================================
// SYNCHRONOUS VERSION FOR IMMEDIATE USE
// =============================================================================

export function detectConstraintsSync(): Omit<GlobalConstraintResult, 'skillResults'> & {
  skillResults: Record<SkillType, SkillConstraintResult | null>
} {
  const profile = getAthleteProfile()
  const logs = getWorkoutLogs()
  const fatigueDecision = getQuickFatigueDecision()
  const existingConstraints = analyzeConstraints()
  
  // Detect schedule constraints
  const scheduleStatus = detectScheduleConstraints(logs)
  
  // Detect fatigue status
  const fatigueStatus = {
    isFatigued: fatigueDecision.decision !== 'TRAIN_AS_PLANNED',
    decision: fatigueDecision.decision,
    recommendation: fatigueDecision.shortGuidance,
  }
  
  // Initialize skill results (without readiness data - will use profile-based scoring)
  const skillResults: Record<SkillType, SkillConstraintResult | null> = {
    front_lever: detectSkillConstraints('front_lever', null, profile),
    back_lever: detectSkillConstraints('back_lever', null, profile),
    planche: detectSkillConstraints('planche', null, profile),
    hspu: detectSkillConstraints('hspu', null, profile),
    muscle_up: detectSkillConstraints('muscle_up', null, profile),
    l_sit: detectSkillConstraints('l_sit', null, profile),
  }
  
  // Determine global constraints
  let primaryConstraint: ConstraintCategory = 'none'
  let secondaryConstraint: ConstraintCategory | null = null
  const strongQualities: ConstraintCategory[] = []
  
  if (fatigueStatus.isFatigued && fatigueStatus.decision === 'DELOAD_RECOMMENDED') {
    primaryConstraint = 'fatigue_recovery'
  } else if (scheduleStatus.isTimeLimited && scheduleStatus.shortenedSessionRate > 0.5) {
    primaryConstraint = 'schedule_time_constraint'
  } else {
    const primaryGoal = profile.primaryGoal as SkillType | null
    if (primaryGoal && skillResults[primaryGoal]) {
      primaryConstraint = skillResults[primaryGoal]!.primaryConstraint
      secondaryConstraint = skillResults[primaryGoal]!.secondaryConstraint
      strongQualities.push(...skillResults[primaryGoal]!.strongQualities)
    } else {
      const existingMapping: Partial<Record<string, ConstraintCategory>> = {
        'pull_strength_deficit': 'pull_strength',
        'push_strength_deficit': 'push_strength',
        'core_tension_deficit': 'core_control',
        'fatigue_accumulation': 'fatigue_recovery',
        'recovery_deficit': 'fatigue_recovery',
      }
      primaryConstraint = existingMapping[existingConstraints.primaryConstraint] || 'insufficient_data'
    }
  }
  
  const dataQuality = logs.length >= 10 ? 'good' : logs.length >= 3 ? 'partial' : 'insufficient'
  
  const overallRecommendations: string[] = []
  if (primaryConstraint !== 'none' && primaryConstraint !== 'insufficient_data') {
    const primaryRec = getConstraintRecommendation(primaryConstraint, 'increase')
    if (primaryRec) overallRecommendations.push(primaryRec)
  }
  if (fatigueStatus.isFatigued) {
    overallRecommendations.push(fatigueStatus.recommendation)
  }
  if (scheduleStatus.isTimeLimited) {
    overallRecommendations.push(scheduleStatus.recommendation)
  }
  
  return {
    primaryConstraint,
    secondaryConstraint,
    strongQualities,
    skillResults,
    fatigueStatus,
    scheduleStatus,
    overallRecommendations,
    dataQuality,
  }
}

// =============================================================================
// CONSTRAINT INSIGHT FOR DASHBOARD
// =============================================================================

export function getConstraintInsightForSkill(skill: SkillType): {
  hasInsight: boolean
  primaryLabel: string
  secondaryLabel: string | null
  strongQualitiesLabel: string
  recommendations: string[]
  explanation: string
} {
  const profile = getAthleteProfile()
  const result = detectSkillConstraints(skill, null, profile)
  
  if (result.primaryConstraint === 'insufficient_data') {
    return {
      hasInsight: false,
      primaryLabel: 'More Data Needed',
      secondaryLabel: null,
      strongQualitiesLabel: '',
      recommendations: ['Log workouts to unlock constraint detection'],
      explanation: 'Track your training to receive personalized constraint analysis.',
    }
  }
  
  return {
    hasInsight: true,
    primaryLabel: CONSTRAINT_CATEGORY_LABELS[result.primaryConstraint],
    secondaryLabel: result.secondaryConstraint 
      ? CONSTRAINT_CATEGORY_LABELS[result.secondaryConstraint] 
      : null,
    strongQualitiesLabel: result.strongQualities
      .map(q => CONSTRAINT_CATEGORY_LABELS[q])
      .join(', '),
    recommendations: result.recommendations,
    explanation: result.explanation,
  }
}
