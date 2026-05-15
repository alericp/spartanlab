/**
 * MASTER-8C.10.2 — Method Slot Occupancy Ledger
 * 
 * A read-only ledger that tracks method ownership for every exercise slot
 * across all sessions in a program. This provides explicit visibility into:
 * - Which slots are available for new methods
 * - Which slots are occupied and by what
 * - Why certain slots are blocked
 * 
 * This is consumed by the slot eligibility planner and frequency preview
 * to provide accurate capacity counts and detailed blocked reasons.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Kind of method occupancy
 */
export type MethodOccupancyKind =
  | 'none'
  | 'row_level_method'
  | 'grouped_structure'
  | 'session_structure'

/**
 * Availability status for a slot
 */
export type MethodSlotAvailability =
  | 'available'
  | 'available_with_caution'
  | 'occupied_row_method'
  | 'occupied_grouped_method'
  | 'blocked_warmup_cooldown'
  | 'blocked_synthetic'
  | 'blocked_primary_skill'

/**
 * Detailed block reason for a slot
 */
export interface MethodSlotBlockReason {
  readonly code: string
  readonly label: string
  readonly ownerMethodKey?: string
  readonly evidence?: string
}

/**
 * Per-exercise slot occupancy information
 */
export interface ExerciseMethodSlotOccupancy {
  readonly rowIndex: number
  readonly exerciseId: string
  readonly exerciseName: string
  readonly sessionId: string
  readonly sessionIndex: number
  readonly dayNumber: number
  
  // Classification flags
  readonly isTrainingRow: boolean
  readonly isWarmupOrCooldown: boolean
  readonly isSyntheticArtifact: boolean
  readonly isPrimarySkill: boolean
  
  // Ownership state
  readonly occupancyKind: MethodOccupancyKind
  readonly isGroupedOwned: boolean
  readonly groupedOwnerMethodKey: string | null
  readonly groupedOwnerId: string | null
  readonly isRowMethodOwned: boolean
  readonly rowOwnerMethodKey: string | null
  readonly rowOwnerSetExecutionMethod: string | null
  // [MASTER-8C.10.3] Invalid overlap tracking
  readonly hasInvalidOverlap: boolean
  
  // Availability
  readonly availability: MethodSlotAvailability
  readonly isAvailableForNewRowMethod: boolean
  readonly isAvailableForGroupedMethod: boolean
  
  // Reasons
  readonly hardBlockedReasons: readonly MethodSlotBlockReason[]
  readonly cautionReasons: readonly MethodSlotBlockReason[]
  readonly evidence: readonly string[]
}

/**
 * Per-session slot ledger
 */
export interface SessionMethodSlotLedger {
  readonly sessionId: string
  readonly sessionIndex: number
  readonly dayNumber: number
  readonly sessionLabel: string
  
  // Slot counts
  readonly totalExerciseCount: number
  readonly trainingRowCount: number
  readonly availableForRowMethodCount: number
  readonly availableForGroupedMethodCount: number
  readonly occupiedByRowMethodCount: number
  readonly occupiedByGroupedMethodCount: number
  readonly blockedWarmupCooldownCount: number
  readonly blockedSyntheticCount: number
  readonly blockedPrimarySkillCount: number
  // [MASTER-8C.10.3] Invalid overlap tracking
  readonly invalidOverlapCount: number
  
  // Grouped method summary
  readonly hasGroupedMethods: boolean
  readonly groupedMethodTypes: readonly string[]
  
  // Per-exercise detail
  readonly slots: readonly ExerciseMethodSlotOccupancy[]
  
  // Summary evidence
  readonly capacityProofLines: readonly string[]
}

/**
 * Full program slot occupancy ledger
 */
export interface MethodSlotOccupancyLedger {
  readonly sessionCount: number
  readonly totalTrainingRowCount: number
  readonly totalAvailableForRowMethodCount: number
  readonly totalOccupiedByRowMethodCount: number
  readonly totalOccupiedByGroupedMethodCount: number
  readonly totalBlockedCount: number
  // [MASTER-8C.10.3] Invalid overlap tracking
  readonly totalInvalidOverlapCount: number
  
  // Per-session ledgers
  readonly sessions: readonly SessionMethodSlotLedger[]
  
  // Summary
  readonly capacityProofLines: readonly string[]
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Normalizes a method family key to a canonical form
 */
function normalizeMethodKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.toLowerCase().trim().replace(/[\s_-]+/g, '_')
  if (normalized.length === 0) return null
  return normalized
}

