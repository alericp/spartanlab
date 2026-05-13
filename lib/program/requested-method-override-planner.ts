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

// =============================================================================
// [AB20.3] METHOD CAPABILITY REGISTRY
// =============================================================================

/**
 * [AB20.3] Canonical method keys for override planning.
 * Normalizes all known variants to a single canonical form.
 */
export type CanonicalOverrideMethodKey =
  | 'circuits'
  | 'density_block'
  | 'endurance_density'
  | 'top_set_backoff'
  | 'drop_set'
  | 'cluster'
  | 'rest_pause'
  | 'superset'
  | 'finisher'
  | 'unknown'

/**
 * [AB20.3] Writer support classification for method override apply.
 */
export type MethodOverrideWriterKind =
  | 'grouped_circuit'      // Creates a circuit styledGroup
  | 'grouped_density_block' // Creates a density_block styledGroup
  | 'grouped_cluster'      // Creates a cluster styledGroup
  | 'row_level_method'     // Applies to individual exercise rows
  | 'preview_only'         // Preview supported but no writer yet
  | 'unsupported'          // Not supported for override

/**
 * [AB20.3] Method override capability definition.
 * Determines what actions are available for each method.
 */
export interface MethodOverrideCapability {
  canonicalKey: CanonicalOverrideMethodKey
  displayLabel: string
  canPlan: boolean
  canCreatePreview: boolean
  canApplyToSavedProgramNow: boolean
  canRevert: boolean
  writerKind: MethodOverrideWriterKind
  applyUnsupportedReason?: string
  previewDescription: string
  methodDescription: string
}

/**
 * [AB20.3] Normalizes any method key variant to its canonical form.
 */
export function normalizeOverrideMethodKey(raw: string | null | undefined): CanonicalOverrideMethodKey {
  if (!raw) return 'unknown'
  const normalized = raw.toLowerCase().trim().replace(/-/g, '_').replace(/\s+/g, '_')
  
  // Circuits
  if (normalized === 'circuit' || normalized === 'circuits') return 'circuits'
  
  // Density blocks
  if (normalized === 'density' || normalized === 'density_block' || normalized === 'density_blocks') return 'density_block'
  
  // Endurance/Conditioning
  if (normalized === 'endurance' || normalized === 'conditioning' || normalized === 'endurance_density' || 
      normalized === 'endurance_conditioning') return 'endurance_density'
  
  // Top Set + Backoff
  if (normalized === 'top_set' || normalized === 'top_set_backoff' || normalized === 'top_set_and_backoff' ||
      normalized === 'top_set_back_off' || normalized === 'topset' || normalized === 'topset_backoff') return 'top_set_backoff'
  
  // Drop Sets
  if (normalized === 'drop_set' || normalized === 'drop_sets' || normalized === 'dropset' || 
      normalized === 'dropsets') return 'drop_set'
  
  // Cluster Sets
  if (normalized === 'cluster' || normalized === 'cluster_sets' || normalized === 'clusters' ||
      normalized === 'cluster_set') return 'cluster'
  
  // Rest-Pause
  if (normalized === 'rest_pause' || normalized === 'rest_pauses' || normalized === 'restpause' ||
      normalized === 'rest_pause_sets') return 'rest_pause'
  
  // Supersets
  if (normalized === 'superset' || normalized === 'supersets') return 'superset'
  
  // Finishers
  if (normalized === 'finisher' || normalized === 'finishers' || normalized === 'endurance_finisher') return 'finisher'
  
  return 'unknown'
}

/**
 * [AB20.3] Method capability registry.
 * Defines what each method can do in the override planner.
 */
const METHOD_CAPABILITIES: Record<CanonicalOverrideMethodKey, MethodOverrideCapability> = {
  circuits: {
    canonicalKey: 'circuits',
    displayLabel: 'Circuits',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: true,
    canRevert: true,
    writerKind: 'grouped_circuit',
    previewDescription: 'Circuit preview with exercise rotation',
    methodDescription: 'Rotate through multiple stations for rounds with minimal rest between exercises.',
  },
  density_block: {
    canonicalKey: 'density_block',
    displayLabel: 'Density Blocks',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: true, // Enabled - we have density_block styledGroup support
    canRevert: true,
    writerKind: 'grouped_density_block',
    previewDescription: 'Timed density block candidate',
    methodDescription: 'Short time-capped block with AMRAP/EMOM-style controlled volume and conservative fatigue guardrails.',
  },
  endurance_density: {
    canonicalKey: 'endurance_density',
    displayLabel: 'Endurance/Conditioning',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: true, // [AB20.4.3] Enabled with session-level finisher writer
    canRevert: true,
    writerKind: 'row_level_method',
    previewDescription: 'Endurance-focused conditioning preview',
    methodDescription: 'Extended conditioning work focused on aerobic capacity and work tolerance.',
  },
  top_set_backoff: {
    canonicalKey: 'top_set_backoff',
    displayLabel: 'Top Set + Backoff',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: true, // [AB20.4.3] Enabled with row-level writer
    canRevert: true,
    writerKind: 'row_level_method',
    previewDescription: 'Heavy first set with reduced backoff sets',
    methodDescription: 'Heavy first working set near max effort followed by lighter backoff sets to accumulate volume safely.',
  },
  drop_set: {
    canonicalKey: 'drop_set',
    displayLabel: 'Drop Sets',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: true, // [AB20.4.3] Enabled with row-level writer
    canRevert: true,
    writerKind: 'row_level_method',
    previewDescription: 'Progressive weight reduction for fatigue',
    methodDescription: 'Single exercise extended with progressive weight reductions after near-failure to maximize muscle fatigue.',
  },
  cluster: {
    canonicalKey: 'cluster',
    displayLabel: 'Cluster Sets',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: true, // [AB20.4.3] Enabled with row-level writer
    canRevert: true,
    writerKind: 'row_level_method',
    previewDescription: 'Intra-set rest cluster preview',
    methodDescription: 'Heavy compound work with short intra-set rest periods to maintain force output across more total reps.',
  },
  rest_pause: {
    canonicalKey: 'rest_pause',
    displayLabel: 'Rest-Pause',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: true, // [AB20.4.3] Enabled with row-level writer
    canRevert: true,
    writerKind: 'row_level_method',
    previewDescription: 'Mini-rest extended set preview',
    methodDescription: 'Single exercise extended with short breath/mini-rests after near-failure. Best for late accessory/hypertrophy work, not primary skill or heavy technical movements.',
  },
  superset: {
    canonicalKey: 'superset',
    displayLabel: 'Supersets',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: false, // Native/generated only
    canRevert: false,
    writerKind: 'preview_only',
    applyUnsupportedReason: 'Supersets are generated natively. Override apply not available.',
    previewDescription: 'Antagonist pairing preview',
    methodDescription: 'Two exercises paired back-to-back targeting non-competing muscle groups for time efficiency.',
  },
  finisher: {
    canonicalKey: 'finisher',
    displayLabel: 'Finishers',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: false,
    canRevert: false,
    writerKind: 'preview_only',
    applyUnsupportedReason: 'Finisher placement writer not connected yet.',
    previewDescription: 'End-of-session metabolic finisher',
    methodDescription: 'Last 5-8 minutes of the session with goal-specific, fatigue-aware conditioning work.',
  },
  unknown: {
    canonicalKey: 'unknown',
    displayLabel: 'Unknown Method',
    canPlan: false,
    canCreatePreview: false,
    canApplyToSavedProgramNow: false,
    canRevert: false,
    writerKind: 'unsupported',
    applyUnsupportedReason: 'Unknown method type.',
    previewDescription: 'Method not recognized',
    methodDescription: 'This method type is not recognized by the override planner.',
  },
}

/**
 * [AB20.3] Gets the capability definition for a method key.
 */
export function getMethodOverrideCapability(methodKey: string | null | undefined): MethodOverrideCapability {
  const canonical = normalizeOverrideMethodKey(methodKey)
  return METHOD_CAPABILITIES[canonical]
}

/** Returns true for circuit method keys only (not density) */
export function isCircuitOverrideMethodKey(methodKey: string | null | undefined): boolean {
  return normalizeOverrideMethodKey(methodKey) === 'circuits'
}

/** Returns true for density-block method keys only (not circuit) */
export function isDensityOverrideMethodKey(methodKey: string | null | undefined): boolean {
  return normalizeOverrideMethodKey(methodKey) === 'density_block'
}

/** 
 * [AB20.3] Returns true for methods that use the grouped block preview scan path.
 * Both circuits and density blocks use similar exercise scanning but different writers.
 */
export function isGroupedBlockPreviewMethodKey(methodKey: string | null | undefined): boolean {
  const canonical = normalizeOverrideMethodKey(methodKey)
  return canonical === 'circuits' || canonical === 'density_block'
}

/** 
 * [AB20.3] Legacy alias for isGroupedBlockPreviewMethodKey.
 * Kept for backward compatibility but prefer isGroupedBlockPreviewMethodKey for clarity.
 */
export function isCircuitLikePreviewMethodKey(methodKey: string | null | undefined): boolean {
  return isGroupedBlockPreviewMethodKey(methodKey)
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

// =============================================================================
// [AB20.4.4.2] SESSION METHOD LOAD DETECTION
// =============================================================================

/**
 * [AB20.4.4.2] Detects existing method overrides on a session.
 * Used to prevent blind stacking of multiple methods on the same day.
 */
export interface SessionMethodLoad {
  hasUserAppliedGroupedOverride: boolean
  hasUserAppliedRowOverride: boolean
  appliedOverrideCount: number
  appliedOverrideMethodKeys: string[]
  hasNativeSuperset: boolean
  hasFinisher: boolean
  methodLoadPenalty: number // Score penalty for additional method targeting
}

export function getSessionMethodLoad(session: AdaptiveSession): SessionMethodLoad {
  const exercises = session.exercises || []
  const styleMetadata = (session.styleMetadata || {}) as Record<string, unknown>
  // [AB20.4.5.2] FIX: styledGroups is inside styleMetadata, not directly on session
  const styledGroups = (styleMetadata.styledGroups || []) as Array<{ groupType?: string; source?: string; methodOverrideApplied?: boolean }>
  
  // Check for user-applied grouped overrides (circuits, density blocks)
  const userAppliedGroups = styledGroups.filter(g => 
    (g.source === 'method_override_planner' || g.methodOverrideApplied === true) && 
    (g.groupType === 'circuit' || g.groupType === 'density_block')
  )
  const hasUserAppliedGroupedOverride = userAppliedGroups.length > 0
  
  // Check for user-applied row-level overrides
  const rowApplications = (styleMetadata.methodOverrideRowApplications || []) as Array<{ methodKey: string }>
  const rowOverrideExercises = exercises.filter(ex => 
    (ex as unknown as { methodOverrideApplied?: boolean }).methodOverrideApplied === true
  )
  const hasUserAppliedRowOverride = rowApplications.length > 0 || rowOverrideExercises.length > 0
  
  // Collect all applied override method keys
  const appliedOverrideMethodKeys: string[] = [
    ...userAppliedGroups.map(g => g.groupType || 'unknown'),
    ...rowApplications.map(r => r.methodKey),
  ]
  const appliedOverrideCount = appliedOverrideMethodKeys.length
  
  // Check for native supersets (not penalized as heavily)
  const hasNativeSuperset = styledGroups.some(g => 
    g.groupType === 'superset' && g.source !== 'method_override_planner'
  ) || exercises.some(ex => 
    (ex as unknown as { groupType?: string }).groupType === 'superset' ||
    (ex as unknown as { blockGroupType?: string }).blockGroupType === 'superset'
  )
  
  // Check for finisher
  const hasFinisher = (styleMetadata.hasFinisher === true) || exercises.some(ex => 
    (ex as unknown as { isFinisher?: boolean }).isFinisher === true ||
    (ex.name || '').toLowerCase().includes('finisher') ||
    (ex as unknown as { methodOverrideMethodKey?: string }).methodOverrideMethodKey === 'endurance_density'
  )
  
  // Calculate penalty for targeting this session with another method
  // Higher penalty = less desirable target
  let methodLoadPenalty = 0
  if (hasUserAppliedGroupedOverride) methodLoadPenalty += 50 // Heavy penalty for existing grouped override
  if (hasUserAppliedRowOverride) methodLoadPenalty += 30 // Moderate penalty for existing row override
  if (hasFinisher) methodLoadPenalty += 20 // Some penalty for existing finisher
  if (hasNativeSuperset) methodLoadPenalty += 5 // Light penalty for native supersets
  methodLoadPenalty += appliedOverrideCount * 15 // Penalty per override already applied
  
  return {
    hasUserAppliedGroupedOverride,
    hasUserAppliedRowOverride,
    appliedOverrideCount,
    appliedOverrideMethodKeys,
    hasNativeSuperset,
    hasFinisher,
    methodLoadPenalty,
  }
}

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

/**
 * [AB20.4] Plan Rest-Pause method override.
 * Rest-Pause is a row-level hypertrophy method for late accessory work.
 */
function planRestPause(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // Rest-Pause is for late accessory/hypertrophy work, not primary skill or heavy technical movements
  const bestSession = sessions.find(s => !s.hasPrimarySkillWork && !s.isOverloaded)
    || sessions.find(s => !s.isOverloaded)
  
  return {
    safety: bestSession ? 'safe_preview' : 'needs_caution',
    placement: bestSession ? 'same_session_late' : 'different_day',
    headline: bestSession 
      ? `Rest-Pause can be previewed on ${bestSession.title} as late accessory`
      : 'Rest-Pause placement needs caution — consider a different day',
    suggestedInsertion: bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'late_accessory',
      structure: 'unknown', // Row-level method, not a structure
      summary: 'Mini-rest extended set for hypertrophy on a late accessory movement',
    } : undefined,
    riskNotes: [
      'Rest-Pause creates significant fatigue — avoid primary skill holds',
      'Not suitable for heavy technical work or explosive movements',
      'Best for isolation/accessory exercises with established form',
    ],
    placementNotes: [
      'Target a late accessory movement, not the primary exercise',
      'Works well on isolation exercises (curls, extensions, lateral raises)',
      'After near-failure, rest 10-15 seconds, then continue to next mini-set',
    ],
    dosageGuardrails: [
      'Limit to 1-2 rest-pause applications per session',
      'Use on movements where form breakdown is safe',
      'Reserve for hypertrophy-focused blocks, not strength phases',
    ],
    avoids: [
      'Primary skill holds (planche, front lever, etc.)',
      'Heavy weighted pull-ups/dips at max effort',
      'Complex technical movements',
      'Movements with injury risk under fatigue',
    ],
  }
}

