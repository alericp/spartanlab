/**
 * SET / VOLUME PRESCRIPTION RATIONALE — MASTER-8C.17
 *
 * =============================================================================
 * READ-ONLY ANALYZER FOR EXPLAINING CURRENT SET COUNTS
 * =============================================================================
 *
 * This module provides a pure, read-only analyzer that explains why visible
 * exercise rows have their current set counts (3/4/5+) based on:
 *   - Exercise role (skill, strength, accessory, support, warmup, cooldown)
 *   - Progression difficulty / skill level
 *   - Method context (straight set, superset, circuit, cluster, drop set)
 *   - Session/day role (primary, secondary, support, recovery, volume day)
 *   - Intensity/RPE/rest context
 *   - Tendon/joint stress factors
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, JSON-safe, side-effect free
 *   - No React, no DOM, no localStorage
 *   - No saveAdaptiveProgram, no Date.now (unless not persisted)
 *   - No mutation functions - EXPLANATION ONLY
 *   - No database calls, no route calls
 *   - No `as any`, no `@ts-ignore`, no `@ts-expect-error`
 *
 * This analyzer does NOT change any prescriptions. It explains them.
 *
 * Created: May 16th, 2026
 * Step: MASTER-8C.17 / AB20.4.10
 */

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Input shape for the prescription rationale resolver.
 * Accepts flexible but typed data from Program Card / session row truth.
 */
export interface SetVolumeRationaleInput {
  /** Exercise name */
  exerciseName: string
  /** Exercise ID if available */
  exerciseId?: string
  /** Exercise role/category */
  exerciseRole?: ExerciseRoleHint
  /** Number of sets prescribed */
  sets: number
  /** Reps or hold duration display string */
  repsOrTime?: string | number | null
  /** Target RPE if available */
  targetRPE?: number | string | null
  /** Rest seconds if available */
  restSeconds?: number | null
  /** Session title / day label */
  sessionTitle?: string
  /** Session role / day role */
  sessionRole?: SessionRoleHint
  /** Weekly role or intensity class */
  weeklyIntensity?: WeeklyIntensityHint
  /** Method/grouped context */
  methodContext?: MethodContextHint
  /** Whether this is part of a grouped block (superset, circuit, etc.) */
  isGrouped?: boolean
  /** Group ID if part of a grouped block */
  groupId?: string
  /** Exercise knowledge match if available */
  knowledgeMatch?: ExerciseKnowledgeHint
}

export type ExerciseRoleHint =
  | 'skill'
  | 'strength'
  | 'accessory'
  | 'support'
  | 'warmup'
  | 'cooldown'
  | 'finisher'
  | 'prehab'
  | 'mobility'
  | 'core'
  | 'unknown'

export type SessionRoleHint =
  | 'primary'
  | 'secondary'
  | 'support'
  | 'recovery'
  | 'balanced'
  | 'heavier_strength'
  | 'volume'
  | 'technique'
  | 'deload'
  | 'unknown'

export type WeeklyIntensityHint =
  | 'high'
  | 'moderate'
  | 'low'
  | 'deload'
  | 'accumulation'
  | 'intensification'
  | 'realization'
  | 'unknown'

export type MethodContextHint =
  | 'straight_set'
  | 'superset'
  | 'circuit'
  | 'cluster'
  | 'drop_set'
  | 'density'
  | 'emom'
  | 'amrap'
  | 'finisher'
  | 'unknown'

export interface ExerciseKnowledgeHint {
  /** Is this a high-skill movement requiring quality over volume? */
  isHighSkill?: boolean
  /** Is this high tendon/joint stress (straight-arm, planche, etc.)? */
  isHighTendonStress?: boolean
  /** Is this easier/support work that tolerates higher volume? */
  isEasierAccessory?: boolean
  /** Is this a selected skill transfer exercise? */
  isSelectedSkillTransfer?: boolean
  /** Difficulty tier if known */
  difficultyTier?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
}

// =============================================================================
// OUTPUT TYPES
// =============================================================================

/**
 * Verdict categories for set count justification.
 */
export type SetVolumeVerdict =
  | 'well_justified'        // Clear rationale exists
  | 'reasonable_but_watch'  // Acceptable but monitor
  | 'weakly_justified'      // Needs stronger source support
  | 'missing_source_context' // Cannot evaluate - data missing
  | 'not_applicable'        // Warmup/cooldown/mobility - no verdict needed

/**
 * Set count classification.
 */