/**
 * Normalizes an exercise name for comparison
 */
function normalizeExerciseName(value: unknown): string {
  if (typeof value === 'string') {
    return value.toLowerCase().trim().replace(/[\s_-]+/g, '_')
  }
  return ''
}

/**
 * Checks if an exercise is a warmup, cooldown, prehab, or mobility row
 */
function isWarmupCooldownRow(exercise: Record<string, unknown>): boolean {
  return (
    exercise.isWarmup === true ||
    exercise.isCooldown === true ||
    exercise.isPrehab === true ||
    exercise.isMobility === true ||
    exercise.category === 'warmup' ||
    exercise.category === 'cooldown' ||
    exercise.type === 'warmup' ||
    exercise.type === 'cooldown'
  )
}

/**
 * Checks if exercise is a synthetic artifact (like fake conditioning finisher)
 */
function isSyntheticArtifact(exercise: Record<string, unknown>): boolean {
  return (
    exercise.isSyntheticArtifact === true ||
    exercise.isPlaceholder === true ||
    exercise.syntheticFinisher === true ||
    (typeof exercise.id === 'string' && exercise.id.includes('synthetic'))
  )
}

/**
 * Checks if exercise is a primary skill row
 */
function isPrimarySkillRow(exercise: Record<string, unknown>): boolean {
  return (
    exercise.isPrimarySkill === true ||
    exercise.isPrimary === true ||
    exercise.category === 'primary' ||
    exercise.skillPriority === 'primary'
  )
}

// =============================================================================
// LEDGER BUILDERS
// =============================================================================

/**
 * Builds a slot occupancy entry for a single exercise
 */
