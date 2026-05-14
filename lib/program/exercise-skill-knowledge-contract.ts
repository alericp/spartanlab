/**
 * EXERCISE & SKILL KNOWLEDGE CONTRACT — MASTER-8B.2
 *
 * =============================================================================
 * MAX-INTENT EXERCISE AND SKILL KNOWLEDGE FOUNDATION
 * =============================================================================
 *
 * This module defines the typed contract for exercise and skill knowledge that
 * future Program Balance, Adaptive Foundation, Coach Recs, Plan Logic, Method
 * Decisions, future-session mutation, and live workout guidance can consume.
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, JSON-safe, side-effect free
 *   - No localStorage, no Date.now, no React imports
 *   - No database calls, no route calls, no generator imports
 *   - No UI imports, no `as any`, no `@ts-ignore`
 *   - No mutation functions
 *   - Type-only imports from existing source files where helpful
 *
 * This is STRUCTURE, not behavior. The generator is NOT wired here.
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.2
 */

// =============================================================================
// IDENTITY / TAXONOMY TYPES
// =============================================================================

/** Canonical exercise ID - matches IDs in adaptive-exercise-pool.ts */
export type KnowledgeExerciseId = string

/** Canonical skill ID - matches IDs in skills.ts / skill-progression-rules.ts */
export type KnowledgeSkillId = string

/**
 * Source kind for knowledge entries - indicates where the data came from
 * and how authoritative it is.
 */
export type ExerciseKnowledgeSourceKind =
  | 'existing_pool'           // From adaptive-exercise-pool.ts
  | 'classification_registry' // From movement-family-registry.ts
  | 'doctrine_db'             // From doctrine DB source batches
  | 'progression_graph'       // From skill progression graphs
  | 'live_runtime_unit_truth' // From workout runtime/unit truth resolution
  | 'coach_authored_seed'     // Manual expert-authored knowledge seed
  | 'future_research_backfill' // Placeholder for future research

/**
 * Exercise modality - how the exercise is performed
 */
export type ExerciseModality =
  | 'dynamic_reps'    // Standard rep-based movement
  | 'static_hold'     // Isometric hold (seconds)
  | 'eccentric'       // Controlled negative
  | 'assisted'        // Band/machine assisted
  | 'weighted'        // External load added
  | 'banded'          // Band resistance (not assistance)
  | 'unilateral'      // One side at a time
  | 'skill_drill'     // Technical practice
  | 'mobility'        // Range of motion work
  | 'warmup'          // Preparation work
  | 'cooldown'        // Recovery work
  | 'prehab'          // Injury prevention
  | 'mixed'           // Multiple modalities

/**
 * Prescription unit truth - what unit should be used for this exercise
 * CRITICAL: Prevents "hold labeled as pushup" and "dynamic labeled as hold" errors
 */
export type PrescriptionUnitTruth =
  | 'reps'      // Count repetitions
  | 'seconds'   // Time under tension (holds)
  | 'load'      // Weight-based (kg/lbs)
  | 'distance'  // Distance-based
  | 'rounds'    // Round-based (circuits)
  | 'mixed'     // Multiple units possible with explicit rules
  | 'unknown'   // Needs resolution

/**
 * Taxonomy warnings for exercises with ambiguous classification
 */
export type ExerciseTaxonomyWarning =
  | 'name_unit_conflict'           // Name suggests different unit than actual
  | 'hold_labeled_as_pushup'       // Static hold named as dynamic exercise
  | 'dynamic_labeled_as_hold'      // Dynamic exercise named as hold
  | 'band_display_uncertain'       // Band assistance/resistance display unclear
  | 'weighted_and_banded_conflict' // Both weighted and banded with conflicting rules
  | 'progression_identity_uncertain' // Unclear where in progression ladder
  | 'alias_requires_resolution'    // Multiple names need canonical resolution

// =============================================================================
// TRAINING PURPOSE TYPES
// =============================================================================

