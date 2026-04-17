/**
 * Session Group Display Adapter
 * 
 * A pure, read-only display adapter that converts session grouped truth
 * into a stable UI model for rendering. This is NOT a builder - it only
 * normalizes already-present truth for display purposes.
 * 
 * Priority order for grouped truth:
 * 1. styleMetadata.styledGroups (authoritative from builder)
 * 2. Direct exercise blockId/method fields (fallback)
 */

// Types matching what the builder produces
export type GroupType = 'straight' | 'superset' | 'circuit' | 'density_block' | 'cluster'

export interface DisplayGroupExercise {
  id: string
  name: string
  methodLabel?: string
  prefix?: string  // [GROUPED-RENDER-FIX] Exercise label like A1, B1, etc.
  methodRationale?: string  // [GROUPED-RENDER-FIX] Why this exercise is in this group
}

export interface DisplayGroup {
  id: string
  groupType: GroupType
  label: string
  exercises: DisplayGroupExercise[]
  instruction?: string
  restProtocol?: string  // [GROUPED-RENDER-FIX] Rest instructions for this group
}

// [GROUPED-RENDER-CONTRACT] Explicit verdict codes so the card can state, in one
// place, exactly which upstream source produced the visible grouped model and,
// when grouped rendering is NOT possible, exactly why. These values are
// consumed by AdaptiveSessionCard's single authoritative groupedRenderContract.
export type GroupedSourceUsed = 'styledGroups' | 'exerciseFallback' | 'none'
export type GroupedFlatReason =
  | null
  | 'NO_STYLE_METADATA_AND_NO_EXERCISE_METHOD_TRUTH'
  | 'STYLED_GROUPS_PRESENT_BUT_ALL_STRAIGHT_AND_NO_EXERCISE_METHOD_TRUTH'
  | 'STYLED_GROUPS_PRESENT_BUT_UNUSABLE_AND_NO_EXERCISE_METHOD_TRUTH'
  | 'EXERCISE_METHOD_TRUTH_PRESENT_BUT_INSUFFICIENT_MEMBERS'

export interface GroupedDisplayModel {
  hasGroups: boolean
  totalGroupCount: number
  nonStraightGroupCount: number
  supersetCount: number
  circuitCount: number
  densityCount: number
  clusterCount: number
  groups: DisplayGroup[]
  methodSummary: string | null
  // [GROUPED-RENDER-CONTRACT] Which source produced the renderable groups.
  // 'styledGroups'     = Priority 1 (builder's authoritative styledGroups)
  // 'exerciseFallback' = Priority 2 (per-exercise blockId+method fields)
  // 'none'             = no grouped truth usable; card must render flat
  sourceUsed: GroupedSourceUsed
  // [GROUPED-RENDER-CONTRACT] When sourceUsed === 'none', names the exact
  // reason so the card (and diagnostics) can report honest attribution.
  flatReason: GroupedFlatReason
}

// Interface for styledGroups from session
interface StyledGroupInput {
  id: string
  groupType: GroupType
  exercises: Array<{
    id: string
    name: string
    methodLabel?: string
  }>
  instruction?: string
}

// Interface for exercises with potential grouping
interface ExerciseInput {
  id: string
  name: string
  blockId?: string
  method?: string
  methodLabel?: string
}

// Interface for session styleMetadata
interface SessionStyleMetadata {
  styledGroups?: StyledGroupInput[]
  hasSupersetsApplied?: boolean
  hasCircuitsApplied?: boolean
  hasDensityApplied?: boolean
  hasClusterApplied?: boolean
  primaryStyle?: string
}

/**
 * Get a user-friendly label for a group type
 */
function getGroupLabel(groupType: GroupType, index: number): string {
  const letter = String.fromCharCode(65 + index) // A, B, C...
  switch (groupType) {
    case 'superset': return `Superset ${letter}`
    case 'circuit': return `Circuit ${letter}`
    case 'density_block': return `Density Block ${letter}`
    case 'cluster': return `Cluster Set ${letter}`
    case 'straight': return 'Straight Sets'
    default: return 'Exercise Block'
  }
}

/**
 * [PARTIAL-VALIDITY] Minimum real members required to render a grouped block.
 * A "superset" with one usable member is not a superset and should not render
 * a group header; those members fall back to flat rendering cleanly.
 */
function minMembersFor(groupType: GroupType): number {
  switch (groupType) {
    case 'superset': return 2
    case 'circuit': return 2
    case 'density_block': return 2
    case 'cluster': return 1
    default: return 1
  }
}

