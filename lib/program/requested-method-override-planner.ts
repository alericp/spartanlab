/**
 * =============================================================================
 * requested-method-override-planner.ts
 * -----------------------------------------------------------------------------
 * SPARTANLAB PROMPT 2 — REQUESTED METHOD OVERRIDE PLANNING CORRIDOR
 *
 * Provides type-safe planning logic for method override requests.
 * This does NOT mutate saved programs — it generates preview plans only.
 *
 * TRAINING DOCTRINE:
 *   - Top sets: Primary strength work, not unstable skill holds
 *   - Drop sets: Late accessory/hypertrophy work, not primary skill
 *   - Finishers: Last 5-8 minutes, goal-specific, fatigue-aware
 *   - Circuits: Non-conflicting patterns, not same-muscle repeats
 *   - Supersets: Antagonist/non-competing pairings with clear reason
 *   - Density: Short timed blocks, controlled accessories
 *   - Clusters: End-of-set completion, not default primary method
 *
 * BAND DOCTRINE:
 *   - Band assistance is coherent for: pull-ups, dips, explosive pull-ups,
 *     muscle-ups, archer pull-ups, planche/front lever progressions
 *   - Weighted pull-ups/dips should NOT default to band assistance
 * =============================================================================
 */

import type { RequestedMethodDisplayItem, RequestedMethodState } from '@/components/programs/ProgramCoachIntelligenceHub'
import type { AdaptiveProgram, AdaptiveSession } from '@/lib/adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export type RequestedMethodOverrideSafety =
  | 'safe_preview'
  | 'needs_caution'
  | 'not_recommended'
  | 'not_enough_truth'
  | 'unsupported_now'

export type RequestedMethodOverridePlacement =
  | 'same_session_late'
  | 'same_session_accessory'
  | 'different_day'
  | 'next_week'
  | 'today_preview_only'
  | 'not_placeable'

export type MethodStructure =
  | 'top_set'
  | 'drop_set'
  | 'finisher'
  | 'circuit'
  | 'superset'
  | 'density'
  | 'cluster'
  | 'unknown'

/**
 * [AB17.2.2.3] Shared method-key detection helpers for circuit override preview.
 * These normalize singular/plural/variant method keys to ensure consistent detection.
 */

/** Returns true for any circuit-like method key (circuit, circuits, density_circuit, etc.) */
export function isCircuitOverrideMethodKey(methodKey: string | null | undefined): boolean {
  if (!methodKey) return false
  const normalized = methodKey.toLowerCase().trim()
  return normalized.includes('circuit')
}

/** Returns true for density-block method keys */
export function isDensityOverrideMethodKey(methodKey: string | null | undefined): boolean {
  if (!methodKey) return false
  const normalized = methodKey.toLowerCase().trim()
  return normalized === 'density_blocks' || normalized === 'density' || normalized.includes('density_block')
}

/** Returns true for methods that use the circuit preview scan path (circuits OR density blocks) */
export function isCircuitLikePreviewMethodKey(methodKey: string | null | undefined): boolean {
  return isCircuitOverrideMethodKey(methodKey) || isDensityOverrideMethodKey(methodKey)
}

export interface RequestedMethodOverridePlan {
  methodKey: string
  label: string
  currentState: RequestedMethodState
  source: string
  safety: RequestedMethodOverrideSafety
  placement: RequestedMethodOverridePlacement
  canPreview: boolean
  canApplyToSavedProgramNow: false // Always false in this prompt
  headline: string
  reason: string
  riskNotes: string[]
  placementNotes: string[]
  dosageGuardrails: string[]
  avoids: string[]
  suggestedInsertion?: {
    dayIndex?: number
    sessionTitle?: string
    position: 'after_primary' | 'late_accessory' | 'finisher' | 'separate_day' | 'not_selected'
    structure: MethodStructure
    summary: string
  }
  proof: {
    usedProgramTruth: boolean
    usedSessionTruth: boolean
    usedMethodTruth: boolean
    usedExercisePatternTruth: boolean
    missingTruth: string[]
  }
}

export interface MethodOverridePlannerInput {
  methodItem: RequestedMethodDisplayItem
  program: AdaptiveProgram
  currentSessionIndex?: number
  selectedGoals?: string[]
  selectedSkills?: string[]
  trainingStyle?: string
}

// =============================================================================
// HELPER: SESSION ANALYSIS
// =============================================================================

interface SessionAnalysis {
  dayIndex: number
  title: string
  exerciseCount: number
  hasPrimarySkillWork: boolean
  hasHeavyStrength: boolean
  pullDensity: number // 0-1 ratio of pull exercises
  pushDensity: number
  legsDensity: number
  coreDensity: number
  estimatedMinutes: number
  isOverloaded: boolean
  hasSupersets: boolean
  hasCircuits: boolean
  hasFinisher: boolean
  movementPatterns: string[]
}

function analyzeSession(session: AdaptiveSession, dayIndex: number): SessionAnalysis {
  const exercises = session.exercises || []
  const exerciseCount = exercises.length
  
  // Count movement patterns
  let pullCount = 0
  let pushCount = 0
  let legsCount = 0
  let coreCount = 0
  const patterns: string[] = []
  
  for (const ex of exercises) {
    const name = (ex.name || '').toLowerCase()
    const family = ((ex as { movementFamily?: string }).movementFamily || '').toLowerCase()
    const category = ((ex as { category?: string }).category || '').toLowerCase()
    
    if (name.includes('pull') || name.includes('row') || name.includes('curl') || family.includes('pull')) {
      pullCount++
      if (!patterns.includes('pull')) patterns.push('pull')
    }
    if (name.includes('push') || name.includes('press') || name.includes('dip') || family.includes('push')) {
      pushCount++
      if (!patterns.includes('push')) patterns.push('push')
    }
    if (name.includes('squat') || name.includes('lunge') || name.includes('leg') || family.includes('legs')) {
      legsCount++
      if (!patterns.includes('legs')) patterns.push('legs')
    }
    if (name.includes('core') || name.includes('plank') || name.includes('hollow') || category === 'core') {
      coreCount++
      if (!patterns.includes('core')) patterns.push('core')
    }
    if (name.includes('planche') || name.includes('front lever') || name.includes('muscle up') || category === 'skill') {
      if (!patterns.includes('skill')) patterns.push('skill')
    }
  }
  
  const total = exerciseCount || 1
  
  // Check for existing methods
  const hasSupersets = exercises.some(ex => 
    (ex as { groupType?: string }).groupType === 'superset' ||
    (ex as { blockGroupType?: string }).blockGroupType === 'superset'
  )
  const hasCircuits = exercises.some(ex => 
    (ex as { groupType?: string }).groupType === 'circuit' ||
    (ex as { blockGroupType?: string }).blockGroupType === 'circuit'
  )
  const hasFinisher = exercises.some(ex => 
    (ex as { isFinisher?: boolean }).isFinisher === true ||
    (ex.name || '').toLowerCase().includes('finisher')
  )
  
  // Estimate session time
  const estimatedMinutes = session.estimatedMinutes || (exerciseCount * 8)
  const isOverloaded = estimatedMinutes > 75 || exerciseCount > 10
  
  // Check for primary skill/strength work
  const hasPrimarySkillWork = patterns.includes('skill')
  const hasHeavyStrength = exercises.some(ex => {
    const name = (ex.name || '').toLowerCase()
    return name.includes('weighted') || name.includes('heavy') || 
           ((ex as { intensityScheme?: string }).intensityScheme || '').includes('heavy')
  })
  
  return {
    dayIndex,
    title: session.focus || session.dayLabel || `Day ${dayIndex + 1}`,
    exerciseCount,
    hasPrimarySkillWork,
    hasHeavyStrength,
    pullDensity: pullCount / total,
    pushDensity: pushCount / total,
    legsDensity: legsCount / total,
    coreDensity: coreCount / total,
    estimatedMinutes,
    isOverloaded,
    hasSupersets,
    hasCircuits,
    hasFinisher,
    movementPatterns: patterns,
  }
}

// =============================================================================
// METHOD-SPECIFIC PLANNING LOGIC
// =============================================================================