function buildExerciseSlotOccupancy(
  exercise: Record<string, unknown>,
  rowIndex: number,
  sessionId: string,
  sessionIndex: number,
  dayNumber: number,
  groupedMemberIds: Set<string>,
  groupedMemberNames: Set<string>,
  groupedMethodTypes: string[]
): ExerciseMethodSlotOccupancy {
  const exerciseId = typeof exercise.id === 'string' ? exercise.id : `row-${rowIndex}`
  const exerciseName = typeof exercise.name === 'string' ? exercise.name : 'Unknown Exercise'
  const normalizedName = normalizeExerciseName(exerciseName)
  
  const hardBlockedReasons: MethodSlotBlockReason[] = []
  const cautionReasons: MethodSlotBlockReason[] = []
  const evidence: string[] = []
  
  // Classification
  const isWarmupOrCooldown = isWarmupCooldownRow(exercise)
  const isSynthetic = isSyntheticArtifact(exercise)
  const isPrimarySkill = isPrimarySkillRow(exercise)
  const isTrainingRow = !isWarmupOrCooldown && !isSynthetic
  
  // Check grouped method ownership
  const isInGroupedById = groupedMemberIds.has(exerciseId)
  const isInGroupedByName = normalizedName.length > 0 && groupedMemberNames.has(normalizedName)
  const isGroupedOwned = isInGroupedById || isInGroupedByName
  const groupedOwnerMethodKey = isGroupedOwned ? (groupedMethodTypes[0] ?? 'grouped_method') : null
  const groupedOwnerId = isGroupedOwned ? (exercise.styledGroupId as string | undefined) ?? null : null
  
  if (isGroupedOwned) {
    evidence.push(`Owned by ${groupedOwnerMethodKey} (grouped structure)`)
  }
  
  // Check exercise-level styled group
  if (typeof exercise.styledGroupId === 'string' && exercise.styledGroupId.length > 0 && !isGroupedOwned) {
    evidence.push(`Has styledGroupId: ${exercise.styledGroupId}`)
  }
  
  // [MASTER-8C.10.3] STRICT row-level method ownership detection
  // Only these are authoritative row execution methods:
  const SUPPORTED_ROW_EXECUTION_METHODS = new Set([
    'top_set', 'top_sets', 'topset',
    'drop_set', 'drop_sets', 'dropset',
    'rest_pause', 'rest-pause', 'restpause',
    'cluster', 'cluster_set', 'cluster_sets',
    'backoff_set', 'backoff_sets', 'backoff',
    'myo_reps', 'myoreps',
  ])
  
  // Normalize a value to check if it's a supported row method
  const normalizeForMethodCheck = (val: unknown): string | null => {
    if (typeof val !== 'string' || !val) return null
    return val.toLowerCase().trim().replace(/[\s-]+/g, '_')
  }
  
  const setExecutionMethod = normalizeForMethodCheck(exercise.setExecutionMethod)
  const methodOverrideApplied = exercise.methodOverrideApplied === true
  const methodOverrideMethodKey = normalizeForMethodCheck(exercise.methodOverrideMethodKey)
  
  // Check if setExecutionMethod is a SUPPORTED row method (not generic labels)
  const isSetExecutionMethodSupported = setExecutionMethod !== null && 
    setExecutionMethod !== 'standard' && 
    setExecutionMethod !== 'straight_sets' &&
    SUPPORTED_ROW_EXECUTION_METHODS.has(setExecutionMethod)
  
  // Check if methodOverrideMethodKey is a SUPPORTED row method
  const isMethodOverrideKeySupported = methodOverrideMethodKey !== null &&
    SUPPORTED_ROW_EXECUTION_METHODS.has(methodOverrideMethodKey)
  
  // [MASTER-8C.10.3] A row is ONLY method-owned if there's actual override evidence:
  // 1. methodOverrideApplied === true, OR
  // 2. setExecutionMethod is one of the supported row execution methods, OR
  // 3. methodOverrideMethodKey is one of the supported row method keys
  // 
  // Generic training labels like trainingMethod: "max_strength", methodFamily: "push",
  // appliedMethod without override evidence do NOT count as row-method ownership.
  const isRowMethodOwned = methodOverrideApplied || isSetExecutionMethodSupported || isMethodOverrideKeySupported
  
  // Determine the owning method key
  let rowOwnerMethodKey: string | null = null
  let rowOwnerSetExecutionMethod: string | null = null
  if (isRowMethodOwned) {
    rowOwnerMethodKey = methodOverrideMethodKey ?? (isSetExecutionMethodSupported ? setExecutionMethod : null)
    rowOwnerSetExecutionMethod = isSetExecutionMethodSupported ? setExecutionMethod : null
  }
  
  if (isRowMethodOwned) {
    evidence.push(`Row method: ${rowOwnerMethodKey ?? 'override_applied'}`)
  }
  
  // [MASTER-8C.10.3] Invalid overlap detection: row-method inside grouped structure
  const hasInvalidOverlap = isGroupedOwned && (methodOverrideApplied || isSetExecutionMethodSupported || isMethodOverrideKeySupported)
  if (hasInvalidOverlap) {
    evidence.push(`INVALID OVERLAP: row-level ${rowOwnerMethodKey ?? 'method'} inside grouped ${groupedOwnerMethodKey}`)
  }
  
  // Determine occupancy kind
  let occupancyKind: MethodOccupancyKind = 'none'
  if (isGroupedOwned) {
    occupancyKind = 'grouped_structure'
  } else if (isRowMethodOwned) {
    occupancyKind = 'row_level_method'
  }
  
  // Build block reasons
  if (isWarmupOrCooldown) {
    hardBlockedReasons.push({ code: 'warmup_cooldown', label: 'Warmup/cooldown row' })
  }
  if (isSynthetic) {
    hardBlockedReasons.push({ code: 'synthetic', label: 'Synthetic/placeholder row' })
  }
  if (isGroupedOwned) {
    hardBlockedReasons.push({ 
      code: 'grouped_owned', 
      label: `Owned by ${groupedOwnerMethodKey}`,
      ownerMethodKey: groupedOwnerMethodKey ?? undefined,
    })
  }
  if (isRowMethodOwned) {
    hardBlockedReasons.push({ 
      code: 'row_method_owned', 
      label: `Has ${rowOwnerMethodKey} applied`,
      ownerMethodKey: rowOwnerMethodKey ?? undefined,
    })
  }
  if (isPrimarySkill && !isGroupedOwned && !isRowMethodOwned) {
    cautionReasons.push({ code: 'primary_skill', label: 'Primary skill exercise' })
  }
  
  // Determine availability
  let availability: MethodSlotAvailability = 'available'
  let isAvailableForNewRowMethod = true
  let isAvailableForGroupedMethod = true
  
  if (isWarmupOrCooldown) {
    availability = 'blocked_warmup_cooldown'
    isAvailableForNewRowMethod = false
    isAvailableForGroupedMethod = false
  } else if (isSynthetic) {
    availability = 'blocked_synthetic'
    isAvailableForNewRowMethod = false
    isAvailableForGroupedMethod = false
  } else if (isGroupedOwned) {
    availability = 'occupied_grouped_method'
    isAvailableForNewRowMethod = false
    isAvailableForGroupedMethod = false
  } else if (isRowMethodOwned) {
    availability = 'occupied_row_method'
    isAvailableForNewRowMethod = false
    isAvailableForGroupedMethod = true // Grouped methods can potentially include row-method rows
  } else if (isPrimarySkill) {
    availability = 'available_with_caution'
    // Still available but with caution
  }
  
  return {
    rowIndex,
    exerciseId,
    exerciseName,
    sessionId,
    sessionIndex,
    dayNumber,
    isTrainingRow,
    isWarmupOrCooldown,
    isSyntheticArtifact: isSynthetic,
    isPrimarySkill,
    occupancyKind,
    isGroupedOwned,
    groupedOwnerMethodKey,
    groupedOwnerId,
    isRowMethodOwned,
    rowOwnerMethodKey,
    rowOwnerSetExecutionMethod,
    hasInvalidOverlap,
    availability,
    isAvailableForNewRowMethod,
    isAvailableForGroupedMethod,
    hardBlockedReasons,
    cautionReasons,
    evidence,
  }
}