export type SetCountClass =
  | 'low_volume'       // 1-2 sets
  | 'standard_volume'  // 3 sets
  | 'high_volume'      // 4 sets
  | 'very_high_volume' // 5+ sets
  | 'unknown'

/**
 * Confidence level for the rationale.
 */
export type RationaleConfidence = 'low' | 'medium' | 'high'

/**
 * Output shape from the prescription rationale resolver.
 */
export interface SetVolumePrescriptionRationale {
  /** Whether this rationale should be rendered in UI */
  shouldRender: boolean
  /** Overall verdict on set count justification */
  verdict: SetVolumeVerdict
  /** Short label for UI chip */
  label: string
  /** One-line explanation */
  shortText: string
  /** Optional longer detail text */
  detailText?: string
  /** Confidence in this assessment */
  confidence: RationaleConfidence
  /** Classification of set count */
  setCountClass: SetCountClass
  /** Factors detected that support the verdict */
  detectedFactors: string[]
  /** Caution flags to surface */
  cautionFlags: string[]
  /** Source basis for the rationale */
  sourceBasis: string[]
}

// =============================================================================
// CONSTANTS
// =============================================================================

const EMPTY_RATIONALE: SetVolumePrescriptionRationale = {
  shouldRender: false,
  verdict: 'not_applicable',
  label: '',
  shortText: '',
  confidence: 'low',
  setCountClass: 'unknown',
  detectedFactors: [],
  cautionFlags: [],
  sourceBasis: [],
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function classifySetCount(sets: number): SetCountClass {
  if (sets <= 0) return 'unknown'
  if (sets <= 2) return 'low_volume'
  if (sets === 3) return 'standard_volume'
  if (sets === 4) return 'high_volume'
  return 'very_high_volume' // 5+
}

function normalizeExerciseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function detectHighSkillMarkers(name: string): boolean {
  const normalized = normalizeExerciseName(name)
  const highSkillPatterns = [
    /muscle.?up/,
    /planche/,
    /front.?lever/,
    /back.?lever/,
    /iron.?cross/,
    /maltese/,
    /handstand/,
    /hspu/,
    /l.?sit/,
    /v.?sit/,
    /manna/,
    /ring/,
    /archer/,
    /one.?arm/,
    /pistol/,
    /dragon.?flag/,
    /human.?flag/,
  ]
  return highSkillPatterns.some(p => p.test(normalized))
}

function detectHighTendonStress(name: string): boolean {
  const normalized = normalizeExerciseName(name)
  const tendonStressPatterns = [
    /straight.?arm/,
    /planche/,
    /iron.?cross/,
    /maltese/,
    /front.?lever/,
    /back.?lever/,
    /ring.?support/,
    /ring.?turned.?out/,
    /rto/,
    /pseudo.?planche/,
    /pppu/,
    /skin.?the.?cat/,
    /german.?hang/,
  ]
  return tendonStressPatterns.some(p => p.test(normalized))
}

function detectEasierAccessory(name: string, role?: ExerciseRoleHint): boolean {
  if (role === 'accessory' || role === 'support') return true
  const normalized = normalizeExerciseName(name)
  const easierPatterns = [
    /bicep.?curl/,
    /tricep/,
    /lateral.?raise/,
    /face.?pull/,
    /band.?pull/,
    /dead.?hang/,
    /scapular/,
    /calf/,
    /shrug/,
    /wrist/,
    /forearm/,
    /reverse.?fly/,
    /rear.?delt/,
  ]
  return easierPatterns.some(p => p.test(normalized))
}

function detectWarmupCooldown(name: string, role?: ExerciseRoleHint): boolean {
  if (role === 'warmup' || role === 'cooldown' || role === 'mobility') return true
  const normalized = normalizeExerciseName(name)
  const warmupPatterns = [
    /warm.?up/,
    /mobility/,
    /stretch/,
    /foam.?roll/,
    /activation/,
    /cool.?down/,
    /recovery/,
  ]
  return warmupPatterns.some(p => p.test(normalized))
}

function parseRPE(rpe: number | string | null | undefined): number | null {
  if (rpe === null || rpe === undefined) return null
  const num = typeof rpe === 'number' ? rpe : parseFloat(String(rpe))
  return isNaN(num) ? null : num
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

/**
 * Resolve set/volume prescription rationale for an exercise row.
 * 
 * This is a PURE, READ-ONLY function that explains why the current
 * set count exists. It does NOT change anything.
 */
export function resolveSetVolumePrescriptionRationale(
  input: SetVolumeRationaleInput
): SetVolumePrescriptionRationale {
  const {
    exerciseName,
    sets,
    repsOrTime,
    targetRPE,
    restSeconds,
    exerciseRole,
    sessionRole,
    methodContext,
    isGrouped,
    knowledgeMatch,
  } = input

  // Skip warmup/cooldown/mobility rows
  if (detectWarmupCooldown(exerciseName, exerciseRole)) {
    return EMPTY_RATIONALE
  }

  // Skip invalid set counts
  if (sets <= 0 || !Number.isFinite(sets)) {
    return EMPTY_RATIONALE
  }

  const setCountClass = classifySetCount(sets)
  const detectedFactors: string[] = []
  const cautionFlags: string[] = []
  const sourceBasis: string[] = []

  // Detect exercise characteristics
  const isHighSkill = knowledgeMatch?.isHighSkill ?? detectHighSkillMarkers(exerciseName)
  const isHighTendon = knowledgeMatch?.isHighTendonStress ?? detectHighTendonStress(exerciseName)
  const isEasier = knowledgeMatch?.isEasierAccessory ?? detectEasierAccessory(exerciseName, exerciseRole)
  const isGroupedMethod = isGrouped || (methodContext && methodContext !== 'straight_set')

  // Build detected factors
  if (isHighSkill) {
    detectedFactors.push('high-skill movement')
    sourceBasis.push('exercise name pattern')
  }
  if (isHighTendon) {
    detectedFactors.push('high tendon/joint stress')
    sourceBasis.push('exercise name pattern')
  }
  if (isEasier) {
    detectedFactors.push('easier/support work')
    sourceBasis.push('exercise role classification')
  }
  if (isGroupedMethod) {
    detectedFactors.push(`grouped method: ${methodContext || 'superset'}`)
    sourceBasis.push('method context')
  }

  // Parse RPE for intensity context
  const rpeValue = parseRPE(targetRPE)
  if (rpeValue !== null) {
    if (rpeValue >= 8) {
      detectedFactors.push('high intensity (RPE 8+)')
    } else if (rpeValue <= 6) {
      detectedFactors.push('controlled intensity (RPE 6-)')
    }
    sourceBasis.push('RPE target')
  }

  // Parse rest for recovery context
  if (restSeconds !== null && restSeconds !== undefined) {
    if (restSeconds >= 180) {
      detectedFactors.push('long rest (strength-focused)')
    } else if (restSeconds <= 60) {
      detectedFactors.push('short rest (metabolic/density)')
    }
    sourceBasis.push('rest prescription')
  }

  // Session role context
  if (sessionRole && sessionRole !== 'unknown') {
    detectedFactors.push(`session role: ${sessionRole}`)
    sourceBasis.push('session context')
  }

  // -------------------------------------------------------------------------
  // VERDICT LOGIC
  // -------------------------------------------------------------------------

  let verdict: SetVolumeVerdict = 'missing_source_context'
  let label = ''
  let shortText = ''
  let detailText: string | undefined
  let confidence: RationaleConfidence = 'low'

  // LOW VOLUME (1-2 sets)
  if (setCountClass === 'low_volume') {
    verdict = 'well_justified'
    label = 'Low volume'
    shortText = 'Primer/exposure dose - skill practice or deload context.'
    confidence = 'medium'
    if (isHighSkill) {
      shortText = 'Skill exposure dose - quality over quantity for high-skill work.'
      confidence = 'high'
    }
  }

  // STANDARD VOLUME (3 sets)
  else if (setCountClass === 'standard_volume') {
    verdict = 'well_justified'
    label = 'Standard dose'
    shortText = 'Standard 3-set dose - balanced volume and recovery.'
    confidence = 'high'
    
    if (isHighSkill) {
      shortText = 'Standard 3-set dose for skill work - quality/fatigue control prioritized.'
      detailText = 'High-skill movements benefit from moderate volume to maintain technique quality.'
    } else if (isHighTendon) {
      shortText = 'Standard 3-set dose - conservative for tendon/joint health.'
      detailText = 'High-stress positions benefit from moderate volume to manage cumulative load.'
    }
  }

  // HIGH VOLUME (4 sets)
  else if (setCountClass === 'high_volume') {
    if (isHighSkill || isHighTendon) {
      verdict = 'reasonable_but_watch'
      label = 'Watch volume'
      shortText = '4-set dose - monitor fatigue for this skill/stress level.'
      cautionFlags.push('Higher volume for demanding movement')
      confidence = 'medium'
      detailText = '4 sets is reasonable for focused progression, but watch for form breakdown or joint fatigue.'
    } else if (isEasier) {
      verdict = 'well_justified'
      label = 'Focused dose'
      shortText = '4-set dose for accessory work - focused volume is appropriate.'
      confidence = 'high'
    } else {
      verdict = 'reasonable_but_watch'
      label = 'Focused dose'
      shortText = '4-set dose - focused progression or strength emphasis.'
      confidence = 'medium'
      if (rpeValue !== null && rpeValue >= 8) {
        cautionFlags.push('High intensity + higher volume')
      }
    }
  }

  // VERY HIGH VOLUME (5+ sets)
  else if (setCountClass === 'very_high_volume') {
    if (isHighSkill && isHighTendon) {
      verdict = 'weakly_justified'
      label = 'Review volume'
      shortText = `${sets}-set dose needs review - high volume for demanding movement.`
      cautionFlags.push('High volume on high-skill, high-stress movement')
      cautionFlags.push('Consider splitting across sessions')
      confidence = 'medium'
      detailText = 'This volume may exceed safe recovery for high-skill, high-stress work. Consider whether this aligns with training phase goals.'
    } else if (isHighSkill || isHighTendon) {
      verdict = 'weakly_justified'
      label = 'Watch volume'
      shortText = `${sets}-set dose - monitor closely for this exercise type.`
      cautionFlags.push('High volume on demanding movement')
      confidence = 'medium'
    } else if (isEasier) {
      verdict = 'reasonable_but_watch'
      label = 'Volume focus'
      shortText = `${sets}-set dose for support work - volume emphasis is reasonable.`
      confidence = 'medium'
      if (rpeValue !== null && rpeValue <= 7) {
        verdict = 'well_justified'
        shortText = `${sets}-set dose at controlled intensity - appropriate volume accumulation.`
        confidence = 'high'
      } else {
        cautionFlags.push('Monitor total session fatigue')
      }
    } else if (isGroupedMethod) {
      verdict = 'reasonable_but_watch'
      label = 'Grouped volume'
      shortText = `${sets} rounds in grouped format - paired fatigue is managed.`
      confidence = 'medium'
      detailText = 'Grouped methods like supersets distribute fatigue, making higher round counts reasonable.'
    } else {
      verdict = 'weakly_justified'
      label = 'High volume'
      shortText = `${sets}-set dose may need stronger rationale.`
      cautionFlags.push('High set count without clear volume intent')
      confidence = 'low'
    }
  }

  // Default fallback
  if (verdict === 'missing_source_context') {
    label = 'Needs context'
    shortText = 'Insufficient data to evaluate set count rationale.'
    if (detectedFactors.length === 0) {
      sourceBasis.push('no source context available')
    }
  }

  return {
    shouldRender: true, // We already returned early for not_applicable cases
    verdict,
    label,
    shortText,
    detailText,
    confidence,
    setCountClass,
    detectedFactors,
    cautionFlags,
    sourceBasis,
  }
}

// =============================================================================
// BATCH HELPER
// =============================================================================

/**
 * Resolve rationale for multiple exercises in a session.
 * Useful for building session-level summaries.
 */
export function resolveSessionPrescriptionRationales(
  exercises: SetVolumeRationaleInput[]
): SetVolumePrescriptionRationale[] {
  return exercises.map(resolveSetVolumePrescriptionRationale)
}

/**
 * Get a summary of set volume rationales for a session.
 */
export function summarizeSessionRationales(
  rationales: SetVolumePrescriptionRationale[]
): {
  total: number
  wellJustified: number
  reasonable: number
  weaklyJustified: number
  missingContext: number
  totalCautionFlags: number
} {
  const renderable = rationales.filter(r => r.shouldRender)
  return {
    total: renderable.length,
    wellJustified: renderable.filter(r => r.verdict === 'well_justified').length,
    reasonable: renderable.filter(r => r.verdict === 'reasonable_but_watch').length,
    weaklyJustified: renderable.filter(r => r.verdict === 'weakly_justified').length,
    missingContext: renderable.filter(r => r.verdict === 'missing_source_context').length,
    totalCautionFlags: renderable.reduce((sum, r) => sum + r.cautionFlags.length, 0),
  }
}
