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
 * - Flexibility priority adjustment
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
  flexibilityPriority: {
    alwaysMinor: true,
    impact: 'Mobility and flexibility work allocation will adjust',
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
      case 'flexibilityPriority':
        adaptations.push({
          type: 'emphasis',
          description: 'Mobility and flexibility allocation updated',
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
// STYLE CHANGE HANDLING
// =============================================================================

import type { TrainingStyleMode } from './training-style-service'
import { STYLE_MODE_DEFINITIONS } from './training-style-service'

/**
 * Determine if a style change is fundamental (requires full regen) or minor (partial regen)
 * 
 * Fundamental shifts: strength↔skill, power↔endurance, extreme methodology changes
 * Minor shifts: balanced→any specific, specific→balanced, adjacent styles
 */
export function isFundamentalStyleShift(oldStyle: TrainingStyleMode | string, newStyle: TrainingStyleMode | string): boolean {
  // Define fundamental axis shifts - opposite ends of methodology spectrums
  const fundamentalPairs = [
    ['skill_focused', 'strength_focused'],
    ['skill_focused', 'power_focused'],
    ['power_focused', 'endurance_focused'],
    ['strength_focused', 'endurance_focused'],
  ]

  for (const pair of fundamentalPairs) {
    if ((oldStyle === pair[0] && newStyle === pair[1]) || (oldStyle === pair[1] && newStyle === pair[0])) {
      return true
    }
  }

  return false
}

/**
 * Get style change regeneration strategy
 */
export function getStyleChangeRegenerationStrategy(
  oldStyle: TrainingStyleMode | string,
  newStyle: TrainingStyleMode | string
): {
  regenerationType: 'full' | 'partial'
  preserveWeekNumber: boolean
  updateSessionStructure: boolean
  updateExerciseSelection: boolean
  explanation: string
} {
  const fundamental = isFundamentalStyleShift(oldStyle, newStyle)
  
  if (fundamental) {
    return {
      regenerationType: 'full',
      preserveWeekNumber: true,
      updateSessionStructure: true,
      updateExerciseSelection: true,
      explanation: `Regenerating program structure for shift from ${oldStyle} to ${newStyle}. All your progress is preserved.`,
    }
  }

  // Adjacent or hybrid changes - partial regeneration
  return {
    regenerationType: 'partial',
    preserveWeekNumber: true,
    updateSessionStructure: true,
    updateExerciseSelection: false, // Exercise pool stays mostly the same
    explanation: `Updating program approach from ${oldStyle} to ${newStyle}. Continuing your progression.`,
  }
}

/**
 * Generate style change coaching message with continuity emphasis
 */
export function getStyleChangeCoachingMessage(
  oldStyle: TrainingStyleMode | string,
  newStyle: TrainingStyleMode | string,
  regenerationType: 'full' | 'partial'
): string {
  const oldLabel = typeof oldStyle === 'string' 
    ? (STYLE_MODE_DEFINITIONS[oldStyle as TrainingStyleMode]?.label || oldStyle.replace(/_/g, ' '))
    : oldStyle

  const newLabel = typeof newStyle === 'string'
    ? (STYLE_MODE_DEFINITIONS[newStyle as TrainingStyleMode]?.label || newStyle.replace(/_/g, ' '))
    : newStyle

  if (regenerationType === 'full') {
    return `Your training style has been updated from ${oldLabel} to ${newLabel}. SpartanLab has regenerated your program structure to match the new approach. All your progress, skill advancement, and workout history have been preserved—you're continuing from where you left off, just with a new training method.`
  } else {
    return `Your training style has been adjusted from ${oldLabel} to ${newLabel}. Your current program structure has been updated to reflect the new approach while maintaining your progression continuity. Your week counter and progress continue uninterrupted.`
  }
}

// =============================================================================
// FRAMEWORK AND ENVELOPE INTEGRATION
// =============================================================================

import type { CoachingFrameworkId } from './coaching-framework-engine'
import type { PerformanceEnvelope } from './performance-envelope-engine'

/**
 * Determine if a framework change should trigger regeneration
 * Only triggers for meaningful framework changes, not every re-evaluation
 */
export function shouldRegenerateForFramework(
  currentFrameworkId: string | null,
  newFrameworkId: string,
  confidenceScore: number,
  weeksOnCurrent: number
): { shouldRegenerate: boolean; reason: string | null } {
  // If no current framework, this is initial assignment
  if (!currentFrameworkId) {
    return { shouldRegenerate: false, reason: null }
  }
  
  // Same framework - no change needed
  if (currentFrameworkId === newFrameworkId) {
    return { shouldRegenerate: false, reason: null }
  }
  
  // Framework stability protection - minimum 4 weeks before switching
  if (weeksOnCurrent < 4) {
    return { 
      shouldRegenerate: false, 
      reason: 'Framework switch deferred (minimum stability period not met)' 
    }
  }
  
  // Low confidence - don't switch yet
  if (confidenceScore < 0.6) {
    return { 
      shouldRegenerate: false, 
      reason: 'Framework switch deferred (selection confidence too low)' 
    }
  }
  
  // Framework change is warranted
  return {
    shouldRegenerate: true,
    reason: `Training methodology updated from ${formatFrameworkName(currentFrameworkId)} to ${formatFrameworkName(newFrameworkId)}`
  }
}

function formatFrameworkName(frameworkId: string): string {
  const names: Record<string, string> = {
    skill_frequency: 'Skill Frequency',
    barseagle_strength: 'Strength-Focused',
    strength_conversion: 'Strength Conversion',
    density_endurance: 'Density Endurance',
    hypertrophy_supported: 'Hypertrophy-Supported',
    tendon_conservative: 'Tendon-Conservative',
    balanced_hybrid: 'Balanced Hybrid',
  }
  return names[frameworkId] || frameworkId.replace(/_/g, ' ')
}

/**
 * Validate that Performance Envelope is preserved during regeneration
 */
export function validateEnvelopePreservation(
  envelopesBefore: PerformanceEnvelope[],
  envelopesAfter: PerformanceEnvelope[]
): { preserved: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Check that all movement families are retained
  const beforeFamilies = new Set(envelopesBefore.map(e => e.movementFamily))
  const afterFamilies = new Set(envelopesAfter.map(e => e.movementFamily))
  
  for (const family of beforeFamilies) {
    if (!afterFamilies.has(family)) {
      issues.push(`Envelope for ${family} was lost during regeneration`)
    }
  }
  
  // Check that confidence scores weren't reset
  for (const before of envelopesBefore) {
    const after = envelopesAfter.find(e => 
      e.movementFamily === before.movementFamily && e.goalType === before.goalType
    )
    if (after && after.confidenceScore < before.confidenceScore * 0.8) {
      issues.push(`Confidence score dropped significantly for ${before.movementFamily}`)
    }
  }
  
  return {
    preserved: issues.length === 0,
    issues,
  }
}

// =============================================================================
// BENCHMARK CHANGE HANDLING
// =============================================================================

interface BenchmarkChange {
  type: 'pull_up' | 'dip' | 'push_up' | 'weighted_pull' | 'weighted_dip' | 'hold_time'
  oldValue: number | null
  newValue: number
  percentChange: number
  isSignificant: boolean
}

/**
 * Analyze benchmark changes to determine regeneration necessity
 * 
 * Minor benchmark updates (small improvements): no regeneration
 * Significant benchmark updates (large jumps/drops): trigger recalibration
 */
export function analyzeBenchmarkChanges(
  previousBenchmarks: {
    pullUpMax?: number | null
    dipMax?: number | null
    pushUpMax?: number | null
    weightedPullUpMax?: number | null
    weightedDipMax?: number | null
    maxHoldSeconds?: number | null
  },
  currentBenchmarks: typeof previousBenchmarks
): {
  changes: BenchmarkChange[]
  requiresRecalibration: boolean
  generationReason: GenerationReason | null
  coachingMessage: string
} {
  const changes: BenchmarkChange[] = []
  let requiresRecalibration = false
  
  // Check each benchmark type
  const benchmarkTypes: Array<{
    key: keyof typeof previousBenchmarks
    type: BenchmarkChange['type']
    significantThreshold: number // Percentage change to be significant
  }> = [
    { key: 'pullUpMax', type: 'pull_up', significantThreshold: 30 },
    { key: 'dipMax', type: 'dip', significantThreshold: 30 },
    { key: 'pushUpMax', type: 'push_up', significantThreshold: 25 },
    { key: 'weightedPullUpMax', type: 'weighted_pull', significantThreshold: 20 },
    { key: 'weightedDipMax', type: 'weighted_dip', significantThreshold: 20 },
    { key: 'maxHoldSeconds', type: 'hold_time', significantThreshold: 50 },
  ]
  
  for (const { key, type, significantThreshold } of benchmarkTypes) {
    const oldVal = previousBenchmarks[key]
    const newVal = currentBenchmarks[key]
    
    if (newVal != null && (oldVal == null || oldVal !== newVal)) {
      const percentChange = oldVal != null && oldVal > 0 
        ? Math.abs((newVal - oldVal) / oldVal) * 100
        : 100 // New benchmark where none existed
      
      const isSignificant = percentChange >= significantThreshold
      
      changes.push({
        type,
        oldValue: oldVal ?? null,
        newValue: newVal,
        percentChange,
        isSignificant,
      })
      
      if (isSignificant) {
        requiresRecalibration = true
      }
    }
  }
  
  // Generate coaching message
  let coachingMessage = ''
  if (changes.length === 0) {
    coachingMessage = 'Your benchmarks are up to date.'
  } else if (!requiresRecalibration) {
    coachingMessage = 'Your benchmarks have been updated. Training intensity will adjust accordingly.'
  } else {
    const significantChanges = changes.filter(c => c.isSignificant)
    coachingMessage = `Significant strength update detected. Your program has been recalibrated to match your current ${
      significantChanges.map(c => c.type.replace(/_/g, ' ')).join(', ')
    } capacity.`
  }
  
  return {
    changes,
    requiresRecalibration,
    generationReason: requiresRecalibration ? 'benchmark_update' : null,
    coachingMessage,
  }
}

// =============================================================================
// FIRST-SESSION AND RESUME LOGIC INTEGRATION
// =============================================================================

export type SessionState = 'not_started' | 'in_progress' | 'completed'

/**
 * Determine how to handle regeneration based on current session state
 */
export function getRegenerationSessionStrategy(
  sessionState: SessionState,
  regenerationReason: GenerationReason
): {
  archiveCurrentSession: boolean
  useNewVersionImmediately: boolean
  preservePartialProgress: boolean
  message: string
} {
  switch (sessionState) {
    case 'not_started':
      // Session hasn't begun - use new version immediately
      return {
        archiveCurrentSession: false,
        useNewVersionImmediately: true,
        preservePartialProgress: false,
        message: 'Your next session will use your updated program.',
      }
    
    case 'in_progress':
      // User is in mid-session - preserve their work
      return {
        archiveCurrentSession: true, // Archive the partial log
        useNewVersionImmediately: false, // Let them finish current
        preservePartialProgress: true,
        message: 'Complete your current session. Your next workout will use the updated program.',
      }
    
    case 'completed':
      // Session complete - new version takes effect next time
      return {
        archiveCurrentSession: false,
        useNewVersionImmediately: true,
        preservePartialProgress: false,
        message: 'Your program has been updated for your next session.',
      }
    
    default:
      return {
        archiveCurrentSession: false,
        useNewVersionImmediately: true,
        preservePartialProgress: false,
        message: 'Your program has been updated.',
      }
  }
}

// =============================================================================
// DUPLICATE REGENERATION PREVENTION
// =============================================================================

interface RegenerationEvent {
  timestamp: number
  reason: GenerationReason
  changeHash: string
}

const regenerationHistory = new Map<string, RegenerationEvent[]>()

/**
 * Check if this exact change combination was already processed recently
 * Prevents duplicate regenerations from rapid settings saves
 */
export function isDuplicateRegeneration(
  athleteId: string,
  reason: GenerationReason,
  changes: SettingsChange[]
): boolean {
  const history = regenerationHistory.get(athleteId) || []
  const changeHash = computeChangeHash(changes)
  
  // Check if identical change was processed in last 30 seconds
  const recentDuplicate = history.find(event => 
    event.changeHash === changeHash &&
    event.reason === reason &&
    Date.now() - event.timestamp < 30000
  )
  
  return !!recentDuplicate
}

/**
 * Record a regeneration event for duplicate detection
 */
export function recordRegenerationEvent(
  athleteId: string,
  reason: GenerationReason,
  changes: SettingsChange[]
): void {
  const history = regenerationHistory.get(athleteId) || []
  const changeHash = computeChangeHash(changes)
  
  // Add new event
  history.push({
    timestamp: Date.now(),
    reason,
    changeHash,
  })
  
  // Keep only last 10 events
  if (history.length > 10) {
    history.shift()
  }
  
  regenerationHistory.set(athleteId, history)
}

function computeChangeHash(changes: SettingsChange[]): string {
  return changes
    .map(c => `${c.field}:${JSON.stringify(c.newValue)}`)
    .sort()
    .join('|')
}

// =============================================================================
// DASHBOARD / SESSION ALIGNMENT VERIFICATION
// =============================================================================

export interface AlignmentCheckResult {
  aligned: boolean
  issues: string[]
  dashboardVersionId: string | null
  nextWorkoutVersionId: string | null
  sessionPageVersionId: string | null
  activeVersionId: string | null
}

/**
 * Verify that dashboard, next workout card, and session page all reference
 * the same active program version
 * 
 * This should be called after any regeneration to catch misalignment
 */
export function verifyDashboardSessionAlignment(
  activeVersionId: string | null,
  dashboardVersionId: string | null,
  nextWorkoutVersionId: string | null,
  sessionPageVersionId: string | null
): AlignmentCheckResult {
  const issues: string[] = []
  
  // If no active version, we're in a pre-program state
  if (!activeVersionId) {
    return {
      aligned: true,
      issues: [],
      dashboardVersionId,
      nextWorkoutVersionId,
      sessionPageVersionId,
      activeVersionId,
    }
  }
  
  // Check each component against the active version
  if (dashboardVersionId && dashboardVersionId !== activeVersionId) {
    issues.push('Dashboard references outdated program version')
  }
  
  if (nextWorkoutVersionId && nextWorkoutVersionId !== activeVersionId) {
    issues.push('Next workout card references outdated program version')
  }
  
  if (sessionPageVersionId && sessionPageVersionId !== activeVersionId) {
    issues.push('Session page references outdated program version')
  }
  
  return {
    aligned: issues.length === 0,
    issues,
    dashboardVersionId,
    nextWorkoutVersionId,
    sessionPageVersionId,
    activeVersionId,
  }
}

/**
 * Get instructions for recovering from misalignment
 */
export function getAlignmentRecoveryInstructions(checkResult: AlignmentCheckResult): {
  action: 'none' | 'refresh' | 'clear_cache' | 'regenerate'
  message: string
} {
  if (checkResult.aligned) {
    return { action: 'none', message: 'All systems aligned.' }
  }
  
  // Most common fix is refreshing the page
  if (checkResult.issues.length === 1) {
    return {
      action: 'refresh',
      message: 'Please refresh the page to see your updated program.',
    }
  }
  
  // Multiple misalignments might need cache clearing
  if (checkResult.issues.length > 1) {
    return {
      action: 'clear_cache',
      message: 'Multiple alignment issues detected. Clear your browser cache and refresh.',
    }
  }
  
  return {
    action: 'regenerate',
    message: 'Unable to resolve alignment. Your program may need to be regenerated.',
  }
}

// =============================================================================
// SKILL STATE CONTINUITY PROTECTION
// =============================================================================

/**
 * Verify that SkillState is preserved during regeneration
 * Returns true if skill progress is intact
 */
export function validateSkillStateContinuity(
  skillsBefore: Array<{ skill: string; currentLevel: string; readinessScore: number }>,
  skillsAfter: Array<{ skill: string; currentLevel: string; readinessScore: number }>
): { preserved: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  // Every skill that existed before should still exist
  for (const before of skillsBefore) {
    const after = skillsAfter.find(s => s.skill === before.skill)
    
    if (!after) {
      warnings.push(`Skill state lost for ${before.skill}`)
      continue
    }
    
    // Level should never decrease due to settings change alone
    // (only through explicit skill regression which is separate)
    const levelsBefore = getLevelNumericValue(before.currentLevel)
    const levelsAfter = getLevelNumericValue(after.currentLevel)
    
    if (levelsAfter < levelsBefore) {
      warnings.push(`Skill level regressed for ${before.skill} (${before.currentLevel} -> ${after.currentLevel})`)
    }
  }
  
  return {
    preserved: warnings.length === 0,
    warnings,
  }
}

function getLevelNumericValue(level: string): number {
  const levelMap: Record<string, number> = {
    'none': 0,
    'beginner': 1,
    'tuck': 2,
    'adv_tuck': 3,
    'advanced_tuck': 3,
    'one_leg': 4,
    'straddle': 5,
    'half_lay': 6,
    'full': 7,
    'advanced': 8,
  }
  return levelMap[level.toLowerCase()] ?? 0
}

// =============================================================================
// EXPORT SUMMARY
// =============================================================================

export {
  MINOR_CHANGE_RULES,
  STRUCTURAL_CHANGE_RULES,
  MAJOR_EQUIPMENT,
}
