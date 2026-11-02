/**
 * Active program storage decision.
 *
 * The active key wins over history. Deleting a program removes that id from
 * both places. This module does not read or write onboarding profiles.
 */

import { readAthleteItem, removeAthleteItem, writeAthleteItem } from '../athlete-local-scope'

export const ADAPTIVE_PROGRAM_HISTORY_KEY = 'spartanlab_adaptive_programs'
export const ACTIVE_PROGRAM_KEY = 'spartanlab_active_program'

export interface StoredProgramRecord {
  id?: string
  createdAt?: string
  sessions?: unknown
}

export interface StoredProgramSelection {
  program: StoredProgramRecord | null
  source: 'canonical_active_key' | 'history_array_sorted' | 'none'
}

export function isStoredProgramRecord(value: unknown): value is StoredProgramRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as StoredProgramRecord
  return typeof record.id === 'string' && record.id.length > 0 && Boolean(record.sessions)
}

export function removeProgramFromStores(input: {
  id: string
  history: StoredProgramRecord[]
  active: StoredProgramRecord | null
}): {
  changed: boolean
  removedFromHistory: boolean
  removedActive: boolean
  history: StoredProgramRecord[]
  active: StoredProgramRecord | null
} {
  const history = input.history.filter((program) => program.id !== input.id)
  const removedFromHistory = history.length !== input.history.length
  const removedActive = input.active?.id === input.id
  return {
    changed: removedFromHistory || removedActive,
    removedFromHistory,
    removedActive,
    history,
    active: removedActive ? null : input.active,
  }
}

export function selectStoredProgram(
  active: StoredProgramRecord | null,
  history: readonly StoredProgramRecord[],
): StoredProgramSelection {
  if (isStoredProgramRecord(active)) {
    return { program: active, source: 'canonical_active_key' }
  }

  const candidates = history.filter(isStoredProgramRecord)
  if (candidates.length === 0) {
    return { program: null, source: 'none' }
  }

  const latest = [...candidates].sort(
    (left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
  )[0]
  return { program: latest, source: 'history_array_sorted' }
}

function parseHistory(raw: string | null): StoredProgramRecord[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter(isStoredProgramRecord) : []
  } catch {
    return []
  }
}

function parseActive(raw: string | null): StoredProgramRecord | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return isStoredProgramRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function deleteStoredAdaptiveProgram(id: string): boolean {
  if (typeof window === 'undefined' || !id) return false

  const history = parseHistory(readAthleteItem(ADAPTIVE_PROGRAM_HISTORY_KEY))
  const active = parseActive(readAthleteItem(ACTIVE_PROGRAM_KEY))
  const decision = removeProgramFromStores({ id, history, active })
  if (!decision.changed) return false

  if (decision.removedFromHistory) {
    writeAthleteItem(ADAPTIVE_PROGRAM_HISTORY_KEY, JSON.stringify(decision.history))
  }
  if (decision.removedActive) {
    removeAthleteItem(ACTIVE_PROGRAM_KEY)
  }
  return true
}

export function readLatestStoredAdaptiveProgram(): StoredProgramRecord | null {
  if (typeof window === 'undefined') return null
  const history = parseHistory(readAthleteItem(ADAPTIVE_PROGRAM_HISTORY_KEY))
  const active = parseActive(readAthleteItem(ACTIVE_PROGRAM_KEY))
  return selectStoredProgram(active, history).program
}
