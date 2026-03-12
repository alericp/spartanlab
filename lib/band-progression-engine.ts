// Band Progression Engine
// Tracks resistance band usage for assisted calisthenics movements
// Enables future progression analysis to determine when to reduce assistance

// =============================================================================
// BAND TYPES & MODELS
// =============================================================================

/**
 * Standard resistance band colors representing increasing assistance
 * Order: least assistance -> most assistance
 */
export type ResistanceBandColor = 
  | 'yellow'   // Lightest - minimal assistance
  | 'red'      // Light
  | 'black'    // Medium-light
  | 'purple'   // Medium
  | 'green'    // Medium-heavy
  | 'blue'     // Heavy - maximum assistance

/**
 * Band assistance levels (numeric for comparison)
 */
export const BAND_ASSISTANCE_LEVEL: Record<ResistanceBandColor, number> = {
  yellow: 1,
  red: 2,
  black: 3,
  purple: 4,
  green: 5,
  blue: 6,
}

/**
 * Human-readable band labels
 */
export const BAND_LABELS: Record<ResistanceBandColor, string> = {
  yellow: 'Yellow Band (Lightest)',
  red: 'Red Band (Light)',
  black: 'Black Band (Medium-Light)',
  purple: 'Purple Band (Medium)',
  green: 'Green Band (Medium-Heavy)',
  blue: 'Blue Band (Heavy)',
}

/**
 * Short band labels for compact display
 */
export const BAND_SHORT_LABELS: Record<ResistanceBandColor, string> = {
  yellow: 'Yellow',
  red: 'Red',
  black: 'Black',
  purple: 'Purple',
  green: 'Green',
  blue: 'Blue',
}

/**
 * Band colors for UI styling
 */