/**
 * [PARTIAL-VALIDITY] A member "resolves" when it has a usable name. Empty or
 * stub entries (e.g. single-letter placeholders) are not rendered. Unresolved
 * members are DROPPED from the block but the block itself is KEPT as long as
 * the remaining resolved members meet the method's minimum.
 */
function hasUsableName(ex: { name?: string }): boolean {
  const n = (ex.name || '').trim()
  return n.length >= 2
}

/**
 * Build grouped display model from styledGroups (authoritative source)
 */
function buildFromStyledGroups(styledGroups: StyledGroupInput[]): GroupedDisplayModel {
  // [PARTIAL-VALIDITY] Filter each group's members to those that actually
  // resolve, then keep the block only when enough real members remain for the
  // method to be meaningful. This stops us from rendering a "Superset" header
  // over a single lonely row (prior behavior) while preserving the block when
  // one of several members fails to resolve (desired behavior).
  const filteredGroups: StyledGroupInput[] = styledGroups
    .map(g => ({ ...g, exercises: g.exercises.filter(hasUsableName) }))
    .filter(g => {
      if (g.groupType === 'straight') return true
      return g.exercises.length >= minMembersFor(g.groupType)
    })
  const nonStraightGroups = filteredGroups.filter(g => g.groupType !== 'straight')
  
  // Create display groups only for non-straight groups
  let supersetIndex = 0
  let circuitIndex = 0
  let densityIndex = 0
  let clusterIndex = 0
  
  const displayGroups: DisplayGroup[] = nonStraightGroups.map(group => {
    let index = 0
    switch (group.groupType) {
      case 'superset': index = supersetIndex++; break
      case 'circuit': index = circuitIndex++; break
      case 'density_block': index = densityIndex++; break
      case 'cluster': index = clusterIndex++; break
    }
    
    // [GROUPED-RENDER-FIX] Include prefix derived from methodLabel and restProtocol for render
    const restProtocol = group.groupType === 'circuit' ? '60-90s after full circuit'
      : group.groupType === 'superset' ? '0-15s between, 90-120s after pair'
      : group.groupType === 'density_block' ? 'Timed block, minimal rest'
      : group.groupType === 'cluster' ? '10-20s intra-set, 120-180s inter-set'
      : '60-120s between sets'
    
    return {
      id: group.id,
      groupType: group.groupType,
      label: getGroupLabel(group.groupType, index),
      exercises: group.exercises.map((ex, exIdx) => ({
        id: ex.id,
        name: ex.name,
        methodLabel: ex.methodLabel,
        // Generate prefix from methodLabel or position (A1, A2, B1, B2, etc.)
        prefix: ex.methodLabel?.match(/[A-Z]\d?$/)?.[0] || String.fromCharCode(65 + exIdx),
      })),
      instruction: group.instruction,
      restProtocol,
    }
  })
  
  // [PARTIAL-VALIDITY] Counts derive from the filtered result so "Method
  // decisions" stays truthful to what actually renders.
  const supersetCount = filteredGroups.filter(g => g.groupType === 'superset').length
  const circuitCount = filteredGroups.filter(g => g.groupType === 'circuit').length
  const densityCount = filteredGroups.filter(g => g.groupType === 'density_block').length
  const clusterCount = filteredGroups.filter(g => g.groupType === 'cluster').length
  
  // Build summary
  const summaryParts: string[] = []
  if (supersetCount > 0) summaryParts.push(`${supersetCount} Superset${supersetCount > 1 ? 's' : ''}`)
  if (circuitCount > 0) summaryParts.push(`${circuitCount} Circuit${circuitCount > 1 ? 's' : ''}`)
  if (densityCount > 0) summaryParts.push(`${densityCount} Density Block${densityCount > 1 ? 's' : ''}`)
  if (clusterCount > 0) summaryParts.push(`${clusterCount} Cluster Set${clusterCount > 1 ? 's' : ''}`)
  
  return {
    hasGroups: nonStraightGroups.length > 0,
    totalGroupCount: filteredGroups.length,
    nonStraightGroupCount: nonStraightGroups.length,
    supersetCount,
    circuitCount,
    densityCount,
    clusterCount,
    groups: displayGroups,
    methodSummary: summaryParts.length > 0 ? summaryParts.join(' · ') : null,
    // sourceUsed + flatReason are assigned by the top-level orchestrator.
    sourceUsed: 'styledGroups',
    flatReason: null,
  }
}

