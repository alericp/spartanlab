/**
 * Session Feedback Service
 * 
 * Lightweight session-level feedback capture for fatigue + recovery adaptation.
 * Integrates with the existing fatigue-engine and recovery-fatigue-engine.
 * 
 * All operations are safely wrapped and will never throw.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SessionFeedback {
  /** Unique session ID (typically workout log ID) */
  sessionId: string
  /** User-reported difficulty */
  difficulty?: 'easy' | 'normal' | 'hard'
  /** Regional soreness levels (0-5 scale) */
  soreness?: {
    push?: number   // Chest, shoulders, triceps
    pull?: number   // Back, biceps
    core?: number   // Abs, obliques, lower back
    legs?: number   // Quads, hamstrings, glutes
  }
  /** Whether the session was fully completed */
  completed?: boolean
  /** Average RPE for the session (1-10) */
  averageRPE?: number
  /** Timestamp when feedback was recorded */
  timestamp: number
  /** Optional notes */
  notes?: string
  /** FEEDBACK LOOP: Whether this feedback is from a trusted (non-demo) session */
  trusted?: boolean
}

export interface FatigueStateFromFeedback {
  /** Overall fatigue score (0-10) */
  fatigueScore: number
  /** Trend direction */
  trend: 'improving' | 'stable' | 'worsening'
  /** Whether a deload is recommended */
  needsDeload: boolean
  /** Intensity modifier (0.85-1.1) - multiply target intensity */
  intensityModifier: number
  /** Volume modifier (0.8-1.1) - multiply target volume */
  volumeModifier: number
  /** Confidence level based on data availability */
  confidence: 'low' | 'medium' | 'high'
  /** Human-readable summary */
  summary: string
}

// =============================================================================
// STORAGE
// =============================================================================

const SESSION_FEEDBACK_KEY = 'spartanlab_session_feedback'
const MAX_FEEDBACK_ENTRIES = 30 // Keep last 30 sessions

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Save session feedback to localStorage
 * Safe - will never throw
 */
export function saveSessionFeedback(sessionId: string, feedback: Omit<SessionFeedback, 'sessionId' | 'timestamp'>): boolean {
  if (!isBrowser()) return false
  
  try {
    const stored = localStorage.getItem(SESSION_FEEDBACK_KEY)
    let entries: SessionFeedback[] = []
    
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        entries = parsed
      }
    }
    
    // Create new entry
    const newEntry: SessionFeedback = {
      ...feedback,
      sessionId,
      timestamp: Date.now(),
    }
    
    // Check if entry for this session already exists and update it
    const existingIndex = entries.findIndex(e => e.sessionId === sessionId)
    if (existingIndex >= 0) {
      entries[existingIndex] = newEntry
    } else {
      entries.push(newEntry)
    }
    
    // Keep only recent entries
    if (entries.length > MAX_FEEDBACK_ENTRIES) {
      entries = entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_FEEDBACK_ENTRIES)
    }
    
    localStorage.setItem(SESSION_FEEDBACK_KEY, JSON.stringify(entries))
    return true
  } catch (err) {
    console.warn('[SessionFeedback] Failed to save feedback:', err)
    return false
  }
}

/**
 * Get recent session feedback entries
 * Safe - will always return an array
 */
export function getRecentSessionFeedback(limit: number = 10): SessionFeedback[] {
  if (!isBrowser()) return []
  
  try {
    const stored = localStorage.getItem(SESSION_FEEDBACK_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    
    // Validate and filter entries
    const valid = parsed.filter((entry): entry is SessionFeedback => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.sessionId === 'string' &&
        typeof entry.timestamp === 'number'
      )
    })
    
    // Sort by timestamp descending (most recent first)
    return valid
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  } catch (err) {
    console.warn('[SessionFeedback] Failed to get feedback:', err)
    return []
  }
}

/**
 * Get feedback for a specific session
 */
export function getSessionFeedback(sessionId: string): SessionFeedback | null {
  if (!isBrowser()) return null
  
  try {
    const entries = getRecentSessionFeedback(MAX_FEEDBACK_ENTRIES)
    return entries.find(e => e.sessionId === sessionId) ?? null
  } catch {
    return null
  }
}

/**
 * Clear all session feedback (for testing/reset)
 */
