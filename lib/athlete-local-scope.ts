/**
 * Browser-local athlete isolation.
 *
 * Clerk's signed-in user id is the only identity this module accepts. It is
 * set by the authenticated app shell. Request bodies are not an identity
 * source, and server routes keep resolving the Clerk session themselves.
 *
 * In the browser this module starts sealed. Reads, writes, retries, and
 * programming snapshots return nothing until Clerk binds a user id. A sealed
 * browser never falls back to the shared legacy key.
 *
 * Tests that load this module without a window, or that call
 * allowUnboundLegacyLocalStorage(), still use the legacy key. That path is
 * not used for a signed-in or transitioning account.
 *
 * After a bind, reads and writes use a per-athlete key. Records that already
 * name that athlete are copied across. Records with no owner are copied into
 * quarantine and are not shown. The original bytes stay where they were.
 * Ownerless records move into an account only when that signed-in athlete
 * confirms claimLegacyLocalData(). One confirmation locks the claim.
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
  /** Set when one signed-in athlete confirms recovery. Other accounts cannot claim. */
  claimedBy?: string
}

/**
 * True after the browser module starts, or after sealLegacyLocalStorage().
 * While sealed, an unbound scope cannot read or write the shared keys.
 */
let legacySealed = false

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
  if (legacySealed) {
    athleteScope = { status: 'bound', userId: null }
    return
  }
  athleteScope = { status: 'unbound' }
}

/** Close the shared-key fallback and block storage until a user id is bound. */
export function sealLegacyLocalStorage(): void {
  legacySealed = true
  if (typeof window === 'undefined') return
  if (athleteScope.status === 'unbound') {
    athleteScope = { status: 'bound', userId: null }
  }
}

/**
 * Re-open the pre-auth shared key. Profile tests use this. The signed-in app
 * does not.
 */
export function allowUnboundLegacyLocalStorage(): void {
  legacySealed = false
  athleteScope = { status: 'unbound' }
}

export function legacyLocalStorageOpen(): boolean {
  return !legacySealed && athleteScope.status === 'unbound'
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
  if (legacyLocalStorageOpen()) return baseKeys.includes(eventKey)
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
    const owner = readRecordOwner(record)
    if (!owner) ownerless.push(record)
    else if (owner === userId) visible.push(record)
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
      claimedBy: typeof parsed.claimedBy === 'string' && parsed.claimedBy ? parsed.claimedBy : undefined,
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
  if (bound === undefined) return legacyLocalStorageOpen() ? baseKey : null
  if (!bound) return null
  return athleteStorageKey(baseKey, bound)
}

export function readAthleteItem(baseKey: string): string | null {
  const store = browserStore()
  if (!store) return null
  const bound = getBoundAthleteId()
  if (bound === undefined) return legacyLocalStorageOpen() ? store.getItem(baseKey) : null
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
    if (legacyLocalStorageOpen()) store.removeItem(baseKey)
    return
  }
  if (!bound) return
  store.removeItem(athleteStorageKey(baseKey, bound))
}

