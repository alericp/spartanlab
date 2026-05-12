/**
 * [AB9.1] Exercise-Specific Ramp-Up/Prep Plan
 * 
 * Pure helper that derives a prep/ramp-up plan for the current exercise
 * based on real exercise truth (name, category, method, load, RPE).
 * 
 * This plan is passed through the live workout snapshot corridor and
 * rendered in ActiveWorkoutStartCorridor before Set 1 only when appropriate.
 * 
 * Rules:
 * - NO database calls
 * - NO side effects
 * - NO React
 * - Safe unknown handling
 * - Does NOT mutate workout state
 * - Does NOT count as a working set
 */

// [AB15.5.1] Import skill graph for exact prep targets
import { getOrderedNodes, getSkillGraph } from '../skill-progression-graph-engine'
import type { SkillGraphId, ProgressionNode } from '../skill-progression-graph-engine'

export type PrepPlanType = 'weighted_ramp' | 'advanced_skill_ramp' | 'high_intensity_ramp' | 'method_ramp' | 'none'

export type PrepPlanSource = 'weighted_load' | 'advanced_skill' | 'high_rpe' | 'method' | 'none'

// =============================================================================
// [AB15.1] STRUCTURED PREP SET TYPES
// =============================================================================

export type PrepSetUnit = 'reps' | 'seconds' | 'load_percent' | 'effort_percent'

export interface ExercisePrepSet {
  /** Unique id for this prep set */
  id: string
  /** Display label, e.g. "Prep 1" or "Ramp 1" */
  label: string
  /** Unit type for the prep target */
  unit: PrepSetUnit
  /** Display-ready target text, e.g. "2-3 reps" or "50% ≈ 20 lb" */
  target: string
  /** Numeric target value if applicable */
  targetValue?: number | null
  /** Effort percentage for effort-based prep */
  effortPercent?: number | null
  /** Load percentage for weighted prep */
  loadPercent?: number | null
  /** Working load this prep derives from */
  workingLoad?: number | null
  /** Calculated load before rounding */
  calculatedLoad?: number | null
  /** Practical plate-loadable rounded load */
  roundedLoad?: number | null
  /** Load unit */
  loadUnit?: 'lb' | 'kg' | null
  /** Rounding increment used */
  roundingIncrement?: number | null
  /** Rest seconds after this prep set */
  restSeconds: number
  /** Short coaching cue */
  cue: string
  /** Why this prep exists */
  rationale: string
}

// =============================================================================
// [AB15.4] PRACTICAL LOAD ROUNDING HELPERS
// =============================================================================

/**
 * Rounds a raw load to the nearest practical plate-loadable increment.
 * @param rawLoad - The calculated load before rounding
 * @param increment - Plate increment (default 2.5 lb)
 * @returns Rounded practical load, or null if input is invalid
 */
export function roundToPracticalLoad(rawLoad: number, increment = 2.5): number | null {
  if (!Number.isFinite(rawLoad) || rawLoad <= 0 || increment <= 0) {
    return null
  }
  return Math.round(rawLoad / increment) * increment
}

/**
 * Formats a load value for display without awkward decimals.
 * @param load - The load value
 * @param unit - The unit (default 'lb')
 * @returns Clean formatted string like "45 lb" or "47.5 lb"
 */
export function formatLoad(load: number, unit: 'lb' | 'kg' = 'lb'): string {
  // Remove trailing zeros: 45.0 -> 45, 47.50 -> 47.5
  const formatted = Number.isInteger(load) ? String(load) : load.toFixed(1).replace(/\.0$/, '')
  return `${formatted} ${unit}`
}

/**
 * Calculates a practical ramp load with clean display text.
 * @param workingLoad - The current working set load
 * @param percent - The ramp percentage (0-100)
 * @param unit - Load unit
 * @param increment - Rounding increment
 * @returns Object with rounded load and display text, or null if invalid
 */
export function calculateRampLoad(
  workingLoad: number,
  percent: number,
  unit: 'lb' | 'kg' = 'lb',
  increment = 2.5
): { roundedLoad: number; displayText: string } | null {
  if (!Number.isFinite(workingLoad) || workingLoad <= 0 || percent <= 0 || percent > 100) {
    return null
  }
  const rawLoad = workingLoad * (percent / 100)
  const rounded = roundToPracticalLoad(rawLoad, increment)
  if (rounded === null) return null
  
  return {
    roundedLoad: rounded,
    displayText: `${percent}% ≈ ${formatLoad(rounded, unit)}`,
  }
}

