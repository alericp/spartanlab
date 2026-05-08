/**
 * ============================================================================
 * STEP 25.5 — ADAPTIVE SESSION READINESS / TODAY GUIDANCE
 * ============================================================================
 *
 * Pure, typed derivation that turns existing program truth into a user-facing
 * "Today's Session Readiness" guidance surface.
 *
 * Sources:
 *   - program.evidenceCalibrationInfluence (AB12-2)
 *   - program.evidenceCalibrationShapingProof (AB13-4)
 *   - program.sessionLengthTruth (time constraint context)
 *   - program.weekNumber
 *
 * Contract guarantees:
 *   1. NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`.
 *   2. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   3. NEVER fabricates readiness claims. If data is unavailable,
 *      returns `state: 'collecting_data'` with honest messaging.
 *   4. All visible strings are derived from real program fields.
 *   5. ADVISORY ONLY — does not mutate program or sessions.
 */

import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import type { EvidenceCalibrationGenerationInfluence } from './evidence-calibration-generation-influence'
import type { EvidenceCalibrationShapingProof } from './evidence-calibration-program-shaping'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TodaySessionGuidanceState =
  | 'ready'              // Good to train at full capacity
  | 'controlled'         // Train but keep quality focus / controlled intensity
  | 'protect_recovery'   // Recovery-protected, prioritize rest over volume
  | 'reduce_or_shorten'  // Recommend reducing load or using shorter variant
  | 'collecting_data'    // Insufficient evidence to provide specific guidance

export type GuidanceReasonTone = 'positive' | 'neutral' | 'warning' | 'protective'

export interface GuidanceReason {
  id: string
  label: string
  message?: string
  tone: GuidanceReasonTone
}

export interface TodaySessionGuidance {
  /** Whether guidance could be derived from available program truth */
  available: boolean
  /** Current session readiness state */
  state: TodaySessionGuidanceState
  /** Short user-facing label */
  label: string
  /** Concise summary sentence */
  summary: string
  /** Supporting reasons (max 3) */
  reasons: GuidanceReason[]
  /** Clear next action for the user */
  nextAction: string
  /** Internal: what source signals contributed */
  sourceSummary: string[]
}

// ---------------------------------------------------------------------------
// Main derivation function
// ---------------------------------------------------------------------------

/**
 * Derives user-facing today/session readiness guidance from existing program truth.
 * Pure, deterministic, no side effects. ADVISORY ONLY.
 */
