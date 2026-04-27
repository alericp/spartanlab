/**
 * Workout Session Normalizer
 * 
 * =============================================================================
 * AUTHORITATIVE SESSION NORMALIZER - PHASE X
 * =============================================================================
 * 
 * This module provides the SINGLE normalizer function for workout session data.
 * Every path that loads a session MUST use this normalizer before render.
 * 
 * GUARANTEES:
 * 1. Never throws - always returns a valid session or null
 * 2. Coerces all fields to safe types
 * 3. Drops malformed exercises rather than crashing
 * 4. Preserves optional metadata when available
 * 5. Logs all normalization for debugging
 */

import type {
  WorkoutSessionContract,
  WorkoutExerciseContract,
  SessionValidationResult,
} from '@/lib/contracts/workout-session-contract'
import { validateWorkoutSessionContract } from '@/lib/contracts/workout-session-contract'
// [LIVE-UNIT-CONTRACT] Canonical hold classifier for unit-aware default guards.
import { isHoldUnit } from '@/lib/workout/execution-unit-contract'

// =============================================================================
// SAFE STRING HELPER - PREVENTS toLowerCase CRASHES
// =============================================================================

/**
 * Safe string coercion that never throws.
 * Returns fallback if input is null, undefined, or not a string.
 */
function safeString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim() !== '') {
    return value
  }
  return fallback
}

/**
 * Safe number coercion with bounds checking.
 */
function safeNumber(value: unknown, fallback: number, min?: number): number {
  if (typeof value === 'number' && !isNaN(value)) {
    if (min !== undefined && value < min) return fallback
    return value
  }
  return fallback
}

// =============================================================================
// EXERCISE NORMALIZER
// =============================================================================

/**
 * Normalize a single exercise to the contract shape.
 * Returns null if the exercise is completely invalid.
 */