export function clearSessionFeedback(): void {
  if (!isBrowser()) return
  
  try {
    localStorage.removeItem(SESSION_FEEDBACK_KEY)
  } catch {
    // Ignore
  }
}

// =============================================================================
// FATIGUE STATE COMPUTATION
// =============================================================================

/**
 * Compute fatigue state from recent session feedback
 * 
 * This is the core algorithm that translates user feedback into actionable modifiers.
 * 
 * FEEDBACK LOOP: Only uses trusted feedback (real user data, not demo/debug)
 * to ensure fatigue decisions are based on actual performance.
 * 
 * Difficulty scoring:
 * - easy = +1 fatigue point
 * - normal = +2 fatigue points
 * - hard = +3 fatigue points
 * 
 * Soreness contribution:
 * - Average of all reported areas (0-5 scale) contributes up to +3 points
 * 
 * Total clamped to 0-10
 */
export function computeFatigueStateFromFeedback(feedbackList?: SessionFeedback[]): FatigueStateFromFeedback {
  // Default neutral state when no feedback
  const neutralState: FatigueStateFromFeedback = {
    fatigueScore: 3, // Slightly above zero to assume some baseline fatigue
    trend: 'stable',
    needsDeload: false,
    intensityModifier: 1.0,
    volumeModifier: 1.0,
    confidence: 'low',
    summary: 'No recent feedback available. Training normally.',
  }
  
  const rawEntries = feedbackList ?? getRecentSessionFeedback(10)
  
  // Filter to trusted entries only
  const entries = rawEntries.filter(e => e.trusted !== false)
  
  if (entries.length === 0) {
    return neutralState
  }
  
  // Calculate fatigue from recent sessions (last 7 days)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  const recentEntries = entries.filter(e => e.timestamp >= sevenDaysAgo)
  
  if (recentEntries.length === 0) {
    return neutralState
  }
  
  // Calculate difficulty contribution
  let difficultyScore = 0
  let difficultyCount = 0
  let hardSessionStreak = 0
  let maxHardStreak = 0
  
  for (const entry of recentEntries) {
    if (entry.difficulty) {
      difficultyCount++
      switch (entry.difficulty) {
        case 'easy':
          difficultyScore += 1
          hardSessionStreak = 0
          break
        case 'normal':
          difficultyScore += 2
          hardSessionStreak = 0
          break
        case 'hard':
          difficultyScore += 3
          hardSessionStreak++
          maxHardStreak = Math.max(maxHardStreak, hardSessionStreak)
          break
      }
    }
  }
  
  // Calculate soreness contribution
  let sorenessScore = 0
  let sorenessCount = 0
  
  for (const entry of recentEntries) {
    if (entry.soreness) {
      const areas = [
        entry.soreness.push,
        entry.soreness.pull,
        entry.soreness.core,
        entry.soreness.legs,
      ].filter((v): v is number => typeof v === 'number')
      
      if (areas.length > 0) {
        const avgSoreness = areas.reduce((sum, v) => sum + v, 0) / areas.length
        sorenessScore += avgSoreness
        sorenessCount++
      }
    }
  }
  
  // Compute final fatigue score
  const avgDifficulty = difficultyCount > 0 ? difficultyScore / difficultyCount : 2
  const avgSoreness = sorenessCount > 0 ? sorenessScore / sorenessCount : 0
  
  // Scale: difficulty (1-3) * 2 + soreness (0-5) * 0.6 = roughly 0-10
  let fatigueScore = (avgDifficulty * 2) + (avgSoreness * 0.6)
  fatigueScore = Math.max(0, Math.min(10, fatigueScore))
  
  // Determine trend by comparing first half vs second half of recent entries
  let trend: FatigueStateFromFeedback['trend'] = 'stable'
  if (recentEntries.length >= 4) {
    const midpoint = Math.floor(recentEntries.length / 2)
    const olderEntries = recentEntries.slice(midpoint)
    const newerEntries = recentEntries.slice(0, midpoint)
    
    const olderAvg = calculateAverageDifficulty(olderEntries)
    const newerAvg = calculateAverageDifficulty(newerEntries)
    
    if (newerAvg > olderAvg + 0.5) {
      trend = 'worsening'
    } else if (newerAvg < olderAvg - 0.5) {
      trend = 'improving'
    }
  }
  
  // Determine if deload is needed
  const needsDeload = fatigueScore >= 8 || maxHardStreak >= 3
  
  // Calculate modifiers
  let intensityModifier = 1.0
  let volumeModifier = 1.0
  
  if (fatigueScore >= 8) {
    // High fatigue - significant reduction
    intensityModifier = 0.85
    volumeModifier = 0.7
  } else if (fatigueScore >= 6) {
    // Elevated fatigue - moderate reduction
    intensityModifier = 0.92
    volumeModifier = 0.85
  } else if (fatigueScore >= 4) {
    // Normal fatigue - slight reduction
    intensityModifier = 0.97
    volumeModifier = 0.95
  } else if (fatigueScore < 3) {
    // Low fatigue - can push slightly
    intensityModifier = 1.05
    volumeModifier = 1.05
  }
  
  // Determine confidence
  let confidence: FatigueStateFromFeedback['confidence'] = 'low'
  if (recentEntries.length >= 5) {
    confidence = 'high'
  } else if (recentEntries.length >= 3) {
    confidence = 'medium'
  }
  
  // Generate summary
  let summary: string
  if (needsDeload) {
    summary = 'Fatigue is high. A deload or lighter session is recommended.'
  } else if (fatigueScore >= 6) {
    summary = 'Elevated fatigue detected. Consider reducing volume slightly.'
  } else if (fatigueScore < 3) {
    summary = 'Well recovered. Ready to push harder if desired.'
  } else {
    summary = 'Normal fatigue levels. Training as planned.'
  }
  
  return {
    fatigueScore: Math.round(fatigueScore * 10) / 10,
    trend,
    needsDeload,
    intensityModifier: Math.round(intensityModifier * 100) / 100,
    volumeModifier: Math.round(volumeModifier * 100) / 100,
    confidence,
    summary,
  }
}

