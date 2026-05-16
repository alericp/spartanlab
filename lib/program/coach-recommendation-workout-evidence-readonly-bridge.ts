/**
 * ============================================================================
 * MASTER-8C.24 / AB20.4.17 — COACH RECS WORKOUT EVIDENCE READ-ONLY BRIDGE
 * ============================================================================
 *
 * Pure, deterministic, read-only bridge that summarizes real completed workout
 * evidence quality for Coach Recs candidate source-quality decisions.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. Accepts WorkoutLog[] passed in from the component (never reads storage).
 *   4. Never mutates program, sessions, exercises, sets, reps.
 *   5. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   6. Safe for empty arrays and missing fields.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CoachRecsWorkoutEvidenceAvailability =
  | 'none'
  | 'local_only'
  | 'program_snapshot'
  | 'mixed'

export type CoachRecsWorkoutEvidenceQuality =
  | 'none'
  | 'weak'
  | 'usable'
  | 'strong'

export interface CoachRecsWorkoutEvidenceSummary {
  readonly availability: CoachRecsWorkoutEvidenceAvailability
  readonly quality: CoachRecsWorkoutEvidenceQuality
  readonly trustedWorkoutCount: number
  readonly completedSessionCount: number
  readonly completedSetEvidenceCount: number
  readonly hasRpeEvidence: boolean
  readonly hasReadinessOrFatigueEvidence: boolean
  readonly hasPainOrTensionEvidence: boolean
  readonly hasUnderTargetPerformanceEvidence: boolean
  readonly hasHighEffortEvidence: boolean
  readonly latestEvidenceLabel: string | null
  readonly sourceLabels: readonly string[]
  readonly missingEvidenceLabels: readonly string[]
  readonly evidenceSummaryLabel: string
  readonly evidenceExplanation: string
}

// ─── Minimal input shape (avoids importing full WorkoutLog directly) ────────

/** Minimal subset of WorkoutLog fields needed for evidence summarization */
export interface MinimalWorkoutLogForCoachRecs {
  readonly trusted?: boolean
  readonly completionStatus?: string
  readonly perceivedDifficulty?: string
  readonly notes?: string
  readonly exercises?: readonly {
    readonly completed?: boolean
    readonly name?: string
  }[]
  readonly exerciseNotes?: readonly {
    readonly flags?: readonly string[]
    readonly freeText?: string
  }[]
  readonly completedSetEvidence?: readonly {
    readonly actualRPE?: number
    readonly prescribedRPE?: number
    readonly actualReps?: number
    readonly prescribedReps?: number
    readonly actualHoldSeconds?: number
    readonly prescribedHoldSeconds?: number
    readonly noteFlags?: readonly string[]
  }[]
  readonly createdAt?: string
  readonly sessionDate?: string
  readonly sourceRoute?: string
}

// ─── Pain/tension token lists (mirrored from adaptation contract) ───────────

const PAIN_TOKENS = ['pain', 'sharp', 'pinch', 'tweak', 'injury', 'hurt']
const TENSION_TOKENS = ['tension', 'too much tension', 'fatigue', 'fatigued']
const READINESS_TOKENS = ['tired', 'sleep', 'sore', 'exhausted', 'sluggish', 'low energy']

function textContainsTokens(text: string, tokens: readonly string[]): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return tokens.some(t => lower.includes(t))
}

// ─── Main resolver ──────────────────────────────────────────────────────────

