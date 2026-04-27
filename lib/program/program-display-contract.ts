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
import {
  buildProgramExplanationSurface,
  getCompactProgramFitExplanation,
  getCompactSessionExplanation,
  getCompactExerciseExplanation,
  type ProgramExplanationSurface,
} from '@/lib/coaching-explanation-contract'
// [PHASE 4S] Canonical Phase 4P/4Q truth carried THROUGH the display contract.
// We intentionally `import type` only — this module remains read-only and never
// invokes builder/classifier logic. The card surface becomes a pass-through of
// these typed structures so downstream consumers (AdaptiveSessionCard) cannot
// re-derive method/doctrine truth from raw legacy fields.
import type { CanonicalMethodStructure } from '@/lib/program/method-structure-contract'
import type { DoctrineBlockResolutionEntry } from '@/lib/program/doctrine-block-resolution-contract'

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
// [OMITTED-SKILL-TRUTH-SURFACE] Truthful explanation for delayed/compressed skills
// =============================================================================

export interface OmittedSkillDisplay {
  /** Whether any selected skills are intentionally not shown this week */
  hasOmissions: boolean
  /** Short explanation line for UI display */
  explanationLine: string | null
  /** Skills that are deferred/omitted */
  omittedSkills: string[]
  /** Primary reason category */
  reasonCategory: 'acclimation' | 'protection' | 'compression' | 'focus_priority' | 'indirect_coverage' | null
  /** Whether this is doctrine-justified (not a gap) */
  doctrineJustified: boolean
  /** Source of truth for this display */
  source: 'week_adaptation' | 'tradeoff_analysis' | 'secondary_handling' | 'unavailable'
}

/**
 * Extract truthful omission display from program.
 * Only returns explanation when genuinely provable from existing truth signals.
 */
