/**
 * Skill Readiness Types
 * 
 * Type definitions for the Skill Readiness Calculator Engine.
 * Re-exports key types and provides additional typing for SEO pages.
 */

// Re-export core types from service
export type {
  SkillReadinessInput,
  SkillReadinessResult,
  ReadinessClassification,
  ProgressionStage,
  LimitingFactorDetail,
  ComponentBreakdown,
  SkillPrerequisites,
} from './skillReadinessService'

// Re-export canonical types
export type {
  SkillType,
  CanonicalReadinessResult,
  AthleteReadinessInput,
  LimitingFactor,
  ReadinessComponentScores,
} from '../readiness/canonical-readiness-engine'

// Re-export skill-specific input types
export type {
  FrontLeverInputs,
  PlancheInputs,
  MuscleUpInputs,
  HSPUInputs,
  LSitInputs,
  VSitInputs,
  BackLeverInputs,
  IronCrossInputs,
  ReadinessResult,
  ReadinessLevel,
  ScoreBreakdown,
} from '../readiness/skill-readiness'

// =============================================================================
// SEO PAGE SPECIFIC TYPES
// =============================================================================

/**
 * Calculator page configuration
 */
export interface CalculatorPageConfig {
  skill: import('./skillReadinessService').SkillType
  title: string
  description: string
  metaTitle: string
  metaDescription: string
  heroText: string
  inputFields: InputFieldConfig[]
}

export interface InputFieldConfig {
  name: string
  label: string
  type: 'number' | 'select' | 'boolean'
  placeholder?: string
  min?: number
  max?: number
  unit?: string
  options?: { value: string; label: string }[]
  required?: boolean
  helpText?: string
}

/**
 * Calculator page state
 */
export interface CalculatorState {
  input: import('./skillReadinessService').SkillReadinessInput
  result: import('./skillReadinessService').SkillReadinessResult | null
  isCalculating: boolean
  hasCalculated: boolean
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * API request for skill readiness calculation
 */
export interface SkillReadinessAPIRequest {
  skill: string
  input: import('./skillReadinessService').SkillReadinessInput
}

/**
 * API response for skill readiness calculation
 */
export interface SkillReadinessAPIResponse {
  success: boolean
  result?: import('./skillReadinessService').SkillReadinessResult
  error?: string
}

// =============================================================================
// FORM VALIDATION TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

/**
 * Validate calculator input
 */
export function validateCalculatorInput(
  input: import('./skillReadinessService').SkillReadinessInput,
  skill: import('./skillReadinessService').SkillType
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Basic validation - at least some data should be provided
  const hasAnyInput = 
    input.pullups !== undefined ||
    input.dips !== undefined ||
    input.pushups !== undefined ||
    input.hollowHoldSeconds !== undefined ||
    input.lSitHoldSeconds !== undefined
  
  if (!hasAnyInput) {
    errors.push({
      field: 'general',
      message: 'Please provide at least one metric to calculate readiness.',
    })
  }
  
  // Numeric validation
  if (input.pullups !== undefined && (input.pullups < 0 || input.pullups > 100)) {
    errors.push({ field: 'pullups', message: 'Pull-ups must be between 0 and 100.' })
  }
  
  if (input.dips !== undefined && (input.dips < 0 || input.dips > 100)) {
    errors.push({ field: 'dips', message: 'Dips must be between 0 and 100.' })
  }
  
  if (input.hollowHoldSeconds !== undefined && (input.hollowHoldSeconds < 0 || input.hollowHoldSeconds > 300)) {
    errors.push({ field: 'hollowHoldSeconds', message: 'Hollow hold must be between 0 and 300 seconds.' })
  }
  
  // Skill-specific validation
  if (skill === 'v_sit' && input.lSitHoldSeconds === undefined) {
    errors.push({ 
      field: 'lSitHoldSeconds', 
      message: 'L-sit hold time is important for V-sit readiness calculation.' 
    })
  }
  
  if (skill === 'iron_cross' && input.ringSupportSeconds === undefined) {
    errors.push({ 
      field: 'ringSupportSeconds', 
      message: 'Ring support time is required for Iron Cross readiness.' 
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}
