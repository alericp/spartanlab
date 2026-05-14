/**
 * =============================================================================
 * ADAPTIVE FOUNDATION MODEL
 * =============================================================================
 *
 * MASTER-3 + MASTER-4 — Athlete Model + Skill State Model + Constraint Detection
 *
 * This module defines the typed, JSON-safe foundation layer that future adaptive
 * intelligence can consume. It synthesizes existing constraint/readiness/skill
 * engines into ONE stable model without duplicating their business logic.
 *
 * ARCHITECTURE RULES:
 * - Pure, typed, JSON-safe
 * - Does NOT mutate sessions/exercises/workouts
 * - Does NOT read localStorage directly
 * - Does NOT throw on missing data — returns honest low-confidence states
 * - REUSES existing engine outputs, does NOT duplicate scoring rules
 *
 * CONSUMPTION:
 * - Attached to AdaptiveProgram as optional `adaptiveFoundationModel` field
 * - Preserved through save/load/normalize
 * - Rendered in Program UI as compact coach intelligence proof
 */

import type { ConstraintResult, ConstraintType, ConstraintCategory, ConfidenceLevel } from '@/types/constraint-engine'

// =============================================================================
// TYPES
// =============================================================================

export type DataQualityLevel = 'insufficient' | 'partial' | 'usable' | 'strong'

export type SkillExpressionStatus =
  | 'direct_priority'
  | 'support'
  | 'carryover'
  | 'deferred'
  | 'unknown'

export type SafeActionBias =
  | 'progress'
  | 'hold'
  | 'reduce'
  | 'prep_first'
  | 'needs_data'

export type ConstraintSeverity = 'none' | 'minor' | 'moderate' | 'major' | 'unknown'

export type SuggestedConstraintAction =
  | 'none'
  | 'progress'
  | 'hold'
  | 'reduce'
  | 'substitute'
  | 'prep'
  | 'defer'
  | 'deload'

// =============================================================================
// SOURCE STATUS — tracks what data was available for model building
// =============================================================================

export interface AdaptiveFoundationSourceStatus {
  hasProfileTruth: boolean
  hasSelectedSkills: boolean
  hasWorkoutEvidence: boolean
  hasSkillEvidence: boolean
  hasReadinessEvidence: boolean
  hasConstraintEvidence: boolean
  dataQuality: DataQualityLevel
}

// =============================================================================
// ATHLETE CONTEXT — summarized from profile/settings
// =============================================================================

export interface AdaptiveAthleteContext {
  experienceLevel: string | null
  trainingStyle: string | null
  trainingDays: number | null
  equipmentSummary: string | null
  primaryGoal: string | null
  selectedGoals: string[]
}

// =============================================================================
// SKILL STATE — per-skill adaptive status
// =============================================================================

export interface AdaptiveSkillState {
  skillKey: string
  label: string
  selected: boolean
  priorityRank: number | null
  expressionStatus: SkillExpressionStatus
  readinessStatus: string | null
  limiterCodes: string[]
  evidenceQuality: DataQualityLevel
  nextSafeBias: SafeActionBias
}

// =============================================================================
// CONSTRAINT SUMMARY — normalized from existing constraint engine
// =============================================================================

export interface AdaptiveConstraintSummary {
  code: string
  label: string
  category: ConstraintCategory | string
  severity: ConstraintSeverity
  confidence: ConfidenceLevel | 'unknown'
  affectedSkills: string[]
  affectedMovementFamilies: string[]
  suggestedAction: SuggestedConstraintAction
  explanation: string
}

// =============================================================================
// ALLOWED ACTIONS — what the model permits for downstream layers
// =============================================================================

export interface AdaptiveAllowedActions {
  canProgress: boolean
  shouldHold: boolean
  shouldReduce: boolean
  shouldSubstitute: boolean
  shouldAddPrep: boolean
  shouldDeload: boolean
  shouldDeferSkill: boolean
}

// =============================================================================
// DISPLAY CONTRACT — human-readable summary for UI
// =============================================================================