export function getOmittedSkillDisplay(program: AdaptiveProgram): OmittedSkillDisplay {
  const selectedSkills = (program as unknown as { selectedSkills?: string[] }).selectedSkills || []
  const representedSkills = (program as unknown as { representedSkills?: string[] }).representedSkills || []
  const weekAdaptation = program.weekAdaptationDecision
  
  // Calculate deferred skills
  const deferredSkills = selectedSkills.filter(s => !representedSkills.includes(s))
  
  // If nothing is deferred, no explanation needed
  if (deferredSkills.length === 0) {
    return {
      hasOmissions: false,
      explanationLine: null,
      omittedSkills: [],
      reasonCategory: null,
      doctrineJustified: true,
      source: 'unavailable',
    }
  }
  
  // Helper to format skill names
  const formatSkill = (s: string): string => {
    return s
      .replace(/_/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  
  const formattedSkills = deferredSkills.map(formatSkill)
  const skillList = formattedSkills.length <= 2 
    ? formattedSkills.join(' and ')
    : `${formattedSkills.slice(0, -1).join(', ')}, and ${formattedSkills[formattedSkills.length - 1]}`
  
  // PRIORITY 1: First-week acclimation protection
  if (weekAdaptation?.firstWeekGovernor?.active || weekAdaptation?.phase === 'initial_acclimation') {
    return {
      hasOmissions: true,
      explanationLine: `${skillList} phased in after acclimation week to protect adaptation quality.`,
      omittedSkills: deferredSkills,
      reasonCategory: 'acclimation',
      doctrineJustified: true,
      source: 'week_adaptation',
    }
  }
  
  // PRIORITY 2: Recovery/protection constraint
  if (weekAdaptation?.loadStrategy?.straightArmExposureBias === 'protected') {
    const isStraightArmSkill = deferredSkills.some(s => 
      s.toLowerCase().includes('planche') || 
      s.toLowerCase().includes('lever') || 
      s.toLowerCase().includes('maltese')
    )
    if (isStraightArmSkill) {
      return {
        hasOmissions: true,
        explanationLine: `${skillList} exposure is protected this week to manage connective tissue load.`,
        omittedSkills: deferredSkills,
        reasonCategory: 'protection',
        doctrineJustified: true,
        source: 'week_adaptation',
      }
    }
  }
  
  // PRIORITY 3: Recovery-constrained phase
  if (weekAdaptation?.phase === 'recovery_constrained') {
    return {
      hasOmissions: true,
      explanationLine: `${skillList} reduced this week to support recovery before progression resumes.`,
      omittedSkills: deferredSkills,
      reasonCategory: 'protection',
      doctrineJustified: true,
      source: 'week_adaptation',
    }
  }
  
  // PRIORITY 4: Focus priority tradeoff (multi-skill selection with concentrated primary)
  if (selectedSkills.length > 2 && deferredSkills.length < selectedSkills.length) {
    return {
      hasOmissions: true,
      explanationLine: `${skillList} receives indirect coverage this week while primary skill work is concentrated.`,
      omittedSkills: deferredSkills,
      reasonCategory: 'focus_priority',
      doctrineJustified: true,
      source: 'tradeoff_analysis',
    }
  }
  
  // PRIORITY 5: Indirect coverage through support work
  const weeklyRep = program.weeklyRepresentation
  if (weeklyRep?.policies) {
    const supportCoverage = weeklyRep.policies.filter(p => 
      deferredSkills.includes(p.skill) && 
      (p.representationVerdict === 'support_only' || p.representationVerdict === 'carryover_only')
    )
    if (supportCoverage.length > 0) {
      return {
        hasOmissions: true,
        explanationLine: `${skillList} covered indirectly through support work this week.`,
        omittedSkills: deferredSkills,
        reasonCategory: 'indirect_coverage',
        doctrineJustified: true,
        source: 'secondary_handling',
      }
    }
  }
  
  // FALLBACK: Deferred skills exist but no clear doctrine reason found
  // Report honestly that truth is partial
  return {
    hasOmissions: true,
    explanationLine: `${skillList} exposure is phased across your training week.`,
    omittedSkills: deferredSkills,
    reasonCategory: 'compression',
    doctrineJustified: false, // Honest: not fully justified by current truth
    source: 'tradeoff_analysis',
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

  // ===========================================================================
  // [FINAL-DAY-CARD-OWNERSHIP-LOCK] Visible-header ownership extensions.
  //
  // These optional fields fold every previously-parallel visible-truth
  // claim into ONE surface so the day-card header has exactly one owner:
  //   - `coachingPurpose` replaces the JSX-side
  //     `getCompactSessionExplanation(intelligenceContract.coachingExplanation, day)`
  //     read (the visible "what this session is for" sentence).
  //   - `fallbackWeeklyRole` / `fallbackRationale` replace the JSX-side
  //     `intelligenceContract.dayRationales.find(...).weeklyRole / .rationale`
  //     reads (the visible role + rationale fallbacks).
  //   - `microSignals` replaces the JSX-side `getSessionSurfaceSignals(session)`
  //     read (the visible micro-chip row beneath the headline).
  //
  // The JSX must NOT bypass these by reading `intelligenceContract.*` or
  // `getSessionSurfaceSignals(session)` for any visible claim. Renderers
  // enrich the surface once per session at the top of the day-card loop;
  // every visible block downstream consumes only `cardSurface.*`.
  // ===========================================================================
  /** Coaching-style "what this session is for" sentence. Null if not authored. */
  coachingPurpose?: string | null
  /** Last-resort weekly role label (e.g. "Primary push") when no headline. */
  fallbackWeeklyRole?: string | null
  /** Last-resort prose rationale when no headline / purpose / evidence exists. */
  fallbackRationale?: string | null
  /** Tiny chips like "Sets ↓", "RPE ↓" — surface-owned, not raw-derived. */
  microSignals?: string[]
  // ===========================================================================
  // [WEEKLY-SESSION-ROLE-CONTRACT] Authoritative per-day role display fields.
  // Surfaced once here so renderers do not re-derive from raw composition
  // metadata. Empty/null when the saved session predates the weekly role
  // contract — renderers should fall back to existing behavior in that case.
  // ===========================================================================
  /** "Primary strength day", "Skill quality day", "Density / capacity day", etc. */
  weeklyRoleLabel?: string | null
  /** "How this day differs from the rest of the week" — short, plain-language. */
  weeklyRoleRationale?: string | null
  /** "heavier_strength" | "skill_quality" | "moderate_mixed" | "supportive_lower" | "density_capacity" */
  weeklyIntensityClass?: string | null
  /** "harder_progression" | "current_progression" | "easier_progression_or_assist" | "moderate" */
  weeklyProgressionCharacter?: string | null
  /** Compact target breadth e.g. "5-6 exercises" — empty when not authored. */
  weeklyBreadthLabel?: string | null

  // ===========================================================================
  // [MATERIAL-COMPOSITION-TRUTH-LOCK] Surface fields exposing real, already-
  // computed programming decisions per session. These are NOT new prose; they
  // are pass-throughs of authoritative composition / adaptation truth that
  // currently exists in the surface INPUT (compositionMetadata,
  // prescriptionPropagationAudit) but was never propagated to the visible
  // card. Renders ONLY when truth is present — null/empty leaves legacy
  // sessions visually unchanged. The dominant `AdaptiveSessionCard` consumes
  // these to render structural (not descriptive) per-day differentiation.
  // ===========================================================================
  /** Authoritative primary-work share for this day (0-100) — drives the
   *  workload split bar. Null when composition didn't author it. */
  workloadPrimaryPercent?: number | null
  /** Authoritative support-work share for this day (0-100). Falls back to
   *  100 - primaryPercent when only the primary share was authored. */
  workloadSupportPercent?: number | null
  /** Spine-derived session expression mode for this position in the week.
   *  "direct_intensity" | "technical_focus" | "strength_support" — drives a
   *  small expression badge on the card. */
  spineExpression?: string | null
  /** Material adaptations actually applied by week-adaptation to THIS day's
   *  prescription. Each entry corresponds to a TRUE flag in
   *  prescriptionPropagationAudit.appliedReductions — i.e., a real change
   *  the program made (not "no change"). Empty array when adaptation made
   *  no material reductions. */
  materialAdaptations?: Array<{
    /** Stable key matching the source flag (sets / rpe / sec / den / fin). */
    key: 'sets' | 'rpe' | 'secondary' | 'density' | 'finisher'
    /** Short human-readable label e.g. "Sets reduced", "RPE capped". */
    label: string
    /** Visual tone hint: 'reduction' = the day was trimmed; 'protection'
     *  = a method/element was suppressed for safety. */
    tone: 'reduction' | 'protection'
  }>
  /** Authoritative verdict from prescriptionPropagationAudit.verdict —
   *  whether week-adaptation MATERIALLY changed this day's prescription. */
  adaptationVerdict?: 'changed' | 'unchanged' | null

  // ===========================================================================
  // [PHASE 4S — CANONICAL METHOD/DOCTRINE DELIVERY LOCK] Read-only pass-throughs
  // of canonical Phase 4P / 4Q truth so the visible card never has to re-derive
  // method or doctrine state from raw legacy fields. These are the authoritative
  // sources; `styleMetadata.styledGroups` remains as compatibility fallback only.
  //
  //   - methodStructures: every method considered for or applied to the session
  //     (grouped families: superset/circuit/density_block; row-level families:
  //     top_set/drop_set/rest_pause/cluster/endurance_density/...). Includes
  //     APPLIED, ALREADY_APPLIED, BLOCKED, NOT_NEEDED, NO_SAFE_TARGET, and
  //     NOT_CONNECTED entries.
  //
  //   - doctrineBlockResolution: per-entry classifier output that replaces
  //     generic yellow "blocked" labels with one of:
  //       APPLIED / ALREADY_APPLIED / TRUE_SAFETY_BLOCK / NO_RELEVANT_TARGET /
  //       NOT_RELEVANT_TO_SESSION / BUG_MISSING_CONNECTION /
  //       BUG_RUNTIME_CONTRACT_MISSING / BUG_DISPLAY_CONSUMER_MISSING /
  //       BUG_NORMALIZER_DROPPED_TRUTH / BUG_STALE_SOURCE_WON / UNKNOWN_NEEDS_AUDIT
  //
  // Both are optional/null — older saved sessions predate Phase 4P/4Q and
  // simply render the legacy chip path. The card is required to PREFER these
  // over `styleMetadata.styledGroups` and the legacy generic blocked text when
  // they exist.
  // ===========================================================================
  /** Canonical method structures stamped by Phase 4P corridor. Null on legacy. */
  methodStructures?: CanonicalMethodStructure[] | null
  /** Phase 4Q classified resolution per method structure entry. Null on legacy. */
  doctrineBlockResolution?: DoctrineBlockResolutionEntry[] | null
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
      // [WEEKLY-SESSION-ROLE-CONTRACT] Authoritative per-day role.
      // Optional/null when the session predates the contract — surface
      // falls back to existing behavior in that case.
      weeklyRole?: {
        roleId?: string
        roleLabel?: string
        intensityClass?: string
        progressionCharacter?: string
        breadthTarget?: { min?: number; target?: number; max?: number }
        weeklyRationale?: string
      } | null
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
      // [METHOD-MATERIALITY-LOCK] When present, these are the authoritative
      // post-materialization counts the visible card actually renders. The
      // surface gates method signals on these so a label like "Supersets
      // active" cannot appear unless the visible session prescription
      // actually contains a renderable grouped block of that method.
      styledGroups?: Array<{ groupType?: string | null; exercises?: Array<{ name?: string | null } | null> | null } | null> | null
      methodMaterializationSummary?: {
        groupedStructurePresent?: boolean
        rowLevelMethodCuesPresent?: boolean
        groupedMethodCounts?: { superset?: number; circuit?: number; density_block?: number; cluster?: number }
      } | null
    }
    // [PHASE 4S] Canonical Phase 4P/4Q fields — pass-through only. Optional
    // because older saved sessions predate the corridors. The contract treats
    // these as opaque arrays; null/empty means "use legacy fallback".
    methodStructures?: CanonicalMethodStructure[] | null
    doctrineBlockResolution?: DoctrineBlockResolutionEntry[] | null
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
  // [WEEKLY-SESSION-ROLE-CONTRACT] Authoritative per-day role view (may be null
  // for sessions saved before the contract existed).
  const weeklyRole = composition?.weeklyRole || null
  
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
  // [WEEKLY-SESSION-ROLE-CONTRACT — VISIBLE PRIMACY LOCK]
  // The role label MUST own the strongest visible slot (sessionHeadline)
  // when present, not a 9px chip alongside other 9px chips. Without this
  // promotion the strengthened weekly role truth lives in the data but
  // dies at the visible surface.
  //
  // Order is critical:
  //   1. Override sessionHeadline FIRST so it wins over the legacy
  //      derivation paths above (skillMeta / composition.sessionIntent /
  //      session.rationale / focusLabel).
  //   2. Do NOT also push the same label into primaryIntentChips —
  //      duplicate visible claims (headline says X, chip says X) violate
  //      the "no duplicate or cosmetic redundancy" display rule.
  // ==========================================================================
  if (weeklyRole?.roleLabel) {
    sessionHeadline = weeklyRole.roleLabel
    source = 'authoritative'
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
  // D. Build method signals from style metadata.
  //
  // [METHOD-MATERIALITY-LOCK] A method label only surfaces on the visible
  // session header when it is materially represented by the prescription
  // the user is actually seeing. Materiality is verified in this priority:
  //   1. Canonical post-materialization summary (`methodMaterializationSummary`)
  //      stamped by the builder. Counts > 0 => the visible card body renders
  //      a grouped block of that method.
  //   2. styledGroups carrying a non-straight `groupType` with at least 2
  //      usable members (mirrors the same minMembersFor=2 rule the card
  //      adapter and grouped scanner use). A 1-member styledGroup is NOT
  //      a renderable grouped block and must not produce a header label.
  //   3. As a last-resort fallback, the legacy `hasXApplied` flag, but
  //      only when the parent did not provide either canonical counts or
  //      styledGroups. This keeps older saved programs (pre-summary) from
  //      losing all method visibility while preventing modern programs
  //      from surfacing labels that aren't materially backed.
  // ==========================================================================
  const canonicalMethodCounts = styleMeta?.methodMaterializationSummary?.groupedMethodCounts
  const styledGroupsArr = Array.isArray(styleMeta?.styledGroups) ? styleMeta!.styledGroups! : null
  const hasCanonicalCounts = !!canonicalMethodCounts
  const hasStyledGroupsEvidence = styledGroupsArr !== null

  function styledGroupHasRenderable(method: 'superset' | 'circuit' | 'density_block'): boolean {
    if (!styledGroupsArr) return false
    for (const g of styledGroupsArr) {
      const t = (g?.groupType || '').toLowerCase()
      const matches =
        method === 'density_block'
          ? (t === 'density' || t === 'density_block')
          : t === method
      if (!matches) continue
      const usable = Array.isArray(g?.exercises)
        ? g!.exercises!.filter(m => !!m && typeof m.name === 'string' && m.name!.trim().length >= 2)
        : []
      if (usable.length >= 2) return true
    }
    return false
  }

  // Density
  const densityMaterial =
    (canonicalMethodCounts?.density_block || 0) > 0 ||
    (hasStyledGroupsEvidence && styledGroupHasRenderable('density_block')) ||
    (!hasCanonicalCounts && !hasStyledGroupsEvidence && !!styleMeta?.hasDensityApplied)
  if (densityMaterial) {
    methodSignals.push('Density applied')
    source = 'authoritative'
  }

  // Supersets
  const supersetsMaterial =
    (canonicalMethodCounts?.superset || 0) > 0 ||
    (hasStyledGroupsEvidence && styledGroupHasRenderable('superset')) ||
    (!hasCanonicalCounts && !hasStyledGroupsEvidence && !!styleMeta?.hasSupersetsApplied)
  if (supersetsMaterial) {
    methodSignals.push('Supersets active')
    source = 'authoritative'
  }

  // Circuits
  const circuitsMaterial =
    (canonicalMethodCounts?.circuit || 0) > 0 ||
    (hasStyledGroupsEvidence && styledGroupHasRenderable('circuit')) ||
    (!hasCanonicalCounts && !hasStyledGroupsEvidence && !!styleMeta?.hasCircuitsApplied)
  if (circuitsMaterial) {
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
  
  // [WEEKLY-SESSION-ROLE-CONTRACT] When the per-day weekly role provides a
  // rationale, prefer it as the evidence label so each day in the week has
  // a different "why this day looks like this" sentence — not six identical
  // "Built from profile + doctrine" copies. Protection labels (week-1 /
  // recovery-constrained) still take precedence above this.
  if (!evidenceLabel && weeklyRole?.weeklyRationale) {
    evidenceLabel = weeklyRole.weeklyRationale
    source = 'authoritative'
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
  
  // [WEEKLY-SESSION-ROLE-CONTRACT] Compose human-readable breadth label.
  const weeklyBreadthLabel: string | null = (() => {
    const t = weeklyRole?.breadthTarget
    if (!t) return null
    if (typeof t.min === 'number' && typeof t.max === 'number' && t.min !== t.max) {
      return `${t.min}-${t.max} exercises`
    }
    if (typeof t.target === 'number') {
      return `${t.target} exercises`
    }
    return null
  })()

  // ==========================================================================
  // [MATERIAL-COMPOSITION-TRUTH-LOCK] Pass authoritative composition /
  // adaptation truth straight through to the surface so the dominant card can
  // render REAL per-day programming difference structurally (workload split
  // bar, spine expression badge, material adaptation chips), not as prose.
  // No transformation, no derivation, no fabrication — every value below is
  // a direct read of an already-computed field on the saved session.
  // ==========================================================================
  const rawPrimaryPercent = composition?.workloadDistribution?.primaryWorkPercent
  const rawSupportPercent = composition?.workloadDistribution?.supportWorkPercent
  const workloadPrimaryPercent: number | null =
    typeof rawPrimaryPercent === 'number' ? rawPrimaryPercent : null
  const workloadSupportPercent: number | null =
    typeof rawSupportPercent === 'number'
      ? rawSupportPercent
      : workloadPrimaryPercent != null
        ? Math.max(0, 100 - workloadPrimaryPercent)
        : null

  const spineExpression: string | null = composition?.spineSessionType ?? null

  // Build material adaptation list ONLY from TRUE flags. An empty list means
  // week-adaptation made no material reductions for this day — perfectly
  // valid; we render nothing rather than fabricate a "no change" chip.
  const reductions = prescriptionAudit?.appliedReductions
  const materialAdaptations: SessionCardSurface['materialAdaptations'] = []
  if (reductions?.setsReduced) {
    materialAdaptations!.push({ key: 'sets', label: 'Sets reduced', tone: 'reduction' })
  }
  if (reductions?.rpeReduced) {
    materialAdaptations!.push({ key: 'rpe', label: 'RPE capped', tone: 'reduction' })
  }
  if (reductions?.secondaryTrimmed) {
    materialAdaptations!.push({ key: 'secondary', label: 'Secondary trimmed', tone: 'reduction' })
  }
  if (reductions?.densityReduced) {
    materialAdaptations!.push({ key: 'density', label: 'Density reduced', tone: 'reduction' })
  }
  if (reductions?.finisherSuppressed) {
    materialAdaptations!.push({ key: 'finisher', label: 'Finisher omitted', tone: 'protection' })
  }

  // Adaptation verdict — direct map from authoritative source string.
  const adaptationVerdict: 'changed' | 'unchanged' | null =
    prescriptionAudit?.verdict?.includes('MATERIALLY_CHANGED')
      ? 'changed'
      : prescriptionAudit?.verdict?.includes('UNCHANGED')
        ? 'unchanged'
        : null

  // [PHASE 4S] Pass-through canonical method/doctrine truth from the session.
  // We do not validate, normalize, or transform — the corridor that wrote
  // these arrays is the source of truth. We only guarantee the surface field
  // is a real array (or null) so consumers can `Array.isArray` safely without
  // crashing on malformed saved programs.
  const methodStructuresPassthrough: CanonicalMethodStructure[] | null =
    Array.isArray(session.methodStructures) ? session.methodStructures : null
  const doctrineBlockResolutionPassthrough: DoctrineBlockResolutionEntry[] | null =
    Array.isArray(session.doctrineBlockResolution) ? session.doctrineBlockResolution : null

  return {
    sessionHeadline,
    sessionSubheadline,
    primaryIntentChips: primaryIntentChips.slice(0, 3),
    protectionSignals: protectionSignals.slice(0, 3),
    methodSignals: methodSignals.slice(0, 2),
    evidenceLabel,
    repetitionKey,
    source,
    // [WEEKLY-SESSION-ROLE-CONTRACT] Per-day role visible-display fields
    weeklyRoleLabel: weeklyRole?.roleLabel || null,
    weeklyRoleRationale: weeklyRole?.weeklyRationale || null,
    weeklyIntensityClass: weeklyRole?.intensityClass || null,
    weeklyProgressionCharacter: weeklyRole?.progressionCharacter || null,
    weeklyBreadthLabel,
    // [MATERIAL-COMPOSITION-TRUTH-LOCK] Real programming-decision fields
    workloadPrimaryPercent,
    workloadSupportPercent,
    spineExpression,
    materialAdaptations,
    adaptationVerdict,
    // [PHASE 4S] Canonical Phase 4P/4Q truth — pass-through, no rebuild.
    methodStructures: methodStructuresPassthrough,
    doctrineBlockResolution: doctrineBlockResolutionPassthrough,
  }
}

// =============================================================================
// [PHASE 4S] PURE HELPERS for consumers of `SessionCardSurface`.
//
// These are intentionally tiny and side-effect-free. They exist so the visible
// card can answer "do I have authoritative method/doctrine truth, and how
// should I render a classified blocked label?" without re-deriving anything.
// =============================================================================

/**
 * Returns the typed canonical method structures from a session. Always returns
 * an array (empty when missing/malformed) so callers can map without guards.
 */
export function readMethodStructuresFromSession(
  session: { methodStructures?: CanonicalMethodStructure[] | null } | null | undefined,
): CanonicalMethodStructure[] {
  if (!session) return []
  return Array.isArray(session.methodStructures) ? session.methodStructures : []
}

/**
 * Returns the typed Phase 4Q classification entries. Always returns an array
 * (empty when missing/malformed) so callers can map without guards.
 */
export function readDoctrineBlockResolutionFromSession(
  session: { doctrineBlockResolution?: DoctrineBlockResolutionEntry[] | null } | null | undefined,
): DoctrineBlockResolutionEntry[] {
  if (!session) return []
  return Array.isArray(session.doctrineBlockResolution) ? session.doctrineBlockResolution : []
}

/**
 * `true` when the surface has at least one APPLIED or ALREADY_APPLIED canonical
 * method structure. Used by the card to decide whether to show the canonical
 * Phase 4P/4Q summary line vs fall back to legacy chips only. We treat
 * BLOCKED / NOT_NEEDED / NO_SAFE_TARGET as "considered, not rendered as a
 * real method block" — the doctrine resolution line still renders for those.
 */
export function hasRenderableMethodStructure(
  surface: Pick<SessionCardSurface, 'methodStructures'> | null | undefined,
): boolean {
  if (!surface) return false
  const list = Array.isArray(surface.methodStructures) ? surface.methodStructures : []
  for (const entry of list) {
    if (entry && (entry.status === 'applied' || entry.status === 'already_applied')) {
      return true
    }
  }
  return false
}

/**
 * Maps the Phase 4Q `DoctrineBlockResolution` enum to a small, mobile-safe
 * visible label + tone hint the card can render directly. Tones map to the
 * existing palette: success/neutral/warning/diagnostic — the card chooses
 * Tailwind classes from these. Pure; no JSX.
 */
export type ClassifiedBlockTone = 'success' | 'neutral' | 'warning' | 'diagnostic'

export function normalizeDoctrineBlockStatus(
  status: string | null | undefined,
): { label: string; tone: ClassifiedBlockTone; isBug: boolean } {
  switch (status) {
    case 'APPLIED':
      return { label: 'Doctrine applied', tone: 'success', isBug: false }
    case 'ALREADY_APPLIED':
      return { label: 'Already reflected', tone: 'success', isBug: false }
    case 'TRUE_SAFETY_BLOCK':
      return { label: 'Blocked for safety', tone: 'warning', isBug: false }
    case 'NO_RELEVANT_TARGET':
      return { label: 'No matching target', tone: 'neutral', isBug: false }
    case 'NOT_RELEVANT_TO_SESSION':
      return { label: 'Not for this day', tone: 'neutral', isBug: false }
    case 'BUG_MISSING_CONNECTION':
      return { label: 'Connection issue: doctrine not reaching card', tone: 'diagnostic', isBug: true }
    case 'BUG_RUNTIME_CONTRACT_MISSING':
      return { label: 'Runtime issue: doctrine contract missing', tone: 'diagnostic', isBug: true }
    case 'BUG_DISPLAY_CONSUMER_MISSING':
      return { label: 'Display issue: card not consuming doctrine', tone: 'diagnostic', isBug: true }
    case 'BUG_NORMALIZER_DROPPED_TRUTH':
      return { label: 'Normalizer dropped doctrine truth', tone: 'diagnostic', isBug: true }
    case 'BUG_STALE_SOURCE_WON':
      return { label: 'Stale source overrode doctrine', tone: 'diagnostic', isBug: true }
    case 'UNKNOWN_NEEDS_AUDIT':
      return { label: 'Needs audit', tone: 'warning', isBug: false }
    default:
      // Legacy generic blocked: explicitly demoted to "needs audit" so we
      // never render the unclassified yellow bubble. Older saved programs
      // without the classifier fall through here.
      return { label: 'Legacy blocked status', tone: 'warning', isBug: false }
  }
}

// =============================================================================
// [PHASE 4T] CANONICAL METHOD TALLY — DOMINANT CHIP-ROW SOURCE
// -----------------------------------------------------------------------------
// `visibleMethodTally` in AdaptiveSessionCard counts grouped-method chips from
// the body's `finalVisibleBodyModel`, which in turn reads
// `session.styleMetadata.styledGroups` plus row-level `method` /
// `setExecutionMethod` / `blockId` fields. Those signals are siblings of the
// canonical `session.methodStructures` array — the Phase 4P corridor writes
// both at the same time — so on healthy generations they agree.
//
// On UNHEALTHY paths (`BUG_NORMALIZER_DROPPED_TRUTH`, `BUG_STALE_SOURCE_WON`)
// they can disagree. The Phase G dominance contract is that, when canonical
// truth exists, the chip row reflects canonical — it does not contradict the
// classified Phase 4S delivery line directly below.
//
// `deriveCanonicalMethodTallyFromSurface` is the single pure derivation. It
// counts `applied` + `already_applied` entries by family on the canonical
// methodStructures array. It does not look at exercise rows, does not call
// any builder, does not mutate, and returns `hasCanonicalApplied=false`
// whenever the canonical array is missing/empty/has no applied entries — in
// which case the consumer keeps using legacy `visibleMethodTally` as a
// fallback so older saved programs still render.
// =============================================================================
export interface CanonicalMethodTally {
  superset: number
  circuit: number
  density: number
  cluster: number
  /**
   * `true` when the canonical surface contains at least one `applied` or
   * `already_applied` entry across any of the four chip-renderable families.
   * Consumers use this as the "should canonical dominate?" gate; when false,
   * they fall back to the legacy styledGroups-derived tally so older saved
   * programs (pre Phase 4P) still render their existing chips.
   */
  hasCanonicalApplied: boolean
  /**
   * `true` when canonical exists but has zero applied/already_applied entries
   * across the four chip families AND the canonical array is non-empty —
   * doctrine considered methods on this session and decided none applied as
   * grouped chips. Consumers use this to suppress contradictory legacy chips:
   * when this is true, the Phase 4S classified line owns the doctrine
   * narrative for the card.
   */
  canonicalSaysNoneApplied: boolean
}

/**
 * Map a `CanonicalMethodFamily` string onto the four chip families the card
 * actually renders. Returns `null` for row-level families that do not paint
 * a grouped chip (top_set, drop_set, rest_pause, prescription_*, etc.).
 *
 * `endurance_density` collapses to the `density` chip because the body
 * renderer paints it under the Density Block / Density Row palette.
 */
function mapCanonicalFamilyToChipKey(
  family: string | null | undefined,
): 'superset' | 'circuit' | 'density' | 'cluster' | null {
  switch (family) {
    case 'superset':
      return 'superset'
    case 'circuit':
      return 'circuit'
    case 'density_block':
    case 'endurance_density':
      return 'density'
    case 'cluster':
      return 'cluster'
    default:
      return null
  }
}

/**
 * Pure tally derivation. See module-level Phase 4T comment for the dominance
 * contract. Always returns a fully-populated tally object so callers can use
 * the result directly without null guards.
 */
export function deriveCanonicalMethodTallyFromSurface(
  surface:
    | Pick<SessionCardSurface, 'methodStructures' | 'doctrineBlockResolution'>
    | null
    | undefined,
): CanonicalMethodTally {
  const empty: CanonicalMethodTally = {
    superset: 0,
    circuit: 0,
    density: 0,
    cluster: 0,
    hasCanonicalApplied: false,
    canonicalSaysNoneApplied: false,
  }
  if (!surface) return empty
  const list = Array.isArray(surface.methodStructures) ? surface.methodStructures : []
  if (list.length === 0) {
    // No canonical opinion at all — caller falls back to legacy tally.
    return empty
  }
  let superset = 0
  let circuit = 0
  let density = 0
  let cluster = 0
  let appliedTotal = 0
  for (const ms of list) {
    if (!ms) continue
    if (ms.status !== 'applied' && ms.status !== 'already_applied') continue
    const chipKey = mapCanonicalFamilyToChipKey(ms.family)
    if (!chipKey) continue
    if (chipKey === 'superset') superset += 1
    else if (chipKey === 'circuit') circuit += 1
    else if (chipKey === 'density') density += 1
    else if (chipKey === 'cluster') cluster += 1
    appliedTotal += 1
  }
  return {
    superset,
    circuit,
    density,
    cluster,
    hasCanonicalApplied: appliedTotal > 0,
    canonicalSaysNoneApplied: appliedTotal === 0,
  }
}

/**
 * `true` when the surface carries any Phase 4Q classified entries. Used by
 * the card to decide whether to demote the legacy `doctrineCausalDisplay`
 * banner: when classified resolution exists, it owns the doctrine narrative
 * and the legacy banner can no longer contradict it.
 */
export function hasClassifiedDoctrineResolution(
  surface: Pick<SessionCardSurface, 'doctrineBlockResolution'> | null | undefined,
): boolean {
  if (!surface) return false
  const list = Array.isArray(surface.doctrineBlockResolution)
    ? surface.doctrineBlockResolution
    : []
  return list.length > 0
}

// =============================================================================
// [PHASE 4V] CANONICAL PROGRAM TRUTH PRESENCE GUARD
// -----------------------------------------------------------------------------
// Centralizes the "canonical wins" rule for the persistence/normalize/hydration
// corridor. Save (`saveAdaptiveProgram`) is `JSON.stringify`, load
// (`getLatestAdaptiveProgram`) is `JSON.parse`, and `normalizeProgramForDisplay`
// in `lib/program-state.ts` mechanically preserves every canonical field via
// `...spread` — so a fresh program reaches the page with `methodStructures`,
// `doctrineBlockResolution`, `methodMaterializationSummary`, and
// `doctrineBlockResolutionRollup` intact. But nothing today actively asserts
// those fields exist after the round-trip, and a future refactor that swaps
// a spread for a whitelisted field set would silently strip them.
//
// `hasCanonicalProgramTruth` is the centralized check the load corridor and
// Program page can both query without each rebuilding the test. It is the
// "canonical truth is present, do not let legacy fallback override it" rule
// distilled into one pure function.
//
// Pure: no hooks, no I/O, no state, no mutation. Inputs in, plain object out.
// =============================================================================

/**
 * Verdict object describing which canonical Phase 4P/4Q/4S signals are
 * populated on a given program. Consumers in the persistence corridor read
 * these to decide whether legacy fallback fields (styledGroups,
 * doctrineCausalDisplay, doctrineCausalChallenge, materializationStatus
 * banners) are allowed to paint anything user-visible.
 */
export interface CanonicalProgramTruthPresence {
  /** ≥1 session carries a non-empty `methodStructures` array. */
  hasMethodStructures: boolean
  /** ≥1 session carries a non-empty `doctrineBlockResolution` array. */
  hasDoctrineBlockResolution: boolean
  /** Program or any session carries a non-null
   *  `methodMaterializationSummary` (top-level or nested in
   *  `styleMetadata.methodMaterializationSummary`). */
  hasMethodMaterializationSummary: boolean
  /** Program carries a non-null `doctrineBlockResolutionRollup`. */
  hasDoctrineBlockResolutionRollup: boolean
  /** True iff ANY of the above signals are present. */
  programHasAnyCanonicalTruth: boolean
  /**
   * Per-session map: session.dayNumber → whether THAT session carries any
   * canonical truth. Lets the Program page gate per-card legacy fallback
   * while still letting older saved sessions render through compatibility
   * fallback.
   */
  sessionsWithCanonicalTruth: Record<number, boolean>
  /**
   * Stable code explaining the verdict for logs / blueprint evidence:
   *  - `CANONICAL_TRUTH_PRESENT` — at least one canonical signal found.
   *  - `LEGACY_PROGRAM_NO_CANONICAL_FIELDS` — older saved program; fallback
   *    is the only option and that is fine.
   *  - `EMPTY_PROGRAM` — null/undefined program input.
   */
  verdict:
    | 'CANONICAL_TRUTH_PRESENT'
    | 'LEGACY_PROGRAM_NO_CANONICAL_FIELDS'
    | 'EMPTY_PROGRAM'
}

/**
 * Pure presence check across the canonical Phase 4P/4Q/4S signal set. Reads
 * the program/session shape via narrow structural typings so it works on
 * raw `AdaptiveProgram` (where canonical fields are cast on via
 * `as unknown as`), `ProgramDisplayProjection` clones, and `SessionCardSurface`
 * outputs alike. Does not mutate inputs. Returns a fresh object every call.
 */
export function hasCanonicalProgramTruth(
  program:
    | {
        sessions?:
          | ReadonlyArray<{
              dayNumber?: number
              methodStructures?: unknown
              doctrineBlockResolution?: unknown
              styleMetadata?: { methodMaterializationSummary?: unknown } | null
            } | null | undefined>
          | null
        methodMaterializationSummary?: unknown
        doctrineBlockResolutionRollup?: unknown
      }
    | null
    | undefined,
): CanonicalProgramTruthPresence {
  if (!program) {
    return {
      hasMethodStructures: false,
      hasDoctrineBlockResolution: false,
      hasMethodMaterializationSummary: false,
      hasDoctrineBlockResolutionRollup: false,
      programHasAnyCanonicalTruth: false,
      sessionsWithCanonicalTruth: {},
      verdict: 'EMPTY_PROGRAM',
    }
  }
  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  let hasMethodStructures = false
  let hasDoctrineBlockResolution = false
  let hasSessionLevelSummary = false
  const sessionsWithCanonicalTruth: Record<number, boolean> = {}
  for (const s of sessions) {
    if (!s) continue
    const ms = (s as { methodStructures?: unknown }).methodStructures
    const msPresent = Array.isArray(ms) && ms.length > 0
    const dbr = (s as { doctrineBlockResolution?: unknown }).doctrineBlockResolution
    const dbrPresent = Array.isArray(dbr) && dbr.length > 0
    const mms = s.styleMetadata?.methodMaterializationSummary
    const mmsPresent = mms !== null && mms !== undefined
    if (msPresent) hasMethodStructures = true
    if (dbrPresent) hasDoctrineBlockResolution = true
    if (mmsPresent) hasSessionLevelSummary = true
    const day = typeof s.dayNumber === 'number' ? s.dayNumber : -1
    if (day >= 0) {
      sessionsWithCanonicalTruth[day] =
        msPresent || dbrPresent || mmsPresent || (sessionsWithCanonicalTruth[day] ?? false)
    }
  }
  const programLevelSummary =
    (program as { methodMaterializationSummary?: unknown }).methodMaterializationSummary
  const hasMethodMaterializationSummary =
    hasSessionLevelSummary || (programLevelSummary !== null && programLevelSummary !== undefined)
  const rollup =
    (program as { doctrineBlockResolutionRollup?: unknown }).doctrineBlockResolutionRollup
  const hasDoctrineBlockResolutionRollup = rollup !== null && rollup !== undefined
  const programHasAnyCanonicalTruth =
    hasMethodStructures ||
    hasDoctrineBlockResolution ||
    hasMethodMaterializationSummary ||
    hasDoctrineBlockResolutionRollup
  return {
    hasMethodStructures,
    hasDoctrineBlockResolution,
    hasMethodMaterializationSummary,
    hasDoctrineBlockResolutionRollup,
    programHasAnyCanonicalTruth,
    sessionsWithCanonicalTruth,
    verdict: programHasAnyCanonicalTruth
      ? 'CANONICAL_TRUTH_PRESENT'
      : 'LEGACY_PROGRAM_NO_CANONICAL_FIELDS',
  }
}

// =============================================================================
// [PHASE 4W] CANONICAL TRUTH DOWNGRADE DETECTION + GUARDED ENFORCEMENT
// -----------------------------------------------------------------------------
// Phase 4V wired `hasCanonicalProgramTruth` and a coarse "any canonical truth
// lost?" warning into `normalizeProgramForDisplay`. Phase 4W upgrades that
// observation into enforcement:
//
//   1. `detectCanonicalProgramTruthDowngrade(source, normalized)` returns
//      granular loss flags (per-signal + per-session-coverage) so the load
//      corridor catches *partial* downgrades, not just total ones.
//   2. `shouldThrowOnCanonicalTruthDowngrade()` follows the existing
//      `lib/env-validation.ts` convention (`process.env.NODE_ENV !==
//      'production'`) and additionally honors an explicit opt-in flag
//      `SPARTANLAB_STRICT_CANONICAL_TRUTH=true` for production smoke tests.
//      Reading `process.env.<KEY>` works on both server and client because
//      Next.js inlines defined env reads at build time; the call is wrapped
//      in a `try` so it cannot crash an exotic runtime.
//   3. `assertCanonicalProgramTruthPreserved()` is the call-site shim. It
//      throws a precise `PHASE_4W_CANONICAL_TRUTH_DOWNGRADE` error in
//      strict/dev mode and falls back to `console.error` (not just `warn`)
//      in production so logs are still loud but customers do not crash.
//
// Pure: no hooks, no state, no mutation. The only side effect is the
// optional throw / console.error inside `assertCanonicalProgramTruthPreserved`
// — which the call site decides to invoke.
// =============================================================================

/** Granular per-signal verdict describing exactly which canonical fields the
 *  normalize pass dropped. Every flag is `true` ONLY when the source had the
 *  field AND the normalized output lost it; legacy programs (source already
 *  empty) never trigger any flag. */
export interface CanonicalProgramTruthDowngrade {
  /** Source had ≥1 session with `methodStructures`; normalized has none. */
  lostMethodStructures: boolean
  /** Source had ≥1 session with `doctrineBlockResolution`; normalized has none. */
  lostDoctrineBlockResolution: boolean
  /** Source had `methodMaterializationSummary` somewhere; normalized has none. */
  lostMethodMaterializationSummary: boolean
  /** Source had `doctrineBlockResolutionRollup`; normalized has none. */
  lostDoctrineBlockResolutionRollup: boolean
  /** Number of sessions with canonical truth dropped (source - normalized). */
  lostCanonicalSessionCoverage: number
  /** Source side: how many sessions carried canonical truth. */
  sourceSessionsWithCanonicalTruth: number
  /** Normalized side: how many sessions still carry canonical truth. */
  normalizedSessionsWithCanonicalTruth: number
  /** True iff ANY of the per-signal `lost*` flags is true OR
   *  `lostCanonicalSessionCoverage > 0`. */
  isDowngrade: boolean
  /**
   * Stable short code summarizing the verdict for logs / errors:
   *  - `NO_DOWNGRADE` — canonical truth fully preserved (or source had none).
   *  - `PARTIAL_DOWNGRADE` — at least one signal lost but not all.
   *  - `TOTAL_DOWNGRADE` — every program-level signal the source had was lost.
   */
  verdict: 'NO_DOWNGRADE' | 'PARTIAL_DOWNGRADE' | 'TOTAL_DOWNGRADE'
}

/**
 * Pure granular downgrade detector. Compares two `CanonicalProgramTruthPresence`
 * verdicts (typically the source program vs. the normalized program) and
 * reports exactly which canonical signals were lost during normalization.
 *
 * Symmetric definition of "lost":
 *   - source flag is true AND normalized flag is false.
 *   - never the other direction (normalize cannot legitimately *add*
 *     canonical truth — there is no shadow builder authorized to do so).
 *
 * Per-session coverage is the count diff: if source had 5 sessions with
 * canonical truth and normalized has 3, that is `lostCanonicalSessionCoverage = 2`,
 * which is a partial downgrade even when all program-level signals are intact.
 */
export function detectCanonicalProgramTruthDowngrade(
  source: CanonicalProgramTruthPresence,
  normalized: CanonicalProgramTruthPresence,
): CanonicalProgramTruthDowngrade {
  const lostMethodStructures =
    source.hasMethodStructures && !normalized.hasMethodStructures
  const lostDoctrineBlockResolution =
    source.hasDoctrineBlockResolution && !normalized.hasDoctrineBlockResolution
  const lostMethodMaterializationSummary =
    source.hasMethodMaterializationSummary &&
    !normalized.hasMethodMaterializationSummary
  const lostDoctrineBlockResolutionRollup =
    source.hasDoctrineBlockResolutionRollup &&
    !normalized.hasDoctrineBlockResolutionRollup
  const sourceSessionsWithCanonicalTruth = Object.values(
    source.sessionsWithCanonicalTruth,
  ).filter(Boolean).length
  const normalizedSessionsWithCanonicalTruth = Object.values(
    normalized.sessionsWithCanonicalTruth,
  ).filter(Boolean).length
  const lostCanonicalSessionCoverage = Math.max(
    0,
    sourceSessionsWithCanonicalTruth - normalizedSessionsWithCanonicalTruth,
  )
  const lostFlags = [
    lostMethodStructures,
    lostDoctrineBlockResolution,
    lostMethodMaterializationSummary,
    lostDoctrineBlockResolutionRollup,
  ]
  const lostCount = lostFlags.filter(Boolean).length
  const sourceProgramLevelSignalCount = [
    source.hasMethodStructures,
    source.hasDoctrineBlockResolution,
    source.hasMethodMaterializationSummary,
    source.hasDoctrineBlockResolutionRollup,
  ].filter(Boolean).length
  const isDowngrade = lostCount > 0 || lostCanonicalSessionCoverage > 0
  let verdict: CanonicalProgramTruthDowngrade['verdict']
  if (!isDowngrade) verdict = 'NO_DOWNGRADE'
  else if (
    sourceProgramLevelSignalCount > 0 &&
    lostCount === sourceProgramLevelSignalCount
  )
    verdict = 'TOTAL_DOWNGRADE'
  else verdict = 'PARTIAL_DOWNGRADE'
  return {
    lostMethodStructures,
    lostDoctrineBlockResolution,
    lostMethodMaterializationSummary,
    lostDoctrineBlockResolutionRollup,
    lostCanonicalSessionCoverage,
    sourceSessionsWithCanonicalTruth,
    normalizedSessionsWithCanonicalTruth,
    isDowngrade,
    verdict,
  }
}

/**
 * Returns true when the runtime is a development/test build OR an explicit
 * strict-mode flag is set. Mirrors `lib/env-validation.ts`'s
 * `process.env.NODE_ENV !== 'production'` convention. Wrapped in a try so
 * runtimes that lack `process` (e.g. pre-bundle edge eval) cannot crash.
 */
export function shouldThrowOnCanonicalTruthDowngrade(): boolean {
  try {
    const nodeEnv =
      typeof process !== 'undefined' && process?.env
        ? process.env.NODE_ENV
        : undefined
    if (nodeEnv !== 'production') return true
    const strict =
      typeof process !== 'undefined' && process?.env
        ? process.env.SPARTANLAB_STRICT_CANONICAL_TRUTH
        : undefined
    return strict === 'true' || strict === '1'
  } catch {
    return false
  }
}

/**
 * Call-site shim used by `normalizeProgramForDisplay` (and any future load
 * corridor checkpoint). Throws a precise `Error` in dev/strict mode when
 * canonical truth is downgraded, otherwise emits a structured
 * `console.error` so production logs still capture the regression without
 * crashing customer renders.
 *
 * Will NOT throw / error when:
 *  - `downgrade.isDowngrade === false` (canonical truth preserved)
 *  - source had no canonical truth at all (legacy program)
 */
export function assertCanonicalProgramTruthPreserved(args: {
  source: CanonicalProgramTruthPresence
  normalized: CanonicalProgramTruthPresence
  downgrade: CanonicalProgramTruthDowngrade
  context?: string
}): void {
  const { source, normalized, downgrade, context } = args
  if (!downgrade.isDowngrade) return
  if (!source.programHasAnyCanonicalTruth) return // legacy: nothing to preserve
  const lostList = [
    downgrade.lostMethodStructures && 'methodStructures',
    downgrade.lostDoctrineBlockResolution && 'doctrineBlockResolution',
    downgrade.lostMethodMaterializationSummary && 'methodMaterializationSummary',
    downgrade.lostDoctrineBlockResolutionRollup && 'doctrineBlockResolutionRollup',
    downgrade.lostCanonicalSessionCoverage > 0 &&
      `sessionCoverage(-${downgrade.lostCanonicalSessionCoverage})`,
  ]
    .filter(Boolean)
    .join(',')
  const message =
    `PHASE_4W_CANONICAL_TRUTH_DOWNGRADE: ${context ?? 'normalizeProgramForDisplay'} ` +
    `stripped canonical program truth. Source verdict: ${source.verdict}. ` +
    `Normalized verdict: ${normalized.verdict}. Lost: [${lostList}]. ` +
    `Downgrade kind: ${downgrade.verdict}.`
  if (shouldThrowOnCanonicalTruthDowngrade()) {
    throw new Error(message)
  }
  // Production fallback: structured error log instead of crash.
  // eslint-disable-next-line no-console
  console.error('[PHASE_4W_CANONICAL_TRUTH_DOWNGRADE]', {
    message,
    source,
    normalized,
    downgrade,
  })
}

// =============================================================================
// [PHASE 4U] CANONICAL METHOD BODY RENDER RESOLUTION
// -----------------------------------------------------------------------------
// Phase 4S/4T proved that canonical `methodStructures` reach the card surface
// and dominate the chip-tally rows + suppress the legacy doctrine banner. The
// remaining Phase G work is to PROVE the actual visible body is consuming
// canonical truth, not silently rendering off a parallel/stale source.
//
// On healthy generations, the body's render blocks (rich `renderBlocks` from
// styledGroups, raw fallback from `safeExercises[].blockId + .method`) all
// derive from the SAME Phase 4P corridor that writes `methodStructures`. So
// canonical methodStructures and the body's grouped blocks should describe
// the same exercises with the same block identities. This resolver is the
// proof: it matches each canonical methodStructure's `exerciseIds[]` against
// the rows the body actually renders, and reports any divergence with an
// exact reason instead of silently falling back.
//
// Pure: no hooks, no state, no async, no I/O, no mutation. Inputs in, plain
// JSON-safe object out. Consumers store the result on the card surface or
// run it inline; either way the resolver itself does nothing observable.
// =============================================================================

/**
 * One unmatched canonical methodStructure with the precise reason it could
 * not bind to real exercise rows. The reason codes are stable strings so the
 * blueprint and any future audit can pattern-match without parsing prose.
 */
export interface CanonicalMethodUnmatchedStructure {
  /** `id` of the canonical methodStructure (e.g. `method-superset-day1-0`). */
  id: string
  /** Family the structure described. */
  family: CanonicalMethodStructure['family']
  /** Visible label of the structure. */
  label: string
  /**
   * Exact reason the structure could not contribute a renderable group:
   *  - `NO_EXERCISE_REFS_ON_METHOD_STRUCTURE` — `exerciseIds[]` empty AND
   *    `exerciseNames[]` empty. Common for `not_needed` / `no_safe_target`
   *    entries; not a bug.
   *  - `EXERCISE_REF_NOT_FOUND_IN_SESSION_ROWS` — refs exist but none of
   *    them resolve against the session's row list (id or name lookup).
   *    This is the bug case: canonical truth claims exercises that the
   *    display row list cannot find.
   *  - `METHOD_STRUCTURE_NOT_BODY_RENDERABLE` — family is row-level
   *    (`top_set` / `drop_set` / `rest_pause` / `prescription_*` /
   *    `straight_sets` / `endurance_density`); not a grouped block.
   *  - `BLOCKED_OR_NOT_APPLIED` — status is `blocked` / `not_needed` /
   *    `no_safe_target` / `not_connected` / `error`; doctrine intentionally
   *    did not paint a group.
   *  - `LEGACY_STRUCTURE_WITHOUT_MEMBERS` — grouped family but only one
   *    matched member; cannot render as a multi-member block.
   */
  reason:
    | 'NO_EXERCISE_REFS_ON_METHOD_STRUCTURE'
    | 'EXERCISE_REF_NOT_FOUND_IN_SESSION_ROWS'
    | 'METHOD_STRUCTURE_NOT_BODY_RENDERABLE'
    | 'BLOCKED_OR_NOT_APPLIED'
    | 'LEGACY_STRUCTURE_WITHOUT_MEMBERS'
  /** How many of `exerciseIds[]` matched a session row (zero unless partial). */
  matchedRowCount: number
  /** How many refs were declared on the structure. */
  refCount: number
}

/**
 * One canonical methodStructure that successfully bound to ≥2 real session
 * rows, paired with the row IDs it owns. The consumer can use these IDs to
 * cross-check that the body's rendered block list is in fact backed by
 * canonical truth.
 */
export interface CanonicalMethodRenderableGroup {
  /** Stable id of the source methodStructure. */
  structureId: string
  /** Family of the source methodStructure (always a grouped family here). */
  family: 'superset' | 'circuit' | 'density_block' | 'cluster'
  /** Visible label inherited from the methodStructure. */
  label: string
  /**
   * Matched row IDs in the order the methodStructure declared them. The
   * consumer trusts the methodStructure's order; it does not re-rank rows.
   */
  matchedRowIds: string[]
  /** Matched display names paired 1:1 with `matchedRowIds`. */
  matchedRowNames: string[]
  /**
   * `id` if every member matched by exact id, `name` if any member matched
   * by normalized-name fallback, `mixed` if both. Useful to spot data drift.
   */
  matchKind: 'id' | 'name' | 'mixed'
}

export type CanonicalMethodRenderSource =
  | 'canonical_method_structures'
  | 'styled_groups_fallback'
  | 'ungrouped_fallback'

export type CanonicalMethodRenderStatus =
  | 'complete'
  | 'partial'
  | 'fallback'
  | 'empty'

/**
 * Output of {@link resolveCanonicalMethodBodyRender}. Consumers read `source`
 * and `status` to make a single decision about visible body ownership; the
 * arrays expose the underlying mapping for proof, debugging, and the
 * blueprint's Phase G evidence.
 */
export interface CanonicalMethodBodyRenderResolution {
  /**
   * Which input drove (or would have driven, given equivalence) the visible
   * body's grouping. `canonical_method_structures` when canonical truth
   * exists and binds to real rows; `styled_groups_fallback` when the body's
   * rendered blocks exist but canonical did not produce a matching group;
   * `ungrouped_fallback` when no groups rendered and canonical has nothing
   * grouped to say either.
   */
  source: CanonicalMethodRenderSource
  /**
   * Resolution completeness: `complete` every grouped applied structure
   * matched rows; `partial` some matched and some didn't; `fallback` no
   * canonical applied groups but the body still rendered something; `empty`
   * truly nothing on either side.
   */
  status: CanonicalMethodRenderStatus
  /** Canonical methodStructures that successfully bound to ≥2 rows. */
  renderedGroups: CanonicalMethodRenderableGroup[]
  /** Canonical methodStructures that could NOT bind, with exact reasons. */
  unmatchedStructures: CanonicalMethodUnmatchedStructure[]
  /** How many session rows were matched into any canonical group. */
  matchedExerciseCount: number
  /** Total non-empty methodStructures examined (any status, any family). */
  canonicalStructureCount: number
  /**
   * `true` when the consumer fell back to `styled_groups_fallback` /
   * `ungrouped_fallback` because canonical did not produce a renderable
   * group set. Always `false` when `source === 'canonical_method_structures'`.
   */
  fallbackUsed: boolean
  /**
   * Stable code explaining why fallback was used. `null` when not in
   * fallback. Possible values:
   *  - `NO_CANONICAL_METHOD_STRUCTURES` — surface had no methodStructures.
   *  - `NO_GROUPED_FAMILY_APPLIED` — canonical exists but no
   *    `applied`/`already_applied` entries in grouped families.
   *  - `ALL_CANONICAL_GROUPS_FAILED_TO_BIND` — grouped applied entries
   *    existed but none bound to the row list (data drift or stale rows).
   */
  fallbackReason:
    | 'NO_CANONICAL_METHOD_STRUCTURES'
    | 'NO_GROUPED_FAMILY_APPLIED'
    | 'ALL_CANONICAL_GROUPS_FAILED_TO_BIND'
    | null
  /**
   * Free-form short codes the consumer can log/surface in dev probes. Stable
   * across calls so blueprint snapshots can diff them. Examples:
   *  `EXAMINED_3_STRUCTURES`, `BOUND_2_GROUPS`, `2_BOUND_BY_ID`,
   *  `1_UNMATCHED_BY_REF_NOT_FOUND`.
   */
  debugReasons: string[]
  /**
   * When the consumer ALSO has the body's rendered block list available, the
   * resolver populates this with `true` iff every rendered block correlates
   * to at least one canonical renderable group by exercise-id intersection.
   * `null` when the consumer did not pass `renderedBlockMembers`. This is
   * the strongest "the visible body IS canonical" proof bit.
   */
  bodyBlocksMatchCanonical: boolean | null
}

/**
 * Minimal row shape the resolver needs. Fully a subset of `safeExercises` /
 * `fullVisibleExercises` from `AdaptiveSessionCard`, kept tiny so the
 * resolver has no opinion about ExerciseRowSurface or full AdaptiveExercise.
 */
export interface CanonicalMethodResolverRow {
  id: string
  name: string
}

/**
 * Optional rendered-block descriptor the consumer can pass when it has the
 * body's actual render output handy. Lets the resolver compute the
 * `bodyBlocksMatchCanonical` cross-check.
 */
export interface CanonicalMethodResolverRenderedBlock {
  /** Member exercise IDs the body block is currently painting. */
  memberIds: string[]
  /** Group type the body block is painting. */
  groupType: 'superset' | 'circuit' | 'density_block' | 'cluster' | string
}

/**
 * Normalize a name for fallback matching. Mirrors the same shape used by the
 * `synthesizedRawFallbackBlocks` member matcher in `AdaptiveSessionCard` so
 * we get the same hit rate. Lowercased, alphanumerics only, single spaces.
 */
function normalizeNameForMatch(s: string | null | undefined): string {
  if (typeof s !== 'string') return ''
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Pure resolver. Given canonical methodStructures + the actual exercise rows
 * the body is rendering (and optionally the body's already-built block list),
 * return a {@link CanonicalMethodBodyRenderResolution} describing whether
 * the visible body is in fact backed by canonical truth or relying on a
 * legacy/fallback path.
 *
 * Rules:
 *  1. Match priority: stable `id` first, normalized name second. No fuzzy
 *     match. No method-type-only match. No invented rows. No reordering.
 *  2. A grouped family with <2 matched rows is `LEGACY_STRUCTURE_WITHOUT_MEMBERS`.
 *  3. Status is `complete` only when EVERY grouped applied/already_applied
 *     structure bound to ≥2 rows AND (when blocks were passed) every
 *     rendered block correlates to a canonical group.
 *  4. The resolver never mutates inputs and never throws.
 */
export function resolveCanonicalMethodBodyRender(
  methodStructures: ReadonlyArray<CanonicalMethodStructure> | null | undefined,
  rows: ReadonlyArray<CanonicalMethodResolverRow> | null | undefined,
  renderedBlockMembers?: ReadonlyArray<CanonicalMethodResolverRenderedBlock> | null,
): CanonicalMethodBodyRenderResolution {
  const debugReasons: string[] = []
  const list = Array.isArray(methodStructures) ? methodStructures : []
  const safeRows = Array.isArray(rows) ? rows : []
  const blocks = Array.isArray(renderedBlockMembers) ? renderedBlockMembers : []
  // Empty-empty fast path.
  if (list.length === 0 && safeRows.length === 0) {
    return {
      source: 'ungrouped_fallback',
      status: 'empty',
      renderedGroups: [],
      unmatchedStructures: [],
      matchedExerciseCount: 0,
      canonicalStructureCount: 0,
      fallbackUsed: true,
      fallbackReason: 'NO_CANONICAL_METHOD_STRUCTURES',
      debugReasons: ['NO_CANONICAL_AND_NO_ROWS'],
      bodyBlocksMatchCanonical: blocks.length === 0 ? null : false,
    }
  }
  // Build row lookup tables.
  const rowsById = new Map<string, CanonicalMethodResolverRow>()
  const rowsByName = new Map<string, CanonicalMethodResolverRow>()
  for (const r of safeRows) {
    if (!r) continue
    if (typeof r.id === 'string' && r.id.length > 0) rowsById.set(r.id, r)
    const norm = normalizeNameForMatch(r.name)
    if (norm.length >= 2 && !rowsByName.has(norm)) rowsByName.set(norm, r)
  }
  debugReasons.push(`EXAMINED_${list.length}_STRUCTURES`)
  debugReasons.push(`ROW_INDEX_${safeRows.length}`)
  // Iterate canonical structures.
  const renderedGroups: CanonicalMethodRenderableGroup[] = []
  const unmatchedStructures: CanonicalMethodUnmatchedStructure[] = []
  const matchedRowIdSet = new Set<string>()
  let groupedAppliedCount = 0
  let boundById = 0
  let boundByName = 0
  for (const ms of list) {
    if (!ms) continue
    const isGroupedFamily =
      ms.family === 'superset' ||
      ms.family === 'circuit' ||
      ms.family === 'density_block' ||
      ms.family === 'cluster'
    const isApplied = ms.status === 'applied' || ms.status === 'already_applied'
    if (!isApplied) {
      unmatchedStructures.push({
        id: ms.id,
        family: ms.family,
        label: ms.label,
        reason: 'BLOCKED_OR_NOT_APPLIED',
        matchedRowCount: 0,
        refCount:
          (Array.isArray(ms.exerciseIds) ? ms.exerciseIds.length : 0) +
          (Array.isArray(ms.exerciseNames) ? ms.exerciseNames.length : 0),
      })
      continue
    }
    if (!isGroupedFamily) {
      unmatchedStructures.push({
        id: ms.id,
        family: ms.family,
        label: ms.label,
        reason: 'METHOD_STRUCTURE_NOT_BODY_RENDERABLE',
        matchedRowCount: 0,
        refCount:
          (Array.isArray(ms.exerciseIds) ? ms.exerciseIds.length : 0) +
          (Array.isArray(ms.exerciseNames) ? ms.exerciseNames.length : 0),
      })
      continue
    }
    groupedAppliedCount += 1
    const refIds = Array.isArray(ms.exerciseIds) ? ms.exerciseIds : []
    const refNames = Array.isArray(ms.exerciseNames) ? ms.exerciseNames : []
    if (refIds.length === 0 && refNames.length === 0) {
      unmatchedStructures.push({
        id: ms.id,
        family: ms.family,
        label: ms.label,
        reason: 'NO_EXERCISE_REFS_ON_METHOD_STRUCTURE',
        matchedRowCount: 0,
        refCount: 0,
      })
      continue
    }
    // Try matching: id first, then normalized name fallback when id missed.
    // Iterate the longer of the two ref arrays so a methodStructure can
    // declare members by id OR by name and we still bind every entry.
    const refLen = Math.max(refIds.length, refNames.length)
    const matchedRowIds: string[] = []
    const matchedRowNames: string[] = []
    let kindIds = 0
    let kindNames = 0
    for (let i = 0; i < refLen; i++) {
      const refId = i < refIds.length ? refIds[i] : undefined
      const refName = i < refNames.length ? refNames[i] : undefined
      let row: CanonicalMethodResolverRow | undefined
      if (refId && rowsById.has(refId)) {
        row = rowsById.get(refId)
        kindIds += 1
      } else if (refName) {
        const norm = normalizeNameForMatch(refName)
        if (norm.length >= 2 && rowsByName.has(norm)) {
          row = rowsByName.get(norm)
          kindNames += 1
        }
      }
      if (row && !matchedRowIds.includes(row.id)) {
        matchedRowIds.push(row.id)
        matchedRowNames.push(row.name)
        matchedRowIdSet.add(row.id)
      }
    }
    if (matchedRowIds.length < 2) {
      unmatchedStructures.push({
        id: ms.id,
        family: ms.family,
        label: ms.label,
        reason:
          matchedRowIds.length === 0
            ? 'EXERCISE_REF_NOT_FOUND_IN_SESSION_ROWS'
            : 'LEGACY_STRUCTURE_WITHOUT_MEMBERS',
        matchedRowCount: matchedRowIds.length,
        refCount: refLen,
      })
      continue
    }
    const matchKind: 'id' | 'name' | 'mixed' =
      kindIds > 0 && kindNames > 0 ? 'mixed' : kindNames > 0 ? 'name' : 'id'
    if (matchKind === 'id') boundById += 1
    if (matchKind === 'name') boundByName += 1
    renderedGroups.push({
      structureId: ms.id,
      family: ms.family as CanonicalMethodRenderableGroup['family'],
      label: ms.label,
      matchedRowIds,
      matchedRowNames,
      matchKind,
    })
  }
  if (boundById > 0) debugReasons.push(`${boundById}_BOUND_BY_ID`)
  if (boundByName > 0) debugReasons.push(`${boundByName}_BOUND_BY_NAME`)
  debugReasons.push(`BOUND_${renderedGroups.length}_GROUPS`)
  if (unmatchedStructures.length > 0) {
    debugReasons.push(`UNMATCHED_${unmatchedStructures.length}`)
  }
  // Cross-check rendered blocks against canonical groups when supplied.
  let bodyBlocksMatchCanonical: boolean | null = null
  if (blocks.length > 0) {
    if (renderedGroups.length === 0) {
      bodyBlocksMatchCanonical = false
    } else {
      const canonicalIdSets = renderedGroups.map(g => new Set(g.matchedRowIds))
      let allBlocksCorrelate = true
      for (const b of blocks) {
        const memberIds = Array.isArray(b.memberIds) ? b.memberIds : []
        const overlaps = canonicalIdSets.some(set =>
          memberIds.some(id => set.has(id)),
        )
        if (!overlaps) {
          allBlocksCorrelate = false
          break
        }
      }
      bodyBlocksMatchCanonical = allBlocksCorrelate
      debugReasons.push(
        allBlocksCorrelate
          ? 'BODY_BLOCKS_MATCH_CANONICAL'
          : 'BODY_BLOCKS_DIVERGE_FROM_CANONICAL',
      )
    }
  }
  // Source + status verdict.
  const canonicalStructureCount = list.length
  const matchedExerciseCount = matchedRowIdSet.size
  if (canonicalStructureCount === 0) {
    return {
      source: blocks.length > 0 ? 'styled_groups_fallback' : 'ungrouped_fallback',
      status: blocks.length > 0 ? 'fallback' : 'empty',
      renderedGroups: [],
      unmatchedStructures: [],
      matchedExerciseCount: 0,
      canonicalStructureCount: 0,
      fallbackUsed: true,
      fallbackReason: 'NO_CANONICAL_METHOD_STRUCTURES',
      debugReasons: ['NO_CANONICAL_METHOD_STRUCTURES', ...debugReasons],
      bodyBlocksMatchCanonical,
    }
  }
  if (groupedAppliedCount === 0) {
    return {
      source: blocks.length > 0 ? 'styled_groups_fallback' : 'ungrouped_fallback',
      status: blocks.length > 0 ? 'fallback' : 'empty',
      renderedGroups: [],
      unmatchedStructures,
      matchedExerciseCount: 0,
      canonicalStructureCount,
      fallbackUsed: true,
      fallbackReason: 'NO_GROUPED_FAMILY_APPLIED',
      debugReasons,
      bodyBlocksMatchCanonical,
    }
  }
  if (renderedGroups.length === 0) {
    return {
      source: blocks.length > 0 ? 'styled_groups_fallback' : 'ungrouped_fallback',
      status: blocks.length > 0 ? 'fallback' : 'empty',
      renderedGroups: [],
      unmatchedStructures,
      matchedExerciseCount: 0,
      canonicalStructureCount,
      fallbackUsed: true,
      fallbackReason: 'ALL_CANONICAL_GROUPS_FAILED_TO_BIND',
      debugReasons,
      bodyBlocksMatchCanonical,
    }
  }
  // At least one canonical group bound. Source is canonical. Status is
  // `complete` iff every grouped applied entry succeeded AND (when blocks
  // were passed) the body's blocks correlate to canonical groups.
  const everyAppliedMatched =
    unmatchedStructures.filter(
      u =>
        u.reason !== 'BLOCKED_OR_NOT_APPLIED' &&
        u.reason !== 'METHOD_STRUCTURE_NOT_BODY_RENDERABLE',
    ).length === 0
  const blockProofOk =
    bodyBlocksMatchCanonical === null || bodyBlocksMatchCanonical === true
  const statusVerdict: CanonicalMethodRenderStatus =
    everyAppliedMatched && blockProofOk ? 'complete' : 'partial'
  return {
    source: 'canonical_method_structures',
    status: statusVerdict,
    renderedGroups,
    unmatchedStructures,
    matchedExerciseCount,
    canonicalStructureCount,
    fallbackUsed: false,
    fallbackReason: null,
    debugReasons,
    bodyBlocksMatchCanonical,
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
  whyLine: string | null  // Selection reason, refined by intent (SUMMARY - visible on card)
  detailExplanation: string | null  // Richer purpose + effort reasoning (DETAIL - for info bubble)
  
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
  },
  // [RICH-EXPLANATION-FIX] Session context enables richer explanation output from purpose/effort builders
  sessionContext?: {
    sessionFocus?: string
    isPrimarySession?: boolean
    primaryGoal?: string
    compositionMetadata?: {
      spineSessionType?: string
      sessionIntent?: string
    }
  }
): ExerciseCardDisplayContract {
  const nameLower = exercise.name.toLowerCase()
  // [WEEK-SCALING-FIX] exercise.repsOrTime contains week-scaled value from caller
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
  // [WEEK-SCALING-FIX] exercise.targetRPE contains week-scaled value from caller
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
  // [WEEK-SCALING-FIX] exercise.sets and exercise.repsOrTime contain week-scaled values from caller
  const prescriptionLine = `${exercise.sets} × ${exercise.repsOrTime}`
  
  // [AUTHORITATIVE] Intensity badge - compact effort reasoning from single source of truth
  // [WEEK-SCALING-FIX] exercise.targetRPE contains week-scaled value from caller
  // [RPE-DISPLAY-CLEANLINESS-LOCK] Round to a clean coaching integer for display.
  // Internally targetRPE may be 7.7 / 8.4 / etc. (week-scaling math, recovery
  // adjustments, role-cap softening), but user-facing prescription must read
  // as an integer in {6,7,8,9,10}. Branching below uses === comparisons so
  // decimals would route to the FALLBACK and look incoherent ("RPE 7.7 ·
  // sustainable challenge" beside a row that says "RPE 8 · hard set"). All
  // 16 template strings below now consume `rpe` (rounded), not the raw value.
  // Floor to keep the prescription on the conservative side of any half-step.
  let intensityBadge: string | null = null
  if (exercise.targetRPE) {
    const rawRpe = exercise.targetRPE
    const rpe = Math.max(5, Math.min(10, Math.round(rawRpe)))
    const catLower = categoryLower
    const exprMode = expressionMode
    const roleSession = (exercise.coachingMeta?.roleInSession || '').toLowerCase()
    const isProtected = (exercise.selectionReason || '').toLowerCase().includes('protect')
    
    // PRIORITY 1: Protection / tissue management
    if (isProtected || prescriptionIntent === 'protection') {
      intensityBadge = rpe <= 7 
        ? `RPE ${rpe} · tissue-safe load`
        : `RPE ${rpe} · managed for longevity`
    }
    // PRIORITY 2: Skill / primary work - technique-gated
    // [SEMANTIC-TRUTH-FIX] RPE 8 is demanding work (2-3 from failure) - wording must reflect that
    else if (prescriptionIntent === 'skill_acquisition' || prescriptionIntent === 'skill_intensity' || catLower === 'skill' || exprMode.includes('direct') || exprMode.includes('primary')) {
      if (rpe <= 6) {
        intensityBadge = `RPE ${rpe} · controlled technique focus`
      } else if (rpe === 7) {
        intensityBadge = `RPE ${rpe} · clean reps, moderate effort`
      } else if (rpe === 8) {
        intensityBadge = `RPE ${rpe} · hard set, maintain form`
      } else {
        intensityBadge = `RPE ${rpe} · max effort, respect limits`
      }
    }
    // PRIORITY 3: Strength / overload slots
    else if (prescriptionIntent === 'max_strength' || catLower === 'strength' || catLower === 'push' || catLower === 'pull') {
      if (rpe >= 9) {
        intensityBadge = `RPE ${rpe} · main overload`
      } else if (rpe <= 7) {
        intensityBadge = `RPE ${rpe} · repeatable output`
      } else {
        intensityBadge = `RPE ${rpe} · strength stimulus`
      }
    }
    // PRIORITY 4: Support / accessory - fatigue-managed
    else if (prescriptionIntent === 'support_strength' || prescriptionIntent === 'hypertrophy' || catLower === 'accessory' || exprMode.includes('support') || roleSession.includes('support')) {
      if (rpe <= 7) {
        intensityBadge = `RPE ${rpe} · capacity without fatigue debt`
      } else {
        intensityBadge = `RPE ${rpe} · volume for growth`
      }
    }
    // PRIORITY 5: Core
    // [SEMANTIC-TRUTH-FIX] RPE-aligned core work descriptors
    else if (catLower === 'core') {
      if (rpe <= 6) {
        intensityBadge = `RPE ${rpe} · trunk stability focus`
      } else if (rpe === 7) {
        intensityBadge = `RPE ${rpe} · controlled core work`
      } else {
        intensityBadge = `RPE ${rpe} · demanding core set`
      }
    }
    // PRIORITY 6: Mobility
    else if (catLower === 'mobility' || catLower === 'flexibility') {
      intensityBadge = `position quality focus`
    }
    // FALLBACK: Still meaningful, not generic "(moderate)"
    else {
      if (rpe <= 6) {
        intensityBadge = `RPE ${rpe} · controlled effort`
      } else if (rpe === 7) {
        intensityBadge = `RPE ${rpe} · sustainable challenge`
      } else if (rpe === 8) {
        intensityBadge = `RPE ${rpe} · productive intensity`
      } else {
        intensityBadge = `RPE ${rpe} · near-limit intent`
      }
    }
  }
  
  // Load badge - only if weighted
  const loadBadge = exercise.prescribedLoad?.load && exercise.prescribedLoad.load > 0 
    ? `+${exercise.prescribedLoad.load} ${exercise.prescribedLoad.unit}` 
    : null
  
  // [AUTHORITATIVE] Rest guidance - explain WHY this rest, not just the duration
  let restGuidance: string | null = null
  if (exercise.coachingMeta?.restLabel) {
    restGuidance = exercise.coachingMeta.restLabel
  } else if (exercise.restSeconds) {
    const mins = Math.round(exercise.restSeconds / 60)
    // Derive rest reasoning from prescription intent + duration
    if (exercise.restSeconds >= 180) {
      // Long rest = output/power/skill quality
      if (prescriptionIntent === 'max_strength' || prescriptionIntent === 'explosive_power') {
        restGuidance = `${mins}+ min — full recovery for output`
      } else if (prescriptionIntent === 'skill_intensity' || prescriptionIntent === 'skill_acquisition') {
        restGuidance = `${mins}+ min — clean reps require fresh attempts`
      } else {
        restGuidance = `${mins}+ min rest`
      }
    } else if (exercise.restSeconds >= 120) {
      // Medium-long rest
      if (prescriptionIntent === 'max_strength' || prescriptionIntent === 'strength_volume') {
        restGuidance = `${mins}-${mins + 1} min — keeps sets productive`
      } else if (prescriptionIntent === 'technical_carryover') {
        restGuidance = `${mins}-${mins + 1} min — quality over fatigue`
      } else {
        restGuidance = `${mins}-${mins + 1} min`
      }
    } else if (exercise.restSeconds >= 60) {
      // Shorter rest
      if (prescriptionIntent === 'hypertrophy') {
        restGuidance = `${exercise.restSeconds}s — metabolic tension`
      } else if (prescriptionIntent === 'support_strength') {
        restGuidance = `${exercise.restSeconds}s — efficient volume`
      } else {
        restGuidance = `${exercise.restSeconds}s rest`
      }
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
    // [POLISH] Natural coaching language, not formulaic system text
    if (refined.length < 20 || refined.toLowerCase().includes('selected for')) {
      const intentContext: Record<PrescriptionIntent, string> = {
        max_strength: 'Heavy work builds the neural drive your skills depend on',
        strength_volume: 'Moderate loads accumulate the structural gains you need',
        skill_acquisition: 'Practice builds the positions your body learns to own',
        skill_intensity: 'Pushing skill ceiling while protecting technique',
        explosive_power: 'Developing the power and speed your skills require',
        hypertrophy: 'Building the muscle that powers harder progressions',
        support_strength: 'Joint health and balance under load',
        technical_carryover: 'Direct carryover to your target skill',
        tissue_prep: 'Warming the structures that do the real work',
        density_conditioning: 'Building work capacity without intensity cost',
      }
      refined = intentContext[prescriptionIntent]
    }
    
    // Further refine support work based on exercise characteristics
    // [POLISH] Natural coaching language for accessory/support roles
    if (prescriptionIntent === 'support_strength' && reason) {
      const reasonLowerCheck = reason.toLowerCase()
      if (reasonLowerCheck.includes('scap') || reasonLowerCheck.includes('shoulder')) {
        refined = 'Scapular control supports cleaner overhead positions'
      } else if (reasonLowerCheck.includes('rear delt') || reasonLowerCheck.includes('face pull')) {
        refined = 'Balances the shoulders against all that pressing'
      } else if (reasonLowerCheck.includes('core') || reasonLowerCheck.includes('trunk') || reasonLowerCheck.includes('compression')) {
        refined = 'Trunk strength transfers force to your limbs'
      } else if (reasonLowerCheck.includes('grip') || reasonLowerCheck.includes('hang')) {
        refined = 'Grip work means more effective working sets'
      } else if (reasonLowerCheck.includes('hip') || reasonLowerCheck.includes('glute')) {
        refined = 'Hip strength anchors full-body tension'
      }
    }
    
    whyLine = refined.length > 80 ? refined.substring(0, 77) + '...' : refined
  }
  
  // [RICH-EXPLANATION] Build detail explanation from purpose + effort builders
  // This is the RICHER content for the info bubble, fed by existing sophisticated builders
  // [SCOPE-FIX] Use outer-scope categoryLower / expressionMode — always defined regardless of targetRPE presence.
  // catLower / exprMode were declared inside if(exercise.targetRPE) and caused ReferenceError when RPE absent.
  const isPrimaryCategory = categoryLower === 'skill' || categoryLower === 'strength'
  const categoryRole = categoryLower === 'skill' ? 'primary' : categoryLower === 'strength' ? 'secondary' : 'support'

  const purposeLineRich = buildExercisePurposeLine(
    { 
      name: exercise.name, 
      category: exercise.category, 
      selectionReason: exercise.selectionReason,
      isPrimary: isPrimaryCategory,
      coachingMeta: exercise.coachingMeta
    },
    sessionContext, // [RICH-EXPLANATION-FIX] Now receives real session context for goal-aware reasoning
    categoryRole
  )
  
  const effortLineRich = buildExerciseEffortReasonLine(
    {
      name: exercise.name,
      category: exercise.category,
      targetRPE: exercise.targetRPE,
      selectionReason: exercise.selectionReason,
      isPrimary: isPrimaryCategory,
      coachingMeta: exercise.coachingMeta
    },
    sessionContext // [RICH-EXPLANATION-FIX] Now receives real session context
  )
  
  // Compose detail explanation: purpose + effort, avoiding redundancy
  let detailExplanation: string | null = null
  if (purposeLineRich && effortLineRich) {
    // Only combine if they add different information
    const purposeLower = purposeLineRich.toLowerCase()
    const effortLower = effortLineRich.toLowerCase()
    if (!purposeLower.includes(effortLower.substring(0, 20)) && 
        !effortLower.includes(purposeLower.substring(0, 20))) {
      detailExplanation = `${purposeLineRich} ${effortLineRich}`
    } else {
      // If similar, prefer the longer/richer one
      detailExplanation = purposeLineRich.length > effortLineRich.length ? purposeLineRich : effortLineRich
    }
  } else {
    detailExplanation = purposeLineRich || effortLineRich || null
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
    detailExplanation,
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
// =============================================================================
// EXPLANATION REASONING ENGINE - ONTOLOGY & REASON FAMILIES
// =============================================================================

/**
 * REASON FAMILY ONTOLOGY
 * The system's internal classification of WHY a row exists in the program.
 * Each row must map to exactly one dominant reason family.
 */
type ReasonFamily =
  | 'direct_skill_exposure'      // Primary skill practice: planche leans, lever holds, handstand work
  | 'force_base_building'        // Core strength that skills depend on: dips, pull-ups, rows
  | 'explosive_power'            // Speed/power expression: explosive pull-ups, clapping push-ups
  | 'line_control'               // Bodyline/trunk stability: hollow, compression, anti-extension
  | 'positional_strength'        // Position-specific strength: lever rows, PPPU, pike work
  | 'balance_counterstress'      // Opposing stress pattern: pulls in push day, rear delts
  | 'joint_stability'            // Joint health/control: scap work, face pulls, rotator cuff
  | 'progression_bridge'         // Intermediate step: current best owned progression
  | 'weak_link_reinforcement'    // Targeting a bottleneck: triceps, grip, specific weakness
  | 'tissue_tolerance'           // Connective tissue conditioning: straight-arm prep, tendon work
  | 'fatigue_managed_support'    // Support without recovery cost: low-fatigue accessory
  | 'recovery_protective'        // Deload/protective: reduced load for adaptation
  | 'coordination_refinement'    // Pattern quality: transition work, bar path drills
  | 'capacity_building'          // General work capacity: volume accumulation
  | 'mobility_range'             // Range of motion work: shoulder, hip, wrist mobility
  | 'warmup_activation'          // Pattern priming: activation drills, warmup sets
  | 'finisher_density'           // End-of-session density: finisher circuits, EMOM

/**
 * SECONDARY MODIFIERS
 * Additional context that shapes the explanation's character.
 */
type ReasonModifier =
  | 'low_fatigue'        // Chosen for minimal recovery cost
  | 'high_quality'       // Quality reps over grind
  | 'conservative'       // Protective/careful dosage
  | 'bridging'           // Stepping stone to harder work
  | 'speed_preserving'   // Maintains explosive intent
  | 'output_preserving'  // Protects main work quality
  | 'pattern_cleaning'   // Improves movement quality
  | 'structural'         // Builds tissue/joint capacity
  | 'density_friendly'   // Works well in condensed format
  | 'non_interfering'    // Doesn't compete for recovery

/**
 * LOCAL PAYOFF TYPES
 * The specific benefit the movement provides.
 */
type LocalPayoff =
  | 'vertical_pull_speed'
  | 'horizontal_pull_strength'
  | 'pressing_lockout'
  | 'pressing_endurance'
  | 'scapular_control'
  | 'scapular_depression'
  | 'trunk_compression'
  | 'trunk_anti_extension'
  | 'hip_compression'
  | 'posterior_chain_support'
  | 'overhead_stability'
  | 'bodyline_integrity'
  | 'grip_endurance'
  | 'wrist_conditioning'
  | 'elbow_tolerance'
  | 'shoulder_balance'
  | 'transition_coordination'
  | 'lean_tolerance'
  | 'hold_duration'
  | 'force_output'
  | 'position_control'

/**
 * DOSAGE PROFILE
 * Structured interpretation of sets/reps/RPE to inform explanation.
 */
interface DosageProfile {
  volumeIntent: 'low' | 'moderate' | 'high'
  intensityIntent: 'low' | 'moderate' | 'high' | 'explosive'
  fatigueImpact: 'minimal' | 'moderate' | 'significant'
  qualityEmphasis: boolean
  powerEmphasis: boolean
}

/**
 * DAY STRESS PROFILE
 * Characterizes what this day is trying to accomplish.
 */
interface DayStressProfile {
  isHighNeural: boolean
  isLowFatigue: boolean
  isPushDominant: boolean
  isPullDominant: boolean
  isSkillFocused: boolean
  isStrengthFocused: boolean
  isRecoveryBiased: boolean
}

/**
 * EXPLANATION CONTEXT PACKAGE
 * All inputs the reasoning engine needs to generate truthful explanations.
 */
interface ExplanationContext {
  // Movement identity (contradiction guard)
  movementFamily: 'pull' | 'push' | 'core' | 'scap' | 'unknown'
  isPullMovement: boolean
  isPushMovement: boolean
  isCoreMovement: boolean
  isScapMovement: boolean
  exerciseNameLower: string
  
  // Arm type classification (bent-arm vs straight-arm)
  // Critical for correct role labeling - HSPU is bent-arm push, planche is straight-arm push
  armType: 'bent_arm' | 'straight_arm' | 'mixed' | 'unknown'
  isBentArmPush: boolean
  isStraightArmPush: boolean
  isBentArmPull: boolean
  isStraightArmPull: boolean
  
  // Program/day context
  primaryGoal: string
  sessionFocus: string
  sessionIntent: string
  spineType: string
  dayStressProfile: DayStressProfile
  
  // Row context
  category: string
  selectionReason: string
  expressionMode: string
  roleInSession: string
  isPrimary: boolean
  isProtected: boolean
  emphasisKind: string
  
  // Dosage context (when available)
  dosageProfile: DosageProfile | null
  loadDecisionSummary: string
  progressionIntent: string
  
  // Derived reason classification
  dominantReasonFamily: ReasonFamily
  modifiers: ReasonModifier[]
  localPayoff: LocalPayoff | null
}

/**
 * DERIVE DOMINANT REASON FAMILY
 * [EXPLAIN-OWNER-LOCK] Classifies the row's primary purpose based on all available context.
 * Priority: roleInSession > expressionMode > selectionReason keywords > category > fallback
 */
function deriveReasonFamily(ctx: ExplanationContext): ReasonFamily {
  const { expressionMode, roleInSession, category, selectionReason, isPrimary, isProtected, movementFamily, exerciseNameLower } = ctx
  const reasonLower = selectionReason.toLowerCase()
  
  // ==========================================================================
  // PRIORITY 1: roleInSession - most authoritative when present
  // [EXPLAIN-OWNER-LOCK] This field comes from upstream program composition
  // ==========================================================================
  if (roleInSession) {
    switch (roleInSession) {
      case 'main_driver':
        return 'direct_skill_exposure'
      case 'secondary_driver':
        return isPrimary ? 'direct_skill_exposure' : 'positional_strength'
      case 'bridge_work':
        return 'progression_bridge'
      case 'strength_foundation':
        return 'force_base_building'
      case 'balance_counterstress':
        return 'balance_counterstress'
      case 'tissue_conditioning':
        return 'tissue_tolerance'
      case 'trunk_line_control':
        return 'line_control'
      case 'joint_stability':
        return 'joint_stability'
      case 'warmup_activation':
        return 'warmup_activation'
      case 'finisher_density':
        return 'finisher_density'
      case 'accessory_support':
        // Fall through to further classification
        break
    }
  }
  
  // ==========================================================================
  // PRIORITY 2: Direct skill exposure from category/mode
  // ==========================================================================
  if (isPrimary || category === 'skill' || expressionMode.includes('direct') || expressionMode.includes('intensity')) {
    return 'direct_skill_exposure'
  }
  
  // ==========================================================================
  // PRIORITY 3: Protected/tissue work
  // ==========================================================================
  if (isProtected || reasonLower.includes('protect') || reasonLower.includes('tissue') || reasonLower.includes('tendon')) {
    return 'tissue_tolerance'
  }
  
  // ==========================================================================
  // PRIORITY 4: Explosive/power work - detected from name or reason
  // ==========================================================================
  if (reasonLower.includes('explosive') || reasonLower.includes('power') || reasonLower.includes('speed') ||
      exerciseNameLower.includes('explosive') || exerciseNameLower.includes('clap') || exerciseNameLower.includes('plyometric') ||
      exerciseNameLower.includes('high pull') || exerciseNameLower.includes('chest-to-bar') || exerciseNameLower.includes('chest to bar')) {
    return 'explosive_power'
  }
  
  // ==========================================================================
  // PRIORITY 5: Balance/counterstress
  // ==========================================================================
  if (reasonLower.includes('balance') || reasonLower.includes('antagonist') || reasonLower.includes('counterstress') ||
      reasonLower.includes('opposing') || reasonLower.includes('offset')) {
    return 'balance_counterstress'
  }
  
  // ==========================================================================
  // PRIORITY 6: Weak link reinforcement
  // ==========================================================================
  if (reasonLower.includes('weak') || reasonLower.includes('bottleneck') || reasonLower.includes('limiting')) {
    return 'weak_link_reinforcement'
  }
  
  // ==========================================================================
  // PRIORITY 7: Progression bridge
  // ==========================================================================
  if (reasonLower.includes('bridge') || reasonLower.includes('progression') || reasonLower.includes('current best') ||
      expressionMode.includes('bridge')) {
    return 'progression_bridge'
  }
  
  // ==========================================================================
  // PRIORITY 8: Core/trunk = line control
  // ==========================================================================
  if (category === 'core' || movementFamily === 'core') {
    return 'line_control'
  }
  
  // ==========================================================================
  // PRIORITY 9: Scap/joint work
  // ==========================================================================
  if (movementFamily === 'scap' || reasonLower.includes('scap') || reasonLower.includes('shoulder') ||
      reasonLower.includes('rear delt') || reasonLower.includes('rotator')) {
    return 'joint_stability'
  }
  
  // ==========================================================================
  // PRIORITY 10: Positional strength (carryover work)
  // ==========================================================================
  if (expressionMode.includes('carryover') || expressionMode.includes('technical') ||
      reasonLower.includes('position') || reasonLower.includes('specific') || reasonLower.includes('carryover')) {
    return 'positional_strength'
  }
  
  // ==========================================================================
  // PRIORITY 11: Force base building (main strength work)
  // ==========================================================================
  if (category === 'strength' || category === 'push' || category === 'pull') {
    return 'force_base_building'
  }
  
  // ==========================================================================
  // PRIORITY 12: Mobility/flexibility work
  // ==========================================================================
  if (category === 'mobility' || category === 'flexibility' || 
      reasonLower.includes('mobility') || reasonLower.includes('range') || reasonLower.includes('stretch')) {
    return 'mobility_range'
  }
  
  // ==========================================================================
  // PRIORITY 13: Warmup/activation work
  // ==========================================================================
  if (category === 'warmup' || category === 'activation' ||
      reasonLower.includes('warmup') || reasonLower.includes('warm-up') || reasonLower.includes('activation')) {
    return 'warmup_activation'
  }
  
  // ==========================================================================
  // PRIORITY 14: Finisher/density work
  // ==========================================================================
  if (reasonLower.includes('finisher') || reasonLower.includes('density') || 
      reasonLower.includes('emom') || reasonLower.includes('circuit')) {
    return 'finisher_density'
  }
  
  // ==========================================================================
  // PRIORITY 15: Fatigue-managed support (accessory-like work)
  // ==========================================================================
  if (roleInSession?.includes('support') || roleInSession?.includes('accessory') ||
      expressionMode.includes('support') || category === 'accessory') {
    return 'fatigue_managed_support'
  }
  
  // ==========================================================================
  // FALLBACK: Capacity building based on movement family
  // ==========================================================================
  return 'capacity_building'
}

/**
 * DERIVE MODIFIERS
 * Extracts secondary modifiers from context.
 */
function deriveModifiers(ctx: ExplanationContext): ReasonModifier[] {
  const modifiers: ReasonModifier[] = []
  const reasonLower = ctx.selectionReason.toLowerCase()
  
  if (reasonLower.includes('low fatigue') || reasonLower.includes('low-fatigue') || reasonLower.includes('minimal fatigue')) {
    modifiers.push('low_fatigue')
  }
  if (reasonLower.includes('quality') || reasonLower.includes('technique') || reasonLower.includes('form')) {
    modifiers.push('high_quality')
  }
  if (ctx.isProtected || reasonLower.includes('conservative') || reasonLower.includes('protect')) {
    modifiers.push('conservative')
  }
  if (reasonLower.includes('bridge') || reasonLower.includes('step') || reasonLower.includes('progression')) {
    modifiers.push('bridging')
  }
  if (reasonLower.includes('speed') || reasonLower.includes('explosive') || reasonLower.includes('power')) {
    modifiers.push('speed_preserving')
  }
  if (reasonLower.includes('preserve') || reasonLower.includes('maintain') || reasonLower.includes('protect')) {
    modifiers.push('output_preserving')
  }
  if (reasonLower.includes('structural') || reasonLower.includes('tissue') || reasonLower.includes('tendon')) {
    modifiers.push('structural')
  }
  
  return modifiers
}

/**
 * DERIVE LOCAL PAYOFF
 * Determines the specific benefit this movement provides.
 */
function deriveLocalPayoff(ctx: ExplanationContext): LocalPayoff | null {
  const { exerciseNameLower, movementFamily, category, selectionReason } = ctx
  const reasonLower = selectionReason.toLowerCase()
  
  // Pull movements
  if (movementFamily === 'pull') {
    if (exerciseNameLower.includes('explosive') || reasonLower.includes('speed') || reasonLower.includes('power')) {
      return 'vertical_pull_speed'
    }
    if (exerciseNameLower.includes('row') || exerciseNameLower.includes('horizontal')) {
      return 'horizontal_pull_strength'
    }
    if (exerciseNameLower.includes('transition') || exerciseNameLower.includes('muscle-up')) {
      return 'transition_coordination'
    }
    return 'force_output'
  }
  
  // Push movements
  if (movementFamily === 'push') {
    if (exerciseNameLower.includes('dip') || exerciseNameLower.includes('lockout') || reasonLower.includes('lockout')) {
      return 'pressing_lockout'
    }
    if (exerciseNameLower.includes('lean') || exerciseNameLower.includes('planche')) {
      return 'lean_tolerance'
    }
    if (exerciseNameLower.includes('pike') || exerciseNameLower.includes('hspu') || exerciseNameLower.includes('handstand')) {
      return 'overhead_stability'
    }
    return 'pressing_endurance'
  }
  
  // Core movements
  if (movementFamily === 'core' || category === 'core') {
    if (exerciseNameLower.includes('hollow') || exerciseNameLower.includes('dish') || reasonLower.includes('compression')) {
      return 'trunk_compression'
    }
    if (exerciseNameLower.includes('l-sit') || exerciseNameLower.includes('lsit') || exerciseNameLower.includes('leg raise')) {
      return 'hip_compression'
    }
    if (exerciseNameLower.includes('plank') || exerciseNameLower.includes('deadbug') || reasonLower.includes('anti-extension')) {
      return 'trunk_anti_extension'
    }
    if (exerciseNameLower.includes('back extension') || exerciseNameLower.includes('reverse hyper')) {
      return 'posterior_chain_support'
    }
    return 'bodyline_integrity'
  }
  
  // Scap/shoulder movements
  if (movementFamily === 'scap') {
    if (exerciseNameLower.includes('face pull') || exerciseNameLower.includes('rear delt')) {
      return 'shoulder_balance'
    }
    if (exerciseNameLower.includes('depression') || reasonLower.includes('depression')) {
      return 'scapular_depression'
    }
    return 'scapular_control'
  }
  
  // Check for specific keywords
  if (reasonLower.includes('grip') || exerciseNameLower.includes('hang') || exerciseNameLower.includes('grip')) {
    return 'grip_endurance'
  }
  if (reasonLower.includes('wrist') || exerciseNameLower.includes('wrist')) {
    return 'wrist_conditioning'
  }
  if (reasonLower.includes('elbow') || exerciseNameLower.includes('elbow')) {
    return 'elbow_tolerance'
  }
  
  return null
}

/**
 * DERIVE DAY STRESS PROFILE
 * Characterizes what the day is trying to accomplish based on session context.
 */
function deriveDayStressProfile(sessionFocus: string, sessionIntent: string, spineType: string): DayStressProfile {
  const focusLower = sessionFocus.toLowerCase()
  const intentLower = sessionIntent.toLowerCase()
  const spineLower = spineType.toLowerCase()
  
  return {
    isHighNeural: intentLower.includes('neural') || intentLower.includes('skill') || spineLower.includes('direct') || spineLower.includes('intensity'),
    isLowFatigue: intentLower.includes('low') || intentLower.includes('recovery') || intentLower.includes('light'),
    isPushDominant: focusLower.includes('push') || focusLower.includes('press') || focusLower.includes('planche') || focusLower.includes('handstand'),
    isPullDominant: focusLower.includes('pull') || focusLower.includes('lever') || focusLower.includes('muscle-up') || focusLower.includes('row'),
    isSkillFocused: intentLower.includes('skill') || spineLower.includes('skill') || focusLower.includes('skill'),
    isStrengthFocused: intentLower.includes('strength') || spineLower.includes('strength') || focusLower.includes('strength'),
    isRecoveryBiased: intentLower.includes('recovery') || intentLower.includes('deload') || focusLower.includes('recovery'),
  }
}

/**
 * DERIVE DOSAGE PROFILE
 * Interprets load decision summary to inform explanation.
 */
function deriveDosageProfile(loadDecisionSummary: string, progressionIntent: string, selectionReason: string): DosageProfile | null {
  const loadLower = loadDecisionSummary.toLowerCase()
  const progressLower = progressionIntent.toLowerCase()
  const reasonLower = selectionReason.toLowerCase()
  
  // If no dosage info, return null
  if (!loadDecisionSummary && !progressionIntent) {
    return null
  }
  
  // Volume intent
  let volumeIntent: 'low' | 'moderate' | 'high' = 'moderate'
  if (loadLower.includes('low volume') || loadLower.includes('reduced') || loadLower.includes('minimal') || reasonLower.includes('low volume')) {
    volumeIntent = 'low'
  } else if (loadLower.includes('high volume') || loadLower.includes('accumulation') || loadLower.includes('density')) {
    volumeIntent = 'high'
  }
  
  // Intensity intent
  let intensityIntent: 'low' | 'moderate' | 'high' | 'explosive' = 'moderate'
  if (loadLower.includes('explosive') || loadLower.includes('power') || loadLower.includes('speed') || reasonLower.includes('explosive')) {
    intensityIntent = 'explosive'
  } else if (loadLower.includes('high intensity') || loadLower.includes('heavy') || loadLower.includes('max')) {
    intensityIntent = 'high'
  } else if (loadLower.includes('low intensity') || loadLower.includes('light') || loadLower.includes('easy')) {
    intensityIntent = 'low'
  }
  
  // Fatigue impact
  let fatigueImpact: 'minimal' | 'moderate' | 'significant' = 'moderate'
  if (loadLower.includes('low fatigue') || loadLower.includes('minimal fatigue') || reasonLower.includes('low-fatigue')) {
    fatigueImpact = 'minimal'
  } else if (loadLower.includes('high fatigue') || loadLower.includes('demanding') || loadLower.includes('grinding')) {
    fatigueImpact = 'significant'
  }
  
  // Quality emphasis
  const qualityEmphasis = loadLower.includes('quality') || loadLower.includes('technique') || loadLower.includes('form') || 
                          progressLower.includes('quality') || reasonLower.includes('quality')
  
  // Power emphasis  
  const powerEmphasis = loadLower.includes('power') || loadLower.includes('explosive') || loadLower.includes('speed') ||
                        reasonLower.includes('power') || reasonLower.includes('explosive')
  
  return {
    volumeIntent,
    intensityIntent,
    fatigueImpact,
    qualityEmphasis,
    powerEmphasis,
  }
}

/**
 * BUILD EXPLANATION CONTEXT
 * Assembles all context needed for explanation generation.
 */
function buildExplanationContext(
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
  emphasisKind?: string
): ExplanationContext {
  const exerciseNameLower = exercise.name.toLowerCase()
  const categoryLower = (exercise.category || '').toLowerCase()
  
  // Movement family detection (contradiction guard) - EXPANDED KEYWORDS
  const pullKeywords = [
    'pull', 'row', 'chin', 'lat', 'bicep', 'curl', 'lever row', 'front lever', 'back lever', 
    'muscle-up', 'muscle up', 'transition', 'chest-to-bar', 'chest to bar', 'high pull',
    'inverted row', 'ring row', 'australian', 'horizontal pull', 'vertical pull', 'archer pull'
  ]
  const pushKeywords = [
    'push', 'dip', 'press', 'planche', 'handstand', 'pike', 'tricep', 'extension', 'pppu', 
    'pseudo', 'hspu', 'lean', 'ring push', 'wall push', 'archer push', 'diamond push',
    'decline push', 'weighted push', 'bench', 'overhead press'
  ]
  const coreKeywords = [
    'hollow', 'plank', 'dead bug', 'deadbug', 'l-sit', 'lsit', 'leg raise', 'pallof', 
    'anti-rotation', 'compression', 'side plank', 'copenhagen', 'dragon flag', 'ab wheel',
    'hanging knee', 'toes to bar', 'v-up', 'crunch', 'reverse hyper', 'back extension',
    'superman', 'arch', 'glute bridge', 'hip thrust'
  ]
  const scapKeywords = [
    'face pull', 'y raise', 'i raise', 'cuban', 'band pull', 'pull-apart', 'rear delt', 
    'reverse fly', 'serratus', 'scap push', 'scap pull', 'protraction', 'retraction',
    'external rotation', 'internal rotation', 'rotator cuff'
  ]
  
  const isPullMovement = pullKeywords.some(kw => exerciseNameLower.includes(kw)) || categoryLower === 'pull'
  const isPushMovement = pushKeywords.some(kw => exerciseNameLower.includes(kw)) || categoryLower === 'push'
  const isCoreMovement = coreKeywords.some(kw => exerciseNameLower.includes(kw)) || categoryLower === 'core'
  const isScapMovement = scapKeywords.some(kw => exerciseNameLower.includes(kw))
  
  let movementFamily: 'pull' | 'push' | 'core' | 'scap' | 'unknown' = 'unknown'
  if (isPullMovement && !isPushMovement) movementFamily = 'pull'
  else if (isPushMovement && !isPullMovement) movementFamily = 'push'
  else if (isCoreMovement) movementFamily = 'core'
  else if (isScapMovement) movementFamily = 'scap'
  
  // ==========================================================================
  // ARM-TYPE CLASSIFICATION
  // Critical for correct semantic labeling: HSPU is bent-arm push, planche is straight-arm push
  // ==========================================================================
  const bentArmPushKeywords = [
    'dip', 'hspu', 'handstand push', 'pike push', 'wall push', 'push-up', 'pushup', 'push up',
    'bench', 'press', 'overhead press', 'tricep', 'ring dip', 'bar dip', 'weighted dip',
    'decline push', 'diamond push', 'archer push', 'one arm push', 'explosive push', 'clap push'
  ]
  const straightArmPushKeywords = [
    'planche', 'lean', 'planche lean', 'tuck planche', 'straddle planche', 'full planche',
    'maltese', 'iron cross', 'support hold', 'rto support', 'ring support', 'l-sit', 'lsit',
    'v-sit', 'vsit', 'manna', 'shoulder stand'
  ]
  const bentArmPullKeywords = [
    'pull-up', 'pullup', 'pull up', 'chin-up', 'chinup', 'chin up', 'row', 'bicep', 'curl',
    'lat pulldown', 'cable row', 'inverted row', 'ring row', 'australian', 'archer pull',
    'typewriter pull', 'muscle-up', 'muscle up', 'weighted pull'
  ]
  const straightArmPullKeywords = [
    'front lever', 'back lever', 'ice cream maker', 'skin the cat', 'german hang',
    'lever row', 'lever hold', 'tuck lever', 'straddle lever', 'full lever',
    'straight arm pulldown', 'lat raise', 'iron cross'
  ]
  
  const isBentArmPush = isPushMovement && bentArmPushKeywords.some(kw => exerciseNameLower.includes(kw))
  const isStraightArmPush = isPushMovement && straightArmPushKeywords.some(kw => exerciseNameLower.includes(kw))
  const isBentArmPull = isPullMovement && bentArmPullKeywords.some(kw => exerciseNameLower.includes(kw))
  const isStraightArmPull = isPullMovement && straightArmPullKeywords.some(kw => exerciseNameLower.includes(kw))
  
  // Determine overall arm type - prioritize explicit matches, default to bent-arm for typical exercises
  let armType: 'bent_arm' | 'straight_arm' | 'mixed' | 'unknown' = 'unknown'
  if (isStraightArmPush || isStraightArmPull) {
    armType = 'straight_arm'
  } else if (isBentArmPush || isBentArmPull) {
    armType = 'bent_arm'
  } else if (isPushMovement || isPullMovement) {
    // Default most push/pull to bent-arm unless explicitly straight-arm
    armType = 'bent_arm'
  }
  
  // Build session context strings
  const sessionFocus = (sessionContext?.sessionFocus || '').toLowerCase()
  const sessionIntent = (sessionContext?.compositionMetadata?.sessionIntent || '').toLowerCase()
  const spineType = (sessionContext?.compositionMetadata?.spineSessionType || '').toLowerCase()
  
  // Build load/progression strings
  const loadDecisionSummary = (exercise.coachingMeta?.loadDecisionSummary || '').toLowerCase()
  const progressionIntent = (exercise.coachingMeta?.progressionIntent || '').toLowerCase()
  
  const ctx: ExplanationContext = {
    movementFamily,
    isPullMovement,
    isPushMovement,
    isCoreMovement,
    isScapMovement,
    exerciseNameLower,
    armType,
    isBentArmPush,
    isStraightArmPush,
    isBentArmPull,
    isStraightArmPull,
    primaryGoal: (sessionContext?.primaryGoal || '').replace(/_/g, ' ').toLowerCase(),
    sessionFocus,
    sessionIntent,
    spineType,
    dayStressProfile: deriveDayStressProfile(sessionFocus, sessionIntent, spineType),
    category: categoryLower,
    selectionReason: exercise.selectionReason || '',
    expressionMode: (exercise.coachingMeta?.expressionMode || '').toLowerCase(),
    roleInSession: (exercise.coachingMeta?.roleInSession || '').toLowerCase(),
    isPrimary: exercise.isPrimary || false,
    isProtected: exercise.isProtected || false,
    emphasisKind: emphasisKind || '',
    dosageProfile: deriveDosageProfile(loadDecisionSummary, progressionIntent, exercise.selectionReason || ''),
    loadDecisionSummary,
    progressionIntent,
    dominantReasonFamily: 'capacity_building', // Will be set below
    modifiers: [],
    localPayoff: null
  }
  
  // Derive reason classification
  ctx.dominantReasonFamily = deriveReasonFamily(ctx)
  ctx.modifiers = deriveModifiers(ctx)
  ctx.localPayoff = deriveLocalPayoff(ctx)
  
  return ctx
}

/**
 * COMPOSE EXPLANATION FROM REASON FAMILY
 * Generates the final sentence based on classified reason and context.
 * 
 * DESIGN PRINCIPLES:
 * 1. Explain WHY this exercise is here FOR THIS ATHLETE, THIS DAY, THIS PROGRAM
 * 2. Use dosage to inform the explanation when relevant
 * 3. Reference day stress profile to explain placement
 * 4. Never output generic category labels as the primary explanation
 * 5. Movement family must be respected in all explanations
 */
function composeExplanationFromReason(ctx: ExplanationContext): string {
  const { 
    dominantReasonFamily, modifiers, localPayoff, movementFamily, exerciseNameLower, 
    primaryGoal, sessionFocus, dayStressProfile, dosageProfile, selectionReason
  } = ctx
  const hasLowFatigue = modifiers.includes('low_fatigue')
  const hasHighQuality = modifiers.includes('high_quality')
  const hasBridging = modifiers.includes('bridging')
  const hasSpeedPreserving = modifiers.includes('speed_preserving')
  const hasConservative = modifiers.includes('conservative')
  const hasOutputPreserving = modifiers.includes('output_preserving')
  
  // Dosage-aware helpers
  const isLowFatigueDose = dosageProfile?.fatigueImpact === 'minimal' || hasLowFatigue
  const isQualityFocused = dosageProfile?.qualityEmphasis || hasHighQuality
  const isPowerFocused = dosageProfile?.powerEmphasis || hasSpeedPreserving
  const isHighVolume = dosageProfile?.volumeIntent === 'high'
  const isLowVolume = dosageProfile?.volumeIntent === 'low'
  
  // Day context helpers
  const dayIsPushDominant = dayStressProfile.isPushDominant
  const dayIsPullDominant = dayStressProfile.isPullDominant
  const dayIsHighNeural = dayStressProfile.isHighNeural
  const dayIsLowFatigue = dayStressProfile.isLowFatigue
  const dayIsSkillFocused = dayStressProfile.isSkillFocused
  
  // Goal name helper
  const goalName = (): string => {
    if (primaryGoal.includes('planche')) return 'planche'
    if (primaryGoal.includes('front lever')) return 'front lever'
    if (primaryGoal.includes('back lever')) return 'back lever'
    if (primaryGoal.includes('handstand')) return 'handstand'
    if (primaryGoal.includes('muscle up') || primaryGoal.includes('muscle-up')) return 'muscle-up'
    if (primaryGoal.includes('iron cross')) return 'iron cross'
    if (primaryGoal.includes('l-sit') || primaryGoal.includes('l sit')) return 'L-sit'
    if (primaryGoal.includes('v-sit') || primaryGoal.includes('v sit')) return 'V-sit'
    return 'your skill'
  }
  
  // Helper: check if exercise is a specific type
  const isType = (keywords: string[]): boolean => {
    return keywords.some(kw => exerciseNameLower.includes(kw))
  }
  
  // Helper: add dosage context to explanation when relevant
  const withDosageContext = (base: string): string => {
    if (isLowFatigueDose && !base.includes('fatigue') && !base.includes('recovery')) {
      // Only add if it adds value
      if (base.length < 80) {
        return base.replace(/\.$/, '') + ' — dosed to minimize fatigue cost.'
      }
    }
    if (isQualityFocused && !base.includes('quality') && !base.includes('technique')) {
      if (base.length < 80) {
        return base.replace(/\.$/, '') + ' — quality over grinding.'
      }
    }
    return base
  }
  
  // Extract arm type from context for semantic correctness
  const { armType, isBentArmPush, isStraightArmPush, isBentArmPull, isStraightArmPull } = ctx
  
  switch (dominantReasonFamily) {
    // ========================================================================
    // DIRECT SKILL EXPOSURE
    // ========================================================================
    case 'direct_skill_exposure':
      if (primaryGoal.includes('planche')) {
        // Only give straight-arm labeling to actual straight-arm planche work
        if (isType(['lean', 'planche lean'])) {
          return 'Builds the forward lean tolerance your planche needs — harder progressions require this foundation first.'
        }
        if (isType(['tuck', 'adv tuck', 'straddle']) || isType(['planche'])) {
          return 'Accumulates quality time in position — planche improves through controlled exposure, not grinding.'
        }
        // Check if this is bent-arm work supporting planche (like dips, HSPU, push-ups)
        if (isBentArmPush) {
          if (isType(['hspu', 'handstand push', 'pike push', 'wall push'])) {
            return 'Primary vertical pressing driver — builds the overhead strength planche work relies on.'
          }
          if (isType(['dip'])) {
            return 'Primary pressing driver — builds the lockout strength your planche transition needs.'
          }
          return 'Primary bent-arm pressing driver — builds the force base your planche work stands on.'
        }
        // Only actual planche work gets straight-arm labeling
        if (isStraightArmPush) {
          return 'Primary straight-arm driver today — this is where planche strength actually gets built.'
        }
        return 'Primary skill driver today — this is where planche progress happens.'
      }
      if (primaryGoal.includes('front lever')) {
        if (isType(['tuck', 'adv tuck', 'straddle']) || isType(['lever'])) {
          return 'Quality pulling tension practice — front lever grows from controlled holds, not max attempts.'
        }
        // Check if this is bent-arm pull work supporting front lever
        if (isBentArmPull) {
          if (isType(['row'])) {
            return 'Primary horizontal pulling driver — builds the scapular control front lever requires.'
          }
          if (isType(['pull-up', 'pullup', 'chin'])) {
            return 'Primary vertical pulling driver — builds the lat strength front lever depends on.'
          }
          return 'Primary pulling driver — builds the strength base front lever relies on.'
        }
        if (isStraightArmPull) {
          return 'Primary straight-arm pull driver — directly builds front lever strength and control.'
        }
        return 'Primary horizontal pull driver — directly builds the strength front lever requires.'
      }
      if (primaryGoal.includes('handstand') || primaryGoal.includes('hspu')) {
        if (isType(['hspu', 'handstand push', 'pike push', 'wall push', 'partial', 'negative'])) {
          return 'Primary vertical pressing driver — directly builds the strength your handstand push-up requires.'
        }
        if (isType(['handstand', 'balance', 'hold'])) {
          return 'Primary overhead control driver — builds the balance and stability for handstand work.'
        }
        return 'Primary overhead driver — handstand pressing strength comes from quality work here.'
      }
      if (primaryGoal.includes('muscle')) {
        if (isBentArmPull) {
          return 'Primary pulling driver — builds the explosive pull height your muscle-up needs.'
        }
        if (isBentArmPush) {
          return 'Primary pressing driver — builds the transition lockout your muscle-up depends on.'
        }
        return 'Primary transition driver — builds the explosive pull-to-push your muscle-up needs.'
      }
      if (hasHighQuality) {
        return 'Direct skill exposure with managed fatigue — pattern quality matters more than grinding.'
      }
      return 'Primary skill driver today — this is where real progress happens.'
    
    // ========================================================================
    // FORCE BASE BUILDING
    // ========================================================================
    case 'force_base_building':
      if (movementFamily === 'push') {
        if (isType(['dip', 'weighted dip', 'ring dip'])) {
          if (primaryGoal.includes('planche')) {
            if (isLowFatigueDose) {
              return 'Builds planche-supporting pressing strength while preserving recovery for skill work.'
            }
            return 'Builds the pressing foundation planche needs — stronger dips mean easier progression later.'
          }
          if (primaryGoal.includes('muscle')) {
            return 'Builds the lockout strength your muscle-up transition depends on.'
          }
          if (dayIsSkillFocused) {
            return 'Placed after skill work to build pressing capacity without stealing from main output.'
          }
          return 'Raises your pressing ceiling — this transfers into skill work without the skill fatigue cost.'
        }
        if (isType(['push-up', 'pushup', 'pppu', 'pseudo'])) {
          if (primaryGoal.includes('planche')) {
            if (isType(['pppu', 'pseudo'])) {
              return 'Builds pressing endurance in planche-lean position — direct carryover, lower joint cost than full skill work.'
            }
            return 'Builds pressing endurance in a planche-relevant position — high carryover, lower joint cost.'
          }
          if (isType(['ring'])) {
            return 'Builds pressing stability on rings — the control that makes ring dips and skills more reliable.'
          }
          return 'Pressing work that transfers into your skill positions without excessive joint stress.'
        }
        if (isType(['pike', 'hspu', 'wall'])) {
          if (primaryGoal.includes('handstand')) {
            return 'Builds the overhead pressing strength your handstand work is built on.'
          }
          return 'Develops vertical pressing capacity — foundation for overhead skill work.'
        }
        if (primaryGoal.includes('planche') || primaryGoal.includes('handstand')) {
          if (isLowFatigueDose) {
            return 'Raises pressing output efficiently — builds foundation without excessive recovery cost.'
          }
          return 'Raises your pressing output — stronger foundation means faster skill progression.'
        }
        return 'Builds the pressing strength your skill work draws from — raises your ceiling.'
      }
      if (movementFamily === 'pull') {
        if (isType(['row', 'inverted row', 'ring row'])) {
          if (primaryGoal.includes('front lever')) {
            if (isType(['lever row', 'front lever row'])) {
              return 'Direct front lever strength work — builds pulling power in lever position.'
            }
            if (isType(['ring', 'rings'])) {
              return 'Builds horizontal pulling with scapular depression — direct front lever carryover.'
            }
            if (isType(['inverted', 'australian'])) {
              return 'Builds mid-back retraction strength — supports the scapular control front lever needs.'
            }
            return 'Develops horizontal pulling in lever-relevant positions — strong scap control transfers.'
          }
          if (primaryGoal.includes('muscle')) {
            return 'Builds horizontal pulling balance — keeps scaps healthy under transition stress.'
          }
          if (primaryGoal.includes('planche')) {
            return 'Balances pressing stress with pulling — keeps shoulders healthy for planche work.'
          }
          if (dayIsPushDominant) {
            return 'Balances today\'s pressing volume with horizontal pulling — maintains shoulder health.'
          }
          if (isType(['ring', 'rings'])) {
            return 'Builds scap control on unstable surface — transfers to ring strength positions.'
          }
          if (isType(['weighted', 'barbell'])) {
            return 'Develops max horizontal pulling force — strong mid-back supports skill positions.'
          }
          return 'Develops scapular retraction and mid-back strength — foundation for pulling positions.'
        }
        if (isType(['pull-up', 'pullup', 'chin', 'weighted pull'])) {
          if (primaryGoal.includes('muscle')) {
            if (isType(['weighted', 'weight'])) {
              return 'Builds max pulling force — the explosive bar height your muscle-up transition needs.'
            }
            if (isType(['chin', 'supinated'])) {
              return 'Builds pulling power with bicep emphasis — transfers to high pull height.'
            }
            return 'Builds vertical pulling force — stronger pulls mean the bar comes higher.'
          }
          if (primaryGoal.includes('front lever')) {
            if (isType(['weighted', 'weight'])) {
              return 'Builds max scapular depression force — directly supports front lever entry control.'
            }
            if (isType(['wide', 'archer'])) {
              return 'Develops lat width and lever-arm strength — transfers to wider lever progressions.'
            }
            return 'Builds scapular depression and lat engagement — the control front lever requires.'
          }
          if (primaryGoal.includes('one arm') || primaryGoal.includes('oap')) {
            if (isType(['archer', 'typewriter'])) {
              return 'Builds unilateral pulling bias — the asymmetric strength one-arm work needs.'
            }
            return 'Builds pulling strength ceiling — higher max means one-arm work becomes accessible.'
          }
          if (isHighVolume) {
            return 'Accumulates vertical pulling volume — building work capacity for harder progressions.'
          }
          if (isLowFatigueDose) {
            return 'Maintains pulling strength without recovery cost — keeps capacity fresh for skill work.'
          }
          return 'Builds vertical pulling strength — foundation for skill positions and transitions.'
        }
        if (isType(['explosive', 'high pull', 'chest-to'])) {
          return 'Develops explosive pull height — the bar aggression transitions depend on.'
        }
        if (primaryGoal.includes('front lever') || primaryGoal.includes('muscle')) {
          return 'Builds the pulling base your skill progression stands on — more strength means cleaner positions.'
        }
        return 'Develops pulling capacity — stronger back means more reliable skill positions.'
      }
      // Generic strength
      if (isLowFatigueDose) {
        return 'Builds force capacity without competing for skill recovery — efficient strength transfer.'
      }
      if (isQualityFocused) {
        return 'Builds strength with quality emphasis — better movement patterns transfer better.'
      }
      return 'Foundational strength your skill progression depends on — raises your ceiling.'
    
    // ========================================================================
    // EXPLOSIVE POWER
    // ========================================================================
    case 'explosive_power':
      if (movementFamily === 'pull') {
        if (isType(['explosive', 'chest-to-bar', 'chest to bar', 'high pull'])) {
          // Context: This is a PULL movement - never mention pressing as primary benefit
          if (primaryGoal.includes('muscle')) {
            return 'Builds the high-pull power your muscle-up transition depends on — bar height comes from here.'
          }
          if (dayIsHighNeural) {
            return 'Sharpens vertical pull speed while neural output is fresh — this is where bar height improves.'
          }
          return 'Develops high-force pulling speed — the bar aggression that makes transitions possible.'
        }
        if (isType(['muscle-up', 'transition'])) {
          return 'Trains the explosive pull-to-push coordination — speed and timing, not slow grinding.'
        }
        // Generic explosive pull
        if (isLowFatigueDose) {
          return 'Preserves pulling explosiveness in a low-fatigue format — speed without recovery cost.'
        }
        return 'Develops pulling power and speed — transfers to skill transitions and bar height.'
      }
      if (movementFamily === 'push') {
        if (isType(['clap', 'plyo', 'explosive'])) {
          return 'Builds pressing power and speed — transfers to faster, more controlled skill positions.'
        }
        if (primaryGoal.includes('planche')) {
          return 'Develops pressing explosiveness that helps you hold harder planche progressions.'
        }
        return 'Develops pressing explosiveness without heavy load fatigue.'
      }
      if (isPowerFocused) {
        return 'Power expression slot — dosed for speed and intent, not grindy volume.'
      }
      return 'Develops explosive output — speed and power without grinding fatigue.'
    
    // ========================================================================
    // LINE CONTROL (TRUNK/CORE)
    // ========================================================================
    case 'line_control':
      if (isType(['hollow', 'dish', 'hollow body', 'hollow hold'])) {
        return 'Builds trunk compression and anti-extension — the body position straight-arm skills require.'
      }
      if (isType(['deadbug', 'dead bug'])) {
        return 'Teaches trunk stability while limbs move — transfers to loaded skill positions.'
      }
      if (isType(['l-sit', 'l sit', 'lsit'])) {
        return 'Builds hip flexor and trunk compression — essential for tucked and compressed positions.'
      }
      if (isType(['leg raise', 'hanging leg', 'toes to bar'])) {
        return 'Builds the hip flexor and ab strength your skill holds require.'
      }
      if (isType(['plank', 'front plank', 'rkc'])) {
        return 'Builds the midline stiffness loaded skill positions demand.'
      }
      if (isType(['reverse hyper', 'back extension', 'superman'])) {
        return 'Strengthens the posterior chain that keeps body lines and tension reliable.'
      }
      if (isType(['pallof', 'anti-rotation'])) {
        return 'Builds rotational stiffness for better body control under asymmetric load.'
      }
      return 'Reinforces trunk stiffness so your line stays stronger when harder skill exposures arrive.'
    
    // ========================================================================
    // BALANCE / COUNTERSTRESS
    // ========================================================================
    case 'balance_counterstress':
      if (movementFamily === 'pull' && dayIsPushDominant) {
        if (isType(['row', 'ring row', 'inverted'])) {
          return 'Horizontal pulling to offset the day\'s pressing load — keeps shoulder position healthy.'
        }
        if (isType(['face pull', 'band pull', 'rear delt'])) {
          return 'Rear delt and scap work to counter heavy pressing — protects joint balance long-term.'
        }
        return 'Balances the day\'s pressing bias so shoulders and scaps don\'t drift into one-sided stress.'
      }
      if (movementFamily === 'push' && dayIsPullDominant) {
        if (isType(['dip', 'push-up'])) {
          return 'Pressing work to balance heavy pulling — keeps both patterns progressing together.'
        }
        return 'Balances the day\'s pulling emphasis so pressing patterns stay fresh.'
      }
      if (movementFamily === 'scap') {
        if (isType(['face pull', 'band pull', 'y raise'])) {
          return 'Scapular balance work to protect shoulder health under demanding skill loads.'
        }
        return 'Balances the main loading pattern so progress comes without losing positional control.'
      }
      if (movementFamily === 'core') {
        if (isType(['back extension', 'reverse hyper'])) {
          return 'Posterior chain balance — prevents front-side dominant training from creating imbalances.'
        }
      }
      return 'Placed here to balance the day\'s dominant stress pattern — keeps output cleaner overall.'
    
    // ========================================================================
    // JOINT STABILITY (SCAP/SHOULDER)
    // ========================================================================
    case 'joint_stability':
      if (isType(['face pull', 'band pull', 'pull-apart'])) {
        return 'Builds scapular control so pressing and pulling positions stay cleaner when fatigue rises.'
      }
      if (isType(['rear delt', 'reverse fly'])) {
        return 'Reinforces the back of the shoulder so heavy pressing doesn\'t pull joint balance out of position.'
      }
      if (isType(['y raise', 'i raise', 'cuban'])) {
        return 'Builds rotator cuff and scap stability — protects the shoulder under demanding positions.'
      }
      return 'Improves joint stability so your pressing and pulling can stay strong under fatigue.'
    
    // ========================================================================
    // PROGRESSION BRIDGE
    // ========================================================================
    case 'progression_bridge':
      if (hasBridging) {
        return 'Chosen as the strongest progression you can own cleanly right now — keeps progress moving without fake difficulty.'
      }
      return 'Used here as a bridge — enough specific carryover to move progression forward without jumping past current control.'
    
    // ========================================================================
    // WEAK LINK REINFORCEMENT
    // ========================================================================
    case 'weak_link_reinforcement':
      if (isType(['tricep', 'pushdown', 'extension', 'skull'])) {
        return 'Targets tricep lockout strength — addresses the weak link that limits pressing output.'
      }
      if (isType(['bicep', 'curl'])) {
        return 'Builds bicep and elbow flexor durability — strengthens a common weak link in pulling.'
      }
      if (isType(['grip', 'hang', 'forearm'])) {
        return 'Addresses grip as a limiting factor — stronger grip means more reliable skill holds.'
      }
      return 'Targets a specific weak link — strengthening this bottleneck unlocks progress elsewhere.'
    
    // ========================================================================
    // TISSUE TOLERANCE
    // ========================================================================
    case 'tissue_tolerance':
      if (ctx.selectionReason.toLowerCase().includes('straight-arm') || ctx.selectionReason.toLowerCase().includes('straight arm')) {
        return 'Conditions straight-arm tissue while maintaining exposure — tendons adapt slower than muscles.'
      }
      if (ctx.selectionReason.toLowerCase().includes('elbow') || ctx.selectionReason.toLowerCase().includes('tendon')) {
        return 'Manages connective tissue load — pushing too fast here causes setbacks that cost weeks.'
      }
      return 'Tissue conditioning — builds durability without accumulating injury risk.'
    
    // ========================================================================
    // FATIGUE-MANAGED SUPPORT
    // ========================================================================
    case 'fatigue_managed_support':
      if (movementFamily === 'pull') {
        if (dayIsPushDominant) {
          return 'Maintains pulling volume on a pressing day — keeps both patterns progressing without interference.'
        }
        if (primaryGoal.includes('front lever') || primaryGoal.includes('muscle')) {
          return 'Adds pulling volume that supports your main skill without the fatigue cost of more skill work.'
        }
        if (isType(['row', 'ring row'])) {
          return 'Horizontal pulling volume in a low-fatigue format — builds mid-back without crushing recovery.'
        }
        return 'Adds pulling volume in a lower-fatigue format so your main pulling quality stays high.'
      }
      if (movementFamily === 'push') {
        if (dayIsPullDominant) {
          return 'Maintains pressing volume on a pulling day — keeps both patterns developing together.'
        }
        if (primaryGoal.includes('planche') || primaryGoal.includes('handstand')) {
          return 'Adds pressing volume that supports your main skill without heavy skill fatigue.'
        }
        if (isType(['ring push', 'ring dip'])) {
          return 'Ring work in a lower-fatigue format — builds stability without demanding full recovery.'
        }
        return 'Adds pressing volume in a lower-fatigue format so your main pressing output stays high.'
      }
      if (movementFamily === 'core') {
        if (primaryGoal.includes('planche') || primaryGoal.includes('front lever')) {
          return 'Builds the trunk stability your skill positions require — without competing for main recovery.'
        }
        if (isType(['hollow', 'compression'])) {
          return 'Reinforces compression strength needed for skill positions — low fatigue cost, high transfer.'
        }
        return 'Builds trunk stability without competing for recovery from main skill work.'
      }
      if (movementFamily === 'scap') {
        if (dayIsHighNeural) {
          return 'Scap control work placed after main output — protects shoulder health without interfering.'
        }
        return 'Reinforces scap control in a lower-fatigue slot — keeps the rest of the session cleaner.'
      }
      if (isLowFatigueDose) {
        return 'Placed here to build capacity without stealing energy from the main work.'
      }
      if (dayIsSkillFocused) {
        return 'Support volume that doesn\'t compete with today\'s skill focus — efficient capacity building.'
      }
      return 'Reinforces a supporting quality without competing for recovery — keeps main work progressing.'
    
    // ========================================================================
    // RECOVERY PROTECTIVE
    // ========================================================================
    case 'recovery_protective':
      return 'Dosed conservatively to protect adaptation — sustainable progress requires managed load.'
    
    // ========================================================================
    // COORDINATION REFINEMENT
    // ========================================================================
    case 'coordination_refinement':
      if (isType(['transition', 'muscle-up'])) {
        return 'Trains the pull-to-push coordination pattern — technique and timing over raw strength.'
      }
      return 'Refines movement coordination — pattern quality improves skill expression.'
    
    // ========================================================================
    // MOBILITY / RANGE WORK
    // ========================================================================
    case 'mobility_range':
      if (isType(['shoulder', 'pec', 'lat stretch', 'overhead'])) {
        return 'Shoulder mobility work — unlocks positions your current range blocks.'
      }
      if (isType(['hip', 'pike', 'pancake', 'split'])) {
        return 'Hip mobility work — affects skill positions more than most expect.'
      }
      if (isType(['thoracic', 't-spine'])) {
        return 'Thoracic mobility work — opens overhead positions for better shapes.'
      }
      if (isType(['wrist'])) {
        return 'Wrist prep — injury here costs weeks; prevention costs minutes.'
      }
      return 'Mobility work — range limits skill expression before strength does.'
    
    // ========================================================================
    // WARMUP / ACTIVATION
    // ========================================================================
    case 'warmup_activation':
      if (isType(['scap', 'shoulder'])) {
        return 'Primes scapular and shoulder patterns — main work performs better when these are awake.'
      }
      if (isType(['band', 'activation'])) {
        return 'Activation work — wakes up the patterns main work needs ready.'
      }
      return 'Primes the joints and patterns that main work needs ready — reduces injury risk and improves output quality.'
    
    // ========================================================================
    // FINISHER / DENSITY
    // ========================================================================
    case 'finisher_density':
      if (movementFamily === 'push' || sessionFocus.includes('push')) {
        return 'Push finisher — captures remaining pressing capacity for growth after main work.'
      }
      if (movementFamily === 'pull' || sessionFocus.includes('pull')) {
        return 'Pull finisher — captures remaining pulling capacity for growth after main work.'
      }
      return 'Finisher slot — captures remaining work capacity for growth without needing fresh energy.'
    
    // ========================================================================
    // POSITIONAL STRENGTH
    // ========================================================================
    case 'positional_strength':
      if (isType(['fl row', 'front lever row', 'lever row'])) {
        return 'Horizontal pulling in lever position — builds scap retraction and lat strength under straight-arm demand.'
      }
      if (isType(['pppu', 'pseudo', 'planche push'])) {
        return 'Position-specific pressing — builds strength in the exact lean angle your planche uses.'
      }
      if (isType(['pike', 'pike push', 'decline pike'])) {
        return 'Pike pressing position — builds overhead strength at angles your handstand needs.'
      }
      if (hasHighQuality) {
        return 'Position-specific strength — transfers directly into skill positions with lower fatigue cost.'
      }
      return 'Builds strength in a skill-specific position — direct carryover with manageable load.'
    
    // ========================================================================
    // CAPACITY BUILDING (DEFAULT)
    // ========================================================================
    case 'capacity_building':
    default:
      if (movementFamily === 'pull') {
        return 'Builds pulling capacity your skill work draws from — a stronger back means more reliable positions.'
      }
      if (movementFamily === 'push') {
        return 'Builds pressing capacity your overhead and horizontal work draws from — raises your ceiling.'
      }
      if (movementFamily === 'core') {
        return 'Builds trunk capacity — midline strength is a ceiling for skill expression.'
      }
      return 'Builds capacity that transfers into your main work — raises the ceiling without excessive recovery cost.'
  }
}

/**
 * CONTRADICTION PATTERNS TO BLOCK
 * These are patterns that should NEVER appear for certain movement families.
 */
const PULL_CONTRADICTION_PATTERNS = [
  'pressing output',
  'pressing capacity', 
  'pressing power',
  'pressing strength',
  'pressing foundation',
  'builds the pressing',
  'raises pressing',
  'planche needs',
  'planche-supporting pressing',
]

const PUSH_CONTRADICTION_PATTERNS = [
  'pulling output',
  'pulling capacity',
  'pulling power', 
  'pulling strength',
  'pulling foundation',
  'builds the pulling',
  'raises pulling',
  'front lever needs',
  'lever-supporting pulling',
]

/**
 * CHECK FOR CONTRADICTIONS
 * Returns true if the explanation contradicts the movement family.
 */
function hasContradiction(explanation: string, movementFamily: string): boolean {
  const lower = explanation.toLowerCase()
  
  if (movementFamily === 'pull') {
    // Pull movements should not have pressing as primary benefit
    // Exception: if they explicitly mention pull/pulling context
    for (const pattern of PULL_CONTRADICTION_PATTERNS) {
      if (lower.includes(pattern) && !lower.includes('pull') && !lower.includes('row')) {
        return true
      }
    }
  }
  
  if (movementFamily === 'push') {
    // Push movements should not have pulling as primary benefit
    // Exception: if they explicitly mention press/pushing context
    for (const pattern of PUSH_CONTRADICTION_PATTERNS) {
      if (lower.includes(pattern) && !lower.includes('press') && !lower.includes('push') && !lower.includes('dip')) {
        return true
      }
    }
  }
  
  return false
}

/**
 * GET MOVEMENT-FAMILY-SAFE FALLBACK
 * Returns a truthful, safe explanation when contradiction is detected.
 */
function getMovementFamilySafeFallback(ctx: ExplanationContext): string {
  const { movementFamily, primaryGoal, dayStressProfile, exerciseNameLower } = ctx
  const goal = primaryGoal
  
  if (movementFamily === 'pull') {
    if (goal.includes('front lever')) {
      return 'Builds pulling strength that supports your front lever development.'
    }
    if (goal.includes('muscle')) {
      return 'Builds the pulling strength your muscle-up depends on.'
    }
    if (exerciseNameLower.includes('row')) {
      return 'Horizontal pulling that builds mid-back and scapular control.'
    }
    if (exerciseNameLower.includes('explosive') || exerciseNameLower.includes('chest-to-bar')) {
      return 'Develops high-pull power and bar aggression for skill transitions.'
    }
    return 'Builds pulling capacity your skill work draws from — a stronger back means more reliable positions.'
  }
  
  if (movementFamily === 'push') {
    if (goal.includes('planche')) {
      return 'Builds pressing strength that supports your planche development.'
    }
    if (goal.includes('handstand')) {
      return 'Builds overhead pressing strength your handstand work depends on.'
    }
    if (exerciseNameLower.includes('dip')) {
      return 'Builds pressing strength and lockout power for skill positions.'
    }
    return 'Builds pressing capacity your overhead and horizontal work draws from — raises your ceiling.'
  }
  
  if (movementFamily === 'core') {
    if (goal.includes('planche') || goal.includes('front lever')) {
      return 'Builds the trunk stability your skill positions require.'
    }
    return 'Builds trunk stability that supports body control under load.'
  }
  
  if (movementFamily === 'scap') {
    return 'Builds scapular control and shoulder stability for cleaner skill positions.'
  }
  
  return 'Builds capacity that supports your main training goals.'
}

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
  // ==========================================================================
  // EXPLANATION REASONING ENGINE - MAIN ENTRY POINT
  // ==========================================================================
  
  // Stage A: Build full explanation context
  const ctx = buildExplanationContext(exercise, sessionContext, emphasisKind)
  
  // Stage B: Contradiction guard - ensure movement family is respected
  // This prevents wrong cross-pattern claims (e.g., pull exercise getting press language)
  const { movementFamily } = ctx
  
  // Stage C: Generate explanation from reason family
  const explanation = composeExplanationFromReason(ctx)
  
  // Stage D: Final contradiction check - reject if explanation contradicts movement family
  if (explanation && movementFamily !== 'unknown') {
    if (hasContradiction(explanation, movementFamily)) {
      // Contradiction detected - use movement-family-safe fallback
      return getMovementFamilySafeFallback(ctx)
    }
  }
  
  // Stage E: Quality check - reject overly generic explanations
  const genericPatterns = [
    'accessory support',
    'targeted accessory',
    'support work',
    'general strength',
    'moderate intensity',
    'rpe 8',
  ]
  const explanationLower = explanation.toLowerCase()
  for (const pattern of genericPatterns) {
    if (explanationLower === pattern || explanationLower.startsWith(pattern + '.')) {
      // Too generic - use context-aware fallback
      return getMovementFamilySafeFallback(ctx)
    }
  }
  
  return explanation
}

// =============================================================================
// [EFFORT-REASON-LINE] AUTHORITATIVE RPE/DOSAGE EXPLANATION
// Single owner of "why this effort level today" microcopy for live workout
// =============================================================================

/**
 * Build a concise explanation of WHY this effort level / RPE / dosage was chosen.
 * Returns a short sentence explaining the decision, not just the number.
 * 
 * This is the SINGLE authoritative resolver for effort-level explanations.
 */
export function buildExerciseEffortReasonLine(
  exercise: {
    name?: string
    category?: string
    targetRPE?: number
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
    primaryGoal?: string
    isFirstWeek?: boolean
    isRecoveryConstrained?: boolean
  }
): string {
  // [RPE-DISPLAY-CLEANLINESS-LOCK] Round to clean coaching integer (5-10) so
  // user-facing reasoning strings ("Held at RPE 8 — ...") never leak decimals.
  const rawTargetRPE = exercise.targetRPE ?? 8
  const targetRPE = Math.max(5, Math.min(10, Math.round(rawTargetRPE)))
  const categoryLower = (exercise.category || '').toLowerCase()
  const expressionMode = (exercise.coachingMeta?.expressionMode || '').toLowerCase()
  const roleInSession = (exercise.coachingMeta?.roleInSession || '').toLowerCase()
  const reasonLower = (exercise.selectionReason || '').toLowerCase()
  const primaryGoalLower = (sessionContext?.primaryGoal || '').toLowerCase()
  const sessionFocusLower = (sessionContext?.sessionFocus || '').toLowerCase()
  
  // Helper for goal name
  const goalName = (): string => {
    if (primaryGoalLower.includes('planche')) return 'planche'
    if (primaryGoalLower.includes('front lever')) return 'front lever'
    if (primaryGoalLower.includes('back lever')) return 'back lever'
    if (primaryGoalLower.includes('handstand')) return 'handstand'
    if (primaryGoalLower.includes('muscle')) return 'muscle-up'
    return 'skill'
  }
  
  // ==========================================================================
  // PRIORITY 1: First-week / recovery protection overrides
  // ==========================================================================
  if (sessionContext?.isFirstWeek) {
    if (targetRPE <= 7) {
      return `Held at RPE ${targetRPE} — Week 1 builds pattern quality before intensity.`
    }
    return `Set at RPE ${targetRPE} — conservative start to establish baseline.`
  }
  
  if (sessionContext?.isRecoveryConstrained) {
    if (targetRPE <= 7) {
      return `Moderated to RPE ${targetRPE} — recovery-aware dosage to protect adaptation.`
    }
    return `Capped at RPE ${targetRPE} — manages load while recovery catches up.`
  }
  
  // ==========================================================================
  // PRIORITY 2: Skill work / primary drivers — high technical demand
  // ==========================================================================
  if (categoryLower === 'skill' || exercise.isPrimary || expressionMode.includes('direct') || expressionMode.includes('primary')) {
    if (targetRPE <= 7) {
      return `Held at RPE ${targetRPE} — keeps mechanics clean while building groove.`
    }
    if (targetRPE >= 9) {
      return `Pushed to RPE ${targetRPE} — this is the ceiling test for ${goalName()} today.`
    }
    return `Set at RPE ${targetRPE} — technical work that builds quality reps without collapse.`
  }
  
  // ==========================================================================
  // PRIORITY 3: Strength work — force output slots
  // ==========================================================================
  if (categoryLower === 'strength' || categoryLower === 'push' || categoryLower === 'pull') {
    if (targetRPE >= 9) {
      return `Pushed to RPE ${targetRPE} — main strength driver where overload matters most.`
    }
    if (targetRPE <= 7) {
      return `Held at RPE ${targetRPE} — builds repeatable quality across all sets.`
    }
    // Check if session already has skill stress
    if (sessionFocusLower.includes('skill') || expressionMode.includes('support') || expressionMode.includes('carryover')) {
      return `Set at RPE ${targetRPE} — strength transfer without stealing skill recovery.`
    }
    return `Set at RPE ${targetRPE} — drives strength gains while preserving output quality.`
  }
  
  // ==========================================================================
  // PRIORITY 4: Protection / tissue management
  // ==========================================================================
  if (exercise.isProtected || reasonLower.includes('protect') || reasonLower.includes('tissue') || reasonLower.includes('tendon')) {
    if (targetRPE <= 7) {
      return `Capped at RPE ${targetRPE} — protects connective tissue while maintaining exposure.`
    }
    return `Set at RPE ${targetRPE} — managed load to keep tendons healthy long-term.`
  }
  
  // ==========================================================================
  // PRIORITY 5: Accessory / support work
  // ==========================================================================
  if (categoryLower === 'accessory' || expressionMode.includes('support') || roleInSession.includes('support')) {
    if (targetRPE <= 7) {
      return `Kept at RPE ${targetRPE} — support volume without competing for recovery.`
    }
    if (targetRPE >= 9) {
      return `Pushed to RPE ${targetRPE} — accessory slot carries extra volume today.`
    }
    return `Set at RPE ${targetRPE} — builds capacity without overloading main work.`
  }
  
  // ==========================================================================
  // PRIORITY 6: Core / stability
  // ==========================================================================
  if (categoryLower === 'core') {
    if (targetRPE <= 7) {
      return `Held at RPE ${targetRPE} — trunk quality over trunk fatigue.`
    }
    return `Set at RPE ${targetRPE} — builds the midline stability your skills depend on.`
  }
  
  // ==========================================================================
  // PRIORITY 7: Mobility / prep
  // ==========================================================================
  if (categoryLower === 'mobility' || categoryLower === 'flexibility') {
    return `Effort focus on position quality rather than intensity.`
  }
  
  // ==========================================================================
  // PRIORITY 8: RPE-based fallback with meaningful context
  // ==========================================================================
  if (targetRPE <= 6) {
    return `Held at RPE ${targetRPE} — controlled effort keeps quality high across sets.`
  }
  if (targetRPE === 7) {
    return `Set at RPE ${targetRPE} — quality-focused effort with room to maintain form.`
  }
  if (targetRPE === 8) {
    return `Set at RPE ${targetRPE} — productive intensity without grinding into fatigue.`
  }
  if (targetRPE >= 9) {
    return `Pushed to RPE ${targetRPE} — near-limit effort to drive adaptation.`
  }
  
  // Minimal fallback - still meaningful
  return `Set at RPE ${targetRPE} — calibrated effort for today's session.`
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
  const exerciseNameLower = displayName.toLowerCase()
  
  // ==========================================================================
  // CONTRADICTION GUARD: Derive the exercise's TRUE movement family
  // This prevents session-focus or category-fallback from overriding reality
  // ==========================================================================
  const pullKeywords = ['pull', 'row', 'chin', 'lat', 'bicep', 'curl', 'lever row', 'front lever', 'back lever', 'muscle-up', 'muscle up', 'transition']
  const pushKeywords = ['push', 'dip', 'press', 'planche', 'handstand', 'pike', 'tricep', 'extension', 'pppu', 'pseudo', 'hspu']
  const coreKeywords = ['hollow', 'plank', 'dead bug', 'deadbug', 'l-sit', 'lsit', 'leg raise', 'pallof', 'anti-rotation', 'compression', 'side plank', 'copenhagen']
  const scapKeywords = ['face pull', 'y raise', 'i raise', 'cuban', 'band pull', 'pull-apart', 'rear delt', 'reverse fly', 'serratus']
  
  const isPullMovement = pullKeywords.some(kw => exerciseNameLower.includes(kw))
  const isPushMovement = pushKeywords.some(kw => exerciseNameLower.includes(kw))
  const isCoreMovement = coreKeywords.some(kw => exerciseNameLower.includes(kw))
  const isScapMovement = scapKeywords.some(kw => exerciseNameLower.includes(kw))
  
  type MovementFamily = 'pull' | 'push' | 'core' | 'scap' | 'unknown'
  let movementFamily: MovementFamily = 'unknown'
  if (isPullMovement && !isPushMovement) movementFamily = 'pull'
  else if (isPushMovement && !isPullMovement) movementFamily = 'push'
  else if (isCoreMovement) movementFamily = 'core'
  else if (isScapMovement) movementFamily = 'scap'
  
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
  // D. Build intent label — LOCAL FUNCTION FIRST, not goal-labeled
  // ==========================================================================
  let intentLabel: string | null = null
  const sessionIntent = (sessionContext?.compositionMetadata?.sessionIntent || '').toLowerCase()
  
  // PRIORITY 1: Expression mode signals (for direct skill work only)
  if (expressionMode.includes('direct') || expressionMode.includes('intensity')) {
    // Only skill work should be goal-labeled
    intentLabel = 'Primary skill exposure'
    source = 'authoritative'
  } else if (expressionMode.includes('technical') || expressionMode.includes('carryover')) {
    intentLabel = 'Technical carryover'
    source = 'authoritative'
  } else if (expressionMode.includes('support') || expressionMode.includes('strength_support')) {
    intentLabel = 'Strength foundation'
    source = 'authoritative'
  }
  // PRIORITY 2: Role in session signals — LOCAL function labels
  else if (roleInSession.includes('primary') || roleInSession.includes('main')) {
    intentLabel = 'Main driver'
    source = 'authoritative'
  } else if (roleInSession.includes('support')) {
    intentLabel = 'Support volume'
    source = 'authoritative'
  } else if (roleInSession.includes('accessory')) {
    intentLabel = 'Accessory work'
    source = 'authoritative'
  } else if (roleInSession.includes('overload')) {
    intentLabel = 'Overload slot'
    source = 'authoritative'
  } else if (roleInSession.includes('technique') || roleInSession.includes('quality')) {
    intentLabel = 'Technique slot'
    source = 'authoritative'
  }
  // PRIORITY 3: Movement family + Category — CONTRADICTION-GUARDED
  // Use movement family to ensure pull exercises say "pulling", not "pressing"
  else if (categoryLower === 'skill') {
    intentLabel = 'Skill work'
    source = 'authoritative'
  } else if (movementFamily === 'pull' || categoryLower === 'pull') {
    // Pull movement — always say pulling, regardless of session focus
    if (sessionIntent.includes('overload') || sessionIntent.includes('strength') || sessionIntent.includes('power')) {
      intentLabel = 'Pulling power'
    } else if (sessionIntent.includes('volume')) {
      intentLabel = 'Pulling volume'
    } else {
      intentLabel = 'Pulling strength'
    }
    source = 'authoritative'
  } else if (movementFamily === 'push' || categoryLower === 'push') {
    // Push movement — always say pressing, regardless of session focus
    if (sessionIntent.includes('overload') || sessionIntent.includes('strength')) {
      intentLabel = 'Pressing overload'
    } else if (sessionIntent.includes('volume')) {
      intentLabel = 'Pressing volume'
    } else {
      intentLabel = 'Pressing strength'
    }
    source = 'authoritative'
  } else if (categoryLower === 'strength') {
    // Generic strength — use movement family if available
    if (movementFamily === 'pull') {
      intentLabel = 'Pulling strength'
    } else if (movementFamily === 'push') {
      intentLabel = 'Pressing strength'
    } else if (sessionIntent.includes('overload') || sessionIntent.includes('strength')) {
      intentLabel = 'Strength overload'
    } else if (sessionIntent.includes('volume')) {
      intentLabel = 'Strength volume'
    } else {
      intentLabel = 'Strength builder'
    }
    source = 'authoritative'
  } else if (movementFamily === 'core' || categoryLower === 'core') {
    // Core movement — state trunk function
    intentLabel = 'Trunk stability'
    source = 'authoritative'
  } else if (movementFamily === 'scap') {
    // Scap movement — state scap function
    intentLabel = 'Scap control'
    source = 'authoritative'
  } else if (categoryLower === 'accessory') {
    // State local accessory BENEFIT, not just category
    if (reasonLower.includes('scap') || reasonLower.includes('shoulder')) {
      intentLabel = 'Shoulder stability'
    } else if (reasonLower.includes('posterior') || reasonLower.includes('rear delt')) {
      intentLabel = 'Posterior balance'
    } else if (reasonLower.includes('wrist') || reasonLower.includes('forearm')) {
      intentLabel = 'Joint conditioning'
    } else if (reasonLower.includes('tricep') || reasonLower.includes('lockout')) {
      intentLabel = 'Lockout strength'
    } else if (reasonLower.includes('bicep') || reasonLower.includes('curl')) {
      intentLabel = 'Pull durability'
    } else if (reasonLower.includes('lat') || reasonLower.includes('serratus')) {
      intentLabel = 'Lat activation'
    } else if (reasonLower.includes('push') || reasonLower.includes('press')) {
      intentLabel = 'Press support'
    } else if (reasonLower.includes('pull') || reasonLower.includes('row')) {
      intentLabel = 'Pull support'
    } else {
      intentLabel = 'Structural support'
    }
    source = 'authoritative'
  } else if (categoryLower === 'mobility' || categoryLower === 'flexibility') {
    if (reasonLower.includes('shoulder') || reasonLower.includes('overhead')) {
      intentLabel = 'Shoulder mobility'
    } else if (reasonLower.includes('hip') || reasonLower.includes('pike')) {
      intentLabel = 'Hip mobility'
    } else if (reasonLower.includes('wrist')) {
      intentLabel = 'Wrist prep'
    } else {
      intentLabel = 'Range work'
    }
    source = 'authoritative'
  }
  
  // PRIORITY 4: Selection reason keywords for specificity override
  if (reasonLower.includes('volume build') || reasonLower.includes('accumulation')) {
    intentLabel = 'Volume slot'
    source = 'authoritative'
  } else if (reasonLower.includes('technique') || reasonLower.includes('form') || reasonLower.includes('quality')) {
    intentLabel = 'Technique slot'
    source = 'authoritative'
  } else if (reasonLower.includes('recovery') || reasonLower.includes('deload')) {
    intentLabel = 'Recovery-aware'
    source = 'authoritative'
  } else if (reasonLower.includes('overload') || reasonLower.includes('max')) {
    intentLabel = 'Overload slot'
    source = 'authoritative'
  } else if (reasonLower.includes('tissue') || reasonLower.includes('protect')) {
    intentLabel = 'Tissue-managed'
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
      supportReasonLabel = 'Keeps pressing positions cleaner'
      source = 'authoritative'
    } else if (reasonLower.includes('rear delt') || reasonLower.includes('face pull') || reasonLower.includes('posterior')) {
      supportReasonLabel = 'Balances pressing load on the joint'
      source = 'authoritative'
    } else if (reasonLower.includes('core') || reasonLower.includes('trunk') || reasonLower.includes('compression')) {
      supportReasonLabel = 'Stops line from collapsing under load'
      source = 'authoritative'
    } else if (reasonLower.includes('grip') || reasonLower.includes('hang') || reasonLower.includes('forearm')) {
      supportReasonLabel = 'Keeps grip reliable under fatigue'
      source = 'authoritative'
    } else if (reasonLower.includes('hip') || reasonLower.includes('glute') || reasonLower.includes('posterior chain')) {
      supportReasonLabel = 'Supports body-line tension'
      source = 'authoritative'
    } else if (reasonLower.includes('straight-arm') || reasonLower.includes('straight arm') || reasonLower.includes('tendon')) {
      supportReasonLabel = 'Conditions tissue for straight-arm load'
      source = 'authoritative'
    } else if (reasonLower.includes('wrist')) {
      supportReasonLabel = 'Protects wrist under press load'
      source = 'authoritative'
    } else if (reasonLower.includes('tricep') || reasonLower.includes('lockout')) {
      supportReasonLabel = 'Improves pressing lockout'
      source = 'authoritative'
    } else if (reasonLower.includes('bicep') || reasonLower.includes('elbow')) {
      supportReasonLabel = 'Supports pulling durability'
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
  
  // ==========================================================================
  // [COACHING-EXPLANATION-CONTRACT] AUTHORITATIVE AI COACHING EXPLANATIONS
  // ==========================================================================
  
  /** Coaching explanation surface - authoritative doctrine-driven explanations */
  coachingExplanation: ProgramExplanationSurface | null
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
  
  // [COACHING-EXPLANATION-CONTRACT] Build authoritative coaching explanation surface
  let coachingExplanation: ProgramExplanationSurface | null = null
  try {
    coachingExplanation = buildProgramExplanationSurface(program)
    console.log('[coaching-explanation-contract] Built coaching explanation surface:', {
      programId: program.id,
      hasProgram: !!coachingExplanation.program,
      sessionCount: coachingExplanation.sessions.length,
      exerciseCount: coachingExplanation.exercises.size,
      source: coachingExplanation.inputTruthSource,
    })
  } catch (err) {
    console.error('[coaching-explanation-contract] Failed to build coaching explanation:', err)
    // Fail gracefully - explanation is optional enhancement
  }
  
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
    coachingExplanation,
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

// =============================================================================
// [PHASE 4F] PROGRAM DISPLAY PROJECTION — FINAL DISPLAY OWNERSHIP LOCK
// =============================================================================
//
// What this is
// ------------
// A read-only, page-level projection that extracts the EXACT visible-display
// truth a Program day card must consume, in a single shape. It is the minimal
// honest answer to:
//
//   "For this exact session, did doctrine cause an actual material change to
//    the user-facing program — and if not, what is the honest reason?"
//
// What this is NOT
// ----------------
//   * It is NOT a second program builder. It does not pick exercises, does
//     not pick methods, does not mutate prescriptions, does not invent new
//     truth, does not override safety/progression logic.
//   * It is NOT a proof label. It does NOT count rules / sources / batches /
//     "data-driven identifiers." Those counts have repeatedly looked like
//     success without the visible card actually changing — Phase 4F refuses
//     to use them as proof of causality.
//   * It is NOT a parallel display owner. It enriches, formats, and audits
//     existing display truth (`session.styleMetadata`, `session.methodDecision`,
//     `session.methodMaterializationSummary`, `program.doctrineCausalChallenge`)
//     so the day card has ONE consume-only object.
//
// Why it exists
// -------------
// Phase 4D fixed the doctrine influence TDZ (so doctrine actually reaches
// generation). Phase 4E added `program.doctrineCausalChallenge` which carries
// per-session pre-doctrine vs post-doctrine top-3 audits — the literal truth
// of whether doctrine changed any winner. Phase 4E only surfaces ONE roll-up
// line at the top of the page; the big day card body is still silent on
// whether doctrine touched THIS session. So a user who clicks "regenerate"
// and sees "the same program" cannot tell which sessions doctrine evaluated,
// which it had no rules for, and which it could not beat in scoring.
//
// Phase 4F closes that gap. The projection per-session carries:
//   * `doctrineCausalDisplay`: per-session honest verdict mapped from
//     `program.doctrineCausalChallenge.sessionDiffs[]`
//   * `sourceAudit`: explicit ownership map for the card body (which fields
//     the card SHOULD render from this projection vs. raw session)
//
// Honest contract
// ---------------
//   * `materialChanged` is true ONLY if Phase 4E recorded
//     `topCandidateChanged === true` for that session. Top-3-changed alone
//     is NOT material change (the visible top winner is unchanged).
//   * `visibleChanged` is true ONLY if `materialChanged` is true AND the
//     final displayed exercise list reflects the post-doctrine top winner.
//     Today this equals `materialChanged` because the post-doctrine top
//     winner IS what the selector returns. If a future architecture step
//     evicts the doctrine winner, the audit must record the divergence
//     instead of silently flipping `visibleChanged` to false.
//   * If neither `materialChanged` nor `visibleChanged` is true, the
//     projection MUST attach an honest `noChangeReason` explaining why —
//     not a proof label.
// =============================================================================

/** Phase 4E session-diff record shape, narrowed for read-only consumption. */
interface DoctrineCausalChallengeSessionDiff {
  sessionIndex: number
  dayNumber: number
  dayFocus: string
  topCandidateChanged: boolean
  top3Changed: boolean
  doctrineApplied: boolean
  candidatesAffected: number
  rulesMatchedTotal: number
  preDoctrineTop3: string[]
  postDoctrineTop3: string[]
  fallbackReason: string | null
  perSessionVerdict:
    | 'doctrine_changed_top_winner'
    | 'doctrine_changed_top3_only'
    | 'doctrine_affected_scores_only'
    | 'doctrine_ran_no_match'
    | 'doctrine_cache_empty'
    | 'doctrine_did_not_run'
}

/** Phase 4E program-level rollup shape, narrowed for read-only consumption. */
interface DoctrineCausalChallengeRollup {
  version?: string
  doctrineEnabled?: boolean
  sessionsEvaluated?: number
  sessionsWithAudit?: number
  sessionsTopCandidateChanged?: number
  sessionsTop3Changed?: number
  sessionsCandidatesAffectedButNoWinnerChange?: number
  sessionsDoctrineCacheEmpty?: number
  sessionsNoMatchingRules?: number
  materialProgramChanged?: boolean
  unchangedVerdict?: string
  finalVerdict?: string
  sessionDiffs?: DoctrineCausalChallengeSessionDiff[]
}

/** Per-session display projection slice — what the day card body must render. */
export interface ProgramDisplayProjectionSession {
  dayNumber: number
  dayFocus: string | null
  /** Stable fingerprint for matching projection ↔ rendered session. */
  fingerprint: string

  /** Per-session doctrine causal display. Pulled from Phase 4E sessionDiffs. */
  doctrineCausalDisplay: {
    /** Phase 4E recorded a per-session diff for this session. */
    available: boolean
    /** Doctrine actually changed the top exercise winner in this session. */
    materialChanged: boolean
    /** Doctrine-induced winner change reaches the visible exercise list. */
    visibleChanged: boolean
    /** Phase 4E perSessionVerdict, surfaced as-is for downstream display. */
    verdict: DoctrineCausalChallengeSessionDiff['perSessionVerdict'] | null
    /** Compact athlete-facing summary. Honest. Never claims change without proof. */
    summary: string | null
    /** Names of the post-doctrine top-3 candidates (for "changed" only). */
    postDoctrineTop3: string[]
    /** Names of the pre-doctrine top-3 candidates (for "changed" only). */
    preDoctrineTop3: string[]
    /** When unchanged, the honest reason category. Never set when changed. */
    noChangeReason:
      | 'doctrine_evaluated_base_won'
      | 'doctrine_top3_changed_top1_did_not'
      | 'doctrine_no_matching_rules'
      | 'doctrine_cache_empty'
      | 'doctrine_did_not_run'
      | null
  }

  /** Source-of-truth audit for this session's visible fields. */
  sourceAudit: {
    /** Doctrine causal display source — always Phase 4E rollup. */
    doctrineCausalSource: 'doctrineCausalChallenge.sessionDiffs' | 'unavailable'
    /** Whether ANY field is sourced from a non-projection / non-canonical owner. */
    noMixedOwnership: boolean
  }
}

/**
 * Top-level Program display projection — page-level single-owner display object.
 *
 * Built once at page load from the same `program` object the rest of the page
 * uses. Passed down to `AdaptiveProgramDisplay`, which looks up per-session
 * by `dayNumber` and passes the matching slice to `AdaptiveSessionCard`. The
 * card renders projection-owned visible claims (the per-session doctrine
 * causal line) inside the body — not just in a wrapper strip.
 */
export interface ProgramDisplayProjection {
  programId: string
  generatedAt: string | null
  sourceProgramVersion: string | null
  projectionVersion: 'phase4f.display-projection-lock.v1'
  projectionSource: 'authoritative_program'
  /** Whether the saved program predates Phase 4E and lacks the causal rollup. */
  legacyMissingCausalChallenge: boolean
  /** Per-session projection slices — one per `program.sessions[]` element with a valid `dayNumber`. */
  sessions: ProgramDisplayProjectionSession[]
  /** Aggregate roll-up audit for the whole projection. */
  audit: {
    sessionCount: number
    projectedSessionCount: number
    sessionsWithCausalDisplay: number
    sessionsWithMaterialChange: number
    sessionsWithVisibleChange: number
    /** False only if a session was projected without a matching causal slot. */
    noMixedOwnership: boolean
    /** Names of fields the projection had to repair / format. */
    repairedFields: string[]
    /** Names of fields the projection could not surface from the source. */
    lostFields: string[]
  }
}

/**
 * Build a per-session honest doctrine-causal display from a Phase 4E session diff.
 * Pure / no side effects. Returns null only when input is null.
 */
function projectDoctrineCausalDisplay(
  diff: DoctrineCausalChallengeSessionDiff | null
): ProgramDisplayProjectionSession['doctrineCausalDisplay'] {
  if (!diff) {
    return {
      available: false,
      materialChanged: false,
      visibleChanged: false,
      verdict: null,
      summary: null,
      postDoctrineTop3: [],
      preDoctrineTop3: [],
      noChangeReason: 'doctrine_did_not_run',
    }
  }

  // Material change is RIGOROUS: only `topCandidateChanged` counts. Top-3-only
  // change does NOT visibly differ — the user's number-one slot is unchanged.
  const materialChanged = diff.topCandidateChanged === true
  // visibleChanged === materialChanged today because the selector's chosen
  // top winner IS the rendered exercise. If a downstream architecture pass
  // ever drops a doctrine winner, that divergence will be caught by future
  // audit work — and this projection will then begin to honestly diverge.
  const visibleChanged = materialChanged

  if (materialChanged) {
    const topPost = diff.postDoctrineTop3[0] || null
    const topPre = diff.preDoctrineTop3[0] || null
    const summary = topPost && topPre
      ? `Doctrine selected ${topPost} over ${topPre}`
      : topPost
        ? `Doctrine selected ${topPost}`
        : 'Doctrine changed the top exercise selection for this session'
    return {
      available: true,
      materialChanged: true,
      visibleChanged: true,
      verdict: diff.perSessionVerdict,
      summary,
      postDoctrineTop3: diff.postDoctrineTop3,
      preDoctrineTop3: diff.preDoctrineTop3,
      noChangeReason: null,
    }
  }

  // Unchanged — classify the honest reason from the per-session verdict.
  let noChangeReason: ProgramDisplayProjectionSession['doctrineCausalDisplay']['noChangeReason'] = 'doctrine_did_not_run'
  let summary: string | null = null
  switch (diff.perSessionVerdict) {
    case 'doctrine_changed_top3_only':
      noChangeReason = 'doctrine_top3_changed_top1_did_not'
      summary = 'Doctrine reordered alternatives but the top selection was unchanged'
      break
    case 'doctrine_affected_scores_only':
      noChangeReason = 'doctrine_evaluated_base_won'
      summary = 'Doctrine evaluated alternatives — base ranking won this session'
      break
    case 'doctrine_ran_no_match':
      noChangeReason = 'doctrine_no_matching_rules'
      summary = 'No doctrine rule matched this session\u2019s candidates'
      break
    case 'doctrine_cache_empty':
      noChangeReason = 'doctrine_cache_empty'
      summary = 'Doctrine rules cache was unavailable when this program was built'
      break
    case 'doctrine_did_not_run':
    default:
      noChangeReason = 'doctrine_did_not_run'
      summary = 'Doctrine did not run on this session'
      break
  }

  return {
    available: true,
    materialChanged: false,
    visibleChanged: false,
    verdict: diff.perSessionVerdict,
    summary,
    postDoctrineTop3: diff.postDoctrineTop3,
    preDoctrineTop3: diff.preDoctrineTop3,
    noChangeReason,
  }
}

/**
 * [PHASE 4F] Build the page-level Program display projection.
 *
 * Single-owner read-only projection. Called ONCE per page render at the
 * page level (`app/(app)/program/page.tsx`) and passed down to
 * `AdaptiveProgramDisplay`. The day card consumes the per-session slice
 * matched by `dayNumber`.
 *
 * Honest contract:
 *   * Reads `program.doctrineCausalChallenge` only if it has the Phase 4E
 *     `version === 'phase4e-doctrine-ab-causal-challenge-v1'`. Older saved
 *     programs surface `legacyMissingCausalChallenge: true` and the card
 *     renders no doctrine causal line for those sessions.
 *   * Never invents a session diff. If a session has no matching diff, its
 *     `doctrineCausalDisplay.available` is false.
 *   * Never claims `materialChanged` without `topCandidateChanged === true`.
 */
export function buildProgramDisplayProjection(
  program: AdaptiveProgram | null | undefined
): ProgramDisplayProjection | null {
  if (!program) return null

  const programId = (program as unknown as { id?: string }).id || ''
  const generatedAt = (program as unknown as { generatedAt?: string }).generatedAt || null
  const sourceProgramVersion = (program as unknown as { doctrineCausalVersion?: string }).doctrineCausalVersion || null

  // [PHASE 4E LINK] Only consume the rollup if it carries the Phase 4E version
  // stamp. Older saved programs may have a partial / stale shape — we refuse
  // to fabricate a verdict from those. legacyMissingCausalChallenge is the
  // honest signal the UI uses to either show "regenerate to refresh" or
  // simply omit the causal line for that session.
  const causalRollup = (program as unknown as { doctrineCausalChallenge?: DoctrineCausalChallengeRollup })
    .doctrineCausalChallenge || null
  const legacyMissingCausalChallenge =
    !causalRollup || causalRollup.version !== 'phase4e-doctrine-ab-causal-challenge-v1'

  // Index session diffs by dayNumber so per-session lookup is a Map get().
  // Phase 4E pushes one diff per session in builder iteration order, but we
  // explicitly key on `dayNumber` (not array index) because session arrays
  // can be filtered/sliced downstream and order is not guaranteed at the
  // page level.
  const diffByDay = new Map<number, DoctrineCausalChallengeSessionDiff>()
  if (!legacyMissingCausalChallenge && causalRollup?.sessionDiffs) {
    for (const d of causalRollup.sessionDiffs) {
      if (typeof d.dayNumber === 'number') {
        diffByDay.set(d.dayNumber, d)
      }
    }
  }

  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  const repairedFields: string[] = []
  const lostFields: string[] = []
  let sessionsWithCausalDisplay = 0
  let sessionsWithMaterialChange = 0
  let sessionsWithVisibleChange = 0

  const projectedSessions: ProgramDisplayProjectionSession[] = []
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i] as unknown as { dayNumber?: number; focusLabel?: string; dayLabel?: string; name?: string } | null
    if (!s || typeof s !== 'object') continue
    const dayNumber = typeof s.dayNumber === 'number' ? s.dayNumber : i + 1
    const dayFocus = s.focusLabel || s.dayLabel || s.name || null

    const diff = diffByDay.get(dayNumber) || null
    const causalDisplay = projectDoctrineCausalDisplay(diff)

    if (causalDisplay.available) {
      sessionsWithCausalDisplay++
      if (causalDisplay.materialChanged) sessionsWithMaterialChange++
      if (causalDisplay.visibleChanged) sessionsWithVisibleChange++
    }

    // Stable fingerprint for projection ↔ render matching. Combines dayNumber,
    // focus, and program id so two cards rendered for different programs cannot
    // accidentally match the wrong projection slice.
    const fingerprint = `${programId}::day-${dayNumber}::${dayFocus || 'no-focus'}`

    projectedSessions.push({
      dayNumber,
      dayFocus,
      fingerprint,
      doctrineCausalDisplay: causalDisplay,
      sourceAudit: {
        doctrineCausalSource: diff
          ? 'doctrineCausalChallenge.sessionDiffs'
          : 'unavailable',
        noMixedOwnership: true, // single-owner: causal display is from Phase 4E rollup only
      },
    })
  }

  if (legacyMissingCausalChallenge) {
    lostFields.push('doctrineCausalChallenge.sessionDiffs (legacy program)')
  }

  return {
    programId,
    generatedAt,
    sourceProgramVersion,
    projectionVersion: 'phase4f.display-projection-lock.v1',
    projectionSource: 'authoritative_program',
    legacyMissingCausalChallenge,
    sessions: projectedSessions,
    audit: {
      sessionCount: sessions.length,
      projectedSessionCount: projectedSessions.length,
      sessionsWithCausalDisplay,
      sessionsWithMaterialChange,
      sessionsWithVisibleChange,
      noMixedOwnership: projectedSessions.every(p => p.sourceAudit.noMixedOwnership),
      repairedFields,
      lostFields,
    },
  }
}
