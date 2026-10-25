/**
 * Browser-local athlete isolation.
 *
 * Clerk's signed-in user id is the only identity this module accepts. It is
 * set by the authenticated app shell. Request bodies are not an identity
 * source, and server routes keep resolving the Clerk session themselves.
 *
 * Until an athlete is bound, legacy keys behave as they did before this
 * boundary so existing single-store callers and profile tests keep working.
 * After a bind, reads and writes use a per-athlete key. Records that already
 * name that athlete are copied across. Records with no owner are copied into
 * quarantine and are not shown. The original bytes stay where they were.
 */

export const QUARANTINE_KEY = 'spartanlab_ownerless_quarantine'
export const SCOPE_LEDGER_KEY = 'spartanlab_athlete_scope_ledger'
export const HISTORY_RETRY_KEY = 'spartanlab_history_retry'

const UNOWNED_IDS = new Set([
  'local-user',
  'awaiting-auth',
  'preview-user',
  'preview-profile',
  'local-profile',
])

type AthleteScope =
  | { status: 'unbound' }
  | { status: 'bound'; userId: string | null }

interface QuarantineStore {
  blobs: Record<string, string>
  records: Record<string, unknown[]>
}

interface ScopeLedger {
  adopted: string[]
  quarantinedBlobs: string[]
}

export interface OwnedRecord {
  id?: string
  ownerUserId?: string
}

export interface PendingHistoryRetryRecord<T> {
  ownerUserId: string
  occurrenceId: string
  serverEvidence?: 'pending' | 'saved' | 'skipped'
  payload: T
}

let athleteScope: AthleteScope = { status: 'unbound' }

function browserStore(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

export function bindActiveAthlete(userId: string | null): void {
  if (typeof window === 'undefined') return
  const trimmed = typeof userId === 'string' ? userId.trim() : ''
  athleteScope = { status: 'bound', userId: trimmed || null }
}

export function unbindActiveAthlete(): void {
  athleteScope = { status: 'unbound' }
}

/** `undefined` means Clerk has not bound this browser yet. `null` means signed out. */
export function getBoundAthleteId(): string | null | undefined {
  if (athleteScope.status === 'unbound') return undefined
  return athleteScope.userId
}

export function athleteStorageKey(baseKey: string, userId: string): string {
  return `${baseKey}::athlete::${userId}`
}

export function storageEventMatchesAthlete(eventKey: string | null, baseKeys: readonly string[]): boolean {
  if (!eventKey) return false
  const bound = getBoundAthleteId()
  if (typeof bound === 'string') {
    return baseKeys.some((base) => eventKey === athleteStorageKey(base, bound))
  }
  if (bound === undefined) return baseKeys.includes(eventKey)
  return false
}

export function readRecordOwner(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as { ownerUserId?: unknown; userId?: unknown }
  const candidate = typeof record.ownerUserId === 'string' && record.ownerUserId
    ? record.ownerUserId
    : typeof record.userId === 'string' && record.userId
      ? record.userId
      : null
  if (!candidate || UNOWNED_IDS.has(candidate)) return null
  return candidate
}

export function partitionByOwner<T extends OwnedRecord>(records: T[], userId: string): {
  visible: T[]
  foreign: T[]
  ownerless: T[]
} {
  const visible: T[] = []
  const foreign: T[] = []
  const ownerless: T[] = []
  for (const record of records) {
    if (!record || typeof record !== 'object') continue
    if (!record.ownerUserId) ownerless.push(record)
    else if (record.ownerUserId === userId) visible.push(record)
    else foreign.push(record)
  }
  return { visible, foreign, ownerless }
}

function emptyQuarantine(): QuarantineStore {
  return { blobs: {}, records: {} }
}

function readQuarantine(store: Storage): QuarantineStore {
  const raw = store.getItem(QUARANTINE_KEY)
  if (!raw) return emptyQuarantine()
  try {
    const parsed = JSON.parse(raw) as Partial<QuarantineStore>
    return {
      blobs: parsed.blobs && typeof parsed.blobs === 'object' ? parsed.blobs : {},
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
    }
  } catch {
    return emptyQuarantine()
  }
}

function writeQuarantine(store: Storage, quarantine: QuarantineStore): void {
  store.setItem(QUARANTINE_KEY, JSON.stringify(quarantine))
}

function readLedger(store: Storage): ScopeLedger {
  const raw = store.getItem(SCOPE_LEDGER_KEY)
  if (!raw) return { adopted: [], quarantinedBlobs: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<ScopeLedger>
    return {
      adopted: Array.isArray(parsed.adopted) ? parsed.adopted.filter((item) => typeof item === 'string') : [],
      quarantinedBlobs: Array.isArray(parsed.quarantinedBlobs)
        ? parsed.quarantinedBlobs.filter((item) => typeof item === 'string')
        : [],
    }
  } catch {
    return { adopted: [], quarantinedBlobs: [] }
  }
}

function writeLedger(store: Storage, ledger: ScopeLedger): void {
  store.setItem(SCOPE_LEDGER_KEY, JSON.stringify(ledger))
}

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return []
  }
}

