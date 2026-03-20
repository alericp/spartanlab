// Program History Versioning
// Manages program version archival and creation with reasonSummary generation
// Ensures no program data is ever lost when users change programs

import {
  createProgramHistoryEntry,
  archiveCurrentProgram,
  getNextProgramVersionNumber,
  getActiveProgramHistory,
  getProgramHistoryForUser,
} from './history-service'
import type {
  CreateProgramHistoryInput,
  ProgramHistory,
  AthleteInputsSnapshot,
  GoalsSnapshot,
  ProgramStructureSnapshot,
} from '@/types/history'
import type { AdaptiveProgram } from './adaptive-program-builder'
// Type-only import to avoid circular dependency with program-version-service
export type GenerationReason =
  | 'onboarding_initial_generation'
  | 'settings_schedule_change'
  | 'settings_equipment_change'
  | 'settings_goal_change'
  | 'settings_style_change'
  | 'fatigue_deload'
  | 'skill_priority_update'
  | 'benchmark_update'
  | 'adaptive_rebalance'
  | 'manual_regeneration'
  | 'injury_status_change'
  | 'framework_update'
import { getOnboardingProfile, type OnboardingProfile } from './athlete-profile'

// =============================================================================
// TYPES
// =============================================================================

export interface ProgramHistoryContext {
  userId: string
  program: AdaptiveProgram
  generationReason: GenerationReason
  onboardingProfile?: OnboardingProfile | null
  previousProgram?: ProgramHistory | null
}

export interface ProgramVersionResult {
  success: boolean
  programHistoryId: string | null
  versionNumber: number
  reasonSummary: string
  error?: string
}

// =============================================================================
// REASON SUMMARY GENERATION
// =============================================================================

/**
 * Generate a concise, professional explanation for why a program was created
 * Extended to support hybrid strength reasoning
 */
export function generateProgramReasonSummary(
  context: ProgramHistoryContext
): string {
  const { program, generationReason, onboardingProfile, previousProgram } = context
  
  // Build base context from program
  const goal = program.primaryGoal?.replace(/_/g, ' ') || 'skill progression'
  const days = program.trainingDaysPerWeek || 4
  const sessionMins = typeof program.sessionLength === 'number'
    ? program.sessionLength
    : parseInt(String(program.sessionLength)) || 60
  
  // Get equipment context
  const equipment = program.equipmentProfile?.available || []
  const hasLimitedEquipment = equipment.length <= 2 || 
    (equipment.length === 1 && equipment.includes('floor'))
  const equipmentNote = hasLimitedEquipment ? 'with limited equipment' : ''
  
  // Get constraint context from constraintInsight
  const constraint = program.constraintInsight?.primaryConstraint
  const constraintNote = constraint 
    ? `addressing ${String(constraint).replace(/_/g, ' ')} as primary limiter`
    : ''
  
  // Get style context from engineContext or recovery level
  const style = program.recoveryLevel || 'balanced'
  
  // Detect hybrid strength context
  const hasDeadlift = detectHybridElement(program, 'deadlift')
  const hasWeightedCalisthenics = detectHybridElement(program, 'weighted')
  const isHybrid = hasDeadlift || (hasWeightedCalisthenics && hasDeadlift)
  const hybridBias = program.hybridStrengthBias || (hasDeadlift ? 'streetlifting_biased' : null)
  
  // Build reason based on generation trigger
  // If hybrid, add hybrid context to the generated reason
  const hybridSuffix = isHybrid 
    ? buildHybridReasonSuffix(hasDeadlift, hasWeightedCalisthenics, hybridBias)
    : ''
    
  switch (generationReason) {
    case 'onboarding_initial_generation':
      return buildInitialProgramReason(goal, days, sessionMins, equipmentNote, constraintNote, style) + hybridSuffix
    
    case 'settings_schedule_change':
      return buildScheduleChangeReason(goal, days, sessionMins, previousProgram)
    
    case 'settings_equipment_change':
      return buildEquipmentChangeReason(goal, equipment, previousProgram)
    
    case 'settings_goal_change':
      return buildGoalChangeReason(goal, previousProgram)
    
    case 'settings_style_change':
      return buildStyleChangeReason(goal, style, previousProgram)
    
    case 'fatigue_deload':
      return `Recovery-focused program built to address accumulated fatigue while maintaining ${goal} foundations. Reduced volume with emphasis on quality movement patterns.`
    
    case 'injury_status_change':
      return buildInjuryChangeReason(goal, onboardingProfile)
    
    case 'manual_regeneration':
      return `Program regenerated at user request. Maintains focus on ${goal} using ${days} weekly sessions ${equipmentNote}. ${constraintNote}`
    
    case 'adaptive_rebalance':
      return `Program rebalanced based on training response data. Optimized for ${goal} progression ${constraintNote}.`
    
    case 'skill_priority_update':
      return `Program updated to reflect new skill priorities. Now emphasizes ${goal} ${constraintNote}.`
    
    case 'benchmark_update':
      return `Program recalibrated based on updated strength benchmarks. Exercise selection and loading adjusted for current capacity.`
    
    case 'framework_update':
      return `Program structure updated to use improved training framework. Maintains focus on ${goal}.`
    
    default:
      return `Built to prioritize ${goal} progression using ${days} weekly sessions ${equipmentNote}. ${constraintNote}`.trim()
  }
}