export interface ExercisePrepPlan {
  /** Whether to render the prep panel */
  shouldRender: boolean
  /** Type of prep plan */
  planType: PrepPlanType
  /** Short headline for the prep panel */
  headline: string
  /** Brief reason why prep is recommended */
  reason: string
  /** 2-3 actionable prep steps (legacy text-only format) */
  steps: string[]
  /** What triggered this prep recommendation */
  source: PrepPlanSource
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low'
  /** [AB15.1] Structured prep sets with targets, loads, and rest */
  prepSets?: ExercisePrepSet[]
}

export interface PrepPlanInput {
  exerciseName: string
  exerciseCategory?: string
  setExecutionMethod?: string
  exerciseMethod?: string
  prescribedLoad?: string | number | null
  targetRPE?: number | null
  currentSetNumber: number
  currentExerciseIndex: number
  isWarmupOrCooldown?: boolean
  /** [AB15.4] Numeric working load for practical ramp calculations */
  workingLoad?: number | null
  /** [AB15.4] Load unit for display */
  loadUnit?: 'lb' | 'kg' | null
  /** [AB15.4] Plate rounding increment (default 2.5) */
  loadRoundingIncrement?: number | null
  /** [AB15.2] Whether this is a hold-based exercise */
  isHoldBased?: boolean
}

// =============================================================================
// ADVANCED SKILL PATTERNS
// =============================================================================

const ADVANCED_SKILL_PATTERNS = [
  // Lever work
  'front lever', 'back lever', 'side lever', 'human flag',
  // Planche family
  'planche', 'planche lean', 'tuck planche', 'straddle planche',
  // Muscle up variations
  'muscle up', 'muscle-up', 'bar muscle up', 'ring muscle up',
  // Handstand work
  'handstand', 'hspu', 'handstand push', 'press to handstand',
  // High-skill pulling
  'one arm pull', 'archer pull', 'typewriter pull',
  // High-skill pushing
  'one arm push', 'archer push', 'planche push',
  // Core/compression
  'dragon flag', 'v-sit', 'l-sit', 'manna',
  // Ring skills
  'iron cross', 'maltese', 'victorian',
]

// =============================================================================
// WEIGHTED EXERCISE PATTERNS  
// =============================================================================

const WEIGHTED_PATTERNS = [
  'weighted', 'barbell', 'dumbbell', 'kettlebell', 'cable',
  'loaded', 'resistance', 'external load',
]

// =============================================================================
// HIGH-INTENSITY METHOD PATTERNS
// =============================================================================

const HIGH_INTENSITY_METHODS = [
  'top_set', 'top set', 'topset',
  'cluster', 'cluster_set',
  'rest_pause', 'rest-pause', 'myo_rep', 'myorep',
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[-_]/g, ' ').trim()
}

function matchesPatterns(text: string, patterns: string[]): boolean {
  const normalized = normalizeString(text)
  return patterns.some(p => normalized.includes(normalizeString(p)))
}

function isAdvancedSkillExercise(name: string, category?: string): boolean {
  const combined = `${name} ${category || ''}`.toLowerCase()
  return matchesPatterns(combined, ADVANCED_SKILL_PATTERNS)
}

function isWeightedExercise(name: string, category?: string, prescribedLoad?: string | number | null): boolean {
  // Check if there's a real prescribed load
  if (prescribedLoad) {
    const loadStr = String(prescribedLoad).toLowerCase()
    // Skip if it's just "bodyweight" or similar
    if (!loadStr.includes('bodyweight') && !loadStr.includes('bw') && loadStr.length > 0) {
      return true
    }
  }
  
  const combined = `${name} ${category || ''}`.toLowerCase()
  return matchesPatterns(combined, WEIGHTED_PATTERNS)
}

function isHighIntensityMethod(method?: string): boolean {
  if (!method) return false
  return matchesPatterns(method, HIGH_INTENSITY_METHODS)
}

function isHighRPE(targetRPE?: number | null): boolean {
  return typeof targetRPE === 'number' && targetRPE >= 8
}

// =============================================================================
// [AB15.5.1] SKILL GRAPH PREP TARGET HELPERS
// =============================================================================

/**
 * Infer skill graph ID from exercise name.
 * Returns null if no matching graph family.
 */