function recordKey(record: OwnedRecord): string {
  if (typeof record.id === 'string' && record.id) return record.id
  return JSON.stringify(record)
}

function quarantineBlob(store: Storage, baseKey: string, raw: string): void {
  const quarantine = readQuarantine(store)
  if (quarantine.blobs[baseKey] === undefined) {
    quarantine.blobs[baseKey] = raw
    writeQuarantine(store, quarantine)
  }
  const ledger = readLedger(store)
  if (!ledger.quarantinedBlobs.includes(baseKey)) {
    ledger.quarantinedBlobs.push(baseKey)
    writeLedger(store, ledger)
  }
}

function quarantineOwnerlessRecords(store: Storage, baseKey: string, records: unknown[]): void {
  if (records.length === 0) return
  const quarantine = readQuarantine(store)
  const existing = Array.isArray(quarantine.records[baseKey]) ? quarantine.records[baseKey] : []
  const seen = new Set(existing.map((record) => recordKey((record ?? {}) as OwnedRecord)))
  let changed = false
  for (const record of records) {
    if (!record || typeof record !== 'object') continue
    const key = recordKey(record as OwnedRecord)
    if (seen.has(key)) continue
    existing.push(record)
    seen.add(key)
    changed = true
  }
  if (!changed) return
  quarantine.records[baseKey] = existing
  writeQuarantine(store, quarantine)
}

function activeWriteKey(baseKey: string): string | null {
  const bound = getBoundAthleteId()
  if (bound === undefined) return baseKey
  if (!bound) return null
  return athleteStorageKey(baseKey, bound)
}

export function readAthleteItem(baseKey: string): string | null {
  const store = browserStore()
  if (!store) return null
  const bound = getBoundAthleteId()
  if (bound === undefined) return store.getItem(baseKey)
  if (!bound) return null

  const scopedKey = athleteStorageKey(baseKey, bound)
  const scoped = store.getItem(scopedKey)
  if (scoped !== null) return scoped

  const legacy = store.getItem(baseKey)
  if (legacy === null) return null
  const ledger = readLedger(store)
  const adoptionId = `${baseKey}::${bound}`
  if (ledger.quarantinedBlobs.includes(baseKey) || ledger.adopted.includes(adoptionId)) return null

  let owner: string | null = null
  try {
    owner = readRecordOwner(JSON.parse(legacy))
  } catch {
    quarantineBlob(store, baseKey, legacy)
    return null
  }
  if (!owner) {
    quarantineBlob(store, baseKey, legacy)
    return null
  }
  if (owner !== bound) return null

  store.setItem(scopedKey, legacy)
  const nextLedger = readLedger(store)
  if (!nextLedger.adopted.includes(adoptionId)) {
    nextLedger.adopted.push(adoptionId)
    writeLedger(store, nextLedger)
  }
  return legacy
}

export function writeAthleteItem(baseKey: string, value: string): void {
  const store = browserStore()
  if (!store) return
  const key = activeWriteKey(baseKey)
  if (!key) {
    quarantineBlob(store, baseKey, value)
    return
  }
  store.setItem(key, value)
}

export function removeAthleteItem(baseKey: string): void {
  const store = browserStore()
  if (!store) return
  const bound = getBoundAthleteId()
  if (bound === undefined) {
    store.removeItem(baseKey)
    return
  }
  if (!bound) return
  store.removeItem(athleteStorageKey(baseKey, bound))
}

export function readAthleteCollection<T extends OwnedRecord>(baseKey: string): T[] {
  const store = browserStore()
  if (!store) return []
  const bound = getBoundAthleteId()
  if (bound === undefined) return parseArray<T>(store.getItem(baseKey))
  if (!bound) return []

  const scopedKey = athleteStorageKey(baseKey, bound)
  const scoped = parseArray<T>(store.getItem(scopedKey))
  const legacyRaw = store.getItem(baseKey)
  const legacy = parseArray<T>(legacyRaw)
  if (legacyRaw && legacy.length === 0) {
    try {
      const parsed = JSON.parse(legacyRaw) as unknown
      if (!Array.isArray(parsed)) quarantineBlob(store, baseKey, legacyRaw)
    } catch {
      quarantineBlob(store, baseKey, legacyRaw)
    }
  }
  if (legacy.length === 0) return scoped

  const { visible, ownerless } = partitionByOwner(legacy, bound)
  quarantineOwnerlessRecords(store, baseKey, ownerless)
  if (visible.length === 0) return scoped

  const seen = new Set(scoped.map((record) => recordKey(record)))
  let changed = false
  for (const record of visible) {
    const key = recordKey(record)
    if (seen.has(key)) continue
    scoped.push(record)
    seen.add(key)
    changed = true
  }
  if (changed) store.setItem(scopedKey, JSON.stringify(scoped))
  return scoped
}