function planTopSet(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // Top sets are best for primary strength work
  const bestSession = sessions.find(s => s.hasHeavyStrength && !s.isOverloaded) 
    || sessions.find(s => !s.isOverloaded)
  
  if (!bestSession) {
    return {
      safety: 'not_recommended',
      placement: 'not_placeable',
      headline: 'All sessions appear overloaded for top set insertion',
      riskNotes: ['Adding a top set to an already overloaded session risks quality degradation'],
      placementNotes: ['Consider reducing session volume before adding top sets'],
      dosageGuardrails: ['Top sets work best with 1-2 primary movements, not across the session'],
      avoids: ['Unstable technical skill holds', 'Exercises without clear strength progression'],
    }
  }
  
  return {
    safety: 'safe_preview',
    placement: 'same_session_accessory',
    headline: `Top set can be previewed on ${bestSession.title}`,
    suggestedInsertion: {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'after_primary',
      structure: 'top_set',
      summary: 'Heavy primary exposure followed by back-off sets for quality volume',
    },
    riskNotes: bestSession.hasPrimarySkillWork 
      ? ['Session has skill work — ensure top set does not create excessive fatigue before skill practice']
      : [],
    placementNotes: [
      'Best placed on first major strength movement after warm-up',
      'Follow top set with 2-3 back-off sets at reduced intensity',
    ],
    dosageGuardrails: [
      'Limit to 1-2 top sets per session',
      'Use RPE 8-9, not max effort',
      'Reserve for movements with established form',
    ],
    avoids: [
      'Unstable technical holds',
      'New/unfamiliar movements',
      'Late-session placement',
    ],
  }
}

function planDropSet(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // Drop sets are best for late accessory/hypertrophy work
  const bestSession = sessions.find(s => !s.hasPrimarySkillWork && !s.isOverloaded)
    || sessions.find(s => !s.isOverloaded)
  
  return {
    safety: bestSession ? 'safe_preview' : 'needs_caution',
    placement: bestSession ? 'same_session_late' : 'different_day',
    headline: bestSession 
      ? `Drop set can be previewed on ${bestSession.title} as late accessory`
      : 'Drop set placement needs caution — consider a different day',
    suggestedInsertion: bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'late_accessory',
      structure: 'drop_set',
      summary: 'Metabolic finish work on an isolated accessory movement',
    } : undefined,
    riskNotes: [
      'Drop sets create significant fatigue — avoid before skill work',
      'Not recommended for heavy compound movements',
    ],
    placementNotes: [
      'Best on isolation/accessory movements',
      'Place late in session, after primary work',
      'Single drop sequence is sufficient',
    ],
    dosageGuardrails: [
      'Limit to 1 drop sequence (not multiple consecutive)',
      'Use on movements with safe failure mechanics',
      'Reduce by 20-30% per drop',
    ],
    avoids: [
      'Primary skill holds',
      'Heavy weighted pull-ups/dips',
      'Technical max effort work',
      'Placement before core skill work',
    ],
  }
}

function planFinisher(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // Finishers should be late-session and short
  const bestSession = sessions.find(s => !s.hasFinisher && !s.isOverloaded)
    || sessions.find(s => !s.hasFinisher)
  
  if (bestSession?.hasFinisher) {
    return {
      safety: 'needs_caution',
      placement: 'different_day',
      headline: 'Session already has a finisher — consider a different day',
      riskNotes: ['Stacking finishers can damage recovery'],
    }
  }
  
  return {
    safety: bestSession ? 'safe_preview' : 'needs_caution',
    placement: bestSession ? 'same_session_late' : 'different_day',
    headline: bestSession 
      ? `Finisher can be previewed on ${bestSession.title}`
      : 'Finisher needs a session with available capacity',
    suggestedInsertion: bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'finisher',
      structure: 'finisher',
      summary: 'Short goal-specific finish block (5-8 minutes)',
    } : undefined,
    riskNotes: [
      'Finishers should not destroy recovery for next session',
    ],
    placementNotes: [
      'Last 5-8 minutes of session',
      'Must be goal-specific: core, push, pull, compression, mobility, or conditioning',
      'Keep intensity moderate — volume is the stimulus',
    ],
    dosageGuardrails: [
      'Maximum 5-8 minutes',
      'Use movements with safe fatigue mechanics',
      'Match finisher to session theme when possible',
    ],
    avoids: [
      'Heavy technical movements',
      'Movements that compromise next day recovery',
      'Random unrelated exercise selection',
    ],
  }
}

function planCircuit(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // [AB17.2.2.1] Circuits need pattern variety across sessions
  // But we cannot claim a safe candidate until we run findBestCircuitPreviewCandidate()
  const bestSession = sessions.find(s => 
    s.movementPatterns.length >= 2 && // Has variety
    s.pullDensity < 0.6 && // Not pull-heavy
    s.pushDensity < 0.6 && // Not push-heavy
    !s.isOverloaded &&
    !s.hasCircuits
  ) || sessions.find(s => !s.hasCircuits && !s.isOverloaded)
  
  const hasPatternVariety = bestSession 
    ? bestSession.movementPatterns.length >= 2
    : false
  
  // [AB17.2.2.1] Honest pre-preview guidance
  // Do NOT claim safe_preview or show specific day until preview scans all program days
  return {
    // Before preview, cannot confirm safety — preview will scan all days
    safety: 'not_enough_truth',
    placement: hasPatternVariety ? 'same_session_accessory' : 'different_day',
    // [AB17.2.2.1] Honest headline — guide user to create preview
    headline: 'Create preview to scan all program days for circuit candidates',
    suggestedInsertion: hasPatternVariety && bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'late_accessory',
      structure: 'circuit',
      // [AB17.2.2.1] Updated summary — honest about needing preview scan
      summary: 'Preview will scan all days for 3+ compatible exercises',
    } : undefined,
    riskNotes: [
      'Circuit requires at least 3 compatible exercises',
      '2 exercises = superset, not circuit',
      'Preview will check all program days for best candidate',
      bestSession?.pullDensity && bestSession.pullDensity > 0.4 
        ? 'Some sessions have high pull density — avoid pull-heavy circuits'
        : '',
    ].filter(Boolean),
    placementNotes: [
      'Combine non-conflicting patterns: push + core + mobility',
      'Or: pull + compression + scapular',
      'Or: legs + trunk + mobility',
      'Place after primary skill/strength work',
    ],
    dosageGuardrails: [
      '3-4 exercises maximum',
      '2-3 rounds',
      'Keep rest minimal between exercises, moderate between rounds',
    ],
    avoids: [
      'Same-muscle repeated exercises',
      'High-fatigue same-pattern groupings',
      'Placement before primary skill work',
      'Archer pull-ups + pull-ups pairing (redundant)',
    ],
  }
}

function planSuperset(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // Supersets need antagonist or non-competing pairings
  const bestSession = sessions.find(s => 
    s.movementPatterns.includes('push') && s.movementPatterns.includes('pull') &&
    !s.hasSupersets &&
    !s.isOverloaded
  ) || sessions.find(s => !s.hasSupersets && !s.isOverloaded)
  
  const hasAntagonistPotential = bestSession
    ? bestSession.movementPatterns.includes('push') && bestSession.movementPatterns.includes('pull')
    : false
  
  return {
    safety: hasAntagonistPotential ? 'safe_preview' : 'needs_caution',
    placement: hasAntagonistPotential ? 'same_session_accessory' : 'different_day',
    headline: hasAntagonistPotential
      ? `Superset can be previewed on ${bestSession?.title} with antagonist pairing`
      : 'Superset requires clear pairing reason — antagonist or non-competing',
    suggestedInsertion: hasAntagonistPotential && bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'late_accessory',
      structure: 'superset',
      summary: 'Antagonist or non-competing pairing for time efficiency',
    } : undefined,
    riskNotes: [
      'Supersets must have a clear reason: antagonist, non-competing, or skill prep',
      'Do NOT pair same-pattern movements casually',
    ],
    placementNotes: [
      'Antagonist pairing: push + pull (e.g., dips + rows)',
      'Non-competing: upper + lower, or skill + accessory',
      'Skill prep: mobility + activation before main lift',
    ],
    dosageGuardrails: [
      'Limit to 2-3 superset pairings per session',
      'Allow brief transition rest between exercises',
    ],
    avoids: [
      'Archer pull-ups + pull-ups (same pattern, no clear benefit)',
      'Heavy compound + heavy compound (accumulated fatigue)',
      'Technical skill + technical skill (form degradation)',
    ],
  }
}

function planDensity(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // Density blocks are short timed blocks after primary work
  const bestSession = sessions.find(s => !s.isOverloaded)
  
  return {
    safety: bestSession ? 'safe_preview' : 'needs_caution',
    placement: bestSession ? 'same_session_late' : 'different_day',
    headline: bestSession
      ? `Density block can be previewed on ${bestSession.title}`
      : 'Density block needs a session with available time',
    suggestedInsertion: bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'late_accessory',
      structure: 'density',
      summary: 'Short timed block (AMRAP/EMOM style) for controlled volume',
    } : undefined,
    riskNotes: [
      'Density work creates metabolic stress — recovery impact',
    ],
    placementNotes: [
      'Place after primary skill/strength work',
      'Good for core, compression, conditioning, or skill-safe volume',
      'Keep time cap reasonable (5-10 minutes)',
    ],
    dosageGuardrails: [
      '5-10 minute cap',
      'Use movements with safe fatigue mechanics',
      'Avoid heavy technical movements',
    ],
    avoids: [
      'Heavy max effort work',
      'Complex technical skills',
      'Movements with injury risk under fatigue',
    ],
  }
}