export function deriveTodaySessionGuidance(
  program: AdaptiveProgram | null
): TodaySessionGuidance {
  // Guard: no program
  if (!program) {
    return createCollectingDataResult()
  }

  const weekNumber = program.weekNumber ?? null
  const influence = program.evidenceCalibrationInfluence ?? null
  const shapingProof = program.evidenceCalibrationShapingProof ?? null
  const sessionLengthMinutes = program.sessionLengthTruth?.selectedMinutes ?? null

  // Collect source signals
  const sourceSummary: string[] = []
  const reasons: GuidanceReason[] = []

  // No calibration influence means we're still collecting data
  if (!influence || influence.status === 'inactive') {
    return createCollectingDataResult()
  }

  sourceSummary.push(`calibration:${influence.status}`)

  // Extract bias signals
  const recoveryBias = influence.recoveryBias
  const volumeBias = influence.volumeBias
  const progressionAggressiveness = influence.progressionAggressiveness

  // ---------------------------------------------------------------------------
  // Priority 1: Hard protection signals (recovery bias = protect)
  // ---------------------------------------------------------------------------
  if (recoveryBias === 'protect') {
    sourceSummary.push('recoveryBias:protect')
    reasons.push({
      id: 'recovery-protected',
      label: 'Recovery protected',
      message: 'Training load reduced to support recovery',
      tone: 'protective',
    })

    return {
      available: true,
      state: 'protect_recovery',
      label: 'Recovery focus',
      summary: 'Your recovery signals suggest taking it easier today. Prioritize quality movement over pushing intensity.',
      reasons: reasons.slice(0, 3),
      nextAction: 'Complete the session at a controlled pace. Skip optional accessories if needed.',
      sourceSummary,
    }
  }

  // ---------------------------------------------------------------------------
  // Priority 2: Volume reduction active
  // ---------------------------------------------------------------------------
  if (volumeBias === 'reduce') {
    sourceSummary.push('volumeBias:reduce')
    reasons.push({
      id: 'volume-reduced',
      label: 'Volume adjusted',
      message: 'Session volume calibrated to current capacity',
      tone: 'protective',
    })

    // Check if time is also compressed
    if (sessionLengthMinutes && sessionLengthMinutes <= 30) {
      sourceSummary.push(`sessionLength:${sessionLengthMinutes}min`)
      reasons.push({
        id: 'time-compressed',
        label: 'Short session',
        tone: 'neutral',
      })

      return {
        available: true,
        state: 'reduce_or_shorten',
        label: 'Focused session',
        summary: 'Today is a shorter, focused session with reduced volume. Keep intensity moderate and prioritize the main skill work.',
        reasons: reasons.slice(0, 3),
        nextAction: 'Focus on quality reps in the primary exercises. The session is already trimmed.',
        sourceSummary,
      }
    }

    return {
      available: true,
      state: 'controlled',
      label: 'Controlled training',
      summary: 'Volume is calibrated to your current state. Focus on good quality rather than maximum effort.',
      reasons: reasons.slice(0, 3),
      nextAction: 'Train at your normal pace. Keep RPE honest and stop accessories early if fatigued.',
      sourceSummary,
    }
  }

  // ---------------------------------------------------------------------------
  // Priority 3: Conservative progression (not protecting, but not aggressive)
  // ---------------------------------------------------------------------------
  if (progressionAggressiveness === 'conservative') {
    sourceSummary.push('progression:conservative')
    reasons.push({
      id: 'conservative-progression',
      label: 'Steady progress',
      message: 'Building consistently before pushing harder',
      tone: 'neutral',
    })

    // Check if shaping proof shows capped exercises
    if (shapingProof && shapingProof.cappedExerciseCount > 0) {
      sourceSummary.push(`cappedExercises:${shapingProof.cappedExerciseCount}`)
      reasons.push({
        id: 'intensity-capped',
        label: 'RPE managed',
        tone: 'neutral',
      })
    }

    // Check early weeks
    if (weekNumber !== null && weekNumber <= 2) {
      reasons.push({
        id: 'early-phase',
        label: 'Building baseline',
        tone: 'positive',
      })
    }

    return {
      available: true,
      state: 'controlled',
      label: 'Good to train',
      summary: 'Ready for today\'s session. The program is building your capacity steadily — focus on clean execution.',
      reasons: reasons.slice(0, 3),
      nextAction: 'Start the session when ready. Focus on quality reps and honest RPE feedback.',
      sourceSummary,
    }
  }

  // ---------------------------------------------------------------------------
  // Priority 4: Normal/positive state
  // ---------------------------------------------------------------------------
  
  // Time compressed session
  if (sessionLengthMinutes && sessionLengthMinutes <= 30) {
    sourceSummary.push(`sessionLength:${sessionLengthMinutes}min`)
    reasons.push({
      id: 'short-session',
      label: 'Short format',
      tone: 'neutral',
    })

    return {
      available: true,
      state: 'ready',
      label: 'Ready to train',
      summary: 'Good to go for today\'s focused session. You have a shorter format selected — make the most of the time.',
      reasons: reasons.slice(0, 3),
      nextAction: 'Start the workout. Keep rest times efficient but don\'t rush technique.',
      sourceSummary,
    }
  }

  // Check for positive signals
  if (influence.confidence === 'high' || influence.confidence === 'medium') {
    sourceSummary.push(`confidence:${influence.confidence}`)
    reasons.push({
      id: 'evidence-solid',
      label: 'Evidence supported',
      message: 'Program is calibrated to your performance',
      tone: 'positive',
    })
  }

  // Week context
  if (weekNumber !== null) {
    sourceSummary.push(`week:${weekNumber}`)
    if (weekNumber <= 2) {
      reasons.push({
        id: 'baseline-building',
        label: 'Week ' + weekNumber,
        message: 'Building training baseline',
        tone: 'positive',
      })
    } else if (weekNumber >= 4) {
      reasons.push({
        id: 'established-pattern',
        label: 'Week ' + weekNumber,
        tone: 'positive',
      })
    }
  }

  // Standard progression
  if (progressionAggressiveness === 'standard' || progressionAggressiveness === 'aggressive') {
    sourceSummary.push(`progression:${progressionAggressiveness}`)
    reasons.push({
      id: 'progression-active',
      label: 'Progressing',
      tone: 'positive',
    })
  }

  return {
    available: true,
    state: 'ready',
    label: 'Ready to train',
    summary: 'You\'re set for today\'s session. Train with focus and log your performance to continue improving calibration.',
    reasons: reasons.slice(0, 3),
    nextAction: 'Start your workout when ready. Push quality reps and be honest with RPE.',
    sourceSummary,
  }
}

// ---------------------------------------------------------------------------
// Fallback for insufficient data
// ---------------------------------------------------------------------------

function createCollectingDataResult(): TodaySessionGuidance {
  return {
    available: true,
    state: 'collecting_data',
    label: 'Building baseline',
    summary: 'Readiness data is still building. Train normally and log your session so guidance improves over time.',
    reasons: [
      {
        id: 'data-building',
        label: 'Learning your patterns',
        message: 'Need more logged workouts for personalized guidance',
        tone: 'neutral',
      },
    ],
    nextAction: 'Complete the session as planned. Your honest feedback helps the system learn.',
    sourceSummary: ['status:collecting'],
  }
}
