/**
 * Prediction Engine Configuration
 * 
 * Centralized configuration for timeline calculations, modifiers, and thresholds.
 * Allows easy tuning of the prediction system without code changes.
 */

// =============================================================================
// TIMELINE CALCULATION SETTINGS
// =============================================================================

export const TIMELINE_CONFIG = {
  // Variance range for timeline estimates
  MIN_VARIANCE: 0.70,  // -30% for optimistic bound
  MAX_VARIANCE: 1.35,  // +35% for conservative bound
  
  // Long-term prediction adjustment (less certain = wider range)
  LONG_TERM_MIN_VARIANCE: 0.60,
  LONG_TERM_MAX_VARIANCE: 1.50,
  
  // Minimum weeks for any estimate
  ABSOLUTE_MIN_WEEKS: 2,
  
  // Sessions per week estimate for session count calculations
  EFFECTIVE_SESSIONS_MULTIPLIER: 0.85, // Account for missed sessions
}

// =============================================================================
// MODIFIER BOUNDS
// =============================================================================

export const MODIFIER_BOUNDS = {
  // Experience level modifiers
  ADVANCED_MODIFIER: 0.8,      // 20% faster
  INTERMEDIATE_MODIFIER: 1.0,  // Baseline
  BEGINNER_MODIFIER: 1.3,      // 30% slower
  
  // Training frequency modifiers
  FREQUENCY_5_PLUS: 0.85,
  FREQUENCY_4: 1.0,
  FREQUENCY_3: 1.15,
  FREQUENCY_2: 1.35,
  FREQUENCY_1_OR_LESS: 1.5,
  
  // Momentum modifiers
  MOMENTUM_VERY_STRONG: 0.85,
  MOMENTUM_STRONG: 0.95,
  MOMENTUM_DEVELOPING: 1.05,
  MOMENTUM_LOW: 1.2,
  MOMENTUM_NONE: 1.35,
  
  // Strength support modifiers
  STRENGTH_STRONG: 0.85,
  STRENGTH_MODERATE: 1.0,
  STRENGTH_WEAK: 1.25,
  STRENGTH_UNKNOWN: 1.1,
  
  // Recovery modifiers
  RECOVERY_OPTIMAL: 0.95,
  RECOVERY_ADEQUATE: 1.0,
  RECOVERY_COMPROMISED: 1.1,
  RECOVERY_FATIGUED: 1.25,
}

// =============================================================================
// CONFIDENCE SCORE THRESHOLDS
// =============================================================================

export const CONFIDENCE_THRESHOLDS = {
  VERY_HIGH: 85,
  HIGH: 70,
  MODERATE: 50,
  LOW: 30,
  // Below LOW = VERY_LOW
}

export const CONFIDENCE_BAND_THRESHOLDS = {
  CONFIDENT: 75,
  LIKELY: 55,
  ROUGH_ESTIMATE: 35,
  // Below ROUGH_ESTIMATE = UNCERTAIN
}

// =============================================================================
// DATA QUALITY REQUIREMENTS
// =============================================================================

export const DATA_QUALITY_REQUIREMENTS = {
  EXCELLENT: {
    minSessions: 5,
    minStrengthRecords: 3,
    requiresBodyweight: true,
    requiresMomentum: true,
  },
  GOOD: {
    minSessions: 3,
    minStrengthRecords: 2,
    requiresBodyweight: true,
    requiresMomentum: false,
  },
  PARTIAL: {
    minSessions: 1,
    minStrengthRecords: 1,
    requiresBodyweight: false,
    requiresMomentum: false,
  },
  // Below PARTIAL = INSUFFICIENT
}

// =============================================================================
// READINESS SCORE CALCULATION WEIGHTS
// =============================================================================

export const READINESS_WEIGHTS = {
  STRENGTH_SUPPORT: {
    strong: 20,
    moderate: 10,
    weak: -15,
    unknown: 0,
  },
  MOMENTUM: {
    accelerating: 10,
    stable: 0,
    decelerating: -10,
  },
  RECOVERY: {
    optimal: 5,
    adequate: 0,
    compromised: -5,
    fatigued: -15,
  },
  BASE_SCORE: 50,
}

// =============================================================================
// SKILL DIFFICULTY TIERS
// =============================================================================

export const DIFFICULTY_TIERS = {
  FOUNDATIONAL: {
    label: 'Foundational',
    baseMultiplier: 0.8,
    description: 'Building blocks for advanced skills',
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    baseMultiplier: 1.0,
    description: 'Requires solid strength foundation',
  },
  ADVANCED: {
    label: 'Advanced',
    baseMultiplier: 1.2,
    description: 'Significant strength and skill required',
  },
  ELITE: {
    label: 'Elite',
    baseMultiplier: 1.5,
    description: 'Years of dedicated training required',
  },
}

// =============================================================================
// TENDON RISK LEVELS
// =============================================================================

export const TENDON_RISK_CONFIG = {
  LOW: {
    additionalWeeksPerLevel: 0,
    warningThreshold: null,
  },
  MODERATE: {
    additionalWeeksPerLevel: 2,
    warningThreshold: 'low_moderate',
  },
  HIGH: {
    additionalWeeksPerLevel: 4,
    warningThreshold: 'moderate',
  },
  VERY_HIGH: {
    additionalWeeksPerLevel: 8,
    warningThreshold: 'moderate_high',
  },
}

// =============================================================================
// DISPLAY FORMATTING
// =============================================================================

export const DISPLAY_CONFIG = {
  // Threshold for showing weeks vs months
  WEEKS_THRESHOLD: 8,
  MONTHS_THRESHOLD: 16,
  
  // Session count display
  SHOW_SESSION_COUNT_THRESHOLD: 10,
  
  // Confidence display
  SHOW_CONFIDENCE_BAND: true,
  SHOW_EXACT_CONFIDENCE_SCORE: false,
}

// =============================================================================
// MARKETING COMPLIANCE
// =============================================================================

export const MARKETING_COMPLIANCE = {
  // Always include these disclaimers
  DISCLAIMER_TEXT: 'Timeline estimates are projections based on your training data and are not guarantees. Individual results vary based on consistency, recovery, and other factors.',
  
  // Words to avoid in predictions
  FORBIDDEN_WORDS: ['guarantee', 'promise', 'definitely', 'certainly', 'will achieve'],
  
  // Recommended phrasing
  RECOMMENDED_PHRASES: [
    'estimated',
    'projected',
    'typically',
    'based on your data',
    'may take',
    'could achieve',
  ],
}