function inferSkillGraphId(exerciseName: string): SkillGraphId | null {
  const name = normalizeString(exerciseName)
  
  // Front lever family
  if (name.includes('front lever')) {
    return 'front_lever'
  }
  
  // Back lever family
  if (name.includes('back lever')) {
    return 'back_lever'
  }
  
  // Pseudo planche push-up (specific - check before planche)
  if (name.includes('pseudo planche push') || name.includes('pppu')) {
    return 'pseudo_planche_pushup'
  }
  
  // Planche push-up (check before general planche)
  if (name.includes('planche push')) {
    return 'planche_pushup'
  }
  
  // Planche family (lean, hold, etc.)
  if (name.includes('planche')) {
    return 'planche'
  }
  
  // HSPU family
  if (name.includes('handstand push') || name.includes('hspu')) {
    return 'hspu'
  }
  
  // Handstand (balance/hold)
  if (name.includes('handstand')) {
    return 'handstand'
  }
  
  // Ring muscle-up
  if (name.includes('ring muscle') || name.includes('ring mu')) {
    return 'ring_muscle_up'
  }
  
  // Muscle-up
  if (name.includes('muscle up') || name.includes('muscle-up')) {
    return 'muscle_up'
  }
  
  // One-arm pull-up
  if (name.includes('one arm pull') || name.includes('one-arm pull') || name.includes('oap')) {
    return 'one_arm_pull_up'
  }
  
  // L-sit
  if (name.includes('l sit') || name.includes('l-sit')) {
    return 'l_sit'
  }
  
  // V-sit
  if (name.includes('v sit') || name.includes('v-sit')) {
    return 'v_sit'
  }
  
  // Iron cross
  if (name.includes('iron cross')) {
    return 'iron_cross'
  }
  
  return null
}

/**
 * Find the current exercise's position in the skill graph.
 * Returns the matching node or null.
 */
function findCurrentNodeInGraph(exerciseName: string, graphId: SkillGraphId): ProgressionNode | null {
  const nodes = getOrderedNodes(graphId)
  if (nodes.length === 0) return null
  
  const name = normalizeString(exerciseName)
  
  // Try exact match on displayName or nodeName
  for (const node of nodes) {
    const displayNorm = normalizeString(node.displayName)
    const nodeNorm = normalizeString(node.nodeName)
    if (name.includes(displayNorm) || displayNorm.includes(name) ||
        name.includes(nodeNorm) || nodeNorm.includes(name)) {
      return node
    }
  }
  
  // For "tuck" exercises, match tuck node
  if (name.includes('tuck') && !name.includes('adv')) {
    const tuckNode = nodes.find(n => 
      normalizeString(n.nodeName).includes('tuck') && 
      !normalizeString(n.nodeName).includes('adv')
    )
    if (tuckNode) return tuckNode
  }
  
  // For "advanced tuck" exercises
  if (name.includes('adv') && name.includes('tuck')) {
    const advTuckNode = nodes.find(n => 
      normalizeString(n.nodeName).includes('adv') && 
      normalizeString(n.nodeName).includes('tuck')
    )
    if (advTuckNode) return advTuckNode
  }
  
  // For straddle
  if (name.includes('straddle')) {
    const straddleNode = nodes.find(n => normalizeString(n.nodeName).includes('straddle'))
    if (straddleNode) return straddleNode
  }
  
  // For one-leg
  if (name.includes('one leg') || name.includes('one-leg') || name.includes('single leg')) {
    const oneLegNode = nodes.find(n => normalizeString(n.nodeName).includes('one_leg'))
    if (oneLegNode) return oneLegNode
  }
  
  // For full/complete
  if (name.includes('full') || (name.includes('front lever') && !name.includes('tuck') && !name.includes('straddle') && !name.includes('one'))) {
    const fullNode = nodes.find(n => normalizeString(n.nodeName).includes('full'))
    if (fullNode) return fullNode
  }
  
  return null
}

/**
 * [AB15.6.1] Format prep target with clear action semantics for ambiguous graph nodes.
 * Only adds clarification when the node name alone would be confusing (e.g., "Elevated Pike").
 * Returns the raw displayName for nodes that are already clear (e.g., "Tuck Front Lever setup").
 */