export interface AdaptiveFoundationDisplay {
  headline: string
  summary: string
  confidenceLabel: string
  actionabilityLabel: string
  noMutationNote: string
  limiterSummary: string | null
  skillSummary: string | null
}

// =============================================================================
// MAIN MODEL
// =============================================================================

export interface AdaptiveFoundationModel {
  version: 'adaptive-foundation-v1'
  generatedAt: string
  sourceStatus: AdaptiveFoundationSourceStatus
  athlete: AdaptiveAthleteContext
  skillStates: AdaptiveSkillState[]
  constraints: AdaptiveConstraintSummary[]
  dominantLimiters: string[]
  allowedActions: AdaptiveAllowedActions
  display: AdaptiveFoundationDisplay
}

// =============================================================================
// BUILDER INPUT — what the resolver accepts
// =============================================================================

export interface AdaptiveFoundationInput {
  // Profile context
  experienceLevel?: string | null
  trainingStyle?: string | null
  trainingDaysPerWeek?: number | null
  equipment?: string[] | null
  primaryGoal?: string | null
  selectedGoals?: string[] | null
  selectedSkills?: string[] | null

  // Existing engine outputs (reuse, don't rebuild)
  constraintResult?: ConstraintResult | null
  constraintInsight?: { hasInsight: boolean; label: string } | null

  // [MASTER-3/4] Authoritative skill intent from program builder
  authoritativeMultiSkillIntentContract?: {
    selectedSkills?: string[]
    primarySkill?: string | null
    secondarySkill?: string | null
    supportSkills?: string[]
    deferredSkills?: Array<{
      skill: string
      reasonCode: string
      reasonLabel: string
      details?: string
    }>
    materiallyExpressedSkills?: string[]
    skillPriorityOrder?: Array<{
      skill: string
      role: 'primary' | 'secondary' | 'tertiary' | 'support' | 'deferred'
      priorityScore: number
      exposureSessions: number
    }>
    coverageVerdict?: 'strong' | 'adequate' | 'weak'
  } | null

  // Evidence flags
  hasWorkoutHistory?: boolean
  hasSkillLogs?: boolean
  hasReadinessData?: boolean
}

// =============================================================================
// PURE RESOLVER
// =============================================================================

function resolveDataQuality(input: AdaptiveFoundationInput): DataQualityLevel {
  let score = 0

  if (input.experienceLevel) score += 1
  if (input.selectedSkills && input.selectedSkills.length > 0) score += 1
  if (input.hasWorkoutHistory) score += 1
  if (input.hasSkillLogs) score += 1
  if (input.hasReadinessData) score += 1
  if (input.constraintResult && input.constraintResult.dataQuality !== 'insufficient') score += 1

  if (score >= 5) return 'strong'
  if (score >= 3) return 'usable'
  if (score >= 1) return 'partial'
  return 'insufficient'
}

function resolveSkillStates(input: AdaptiveFoundationInput): AdaptiveSkillState[] {
  const selectedSkills = input.selectedSkills || []
  const intentContract = input.authoritativeMultiSkillIntentContract
  const priorityOrder = intentContract?.skillPriorityOrder || []
  const deferredSkills = new Set((intentContract?.deferredSkills || []).map(d => d.skill))
  const supportSkills = new Set(intentContract?.supportSkills || [])
  const materialSkills = new Set(intentContract?.materiallyExpressedSkills || [])

  // Map priority order by skill for quick lookup
  const priorityMap = new Map(
    priorityOrder.map((p) => [p.skill, p])
  )

  return selectedSkills.map((skillKey, index) => {
    const priority = priorityMap.get(skillKey)
    const role = priority?.role || 'unknown'

    let expressionStatus: SkillExpressionStatus = 'unknown'
    if (role === 'primary' || role === 'secondary') {
      expressionStatus = 'direct_priority'
    } else if (role === 'support' || supportSkills.has(skillKey)) {
      expressionStatus = 'support'
    } else if (role === 'tertiary' || materialSkills.has(skillKey)) {
      expressionStatus = 'carryover'
    } else if (role === 'deferred' || deferredSkills.has(skillKey)) {
      expressionStatus = 'deferred'
    }

    return {
      skillKey,
      label: skillKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      selected: true,
      priorityRank: priority?.priorityScore ?? index + 1,
      expressionStatus,
      readinessStatus: null, // Future: consume readiness engine output
      limiterCodes: [],
      evidenceQuality: input.hasSkillLogs ? 'usable' : 'partial',
      nextSafeBias: input.hasWorkoutHistory ? 'hold' : 'needs_data',
    }
  })
}

