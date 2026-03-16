// Settings Regeneration Service
// Intelligent handling of settings changes to maintain training continuity
// 
// DESIGN PRINCIPLE: Settings changes should behave like a coach adjusting the plan.
// - Small changes → small adjustments (no new version)
// - Major changes → structured regeneration (new version)

import type { AthleteProfile } from './data-service'
import type { GenerationReason, ProgramVersion, RegenerationTrigger } from './program-version-service'

// =============================================================================
// CHANGE CLASSIFICATION
// =============================================================================

export type ChangeCategory = 'minor' | 'structural'

export interface SettingsChange {
  field: string
  oldValue: unknown
  newValue: unknown
  category: ChangeCategory
  impact: string
  affectsFutureSessions: boolean
  requiresNewVersion: boolean
}

export interface SettingsChangeAnalysis {
  changes: SettingsChange[]
  overallCategory: ChangeCategory
  requiresRegeneration: boolean
  generationReason: GenerationReason | null
  explanation: string
  coachingMessage: string
  affectedSystems: string[]
}

// =============================================================================
// CHANGE CLASSIFICATION RULES
// =============================================================================

/**
 * MINOR ADJUSTMENTS - Modify future sessions without new ProgramVersion
 * 
 * - Session duration change (small: ±15 min)
 * - Training style preference adjustment
 * - Minor equipment addition
 * - Weakest area update
 * - Experience level update (affects estimates only)
 */
const MINOR_CHANGE_RULES: Record<string, {
  threshold?: (old: unknown, newVal: unknown) => boolean
  alwaysMinor?: boolean
  impact: string
}> = {
  sessionLengthMinutes: {
    threshold: (old, newVal) => Math.abs(Number(old) - Number(newVal)) <= 15,
    impact: 'Session pacing and accessory work will adjust',
  },
  weakestArea: {
    alwaysMinor: true,
    impact: 'Programming emphasis will shift to address your weakness',
  },
  experienceLevel: {
    alwaysMinor: true,
    impact: 'Progression timeline estimates will update',
  },
  bodyweight: {
    alwaysMinor: true,
    impact: 'Intensity calculations will adjust',
  },
}

/**
 * STRUCTURAL CHANGES - Require new ProgramVersion
 * 
 * - Training frequency change
 * - Primary skill goal change
 * - Major equipment change (bars, rings, dip stations)
 * - Joint caution change (affects movement selection)
 * - Large session duration change (>15 min)
 * - Training style change
 */
const STRUCTURAL_CHANGE_RULES: Record<string, {
  reason: GenerationReason
  impact: string
}> = {
  trainingDaysPerWeek: {
    reason: 'settings_schedule_change',
    impact: 'Weekly structure and recovery patterns will be redesigned',
  },
  primaryGoal: {
    reason: 'settings_goal_change',
    impact: 'Training emphasis and skill focus will shift completely',
  },
  trainingStyle: {
    reason: 'settings_style_change',
    impact: 'Rep schemes, density, and methodology will update',
  },
}

// Major equipment that triggers structural changes
const MAJOR_EQUIPMENT = ['pullup_bar', 'dip_bars', 'rings', 'weight_belt'] as const

// =============================================================================
// CHANGE ANALYSIS
// =============================================================================

/**
 * Analyze settings changes to determine regeneration behavior
 */