function normalizeExercise(raw: unknown, index: number): WorkoutExerciseContract | null {
  // Skip null/undefined/non-objects
  if (!raw || typeof raw !== 'object') {
    console.warn(`[workout-normalizer] Skipping invalid exercise at index ${index}: not an object`)
    return null
  }
  
  const ex = raw as Record<string, unknown>
  
  // [LIVE-UNIT-CONTRACT] Unit-aware default for repsOrTime. When the upstream
  // value is missing, we must NOT blindly fall back to '8-12 reps' because
  // that silently poisons hold exercises (e.g. Planche Lean arriving with
  // no repsOrTime would become reps-based here and log "8 reps" forever
  // after). Instead, if the exercise name or category classifies as hold,
  // default to '30 sec hold'. All branches still satisfy the non-empty
  // string contract.
  const candidateName = typeof ex.name === 'string' ? ex.name : ''
  const candidateCategory = typeof ex.category === 'string' ? ex.category : ''
  const candidateIsHold = isHoldUnit({
    // Do NOT feed the possibly-empty candidate repsOrTime back into the
    // detector here - that would be circular. Name + category classification
    // is sufficient for the hold default guard.
    name: candidateName,
    category: candidateCategory,
  })
  const fallbackRepsOrTime = candidateIsHold ? '30 sec hold' : '8-12 reps'

  // Build the normalized exercise with guaranteed safe values
  const normalized: WorkoutExerciseContract = {
    // Core identity - ALWAYS strings, never undefined
    id: safeString(ex.id, `exercise-${index}`),
    name: safeString(ex.name, 'Exercise'),
    category: safeString(ex.category, 'general'),
    
    // Execution parameters - guaranteed safe
    sets: safeNumber(ex.sets, 3, 1),
    repsOrTime: safeString(ex.repsOrTime, fallbackRepsOrTime),
    note: safeString(ex.note, ''),
    
    // Override/selection
    isOverrideable: ex.isOverrideable !== false,
    selectionReason: safeString(ex.selectionReason, ''),
    
    // Optional prescription (preserve if valid)
    prescribedLoad: normalizePrescribedLoad(ex.prescribedLoad),
    targetRPE: typeof ex.targetRPE === 'number' ? ex.targetRPE : undefined,
    restSeconds: typeof ex.restSeconds === 'number' ? ex.restSeconds : undefined,
    
    // Method/block context
    // [METHOD-TAXONOMY-LOCK] `method` + `blockId` = grouped-structure
    // membership. `setExecutionMethod` (attached below, outside this strict
    // object literal) = per-exercise set-execution method.
    method: typeof ex.method === 'string' ? ex.method : undefined,
    methodLabel: typeof ex.methodLabel === 'string' ? ex.methodLabel : undefined,
    blockId: typeof ex.blockId === 'string' ? ex.blockId : undefined,
    
    // Source tracking
    source: typeof ex.source === 'string' ? ex.source : undefined,
    wasAdapted: typeof ex.wasAdapted === 'boolean' ? ex.wasAdapted : undefined,
    progressionDecision: normalizeProgressionDecision(ex.progressionDecision),
    
    // Coaching/truth metadata
    coachingMeta: normalizeCoachingMeta(ex.coachingMeta),
    executionTruth: normalizeExecutionTruth(ex.executionTruth),
  }
  
  // Log if prescribedLoad was preserved
  if (normalized.prescribedLoad && normalized.prescribedLoad.load > 0) {
    console.log('[workout-normalizer] Preserved prescribedLoad:', {
      exerciseName: normalized.name,
      load: normalized.prescribedLoad.load,
      unit: normalized.prescribedLoad.unit,
    })
  }

  // [METHOD-TAXONOMY-LOCK] Preserve per-exercise set-execution method across
  // the normalize boundary. `setExecutionMethod` is an authoritative
  // taxonomy field (see lib/workout/execution-unit-contract.ts) that is NOT
  // yet declared on `WorkoutExerciseContract` (that contract lives outside
  // this prompt's scope). Attaching it as an extra property keeps the field
  // alive for downstream consumers that read via an extended shape, without
  // modifying the contract type in this pass. The normalizer MUST preserve
  // this field — dropping it here would silently flatten cluster/rest-pause/
  // top-set/drop-set identity on the way into the live workout corridor.
  const validSetExecMethods = ['cluster', 'rest_pause', 'top_set', 'drop_set'] as const
  const rawSetExec = (ex as { setExecutionMethod?: unknown }).setExecutionMethod
  if (typeof rawSetExec === 'string' && (validSetExecMethods as readonly string[]).includes(rawSetExec)) {
    ;(normalized as unknown as { setExecutionMethod: string }).setExecutionMethod = rawSetExec
  }

  // [PHASE 4L] Preserve row-level mutator-attached fields across the
  // normalize boundary. These fields are written by
  // `lib/program/row-level-method-prescription-mutator.ts` and are NOT in
  // `WorkoutExerciseContract`. Same extra-property pass-through pattern as
  // `setExecutionMethod` above. Without this preservation, the live workout
  // would lose:
  //   - the densityPrescription instruction (time cap + quality stop) for
  //     endurance_density rows,
  //   - the doctrinePrescriptionDelta proof,
  //   - the prescriptionBoundsProof witness (currentValue / doctrineMin /
  //     doctrineMax / verdict),
  //   - the rowLevelMethodApplied flag.
  // We only carry plain JSON-safe shapes (objects / primitives), never
  // functions or class instances.
  const rawDensityPrescription = (ex as { densityPrescription?: unknown }).densityPrescription
  if (rawDensityPrescription && typeof rawDensityPrescription === 'object') {
    ;(normalized as unknown as { densityPrescription: unknown }).densityPrescription = rawDensityPrescription
  }
  const rawDoctrineDelta = (ex as { doctrinePrescriptionDelta?: unknown }).doctrinePrescriptionDelta
  if (rawDoctrineDelta && typeof rawDoctrineDelta === 'object') {
    ;(normalized as unknown as { doctrinePrescriptionDelta: unknown }).doctrinePrescriptionDelta = rawDoctrineDelta
  }
  const rawBoundsProof = (ex as { prescriptionBoundsProof?: unknown }).prescriptionBoundsProof
  if (rawBoundsProof && typeof rawBoundsProof === 'object') {
    ;(normalized as unknown as { prescriptionBoundsProof: unknown }).prescriptionBoundsProof = rawBoundsProof
  }
  const rawRowLevelApplied = (ex as { rowLevelMethodApplied?: unknown }).rowLevelMethodApplied
  if (typeof rawRowLevelApplied === 'boolean') {
    ;(normalized as unknown as { rowLevelMethodApplied: boolean }).rowLevelMethodApplied = rawRowLevelApplied
  }

  // [PHASE 4M] Preserve doctrineApplicationDeltas[] across the normalize
  // boundary. The doctrine application corridor stamps an array of typed
  // {family, fieldPath, before, after, reason, visibleLabel, ...} deltas
  // on every exercise that received a doctrine-earned mutation. This array
  // is plain-JSON-safe and is consumed by the Program page proof line and
  // the live workout coaching surface. Same extra-property pass-through
  // pattern as the Phase 4L preservation block above.
  const rawAppDeltas = (ex as { doctrineApplicationDeltas?: unknown }).doctrineApplicationDeltas
  if (Array.isArray(rawAppDeltas) && rawAppDeltas.length > 0) {
    ;(normalized as unknown as { doctrineApplicationDeltas: unknown }).doctrineApplicationDeltas = rawAppDeltas
  }

  return normalized
}

