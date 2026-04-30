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

// [GROUPED-RENDER-CONTRACT] Final visible block ownership. Previously the
// renderer inside AdaptiveSessionCard performed its own canonical walk over
// displayExercises, building a local `displayBlocks` array from styledGroups +
// id/name/blockId indexes -- while the contract only owned the grouped-vs-flat
// decision. That split ownership let the render-branch say "grouped" while the
// visible body was rebuilt from a different corridor that could drop, reorder,
// or flatten grouped truth. The adapter now produces the exact ordered list of
// render blocks the card will iterate. The renderer becomes a pure consumer.
export type RenderBlock =
  | { type: 'group'; group: DisplayGroup }
  | { type: 'exercise'; exerciseId: string; exerciseName: string }

// [DISPLAY-FIRST-FALLBACK] Raw fallback block shape. A minimal, permissive
// representation of grouped truth used by the card when the rich grouped
// contract is not "renderable enough" (e.g. partial-validity filters dropped
// the only resolvable members) BUT upstream grouped truth still genuinely
// exists. The card uses this as an intermediate render branch:
//   rich grouped  ->  raw grouped fallback  ->  flat
// This guarantees visible grouped structure whenever grouped truth exists,
// even if richly hydrated rows are not yet achievable.
export interface RawFallbackMember {
  id?: string
  name: string
  prefix?: string
}

export interface RawFallbackBlock {
  type: 'group'
  groupId: string
  groupType: GroupType
  label: string
  members: RawFallbackMember[]
}

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
  // [GROUPED-RENDER-CONTRACT] The exact ordered list of blocks the grouped
  // render path will iterate. Empty when sourceUsed === 'none' (flat path
  // does not consume this field).
  renderBlocks: RenderBlock[]
  // [DISPLAY-FIRST-FALLBACK] Does upstream grouped truth exist at all?
  // Computed from RAW inputs BEFORE partial-validity filtering:
  //   - styleMetadata.styledGroups contains at least one non-straight group, OR
  //   - exercises have at least one blockId + non-straight method.
  // If true but hasRichRenderableGroups is false, the card must render the raw
  // fallback path instead of collapsing to flat.
  hasGroupedTruth: boolean
  // [DISPLAY-FIRST-FALLBACK] Is the rich grouped contract (renderBlocks)
  // strong enough for the preferred grouped renderer? True iff sourceUsed !==
  // 'none' AND nonStraightGroupCount > 0. Equivalent to the prior
  // `hasRenderableGroups` gate used inside AdaptiveSessionCard, surfaced here
  // so both card and adapter share one definition.
  hasRichRenderableGroups: boolean
  // [DISPLAY-FIRST-FALLBACK] A minimal but ordered grouped-block list derived
  // from the best upstream grouped truth available, using a permissive member
  // rule (>=1 usable name, no minimum-count gate). Consumed ONLY when the
  // rich path cannot render grouped. Empty when hasGroupedTruth === false.
  rawFallbackBlocks: RawFallbackBlock[]
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
// [METHOD-MIN-MEMBERS-AUTHORITY] The single authoritative rule for "how many
// resolved members does a grouped block need to still render as its method?"
//
// Exported so variant-prune sites (AdaptiveSessionCard + app/(app)/workout/
// session/page.tsx) consume the SAME rule instead of duplicating a blanket
// `>= 2` filter that incorrectly kills legitimate single-exercise cluster
// groups. Prior behavior: both prune sites used `g.exercises.length >= 2`
// for every non-straight group, so every cluster (emitted as a 1-member
// group by adaptive-program-builder) was silently dropped BEFORE reaching
// this adapter -- making clusters invisible on the Program card even when
// compression/variant selection kept the cluster exercise.
//
// Per-method minimums (unchanged):
//   superset/circuit/density_block -> 2  (method requires pairing to mean anything)
//   cluster                         -> 1  (method is intra-set, single exercise)
export function minMembersFor(groupType: GroupType): number {
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
    // sourceUsed, flatReason, renderBlocks, and the display-first fallback
    // fields are assigned by the top-level orchestrator. renderBlocks needs
    // the input `exercises` list to compute canonical interleaved order and
    // that is only available in the orchestrator.
    sourceUsed: 'styledGroups',
    flatReason: null,
    renderBlocks: [],
    hasGroupedTruth: false,
    hasRichRenderableGroups: false,
    rawFallbackBlocks: [],
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
    // sourceUsed, flatReason, renderBlocks, and the display-first fallback
    // fields are assigned by the top-level orchestrator.
    sourceUsed: 'exerciseFallback',
    flatReason: null,
    renderBlocks: [],
    hasGroupedTruth: false,
    hasRichRenderableGroups: false,
    rawFallbackBlocks: [],
  }
}

