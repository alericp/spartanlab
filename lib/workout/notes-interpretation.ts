/**
 * Read-only reading of a workout note.
 *
 * The saved note on the workout log stays the athlete's words. This module
 * does not write a log, invent a rep, load, or measurement, or apply a
 * future-workout change. Selected tags continue through the existing
 * performance path on their own.
 */

export const VOICE_LOGGING_DECISION = {
  implemented: false,
  reason:
    'Browser speech recognition can send audio to the browser vendor. A paid transcription service would send the note to another provider. Neither is enabled.',
} as const

const AMBIGUOUS =
  /\b(maybe|kinda|kind of|not sure|i think|felt weird|idk|somewhat|a little|a bit|possibly|unsure|sort of)\b/i

const PRIVATE_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b(diagnosed|diagnosis|prescription|medication|social security|\bssn\b)\b/i,
]

const TRAINING_WORD =
  /\b(grip|form|technique|tired|fatigue|fatigued|hard|easy|pain|hurt|sore|wrist|shoulder|elbow|knee|hold|rep|reps|set|rpe|strong|weak|balance|gassed)\b/i

const TEXT_RULES: ReadonlyArray<{ id: string; pattern: RegExp; statement: string; influences: boolean }> = [
  {
    id: 'no_pain',
    pattern: /\b(no|not|didn't|did not|without)\b(?:\s+\w+){0,3}\s+(pain|hurt|sore)\b/i,
    statement: 'You wrote that there was no pain.',
    influences: false,
  },
  {
    id: 'grip',
    pattern: /\b(grip (failed|gave out|slipped)|lost my grip|grip was the limiter|grip limited)\b/i,
    statement: 'You wrote that grip limited the set.',
    influences: true,
  },
  {
    id: 'technique',
    pattern: /\b(form broke|technique broke|technique fell apart|could not hold the position|couldn't hold the position)\b/i,
    statement: 'You wrote that technique broke down.',
    influences: true,
  },
  {
    id: 'easy',
    pattern: /\b(too easy|easier than expected|felt strong|hit every rep|all reps clean)\b/i,
    statement: 'You wrote that the work went well.',
    influences: true,
  },
  {
    id: 'hard',
    pattern: /\b(too hard|harder than expected|could not finish|couldn't finish)\b/i,
    statement: 'You wrote that the work was hard.',
    influences: true,
  },
  {
    id: 'fatigue',
    pattern: /\b(unusually tired|more tired than usual|gassed|no energy|low energy)\b/i,
    statement: 'You wrote that fatigue was high.',
    influences: true,
  },
  {
    id: 'pain',
    pattern: /\b(pain|hurt|sore|pinch|discomfort)\b/i,
    statement: 'You wrote about discomfort.',
    influences: true,
  },
]

const TAG_STATEMENTS: Record<string, string> = {
  pain: 'You marked pain.',
  injury: 'You marked injury.',
  discomfort: 'You marked discomfort.',
  fatigue: 'You marked fatigue.',
  tired: 'You marked tired.',
  sleep_fatigue: 'You marked low energy.',
  grip_limited: 'You marked a grip limitation.',
  grip_issue: 'You marked a grip limitation.',
  form_issue: 'You marked a technique problem.',
  technique_issue: 'You marked a technique problem.',
  technique_breakdown: 'You marked a technique problem.',
  too_easy: 'You marked this easier than expected.',
  easier_than_expected: 'You marked this easier than expected.',
  too_hard: 'You marked this harder than expected.',
  harder_than_expected: 'You marked this harder than expected.',
  balance_issue: 'You marked a balance problem.',
  straight_arm_fatigue: 'You marked straight-arm fatigue.',
  support_mismatch: 'You marked a support problem.',
  load_mismatch: 'You marked a load problem.',
  focus_lost: 'You marked lost focus.',
}

export interface WorkoutNoteInput {
  text?: string | null
  selectedTags?: readonly string[]
  perceivedDifficulty?: 'easy' | 'normal' | 'hard' | null
  workoutLogId?: string | null
  sessionLabel?: string | null
  exerciseName?: string | null
  exerciseIndex?: number | null
  setNumber?: number | null
  actualReps?: number | null
  targetReps?: number | null
  actualHoldSeconds?: number | null
  targetHoldSeconds?: number | null
}

export interface WorkoutNoteAttachment {
  workoutLogId: string | null
  sessionLabel: string | null
  exerciseName: string | null
  exerciseIndex: number | null
  setNumber: number | null
}

export interface WorkoutNoteReading {
  certainty: 'explicit' | 'uncertain' | 'not_useful'
  insight: string
  quotedStatement: string | null
  evidence: readonly string[]
  containsPrivateDetails: boolean
  altersFutureWorkout: false
  attachment: WorkoutNoteAttachment
}

export function noteTextMayInfluenceTraining(text: string | null | undefined): boolean {
  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (!trimmed) return false
  const classified = classifyText(trimmed)
  return classified.influences
}

/**
 * One line for a set summary. Private wording stays in the saved note and
 * is not copied into the summary or its tooltip.
 */
export function workoutNoteSummaryLine(text: string | null | undefined): string | null {
  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (!trimmed) return null
  const classified = classifyText(trimmed)
  if (classified.kind === 'private') {
    return 'Private details stay with this set and are not shown here.'
  }
  if (classified.kind === 'explicit') return classified.statement
  if (classified.kind === 'uncertain') {
    return 'Note saved. The wording is unclear, so it does not change a future workout.'
  }
  return 'Note saved with this set.'
}

export function interpretWorkoutNote(input: WorkoutNoteInput): WorkoutNoteReading | null {
  const text = typeof input.text === 'string' ? input.text.trim() : ''
  const tags = Array.isArray(input.selectedTags) ? input.selectedTags.filter((tag) => typeof tag === 'string' && tag.length > 0) : []
  const difficulty = input.perceivedDifficulty ?? null
  if (!text && tags.length === 0 && (difficulty === null || difficulty === 'normal')) return null

  const attachment = attachmentFrom(input)
  const classified = text ? classifyText(text) : { kind: 'empty' as const, influences: false, statement: null }
  const tagLines = tags.map((tag) => TAG_STATEMENTS[tag]).filter((line): line is string => typeof line === 'string')
  const privateDetails = classified.kind !== 'empty' && classified.kind === 'private'
  const evidence = evidenceLines(input)
  const place = placeLine(attachment)

  if (privateDetails) {
    return {
      certainty: 'explicit',
      insight: joinSentences([
        'This note includes private details. They stay with this workout and are not repeated here.',
        tagLines.length > 0 ? `${tagLines.join(' ')} The selected tag stays with this set.` : '',
        'The written note is not used to change a future workout.',
        place,
      ]),
      quotedStatement: null,
      evidence,
      containsPrivateDetails: true,
      altersFutureWorkout: false,
      attachment,
    }
  }

  if (tagLines.length > 0) {
    const written =
      classified.kind === 'uncertain'
        ? 'The written words are unclear, so they are not added as a separate training change.'
        : classified.kind === 'not_useful'
          ? 'The rest of the note has no training signal.'
          : classified.statement
            ? `${classified.statement} This reading does not add a second change.`
            : 'This reading does not add a second change.'
    return {
      certainty: 'explicit',
      insight: joinSentences([
        `${tagLines.join(' ')} That selected tag stays with this set.`,
        written,
        ...evidence,
        place,
      ]),
      quotedStatement: classified.kind === 'explicit' ? quote(text) : null,
      evidence,
      containsPrivateDetails: false,
      altersFutureWorkout: false,
      attachment,
    }
  }

  if (classified.kind === 'explicit') {
    return {
      certainty: 'explicit',
      insight: joinSentences([
        classified.statement,
        'It is saved as your words. This reading does not change a future workout.',
        ...evidence,
        place,
      ]),
      quotedStatement: quote(text),
      evidence,
      containsPrivateDetails: false,
      altersFutureWorkout: false,
      attachment,
    }
  }

  if (classified.kind === 'uncertain' || (classified.kind === 'empty' && difficulty === null)) {
    return {
      certainty: 'uncertain',
      insight: joinSentences([
        'This note is unclear, so it stays as your words and does not change a future workout.',
        ...evidence,
        place,
      ]),
      quotedStatement: quote(text),
      evidence,
      containsPrivateDetails: false,
      altersFutureWorkout: false,
      attachment,
    }
  }

  if (classified.kind === 'not_useful' && difficulty !== 'hard' && difficulty !== 'easy') {
    return {
      certainty: 'not_useful',
      insight: joinSentences(['No training signal in this note.', place]),
      quotedStatement: null,
      evidence,
      containsPrivateDetails: false,
      altersFutureWorkout: false,
      attachment,
    }
  }

  if (difficulty === 'hard' || difficulty === 'easy') {
    return {
      certainty: 'explicit',
      insight: joinSentences([
        difficulty === 'hard' ? 'You marked this session hard.' : 'You marked this session easy.',
        'That is the saved difficulty for this workout. This reading does not change the weekly schedule.',
        place,
      ]),
      quotedStatement: null,
      evidence,
      containsPrivateDetails: false,
      altersFutureWorkout: false,
      attachment,
    }
  }

  return null
}

export function dedupeWorkoutNoteReadings(readings: readonly WorkoutNoteReading[]): WorkoutNoteReading[] {
  const seen = new Set<string>()
  const result: WorkoutNoteReading[] = []
  for (const reading of readings) {
    const key = [
      reading.attachment.workoutLogId ?? '',
      reading.attachment.exerciseIndex ?? '',
      reading.attachment.setNumber ?? '',
      reading.quotedStatement ?? reading.insight,
    ].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(reading)
  }
  return result
}

type TextClass =
  | { kind: 'empty'; influences: false; statement: null }
  | { kind: 'private'; influences: false; statement: null }
  | { kind: 'explicit'; influences: boolean; statement: string }
  | { kind: 'uncertain'; influences: false; statement: null }
  | { kind: 'not_useful'; influences: false; statement: null }

function classifyText(text: string): TextClass {
  if (PRIVATE_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'private', influences: false, statement: null }
  }
  const ambiguous = AMBIGUOUS.test(text)
  const matched = TEXT_RULES.filter((rule) => rule.pattern.test(text))
  const withoutPainIfDenied = matched.some((rule) => rule.id === 'no_pain')
    ? matched.filter((rule) => rule.id !== 'pain')
    : matched
  if (ambiguous) {
    if (withoutPainIfDenied.length > 0 || TRAINING_WORD.test(text)) {
      return { kind: 'uncertain', influences: false, statement: null }
    }
    return { kind: 'not_useful', influences: false, statement: null }
  }
  if (withoutPainIfDenied.length > 0) {
    const influences = withoutPainIfDenied.some((rule) => rule.influences)
    const statement =
      withoutPainIfDenied.length === 1
        ? withoutPainIfDenied[0].statement
        : 'You wrote about more than one training limit.'
    return { kind: 'explicit', influences, statement }
  }
  if (TRAINING_WORD.test(text)) return { kind: 'uncertain', influences: false, statement: null }
  return { kind: 'not_useful', influences: false, statement: null }
}

function attachmentFrom(input: WorkoutNoteInput): WorkoutNoteAttachment {
  return {
    workoutLogId: input.workoutLogId ?? null,
    sessionLabel: input.sessionLabel ?? null,
    exerciseName: input.exerciseName ?? null,
    exerciseIndex: numberOrNull(input.exerciseIndex),
    setNumber: numberOrNull(input.setNumber),
  }
}

function evidenceLines(input: WorkoutNoteInput): string[] {
  const lines: string[] = []
  if (isPositive(input.actualReps) && isPositive(input.targetReps)) {
    lines.push(`Logged ${input.actualReps} reps. The target was ${input.targetReps}.`)
  }
  if (isPositive(input.actualHoldSeconds) && isPositive(input.targetHoldSeconds)) {
    lines.push(`Logged a ${input.actualHoldSeconds}s hold. The target was ${input.targetHoldSeconds}s.`)
  }
  return lines
}

function placeLine(attachment: WorkoutNoteAttachment): string {
  const where =
    attachment.exerciseName && attachment.setNumber
      ? `Attached to ${attachment.exerciseName}, set ${attachment.setNumber}.`
      : attachment.sessionLabel
        ? `Attached to ${attachment.sessionLabel}.`
        : 'Not attached to an exercise yet.'
  if (!attachment.workoutLogId) {
    return `${where} It is not in completed history until this workout is saved.`
  }
  return where
}

function quote(text: string): string | null {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) return null
  return compact.length > 80 ? `${compact.slice(0, 77)}...` : compact
}

function joinSentences(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join(' ')
}

function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isPositive(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