/**
 * Training purpose - primary intent of an exercise
 */
export type TrainingPurpose =
  | 'skill_acquisition'    // Learning and technique development
  | 'max_strength'         // 1-5 rep max strength
  | 'strength_support'     // Support strength work (6-10 reps)
  | 'hypertrophy_support'  // Muscle building (8-15 reps)
  | 'power'                // Explosive strength
  | 'endurance'            // Muscular endurance (15+ reps)
  | 'tendon_conditioning'  // Connective tissue adaptation
  | 'mobility'             // Range of motion
  | 'compression'          // Core compression strength
  | 'prehab'               // Injury prevention
  | 'warmup'               // Session preparation
  | 'cooldown'             // Session recovery
  | 'technique'            // Technical drill
  | 'recovery'             // Active recovery
  | 'calibration'          // Baseline testing

// =============================================================================
// SKILL RELATIONSHIP TYPES
// =============================================================================

/**
 * Skill transfer strength - how much an exercise contributes to a skill
 */
export type SkillTransferStrength =
  | 'direct_primary'     // Essential for skill (e.g., tuck planche for planche)
  | 'direct_secondary'   // Directly helpful (e.g., dips for planche)
  | 'indirect_support'   // Supporting role (e.g., core work for planche)
  | 'maintenance'        // Maintains but doesn't build
  | 'low'                // Minimal transfer
  | 'contraindicated'    // May interfere with skill

/**
 * Evidence level for skill transfer claims
 */
export type SkillTransferEvidenceLevel =
  | 'established_consensus' // Well-established in community/research
  | 'expert_opinion'        // Coach/expert consensus
  | 'anecdotal'             // Common observation
  | 'theoretical'           // Based on biomechanics
  | 'unknown'               // Needs verification

/**
 * Skill transfer profile - how an exercise transfers to a specific skill
 */
export interface SkillTransferProfile {
  readonly skillId: KnowledgeSkillId
  readonly transferStrength: SkillTransferStrength
  readonly rationale: string
  readonly supportedByEvidenceLevel: SkillTransferEvidenceLevel
  readonly futureScoringWeight: number // 0-100 for weighted scoring later
}

// =============================================================================
// MOVEMENT BALANCE TYPES
// =============================================================================

/**
 * Movement balance family - for program balance detection
 * More specific than MovementFamily to enable precise balance checks
 */
export type MovementBalanceFamily =
  // Pull patterns
  | 'vertical_pull'        // Pull-ups, chin-ups
  | 'horizontal_pull'      // Rows, front lever pulls
  | 'explosive_pull'       // Muscle-up transition, explosive pulls
  | 'straight_arm_pull'    // Front lever holds, ice cream makers
  // Push patterns
  | 'vertical_push'        // HSPU, pike push-ups
  | 'horizontal_push'      // Push-ups, planche work
  | 'explosive_push'       // Clap push-ups
  | 'straight_arm_push'    // Planche holds
  | 'bent_arm_push'        // Standard push-ups, dips
  | 'dip_pattern'          // Dips, straight bar dips
  // Core patterns
  | 'compression_core'     // L-sit, V-sit, leg raises
  | 'anti_extension_core'  // Planks, ab wheel, hollow body
  | 'anti_rotation_core'   // Pallof press, side planks
  // Support patterns
  | 'posterior_chain'      // Back extensions, hip hinges
  | 'scapular_control'     // Scap pulls, scap push-ups
  | 'grip'                 // Hangs, grip work
  | 'mobility'             // Stretches, mobility drills
  | 'prehab_joint'         // Joint prep, prehab
  | 'lower_body'           // Squats, lunges
  | 'transition'           // Muscle-up, skin the cat

// =============================================================================
// TISSUE / STRESS TYPES
// =============================================================================

/**
 * Tissue stress regions - body areas affected by exercise stress
 */