/**
 * [AB20.4] Plan Endurance/Conditioning method override.
 * Distinct from density blocks - focuses on aerobic capacity and work tolerance.
 */
function planEndurance(
  input: MethodOverridePlannerInput,
  sessions: SessionAnalysis[],
): Partial<RequestedMethodOverridePlan> {
  // Endurance/Conditioning is distinct from density blocks
  const bestSession = sessions.find(s => !s.hasPrimarySkillWork && !s.isOverloaded && s.hasFinisher === false)
    || sessions.find(s => !s.isOverloaded)
  
  return {
    safety: 'needs_caution',
    placement: bestSession ? 'same_session_late' : 'different_day',
    headline: 'Endurance/Conditioning is distinct from Density Blocks — requires dedicated finisher writer',
    suggestedInsertion: bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'finisher',
      structure: 'finisher',
      summary: 'Conditioning finisher focused on aerobic capacity and work tolerance',
    } : undefined,
    riskNotes: [
      'Endurance/Conditioning is NOT the same as Density Blocks',
      'Density Blocks are time-capped AMRAP/EMOM for controlled volume',
      'Endurance/Conditioning focuses on sustained aerobic capacity',
    ],
    placementNotes: [
      'Place at end of session as dedicated conditioning work',
      'Distinct from density blocks which are mid-session quality work',
      'May require separate day for longer conditioning sessions',
    ],
    dosageGuardrails: [
      'Do not substitute for density blocks without understanding the difference',
      'Conditioning should not compete with primary skill work recovery',
      'Consider recovery impact on subsequent training days',
    ],
    avoids: [
      'Conflating with density blocks (they serve different purposes)',
      'Placing before skill work in the same session',
      'High-intensity conditioning on skill-focused days',
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
  // [AB20.4] Use canonical key normalization for consistent method detection
  let methodPlan: Partial<RequestedMethodOverridePlan> = {}
  const canonicalKey = normalizeOverrideMethodKey(methodItem.methodKey)
  
  switch (canonicalKey) {
    case 'top_set_backoff':
      methodPlan = planTopSet(input, sessions)
      break
    case 'drop_set':
      methodPlan = planDropSet(input, sessions)
      break
    case 'finisher':
      methodPlan = planFinisher(input, sessions)
      break
    case 'circuits':
      methodPlan = planCircuit(input, sessions)
      break
    case 'superset':
      methodPlan = planSuperset(input, sessions)
      break
    case 'density_block':
      methodPlan = planDensity(input, sessions)
      break
    case 'cluster':
      methodPlan = planCluster(input, sessions)
      break
    case 'rest_pause':
      methodPlan = planRestPause(input, sessions)
      break
    case 'endurance_density':
      methodPlan = planEndurance(input, sessions)
      break
    default:
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
  // [AB20.4] Use canonicalKey for consistent method detection
  const isCircuitLikeMethod = isGroupedBlockPreviewMethodKey(canonicalKey)
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
  /** [AB20.4] Whether the preview can be applied to saved program now (based on capability) */
  canApplyToSavedProgramNow: boolean
  
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
  
  // [AB20.3] Optional cached capability for apply eligibility checks
  /** Cached capability info (avoids re-lookup during apply eligibility) */
  methodCapability?: MethodOverrideCapability
  /** Target group type for grouped block methods */
  targetGroupType?: 'circuit' | 'density_block' | 'cluster'
  // [AB20.4.3] Row-level method target model
  targetExercises?: MethodOverrideTargetExercise[]
  applicationPatchPreview?: MethodOverrideSavedProgramPatchPreview
  applyDisabledReason?: string
  // [AB20.4.4.1] Severity assessment for practicality display
  severityAssessment?: MethodOverrideSeverityAssessment
}

// =============================================================================
// [AB20.4.3] ROW-LEVEL METHOD TARGET MODEL
// =============================================================================

export type MethodOverrideTargetRole = 
  | 'primary_strength' | 'late_accessory' | 'hypertrophy_accessory' 
  | 'conditioning_finisher' | 'quality_strength'

export type MethodOverrideTargetSafety = 'safe' | 'caution' | 'blocked'

// =============================================================================
// [AB20.4.4.1] SEVERITY / PRACTICALITY ASSESSMENT SYSTEM
// =============================================================================

/**
 * [AB20.4.4.1] Severity level classification for method override practicality.
 * Determines UI state and available actions.
 */
export type MethodOverrideSeverityLevel =
  | 'recommended'           // Safe target exists, no major cautions
  | 'acceptable_with_caution' // Target exists with cautions, applyable after confirmation
  | 'not_recommended'       // No ideal target, but forceable target may exist
  | 'strongly_discouraged'  // Only poor targets exist, force override with significant warnings
  | 'blocked_impossible'    // No valid mutation path, cannot apply

/**
 * [AB20.4.4.1] Comprehensive severity assessment for method override.
 * Provides all information needed for UI rendering and decision flow.
 */
export interface MethodOverrideSeverityAssessment {
  level: MethodOverrideSeverityLevel
  label: string
  summary: string
  whyThisLevel: string[]
  trainingTradeoffs: string[]
  riskDrivers: string[]
  protectiveConditions: string[]
  candidateScanSummary: {
    totalSessionsScanned: number
    totalExercisesScanned: number
    safeTargetsFound: number
    cautionTargetsFound: number
    blockedTargetsFound: number
    forceableTargetsFound: number
    bestTargetDescription?: string
    topBlockerReasons: string[]
  }
  canForceOverride: boolean
  forceOverrideLabel?: string
  forceOverrideWarning?: string
  forceOverrideDisabledReason?: string
  blockedReasonCode?: string
}

export interface MethodOverrideTargetExercise {
  sessionIndex: number
  dayLabel: string
  sessionTitle: string
  exerciseIndex: number
  exerciseName: string
  methodKey: CanonicalOverrideMethodKey
  targetRole: MethodOverrideTargetRole
  score: number
  safety: MethodOverrideTargetSafety
  reasons: string[]
  cautions: string[]
}

export interface MethodOverrideSavedProgramPatchPreview {
  methodKey: CanonicalOverrideMethodKey
  patchKind: 'row_level_method' | 'session_finisher' | 'grouped_block'
  targetExercises: MethodOverrideTargetExercise[]
  affectedSessionIndexes: number[]
  visibleBefore: string[]
  visibleAfter: string[]
  exactMutationSummary: string[]
}

const PREVIEW_STORAGE_KEY = 'spartanlab:requestedMethodOverridePreview'

// =============================================================================
// [AB20.4.3] ROW-LEVEL METHOD TARGETING HELPERS
// =============================================================================

const SKILL_HOLD_PATTERNS = [
  'front lever', 'back lever', 'planche', 'l-sit', 'v-sit',
  'handstand', 'frog stand', 'tuck planche', 'straddle planche',
  'manna', 'iron cross', 'maltese', 'victorian', 'one arm hang', 'dead hang', 'active hang'
]

const EXPLOSIVE_PATTERNS = ['explosive', 'plyometric', 'plyo', 'jump', 'bound', 'clapping', 'kipping', 'swing']

function isSkillHoldExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return SKILL_HOLD_PATTERNS.some(pattern => lower.includes(pattern))
}

function isExplosiveExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return EXPLOSIVE_PATTERNS.some(pattern => lower.includes(pattern))
}

function isHeavyStrengthCandidate(exerciseName: string): boolean {
  const lower = exerciseName.toLowerCase()
  const patterns = ['pull-up', 'pullup', 'pull up', 'chin-up', 'chinup', 'chin up', 'dip', 'push-up', 'pushup', 'push up', 'row', 'press', 'squat', 'lunge', 'deadlift', 'pike']
  return patterns.some(p => lower.includes(p))
}

function isAccessoryHypertrophyCandidate(exerciseName: string): boolean {
  const lower = exerciseName.toLowerCase()
  const patterns = ['curl', 'extension', 'raise', 'fly', 'flye', 'face pull', 'shrug', 'calf', 'bicep', 'tricep', 'lateral', 'rear delt', 'front delt', 'hammer', 'ring row', 'body row', 'inverted row', 'australian']
  return patterns.some(p => lower.includes(p))
}

function hasClearRepTarget(exercise: { sets?: string; reps?: string; name?: string }): boolean {
  if (exercise.name && isSkillHoldExercise(exercise.name)) return false
  const reps = exercise.reps?.toLowerCase() || ''
  if (reps.includes('s') || reps.includes('sec') || reps.includes('hold')) return false
  return /\d/.test(reps) || !reps
}

function isLateAccessoryPosition(exerciseIndex: number, totalExercises: number): boolean {
  if (totalExercises <= 2) return exerciseIndex > 0
  return exerciseIndex >= Math.floor(totalExercises * 0.66)
}

function isTechnicalSkillPrioritySession(session: AdaptiveSession): boolean {
  const exercises = session.exercises || []
  const firstHalf = exercises.slice(0, Math.ceil(exercises.length / 2))
  return firstHalf.some(ex => isSkillHoldExercise(ex.name || ''))
}

function scoreExerciseForMethod(args: {
  exercise: { name?: string; sets?: number | string; reps?: string }
  exerciseIndex: number
  totalExercises: number
  session: AdaptiveSession
  sessionIndex: number
  methodKey: CanonicalOverrideMethodKey
  existingMethods: string[]
}): { score: number; reasons: string[]; cautions: string[]; safety: MethodOverrideTargetSafety } {
  const { exercise, exerciseIndex, totalExercises, session, methodKey, existingMethods } = args
  const name = exercise.name || ''
  const reasons: string[] = []
  const cautions: string[] = []
  let score = 50
  let safety: MethodOverrideTargetSafety = 'safe'
  
  if (isSkillHoldExercise(name)) return { score: -100, reasons: ['Skill hold - not safe for fatigue methods'], cautions: [], safety: 'blocked' }
  if (isExplosiveExercise(name)) return { score: -100, reasons: ['Explosive movement - not safe for fatigue methods'], cautions: [], safety: 'blocked' }
  if (!hasClearRepTarget({ name: exercise.name, reps: exercise.reps })) return { score: -100, reasons: ['Time-based hold - no clear rep target'], cautions: [], safety: 'blocked' }
  
  const normalizedMethodKey = normalizeOverrideMethodKey(methodKey)
  if (existingMethods.some(m => normalizeOverrideMethodKey(m) === normalizedMethodKey)) {
  return { score: -50, reasons: ['Method already applied to this session'], cautions: [], safety: 'blocked' }
  }
  
  // [AB20.4.4.2] Apply method load penalty to avoid blind stacking
  const methodLoad = getSessionMethodLoad(session)
  if (methodLoad.methodLoadPenalty > 0) {
    score -= methodLoad.methodLoadPenalty
    if (methodLoad.hasUserAppliedGroupedOverride) {
      cautions.push(`Session already has a ${methodLoad.appliedOverrideMethodKeys[0] || 'grouped'} override`)
      if (methodLoad.methodLoadPenalty >= 50) safety = 'caution'
    }
    if (methodLoad.hasUserAppliedRowOverride) {
      cautions.push('Session already has row-level method override')
      if (safety === 'safe') safety = 'caution'
    }
    if (methodLoad.appliedOverrideCount >= 2) {
      reasons.push(`Session has ${methodLoad.appliedOverrideCount} existing overrides - stacking not recommended`)
      safety = 'caution'
    }
  }
  
  // Check if session already has a finisher via exercises
  const hasExistingFinisher = session.exercises?.some(ex => 
    (ex.name || '').toLowerCase().includes('finisher') || 
    ((ex as unknown as Record<string, unknown>).methodOverrideMethodKey === 'endurance_density')
  )

  switch (methodKey) {
    case 'drop_set':
    case 'rest_pause':
      if (isLateAccessoryPosition(exerciseIndex, totalExercises)) { score += 30; reasons.push('Late session position - ideal for fatigue method') }
      else if (exerciseIndex === 0) { score -= 20; cautions.push('First exercise - fatigue could affect remaining work'); safety = 'caution' }
      if (isAccessoryHypertrophyCandidate(name)) { score += 25; reasons.push('Accessory/hypertrophy exercise - safe for extended sets') }
      if (isHeavyStrengthCandidate(name) && exerciseIndex < totalExercises / 2) { score -= 15; cautions.push('Primary strength movement - consider late accessory instead'); safety = 'caution' }
      break
    case 'top_set_backoff':
      if (isHeavyStrengthCandidate(name)) { score += 30; reasons.push('Strength movement - good for top set structure') }
      if (exerciseIndex <= 2) { score += 20; reasons.push('Early session - fresh for heavy top set') }
      else { score -= 10; cautions.push('Later in session - may be fatigued for top set') }
      if (isTechnicalSkillPrioritySession(session)) { score -= 15; cautions.push('Skill-priority session - heavy work may interfere'); safety = 'caution' }
      break
    case 'cluster':
      if (isHeavyStrengthCandidate(name)) { score += 25; reasons.push('Compound movement - good for cluster sets') }
      if (isAccessoryHypertrophyCandidate(name)) { score -= 10; cautions.push('Accessory work - clusters typically for compounds') }
      if (exerciseIndex <= 3) { score += 15; reasons.push('Early-mid session position - good for quality clusters') }
      break
    case 'endurance_density':
      if (hasExistingFinisher) return { score: -30, reasons: ['Session already has a finisher'], cautions: [], safety: 'blocked' }
      if ((session.exercises?.length || 0) > 7) { score -= 20; cautions.push('Dense session - finisher adds more fatigue'); safety = 'caution' }
      if (isTechnicalSkillPrioritySession(session)) { score -= 15; cautions.push('Skill session - conditioning may interfere with quality'); safety = 'caution' }
      reasons.push('Conditioning finisher would end session with cardio focus')
      break
  }
  return { score, reasons, cautions, safety }
}

