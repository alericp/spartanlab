/**
 * Generation truth for a saved athlete.
 *
 * A saved goal stays that goal. Flexible, static, adaptive, and an
 * explicit number stay what the athlete chose. Missing frequency,
 * duration, schedule mode, and experience stay missing. This module
 * does not pick a weekly frequency or a session length for them.
 */

import {
  classifySessionDuration,
  classifyTrainingDays,
  type SessionDurationSelection,
  type TrainingDaySelection,
} from './input-reliability'

export type SavedExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface GenerationTruthSource {
  primaryGoal?: unknown
  secondaryGoal?: unknown
  experienceLevel?: unknown
  scheduleMode?: unknown
  trainingDaysPerWeek?: unknown
  sessionDurationMode?: unknown
  sessionLengthMinutes?: unknown
}

export interface GenerationTruth {
  primaryGoal: string | null
  secondaryGoal: string | null
  experienceLevel: SavedExperienceLevel | null
  schedule: TrainingDaySelection
  duration: SessionDurationSelection
}

function savedGoal(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function savedExperience(value: unknown): SavedExperienceLevel | null {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced') return value
  return null
}

function chooseSchedule(source: GenerationTruthSource): TrainingDaySelection | null {
  const classified = classifyTrainingDays({
    days: source.trainingDaysPerWeek,
    scheduleMode: source.scheduleMode,
  })
  if (classified.kind !== 'unknown') return classified
  if (source.scheduleMode === 'static') {
    return { kind: 'unknown', days: null, scheduleMode: 'static' }
  }
  return null
}

function chooseDuration(source: GenerationTruthSource): SessionDurationSelection | null {
  const classified = classifySessionDuration({
    minutes: source.sessionLengthMinutes,
    durationMode: source.sessionDurationMode,
  })
  if (classified.kind !== 'unknown') return classified
  if (source.sessionDurationMode === 'static') {
    return { kind: 'unknown', minutes: null, durationMode: 'static' }
  }
  return null
}

/**
 * Preferred values win. A missing preferred field may use the fallback.
 * A missing field on both sides stays null.
 */
export function resolveGenerationTruth(
  preferred: GenerationTruthSource,
  fallback: GenerationTruthSource = {},
): GenerationTruth {
  return {
    primaryGoal: savedGoal(preferred.primaryGoal) ?? savedGoal(fallback.primaryGoal),
    secondaryGoal: savedGoal(preferred.secondaryGoal) ?? savedGoal(fallback.secondaryGoal),
    experienceLevel: savedExperience(preferred.experienceLevel) ?? savedExperience(fallback.experienceLevel),
    schedule: chooseSchedule(preferred) ?? chooseSchedule(fallback) ?? {
      kind: 'unknown',
      days: null,
      scheduleMode: null,
    },
    duration: chooseDuration(preferred) ?? chooseDuration(fallback) ?? {
      kind: 'unknown',
      minutes: null,
      durationMode: null,
    },
  }
}