export type TissueStressRegion =
  | 'wrist'
  | 'elbow'
  | 'biceps_tendon'
  | 'triceps_tendon'
  | 'shoulder_anterior'
  | 'shoulder_general'
  | 'scapular_tendon'
  | 'pec_tendon'
  | 'lat'
  | 'forearm_grip'
  | 'core_abdominal'
  | 'hip_flexor'
  | 'lower_back'
  | 'knee'
  | 'ankle'

/**
 * Stress magnitude levels
 */
export type StressMagnitude =
  | 'none'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'

/**
 * Safeguard tags for tissue protection
 */
export type SafeguardTag =
  | 'wrist_prep_required'
  | 'elbow_warmup_required'
  | 'shoulder_activation_required'
  | 'bicep_tendon_caution'
  | 'tricep_tendon_caution'
  | 'pec_insertion_caution'
  | 'grip_fatigue_aware'
  | 'hip_flexor_prep'
  | 'lower_back_brace'
  | 'progression_gate_required'
  | 'frequency_limit_recommended'
  | 'intensity_cap_recommended'

/**
 * Tissue stress profile for an exercise
 */
export interface TissueStressProfile {
  readonly region: TissueStressRegion
  readonly magnitude: StressMagnitude
  readonly accumulationRisk: 'low' | 'moderate' | 'high' // How quickly stress accumulates
  readonly spacingNeed: number // Recommended days between hard exposures
  readonly notes: string
  readonly safeguardTags: readonly SafeguardTag[]
}

// =============================================================================
// FREQUENCY AND COST TYPES
// =============================================================================

/**
 * Frequency tolerance - how often an exercise can be trained
 */
export type FrequencyTolerance =
  | 'high_frequency_microdose'  // Daily skill practice OK
  | 'frequent_low_intensity'   // 4-6x/week at low intensity
  | 'moderate_frequency'       // 2-4x/week
  | 'limited_high_intensity'   // 2-3x/week max with intensity
  | 'low_frequency_high_stress' // 1-2x/week (heavy weighted, high stress)
  | 'recovery_dependent'       // Frequency depends on evidence

/**
 * Failure risk level
 */
export type FailureRiskLevel = 'low' | 'moderate' | 'high' | 'very_high'

/**
 * Training cost profile - fatigue and recovery cost of an exercise
 */
export interface TrainingCostProfile {
  readonly neuralCost: 1 | 2 | 3 | 4 | 5      // Neural/skill demand
  readonly localMuscleCost: 1 | 2 | 3 | 4 | 5 // Local muscle fatigue
  readonly systemicFatigueCost: 1 | 2 | 3 | 4 | 5 // Whole-body fatigue
  readonly tendonCost: 1 | 2 | 3 | 4 | 5      // Connective tissue stress
  readonly jointCost: 1 | 2 | 3 | 4 | 5       // Joint stress
  readonly failureRisk: FailureRiskLevel
  readonly recommendedHardExposureSpacingDays: number
  readonly microdoseAllowed: boolean
  readonly failureAllowed: boolean
  readonly reason: string
}

// =============================================================================
// METHOD COMPATIBILITY TYPES
// =============================================================================

/**
 * Knowledge method IDs - training methods that exercises can be compatible with
 * Matches method keys from method-override-planner
 */
export type KnowledgeMethodId =
  | 'straight_sets'
  | 'supersets'
  | 'circuits'
  | 'density_blocks'
  | 'drop_sets'
  | 'rest_pause'
  | 'top_set_backoff'
  | 'cluster_sets'
  | 'endurance_conditioning'

/**
 * Method compatibility verdict
 */
export type MethodCompatibilityVerdict =
  | 'preferred'  // Excellent fit
  | 'allowed'    // Works well
  | 'caution'    // Can work but needs care
  | 'avoid'      // Not recommended
  | 'blocked'    // Do not use

/**
 * Method compatibility profile
 */
export interface MethodCompatibilityProfile {
  readonly methodId: KnowledgeMethodId
  readonly verdict: MethodCompatibilityVerdict
  readonly rationale: string
  readonly blockedWhen: string | null // Conditions that block this method
  readonly saferAlternative: KnowledgeMethodId | null
}

