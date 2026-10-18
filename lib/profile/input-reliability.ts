/**
 * Athlete input identity.
 *
 * Unknown, flexible, and an explicit selection stay different.
 * These helpers do not invent a day count, a session length, or equipment.
 */

export type InputKind = 'explicit' | 'flexible' | 'unknown'

export interface TrainingDaySelection {
  kind: InputKind
  days: number | null
  scheduleMode: 'static' | 'flexible' | null
}

export interface SessionDurationSelection {
  kind: InputKind
  minutes: number | null
  durationMode: 'static' | 'adaptive' | null
}

export interface EquipmentSelection {
  kind: 'explicit' | 'unknown'
  equipment: string[]
}

function explicitDayCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 2 && value <= 7) {
    return value
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10)
    if (parsed >= 2 && parsed <= 7) return parsed
  }
  return null
}

function isFlexibleToken(value: unknown): boolean {
  return value === 'flexible' || value === 'Flexible'
}

/**
 * A stored number next to flexible mode is not a chosen day count.
 * A number without flexible mode is an explicit static selection.
 */
export function classifyTrainingDays(input: {
  days: unknown
  scheduleMode?: unknown
}): TrainingDaySelection {
  const mode = input.scheduleMode === 'flexible' || input.scheduleMode === 'static'
    ? input.scheduleMode
    : null
  if (mode === 'flexible' || isFlexibleToken(input.days)) {
    return { kind: 'flexible', days: null, scheduleMode: 'flexible' }
  }
  const days = explicitDayCount(input.days)
  if (days !== null) {
    return { kind: 'explicit', days, scheduleMode: 'static' }
  }
  return { kind: 'unknown', days: null, scheduleMode: null }
}

/**
 * Flexible or adaptive duration is not a chosen minute count.
 * A positive number is an explicit duration. Anything else stays unknown.
 */
export function classifySessionDuration(input: {
  minutes: unknown
  durationMode?: unknown
}): SessionDurationSelection {
  const mode = input.durationMode === 'adaptive' || input.durationMode === 'static'
    ? input.durationMode
    : null
  if (isFlexibleToken(input.minutes) || (mode === 'adaptive' && typeof input.minutes !== 'number')) {
    return { kind: 'flexible', minutes: null, durationMode: 'adaptive' }
  }
  if (typeof input.minutes === 'number' && Number.isFinite(input.minutes) && input.minutes > 0) {
    return {
      kind: 'explicit',
      minutes: input.minutes,
      durationMode: mode === 'adaptive' ? 'adaptive' : 'static',
    }
  }
  return { kind: 'unknown', minutes: null, durationMode: null }
}

/**
 * An empty list is unknown. A list the athlete saved, including floor only,
 * stays that list.
 */
export function classifyEquipment(value: unknown): EquipmentSelection {
  if (!Array.isArray(value)) return { kind: 'unknown', equipment: [] }
  const equipment = value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  if (equipment.length === 0) return { kind: 'unknown', equipment: [] }
  return { kind: 'explicit', equipment }
}

/** Snap an explicit minute count onto the existing duration buckets. */
export function bucketExplicitMinutes(minutes: number): 30 | 45 | 60 | 90 {
  if (minutes <= 30) return 30
  if (minutes <= 45) return 45
  if (minutes <= 60) return 60
  return 90
}