function formatSkillPrepTarget(
  graphId: SkillGraphId,
  nodeName: string,
  displayName: string,
  isHold: boolean,
  durationText: string
): string {
  const nodeNameLower = nodeName.toLowerCase()
  
  // HSPU-specific clarifications - "Elevated Pike" is ambiguous without action type
  if (graphId === 'hspu') {
    if (nodeNameLower === 'elevated_pike') {
      return isHold 
        ? `Elevated Pike Hold (bent-arm) — ${durationText}`
        : `Elevated Pike Push-Up — ${durationText}`
    }
    if (nodeNameLower === 'pike_push_up') {
      return isHold
        ? `Pike Push-Up Hold — ${durationText}`
        : `Pike Push-Up — ${durationText}`
    }
    if (nodeNameLower.includes('negative')) {
      return `${displayName} (slow lower) — ${durationText}`
    }
    if (nodeNameLower === 'wall_hspu') {
      return isHold
        ? `Wall HSPU Hold — ${durationText}`
        : `Wall HSPU — ${durationText}`
    }
  }
  
  // General negative clarification for any graph
  if (nodeNameLower.includes('negative') && !displayName.toLowerCase().includes('lower')) {
    return `${displayName} (slow lower) — ${durationText}`
  }
  
  // Default: use displayName with appropriate suffix
  // For holds, add "setup" or "hold" if not already present and node looks like isometric
  if (isHold && !displayName.toLowerCase().includes('hold') && !displayName.toLowerCase().includes('setup')) {
    // Only for clearly isometric positions (lever, planche, l-sit, etc.)
    const isometricKeywords = ['lever', 'planche', 'l-sit', 'v-sit', 'support', 'cross', 'hang']
    const isIsometric = isometricKeywords.some(kw => nodeNameLower.includes(kw.replace('-', '_')))
    if (isIsometric) {
      return `${displayName} setup — ${durationText}`
    }
  }
  
  return `${displayName} — ${durationText}`
}

/**
 * Build prep sets using skill graph data.
 * Returns exact movement targets from the graph.
 */
function buildSkillGraphPrepSets(
  exerciseName: string, 
  isHoldBased: boolean,
  graphId: SkillGraphId
): ExercisePrepSet[] | null {
  const nodes = getOrderedNodes(graphId)
  if (nodes.length === 0) return null
  
  const currentNode = findCurrentNodeInGraph(exerciseName, graphId)
  
  // For entry-level nodes (levelIndex 0 or 1), use 1 prep set - just rehearse the same movement
  if (currentNode && currentNode.levelIndex <= 1) {
    const isHold = isHoldBased || currentNode.movementType === 'isometric_hold'
    // [AB15.6.1] Use formatSkillPrepTarget for clear action semantics
    const target = formatSkillPrepTarget(
      graphId,
      currentNode.nodeName,
      currentNode.displayName,
      isHold,
      isHold ? '5-6 sec' : '2-3 easy reps'
    )
    return [{
      id: 'prep-1',
      label: 'Prep 1',
      unit: isHold ? 'seconds' : 'reps',
      target,
      targetValue: isHold ? 5 : 2,
      effortPercent: 50,
      restSeconds: 45,
      cue: 'Match working shape, stop fresh',
      rationale: 'One short rehearsal primes this entry-level position',
    }]
  }
  
  // For intermediate+ nodes, find easier progressions from graph
  if (currentNode && currentNode.levelIndex >= 2) {
    const isHold = isHoldBased || currentNode.movementType === 'isometric_hold'
    const prepSets: ExercisePrepSet[] = []
    
    // Find the node 2 levels below (or entry if not enough levels)
    const prep1LevelIndex = Math.max(0, currentNode.levelIndex - 2)
    const prep1Node = nodes.find(n => n.levelIndex === prep1LevelIndex) || nodes[0]
    
    // Find the node 1 level below
    const prep2LevelIndex = Math.max(0, currentNode.levelIndex - 1)
    const prep2Node = nodes.find(n => n.levelIndex === prep2LevelIndex)
    
    if (prep1Node) {
      // [AB15.6.1] Use formatSkillPrepTarget for clear action semantics
      const prep1Target = formatSkillPrepTarget(
        graphId,
        prep1Node.nodeName,
        prep1Node.displayName,
        isHold,
        isHold ? '5-6 sec' : '2-3 reps'
      )
      prepSets.push({
        id: 'prep-1',
        label: 'Prep 1',
        unit: isHold ? 'seconds' : 'reps',
        target: prep1Target,
        targetValue: isHold ? 5 : 2,
        effortPercent: 50,
        restSeconds: 45,
        cue: prep1Node.knowledgeBubble?.techniqueCues?.[0] || 'Controlled, stay fresh',
        rationale: 'Easier progression primes the pattern',
      })
    }
    
    if (prep2Node && prep2Node.nodeId !== prep1Node?.nodeId) {
      // [AB15.6.1] Use formatSkillPrepTarget for clear action semantics
      const prep2Target = formatSkillPrepTarget(
        graphId,
        prep2Node.nodeName,
        prep2Node.displayName,
        isHold,
        isHold ? '3-5 sec' : '1-2 crisp reps'
      )
      prepSets.push({
        id: 'prep-2',
        label: 'Prep 2',
        unit: isHold ? 'seconds' : 'reps',
        target: prep2Target,
        targetValue: isHold ? 4 : 1,
        effortPercent: 70,
        restSeconds: 60,
        cue: 'Bridge to working intensity, no fatigue',
        rationale: 'Near-target rehearsal before working sets',
      })
    }
    
    return prepSets.length > 0 ? prepSets : null
  }
  
  return null
}