/**
 * [GROUPED-RENDER-CONTRACT] Build the final ordered list of render blocks
 * (groups interleaved with standalone exercises) in canonical session order.
 * This moves the canonical walk -- previously owned by MainExercisesRenderer
 * -- into the adapter so block set and ordering are owned by the same contract
 * that decides grouped-vs-flat. The renderer becomes a pure consumer.
 */
// [GROUPED-RENDER-MATCH] Normalize a name for member <-> exercise matching:
// lowercase, trim, strip punctuation, collapse whitespace. Matches the key used
// by `buildFullVisibleRoutineExercises` so "Pull-Ups", "Pull Ups", and
// "pull  ups" all resolve to the same group. Without this, trivial punctuation
// drift between styledGroups member names and session.exercises names silently
// pushes groups to the end of the render list via the rescue pass, which makes
// the visible body look flat even though grouped truth exists.
function normalizeNameKey(s: string | undefined): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findGroupForExerciseInput(
  ex: ExerciseInput,
  groups: DisplayGroup[]
): DisplayGroup | null {
  const exNorm = normalizeNameKey(ex.name)
  for (const group of groups) {
    if (group.groupType === 'straight') continue
    // blockId is the most reliable signal -- the builder writes the same id on
    // session.exercises[].blockId AND on styledGroups[].id (which carries to
    // DisplayGroup.id in both sourceUsed paths).
    if (ex.blockId && ex.blockId === group.id) return group
    if (ex.id && group.exercises.some(m => m.id === ex.id)) return group
    const lower = (ex.name || '').toLowerCase()
    if (lower && group.exercises.some(m => m.name.toLowerCase() === lower)) return group
    // [GROUPED-RENDER-MATCH] Punctuation/whitespace-insensitive fallback so
    // "Pull-Ups" matches "Pull Ups" matches "pull ups". Fires only when the
    // exact lowercased equality already failed, so it cannot over-match.
    if (exNorm && group.exercises.some(m => normalizeNameKey(m.name) === exNorm)) return group
  }
  return null
}

