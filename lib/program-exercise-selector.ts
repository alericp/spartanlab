// Program Exercise Selector
// Selects optimal exercises based on goal, structure, equipment, and constraints

import type { PrimaryGoal, ExperienceLevel, SessionLength } from './program-service'
import type { DayFocus, DayStructure } from './program-structure-engine'
// [LIVE-EXECUTION-TRUTH] Band types for execution truth contract
import type { ResistanceBandColor } from './band-progression-engine'
import {
  type Exercise,
  type EquipmentType,
  type DifficultyLevel,
  SKILL_EXERCISES,
  STRENGTH_EXERCISES,
  ACCESSORY_EXERCISES,
  CORE_EXERCISES_POOL,
  WARMUP_EXERCISES,
  COOLDOWN_EXERCISES,
  FLEXIBILITY_EXERCISES,
  getExercisesByTransfer,
  hasRequiredEquipment,
  getAllExercises,
} from './adaptive-exercise-pool'
import { FLEXIBILITY_SEQUENCES, generateFlexibilitySession } from './flexibility-sequences'
import {
  type RangeTrainingMode,
  type RangeSkill,
  MOBILITY_EXERCISES,
  generateRangeSession,
  determineRangeTrainingMode,
  getSessionExplanation,
  getPlanRationale,
} from './range-training-system'
import {
  type MethodProfile,
  type MethodProfileId,
  type SkillType,
  METHOD_PROFILES,
  selectMethodProfiles,
  getExerciseMethodCompatibility,
  type SelectionContext,
  type SelectedMethods,
} from './training-principles-engine'
import {
  getAdaptedExercise,
  getProgressionUp,
  getProgressionDown,
  getBestSubstitute,
  getExerciseLadder,
  getFatigueRegression,
  type SubstituteOption,
} from './progression-ladders'
import {
  evaluateExerciseProgression,
  type ProgressionDecision,
  type ProgressionEvaluation,
} from './progression-decision-engine'
import {
  generateWarmUp,
  type GeneratedWarmUp,
  type WarmUpGenerationContext,
} from './warmup-engine'
import {
  generateCoolDown,
  type GeneratedCoolDown,
  type CoolDownGenerationContext,
  type FlexibilityPathway,
} from './cooldown-engine'
import {
  selectBestExercise,
  selectExercisesForCategory,
  findBestReplacement,
  validateExerciseSelection,
  getSkillExerciseRecommendations,
  selectRangeExercises,
  getShortExplanation,
  type ExerciseIntelligenceContext,
  type ExerciseScore,
  type IntelligentSelection,
} from './exercise-intelligence-engine'
import type { PerformanceEnvelope } from './performance-envelope-engine'
import type { MovementFamily, ArmType, TrunkDemand, ScapularDemand, SkillCarryover, StressLevel } from './movement-family-registry'
import {
  normalizeToMovementIntelligent,
  analyzeSessionPatterns,
  validateSessionCoherence,
  selectSupportForSkill,
  selectSupportForLimiter,
  getMovementIntelligentExercise,
  filterMovementIntelligent,
  LIMITER_MOVEMENT_REQUIREMENTS,
  type MovementIntelligentExercise,
  type SessionPatternAnalysis,
  type CoherenceCheckResult,
} from './movement-intelligence'
import {
  checkExercisePrerequisite,
  buildPrerequisiteContext,
  isGatedExercise,
  getExerciseKnowledgeBubble,
  type AthletePrerequisiteContext,
  type GateCheckResult,
} from './prerequisite-gate-engine'
import {
  buildExerciseLoadMetadata,
  calculateSessionLoad,
  determineSessionStyle,
  getSessionLoadBudget,
  validateSessionAntiBloat,
  generateSessionLoadRationale,
  type ExerciseLoadMetadata,
  type DeliveryStyle,
  type TrainingSessionStyle,
  type SessionLoadSummary,
} from './session-load-intelligence'
import {
  detectPrescriptionMode,
  resolvePrescription,
  formatPrescription,
  getAdvancedSkillPrescription,
  getWeeklyProgressionRecommendation,
  determineProgressionPhase,
  mapSupportToGoalsAndLimiters,
  logSupportWorkMapping,
  logPrescriptionDiagnostics,
  estimateWeightedLoadPrescription,
  determineWeightedPrescriptionMode,
  formatWeightedLoadDisplay,
  logWeightedLoadEstimation,
  type PrescriptionMode,
  type PrescriptionContract,
  type AthleteContext as PrescriptionAthleteContext,
  type AdvancedSkillPrescription,
  type WeeklyProgressionContext,
  type WeeklyProgressionRecommendation,
  type ProgressionPhase,
  type SupportWorkMapping,
  type WeightedBenchmark,
  type WeightedPRBenchmark,
  type WeightedLoadPrescription,
  type WeightedPrescriptionMode,
  // [PRESCRIPTION-INTELLIGENCE] Import canonical prescription resolver
  resolveCanonicalPrescription,
  inferExerciseRole,
  type PrescriptionTruthContext,
  type ExerciseRoleForPrescription,
} from './prescription-contract'
import {
  SKILL_SUPPORT_MAPPINGS,
  getSupportMapping,
  getDirectSupportExercises,
  type SkillSupportMapping,
  getAdvancedSkillSupport,
  isExercisePrimarySupportFor,
  getAllSupportExercisesFor,
  ADVANCED_SKILL_SUPPORT_PATTERNS,
} from './doctrine/skill-support-mappings'
// [PHASE 4] Doctrine DB exercise scoring integration
import {
  scoreExercisesWithDoctrine,
  applyDoctrineScoringToRankedCandidates,
  getDoctrineInfluenceSummary,
  // Synchronous scoring with pre-cached rules
  prefetchDoctrineRules,
  getCachedDoctrineRules,
  scoreExercisesWithDoctrineSync,
  applyDoctrineScoringSyncAndSort,
  type DoctrineScoreContext,
  type DoctrineScoreResult,
  type DoctrineScoringAudit,
  type CachedDoctrineRules,
} from './doctrine-exercise-scorer'

// [DOCTRINE RUNTIME CONTRACT] Import for upstream doctrine influence
import { type DoctrineRuntimeContract } from './doctrine-runtime-contract'

// [SESSION ARCHITECTURE TRUTH] Import for progression enforcement
import { 
  filterByCaptedProgression, 
  type SessionArchitectureTruthContract,
  type CurrentWorkingSkillCap 
} from './session-architecture-truth'

import {
  // Runtime exports
  getSkillPrescriptionRules,
  getWeightedStrengthCarryover,
  isAdvancedSkill,
  getAdvancedSkillFamily,
  ADVANCED_SKILL_FAMILIES,
  createMinimalTrace,
  logExerciseTrace,
  logSessionTrace,
  // Type exports
  type SkillPrescriptionRules,
  type WeightedStrengthCarryover,
  type ExerciseSelectionTrace,
  type ExerciseSelectionReason,
  type TraceExpressionMode,
  type TraceSessionRole,
  type WeightedDecisionTrace,
  type WeightedBlockerReason,
  type RejectedAlternative,
  type RejectionReason,
  type DoctrineSourceTrace,
  type SessionSelectionTrace,
  type SkillExpressionMode,
} from './engine-quality-contract'
import {
  hasLoadableEquipment,
  checkWeightedPrescriptionEligibility,
} from './canonical-profile-service'

// [EXERCISE-SELECTION-MATERIALITY] Import materiality engine for intelligent ranking
import {
  scoreExerciseMateriality,
  rankCandidatesForSlot,
  selectBestExerciseForSlot,
  buildExerciseSelectionMaterialityContext,
  logMaterialityRankingAudit,
  type ExerciseMaterialityContext,
  type ExerciseMaterialityScore,
  type SlotType,
  type SlotMaterialityRanking,
  type MaterialityReasonCode,
} from './program-generation/exercise-selection-materiality'

// =============================================================================
// [EXERCISE-SELECTION-RUNTIME-STABILIZATION] SAFE STRING NORMALIZATION LAYER
// Prevents undefined.toLowerCase() crashes in skill/exercise matching
// =============================================================================

/**
 * Safely convert any value to lowercase string.
 * Returns empty string for null/undefined/non-string values.
 * [ROOT-CAUSE-FIX] This is the authoritative safe normalizer for all skill/exercise matching.
 */
function safeLower(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'string') return String(value).toLowerCase().trim()
  return value.toLowerCase().trim()
}

// =============================================================================
// [DOCTRINE-MATERIALIZATION-ENGINE] DOSAGE TRANSFORMATION HELPERS
// These functions transform prescriptions based on doctrine decisions
// =============================================================================

/**
 * Transform reps/time for quality emphasis (fewer reps, higher precision)
 */
function transformRepsForQuality(repsOrTime: string): string {
  // Handle rep ranges like "8-12" -> "5-8"
  const repRangeMatch = repsOrTime.match(/^(\d+)-(\d+)$/)
  if (repRangeMatch) {
    const low = Math.max(3, Math.floor(parseInt(repRangeMatch[1]) * 0.7))
    const high = Math.max(5, Math.floor(parseInt(repRangeMatch[2]) * 0.7))
    return `${low}-${high}`
  }
  // Handle single rep count like "10" -> "6-8"
  const singleRepMatch = repsOrTime.match(/^(\d+)$/)
  if (singleRepMatch) {
    const base = parseInt(singleRepMatch[1])
    const reduced = Math.max(4, Math.floor(base * 0.7))
    return `${reduced}-${reduced + 2}`
  }
  // Handle time-based like "30s" -> unchanged (quality already implied)
  return repsOrTime
}

/**
 * Transform reps/time for recovery emphasis (lower overall stress)
 */
function transformRepsForRecovery(repsOrTime: string): string {
  // Handle rep ranges like "8-12" -> "6-10"
  const repRangeMatch = repsOrTime.match(/^(\d+)-(\d+)$/)
  if (repRangeMatch) {
    const low = Math.max(4, parseInt(repRangeMatch[1]) - 2)
    const high = Math.max(6, parseInt(repRangeMatch[2]) - 2)
    return `${low}-${high}`
  }
  // Handle time-based like "30s" -> "20-25s"
  const timeMatch = repsOrTime.match(/^(\d+)s?$/)
  if (timeMatch && repsOrTime.includes('s')) {
    const seconds = parseInt(timeMatch[1])
    const reduced = Math.max(10, Math.floor(seconds * 0.75))
    return `${reduced}s`
  }
  return repsOrTime
}

/**
 * Transform to hold-time emphasis for static skill work
 */
function transformToHoldEmphasis(repsOrTime: string, intensityBias: string): string {
  // If already time-based, adjust based on intensity
  const timeMatch = repsOrTime.match(/^(\d+)s?$/)
  if (timeMatch && repsOrTime.includes('s')) {
    const seconds = parseInt(timeMatch[1])
    if (intensityBias === 'conservative') {
      return `${Math.max(10, Math.floor(seconds * 0.8))}s`
    } else if (intensityBias === 'aggressive') {
      return `${Math.min(45, Math.ceil(seconds * 1.2))}s`
    }
    return repsOrTime
  }
  // Convert rep-based to hold emphasis for static work
  const repRangeMatch = repsOrTime.match(/^(\d+)-(\d+)$/)
  if (repRangeMatch) {
    // Convert reps to reasonable hold durations (e.g., "5-8" reps -> "15-25s" holds)
    const low = parseInt(repRangeMatch[1])
    if (intensityBias === 'conservative') {
      return `${Math.max(10, low * 3)}s`
    } else if (intensityBias === 'aggressive') {
      return `${Math.min(35, low * 5)}s`
    }
    return `${low * 4}s`
  }
  return repsOrTime
}

/**
 * Apply spine-specific dosage transformations
 * Different training spines get fundamentally different prescription characters
 */
function applySpineDosageTransform(
  dominantSpine: string | null,
  repsOrTime: string,
  exercise: { category?: string; isIsometric?: boolean; name?: string; id?: string },
  intensityBias: string
): { modified: boolean; repsOrTime: string; noteAddition?: string } {
  if (!dominantSpine) return { modified: false, repsOrTime }
  
  const exName = safeLower(exercise.name || '')
  const exId = safeLower(exercise.id || '')
  const category = exercise.category || ''
  
  switch (dominantSpine) {
    case 'static_skill_mastery': {
      // Static skills: shorter sets, quality holds, more rest implied
      const isStaticRelevant = category === 'skill' || category === 'hold' ||
        exName.includes('lever') || exName.includes('planche') || exName.includes('handstand') ||
        exName.includes('l-sit') || exName.includes('hold')
      if (isStaticRelevant) {
        // Ensure hold-style prescriptions
        if (!repsOrTime.includes('s') && !repsOrTime.includes('hold')) {
          const repMatch = repsOrTime.match(/^(\d+)/)
          if (repMatch) {
            const baseReps = parseInt(repMatch[1])
            const holdTime = intensityBias === 'conservative' ? baseReps * 3 : 
                            intensityBias === 'aggressive' ? baseReps * 5 : baseReps * 4
            return {
              modified: true,
              repsOrTime: `${Math.max(10, Math.min(30, holdTime))}s`,
              noteAddition: 'Static skill focus: prioritize hold quality'
            }
          }
        }
      }
      return { modified: false, repsOrTime }
    }
    
    case 'weighted_strength': {
      // Weighted strength: lower reps, higher intensity implied
      const isStrengthRelevant = category === 'strength' || category === 'compound' ||
        exName.includes('weighted') || exName.includes('dip') || exName.includes('pull')
      if (isStrengthRelevant) {
        const repRangeMatch = repsOrTime.match(/^(\d+)-(\d+)$/)
        if (repRangeMatch) {
          const low = parseInt(repRangeMatch[1])
          const high = parseInt(repRangeMatch[2])
          // Shift to strength rep ranges
          if (high > 8) {
            const newLow = Math.max(3, low - 2)
            const newHigh = Math.max(6, high - 3)
            return {
              modified: true,
              repsOrTime: `${newLow}-${newHigh}`,
              noteAddition: 'Strength focus: controlled tempo, full ROM'
            }
          }
        }
      }
      return { modified: false, repsOrTime }
    }
    
    case 'dynamic_skill': {
      // Dynamic skills: moderate reps, explosive intent
      const isDynamicRelevant = category === 'skill' || category === 'power' ||
        exName.includes('muscle') || exName.includes('explosive') || exName.includes('kip')
      if (isDynamicRelevant) {
        return {
          modified: true,
          repsOrTime: repsOrTime,
          noteAddition: 'Dynamic skill focus: explosive intent, full recovery between sets'
        }
      }
      return { modified: false, repsOrTime }
    }
    
    case 'foundation_building': {
      // Foundation: moderate volume, emphasis on form
      const repRangeMatch = repsOrTime.match(/^(\d+)-(\d+)$/)
      if (repRangeMatch) {
        const low = parseInt(repRangeMatch[1])
        const high = parseInt(repRangeMatch[2])
        // Keep in moderate hypertrophy/skill range
        if (low < 6) {
          return {
            modified: true,
            repsOrTime: `${low + 2}-${high + 2}`,
            noteAddition: 'Foundation phase: prioritize form and volume tolerance'
          }
        }
      }
      return { modified: false, repsOrTime }
    }
    
    default:
      return { modified: false, repsOrTime }
  }
}

/**
 * Safely extract skill key from various skill allocation shapes.
 * Handles missing/malformed skill fields gracefully.
 */
function safeSkillKey(skillAlloc: { skill?: string | null } | null | undefined): string {
  if (!skillAlloc) return ''
  return safeLower(skillAlloc.skill)
}

/**
 * Safely get exercise ID in lowercase.
 */
function safeExerciseId(exercise: { id?: string | null } | null | undefined): string {
  if (!exercise) return ''
  return safeLower(exercise.id)
}

/**
 * Safely get exercise name in lowercase.
 */
function safeExerciseName(exercise: { name?: string | null } | null | undefined): string {
  if (!exercise) return ''
  return safeLower(exercise.name)
}

/**
 * Safely get exercise category in lowercase.
 */
function safeExerciseCategory(exercise: { category?: string | null } | null | undefined): string {
  if (!exercise) return ''
  return safeLower(exercise.category)
}

/**
 * Safely normalize transferTo array to lowercase strings.
 * Filters out null/undefined entries.
 */
function safeTransferTargets(transferTo: (string | null | undefined)[] | null | undefined): string[] {
  if (!transferTo || !Array.isArray(transferTo)) return []
  return transferTo
    .filter((t): t is string => t !== null && t !== undefined && typeof t === 'string')
    .map(t => safeLower(t))
}

/**
 * Safely check if exercise transfers to a skill.
 * Returns false instead of crashing on undefined values.
 */
function exerciseTransfersToSkill(
  exercise: { transferTo?: (string | null | undefined)[] | null } | null | undefined,
  skill: string | null | undefined
): boolean {
  if (!exercise || !skill) return false
  const skillLower = safeLower(skill)
  if (!skillLower) return false
  const targets = safeTransferTargets(exercise.transferTo)
  return targets.some(t => t.includes(skillLower))
}

/**
 * Safely check if exercise ID or name includes a skill.
 */
function exerciseMatchesSkillByName(
  exercise: { id?: string | null; name?: string | null } | null | undefined,
  skill: string | null | undefined
): boolean {
  if (!exercise || !skill) return false
  const skillLower = safeLower(skill)
  if (!skillLower) return false
  const idLower = safeExerciseId(exercise)
  const nameLower = safeExerciseName(exercise)
  return idLower.includes(skillLower) || nameLower.includes(skillLower)
}

// =============================================================================
// [PHASE15E-SELECTOR-INPUT-TRUTH] Normalized Exercise Candidate Shape
// This interface defines the AUTHORITATIVE normalized shape for exercise
// candidates inside selector logic. All filtering/scoring/fill logic MUST
// consume this shape instead of raw optional fields to prevent mixed-read crashes.
// =============================================================================

interface NormalizedExerciseCandidate {
  /** Original exercise object (preserved for return values) */
  raw: Exercise
  /** Safe normalized string fields */
  id: string
  name: string
  category: string
  movementFamily: string
  movementPattern: string
  progressionLadder: string
  intensity: string
  /** Safe normalized array fields */
  transferTo: string[]
  tags: string[]
  primarySkills: string[]
  targetMuscles: string[]
  /** Safe numeric fields with fallback defaults */
  fatigueCost: number
  carryover: number
  neuralDemand: number
  /** Derived flags for fast checks */
  isPushMovement: boolean
  isPullMovement: boolean
  isSkillExercise: boolean
  isStrengthExercise: boolean
}

/**
 * [PHASE15E-SELECTOR-INPUT-TRUTH] Normalize a raw exercise into authoritative shape.
 * This function MUST be called once at pool assembly to create normalized candidates.
 * All downstream selector logic MUST consume normalized candidates, not raw exercises.
 */
function normalizeExerciseCandidate(exercise: Exercise): NormalizedExerciseCandidate {
  const id = safeLower(exercise.id)
  const name = safeLower(exercise.name)
  const category = safeLower(exercise.category)
  const movementFamily = safeLower((exercise as any).movementFamily)
  const movementPattern = safeLower((exercise as any).movementPattern)
  const progressionLadder = safeLower((exercise as any).progressionLadder)
  const intensity = safeLower((exercise as any).intensity)
  
  // Normalize array fields - filter out null/undefined entries
  const transferTo = safeTransferTargets((exercise as any).transferTo)
  const tags = Array.isArray((exercise as any).tags) 
    ? ((exercise as any).tags as any[]).filter((t): t is string => typeof t === 'string').map(t => safeLower(t))
    : []
  const primarySkills = Array.isArray((exercise as any).primarySkills)
    ? ((exercise as any).primarySkills as any[]).filter((s): s is string => typeof s === 'string').map(s => safeLower(s))
    : []
  const targetMuscles = Array.isArray((exercise as any).targetMuscles)
    ? ((exercise as any).targetMuscles as any[]).filter((m): m is string => typeof m === 'string').map(m => safeLower(m))
    : []
  
  // Normalize numeric fields with fallback defaults
  const fatigueCost = typeof (exercise as any).fatigueCost === 'number' ? (exercise as any).fatigueCost : 5
  const carryover = typeof (exercise as any).carryover === 'number' ? (exercise as any).carryover : 0
  const neuralDemand = typeof (exercise as any).neuralDemand === 'number' ? (exercise as any).neuralDemand : 5
  
  // Derive fast check flags
  const isPushMovement = movementPattern.includes('push') || movementFamily.includes('push') || 
                         category.includes('push') || transferTo.some(t => t.includes('planche') || t.includes('hspu') || t.includes('dip'))
  const isPullMovement = movementPattern.includes('pull') || movementFamily.includes('pull') ||
                         category.includes('pull') || transferTo.some(t => t.includes('front_lever') || t.includes('pull') || t.includes('row'))
  const isSkillExercise = category === 'skill' || intensity === 'skill' || tags.includes('skill')
  const isStrengthExercise = category === 'strength' || intensity === 'strength' || tags.includes('strength')
  
  return {
    raw: exercise,
    id,
    name,
    category,
    movementFamily,
    movementPattern,
    progressionLadder,
    intensity,
    transferTo,
    tags,
    primarySkills,
    targetMuscles,
    fatigueCost,
    carryover,
    neuralDemand,
    isPushMovement,
    isPullMovement,
    isSkillExercise,
    isStrengthExercise,
  }
}

/**
 * [PHASE15E-SELECTOR-INPUT-TRUTH] Normalize an entire pool of exercises.
 * Use this at pool assembly to create authoritative normalized candidates.
 */
function normalizeExercisePool(exercises: Exercise[]): NormalizedExerciseCandidate[] {
  return exercises.map(normalizeExerciseCandidate)
}

/**
 * [PHASE15E-SELECTOR-INPUT-TRUTH] Safe transfer check on normalized candidate.
 * Uses pre-normalized transferTo array - no risk of undefined.includes() crash.
 */
function normalizedTransfersTo(candidate: NormalizedExerciseCandidate, skill: string): boolean {
  if (!skill) return false
  const skillLower = safeLower(skill)
  return candidate.transferTo.some(t => t.includes(skillLower) || skillLower.includes(t))
}

/**
 * [PHASE15E-SELECTOR-INPUT-TRUTH] Safe movement pattern check on normalized candidate.
 * Uses pre-normalized movementPattern - no risk of undefined.includes() crash.
 */
function normalizedMatchesMovement(candidate: NormalizedExerciseCandidate, pattern: string): boolean {
  if (!pattern) return false
  const patternLower = safeLower(pattern)
  return candidate.movementPattern.includes(patternLower) || candidate.movementFamily.includes(patternLower)
}

/**
 * [PHASE15E-SELECTOR-INPUT-TRUTH] Safe tag check on normalized candidate.
 */
function normalizedHasTag(candidate: NormalizedExerciseCandidate, tag: string): boolean {
  if (!tag) return false
  const tagLower = safeLower(tag)
  return candidate.tags.some(t => t.includes(tagLower))
}

// =============================================================================
// End of Normalized Exercise Candidate infrastructure
// =============================================================================

/**
 * Validate session skill allocation array.
 * Filters out entries with missing/invalid skill keys.
 */
function validateSessionSkills(
  skills: Array<{ skill?: string | null; expressionMode?: string; weight?: number }> | null | undefined
): Array<{ skill: string; expressionMode: string; weight: number }> {
  if (!skills || !Array.isArray(skills)) return []
  return skills
    .filter(s => s && typeof s.skill === 'string' && s.skill.trim() !== '')
    .map(s => ({
      skill: s.skill!.trim(),
      expressionMode: s.expressionMode || 'support',
      weight: s.weight ?? 1,
    }))
}

/**
 * Validate material skill intent array.
 * Filters out entries with missing/invalid skill keys.
 */
function validateMaterialSkillIntent(
  intent: Array<{ skill?: string | null; role?: string; currentWorkingProgression?: string | null; historicalCeiling?: string | null }> | null | undefined
): Array<{ skill: string; role: string; currentWorkingProgression: string | null; historicalCeiling: string | null }> {
  if (!intent || !Array.isArray(intent)) return []
  return intent
    .filter(i => i && typeof i.skill === 'string' && i.skill.trim() !== '')
    .map(i => ({
      skill: i.skill!.trim(),
      role: i.role || 'support',
      currentWorkingProgression: i.currentWorkingProgression ?? null,
      historicalCeiling: i.historicalCeiling ?? null,
    }))
}

// =============================================================================
// [AI_SESSION_MATERIALITY_PHASE] Session-level skill expression capture
// Module-level state to capture skill expression results from selectMainExercises
// for propagation to ExerciseSelection return
// =============================================================================
interface SessionSkillExpressionCapture {
  directlyExpressedSkills: string[]
  technicalSlotSkills: string[]
  supportSkillsInjected: string[]
  supportSkillsDeferred: Array<{ skill: string; reason: string }>
  tertiarySkillsInjected: string[]
  tertiarySkillsDeferred: Array<{ skill: string; reason: string }>
  carryoverSkills: string[]
  progressionAuthorityUsed: Array<{
    skill: string
    currentWorking: string | null
    historical: string | null
    authorityUsed: 'current_working' | 'historical' | 'none'
  }>
  materialityVerdict: 'PASS' | 'WARN' | 'FAIL'
  materialityIssues: string[]
}

// Session-scoped capture - reset per selectExercisesForSession call
let _lastSessionSkillExpressionCapture: SessionSkillExpressionCapture | null = null

function resetSessionSkillExpressionCapture(): void {
  _lastSessionSkillExpressionCapture = {
    directlyExpressedSkills: [],
    technicalSlotSkills: [],
    supportSkillsInjected: [],
    supportSkillsDeferred: [],
    tertiarySkillsInjected: [],
    tertiarySkillsDeferred: [],
    carryoverSkills: [],
    progressionAuthorityUsed: [],
    materialityVerdict: 'PASS',
    materialityIssues: [],
  }
}

function captureSkillExpressionResult(data: Partial<SessionSkillExpressionCapture>): void {
  if (!_lastSessionSkillExpressionCapture) {
    resetSessionSkillExpressionCapture()
  }
  Object.assign(_lastSessionSkillExpressionCapture!, data)
}

function getSessionSkillExpressionCapture(): SessionSkillExpressionCapture | null {
  return _lastSessionSkillExpressionCapture
}

// =============================================================================
// [PHASE 4E — DOCTRINE CAUSAL AUDIT CAPTURE]
//
// Mirrors the skill-expression capture pattern above. Module-level mutable
// state is safe here because session generation is sequential within a single
// program build (the builder loops day-by-day; selectExercisesForSession is
// not called concurrently).
//
// The pre-Phase-4E bug:
//   `sessionDoctrineAudit` was a let-bound local inside selectMainExercises
//   (L4199). It tracked topCandidateChanged / top3Changed across every
//   applyDoctrineToPool() call within the session, then was discarded on
//   return because selectMainExercises returns just `finalExercises: SelectedExercise[]`.
//   Result: the builder had real doctrine causal data per scoring call, but
//   never received any of it. Every "doctrine applied" claim downstream was
//   derived from rule/source counts, not from "did doctrine actually pick
//   a different winner?"
//
// Post-fix:
//   selectMainExercises calls captureSessionDoctrineAudit at the same merge
//   point that updates sessionDoctrineAudit. selectExercisesForSession resets
//   the capture at start (mirroring resetSessionSkillExpressionCapture) and
//   reads it into the ExerciseSelection return.
// =============================================================================

let _lastSessionDoctrineAudit: DoctrineScoringAudit | null = null

function resetSessionDoctrineAudit(): void {
  _lastSessionDoctrineAudit = null
}

function captureSessionDoctrineAudit(audit: DoctrineScoringAudit | null): void {
  // Idempotent: callers may pass null to skip; we only capture real data.
  if (!audit) return
  _lastSessionDoctrineAudit = audit
}

function getSessionDoctrineAudit(): DoctrineScoringAudit | null {
  return _lastSessionDoctrineAudit
}

export interface SelectedExercise {
  exercise: Exercise
  sets: number
  repsOrTime: string
  note?: string
  isOverrideable: boolean
  selectionReason: string
  // Prerequisite Gate fields
  gateCheckResult?: GateCheckResult
  knowledgeBubble?: string
  wasSubstituted?: boolean
  originalExerciseId?: string
  // Session Load Intelligence fields
  loadMetadata?: ExerciseLoadMetadata
  deliveryStyle?: DeliveryStyle
  // Weighted Load Prescription fields (TASK 3 of Weighted Load PR)
  prescribedLoad?: {
    load: number              // Actual weight to add (e.g., 20 for +20 lbs)
    unit: 'lbs' | 'kg'        // Weight unit
    basis: 'current_benchmark' | 'pr_reference' | 'estimated' | 'no_data'
    confidenceLevel: 'high' | 'moderate' | 'low' | 'none'
    estimated1RM?: number     // Estimated 1RM for reference
    targetReps?: number       // Target reps for this prescription
    intensityBand?: 'strength' | 'support_volume' | 'hypertrophy'
    notes?: string[]          // Context/coaching notes
  }
  // [weighted-prescription-truth] ISSUE E: RPE and rest metadata for coaching truth
  targetRPE?: number          // Target RPE (7-9 typical for strength, 5-7 for mobility)
  restSeconds?: number        // Recommended rest in seconds
  // [weighted-truth] TASK F: No-load reason contract for explicit fallback tracking
  noLoadReason?: 'no_loadable_equipment' | 'missing_strength_inputs' | 'exercise_not_load_eligible' | 
                 'low_confidence_estimate_blocked' | 'doctrine_prefers_bodyweight' | 'skill_day_non_loaded_variant' |
                 'support_day_volume_bias' | 'assisted_variant_selected' | 'recovery_session_role' | 
                 'fallback_after_validation' | null
  // [exercise-trace] TASK 2: Full selection traceability
  selectionTrace?: ExerciseSelectionTrace
  // [PHASE-1B-CONTEXT-WIRE] Session-assembly classifier context.
  // Pre-Phase-1B, ~13 read sites (lines 5209, 5326, 6096, 6310, 6458, 6690 et al.)
  // consumed `selectionContext?.sessionRole`, `selectionContext?.influencingSkills`,
  // and `selectionContext?.primarySelectionReason` to classify each row into
  // primary / secondary / support / other buckets for the session-architecture
  // enforcement pass. However, this field was NEVER populated anywhere — a
  // dead wire. That is why selected secondary/tertiary skills appeared in
  // upstream selector logic but invisibly collapsed into the `currentOther`
  // bucket during architecture slot-count enforcement, which then trimmed
  // them under `maxExercises` pressure.
  //
  // This field is now populated by `addExercise` directly from the same
  // traceContext used for `selectionTrace`. Downstream classifiers require
  // NO code changes — the existing reads simply start returning real data.
  selectionContext?: {
    primarySelectionReason: string
    sessionRole: string
    expressionMode: string
    influencingSkills: Array<{
      skillId: string
      influence: 'primary' | 'secondary' | 'selected' | 'limiter_related'
      expressionMode: string
    }>
    doctrineSource: DoctrineSourceTrace | null
  }
  // [LIVE-EXECUTION-TRUTH] Authoritative runtime execution contract
  // This replaces heuristic-based band/progression detection in the live workout runner
  executionTruth?: {
    sourceSkill: string | null
    currentWorkingProgression: string | null
    historicalCeiling: string | null
    usesConservativeStart: boolean
    assistedRecommended: boolean
    assistedAllowed: boolean
    bandRecommended: boolean
    recommendedBandColor: ResistanceBandColor | null
    bandSelectable: boolean
    fallbackEasierExerciseId: string | null
    fallbackEasierExerciseName: string | null
    fallbackEasierBandColor: ResistanceBandColor | null
    downgradeTrigger: {
      highRpeThreshold: number
      missedTargetThreshold: number
      allowAutoAdjust: boolean
    } | null
    explanationNote: string | null
  }
}

// =============================================================================
// PREREQUISITE GATE CHECK WRAPPER
// =============================================================================

/**
 * Apply prerequisite gate checks to an exercise selection
 * Returns the exercise (or safe substitute) with gate metadata
 */
function applyPrerequisiteGate(
  exercise: Exercise,
  context: AthletePrerequisiteContext | undefined,
  experienceLevel: ExperienceLevel
): { exercise: Exercise; gateResult: GateCheckResult; wasSubstituted: boolean; originalId?: string } {
  // Build context if not provided
  const prerequisiteContext = context || buildPrerequisiteContext({
    experienceLevel,
  })
  
  // Check if this exercise passes the gate
  const gateResult = checkExercisePrerequisite(exercise.id, prerequisiteContext)
  
  if (gateResult.allowed) {
    return { exercise, gateResult, wasSubstituted: false }
  }
  
  // Exercise not allowed - find substitute
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  if (gateResult.recommendedSubstitute) {
    const allExercises = getAllExercises()
    const substitute = allExercises.find(e => 
      e.id === gateResult.recommendedSubstitute!.exerciseId ||
      safeExerciseName(e).replace(/\s+/g, '_') === gateResult.recommendedSubstitute!.exerciseId
    )
    
    if (substitute) {
      return {
        exercise: substitute,
        gateResult,
        wasSubstituted: true,
        originalId: exercise.id,
      }
    }
  }
  
  // No substitute found - return original with warning
  return { exercise, gateResult, wasSubstituted: false }
}

// =============================================================================
// [SESSION-ARCHITECTURE-OWNERSHIP] Session Architecture Contract Builder
// Converts the composition blueprint into actionable slot allocation decisions
// =============================================================================

interface SessionArchitectureContract {
  sessionIntent: string
  sessionComplexity: 'minimal' | 'standard' | 'comprehensive'
  slotAllocation: {
    primaryWork: number      // Number of primary skill/strength slots
    secondaryWork: number    // Number of secondary work slots
    supportWork: number      // Number of support/carryover slots
    accessoryWork: number    // Number of accessory slots
    conditioningWork: number // Number of finisher/conditioning slots
  }
  methodDecisions: {
    supersetsAllowed: boolean
    circuitsAllowed: boolean
    densityBlocksAllowed: boolean
    finisherAllowed: boolean
  }
  workloadDistribution: {
    primaryPercent: number
    secondaryPercent: number
    supportPercent: number
    conditioningPercent: number
  }
  dayRoleEnforcement: {
    dayRole: string
    mustDominatePrimary: boolean
    secondaryContainmentLevel: 'none' | 'minimal' | 'moderate'
    supportPurpose: string
  }
  templateEscaped: boolean
}

function buildSessionArchitectureContract(
  blueprint: import('./program-generation/session-composition-intelligence').SessionCompositionBlueprint | null | undefined,
  day: DayStructure,
  primaryGoal: PrimaryGoal,
  experienceLevel: ExperienceLevel,
  sessionMinutes: number
): SessionArchitectureContract {
  // If we have a canonical blueprint, use it to drive decisions
  if (blueprint) {
    // Count blocks by role category
    const primaryBlocks = blueprint.blocks.filter(b => 
      b.role === 'primary_skill' || b.role === 'primary_strength'
    ).length
    const secondaryBlocks = blueprint.blocks.filter(b => 
      b.role === 'secondary_skill' || b.role === 'secondary_strength'
    ).length
    const supportBlocks = blueprint.blocks.filter(b => 
      b.role === 'support_carryover' || b.role === 'accessory_targeted'
    ).length
    const conditioningBlocks = blueprint.blocks.filter(b => 
      b.role === 'method_density' || b.role === 'finisher_conditioning'
    ).length
    
    // Convert method eligibility to boolean decisions
    const supersetsAllowed = blueprint.methodEligibility.supersets === 'earned' || 
                             blueprint.methodEligibility.supersets === 'allowed'
    const circuitsAllowed = blueprint.methodEligibility.circuits === 'earned' || 
                            blueprint.methodEligibility.circuits === 'allowed'
    const densityAllowed = blueprint.methodEligibility.density === 'earned' || 
                           blueprint.methodEligibility.density === 'allowed'
    const finisherAllowed = blueprint.methodEligibility.finisher === 'earned' || 
                            blueprint.methodEligibility.finisher === 'allowed'
    
    // Derive day role from intent and blocks
    const isPrimaryFocusDay = primaryBlocks >= 1 && 
      blueprint.workloadDistribution.primaryWorkPercent >= 40
    const secondaryContainment = 
      blueprint.workloadDistribution.secondaryWorkPercent <= 15 ? 'minimal' :
      blueprint.workloadDistribution.secondaryWorkPercent <= 25 ? 'moderate' : 'none'
    
    // Determine support purpose from composition reasons
    const supportReasons = blueprint.compositionReasons.filter(r => 
      r.code === 'support_carryover_placement' || 
      r.code === 'current_progression_fit'
    )
    const supportPurpose = supportReasons.length > 0 
      ? supportReasons[0].description 
      : 'general support for primary goal'
    
    return {
      sessionIntent: blueprint.sessionIntent,
      sessionComplexity: blueprint.sessionComplexity,
      slotAllocation: {
        primaryWork: Math.max(1, primaryBlocks * 2),    // ~2 exercises per block
        secondaryWork: secondaryBlocks * 2,
        supportWork: Math.max(1, supportBlocks * 2),
        accessoryWork: blueprint.sessionComplexity === 'comprehensive' ? 2 : 1,
        conditioningWork: conditioningBlocks > 0 ? 1 : 0,
      },
      methodDecisions: {
        supersetsAllowed,
        circuitsAllowed,
        densityBlocksAllowed: densityAllowed,
        finisherAllowed,
      },
      workloadDistribution: {
        primaryPercent: blueprint.workloadDistribution.primaryWorkPercent,
        secondaryPercent: blueprint.workloadDistribution.secondaryWorkPercent,
        supportPercent: blueprint.workloadDistribution.supportWorkPercent,
        conditioningPercent: blueprint.workloadDistribution.conditioningPercent,
      },
      dayRoleEnforcement: {
        dayRole: blueprint.sessionIntent,
        mustDominatePrimary: isPrimaryFocusDay,
        secondaryContainmentLevel: secondaryContainment,
        supportPurpose,
      },
      templateEscaped: blueprint.audit.templateEscaped,
    }
  }
  
  // Fallback: Build heuristic contract when no blueprint available
  // This maintains backward compatibility but marks as template-based
  const isShortSession = sessionMinutes <= 30
  const isMediumSession = sessionMinutes <= 45
  const complexity = isShortSession ? 'minimal' : isMediumSession ? 'standard' : 'comprehensive'
  
  // [PHASE15E-EXERCISE-SELECTION-FIX] Guard against undefined day.focus
  const safeFocus = day?.focus || 'mixed_upper'
  const isPushFocus = safeFocus.includes('push')
  const isPullFocus = safeFocus.includes('pull')
  const isSkillFocus = safeFocus.includes('skill')
  
  return {
    sessionIntent: `${safeFocus} session for ${primaryGoal}`,
    sessionComplexity: complexity,
    slotAllocation: {
      primaryWork: isShortSession ? 2 : 3,
      secondaryWork: complexity === 'minimal' ? 0 : 1,
      supportWork: complexity === 'comprehensive' ? 2 : 1,
      accessoryWork: complexity === 'minimal' ? 0 : 1,
      conditioningWork: complexity === 'comprehensive' ? 1 : 0,
    },
    methodDecisions: {
      supersetsAllowed: !isSkillFocus && complexity !== 'minimal',
      circuitsAllowed: !isSkillFocus && complexity === 'comprehensive',
      densityBlocksAllowed: complexity === 'comprehensive',
      finisherAllowed: complexity !== 'minimal',
    },
    workloadDistribution: {
      primaryPercent: 50,
      secondaryPercent: 15,
      supportPercent: 25,
      conditioningPercent: 10,
    },
    dayRoleEnforcement: {
      dayRole: day.focus,
      mustDominatePrimary: true,
      secondaryContainmentLevel: 'moderate',
      supportPurpose: 'general carryover support',
    },
    templateEscaped: false, // Fallback is always template-based
  }
}

export interface ExerciseSelection {
  warmup: SelectedExercise[]
  main: SelectedExercise[]
  cooldown: SelectedExercise[]
  totalEstimatedTime: number
  // Session Load Intelligence fields
  sessionLoadSummary?: SessionLoadSummary
  sessionStyle?: TrainingSessionStyle
  loadRationale?: string[]
  antiBloatValidation?: {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  }
  // [exercise-trace] TASK 5: Session-level trace summary
  sessionTrace?: {
    sessionRole: 'primary_focus' | 'secondary_focus' | 'mixed' | 'support_heavy' | 'recovery'
    primarySkillExpressed: string | null
    secondarySkillExpressed: string | null
    exerciseCount: number
    weightedExerciseCount: number
    doctrineHitCount: number
    rejectedAlternativeCount: number
  }
  // [AI_SESSION_MATERIALITY_PHASE] Session skill expression metadata
  // This makes the actual skill materiality visible and traceable
  skillExpressionResult?: {
    directlyExpressedSkills: string[]
    technicalSlotSkills: string[]
    supportSkillsInjected: string[]
    supportSkillsDeferred: Array<{ skill: string; reason: string }>
    tertiarySkillsInjected: string[]
    tertiarySkillsDeferred: Array<{ skill: string; reason: string }>
    carryoverSkills: string[]
    progressionAuthorityUsed: Array<{
      skill: string
      currentWorking: string | null
      historical: string | null
      authorityUsed: 'current_working' | 'historical' | 'none'
    }>
    materialityVerdict: 'PASS' | 'WARN' | 'FAIL'
    materialityIssues: string[]
  }
  // [DOCTRINE-RELAXATION-RESCUE] Track if doctrine constraints were relaxed
  doctrineRelaxationApplied?: boolean
  doctrineRelaxationReason?: string
  // [PHASE 4E — DOCTRINE CAUSAL AUDIT SURFACE]
  // Pre-fix bug: selectMainExercises built a `sessionDoctrineAudit` locally
  // (L4199) tracking topCandidateChanged / top3Changed across all
  // applyDoctrineToPool calls, then discarded it on return. The builder had
  // no way to know whether doctrine actually changed any winner — so
  // `doctrineIntegration` rollups were built from rule counts and source
  // counts, never from "did doctrine actually win a slot?".
  // Post-fix: selectExercisesForSession captures the audit via the existing
  // module-level capture pattern (mirroring captureSkillExpressionResult)
  // and surfaces it here so the builder can stamp it on each session and
  // aggregate it into program.doctrineCausalChallenge.
  doctrineCausalAudit?: DoctrineScoringAudit | null
}

interface ExerciseSelectionInputs {
  day: DayStructure
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  equipment: EquipmentType[]
  sessionMinutes: number
  constraintType?: string
  currentProgressionLevel?: number
  // New progression-aware fields
  fatigueLevel?: 'low' | 'moderate' | 'high'
  athleteDifficultyLevel?: DifficultyLevel
  // Training principles engine integration
  selectedMethods?: SelectedMethods
  rangeTrainingMode?: RangeTrainingMode
  // Exercise Intelligence Engine integration
  athleteProfile?: import('@/types/domain').AthleteProfile
  targetSkills?: SkillType[]
  // Performance Envelope integration
  envelopes?: PerformanceEnvelope[]
  // Prerequisite Gate Engine integration
  prerequisiteContext?: AthletePrerequisiteContext
  jointCautions?: string[]
  // WEIGHTED LOAD PR: Weighted exercise benchmarks for load prescription
  weightedBenchmarks?: {
  weightedPullUp?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  weightedDip?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  }
  // SKILL EXPRESSION FIX: Selected skills and per-session allocation
  selectedSkills?: string[]
  skillsForSession?: Array<{
  skill: string
  expressionMode: 'primary' | 'technical' | 'support' | 'warmup'
  weight: number
  }>
  // [PHASE-MATERIALITY] Current working progressions for authoritative prescription
  currentWorkingProgressions?: Record<string, {
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  truthSource: string
  isConservative: boolean
  }> | null
  // [PHASE-MATERIALITY] Material skill intent from contract
  // [SESSION-TRUTH-MATERIALIZATION] Added 'tertiary' role for broader skill expression
  materialSkillIntent?: Array<{
  skill: string
  role: 'primary_spine' | 'secondary_anchor' | 'tertiary' | 'support' | 'deferred'
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  }>
  // [SESSION-ARCHITECTURE-OWNERSHIP] Session composition blueprint for structure enforcement
  sessionCompositionBlueprint?: import('./program-generation/session-composition-intelligence').SessionCompositionBlueprint | null
  // [UNIFIED DOCTRINE DECISION] Authoritative doctrine-driven generation constraints
  unifiedDoctrineDecision?: import('./doctrine/unified-doctrine-decision-model').UnifiedDoctrineDecision | null
  }

// =============================================================================
// SELECTOR RUNTIME CONTEXT - SINGLE AUTHORITATIVE CONTRACT
// =============================================================================
// [SELECTOR_CTX_HARDLOCK_V3] This is the ONE canonical runtime context for the
// selector corridor. ALL helpers receive this explicitly - NO closure access.

/**
  * [SELECTOR_RUNTIME_VERSION] Hard version fingerprint for cache/deploy proof
  * CORRIDOR_KILL_V4: Final selector corridor hardening - all layers must show V4
  * NO closure-based selectorCtx access allowed in any nested callback
  */
  const SELECTOR_RUNTIME_VERSION = 'SELECTOR_CORRIDOR_KILL_V4_2026_04_14'

/**
 * [SELECTOR_DOCTRINE_CONTEXT_TYPE] Explicit type for selector doctrine context.
 * This ensures all doctrine-consuming code has a stable, typed contract.
 */
export interface SelectorDoctrineContext {
  readonly active: boolean
  readonly maxExercises: number
  readonly intensityBias: 'conservative' | 'moderate' | 'aggressive'
  readonly volumeBias: 'low' | 'moderate' | 'high'
  readonly preventGenericFiller: boolean
  readonly dominantSpine: string | null
  readonly integrationMode: string | null
  readonly blockedMethods: string[]
  readonly preferWeighted: boolean
  readonly preferStatic: boolean
  readonly genericFillerBlocked: string[]
  readonly skillQualityOverQuantity: boolean
  readonly holdTimeEmphasis: boolean
  readonly recoveryConstrainedDosage: boolean
  readonly skillBlockMandatory: boolean
  readonly strengthBlockMandatory: boolean
  readonly expectedSessionCharacter: string | null
  readonly primaryMethodEmphasis: string[]
  readonly minimumSpineVisibility: number
}

/**
 * [SELECTOR_RUNTIME_CONTEXT_TYPE] The ONE canonical runtime context for selection.
 * This bundles doctrine + session metadata so helpers receive explicit ownership.
 * NO helper should access doctrine via closure - always through this contract.
 */
export interface SelectorRuntimeContext {
  readonly doctrine: SelectorDoctrineContext
  readonly dayFocus: string
  readonly primaryGoal: string
  readonly version: string
}

/**
 * [SELECTOR_DOCTRINE_CONTEXT_FACTORY] Builds a complete, safe doctrine context.
 * This factory ALWAYS returns a fully-shaped object with safe defaults.
 * Use this instead of inline object construction to ensure consistency.
 */
function buildSelectorDoctrineContext(
  unifiedDoctrineDecision: import('./doctrine/unified-doctrine-decision-model').UnifiedDoctrineDecision | null | undefined
): SelectorDoctrineContext {
  return Object.freeze({
    active: !!unifiedDoctrineDecision,
    maxExercises: unifiedDoctrineDecision?.sessionStructureRules.maxTotalExercisesPerSession ?? 8,
    intensityBias: unifiedDoctrineDecision?.dosageRules.intensityBias ?? 'moderate',
    volumeBias: unifiedDoctrineDecision?.dosageRules.volumeBias ?? 'moderate',
    preventGenericFiller: unifiedDoctrineDecision?.antiFlatteningRules.preventFillerAccessories ?? false,
    dominantSpine: unifiedDoctrineDecision?.dominantSpine.type ?? null,
    integrationMode: unifiedDoctrineDecision?.integrationConstraints.mode ?? null,
    blockedMethods: unifiedDoctrineDecision?.integrationConstraints.blockedMethods ?? [],
    preferWeighted: unifiedDoctrineDecision?.exerciseSelectionRules.preferWeightedVariants ?? false,
    preferStatic: unifiedDoctrineDecision?.exerciseSelectionRules.preferStaticVariants ?? false,
    genericFillerBlocked: unifiedDoctrineDecision?.exerciseSelectionRules.genericFillerBlocked ?? [],
    skillQualityOverQuantity: unifiedDoctrineDecision?.dosageRules.skillQualityOverQuantity ?? false,
    holdTimeEmphasis: unifiedDoctrineDecision?.dosageRules.holdTimeEmphasis ?? false,
    recoveryConstrainedDosage: unifiedDoctrineDecision?.dosageRules.recoveryConstrainedDosage ?? false,
    skillBlockMandatory: unifiedDoctrineDecision?.sessionStructureRules.skillBlockMandatory ?? false,
    strengthBlockMandatory: unifiedDoctrineDecision?.sessionStructureRules.strengthBlockMandatory ?? false,
    expectedSessionCharacter: unifiedDoctrineDecision?.dominantSpine.expectedSessionCharacter ?? null,
    primaryMethodEmphasis: unifiedDoctrineDecision?.dominantSpine.primaryMethodEmphasis ?? [],
    minimumSpineVisibility: unifiedDoctrineDecision?.antiFlatteningRules.minimumSpineVisibility ?? 0.5,
  })
}

/**
 * [SELECTOR_RUNTIME_CONTEXT_FACTORY] Builds the ONE canonical runtime context.
 * This is the ONLY place runtime context is created. Helpers receive it explicitly.
 */
function buildSelectorRuntimeContext(
  unifiedDoctrineDecision: import('./doctrine/unified-doctrine-decision-model').UnifiedDoctrineDecision | null | undefined,
  dayFocus: string,
  primaryGoal: string
): SelectorRuntimeContext {
  const doctrine = buildSelectorDoctrineContext(unifiedDoctrineDecision)
  
  const ctx: SelectorRuntimeContext = Object.freeze({
    doctrine,
    dayFocus,
    primaryGoal,
    version: SELECTOR_RUNTIME_VERSION,
  })
  
  // [RUNTIME_CONTEXT_CREATED] Log creation for deploy proof
  console.log('[SELECTOR_RUNTIME_CONTEXT_CREATED]', {
    version: ctx.version,
    dayFocus: ctx.dayFocus,
    primaryGoal: ctx.primaryGoal,
    doctrineActive: ctx.doctrine.active,
    dominantSpine: ctx.doctrine.dominantSpine,
    timestamp: new Date().toISOString(),
  })
  
  return ctx
}

/**
 * [SELECTOR_RUNTIME_CONTEXT_GUARD] Validates runtime context is present.
 * If missing, throws a classified error instead of raw ReferenceError.
 */
function assertRuntimeContext(
  ctx: SelectorRuntimeContext | undefined | null,
  functionOwner: string
): asserts ctx is SelectorRuntimeContext {
  if (!ctx || !ctx.doctrine) {
    console.error('[SELECTOR_RUNTIME_CONTEXT_MISSING]', {
      fileOwner: 'lib/program-exercise-selector.ts',
      functionOwner,
      version: SELECTOR_RUNTIME_VERSION,
      ctxExists: !!ctx,
      doctrineExists: !!(ctx as SelectorRuntimeContext | undefined)?.doctrine,
      timestamp: new Date().toISOString(),
    })
    throw new Error(`selector_runtime_context_missing:${functionOwner}`)
  }
}

// =============================================================================
// MAIN SELECTION FUNCTION
// =============================================================================

export function selectExercisesForSession(inputs: ExerciseSelectionInputs): ExerciseSelection {
  // ==========================================================================
  // [SELECTOR_CONTEXT_LOCK_V4] CRITICAL: Create selectorCtx FIRST before ANY other code
  // This ensures selectorCtx exists before any helper functions are defined.
  // Version: SELECTOR_CONTEXT_LOCK_V4_2026_04_13
  // ==========================================================================
  
  // [HARD_GUARD] Validate inputs exist before any destructuring
  if (!inputs) {
    console.error('[SELECTOR_CRITICAL_FAILURE] inputs is null/undefined')
    throw new Error('selector_execution_context_invalid:inputs_missing')
  }
  
  // [SELECTOR_CONTEXT_LOCK_V4] Build context IMMEDIATELY - before destructuring
  // This guarantees selectorCtx is defined before any other const in this scope
  const selectorCtx = buildSelectorRuntimeContext(
    inputs.unifiedDoctrineDecision,
    inputs.day?.focus ?? 'unknown',
    inputs.primaryGoal
  )
  
  // [HARD_GUARD] Validate selectorCtx was created successfully
  if (!selectorCtx || !selectorCtx.doctrine) {
    console.error('[SELECTOR_CRITICAL_FAILURE] selectorCtx creation failed')
    throw new Error('selector_execution_context_invalid:creation_failed')
  }
  
  // [CONTEXT_LOCK_PROOF] Log that context is now locked and available
  console.log('[SELECTOR_CONTEXT_LOCKED]', {
    version: selectorCtx.version,
    phase: 'context_locked_first',
    doctrineActive: selectorCtx.doctrine.active,
    dayFocus: selectorCtx.dayFocus,
    primaryGoal: selectorCtx.primaryGoal,
    timestamp: new Date().toISOString(),
  })
  
  // ==========================================================================
  // NOW safe to proceed with destructuring and other setup
  // ==========================================================================
  
  // [AI_SESSION_MATERIALITY_PHASE] Reset skill expression capture at start of each session
  resetSessionSkillExpressionCapture()
  // [PHASE 4E — DOCTRINE CAUSAL AUDIT] Reset doctrine audit capture at start of each session
  // so per-session causal data does not leak from a previous session into this one.
  resetSessionDoctrineAudit()
  
  console.log('[exercise-resolver] selectExercisesForSession called:', {
    dayFocus: inputs.day?.focus,
    primaryGoal: inputs.primaryGoal,
    sessionMinutes: inputs.sessionMinutes,
  })
  
  const {
    day,
    primaryGoal,
    experienceLevel,
    equipment,
    sessionMinutes,
    constraintType,
    selectedMethods,
    fatigueLevel,
    athleteProfile,
    targetSkills,
    rangeTrainingMode,
    prerequisiteContext: inputContext,
    jointCautions,
  // WEIGHTED LOAD PR: Extract weighted benchmarks for load prescription
  weightedBenchmarks,
  // SKILL EXPRESSION FIX: Extract skill allocation for session expression
  selectedSkills,
  skillsForSession,
  // [PHASE-MATERIALITY] Extract current working progressions
  currentWorkingProgressions,
  // [PHASE-MATERIALITY] Extract material skill intent
  materialSkillIntent,
  // [SESSION-ARCHITECTURE-OWNERSHIP] Extract composition blueprint
  sessionCompositionBlueprint,
  // [UNIFIED DOCTRINE DECISION] Extract doctrine-driven generation constraints
  unifiedDoctrineDecision,
  } = inputs
  
  // ==========================================================================
  // [SELECTOR_CORRIDOR_KILL_TRACE] ONE authoritative same-attempt corridor trace
  // This log proves all corridor layers are using V4 fingerprints
  // ==========================================================================
  const corridorAttemptId = `sel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  console.log('[SELECTOR_CORRIDOR_KILL_TRACE]', {
    attemptId: corridorAttemptId,
    fileOwner: 'lib/program-exercise-selector.ts',
    functionOwner: 'selectExercisesForSession',
    branchName: 'selector_entry',
    version: SELECTOR_RUNTIME_VERSION,
    selectorCtxVersion: selectorCtx.version,
    dayFocus: selectorCtx.dayFocus,
    primaryGoal: selectorCtx.primaryGoal,
    doctrineActive: selectorCtx.doctrine.active,
    dominantSpine: selectorCtx.doctrine.dominantSpine,
    inputsPresent: {
      day: !!day,
      primaryGoal: !!primaryGoal,
      equipment: equipment?.length ?? 0,
      skillsForSession: skillsForSession?.length ?? 0,
      unifiedDoctrineDecision: !!unifiedDoctrineDecision,
    },
    timestamp: new Date().toISOString(),
  })
  
  // [RUNTIME_CONTEXT_ENTRY] Log entry with version proof
  console.log('[SELECTOR_RUNTIME_CONTEXT_ENTRY]', {
    version: selectorCtx.version,
    dayFocus: selectorCtx.dayFocus,
    primaryGoal: selectorCtx.primaryGoal,
    doctrineActive: selectorCtx.doctrine.active,
    dominantSpine: selectorCtx.doctrine.dominantSpine,
    maxExercises: selectorCtx.doctrine.maxExercises,
    preferWeighted: selectorCtx.doctrine.preferWeighted,
    preferStatic: selectorCtx.doctrine.preferStatic,
    preventGenericFiller: selectorCtx.doctrine.preventGenericFiller,
    timestamp: new Date().toISOString(),
  })
  
  if (unifiedDoctrineDecision) {
    console.log('[UNIFIED-DOCTRINE-MATERIALIZATION-ACTIVE]', {
      version: selectorCtx.version,
      dayFocus: selectorCtx.dayFocus,
      dominantSpine: selectorCtx.doctrine.dominantSpine,
      integrationMode: selectorCtx.doctrine.integrationMode,
      maxExercises: selectorCtx.doctrine.maxExercises,
      intensityBias: selectorCtx.doctrine.intensityBias,
      volumeBias: selectorCtx.doctrine.volumeBias,
      skillQualityOverQuantity: selectorCtx.doctrine.skillQualityOverQuantity,
      holdTimeEmphasis: selectorCtx.doctrine.holdTimeEmphasis,
      recoveryConstrainedDosage: selectorCtx.doctrine.recoveryConstrainedDosage,
      preventGenericFiller: selectorCtx.doctrine.preventGenericFiller,
      blockedMethods: selectorCtx.doctrine.blockedMethods,
      preferWeighted: selectorCtx.doctrine.preferWeighted,
      preferStatic: selectorCtx.doctrine.preferStatic,
      expectedSessionCharacter: selectorCtx.doctrine.expectedSessionCharacter,
      verdict: 'DOCTRINE_MATERIALIZATION_ENGINE_ACTIVE',
    })
  }
  
  // ==========================================================================
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] PHASE 1: Input validation
  // Validate and normalize all skill allocations BEFORE any matching logic
  // This prevents undefined.toLowerCase() crashes in the selection corridor
  // ==========================================================================
  
  // [PHASE15E-EXERCISE-SELECTION-FIX] Defensive check for malformed day input
  // The builder should normalize day before calling, but log if it doesn't
  if (!day?.focus) {
    console.warn('[PHASE15E-EXERCISE-SELECTION-FIX] Day missing focus - should have been normalized by builder:', {
      originalFocus: day?.focus,
      originalDayNumber: day?.dayNumber,
    })
  }
  
  const validatedSkillsForSession = validateSessionSkills(skillsForSession)
  const validatedMaterialSkillIntent = validateMaterialSkillIntent(materialSkillIntent)
  
  // Log stabilization audit
  const stabilizationAudit = {
    originalSkillsForSession: skillsForSession?.length ?? 0,
    validatedSkillsForSession: validatedSkillsForSession.length,
    originalMaterialIntent: materialSkillIntent?.length ?? 0,
    validatedMaterialIntent: validatedMaterialSkillIntent.length,
    malformedSkillsFiltered: (skillsForSession?.length ?? 0) - validatedSkillsForSession.length,
    malformedIntentFiltered: (materialSkillIntent?.length ?? 0) - validatedMaterialSkillIntent.length,
  }
  
  if (stabilizationAudit.malformedSkillsFiltered > 0 || stabilizationAudit.malformedIntentFiltered > 0) {
    console.warn('[EXERCISE-SELECTION-RUNTIME-STABILIZATION] Malformed data filtered:', stabilizationAudit)
  }
  
  // ==========================================================================
  // [SESSION-ARCHITECTURE-OWNERSHIP] PHASE: Session structure enforcement from blueprint
  // The blueprint determines what blocks, methods, and workload distribution this session should have
  // ==========================================================================
  const sessionArchitectureContract = buildSessionArchitectureContract(
    sessionCompositionBlueprint,
    day,
    primaryGoal,
    experienceLevel,
    sessionMinutes
  )
  
  console.log('[SESSION-ARCHITECTURE-OWNERSHIP] Architecture contract active:', {
    dayFocus: day.focus,
    sessionIntent: sessionArchitectureContract.sessionIntent,
    sessionComplexity: sessionArchitectureContract.sessionComplexity,
    primaryWorkSlots: sessionArchitectureContract.slotAllocation.primaryWork,
    secondaryWorkSlots: sessionArchitectureContract.slotAllocation.secondaryWork,
    supportWorkSlots: sessionArchitectureContract.slotAllocation.supportWork,
    methodsAllowed: sessionArchitectureContract.methodDecisions,
    workloadDistribution: sessionArchitectureContract.workloadDistribution,
    blueprintSource: sessionCompositionBlueprint ? 'canonical_blueprint' : 'fallback_heuristic',
    verdict: sessionArchitectureContract.templateEscaped ? 'ARCHITECTURE_OWNED_BY_TRUTH' : 'ARCHITECTURE_FALLBACK',
  })
  
  // SKILL EXPRESSION FIX: Log skill allocation for this session
  if (validatedSkillsForSession.length > 0) {
    const sessionSkillLabels = validatedSkillsForSession.map(function(s) {
      return s.skill + '(' + s.expressionMode + ')';
    });
    console.log('[skill-expression] Exercise selector received skills for session:', {
      dayFocus: day.focus,
      skillsForSession: sessionSkillLabels,
      selectedSkillsCount: selectedSkills?.length || 0,
    });
  }
  
  // Build prerequisite context for gate checks
  const prerequisiteContext = inputContext || buildPrerequisiteContext({
    experienceLevel,
    jointCautions: jointCautions as ('shoulder' | 'elbow' | 'wrist' | 'lower_back' | 'hip' | 'knee' | 'ankle')[],
  })
  
  // Calculate exercise budget based on session time
  // [SESSION-ARCHITECTURE-OWNERSHIP] Use architecture contract to influence slot allocation
  const baseBudget = calculateExerciseBudget(sessionMinutes)
  
  // [RUNTIME_CONTEXT_USAGE] Log before first doctrine usage to prove ownership
  console.log('[SELECTOR_RUNTIME_CONTEXT_USAGE]', {
    version: selectorCtx.version,
    phase: 'before_first_doctrine_usage',
    selectorCtxDefined: typeof selectorCtx !== 'undefined',
    doctrineActive: selectorCtx.doctrine.active,
    dayFocus: selectorCtx.dayFocus,
    timestamp: new Date().toISOString(),
  })
  
  const budget = {
    ...baseBudget,
    // Override main exercises based on architecture contract when available
    // [UNIFIED DOCTRINE DECISION] Apply doctrine max exercises cap if stricter
    mainExercises: Math.min(
      sessionArchitectureContract.templateEscaped
        ? sessionArchitectureContract.slotAllocation.primaryWork + 
          sessionArchitectureContract.slotAllocation.secondaryWork +
          sessionArchitectureContract.slotAllocation.supportWork +
          sessionArchitectureContract.slotAllocation.accessoryWork
        : baseBudget.mainExercises,
      selectorCtx.doctrine.maxExercises // Doctrine enforces max cap
    ),
  }
  
  // [UNIFIED DOCTRINE DECISION] Log doctrine enforcement on exercise budget
  if (selectorCtx.doctrine.active) {
    console.log('[UNIFIED-DOCTRINE-BUDGET-ENFORCED]', {
      dayFocus: day?.focus,
      baseBudget: baseBudget.mainExercises,
      architectureBudget: sessionArchitectureContract.templateEscaped 
        ? sessionArchitectureContract.slotAllocation.primaryWork + sessionArchitectureContract.slotAllocation.secondaryWork + sessionArchitectureContract.slotAllocation.supportWork + sessionArchitectureContract.slotAllocation.accessoryWork
        : null,
      doctrineMaxExercises: selectorCtx.doctrine.maxExercises,
      finalBudget: budget.mainExercises,
      dominantSpine: selectorCtx.doctrine.dominantSpine,
      verdict: 'DOCTRINE_BUDGET_CAP_APPLIED',
    })
  }
  
  // Get principle rules if methods are selected
  const primaryMethod = selectedMethods?.primary
  const principleRules = primaryMethod?.rules
  
  // Build Exercise Intelligence Context for smarter selection
  const intelligenceContext: ExerciseIntelligenceContext = {
    athleteProfile,
    experienceLevel,
    availableEquipment: equipment,
    primaryGoal: primaryGoal as SkillType,
    targetSkills: targetSkills || [primaryGoal as SkillType],
    methodProfile: selectedMethods?.primary?.id,
    fatigueLevel: fatigueLevel || 'moderate',
    sessionMinutes,
    sessionFocus: day.focus === 'skill' ? 'skill' : 
                  day.focus === 'strength' ? 'strength' : 
                  day.focus === 'flexibility' ? 'flexibility' : undefined,
    preferLowerFatigue: fatigueLevel === 'high',
    preferHighCarryover: true,
  }
  
  // Get skill-specific exercises - ALL from DB
  const goalExercises = getExercisesByTransfer(primaryGoal)
  
  // Filter by equipment - ALL candidates from exercise database (adaptive-exercise-pool.ts)
  const availableSkills = SKILL_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableStrength = STRENGTH_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableAccessory = ACCESSORY_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableCore = CORE_EXERCISES_POOL.filter(e => hasRequiredEquipment(e, equipment))
  
  // DATABASE ENFORCEMENT: Log candidate counts from DB
  console.log('[exercise-resolver] DB candidates available:', {
    skills: availableSkills.length,
    strength: availableStrength.length,
    accessory: availableAccessory.length,
    core: availableCore.length,
    goalSpecific: goalExercises.length,
  })
  
  // ==========================================================================
  // [PHASE15E-SELECTOR-INPUT-TRUTH] Normalize all candidate pools ONCE at entry
  // All downstream selection logic MUST use these normalized pools instead of raw pools
  // This eliminates mixed raw/normalized read crashes in the selector corridor
  // ==========================================================================
  const normalizedSkills = normalizeExercisePool(availableSkills)
  const normalizedStrength = normalizeExercisePool(availableStrength)
  const normalizedAccessory = normalizeExercisePool(availableAccessory)
  const normalizedCore = normalizeExercisePool(availableCore)
  const normalizedGoalExercises = normalizeExercisePool(goalExercises)
  
  console.log('[PHASE15E-SELECTOR-INPUT-TRUTH] Normalized pools ready:', {
    normalizedSkills: normalizedSkills.length,
    normalizedStrength: normalizedStrength.length,
    normalizedAccessory: normalizedAccessory.length,
    normalizedCore: normalizedCore.length,
    normalizedGoalExercises: normalizedGoalExercises.length,
    verdict: 'NORMALIZED_POOLS_CREATED',
  })
  
  // [PHASE 3] Equipment collapse truth audit
  const equipmentCollapsedSkills = SKILL_EXERCISES.length - availableSkills.length
  const equipmentCollapsedStrength = STRENGTH_EXERCISES.length - availableStrength.length
  const totalCandidatesBeforeEquipment = SKILL_EXERCISES.length + STRENGTH_EXERCISES.length + ACCESSORY_EXERCISES.length + CORE_EXERCISES_POOL.length
  const totalCandidatesAfterEquipment = availableSkills.length + availableStrength.length + availableAccessory.length + availableCore.length
  
  console.log('[equipment-collapse-truth]', {
    equipmentProvided: equipment,
    totalCandidatesBeforeFiltering: totalCandidatesBeforeEquipment,
    totalCandidatesAfterEquipmentFiltering: totalCandidatesAfterEquipment,
    collapsedByEquipment: totalCandidatesBeforeEquipment - totalCandidatesAfterEquipment,
    skillsCollapsed: equipmentCollapsedSkills,
    strengthCollapsed: equipmentCollapsedStrength,
    remainingSkillPool: availableSkills.length,
    remainingStrengthPool: availableStrength.length,
    verdict: totalCandidatesAfterEquipment === 0 
      ? 'equipment_filtered_all_candidates' 
      : totalCandidatesAfterEquipment < 10 
        ? 'equipment_severely_limited_pool'
        : 'equipment_filtering_acceptable',
  })
  
  // [exercise-expression] ISSUE A: Pass skillsForSession to enable multi-skill expression
  // TASK 1-B: Pass weightedBenchmarks to fix ReferenceError in selectMainExercises
  // [PHASE 4 HOTFIX] Pass jointCautions for doctrine context
  // [SESSION-ARCHITECTURE-VISIBLE-EXPRESSION] Pass architecture contract for slot enforcement
  // [ROOT_CAUSE_FIX] selectorCtx MUST be passed as first argument - fixes "selectorCtx is not defined"
  const main = selectMainExercises(
  selectorCtx,       // [ROOT_CAUSE_FIX] Explicit context threading - NOT available via closure
  day,
  primaryGoal,
  experienceLevel,
  goalExercises,
  availableSkills,
  availableStrength,
  availableAccessory,
  availableCore,
  budget.mainExercises,
  constraintType,
  prerequisiteContext,
  skillsForSession,  // TASK 2: Skill allocations for expression-aware selection
  selectedSkills,    // Full selected skills list for reference
  equipment,         // Equipment for doctrine lookups
  weightedBenchmarks, // TASK 1-B: Weighted benchmark data for load prescription
  jointCautions,     // [PHASE 4 HOTFIX] Joint cautions for doctrine scoring
  currentWorkingProgressions, // [PHASE-MATERIALITY] Current working progressions
  materialSkillIntent, // [PHASE-MATERIALITY] Material skill intent
  sessionArchitectureContract // [SESSION-ARCHITECTURE-VISIBLE-EXPRESSION] Architecture contract for slot enforcement
  )
  
  // [session-assembly] ISSUE C: Validate main exercises before proceeding
  if (main.length === 0) {
    console.error('[session-assembly] CRITICAL: selectMainExercises returned empty array', {
      dayFocus: day.focus,
      primaryGoal,
      experienceLevel,
      sessionMinutes,
    })
    // Don't throw here - let the session assembly validation catch it
    // But log extensively for diagnosis
  }
  
  console.log('[session-assembly] Main exercise selection complete:', {
    exerciseCount: main.length,
    dayFocus: day.focus,
    primaryGoal,
  })
  
  // Generate intelligent warmup based on main exercises
  const warmup = selectIntelligentWarmup(
    main,
    primaryGoal,
    sessionMinutes,
    equipment
  )
  
  // Generate intelligent cooldown based on main exercises
  const cooldown = selectIntelligentCooldown(
    main,
    primaryGoal,
    sessionMinutes,
    equipment
  )
  
  // Calculate total time
  const totalEstimatedTime = calculateTotalTime(warmup, main, cooldown)
  
  // =========================================================================
  // SESSION LOAD INTELLIGENCE
  // =========================================================================
  
  // Determine session style based on context
  const primaryFocus = day.focus === 'skill' || day.focus === 'push_skill' || day.focus === 'pull_skill' 
    ? 'skill' as const
    : day.focus === 'push_strength' || day.focus === 'pull_strength'
      ? 'strength' as const
      : day.focus === 'support_recovery'
        ? 'recovery' as const
        : 'mixed' as const
  
  const sessionStyle = determineSessionStyle(
    sessionMinutes,
    primaryFocus,
    undefined, // structureType - could be passed from context
    undefined  // fatigueProfile
  )
  
  // Build load metadata for main exercises
  const mainLoadMetadata: ExerciseLoadMetadata[] = main.map(ex => {
    const metadata = buildExerciseLoadMetadata(
      {
        category: ex.exercise.category,
        neuralDemand: ex.exercise.neuralDemand,
        fatigueCost: ex.exercise.fatigueCost,
        movementPattern: ex.exercise.movementPattern,
        isIsometric: ex.exercise.isIsometric,
      },
      ex.deliveryStyle || 'standalone'
    )
    // Attach metadata to exercise for downstream use
    ex.loadMetadata = metadata
    return metadata
  })
  
  // Calculate session load and validate
  const loadBudget = getSessionLoadBudget(sessionStyle)
  const sessionLoadSummary = calculateSessionLoad(mainLoadMetadata, loadBudget)
  const antiBloatResult = validateSessionAntiBloat(mainLoadMetadata, sessionStyle)
  const loadRationale = generateSessionLoadRationale(sessionLoadSummary, sessionStyle)
  
  // [prescription] TASK 7: Log weighted exercises with prescriptions for debugging
  var weightedWithLoads = main.filter(function(e) { return e.prescribedLoad && e.prescribedLoad.load > 0; });
  if (weightedWithLoads.length > 0) {
    var weightedLogItems = [];
    for (var i = 0; i < weightedWithLoads.length; i++) {
      var we = weightedWithLoads[i];
      weightedLogItems.push({
        id: we.exercise.id,
        load: '+' + (we.prescribedLoad?.load || 0) + ' ' + (we.prescribedLoad?.unit || ''),
        basis: we.prescribedLoad?.basis,
        confidence: we.prescribedLoad?.confidenceLevel,
      });
    }
    var skillsList = [];
    if (skillsForSession) {
      for (var j = 0; j < skillsForSession.length; j++) {
        skillsList.push(skillsForSession[j].skill);
      }
    }
    console.log('[prescription] Session weighted exercise prescriptions:', {
      dayFocus: day.focus,
      exercises: weightedLogItems,
      skillsExpressed: skillsList,
    });
  }
  
  var weightedExerciseCount = 0;
  var doctrineHitCount = 0;
  var rejectedCount = 0;
  for (var wi = 0; wi < main.length; wi++) {
    if (main[wi].prescribedLoad && main[wi].prescribedLoad.load > 0) {
      weightedExerciseCount++;
    }
    if (main[wi].selectionTrace && main[wi].selectionTrace.doctrineSource !== null) {
      doctrineHitCount++;
    }
    if (main[wi].selectionTrace && main[wi].selectionTrace.rejectedAlternatives) {
      rejectedCount = rejectedCount + main[wi].selectionTrace.rejectedAlternatives.length;
    }
  }

  var sessionRole: 'primary_focus' | 'recovery' | 'mixed' | 'support_heavy' = 'support_heavy';
  if (day.focus === 'skill' || day.focus === 'push_skill' || day.focus === 'pull_skill') {
    sessionRole = 'primary_focus';
  } else if (day.focus === 'support_recovery') {
    sessionRole = 'recovery';
  } else if (day.focus === 'mixed_upper') {
    sessionRole = 'mixed';
  }

  var primarySkillExpressed = primaryGoal;
  var secondarySkillExpressed: string | null = null;
  if (skillsForSession) {
    for (var si = 0; si < skillsForSession.length; si++) {
      if (skillsForSession[si].expressionMode === 'primary') {
        primarySkillExpressed = skillsForSession[si].skill;
      }
      if (skillsForSession[si].expressionMode === 'technical') {
        secondarySkillExpressed = skillsForSession[si].skill;
      }
    }
  }

  var sessionTraceResult = {
    sessionRole: sessionRole,
    primarySkillExpressed: primarySkillExpressed,
    secondarySkillExpressed: secondarySkillExpressed,
    exerciseCount: main.length,
    weightedExerciseCount: weightedExerciseCount,
    doctrineHitCount: doctrineHitCount,
    rejectedAlternativeCount: rejectedCount,
  };
  
  var directExpressionNames = [];
  var technicalExpressionNames = [];
  var supportExpressionNames = [];
  var weightedExpressionNames = [];
  for (var idx = 0; idx < main.length; idx++) {
    var ex = main[idx];
    var trace = ex.selectionTrace;
    if (trace) {
      if (trace.expressionMode === 'direct_intensity' || trace.sessionRole === 'skill_primary') {
        directExpressionNames.push(ex.name);
      }
      if (trace.expressionMode === 'technical_focus' || trace.sessionRole === 'skill_secondary') {
        technicalExpressionNames.push(ex.name);
      }
      if (trace.expressionMode === 'strength_support' || trace.sessionRole === 'strength_support') {
        supportExpressionNames.push(ex.name);
      }
    }
    if (ex.prescribedLoad && ex.prescribedLoad.load) {
      weightedExpressionNames.push(ex.name + '@' + ex.prescribedLoad.load + (ex.prescribedLoad.unit || ''));
    }
  }
  var skillExpressionSummary = {
    directExpressions: directExpressionNames,
    technicalExpressions: technicalExpressionNames,
    supportExpressions: supportExpressionNames,
    weightedExpressions: weightedExpressionNames,
  };
  console.log('[selected-skill-exposure] Session skill expression summary:', {
    dayFocus: day.focus,
    primarySkill: sessionTraceResult.primarySkillExpressed,
    secondarySkill: sessionTraceResult.secondarySkillExpressed,
    directExpressions: skillExpressionSummary.directExpressions,
    technicalExpressions: skillExpressionSummary.technicalExpressions,
    supportExpressions: skillExpressionSummary.supportExpressions,
    weightedExpressions: skillExpressionSummary.weightedExpressions,
  });

  var doctrineBackedCount = 0;
  var skillAlignedCount = 0;
  for (var k = 0; k < main.length; k++) {
    if (main[k].selectionTrace && main[k].selectionTrace.doctrineSource !== null) {
      doctrineBackedCount++;
    }
    if (main[k].selectionTrace && main[k].selectionTrace.influencingSkills && main[k].selectionTrace.influencingSkills.length > 0) {
      skillAlignedCount++;
    }
  }
  
  if (doctrineBackedCount === 0 && skillAlignedCount < 2 && main.length >= 4) {
    var exerciseNameList = [];
    for (var m = 0; m < Math.min(main.length, 5); m++) {
      exerciseNameList.push(main[m].name);
    }
    console.warn('[generic-shell-detect] WARNING: Session may be too generic - no doctrine hits, few skill alignments', {
      dayFocus: day.focus,
      exerciseCount: main.length,
      doctrineBackedCount: doctrineBackedCount,
      skillAlignedCount: skillAlignedCount,
      exercises: exerciseNameList,
    });
  }

  var skillsExpressedLabel = primaryGoal;
  if (skillsForSession && skillsForSession.length > 0) {
    var labelParts = [];
    for (var n = 0; n < skillsForSession.length; n++) {
      labelParts.push(skillsForSession[n].skill + '(' + skillsForSession[n].expressionMode + ')');
    }
    skillsExpressedLabel = labelParts.join(', ');
  }
  console.log('[exercise-trace] SESSION COMPLETE:', {
    dayFocus: day.focus,
    exerciseCount: main.length,
    weightedCount: weightedExerciseCount,
    doctrineHits: doctrineHitCount,
    rejected: rejectedCount,
    skillsExpressed: skillsExpressedLabel,
  });
  
  // ==========================================================================
  // [session-assembly-truth] TASK 6: EXERCISE RANKING BIAS AUDIT
  // Detects if ranking crushes tertiary selected skills
  // ==========================================================================
  var selectedSkillsInSession = selectedSkills || [];
  var topRankedSkillsFromExercises = [];
  var droppedSelectedSkills = [];
  var supportSlotsAvailable = main.filter(function(e) {
    return e.selectionTrace && (
      e.selectionTrace.sessionRole === 'strength_support' ||
      e.selectionTrace.sessionRole === 'accessory' ||
      e.selectionTrace.expressionMode === 'strength_support'
    );
  }).length;
  var supportSlotsUsedForSelectedSkills = 0;
  
  // Identify which selected skills got exercises
  for (var ri = 0; ri < main.length; ri++) {
    var exTrace = main[ri].selectionTrace;
    if (exTrace && exTrace.influencingSkills && exTrace.influencingSkills.length > 0) {
      for (var rj = 0; rj < exTrace.influencingSkills.length; rj++) {
        var influencingSkill = exTrace.influencingSkills[rj].skillId;
        if (topRankedSkillsFromExercises.indexOf(influencingSkill) === -1) {
          topRankedSkillsFromExercises.push(influencingSkill);
        }
        if (selectedSkillsInSession.indexOf(influencingSkill) !== -1 &&
            (exTrace.sessionRole === 'strength_support' || exTrace.sessionRole === 'accessory')) {
          supportSlotsUsedForSelectedSkills++;
        }
      }
    }
  }
  
  // Identify dropped selected skills
  for (var rk = 0; rk < selectedSkillsInSession.length; rk++) {
    var selSkill = selectedSkillsInSession[rk];
    if (topRankedSkillsFromExercises.indexOf(selSkill) === -1) {
      droppedSelectedSkills.push(selSkill);
    }
  }
  
  var rankingBiasDetected = droppedSelectedSkills.length > Math.ceil(selectedSkillsInSession.length / 2);
  
  console.log('[exercise-ranking-bias-audit]', {
    dayFocus: day.focus,
    selectedSkillCount: selectedSkillsInSession.length,
    topRankedSkills: topRankedSkillsFromExercises,
    droppedSelectedSkills: droppedSelectedSkills,
    rankingBiasDetected: rankingBiasDetected,
    supportSlotsAvailable: supportSlotsAvailable,
    supportSlotsUsedForSelectedSkills: supportSlotsUsedForSelectedSkills,
    finalVerdict: droppedSelectedSkills.length === 0
      ? 'all_selected_skills_represented'
      : droppedSelectedSkills.length <= 1
        ? 'minor_skill_gap_acceptable'
        : rankingBiasDetected
          ? 'ranking_bias_crushing_tertiary_skills'
          : 'moderate_skill_gap_for_capacity',
  });
  
  // [AI_SESSION_MATERIALITY_PHASE] Get captured skill expression result
  const skillExpressionCapture = getSessionSkillExpressionCapture()
  
  // ==========================================================================
  // [SESSION-ARCHITECTURE-OWNERSHIP] Final architecture ownership audit
  // Confirms that session composition was driven by canonical truth, not templates
  // ==========================================================================
  const primaryWorkCount = main.filter(e => 
    e.selectionTrace?.sessionRole === 'direct_skill' ||
    e.selectionTrace?.sessionRole === 'strength_foundation'
  ).length
  const secondaryWorkCount = main.filter(e =>
    e.selectionTrace?.sessionRole === 'secondary_skill' ||
    e.selectionTrace?.expressionMode === 'technical'
  ).length
  const supportWorkCount = main.filter(e =>
    e.selectionTrace?.sessionRole === 'strength_support' ||
    e.selectionTrace?.sessionRole === 'accessory'
  ).length
  
  // ==========================================================================
  // [PRESCRIPTION-INTELLIGENCE] Final prescription audit for session
  // ==========================================================================
  const prescriptionAudit = {
    totalExercises: main.length,
    withCanonicalPrescription: main.filter(e => e.sets && e.repsOrTime).length,
    setsDistribution: {
      lowVolume: main.filter(e => (e.sets || 0) <= 2).length,
      standardVolume: main.filter(e => (e.sets || 0) >= 3 && (e.sets || 0) <= 4).length,
      highVolume: main.filter(e => (e.sets || 0) >= 5).length,
    },
    prescriptionTypes: {
      holds: main.filter(e => e.repsOrTime?.includes('hold') || e.repsOrTime?.includes('s')).length,
      reps: main.filter(e => e.repsOrTime?.includes('rep') || /\d+-\d+$/.test(e.repsOrTime || '')).length,
      other: main.filter(e => !e.repsOrTime?.includes('hold') && !e.repsOrTime?.includes('rep')).length,
    },
  }
  
  console.log('[PRESCRIPTION-INTELLIGENCE-SESSION-AUDIT]', {
    dayFocus: day.focus,
    primaryGoal,
    prescriptionAudit,
    samplePrescriptions: main.slice(0, 3).map(e => ({
      name: e.exercise?.name,
      sets: e.sets,
      repsOrTime: e.repsOrTime,
      selectionReason: e.selectionReason?.substring(0, 50),
    })),
    verdict: prescriptionAudit.withCanonicalPrescription === main.length
      ? 'ALL_PRESCRIPTIONS_FROM_CANONICAL_TRUTH'
      : 'SOME_PRESCRIPTIONS_USING_DEFAULTS',
  })
  
  console.log('[SESSION-ARCHITECTURE-OWNERSHIP-AUDIT]', {
    dayFocus: day.focus,
    sessionIntent: sessionArchitectureContract.sessionIntent,
    templateEscaped: sessionArchitectureContract.templateEscaped,
    contractSlots: {
      primary: sessionArchitectureContract.slotAllocation.primaryWork,
      secondary: sessionArchitectureContract.slotAllocation.secondaryWork,
      support: sessionArchitectureContract.slotAllocation.supportWork,
    },
    actualSlots: {
      primary: primaryWorkCount,
      secondary: secondaryWorkCount,
      support: supportWorkCount,
    },
    methodsUsed: {
      supersetsAllowed: sessionArchitectureContract.methodDecisions.supersetsAllowed,
      finisherAllowed: sessionArchitectureContract.methodDecisions.finisherAllowed,
    },
    dayRoleEnforcement: sessionArchitectureContract.dayRoleEnforcement,
    verdict: sessionArchitectureContract.templateEscaped 
      ? 'SESSION_ARCHITECTURE_OWNED_BY_CANONICAL_TRUTH'
      : 'SESSION_ARCHITECTURE_USING_TEMPLATE_FALLBACK',
  })
  
  // ==========================================================================
  // [DOCTRINE-RELAXATION-RESCUE] Emergency rescue if main is empty after all paths
  // This prevents doctrine over-constraint from collapsing session generation entirely
  // ==========================================================================
  let doctrineRelaxationApplied = false
  let doctrineRelaxationReason = ''
  
  if (main.length === 0) {
    console.log('[DOCTRINE_RELAXATION_TRIGGER]', {
      fingerprint: 'REGEN_AUDIT_2026_04_11_V2',
      dayFocus: day.focus,
      primaryGoal,
      doctrineActive: selectorCtx.doctrine.active,
      preventGenericFiller: selectorCtx.doctrine.preventGenericFiller,
      blockedMethodsCount: selectorCtx.doctrine.blockedMethods.length,
      genericFillerBlockedCount: selectorCtx.doctrine.genericFillerBlocked.length,
      availableSkillsCount: availableSkills.length,
      availableStrengthCount: availableStrength.length,
      verdict: 'MAIN_EMPTY_ACTIVATING_RESCUE',
    })
    
    // RESCUE ATTEMPT 1: Relax doctrine and try basic skill selection
    const isSkillDay = day.focus === 'push_skill' || day.focus === 'pull_skill' || day.focus === 'skill_density'
    const isPushDay = day.focus?.includes('push')
    const isPullDay = day.focus?.includes('pull')
    
    // Build a minimal conservative exercise set without doctrine blocking
    const conservativePool = [...availableSkills, ...availableStrength, ...goalExercises]
      .filter(e => {
        // Only filter by movement pattern alignment, not doctrine rules
        if (isPushDay && e.movementPattern?.includes('pull')) return false
        if (isPullDay && e.movementPattern?.includes('push')) return false
        return true
      })
    
    console.log('[DOCTRINE_RELAXATION_RESCUE_POOL]', {
      poolSize: conservativePool.length,
      dayFocus: day.focus,
      sampleExercises: conservativePool.slice(0, 5).map(e => e.name),
    })
    
    // Select up to 4 exercises from relaxed pool
    const relaxedBudget = Math.min(4, conservativePool.length)
    for (let ri = 0; ri < relaxedBudget && main.length < 4; ri++) {
      const candidate = conservativePool[ri]
      if (candidate && !usedIds.has(candidate.id)) {
        addExercise(selectorCtx, candidate, 'Doctrine relaxation rescue', undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'doctrine_relaxation_rescue',
          sessionRole: 'rescue_fallback',
          expressionMode: 'conservative_fallback',
          influencingSkills: [],
          candidatePoolSize: conservativePool.length,
        })
        doctrineRelaxationApplied = true
        doctrineRelaxationReason = 'main_empty_doctrine_over_constrained'
      }
    }
    
    console.log('[DOCTRINE_RELAXATION_RESULT]', {
      fingerprint: 'REGEN_AUDIT_2026_04_11_V2',
      relaxationApplied: doctrineRelaxationApplied,
      rescuedExerciseCount: main.length,
      dayFocus: day.focus,
      verdict: main.length > 0 
        ? 'DOCTRINE_RELAXATION_RESCUED_SESSION'
        : 'DOCTRINE_RELAXATION_FAILED_NO_CANDIDATES',
    })
  }
  
  // BUILD-HOTFIX: balanced module structure and restored valid EOF closure
  return {
    warmup,
    main,
    cooldown,
    totalEstimatedTime,
    sessionLoadSummary,
    sessionStyle,
    loadRationale,
    // Include doctrine relaxation info in return
    doctrineRelaxationApplied,
    doctrineRelaxationReason,
    antiBloatValidation: {
      isValid: antiBloatResult.isValid,
      issues: antiBloatResult.issues,
      suggestions: antiBloatResult.suggestions,
    },
    // [exercise-trace] TASK 5: Attach session trace
    sessionTrace: sessionTraceResult,
    // [AI_SESSION_MATERIALITY_PHASE] Attach skill expression result for session metadata
    skillExpressionResult: skillExpressionCapture ? {
      directlyExpressedSkills: skillExpressionCapture.directlyExpressedSkills,
      technicalSlotSkills: skillExpressionCapture.technicalSlotSkills,
      supportSkillsInjected: skillExpressionCapture.supportSkillsInjected,
      supportSkillsDeferred: skillExpressionCapture.supportSkillsDeferred,
      tertiarySkillsInjected: skillExpressionCapture.tertiarySkillsInjected,
      tertiarySkillsDeferred: skillExpressionCapture.tertiarySkillsDeferred,
      carryoverSkills: skillExpressionCapture.carryoverSkills,
      progressionAuthorityUsed: skillExpressionCapture.progressionAuthorityUsed,
      materialityVerdict: skillExpressionCapture.materialityVerdict,
      materialityIssues: skillExpressionCapture.materialityIssues,
    } : undefined,
    // [SESSION-ARCHITECTURE-VISIBLE-EXPRESSION] Session differentiation signature for convergence detection
    sessionDifferentiationSignature: {
      sessionIntent: sessionArchitectureContract.sessionIntent,
      primaryWorkCount,
      secondaryWorkCount,
      supportWorkCount,
      totalExercises: main.length,
      firstThreeCategories: main.slice(0, 3).map(e => e.category || 'unknown'),
      firstThreeTypes: main.slice(0, 3).map(e => e.selectionTrace?.sessionRole || 'unknown'),
      hasDirectSkillWork: main.some(e => e.selectionTrace?.sessionRole === 'direct_skill' || e.selectionTrace?.sessionRole === 'skill_primary'),
      hasStrengthSupport: main.some(e => e.selectionTrace?.sessionRole === 'strength_support'),
      hasMixedContent: primaryWorkCount > 0 && supportWorkCount > 0 && secondaryWorkCount > 0,
      dayRole: sessionArchitectureContract.dayRoleEnforcement.dayRole,
      workloadRatio: `${sessionArchitectureContract.workloadDistribution.primaryPercent}/${sessionArchitectureContract.workloadDistribution.secondaryPercent}/${sessionArchitectureContract.workloadDistribution.supportPercent}`,
    },
    // [PHASE 4E — DOCTRINE CAUSAL AUDIT SURFACE]
    // Read the per-session capture written by selectMainExercises and surface
    // it on the return so the builder can stamp it onto the session and
    // aggregate across all sessions into program.doctrineCausalChallenge.
    // null means selectMainExercises ran but doctrine never even matched a
    // candidate — this is itself a meaningful diagnostic ("no_matching_rules"
    // or "doctrine_cache_empty"), so we do NOT default to {} here.
    doctrineCausalAudit: getSessionDoctrineAudit(),
  }
}

// =============================================================================
// EXERCISE BUDGET
// =============================================================================

interface ExerciseBudget {
  mainExercises: number
  warmupMinutes: number
  cooldownMinutes: number
}

function calculateExerciseBudget(sessionMinutes: number): ExerciseBudget {
  if (sessionMinutes <= 30) {
    return { mainExercises: 4, warmupMinutes: 5, cooldownMinutes: 3 }
  }
  if (sessionMinutes <= 45) {
    return { mainExercises: 5, warmupMinutes: 7, cooldownMinutes: 5 }
  }
  if (sessionMinutes <= 60) {
    return { mainExercises: 6, warmupMinutes: 10, cooldownMinutes: 5 }
  }
  // 75+ minutes
  return { mainExercises: 7, warmupMinutes: 10, cooldownMinutes: 8 }
}

// =============================================================================
// [advanced-skill-expression] ISSUE A/D: ADVANCED SKILL EXPRESSION HELPERS
// =============================================================================

/**
 * Identifies exercises that should be included based on advanced skill expression.
 * [advanced-skill-expression] ISSUE A: Ensures advanced skills get direct expression.
 */
function getAdvancedSkillExercises(
  skillsForSession: Array<{ skill: string; expressionMode: string; weight: number }> | undefined,
  availableSkills: Exercise[],
  availableStrength: Exercise[],
  dayFocus: string
): { exerciseId: string; reason: string; priority: number }[] {
  if (!skillsForSession || skillsForSession.length === 0) {
    return []
  }

  // [PHASE15E-EXERCISE-SELECTION-FIX] Guard against undefined dayFocus
  const safeDayFocus = dayFocus || 'mixed_upper'

  const recommendations: { exerciseId: string; reason: string; priority: number }[] = []
  
  for (const allocation of skillsForSession) {
    const { skill, expressionMode, weight } = allocation
    
    if (!isAdvancedSkill(skill)) continue
    
    const advancedFamily = getAdvancedSkillFamily(skill)
    if (!advancedFamily) continue
    
    // [advanced-skill-expression] ISSUE B: HSPU special handling
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    if (skill === 'hspu') {
      // HSPU should influence vertical push selection
      if (safeDayFocus.includes('push') || safeDayFocus.includes('skill') || safeDayFocus.includes('vertical')) {
        const hspuProgressions = advancedFamily.directProgressions
        for (const exId of hspuProgressions) {
          if (!exId) continue // Skip undefined exercise IDs
          const found = [...availableSkills, ...availableStrength].find(
            e => safeExerciseId(e) === safeLower(exId)
          )
          if (found) {
            recommendations.push({
              exerciseId: found.id,
              reason: `[HSPU progression] ${advancedFamily.displayName} direct expression`,
              priority: expressionMode === 'primary' ? 3 : expressionMode === 'technical' ? 2 : 1,
            })
            break
          }
        }
      }
    }
    
    // [advanced-skill-expression] ISSUE C: Other advanced skills
    // [PHASE 3D REGISTRY-BREADTH-LOCK] Pre-3D this branch was a hardcoded
    // allow-list:
    //   if (skill === 'back_lever' || skill === 'dragon_flag' ||
    //       skill === 'planche_pushup' || skill === 'one_arm_pull_up' ||
    //       skill === 'one_arm_chin_up' || skill === 'one_arm_push_up')
    // That list silently EXCLUDED `planche`, `front_lever`, `handstand`,
    // `v_sit`, `l_sit`, `muscle_up` — the exact families the saved athlete
    // truth selects (planche primary, FL secondary, plus handstand and
    // v-sit). Even when the registry contained their entries, this gate
    // never let them through, so the recommendation pass returned nothing
    // and generic scoring took over. That was the dominant reason the
    // visible output kept feeling underexpressed despite truth gains.
    //
    // Fix: the recommendation pass now runs for ANY advanced family that
    // isn't HSPU (HSPU stays in its own branch above because it carries a
    // doctrine-specific day-focus gate). The single source of truth is
    // `ADVANCED_SKILL_FAMILIES`. Future additions to the registry will
    // automatically reach this pass without requiring a parallel edit
    // here — closing the class of bug entirely, not just the instance.
    //
    // Doctrine safety preserved:
    //   - `isAdvancedSkill(skill)` already gates entry at L2163
    //   - Pool availability still filters via the .find() below
    //   - One recommendation per skill (the `break` statement)
    //   - expressionMode priority weighting unchanged
    //   - HSPU's day-focus gate above unchanged
    else if (skill !== 'hspu') {
      const progressions = advancedFamily.directProgressions
      for (const exId of progressions) {
        if (!exId) continue // Skip undefined exercise IDs
        const found = [...availableSkills, ...availableStrength].find(
          e => safeExerciseId(e) === safeLower(exId)
        )
        if (found) {
          recommendations.push({
            exerciseId: found.id,
            reason: `[Advanced] ${advancedFamily.displayName} ${expressionMode} expression`,
            priority: expressionMode === 'primary' ? 3 : expressionMode === 'technical' ? 2 : 1,
          })
          break
        }
      }
    }
    
    // [advanced-skill-expression] Log detected advanced skill for session
    console.log('[advanced-skill-expression] Skill exercise recommendation:', {
      skill,
      displayName: advancedFamily.displayName,
      expressionMode,
      dayFocus,
      recommendationsCount: recommendations.length,
    })
  }
  
  return recommendations
}

/**
 * Gets intentional support exercises for advanced skills in this session.
 * [advanced-skill-expression] ISSUE D: Support work should look intentional.
 */
function getAdvancedSkillSupportExercises(
  skillsForSession: Array<{ skill: string; expressionMode: string; weight: number }> | undefined,
  availableAccessory: Exercise[],
  availableCore: Exercise[]
): { exerciseId: string; reason: string; supportType: 'primary' | 'secondary' | 'trunk' }[] {
  if (!skillsForSession || skillsForSession.length === 0) {
    return []
  }

  const supportRecommendations: { exerciseId: string; reason: string; supportType: 'primary' | 'secondary' | 'trunk' }[] = []
  const allAvailable = [...availableAccessory, ...availableCore]
  
  for (const allocation of skillsForSession) {
    const { skill, expressionMode } = allocation
    
    if (!isAdvancedSkill(skill)) continue
    
    const supportPattern = ADVANCED_SKILL_SUPPORT_PATTERNS[skill]
    if (!supportPattern) continue
    
    // Primary support work
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    if (expressionMode === 'primary' || expressionMode === 'technical') {
      for (const primary of supportPattern.primarySupport) {
        for (const exId of primary.exerciseIds) {
          if (!exId) continue // Skip undefined exercise IDs
          const found = allAvailable.find(e => safeExerciseId(e) === safeLower(exId))
          if (found) {
            supportRecommendations.push({
              exerciseId: found.id,
              reason: `[${supportPattern.displayName}] ${primary.purpose}`,
              supportType: 'primary',
            })
            break
          }
        }
      }
    }
    
    // Trunk support for all expression modes
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    const trunkSupport = supportPattern.trunkSupport
    for (const exId of trunkSupport.exerciseIds) {
      if (!exId) continue // Skip undefined exercise IDs
      const found = allAvailable.find(e => safeExerciseId(e) === safeLower(exId))
      if (found) {
        supportRecommendations.push({
          exerciseId: found.id,
          reason: `[${supportPattern.displayName} trunk] ${trunkSupport.purpose}`,
          supportType: 'trunk',
        })
        break
      }
    }
    
    // [advanced-skill-expression] Log support recommendations
    console.log('[advanced-skill-expression] Support work recommendation:', {
      skill,
      displayName: supportPattern.displayName,
      expressionMode,
      primarySupportCount: supportRecommendations.filter(s => s.supportType === 'primary').length,
      trunkSupportCount: supportRecommendations.filter(s => s.supportType === 'trunk').length,
    })
  }
  
  return supportRecommendations
}

// =============================================================================
// MAIN EXERCISE SELECTION
// =============================================================================

// [exercise-expression] Session skill allocation type for multi-skill expression
type SessionSkillAllocation = {
  skill: string
  expressionMode: 'primary' | 'technical' | 'support' | 'warmup'
  weight: number
}

function selectMainExercises(
  // [ROOT_CAUSE_FIX] selectorCtx MUST be passed explicitly - it is NOT available via closure
  // This fixes "selectorCtx is not defined" ReferenceError in push-skill selection
  selectorCtx: SelectorRuntimeContext,
  day: DayStructure,
  primaryGoal: PrimaryGoal,
  experienceLevel: ExperienceLevel,
  goalExercises: Exercise[],
  availableSkills: Exercise[],
  availableStrength: Exercise[],
  availableAccessory: Exercise[],
  availableCore: Exercise[],
  maxExercises: number,
  constraintType?: string,
  prerequisiteContext?: AthletePrerequisiteContext,
  skillsForSession?: SessionSkillAllocation[],
  selectedSkills?: string[],
  equipment?: EquipmentType[],
  // TASK 1-A: Thread weightedBenchmarks explicitly to fix ReferenceError
  weightedBenchmarks?: {
  weightedPullUp?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  weightedDip?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  },
  // [PHASE 4 HOTFIX] Thread jointCautions for doctrine context
  jointCautions?: string[],
  // [PHASE-MATERIALITY] TASK 3: Current working progressions for authoritative prescription
  currentWorkingProgressions?: Record<string, {
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  truthSource: string
  isConservative: boolean
  }> | null,
  // [PHASE-MATERIALITY] Material skill intent from contract
  // [SESSION-TRUTH-MATERIALIZATION] Added 'tertiary' role for broader skill expression
  materialSkillIntent?: Array<{
  skill: string
  role: 'primary_spine' | 'secondary_anchor' | 'tertiary' | 'support' | 'deferred'
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  }>,
  // [SESSION-ARCHITECTURE-VISIBLE-EXPRESSION] Architecture contract for material slot enforcement
  sessionArchitectureContract?: SessionArchitectureContract
  ): SelectedExercise[] {
  // [selection-contract] TASK 1-F: Verify weighted benchmarks threading
  console.log('[selection-contract]', {
  dayFocus: day.focus,
  primaryGoal,
  hasWeightedBenchmarks: !!weightedBenchmarks,
  hasPullUpBenchmark: !!weightedBenchmarks?.weightedPullUp?.current,
  hasDipBenchmark: !!weightedBenchmarks?.weightedDip?.current,
  })
  
  // ==========================================================================
  // [PHASE15E-MICRO-CORRIDOR-AUDIT] First failure tracker for push exercise selection
  // This captures the FIRST failing checkpoint without spamming logs
  // ==========================================================================
  const isPushSession = day?.focus?.includes('push')
  const microCorridorAudit = {
    sessionFocus: day?.focus || 'unknown',
    isPushSession,
    primaryGoal,
    checkpointsReached: [] as string[],
    firstFailedCheckpoint: null as string | null,
    firstFailedHelper: null as string | null,
    firstErrorMessage: null as string | null,
    firstErrorName: null as string | null,
    poolsAtFailure: null as Record<string, number> | null,
    inputsAtFailure: null as Record<string, any> | null,
  }
  
  // Helper to mark checkpoint success
  const markCheckpoint = (checkpoint: string) => {
    if (!microCorridorAudit.firstFailedCheckpoint) {
      microCorridorAudit.checkpointsReached.push(checkpoint)
    }
  }
  
  // Helper to mark first failure (only captures first)
  const markFirstFailure = (
    checkpoint: string,
    helper: string,
    error: Error | string,
    pools?: Record<string, number>,
    inputs?: Record<string, any>
  ) => {
    if (microCorridorAudit.firstFailedCheckpoint) return // Already captured
    microCorridorAudit.firstFailedCheckpoint = checkpoint
    microCorridorAudit.firstFailedHelper = helper
    microCorridorAudit.firstErrorMessage = typeof error === 'string' ? error : error.message
    microCorridorAudit.firstErrorName = typeof error === 'string' ? 'StringError' : error.name
    microCorridorAudit.poolsAtFailure = pools || null
    microCorridorAudit.inputsAtFailure = inputs || null
  }
  
  // Log entry checkpoint for push sessions only (to reduce noise)
  if (isPushSession) {
    console.log('[PHASE15E-MICRO-CORRIDOR-AUDIT] Push session entry:', {
      marker: 'PUSH_SESSION_ENTRY',
      dayFocus: day?.focus,
      dayNumber: day?.dayNumber,
      primaryGoal,
      experienceLevel,
      maxExercises,
      poolCounts: {
        goalExercises: goalExercises?.length || 0,
        availableSkills: availableSkills?.length || 0,
        availableStrength: availableStrength?.length || 0,
        availableAccessory: availableAccessory?.length || 0,
        availableCore: availableCore?.length || 0,
      },
      hasSkillsForSession: !!skillsForSession && skillsForSession.length > 0,
      hasEquipment: !!equipment && equipment.length > 0,
      hasArchitectureContract: !!sessionArchitectureContract,
    })
    markCheckpoint('push_session_entry')
  }
  
  // ==========================================================================
  // [PHASE15E-SELECTOR-INPUT-TRUTH] Create normalized exercise pools for this function
  // All filtering/scoring/fill logic below MUST use these normalized pools
  // This eliminates mixed raw/normalized read crashes
  // ==========================================================================
  const normSkills = normalizeExercisePool(availableSkills)
  const normStrength = normalizeExercisePool(availableStrength)
  const normAccessory = normalizeExercisePool(availableAccessory)
  const normCore = normalizeExercisePool(availableCore)
  const normGoalExercises = normalizeExercisePool(goalExercises)
  
  // Create lookup maps for fast normalized candidate retrieval by ID
  const normalizedById = new Map<string, NormalizedExerciseCandidate>()
  for (const c of [...normSkills, ...normStrength, ...normAccessory, ...normCore]) {
    normalizedById.set(c.id, c)
  }
  
  // Helper to get normalized candidate for a raw exercise (for corridors that still receive raw)
  const getNormalized = (exercise: Exercise): NormalizedExerciseCandidate | null => {
    const id = safeLower(exercise.id)
    return normalizedById.get(id) || null
  }
  
  console.log('[PHASE15E-SELECTOR-INPUT-TRUTH] selectMainExercises pools normalized:', {
    normSkills: normSkills.length,
    normStrength: normStrength.length,
    normAccessory: normAccessory.length,
    normCore: normCore.length,
    normGoalExercises: normGoalExercises.length,
    totalNormalized: normalizedById.size,
    verdict: 'SELECTION_POOLS_NORMALIZED',
  })
  
  // ==========================================================================
  // [PHASE-MATERIALITY] TASK 3: LOG CURRENT WORKING PROGRESSIONS VS HISTORICAL
  // ==========================================================================
  if (currentWorkingProgressions) {
  const progressionAudit: Array<{skill: string, current: string | null, historical: string | null, isConservative: boolean}> = []
  for (const [skill, data] of Object.entries(currentWorkingProgressions)) {
    if (data.currentWorkingProgression || data.historicalCeiling) {
    progressionAudit.push({
      skill,
      current: data.currentWorkingProgression,
      historical: data.historicalCeiling,
      isConservative: data.isConservative,
    })
    }
  }
  if (progressionAudit.length > 0) {
    console.log('[phase-materiality-current-progression-audit]', {
    dayFocus: day.focus,
    primaryGoal,
    progressionData: progressionAudit,
    verdict: progressionAudit.some(p => p.isConservative) 
      ? 'CONSERVATIVE_PROGRESSIONS_ACTIVE' 
      : 'PROGRESSIONS_AT_HISTORICAL_CEILING',
    })
  }
  }
  
  // [PHASE-MATERIALITY] TASK 2: Log material skill intent for this session
  if (materialSkillIntent && materialSkillIntent.length > 0) {
  console.log('[phase-materiality-skill-allocation]', {
    dayFocus: day.focus,
    primarySkill: materialSkillIntent.find(s => s.role === 'primary_spine')?.skill || primaryGoal,
    secondarySkill: materialSkillIntent.find(s => s.role === 'secondary_anchor')?.skill || null,
    supportSkills: materialSkillIntent.filter(s => s.role === 'support').map(s => s.skill),
    deferredSkills: materialSkillIntent.filter(s => s.role === 'deferred').map(s => s.skill),
    skillsWithCurrentProgression: materialSkillIntent.filter(s => s.currentWorkingProgression).length,
  })
  }
  
  // ==========================================================================
  // [PHASE 1 SPINE] AUTHORITATIVE PROGRESSION AUTHORITY ENFORCEMENT
  // ==========================================================================
  // RULE: currentWorkingProgression = authoritative for generation
  //       historicalCeiling = context only, NEVER direct generator authority
  // ==========================================================================
  const authoritativeProgressionMap: Record<string, string | null> = {}
  const historicalCeilingWarnings: string[] = []
  
  if (currentWorkingProgressions) {
    for (const [skill, data] of Object.entries(currentWorkingProgressions)) {
      // ALWAYS use currentWorkingProgression as authoritative
      authoritativeProgressionMap[skill] = data.currentWorkingProgression
      
      // HARD GUARD: If historicalCeiling differs from currentWorkingProgression,
      // the system must use currentWorkingProgression and log the enforcement
      if (data.historicalCeiling && data.currentWorkingProgression && 
          data.historicalCeiling !== data.currentWorkingProgression) {
        historicalCeilingWarnings.push(
          `Skill "${skill}": Using current "${data.currentWorkingProgression}" (NOT historical "${data.historicalCeiling}")`
        )
      }
    }
    
    if (historicalCeilingWarnings.length > 0) {
      console.log('[SPINE-ENFORCEMENT-HISTORICAL-CEILING-BLOCKED]', {
        dayFocus: day.focus,
        warnings: historicalCeilingWarnings,
        verdict: 'HISTORICAL_CEILING_NOT_USED_AS_CURRENT',
        enforcement: 'ACTIVE',
      })
    }
  }
  
  // Helper to get authoritative progression for a skill (NEVER returns historical ceiling)
  const getAuthoritativeProgression = (skillKey: string): string | null => {
    // First try exact match
    if (authoritativeProgressionMap[skillKey]) {
      return authoritativeProgressionMap[skillKey]
    }
    // Try without underscores
    const normalizedKey = skillKey.replace(/_/g, '')
    if (authoritativeProgressionMap[normalizedKey]) {
      return authoritativeProgressionMap[normalizedKey]
    }
    // Check material skill intent
    const intentEntry = materialSkillIntent?.find(s => 
      s.skill === skillKey || s.skill.replace(/_/g, '') === normalizedKey
    )
    return intentEntry?.currentWorkingProgression || null
  }
  
  // ==========================================================================
  // [PHASE 1 AI-TRUTH-ARCHITECTURE] TASK 4: PROGRESSION-BASED EXERCISE FILTERING
  // This filter ensures exercises above the current working progression are blocked
  // unless they are explicitly safe bridge/prep variants.
  // ==========================================================================
  
  // ==========================================================================
  // [PHASE 2C CANONICAL REGISTRY ALIGNMENT]
  // Keys are registered in BOTH underscored and normalized (no-underscore)
  // forms because the lookup below normalizes skillKey via `.replace(/_/g, '')`.
  // Pre-Phase-2C, only `planche` / `hspu` / `manna` matched because they have
  // no underscore — every multi-word skill (`front_lever`, `back_lever`,
  // `l_sit`, `v_sit`, `muscle_up`) silently returned `no_ladder_defined`,
  // which meant the realism-cap was effectively a no-op for those skills and
  // the Phase 2B proximity ranker collapsed into carryover/fatigue tiebreak.
  // ==========================================================================
  const PROGRESSION_LEVEL_ORDER: Record<string, string[]> = {
    // Planche progression
    planche: ['tuck', 'adv_tuck', 'straddle', 'half_lay', 'full'],
    // Front lever progression (normalized key only — skill has underscore)
    frontlever: ['tuck', 'adv_tuck', 'one_leg', 'straddle', 'half_lay', 'full'],
    front_lever: ['tuck', 'adv_tuck', 'one_leg', 'straddle', 'half_lay', 'full'],
    // Back lever progression (normalized key only — skill has underscore)
    // Note: ladder tokens substring-match BOTH `advanced_tuck_back_lever` and
    // any future `adv_tuck_back_lever` alias, because `advanced_tuck` contains
    // `adv_tuck`.
    backlever: ['tuck', 'adv_tuck', 'one_leg', 'straddle', 'half_lay', 'full'],
    back_lever: ['tuck', 'adv_tuck', 'one_leg', 'straddle', 'half_lay', 'full'],
    // HSPU progression. Ladder tokens match pool IDs:
    //   `pike_pushup` → `pike`
    //   `pike_pushup_elevated` → `elevated_pike` (substring of `_elevated`)
    //   `wall_hspu_partial` / `wall_hspu_negative` / `wall_hspu` / `wall_hspu_full` → `wall`
    //   `deficit_hspu` → `deficit`
    //   `freestanding_hs_hold` → `freestanding`
    hspu: ['pike', 'elevated_pike', 'wall', 'deficit', 'freestanding'],
    // Muscle up progression
    muscleup: ['transition_negative', 'transition_band', 'kipping', 'strict'],
    muscle_up: ['transition_negative', 'transition_band', 'kipping', 'strict'],
    // L-sit progression
    lsit: ['tuck', 'one_leg', 'full'],
    l_sit: ['tuck', 'one_leg', 'full'],
    // V-sit progression
    vsit: ['tuck', 'straddle', 'full'],
    v_sit: ['tuck', 'straddle', 'full'],
    // Manna progression
    manna: ['l_sit', 'elevated_l', 'low_manna', 'full'],
    // Dragon flag progression (Phase 2C — previously missing entirely).
    // Pool IDs: `dragon_flag_tuck`, `dragon_flag_neg`, `dragon_flag_assisted`, `dragon_flag`.
    // Final rung uses the literal `dragon_flag` token to match the pure id;
    // earlier iteration order ensures `_tuck` / `_neg` / `_assisted` match
    // their respective rungs first (they all also contain `dragon_flag`).
    dragonflag: ['tuck', 'neg', 'assisted', 'dragon_flag'],
    dragon_flag: ['tuck', 'neg', 'assisted', 'dragon_flag'],
    // Planche push-up progression (Phase 2C — previously missing entirely).
    // Pool IDs: `planche_lean`, `planche_lean_pushup`, `pppu`, `tuck_planche_pushup`.
    planchepushup: ['lean', 'pppu', 'tuck'],
    planche_pushup: ['lean', 'pppu', 'tuck'],
  }
  
  // Track blocked exercises for audit
  const progressionBlockedExercises: Array<{
    exerciseId: string
    skill: string
    exerciseLevel: string
    currentWorkingLevel: string
    reason: string
  }> = []
  
  /**
   * Check if an exercise is within the user's current working progression level.
   * Returns true if the exercise should be ALLOWED, false if it should be BLOCKED.
   */
  const isExerciseWithinCurrentProgression = (
    exercise: Exercise,
    skillKey: string
  ): { allowed: boolean; reason: string; exerciseLevel?: string } => {
    const currentProgression = getAuthoritativeProgression(skillKey)
    if (!currentProgression) {
      // No progression data - allow by default
      return { allowed: true, reason: 'no_progression_data' }
    }
    
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Normalize skill key safely
    const normalizedSkill = safeLower(skillKey).replace(/_/g, '')
    const progressionLadder = PROGRESSION_LEVEL_ORDER[normalizedSkill]
    
    if (!progressionLadder) {
      // No defined ladder for this skill - allow by default
      return { allowed: true, reason: 'no_ladder_defined' }
    }
    
    // Find current level index - safely normalize currentProgression.
    // [PHASE 2C] Longest-match: `advanced_tuck_back_lever` contains BOTH
    // `tuck` and `adv_tuck`. First-match resolved to the `tuck` rung and
    // anchored the realism cap one rung too low, which corrupted every
    // downstream delta calculation for intermediate-tier skills.
    const currentProgressionLower = safeLower(currentProgression)
    let currentLevelIndex = -1
    let currentBestLen = 0
    for (let i = 0; i < progressionLadder.length; i++) {
      const level = progressionLadder[i]
      if (currentProgressionLower.includes(level) && level.length > currentBestLen) {
        currentBestLen = level.length
        currentLevelIndex = i
      }
    }
    
    if (currentLevelIndex === -1) {
      // Can't determine current level - allow by default
      return { allowed: true, reason: 'current_level_not_in_ladder' }
    }
    
    // Check exercise level from ID or name - using safe normalization
    const exerciseIdLower = safeExerciseId(exercise)
    const exerciseNameLower = safeExerciseName(exercise)
    
    // [PHASE 2C CANONICAL REGISTRY ALIGNMENT] Longest-match resolution.
    // See `pickBestCanonicalCandidate` for rationale — both matchers must
    // use the same longest-match rule so the realism cap and the proximity
    // ranker agree on each exercise's rung. First-match-wins mis-classified
    // `adv_tuck_planche` as the `tuck` rung, which meant the cap permitted
    // it at current=`tuck_planche` (delta 0 → allowed) while the ranker
    // scored it +100 exact — silently bypassing realism enforcement.
    let exerciseLevelIndex = -1
    let exerciseLevel = 'unknown'
    let bestMatchLen = 0
    for (let i = 0; i < progressionLadder.length; i++) {
      const level = progressionLadder[i]
      if (exerciseIdLower.includes(level) || exerciseNameLower.includes(level.replace(/_/g, ' '))) {
        if (level.length > bestMatchLen) {
          bestMatchLen = level.length
          exerciseLevelIndex = i
          exerciseLevel = level
        }
      }
    }
    
    if (exerciseLevelIndex === -1) {
      // Exercise doesn't have a clear progression level (might be prep/accessory)
      return { allowed: true, reason: 'no_progression_level_detected', exerciseLevel: 'accessory' }
    }
    
    // Core check: Is the exercise level beyond current working level?
    // Allow current level and one level above (for progression opportunities)
    const maxAllowedIndex = currentLevelIndex + 1
    
    if (exerciseLevelIndex > maxAllowedIndex) {
      // Exercise is too advanced for current working level
      progressionBlockedExercises.push({
        exerciseId: exercise.id,
        skill: skillKey,
        exerciseLevel,
        currentWorkingLevel: currentProgression,
        reason: `Exercise level "${exerciseLevel}" exceeds current working level "${currentProgression}" by more than 1 step`,
      })
      
      return {
        allowed: false,
        reason: `blocked_by_progression_cap`,
        exerciseLevel,
      }
    }
    
    return {
      allowed: true,
      reason: exerciseLevelIndex === currentLevelIndex ? 'matches_current_level' : 'within_safe_bridge',
      exerciseLevel,
    }
  }
  
  /**
   * Filter an exercise pool to remove exercises above the user's current working progression.
   * [PHASE 1 AI-TRUTH-ARCHITECTURE] This is the key enforcement point.
   */
  const filterByCurrentProgression = <T extends { exercise: Exercise }>(
    candidates: T[],
    skillKey: string
  ): { filtered: T[]; blocked: T[]; audit: { skill: string; before: number; after: number; blockedCount: number } } => {
    const blocked: T[] = []
    const filtered = candidates.filter(c => {
      const check = isExerciseWithinCurrentProgression(c.exercise, skillKey)
      if (!check.allowed) {
        blocked.push(c)
        return false
      }
      return true
    })
    
    const audit = {
      skill: skillKey,
      before: candidates.length,
      after: filtered.length,
      blockedCount: blocked.length,
    }
    
    if (blocked.length > 0) {
      console.log('[AI-TRUTH-ARCHITECTURE-PROGRESSION-FILTER]', {
        ...audit,
        blockedExercises: blocked.slice(0, 5).map(b => b.exercise.id),
        currentWorkingProgression: getAuthoritativeProgression(skillKey),
        verdict: 'EXERCISES_BLOCKED_BY_CURRENT_PROGRESSION',
      })
    }
    
    return { filtered, blocked, audit }
  }

  // ==========================================================================
  // [PHASE 1 SELECTED-SKILL DIRECT-EXPRESSION LOCK]
  // ==========================================================================
  // Canonical-registry-backed candidate builder for non-primary selected skills
  // (secondary_anchor / tertiary / support from materialSkillIntent).
  //
  // Priority order (deterministic):
  //   1. ADVANCED_SKILL_FAMILIES[skill].directProgressions     <- canonical direct
  //   2. getAdvancedSkillSupport(skill).primary/secondary/trunk <- canonical support
  //   3. Substring/transfer matching                            <- legacy fallback
  //
  // This function REPLACES the substring-first candidate search that previously
  // ran inside the tertiary and support injection sites. Substring matching
  // used `name.includes(skillLower)` which under-matches specific canonical
  // progressions (e.g. "skin_the_cat" for back_lever doesn't include
  // "backlever" substring) and over-matches broadly-named exercises. Sourcing
  // from ADVANCED_SKILL_FAMILIES.directProgressions and
  // getAdvancedSkillSupport() gives the selector the exact registered
  // progression ladder for each selected skill.
  //
  // Progression-cap (Phase 2) is NOT applied here -- callers pipe the returned
  // candidates through `filterByCurrentProgression(scored, skill)` before
  // addExercise(). Separating the two keeps the candidate-builder pure and
  // reusable, and ensures the single authoritative cap owner stays
  // `filterByCurrentProgression` at line 2646.
  const buildCanonicalSkillCandidates = (
    skillKey: string,
    pools: readonly Exercise[][],
    currentUsedIds: Set<string>
  ): {
    candidates: Exercise[]
    source: 'canonical_direct' | 'canonical_support' | 'transfer_fallback'
  } => {
    const allPool: Exercise[] = []
    const byId = new Map<string, Exercise>()
    for (const pool of pools) {
      for (const ex of pool) {
        if (!byId.has(ex.id)) {
          byId.set(ex.id, ex)
          allPool.push(ex)
        }
      }
    }

    // 1. Canonical direct progressions from ADVANCED_SKILL_FAMILIES
    if (isAdvancedSkill(skillKey)) {
      const family = getAdvancedSkillFamily(skillKey)
      if (family && Array.isArray(family.directProgressions) && family.directProgressions.length > 0) {
        const direct: Exercise[] = []
        for (const exId of family.directProgressions) {
          const found = byId.get(exId)
          if (found && !currentUsedIds.has(exId)) direct.push(found)
        }
        if (direct.length > 0) {
          return { candidates: direct, source: 'canonical_direct' }
        }
      }
    }

    // 2. Canonical support mappings from getAdvancedSkillSupport()
    // Wrapped in try/catch because the registry throws on unknown skill ids
    // for some callers; we must never fail the selector for a registry miss.
    try {
      const advSupport = getAdvancedSkillSupport(skillKey)
      if (advSupport) {
        const supportIds = new Set<string>()
        for (const s of advSupport.primary) for (const id of s.exerciseIds) supportIds.add(id)
        for (const s of advSupport.secondary) for (const id of s.exerciseIds) supportIds.add(id)
        for (const id of advSupport.trunk.exerciseIds) supportIds.add(id)
        const support: Exercise[] = []
        for (const id of supportIds) {
          const found = byId.get(id)
          if (found && !currentUsedIds.has(id)) support.push(found)
        }
        if (support.length > 0) {
          return { candidates: support, source: 'canonical_support' }
        }
      }
    } catch {
      // Silently fall through to transfer-matching fallback
    }

    // 3. Substring / transfer-matching fallback (preserves prior behavior so
    //    a registry miss never reduces candidate pool below the old baseline).
    const skillLower = safeLower(skillKey).replace(/_/g, '')
    if (!skillLower) return { candidates: [], source: 'transfer_fallback' }
    const fallback = allPool.filter(e =>
      !currentUsedIds.has(e.id) && (
        exerciseTransfersToSkill(e, skillLower) ||
        safeExerciseId(e).includes(skillLower) ||
        safeExerciseName(e).includes(skillLower) ||
        (e.primarySkills || []).some(p => safeLower(p).includes(skillLower))
      )
    )
    return { candidates: fallback, source: 'transfer_fallback' }
  }

  // ==========================================================================
  // [PHASE 2B CANONICAL SPECIFICITY LOCK]
  // ==========================================================================
  // Picks the SINGLE best canonical candidate for a selected skill, using
  // proximity to `currentWorkingProgression` as the dominant criterion.
  //
  // WHY THIS EXISTS
  // ---------------
  // Phase 1B guaranteed selected-skill SURVIVAL into the committed session.
  // But every call site (tertiary injection, support injection, realism
  // reroutes, and the PHASE1B-FINAL-SELECTED-SKILL-COMMIT pass) then picked
  // `filtered[0]` / `sorted[0]` / first `.find(...)` match. Because
  // `ADVANCED_SKILL_FAMILIES.directProgressions` is registered in
  // low→high order AND `filterByCurrentProgression` lets every rung up
  // through `currentLevelIndex + 1` survive, index 0 was always the
  // EASIEST rung — a `straddle_planche`-capable athlete kept receiving
  // `tuck_planche` committed rows.
  //
  // WHAT IT DOES
  // ------------
  // For each candidate, it derives the exercise's ladder position using the
  // same substring match already used by `isExerciseWithinCurrentProgression`
  // (so nothing drifts from the authoritative realism gate). It then scores:
  //
  //   +100 exact match with currentWorkingProgression     (most canonical)
  //   +90  one rung below current (prime working-set)
  //   +80  one rung above current (realistic bridge)
  //   +70  two rungs below (canonical but less specific)
  //   +60  any other ladder-matched rung
  //   +40  exercise has no detected ladder position (accessory-class)
  //
  // Within the same proximity tier, carryover (desc) then fatigueCost (asc)
  // break ties so heavier rings variants lose to the cleaner textbook rung.
  //
  // WHAT IT DOES NOT TOUCH
  // ----------------------
  //   - progression cap owner (still `filterByCurrentProgression`)
  //   - canonical registry (still ADVANCED_SKILL_FAMILIES + getAdvancedSkillSupport)
  //   - survival contract (Phase 1B final-commit pass still runs unchanged;
  //     this only improves WHICH exercise represents the skill, never whether
  //     it appears)
  //   - mirror / UI / live runtime
  const pickBestCanonicalCandidate = (
    candidates: Exercise[],
    skillKey: string
  ): {
    exercise: Exercise | null
    matchQuality: 'exact' | 'one_below' | 'one_above_bridge' | 'regression' | 'other_ladder' | 'no_ladder'
    exerciseLevel: string
    specificityScore: number
  } => {
    if (candidates.length === 0) {
      return { exercise: null, matchQuality: 'no_ladder', exerciseLevel: 'none', specificityScore: 0 }
    }

    const currentProgression = getAuthoritativeProgression(skillKey)
    const normalizedSkill = safeLower(skillKey).replace(/_/g, '')
    const ladder = PROGRESSION_LEVEL_ORDER[normalizedSkill]

    // No ladder or no working progression data -> keep registry order but
    // still prefer higher carryover / lower fatigue for tie-break.
    if (!currentProgression || !ladder) {
      const ranked = [...candidates].sort((a, b) => {
        const coDiff = (b.carryover || 0) - (a.carryover || 0)
        if (coDiff !== 0) return coDiff
        return (a.fatigueCost || 3) - (b.fatigueCost || 3)
      })
      return {
        exercise: ranked[0],
        matchQuality: 'no_ladder',
        exerciseLevel: 'unknown',
        specificityScore: 40,
      }
    }

    const currentLower = safeLower(currentProgression)
    // [PHASE 2C] Longest-match for currentWorkingProgression → ladder index too.
    // Athlete at `advanced_tuck_back_lever` must resolve to `adv_tuck` (index 1)
    // not `tuck` (index 0). Without this, realism cap anchors to the wrong rung
    // and proximity ranker's delta calculation is off-by-N.
    let currentLevelIndex = -1
    let currentBestLen = 0
    for (let i = 0; i < ladder.length; i++) {
      const level = ladder[i]
      if (currentLower.includes(level) && level.length > currentBestLen) {
        currentBestLen = level.length
        currentLevelIndex = i
      }
    }
    if (currentLevelIndex === -1) {
      // Current level unrecognized -> degrade to registry-order + tiebreak.
      const ranked = [...candidates].sort((a, b) => {
        const coDiff = (b.carryover || 0) - (a.carryover || 0)
        if (coDiff !== 0) return coDiff
        return (a.fatigueCost || 3) - (b.fatigueCost || 3)
      })
      return {
        exercise: ranked[0],
        matchQuality: 'no_ladder',
        exerciseLevel: 'unknown',
        specificityScore: 40,
      }
    }

    type Scored = {
      exercise: Exercise
      exerciseLevelIndex: number
      exerciseLevel: string
      score: number
      quality: 'exact' | 'one_below' | 'one_above_bridge' | 'regression' | 'other_ladder' | 'no_ladder'
    }

    const scored: Scored[] = candidates.map(ex => {
      const idLower = safeExerciseId(ex)
      const nameLower = safeExerciseName(ex)
      // [PHASE 2C CANONICAL REGISTRY ALIGNMENT] Longest-match resolution.
      // Pre-Phase-2C this loop used first-match-wins, which mis-resolved
      // every substring-prefix case: `adv_tuck_planche` contains both
      // `tuck` and `adv_tuck`, so `['tuck', 'adv_tuck', ...]` iteration
      // always resolved the adv-tuck rung to the plain tuck rung, collapsing
      // delta = +1 into delta = 0 and silently flattening the realism cap +
      // proximity ranker. Longest-match guarantees the most-specific ladder
      // token wins regardless of ladder order.
      let exerciseLevelIndex = -1
      let exerciseLevel = 'unknown'
      let bestMatchLen = 0
      for (let i = 0; i < ladder.length; i++) {
        const level = ladder[i]
        const nameToken = level.replace(/_/g, ' ')
        if (idLower.includes(level) || nameLower.includes(nameToken)) {
          if (level.length > bestMatchLen) {
            bestMatchLen = level.length
            exerciseLevelIndex = i
            exerciseLevel = level
          }
        }
      }

      if (exerciseLevelIndex === -1) {
        return { exercise: ex, exerciseLevelIndex, exerciseLevel, score: 40, quality: 'no_ladder' as const }
      }

      const delta = exerciseLevelIndex - currentLevelIndex
      if (delta === 0) return { exercise: ex, exerciseLevelIndex, exerciseLevel, score: 100, quality: 'exact' as const }
      if (delta === -1) return { exercise: ex, exerciseLevelIndex, exerciseLevel, score: 90, quality: 'one_below' as const }
      if (delta === 1) return { exercise: ex, exerciseLevelIndex, exerciseLevel, score: 80, quality: 'one_above_bridge' as const }
      if (delta === -2) return { exercise: ex, exerciseLevelIndex, exerciseLevel, score: 70, quality: 'regression' as const }
      // delta <= -3 or delta >= 2 (delta >= 2 would have been blocked by
      // filterByCurrentProgression upstream, but we keep the branch for
      // direct-candidate callers that bypass the gate — they still get
      // canonical priority over non-ladder candidates).
      return { exercise: ex, exerciseLevelIndex, exerciseLevel, score: 60, quality: 'other_ladder' as const }
    })

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const coDiff = (b.exercise.carryover || 0) - (a.exercise.carryover || 0)
      if (coDiff !== 0) return coDiff
      return (a.exercise.fatigueCost || 3) - (b.exercise.fatigueCost || 3)
    })

    const best = scored[0]
    return {
      exercise: best.exercise,
      matchQuality: best.quality,
      exerciseLevel: best.exerciseLevel,
      specificityScore: best.score,
    }
  }

  const selected: SelectedExercise[] = []
  const usedIds = new Set<string>()
  
  // =========================================================================
  // SESSION LOAD TRACKING FOR ANTI-BLOAT
  // =========================================================================
  let currentWeightedLoad = 0
  let highFatigueCount = 0
  let straightArmCount = 0
  let primaryCount = 0
  
  // =========================================================================
  // MOVEMENT INTELLIGENCE TRACKING
  // =========================================================================
  const movementIntelligentExercises: MovementIntelligentExercise[] = []
  const jointStressAccumulator = {
    shoulder: 0,
    elbow: 0,
    wrist: 0,
    lowerBack: 0,
  }
  let compressionCoreCount = 0
  let antiExtensionCoreCount = 0
  let verticalPushCount = 0
  let horizontalPushCount = 0
  let verticalPullCount = 0
  let horizontalPullCount = 0
  
  // Session load limits based on typical skill/strength session
  const WEIGHTED_LOAD_LIMIT = 5.5  // Typical max for skill_strength_dominant
  const HIGH_FATIGUE_LIMIT = 3
  const STRAIGHT_ARM_LIMIT = 2
  const PRIMARY_LIMIT = 3
  
  // Joint stress limits (scaled from StressLevel: low=1, moderate=2, high=3, very_high=4)
  const JOINT_STRESS_LIMITS = {
    shoulder: 10,  // Allow up to moderate stress * 5 exercises
    elbow: 8,
    wrist: 8,
    lowerBack: 8,
  }
  
  const stressToNumber = (stress: StressLevel): number => {
    return stress === 'low' ? 1 : stress === 'moderate' ? 2 : stress === 'high' ? 3 : 4
  }
  
  // [exercise-trace] Track rejected alternatives for traceability (moved before canAddMore)
  const sessionRejectedAlternatives: RejectedAlternative[] = []
  
  // Helper to track a rejected alternative
  const trackRejection = (
    exerciseId: string,
    exerciseName: string,
    rejectionReason: RejectionReason,
    details?: string
  ) => {
    // Keep only top 20 most recent rejects per session
    if (sessionRejectedAlternatives.length >= 20) {
      sessionRejectedAlternatives.shift()
    }
    sessionRejectedAlternatives.push({ exerciseId, exerciseName, rejectionReason, details })
    console.log('[exercise-trace] REJECTED:', { exerciseId, reason: rejectionReason, details })
  }

  // Helper to check if we can add more based on load and movement intelligence
  const canAddMore = (exercise: Exercise, deliveryStyle: DeliveryStyle = 'standalone'): boolean => {
    const metadata = buildExerciseLoadMetadata(
      {
        category: exercise.category,
        neuralDemand: exercise.neuralDemand,
        fatigueCost: exercise.fatigueCost,
        movementPattern: exercise.movementPattern,
        isIsometric: exercise.isIsometric,
      },
      deliveryStyle
    )
    
    // Get movement intelligence for this exercise
    const movementIntel = normalizeToMovementIntelligent(exercise)
    
    // Check if adding this exercise would exceed limits
    const newWeightedLoad = currentWeightedLoad + metadata.sessionCountWeight
    const newHighFatigue = highFatigueCount + (metadata.fatigueWeight === 'high' ? 1 : 0)
    const newStraightArm = straightArmCount + (movementIntel.armType === 'straight_arm' ? 1 : 0)
    const newPrimary = primaryCount + (metadata.role === 'skill_primary' || metadata.role === 'strength_primary' ? 1 : 0)
    
    // For accessory/rehab/core, be more lenient with raw exercise count
    const isLowImpact = metadata.role === 'accessory' || metadata.role === 'rehab_prep' || metadata.role === 'core'
    
    // Critical limits that should never be exceeded - [exercise-trace] TASK 4: Track rejections
    if (newHighFatigue > HIGH_FATIGUE_LIMIT + 1) {
      trackRejection(exercise.id, exercise.name, 'fatigue_limit', 'High fatigue limit exceeded')
      return false
    }
    if (newStraightArm > STRAIGHT_ARM_LIMIT + 1) {
      trackRejection(exercise.id, exercise.name, 'straight_arm_limit', 'Straight arm limit exceeded')
      return false
    }
    if (newPrimary > PRIMARY_LIMIT + 1) {
      trackRejection(exercise.id, exercise.name, 'fatigue_limit', 'Primary exercise limit exceeded')
      return false
    }
    
    // Weighted load check (more lenient for low-impact exercises)
    if (!isLowImpact && newWeightedLoad > WEIGHTED_LOAD_LIMIT + 1) {
      trackRejection(exercise.id, exercise.name, 'fatigue_limit', 'Weighted load limit exceeded')
      return false
    }
    
    // =========================================================================
    // MOVEMENT INTELLIGENCE CHECKS - [exercise-trace] TASK 4: Track joint stress rejections
    // =========================================================================
    
    // Check joint stress accumulation
    const newShoulderStress = jointStressAccumulator.shoulder + stressToNumber(movementIntel.jointStress.shoulder)
    const newElbowStress = jointStressAccumulator.elbow + stressToNumber(movementIntel.jointStress.elbow)
    const newWristStress = jointStressAccumulator.wrist + stressToNumber(movementIntel.jointStress.wrist)
    const newLowerBackStress = jointStressAccumulator.lowerBack + stressToNumber(movementIntel.jointStress.lowerBack)
    
    // Reject if any joint is overloaded
    if (newShoulderStress > JOINT_STRESS_LIMITS.shoulder) {
      trackRejection(exercise.id, exercise.name, 'joint_stress_exceeded', 'Shoulder stress limit exceeded')
      return false
    }
    if (newWristStress > JOINT_STRESS_LIMITS.wrist) {
      trackRejection(exercise.id, exercise.name, 'joint_stress_exceeded', 'Wrist stress limit exceeded')
      return false
    }
    if (newElbowStress > JOINT_STRESS_LIMITS.elbow) {
      trackRejection(exercise.id, exercise.name, 'joint_stress_exceeded', 'Elbow stress limit exceeded')
      return false
    }
    
    return true
  }
  
  // [exercise-trace] TASK 2: Enhanced addExercise with full traceability
  // Helper to add exercise with prerequisite gate check, load tracking, and trace
  // [SELECTOR_CONTEXT_DECLOSURE_V1] ownedCtx is EXPLICIT PARAMETER - no closure dependency
  const addExercise = (
    ownedCtx: SelectorRuntimeContext, // DECLOSURE: explicit parameter, not closure
    exercise: Exercise,
    reason: string,
    setsOverride?: number,
    repsOverride?: string,
    noteOverride?: string,
    deliveryStyle: DeliveryStyle = 'standalone',
    // [exercise-trace] TASK 2: Trace context parameters
    traceContext?: {
      primarySelectionReason: ExerciseSelectionReason
      sessionRole: TraceSessionRole
      expressionMode: TraceExpressionMode
      influencingSkills?: Array<{
        skillId: string
        influence: 'primary' | 'secondary' | 'selected' | 'limiter_related'
        expressionMode: SkillExpressionMode
      }>
      doctrineSource?: DoctrineSourceTrace
      exerciseFamily?: string
      candidatePoolSize?: number
      weightedConsidered?: boolean
      weightedEligible?: boolean
      weightedBlockerReason?: WeightedBlockerReason
      limiterInfluence?: string
      recoveryInfluence?: string
      // [EXERCISE-SELECTION-MATERIALITY] Materiality trace fields
      materialityReasonCode?: string
      materialityConfidence?: 'high' | 'medium' | 'low'
      materialityFactors?: string[]
    }
  ) => {
    // [SELECTOR_CONTEXT_DECLOSURE_V1] Validate explicit parameter ownership
    assertRuntimeContext(ownedCtx, 'addExercise')
    
    if (usedIds.has(exercise.id)) return false
    if (selected.length >= maxExercises) return false
    
    // ==========================================================================
    // [DOCTRINE-DRIVEN-BLOCKING] Block generic filler exercises when doctrine active
    // This is where doctrine ACTUALLY filters exercise choices, not just logs
    // [SELECTOR_CONTEXT_DECLOSURE_V1] Uses ownedCtx explicit parameter
    // ==========================================================================
    if (ownedCtx.doctrine.active && ownedCtx.doctrine.preventGenericFiller) {
      const exNameLower = safeLower(exercise.name || '')
      const exIdLower = safeLower(exercise.id || '')
      
      for (const blockedPattern of ownedCtx.doctrine.genericFillerBlocked) {
        const patternLower = blockedPattern.toLowerCase().replace(/_/g, ' ')
        if (exNameLower.includes(patternLower) || exIdLower.includes(patternLower.replace(/ /g, '_'))) {
          console.log('[DOCTRINE-BLOCKED-EXERCISE]', {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            blockedPattern,
            dominantSpine: ownedCtx.doctrine.dominantSpine,
            reason: `Generic filler blocked for ${ownedCtx.doctrine.dominantSpine} spine`,
            verdict: 'DOCTRINE_BLOCKED_GENERIC_FILLER',
          })
          return false
        }
      }
    }
    
    // Check load limits before adding
    if (!canAddMore(exercise, deliveryStyle)) return false
    
    // Apply prerequisite gate check
    const { exercise: finalExercise, gateResult, wasSubstituted, originalId } = 
      applyPrerequisiteGate(exercise, prerequisiteContext, experienceLevel)
    
    usedIds.add(finalExercise.id)
    if (originalId) usedIds.add(originalId)
    
    // Get knowledge bubble for educational context
    const knowledgeBubble = getExerciseKnowledgeBubble(exercise.id)
    
    // Build load metadata
    const loadMetadata = buildExerciseLoadMetadata(
      {
        category: finalExercise.category,
        neuralDemand: finalExercise.neuralDemand,
        fatigueCost: finalExercise.fatigueCost,
        movementPattern: finalExercise.movementPattern,
        isIsometric: finalExercise.isIsometric,
      },
      deliveryStyle
    )
    
    // Update running totals
    currentWeightedLoad += loadMetadata.sessionCountWeight
    if (loadMetadata.fatigueWeight === 'high') highFatigueCount++
    if (loadMetadata.jointStressCategory === 'straight_arm') straightArmCount++
    if (loadMetadata.role === 'skill_primary' || loadMetadata.role === 'strength_primary') primaryCount++
    
    // =========================================================================
    // UPDATE MOVEMENT INTELLIGENCE TRACKING
    // =========================================================================
    const movementIntel = normalizeToMovementIntelligent(finalExercise)
    movementIntelligentExercises.push(movementIntel)
    
    // Update joint stress accumulator
    jointStressAccumulator.shoulder += stressToNumber(movementIntel.jointStress.shoulder)
    jointStressAccumulator.elbow += stressToNumber(movementIntel.jointStress.elbow)
    jointStressAccumulator.wrist += stressToNumber(movementIntel.jointStress.wrist)
    jointStressAccumulator.lowerBack += stressToNumber(movementIntel.jointStress.lowerBack)
    
    // Track pattern counts using movement intelligence
    if (movementIntel.armType === 'straight_arm') straightArmCount++
    if (movementIntel.primaryPattern === 'compression_core') compressionCoreCount++
    if (movementIntel.primaryPattern === 'anti_extension_core') antiExtensionCoreCount++
    if (movementIntel.primaryPattern === 'vertical_push') verticalPushCount++
    if (movementIntel.primaryPattern === 'horizontal_push') horizontalPushCount++
    if (movementIntel.primaryPattern === 'vertical_pull') verticalPullCount++
    if (movementIntel.primaryPattern === 'horizontal_pull') horizontalPullCount++
    
    console.log('[movement-intel] Added exercise:', {
      id: finalExercise.id,
      pattern: movementIntel.primaryPattern,
      armType: movementIntel.armType,
      trunkDemand: movementIntel.trunkDemand,
      jointStress: movementIntel.jointStress,
    })
    
    // =========================================================================
    // PRESCRIPTION-AWARE SETS/REPS/NOTES (TASK 1, 2)
    // Use prescription contract for intelligent programming instead of generic defaults
    // =========================================================================
    let finalSets = setsOverride
    let finalRepsOrTime = repsOverride
    let finalNote = noteOverride
    
    // Only apply prescription logic if no override provided
    if (finalSets === undefined || finalRepsOrTime === undefined) {
      const prescriptionResult = getPrescriptionAwarePrescription(
        finalExercise,
        experienceLevel,
        primaryGoal,
        undefined, // currentProgression - could be passed from context
        undefined, // fatigueState - could be passed from context
        undefined  // recentPerformance - could be passed from context
      )
      
      if (finalSets === undefined) {
        finalSets = prescriptionResult.sets
      }
      if (finalRepsOrTime === undefined) {
        finalRepsOrTime = prescriptionResult.repsOrTime
      }
      if (finalNote === undefined && prescriptionResult.note) {
        finalNote = prescriptionResult.note
      }
      
      // Log prescription decision in dev mode
      if (process.env.NODE_ENV !== 'production') {
        logPrescriptionDiagnostics({
          exerciseId: finalExercise.id,
          detectedMode: prescriptionResult.prescriptionMode,
          resolvedPrescription: {
            sets: prescriptionResult.sets.toString(),
            volume: prescriptionResult.repsOrTime,
            rest: 'default',
            intensity: prescriptionResult.note || 'standard',
          },
          athleteAdjustments: [`Level: ${experienceLevel}`],
        })
      }
    }
    
    // =========================================================================
    // WEIGHTED LOAD PR: Calculate prescribed load for weighted exercises
    // =========================================================================
    let prescribedLoad: SelectedExercise['prescribedLoad'] = undefined
    const isWeightedExercise = finalExercise.id.includes('weighted_pull') || 
                               finalExercise.id.includes('weighted_dip') ||
                               finalExercise.id.includes('weighted_push') ||
                               finalExercise.id.includes('weighted_row')
    
    // [weighted-truth] TASK F: Track no-load reason for weighted-eligible exercises
    let noLoadReason: SelectedExercise['noLoadReason'] = null
    
    // [weighted-prescription-truth] TASK 8: Log weighted exercise eligibility
    if (isWeightedExercise) {
      console.log('[weighted-truth] Weighted exercise detected:', {
        exerciseId: finalExercise.id,
        exerciseName: finalExercise.name,
        hasWeightedEquipment,
        hasWeightedBenchmarks: !!weightedBenchmarks,
        hasPullUpBenchmark: !!weightedBenchmarks?.weightedPullUp?.current,
        hasDipBenchmark: !!weightedBenchmarks?.weightedDip?.current,
      })
      
      // [weighted-truth] TASK F: Determine and log no-load reason
      if (!hasWeightedEquipment) {
        noLoadReason = 'no_loadable_equipment'
        console.log('[weighted-truth] No load prescribed - reason:', noLoadReason)
      } else if (!weightedBenchmarks) {
        noLoadReason = 'missing_strength_inputs'
        console.log('[weighted-truth] No load prescribed - reason:', noLoadReason)
      }
    }
    
    if (isWeightedExercise && weightedBenchmarks) {
      // Determine exercise type and get appropriate benchmarks
      const exerciseType: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | 'weighted_row' =
        finalExercise.id.includes('weighted_pull') ? 'weighted_pull_up' :
        finalExercise.id.includes('weighted_dip') ? 'weighted_dip' :
        finalExercise.id.includes('weighted_push') ? 'weighted_push_up' : 'weighted_row'
      
      const benchmarkData = exerciseType === 'weighted_pull_up' ? weightedBenchmarks.weightedPullUp
        : exerciseType === 'weighted_dip' ? weightedBenchmarks.weightedDip
        : null
      
      if (benchmarkData) {
        // [prescription] ISSUE D: Session role affects prescription mode
        // Both rep target AND day focus influence the prescription
        const repsStr = finalRepsOrTime || '5'
        const repTarget = parseInt(repsStr.split('-')[0]) || 5
        
        // Determine if this is a heavier strength day based on focus
        const isHeavyStrengthDay = day.focus === 'push_strength' || day.focus === 'pull_strength'
        const isSupportDay = day.focus === 'support_recovery' || day.focus === 'support_conditioning'
        const isSkillDay = day.focus === 'skill' || day.focus === 'push_skill' || day.focus === 'pull_skill'
        
        // [prescription] Session role modifies prescription mode
        let prescriptionMode: WeightedPrescriptionMode
        if (isHeavyStrengthDay) {
          // Heavy strength days: bias toward heavier loads regardless of rep scheme
          prescriptionMode = repTarget <= 6 ? 'strength_primary' : 'strength_support'
        } else if (isSupportDay) {
          // Support days: bias toward volume/hypertrophy
          prescriptionMode = repTarget <= 8 ? 'volume_support' : 'hypertrophy'
        } else if (isSkillDay) {
          // Skill days: weighted work is support - moderate intensity
          prescriptionMode = repTarget <= 5 ? 'strength_support' : 'volume_support'
        } else {
          // Mixed/default: use rep-based logic
          prescriptionMode = 
            repTarget <= 5 ? 'strength_primary' :
            repTarget <= 6 ? 'strength_support' :
            repTarget <= 10 ? 'volume_support' : 'hypertrophy'
        }
        
        // [prescription] Log how session role influences load
        console.log('[prescription] Session role → prescription mode:', {
          exerciseId: finalExercise.id,
          dayFocus: day.focus,
          repTarget,
          prescriptionMode,
          hasBenchmark: !!benchmarkData.current,
          hasPR: !!benchmarkData.pr,
        })
        
        const loadPrescription = estimateWeightedLoadPrescription(
          exerciseType,
          prescriptionMode,
          benchmarkData.current,
          benchmarkData.pr
        )
        
        // Log the estimation
        logWeightedLoadEstimation(exerciseType, prescriptionMode, loadPrescription)
        
        // Build prescribed load object if we have data
        if (loadPrescription.loadBasis !== 'no_data') {
          prescribedLoad = {
            load: loadPrescription.prescribedLoad,
            unit: loadPrescription.loadUnit,
            basis: loadPrescription.loadBasis,
            confidenceLevel: loadPrescription.confidenceLevel,
            estimated1RM: loadPrescription.estimated1RM ?? undefined,
            targetReps: loadPrescription.targetReps,
            intensityBand: loadPrescription.intensityBand,
            notes: loadPrescription.notes.length > 0 ? loadPrescription.notes : undefined,
          }
          
          // [weighted-truth] Log successful prescription
          console.log('[weighted-truth] Prescribed load generated:', {
            exerciseId: finalExercise.id,
            load: prescribedLoad.load,
            unit: prescribedLoad.unit,
            confidence: prescribedLoad.confidenceLevel,
          })
          
          // Update note with load prescription
          if (loadPrescription.prescribedLoad > 0) {
            const loadDisplay = formatWeightedLoadDisplay(loadPrescription)
            finalNote = finalNote 
              ? `${loadDisplay}. ${finalNote}`
              : `${loadDisplay}`
          }
        } else {
          // [weighted-truth] TASK F: Track no-data as a reason
          noLoadReason = 'missing_strength_inputs'
          console.log('[weighted-truth] No load - benchmark data returned no_data')
        }
      } else {
        // [weighted-truth] TASK F: No benchmark for this specific exercise type
        if (isWeightedExercise && !noLoadReason) {
          noLoadReason = 'missing_strength_inputs'
          console.log('[weighted-truth] No benchmark data for this exercise type')
        }
      }
    }
    
    // =========================================================================
    // [exercise-trace] TASK 2: Build selection trace
    // =========================================================================
    const isWeightedCapable = finalExercise.id.includes('pull_up') || 
                               finalExercise.id.includes('dip') ||
                               finalExercise.id.includes('push_up') ||
                               finalExercise.id.includes('row')
    
    // Build weighted decision trace for weighted-capable exercises
    let equipmentDecision: WeightedDecisionTrace | null = null
    if (isWeightedCapable) {
      const weightedChosen = isWeightedExercise && prescribedLoad !== undefined
      equipmentDecision = {
        weightedConsidered: traceContext?.weightedConsidered ?? isWeightedCapable,
        weightedEligible: traceContext?.weightedEligible ?? (weightedBenchmarks !== undefined),
        weightedChosen,
        weightedBlockerReason: weightedChosen ? null : (
          traceContext?.weightedBlockerReason ?? 
          (!weightedBenchmarks ? 'no_benchmark_confidence' : 
           !equipment?.includes('weight_belt') && !equipment?.includes('weight_vest') ? 'no_loadable_equipment' : 
           null)
        ),
        prescribedLoad: weightedChosen && prescribedLoad ? {
          load: prescribedLoad.load,
          unit: prescribedLoad.unit,
          basis: prescribedLoad.basis,
        } : undefined,
      }
    }

    // Determine selection reason from reason string if not provided
    const inferredReason = inferSelectionReason(reason, finalExercise, primaryGoal)
    
    // Build the trace object
    const selectionTrace: ExerciseSelectionTrace = {
      exerciseId: finalExercise.id,
      exerciseName: finalExercise.name,
      slotType: 'main',
      sessionRole: traceContext?.sessionRole ?? inferSessionRole(loadMetadata?.role),
      expressionMode: traceContext?.expressionMode ?? 'strength_support',
      primarySelectionReason: traceContext?.primarySelectionReason ?? inferredReason,
      secondaryInfluences: [],
      influencingSkills: traceContext?.influencingSkills ?? [],
      doctrineSource: traceContext?.doctrineSource ?? null,
      exerciseFamily: traceContext?.exerciseFamily ?? movementIntel.primaryPattern ?? null,
      candidatePoolSummary: {
        totalCandidates: traceContext?.candidatePoolSize ?? 0,
        filteredByEquipment: 0,
        filteredBySessionRole: 0,
        filteredBySkillWeight: 0,
        finalRankedCandidates: traceContext?.candidatePoolSize ?? 1,
      },
      rejectedAlternatives: sessionRejectedAlternatives.slice(-5), // Last 5 rejects
      equipmentDecision,
      loadabilityInfluence: prescribedLoad ? `Load: +${prescribedLoad.load}${prescribedLoad.unit}` : null,
      limiterInfluence: traceContext?.limiterInfluence ?? null,
      recoveryInfluence: traceContext?.recoveryInfluence ?? null,
      confidence: traceContext ? 0.8 : 0.5,
      traceQuality: traceContext ? 'partial' : 'minimal',
      // [EXERCISE-SELECTION-MATERIALITY] Include materiality metadata if available
      materialityReasonCode: traceContext?.materialityReasonCode,
      materialityConfidence: traceContext?.materialityConfidence,
      materialityFactors: traceContext?.materialityFactors,
    }
    
    // [exercise-trace] TASK 7: Log the trace
    logExerciseTrace(selectionTrace)

    // [LIVE-EXECUTION-TRUTH] Build the authoritative execution truth contract
    // Use the first influencing skill as the matched skill for progression data
    const matchedSkillForExecution = traceContext?.influencingSkills?.[0]?.skillId || finalExercise.primarySkill || null
    const executionTruth = buildExecutionTruth(finalExercise, currentWorkingProgressions, matchedSkillForExecution)
    
    // ==========================================================================
    // [PRESCRIPTION-INTELLIGENCE] Resolve canonical prescription from truth
    // This replaces the generic adjustSetsForLevel/adjustRepsForLevel functions
    // ==========================================================================
    let canonicalSets = finalSets
    let canonicalRepsOrTime = finalRepsOrTime
    let canonicalNote = finalNote
    
    if (!finalSets || !finalRepsOrTime) {
      // Detect prescription mode from exercise characteristics
      const isWeighted = safeExerciseId(finalExercise).includes('weighted') || 
                         safeExerciseName(finalExercise).includes('weighted')
      const prescriptionMode = detectPrescriptionMode(
        finalExercise.category,
        finalExercise.isIsometric ?? false,
        finalExercise.neuralDemand,
        finalExercise.fatigueCost,
        isWeighted,
        finalExercise.id
      )
      
      // Infer exercise role from selection context
      // [PHASE15E-EXERCISE-SELECTION-FIX] Guard against null/undefined reason or primaryGoal
      const safeReason = reason || ''
      const safePrimaryGoal = primaryGoal || ''
      const isPrimaryGoalMatch = finalExercise.primarySkill === primaryGoal || 
        (safeReason && safePrimaryGoal && safeReason.toLowerCase().includes(safePrimaryGoal.toLowerCase()))
      const exerciseRole = inferExerciseRole(
        finalExercise.category,
        reason,
        selectionTrace.sessionRole,
        isPrimaryGoalMatch
      )
      
      // Build truth context for prescription resolution
      const prescriptionTruthContext: PrescriptionTruthContext = {
        experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced' | 'elite',
        exerciseRole,
        fatigueState: 'moderate', // Could be enriched from session context
        jointCautions: [], // Could be enriched from profile
        sessionArchitecture: sessionArchitectureContract ? {
          sessionIntent: sessionArchitectureContract.sessionIntent,
          sessionComplexity: sessionArchitectureContract.sessionComplexity,
          dayRole: sessionArchitectureContract.dayRoleEnforcement.dayRole,
        } : undefined,
        currentProgressionContext: currentWorkingProgressions?.[matchedSkillForExecution || primaryGoal] ? {
          currentProgression: currentWorkingProgressions[matchedSkillForExecution || primaryGoal].currentWorkingProgression,
          historicalCeiling: currentWorkingProgressions[matchedSkillForExecution || primaryGoal].historicalCeiling,
          isAtPlateau: false, // Could be enriched from performance data
        } : undefined,
      }
      
      // Resolve canonical prescription
      const canonicalPrescription = resolveCanonicalPrescription(prescriptionMode, prescriptionTruthContext)
      const formattedPrescription = formatPrescription(canonicalPrescription)
      
      canonicalSets = finalSets ?? formattedPrescription.sets
      canonicalRepsOrTime = finalRepsOrTime ?? formattedPrescription.repsOrTime
      
      // Use prescription note if no custom note exists
      if (!canonicalNote && formattedPrescription.note) {
        canonicalNote = formattedPrescription.note
      }
      
      // Log prescription intelligence decision
      console.log('[PRESCRIPTION-INTELLIGENCE-RESOLUTION]', {
        exerciseId: finalExercise.id,
        prescriptionMode,
        exerciseRole,
        truthContext: {
          level: experienceLevel,
          sessionComplexity: prescriptionTruthContext.sessionArchitecture?.sessionComplexity,
          hasProgressionContext: !!prescriptionTruthContext.currentProgressionContext,
        },
        resolved: {
          sets: canonicalSets,
          repsOrTime: canonicalRepsOrTime,
          note: canonicalNote,
        },
        verdict: 'PRESCRIPTION_FROM_CANONICAL_TRUTH',
      })
    }
    
    // ==========================================================================
    // [DOCTRINE-MATERIALIZATION-ENGINE] Full doctrine-driven dosage transformation
    // This is where doctrine ACTUALLY and VISIBLY influences prescriptions
    // ==========================================================================
    let doctrineFinalSets = canonicalSets ?? finalExercise.defaultSets ?? 3
    let doctrineFinalRepsOrTime = canonicalRepsOrTime ?? finalExercise.defaultRepsOrTime ?? '8-12'
    let doctrineFinalNote = canonicalNote ?? finalExercise.notes ?? ''
    
    // [SELECTOR_CONTEXT_DECLOSURE_V1] Uses ownedCtx explicit parameter
    if (ownedCtx.doctrine.active) {
      const originalSets = typeof doctrineFinalSets === 'number' ? doctrineFinalSets : 3
      const originalRepsOrTime = doctrineFinalRepsOrTime
      
      // ========================================================================
      // STEP 1: Apply INTENSITY BIAS to sets
      // ========================================================================
      if (typeof doctrineFinalSets === 'number') {
        if (ownedCtx.doctrine.intensityBias === 'conservative') {
          doctrineFinalSets = Math.max(2, Math.floor(doctrineFinalSets * 0.8))
        } else if (ownedCtx.doctrine.intensityBias === 'aggressive') {
          doctrineFinalSets = Math.min(6, Math.ceil(doctrineFinalSets * 1.25))
        }
      }
      
      // ========================================================================
      // STEP 2: Apply VOLUME BIAS to sets (compounds with intensity)
      // ========================================================================
      if (typeof doctrineFinalSets === 'number') {
        if (ownedCtx.doctrine.volumeBias === 'low') {
          doctrineFinalSets = Math.max(2, doctrineFinalSets - 1)
        } else if (ownedCtx.doctrine.volumeBias === 'high') {
          doctrineFinalSets = Math.min(6, doctrineFinalSets + 1)
        }
      }
      
      // ========================================================================
      // STEP 3: Apply SKILL QUALITY emphasis to reps/time
      // When skillQualityOverQuantity is true, reduce volume for quality focus
      // ========================================================================
      if (ownedCtx.doctrine.skillQualityOverQuantity) {
        const isSkillExercise = finalExercise.category === 'skill' || 
          safeLower(reason).includes('skill') ||
          safeLower(finalExercise.id || '').includes('progression')
        
        if (isSkillExercise) {
          // Reduce reps/holds for quality emphasis
          doctrineFinalRepsOrTime = transformRepsForQuality(doctrineFinalRepsOrTime)
          if (!doctrineFinalNote.includes('quality')) {
            doctrineFinalNote = doctrineFinalNote 
              ? `${doctrineFinalNote} | Quality focus: fewer reps, higher precision`
              : 'Quality focus: fewer reps, higher precision'
          }
        }
      }
      
      // ========================================================================
      // STEP 4: Apply HOLD TIME EMPHASIS for static skill spines
      // Transform rep-based prescriptions to hold-based for isometric work
      // ========================================================================
      if (ownedCtx.doctrine.holdTimeEmphasis && ownedCtx.doctrine.dominantSpine === 'static_skill_mastery') {
        const isStaticExercise = finalExercise.isIsometric || 
          safeLower(finalExercise.name || '').includes('hold') ||
          safeLower(finalExercise.name || '').includes('lever') ||
          safeLower(finalExercise.name || '').includes('planche') ||
          finalExercise.category === 'hold' ||
          finalExercise.category === 'skill'
        
        if (isStaticExercise) {
          doctrineFinalRepsOrTime = transformToHoldEmphasis(doctrineFinalRepsOrTime, ownedCtx.doctrine.intensityBias)
        }
      }
      
      // ========================================================================
      // STEP 5: Apply RECOVERY CONSTRAINED dosage
      // Conservative dosage when recovery is limited
      // ========================================================================
      if (ownedCtx.doctrine.recoveryConstrainedDosage) {
        if (typeof doctrineFinalSets === 'number') {
          doctrineFinalSets = Math.max(2, doctrineFinalSets - 1)
        }
        doctrineFinalRepsOrTime = transformRepsForRecovery(doctrineFinalRepsOrTime)
        if (!doctrineFinalNote.includes('recovery')) {
          doctrineFinalNote = doctrineFinalNote
            ? `${doctrineFinalNote} | Recovery-managed volume`
            : 'Recovery-managed volume'
        }
      }
      
      // ========================================================================
      // STEP 6: Apply SPINE-SPECIFIC dosage transformations
      // Different spines get fundamentally different prescription patterns
      // ========================================================================
      const spineTransform = applySpineDosageTransform(
        ownedCtx.doctrine.dominantSpine,
        doctrineFinalRepsOrTime,
        finalExercise,
        ownedCtx.doctrine.intensityBias
      )
      if (spineTransform.modified) {
        doctrineFinalRepsOrTime = spineTransform.repsOrTime
        if (spineTransform.noteAddition && !doctrineFinalNote.includes(spineTransform.noteAddition)) {
          doctrineFinalNote = doctrineFinalNote
            ? `${doctrineFinalNote} | ${spineTransform.noteAddition}`
            : spineTransform.noteAddition
        }
      }
      
      // Log if anything actually changed
      const setsChanged = originalSets !== doctrineFinalSets
      const repsChanged = originalRepsOrTime !== doctrineFinalRepsOrTime
      if (setsChanged || repsChanged) {
        console.log('[DOCTRINE-MATERIALIZATION-APPLIED]', {
          exerciseId: finalExercise.id,
          exerciseName: finalExercise.name,
          dominantSpine: ownedCtx.doctrine.dominantSpine,
          intensityBias: ownedCtx.doctrine.intensityBias,
          volumeBias: ownedCtx.doctrine.volumeBias,
          skillQuality: ownedCtx.doctrine.skillQualityOverQuantity,
          holdEmphasis: ownedCtx.doctrine.holdTimeEmphasis,
          recoveryConstrained: ownedCtx.doctrine.recoveryConstrainedDosage,
          original: { sets: originalSets, repsOrTime: originalRepsOrTime },
          final: { sets: doctrineFinalSets, repsOrTime: doctrineFinalRepsOrTime },
          verdict: 'DOCTRINE_MATERIALLY_TRANSFORMED_DOSAGE',
        })
      }
    }
    
    selected.push({
      exercise: finalExercise,
      sets: doctrineFinalSets,
      repsOrTime: doctrineFinalRepsOrTime,
      note: wasSubstituted 
        ? `Substituted from ${exercise.name} - ${gateResult.recommendedSubstitute?.reason || 'Prerequisites not met'}`
        : doctrineFinalNote || finalExercise.notes,
      isOverrideable: finalExercise.category !== 'skill', // Skills are harder to replace
      selectionReason: wasSubstituted 
        ? `${reason} (safe progression substitute)`
        : reason,
      gateCheckResult: isGatedExercise(exercise.id) ? gateResult : undefined,
      knowledgeBubble: knowledgeBubble || undefined,
      wasSubstituted,
      originalExerciseId: originalId,
      loadMetadata,
      deliveryStyle,
    // WEIGHTED LOAD PR: Include prescribed load if available
    prescribedLoad,
    // [weighted-truth] TASK F: Include no-load reason for transparency
    noLoadReason,
    // [exercise-trace] TASK 2: Attach the trace
    selectionTrace,
    // [PHASE-1B-CONTEXT-WIRE] Populate the session-assembly classifier context.
    // This is the wire the 13 downstream `selectionContext?.sessionRole` /
    // `selectionContext?.influencingSkills` / `selectionContext?.primarySelectionReason`
    // reads have been starving on. By projecting traceContext here (same source
    // of truth as selectionTrace) every upstream addExercise call site
    // automatically gets correct classification data — no per-site edits needed.
    // When traceContext is undefined we still derive a usable fallback from
    // the selectionTrace we just built, so legacy addExercise invocations that
    // don't pass traceContext also benefit.
    selectionContext: {
      primarySelectionReason: traceContext?.primarySelectionReason ?? selectionTrace.primarySelectionReason,
      sessionRole: traceContext?.sessionRole ?? selectionTrace.sessionRole,
      expressionMode: traceContext?.expressionMode ?? selectionTrace.expressionMode,
      influencingSkills: (traceContext?.influencingSkills ?? selectionTrace.influencingSkills).map(s => ({
        skillId: s.skillId,
        influence: s.influence,
        expressionMode: s.expressionMode,
      })),
      doctrineSource: traceContext?.doctrineSource ?? selectionTrace.doctrineSource ?? null,
    },
    // [LIVE-EXECUTION-TRUTH] Attach execution truth for live workout runner
    executionTruth,
    })
    return true
  }
  
  // =========================================================================
  // [exercise-trace] HELPER FUNCTIONS FOR TRACE INFERENCE
  // =========================================================================
  
  /** Infer selection reason from reason string */
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  // [HOISTING_FIX] Converted to arrow function for consistency
  const inferSelectionReason = (reason: string, exercise: Exercise, goal: string): ExerciseSelectionReason => {
    const r = safeLower(reason)
    if (r.includes('primary') && r.includes('skill')) return 'primary_skill_direct'
    if (r.includes('secondary') && r.includes('skill')) return 'secondary_skill_direct'
    if (r.includes('technical')) return 'primary_skill_technical'
    if (r.includes('support') && r.includes('skill')) return 'selected_skill_support'
    if (r.includes('limiter') || r.includes('weak point')) return 'limiter_correction'
    if (r.includes('core') || r.includes('trunk') || r.includes('compression')) return 'trunk_core_support'
    if (r.includes('mobility') || r.includes('flexibility')) return 'mobility_enabling'
    if (r.includes('rotation') || r.includes('recovery')) return 'recovery_rotation'
    if (r.includes('strength') || r.includes('foundation')) return 'strength_foundation'
    if (r.includes('doctrine')) return 'doctrine_recommended'
    if (r.includes('equipment') || r.includes('fallback')) return 'equipment_fallback'
    if (r.includes('prerequisite')) return 'prerequisite_building'
    return 'session_role_fill'
  }
  
  /** Infer session role from load metadata role */
  // [HOISTING_FIX] Converted to arrow function for consistency
  const inferSessionRole = (loadRole: string | undefined): TraceSessionRole => {
    if (!loadRole) return 'accessory'
    if (loadRole === 'skill_primary') return 'skill_primary'
    if (loadRole === 'skill_secondary') return 'skill_secondary'
    if (loadRole === 'strength_primary') return 'strength_primary'
    if (loadRole === 'strength_support') return 'strength_support'
    if (loadRole === 'core') return 'core'
    if (loadRole === 'accessory') return 'accessory'
    return 'accessory'
  }
  
  // ==========================================================================
  // [selection-compression-fix] ISSUE A/B: SKILL-WEIGHTED RANKING SYSTEM
  // ==========================================================================
  // This reduces primary goal compression by creating scoring that respects
  // selected skills, session roles, and weighted-capable movement preferences.
  
  /**
   * Score an exercise based on skill alignment, session role, and weighted capability.
   * [selection-compression-fix] TASK 3: Rebalanced ranking weights.
   * [HOISTING_FIX] Converted to arrow function for consistency.
   */
  const scoreExerciseForSession = (
    exercise: Exercise,
    sessionSkills: SessionSkillAllocation[],
    dayFocus: string,
    hasWeightedEquipment: boolean
  ): number => {
    let score = 0
    
    // Base score: general quality
    score += exercise.fatigueCost ? (5 - exercise.fatigueCost) * 2 : 5
    
  // [selection-compression-fix] ISSUE B: Selected skill alignment (increased boost for non-primary)
  // STEP 3: Reduce primary goal compression by increasing secondary/technical weights
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  for (const skillAlloc of sessionSkills) {
  const skillLower = safeSkillKey(skillAlloc)
  if (!skillLower) continue // Skip malformed skill allocations
  const transfersToSkill = exerciseTransfersToSkill(exercise, skillLower)
  const exerciseNameMatch = exerciseMatchesSkillByName(exercise, skillLower)
  
  if (transfersToSkill || exerciseNameMatch) {
  // Direct skill transfer gets biggest boost
  if (skillAlloc.expressionMode === 'primary') {
  score += 30 // Primary skill gets major boost (increased from 25)
  } else if (skillAlloc.expressionMode === 'technical') {
  score += 24 // Technical gets strong boost (increased from 18 to reduce compression)
  } else if (skillAlloc.expressionMode === 'support') {
  score += 18 // Support gets solid boost (increased from 12)
  } else if (skillAlloc.expressionMode === 'warmup') {
  score += 8 // Warmup gets small boost
  }
  
  // [selected-skill-exposure] Track which skill influenced this exercise
  console.log('[selected-skill-exposure] Skill influence on exercise:', {
    exerciseId: exercise.id,
    skillId: skillAlloc.skill,
    expressionMode: skillAlloc.expressionMode,
    transferMatch: transfersToSkill,
    nameMatch: exerciseNameMatch,
    scoreBoost: skillAlloc.expressionMode === 'primary' ? 30 : 
                skillAlloc.expressionMode === 'technical' ? 24 : 
                skillAlloc.expressionMode === 'support' ? 18 : 8,
  })
  }
  }
    
  // [selection-compression-fix] ISSUE C: Session role differentiation (STEP 4 - strengthened)
  const isStrengthFocus = dayFocus.includes('strength') || dayFocus.includes('support_heavy')
  const isSkillFocus = dayFocus.includes('skill')
  const isTechnicalFocus = dayFocus.includes('technical') || dayFocus.includes('density')
  const isMixedFocus = dayFocus.includes('mixed')
  const isRecoveryFocus = dayFocus.includes('recovery') || dayFocus.includes('light')
  
  // STEP 4: Make session roles actually change exercise composition
  if (isStrengthFocus) {
  if (exercise.category === 'strength') {
    score += 20 // Strength exercises strongly favored on strength days (increased from 15)
  }
  // Penalize skill work on strength-focused days
  if (exercise.category === 'skill' && exercise.fatigueCost && exercise.fatigueCost >= 4) {
    score -= 10
  }
  } else if (isSkillFocus) {
  if (exercise.category === 'skill') {
    score += 20 // Skill exercises strongly favored (increased from 15)
  }
  // Penalize heavy strength work on skill days
  if (exercise.category === 'strength' && exercise.fatigueCost && exercise.fatigueCost >= 4) {
    score -= 8
  }
  } else if (isTechnicalFocus) {
  // Technical days: favor lower fatigue, higher rep work
  if (exercise.fatigueCost && exercise.fatigueCost <= 2) {
    score += 15
  }
  if (exercise.category === 'skill') {
    score += 10
  }
  } else if (isRecoveryFocus) {
  // Recovery: strongly favor low fatigue
  if (exercise.fatigueCost && exercise.fatigueCost <= 2) {
    score += 18
  } else if (exercise.fatigueCost && exercise.fatigueCost >= 4) {
    score -= 15 // Strong penalty for high fatigue on recovery days
  }
  } else if (isMixedFocus) {
  // [session-assembly-truth] TASK 6: Mixed days favor moderate fatigue AND broader skill expression
  // This is key to making hybrid profiles feel represented
  if (exercise.fatigueCost && exercise.fatigueCost <= 3) {
    score += 12 // Slightly increased from 10
  }
  
  // [session-assembly-truth] TASK 6: Boost exercises that support ANY selected skill (not just primary)
  // This reduces the ranking bias that crushes tertiary skills on mixed days
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  const supportsMixedDayVariety = sessionSkills.some(s => {
    const skillLower = safeSkillKey(s)
    if (!skillLower) return false // Skip malformed skill allocations
    const transfersToSkill = exerciseTransfersToSkill(exercise, skillLower)
    const nameMatchesSkill = exerciseMatchesSkillByName(exercise, skillLower)
    return transfersToSkill || nameMatchesSkill
  })
  
  if (supportsMixedDayVariety) {
    // Boost for exercises that support ANY selected skill on mixed days
    // This helps tertiary skills get represented
    score += 8
    console.log('[session-assembly-truth] Mixed day variety boost:', {
      exerciseId: exercise.id,
      boost: 8,
      reason: 'supports_selected_skill_on_mixed_day',
    })
  }
  }
  
  // [exercise-expression] Log session role influence
  console.log('[exercise-expression] Session role scoring:', {
  exerciseId: exercise.id,
  dayFocus,
  category: exercise.category,
  fatigueCost: exercise.fatigueCost,
  roleType: isStrengthFocus ? 'strength' : isSkillFocus ? 'skill' : isTechnicalFocus ? 'technical' : isRecoveryFocus ? 'recovery' : 'mixed',
  })
    
  // [selection-compression-fix] ISSUE D/E: Weighted-capable boost when equipment supports it
  // STEP 5: Fix weighted-capable movement win conditions
  const isWeightedCapable = exercise.id.includes('weighted_') ||
  exercise.id === 'pull_up' ||
  exercise.id === 'dip' ||
  exercise.id === 'push_up' ||
  exercise.id.includes('row') ||
  exercise.id.includes('chin_up')
  
  // Weighted exercises get boost on strength AND mixed days when equipment supports
  if (hasWeightedEquipment && isWeightedCapable) {
  if (isStrengthFocus) {
    score += 18 // Strong boost for weighted on strength days (increased from 12)
    console.log('[weighted-win-logic] Weighted exercise scored high on strength day:', {
    exerciseId: exercise.id,
    boost: 18,
    reason: 'strength_day_weighted_priority',
    })
  } else if (isMixedFocus) {
    score += 10 // Moderate boost on mixed days
    console.log('[weighted-win-logic] Weighted exercise scored moderate on mixed day:', {
    exerciseId: exercise.id,
    boost: 10,
    reason: 'mixed_day_weighted_support',
    })
  }
  }
  
  // [selection-competition] STEP 8: Track score for rejected alternative analysis
  console.log('[selection-competition] Final exercise score:', {
  exerciseId: exercise.id,
  finalScore: score,
  hasWeightedEquipment,
  isWeightedCapable,
  dayFocus,
  })
  
  return score
  }

/**
 * [PHASE-MATERIALITY] TASK 4: Enhanced exercise scoring with progression truth
 * This applies additional scoring adjustments based on:
 * 1. Current working progression compatibility
 * 2. Material skill role fit (primary/secondary/support/deferred)
 * 3. Doctrine influence when available
 */
function applyMaterialityScoreAdjustments(
  exercise: Exercise,
  baseScore: number,
  // [SESSION-TRUTH-MATERIALIZATION] Added 'tertiary' role for broader skill expression
  materialSkillIntent: Array<{
  skill: string
  role: 'primary_spine' | 'secondary_anchor' | 'tertiary' | 'support' | 'deferred'
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  }> | undefined,
  currentWorkingProgressions: Record<string, {
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  truthSource: string
  isConservative: boolean
  }> | null | undefined,
  primaryGoal: string
): { adjustedScore: number; adjustmentReason: string | null } {
  let adjustedScore = baseScore
  let adjustmentReason: string | null = null
  
  if (!materialSkillIntent || materialSkillIntent.length === 0) {
  return { adjustedScore, adjustmentReason }
  }
  
  // Check if exercise aligns with material skill intent
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  const exerciseSkillMatch = materialSkillIntent.find(intent => {
  const skillLower = safeLower(intent.skill).replace(/_/g, '')
  if (!skillLower) return false // Skip malformed intent
  const exerciseIdLower = safeExerciseId(exercise)
  const exerciseNameLower = safeExerciseName(exercise)
  return exerciseIdLower.includes(skillLower) || 
       exerciseNameLower.includes(skillLower) ||
       exerciseTransfersToSkill(exercise, skillLower)
  })
  
  if (exerciseSkillMatch) {
  // Apply role-based scoring
  // [SESSION-TRUTH-MATERIALIZATION] Added tertiary case with meaningful boost
  switch (exerciseSkillMatch.role) {
    case 'primary_spine':
    adjustedScore += 15 // Strong boost for primary spine exercises
    adjustmentReason = 'primary_spine_alignment'
    break
    case 'secondary_anchor':
    adjustedScore += 10 // Solid boost for secondary anchor
    adjustmentReason = 'secondary_anchor_alignment'
    break
    case 'tertiary':
    // [SESSION-TRUTH-MATERIALIZATION] Tertiary skills get meaningful boost
    // This ensures broader selected skills actually influence exercise selection
    adjustedScore += 8 // Good boost for tertiary - between secondary and support
    adjustmentReason = 'tertiary_skill_alignment'
    break
    case 'support':
    adjustedScore += 5 // Modest boost for support skills
    adjustmentReason = 'support_skill_alignment'
    break
    case 'deferred':
    adjustedScore -= 5 // Slight penalty for deferred skills (don't clutter session)
    adjustmentReason = 'deferred_skill_deprioritized'
    break
  }
  
  // [PHASE-MATERIALITY] TASK 3: Progression compatibility check
  // If we have current working progression, prefer exercises that match that level
  if (exerciseSkillMatch.currentWorkingProgression && currentWorkingProgressions) {
    const progressionKey = exerciseSkillMatch.skill.replace(/_/g, '')
    const progressionData = currentWorkingProgressions[progressionKey] || 
                          currentWorkingProgressions[exerciseSkillMatch.skill]
    
    if (progressionData && progressionData.isConservative) {
    // User is working conservatively - slightly favor lower progression variants
    const exerciseDifficulty = exercise.difficulty
    if (exerciseDifficulty === 'beginner' || exerciseDifficulty === 'intermediate') {
      adjustedScore += 3
      adjustmentReason = (adjustmentReason || '') + '+conservative_progression_fit'
    } else if (exerciseDifficulty === 'advanced') {
      adjustedScore -= 2 // Slight penalty for advanced when being conservative
      adjustmentReason = (adjustmentReason || '') + '+conservative_downgrades_advanced'
    }
    
    console.log('[phase-materiality-exercise-ranking]', {
      exerciseId: exercise.id,
      skill: exerciseSkillMatch.skill,
      role: exerciseSkillMatch.role,
      currentProgression: progressionData.currentWorkingProgression,
      historicalCeiling: progressionData.historicalCeiling,
      isConservative: progressionData.isConservative,
      exerciseDifficulty,
      scoreAdjustment: adjustedScore - baseScore,
    })
    }
  }
  }
  
  return { adjustedScore, adjustmentReason }
  }
  
  /**
  * Get exercises that support a specific skill via doctrine mappings.
  * [selection-compression-fix] ISSUE F: Prefer doctrine-backed support.
  * [HOISTING_FIX] Converted to arrow function for consistency.
   */
  const getDoctrineBackedExercisesForSkill = (
    skill: string,
    availableExercises: Exercise[]
  ): { exercise: Exercise; doctrineSource: string }[] => {
    const mapping = getSupportMapping(skill as SkillCarryover)
    if (!mapping) return []
    
    const results: { exercise: Exercise; doctrineSource: string }[] = []
    
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  for (const exId of mapping.directSupportExercises) {
    if (!exId) continue // Skip undefined exercise IDs
    const found = availableExercises.find(e => safeExerciseId(e) === safeLower(exId))
    if (found) {
    results.push({ exercise: found, doctrineSource: `skill-support-mapping:${skill}:direct` })
      }
    }
    
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  for (const exId of mapping.accessorySupportExercises) {
    if (!exId) continue // Skip undefined exercise IDs
    const found = availableExercises.find(e => safeExerciseId(e) === safeLower(exId))
    if (found) {
    results.push({ exercise: found, doctrineSource: `skill-support-mapping:${skill}:accessory` })
      }
    }
    
    return results
  }
  
  // ==========================================================================
  // [PHASE 4] DOCTRINE DB EXERCISE SCORING INTEGRATION
  // ==========================================================================
  // This layer applies doctrine DB rules to re-rank already-valid candidates.
  // It cannot resurrect excluded exercises or bypass safety gates.
  // Uses pre-cached rules for synchronous scoring during selection.
  // ==========================================================================
  
  // [PHASE 4 HOTFIX] DEFENSIVE NORMALIZATION - prevent undefined reference errors
  const normalizedJointCautions: string[] = Array.isArray(jointCautions) ? jointCautions : []
  const normalizedEquipment: EquipmentType[] = Array.isArray(equipment) ? equipment : []
  const normalizedSelectedSkills: string[] = Array.isArray(selectedSkills) ? selectedSkills : [primaryGoal]
  
  // Lightweight runtime guardrail log
  console.log('[PHASE4-SELECTION-GUARDRAIL]', {
    focus: day.focus,
    primaryGoal,
    jointCautionsCount: normalizedJointCautions.length,
    selectedSkillsCount: normalizedSelectedSkills.length,
    doctrineRulesCached: !!getCachedDoctrineRules(),
  })
  
  // Track doctrine scoring audit for this session
  let sessionDoctrineAudit: DoctrineScoringAudit | null = null
  
  // Get cached doctrine rules (prefetched at start of generation)
  const cachedDoctrineRules = getCachedDoctrineRules()
  
  // Build doctrine context for this session
  // Note: secondaryGoal is derived from skillsForSession if available
  const secondarySkillFromSession = skillsForSession?.find(s => 
    s.expressionMode === 'technical' || s.expressionMode === 'support'
  )?.skill
  
  // [PHASE 4 HOTFIX] Use normalized values only - never raw possibly-undefined
  const doctrineContext: DoctrineScoreContext = {
    primaryGoal,
    secondaryGoal: secondarySkillFromSession || null,
    selectedSkills: normalizedSelectedSkills,
    experienceLevel,
    jointCautions: normalizedJointCautions,
    equipment: normalizedEquipment as string[],
    sessionFocus: day.focus,
    hasWeightedEquipment: hasLoadableEquipment(normalizedEquipment),
  }
  
  /**
   * Apply doctrine scoring synchronously to candidate pool.
   * Returns re-sorted candidates with doctrine adjustments.
   * [PHASE 4] Bounded doctrine integration - scoring layer only.
   * [PHASE 4 HOTFIX] Fully guarded with try/catch - doctrine CANNOT crash generation.
   * [HOISTING_FIX] Converted to arrow function to prevent hoisting issues with doctrineContext.
   */
  const applyDoctrineToPool = <T extends { exercise: Exercise; score: number }>(
    candidates: T[],
    sessionFocus: string
  ): T[] => {
    // Always have a fallback sorted list
    const baseSorted = [...candidates].sort((a, b) => b.score - a.score)
    
    if (!cachedDoctrineRules) {
      // No cached rules, return base sorted
      return baseSorted
    }
    
    // [PHASE 4 HOTFIX] Wrap doctrine scoring in try/catch - never crash generation
    try {
      // Update context for this specific pool
      const poolContext: DoctrineScoreContext = {
        ...doctrineContext,
        sessionFocus,
      }
      
      // Apply doctrine scoring synchronously
      const { sorted, audit } = applyDoctrineScoringSyncAndSort(
        candidates,
        poolContext,
        cachedDoctrineRules
      )
      
      // Accumulate audit results
      if (audit.doctrineApplied && !sessionDoctrineAudit) {
        sessionDoctrineAudit = audit
      } else if (audit.doctrineApplied && sessionDoctrineAudit) {
        // Merge audit results
        sessionDoctrineAudit.candidatesAffected += audit.candidatesAffected
        sessionDoctrineAudit.rulesMatched.selectionRules += audit.rulesMatched.selectionRules
        sessionDoctrineAudit.rulesMatched.contraindicationRules += audit.rulesMatched.contraindicationRules
        sessionDoctrineAudit.rulesMatched.carryoverRules += audit.rulesMatched.carryoverRules
        if (audit.topCandidateChanged) sessionDoctrineAudit.topCandidateChanged = true
        if (audit.top3Changed) sessionDoctrineAudit.top3Changed = true
      }
      // [PHASE 4E — DOCTRINE CAUSAL AUDIT CAPTURE]
      // Mirror the local merged audit into the module-level capture so
      // selectExercisesForSession can read it after this helper returns.
      // Capture even when doctrineApplied is false so we surface honest
      // "ran but no rule matched" verdicts (vs. "ran and changed winner").
      // The capture function is idempotent and overwrites with the latest
      // merged state, so calling it on every pool is safe and correct.
      captureSessionDoctrineAudit(sessionDoctrineAudit ?? audit)
      
      // Log if doctrine made a material change
      if (audit.doctrineApplied && (audit.topCandidateChanged || audit.top3Changed)) {
        console.log('[PHASE4-DOCTRINE-LIVE-INTEGRATION]', {
          sessionFocus,
          primaryGoal,
          candidatesAffected: audit.candidatesAffected,
          topCandidateChanged: audit.topCandidateChanged,
          preDoctrineWinner: audit.preDoctrineTop3[0],
          postDoctrineWinner: audit.postDoctrineTop3[0],
          verdict: 'DOCTRINE_EXERCISE_SCORING_LIVE',
        })
      }
      
      return sorted
    } catch (error) {
      // [PHASE 4 HOTFIX] Doctrine scoring failed - gracefully fall back to base ranking
      console.log('[PHASE4-DOCTRINE-FALLBACK]', {
        doctrineApplied: false,
        fallbackReason: 'phase4_scoring_error',
        errorMessage: String(error),
        sessionFocus,
        primaryGoal,
      })
      return baseSorted
    }
  }
  
  // [weighted-truth] TASK A: Use canonical loadable equipment check
  const hasWeightedEquipment = hasLoadableEquipment(equipment)
  
  // [planner-truth-input] STEP 2: Log the EXACT profile truth reaching selection
  const skillsForSessionLabels = skillsForSession
    ? skillsForSession.map(function(s) { return s.skill + '(' + s.expressionMode + ':' + s.weight + ')'; })
    : undefined;
  console.log('[planner-truth-input] Exercise selection receiving:', {
    primaryGoal,
    dayFocus: day.focus,
    selectedSkillsCount: selectedSkills?.length || 0,
    selectedSkills: selectedSkills?.slice(0, 5) || [],
    skillsForSessionCount: skillsForSession?.length || 0,
    skillsForSession: skillsForSessionLabels,
    hasWeightedEquipment,
    hasBenchmarks: !!weightedBenchmarks,
    experienceLevel,
    equipmentCount: equipment?.length || 0,
    constraintType,
  });
  
  // [weighted-truth] TASK A: Log weighted readiness at session selection
  console.log('[weighted-truth] Session weighted readiness:', {
  dayFocus: day.focus,
  hasWeightedEquipment,
  hasBenchmarks: !!weightedBenchmarks,
  pullUpBenchmark: !!weightedBenchmarks?.weightedPullUp?.current,
  dipBenchmark: !!weightedBenchmarks?.weightedDip?.current,
  })
  
  // [selection-compression-fix] TASK 7: Log compression fix context
  const compressionSkillLabels = skillsForSession
    ? skillsForSession.map(function(s) { return s.skill + '(' + s.expressionMode + ')'; })
    : undefined;
  console.log('[selection-compression-fix] Session selection context:', {
    dayFocus: day.focus,
    skillsForSession: compressionSkillLabels,
    hasWeightedEquipment,
    selectedSkillsCount: selectedSkills?.length || 0,
    primaryGoal,
  });
  
  // ==========================================================================
  // [constraint-balance] TASK A/B: REBALANCED constraint-aware selection
  // Constraints should NOT suppress skill work - they should restructure it safely
  // ==========================================================================
  
  // Check if we can actually find viable direct skill exercises for this goal
  // [exercise-selection] TASK B: Expanded pool search - include strength exercises with transfer
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  const potentialDirectSkillPool = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
    .filter(e => exerciseTransfersToSkill(e, primaryGoal))
    .filter(e => hasRequiredEquipment(e, equipment || []))
  
  // [exercise-selection] TASK B: Also check strength exercises that transfer to goal
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  const potentialStrengthSupport = availableStrength
    .filter(e => exerciseTransfersToSkill(e, primaryGoal))
    .filter(e => hasRequiredEquipment(e, equipment || []))
  
  // [constraint-balance] TASK A: CHANGED BEHAVIOR
  // skill_density_deficit should NOT trigger downgrade - it means "increase frequency"
  // Only TRULY limiting constraints should cause downgrade (e.g., injury, recovery)
  const isTrulyLimitingConstraint = constraintType && (
    constraintType.includes('recovery') ||
    constraintType.includes('fatigue') ||
    constraintType.includes('injury')
  )
  
  // [constraint-balance] TASK A: Only downgrade if BOTH:
  // 1. There's a true limiting constraint (not just low exposure)
  // 2. AND there are zero viable skill exercises
  const mustDowngradeToSupport = isTrulyLimitingConstraint && 
    potentialDirectSkillPool.length === 0 && 
    potentialStrengthSupport.length === 0
  
  // [exercise-selection] TASK B: Log exercise tier analysis
  console.log('[exercise-selection] Exercise pool analysis:', {
    primaryGoal,
    dayFocus: day.focus,
    constraintType: constraintType || 'none',
    tier1_directSkill: potentialDirectSkillPool.length,
    tier2_strengthSupport: potentialStrengthSupport.length,
    tier3_generalAvailable: availableStrength.length,
    isTrulyLimiting: isTrulyLimitingConstraint,
    mustDowngrade: mustDowngradeToSupport,
  })
  
  if (mustDowngradeToSupport) {
    console.log('[constraint-session-downgrade] Detected truly constrained session:', {
      constraintType,
      primaryGoal,
      dayFocus: day.focus,
      directSkillPoolSize: potentialDirectSkillPool.length,
      strengthSupportPoolSize: potentialStrengthSupport.length,
      reason: 'true_limiting_constraint_with_empty_pools',
    })
  }
  
  // ==========================================================================
  // [selection-influence-audit] TASK F: Log athlete data influence on selection
  // ==========================================================================
  console.log('[selection-influence-audit]', {
    dayNumber: day.dayNumber,
    dayFocus: day.focus,
    primaryGoal,
    // Input influence tracking
    hasSkillsForSession: !!(skillsForSession && skillsForSession.length > 0),
    skillsForSessionCount: skillsForSession?.length || 0,
    skillsToExpress: skillsForSession?.map(s => s.skill).slice(0, 3) || [],
    experienceLevel,
    // Pool analysis
    tier1_skillPoolSize: potentialDirectSkillPool.length,
    tier2_strengthSupportSize: potentialStrengthSupport.length,
    availableSkillsTotal: availableSkills.length,
    availableStrengthTotal: availableStrength.length,
    // Constraint influence
    hasConstraint: !!constraintType,
    constraintType: constraintType || 'none',
    mustDowngrade: mustDowngradeToSupport,
    // Equipment influence
    equipmentCount: equipment.length,
    hasWeightedEquipment,
  })
  
  // ==========================================================================
  // [EXERCISE-SELECTION-MATERIALITY] Build canonical materiality context
  // This context drives slot-aware exercise ranking with athlete-specific truth
  // ==========================================================================
  const secondaryGoalFromSession = skillsForSession?.find(s => 
    s.expressionMode === 'technical' || s.expressionMode === 'support'
  )?.skill || null
  
  // Determine training style from available equipment and selected skills
  const detectedTrainingStyle = hasWeightedEquipment 
    ? (equipment.length <= 3 ? 'hybrid' : 'weighted_integrated')
    : (equipment.length <= 2 ? 'minimalist' : 'pure_skill')
  
  // [PHASE15E-EXERCISE-SELECTION-FIX] Guard against undefined day.focus
  const safeDayFocusMain = day?.focus || 'mixed_upper'
  
  // Determine session complexity from day focus and constraint
  const sessionComplexityBudget: 'low' | 'medium' | 'high' = 
    mustDowngradeToSupport || safeDayFocusMain.includes('recovery') ? 'low' :
    safeDayFocusMain.includes('density') || safeDayFocusMain.includes('mixed') ? 'medium' : 'high'
  
  // Transform currentWorkingProgressions into format expected by materiality engine
  const materialityProgressions: Record<string, {
    currentWorkingProgression: string | null
    historicalCeiling: string | null
  }> | null = currentWorkingProgressions ? Object.fromEntries(
    Object.entries(currentWorkingProgressions).map(([key, val]) => [
      key,
      { currentWorkingProgression: val.currentWorkingProgression, historicalCeiling: val.historicalCeiling }
    ])
  ) : null
  
  // [TRUTH-TO-SELECTION-MATERIALITY] Extract doctrine preferences from cached rules
  // This ensures doctrine knowledge affects materiality scoring
  const doctrinePreferences = cachedDoctrineRules ? {
    preferredExercises: cachedDoctrineRules.preferredExercises?.map(e => e.exerciseId || e.id || e) || [],
    avoidExercises: cachedDoctrineRules.avoidExercises?.map(e => e.exerciseId || e.id || e) || [],
    carryoverRules: cachedDoctrineRules.carryoverRules?.map(r => ({
      sourceSkill: r.sourceSkill || r.source || '',
      targetSkill: r.targetSkill || r.target || '',
      carryoverType: (r.carryoverType || r.type || 'indirect') as 'direct' | 'indirect' | 'prerequisite',
      preferredExercises: r.preferredExercises || r.exercises || [],
    })) || [],
  } : undefined
  
  // Build the canonical materiality context
  const materialityContext = buildExerciseSelectionMaterialityContext(
    primaryGoal,
    secondaryGoalFromSession,
    selectedSkills || [primaryGoal],
    experienceLevel,
    equipment || [],
    normalizedJointCautions,
    materialityProgressions,
    4, // Assume 4 sessions/week as default - could be passed from context
    sessionComplexityBudget,
    detectedTrainingStyle as 'pure_skill' | 'hybrid' | 'weighted_integrated' | 'minimalist',
    undefined, // recentExerciseHistory - could be passed from context
    doctrinePreferences
  )
  
  console.log('[EXERCISE-SELECTION-MATERIALITY] Context built:', {
    primaryGoal: materialityContext.primaryGoal,
    secondaryGoal: materialityContext.secondaryGoal,
    trainingStyle: materialityContext.trainingStyle,
    sessionComplexityBudget: materialityContext.sessionComplexityBudget,
    hasWeightedEquipment: materialityContext.hasWeightedEquipment,
    jointCautionsCount: materialityContext.jointCautions.length,
    hasProgressionData: !!materialityContext.currentWorkingProgressions,
  })
  
  /**
   * [EXERCISE-SELECTION-MATERIALITY] Enhanced scoring with materiality engine
   * This function combines the existing session-based scoring with deep materiality analysis
   * to produce rankings that are visibly more personalized.
   * 
   * [SELECTOR_CONTEXT_DECLOSURE_V1] ownedCtx is EXPLICIT PARAMETER - no closure dependency
   */
  const scoreExerciseWithMateriality = (
    ownedCtx: SelectorRuntimeContext, // DECLOSURE: explicit parameter, not closure
    exercise: Exercise,
    sessionSkills: SessionSkillAllocation[],
    dayFocus: string,
    slotType: SlotType
  ): { score: number; materialityScore: ExerciseMaterialityScore | null; primaryReason: MaterialityReasonCode } => {
    // [SELECTOR_CONTEXT_DECLOSURE_V1] Validate explicit parameter ownership
    assertRuntimeContext(ownedCtx, 'scoreExerciseWithMateriality')
    
    // Get base session score
    const baseScore = scoreExerciseForSession(exercise, sessionSkills, dayFocus, hasWeightedEquipment)
    
    // Apply materiality scoring
    const materialityScore = scoreExerciseMateriality(exercise, materialityContext)
    
    // [TRUTH-TO-SELECTION-MATERIALITY] Slot-aware weighting ratios
    // Direct skill slots and support slots should be MORE heavily driven by materiality
    // because personalization matters most there. Accessory/finisher can use more generic logic.
    const slotMaterialityRatios: Record<SlotType, { base: number; materiality: number }> = {
      direct_skill: { base: 0.25, materiality: 0.75 },      // Strong materiality ownership
      main_strength: { base: 0.30, materiality: 0.70 },     // Strong materiality for support
      secondary_skill: { base: 0.30, materiality: 0.70 },   // Secondary still needs personalization
      support_carryover: { base: 0.25, materiality: 0.75 }, // Carryover must be truth-driven
      assistance: { base: 0.40, materiality: 0.60 },        // Accessories can be more generic
      prehab_joint_care: { base: 0.35, materiality: 0.65 }, // Joint care needs truth
      density_finisher: { base: 0.50, materiality: 0.50 },  // Finishers can be generic
    }
    
    const ratio = slotMaterialityRatios[slotType] || { base: 0.35, materiality: 0.65 }
    
    // [TRUTH-TO-SELECTION-MATERIALITY] Apply progression boost
    // If exercise has high currentProgressionFit score, give additional boost
    const progressionBoost = materialityScore.breakdown.currentProgressionFit >= 20 ? 15 : 
                             materialityScore.breakdown.currentProgressionFit >= 15 ? 8 : 0
    
    // [TRUTH-TO-SELECTION-MATERIALITY] Apply doctrine boost if present
    // Doctrine knowledge should decisively affect support/carryover selection
    const doctrineBoost = materialityScore.breakdown.doctrineBoost >= 10 ? 12 :
                          materialityScore.breakdown.doctrineBoost >= 5 ? 6 : 0
    
    // ==========================================================================
    // [DOCTRINE-DRIVEN-VARIANT-PREFERENCE] Boost exercises matching spine preference
    // This makes doctrine preferWeighted/preferStatic actually influence selection
    // [SELECTOR_CONTEXT_DECLOSURE_V1] Uses ownedCtx explicit parameter
    // ==========================================================================
    let doctrineVariantBoost = 0
    if (ownedCtx.doctrine.active) {
      const exNameLower = safeLower(exercise.name || '')
      const exIdLower = safeLower(exercise.id || '')
      const isWeightedExercise = exNameLower.includes('weighted') || exIdLower.includes('weighted')
      const isStaticExercise = exercise.isIsometric || 
        exNameLower.includes('hold') || 
        exNameLower.includes('isometric') ||
        exercise.category === 'hold' ||
        exercise.category === 'skill'
      
      if (ownedCtx.doctrine.preferWeighted && isWeightedExercise) {
        doctrineVariantBoost = 15 // Significant boost for weighted variants
      } else if (ownedCtx.doctrine.preferStatic && isStaticExercise) {
        doctrineVariantBoost = 15 // Significant boost for static variants
      }
    }
    
    // Combine with slot-specific ratio + truth boosts
    const combinedScore = Math.round(
      baseScore * ratio.base + 
      materialityScore.totalScore * ratio.materiality +
      progressionBoost +
      doctrineBoost +
      doctrineVariantBoost
    )
    
    return {
      score: combinedScore,
      materialityScore,
      primaryReason: materialityScore.primaryReasonCode,
    }
  }
  
  /**
   * [EXERCISE-SELECTION-MATERIALITY] Rank candidates using materiality engine
   * Returns candidates sorted by materiality-aware score with full audit trail.
   * [CORRIDOR_LOCK_V1] Receives ownedCtx as EXPLICIT PARAMETER - no closure dependency
   */
  const rankCandidatesWithMateriality = <T extends { exercise: Exercise; score: number }>(
    ownedCtx: SelectorRuntimeContext, // CORRIDOR_LOCK: explicit parameter
    candidates: T[],
    slotType: SlotType,
    sessionSkills: SessionSkillAllocation[]
  ): Array<T & { materialityScore: ExerciseMaterialityScore | null; primaryReason: MaterialityReasonCode }> => {
    // [CORRIDOR_LOCK_V1] Validate explicit parameter ownership
    assertRuntimeContext(ownedCtx, 'rankCandidatesWithMateriality')
    
    // Score each candidate with materiality
    // [CORRIDOR_LOCK_V1] Pass ownedCtx explicitly - no closure access
    const scored = candidates.map(c => {
      const { score, materialityScore, primaryReason } = scoreExerciseWithMateriality(
        ownedCtx, // CORRIDOR_LOCK: explicit parameter chain
        c.exercise,
        sessionSkills,
        day.focus,
        slotType
      )
      return { ...c, score, materialityScore, primaryReason }
    })
    
    // Sort by combined score
    scored.sort((a, b) => b.score - a.score)
    
    // [TRUTH-TO-SELECTION-MATERIALITY] Log materiality ranking audit with truth influence breakdown
    if (scored.length > 0 && scored[0].materialityScore) {
      const topCandidate = scored[0]
      const breakdown = topCandidate.materialityScore?.breakdown
      
      console.log('[TRUTH-TO-SELECTION-MATERIALITY-RANKING]', {
        slotType,
        totalCandidates: scored.length,
        top3: scored.slice(0, 3).map(c => ({
          id: c.exercise.id,
          combinedScore: c.score,
          materialityScore: c.materialityScore?.totalScore || 0,
          primaryReason: c.primaryReason,
        })),
        truthInfluence: {
          // Show which truth sources drove the ranking
          progressionInfluence: breakdown?.currentProgressionFit || 0,
          doctrineInfluence: breakdown?.doctrineBoost || 0,
          equipmentInfluence: breakdown?.equipmentOptimality || 0,
          jointSafetyInfluence: breakdown?.jointCautionSafety || 0,
          carryoverInfluence: breakdown?.carryoverValue || 0,
          additionalSkillsInfluence: breakdown?.additionalSkillsSupport || 0, // NEW: tertiary skills
          // Context that enabled this
          trainingStyle: materialityContext.trainingStyle,
          hasWeightedEquipment: materialityContext.hasWeightedEquipment,
          jointCautionsCount: materialityContext.jointCautions.length,
          hasProgressionData: !!materialityContext.currentWorkingProgressions,
          hasDoctrineData: !!(materialityContext.doctrinePreferredExercises?.length || materialityContext.doctrineCarryoverRules?.length),
          additionalSkillsCount: materialityContext.selectedSkills?.length || 0, // NEW
        },
        // [EXERCISE-SELECTION-TRUTH-DOMINANCE] Expanded verdict to include tertiary skills
        verdict: breakdown?.doctrineBoost >= 8 || breakdown?.currentProgressionFit >= 18 || breakdown?.additionalSkillsSupport >= 8
          ? 'TRUTH_DRIVEN_SELECTION' 
          : 'BASELINE_SELECTION',
      })
    }
    
    return scored
  }
  
  // ==========================================================================
  // Selection based on day focus
  // ==========================================================================
  
  // 1. SKILL DAYS - Lead with skill work (unless constrained)
  // [exercise-trace] TASK 2/5: Thread trace context through selection
  // [selection-compression-fix] ISSUE A/B: Now uses skillsForSession for ranking
  // TASK 1-D: If mustDowngradeToSupport, convert to support session path
  if ((day.focus === 'push_skill' || day.focus === 'pull_skill' || day.focus === 'skill_density') && !mustDowngradeToSupport) {
    // [PHASE15E-MICRO-CORRIDOR-AUDIT] Push skill day checkpoint
    if (isPushSession) {
      markCheckpoint('push_skill_day_entry')
      console.log('[PHASE15E-MICRO-CORRIDOR-AUDIT] Push skill day entry:', {
        marker: 'PUSH_SKILL_DAY_ENTRY',
        dayFocus: day.focus,
        hasSkillsForSession: !!(skillsForSession && skillsForSession.length > 0),
        skillsCount: skillsForSession?.length || 0,
      })
    }
    
    // [selection-compression-fix] ISSUE B: Find exercises for ALL skills in session allocation
    const sessionSkillsToExpress = skillsForSession && skillsForSession.length > 0
      ? skillsForSession
      : [{ skill: primaryGoal, expressionMode: 'primary' as const, weight: 1 }]
    
    // Primary skill exercise from session allocation
    const primarySkillAlloc = sessionSkillsToExpress.find(s => s.expressionMode === 'primary')
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Validate primary skill allocation has valid skill key
    if (primarySkillAlloc && safeSkillKey(primarySkillAlloc)) {
      // Find skill exercises that transfer to the allocated primary skill
      const skillCandidates = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
        .filter(e => exerciseTransfersToSkill(e, primarySkillAlloc.skill))
      
      // [PHASE 1 AI-TRUTH-ARCHITECTURE] TASK 4: Apply progression-based filtering FIRST
      // This ensures exercises above current working level are blocked before scoring
      const baseScoredCandidates = skillCandidates.map(e => ({
        exercise: e,
        score: scoreExerciseForSession(e, sessionSkillsToExpress, day.focus, hasWeightedEquipment)
      }))
      
      // Apply progression filter to remove exercises above current working level
      const { filtered: progressionFilteredCandidates, audit: progressionAudit } = 
        filterByCurrentProgression(baseScoredCandidates, primarySkillAlloc.skill)
      
      // [EXERCISE-SELECTION-MATERIALITY] Apply materiality-aware ranking
      // This replaces the basic doctrine-only scoring with full materiality analysis
      const materialityRankedCandidates = rankCandidatesWithMateriality(selectorCtx,
        progressionFilteredCandidates,
        'direct_skill',
        sessionSkillsToExpress
      )
      
      // Apply doctrine scoring on top (bounded modifier layer)
      // [PHASE 4] Doctrine integration - applies DB-backed scoring modifiers
      const scoredCandidates = applyDoctrineToPool(
        materialityRankedCandidates.map(c => ({ exercise: c.exercise, score: c.score })),
        day.focus
      )
      
      // Log progression enforcement for primary skill
      if (progressionAudit.blockedCount > 0) {
        console.log('[AI-TRUTH-ARCHITECTURE-PRIMARY-SKILL-PROGRESSION]', {
          skill: primarySkillAlloc.skill,
          currentWorkingProgression: getAuthoritativeProgression(primarySkillAlloc.skill),
          candidatesBeforeFilter: progressionAudit.before,
          candidatesAfterFilter: progressionAudit.after,
          blockedCount: progressionAudit.blockedCount,
          verdict: 'CURRENT_WORKING_PROGRESSION_ENFORCED',
        })
      }
      
      // Get the winning candidate with materiality metadata
      const winningCandidate = materialityRankedCandidates[0]
      const primarySkill = scoredCandidates[0]?.exercise || selectByLevel(goalExercises.filter(e => e.category === 'skill'), experienceLevel)
      
      // Log materiality selection reason
      if (winningCandidate?.materialityScore) {
        console.log('[EXERCISE-SELECTION-MATERIALITY-WINNER]', {
          slotType: 'direct_skill',
          selectedExercise: primarySkill?.id,
          materialityScore: winningCandidate.materialityScore.totalScore,
          primaryReason: winningCandidate.primaryReason,
          confidenceLevel: winningCandidate.materialityScore.confidenceLevel,
          keyFactors: winningCandidate.materialityScore.auditNotes.slice(0, 3),
        })
      }
      
      if (primarySkill) {
        addExercise(selectorCtx, primarySkill, `Primary ${primarySkillAlloc.skill} skill work`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'primary_skill_direct',
          sessionRole: 'skill_primary',
          expressionMode: 'direct_intensity',
          influencingSkills: [{ skillId: primarySkillAlloc.skill, influence: 'primary', expressionMode: 'direct' }],
          candidatePoolSize: skillCandidates.length,
          // [EXERCISE-SELECTION-MATERIALITY] Include materiality trace data
          materialityReasonCode: winningCandidate?.primaryReason,
          materialityConfidence: winningCandidate?.materialityScore?.confidenceLevel,
          materialityFactors: winningCandidate?.materialityScore?.auditNotes?.slice(0, 3),
        })
        
        // Track rejected alternatives
        scoredCandidates.slice(1, 4).forEach(c => {
          trackRejection(c.exercise.id, c.exercise.name, 'lower_score', `Score: ${c.score}`)
        })
      }
    }
    
    // [selection-compression-fix] ISSUE B: Technical/secondary skill expression
    const technicalSkillAlloc = sessionSkillsToExpress.find(s => s.expressionMode === 'technical')
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Validate technical skill allocation
    if (technicalSkillAlloc && safeSkillKey(technicalSkillAlloc) && technicalSkillAlloc.skill !== primarySkillAlloc?.skill) {
      // Find exercises for the technical skill (may be different from primary!)
      const techSkillCandidates = [...availableSkills, ...availableStrength]
        .filter(e => exerciseTransfersToSkill(e, technicalSkillAlloc.skill))
        .filter(e => !usedIds.has(e.id))
      
      // [PHASE 4] Doctrine integration for technical skill
      const baseScoredTech = techSkillCandidates.map(e => ({
        exercise: e,
        score: scoreExerciseForSession(e, sessionSkillsToExpress, day.focus, hasWeightedEquipment)
      }))

      // [PHASE 2 PROGRESSION-CAP UNIFICATION]
      // Apply the single authoritative progression cap to the secondary/
      // technical candidate pool. Prior to this change, the cap ran ONLY at
      // the primary skill site (line 4303), so a user with currentWorking=
      // "tuck_back_lever" could surface "straddle_back_lever" via the
      // technical/secondary path because nothing blocked it. Routing through
      // filterByCurrentProgression keeps a single owner (no parallel gate)
      // and the same PROGRESSION_LEVEL_ORDER ladder used for primary.
      const { filtered: techProgressionFiltered, audit: techProgressionAudit } =
        filterByCurrentProgression(baseScoredTech, technicalSkillAlloc.skill)

      if (techProgressionAudit.blockedCount > 0) {
        console.log('[PHASE2-PROGRESSION-CAP-UNIFY-SECONDARY]', {
          skill: technicalSkillAlloc.skill,
          currentWorkingProgression: getAuthoritativeProgression(technicalSkillAlloc.skill),
          candidatesBeforeFilter: techProgressionAudit.before,
          candidatesAfterFilter: techProgressionAudit.after,
          blockedCount: techProgressionAudit.blockedCount,
          verdict: 'CURRENT_WORKING_PROGRESSION_ENFORCED_ON_SECONDARY',
        })
      }

      // [EXERCISE-SELECTION-MATERIALITY] Apply materiality-aware ranking for secondary skill
      const materialityRankedTech = rankCandidatesWithMateriality(selectorCtx, techProgressionFiltered, 'secondary_skill', sessionSkillsToExpress)
      const scoredTech = applyDoctrineToPool(
        materialityRankedTech.map(c => ({ exercise: c.exercise, score: c.score })),
        day.focus
      )
      
      if (scoredTech[0]) {
        const techWinner = materialityRankedTech[0]
        addExercise(selectorCtx, scoredTech[0].exercise, `Technical work for ${technicalSkillAlloc.skill}`, undefined, undefined, 'Moderate intensity', 'standalone', {
          primarySelectionReason: 'secondary_skill_technical',
          sessionRole: 'skill_secondary',
          expressionMode: 'technical_focus',
          influencingSkills: [{ skillId: technicalSkillAlloc.skill, influence: 'secondary', expressionMode: 'technical' }],
          candidatePoolSize: techSkillCandidates.length,
          // [EXERCISE-SELECTION-MATERIALITY] Include materiality trace data
          materialityReasonCode: techWinner?.primaryReason,
          materialityConfidence: techWinner?.materialityScore?.confidenceLevel,
          materialityFactors: techWinner?.materialityScore?.auditNotes?.slice(0, 3),
        })
        console.log('[selected-skill-exposure] Technical skill expressed:', technicalSkillAlloc.skill)
        
        // Log materiality-driven selection
        if (techWinner?.materialityScore) {
          console.log('[EXERCISE-SELECTION-MATERIALITY-WINNER]', {
            slotType: 'secondary_skill',
            selectedExercise: scoredTech[0].exercise.id,
            materialityReason: techWinner.primaryReason,
            confidenceLevel: techWinner.materialityScore.confidenceLevel,
          })
        }
      }
    } else if (day.focus === 'skill_density') {
      // Fallback for density days - add secondary skill from same goal
      const skills = goalExercises.filter(e => e.category === 'skill' && !usedIds.has(e.id))
      if (skills.length > 0) {
        const secondarySkill = selectByLevel(skills, experienceLevel)
        if (secondarySkill) {
          addExercise(selectorCtx, secondarySkill, 'Additional skill density', undefined, undefined, 'Moderate intensity', 'standalone', {
            primarySelectionReason: 'primary_skill_technical',
            sessionRole: 'skill_secondary',
            expressionMode: 'technical_focus',
            influencingSkills: [{ skillId: primaryGoal, influence: 'secondary', expressionMode: 'technical' }],
            candidatePoolSize: skills.length,
          })
        }
      }
    }
    
    // [selection-compression-fix] ISSUE F: Doctrine-backed strength support
    // Prefer support that specifically helps the session's allocated skills
    const allSessionSkills = sessionSkillsToExpress.map(s => s.skill)
    let strengthPicked = false
    
    for (const skill of allSessionSkills) {
      if (strengthPicked) break
      const doctrineExercises = getDoctrineBackedExercisesForSkill(skill, availableStrength)
      for (const { exercise, doctrineSource } of doctrineExercises) {
        if (!usedIds.has(exercise.id) && canAddMore(exercise, 'standalone')) {
          addExercise(selectorCtx, exercise, `Doctrine-backed support for ${skill}`, undefined, undefined, undefined, 'standalone', {
            primarySelectionReason: 'doctrine_recommended',
            sessionRole: 'strength_support',
            expressionMode: 'strength_support',
            influencingSkills: [{ skillId: skill, influence: 'selected', expressionMode: 'support' }],
            doctrineSource: { doctrineSource, triggeringSkill: skill, doctrineType: 'support' },
            candidatePoolSize: doctrineExercises.length,
          })
          strengthPicked = true
          console.log('[selection-compression-fix] Doctrine-backed support won over generic:', exercise.id)
          break
        }
      }
    }
    
    // Fallback to generic goal-based strength if no doctrine match
    // [EXERCISE-SELECTION-MATERIALITY] Use materiality-aware selection for support
    // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized pool for transfer check
    if (!strengthPicked) {
      const primaryStrength = goalExercises.filter(e => e.category === 'strength')
      const strengthCandidates = [
        ...primaryStrength, 
        ...availableStrength.filter(e => {
          const norm = getNormalized(e)
          return norm ? normalizedTransfersTo(norm, primaryGoal) : false
        })
      ].filter(e => !usedIds.has(e.id))
      
      if (strengthCandidates.length > 0) {
        // Apply materiality ranking for support slot
        const baseScoredStrength = strengthCandidates.map(e => ({
          exercise: e,
          score: scoreExerciseForSession(e, sessionSkillsToExpress, day.focus, hasWeightedEquipment)
        }))
        const materialityRankedStrength = rankCandidatesWithMateriality(selectorCtx, baseScoredStrength, 'support_carryover', sessionSkillsToExpress)
        
        const strengthWinner = materialityRankedStrength[0]
        if (strengthWinner) {
          addExercise(selectorCtx, strengthWinner.exercise, `Supports ${primaryGoal} development`, undefined, undefined, undefined, 'standalone', {
            primarySelectionReason: 'selected_skill_support',
            sessionRole: 'strength_support',
            expressionMode: 'strength_support',
            influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
            candidatePoolSize: strengthCandidates.length,
            // [EXERCISE-SELECTION-MATERIALITY] Include materiality trace data
            materialityReasonCode: strengthWinner?.primaryReason,
            materialityConfidence: strengthWinner?.materialityScore?.confidenceLevel,
            materialityFactors: strengthWinner?.materialityScore?.auditNotes?.slice(0, 2),
          })
          
          // Log materiality selection
          if (strengthWinner.materialityScore) {
            console.log('[EXERCISE-SELECTION-MATERIALITY-WINNER]', {
              slotType: 'support_carryover',
              selectedExercise: strengthWinner.exercise.id,
              materialityReason: strengthWinner.primaryReason,
              keyFactors: strengthWinner.materialityScore.auditNotes.slice(0, 2),
            })
          }
        }
      }
    }
  }
  
  // 2. STRENGTH DAYS
  // [exercise-trace] TASK 2/3: Thread weighted decision trace
  // [selection-compression-fix] ISSUE D/E: Improved weighted movement win conditions
  if (day.focus === 'push_strength' || day.focus === 'pull_strength') {
    // [PHASE15E-MICRO-CORRIDOR-AUDIT] Push strength day checkpoint
    if (day.focus === 'push_strength') {
      markCheckpoint('push_strength_day_entry')
      console.log('[PHASE15E-MICRO-CORRIDOR-AUDIT] Push strength day entry:', {
        marker: 'PUSH_STRENGTH_DAY_ENTRY',
        dayFocus: day.focus,
        hasWeightedEquipment,
        hasWeightedBenchmarks: !!(weightedBenchmarks && weightedBenchmarks.weightedDip),
      })
    }
    const isPush = day.focus === 'push_strength'
    const isHeavyDay = day.targetIntensity === 'high'
    
    // [weighted-win-logic] ISSUE D: Check all conditions for weighted to win
    const hasBenchmarks = weightedBenchmarks && (isPush ? weightedBenchmarks.weightedDip : weightedBenchmarks.weightedPullUp)
    const hasLoadableEquipment = hasWeightedEquipment
    const sessionRoleSupportsWeighted = true // Strength days always support weighted
    const recoveryAllowsWeighted = day.targetIntensity !== 'low' // Not a recovery day
    
    // [weighted-win-logic] Calculate if weighted should win
    const weightedShouldWin = hasLoadableEquipment && (hasBenchmarks || hasLoadableEquipment) && 
                              sessionRoleSupportsWeighted && recoveryAllowsWeighted
    
    console.log('[weighted-win-logic] Strength day decision:', {
      isPush,
      isHeavyDay,
      hasBenchmarks: !!hasBenchmarks,
      hasLoadableEquipment,
      weightedShouldWin,
      targetIntensity: day.targetIntensity,
    })
    
    // Primary movement - prefer weighted when conditions met
    let primaryAdded = false
    
    if (weightedShouldWin) {
      // [weighted-win-logic] ISSUE E: Weighted wins - use weighted variant
      const primaryWeighted = isPush
        ? availableStrength.find(e => e.id === 'weighted_dip')
        : availableStrength.find(e => e.id === 'weighted_pull_up')
      
      if (primaryWeighted) {
        addExercise(
          selectorCtx,
          primaryWeighted,
          isHeavyDay ? 'Primary strength builder (heavy)' : 'Primary strength builder (volume)',
          isHeavyDay ? 4 : 3,
          isHeavyDay ? '3-5' : '6-8',
          undefined,
          'standalone',
          {
            primarySelectionReason: 'strength_foundation',
            sessionRole: 'strength_primary',
            expressionMode: isHeavyDay ? 'direct_intensity' : 'volume_accumulation',
            influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
            candidatePoolSize: availableStrength.length,
            weightedConsidered: true,
            weightedEligible: true,
            weightedBlockerReason: undefined,
          }
        )
        primaryAdded = true
        console.log('[weighted-win-logic] Weighted movement WON:', primaryWeighted.id)
      }
    }
    
    // Fallback to bodyweight if weighted didn't win
    if (!primaryAdded) {
      const bodyweightPrimary = isPush
        ? availableStrength.find(e => e.id === 'dip' || e.id === 'push_up')
        : availableStrength.find(e => e.id === 'pull_up')
      
      if (bodyweightPrimary) {
        const blockerReason: WeightedBlockerReason | undefined = !hasLoadableEquipment 
          ? 'no_loadable_equipment' 
          : !hasBenchmarks 
            ? 'no_benchmark_confidence'
            : !recoveryAllowsWeighted
              ? 'limiter_recovery_favored_unloaded'
              : undefined
        
        addExercise(
          selectorCtx,
          bodyweightPrimary,
          isHeavyDay ? 'Primary strength builder (bodyweight)' : 'Bodyweight strength volume',
          isHeavyDay ? 4 : 3,
          isHeavyDay ? '5-8' : '8-12',
          undefined,
          'standalone',
          {
            primarySelectionReason: 'strength_foundation',
            sessionRole: 'strength_primary',
            expressionMode: isHeavyDay ? 'direct_intensity' : 'volume_accumulation',
            influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
            candidatePoolSize: availableStrength.length,
            weightedConsidered: true,
            weightedEligible: !!hasBenchmarks,
            weightedBlockerReason: blockerReason,
          }
        )
        primaryAdded = true
        console.log('[weighted-win-logic] Bodyweight movement won, blocker:', blockerReason)
      }
    }
    
    // [selection-compression-fix] ISSUE B: Secondary strength for session skills
    const sessionSkillsToSupport = skillsForSession && skillsForSession.length > 0
      ? skillsForSession
      : [{ skill: primaryGoal, expressionMode: 'primary' as const, weight: 1 }]
    
    // Try to add doctrine-backed strength support for each skill
    for (const skillAlloc of sessionSkillsToSupport) {
      if (selected.length >= maxExercises - 2) break // Leave room for skill exposure
      
      const doctrineExercises = getDoctrineBackedExercisesForSkill(skillAlloc.skill, availableStrength)
      for (const { exercise, doctrineSource } of doctrineExercises) {
        if (!usedIds.has(exercise.id) && canAddMore(exercise, 'standalone')) {
          addExercise(selectorCtx, exercise, `Strength support for ${skillAlloc.skill}`, undefined, undefined, undefined, 'standalone', {
            primarySelectionReason: 'doctrine_recommended',
            sessionRole: 'strength_support',
            expressionMode: 'strength_support',
            influencingSkills: [{ skillId: skillAlloc.skill, influence: 'selected', expressionMode: 'support' }],
            doctrineSource: { doctrineSource, triggeringSkill: skillAlloc.skill, doctrineType: 'support' },
            candidatePoolSize: doctrineExercises.length,
          })
          console.log('[selected-skill-exposure] Strength support for selected skill:', skillAlloc.skill)
          break
        }
      }
    }
    
    // Fallback: Goal-specific strength if no doctrine match found
    const goalStrength = goalExercises.filter(e => 
      e.category === 'strength' && !usedIds.has(e.id)
    )
    if (goalStrength.length > 0 && selected.length < maxExercises - 1) {
      const strengthPick = selectByLevel(goalStrength, experienceLevel)
      if (strengthPick) {
        addExercise(selectorCtx, strengthPick, `Skill-specific ${isPush ? 'push' : 'pull'} strength`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'selected_skill_support',
          sessionRole: 'strength_support',
          expressionMode: 'strength_support',
          influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
          candidatePoolSize: goalStrength.length,
        })
      }
    }
    
    // Add skill exposure if this is a primary day - use session allocation
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization for primary day skill matching
    if (day.isPrimary) {
      const primarySkillAlloc = sessionSkillsToSupport.find(s => s.expressionMode === 'primary') || sessionSkillsToSupport[0]
      // Safely get skill key with fallback to primaryGoal
      const targetSkill = safeSkillKey(primarySkillAlloc) || safeLower(primaryGoal)
      const skillCandidates = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
        .filter(e => targetSkill && exerciseTransfersToSkill(e, targetSkill))
        .filter(e => !usedIds.has(e.id))
      
      if (skillCandidates.length > 0) {
        const skillPick = selectByLevel(skillCandidates, experienceLevel) || skillCandidates[0]
        addExercise(selectorCtx, skillPick, 'Skill exposure alongside strength work', undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'primary_skill_technical',
          sessionRole: 'skill_secondary',
          expressionMode: 'technical_focus',
          influencingSkills: [{ skillId: primarySkillAlloc?.skill || primaryGoal, influence: 'primary', expressionMode: 'rotation' }],
          candidatePoolSize: skillCandidates.length,
        })
      }
    }
  }
  
  // 3. MIXED/SUPPORT DAYS
  // [selection-compression-fix] ISSUE C: Make session roles create real differences
  if (day.focus === 'mixed_upper' || day.focus === 'support_recovery') {
    const isLightDay = day.focus === 'support_recovery' || day.targetIntensity === 'low'
    
    // [selection-compression-fix] Use session skill allocation for variety
    const sessionSkillsForMixed = skillsForSession && skillsForSession.length > 0
      ? skillsForSession
      : [{ skill: primaryGoal, expressionMode: 'support' as const, weight: 1 }]
    
    const mixedDaySkillLabels = sessionSkillsForMixed.map(function(s) {
      return s.skill + '(' + s.expressionMode + ')';
    });
    console.log('[selection-compression-fix] Mixed day selection:', {
      isLightDay,
      sessionSkills: mixedDaySkillLabels,
    });
    
    // [selection-compression-fix] ISSUE F: Prefer skill-specific accessories over generic
    // First, try to find push/pull work that supports session skills
    const allAccessory = [...availableAccessory, ...availableStrength.filter(e => e.fatigueCost <= 3)]
    
    // Find push work that aligns with session skills
    // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized movement pattern check
    const pushCandidates = allAccessory
      .filter(e => {
        const norm = getNormalized(e)
        return norm ? normalizedMatchesMovement(norm, 'push') || norm.movementPattern === 'horizontal_push' || norm.movementPattern === 'vertical_push' : false
      })
      .map(e => ({
        exercise: e,
        score: scoreExerciseForSession(e, sessionSkillsForMixed, day.focus, hasWeightedEquipment),
        skillAligned: sessionSkillsForMixed.some(s => {
          const skillKey = safeSkillKey(s)
          return skillKey && exerciseTransfersToSkill(e, skillKey)
        })
      }))
      .sort((a, b) => {
        // Prefer skill-aligned exercises
        if (a.skillAligned && !b.skillAligned) return -1
        if (!a.skillAligned && b.skillAligned) return 1
        return b.score - a.score
      })
    
    if (pushCandidates.length > 0) {
      const pick = isLightDay 
        ? pushCandidates.find(c => c.exercise.fatigueCost <= 2) || pushCandidates[0]
        : pushCandidates[0]
      
      // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
      const influencingSkill = sessionSkillsForMixed.find(s => {
        const skillKey = safeSkillKey(s)
        return skillKey && exerciseTransfersToSkill(pick.exercise, skillKey)
      })
      
      addExercise(selectorCtx, pick.exercise, pick.skillAligned ? `Push work supporting ${influencingSkill?.skill || 'skills'}` : 'Balanced push work', isLightDay ? 3 : 4, undefined, undefined, 'standalone', {
        primarySelectionReason: pick.skillAligned ? 'selected_skill_support' : 'session_role_fill',
        sessionRole: 'accessory',
        expressionMode: isLightDay ? 'rotation_light' : 'strength_support',
        influencingSkills: influencingSkill ? [{ skillId: influencingSkill.skill, influence: 'selected', expressionMode: 'support' }] : [],
        candidatePoolSize: pushCandidates.length,
      })
      
      if (pick.skillAligned) {
        console.log('[selected-skill-exposure] Mixed day push aligned to skill:', influencingSkill?.skill)
      }
    }
    
    // Find pull work that aligns with session skills
    // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized movement pattern check
    const pullCandidates = allAccessory
      .filter(e => {
        const norm = getNormalized(e)
        return norm ? normalizedMatchesMovement(norm, 'pull') || norm.movementPattern === 'horizontal_pull' || norm.movementPattern === 'vertical_pull' : false
      })
      .filter(e => !usedIds.has(e.id))
      .map(e => ({
        exercise: e,
        score: scoreExerciseForSession(e, sessionSkillsForMixed, day.focus, hasWeightedEquipment),
        skillAligned: sessionSkillsForMixed.some(s => {
          const skillKey = safeSkillKey(s)
          return skillKey && exerciseTransfersToSkill(e, skillKey)
        })
      }))
      .sort((a, b) => {
        if (a.skillAligned && !b.skillAligned) return -1
        if (!a.skillAligned && b.skillAligned) return 1
        return b.score - a.score
      })
    
    if (pullCandidates.length > 0) {
      const pick = isLightDay 
        ? pullCandidates.find(c => c.exercise.fatigueCost <= 2) || pullCandidates[0]
        : pullCandidates[0]
      
      // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
      const influencingSkill = sessionSkillsForMixed.find(s => {
        const skillKey = safeSkillKey(s)
        return skillKey && exerciseTransfersToSkill(pick.exercise, skillKey)
      })
      
      addExercise(selectorCtx, pick.exercise, pick.skillAligned ? `Pull work supporting ${influencingSkill?.skill || 'skills'}` : 'Balanced pull work', isLightDay ? 3 : 4, undefined, undefined, 'standalone', {
        primarySelectionReason: pick.skillAligned ? 'selected_skill_support' : 'session_role_fill',
        sessionRole: 'accessory',
        expressionMode: isLightDay ? 'rotation_light' : 'strength_support',
        influencingSkills: influencingSkill ? [{ skillId: influencingSkill.skill, influence: 'selected', expressionMode: 'support' }] : [],
        candidatePoolSize: pullCandidates.length,
      })
      
      if (pick.skillAligned) {
        console.log('[selected-skill-exposure] Mixed day pull aligned to skill:', influencingSkill?.skill)
      }
    }
    
    // Add skill exposure at reduced intensity - use session skill allocation
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    if (!isLightDay) {
      const primarySkillAlloc = sessionSkillsForMixed.find(s => s.expressionMode === 'primary' || s.expressionMode === 'support')
      const targetSkill = safeSkillKey(primarySkillAlloc) || safeLower(primaryGoal)
      const skillCandidates = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
        .filter(e => targetSkill && exerciseTransfersToSkill(e, targetSkill))
        .filter(e => !usedIds.has(e.id))
      
      if (skillCandidates.length > 0) {
        const skillPick = selectByLevel(skillCandidates, experienceLevel) || skillCandidates[0]
        addExercise(selectorCtx, skillPick, 'Skill maintenance', 3, undefined, 'Moderate intensity', 'standalone', {
          primarySelectionReason: 'recovery_rotation',
          sessionRole: 'skill_secondary',
          expressionMode: 'rotation_light',
          influencingSkills: [{ skillId: primarySkillAlloc?.skill || primaryGoal, influence: 'selected', expressionMode: 'rotation' }],
          candidatePoolSize: skillCandidates.length,
        })
      }
    }
  }
  
  // 4. TRANSITION DAYS (for muscle-up goals)
  if (day.focus === 'transition_work') {
    // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized candidates for transition filter
    const transitionExercises = [...availableSkills, ...availableStrength].filter(e => {
      const norm = getNormalized(e)
      return norm 
        ? norm.movementPattern === 'transition' || normalizedTransfersTo(norm, 'muscle_up')
        : false
    })
    
    transitionExercises.slice(0, 2).forEach(e => {
      addExercise(selectorCtx, e, 'Transition pattern development')
    })
  }
  
  // 5. RANGE-BASED TRAINING (Flexibility vs Mobility)
  // SpartanLab distinguishes two training modes:
  // 
  // FLEXIBILITY MODE (default):
  //   - 15 second holds, 3 rounds, low soreness
  //   - Trainable daily, recovery-friendly
  // 
  // MOBILITY MODE (if rangeTrainingMode === 'mobility'):
  //   - Loaded stretches, RPE-based, strength-style recovery
  //   - Treated like strength training
  // 
  // HYBRID MODE: Combines both approaches
  const rangeSkills = ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'flexibility']
  if (rangeSkills.includes(primaryGoal) || day.focus === 'flexibility_focus') {
    // Determine range training mode (default to flexibility)
    const rangeTrainingMode: RangeTrainingMode = (context as { rangeTrainingMode?: RangeTrainingMode })?.rangeTrainingMode || 'flexibility'
    const isRangeSkill = ['pancake', 'toe_touch', 'front_splits', 'side_splits'].includes(primaryGoal)
    const rangeSkill = isRangeSkill ? primaryGoal as RangeSkill : 'toe_touch'
    
    if (rangeTrainingMode === 'flexibility' || rangeTrainingMode === 'hybrid') {
      // FLEXIBILITY MODE: 15s holds, 3 rounds, low fatigue
      const availableFlexibility = FLEXIBILITY_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
      // [PHASE15E-SELECTOR-INPUT-TRUTH] Use safe transfer check helper
      const goalFlexibility = availableFlexibility.filter(e => 
        exerciseTransfersToSkill(e, primaryGoal) || (e as any).progressionLadder === primaryGoal
      )
      
      const flexPool = primaryGoal === 'flexibility' 
        ? availableFlexibility 
        : goalFlexibility.length > 0 ? goalFlexibility : availableFlexibility
      
      // [PHASE15E-SELECTOR-INPUT-TRUTH] Use safe transfer check in sort
      const sortedFlexExercises = flexPool.sort((a, b) => {
        const aTransfer = exerciseTransfersToSkill(a, primaryGoal) ? 1 : 0
        const bTransfer = exerciseTransfersToSkill(b, primaryGoal) ? 1 : 0
        if (aTransfer !== bTransfer) return bTransfer - aTransfer
        const aLadder = (a as any).progressionLadder === primaryGoal ? 1 : 0
        const bLadder = (b as any).progressionLadder === primaryGoal ? 1 : 0
        return bLadder - aLadder
      })
      
      // Flexibility: 15s holds, 3 rounds
      const flexCount = rangeTrainingMode === 'hybrid' ? 2 : Math.min(4, maxExercises - 1)
      sortedFlexExercises.slice(0, flexCount).forEach((exercise) => {
        addExercise(
          selectorCtx,
          exercise,
          `${primaryGoal} flexibility flow`,
          3,
          '15s',
          '15s exposure, multiple angles, breathe steadily'
        )
      })
    }
    
    if (rangeTrainingMode === 'mobility' || rangeTrainingMode === 'hybrid') {
      // MOBILITY MODE: Loaded work, RPE-based, strength-style recovery
      const mobilityExercises = MOBILITY_EXERCISES[rangeSkill] || []
      const mobilityCount = rangeTrainingMode === 'hybrid' ? 2 : Math.min(3, maxExercises - selected.length)
      
      mobilityExercises.slice(0, mobilityCount).forEach((mobEx) => {
        // Find matching exercise in pool or create reference
        const matchingExercise = FLEXIBILITY_EXERCISES.find(e => e.id === mobEx.id) || {
          id: mobEx.id,
          name: mobEx.name,
          category: 'flexibility' as const,
          movementPattern: 'mobility',
          primaryMuscles: ['hip_flexors'],
          equipment: ['floor'] as EquipmentType[],
          neuralDemand: 2,
          fatigueCost: 2,
          transferTo: [rangeSkill],
          defaultSets: mobEx.sets,
          defaultRepsOrTime: mobEx.repsOrHold,
          difficultyLevel: 'intermediate' as DifficultyLevel,
          movementCategory: 'flexibility',
        }
        
        addExercise(
          selectorCtx,
          matchingExercise,
          `${primaryGoal} mobility work (RPE ${mobEx.targetRPE})`,
          mobEx.sets,
          mobEx.repsOrHold,
          mobEx.cues.join(', ')
        )
      })
    }
    
    // Add light core/compression if room
    // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized candidate check
    if (selected.length < maxExercises) {
      const compressionCore = availableCore.find(e => {
        const norm = getNormalized(e)
        return norm 
          ? norm.movementPattern === 'compression' || normalizedTransfersTo(norm, 'l_sit')
          : false
      })
      if (compressionCore && !usedIds.has(compressionCore.id)) {
        addExercise(selectorCtx, compressionCore, 'Active compression support', 3, '15s')
      }
    }
  }
  
  // ==========================================================================
  // Fill remaining slots with support and core work
  // ==========================================================================
  
  // =========================================================================
  // [exercise-expression] TASK 2/3/4: MULTI-SKILL EXPRESSION FROM DOCTRINE
  // This is where selected skills beyond the primary goal get expressed
  // =========================================================================
  
  if (skillsForSession && skillsForSession.length > 0 && selected.length < maxExercises) {
    const allocationLabels = skillsForSession.map(function(s) {
      return s.skill + '(' + s.expressionMode + ')';
    });
    console.log('[exercise-expression] Processing skill allocations:', {
      dayFocus: day.focus,
      allocations: allocationLabels,
      currentExerciseCount: selected.length,
      maxExercises,
    });
    
    // Track which skills we've already expressed via primary goal
    const expressedSkillIds = new Set<string>([primaryGoal])
    
    // Process each skill allocation by expression mode
    for (const allocation of skillsForSession) {
      if (selected.length >= maxExercises) break
      if (expressedSkillIds.has(allocation.skill)) continue
      
      // Get doctrine support mapping for this skill
      const supportMapping = getSupportMapping(allocation.skill as SkillCarryover)
      
      console.log('[exercise-expression] Processing skill allocation:', {
        skill: allocation.skill,
        expressionMode: allocation.expressionMode,
        weight: allocation.weight,
        hasDoctrine: !!supportMapping,
        directExercises: supportMapping?.directSupportExercises?.slice(0, 3) || [],
      })
      
      // Find exercises for this skill based on expression mode
      let skillExercise: Exercise | undefined
      let exerciseReason = ''
      
      if (allocation.expressionMode === 'primary' || allocation.expressionMode === 'technical') {
        // Direct or technical expression: use direct support exercises from doctrine
        if (supportMapping) {
          for (const exerciseId of supportMapping.directSupportExercises) {
            if (usedIds.has(exerciseId)) continue
            skillExercise = [...availableSkills, ...availableStrength].find(e => e.id === exerciseId)
            if (skillExercise && canAddMore(skillExercise)) {
              exerciseReason = allocation.expressionMode === 'primary'
                ? `Direct ${supportMapping.displayName} work`
                : `Technical ${supportMapping.displayName} practice`
              break
            }
          }
        }
        
        // Fallback to transfer-based lookup
        // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized transfer check
        if (!skillExercise) {
          skillExercise = [...availableSkills, ...availableStrength].find(e => {
            if (usedIds.has(e.id)) return false
            const norm = getNormalized(e)
            return norm && normalizedTransfersTo(norm, allocation.skill) && canAddMore(e)
          })
          if (skillExercise) {
            exerciseReason = `${allocation.skill} skill development`
          }
        }
      } else if (allocation.expressionMode === 'support') {
        // Support expression: use accessory support exercises from doctrine
        if (supportMapping) {
          for (const exerciseId of supportMapping.accessorySupportExercises) {
            if (usedIds.has(exerciseId)) continue
            skillExercise = [...availableAccessory, ...availableStrength].find(e => e.id === exerciseId)
            if (skillExercise && canAddMore(skillExercise)) {
              exerciseReason = `Support work for ${supportMapping.displayName}`
              break
            }
          }
          
          // Also try limiter-based support
          if (!skillExercise && supportMapping.commonLimiters.length > 0) {
            const limiter = supportMapping.commonLimiters[0]
            for (const exerciseId of limiter.exerciseIds) {
              if (usedIds.has(exerciseId)) continue
              skillExercise = [...availableAccessory, ...availableStrength, ...availableCore].find(e => e.id === exerciseId)
              if (skillExercise && canAddMore(skillExercise)) {
                exerciseReason = `${limiter.description} (${supportMapping.displayName} prerequisite)`
                break
              }
            }
          }
        }
        
        // Fallback to transfer-based lookup for accessories
        // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized transfer check
        if (!skillExercise) {
          skillExercise = availableAccessory.find(e => {
            if (usedIds.has(e.id)) return false
            const norm = getNormalized(e)
            return norm && normalizedTransfersTo(norm, allocation.skill) && canAddMore(e)
          })
          if (skillExercise) {
            exerciseReason = `${allocation.skill} support work`
          }
        }
      } else if (allocation.expressionMode === 'warmup') {
        // Warmup expression: handled in warm-up generation, skip here
        continue
      }
      
      // Add the selected exercise if found
      if (skillExercise) {
        const added = addExercise(selectorCtx, skillExercise, exerciseReason)
        if (added) {
          expressedSkillIds.add(allocation.skill)
          console.log('[exercise-expression] Added skill exercise:', {
            skill: allocation.skill,
            exerciseId: skillExercise.id,
            expressionMode: allocation.expressionMode,
            reason: exerciseReason,
          })
        }
      } else {
        console.log('[exercise-expression] Could not find exercise for skill:', {
          skill: allocation.skill,
          expressionMode: allocation.expressionMode,
          searched: supportMapping?.directSupportExercises?.length || 0,
        })
      }
    }
    
    // Log final expression summary
    console.log('[exercise-expression] Session skill expression summary:', {
      dayFocus: day.focus,
      allocatedSkills: skillsForSession.length,
      expressedSkills: expressedSkillIds.size,
      unexpressedSkills: skillsForSession
        .filter(s => !expressedSkillIds.has(s.skill))
        .map(s => s.skill),
      exerciseCount: selected.length,
    })
  }
  
  // ==========================================================================
  // [SESSION-ARCHITECTURE-MATERIALIZATION] SUPPORT SKILL ENFORCEMENT
  // Ensure support skills from architecture truth materially affect the session
  // when there is room and it's justified by recovery/time constraints
  // ==========================================================================
  const supportSkillsAllocatedForSession = skillsForSession?.filter(s => s.expressionMode === 'support') || []
  const currentlyMaterializedSkills = new Set(
    selected
      .filter(s => s.selectionContext?.influencingSkills?.length)
      .flatMap(s => s.selectionContext?.influencingSkills?.map(i => i.skillId) || [])
  )
  const unmaterializedSupportSkills = supportSkillsAllocatedForSession
    .filter(s => !currentlyMaterializedSkills.has(s.skill))
  
  // Calculate how much room we have for support skill insertion
  const roomForSupportSkills = Math.max(0, maxExercises - selected.length - 1) // Leave 1 for core
  const shouldInsertSupportSkills = 
    unmaterializedSupportSkills.length > 0 && 
    roomForSupportSkills > 0 &&
    !mustDowngradeToSupport
  
  if (shouldInsertSupportSkills) {
    console.log('[SESSION-ARCHITECTURE-MATERIALIZATION] Attempting support skill insertion:', {
      unmaterializedSupportSkills: unmaterializedSupportSkills.map(s => s.skill),
      roomAvailable: roomForSupportSkills,
      currentExerciseCount: selected.length,
      maxExercises,
    })
    
    for (const supportAlloc of unmaterializedSupportSkills.slice(0, roomForSupportSkills)) {
      if (selected.length >= maxExercises - 1) break
      
      // Get doctrine support for this skill
      const supportMapping = getSupportMapping(supportAlloc.skill as SkillCarryover)
      let supportExercise: Exercise | undefined
      let supportReason = ''
      
      // Priority 1: Doctrine-backed accessory support
      if (supportMapping) {
        for (const exId of supportMapping.accessorySupportExercises) {
          if (usedIds.has(exId)) continue
          supportExercise = [...availableAccessory, ...availableStrength].find(e => e.id === exId)
          if (supportExercise && canAddMore(supportExercise, 'standalone')) {
            supportReason = `Support for ${supportMapping.displayName}`
            break
          }
        }
        
        // Priority 2: Limiter-based support
        if (!supportExercise && supportMapping.commonLimiters.length > 0) {
          for (const limiter of supportMapping.commonLimiters.slice(0, 2)) {
            if (supportExercise) break
            for (const exId of limiter.exerciseIds) {
              if (usedIds.has(exId)) continue
              supportExercise = [...availableAccessory, ...availableStrength, ...availableCore].find(e => e.id === exId)
              if (supportExercise && canAddMore(supportExercise, 'standalone')) {
                supportReason = `${limiter.description} (${supportMapping.displayName} prereq)`
                break
              }
            }
          }
        }
      }
      
      // Priority 3: Transfer-based fallback
      // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
      if (!supportExercise) {
        const supportSkillKey = safeLower(supportAlloc.skill).replace(/_/g, '')
        supportExercise = [...availableAccessory, ...availableStrength]
          .find(e => 
            !usedIds.has(e.id) && 
            supportSkillKey && exerciseTransfersToSkill(e, supportSkillKey) &&
            canAddMore(e, 'standalone')
          )
        if (supportExercise) {
          supportReason = `Support work for ${supportAlloc.skill}`
        }
      }
      
      // Add the support exercise with explicit tracing
      if (supportExercise) {
const added = addExercise(
          selectorCtx,
          supportExercise,
          supportReason,
          undefined, 
          undefined, 
          undefined, 
          'standalone',
          {
            primarySelectionReason: 'support_skill_materialization',
            sessionRole: 'support_volume',
            expressionMode: 'support',
            influencingSkills: [{ 
              skillId: supportAlloc.skill, 
              influence: 'selected', 
              expressionMode: 'support' 
            }],
            candidatePoolSize: (supportMapping?.accessorySupportExercises?.length || 0) + 
              (supportMapping?.commonLimiters?.reduce((acc, l) => acc + l.exerciseIds.length, 0) || 0),
          }
        )
        
        if (added) {
          console.log('[SESSION-ARCHITECTURE-MATERIALIZATION] Support skill materialized:', {
            skill: supportAlloc.skill,
            exerciseId: supportExercise.id,
            exerciseName: supportExercise.name,
            reason: supportReason,
          })
        }
      } else {
        console.log('[SESSION-ARCHITECTURE-MATERIALIZATION] Support skill could not be materialized:', {
          skill: supportAlloc.skill,
          searchedDoctrine: !!supportMapping,
          reason: 'no_viable_exercise_found',
        })
      }
    }
  }
  
  // Log support materialization summary
  if (supportSkillsAllocatedForSession.length > 0) {
    const finalMaterializedSupport = selected
      .filter(s => 
        s.selectionContext?.primarySelectionReason === 'support_skill_materialization' ||
        supportSkillsAllocatedForSession.some(alloc => 
          s.selectionContext?.influencingSkills?.some(i => i.skillId === alloc.skill)
        )
      )
      .map(s => s.selectionContext?.influencingSkills?.[0]?.skillId)
      .filter(Boolean)
    
    console.log('[SESSION-ARCHITECTURE-MATERIALIZATION-SUMMARY]', {
      supportSkillsAllocated: supportSkillsAllocatedForSession.map(s => s.skill),
      supportSkillsMaterialized: [...new Set(finalMaterializedSupport)],
      supportSkillsDropped: unmaterializedSupportSkills
        .filter(s => !finalMaterializedSupport.includes(s.skill))
        .map(s => s.skill),
      materializationRate: supportSkillsAllocatedForSession.length > 0
        ? `${Math.round((finalMaterializedSupport.length / supportSkillsAllocatedForSession.length) * 100)}%`
        : 'N/A',
    })
  }
  
  // ==========================================================================
  // TASK 1-B/C: Constraint-safe fallback for empty sessions
  // If we reach here with no exercises AND were supposed to downgrade, build support session
  // ==========================================================================
  if (selected.length === 0 && mustDowngradeToSupport) {
    console.log('[constraint-session-fallback] Building constraint-safe support session:', {
      primaryGoal,
      dayFocus: day.focus,
      constraintType,
    })
    
    // Deterministic fallback chain for constrained Planche/skill sessions
    // TASK 1-C: Priority order - support strength > limiter correction > core > general
    
    // Step 1: Goal-relevant support strength
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    const goalSupportExercises = availableStrength.filter(e => 
      exerciseTransfersToSkill(e, primaryGoal) ||
      (primaryGoal === 'planche' && (e.movementFamily === 'push' || e.tags?.includes('straight_arm'))) ||
      (primaryGoal === 'front_lever' && (e.movementFamily === 'pull' || e.tags?.includes('straight_arm'))) ||
      (primaryGoal === 'muscle_up' && (e.movementFamily === 'pull' || e.movementFamily === 'push'))
    )
    
    for (const ex of goalSupportExercises.slice(0, 2)) {
      if (selected.length >= maxExercises - 1) break
      const added = addExercise(selectorCtx, ex, `[Constrained] ${primaryGoal} support strength`, undefined, undefined, undefined, 'standalone', {
        primarySelectionReason: 'constraint_fallback_support',
        sessionRole: 'strength_support',
        expressionMode: 'strength_support',
        influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
        limiterInfluence: constraintType || undefined,
      })
      if (added) {
        console.log('[constraint-session-fallback] Added support exercise:', ex.id)
      }
    }
    
    // Step 2: If still empty, add limiter-correction exercises
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    if (selected.length === 0) {
      const limiterExercises = availableAccessory.filter(e => 
        e.tags?.includes('prehab') || 
        e.tags?.includes('mobility') ||
        exerciseTransfersToSkill(e, primaryGoal)
      )
      
      for (const ex of limiterExercises.slice(0, 2)) {
        if (selected.length >= maxExercises - 1) break
        addExercise(selectorCtx, ex, `[Constrained] Limiter correction for ${primaryGoal}`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'constraint_fallback_limiter',
          sessionRole: 'support_volume',
          expressionMode: 'prehab_focus',
          limiterInfluence: constraintType || undefined,
        })
      }
    }
    
    // Step 3: If still empty, add goal-relevant core
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    if (selected.length === 0) {
      const coreForGoal = availableCore.filter(e => 
        exerciseTransfersToSkill(e, primaryGoal) ||
        (primaryGoal === 'planche' && e.tags?.includes('compression')) ||
        (primaryGoal === 'front_lever' && e.tags?.includes('anti_extension'))
      )
      
      for (const ex of coreForGoal.slice(0, 2)) {
        if (selected.length >= maxExercises - 1) break
        addExercise(selectorCtx, ex, `[Constrained] Core for ${primaryGoal}`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'constraint_fallback_core',
          sessionRole: 'core',
          expressionMode: 'core_focus',
        })
      }
    }
    
    // Step 4: Final fallback - any goal-compatible strength
    if (selected.length === 0 && availableStrength.length > 0) {
      const fallbackStrength = availableStrength
        .sort((a, b) => (b.carryover || 0) - (a.carryover || 0))
        .slice(0, 3)
      
      for (const ex of fallbackStrength) {
        if (selected.length >= maxExercises - 1) break
        addExercise(selectorCtx, ex, `[Constrained] General strength fallback`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'constraint_fallback_general',
          sessionRole: 'strength_support',
          expressionMode: 'strength_support',
        })
      }
    }
    
    console.log('[constraint-session-final]', {
      primaryGoal,
      dayFocus: day.focus,
      constraintType,
      originalExpression: 'direct',
      downgradedExpression: 'support',
      finalExerciseCount: selected.length,
      exercises: selected.map(e => e.exercise.id),
    })
  }
  
  // Add constraint-responsive exercise if applicable
  if (constraintType && selected.length < maxExercises) {
    const constraintExercise = getConstraintTargetedExercise(
      constraintType,
      availableStrength,
      availableAccessory,
      usedIds
    )
    if (constraintExercise) {
      addExercise(selectorCtx, constraintExercise, `Targets your current limiter: ${constraintType}`)
    }
  }
  
  // ==========================================================================
  // [AI_TRUTH_GENERATION_MATERIALITY_PHASE_1] SUPPORT SKILL EXERCISE INJECTION
  // ==========================================================================
  // This block ensures support skills from materialSkillIntent ACTUALLY GET
  // exercise slots - not just scoring boosts. This is the key fix for making
  // broader selected skills materially affect the generated program.
  // ==========================================================================
  const supportSkillsExpressed: string[] = []
  const supportSkillsDeferred: Array<{ skill: string; reason: string }> = []
  const tertiarySkillsExpressed: string[] = []
  const tertiarySkillsDeferred: Array<{ skill: string; reason: string }> = []
  
  // ==========================================================================
  // [VISIBLE-WEEK-EXPRESSION-FIX] TERTIARY SKILL EXERCISE INJECTION
  // ==========================================================================
  // Tertiary skills now receive their own exercise injection, not just support work.
  // This makes broader selected skills materially affect the generated program.
  // ==========================================================================
  if (materialSkillIntent && materialSkillIntent.length > 0 && selected.length < maxExercises) {
    // Find tertiary skills that need expression (these have higher priority than support)
    const tertiarySkillsFromIntent = materialSkillIntent.filter(s => s.role === 'tertiary')

    if (tertiarySkillsFromIntent.length > 0) {
      // [PHASE 1 SELECTED-SKILL DIRECT-EXPRESSION LOCK]
      // Intent-driven slot count (was: Math.min(2, remaining) hard cap).
      // The prior 2-slot cap silently deferred 3rd+ selected tertiary skills
      // with reason='session_slot_limit_reached'. For a user selecting e.g.
      // planche-primary + back_lever + dragon_flag + one_arm_pull_up, the
      // last two would never materialize as direct work. Lifting the cap to
      // tertiarySkillsFromIntent.length (still bounded by session slots)
      // gives every selected tertiary skill a fair attempt. The session-
      // level load gates (canAddMore) remain the true upper bound on total
      // work, so this cannot produce oversized sessions.
      const maxTertiarySlots = Math.min(tertiarySkillsFromIntent.length, maxExercises - selected.length)
      let tertiarySlotsUsed = 0

      console.log('[PHASE1-SELECTED-SKILL-LOCK] Tertiary skill injection starting:', {
        dayFocus: day.focus,
        tertiarySkillCount: tertiarySkillsFromIntent.length,
        tertiarySkills: tertiarySkillsFromIntent.map(s => s.skill),
        slotsRemaining: maxExercises - selected.length,
        slotBudgetForTertiary: maxTertiarySlots,
      })

      for (const tertiaryEntry of tertiarySkillsFromIntent) {
        if (tertiarySlotsUsed >= maxTertiarySlots) {
          tertiarySkillsDeferred.push({
            skill: tertiaryEntry.skill,
            reason: 'session_slot_budget_exhausted',
          })
          continue
        }

        // [PHASE 1] Canonical-registry-sourced candidates (was: substring/
        // transfer matching inline). The helper checks ADVANCED_SKILL_FAMILIES
        // .directProgressions first, then getAdvancedSkillSupport(), then
        // falls back to the legacy substring/transfer match so we never
        // regress candidate pool size for skills not in the canonical
        // registry.
        const { candidates: canonicalCandidates, source: canonicalSource } =
          buildCanonicalSkillCandidates(
            tertiaryEntry.skill,
            [availableSkills, availableStrength, availableAccessory],
            usedIds
          )

        if (canonicalCandidates.length === 0) {
          tertiarySkillsDeferred.push({
            skill: tertiaryEntry.skill,
            reason: 'no_canonical_candidates',
          })
          console.log('[PHASE1-SELECTED-SKILL-LOCK] Tertiary skill NO CANDIDATES:', {
            skill: tertiaryEntry.skill,
            canonicalSource,
          })
          continue
        }

        // [PHASE 2 PROGRESSION-CAP UNIFICATION]
        // Pipe canonical candidates through the single authoritative
        // progression cap owner. A tuck-level back-lever athlete must not
        // surface straddle_back_lever via tertiary injection, which was
        // previously possible because this site skipped the cap entirely.
        const scoredForProgression = canonicalCandidates.map(e => ({ exercise: e }))
        const { filtered: progressionSafe, audit: progressionAudit } =
          filterByCurrentProgression(scoredForProgression, tertiaryEntry.skill)

        if (progressionSafe.length === 0) {
          // [PHASE-1B-REALISM-REROUTE] Direct progressions all blocked by realism
          // cap. Per Phase 1B doctrine "REALISM REROUTE, NOT JUST CAP", we MUST
          // try canonical_support (sub-skill regressions / structural support)
          // for this same skill BEFORE deferring. Previously the skill silently
          // disappeared whenever the user's currentWorkingProgression was below
          // every direct rung available in the equipment-filtered pool — for a
          // tuck-back-lever athlete on a session pool with only straddle/half-lay
          // back-lever entries, back-lever vanished entirely instead of getting
          // its support row (e.g. ring rows, scapular pulls).
          let rerouteCandidate: Exercise | null = null
          let rerouteSource: 'canonical_support_reroute' | null = null
          if (canonicalSource === 'canonical_direct') {
            try {
              const advSupport = getAdvancedSkillSupport(tertiaryEntry.skill)
              if (advSupport) {
                const supportIds = new Set<string>()
                for (const s of advSupport.primary) for (const id of s.exerciseIds) supportIds.add(id)
                for (const s of advSupport.secondary) for (const id of s.exerciseIds) supportIds.add(id)
                for (const id of advSupport.trunk.exerciseIds) supportIds.add(id)
                const reroutePool = [...availableSkills, ...availableStrength, ...availableAccessory]
                // [PHASE 2B] Collect ALL valid support candidates then proximity-rank,
                // instead of `find(...)` which returned first-in-pool order (typically
                // the highest-ranked-fatigue ring variant). The same pickBest helper
                // used by direct sites keeps the reroute selection canonical and
                // progression-closest for consistency.
                const rerouteCandidatesAll = reroutePool.filter(
                  e => supportIds.has(e.id) && !usedIds.has(e.id)
                )
                if (rerouteCandidatesAll.length > 0) {
                  const rerouted = pickBestCanonicalCandidate(rerouteCandidatesAll, tertiaryEntry.skill)
                  rerouteCandidate = rerouted.exercise
                  if (rerouteCandidate) rerouteSource = 'canonical_support_reroute'
                }
              }
            } catch {
              // canonical support lookup failed; fall through to deferral
            }
          }

          if (!rerouteCandidate) {
            tertiarySkillsDeferred.push({
              skill: tertiaryEntry.skill,
              reason: `progression_cap_blocked_all_candidates_no_support_reroute(blocked=${progressionAudit.blockedCount})`,
            })
            console.log('[PHASE1-SELECTED-SKILL-LOCK] Tertiary skill ALL BLOCKED BY PROGRESSION CAP (reroute also empty):', {
              skill: tertiaryEntry.skill,
              currentWorkingProgression: tertiaryEntry.currentWorkingProgression,
              canonicalCandidateCount: canonicalCandidates.length,
              blockedCount: progressionAudit.blockedCount,
              canonicalSource,
            })
            continue
          }

          // Reroute success: inject the support candidate as the tertiary row
          const rerouteAdded = addExercise(
            selectorCtx,
            rerouteCandidate,
            `[Tertiary Skill Reroute] ${tertiaryEntry.skill.replace(/_/g, ' ')} support (direct blocked by realism cap)`,
            undefined, undefined, undefined, 'standalone',
            {
              primarySelectionReason: 'selected_skill_tertiary',
              sessionRole: 'skill_secondary',
              expressionMode: 'technical_focus',
              influencingSkills: [{
                skillId: tertiaryEntry.skill,
                influence: 'selected',
                expressionMode: 'support',
              }],
              doctrineSource: { type: 'skill_doctrine', ruleId: `getAdvancedSkillSupport.${tertiaryEntry.skill}` } as DoctrineSourceTrace,
              candidatePoolSize: canonicalCandidates.length,
            }
          )
          if (rerouteAdded) {
            tertiarySlotsUsed++
            tertiarySkillsExpressed.push(tertiaryEntry.skill)
            console.log('[PHASE1B-REALISM-REROUTE-TERTIARY] Direct blocked, support reroute injected:', {
              skill: tertiaryEntry.skill,
              exerciseId: rerouteCandidate.id,
              currentWorkingProgression: tertiaryEntry.currentWorkingProgression,
              blockedDirectCount: progressionAudit.blockedCount,
              rerouteSource,
              verdict: 'REREROUTED_TO_SUPPORT_INSTEAD_OF_DEFERRING',
            })
          } else {
            tertiarySkillsDeferred.push({
              skill: tertiaryEntry.skill,
              reason: 'reroute_candidate_rejected_load_or_doctrine',
            })
          }
          continue
        }

        // [PHASE 2B CANONICAL SPECIFICITY LOCK] Rank by proximity to the user's
        // `currentWorkingProgression`. Previously this site took `sorted[0]`
        // where `sorted` preserved registry order for canonical_direct — which
        // is low→high — so the LOWEST rung the realism cap permitted was
        // always committed. pickBestCanonicalCandidate prefers: exact match
        // (+100) > one_below (+90) > one_above_bridge (+80) > regression (+70)
        // > other_ladder (+60) > no_ladder (+40), carryover/fatigue as tie-
        // break. This is the direct cause of "tertiary present but weak".
        const tertiaryPick = pickBestCanonicalCandidate(
          progressionSafe.map(p => p.exercise),
          tertiaryEntry.skill
        )
        const selectedTertiaryExercise = tertiaryPick.exercise!

        // Canonical doctrine source for traceability (used by auditors +
        // OnboardingTruthExpressionAudit). canonical_direct is the strongest
        // signal: "this exercise is registered as a direct progression rung
        // for this selected advanced skill".
        const doctrineSource: DoctrineSourceTrace | null =
          canonicalSource === 'canonical_direct'
            ? { type: 'skill_doctrine', ruleId: `ADVANCED_SKILL_FAMILIES.${tertiaryEntry.skill}.directProgressions` } as DoctrineSourceTrace
            : canonicalSource === 'canonical_support'
              ? { type: 'skill_doctrine', ruleId: `getAdvancedSkillSupport.${tertiaryEntry.skill}` } as DoctrineSourceTrace
              : null

        const added = addExercise(
          selectorCtx,
          selectedTertiaryExercise,
          `[Tertiary Skill] ${tertiaryEntry.skill.replace(/_/g, ' ')} development`,
          undefined, undefined, undefined, 'standalone',
          {
            primarySelectionReason: 'selected_skill_tertiary',
            // [PHASE-1B-SESSION-ASSEMBLY-LOCK] Use 'skill_secondary' (NOT 'skill').
            // The architecture-slot enforcement at the bottom of selectMainExercises
            // classifies rows by sessionRole into primary/secondary/support/other
            // buckets. The legacy value 'skill' fell into `currentOther` and was
            // silently erased whenever primary+secondary+support targets summed
            // to maxExercises (typical 30/45-min compression). Routing tertiary
            // injections through the secondary bucket is the canonical match
            // (they ARE selected-skill secondary work) and is what allows the
            // tertiary obligation to actually survive into the final committed
            // session. The trace influence 'selected' below is what the
            // FINAL-SELECTED-SKILL-COMMIT pass uses to identify these rows
            // for protection / restoration.
            sessionRole: 'skill_secondary',
            expressionMode: 'technical_focus',
            influencingSkills: [{
              skillId: tertiaryEntry.skill,
              influence: 'selected',
              expressionMode: 'technical',
            }],
            doctrineSource,
            candidatePoolSize: canonicalCandidates.length,
          }
        )

        if (added) {
          tertiarySlotsUsed++
          tertiarySkillsExpressed.push(tertiaryEntry.skill)
          console.log('[PHASE1-SELECTED-SKILL-LOCK] Tertiary skill ADDED:', {
            skill: tertiaryEntry.skill,
            exerciseId: selectedTertiaryExercise.id,
            exerciseName: selectedTertiaryExercise.name,
            canonicalSource,
            progressionCapBlockedCount: progressionAudit.blockedCount,
            currentWorkingProgression: tertiaryEntry.currentWorkingProgression,
            // [PHASE 2B] Proximity-based pick trace for visible-quality auditing.
            matchQuality: tertiaryPick.matchQuality,
            pickedExerciseLevel: tertiaryPick.exerciseLevel,
            specificityScore: tertiaryPick.specificityScore,
          })
        } else {
          tertiarySkillsDeferred.push({
            skill: tertiaryEntry.skill,
            reason: 'exercise_add_failed_load_limits',
          })
        }
      }

      console.log('[PHASE1-SELECTED-SKILL-LOCK] Tertiary skill injection complete:', {
        tertiarySkillsExpressed,
        tertiarySkillsDeferred,
        slotsUsed: tertiarySlotsUsed,
        remainingSlots: maxExercises - selected.length,
        verdict: tertiarySkillsExpressed.length === tertiarySkillsFromIntent.length
          ? 'ALL_TERTIARY_SKILLS_DIRECTLY_EXPRESSED'
          : tertiarySkillsExpressed.length > 0
            ? 'PARTIAL_TERTIARY_EXPRESSION'
            : 'NO_TERTIARY_EXPRESSED',
      })
    }
  }
  
  // ==========================================================================
  // [AI_TRUTH_GENERATION_MATERIALITY_PHASE_1] SUPPORT SKILL EXERCISE INJECTION (after tertiary)
  // ==========================================================================
  if (materialSkillIntent && materialSkillIntent.length > 0 && selected.length < maxExercises) {
    // Find support skills that need expression
    const supportSkillsFromIntent = materialSkillIntent.filter(s => s.role === 'support')

    if (supportSkillsFromIntent.length > 0) {
      // [PHASE 1] Intent-driven slot budget for support too (was hard 2-cap).
      // Support is lower-priority than tertiary by construction (tertiary
      // ran first and consumed available slots), so this rarely inflates
      // sessions in practice -- it just prevents arbitrary truncation when
      // the session has room and the user selected 3+ support skills.
      const maxSupportSlots = Math.min(supportSkillsFromIntent.length, maxExercises - selected.length)
      let supportSlotsUsed = 0

      console.log('[PHASE1-SELECTED-SKILL-LOCK] Support skill injection starting:', {
        dayFocus: day.focus,
        supportSkillCount: supportSkillsFromIntent.length,
        supportSkills: supportSkillsFromIntent.map(s => s.skill),
        slotsRemaining: maxExercises - selected.length,
        slotBudgetForSupport: maxSupportSlots,
      })

      for (const supportEntry of supportSkillsFromIntent) {
        if (supportSlotsUsed >= maxSupportSlots) {
          supportSkillsDeferred.push({
            skill: supportEntry.skill,
            reason: 'session_slot_budget_exhausted',
          })
          continue
        }

        // [PHASE 1] Canonical-registry-sourced candidates for support role.
        // For support intent, canonical_support (getAdvancedSkillSupport) is
        // the intended match; canonical_direct also qualifies when a skill
        // is advanced and its direct ladder entries remain available.
        const { candidates: canonicalCandidates, source: canonicalSource } =
          buildCanonicalSkillCandidates(
            supportEntry.skill,
            [availableSkills, availableStrength, availableAccessory],
            usedIds
          )

        if (canonicalCandidates.length === 0) {
          supportSkillsDeferred.push({
            skill: supportEntry.skill,
            reason: 'no_canonical_candidates',
          })
          console.log('[PHASE1-SELECTED-SKILL-LOCK] Support skill NO CANDIDATES:', {
            skill: supportEntry.skill,
            canonicalSource,
          })
          continue
        }

        // [PHASE 2 PROGRESSION-CAP UNIFICATION]
        // Apply the single authoritative progression cap to support pool as
        // well. Support is the one place where progression-cap rarely blocks
        // anything (support patterns are deliberately sub-skill level), but
        // routing through the unified gate guarantees a single owner across
        // every injection site.
        const scoredForProgression = canonicalCandidates.map(e => ({ exercise: e }))
        const { filtered: progressionSafe, audit: progressionAudit } =
          filterByCurrentProgression(scoredForProgression, supportEntry.skill)

        if (progressionSafe.length === 0) {
          // [PHASE-1B-REALISM-REROUTE] Support-role reroute. When the canonical
          // builder returned canonical_direct (which happens for advanced skills
          // whose support layer also overlaps direct rungs) and the realism cap
          // blocked all of them, fall back to canonical_support PROPER (lower
          // sub-skill regressions). This mirrors the tertiary-block reroute and
          // is what prevents the support obligation from silently disappearing.
          let rerouteCandidate: Exercise | null = null
          if (canonicalSource === 'canonical_direct') {
            try {
              const advSupport = getAdvancedSkillSupport(supportEntry.skill)
              if (advSupport) {
                const supportIds = new Set<string>()
                for (const s of advSupport.primary) for (const id of s.exerciseIds) supportIds.add(id)
                for (const s of advSupport.secondary) for (const id of s.exerciseIds) supportIds.add(id)
                for (const id of advSupport.trunk.exerciseIds) supportIds.add(id)
                const reroutePool = [...availableSkills, ...availableStrength, ...availableAccessory]
                // [PHASE 2B] Collect all valid support candidates, proximity-rank.
                const rerouteCandidatesAll = reroutePool.filter(
                  e => supportIds.has(e.id) && !usedIds.has(e.id)
                )
                if (rerouteCandidatesAll.length > 0) {
                  const rerouted = pickBestCanonicalCandidate(rerouteCandidatesAll, supportEntry.skill)
                  rerouteCandidate = rerouted.exercise
                }
              }
            } catch {
              // canonical support lookup failed; fall through to deferral
            }
          }

          if (!rerouteCandidate) {
            supportSkillsDeferred.push({
              skill: supportEntry.skill,
              reason: `progression_cap_blocked_all_candidates_no_support_reroute(blocked=${progressionAudit.blockedCount})`,
            })
            continue
          }

          const rerouteAdded = addExercise(
            selectorCtx,
            rerouteCandidate,
            `[Support Skill Reroute] ${supportEntry.skill.replace(/_/g, ' ')} support (direct blocked by realism cap)`,
            undefined, undefined, undefined, 'standalone',
            {
              primarySelectionReason: 'selected_skill_support',
              sessionRole: 'accessory',
              expressionMode: 'skill_accessory',
              influencingSkills: [{
                skillId: supportEntry.skill,
                influence: 'selected',
                expressionMode: 'support',
              }],
              doctrineSource: { type: 'skill_doctrine', ruleId: `getAdvancedSkillSupport.${supportEntry.skill}` } as DoctrineSourceTrace,
              candidatePoolSize: canonicalCandidates.length,
            }
          )
          if (rerouteAdded) {
            supportSlotsUsed++
            supportSkillsExpressed.push(supportEntry.skill)
            console.log('[PHASE1B-REALISM-REROUTE-SUPPORT] Direct blocked, support reroute injected:', {
              skill: supportEntry.skill,
              exerciseId: rerouteCandidate.id,
              blockedDirectCount: progressionAudit.blockedCount,
              verdict: 'REREROUTED_TO_SUPPORT_INSTEAD_OF_DEFERRING',
            })
          } else {
            supportSkillsDeferred.push({
              skill: supportEntry.skill,
              reason: 'reroute_candidate_rejected_load_or_doctrine',
            })
          }
          continue
        }

        // [PHASE 2B CANONICAL SPECIFICITY LOCK] Proximity-ranked support pick.
        // Support intent canonically maps to `canonical_support` (sub-skill /
        // structural support patterns), but for advanced skills canonical_direct
        // can also be returned when direct rungs overlap the support layer.
        // Either way, we want the rung CLOSEST to currentWorkingProgression,
        // not the easiest. Previously `sorted[0]` = first-in-registry-order
        // silently demoted the support slot to ring rows / scapular pulls
        // even when a straddle-level rung was fully valid.
        const supportPick = pickBestCanonicalCandidate(
          progressionSafe.map(p => p.exercise),
          supportEntry.skill
        )
        const selectedSupportExercise = supportPick.exercise!

        const doctrineSource: DoctrineSourceTrace | null =
          canonicalSource === 'canonical_direct'
            ? { type: 'skill_doctrine', ruleId: `ADVANCED_SKILL_FAMILIES.${supportEntry.skill}.directProgressions` } as DoctrineSourceTrace
            : canonicalSource === 'canonical_support'
              ? { type: 'skill_doctrine', ruleId: `getAdvancedSkillSupport.${supportEntry.skill}` } as DoctrineSourceTrace
              : null

        const added = addExercise(
          selectorCtx,
          selectedSupportExercise,
          `[Support Skill] ${supportEntry.skill.replace(/_/g, ' ')} development`,
          undefined, undefined, undefined, 'standalone',
          {
            primarySelectionReason: 'selected_skill_support',
            sessionRole: 'accessory',
            expressionMode: 'skill_accessory',
            influencingSkills: [{
              skillId: supportEntry.skill,
              influence: 'selected',
              expressionMode: 'support',
            }],
            doctrineSource,
            candidatePoolSize: canonicalCandidates.length,
          }
        )

        if (added) {
          supportSlotsUsed++
          supportSkillsExpressed.push(supportEntry.skill)
          console.log('[PHASE1-SELECTED-SKILL-LOCK] Support skill ADDED:', {
            skill: supportEntry.skill,
            exerciseId: selectedSupportExercise.id,
            exerciseName: selectedSupportExercise.name,
            canonicalSource,
            progressionCapBlockedCount: progressionAudit.blockedCount,
            currentWorkingProgression: supportEntry.currentWorkingProgression,
            // [PHASE 2B] Proximity-based pick trace for visible-quality auditing.
            matchQuality: supportPick.matchQuality,
            pickedExerciseLevel: supportPick.exerciseLevel,
            specificityScore: supportPick.specificityScore,
          })
        } else {
          supportSkillsDeferred.push({
            skill: supportEntry.skill,
            reason: 'exercise_add_failed_load_limits',
          })
        }
      }

      console.log('[PHASE1-SELECTED-SKILL-LOCK] Support skill injection complete:', {
        dayFocus: day.focus,
        expressed: supportSkillsExpressed,
        deferred: supportSkillsDeferred,
        slotsUsed: supportSlotsUsed,
        verdict: supportSkillsExpressed.length > 0
          ? 'SUPPORT_SKILLS_MATERIALLY_EXPRESSED'
          : 'SUPPORT_SKILLS_DEFERRED_WITH_REASONS',
      })
    }
  }
  
  // Add accessory work (after support skill injection)
  if (selected.length < maxExercises - 1) {
    // Add movement-appropriate accessory
    // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized movement pattern check
    const accessoryPool = day.movementEmphasis === 'push'
      ? availableAccessory.filter(e => {
          const norm = getNormalized(e)
          return norm ? normalizedMatchesMovement(norm, 'push') : false
        })
      : day.movementEmphasis === 'pull'
        ? availableAccessory.filter(e => {
            const norm = getNormalized(e)
            return norm ? normalizedMatchesMovement(norm, 'pull') : false
          })
        : availableAccessory
    
    const unusedAccessory = accessoryPool.filter(e => !usedIds.has(e.id))
    if (unusedAccessory.length > 0) {
      const pick = unusedAccessory.find(e => e.fatigueCost <= 2) || unusedAccessory[0]
      addExercise(selectorCtx, pick, 'Support volume')
    }
  }
  
  // =========================================================================
  // MOVEMENT-INTELLIGENT CORE SELECTION
  // =========================================================================
  
  // Always try to include core work using movement intelligence
  if (selected.length < maxExercises) {
    // Use movement intelligence to select appropriate core type
    const needsCompression = compressionCoreCount === 0 && (
      primaryGoal === 'l_sit' || primaryGoal === 'v_sit' || 
      primaryGoal === 'front_lever' || primaryGoal === 'planche'
    )
    const needsAntiExtension = antiExtensionCoreCount === 0 && (
      primaryGoal === 'front_lever' || primaryGoal === 'dragon_flag' ||
      primaryGoal === 'planche' || primaryGoal === 'muscle_up'
    )
    
    let corePick: Exercise | undefined
    let coreReason = ''
    
    if (needsCompression) {
      // Select compression core using movement intelligence
      corePick = availableCore.find(e => {
        if (usedIds.has(e.id)) return false
        const intel = normalizeToMovementIntelligent(e)
        return intel.primaryPattern === 'compression_core' || intel.trunkDemand === 'compression'
      })
      coreReason = 'Compression strength for skill transfer'
    } else if (needsAntiExtension) {
      // Select anti-extension core - prefer dragon flag progressions when appropriate
      corePick = availableCore.find(e => {
        if (usedIds.has(e.id)) return false
        const intel = normalizeToMovementIntelligent(e)
        
        // Prefer dragon flag progressions for advanced goals
        if (experienceLevel !== 'beginner' && (
          e.id === 'dragon_flag' || e.id === 'dragon_flag_neg' || 
          e.id === 'dragon_flag_tuck' || e.id === 'dragon_flag_assisted'
        )) {
          return true
        }
        
        return intel.primaryPattern === 'anti_extension_core' || intel.trunkDemand === 'anti_extension'
      })
      coreReason = 'Anti-extension strength for body position control'
    } else {
      // Default: find core that transfers to goal
      // [PHASE15E-SELECTOR-INPUT-TRUTH] Use normalized transfer check
      corePick = availableCore.find(e => {
        if (usedIds.has(e.id)) return false
        const norm = getNormalized(e)
        return norm ? normalizedTransfersTo(norm, primaryGoal) : false
      }) || availableCore.find(e => !usedIds.has(e.id))
      coreReason = `Core work supporting ${primaryGoal}`
    }
    
    if (corePick) {
      console.log('[movement-intel] Selected core exercise:', corePick.id, coreReason)
      addExercise(selectorCtx, corePick, coreReason)
    }
  }
  
  // =========================================================================
  // SESSION COHERENCE VALIDATION
  // =========================================================================
  
  if (movementIntelligentExercises.length > 0) {
    const coherenceResult = validateSessionCoherence(movementIntelligentExercises)
    if (!coherenceResult.passed) {
      console.log('[movement-intel] Session coherence warnings:', coherenceResult.warnings)
    }
    
    const patternAnalysis = analyzeSessionPatterns(movementIntelligentExercises)
    console.log('[movement-intel] Session pattern analysis:', {
      straightArmCount: patternAnalysis.straightArmCount,
      pushCount: patternAnalysis.pushCount,
      pullCount: patternAnalysis.pullCount,
      compressionCount: patternAnalysis.compressionCount,
      antiExtensionCount: patternAnalysis.antiExtensionCount,
      totalJointStress: patternAnalysis.totalJointStress,
    })
  }
  
  // ==========================================================================
  // TASK 1-B: Last resort minimum viable session before return
  // If we somehow still have no exercises, build minimal support session
  // ==========================================================================
  if (selected.length === 0) {
    console.log('[constraint-session-fallback] Final fallback - building minimum viable session:', {
      primaryGoal,
      dayFocus: day.focus,
      constraintType: constraintType || 'none',
      mustDowngradeToSupport,
    })
    
    // Try to add any available strength exercises
    const lastResortStrength = availableStrength
      .filter(e => !usedIds.has(e.id))
      .sort((a, b) => (b.carryover || 0) - (a.carryover || 0))
      .slice(0, 3)
    
    for (const ex of lastResortStrength) {
      if (selected.length >= maxExercises) break
      addExercise(selectorCtx, ex, `[Last Resort] General strength`, undefined, undefined, undefined, 'standalone', {
        primarySelectionReason: 'constraint_fallback_general',
        sessionRole: 'strength_support',
        expressionMode: 'strength_support',
      })
    }
    
    // If still empty, add any core exercises
    if (selected.length === 0) {
      const lastResortCore = availableCore
        .filter(e => !usedIds.has(e.id))
        .slice(0, 2)
      
      for (const ex of lastResortCore) {
        if (selected.length >= maxExercises) break
        addExercise(selectorCtx, ex, `[Last Resort] Core work`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'constraint_fallback_core',
          sessionRole: 'core',
          expressionMode: 'core_focus',
        })
      }
    }
    
    console.log('[constraint-session-final] Last resort session built:', {
      primaryGoal,
      constraintType: constraintType || 'none',
      finalExerciseCount: selected.length,
      exercises: selected.map(e => e.exercise.id),
    })
  }
  
  // TASK 6: Final deduplication pass to remove any duplicate exercises
  // [SELECTED-SKILL-EXPRESSION-ENFORCEMENT] Converted to `let` so that both the
  // skill-floor pass and the advanced-skill enforcement pass below can inject
  // missing exercises into `selected` and then refresh this view. Previously
  // this was `const`, and every `addExercise(...)` call after this point was
  // silently lost because the architecture-slot enforcement reads from
  // `deduplicatedSelected`, not `selected`.
  let deduplicatedSelected = dedupeSelectedExercises(selected)
  if (deduplicatedSelected.length !== selected.length) {
    console.log('[exercise-selector] TASK 6: Removed', selected.length - deduplicatedSelected.length, 'duplicate exercises')
  }
  
  // ==========================================================================
  // [skill-exposure-check] TASK A/B: Minimum skill floor enforcement
  // Even under constraints, skill sessions MUST include direct skill work
  // ==========================================================================
  const isSkillFocusedDay = day.focus === 'push_skill' || day.focus === 'pull_skill' || day.focus === 'skill_density'
  const directSkillExercises = deduplicatedSelected.filter(e => 
    e.exercise.category === 'skill' || 
    e.selectionContext?.sessionRole === 'skill_primary' ||
    e.selectionContext?.sessionRole === 'skill_secondary'
  )
  const progressionExercises = deduplicatedSelected.filter(e =>
    e.exercise.progressionLevel !== undefined ||
    e.selectionContext?.expressionMode === 'direct_intensity' ||
    e.selectionContext?.expressionMode === 'technical_focus'
  )
  
  console.log('[skill-exposure-check] Session skill analysis:', {
    dayFocus: day.focus,
    primaryGoal,
    totalExercises: deduplicatedSelected.length,
    directSkillCount: directSkillExercises.length,
    progressionCount: progressionExercises.length,
    isSkillFocusedDay,
    constraintType: constraintType || 'none',
    meetsMinimumSkillFloor: !isSkillFocusedDay || directSkillExercises.length >= 2,
    recommendation: directSkillExercises.length < 2 && isSkillFocusedDay 
      ? 'NEEDS_MORE_SKILL_WORK' 
      : 'ADEQUATE',
  })
  
  // [skill-exposure-check] TASK A: Enforce minimum 2 skill exercises on skill days
  if (isSkillFocusedDay && directSkillExercises.length < 2 && !mustDowngradeToSupport) {
    console.log('[skill-exposure-check] Enforcing minimum skill floor - attempting to add skill exercises')
    
    // Find unused skill exercises that transfer to goal
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    const unusedSkillCandidates = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
      .filter(e => !usedIds.has(e.id))
      .filter(e => exerciseTransfersToSkill(e, primaryGoal))
      .slice(0, 2 - directSkillExercises.length)
    
    for (const candidate of unusedSkillCandidates) {
      if (deduplicatedSelected.length >= maxExercises) break
      addExercise(selectorCtx, candidate, `[Skill Floor] Direct ${primaryGoal} work`, undefined, undefined, undefined, 'standalone', {
        primarySelectionReason: 'skill_floor_enforcement',
        sessionRole: 'skill_secondary',
        expressionMode: 'technical_focus',
        influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'direct' }],
      })
      console.log('[skill-exposure-check] Added skill floor exercise:', candidate.id)
    }
  }

  // ==========================================================================
  // [SELECTED-SKILL-EXPRESSION-ENFORCEMENT]
  // AUDITED FIRST DILUTION OWNER: The helper `getAdvancedSkillExercises` was
  // authored specifically to guarantee that selected advanced skills
  // (back_lever, dragon_flag, planche_pushup, one_arm_pull_up,
  // one_arm_chin_up, one_arm_push_up) get a direct expression slot whenever
  // the per-session allocator has scheduled them as `primary` or `technical`
  // for this day. Before this fix, the helper was dead code -- declared and
  // fully implemented, but never invoked by `selectMainExercises`. Advanced
  // skill truth from the onboarding selection therefore relied entirely on
  // generic scoring, where rare advanced families lost to broader support
  // candidates on almost every day, making the user's selection feel
  // "diluted" or "generic."
  //
  // This pass is strictly additive and respects overlap-aware doctrine:
  //   - It ONLY injects exercises for skills the session-level allocator
  //     (`getSkillsForSession`) already classified as primary/technical for
  //     this specific session. Skills the allocator deferred to other days
  //     are not forced in.
  //   - It only injects candidates that exist in the already-filtered
  //     `availableSkills`/`availableStrength` pools (equipment, joint
  //     cautions, prerequisite gates have already pruned the pool).
  //   - `addExercise` still performs the doctrine/prerequisite/load-budget
  //     checks internally, so nothing that would normally be blocked
  //     survives.
  //   - `selected.length >= maxExercises` is enforced by `addExercise`
  //     itself, so this pass never inflates the session past the session
  //     duration budget. If the session is already full, missing advanced
  //     skills are logged (visible under-expression) but not forced,
  //     preserving compressibility for 45/30 variants.
  // ==========================================================================
  if (skillsForSession && skillsForSession.length > 0) {
    const selectedAdvancedAllocations = skillsForSession.filter(
      a => isAdvancedSkill(a.skill) &&
      (a.expressionMode === 'primary' || a.expressionMode === 'technical')
    )

    if (selectedAdvancedAllocations.length > 0) {
      const advancedRecommendations = getAdvancedSkillExercises(
        selectedAdvancedAllocations,
        availableSkills,
        availableStrength,
        day.focus || 'mixed_upper'
      )

      // Sort so higher-priority recommendations (primary > technical > support)
      // get their slot first when session budget is tight.
      const sortedRecommendations = [...advancedRecommendations].sort(
        (a, b) => b.priority - a.priority
      )

      const advancedPool = [...availableSkills, ...availableStrength]
      const injectedAdvancedIds: string[] = []
      const skippedAdvanced: Array<{ id: string; reason: string }> = []

      for (const rec of sortedRecommendations) {
        if (selected.length >= maxExercises) {
          skippedAdvanced.push({ id: rec.exerciseId, reason: 'session_budget_full' })
          continue
        }
        if (usedIds.has(rec.exerciseId)) {
          skippedAdvanced.push({ id: rec.exerciseId, reason: 'already_selected' })
          continue
        }
        const candidate = advancedPool.find(e => safeExerciseId(e) === safeLower(rec.exerciseId))
        if (!candidate) {
          skippedAdvanced.push({ id: rec.exerciseId, reason: 'not_in_available_pool' })
          continue
        }

        const ownerSkill = selectedAdvancedAllocations.find(a => {
          const family = getAdvancedSkillFamily(a.skill)
          return family?.directProgressions?.some(p => safeLower(p) === safeLower(rec.exerciseId))
        })

        const added = addExercise(
          selectorCtx,
          candidate,
          `[Advanced Skill Enforcement] ${rec.reason}`,
          undefined,
          undefined,
          undefined,
          'standalone',
          {
            primarySelectionReason: 'selected_skill_direct_expression',
            sessionRole: rec.priority >= 3 ? 'skill_primary' : 'skill_secondary',
            expressionMode: rec.priority >= 3 ? 'direct_intensity' : 'technical_focus',
            influencingSkills: ownerSkill ? [{
              skillId: ownerSkill.skill,
              influence: 'selected',
              expressionMode: ownerSkill.expressionMode === 'primary' ? 'direct' : 'technical',
            }] : undefined,
          }
        )
        if (added) {
          injectedAdvancedIds.push(candidate.id)
        } else {
          skippedAdvanced.push({ id: rec.exerciseId, reason: 'addExercise_rejected_doctrine_or_load' })
        }
      }

      console.log('[SELECTED-SKILL-EXPRESSION-ENFORCEMENT]', {
        dayFocus: day.focus,
        selectedAdvancedSkillsForSession: selectedAdvancedAllocations.map(a => ({
          skill: a.skill,
          mode: a.expressionMode,
        })),
        recommendationsComputed: sortedRecommendations.length,
        injectedCount: injectedAdvancedIds.length,
        injectedIds: injectedAdvancedIds,
        skipped: skippedAdvanced,
        verdict: injectedAdvancedIds.length > 0
          ? 'ADVANCED_SKILL_DIRECT_EXPRESSION_ENFORCED'
          : sortedRecommendations.length > 0
            ? 'ADVANCED_SKILL_UNDER_EXPRESSED_THIS_SESSION'
            : 'NO_ADVANCED_RECOMMENDATIONS_FOR_THIS_DAY',
      })
    }
  }

  // [SELECTED-SKILL-EXPRESSION-ENFORCEMENT] Refresh deduplicatedSelected so
  // that both the skill-floor pass and the advanced-skill enforcement pass
  // above (which mutate `selected` via addExercise) actually propagate to
  // the architecture-slot enforcement below. Without this refresh, any
  // injection after the original dedupe at line ~5787 is invisible to
  // downstream logic because `deduplicatedSelected` was a new array
  // returned by `.filter()`.
  if (selected.length !== deduplicatedSelected.length) {
    const beforeCount = deduplicatedSelected.length
    deduplicatedSelected = dedupeSelectedExercises(selected)
    console.log('[SELECTED-SKILL-EXPRESSION-ENFORCEMENT] Refreshed deduplicatedSelected', {
      beforeCount,
      afterCount: deduplicatedSelected.length,
      injectedDelta: deduplicatedSelected.length - beforeCount,
    })
  }

  // [session-assembly] ISSUE C: Log warning if exercise pool is too thin
  if (deduplicatedSelected.length === 0) {
    console.warn('[session-assembly] WARNING: selectMainExercises returned 0 exercises after all fallbacks', {
      dayFocus: day.focus,
      primaryGoal,
      availableSkillsCount: availableSkills.length,
      availableStrengthCount: availableStrength.length,
      goalExercisesCount: goalExercises.length,
      maxExercises,
      constraintType: constraintType || 'none',
    })
  } else if (deduplicatedSelected.length < Math.min(3, maxExercises)) {
    console.log('[session-assembly] Note: Session has fewer exercises than typical', {
      selected: deduplicatedSelected.length,
      expected: Math.min(3, maxExercises),
      dayFocus: day.focus,
      primaryGoal,
    })
  }
  
  // ==========================================================================
  // [SESSION-ARCHITECTURE-VISIBLE-EXPRESSION] SLOT ENFORCEMENT
  // Enforce architecture contract slot counts for visible session differentiation
  // ==========================================================================
  let enforcedExercises = deduplicatedSelected
  
  if (sessionArchitectureContract && sessionArchitectureContract.templateEscaped) {
    const { slotAllocation, dayRoleEnforcement, workloadDistribution } = sessionArchitectureContract
    
    // Count current exercises by role
    const currentPrimary = deduplicatedSelected.filter(e => 
      e.selectionContext?.sessionRole === 'skill_primary' ||
      e.selectionContext?.sessionRole === 'direct_skill' ||
      e.selectionContext?.sessionRole === 'strength_primary'
    )
    const currentSecondary = deduplicatedSelected.filter(e => 
      e.selectionContext?.sessionRole === 'skill_secondary' ||
      e.selectionContext?.sessionRole === 'secondary_skill'
    )
    const currentSupport = deduplicatedSelected.filter(e => 
      e.selectionContext?.sessionRole === 'strength_support' ||
      e.selectionContext?.sessionRole === 'accessory' ||
      e.selectionContext?.sessionRole === 'support_volume'
    )
    const currentOther = deduplicatedSelected.filter(e => {
      const role = e.selectionContext?.sessionRole
      return !role || (
        role !== 'skill_primary' && role !== 'direct_skill' && role !== 'strength_primary' &&
        role !== 'skill_secondary' && role !== 'secondary_skill' &&
        role !== 'strength_support' && role !== 'accessory' && role !== 'support_volume'
      )
    })
    
    // Calculate target counts from workload distribution
    const totalSlots = slotAllocation.primaryWork + slotAllocation.secondaryWork + slotAllocation.supportWork + slotAllocation.accessoryWork
    const targetPrimaryCount = Math.max(1, Math.round((workloadDistribution.primaryPercent / 100) * Math.min(totalSlots, maxExercises)))
    const targetSecondaryCount = Math.round((workloadDistribution.secondaryPercent / 100) * Math.min(totalSlots, maxExercises))
    const targetSupportCount = Math.round((workloadDistribution.supportPercent / 100) * Math.min(totalSlots, maxExercises))
    
    // Enforce primary dominance on primary days
    const shouldEnforcePrimaryDominance = dayRoleEnforcement.mustDominatePrimary && 
      currentPrimary.length < targetPrimaryCount
    
    // Enforce secondary containment on non-mixed days
    const shouldContainSecondary = dayRoleEnforcement.secondaryContainmentLevel !== 'none' &&
      currentSecondary.length > targetSecondaryCount + 1
    
    // Build enforced exercise list
    let assembledExercises: typeof deduplicatedSelected = []
    
    // 1. Add primary exercises first (up to target)
    const primaryToAdd = currentPrimary.slice(0, Math.max(targetPrimaryCount, currentPrimary.length))
    assembledExercises.push(...primaryToAdd)
    
    // 2. Add secondary exercises (contained by target)
    const secondaryLimit = dayRoleEnforcement.secondaryContainmentLevel === 'minimal' 
      ? Math.min(1, targetSecondaryCount)
      : dayRoleEnforcement.secondaryContainmentLevel === 'moderate'
        ? Math.min(2, targetSecondaryCount)
        : targetSecondaryCount
    const secondaryToAdd = currentSecondary.slice(0, secondaryLimit)
    assembledExercises.push(...secondaryToAdd)
    
    // 3. Add support exercises (up to remaining slots)
    const remainingSlots = maxExercises - assembledExercises.length
    const supportToAdd = currentSupport.slice(0, Math.min(targetSupportCount, remainingSlots))
    assembledExercises.push(...supportToAdd)
    
    // 4. Fill remaining with other exercises
    const finalRemainingSlots = maxExercises - assembledExercises.length
    if (finalRemainingSlots > 0 && currentOther.length > 0) {
      assembledExercises.push(...currentOther.slice(0, finalRemainingSlots))
    }
    
    // Log enforcement
    console.log('[SESSION-ARCHITECTURE-VISIBLE-EXPRESSION-ENFORCEMENT]', {
      dayFocus: day.focus,
      sessionIntent: sessionArchitectureContract.sessionIntent,
      workloadDistribution,
      targetCounts: { primary: targetPrimaryCount, secondary: targetSecondaryCount, support: targetSupportCount },
      actualCountsBefore: { 
        primary: currentPrimary.length, 
        secondary: currentSecondary.length, 
        support: currentSupport.length,
        other: currentOther.length,
      },
      actualCountsAfter: {
        primary: primaryToAdd.length,
        secondary: secondaryToAdd.length,
        support: supportToAdd.length,
        total: assembledExercises.length,
      },
      enforcementApplied: {
        primaryDominanceEnforced: shouldEnforcePrimaryDominance,
        secondaryContained: shouldContainSecondary,
        secondaryContainmentLevel: dayRoleEnforcement.secondaryContainmentLevel,
      },
      verdict: assembledExercises.length >= maxExercises - 1 
        ? 'ARCHITECTURE_SLOTS_ENFORCED'
        : 'ARCHITECTURE_SLOTS_PARTIAL_ENFORCEMENT',
    })
    
    enforcedExercises = assembledExercises
  }

  // ==========================================================================
  // [PHASE-1B-FINAL-SELECTED-SKILL-COMMIT] AUTHORITATIVE FINAL-COMMIT GUARANTEE
  // ==========================================================================
  // This is the LAST authoritative session-assembly step before audit / return.
  // It exists because the architecture-slot enforcement above categorizes rows
  // into primary/secondary/support/other buckets and silently drops rows that
  // land in `currentOther` whenever primary+secondary+support targets saturate
  // maxExercises. Even with the tertiary `sessionRole` fix above, edge cases
  // remain (skills injected by upstream passes that didn't yet land in
  // selected; skill rows demoted by .slice() when secondaryLimit < count).
  //
  // CONTRACT (Phase 1B Parts A-E):
  //   A. For each materially-eligible selected skill (role !== 'deferred' in
  //      materialSkillIntent OR present in selectedSkills), confirm the final
  //      session committed at least one row representing that skill.
  //   B. Reserved-budget protection: if a selected-skill row was injected into
  //      `selected` but NOT in `enforcedExercises` (silent eviction), restore
  //      it. If the budget is full, evict the lowest-priority NON-selected row
  //      (accessory/core/support_volume; never a primary/spine; never another
  //      selected-skill row).
  //   C. Direct-before-support-before-erasure: when a skill never made it
  //      into `selected` at all, run canonical_direct (cap by progression)
  //      → canonical_support reroute → defer with reason. NEVER silently
  //      erase.
  //   D. Realism reroute: the canonical_support fallback IS the reroute. If
  //      the realism cap blocks every direct rung for this skill, the support
  //      pattern (sub-skill regressions) is what gets injected so the skill
  //      stays visible.
  //   E. Final commit visibility guarantee: the audit log below this block
  //      records exactly which obligations were satisfied / restored / newly
  //      injected / explicitly deferred for downstream materiality auditors.
  //
  // SCOPE GUARDS:
  //   - This pass NEVER touches mirror corridor / live-session shell / UI.
  //   - This pass NEVER inflates the session past maxExercises (eviction
  //     swap is 1:1).
  //   - This pass NEVER removes a primary-spine row, a row already tied to
  //     a selected skill, or a row whose primaryGoal-related transferTo
  //     marks it as the spine carrier.
  //   - This pass uses ONLY the existing canonical sources
  //     (ADVANCED_SKILL_FAMILIES + getAdvancedSkillSupport). No parallel
  //     truth, no hardcoded exercise lists.
  // ==========================================================================
  {
    const finalCommitRestoredRows: string[] = []
    // [PHASE 2B] Enriched trace: record matchQuality + specificityScore so the
    // verdict log reveals not just WHICH skill was injected, but HOW CANONICAL
    // the chosen exercise was relative to currentWorkingProgression.
    const finalCommitNewInjections: Array<{
      skill: string
      via: 'direct' | 'support'
      matchQuality?: string
      specificityScore?: number
      exerciseLevel?: string
    }> = []
    const finalCommitEvicted: Array<{ exerciseId: string; reason: string }> = []
    const finalCommitDeferred: Array<{ skill: string; reason: string }> = []

    // Helper: does enforcedExercises already represent this skill?
    const isSkillRepresented = (skill: string): boolean => {
      const skillLower = safeLower(skill)
      const skillNoUnderscore = skillLower.replace(/_/g, '')
      return enforcedExercises.some(ex => {
        const inf = ex.selectionContext?.influencingSkills?.[0]
        if (inf?.skillId === skill || safeLower(inf?.skillId || '') === skillLower) return true
        // Also accept transfer-tag-based representation (covers primary site
        // injections that may not always set influencingSkills.skillId exactly)
        if (exerciseTransfersToSkill(ex.exercise, skill)) return true
        if (safeExerciseId(ex.exercise).includes(skillNoUnderscore)) return true
        return false
      })
    }

    // Helper: pick the lowest-priority eviction victim. NEVER evicts:
    //   - selected-skill rows (would defeat the purpose)
    //   - primary-spine / strength-primary rows
    //   - rows whose transferTo already serves the primary goal (spine carrier)
    const findEvictionVictimIndex = (): number => {
      // Pass 1: prefer generic accessory / support_volume / no-role rows
      let idx = enforcedExercises.findIndex((e) => {
        const inf = e.selectionContext?.influencingSkills?.[0]
        if (inf?.influence === 'selected') return false
        const role = e.selectionContext?.sessionRole
        const isPrimary = role === 'skill_primary' || role === 'strength_primary' || role === 'direct_skill'
        if (isPrimary) return false
        if (exerciseTransfersToSkill(e.exercise, primaryGoal)) return false
        return role === 'accessory' || role === 'support_volume' || role === 'core' || !role
      })
      if (idx >= 0) return idx
      // Pass 2: any non-primary, non-selected, non-spine-carrier row
      idx = enforcedExercises.findIndex((e) => {
        const inf = e.selectionContext?.influencingSkills?.[0]
        if (inf?.influence === 'selected') return false
        const role = e.selectionContext?.sessionRole
        const isPrimary = role === 'skill_primary' || role === 'strength_primary' || role === 'direct_skill'
        if (isPrimary) return false
        if (exerciseTransfersToSkill(e.exercise, primaryGoal)) return false
        return true
      })
      return idx
    }

    // PART B: restore selected-skill rows that were silently evicted by the
    // architecture-slot enforcement above.
    const enforcedIdsBefore = new Set(enforcedExercises.map(e => e.exercise.id))
    const evictedSelectedSkillRows = selected.filter(row => {
      if (enforcedIdsBefore.has(row.exercise.id)) return false
      const inf = row.selectionContext?.influencingSkills?.[0]
      return inf?.influence === 'selected'
    })

    for (const row of evictedSelectedSkillRows) {
      const inf = row.selectionContext?.influencingSkills?.[0]!
      const skillId = inf.skillId
      // Skip if skill is already otherwise represented
      if (isSkillRepresented(skillId)) continue

      if (enforcedExercises.length < maxExercises) {
        enforcedExercises.push(row)
        finalCommitRestoredRows.push(skillId)
        continue
      }

      const victimIdx = findEvictionVictimIndex()
      if (victimIdx >= 0) {
        const victim = enforcedExercises[victimIdx]
        enforcedExercises.splice(victimIdx, 1, row)
        finalCommitRestoredRows.push(skillId)
        finalCommitEvicted.push({
          exerciseId: victim.exercise.id,
          reason: `evicted_to_restore_selected_skill_row(${skillId})`,
        })
      } else {
        finalCommitDeferred.push({
          skill: skillId,
          reason: 'restoration_blocked_no_safe_eviction_target',
        })
      }
    }

    // PARTS A + C + D: catch skills that never made it into `selected` at all.
    // Use materialSkillIntent (per-week role assignment) when available, else
    // fall back to selectedSkills (full onboarding list).
    const eligibleIntentEntries: Array<{ skill: string; role: string }> = []
    if (materialSkillIntent && materialSkillIntent.length > 0) {
      for (const e of materialSkillIntent) {
        if (e.role === 'deferred' || e.role === 'primary_spine') continue
        eligibleIntentEntries.push({ skill: e.skill, role: e.role })
      }
    } else if (selectedSkills && selectedSkills.length > 0) {
      for (const s of selectedSkills) {
        if (s === primaryGoal) continue
        eligibleIntentEntries.push({ skill: s, role: 'tertiary' })
      }
    }

    for (const entry of eligibleIntentEntries) {
      if (isSkillRepresented(entry.skill)) continue

      // PART C: canonical direct → reroute support → defer
      const { candidates: directCandidates } = buildCanonicalSkillCandidates(
        entry.skill,
        [availableSkills, availableStrength, availableAccessory],
        usedIds,
      )

      let chosen: Exercise | null = null
      let via: 'direct' | 'support' = 'direct'

      // [PHASE 2B CANONICAL SPECIFICITY LOCK] Final-commit direct pick now
      // uses proximity ranking so the rescued/restored exercise matches the
      // user's currentWorkingProgression instead of being the lowest rung
      // permitted by the realism cap. Capturing matchQuality + specificityScore
      // for the final-commit verdict log.
      let finalMatchQuality: string = 'n/a'
      let finalSpecificityScore = 0
      let finalExerciseLevel = 'none'
      if (directCandidates.length > 0) {
        const wrapped = directCandidates.map(e => ({ exercise: e }))
        const { filtered } = filterByCurrentProgression(wrapped, entry.skill)
        if (filtered.length > 0) {
          const pick = pickBestCanonicalCandidate(filtered.map(f => f.exercise), entry.skill)
          if (pick.exercise) {
            chosen = pick.exercise
            via = 'direct'
            finalMatchQuality = pick.matchQuality
            finalSpecificityScore = pick.specificityScore
            finalExerciseLevel = pick.exerciseLevel
          }
        }
      }

      // PART D: realism reroute to canonical_support, proximity-ranked.
      if (!chosen) {
        try {
          const advSupport = getAdvancedSkillSupport(entry.skill)
          if (advSupport) {
            const supportIds = new Set<string>()
            for (const s of advSupport.primary) for (const id of s.exerciseIds) supportIds.add(id)
            for (const s of advSupport.secondary) for (const id of s.exerciseIds) supportIds.add(id)
            for (const id of advSupport.trunk.exerciseIds) supportIds.add(id)
            const reroutePool = [...availableSkills, ...availableStrength, ...availableAccessory]
            const rerouteCandidatesAll = reroutePool.filter(
              e => supportIds.has(e.id) && !usedIds.has(e.id)
            )
            if (rerouteCandidatesAll.length > 0) {
              const pick = pickBestCanonicalCandidate(rerouteCandidatesAll, entry.skill)
              if (pick.exercise) {
                chosen = pick.exercise
                via = 'support'
                finalMatchQuality = pick.matchQuality
                finalSpecificityScore = pick.specificityScore
                finalExerciseLevel = pick.exerciseLevel
              }
            }
          }
        } catch {
          // canonical support lookup failed; fall through to defer
        }
      }

      if (!chosen) {
        finalCommitDeferred.push({
          skill: entry.skill,
          reason: 'no_canonical_candidate_after_realism_reroute',
        })
        continue
      }

      // Build a SelectedExercise row directly (we are past the addExercise/
      // canAddMore phase by design — this is the final commit reservation).
      // Build a well-typed ExerciseSelectionTrace using the canonical minimal-
      // trace helper, then override the Phase 1B-relevant fields. Using
      // `createMinimalTrace` (exported from engine-quality-contract.ts) keeps
      // us schema-valid across every required field (candidatePoolSummary,
      // rejectedAlternatives, equipmentDecision, loadabilityInfluence, etc.)
      // without duplicating the contract here.
      const synthesizedTrace: ExerciseSelectionTrace = {
        ...createMinimalTrace(chosen.id, chosen.name, 'main', 'final_commit_obligation'),
        sessionRole: via === 'direct' ? 'skill_secondary' : 'accessory',
        expressionMode: via === 'direct' ? 'technical_focus' : 'strength_support',
        primarySelectionReason: 'selected_skill_final_obligation' as ExerciseSelectionReason,
        influencingSkills: [{
          skillId: entry.skill,
          influence: 'selected',
          expressionMode: via === 'direct' ? 'technical' : 'support',
        }],
        doctrineSource: {
          doctrineSource: via === 'direct'
            ? `ADVANCED_SKILL_FAMILIES.${entry.skill}.directProgressions(final_commit)`
            : `getAdvancedSkillSupport.${entry.skill}(final_commit_reroute)`,
          triggeringSkill: entry.skill,
          doctrineType: via === 'direct' ? 'direct' : 'support',
        },
        confidence: 0.85,
        traceQuality: 'partial',
      }
      const newRow: SelectedExercise = {
        exercise: chosen,
        sets: chosen.defaultSets || 3,
        repsOrTime: chosen.defaultRepsOrTime || chosen.reps || chosen.time
          || (chosen.category === 'skill' ? '10-20s' : chosen.category === 'core' ? '30s' : '8-12'),
        isOverrideable: true,
        selectionReason: `[Final Skill Obligation] ${entry.skill.replace(/_/g, ' ')} (${via})`,
        selectionTrace: synthesizedTrace,
        selectionContext: {
          primarySelectionReason: 'selected_skill_final_obligation',
          sessionRole: via === 'direct' ? 'skill_secondary' : 'accessory',
          expressionMode: via === 'direct' ? 'technical_focus' : 'skill_accessory',
          influencingSkills: [{
            skillId: entry.skill,
            influence: 'selected',
            expressionMode: via === 'direct' ? 'technical' : 'support',
          }],
          doctrineSource: synthesizedTrace.doctrineSource,
        },
      }

      if (enforcedExercises.length < maxExercises) {
        enforcedExercises.push(newRow)
        usedIds.add(chosen.id)
        finalCommitNewInjections.push({
          skill: entry.skill,
          via,
          matchQuality: finalMatchQuality,
          specificityScore: finalSpecificityScore,
          exerciseLevel: finalExerciseLevel,
        })
      } else {
        const victimIdx = findEvictionVictimIndex()
        if (victimIdx >= 0) {
          const victim = enforcedExercises[victimIdx]
          enforcedExercises.splice(victimIdx, 1, newRow)
          usedIds.add(chosen.id)
          finalCommitNewInjections.push({
            skill: entry.skill,
            via,
            matchQuality: finalMatchQuality,
            specificityScore: finalSpecificityScore,
            exerciseLevel: finalExerciseLevel,
          })
          finalCommitEvicted.push({
            exerciseId: victim.exercise.id,
            reason: `evicted_to_inject_obligation(${entry.skill}/${via})`,
          })
        } else {
          finalCommitDeferred.push({
            skill: entry.skill,
            reason: 'session_budget_full_no_safe_eviction_target',
          })
        }
      }
    }

    console.log('[PHASE1B-FINAL-SELECTED-SKILL-COMMIT] Final-commit enforcement summary:', {
      dayFocus: day.focus,
      primaryGoal,
      maxExercises,
      enforcedExerciseCountBefore: enforcedIdsBefore.size,
      enforcedExerciseCountAfter: enforcedExercises.length,
      restoredEvictedRows: finalCommitRestoredRows,
      newObligationInjections: finalCommitNewInjections,
      evictedToMakeRoom: finalCommitEvicted,
      deferredWithReason: finalCommitDeferred,
      verdict:
        finalCommitRestoredRows.length === 0 &&
        finalCommitNewInjections.length === 0 &&
        finalCommitDeferred.length === 0
          ? 'ALL_SELECTED_SKILL_OBLIGATIONS_ALREADY_SATISFIED'
          : (finalCommitDeferred.length === 0
              ? 'SELECTED_SKILL_OBLIGATIONS_ENFORCED_AT_FINAL_COMMIT'
              : 'PARTIAL_OBLIGATION_ENFORCEMENT_WITH_EXPLICIT_DEFERRALS'),
    })
  }

  // ==========================================================================
  // [SESSION-ARCHITECTURE-MATERIALIZATION] AUTHORITATIVE TRACE AUDIT
  // This audit tracks whether broader skill truth actually materialized into exercises
  // ==========================================================================
  const finalExercises = enforcedExercises.sort((a, b) => b.exercise.neuralDemand - a.exercise.neuralDemand)
  
  // Classify each final exercise by its skill source
  const exerciseSkillClassification = finalExercises.map(ex => {
    const skillMatch = ex.selectionContext?.influencingSkills?.[0]
    const primarySkillFromSession = skillsForSession?.find(s => s.expressionMode === 'primary')
    const secondarySkillFromSession = skillsForSession?.find(s => s.expressionMode === 'technical')
    const supportSkillsFromSession = skillsForSession?.filter(s => s.expressionMode === 'support') || []
    
    let skillSource: 'primary_spine' | 'secondary_anchor' | 'support_rotation' | 'generic_fallback' | 'doctrine_driven' = 'generic_fallback'
    let matchedSkill: string | null = null
    
    // Check exercise transfer tags and context to classify
    const exerciseTransfers = ex.exercise.transferTo || []
    
    // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
    if (skillMatch && skillMatch.influence === 'primary') {
      skillSource = 'primary_spine'
      matchedSkill = skillMatch.skillId
    } else if (skillMatch && skillMatch.influence === 'secondary') {
      skillSource = 'secondary_anchor'
      matchedSkill = skillMatch.skillId
    } else if (primarySkillFromSession && safeSkillKey(primarySkillFromSession) && safeTransferTargets(exerciseTransfers).some(t => 
      t.includes(safeLower(primarySkillFromSession.skill).replace(/_/g, ''))
    )) {
      skillSource = 'primary_spine'
      matchedSkill = primarySkillFromSession.skill
    } else if (secondarySkillFromSession && safeSkillKey(secondarySkillFromSession) && safeTransferTargets(exerciseTransfers).some(t => 
      t.includes(safeLower(secondarySkillFromSession.skill).replace(/_/g, ''))
    )) {
      skillSource = 'secondary_anchor'
      matchedSkill = secondarySkillFromSession.skill
    } else if (supportSkillsFromSession.some(s => safeSkillKey(s) && safeTransferTargets(exerciseTransfers).some(t => 
      t.includes(safeLower(s.skill).replace(/_/g, ''))
    ))) {
      skillSource = 'support_rotation'
      matchedSkill = supportSkillsFromSession.find(s => safeSkillKey(s) && safeTransferTargets(exerciseTransfers).some(t => 
        t.includes(safeLower(s.skill).replace(/_/g, ''))
      ))?.skill || null
    } else if (ex.selectionContext?.doctrineSource) {
      skillSource = 'doctrine_driven'
    }
    
    return {
      exerciseId: ex.exercise.id,
      exerciseName: ex.exercise.name,
      skillSource,
      matchedSkill,
      transferTo: exerciseTransfers.slice(0, 3),
    }
  })
  
  // Calculate materialization metrics
  const primarySpineExercises = exerciseSkillClassification.filter(c => c.skillSource === 'primary_spine')
  const secondaryAnchorExercises = exerciseSkillClassification.filter(c => c.skillSource === 'secondary_anchor')
  const supportRotationExercises = exerciseSkillClassification.filter(c => c.skillSource === 'support_rotation')
  const doctrineDrivenExercises = exerciseSkillClassification.filter(c => c.skillSource === 'doctrine_driven')
  const genericFallbackExercises = exerciseSkillClassification.filter(c => c.skillSource === 'generic_fallback')
  
  // Calculate skill coverage
  const allocatedSkillsCount = skillsForSession?.length || 0
  const supportSkillsAllocated = skillsForSession?.filter(s => s.expressionMode === 'support').map(s => s.skill) || []
  const supportSkillsMaterialized = [...new Set([
    ...supportRotationExercises.map(c => c.matchedSkill).filter(Boolean),
    ...supportSkillsExpressed, // From AI_TRUTH_MATERIALITY injection
  ])]
  const supportSkillsDropped = supportSkillsAllocated.filter(s => !supportSkillsMaterialized.includes(s))
  
  // Determine verdict
  let materializationVerdict: 'PASS' | 'WARN' | 'FAIL' = 'PASS'
  const issues: string[] = []
  
  if (allocatedSkillsCount > 2 && supportRotationExercises.length === 0 && supportSkillsAllocated.length > 0) {
    materializationVerdict = 'WARN'
    issues.push('Support skills allocated but not materialized in exercises')
  }
  if (genericFallbackExercises.length > finalExercises.length * 0.6) {
    materializationVerdict = materializationVerdict === 'WARN' ? 'FAIL' : 'WARN'
    issues.push('Over 60% of exercises are generic fallbacks')
  }
  if (supportSkillsDropped.length > 0 && allocatedSkillsCount > 3) {
    issues.push(`Support skills dropped before final selection: ${supportSkillsDropped.join(', ')}`)
  }
  
  console.log('[SESSION-ARCHITECTURE-MATERIALIZATION-AUDIT]', {
    dayFocus: day.focus,
    primaryGoal,
    // Skill allocation truth
    allocatedSkillsCount,
    primarySkillAllocated: skillsForSession?.find(s => s.expressionMode === 'primary')?.skill || null,
    secondarySkillAllocated: skillsForSession?.find(s => s.expressionMode === 'technical')?.skill || null,
    supportSkillsAllocated,
    // Materialization results
    totalExercises: finalExercises.length,
    primarySpineExercises: primarySpineExercises.length,
    secondaryAnchorExercises: secondaryAnchorExercises.length,
    supportRotationExercises: supportRotationExercises.length,
    doctrineDrivenExercises: doctrineDrivenExercises.length,
    genericFallbackExercises: genericFallbackExercises.length,
    // Support skill tracking
    supportSkillsMaterialized,
    supportSkillsDropped,
    // [AI_TRUTH_MATERIALITY] Explicit support skill injection results
    supportSkillsExplicitlyInjected: supportSkillsExpressed,
    supportSkillsDeferredWithReasons: supportSkillsDeferred,
    // Progression enforcement
    currentWorkingProgressionsApplied: Object.keys(authoritativeProgressionMap).length,
    historicalCeilingBlocked: historicalCeilingWarnings.length,
    // Verdict
    materializationVerdict,
    issues,
    exerciseBreakdown: exerciseSkillClassification.map(c => `${c.exerciseName}[${c.skillSource}:${c.matchedSkill || 'none'}]`),
  })
  
  // [AI_SESSION_MATERIALITY_PHASE] Capture skill expression result for propagation to session metadata
  // This makes the actual skill materiality visible in the final session
  const primarySkillExpressed = skillsForSession?.find(s => s.expressionMode === 'primary')?.skill || null
  const secondarySkillExpressed = skillsForSession?.find(s => s.expressionMode === 'technical')?.skill || null
  
  captureSkillExpressionResult({
    directlyExpressedSkills: [
      ...(primarySkillExpressed ? [primarySkillExpressed] : []),
      ...(secondarySkillExpressed ? [secondarySkillExpressed] : []),
    ],
    technicalSlotSkills: tertiarySkillsExpressed,
    supportSkillsInjected: supportSkillsExpressed,
    supportSkillsDeferred: supportSkillsDeferred,
    tertiarySkillsInjected: tertiarySkillsExpressed,
    tertiarySkillsDeferred: tertiarySkillsDeferred,
    carryoverSkills: supportSkillsMaterialized.filter(s => 
      !supportSkillsExpressed.includes(s) && !tertiarySkillsExpressed.includes(s)
    ),
    progressionAuthorityUsed: Object.entries(authoritativeProgressionMap).map(([skill, prog]) => ({
      skill,
      currentWorking: prog,
      historical: currentWorkingProgressions?.[skill]?.historicalCeiling || null,
      authorityUsed: prog ? 'current_working' as const : 'none' as const,
    })),
    materialityVerdict: materializationVerdict,
    materialityIssues: issues,
  })
  
  // ==========================================================================
  // [PHASE15E-MICRO-CORRIDOR-AUDIT] Final push session summary
  // This is the first-failure-only summary for diagnostics
  // ==========================================================================
  if (isPushSession) {
    markCheckpoint('push_session_finalize')
    
    // Mark failure if zero exercises were produced
    if (finalExercises.length === 0) {
      markFirstFailure(
        'push_session_finalize',
        'selectMainExercises',
        'Zero exercises produced for push session',
        {
          goalExercises: goalExercises?.length || 0,
          availableSkills: availableSkills?.length || 0,
          availableStrength: availableStrength?.length || 0,
        },
        {
          dayFocus: day?.focus,
          primaryGoal,
          experienceLevel,
        }
      )
    }
    
    console.log('[PHASE15E-MICRO-CORRIDOR-AUDIT] Push session summary:', {
      marker: 'PUSH_SESSION_FINALIZE',
      dayFocus: day?.focus,
      primaryGoal,
      exerciseCount: finalExercises.length,
      checkpointsReached: microCorridorAudit.checkpointsReached,
      firstFailedCheckpoint: microCorridorAudit.firstFailedCheckpoint,
      firstFailedHelper: microCorridorAudit.firstFailedHelper,
      firstErrorMessage: microCorridorAudit.firstErrorMessage,
      poolsAtFailure: microCorridorAudit.poolsAtFailure,
      verdict: microCorridorAudit.firstFailedCheckpoint 
        ? 'PUSH_EXERCISE_SELECTION_FAILURE_IDENTIFIED'
        : finalExercises.length === 0
          ? 'PUSH_EXERCISE_SELECTION_PRODUCED_ZERO'
          : 'PUSH_EXERCISE_SELECTION_SUCCESS',
    })
  }
  
  return finalExercises
}

// =============================================================================
// [LIVE-EXECUTION-TRUTH] Helper to build authoritative execution truth contract
// =============================================================================

/**
 * Build the executionTruth contract for an exercise.
 * This replaces heuristic-based band/progression detection in the live workout runner.
 */
function buildExecutionTruth(
  exercise: Exercise,
  currentWorkingProgressions: Record<string, {
    currentWorkingProgression: string | null
    historicalCeiling: string | null
    truthSource: string
    isConservative: boolean
  }> | null | undefined,
  matchedSkill: string | null,
): SelectedExercise['executionTruth'] {
  // Determine skill binding
  const sourceSkill = matchedSkill || exercise.primarySkill || null
  
  // Get current working progression data if available
  const progressionData = sourceSkill && currentWorkingProgressions 
    ? currentWorkingProgressions[sourceSkill] 
    : null
  
  const currentWorkingProgression = progressionData?.currentWorkingProgression || null
  const historicalCeiling = progressionData?.historicalCeiling || null
  const usesConservativeStart = progressionData?.isConservative ?? false
  
  // Determine if this exercise is assisted or supports assistance
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const exerciseNameLower = safeExerciseName(exercise)
  const exerciseIdLower = safeExerciseId(exercise)
  
  // Check if exercise name/id contains assisted indicators
  const isAssistedExercise = 
    exerciseNameLower.includes('assisted') ||
    exerciseNameLower.includes('band') ||
    exerciseIdLower.includes('assisted') ||
    exerciseIdLower.includes('band_')
  
  // Check if this is a skill that commonly uses band assistance
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const bandSupportedSkills = ['front_lever', 'back_lever', 'planche', 'muscle_up', 'pull_up', 'dip']
  const skillSupportsBands = sourceSkill 
    ? bandSupportedSkills.some(s => safeLower(sourceSkill).includes(s))
    : bandSupportedSkills.some(s => exerciseIdLower.includes(s))
  
  // Assisted is recommended if: 
  // 1. It's explicitly an assisted exercise, OR
  // 2. Using conservative start and skill supports bands
  const assistedRecommended = isAssistedExercise || (usesConservativeStart && skillSupportsBands)
  const assistedAllowed = skillSupportsBands || isAssistedExercise
  
  // Band recommendation logic
  const bandRecommended = assistedRecommended || isAssistedExercise
  const bandSelectable = assistedAllowed || isAssistedExercise
  
  // Try to infer recommended band color from exercise notes or name
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  let recommendedBandColor: ResistanceBandColor | null = null
  const noteOrName = (exercise.notes || '') + ' ' + (exercise.name || '')
  const noteLower = safeLower(noteOrName)
  const bandColors: ResistanceBandColor[] = ['yellow', 'red', 'black', 'purple', 'green', 'blue']
  for (const color of bandColors) {
    if (noteLower.includes(color)) {
      recommendedBandColor = color
      break
    }
  }
  
  // Conservative start defaults to heavier assistance
  if (bandRecommended && !recommendedBandColor && usesConservativeStart) {
    recommendedBandColor = 'purple' // Default to heavier band for conservative starts
  }
  
  // Find fallback easier progression from progression ladders
  let fallbackEasierExerciseId: string | null = null
  let fallbackEasierExerciseName: string | null = null
  let fallbackEasierBandColor: ResistanceBandColor | null = null
  
  // Get easier progression if available
  const easierProgression = getProgressionDown(exercise.id)
  if (easierProgression) {
    fallbackEasierExerciseId = easierProgression.id
    fallbackEasierExerciseName = easierProgression.name
    
    // If easier progression is band-assisted, suggest heavier band
    // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
    if (safeExerciseName(easierProgression).includes('band') || 
        safeExerciseId(easierProgression).includes('band')) {
      fallbackEasierBandColor = recommendedBandColor 
        ? getNextHeavierBand(recommendedBandColor) 
        : 'purple'
    }
  }
  
  // Downgrade trigger thresholds
  const downgradeTrigger = skillSupportsBands || isAssistedExercise ? {
    highRpeThreshold: 9, // RPE 9+ suggests too hard
    missedTargetThreshold: 0.5, // Achieving <50% of target suggests too hard
    allowAutoAdjust: false, // Require user confirmation by default
  } : null
  
  // Build explanation note
  let explanationNote: string | null = null
  if (usesConservativeStart && historicalCeiling && currentWorkingProgression !== historicalCeiling) {
    explanationNote = `Starting conservatively below historical ceiling (${historicalCeiling}). Build quality reps before progressing.`
  } else if (bandRecommended && recommendedBandColor) {
    explanationNote = `Band assistance recommended (${recommendedBandColor}) for quality execution.`
  }
  
  return {
    sourceSkill,
    currentWorkingProgression,
    historicalCeiling,
    usesConservativeStart,
    assistedRecommended,
    assistedAllowed,
    bandRecommended,
    recommendedBandColor,
    bandSelectable,
    fallbackEasierExerciseId,
    fallbackEasierExerciseName,
    fallbackEasierBandColor,
    downgradeTrigger,
    explanationNote,
  }
}

/**
 * Get the next heavier resistance band color.
 * Order from lightest to heaviest: yellow → red → black → purple → green → blue
 */
function getNextHeavierBand(currentBand: ResistanceBandColor): ResistanceBandColor {
  const bandOrder: ResistanceBandColor[] = ['yellow', 'red', 'black', 'purple', 'green', 'blue']
  const currentIndex = bandOrder.indexOf(currentBand)
  if (currentIndex === -1 || currentIndex >= bandOrder.length - 1) {
    return 'blue' // Already heaviest or not found
  }
  return bandOrder[currentIndex + 1]
}

/**
 * TASK 6: Deduplicate selected exercises by exercise ID.
 */
// [EXERCISE-SELECTION-HARDENING] Use safe string normalization
function dedupeSelectedExercises(exercises: SelectedExercise[]): SelectedExercise[] {
  const seen = new Set<string>()
  return exercises.filter(ex => {
    const key = safeExerciseId(ex.exercise)
    if (seen.has(key)) {
      console.log('[exercise-selector] TASK 6: Removing duplicate:', ex.exercise.name)
      return false
    }
    seen.add(key)
    return true
  })
}

// =============================================================================
// SESSION RESCUE: FALLBACK EXERCISE SELECTION
// =============================================================================

/**
 * STEP B/C: Deterministic fallback when primary selection returns empty.
 * This function attempts to build a minimal valid session backbone using
 * progressively relaxed criteria while respecting equipment and day focus.
 */
export function buildFallbackSelectionForSession(
  dayFocus: DayFocus,
  primaryGoal: PrimaryGoal,
  equipment: EquipmentType[],
  sessionMinutes: number,
  experienceLevel: ExperienceLevel,
  // [SELECTED-SKILL-FALLBACK-TRUTH] Optional list of the user's full selected
  // skills (from onboarding / canonical profile). When provided, this helper
  // prioritizes direct progressions and support work for the user's actual
  // skill truth BEFORE falling through to the generic primaryGoal→focus map.
  // This closes the dilution gap where the fallback returned only generic
  // goal support rows even when the user had broader selected-skill truth
  // (e.g. back_lever, dragon_flag) that should have been the first material
  // an underbuilt-session top-up draws from. When omitted, the helper
  // behaves exactly as before (backward compatible for rescue paths that
  // don't have access to the selected-skills array).
  selectedSkills: string[] = []
): { main: SelectedExercise[]; rescuePath: string; wasRescued: boolean } {
  console.log('[session-rescue] Starting fallback resolution:', {
    dayFocus,
    primaryGoal,
    equipmentCount: equipment.length,
    sessionMinutes,
    experienceLevel,
    selectedSkillsCount: selectedSkills.length,
    selectedSkills,
  })
  
  const rescueResult: SelectedExercise[] = []
  let rescuePath = 'none'
  
  // Get all available exercises filtered by equipment
  const availableStrength = STRENGTH_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableAccessory = ACCESSORY_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableCore = CORE_EXERCISES_POOL.filter(e => hasRequiredEquipment(e, equipment))
  const availableSkills = SKILL_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  
  console.log('[session-rescue] Available exercise pools:', {
    strength: availableStrength.length,
    accessory: availableAccessory.length,
    core: availableCore.length,
    skills: availableSkills.length,
  })
  
  // ==========================================================================
  // [PHASE15E-RESCUE-CORRIDOR-INPUT-TRUTH] Normalize all rescue candidate pools
  // All rescue filtering/matching logic MUST use these normalized pools
  // This eliminates mixed raw/normalized read crashes in the rescue corridor
  // ==========================================================================
  const normRescueStrength = normalizeExercisePool(availableStrength)
  const normRescueAccessory = normalizeExercisePool(availableAccessory)
  const normRescueCore = normalizeExercisePool(availableCore)
  const normRescueSkills = normalizeExercisePool(availableSkills)
  
  // Create lookup map from raw exercise ID to normalized candidate
  const rescueNormalizedById = new Map<string, NormalizedExerciseCandidate>()
  for (const c of [...normRescueStrength, ...normRescueAccessory, ...normRescueCore, ...normRescueSkills]) {
    rescueNormalizedById.set(c.id, c)
  }
  
  // Track malformed candidates skipped during rescue
  let malformedSkippedCount = 0
  
  // Helper to get normalized candidate for a raw exercise
  const getRescueNormalized = (exercise: Exercise): NormalizedExerciseCandidate | null => {
    const id = safeLower(exercise.id)
    const norm = rescueNormalizedById.get(id)
    if (!norm) {
      malformedSkippedCount++
      return null
    }
    return norm
  }
  
  console.log('[PHASE15E-RESCUE-CORRIDOR-INPUT-TRUTH] Rescue pools normalized:', {
    normRescueStrength: normRescueStrength.length,
    normRescueAccessory: normRescueAccessory.length,
    normRescueCore: normRescueCore.length,
    normRescueSkills: normRescueSkills.length,
    totalNormalized: rescueNormalizedById.size,
  })
  
  // STEP H: Helper to convert Exercise to SelectedExercise with ALL required fields
  // This ensures rescued exercises have complete metadata for downstream mapping/validation
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const toSelectedExercise = (ex: Exercise, reason: string): SelectedExercise => {
    // Compute safe defaults based on exercise category
    const category = safeExerciseCategory(ex) || 'strength'
    let defaultSets = 3
    let defaultRepsOrTime = '8-12'
    
    // Category-specific defaults for proper prescriptions
    if (category === 'skill' || category === 'hold') {
      defaultSets = 3
      defaultRepsOrTime = ex.time || '10-20s'
    } else if (category === 'core' || category === 'compression') {
      defaultSets = 3
      defaultRepsOrTime = ex.time || ex.reps || '30s'
    } else if (category === 'mobility' || category === 'flexibility') {
      defaultSets = 2
      defaultRepsOrTime = ex.time || '30-60s'
    } else if (category === 'strength' || category === 'push' || category === 'pull') {
      defaultSets = ex.defaultSets || 3
      defaultRepsOrTime = ex.defaultRepsOrTime || ex.reps || '6-10'
    } else if (category === 'accessory') {
      defaultSets = 3
      defaultRepsOrTime = ex.defaultRepsOrTime || ex.reps || '10-15'
    }
    
    return {
      exercise: {
        ...ex,
        // Ensure all required exercise fields have safe defaults
        id: ex.id || `rescue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: ex.name || 'Unknown Exercise',
        category: ex.category || 'strength',
        movementPattern: ex.movementPattern || 'compound',
        primaryMuscles: ex.primaryMuscles || ['general'],
        equipment: ex.equipment || ['floor'],
        neuralDemand: ex.neuralDemand ?? 2,
        fatigueCost: ex.fatigueCost ?? 2,
        transferTo: ex.transferTo || [],
        defaultSets: ex.defaultSets || defaultSets,
        defaultRepsOrTime: ex.defaultRepsOrTime || defaultRepsOrTime,
      },
      sets: ex.sets || ex.defaultSets || defaultSets,
      repsOrTime: ex.reps || ex.time || ex.defaultRepsOrTime || defaultRepsOrTime,
      isOverrideable: true,
      selectionReason: `[Rescue] ${reason}`,
      selectionTrace: {
        exerciseId: ex.id,
        exerciseName: ex.name,
        reason: 'fallback_rescue' as const,
        expressionMode: 'support',
        sessionRole: 'support_heavy',
        source: { type: 'doctrine', ruleName: 'session_rescue' },
      }
    }
  }
  
  // ==========================================================================
  // [SELECTED-SKILL-FALLBACK-TRUTH] RESCUE PATH 0 (NEW, HIGHEST PRIORITY):
  // Prioritize direct progressions + support material for the user's actual
  // selected skills, pulled from the canonical ADVANCED_SKILL_FAMILIES
  // registry (single source of truth, no parallel data).
  //
  // WHY THIS PATH EXISTS: Before this path, the fallback builder's only
  // skill-awareness was the `primaryGoal` argument -- a single skill/goal
  // key. But the user's selected-skill set is a list (e.g. front_lever AS
  // primary plus back_lever + dragon_flag + planche_pushup as additional
  // selected skills). The old code returned generic pull/scapular/lat
  // support for front_lever and never surfaced a single back_lever or
  // dragon_flag direct progression, even when the underbuilt-session
  // top-up was starving for truthful selected-skill material to append.
  // That was the first dilution owner.
  //
  // This path ONLY activates when the caller passes a non-empty
  // `selectedSkills` list (the top-up repair in adaptive-program-builder
  // does). Backward compat: when the list is empty, the function still
  // falls through to the original PATH 1 immediately.
  //
  // DOCTRINE SAFETY: This path does NOT bypass eligibility -- it only
  // surfaces candidates that are already in the equipment-filtered
  // `availableSkills` / `availableStrength` / `availableAccessory` pools.
  // It respects overlap-aware doctrine by caller (the top-up repair
  // enforces the `deficit` cap and dedupes against existing session rows).
  // No hardcoded exercises -- every candidate is looked up from canonical
  // ADVANCED_SKILL_FAMILIES.directProgressions + .supportPatterns.
  // ==========================================================================
  if (selectedSkills.length > 0) {
    // ========================================================================
    // [SELECTED-SKILL-FAIRNESS-FIX] 2-PASS FAIR CANDIDATE ASSEMBLY
    //
    // CONFIRMED UPSTREAM STARVATION (the first real dilution owner):
    // The previous implementation used a SINGLE shared `alreadyCollected` set
    // across all selected skills AND a sequential outer loop over skills. This
    // meant the FIRST selected skill (typically the primary, e.g. front_lever)
    // claimed every matching exercise in one pass -- including rows that
    // would have been priority-3 direct progressions for LATER selected skills
    // (e.g. back_lever, dragon_flag). Combined with a priority-only global
    // sort and a fixed cap of 6, later selected skills frequently survived
    // with ZERO rows in the taken set even when they had valid material in
    // the equipment-filtered pool. That is why broader onboarding truth
    // never made it to the Program page.
    //
    // THE FIX (first real owner only, no parallel truth, no new builder):
    //   PASS A — collect each advanced selected skill's candidates into its
    //   OWN per-skill bucket, WITHOUT a shared dedupe set. Same canonical
    //   registry (ADVANCED_SKILL_FAMILIES), same equipment-filtered pools,
    //   same 3-tier priority scoring.
    //
    //   PASS B — fair representation round(s): iterate selectedSkills in
    //   order, take each skill's best-still-available candidate, dedupe by
    //   exercise id in the taken set only (not during collection), repeat
    //   up to a small per-skill guaranteed-representation floor.
    //
    //   PASS C — fill remaining cap from the globally pooled remainder
    //   ranked by (priority desc, original order) so that once each skill
    //   has had its fair shot, strong residual candidates still fill any
    //   unused capacity.
    //
    // INVARIANTS PRESERVED:
    //   - Equipment eligibility: unchanged (same `combinedAvailable`).
    //   - Canonical truth: same `getAdvancedSkillFamily` / same
    //     `exerciseTransfersToSkill`.
    //   - Dedupe by exercise id: still enforced in the final `taken` set.
    //   - Overall cap: still capped at 6 rows total (session budget).
    //   - Downstream deficit cap: the caller (top-up repair) still caps
    //     appended rows by `deficit`, so this cannot inflate past budget.
    //   - Not equal-hard-exposure: the per-skill floor is a candidate
    //     *opportunity*, not a dosage guarantee; final session assembly
    //     decides actual usage.
    // ========================================================================
    type SkillCandidate = {
      exercise: Exercise
      ownerSkill: string
      matchReason: string
      priority: number // 3=direct progression, 2=support pattern, 1=transferTo
    }

    const combinedAvailable = [...availableSkills, ...availableStrength, ...availableAccessory]

    // PASS A: independent per-skill buckets (no cross-skill dedupe during collection)
    const perSkillBuckets: Map<string, SkillCandidate[]> = new Map()
    const advancedSkillsInSelection: string[] = []

    for (const skill of selectedSkills) {
      const family = getAdvancedSkillFamily(skill)
      if (!family) continue
      advancedSkillsInSelection.push(skill)

      const directProgressionIds = new Set(
        (family.directProgressions || []).map(id => safeLower(id))
      )
      const supportPatterns = (family.supportPatterns || []).map(p => safeLower(p))

      const bucket: SkillCandidate[] = []
      const bucketSeen = new Set<string>() // per-skill dedupe only (intra-bucket)

      for (const ex of combinedAvailable) {
        const exIdLower = safeLower(ex.id)
        if (!exIdLower || bucketSeen.has(exIdLower)) continue

        // Priority 3: exact direct-progression id match
        if (directProgressionIds.has(exIdLower)) {
          bucket.push({
            exercise: ex,
            ownerSkill: skill,
            matchReason: `direct_progression_for_${skill}`,
            priority: 3,
          })
          bucketSeen.add(exIdLower)
          continue
        }

        // Priority 2: support pattern match
        const norm = getRescueNormalized(ex)
        if (norm && supportPatterns.length > 0) {
          const exTags = [
            safeLower(norm.movementFamily),
            safeLower(norm.movementPattern),
            ...norm.tags.map(t => safeLower(t)),
          ].filter(Boolean)
          if (supportPatterns.some(p => exTags.some(t => t.includes(p)))) {
            bucket.push({
              exercise: ex,
              ownerSkill: skill,
              matchReason: `support_pattern_for_${skill}`,
              priority: 2,
            })
            bucketSeen.add(exIdLower)
            continue
          }
        }

        // Priority 1: transferTo match
        if (exerciseTransfersToSkill(ex, skill)) {
          bucket.push({
            exercise: ex,
            ownerSkill: skill,
            matchReason: `transfers_to_${skill}`,
            priority: 1,
          })
          bucketSeen.add(exIdLower)
        }
      }

      // Priority-sort inside each bucket so PASS B can pop the best first.
      bucket.sort((a, b) => b.priority - a.priority)
      perSkillBuckets.set(skill, bucket)
    }

    const totalCandidatesCollected = Array.from(perSkillBuckets.values()).reduce(
      (n, b) => n + b.length,
      0
    )

    if (totalCandidatesCollected > 0) {
      const skillTruthCap = 6

      // Session-level dedupe — only applied while assembling `taken`.
      const takenIds = new Set<string>()
      const taken: SkillCandidate[] = []

      // PASS B: fair per-skill representation rounds.
      // Round 1: guarantee each skill with a non-empty bucket gets at least
      //   its best candidate (up to cap).
      // Round 2+: continue round-robin up to MIN_PER_SKILL_FLOOR before
      //   falling through to global priority fill.
      // Rationale: MIN_PER_SKILL_FLOOR=1 keeps the fix minimal. At 2 skills
      // with cap 6 this is 2 guaranteed + 4 priority fill. At 4 skills this
      // is 4 guaranteed + 2 priority fill. At 5+ skills, the first 5 each
      // get 1 guaranteed slot via round-robin with no over-representation.
      const MIN_PER_SKILL_FLOOR = 1

      // Work against a mutable shallow copy of each bucket so we can pop
      // best-first without mutating the original buckets (for auditability).
      const workingBuckets: Map<string, SkillCandidate[]> = new Map()
      for (const [skill, bucket] of perSkillBuckets) {
        workingBuckets.set(skill, [...bucket])
      }

      for (let round = 0; round < MIN_PER_SKILL_FLOOR && taken.length < skillTruthCap; round++) {
        for (const skill of advancedSkillsInSelection) {
          if (taken.length >= skillTruthCap) break
          const bucket = workingBuckets.get(skill)
          if (!bucket || bucket.length === 0) continue
          // Pop the best-not-yet-taken candidate from this skill's bucket.
          let picked: SkillCandidate | null = null
          while (bucket.length > 0) {
            const cand = bucket.shift()!
            const id = safeLower(cand.exercise.id)
            if (id && !takenIds.has(id)) {
              picked = cand
              break
            }
          }
          if (picked) {
            const id = safeLower(picked.exercise.id)
            if (id) takenIds.add(id)
            taken.push(picked)
          }
        }
      }

      // PASS C: global priority fill from whatever remains in all buckets.
      if (taken.length < skillTruthCap) {
        const remaining: SkillCandidate[] = []
        for (const bucket of workingBuckets.values()) {
          for (const cand of bucket) {
            const id = safeLower(cand.exercise.id)
            if (id && !takenIds.has(id)) remaining.push(cand)
          }
        }
        remaining.sort((a, b) => b.priority - a.priority)
        for (const cand of remaining) {
          if (taken.length >= skillTruthCap) break
          const id = safeLower(cand.exercise.id)
          if (!id || takenIds.has(id)) continue
          takenIds.add(id)
          taken.push(cand)
        }
      }

      rescuePath = 'selected_skill_truth'
      for (const cand of taken) {
        rescueResult.push(
          toSelectedExercise(
            cand.exercise,
            `Selected-skill material (${cand.matchReason}, priority ${cand.priority})`
          )
        )
      }

      // Auditable breakdown so callers can prove broader-skill representation.
      const skillsWithCandidates = advancedSkillsInSelection.filter(
        s => (perSkillBuckets.get(s) || []).length > 0
      )
      const skillsRepresentedInTaken = new Set(taken.map(c => c.ownerSkill))

      console.log('[SELECTED-SKILL-FAIRNESS-FIX] Skill-truth candidates surfaced (2-pass fair)', {
        selectedSkillsCount: selectedSkills.length,
        advancedSkillsInSelection,
        perSkillBucketSizes: Object.fromEntries(
          Array.from(perSkillBuckets.entries()).map(([s, b]) => [s, b.length])
        ),
        totalCandidatesCollected,
        appliedCount: taken.length,
        skillsWithCandidates,
        skillsRepresentedInTaken: Array.from(skillsRepresentedInTaken),
        skillsStarvedDespiteHavingCandidates: skillsWithCandidates.filter(
          s => !skillsRepresentedInTaken.has(s)
        ),
        appliedExercises: taken.map(c => ({
          id: c.exercise.id,
          name: c.exercise.name,
          ownerSkill: c.ownerSkill,
          priority: c.priority,
          matchReason: c.matchReason,
        })),
        verdict: 'SELECTED_SKILL_TRUTH_APPLIED_WITH_FAIRNESS',
      })
    } else {
      console.log('[SELECTED-SKILL-FAIRNESS-FIX] No skill-truth candidates matched selected skills', {
        selectedSkills,
        advancedSkillsInSelection,
        verdict: 'SELECTED_SKILL_TRUTH_NO_MATCH_FALLING_THROUGH',
      })
    }
  }

  // RESCUE PATH 1: Goal-specific support work for the day focus
  const goalFocusMap: Record<PrimaryGoal, string[]> = {
    planche: ['straight_arm', 'push', 'shoulder'],
    front_lever: ['pull', 'scapular', 'lat'],
    handstand_pushup: ['vertical_push', 'shoulder', 'push'],
    muscle_up: ['pull', 'push', 'transition'],
    back_lever: ['pull', 'straight_arm', 'scapular'],
    iron_cross: ['rings', 'straight_arm', 'shoulder'],
    v_sit: ['core', 'compression', 'hip_flexor'],
    manna: ['compression', 'shoulder', 'core'],
    human_flag: ['oblique', 'shoulder', 'lat'],
    full_rom_hspu: ['vertical_push', 'shoulder', 'mobility'],
    one_arm_pull_up: ['pull', 'grip', 'lat'],
    one_arm_push_up: ['push', 'core', 'horizontal_push'],
    pistol_squat: ['leg', 'mobility', 'balance'],
    nordic_curl: ['hamstring', 'eccentric', 'leg'],
    reverse_nordic: ['quad', 'mobility', 'leg'],
    general: ['compound', 'strength', 'core'],
    strength: ['compound', 'strength', 'core'],
    endurance: ['conditioning', 'core', 'compound'],
    skill: ['skill', 'strength', 'core'],
  }
  
  const targetTags = goalFocusMap[primaryGoal] || ['compound', 'strength', 'core']
  
  // Try to find exercises matching goal focus
  // [PHASE15E-RESCUE-CORRIDOR-INPUT-TRUTH] Use normalized candidates for goal matching
  const goalMatchingExercises = [...availableStrength, ...availableAccessory].filter(ex => {
    const norm = getRescueNormalized(ex)
    if (!norm) return false // Skip malformed candidates
    
    // Use normalized fields for matching
    const exTags = [
      norm.category,
      norm.movementFamily,
      norm.movementPattern,
      ...norm.tags
    ].filter(Boolean)
    return targetTags.some(tag => exTags.some(et => et.includes(tag)))
  })
  
  // [SELECTED-SKILL-FALLBACK-TRUTH] The candidate cap below is raised from 4
  // to 6 so that sessions at 60/75/90 minutes (which declare minExercises of
  // 5/5/6) can be satisfied by the fallback pool when the top-up repair
  // needs more than 4 unique candidates. The top-up repair itself caps its
  // appended rows by `deficit`, so this widening never inflates a session
  // past its true budget -- it only ensures the top-up has enough unique
  // material to append when the session is genuinely underbuilt. For the
  // empty-session rescue path (separate caller), more fallback candidates
  // means the rescue is less likely to emit a thin 2-exercise session.
  const FALLBACK_TARGET_CAP = 6

  if (goalMatchingExercises.length >= 2 && rescueResult.length < FALLBACK_TARGET_CAP) {
    if (rescuePath === 'none') rescuePath = 'goal_support'
    const goalSupportAdditions = goalMatchingExercises
      .filter(ex => !rescueResult.some(r => r.exercise.id === ex.id))
      .slice(0, Math.max(0, FALLBACK_TARGET_CAP - rescueResult.length))
    rescueResult.push(...goalSupportAdditions.map(ex => toSelectedExercise(ex, `Goal-aligned ${primaryGoal} support`)))
    console.log('[session-rescue-success] Found goal-matching exercises:', {
      count: rescueResult.length,
      exercises: rescueResult.map(e => e.exercise.name),
    })
  }
  
  // RESCUE PATH 2: Day focus compatible work
  // [PHASE15E-RESCUE-CORRIDOR-INPUT-TRUTH] Use normalized candidates for focus compatibility
  const safeDayFocus = dayFocus || 'mixed_upper'
  if (rescueResult.length < FALLBACK_TARGET_CAP) {
    const focusCompatible = availableStrength.filter(ex => {
      const norm = getRescueNormalized(ex)
      if (!norm) return false // Skip malformed candidates
      
      // Use normalized fields and derived flags for compatibility checks
      if (safeDayFocus.includes('push')) return norm.isPushMovement || norm.category === 'push' || norm.movementFamily.includes('push')
      if (safeDayFocus.includes('pull')) return norm.isPullMovement || norm.category === 'pull' || norm.movementFamily.includes('pull')
      if (safeDayFocus.includes('skill')) return true // Any strength work supports skill days
      if (safeDayFocus === 'support_recovery') return norm.intensity !== 'high'
      return true
    })
    
    if (focusCompatible.length >= 1) {
      if (rescuePath === 'none') rescuePath = 'focus_compatible'
      const additional = focusCompatible
        .filter(ex => !rescueResult.some(r => r.exercise.id === ex.id))
        .slice(0, Math.max(0, FALLBACK_TARGET_CAP - rescueResult.length))
      rescueResult.push(...additional.map(ex => toSelectedExercise(ex, `Focus-compatible ${safeDayFocus}`)))
    }
  }
  
  // RESCUE PATH 3: General strength/accessory fallback
  // [PHASE15E-RESCUE-CORRIDOR-INPUT-TRUTH] Use normalized candidates for carryover sorting
  if (rescueResult.length < FALLBACK_TARGET_CAP) {
    if (rescuePath === 'none') rescuePath = 'general_strength'
    const generalExercises = [...availableStrength, ...availableAccessory]
      .filter(ex => {
        const norm = getRescueNormalized(ex)
        if (!norm) return false // Skip malformed candidates
        return !rescueResult.some(r => r.exercise.id === ex.id)
      })
      .sort((a, b) => {
        const normA = getRescueNormalized(a)
        const normB = getRescueNormalized(b)
        // Use normalized carryover values with safe fallbacks
        const carryoverA = normA?.carryover ?? 0
        const carryoverB = normB?.carryover ?? 0
        return carryoverB - carryoverA
      })
      .slice(0, Math.max(0, FALLBACK_TARGET_CAP - rescueResult.length))
    
    rescueResult.push(...generalExercises.map(ex => toSelectedExercise(ex, 'General strength fallback')))
  }
  
  // RESCUE PATH 4: Core work as minimum viable session
  // [PHASE15E-RESCUE-CORRIDOR-INPUT-TRUTH] Use normalized candidates for core identification
  if (rescueResult.length < FALLBACK_TARGET_CAP && availableCore.length > 0) {
    if (rescuePath === 'none') rescuePath = 'core_minimum'
    const coreExercises = availableCore
      .filter(ex => {
        const norm = getRescueNormalized(ex)
        if (!norm) return false // Skip malformed candidates
        return !rescueResult.some(r => r.exercise.id === ex.id)
      })
      .slice(0, Math.max(0, FALLBACK_TARGET_CAP - rescueResult.length))
    
    rescueResult.push(...coreExercises.map(ex => toSelectedExercise(ex, 'Core fallback')))
  }
  
  const wasRescued = rescueResult.length > 0
  
  // ==========================================================================
  // TASK 1-F: Pre-return structural validator for fallback-built items
  // Ensure all rescued exercises have required fields for mapping/validation
  // ==========================================================================
  const validatedResult = rescueResult.filter((item, idx) => {
    const ex = item.exercise
    const hasRequiredFields = 
      ex.id && typeof ex.id === 'string' && ex.id.length > 0 &&
      ex.name && typeof ex.name === 'string' && ex.name.length > 0 &&
      ex.category && typeof ex.category === 'string' &&
      typeof item.sets === 'number' && item.sets > 0 &&
      item.repsOrTime && typeof item.repsOrTime === 'string'
    
    if (!hasRequiredFields) {
      console.warn('[session-rescue-item-repair] Malformed rescue item at index', idx, {
        hasId: !!ex.id,
        hasName: !!ex.name,
        hasCategory: !!ex.category,
        hasSets: typeof item.sets === 'number' && item.sets > 0,
        hasReps: !!item.repsOrTime,
      })
      
      // Attempt repair rather than drop
      if (!ex.id) item.exercise.id = `rescue_repaired_${Date.now()}_${idx}`
      if (!ex.name) item.exercise.name = 'Rescue Exercise'
      if (!ex.category) item.exercise.category = 'strength'
      if (typeof item.sets !== 'number' || item.sets <= 0) item.sets = 3
      if (!item.repsOrTime) item.repsOrTime = '8-12'
      
      console.log('[session-rescue-item-repaired]', {
        index: idx,
        repairedId: item.exercise.id,
        repairedName: item.exercise.name,
      })
    }
    
    return true // Keep all items after repair
  })
  
  console.log(wasRescued ? '[session-rescue-success]' : '[session-rescue-failed]', {
    dayFocus,
    primaryGoal,
    rescuePath,
    finalMainCount: validatedResult.length,
    equipmentCount: equipment.length,
    exercises: validatedResult.map(e => e.exercise.name),
  })
  
  // ==========================================================================
  // [PHASE15E-RESCUE-CORRIDOR-INPUT-TRUTH] Compact rescue corridor summary
  // This proves the rescue corridor is now using normalized truth
  // ==========================================================================
  const totalCandidatesConsidered = availableStrength.length + availableAccessory.length + availableCore.length + availableSkills.length
  console.log('[RESCUE_CORRIDOR_NORMALIZED_SUMMARY]', {
    marker: 'RESCUE_CORRIDOR_NORMALIZED_SUMMARY',
    totalCandidatesConsidered,
    rescuePath,
    rescuedCount: validatedResult.length,
    malformedSkippedCount,
    verdict: validatedResult.length > 0 
      ? 'RESCUE_SUCCESS_NORMALIZED'
      : totalCandidatesConsidered === 0
        ? 'RESCUE_NO_COMPATIBLE_CANDIDATES'
        : 'RESCUE_EMPTY_AFTER_NORMALIZATION',
  })
  
  return { main: validatedResult, rescuePath, wasRescued }
}

// =============================================================================
// INTELLIGENT WARMUP SELECTION (Using Warm-Up Engine)
// =============================================================================

function selectIntelligentWarmup(
  mainExercises: SelectedExercise[],
  primaryGoal: PrimaryGoal,
  sessionMinutes: number,
  equipment: EquipmentType[]
): SelectedExercise[] {
  // Convert session minutes to SessionLength
  const sessionLength: SessionLength = 
    sessionMinutes <= 20 ? '10-20' as SessionLength :
    sessionMinutes <= 30 ? '20-30' as SessionLength :
    sessionMinutes <= 45 ? '30-45' as SessionLength :
    sessionMinutes <= 60 ? '45-60' as SessionLength :
    '60+' as SessionLength

  // TASK 4: Detect first main skill for progression-aware warm-up
  const firstSkillProgression = detectFirstSkillProgression(mainExercises, primaryGoal)

  // Build context for warm-up engine
  const warmupContext: WarmUpGenerationContext = {
    mainExercises: mainExercises.map(e => ({
      id: e.exercise.id,
      name: e.exercise.name,
      category: e.exercise.category,
      movementPattern: e.exercise.movementPattern,
      primaryMuscles: e.exercise.primaryMuscles,
      neuralDemand: e.exercise.neuralDemand,
    })),
    primaryGoal,
    sessionLength,
    equipment,
    // TASK 4: Pass first skill progression for warm-up ramping
    firstSkillProgression,
  }

  // Generate intelligent warm-up
  const generatedWarmup = generateWarmUp(warmupContext)

  // Convert to SelectedExercise format
  const selected: SelectedExercise[] = generatedWarmup.block.exercises.map(ex => {
    // Find matching exercise in pool or create a minimal exercise object
    const poolExercise = WARMUP_EXERCISES.find(e => e.id === ex.id)
    
    const exercise: Exercise = poolExercise || {
      id: ex.id,
      name: ex.name,
      category: 'warmup',
      movementPattern: ex.targetPattern[0] || 'skill',
      primaryMuscles: ex.targetMuscles,
      equipment: ex.equipment,
      neuralDemand: 1,
      fatigueCost: 1,
      transferTo: [],
      defaultSets: 1,
      defaultRepsOrTime: ex.reps,
    }

    return {
      exercise,
      sets: 1,
      repsOrTime: ex.reps,
      note: ex.notes,
      isOverrideable: true,
      selectionReason: generatedWarmup.block.rationale,
    }
  })

  return selected
}

// =============================================================================
// TASK 4: PROGRESSION-AWARE WARM-UP HELPERS
// =============================================================================

/**
 * Detect first skill progression from main exercises for warm-up ramping
 * TASK 4: Analyzes the first skill exercise to determine appropriate warm-up ramp
 */
function detectFirstSkillProgression(
  mainExercises: SelectedExercise[],
  primaryGoal: PrimaryGoal
): WarmUpGenerationContext['firstSkillProgression'] {
  // Find the first skill exercise (highest neural demand typically)
  const firstSkill = mainExercises.find(e => 
    e.exercise.category === 'skill' || e.exercise.neuralDemand >= 4
  )
  
  if (!firstSkill) {
    // No skill exercise, derive from primary goal
    const goalSkillMap: Record<string, WarmUpGenerationContext['firstSkillProgression']> = {
      'planche': { skillType: 'planche', progressionLevel: 'unknown', isAdvanced: false },
      'front_lever': { skillType: 'front_lever', progressionLevel: 'unknown', isAdvanced: false },
      'handstand_pushup': { skillType: 'hspu', progressionLevel: 'unknown', isAdvanced: false },
      'muscle_up': { skillType: 'muscle_up', progressionLevel: 'unknown', isAdvanced: false },
    }
    return goalSkillMap[primaryGoal] || undefined
  }
  
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const exerciseName = safeExerciseName(firstSkill.exercise)
  const exerciseId = safeExerciseId(firstSkill.exercise)
  
  // Detect skill type
  let skillType: 'planche' | 'front_lever' | 'hspu' | 'muscle_up' | 'handstand' | 'back_lever' | 'l_sit' | 'v_sit' | 'other' = 'other'
  
  if (exerciseName.includes('planche') || exerciseId.includes('planche')) {
    skillType = 'planche'
  } else if (exerciseName.includes('front lever') || exerciseId.includes('front_lever') || exerciseId.includes('fl_')) {
    skillType = 'front_lever'
  } else if (exerciseName.includes('hspu') || exerciseName.includes('handstand push') || exerciseId.includes('hspu')) {
    skillType = 'hspu'
  } else if (exerciseName.includes('muscle up') || exerciseId.includes('muscle_up')) {
    skillType = 'muscle_up'
  } else if (exerciseName.includes('handstand') || exerciseId.includes('handstand')) {
    skillType = 'handstand'
  } else if (exerciseName.includes('back lever') || exerciseId.includes('back_lever') || exerciseId.includes('bl_')) {
    skillType = 'back_lever'
  } else if (exerciseName.includes('l-sit') || exerciseName.includes('l sit') || exerciseId.includes('l_sit')) {
    skillType = 'l_sit'
  } else if (exerciseName.includes('v-sit') || exerciseName.includes('v sit') || exerciseId.includes('v_sit')) {
    skillType = 'v_sit'
  }
  
  // Detect if advanced progression
  const isAdvanced = 
    exerciseName.includes('straddle') ||
    exerciseName.includes('full') ||
    exerciseName.includes('one leg') ||
    exerciseName.includes('half lay') ||
    exerciseName.includes('advanced') ||
    (exerciseName.includes('tuck') && !exerciseName.includes('advanced tuck')) === false
  
  return {
    skillType,
    progressionLevel: exerciseName,
    isAdvanced,
  }
}

// Legacy warmup function (kept for backward compatibility)
function selectWarmupLegacy(
  emphasis: 'push' | 'pull' | 'mixed',
  equipment: EquipmentType[],
  minutes: number
): SelectedExercise[] {
  const available = WARMUP_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const selected: SelectedExercise[] = []
  
  // Always include wrist prep
  const wristWork = available.find(e => e.id === 'wrist_circles')
  if (wristWork) {
    selected.push({
      exercise: wristWork,
      sets: 1,
      repsOrTime: '10 each direction',
      isOverrideable: true,
      selectionReason: 'Wrist preparation',
    })
  }
  
  // Arm circles / general mobility
  const armCircles = available.find(e => e.id === 'arm_circles')
  if (armCircles) {
    selected.push({
      exercise: armCircles,
      sets: 1,
      repsOrTime: '10 each direction',
      isOverrideable: true,
      selectionReason: 'Shoulder mobility',
    })
  }
  
  // Movement-specific prep
  if (emphasis === 'pull' || emphasis === 'mixed') {
    const deadHang = available.find(e => e.id === 'dead_hang')
    const activeHang = available.find(e => e.id === 'active_hang')
    if (deadHang && minutes >= 7) {
      selected.push({
        exercise: deadHang,
        sets: 1,
        repsOrTime: '30s',
        isOverrideable: true,
        selectionReason: 'Grip and lat activation',
      })
    }
    if (activeHang && minutes >= 10) {
      selected.push({
        exercise: activeHang,
        sets: 2,
        repsOrTime: '15s',
        isOverrideable: true,
        selectionReason: 'Scap activation',
      })
    }
  }
  
  if (emphasis === 'push' || emphasis === 'mixed') {
    const scapPush = available.find(e => e.id === 'scap_pushup_warmup')
    if (scapPush && minutes >= 7) {
      selected.push({
        exercise: scapPush,
        sets: 2,
        repsOrTime: '10',
        isOverrideable: true,
        selectionReason: 'Serratus activation',
      })
    }
    
    const bandPull = available.find(e => e.id === 'band_pull_apart')
    if (bandPull && equipment.includes('bands') && minutes >= 10) {
      selected.push({
        exercise: bandPull,
        sets: 2,
        repsOrTime: '15',
        isOverrideable: true,
        selectionReason: 'Shoulder health prep',
      })
    }
  }
  
  return selected
}

// =============================================================================
// INTELLIGENT COOLDOWN SELECTION (Using Cool-Down Engine)
// =============================================================================

function selectIntelligentCooldown(
  mainExercises: SelectedExercise[],
  primaryGoal: PrimaryGoal,
  sessionMinutes: number,
  equipment: EquipmentType[],
  flexibilityGoals?: FlexibilityPathway[]
): SelectedExercise[] {
  // Convert session minutes to SessionLength
  const sessionLength: SessionLength = 
    sessionMinutes <= 20 ? '10-20' as SessionLength :
    sessionMinutes <= 30 ? '20-30' as SessionLength :
    sessionMinutes <= 45 ? '30-45' as SessionLength :
    sessionMinutes <= 60 ? '45-60' as SessionLength :
    '60+' as SessionLength

  // Build context for cool-down engine
  const cooldownContext: CoolDownGenerationContext = {
    mainExercises: mainExercises.map(e => ({
      id: e.exercise.id,
      name: e.exercise.name,
      category: e.exercise.category,
      movementPattern: e.exercise.movementPattern,
      primaryMuscles: e.exercise.primaryMuscles,
      neuralDemand: e.exercise.neuralDemand,
    })),
    primaryGoal,
    sessionLength,
    equipment,
    flexibilityGoals,
  }

  // Generate intelligent cool-down
  const generatedCooldown = generateCoolDown(cooldownContext)

  // Convert to SelectedExercise format
  const selected: SelectedExercise[] = []

  // Add cool-down exercises
  generatedCooldown.block.exercises.forEach(ex => {
    // Find matching exercise in pool or create a minimal exercise object
    const poolExercise = COOLDOWN_EXERCISES.find(e => e.id === ex.id)
    
    const exercise: Exercise = poolExercise || {
      id: ex.id,
      name: ex.name,
      category: 'cooldown',
      movementPattern: ex.targetPattern[0] || 'skill',
      primaryMuscles: ex.targetMuscles,
      equipment: ex.equipment,
      neuralDemand: 1,
      fatigueCost: 1,
      transferTo: [],
      defaultSets: 1,
      defaultRepsOrTime: ex.duration,
    }

    selected.push({
      exercise,
      sets: 1,
      repsOrTime: ex.duration,
      note: ex.notes,
      isOverrideable: true,
      selectionReason: generatedCooldown.block.rationale,
    })
  })

  // Add flexibility exercises if included
  if (generatedCooldown.flexibilityBlock) {
    generatedCooldown.flexibilityBlock.exercises.forEach(ex => {
      const poolExercise = COOLDOWN_EXERCISES.find(e => e.id === ex.id)
      
      const exercise: Exercise = poolExercise || {
        id: ex.id,
        name: ex.name,
        category: 'cooldown',
        movementPattern: ex.targetPattern[0] || 'compression',
        primaryMuscles: ex.targetMuscles,
        equipment: ex.equipment,
        neuralDemand: 1,
        fatigueCost: 1,
        transferTo: [],
        defaultSets: 1,
        defaultRepsOrTime: ex.duration,
      }

      selected.push({
        exercise,
        sets: 1,
        repsOrTime: ex.duration,
        note: ex.notes,
        isOverrideable: true,
        selectionReason: generatedCooldown.flexibilityBlock?.rationale || 'Flexibility exposure',
      })
    })
  }

  return selected
}

function selectCooldownLegacy(minutes: number): SelectedExercise[] {
  var selected: SelectedExercise[] = [];
  var shoulderStretch = COOLDOWN_EXERCISES.find(function(e) { return e.id === 'shoulder_stretch'; });
  if (shoulderStretch) {
    selected.push({
      exercise: shoulderStretch,
      sets: 1,
      repsOrTime: '30s each',
      isOverrideable: true,
      selectionReason: 'Shoulder recovery',
    });
  }
  if (minutes >= 5) {
    var wristStretch = COOLDOWN_EXERCISES.find(function(e) { return e.id === 'wrist_stretches'; });
    if (wristStretch) {
      selected.push({
        exercise: wristStretch,
        sets: 1,
        repsOrTime: '30s each position',
        isOverrideable: true,
        selectionReason: 'Wrist care for calisthenics',
      });
    }
  }
  if (minutes >= 8) {
    var latStretch = COOLDOWN_EXERCISES.find(function(e) { return e.id === 'lat_stretch'; });
    if (latStretch) {
      selected.push({
        exercise: latStretch,
        sets: 1,
        repsOrTime: '30s each',
        isOverrideable: true,
        selectionReason: 'Lat recovery',
      });
    }
    var chestStretch = COOLDOWN_EXERCISES.find(function(e) { return e.id === 'chest_stretch'; });
    if (chestStretch) {
      selected.push({
        exercise: chestStretch,
        sets: 1,
        repsOrTime: '30s each',
        isOverrideable: true,
        selectionReason: 'Chest/front delt recovery',
      });
    }
  }
  return selected;
}

// =============================================================================
// [PHASE 9] PROGRESSION-AWARE EXERCISE SELECTION
// Current ability MUST outrank historical/identity level for exercise selection
// =============================================================================

/**
 * Maps canonical progression values to max allowed difficulty levels
 * This ensures exercises match CURRENT ability, not historical/identity level
 */
const PROGRESSION_TO_MAX_DIFFICULTY: Record<string, DifficultyLevel[]> = {
  // Planche progressions - current ability determines ceiling
  'none': ['beginner'],
  'lean': ['beginner', 'intermediate'],
  'tuck': ['beginner', 'intermediate'],
  'tuck_planche': ['beginner', 'intermediate'],
  'advanced_tuck': ['beginner', 'intermediate', 'advanced'],
  'adv_tuck_planche': ['beginner', 'intermediate', 'advanced'],
  'straddle': ['beginner', 'intermediate', 'advanced', 'elite'],
  'straddle_planche': ['beginner', 'intermediate', 'advanced', 'elite'],
  'half_lay': ['beginner', 'intermediate', 'advanced', 'elite'],
  'full': ['beginner', 'intermediate', 'advanced', 'elite'],
  'full_planche': ['beginner', 'intermediate', 'advanced', 'elite'],
  
  // Front lever progressions
  'tuck_fl': ['beginner', 'intermediate'],
  'tuck_front_lever': ['beginner', 'intermediate'],
  'advanced_tuck_fl': ['beginner', 'intermediate', 'advanced'],
  'adv_tuck_fl': ['beginner', 'intermediate', 'advanced'],
  'straddle_fl': ['beginner', 'intermediate', 'advanced', 'elite'],
  'straddle_front_lever': ['beginner', 'intermediate', 'advanced', 'elite'],
  'half_lay_fl': ['beginner', 'intermediate', 'advanced', 'elite'],
  'full_front_lever': ['beginner', 'intermediate', 'advanced', 'elite'],
}

/**
 * Filter exercises to only those appropriate for the current progression level
 * [PHASE 9] Current ability beats historical/identity level
 */
function filterByCurrentProgression(
  exercises: Exercise[],
  currentProgression: string | null | undefined,
  skillId: string
): Exercise[] {
  if (!currentProgression || currentProgression === 'unknown') {
    // No current progression data - fall back to intermediate max
    console.log('[phase9-progression-filter] No current progression, using intermediate max', { skillId })
    return exercises.filter(e => 
      e.difficultyLevel === 'beginner' || e.difficultyLevel === 'intermediate'
    )
  }
  
  // [EXERCISE-SELECTION-RUNTIME-STABILIZATION] Use safe string normalization
  const allowedDifficulties = PROGRESSION_TO_MAX_DIFFICULTY[safeLower(currentProgression)] || 
    ['beginner', 'intermediate'] // Conservative default
  
  const filtered = exercises.filter(e => allowedDifficulties.includes(e.difficultyLevel))
  
  console.log('[phase9-progression-filter]', {
    skillId,
    currentProgression,
    allowedDifficulties,
    totalCandidates: exercises.length,
    filteredCandidates: filtered.length,
    filteredOut: exercises.filter(e => !allowedDifficulties.includes(e.difficultyLevel)).map(e => e.id),
  })
  
  // If filtering removed all options, allow at least intermediate
  if (filtered.length === 0) {
    console.log('[phase9-progression-filter] Filter too aggressive, allowing intermediate', { skillId })
    return exercises.filter(e => 
      e.difficultyLevel === 'beginner' || e.difficultyLevel === 'intermediate'
    )
  }
  
  return filtered
}

/**
 * [PHASE 9] Select exercise by CURRENT progression level, not broad experience
 * Current ability outranks historical training age / experience level
 */
function selectByLevel(exercises: Exercise[], level: ExperienceLevel, currentProgression?: string | null): Exercise | undefined {
  // [PHASE 9] If we have current progression, filter first by current ability
  let filteredExercises = exercises
  if (currentProgression && currentProgression !== 'unknown' && currentProgression !== 'none') {
    // Determine skill from exercise pool
    const skillIds = exercises.flatMap(e => e.transferTo || [])
    const primarySkill = skillIds[0] || 'unknown'
    filteredExercises = filterByCurrentProgression(exercises, currentProgression, primarySkill)
  }
  
  // Sort by neural demand (lower = easier)
  const sorted = filteredExercises.slice().sort((a, b) => a.neuralDemand - b.neuralDemand)
  
  // [PHASE 9] Experience level now affects WHICH exercise within the filtered pool
  // Not which tier of exercise is allowed - that's determined by current progression
  if (level === 'beginner') {
    return sorted[0]
  }
  if (level === 'intermediate') {
    return sorted[Math.floor(sorted.length / 2)]
  }
  // Advanced users get highest within their current progression tier
  return sorted[sorted.length - 1]
}

function adjustSetsForLevel(defaultSets: number, level: ExperienceLevel): number {
  if (level === 'beginner') {
    return Math.max(2, defaultSets - 1);
  }
  if (level === 'advanced') {
    return Math.min(5, defaultSets + 1);
  }
  return defaultSets;
}

function adjustRepsForLevel(defaultReps: string, level: ExperienceLevel): string {
  return defaultReps;
}

export function getPrescriptionAwarePrescription(
  exercise: Exercise,
  experienceLevel: ExperienceLevel,
  primaryGoal: string,
  currentProgression?: string,
  fatigueState?: 'fresh' | 'moderate' | 'fatigued',
  recentPerformance?: { avgRPE?: number; completionRate?: number; improving?: boolean }
): { sets: number; repsOrTime: string; note?: string; prescriptionMode: PrescriptionMode; supportsWeightedLoad?: boolean } {
  // Detect prescription mode
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const isWeighted = safeExerciseId(exercise).includes('weighted') || safeExerciseName(exercise).includes('weighted');
  const prescriptionMode = detectPrescriptionMode(
    exercise.category,
    exercise.isIsometric ?? false,
    exercise.neuralDemand,
    exercise.fatigueCost,
    isWeighted,
    exercise.id
  )
  
  // Build athlete context
  const athleteContext: PrescriptionAthleteContext = {
    experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced' | 'elite',
    currentProgression,
    recentPerformance,
    fatigueState,
  }
  
  // For skill work, use advanced skill prescription rules (TASK 2)
  if (prescriptionMode === 'skill_hold' || prescriptionMode === 'skill_cluster') {
    const skillRules = getSkillPrescriptionRules(
      primaryGoal,
      experienceLevel as 'beginner' | 'intermediate' | 'advanced' | 'elite',
      currentProgression
    )
    
    // Calculate sets in recommended range
    const [minSets, maxSets] = skillRules.setsRange
    let sets = Math.round((minSets + maxSets) / 2)
    if (experienceLevel === 'beginner') sets = minSets
    if (experienceLevel === 'advanced') sets = maxSets
    if (fatigueState === 'fatigued') sets = Math.max(minSets, sets - 1)
    
    // Calculate hold time in recommended range
    const [minHold, maxHold] = skillRules.holdSecondsRange
    let holdSeconds = Math.round((minHold + maxHold) / 2)
    if (experienceLevel === 'beginner') holdSeconds = minHold
    if (experienceLevel === 'advanced') holdSeconds = maxHold
    
    // Build coaching note from rules
    const note = skillRules.intensityNotes[0] || 'Quality over quantity'
    
    return {
      sets,
      repsOrTime: `${holdSeconds}s hold`,
      note,
      prescriptionMode,
    }
  }
  
  // For weighted strength, use carryover-aware prescription (TASK 3)
  // WEIGHTED LOAD PR: Now includes actual prescribed load
  if (prescriptionMode === 'weighted_strength') {
    const prescription = resolvePrescription(prescriptionMode, athleteContext)
    const formatted = formatPrescription(prescription)
    
    // Determine the weighted exercise type
    const exerciseType: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | 'weighted_row' | null = 
      exercise.id.includes('weighted_pull') ? 'weighted_pull_up' :
      exercise.id.includes('weighted_dip') ? 'weighted_dip' :
      exercise.id.includes('weighted_push') ? 'weighted_push_up' :
      exercise.id.includes('weighted_row') ? 'weighted_row' : null
    
    // If this is a recognized weighted exercise, calculate load
    // Note: This function doesn't have direct access to benchmarks - that happens at session assembly level
    // The prescribedLoad field will be populated by getWeightedStrengthPrescriptionForSkill when called with benchmarks
    
    return {
      sets: formatted.sets,
      repsOrTime: formatted.repsOrTime,
      note: formatted.note,
      prescriptionMode,
      // Signal that this exercise supports weighted load prescription
      supportsWeightedLoad: exerciseType !== null,
    }
  }
  
  // For other modes, use base prescription contract
  const prescription = resolvePrescription(prescriptionMode, athleteContext)
  const formatted = formatPrescription(prescription)
  
  return {
    sets: formatted.sets,
    repsOrTime: formatted.repsOrTime,
    note: formatted.note,
    prescriptionMode,
  }
}

/**
 * Adjust weighted strength prescription for skill carryover (TASK 3).
 * 
 * WEIGHTED LOAD PR UPDATE: Now includes actual prescribed load based on benchmarks.
 */
export function getWeightedStrengthPrescriptionForSkill(
  exercise: Exercise,
  primarySkill: string,
  experienceLevel: ExperienceLevel,
  currentWeightedPull?: { load: number; reps: number; unit?: 'lbs' | 'kg' },
  currentWeightedDip?: { load: number; reps: number; unit?: 'lbs' | 'kg' },
  prWeightedPull?: { load: number; reps: number; unit?: 'lbs' | 'kg' },
  prWeightedDip?: { load: number; reps: number; unit?: 'lbs' | 'kg' }
): { 
  sets: number
  repsOrTime: string
  note: string
  prescribedLoad?: SelectedExercise['prescribedLoad']
} | null {
  // Get carryover recommendations
  const carryovers = getWeightedStrengthCarryover(
    primarySkill,
    currentWeightedPull,
    currentWeightedDip,
    prWeightedPull,
    prWeightedDip
  )
  
  // Find matching carryover for this exercise
  const exerciseType: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | 'weighted_row' | null = 
    exercise.id.includes('weighted_pull') ? 'weighted_pull_up' :
    exercise.id.includes('weighted_dip') ? 'weighted_dip' :
    exercise.id.includes('weighted_push') ? 'weighted_push_up' :
    exercise.id.includes('weighted_row') ? 'weighted_row' : null
  
  if (!exerciseType) return null
  
  const carryover = carryovers.find(c => c.exercise === exerciseType)
  if (!carryover || !carryover.shouldInclude) return null
  
  const adj = carryover.prescriptionAdjustments
  const baseSets = experienceLevel === 'beginner' ? 3 : 4
  
  // WEIGHTED LOAD PR: Calculate actual prescribed load
  const currentBenchmark: WeightedBenchmark | null = 
    exerciseType === 'weighted_pull_up' && currentWeightedPull 
      ? { addedWeight: currentWeightedPull.load, reps: currentWeightedPull.reps, unit: currentWeightedPull.unit } 
      : exerciseType === 'weighted_dip' && currentWeightedDip
        ? { addedWeight: currentWeightedDip.load, reps: currentWeightedDip.reps, unit: currentWeightedDip.unit }
        : null
  
  const prBenchmark: WeightedPRBenchmark | null =
    exerciseType === 'weighted_pull_up' && prWeightedPull
      ? { load: prWeightedPull.load, reps: prWeightedPull.reps, unit: prWeightedPull.unit || 'lbs' }
      : exerciseType === 'weighted_dip' && prWeightedDip
        ? { load: prWeightedDip.load, reps: prWeightedDip.reps, unit: prWeightedDip.unit || 'lbs' }
        : null
  
  // Determine prescription mode based on rep range target
  const avgTargetReps = Math.round((adj.repsRange[0] + adj.repsRange[1]) / 2)
  const prescriptionMode: WeightedPrescriptionMode = 
    avgTargetReps <= 5 ? 'strength_primary' :
    avgTargetReps <= 6 ? 'strength_support' :
    avgTargetReps <= 10 ? 'volume_support' : 'hypertrophy'
  
  // Estimate the actual load to use
  const loadPrescription = estimateWeightedLoadPrescription(
    exerciseType,
    prescriptionMode,
    currentBenchmark,
    prBenchmark
  )
  
  // Log the estimation in dev mode
  logWeightedLoadEstimation(exerciseType, prescriptionMode, loadPrescription)
  
  // Build the note with load info if available
  let note = `RPE ${adj.intensityTarget}. ${carryover.carryoverRationale.split('.')[0]}.`
  if (loadPrescription.loadBasis !== 'no_data' && loadPrescription.prescribedLoad > 0) {
    const loadDisplay = formatWeightedLoadDisplay(loadPrescription)
    note = `${loadDisplay} @ RPE ${adj.intensityTarget}. ${carryover.carryoverRationale.split('.')[0]}.`
  }
  
  return {
    sets: baseSets + adj.setsModifier,
    repsOrTime: `${adj.repsRange[0]}-${adj.repsRange[1]} reps`,
    note,
    prescribedLoad: loadPrescription.loadBasis !== 'no_data' ? {
      load: loadPrescription.prescribedLoad,
      unit: loadPrescription.loadUnit,
      basis: loadPrescription.loadBasis,
      confidenceLevel: loadPrescription.confidenceLevel,
      estimated1RM: loadPrescription.estimated1RM ?? undefined,
      targetReps: loadPrescription.targetReps,
      intensityBand: loadPrescription.intensityBand,
      notes: loadPrescription.notes.length > 0 ? loadPrescription.notes : undefined,
    } : undefined,
  }
}

/**
 * Envelope-aware set adjustment
 * Uses performance envelope data to personalize set count
 */
function adjustSetsWithEnvelope(
  defaultSets: number, 
  level: ExperienceLevel,
  envelope: PerformanceEnvelope | undefined,
  movementFamily: MovementFamily | undefined
): number {
  // Start with level-based adjustment
  let sets = adjustSetsForLevel(defaultSets, level)
  
  // If no envelope or low confidence, use default
  if (!envelope || envelope.confidenceScore < 0.3) {
    return sets
  }
  
  // Check if this envelope matches the movement family
  if (movementFamily && envelope.movementFamily !== movementFamily) {
    return sets
  }
  
  // High confidence envelope - use learned preferences
  if (envelope.confidenceScore >= 0.5) {
    // Use the envelope's preferred set range
    const envelopeMin = envelope.preferredSetRangeMin
    const envelopeMax = envelope.preferredSetRangeMax
    
    // Clamp to envelope range, respecting reasonable bounds
    sets = Math.max(envelopeMin, Math.min(envelopeMax, sets))
  }
  
  // Moderate confidence - blend toward envelope preference
  else if (envelope.confidenceScore >= 0.3) {
    const envelopeMidpoint = (envelope.preferredSetRangeMin + envelope.preferredSetRangeMax) / 2
    // Blend 40% toward envelope preference
    sets = Math.round(sets * 0.6 + envelopeMidpoint * 0.4)
  }
  
  return Math.max(2, Math.min(6, sets))
}

/**
 * Envelope-aware rep adjustment
 * Uses performance envelope data to personalize rep ranges
 */
function adjustRepsWithEnvelope(
  defaultReps: string, 
  level: ExperienceLevel,
  envelope: PerformanceEnvelope | undefined,
  movementFamily: MovementFamily | undefined,
  goalType: 'strength' | 'skill' | 'hypertrophy' | 'endurance' = 'strength'
): string {
  // If no envelope or low confidence, use default
  if (!envelope || envelope.confidenceScore < 0.3) {
    return adjustRepsForLevel(defaultReps, level)
  }
  
  // Check if this envelope matches the movement family and goal
  if (movementFamily && envelope.movementFamily !== movementFamily) {
    return adjustRepsForLevel(defaultReps, level)
  }
  if (envelope.goalType !== goalType) {
    return adjustRepsForLevel(defaultReps, level)
  }
  
  // High confidence envelope - use learned rep range
  if (envelope.confidenceScore >= 0.5) {
    const repMin = envelope.preferredRepRangeMin
    const repMax = envelope.preferredRepRangeMax
    
    // Return envelope-based rep range
    return `${repMin}-${repMax}`
  }
  
  // Moderate confidence - keep original but note envelope suggestion
  return adjustRepsForLevel(defaultReps, level)
}

/**
 * Find matching envelope for a movement pattern
 */
function findEnvelopeForMovement(
  envelopes: PerformanceEnvelope[] | undefined,
  movementPattern: string | undefined,
  goalType: 'strength' | 'skill' | 'hypertrophy' | 'endurance' = 'strength'
): PerformanceEnvelope | undefined {
  if (!envelopes || !movementPattern) return undefined
  
  // Map movement pattern to movement family
  const patternToFamily: Record<string, MovementFamily> = {
    'vertical_pull': 'vertical_pull',
    'horizontal_pull': 'horizontal_pull',
    'vertical_push': 'vertical_push',
    'horizontal_push': 'horizontal_push',
    'straight_arm_pull': 'straight_arm_pull',
    'straight_arm_push': 'straight_arm_push',
    'core': 'compression_core',
    'hip_hinge': 'hip_hinge',
    'squat': 'squat',
  }
  
  const family = patternToFamily[movementPattern]
  if (!family) return undefined
  
  // Find envelope matching family and goal type
  return envelopes.find(e => 
    e.movementFamily === family && 
    e.goalType === goalType &&
    e.confidenceScore >= 0.3
  )
}

function getConstraintTargetedExercise(
  constraintType: string,
  strength: Exercise[],
  accessory: Exercise[],
  usedIds: Set<string>
): Exercise | undefined {
  const all = [...strength, ...accessory].filter(e => !usedIds.has(e.id))
  
  if (constraintType.includes('pull') || constraintType.includes('horizontal')) {
    return all.find(e => e.movementPattern === 'horizontal_pull') ||
           all.find(e => e.movementPattern === 'vertical_pull')
  }
  
  if (constraintType.includes('push')) {
    return all.find(e => e.movementPattern === 'horizontal_push') ||
           all.find(e => e.movementPattern === 'vertical_push')
  }
  
  return undefined
}

function calculateTotalTime(
  warmup: SelectedExercise[],
  main: SelectedExercise[],
  cooldown: SelectedExercise[]
): number {
  // Rough estimate: warmup ~5-10 min, main ~3-5 min per exercise, cooldown ~5 min
  const warmupTime = warmup.length * 2
  const mainTime = main.reduce((sum, e) => {
    // Skill work takes longer (rest between attempts)
    if (e.exercise.category === 'skill') return sum + 6
    // Strength work
    if (e.exercise.category === 'strength') return sum + 5
    // Accessory/core
    return sum + 4
  }, 0)
  const cooldownTime = cooldown.length * 1.5
  
  return Math.round(warmupTime + mainTime + cooldownTime)
}

// =============================================================================
// PROGRESSION-AWARE EXERCISE ADAPTATION
// =============================================================================

/**
 * Adapt an exercise based on athlete level and fatigue
 * Returns the adapted exercise or the original if no adaptation needed
 */
export function adaptExerciseForAthlete(
  exercise: Exercise,
  athleteLevel: DifficultyLevel = 'intermediate',
  fatigueLevel: 'low' | 'moderate' | 'high' = 'moderate',
  equipment: EquipmentType[]
): { exercise: Exercise; wasAdapted: boolean; adaptationReason?: string } {
  const allExercises = getAllExercises()
  
  // Get the adapted exercise ID
  const adaptedId = getAdaptedExercise(exercise.id, athleteLevel, fatigueLevel)
  
  // If no change, return original
  if (adaptedId === exercise.id) {
    return { exercise, wasAdapted: false }
  }
  
  // Find the adapted exercise
  const adaptedExercise = allExercises.find(e => e.id === adaptedId)
  
  // Verify equipment is available
  if (adaptedExercise && hasRequiredEquipment(adaptedExercise, equipment)) {
    const reason = fatigueLevel === 'high' 
      ? 'Regressed due to high fatigue'
      : adaptedId === getProgressionUp(exercise.id)
        ? 'Progressed based on athlete level'
        : 'Adjusted for athlete level'
    
    return { 
      exercise: adaptedExercise, 
      wasAdapted: true,
      adaptationReason: reason
    }
  }
  
  return { exercise, wasAdapted: false }
}

/**
 * Get a substitute exercise when the primary cannot be performed
 */
export function getSubstituteExercise(
  exercise: Exercise,
  reason: 'fatigue' | 'equipment' | 'difficulty',
  equipment: EquipmentType[],
  usedIds: Set<string>
): { exercise: Exercise; reason: string } | null {
  const allExercises = getAllExercises()
  
  // Determine preferred fatigue adjustment based on reason
  const preferredFatigue = reason === 'fatigue' ? 'easier' : 'similar'
  
  // First try substitution mapping
  const substitute = getBestSubstitute(exercise.id, preferredFatigue)
  if (substitute) {
    const subExercise = allExercises.find(e => e.id === substitute.exerciseId)
    if (subExercise && 
        hasRequiredEquipment(subExercise, equipment) && 
        !usedIds.has(subExercise.id)) {
      return { 
        exercise: subExercise, 
        reason: substitute.reason 
      }
    }
  }
  
  // Try progression regression
  if (reason === 'difficulty' || reason === 'fatigue') {
    const regression = getProgressionDown(exercise.id)
    if (regression) {
      const regExercise = allExercises.find(e => e.id === regression)
      if (regExercise && 
          hasRequiredEquipment(regExercise, equipment) && 
          !usedIds.has(regExercise.id)) {
        return { 
          exercise: regExercise, 
          reason: 'Ladder regression' 
        }
      }
    }
  }
  
  // Fall back to same movement pattern
  const patternMatch = allExercises.find(e => 
    e.movementPattern === exercise.movementPattern &&
    e.id !== exercise.id &&
    hasRequiredEquipment(e, equipment) &&
    !usedIds.has(e.id) &&
    (e.fatigueCost || 3) <= (exercise.fatigueCost || 3)
  )
  
  if (patternMatch) {
    return { 
      exercise: patternMatch, 
      reason: 'Same movement pattern' 
    }
  }
  
  return null
}

/**
 * Upgrade an exercise when athlete is ready to progress
 */
export function getProgressionExercise(
  exercise: Exercise,
  equipment: EquipmentType[]
): { exercise: Exercise; reason: string } | null {
  const allExercises = getAllExercises()
  const progressionId = getProgressionUp(exercise.id)
  
  if (progressionId) {
    const progressionExercise = allExercises.find(e => e.id === progressionId)
    if (progressionExercise && hasRequiredEquipment(progressionExercise, equipment)) {
      const ladder = getExerciseLadder(exercise.id)
      return { 
        exercise: progressionExercise, 
        reason: ladder ? `Progress in ${ladder.ladderName}` : 'Progression' 
      }
    }
  }
  
  return null
}

/**
 * Smart progression exercise selection based on performance data.
 * Uses the Progression Decision Engine to determine if exercise should
 * progress, maintain, or regress based on actual performance.
 * 
 * This is the performance-based entry point that respects:
 * - Recent rep/hold performance
 * - RPE data
 * - Fatigue state
 * - Consistency requirements (2-3 successful sessions)
 */
export function getSmartProgressionExercise(
  exercise: Exercise,
  equipment: EquipmentType[],
  targetRange?: { min: number; max: number }
): { 
  exercise: Exercise
  reason: string
  decision: ProgressionDecision
  confidence: number 
} | null {
  const allExercises = getAllExercises()
  
  // Evaluate progression decision based on performance data
  const isIsometric = exercise.category === 'skill' && 
    (exercise.defaultRepsOrTime?.includes('s') || 
     exercise.id.includes('hold') ||
     exercise.id.includes('lever') ||
     exercise.id.includes('planche') ||
     exercise.id.includes('l_sit'))
  
  const evaluation = evaluateExerciseProgression(
    exercise.id,
    exercise.name,
    targetRange,
    isIsometric
  )
  
  // Handle based on decision
  switch (evaluation.decision) {
    case 'progress': {
      const progressionId = getProgressionUp(exercise.id)
      if (progressionId) {
        const progressionExercise = allExercises.find(e => e.id === progressionId)
        if (progressionExercise && hasRequiredEquipment(progressionExercise, equipment)) {
          const ladder = getExerciseLadder(exercise.id)
          return {
            exercise: progressionExercise,
            reason: evaluation.reasoning || (ladder ? `Progress in ${ladder.ladderName}` : 'Ready to progress'),
            decision: 'progress',
            confidence: evaluation.confidence,
          }
        }
      }
      // If no progression available, maintain
      return {
        exercise,
        reason: 'At top of progression - maintaining current level',
        decision: 'maintain',
        confidence: evaluation.confidence,
      }
    }
    
    case 'regress': {
      const regressionId = getProgressionDown(exercise.id)
      if (regressionId) {
        const regressionExercise = allExercises.find(e => e.id === regressionId)
        if (regressionExercise && hasRequiredEquipment(regressionExercise, equipment)) {
          return {
            exercise: regressionExercise,
            reason: evaluation.reasoning || 'Stepping back to build strength',
            decision: 'regress',
            confidence: evaluation.confidence,
          }
        }
      }
      // If no regression available, maintain with note
      return {
        exercise,
        reason: 'Consider adding band assistance or reducing volume',
        decision: 'maintain',
        confidence: evaluation.confidence,
      }
    }
    
    case 'maintain':
    default:
      return {
        exercise,
        reason: evaluation.reasoning || 'Building consistency at current level',
        decision: 'maintain',
        confidence: evaluation.confidence,
      }
  }
}

/**
 * Batch evaluate progressions for a list of exercises.
 * Returns exercises with their progression recommendations.
 */
export function evaluateSessionProgressions(
  exercises: SelectedExercise[],
  equipment: EquipmentType[]
): Array<{
  original: SelectedExercise
  recommended: Exercise
  decision: ProgressionDecision
  reason: string
  confidence: number
}> {
  const results: Array<{
    original: SelectedExercise
    recommended: Exercise
    decision: ProgressionDecision
    reason: string
    confidence: number
  }> = []
  
  for (const selected of exercises) {
    // Only evaluate skill and strength exercises
    if (selected.exercise.category !== 'skill' && 
        selected.exercise.category !== 'strength') {
      results.push({
        original: selected,
        recommended: selected.exercise,
        decision: 'maintain',
        reason: 'Non-progression exercise',
        confidence: 1,
      })
      continue
    }
    
    const smartResult = getSmartProgressionExercise(selected.exercise, equipment)
    
    if (smartResult) {
      results.push({
        original: selected,
        recommended: smartResult.exercise,
        decision: smartResult.decision,
        reason: smartResult.reason,
        confidence: smartResult.confidence,
      })
    } else {
      results.push({
        original: selected,
        recommended: selected.exercise,
        decision: 'maintain',
        reason: 'No progression data available',
        confidence: 0.5,
      })
    }
  }
  
  return results
}

/**
 * Adapt a full session's exercises based on fatigue
 */
export function adaptSessionForFatigue(
  exercises: SelectedExercise[],
  fatigueLevel: 'low' | 'moderate' | 'high',
  equipment: EquipmentType[]
): SelectedExercise[] {
  if (fatigueLevel === 'low') return exercises
  
  const usedIds = new Set<string>()
  
  return exercises.map(selected => {
    usedIds.add(selected.exercise.id)
    
    // Only adapt skill and strength exercises when fatigued
    if (fatigueLevel === 'high' && 
        (selected.exercise.category === 'skill' || selected.exercise.category === 'strength')) {
      const substitute = getSubstituteExercise(
        selected.exercise,
        'fatigue',
        equipment,
        usedIds
      )
      
      if (substitute) {
        usedIds.add(substitute.exercise.id)
        return {
          ...selected,
          exercise: substitute.exercise,
          selectionReason: `${selected.selectionReason} (adapted: ${substitute.reason})`,
          note: selected.note ? `${selected.note} - Fatigue adaptation` : 'Fatigue adaptation',
        }
      }
    }
    
    // For moderate fatigue, just reduce intensity
    if (fatigueLevel === 'moderate' && selected.exercise.category === 'skill') {
      return {
        ...selected,
        sets: Math.max(2, selected.sets - 1),
        note: selected.note ? `${selected.note} - Reduced volume` : 'Reduced volume for recovery',
      }
    }
    
    return selected
  })
}

// =============================================================================
// [EXERCISE-SELECTION-HARDENING-LAYER] SAFE SELECTION WRAPPER & FALLBACK SYSTEM
// =============================================================================

/**
 * Get a safe default exercise for a given skill/goal.
 * NEVER returns undefined - always provides a valid exercise structure.
 */
export function getSafeDefaultExercise(
  skill: string | null | undefined,
  category: 'skill' | 'strength' | 'accessory' = 'strength'
): Exercise {
  const skillLower = safeLower(skill)
  const allExercises = getAllExercises()
  
  // Try to find a matching exercise for the skill
  if (skillLower) {
    const matched = allExercises.find(e => 
      safeLower(e.id).includes(skillLower) ||
      safeTransferTargets(e.transferTo).some(t => t.includes(skillLower))
    )
    if (matched) return matched
  }
  
  // Fallback by category
  const byCategory = allExercises.filter(e => e.category === category)
  if (byCategory.length > 0) return byCategory[0]
  
  // Ultimate fallback - return first available exercise
  return allExercises[0] || {
    id: 'fallback_exercise',
    name: 'General Training',
    category: 'accessory',
    difficulty: 'beginner',
    movementPattern: 'compound',
    equipment: [],
    targetMuscles: [],
    fatigueCost: 2,
  } as Exercise
}

/**
 * Get a safe accessory exercise for supplemental work.
 */
export function getSafeAccessory(skill: string | null | undefined): Exercise {
  const skillLower = safeLower(skill)
  const allExercises = getAllExercises()
  const accessories = allExercises.filter(e => e.category === 'accessory')
  
  // Try to find one that supports the skill
  if (skillLower && accessories.length > 0) {
    const supporting = accessories.find(e => 
      safeTransferTargets(e.transferTo).some(t => t.includes(skillLower))
    )
    if (supporting) return supporting
  }
  
  return accessories[0] || getSafeDefaultExercise(skill, 'accessory')
}

/**
 * Get a safe core exercise.
 */
export function getSafeCore(): Exercise {
  const allExercises = getAllExercises()
  const coreExercises = allExercises.filter(e => 
    e.category === 'core' || 
    safeLower(e.id).includes('core') ||
    e.targetMuscles?.some(m => safeLower(m).includes('core') || safeLower(m).includes('abs'))
  )
  
  if (coreExercises.length > 0) return coreExercises[0]
  
  return getSafeDefaultExercise('core', 'accessory')
}

/**
 * Generate fallback exercises when selection fails.
 * NEVER returns empty array - always provides a valid session structure.
 */
export function getFallbackExercises(params: {
  skill?: string | null
  dayFocus?: string | null
  exerciseCount?: number
}): SelectedExercise[] {
  const { skill, dayFocus, exerciseCount = 3 } = params
  const result: SelectedExercise[] = []
  
  console.warn('[EXERCISE-SELECTION-HARDENING] Generating fallback exercises', {
    skill,
    dayFocus,
    exerciseCount,
    reason: 'selection_failed_or_empty'
  })
  
  // Primary exercise for the skill/day
  const primary = getSafeDefaultExercise(skill, 'strength')
  result.push({
    exercise: primary,
    reason: `Fallback primary for ${skill || dayFocus || 'training'}`,
    sets: 3,
    reps: '5-8',
    category: primary.category as 'skill' | 'strength' | 'accessory' | 'core' | 'prehab',
  })
  
  // Support accessory
  if (exerciseCount >= 2) {
    const accessory = getSafeAccessory(skill)
    result.push({
      exercise: accessory,
      reason: 'Fallback support accessory',
      sets: 3,
      reps: '8-12',
      category: accessory.category as 'skill' | 'strength' | 'accessory' | 'core' | 'prehab',
    })
  }
  
  // Core work
  if (exerciseCount >= 3) {
    const core = getSafeCore()
    result.push({
      exercise: core,
      reason: 'Fallback core work',
      sets: 3,
      reps: '10-15',
      category: 'core',
    })
  }
  
  return result
}

/**
 * SAFE SELECTION WRAPPER
 * Wraps the main selection function with error handling and fallback behavior.
 * NEVER throws - NEVER returns empty result.
 */
export function safeSelectExercisesForSession(
  params: Parameters<typeof selectExercisesForSession>[0]
): ExerciseSelection {
  const { day, primaryGoal } = params
  
  // Input validation
  if (!day) {
    console.error('[EXERCISE-SELECTION-HARDENING] INVALID_SELECTION_CONTEXT - missing day', { params })
    return {
      exercises: getFallbackExercises({ skill: primaryGoal, exerciseCount: 4 }),
      sessionSkillExpression: [],
      materialSkillIntent: [],
      selectionAudit: {
        fallbackUsed: true,
        reason: 'missing_day_context',
        timestamp: new Date().toISOString(),
      },
    }
  }
  
  try {
    const result = selectExercisesForSession(params)
    
    // Validate result
    if (!result || !result.exercises || result.exercises.length === 0) {
      console.warn('[EXERCISE-SELECTION-HARDENING] EMPTY_SELECTION_RESULT - using fallback', {
        day: day.focus,
        primaryGoal,
        resultWasNull: !result,
        exerciseCount: result?.exercises?.length || 0,
      })
      
      return {
        exercises: getFallbackExercises({ 
          skill: primaryGoal, 
          dayFocus: day.focus,
          exerciseCount: 4 
        }),
        sessionSkillExpression: result?.sessionSkillExpression || [],
        materialSkillIntent: result?.materialSkillIntent || [],
        selectionAudit: {
          fallbackUsed: true,
          reason: 'empty_selection_result',
          originalResult: result,
          timestamp: new Date().toISOString(),
        },
      }
    }
    
    return result
    
  } catch (error) {
    console.error('[EXERCISE-SELECTION-HARDENING] SELECTION_CRASH - using fallback', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      day: day.focus,
      primaryGoal,
    })
    
    return {
      exercises: getFallbackExercises({ 
        skill: primaryGoal, 
        dayFocus: day.focus,
        exerciseCount: 4 
      }),
      sessionSkillExpression: [],
      materialSkillIntent: [],
      selectionAudit: {
        fallbackUsed: true,
        reason: 'selection_exception',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
    }
  }
}
