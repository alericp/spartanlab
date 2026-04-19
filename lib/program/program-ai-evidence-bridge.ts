/**
 * PROGRAM AI EVIDENCE BRIDGE
 * 
 * =============================================================================
 * SINGLE AUTHORITATIVE DISPLAY-ONLY ADAPTER FOR PROGRAM/SESSION AI TRUTH
 * =============================================================================
 * 
 * This module bridges existing authoritative program/session metadata to a
 * unified display contract that can be consumed by both session cards and
 * exercise rows consistently.
 * 
 * RULES:
 * - Read-only extraction from existing truth, no re-computation
 * - Single source for visible "why this session/exercise exists" evidence
 * - No parallel truth paths - one bridge, one contract family
 * - Serializable output for safe props passing
 */

import type { ExerciseRowSurface } from './program-display-contract'

// =============================================================================
// SESSION AI EVIDENCE CONTRACT
// =============================================================================

export interface SessionAiEvidenceSurface {
  /** Primary session headline for card display */
  sessionHeadline: string
  /** Session purpose explanation */
  sessionPurpose: string | null
  /** Primary intent label e.g. "Planche progression" */
  primaryIntentLabel: string | null
  /** Secondary intent label e.g. "Front lever integration" */
  secondaryIntentLabel: string | null
  /** Method label e.g. "Supersets", "Density" */
  methodLabel: string | null
  /** Protection constraints active in this session */
  protectionLabels: string[]
  /** Compact evidence bullets for visible reasoning */
  evidenceBullets: string[]
  /** Progression bias label e.g. "Volume build", "Intensity focus" */
  progressionBiasLabel: string | null
  /** Support strategy label e.g. "Accessory emphasis", "Core focus" */
  supportStrategyLabel: string | null
  /** Confidence sources for this session */
  confidenceSourceLabels: string[]
  /** Session type for styling */
  sessionType: 'skill_dominant' | 'strength_dominant' | 'mixed' | 'support' | 'density' | 'recovery'
  /** Source marker */
  source: 'authoritative' | 'fallback_minimal'
}

// =============================================================================
// ROW AI EVIDENCE CONTRACT (extends ExerciseRowSurface context)
// =============================================================================

export interface RowAiEvidenceContext {
  /** Session-level evidence for row alignment */
  sessionEvidence: SessionAiEvidenceSurface
  /** Primary goal for purpose derivation */
  primaryGoal: string
  /** Secondary goal if present */
  secondaryGoal: string | null
}

// =============================================================================
// BUILD SESSION AI EVIDENCE SURFACE
// =============================================================================

/**
 * Build unified session-level AI evidence from authoritative metadata.
 * This is the SINGLE owner of session display intelligence.
 */
export function buildSessionAiEvidenceSurface(
  session: {
    dayNumber: number
    name?: string
    dayLabel?: string
    focus?: string
    focusLabel?: string
    isPrimary?: boolean
    rationale?: string
    prescriptionPropagationAudit?: {
      appliedReductions?: {
        setsReduced?: boolean
        rpeReduced?: boolean
        finisherSuppressed?: boolean
        densityReduced?: boolean
        secondaryTrimmed?: boolean
      }
      adaptationPhase?: string
      verdict?: string
    }
    compositionMetadata?: {
      sessionIntent?: string
      sessionComplexity?: string
      spineSessionType?: string
      spineMode?: string
      workloadDistribution?: {
        primaryWorkPercent?: number
        supportWorkPercent?: number
      }
      methodEligibility?: {
        finisher?: string
        density?: string
      }
    }
    skillExpressionMetadata?: {
      directlyExpressedSkills?: string[]
      technicalSlotSkills?: string[]
      sessionPurpose?: string
      sessionIdentityReason?: string
    }
    styleMetadata?: {
      primaryStyle?: string
      hasSupersetsApplied?: boolean
      hasCircuitsApplied?: boolean
      hasDensityApplied?: boolean
      structureDescription?: string
    }
  },
  programContext: {
    primaryGoal: string
    secondaryGoal?: string | null
    isFirstWeek?: boolean
    adaptationPhase?: string
  }
): SessionAiEvidenceSurface {
  const composition = session.compositionMetadata
  const skillMeta = session.skillExpressionMetadata
  const styleMeta = session.styleMetadata
  const prescriptionAudit = session.prescriptionPropagationAudit
  
  const protectionLabels: string[] = []
  const evidenceBullets: string[] = []
  const confidenceSourceLabels: string[] = []
  let source: SessionAiEvidenceSurface['source'] = 'fallback_minimal'
  
  // ==========================================================================
  // A. Build session headline from authoritative metadata
  // ==========================================================================
  let sessionHeadline = ''
  
  // Priority 1: skillExpressionMetadata.sessionIdentityReason
  if (skillMeta?.sessionIdentityReason) {
    sessionHeadline = skillMeta.sessionIdentityReason.split('.')[0]
    source = 'authoritative'
  }
  // Priority 2: skillExpressionMetadata.sessionPurpose
  else if (skillMeta?.sessionPurpose) {
    sessionHeadline = skillMeta.sessionPurpose.split('.')[0]
    source = 'authoritative'
  }
  // Priority 3: compositionMetadata.sessionIntent
  else if (composition?.sessionIntent) {
    sessionHeadline = composition.sessionIntent.split('.')[0]
    source = 'authoritative'
  }
  // Priority 4: focusLabel or focus
  else if (session.focusLabel) {
    sessionHeadline = session.focusLabel
    source = 'authoritative'
  }
  // Priority 5: name
  else if (session.name) {
    sessionHeadline = session.name
  }
  // Fallback
  else {
    sessionHeadline = `Day ${session.dayNumber} Training`
  }
  
  // ==========================================================================
  // B. Build session purpose
  // ==========================================================================
  let sessionPurpose: string | null = null
  
  if (skillMeta?.sessionPurpose && skillMeta.sessionPurpose !== sessionHeadline) {
    sessionPurpose = skillMeta.sessionPurpose.slice(0, 80)
    source = 'authoritative'
  } else if (session.rationale) {
    sessionPurpose = session.rationale.split('.')[0].slice(0, 80)
    source = 'authoritative'
  }
  
  // ==========================================================================
  // C. Build primary/secondary intent labels
  // ==========================================================================
  let primaryIntentLabel: string | null = null
  let secondaryIntentLabel: string | null = null
  
  const primaryGoalClean = programContext.primaryGoal.replace(/_/g, ' ')
  const secondaryGoalClean = programContext.secondaryGoal?.replace(/_/g, ' ') || null
  
  // Derive primary intent from session metadata
  if (skillMeta?.directlyExpressedSkills?.length) {
    const primarySkill = skillMeta.directlyExpressedSkills[0]
    if (primarySkill.toLowerCase().includes('planche')) {
      primaryIntentLabel = 'Planche progression'
    } else if (primarySkill.toLowerCase().includes('lever')) {
      primaryIntentLabel = 'Lever development'
    } else if (primarySkill.toLowerCase().includes('handstand')) {
      primaryIntentLabel = 'Handstand work'
    } else if (primarySkill.toLowerCase().includes('muscle')) {
      primaryIntentLabel = 'Muscle-up progression'
    } else {
      primaryIntentLabel = `${primarySkill} focus`
    }
    source = 'authoritative'
  } else if (session.isPrimary && primaryGoalClean) {
    primaryIntentLabel = `${primaryGoalClean.charAt(0).toUpperCase() + primaryGoalClean.slice(1)} focus`
    source = 'authoritative'
  }
  
  // Derive secondary intent from technical slots or secondary goal
  if (skillMeta?.technicalSlotSkills?.length) {
    const secondarySkill = skillMeta.technicalSlotSkills[0]
    secondaryIntentLabel = `${secondarySkill} integration`
    source = 'authoritative'
  } else if (secondaryGoalClean && composition?.spineMode === 'integrated') {
    secondaryIntentLabel = `${secondaryGoalClean.charAt(0).toUpperCase() + secondaryGoalClean.slice(1)} integration`
    source = 'authoritative'
  }
  
  // ==========================================================================
  // D. Build method label
  // ==========================================================================
  let methodLabel: string | null = null
  
  if (styleMeta?.hasSupersetsApplied) {
    methodLabel = 'Supersets'
    source = 'authoritative'
  } else if (styleMeta?.hasCircuitsApplied) {
    methodLabel = 'Circuits'
    source = 'authoritative'
  } else if (styleMeta?.hasDensityApplied) {
    methodLabel = 'Density'
    source = 'authoritative'
  } else if (composition?.methodEligibility?.density === 'eligible') {
    methodLabel = 'Density-eligible'
    source = 'authoritative'
  }
  
  // ==========================================================================
  // E. Build protection labels
  // ==========================================================================
  if (prescriptionAudit?.appliedReductions) {
    const reductions = prescriptionAudit.appliedReductions
    if (reductions.setsReduced) {
      protectionLabels.push('Volume managed')
      source = 'authoritative'
    }
    if (reductions.rpeReduced) {
      protectionLabels.push('Intensity capped')
      source = 'authoritative'
    }
    if (reductions.finisherSuppressed) {
      protectionLabels.push('Finisher suppressed')
      source = 'authoritative'
    }
    if (reductions.secondaryTrimmed) {
      protectionLabels.push('Secondary trimmed')
      source = 'authoritative'
    }
  }
  
  if (programContext.isFirstWeek || prescriptionAudit?.adaptationPhase === 'conservative') {
    if (!protectionLabels.includes('Volume managed')) {
      protectionLabels.push('Conservative dosage')
    }
    source = 'authoritative'
  }
  
  // ==========================================================================
  // F. Build evidence bullets
  // ==========================================================================
  
  // Add skill expression evidence
  if (skillMeta?.directlyExpressedSkills?.length) {
    evidenceBullets.push(`Direct: ${skillMeta.directlyExpressedSkills.join(', ')}`)
    source = 'authoritative'
  }
  
  // Add workload distribution evidence
  if (composition?.workloadDistribution) {
    const { primaryWorkPercent, supportWorkPercent } = composition.workloadDistribution
    if (primaryWorkPercent && primaryWorkPercent >= 60) {
      evidenceBullets.push(`${primaryWorkPercent}% primary work`)
    } else if (supportWorkPercent && supportWorkPercent >= 40) {
      evidenceBullets.push(`Support-heavy session`)
    }
    source = 'authoritative'
  }
  
  // Add method evidence
  if (styleMeta?.structureDescription) {
    evidenceBullets.push(styleMeta.structureDescription.slice(0, 40))
    source = 'authoritative'
  }
  
  // ==========================================================================
  // G. Build progression bias label
  // ==========================================================================
  let progressionBiasLabel: string | null = null
  
  if (composition?.spineSessionType === 'volume_build') {
    progressionBiasLabel = 'Volume build'
    source = 'authoritative'
  } else if (composition?.spineSessionType === 'intensity_focus') {
    progressionBiasLabel = 'Intensity focus'
    source = 'authoritative'
  } else if (composition?.spineSessionType === 'skill_practice') {
    progressionBiasLabel = 'Skill practice'
    source = 'authoritative'
  }
  
  // ==========================================================================
  // H. Build support strategy label
  // ==========================================================================
  let supportStrategyLabel: string | null = null
  
  if (composition?.sessionComplexity === 'accessory_heavy') {
    supportStrategyLabel = 'Accessory emphasis'
    source = 'authoritative'
  } else if (composition?.sessionComplexity === 'core_focus') {
    supportStrategyLabel = 'Core focus'
    source = 'authoritative'
  } else if (composition?.workloadDistribution?.supportWorkPercent && 
             composition.workloadDistribution.supportWorkPercent >= 40) {
    supportStrategyLabel = 'Support integration'
    source = 'authoritative'
  }
  
  // ==========================================================================
  // I. Build confidence source labels
  // ==========================================================================
  if (prescriptionAudit?.verdict) {
    confidenceSourceLabels.push(prescriptionAudit.verdict)
    source = 'authoritative'
  }
  
  if (composition?.spineMode) {
    confidenceSourceLabels.push(`${composition.spineMode} mode`)
    source = 'authoritative'
  }
  
  // ==========================================================================
  // J. Determine session type
  // ==========================================================================
  let sessionType: SessionAiEvidenceSurface['sessionType'] = 'mixed'
  
  const spineType = composition?.spineSessionType?.toLowerCase() || ''
  if (spineType.includes('skill') || session.isPrimary) {
    sessionType = 'skill_dominant'
  } else if (spineType.includes('strength')) {
    sessionType = 'strength_dominant'
  } else if (spineType.includes('density') || styleMeta?.hasDensityApplied) {
    sessionType = 'density'
  } else if (spineType.includes('recovery') || spineType.includes('support')) {
    sessionType = 'support'
  }
  
  return {
    sessionHeadline,
    sessionPurpose,
    primaryIntentLabel,
    secondaryIntentLabel,
    methodLabel,
    protectionLabels: protectionLabels.slice(0, 3),
    evidenceBullets: evidenceBullets.slice(0, 3),
    progressionBiasLabel,
    supportStrategyLabel,
    confidenceSourceLabels: confidenceSourceLabels.slice(0, 2),
    sessionType,
    source,
  }
}