function resolveConstraints(input: AdaptiveFoundationInput): AdaptiveConstraintSummary[] {
  const result = input.constraintResult
  if (!result) return []

  const constraints: AdaptiveConstraintSummary[] = []

  // Primary constraint
  if (result.primaryConstraint && result.primaryConstraint !== 'no_primary_constraint') {
    constraints.push({
      code: result.primaryConstraint,
      label: result.constraintLabel || result.primaryConstraint.replace(/_/g, ' '),
      category: result.category || 'none',
      severity: result.score >= 7 ? 'major' : result.score >= 4 ? 'moderate' : 'minor',
      confidence: result.confidence || 'low',
      affectedSkills: [],
      affectedMovementFamilies: [],
      suggestedAction: mapConstraintToAction(result.primaryConstraint),
      explanation: result.explanation || '',
    })
  }

  // Secondary constraint if present
  if (result.secondarySignal && result.secondarySignal !== 'no_primary_constraint') {
    constraints.push({
      code: result.secondarySignal,
      label: result.secondaryLabel || result.secondarySignal.replace(/_/g, ' '),
      category: 'none',
      severity: 'minor',
      confidence: 'low',
      affectedSkills: [],
      affectedMovementFamilies: [],
      suggestedAction: 'hold',
      explanation: '',
    })
  }

  return constraints
}

function mapConstraintToAction(constraintType: ConstraintType | string): SuggestedConstraintAction {
  switch (constraintType) {
    case 'fatigue_accumulation':
    case 'recovery_deficit':
      return 'deload'
    case 'progression_jump_too_large':
      return 'reduce'
    case 'skill_density_deficit':
    case 'inconsistent_skill_exposure':
      return 'hold'
    case 'pull_strength_deficit':
    case 'push_strength_deficit':
    case 'core_tension_deficit':
      return 'prep'
    case 'early_calibration':
    case 'building_consistency':
    case 'insufficient_data':
      return 'hold'
    default:
      return 'none'
  }
}

function resolveAllowedActions(
  dataQuality: DataQualityLevel,
  constraints: AdaptiveConstraintSummary[]
): AdaptiveAllowedActions {
  const majorConstraint = constraints.find((c) => c.severity === 'major')
  const needsRecovery = constraints.some(
    (c) => c.code === 'fatigue_accumulation' || c.code === 'recovery_deficit'
  )

  return {
    canProgress: dataQuality === 'strong' && !majorConstraint,
    shouldHold: dataQuality === 'partial' || dataQuality === 'usable',
    shouldReduce: !!majorConstraint,
    shouldSubstitute: false, // Future: injury/substitution layer
    shouldAddPrep: constraints.some((c) => c.suggestedAction === 'prep'),
    shouldDeload: needsRecovery,
    shouldDeferSkill: false, // Future: skill deferral layer
  }
}

