/**
 * CONDITIONING FINISHER ARTIFACT CONTRACT — MASTER-8C.4.G.1
 *
 * =============================================================================
 * PURE GUARDS FOR DETECTING SYNTHETIC CONDITIONING FINISHER PLACEHOLDERS
 * =============================================================================
 *
 * A "Conditioning Finisher" is NOT an exercise. It is a method / session-ending
 * conditioning intent. Until a real finisher prescription exists (with a selected
 * modality, exercise, and time cap), it should not be treated as a real exercise.
 *
 * These guards detect legacy/fake placeholder rows that were incorrectly pushed
 * into session.exercises[] and filter them from Program Balance coverage and
 * Program Page display.
 *
 * GUARANTEES:
 *   - Pure TypeScript, side-effect free
 *   - No React imports, no UI components
 *   - No mutation of input objects
 *   - Works with both new and legacy saved program shapes
 *
 * Created: May 15th, 2026
 * Step: MASTER-8C.4.G.1
 */

/**
 * Detects whether an exercise object is a synthetic conditioning finisher placeholder.
 * 
 * Returns true for legacy/fake placeholder rows that match the bad pattern:
 * - name is "Conditioning Finisher"
 * - method/trainingMethod is "endurance_density"
 * - isFinisher flag is true
 * - NO real materialized finisher prescription exists
 * 
 * Returns false if a real finisher prescription exists (with selected modality/exercise).
 */
export function isSyntheticConditioningFinisherPlaceholder(exercise: unknown): boolean {
  if (!exercise || typeof exercise !== 'object') return false

  const ex = exercise as Record<string, unknown>

  // Check for real materialized finisher prescription fields
  // If any of these exist with valid values, this is a REAL finisher, not a placeholder
  const hasRealPrescription =
    isValidString(ex.selectedFinisherExerciseId) ||
    isValidString(ex.selectedFinisherExerciseName) ||
    isValidString(ex.modality) ||
    isValidString(ex.conditioningModality) ||
    isValidString(ex.finisherPrescription) ||
    isValidNumber(ex.timeCapSeconds) ||
    isValidNumber(ex.workWindowSeconds) ||
    isValidString(ex.workFormat) ||
    // Check for a real exercise identity that is NOT "conditioning_finisher"
    (isValidString(ex.exerciseId) && normalizeId(ex.exerciseId) !== 'conditioning_finisher') ||
    (isValidString(ex.canonicalExerciseId) && normalizeId(ex.canonicalExerciseId) !== 'conditioning_finisher')

  if (hasRealPrescription) return false

  // Check if this matches the synthetic placeholder pattern
  const name = ex.name
  const id = ex.id ?? ex.exerciseId
  const method = ex.method ?? ex.trainingMethod ?? ex.methodOverrideMethodKey
  const isFinisher = ex.isFinisher === true
  const category = ex.category
  const methodLabel = ex.methodLabel

  // Name check: "Conditioning Finisher" or similar
  const isConditioningFinisherName =
    (typeof name === 'string' && name.toLowerCase() === 'conditioning finisher') ||
    (typeof id === 'string' && normalizeId(id) === 'conditioning_finisher')

  // Method check: endurance_density
  const isEnduranceDensityMethod = method === 'endurance_density'

  // Category/label check
  const isConditioningCategory = category === 'conditioning'
  const hasFinisherLabel =
    typeof methodLabel === 'string' &&
    methodLabel.toLowerCase().includes('finisher')

  // Synthetic placeholder detection:
  // Must have EITHER the exact name OR the finisher flag + endurance_density method
  if (isConditioningFinisherName) return true
  if (isFinisher && isEnduranceDensityMethod) return true
  if (isEnduranceDensityMethod && isConditioningCategory && hasFinisherLabel) return true

  return false
}

/**
 * Returns a human-readable reason why this row is classified as a synthetic placeholder.
 */
export function getSyntheticConditioningFinisherReason(exercise: unknown): string {
  if (!isSyntheticConditioningFinisherPlaceholder(exercise)) {
    return 'Not a synthetic placeholder'
  }
  return 'Synthetic method placeholder only — not a real exercise prescription.'
}

// =============================================================================
// HELPER UTILITIES
// =============================================================================

function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0
}

function normalizeId(id: string): string {
  return id.toLowerCase().replace(/[\s-]+/g, '_')
}
