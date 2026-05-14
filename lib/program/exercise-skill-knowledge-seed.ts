/**
 * EXERCISE & SKILL KNOWLEDGE SEED — MASTER-8B.2
 *
 * =============================================================================
 * MAX-INTENT EXERCISE AND SKILL KNOWLEDGE SEED DATA
 * =============================================================================
 *
 * This module provides the initial seed data for exercise and skill knowledge.
 * It uses ACTUAL exercise IDs from adaptive-exercise-pool.ts to ensure compatibility.
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, JSON-safe, side-effect free
 *   - No React imports, no UI imports, no generator imports
 *   - Exercise IDs match existing adaptive-exercise-pool.ts
 *   - Skill IDs match existing skills.ts / skill-progression-rules.ts
 *   - This is SEED data - not exhaustive coverage
 *   - No runtime mutation
 *
 * CRITICAL TAXONOMY HANDLING:
 *   - Planche Lean is explicitly marked as isometric (seconds)
 *   - Planche Lean Push-Up / Pseudo Planche Push-Up is dynamic (reps)
 *   - Weighted Pull-Up and Weighted Dip are marked as strength anchors
 *   - Taxonomy warnings flag any ambiguous exercises
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.2
 */

import type {
  ExerciseSkillKnowledgeEntry,
  SkillKnowledgeEntry,
  KnowledgeMethodId,
  MethodCompatibilityProfile,
  TissueStressProfile,
  TrainingCostProfile,
  WarmupNeedProfile,
  CooldownNeedProfile,
  SkillTransferProfile,
  ProgressionRelationship,
  MovementBalanceFamily,
} from './exercise-skill-knowledge-contract'

// =============================================================================
// HELPER FACTORIES FOR COMMON PATTERNS
// =============================================================================

/**
 * Creates a standard straight_sets allowed compatibility profile
 */
function straightSetsAllowed(rationale = 'Standard rep scheme works well'): MethodCompatibilityProfile {
  return {
    methodId: 'straight_sets',
    verdict: 'preferred',
    rationale,
    blockedWhen: null,
    saferAlternative: null,
  }
}

/**
 * Creates method compatibility for skill work (usually straight sets preferred)
 */
function skillMethodCompatibility(): readonly MethodCompatibilityProfile[] {
  return [
    straightSetsAllowed('Skill work benefits from focused sets with full recovery'),
    { methodId: 'cluster_sets', verdict: 'allowed', rationale: 'Can help with high-quality skill reps', blockedWhen: null, saferAlternative: null },
    { methodId: 'supersets', verdict: 'caution', rationale: 'May interfere with skill quality', blockedWhen: 'With fatiguing exercises', saferAlternative: 'straight_sets' },
    { methodId: 'circuits', verdict: 'avoid', rationale: 'Skill work needs rest between sets', blockedWhen: null, saferAlternative: 'straight_sets' },
    { methodId: 'density_blocks', verdict: 'avoid', rationale: 'Fatigue compromises skill quality', blockedWhen: null, saferAlternative: 'straight_sets' },
    { methodId: 'drop_sets', verdict: 'blocked', rationale: 'Cannot safely regress mid-set on skill work', blockedWhen: null, saferAlternative: null },
    { methodId: 'rest_pause', verdict: 'caution', rationale: 'Brief rest may work for advanced athletes', blockedWhen: 'For beginners', saferAlternative: 'straight_sets' },
    { methodId: 'top_set_backoff', verdict: 'allowed', rationale: 'Good for building volume after peak set', blockedWhen: null, saferAlternative: null },
    { methodId: 'endurance_conditioning', verdict: 'avoid', rationale: 'Skill work is not endurance focused', blockedWhen: null, saferAlternative: 'straight_sets' },
  ]
}

/**
 * Creates method compatibility for weighted strength work
 */
function weightedStrengthMethodCompatibility(): readonly MethodCompatibilityProfile[] {
  return [
    straightSetsAllowed('Heavy weighted work benefits from full recovery'),
    { methodId: 'cluster_sets', verdict: 'preferred', rationale: 'Excellent for heavy weighted work', blockedWhen: null, saferAlternative: null },
    { methodId: 'top_set_backoff', verdict: 'preferred', rationale: 'Classic strength protocol', blockedWhen: null, saferAlternative: null },
    { methodId: 'rest_pause', verdict: 'allowed', rationale: 'Can extend volume at given intensity', blockedWhen: null, saferAlternative: null },
    { methodId: 'supersets', verdict: 'allowed', rationale: 'Antagonist supersets can work', blockedWhen: 'With competing movements', saferAlternative: 'straight_sets' },
    { methodId: 'drop_sets', verdict: 'caution', rationale: 'Mechanical dropsets to bodyweight', blockedWhen: 'For max strength focus', saferAlternative: 'top_set_backoff' },
    { methodId: 'circuits', verdict: 'avoid', rationale: 'Heavy work needs dedicated recovery', blockedWhen: null, saferAlternative: 'straight_sets' },
    { methodId: 'density_blocks', verdict: 'avoid', rationale: 'Quality over quantity for strength', blockedWhen: null, saferAlternative: 'straight_sets' },
    { methodId: 'endurance_conditioning', verdict: 'avoid', rationale: 'Weighted strength is not endurance', blockedWhen: null, saferAlternative: 'straight_sets' },
  ]
}

/**
 * Standard warmup needs for upper body push
 */
function upperPushWarmupNeeds(): WarmupNeedProfile {
  return {
    jointPrep: ['wrist', 'shoulder_anterior', 'elbow'],
    activation: ['chest', 'triceps', 'anterior_deltoid'],
    rampUpNeeded: true,
    skillSpecificPrep: null,
    tissuePrep: ['pec_tendon', 'triceps_tendon'],
    suggestedTags: ['wrist_circles', 'shoulder_circles', 'push_up_prep'],
  }
}

/**
 * Standard warmup needs for upper body pull
 */
function upperPullWarmupNeeds(): WarmupNeedProfile {
  return {
    jointPrep: ['shoulder_general', 'elbow'],
    activation: ['lats', 'biceps', 'rhomboids'],
    rampUpNeeded: true,
    skillSpecificPrep: null,
    tissuePrep: ['biceps_tendon', 'lat'],
    suggestedTags: ['scap_pulls', 'arm_circles', 'hang_prep'],
  }
}

/**
 * Standard cooldown for upper body
 */
function upperBodyCooldownNeeds(): CooldownNeedProfile {
  return {
    mobilityTargets: ['shoulder_general', 'elbow', 'wrist'],
    downregulationNeed: 'moderate',
    tissueRecoveryTargets: ['shoulder_general', 'elbow'],
    suggestedTags: ['shoulder_stretch', 'tricep_stretch', 'lat_stretch'],
  }
}

// =============================================================================
// EXERCISE KNOWLEDGE SEED DATA
// =============================================================================

/**
 * Seeded exercise knowledge entries
 * Uses ACTUAL IDs from adaptive-exercise-pool.ts
 */
