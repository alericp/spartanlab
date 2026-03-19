// Program Validation Layer
// Validates generated programs before save/return
// Ensures all exercises are DB-backed and program structure is coherent

import { validateExerciseSource, verifyExerciseInDatabase } from './exercise-database-resolver'
import type { Exercise } from './adaptive-exercise-pool'
import { 
  verifyMovementIntelligence, 
  verifyQaValidation,
  recordIntegrationProof,
} from './engine-integration-proof'
import {
  normalizeToMovementIntelligent,
  validateSessionCoherence,
  validateWeeklyCoherence,
  analyzeSessionPatterns,
  analyzeWeeklyPatterns,
  type MovementIntelligentExercise,
  type CoherenceCheckResult,
  type SessionPatternAnalysis,
  type WeeklyPatternAnalysis,
} from './movement-intelligence'
import { getExerciseById } from './adaptive-exercise-pool'

// =============================================================================
// TYPES
// =============================================================================

export interface ProgramValidationResult {
  isValid: boolean
  exerciseValidation: {
    total: number
    valid: number
    invalid: number
    missingDbSource: string[]
  }
  structureValidation: {
    hasValidSessions: boolean
    duplicateExercises: { sessionIndex: number; exerciseId: string }[]
    emptyBlocks: { sessionIndex: number; blockName: string }[]
    orderingIssues: string[]
  }
  volumeValidation: {
    isPlausible: boolean
    totalSets: number
    issues: string[]
  }
  equipmentValidation: {
    isRespected: boolean
    violations: string[]
  }
  biomechanicalValidation: {
    isCoherent: boolean
    sessionCoherence: { dayNumber: number; passed: boolean; warnings: string[] }[]
    weeklyAnalysis: {
      straightArmDays: number
      pushPullRatio: number
      warnings: string[]
      recommendations: string[]
    }
  }
  diagnostics: string[]
}

export interface SessionExercise {
  exercise?: Exercise | { id?: string; name?: string; [key: string]: unknown }
  id?: string
  name?: string
  sets?: number
  reps?: string
  repsOrTime?: string
  [key: string]: unknown
}

export interface ProgramSession {
  dayNumber?: number
  dayLabel?: string
  focus?: string
  exercises?: SessionExercise[]
  warmup?: SessionExercise[]
  cooldown?: SessionExercise[]
  trainingBlocks?: Array<{
    name?: string
    exercises?: SessionExercise[]
  }>
  estimatedMinutes?: number
  [key: string]: unknown
}

