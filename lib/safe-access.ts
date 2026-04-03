/**
 * Safe Access Utilities
 * Provides null-safe access patterns for program data structures
 * [UI CONTRACT ALIGNMENT] - Prevents runtime undefined crashes
 */

/**
 * Safely returns an array, returning empty array if value is null/undefined
 */
export function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

/**
 * Safely returns an object or null
 */
export function safeObject<T>(value: T | undefined | null): T | null {
  return value ?? null
}

/**
 * Safely returns a number or default value
 */
export function safeNumber(value: number | undefined | null, defaultValue: number = 0): number {
  return typeof value === 'number' && !isNaN(value) ? value : defaultValue
}

/**
 * Safely returns a string or default value
 */
export function safeString(value: string | undefined | null, defaultValue: string = ''): string {
  return typeof value === 'string' ? value : defaultValue
}

/**
 * Default empty skill trace contract for safe fallback
 */
export const EMPTY_SKILL_TRACE = {
  sourceSkillCount: 0,
  weightedAllocationCount: 0,
  primarySpineCount: 0,
  secondaryAnchorCount: 0,
  tertiaryCount: 0,
  supportCount: 0,
  deferredCount: 0,
  sixSessionLogicTouched: false,
  skillTraces: [],
  finalWeekExpression: {
    directlyRepresentedSkills: [] as string[],
    supportExpressedSkills: [] as string[],
    rotationalSkills: [] as string[],
    deferredSkills: [] as { skill: string; reasonCode: string; reasonLabel: string }[],
    coverageVerdict: 'weak' as 'strong' | 'adequate' | 'weak',
    coverageRatio: 0,
  },
} as const

/**
 * Gets safe skill trace with all required fields populated
 */
export function getSafeSkillTrace(trace: unknown): typeof EMPTY_SKILL_TRACE {
  if (!trace || typeof trace !== 'object') {
    return EMPTY_SKILL_TRACE
  }
  
  const t = trace as Record<string, unknown>
  
  return {
    sourceSkillCount: safeNumber(t.sourceSkillCount as number),
    weightedAllocationCount: safeNumber(t.weightedAllocationCount as number),
    primarySpineCount: safeNumber(t.primarySpineCount as number),
    secondaryAnchorCount: safeNumber(t.secondaryAnchorCount as number),
    tertiaryCount: safeNumber(t.tertiaryCount as number),
    supportCount: safeNumber(t.supportCount as number),
    deferredCount: safeNumber(t.deferredCount as number),
    sixSessionLogicTouched: Boolean(t.sixSessionLogicTouched),
    skillTraces: safeArray(t.skillTraces as unknown[]),
    finalWeekExpression: {
      directlyRepresentedSkills: safeArray((t.finalWeekExpression as Record<string, unknown>)?.directlyRepresentedSkills as string[]),
      supportExpressedSkills: safeArray((t.finalWeekExpression as Record<string, unknown>)?.supportExpressedSkills as string[]),
      rotationalSkills: safeArray((t.finalWeekExpression as Record<string, unknown>)?.rotationalSkills as string[]),
      deferredSkills: safeArray((t.finalWeekExpression as Record<string, unknown>)?.deferredSkills as { skill: string; reasonCode: string; reasonLabel: string }[]),
      coverageVerdict: ((t.finalWeekExpression as Record<string, unknown>)?.coverageVerdict as 'strong' | 'adequate' | 'weak') || 'weak',
      coverageRatio: safeNumber((t.finalWeekExpression as Record<string, unknown>)?.coverageRatio as number),
    },
  }
}