export const EXERCISE_SKILL_KNOWLEDGE_SEED: readonly ExerciseSkillKnowledgeEntry[] = [
  // ===========================================================================
  // WEIGHTED STRENGTH ANCHORS - Critical for balanced programming
  // ===========================================================================
  {
    exerciseId: 'weighted_pull_up',
    canonicalName: 'Weighted Pull-Up',
    aliases: ['Weighted Chin-Up', 'Belt Pull-Up'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['weighted', 'dynamic_reps'],
    prescriptionUnit: 'reps',
    movementFamilies: ['vertical_pull'],
    trainingPurposes: ['max_strength', 'strength_support'],
    skillTransfers: [
      { skillId: 'one_arm_pull_up', transferStrength: 'direct_primary', rationale: 'Builds pulling strength needed for OAPU', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 90 },
      { skillId: 'front_lever', transferStrength: 'direct_secondary', rationale: 'Strengthens lats for FL pulling', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 70 },
      { skillId: 'muscle_up', transferStrength: 'direct_secondary', rationale: 'Builds explosive pull foundation', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 75 },
    ],
    primaryStressRegions: ['biceps_tendon', 'shoulder_general', 'forearm_grip'],
    tissueStressProfile: [
      { region: 'biceps_tendon', magnitude: 'high', accumulationRisk: 'high', spacingNeed: 2, notes: 'Heavy weighted pulling stresses biceps tendon', safeguardTags: ['bicep_tendon_caution'] },
      { region: 'shoulder_general', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 2, notes: 'Loaded shoulder extension', safeguardTags: ['shoulder_activation_required'] },
      { region: 'forearm_grip', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 1, notes: 'Grip demand with added weight', safeguardTags: ['grip_fatigue_aware'] },
    ],
    frequencyTolerance: 'limited_high_intensity',
    trainingCost: {
      neuralCost: 4,
      localMuscleCost: 4,
      systemicFatigueCost: 4,
      tendonCost: 4,
      jointCost: 3,
      failureRisk: 'moderate',
      recommendedHardExposureSpacingDays: 3,
      microdoseAllowed: false,
      failureAllowed: false,
      reason: 'Heavy weighted pulling requires significant recovery; failure risks tendon stress',
    },
    methodCompatibility: weightedStrengthMethodCompatibility(),
    progressionRelationships: [
      { relatedExerciseId: 'pull_up', kind: 'regression', rationale: 'Bodyweight version', readinessSignal: null },
      { relatedExerciseId: 'chest_to_bar_pull_up', kind: 'progression', rationale: 'Extended ROM pull', readinessSignal: 'Can do 10+ strict pull-ups' },
      { relatedExerciseId: 'archer_pull_up', kind: 'lateral_substitute', rationale: 'Unilateral emphasis without weight', readinessSignal: null },
    ],
    warmupNeeds: upperPullWarmupNeeds(),
    cooldownNeeds: upperBodyCooldownNeeds(),
    userAbilityGates: [
      {
        gateId: 'weighted_pull_baseline',
        description: 'Must have solid bodyweight pull-up proficiency before adding weight',
        appliesToSkillIds: ['one_arm_pull_up', 'muscle_up', 'front_lever'],
        minimumSignals: ['10+ strict pull-ups', 'no shoulder pain'],
        cautionSignals: ['recent elbow issue', 'grip weakness'],
        blockedSignals: ['active shoulder injury', 'elbow tendinitis'],
        fallbackExerciseIds: ['pull_up', 'chest_to_bar_pull_up'],
      },
    ],
    equipmentRequired: ['pull_bar', 'dip_belt'],
    equipmentOptional: ['weights'],
    weightedStrengthAnchor: true,
    bandAssistanceSupported: false,
    isIsometric: false,
    notesForFutureScoring: 'Weighted pull-up is a critical strength anchor; should be protected from accidental removal in balance logic',
    forbiddenInterpretations: ['Must not be treated as an isolation exercise', 'Must not be programmed daily'],
    knownTaxonomyWarnings: [],
    futureResearchSlots: ['Optimal loading progression', 'Tendon adaptation protocols'],
  },

  {
    exerciseId: 'weighted_dip',
    canonicalName: 'Weighted Dip',
    aliases: ['Belt Dip', 'Weighted Parallel Bar Dip'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['weighted', 'dynamic_reps'],
    prescriptionUnit: 'reps',
    movementFamilies: ['dip_pattern', 'vertical_push'],
    trainingPurposes: ['max_strength', 'strength_support'],
    skillTransfers: [
      { skillId: 'planche', transferStrength: 'direct_secondary', rationale: 'Builds pushing strength for planche', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 70 },
      { skillId: 'hspu', transferStrength: 'direct_secondary', rationale: 'Pressing strength transfers to HSPU', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 65 },
      { skillId: 'muscle_up', transferStrength: 'direct_secondary', rationale: 'Dip portion of muscle-up', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 75 },
    ],
    primaryStressRegions: ['shoulder_anterior', 'pec_tendon', 'triceps_tendon', 'elbow'],
    tissueStressProfile: [
      { region: 'shoulder_anterior', magnitude: 'high', accumulationRisk: 'high', spacingNeed: 2, notes: 'Heavy dips stress anterior shoulder', safeguardTags: ['shoulder_activation_required'] },
      { region: 'pec_tendon', magnitude: 'high', accumulationRisk: 'moderate', spacingNeed: 2, notes: 'Pec insertion under load at bottom', safeguardTags: ['pec_insertion_caution'] },
      { region: 'triceps_tendon', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 2, notes: 'Elbow extension under load', safeguardTags: ['elbow_warmup_required'] },
    ],
    frequencyTolerance: 'limited_high_intensity',
    trainingCost: {
      neuralCost: 4,
      localMuscleCost: 4,
      systemicFatigueCost: 4,
      tendonCost: 4,
      jointCost: 4,
      failureRisk: 'moderate',
      recommendedHardExposureSpacingDays: 3,
      microdoseAllowed: false,
      failureAllowed: false,
      reason: 'Heavy weighted dips require recovery; anterior shoulder stress is significant',
    },
    methodCompatibility: weightedStrengthMethodCompatibility(),
    progressionRelationships: [
      { relatedExerciseId: 'dip', kind: 'regression', rationale: 'Bodyweight version', readinessSignal: null },
      { relatedExerciseId: 'straight_bar_dip', kind: 'lateral_substitute', rationale: 'Different grip emphasis', readinessSignal: null },
    ],
    warmupNeeds: upperPushWarmupNeeds(),
    cooldownNeeds: upperBodyCooldownNeeds(),
    userAbilityGates: [
      {
        gateId: 'weighted_dip_baseline',
        description: 'Must have solid bodyweight dip proficiency before adding weight',
        appliesToSkillIds: ['planche', 'hspu', 'muscle_up'],
        minimumSignals: ['15+ strict dips', 'no shoulder pain'],
        cautionSignals: ['shoulder clicking', 'sternum discomfort'],
        blockedSignals: ['active shoulder injury', 'pec strain history'],
        fallbackExerciseIds: ['dip', 'push_up'],
      },
    ],
    equipmentRequired: ['dip_bars', 'dip_belt'],
    equipmentOptional: ['weights'],
    weightedStrengthAnchor: true,
    bandAssistanceSupported: false,
    isIsometric: false,
    notesForFutureScoring: 'Weighted dip is a critical push anchor; should be protected from accidental removal',
    forbiddenInterpretations: ['Must not be treated as an isolation exercise', 'Must not be programmed with high fatigue'],
    knownTaxonomyWarnings: [],
    futureResearchSlots: ['Optimal depth for joint health', 'ROM vs load tradeoffs'],
  },

  // ===========================================================================
  // PLANCHE PROGRESSIONS - Push skill family
  // ===========================================================================
  {
    exerciseId: 'planche_lean',
    canonicalName: 'Planche Lean',
    aliases: ['Planche Lean Hold', 'Lean Hold'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['static_hold', 'skill_drill'],
    prescriptionUnit: 'seconds', // CRITICAL: This is a HOLD, not reps
    movementFamilies: ['straight_arm_push', 'horizontal_push'],
    trainingPurposes: ['skill_acquisition', 'tendon_conditioning'],
    skillTransfers: [
      { skillId: 'planche', transferStrength: 'direct_primary', rationale: 'Foundation for planche lean angle', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 95 },
    ],
    primaryStressRegions: ['wrist', 'shoulder_anterior', 'elbow'],
    tissueStressProfile: [
      { region: 'wrist', magnitude: 'high', accumulationRisk: 'high', spacingNeed: 1, notes: 'Significant wrist extension load', safeguardTags: ['wrist_prep_required'] },
      { region: 'shoulder_anterior', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 1, notes: 'Protracted shoulder under load', safeguardTags: ['shoulder_activation_required'] },
      { region: 'biceps_tendon', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 1, notes: 'Straight-arm position loads biceps tendon', safeguardTags: ['bicep_tendon_caution'] },
    ],
    frequencyTolerance: 'high_frequency_microdose',
    trainingCost: {
      neuralCost: 4,
      localMuscleCost: 3,
      systemicFatigueCost: 2,
      tendonCost: 4,
      jointCost: 4,
      failureRisk: 'low',
      recommendedHardExposureSpacingDays: 1,
      microdoseAllowed: true,
      failureAllowed: false,
      reason: 'Skill work can be done frequently with controlled intensity',
    },
    methodCompatibility: skillMethodCompatibility(),
    progressionRelationships: [
      { relatedExerciseId: 'tuck_planche', kind: 'progression', rationale: 'Next planche progression', readinessSignal: '30s+ lean with good form' },
      { relatedExerciseId: 'tuck_planche_pushup', kind: 'lateral_substitute', rationale: 'Dynamic planche pattern', readinessSignal: null },
    ],
    warmupNeeds: {
      ...upperPushWarmupNeeds(),
      jointPrep: ['wrist', 'shoulder_anterior', 'elbow'],
      skillSpecificPrep: 'Wrist circles, planche leans with reduced angle',
    },
    cooldownNeeds: {
      mobilityTargets: ['wrist', 'shoulder_anterior'],
      downregulationNeed: 'moderate',
      tissueRecoveryTargets: ['wrist', 'shoulder_anterior'],
      suggestedTags: ['wrist_stretch', 'shoulder_stretch'],
    },
    userAbilityGates: [],
    equipmentRequired: ['floor'],
    equipmentOptional: ['parallettes'],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: false,
    isIsometric: true,
    notesForFutureScoring: 'Planche lean is a HOLD - must use seconds, not reps',
    forbiddenInterpretations: ['Must NOT be displayed as a push-up variant', 'Must NOT use rep counts'],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  {
    exerciseId: 'tuck_planche',
    canonicalName: 'Tuck Planche',
    aliases: ['Tuck Planche Hold'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['static_hold', 'skill_drill'],
    prescriptionUnit: 'seconds',
    movementFamilies: ['straight_arm_push', 'horizontal_push'],
    trainingPurposes: ['skill_acquisition', 'max_strength', 'tendon_conditioning'],
    skillTransfers: [
      { skillId: 'planche', transferStrength: 'direct_primary', rationale: 'Core planche progression', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 95 },
    ],
    primaryStressRegions: ['wrist', 'shoulder_anterior', 'elbow', 'biceps_tendon'],
    tissueStressProfile: [
      { region: 'wrist', magnitude: 'very_high', accumulationRisk: 'high', spacingNeed: 2, notes: 'Full bodyweight through wrists', safeguardTags: ['wrist_prep_required'] },
      { region: 'shoulder_anterior', magnitude: 'high', accumulationRisk: 'high', spacingNeed: 2, notes: 'Full protraction under load', safeguardTags: ['shoulder_activation_required'] },
      { region: 'biceps_tendon', magnitude: 'high', accumulationRisk: 'high', spacingNeed: 2, notes: 'Straight-arm holds stress biceps tendon significantly', safeguardTags: ['bicep_tendon_caution'] },
    ],
    frequencyTolerance: 'moderate_frequency',
    trainingCost: {
      neuralCost: 5,
      localMuscleCost: 4,
      systemicFatigueCost: 3,
      tendonCost: 5,
      jointCost: 4,
      failureRisk: 'moderate',
      recommendedHardExposureSpacingDays: 2,
      microdoseAllowed: true,
      failureAllowed: false,
      reason: 'High skill and tendon demand; microdose OK but full sessions need spacing',
    },
    methodCompatibility: skillMethodCompatibility(),
    progressionRelationships: [
      { relatedExerciseId: 'planche_lean', kind: 'regression', rationale: 'Easier lean position', readinessSignal: null },
      { relatedExerciseId: 'adv_tuck_planche', kind: 'progression', rationale: 'Extended hip angle', readinessSignal: '15s+ tuck planche' },
    ],
    warmupNeeds: {
      jointPrep: ['wrist', 'shoulder_anterior', 'elbow'],
      activation: ['chest', 'anterior_deltoid', 'serratus'],
      rampUpNeeded: true,
      skillSpecificPrep: 'Planche leans, support holds',
      tissuePrep: ['wrist', 'shoulder_anterior', 'biceps_tendon'],
      suggestedTags: ['wrist_prep', 'planche_lean_warmup'],
    },
    cooldownNeeds: {
      mobilityTargets: ['wrist', 'shoulder_anterior', 'elbow'],
      downregulationNeed: 'high',
      tissueRecoveryTargets: ['wrist', 'shoulder_anterior', 'biceps_tendon'],
      suggestedTags: ['wrist_stretch', 'shoulder_stretch', 'bicep_stretch'],
    },
    userAbilityGates: [
      {
        gateId: 'tuck_planche_readiness',
        description: 'Must have planche lean proficiency and wrist conditioning',
        appliesToSkillIds: ['planche'],
        minimumSignals: ['30s planche lean', 'no wrist pain'],
        cautionSignals: ['wrist clicking', 'shoulder tightness'],
        blockedSignals: ['active wrist injury', 'biceps tendinitis'],
        fallbackExerciseIds: ['planche_lean'],
      },
    ],
    equipmentRequired: ['floor'],
    equipmentOptional: ['parallettes'],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: false,
    isIsometric: true,
    notesForFutureScoring: 'Key planche progression - monitor biceps tendon stress',
    forbiddenInterpretations: ['Must use seconds, not reps'],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  {
    exerciseId: 'tuck_planche_pushup',
    canonicalName: 'Tuck Planche Push-Up',
    aliases: ['Pseudo Planche Push-Up', 'PPPU', 'Planche Lean Push-Up'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['dynamic_reps'],
    prescriptionUnit: 'reps', // CRITICAL: This is DYNAMIC, uses reps
    movementFamilies: ['horizontal_push', 'straight_arm_push'],
    trainingPurposes: ['strength_support', 'skill_acquisition'],
    skillTransfers: [
      { skillId: 'planche', transferStrength: 'direct_primary', rationale: 'Dynamic planche pushing pattern', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 85 },
    ],
    primaryStressRegions: ['wrist', 'shoulder_anterior', 'elbow', 'pec_tendon'],
    tissueStressProfile: [
      { region: 'wrist', magnitude: 'high', accumulationRisk: 'moderate', spacingNeed: 1, notes: 'Forward lean loads wrists', safeguardTags: ['wrist_prep_required'] },
      { region: 'shoulder_anterior', magnitude: 'high', accumulationRisk: 'moderate', spacingNeed: 2, notes: 'Protracted push position', safeguardTags: ['shoulder_activation_required'] },
    ],
    frequencyTolerance: 'moderate_frequency',
    trainingCost: {
      neuralCost: 4,
      localMuscleCost: 4,
      systemicFatigueCost: 3,
      tendonCost: 4,
      jointCost: 3,
      failureRisk: 'moderate',
      recommendedHardExposureSpacingDays: 2,
      microdoseAllowed: true,
      failureAllowed: true,
      reason: 'Dynamic movement allows for controlled failure',
    },
    methodCompatibility: [
      straightSetsAllowed(),
      { methodId: 'supersets', verdict: 'allowed', rationale: 'Can pair with pulls', blockedWhen: null, saferAlternative: null },
      { methodId: 'drop_sets', verdict: 'allowed', rationale: 'Can reduce lean angle', blockedWhen: null, saferAlternative: null },
      { methodId: 'rest_pause', verdict: 'allowed', rationale: 'Extends pushing volume', blockedWhen: null, saferAlternative: null },
      { methodId: 'circuits', verdict: 'caution', rationale: 'Wrist fatigue accumulates', blockedWhen: 'Heavy planche day', saferAlternative: 'straight_sets' },
      { methodId: 'density_blocks', verdict: 'caution', rationale: 'Quality may suffer', blockedWhen: null, saferAlternative: 'straight_sets' },
      { methodId: 'cluster_sets', verdict: 'allowed', rationale: 'Good for quality reps', blockedWhen: null, saferAlternative: null },
      { methodId: 'top_set_backoff', verdict: 'allowed', rationale: 'Can use lean angle as variable', blockedWhen: null, saferAlternative: null },
      { methodId: 'endurance_conditioning', verdict: 'avoid', rationale: 'Not an endurance exercise', blockedWhen: null, saferAlternative: 'straight_sets' },
    ],
    progressionRelationships: [
      { relatedExerciseId: 'planche_lean', kind: 'prerequisite', rationale: 'Need lean proficiency first', readinessSignal: null },
      { relatedExerciseId: 'tuck_planche', kind: 'lateral_substitute', rationale: 'Static vs dynamic', readinessSignal: null },
    ],
    warmupNeeds: upperPushWarmupNeeds(),
    cooldownNeeds: upperBodyCooldownNeeds(),
    userAbilityGates: [],
    equipmentRequired: ['floor'],
    equipmentOptional: ['parallettes'],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: false,
    isIsometric: false,
    notesForFutureScoring: 'This is the DYNAMIC push-up variant - uses REPS, not seconds',
    forbiddenInterpretations: ['Must NOT be confused with static Planche Lean (which uses seconds)'],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  // ===========================================================================
  // PULL PROGRESSIONS - Pull skill family
  // ===========================================================================
  {
    exerciseId: 'pull_up',
    canonicalName: 'Pull-Up',
    aliases: ['Strict Pull-Up', 'Dead Hang Pull-Up'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['dynamic_reps'],
    prescriptionUnit: 'reps',
    movementFamilies: ['vertical_pull'],
    trainingPurposes: ['strength_support', 'hypertrophy_support'],
    skillTransfers: [
      { skillId: 'one_arm_pull_up', transferStrength: 'direct_secondary', rationale: 'Foundation for pulling strength', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 80 },
      { skillId: 'front_lever', transferStrength: 'indirect_support', rationale: 'Lat strength for FL', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 60 },
      { skillId: 'muscle_up', transferStrength: 'direct_primary', rationale: 'Pull phase of muscle-up', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 85 },
    ],
    primaryStressRegions: ['biceps_tendon', 'shoulder_general', 'forearm_grip'],
    tissueStressProfile: [
      { region: 'biceps_tendon', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 1, notes: 'Standard pulling stress', safeguardTags: [] },
      { region: 'shoulder_general', magnitude: 'low', accumulationRisk: 'low', spacingNeed: 1, notes: 'Bodyweight is manageable', safeguardTags: [] },
    ],
    frequencyTolerance: 'frequent_low_intensity',
    trainingCost: {
      neuralCost: 2,
      localMuscleCost: 3,
      systemicFatigueCost: 2,
      tendonCost: 2,
      jointCost: 2,
      failureRisk: 'low',
      recommendedHardExposureSpacingDays: 1,
      microdoseAllowed: true,
      failureAllowed: true,
      reason: 'Bodyweight pulling is well tolerated',
    },
    methodCompatibility: [
      straightSetsAllowed(),
      { methodId: 'supersets', verdict: 'preferred', rationale: 'Classic push/pull pairing', blockedWhen: null, saferAlternative: null },
      { methodId: 'drop_sets', verdict: 'allowed', rationale: 'Can use band assistance for drops', blockedWhen: null, saferAlternative: null },
      { methodId: 'rest_pause', verdict: 'allowed', rationale: 'Extends volume effectively', blockedWhen: null, saferAlternative: null },
      { methodId: 'circuits', verdict: 'allowed', rationale: 'Works well in circuits', blockedWhen: null, saferAlternative: null },
      { methodId: 'density_blocks', verdict: 'allowed', rationale: 'Good for volume accumulation', blockedWhen: null, saferAlternative: null },
      { methodId: 'cluster_sets', verdict: 'allowed', rationale: 'Good for quality reps', blockedWhen: null, saferAlternative: null },
      { methodId: 'top_set_backoff', verdict: 'allowed', rationale: 'Can add weight for top set', blockedWhen: null, saferAlternative: null },
      { methodId: 'endurance_conditioning', verdict: 'allowed', rationale: 'High-rep pull-ups work', blockedWhen: null, saferAlternative: null },
    ],
    progressionRelationships: [
      { relatedExerciseId: 'weighted_pull_up', kind: 'progression', rationale: 'Add load for strength', readinessSignal: '10+ strict pull-ups' },
      { relatedExerciseId: 'chest_to_bar_pull_up', kind: 'progression', rationale: 'Extended ROM', readinessSignal: '8+ strict pull-ups' },
      { relatedExerciseId: 'archer_pull_up', kind: 'progression', rationale: 'Unilateral emphasis', readinessSignal: '12+ strict pull-ups' },
    ],
    warmupNeeds: upperPullWarmupNeeds(),
    cooldownNeeds: upperBodyCooldownNeeds(),
    userAbilityGates: [],
    equipmentRequired: ['pull_bar'],
    equipmentOptional: ['bands'],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: true,
    isIsometric: false,
    notesForFutureScoring: 'Foundation pulling exercise; gateway to weighted and advanced pulling',
    forbiddenInterpretations: [],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  {
    exerciseId: 'tuck_fl',
    canonicalName: 'Tuck Front Lever',
    aliases: ['Tuck Front Lever Hold', 'Tucked FL'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['static_hold', 'skill_drill'],
    prescriptionUnit: 'seconds',
    movementFamilies: ['straight_arm_pull', 'horizontal_pull'],
    trainingPurposes: ['skill_acquisition', 'tendon_conditioning'],
    skillTransfers: [
      { skillId: 'front_lever', transferStrength: 'direct_primary', rationale: 'Core FL progression', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 95 },
    ],
    primaryStressRegions: ['biceps_tendon', 'lat', 'shoulder_general'],
    tissueStressProfile: [
      { region: 'biceps_tendon', magnitude: 'high', accumulationRisk: 'high', spacingNeed: 2, notes: 'Straight-arm pulling loads biceps tendon heavily', safeguardTags: ['bicep_tendon_caution'] },
      { region: 'lat', magnitude: 'high', accumulationRisk: 'moderate', spacingNeed: 2, notes: 'Significant lat engagement', safeguardTags: [] },
    ],
    frequencyTolerance: 'moderate_frequency',
    trainingCost: {
      neuralCost: 4,
      localMuscleCost: 4,
      systemicFatigueCost: 3,
      tendonCost: 5,
      jointCost: 3,
      failureRisk: 'moderate',
      recommendedHardExposureSpacingDays: 2,
      microdoseAllowed: true,
      failureAllowed: false,
      reason: 'Biceps tendon stress requires careful management',
    },
    methodCompatibility: skillMethodCompatibility(),
    progressionRelationships: [
      { relatedExerciseId: 'adv_tuck_fl', kind: 'progression', rationale: 'Extended tuck position', readinessSignal: '15s+ tuck FL' },
      { relatedExerciseId: 'tuck_front_lever_pull', kind: 'lateral_substitute', rationale: 'Dynamic FL pattern', readinessSignal: null },
    ],
    warmupNeeds: upperPullWarmupNeeds(),
    cooldownNeeds: {
      mobilityTargets: ['shoulder_general', 'lat'],
      downregulationNeed: 'high',
      tissueRecoveryTargets: ['biceps_tendon', 'lat'],
      suggestedTags: ['bicep_stretch', 'lat_stretch', 'shoulder_stretch'],
    },
    userAbilityGates: [
      {
        gateId: 'tuck_fl_readiness',
        description: 'Must have pulling foundation and healthy biceps tendons',
        appliesToSkillIds: ['front_lever'],
        minimumSignals: ['8+ pull-ups', 'active hang comfort'],
        cautionSignals: ['biceps tendon soreness', 'shoulder tightness'],
        blockedSignals: ['active biceps tendinitis', 'shoulder impingement'],
        fallbackExerciseIds: ['pull_up', 'chest_to_bar_pull_up'],
      },
    ],
    equipmentRequired: ['pull_bar'],
    equipmentOptional: ['rings'],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: true,
    isIsometric: true,
    notesForFutureScoring: 'Front lever progression - critical to monitor biceps tendon stress accumulation',
    forbiddenInterpretations: ['Must use seconds, not reps'],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  // ===========================================================================
  // COMPRESSION / CORE PROGRESSIONS
  // ===========================================================================
  {
    exerciseId: 'l_sit_skill',
    canonicalName: 'L-Sit',
    aliases: ['L-Sit Hold', 'Floor L-Sit'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['static_hold', 'skill_drill'],
    prescriptionUnit: 'seconds',
    movementFamilies: ['compression_core'],
    trainingPurposes: ['skill_acquisition', 'compression'],
    skillTransfers: [
      { skillId: 'l_sit', transferStrength: 'direct_primary', rationale: 'The skill itself', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 100 },
      { skillId: 'v_sit', transferStrength: 'direct_primary', rationale: 'Foundation for V-sit', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 90 },
    ],
    primaryStressRegions: ['hip_flexor', 'core_abdominal', 'wrist', 'shoulder_general'],
    tissueStressProfile: [
      { region: 'hip_flexor', magnitude: 'high', accumulationRisk: 'moderate', spacingNeed: 1, notes: 'Intense hip flexor engagement', safeguardTags: ['hip_flexor_prep'] },
      { region: 'wrist', magnitude: 'moderate', accumulationRisk: 'low', spacingNeed: 1, notes: 'Wrist load from support', safeguardTags: ['wrist_prep_required'] },
    ],
    frequencyTolerance: 'high_frequency_microdose',
    trainingCost: {
      neuralCost: 3,
      localMuscleCost: 3,
      systemicFatigueCost: 2,
      tendonCost: 2,
      jointCost: 2,
      failureRisk: 'low',
      recommendedHardExposureSpacingDays: 1,
      microdoseAllowed: true,
      failureAllowed: false,
      reason: 'Compression work can be trained frequently',
    },
    methodCompatibility: skillMethodCompatibility(),
    progressionRelationships: [
      { relatedExerciseId: 'tuck_l_sit', kind: 'regression', rationale: 'Tucked leg version', readinessSignal: null },
      { relatedExerciseId: 'v_sit_progression', kind: 'progression', rationale: 'V-sit progression', readinessSignal: '30s L-sit' },
    ],
    warmupNeeds: {
      jointPrep: ['wrist', 'hip_flexor'],
      activation: ['hip_flexors', 'core'],
      rampUpNeeded: false,
      skillSpecificPrep: 'Hip flexor activation, wrist prep',
      tissuePrep: ['hip_flexor'],
      suggestedTags: ['wrist_circles', 'hip_flexor_activation'],
    },
    cooldownNeeds: {
      mobilityTargets: ['hip_flexor', 'wrist'],
      downregulationNeed: 'low',
      tissueRecoveryTargets: ['hip_flexor'],
      suggestedTags: ['hip_flexor_stretch', 'wrist_stretch'],
    },
    userAbilityGates: [],
    equipmentRequired: ['floor'],
    equipmentOptional: ['parallettes'],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: false,
    isIsometric: true,
    notesForFutureScoring: 'Foundation compression skill',
    forbiddenInterpretations: ['Must use seconds, not reps'],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  {
    exerciseId: 'dragon_flag',
    canonicalName: 'Dragon Flag',
    aliases: ['Full Dragon Flag'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['dynamic_reps', 'eccentric'],
    prescriptionUnit: 'reps',
    movementFamilies: ['anti_extension_core'],
    trainingPurposes: ['max_strength', 'skill_acquisition'],
    skillTransfers: [
      { skillId: 'front_lever', transferStrength: 'direct_secondary', rationale: 'Core tension for FL', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 70 },
      { skillId: 'back_lever', transferStrength: 'indirect_support', rationale: 'General body tension', supportedByEvidenceLevel: 'anecdotal', futureScoringWeight: 40 },
    ],
    primaryStressRegions: ['core_abdominal', 'lower_back', 'shoulder_general'],
    tissueStressProfile: [
      { region: 'core_abdominal', magnitude: 'very_high', accumulationRisk: 'moderate', spacingNeed: 2, notes: 'Intense core demand', safeguardTags: [] },
      { region: 'lower_back', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 2, notes: 'Anti-extension stress', safeguardTags: ['lower_back_brace'] },
    ],
    frequencyTolerance: 'limited_high_intensity',
    trainingCost: {
      neuralCost: 4,
      localMuscleCost: 5,
      systemicFatigueCost: 3,
      tendonCost: 2,
      jointCost: 2,
      failureRisk: 'moderate',
      recommendedHardExposureSpacingDays: 2,
      microdoseAllowed: false,
      failureAllowed: true,
      reason: 'High core demand requires recovery',
    },
    methodCompatibility: [
      straightSetsAllowed(),
      { methodId: 'supersets', verdict: 'caution', rationale: 'Core fatigue affects other exercises', blockedWhen: 'With skill work', saferAlternative: 'straight_sets' },
      { methodId: 'drop_sets', verdict: 'allowed', rationale: 'Can tuck legs for regression', blockedWhen: null, saferAlternative: null },
      { methodId: 'rest_pause', verdict: 'allowed', rationale: 'Can extend volume', blockedWhen: null, saferAlternative: null },
      { methodId: 'circuits', verdict: 'avoid', rationale: 'Core needs rest between skill sets', blockedWhen: null, saferAlternative: 'straight_sets' },
      { methodId: 'density_blocks', verdict: 'avoid', rationale: 'Quality over quantity', blockedWhen: null, saferAlternative: 'straight_sets' },
      { methodId: 'cluster_sets', verdict: 'preferred', rationale: 'Great for quality reps', blockedWhen: null, saferAlternative: null },
      { methodId: 'top_set_backoff', verdict: 'allowed', rationale: 'Can use tucked variations', blockedWhen: null, saferAlternative: null },
      { methodId: 'endurance_conditioning', verdict: 'avoid', rationale: 'Not an endurance exercise', blockedWhen: null, saferAlternative: 'straight_sets' },
    ],
    progressionRelationships: [
      { relatedExerciseId: 'dragon_flag_tuck', kind: 'regression', rationale: 'Tucked version', readinessSignal: null },
      { relatedExerciseId: 'dragon_flag_neg', kind: 'regression', rationale: 'Negative only', readinessSignal: null },
    ],
    warmupNeeds: {
      jointPrep: ['lower_back', 'shoulder_general'],
      activation: ['core', 'hip_flexors'],
      rampUpNeeded: true,
      skillSpecificPrep: 'Dead bugs, hollow body',
      tissuePrep: ['core_abdominal', 'lower_back'],
      suggestedTags: ['core_activation', 'hollow_body_warmup'],
    },
    cooldownNeeds: {
      mobilityTargets: ['lower_back', 'hip_flexor'],
      downregulationNeed: 'moderate',
      tissueRecoveryTargets: ['core_abdominal'],
      suggestedTags: ['lower_back_stretch', 'hip_flexor_stretch'],
    },
    userAbilityGates: [
      {
        gateId: 'dragon_flag_readiness',
        description: 'Must have core strength foundation',
        appliesToSkillIds: ['front_lever'],
        minimumSignals: ['30s hollow body hold', 'no lower back pain'],
        cautionSignals: ['lower back tightness'],
        blockedSignals: ['active lower back injury'],
        fallbackExerciseIds: ['dragon_flag_tuck', 'hollow_body'],
      },
    ],
    equipmentRequired: ['bench'],
    equipmentOptional: [],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: false,
    isIsometric: false,
    notesForFutureScoring: 'Advanced core exercise - good FL transfer',
    forbiddenInterpretations: [],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  {
    exerciseId: 'hollow_body',
    canonicalName: 'Hollow Body Hold',
    aliases: ['Hollow Hold', 'Dish Hold'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['static_hold'],
    prescriptionUnit: 'seconds',
    movementFamilies: ['anti_extension_core'],
    trainingPurposes: ['skill_acquisition', 'warmup', 'technique'],
    skillTransfers: [
      { skillId: 'front_lever', transferStrength: 'indirect_support', rationale: 'Body tension pattern', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 50 },
      { skillId: 'planche', transferStrength: 'indirect_support', rationale: 'Body line awareness', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 40 },
    ],
    primaryStressRegions: ['core_abdominal', 'hip_flexor'],
    tissueStressProfile: [
      { region: 'core_abdominal', magnitude: 'moderate', accumulationRisk: 'low', spacingNeed: 0, notes: 'Moderate core demand', safeguardTags: [] },
    ],
    frequencyTolerance: 'high_frequency_microdose',
    trainingCost: {
      neuralCost: 2,
      localMuscleCost: 2,
      systemicFatigueCost: 1,
      tendonCost: 1,
      jointCost: 1,
      failureRisk: 'low',
      recommendedHardExposureSpacingDays: 0,
      microdoseAllowed: true,
      failureAllowed: true,
      reason: 'Low stress, can be done daily',
    },
    methodCompatibility: skillMethodCompatibility(),
    progressionRelationships: [
      { relatedExerciseId: 'dragon_flag_tuck', kind: 'progression', rationale: 'More challenging anti-extension', readinessSignal: '60s hollow body' },
    ],
    warmupNeeds: {
      jointPrep: [],
      activation: ['core'],
      rampUpNeeded: false,
      skillSpecificPrep: null,
      tissuePrep: [],
      suggestedTags: [],
    },
    cooldownNeeds: {
      mobilityTargets: ['hip_flexor'],
      downregulationNeed: 'low',
      tissueRecoveryTargets: [],
      suggestedTags: [],
    },
    userAbilityGates: [],
    equipmentRequired: ['floor'],
    equipmentOptional: [],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: false,
    isIsometric: true,
    notesForFutureScoring: 'Foundation core position - good warm-up/technique drill',
    forbiddenInterpretations: [],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  // ===========================================================================
  // DIPS - Push pattern
  // ===========================================================================
  {
    exerciseId: 'dip',
    canonicalName: 'Parallel Bar Dip',
    aliases: ['Dip', 'Bar Dip'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['dynamic_reps'],
    prescriptionUnit: 'reps',
    movementFamilies: ['dip_pattern', 'vertical_push'],
    trainingPurposes: ['strength_support', 'hypertrophy_support'],
    skillTransfers: [
      { skillId: 'planche', transferStrength: 'direct_secondary', rationale: 'Pushing strength', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 65 },
      { skillId: 'muscle_up', transferStrength: 'direct_primary', rationale: 'Dip portion of MU', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 85 },
      { skillId: 'hspu', transferStrength: 'direct_secondary', rationale: 'Pressing strength', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 60 },
    ],
    primaryStressRegions: ['shoulder_anterior', 'pec_tendon', 'triceps_tendon'],
    tissueStressProfile: [
      { region: 'shoulder_anterior', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 1, notes: 'Anterior shoulder stress at depth', safeguardTags: ['shoulder_activation_required'] },
      { region: 'pec_tendon', magnitude: 'moderate', accumulationRisk: 'moderate', spacingNeed: 1, notes: 'Pec stretch at bottom', safeguardTags: [] },
    ],
    frequencyTolerance: 'frequent_low_intensity',
    trainingCost: {
      neuralCost: 2,
      localMuscleCost: 3,
      systemicFatigueCost: 2,
      tendonCost: 2,
      jointCost: 3,
      failureRisk: 'low',
      recommendedHardExposureSpacingDays: 1,
      microdoseAllowed: true,
      failureAllowed: true,
      reason: 'Bodyweight dips are well tolerated',
    },
    methodCompatibility: [
      straightSetsAllowed(),
      { methodId: 'supersets', verdict: 'preferred', rationale: 'Classic push/pull pairing', blockedWhen: null, saferAlternative: null },
      { methodId: 'drop_sets', verdict: 'allowed', rationale: 'Can use band assistance', blockedWhen: null, saferAlternative: null },
      { methodId: 'rest_pause', verdict: 'allowed', rationale: 'Extends volume', blockedWhen: null, saferAlternative: null },
      { methodId: 'circuits', verdict: 'allowed', rationale: 'Works in circuits', blockedWhen: null, saferAlternative: null },
      { methodId: 'density_blocks', verdict: 'allowed', rationale: 'Good for volume', blockedWhen: null, saferAlternative: null },
      { methodId: 'cluster_sets', verdict: 'allowed', rationale: 'Quality reps', blockedWhen: null, saferAlternative: null },
      { methodId: 'top_set_backoff', verdict: 'preferred', rationale: 'Can add weight then drop', blockedWhen: null, saferAlternative: null },
      { methodId: 'endurance_conditioning', verdict: 'allowed', rationale: 'High rep dips work', blockedWhen: null, saferAlternative: null },
    ],
    progressionRelationships: [
      { relatedExerciseId: 'weighted_dip', kind: 'progression', rationale: 'Add load', readinessSignal: '15+ strict dips' },
      { relatedExerciseId: 'straight_bar_dip', kind: 'lateral_substitute', rationale: 'Different grip', readinessSignal: null },
    ],
    warmupNeeds: upperPushWarmupNeeds(),
    cooldownNeeds: upperBodyCooldownNeeds(),
    userAbilityGates: [],
    equipmentRequired: ['dip_bars'],
    equipmentOptional: ['bands'],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: true,
    isIsometric: false,
    notesForFutureScoring: 'Foundation push exercise; gateway to weighted dips',
    forbiddenInterpretations: [],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  // ===========================================================================
  // HSPU PROGRESSIONS - Vertical push
  // ===========================================================================
  {
    exerciseId: 'wall_hspu',
    canonicalName: 'Wall Handstand Push-Up',
    aliases: ['Wall HSPU', 'Handstand Push-Up'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['dynamic_reps', 'skill_drill'],
    prescriptionUnit: 'reps',
    movementFamilies: ['vertical_push'],
    trainingPurposes: ['skill_acquisition', 'max_strength'],
    skillTransfers: [
      { skillId: 'hspu', transferStrength: 'direct_primary', rationale: 'The skill itself', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 95 },
      { skillId: 'planche', transferStrength: 'indirect_support', rationale: 'Shoulder strength', supportedByEvidenceLevel: 'anecdotal', futureScoringWeight: 30 },
    ],
    primaryStressRegions: ['shoulder_general', 'wrist', 'triceps_tendon'],
    tissueStressProfile: [
      { region: 'shoulder_general', magnitude: 'high', accumulationRisk: 'moderate', spacingNeed: 2, notes: 'Full bodyweight overhead pressing', safeguardTags: ['shoulder_activation_required'] },
      { region: 'wrist', magnitude: 'moderate', accumulationRisk: 'low', spacingNeed: 1, notes: 'Wrist extension in handstand', safeguardTags: ['wrist_prep_required'] },
    ],
    frequencyTolerance: 'moderate_frequency',
    trainingCost: {
      neuralCost: 4,
      localMuscleCost: 4,
      systemicFatigueCost: 3,
      tendonCost: 3,
      jointCost: 3,
      failureRisk: 'moderate',
      recommendedHardExposureSpacingDays: 2,
      microdoseAllowed: true,
      failureAllowed: true,
      reason: 'Skill work but demanding on shoulders',
    },
    methodCompatibility: skillMethodCompatibility(),
    progressionRelationships: [
      { relatedExerciseId: 'pike_pushup_elevated', kind: 'regression', rationale: 'Less vertical angle', readinessSignal: null },
      { relatedExerciseId: 'wall_hspu_partial', kind: 'regression', rationale: 'Partial ROM', readinessSignal: null },
    ],
    warmupNeeds: {
      jointPrep: ['wrist', 'shoulder_general'],
      activation: ['deltoids', 'triceps', 'upper_back'],
      rampUpNeeded: true,
      skillSpecificPrep: 'Wall walks, pike push-up ramp',
      tissuePrep: ['shoulder_general', 'wrist'],
      suggestedTags: ['wrist_prep', 'handstand_wall_warmup'],
    },
    cooldownNeeds: {
      mobilityTargets: ['shoulder_general', 'wrist'],
      downregulationNeed: 'moderate',
      tissueRecoveryTargets: ['shoulder_general'],
      suggestedTags: ['shoulder_stretch', 'wrist_stretch'],
    },
    userAbilityGates: [
      {
        gateId: 'hspu_readiness',
        description: 'Must have overhead pressing foundation',
        appliesToSkillIds: ['hspu'],
        minimumSignals: ['15+ pike push-ups', 'comfortable wall handstand'],
        cautionSignals: ['shoulder clicking', 'wrist discomfort'],
        blockedSignals: ['active shoulder impingement', 'wrist injury'],
        fallbackExerciseIds: ['pike_pushup_elevated', 'pike_pushup'],
      },
    ],
    equipmentRequired: ['wall'],
    equipmentOptional: [],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: false,
    isIsometric: false,
    notesForFutureScoring: 'Key vertical pressing skill',
    forbiddenInterpretations: [],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },

  {
    exerciseId: 'pike_pushup',
    canonicalName: 'Pike Push-Up',
    aliases: ['Pike Press'],
    sourceKinds: ['existing_pool', 'coach_authored_seed'],
    confidence: 'high',
    modalities: ['dynamic_reps'],
    prescriptionUnit: 'reps',
    movementFamilies: ['vertical_push'],
    trainingPurposes: ['strength_support', 'skill_acquisition'],
    skillTransfers: [
      { skillId: 'hspu', transferStrength: 'direct_secondary', rationale: 'HSPU regression', supportedByEvidenceLevel: 'established_consensus', futureScoringWeight: 75 },
    ],
    primaryStressRegions: ['shoulder_general', 'triceps_tendon'],
    tissueStressProfile: [
      { region: 'shoulder_general', magnitude: 'moderate', accumulationRisk: 'low', spacingNeed: 1, notes: 'Partial overhead angle', safeguardTags: [] },
    ],
    frequencyTolerance: 'frequent_low_intensity',
    trainingCost: {
      neuralCost: 2,
      localMuscleCost: 3,
      systemicFatigueCost: 2,
      tendonCost: 2,
      jointCost: 2,
      failureRisk: 'low',
      recommendedHardExposureSpacingDays: 1,
      microdoseAllowed: true,
      failureAllowed: true,
      reason: 'Bodyweight pressing is well tolerated',
    },
    methodCompatibility: [
      straightSetsAllowed(),
      { methodId: 'supersets', verdict: 'allowed', rationale: 'Pairs well with pulls', blockedWhen: null, saferAlternative: null },
      { methodId: 'drop_sets', verdict: 'allowed', rationale: 'Can reduce angle', blockedWhen: null, saferAlternative: null },
      { methodId: 'rest_pause', verdict: 'allowed', rationale: 'Extends volume', blockedWhen: null, saferAlternative: null },
      { methodId: 'circuits', verdict: 'allowed', rationale: 'Works in circuits', blockedWhen: null, saferAlternative: null },
      { methodId: 'density_blocks', verdict: 'allowed', rationale: 'Good for volume', blockedWhen: null, saferAlternative: null },
      { methodId: 'cluster_sets', verdict: 'allowed', rationale: 'Quality reps', blockedWhen: null, saferAlternative: null },
      { methodId: 'top_set_backoff', verdict: 'allowed', rationale: 'Can elevate then reduce', blockedWhen: null, saferAlternative: null },
      { methodId: 'endurance_conditioning', verdict: 'allowed', rationale: 'High rep works', blockedWhen: null, saferAlternative: null },
    ],
    progressionRelationships: [
      { relatedExerciseId: 'pike_pushup_elevated', kind: 'progression', rationale: 'More vertical angle', readinessSignal: '15+ pike push-ups' },
      { relatedExerciseId: 'wall_hspu_partial', kind: 'progression', rationale: 'Wall supported', readinessSignal: '20+ pike push-ups' },
    ],
    warmupNeeds: upperPushWarmupNeeds(),
    cooldownNeeds: upperBodyCooldownNeeds(),
    userAbilityGates: [],
    equipmentRequired: ['floor'],
    equipmentOptional: [],
    weightedStrengthAnchor: false,
    bandAssistanceSupported: false,
    isIsometric: false,
    notesForFutureScoring: 'Foundation for HSPU progression',
    forbiddenInterpretations: [],
    knownTaxonomyWarnings: [],
    futureResearchSlots: [],
  },
]

// =============================================================================
// SKILL KNOWLEDGE SEED DATA
// =============================================================================

/**
 * Seeded skill knowledge entries
 * Uses ACTUAL skill IDs from skills.ts / movement-family-registry.ts
 */
export const SKILL_KNOWLEDGE_SEED: readonly SkillKnowledgeEntry[] = [
  {
    skillId: 'planche',
    canonicalName: 'Planche',
    aliases: ['Full Planche', 'Straddle Planche'],
    skillFamily: 'push',
    primaryMovementFamilies: ['straight_arm_push', 'horizontal_push'],
    supportMovementFamilies: ['dip_pattern', 'compression_core'],
    highValueExerciseIds: ['tuck_planche', 'adv_tuck_planche', 'planche_lean', 'tuck_planche_pushup'],
    maintenanceExerciseIds: ['planche_lean', 'dip', 'tuck_planche_pushup'],
    microdoseExerciseIds: ['planche_lean'],
    commonOveruseRisks: ['wrist', 'biceps_tendon', 'shoulder_anterior'],
    frequencyDoctrine: 'moderate_frequency',
    progressionSignals: ['Increased lean angle', 'Longer hold time', 'Less hip pike'],
    regressionSignals: ['Wrist pain', 'Biceps tendon soreness', 'Shoulder fatigue'],
    warmupPriorities: ['wrist', 'shoulder_anterior'],
    cooldownPriorities: ['wrist', 'shoulder_anterior', 'biceps_tendon'],
    programBalanceRequirements: [
      { balanceFamily: 'straight_arm_push', importance: 'critical', rationale: 'Primary movement pattern' },
      { balanceFamily: 'vertical_pull', importance: 'important', rationale: 'Shoulder balance' },
      { balanceFamily: 'compression_core', importance: 'important', rationale: 'Body line support' },
    ],
    notesForFutureScoring: 'Planche under-expression is a critical program quality issue',
  },

  {
    skillId: 'front_lever',
    canonicalName: 'Front Lever',
    aliases: ['FL', 'Full Front Lever'],
    skillFamily: 'pull',
    primaryMovementFamilies: ['straight_arm_pull', 'horizontal_pull'],
    supportMovementFamilies: ['vertical_pull', 'anti_extension_core'],
    highValueExerciseIds: ['tuck_fl', 'adv_tuck_fl', 'tuck_front_lever_pull'],
    maintenanceExerciseIds: ['pull_up', 'weighted_pull_up'],
    microdoseExerciseIds: ['tuck_fl'],
    commonOveruseRisks: ['biceps_tendon', 'lat', 'shoulder_general'],
    frequencyDoctrine: 'moderate_frequency',
    progressionSignals: ['Longer hold time', 'Less tuck', 'One leg extension'],
    regressionSignals: ['Biceps tendon pain', 'Lat strain', 'Shoulder fatigue'],
    warmupPriorities: ['shoulder_general', 'biceps_tendon'],
    cooldownPriorities: ['biceps_tendon', 'lat', 'shoulder_general'],
    programBalanceRequirements: [
      { balanceFamily: 'straight_arm_pull', importance: 'critical', rationale: 'Primary movement pattern' },
      { balanceFamily: 'horizontal_push', importance: 'important', rationale: 'Push/pull balance' },
      { balanceFamily: 'anti_extension_core', importance: 'supportive', rationale: 'Core tension support' },
    ],
    notesForFutureScoring: 'FL training must monitor biceps tendon accumulation carefully',
  },

  {
    skillId: 'back_lever',
    canonicalName: 'Back Lever',
    aliases: ['BL', 'Full Back Lever'],
    skillFamily: 'pull',
    primaryMovementFamilies: ['straight_arm_pull'],
    supportMovementFamilies: ['vertical_pull', 'scapular_control'],
    highValueExerciseIds: [],
    maintenanceExerciseIds: ['pull_up'],
    microdoseExerciseIds: [],
    commonOveruseRisks: ['biceps_tendon', 'shoulder_anterior'],
    frequencyDoctrine: 'moderate_frequency',
    progressionSignals: ['Longer hold time', 'Less tuck', 'Better body line'],
    regressionSignals: ['Biceps tendon pain', 'Shoulder discomfort'],
    warmupPriorities: ['shoulder_general', 'biceps_tendon'],
    cooldownPriorities: ['biceps_tendon', 'shoulder_general'],
    programBalanceRequirements: [
      { balanceFamily: 'straight_arm_pull', importance: 'critical', rationale: 'Primary movement pattern' },
      { balanceFamily: 'horizontal_push', importance: 'important', rationale: 'Push/pull balance' },
    ],
    notesForFutureScoring: 'Back lever shares biceps tendon stress with front lever - monitor cumulative load',
  },

  {
    skillId: 'hspu',
    canonicalName: 'Handstand Push-Up',
    aliases: ['HSPU', 'Handstand Press'],
    skillFamily: 'push',
    primaryMovementFamilies: ['vertical_push'],
    supportMovementFamilies: ['dip_pattern', 'scapular_control'],
    highValueExerciseIds: ['wall_hspu', 'pike_pushup_elevated', 'wall_hspu_partial'],
    maintenanceExerciseIds: ['pike_pushup', 'dip', 'weighted_dip'],
    microdoseExerciseIds: ['pike_pushup'],
    commonOveruseRisks: ['shoulder_general', 'wrist', 'triceps_tendon'],
    frequencyDoctrine: 'moderate_frequency',
    progressionSignals: ['More reps', 'Less wall dependence', 'Greater ROM'],
    regressionSignals: ['Shoulder fatigue', 'Wrist pain', 'Elbow discomfort'],
    warmupPriorities: ['shoulder_general', 'wrist'],
    cooldownPriorities: ['shoulder_general', 'wrist'],
    programBalanceRequirements: [
      { balanceFamily: 'vertical_push', importance: 'critical', rationale: 'Primary movement pattern' },
      { balanceFamily: 'vertical_pull', importance: 'important', rationale: 'Shoulder balance' },
    ],
    notesForFutureScoring: 'HSPU is a key vertical pressing skill',
  },

  {
    skillId: 'muscle_up',
    canonicalName: 'Muscle-Up',
    aliases: ['MU', 'Bar Muscle-Up'],
    skillFamily: 'transition',
    primaryMovementFamilies: ['explosive_pull', 'transition', 'dip_pattern'],
    supportMovementFamilies: ['vertical_pull'],
    highValueExerciseIds: ['explosive_pull_up', 'chest_to_bar_pull_up'],
    maintenanceExerciseIds: ['pull_up', 'weighted_pull_up', 'dip', 'weighted_dip'],
    microdoseExerciseIds: ['explosive_pull_up'],
    commonOveruseRisks: ['biceps_tendon', 'shoulder_anterior', 'elbow'],
    frequencyDoctrine: 'limited_high_intensity',
    progressionSignals: ['More reps', 'Cleaner transition', 'Less kip'],
    regressionSignals: ['Elbow pain', 'Shoulder discomfort', 'Grip fatigue'],
    warmupPriorities: ['shoulder_general', 'elbow'],
    cooldownPriorities: ['shoulder_general', 'biceps_tendon'],
    programBalanceRequirements: [
      { balanceFamily: 'explosive_pull', importance: 'critical', rationale: 'Primary movement pattern' },
      { balanceFamily: 'dip_pattern', importance: 'critical', rationale: 'Dip portion of MU' },
      { balanceFamily: 'vertical_pull', importance: 'important', rationale: 'Pull foundation' },
    ],
    notesForFutureScoring: 'Muscle-up requires both pulling and pushing strength anchors',
  },

  {
    skillId: 'one_arm_pull_up',
    canonicalName: 'One Arm Pull-Up',
    aliases: ['OAP', 'OAPU', 'One Arm Chin-Up'],
    skillFamily: 'pull',
    primaryMovementFamilies: ['vertical_pull'],
    supportMovementFamilies: ['grip'],
    highValueExerciseIds: ['weighted_pull_up', 'archer_pull_up'],
    maintenanceExerciseIds: ['pull_up', 'weighted_pull_up'],
    microdoseExerciseIds: [],
    commonOveruseRisks: ['biceps_tendon', 'elbow', 'forearm_grip'],
    frequencyDoctrine: 'low_frequency_high_stress',
    progressionSignals: ['Heavier weighted pull-ups', 'More archer reps', 'Less assistance'],
    regressionSignals: ['Elbow pain', 'Biceps tendon soreness', 'Grip fatigue'],
    warmupPriorities: ['shoulder_general', 'elbow', 'forearm_grip'],
    cooldownPriorities: ['biceps_tendon', 'elbow', 'forearm_grip'],
    programBalanceRequirements: [
      { balanceFamily: 'vertical_pull', importance: 'critical', rationale: 'Primary movement pattern' },
      { balanceFamily: 'grip', importance: 'important', rationale: 'Single-arm grip demand' },
      { balanceFamily: 'horizontal_push', importance: 'supportive', rationale: 'Push/pull balance' },
    ],
    notesForFutureScoring: 'OAP requires heavy weighted pull-up as strength anchor',
  },

  {
    skillId: 'l_sit',
    canonicalName: 'L-Sit',
    aliases: ['L-Sit Hold', 'Floor L-Sit'],
    skillFamily: 'compression',
    primaryMovementFamilies: ['compression_core'],
    supportMovementFamilies: ['scapular_control'],
    highValueExerciseIds: ['l_sit_skill', 'tuck_l_sit'],
    maintenanceExerciseIds: ['l_sit_core', 'hollow_body'],
    microdoseExerciseIds: ['l_sit_skill', 'tuck_l_sit'],
    commonOveruseRisks: ['hip_flexor', 'wrist'],
    frequencyDoctrine: 'high_frequency_microdose',
    progressionSignals: ['Longer hold time', 'Straighter legs', 'Higher hip position'],
    regressionSignals: ['Hip flexor cramping', 'Wrist discomfort'],
    warmupPriorities: ['hip_flexor', 'wrist'],
    cooldownPriorities: ['hip_flexor', 'wrist'],
    programBalanceRequirements: [
      { balanceFamily: 'compression_core', importance: 'critical', rationale: 'Primary movement pattern' },
    ],
    notesForFutureScoring: 'L-sit is foundation for V-sit progression',
  },

  {
    skillId: 'v_sit',
    canonicalName: 'V-Sit',
    aliases: ['V-Sit Hold', 'V-Sit Compression'],
    skillFamily: 'compression',
    primaryMovementFamilies: ['compression_core'],
    supportMovementFamilies: ['scapular_control'],
    highValueExerciseIds: ['v_sit_hold', 'v_sit_progression'],
    maintenanceExerciseIds: ['l_sit_skill'],
    microdoseExerciseIds: ['v_sit_progression'],
    commonOveruseRisks: ['hip_flexor', 'wrist', 'lower_back'],
    frequencyDoctrine: 'moderate_frequency',
    progressionSignals: ['Higher legs', 'Longer hold', 'Better body line'],
    regressionSignals: ['Hip flexor strain', 'Lower back discomfort'],
    warmupPriorities: ['hip_flexor', 'wrist'],
    cooldownPriorities: ['hip_flexor', 'lower_back'],
    programBalanceRequirements: [
      { balanceFamily: 'compression_core', importance: 'critical', rationale: 'Primary movement pattern' },
    ],
    notesForFutureScoring: 'V-sit builds on L-sit foundation',
  },
]