function planCluster(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // Clusters are for completing quality reps under fatigue
  // User doctrine: used toward end of exercise/session, not default primary
  const bestSession = sessions.find(s => s.hasHeavyStrength && !s.isOverloaded)
  
  return {
    safety: 'needs_caution',
    placement: bestSession ? 'same_session_accessory' : 'not_placeable',
    headline: 'Cluster sets are for completing quality reps under fatigue — use sparingly',
    suggestedInsertion: bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'late_accessory',
      structure: 'cluster',
      summary: 'Short intra-set rest to complete quality reps without form collapse',
    } : undefined,
    riskNotes: [
      'Cluster sets are NOT a default primary method',
      'Use sparingly — typically toward end of exercise or session',
      'Reserved for when form would otherwise collapse',
    ],
    placementNotes: [
      'Apply to final sets of a movement, not opening sets',
      'Good for completing target reps when fatigue is high',
      'Rest 10-20 seconds within set',
    ],
    dosageGuardrails: [
      'Maximum 1-2 cluster applications per session',
      'Use on movements with established form',
      'Not for new/unfamiliar movements',
    ],
    avoids: [
      'Primary position in workout',
      'Every exercise in session',
      'Movements without clear rep target',
    ],
  }
}

// =============================================================================
// MAIN PLANNER FUNCTION
// =============================================================================

export function planMethodOverride(
  input: MethodOverridePlannerInput,
): RequestedMethodOverridePlan {
  const { methodItem, program } = input
  
  // Extract sessions for analysis
  const sessions = (program.sessions || []).map((s, i) => analyzeSession(s, i))
  
  // Track truth sources used
  const proof: RequestedMethodOverridePlan['proof'] = {
    usedProgramTruth: !!program,
    usedSessionTruth: sessions.length > 0,
    usedMethodTruth: !!methodItem.source,
    usedExercisePatternTruth: sessions.some(s => s.movementPatterns.length > 0),
    missingTruth: [],
  }
  
  // Check for missing truth
  if (!program.sessions || program.sessions.length === 0) {
    proof.missingTruth.push('No sessions found in program')
  }
  if (!sessions.some(s => s.exerciseCount > 0)) {
    proof.missingTruth.push('No exercises found in sessions')
  }
  if (methodItem.confidence === 'low') {
    proof.missingTruth.push('Method decision confidence is low')
  }
  
  // If already applied/materialized, no override needed
  if (methodItem.state === 'applied' || methodItem.state === 'materialized') {
    return {
      methodKey: methodItem.methodKey,
      label: methodItem.label,
      currentState: methodItem.state,
      source: methodItem.source,
      safety: 'safe_preview',
      placement: 'same_session_accessory',
      canPreview: false,
      canApplyToSavedProgramNow: false,
      headline: 'Already included — no override needed',
      reason: `This method (${methodItem.label}) is already applied to your program.`,
      riskNotes: [],
      placementNotes: ['Method is currently active in your training'],
      dosageGuardrails: [],
      avoids: [],
      proof,
    }
  }
  
  // Get method-specific planning logic
  let methodPlan: Partial<RequestedMethodOverridePlan> = {}
  const methodKey = methodItem.methodKey.toLowerCase()
  
  if (methodKey.includes('top_set') || methodKey.includes('topset')) {
    methodPlan = planTopSet(input, sessions)
  } else if (methodKey.includes('drop_set') || methodKey.includes('dropset')) {
    methodPlan = planDropSet(input, sessions)
  } else if (methodKey.includes('finisher')) {
    methodPlan = planFinisher(input, sessions)
  } else if (methodKey.includes('circuit')) {
    methodPlan = planCircuit(input, sessions)
  } else if (methodKey.includes('superset')) {
    methodPlan = planSuperset(input, sessions)
  } else if (methodKey.includes('density')) {
    methodPlan = planDensity(input, sessions)
  } else if (methodKey.includes('cluster')) {
    methodPlan = planCluster(input, sessions)
  } else {
    // Unknown method
    methodPlan = {
      safety: 'not_enough_truth',
      placement: 'not_placeable',
      headline: 'Method type not recognized for automatic planning',
      riskNotes: ['The app can identify this request but cannot safely plan placement'],
      placementNotes: ['Manual planning may be required'],
      dosageGuardrails: [],
      avoids: [],
    }
    proof.missingTruth.push('Unknown method type for automatic planning')
  }
  
  // [AB17.2.2.2] Determine if preview is allowed
  // For most methods: require safe_preview or needs_caution
  // For Circuits/Density: allow preview when program has exercises (scan is the diagnostic)
  const isCircuitLikeMethod = isCircuitLikePreviewMethodKey(methodKey)
  const hasProgramExerciseTruth = sessions.some(s => s.exerciseCount > 0)
  
  const canPreview = isCircuitLikeMethod
    ? hasProgramExerciseTruth  // Circuits use preview scan as the diagnostic gate
    : (methodPlan.safety === 'safe_preview' || methodPlan.safety === 'needs_caution')
  
  return {
    methodKey: methodItem.methodKey,
    label: methodItem.label,
    currentState: methodItem.state,
    source: methodItem.source,
    safety: methodPlan.safety || 'not_enough_truth',
    placement: methodPlan.placement || 'not_placeable',
    canPreview,
    canApplyToSavedProgramNow: false,
    headline: methodPlan.headline || 'Planning analysis not available',
    reason: methodItem.reason,
    riskNotes: methodPlan.riskNotes || [],
    placementNotes: methodPlan.placementNotes || [],
    dosageGuardrails: methodPlan.dosageGuardrails || [],
    avoids: methodPlan.avoids || [],
    suggestedInsertion: methodPlan.suggestedInsertion,
    proof,
  }
}

// =============================================================================
// PREVIEW STATE MANAGEMENT
// =============================================================================

/**
 * [AB17.2] Concrete workout preview block for method override what-if display.
 */
export interface WorkoutPreviewBlock {
  label: string
  role?: string
  exercises: string[]
  method?: string
  changeType: 'unchanged' | 'inserted' | 'modified' | 'warning'
}

/**
 * [AB17.2] Day-specific workout preview for method override visualization.
 */
export interface MethodOverrideWorkoutPreview {
  affectedDayIndex: number
  affectedDayLabel: string
  affectedSessionTitle: string
  affectedSessionFocus?: string
  currentWorkoutPreview: WorkoutPreviewBlock[]
  proposedWorkoutPreview: WorkoutPreviewBlock[]
  changedBlocks: string[]
  affectedExercises: string[]
  unchangedExercises: string[]
  insertionReason: string
  coachCaution: string
  previewLimitations: string[]
  isConcretePreview: boolean
}

/**
 * [AB16.2 / IQ6.2] Method Override Preview with structured diff fields.
 * [AB17.2] Extended with concrete day-specific workout preview.
 * Provides visible Current vs Proposed structure proof.
 */
export interface MethodOverridePreview {
  methodKey: string
  label: string
  generatedAt: string
  planSummary: string
  placement: RequestedMethodOverridePlacement
  safety: RequestedMethodOverrideSafety
  suggestedDayIndex?: number
  canApplyToSavedProgramNow: false
  
  // [AB16.2] Structured preview diff fields
  /** Current structure summary (what the program has now) */
  currentStructure: string
  /** Proposed structure summary (what the preview would add) */
  proposedStructure: string
  /** Impact summary for user understanding */
  impactSummary: string
  /** Risk/safety summary */
  riskSummary: string
  /** Visible proof lines for display */
  visibleProofLines: string[]
  /** Explicit saved-program-unchanged flag */
  savedProgramUnchanged: true
  
  // [AB17.2] Concrete day-specific workout preview
  /** Day-specific what-if workout preview with before/after blocks */
  workoutPreview?: MethodOverrideWorkoutPreview
  
  // [AB17.2.2] Circuit-specific preview truth
  /** For circuits only: detailed candidate info with selected/skipped exercises */
  circuitCandidate?: CircuitPreviewCandidate
}

const PREVIEW_STORAGE_KEY = 'spartanlab:requestedMethodOverridePreview'

// =============================================================================
// [AB17.2.1] CIRCUIT PREVIEW DOCTRINE
// =============================================================================

/** Minimum exercises required for a valid circuit (2 = superset, not circuit) */
const CIRCUIT_MINIMUM_EXERCISES = 3
/** Preferred circuit size range */
const CIRCUIT_PREFERRED_MIN = 3
const CIRCUIT_PREFERRED_MAX = 5

