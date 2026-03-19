/**
 * Client Data Hygiene Module
 * 
 * One-time safe cleanup of stale preview/seed/debug data from localStorage.
 * This ensures real signed-in users don't see fake data from development or preview mode.
 * 
 * IMPORTANT: This is a NARROW cleanup - it only removes known preview/seed contamination.
 * It does NOT wipe legitimate user data.
 */

// PHASE 5: Bump version to force re-run and clean legacy logs without trusted flag
const HYGIENE_VERSION = 'v2'
const HYGIENE_KEY = 'spartanlab_hygiene_pass'

// Known preview/seed profile indicators
const PREVIEW_PROFILE_IDS = ['preview-profile', 'preview-user', 'seed-profile', 'demo-profile']
const PREVIEW_USER_IDS = ['preview-user', 'seed-user', 'demo-user']

// Storage keys to inspect
const STORAGE_KEYS = {
  profile: 'spartanlab_profile',
  onboardingProfile: 'spartanlab_onboarding_profile',
  programState: 'spartanlab_program_state',
  workoutLogs: 'spartanlab_workout_logs',
  strengthRecords: 'spartanlab_strength_records',
  skillSessions: 'spartanlab_skill_sessions',
}

interface HygieneResult {
  cleanedKeys: string[]
  skippedKeys: string[]
  wasAlreadyRun: boolean
}

/**
 * Check if a profile object is preview/seed data
 */
function isPreviewProfile(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  
  // Check explicit preview indicators
  if (typeof obj.id === 'string' && PREVIEW_PROFILE_IDS.includes(obj.id)) return true
  if (typeof obj.userId === 'string' && PREVIEW_USER_IDS.includes(obj.userId)) return true
  
  // Check for classic preview defaults that shouldn't exist for real users
  // A real onboarding profile would have user-selected values, not these exact defaults
  if (
    obj.primaryGoal === 'planche' &&
    obj.experienceLevel === 'intermediate' &&
    obj.trainingDaysPerWeek === 4 &&
    obj.onboardingComplete === true &&
    obj.id === 'preview-profile'
  ) {
    return true
  }
  
  return false
}

/**
 * Check if workout logs contain demo/seed/untrusted data that should be removed
 * PHASE 5: Now also catches legacy logs without proper source tracking
 */
function containsUntrustedWorkouts(logs: unknown): boolean {
  if (!Array.isArray(logs)) return false
  return logs.some(log => {
    if (!log || typeof log !== 'object') return false
    const obj = log as Record<string, unknown>
    // Check for explicit demo/seed markers
    if (obj.sourceRoute === 'demo' || obj.isDemo === true || obj.trusted === false) return true
    // PHASE 5: Legacy logs without proper source tracking are suspect
    // Real workouts from workout_session or quick_log will have sourceRoute set
    if (!obj.sourceRoute && !obj.trusted) return true
    return false
  })
}

/**
 * Filter out demo/seed/untrusted workouts from logs array
 * PHASE 5: Only keep workouts with explicit trusted=true or valid sourceRoute
 */
function filterRealWorkouts(logs: unknown[]): unknown[] {
  return logs.filter(log => {
    if (!log || typeof log !== 'object') return false
    const obj = log as Record<string, unknown>
    // Reject explicit demo/untrusted
    if (obj.sourceRoute === 'demo' || obj.isDemo === true || obj.trusted === false) return false
    // PHASE 5: Require explicit trust OR known good sourceRoute
    const hasValidSource = obj.sourceRoute === 'workout_session' || 
                          obj.sourceRoute === 'first_session' || 
                          obj.sourceRoute === 'quick_log'
    const hasExplicitTrust = obj.trusted === true
    return hasValidSource || hasExplicitTrust
  })
}

/**
 * Run one-time hygiene pass to clean preview/seed data
 * Safe to call multiple times - will only run once per version
 */