// =============================================================================
// PROGRESSION / REGRESSION TYPES
// =============================================================================

/**
 * Progression relationship kind
 */
export type ProgressionRelationshipKind =
  | 'regression'       // Easier version
  | 'progression'      // Harder version
  | 'lateral_substitute' // Same difficulty, different angle
  | 'prerequisite'     // Must master before this
  | 'support_anchor'   // Supporting exercise for main lift
  | 'calibration_test' // Used to test readiness

/**
 * Progression relationship
 */
export interface ProgressionRelationship {
  readonly relatedExerciseId: KnowledgeExerciseId
  readonly kind: ProgressionRelationshipKind
  readonly rationale: string
  readonly readinessSignal: string | null // What indicates readiness
}

// =============================================================================
// WARM-UP / COOLDOWN TYPES
// =============================================================================

/**
 * Warm-up need profile
 */
export interface WarmupNeedProfile {
  readonly jointPrep: readonly TissueStressRegion[]
  readonly activation: readonly string[] // Muscle groups
  readonly rampUpNeeded: boolean
  readonly skillSpecificPrep: string | null
  readonly tissuePrep: readonly TissueStressRegion[]
  readonly suggestedTags: readonly string[]
}

/**
 * Cooldown need profile
 */
export interface CooldownNeedProfile {
  readonly mobilityTargets: readonly TissueStressRegion[]
  readonly downregulationNeed: 'low' | 'moderate' | 'high'
  readonly tissueRecoveryTargets: readonly TissueStressRegion[]
  readonly suggestedTags: readonly string[]
}

// =============================================================================
// USER GATING TYPES
// =============================================================================

/**
 * User ability gate - requirements for safely using an exercise
 */
export interface UserAbilityGate {
  readonly gateId: string
  readonly description: string
  readonly appliesToSkillIds: readonly KnowledgeSkillId[]
  readonly minimumSignals: readonly string[]  // What user must have demonstrated
  readonly cautionSignals: readonly string[]  // Signals to proceed with caution
  readonly blockedSignals: readonly string[]  // Signals that block this exercise
  readonly fallbackExerciseIds: readonly KnowledgeExerciseId[]
}

// =============================================================================
// CONFIDENCE LEVEL
// =============================================================================

/**
 * Confidence level for knowledge entries
 */
export type KnowledgeConfidenceLevel =
  | 'high'     // Well-established, verified
  | 'medium'   // Reasonable confidence, some uncertainty
  | 'low'      // Provisional, needs verification
  | 'seed'     // Initial seed data, needs backfill

// =============================================================================
// MAIN EXERCISE KNOWLEDGE ENTRY
// =============================================================================

/**
 * Complete exercise knowledge entry
 * This is the max-intent schema for exercise intelligence
 */
export interface ExerciseSkillKnowledgeEntry {
  // Identity
  readonly exerciseId: KnowledgeExerciseId
  readonly canonicalName: string
  readonly aliases: readonly string[]
  readonly sourceKinds: readonly ExerciseKnowledgeSourceKind[]
  readonly confidence: KnowledgeConfidenceLevel

  // Taxonomy
  readonly modalities: readonly ExerciseModality[]
  readonly prescriptionUnit: PrescriptionUnitTruth
  readonly movementFamilies: readonly MovementBalanceFamily[]
  readonly trainingPurposes: readonly TrainingPurpose[]

  // Skill relationships
  readonly skillTransfers: readonly SkillTransferProfile[]

  // Tissue/stress
  readonly primaryStressRegions: readonly TissueStressRegion[]
  readonly tissueStressProfile: readonly TissueStressProfile[]

  // Frequency and cost
  readonly frequencyTolerance: FrequencyTolerance
  readonly trainingCost: TrainingCostProfile

  // Method compatibility
  readonly methodCompatibility: readonly MethodCompatibilityProfile[]