export function writeAthleteCollection(baseKey: string, records: unknown[]): void {
  const store = browserStore()
  if (!store) return
  const key = activeWriteKey(baseKey)
  if (!key) {
    quarantineOwnerlessRecords(store, baseKey, records)
    return
  }
  store.setItem(key, JSON.stringify(records))
}

export function quarantinedRecordCount(baseKey: string): number {
  const store = browserStore()
  if (!store) return 0
  const records = readQuarantine(store).records[baseKey]
  return Array.isArray(records) ? records.length : 0
}

export function hasQuarantinedBlob(baseKey: string): boolean {
  const store = browserStore()
  if (!store) return false
  return readQuarantine(store).blobs[baseKey] !== undefined
}

/**
 * Copy quarantined ownerless records into one athlete's store.
 * This is not called on sign-in. The quarantine copy and the legacy key stay.
 */
export function recoverQuarantinedRecords(baseKey: string, userId: string): number {
  const store = browserStore()
  if (!store || !userId) return 0
  const records = readQuarantine(store).records[baseKey]
  if (!Array.isArray(records) || records.length === 0) return 0
  const scopedKey = athleteStorageKey(baseKey, userId)
  const existing = parseArray<OwnedRecord>(store.getItem(scopedKey))
  const seen = new Set(existing.map((record) => recordKey(record)))
  let added = 0
  for (const record of records) {
    if (!record || typeof record !== 'object') continue
    const stamped: OwnedRecord = { ...(record as OwnedRecord), ownerUserId: userId }
    const key = recordKey(stamped)
    if (seen.has(key)) continue
    existing.push(stamped)
    seen.add(key)
    added += 1
  }
  if (added > 0) store.setItem(scopedKey, JSON.stringify(existing))
  return added
}

/** Copy a quarantined blob into one athlete's key without removing the archive. */
export function recoverQuarantinedBlob(baseKey: string, userId: string): boolean {
  const store = browserStore()
  if (!store || !userId) return false
  const raw = readQuarantine(store).blobs[baseKey]
  if (raw === undefined) return false
  const scopedKey = athleteStorageKey(baseKey, userId)
  if (store.getItem(scopedKey) !== null) return false
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      store.setItem(scopedKey, JSON.stringify({ ...(parsed as Record<string, unknown>), ownerUserId: userId }))
      return true
    }
  } catch {
    return false
  }
  store.setItem(scopedKey, raw)
  return true
}

export function lookupOccurrenceOwner(occurrenceId: string): string | 'ownerless' | null {
  const store = browserStore()
  if (!store || !occurrenceId) return null
  const bases = ['spartanlab_workout_occurrence', 'spartanlab_workout_logs']
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index)
    if (!key) continue
    const base = bases.find((candidate) => key === candidate || key.startsWith(`${candidate}::athlete::`))
    if (!base) continue
    const raw = store.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as unknown
      if (base === 'spartanlab_workout_occurrence') {
        const occurrence = parsed as { occurrenceId?: unknown; ownerUserId?: unknown }
        if (occurrence?.occurrenceId !== occurrenceId) continue
        return typeof occurrence.ownerUserId === 'string' && occurrence.ownerUserId
          ? occurrence.ownerUserId
          : 'ownerless'
      }
      if (!Array.isArray(parsed)) continue
      for (const entry of parsed) {
        if (!entry || typeof entry !== 'object') continue
        const log = entry as { occurrenceId?: unknown; ownerUserId?: unknown }
        if (log.occurrenceId !== occurrenceId) continue
        return typeof log.ownerUserId === 'string' && log.ownerUserId ? log.ownerUserId : 'ownerless'
      }
    } catch {
      continue
    }
  }
  return null
}

export function writePendingHistoryRetry<T extends { userId: string; clientSessionId: string }>(
  record: PendingHistoryRetryRecord<T>,
): void {
  if (!record.ownerUserId || record.payload.userId !== record.ownerUserId) return
  if (record.payload.clientSessionId !== record.occurrenceId) return
  if (getBoundAthleteId() !== record.ownerUserId) return
  writeAthleteItem(HISTORY_RETRY_KEY, JSON.stringify(record))
}

export function readPendingHistoryRetry<T extends { userId: string; clientSessionId: string }>(
  userId: string | null | undefined,
): PendingHistoryRetryRecord<T> | null {
  if (!userId) return null
  const bound = getBoundAthleteId()
  if (typeof bound === 'string' && bound !== userId) return null
  if (bound === null) return null
  const raw = readAthleteItem(HISTORY_RETRY_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingHistoryRetryRecord<T>
    if (!parsed || parsed.ownerUserId !== userId) return null
    if (!parsed.payload || parsed.payload.userId !== userId) return null
    if (parsed.payload.clientSessionId !== parsed.occurrenceId) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPendingHistoryRetry(userId: string): void {
  const bound = getBoundAthleteId()
  if (typeof bound === 'string' && bound !== userId) return
  if (bound === null) return
  removeAthleteItem(HISTORY_RETRY_KEY)
}
