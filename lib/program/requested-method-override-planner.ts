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
    canApplyToSavedProgramNow: false,
    canRevert: false,
    writerKind: 'preview_only',
    applyUnsupportedReason: 'Endurance/Conditioning writer not connected yet. Density Blocks are related but not the same.',
    previewDescription: 'Endurance-focused conditioning preview',
    methodDescription: 'Extended conditioning work focused on aerobic capacity and work tolerance.',
  },
  top_set_backoff: {
    canonicalKey: 'top_set_backoff',
    displayLabel: 'Top Set + Backoff',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: false,
    canRevert: false,
    writerKind: 'preview_only',
    applyUnsupportedReason: 'Top Set + Backoff needs a row-level strength writer before saved-program mutation.',
    previewDescription: 'Heavy first set with reduced backoff sets',
    methodDescription: 'Heavy first working set near max effort followed by lighter backoff sets to accumulate volume safely.',
  },
  drop_set: {
    canonicalKey: 'drop_set',
    displayLabel: 'Drop Sets',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: false,
    canRevert: false,
    writerKind: 'preview_only',
    applyUnsupportedReason: 'Drop Set row-level writer not connected yet.',
    previewDescription: 'Progressive weight reduction for fatigue',
    methodDescription: 'Single exercise extended with progressive weight reductions after near-failure to maximize muscle fatigue.',
  },
  cluster: {
    canonicalKey: 'cluster',
    displayLabel: 'Cluster Sets',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: false, // Could enable if cluster styledGroup writer exists
    canRevert: false,
    writerKind: 'preview_only',
    applyUnsupportedReason: 'Cluster writer not connected yet.',
    previewDescription: 'Intra-set rest cluster preview',
    methodDescription: 'Heavy compound work with short intra-set rest periods to maintain force output across more total reps.',
  },
  rest_pause: {
    canonicalKey: 'rest_pause',
    displayLabel: 'Rest-Pause',
    canPlan: true,
    canCreatePreview: true,
    canApplyToSavedProgramNow: false,
    canRevert: false,
    writerKind: 'preview_only',
    applyUnsupportedReason: 'Rest-Pause row-level writer not connected yet.',
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
  
  // [AB20.4] Store with canonical key for consistent lookup
  const canonicalKey = normalizeOverrideMethodKey(plan.methodKey)
  const capability = getMethodOverrideCapability(plan.methodKey)
  
  const preview: MethodOverridePreview = {
    methodKey: canonicalKey, // [AB20.4] Always use canonical key
    label: capability.displayLabel !== 'Unknown Method' ? capability.displayLabel : plan.label,
    generatedAt: new Date().toISOString(),
    planSummary: plan.suggestedInsertion?.summary || plan.headline,
    placement: plan.placement,
    safety: plan.safety,
    suggestedDayIndex: plan.suggestedInsertion?.dayIndex,
    canApplyToSavedProgramNow: capability.canApplyToSavedProgramNow, // [AB20.4] Get from capability
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
  
  if (!capability.canApplyToSavedProgramNow) {
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
  
  const newGroup = {
    id: groupId,
    groupType: (isDensity ? 'density_block' : 'circuit') as 'circuit' | 'density_block',
    exercises: groupExercises,
    instruction,
    restProtocol,
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