function buildRenderBlocks(
  groups: DisplayGroup[],
  exercises: ExerciseInput[]
): RenderBlock[] {
  const blocks: RenderBlock[] = []
  const emittedGroupIds = new Set<string>()
  const consumedKeys = new Set<string>()

  const keyId = (id: string) => `id:${id}`
  const keyName = (name: string) => `name:${name.toLowerCase()}`
  // [GROUPED-RENDER-MATCH] Normalized-name key mirrors findGroupForExerciseInput
  // so duplicate-identity drift ("Pull-Ups" vs "Pull Ups") does not double-emit
  // a group member as a loose row AFTER the group already rendered it.
  const keyNorm = (name: string) => `norm:${normalizeNameKey(name)}`

  for (const ex of exercises) {
    const group = findGroupForExerciseInput(ex, groups)
    if (group) {
      if (!emittedGroupIds.has(group.id)) {
        blocks.push({ type: 'group', group })
        emittedGroupIds.add(group.id)
        // Mark every group member consumed so a later identity-drift duplicate
        // of the same exercise is not re-emitted as a loose row.
        for (const m of group.exercises) {
          if (m.id) consumedKeys.add(keyId(m.id))
          if (m.name) {
            consumedKeys.add(keyName(m.name))
            consumedKeys.add(keyNorm(m.name))
          }
        }
      }
      if (ex.id) consumedKeys.add(keyId(ex.id))
      if (ex.name) {
        consumedKeys.add(keyName(ex.name))
        consumedKeys.add(keyNorm(ex.name))
      }
      continue
    }
    // Ungrouped: emit at canonical position unless already consumed by a group.
    const idK = ex.id ? keyId(ex.id) : ''
    const nameK = ex.name ? keyName(ex.name) : ''
    const normK = ex.name ? keyNorm(ex.name) : ''
    if (
      (idK && consumedKeys.has(idK)) ||
      (nameK && consumedKeys.has(nameK)) ||
      (normK && consumedKeys.has(normK))
    ) continue
    blocks.push({ type: 'exercise', exerciseId: ex.id, exerciseName: ex.name })
    if (idK) consumedKeys.add(idK)
    if (nameK) consumedKeys.add(nameK)
    if (normK) consumedKeys.add(normK)
  }

  // [GROUPED-TRUTH-RESCUE-PREPEND] Any non-straight group whose members never
  // matched any exercise by blockId/id/name is PREPENDED to the top of the
  // render list (not appended to the end).
  //
  // Why this matters for visible display:
  // Previously these groups were appended after all standalone-exercise blocks.
  // When upstream group/member identity drifts (e.g. variant rewrites exercise
  // ids, builder writes styledGroup.id = 'styled-0' while session.exercises
  // carries a different blockId, or names are renamed between builder passes),
  // EVERY exercise fails inline matching -- and the card body reads as:
  //     [standalone row 1] [standalone row 2] ... [standalone row N]
  //     [Superset header at very bottom with minimal text rows]
  // That is visually indistinguishable from a flat card for the user even
  // though grouped truth is present.
  //
  // Prepending makes rescued groups the FIRST visible element, which is what
  // "grouped day" should look like. The exercises that belong to those groups
  // still render as standalone rows below (since identity match failed) --
  // that's honest: we couldn't hydrate them into the group, so they show as
  // separate rows, but the grouped structure is visibly acknowledged at the
  // top of the card.
  const rescued: RenderBlock[] = []
  for (const group of groups) {
    if (group.groupType === 'straight') continue
    if (emittedGroupIds.has(group.id)) continue
    rescued.push({ type: 'group', group })
    emittedGroupIds.add(group.id)
  }
  if (rescued.length === 0) return blocks
  return [...rescued, ...blocks]
}

/**
 * [DISPLAY-FIRST-FALLBACK] Build a permissive raw grouped block list used
 * when upstream grouped truth exists but is not rich-renderable.
 *
 * Differences from rich builders:
 *  - No minimum-member gate (a single-member superset is still rendered).
 *  - Drops truly empty member names but keeps everything else.
 *  - Does not depend on exercise hydration succeeding; the card's raw
 *    fallback renderer uses these members as the source of truth for text.
 *
 * Priority order matches the rich path:
 *  1. styleMetadata.styledGroups (authoritative non-straight groups)
 *  2. exercise blockId + non-straight method grouping
 */