// =============================================================================
// BUILD ROW AI EVIDENCE CONTEXT
// =============================================================================

/**
 * Build row evidence context from session evidence for consistent alignment.
 * This ensures rows can reference the same session-level truth.
 */
export function buildRowAiEvidenceContext(
  sessionEvidence: SessionAiEvidenceSurface,
  programContext: {
    primaryGoal: string
    secondaryGoal?: string | null
  }
): RowAiEvidenceContext {
  return {
    sessionEvidence,
    primaryGoal: programContext.primaryGoal,
    secondaryGoal: programContext.secondaryGoal || null,
  }
}

// =============================================================================
// EVIDENCE DEDUPLICATION HELPERS
// =============================================================================

/**
 * Check if two labels are semantically equivalent (should suppress one).
 * Returns true if they likely say the same thing.
 */
function labelsAreSimilar(a: string | null, b: string | null): boolean {
  if (!a || !b) return false
  const aLower = a.toLowerCase().replace(/[^a-z]/g, '')
  const bLower = b.toLowerCase().replace(/[^a-z]/g, '')
  // Check if one contains the other
  return aLower.includes(bLower) || bLower.includes(aLower)
}

/**
 * Deduplicate visible evidence by suppressing weaker duplicates.
 * Returns cleaned evidence with duplicates removed.
 */
export function deduplicateSessionEvidence(
  evidence: SessionAiEvidenceSurface
): SessionAiEvidenceSurface {
  const cleaned = { ...evidence }
  
  // If sessionPurpose duplicates sessionHeadline, suppress it
  if (labelsAreSimilar(evidence.sessionPurpose, evidence.sessionHeadline)) {
    cleaned.sessionPurpose = null
  }
  
  // If primaryIntentLabel duplicates sessionHeadline, suppress it
  if (labelsAreSimilar(evidence.primaryIntentLabel, evidence.sessionHeadline)) {
    cleaned.primaryIntentLabel = null
  }
  
  // Deduplicate evidence bullets against headline and purpose
  cleaned.evidenceBullets = evidence.evidenceBullets.filter(bullet => 
    !labelsAreSimilar(bullet, evidence.sessionHeadline) &&
    !labelsAreSimilar(bullet, evidence.sessionPurpose)
  )
  
  return cleaned
}

/**
 * Align row surface with session evidence to prevent contradictions.
 * Returns cleaned row surface that's consistent with session story.
 */
export function alignRowWithSessionEvidence(
  rowSurface: ExerciseRowSurface,
  sessionEvidence: SessionAiEvidenceSurface
): ExerciseRowSurface {
  const aligned = { ...rowSurface }
  
  // If row purposeLine contradicts session type, adjust emphasis
  if (sessionEvidence.sessionType === 'skill_dominant' && 
      rowSurface.emphasisKind === 'primary' &&
      !rowSurface.purposeLine?.toLowerCase().includes('skill')) {
    // Keep the row but ensure its emphasis is clear
    if (!aligned.intentLabel) {
      aligned.intentLabel = 'Primary driver'
    }
  }
  
  // If session has protection labels, ensure protected rows reflect it
  if (sessionEvidence.protectionLabels.length > 0 && 
      rowSurface.emphasisKind === 'protection' &&
      !rowSurface.protectionLabel) {
    aligned.protectionLabel = sessionEvidence.protectionLabels[0]
  }
  
  return aligned
}

// =============================================================================
// PROGRAM-LEVEL EVIDENCE MODEL
// =============================================================================

export interface ProgramAiEvidenceModel {
  /** Program-level headline */
  programHeadline: string
  /** Per-session evidence surfaces */
  sessionEvidences: Map<number, SessionAiEvidenceSurface>
  /** Primary goal for row context */
  primaryGoal: string
  /** Secondary goal for row context */
  secondaryGoal: string | null
  /** Source marker */
  source: 'authoritative' | 'fallback_minimal'
}

// =============================================================================
// CATEGORY DISPLAY CONTRACT - Centralized category labeling
// =============================================================================

export interface CategoryDisplayContract {
  label: string
  color: string
  description: string
  source: 'authoritative' | 'fallback_minimal'
}

/**
 * Get centralized category display contract.
 * This is the SINGLE owner of category labeling - components must NOT hardcode these.
 * 
 * @param category - The exercise category
 * @param sessionEvidence - Optional session evidence for context-aware descriptions
 */
export function getCategoryDisplayContract(
  category: string | undefined,
  sessionEvidence?: SessionAiEvidenceSurface
): CategoryDisplayContract {
  const cat = (category || '').toLowerCase()
  
  // Context-aware descriptions when session evidence is available
  if (sessionEvidence?.source === 'authoritative') {
    if (cat === 'skill') {
      return {
        label: 'Skill Work',
        color: 'text-[#E63946]',
        description: sessionEvidence.primaryIntentLabel || 'Movement mastery',
        source: 'authoritative',
      }
    }
    if (cat === 'strength') {
      return {
        label: 'Strength',
        color: 'text-blue-400',
        description: sessionEvidence.supportStrategyLabel || 'Building power',
        source: 'authoritative',
      }
    }
    if (cat === 'accessory') {
      return {
        label: 'Accessory',
        color: 'text-[#A5A5A5]',
        description: 'Support & balance',
        source: 'authoritative',
      }
    }
  }
  
  // Fallback minimal descriptions
  if (cat === 'skill') {
    return { label: 'Skill Work', color: 'text-[#E63946]', description: 'Movement mastery', source: 'fallback_minimal' }
  }
  if (cat === 'strength') {
    return { label: 'Strength', color: 'text-blue-400', description: 'Building power', source: 'fallback_minimal' }
  }
  if (cat === 'accessory') {
    return { label: 'Accessory', color: 'text-[#A5A5A5]', description: 'Support & balance', source: 'fallback_minimal' }
  }
  if (cat === 'core') {
    return { label: 'Core', color: 'text-amber-400', description: 'Trunk stability', source: 'fallback_minimal' }
  }
  if (cat === 'mobility') {
    return { label: 'Mobility', color: 'text-green-400', description: 'Range support', source: 'fallback_minimal' }
  }
  
  return { label: 'Additional', color: 'text-[#6A6A6A]', description: '', source: 'fallback_minimal' }
}

// =============================================================================
// STRICT SOURCE ENFORCEMENT
// =============================================================================

/**
 * Enforce that authoritative evidence always wins over fallback.
 * Use this to prevent fallback text from masquerading as authoritative.
 */
export function enforceSourcePriority<T extends { source: 'authoritative' | 'fallback_minimal' }>(
  authoritative: T | null,
  fallback: T
): T {
  if (authoritative && authoritative.source === 'authoritative') {
    return authoritative
  }
  return fallback
}

/**
 * Select the best display value with source tracking.
 * Priority: authoritative value > fallback value > null
 */
export function selectWithSourceTracking(
  authoritativeValue: string | null,
  fallbackValue: string | null,
  hasAuthoritativeSource: boolean
): { value: string | null; source: 'authoritative' | 'fallback_minimal' } {
  if (authoritativeValue && hasAuthoritativeSource) {
    return { value: authoritativeValue, source: 'authoritative' }
  }
  if (fallbackValue) {
    return { value: fallbackValue, source: 'fallback_minimal' }
  }
  return { value: null, source: 'fallback_minimal' }
}

// =============================================================================
// PROGRAM-LEVEL EVIDENCE MODEL
// =============================================================================

// =============================================================================
// SESSION PRESCRIPTION SURFACE - Compact routine-first display contract
// =============================================================================

export interface ExercisePrescriptionItem {
  id: string
  displayName: string
  category: 'skill' | 'strength' | 'accessory' | 'core' | 'mobility' | 'other'
  /** Compact prescription line e.g. "3x5-8" or "3x30s" */
  prescriptionLine: string
  /** Load/assistance cue if available e.g. "BW+10kg" or "Band assist" */
  loadCue: string | null
  /** Rest prescription if available e.g. "90s" */
  restCue: string | null
  /** Compact emphasis marker: 'primary' | 'secondary' | 'support' | 'finisher' | null */
  emphasis: 'primary' | 'secondary' | 'support' | 'finisher' | null
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
}

