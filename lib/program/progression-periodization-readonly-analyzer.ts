/**
 * =============================================================================
 * PROGRESSION / PERIODIZATION READ-ONLY ANALYZER
 * =============================================================================
 *
 * MASTER-8C.21 / AB20.4.14 — Progression / Periodization Read-Only Bridge
 *
 * PURPOSE:
 * Provide a single, deterministic, pure read-only analyzer that consolidates
 * available progression/periodization truth into an honest branch-level model
 * for consumption by Plan Logic / AI Intelligence Foundation Map.
 *
 * THIS MODULE:
 * - Consumes existing recovery/readiness, safeguard, exercise knowledge,
 *   program balance, and program structure signals
 * - Classifies current program posture (acclimation, buildup, etc.)
 * - Classifies progression direction (conservative, normal, aggressive, etc.)
 * - Produces honest confidence rating based on source availability
 * - Reports missing sources honestly when data is unavailable
 * - Does NOT mutate any program, session, exercise, or workout data
 * - Does NOT invent coaching claims without evidence
 *
 * PURITY CONTRACT:
 * - No React, no DOM, no localStorage, no fetch, no DB
 * - No Date.now(), no Math.random()
 * - No side effects, no mutation
 * - No `as any`, no @ts-ignore, no @ts-expect-error
 * - Deterministic: same input always produces same output
 *
 * Created: MASTER-8C.21 / AB20.4.14
 */

// =============================================================================
// TYPES — PROGRESSION/PERIODIZATION READ-ONLY MODEL
// =============================================================================

export type ProgressionPeriodizationStatus =
  | 'read_only_active'
  | 'partial'
  | 'needs_more_data'
  | 'unavailable'

export type ProgressionPeriodizationPosture =
  | 'acclimation'
  | 'buildup'
  | 'accumulation'
  | 'intensification'
  | 'skill_practice'
  | 'recovery_protective'
  | 'maintenance'
  | 'mixed'
  | 'unclear'

export type ProgressionDirection =
  | 'conservative'
  | 'normal'
  | 'aggressive'
  | 'blocked'
  | 'unknown'

export type ProgressionPeriodizationConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'insufficient'

export interface ProgressionPeriodizationSignal {
  readonly id: string
  readonly label: string
  readonly severity: 'info' | 'watch' | 'caution'
  readonly source: string
}

export interface ProgressionPeriodizationReadonlyModel {
  readonly status: ProgressionPeriodizationStatus
  readonly mutationStatus: 'mutation_locked'
  readonly posture: ProgressionPeriodizationPosture
  readonly progressionDirection: ProgressionDirection
  readonly confidence: ProgressionPeriodizationConfidence
  readonly headline: string
  readonly summary: string
  readonly signals: readonly ProgressionPeriodizationSignal[]
  readonly sourceBasis: readonly string[]
  readonly missingSources: readonly string[]
  readonly nextSafeAction: string
  readonly noFutureSessionChangesApplied: true
}

// =============================================================================
// INPUT — MINIMAL READ-ONLY INTERFACES (avoid circular imports)
// =============================================================================

/** Minimal recovery readiness shape consumed by this analyzer */
export interface ProgressionRecoveryInput {
  readonly readinessLevel?: 'ready' | 'watch' | 'reduced' | 'protected' | 'unknown'
  readonly confidence?: 'low' | 'medium' | 'high'
  readonly signals?: readonly { readonly label: string; readonly severity: string }[]
}

/** Minimal safeguard shape consumed by this analyzer */
export interface ProgressionSafeguardInput {
  readonly riskLevel?: 'low' | 'moderate' | 'elevated' | 'high' | 'unknown'
  readonly confidence?: 'low' | 'medium' | 'high'
}

/** Minimal exercise knowledge coverage shape */
export interface ProgressionExerciseKnowledgeInput {
  readonly coverageRatio?: number
  readonly totalExerciseCount?: number
  readonly fullScienceKnownCount?: number
  readonly trulyUnknownCount?: number
}

/** Minimal program balance shape */
export interface ProgressionBalanceInput {
  readonly status?: string
  readonly findings?: readonly {
    readonly severity?: string
    readonly title?: string
    readonly type?: string
  }[]
}

/** Minimal session shape from program */
export interface ProgressionSessionInput {
  readonly dayNumber?: number
  readonly dayLabel?: string
  readonly focus?: string
  readonly focusLabel?: string
  readonly isProtectedRecoveryWeek?: boolean
  readonly exercises?: readonly {
    readonly name?: string
    readonly id?: string
    readonly sets?: number | string
    readonly method?: string
    readonly prescriptionUnit?: string
  }[]
}