export function analyzeSettingsChanges(
  previous: AthleteProfile,
  current: AthleteProfile & { trainingStyle?: string }
): SettingsChangeAnalysis {
  const changes: SettingsChange[] = []
  let overallCategory: ChangeCategory = 'minor'
  let generationReason: GenerationReason | null = null
  const affectedSystems: string[] = []

  // Check training days
  if (previous.trainingDaysPerWeek !== current.trainingDaysPerWeek) {
    changes.push({
      field: 'trainingDaysPerWeek',
      oldValue: previous.trainingDaysPerWeek,
      newValue: current.trainingDaysPerWeek,
      category: 'structural',
      impact: STRUCTURAL_CHANGE_RULES.trainingDaysPerWeek.impact,
      affectsFutureSessions: true,
      requiresNewVersion: true,
    })
    overallCategory = 'structural'
    generationReason = 'settings_schedule_change'
    affectedSystems.push('weekly_structure', 'recovery_timing')
  }

  // Check session duration
  const durationDiff = Math.abs(
    (previous.sessionLengthMinutes || 60) - (current.sessionLengthMinutes || 60)
  )
  if (durationDiff > 0) {
    const isMinor = durationDiff <= 15
    changes.push({
      field: 'sessionLengthMinutes',
      oldValue: previous.sessionLengthMinutes,
      newValue: current.sessionLengthMinutes,
      category: isMinor ? 'minor' : 'structural',
      impact: isMinor 
        ? 'Session pacing will adjust slightly'
        : 'Session structure will be redesigned',
      affectsFutureSessions: true,
      requiresNewVersion: !isMinor,
    })
    if (!isMinor) {
      overallCategory = 'structural'
      if (!generationReason) generationReason = 'settings_schedule_change'
      affectedSystems.push('session_structure')
    } else {
      affectedSystems.push('session_pacing')
    }
  }

  // Check primary goal
  if (previous.primaryGoal !== current.primaryGoal) {
    changes.push({
      field: 'primaryGoal',
      oldValue: previous.primaryGoal,
      newValue: current.primaryGoal,
      category: 'structural',
      impact: STRUCTURAL_CHANGE_RULES.primaryGoal.impact,
      affectsFutureSessions: true,
      requiresNewVersion: true,
    })
    overallCategory = 'structural'
    generationReason = 'settings_goal_change'
    affectedSystems.push('skill_focus', 'exercise_selection', 'progression_paths')
  }

  // Check training style
  const prevStyle = (previous as AthleteProfile & { trainingStyle?: string }).trainingStyle
  const currStyle = current.trainingStyle
  if (prevStyle !== currStyle) {
    changes.push({
      field: 'trainingStyle',
      oldValue: prevStyle,
      newValue: currStyle,
      category: 'structural',
      impact: STRUCTURAL_CHANGE_RULES.trainingStyle.impact,
      affectsFutureSessions: true,
      requiresNewVersion: true,
    })
    overallCategory = 'structural'
    if (!generationReason) generationReason = 'settings_style_change'
    affectedSystems.push('rep_schemes', 'rest_periods', 'methodology')
  }

  // Check equipment changes
  const oldEquip = new Set(previous.equipmentAvailable || [])
  const newEquip = new Set(current.equipmentAvailable || [])
  const equipAdded = [...newEquip].filter(e => !oldEquip.has(e))
  const equipRemoved = [...oldEquip].filter(e => !newEquip.has(e))
  
  if (equipAdded.length > 0 || equipRemoved.length > 0) {
    const isMajorChange = [...equipAdded, ...equipRemoved].some(e => 
      MAJOR_EQUIPMENT.includes(e as typeof MAJOR_EQUIPMENT[number])
    )
    
    changes.push({
      field: 'equipment',
      oldValue: Array.from(oldEquip),
      newValue: Array.from(newEquip),
      category: isMajorChange ? 'structural' : 'minor',
      impact: isMajorChange 
        ? 'Exercise selection will be restructured for your equipment'
        : 'Some exercises will be substituted',
      affectsFutureSessions: true,
      requiresNewVersion: isMajorChange,
    })
    
    if (isMajorChange) {
      overallCategory = 'structural'
      if (!generationReason) generationReason = 'settings_equipment_change'
      affectedSystems.push('exercise_selection', 'movement_patterns')
    } else {
      affectedSystems.push('exercise_variants')
    }
  }

  // Check joint cautions
  const oldJoints = new Set(previous.jointCautions || [])
  const newJoints = new Set(current.jointCautions || [])
  const jointsAdded = [...newJoints].filter(j => !oldJoints.has(j))
  const jointsRemoved = [...oldJoints].filter(j => !newJoints.has(j))
  
  if (jointsAdded.length > 0 || jointsRemoved.length > 0) {
    changes.push({
      field: 'jointCautions',
      oldValue: Array.from(oldJoints),
      newValue: Array.from(newJoints),
      category: 'structural',
      impact: 'Exercise selection will adapt to protect flagged joints',
      affectsFutureSessions: true,
      requiresNewVersion: true,
    })
    overallCategory = 'structural'
    if (!generationReason) generationReason = 'injury_status_change'
    affectedSystems.push('exercise_selection', 'movement_restrictions')
  }

  // Check weakest area (minor change)
  if (previous.weakestArea !== current.weakestArea) {
    changes.push({
      field: 'weakestArea',
      oldValue: previous.weakestArea,
      newValue: current.weakestArea,
      category: 'minor',
      impact: MINOR_CHANGE_RULES.weakestArea.impact,
      affectsFutureSessions: true,
      requiresNewVersion: false,
    })
    affectedSystems.push('programming_emphasis')
  }

  // Check experience level (minor change)
  if (previous.experienceLevel !== current.experienceLevel) {
    changes.push({
      field: 'experienceLevel',
      oldValue: previous.experienceLevel,
      newValue: current.experienceLevel,
      category: 'minor',
      impact: MINOR_CHANGE_RULES.experienceLevel.impact,
      affectsFutureSessions: false, // Only affects estimates
      requiresNewVersion: false,
    })
    affectedSystems.push('progression_estimates')
  }

  // Check bodyweight (minor change)
  if (previous.bodyweight !== current.bodyweight) {
    changes.push({
      field: 'bodyweight',
      oldValue: previous.bodyweight,
      newValue: current.bodyweight,
      category: 'minor',
      impact: MINOR_CHANGE_RULES.bodyweight.impact,
      affectsFutureSessions: false, // Only affects intensity calcs
      requiresNewVersion: false,
    })
    affectedSystems.push('intensity_calculations')
  }

  // Generate explanation and coaching message
  const { explanation, coachingMessage } = generateChangeMessages(
    changes, 
    overallCategory, 
    generationReason
  )

  return {
    changes,
    overallCategory,
    requiresRegeneration: overallCategory === 'structural',
    generationReason,
    explanation,
    coachingMessage,
    affectedSystems: [...new Set(affectedSystems)],
  }
}