/**
 * Collects grouped method member information from session structures
 */
function collectGroupedMethodMembers(session: Record<string, unknown>): {
  groupedMemberIds: Set<string>
  groupedMemberNames: Set<string>
  groupedMethodTypes: string[]
} {
  const groupedMemberIds = new Set<string>()
  const groupedMemberNames = new Set<string>()
  const groupedMethodTypes: string[] = []
  
  // Helper to process a group object
  const processGroup = (group: Record<string, unknown>) => {
    const groupType = normalizeMethodKey(group.type) ?? 
                      normalizeMethodKey(group.methodFamily) ?? 
                      normalizeMethodKey(group.groupType)
    if (groupType) {
      groupedMethodTypes.push(groupType)
    }
    
    // Collect member IDs
    const idSources = ['exerciseIds', 'memberIds', 'members']
    for (const source of idSources) {
      if (Array.isArray(group[source])) {
        for (const item of group[source]) {
          if (typeof item === 'string') {
            groupedMemberIds.add(item)
          } else if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>
            if (typeof obj.id === 'string') groupedMemberIds.add(obj.id)
            if (typeof obj.name === 'string') groupedMemberNames.add(normalizeExerciseName(obj.name))
          }
        }
      }
    }
    
    // Process exercises array if present
    if (Array.isArray(group.exercises)) {
      for (const ex of group.exercises) {
        if (ex && typeof ex === 'object') {
          const exObj = ex as Record<string, unknown>
          if (typeof exObj.id === 'string') groupedMemberIds.add(exObj.id)
          if (typeof exObj.name === 'string') groupedMemberNames.add(normalizeExerciseName(exObj.name))
        }
      }
    }
  }
  
  // Check session.styledGroups
  if (Array.isArray(session.styledGroups)) {
    for (const group of session.styledGroups) {
      if (group && typeof group === 'object') {
        processGroup(group as Record<string, unknown>)
      }
    }
  }
  
  // Check session.methodStructures
  if (Array.isArray(session.methodStructures)) {
    for (const struct of session.methodStructures) {
      if (struct && typeof struct === 'object') {
        processGroup(struct as Record<string, unknown>)
      }
    }
  }
  
  // Check session.styleMetadata.styledGroups
  const styleMetadata = session.styleMetadata as Record<string, unknown> | undefined
  if (styleMetadata && Array.isArray(styleMetadata.styledGroups)) {
    for (const group of styleMetadata.styledGroups) {
      if (group && typeof group === 'object') {
        processGroup(group as Record<string, unknown>)
      }
    }
  }
  
  return { groupedMemberIds, groupedMemberNames, groupedMethodTypes }
}

/**
 * Builds a slot ledger for a single session
 */