/**
 * Helper to calculate average difficulty score from entries
 */
function calculateAverageDifficulty(entries: SessionFeedback[]): number {
  if (entries.length === 0) return 2
  
  let total = 0
  let count = 0
  
  for (const entry of entries) {
    if (entry.difficulty) {
      count++
      switch (entry.difficulty) {
        case 'easy': total += 1; break
        case 'normal': total += 2; break
        case 'hard': total += 3; break
      }
    }
  }
  
  return count > 0 ? total / count : 2
}

// =============================================================================
// QUICK ACCESS FUNCTIONS
// =============================================================================

/**
 * Quick check if session feedback suggests a deload
 */
export function shouldDeloadFromFeedback(): boolean {
  const state = computeFatigueStateFromFeedback()
  return state.needsDeload
}

/**
 * Get volume modifier from session feedback
 * Returns 1.0 if no feedback or neutral
 */
export function getVolumeModifierFromFeedback(): number {
  const state = computeFatigueStateFromFeedback()
  return state.volumeModifier
}

/**
 * Get intensity modifier from session feedback
 * Returns 1.0 if no feedback or neutral
 */
export function getIntensityModifierFromFeedback(): number {
  const state = computeFatigueStateFromFeedback()
  return state.intensityModifier
}

/**
 * Get regional soreness summary from recent feedback
 */
export function getRegionalSoreness(): { push: number; pull: number; core: number; legs: number } {
  const entries = getRecentSessionFeedback(5)
  
  const totals = { push: 0, pull: 0, core: 0, legs: 0 }
  const counts = { push: 0, pull: 0, core: 0, legs: 0 }
  
  for (const entry of entries) {
    if (entry.soreness) {
      if (typeof entry.soreness.push === 'number') {
        totals.push += entry.soreness.push
        counts.push++
      }
      if (typeof entry.soreness.pull === 'number') {
        totals.pull += entry.soreness.pull
        counts.pull++
      }
      if (typeof entry.soreness.core === 'number') {
        totals.core += entry.soreness.core
        counts.core++
      }
      if (typeof entry.soreness.legs === 'number') {
        totals.legs += entry.soreness.legs
        counts.legs++
      }
    }
  }
  
  return {
    push: counts.push > 0 ? Math.round(totals.push / counts.push * 10) / 10 : 0,
    pull: counts.pull > 0 ? Math.round(totals.pull / counts.pull * 10) / 10 : 0,
    core: counts.core > 0 ? Math.round(totals.core / counts.core * 10) / 10 : 0,
    legs: counts.legs > 0 ? Math.round(totals.legs / counts.legs * 10) / 10 : 0,
  }
}
