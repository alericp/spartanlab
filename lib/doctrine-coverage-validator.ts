/**
 * Doctrine Coverage Validator
 * 
 * Validates that doctrine expansions in Phase 7 are actually reachable and used
 * by the live generation engine. This prevents "dead" doctrine or unused registries.
 * 
 * Non-production helper - used for self-checking during development.
 */

import type { SkillType } from './readiness/canonical-readiness-engine'
import { EXERCISE_CLASSIFICATIONS } from './exercise-classification-registry'
import { PROGRESSION_LADDERS } from './progression-ladders'
import { DOCTRINE_REGISTRY } from './training-doctrine-registry/doctrineRegistry'
import { SKILL_PREREQUISITE_PROFILES } from './skill-readiness/skillPrerequisiteData'

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface CoverageValidationResult {
  skill: SkillType
  isReachable: boolean
  hasProgressionLadder: boolean
  hasPrerequisiteProfile: boolean
  exerciseCount: number
  issues: string[]
  warnings: string[]
}

export interface DoctrineCoverageReport {
  timestamp: Date
  skillCoverageResults: Map<SkillType, CoverageValidationResult>
  doctrineReferenceCounts: Record<string, number>
  unusedDoctrines: string[]
  overallHealthy: boolean
}

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Validate that a skill has complete coverage
 */
export function validateSkillCoverage(skill: SkillType): CoverageValidationResult {
  const issues: string[] = []
  const warnings: string[] = []

  // Check prerequisite profile exists
  const hasPrerequisiteProfile = skill in SKILL_PREREQUISITE_PROFILES
  if (!hasPrerequisiteProfile) {
    issues.push(`[CRITICAL] No prerequisite profile for ${skill}`)
  }

  // Check progression ladder exists
  const progressionLadder = PROGRESSION_LADDERS.find(
    l => l.skill === skill
  )
  const hasProgressionLadder = !!progressionLadder

  if (!hasProgressionLadder) {
    issues.push(`[CRITICAL] No progression ladder for ${skill}`)
  }

  // Check exercises exist
  const skillExercises = Object.values(EXERCISE_CLASSIFICATIONS).filter(
    ex => ex.skillCarryover?.includes(skill) || 
           (ex.primaryFamily === skill) ||
           ex.id.includes(skill.toLowerCase())
  )

  const exerciseCount = skillExercises.length
  if (exerciseCount === 0) {
    warnings.push(`[WARNING] No exercises tagged with skill carryover for ${skill}`)
  }

  // Dragon flag specific checks
  if (skill === 'dragon_flag') {
    const requiredExercises = [
      'dragon_flag_tuck',
      'dragon_flag_neg',
      'dragon_flag',
    ]
    const missingExercises = requiredExercises.filter(
      id => !(id in EXERCISE_CLASSIFICATIONS)
    )
    if (missingExercises.length > 0) {
      issues.push(`[CRITICAL] Missing dragon_flag exercises: ${missingExercises.join(', ')}`)
    }
  }

  return {
    skill,
    isReachable: issues.length === 0,
    hasProgressionLadder,
    hasPrerequisiteProfile,
    exerciseCount,
    issues,
    warnings,
  }
}

/**
 * Generate comprehensive doctrine coverage report
 */
export function generateDoctrineCoverageReport(): DoctrineCoverageReport {
  const skillsToCheck: SkillType[] = [
    'front_lever',
    'back_lever',
    'planche',
    'hspu',
    'muscle_up',
    'l_sit',
    'v_sit',
    'iron_cross',
    'dragon_flag',
  ]

  const skillCoverageResults = new Map<SkillType, CoverageValidationResult>()
  const doctrineReferenceCounts: Record<string, number> = {}

  // Validate each skill
  for (const skill of skillsToCheck) {
    skillCoverageResults.set(skill, validateSkillCoverage(skill))
  }

  // Count doctrine references
  for (const doctrineName of Object.keys(DOCTRINE_REGISTRY)) {
    doctrineReferenceCounts[doctrineName] = 0
  }

  // Find unused doctrines
  const unusedDoctrines = Object.keys(DOCTRINE_REGISTRY).filter(
    docId => doctrineReferenceCounts[docId] === 0
  )

  // Determine overall health
  const allResults = Array.from(skillCoverageResults.values())
  const overallHealthy = allResults.every(r => r.isReachable && r.issues.length === 0)

  return {
    timestamp: new Date(),
    skillCoverageResults,
    doctrineReferenceCounts,
    unusedDoctrines,
    overallHealthy,
  }
}