export function buildSessionMethodSlotLedger(
  session: Record<string, unknown>,
  sessionIndex: number
): SessionMethodSlotLedger {
  const sessionId = typeof session.id === 'string' ? session.id : `session-${sessionIndex}`
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : sessionIndex + 1
  const sessionLabel = `Day ${dayNumber}`
  
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  const { groupedMemberIds, groupedMemberNames, groupedMethodTypes } = collectGroupedMethodMembers(session)
  
  const slots: ExerciseMethodSlotOccupancy[] = []
  
  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i]
    if (!exercise || typeof exercise !== 'object') continue
    
    const slot = buildExerciseSlotOccupancy(
      exercise as Record<string, unknown>,
      i,
      sessionId,
      sessionIndex,
      dayNumber,
      groupedMemberIds,
      groupedMemberNames,
      groupedMethodTypes
    )
    slots.push(slot)
  }
  
  // Compute counts
  const totalExerciseCount = slots.length
  const trainingRowCount = slots.filter(s => s.isTrainingRow).length
  const availableForRowMethodCount = slots.filter(s => s.isAvailableForNewRowMethod).length
  const availableForGroupedMethodCount = slots.filter(s => s.isAvailableForGroupedMethod).length
  // [MASTER-8C.10.3] Only count STRICT row method ownership (not generic labels)
  const occupiedByRowMethodCount = slots.filter(s => s.isRowMethodOwned && !s.isGroupedOwned).length
  const occupiedByGroupedMethodCount = slots.filter(s => s.isGroupedOwned).length
  const blockedWarmupCooldownCount = slots.filter(s => s.isWarmupOrCooldown).length
  const blockedSyntheticCount = slots.filter(s => s.isSyntheticArtifact).length
  const blockedPrimarySkillCount = slots.filter(s => s.isPrimarySkill && s.availability === 'available_with_caution').length
  // [MASTER-8C.10.3] Count invalid overlaps
  const invalidOverlapCount = slots.filter(s => s.hasInvalidOverlap).length
  
  // Build capacity proof
  const capacityProofLines: string[] = []
  capacityProofLines.push(`${trainingRowCount} training rows`)
  if (availableForRowMethodCount > 0) {
    capacityProofLines.push(`${availableForRowMethodCount} available for row methods`)
  }
  if (occupiedByRowMethodCount > 0) {
    capacityProofLines.push(`${occupiedByRowMethodCount} occupied by row methods`)
  }
  if (occupiedByGroupedMethodCount > 0) {
    capacityProofLines.push(`${occupiedByGroupedMethodCount} in grouped methods`)
  }
  if (blockedPrimarySkillCount > 0) {
    capacityProofLines.push(`${blockedPrimarySkillCount} primary skill (caution)`)
  }
  
  return {
    sessionId,
    sessionIndex,
    dayNumber,
    sessionLabel,
    totalExerciseCount,
    trainingRowCount,
    availableForRowMethodCount,
    availableForGroupedMethodCount,
    occupiedByRowMethodCount,
    occupiedByGroupedMethodCount,
    blockedWarmupCooldownCount,
    blockedSyntheticCount,
    blockedPrimarySkillCount,
    invalidOverlapCount,
    hasGroupedMethods: groupedMethodTypes.length > 0,
    groupedMethodTypes,
    slots,
    capacityProofLines,
  }
}

/**
 * Builds a complete method slot occupancy ledger for the program
 */
