/**
 * SpartanLab Coaching Intelligence Engine - Central Index
 * 
 * This module provides a unified entry point to all coaching engine components.
 * It ties together the various config modules, progression systems, and assembly engines.
 * 
 * ARCHITECTURE OVERVIEW:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    COACHING INTELLIGENCE ENGINE                         │
 * │                                                                         │
 * │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
 * │  │ TRAINING        │  │ SKILL           │  │ WEAK POINT              │ │
 * │  │ PRINCIPLES      │  │ PROGRESSIONS    │  │ PRIORITY                │ │
 * │  │ CONFIG          │  │ SYSTEMS         │  │ ENGINE                  │ │
 * │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
 * │          │                    │                      │                 │
 * │          └────────────────────┼──────────────────────┘                 │
 * │                               ▼                                        │
 * │  ┌─────────────────────────────────────────────────────────────────┐  │
 * │  │                    SESSION ASSEMBLY ENGINE                       │  │
 * │  │      Intelligent block ordering and exercise sequencing          │  │
 * │  └─────────────────────────────────────────────────────────────────┘  │
 * │                               │                                        │
 * │          ┌────────────────────┼────────────────────┐                  │
 * │          ▼                    ▼                    ▼                  │
 * │  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
 * │  │ ENDURANCE     │  │ MILITARY        │  │ WEIGHTED                │ │
 * │  │ DENSITY       │  │ TEST            │  │ CALISTHENICS            │ │
 * │  │ CONFIG        │  │ CONFIG          │  │ LOGIC                   │ │
 * │  └───────────────┘  └─────────────────┘  └─────────────────────────┘ │
 * │                                                                       │
 * └───────────────────────────────────────────────────────────────────────┘
 * 
 * INTERNAL ONLY:
 * - No branded methods exposed
 * - No coach names or athlete names
 * - Clean, simple outputs for users
 * - Complex intelligence hidden behind the scenes
 */

// =============================================================================
// CORE ENGINE EXPORTS
// =============================================================================

export {
  // Training Principles
  TRAINING_PRINCIPLES,
  getApplicablePrinciples,
  resolvePrincipleConflicts,
  
  // Session Structure
  determineSessionStructure,
  
  // Readiness Analysis
  analyzeReadinessProfile,
  selectProgressionLevel,
  
  // Marketing Capability Proof
  COACHING_CAPABILITIES,
  generateCapabilityDescription,
  
  // Types
  type PrincipleId,
  type PrincipleCategory,
  type TrainingPrinciple,
  type PrincipleApplicationContext,
  type SessionStructure,
  type ReadinessProfile,
  type ProgressionDecision,
} from './coaching-intelligence-engine'

// =============================================================================
// SESSION CONFIGURATION EXPORTS
// =============================================================================

export {
  // Session Durations
  SESSION_DURATION_OPTIONS,
  shouldShowExtendedDurations,
  getAvailableSessionDurations,
  
  // Coaching Principles (internal)
  COACHING_PRINCIPLES,
  getApplicableCoachingPrinciples,
  
  // Handstand Training Rules
  HANDSTAND_TRAINING_CONFIG,
  shouldIncludeHandstandStrength,
  
  // Iron Cross Safety
  IRON_CROSS_READINESS_REQUIREMENTS,
  IRON_CROSS_FOUNDATIONAL_PROGRESSIONS,
  IRON_CROSS_SAFETY_WARNING,
  checkIronCrossReadiness,
  
  // Running Rules
  RUNNING_INCLUSION_RULES,
  shouldIncludeRunning,
  
  // Session Sequencing
  SESSION_SEQUENCING_RULES,
  getSessionStructure as getSessionBlockStructure,
  
  // Types
  type StandardSessionLength,
  type ExtendedSessionLength,
  type AllSessionLength,
  type SessionDurationOption,
  type CoachingPrinciple,
  type HandstandTrainingConfig,
  type IronCrossReadinessCheck,
  type IronCrossFoundationalProgression,
  type RunningInclusionRules,
  type SessionSequencingRules,
} from './training-session-config'

// =============================================================================
// SKILL PROGRESSION EXPORTS
// =============================================================================

export {
  // Core Progressions
  PLANCHE_PROGRESSION,
  FRONT_LEVER_PROGRESSION,
  MUSCLE_UP_PROGRESSION,
  
  // Types
  type EnhancedSkillLevel,
  type EnhancedSkillDefinition,
} from './skill-progression-rules'

export {
  // Full Progression Systems
  PLANCHE_SYSTEM,
  FRONT_LEVER_SYSTEM,
  HANDSTAND_SYSTEM,
  MUSCLE_UP_SYSTEM,
  IRON_CROSS_SYSTEM,
  SKILL_PROGRESSION_SYSTEMS,
  
  // Functions
  getSkillProgressionSystem,
  checkSkillReadiness,
  
  // Types
  type SkillProgressionSystem,
  type ProgressionLevel,
  type ReadinessRequirement,
  type SupportExercise,
  type MobilityPrepWork,
} from './comprehensive-skill-progressions'

