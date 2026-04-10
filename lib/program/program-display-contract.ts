/**
 * PROGRAM DISPLAY CONTRACT
 * 
 * =============================================================================
 * CANONICAL READ-ONLY VIEW MODEL FOR PROGRAM PAGE INTELLIGENCE SURFACES
 * =============================================================================
 * 
 * This module assembles display-ready intelligence from existing program truth
 * sources WITHOUT modifying builder logic or creating parallel truth paths.
 * 
 * SOURCES:
 * - program.dominantSpineResolution (training spine, style mode, density rules)
 * - program.summaryTruth (headline skills, hybrid summary)
 * - program.weeklyRepresentation (skill exposure policies)
 * - program.flexibleFrequencyRootCause (schedule decision rationale)
 * - program.plannerTruthAudit (generation truth audit)
 * - program.constraintInsight (protected constraints)
 * 
 * RULE: Read-only extraction, no fabrication. If truth is missing, say so.
 */

import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export interface TrainingSpineDisplay {
  /** Primary training spine label e.g. "Skill-Strength Spine" */
  label: string
  /** Primary style mode e.g. "skill_first", "strength_first", "hybrid" */
  styleMode: string
  /** Secondary influences present */
  secondaryInfluences: string[]
  /** Whether density work is allowed */
  densityAllowed: boolean
  /** Short rationale for spine selection */
  rationale: string | null
  /** Source: 'dominantSpineResolution' | 'inferred' | 'unavailable' */
  source: string
}

export interface PlanEmphasisDisplay {
  /** Primary emphasis items e.g. ["straight-arm pushing priority", "front lever maintenance"] */
  items: string[]
  /** Source of emphasis data */
  source: string
}

export interface ProtectedConstraintDisplay {
  /** Constraint label e.g. "Recovery-protected straight-arm load" */
  label: string
  /** Why this constraint matters */
  reason: string
  /** Severity: 'protective' | 'limiting' | 'structural' */
  type: 'protective' | 'limiting' | 'structural'
}

export interface TradeoffDisplay {
  /** What was prioritized */
  prioritized: string
  /** What was limited/reduced */
  limited: string
  /** Brief explanation */
  reason: string
}

export interface WeekDriverDisplay {
  /** Main driver label e.g. "6-session flexible week" */
  label: string
  /** Why this schedule was chosen */
  reason: string
  /** Source of schedule decision */
  source: string
}

export interface SecondarySkillHandlingDisplay {
  /** How secondary skills are being handled */
  strategy: string
  /** Which skills are secondary */
  skills: string[]
  /** Exposure level: 'support_rotation' | 'direct_secondary' | 'deferred' */
  exposureLevel: string
}

// =============================================================================
// WEEKLY DECISION OUTPUT TYPES
// =============================================================================

export interface SessionDistributionEntry {
  /** Session focus label */
  label: string
  /** Number of sessions with this focus */
  count: number
  /** Session day numbers */
  days: number[]
  /** Category: 'skill_primary' | 'strength_support' | 'mixed' | 'accessory' | 'recovery' */
  category: 'skill_primary' | 'strength_support' | 'mixed' | 'accessory' | 'recovery'
}

// =============================================================================
// [WEEK-ADAPTATION-DECISION-CONTRACT] WEEK ADAPTATION DISPLAY TYPES
// =============================================================================

export interface WeekAdaptationDisplay {
  /** Phase label e.g. "Acclimation Week", "Normal Progression" */
  phaseLabel: string
  /** Short description of current phase */
  phaseDescription: string
  /** Whether protective measures are active */
  isProtective: boolean
  /** Target days for this week */
  targetDays: number
  /** Load adjustment summary */
  loadSummary: string
  /** Active doctrine constraints (if any) */
  doctrineConstraints: string[]
  /** First-week governor active? */
  isFirstWeekProtected: boolean
  /** Evidence trail for UI display */
  evidence: string[]
  /** Source of this display data */
  source: 'weekAdaptationDecision' | 'generationTruthSnapshot' | 'unavailable'
}

/**
 * Extract week adaptation display from program
 */
export function getWeekAdaptationDisplay(program: AdaptiveProgram): WeekAdaptationDisplay {
  const decision = program.weekAdaptationDecision
  const snapshotAudit = program.generationTruthSnapshot?.weekAdaptationDecisionAudit
  
  // Try direct decision first
  if (decision) {
    const phaseLabels: Record<string, string> = {
      'initial_acclimation': 'Acclimation Week',
      'normal_progression': 'Normal Progression',
      'recovery_constrained': 'Recovery Priority',
      'rebuild_after_disruption': 'Rebuilding Phase',
    }
    
    const phaseDescriptions: Record<string, string> = {
      'initial_acclimation': 'Conservative dosage for new program adaptation',
      'normal_progression': 'Standard training load',
      'recovery_constrained': 'Reduced load to support recovery',
      'rebuild_after_disruption': 'Ramping back up after training gap',
    }
    
    const loadParts: string[] = []
    if (decision.loadStrategy.volumeBias !== 'normal') {
      loadParts.push(`Volume ${decision.loadStrategy.volumeBias}`)
    }
    if (decision.loadStrategy.intensityBias !== 'normal') {
      loadParts.push(`Intensity ${decision.loadStrategy.intensityBias}`)
    }
    if (decision.loadStrategy.finisherBias === 'limited') {
      loadParts.push('Finishers limited')
    }
    if (decision.loadStrategy.straightArmExposureBias === 'protected') {
      loadParts.push('Straight-arm protected')
    }
    
    return {
      phaseLabel: phaseLabels[decision.phase] || decision.phase,
      phaseDescription: phaseDescriptions[decision.phase] || '',
      isProtective: 
        decision.phase === 'initial_acclimation' ||
        decision.phase === 'recovery_constrained' ||
        decision.loadStrategy.volumeBias === 'reduced' ||
        decision.loadStrategy.intensityBias === 'reduced',
      targetDays: decision.targetDays,
      loadSummary: loadParts.length > 0 ? loadParts.join(' • ') : 'Standard load',
      doctrineConstraints: decision.doctrineConstraints,
      isFirstWeekProtected: decision.firstWeekGovernor.active,
      evidence: decision.evidence,
      source: 'weekAdaptationDecision',
    }
  }
  
  // Fall back to snapshot audit
  if (snapshotAudit) {
    const phaseLabels: Record<string, string> = {
      'initial_acclimation': 'Acclimation Week',
      'normal_progression': 'Normal Progression',
      'recovery_constrained': 'Recovery Priority',
      'rebuild_after_disruption': 'Rebuilding Phase',
    }
    
    return {
      phaseLabel: phaseLabels[snapshotAudit.phase] || snapshotAudit.phase,
      phaseDescription: snapshotAudit.summary || '',
      isProtective: 
        snapshotAudit.phase === 'initial_acclimation' ||
        snapshotAudit.loadStrategy?.volumeBias === 'reduced',
      targetDays: snapshotAudit.targetDays,
      loadSummary: snapshotAudit.summary || 'Standard load',
      doctrineConstraints: snapshotAudit.doctrineConstraints || [],
      isFirstWeekProtected: snapshotAudit.firstWeekGovernor?.active || false,
      evidence: snapshotAudit.evidence || [],
      source: 'generationTruthSnapshot',
    }
  }
  
  // Unavailable
  return {
    phaseLabel: 'Unknown',
    phaseDescription: 'Week adaptation decision not available',
    isProtective: false,
    targetDays: program.trainingDaysPerWeek || 4,
    loadSummary: 'Standard load',
    doctrineConstraints: [],
    isFirstWeekProtected: false,
    evidence: [],
    source: 'unavailable',
  }
}

// =============================================================================
// [PRESCRIPTION-PROPAGATION] PRESCRIPTION PROPAGATION DISPLAY TYPES
// =============================================================================

export interface PrescriptionPropagationDisplay {
  /** Was prescription materially changed by week adaptation? */
  materiallyChanged: boolean
  /** What was applied */
  appliedChanges: {
    setsReduced: boolean
    rpeReduced: boolean
    finisherSuppressed: boolean
    densityReduced: boolean
    secondaryTrimmed: boolean
  }
  /** Session-level prescription changes */
  sessionChanges: Array<{
    sessionIndex: number
    dayLabel: string
    changesApplied: string[]
  }>
  /** Human-readable summary */
  summary: string
  /** Source of this data */
  source: 'session_audit' | 'week_adaptation' | 'unavailable'
}

/**
 * Extract prescription propagation display from program sessions
 * This reflects what was ACTUALLY changed in generation, not just planned
 */
export function getPrescriptionPropagationDisplay(program: AdaptiveProgram): PrescriptionPropagationDisplay {
  const sessions = program.sessions || []
  
  // Check if any sessions have prescription propagation audit
  const sessionChanges: PrescriptionPropagationDisplay['sessionChanges'] = []
  let anyMateriallyChanged = false
  let anySetsReduced = false
  let anyRpeReduced = false
  let anyFinisherSuppressed = false
  let anyDensityReduced = false
  let anySecondaryTrimmed = false
  
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i] as { 
      dayLabel?: string
      prescriptionPropagationAudit?: {
        appliedReductions?: {
          setsReduced?: boolean
          rpeReduced?: boolean
          finisherSuppressed?: boolean
          densityReduced?: boolean
          secondaryTrimmed?: boolean
        }
        verdict?: string
      }
    }
    
    const audit = session.prescriptionPropagationAudit
    if (!audit) continue
    
    const changes: string[] = []
    
    if (audit.appliedReductions?.setsReduced) {
      changes.push('Sets reduced')
      anySetsReduced = true
    }
    if (audit.appliedReductions?.rpeReduced) {
      changes.push('RPE capped')
      anyRpeReduced = true
    }
    if (audit.appliedReductions?.finisherSuppressed) {
      changes.push('Finisher omitted')
      anyFinisherSuppressed = true
    }
    if (audit.appliedReductions?.densityReduced) {
      changes.push('Density reduced')
      anyDensityReduced = true
    }
    if (audit.appliedReductions?.secondaryTrimmed) {
      changes.push('Secondary work trimmed')
      anySecondaryTrimmed = true
    }
    
    if (changes.length > 0) {
      anyMateriallyChanged = true
      sessionChanges.push({
        sessionIndex: i,
        dayLabel: session.dayLabel || `Day ${i + 1}`,
        changesApplied: changes,
      })
    }
  }
  
  // Build summary
  let summary = 'Standard prescription applied'
  if (anyMateriallyChanged) {
    const parts: string[] = []
    if (anySetsReduced) parts.push('reduced sets')
    if (anyRpeReduced) parts.push('capped intensity')
    if (anyFinisherSuppressed) parts.push('limited finishers')
    if (anyDensityReduced) parts.push('reduced density')
    if (anySecondaryTrimmed) parts.push('trimmed secondary')
    summary = `Conservative dosage: ${parts.join(', ')}`
  }
  
  return {
    materiallyChanged: anyMateriallyChanged,
    appliedChanges: {
      setsReduced: anySetsReduced,
      rpeReduced: anyRpeReduced,
      finisherSuppressed: anyFinisherSuppressed,
      densityReduced: anyDensityReduced,
      secondaryTrimmed: anySecondaryTrimmed,
    },
    sessionChanges,
    summary,
    source: sessionChanges.length > 0 ? 'session_audit' : 'unavailable',
  }
}

// =============================================================================
// [SESSION-CARD-SURFACE] AUTHORITATIVE PER-CARD DISPLAY CONTRACT
// One compact shape that feeds the day card UI with differentiated identity
// Prevents all cards from looking identical when session metadata differs
// =============================================================================

export interface SessionCardSurface {
  /** One clear session identity headline e.g. "Planche volume build" */
  sessionHeadline: string
  /** Optional subheadline for additional context */
  sessionSubheadline: string | null
  /** 1-3 small truth chips pulled from real metadata only */
  primaryIntentChips: string[]
  /** Protection/constraint signals if active */
  protectionSignals: string[]
  /** Method signals (density, supersets, etc) */
  methodSignals: string[]
  /** One short evidence/support line when available */
  evidenceLabel: string | null
  /** Key for detecting near-duplicate card surfaces */
  repetitionKey: string
  /** Source marker for debugging */
  source: 'authoritative' | 'fallback_minimal'
}

/**
 * Build a compact session card surface from session metadata.
 * This is the SINGLE owner of per-card identity display.
 * Uses authoritative metadata first, minimal fallbacks only when unavailable.
 */
export function buildSessionCardSurface(
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
  weekContext: {
    isFirstWeek?: boolean
    adaptationPhase?: string
    totalSessions: number
    primaryGoal: string
    secondaryGoal?: string | null
  }
): SessionCardSurface {
  const prescriptionAudit = session.prescriptionPropagationAudit
  const composition = session.compositionMetadata
  const skillMeta = session.skillExpressionMetadata
  const styleMeta = session.styleMetadata
  
  const primaryIntentChips: string[] = []
  const protectionSignals: string[] = []
  const methodSignals: string[] = []
  let evidenceLabel: string | null = null
  let source: SessionCardSurface['source'] = 'fallback_minimal'
  
  // ==========================================================================
  // A. Build session headline from authoritative metadata
  // ==========================================================================
  let sessionHeadline = ''
  let sessionSubheadline: string | null = null
  
  // Priority 1: skillExpressionMetadata.sessionIdentityReason (most specific)
  if (skillMeta?.sessionIdentityReason) {
    sessionHeadline = skillMeta.sessionIdentityReason.split('.')[0]
    if (sessionHeadline.length > 45) {
      sessionHeadline = sessionHeadline.substring(0, 42) + '...'
    }
    source = 'authoritative'
  }
  // Priority 2: compositionMetadata.sessionIntent
  else if (composition?.sessionIntent) {
    sessionHeadline = composition.sessionIntent.split('.')[0]
    if (sessionHeadline.length > 45) {
      sessionHeadline = sessionHeadline.substring(0, 42) + '...'
    }
    source = 'authoritative'
  }
  // Priority 3: session.rationale
  else if (session.rationale) {
    sessionHeadline = session.rationale.split('.')[0]
    source = 'authoritative'
  }
  // Priority 4: Build from focus + goal context
  else if (session.focusLabel || session.focus) {
    const focusBase = (session.focusLabel || session.focus || '').toLowerCase()
    const primaryGoalName = weekContext.primaryGoal?.replace(/_/g, ' ') || 'skill'
    
    if (focusBase.includes('push') && weekContext.primaryGoal?.includes('planche')) {
      sessionHeadline = 'Planche-focused push session'
    } else if (focusBase.includes('pull') && weekContext.primaryGoal?.includes('lever')) {
      sessionHeadline = 'Lever-focused pull session'
    } else if (focusBase.includes('push')) {
      sessionHeadline = `Push emphasis with ${primaryGoalName} support`
    } else if (focusBase.includes('pull')) {
      sessionHeadline = `Pull emphasis with ${primaryGoalName} support`
    } else if (focusBase.includes('skill')) {
      sessionHeadline = `${primaryGoalName.charAt(0).toUpperCase() + primaryGoalName.slice(1)} skill work`
    } else if (focusBase.includes('strength')) {
      sessionHeadline = 'Foundational strength session'
    } else if (focusBase.includes('support') || focusBase.includes('recovery')) {
      sessionHeadline = 'Recovery-integrated support session'
    } else if (session.isPrimary) {
      sessionHeadline = `Primary ${primaryGoalName} session`
    } else {
      sessionHeadline = session.focusLabel || session.focus || 'Training session'
    }
  }
  // Priority 5: Minimal fallback
  else {
    sessionHeadline = session.isPrimary 
      ? `Primary session (Day ${session.dayNumber})`
      : `Support session (Day ${session.dayNumber})`
  }
  
  // ==========================================================================
  // B. Build primary intent chips from real metadata
  // ==========================================================================
  
  // From compositionMetadata.workloadDistribution
  if (composition?.workloadDistribution?.primaryWorkPercent) {
    if (composition.workloadDistribution.primaryWorkPercent >= 70) {
      primaryIntentChips.push('Primary focus preserved')
      source = 'authoritative'
    } else if (composition.workloadDistribution.primaryWorkPercent >= 50) {
      primaryIntentChips.push('Balanced distribution')
    }
  }
  
  // From spineSessionType (skill expression mode)
  if (composition?.spineSessionType === 'direct_intensity') {
    primaryIntentChips.push('Direct intensity')
    source = 'authoritative'
  } else if (composition?.spineSessionType === 'technical_focus') {
    primaryIntentChips.push('Technical focus')
    source = 'authoritative'
  } else if (composition?.spineSessionType === 'strength_support') {
    primaryIntentChips.push('Strength support')
    source = 'authoritative'
  }
  
  // From directly expressed skills
  if (skillMeta?.directlyExpressedSkills?.length) {
    const primarySkill = skillMeta.directlyExpressedSkills[0]?.replace(/_/g, ' ')
    if (primarySkill && !primaryIntentChips.some(c => c.toLowerCase().includes(primarySkill.toLowerCase()))) {
      primaryIntentChips.push(`${primarySkill.charAt(0).toUpperCase() + primarySkill.slice(1)} expressed`)
      source = 'authoritative'
    }
  }
  
  // ==========================================================================
  // C. Build protection signals from prescription propagation audit
  // ==========================================================================
  if (prescriptionAudit?.appliedReductions) {
    const reductions = prescriptionAudit.appliedReductions
    
    if (reductions.finisherSuppressed) {
      protectionSignals.push('Finisher blocked')
      source = 'authoritative'
    }
    if (reductions.rpeReduced) {
      protectionSignals.push('Intensity capped')
      source = 'authoritative'
    }
    if (reductions.setsReduced) {
      protectionSignals.push('Volume reduced')
      source = 'authoritative'
    }
    if (reductions.secondaryTrimmed) {
      protectionSignals.push('Secondary trimmed')
      source = 'authoritative'
    }
    if (reductions.densityReduced) {
      protectionSignals.push('Density limited')
      source = 'authoritative'
    }
  }
  
  // From method eligibility (blocked methods)
  if (composition?.methodEligibility?.finisher === 'blocked' && !protectionSignals.includes('Finisher blocked')) {
    protectionSignals.push('Finisher blocked')
    source = 'authoritative'
  }
  if (composition?.methodEligibility?.density === 'blocked') {
    protectionSignals.push('Density blocked')
    source = 'authoritative'
  }
  
  // ==========================================================================
  // D. Build method signals from style metadata
  // ==========================================================================
  if (styleMeta?.hasDensityApplied) {
    methodSignals.push('Density applied')
    source = 'authoritative'
  }
  if (styleMeta?.hasSupersetsApplied) {
    methodSignals.push('Supersets active')
    source = 'authoritative'
  }
  if (styleMeta?.hasCircuitsApplied) {
    methodSignals.push('Circuits active')
    source = 'authoritative'
  }
  
  // [PHASE-RECONNECT] Surface straight-sets structure when no special methods applied
  // This ensures every session has visible structural identity, not just those with supersets/circuits
  if (styleMeta && methodSignals.length === 0) {
    // Check if there's a structure description that tells us something useful
    const structureDesc = styleMeta.structureDescription || ''
    if (structureDesc.includes('straight sets') || styleMeta.primaryStyle === 'straight_sets') {
      methodSignals.push('Straight sets')
    } else if (structureDesc.includes('cluster')) {
      methodSignals.push('Cluster sets')
    } else if (structureDesc) {
      // Use the structure description if available
      const shortDesc = structureDesc.split(',')[0].trim()
      if (shortDesc && shortDesc.length <= 25) {
        methodSignals.push(shortDesc.charAt(0).toUpperCase() + shortDesc.slice(1))
      }
    }
    // Mark as authoritative since we have styleMetadata
    if (methodSignals.length > 0) {
      source = 'authoritative'
    }
  }
  
  // ==========================================================================
  // E. Build evidence label from week context
  // ==========================================================================
  if (weekContext.isFirstWeek || prescriptionAudit?.adaptationPhase === 'initial_acclimation') {
    evidenceLabel = 'Week-1 conservative dosage applied'
    source = 'authoritative'
  } else if (prescriptionAudit?.adaptationPhase === 'recovery_constrained') {
    evidenceLabel = 'Recovery-protected structure'
  } else if (source === 'authoritative' && protectionSignals.length === 0) {
    evidenceLabel = 'Built from profile + doctrine'
  }
  
  // [PHASE-RECONNECT] Ensure evidence label shows even for standard sessions
  // If we have authoritative session metadata but no special conditions, still show baseline evidence
  if (!evidenceLabel && (composition || skillMeta || styleMeta)) {
    source = 'authoritative'
    evidenceLabel = 'Built from profile + doctrine'
  }
  
  // ==========================================================================
  // F. Build repetition key for duplicate detection
  // ==========================================================================
  const repetitionKey = [
    sessionHeadline.toLowerCase().substring(0, 20),
    primaryIntentChips.slice(0, 2).join('-'),
    protectionSignals.slice(0, 1).join('-'),
    session.dayNumber,
  ].filter(Boolean).join('|')
  
  return {
    sessionHeadline,
    sessionSubheadline,
    primaryIntentChips: primaryIntentChips.slice(0, 3),
    protectionSignals: protectionSignals.slice(0, 3),
    methodSignals: methodSignals.slice(0, 2),
    evidenceLabel,
    repetitionKey,
    source,
  }
}