function buildInitialProgramReason(
  goal: string,
  days: number,
  sessionMins: number,
  equipmentNote: string,
  constraintNote: string,
  style: string
): string {
  const styleDescription = getStyleDescription(style)
  
  let reason = `Initial program designed to build toward ${goal}`
  
  if (constraintNote) {
    reason += `, ${constraintNote}`
  }
  
  reason += `. Structured for ${days}x weekly training with ${sessionMins}-minute sessions`
  
  if (equipmentNote) {
    reason += ` ${equipmentNote}`
  }
  
  if (styleDescription) {
    reason += `. ${styleDescription}`
  }
  
  return reason + '.'
}

function buildScheduleChangeReason(
  goal: string,
  days: number,
  sessionMins: number,
  previousProgram: ProgramHistory | null | undefined
): string {
  const oldDays = previousProgram?.trainingDaysPerWeek || 4
  const oldSession = previousProgram?.sessionLengthMinutes || 60
  
  if (days !== oldDays && sessionMins !== oldSession) {
    return `Program restructured for ${days}x weekly sessions of ${sessionMins} minutes (previously ${oldDays}x${oldSession}min). Volume and exercise selection rebalanced while maintaining ${goal} focus.`
  } else if (days !== oldDays) {
    const direction = days > oldDays ? 'increased' : 'reduced'
    return `Training frequency ${direction} to ${days} days per week. Exercise distribution and recovery timing adjusted while maintaining ${goal} progression path.`
  } else {
    const direction = sessionMins > oldSession ? 'extended' : 'shortened'
    return `Session duration ${direction} to ${sessionMins} minutes. Exercise selection adjusted to fit new time constraints while prioritizing ${goal} work.`
  }
}

function buildEquipmentChangeReason(
  goal: string,
  equipment: string[],
  previousProgram: ProgramHistory | null | undefined
): string {
  const equipmentList = equipment.length > 0 
    ? equipment.map(e => e.replace(/_/g, ' ')).join(', ')
    : 'bodyweight only'
  
  return `Program adapted for updated equipment availability (${equipmentList}). Exercise selection modified while preserving ${goal} progression methodology.`
}

function buildGoalChangeReason(
  goal: string,
  previousProgram: ProgramHistory | null | undefined
): string {
  const oldGoal = previousProgram?.primaryGoal?.replace(/_/g, ' ') || 'previous focus'
  
  return `Program rebuilt with new primary focus on ${goal} (previously ${oldGoal}). Training emphasis, exercise selection, and volume distribution restructured to support new direction.`
}

function buildStyleChangeReason(
  goal: string,
  style: string,
  previousProgram: ProgramHistory | null | undefined
): string {
  const styleDescription = getStyleDescription(style)
  
  return `Training approach updated to ${style.replace(/_/g, ' ')} methodology. ${styleDescription} Program maintains ${goal} focus with adjusted intensity and volume patterns.`
}

function buildInjuryChangeReason(
  goal: string,
  onboardingProfile: OnboardingProfile | null | undefined
): string {
  const cautions = onboardingProfile?.jointCautions || []
  
  if (cautions.length > 0) {
    const cautionList = cautions.slice(0, 2).join(' and ')
    return `Program modified to accommodate ${cautionList} considerations. Exercise selection adjusted to protect vulnerable areas while maintaining ${goal} progression where safe.`
  }
  
  return `Program updated based on injury status change. Exercise selection modified for safety while preserving ${goal} training capacity.`
}