/**
 * [AB17.2.1] Movement pattern classification for circuit compatibility scoring.
 */
type MovementPattern = 'push' | 'pull' | 'core' | 'mobility' | 'skill' | 'legs' | 'unknown'

/**
 * [AB17.2.1] Classifies an exercise name into a movement pattern.
 * [AB17.2.2] Fixed classification order: check dynamic movements BEFORE skill holds
 * to avoid misclassifying "Pseudo Planche Push-Ups" as a skill hold.
 */
function classifyMovementPattern(exerciseName: string): MovementPattern {
  const lower = exerciseName.toLowerCase()
  
  // [AB17.2.2] Check dynamic movements FIRST to avoid false skill classification
  // Push movements (check before skill to catch "Pseudo Planche Push-Ups")
  if (lower.includes('push-up') || lower.includes('pushup') || lower.includes('push up') ||
      lower.includes('dip') || lower.includes('press') || lower.includes('tricep')) {
    return 'push'
  }
  
  // Pull movements (check before skill to catch dynamic pulls)
  if (lower.includes('pull-up') || lower.includes('pullup') || lower.includes('pull up') ||
      lower.includes('row') || lower.includes('chin') || lower.includes('curl') || 
      lower.includes('bicep')) {
    return 'pull'
  }
  
  // Skill/isometric holds (check AFTER dynamic movements)
  if (lower.includes('hold') || lower.includes('lean') || lower.includes('lever') || 
      lower.includes('planche') || lower.includes('l-sit') || lower.includes('handstand')) {
    return 'skill'
  }
  
  // Core movements
  if (lower.includes('core') || lower.includes('hollow') || lower.includes('plank') ||
      lower.includes('ab') || lower.includes('compression') || lower.includes('dragon')) {
    return 'core'
  }
  
  // Mobility movements
  if (lower.includes('stretch') || lower.includes('mobility') || lower.includes('flexibility') ||
      lower.includes('warm')) {
    return 'mobility'
  }
  
  // Legs
  if (lower.includes('squat') || lower.includes('lunge') || lower.includes('leg') ||
      lower.includes('pistol') || lower.includes('calf')) {
    return 'legs'
  }
  
  return 'unknown'
}

/**
 * [AB17.2.2.2] Circuit candidate status for clear UI rendering.
 */
export type CircuitCandidateStatus = 
  | 'safe_circuit'           // 3+ exercises, good score
  | 'override_with_caution'  // 3+ exercises, but risky (score <= 0)
  | 'would_be_superset'      // exactly 2 exercises
  | 'no_candidate'           // < 2 exercises

/**
 * [AB17.2.1] Circuit candidate result for a specific day.
 * [AB17.2.2.2] Extended with candidateStatus for clearer UI states.
 */
export interface CircuitPreviewCandidate {
  dayIndex: number
  dayLabel: string
  sessionTitle: string
  selectedExercises: string[]
  skippedExercises: string[]
  candidateReason: string
  riskNotes: string[]
  circuitSize: number
  confidence: 'high' | 'medium' | 'low' | 'none'
  isSafeCircuitCandidate: boolean
  /** [AB17.2.2.2] True when 3+ exercises exist, even if not perfectly safe */
  isOverrideCandidate: boolean
  /** [AB17.2.2.2] Clear status for UI rendering */
  candidateStatus: CircuitCandidateStatus
  /** [AB17.2.2.2] Human-readable status label */
  statusLabel: string
  patternDistribution: Record<MovementPattern, number>
}

/**
 * [AB17.2.2.5] Circuit station tier for override preview.
 * Determines how an exercise is treated in circuit eligibility.
 */
type CircuitStationTier = 'safe' | 'caution_skill_hold' | 'caution_same_pattern' | 'excluded'

/**
 * [AB17.2.2.5] Decision record for each exercise in circuit eligibility.
 */
interface CircuitStationDecision {
  name: string
  pattern: MovementPattern
  tier: CircuitStationTier
  included: boolean
  reason: string
}

/**
 * [AB17.2.1] Finds circuit-compatible exercises from a list.
 * [AB17.2.2.5] Skill holds are now caution stations, not hard excluded.
 * This allows 3+ exercise days with skill holds to become override candidates.
 */
function findCircuitCompatibleExercises(exercises: string[]): {
  selected: string[]
  skipped: string[]
  patterns: Record<MovementPattern, number>
  reason: string
  stationDecisions: CircuitStationDecision[]
  hasSkillHoldCaution: boolean
  hasSamePatternCaution: boolean
  safeCount: number
  cautionCount: number
} {
  const patterns: Record<MovementPattern, number> = {
    push: 0, pull: 0, core: 0, mobility: 0, skill: 0, legs: 0, unknown: 0
  }
  
  const selected: string[] = []
  const skipped: string[] = []
  const stationDecisions: CircuitStationDecision[] = []
  let hasSkillHoldCaution = false
  let hasSamePatternCaution = false
  let safeCount = 0
  let cautionCount = 0
  
  for (const exercise of exercises) {
    const pattern = classifyMovementPattern(exercise)
    
    // [AB17.2.2.5] Skill holds are CAUTION STATIONS, not excluded
    // They can help reach 3+ exercises for override preview
    if (pattern === 'skill') {
      selected.push(exercise)
      patterns[pattern]++
      hasSkillHoldCaution = true
      cautionCount++
      stationDecisions.push({
        name: exercise,
        pattern,
        tier: 'caution_skill_hold',
        included: true,
        reason: 'Skill hold included as caution station — preserve technique quality'
      })
      continue
    }
    
    // [AB17.2.1] Same-pattern overload: include as caution, not excluded
    if (patterns[pattern] >= 1 && pattern !== 'unknown') {
      selected.push(exercise)
      patterns[pattern]++
      hasSamePatternCaution = true
      cautionCount++
      stationDecisions.push({
        name: exercise,
        pattern,
        tier: 'caution_same_pattern',
        included: true,
        reason: `Same pattern (${pattern}) already present — redundancy caution`
      })
      continue
    }
    
    // Safe inclusion
    patterns[pattern]++
    selected.push(exercise)
    safeCount++
    stationDecisions.push({
      name: exercise,
      pattern,
      tier: 'safe',
      included: true,
      reason: 'Safe circuit station'
    })
  }
  
  // Determine reason based on what we found
  const uniquePatterns = Object.entries(patterns).filter(([_, count]) => count > 0).length
  let reason = ''
  if (selected.length >= CIRCUIT_MINIMUM_EXERCISES) {
    if (hasSkillHoldCaution || hasSamePatternCaution) {
      reason = `${selected.length} exercises available; includes ${cautionCount} caution station(s)`
    } else {
      reason = `${selected.length} compatible exercises with ${uniquePatterns} distinct patterns`
    }
  } else if (selected.length === 2) {
    reason = '2 exercises = superset, not a circuit'
  } else if (selected.length === 1) {
    reason = 'Only 1 compatible exercise found'
  } else {
    reason = 'No compatible circuit exercises found'
  }
  
  return { 
    selected, 
    skipped, 
    patterns, 
    reason, 
    stationDecisions,
    hasSkillHoldCaution,
    hasSamePatternCaution,
    safeCount,
    cautionCount
  }
}

/**
 * [AB17.2.1] Scores a session for circuit suitability.
 * [AB17.2.2.5] Updated to handle caution stations properly.
 * Higher score = better circuit candidate.
 */
function scoreSessionForCircuit(
  exercises: string[],
  sessionTitle: string
): { score: number; notes: string[]; hasSkillHoldCaution: boolean; hasSamePatternCaution: boolean } {
  let score = 0
  const notes: string[] = []
  
  const { selected, patterns, hasSkillHoldCaution, hasSamePatternCaution, safeCount, cautionCount } = findCircuitCompatibleExercises(exercises)
  
  // [AB17.2.2.5] Base score for having enough exercises
  if (selected.length >= CIRCUIT_MINIMUM_EXERCISES) {
    if (safeCount >= CIRCUIT_MINIMUM_EXERCISES) {
      score += 50 // Full safe circuit
    } else {
      score += 30 // Caution circuit but still valid
      notes.push(`${cautionCount} caution station(s) included`)
    }
  } else if (selected.length === 2) {
    score -= 100 // Strongly penalize — would be superset
    notes.push('Only 2 exercises: would be superset, not circuit')
  } else {
    score -= 200 // Very bad
    notes.push('Insufficient exercises for circuit')
  }
  
  // [AB17.2.2.5] Caution penalties (but don't prevent override candidate)
  if (hasSkillHoldCaution) {
    score -= 15
    notes.push('Skill hold included as caution station — preserve technique quality')
  }
  if (hasSamePatternCaution) {
    score -= 10
    notes.push('Same-pattern exercises included — redundancy caution')
  }
  
  // Bonus for pattern diversity
  const uniquePatterns = Object.entries(patterns).filter(([_, count]) => count > 0).length
  score += uniquePatterns * 10
  
  // Bonus for preferred patterns in circuit
  if (patterns.push > 0 && patterns.core > 0) score += 15 // push + core is good
  if (patterns.pull > 0 && patterns.core > 0) score += 15 // pull + core is good
  if (patterns.mobility > 0) score += 10 // mobility in circuit is good
  
  // Penalty for high-skill session
  const lower = sessionTitle.toLowerCase()
  if (lower.includes('skill') || lower.includes('heavy') || lower.includes('heavier')) {
    score -= 20
    notes.push('High-skill/strength session — circuit may degrade technique')
  }
  
  // Bonus for accessory-focused session
  if (lower.includes('accessory') || lower.includes('lighter')) {
    score += 20
  }
  
  return { score, notes, hasSkillHoldCaution, hasSamePatternCaution }
}