// =============================================================================
// PLAN GENERATORS
// =============================================================================

function buildAdvancedSkillPlan(exerciseName: string, isHoldBased = false): ExercisePrepPlan {
  const normalizedName = normalizeString(exerciseName)
  
  // Determine if this is a hold or reps pattern
  const isHold = isHoldBased || 
    normalizedName.includes('hold') || 
    normalizedName.includes('lever') ||
    (normalizedName.includes('planche') && !normalizedName.includes('push'))
  
  // [AB15.5.1] Try skill graph first for exact prep targets
  const graphId = inferSkillGraphId(exerciseName)
  if (graphId) {
    const graphPrepSets = buildSkillGraphPrepSets(exerciseName, isHold, graphId)
    if (graphPrepSets && graphPrepSets.length > 0) {
      return {
        shouldRender: true,
        planType: 'advanced_skill_ramp',
        headline: 'Skill Prep',
        reason: 'Specific warm-up for this advanced skill movement.',
        steps: [], // Legacy steps not needed when we have exact targets
        source: 'advanced_skill',
        confidence: 'high',
        prepSets: graphPrepSets,
      }
    }
  }
  
  // Fallback to manual prep sets with improved copy
  let steps: string[]
  let prepSets: ExercisePrepSet[] = []
  
  if (normalizedName.includes('lever') || (normalizedName.includes('planche') && !normalizedName.includes('push'))) {
    // [AB15.5.1] Improved copy - exact target names instead of "easier progression"
    const targetName = normalizedName.includes('front lever') ? 'Front Lever' : 
                       normalizedName.includes('back lever') ? 'Back Lever' : 'Planche'
    steps = [
      'Activate scapular control with band pull-aparts',
      `Practice easier ${targetName} progression for 5-6 sec`,
      'Enter Set 1 primed, not fatigued',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'seconds',
        target: `Tuck ${targetName} setup — 5-6 sec`,
        targetValue: 5,
        effortPercent: 50,
        restSeconds: 45,
        cue: 'Match working shape, stop fresh',
        rationale: 'Low-intensity rehearsal primes motor patterns',
      },
    ]
  } else if (normalizedName.includes('pseudo planche push') || normalizedName.includes('pppu')) {
    // [AB15.5.1] Specific prep for pseudo planche push-ups
    steps = [
      'Practice reduced lean pseudo planche push-up for 2-3 reps',
      'Focus on scapular protraction and core tension',
      'Enter Set 1 primed, not fatigued',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'reps',
        target: 'Reduced-lean pseudo planche push-up — 2-3 reps',
        targetValue: 2,
        effortPercent: 50,
        restSeconds: 45,
        cue: 'Hands fixed, slight forward lean',
        rationale: 'Activate pushing pattern at lower intensity',
      },
      {
        id: 'prep-2',
        label: 'Prep 2',
        unit: 'reps',
        target: 'Near-working lean pseudo planche push-up — 1-2 crisp reps',
        targetValue: 1,
        effortPercent: 70,
        restSeconds: 60,
        cue: 'Closer lean, crisp reps only',
        rationale: 'Bridge to working intensity without fatigue',
      },
    ]
  } else if (normalizedName.includes('planche') && normalizedName.includes('push')) {
    // Planche push-ups are reps-based
    steps = [
      'Practice reduced lean for 2-3 reps to prime shoulders',
      'Focus on scapular protraction and core tension',
      'Enter Set 1 primed, not fatigued',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'reps',
        target: '2-3 reduced lean reps',
        targetValue: 2,
        effortPercent: 50,
        restSeconds: 45,
        cue: 'Reduced lean, prime the pattern',
        rationale: 'Activate pushing pattern at lower intensity',
      },
      {
        id: 'prep-2',
        label: 'Prep 2',
        unit: 'reps',
        target: '1-2 closer lean reps',
        targetValue: 1,
        effortPercent: 70,
        restSeconds: 60,
        cue: 'Closer lean, crisp reps only',
        rationale: 'Bridge to working intensity without fatigue',
      },
    ]
  } else if (normalizedName.includes('muscle up')) {
    steps = [
      'Do 3-5 explosive high pulls to prime the transition',
      'Practice the kip timing with 2-3 light swings',
      'Attempt one easy rep or assisted rep before the working set',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'reps',
        target: '3-5 explosive high pulls',
        targetValue: 4,
        effortPercent: 60,
        restSeconds: 45,
        cue: 'Explosive pulls, prime the transition',
        rationale: 'Activate fast-twitch pulling power',
      },
      {
        id: 'prep-2',
        label: 'Prep 2',
        unit: 'reps',
        target: '1-2 easy/assisted reps',
        targetValue: 1,
        effortPercent: 70,
        restSeconds: 60,
        cue: 'Full movement, submaximal effort',
        rationale: 'Rehearse full pattern before working sets',
      },
    ]
  } else if (normalizedName.includes('handstand') || normalizedName.includes('hspu')) {
    steps = [
      'Warm wrists with circles and extensions',
      'Hold a wall-supported position for 10-15 seconds',
      'Do 2-3 pike push-ups or elevated push-ups to prime shoulders',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'seconds',
        target: '10-15 sec wall hold',
        targetValue: 12,
        effortPercent: 50,
        restSeconds: 30,
        cue: 'Wall support, find balance',
        rationale: 'Prime shoulder stability and balance',
      },
      {
        id: 'prep-2',
        label: 'Prep 2',
        unit: 'reps',
        target: '2-3 pike push-ups',
        targetValue: 2,
        effortPercent: 60,
        restSeconds: 45,
        cue: 'Controlled tempo, prime shoulders',
        rationale: 'Activate pushing pattern in inverted position',
      },
    ]
  } else if (normalizedName.includes('archer') || normalizedName.includes('one arm')) {
    steps = [
      'Do 3-5 standard reps of the bilateral version',
      'Practice the assisted version for 2-3 reps each side',
      'Focus on controlled tempo before loading one arm',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'reps',
        target: '3-5 bilateral reps',
        targetValue: 4,
        effortPercent: 50,
        restSeconds: 45,
        cue: 'Standard version, both arms',
        rationale: 'Prime movement pattern bilaterally',
      },
      {
        id: 'prep-2',
        label: 'Prep 2',
        unit: 'reps',
        target: '2-3 assisted reps each side',
        targetValue: 2,
        effortPercent: 65,
        restSeconds: 60,
        cue: 'Assisted unilateral, controlled tempo',
        rationale: 'Bridge to single-arm loading',
      },
    ]
  } else if (normalizedName.includes('explosive') || normalizedName.includes('power')) {
    // Explosive/power movements
    steps = [
      'Do 2-3 controlled standard reps to prime the pattern',
      'Then 1-2 submaximal explosive reps to activate fast-twitch fibers',
      'Enter Set 1 primed for power, not fatigued',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'reps',
        target: '2-3 controlled reps',
        targetValue: 2,
        effortPercent: 50,
        restSeconds: 45,
        cue: 'Controlled tempo, find the groove',
        rationale: 'Prime movement pattern before adding speed',
      },
      {
        id: 'prep-2',
        label: 'Prep 2',
        unit: 'reps',
        target: '1-2 submaximal explosive reps',
        targetValue: 1,
        effortPercent: 70,
        restSeconds: 60,
        cue: 'Fast but not max effort',
        rationale: 'Activate power output without fatigue',
      },
    ]
  } else {
    // [AB15.5.1] Generic fallback with improved copy - avoid vague "easier/closer progression"
    steps = [
      'Reduced-intensity version of this pattern for 2-3 reps',
      'Focus on key positions and tension points',
      'Enter Set 1 primed, not fatigued',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: isHold ? 'seconds' : 'reps',
        target: isHold ? 'Short technical hold — 5-6 sec' : 'Controlled rehearsal — 2-3 reps',
        targetValue: isHold ? 5 : 2,
        effortPercent: 50,
        restSeconds: 45,
        cue: 'Reduced intensity, match working shape',
        rationale: 'Low-intensity rehearsal primes motor patterns',
      },
    ]
  }

  return {
    shouldRender: true,
    planType: 'advanced_skill_ramp',
    headline: 'Skill Prep',
    reason: 'This is an advanced skill movement. Prime the pattern before working sets.',
    steps,
    source: 'advanced_skill',
    confidence: 'high',
    prepSets,
  }
}

