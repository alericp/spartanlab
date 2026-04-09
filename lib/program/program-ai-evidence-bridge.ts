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
  const routineItems: RoutineItem[] = []
  const familyCounts: Record<RoutineItemFamily, number> = {
    warmup: 0, primary: 0, secondary: 0, support: 0, accessory: 0,
    core: 0, mobility: 0, finisher: 0, cooldown: 0, other: 0
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
    // VARIANT MODE: Use variant's complete selection
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
      
      routineItems.push({
        id: m.exercise.id,
        displayName: m.exercise.name,
        family,
        prescriptionLine: buildPrescription(m),
        loadCue,
        restCue,
        source: m.selectionReason ? 'authoritative' : 'fallback_minimal',
      })
      familyCounts[family]++
    })
    
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
    session.exercises?.forEach(ex => {
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
// SESSION MAIN PREVIEW SURFACE - Display-priority reordering for compact cards
// =============================================================================

/** Priority order for display (lower = appears first in compact preview) */
const FAMILY_DISPLAY_PRIORITY: Record<RoutineItemFamily, number> = {
  primary: 1,
  secondary: 2,
  support: 3,
  accessory: 4,
  core: 5,
  mobility: 6,
  finisher: 7,
  other: 8,
  warmup: 9,
  cooldown: 10,
}

export interface SessionMainPreviewSurface {
  /** Reordered items for compact preview display (main work first) */
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
 * Build DISPLAY-PRIORITY preview surface from full routine.
 * This reorders items so main workout appears first in compact card preview.
 * Warmup/cooldown are demoted to secondary summary, not lead rows.
 * 
 * @param fullRoutine - The authoritative full routine surface
 */
export function buildSessionMainPreviewSurface(
  fullRoutine: FullSessionRoutineSurface
): SessionMainPreviewSurface {
  // Separate warmup/cooldown from main workout items
  const warmupItems = fullRoutine.routineItems.filter(r => r.family === 'warmup')
  const cooldownItems = fullRoutine.routineItems.filter(r => r.family === 'cooldown')
  const mainItems = fullRoutine.routineItems.filter(r => r.family !== 'warmup' && r.family !== 'cooldown')
  
  // Sort main items by display priority
  const sortedMainItems = [...mainItems].sort((a, b) => {
    return FAMILY_DISPLAY_PRIORITY[a.family] - FAMILY_DISPLAY_PRIORITY[b.family]
  })
  
  // Preview items = main items first (warmup/cooldown excluded from numbered list)
  // If no main items exist, fall back to showing warmup/cooldown
  const previewItems = sortedMainItems.length > 0 
    ? sortedMainItems 
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