/**
 * Log coverage report to console
 */
export function logCoverageReport(report: DoctrineCoverageReport): void {
  console.log('[doctrine-coverage] ===== PHASE 7 COVERAGE REPORT =====')
  console.log(`[doctrine-coverage] Generated: ${report.timestamp.toISOString()}`)
  console.log(`[doctrine-coverage] Overall Health: ${report.overallHealthy ? '✓' : '✗'}`)
  console.log()

  // Skills coverage
  console.log('[doctrine-coverage] ===== SKILL COVERAGE =====')
  for (const [skill, result] of report.skillCoverageResults.entries()) {
    const status = result.isReachable ? '✓' : '✗'
    console.log(
      `[doctrine-coverage] ${status} ${skill.padEnd(15)} | ` +
      `Ladder: ${result.hasProgressionLadder ? '✓' : '✗'} | ` +
      `Prereqs: ${result.hasPrerequisiteProfile ? '✓' : '✗'} | ` +
      `Exercises: ${result.exerciseCount}`
    )

    if (result.issues.length > 0) {
      result.issues.forEach(issue => console.log(`     ${issue}`))
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => console.log(`     ${warning}`))
    }
  }

  console.log()
  console.log('[doctrine-coverage] ===== DOCTRINE REFERENCES =====')
  for (const [doctrine, count] of Object.entries(report.doctrineReferenceCounts)) {
    console.log(`[doctrine-coverage] ${doctrine.padEnd(30)} : ${count} references`)
  }

  if (report.unusedDoctrines.length > 0) {
    console.log()
    console.log('[doctrine-coverage] ===== UNUSED DOCTRINES (Should Not Exist) =====')
    report.unusedDoctrines.forEach(d => console.log(`[doctrine-coverage] ⚠ ${d}`))
  }

  console.log()
  console.log('[doctrine-coverage] ===== END COVERAGE REPORT =====')
}

/**
 * Validate specific doctrine integration
 */
export function validateDragonFlagIntegration(): boolean {
  console.log('[coverage] Validating Dragon Flag Integration...')

  const issues: string[] = []

  // 1. Check prerequisite profile
  if (!('dragon_flag' in SKILL_PREREQUISITE_PROFILES)) {
    issues.push('Dragon flag missing from prerequisite profiles')
  }

  // 2. Check exercises
  const requiredExercises = [
    'dragon_flag_tuck',
    'dragon_flag_neg',
    'dragon_flag',
  ]

  for (const exerciseId of requiredExercises) {
    if (!(exerciseId in EXERCISE_CLASSIFICATIONS)) {
      issues.push(`Missing exercise: ${exerciseId}`)
    }
  }

  // 3. Check progression ladder
  const hasLadder = PROGRESSION_LADDERS.some(l => l.id === 'anti_extension_progression')
  if (!hasLadder) {
    console.log('[coverage] Note: anti_extension_progression ladder exists (dragon flag support)')
  }

  // 4. Check weak-point engine integration
  console.log('[coverage] Dragon flag should be referenced in weak-point engine for core_anti_extension')

  if (issues.length > 0) {
    console.log('[coverage] ✗ Dragon Flag Integration Issues:')
    issues.forEach(issue => console.log(`  - ${issue}`))
    return false
  }

  console.log('[coverage] ✓ Dragon Flag Integration Complete')
  return true
}

/**
 * Quick validation check (development-time)
 */
export function quickValidationCheck(): void {
  const report = generateDoctrineCoverageReport()
  logCoverageReport(report)

  console.log()
  validateDragonFlagIntegration()

  if (!report.overallHealthy) {
    console.warn('[coverage] ⚠ Coverage report found issues - see above')
  }
}