// =============================================================================
// MESSAGE GENERATION
// =============================================================================

function generateChangeMessages(
  changes: SettingsChange[],
  category: ChangeCategory,
  reason: GenerationReason | null
): { explanation: string; coachingMessage: string } {
  if (changes.length === 0) {
    return {
      explanation: 'No changes detected.',
      coachingMessage: 'Your settings are up to date.',
    }
  }

  const structuralChanges = changes.filter(c => c.category === 'structural')
  const minorChanges = changes.filter(c => c.category === 'minor')

  if (category === 'structural') {
    // Generate structural change messages
    const primaryChange = structuralChanges[0]
    let explanation = ''
    let coachingMessage = ''

    switch (reason) {
      case 'settings_goal_change':
        explanation = 'Your program was restructured for your new skill focus.'
        coachingMessage = 'Your training will now prioritize your updated goal. Previous skill progress is preserved.'
        break
      case 'settings_schedule_change':
        explanation = 'Your program was updated to match your new training schedule.'
        coachingMessage = 'Sessions have been optimized for your available training time.'
        break
      case 'settings_equipment_change':
        explanation = 'Your program was adjusted for your equipment changes.'
        coachingMessage = 'Exercise selection has been updated while maintaining your progression.'
        break
      case 'settings_style_change':
        explanation = 'Your training approach has been updated.'
        coachingMessage = 'Rep schemes and session structure now match your preferred style.'
        break
      case 'injury_status_change':
        explanation = 'Your program was adjusted for your joint status.'
        coachingMessage = 'Exercises have been modified to respect your flagged joints.'
        break
      default:
        explanation = 'Your program was updated based on your settings changes.'
        coachingMessage = 'Future sessions will reflect your updated preferences.'
    }

    return { explanation, coachingMessage }
  }

  // Minor changes only
  const changeDescriptions = minorChanges.map(c => c.impact).join(' ')
  return {
    explanation: 'Your settings were updated.',
    coachingMessage: changeDescriptions || 'Future sessions will reflect these adjustments.',
  }
}