export interface SessionPrescriptionSurface {
  /** Day label e.g. "Day 1" */
  dayLabel: string
  /** Session headline e.g. "Planche + Front Lever" */
  sessionHeadline: string
  /** Compact focus badge e.g. "Skill Focus" */
  focusBadge: string | null
  /** Estimated session duration */
  estimatedMinutes: number | null
  /** Warmup count (not full details) */
  warmupCount: number
  /** Cooldown count (not full details) */
  cooldownCount: number
  /** Ordered list of main exercises with compact prescriptions */
  exercises: ExercisePrescriptionItem[]
  /** Optional finisher summary */
  finisherSummary: string | null
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
}

/**
 * Build compact prescription surface from authoritative session data.
 * This is the PRIMARY display contract for showing the actual routine.
 * 
 * @param session - Authoritative session data
 * @param exercises - The display exercises for this session
 */
export function buildSessionPrescriptionSurface(
  session: {
    dayNumber: number
    dayLabel?: string
    name?: string
    focus?: string
    focusLabel?: string
    isPrimary?: boolean
    estimatedMinutes?: number
    warmup?: Array<{ id: string }>
    cooldown?: Array<{ id: string }>
    finisher?: { name: string; durationMinutes?: number } | null
    finisherIncluded?: boolean
  },
  exercises: Array<{
    id: string
    name: string
    category?: string
    sets?: number
    reps?: string | number
    hold?: string
    targetRPE?: number
    rest?: string
    loading?: string
    assistanceLevel?: string
    selectionReason?: string
    prescriptionIntent?: string
  }>,
  sessionEvidence?: SessionAiEvidenceSurface
): SessionPrescriptionSurface {
  // Build exercise prescription items
  const prescriptionItems: ExercisePrescriptionItem[] = exercises.map(ex => {
    // Build prescription line
    let prescriptionLine = ''
    if (ex.sets) {
      if (ex.hold) {
        prescriptionLine = `${ex.sets}x${ex.hold}`
      } else if (ex.reps) {
        prescriptionLine = `${ex.sets}x${ex.reps}`
      } else {
        prescriptionLine = `${ex.sets} sets`
      }
    } else if (ex.hold) {
      prescriptionLine = ex.hold
    } else if (ex.reps) {
      prescriptionLine = String(ex.reps)
    }
    
    // Add RPE if present
    if (ex.targetRPE) {
      prescriptionLine += ` @${ex.targetRPE}`
    }
    
    // Determine load cue
    let loadCue: string | null = null
    if (ex.loading) {
      loadCue = ex.loading
    } else if (ex.assistanceLevel) {
      loadCue = ex.assistanceLevel
    }
    
    // Determine emphasis from prescription intent or selection reason
    let emphasis: ExercisePrescriptionItem['emphasis'] = null
    const intent = ex.prescriptionIntent?.toLowerCase() || ''
    const reason = ex.selectionReason?.toLowerCase() || ''
    const cat = (ex.category || '').toLowerCase()
    
    if (intent.includes('primary') || reason.includes('primary') || cat === 'skill') {
      emphasis = 'primary'
    } else if (intent.includes('secondary') || reason.includes('integration')) {
      emphasis = 'secondary'
    } else if (intent.includes('support') || cat === 'accessory') {
      emphasis = 'support'
    }
    
    return {
      id: ex.id,
      displayName: ex.name,
      category: (['skill', 'strength', 'accessory', 'core', 'mobility'].includes(cat) ? cat : 'other') as ExercisePrescriptionItem['category'],
      prescriptionLine: prescriptionLine || '—',
      loadCue,
      restCue: ex.rest || null,
      emphasis,
      source: ex.selectionReason ? 'authoritative' : 'fallback_minimal',
    }
  })
  
  // Build session headline
  let sessionHeadline = session.name || session.focusLabel || `Day ${session.dayNumber}`
  
  // If we have session evidence with a better headline, use it
  if (sessionEvidence?.sessionHeadline && sessionEvidence.source === 'authoritative') {
    sessionHeadline = sessionEvidence.sessionHeadline
  }
  
  // Build focus badge
  let focusBadge: string | null = null
  if (session.isPrimary) {
    focusBadge = session.focus === 'skill' ? 'Skill Focus' : 'Strength Focus'
  } else if (session.focus) {
    focusBadge = session.focus.charAt(0).toUpperCase() + session.focus.slice(1)
  }
  
  // Finisher summary
  let finisherSummary: string | null = null
  if (session.finisher && session.finisherIncluded) {
    finisherSummary = session.finisher.durationMinutes 
      ? `${session.finisher.name} (${session.finisher.durationMinutes}min)`
      : session.finisher.name
  }
  
  return {
    dayLabel: session.dayLabel || `Day ${session.dayNumber}`,
    sessionHeadline,
    focusBadge,
    estimatedMinutes: session.estimatedMinutes || null,
    warmupCount: session.warmup?.length || 0,
    cooldownCount: session.cooldown?.length || 0,
    exercises: prescriptionItems,
    finisherSummary,
    source: prescriptionItems.some(p => p.source === 'authoritative') ? 'authoritative' : 'fallback_minimal',
  }
}

// =============================================================================
// FULL SESSION ROUTINE SURFACE - Complete day routine from ALL exercise families
// =============================================================================

export type RoutineItemFamily = 'warmup' | 'primary' | 'secondary' | 'support' | 'accessory' | 'core' | 'mobility' | 'finisher' | 'cooldown' | 'other'

export interface RoutineItem {
  id: string
  displayName: string
  family: RoutineItemFamily
  /** Compact prescription e.g. "3x5-8" */
  prescriptionLine: string
  /** Load/rest cues */
  loadCue: string | null
  restCue: string | null
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
  // ==========================================================================
  // [GROUPED-TRUTH-CONTRACT] Preserved grouped identity from authoritative
  // session/exercise truth. These are PASSIVE carry-fields only -- the bridge
  // does not compute or decide grouping, it only preserves what the builder
  // already wrote. Downstream stages (buildFullVisibleRoutineExercises,
  // AdaptiveSessionCard) must consume these as the PRIMARY grouping signal
  // and treat name/id matching as legacy fallback only.
  // ==========================================================================
  /** Authoritative source session-exercise id (for exact-match rehydration) */
  sourceExerciseId?: string
  /** Authoritative source session-exercise name (fallback identity only) */
  sourceExerciseName?: string
  /** Canonical position in session.exercises[] (preserves order across renames) */
  sourceOrder?: number
  /** Block identity from builder's method materialization pass */
  blockId?: string
  /** Method tag: 'superset' | 'circuit' | 'cluster' | 'density_block' | 'straight' */
  method?: string
  /** Display label for the method, e.g. "Superset A1/A2" */
  methodLabel?: string
}

export interface FullSessionRoutineSurface {
  /** Day identity */
  dayLabel: string
  dayNumber: number
  sessionHeadline: string
  focusBadge: string | null
  estimatedMinutes: number | null
  /** FULL ordered routine - all families */
  routineItems: RoutineItem[]
  /** Summary counts by family */
  familyCounts: Record<RoutineItemFamily, number>
  /** Whether finisher is included */
  hasFinisher: boolean
  finisherName: string | null
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
}

/**
 * Build FULL session routine surface from ALL authoritative exercise families.
 * This is the COMPLETE display contract for showing the entire day routine.
 * 
 * @param session - Full authoritative session with all exercise arrays
 * @param variant - Optional variant selection (if null, uses full session)
 */
