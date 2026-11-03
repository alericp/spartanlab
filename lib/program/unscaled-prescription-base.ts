/**
 * The stored program keeps week-1 sets. Week scaling derives a display dose
 * and must not multiply that display dose again. A performance adjustment
 * writes the new week-1 base into `sets`.
 *
 * If a scaled display value was saved back into `sets` and the original base
 * is still on the row, recover that base. A real adjustment moves `sets`
 * away from `scaledSets`, so that value stays the base.
 */

export interface UnscaledBaseExercise {
  sets?: number
  scaledSets?: number
  originalSets?: number
  weekScalingApplied?: boolean
}

export function resolveUnscaledBaseSets(exercise: UnscaledBaseExercise): number | undefined {
  if (typeof exercise.sets !== 'number' || !Number.isFinite(exercise.sets)) return exercise.sets
  if (
    exercise.weekScalingApplied === true &&
    typeof exercise.originalSets === 'number' &&
    Number.isFinite(exercise.originalSets) &&
    typeof exercise.scaledSets === 'number' &&
    Number.isFinite(exercise.scaledSets) &&
    exercise.sets === exercise.scaledSets &&
    exercise.originalSets !== exercise.sets
  ) {
    return exercise.originalSets
  }
  return exercise.sets
}