// =============================================================================
// SESSION ADAPTATION (FOR MINOR CHANGES)
// =============================================================================

export interface SessionAdaptation {
  type: 'pacing' | 'emphasis' | 'intensity' | 'substitution'
  description: string
  applyToSessions: 'future' | 'current_and_future'
}

/**
 * Get session-level adaptations for minor changes
 * These don't require a new program version
 */
export function getSessionAdaptations(analysis: SettingsChangeAnalysis): SessionAdaptation[] {
  const adaptations: SessionAdaptation[] = []

  for (const change of analysis.changes) {
    if (change.category !== 'minor') continue

    switch (change.field) {
      case 'sessionLengthMinutes':
        adaptations.push({
          type: 'pacing',
          description: 'Accessory work volume adjusted for session length',
          applyToSessions: 'future',
        })
        break
      case 'weakestArea':
        adaptations.push({
          type: 'emphasis',
          description: `Programming emphasis shifted to ${String(change.newValue || 'balanced')}`,
          applyToSessions: 'future',
        })
        break
      case 'bodyweight':
        adaptations.push({
          type: 'intensity',
          description: 'Relative intensity calculations updated',
          applyToSessions: 'current_and_future',
        })
        break
      case 'equipment':
        // Minor equipment changes trigger substitutions
        adaptations.push({
          type: 'substitution',
          description: 'Exercise variants updated for available equipment',
          applyToSessions: 'future',
        })
        break
    }
  }

  return adaptations
}

// =============================================================================
// CONTINUITY GUARANTEES
// =============================================================================

/**
 * Systems that should NEVER be reset on settings changes:
 * - SkillState (skill progression memory)
 * - Readiness data (strength/weakness tracking)
 * - Workout logs (training history)
 * - Fatigue tracking (recovery state)
 */
export const PRESERVED_SYSTEMS = [
  'skill_state',
  'skill_readiness',
  'workout_logs',
  'fatigue_tracking',
  'strength_records',
  'readiness_history',
] as const

/**
 * Systems that may be updated on settings changes:
 * - Active program version
 * - Future session content
 * - Exercise selection pool
 * - Session structure
 */
export const UPDATABLE_SYSTEMS = [
  'program_version',
  'future_sessions',
  'exercise_pool',
  'session_structure',
  'weekly_structure',
] as const

/**
 * Validate that a regeneration operation preserves required data
 */
export function validateContinuityPreservation(
  analysis: SettingsChangeAnalysis
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  // Ensure no preserved systems are in affected systems
  for (const preserved of PRESERVED_SYSTEMS) {
    if (analysis.affectedSystems.includes(preserved)) {
      warnings.push(`Warning: ${preserved} should not be affected by settings changes`)
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  }
}

// =============================================================================
// DEBOUNCING / DUPLICATE PREVENTION
// =============================================================================

const recentRegenerations = new Map<string, number>()
const REGENERATION_COOLDOWN_MS = 5000 // 5 seconds

/**
 * Check if regeneration should be allowed (prevents rapid duplicate regenerations)
 */
export function canRegenerate(athleteId: string): boolean {
  const lastRegeneration = recentRegenerations.get(athleteId)
  if (!lastRegeneration) return true
  
  return Date.now() - lastRegeneration > REGENERATION_COOLDOWN_MS
}

/**
 * Mark that regeneration occurred (for debouncing)
 */
export function markRegeneration(athleteId: string): void {
  recentRegenerations.set(athleteId, Date.now())
}

/**
 * Clear regeneration cooldown (for testing or manual override)
 */
export function clearRegenerationCooldown(athleteId: string): void {
  recentRegenerations.delete(athleteId)
}

// =============================================================================
// EXPORT SUMMARY
// =============================================================================

export {
  MINOR_CHANGE_RULES,
  STRUCTURAL_CHANGE_RULES,
  MAJOR_EQUIPMENT,
}