/**
 * [AB17.2.1] Finds the best circuit preview candidate across all program sessions.
 * [AB17.2.2.1] Updated to handle sessions with optional exercises array.
 * [AB17.2.2.2] Now returns best override candidate with caution if no safe candidate exists.
 * [AB17.2.2.5] Skill holds are now caution stations, allowing 3+ exercise days to become override candidates.
 * Returns null only if no 2+ exercise candidates exist anywhere.
 */
export function findBestCircuitPreviewCandidate(
  sessions: Array<{ exercises?: Array<{ name?: string }>; focus?: string; focusLabel?: string }>,
): CircuitPreviewCandidate | null {
  if (!sessions || sessions.length === 0) return null
  
  let bestSafeCandidate: CircuitPreviewCandidate | null = null
  let bestOverrideCandidate: CircuitPreviewCandidate | null = null
  let bestSupersetCandidate: CircuitPreviewCandidate | null = null
  let bestSafeScore = -Infinity
  let bestOverrideScore = -Infinity
  let bestSupersetScore = -Infinity
  
  for (let dayIndex = 0; dayIndex < sessions.length; dayIndex++) {
    const session = sessions[dayIndex]
    const exercises = (session.exercises || []).map(e => e.name || 'Unknown')
    const sessionTitle = session.focusLabel || session.focus || `Day ${dayIndex + 1}`
    
    const { selected, skipped, patterns, reason, hasSkillHoldCaution, hasSamePatternCaution, safeCount } = findCircuitCompatibleExercises(exercises)
    const { score, notes } = scoreSessionForCircuit(exercises, sessionTitle)
    
    const dayLabel = formatDayLabel(dayIndex, sessionTitle)
    
    const confidence: CircuitPreviewCandidate['confidence'] = 
      selected.length >= 4 && score > 60 ? 'high' :
      selected.length >= 3 && score > 30 ? 'medium' :
      selected.length >= 3 ? 'low' : 'none'
    
    // [AB17.2.2.5] Determine candidate status using caution flags
    // A day with 3+ exercises including skill holds is an override candidate, not superset
    const hasCautionStations = hasSkillHoldCaution || hasSamePatternCaution
    const isSafe = selected.length >= CIRCUIT_MINIMUM_EXERCISES && safeCount >= CIRCUIT_MINIMUM_EXERCISES && !hasCautionStations
    const isOverride = selected.length >= CIRCUIT_MINIMUM_EXERCISES && !isSafe
    const isSuperset = selected.length === 2
    
    let candidateStatus: CircuitCandidateStatus
    let statusLabel: string
    
    if (isSafe) {
      candidateStatus = 'safe_circuit'
      statusLabel = `Circuit preview: ${selected.length} exercises`
    } else if (isOverride) {
      candidateStatus = 'override_with_caution'
      statusLabel = `Override candidate with caution`
    } else if (isSuperset) {
      candidateStatus = 'would_be_superset'
      statusLabel = 'Would be superset (not circuit)'
    } else {
      candidateStatus = 'no_candidate'
      statusLabel = 'No safe circuit candidate'
    }
    
    const candidate: CircuitPreviewCandidate = {
      dayIndex,
      dayLabel,
      sessionTitle,
      selectedExercises: selected,
      skippedExercises: skipped,
      candidateReason: reason,
      riskNotes: notes,
      circuitSize: selected.length,
      confidence,
      isSafeCircuitCandidate: isSafe,
      isOverrideCandidate: isOverride || isSafe, // 3+ exercises = override candidate
      candidateStatus,
      statusLabel,
      patternDistribution: patterns,
    }
    
    // Track best candidates by category
    if (isSafe && score > bestSafeScore) {
      bestSafeScore = score
      bestSafeCandidate = candidate
    } else if (isOverride && score > bestOverrideScore) {
      bestOverrideScore = score
      bestOverrideCandidate = candidate
    } else if (isSuperset && score > bestSupersetScore) {
      bestSupersetScore = score
      bestSupersetCandidate = candidate
    }
  }
  
  // [AB17.2.2.2] Return best available candidate with priority:
  // 1. Safe circuit (3+ exercises, good score)
  // 2. Override with caution (3+ exercises, risky)
  // 3. Superset (2 exercises)
  // 4. null (no candidate)
  return bestSafeCandidate || bestOverrideCandidate || bestSupersetCandidate
}

/**
 * [AB17.2] Converts a session title to a user-friendly day label.
 */
function formatDayLabel(dayIndex: number, sessionTitle?: string): string {
  const dayNum = dayIndex + 1
  if (!sessionTitle) return `Day ${dayNum}`
  
  // Convert internal titles to user-friendly labels
  const lower = sessionTitle.toLowerCase()
  if (lower.includes('push') && lower.includes('skill')) return `Day ${dayNum} — Push skill day`
  if (lower.includes('pull') && lower.includes('skill')) return `Day ${dayNum} — Pull skill day`
  if (lower.includes('heavier') || lower.includes('heavy')) return `Day ${dayNum} — Heavier strength day`
  if (lower.includes('lighter')) return `Day ${dayNum} — Lighter skill day`
  if (lower.includes('upper')) return `Day ${dayNum} — Upper body`
  if (lower.includes('lower')) return `Day ${dayNum} — Lower body`
  if (lower.includes('full')) return `Day ${dayNum} — Full body`
  
  return `Day ${dayNum} — ${sessionTitle}`
}

/**
 * [AB17.2] Builds a concrete day-specific workout preview for method override visualization.
 * 
 * @param plan - The method override plan with suggestedInsertion
 * @param sessionExercises - Array of exercise names from the affected session
 * @param sessionTitle - The session title/focus
 * @returns A concrete workout preview or undefined if not enough data
 */