function getStyleDescription(style: string): string {
  const descriptions: Record<string, string> = {
    'skill_focused': 'Emphasizes technique practice and skill-specific strength work.',
    'strength_focused': 'Prioritizes progressive overload and strength building.',
    'power_focused': 'Incorporates explosive movements and power development.',
    'endurance_focused': 'Higher rep ranges with metabolic conditioning elements.',
    'hypertrophy_supported': 'Includes accessory volume for muscle development.',
    'balanced_hybrid': 'Balances skill, strength, and conditioning work.',
  }
  
  return descriptions[style] || ''
}

// =============================================================================
// HYBRID STRENGTH REASON HELPERS
// =============================================================================

/**
 * Detect if program contains hybrid strength elements
 */
function detectHybridElement(
  program: AdaptiveProgram,
  element: 'deadlift' | 'weighted' | 'squat' | 'bench'
): boolean {
  const sessions = program.sessions || []
  
  for (const session of sessions) {
    const exercises = session.exercises || []
    for (const ex of exercises) {
      const name = (ex.name || '').toLowerCase()
      const id = (ex.id || '').toLowerCase()
      
      switch (element) {
        case 'deadlift':
          if (name.includes('deadlift') || id.includes('deadlift')) return true
          break
        case 'weighted':
          if (name.includes('weighted') || id.includes('weighted')) return true
          break
        case 'squat':
          if (name.includes('squat') || id.includes('squat')) return true
          break
        case 'bench':
          if (name.includes('bench') || id.includes('bench')) return true
          break
      }
    }
  }
  
  return false
}

/**
 * Build hybrid-specific reason suffix
 */
function buildHybridReasonSuffix(
  hasDeadlift: boolean,
  hasWeightedCalisthenics: boolean,
  hybridBias: string | null
): string {
  if (hasDeadlift && hasWeightedCalisthenics) {
    if (hybridBias === 'streetlifting_biased') {
      return ' Weighted pull-up and dip prioritized with deadlift support under hybrid strength bias.'
    }
    return ' Deadlift included once weekly to support posterior-chain force production while preserving upper-body skill recovery.'
  }
  
  if (hasDeadlift) {
    return ' Deadlift integrated for hip-hinge strength without compromising calisthenics skill work.'
  }
  
  if (hasWeightedCalisthenics) {
    return ' Weighted calisthenics emphasized for progressive overload alongside bodyweight skill development.'
  }
  
  return ''
}

// =============================================================================
// SNAPSHOT BUILDERS
// =============================================================================

/**
 * Build athlete inputs snapshot from current state
 * Extended for hybrid strength context
 */
export function buildAthleteInputsSnapshot(
  profile: OnboardingProfile | null,
  program: AdaptiveProgram
): AthleteInputsSnapshot {
  // Get session length as number
  const sessionLengthMinutes = typeof program.sessionLength === 'number'
    ? program.sessionLength
    : parseInt(String(program.sessionLength)) || 60
  
  // Detect hybrid context
  const hasDeadlift = detectHybridElement(program, 'deadlift')
  const hasWeightedCalisthenics = detectHybridElement(program, 'weighted')
  
  // Determine hybrid modality
  let hybridModality: 'calisthenics_only' | 'weighted_calisthenics' | 'hybrid_light' | 'streetlifting_biased' = 'calisthenics_only'
  if (hasDeadlift && hasWeightedCalisthenics) {
    hybridModality = program.hybridStrengthBias === 'streetlifting_biased' ? 'streetlifting_biased' : 'hybrid_light'
  } else if (hasWeightedCalisthenics) {
    hybridModality = 'weighted_calisthenics'
  }
  
  // REGRESSION GUARD: These fallbacks are for historical snapshots only.
  // Live program generation uses canonical-profile-service instead.
  return {
    bodyweight: profile?.bodyweight || undefined,
    weightUnit: profile?.weightUnit || 'kg',
    // Note: fallback values here are for snapshot display, not generation truth
    experienceLevel: program.experienceLevel || 'intermediate',
    trainingDaysPerWeek: program.trainingDaysPerWeek || 4,  // Snapshot display only
    sessionLengthMinutes,
    equipmentAvailable: program.equipmentProfile?.available || [],
    jointCautions: profile?.jointCautions || [],
    primaryGoal: program.primaryGoal,
    secondaryGoal: undefined, // Not directly in AdaptiveProgram
    selectedSkills: profile?.skillInterests || [],
    pullUpMax: profile?.pullUpMax,
    pushUpMax: profile?.pushUpMax,
    dipMax: profile?.dipMax,
    weightedPullUpLoad: profile?.weightedPullUpLoad,
    weightedDipLoad: profile?.weightedDipLoad,
    frontLeverProgression: profile?.frontLeverLevel,
    plancheProgression: profile?.plancheLevel,
    muscleUpReadiness: profile?.muscleUpReadiness,
    hspuProgression: profile?.hspuLevel,
    sleepQuality: profile?.sleepQuality,
    stressLevel: profile?.stressLevel,
    recoveryConfidence: profile?.recoveryConfidence,
    
    // Hybrid strength fields (Phase 2)
    deadlift1RM: (profile as unknown as { deadlift1RM?: number })?.deadlift1RM,
    deadliftExperience: (profile as unknown as { deadliftExperience?: 'none' | 'beginner' | 'intermediate' | 'advanced' })?.deadliftExperience,
    hybridModality,
    includesDeadlift: hasDeadlift,
    streetliftingTotal: undefined, // Computed elsewhere
  }
}

