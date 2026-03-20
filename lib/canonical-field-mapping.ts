/**
 * CANONICAL FIELD MAPPING
 * 
 * This document maps all programming-relevant fields across the codebase.
 * TASK 1: Audit all reads/writes for these categories.
 * 
 * ============================================================================
 * DURATION CONTRACT
 * ============================================================================
 * - selectedDurationPreference = canonical target (user's choice from onboarding/settings)
 * - estimatedMinutes = computed output (from actual session content)
 * - UI must NOT conflate these two concepts
 * 
 * ============================================================================
 * CANONICAL FIELD NAMES → LEGACY ALIASES
 * ============================================================================
 */

export const FIELD_MAPPING = {
  // GOALS
  primaryGoal: {
    canonical: 'primaryGoal',
    legacyAliases: ['goal', 'selectedGoal', 'mainGoal'],
    sources: ['onboardingProfile', 'athleteProfile', 'canonicalProfile'],
    usedBy: ['generation', 'settings', 'builder', 'explanations'],
  },
  secondaryGoal: {
    canonical: 'secondaryGoal',
    legacyAliases: ['secondary_focus', 'secondaryFocus'],
    sources: ['onboardingProfile', 'canonicalProfile'],
    usedBy: ['generation', 'explanations', 'structure-engine'],
  },
  selectedSkills: {
    canonical: 'selectedSkills',
    legacyAliases: ['skillInterests', 'skillsToPursue', 'skills'],
    sources: ['onboardingProfile', 'athleteProfile'],
    usedBy: ['generation', 'settings', 'warmup-engine'],
  },
  selectedFlexibility: {
    canonical: 'selectedFlexibility',
    legacyAliases: ['flexibilityGoals', 'flexGoals'],
    sources: ['onboardingProfile'],
    usedBy: ['generation', 'accessory-selection'],
  },
  goalCategories: {
    canonical: 'goalCategories',
    legacyAliases: ['goalCategory', 'selectedGoalCategories'],
    sources: ['onboardingProfile'],
    usedBy: ['onboarding-routing', 'generation'],
  },

  // SCHEDULE
  scheduleMode: {
    canonical: 'scheduleMode',
    legacyAliases: ['flexibleSchedule', 'scheduleType'],
    values: ['static', 'flexible'],
    sources: ['onboardingProfile', 'athleteProfile'],
    usedBy: ['generation', 'settings', 'builder'],
  },
  trainingDaysPerWeek: {
    canonical: 'trainingDaysPerWeek',
    legacyAliases: ['weeklyTraining', 'daysPerWeek', 'trainingDays'],
    note: 'NULL means flexible mode - engine derives at runtime',
    sources: ['onboardingProfile', 'athleteProfile'],
    usedBy: ['generation', 'settings', 'builder'],
  },
  sessionLengthMinutes: {
    canonical: 'sessionLengthMinutes',
    legacyAliases: ['sessionDuration', 'trainingTime', 'preferredDuration', 'targetDuration'],
    values: [30, 45, 60, 75, 90],
    sources: ['onboardingProfile', 'athleteProfile'],
    usedBy: ['generation', 'settings', 'builder', 'time-optimizer'],
  },

  // STRENGTH BENCHMARKS
  pullUpMax: {
    canonical: 'pullUpMax',
    legacyAliases: ['pullups', 'maxPullUps', 'pullUpCapacity'],
    type: 'PullUpCapacity enum string',
    sources: ['onboardingProfile'],
    usedBy: ['generation', 'metrics-card', 'weak-point-detection'],
  },
  dipMax: {
    canonical: 'dipMax',
    legacyAliases: ['dips', 'maxDips', 'dipCapacity'],
    type: 'DipCapacity enum string',
    sources: ['onboardingProfile'],
    usedBy: ['generation', 'metrics-card', 'weak-point-detection'],
  },
  weightedPullUp: {
    canonical: 'weightedPullUp',
    legacyAliases: ['pullupWeight', 'currentWeightedPullUp', 'weightedPullUpCurrent'],
    type: '{ addedWeight: number, reps: number }',
    sources: ['onboardingProfile'],
    usedBy: ['generation', 'metrics-card', 'pulling-strength-engine'],
  },
  weightedPullUpPR: {
    canonical: 'weightedPullUpPR',
    legacyAliases: ['pullUpPR', 'allTimePullUpPR'],
    type: '{ addedWeight: number, reps: number, timeframe: PRTimeframe }',
    sources: ['onboardingProfile'],
    usedBy: ['pr-vault', 'strength-analysis'],
  },
  weightedDip: {
    canonical: 'weightedDip',
    legacyAliases: ['dipWeight', 'currentWeightedDip', 'weightedDipCurrent'],
    type: '{ addedWeight: number, reps: number }',
    sources: ['onboardingProfile'],
    usedBy: ['generation', 'metrics-card', 'pushing-strength-analysis'],
  },
  weightedDipPR: {
    canonical: 'weightedDipPR',
    legacyAliases: ['dipPR', 'allTimeDipPR'],
    type: '{ addedWeight: number, reps: number, timeframe: PRTimeframe }',
    sources: ['onboardingProfile'],
    usedBy: ['pr-vault', 'strength-analysis'],
  },

  // SKILL PROGRESSIONS
  frontLeverProgression: {
    canonical: 'frontLeverProgression',
    legacyAliases: ['frontLeverLevel', 'frontLeverStage', 'flProgression'],
    type: 'FrontLeverProgression enum',
    sources: ['onboardingProfile.frontLever.progression'],
    usedBy: ['generation', 'metrics-card', 'skill-readiness'],
  },
  frontLeverHoldSeconds: {
    canonical: 'frontLeverHoldSeconds',
    legacyAliases: ['frontLeverHold', 'flHoldSeconds'],
    type: 'number',
    sources: ['onboardingProfile.frontLever.holdSeconds'],
    usedBy: ['generation', 'metrics-card', 'skill-readiness'],
  },
  plancheProgression: {
    canonical: 'plancheProgression',
    legacyAliases: ['plancheLevel', 'plancheStage'],
    type: 'PlancheProgression enum',
    sources: ['onboardingProfile.planche.progression'],
    usedBy: ['generation', 'metrics-card', 'skill-readiness'],
  },
  plancheHoldSeconds: {
    canonical: 'plancheHoldSeconds',
    legacyAliases: ['plancheHold', 'plancheBestHold'],
    type: 'number',
    sources: ['onboardingProfile.planche.holdSeconds'],
    usedBy: ['generation', 'metrics-card'],
  },

  // FLEXIBILITY
  frontSplitsLevel: {
    canonical: 'frontSplitsLevel',
    legacyAliases: ['frontSplits', 'frontSplitProgress'],
    type: 'FlexibilityLevel enum',
    sources: ['onboardingProfile.frontSplits.level'],
    usedBy: ['generation', 'metrics-card', 'accessory-selection'],
  },
  sideSplitsLevel: {
    canonical: 'sideSplitsLevel',
    legacyAliases: ['sideSplits', 'sideSplitProgress'],
    type: 'FlexibilityLevel enum',
    sources: ['onboardingProfile.sideSplits.level'],
    usedBy: ['generation', 'metrics-card', 'accessory-selection'],
  },

  // EQUIPMENT & CONSTRAINTS
  equipmentAvailable: {
    canonical: 'equipmentAvailable',
    legacyAliases: ['equipment', 'availableEquipment'],
    type: 'EquipmentType[]',
    sources: ['onboardingProfile', 'athleteProfile'],
    usedBy: ['generation', 'settings', 'exercise-selection'],
  },
  jointCautions: {
    canonical: 'jointCautions',
    legacyAliases: ['injuries', 'jointIssues', 'cautions'],
    type: 'JointCaution[]',
    sources: ['onboardingProfile', 'athleteProfile'],
    usedBy: ['generation', 'settings', 'exercise-filtering'],
  },
  weakestArea: {
    canonical: 'weakestArea',
    legacyAliases: ['limiter', 'primaryWeakness'],
    type: 'WeakestArea enum',
    sources: ['onboardingProfile', 'athleteProfile'],
    usedBy: ['generation', 'weak-point-detection', 'explanations'],
  },
} as const

/**
 * TASK 2: Canonical Programming Profile Shape
 * All programming-relevant truth unified into one contract.
 * See lib/canonical-profile-service.ts for the full type definition.
 */

/**
 * Helper to check if a field is from canonical profile
 */
export function isCanonicalField(fieldName: string): boolean {
  return fieldName in FIELD_MAPPING
}

/**
 * Helper to get legacy aliases for a canonical field
 */
export function getLegacyAliases(canonicalField: keyof typeof FIELD_MAPPING): string[] {
  return FIELD_MAPPING[canonicalField]?.legacyAliases || []
}