export function buildMethodOverrideWorkoutPreview(
  plan: RequestedMethodOverridePlan,
  sessionExercises?: string[],
  sessionTitle?: string
): MethodOverrideWorkoutPreview | undefined {
  const insertion = plan.suggestedInsertion
  if (!insertion || insertion.dayIndex === undefined) {
    return undefined
  }
  
  const dayIndex = insertion.dayIndex
  const dayLabel = formatDayLabel(dayIndex, sessionTitle || insertion.sessionTitle)
  const exercises = sessionExercises || []
  
  // [AB17.2] Build current workout structure preview
  const currentBlocks: WorkoutPreviewBlock[] = []
  
  // Categorize exercises into blocks based on common patterns
  const skillWork = exercises.filter(e => 
    e.toLowerCase().includes('skill') || 
    e.toLowerCase().includes('hold') ||
    e.toLowerCase().includes('lean') ||
    e.toLowerCase().includes('lever')
  )
  const strengthWork = exercises.filter(e =>
    !skillWork.includes(e) && (
      e.toLowerCase().includes('push') ||
      e.toLowerCase().includes('pull') ||
      e.toLowerCase().includes('row') ||
      e.toLowerCase().includes('dip') ||
      e.toLowerCase().includes('press')
    )
  )
  const accessoryWork = exercises.filter(e =>
    !skillWork.includes(e) && !strengthWork.includes(e)
  )
  
  if (skillWork.length > 0) {
    currentBlocks.push({
      label: 'Skill Work',
      exercises: skillWork.slice(0, 3),
      changeType: 'unchanged'
    })
  }
  if (strengthWork.length > 0) {
    currentBlocks.push({
      label: 'Strength',
      exercises: strengthWork.slice(0, 3),
      changeType: 'unchanged'
    })
  }
  if (accessoryWork.length > 0) {
    currentBlocks.push({
      label: 'Accessory',
      exercises: accessoryWork.slice(0, 3),
      changeType: 'unchanged'
    })
  }
  
  // If no exercises provided, use generic blocks
  if (currentBlocks.length === 0) {
    currentBlocks.push(
      { label: 'Skill Work', exercises: ['(existing skill work)'], changeType: 'unchanged' },
      { label: 'Strength', exercises: ['(existing strength work)'], changeType: 'unchanged' },
      { label: 'Accessory', exercises: ['(existing accessory)'], changeType: 'unchanged' }
    )
  }
  
  // [AB17.2] Build proposed workout structure with method insertion
  const proposedBlocks: WorkoutPreviewBlock[] = []
  
  // Copy current blocks as unchanged
  for (const block of currentBlocks) {
    proposedBlocks.push({ ...block })
  }
  
  // Determine where to insert the method block
  const insertPosition = insertion.position
  const methodLabel = plan.label
  
  // Create the method insertion block
  const methodBlock: WorkoutPreviewBlock = {
    label: `${methodLabel} Block`,
    role: insertPosition.replace(/_/g, ' '),
    exercises: [],
    method: plan.methodKey,
    changeType: 'inserted'
  }
  
  // Determine candidate exercises for the method based on method type
  const methodKey = plan.methodKey
  // [AB17.2.2.3] Use shared helper for consistent circuit-like method detection
  if (isCircuitLikePreviewMethodKey(methodKey)) {
    // [AB17.2.1] Circuit doctrine: must use real exercises, minimum 3
    const { selected, skipped, reason } = findCircuitCompatibleExercises(exercises)
    
    if (selected.length >= CIRCUIT_MINIMUM_EXERCISES) {
      // Show real circuit candidate exercises
      methodBlock.exercises = selected.slice(0, CIRCUIT_PREFERRED_MAX)
      methodBlock.role = `${selected.length}-exercise circuit`
    } else if (selected.length === 2) {
      // [AB17.2.1] 2 exercises = superset, not circuit
      methodBlock.exercises = [
        `${selected.join(' + ')}`,
        '(2 exercises = superset, not circuit)'
      ]
      methodBlock.changeType = 'warning'
      methodBlock.label = 'Superset (not circuit)'
    } else {
      // Not enough exercises for circuit
      methodBlock.exercises = [
        'No safe circuit candidate',
        reason
      ]
      methodBlock.changeType = 'warning'
    }
  } else if (methodKey === 'drop_sets') {
    // Drop sets work on single exercises
    methodBlock.exercises = ['Target exercise with descending intensity']
  } else if (methodKey === 'cluster' || methodKey === 'cluster_sets') {
    // Cluster sets work on strength movements
    methodBlock.exercises = ['Heavy compound with intra-set rest']
  } else if (methodKey === 'rest_pause') {
    // Rest-pause for hypertrophy
    methodBlock.exercises = ['Target muscle group to near-failure']
  } else if (methodKey === 'supersets') {
    // Supersets pair exercises
    methodBlock.exercises = ['Paired exercises (antagonist or compound)']
  } else {
    methodBlock.exercises = [`${methodLabel} structure`]
  }
  
  // Insert at appropriate position
  if (insertPosition === 'after_primary' || insertPosition === 'late_accessory') {
    // Insert before last block (accessory)
    const insertIdx = Math.max(0, proposedBlocks.length - 1)
    proposedBlocks.splice(insertIdx, 0, methodBlock)
  } else if (insertPosition === 'finisher') {
    // Add at end
    proposedBlocks.push(methodBlock)
  } else {
    // Default: add after strength
    const strengthIdx = proposedBlocks.findIndex(b => b.label === 'Strength')
    if (strengthIdx >= 0) {
      proposedBlocks.splice(strengthIdx + 1, 0, methodBlock)
    } else {
      proposedBlocks.push(methodBlock)
    }
  }
  
  // [AB17.2.1] Build caution and limitations with circuit-specific handling
  let coachCaution: string
  // [AB17.2.2.3] Use shared helper for consistent circuit-like method detection
  if (isCircuitLikePreviewMethodKey(methodKey)) {
    const { selected } = findCircuitCompatibleExercises(exercises)
    if (selected.length < CIRCUIT_MINIMUM_EXERCISES) {
      coachCaution = selected.length === 2
        ? '2 exercises would create a superset, not a circuit. Circuits require 3+ exercises.'
        : 'No safe circuit candidate — need at least 3 compatible exercises with different patterns.'
    } else {
      coachCaution = plan.currentState === 'blocked'
        ? `Original coach decision blocked this: ${plan.reason.slice(0, 80)}`
        : `${selected.length}-exercise circuit with mixed patterns`
    }
  } else {
    coachCaution = plan.currentState === 'blocked'
      ? `Original coach decision blocked this: ${plan.reason.slice(0, 100)}`
      : plan.safety === 'not_recommended'
        ? `High risk: ${plan.riskNotes[0] || 'conflicts with current training goals'}`
        : plan.safety === 'needs_caution'
          ? `Moderate risk: ${plan.riskNotes[0] || 'may increase fatigue load'}`
          : 'Preview only — actual exercise grouping determined at apply time'
  }
  
  const previewLimitations: string[] = [
    'Exact exercise pairing not yet finalized',
    'Sets/reps will be calculated at apply time',
    'Preview does not account for daily readiness',
  ]
  if (!sessionExercises || sessionExercises.length === 0) {
    previewLimitations.unshift('Session exercises not available — showing generic structure')
  }
  // [AB17.2.1] Add circuit-specific limitations
  // [AB17.2.2.3] Use shared helper for consistent circuit-like method detection
  if (isCircuitLikePreviewMethodKey(methodKey) && exercises.length > 0) {
    const { selected } = findCircuitCompatibleExercises(exercises)
    if (selected.length < CIRCUIT_MINIMUM_EXERCISES) {
      previewLimitations.unshift('Circuit not possible with current exercises')
    }
  }
  
  return {
    affectedDayIndex: dayIndex,
    affectedDayLabel: dayLabel,
    affectedSessionTitle: insertion.sessionTitle || `Day ${dayIndex + 1}`,
    affectedSessionFocus: insertion.position.replace(/_/g, ' '),
    currentWorkoutPreview: currentBlocks,
    proposedWorkoutPreview: proposedBlocks,
    changedBlocks: [methodBlock.label],
    affectedExercises: methodBlock.exercises,
    unchangedExercises: exercises.slice(0, 5),
    insertionReason: insertion.summary || `Add ${methodLabel} to training structure`,
    coachCaution,
    previewLimitations,
    isConcretePreview: (sessionExercises?.length ?? 0) > 0,
  }
}

/**
 * [AB17.2.2.1] Program session context for circuit preview creation.
 * Allows circuits to scan all program days for the best candidate.
 */
export interface PreviewCreationContext {
  programSessions?: Array<{
    exercises?: Array<{ name?: string }>
    focus?: string
    focusLabel?: string
    title?: string
  }>
}