/**
 * Build grouped display model from exercises directly (fallback)
 * Only used if styledGroups is empty but exercises have blockId/method
 */
function buildFromExercises(exercises: ExerciseInput[]): GroupedDisplayModel {
  // Group exercises by blockId
  const blockMap = new Map<string, ExerciseInput[]>()
  const standaloneExercises: ExerciseInput[] = []
  
  for (const ex of exercises) {
    const method = ex.method?.toLowerCase()
    // [GROUPED-RENDER-CONTRACT] density_block added to the recognized method set.
    // Previously this fallback dropped density_block silently when styledGroups
    // was missing/unusable, which produced the "method wrote density but body
    // rendered flat" symptom. The builder writes method='density_block' at
    // training-style-service.ts:921, so the adapter must honor it here.
    if (
      ex.blockId &&
      (method === 'superset' ||
        method === 'circuit' ||
        method === 'cluster' ||
        method === 'density_block' ||
        method === 'density')
    ) {
      const existing = blockMap.get(ex.blockId) || []
      existing.push(ex)
      blockMap.set(ex.blockId, existing)
    } else {
      standaloneExercises.push(ex)
    }
  }
  
  // Convert to display groups
  let supersetIndex = 0
  let circuitIndex = 0
  let clusterIndex = 0
  let densityIndex = 0
  
  const displayGroups: DisplayGroup[] = []
  
  for (const [blockId, rawBlockExercises] of blockMap) {
    // [PARTIAL-VALIDITY] Drop unresolved members; keep the block when enough
    // real members remain. A superset needs >=2 usable names; a cluster >=1.
    const blockExercises = rawBlockExercises.filter(hasUsableName)
    if (blockExercises.length === 0) continue
    
    const method = blockExercises[0].method?.toLowerCase() || 'straight'
    let groupType: GroupType = 'straight'
    let index = 0
    
    if (method === 'superset') {
      groupType = 'superset'
    } else if (method === 'circuit') {
      groupType = 'circuit'
    } else if (method === 'cluster') {
      groupType = 'cluster'
    } else if (method === 'density_block' || method === 'density') {
      groupType = 'density_block'
    }

    if (groupType !== 'straight' && blockExercises.length < minMembersFor(groupType)) {
      // Not enough resolved members to be meaningful as this group type;
      // those exercises will render flat via the card's canonical walk.
      continue
    }

    if (groupType === 'superset') index = supersetIndex++
    else if (groupType === 'circuit') index = circuitIndex++
    else if (groupType === 'cluster') index = clusterIndex++
    else if (groupType === 'density_block') index = densityIndex++

    if (groupType !== 'straight') {
      // [GROUPED-RENDER-FIX] Include prefix and restProtocol for render
      const restProtocol = groupType === 'circuit' ? '60-90s after full circuit'
        : groupType === 'superset' ? '0-15s between, 90-120s after pair'
        : groupType === 'cluster' ? '10-20s intra-set, 120-180s inter-set'
        : '60-120s between sets'
      
      displayGroups.push({
        id: blockId,
        groupType,
        label: getGroupLabel(groupType, index),
        exercises: blockExercises.map((ex, exIdx) => ({
          id: ex.id,
          name: ex.name,
          methodLabel: ex.methodLabel,
          // Generate prefix from methodLabel or position
          prefix: ex.methodLabel?.match(/[A-Z]\d?$/)?.[0] || String.fromCharCode(65 + exIdx),
        })),
        restProtocol,
      })
    }
  }
  
  // Build summary
  const summaryParts: string[] = []
  if (supersetIndex > 0) summaryParts.push(`${supersetIndex} Superset${supersetIndex > 1 ? 's' : ''}`)
  if (circuitIndex > 0) summaryParts.push(`${circuitIndex} Circuit${circuitIndex > 1 ? 's' : ''}`)
  if (densityIndex > 0) summaryParts.push(`${densityIndex} Density Block${densityIndex > 1 ? 's' : ''}`)
  if (clusterIndex > 0) summaryParts.push(`${clusterIndex} Cluster Set${clusterIndex > 1 ? 's' : ''}`)
  
  return {
    hasGroups: displayGroups.length > 0,
    totalGroupCount: displayGroups.length + standaloneExercises.length,
    nonStraightGroupCount: displayGroups.length,
    supersetCount: supersetIndex,
    circuitCount: circuitIndex,
    densityCount: densityIndex,
    clusterCount: clusterIndex,
    groups: displayGroups,
    methodSummary: summaryParts.length > 0 ? summaryParts.join(' · ') : null,
    // sourceUsed + flatReason are assigned by the top-level orchestrator.
    sourceUsed: 'exerciseFallback',
    flatReason: null,
  }
}

