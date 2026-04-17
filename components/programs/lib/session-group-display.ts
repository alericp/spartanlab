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
 * Build grouped display model from styledGroups (authoritative source)
 */
function buildFromStyledGroups(styledGroups: StyledGroupInput[]): GroupedDisplayModel {
  const nonStraightGroups = styledGroups.filter(g => g.groupType !== 'straight')
  
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
  
  const supersetCount = styledGroups.filter(g => g.groupType === 'superset').length
  const circuitCount = styledGroups.filter(g => g.groupType === 'circuit').length
  const densityCount = styledGroups.filter(g => g.groupType === 'density_block').length
  const clusterCount = styledGroups.filter(g => g.groupType === 'cluster').length
  
  // Build summary
  const summaryParts: string[] = []
  if (supersetCount > 0) summaryParts.push(`${supersetCount} Superset${supersetCount > 1 ? 's' : ''}`)
  if (circuitCount > 0) summaryParts.push(`${circuitCount} Circuit${circuitCount > 1 ? 's' : ''}`)
  if (densityCount > 0) summaryParts.push(`${densityCount} Density Block${densityCount > 1 ? 's' : ''}`)
  if (clusterCount > 0) summaryParts.push(`${clusterCount} Cluster Set${clusterCount > 1 ? 's' : ''}`)
  
  return {
    hasGroups: nonStraightGroups.length > 0,
    totalGroupCount: styledGroups.length,
    nonStraightGroupCount: nonStraightGroups.length,
    supersetCount,
    circuitCount,
    densityCount,
    clusterCount,
    groups: displayGroups,
    methodSummary: summaryParts.length > 0 ? summaryParts.join(' · ') : null,
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
    if (ex.blockId && (method === 'superset' || method === 'circuit' || method === 'cluster')) {
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
  
  const displayGroups: DisplayGroup[] = []
  
  for (const [blockId, blockExercises] of blockMap) {
    if (blockExercises.length === 0) continue
    
    const method = blockExercises[0].method?.toLowerCase() || 'straight'
    let groupType: GroupType = 'straight'
    let index = 0
    
    if (method === 'superset') {
      groupType = 'superset'
      index = supersetIndex++
    } else if (method === 'circuit') {
      groupType = 'circuit'
      index = circuitIndex++
    } else if (method === 'cluster') {
      groupType = 'cluster'
      index = clusterIndex++
    }
    
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
  if (clusterIndex > 0) summaryParts.push(`${clusterIndex} Cluster Set${clusterIndex > 1 ? 's' : ''}`)
  
  return {
    hasGroups: displayGroups.length > 0,
    totalGroupCount: displayGroups.length + standaloneExercises.length,
    nonStraightGroupCount: displayGroups.length,
    supersetCount: supersetIndex,
    circuitCount: circuitIndex,
    densityCount: 0, // Not detectable from exercises alone
    clusterCount: clusterIndex,
    groups: displayGroups,
    methodSummary: summaryParts.length > 0 ? summaryParts.join(' · ') : null,
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
  // Priority 1: Use styledGroups if available and has content
  if (styleMetadata?.styledGroups && styleMetadata.styledGroups.length > 0) {
    return buildFromStyledGroups(styleMetadata.styledGroups)
  }
  
  // Priority 2: Try to derive from exercises directly
  if (exercises.length > 0) {
    const fromExercises = buildFromExercises(exercises)
    if (fromExercises.hasGroups) {
      return fromExercises
    }
  }
  
  // No grouped truth found
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
