/**
 * Active program storage decision.
 *
 * The active key wins over history. Deleting a program removes that id from
 * the active key, history, and the first-program copy. The id is remembered
 * so a later first-program migration cannot write it back. This module does
 * not read or write onboarding profiles, athlete profiles, or workout history.
 */

import { readAthleteItem, removeAthleteItem, writeAthleteItem } from '../athlete-local-scope'

export const ADAPTIVE_PROGRAM_HISTORY_KEY = 'spartanlab_adaptive_programs'
export const ACTIVE_PROGRAM_KEY = 'spartanlab_active_program'
export const FIRST_PROGRAM_KEY = 'spartanlab_first_program'
export const DELETED_PROGRAM_IDS_KEY = 'spartanlab_deleted_program_ids'
const MAX_DELETED_PROGRAM_IDS = 50

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

function parseJson(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function recordId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const id = (value as { id?: unknown }).id
  return typeof id === 'string' && id.length > 0 ? id : null
}

export function readDeletedProgramIds(): string[] {
  const parsed = parseJson(readAthleteItem(DELETED_PROGRAM_IDS_KEY))
  if (!Array.isArray(parsed)) return []
  return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

export function isDeletedProgramId(id: string | null | undefined): boolean {
  if (!id) return false
  return readDeletedProgramIds().includes(id)
}

function rememberDeletedProgramId(id: string): void {
  const ids = readDeletedProgramIds().filter((saved) => saved !== id)
  ids.push(id)
  const bounded = ids.slice(-MAX_DELETED_PROGRAM_IDS)
  writeAthleteItem(DELETED_PROGRAM_IDS_KEY, JSON.stringify(bounded))
}

/**
 * Read the first-program copy when it is still a valid fallback.
 * A deleted id is removed and is not returned.
 */
export function readFirstProgramFallback(): StoredProgramRecord | null {
  if (typeof window === 'undefined') return null
  const parsed = parseJson(readAthleteItem(FIRST_PROGRAM_KEY))
  const id = recordId(parsed)
  if (!id) return null
  if (isDeletedProgramId(id)) {
    removeAthleteItem(FIRST_PROGRAM_KEY)
    return null
  }
  return isStoredProgramRecord(parsed) ? parsed : null
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

  const historyRaw = parseJson(readAthleteItem(ADAPTIVE_PROGRAM_HISTORY_KEY))
  const history = Array.isArray(historyRaw) ? historyRaw : null
  const remainingHistory = history?.filter((item) => recordId(item) !== id) ?? []
  const removedFromHistory = !!history && remainingHistory.length !== history.length
  const removedActive = recordId(parseJson(readAthleteItem(ACTIVE_PROGRAM_KEY))) === id
  const removedFirst = recordId(parseJson(readAthleteItem(FIRST_PROGRAM_KEY))) === id
  if (!removedFromHistory && !removedActive && !removedFirst) return false

  if (removedFromHistory) {
    writeAthleteItem(ADAPTIVE_PROGRAM_HISTORY_KEY, JSON.stringify(remainingHistory))
  }
  if (removedActive) removeAthleteItem(ACTIVE_PROGRAM_KEY)
  if (removedFirst) removeAthleteItem(FIRST_PROGRAM_KEY)
  rememberDeletedProgramId(id)
  return true
}

export function readLatestStoredAdaptiveProgram(): StoredProgramRecord | null {
  if (typeof window === 'undefined') return null
  const active = parseActive(readAthleteItem(ACTIVE_PROGRAM_KEY))
  const visibleActive = active?.id && isDeletedProgramId(active.id) ? null : active
  if (active?.id && isDeletedProgramId(active.id)) {
    removeAthleteItem(ACTIVE_PROGRAM_KEY)
  }
  const historyRaw = parseJson(readAthleteItem(ADAPTIVE_PROGRAM_HISTORY_KEY))
  if (Array.isArray(historyRaw) && historyRaw.some((item) => isDeletedProgramId(recordId(item)))) {
    const remaining = historyRaw.filter((item) => !isDeletedProgramId(recordId(item)))
    writeAthleteItem(ADAPTIVE_PROGRAM_HISTORY_KEY, JSON.stringify(remaining))
  }
  const history = parseHistory(readAthleteItem(ADAPTIVE_PROGRAM_HISTORY_KEY))
    .filter((program) => !isDeletedProgramId(program.id))
  return selectStoredProgram(visibleActive, history).program
}