export function runClientDataHygiene(): HygieneResult {
  if (typeof window === 'undefined') {
    return { cleanedKeys: [], skippedKeys: [], wasAlreadyRun: true }
  }
  
  // Check if this hygiene version was already run
  const lastRun = localStorage.getItem(HYGIENE_KEY)
  if (lastRun === HYGIENE_VERSION) {
    console.log('[TruthState] Hygiene pass already completed')
    return { cleanedKeys: [], skippedKeys: [], wasAlreadyRun: true }
  }
  
  const cleanedKeys: string[] = []
  const skippedKeys: string[] = []
  
  try {
    // Check and clean profile
    const profileStr = localStorage.getItem(STORAGE_KEYS.profile)
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr)
        if (isPreviewProfile(profile)) {
          localStorage.removeItem(STORAGE_KEYS.profile)
          cleanedKeys.push(STORAGE_KEYS.profile)
          console.log('[TruthState] Removed preview profile key')
        } else {
          skippedKeys.push(STORAGE_KEYS.profile)
          console.log('[TruthState] Kept real user profile')
        }
      } catch {
        // Invalid JSON, remove it
        localStorage.removeItem(STORAGE_KEYS.profile)
        cleanedKeys.push(STORAGE_KEYS.profile + ' (invalid JSON)')
      }
    }
    
    // Check and clean onboarding profile
    const onboardingStr = localStorage.getItem(STORAGE_KEYS.onboardingProfile)
    if (onboardingStr) {
      try {
        const onboarding = JSON.parse(onboardingStr)
        if (isPreviewProfile(onboarding)) {
          localStorage.removeItem(STORAGE_KEYS.onboardingProfile)
          cleanedKeys.push(STORAGE_KEYS.onboardingProfile)
          console.log('[TruthState] Removed preview onboarding profile')
        } else {
          skippedKeys.push(STORAGE_KEYS.onboardingProfile)
          console.log('[TruthState] Kept real onboarding profile')
        }
      } catch {
        // Keep invalid JSON for onboarding - user may need to re-complete
        skippedKeys.push(STORAGE_KEYS.onboardingProfile + ' (kept invalid)')
      }
    }
    
    // Check workout logs for demo contamination
    const logsStr = localStorage.getItem(STORAGE_KEYS.workoutLogs)
    if (logsStr) {
      try {
        const logs = JSON.parse(logsStr)
        if (Array.isArray(logs) && containsUntrustedWorkouts(logs)) {
          const realLogs = filterRealWorkouts(logs)
          if (realLogs.length === 0) {
            localStorage.removeItem(STORAGE_KEYS.workoutLogs)
            cleanedKeys.push(STORAGE_KEYS.workoutLogs + ' (all demo)')
            console.log('[TruthState] Removed all demo workout logs')
          } else {
            localStorage.setItem(STORAGE_KEYS.workoutLogs, JSON.stringify(realLogs))
            cleanedKeys.push(STORAGE_KEYS.workoutLogs + ` (filtered ${logs.length - realLogs.length} demo)`)
            console.log('[TruthState] Filtered demo workouts, kept', realLogs.length, 'real logs')
          }
        } else {
          skippedKeys.push(STORAGE_KEYS.workoutLogs)
        }
      } catch {
        // Invalid JSON logs, remove them
        localStorage.removeItem(STORAGE_KEYS.workoutLogs)
        cleanedKeys.push(STORAGE_KEYS.workoutLogs + ' (invalid JSON)')
      }
    }
    
    // Mark hygiene as complete
    localStorage.setItem(HYGIENE_KEY, HYGIENE_VERSION)
    
    console.log('[TruthState] Hygiene pass complete', {
      cleaned: cleanedKeys.length,
      skipped: skippedKeys.length,
    })
    
  } catch (err) {
    console.error('[TruthState] Hygiene pass error:', err)
  }
  
  return { cleanedKeys, skippedKeys, wasAlreadyRun: false }
}

/**
 * Force re-run hygiene (for debugging/testing)
 */
export function resetHygieneFlag(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(HYGIENE_KEY)
  console.log('[TruthState] Hygiene flag reset - will run on next load')
}

/**
 * Check if hygiene has been run
 */
export function wasHygieneRun(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(HYGIENE_KEY) === HYGIENE_VERSION
}