/**
 * Build goals snapshot from program
 * Extended for hybrid strength goals
 */
export function buildGoalsSnapshot(
  profile: OnboardingProfile | null,
  program: AdaptiveProgram
): GoalsSnapshot {
  // Detect hybrid context
  const hasDeadlift = detectHybridElement(program, 'deadlift')
  const hasWeightedCalisthenics = detectHybridElement(program, 'weighted')
  
  // Determine hybrid modality for goals
  let hybridModality: 'calisthenics_only' | 'weighted_calisthenics' | 'hybrid_light' | 'streetlifting_biased' | undefined
  if (hasDeadlift && hasWeightedCalisthenics) {
    hybridModality = program.hybridStrengthBias === 'streetlifting_biased' ? 'streetlifting_biased' : 'hybrid_light'
  } else if (hasDeadlift) {
    hybridModality = 'hybrid_light'
  } else if (hasWeightedCalisthenics) {
    hybridModality = 'weighted_calisthenics'
  }
  
  // REGRESSION GUARD: 'general' is the safe fallback, not 'front_lever'
  // This preserves correct goal identity when primary goal is missing
  return {
    primaryGoal: program.primaryGoal || 'general',
    primaryGoalLabel: program.goalLabel || program.primaryGoal || 'General',
    secondaryEmphasis: program.secondaryEmphasis,
    selectedSkills: profile?.skillInterests || [],
    targetTimeline: undefined,
    specificTargets: [],
    
    // Hybrid strength goals
    hybridModality,
    includesDeadlift: hasDeadlift,
    deadliftGoal: (profile as unknown as { deadliftGoal?: number })?.deadliftGoal,
    streetliftingGoal: (profile as unknown as { streetliftingGoal?: number })?.streetliftingGoal,
  }
}

/**
 * Build program structure snapshot
 */
export function buildProgramStructureSnapshot(
  program: AdaptiveProgram
): ProgramStructureSnapshot {
  // AdaptiveProgram uses 'sessions' array, not 'days'
  const sessions = program.sessions || []
  
  // REGRESSION GUARD: These fallbacks are for historical snapshots only
  // Note: daysPerWeek || 4 and || 60 are ONLY for snapshot display, not generation truth
  return {
    programName: program.goalLabel || `${program.primaryGoal || 'General'} Program`,
    daysPerWeek: program.trainingDaysPerWeek || 4,  // Snapshot display fallback only
    sessionLengthMinutes: typeof program.sessionLength === 'number' 
      ? program.sessionLength 
      : parseInt(String(program.sessionLength)) || 60,  // Snapshot display fallback only
    blockStructure: program.structure?.pattern || undefined,
    days: sessions.map((session, index) => ({
      dayNumber: session.dayNumber || index + 1,
      dayLabel: session.dayLabel || `Day ${index + 1}`,
      focus: session.focus || session.focusLabel || 'General',
      exercises: (session.exercises || []).map(ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        category: ex.category || 'strength',
        sets: ex.sets,
        reps: typeof ex.reps === 'number' ? String(ex.reps) : ex.reps,
        hold: ex.hold,
        rest: ex.rest,
        notes: ex.notes,
      })),
    })),
    strengthNote: program.programRationale,
    coachingNotes: program.constraintInsight?.focus || [],
  }
}

// =============================================================================
// MAIN VERSION MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Archive the current active program before creating a new one
 * Returns the archived program entry or null if no active program existed
 */
