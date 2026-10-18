/**
 * Conservative server-side fatigue from workout logs the generator already
 * receives. This does not read a database, invent readiness scores, or
 * recommend a deload week. When the logs do not contain enough real signal,
 * callers keep the existing fresh-session behavior.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const RELIABLE_SESSION_COUNT = 2

export interface ServerFatigueLog {
  id?: string
  trusted?: boolean
  sourceRoute?: string
  sessionDate?: string
  createdAt?: string
  perceivedDifficulty?: 'easy' | 'normal' | 'hard'
  exercises?: Array<{ completed?: boolean }>
  completedSetEvidence?: Array<{ actualRPE?: number; completed?: boolean; trusted?: boolean }>
}

export type ServerSessionFatigueDecision =
  | 'TRAIN_AS_PLANNED'
  | 'PRESERVE_QUALITY'
  | 'LIGHTEN_SESSION'

export interface ServerFatigueTrainingFeedback {
  totalSessionsLast7Days: number
  totalSessionsLast14Days: number
  expectedSessionsPerWeek?: number | null
  averageRecentRPE: number | null
  recentCompletionRate: number | null
  trustedWorkoutCount: number
}

export interface ServerFatigueDerivation {
  reliable: boolean
  decision: ServerSessionFatigueDecision | null
  shortGuidance: string
  needsAttention: boolean
  trainingFeedback: ServerFatigueTrainingFeedback | null
  limitation: string | null
}

function parseTime(value: string | undefined): number | null {
  if (typeof value !== 'string' || value.length === 0) return null
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}

function logTime(log: ServerFatigueLog): number | null {
  return parseTime(log.sessionDate) ?? parseTime(log.createdAt)
}

function isTrusted(log: ServerFatigueLog): boolean {
  if (log.trusted === false) return false
  if (log.sourceRoute === 'demo') return false
  return true
}

function numericRpes(log: ServerFatigueLog): number[] {
  if (!Array.isArray(log.completedSetEvidence)) return []
  const values: number[] = []
  for (const set of log.completedSetEvidence) {
    if (set.trusted === false) continue
    if (typeof set.actualRPE === 'number' && Number.isFinite(set.actualRPE)) values.push(set.actualRPE)
  }
  return values
}

function completionRate(log: ServerFatigueLog): number | null {
  if (Array.isArray(log.exercises) && log.exercises.some((exercise) => typeof exercise.completed === 'boolean')) {
    const marked = log.exercises.filter((exercise) => typeof exercise.completed === 'boolean')
    if (marked.length === 0) return null
    return marked.filter((exercise) => exercise.completed === true).length / marked.length
  }
  if (Array.isArray(log.completedSetEvidence) && log.completedSetEvidence.some((set) => typeof set.completed === 'boolean')) {
    const marked = log.completedSetEvidence.filter((set) => typeof set.completed === 'boolean')
    if (marked.length === 0) return null
    return marked.filter((set) => set.completed === true).length / marked.length
  }
  return null
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function unavailable(limitation: string): ServerFatigueDerivation {
  return {
    reliable: false,
    decision: null,
    shortGuidance: '',
    needsAttention: false,
    trainingFeedback: null,
    limitation,
  }
}

export function deriveServerFatigueFromWorkoutLogs(
  logs: readonly ServerFatigueLog[] | null | undefined,
  options?: { expectedSessionsPerWeek?: number | null; now?: Date },
): ServerFatigueDerivation {
  const now = options?.now ?? new Date()
  const nowMs = now.getTime()
  const trusted = (logs ?? []).filter(isTrusted)
  const dated = trusted.filter((log) => logTime(log) !== null)
  const recent = dated.filter((log) => {
    const time = logTime(log) as number
    const age = nowMs - time
    return age >= 0 && age <= 14 * DAY_MS
  })

  if (trusted.length === 0) {
    return unavailable('No trusted recent workouts were available, so generation keeps the existing fresh-session assumption.')
  }
  if (dated.length === 0) {
    return unavailable('Recent workouts had no session date, so generation keeps the existing fresh-session assumption.')
  }

  const signaled = recent.filter((log) => {
    if (numericRpes(log).length > 0) return true
    if (completionRate(log) !== null) return true
    return log.perceivedDifficulty === 'easy' || log.perceivedDifficulty === 'normal' || log.perceivedDifficulty === 'hard'
  })

  if (signaled.length < RELIABLE_SESSION_COUNT) {
    return unavailable(
      'Fewer than two recent workouts included RPE, completion, or difficulty, so generation keeps the existing fresh-session assumption.',
    )
  }

  const rpeValues = signaled.flatMap(numericRpes)
  const averageRecentRPE = average(rpeValues)
  const completionSamples = signaled
    .map(completionRate)
    .filter((value): value is number => value !== null)
  const recentCompletionRate = average(completionSamples)
  const hardCount = signaled.filter((log) => log.perceivedDifficulty === 'hard').length
  const hardRate = hardCount / signaled.length

  let decision: ServerSessionFatigueDecision = 'TRAIN_AS_PLANNED'
  if (
    (averageRecentRPE !== null && averageRecentRPE > 8.5) ||
    (recentCompletionRate !== null && recentCompletionRate < 0.7) ||
    hardRate >= 0.75
  ) {
    decision = 'LIGHTEN_SESSION'
  } else if (
    (averageRecentRPE !== null && averageRecentRPE > 7) ||
    (recentCompletionRate !== null && recentCompletionRate < 0.85) ||
    hardRate >= 0.5
  ) {
    decision = 'PRESERVE_QUALITY'
  }

  const last7 = recent.filter((log) => nowMs - (logTime(log) as number) <= 7 * DAY_MS).length
  const expected = options?.expectedSessionsPerWeek
  const shortGuidance =
    decision === 'LIGHTEN_SESSION'
      ? 'Recent workouts were hard or incomplete, so the next sessions stay a notch easier. No deload week was scheduled.'
      : decision === 'PRESERVE_QUALITY'
        ? 'Recent effort is elevated, so quality is protected and extra stress is trimmed. No deload week was scheduled.'
        : 'Recent workouts look manageable, so training continues as planned.'

  return {
    reliable: true,
    decision,
    shortGuidance,
    needsAttention: decision !== 'TRAIN_AS_PLANNED',
    trainingFeedback: {
      totalSessionsLast7Days: last7,
      totalSessionsLast14Days: recent.length,
      expectedSessionsPerWeek: typeof expected === 'number' && expected > 0 ? expected : null,
      averageRecentRPE,
      recentCompletionRate,
      trustedWorkoutCount: signaled.length,
    },
    limitation: null,
  }
}