export function resolveCoachRecsWorkoutEvidenceSummary(
  logs: readonly MinimalWorkoutLogForCoachRecs[]
): CoachRecsWorkoutEvidenceSummary {
  if (!logs || logs.length === 0) {
    return {
      availability: 'none',
      quality: 'none',
      trustedWorkoutCount: 0,
      completedSessionCount: 0,
      completedSetEvidenceCount: 0,
      hasRpeEvidence: false,
      hasReadinessOrFatigueEvidence: false,
      hasPainOrTensionEvidence: false,
      hasUnderTargetPerformanceEvidence: false,
      hasHighEffortEvidence: false,
      latestEvidenceLabel: null,
      sourceLabels: [],
      missingEvidenceLabels: [
        'Completed workouts',
        'Per-exercise RPE',
        'Readiness check-ins',
        'Pain/tension notes',
      ],
      evidenceSummaryLabel: 'No logged workout evidence',
      evidenceExplanation: 'No completed workout logs are available. All Coach Recs candidates are based on program structure and source branch inference only.',
    }
  }

  // Filter to trusted logs only
  const trustedLogs = logs.filter(l => l.trusted !== false)
  if (trustedLogs.length === 0) {
    return {
      availability: 'none',
      quality: 'none',
      trustedWorkoutCount: 0,
      completedSessionCount: 0,
      completedSetEvidenceCount: 0,
      hasRpeEvidence: false,
      hasReadinessOrFatigueEvidence: false,
      hasPainOrTensionEvidence: false,
      hasUnderTargetPerformanceEvidence: false,
      hasHighEffortEvidence: false,
      latestEvidenceLabel: null,
      sourceLabels: [],
      missingEvidenceLabels: [
        'Trusted completed workouts',
        'Per-exercise RPE',
        'Readiness check-ins',
        'Pain/tension notes',
      ],
      evidenceSummaryLabel: 'No trusted workout evidence',
      evidenceExplanation: 'Workout logs exist but none are marked as trusted. Only trusted completions contribute to Coach Recs source quality.',
    }
  }

  // Count completed sessions
  const completedSessions = trustedLogs.filter(
    l => l.completionStatus === 'completed' || l.completionStatus === 'partial'
  )
  const completedSessionCount = completedSessions.length > 0
    ? completedSessions.length
    : trustedLogs.length // fallback: all trusted logs count as sessions

  // Scan all evidence
  let totalSetEvidenceCount = 0
  let hasRpeEvidence = false
  let hasReadinessOrFatigueEvidence = false
  let hasPainOrTensionEvidence = false
  let hasUnderTargetPerformanceEvidence = false
  let hasHighEffortEvidence = false

  for (const log of trustedLogs) {
    // Check perceived difficulty as readiness/effort proxy
    if (log.perceivedDifficulty === 'hard') {
      hasHighEffortEvidence = true
    }

    // Scan top-level notes for pain/tension/readiness
    if (log.notes) {
      if (textContainsTokens(log.notes, PAIN_TOKENS)) hasPainOrTensionEvidence = true
      if (textContainsTokens(log.notes, TENSION_TOKENS)) hasPainOrTensionEvidence = true
      if (textContainsTokens(log.notes, READINESS_TOKENS)) hasReadinessOrFatigueEvidence = true
    }

    // Scan exercise-level notes
    if (log.exerciseNotes) {
      for (const note of log.exerciseNotes) {
        const flags = note.flags || []
        const text = note.freeText || ''
        if (flags.includes('pain') || textContainsTokens(text, PAIN_TOKENS)) hasPainOrTensionEvidence = true
        if (textContainsTokens(text, TENSION_TOKENS)) hasPainOrTensionEvidence = true
        if (flags.includes('sleep_fatigue') || flags.includes('grip_issue') || textContainsTokens(text, READINESS_TOKENS)) {
          hasReadinessOrFatigueEvidence = true
        }
      }
    }

    // Scan completed set evidence
    if (log.completedSetEvidence && log.completedSetEvidence.length > 0) {
      totalSetEvidenceCount += log.completedSetEvidence.length

      for (const setEv of log.completedSetEvidence) {
        // RPE evidence
        if (typeof setEv.actualRPE === 'number' && setEv.actualRPE > 0) {
          hasRpeEvidence = true
          // High effort: actual RPE >= prescribed + 1, or >= 8 if no prescribed
          const threshold = typeof setEv.prescribedRPE === 'number' ? setEv.prescribedRPE + 1 : 8
          if (setEv.actualRPE >= threshold) hasHighEffortEvidence = true
        }

        // Under-target performance
        if (typeof setEv.prescribedReps === 'number' && typeof setEv.actualReps === 'number') {
          if (setEv.actualReps < setEv.prescribedReps) hasUnderTargetPerformanceEvidence = true
        }
        if (typeof setEv.prescribedHoldSeconds === 'number' && typeof setEv.actualHoldSeconds === 'number') {
          if (setEv.actualHoldSeconds < setEv.prescribedHoldSeconds) hasUnderTargetPerformanceEvidence = true
        }

        // Pain/tension from set-level note flags
        if (setEv.noteFlags) {
          for (const flag of setEv.noteFlags) {
            if (flag === 'pain' || PAIN_TOKENS.includes(flag)) hasPainOrTensionEvidence = true
            if (TENSION_TOKENS.includes(flag)) hasPainOrTensionEvidence = true
          }
        }
      }
    }
  }

  // Determine availability
  const availability: CoachRecsWorkoutEvidenceAvailability = 'local_only'

  // Determine quality
  let quality: CoachRecsWorkoutEvidenceQuality = 'weak'
  const hasDetailedEvidence = hasRpeEvidence || hasPainOrTensionEvidence || hasUnderTargetPerformanceEvidence || hasHighEffortEvidence
  if (trustedLogs.length >= 3 && hasDetailedEvidence && totalSetEvidenceCount >= 5) {
    quality = 'strong'
  } else if (hasDetailedEvidence || totalSetEvidenceCount >= 3) {
    quality = 'usable'
  } else if (trustedLogs.length >= 1) {
    quality = 'weak'
  }

  // Build source labels
  const sourceLabels: string[] = [`${trustedLogs.length} trusted workout${trustedLogs.length > 1 ? 's' : ''}`]
  if (hasRpeEvidence) sourceLabels.push('RPE logged')
  if (hasPainOrTensionEvidence) sourceLabels.push('Pain/tension notes')
  if (hasReadinessOrFatigueEvidence) sourceLabels.push('Readiness/fatigue feedback')
  if (hasUnderTargetPerformanceEvidence) sourceLabels.push('Under-target performance')
  if (hasHighEffortEvidence) sourceLabels.push('High-effort sessions')
  if (totalSetEvidenceCount > 0) sourceLabels.push(`${totalSetEvidenceCount} set evidence entries`)

  // Build missing labels
  const missingLabels: string[] = []
  if (!hasRpeEvidence) missingLabels.push('Per-exercise RPE')
  if (!hasReadinessOrFatigueEvidence) missingLabels.push('Readiness check-ins')
  if (!hasPainOrTensionEvidence) missingLabels.push('Pain/tension notes')
  if (totalSetEvidenceCount === 0) missingLabels.push('Detailed set evidence')

  // Latest evidence label
  let latestLabel: string | null = null
  if (trustedLogs.length > 0) {
    const latest = trustedLogs[0] // logs are typically sorted newest first
    const dateStr = latest.createdAt || latest.sessionDate || null
    if (dateStr) {
      latestLabel = `Latest: ${dateStr.substring(0, 10)}`
    }
  }

  // Summary label
  const parts: string[] = [`${trustedLogs.length} trusted session${trustedLogs.length > 1 ? 's' : ''}`]
  if (hasRpeEvidence) parts.push('RPE present')
  if (hasPainOrTensionEvidence) parts.push('pain/tension noted')
  if (hasReadinessOrFatigueEvidence) parts.push('readiness feedback')
  if (!hasRpeEvidence && !hasPainOrTensionEvidence && !hasReadinessOrFatigueEvidence) parts.push('limited detail')
  const evidenceSummaryLabel = `Evidence: ${parts.join(' | ')}`

  // Explanation
  let evidenceExplanation: string
  if (quality === 'strong') {
    evidenceExplanation = `${trustedLogs.length} trusted workouts with detailed set evidence. RPE, performance, and feedback signals available for source-quality-aware recommendations.`
  } else if (quality === 'usable') {
    evidenceExplanation = `${trustedLogs.length} trusted workouts with some detailed evidence. Source quality is improving but not all signal types are present.`
  } else {
    evidenceExplanation = `${trustedLogs.length} trusted workout${trustedLogs.length > 1 ? 's' : ''} logged, but limited detailed evidence (RPE, pain notes, readiness). More logged detail needed for high-confidence recommendations.`
  }

  return {
    availability,
    quality,
    trustedWorkoutCount: trustedLogs.length,
    completedSessionCount,
    completedSetEvidenceCount: totalSetEvidenceCount,
    hasRpeEvidence,
    hasReadinessOrFatigueEvidence,
    hasPainOrTensionEvidence,
    hasUnderTargetPerformanceEvidence,
    hasHighEffortEvidence,
    latestEvidenceLabel: latestLabel,
    sourceLabels,
    missingEvidenceLabels: missingLabels,
    evidenceSummaryLabel,
    evidenceExplanation,
  }
}