export interface ProgressionPeriodizationReadonlyInput {
  readonly sessions: readonly ProgressionSessionInput[]
  readonly weekNumber?: number
  readonly totalWeeks?: number
  readonly goalLabel?: string
  readonly styleMetadata?: {
    readonly phase?: string
    readonly intensity?: string
    readonly periodization?: string
    readonly progressionBias?: string
  }
  readonly recoveryModel?: ProgressionRecoveryInput | null
  readonly safeguardModel?: ProgressionSafeguardInput | null
  readonly exerciseKnowledgeModel?: ProgressionExerciseKnowledgeInput | null
  readonly balanceModel?: ProgressionBalanceInput | null
  readonly hasCompletedWorkoutEvidence?: boolean
  readonly hasWorkoutHistory?: boolean
}

// =============================================================================
// ANALYZER — PURE FUNCTION
// =============================================================================

export function resolveProgressionPeriodization(
  input: ProgressionPeriodizationReadonlyInput
): ProgressionPeriodizationReadonlyModel {
  const {
    sessions,
    weekNumber,
    totalWeeks,
    goalLabel,
    styleMetadata,
    recoveryModel,
    safeguardModel,
    exerciseKnowledgeModel,
    balanceModel,
    hasCompletedWorkoutEvidence,
    hasWorkoutHistory,
  } = input

  // ---------------------------------------------------------------------------
  // GUARD: No sessions = unavailable
  // ---------------------------------------------------------------------------
  if (!sessions || sessions.length === 0) {
    return {
      status: 'unavailable',
      mutationStatus: 'mutation_locked',
      posture: 'unclear',
      progressionDirection: 'unknown',
      confidence: 'insufficient',
      headline: 'Progression unclear',
      summary: 'No sessions available for progression analysis. No exercises, sets, reps, rest, warm-ups, cooldowns, substitutions, or future sessions changed.',
      signals: [],
      sourceBasis: [],
      missingSources: ['program_sessions'],
      nextSafeAction: 'Generate or load a program before progression analysis',
      noFutureSessionChangesApplied: true,
    }
  }

  // ---------------------------------------------------------------------------
  // COLLECT SIGNALS AND SOURCES
  // ---------------------------------------------------------------------------
  const signals: ProgressionPeriodizationSignal[] = []
  const sourceBasis: string[] = ['program_structure']
  const missingSources: string[] = []

  // Track scores for posture/direction classification
  let recoveryPressure = 0    // higher = more recovery-protective
  let skillComplexity = 0     // higher = more skill-practice oriented
  let volumeLoad = 0          // higher = more accumulation
  let intensityBias = 0       // higher = more intensification
  let evidenceStrength = 0    // higher = more confident decisions

  // ---------------------------------------------------------------------------
  // SESSION STRUCTURE ANALYSIS
  // ---------------------------------------------------------------------------
  let totalExercises = 0
  let totalSets = 0
  let methodCount = 0
  let hasProtectedWeek = false
  let holdExerciseCount = 0
  let dynamicExerciseCount = 0
  let highSkillPatterns = 0

  const highSkillKeywords = ['planche', 'front lever', 'handstand', 'muscle up', 'back lever', 'iron cross', 'manna', 'v-sit', 'l-sit']
  const holdKeywords = ['hold', 'isometric', 'static', 'hang']

  for (const session of sessions) {
    if (session.isProtectedRecoveryWeek) {
      hasProtectedWeek = true
    }

    const exercises = session.exercises || []
    totalExercises += exercises.length

    for (const ex of exercises) {
      const name = (ex.name || '').toLowerCase()
      const sets = typeof ex.sets === 'number' ? ex.sets : parseInt(String(ex.sets || '0'), 10) || 0
      totalSets += sets

      if (ex.method && String(ex.method) !== 'standard') {
        methodCount++
      }

      // Classify hold vs dynamic
      const isHold = holdKeywords.some(kw => name.includes(kw)) ||
                     ex.prescriptionUnit === 'seconds' ||
                     ex.prescriptionUnit === 'time'
      if (isHold) {
        holdExerciseCount++
      } else {
        dynamicExerciseCount++
      }

      // Detect high-skill patterns
      if (highSkillKeywords.some(kw => name.includes(kw))) {
        highSkillPatterns++
      }
    }
  }

  const avgSetsPerSession = sessions.length > 0 ? totalSets / sessions.length : 0
  const avgExercisesPerSession = sessions.length > 0 ? totalExercises / sessions.length : 0
  const skillRatio = totalExercises > 0 ? highSkillPatterns / totalExercises : 0
  const holdRatio = totalExercises > 0 ? holdExerciseCount / totalExercises : 0

  // Accumulate volume/skill scores
  if (avgSetsPerSession >= 20) volumeLoad += 2
  else if (avgSetsPerSession >= 14) volumeLoad += 1

  if (skillRatio >= 0.5) skillComplexity += 2
  else if (skillRatio >= 0.25) skillComplexity += 1

  if (holdRatio >= 0.4) {
    skillComplexity += 1
    signals.push({
      id: 'sig_high_hold_ratio',
      label: `High static hold ratio (${Math.round(holdRatio * 100)}%)`,
      severity: 'info',
      source: 'program_structure',
    })
  }

  if (methodCount >= 3) {
    signals.push({
      id: 'sig_method_density',
      label: `${methodCount} non-standard methods active`,
      severity: 'watch',
      source: 'program_structure',
    })
    intensityBias += 1
  }

  if (hasProtectedWeek) {
    recoveryPressure += 3
    signals.push({
      id: 'sig_protected_week',
      label: 'Protected recovery week detected',
      severity: 'info',
      source: 'program_structure',
    })
  }

  // ---------------------------------------------------------------------------
  // WEEK NUMBER / PHASE METADATA
  // ---------------------------------------------------------------------------
  if (weekNumber !== undefined && weekNumber > 0) {
    sourceBasis.push('week_number')
    if (totalWeeks && totalWeeks > 0) {
      const progress = weekNumber / totalWeeks
      if (progress <= 0.2) {
        // Early in cycle - lean acclimation unless evidence says otherwise
        signals.push({
          id: 'sig_early_cycle',
          label: `Week ${weekNumber}/${totalWeeks} — early cycle`,
          severity: 'info',
          source: 'week_number',
        })
      } else if (progress >= 0.8) {
        intensityBias += 1
        signals.push({
          id: 'sig_late_cycle',
          label: `Week ${weekNumber}/${totalWeeks} — late cycle`,
          severity: 'info',
          source: 'week_number',
        })
      }
    }
  }

  if (styleMetadata?.phase) {
    sourceBasis.push('style_metadata')
    const phase = styleMetadata.phase.toLowerCase()
    if (phase.includes('acclim')) recoveryPressure += 1
    if (phase.includes('intens')) intensityBias += 2
    if (phase.includes('accum')) volumeLoad += 1
    if (phase.includes('deload') || phase.includes('recov')) recoveryPressure += 2
  }

  if (styleMetadata?.progressionBias) {
    const bias = styleMetadata.progressionBias.toLowerCase()
    if (bias.includes('conserv')) recoveryPressure += 1
    if (bias.includes('aggress')) intensityBias += 1
  }

  // ---------------------------------------------------------------------------
  // RECOVERY / READINESS SOURCE
  // ---------------------------------------------------------------------------
  if (recoveryModel) {
    sourceBasis.push('recovery_readiness')
    const level = recoveryModel.readinessLevel
    if (level === 'protected') {
      recoveryPressure += 3
      signals.push({
        id: 'sig_recovery_protected',
        label: 'Recovery status: protected',
        severity: 'caution',
        source: 'recovery_readiness',
      })
    } else if (level === 'reduced') {
      recoveryPressure += 2
      signals.push({
        id: 'sig_recovery_reduced',
        label: 'Recovery status: reduced capacity',
        severity: 'watch',
        source: 'recovery_readiness',
      })
    } else if (level === 'watch') {
      recoveryPressure += 1
      signals.push({
        id: 'sig_recovery_watch',
        label: 'Recovery status: watch',
        severity: 'watch',
        source: 'recovery_readiness',
      })
    } else if (level === 'ready') {
      evidenceStrength += 1
    }
  } else {
    missingSources.push('recovery_readiness')
  }

  // ---------------------------------------------------------------------------
  // SAFEGUARD SOURCE
  // ---------------------------------------------------------------------------
  if (safeguardModel) {
    sourceBasis.push('prehab_rehab_safeguards')
    const risk = safeguardModel.riskLevel
    if (risk === 'high') {
      recoveryPressure += 3
      intensityBias -= 1
      signals.push({
        id: 'sig_safeguard_high',
        label: 'Tendon/joint safeguard risk: high',
        severity: 'caution',
        source: 'prehab_rehab_safeguards',
      })
    } else if (risk === 'elevated') {
      recoveryPressure += 2
      signals.push({
        id: 'sig_safeguard_elevated',
        label: 'Tendon/joint safeguard risk: elevated',
        severity: 'watch',
        source: 'prehab_rehab_safeguards',
      })
    } else if (risk === 'moderate') {
      recoveryPressure += 1
      signals.push({
        id: 'sig_safeguard_moderate',
        label: 'Tendon/joint safeguard risk: moderate',
        severity: 'info',
        source: 'prehab_rehab_safeguards',
      })
    } else if (risk === 'low') {
      evidenceStrength += 1
    }
  } else {
    missingSources.push('prehab_rehab_safeguards')
  }

  // ---------------------------------------------------------------------------
  // EXERCISE KNOWLEDGE COVERAGE SOURCE
  // ---------------------------------------------------------------------------
  if (exerciseKnowledgeModel) {
    sourceBasis.push('exercise_knowledge_coverage')
    const ratio = exerciseKnowledgeModel.coverageRatio ?? 0
    if (ratio >= 0.8) {
      evidenceStrength += 2
    } else if (ratio >= 0.5) {
      evidenceStrength += 1
      signals.push({
        id: 'sig_knowledge_partial',
        label: `Exercise knowledge coverage: ${Math.round(ratio * 100)}%`,
        severity: 'info',
        source: 'exercise_knowledge_coverage',
      })
    } else {
      signals.push({
        id: 'sig_knowledge_weak',
        label: `Weak exercise knowledge coverage: ${Math.round(ratio * 100)}%`,
        severity: 'watch',
        source: 'exercise_knowledge_coverage',
      })
    }
    if ((exerciseKnowledgeModel.trulyUnknownCount ?? 0) > 0) {
      signals.push({
        id: 'sig_unknown_exercises',
        label: `${exerciseKnowledgeModel.trulyUnknownCount} exercise(s) with no science data`,
        severity: 'watch',
        source: 'exercise_knowledge_coverage',
      })
    }
  } else {
    missingSources.push('exercise_knowledge_coverage')
  }

  // ---------------------------------------------------------------------------
  // PROGRAM BALANCE SOURCE
  // ---------------------------------------------------------------------------
  if (balanceModel && balanceModel.status !== 'unavailable') {
    sourceBasis.push('program_balance')
    const findings = balanceModel.findings || []
    const highSeverity = findings.filter(f => f.severity === 'high').length
    const moderateSeverity = findings.filter(f => f.severity === 'moderate').length

    if (highSeverity > 0) {
      recoveryPressure += 1
      signals.push({
        id: 'sig_balance_high',
        label: `${highSeverity} high-severity balance finding(s)`,
        severity: 'caution',
        source: 'program_balance',
      })
    }
    if (moderateSeverity > 0) {
      signals.push({
        id: 'sig_balance_moderate',
        label: `${moderateSeverity} moderate balance finding(s)`,
        severity: 'watch',
        source: 'program_balance',
      })
    }
    if (highSeverity === 0 && moderateSeverity === 0) {
      evidenceStrength += 1
    }
  } else {
    missingSources.push('program_balance')
  }

  // ---------------------------------------------------------------------------
  // PERFORMANCE EVIDENCE
  // ---------------------------------------------------------------------------
  if (hasCompletedWorkoutEvidence) {
    sourceBasis.push('completed_workout_evidence')
    evidenceStrength += 2
  } else {
    missingSources.push('completed_workout_feedback')
  }

  if (hasWorkoutHistory) {
    if (!sourceBasis.includes('completed_workout_evidence')) {
      sourceBasis.push('workout_history')
    }
    evidenceStrength += 1
  } else if (!missingSources.includes('completed_workout_feedback')) {
    missingSources.push('recent_performance_trend')
  }

  // ---------------------------------------------------------------------------
  // POSTURE CLASSIFICATION (conservative, multi-signal)
  // ---------------------------------------------------------------------------
  let posture: ProgressionPeriodizationPosture

  if (hasProtectedWeek && recoveryPressure >= 3) {
    posture = 'recovery_protective'
  } else if (recoveryPressure >= 5) {
    posture = 'recovery_protective'
  } else if (recoveryPressure >= 3 && intensityBias <= 0) {
    posture = 'recovery_protective'
  } else if (skillComplexity >= 3 && volumeLoad <= 1 && intensityBias <= 0) {
    posture = 'skill_practice'
  } else if (intensityBias >= 3 && recoveryPressure <= 1) {
    posture = 'intensification'
  } else if (volumeLoad >= 2 && intensityBias <= 1 && recoveryPressure <= 1) {
    posture = 'accumulation'
  } else if (volumeLoad >= 1 && skillComplexity >= 1 && recoveryPressure <= 1) {
    posture = 'buildup'
  } else if (recoveryPressure >= 2 && (volumeLoad >= 1 || intensityBias >= 1)) {
    posture = 'mixed'
  } else if (weekNumber !== undefined && weekNumber <= 2 && evidenceStrength <= 2) {
    posture = 'acclimation'
  } else if (evidenceStrength >= 3 && recoveryPressure <= 1) {
    posture = 'buildup'
  } else if (sourceBasis.length <= 2) {
    posture = 'unclear'
  } else {
    posture = 'mixed'
  }

  // ---------------------------------------------------------------------------
  // PROGRESSION DIRECTION
  // ---------------------------------------------------------------------------
  let progressionDirection: ProgressionDirection

  if (recoveryPressure >= 5) {
    progressionDirection = 'blocked'
  } else if (recoveryPressure >= 3) {
    progressionDirection = 'conservative'
  } else if (intensityBias >= 2 && evidenceStrength >= 3 && recoveryPressure <= 1) {
    progressionDirection = 'aggressive'
  } else if (evidenceStrength >= 2 && recoveryPressure <= 1) {
    progressionDirection = 'normal'
  } else if (evidenceStrength <= 1) {
    progressionDirection = 'unknown'
  } else {
    progressionDirection = 'conservative'
  }

  // ---------------------------------------------------------------------------
  // CONFIDENCE
  // ---------------------------------------------------------------------------
  const totalSourceCount = sourceBasis.length
  let confidence: ProgressionPeriodizationConfidence

  if (totalSourceCount >= 5 && evidenceStrength >= 3 && missingSources.length <= 1) {
    confidence = 'high'
  } else if (totalSourceCount >= 3 && evidenceStrength >= 2) {
    confidence = 'medium'
  } else if (totalSourceCount >= 2) {
    confidence = 'low'
  } else {
    confidence = 'insufficient'
  }

  // ---------------------------------------------------------------------------
  // STATUS
  // ---------------------------------------------------------------------------
  let status: ProgressionPeriodizationStatus
  if (confidence === 'insufficient') {
    status = 'needs_more_data'
  } else if (confidence === 'low' || missingSources.length >= 3) {
    status = 'partial'
  } else {
    status = 'read_only_active'
  }

  // ---------------------------------------------------------------------------
  // HEADLINE + SUMMARY
  // ---------------------------------------------------------------------------
  const postureLabel = formatPosture(posture)
  const directionLabel = formatDirection(progressionDirection)

  const headline = `${postureLabel} — ${directionLabel} progression`

  const summaryParts: string[] = [
    `Posture: ${postureLabel}.`,
    `Direction: ${directionLabel}.`,
    `${sessions.length} session(s), ${totalExercises} exercise(s), ~${totalSets} total sets.`,
  ]
  if (highSkillPatterns > 0) {
    summaryParts.push(`${highSkillPatterns} high-skill movement(s) detected.`)
  }
  summaryParts.push('No exercises, sets, reps, rest, warm-ups, cooldowns, substitutions, or future sessions changed.')

  const summary = summaryParts.join(' ')

  // ---------------------------------------------------------------------------
  // NEXT SAFE ACTION
  // ---------------------------------------------------------------------------
  let nextSafeAction: string
  if (confidence === 'insufficient') {
    nextSafeAction = 'Expand source coverage before any progression decision'
  } else if (progressionDirection === 'blocked') {
    nextSafeAction = 'Address recovery/safeguard constraints; continue read-only observation'
  } else {
    nextSafeAction = 'Continue read-only observation; generator mutation deferred until stronger evidence'
  }

  return {
    status,
    mutationStatus: 'mutation_locked',
    posture,
    progressionDirection,
    confidence,
    headline,
    summary,
    signals,
    sourceBasis,
    missingSources,
    nextSafeAction,
    noFutureSessionChangesApplied: true,
  }
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

function formatPosture(posture: ProgressionPeriodizationPosture): string {
  const labels: Record<ProgressionPeriodizationPosture, string> = {
    acclimation: 'Acclimation',
    buildup: 'Buildup',
    accumulation: 'Accumulation',
    intensification: 'Intensification',
    skill_practice: 'Skill practice',
    recovery_protective: 'Recovery-protective',
    maintenance: 'Maintenance',
    mixed: 'Mixed',
    unclear: 'Unclear',
  }
  return labels[posture] || posture
}

function formatDirection(direction: ProgressionDirection): string {
  const labels: Record<ProgressionDirection, string> = {
    conservative: 'Conservative',
    normal: 'Normal',
    aggressive: 'Aggressive',
    blocked: 'Blocked',
    unknown: 'Unknown',
  }
  return labels[direction] || direction
}