function buildRawFallbackBlocks(
  styleMetadata: SessionStyleMetadata | undefined | null,
  exercises: ExerciseInput[]
): RawFallbackBlock[] {
  // Priority 1: styledGroups
  const styledNonStraight = (styleMetadata?.styledGroups || []).filter(
    g => g.groupType !== 'straight'
  )
  if (styledNonStraight.length > 0) {
    const typeIndex: Record<string, number> = {
      superset: 0,
      circuit: 0,
      density_block: 0,
      cluster: 0,
    }
    const blocks: RawFallbackBlock[] = []
    for (const g of styledNonStraight) {
      const usable = (g.exercises || []).filter(m => hasUsableName(m))
      if (usable.length === 0) continue
      const idx = typeIndex[g.groupType] ?? 0
      typeIndex[g.groupType] = idx + 1
      const letter = String.fromCharCode(65 + idx)
      blocks.push({
        type: 'group',
        groupId: g.id,
        groupType: g.groupType,
        label: getGroupLabel(g.groupType, idx),
        members: usable.map((m, i) => ({
          id: m.id,
          name: m.name,
          prefix: m.methodLabel?.match(/[A-Z]\d?$/)?.[0] || `${letter}${i + 1}`,
        })),
      })
    }
    if (blocks.length > 0) return blocks
  }

  // Priority 2: exercises with blockId + non-straight method
  const blockOrder: string[] = []
  const blockMembers = new Map<string, ExerciseInput[]>()
  const blockMethod = new Map<string, GroupType>()
  for (const ex of exercises) {
    const m = ex.method?.toLowerCase()
    if (
      ex.blockId &&
      m &&
      (m === 'superset' || m === 'circuit' || m === 'cluster' || m === 'density_block' || m === 'density')
    ) {
      if (!blockMembers.has(ex.blockId)) {
        blockMembers.set(ex.blockId, [])
        blockOrder.push(ex.blockId)
        blockMethod.set(ex.blockId, (m === 'density' ? 'density_block' : m) as GroupType)
      }
      blockMembers.get(ex.blockId)!.push(ex)
    }
  }
  const typeIndex: Record<string, number> = {
    superset: 0,
    circuit: 0,
    density_block: 0,
    cluster: 0,
  }
  const blocks: RawFallbackBlock[] = []
  for (const bId of blockOrder) {
    const method = blockMethod.get(bId) as GroupType
    const usable = (blockMembers.get(bId) || []).filter(m => hasUsableName(m))
    if (usable.length === 0) continue
    const idx = typeIndex[method] ?? 0
    typeIndex[method] = idx + 1
    const letter = String.fromCharCode(65 + idx)
    blocks.push({
      type: 'group',
      groupId: bId,
      groupType: method,
      label: getGroupLabel(method, idx),
      members: usable.map((m, i) => ({
        id: m.id,
        name: m.name,
        prefix: m.methodLabel?.match(/[A-Z]\d?$/)?.[0] || `${letter}${i + 1}`,
      })),
    })
  }
  return blocks
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
  // [DISPLAY-FIRST-FALLBACK] Detect RAW upstream grouped truth BEFORE any
  // partial-validity filtering. This is the gate for "show something grouped
  // even if the rich path can't hydrate" and must be computed from pre-filter
  // signals only.
  const hasAnyStyledNonStraightRaw = !!(styleMetadata?.styledGroups?.some(g => g.groupType !== 'straight'))
  const hasGroupedTruth = hasAnyStyledNonStraightRaw || hasAnyExerciseMethodTruth

  let fromStyledGroups: GroupedDisplayModel | null = null
  if (styledGroupsPresent) {
    fromStyledGroups = buildFromStyledGroups(styleMetadata!.styledGroups!)
    if (fromStyledGroups.hasGroups) {
      // Priority 1 wins: builder's authoritative grouped truth is usable.
      // [GROUPED-RENDER-CONTRACT] Compute the final ordered render block list
      // here (NOT in the renderer) so block set + order is owned by the same
      // contract that decides grouped-vs-flat.
      const renderBlocks = buildRenderBlocks(fromStyledGroups.groups, exercises)
      return {
        ...fromStyledGroups,
        sourceUsed: 'styledGroups',
        flatReason: null,
        renderBlocks,
        // [DISPLAY-FIRST-FALLBACK] Rich path wins; fallback blocks are not
        // consumed by the renderer in this branch.
        hasGroupedTruth: true,
        hasRichRenderableGroups: true,
        rawFallbackBlocks: [],
      }
    }
  }

  // Priority 2: derive from exercises directly when styledGroups was missing,
  // empty, all-straight, or resolved to unusable members.
  if (exercises.length > 0) {
    const fromExercises = buildFromExercises(exercises)
    if (fromExercises.hasGroups) {
      const renderBlocks = buildRenderBlocks(fromExercises.groups, exercises)
      return {
        ...fromExercises,
        sourceUsed: 'exerciseFallback',
        flatReason: null,
        renderBlocks,
        hasGroupedTruth: true,
        hasRichRenderableGroups: true,
        rawFallbackBlocks: [],
      }
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

  // [DISPLAY-FIRST-FALLBACK] The rich path did not win. Compute raw fallback
  // blocks ONCE so both tail returns below share the same list. When upstream
  // grouped truth exists, the card will use this to render a minimal grouped
  // body instead of collapsing to flat.
  const rawFallbackBlocks = hasGroupedTruth
    ? buildRawFallbackBlocks(styleMetadata, exercises)
    : []

  if (fromStyledGroups) {
    // Flat path: renderBlocks stays empty; the card's flat renderer does not
    // consume it. rawFallbackBlocks is populated iff grouped truth existed
    // upstream so the card can render the intermediate raw grouped branch.
    return {
      ...fromStyledGroups,
      sourceUsed: 'none',
      flatReason,
      renderBlocks: [],
      hasGroupedTruth,
      hasRichRenderableGroups: false,
      rawFallbackBlocks,
    }
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
    renderBlocks: [],
    hasGroupedTruth,
    hasRichRenderableGroups: false,
    rawFallbackBlocks,
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