export function findBestMethodOverrideTargets(args: {
  program: AdaptiveProgram
  methodKey: CanonicalOverrideMethodKey
  maxTargets?: number
}): MethodOverrideTargetExercise[] {
  const { program, methodKey, maxTargets = 1 } = args
  const sessions = program.sessions || []
  const allTargets: MethodOverrideTargetExercise[] = []

  for (let sessionIndex = 0; sessionIndex < sessions.length; sessionIndex++) {
    const session = sessions[sessionIndex]
    const exercises = session.exercises || []
    const dayLabel = session.focusLabel || session.focus || session.dayLabel || `Day ${sessionIndex + 1}`
    const sessionTitle = dayLabel
    const existingMethods = session.styleMetadata?.appliedMethods || []

    if (methodKey === 'endurance_density') {
      const lastExIndex = exercises.length - 1
      if (lastExIndex >= 0) {
        const lastEx = exercises[lastExIndex]
        const result = scoreExerciseForMethod({ exercise: { name: lastEx.name, reps: (lastEx as unknown as Record<string, unknown>).reps as string | undefined, sets: lastEx.sets }, exerciseIndex: lastExIndex, totalExercises: exercises.length, session, sessionIndex, methodKey, existingMethods })
        if (result.score > 0) {
          allTargets.push({ sessionIndex, dayLabel, sessionTitle, exerciseIndex: -1, exerciseName: 'Session Finisher', methodKey, targetRole: 'conditioning_finisher', score: result.score, safety: result.safety, reasons: result.reasons, cautions: result.cautions })
        }
      }
      continue
    }

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
      const exercise = exercises[exerciseIndex]
      const result = scoreExerciseForMethod({ exercise: { name: exercise.name, reps: (exercise as unknown as Record<string, unknown>).reps as string | undefined, sets: exercise.sets }, exerciseIndex, totalExercises: exercises.length, session, sessionIndex, methodKey, existingMethods })
      if (result.score > 0) {
        const targetRole: MethodOverrideTargetRole = methodKey === 'top_set_backoff' ? 'primary_strength' : isLateAccessoryPosition(exerciseIndex, exercises.length) ? 'late_accessory' : isAccessoryHypertrophyCandidate(exercise.name || '') ? 'hypertrophy_accessory' : 'quality_strength'
        allTargets.push({ sessionIndex, dayLabel, sessionTitle, exerciseIndex, exerciseName: exercise.name || `Exercise ${exerciseIndex + 1}`, methodKey, targetRole, score: result.score, safety: result.safety, reasons: result.reasons, cautions: result.cautions })
      }
    }
  }

  allTargets.sort((a, b) => b.score - a.score)
  return allTargets.slice(0, maxTargets)
}

/**
 * [AB20.4.4.1] Analyzes all candidate targets and returns diagnostic information.
 * Includes safe, caution, forceable, and blocked targets with reasons.
 */
export function analyzeMethodOverrideTargetCandidates(args: {
  program: AdaptiveProgram
  methodKey: CanonicalOverrideMethodKey
}): {
  safeTargets: MethodOverrideTargetExercise[]
  cautionTargets: MethodOverrideTargetExercise[]
  forceableTargets: MethodOverrideTargetExercise[]
  blockedTargets: Array<{ sessionIndex: number; exerciseName: string; reason: string }>
  diagnostics: {
    totalSessionsScanned: number
    totalExercisesScanned: number
    topBlockerReasons: string[]
  }
} {
  const { program, methodKey } = args
  const sessions = program.sessions || []
  
  const safeTargets: MethodOverrideTargetExercise[] = []
  const cautionTargets: MethodOverrideTargetExercise[] = []
  const forceableTargets: MethodOverrideTargetExercise[] = []
  const blockedTargets: Array<{ sessionIndex: number; exerciseName: string; reason: string }> = []
  const blockerReasonCounts: Record<string, number> = {}
  
  let totalExercisesScanned = 0
  
  for (let sessionIndex = 0; sessionIndex < sessions.length; sessionIndex++) {
    const session = sessions[sessionIndex]
    const exercises = session.exercises || []
    const dayLabel = session.focusLabel || session.focus || session.dayLabel || `Day ${sessionIndex + 1}`
    const existingMethods = session.styleMetadata?.appliedMethods || []
    
    // For endurance_density, we target session-level finisher position
    if (methodKey === 'endurance_density') {
      totalExercisesScanned++
      const lastExIndex = exercises.length - 1
      if (lastExIndex >= 0) {
        const lastEx = exercises[lastExIndex]
        const result = scoreExerciseForMethod({
          exercise: { name: lastEx.name, reps: (lastEx as unknown as Record<string, unknown>).reps as string | undefined, sets: lastEx.sets },
          exerciseIndex: lastExIndex,
          totalExercises: exercises.length,
          session,
          sessionIndex,
          methodKey,
          existingMethods
        })
        
        const target: MethodOverrideTargetExercise = {
          sessionIndex,
          dayLabel,
          sessionTitle: dayLabel,
          exerciseIndex: -1,
          exerciseName: 'Session Finisher',
          methodKey,
          targetRole: 'conditioning_finisher',
          score: result.score,
          safety: result.safety,
          reasons: result.reasons,
          cautions: result.cautions
        }
        
        if (result.safety === 'safe' && result.score > 0) {
          safeTargets.push(target)
        } else if (result.safety === 'caution' && result.score > 0) {
          cautionTargets.push(target)
          forceableTargets.push(target)
        } else if (result.score > -50) {
          forceableTargets.push(target)
        } else {
          blockedTargets.push({ sessionIndex, exerciseName: 'Session Finisher', reason: result.reasons[0] || 'Blocked' })
          const reason = result.reasons[0] || 'Unknown blocker'
          blockerReasonCounts[reason] = (blockerReasonCounts[reason] || 0) + 1
        }
      }
      continue
    }
    
    // For other row-level methods, scan each exercise
    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
      const exercise = exercises[exerciseIndex]
      totalExercisesScanned++
      
      const result = scoreExerciseForMethod({
        exercise: { name: exercise.name, reps: (exercise as unknown as Record<string, unknown>).reps as string | undefined, sets: exercise.sets },
        exerciseIndex,
        totalExercises: exercises.length,
        session,
        sessionIndex,
        methodKey,
        existingMethods
      })
      
      const targetRole: MethodOverrideTargetRole = 
        methodKey === 'top_set_backoff' ? 'primary_strength' :
        isLateAccessoryPosition(exerciseIndex, exercises.length) ? 'late_accessory' :
        isAccessoryHypertrophyCandidate(exercise.name || '') ? 'hypertrophy_accessory' : 'quality_strength'
      
      const target: MethodOverrideTargetExercise = {
        sessionIndex,
        dayLabel,
        sessionTitle: dayLabel,
        exerciseIndex,
        exerciseName: exercise.name || `Exercise ${exerciseIndex + 1}`,
        methodKey,
        targetRole,
        score: result.score,
        safety: result.safety,
        reasons: result.reasons,
        cautions: result.cautions
      }
      
      if (result.safety === 'safe' && result.score > 0) {
        safeTargets.push(target)
      } else if (result.safety === 'caution' && result.score > 0) {
        cautionTargets.push(target)
        forceableTargets.push(target)
      } else if (result.score > -50 && result.safety !== 'blocked') {
        // Marginally acceptable - forceable but not recommended
        forceableTargets.push(target)
      } else {
        blockedTargets.push({ sessionIndex, exerciseName: exercise.name || 'Unknown', reason: result.reasons[0] || 'Blocked' })
        const reason = result.reasons[0] || 'Unknown blocker'
        blockerReasonCounts[reason] = (blockerReasonCounts[reason] || 0) + 1
      }
    }
  }
  
  // Sort targets by score
  safeTargets.sort((a, b) => b.score - a.score)
  cautionTargets.sort((a, b) => b.score - a.score)
  forceableTargets.sort((a, b) => b.score - a.score)
  
  // Get top blocker reasons
  const topBlockerReasons = Object.entries(blockerReasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason]) => reason)
  
  return {
    safeTargets,
    cautionTargets,
    forceableTargets,
    blockedTargets,
    diagnostics: {
      totalSessionsScanned: sessions.length,
      totalExercisesScanned,
      topBlockerReasons
    }
  }
}

/**
 * [AB20.4.4.1] Computes severity assessment for a method override based on target analysis.
 */