function buildWeightedPlan(
  exerciseName: string, 
  prescribedLoad?: string | number | null,
  workingLoad?: number | null,
  loadUnit: 'lb' | 'kg' = 'lb',
  loadRoundingIncrement = 2.5
): ExercisePrepPlan {
  const loadDisplay = prescribedLoad ? String(prescribedLoad) : 'working weight'
  
  // [AB15.4] Calculate practical ramp loads if working load is available
  const prepSets: ExercisePrepSet[] = []
  
  if (workingLoad && workingLoad > 0) {
    // Calculate 50% ramp
    const ramp50 = calculateRampLoad(workingLoad, 50, loadUnit, loadRoundingIncrement)
    // Calculate 70-75% ramp (use 70% for very heavy work)
    const ramp70 = calculateRampLoad(workingLoad, 70, loadUnit, loadRoundingIncrement)
    
    if (ramp50) {
      prepSets.push({
        id: 'prep-1',
        label: 'Ramp 1',
        unit: 'load_percent',
        target: ramp50.displayText,
        targetValue: 5, // 5 reps
        loadPercent: 50,
        workingLoad,
        calculatedLoad: workingLoad * 0.5,
        roundedLoad: ramp50.roundedLoad,
        loadUnit,
        roundingIncrement: loadRoundingIncrement,
        effortPercent: 50,
        restSeconds: 60,
        cue: '5-6 easy reps, find the groove',
        rationale: 'Activate motor pattern and warm joints at light load',
      })
    }
    
    if (ramp70) {
      prepSets.push({
        id: 'prep-2',
        label: 'Ramp 2',
        unit: 'load_percent',
        target: ramp70.displayText,
        targetValue: 3, // 3 reps
        loadPercent: 70,
        workingLoad,
        calculatedLoad: workingLoad * 0.7,
        roundedLoad: ramp70.roundedLoad,
        loadUnit,
        roundingIncrement: loadRoundingIncrement,
        effortPercent: 70,
        restSeconds: 75,
        cue: '2-4 crisp reps, don\'t grind',
        rationale: 'Bridge to working weight without accumulating fatigue',
      })
    }
  } else {
    // Fallback: effort-based prep when load is not available
    prepSets.push(
      {
        id: 'prep-1',
        label: 'Ramp 1',
        unit: 'effort_percent',
        target: '~50% effort',
        effortPercent: 50,
        restSeconds: 60,
        cue: '5-6 easy reps, find the groove',
        rationale: 'Activate motor pattern at light effort',
      },
      {
        id: 'prep-2',
        label: 'Ramp 2',
        unit: 'effort_percent',
        target: '~70% effort',
        effortPercent: 70,
        restSeconds: 75,
        cue: '2-4 crisp reps, don\'t grind',
        rationale: 'Bridge to working intensity without fatigue',
      }
    )
  }
  
  return {
    shouldRender: true,
    planType: 'weighted_ramp',
    headline: 'Ramp-Up Sets',
    reason: `Build to ${loadDisplay} with progressive loads to prepare joints and nervous system.`,
    steps: [
      'Start with an empty bar or 50% of working weight for 5-8 reps',
      'Add weight gradually: 70% for 3-5 reps, then 85% for 2-3 reps',
      'Rest 60-90 seconds, then begin your first working set',
    ],
    source: 'weighted_load',
    confidence: 'high',
    prepSets,
  }
}