// =============================================================================
// WEAK POINT ANALYSIS EXPORTS
// =============================================================================

export {
  // Analysis Functions
  analyzeWeakPoints,
  getSkillSpecificRecommendations,
  
  // Types
  type WeakPointCategory,
  type WeakPointAssessment,
  type UserProfileFactors,
  type WeakPointAnalysisResult,
} from './weak-point-priority-engine'

// =============================================================================
// SESSION ASSEMBLY EXPORTS
// =============================================================================

export {
  // Session Builders
  buildSkillFirstSession,
  buildWeightedStrengthSession,
  buildHandstandFocusedSession,
  buildMilitaryConditioningSession,
  buildEnduranceSession,
  buildLongStrengthSession,
  
  // Assembly Function
  assembleSession,
  getSessionDurationMinutes,
  validateSessionAssembly,
  
  // Types
  type SessionBlockType,
  type SessionBlock,
  type SessionTemplate,
  type SessionAssemblyContext,
} from './session-assembly-engine'

// =============================================================================
// ENDURANCE / DENSITY EXPORTS
// =============================================================================

export {
  // Protocol Configs
  ENDURANCE_PROTOCOLS,
  
  // Protocol Selection
  selectEnduranceProtocol,
  
  // Max Rep Development
  generateMaxRepPlan,
  
  // Military Conditioning
  MILITARY_CONDITIONING_BLOCKS,
  getMilitaryConditioningPlan,
  
  // Types
  type EnduranceProtocol,
  type EnduranceProtocolConfig,
  type EnduranceProtocolContext,
  type MaxRepWave,
  type MaxRepProgressionPlan,
  type MilitaryConditioningBlock,
} from './endurance-density-config'

// =============================================================================
// PULLING STRENGTH ENGINE EXPORTS
// =============================================================================

export {
  // Exercise Library
  PULLING_EXERCISE_LIBRARY,
  
  // One-Arm Pull-Up System
  ONE_ARM_PULL_UP_SYSTEM,
  
  // Weighted Pull-Up Levels & Programs
  WEIGHTED_PULL_UP_LEVELS,
  WEIGHTED_PULL_UP_PROGRAMS,
  
  // Endurance Protocols
  PULL_UP_ENDURANCE_PROTOCOLS,
  
  // Weak Point Analysis
  analyzeFullPullProfile,
  getPullPriorityExercises,
  analyzePullStrength,
  analyzeScapularDepression,
  analyzeGripStrength,
  analyzeArmBalance,
  analyzeExplosivePower,
  
  // Guide Structures
  PULL_GUIDE_STRUCTURES,
  
  // Marketing Support
  PULL_MARKETING_CLAIMS,
  
  // Types
  type PullingExercise,
  type PullWeakPointCategory,
  type PullWeakPointAssessment,
  type PullProfileFactors,
  type WeightedPullUpLevel,
  type WeightedPullUpProgram,
  type PullUpEnduranceProtocol,
  type PullGuideStructure,
} from './pulling-strength-engine'

// =============================================================================
// TRAINING CYCLE ENGINE EXPORTS
// =============================================================================

export {
  // Skill Cycles
  PLANCHE_SKILL_CYCLE,
  FRONT_LEVER_SKILL_CYCLE,
  HANDSTAND_SKILL_CYCLE,
  MUSCLE_UP_SKILL_CYCLE,
  ONE_ARM_PULL_UP_SKILL_CYCLE,
  SKILL_CYCLES,
  
  // Strength Cycles
  WEIGHTED_PULL_STRENGTH_CYCLE,
  WEIGHTED_DIP_STRENGTH_CYCLE,
  STREETLIFTING_STRENGTH_CYCLE,
  STRENGTH_CYCLES,
  
  // Hypertrophy Cycles
  UPPER_HYPERTROPHY_CYCLE,
  PULL_HYPERTROPHY_CYCLE,
  PUSH_HYPERTROPHY_CYCLE,
  HYPERTROPHY_CYCLES,
  
  // Endurance Cycles
  PULL_ENDURANCE_CYCLE,
  GENERAL_ENDURANCE_CYCLE,
  ENDURANCE_CYCLES,
  
  // Utility Cycles
  MIXED_DEVELOPMENT_CYCLE,
  DELOAD_CYCLE,
  PEAK_CYCLE,
  UTILITY_CYCLES,
  
  // All Cycles
  ALL_TRAINING_CYCLES,
  
  // Cycle Selection Engine
  selectRecommendedCycle,
  
  // Cycle Transition Engine
  RECOMMENDED_CYCLE_TRANSITIONS,
  getTransitionRecommendation,
  
  // Guide Structures
  CYCLE_GUIDE_STRUCTURES,
  
  // Marketing Support
  CYCLE_MARKETING_CLAIMS,
  
  // Types
  type CycleType,
  type CycleFocus,
  type TrainingCycle,
  type VolumeDistribution,
  type IntensityDistribution,
  type ProgressionPacing,
  type ExerciseBias,
  type RecoveryBias,
  type CycleSelectionFactors,
  type CycleTransition,
  type CycleGuideStructure,
} from './training-cycle-engine'

