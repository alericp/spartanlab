/**
 * EXERCISE SELECTION HARDENING LAYER
 * Safe string operations to prevent undefined.toLowerCase() crashes
 * 
 * This module provides runtime-safe string normalization utilities
 * that NEVER throw on null/undefined/non-string inputs.
 */

/**
 * Safely convert any value to lowercase string.
 * Returns empty string for null/undefined/non-string values.
 */
export function safeString(value: unknown): string {
  if (typeof value === 'string') return value.toLowerCase().trim()
  if (value === null || value === undefined) return ''
  return String(value).toLowerCase().trim()
}

/**
 * Safely ensure an array is returned.
 * Returns empty array for null/undefined/non-array values.
 */
export function safeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : []
}

/**
 * Safely extract skill key from various skill allocation shapes.
 */
export function safeSkillKey(skillAlloc: { skill?: string | null } | null | undefined): string {
  if (!skillAlloc) return ''
  return safeString(skillAlloc.skill)
}

/**
 * Safely get exercise ID in lowercase.
 */
export function safeExerciseId(exercise: { id?: string | null } | null | undefined): string {
  if (!exercise) return ''
  return safeString(exercise.id)
}

/**
 * Safely get exercise name in lowercase.
 */
export function safeExerciseName(exercise: { name?: string | null } | null | undefined): string {
  if (!exercise) return ''
  return safeString(exercise.name)
}

/**
 * Safely normalize transferTo array to lowercase strings.
 */
export function safeTransferTargets(transferTo: (string | null | undefined)[] | null | undefined): string[] {
  if (!transferTo || !Array.isArray(transferTo)) return []
  return transferTo
    .filter((t): t is string => t !== null && t !== undefined && typeof t === 'string')
    .map(t => safeString(t))
}

/**
 * Safely check if exercise transfers to a skill.
 */
export function exerciseTransfersToSkill(
  exercise: { transferTo?: (string | null | undefined)[] | null } | null | undefined,
  skill: string | null | undefined
): boolean {
  if (!exercise || !skill) return false
  const skillLower = safeString(skill)
  if (!skillLower) return false
  const targets = safeTransferTargets(exercise.transferTo)
  return targets.some(t => t.includes(skillLower))
}

/**
 * Safely check if exercise ID or name includes a skill.
 */
export function exerciseMatchesSkillByName(
  exercise: { id?: string | null; name?: string | null } | null | undefined,
  skill: string | null | undefined
): boolean {
  if (!exercise || !skill) return false
  const skillLower = safeString(skill)
  if (!skillLower) return false
  const idLower = safeExerciseId(exercise)
  const nameLower = safeExerciseName(exercise)
  return idLower.includes(skillLower) || nameLower.includes(skillLower)
}

/**
 * Normalize an exercise object for safe access.
 * Ensures all string fields are safely normalized.
 */
export function normalizeExerciseForSelection<T extends Record<string, unknown>>(exercise: T | null | undefined): T & {
  _normalized: true
  _safeId: string
  _safeName: string
  _safeCategory: string
} {
  if (!exercise) {
    return {
      _normalized: true,
      _safeId: '',
      _safeName: '',
      _safeCategory: '',
    } as T & { _normalized: true; _safeId: string; _safeName: string; _safeCategory: string }
  }
  
  return {
    ...exercise,
    _normalized: true,
    _safeId: safeString(exercise.id as string | undefined),
    _safeName: safeString(exercise.name as string | undefined),
    _safeCategory: safeString(exercise.category as string | undefined),
  }
}

/**
 * Validate session skill allocation array.
 * Filters out entries with missing/invalid skill keys.
 */
export function validateSessionSkills(
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
export function validateMaterialSkillIntent(
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

/**
 * Safe comparison helper that handles undefined values
 */
export function safeIncludes(haystack: string | null | undefined, needle: string | null | undefined): boolean {
  if (!haystack || !needle) return false
  return safeString(haystack).includes(safeString(needle))
}

/**
 * Safe equality check for normalized strings
 */
export function safeEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  return safeString(a) === safeString(b)
}
