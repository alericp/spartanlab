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