export function computeSeverityAssessment(args: {
  methodKey: CanonicalOverrideMethodKey
  capability: MethodOverrideCapability
  safeTargets: MethodOverrideTargetExercise[]
  cautionTargets: MethodOverrideTargetExercise[]
  forceableTargets: MethodOverrideTargetExercise[]
  blockedTargets: Array<{ sessionIndex: number; exerciseName: string; reason: string }>
  diagnostics: { totalSessionsScanned: number; totalExercisesScanned: number; topBlockerReasons: string[] }
}): MethodOverrideSeverityAssessment {
  const { methodKey, capability, safeTargets, cautionTargets, forceableTargets, blockedTargets, diagnostics } = args
  
  const hasSafeTarget = safeTargets.length > 0
  const hasCautionTarget = cautionTargets.length > 0
  const hasForceableTarget = forceableTargets.length > 0
  const bestSafe = safeTargets[0]
  const bestCaution = cautionTargets[0]
  const bestForceable = forceableTargets[0]
  
  // Method-specific tradeoff descriptions
  const methodTradeoffs: Record<CanonicalOverrideMethodKey, string[]> = {
    drop_set: ['Creates significant muscle fatigue', 'Recovery impact on subsequent sessions', 'Best for hypertrophy, not strength'],
    rest_pause: ['High fatigue accumulation', 'Not suitable for primary skill work', 'Recovery cost on heavy days'],
    cluster: ['Extends set duration', 'Quality degradation if overused', 'Best for final sets, not default approach'],
    top_set_backoff: ['Heavy CNS demand on first set', 'May interfere with skill quality if placed poorly', 'Requires established form'],
    endurance_density: ['Adds conditioning stress at session end', 'Recovery impact if session already dense', 'May interfere with skill-focused days'],
    circuits: ['Pattern interference if same-muscle exercises grouped', 'Skill hold quality may degrade under fatigue'],
    density_block: ['Timed stress adds fatigue', 'Technical quality may suffer under time pressure'],
    superset: ['Recovery between exercises reduced', 'May create unwanted fatigue accumulation'],
    finisher: ['End-of-session fatigue', 'Recovery impact on next day'],
    unknown: ['Unknown method - cannot assess tradeoffs']
  }
  
  const tradeoffs = methodTradeoffs[methodKey] || methodTradeoffs.unknown
  
  let level: MethodOverrideSeverityLevel
  let label: string
  let summary: string
  const whyThisLevel: string[] = []
  const riskDrivers: string[] = []
  const protectiveConditions: string[] = []
  let canForceOverride = false
  let forceOverrideLabel: string | undefined
  let forceOverrideWarning: string | undefined
  let forceOverrideDisabledReason: string | undefined
  let blockedReasonCode: string | undefined
  
  if (hasSafeTarget) {
    level = 'recommended'
    label = 'Recommended'
    summary = `Safe target found: ${bestSafe.dayLabel} — ${bestSafe.exerciseName}`
    whyThisLevel.push('A safe target exercise was found with good positioning')
    whyThisLevel.push(...bestSafe.reasons.slice(0, 2))
    protectiveConditions.push('Exercise is in a late/accessory position')
    protectiveConditions.push('No conflicting methods already applied')
  } else if (hasCautionTarget) {
    level = 'acceptable_with_caution'
    label = 'Acceptable with caution'
    summary = `Caution target found: ${bestCaution.dayLabel} — ${bestCaution.exerciseName}`
    whyThisLevel.push('Target exists but requires careful application')
    whyThisLevel.push(...bestCaution.cautions.slice(0, 2))
    riskDrivers.push(...bestCaution.cautions)
    canForceOverride = false // Normal caution apply, not force
  } else if (hasForceableTarget) {
    level = 'not_recommended'
    label = 'Not recommended'
    summary = `No ideal target, but ${bestForceable.dayLabel} — ${bestForceable.exerciseName} is technically possible`
    whyThisLevel.push('No safe or recommended target found')
    whyThisLevel.push('A technically possible target exists with significant tradeoffs')
    riskDrivers.push(...(bestForceable.cautions.length > 0 ? bestForceable.cautions : ['Target is not ideally positioned']))
    riskDrivers.push(...tradeoffs.slice(0, 2))
    canForceOverride = true
    forceOverrideLabel = 'Force Override Anyway'
    forceOverrideWarning = `Applying ${capability.displayLabel} to ${bestForceable.exerciseName} may reduce training quality. ${tradeoffs[0] || ''}`
  } else if (blockedTargets.length > 0 && diagnostics.totalExercisesScanned > 0) {
    // Some exercises exist but all are blocked
    const uniqueBlockReasons = [...new Set(blockedTargets.map(b => b.reason))].slice(0, 3)
    if (uniqueBlockReasons.every(r => r.includes('Skill hold') || r.includes('explosive') || r.includes('Time-based'))) {
      level = 'blocked_impossible'
      label = 'Blocked / Impossible'
      summary = 'All exercises are skill holds, explosive movements, or time-based holds'
      blockedReasonCode = 'all_exercises_blocked_by_type'
    } else {
      level = 'strongly_discouraged'
      label = 'Strongly discouraged'
      summary = 'All candidates blocked but program structure exists'
      canForceOverride = false // Truly no valid target
      forceOverrideDisabledReason = 'No exercise can safely receive this method'
    }
    whyThisLevel.push('Scanned all program exercises')
    whyThisLevel.push(...uniqueBlockReasons.map(r => `Blocker: ${r}`))
    riskDrivers.push(...diagnostics.topBlockerReasons)
  } else {
    level = 'blocked_impossible'
    label = 'Blocked / Impossible'
    summary = diagnostics.totalSessionsScanned === 0 
      ? 'No program sessions available to scan'
      : 'No exercises found in program sessions'
    blockedReasonCode = diagnostics.totalSessionsScanned === 0 ? 'no_sessions' : 'no_exercises'
    whyThisLevel.push(summary)
  }
  
  return {
    level,
    label,
    summary,
    whyThisLevel,
    trainingTradeoffs: tradeoffs,
    riskDrivers,
    protectiveConditions,
    candidateScanSummary: {
      totalSessionsScanned: diagnostics.totalSessionsScanned,
      totalExercisesScanned: diagnostics.totalExercisesScanned,
      safeTargetsFound: safeTargets.length,
      cautionTargetsFound: cautionTargets.length,
      blockedTargetsFound: blockedTargets.length,
      forceableTargetsFound: forceableTargets.length,
      bestTargetDescription: bestSafe ? `${bestSafe.dayLabel} — ${bestSafe.exerciseName}` :
        bestCaution ? `${bestCaution.dayLabel} — ${bestCaution.exerciseName} (caution)` :
        bestForceable ? `${bestForceable.dayLabel} — ${bestForceable.exerciseName} (forceable)` : undefined,
      topBlockerReasons: diagnostics.topBlockerReasons
    },
    canForceOverride,
    forceOverrideLabel,
    forceOverrideWarning,
    forceOverrideDisabledReason,
    blockedReasonCode
  }
}

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
    let { score, notes } = scoreSessionForCircuit(exercises, sessionTitle)
    
    // [AB20.4.4.2] Apply method load penalty for grouped block targeting
    const methodLoad = getSessionMethodLoad(session as AdaptiveSession)
    if (methodLoad.methodLoadPenalty > 0) {
      score -= methodLoad.methodLoadPenalty
      if (methodLoad.hasUserAppliedGroupedOverride) {
        notes.push(`Session already has ${methodLoad.appliedOverrideMethodKeys[0] || 'grouped'} override - choosing next-best day`)
      }
      if (methodLoad.hasUserAppliedRowOverride) {
        notes.push('Session has row-level method override')
      }
    }
    
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
  
  // [AB20.4] Store with canonical key for consistent lookup
  const canonicalKey = normalizeOverrideMethodKey(plan.methodKey)
  const capability = getMethodOverrideCapability(plan.methodKey)
  
  // [AB20.4.3] Build row-level method target and patch preview
  let targetExercises: MethodOverrideTargetExercise[] | undefined
  let applicationPatchPreview: MethodOverrideSavedProgramPatchPreview | undefined
  let applyDisabledReason: string | undefined
  let finalCanApply = capability.canApplyToSavedProgramNow
  let finalSuggestedDayIndex = plan.suggestedInsertion?.dayIndex
  let severityAssessment: MethodOverrideSeverityAssessment | undefined

  // [AB20.4.4.1] For row-level methods, use full candidate analysis with severity assessment
  if (capability.writerKind === 'row_level_method' && context?.programSessions) {
    const programForTargeting = { id: 'targeting-temp', sessions: context.programSessions as AdaptiveSession[] }
    
    // [AB20.4.4.1] Run full candidate analysis for diagnostics and severity
    const analysis = analyzeMethodOverrideTargetCandidates({ 
      program: programForTargeting as AdaptiveProgram, 
      methodKey: canonicalKey 
    })
    
    // [AB20.4.4.1] Compute severity assessment
    severityAssessment = computeSeverityAssessment({
      methodKey: canonicalKey,
      capability,
      safeTargets: analysis.safeTargets,
      cautionTargets: analysis.cautionTargets,
      forceableTargets: analysis.forceableTargets,
      blockedTargets: analysis.blockedTargets,
      diagnostics: analysis.diagnostics
    })
    
    // Use best available target
    const bestTarget = analysis.safeTargets[0] || analysis.cautionTargets[0]
    if (bestTarget) {
      targetExercises = [bestTarget]
      finalSuggestedDayIndex = bestTarget.sessionIndex
      visibleProofLines.push(`Scanned all ${context.programSessions.length} program days`)
      visibleProofLines.push(`Target: ${bestTarget.dayLabel} — ${bestTarget.exerciseName}`)
      visibleProofLines.push(`Why chosen: ${bestTarget.reasons[0] || 'Best scoring target'}`)
      if (bestTarget.cautions.length > 0) visibleProofLines.push(`Caution: ${bestTarget.cautions[0]}`)

      applicationPatchPreview = {
        methodKey: canonicalKey,
        patchKind: canonicalKey === 'endurance_density' ? 'session_finisher' : 'row_level_method',
        targetExercises: [bestTarget],
        affectedSessionIndexes: [bestTarget.sessionIndex],
        visibleBefore: [`${bestTarget.exerciseName}: Standard sets`],
        visibleAfter: [`${bestTarget.exerciseName}: ${capability.displayLabel} applied`],
        exactMutationSummary: [`Apply ${capability.displayLabel} to ${bestTarget.exerciseName}`, `On ${bestTarget.dayLabel}`, `Method metadata added to exercise`],
      }
    } else if (severityAssessment.canForceOverride && analysis.forceableTargets[0]) {
      // [AB20.4.4.1] No safe/caution target but forceable exists
      const forceTarget = analysis.forceableTargets[0]
      targetExercises = [forceTarget]
      finalSuggestedDayIndex = forceTarget.sessionIndex
      finalCanApply = false // Requires force override flow
      applyDisabledReason = `No recommended target. Force override available for ${forceTarget.exerciseName}.`
      visibleProofLines.push(`Scanned all ${context.programSessions.length} program days`)
      visibleProofLines.push(`No safe target found`)
      visibleProofLines.push(`Forceable: ${forceTarget.dayLabel} — ${forceTarget.exerciseName}`)
      visibleProofLines.push(`Warning: ${severityAssessment.forceOverrideWarning || 'Not recommended'}`)
    } else {
      finalCanApply = false
      applyDisabledReason = severityAssessment.blockedReasonCode 
        ? `Blocked: ${severityAssessment.summary}`
        : `No safe target exercise found for ${capability.displayLabel} in this program.`
      visibleProofLines.push(`Scanned all ${context.programSessions.length} program days`)
      visibleProofLines.push(`No safe target: ${analysis.diagnostics.topBlockerReasons[0] || 'All exercises blocked by safety rules'}`)
      if (analysis.diagnostics.topBlockerReasons.length > 1) {
        visibleProofLines.push(`Also: ${analysis.diagnostics.topBlockerReasons.slice(1).join(', ')}`)
      }
    }
  }
  
  const preview: MethodOverridePreview = {
    methodKey: canonicalKey, // [AB20.4] Always use canonical key
    label: capability.displayLabel !== 'Unknown Method' ? capability.displayLabel : plan.label,
    generatedAt: new Date().toISOString(),
    planSummary: plan.suggestedInsertion?.summary || plan.headline,
    placement: plan.placement,
    safety: plan.safety,
    suggestedDayIndex: finalSuggestedDayIndex, // [AB20.4.3] Use target-derived day
    canApplyToSavedProgramNow: finalCanApply, // [AB20.4.3] May be disabled if no target
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
    // [AB20.4] Cached capability for apply eligibility
    methodCapability: capability,
    targetGroupType: capability.writerKind === 'grouped_circuit' ? 'circuit' 
      : capability.writerKind === 'grouped_density_block' ? 'density_block'
      : capability.writerKind === 'grouped_cluster' ? 'cluster'
      : undefined,
    // [AB20.4.3] Row-level method targets
    targetExercises,
    applicationPatchPreview,
    applyDisabledReason,
    // [AB20.4.4.1] Severity assessment
    severityAssessment,
  }
  
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existing = getMethodOverridePreviews()
      // [AB20.4] Filter by canonical key for deduplication
      const updated = [...existing.filter(p => normalizeOverrideMethodKey(p.methodKey) !== canonicalKey), preview]
      window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(updated))
    }
  } catch {
    // Storage not available — preview is component-state only
  }
  
  return preview
}

/**
 * [AB20.4] Get all method override previews from storage.
 * Sanitizes old stored previews by canonicalizing keys and deduping.
 */
export function getMethodOverridePreviews(): MethodOverridePreview[] {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(PREVIEW_STORAGE_KEY)
      if (stored) {
        const rawPreviews = JSON.parse(stored) as MethodOverridePreview[]
        
        // [AB20.4] Sanitize: canonicalize keys and dedupe (keep newest)
        const byCanonical = new Map<string, MethodOverridePreview>()
        for (const preview of rawPreviews) {
          const canonicalKey = normalizeOverrideMethodKey(preview.methodKey)
          const existing = byCanonical.get(canonicalKey)
          
          // Keep the newest preview if duplicates exist
          if (!existing || (preview.generatedAt && existing.generatedAt && preview.generatedAt > existing.generatedAt)) {
            byCanonical.set(canonicalKey, {
              ...preview,
              methodKey: canonicalKey, // Normalize stored key
            })
          }
        }
        
        return Array.from(byCanonical.values())
      }
    }
  } catch {
    // Storage not available
  }
  return []
}

/**
 * [AB20.4] Clear method override preview by canonical key.
 */