  // Progression
  readonly progressionRelationships: readonly ProgressionRelationship[]

  // Warm-up/cooldown
  readonly warmupNeeds: WarmupNeedProfile
  readonly cooldownNeeds: CooldownNeedProfile

  // User gating
  readonly userAbilityGates: readonly UserAbilityGate[]

  // Equipment
  readonly equipmentRequired: readonly string[]
  readonly equipmentOptional: readonly string[]

  // Special flags
  readonly weightedStrengthAnchor: boolean // Is this a weighted anchor exercise?
  readonly bandAssistanceSupported: boolean
  readonly isIsometric: boolean

  // Documentation
  readonly notesForFutureScoring: string
  readonly forbiddenInterpretations: readonly string[]
  readonly knownTaxonomyWarnings: readonly ExerciseTaxonomyWarning[]
  readonly futureResearchSlots: readonly string[]
}

// =============================================================================
// SKILL KNOWLEDGE ENTRY
// =============================================================================

/**
 * Balance requirement for a skill
 */
export interface SkillBalanceRequirement {
  readonly balanceFamily: MovementBalanceFamily
  readonly importance: 'critical' | 'important' | 'supportive'
  readonly rationale: string
}

/**
 * Complete skill knowledge entry
 */
export interface SkillKnowledgeEntry {
  readonly skillId: KnowledgeSkillId
  readonly canonicalName: string
  readonly aliases: readonly string[]
  readonly skillFamily: 'push' | 'pull' | 'transition' | 'compression' | 'flexibility'

  // Movement classification
  readonly primaryMovementFamilies: readonly MovementBalanceFamily[]
  readonly supportMovementFamilies: readonly MovementBalanceFamily[]

  // Exercise relationships
  readonly highValueExerciseIds: readonly KnowledgeExerciseId[]
  readonly maintenanceExerciseIds: readonly KnowledgeExerciseId[]
  readonly microdoseExerciseIds: readonly KnowledgeExerciseId[]

  // Risk and management
  readonly commonOveruseRisks: readonly TissueStressRegion[]
  readonly frequencyDoctrine: FrequencyTolerance

  // Progression signals
  readonly progressionSignals: readonly string[]
  readonly regressionSignals: readonly string[]

  // Session needs
  readonly warmupPriorities: readonly TissueStressRegion[]
  readonly cooldownPriorities: readonly TissueStressRegion[]

  // Balance requirements
  readonly programBalanceRequirements: readonly SkillBalanceRequirement[]

  // Documentation
  readonly notesForFutureScoring: string
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Validation severity levels
 */
export type KnowledgeValidationSeverity = 'error' | 'warning' | 'info'

/**
 * Validation issue
 */
export interface KnowledgeValidationIssue {
  readonly severity: KnowledgeValidationSeverity
  readonly code: string
  readonly message: string
  readonly affectedId: string | null
  readonly affectedField: string | null
}

/**
 * Validation result for the knowledge seed
 */
export interface ExerciseSkillKnowledgeValidationResult {
  readonly ok: boolean
  readonly issueCount: number
  readonly warningCount: number
  readonly seededExerciseCount: number
  readonly seededSkillCount: number
  readonly issues: readonly KnowledgeValidationIssue[]
  readonly missingCriticalExerciseConcepts: readonly string[]
  readonly missingCriticalSkillConcepts: readonly string[]
  readonly taxonomyWarnings: readonly ExerciseTaxonomyWarning[]
  readonly nextRecommendedStep: string
}

/**
 * Coverage summary
 */
export interface KnowledgeCoverageSummary {
  readonly totalExercises: number
  readonly totalSkills: number
  readonly exercisesWithFullProfiles: number
  readonly exercisesWithMethodCompatibility: number
  readonly exercisesWithTissueStress: number
  readonly exercisesWithProgressionPaths: number
  readonly skillsWithBalanceRequirements: number
  readonly weightedAnchorCount: number
  readonly taxonomyWarningCount: number
}