/**
 * Normalize prescribed load data
 */
function normalizePrescribedLoad(raw: unknown): WorkoutExerciseContract['prescribedLoad'] {
  if (!raw || typeof raw !== 'object') return undefined
  
  const pl = raw as Record<string, unknown>
  if (typeof pl.load !== 'number' || pl.load <= 0) return undefined
  
  return {
    load: pl.load,
    unit: (pl.unit as 'lbs' | 'kg' | 'bodyweight' | '%1RM') || 'lbs',
    basis: (pl.basis as 'current_benchmark' | 'estimated' | 'progression' | 'user_input') || 'estimated',
    confidenceLevel: (pl.confidenceLevel as 'high' | 'moderate' | 'low') || 'moderate',
    targetReps: typeof pl.targetReps === 'number' ? pl.targetReps : undefined,
    intensityBand: (pl.intensityBand as 'strength' | 'hypertrophy' | 'endurance' | 'skill') || undefined,
  }
}

/**
 * Normalize progression decision
 */
function normalizeProgressionDecision(raw: unknown): WorkoutExerciseContract['progressionDecision'] {
  if (!raw || typeof raw !== 'object') return undefined
  
  const pd = raw as Record<string, unknown>
  return {
    decision: safeString(pd.decision, ''),
    reason: safeString(pd.reason, ''),
    confidence: typeof pd.confidence === 'string' ? pd.confidence : undefined,
  }
}

/**
 * Normalize coaching metadata
 * [EXPLAIN-OWNER-LOCK] Preserves roleInSession for explanation engine
 */
function normalizeCoachingMeta(raw: unknown): WorkoutExerciseContract['coachingMeta'] {
  if (!raw || typeof raw !== 'object') return undefined
  
  const cm = raw as Record<string, unknown>
  return {
    expressionMode: typeof cm.expressionMode === 'string' ? cm.expressionMode : undefined,
    // [EXPLAIN-OWNER-LOCK] Preserve roleInSession for explanation engine
    roleInSession: typeof cm.roleInSession === 'string' ? cm.roleInSession : undefined,
    progressionIntent: typeof cm.progressionIntent === 'string' ? cm.progressionIntent : undefined,
    loadDecisionSummary: typeof cm.loadDecisionSummary === 'string' ? cm.loadDecisionSummary : undefined,
    adaptationNote: typeof cm.adaptationNote === 'string' ? cm.adaptationNote : undefined,
  }
}

/**
 * Normalize execution truth
 */
function normalizeExecutionTruth(raw: unknown): WorkoutExerciseContract['executionTruth'] {
  if (!raw || typeof raw !== 'object') return undefined
  
  const et = raw as Record<string, unknown>
  return {
    recommendedBand: typeof et.recommendedBand === 'string' ? et.recommendedBand : undefined,
    bandReason: typeof et.bandReason === 'string' ? et.bandReason : undefined,
    calibrationNeeded: typeof et.calibrationNeeded === 'boolean' ? et.calibrationNeeded : undefined,
  }
}

// =============================================================================
// MAIN SESSION NORMALIZER
// =============================================================================