export async function archiveCurrentProgramToHistory(
  userId: string,
  archiveReason?: string
): Promise<ProgramHistory | null> {
  // Get current active program
  const activeProgram = await getActiveProgramHistory(userId)
  
  if (!activeProgram) {
    return null // No active program to archive
  }
  
  // Archive the current program
  const archived = await archiveCurrentProgram(
    userId,
    archiveReason || 'User started new program'
  )
  
  if (!archived) {
    console.error('[ProgramHistoryVersioning] Failed to archive current program')
    return null
  }
  
  return activeProgram
}

/**
 * Create a new program history entry with full snapshot
 * This is the main entry point for program versioning
 */
export async function createProgramVersion(
  context: ProgramHistoryContext
): Promise<ProgramVersionResult> {
  const { userId, program, generationReason } = context
  
  try {
    // Get onboarding profile for snapshot
    const profile = context.onboardingProfile ?? 
      (typeof window !== 'undefined' ? getOnboardingProfile() : null)
    
    // Archive current program if exists
    const previousProgram = await archiveCurrentProgramToHistory(
      userId,
      `Replaced by new program (${generationReason})`
    )
    
    // Update context with previous program
    const fullContext: ProgramHistoryContext = {
      ...context,
      onboardingProfile: profile,
      previousProgram,
    }
    
    // Generate reason summary
    const reasonSummary = generateProgramReasonSummary(fullContext)
    
    // Get next version number
    const versionNumber = await getNextProgramVersionNumber(userId)
    
    // Build snapshots
    const athleteInputsSnapshot = buildAthleteInputsSnapshot(profile, program)
    const goalsSnapshot = buildGoalsSnapshot(profile, program)
    const programStructureSnapshot = buildProgramStructureSnapshot(program)
    
    // Get session length as number
    const sessionLengthMinutes = typeof program.sessionLength === 'number'
      ? program.sessionLength
      : parseInt(String(program.sessionLength)) || 60
    
    // Create the program history entry
    const input: CreateProgramHistoryInput = {
      userId,
      versionNumber,
      programName: program.goalLabel || `${program.primaryGoal} Program v${versionNumber}`,
      generationReason,
      reasonSummary,
      goalsSnapshot,
      athleteInputsSnapshot,
      programStructureSnapshot,
      primaryGoal: program.primaryGoal,
      trainingDaysPerWeek: program.trainingDaysPerWeek,
      sessionLengthMinutes,
      blockSummary: program.structure?.pattern || program.programRationale,
    }
    
    const newEntry = await createProgramHistoryEntry(input)
    
    if (!newEntry) {
      return {
        success: false,
        programHistoryId: null,
        versionNumber,
        reasonSummary,
        error: 'Failed to create program history entry',
      }
    }
    
    return {
      success: true,
      programHistoryId: newEntry.id,
      versionNumber,
      reasonSummary,
    }
    
  } catch (error) {
    console.error('[ProgramHistoryVersioning] Error creating program version:', error)
    return {
      success: false,
      programHistoryId: null,
      versionNumber: 0,
      reasonSummary: '',
      error: String(error),
    }
  }
}

/**
 * Create initial program version on onboarding completion
 */
export async function createInitialProgramHistoryEntry(
  userId: string,
  program: AdaptiveProgram,
  profile?: OnboardingProfile | null
): Promise<ProgramVersionResult> {
  return createProgramVersion({
    userId,
    program,
    generationReason: 'onboarding_initial_generation',
    onboardingProfile: profile,
  })
}

/**
 * Create new program version when settings change
 */
export async function createProgramVersionOnSettingsChange(
  userId: string,
  program: AdaptiveProgram,
  reason: GenerationReason
): Promise<ProgramVersionResult> {
  return createProgramVersion({
    userId,
    program,
    generationReason: reason,
  })
}

/**
 * Get full program history for a user with all versions
 */
export async function getFullProgramHistory(
  userId: string,
  limit: number = 50
): Promise<{
  activeProgram: ProgramHistory | null
  archivedPrograms: ProgramHistory[]
  totalVersions: number
}> {
  const [active, all] = await Promise.all([
    getActiveProgramHistory(userId),
    getProgramHistoryForUser(userId, { limit, sortOrder: 'desc' }),
  ])
  
  const archived = all.filter(p => p.status !== 'active')
  
  return {
    activeProgram: active,
    archivedPrograms: archived,
    totalVersions: all.length,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getActiveProgramHistory,
  getProgramHistoryForUser,
} from './history-service'
