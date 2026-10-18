/**
 * Display contract for Today, the program page, and workout start.
 *
 * Saved program guidance comes from the program already stored by B05/B06.
 * A live personal check is labeled separately and does not rewrite that
 * program or its weekly schedule.
 */

export const PERSONAL_READINESS_BOUNDARY =
  "This is today's personal check. It does not change your saved weekly schedule or schedule a deload week."

export const COMPLETIONS_UNAVAILABLE_EXPLANATION =
  'Workout completion was not available, so missed sessions were not inferred. Your saved schedule is unchanged.'

const SAVED_WEEK_UNCHANGED = 'Your saved weekly schedule stays as written.'

export interface SavedProgramGuidanceInput {
  trainingDaysPerWeek?: number | 'flexible' | null
  fatigueDecision?: { decision?: string; guidance?: string } | null
}

export interface SavedProgramGuidance {
  headline: string
  explanation: string
  savedScheduleLabel: string
}

export function resolveSavedProgramGuidance(
  program: SavedProgramGuidanceInput | null | undefined,
): SavedProgramGuidance {
  const savedScheduleLabel = scheduleLabel(program?.trainingDaysPerWeek)
  const guidance = program?.fatigueDecision?.guidance?.trim() ?? ''
  if (!guidance) {
    return {
      headline: 'Program guidance',
      explanation:
        'No recovery adjustment is saved on this program, so the planned sessions stay as written.',
      savedScheduleLabel,
    }
  }

  return {
    headline: headlineForDecision(program?.fatigueDecision?.decision),
    explanation: guidance,
    savedScheduleLabel,
  }
}

/**
 * An empty list is not evidence. Missed sessions are inferred only when the
 * caller supplies a real completion record, including a real empty record.
 */
export function shouldInferMissedSessions(
  completionIds: readonly string[] | null,
): completionIds is readonly string[] {
  return completionIds !== null
}

export interface GuidanceExercise {
  id: string
  name: string
  sets?: number
}

export interface TodaySetChange {
  path: 'sets'
  label: 'Working sets'
  before: number
  after: number
  reason: string
}

export interface TodayExerciseAdjustment {
  exerciseId: string
  exerciseName: string
  adjustmentType: 'sets_reduced'
  changes: TodaySetChange[]
}

export interface TodayAdjustmentTransfer {
  transferable: boolean
  exerciseAdjustments: TodayExerciseAdjustment[]
  removedExerciseNames: string[]
  explanation: string
}

export interface CurrentSessionHandoff {
  previewId: 'today-session-preview'
  appliedAt: string
  scope: 'current-session-only'
  totalExercisesAffected: number
  exerciseAdjustments: TodayExerciseAdjustment[]
}

/**
 * Today's wellness preview can shorten a list or change sets. The live
 * workout already accepts set changes for this session only. Removed
 * exercises are not sent, because that handoff cannot drop them.
 */
export function describeTodayAdjustmentTransfer(input: {
  wasAdjusted: boolean
  original: GuidanceExercise[]
  adjusted: GuidanceExercise[]
}): TodayAdjustmentTransfer {
  if (!input.wasAdjusted) {
    return {
      transferable: false,
      exerciseAdjustments: [],
      removedExerciseNames: [],
      explanation: `No session change is waiting. Start uses the saved session. ${SAVED_WEEK_UNCHANGED}`,
    }
  }

  const adjustedById = new Map(input.adjusted.map((exercise) => [exercise.id, exercise]))
  const removedExerciseNames: string[] = []
  const exerciseAdjustments: TodayExerciseAdjustment[] = []
  let hasNonTransferableSetChange = false

  for (const original of input.original) {
    const next = adjustedById.get(original.id)
    if (!next) {
      removedExerciseNames.push(original.name)
      continue
    }
    if (typeof original.sets !== 'number' || typeof next.sets !== 'number' || next.sets === original.sets) {
      continue
    }
    if (next.sets > original.sets) {
      hasNonTransferableSetChange = true
      continue
    }
    exerciseAdjustments.push({
      exerciseId: original.id,
      exerciseName: original.name,
      adjustmentType: 'sets_reduced',
      changes: [
        {
          path: 'sets',
          label: 'Working sets',
          before: original.sets,
          after: next.sets,
          reason: 'Accepted for this session only. The saved program is unchanged.',
        },
      ],
    })
  }

  if (removedExerciseNames.length > 0 || hasNonTransferableSetChange) {
    return {
      transferable: false,
      exerciseAdjustments: [],
      removedExerciseNames,
      explanation: `This preview shortens the list on this screen. Start keeps every saved exercise. ${SAVED_WEEK_UNCHANGED}`,
    }
  }

  if (exerciseAdjustments.length === 0) {
    return {
      transferable: false,
      exerciseAdjustments: [],
      removedExerciseNames: [],
      explanation: `Start uses the saved session. ${SAVED_WEEK_UNCHANGED}`,
    }
  }

  return {
    transferable: true,
    exerciseAdjustments,
    removedExerciseNames: [],
    explanation: `Accepted set changes apply to this session only. ${SAVED_WEEK_UNCHANGED}`,
  }
}

export function buildCurrentSessionHandoff(
  transfer: TodayAdjustmentTransfer,
  appliedAt: string,
): CurrentSessionHandoff | null {
  if (!transfer.transferable || transfer.exerciseAdjustments.length === 0) return null
  return {
    previewId: 'today-session-preview',
    appliedAt,
    scope: 'current-session-only',
    totalExercisesAffected: transfer.exerciseAdjustments.length,
    exerciseAdjustments: transfer.exerciseAdjustments,
  }
}

function scheduleLabel(days: number | 'flexible' | null | undefined): string {
  if (typeof days === 'number' && Number.isFinite(days) && days > 0) {
    return `Saved schedule: ${days} days per week.`
  }
  if (days === 'flexible') return 'Saved schedule: flexible.'
  return 'Saved schedule was not recorded on this program.'
}

function headlineForDecision(decision: string | undefined): string {
  if (decision === 'LIGHTEN_SESSION') return 'Program guidance: lighter sessions'
  if (decision === 'PRESERVE_QUALITY') return 'Program guidance: protect quality'
  if (decision === 'TRAIN_AS_PLANNED') return 'Program guidance: train as planned'
  return 'Program guidance'
}