// =============================================================================
// BACK LEVER TRAINING SYSTEM EXPORTS
// =============================================================================

export {
  // Exercise Library
  BACK_LEVER_EXERCISE_LIBRARY,
  
  // Readiness & Safety
  BACK_LEVER_READINESS_GATES,
  BACK_LEVER_WEAK_POINTS,
  
  // Progression System
  BACK_LEVER_PROGRESSION_SYSTEM,
  
  // Skill Relationships
  BACK_LEVER_SKILL_RELATIONSHIPS,
  
  // Training Cycle
  BACK_LEVER_SKILL_CYCLE,
  
  // Guide & SEO
  BACK_LEVER_GUIDE_STRUCTURE,
  BACK_LEVER_SEO_PAGES,
  
  // Marketing
  BACK_LEVER_MARKETING_CLAIMS,
  
  // Session Integration
  BACK_LEVER_SESSION_TEMPLATE,
  
  // Types
  type BackLeverExercise,
  type BackLeverWeakPoint,
  type BackLeverReadinessGate,
} from './back-lever-training-system'

// =============================================================================
// PREDICTION ENGINE EXPORTS
// =============================================================================

export {
  // Main Prediction Functions
  getSkillPrediction,
  getAllSkillPredictions,
  getDashboardPredictionSummary,
  getSpecificSkillPredictions,
  generateUnifiedPrediction,
  generateBatchPredictions,
  
  // Configuration
  SKILL_DIFFICULTY_CONFIG,
  SKILL_NAMES,
  SKILL_LEVELS,
  LIMITER_LABELS,
  LIMITER_TIMELINE_IMPACTS,
  LIMITER_FOCUS_EXERCISES,
  
  // Normalizers
  normalizePredictionInputs,
  normalizeStrengthSupport,
  normalizeConsistencyLevel,
  
  // Types
  type UnifiedSkillPrediction,
  type BatchPredictionResult,
  type PredictionInputs,
  type PredictionLimiter,
  type TimelineEstimate,
  type ProgressionStage,
  type MomentumModifier,
  type RecoveryModifier,
  type ConfidenceTier,
  type LimiterCategory,
} from './prediction'

// =============================================================================
// MARKETING SUPPORT EXPORTS
// =============================================================================

export {
  // Capability Documentation
  FEATURE_CAPABILITIES,
  
  // Copy Generators
  generateHeroSection,
  generateFeatureSection,
  generateCoachExplainer,
  generateCapabilityProof,
  
  // SEO Support
  SEO_CONTENT_STRUCTURES,
  
  // Validation
  validateMarketingClaim,
  generateTagline,
  generateCapabilityDescription as generateMarketingDescription,
  
  // Types
  type FeatureCapability,
  type MarketingCopyBlock,
  type SEOContentStructure,
} from './marketing-copy-support'

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import type { PrimaryTrainingOutcome, SkillGoal } from './athlete-profile'
import type { ExperienceLevel, PrimaryGoal, SessionLength } from './program-service'
import { analyzeWeakPoints, type UserProfileFactors } from './weak-point-priority-engine'
import { assembleSession, type SessionTemplate } from './session-assembly-engine'
import { getApplicablePrinciples, type TrainingPrinciple } from './coaching-intelligence-engine'
import { checkSkillReadiness, type SkillProgressionSystem, SKILL_PROGRESSION_SYSTEMS } from './comprehensive-skill-progressions'
import { selectEnduranceProtocol, type EnduranceProtocolConfig } from './endurance-density-config'

export interface CoachingContext {
  outcome: PrimaryTrainingOutcome
  goal?: PrimaryGoal
  experienceLevel: ExperienceLevel
  sessionLengthMinutes: number
  skillGoals?: SkillGoal[]
  userProfile?: UserProfileFactors
}

export interface CoachingRecommendation {
  sessionTemplate: SessionTemplate
  applicablePrinciples: TrainingPrinciple[]
  skillReadiness: Record<string, { isReady: boolean; recommendations: string[] }>
  enduranceProtocol?: EnduranceProtocolConfig
  weakPointAnalysis?: {
    overallReadiness: number
    topRecommendations: string[]
    exercisePriorities: string[]
  }
  safetyWarnings: string[]
}

