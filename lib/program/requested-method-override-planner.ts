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
  // Circuits need non-conflicting patterns
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
  
  return {
    safety: hasPatternVariety ? 'safe_preview' : 'needs_caution',
    placement: hasPatternVariety ? 'same_session_accessory' : 'different_day',
    headline: hasPatternVariety
      ? `Circuit can be previewed on ${bestSession?.title} with non-competing patterns`
      : 'Circuit needs exercises with different movement patterns',
    suggestedInsertion: hasPatternVariety && bestSession ? {
      dayIndex: bestSession.dayIndex,
      sessionTitle: bestSession.title,
      position: 'late_accessory',
      structure: 'circuit',
      summary: 'Low-interference circuit combining different movement patterns',
    } : undefined,
    riskNotes: [
      'Do NOT simply group adjacent exercises into a circuit',
      'Avoid same-pattern pairings (e.g., pull + pull)',
      bestSession?.pullDensity && bestSession.pullDensity > 0.4 
        ? 'Session has high pull density — avoid pull-heavy circuits'
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
  
  // Determine if preview is safe
  const canPreview = 
    methodPlan.safety === 'safe_preview' || 
    methodPlan.safety === 'needs_caution'
  
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

export interface MethodOverridePreview {
  methodKey: string
  label: string
  generatedAt: string
  planSummary: string
  placement: RequestedMethodOverridePlacement
  safety: RequestedMethodOverrideSafety
  suggestedDayIndex?: number
  canApplyToSavedProgramNow: false
}

const PREVIEW_STORAGE_KEY = 'spartanlab:requestedMethodOverridePreview'

export function saveMethodOverridePreview(plan: RequestedMethodOverridePlan): MethodOverridePreview {
  const preview: MethodOverridePreview = {
    methodKey: plan.methodKey,
    label: plan.label,
    generatedAt: new Date().toISOString(),
    planSummary: plan.suggestedInsertion?.summary || plan.headline,
    placement: plan.placement,
    safety: plan.safety,
    suggestedDayIndex: plan.suggestedInsertion?.dayIndex,
    canApplyToSavedProgramNow: false,
  }
  
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existing = getMethodOverridePreviews()
      const updated = [...existing.filter(p => p.methodKey !== plan.methodKey), preview]
      window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(updated))
    }
  } catch {
    // Storage not available — preview is component-state only
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