function buildHighIntensityPlan(targetRPE: number): ExercisePrepPlan {
  return {
    shouldRender: true,
    planType: 'high_intensity_ramp',
    headline: 'Intensity Prep',
    reason: `Target RPE ${targetRPE} is high effort. Prepare with submaximal practice.`,
    steps: [
      'Do 2-3 reps at RPE 5-6 to find your groove',
      'Rest briefly and mentally rehearse the working set',
      'Enter Set 1 focused and ready for quality effort',
    ],
    source: 'high_rpe',
    confidence: 'medium',
    prepSets: [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'effort_percent',
        target: '~60% effort (RPE 5-6)',
        effortPercent: 60,
        restSeconds: 45,
        cue: '2-3 reps, find your groove',
        rationale: 'Prime the pattern without fatigue before high-RPE work',
      },
    ],
  }
}

function buildMethodPlan(method: string): ExercisePrepPlan {
  const normalizedMethod = normalizeString(method)
  
  let steps: string[]
  let prepSets: ExercisePrepSet[] = []
  
  if (normalizedMethod.includes('top') && normalizedMethod.includes('set')) {
    steps = [
      'Warm up with 2-3 lighter sets before your top set',
      'Focus on bar speed and technique at submaximal loads',
      'Save your best effort for the top set',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'effort_percent',
        target: '~50% effort',
        effortPercent: 50,
        restSeconds: 60,
        cue: 'Light weight, groove the pattern',
        rationale: 'Build toward top set without fatigue',
      },
      {
        id: 'prep-2',
        label: 'Prep 2',
        unit: 'effort_percent',
        target: '~75% effort',
        effortPercent: 75,
        restSeconds: 75,
        cue: 'Moderate weight, fast bar speed',
        rationale: 'Prime nervous system for top set',
      },
    ]
  } else if (normalizedMethod.includes('cluster')) {
    steps = [
      'Practice the cluster rest timing with a lighter weight',
      'Get comfortable with the mini-rest protocol',
      'Start conservatively - clusters accumulate fatigue quickly',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'effort_percent',
        target: '~50% effort',
        effortPercent: 50,
        restSeconds: 45,
        cue: 'Practice cluster timing',
        rationale: 'Familiarize with mini-rest protocol',
      },
    ]
  } else if (normalizedMethod.includes('rest') && normalizedMethod.includes('pause')) {
    steps = [
      'Do a few standard reps to establish your baseline',
      'Practice the rest-pause breathing rhythm',
      'Plan your mini-rest points before starting',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'effort_percent',
        target: '~60% effort',
        effortPercent: 60,
        restSeconds: 45,
        cue: 'Standard reps, find baseline',
        rationale: 'Establish rhythm before rest-pause protocol',
      },
    ]
  } else {
    steps = [
      'Familiarize yourself with the method protocol',
      'Do a practice set at reduced intensity',
      'Enter the working set with clear intent',
    ]
    prepSets = [
      {
        id: 'prep-1',
        label: 'Prep 1',
        unit: 'effort_percent',
        target: '~50% effort',
        effortPercent: 50,
        restSeconds: 45,
        cue: 'Reduced intensity, prime the protocol',
        rationale: 'Familiarize with method before working sets',
      },
    ]
  }

  return {
    shouldRender: true,
    planType: 'method_ramp',
    headline: 'Method Prep',
    reason: 'This set uses a specific training method. Prime the protocol.',
    steps,
    source: 'method',
    confidence: 'medium',
    prepSets,
  }
}