/**
 * Unified coaching recommendation generator
 * 
 * Takes a user context and returns comprehensive coaching recommendations
 * including session structure, applicable principles, skill readiness, and safety warnings.
 */
export function generateCoachingRecommendation(context: CoachingContext): CoachingRecommendation {
  const { outcome, goal, experienceLevel, sessionLengthMinutes, skillGoals = [], userProfile } = context
  
  // Get applicable training principles
  const applicablePrinciples = getApplicablePrinciples({
    outcome,
    goal,
    experienceLevel,
    sessionLength: sessionLengthMinutes.toString() as SessionLength,
  })
  
  // Assemble session structure
  const sessionTemplate = assembleSession({
    outcome,
    primaryGoal: goal,
    experienceLevel,
    sessionLengthMinutes,
    hasHandstandGoal: skillGoals.includes('handstand') || skillGoals.includes('handstand_pushup'),
    skillGoals: skillGoals as string[],
  })
  
  // Check skill readiness for each goal
  const skillReadiness: Record<string, { isReady: boolean; recommendations: string[] }> = {}
  for (const skill of skillGoals) {
    if (SKILL_PROGRESSION_SYSTEMS[skill]) {
      const readiness = checkSkillReadiness(skill, {
        experienceLevel,
        pullUpMax: userProfile?.pullUpMax,
        pushUpMax: userProfile?.pushUpMax,
        dipMax: userProfile?.dipMax,
      })
      skillReadiness[skill] = {
        isReady: readiness.isReady,
        recommendations: [...readiness.criticalMissing, ...readiness.recommendations],
      }
    }
  }
  
  // Get endurance protocol if applicable
  let enduranceProtocol: EnduranceProtocolConfig | undefined
  if (outcome === 'endurance' || outcome === 'military' || outcome === 'max_reps') {
    enduranceProtocol = selectEnduranceProtocol({
      outcome,
      experienceLevel,
      sessionRole: 'primary',
      availableMinutes: sessionLengthMinutes * 0.4,
      hasRunningCapability: true,
    })
  }
  
  // Analyze weak points if user profile provided
  let weakPointAnalysis
  if (userProfile) {
    const analysis = analyzeWeakPoints(userProfile)
    weakPointAnalysis = {
      overallReadiness: analysis.overallReadiness,
      topRecommendations: analysis.topRecommendations,
      exercisePriorities: analysis.exercisePriorities,
    }
  }
  
  // Collect safety warnings
  const safetyWarnings: string[] = []
  
  // Add iron cross warning if applicable
  if (skillGoals.includes('iron_cross')) {
    safetyWarnings.push('Iron cross requires extensive foundation work. Progress extremely slowly to protect tendons.')
  }
  
  // Add beginner straight-arm warning
  if (experienceLevel === 'beginner' && skillGoals.some(s => ['planche', 'front_lever', 'back_lever'].includes(s))) {
    safetyWarnings.push('Straight-arm skills require tendon conditioning. Build foundational strength before static holds.')
  }
  
  // Add back lever specific warning
  if (skillGoals.includes('back_lever')) {
    safetyWarnings.push('Back lever requires shoulder extension mobility. Ensure comfortable german hang before progressing.')
  }
  
  // Add weak point warnings
  if (weakPointAnalysis && weakPointAnalysis.overallReadiness < 50) {
    safetyWarnings.push('Current readiness suggests conservative progression. Focus on building foundation.')
  }
  
  return {
    sessionTemplate,
    applicablePrinciples,
    skillReadiness,
    enduranceProtocol,
    weakPointAnalysis,
    safetyWarnings,
  }
}

/**
 * Get all available skill progression systems
 */
export function getAllSkillProgressionSystems(): SkillProgressionSystem[] {
  return Object.values(SKILL_PROGRESSION_SYSTEMS)
}

/**
 * Get engine capability summary (for marketing/about pages)
 */
export function getEngineCapabilitySummary(): string[] {
  return [
    'Progress timeline predictions based on training data',
    'Weak point identification and timeline impact analysis',
    'Adaptive skill coaching based on readiness assessment',
    'Weighted calisthenics and streetlifting programming',
    'Conservative tendon protection for straight-arm skills',
    'Fatigue-aware session structure',
    'Military and tactical fitness test preparation',
    'Intelligent exercise sequencing',
    'Endurance and work capacity protocols',
    'Skill frequency optimization',
    'One-arm pull-up progression system',
    'Weighted pull-up strength programming',
    'Pull-up endurance and max-rep protocols',
    'Pull-specific weak point detection and correction',
    'Periodized training cycles (skill, strength, hypertrophy, endurance)',
    'Intelligent cycle selection based on goals',
    'Phase transition recommendations',
    'Deload and peaking protocols',
    'Back lever progression system with mobility gates',
  ]
}
