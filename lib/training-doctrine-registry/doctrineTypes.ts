/**
 * Training Doctrine Registry - Type Definitions
 * 
 * PURPOSE:
 * Defines types for structured calisthenics training philosophies and methodology principles.
 * These types represent doctrine profiles that inform AI engine decisions without replacing
 * existing systems like the Coaching Framework Engine.
 * 
 * HOW TO USE:
 * - Doctrine profiles are referenced by engines to understand training philosophy
 * - Each doctrine represents a methodology style, not a specific program
 * - Attributes are machine-readable for programmatic interpretation
 */

// =============================================================================
// DOCTRINE CATEGORIES
// =============================================================================

export type DoctrineCategory =
  | 'static_strength'      // Focus on isometric holds and static positions
  | 'dynamic_strength'     // Focus on movement-based strength
  | 'hybrid_strength'      // Balanced static and dynamic work
  | 'endurance_density'    // High volume, conditioning emphasis
  | 'skill_acquisition'    // Motor learning and technique focus
  | 'strength_conversion'  // Transfer strength to skills

// =============================================================================
// TRAINING STYLE BIAS
// =============================================================================

export type TrainingStyleBias =
  | 'static_emphasis'      // Prioritize holds and isometrics
  | 'dynamic_emphasis'     // Prioritize movements and reps
  | 'hybrid_emphasis'      // Balance both approaches
  | 'explosive_emphasis'   // Focus on power and speed

// =============================================================================
// VOLUME PROFILES
// =============================================================================

export type VolumeProfile =
  | 'low_volume_high_intensity'    // Few sets, heavy loads
  | 'moderate_volume'              // Balanced approach
  | 'high_volume_moderate_intensity' // More sets, moderate loads
  | 'density_training'             // Compressed rest, high work capacity

// =============================================================================
// INTENSITY PROFILES
// =============================================================================

export type IntensityProfile =
  | 'submaximal'           // 60-75% effort, technique focus
  | 'moderate'             // 75-85% effort, balanced
  | 'high'                 // 85-95% effort, strength gains
  | 'maximal'              // 95-100% effort, peak performance
  | 'autoregulated'        // Varies based on daily readiness

// =============================================================================
// SKILL FREQUENCY PROFILES
// =============================================================================

export type SkillFrequencyProfile =
  | 'low_frequency'        // 1-2x per week per skill
  | 'moderate_frequency'   // 2-3x per week per skill
  | 'high_frequency'       // 3-5x per week per skill
  | 'greasing_groove'      // Daily sub-maximal exposure

// =============================================================================
// PROGRESSION PHILOSOPHY
// =============================================================================

export type ProgressionPhilosophy =
  | 'linear'               // Consistent incremental progress
  | 'undulating'           // Wave loading / variation
  | 'step_loading'         // Build then deload
  | 'autoregulated'        // Progress based on readiness
  | 'block_periodization'  // Phase-based progression

// =============================================================================
// MOVEMENT BIAS TENDENCY
// =============================================================================

export type MovementBiasTendency =
  | 'pull_emphasis'        // Prioritize pulling patterns
  | 'push_emphasis'        // Prioritize pushing patterns
  | 'balanced'             // Equal emphasis
  | 'compression_emphasis' // Prioritize compression/core
  | 'skill_specific'       // Follows primary skill target

// =============================================================================
// PRIMARY FOCUS AREAS
// =============================================================================

export type PrimaryFocus =
  | 'planche_development'
  | 'front_lever_development'
  | 'back_lever_development'
  | 'handstand_mastery'
  | 'muscle_up_progression'
  | 'weighted_calisthenics'
  | 'ring_strength'
  | 'full_body_calisthenics'
  | 'skill_variety'
  | 'general_strength'

// =============================================================================
// PREFERRED STRUCTURES
// =============================================================================

export type PreferredStructure =
  | 'static_hold_blocks'        // Focused isometric hold work
  | 'weighted_strength_sets'    // Heavy weighted exercise sets
  | 'density_blocks'            // Compressed rest circuit work
  | 'full_body_sessions'        // Integrated full body training
  | 'ring_support_progressions' // Ring stability and support work
  | 'skill_specific_blocks'     // Dedicated skill practice blocks
  | 'pyramid_ladders'           // Volume accumulation structures
  | 'emom_blocks'               // Every minute on the minute work
  | 'superset_pairings'         // Paired exercise structures
  | 'wave_loading'              // Intensity wave patterns
  | 'straight_arm_blocks'       // Dedicated straight-arm work
  | 'bent_arm_blocks'           // Dedicated bent-arm work
  | 'prehab_mobility_blocks'    // Prep and mobility focused work

// =============================================================================
// ADVANCED APPLICABILITY
// =============================================================================

export type AdvancedApplicability =
  | 'beginner_only'             // Only suitable for beginners
  | 'beginner_intermediate'     // Beginners through intermediate
  | 'intermediate_advanced'     // Intermediate through advanced
  | 'advanced_only'             // Only for advanced athletes
  | 'all_levels'                // Scalable to any level

// =============================================================================
// TRAINING DOCTRINE MODEL
// =============================================================================

export interface TrainingDoctrine {
  /** Unique identifier for the doctrine */
  doctrineId: string
  
  /** Human-readable name */
  name: string
  
  /** Display name for UI (optional, falls back to name) */
  displayName?: string
  
  /** Short description of the methodology */
  description: string
  
  /** One-line summary of the doctrine */
  summary: string
  
  /** Category classification */
  category: DoctrineCategory
  
  /** Primary skill or strength focus */
  primaryFocus: PrimaryFocus[]
  
  /** Static vs dynamic vs hybrid emphasis */
  trainingStyleBias: TrainingStyleBias
  
  /** How often skills are trained */
  skillFrequencyProfile: SkillFrequencyProfile
  
  /** Volume approach */
  volumeProfile: VolumeProfile
  
  /** Intensity approach */
  intensityProfile: IntensityProfile
  
  /** How progression is structured */
  progressionPhilosophy: ProgressionPhilosophy
  
  /** Safety considerations */
  safetyNotes: string[]
  
  /** Natural movement bias tendency */
  movementBiasTendency: MovementBiasTendency
  
  /** Compatible coaching framework IDs */
  compatibleFrameworks: string[]
  
  /** Best suited athlete profiles */
  bestFor: string[]
  
  /** Not recommended scenarios */
  notRecommendedFor: string[]
  
  /** Key principles of this doctrine */
  keyPrinciples: string[]
  
  /** Specific use cases where this doctrine excels */
  bestUseCases: string[]
  
  /** Conditions where this doctrine should be avoided */
  avoidWhen: string[]
  
  /** Preferred session/block structures */
  preferredStructures: PreferredStructure[]
  
  /** What skill levels this doctrine applies to */
  advancedApplicability: AdvancedApplicability
}

// =============================================================================
// DOCTRINE QUERY TYPES
// =============================================================================

export interface DoctrineQueryFilters {
  category?: DoctrineCategory
  primaryFocus?: PrimaryFocus
  trainingStyleBias?: TrainingStyleBias
  volumeProfile?: VolumeProfile
  skillFrequencyProfile?: SkillFrequencyProfile
}

export interface DoctrineAttributes {
  doctrineId: string
  category: DoctrineCategory
  trainingStyleBias: TrainingStyleBias
  volumeProfile: VolumeProfile
  intensityProfile: IntensityProfile
  skillFrequencyProfile: SkillFrequencyProfile
  progressionPhilosophy: ProgressionPhilosophy
  movementBiasTendency: MovementBiasTendency
}
