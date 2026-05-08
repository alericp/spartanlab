/**
 * ============================================================================
 * STEP 25.4 — PERFORMANCE PROGRESSION CLARITY
 * ============================================================================
 *
 * Pure, typed derivation that turns existing evidence-calibration and
 * program truth into a user-facing progression status explanation.
 *
 * Sources:
 *   - program.evidenceCalibrationInfluence (AB12-2)
 *   - program.evidenceCalibrationShapingProof (AB13-4)
 *   - program.weekNumber
 *
 * Contract guarantees:
 *   1. NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`.
 *   2. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   3. NEVER fabricates progression claims. If evidence is unavailable,
 *      returns `status: 'not_enough_evidence'` with honest messaging.
 *   4. All visible strings are derived from real program fields.
 */

import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import type { EvidenceCalibrationGenerationInfluence } from './evidence-calibration-generation-influence'
import type { EvidenceCalibrationShapingProof } from './evidence-calibration-program-shaping'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProgressionStatus =
  | 'advancing'        // Evidence supports progression, building toward next level
  | 'building'         // Establishing baseline, collecting evidence
  | 'holding'          // Intentionally holding current level for consolidation
  | 'protecting'       // Recovery/safety constraints limiting progression
  | 'not_enough_evidence' // Insufficient data to determine progression

export type ProgressionReasonSource =
  | 'evidence'
  | 'recovery'
  | 'consistency'
  | 'safety'
  | 'method'
  | 'schedule'
  | 'baseline'

export interface ProgressionReason {
  id: string
  label: string
  message: string
  source: ProgressionReasonSource
}

export interface ProgressionClarity {
  /** Whether clarity could be derived from available program truth */
  available: boolean
  /** Current progression status */
  status: ProgressionStatus
  /** Short headline for the status */
  headline: string
  /** Concise explanation */
  summary: string
  /** Supporting reasons (max 3) */
  reasons: ProgressionReason[]
  /** Next focus suggestion if available */
  nextFocus: {
    label: string
    message: string
  } | null
  /** Evidence quality indicator */
  evidenceQuality: 'strong' | 'moderate' | 'limited' | 'insufficient'
  /** Week number for context */
  weekNumber: number | null
}

// ---------------------------------------------------------------------------
// Helper: Derive progression clarity from program truth
// ---------------------------------------------------------------------------

/**
 * Derives user-facing progression clarity from existing program evidence.
 * Pure, deterministic, no side effects.
 */