export interface ProgramToValidate {
  sessions?: ProgramSession[]
  weeklyStructure?: {
    totalDays?: number
  }
  [key: string]: unknown
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate that all exercises in a program are DB-backed
 */
export function validateProgramExercises(
  program: ProgramToValidate
): ProgramValidationResult['exerciseValidation'] {
  const result = {
    total: 0,
    valid: 0,
    invalid: 0,
    missingDbSource: [] as string[],
  }
  
  const sessions = program.sessions || []
  
  for (const session of sessions) {
    // Check main exercises
    const allExercises = [
      ...(session.exercises || []),
      ...(session.warmup || []),
      ...(session.cooldown || []),
    ]
    
    // Also check training blocks
    if (session.trainingBlocks) {
      for (const block of session.trainingBlocks) {
        if (block.exercises) {
          allExercises.push(...block.exercises)
        }
      }
    }
    
    for (const ex of allExercises) {
      result.total++
      
      // Get the exercise ID
      const exerciseId = ex.exercise?.id || ex.id
      const exerciseName = ex.exercise?.name || ex.name || 'Unknown'
      
      if (!exerciseId) {
        result.invalid++
        result.missingDbSource.push(`[No ID] ${exerciseName}`)
        continue
      }
      
      // Verify in database
      if (verifyExerciseInDatabase(exerciseId)) {
        result.valid++
      } else {
        result.invalid++
        result.missingDbSource.push(`[ID: ${exerciseId}] ${exerciseName}`)
      }
    }
  }
  
  return result
}

/**
 * Validate program structure
 */
export function validateProgramStructure(
  program: ProgramToValidate
): ProgramValidationResult['structureValidation'] {
  const result: ProgramValidationResult['structureValidation'] = {
    hasValidSessions: false,
    duplicateExercises: [],
    emptyBlocks: [],
    orderingIssues: [],
  }
  
  const sessions = program.sessions || []
  result.hasValidSessions = sessions.length > 0
  
  sessions.forEach((session, sessionIndex) => {
    const usedIds = new Set<string>()
    const exercises = session.exercises || []
    
    // Check for duplicates
    for (const ex of exercises) {
      const id = ex.exercise?.id || ex.id
      if (id && usedIds.has(id)) {
        result.duplicateExercises.push({ sessionIndex, exerciseId: id })
      }
      if (id) usedIds.add(id)
    }
    
    // Check for empty blocks
    if (session.trainingBlocks) {
      for (const block of session.trainingBlocks) {
        if (!block.exercises || block.exercises.length === 0) {
          result.emptyBlocks.push({
            sessionIndex,
            blockName: block.name || 'unnamed',
          })
        }
      }
    }
    
    // Check ordering - skill before heavy strength
    let foundHeavyStrength = false
    for (const ex of exercises) {
      const category = ex.exercise?.category
      const neuralDemand = ex.exercise?.neuralDemand
      
      if (category === 'strength' && (neuralDemand || 0) >= 3) {
        foundHeavyStrength = true
      }
      
      if (foundHeavyStrength && category === 'skill') {
        result.orderingIssues.push(
          `Session ${sessionIndex + 1}: Skill exercise placed after heavy strength`
        )
      }
    }
  })
  
  return result
}

/**
 * Validate volume is plausible
 */
export function validateProgramVolume(
  program: ProgramToValidate
): ProgramValidationResult['volumeValidation'] {
  const result: ProgramValidationResult['volumeValidation'] = {
    isPlausible: true,
    totalSets: 0,
    issues: [],
  }
  
  const sessions = program.sessions || []
  
  for (const session of sessions) {
    const exercises = session.exercises || []
    let sessionSets = 0
    
    for (const ex of exercises) {
      const sets = typeof ex.sets === 'number' ? ex.sets : 0
      sessionSets += sets
      result.totalSets += sets
    }
    
    // Check for absurd set totals per session
    if (sessionSets > 40) {
      result.isPlausible = false
      result.issues.push(
        `Session ${session.dayNumber || '?'}: ${sessionSets} sets is excessive`
      )
    }
    
    if (sessionSets === 0 && exercises.length > 0) {
      result.issues.push(
        `Session ${session.dayNumber || '?'}: No sets defined for ${exercises.length} exercises`
      )
    }
  }
  
  // Check total weekly volume
  const weeklyDays = sessions.length
  const avgSetsPerDay = weeklyDays > 0 ? result.totalSets / weeklyDays : 0
  
  if (avgSetsPerDay > 30) {
    result.issues.push(`Average ${avgSetsPerDay.toFixed(1)} sets/day may be excessive`)
  }
  
  return result
}

/**
 * Validate equipment requirements are respected
 */
export function validateProgramEquipment(
  program: ProgramToValidate,
  availableEquipment?: string[]
): ProgramValidationResult['equipmentValidation'] {
  const result: ProgramValidationResult['equipmentValidation'] = {
    isRespected: true,
    violations: [],
  }
  
  if (!availableEquipment || availableEquipment.length === 0) {
    // No equipment restrictions
    return result
  }
  
  const sessions = program.sessions || []
  
  for (const session of sessions) {
    const exercises = session.exercises || []
    
    for (const ex of exercises) {
      const equipment = ex.exercise?.equipment || []
      
      // Check if any required equipment is not available
      for (const req of equipment) {
        if (req !== 'floor' && !availableEquipment.includes(req)) {
          result.isRespected = false
          result.violations.push(
            `${ex.exercise?.name || ex.name || 'Unknown'} requires ${req}`
          )
        }
      }
    }
  }
  
  return result
}

/**
 * Validate biomechanical coherence using movement intelligence
 */
export function validateBiomechanicalCoherence(
  program: ProgramToValidate
): ProgramValidationResult['biomechanicalValidation'] {
  const result: ProgramValidationResult['biomechanicalValidation'] = {
    isCoherent: true,
    sessionCoherence: [],
    weeklyAnalysis: {
      straightArmDays: 0,
      pushPullRatio: 0,
      warnings: [],
      recommendations: [],
    },
  }
  
  const sessions = program.sessions || []
  const sessionExerciseSets: MovementIntelligentExercise[][] = []
  
  // Process each session
  for (const session of sessions) {
    const exercises = session.exercises || []
    const movementIntelligentExercises: MovementIntelligentExercise[] = []
    
    for (const ex of exercises) {
      const exerciseId = ex.exercise?.id || ex.id
      if (!exerciseId) continue
      
      const dbExercise = getExerciseById(exerciseId)
      if (dbExercise) {
        const movementIntel = normalizeToMovementIntelligent(dbExercise)
        movementIntelligentExercises.push(movementIntel)
      }
    }
    
    sessionExerciseSets.push(movementIntelligentExercises)
    
    // Validate session coherence
    if (movementIntelligentExercises.length > 0) {
      const coherenceCheck = validateSessionCoherence(movementIntelligentExercises)
      result.sessionCoherence.push({
        dayNumber: session.dayNumber || result.sessionCoherence.length + 1,
        passed: coherenceCheck.passed,
        warnings: coherenceCheck.warnings,
      })
      
      if (!coherenceCheck.passed) {
        result.isCoherent = false
      }
    }
  }
  
  // Validate weekly coherence
  if (sessionExerciseSets.length > 0 && sessionExerciseSets.some(s => s.length > 0)) {
    const weeklyCoherence = validateWeeklyCoherence(sessionExerciseSets)
    const weeklyAnalysis = analyzeWeeklyPatterns(sessionExerciseSets)
    
    result.weeklyAnalysis = {
      straightArmDays: weeklyAnalysis.totalStraightArmSessions,
      pushPullRatio: weeklyAnalysis.pushPullRatio,
      warnings: [...weeklyCoherence.warnings, ...weeklyAnalysis.warnings],
      recommendations: [...weeklyCoherence.suggestions, ...weeklyAnalysis.recommendations],
    }
    
    if (!weeklyCoherence.passed) {
      result.isCoherent = false
    }
  }
  
  console.log('[program-validate] Biomechanical coherence:', {
    isCoherent: result.isCoherent,
    sessionsChecked: result.sessionCoherence.length,
    weeklyWarnings: result.weeklyAnalysis.warnings.length,
  })
  
  return result
}

/**
 * Full program validation
 */
export function validateProgramFromDatabase(
  program: ProgramToValidate,
  context?: {
    availableEquipment?: string[]
    strictMode?: boolean
  }
): ProgramValidationResult {
  console.log('[program-validate] Starting validation')
  
  const diagnostics: string[] = []
  
  // Run all validations
  const exerciseValidation = validateProgramExercises(program)
  const structureValidation = validateProgramStructure(program)
  const volumeValidation = validateProgramVolume(program)
  const equipmentValidation = validateProgramEquipment(
    program,
    context?.availableEquipment
  )
  const biomechanicalValidation = validateBiomechanicalCoherence(program)
  
  // Build diagnostics
  diagnostics.push(
    `Exercises: ${exerciseValidation.valid}/${exerciseValidation.total} DB-backed`
  )
  
  if (exerciseValidation.missingDbSource.length > 0) {
    diagnostics.push(
      `Missing DB source: ${exerciseValidation.missingDbSource.slice(0, 3).join(', ')}${
        exerciseValidation.missingDbSource.length > 3 
          ? ` (+${exerciseValidation.missingDbSource.length - 3} more)` 
          : ''
      }`
    )
  }
  
  if (structureValidation.duplicateExercises.length > 0) {
    diagnostics.push(
      `Duplicate exercises in sessions: ${structureValidation.duplicateExercises.length}`
    )
  }
  
  if (volumeValidation.issues.length > 0) {
    diagnostics.push(...volumeValidation.issues.slice(0, 2))
  }
  
  if (!equipmentValidation.isRespected) {
    diagnostics.push(`Equipment violations: ${equipmentValidation.violations.length}`)
  }
  
  // Biomechanical coherence diagnostics
  if (!biomechanicalValidation.isCoherent) {
    diagnostics.push(`Biomechanical coherence issues detected`)
    const failedSessions = biomechanicalValidation.sessionCoherence
      .filter(s => !s.passed)
      .map(s => `Day ${s.dayNumber}`)
    if (failedSessions.length > 0) {
      diagnostics.push(`Sessions with warnings: ${failedSessions.join(', ')}`)
    }
  }
  
  if (biomechanicalValidation.weeklyAnalysis.warnings.length > 0) {
    diagnostics.push(...biomechanicalValidation.weeklyAnalysis.warnings.slice(0, 2))
  }
  
  // Determine overall validity
  const isValid = 
    exerciseValidation.invalid === 0 &&
    structureValidation.hasValidSessions &&
    structureValidation.duplicateExercises.length === 0 &&
    volumeValidation.isPlausible &&
    (context?.strictMode ? equipmentValidation.isRespected : true) &&
    (context?.strictMode ? biomechanicalValidation.isCoherent : true)
  
  // ENGINE PROOF: Verify movement intelligence is being used
  const sessionsWithMoveData = biomechanicalValidation.sessionCoherence.filter(s => s.passed).length
  verifyMovementIntelligence(exerciseValidation.total, sessionsWithMoveData > 0 ? exerciseValidation.valid : 0)
  
  // ENGINE PROOF: Record QA validation result
  verifyQaValidation(isValid, diagnostics)
  recordIntegrationProof('qa_validation', `program validation ${isValid ? 'passed' : 'failed'}`, {
    exerciseCount: exerciseValidation.total,
    validExercises: exerciseValidation.valid,
    biomechanicalCoherent: biomechanicalValidation.isCoherent,
  })
  
  console.log('[program-validate] Validation complete:', {
  isValid,
  exerciseValid: exerciseValidation.invalid === 0,
  structureValid: structureValidation.hasValidSessions,
  volumeValid: volumeValidation.isPlausible,
  biomechanicalCoherent: biomechanicalValidation.isCoherent,
  })
  
  return {
    isValid,
    exerciseValidation,
    structureValidation,
    volumeValidation,
    equipmentValidation,
    biomechanicalValidation,
    diagnostics,
  }
}

/**
 * Quick validation check - returns boolean only
 */
export function isValidProgram(program: ProgramToValidate): boolean {
  const result = validateProgramFromDatabase(program)
  return result.isValid
}

/**
 * Validate and log issues - for debugging
 */
export function validateAndLogProgram(
  program: ProgramToValidate,
  label: string = 'Program'
): boolean {
  const result = validateProgramFromDatabase(program)
  
  if (!result.isValid) {
    console.warn(`[program-validate] ${label} validation failed:`, result.diagnostics)
    
    if (result.exerciseValidation.missingDbSource.length > 0) {
      console.warn(
        `[program-validate] Exercises missing DB source:`,
        result.exerciseValidation.missingDbSource
      )
    }
    
    if (result.structureValidation.orderingIssues.length > 0) {
      console.warn(
        `[program-validate] Ordering issues:`,
        result.structureValidation.orderingIssues
      )
    }
  } else {
    console.log(`[program-validate] ${label} passed validation`)
  }
  
  return result.isValid
}