/**
 * Main adapter function - creates a stable grouped display model from session data
 * 
 * @param styleMetadata - The session's styleMetadata (may be undefined)
 * @param exercises - The session's exercises array (fallback source)
 * @returns A stable GroupedDisplayModel for rendering
 */
export function buildGroupedDisplayModel(
  styleMetadata: SessionStyleMetadata | undefined | null,
  exercises: ExerciseInput[] = []
): GroupedDisplayModel {
  // [GROUPED-RENDER-CONTRACT] Priority 1: authoritative styledGroups from builder.
  // Priority 2: per-exercise blockId+method fallback. Priority 1 wins only when
  // it actually produced usable non-straight groups; otherwise Priority 2 runs.
  const hasAnyExerciseMethodTruth = exercises.some(e => {
    const m = e.method?.toLowerCase()
    return (
      !!e.blockId &&
      !!m &&
      (m === 'superset' || m === 'circuit' || m === 'cluster' || m === 'density_block' || m === 'density')
    )
  })
  const styledGroupsPresent = !!(styleMetadata?.styledGroups && styleMetadata.styledGroups.length > 0)

  let fromStyledGroups: GroupedDisplayModel | null = null
  if (styledGroupsPresent) {
    fromStyledGroups = buildFromStyledGroups(styleMetadata!.styledGroups!)
    if (fromStyledGroups.hasGroups) {
      // Priority 1 wins: builder's authoritative grouped truth is usable.
      return { ...fromStyledGroups, sourceUsed: 'styledGroups', flatReason: null }
    }
  }

  // Priority 2: derive from exercises directly when styledGroups was missing,
  // empty, all-straight, or resolved to unusable members.
  if (exercises.length > 0) {
    const fromExercises = buildFromExercises(exercises)
    if (fromExercises.hasGroups) {
      return { ...fromExercises, sourceUsed: 'exerciseFallback', flatReason: null }
    }
  }

  // No renderable grouped truth. Preserve the Priority 1 totals (for straight
  // block counts) but surface an honest flatReason so the card and diagnostics
  // can attribute exactly why grouped rendering is not possible.
  let flatReason: GroupedFlatReason
  if (!styledGroupsPresent && !hasAnyExerciseMethodTruth) {
    flatReason = 'NO_STYLE_METADATA_AND_NO_EXERCISE_METHOD_TRUTH'
  } else if (styledGroupsPresent && fromStyledGroups && fromStyledGroups.totalGroupCount > 0 && fromStyledGroups.nonStraightGroupCount === 0 && !hasAnyExerciseMethodTruth) {
    flatReason = 'STYLED_GROUPS_PRESENT_BUT_ALL_STRAIGHT_AND_NO_EXERCISE_METHOD_TRUTH'
  } else if (styledGroupsPresent && !hasAnyExerciseMethodTruth) {
    flatReason = 'STYLED_GROUPS_PRESENT_BUT_UNUSABLE_AND_NO_EXERCISE_METHOD_TRUTH'
  } else if (hasAnyExerciseMethodTruth) {
    flatReason = 'EXERCISE_METHOD_TRUTH_PRESENT_BUT_INSUFFICIENT_MEMBERS'
  } else {
    flatReason = 'NO_STYLE_METADATA_AND_NO_EXERCISE_METHOD_TRUTH'
  }

  if (fromStyledGroups) {
    return { ...fromStyledGroups, sourceUsed: 'none', flatReason }
  }

  return {
    hasGroups: false,
    totalGroupCount: 0,
    nonStraightGroupCount: 0,
    supersetCount: 0,
    circuitCount: 0,
    densityCount: 0,
    clusterCount: 0,
    groups: [],
    methodSummary: null,
    sourceUsed: 'none',
    flatReason,
  }
}

/**
 * Check if an exercise belongs to a specific display group
 */
export function isExerciseInGroup(exerciseId: string, group: DisplayGroup): boolean {
  return group.exercises.some(ex => ex.id === exerciseId)
}

/**
 * Find which display group an exercise belongs to (if any)
 */
export function findGroupForExercise(
  exerciseId: string, 
  displayModel: GroupedDisplayModel
): DisplayGroup | null {
  for (const group of displayModel.groups) {
    if (isExerciseInGroup(exerciseId, group)) {
      return group
    }
  }
  return null
}