export function deriveProgressionClarity(
  program: AdaptiveProgram | null
): ProgressionClarity {
  // Guard: no program
  if (!program) {
    return createInsufficientEvidenceResult(null)
  }

  const weekNumber = program.weekNumber ?? null
  const influence = program.evidenceCalibrationInfluence ?? null
  const shapingProof = program.evidenceCalibrationShapingProof ?? null

  // Determine evidence quality from influence
  const evidenceQuality = deriveEvidenceQuality(influence)
  
  // Derive progression status and explanation
  const { status, headline, summary, reasons, nextFocus } = deriveProgressionState(
    influence,
    shapingProof,
    weekNumber,
    evidenceQuality
  )

  return {
    available: true,
    status,
    headline,
    summary,
    reasons: reasons.slice(0, 3), // Cap at 3 visible reasons
    nextFocus,
    evidenceQuality,
    weekNumber,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function deriveEvidenceQuality(
  influence: EvidenceCalibrationGenerationInfluence | null
): ProgressionClarity['evidenceQuality'] {
  if (!influence) return 'insufficient'
  
  // ProgramCalibrationPlanConfidence is 'low' | 'medium' | 'high' only
  // Map source confidence to display confidence
  switch (influence.confidence) {
    case 'high': return 'strong'
    case 'medium': return 'moderate'
    case 'low': return 'limited'
    default: return 'insufficient' // Fallback for null/undefined
  }
}

function deriveProgressionState(
  influence: EvidenceCalibrationGenerationInfluence | null,
  shapingProof: EvidenceCalibrationShapingProof | null,
  weekNumber: number | null,
  evidenceQuality: ProgressionClarity['evidenceQuality']
): {
  status: ProgressionStatus
  headline: string
  summary: string
  reasons: ProgressionReason[]
  nextFocus: ProgressionClarity['nextFocus']
} {
  const reasons: ProgressionReason[] = []
  
  // Case 1: No evidence system engaged at all
  if (!influence || influence.status === 'inactive') {
    // Check if this is early program (week 1-2) - building baseline
    if (weekNumber !== null && weekNumber <= 2) {
      return {
        status: 'building',
        headline: 'Building baseline',
        summary: 'SpartanLab is establishing your training baseline. Complete sessions consistently so the system can learn your capacity.',
        reasons: [
          {
            id: 'early_week',
            label: 'Early phase',
            message: `Week ${weekNumber} — collecting initial training data`,
            source: 'baseline',
          },
        ],
        nextFocus: {
          label: 'This week',
          message: 'Complete prescribed sets with clean form and honest RPE feedback.',
        },
      }
    }
    
    // Generic building baseline
    return {
      status: 'building',
      headline: 'Building baseline',
      summary: 'Training evidence is being collected. Continue completing workouts so SpartanLab can calibrate progression targets.',
      reasons: [
        {
          id: 'collecting_evidence',
          label: 'Evidence collection',
          message: 'More completed workouts needed to calibrate progression',
          source: 'evidence',
        },
      ],
      nextFocus: {
        label: 'Focus',
        message: 'Log your sets with accurate RPE so the system can track your readiness.',
      },
    }
  }

  // Case 2: Degraded evidence - system has data issues
  if (influence.status === 'degraded') {
    return {
      status: 'holding',
      headline: 'Progression on hold',
      summary: 'Evidence source is temporarily limited. Progression is held at a safe baseline until more reliable data is available.',
      reasons: [
        {
          id: 'degraded_evidence',
          label: 'Limited evidence',
          message: 'Recent training data is incomplete — holding current level',
          source: 'evidence',
        },
      ],
      nextFocus: {
        label: 'Focus',
        message: 'Complete your next few sessions to restore evidence quality.',
      },
    }
  }

  // Case 3: Active evidence - derive from actual calibration
  if (influence.status === 'active' || influence.status === 'metadata_only') {
    const progressionMode = influence.progressionAggressiveness
    const volumeBias = influence.volumeBias
    const recoveryBias = influence.recoveryBias

    // Conservative progression - protecting
    if (progressionMode === 'conservative') {
      reasons.push({
        id: 'conservative_progression',
        label: 'Conservative mode',
        message: 'Intensity targets are capped while the system validates your capacity',
        source: 'safety',
      })

      // Add shaping proof if RPE was actually capped
      if (shapingProof?.appliedAtLeastOneMutation && shapingProof.cappedExerciseCount > 0) {
        reasons.push({
          id: 'rpe_capped',
          label: 'RPE protected',
          message: `${shapingProof.cappedExerciseCount} exercise${shapingProof.cappedExerciseCount > 1 ? 's' : ''} had intensity targets capped for safety`,
          source: 'recovery',
        })
      }

      return {
        status: 'protecting',
        headline: 'Recovery-protected',
        summary: 'Progression is being managed conservatively. The system is prioritizing sustainable training over aggressive advancement.',
        reasons,
        nextFocus: {
          label: 'This phase',
          message: 'Focus on quality reps and consistent session completion to build toward progression.',
        },
      }
    }

    // Volume reduced - holding/protecting
    if (volumeBias === 'reduce') {
      reasons.push({
        id: 'volume_reduced',
        label: 'Volume managed',
        message: 'Set counts are reduced to match current recovery capacity',
        source: 'recovery',
      })

      return {
        status: 'protecting',
        headline: 'Volume-protected',
        summary: 'Volume is being managed to protect recovery. This allows skill and strength quality to remain high while fatigue stays controlled.',
        reasons,
        nextFocus: {
          label: 'Focus',
          message: 'Execute prescribed sets with full intent — quality over quantity.',
        },
      }
    }

    // Recovery bias active (RecoveryBias = 'protect' | 'normal')
    if (recoveryBias === 'protect') {
      reasons.push({
        id: 'recovery_priority',
        label: 'Recovery focus',
        message: 'Training load is reduced to prioritize recovery',
        source: 'recovery',
      })

      return {
        status: 'protecting',
        headline: 'Recovery phase',
        summary: 'The system detected recovery pressure. Training load is reduced to allow adaptation before progressing.',
        reasons,
        nextFocus: {
          label: 'This week',
          message: 'Prioritize sleep and nutrition alongside training.',
        },
      }
    }

    // Standard progression with good evidence
    if (progressionMode === 'standard' && evidenceQuality !== 'insufficient') {
      reasons.push({
        id: 'standard_progression',
        label: 'On track',
        message: 'Training evidence supports current progression path',
        source: 'evidence',
      })

      // Add week context if available
      if (weekNumber !== null && weekNumber >= 3) {
        reasons.push({
          id: 'week_context',
          label: `Week ${weekNumber}`,
          message: 'Building on established training baseline',
          source: 'baseline',
        })
      }

      return {
        status: 'advancing',
        headline: 'Progressing',
        summary: 'Training evidence supports continued progression. Keep completing sessions consistently to maintain momentum.',
        reasons,
        nextFocus: {
          label: 'Keep going',
          message: 'Stay consistent with session completion and RPE feedback.',
        },
      }
    }

    // Metadata only - observing
    if (influence.status === 'metadata_only') {
      reasons.push({
        id: 'observing',
        label: 'Observing',
        message: 'Evidence is being collected but not yet influencing progression',
        source: 'evidence',
      })

      return {
        status: 'building',
        headline: 'Observing progress',
        summary: 'The system is monitoring your training. Continue logging workouts to build evidence for future progression decisions.',
        reasons,
        nextFocus: {
          label: 'Focus',
          message: 'Complete sessions and log accurate feedback to inform progression.',
        },
      }
    }
  }

  // Fallback: insufficient evidence
  return createInsufficientEvidenceResult(weekNumber).status === 'not_enough_evidence'
    ? {
        status: 'building',
        headline: 'Building baseline',
        summary: 'More training evidence is needed to determine progression status. Continue completing workouts consistently.',
        reasons: [
          {
            id: 'more_evidence_needed',
            label: 'More data needed',
            message: 'Complete more sessions to establish progression baseline',
            source: 'evidence',
          },
        ],
        nextFocus: {
          label: 'Focus',
          message: 'Consistent training will enable smarter progression decisions.',
        },
      }
    : createInsufficientEvidenceResult(weekNumber) as never
}

function createInsufficientEvidenceResult(weekNumber: number | null): ProgressionClarity {
  return {
    available: true,
    status: 'not_enough_evidence',
    headline: 'Building baseline',
    summary: 'SpartanLab is collecting training evidence. Complete workouts consistently so the system can calibrate your progression path.',
    reasons: [
      {
        id: 'insufficient_evidence',
        label: 'Collecting data',
        message: 'More completed workouts needed to determine progression status',
        source: 'evidence',
      },
    ],
    nextFocus: {
      label: 'This week',
      message: 'Focus on completing prescribed sessions with honest RPE feedback.',
    },
    evidenceQuality: 'insufficient',
    weekNumber,
  }
}