export function saveMethodOverridePreview(
  plan: RequestedMethodOverridePlan,
  sessionExercises?: string[],
  sessionTitle?: string,
  context?: PreviewCreationContext
): MethodOverridePreview {
  // [AB16.2] Derive current structure based on method state
  const currentStructure = plan.currentState === 'applied' || plan.currentState === 'materialized'
    ? `${plan.label} is already included in your program`
    : plan.currentState === 'blocked'
      ? `Currently blocked: ${plan.reason.slice(0, 80)}${plan.reason.length > 80 ? '...' : ''}`
      : plan.currentState === 'deferred'
        ? `Deferred for future consideration`
        : `Straight sets / standard structure`
  
  // [AB16.2] Derive proposed structure from plan
  const proposedStructure = plan.suggestedInsertion
    ? `Add ${plan.label} ${plan.suggestedInsertion.position.replace(/_/g, ' ')} on ${plan.suggestedInsertion.sessionTitle}`
    : plan.canPreview
      ? `Preview ${plan.label} integration (no safe insertion point identified)`
      : `Cannot preview: ${plan.headline}`
  
  // [AB16.2] Build impact summary
  const impactSummary = plan.suggestedInsertion?.summary 
    || (plan.canPreview 
        ? `Would add ${plan.label} to training structure`
        : `No structural change available`)
  
  // [AB16.2] Build risk summary from safety and risk notes
  const riskSummary = plan.riskNotes.length > 0
    ? plan.riskNotes[0]
    : plan.safety === 'safe_preview'
      ? 'Low risk - fits your current training profile'
      : plan.safety === 'needs_caution'
        ? 'Moderate risk - may increase fatigue'
        : plan.safety === 'not_recommended'
          ? 'High risk - conflicts with current goals'
          : 'Insufficient data to assess risk'
  
  // [AB16.2] Build visible proof lines
  const visibleProofLines: string[] = [
    `Method: ${plan.label}`,
    `Current: ${currentStructure}`,
    `Proposed: ${proposedStructure}`,
    `Safety: ${plan.safety.replace(/_/g, ' ')}`,
  ]
  if (plan.placementNotes.length > 0) {
    visibleProofLines.push(`Placement: ${plan.placementNotes[0]}`)
  }
  
  // [AB17.2] Build concrete workout preview if possible
  const workoutPreview = buildMethodOverrideWorkoutPreview(plan, sessionExercises, sessionTitle)
  
  // [AB17.2.2.1] Build circuit-specific candidate for circuits
  // Use findBestCircuitPreviewCandidate() when full program sessions are available
  // [AB17.2.2.3] Use shared helper for consistent circuit-like method detection (singular/plural)
  let circuitCandidate: CircuitPreviewCandidate | undefined
  if (isCircuitLikePreviewMethodKey(plan.methodKey)) {
    const programSessions = context?.programSessions
    
    if (programSessions && programSessions.length > 0) {
      // [AB17.2.2.1] AUTHORITATIVE PATH: Use findBestCircuitPreviewCandidate to scan ALL program days
      circuitCandidate = findBestCircuitPreviewCandidate(programSessions) ?? undefined
      
      // Add proof that we scanned all program days
      if (circuitCandidate) {
        circuitCandidate.riskNotes = [
          `Scanned all ${programSessions.length} program days`,
          ...circuitCandidate.riskNotes
        ]
      }
    } else {
      // [AB17.2.2.1] FALLBACK PATH: Single-session preview when full program not available
      const exercises = sessionExercises || []
      const { selected, skipped, patterns, reason, hasSkillHoldCaution, hasSamePatternCaution, safeCount } = findCircuitCompatibleExercises(exercises)
      const dayIndex = plan.suggestedInsertion?.dayIndex ?? 0
      const dayLabel = formatDayLabel(dayIndex, sessionTitle || plan.suggestedInsertion?.sessionTitle)
      
      // Score this session for circuit suitability
      const { score, notes: riskNotes } = scoreSessionForCircuit(exercises, sessionTitle || '')
      
      const confidence: CircuitPreviewCandidate['confidence'] = 
        selected.length >= 4 && score > 60 ? 'high' :
        selected.length >= 3 && score > 30 ? 'medium' :
        selected.length >= 3 ? 'low' : 'none'
      
      // [AB17.2.2.5] Determine candidate status using caution flags (same logic as main path)
      const hasCautionStations = hasSkillHoldCaution || hasSamePatternCaution
      const isSafe = selected.length >= CIRCUIT_MINIMUM_EXERCISES && safeCount >= CIRCUIT_MINIMUM_EXERCISES && !hasCautionStations
      const isOverride = selected.length >= CIRCUIT_MINIMUM_EXERCISES && !isSafe
      const isSuperset = selected.length === 2
      
      let candidateStatus: CircuitCandidateStatus
      let statusLabel: string
      
      if (isSafe) {
        candidateStatus = 'safe_circuit'
        statusLabel = `Circuit preview: ${selected.length} exercises`
      } else if (isOverride) {
        candidateStatus = 'override_with_caution'
        statusLabel = 'Override candidate with caution'
      } else if (isSuperset) {
        candidateStatus = 'would_be_superset'
        statusLabel = 'Would be superset (not circuit)'
      } else {
        candidateStatus = 'no_candidate'
        statusLabel = 'No safe circuit candidate'
      }
      
      circuitCandidate = {
        dayIndex,
        dayLabel,
        sessionTitle: sessionTitle || plan.suggestedInsertion?.sessionTitle || `Day ${dayIndex + 1}`,
        selectedExercises: selected,
        skippedExercises: skipped,
        candidateReason: reason,
        riskNotes: ['Single-session preview only — full program scan unavailable', ...riskNotes],
        circuitSize: selected.length,
        confidence,
        isSafeCircuitCandidate: isSafe,
        isOverrideCandidate: isOverride || isSafe,
        candidateStatus,
        statusLabel,
        patternDistribution: patterns,
      }
    }
  }
  
  const preview: MethodOverridePreview = {
    methodKey: plan.methodKey,
    label: plan.label,
    generatedAt: new Date().toISOString(),
    planSummary: plan.suggestedInsertion?.summary || plan.headline,
    placement: plan.placement,
    safety: plan.safety,
    suggestedDayIndex: plan.suggestedInsertion?.dayIndex,
    canApplyToSavedProgramNow: false,
    // [AB16.2] Structured diff fields
    currentStructure,
    proposedStructure,
    impactSummary,
    riskSummary,
    visibleProofLines,
    savedProgramUnchanged: true,
    // [AB17.2] Concrete workout preview
    workoutPreview,
    // [AB17.2.2] Circuit-specific candidate
    circuitCandidate,
  }
  
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existing = getMethodOverridePreviews()
      const updated = [...existing.filter(p => p.methodKey !== plan.methodKey), preview]
      window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(updated))
    }
  } catch {
    // Storage not available �� preview is component-state only
  }
  
  return preview
}

export function getMethodOverridePreviews(): MethodOverridePreview[] {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(PREVIEW_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as MethodOverridePreview[]
      }
    }
  } catch {
    // Storage not available
  }
  return []
}

export function clearMethodOverridePreview(methodKey: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existing = getMethodOverridePreviews()
      const updated = existing.filter(p => p.methodKey !== methodKey)
      window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(updated))
    }
  } catch {
    // Storage not available
  }
}

export function clearAllMethodOverridePreviews(): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(PREVIEW_STORAGE_KEY)
    }
  } catch {
    // Storage not available
  }
}

// =============================================================================
// [AB20 / IQ10] METHOD OVERRIDE APPLY CORRIDOR
// =============================================================================

/**
 * [AB20] Apply status for method override application result.
 */
export type MethodOverrideApplyStatus =
  | 'success'
  | 'blocked'
  | 'cancelled'
  | 'already_applied'

/**
 * [AB20] Reason codes for apply results.
 */
export type MethodOverrideApplyReasonCode =
  | 'applied_safe_circuit'
  | 'applied_caution_circuit'
  | 'no_program'
  | 'no_preview'
  | 'unsupported_method'
  | 'not_circuit_candidate'
  | 'would_be_superset'
  | 'no_candidate'
  | 'candidate_missing_session'
  | 'candidate_missing_exercises'
  | 'selected_exercise_not_found'
  | 'already_materialized'
  | 'stale_preview'
  | 'save_failed'

/**
 * [AB20] Result of applying a method override preview to a program.
 */
export interface MethodOverrideApplyResult {
  status: MethodOverrideApplyStatus
  updatedProgram?: AdaptiveProgram
  visibleSummary: string
  evidence: string[]
  reasonCode: MethodOverrideApplyReasonCode
}

/**
 * [AB20] Normalizes exercise name for matching.
 */
function normalizeExerciseName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * [AB20] Applies a method override preview to a program.
 * 
 * This is a PURE function that returns a new program object.
 * It does NOT mutate the original program.
 * It does NOT persist to storage (caller must handle that).
 * 
 * Only circuits are supported in AB20.
 */