function resolveDisplay(
  sourceStatus: AdaptiveFoundationSourceStatus,
  constraints: AdaptiveConstraintSummary[],
  skillStates: AdaptiveSkillState[],
  allowedActions: AdaptiveAllowedActions
): AdaptiveFoundationDisplay {
  // Headline based on data quality
  const qualityLabels: Record<DataQualityLevel, string> = {
    insufficient: 'Building baseline',
    partial: 'Partial evidence',
    usable: 'Usable foundation',
    strong: 'Strong foundation',
  }

  // Limiter summary
  let limiterSummary: string | null = null
  if (constraints.length > 0) {
    const primary = constraints[0]
    limiterSummary = `Primary limiter: ${primary.label}`
  } else if (sourceStatus.dataQuality === 'insufficient') {
    limiterSummary = 'More training data needed to identify limiters'
  }

  // Skill summary
  let skillSummary: string | null = null
  if (skillStates.length > 0) {
    const direct = skillStates.filter((s) => s.expressionStatus === 'direct_priority').length
    const support = skillStates.filter((s) => s.expressionStatus === 'support').length
    const other = skillStates.length - direct - support
    const parts: string[] = []
    if (direct > 0) parts.push(`${direct} direct`)
    if (support > 0) parts.push(`${support} support`)
    if (other > 0) parts.push(`${other} rotating`)
    skillSummary = parts.join(' · ')
  }

  // Actionability
  let actionabilityLabel = 'Monitor only'
  if (allowedActions.shouldDeload) {
    actionabilityLabel = 'Recovery priority'
  } else if (allowedActions.shouldReduce) {
    actionabilityLabel = 'Reduce load'
  } else if (allowedActions.shouldAddPrep) {
    actionabilityLabel = 'Prep-first'
  } else if (allowedActions.canProgress) {
    actionabilityLabel = 'Ready to progress'
  } else if (allowedActions.shouldHold) {
    actionabilityLabel = 'Hold steady'
  }

  return {
    headline: `Adaptive foundation: ${qualityLabels[sourceStatus.dataQuality]}`,
    summary: 'Skill priorities, constraints, and readiness mapped for future adjustments.',
    confidenceLabel: qualityLabels[sourceStatus.dataQuality],
    actionabilityLabel,
    noMutationNote: 'Foundation only — no automatic program changes applied by this layer yet.',
    limiterSummary,
    skillSummary,
  }
}

// =============================================================================
// MAIN BUILDER FUNCTION
// =============================================================================

export function buildAdaptiveFoundationModel(
  input: AdaptiveFoundationInput
): AdaptiveFoundationModel {
  // Source status
  const sourceStatus: AdaptiveFoundationSourceStatus = {
    hasProfileTruth: !!(input.experienceLevel || input.primaryGoal),
    hasSelectedSkills: !!(input.selectedSkills && input.selectedSkills.length > 0),
    hasWorkoutEvidence: !!input.hasWorkoutHistory,
    hasSkillEvidence: !!input.hasSkillLogs,
    hasReadinessEvidence: !!input.hasReadinessData,
    hasConstraintEvidence: !!(input.constraintResult || input.constraintInsight?.hasInsight),
    dataQuality: resolveDataQuality(input),
  }

  // Athlete context
  const athlete: AdaptiveAthleteContext = {
    experienceLevel: input.experienceLevel || null,
    trainingStyle: input.trainingStyle || null,
    trainingDays: input.trainingDaysPerWeek || null,
    equipmentSummary: input.equipment?.join(', ') || null,
    primaryGoal: input.primaryGoal || null,
    selectedGoals: input.selectedGoals || [],
  }

  // Skill states
  const skillStates = resolveSkillStates(input)

  // Constraints
  const constraints = resolveConstraints(input)

  // Dominant limiters
  const dominantLimiters = constraints.slice(0, 2).map((c) => c.label)

  // Allowed actions
  const allowedActions = resolveAllowedActions(sourceStatus.dataQuality, constraints)

  // Display
  const display = resolveDisplay(sourceStatus, constraints, skillStates, allowedActions)

  return {
    version: 'adaptive-foundation-v1',
    generatedAt: new Date().toISOString(),
    sourceStatus,
    athlete,
    skillStates,
    constraints,
    dominantLimiters,
    allowedActions,
    display,
  }
}

// =============================================================================
// EMPTY/DEFAULT MODEL FOR MISSING DATA
// =============================================================================

export function buildEmptyAdaptiveFoundationModel(): AdaptiveFoundationModel {
  return buildAdaptiveFoundationModel({})
}