export function buildFullSessionRoutineSurface(
  session: {
    dayNumber: number
    dayLabel?: string
    name?: string
    focus?: string
    focusLabel?: string
    isPrimary?: boolean
    estimatedMinutes?: number
    exercises?: Array<{
      id: string
      name: string
      category?: string
      sets?: number
      reps?: string | number
      hold?: string
      targetRPE?: number
      rest?: string
      loading?: string
      assistanceLevel?: string
      selectionReason?: string
      prescriptionIntent?: string
      // [GROUPED-TRUTH-CONTRACT] Declare the grouped-truth fields the
      // builder writes at lib/adaptive-program-builder.ts method
      // materialization. Without these declarations TypeScript silently
      // strips them at the bridge doorway, erasing grouped identity before
      // any downstream stage can see it.
      blockId?: string
      method?: string
      methodLabel?: string
    }>
    warmup?: Array<{
      id: string
      name: string
      sets?: number
      reps?: string | number
      hold?: string
      selectionReason?: string
    }>
    cooldown?: Array<{
      id: string
      name: string
      sets?: number
      reps?: string | number
      hold?: string
      selectionReason?: string
    }>
    finisher?: {
      name: string
      durationMinutes?: number
      exercises?: Array<{ name: string }>
    } | null
    finisherIncluded?: boolean
  },
  variant?: {
    selection: {
      main: Array<{
        exercise: { id: string; name: string; category?: string }
        sets?: number
        repsOrTime?: string
        prescribedLoad?: { load?: number; unit?: string }
        targetRPE?: number
        restSeconds?: number
        selectionReason?: string
      }>
      warmup?: Array<{
        exercise: { id: string; name: string }
        sets?: number
        repsOrTime?: string
        selectionReason?: string
      }>
      cooldown?: Array<{
        exercise: { id: string; name: string }
        sets?: number
        repsOrTime?: string
        selectionReason?: string
      }>
    }
    duration?: number
  } | null,
  sessionEvidence?: SessionAiEvidenceSurface
): FullSessionRoutineSurface {
  // ==========================================================================
  // [BRIDGE-INPUT-AUDIT] Demoted to fire only when input appears malformed.
  // Previously fired on every render of every session, masking the signal from
  // the authoritative FUNNEL-AUDIT in AdaptiveSessionCard. Now only fires when
  // the bridge receives an empty or structurally-invalid session so the cause
  // of a fallback_minimal output is still traceable.
  // ==========================================================================
  const _bridgeInputInvalid =
    !session.exercises || !Array.isArray(session.exercises) || session.exercises.length === 0
  if (_bridgeInputInvalid) {
    console.log('[v0] [BRIDGE-INPUT-AUDIT] INPUT_INVALID Day', session.dayNumber, {
      sessionExerciseCount: session.exercises?.length || 0,
      exercisesIsArray: Array.isArray(session.exercises),
      warmupCount: session.warmup?.length || 0,
      cooldownCount: session.cooldown?.length || 0,
      variantProvided: !!variant,
      variantMainCount: variant?.selection?.main?.length || 0,
    })
  }
  
  const routineItems: RoutineItem[] = []
  const familyCounts: Record<RoutineItemFamily, number> = {
    warmup: 0, primary: 0, secondary: 0, support: 0, accessory: 0,
    core: 0, mobility: 0, finisher: 0, cooldown: 0, other: 0
  }

  // ==========================================================================
  // [GROUPED-TRUTH-CONTRACT] Canonical source lookup so we can preserve
  // grouped identity ONTO RoutineItem directly at creation time, instead of
  // letting downstream stages guess it back by name. This is THE primary
  // bridge-layer anti-guesswork change.
  //
  // Indexed keys per session exercise (priority on read):
  //   1. raw id
  //   2. lowercased name
  //   3. normalized name (punct/whitespace collapsed) -- tolerates drift
  //
  // Each map entry carries the original exercise + its canonical order index
  // from session.exercises[]. That order index is stable across variant
  // rename/re-ID and is the authoritative anti-guesswork source field.
  // ==========================================================================
  const normalizeNameKey = (s: string | undefined): string =>
    (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()

  type SessionLookupEntry = {
    ex: NonNullable<typeof session.exercises>[number]
    order: number
  }
  const sessionLookup = new Map<string, SessionLookupEntry>()
  session.exercises?.forEach((ex, idx) => {
    const entry: SessionLookupEntry = { ex, order: idx }
    if (ex.id) sessionLookup.set(ex.id, entry)
    if (ex.name) {
      const lower = ex.name.toLowerCase()
      if (!sessionLookup.has(lower)) sessionLookup.set(lower, entry)
      const norm = normalizeNameKey(ex.name)
      if (norm && !sessionLookup.has(norm)) sessionLookup.set(norm, entry)
    }
  })

  const findSessionSource = (
    id: string | undefined,
    name: string | undefined
  ): SessionLookupEntry | undefined => {
    if (id && sessionLookup.has(id)) return sessionLookup.get(id)
    if (name) {
      const lower = name.toLowerCase()
      if (sessionLookup.has(lower)) return sessionLookup.get(lower)
      const norm = normalizeNameKey(name)
      if (norm && sessionLookup.has(norm)) return sessionLookup.get(norm)
    }
    return undefined
  }
  
  // Helper to build prescription line
  const buildPrescription = (item: { sets?: number; reps?: string | number; hold?: string; repsOrTime?: string; targetRPE?: number }): string => {
    let line = ''
    const reps = item.repsOrTime || item.reps
    if (item.sets) {
      if (item.hold) {
        line = `${item.sets}x${item.hold}`
      } else if (reps) {
        line = `${item.sets}x${reps}`
      } else {
        line = `${item.sets} sets`
      }
    } else if (item.hold) {
      line = item.hold
    } else if (reps) {
      line = String(reps)
    }
    if (item.targetRPE) {
      line += ` @${item.targetRPE}`
    }
    return line || '—'
  }
  
  // Helper to determine family from category/intent
  const determineFamily = (category?: string, intent?: string, reason?: string): RoutineItemFamily => {
    const cat = (category || '').toLowerCase()
    const i = (intent || '').toLowerCase()
    const r = (reason || '').toLowerCase()
    
    if (cat === 'skill' || i.includes('primary') || r.includes('primary')) return 'primary'
    if (i.includes('secondary') || r.includes('integration')) return 'secondary'
    if (cat === 'accessory' || i.includes('support') || r.includes('support')) return 'accessory'
    if (cat === 'core') return 'core'
    if (cat === 'mobility' || cat === 'flexibility') return 'mobility'
    if (cat === 'strength') return 'secondary'
    return 'other'
  }
  
  // Use variant if provided, otherwise use full session
  if (variant?.selection) {
    // ==========================================================================
    // [CANONICAL-ORDER-CONTRACT] VARIANT MODE
    //
    // AUTHORITATIVE: variant.selection.main is THE complete main-workout list for
    // this variant. It was built by lib/session-compression-engine.ts and already
    // includes whatever support/accessory/core the variant intentionally kept
    // (see compressMain STEP 2/4/5). The bridge MUST NOT re-expand it.
    //
    // Previously this branch appended every session.exercise that was absent
    // from variant.selection.main ("preserve support/accessory/core"). That
    // silently pulled 45/30 variants back toward Full, making the Program card
    // show a longer list than Start Workout (which consumes variant.selection.main
    // directly via app/(app)/workout/session/page.tsx). The re-expansion has
    // been removed: variant mode now emits ONLY variant.selection.main for the
    // numbered main workout, preserving variant compression end-to-end.
    // ==========================================================================
    const sel = variant.selection

    // Warmup from variant
    if (sel.warmup?.length) {
      sel.warmup.forEach(w => {
        routineItems.push({
          id: w.exercise.id,
          displayName: w.exercise.name,
          family: 'warmup',
          prescriptionLine: buildPrescription(w),
          loadCue: null,
          restCue: null,
          source: w.selectionReason ? 'authoritative' : 'fallback_minimal',
        })
        familyCounts.warmup++
      })
    } else if (session.warmup?.length) {
      // Fallback to session warmup if variant doesn't have it
      session.warmup.forEach(w => {
        routineItems.push({
          id: w.id,
          displayName: w.name,
          family: 'warmup',
          prescriptionLine: buildPrescription(w),
          loadCue: null,
          restCue: null,
          source: w.selectionReason ? 'authoritative' : 'fallback_minimal',
        })
        familyCounts.warmup++
      })
    }
    
    // Main exercises from variant - determine families
    sel.main.forEach(m => {
      const family = determineFamily(m.exercise.category, undefined, m.selectionReason)
      const loadCue = m.prescribedLoad?.load 
        ? `${m.prescribedLoad.load}${m.prescribedLoad.unit || 'kg'}`
        : null
      const restCue = m.restSeconds ? `${Math.round(m.restSeconds / 60)}min` : null

      // [GROUPED-TRUTH-CONTRACT] Look up the originating session exercise so
      // we can preserve its blockId/method/methodLabel ONTO the RoutineItem.
      // Variant selection often renames/re-IDs exercises and its type doesn't
      // carry grouped fields -- this lookup is the only place grouped truth
      // survives for variant-main items.
      const sessionSrc = findSessionSource(m.exercise.id, m.exercise.name)
      
      routineItems.push({
        id: m.exercise.id,
        displayName: m.exercise.name,
        family,
        prescriptionLine: buildPrescription(m),
        loadCue,
        restCue,
        source: m.selectionReason ? 'authoritative' : 'fallback_minimal',
        sourceExerciseId: sessionSrc?.ex.id,
        sourceExerciseName: sessionSrc?.ex.name,
        sourceOrder: sessionSrc?.order,
        blockId: sessionSrc?.ex.blockId,
        method: sessionSrc?.ex.method,
        methodLabel: sessionSrc?.ex.methodLabel,
      })
      familyCounts[family]++
    })
    
    // [CANONICAL-ORDER-CONTRACT] NOTE: No carry-forward of non-variant
    // session.exercises here. variant.selection.main is the authoritative
    // main-workout contract; anything the variant dropped stays dropped so
    // the Program card and Start Workout consume the same ordered list.

    // Cooldown from variant
    if (sel.cooldown?.length) {
      sel.cooldown.forEach(c => {
        routineItems.push({
          id: c.exercise.id,
          displayName: c.exercise.name,
          family: 'cooldown',
          prescriptionLine: buildPrescription(c),
          loadCue: null,
          restCue: null,
          source: c.selectionReason ? 'authoritative' : 'fallback_minimal',
        })
        familyCounts.cooldown++
      })
    } else if (session.cooldown?.length) {
      session.cooldown.forEach(c => {
        routineItems.push({
          id: c.id,
          displayName: c.name,
          family: 'cooldown',
          prescriptionLine: buildPrescription(c),
          loadCue: null,
          restCue: null,
          source: c.selectionReason ? 'authoritative' : 'fallback_minimal',
        })
        familyCounts.cooldown++
      })
    }
  } else {
    // FULL SESSION MODE: Use all session arrays
    
    // Warmup
    session.warmup?.forEach(w => {
      routineItems.push({
        id: w.id,
        displayName: w.name,
        family: 'warmup',
        prescriptionLine: buildPrescription(w),
        loadCue: null,
        restCue: null,
        source: w.selectionReason ? 'authoritative' : 'fallback_minimal',
      })
      familyCounts.warmup++
    })
    
    // Main exercises - determine families from category/intent
    session.exercises?.forEach((ex, idx) => {
      const family = determineFamily(ex.category, ex.prescriptionIntent, ex.selectionReason)
      const loadCue = ex.loading || ex.assistanceLevel || null
      const restCue = ex.rest || null
      
      routineItems.push({
        id: ex.id,
        displayName: ex.name,
        family,
        prescriptionLine: buildPrescription(ex),
        loadCue,
        restCue,
        source: ex.selectionReason ? 'authoritative' : 'fallback_minimal',
        // [GROUPED-TRUTH-CONTRACT] Full-session mode: ex IS the authoritative
        // source; direct-copy grouped fields from the session exercise.
        sourceExerciseId: ex.id,
        sourceExerciseName: ex.name,
        sourceOrder: idx,
        blockId: ex.blockId,
        method: ex.method,
        methodLabel: ex.methodLabel,
      })
      familyCounts[family]++
    })
    
    // Cooldown
    session.cooldown?.forEach(c => {
      routineItems.push({
        id: c.id,
        displayName: c.name,
        family: 'cooldown',
        prescriptionLine: buildPrescription(c),
        loadCue: null,
        restCue: null,
        source: c.selectionReason ? 'authoritative' : 'fallback_minimal',
      })
      familyCounts.cooldown++
    })
  }
  
  // Add finisher if present
  const hasFinisher = !!(session.finisher && session.finisherIncluded)
  if (hasFinisher && session.finisher) {
    familyCounts.finisher = session.finisher.exercises?.length || 1
  }
  
  // Build headline
  let sessionHeadline = session.name || session.focusLabel || `Day ${session.dayNumber}`
  if (sessionEvidence?.sessionHeadline && sessionEvidence.source === 'authoritative') {
    sessionHeadline = sessionEvidence.sessionHeadline
  }
  
  // Focus badge
  let focusBadge: string | null = null
  if (session.isPrimary) {
    focusBadge = session.focus === 'skill' ? 'Skill Focus' : 'Strength Focus'
  } else if (session.focus) {
    focusBadge = session.focus.charAt(0).toUpperCase() + session.focus.slice(1)
  }
  
  // ==========================================================================
  // [BRIDGE-OUTPUT-AUDIT] Failure-only audit. Previously this fired on every
  // session on every render, drowning out signal. Now it fires only when the
  // input session claimed per-exercise grouped truth (blockId or non-straight
  // method) but NONE of it survived into routineItems -- i.e. the bridge itself
  // lost ownership. The compact one-shot per-session FUNNEL-AUDIT at the card
  // (see AdaptiveSessionCard.tsx) is the primary observability probe.
  const withBlockIdCount = routineItems.filter(r => !!r.blockId).length
  const withMethodCount = routineItems.filter(r => r.method && r.method !== 'straight').length
  const sessionExInputWithBlockId = (session.exercises ?? []).filter(
    e => !!(e as { blockId?: string }).blockId
  ).length
  const sessionExInputWithNonStraightMethod = (session.exercises ?? []).filter(e => {
    const m = (e as { method?: string }).method
    return !!m && m !== 'straight'
  }).length
  const bridgeOwnershipFailed =
    (sessionExInputWithBlockId > 0 && withBlockIdCount === 0) ||
    (sessionExInputWithNonStraightMethod > 0 && withMethodCount === 0)
  if (bridgeOwnershipFailed) {
    console.log('[v0] [BRIDGE-OUTPUT-AUDIT] OWNERSHIP_FAILURE Day', session.dayNumber, {
      totalRoutineItems: routineItems.length,
      sessionInput: {
        exCount: session.exercises?.length ?? 0,
        exWithBlockId: sessionExInputWithBlockId,
        exWithNonStraightMethod: sessionExInputWithNonStraightMethod,
      },
      bridgeOutput: {
        itemsWithBlockId: withBlockIdCount,
        itemsWithNonStraightMethod: withMethodCount,
      },
    })
  }
  
  return {
    dayLabel: session.dayLabel || `Day ${session.dayNumber}`,
    dayNumber: session.dayNumber,
    sessionHeadline,
    focusBadge,
    estimatedMinutes: variant?.duration || session.estimatedMinutes || null,
    routineItems,
    familyCounts,
    hasFinisher,
    finisherName: hasFinisher ? session.finisher?.name || null : null,
    source: routineItems.some(r => r.source === 'authoritative') ? 'authoritative' : 'fallback_minimal',
  }
}

// =============================================================================
// SESSION MAIN PREVIEW SURFACE - Canonical-order preview + warmup/cooldown counts
// =============================================================================

export interface SessionMainPreviewSurface {
  /** Main items in CANONICAL session order (warmup/cooldown excluded) */
  previewItems: RoutineItem[]
  /** Count of main workout items (non-warmup/cooldown) */
  mainExerciseCount: number
  /** Hidden warmup count (not in preview) */
  warmupCount: number
  /** Hidden cooldown count (not in preview) */
  cooldownCount: number
  /** Flags */
  hasWarmup: boolean
  hasCooldown: boolean
  hasFinisher: boolean
  finisherName: string | null
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
}

/**
 * Build preview surface from the full routine while preserving CANONICAL
 * session order. Only warmup/cooldown are filtered out of the numbered
 * preview - no family/category reordering occurs.
 *
 * [CANONICAL-ORDER-CONTRACT] Previously this function sorted main items by
 * FAMILY_DISPLAY_PRIORITY (primary → secondary → support → accessory ...),
 * which produced a different exercise order in card previews than in the
 * live Start Workout screen (which walks session.exercises / variant.main
 * in canonical order). The sort has been removed. Preview now preserves the
 * exact order the bridge wrote into fullRoutine.routineItems, which is the
 * same authoritative order Start Workout consumes.
 *
 * @param fullRoutine - The authoritative full routine surface
 */
export function buildSessionMainPreviewSurface(
  fullRoutine: FullSessionRoutineSurface
): SessionMainPreviewSurface {
  // Separate warmup/cooldown from main workout items - preserve original order
  const warmupItems = fullRoutine.routineItems.filter(r => r.family === 'warmup')
  const cooldownItems = fullRoutine.routineItems.filter(r => r.family === 'cooldown')
  const mainItems = fullRoutine.routineItems.filter(r => r.family !== 'warmup' && r.family !== 'cooldown')

  // Preview items = main items in CANONICAL order (no family-priority sort).
  // If no main items exist, fall back to showing warmup/cooldown.
  const previewItems = mainItems.length > 0
    ? mainItems
    : [...warmupItems, ...cooldownItems]

  return {
    previewItems,
    mainExerciseCount: mainItems.length,
    warmupCount: warmupItems.length,
    cooldownCount: cooldownItems.length,
    hasWarmup: warmupItems.length > 0,
    hasCooldown: cooldownItems.length > 0,
    hasFinisher: fullRoutine.hasFinisher,
    finisherName: fullRoutine.finisherName,
    source: fullRoutine.source,
  }
}

// =============================================================================
// SESSION PRIMARY PRESCRIPTION SURFACE - Canonical main workout display owner
// =============================================================================

export interface PrimaryPrescriptionItem {
  id: string
  displayName: string
  /** Compact prescription e.g. "3x5-8 @7" */
  prescriptionLine: string
  /** Optional load cue */
  loadCue: string | null
  /** Optional rest cue */
  restCue: string | null
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
}

export interface SessionPrimaryPrescriptionSurface {
  /** Ordered canonical main exercises for the visible workout list */
  items: PrimaryPrescriptionItem[]
  /** Total count */
  exerciseCount: number
  /** Count hidden if list is truncated */
  hiddenCount: number
  /** Compact section label e.g. "Main Workout" */
  sectionLabel: string
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
  /** Whether secondary support work exists (for footer) */
  supportsAvailable: boolean
}

/**
 * Build PRIMARY PRESCRIPTION surface from canonical main exercises (displayExercises).
 * This is the AUTHORITATIVE owner of the first-visible numbered workout list.
 * It uses the canonical workout order, NOT family-based reordering.
 * 
 * @param displayExercises - The canonical main exercises (variant selection.main or session.exercises)
 * @param sessionEvidence - Optional session evidence for enrichment
 */
export function buildSessionPrimaryPrescriptionSurface(
  displayExercises: Array<{
    id: string
    name: string
    category?: string
    sets?: number
    reps?: string | number
    repsOrTime?: string
    hold?: string
    targetRPE?: number
    rest?: string
    restSeconds?: number
    loading?: string
    assistanceLevel?: string
    prescribedLoad?: { load?: number; unit?: string }
    selectionReason?: string
  }>,
  sessionEvidence?: SessionAiEvidenceSurface,
  fullRoutineSurface?: FullSessionRoutineSurface
): SessionPrimaryPrescriptionSurface {
  // Build prescription items from canonical displayExercises in ORIGINAL order
  const items: PrimaryPrescriptionItem[] = displayExercises.map(ex => {
    // Build prescription line
    let prescriptionLine = ''
    const reps = ex.repsOrTime || ex.reps
    if (ex.sets) {
      if (ex.hold) {
        prescriptionLine = `${ex.sets}x${ex.hold}`
      } else if (reps) {
        prescriptionLine = `${ex.sets}x${reps}`
      } else {
        prescriptionLine = `${ex.sets} sets`
      }
    } else if (ex.hold) {
      prescriptionLine = ex.hold
    } else if (reps) {
      prescriptionLine = String(reps)
    }
    
    // Add RPE if present
    if (ex.targetRPE) {
      prescriptionLine += ` @${ex.targetRPE}`
    }
    
    // Build load cue
    let loadCue: string | null = null
    if (ex.prescribedLoad?.load) {
      loadCue = `${ex.prescribedLoad.load}${ex.prescribedLoad.unit || 'kg'}`
    } else if (ex.loading) {
      loadCue = ex.loading
    } else if (ex.assistanceLevel) {
      loadCue = ex.assistanceLevel
    }
    
    // Build rest cue
    let restCue: string | null = null
    if (ex.restSeconds) {
      restCue = ex.restSeconds >= 60 ? `${Math.round(ex.restSeconds / 60)}min` : `${ex.restSeconds}s`
    } else if (ex.rest) {
      restCue = ex.rest
    }
    
    return {
      id: ex.id,
      displayName: ex.name,
      prescriptionLine: prescriptionLine || '—',
      loadCue,
      restCue,
      source: ex.selectionReason ? 'authoritative' : 'fallback_minimal',
    }
  })
  
  // Check if secondary support work exists (from full routine if available)
  const supportsAvailable = fullRoutineSurface 
    ? (fullRoutineSurface.familyCounts.accessory > 0 || 
       fullRoutineSurface.familyCounts.support > 0 ||
       fullRoutineSurface.familyCounts.core > 0 ||
       fullRoutineSurface.familyCounts.mobility > 0)
    : false
  
  return {
    items,
    exerciseCount: items.length,
    hiddenCount: 0, // Component decides truncation
    sectionLabel: 'Main Workout',
    source: items.some(i => i.source === 'authoritative') ? 'authoritative' : 'fallback_minimal',
    supportsAvailable,
  }
}

// =============================================================================
// SESSION SECONDARY EXERCISE SECTIONS - Remaining visible workout (non-warmup/cooldown)
// =============================================================================

export interface SecondaryExerciseItem {
  id: string
  displayName: string
  prescriptionLine: string
  family: RoutineItemFamily
  source: 'authoritative' | 'fallback_minimal'
}

export interface SecondaryExerciseSection {
  family: RoutineItemFamily
  label: string
  items: SecondaryExerciseItem[]
}

export interface SessionSecondaryExerciseSectionsSurface {
  /** Grouped sections for remaining visible exercises */
  sections: SecondaryExerciseSection[]
  /** Total count of secondary exercises */
  totalCount: number
  /** Whether any secondary exercises exist */
  hasSecondaryExercises: boolean
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
}

/** Human-readable labels for secondary families */
const SECONDARY_FAMILY_LABELS: Partial<Record<RoutineItemFamily, string>> = {
  support: 'Support Work',
  accessory: 'Accessory Work',
  core: 'Core',
  mobility: 'Mobility',
  finisher: 'Finisher',
  secondary: 'Secondary',
  other: 'Additional',
}

/**
 * Build SECONDARY EXERCISE SECTIONS from full routine, excluding warmup/cooldown
 * and items already shown in primary prescription.
 * 
 * @param fullRoutine - The authoritative full routine surface
 * @param primaryPrescription - The primary prescription to deduplicate against
 */
export function buildSessionSecondaryExerciseSectionsSurface(
  fullRoutine: FullSessionRoutineSurface,
  primaryPrescription: SessionPrimaryPrescriptionSurface
): SessionSecondaryExerciseSectionsSurface {
  // Get primary item IDs for deduplication
  const primaryIds = new Set(primaryPrescription.items.map(i => i.id))
  
  // Filter to non-warmup/cooldown items NOT already in primary list
  const secondaryItems = fullRoutine.routineItems.filter(item => 
    item.family !== 'warmup' && 
    item.family !== 'cooldown' &&
    !primaryIds.has(item.id)
  )
  
  // Group by family
  const familyGroups = new Map<RoutineItemFamily, SecondaryExerciseItem[]>()
  
  for (const item of secondaryItems) {
    const existing = familyGroups.get(item.family) || []
    existing.push({
      id: item.id,
      displayName: item.displayName,
      prescriptionLine: item.prescriptionLine,
      family: item.family,
      source: item.source,
    })
    familyGroups.set(item.family, existing)
  }
  
  // Build sections in display order
  const familyOrder: RoutineItemFamily[] = ['secondary', 'support', 'accessory', 'core', 'mobility', 'finisher', 'other']
  const sections: SecondaryExerciseSection[] = []
  
  for (const family of familyOrder) {
    const items = familyGroups.get(family)
    if (items && items.length > 0) {
      sections.push({
        family,
        label: SECONDARY_FAMILY_LABELS[family] || family,
        items,
      })
    }
  }
  
  const totalCount = secondaryItems.length
  
  return {
    sections,
    totalCount,
    hasSecondaryExercises: totalCount > 0,
    source: secondaryItems.some(i => i.source === 'authoritative') ? 'authoritative' : 'fallback_minimal',
  }
}

// =============================================================================
// VISIBLE SESSION ROUTINE SURFACE - UNIFIED SINGLE OWNER for card body display
// =============================================================================

export type VisibleBlockType = 'straight' | 'superset' | 'circuit' | 'density_block' | 'cluster'

export interface VisibleExerciseItem {
  id: string
  displayName: string
  prescriptionLine: string
  loadCue: string | null
  restCue: string | null
  category: string | null
  source: 'authoritative' | 'fallback_minimal'
}

export interface VisibleRoutineBlock {
  blockId: string
  blockType: VisibleBlockType
  blockLabel: string | null
  exercises: VisibleExerciseItem[]
  instruction: string | null
  restProtocol: string | null
}

export interface VisibleSessionRoutineSurface {
  /** Main workout blocks - first visible area */
  mainBlocks: VisibleRoutineBlock[]
  /** Secondary blocks (support/accessory/core/mobility/finisher) */
  secondaryBlocks: VisibleRoutineBlock[]
  /** Warmup summary */
  warmupSummary: { count: number; names: string[] }
  /** Cooldown summary */
  cooldownSummary: { count: number; names: string[] }
  /** Finisher summary */
  finisherSummary: { hasFinisher: boolean; name: string | null }
  /** Total main exercise count */
  mainExerciseCount: number
  /** Total secondary exercise count */
  secondaryExerciseCount: number
  /** Source tracking */
  source: 'authoritative' | 'fallback_minimal'
  /** Whether grouped truth was used */
  usedGroupedTruth: boolean
  /** Focus badge */
  focusBadge: string | null
}

/** Build prescription line from exercise data */
function buildExercisePrescription(ex: {
  sets?: number
  reps?: string | number
  repsOrTime?: string
  hold?: string
  targetRPE?: number
}): string {
  let line = ''
  const reps = ex.repsOrTime || ex.reps
  if (ex.sets) {
    if (ex.hold) {
      line = `${ex.sets}x${ex.hold}`
    } else if (reps) {
      line = `${ex.sets}x${reps}`
    } else {
      line = `${ex.sets} sets`
    }
  } else if (ex.hold) {
    line = ex.hold
  } else if (reps) {
    line = String(reps)
  }
  if (ex.targetRPE) {
    line += ` @${ex.targetRPE}`
  }
  return line || '—'
}

/** Categories considered "main" work */
const MAIN_CATEGORIES = new Set(['skill', 'strength', 'primary'])
/** Categories considered "secondary" work */
const SECONDARY_CATEGORIES = new Set(['accessory', 'support', 'core', 'mobility', 'flexibility', 'finisher'])

/**
 * Build UNIFIED VISIBLE ROUTINE SURFACE - the SINGLE owner for card body display.
 * 
 * Priority 1: Use styledGroups when available (grouped truth)
 * Priority 2: Fall back to flat canonical exercises
 * 
 * This replaces split ownership from primaryPrescription + secondarySections.
 */
export function buildVisibleSessionRoutineSurface(
  session: {
    dayNumber: number
    focus?: string
    isPrimary?: boolean
    exercises?: Array<{
      id: string
      name: string
      category?: string
      sets?: number
      reps?: string | number
      repsOrTime?: string
      hold?: string
      targetRPE?: number
      rest?: string
      restSeconds?: number
      loading?: string
      assistanceLevel?: string
      prescribedLoad?: { load?: number; unit?: string }
      selectionReason?: string
    }>
    warmup?: Array<{ id: string; name: string }>
    cooldown?: Array<{ id: string; name: string }>
    finisher?: { name: string } | null
    finisherIncluded?: boolean
    styleMetadata?: {
      styledGroups?: Array<{
        id?: string
        groupType: 'straight' | 'superset' | 'circuit' | 'density_block' | 'cluster'
        exercises: Array<{
          id: string
          name: string
          sets?: number
          reps?: string
          hold?: string
        }>
        instruction?: string
        restProtocol?: string
      }>
    }
  },
  displayExercises: Array<{
    id: string
    name: string
    category?: string
    sets?: number
    reps?: string | number
    repsOrTime?: string
    hold?: string
    targetRPE?: number
    rest?: string
    restSeconds?: number
    loading?: string
    assistanceLevel?: string
    prescribedLoad?: { load?: number; unit?: string }
    selectionReason?: string
  }>
): VisibleSessionRoutineSurface {
  const mainBlocks: VisibleRoutineBlock[] = []
  const secondaryBlocks: VisibleRoutineBlock[] = []
  let usedGroupedTruth = false
  let mainExerciseCount = 0
  let secondaryExerciseCount = 0
  
  // Build exercise lookup map by ID and name
  const exerciseMap = new Map<string, typeof displayExercises[0]>()
  displayExercises.forEach(e => {
    exerciseMap.set(e.id, e)
    exerciseMap.set(e.name.toLowerCase(), e)
  })
  
  // Helper to build VisibleExerciseItem
  const toVisibleItem = (ex: typeof displayExercises[0]): VisibleExerciseItem => {
    let loadCue: string | null = null
    if (ex.prescribedLoad?.load) {
      loadCue = `${ex.prescribedLoad.load}${ex.prescribedLoad.unit || 'kg'}`
    } else if (ex.loading) {
      loadCue = ex.loading
    } else if (ex.assistanceLevel) {
      loadCue = ex.assistanceLevel
    }
    
    let restCue: string | null = null
    if (ex.restSeconds) {
      restCue = ex.restSeconds >= 60 ? `${Math.round(ex.restSeconds / 60)}min` : `${ex.restSeconds}s`
    } else if (ex.rest) {
      restCue = ex.rest
    }
    
    return {
      id: ex.id,
      displayName: ex.name,
      prescriptionLine: buildExercisePrescription(ex),
      loadCue,
      restCue,
      category: ex.category || null,
      source: ex.selectionReason ? 'authoritative' : 'fallback_minimal',
    }
  }
  
  // Check if styledGroups exist and are valid
  const styledGroups = session.styleMetadata?.styledGroups
  const hasValidGroups = styledGroups && styledGroups.length > 0
  
  if (hasValidGroups) {
    // =======================================================================
    // PRIORITY 1: Use styledGroups as structural truth
    // =======================================================================
    usedGroupedTruth = true
    
    // Track which exercises are in groups
    const groupedIds = new Set<string>()
    styledGroups.forEach(g => g.exercises.forEach(e => {
      groupedIds.add(e.id)
      groupedIds.add(e.name.toLowerCase())
    }))
    
    // Process each group
    styledGroups.forEach((group, idx) => {
      const blockExercises: VisibleExerciseItem[] = []
      let isSecondary = false
      
      group.exercises.forEach(groupEx => {
        // Hydrate with canonical data
        const canonical = exerciseMap.get(groupEx.id) || exerciseMap.get(groupEx.name.toLowerCase())
        
        if (canonical) {
          blockExercises.push(toVisibleItem(canonical))
          // Check if this is secondary work
          if (canonical.category && SECONDARY_CATEGORIES.has(canonical.category.toLowerCase())) {
            isSecondary = true
          }
        } else {
          // Fallback - use group exercise data directly
          blockExercises.push({
            id: groupEx.id,
            displayName: groupEx.name,
            prescriptionLine: buildExercisePrescription(groupEx),
            loadCue: null,
            restCue: null,
            category: null,
            source: 'fallback_minimal',
          })
        }
      })
      
      const block: VisibleRoutineBlock = {
        blockId: group.id || `group-${idx}`,
        blockType: group.groupType,
        blockLabel: group.groupType !== 'straight' ? group.groupType.replace('_', ' ') : null,
        exercises: blockExercises,
        instruction: group.instruction || null,
        restProtocol: group.restProtocol || null,
      }
      
      if (isSecondary) {
        secondaryBlocks.push(block)
        secondaryExerciseCount += blockExercises.length
      } else {
        mainBlocks.push(block)
        mainExerciseCount += blockExercises.length
      }
    })
    
    // Add ungrouped exercises that aren't in any group
    const ungroupedMain: VisibleExerciseItem[] = []
    const ungroupedSecondary: VisibleExerciseItem[] = []
    
    displayExercises.forEach(ex => {
      if (!groupedIds.has(ex.id) && !groupedIds.has(ex.name.toLowerCase())) {
        const item = toVisibleItem(ex)
        if (ex.category && SECONDARY_CATEGORIES.has(ex.category.toLowerCase())) {
          ungroupedSecondary.push(item)
        } else {
          ungroupedMain.push(item)
        }
      }
    })
    
    // Add ungrouped main as a straight block if any exist
    if (ungroupedMain.length > 0) {
      mainBlocks.push({
        blockId: 'ungrouped-main',
        blockType: 'straight',
        blockLabel: null,
        exercises: ungroupedMain,
        instruction: null,
        restProtocol: null,
      })
      mainExerciseCount += ungroupedMain.length
    }
    
    // Add ungrouped secondary as a straight block if any exist
    if (ungroupedSecondary.length > 0) {
      secondaryBlocks.push({
        blockId: 'ungrouped-secondary',
        blockType: 'straight',
        blockLabel: null,
        exercises: ungroupedSecondary,
        instruction: null,
        restProtocol: null,
      })
      secondaryExerciseCount += ungroupedSecondary.length
    }
    
  } else {
    // =======================================================================
    // PRIORITY 2: Fall back to flat canonical exercises
    // =======================================================================
    const mainItems: VisibleExerciseItem[] = []
    const secondaryItems: VisibleExerciseItem[] = []
    
    displayExercises.forEach(ex => {
      const item = toVisibleItem(ex)
      if (ex.category && SECONDARY_CATEGORIES.has(ex.category.toLowerCase())) {
        secondaryItems.push(item)
      } else {
        mainItems.push(item)
      }
    })
    
    // Create single blocks for flat layout
    if (mainItems.length > 0) {
      mainBlocks.push({
        blockId: 'main-flat',
        blockType: 'straight',
        blockLabel: null,
        exercises: mainItems,
        instruction: null,
        restProtocol: null,
      })
      mainExerciseCount = mainItems.length
    }
    
    if (secondaryItems.length > 0) {
      secondaryBlocks.push({
        blockId: 'secondary-flat',
        blockType: 'straight',
        blockLabel: null,
        exercises: secondaryItems,
        instruction: null,
        restProtocol: null,
      })
      secondaryExerciseCount = secondaryItems.length
    }
  }
  
  // Build warmup/cooldown summaries
  const warmupSummary = {
    count: session.warmup?.length || 0,
    names: (session.warmup || []).slice(0, 3).map(w => w.name),
  }
  
  const cooldownSummary = {
    count: session.cooldown?.length || 0,
    names: (session.cooldown || []).slice(0, 3).map(c => c.name),
  }
  
  const finisherSummary = {
    hasFinisher: !!(session.finisher && session.finisherIncluded),
    name: session.finisher?.name || null,
  }
  
  // Build focus badge
  let focusBadge: string | null = null
  if (session.isPrimary) {
    focusBadge = session.focus === 'skill' ? 'Skill Focus' : 'Strength Focus'
  } else if (session.focus) {
    focusBadge = session.focus.charAt(0).toUpperCase() + session.focus.slice(1)
  }
  
  // Determine overall source
  const allExercises = [...mainBlocks.flatMap(b => b.exercises), ...secondaryBlocks.flatMap(b => b.exercises)]
  const source = allExercises.some(e => e.source === 'authoritative') ? 'authoritative' : 'fallback_minimal'
  
  return {
    mainBlocks,
    secondaryBlocks,
    warmupSummary,
    cooldownSummary,
    finisherSummary,
    mainExerciseCount,
    secondaryExerciseCount,
    source,
    usedGroupedTruth,
    focusBadge,
  }
}

// =============================================================================
// FULL VISIBLE ROUTINE EXERCISES ADAPTER
// Converts fullRoutineSurface.routineItems to displayExercises-compatible format
// for MainExercisesRenderer - includes ALL non-warmup/non-cooldown exercises
// =============================================================================

export interface FullRoutineExercise {
  id: string
  name: string
  category: string
  sets?: number
  repsOrTime?: string
  hold?: string
  targetRPE?: number
  rest?: string
  restSeconds?: number
  loading?: string
  assistanceLevel?: string
  prescribedLoad?: { load?: number; unit?: string }
  selectionReason?: string
  isOverrideable?: boolean
  note?: string
  // Family tracking for section headers
  routineFamily: RoutineItemFamily
  // [WEEK-SCALING-BRIDGE] Week-scaled dosage fields for live UI updates
  scaledSets?: number
  scaledReps?: string
  scaledTargetRPE?: number
  scaledRestPeriod?: number
  weekScalingApplied?: boolean
  // [GROUPED-TRUTH-PROPAGATION] Method materialization fields that MUST survive
  // the session -> fullRoutineSurface -> displayExercises hydration chain.
  // Without these, the adapter's exercise-fallback path can never detect grouping,
  // and the canonical-walk in AdaptiveSessionCard cannot group by blockId.
  // The builder writes these at lib/adaptive-program-builder.ts:11895-11901 -- we
  // must carry them all the way to the render surface.
  blockId?: string
  method?: string
  methodLabel?: string
  }

/**
 * Build FULL VISIBLE ROUTINE EXERCISES from fullRoutineSurface.
 * This is the authoritative input for MainExercisesRenderer.
 * Includes ALL non-warmup/non-cooldown exercises (main + support + accessory + core + mobility + finisher).
 * 
 * @param fullRoutineSurface - The authoritative full routine surface
 * @param sessionExercises - Original session exercises for hydration with full prescription data
 * @param variantSelection - Optional variant selection for prescription overrides
 */
export function buildFullVisibleRoutineExercises(
  fullRoutineSurface: FullSessionRoutineSurface,
  sessionExercises: Array<{
  id: string
  name: string
  category?: string
  sets?: number
  reps?: string | number
  repsOrTime?: string
  hold?: string
  targetRPE?: number
  rest?: string
  restSeconds?: number
  loading?: string
  assistanceLevel?: string
  prescribedLoad?: { load?: number; unit?: string }
  selectionReason?: string
  isOverrideable?: boolean
  note?: string
  // [WEEK-SCALING-BRIDGE] Accept week-scaled fields from scaleSessionsForWeek
  scaledSets?: number
  scaledReps?: string
  scaledTargetRPE?: number
  scaledRestPeriod?: number
  weekScalingApplied?: boolean
  // [GROUPED-TRUTH-PROPAGATION] Grouping fields written by the builder's
  // method materialization layer (adaptive-program-builder.ts:11895-11901).
  // Must be passed through to keep render-time grouping detection alive.
  blockId?: string
  method?: string
  methodLabel?: string
  }>,
  variantSelection?: {
    main?: Array<{
      exercise: { id: string; name: string; category?: string }
      sets?: number
      repsOrTime?: string
      hold?: string
      targetRPE?: number
      restSeconds?: number
      prescribedLoad?: { load?: number; unit?: string }
      selectionReason?: string
      isOverrideable?: boolean
      note?: string
    }>
  } | null
): FullRoutineExercise[] {
  const result: FullRoutineExercise[] = []
  
  // Build lookup maps for hydration
  // [GROUPED-TRUTH-PROPAGATION] Multi-key map so blockId/method/methodLabel
  // survive variant-rename / routine-surface id drift. The canonical-walk in
  // AdaptiveSessionCard matches grouped members by blockId FIRST, so if this
  // lookup fails and blockId drops to undefined on a FullRoutineExercise,
  // the corresponding exercise loses its grouped identity at render time
  // and the group gets pushed to the end by the rescue block (looking
  // detached from canonical session order).
  //
  // Keys indexed (in priority order per-entry):
  //   1. raw id
  //   2. lowercased raw name
  //   3. normalized name (trimmed, collapsed whitespace, punctuation stripped)
  // The normalized key handles minor rename drift between session.exercises
  // and variant.selection.main (e.g. "Pull-ups" vs "Pull Ups" vs "Pullups").
  const normalizeExerciseKey = (s: string | undefined): string =>
    (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()

  const sessionExerciseMap = new Map<string, typeof sessionExercises[0]>()
  // [GROUPED-TRUTH-PROPAGATION] POSITIONAL INDEX. The bridge preserves
  // `sourceOrder` (canonical index in session.exercises[]) onto RoutineItem.
  // When id-based and name-based lookups both miss (e.g. aggressive variant
  // rename rewrites the id AND the name so neither raw/lower/normalized key
  // resolves), this positional index is the last-resort exact identity
  // bridge. Without it, sessionEx falls through to undefined and we silently
  // lose access to the authoritative session exercise -- which breaks the
  // legacy fallback for blockId/method/methodLabel (item.blockId ?? sessionEx?.blockId)
  // and also drops category/sets/reps hydration. Indexing by position mirrors
  // how the bridge wrote sourceOrder: idx === session.exercises[idx].
  const sessionExerciseByOrder = new Map<number, typeof sessionExercises[0]>()
  sessionExercises.forEach((e, idx) => {
    sessionExerciseByOrder.set(idx, e)
    if (e.id) sessionExerciseMap.set(e.id, e)
    if (e.name) {
      sessionExerciseMap.set(e.name.toLowerCase(), e)
      const normKey = normalizeExerciseKey(e.name)
      if (normKey && !sessionExerciseMap.has(normKey)) {
        sessionExerciseMap.set(normKey, e)
      }
    }
  })
  
  // Build variant lookup if available
  // [VARIANT-LOOKUP-KEY-PARITY] Indexing MUST cover the same key space as the
  // trim pass below (raw id, lowercased name, normalized name). Previously
  // only id + lowercased name were indexed here, so rows whose name had
  // punctuation/casing drift (e.g. "Pull-Ups" vs "Pull Ups") would:
  //   - PASS the trim pass (which uses normalized name)
  //   - FAIL this hydration lookup (which doesn't)
  // resulting in rows that survive into the variant output but carry the
  // FULL session's `sets`/`targetRPE`/`restSeconds` via the sessionEx
  // fallback branch. That is the exact prescription-divergence point that
  // made 45 and 30 look as heavy as Full.
  const variantExerciseMap = new Map<string, NonNullable<typeof variantSelection>['main'][0]>()
  if (variantSelection?.main) {
    variantSelection.main.forEach(v => {
      if (v.exercise.id) variantExerciseMap.set(v.exercise.id, v)
      if (v.exercise.name) {
        variantExerciseMap.set(v.exercise.name.toLowerCase(), v)
        const normKey = normalizeExerciseKey(v.exercise.name)
        if (normKey && !variantExerciseMap.has(normKey)) {
          variantExerciseMap.set(normKey, v)
        }
      }
    })
  }
  
  // Filter to non-warmup/non-cooldown and build full exercise objects
  for (const item of fullRoutineSurface.routineItems) {
    // Skip warmup and cooldown - they have separate UI
    if (item.family === 'warmup' || item.family === 'cooldown') {
      continue
    }
    
    // Try to find full exercise data from session or variant
    // [VARIANT-LOOKUP-KEY-PARITY] Third tier uses normalized name so rename
    // drift between fullRoutineSurface items and variant.selection.main members
    // (different punctuation/casing) cannot demote us to sessionEx fallback.
    const variantEx =
      variantExerciseMap.get(item.id) ||
      variantExerciseMap.get(item.displayName.toLowerCase()) ||
      variantExerciseMap.get(normalizeExerciseKey(item.displayName))
    // [GROUPED-TRUTH-CONTRACT] PRIMARY OWNERSHIP: when the upstream bridge
    // preserved the originating session exercise identity onto RoutineItem
    // (item.sourceExerciseId), we match by that id FIRST. This is exact-identity
    // rehydration, not name guesswork -- if the builder wrote blockId to session
    // exercise X and the bridge preserved sourceExerciseId=X onto its RoutineItem,
    // we ALWAYS resolve to the same session exercise X here regardless of variant
    // rename/re-ID.
    // LEGACY FALLBACK: name-based lookup remains for programs generated before
    // the preserved-field contract (older saved programs where item.sourceExerciseId
    // is undefined).
    const sessionEx =
      (item.sourceExerciseId && sessionExerciseMap.get(item.sourceExerciseId)) ||
      sessionExerciseMap.get(item.id) ||
      sessionExerciseMap.get(item.displayName.toLowerCase()) ||
      sessionExerciseMap.get(normalizeExerciseKey(item.displayName)) ||
      // [GROUPED-TRUTH-PROPAGATION] Last-resort positional bridge. When
      // variant rename drift erased id AND name AND normalized name, the
      // canonical session-exercise position (written by the bridge at
      // sourceOrder) is the only surviving identity signal. This preserves
      // category/sets/reps hydration AND the legacy-fallback grouped
      // carry (sessionEx?.blockId / method / methodLabel) used below.
      (typeof item.sourceOrder === 'number' ? sessionExerciseByOrder.get(item.sourceOrder) : undefined)
    
    // Build category from family
    const category = item.family === 'primary' ? 'skill'
      : item.family === 'secondary' ? 'strength'
      : item.family === 'accessory' ? 'accessory'
      : item.family === 'support' ? 'support'
      : item.family === 'core' ? 'core'
      : item.family === 'mobility' ? 'mobility'
      : item.family === 'finisher' ? 'finisher'
      : sessionEx?.category || 'other'
    
    // Parse prescription line for sets/reps if not available from source
    let sets: number | undefined
    let repsOrTime: string | undefined
    let hold: string | undefined
    
    // Priority: variant > session > parsed from prescription line
    if (variantEx) {
      sets = variantEx.sets
      repsOrTime = variantEx.repsOrTime
      hold = variantEx.hold
    } else if (sessionEx) {
      sets = sessionEx.sets
      repsOrTime = sessionEx.repsOrTime || (sessionEx.reps ? String(sessionEx.reps) : undefined)
      hold = sessionEx.hold
    } else {
      // Parse from prescription line (e.g. "3x8-12 @7")
      const prescMatch = item.prescriptionLine.match(/^(\d+)x(.+?)(?:\s|$)/)
      if (prescMatch) {
        sets = parseInt(prescMatch[1], 10)
        repsOrTime = prescMatch[2]
      }
    }
    
    result.push({
      id: item.id,
      name: item.displayName,
      category,
      sets,
      repsOrTime,
      hold,
      targetRPE: variantEx?.targetRPE || sessionEx?.targetRPE,
      rest: sessionEx?.rest,
      restSeconds: variantEx?.restSeconds || sessionEx?.restSeconds,
      loading: sessionEx?.loading,
      assistanceLevel: sessionEx?.assistanceLevel,
      prescribedLoad: variantEx?.prescribedLoad || sessionEx?.prescribedLoad,
      selectionReason: variantEx?.selectionReason || sessionEx?.selectionReason || (item.source === 'authoritative' ? 'AI-selected' : undefined),
      isOverrideable: variantEx?.isOverrideable ?? sessionEx?.isOverrideable ?? true,
      note: variantEx?.note || sessionEx?.note,
      routineFamily: item.family,
      // [WEEK-SCALING-BRIDGE] Preserve scaled fields from session exercises for live UI updates
      scaledSets: sessionEx?.scaledSets,
      scaledReps: sessionEx?.scaledReps,
      scaledTargetRPE: sessionEx?.scaledTargetRPE,
      scaledRestPeriod: sessionEx?.scaledRestPeriod,
      weekScalingApplied: sessionEx?.weekScalingApplied,
      // [GROUPED-TRUTH-CONTRACT] PRIMARY OWNERSHIP: the bridge already preserved
      // grouped identity onto RoutineItem at creation time (see
      // buildFullSessionRoutineSurface). That is the authoritative carry-forward
      // path. sessionEx?.blockId is LEGACY FALLBACK only -- it handles older
      // saved programs where RoutineItem.blockId is undefined. For all newly
      // generated healthy programs, item.blockId is the truth source.
      blockId: item.blockId ?? sessionEx?.blockId,
      method: item.method ?? sessionEx?.method,
      methodLabel: item.methodLabel ?? sessionEx?.methodLabel,
    })
  }

  // [POST-SELECTION-FLATTENING-FIX] If a variant is actually selected, TRIM the
  // visible exercise list to the variant's chosen exercises AND overwrite the
  // prescription values with the variant's authoritative truth.
  //
  // Prior behaviour only TRIMMED rows but kept each surviving row's existing
  // prescription (sets/repsOrTime/hold/targetRPE/restSeconds/prescribedLoad)
  // as it was hydrated above. When the upstream hydration lookup missed the
  // variant (key drift: id vs lowercased vs normalized name), the row
  // fell through to `sessionEx.*` which is the FULL session's prescription.
  // Net effect: 45 and 30 dropped exercises count-wise but carried Full's
  // set counts on every remaining row, so burden felt almost identical.
  //
  // [VARIANT-PRESCRIPTION-AUTHORITY] Fix: when trimming, rehydrate each
  // surviving row's prescription FROM THE VARIANT'S selection.main[vi]
  // directly. This is the single authoritative prescription source for the
  // selected mode; no probabilistic map lookup involved. scaledSets /
  // scaledReps / scaledTargetRPE / scaledRestPeriod are cleared because the
  // week-scaling path targeted the FULL session baseline, not this trimmed
  // variant -- keeping them would let effectiveSets in ExerciseRow
  // (scaledSets ?? exercise.sets) silently revert back to Full truth.
  if (variantSelection?.main && variantSelection.main.length > 0) {
    const variantOrder = new Map<string, number>() // key -> index in variant
    variantSelection.main.forEach((v, idx) => {
      if (v.exercise.id) {
        variantOrder.set(`id:${v.exercise.id}`, idx)
      }
      if (v.exercise.name) {
        const nk = normalizeExerciseKey(v.exercise.name)
        if (!variantOrder.has(`name:${nk}`)) variantOrder.set(`name:${nk}`, idx)
      }
    })

    const matchVariantIndex = (row: FullRoutineExercise): number | null => {
      if (row.id && variantOrder.has(`id:${row.id}`)) return variantOrder.get(`id:${row.id}`)!
      const nk = normalizeExerciseKey(row.name)
      if (nk && variantOrder.has(`name:${nk}`)) return variantOrder.get(`name:${nk}`)!
      return null
    }

    const trimmed = result
      .map(row => ({ row, vi: matchVariantIndex(row) }))
      .filter(x => x.vi !== null) as Array<{ row: FullRoutineExercise; vi: number }>

    // Sort by variant order so the visible list matches the selected session
    // contract exactly (e.g. grouped pair stays adjacent, skill-first order).
    trimmed.sort((a, b) => a.vi - b.vi)

    // Safety net: if every row dropped (identity drift), fall back to full
    // result so we never render an empty session body.
    if (trimmed.length > 0) {
      // [VARIANT-PRESCRIPTION-AUTHORITY] Overwrite each trimmed row's
      // prescription with the variant's authoritative truth. This is the
      // single source of truth for the selected mode's dosage.
      const authoritative = trimmed.map(({ row, vi }) => {
        const v = variantSelection.main![vi]
        return {
          ...row,
          // Hard override: variant dosage is the final visible contract.
          sets: v.sets ?? row.sets,
          repsOrTime: v.repsOrTime ?? row.repsOrTime,
          hold: v.hold ?? row.hold,
          targetRPE: v.targetRPE ?? row.targetRPE,
          restSeconds: v.restSeconds ?? row.restSeconds,
          prescribedLoad: v.prescribedLoad ?? row.prescribedLoad,
          // Clear Week-scaling leak paths: those values were computed from
          // the FULL session baseline, not from this trimmed variant. If
          // kept, ExerciseRow's `scaledSets ?? exercise.sets` priority
          // would silently re-surface Full's set count on every row.
          scaledSets: undefined,
          scaledReps: undefined,
          scaledTargetRPE: undefined,
          scaledRestPeriod: undefined,
          weekScalingApplied: false,
        } as FullRoutineExercise
      })

      // [VARIANT-PRESCRIPTION-AUTHORITY-AUDIT] Burden-delta proof so we can
      // eyeball in logs that 45/30 actually trim vs Full for the selected day.
      const variantTotalSets = authoritative.reduce((sum, r) => sum + (r.sets ?? 0), 0)
      const fullTotalSets = result.reduce((sum, r) => sum + (r.sets ?? 0), 0)
      console.log('[variant-prescription-authority-audit]', {
        variantMainCount: variantSelection.main.length,
        fullRowCount: result.length,
        visibleRowCount: authoritative.length,
        visibleSetsPerRow: authoritative.map(r => ({ name: r.name, sets: r.sets })),
        fullSetsTotal: fullTotalSets,
        variantSetsTotal: variantTotalSets,
        burdenDeltaPct: fullTotalSets > 0
          ? Math.round((1 - variantTotalSets / fullTotalSets) * 100)
          : 0,
      })

      return authoritative
    }
  }

  return result
}

// =============================================================================
// PROGRAM-LEVEL EVIDENCE MODEL
// =============================================================================

/**
 * Build complete program-level evidence model for all sessions.
 * This provides the full bridge for consistent display.
 */
export function buildProgramAiEvidenceModel(
  program: {
    id: string
    primaryGoal: string
    secondaryGoal?: string | null
    sessions: Array<Parameters<typeof buildSessionAiEvidenceSurface>[0]>
    isFirstWeek?: boolean
    adaptationPhase?: string
    summaryTruth?: {
      headlineSkills?: string[]
      hybridSummary?: string
    }
  }
): ProgramAiEvidenceModel {
  const sessionEvidences = new Map<number, SessionAiEvidenceSurface>()
  let overallSource: ProgramAiEvidenceModel['source'] = 'fallback_minimal'
  
  const programContext = {
    primaryGoal: program.primaryGoal,
    secondaryGoal: program.secondaryGoal || null,
    isFirstWeek: program.isFirstWeek,
    adaptationPhase: program.adaptationPhase,
  }
  
  // Build evidence for each session
  for (const session of program.sessions) {
    const rawEvidence = buildSessionAiEvidenceSurface(session, programContext)
    const cleanedEvidence = deduplicateSessionEvidence(rawEvidence)
    sessionEvidences.set(session.dayNumber, cleanedEvidence)
    
    if (cleanedEvidence.source === 'authoritative') {
      overallSource = 'authoritative'
    }
  }
  
  // Build program headline
  let programHeadline = ''
  if (program.summaryTruth?.hybridSummary) {
    programHeadline = program.summaryTruth.hybridSummary.split('.')[0]
  } else if (program.summaryTruth?.headlineSkills?.length) {
    programHeadline = program.summaryTruth.headlineSkills.join(' + ')
  } else {
    programHeadline = `${program.primaryGoal.replace(/_/g, ' ')} Program`
  }
  
  return {
    programHeadline,
    sessionEvidences,
    primaryGoal: program.primaryGoal,
    secondaryGoal: program.secondaryGoal || null,
    source: overallSource,
  }
}