// =============================================================================
// MAIN PLAN BUILDER
// =============================================================================

export function buildExercisePrepPlan(input: PrepPlanInput): ExercisePrepPlan {
  const {
    exerciseName,
    exerciseCategory,
    setExecutionMethod,
    exerciseMethod,
    prescribedLoad,
    targetRPE,
    currentSetNumber,
    currentExerciseIndex,
    isWarmupOrCooldown,
    // [AB15] New fields for structured prep sets
    workingLoad,
    loadUnit,
    loadRoundingIncrement,
    isHoldBased,
  } = input

  // Only show prep before Set 1
  if (currentSetNumber !== 1) {
    return {
      shouldRender: false,
      planType: 'none',
      headline: '',
      reason: '',
      steps: [],
      source: 'none',
      confidence: 'low',
    }
  }

  // Skip warm-up and cooldown exercises
  if (isWarmupOrCooldown) {
    return {
      shouldRender: false,
      planType: 'none',
      headline: '',
      reason: '',
      steps: [],
      source: 'none',
      confidence: 'low',
    }
  }

  // Priority 1: Advanced skill exercises always get prep
  if (isAdvancedSkillExercise(exerciseName, exerciseCategory)) {
    return buildAdvancedSkillPlan(exerciseName, isHoldBased)
  }

  // Priority 2: Weighted exercises with real load
  if (isWeightedExercise(exerciseName, exerciseCategory, prescribedLoad)) {
    return buildWeightedPlan(
      exerciseName, 
      prescribedLoad,
      workingLoad ?? null,
      loadUnit ?? 'lb',
      loadRoundingIncrement ?? 2.5
    )
  }

  // Priority 3: High-intensity methods
  const effectiveMethod = setExecutionMethod || exerciseMethod || ''
  if (isHighIntensityMethod(effectiveMethod)) {
    return buildMethodPlan(effectiveMethod)
  }

  // Priority 4: High RPE (8+) work
  if (isHighRPE(targetRPE) && typeof targetRPE === 'number') {
    return buildHighIntensityPlan(targetRPE)
  }

  // No prep needed for normal accessory work
  return {
    shouldRender: false,
    planType: 'none',
    headline: '',
    reason: '',
    steps: [],
    source: 'none',
    confidence: 'low',
  }
}