export const BAND_COLORS: Record<ResistanceBandColor, { bg: string; text: string; border: string }> = {
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
  black: { bg: 'bg-neutral-500/20', text: 'text-neutral-300', border: 'border-neutral-500/40' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
}

/**
 * All band colors in order (least to most assistance)
 */
export const ALL_BAND_COLORS: ResistanceBandColor[] = ['yellow', 'red', 'black', 'purple', 'green', 'blue']

// =============================================================================
// BAND USAGE DATA STRUCTURES
// =============================================================================

/**
 * Band usage for a single set
 */
export interface BandUsage {
  bandColor?: ResistanceBandColor
  assisted: boolean
}

/**
 * A logged set with optional band information
 */
export interface WorkoutSetLog {
  exerciseId: string
  exerciseName: string
  setNumber: number
  
  // Performance data
  reps?: number
  holdSeconds?: number
  weight?: number // For weighted exercises
  
  // Effort / quality
  rpe?: number // Rate of Perceived Exertion (1-10)
  quality?: 'clean' | 'shaky' | 'failed'
  
  // Band assistance
  band?: BandUsage
  
  // Timestamps
  completedAt: string
}

/**
 * Band history entry for tracking progression over time
 */
export interface BandHistoryEntry {
  id: string
  exerciseId: string
  exerciseName: string
  bandColor: ResistanceBandColor
  reps?: number
  holdSeconds?: number
  quality?: 'clean' | 'shaky' | 'failed'
  rpe?: number // Rate of Perceived Exertion 1-10
  sessionDate: string
  sessionId?: string
  notes?: string
  createdAt: string
}

// =============================================================================
// PROGRESSION INTELLIGENCE TYPES
// =============================================================================

/**
 * Band order from most assistance to least assistance
 */
export const BAND_ORDER: ResistanceBandColor[] = ['blue', 'green', 'purple', 'black', 'red', 'yellow']

/**
 * Progression thresholds
 */
export const PROGRESSION_THRESHOLDS = {
  minSessionsForProgression: 3,    // Minimum sessions before considering band reduction
  maxRPEForProgression: 8,          // Max RPE to consider progression ready
  minCleanSetsRatio: 0.66,          // At least 2/3 clean sets
  stagnationSessionThreshold: 5,    // Sessions without progress = stagnation
  regressionThreshold: 0.5,         // 50% drop in performance triggers regression
  holdTimeProgressionTarget: 8,     // Target hold time in seconds
  repProgressionTarget: 8,          // Target reps for strength exercises
} as const

/**
 * Progression status for an exercise
 */
export type ProgressionStatus = 
  | 'progressing'       // Making progress
  | 'ready_to_reduce'   // Ready to reduce band assistance
  | 'stagnating'        // No progress detected
  | 'regressing'        // Performance dropping
  | 'maintaining'       // Maintaining current level
  | 'new'               // No history yet

/**
 * Detailed progression analysis result
 */
export interface ProgressionAnalysis {
  status: ProgressionStatus
  currentBand: ResistanceBandColor | null
  recommendedBand: ResistanceBandColor | null
  confidence: number // 0-100
  
  // Signals
  signals: {
    recentRPE: number | null
    averageHoldTime: number | null
    averageReps: number | null
    cleanSetRatio: number
    sessionsAtCurrentBand: number
    performanceTrend: 'improving' | 'stable' | 'declining'
  }
  
  // Explanation
  reason: string
  recommendation: string
  
  // Fatigue awareness
  fatigueWarning: boolean
  fatigueReason?: string
}

/**
 * Skill progression pathway step
 */
export interface SkillProgressionStep {
  exerciseId: string
  exerciseName: string
  typicalStartingBand: ResistanceBandColor
  targetBandForProgression: ResistanceBandColor | null // null = unassisted
  nextStep?: string // Next exercise in progression
}

/**
 * Skill progression pathways
 */
export const SKILL_PROGRESSION_PATHWAYS: Record<string, SkillProgressionStep[]> = {
  front_lever: [
    { exerciseId: 'front_lever_tuck', exerciseName: 'Tuck Front Lever', typicalStartingBand: 'purple', targetBandForProgression: 'red', nextStep: 'front_lever_adv_tuck' },
    { exerciseId: 'front_lever_adv_tuck', exerciseName: 'Adv Tuck Front Lever', typicalStartingBand: 'green', targetBandForProgression: 'black', nextStep: 'front_lever_straddle' },
    { exerciseId: 'front_lever_straddle', exerciseName: 'Straddle Front Lever', typicalStartingBand: 'green', targetBandForProgression: 'red', nextStep: 'front_lever_half_lay' },
    { exerciseId: 'front_lever_half_lay', exerciseName: 'Half Lay Front Lever', typicalStartingBand: 'blue', targetBandForProgression: 'black', nextStep: 'front_lever_full' },
    { exerciseId: 'front_lever_full', exerciseName: 'Full Front Lever', typicalStartingBand: 'blue', targetBandForProgression: null },
  ],
  planche: [
    { exerciseId: 'tuck_planche', exerciseName: 'Tuck Planche', typicalStartingBand: 'purple', targetBandForProgression: 'red', nextStep: 'adv_tuck_planche' },
    { exerciseId: 'adv_tuck_planche', exerciseName: 'Adv Tuck Planche', typicalStartingBand: 'green', targetBandForProgression: 'black', nextStep: 'straddle_planche' },
    { exerciseId: 'straddle_planche', exerciseName: 'Straddle Planche', typicalStartingBand: 'blue', targetBandForProgression: 'purple', nextStep: 'full_planche' },
    { exerciseId: 'full_planche', exerciseName: 'Full Planche', typicalStartingBand: 'blue', targetBandForProgression: null },
  ],
  muscle_up: [
    { exerciseId: 'muscle_up_negative', exerciseName: 'Muscle Up Negatives', typicalStartingBand: 'purple', targetBandForProgression: 'red', nextStep: 'muscle_up_transition' },
    { exerciseId: 'muscle_up_transition', exerciseName: 'Muscle Up Transition', typicalStartingBand: 'green', targetBandForProgression: 'black', nextStep: 'muscle_up' },
    { exerciseId: 'muscle_up', exerciseName: 'Muscle Up', typicalStartingBand: 'purple', targetBandForProgression: null },
  ],
  hspu: [
    { exerciseId: 'pike_pushup', exerciseName: 'Pike Push-Up', typicalStartingBand: 'black', targetBandForProgression: null, nextStep: 'wall_hspu' },
    { exerciseId: 'wall_hspu', exerciseName: 'Wall HSPU', typicalStartingBand: 'purple', targetBandForProgression: 'red', nextStep: 'hspu' },
    { exerciseId: 'hspu', exerciseName: 'Freestanding HSPU', typicalStartingBand: 'green', targetBandForProgression: null },
  ],
}

/**
 * Summary of band usage for an exercise
 */
export interface BandProgressionSummary {
  exerciseId: string
  exerciseName: string
  
  // Current status
  currentBand: ResistanceBandColor | null
  lastUsedDate: string | null
  totalSessions: number
  
  // Progression tracking
  bandHistory: {
    bandColor: ResistanceBandColor
    firstUsed: string
    lastUsed: string
    sessionCount: number
    averageReps?: number
    averageHoldSeconds?: number
  }[]
  
  // Progression signals
  progressionReady: boolean
  nextRecommendedBand: ResistanceBandColor | null
  progressionReason?: string
}

// =============================================================================
// EXERCISES THAT SUPPORT BANDS
// =============================================================================

/**
 * Exercise IDs that support band assistance
 */
export const BAND_SUPPORTED_EXERCISES: Set<string> = new Set([
  // Front Lever progressions
  'front_lever_tuck',
  'front_lever_adv_tuck',
  'front_lever_straddle',
  'front_lever_half_lay',
  'front_lever_full',
  'front_lever_raises',
  'front_lever_pulls',
  
  // Planche progressions
  'tuck_planche',
  'adv_tuck_planche',
  'straddle_planche',
  'full_planche',
  'planche_pushup',
  
  // Muscle-up progressions
  'muscle_up',
  'muscle_up_negative',
  'muscle_up_transition',
  'ring_muscle_up',
  
  // Pull-up variations
  'pull_up',
  'chest_to_bar',
  'archer_pullup',
  'one_arm_pullup',
  'typewriter_pullup',
  
  // HSPU progressions
  'hspu',
  'hspu_negative',
  'pike_pushup',
  'wall_hspu',
  
  // Other advanced movements
  'dragon_flag',
  'human_flag',
  'back_lever',
  'iron_cross',
])

/**
 * Check if an exercise supports band assistance
 */
export function supportsBandAssistance(exerciseId: string): boolean {
  return BAND_SUPPORTED_EXERCISES.has(exerciseId)
}

/**
 * Get recommended starting band for an exercise based on difficulty
 */
export function getRecommendedStartingBand(exerciseId: string): ResistanceBandColor | null {
  // High difficulty exercises start with more assistance
  const highDifficulty = [
    'front_lever_full', 'front_lever_straddle', 'full_planche', 'straddle_planche',
    'one_arm_pullup', 'muscle_up', 'ring_muscle_up', 'iron_cross', 'human_flag'
  ]
  
  const mediumDifficulty = [
    'front_lever_half_lay', 'front_lever_adv_tuck', 'adv_tuck_planche',
    'archer_pullup', 'hspu', 'dragon_flag', 'back_lever'
  ]
  
  if (highDifficulty.includes(exerciseId)) {
    return 'green' // Start with heavy assistance
  }
  
  if (mediumDifficulty.includes(exerciseId)) {
    return 'purple' // Medium assistance
  }
  
  if (BAND_SUPPORTED_EXERCISES.has(exerciseId)) {
    return 'black' // Light-medium assistance
  }
  
  return null // Exercise doesn't support bands
}

// =============================================================================
// BAND HISTORY STORAGE
// =============================================================================

const BAND_HISTORY_KEY = 'spartanlab_band_history'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Get all band history entries
 */
export function getBandHistory(): BandHistoryEntry[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(BAND_HISTORY_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

/**
 * Save a band history entry
 */
export function saveBandHistoryEntry(entry: Omit<BandHistoryEntry, 'id' | 'createdAt'>): BandHistoryEntry {
  if (!isBrowser()) {
    return {
      ...entry,
      id: `band-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
  }
  
  const history = getBandHistory()
  
  const newEntry: BandHistoryEntry = {
    ...entry,
    id: `band-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  
  history.push(newEntry)
  localStorage.setItem(BAND_HISTORY_KEY, JSON.stringify(history))
  
  return newEntry
}

/**
 * Get band history for a specific exercise
 */
export function getExerciseBandHistory(exerciseId: string): BandHistoryEntry[] {
  return getBandHistory()
    .filter(e => e.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
}

/**
 * Get the most recent band used for an exercise
 */
export function getLastBandUsed(exerciseId: string): ResistanceBandColor | null {
  const history = getExerciseBandHistory(exerciseId)
  return history[0]?.bandColor || null
}

// =============================================================================
// PROGRESSION ANALYSIS
// =============================================================================

/**
 * Calculate band progression summary for an exercise
 */
export function calculateBandProgressionSummary(exerciseId: string, exerciseName: string): BandProgressionSummary {
  const history = getExerciseBandHistory(exerciseId)
  
  if (history.length === 0) {
    return {
      exerciseId,
      exerciseName,
      currentBand: null,
      lastUsedDate: null,
      totalSessions: 0,
      bandHistory: [],
      progressionReady: false,
      nextRecommendedBand: getRecommendedStartingBand(exerciseId),
      progressionReason: 'No band history recorded',
    }
  }
  
  // Group by band color
  const bandGroups = new Map<ResistanceBandColor, BandHistoryEntry[]>()
  
  for (const entry of history) {
    const existing = bandGroups.get(entry.bandColor) || []
    existing.push(entry)
    bandGroups.set(entry.bandColor, existing)
  }
  
  // Build band history summary
  const bandHistory = Array.from(bandGroups.entries()).map(([bandColor, entries]) => {
    const sorted = entries.sort((a, b) => 
      new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
    )
    
    const repsEntries = entries.filter(e => e.reps !== undefined)
    const holdEntries = entries.filter(e => e.holdSeconds !== undefined)
    
    return {
      bandColor,
      firstUsed: sorted[0].sessionDate,
      lastUsed: sorted[sorted.length - 1].sessionDate,
      sessionCount: entries.length,
      averageReps: repsEntries.length > 0 
        ? Math.round(repsEntries.reduce((sum, e) => sum + (e.reps || 0), 0) / repsEntries.length)
        : undefined,
      averageHoldSeconds: holdEntries.length > 0
        ? Math.round(holdEntries.reduce((sum, e) => sum + (e.holdSeconds || 0), 0) / holdEntries.length)
        : undefined,
    }
  }).sort((a, b) => 
    BAND_ASSISTANCE_LEVEL[a.bandColor] - BAND_ASSISTANCE_LEVEL[b.bandColor]
  )
  
  const currentBand = history[0].bandColor
  const currentBandHistory = bandGroups.get(currentBand) || []
  
  // Determine progression readiness
  const { progressionReady, nextBand, reason } = analyzeProgressionReadiness(
    currentBand,
    currentBandHistory
  )
  
  return {
    exerciseId,
    exerciseName,
    currentBand,
    lastUsedDate: history[0].sessionDate,
    totalSessions: history.length,
    bandHistory,
    progressionReady,
    nextRecommendedBand: nextBand,
    progressionReason: reason,
  }
}

/**
 * Get the next lighter band (less assistance)
 */
export function getNextLighterBand(currentBand: ResistanceBandColor): ResistanceBandColor | null {
  const currentIndex = BAND_ORDER.indexOf(currentBand)
  if (currentIndex === -1 || currentIndex >= BAND_ORDER.length - 1) {
    return null // Already at lightest or invalid
  }
  return BAND_ORDER[currentIndex + 1]
}

/**
 * Get the next heavier band (more assistance)
 */
export function getNextHeavierBand(currentBand: ResistanceBandColor): ResistanceBandColor | null {
  const currentIndex = BAND_ORDER.indexOf(currentBand)
  if (currentIndex <= 0) {
    return null // Already at heaviest or invalid
  }
  return BAND_ORDER[currentIndex - 1]
}

/**
 * Calculate performance trend from recent history
 */
function calculatePerformanceTrend(history: BandHistoryEntry[]): 'improving' | 'stable' | 'declining' {
  if (history.length < 3) return 'stable'
  
  const recent = history.slice(0, 3)
  const older = history.slice(3, 6)
  
  if (older.length === 0) return 'stable'
  
  // Compare average hold times
  const recentHolds = recent.filter(e => e.holdSeconds).map(e => e.holdSeconds!)
  const olderHolds = older.filter(e => e.holdSeconds).map(e => e.holdSeconds!)
  
  if (recentHolds.length > 0 && olderHolds.length > 0) {
    const recentAvg = recentHolds.reduce((a, b) => a + b, 0) / recentHolds.length
    const olderAvg = olderHolds.reduce((a, b) => a + b, 0) / olderHolds.length
    
    if (recentAvg > olderAvg * 1.1) return 'improving'
    if (recentAvg < olderAvg * 0.9) return 'declining'
  }
  
  // Compare average reps
  const recentReps = recent.filter(e => e.reps).map(e => e.reps!)
  const olderReps = older.filter(e => e.reps).map(e => e.reps!)
  
  if (recentReps.length > 0 && olderReps.length > 0) {
    const recentAvg = recentReps.reduce((a, b) => a + b, 0) / recentReps.length
    const olderAvg = olderReps.reduce((a, b) => a + b, 0) / olderReps.length
    
    if (recentAvg > olderAvg * 1.1) return 'improving'
    if (recentAvg < olderAvg * 0.9) return 'declining'
  }
  
  return 'stable'
}

/**
 * Detect stagnation in band progression
 */
function detectStagnation(
  history: BandHistoryEntry[],
  currentBand: ResistanceBandColor
): { isStagnating: boolean; reason: string } {
  const sessionsAtCurrentBand = history.filter(e => e.bandColor === currentBand).length
  
  if (sessionsAtCurrentBand < PROGRESSION_THRESHOLDS.stagnationSessionThreshold) {
    return { isStagnating: false, reason: '' }
  }
  
  // Check if performance is plateaued
  const recentSessions = history.slice(0, 5)
  const holdTimes = recentSessions.filter(e => e.holdSeconds).map(e => e.holdSeconds!)
  const reps = recentSessions.filter(e => e.reps).map(e => e.reps!)
  
  // Check hold time stagnation
  if (holdTimes.length >= 3) {
    const avg = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length
    const variance = holdTimes.reduce((sum, t) => sum + Math.abs(t - avg), 0) / holdTimes.length
    
    // Low variance with not meeting target = stagnation
    if (variance < 1 && avg < PROGRESSION_THRESHOLDS.holdTimeProgressionTarget) {
      return {
        isStagnating: true,
        reason: `Holding steady at ${Math.round(avg)}s for ${sessionsAtCurrentBand} sessions. Consider accessory work to build strength.`,
      }
    }
  }
  
  // Check rep stagnation
  if (reps.length >= 3) {
    const avg = reps.reduce((a, b) => a + b, 0) / reps.length
    const variance = reps.reduce((sum, r) => sum + Math.abs(r - avg), 0) / reps.length
    
    if (variance < 1 && avg < PROGRESSION_THRESHOLDS.repProgressionTarget) {
      return {
        isStagnating: true,
        reason: `Stuck at ${Math.round(avg)} reps for ${sessionsAtCurrentBand} sessions. Focus on building base strength.`,
      }
    }
  }
  
  return { isStagnating: false, reason: '' }
}

/**
 * Detect regression in performance
 */
function detectRegression(history: BandHistoryEntry[]): { isRegressing: boolean; reason: string; suggestedBand: ResistanceBandColor | null } {
  if (history.length < 3) {
    return { isRegressing: false, reason: '', suggestedBand: null }
  }
  
  const recent = history.slice(0, 2)
  const baseline = history.slice(2, 5)
  
  if (baseline.length === 0) {
    return { isRegressing: false, reason: '', suggestedBand: null }
  }
  
  // Check hold time regression
  const recentHolds = recent.filter(e => e.holdSeconds).map(e => e.holdSeconds!)
  const baselineHolds = baseline.filter(e => e.holdSeconds).map(e => e.holdSeconds!)
  
  if (recentHolds.length > 0 && baselineHolds.length > 0) {
    const recentAvg = recentHolds.reduce((a, b) => a + b, 0) / recentHolds.length
    const baselineAvg = baselineHolds.reduce((a, b) => a + b, 0) / baselineHolds.length
    
    if (recentAvg < baselineAvg * PROGRESSION_THRESHOLDS.regressionThreshold) {
      const currentBand = history[0].bandColor
      const heavierBand = getNextHeavierBand(currentBand)
      
      return {
        isRegressing: true,
        reason: `Performance dropped from ${Math.round(baselineAvg)}s to ${Math.round(recentAvg)}s`,
        suggestedBand: heavierBand,
      }
    }
  }
  
  // Check rep regression
  const recentReps = recent.filter(e => e.reps).map(e => e.reps!)
  const baselineReps = baseline.filter(e => e.reps).map(e => e.reps!)
  
  if (recentReps.length > 0 && baselineReps.length > 0) {
    const recentAvg = recentReps.reduce((a, b) => a + b, 0) / recentReps.length
    const baselineAvg = baselineReps.reduce((a, b) => a + b, 0) / baselineReps.length
    
    if (recentAvg < baselineAvg * PROGRESSION_THRESHOLDS.regressionThreshold) {
      const currentBand = history[0].bandColor
      const heavierBand = getNextHeavierBand(currentBand)
      
      return {
        isRegressing: true,
        reason: `Reps dropped from ${Math.round(baselineAvg)} to ${Math.round(recentAvg)}`,
        suggestedBand: heavierBand,
      }
    }
  }
  
  return { isRegressing: false, reason: '', suggestedBand: null }
}

/**
 * Check for fatigue signals that should prevent progression
 */
function checkFatigueSignals(history: BandHistoryEntry[]): { hasFatigueWarning: boolean; reason: string } {
  if (history.length < 2) {
    return { hasFatigueWarning: false, reason: '' }
  }
  
  const recent = history.slice(0, 3)
  
  // Check for high RPE
  const rpeValues = recent.filter(e => e.rpe !== undefined).map(e => e.rpe!)
  if (rpeValues.length > 0) {
    const avgRPE = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
    if (avgRPE >= 9) {
      return {
        hasFatigueWarning: true,
        reason: `High effort level (RPE ${avgRPE.toFixed(1)}) - maintain current assistance until recovered`,
      }
    }
  }
  
  // Check for failed sets
  const failedSets = recent.filter(e => e.quality === 'failed').length
  if (failedSets >= 2) {
    return {
      hasFatigueWarning: true,
      reason: 'Multiple failed sets detected - maintain or increase assistance',
    }
  }
  
  // Check for declining quality
  const recentQuality = recent.filter(e => e.quality).map(e => e.quality!)
  if (recentQuality.length >= 2 && recentQuality.every(q => q === 'shaky' || q === 'failed')) {
    return {
      hasFatigueWarning: true,
      reason: 'Consistent shaky/failed sets - consider recovery before progressing',
    }
  }
  
  return { hasFatigueWarning: false, reason: '' }
}

/**
 * Full progression analysis with intelligence
 */
export function analyzeProgression(exerciseId: string, exerciseName: string): ProgressionAnalysis {
  const history = getExerciseBandHistory(exerciseId)
  
  // No history
  if (history.length === 0) {
    const startingBand = getRecommendedStartingBand(exerciseId)
    return {
      status: 'new',
      currentBand: null,
      recommendedBand: startingBand,
      confidence: 50,
      signals: {
        recentRPE: null,
        averageHoldTime: null,
        averageReps: null,
        cleanSetRatio: 0,
        sessionsAtCurrentBand: 0,
        performanceTrend: 'stable',
      },
      reason: 'No training history recorded',
      recommendation: startingBand 
        ? `Start with ${BAND_SHORT_LABELS[startingBand]} band for this exercise`
        : 'Try this exercise unassisted first',
      fatigueWarning: false,
    }
  }
  
  const currentBand = history[0].bandColor
  const currentBandHistory = history.filter(e => e.bandColor === currentBand)
  
  // Calculate signals
  const recentSessions = history.slice(0, 5)
  const rpeValues = recentSessions.filter(e => e.rpe !== undefined).map(e => e.rpe!)
  const holdTimes = recentSessions.filter(e => e.holdSeconds).map(e => e.holdSeconds!)
  const reps = recentSessions.filter(e => e.reps).map(e => e.reps!)
  const cleanSets = recentSessions.filter(e => e.quality === 'clean').length
  
  const signals = {
    recentRPE: rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null,
    averageHoldTime: holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : null,
    averageReps: reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : null,
    cleanSetRatio: recentSessions.length > 0 ? cleanSets / recentSessions.length : 0,
    sessionsAtCurrentBand: currentBandHistory.length,
    performanceTrend: calculatePerformanceTrend(history),
  }
  
  // Check fatigue first
  const fatigue = checkFatigueSignals(history)
  
  // Check regression
  const regression = detectRegression(history)
  if (regression.isRegressing) {
    return {
      status: 'regressing',
      currentBand,
      recommendedBand: regression.suggestedBand || currentBand,
      confidence: 75,
      signals,
      reason: regression.reason,
      recommendation: regression.suggestedBand 
        ? `Consider temporarily using ${BAND_SHORT_LABELS[regression.suggestedBand]} band while recovering`
        : 'Maintain current band and focus on recovery',
      fatigueWarning: fatigue.hasFatigueWarning,
      fatigueReason: fatigue.reason,
    }
  }
  
  // Check stagnation
  const stagnation = detectStagnation(history, currentBand)
  if (stagnation.isStagnating) {
    return {
      status: 'stagnating',
      currentBand,
      recommendedBand: currentBand,
      confidence: 70,
      signals,
      reason: stagnation.reason,
      recommendation: 'Focus on accessory strength work and ensure adequate recovery',
      fatigueWarning: fatigue.hasFatigueWarning,
      fatigueReason: fatigue.reason,
    }
  }
  
  // Check if ready to progress (but fatigue blocks it)
  if (fatigue.hasFatigueWarning) {
    return {
      status: 'maintaining',
      currentBand,
      recommendedBand: currentBand,
      confidence: 65,
      signals,
      reason: fatigue.reason,
      recommendation: 'Maintain current assistance until fatigue subsides',
      fatigueWarning: true,
      fatigueReason: fatigue.reason,
    }
  }
  
  // Check progression readiness
  const progressionResult = analyzeProgressionReadiness(currentBand, currentBandHistory)
  
  if (progressionResult.progressionReady && progressionResult.nextBand) {
    return {
      status: 'ready_to_reduce',
      currentBand,
      recommendedBand: progressionResult.nextBand,
      confidence: 85,
      signals,
      reason: progressionResult.reason,
      recommendation: `You have consistently exceeded targets with moderate effort. Try ${BAND_SHORT_LABELS[progressionResult.nextBand]} band to progress toward the next skill level.`,
      fatigueWarning: false,
    }
  }
  
  if (progressionResult.progressionReady && !progressionResult.nextBand) {
    return {
      status: 'ready_to_reduce',
      currentBand,
      recommendedBand: null,
      confidence: 90,
      signals,
      reason: 'Minimum assistance reached',
      recommendation: 'Ready to attempt this movement unassisted. Great progress!',
      fatigueWarning: false,
    }
  }
  
  // Still building
  return {
    status: signals.performanceTrend === 'improving' ? 'progressing' : 'maintaining',
    currentBand,
    recommendedBand: currentBand,
    confidence: 60,
    signals,
    reason: progressionResult.reason,
    recommendation: `Continue training with ${BAND_SHORT_LABELS[currentBand]} band`,
    fatigueWarning: false,
  }
}

/**
 * Analyze if athlete is ready to progress to less assistance (legacy function - now uses full analysis)
 */
function analyzeProgressionReadiness(
  currentBand: ResistanceBandColor,
  recentHistory: BandHistoryEntry[]
): { progressionReady: boolean; nextBand: ResistanceBandColor | null; reason: string } {
  // Need at least 3 sessions with current band
  if (recentHistory.length < PROGRESSION_THRESHOLDS.minSessionsForProgression) {
    return {
      progressionReady: false,
      nextBand: null,
      reason: `Need ${PROGRESSION_THRESHOLDS.minSessionsForProgression - recentHistory.length} more session(s) with ${BAND_SHORT_LABELS[currentBand]} band`,
    }
  }
  
  // Check last 3-5 sessions
  const sessionWindow = Math.min(recentHistory.length, 5)
  const recentSessions = recentHistory.slice(0, sessionWindow)
  
  // Check quality - need mostly clean sets
  const cleanSets = recentSessions.filter(e => e.quality === 'clean').length
  const cleanRatio = cleanSets / recentSessions.length
  
  if (cleanRatio < PROGRESSION_THRESHOLDS.minCleanSetsRatio) {
    return {
      progressionReady: false,
      nextBand: null,
      reason: 'Need more clean sets before reducing assistance',
    }
  }
  
  // Check for failed sets
  const hasFailed = recentSessions.some(e => e.quality === 'failed')
  if (hasFailed) {
    return {
      progressionReady: false,
      nextBand: null,
      reason: 'Recent failed sets - maintain current assistance',
    }
  }
  
  // Check RPE if available
  const rpeValues = recentSessions.filter(e => e.rpe !== undefined).map(e => e.rpe!)
  if (rpeValues.length > 0) {
    const avgRPE = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
    if (avgRPE > PROGRESSION_THRESHOLDS.maxRPEForProgression) {
      return {
        progressionReady: false,
        nextBand: null,
        reason: `Effort still high (RPE ${avgRPE.toFixed(1)}) - build more comfort before reducing assistance`,
      }
    }
  }
  
  // Check hold time / rep targets
  const holdTimes = recentSessions.filter(e => e.holdSeconds).map(e => e.holdSeconds!)
  if (holdTimes.length > 0) {
    const avgHold = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length
    if (avgHold < PROGRESSION_THRESHOLDS.holdTimeProgressionTarget) {
      return {
        progressionReady: false,
        nextBand: null,
        reason: `Build hold time to ${PROGRESSION_THRESHOLDS.holdTimeProgressionTarget}s before reducing assistance`,
      }
    }
  }
  
  const reps = recentSessions.filter(e => e.reps).map(e => e.reps!)
  if (reps.length > 0) {
    const avgReps = reps.reduce((a, b) => a + b, 0) / reps.length
    if (avgReps < PROGRESSION_THRESHOLDS.repProgressionTarget) {
      return {
        progressionReady: false,
        nextBand: null,
        reason: `Build to ${PROGRESSION_THRESHOLDS.repProgressionTarget} reps before reducing assistance`,
      }
    }
  }
  
  // Ready to progress!
  const nextBand = getNextLighterBand(currentBand)
  
  if (!nextBand) {
    return {
      progressionReady: true,
      nextBand: null,
      reason: 'Minimum assistance reached - ready to attempt unassisted',
    }
  }
  
  return {
    progressionReady: true,
    nextBand,
    reason: `Consistent clean sets with controlled effort - ready to try ${BAND_SHORT_LABELS[nextBand]} band`,
  }
}

// =============================================================================
// PROGRAM BUILDER INTEGRATION
// =============================================================================

/**
 * Get band recommendation for program builder
 */
export interface BandRecommendation {
  exerciseId: string
  recommendedBand: ResistanceBandColor | null
  isRequired: boolean
  reason: string
}

/**
 * Get band recommendation for an exercise
 */
export function getBandRecommendation(exerciseId: string, exerciseName: string): BandRecommendation {
  // Check if exercise supports bands
  if (!supportsBandAssistance(exerciseId)) {
    return {
      exerciseId,
      recommendedBand: null,
      isRequired: false,
      reason: 'Exercise does not use band assistance',
    }
  }
  
  // Get last used band
  const lastBand = getLastBandUsed(exerciseId)
  
  if (lastBand) {
    // Check progression status
    const summary = calculateBandProgressionSummary(exerciseId, exerciseName)
    
    if (summary.progressionReady && summary.nextRecommendedBand) {
      return {
        exerciseId,
        recommendedBand: summary.nextRecommendedBand,
        isRequired: false,
        reason: `Ready to progress from ${BAND_SHORT_LABELS[lastBand]} to ${BAND_SHORT_LABELS[summary.nextRecommendedBand]}`,
      }
    }
    
    return {
      exerciseId,
      recommendedBand: lastBand,
      isRequired: false,
      reason: `Continue with ${BAND_SHORT_LABELS[lastBand]} band`,
    }
  }
  
  // No history - recommend starting band
  const startingBand = getRecommendedStartingBand(exerciseId)
  
  return {
    exerciseId,
    recommendedBand: startingBand,
    isRequired: false,
    reason: startingBand 
      ? `Recommended starting assistance: ${BAND_SHORT_LABELS[startingBand]}`
      : 'Try unassisted first',
  }
}

// =============================================================================
// LOGGING HELPERS
// =============================================================================

/**
 * Log a set with band usage
 */
export function logSetWithBand(
  exerciseId: string,
  exerciseName: string,
  setData: {
    reps?: number
    holdSeconds?: number
    quality?: 'clean' | 'shaky' | 'failed'
    rpe?: number // Rate of Perceived Exertion 1-10
    bandColor?: ResistanceBandColor
    sessionId?: string
    notes?: string
  }
): BandHistoryEntry | null {
  // Only log if band was used
  if (!setData.bandColor) {
    return null
  }
  
  return saveBandHistoryEntry({
    exerciseId,
    exerciseName,
    bandColor: setData.bandColor,
    reps: setData.reps,
    holdSeconds: setData.holdSeconds,
    quality: setData.quality,
    rpe: setData.rpe,
    sessionDate: new Date().toISOString().split('T')[0],
    sessionId: setData.sessionId,
    notes: setData.notes,
  })
}

/**
 * Create a BandUsage object
 */
export function createBandUsage(bandColor?: ResistanceBandColor): BandUsage {
  return {
    bandColor,
    assisted: bandColor !== undefined,
  }
}

// =============================================================================
// PROGRAM BUILDER HELPERS
// =============================================================================

/**
 * Enhance exercise with band recommendation for program builder
 */
export interface ExerciseWithBandRecommendation {
  exerciseId: string
  exerciseName: string
  supportsBandAssistance: boolean
  recommendedBand: ResistanceBandColor | null
  lastUsedBand: ResistanceBandColor | null
  progressionReady: boolean
  bandReason: string
}

/**
 * Get band information for an exercise in program builder
 */
export function getExerciseBandInfo(exerciseId: string, exerciseName: string): ExerciseWithBandRecommendation {
  const supportsBands = supportsBandAssistance(exerciseId)
  
  if (!supportsBands) {
    return {
      exerciseId,
      exerciseName,
      supportsBandAssistance: false,
      recommendedBand: null,
      lastUsedBand: null,
      progressionReady: false,
      bandReason: 'Exercise does not use band assistance',
    }
  }
  
  const recommendation = getBandRecommendation(exerciseId, exerciseName)
  const lastBand = getLastBandUsed(exerciseId)
  const summary = calculateBandProgressionSummary(exerciseId, exerciseName)
  
  return {
    exerciseId,
    exerciseName,
    supportsBandAssistance: true,
    recommendedBand: recommendation.recommendedBand,
    lastUsedBand: lastBand,
    progressionReady: summary.progressionReady,
    bandReason: recommendation.reason,
  }
}

/**
 * Get all exercises with band info for a workout
 */
export function getWorkoutBandInfo(
  exercises: Array<{ id: string; name: string }>
): ExerciseWithBandRecommendation[] {
  return exercises.map(ex => getExerciseBandInfo(ex.id, ex.name))
}

/**
 * Clear band history (for testing/reset)
 */
export function clearBandHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BAND_HISTORY_KEY)
  }
}

// =============================================================================
// SKILL PROGRESSION PATHWAY INTEGRATION
// =============================================================================

/**
 * Get the skill pathway for an exercise
 */
export function getSkillPathway(exerciseId: string): { pathway: string; step: SkillProgressionStep } | null {
  for (const [pathway, steps] of Object.entries(SKILL_PROGRESSION_PATHWAYS)) {
    const step = steps.find(s => s.exerciseId === exerciseId)
    if (step) {
      return { pathway, step }
    }
  }
  return null
}

/**
 * Get the next step in a skill progression pathway
 */
export function getNextSkillStep(exerciseId: string): SkillProgressionStep | null {
  const current = getSkillPathway(exerciseId)
  if (!current || !current.step.nextStep) {
    return null
  }
  
  const pathway = SKILL_PROGRESSION_PATHWAYS[current.pathway]
  return pathway.find(s => s.exerciseId === current.step.nextStep) || null
}

/**
 * Check if athlete is ready to progress to next skill variation
 */
export function checkSkillProgressionReadiness(exerciseId: string, exerciseName: string): {
  ready: boolean
  currentStep: SkillProgressionStep | null
  nextStep: SkillProgressionStep | null
  reason: string
  recommendation: string
} {
  const current = getSkillPathway(exerciseId)
  
  if (!current) {
    return {
      ready: false,
      currentStep: null,
      nextStep: null,
      reason: 'Exercise not part of a skill progression pathway',
      recommendation: 'Continue training this exercise',
    }
  }
  
  const analysis = analyzeProgression(exerciseId, exerciseName)
  const nextStep = getNextSkillStep(exerciseId)
  
  // Check if band assistance has been sufficiently reduced
  const targetBand = current.step.targetBandForProgression
  
  if (targetBand === null) {
    // Target is unassisted
    if (analysis.currentBand === null || analysis.status === 'ready_to_reduce') {
      return {
        ready: true,
        currentStep: current.step,
        nextStep,
        reason: 'Ready to attempt unassisted',
        recommendation: nextStep 
          ? `Consider progressing to ${nextStep.exerciseName} with ${BAND_SHORT_LABELS[nextStep.typicalStartingBand]} band`
          : 'You have mastered this progression!',
      }
    }
  } else if (analysis.currentBand) {
    const currentLevel = BAND_ASSISTANCE_LEVEL[analysis.currentBand]
    const targetLevel = BAND_ASSISTANCE_LEVEL[targetBand]
    
    if (currentLevel <= targetLevel && analysis.status === 'ready_to_reduce') {
      return {
        ready: true,
        currentStep: current.step,
        nextStep,
        reason: `Reached target band (${BAND_SHORT_LABELS[targetBand]}) with good consistency`,
        recommendation: nextStep
          ? `Ready to try ${nextStep.exerciseName} starting with ${BAND_SHORT_LABELS[nextStep.typicalStartingBand]} band`
          : 'Continue building strength at this progression',
      }
    }
  }
  
  return {
    ready: false,
    currentStep: current.step,
    nextStep,
    reason: analysis.reason,
    recommendation: analysis.recommendation,
  }
}

// =============================================================================
// ENHANCED PROGRAM BUILDER INTEGRATION
// =============================================================================

/**
 * Full band analysis for program builder
 */
export interface ProgramBuilderBandAnalysis {
  exerciseId: string
  exerciseName: string
  supportsBandAssistance: boolean
  
  // Recommendation
  recommendedBand: ResistanceBandColor | null
  recommendationReason: string
  userCanOverride: boolean
  
  // Status
  progressionStatus: ProgressionStatus
  progressionAnalysis: ProgressionAnalysis | null
  
  // Skill pathway
  isPartOfSkillPathway: boolean
  skillPathwayInfo: {
    pathway: string
    currentStep: string
    nextStep: string | null
    readyForNextStep: boolean
  } | null
  
  // Display
  displayLabel: string
  statusColor: 'green' | 'yellow' | 'orange' | 'red' | 'gray'
}

/**
 * Get full band analysis for program builder
 */
export function getProgramBuilderBandAnalysis(exerciseId: string, exerciseName: string): ProgramBuilderBandAnalysis {
  const supportsBands = supportsBandAssistance(exerciseId)
  
  if (!supportsBands) {
    return {
      exerciseId,
      exerciseName,
      supportsBandAssistance: false,
      recommendedBand: null,
      recommendationReason: 'Exercise does not use band assistance',
      userCanOverride: true,
      progressionStatus: 'new',
      progressionAnalysis: null,
      isPartOfSkillPathway: false,
      skillPathwayInfo: null,
      displayLabel: 'No Band',
      statusColor: 'gray',
    }
  }
  
  const analysis = analyzeProgression(exerciseId, exerciseName)
  const skillReadiness = checkSkillProgressionReadiness(exerciseId, exerciseName)
  
  // Determine status color
  let statusColor: 'green' | 'yellow' | 'orange' | 'red' | 'gray' = 'gray'
  switch (analysis.status) {
    case 'ready_to_reduce':
      statusColor = 'green'
      break
    case 'progressing':
      statusColor = 'green'
      break
    case 'maintaining':
      statusColor = 'yellow'
      break
    case 'stagnating':
      statusColor = 'orange'
      break
    case 'regressing':
      statusColor = 'red'
      break
  }
  
  // Build display label
  let displayLabel = analysis.recommendedBand 
    ? BAND_SHORT_LABELS[analysis.recommendedBand]
    : 'No Band'
  
  if (analysis.status === 'ready_to_reduce') {
    displayLabel += ' (Ready to progress)'
  }
  
  return {
    exerciseId,
    exerciseName,
    supportsBandAssistance: true,
    recommendedBand: analysis.recommendedBand,
    recommendationReason: analysis.recommendation,
    userCanOverride: true, // Users always retain control
    progressionStatus: analysis.status,
    progressionAnalysis: analysis,
    isPartOfSkillPathway: skillReadiness.currentStep !== null,
    skillPathwayInfo: skillReadiness.currentStep ? {
      pathway: getSkillPathway(exerciseId)?.pathway || '',
      currentStep: skillReadiness.currentStep.exerciseName,
      nextStep: skillReadiness.nextStep?.exerciseName || null,
      readyForNextStep: skillReadiness.ready,
    } : null,
    displayLabel,
    statusColor,
  }
}

/**
 * Log set with band and get updated recommendation
 */
export function logSetAndAnalyze(
  exerciseId: string,
  exerciseName: string,
  setData: {
    reps?: number
    holdSeconds?: number
    quality?: 'clean' | 'shaky' | 'failed'
    rpe?: number
    bandColor?: ResistanceBandColor
    sessionId?: string
    notes?: string
  }
): { entry: BandHistoryEntry | null; analysis: ProgressionAnalysis } {
  // Log the set
  const entry = logSetWithBand(exerciseId, exerciseName, setData)
  
  // Get updated analysis
  const analysis = analyzeProgression(exerciseId, exerciseName)
  
  return { entry, analysis }
}

/**
 * Get brief progression summary for UI display
 */
export function getProgressionSummaryText(analysis: ProgressionAnalysis): string {
  switch (analysis.status) {
    case 'ready_to_reduce':
      return analysis.recommendedBand 
        ? `Ready for ${BAND_SHORT_LABELS[analysis.recommendedBand]} band`
        : 'Ready to go unassisted!'
    case 'progressing':
      return 'Making good progress'
    case 'maintaining':
      return 'Building consistency'
    case 'stagnating':
      return 'Consider accessory work'
    case 'regressing':
      return 'Focus on recovery'
    case 'new':
      return 'Start tracking progress'
    default:
      return 'Continue training'
  }
}