/**
 * Build session card surfaces for all sessions in a program.
 * Handles deduplication by adding differentiating context when cards would look identical.
 */
export function buildAllSessionCardSurfaces(
  sessions: Array<Parameters<typeof buildSessionCardSurface>[0]>,
  weekContext: Parameters<typeof buildSessionCardSurface>[1]
): SessionCardSurface[] {
  const surfaces = sessions.map(session => buildSessionCardSurface(session, weekContext))
  
  // Detect near-duplicate surfaces and differentiate them
  const keyGroups = new Map<string, number[]>()
  surfaces.forEach((surface, idx) => {
    const baseKey = surface.repetitionKey.split('|').slice(0, 2).join('|')
    if (!keyGroups.has(baseKey)) {
      keyGroups.set(baseKey, [])
    }
    keyGroups.get(baseKey)!.push(idx)
  })
  
  // For groups with duplicates, add differentiating context
  keyGroups.forEach((indices) => {
    if (indices.length > 1) {
      indices.forEach((idx, groupPosition) => {
        const session = sessions[idx]
        const surface = surfaces[idx]
        
        // Add day position context to subheadline
        if (!surface.sessionSubheadline) {
          const dayContext = session.isPrimary
            ? `Primary session #${groupPosition + 1}`
            : `Support session (Day ${session.dayNumber})`
          surface.sessionSubheadline = dayContext
        }
        
        // Try to add a differentiating chip from available metadata
        if (surface.primaryIntentChips.length < 3) {
          const skillMeta = session.skillExpressionMetadata
          if (skillMeta?.technicalSlotSkills?.length) {
            const techSlot = skillMeta.technicalSlotSkills[0]?.replace(/_/g, ' ')
            if (techSlot && !surface.primaryIntentChips.some(c => c.toLowerCase().includes(techSlot.toLowerCase()))) {
              surface.primaryIntentChips.push(`${techSlot} slot`)
            }
          }
        }
      })
    }
  })
  
  return surfaces
}

// =============================================================================
// [SURFACE-SIGNALS] PROGRAM AND SESSION SURFACE INTELLIGENCE
// Compact signals for main card and day card display without modal
// =============================================================================

export interface ProgramSurfaceSignals {
  /** Compact signals for program card intelligence strip */
  signals: string[]
  /** Primary dosage message if protective week */
  dosageMessage: string | null
  /** Whether this week has conservative/protective measures */
  isProtectiveWeek: boolean
  /** Source of signals */
  source: 'prescription_propagation' | 'week_adaptation' | 'generation_truth' | 'unavailable'
}

/**
 * Get program-level surface signals for compact intelligence display
 * Surfaces real generation decisions without needing to open the modal
 */
export function getProgramSurfaceSignals(program: AdaptiveProgram): ProgramSurfaceSignals {
  const signals: string[] = []
  let dosageMessage: string | null = null
  let isProtectiveWeek = false
  let source: ProgramSurfaceSignals['source'] = 'unavailable'
  
  // Check prescription propagation first (most authoritative)
  const prescriptionDisplay = getPrescriptionPropagationDisplay(program)
  if (prescriptionDisplay.materiallyChanged) {
    source = 'prescription_propagation'
    isProtectiveWeek = true
    
    if (prescriptionDisplay.appliedChanges.setsReduced) {
      signals.push('Volume reduced for acclimation')
    }
    if (prescriptionDisplay.appliedChanges.rpeReduced) {
      signals.push('Intensity capped')
    }
    if (prescriptionDisplay.appliedChanges.finisherSuppressed) {
      signals.push('Finishers limited')
    }
    if (prescriptionDisplay.appliedChanges.densityReduced) {
      signals.push('Density reduced')
    }
    if (prescriptionDisplay.appliedChanges.secondaryTrimmed) {
      signals.push('Secondary work simplified')
    }
    
    dosageMessage = prescriptionDisplay.summary
  }
  
  // Fall back to week adaptation decision
  const weekAdaptation = getWeekAdaptationDisplay(program)
  if (weekAdaptation.source !== 'unavailable') {
    if (source === 'unavailable') source = 'week_adaptation'
    
    if (weekAdaptation.isFirstWeekProtected && !signals.some(s => s.includes('acclimation'))) {
      signals.push('First-week protection active')
      isProtectiveWeek = true
    }
    
    if (weekAdaptation.isProtective && !isProtectiveWeek) {
      isProtectiveWeek = true
      if (weekAdaptation.phaseLabel === 'Recovery Priority') {
        signals.push('Recovery-protected workload')
      } else if (weekAdaptation.phaseLabel === 'Rebuilding Phase') {
        signals.push('Rebuilding after disruption')
      }
    }
    
    // Add doctrine constraints if present
    if (weekAdaptation.doctrineConstraints.length > 0) {
      const constraint = weekAdaptation.doctrineConstraints[0]
      if (!signals.some(s => s.toLowerCase().includes(constraint.toLowerCase().split(' ')[0]))) {
        signals.push(constraint)
      }
    }
    
    if (!dosageMessage && weekAdaptation.loadSummary && weekAdaptation.loadSummary !== 'Standard load') {
      dosageMessage = weekAdaptation.loadSummary
    }
  }
  
  // Add generation truth signals if available
  const genTruth = program.generationTruthSnapshot
  if (genTruth?.weekAdaptationDecisionAudit) {
    if (source === 'unavailable') source = 'generation_truth'
    const audit = genTruth.weekAdaptationDecisionAudit
    
    if (audit.loadStrategy?.straightArmExposureBias === 'protected' && 
        !signals.some(s => s.toLowerCase().includes('straight-arm'))) {
      signals.push('Straight-arm stress managed')
    }
    
    if (audit.loadStrategy?.finisherBias === 'limited' && 
        !signals.some(s => s.toLowerCase().includes('finisher'))) {
      signals.push('Finisher work limited')
    }
  }
  
  return {
    signals: signals.slice(0, 4), // Max 4 signals for cleanliness
    dosageMessage,
    isProtectiveWeek,
    source,
  }
}

export interface SessionSurfaceSignals {
  /** One-line session intent */
  intentLine: string | null
  /** Micro-signals (1-2 items) */
  microSignals: string[]
  /** Whether this session has prescription changes */
  hasPrescriptionChanges: boolean
  /** Source of signals */
  source: 'prescription_audit' | 'composition_metadata' | 'inferred' | 'unavailable'
}

/**
 * Get session-level surface signals for day card display
 * Surfaces real session-specific generation decisions
 */
export function getSessionSurfaceSignals(
  session: {
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
      sessionPurpose?: string
      sessionIdentityReason?: string
    }
    isPrimary?: boolean
    focus?: string
    focusLabel?: string
  }
): SessionSurfaceSignals {
  const microSignals: string[] = []
  let intentLine: string | null = null
  let hasPrescriptionChanges = false
  let source: SessionSurfaceSignals['source'] = 'unavailable'
  
  const audit = session.prescriptionPropagationAudit
  const comp = session.compositionMetadata
  const skill = session.skillExpressionMetadata
  
  // Check prescription audit first
  if (audit?.appliedReductions) {
    const reductions = audit.appliedReductions
    if (reductions.setsReduced || reductions.rpeReduced || reductions.finisherSuppressed || reductions.densityReduced || reductions.secondaryTrimmed) {
      hasPrescriptionChanges = true
      source = 'prescription_audit'
      
      if (reductions.setsReduced && reductions.rpeReduced) {
        microSignals.push('Volume and intensity managed')
      } else if (reductions.setsReduced) {
        microSignals.push('Volume adjusted')
      } else if (reductions.rpeReduced) {
        microSignals.push('Intensity capped')
      }
      
      if (reductions.finisherSuppressed) {
        microSignals.push('Finisher omitted')
      }
      
      if (reductions.secondaryTrimmed) {
        microSignals.push('Focused on primary work')
      }
      
      // Build intent from adaptation phase
      if (audit.adaptationPhase === 'initial_acclimation') {
        intentLine = 'Conservative dosage for week 1 acclimation'
      } else if (audit.adaptationPhase === 'recovery_constrained') {
        intentLine = 'Recovery-protected session'
      }
    }
  }
  
  // Fall back to composition metadata
  if (!intentLine && comp) {
    if (source === 'unavailable') source = 'composition_metadata'
    
    if (comp.sessionIntent) {
      intentLine = comp.sessionIntent.split('.')[0]
      if (intentLine.length > 60) {
        intentLine = intentLine.substring(0, 57) + '...'
      }
    }
    
    // Add workload distribution insight
    if (comp.workloadDistribution?.primaryWorkPercent && comp.workloadDistribution.primaryWorkPercent >= 70) {
      if (!microSignals.some(s => s.includes('primary'))) {
        microSignals.push('Primary focus preserved')
      }
    }
    
    // Add method eligibility insight
    if (comp.methodEligibility?.finisher === 'blocked' && !microSignals.some(s => s.includes('Finisher'))) {
      microSignals.push('Finisher blocked')
    }
  }
  
  // Fall back to skill expression metadata
  if (!intentLine && skill?.sessionIdentityReason) {
    if (source === 'unavailable') source = 'inferred'
    intentLine = skill.sessionIdentityReason.split('.')[0]
    if (intentLine.length > 60) {
      intentLine = intentLine.substring(0, 57) + '...'
    }
  }
  
  // Final fallback to session focus
  if (!intentLine && session.isPrimary) {
    if (source === 'unavailable') source = 'inferred'
    const focus = session.focusLabel || session.focus || ''
    intentLine = focus ? `Primary ${focus.toLowerCase()} session` : 'Primary skill session'
  }
  
  return {
    intentLine,
    microSignals: microSignals.slice(0, 2), // Max 2 micro-signals
    hasPrescriptionChanges,
    source,
  }
}

// =============================================================================
// [NEON-TRUTH-CONTRACT] SOURCE TRUTH DISPLAY TYPES
// =============================================================================

export interface SourceTruthDisplay {
  /** Quality label e.g. "Comprehensive Data", "Good Data Coverage" */
  qualityLabel: string
  /** Quality level */
  quality: 'strong' | 'usable' | 'partial' | 'weak' | 'unavailable'
  /** Breakdown string e.g. "5/7 data sources" */
  breakdown: string
  /** Available domain count */
  availableCount: number
  /** Total domain count */
  totalCount: number
  /** Key influence summaries */
  influenceSummary: string[]
  /** Was Neon DB available */
  dbAvailable: boolean
  /** Source of this data */
  source: 'generationTruthSnapshot' | 'unavailable'
}

/**
 * Extract source truth display from program
 */
export function getSourceTruthDisplay(program: AdaptiveProgram): SourceTruthDisplay {
  const snapshot = program.generationTruthSnapshot
  
  // Try to get from authoritativeTruthIngestionAudit
  const audit = snapshot?.authoritativeTruthIngestionAudit
  
  if (audit) {
    const qualityLabels: Record<string, string> = {
      strong: 'Comprehensive Data',
      usable: 'Good Data Coverage',
      partial: 'Partial Data',
      weak: 'Limited Data',
      missing: 'Minimal Data',
    }
    
    // Build influence summary from available audit data
    const influenceSummary: string[] = []
    if (audit.isFirstWeek) {
      influenceSummary.push('First week - acclimation protection')
    }
    if (audit.doctrineInfluenceEligible) {
      influenceSummary.push('Doctrine rules active')
    }
    if (audit.recoveryRisk === 'high') {
      influenceSummary.push('High recovery risk detected')
    }
    if (audit.consistencyStatus === 'disrupted') {
      influenceSummary.push('Disrupted adherence pattern')
    }
    
    return {
      qualityLabel: qualityLabels[audit.overallQuality] || 'Unknown',
      quality: (audit.overallQuality as SourceTruthDisplay['quality']) || 'unavailable',
      breakdown: `${audit.domainQualities ? Object.values(audit.domainQualities).filter(q => q !== 'missing').length : 0}/6 signal domains`,
      availableCount: audit.domainQualities ? Object.values(audit.domainQualities).filter(q => q !== 'missing').length : 0,
      totalCount: 6,
      influenceSummary,
      dbAvailable: true, // If we have audit data, DB was available
      source: 'generationTruthSnapshot',
    }
  }
  
  // Unavailable
  return {
    qualityLabel: 'Unknown',
    quality: 'unavailable',
    breakdown: 'Source data not available',
    availableCount: 0,
    totalCount: 6,
    influenceSummary: [],
    dbAvailable: false,
    source: 'unavailable',
  }
}

export interface WeeklyDistributionDisplay {
  /** Total sessions this week */
  totalSessions: number
  /** Session distribution by category */
  distribution: SessionDistributionEntry[]
  /** Primary skill exposure sessions */
  primarySkillSessions: number
  /** Strength/support sessions */
  strengthSupportSessions: number
  /** Has density work */
  hasDensityWork: boolean
  /** Density sessions count */
  densitySessions: number
  /** Source of distribution data */
  source: string
}

export interface WeeklyProtectionDisplay {
  /** What is being protected this week */
  protectedAreas: Array<{
    label: string
    reason: string
    isActive: boolean
  }>
  /** Density cap status */
  densityCapActive: boolean
  densityCapReason: string | null
  /** Volume limitation status */
  volumeLimited: boolean
  volumeLimitReason: string | null
  /** Source of protection data */
  source: string
}

export interface WeeklyDecisionSummaryDisplay {
  /** Short headline for why this week looks like this */
  headline: string
  /** Key decision bullets */
  decisions: string[]
  /** Session bias description */
  sessionBias: string
  /** Secondary handling summary */
  secondaryHandling: string
  /** What is intentionally limited */
  intentionalLimits: string[]
  /** Source of decision data */
  source: string
}

// =============================================================================
// EXERCISE PRESCRIPTION TYPES
// =============================================================================

export interface ExerciseRoleSummary {
  /** Exercise family name (e.g., "Front Lever Pulls", "Planche Leans") */
  familyName: string
  /** Role: 'primary_driver' | 'support_carryover' | 'accessory' | 'density' | 'constrained' */
  role: 'primary_driver' | 'support_carryover' | 'accessory' | 'density' | 'constrained'
  /** What this exercise family is doing */
  purposeSummary: string
  /** Session frequency this week */
  sessionCount: number
  /** If constrained, why */
  constraintReason?: string
}

export interface DosageIntentDisplay {
  /** Overall dosage style label */
  styleLabel: string
  /** Primary intent: 'skill_expression' | 'strength_building' | 'volume_accumulation' | 'tissue_prep' */
  primaryIntent: string
  /** Key dosage characteristics */
  characteristics: string[]
  /** What is intentionally limited */
  limitedAspects: string[]
  /** Source of dosage data */
  source: string
}

export interface NotablePrescriptionDecision {
  /** Decision description */
  decision: string
  /** Why this was chosen */
  reason: string
  /** Category: 'selection' | 'dosage' | 'frequency' | 'interference' | 'progression' */
  category: 'selection' | 'dosage' | 'frequency' | 'interference' | 'progression'
}

export interface ExercisePrescriptionDisplay {
  /** Primary driver exercises summary */
  primaryDrivers: ExerciseRoleSummary[]
  /** Support/carryover exercises summary */
  supportWork: ExerciseRoleSummary[]
  /** Constrained/limited exercises summary */
  constrainedWork: ExerciseRoleSummary[]
  /** Overall dosage intent */
  dosageIntent: DosageIntentDisplay
  /** Notable prescription decisions */
  notableDecisions: NotablePrescriptionDecision[]
  /** Total exercise count */
  totalExercises: number
  /** Unique exercise families */
  uniqueFamilies: number
  /** Source of prescription data */
  source: string
}

// =============================================================================
// SESSION MAP TYPES
// =============================================================================