/**
 * Normalize a raw workout session to the authoritative contract.
 * 
 * CRITICAL: This function NEVER throws. It always returns a valid session or null.
 * 
 * @param raw - The raw session data from storage or program state
 * @returns A normalized WorkoutSessionContract or null if completely invalid
 */
export function normalizeWorkoutSession(raw: unknown): WorkoutSessionContract | null {
  // Guard against null/undefined/non-objects
  if (!raw || typeof raw !== 'object') {
    console.warn('[workout-normalizer] Received null/undefined/non-object session')
    return null
  }
  
  const session = raw as Record<string, unknown>
  
  console.log('[workout-normalizer] Starting session normalization:', {
    dayLabel: session.dayLabel,
    dayNumber: session.dayNumber,
    exerciseCount: Array.isArray(session.exercises) ? session.exercises.length : 0,
  })
  
  // Normalize exercises - filter out malformed entries
  const rawExercises = Array.isArray(session.exercises) ? session.exercises : []
  const normalizedExercises = rawExercises
    .map((ex, idx) => normalizeExercise(ex, idx))
    .filter((ex): ex is WorkoutExerciseContract => ex !== null)
  
  // Normalize warmup and cooldown
  const rawWarmup = Array.isArray(session.warmup) ? session.warmup : []
  const normalizedWarmup = rawWarmup
    .map((ex, idx) => normalizeExercise(ex, idx))
    .filter((ex): ex is WorkoutExerciseContract => ex !== null)
  
  const rawCooldown = Array.isArray(session.cooldown) ? session.cooldown : []
  const normalizedCooldown = rawCooldown
    .map((ex, idx) => normalizeExercise(ex, idx))
    .filter((ex): ex is WorkoutExerciseContract => ex !== null)
  
  // Build the normalized session contract
  const normalized: WorkoutSessionContract = {
    id: safeString(session.id, `session-${Date.now()}`),
    dayNumber: safeNumber(session.dayNumber, 1, 0),
    dayLabel: safeString(session.dayLabel, 'Workout'),
    focus: safeString(session.focus, 'general'),
    focusLabel: safeString(session.focusLabel, 'Training'),
    rationale: safeString(session.rationale, ''),
    estimatedMinutes: safeNumber(session.estimatedMinutes, 45, 5),
    isPrimary: session.isPrimary !== false,
    finisherIncluded: session.finisherIncluded === true,
    exercises: normalizedExercises,
    warmup: normalizedWarmup,
    cooldown: normalizedCooldown,
  }
  
  console.log('[workout-normalizer] Session normalization complete:', {
    inputExercises: rawExercises.length,
    outputExercises: normalizedExercises.length,
    droppedExercises: rawExercises.length - normalizedExercises.length,
    dayLabel: normalized.dayLabel,
  })
  
  return normalized
}

/**
 * Normalize and validate a session in one step.
 * Returns null if the session is invalid after normalization.
 */
export function normalizeAndValidateSession(raw: unknown): {
  session: WorkoutSessionContract | null
  validation: SessionValidationResult
} {
  const session = normalizeWorkoutSession(raw)
  const validation = validateWorkoutSessionContract(session)
  
  if (!validation.isValid) {
    console.warn('[workout-normalizer] Session failed validation:', validation.reasons)
  }
  
  return { session, validation }
}

/**
 * Create a minimal fallback session when all else fails.
 * This ensures the UI always has something to render.
 */
export function createFallbackSession(reason: string): WorkoutSessionContract {
  console.warn('[workout-normalizer] Creating fallback session:', reason)
  
  return {
    id: `fallback-${Date.now()}`,
    dayNumber: 0,
    dayLabel: 'Workout',
    focus: 'general',
    focusLabel: 'General Training',
    rationale: 'This is a fallback workout session.',
    estimatedMinutes: 30,
    isPrimary: true,
    finisherIncluded: false,
    exercises: [
      {
        id: 'fallback-ex-1',
        name: 'Bodyweight Movement',
        category: 'general',
        sets: 3,
        repsOrTime: '10-15 reps',
        note: 'Focus on form and controlled movement.',
        isOverrideable: false,
        selectionReason: 'Fallback exercise',
      },
    ],
    warmup: [],
    cooldown: [],
  }
}
