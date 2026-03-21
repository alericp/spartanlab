// Workout Time Optimizer
// Intelligently adjusts workout content to fit available training time
// while preserving training intent and exercise priority

import type { AdaptiveSession, AdaptiveExercise } from '../adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export type TimeTier = 30 | 45 | 60 | 75 | 90
export type ExercisePriority = 'tier1_essential' | 'tier2_recommended' | 'tier3_optional'

export interface TimeOptimizationRequest {
  session: AdaptiveSession
  targetMinutes: number
  preserveSkillWork: boolean
  preserveMainStrength: boolean
}

export interface OptimizedSession {
  session: AdaptiveSession
  wasOptimized: boolean
  optimizationType: 'compressed' | 'expanded' | 'unchanged'
  originalMinutes: number
  targetMinutes: number
  actualMinutes: number
  removedExercises: string[]
  reducedExercises: string[]
  explanation: string
  coachingMessage: string
}

export interface ExerciseWithPriority extends AdaptiveExercise {
  priority: ExercisePriority
  estimatedMinutes: number
  canCompress: boolean
  compressionReason?: string
}

export interface TimePattern {
  date: string
  requestedMinutes: number
  actualMinutes: number
  wasCompressed: boolean
  wasExpanded: boolean
}

export interface TimePreferenceHistory {
  patterns: TimePattern[]
  avgRequestedTime: number
  compressionFrequency: number // 0-1, how often user compresses
  expansionFrequency: number // 0-1, how often user expands
  preferredTier: TimeTier
  lastUpdated: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const TIME_TIERS: TimeTier[] = [30, 45, 60, 75, 90]

export const TIME_TIER_LABELS: Record<TimeTier, string> = {
  30: '30 min (Focused)',
  45: '45 min (Balanced)',
  60: '60 min (Complete)',
  75: '75 min (Extended)',
  90: '90 min (Comprehensive)',
}

export const TIME_TIER_DESCRIPTIONS: Record<TimeTier, string> = {
  30: 'Essential skill and strength work only',
  45: 'Core training with limited accessories',
  60: 'Full session with all components',
  75: 'Extended session with extra volume',
  90: 'Comprehensive session with full accessory work',
}

// Minimum warmup time that should never be cut below (safety)
const MIN_WARMUP_MINUTES = 5

// Exercise time estimates (average)
const EXERCISE_TIME_ESTIMATES = {
  skill: 8,      // Skill work needs more rest
  strength: 6,   // Primary strength movements
  accessory: 4,  // Accessory work
  core: 3,       // Core exercises
  mobility: 3,   // Mobility work
  warmup: 2,     // Warmup exercises
  cooldown: 2,   // Cooldown exercises
}

// =============================================================================
// PRIORITY CLASSIFICATION
// =============================================================================

/**
 * Classify exercise priority based on category and session focus
 */
export function classifyExercisePriority(
  exercise: AdaptiveExercise,
  sessionFocus: string
): ExercisePriority {
  const category = exercise.category.toLowerCase()
  const name = exercise.name.toLowerCase()
  
  // Tier 1 - Non-negotiable: Main skill work and primary strength
  if (category === 'skill') {
    return 'tier1_essential'
  }
  
  // Check if it's the primary strength movement for this focus
  if (category === 'strength' || category === 'push' || category === 'pull') {
    // Primary movement for the session focus
    if (isRelatedToFocus(name, sessionFocus)) {
      return 'tier1_essential'
    }
    // Secondary strength work
    return 'tier2_recommended'
  }
  
  // Tier 2 - Strongly recommended: Secondary strength and support
  if (category === 'core') {
    // Core is tier 2 for most sessions, tier 1 for core-focused
    if (sessionFocus.includes('core') || sessionFocus.includes('l-sit')) {
      return 'tier1_essential'
    }
    return 'tier2_recommended'
  }
  
  // Tier 3 - Optional/compressible: Accessories and extras
  return 'tier3_optional'
}

/**
 * Check if exercise is related to session focus
 */
function isRelatedToFocus(exerciseName: string, focus: string): boolean {
  const focusLower = focus.toLowerCase()
  
  const focusKeywords: Record<string, string[]> = {
    planche: ['planche', 'lean', 'pseudo', 'handstand', 'pike'],
    front_lever: ['front lever', 'row', 'pull', 'lat'],
    back_lever: ['back lever', 'german hang', 'skin the cat'],
    muscle_up: ['muscle-up', 'pull-up', 'dip', 'transition'],
    handstand_pushup: ['handstand', 'pike', 'press', 'shoulder'],
    pull: ['pull', 'row', 'lat', 'bicep'],
    push: ['push', 'dip', 'press', 'tricep'],
  }
  
  for (const [key, keywords] of Object.entries(focusKeywords)) {
    if (focusLower.includes(key)) {
      return keywords.some(kw => exerciseName.includes(kw))
    }
  }
  
  return false
}

/**
 * Estimate exercise time including rest
 */
export function estimateExerciseTime(exercise: AdaptiveExercise): number {
  const category = exercise.category.toLowerCase()
  const baseTime = EXERCISE_TIME_ESTIMATES[category as keyof typeof EXERCISE_TIME_ESTIMATES] || 5
  
  // Adjust for sets
  const setMultiplier = Math.max(1, exercise.sets / 3)
  
  return Math.round(baseTime * setMultiplier)
}

// =============================================================================
// MAIN OPTIMIZATION FUNCTION
// =============================================================================

/**
 * Optimize a session to fit target time while preserving training intent
 */
export function optimizeSessionForTime(request: TimeOptimizationRequest): OptimizedSession {
  const { session, targetMinutes, preserveSkillWork, preserveMainStrength } = request
  
  const originalMinutes = session.estimatedMinutes || 60
  
  // No optimization needed if target >= original
  if (targetMinutes >= originalMinutes) {
    return handleExpansion(session, targetMinutes, originalMinutes)
  }
  
  // Classify all exercises by priority
  const classifiedExercises = classifyAllExercises(session)
  
  // Calculate current time breakdown
  const timeBreakdown = calculateTimeBreakdown(classifiedExercises)
  
  // Determine compression strategy
  const strategy = determineCompressionStrategy(
    targetMinutes,
    originalMinutes,
    timeBreakdown,
    preserveSkillWork,
    preserveMainStrength
  )
  
  // Apply compression
  const optimized = applyCompression(session, strategy, classifiedExercises)
  
  // Generate coaching explanation
  const explanation = generateCompressionExplanation(strategy, optimized)
  const coachingMessage = generateCoachingMessage(strategy, targetMinutes)
  
  return {
    session: optimized.session,
    wasOptimized: true,
    optimizationType: 'compressed',
    originalMinutes,
    targetMinutes,
    actualMinutes: optimized.actualMinutes,
    removedExercises: optimized.removedExercises,
    reducedExercises: optimized.reducedExercises,
    explanation,
    coachingMessage,
  }
}

// =============================================================================
// CLASSIFICATION AND TIME BREAKDOWN
// =============================================================================

interface ClassifiedExercises {
  tier1: ExerciseWithPriority[]
  tier2: ExerciseWithPriority[]
  tier3: ExerciseWithPriority[]
  warmup: AdaptiveExercise[]
  cooldown: AdaptiveExercise[]
}

function classifyAllExercises(session: AdaptiveSession): ClassifiedExercises {
  const tier1: ExerciseWithPriority[] = []
  const tier2: ExerciseWithPriority[] = []
  const tier3: ExerciseWithPriority[] = []
  
  for (const exercise of session.exercises) {
    const priority = classifyExercisePriority(exercise, session.focus)
    const estimatedMinutes = estimateExerciseTime(exercise)
    const canCompress = priority !== 'tier1_essential'
    
    const classified: ExerciseWithPriority = {
      ...exercise,
      priority,
      estimatedMinutes,
      canCompress,
    }
    
    switch (priority) {
      case 'tier1_essential':
        tier1.push(classified)
        break
      case 'tier2_recommended':
        tier2.push(classified)
        break
      case 'tier3_optional':
        tier3.push(classified)
        break
    }
  }
  
  return {
    tier1,
    tier2,
    tier3,
    warmup: session.warmup,
    cooldown: session.cooldown,
  }
}

interface TimeBreakdown {
  tier1: number
  tier2: number
  tier3: number
  warmup: number
  cooldown: number
  total: number
}

function calculateTimeBreakdown(classified: ClassifiedExercises): TimeBreakdown {
  const tier1 = classified.tier1.reduce((sum, e) => sum + e.estimatedMinutes, 0)
  const tier2 = classified.tier2.reduce((sum, e) => sum + e.estimatedMinutes, 0)
  const tier3 = classified.tier3.reduce((sum, e) => sum + e.estimatedMinutes, 0)
  const warmup = classified.warmup.length * EXERCISE_TIME_ESTIMATES.warmup
  const cooldown = classified.cooldown.length * EXERCISE_TIME_ESTIMATES.cooldown
  
  return {
    tier1,
    tier2,
    tier3,
    warmup,
    cooldown,
    total: tier1 + tier2 + tier3 + warmup + cooldown,
  }
}

// =============================================================================
// COMPRESSION STRATEGY
// =============================================================================

interface CompressionStrategy {
  level: 'light' | 'moderate' | 'heavy' | 'extreme'
  removeTier3: boolean
  reduceTier2Sets: boolean
  removeSomeTier2: boolean
  reduceWarmup: boolean
  reduceCooldown: boolean
  targetTier2Reduction: number // 0-1
  targetSetReduction: number // 0-1
}

function determineCompressionStrategy(
  targetMinutes: number,
  originalMinutes: number,
  timeBreakdown: TimeBreakdown,
  preserveSkillWork: boolean,
  preserveMainStrength: boolean
): CompressionStrategy {
  const ratio = targetMinutes / originalMinutes
  
  // Light compression (75-100%): Just trim tier 3
  if (ratio >= 0.75) {
    return {
      level: 'light',
      removeTier3: true,
      reduceTier2Sets: false,
      removeSomeTier2: false,
      reduceWarmup: false,
      reduceCooldown: false,
      targetTier2Reduction: 0,
      targetSetReduction: 0,
    }
  }
  
  // Moderate compression (50-75%): Remove tier 3, reduce tier 2
  if (ratio >= 0.5) {
    return {
      level: 'moderate',
      removeTier3: true,
      reduceTier2Sets: true,
      removeSomeTier2: false,
      reduceWarmup: true,
      reduceCooldown: true,
      targetTier2Reduction: 0,
      targetSetReduction: 0.25,
    }
  }
  
  // Heavy compression (35-50%): Keep only essential + some tier 2
  if (ratio >= 0.35) {
    return {
      level: 'heavy',
      removeTier3: true,
      reduceTier2Sets: true,
      removeSomeTier2: true,
      reduceWarmup: true,
      reduceCooldown: true,
      targetTier2Reduction: 0.5,
      targetSetReduction: 0.33,
    }
  }
  
  // Extreme compression (<35%): Only tier 1 essentials
  return {
    level: 'extreme',
    removeTier3: true,
    reduceTier2Sets: true,
    removeSomeTier2: true,
    reduceWarmup: true,
    reduceCooldown: true,
    targetTier2Reduction: 1, // Remove all tier 2
    targetSetReduction: 0.5,
  }
}

// =============================================================================
// APPLY COMPRESSION
// =============================================================================

interface CompressionResult {
  session: AdaptiveSession
  actualMinutes: number
  removedExercises: string[]
  reducedExercises: string[]
}

function applyCompression(
  session: AdaptiveSession,
  strategy: CompressionStrategy,
  classified: ClassifiedExercises
): CompressionResult {
  const removedExercises: string[] = []
  const reducedExercises: string[] = []
  
  // Start with tier 1 (always kept)
  let exercises: AdaptiveExercise[] = [...classified.tier1]
  
  // Handle tier 2
  let tier2ToKeep = [...classified.tier2]
  if (strategy.removeSomeTier2) {
    const keepCount = Math.ceil(tier2ToKeep.length * (1 - strategy.targetTier2Reduction))
    const toRemove = tier2ToKeep.slice(keepCount)
    tier2ToKeep = tier2ToKeep.slice(0, keepCount)
    toRemove.forEach(e => removedExercises.push(e.name))
  }
  
  if (strategy.reduceTier2Sets) {
    tier2ToKeep = tier2ToKeep.map(e => {
      const newSets = Math.max(2, Math.ceil(e.sets * (1 - strategy.targetSetReduction)))
      if (newSets < e.sets) {
        reducedExercises.push(e.name)
      }
      return { ...e, sets: newSets }
    })
  }
  
  exercises = [...exercises, ...tier2ToKeep]
  
  // Handle tier 3
  if (!strategy.removeTier3) {
    exercises = [...exercises, ...classified.tier3]
  } else {
    classified.tier3.forEach(e => removedExercises.push(e.name))
  }
  
  // Handle warmup
  let warmup = [...classified.warmup]
  if (strategy.reduceWarmup && warmup.length > 3) {
    warmup = warmup.slice(0, 3)
  }
  
  // Handle cooldown
  let cooldown = [...classified.cooldown]
  if (strategy.reduceCooldown && cooldown.length > 2) {
    cooldown = cooldown.slice(0, 2)
  }
  
  // Calculate actual time
  const exerciseTime = exercises.reduce((sum, e) => sum + estimateExerciseTime(e), 0)
  const warmupTime = Math.max(MIN_WARMUP_MINUTES, warmup.length * EXERCISE_TIME_ESTIMATES.warmup)
  const cooldownTime = cooldown.length * EXERCISE_TIME_ESTIMATES.cooldown
  const actualMinutes = exerciseTime + warmupTime + cooldownTime
  
  return {
    session: {
      ...session,
      exercises,
      warmup,
      cooldown,
      estimatedMinutes: actualMinutes,
      adaptationNotes: [
        ...(session.adaptationNotes || []),
        `Session optimized for ${actualMinutes} minutes`,
      ],
    },
    actualMinutes,
    removedExercises,
    reducedExercises,
  }
}

// =============================================================================
// EXPANSION (more time available)
// =============================================================================

function handleExpansion(
  session: AdaptiveSession,
  targetMinutes: number,
  originalMinutes: number
): OptimizedSession {
  // If significantly more time available, note it for future consideration
  const extraTime = targetMinutes - originalMinutes
  
  let coachingMessage = 'Session fits within available time.'
  
  if (extraTime >= 15) {
    coachingMessage = 'Extra time available. Consider adding mobility work or additional accessory volume.'
  }
  
  return {
    session,
    wasOptimized: false,
    optimizationType: 'unchanged',
    originalMinutes,
    targetMinutes,
    actualMinutes: originalMinutes,
    removedExercises: [],
    reducedExercises: [],
    explanation: 'Full session fits within available time.',
    coachingMessage,
  }
}

// =============================================================================
// COACHING EXPLANATIONS
// =============================================================================

function generateCompressionExplanation(
  strategy: CompressionStrategy,
  result: CompressionResult
): string {
  const parts: string[] = []
  
  // [trust-polish] ISSUE A: Don't surface internal compression mechanics to users
  // These are expected backend optimizations, not user-relevant events
  if (result.reducedExercises.length > 0) {
    parts.push(`Adjusted volume on ${result.reducedExercises.length} exercise(s)`)
  }
  
  if (strategy.reduceWarmup) {
    parts.push('Streamlined warm-up')
  }
  
  if (parts.length === 0) {
    return 'Minor adjustments applied.'
  }
  
  return parts.join('. ') + '.'
}

function generateCoachingMessage(strategy: CompressionStrategy, targetMinutes: number): string {
  const messages: Record<CompressionStrategy['level'], string> = {
    light: `Workout optimized for ${targetMinutes} minutes. All essential work preserved.`,
    moderate: `Session focused to fit ${targetMinutes} minutes. Priority exercises kept; accessories trimmed.`,
    heavy: `Condensed session for ${targetMinutes} minutes. Core training maintained; support work reduced.`,
    extreme: `Essential-only session for ${targetMinutes} minutes. Skill and primary strength preserved.`,
  }
  
  return messages[strategy.level]
}

// =============================================================================
// TIME PREFERENCE TRACKING
// =============================================================================

const TIME_PATTERN_STORAGE_KEY = 'spartanlab_time_patterns'

export function saveTimePattern(pattern: TimePattern): void {
  if (typeof window === 'undefined') return
  
  const stored = localStorage.getItem(TIME_PATTERN_STORAGE_KEY)
  const patterns: TimePattern[] = stored ? JSON.parse(stored) : []
  
  patterns.push(pattern)
  
  // Keep last 90 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const filtered = patterns.filter(p => new Date(p.date) > cutoff)
  
  localStorage.setItem(TIME_PATTERN_STORAGE_KEY, JSON.stringify(filtered))
}

export function getTimePreferenceHistory(): TimePreferenceHistory {
  if (typeof window === 'undefined') {
    return {
      patterns: [],
      avgRequestedTime: 60,
      compressionFrequency: 0,
      expansionFrequency: 0,
      preferredTier: 60,
      lastUpdated: new Date().toISOString(),
    }
  }
  
  const stored = localStorage.getItem(TIME_PATTERN_STORAGE_KEY)
  const patterns: TimePattern[] = stored ? JSON.parse(stored) : []
  
  if (patterns.length === 0) {
    return {
      patterns: [],
      avgRequestedTime: 60,
      compressionFrequency: 0,
      expansionFrequency: 0,
      preferredTier: 60,
      lastUpdated: new Date().toISOString(),
    }
  }
  
  const avgTime = patterns.reduce((sum, p) => sum + p.requestedMinutes, 0) / patterns.length
  const compressions = patterns.filter(p => p.wasCompressed).length
  const expansions = patterns.filter(p => p.wasExpanded).length
  
  // Find closest tier
  const preferredTier = TIME_TIERS.reduce((closest, tier) => {
    return Math.abs(tier - avgTime) < Math.abs(closest - avgTime) ? tier : closest
  }, 60 as TimeTier)
  
  return {
    patterns,
    avgRequestedTime: Math.round(avgTime),
    compressionFrequency: compressions / patterns.length,
    expansionFrequency: expansions / patterns.length,
    preferredTier,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get suggested session length based on history
 */
export function getSuggestedSessionLength(): { tier: TimeTier; reason: string } {
  const history = getTimePreferenceHistory()
  
  // Default if no history
  if (history.patterns.length < 5) {
    return {
      tier: 60,
      reason: 'Standard session length',
    }
  }
  
  // If user frequently compresses, suggest shorter default
  if (history.compressionFrequency > 0.4) {
    const shorterTier = Math.max(30, history.preferredTier - 15) as TimeTier
    return {
      tier: TIME_TIERS.includes(shorterTier) ? shorterTier : history.preferredTier,
      reason: 'Based on your typical available time',
    }
  }
  
  return {
    tier: history.preferredTier,
    reason: 'Based on your training patterns',
  }
}