export interface SessionMapEntry {
  /** Session day number */
  dayNumber: number
  /** Session day label (e.g., "Day 1", "Session A") */
  dayLabel: string
  /** Primary focus of the session */
  primaryFocus: string
  /** Secondary emphasis if present */
  secondaryEmphasis: string | null
  /** Intent category: 'skill_acquisition' | 'strength_building' | 'mixed' | 'support' | 'density' | 'recovery' */
  intentCategory: 'skill_acquisition' | 'strength_building' | 'mixed' | 'support' | 'density' | 'recovery'
  /** Is this a primary skill session */
  isPrimary: boolean
  /** Short architecture summary */
  architectureSummary: string
  /** Constraint flags if any */
  constraintFlags: string[]
  /** Estimated duration in minutes */
  estimatedMinutes: number
  /** Skills directly expressed */
  directSkills: string[]
  /** Training style applied */
  trainingStyle: string | null
}

export interface WeekSessionMapDisplay {
  /** Total sessions in the week */
  totalSessions: number
  /** Session entries in order */
  sessions: SessionMapEntry[]
  /** Week flow description */
  weekFlow: string
  /** Primary skill sessions count */
  primarySessionCount: number
  /** Support/mixed sessions count */
  supportSessionCount: number
  /** Has density work */
  hasDensityWork: boolean
  /** Source of session map data */
  source: string
}

// =============================================================================
// [DECISION-EVIDENCE-DISPLAY-CONTRACT] DAY RATIONALE TYPES
// =============================================================================

export interface DayRationaleDisplay {
  /** Day number (1-7) */
  dayNumber: number
  /** Day label (e.g. "Day 1", "Session A") */
  dayLabel: string
  /** Primary role in weekly architecture */
  weeklyRole: string
  /** Why this day exists in the plan */
  rationale: string
  /** What this day prioritizes */
  prioritizes: string[]
  /** What this day protects/limits */
  protectsOrLimits: string[]
  /** Source of rationale */
  source: 'session_metadata' | 'weekly_architecture' | 'inferred' | 'unavailable'
}

/**
 * Build day rationale from session and weekly context
 */
export function buildDayRationale(
  session: {
    dayNumber: number
    dayLabel?: string
    rationale?: string
    focus?: string
    focusLabel?: string
    isPrimary?: boolean
    skillExpressionMetadata?: {
      directlyExpressedSkills?: string[]
      technicalSlotSkills?: string[]
    }
  },
  weekContext: {
    totalSessions: number
    primaryGoal: string
    secondaryGoal?: string | null
    trainingSpine?: string
  }
): DayRationaleDisplay {
  const dayNumber = session.dayNumber
  const dayLabel = session.dayLabel || `Day ${dayNumber}`
  const isPrimary = session.isPrimary ?? false
  const focusLabel = session.focusLabel || session.focus || ''
  const skillMeta = session.skillExpressionMetadata
  
  // Build weekly role based on position and type
  let weeklyRole = 'Training support'
  if (isPrimary && dayNumber === 1) {
    weeklyRole = 'Week opener: primary skill emphasis'
  } else if (isPrimary && dayNumber <= 2) {
    weeklyRole = 'Early-week skill driver'
  } else if (isPrimary) {
    weeklyRole = 'Mid/late-week skill reinforcement'
  } else if (focusLabel.toLowerCase().includes('support') || focusLabel.toLowerCase().includes('strength')) {
    weeklyRole = 'Strength and recovery support'
  } else if (focusLabel.toLowerCase().includes('density') || focusLabel.toLowerCase().includes('conditioning')) {
    weeklyRole = 'Conditioning and work capacity'
  } else {
    weeklyRole = 'Balanced training support'
  }
  
  // Build rationale
  let rationale = session.rationale || ''
  if (!rationale) {
    if (isPrimary && dayNumber <= 2) {
      rationale = `Drives ${weekContext.primaryGoal?.replace(/_/g, ' ')} progression when recovery is highest.`
    } else if (isPrimary) {
      rationale = `Reinforces ${weekContext.primaryGoal?.replace(/_/g, ' ')} skill work with accumulated fatigue management.`
    } else if (weekContext.secondaryGoal) {
      rationale = `Maintains ${weekContext.secondaryGoal?.replace(/_/g, ' ')} exposure without interfering with primary focus.`
    } else {
      rationale = `Supports overall strength development and connective tissue tolerance.`
    }
  }
  
  // Build prioritizes list
  const prioritizes: string[] = []
  if (skillMeta?.directlyExpressedSkills?.length) {
    prioritizes.push(...skillMeta.directlyExpressedSkills.map(s => s.replace(/_/g, ' ')))
  } else if (isPrimary && weekContext.primaryGoal) {
    prioritizes.push(weekContext.primaryGoal.replace(/_/g, ' '))
  }
  if (focusLabel.toLowerCase().includes('strength')) {
    prioritizes.push('foundational strength')
  }
  
  // Build protects list
  const protectsOrLimits: string[] = []
  if (!isPrimary && weekContext.primaryGoal) {
    protectsOrLimits.push(`recovery for ${weekContext.primaryGoal.replace(/_/g, ' ')}`)
  }
  if (dayNumber > 4) {
    protectsOrLimits.push('late-week fatigue accumulation')
  }
  
  return {
    dayNumber,
    dayLabel,
    weeklyRole,
    rationale: rationale.split('.')[0] + '.',
    prioritizes: prioritizes.slice(0, 2),
    protectsOrLimits: protectsOrLimits.slice(0, 2),
    source: session.rationale ? 'session_metadata' : 'inferred',
  }
}

// =============================================================================
// [DECISION-EVIDENCE-DISPLAY-CONTRACT] STRATEGIC SUMMARY TYPES
// =============================================================================

export interface StrategicSummaryDisplay {
  /** Strategic headline - the core decision */
  headline: string
  /** Architecture label (cleaner than "Spine Spine") */
  architectureLabel: string
  /** Primary outcome being optimized */
  primaryOutcome: string
  /** Why this architecture fits the user */
  fitReason: string
  /** Decision confidence label */
  confidenceLabel: string
  /** Source of this summary */
  source: string
}

/**
 * Build strategic summary from program intelligence
 */
export function buildStrategicSummary(program: AdaptiveProgram): StrategicSummaryDisplay {
  const dominantSpine = (program as unknown as { dominantSpineResolution?: {
    primarySpine?: string
    spineRationale?: string
  } }).dominantSpineResolution
  
  const trainingPathType = (program as unknown as { trainingPathType?: string }).trainingPathType
  const primaryGoal = program.primaryGoal
  const secondaryGoal = program.secondaryGoal
  const sessionCount = program.sessions?.length || 4
  const experienceLevel = program.experienceLevel
  
  // Build architecture label (avoid "Spine Spine" repetition)
  let architectureLabel = 'Adaptive Training'
  if (dominantSpine?.primarySpine) {
    const spineBase = dominantSpine.primarySpine
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    // Avoid "Skill Strength Spine Spine"
    if (spineBase.toLowerCase().includes('spine')) {
      architectureLabel = spineBase
    } else {
      architectureLabel = `${spineBase} Architecture`
    }
  } else if (trainingPathType) {
    architectureLabel = trainingPathType === 'skill_progression' 
      ? 'Skill-First Architecture'
      : trainingPathType === 'strength_endurance'
      ? 'Strength-Endurance Architecture'
      : 'Hybrid Architecture'
  }
  
  // Build headline
  const primaryName = primaryGoal?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'your goals'
  const headline = secondaryGoal
    ? `Engineered for ${primaryName} mastery with ${secondaryGoal.replace(/_/g, ' ')} integration`
    : `Engineered for ${primaryName} mastery`
  
  // Build primary outcome
  let primaryOutcome = `Progressive ${primaryName} development`
  if (trainingPathType === 'skill_progression') {
    primaryOutcome = `Skill acquisition through deliberate ${primaryName} practice`
  } else if (trainingPathType === 'strength_endurance') {
    primaryOutcome = `Strength-endurance foundation supporting ${primaryName}`
  }
  
  // Build fit reason
  let fitReason = `${sessionCount}-day structure optimized for ${experienceLevel || 'your'} level`
  if (dominantSpine?.spineRationale) {
    fitReason = dominantSpine.spineRationale.split('.')[0]
  }
  
  // Confidence label
  const sourceMap = program.generationTruthSnapshot?.generationSourceMap
  let confidenceLabel = 'Standard confidence'
  if (sourceMap?.overallQuality === 'strong') {
    confidenceLabel = 'High confidence'
  } else if (sourceMap?.overallQuality === 'usable') {
    confidenceLabel = 'Good confidence'
  } else if (sourceMap?.overallQuality === 'partial') {
    confidenceLabel = 'Moderate confidence'
  } else if (sourceMap?.overallQuality === 'weak') {
    confidenceLabel = 'Conservative defaults applied'
  }
  
  return {
    headline,
    architectureLabel,
    primaryOutcome,
    fitReason,
    confidenceLabel,
    source: dominantSpine ? 'dominantSpineResolution' : 'inferred',
  }
}

// =============================================================================
// [DECISION-EVIDENCE-DISPLAY-CONTRACT] WEEKLY DECISION LOGIC
// =============================================================================

export interface WeeklyDecisionLogicDisplay {
  /** Why this frequency was chosen */
  frequencyReason: string
  /** Why session target landed where it did */
  sessionTargetReason: string
  /** Structure identity (skill-biased, recovery-aware, etc.) */
  structureIdentity: string
  /** Key architectural decisions */
  architecturalDecisions: string[]
  /** What was explicitly NOT done and why */
  explicitExclusions: string[]
  /** Source */
  source: string
}

/**
 * Build weekly decision logic from program
 */
export function buildWeeklyDecisionLogic(program: AdaptiveProgram): WeeklyDecisionLogicDisplay {
  const flexibleRootCause = (program as unknown as { flexibleFrequencyRootCause?: {
    humanReadableReason?: string
    finalReasonCategory?: string
    staticDaysSelected?: number
  } }).flexibleFrequencyRootCause
  
  const scheduleMode = program.scheduleMode
  const sessionCount = program.sessions?.length || 4
  const sessionLength = (program as unknown as { sessionLength?: number }).sessionLength || 60
  const trainingPathType = (program as unknown as { trainingPathType?: string }).trainingPathType
  const weekAdaptation = program.weekAdaptationDecision
  
  // Frequency reason
  let frequencyReason = `${sessionCount} sessions selected to balance training stimulus with recovery`
  if (flexibleRootCause?.humanReadableReason) {
    frequencyReason = flexibleRootCause.humanReadableReason
  } else if (scheduleMode === 'flexible') {
    frequencyReason = 'Adaptive frequency responds to your recovery and consistency'
  }
  
  // Session target reason
  let sessionTargetReason = `~${sessionLength} minutes per session fits your time availability`
  if (sessionLength <= 45) {
    sessionTargetReason = `Compact ${sessionLength}-minute sessions prioritize efficiency over volume`
  } else if (sessionLength >= 75) {
    sessionTargetReason = `Extended ${sessionLength}-minute sessions allow thorough skill work and strength development`
  }
  
  // Structure identity
  let structureIdentity = 'Balanced skill and strength development'
  if (trainingPathType === 'skill_progression') {
    structureIdentity = 'Skill-acquisition biased with strength support'
  } else if (trainingPathType === 'strength_endurance') {
    structureIdentity = 'Strength-endurance foundation with skill integration'
  } else if (weekAdaptation?.phase === 'initial_acclimation') {
    structureIdentity = 'Acclimation-protected conservative dosage'
  } else if (weekAdaptation?.phase === 'recovery_constrained') {
    structureIdentity = 'Recovery-aware reduced volume'
  }
  
  // Architectural decisions
  const architecturalDecisions: string[] = []
  if (weekAdaptation?.firstWeekGovernor?.active) {
    architecturalDecisions.push('First-week protection limits volume and intensity')
  }
  if (weekAdaptation?.loadStrategy?.finisherBias === 'limited') {
    architecturalDecisions.push('Finisher work limited to preserve skill quality')
  }
  if (weekAdaptation?.loadStrategy?.straightArmExposureBias === 'protected') {
    architecturalDecisions.push('Straight-arm volume managed for connective tissue')
  }
  if (sessionCount >= 5) {
    architecturalDecisions.push('High frequency enables more skill exposure')
  }
  if (sessionCount <= 3) {
    architecturalDecisions.push('Lower frequency concentrates training stimulus')
  }
  
  // Explicit exclusions
  const explicitExclusions: string[] = []
  if (weekAdaptation?.firstWeekGovernor?.suppressFinishers) {
    explicitExclusions.push('Finisher circuits suppressed during acclimation')
  }
  if (weekAdaptation?.loadStrategy?.volumeBias === 'reduced') {
    explicitExclusions.push('Volume intentionally reduced for recovery')
  }
  
  return {
    frequencyReason,
    sessionTargetReason,
    structureIdentity,
    architecturalDecisions: architecturalDecisions.slice(0, 4),
    explicitExclusions: explicitExclusions.slice(0, 2),
    source: flexibleRootCause ? 'flexibleFrequencyRootCause' : 'inferred',
  }
}

// =============================================================================
// [DECISION-EVIDENCE-DISPLAY-CONTRACT] CONFIDENCE BLOCK
// =============================================================================

export interface PremiumConfidenceDisplay {
  /** Main confidence label */
  label: string
  /** Sub-label describing source depth */
  sublabel: string
  /** Confidence level */
  level: 'high' | 'moderate' | 'limited'
  /** What signals are strong */
  strongSignals: string[]
  /** What signals are limited */
  limitedSignals: string[]
  /** Source coverage description */
  sourceCoverage: string
}

/**
 * Build premium confidence display from source map
 */
export function buildPremiumConfidence(program: AdaptiveProgram): PremiumConfidenceDisplay {
  const sourceMap = program.generationTruthSnapshot?.generationSourceMap
  const audit = program.generationTruthSnapshot?.authoritativeTruthIngestionAudit
  
  if (!sourceMap && !audit) {
    return {
      label: 'Standard Confidence',
      sublabel: 'Built from profile data',
      level: 'moderate',
      strongSignals: ['profile settings'],
      limitedSignals: ['execution history', 'recovery data'],
      sourceCoverage: 'Profile-based generation',
    }
  }
  
  const strongSignals: string[] = []
  const limitedSignals: string[] = []
  
  // Analyze source map quality
  if (sourceMap) {
    if (sourceMap.profileQuality === 'strong') strongSignals.push('profile data')
    else if (sourceMap.profileQuality === 'weak') limitedSignals.push('profile data')
    
    if (sourceMap.recoveryQuality === 'strong' || sourceMap.recoveryQuality === 'usable') {
      strongSignals.push('recovery signals')
    } else {
      limitedSignals.push('recovery history')
    }
    
    if (sourceMap.adherenceQuality === 'strong' || sourceMap.adherenceQuality === 'usable') {
      strongSignals.push('adherence patterns')
    } else {
      limitedSignals.push('adherence history')
    }
    
    if (sourceMap.executionQuality === 'strong' || sourceMap.executionQuality === 'usable') {
      strongSignals.push('execution data')
    } else {
      limitedSignals.push('execution history')
    }
  }
  
  // Determine level
  let level: PremiumConfidenceDisplay['level'] = 'moderate'
  let label = 'Good Confidence'
  let sublabel = 'Built from available signals'
  
  if (strongSignals.length >= 3) {
    level = 'high'
    label = 'High Confidence'
    sublabel = 'Rich signal coverage informs decisions'
  } else if (strongSignals.length <= 1) {
    level = 'limited'
    label = 'Building Confidence'
    sublabel = 'More training data will refine future programs'
  }
  
  // Add first week note
  if (audit?.isFirstWeek) {
    sublabel = 'First week - conservative dosage applied'
  }
  
  // Source coverage
  const dbSignals = sourceMap?.dbSignalsRead?.length || 0
  const sourceCoverage = dbSignals > 5 
    ? 'Built from stored profile, history, and doctrine'
    : dbSignals > 0
    ? 'Built from profile and available history'
    : 'Built from profile settings'
  
  return {
    label,
    sublabel,
    level,
    strongSignals: strongSignals.slice(0, 3),
    limitedSignals: limitedSignals.slice(0, 2),
    sourceCoverage,
  }
}

// =============================================================================
// SESSION DISPLAY CONTRACT
// =============================================================================

/**
 * Strict session display contract.
 * Canonical source of truth for session-level summary display.
 * Enables instant understanding before reading exercise cards.
 */
export interface SessionDisplayContract {
  // IDENTITY
  sessionHeadline: string               // "Straight-Arm Push Day" or "Upper Body Strength"
  sessionType: 'skill_dominant' | 'strength_dominant' | 'mixed' | 'support' | 'density' | 'recovery'
  
  // PRIMARY OBJECTIVE
  primaryObjective: string              // "Build pressing strength through planche progressions"
  executionPriority: string             // "Focus on form quality over volume"
  
  // WORK DISTRIBUTION (compact)
  primaryWorkLabel: string              // "2 skill blocks" or "3 compound lifts"
  primaryWorkCount: number
  supportWorkLabel: string | null       // "3 accessory exercises" or null
  supportWorkCount: number
  
  // INTENSITY PROFILE
  intensityProfile: 'high_effort' | 'moderate' | 'technique_focused' | 'recovery' | 'volume_density'
  intensityNote: string                 // "RPE 8-9 on main lifts" or "Quality over quantity"
  
  // TRAINING METHOD (if applicable)
  trainingMethod: string | null         // "Supersets" or "Density Blocks" or null
  estimatedMinutes: number
  
  // CAUTION/CONSTRAINT (only if real)
  cautionNote: string | null            // "Volume capped due to recent high load" or null
  
  // SOURCE TRACING
  source: 'composition_metadata' | 'skill_expression' | 'style_metadata' | 'derived'
}

/**
 * Build session display contract from AdaptiveSession.
 * Single canonical source of truth for session-level display.
 */