export function readAthleteCollection<T extends OwnedRecord>(baseKey: string): T[] {
  const store = browserStore()
  if (!store) return []
  const bound = getBoundAthleteId()
  if (bound === undefined) return legacyLocalStorageOpen() ? parseArray<T>(store.getItem(baseKey)) : []
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
function claimAllowed(userId: string): boolean {
  if (!userId || getBoundAthleteId() !== userId) return false
  const store = browserStore()
  if (!store) return false
  const claimedBy = readLedger(store).claimedBy
  return !claimedBy || claimedBy === userId
}

export function recoverQuarantinedRecords(baseKey: string, userId: string): number {
  const store = browserStore()
  if (!store || !claimAllowed(userId)) return 0
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
  if (!store || !claimAllowed(userId)) return false
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

const LEGACY_RECOVERY_KEYS = {
  workouts: [
    'spartanlab_workout_logs',
    'spartanlab_skill_sessions',
    'spartanlab_strength_records',
    'spartanlab_session_feedback',
    'spartanlab_progressions',
    'spartanlab_override_signals',
  ],
  profiles: [
    'spartanlab_profile',
    'spartanlab_onboarding_profile',
    'spartanlab_canonical_profile',
    'spartanlab_onboarding_complete',
  ],
  programs: [
    'spartanlab_active_program',
    'spartanlab_adaptive_program',
    'spartanlab_adaptive_programs',
    'spartanlab_first_program',
    'spartanlab_programs',
  ],
} as const

const DERIVED_RECOVERY_KEYS = [
  'spartanlab_rpe_sessions',
  'spartanlab_fatigue_history',
  'spartanlab_fatigue_patterns',
  'spartanlab_consistency_data',
  'spartanlab_l2_recovery_checkin',
] as const

export interface LegacyRecoveryCounts {
  workouts: number
  profiles: number
  programs: number
}

function parseStoredRaw(raw: string | null): unknown {
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function countOwnerlessValue(parsed: unknown): number {
  if (Array.isArray(parsed)) {
    return parsed.filter((record) => record && typeof record === 'object' && !readRecordOwner(record)).length
  }
  if (parsed && typeof parsed === 'object') return readRecordOwner(parsed) ? 0 : 1
  if (typeof parsed === 'string' || typeof parsed === 'boolean' || typeof parsed === 'number') return 1
  return 0
}

/** Counts of ownerless legacy records. No note text, names, or emails. */
export function describeLegacyRecovery(): LegacyRecoveryCounts {
  const empty = { workouts: 0, profiles: 0, programs: 0 }
  const store = browserStore()
  const bound = getBoundAthleteId()
  if (!store || typeof bound !== 'string') return empty
  const claimedBy = readLedger(store).claimedBy
  if (claimedBy) return empty
  const counts = { ...empty }
  const quarantine = readQuarantine(store)
  for (const group of ['workouts', 'profiles', 'programs'] as const) {
    const keys = group === 'workouts'
      ? [...LEGACY_RECOVERY_KEYS.workouts, ...DERIVED_RECOVERY_KEYS]
      : LEGACY_RECOVERY_KEYS[group]
    for (const key of keys) {
      const raw = store.getItem(key)
      if (raw !== null) {
        counts[group] += countOwnerlessValue(parseStoredRaw(raw))
        continue
      }
      if (quarantine.blobs[key] !== undefined) {
        counts[group] += countOwnerlessValue(parseStoredRaw(quarantine.blobs[key]))
      }
      const records = quarantine.records[key]
      if (Array.isArray(records)) {
        counts[group] += records.filter((record) => record && typeof record === 'object' && !readRecordOwner(record)).length
      }
    }
  }
  return counts
}

function claimStoredKey(store: Storage, baseKey: string, userId: string): number {
  const legacyRaw = store.getItem(baseKey)
  const quarantine = readQuarantine(store)
  const raw = legacyRaw !== null ? legacyRaw : (quarantine.blobs[baseKey] ?? null)
  const extraRecords = Array.isArray(quarantine.records[baseKey]) ? quarantine.records[baseKey] : []
  if (raw === null && extraRecords.length === 0) return 0
  const parsed = raw !== null ? parseStoredRaw(raw) : null
  const scopedKey = athleteStorageKey(baseKey, userId)

  if (Array.isArray(parsed) || extraRecords.length > 0) {
    const pool = [...(Array.isArray(parsed) ? parsed : []), ...extraRecords]
    const existing = parseArray<OwnedRecord>(store.getItem(scopedKey))
    const seen = new Set(existing.map((record) => recordKey(record)))
    let added = 0
    for (const record of pool) {
      if (!record || typeof record !== 'object') continue
      const owner = readRecordOwner(record)
      if (owner && owner !== userId) continue
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

  if (store.getItem(scopedKey) !== null) return 0
  if (parsed && typeof parsed === 'object') {
    const owner = readRecordOwner(parsed)
    if (owner && owner !== userId) return 0
    store.setItem(scopedKey, JSON.stringify({ ...(parsed as Record<string, unknown>), ownerUserId: userId }))
    return 1
  }
  if (raw !== null && (typeof parsed === 'boolean' || typeof parsed === 'string' || typeof parsed === 'number')) {
    store.setItem(scopedKey, raw)
    return 1
  }
  return 0
}

/**
 * Copy ownerless legacy workouts, profiles, and programs into the signed-in
 * athlete's keys. The athlete must already be bound. Originals stay in place.
 * A second account cannot claim after this succeeds.
 */
export function claimLegacyLocalData(): boolean {
  const store = browserStore()
  const userId = getBoundAthleteId()
  if (!store || typeof userId !== 'string' || !claimAllowed(userId)) return false
  const pending = describeLegacyRecovery()
  if (pending.workouts + pending.profiles + pending.programs === 0) return false
  const keys = [
    ...LEGACY_RECOVERY_KEYS.workouts,
    ...DERIVED_RECOVERY_KEYS,
    ...LEGACY_RECOVERY_KEYS.profiles,
    ...LEGACY_RECOVERY_KEYS.programs,
  ]
  for (const key of keys) claimStoredKey(store, key, userId)
  const ledger = readLedger(store)
  ledger.claimedBy = userId
  writeLedger(store, ledger)
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
  if (!userId || getBoundAthleteId() !== userId) return null
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
  if (getBoundAthleteId() !== userId) return
  removeAthleteItem(HISTORY_RETRY_KEY)
}

export const RECOVERY_ADJUSTMENT_STORAGE_KEY = 'spartanlab_recovery_adjustment_applied'

/**
 * Current-session set, RPE, and rest changes. Stored only for the bound
 * Clerk user. An ownerless legacy value stays unread and is not applied.
 */
export function writeRecoveryAdjustmentHandoff(handoff: object): void {
  const owner = getBoundAthleteId()
  if (typeof owner !== 'string') return
  writeAthleteItem(
    RECOVERY_ADJUSTMENT_STORAGE_KEY,
    JSON.stringify({ ...handoff, ownerUserId: owner }),
  )
}

export function readRecoveryAdjustmentHandoff<T extends object>(): (T & { ownerUserId: string }) | null {
  const owner = getBoundAthleteId()
  if (typeof owner !== 'string') return null
  const raw = readAthleteItem(RECOVERY_ADJUSTMENT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as T & { ownerUserId?: unknown }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    if (parsed.ownerUserId !== owner) return null
    return parsed as T & { ownerUserId: string }
  } catch {
    return null
  }
}

export function clearRecoveryAdjustmentHandoff(options?: { previewId?: string }): void {
  if (typeof getBoundAthleteId() !== 'string') return
  if (options?.previewId) {
    const current = readRecoveryAdjustmentHandoff<{ previewId?: string }>()
    if (!current || current.previewId !== options.previewId) return
  }
  removeAthleteItem(RECOVERY_ADJUSTMENT_STORAGE_KEY)
}

function boundAthleteStorageOpen(): boolean {
  return typeof getBoundAthleteId() === 'string' || legacyLocalStorageOpen()
}

/** List storage for the bound athlete. Signed-out and Clerk-loading reads stay empty. */
export function readBoundAthleteList<T>(baseKey: string): T[] {
  if (!boundAthleteStorageOpen()) return []
  return readAthleteCollection<OwnedRecord>(baseKey) as T[]
}

/** Writes nothing until Clerk has bound a user id, so a loading account cannot touch a shared key. */
export function writeBoundAthleteList(baseKey: string, records: unknown[]): void {
  if (!boundAthleteStorageOpen()) return
  writeAthleteCollection(baseKey, records)
}

export function readBoundAthleteBlob(baseKey: string): string | null {
  if (!boundAthleteStorageOpen()) return null
  return readAthleteItem(baseKey)
}

export function writeBoundAthleteBlob(baseKey: string, value: string): void {
  if (!boundAthleteStorageOpen()) return
  writeAthleteItem(baseKey, value)
}

if (typeof window !== 'undefined') {
  sealLegacyLocalStorage()
}