export function applyMethodOverridePreviewToProgram(args: {
  program: AdaptiveProgram
  preview: MethodOverridePreview
  allowCautionApply: boolean
}): MethodOverrideApplyResult {
  const { program, preview, allowCautionApply } = args
  
  // Guard: Must have program
  if (!program) {
    return {
      status: 'blocked',
      visibleSummary: 'No program available.',
      evidence: ['program is null or undefined'],
      reasonCode: 'no_program',
    }
  }
  
  // Guard: Must have preview
  if (!preview) {
    return {
      status: 'blocked',
      visibleSummary: 'No preview available.',
      evidence: ['preview is null or undefined'],
      reasonCode: 'no_preview',
    }
  }
  
  // [AB20] Only support circuit previews in this step
  if (!preview.circuitCandidate) {
    return {
      status: 'blocked',
      visibleSummary: 'Only circuit method overrides are supported in this version.',
      evidence: ['preview.circuitCandidate is missing', `methodKey: ${preview.methodKey}`],
      reasonCode: 'unsupported_method',
    }
  }
  
  const candidate = preview.circuitCandidate
  const status = candidate.candidateStatus
  
  // Check candidate status
  if (status === 'no_candidate') {
    return {
      status: 'blocked',
      visibleSummary: 'No valid circuit candidate found.',
      evidence: ['candidateStatus is no_candidate'],
      reasonCode: 'no_candidate',
    }
  }
  
  if (status === 'would_be_superset') {
    return {
      status: 'blocked',
      visibleSummary: 'Only 2 exercises — would be superset, not circuit.',
      evidence: ['candidateStatus is would_be_superset', `circuitSize: ${candidate.circuitSize}`],
      reasonCode: 'would_be_superset',
    }
  }
  
  // Check for caution apply permission
  if (status === 'override_with_caution' && !allowCautionApply) {
    return {
      status: 'blocked',
      visibleSummary: 'Caution preview requires manual review confirmation.',
      evidence: ['candidateStatus is override_with_caution', 'allowCautionApply is false'],
      reasonCode: 'not_circuit_candidate',
    }
  }
  
  // Verify minimum exercises
  if (candidate.selectedExercises.length < 3) {
    return {
      status: 'blocked',
      visibleSummary: 'Circuit requires at least 3 exercises.',
      evidence: [`selectedExercises.length: ${candidate.selectedExercises.length}`],
      reasonCode: 'candidate_missing_exercises',
    }
  }
  
  // Find target session
  const dayIndex = candidate.dayIndex
  const sessions = program.sessions || []
  
  if (dayIndex < 0 || dayIndex >= sessions.length) {
    return {
      status: 'blocked',
      visibleSummary: 'Target session not found.',
      evidence: [`dayIndex: ${dayIndex}`, `sessions.length: ${sessions.length}`],
      reasonCode: 'candidate_missing_session',
    }
  }
  
  const targetSession = sessions[dayIndex]
  if (!targetSession || !targetSession.exercises) {
    return {
      status: 'blocked',
      visibleSummary: 'Target session has no exercises.',
      evidence: ['targetSession.exercises is missing'],
      reasonCode: 'candidate_missing_session',
    }
  }
  
  // [AB20] Verify all selected exercises exist in the target session
  const sessionExerciseNames = targetSession.exercises.map(ex => normalizeExerciseName(ex.name || ''))
  const matchedExercises: Array<{ name: string; index: number }> = []
  
  for (const selectedName of candidate.selectedExercises) {
    const normalized = normalizeExerciseName(selectedName)
    const foundIndex = sessionExerciseNames.findIndex(n => n === normalized)
    
    if (foundIndex === -1) {
      return {
        status: 'blocked',
        visibleSummary: `Exercise not found in session: ${selectedName}`,
        evidence: [
          `selectedExercise: ${selectedName}`,
          `normalized: ${normalized}`,
          `sessionExercises: ${sessionExerciseNames.join(', ')}`,
        ],
        reasonCode: 'selected_exercise_not_found',
      }
    }
    
    matchedExercises.push({ name: selectedName, index: foundIndex })
  }
  
  // Check if circuit is already applied with same exercises
  const existingStyledGroups = targetSession.styleMetadata?.styledGroups || []
  const existingCircuit = existingStyledGroups.find(g => 
    g.groupType === 'circuit' && 
    g.exercises?.length === matchedExercises.length &&
    g.exercises?.every(ex => 
      candidate.selectedExercises.some(sel => 
        normalizeExerciseName(sel) === normalizeExerciseName(ex.name || '')
      )
    )
  )
  
  if (existingCircuit) {
    return {
      status: 'already_applied',
      visibleSummary: 'Circuit already applied with these exercises.',
      evidence: ['Matching styledGroup already exists'],
      reasonCode: 'already_materialized',
    }
  }
  
  // ==========================================================================
  // BUILD THE UPDATED PROGRAM
  // ==========================================================================
  
  const isCaution = status === 'override_with_caution'
  
  // Deep clone the program to avoid mutation
  const updatedProgram: AdaptiveProgram = JSON.parse(JSON.stringify(program))
  const updatedSession = updatedProgram.sessions![dayIndex]
  
  // Build the circuit styledGroup entry
  const circuitGroupId = `method-override-circuit-day-${dayIndex + 1}-${Date.now()}`
  const circuitExercises = matchedExercises.map((matched, idx) => {
    const originalEx = targetSession.exercises![matched.index]
    return {
      id: originalEx.id || `circuit-ex-${idx}`,
      name: originalEx.name || matched.name,
      prefix: `C${idx + 1}`,
      trainingMethod: 'circuits' as const,
      methodRationale: isCaution
        ? 'Applied from Method Override Planner caution preview after manual review.'
        : 'Applied from Method Override Planner safe circuit preview.',
    }
  })
  
  const newCircuitGroup = {
    id: circuitGroupId,
    groupType: 'circuit' as const,
    exercises: circuitExercises,
    instruction: isCaution
      ? 'Manual-review circuit: keep technical quality high and stop if skill quality or tendon tension degrades.'
      : 'Move through these exercises as a controlled circuit while preserving clean reps.',
    restProtocol: isCaution
      ? 'Use conservative pacing; rest enough to preserve skill quality.'
      : 'Minimal rest between stations; moderate rest between rounds.',
  }
  
  // Update session.styleMetadata
  type SessionStyleMetadata = NonNullable<AdaptiveSession['styleMetadata']>
  const existingMeta = (updatedSession.styleMetadata || {}) as Partial<SessionStyleMetadata>
  const existingAppliedMethods: string[] = Array.isArray(existingMeta.appliedMethods) 
    ? [...existingMeta.appliedMethods] 
    : []
  
  // Add circuits to appliedMethods if not present
  if (!existingAppliedMethods.includes('circuits')) {
    existingAppliedMethods.push('circuits')
  }
  
  // Remove circuits from rejectedMethods if present
  type RejectedMethod = { method: string; reason: string }
  let updatedRejectedMethods: RejectedMethod[] = existingMeta.rejectedMethods || []
  if (Array.isArray(updatedRejectedMethods)) {
    updatedRejectedMethods = updatedRejectedMethods.filter((r: RejectedMethod) => 
      r.method !== 'circuits' && r.method !== 'circuit'
    )
  }
  
  // Build updated styledGroups
  const updatedStyledGroups = [
    ...(existingMeta.styledGroups || []),
    newCircuitGroup,
  ]
  
  // Apply to session.styleMetadata - preserve all existing fields
  updatedSession.styleMetadata = {
    primaryStyle: existingMeta.primaryStyle || 'circuits',
    hasSupersetsApplied: existingMeta.hasSupersetsApplied || false,
    hasCircuitsApplied: true,
    hasDensityApplied: existingMeta.hasDensityApplied || false,
    hasClusterApplied: existingMeta.hasClusterApplied,
    clusterDecision: existingMeta.clusterDecision,
    structureDescription: existingMeta.structureDescription || 'Circuit override applied',
    appliedMethods: existingAppliedMethods as SessionStyleMetadata['appliedMethods'],
    rejectedMethods: updatedRejectedMethods,
    styledGroups: updatedStyledGroups as SessionStyleMetadata['styledGroups'],
    materializationAudit: existingMeta.materializationAudit,
    methodIntentContract: existingMeta.methodIntentContract,
    methodMaterializationSummary: existingMeta.methodMaterializationSummary,
  } as SessionStyleMetadata
  
  // ==========================================================================
  // UPDATE PROGRAM-LEVEL weeklyMethodRepresentation (if exists)
  // ==========================================================================
  
  if (updatedProgram.weeklyMethodRepresentation?.byMethod) {
    const byMethod = updatedProgram.weeklyMethodRepresentation.byMethod
    
    // Find circuit entry in the byMethod array
    const circuitEntry = byMethod.find(m => 
      m.methodId?.toLowerCase().includes('circuit')
    )
    
    if (circuitEntry) {
      circuitEntry.status = 'APPLIED'
      circuitEntry.materializedCount = Math.max(circuitEntry.materializedCount || 0, 1)
      circuitEntry.reason = 'Applied from Method Override Planner override preview.'
    }
    
    // Update totals if present
    if (updatedProgram.weeklyMethodRepresentation.totals) {
      const totals = updatedProgram.weeklyMethodRepresentation.totals
      totals.methodsApplied = Math.max(totals.methodsApplied || 0, 1)
    }
    
    // Update oneLineExplanation
    const existingExplanation = updatedProgram.weeklyMethodRepresentation.oneLineExplanation || ''
    if (!existingExplanation.includes('Circuit override')) {
      updatedProgram.weeklyMethodRepresentation.oneLineExplanation = 
        existingExplanation + ' Circuit override applied to 1 session from the Method Override Planner.'
    }
  }
  
  // ==========================================================================
  // RETURN SUCCESS
  // ==========================================================================
  
  return {
    status: 'success',
    updatedProgram,
    visibleSummary: isCaution 
      ? 'Circuit override applied with caution — saved program updated.'
      : 'Circuit override applied — saved program updated.',
    evidence: [
      `Applied circuit to Day ${dayIndex + 1} (${candidate.sessionTitle})`,
      `Exercises: ${candidate.selectedExercises.join(', ')}`,
      `Circuit size: ${candidate.circuitSize}`,
      isCaution ? 'Applied with caution after manual review' : 'Applied as safe circuit',
      `styledGroup id: ${circuitGroupId}`,
    ],
    reasonCode: isCaution ? 'applied_caution_circuit' : 'applied_safe_circuit',
  }
}