export function buildMethodSlotOccupancyLedger(
  programOrSessions: unknown
): MethodSlotOccupancyLedger {
  // Extract sessions from program or use directly if array
  let sessions: unknown[] = []
  if (Array.isArray(programOrSessions)) {
    sessions = programOrSessions
  } else if (programOrSessions && typeof programOrSessions === 'object') {
    const prog = programOrSessions as Record<string, unknown>
    if (Array.isArray(prog.sessions)) {
      sessions = prog.sessions
    }
  }
  
  const sessionLedgers: SessionMethodSlotLedger[] = []
  
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i]
    if (!session || typeof session !== 'object') continue
    
    const ledger = buildSessionMethodSlotLedger(session as Record<string, unknown>, i)
    sessionLedgers.push(ledger)
  }
  
  // Compute totals
  const sessionCount = sessionLedgers.length
  const totalTrainingRowCount = sessionLedgers.reduce((sum, s) => sum + s.trainingRowCount, 0)
  const totalAvailableForRowMethodCount = sessionLedgers.reduce((sum, s) => sum + s.availableForRowMethodCount, 0)
  const totalOccupiedByRowMethodCount = sessionLedgers.reduce((sum, s) => sum + s.occupiedByRowMethodCount, 0)
  const totalOccupiedByGroupedMethodCount = sessionLedgers.reduce((sum, s) => sum + s.occupiedByGroupedMethodCount, 0)
  const totalBlockedCount = sessionLedgers.reduce((sum, s) =>
    sum + s.blockedWarmupCooldownCount + s.blockedSyntheticCount, 0)
  // [MASTER-8C.10.3] Count invalid overlaps across all sessions
  const totalInvalidOverlapCount = sessionLedgers.reduce((sum, s) => sum + s.invalidOverlapCount, 0)
  
  // Build summary proof
  const capacityProofLines: string[] = []
  capacityProofLines.push(`${sessionCount} sessions · ${totalTrainingRowCount} training rows`)
  capacityProofLines.push(`${totalAvailableForRowMethodCount} available for row methods`)
  if (totalOccupiedByRowMethodCount > 0) {
    capacityProofLines.push(`${totalOccupiedByRowMethodCount} occupied by row methods`)
  }
  if (totalOccupiedByGroupedMethodCount > 0) {
    capacityProofLines.push(`${totalOccupiedByGroupedMethodCount} in grouped methods`)
  }
  // [MASTER-8C.10.3] Report invalid overlaps in summary
  if (totalInvalidOverlapCount > 0) {
    capacityProofLines.push(`${totalInvalidOverlapCount} invalid overlap(s) detected`)
  }
  
  return {
    sessionCount,
    totalTrainingRowCount,
    totalAvailableForRowMethodCount,
    totalOccupiedByRowMethodCount,
    totalOccupiedByGroupedMethodCount,
    totalBlockedCount,
    totalInvalidOverlapCount,
    sessions: sessionLedgers,
    capacityProofLines,
  }
}

/**
 * Gets the occupancy info for a specific exercise
 */
export function getExerciseMethodOccupancy(
  ledger: MethodSlotOccupancyLedger,
  sessionIndex: number,
  exerciseId: string
): ExerciseMethodSlotOccupancy | null {
  const sessionLedger = ledger.sessions[sessionIndex]
  if (!sessionLedger) return null
  
  return sessionLedger.slots.find(s => s.exerciseId === exerciseId) ?? null
}

/**
 * Counts sessions with at least one available slot for row-level methods
 */
export function countSessionsWithAvailableRowMethodSlots(ledger: MethodSlotOccupancyLedger): number {
  return ledger.sessions.filter(s => s.availableForRowMethodCount > 0).length
}

/**
 * Builds a compact capacity summary string
 */
export function buildCapacitySummary(ledger: MethodSlotOccupancyLedger): string {
  const availableSessions = countSessionsWithAvailableRowMethodSlots(ledger)
  const availableRows = ledger.totalAvailableForRowMethodCount
  
  if (availableRows === 0) {
    if (ledger.totalOccupiedByRowMethodCount > 0 || ledger.totalOccupiedByGroupedMethodCount > 0) {
      return `0 free rows: all occupied by saved methods`
    }
    return `0 free rows in current program`
  }
  
  return `${availableSessions} free days · ${availableRows} free rows`
}

/**
 * Builds detailed blocked reason for a specific method type
 */
export function buildMethodBlockedReason(
  ledger: MethodSlotOccupancyLedger,
  methodKey: string
): string {
  const availableRows = ledger.totalAvailableForRowMethodCount
  const occupiedByRow = ledger.totalOccupiedByRowMethodCount
  const occupiedByGrouped = ledger.totalOccupiedByGroupedMethodCount
  
  if (availableRows === 0) {
    const parts: string[] = []
    if (occupiedByRow > 0) {
      parts.push(`${occupiedByRow} occupied by row methods`)
    }
    if (occupiedByGrouped > 0) {
      parts.push(`${occupiedByGrouped} in grouped structures`)
    }
    if (parts.length > 0) {
      return `No free rows: ${parts.join(', ')}`
    }
    return `No compatible training rows found`
  }
  
  // Method-specific reasons
  if (methodKey === 'density_block') {
    return 'Timed-window logging model required'
  }
  if (methodKey === 'superset') {
    return 'Superset structural writer not implemented'
  }
  if (methodKey === 'endurance_density' || methodKey === 'conditioning') {
    return 'Real modality/exercise prescription required'
  }
  if (methodKey === 'circuit') {
    return 'Use existing Method Planner for circuit application'
  }
  
  return `No safe slots found for ${methodKey}`
}