export function clearMethodOverridePreview(methodKey: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const canonicalKey = normalizeOverrideMethodKey(methodKey)
      const existing = getMethodOverridePreviews()
      const updated = existing.filter(p => normalizeOverrideMethodKey(p.methodKey) !== canonicalKey)
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
  | 'applied_row_level_override'
  | 'applied_circuit_override'
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

// =============================================================================
// [AB20.2 / IQ10.2] METHOD OVERRIDE REVERT CORRIDOR
// =============================================================================

/**
 * [AB20.2] Revert status for method override removal result.
 */
export type MethodOverrideRevertStatus =
  | 'success'
  | 'blocked'
  | 'not_found'
  | 'cancelled'

/**
 * [AB20.2] Reason codes for revert results.
 */
export type MethodOverrideRevertReasonCode =
  | 'reverted_circuit_override'
  | 'no_program'
  | 'unsupported_method'
  | 'override_artifact_not_found'
  | 'native_method_not_revertible'
  | 'save_failed'
  | 'stale_program'
  | 'invalid_method_key'

/**
 * [AB20.2] Result of reverting a method override from a program.
 */
export interface MethodOverrideRevertResult {
  status: MethodOverrideRevertStatus
  updatedProgram?: AdaptiveProgram
  visibleSummary: string
  evidence: string[]
  reasonCode: MethodOverrideRevertReasonCode
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
 * Supports circuits and density blocks in AB20.3.
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
  
  // [AB20.3] Get capability and check if apply is supported
  const capability = preview.methodCapability || getMethodOverrideCapability(preview.methodKey)
  
  // [AB20.4.3] Check preview-level apply disabled reason first
  if (preview.applyDisabledReason) {
    return {
      status: 'blocked',
      visibleSummary: preview.applyDisabledReason,
      evidence: [`methodKey: ${preview.methodKey}`, `applyDisabledReason set on preview`],
      reasonCode: 'no_candidate',
    }
  }
  
  if (!capability.canApplyToSavedProgramNow && !preview.canApplyToSavedProgramNow) {
    return {
      status: 'blocked',
      visibleSummary: capability.applyUnsupportedReason || 'Apply not supported for this method.',
      evidence: [
        `methodKey: ${preview.methodKey}`,
        `canonicalKey: ${capability.canonicalKey}`,
        `writerKind: ${capability.writerKind}`,
      ],
      reasonCode: 'unsupported_method',
    }
  }
  
  // [AB20.4.3] Route to row-level writer if applicable
  if (capability.writerKind === 'row_level_method') {
    return applyRowLevelMethodOverride({ program, preview, capability, allowCautionApply })
  }
  
  // [AB20.3] Determine target group type
  const targetGroupType = preview.targetGroupType || 
    (capability.writerKind === 'grouped_circuit' ? 'circuit' : 
     capability.writerKind === 'grouped_density_block' ? 'density_block' : 
     capability.writerKind === 'grouped_cluster' ? 'cluster' : undefined)
  
  // [AB20.3] Must have grouped block candidate for grouped writers
  if ((targetGroupType === 'circuit' || targetGroupType === 'density_block' || targetGroupType === 'cluster') 
      && !preview.circuitCandidate) {
    return {
      status: 'blocked',
      visibleSummary: `No grouped block candidate found for ${capability.displayLabel}.`,
      evidence: ['preview.circuitCandidate is missing', `methodKey: ${preview.methodKey}`],
      reasonCode: 'unsupported_method',
    }
  }
  
  const candidate = preview.circuitCandidate!
  const status = candidate.candidateStatus
  
  // Check candidate status
  if (status === 'no_candidate') {
    return {
      status: 'blocked',
      visibleSummary: `No valid ${capability.displayLabel} candidate found.`,
      evidence: ['candidateStatus is no_candidate'],
      reasonCode: 'no_candidate',
    }
  }
  
  if (status === 'would_be_superset') {
    return {
      status: 'blocked',
      visibleSummary: 'Only 2 exercises — would be superset, not grouped block.',
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
  
  // Verify minimum exercises (3 for circuit, 2 for density block)
  const minExercises = targetGroupType === 'density_block' ? 2 : 3
  if (candidate.selectedExercises.length < minExercises) {
    return {
      status: 'blocked',
      visibleSummary: `${capability.displayLabel} requires at least ${minExercises} exercises.`,
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
  
  // [AB20.3] Check if group is already applied with same exercises
  const existingStyledGroups = targetSession.styleMetadata?.styledGroups || []
  const existingGroup = existingStyledGroups.find(g => 
    (g.groupType === targetGroupType) && 
    g.exercises?.length === matchedExercises.length &&
    g.exercises?.every(ex => 
      candidate.selectedExercises.some(sel => 
        normalizeExerciseName(sel) === normalizeExerciseName(ex.name || '')
      )
    )
  )
  
  if (existingGroup) {
    return {
      status: 'already_applied',
      visibleSummary: `${capability.displayLabel} already applied with these exercises.`,
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
  
  // [AB20.3] Determine method-specific labels and settings
  const canonicalKey = capability.canonicalKey
  const isCircuit = targetGroupType === 'circuit'
  const isDensity = targetGroupType === 'density_block'
  
  // [AB20.3] Method-specific group ID prefix
  const groupIdPrefix = isDensity 
    ? `method-override-density-block-day-${dayIndex + 1}` 
    : `method-override-circuit-day-${dayIndex + 1}`
  const groupId = `${groupIdPrefix}-${Date.now()}`
  
  // [AB20.3] Method-specific training method label
  const trainingMethodLabel = isDensity ? 'density_blocks' : 'circuits'
  
  // Build the grouped block exercises
  const groupExercises = matchedExercises.map((matched, idx) => {
    const originalEx = targetSession.exercises![matched.index]
    return {
      id: originalEx.id || `${isDensity ? 'density' : 'circuit'}-ex-${idx}`,
      name: originalEx.name || matched.name,
      prefix: isDensity ? `D${idx + 1}` : `C${idx + 1}`,
      trainingMethod: trainingMethodLabel as 'circuits' | 'density_blocks',
      methodRationale: isCaution
        ? `Applied from Method Override Planner caution preview (${capability.displayLabel}) after manual review.`
        : `Applied from Method Override Planner safe ${capability.displayLabel} preview.`,
    }
  })
  
  // [AB20.3] Method-specific instructions
  const instruction = isDensity
    ? (isCaution
        ? 'Manual-review density block: maintain controlled tempo and stop if fatigue compromises form.'
        : 'Timed density block: complete as many quality reps as possible within the time cap.')
    : (isCaution
        ? 'Manual-review circuit: keep technical quality high and stop if skill quality or tendon tension degrades.'
        : 'Move through these exercises as a controlled circuit while preserving clean reps.')
  
  const restProtocol = isDensity
    ? (isCaution
        ? 'Use conservative pacing; prioritize form over speed.'
        : '10-15s between exercises; 30-60s between rounds.')
    : (isCaution
        ? 'Use conservative pacing; rest enough to preserve skill quality.'
        : 'Minimal rest between stations; moderate rest between rounds.')
  
  // [AB20.4.5.3] Density blocks need timeCapMinutes for live runtime execution
  // Default: 8 minutes for standard density block, 10 for cautious
  const densityTimeCapMinutes = isDensity ? (isCaution ? 10 : 8) : undefined

  const newGroup = {
    id: groupId,
    groupType: (isDensity ? 'density_block' : 'circuit') as 'circuit' | 'density_block',
    exercises: groupExercises,
    instruction,
    restProtocol,
    // [AB20.4.5.3] Time cap for density blocks - required for live runtime execution
    ...(isDensity && { timeCapMinutes: densityTimeCapMinutes }),
    // [AB20.2] Reversible metadata for future revert operations
    source: 'method_override_planner' as const,
    methodOverrideApplied: true,
    methodOverrideMethodKey: canonicalKey,
    methodOverrideAppliedAt: new Date().toISOString(),
    methodOverrideCandidateStatus: status,
    methodOverrideTargetDayIndex: dayIndex,
    methodOverrideExerciseNames: candidate.selectedExercises,
    methodOverrideCanRevert: true,
  }

  // [AB20.4.5.3] Create methodStructure for live runtime binding
  // This is the canonical structure the live-grouped-execution-contract uses
  const newMethodStructure = {
    id: groupId,
    family: (isDensity ? 'density_block' : 'circuit') as 'circuit' | 'density_block',
    status: 'applied' as const,
    exerciseIds: groupExercises.map((ex: { id?: string }) => ex.id || ''),
    exerciseNames: groupExercises.map((ex: { name?: string }) => ex.name || ''),
    label: isDensity ? 'Skill Density Block' : 'Skill Circuit',
    rounds: isDensity ? undefined : 3, // Circuits default to 3 rounds
    ...(isDensity && { timeCapMinutes: densityTimeCapMinutes }),
    source: 'method_override_planner' as const,
    methodOverrideApplied: true,
  }
  
  // Update session.styleMetadata
  type SessionStyleMetadata = NonNullable<AdaptiveSession['styleMetadata']>
  const existingMeta = (updatedSession.styleMetadata || {}) as Partial<SessionStyleMetadata>
  const existingAppliedMethods: string[] = Array.isArray(existingMeta.appliedMethods) 
    ? [...existingMeta.appliedMethods] 
    : []
  
  // [AB20.3] Add the correct method to appliedMethods
  const methodToAdd = isDensity ? 'density_blocks' : 'circuits'
  if (!existingAppliedMethods.includes(methodToAdd)) {
    existingAppliedMethods.push(methodToAdd)
  }
  
  // Remove from rejectedMethods if present
  type RejectedMethod = { method: string; reason: string }
  let updatedRejectedMethods: RejectedMethod[] = existingMeta.rejectedMethods || []
  if (Array.isArray(updatedRejectedMethods)) {
    const methodsToRemove = isDensity 
      ? ['density_blocks', 'density_block', 'density'] 
      : ['circuits', 'circuit']
    updatedRejectedMethods = updatedRejectedMethods.filter((r: RejectedMethod) => 
      !methodsToRemove.includes(r.method)
    )
  }
  
  // Build updated styledGroups
  const updatedStyledGroups = [
    ...(existingMeta.styledGroups || []),
    newGroup,
  ]

  // [AB20.4.5.3] Build updated methodStructures for live runtime binding
  // Define local type for runtime-bindable method structures
  type RuntimeBindableMethodStructure = {
    id: string
    family: string
    status: string
    exerciseIds?: string[]
    exerciseNames?: string[]
    label?: string
    rounds?: number
    timeCapMinutes?: number
    source?: string
    methodOverrideApplied?: boolean
  }
  
  // Use typed session extension to safely access methodStructures
  type SessionWithMethodStructures = AdaptiveSession & {
    methodStructures?: RuntimeBindableMethodStructure[]
  }
  
  const methodStructureSession = updatedSession as SessionWithMethodStructures
  const existingMethodStructures: RuntimeBindableMethodStructure[] = Array.isArray(methodStructureSession.methodStructures)
    ? methodStructureSession.methodStructures
    : []
  
  const updatedMethodStructures: RuntimeBindableMethodStructure[] = [
    ...existingMethodStructures,
    newMethodStructure as RuntimeBindableMethodStructure,
  ]

  // Apply to session.styleMetadata - preserve all existing fields
  updatedSession.styleMetadata = {
    primaryStyle: existingMeta.primaryStyle || methodToAdd,
    hasSupersetsApplied: existingMeta.hasSupersetsApplied || false,
    hasCircuitsApplied: isCircuit ? true : (existingMeta.hasCircuitsApplied || false),
    hasDensityApplied: isDensity ? true : (existingMeta.hasDensityApplied || false),
    hasClusterApplied: existingMeta.hasClusterApplied,
    clusterDecision: existingMeta.clusterDecision,
    structureDescription: existingMeta.structureDescription || `${capability.displayLabel} override applied`,
    appliedMethods: existingAppliedMethods as SessionStyleMetadata['appliedMethods'],
    rejectedMethods: updatedRejectedMethods,
    styledGroups: updatedStyledGroups as SessionStyleMetadata['styledGroups'],
    materializationAudit: existingMeta.materializationAudit,
    methodIntentContract: existingMeta.methodIntentContract,
    methodMaterializationSummary: existingMeta.methodMaterializationSummary,
  } as SessionStyleMetadata

  // [AB20.4.5.3] Add methodStructures to session for live runtime binding
  // This is the canonical structure the live-grouped-execution-contract uses
  methodStructureSession.methodStructures = updatedMethodStructures
  
  // ==========================================================================
  // UPDATE PROGRAM-LEVEL weeklyMethodRepresentation (if exists)
  // ==========================================================================
  
  if (updatedProgram.weeklyMethodRepresentation?.byMethod) {
    const byMethod = updatedProgram.weeklyMethodRepresentation.byMethod
    
    // [AB20.3] Find the correct method entry based on target type
    const methodEntry = byMethod.find(m => {
      const methodId = m.methodId?.toLowerCase() || ''
      if (isDensity) {
        return methodId.includes('density')
      }
      return methodId.includes('circuit')
    })
    
    if (methodEntry) {
      methodEntry.status = 'APPLIED'
      methodEntry.materializedCount = Math.max(methodEntry.materializedCount || 0, 1)
      methodEntry.reason = `Applied from Method Override Planner (${capability.displayLabel}) override preview.`
    }
    
    // Update totals if present
    if (updatedProgram.weeklyMethodRepresentation.totals) {
      const totals = updatedProgram.weeklyMethodRepresentation.totals
      totals.methodsApplied = Math.max(totals.methodsApplied || 0, 1)
    }
    
    // Update oneLineExplanation
    const existingExplanation = updatedProgram.weeklyMethodRepresentation.oneLineExplanation || ''
    if (!existingExplanation.includes(`${capability.displayLabel} override`)) {
      updatedProgram.weeklyMethodRepresentation.oneLineExplanation = 
        existingExplanation + ` ${capability.displayLabel} override applied to 1 session from the Method Override Planner.`
    }
  }
  
  // ==========================================================================
  // RETURN SUCCESS
  // ==========================================================================
  
  return {
    status: 'success',
    updatedProgram,
    visibleSummary: isCaution 
      ? `${capability.displayLabel} override applied with caution — saved program updated.`
      : `${capability.displayLabel} override applied — saved program updated.`,
    evidence: [
      `Applied ${capability.displayLabel} to Day ${dayIndex + 1} (${candidate.sessionTitle})`,
      `Exercises: ${candidate.selectedExercises.join(', ')}`,
      `Block size: ${candidate.circuitSize}`,
      isCaution ? 'Applied with caution after manual review' : `Applied as safe ${capability.displayLabel}`,
      `styledGroup id: ${groupId}`,
    ],
    reasonCode: isCaution ? 'applied_caution_circuit' : 'applied_safe_circuit',
  }
}

// =============================================================================
// [AB20.2] REVERT METHOD OVERRIDE HELPER
// =============================================================================

/**
 * [AB20.2 / AB20.3] Checks if a styledGroup was applied by the Method Override Planner.
 * Uses multiple detection methods for backward compatibility with AB20.1 circuits.
 */
function isMethodOverridePlannerAppliedGroup(group: {
  id?: string
  source?: string
  methodOverrideApplied?: boolean
  exercises?: Array<{ methodRationale?: string }>
}): boolean {
  // [AB20.2B] Check explicit markers from future applies
  if (group.methodOverrideApplied === true) return true
  if (group.source === 'method_override_planner') return true
  
  // [AB20.2C / AB20.3] Fallback detection for AB20.1 circuits and AB20.3 density blocks
  if (group.id?.startsWith('method-override-circuit-')) return true
  if (group.id?.startsWith('method-override-density-block-')) return true
  
  // Check if any exercise mentions Method Override Planner in rationale
  if (group.exercises?.some(ex => 
    ex.methodRationale?.includes('Method Override Planner')
  )) {
    return true
  }
  
  return false
}

/**
 * [AB20.2 / AB20.3] Checks if a program has any Method Override Planner-applied grouped block.
 * Used by UI to determine if "Remove Override" action should be shown.
 */
export function hasMethodOverrideAppliedCircuit(program: AdaptiveProgram | null): boolean {
  if (!program?.sessions) return false
  
  for (const session of program.sessions) {
    const styledGroups = session.styleMetadata?.styledGroups || []
    for (const group of styledGroups) {
      // [AB20.3] Check both circuits and density blocks
      if ((group.groupType === 'circuit' || group.groupType === 'density_block') && 
          isMethodOverridePlannerAppliedGroup(group)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * [AB20.4.1] Checks if a program has a Method Override Planner-applied group for a SPECIFIC method.
 * This is the selected-method-specific version - only returns true if the override applies to
 * the given methodKey, not just any override.
 * 
 * @param program - The program to check
 * @param methodKey - The specific method key to check for (will be canonicalized)
 * @returns true only if the specific method has an applied override group
 */
export function hasMethodOverrideAppliedGroup(
  program: AdaptiveProgram | null,
  methodKey: string
): boolean {
  if (!program?.sessions || !methodKey) return false
  
  const canonicalKey = normalizeOverrideMethodKey(methodKey)
  const capability = getMethodOverrideCapability(methodKey)
  
  // [AB20.4.1] Determine which group types this method maps to
  let targetGroupTypes: string[] = []
  if (capability.canonicalKey === 'circuits') {
    targetGroupTypes = ['circuit']
  } else if (capability.canonicalKey === 'density_block') {
    targetGroupTypes = ['density_block']
  } else if (capability.canonicalKey === 'cluster') {
    // Cluster writer not yet connected - return false for now
    // When cluster writer is implemented, add: targetGroupTypes = ['cluster']
    return false
  } else {
    // Row-level methods (drop_set, rest_pause, top_set_backoff, endurance) 
    // don't have grouped block reverts yet
    return false
  }
  
  for (const session of program.sessions) {
    const styledGroups = session.styleMetadata?.styledGroups || []
    for (const group of styledGroups) {
      // Check if group type matches the method's target type
      if (!targetGroupTypes.includes(group.groupType)) continue
      
      // Must be a Method Override Planner-applied group
      if (!isMethodOverridePlannerAppliedGroup(group)) continue
      
      // [AB20.4.1] If group has methodOverrideMethodKey, it must match
      // This handles new AB20.4+ groups that track their source method
      const groupMethodKey = (group as { methodOverrideMethodKey?: string }).methodOverrideMethodKey
      if (groupMethodKey) {
        const groupCanonicalKey = normalizeOverrideMethodKey(groupMethodKey)
        if (groupCanonicalKey === canonicalKey) {
          return true
        }
        // If methodOverrideMethodKey exists but doesn't match, skip this group
        continue
      }
      
      // [AB20.4.1] For backward compatibility with older AB20 groups without methodOverrideMethodKey:
      // Match by group ID prefix pattern
      const groupId = group.id || ''
      if (canonicalKey === 'circuits' && groupId.startsWith('method-override-circuit-')) {
        return true
      }
      if (canonicalKey === 'density_block' && groupId.startsWith('method-override-density-block-')) {
        return true
      }
    }
  }
  
  return false
}

/**
 * [AB20.2] Reverts a method override from a program.
 * 
 * This is a PURE function that returns a new program object.
 * It does NOT mutate the original program.
 * It does NOT persist to storage (caller must handle that).
 * 
 * Circuits and density blocks are supported in AB20.3.
 */
export function revertMethodOverrideFromProgram(args: {
  program: AdaptiveProgram
  methodKey: string
}): MethodOverrideRevertResult {
  const { program, methodKey } = args
  
  // Guard: Must have program
  if (!program) {
    return {
      status: 'blocked',
      visibleSummary: 'No program available.',
      evidence: ['program is null or undefined'],
      reasonCode: 'no_program',
    }
  }
  
  // Guard: Must have valid methodKey
  if (!methodKey || typeof methodKey !== 'string') {
    return {
      status: 'blocked',
      visibleSummary: 'Invalid method key.',
      evidence: [`methodKey: ${methodKey}`],
      reasonCode: 'invalid_method_key',
    }
  }
  
  // [AB20.3] Get capability and check if revert is supported
  const capability = getMethodOverrideCapability(methodKey)
  
  if (!capability.canRevert) {
    return {
      status: 'blocked',
      visibleSummary: `${capability.displayLabel} overrides cannot be reverted yet.`,
      evidence: [`methodKey: ${methodKey}`, `canonicalKey: ${capability.canonicalKey}`],
      reasonCode: 'unsupported_method',
    }
  }
  
  // Determine which group types to target
  const targetGroupTypes: string[] = []
  if (capability.canonicalKey === 'circuits') {
    targetGroupTypes.push('circuit')
  } else if (capability.canonicalKey === 'density_block') {
    targetGroupTypes.push('density_block')
  }
  
  // Deep clone the program to avoid mutation
  const updatedProgram: AdaptiveProgram = JSON.parse(JSON.stringify(program))
  const sessions = updatedProgram.sessions || []
  
  // Track what we removed
  let removedCount = 0
  const removedFromSessions: string[] = []
  const removedGroupIds: string[] = []
  
  // Scan all sessions for Method Override Planner-applied groups
  for (let dayIndex = 0; dayIndex < sessions.length; dayIndex++) {
    const session = sessions[dayIndex]
    if (!session.styleMetadata?.styledGroups) continue
    
    const originalGroups = session.styleMetadata.styledGroups
    const remainingGroups: typeof originalGroups = []
    let sessionHadOverrideGroup = false
    
    for (const group of originalGroups) {
      // Only remove groups that match target type and were applied by Method Override Planner
      const isTargetType = targetGroupTypes.includes(group.groupType)
      if (isTargetType && isMethodOverridePlannerAppliedGroup(group)) {
        removedCount++
        sessionHadOverrideGroup = true
        if (group.id) removedGroupIds.push(group.id)
      } else {
        // Keep all other groups (supersets, native circuits, etc.)
        remainingGroups.push(group)
      }
    }
    
    if (sessionHadOverrideGroup) {
      const sessionLabel = session.focusLabel || session.focus || `Day ${dayIndex + 1}`
      removedFromSessions.push(sessionLabel)
      
      // Update the session's styledGroups
      session.styleMetadata.styledGroups = remainingGroups
      
      // Recalculate flags based on remaining groups
      const hasRemainingCircuits = remainingGroups.some(g => g.groupType === 'circuit')
      const hasRemainingDensity = remainingGroups.some(g => g.groupType === 'density_block')
      session.styleMetadata.hasCircuitsApplied = hasRemainingCircuits
      session.styleMetadata.hasDensityApplied = hasRemainingDensity
      
      // Remove method from appliedMethods only if no groups of that type remain
      if (Array.isArray(session.styleMetadata.appliedMethods)) {
        if (!hasRemainingCircuits) {
          session.styleMetadata.appliedMethods = session.styleMetadata.appliedMethods.filter(
            (m: string) => m !== 'circuits' && m !== 'circuit'
          )
        }
        if (!hasRemainingDensity) {
          session.styleMetadata.appliedMethods = session.styleMetadata.appliedMethods.filter(
            (m: string) => m !== 'density_blocks' && m !== 'density_block' && m !== 'density'
          )
        }
      }
    }
  }
  
  // If nothing was removed, return not_found
  if (removedCount === 0) {
    return {
      status: 'not_found',
      visibleSummary: `No Method Override Planner ${capability.displayLabel} override was found to remove.`,
      evidence: ['No styledGroups matched Method Override Planner markers'],
      reasonCode: 'override_artifact_not_found',
    }
  }
  
  // Update program-level weeklyMethodRepresentation (if exists)
  if (updatedProgram.weeklyMethodRepresentation?.byMethod) {
    const byMethod = updatedProgram.weeklyMethodRepresentation.byMethod
    
    // Check if any groups of the target type remain
    const anyTargetGroupsRemain = sessions.some(session =>
      session.styleMetadata?.styledGroups?.some(g => targetGroupTypes.includes(g.groupType))
    )
    
    // Find the method entry in byMethod
    const methodEntry = byMethod.find(m => {
      const methodId = m.methodId?.toLowerCase() || ''
      if (capability.canonicalKey === 'density_block') {
        return methodId.includes('density')
      }
      return methodId.includes('circuit')
    })
    
    if (methodEntry && !anyTargetGroupsRemain) {
      // No groups remain - mark as blocked (user removed override, returns to coach-held-back state)
      methodEntry.status = 'BLOCKED_BY_SAFETY'
      methodEntry.materializedCount = 0
      methodEntry.reason = `${capability.displayLabel} override removed. Method is no longer materialized and remains held back by the current weekly method decision.`
    }
    
    // Update oneLineExplanation
    const existingExplanation = updatedProgram.weeklyMethodRepresentation.oneLineExplanation || ''
    if (existingExplanation.includes(`${capability.displayLabel} override applied`)) {
      updatedProgram.weeklyMethodRepresentation.oneLineExplanation = 
        existingExplanation.replace(new RegExp(`${capability.displayLabel} override applied[^.]*\\.`, 'g'), '').trim()
    }
  }
  
  return {
    status: 'success',
    updatedProgram,
    visibleSummary: `${capability.displayLabel} override removed — saved program updated.`,
    evidence: [
      `Removed ${removedCount} Method Override Planner ${capability.displayLabel}(s)`,
      `From sessions: ${removedFromSessions.join(', ')}`,
      `Group IDs: ${removedGroupIds.join(', ')}`,
    ],
    reasonCode: 'reverted_circuit_override',
  }
}

// =============================================================================
// [AB20.4.3] ROW-LEVEL METHOD WRITER
// =============================================================================

const METHOD_INSTRUCTIONS: Record<CanonicalOverrideMethodKey, { instruction: string; riskNote: string }> = {
  drop_set: { instruction: 'Last set only: complete prescribed reps, reduce load/progression 20-30%, continue with clean reps until form degrades. Stop before failure.', riskNote: 'Monitor form quality. If technique breaks, end the set immediately.' },
  rest_pause: { instruction: 'Last set only: reach strong effort, rest 10-15 seconds, continue with mini-set of 2-4 more reps. Stop before form breaks.', riskNote: 'Do not push to absolute failure. Quality reps only.' },
  top_set_backoff: { instruction: 'First working set is top set at RPE 8-9. Remaining sets are backoff at RPE 7-8 with same or slightly reduced load.', riskNote: 'Do not max out. Top set should be challenging but controlled.' },
  cluster: { instruction: 'Final working set: use 10-20 second intra-set rest to complete quality reps. Not a separate exercise.', riskNote: 'Clusters are for strength maintenance, not exhaustion.' },
  endurance_density: { instruction: 'Add 5-8 minute conditioning finisher at end of session. Low-moderate intensity, focus on sustained work capacity.', riskNote: 'Keep intensity conservative. This is conditioning, not max effort.' },
  circuits: { instruction: '', riskNote: '' },
  density_block: { instruction: '', riskNote: '' },
  superset: { instruction: '', riskNote: '' },
  finisher: { instruction: '', riskNote: '' },
  unknown: { instruction: '', riskNote: '' },
}

// =============================================================================
// [AB20.4.4.3] CANONICAL METHOD KEY MAPPING
// Maps canonical planner keys to the fields actually consumed by the UI.
// This ensures row-level methods actually render on Program Page exercise rows.
// =============================================================================

/**
 * Maps canonical override method key to AdaptiveExercise.setExecutionMethod value.
 * This is the PRIMARY field that `resolveRowMethodTruth` in AdaptiveSessionCard reads!
 * Without this, methods show "applied" in planner but don't render on exercise rows.
 */
function toRowSetExecutionMethod(canonicalKey: CanonicalOverrideMethodKey): 'cluster' | 'rest_pause' | 'top_set' | 'drop_set' | null {
  switch (canonicalKey) {
    case 'cluster': return 'cluster'
    case 'rest_pause': return 'rest_pause'
    case 'drop_set': return 'drop_set'
    case 'top_set_backoff': return 'top_set' // AdaptiveExercise only supports 'top_set'
    default: return null // Grouped methods (circuits, density_block) don't use setExecutionMethod
  }
}

/**
 * Maps canonical override method key to display label for UI panels.
 */
function toMethodDisplayLabel(canonicalKey: CanonicalOverrideMethodKey): string {
  switch (canonicalKey) {
    case 'cluster': return 'Cluster Set'
    case 'rest_pause': return 'Rest-Pause'
    case 'drop_set': return 'Drop Set'
    case 'top_set_backoff': return 'Top Set + Back-Off'
    case 'endurance_density': return 'Endurance/Conditioning'
    case 'density_block': return 'Density Block'
    case 'circuits': return 'Circuit'
    case 'superset': return 'Superset'
    default: return 'Unknown Method'
  }
}

// =============================================================================
// [AB20.4.4.4] CANONICAL METHOD ARTIFACT COLLECTION
// Single source of truth for what methods are ACTUALLY saved and renderable.
// This prevents the split between "summary says applied" vs "reset finds nothing".
// =============================================================================

export interface MethodOverrideArtifact {
  methodKey: string
  canonicalKey: CanonicalOverrideMethodKey
  displayLabel: string
  artifactKind: 'grouped_block' | 'row_level' | 'finisher' | 'native_ai'
  source: 'method_override_planner' | 'native_ai' | 'unknown'
  sessionIndex: number
  sessionLabel: string
  exerciseIndex?: number
  exerciseName?: string
  groupId?: string
  isUserAppliedOverride: boolean
  isRenderable: boolean
  renderFieldFound: string | null
  canReset: boolean
}

/**
 * [AB20.4.4.4] Collects ALL actual method override artifacts from a saved program.
 * This is the SINGLE SOURCE OF TRUTH for what methods are actually applied and renderable.
 * 
 * Uses this contract:
 * - Grouped blocks: styledGroups with methodOverrideApplied or source === 'method_override_planner'
 * - Row-level: exercises with methodOverrideApplied === true AND setExecutionMethod
 * - Native AI: styledGroups without methodOverrideApplied markers (supersets, etc.)
 * 
 * Returns artifacts sorted by session index, then by artifact kind.
 */
export function collectMethodOverrideArtifacts(program: AdaptiveProgram | null): MethodOverrideArtifact[] {
  if (!program || !Array.isArray(program.sessions)) return []
  
  const artifacts: MethodOverrideArtifact[] = []
  
  for (let sessionIndex = 0; sessionIndex < program.sessions.length; sessionIndex++) {
    const session = program.sessions[sessionIndex]
    const sessionLabel = session.focusLabel || session.focus || `Day ${sessionIndex + 1}`
    
    // 1. Scan styledGroups for grouped method artifacts
    const styledGroups = session.styleMetadata?.styledGroups || []
    for (const group of styledGroups) {
      const isUserApplied = isMethodOverridePlannerAppliedGroup(group)
      const groupType = group.groupType
      
      // Map group type to canonical key
      let canonicalKey: CanonicalOverrideMethodKey = 'unknown'
      if (groupType === 'circuit') canonicalKey = 'circuits'
      else if (groupType === 'density_block') canonicalKey = 'density_block'
      else if (groupType === 'superset') canonicalKey = 'superset'
      
      artifacts.push({
        methodKey: (group as { methodOverrideMethodKey?: string }).methodOverrideMethodKey || groupType,
        canonicalKey,
        displayLabel: toMethodDisplayLabel(canonicalKey),
        artifactKind: 'grouped_block',
        source: isUserApplied ? 'method_override_planner' : 'native_ai',
        sessionIndex,
        sessionLabel,
        groupId: group.id,
        isUserAppliedOverride: isUserApplied,
        isRenderable: true, // styledGroups are always renderable
        renderFieldFound: 'styledGroups',
        canReset: isUserApplied,
      })
    }
    
    // 2. Scan exercises for row-level method artifacts
    const exercises = session.exercises || []
    for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
      const exercise = exercises[exIndex] as {
        methodOverrideApplied?: boolean
        methodOverrideMethodKey?: string
        setExecutionMethod?: string
        method?: string
        methodLabel?: string
        name?: string
        trainingMethod?: string
        isFinisher?: boolean
      }
      
      // Only count as artifact if methodOverrideApplied is true
      if (!exercise.methodOverrideApplied) continue
      
      const methodKey = exercise.methodOverrideMethodKey || exercise.setExecutionMethod || ''
      const canonicalKey = normalizeOverrideMethodKey(methodKey)
      
      // [AB20.4.5.2] Check if renderable - multiple valid render fields
      // - setExecutionMethod is PRIMARY for row-level methods (cluster, drop_set, etc.)
      // - method field is secondary (works for all method types)
      // - trainingMethod + isFinisher is valid for endurance/conditioning finishers
      const hasSetExecutionMethod = !!exercise.setExecutionMethod
      const hasMethodField = !!exercise.method
      const isValidFinisher = !!exercise.isFinisher && !!exercise.trainingMethod
      const isRenderable = hasSetExecutionMethod || hasMethodField || isValidFinisher
      
      // Determine artifact kind
      let artifactKind: MethodOverrideArtifact['artifactKind'] = 'row_level'
      if (canonicalKey === 'endurance_density' || exercise.name?.toLowerCase().includes('finisher') || exercise.isFinisher) {
        artifactKind = 'finisher'
      }
      
      // [AB20.4.5.2] Determine which render field was found for debugging
      let renderFieldFound: string | null = null
      if (hasSetExecutionMethod) renderFieldFound = 'setExecutionMethod'
      else if (hasMethodField) renderFieldFound = 'method'
      else if (isValidFinisher) renderFieldFound = 'trainingMethod+isFinisher'
      
      artifacts.push({
        methodKey,
        canonicalKey,
        displayLabel: exercise.methodLabel || toMethodDisplayLabel(canonicalKey),
        artifactKind,
        source: 'method_override_planner',
        sessionIndex,
        sessionLabel,
        exerciseIndex: exIndex,
        exerciseName: exercise.name,
        isUserAppliedOverride: true,
        isRenderable,
        renderFieldFound,
        canReset: true,
      })
    }
  }
  
  return artifacts
}

/**
 * [AB20.4.4.4] Validates that a method artifact is actually renderable after apply.
 * Used as a gate to prevent "applied" status without actual render truth.
 */
export function assertRenderableMethodArtifact(
  program: AdaptiveProgram,
  methodKey: string,
  targetInfo: { sessionIndex?: number; exerciseName?: string }
): { valid: boolean; evidence: string[]; missingField?: string } {
  const artifacts = collectMethodOverrideArtifacts(program)
  const canonicalKey = normalizeOverrideMethodKey(methodKey)
  
  // Find matching artifact
  const matchingArtifacts = artifacts.filter(a => {
    if (a.canonicalKey !== canonicalKey) return false
    if (targetInfo.sessionIndex !== undefined && a.sessionIndex !== targetInfo.sessionIndex) return false
    if (targetInfo.exerciseName && a.exerciseName && 
        a.exerciseName.toLowerCase() !== targetInfo.exerciseName.toLowerCase()) return false
    return true
  })
  
  if (matchingArtifacts.length === 0) {
    return {
      valid: false,
      evidence: [
        `No artifact found for method ${methodKey}`,
        `Searched session ${targetInfo.sessionIndex ?? 'any'}`,
        `Target exercise: ${targetInfo.exerciseName ?? 'any'}`,
      ],
      missingField: 'No artifact found',
    }
  }
  
  const artifact = matchingArtifacts[0]
  if (!artifact.isRenderable) {
    return {
      valid: false,
      evidence: [
        `Artifact exists but is not renderable`,
        `Missing render field: ${artifact.renderFieldFound === null ? 'setExecutionMethod' : 'unknown'}`,
        `Artifact kind: ${artifact.artifactKind}`,
      ],
      missingField: artifact.renderFieldFound === null ? 'setExecutionMethod' : 'renderField',
    }
  }
  
  return {
    valid: true,
    evidence: [
      `Artifact is renderable`,
      `Render field: ${artifact.renderFieldFound}`,
      `Session: ${artifact.sessionLabel}`,
      artifact.exerciseName ? `Exercise: ${artifact.exerciseName}` : `Group: ${artifact.groupId}`,
    ],
  }
}

function applyRowLevelMethodOverride(args: {
  program: AdaptiveProgram
  preview: MethodOverridePreview
  capability: MethodOverrideCapability
  allowCautionApply: boolean
}): MethodOverrideApplyResult {
  const { program, preview, capability, allowCautionApply } = args
  const canonicalKey = capability.canonicalKey

  const targets = preview.targetExercises || preview.applicationPatchPreview?.targetExercises
  if (!targets || targets.length === 0) {
    return { status: 'blocked', visibleSummary: `No target exercise found for ${capability.displayLabel}.`, evidence: ['preview.targetExercises is empty or missing'], reasonCode: 'no_candidate' }
  }

  const primaryTarget = targets[0]

  if (primaryTarget.safety === 'blocked') {
    return { status: 'blocked', visibleSummary: primaryTarget.cautions[0] || 'Target exercise is blocked for this method.', evidence: [`Target safety: blocked`, ...primaryTarget.reasons], reasonCode: 'not_circuit_candidate' }
  }

  if (primaryTarget.safety === 'caution' && !allowCautionApply) {
    return { status: 'blocked', visibleSummary: 'Caution target requires manual review confirmation.', evidence: ['Target safety: caution', 'allowCautionApply is false', ...primaryTarget.cautions], reasonCode: 'not_circuit_candidate' }
  }

  const sessions = program.sessions || []
  if (primaryTarget.sessionIndex < 0 || primaryTarget.sessionIndex >= sessions.length) {
    return { status: 'blocked', visibleSummary: 'Target session not found.', evidence: [`sessionIndex: ${primaryTarget.sessionIndex}`, `sessions.length: ${sessions.length}`], reasonCode: 'candidate_missing_session' }
  }

  const updatedProgram: AdaptiveProgram = JSON.parse(JSON.stringify(program))
  const targetSession = updatedProgram.sessions![primaryTarget.sessionIndex]

  if (canonicalKey === 'endurance_density') {
    return applyEnduranceConditioningFinisher({ updatedProgram, targetSession, primaryTarget, capability })
  }

  const exercises = targetSession.exercises || []
  if (primaryTarget.exerciseIndex < 0 || primaryTarget.exerciseIndex >= exercises.length) {
    return { status: 'blocked', visibleSummary: 'Target exercise not found in session.', evidence: [`exerciseIndex: ${primaryTarget.exerciseIndex}`, `exercises.length: ${exercises.length}`], reasonCode: 'selected_exercise_not_found' }
  }

  const targetExercise = exercises[primaryTarget.exerciseIndex]
  const normalizedTarget = normalizeExerciseName(primaryTarget.exerciseName)
  const normalizedExercise = normalizeExerciseName(targetExercise.name || '')
  if (normalizedTarget !== normalizedExercise) {
    return { status: 'blocked', visibleSummary: `Exercise changed since preview: expected "${primaryTarget.exerciseName}", found "${targetExercise.name}"`, evidence: [`Expected: ${normalizedTarget}`, `Found: ${normalizedExercise}`], reasonCode: 'selected_exercise_not_found' }
  }

  const methodInfo = METHOD_INSTRUCTIONS[canonicalKey] || METHOD_INSTRUCTIONS.unknown
  
  // [AB20.4.4.3] Map to setExecutionMethod - THE field that resolveRowMethodTruth reads!
  const setExecutionMethodValue = toRowSetExecutionMethod(canonicalKey)
  const methodLabel = toMethodDisplayLabel(canonicalKey)
  
  const methodMetadata: Record<string, unknown> = {
    // PRIMARY RENDER FIELD - this is what AdaptiveSessionCard.resolveRowMethodTruth reads!
    setExecutionMethod: setExecutionMethodValue,
    // Secondary display field
    methodLabel: methodLabel,
    // Legacy method field for back-compat (some paths still read this)
    method: setExecutionMethodValue || canonicalKey,
    // Original planner tracking fields
    trainingMethod: canonicalKey,
    methodOverrideApplied: true,
    methodOverrideMethodKey: canonicalKey,
    methodOverrideAppliedAt: new Date().toISOString(),
    methodOverrideCanRevert: true,
    methodRationale: `Applied via Method Override Planner to ${primaryTarget.exerciseName}. ${primaryTarget.reasons[0] || ''}`.trim(),
    methodInstructions: methodInfo.instruction,
    methodRiskNote: methodInfo.riskNote,
  }
  
  // Only assign non-null values to avoid type issues
  if (setExecutionMethodValue) {
    Object.assign(targetExercise, methodMetadata)
  } else {
    // For methods without a setExecutionMethod mapping, assign without it
    const { setExecutionMethod: _unused, ...restMetadata } = methodMetadata
    void _unused // Suppress unused variable warning
    Object.assign(targetExercise, restMetadata)
  }

  // Use type assertion for dynamic styleMetadata properties
  const styleMetadata = (targetSession.styleMetadata || {}) as Record<string, unknown>
  if (!styleMetadata.appliedMethods) styleMetadata.appliedMethods = []
  const appliedMethods = styleMetadata.appliedMethods as string[]
  if (!appliedMethods.includes(canonicalKey)) appliedMethods.push(canonicalKey)
  if (!styleMetadata.methodOverrideRowApplications) styleMetadata.methodOverrideRowApplications = []
  const rowApplications = styleMetadata.methodOverrideRowApplications as Array<{ methodKey: string; exerciseIndex: number; exerciseName: string; appliedAt: string }>
  rowApplications.push({ methodKey: canonicalKey, exerciseIndex: primaryTarget.exerciseIndex, exerciseName: primaryTarget.exerciseName, appliedAt: new Date().toISOString() })
  ;(targetSession as unknown as Record<string, unknown>).styleMetadata = styleMetadata

  if (updatedProgram.weeklyMethodRepresentation?.byMethod) {
    const methodEntry = updatedProgram.weeklyMethodRepresentation.byMethod.find(m => (m.methodId?.toLowerCase() || '').includes(canonicalKey.replace(/_/g, '')))
    if (methodEntry) { methodEntry.status = 'APPLIED'; methodEntry.materializedCount = (methodEntry.materializedCount || 0) + 1; methodEntry.reason = `Applied via Method Override Planner to ${primaryTarget.exerciseName} on ${primaryTarget.dayLabel}` }
  }

  const dayLabel = targetSession.focusLabel || targetSession.focus || `Day ${primaryTarget.sessionIndex + 1}`
  return { status: 'success', updatedProgram, visibleSummary: `${capability.displayLabel} applied to ${primaryTarget.exerciseName} on ${dayLabel}`, evidence: [`Method: ${capability.displayLabel}`, `Target: ${primaryTarget.exerciseName}`, `Session: ${dayLabel}`, `Exercise index: ${primaryTarget.exerciseIndex}`, `Safety: ${primaryTarget.safety}`, ...primaryTarget.reasons.slice(0, 2)], reasonCode: 'applied_row_level_override' }
}

function applyEnduranceConditioningFinisher(args: {
  updatedProgram: AdaptiveProgram
  targetSession: AdaptiveSession
  primaryTarget: MethodOverrideTargetExercise
  capability: MethodOverrideCapability
  isForceOverride?: boolean
  severityLevel?: string
}): MethodOverrideApplyResult {
  const { updatedProgram, targetSession, primaryTarget, capability, isForceOverride, severityLevel } = args

  // [AB20.4.5.2] FIX: Add method field for renderability check in collectMethodOverrideArtifacts
  // The artifact collector checks for setExecutionMethod OR method - finishers use method
  const finisherExercise = {
    name: 'Conditioning Finisher',
    sets: 1, // NUMERIC, not '1' string - required by saveAdaptiveProgram validation
    reps: '5-8 min',
    notes: 'Low-moderate intensity sustained work. Choose: row, bike, jump rope, or bodyweight circuit.',
    trainingMethod: 'endurance_density',
    // [AB20.4.5.2] CRITICAL: method field enables artifact renderability detection
    method: 'endurance_density',
    methodLabel: 'Endurance/Conditioning Finisher',
    methodOverrideApplied: true,
    methodOverrideMethodKey: 'endurance_density',
    methodOverrideAppliedAt: new Date().toISOString(),
    methodOverrideCanRevert: true,
    methodRationale: 'Conditioning finisher added via Method Override Planner',
    methodInstructions: METHOD_INSTRUCTIONS.endurance_density.instruction,
    methodRiskNote: METHOD_INSTRUCTIONS.endurance_density.riskNote,
    // [AB20.4.4] Severity tracking
    methodOverrideApplyMode: isForceOverride ? 'force_override' : 'normal',
    methodOverrideSeverityLevel: severityLevel || 'recommended',
    methodOverrideUserForced: isForceOverride || false,
    // [AB20.4.5.2] Finisher-specific fields for Program UI and artifact detection
    isFinisher: true,
    category: 'conditioning',
  }

  if (!targetSession.exercises) targetSession.exercises = []
  // Cast finisher exercise to match the array type via unknown
  targetSession.exercises.push(finisherExercise as unknown as typeof targetSession.exercises[number])

  // Use type assertion for dynamic styleMetadata properties
  const styleMetadata = (targetSession.styleMetadata || {}) as Record<string, unknown>
  styleMetadata.hasFinisher = true
  if (!styleMetadata.appliedMethods) styleMetadata.appliedMethods = []
  const appliedMethods = styleMetadata.appliedMethods as string[]
  if (!appliedMethods.includes('endurance_density')) appliedMethods.push('endurance_density')
  if (!styleMetadata.methodOverrideRowApplications) styleMetadata.methodOverrideRowApplications = []
  const rowApplications = styleMetadata.methodOverrideRowApplications as Array<{ methodKey: string; exerciseIndex: number; exerciseName: string; appliedAt: string; userForced?: boolean; severityLevel?: string }>
  rowApplications.push({ methodKey: 'endurance_density', exerciseIndex: targetSession.exercises.length - 1, exerciseName: 'Conditioning Finisher', appliedAt: new Date().toISOString(), userForced: isForceOverride, severityLevel })
  ;(targetSession as unknown as Record<string, unknown>).styleMetadata = styleMetadata

  const dayLabel = targetSession.focusLabel || targetSession.focus || `Day ${primaryTarget.sessionIndex + 1}`
  const forceSuffix = isForceOverride ? ' (forced override)' : ''
  return { status: 'success', updatedProgram, visibleSummary: `${capability.displayLabel} finisher added to ${dayLabel}${forceSuffix}`, evidence: [`Method: ${capability.displayLabel}`, `Session: ${dayLabel}`, `Added: Conditioning Finisher (5-8 min)`, `Position: End of session`, `Apply mode: ${isForceOverride ? 'force_override' : 'normal'}`], reasonCode: 'applied_row_level_override' }
}

// =============================================================================
// [AB20.4.2] RESET ALL METHOD OVERRIDES
// =============================================================================

/**
 * [AB20.4.2] Status for reset-all operation.
 */
export type MethodOverrideResetAllStatus =
  | 'success'
  | 'not_found'
  | 'blocked'

/**
 * [AB20.4.2] Reason codes for reset-all operation.
 */
export type MethodOverrideResetAllReasonCode =
  | 'reset_all_overrides'
  | 'no_program'
  | 'no_override_artifacts_found'
  | 'invalid_program'

/**
 * [AB20.4.2] Result of reset-all operation.
 */
export interface MethodOverrideResetAllResult {
  status: MethodOverrideResetAllStatus
  updatedProgram?: AdaptiveProgram
  visibleSummary: string
  evidence: string[]
  removedCount: number
  removedMethodKeys: string[]
  affectedSessions: string[]
  reasonCode: MethodOverrideResetAllReasonCode
}

/**
 * [AB20.4.2] Resets ALL Method Override Planner-applied overrides from a program.
 * Removes only user-applied override groups, preserving native AI-generated methods.
 * 
 * @param program - The program to reset
 * @returns Result with updated program (if successful) and evidence
 */
export function resetAllMethodOverridePlannerOverridesFromProgram(
  program: AdaptiveProgram | null
): MethodOverrideResetAllResult {
  // Guard: Must have program
  if (!program) {
    return {
      status: 'blocked',
      visibleSummary: 'No program available.',
      evidence: ['program is null or undefined'],
      removedCount: 0,
      removedMethodKeys: [],
      affectedSessions: [],
      reasonCode: 'no_program',
    }
  }

  // Guard: Must have valid sessions
  if (!Array.isArray(program.sessions) || program.sessions.length === 0) {
    return {
      status: 'blocked',
      visibleSummary: 'Program has no sessions.',
      evidence: ['program.sessions is empty or not an array'],
      removedCount: 0,
      removedMethodKeys: [],
      affectedSessions: [],
      reasonCode: 'invalid_program',
    }
  }

  // Deep clone the program to avoid mutation
  const updatedProgram: AdaptiveProgram = JSON.parse(JSON.stringify(program))
  const sessions = updatedProgram.sessions || []

  // Track what we removed
  let removedCount = 0
  const removedGroupIds: string[] = []
  const removedMethodKeys: string[] = []
  const affectedSessions: string[] = []

  // Scan all sessions for Method Override Planner-applied groups
  for (let dayIndex = 0; dayIndex < sessions.length; dayIndex++) {
    const session = sessions[dayIndex]
    if (!session.styleMetadata?.styledGroups) continue

    const originalGroups = session.styleMetadata.styledGroups
    const remainingGroups: typeof originalGroups = []
    let sessionHadOverrideGroup = false

    for (const group of originalGroups) {
      // Remove only groups that were applied by Method Override Planner
      if (isMethodOverridePlannerAppliedGroup(group)) {
        removedCount++
        sessionHadOverrideGroup = true
        if (group.id) removedGroupIds.push(group.id)
        
        // Track the method key if present
        const methodKey = (group as { methodOverrideMethodKey?: string }).methodOverrideMethodKey
        if (methodKey && !removedMethodKeys.includes(methodKey)) {
          removedMethodKeys.push(methodKey)
        }
        
        // Also track by group type
        if (group.groupType === 'circuit' && !removedMethodKeys.includes('circuits')) {
          removedMethodKeys.push('circuits')
        }
        if (group.groupType === 'density_block' && !removedMethodKeys.includes('density_block')) {
          removedMethodKeys.push('density_block')
        }
      } else {
        // Keep all other groups (supersets, native circuits/density, etc.)
        remainingGroups.push(group)
      }
    }

    if (sessionHadOverrideGroup) {
      const sessionLabel = session.focusLabel || session.focus || `Day ${dayIndex + 1}`
      affectedSessions.push(sessionLabel)

      // Update the session's styledGroups
      session.styleMetadata.styledGroups = remainingGroups

      // Recalculate flags based on remaining groups
      const hasRemainingCircuits = remainingGroups.some(g => g.groupType === 'circuit')
      const hasRemainingDensity = remainingGroups.some(g => g.groupType === 'density_block')
      session.styleMetadata.hasCircuitsApplied = hasRemainingCircuits
      session.styleMetadata.hasDensityApplied = hasRemainingDensity

      // Remove method from appliedMethods only if no groups of that type remain
      if (Array.isArray(session.styleMetadata.appliedMethods)) {
        if (!hasRemainingCircuits) {
          session.styleMetadata.appliedMethods = session.styleMetadata.appliedMethods.filter(
            (m: string) => m !== 'circuits' && m !== 'circuit'
          )
        }
        if (!hasRemainingDensity) {
          session.styleMetadata.appliedMethods = session.styleMetadata.appliedMethods.filter(
            (m: string) => m !== 'density_blocks' && m !== 'density_block' && m !== 'density'
          )
        }
      }
    }
    
    // [AB20.4.3] Also remove row-level method override artifacts from exercises
    const exercises = session.exercises || []
    const exercisesToRemove: number[] = []
    
    for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
      const exercise = exercises[exIndex] as { methodOverrideApplied?: boolean; methodOverrideMethodKey?: string; name?: string }
      
      if (exercise.methodOverrideApplied) {
        removedCount++
        const methodKey = exercise.methodOverrideMethodKey || ''
        if (methodKey && !removedMethodKeys.includes(methodKey)) removedMethodKeys.push(methodKey)
        
        const sessionLabel = session.focusLabel || session.focus || `Day ${dayIndex + 1}`
        if (!affectedSessions.includes(sessionLabel)) affectedSessions.push(sessionLabel)

        if (exercise.methodOverrideMethodKey === 'endurance_density' && exercise.name?.toLowerCase().includes('conditioning finisher')) {
          exercisesToRemove.push(exIndex)
        } else {
          // [AB20.4.4.4] Remove ALL method-related fields including render fields
          delete (exercise as Record<string, unknown>).trainingMethod
          delete (exercise as Record<string, unknown>).methodOverrideApplied
          delete (exercise as Record<string, unknown>).methodOverrideMethodKey
          delete (exercise as Record<string, unknown>).methodOverrideAppliedAt
          delete (exercise as Record<string, unknown>).methodOverrideCanRevert
          delete (exercise as Record<string, unknown>).methodRationale
          delete (exercise as Record<string, unknown>).methodInstructions
          delete (exercise as Record<string, unknown>).methodRiskNote
          // [AB20.4.4.4] CRITICAL: Also remove render fields to ensure Program card updates
          delete (exercise as Record<string, unknown>).setExecutionMethod
          delete (exercise as Record<string, unknown>).method
          delete (exercise as Record<string, unknown>).methodLabel
        }
      }
    }

    if (exercisesToRemove.length > 0) {
      session.exercises = exercises.filter((_, idx) => !exercisesToRemove.includes(idx))
      // Use type assertion for hasFinisher property
      const meta = session.styleMetadata as Record<string, unknown> | undefined
      if (meta) meta.hasFinisher = session.exercises.some(ex => (ex as { name?: string }).name?.toLowerCase().includes('finisher'))
    }

    // Use type assertion for methodOverrideRowApplications property
    const styleMeta = session.styleMetadata as Record<string, unknown> | undefined
    if (styleMeta?.methodOverrideRowApplications) delete styleMeta.methodOverrideRowApplications

    const rowLevelMethodKeys = ['drop_set', 'rest_pause', 'top_set_backoff', 'cluster', 'endurance_density']
    if (Array.isArray(session.styleMetadata?.appliedMethods)) {
      session.styleMetadata.appliedMethods = session.styleMetadata.appliedMethods.filter((m: string) => !rowLevelMethodKeys.includes(normalizeOverrideMethodKey(m)))
    }
  }

  // If nothing was removed, return not_found
  if (removedCount === 0) {
    return {
      status: 'not_found',
      visibleSummary: 'No user-applied method overrides found.',
      evidence: ['No styledGroups matched Method Override Planner markers'],
      removedCount: 0,
      removedMethodKeys: [],
      affectedSessions: [],
      reasonCode: 'no_override_artifacts_found',
    }
  }

  // Update program-level weeklyMethodRepresentation for removed method types
  if (updatedProgram.weeklyMethodRepresentation?.byMethod) {
    const byMethod = updatedProgram.weeklyMethodRepresentation.byMethod

    // Check if any circuits or density blocks remain (native or override)
    const anyCircuitsRemain = sessions.some(session =>
      session.styleMetadata?.styledGroups?.some(g => g.groupType === 'circuit')
    )
    const anyDensityRemain = sessions.some(session =>
      session.styleMetadata?.styledGroups?.some(g => g.groupType === 'density_block')
    )

    // Update circuit method entry if no circuits remain
    if (!anyCircuitsRemain) {
      const circuitEntry = byMethod.find(m => {
        const methodId = m.methodId?.toLowerCase() || ''
        return methodId.includes('circuit')
      })
      if (circuitEntry) {
        circuitEntry.status = 'BLOCKED_BY_SAFETY'
        circuitEntry.materializedCount = 0
        circuitEntry.reason = 'Circuit override removed. Method returns to coach-held-back state.'
      }
    }

    // Update density method entry if no density blocks remain
    if (!anyDensityRemain) {
      const densityEntry = byMethod.find(m => {
        const methodId = m.methodId?.toLowerCase() || ''
        return methodId.includes('density')
      })
      if (densityEntry) {
        densityEntry.status = 'BLOCKED_BY_SAFETY'
        densityEntry.materializedCount = 0
        densityEntry.reason = 'Density Block override removed. Method returns to coach-held-back state.'
      }
    }
  }

  return {
    status: 'success',
    updatedProgram,
    visibleSummary: 'All user-applied method overrides reset — AI/native methods preserved.',
    evidence: [
      `Removed ${removedCount} Method Override Planner group(s)`,
      `Method types: ${removedMethodKeys.join(', ') || 'none tracked'}`,
      `From sessions: ${affectedSessions.join(', ')}`,
      `Group IDs: ${removedGroupIds.join(', ')}`,
    ],
    removedCount,
    removedMethodKeys,
    affectedSessions,
    reasonCode: 'reset_all_overrides',
  }
}