export function buildSessionDisplayContract(
  session: {
    name?: string
    dayLabel?: string
    focus?: string
    focusLabel?: string
    isPrimary?: boolean
    rationale?: string
    estimatedMinutes?: number
    exercises?: Array<{ category?: string; name?: string; selectionReason?: string }>
    compositionMetadata?: {
      sessionIntent?: string
      sessionComplexity?: string
      spineSessionType?: string
      spineMode?: string
      blockRoles?: string[]
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
    loadSummary?: {
      isOptimal?: boolean
      removed?: string[]
    }
    timeOptimization?: {
      wasOptimized?: boolean
      coachingMessage?: string
    }
  }
): SessionDisplayContract {
  const composition = session.compositionMetadata
  const skillMeta = session.skillExpressionMetadata
  const styleMeta = session.styleMetadata
  const exercises = session.exercises || []
  
  // Count exercise categories
  const skillCount = exercises.filter(e => e.category === 'skill').length
  const strengthCount = exercises.filter(e => e.category === 'strength').length
  const accessoryCount = exercises.filter(e => e.category === 'accessory' || e.category === 'core').length
  
  // Determine session type
  let sessionType: SessionDisplayContract['sessionType'] = 'mixed'
  const spineType = composition?.spineSessionType
  
  if (spineType === 'direct_intensity' || spineType === 'technical_focus' || session.isPrimary) {
    sessionType = 'skill_dominant'
  } else if (spineType === 'strength_support' || strengthCount > skillCount) {
    sessionType = 'strength_dominant'
  } else if (spineType === 'rotation_light' || skillMeta?.sessionPurpose === 'support_recovery') {
    sessionType = 'recovery'
  } else if (styleMeta?.hasDensityApplied) {
    sessionType = 'density'
  } else if (skillCount > 0 && strengthCount > 0) {
    sessionType = 'mixed'
  } else if (accessoryCount > skillCount + strengthCount) {
    sessionType = 'support'
  }
  
  // Build headline from focus or composition
  let sessionHeadline = session.focusLabel || session.focus || session.name || 'Training Session'
  // Clean up overly long headlines
  if (sessionHeadline.length > 40) {
    sessionHeadline = sessionHeadline.split(' - ')[0] || sessionHeadline.substring(0, 37) + '...'
  }
  
  // Build primary objective
  let primaryObjective = ''
  if (skillMeta?.sessionIdentityReason) {
    primaryObjective = skillMeta.sessionIdentityReason.split('.')[0]
  } else if (composition?.sessionIntent) {
    primaryObjective = composition.sessionIntent.split('.')[0]
  } else if (session.rationale) {
    primaryObjective = session.rationale.split('.')[0]
  }
  if (primaryObjective.length > 80) {
    primaryObjective = primaryObjective.substring(0, 77) + '...'
  }
  if (!primaryObjective) {
    primaryObjective = sessionType === 'skill_dominant' 
      ? 'Build skill proficiency through focused practice'
      : sessionType === 'strength_dominant'
        ? 'Develop foundational strength'
        : 'Balanced training session'
  }
  
  // Build execution priority based on session type
  let executionPriority = ''
  if (sessionType === 'skill_dominant') {
    executionPriority = 'Prioritize movement quality over reps'
  } else if (sessionType === 'strength_dominant') {
    executionPriority = 'Focus on progressive load'
  } else if (sessionType === 'density') {
    executionPriority = 'Maintain tempo, minimize rest'
  } else if (sessionType === 'recovery') {
    executionPriority = 'Keep effort controlled'
  } else {
    executionPriority = 'Balance technique and effort'
  }
  
  // Build work distribution labels
  const primaryWorkCount = skillCount + strengthCount
  let primaryWorkLabel = ''
  if (skillCount > 0 && strengthCount > 0) {
    primaryWorkLabel = `${skillCount} skill, ${strengthCount} strength`
  } else if (skillCount > 0) {
    primaryWorkLabel = `${skillCount} skill movement${skillCount > 1 ? 's' : ''}`
  } else if (strengthCount > 0) {
    primaryWorkLabel = `${strengthCount} strength exercise${strengthCount > 1 ? 's' : ''}`
  } else {
    primaryWorkLabel = `${exercises.length} exercise${exercises.length > 1 ? 's' : ''}`
  }
  
  const supportWorkCount = accessoryCount
  const supportWorkLabel = accessoryCount > 0 
    ? `${accessoryCount} support/accessory` 
    : null
  
  // Determine intensity profile
  let intensityProfile: SessionDisplayContract['intensityProfile'] = 'moderate'
  let intensityNote = ''
  
  if (sessionType === 'skill_dominant' && spineType === 'direct_intensity') {
    intensityProfile = 'high_effort'
    intensityNote = 'High effort on primary skill work'
  } else if (sessionType === 'skill_dominant') {
    intensityProfile = 'technique_focused'
    intensityNote = 'Quality over quantity'
  } else if (sessionType === 'strength_dominant') {
    intensityProfile = 'high_effort'
    intensityNote = 'Push towards RPE 8-9 on main lifts'
  } else if (sessionType === 'density') {
    intensityProfile = 'volume_density'
    intensityNote = 'Maintain work rate throughout'
  } else if (sessionType === 'recovery') {
    intensityProfile = 'recovery'
    intensityNote = 'Sub-maximal effort, focus on movement'
  } else {
    intensityProfile = 'moderate'
    intensityNote = 'Balanced effort across exercises'
  }
  
  // Training method badge
  let trainingMethod: string | null = null
  if (styleMeta?.hasSupersetsApplied) {
    trainingMethod = 'Supersets'
  } else if (styleMeta?.hasCircuitsApplied) {
    trainingMethod = 'Circuits'
  } else if (styleMeta?.hasDensityApplied) {
    trainingMethod = 'Density Blocks'
  }
  
  // Caution note (only if real)
  let cautionNote: string | null = null
  if (session.loadSummary?.removed && session.loadSummary.removed.length > 0) {
    cautionNote = `Volume managed (${session.loadSummary.removed.length} exercise${session.loadSummary.removed.length > 1 ? 's' : ''} adjusted)`
  } else if (session.timeOptimization?.wasOptimized) {
    cautionNote = session.timeOptimization.coachingMessage || 'Session optimized for time'
  }
  
  // Determine source
  let source: SessionDisplayContract['source'] = 'derived'
  if (composition?.sessionIntent && composition?.spineSessionType) {
    source = 'composition_metadata'
  } else if (skillMeta?.sessionIdentityReason) {
    source = 'skill_expression'
  } else if (styleMeta?.structureDescription) {
    source = 'style_metadata'
  }
  
  return {
    sessionHeadline,
    sessionType,
    primaryObjective,
    executionPriority,
    primaryWorkLabel,
    primaryWorkCount,
    supportWorkLabel,
    supportWorkCount,
    intensityProfile,
    intensityNote,
    trainingMethod,
    estimatedMinutes: session.estimatedMinutes || 45,
    cautionNote,
    source,
  }
}

// =============================================================================
// EXERCISE CARD DISPLAY CONTRACT
// =============================================================================

/**
 * Prescription intent categories for doctrine-driven display.
 * Determines how dosage should be interpreted and displayed.
 */
export type PrescriptionIntent = 
  | 'max_strength'        // Heavy loading, low reps, full recovery
  | 'strength_volume'     // Moderate loading, moderate reps, building work capacity
  | 'skill_acquisition'   // Position practice, quality focus, not to failure
  | 'skill_intensity'     // Pushing skill limits, high effort holds/reps
  | 'explosive_power'     // Speed/power focus, low reps, full recovery
  | 'hypertrophy'         // Moderate load, higher reps, controlled tempo
  | 'support_strength'    // Accessory work, moderate effort, building base
  | 'technical_carryover' // Movement quality, skill transfer, controlled
  | 'tissue_prep'         // Warm-up, activation, low intensity
  | 'density_conditioning' // Time-based work, minimal rest, work capacity

/**
 * Strict exercise card display contract.
 * Defines exactly what each exercise card should show in what order.
 * Prevents noisy/duplicate display by owning each display field explicitly.
 */
export interface ExerciseCardDisplayContract {
  // IDENTITY - What is this exercise
  displayTitle: string
  displayCategory: 'skill' | 'strength' | 'accessory' | 'core' | 'warmup' | 'cooldown'
  roleLabel: string | null  // Doctrine-specific role
  
  // PRESCRIPTION INTENT - Why this dosage
  prescriptionIntent: PrescriptionIntent
  intentLabel: string  // Human-readable intent: "Strength Volume" or "Skill Intensity"
  
  // PRESCRIPTION - What to do (single coherent line)
  prescriptionLine: string   // "4 × 5s holds" or "3 × 8-12"
  prescriptionContext: string | null  // "quality focus" or "push to near-failure" or null
  intensityBadge: string | null  // "RPE 8" or null
  loadBadge: string | null  // "+35 lb" or null
  restGuidance: string | null  // "90-120s" or null
  
  // WHY - Why this exercise (role-specific, not generic)
  whyLine: string | null  // Selection reason, refined by intent
  
  // FLAGS - Only when meaningful
  isWeighted: boolean
  isConstrained: boolean
  constraintNote: string | null  // "Volume managed" or null
  
  // DERIVED DISPLAY HINTS
  exerciseType: 'isometric_hold' | 'reps_based' | 'timed' | 'weighted_lift' | 'bodyweight' | 'explosive'
  showLoadConfidence: boolean  // Only when load confidence is not 'high'
  loadConfidenceNote: string | null
}

/**
 * Build exercise card display contract from AdaptiveExercise.
 * Single canonical source of truth for exercise card display.
 */
export function buildExerciseCardContract(
  exercise: {
    name: string
    category: string
    sets: number
    repsOrTime: string
    selectionReason?: string
    targetRPE?: number
    restSeconds?: number
    prescribedLoad?: {
      load: number
      unit: 'lbs' | 'kg'
      confidenceLevel?: string
      intensityBand?: string
    }
    coachingMeta?: {
      expressionMode?: string
      loadDecisionSummary?: string
      restLabel?: string
    }
  }
): ExerciseCardDisplayContract {
  const nameLower = exercise.name.toLowerCase()
  const repsLower = exercise.repsOrTime?.toLowerCase() || ''
  const reasonLower = (exercise.selectionReason || '').toLowerCase()
  const expressionMode = exercise.coachingMeta?.expressionMode?.toLowerCase() || ''
  const intensityBand = exercise.prescribedLoad?.intensityBand?.toLowerCase() || ''
  
  // Determine exercise type with better detection
  let exerciseType: ExerciseCardDisplayContract['exerciseType'] = 'reps_based'
  const isHold = repsLower.includes('s hold') || repsLower.includes('sec') || repsLower.includes('second')
  const isTimed = repsLower.includes('min') || repsLower.includes(':')
  const isExplosive = nameLower.includes('explosive') || nameLower.includes('jump') || 
    nameLower.includes('plyo') || nameLower.includes('muscle up') || nameLower.includes('kipping') ||
    reasonLower.includes('explosive') || reasonLower.includes('power')
  const hasLoad = exercise.prescribedLoad?.load && exercise.prescribedLoad.load > 0
  
  if (isHold) exerciseType = 'isometric_hold'
  else if (isTimed) exerciseType = 'timed'
  else if (isExplosive) exerciseType = 'explosive'
  else if (hasLoad) exerciseType = 'weighted_lift'
  else exerciseType = 'bodyweight'
  
  // Determine category
  const categoryLower = (exercise.category || 'accessory').toLowerCase()
  let displayCategory: ExerciseCardDisplayContract['displayCategory'] = 'accessory'
  if (categoryLower === 'skill') displayCategory = 'skill'
  else if (categoryLower === 'strength') displayCategory = 'strength'
  else if (categoryLower === 'core') displayCategory = 'core'
  else if (categoryLower === 'warmup') displayCategory = 'warmup'
  else if (categoryLower === 'cooldown') displayCategory = 'cooldown'
  
  // Parse rep range for intent detection
  const repMatch = repsLower.match(/(\d+)(?:\s*-\s*(\d+))?/)
  const minReps = repMatch ? parseInt(repMatch[1]) : 8
  const maxReps = repMatch && repMatch[2] ? parseInt(repMatch[2]) : minReps
  const avgReps = (minReps + maxReps) / 2
  
  // Parse hold time for skill intent
  const holdMatch = repsLower.match(/(\d+)\s*s/)
  const holdSeconds = holdMatch ? parseInt(holdMatch[1]) : 0
  
  // Determine prescription intent based on exercise signals
  let prescriptionIntent: PrescriptionIntent = 'support_strength'
  
  if (displayCategory === 'warmup') {
    prescriptionIntent = 'tissue_prep'
  } else if (displayCategory === 'cooldown') {
    prescriptionIntent = 'tissue_prep'
  } else if (isExplosive) {
    prescriptionIntent = 'explosive_power'
  } else if (displayCategory === 'skill') {
    // Skill exercises: differentiate acquisition vs intensity
    if (expressionMode.includes('direct') || expressionMode.includes('intensity')) {
      prescriptionIntent = 'skill_intensity'
    } else if (expressionMode.includes('technical') || holdSeconds <= 10) {
      prescriptionIntent = 'skill_acquisition'
    } else if (holdSeconds >= 20 || (exercise.targetRPE && exercise.targetRPE >= 8)) {
      prescriptionIntent = 'skill_intensity'
    } else {
      prescriptionIntent = 'skill_acquisition'
    }
  } else if (displayCategory === 'strength' || hasLoad) {
    // Strength exercises: differentiate max vs volume vs hypertrophy
    if (intensityBand.includes('heavy') || avgReps <= 5) {
      prescriptionIntent = 'max_strength'
    } else if (avgReps >= 10 || intensityBand.includes('moderate')) {
      prescriptionIntent = 'hypertrophy'
    } else {
      prescriptionIntent = 'strength_volume'
    }
  } else if (expressionMode.includes('carryover') || expressionMode.includes('technical')) {
    prescriptionIntent = 'technical_carryover'
  } else if (reasonLower.includes('density') || reasonLower.includes('conditioning')) {
    prescriptionIntent = 'density_conditioning'
  } else if (displayCategory === 'accessory' || displayCategory === 'core') {
    prescriptionIntent = 'support_strength'
  }
  
  // Intent labels - human-readable
  const intentLabels: Record<PrescriptionIntent, string> = {
    max_strength: 'Max Strength',
    strength_volume: 'Strength Volume',
    skill_acquisition: 'Skill Practice',
    skill_intensity: 'Skill Intensity',
    explosive_power: 'Power',
    hypertrophy: 'Hypertrophy',
    support_strength: 'Support',
    technical_carryover: 'Technical',
    tissue_prep: 'Prep',
    density_conditioning: 'Density',
  }
  const intentLabel = intentLabels[prescriptionIntent]
  
  // Prescription context - brief doctrine-driven execution cue
  let prescriptionContext: string | null = null
  switch (prescriptionIntent) {
    case 'max_strength':
      prescriptionContext = 'full recovery between sets'
      break
    case 'strength_volume':
      prescriptionContext = 'moderate rest, accumulate volume'
      break
    case 'skill_acquisition':
      prescriptionContext = 'quality over quantity'
      break
    case 'skill_intensity':
      prescriptionContext = 'push to near-max, stop if form breaks'
      break
    case 'explosive_power':
      prescriptionContext = 'maximal intent, full rest'
      break
    case 'hypertrophy':
      prescriptionContext = 'controlled tempo, feel the contraction'
      break
    case 'support_strength':
      prescriptionContext = 'steady effort, protect joints'
      break
    case 'technical_carryover':
      prescriptionContext = 'movement quality focus'
      break
    case 'tissue_prep':
      prescriptionContext = 'build bloodflow, avoid fatigue'
      break
    case 'density_conditioning':
      prescriptionContext = 'maintain pace, manage fatigue'
      break
    default:
      prescriptionContext = null
  }
  
  // Role label from expression mode - more doctrine-specific
  let roleLabel: string | null = null
  if (expressionMode.includes('direct') || expressionMode.includes('primary')) {
    roleLabel = displayCategory === 'skill' ? 'Primary Skill' : 'Primary'
  } else if (expressionMode.includes('technical')) {
    roleLabel = 'Technical Slot'
  } else if (expressionMode.includes('carryover')) {
    roleLabel = 'Carryover'
  } else if (expressionMode.includes('support')) {
    roleLabel = 'Support'
  }
  
  // Build prescription line - sets × reps format
  const prescriptionLine = `${exercise.sets} × ${exercise.repsOrTime}`
  
  // Intensity badge - RPE with intent-specific coaching context
  let intensityBadge: string | null = null
  if (exercise.targetRPE) {
    const rpe = exercise.targetRPE
    
    // Context varies based on what we're trying to achieve
    if (prescriptionIntent === 'skill_acquisition' || prescriptionIntent === 'skill_intensity') {
      // Skill work: RPE guards technique, not just effort
      if (rpe <= 7) {
        intensityBadge = `RPE ${rpe} · technique ceiling`
      } else if (rpe === 8) {
        intensityBadge = `RPE ${rpe} · controlled challenge`
      } else {
        intensityBadge = `RPE ${rpe} · near-limit testing`
      }
    } else if (prescriptionIntent === 'max_strength') {
      // Max strength: RPE is about neural readiness
      if (rpe <= 7) {
        intensityBadge = `RPE ${rpe} · building stimulus`
      } else if (rpe === 8) {
        intensityBadge = `RPE ${rpe} · effective dose`
      } else {
        intensityBadge = `RPE ${rpe} · peak intent`
      }
    } else if (prescriptionIntent === 'support_strength' || prescriptionIntent === 'hypertrophy') {
      // Support/hypertrophy: RPE manages fatigue
      if (rpe <= 7) {
        intensityBadge = `RPE ${rpe} · recovery-safe`
      } else {
        intensityBadge = `RPE ${rpe} · fatiguing`
      }
    } else {
      // Default fallback
      if (rpe <= 6) {
        intensityBadge = `RPE ${rpe} (light)`
      } else if (rpe === 7) {
        intensityBadge = `RPE ${rpe} (moderate)`
      } else if (rpe === 8) {
        intensityBadge = `RPE ${rpe} (hard)`
      } else {
        intensityBadge = `RPE ${rpe} (max effort)`
      }
    }
  }
  
  // Load badge - only if weighted
  const loadBadge = exercise.prescribedLoad?.load && exercise.prescribedLoad.load > 0 
    ? `+${exercise.prescribedLoad.load} ${exercise.prescribedLoad.unit}` 
    : null
  
  // Rest guidance - prefer coachingMeta.restLabel, else derive from restSeconds
  let restGuidance: string | null = null
  if (exercise.coachingMeta?.restLabel) {
    restGuidance = exercise.coachingMeta.restLabel
  } else if (exercise.restSeconds) {
    if (exercise.restSeconds >= 120) {
      restGuidance = `${Math.round(exercise.restSeconds / 60)}-${Math.round(exercise.restSeconds / 60) + 1} min`
    } else {
      restGuidance = `${exercise.restSeconds}s`
    }
  }
  
  // Why line - refined by prescription intent, not just first sentence
  let whyLine: string | null = null
  if (exercise.selectionReason) {
    // Extract most relevant part based on intent
    const reason = exercise.selectionReason
    let refined = reason.split('.')[0]
    
    // If reason is generic, add intent-specific doctrine context
    if (refined.length < 20 || refined.toLowerCase().includes('selected for')) {
      // Doctrine-driven intent explanations - specific job descriptions
      const intentContext: Record<PrescriptionIntent, string> = {
        max_strength: 'Peak neural drive for strength adaptation',
        strength_volume: 'Controlled volume accumulates structural adaptation',
        skill_acquisition: 'Greasing the groove for position mastery',
        skill_intensity: 'Testing ceiling while protecting technique',
        explosive_power: 'Training rate of force development',
        hypertrophy: 'Building the muscle substrate that powers skill',
        support_strength: 'Structural balance protects joints under load',
        technical_carryover: 'Direct transfer to target skill mechanics',
        tissue_prep: 'Readies connective tissue for main work',
        density_conditioning: 'Fatigue tolerance without intensity cost',
      }
      refined = intentContext[prescriptionIntent]
    }
    
    // Further refine support work based on exercise characteristics
    if (prescriptionIntent === 'support_strength' && reason) {
      const reasonLowerCheck = reason.toLowerCase()
      if (reasonLowerCheck.includes('scap') || reasonLowerCheck.includes('shoulder')) {
        refined = 'Scapular stability underpins overhead positions'
      } else if (reasonLowerCheck.includes('rear delt') || reasonLowerCheck.includes('face pull')) {
        refined = 'Posterior shoulder balance counters pressing bias'
      } else if (reasonLowerCheck.includes('core') || reasonLowerCheck.includes('trunk') || reasonLowerCheck.includes('compression')) {
        refined = 'Trunk rigidity transfers force to limbs'
      } else if (reasonLowerCheck.includes('grip') || reasonLowerCheck.includes('hang')) {
        refined = 'Grip endurance extends effective working sets'
      } else if (reasonLowerCheck.includes('hip') || reasonLowerCheck.includes('glute')) {
        refined = 'Hip stability anchors full-body tension'
      }
    }
    
    whyLine = refined.length > 80 ? refined.substring(0, 77) + '...' : refined
  }
  
  // Constraint detection
  const isConstrained = reasonLower.includes('limited') ||
    reasonLower.includes('capped') ||
    reasonLower.includes('constrained')
  
  const constraintNote = isConstrained ? 'Volume managed' : null
  
  // Load confidence
  const showLoadConfidence = loadBadge !== null && 
    exercise.prescribedLoad?.confidenceLevel !== 'high' &&
    exercise.prescribedLoad?.confidenceLevel !== undefined
  
  let loadConfidenceNote: string | null = null
  if (showLoadConfidence) {
    const confidence = exercise.prescribedLoad?.confidenceLevel
    if (confidence === 'moderate') loadConfidenceNote = 'Based on prior PR'
    else if (confidence === 'low') loadConfidenceNote = 'Estimated'
  }
  
  return {
    displayTitle: exercise.name,
    displayCategory,
    roleLabel,
    prescriptionIntent,
    intentLabel,
    prescriptionLine,
    prescriptionContext,
    intensityBadge,
    loadBadge,
    restGuidance,
    whyLine,
    isWeighted: loadBadge !== null,
    isConstrained,
    constraintNote,
    exerciseType,
    showLoadConfidence,
    loadConfidenceNote,
  }
}

// =============================================================================
// [EXERCISE-ROW-SURFACE] AUTHORITATIVE EXERCISE ROW DISPLAY CONTRACT
// Single owner of visible exercise row intelligence
// =============================================================================

export interface ExerciseRowSurface {
  /** Exercise ID for keying */
  exerciseId: string
  /** Clean display name */
  displayName: string
  /** Compact prescription line e.g. "4 x 8-10" */
  prescriptionLine: string
  /** Intent/purpose label e.g. "Primary skill exposure" */
  intentLabel: string | null
  /** Method label e.g. "Superset" */
  methodLabel: string | null
  /** Protection label e.g. "Volume capped" */
  protectionLabel: string | null
  /** Support reason e.g. "Scapular stability" */
  supportReasonLabel: string | null
  /** Progression evidence e.g. "Based on Week 1 performance" */
  progressionEvidenceLabel: string | null
  /** Session-aware purpose explanation e.g. "Trunk stability for line control" */
  purposeLine: string | null
  /** 0-2 compact chips for visual differentiation */
  rowChips: string[]
  /** Emphasis kind for styling */
  emphasisKind: 'primary' | 'secondary' | 'support' | 'protection' | 'fallback_minimal'
  /** Source marker */
  source: 'authoritative' | 'fallback_minimal'
}

/**
 * Get the best sublabel from an ExerciseRowSurface in priority order.
 * This centralizes the display priority logic so all render paths use the same order.
 * Priority: purposeLine > intentLabel > supportReasonLabel > protectionLabel > methodLabel > progressionEvidenceLabel
 * purposeLine is preferred when available as it provides session-aware context.
 */
export function getBestRowSublabel(surface: ExerciseRowSurface): string | null {
  // purposeLine provides richer session-aware context when available
  // But avoid showing both purposeLine and intentLabel if they're too similar
  if (surface.purposeLine) {
    // If purposeLine exists and is meaningfully different from intentLabel, prefer it
    const purposeLower = surface.purposeLine.toLowerCase()
    const intentLower = (surface.intentLabel || '').toLowerCase()
    // Only use purposeLine if it adds new context
    if (!intentLower || !purposeLower.includes(intentLower.split(' ')[0])) {
      return surface.purposeLine
    }
  }
  return surface.intentLabel 
    ?? surface.supportReasonLabel 
    ?? surface.purposeLine // Fallback to purposeLine if nothing else
    ?? surface.protectionLabel 
    ?? surface.methodLabel 
    ?? surface.progressionEvidenceLabel 
    ?? null
}

/**
 * Build a session-aware purpose line for an exercise row.
 * This is the SINGLE owner of "why this exercise exists in this session" display.
 * Priority: skill intent > carryover > protection > support role > accessory > core > mobility > finisher > null
 */
export function buildExercisePurposeLine(
  exercise: {
    name: string
    category?: string
    selectionReason?: string
    isPrimary?: boolean
    isProtected?: boolean
    coachingMeta?: {
      expressionMode?: string
      roleInSession?: string
      loadDecisionSummary?: string
      progressionIntent?: string
    }
  },
  sessionContext?: {
    sessionFocus?: string
    isPrimarySession?: boolean
    primaryGoal?: string
    compositionMetadata?: {
      spineSessionType?: string
      sessionIntent?: string
    }
  },
  emphasisKind?: ExerciseRowSurface['emphasisKind']
): string | null {
  const categoryLower = (exercise.category || '').toLowerCase()
  const reasonLower = (exercise.selectionReason || '').toLowerCase()
  const expressionMode = (exercise.coachingMeta?.expressionMode || '').toLowerCase()
  const roleInSession = (exercise.coachingMeta?.roleInSession || '').toLowerCase()
  const sessionFocusLower = (sessionContext?.sessionFocus || '').toLowerCase()
  const primaryGoalLower = (sessionContext?.primaryGoal || '').replace(/_/g, ' ').toLowerCase()
  const spineType = (sessionContext?.compositionMetadata?.spineSessionType || '').toLowerCase()
  const exerciseNameLower = exercise.name.toLowerCase()
  
  // Helper: derive goal-specific carryover phrase
  const goalCarryoverPhrase = (): string => {
    if (primaryGoalLower.includes('planche')) return 'planche pressing demands'
    if (primaryGoalLower.includes('front lever')) return 'front lever pulling strength'
    if (primaryGoalLower.includes('back lever')) return 'back lever straight-arm control'
    if (primaryGoalLower.includes('handstand')) return 'handstand line control'
    if (primaryGoalLower.includes('muscle up') || primaryGoalLower.includes('muscle-up')) return 'muscle-up transition power'
    return 'skill progression'
  }
  
  // ==========================================================================
  // PRIORITY 1: Primary skill/direct progression role
  // ==========================================================================
  if (emphasisKind === 'primary' || exercise.isPrimary || categoryLower === 'skill') {
    if (expressionMode.includes('direct') || expressionMode.includes('intensity') || spineType.includes('direct')) {
      if (primaryGoalLower.includes('planche')) {
        return 'Builds the straight-arm pressing strength your planche needs'
      } else if (primaryGoalLower.includes('front lever')) {
        return 'Develops the pulling strength your front lever requires'
      } else if (primaryGoalLower.includes('back lever')) {
        return 'Trains the straight-arm control back lever demands'
      } else if (primaryGoalLower.includes('handstand')) {
        return 'Develops the overhead strength and control for handstand'
      } else if (primaryGoalLower.includes('muscle')) {
        return 'Builds the transition power your muscle-up needs'
      }
      return 'Primary skill driver for your goal'
    }
    // Skill category but not direct expression
    if (categoryLower === 'skill') {
      if (primaryGoalLower.includes('planche')) {
        return 'Direct planche skill exposure'
      } else if (primaryGoalLower.includes('lever')) {
        return 'Direct lever skill exposure'
      }
      return 'Primary skill work for your progression'
    }
    return null // Let intentLabel handle primary without extra line
  }
  
  // ==========================================================================
  // PRIORITY 2: Secondary integration / carryover strength
  // ==========================================================================
  if (emphasisKind === 'secondary' || categoryLower === 'strength' || categoryLower === 'push' || categoryLower === 'pull') {
    // Check for carryover/technical expression
    if (expressionMode.includes('carryover') || expressionMode.includes('technical')) {
      return `Builds carryover strength that transfers into ${goalCarryoverPhrase()}`
    }
    
    // Push strength with goal context
    if (categoryLower === 'push' || categoryLower === 'strength' && (sessionFocusLower.includes('push') || exerciseNameLower.includes('dip') || exerciseNameLower.includes('push'))) {
      if (primaryGoalLower.includes('planche')) {
        return 'Builds pressing strength that carries into planche'
      } else if (primaryGoalLower.includes('handstand')) {
        return 'Develops pressing power for handstand pushup progression'
      }
      return 'Builds pushing strength that supports your skill goals'
    }
    
    // Pull strength with goal context
    if (categoryLower === 'pull' || categoryLower === 'strength' && (sessionFocusLower.includes('pull') || exerciseNameLower.includes('row') || exerciseNameLower.includes('pull'))) {
      if (primaryGoalLower.includes('front lever')) {
        return 'Develops pulling strength your front lever needs'
      } else if (primaryGoalLower.includes('muscle')) {
        return 'Builds the pulling power for muscle-up'
      }
      return 'Builds pulling strength that supports your skill goals'
    }
    
    // Generic strength with session context
    if (roleInSession.includes('support')) {
      return `Supports your ${goalCarryoverPhrase()} with foundational strength`
    }
    
    return `Builds foundational strength for ${goalCarryoverPhrase()}`
  }
  
  // ==========================================================================
  // PRIORITY 3: Protection / tissue-management role
  // ==========================================================================
  if (emphasisKind === 'protection' || exercise.isProtected) {
    if (reasonLower.includes('straight-arm') || reasonLower.includes('straight arm')) {
      return 'Protects straight-arm tissue while building capacity'
    }
    if (reasonLower.includes('shoulder') || reasonLower.includes('scap')) {
      return 'Protects shoulder tissue while maintaining training exposure'
    }
    if (reasonLower.includes('elbow') || reasonLower.includes('tendon')) {
      return 'Protects connective tissue for sustainable progress'
    }
    return 'Included for tissue protection while maintaining exposure'
  }
  
  // ==========================================================================
  // PRIORITY 4: Accessory hypertrophy / strength support role
  // ==========================================================================
  if (categoryLower === 'accessory') {
    // Scapular/shoulder stability
    if (reasonLower.includes('scap') || reasonLower.includes('shoulder') || exerciseNameLower.includes('face pull') || exerciseNameLower.includes('y raise')) {
      if (primaryGoalLower.includes('planche') || primaryGoalLower.includes('lever')) {
        return 'Builds scapular stability for better skill positions'
      }
      return 'Develops shoulder stability for injury prevention'
    }
    
    // Posterior chain / rear delt
    if (reasonLower.includes('rear delt') || reasonLower.includes('posterior') || exerciseNameLower.includes('rear delt')) {
      return 'Balances pushing with posterior chain work for shoulder health'
    }
    
    // Hypertrophy intent
    if (reasonLower.includes('hypertrophy') || reasonLower.includes('size')) {
      return 'Adds muscle where it supports your skill goals'
    }
    
    // Push accessory
    if (reasonLower.includes('push') || reasonLower.includes('press') || sessionFocusLower.includes('push')) {
      return 'Supports pressing strength without overloading recovery'
    }
    
    // Pull accessory
    if (reasonLower.includes('pull') || reasonLower.includes('row') || sessionFocusLower.includes('pull')) {
      return 'Supports pulling strength without overloading recovery'
    }
    
    return 'Supports your main work without overloading recovery'
  }
  
  // ==========================================================================
  // PRIORITY 5: Core / trunk / position-support role
  // ==========================================================================
  if (categoryLower === 'core') {
    if (primaryGoalLower.includes('planche')) {
      return 'Builds the trunk strength your planche line needs'
    }
    if (primaryGoalLower.includes('lever')) {
      return 'Develops the core tension your lever position requires'
    }
    if (primaryGoalLower.includes('handstand')) {
      return 'Builds the midline stability your handstand needs'
    }
    if (reasonLower.includes('hollow') || reasonLower.includes('anti-extension') || exerciseNameLower.includes('hollow')) {
      return 'Trains the hollow position that transfers to your skills'
    }
    if (reasonLower.includes('rotation') || reasonLower.includes('pallof')) {
      return 'Builds rotational stability for better body control'
    }
    return 'Develops trunk stability for your skill positions'
  }
  
  // ==========================================================================
  // PRIORITY 6: Mobility / prep / range-support role
  // ==========================================================================
  if (categoryLower === 'mobility' || categoryLower === 'flexibility') {
    if (reasonLower.includes('shoulder') || reasonLower.includes('overhead') || exerciseNameLower.includes('shoulder')) {
      return 'Opens shoulder range needed for your skill positions'
    }
    if (reasonLower.includes('hip') || reasonLower.includes('split')) {
      return 'Develops hip mobility for better skill expression'
    }
    if (reasonLower.includes('thoracic') || reasonLower.includes('spine')) {
      return 'Improves thoracic mobility for better overhead positions'
    }
    if (reasonLower.includes('wrist') || reasonLower.includes('forearm') || exerciseNameLower.includes('wrist')) {
      return 'Prepares wrists for the loading your skills demand'
    }
    return 'Develops the range your skill positions need'
  }
  
  // ==========================================================================
  // PRIORITY 7: Finisher / density / work-capacity role
  // ==========================================================================
  if (reasonLower.includes('finisher') || reasonLower.includes('density')) {
    if (sessionFocusLower.includes('push')) {
      return 'Finishes the push session with volume for growth'
    } else if (sessionFocusLower.includes('pull')) {
      return 'Finishes the pull session with volume for growth'
    }
    return 'Adds work capacity without overloading recovery'
  }
  
  // ==========================================================================
  // PRIORITY 8: Generic support with session context
  // ==========================================================================
  if (emphasisKind === 'support') {
    if (primaryGoalLower) {
      return `Supports your ${goalCarryoverPhrase()} training`
    }
    return null // Let intentLabel handle generic support
  }
  
  return null
}

/**
 * Build an authoritative exercise row surface from exercise data + session context.
 * This is the SINGLE owner of per-exercise-row display intelligence.
 */
export function buildExerciseRowSurface(
  exercise: {
    id?: string
    name: string
    category?: string
    sets?: number
    repsOrTime?: string
    targetRPE?: number
    restSeconds?: number
    selectionReason?: string
    isProtected?: boolean
    isPrimary?: boolean
    prescribedLoad?: {
      load?: number
      unit?: string
      confidenceLevel?: string
    }
    coachingMeta?: {
      expressionMode?: string
      loadDecisionSummary?: string
      roleInSession?: string
      progressionEvidence?: string
    }
    constraintApplied?: string
    groupId?: string
  },
  sessionContext?: {
    sessionFocus?: string
    isPrimarySession?: boolean
    primaryGoal?: string
    prescriptionPropagationAudit?: {
      appliedReductions?: {
        setsReduced?: boolean
        rpeReduced?: boolean
      }
    }
    styleMetadata?: {
      primaryStyle?: string
      hasSupersetsApplied?: boolean
      hasDensityApplied?: boolean
    }
    compositionMetadata?: {
      spineSessionType?: string
      sessionIntent?: string
    }
  }
): ExerciseRowSurface {
  const rowChips: string[] = []
  let source: ExerciseRowSurface['source'] = 'fallback_minimal'
  let emphasisKind: ExerciseRowSurface['emphasisKind'] = 'fallback_minimal'
  
  // ==========================================================================
  // A. Build display name - clean and consistent
  // ==========================================================================
  const displayName = exercise.name || 'Exercise'
  const exerciseId = exercise.id || displayName.toLowerCase().replace(/[\s-]+/g, '_')
  
  // ==========================================================================
  // B. Build prescription line from sets/reps
  // ==========================================================================
  const sets = exercise.sets ?? 3
  const repsOrTime = exercise.repsOrTime || '8-12'
  const prescriptionLine = `${sets} x ${repsOrTime}`
  
  // ==========================================================================
  // C. Determine emphasis kind from category + context
  // ==========================================================================
  const categoryLower = (exercise.category || 'accessory').toLowerCase()
  const reasonLower = (exercise.selectionReason || '').toLowerCase()
  const expressionMode = (exercise.coachingMeta?.expressionMode || '').toLowerCase()
  const roleInSession = (exercise.coachingMeta?.roleInSession || '').toLowerCase()
  
  if (exercise.isPrimary || categoryLower === 'skill' || expressionMode.includes('direct')) {
    emphasisKind = 'primary'
    source = 'authoritative'
  } else if (categoryLower === 'strength' || expressionMode.includes('strength')) {
    emphasisKind = 'secondary'
    source = 'authoritative'
  } else if (exercise.isProtected || exercise.constraintApplied) {
    emphasisKind = 'protection'
    source = 'authoritative'
  } else if (categoryLower === 'accessory' || categoryLower === 'core' || categoryLower === 'mobility' || categoryLower === 'flexibility') {
    emphasisKind = 'support'
    source = 'authoritative'
  } else if (categoryLower === 'warmup' || categoryLower === 'activation') {
    emphasisKind = 'support'
    // Keep source as fallback_minimal for warmup unless we have richer metadata
  }
  
  // ==========================================================================
  // D. Build intent label from expression mode + role
  // ==========================================================================
  let intentLabel: string | null = null
  
  if (expressionMode.includes('direct') || expressionMode.includes('intensity')) {
    intentLabel = 'Primary skill exposure'
    source = 'authoritative'
  } else if (expressionMode.includes('technical') || expressionMode.includes('carryover')) {
    intentLabel = 'Technical carryover'
    source = 'authoritative'
  } else if (roleInSession.includes('primary')) {
    intentLabel = 'Primary driver'
    source = 'authoritative'
  } else if (roleInSession.includes('support') || roleInSession.includes('accessory')) {
    intentLabel = 'Support integration'
    source = 'authoritative'
  } else if (categoryLower === 'skill') {
    intentLabel = 'Skill work'
    source = 'authoritative'
  } else if (categoryLower === 'strength') {
    intentLabel = 'Strength building'
    source = 'authoritative'
  } else if (categoryLower === 'core') {
    intentLabel = 'Core stability'
    source = 'authoritative'
  } else if (categoryLower === 'accessory') {
    intentLabel = 'Support work'
    source = 'authoritative'
  } else if (categoryLower === 'mobility' || categoryLower === 'flexibility') {
    intentLabel = 'Mobility prep'
    source = 'authoritative'
  }
  
  // Override based on selection reason keywords
  if (reasonLower.includes('volume build')) {
    intentLabel = 'Volume builder'
    source = 'authoritative'
  } else if (reasonLower.includes('technique') || reasonLower.includes('form')) {
    intentLabel = 'Technique reinforcement'
    source = 'authoritative'
  } else if (reasonLower.includes('recovery') || reasonLower.includes('prep')) {
    intentLabel = 'Recovery-compatible'
    source = 'authoritative'
  }
  
  // ==========================================================================
  // E. Build method label from session style metadata
  // ==========================================================================
  let methodLabel: string | null = null
  
  if (exercise.groupId && sessionContext?.styleMetadata?.hasSupersetsApplied) {
    methodLabel = 'Superset'
    source = 'authoritative'
  } else if (sessionContext?.styleMetadata?.hasDensityApplied && reasonLower.includes('density')) {
    methodLabel = 'Density'
    source = 'authoritative'
  }
  
  // ==========================================================================
  // F. Build protection label from constraints + prescription audit
  // ==========================================================================
  let protectionLabel: string | null = null
  
  if (exercise.constraintApplied) {
    protectionLabel = exercise.constraintApplied
    source = 'authoritative'
  } else if (exercise.isProtected) {
    protectionLabel = 'Protected load'
    source = 'authoritative'
  } else if (sessionContext?.prescriptionPropagationAudit?.appliedReductions) {
    const reductions = sessionContext.prescriptionPropagationAudit.appliedReductions
    if (reductions.setsReduced && reductions.rpeReduced) {
      protectionLabel = 'Conservative dosage'
      source = 'authoritative'
    } else if (reductions.setsReduced) {
      protectionLabel = 'Volume reduced'
      source = 'authoritative'
    } else if (reductions.rpeReduced) {
      protectionLabel = 'Intensity capped'
      source = 'authoritative'
    }
  }
  
  // ==========================================================================
  // G. Build support reason label for accessory work
  // ==========================================================================
  let supportReasonLabel: string | null = null
  
  if (emphasisKind === 'support' && exercise.selectionReason) {
    const reason = exercise.selectionReason
    if (reasonLower.includes('scap') || reasonLower.includes('shoulder')) {
      supportReasonLabel = 'Scapular stability'
      source = 'authoritative'
    } else if (reasonLower.includes('rear delt') || reasonLower.includes('face pull')) {
      supportReasonLabel = 'Posterior balance'
      source = 'authoritative'
    } else if (reasonLower.includes('core') || reasonLower.includes('trunk')) {
      supportReasonLabel = 'Trunk rigidity'
      source = 'authoritative'
    } else if (reasonLower.includes('grip') || reasonLower.includes('hang')) {
      supportReasonLabel = 'Grip endurance'
      source = 'authoritative'
    } else if (reasonLower.includes('hip') || reasonLower.includes('glute')) {
      supportReasonLabel = 'Hip stability'
      source = 'authoritative'
    } else if (reasonLower.includes('straight-arm') || reasonLower.includes('straight arm')) {
      supportReasonLabel = 'Straight-arm prep'
      source = 'authoritative'
    } else if (reason.length < 40) {
      // Use short selection reasons directly
      supportReasonLabel = reason.split('.')[0]
      source = 'authoritative'
    }
  }
  
  // ==========================================================================
  // H. Build progression evidence label
  // ==========================================================================
  let progressionEvidenceLabel: string | null = null
  
  if (exercise.coachingMeta?.progressionEvidence) {
    progressionEvidenceLabel = exercise.coachingMeta.progressionEvidence.slice(0, 50)
    source = 'authoritative'
  } else if (exercise.prescribedLoad?.confidenceLevel === 'high') {
    progressionEvidenceLabel = 'Based on recent performance'
    source = 'authoritative'
  }
  
  // ==========================================================================
  // I. Build row chips (max 2)
  // ==========================================================================
  
  // Chip 1: Emphasis/role chip
  if (emphasisKind === 'primary') {
    rowChips.push('Primary')
  } else if (emphasisKind === 'secondary') {
    rowChips.push('Strength')
  } else if (emphasisKind === 'protection') {
    rowChips.push('Protected')
  } else if (emphasisKind === 'support') {
    // Differentiate support chips by category
    if (categoryLower === 'accessory') {
      rowChips.push('Accessory')
    } else if (categoryLower === 'core') {
      rowChips.push('Core')
    } else if (categoryLower === 'mobility' || categoryLower === 'flexibility') {
      rowChips.push('Mobility')
    } else {
      // Fallback for generic support
      rowChips.push('Support')
    }
  }
  
  // Chip 2: Method or constraint chip
  if (methodLabel === 'Superset' && rowChips.length < 2) {
    rowChips.push('Superset')
  } else if (methodLabel === 'Density' && rowChips.length < 2) {
    rowChips.push('Density')
  } else if (protectionLabel && rowChips.length < 2) {
    if (protectionLabel.includes('Conservative') || protectionLabel.includes('Volume')) {
      rowChips.push('Conservative')
    }
  } else if (exercise.targetRPE && exercise.targetRPE >= 8 && rowChips.length < 2) {
    rowChips.push('High effort')
  }
  
  // ==========================================================================
  // J. Build session-aware purpose line
  // ==========================================================================
  const purposeLine = buildExercisePurposeLine(
    {
      name: exercise.name,
      category: exercise.category,
      selectionReason: exercise.selectionReason,
      isPrimary: exercise.isPrimary,
      isProtected: exercise.isProtected,
      coachingMeta: exercise.coachingMeta,
    },
    sessionContext,
    emphasisKind
  )
  
  return {
    exerciseId,
    displayName,
    prescriptionLine,
    intentLabel,
    methodLabel,
    protectionLabel,
    supportReasonLabel,
    progressionEvidenceLabel,
    purposeLine,
    rowChips: rowChips.slice(0, 2),
    emphasisKind,
    source,
  }
}

/**
 * Build exercise row surfaces for all exercises in a session.
 * Handles differentiation when multiple exercises would look identical.
 */
export function buildSessionExerciseRowSurfaces(
  exercises: Array<Parameters<typeof buildExerciseRowSurface>[0]>,
  sessionContext?: Parameters<typeof buildExerciseRowSurface>[1]
): ExerciseRowSurface[] {
  const surfaces = exercises.map(ex => buildExerciseRowSurface(ex, sessionContext))
  
  // Detect surfaces with same intentLabel and emphasisKind, differentiate them
  const surfaceKeys = new Map<string, number[]>()
  surfaces.forEach((surface, idx) => {
    const key = `${surface.emphasisKind}|${surface.intentLabel || 'none'}`
    if (!surfaceKeys.has(key)) {
      surfaceKeys.set(key, [])
    }
    surfaceKeys.get(key)!.push(idx)
  })
  
  // For groups with duplicates, try to add differentiating details
  surfaceKeys.forEach((indices) => {
    if (indices.length > 1) {
      indices.forEach((idx) => {
        const surface = surfaces[idx]
        const exercise = exercises[idx]
        
        // If we have support reason but no intent label, promote it
        if (!surface.intentLabel && surface.supportReasonLabel) {
          surface.intentLabel = surface.supportReasonLabel
          surface.supportReasonLabel = null
        }
        
        // Try to add a differentiating chip from exercise-specific data
        if (surface.rowChips.length < 2) {
          const repsLower = (exercise.repsOrTime || '').toLowerCase()
          if (repsLower.includes('hold') || repsLower.includes('sec')) {
            if (!surface.rowChips.includes('Isometric')) {
              surface.rowChips.push('Isometric')
            }
          } else if (exercise.prescribedLoad?.load && exercise.prescribedLoad.load > 0) {
            if (!surface.rowChips.includes('Weighted')) {
              surface.rowChips.push('Weighted')
            }
          }
        }
      })
    }
  })
  
  return surfaces
}

export interface ProgramIntelligenceContract {
  /** Program ID for verification */
  programId: string
  
  /** Primary training spine */
  trainingSpine: TrainingSpineDisplay
  
  /** Plan emphasis items */
  planEmphasis: PlanEmphasisDisplay
  
  /** Protected constraints */
  protectedConstraints: ProtectedConstraintDisplay[]
  
  /** Tradeoffs made */
  tradeoffs: TradeoffDisplay[]
  
  /** This week's driver */
  weekDriver: WeekDriverDisplay
  
  /** Secondary skill handling */
  secondarySkillHandling: SecondarySkillHandlingDisplay
  
  /** Enhanced plan explanation (specific, not generic) */
  planExplanation: {
    headline: string
    details: string[]
    source: string
  }
  
  // ==========================================================================
  // [DECISION-EVIDENCE-DISPLAY-CONTRACT] PREMIUM DISPLAYS
  // ==========================================================================
  
  /** Strategic summary - the core decision architecture */
  strategicSummary: StrategicSummaryDisplay
  
  /** Weekly decision logic - why this frequency and structure */
  weeklyDecisionLogic: WeeklyDecisionLogicDisplay
  
  /** Premium confidence - evidence-backed confidence display */
  premiumConfidence: PremiumConfidenceDisplay
  
  /** Day rationales - why each day exists */
  dayRationales: DayRationaleDisplay[]
  
  // ==========================================================================
  // WEEKLY DECISION OUTPUTS
  // ==========================================================================
  
  /** Weekly distribution - how sessions are allocated */
  weeklyDistribution: WeeklyDistributionDisplay
  
  /** Weekly protection - what is being protected this week */
  weeklyProtection: WeeklyProtectionDisplay
  
  /** Weekly decision summary - why this week looks like this */
  weeklyDecisionSummary: WeeklyDecisionSummaryDisplay
  
  // ==========================================================================
  // EXERCISE PRESCRIPTION OUTPUTS
  // ==========================================================================
  
  /** Exercise prescription truth - why these exercises and doses */
  exercisePrescription: ExercisePrescriptionDisplay
  
  // ==========================================================================
  // SESSION MAP OUTPUTS
  // ==========================================================================
  
  /** Week session map - canonical session structure at a glance */
  weekSessionMap: WeekSessionMapDisplay
  
  /** Decision inputs - what truth the engine used */
  decisionInputs: DecisionInputDisplay[]
  
  /** Evidence strength - premium confidence indicator */
  evidenceStrength: {
    label: string
    sublabel: string
    confidence: 'high' | 'moderate' | 'low'
    signalsUsed: number
    signalsTotal: number
  }
  
  /** Contract quality (legacy - kept for compatibility) */
  quality: {
    truthFieldsAvailable: number
    truthFieldsTotal: number
    confidence: 'high' | 'moderate' | 'low'
  }
}

/** Decision input display - what the engine responded to */
export interface DecisionInputDisplay {
  label: string
  value: string
  category: 'goal' | 'schedule' | 'level' | 'constraint' | 'preference'
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatSkillName(skill: string): string {
  return skill
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function inferSpineLabelFromGoals(primary: string, secondary: string | null, styleMode: string): string {
  const primaryFormatted = formatSkillName(primary)
  
  if (styleMode === 'skill_first' || styleMode === 'skill_progression') {
    return `${primaryFormatted}-First Skill Spine`
  }
  if (styleMode === 'strength_first' || styleMode === 'strength_endurance') {
    return `Strength-Support ${primaryFormatted} Spine`
  }
  if (styleMode === 'hybrid') {
    return `Hybrid ${primaryFormatted} Spine`
  }
  return `${primaryFormatted} Training Spine`
}

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

export function buildProgramIntelligenceContract(
  program: AdaptiveProgram
): ProgramIntelligenceContract {
  // Type assertions for optional fields
  const dominantSpine = (program as unknown as { dominantSpineResolution?: {
    primarySpine: string
    primaryStyleMode: string
    secondaryInfluences?: Array<{ influence: string }>
    densityIntegration?: { allowed: boolean; maxSessionsPerWeek?: number }
    spineRationale?: string
    hasAllStylesSelected?: boolean
  } }).dominantSpineResolution
  
  const summaryTruth = (program as unknown as { summaryTruth?: {
    truthfulHybridSummary?: string
    headlineFocusSkills?: string[]
    weekRepresentedSkills?: string[]
    weekSupportSkills?: string[]
  } }).summaryTruth
  
  const weeklyRep = (program as unknown as { weeklyRepresentation?: {
    policies?: Array<{
      skill: string
      representationVerdict: string
      actualExposure?: { direct: number; support: number; total: number }
    }>
    coverageRatio?: number
  } }).weeklyRepresentation
  
  const flexibleRootCause = (program as unknown as { flexibleFrequencyRootCause?: {
    finalReasonCategory?: string
    humanReadableReason?: string
    staticDaysSelected?: number
  } }).flexibleFrequencyRootCause
  
  const constraintInsight = program.constraintInsight || { hasInsight: false, label: '' }
  const trainingPathType = (program as unknown as { trainingPathType?: string }).trainingPathType
  const scheduleMode = program.scheduleMode
  const trainingDaysPerWeek = (program as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek
  const sessionCount = program.sessions?.length || 0
  
  let truthFieldsAvailable = 0
  const truthFieldsTotal = 6
  
  // ==========================================================================
  // 1. TRAINING SPINE
  // ==========================================================================
  let trainingSpine: TrainingSpineDisplay
  
  if (dominantSpine?.primarySpine) {
    truthFieldsAvailable++
    trainingSpine = {
      label: dominantSpine.primarySpine
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()) + ' Spine',
      styleMode: dominantSpine.primaryStyleMode || 'balanced',
      secondaryInfluences: dominantSpine.secondaryInfluences?.map(s => s.influence) || [],
      densityAllowed: dominantSpine.densityIntegration?.allowed ?? true,
      rationale: dominantSpine.spineRationale || null,
      source: 'dominantSpineResolution',
    }
  } else {
    // Infer from goals
    trainingSpine = {
      label: inferSpineLabelFromGoals(
        program.primaryGoal,
        program.secondaryGoal || null,
        trainingPathType || 'balanced'
      ),
      styleMode: trainingPathType || 'balanced',
      secondaryInfluences: [],
      densityAllowed: true,
      rationale: null,
      source: 'inferred',
    }
  }
  
  // ==========================================================================
  // 2. PLAN EMPHASIS
  // ==========================================================================
  const emphasisItems: string[] = []
  
  // Add primary goal emphasis
  if (program.primaryGoal) {
    emphasisItems.push(`${formatSkillName(program.primaryGoal)} priority`)
  }
  
  // Add secondary goal if present
  if (program.secondaryGoal) {
    emphasisItems.push(`${formatSkillName(program.secondaryGoal)} maintenance`)
  }
  
  // Add density info if limited
  if (dominantSpine?.densityIntegration && !dominantSpine.densityIntegration.allowed) {
    emphasisItems.push('Quality-first (density limited)')
  }
  
  // Add style mode insight
  if (trainingPathType === 'skill_progression') {
    emphasisItems.push('Skill-acquisition focused')
  } else if (trainingPathType === 'strength_endurance') {
    emphasisItems.push('Strength-building focused')
  } else if (trainingPathType === 'hybrid') {
    emphasisItems.push('Hybrid skill-strength balance')
  }
  
  // Add recovery insight if available
  const recoveryLevel = (program as unknown as { recoveryQuality?: string }).recoveryQuality
  if (recoveryLevel === 'low') {
    emphasisItems.push('Recovery-protected volume')
  }
  
  if (emphasisItems.length > 0) truthFieldsAvailable++
  
  const planEmphasis: PlanEmphasisDisplay = {
    items: emphasisItems.length > 0 ? emphasisItems : ['Balanced training emphasis'],
    source: emphasisItems.length > 0 ? 'program_fields' : 'default',
  }
  
  // ==========================================================================
  // 3. PROTECTED CONSTRAINTS
  // ==========================================================================
  const protectedConstraints: ProtectedConstraintDisplay[] = []
  
  // Constraint insight
  if (constraintInsight.hasInsight && constraintInsight.label) {
    protectedConstraints.push({
      label: constraintInsight.label,
      reason: 'Profile-based constraint',
      type: 'protective',
    })
  }
  
  // Joint cautions
  const jointCautions = (program as unknown as { jointCautions?: string[] }).jointCautions
  if (jointCautions && jointCautions.length > 0) {
    protectedConstraints.push({
      label: `Joint protection: ${jointCautions.join(', ')}`,
      reason: 'Exercise selection adjusted for joint health',
      type: 'protective',
    })
  }
  
  // Straight-arm protection (inferred from skills)
  const hasStraightArmSkill = [program.primaryGoal, program.secondaryGoal]
    .filter(Boolean)
    .some(s => ['planche', 'front_lever', 'back_lever', 'iron_cross'].includes(s || ''))
  
  if (hasStraightArmSkill) {
    protectedConstraints.push({
      label: 'Straight-arm tissue protection',
      reason: 'Connective tissue recovery prioritized',
      type: 'protective',
    })
  }
  
  // Schedule constraint
  if (scheduleMode === 'static' && trainingDaysPerWeek) {
    protectedConstraints.push({
      label: `Fixed ${trainingDaysPerWeek}-day schedule`,
      reason: 'Consistent weekly structure maintained',
      type: 'structural',
    })
  }
  
  if (protectedConstraints.length > 0) truthFieldsAvailable++
  
  // ==========================================================================
  // 4. TRADEOFFS
  // ==========================================================================
  const tradeoffs: TradeoffDisplay[] = []
  
  // Skill prioritization tradeoff
  const selectedSkills = (program as unknown as { selectedSkills?: string[] }).selectedSkills || []
  const representedSkills = (program as unknown as { representedSkills?: string[] }).representedSkills || []
  const deferredSkills = selectedSkills.filter(s => !representedSkills.includes(s))
  
  if (deferredSkills.length > 0 && selectedSkills.length > 2) {
    tradeoffs.push({
      prioritized: `${formatSkillName(program.primaryGoal)} frequency`,
      limited: `${deferredSkills.map(formatSkillName).join(', ')} exposure`,
      reason: 'Concentrated primary skill work for faster progress',
    })
  }
  
  // Density tradeoff
  if (dominantSpine?.densityIntegration && !dominantSpine.densityIntegration.allowed) {
    tradeoffs.push({
      prioritized: 'Skill quality and technique',
      limited: 'Density/conditioning volume',
      reason: 'Technical precision requires fresh nervous system',
    })
  }
  
  // Session count tradeoff
  if (scheduleMode === 'flexible' && sessionCount > 4) {
    tradeoffs.push({
      prioritized: 'Higher training frequency',
      limited: 'Per-session volume',
      reason: 'More frequent practice with manageable session load',
    })
  }
  
  if (tradeoffs.length > 0) truthFieldsAvailable++
  
  // ==========================================================================
  // 5. WEEK DRIVER
  // ==========================================================================
  let weekDriver: WeekDriverDisplay
  
  if (flexibleRootCause?.humanReadableReason) {
    truthFieldsAvailable++
    weekDriver = {
      label: scheduleMode === 'flexible' 
        ? `Adaptive ${sessionCount}-session week`
        : `Fixed ${trainingDaysPerWeek}-day week`,
      reason: flexibleRootCause.humanReadableReason,
      source: 'flexibleFrequencyRootCause',
    }
  } else {
    weekDriver = {
      label: scheduleMode === 'flexible'
        ? `Adaptive ${sessionCount}-session week`
        : `${trainingDaysPerWeek || sessionCount} days/week`,
      reason: scheduleMode === 'flexible'
        ? 'Flexible scheduling based on recovery and goals'
        : 'Consistent weekly training structure',
      source: 'inferred',
    }
  }
  
  // ==========================================================================
  // 6. SECONDARY SKILL HANDLING
  // ==========================================================================
  const supportSkills = summaryTruth?.weekSupportSkills || []
  const secondaryGoal = program.secondaryGoal
  
  let secondarySkillHandling: SecondarySkillHandlingDisplay
  
  if (weeklyRep?.policies) {
    truthFieldsAvailable++
    const secondaryPolicies = weeklyRep.policies.filter(p => 
      p.skill !== program.primaryGoal && 
      (p.representationVerdict === 'broadly_represented' || p.representationVerdict === 'support_only')
    )
    
    if (secondaryPolicies.length > 0) {
      const hasDirectSecondary = secondaryPolicies.some(p => 
        p.representationVerdict === 'broadly_represented' && 
        (p.actualExposure?.direct || 0) >= 2
      )
      
      secondarySkillHandling = {
        strategy: hasDirectSecondary
          ? 'Direct secondary exposure with dedicated blocks'
          : 'Support-integrated exposure through accessory work',
        skills: secondaryPolicies.map(p => p.skill),
        exposureLevel: hasDirectSecondary ? 'direct_secondary' : 'support_rotation',
      }
    } else {
      secondarySkillHandling = {
        strategy: 'Focused primary skill concentration',
        skills: [],
        exposureLevel: 'deferred',
      }
    }
  } else {
    secondarySkillHandling = {
      strategy: secondaryGoal 
        ? `${formatSkillName(secondaryGoal)} maintained as secondary focus`
        : 'Single-skill concentration',
      skills: secondaryGoal ? [secondaryGoal] : [],
      exposureLevel: secondaryGoal ? 'direct_secondary' : 'deferred',
    }
  }
  
  // ==========================================================================
  // 7. ENHANCED PLAN EXPLANATION
  // ==========================================================================
  const explanationDetails: string[] = []
  
  // Add spine context
  explanationDetails.push(
    `Built on a ${trainingSpine.label.toLowerCase()} prioritizing ${formatSkillName(program.primaryGoal)}.`
  )
  
  // Add schedule context
  if (scheduleMode === 'flexible') {
    explanationDetails.push(
      `Adaptive ${sessionCount}-session week allows progress optimization based on recovery.`
    )
  } else {
    explanationDetails.push(
      `Fixed ${trainingDaysPerWeek}-day structure provides consistent training rhythm.`
    )
  }
  
  // Add constraint context
  if (protectedConstraints.length > 0) {
    explanationDetails.push(
      `Protected: ${protectedConstraints.slice(0, 2).map(c => c.label.toLowerCase()).join(', ')}.`
    )
  }
  
  // Add tradeoff context
  if (tradeoffs.length > 0) {
    explanationDetails.push(
      `Tradeoff: ${tradeoffs[0].prioritized.toLowerCase()} over ${tradeoffs[0].limited.toLowerCase()}.`
    )
  }
  
  const planExplanation = {
    headline: summaryTruth?.truthfulHybridSummary?.split('.')[0] || 
      `${formatSkillName(program.primaryGoal)}-focused ${trainingPathType || 'balanced'} program`,
    details: explanationDetails,
    source: summaryTruth?.truthfulHybridSummary ? 'summaryTruth' : 'constructed',
  }
  
  // ==========================================================================
  // 8. WEEKLY DISTRIBUTION
  // ==========================================================================
  const sessions = program.sessions || []
  const distribution: SessionDistributionEntry[] = []
  
  // Categorize each session
  const sessionCategories = sessions.map(session => {
    const focus = session.focus?.toLowerCase() || ''
    const focusLabel = session.focusLabel || session.focus || 'Mixed'
    const styleMetadata = session.styleMetadata as { 
      hasDensityApplied?: boolean
      primaryStyle?: string 
    } | undefined
    
    // Determine category based on focus and metadata
    let category: SessionDistributionEntry['category'] = 'mixed'
    
    if (focus.includes('skill') || focus.includes('planche') || focus.includes('lever') || 
        focus.includes('handstand') || focus.includes('muscle_up') || session.isPrimary) {
      category = 'skill_primary'
    } else if (focus.includes('strength') || focus.includes('pull') || focus.includes('push') ||
               focus.includes('support')) {
      category = 'strength_support'
    } else if (focus.includes('accessory') || focus.includes('density') || 
               styleMetadata?.hasDensityApplied) {
      category = 'accessory'
    } else if (focus.includes('recovery') || focus.includes('mobility') || focus.includes('deload')) {
      category = 'recovery'
    }
    
    return {
      dayNumber: session.dayNumber,
      focusLabel,
      category,
      hasDensity: styleMetadata?.hasDensityApplied || false,
    }
  })
  
  // Group by category
  const categoryGroups = new Map<string, { label: string; days: number[]; category: SessionDistributionEntry['category'] }>()
  
  for (const session of sessionCategories) {
    const key = session.category
    if (!categoryGroups.has(key)) {
      categoryGroups.set(key, {
        label: key === 'skill_primary' ? 'Skill-Primary Sessions' :
               key === 'strength_support' ? 'Strength-Support Sessions' :
               key === 'accessory' ? 'Accessory/Density Sessions' :
               key === 'recovery' ? 'Recovery Sessions' : 'Mixed Sessions',
        days: [],
        category: session.category,
      })
    }
    categoryGroups.get(key)!.days.push(session.dayNumber)
  }
  
  for (const [_, group] of categoryGroups) {
    distribution.push({
      label: group.label,
      count: group.days.length,
      days: group.days,
      category: group.category,
    })
  }
  
  // Sort by count descending
  distribution.sort((a, b) => b.count - a.count)
  
  const primarySkillSessions = sessionCategories.filter(s => s.category === 'skill_primary').length
  const strengthSupportSessions = sessionCategories.filter(s => s.category === 'strength_support').length
  const densitySessions = sessionCategories.filter(s => s.hasDensity).length
  
  const weeklyDistribution: WeeklyDistributionDisplay = {
    totalSessions: sessions.length,
    distribution,
    primarySkillSessions,
    strengthSupportSessions,
    hasDensityWork: densitySessions > 0,
    densitySessions,
    source: sessions.length > 0 ? 'session_analysis' : 'unavailable',
  }
  
  // ==========================================================================
  // 9. WEEKLY PROTECTION
  // ==========================================================================
  const protectedAreas: WeeklyProtectionDisplay['protectedAreas'] = []
  
  // Straight-arm protection
  if (hasStraightArmSkill) {
    protectedAreas.push({
      label: 'Straight-arm connective tissue',
      reason: 'Limited concurrent straight-arm volume across sessions',
      isActive: true,
    })
  }
  
  // Density cap
  const densityCapActive = dominantSpine?.densityIntegration?.allowed === false ||
    (dominantSpine?.densityIntegration?.maxSessionsPerWeek && 
     dominantSpine.densityIntegration.maxSessionsPerWeek < sessions.length)
  
  if (densityCapActive) {
    protectedAreas.push({
      label: 'Conditioning/density volume',
      reason: dominantSpine?.densityIntegration?.maxSessionsPerWeek 
        ? `Capped at ${dominantSpine.densityIntegration.maxSessionsPerWeek} density sessions`
        : 'Quality-first - density work limited',
      isActive: true,
    })
  }
  
  // Recovery protection from profile
  if (recoveryLevel === 'low') {
    protectedAreas.push({
      label: 'Overall training volume',
      reason: 'Lower recovery capacity - volume managed',
      isActive: true,
    })
  }
  
  // Joint protection
  if (jointCautions && jointCautions.length > 0) {
    protectedAreas.push({
      label: `${jointCautions.join(', ')} joint health`,
      reason: 'Exercise selection modified for joint safety',
      isActive: true,
    })
  }
  
  // Secondary skill exposure limit
  if (deferredSkills.length > 0) {
    protectedAreas.push({
      label: 'Secondary skill exposure',
      reason: `${deferredSkills.map(formatSkillName).join(', ')} deferred for focus`,
      isActive: true,
    })
  }
  
  const weeklyProtection: WeeklyProtectionDisplay = {
    protectedAreas,
    densityCapActive,
    densityCapReason: densityCapActive 
      ? (dominantSpine?.densityIntegration?.maxSessionsPerWeek
          ? `Limited to ${dominantSpine.densityIntegration.maxSessionsPerWeek} sessions/week`
          : 'Density work excluded for skill quality')
      : null,
    volumeLimited: recoveryLevel === 'low',
    volumeLimitReason: recoveryLevel === 'low' 
      ? 'Adjusted for current recovery capacity'
      : null,
    source: protectedAreas.length > 0 ? 'constraint_analysis' : 'inferred',
  }
  
  // ==========================================================================
  // 10. WEEKLY DECISION SUMMARY
  // ==========================================================================
  const decisions: string[] = []
  
  // Session count decision
  decisions.push(
    `${sessions.length} sessions provide ${
      sessions.length >= 5 ? 'high' : sessions.length >= 4 ? 'moderate' : 'focused'
    } training frequency.`
  )
  
  // Distribution decision
  if (primarySkillSessions > strengthSupportSessions) {
    decisions.push(
      `${primarySkillSessions} of ${sessions.length} sessions prioritize skill work.`
    )
  } else if (strengthSupportSessions > primarySkillSessions) {
    decisions.push(
      `${strengthSupportSessions} of ${sessions.length} sessions focus on strength-support.`
    )
  } else {
    decisions.push(
      `Sessions balanced between skill (${primarySkillSessions}) and strength (${strengthSupportSessions}) work.`
    )
  }
  
  // Density decision
  if (densitySessions > 0) {
    decisions.push(
      `Density/conditioning included in ${densitySessions} session${densitySessions > 1 ? 's' : ''}.`
    )
  } else if (densityCapActive) {
    decisions.push('Density work excluded to protect skill quality.')
  }
  
  // Protection decision
  if (protectedAreas.length > 0) {
    decisions.push(
      `Actively protecting: ${protectedAreas.slice(0, 2).map(p => p.label.toLowerCase()).join(', ')}.`
    )
  }
  
  // Session bias
  const sessionBias = primarySkillSessions > strengthSupportSessions
    ? `Skill-biased (${primarySkillSessions}/${sessions.length} skill-primary)`
    : strengthSupportSessions > primarySkillSessions
    ? `Strength-biased (${strengthSupportSessions}/${sessions.length} strength-support)`
    : 'Balanced skill-strength distribution'
  
  // Secondary handling
  const secondaryHandling = secondarySkillHandling.exposureLevel === 'direct_secondary'
    ? `Secondary skills (${secondarySkillHandling.skills.map(formatSkillName).join(', ')}) receive direct exposure.`
    : secondarySkillHandling.exposureLevel === 'support_rotation'
    ? `Secondary skills maintained through support work rotation.`
    : 'Single-skill concentration this week.'
  
  // Intentional limits
  const intentionalLimits: string[] = []
  if (densityCapActive) intentionalLimits.push('Density volume')
  if (deferredSkills.length > 0) intentionalLimits.push('Multi-skill exposure')
  if (recoveryLevel === 'low') intentionalLimits.push('Total training volume')
  if (protectedConstraints.some(c => c.type === 'limiting')) {
    intentionalLimits.push('Per-session load')
  }
  
  const weeklyDecisionSummary: WeeklyDecisionSummaryDisplay = {
    headline: `${sessions.length}-session week with ${sessionBias.toLowerCase().split(' ')[0]} structure`,
    decisions,
    sessionBias,
    secondaryHandling,
    intentionalLimits,
    source: 'decision_synthesis',
  }
  
  // ==========================================================================
  // 11. EXERCISE PRESCRIPTION EXTRACTION
  // ==========================================================================
  
  // Collect all exercises from all sessions
  const allExercises: Array<{
    name: string
    category: string
    selectionReason: string
    coachingMeta?: {
      expressionMode?: string
      progressionIntent?: string
      skillSupportTargets?: string[]
      loadDecisionSummary?: string
    }
    prescribedLoad?: {
      intensityBand?: string
    }
    sessionFocus: string
    isPrimarySession: boolean
  }> = []
  
  for (const session of sessions) {
    const sessionFocus = session.focus || session.focusLabel || 'Mixed'
    const isPrimarySession = session.isPrimary || false
    
    for (const exercise of (session.exercises || [])) {
      allExercises.push({
        name: exercise.name,
        category: exercise.category,
        selectionReason: exercise.selectionReason || '',
        coachingMeta: exercise.coachingMeta as typeof allExercises[0]['coachingMeta'],
        prescribedLoad: exercise.prescribedLoad as typeof allExercises[0]['prescribedLoad'],
        sessionFocus,
        isPrimarySession,
      })
    }
  }
  
  // Group exercises by family (simplified name)
  const exerciseFamilyMap = new Map<string, {
    exercises: typeof allExercises
    roles: Set<string>
    intents: Set<string>
    sessionCount: number
  }>()
  
  for (const ex of allExercises) {
    // Create family name by removing qualifiers
    const familyName = ex.name
      .replace(/\s*(Assisted|Band|Weighted|Negative|Eccentric|Isometric|Hold|Tuck|Advanced|Straddle|Full)\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (!exerciseFamilyMap.has(familyName)) {
      exerciseFamilyMap.set(familyName, {
        exercises: [],
        roles: new Set(),
        intents: new Set(),
        sessionCount: 0,
      })
    }
    
    const family = exerciseFamilyMap.get(familyName)!
    family.exercises.push(ex)
    
    // Track roles based on coaching meta
    const expressionMode = ex.coachingMeta?.expressionMode?.toLowerCase() || ''
    if (expressionMode.includes('direct') || expressionMode.includes('primary')) {
      family.roles.add('primary_driver')
    } else if (expressionMode.includes('support') || expressionMode.includes('carryover')) {
      family.roles.add('support_carryover')
    } else if (expressionMode.includes('accessory')) {
      family.roles.add('accessory')
    } else if (expressionMode.includes('density') || expressionMode.includes('conditioning')) {
      family.roles.add('density')
    }
    
    // Track intents
    const intent = ex.coachingMeta?.progressionIntent || ''
    if (intent) family.intents.add(intent)
  }
  
  // Count unique sessions per family
  for (const [_, family] of exerciseFamilyMap) {
    const uniqueSessions = new Set(family.exercises.map(e => e.sessionFocus))
    family.sessionCount = uniqueSessions.size
  }
  
  // Build role summaries
  const primaryDrivers: ExerciseRoleSummary[] = []
  const supportWork: ExerciseRoleSummary[] = []
  const constrainedWork: ExerciseRoleSummary[] = []
  
  for (const [familyName, family] of exerciseFamilyMap) {
    // Determine primary role
    let role: ExerciseRoleSummary['role'] = 'accessory'
    if (family.roles.has('primary_driver')) {
      role = 'primary_driver'
    } else if (family.roles.has('support_carryover')) {
      role = 'support_carryover'
    } else if (family.roles.has('density')) {
      role = 'density'
    }
    
    // Check if constrained
    const isConstrained = family.exercises.some(ex => {
      const reason = ex.selectionReason.toLowerCase()
      return reason.includes('limited') || reason.includes('capped') || 
             reason.includes('constrained') || reason.includes('reduced')
    })
    
    // Build purpose from selection reasons and intents
    const firstReason = family.exercises[0]?.selectionReason || ''
    const intents = Array.from(family.intents)
    let purposeSummary = firstReason.split('.')[0] || 
      (intents.length > 0 ? intents[0].replace(/_/g, ' ') : 'Training support')
    
    // Clean up purpose
    purposeSummary = purposeSummary.charAt(0).toUpperCase() + purposeSummary.slice(1)
    if (purposeSummary.length > 80) {
      purposeSummary = purposeSummary.substring(0, 77) + '...'
    }
    
    const summary: ExerciseRoleSummary = {
      familyName,
      role: isConstrained ? 'constrained' : role,
      purposeSummary,
      sessionCount: family.sessionCount,
      constraintReason: isConstrained ? 'Volume managed for recovery/interference' : undefined,
    }
    
    if (isConstrained) {
      constrainedWork.push(summary)
    } else if (role === 'primary_driver') {
      primaryDrivers.push(summary)
    } else if (role === 'support_carryover') {
      supportWork.push(summary)
    }
  }
  
  // Sort by session count (more frequent = more important)
  primaryDrivers.sort((a, b) => b.sessionCount - a.sessionCount)
  supportWork.sort((a, b) => b.sessionCount - a.sessionCount)
  constrainedWork.sort((a, b) => b.sessionCount - a.sessionCount)
  
  // Build dosage intent
  const allIntents = allExercises
    .map(e => e.coachingMeta?.progressionIntent)
    .filter(Boolean) as string[]
  
  const intentCounts = new Map<string, number>()
  for (const intent of allIntents) {
    intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1)
  }
  
  const sortedIntents = Array.from(intentCounts.entries())
    .sort((a, b) => b[1] - a[1])
  
  const primaryIntentRaw = sortedIntents[0]?.[0] || 'balanced_training'
  const primaryIntent = primaryIntentRaw.replace(/_/g, ' ')
  
  // Build dosage characteristics
  const dosageCharacteristics: string[] = []
  
  // Check intensity distribution
  const hasStrengthBand = allExercises.some(e => 
    e.prescribedLoad?.intensityBand === 'strength')
  const hasVolumeBand = allExercises.some(e => 
    e.prescribedLoad?.intensityBand === 'support_volume' || 
    e.prescribedLoad?.intensityBand === 'hypertrophy')
  
  if (hasStrengthBand && hasVolumeBand) {
    dosageCharacteristics.push('Mixed intensity bands (strength + volume)')
  } else if (hasStrengthBand) {
    dosageCharacteristics.push('Strength-focused intensity')
  } else if (hasVolumeBand) {
    dosageCharacteristics.push('Volume/hypertrophy-focused intensity')
  }
  
  // Check skill exposure pattern
  if (primaryDrivers.length > 0) {
    const avgFreq = primaryDrivers.reduce((a, b) => a + b.sessionCount, 0) / primaryDrivers.length
    if (avgFreq >= 3) {
      dosageCharacteristics.push('High skill exposure frequency')
    } else if (avgFreq >= 2) {
      dosageCharacteristics.push('Moderate skill exposure frequency')
    } else {
      dosageCharacteristics.push('Concentrated skill exposure')
    }
  }
  
  // Check support work pattern
  if (supportWork.length > 0) {
    dosageCharacteristics.push(`${supportWork.length} support exercise families`)
  }
  
  // Check density inclusion
  if (weeklyDistribution.hasDensityWork) {
    dosageCharacteristics.push('Conditioning/density work included')
  }
  
  // Limited aspects
  const dosageLimitedAspects: string[] = []
  if (densityCapActive) {
    dosageLimitedAspects.push('Density volume capped')
  }
  if (constrainedWork.length > 0) {
    dosageLimitedAspects.push(`${constrainedWork.length} exercise families volume-managed`)
  }
  if (recoveryLevel === 'low') {
    dosageLimitedAspects.push('Overall volume adjusted for recovery')
  }
  
  const dosageIntent: DosageIntentDisplay = {
    styleLabel: hasStrengthBand && hasVolumeBand 
      ? 'Hybrid Strength-Volume'
      : hasStrengthBand 
      ? 'Strength-Focused'
      : hasVolumeBand
      ? 'Volume-Accumulation'
      : 'Balanced',
    primaryIntent,
    characteristics: dosageCharacteristics.slice(0, 4),
    limitedAspects: dosageLimitedAspects,
    source: allExercises.length > 0 ? 'exercise_analysis' : 'unavailable',
  }
  
  // Build notable decisions
  const notableDecisions: NotablePrescriptionDecision[] = []
  
  // Primary driver decision
  if (primaryDrivers.length > 0) {
    notableDecisions.push({
      decision: `${primaryDrivers[0].familyName} anchored as primary driver`,
      reason: primaryDrivers[0].purposeSummary,
      category: 'selection',
    })
  }
  
  // Support work decision
  if (supportWork.length > 0) {
    notableDecisions.push({
      decision: `Support work via ${supportWork.slice(0, 2).map(s => s.familyName).join(', ')}`,
      reason: 'Carryover and strength base development',
      category: 'selection',
    })
  }
  
  // Constraint decision
  if (constrainedWork.length > 0) {
    notableDecisions.push({
      decision: `${constrainedWork.map(c => c.familyName).join(', ')} volume-managed`,
      reason: 'Recovery and interference control',
      category: 'interference',
    })
  }
  
  // Density decision
  if (densityCapActive) {
    notableDecisions.push({
      decision: 'Conditioning work capped',
      reason: 'Preserving skill quality and recovery',
      category: 'dosage',
    })
  }
  
  // Frequency decision
  if (primaryDrivers.length > 0 && primaryDrivers[0].sessionCount >= 3) {
    notableDecisions.push({
      decision: `High-frequency ${primaryDrivers[0].familyName} exposure`,
      reason: 'Skill acquisition prioritized',
      category: 'frequency',
    })
  }
  
  const exercisePrescription: ExercisePrescriptionDisplay = {
    primaryDrivers: primaryDrivers.slice(0, 4),
    supportWork: supportWork.slice(0, 4),
    constrainedWork: constrainedWork.slice(0, 3),
    dosageIntent,
    notableDecisions: notableDecisions.slice(0, 5),
    totalExercises: allExercises.length,
    uniqueFamilies: exerciseFamilyMap.size,
    source: allExercises.length > 0 ? 'exercise_analysis' : 'unavailable',
  }
  
  // ==========================================================================
  // 12. WEEK SESSION MAP EXTRACTION
  // ==========================================================================
  
  const sessionMapEntries: SessionMapEntry[] = sessions.map(session => {
    const focus = session.focus || ''
    const focusLabel = session.focusLabel || session.focus || 'Mixed'
    const isPrimary = session.isPrimary || false
    const rationale = session.rationale || ''
    
    // Extract skill expression metadata if available
    const skillMeta = session.skillExpressionMetadata as {
      directlyExpressedSkills?: string[]
      technicalSlotSkills?: string[]
      carryoverSkills?: string[]
    } | undefined
    
    // Extract style metadata if available
    const styleMeta = session.styleMetadata as {
      primaryStyle?: string
      hasDensityApplied?: boolean
      hasSupersetsApplied?: boolean
      hasCircuitsApplied?: boolean
      structureDescription?: string
    } | undefined
    
    // Determine intent category from focus and metadata
    let intentCategory: SessionMapEntry['intentCategory'] = 'mixed'
    const focusLower = focus.toLowerCase()
    
    if (focusLower.includes('skill') || focusLower.includes('progression') || isPrimary) {
      intentCategory = 'skill_acquisition'
    } else if (focusLower.includes('strength') || focusLower.includes('support')) {
      intentCategory = 'strength_building'
    } else if (focusLower.includes('density') || styleMeta?.hasDensityApplied) {
      intentCategory = 'density'
    } else if (focusLower.includes('recovery') || focusLower.includes('deload')) {
      intentCategory = 'recovery'
    } else if (focusLower.includes('mixed') || focusLower.includes('hybrid')) {
      intentCategory = 'mixed'
    }
    
    // Build secondary emphasis from skill metadata
    let secondaryEmphasis: string | null = null
    if (skillMeta?.technicalSlotSkills && skillMeta.technicalSlotSkills.length > 0) {
      secondaryEmphasis = skillMeta.technicalSlotSkills.map(formatSkillName).join(', ') + ' technique'
    } else if (skillMeta?.carryoverSkills && skillMeta.carryoverSkills.length > 0) {
      secondaryEmphasis = skillMeta.carryoverSkills.map(formatSkillName).join(', ') + ' carryover'
    }
    
    // Build architecture summary from rationale or style
    let architectureSummary = ''
    if (styleMeta?.structureDescription) {
      architectureSummary = styleMeta.structureDescription
    } else if (rationale) {
      // Take first sentence of rationale
      architectureSummary = rationale.split('.')[0]
    } else {
      architectureSummary = isPrimary ? 'Primary skill work' : 'Support training'
    }
    
    // Truncate if too long
    if (architectureSummary.length > 60) {
      architectureSummary = architectureSummary.substring(0, 57) + '...'
    }
    
    // Build constraint flags
    const constraintFlags: string[] = []
    if (styleMeta?.hasDensityApplied === false && focusLower.includes('density')) {
      constraintFlags.push('density-capped')
    }
    if (session.timeOptimization?.wasOptimized) {
      constraintFlags.push('time-optimized')
    }
    if (session.loadSummary?.removed && session.loadSummary.removed.length > 0) {
      constraintFlags.push('load-managed')
    }
    
    // Build training style label
    let trainingStyle: string | null = null
    if (styleMeta?.hasSupersetsApplied) {
      trainingStyle = 'Supersets'
    } else if (styleMeta?.hasCircuitsApplied) {
      trainingStyle = 'Circuits'
    } else if (styleMeta?.hasDensityApplied) {
      trainingStyle = 'Density'
    } else if (styleMeta?.primaryStyle) {
      trainingStyle = String(styleMeta.primaryStyle).replace(/_/g, ' ')
    }
    
    return {
      dayNumber: session.dayNumber,
      dayLabel: session.dayLabel || `Day ${session.dayNumber}`,
      primaryFocus: focusLabel,
      secondaryEmphasis,
      intentCategory,
      isPrimary,
      architectureSummary,
      constraintFlags,
      estimatedMinutes: session.estimatedMinutes || 45,
      directSkills: skillMeta?.directlyExpressedSkills?.map(formatSkillName) || [],
      trainingStyle,
    }
  })
  
  // Sort by day number
  sessionMapEntries.sort((a, b) => a.dayNumber - b.dayNumber)
  
  // Build week flow description
  const primaryCount = sessionMapEntries.filter(s => s.isPrimary).length
  const supportCount = sessionMapEntries.length - primaryCount
  const hasDensity = sessionMapEntries.some(s => s.intentCategory === 'density' || s.trainingStyle === 'Density')
  
  let weekFlow = ''
  if (primaryCount > supportCount) {
    weekFlow = `Skill-dominant flow: ${primaryCount} primary, ${supportCount} support sessions`
  } else if (supportCount > primaryCount) {
    weekFlow = `Strength-support flow: ${supportCount} support, ${primaryCount} skill sessions`
  } else {
    weekFlow = `Balanced flow: ${primaryCount} primary, ${supportCount} support sessions`
  }
  
  const weekSessionMap: WeekSessionMapDisplay = {
    totalSessions: sessions.length,
    sessions: sessionMapEntries,
    weekFlow,
    primarySessionCount: primaryCount,
    supportSessionCount: supportCount,
    hasDensityWork: hasDensity,
    source: sessions.length > 0 ? 'session_analysis' : 'unavailable',
  }
  
  // ==========================================================================
  // DECISION INPUTS - What the engine responded to
  // ==========================================================================
  const decisionInputs: DecisionInputDisplay[] = []
  
  // Primary goal
  if (program.primaryGoal) {
    decisionInputs.push({
      label: 'Primary Focus',
      value: formatSkillName(program.primaryGoal),
      category: 'goal',
    })
  }
  
  // Secondary goal
  if (program.secondaryGoal) {
    decisionInputs.push({
      label: 'Secondary Focus',
      value: formatSkillName(program.secondaryGoal),
      category: 'goal',
    })
  }
  
  // Schedule mode
  decisionInputs.push({
    label: 'Schedule',
    value: scheduleMode === 'flexible' 
      ? `Adaptive ${sessionCount} sessions/week`
      : `Fixed ${trainingDaysPerWeek || sessionCount} days/week`,
    category: 'schedule',
  })
  
  // Session duration
  const sessionLength = program.sessionLength || 60
  decisionInputs.push({
    label: 'Session Target',
    value: `~${sessionLength} minutes`,
    category: 'schedule',
  })
  
  // Experience level
  if (program.experienceLevel) {
    decisionInputs.push({
      label: 'Level',
      value: formatSkillName(program.experienceLevel),
      category: 'level',
    })
  }
  
  // Training path type
  if (trainingPathType) {
    decisionInputs.push({
      label: 'Training Method',
      value: trainingPathType === 'skill_progression' ? 'Skill Progression' :
             trainingPathType === 'strength_endurance' ? 'Strength Endurance' :
             trainingPathType === 'hybrid' ? 'Hybrid Balance' : 
             formatSkillName(trainingPathType),
      category: 'preference',
    })
  }
  
  // Joint cautions
  if (jointCautions && jointCautions.length > 0) {
    decisionInputs.push({
      label: 'Protected Areas',
      value: jointCautions.map(j => formatSkillName(j)).join(', '),
      category: 'constraint',
    })
  }
  
  // ==========================================================================
  // EVIDENCE STRENGTH - Premium confidence indicator
  // ==========================================================================
  const confidence: 'high' | 'moderate' | 'low' = 
    truthFieldsAvailable >= 5 ? 'high' :
    truthFieldsAvailable >= 3 ? 'moderate' : 'low'
  
  const evidenceStrength = {
    label: confidence === 'high' ? 'Decision Confidence: Strong' :
           confidence === 'moderate' ? 'Decision Confidence: Good' :
           'Decision Confidence: Basic',
    sublabel: `Built from ${truthFieldsAvailable} active decision signals`,
    confidence,
    signalsUsed: truthFieldsAvailable,
    signalsTotal: truthFieldsTotal,
  }
  
  // ==========================================================================
  // [DECISION-EVIDENCE-DISPLAY-CONTRACT] BUILD PREMIUM DISPLAYS
  // ==========================================================================
  const strategicSummary = buildStrategicSummary(program)
  const weeklyDecisionLogic = buildWeeklyDecisionLogic(program)
  const premiumConfidence = buildPremiumConfidence(program)
  
  // Build day rationales
  const dayRationales: DayRationaleDisplay[] = sessions.map(session => 
    buildDayRationale(
      {
        dayNumber: session.dayNumber,
        dayLabel: session.dayLabel,
        rationale: session.rationale,
        focus: session.focus,
        focusLabel: session.focusLabel,
        isPrimary: session.isPrimary,
        skillExpressionMetadata: session.skillExpressionMetadata as {
          directlyExpressedSkills?: string[]
          technicalSlotSkills?: string[]
        },
      },
      {
        totalSessions: sessions.length,
        primaryGoal: program.primaryGoal,
        secondaryGoal: program.secondaryGoal,
        trainingSpine: trainingSpine.label,
      }
    )
  )
  
  // ==========================================================================
  // BUILD CONTRACT
  // ==========================================================================
  return {
    programId: program.id,
    trainingSpine,
    planEmphasis,
    protectedConstraints,
    tradeoffs,
    weekDriver,
    secondarySkillHandling,
    planExplanation,
    strategicSummary,
    weeklyDecisionLogic,
    premiumConfidence,
    dayRationales,
    weeklyDistribution,
    weeklyProtection,
    weeklyDecisionSummary,
    exercisePrescription,
    weekSessionMap,
    decisionInputs,
    evidenceStrength,
    quality: {
      truthFieldsAvailable,
      truthFieldsTotal,
      confidence,
    },
  }
}

// =============================================================================
// [NEON-TRUTH-CONTRACT] GENERATION SOURCE MAP DISPLAY
// =============================================================================

export interface GenerationSourceMapDisplay {
  /** Overall data quality label */
  qualityLabel: string
  /** Quality level */
  quality: 'strong' | 'usable' | 'partial' | 'weak' | 'unavailable'
  /** Human-readable breakdown */
  breakdown: string
  /** Whether Neon DB was used */
  neonDbUsed: boolean
  /** Available data sources count */
  availableCount: number
  /** Total possible sources */
  totalCount: number
  /** Key influence factors from the data */
  influenceSummary: string[]
  /** Signals read from DB */
  dbSignalsCount: number
  /** Signals defaulted (not from real data) */
  defaultedCount: number
  /** Signals that were missing */
  missingCount: number
  /** Domain quality breakdown for developers/advanced users */
  domainBreakdown: {
    profile: string
    recovery: string
    adherence: string
    execution: string
    doctrine: string
    programContext: string
  }
  /** Source of this display */
  source: 'generationTruthSnapshot' | 'unavailable'
}

/**
 * Extract generation source map display from program.
 * Shows how much real data vs defaults were used in generation.
 */
export function getGenerationSourceMapDisplay(program: AdaptiveProgram): GenerationSourceMapDisplay {
  const sourceMap = program.generationTruthSnapshot?.generationSourceMap
  
  if (!sourceMap) {
    return {
      qualityLabel: 'Data Unavailable',
      quality: 'unavailable',
      breakdown: 'Source map not captured',
      neonDbUsed: false,
      availableCount: 0,
      totalCount: 7,
      influenceSummary: [],
      dbSignalsCount: 0,
      defaultedCount: 0,
      missingCount: 0,
      domainBreakdown: {
        profile: 'unavailable',
        recovery: 'unavailable',
        adherence: 'unavailable',
        execution: 'unavailable',
        doctrine: 'unavailable',
        programContext: 'unavailable',
      },
      source: 'unavailable',
    }
  }
  
  const qualityLabels: Record<string, string> = {
    strong: 'Comprehensive Data',
    usable: 'Good Data Coverage',
    partial: 'Partial Data',
    weak: 'Limited Data',
    unavailable: 'Minimal Data',
  }
  
  const quality = (sourceMap.overallQuality || 'unavailable') as GenerationSourceMapDisplay['quality']
  const availableCount = sourceMap.neonAvailableDomains?.length || 0
  const dbSignalsCount = sourceMap.dbSignalsRead?.length || 0
  const defaultedCount = sourceMap.defaultedSignals?.length || 0
  const missingCount = sourceMap.missingSignals?.length || 0
  
  const breakdown = sourceMap.neonDbAvailable
    ? `${availableCount}/7 data sources from database`
    : 'Using profile-only data'
  
  return {
    qualityLabel: qualityLabels[quality] || 'Unknown',
    quality,
    breakdown,
    neonDbUsed: sourceMap.neonDbAvailable,
    availableCount,
    totalCount: 7,
    influenceSummary: sourceMap.influenceSummary || [],
    dbSignalsCount,
    defaultedCount,
    missingCount,
    domainBreakdown: {
      profile: sourceMap.profileQuality || 'unavailable',
      recovery: sourceMap.recoveryQuality || 'unavailable',
      adherence: sourceMap.adherenceQuality || 'unavailable',
      execution: sourceMap.executionQuality || 'unavailable',
      doctrine: sourceMap.doctrineQuality || 'unavailable',
      programContext: sourceMap.programContextQuality || 'unavailable',
    },
    source: 'generationTruthSnapshot',
  }
}
