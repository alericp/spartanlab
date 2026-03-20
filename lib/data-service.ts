/**
 * DATA SERVICE LAYER
 * 
 * =============================================================================
 * REGRESSION GUARD: THIS IS A COMPATIBILITY LAYER, NOT THE SOURCE OF TRUTH
 * =============================================================================
 * 
 * Uses localStorage for persistence, easy to swap to Prisma + Clerk later.
 * 
 * CRITICAL ARCHITECTURAL NOTE:
 * This service is a FALLBACK/COMPATIBILITY layer for storing athlete profile data.
 * It is NOT the source of truth for program generation.
 * 
 * For program generation:
 * - Use canonical-profile-service.ts -> getCanonicalProfile()
 * - Use canonical-profile-service.ts -> validateProfileForGeneration()
 * - Use canonical-profile-service.ts -> getValidatedCanonicalProfile()
 * 
 * This service MAY be used for:
 * - Client-side truth-state continuity when DB-backed profile hydration is unavailable
 * - Backward compatibility for users who haven't gone through canonical reconciliation
 * - Legacy code paths during migration
 * 
 * DO NOT:
 * - Import getAthleteProfile() directly for program generation
 * - Treat this as the primary source of truth for generation inputs
 * - Add seed/default data that leaks into real user flows
 */

export interface User {
  id: string
  email: string
  username: string
  // NOTE: 'elite' kept for backward compatibility but merged into 'pro' for new users
  subscriptionTier: 'free' | 'pro' | 'elite'
  createdAt: string
}

export type Equipment = 'pullup_bar' | 'dip_bars' | 'parallettes' | 'rings' | 'resistance_bands'
export type SessionLengthMinutes = 30 | 45 | 60 | 90

export interface AthleteProfile {
  id: string
  userId: string
  sex: 'male' | 'female' | null
  height: number | null
  heightUnit: 'inches' | 'cm'
  bodyweight: number | null
  weightUnit: 'lbs' | 'kg'
  bodyFatPercent?: number | null
  bodyFatSource?: string | null
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingDaysPerWeek: number
  sessionLengthMinutes: SessionLengthMinutes
  primaryGoal: string | null
  equipmentAvailable: Equipment[]
  jointCautions?: ('shoulders' | 'elbows' | 'wrists' | 'lower_back' | 'knees')[]
  weakestArea?: 'pulling_strength' | 'pushing_strength' | 'core_strength' | 'shoulder_stability' | 'hip_mobility' | 'hamstring_flexibility' | null
  pullUpMax?: number | null
  dipMax?: number | null
  trainingStyle?: 'skill_focused' | 'strength_focused' | 'power_focused' | 'endurance_focused' | 'hypertrophy_supported' | 'balanced_hybrid'
  scheduleMode?: 'static' | 'flexible'
  onboardingComplete: boolean
  createdAt: string
}

export interface SkillProgression {
  id: string
  skillName: string
  currentLevel: number
  targetLevel: number
  progressScore: number
  lastUpdated: string
}

// Preview mode mock user
const PREVIEW_USER: User = {
  id: 'preview-user',
  email: 'preview@spartanlab.local',
  username: 'Aleric',
  subscriptionTier: 'pro',
  createdAt: new Date().toISOString(),
}

/**
 * REGRESSION GUARD: DEFAULT_PROFILE REMOVED
 * 
 * Previously, there was a DEFAULT_PROFILE constant here that provided seed data.
 * This was removed to prevent seed data pollution in real user flows.
 * 
 * Programs MUST use real user data from:
 * 1. canonical-profile-service.ts (PRIMARY)
 * 2. Onboarding flow completion
 * 
 * DO NOT re-add a DEFAULT_PROFILE here. If you need default values:
 * - For new users: Route them through onboarding
 * - For testing: Use explicit test fixtures, not production defaults
 */

const STORAGE_KEYS = {
  profile: 'spartanlab_profile',
  progressions: 'spartanlab_progressions',
}

// Check if we're in browser
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Get current user
// NOTE: In production, this should be replaced with Clerk auth user
// For now, return a placeholder that doesn't leak preview data
export function getCurrentUser(): User {
  // This is a legacy function - real user data comes from Clerk
  // Return a safe placeholder that indicates no preview user
  return {
    id: 'awaiting-auth',
    email: '',
    username: 'User',
    subscriptionTier: 'free',
    createdAt: new Date().toISOString(),
  }
}

// Get athlete profile
// IMPORTANT: For real signed-in users, returns null if no profile exists
// This prevents preview/default data from leaking into real user state
export function getAthleteProfile(): AthleteProfile | null {
  if (!isBrowser()) return null
  
  const stored = localStorage.getItem(STORAGE_KEYS.profile)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // [TruthState] Reject preview/seed data for real users
      if (parsed.id === 'preview-profile' || parsed.userId === 'preview-user') {
        console.log('[TruthState] Rejected preview profile in getAthleteProfile')
        return null
      }
      return parsed
    } catch {
      return null
    }
  }
  
  // DO NOT auto-initialize with default - return null for new real users
  // This forces proper onboarding flow
  return null
}

// Save athlete profile
// NOTE: This is a local fallback store for client truth-state continuity
// when DB-backed profile hydration is unavailable. For real users without
// an existing local profile, we create a safe new local profile object.
export function saveAthleteProfile(profile: Partial<AthleteProfile>): AthleteProfile {
  // TASK 1C: Throw error instead of returning fake data
  if (!isBrowser()) {
    throw new Error('[DataService] Cannot save profile outside browser context')
  }
  
  const current = getAthleteProfile()
  
  // TASK 1 FIX: Handle case where no existing profile exists (null)
  // For real users, create safe local-only identity rather than crashing
  const baseProfile: AthleteProfile = current ?? {
    id: 'local-profile',
    userId: 'local-user',
    sex: null,
    height: null,
    heightUnit: 'inches',
    bodyweight: null,
    weightUnit: 'lbs',
    bodyFatPercent: null,
    bodyFatSource: null,
    experienceLevel: 'beginner',
    trainingDaysPerWeek: 3,
    sessionLengthMinutes: 60,
    primaryGoal: null,
    equipmentAvailable: [],
    jointCautions: [],
    weakestArea: null,
    trainingStyle: 'balanced_hybrid',
    scheduleMode: 'static',
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
  }
  
  const updated: AthleteProfile = {
    ...baseProfile,
    ...profile,
    // Preserve identity fields from existing profile, or use new safe defaults
    id: baseProfile.id,
    userId: baseProfile.userId,
    createdAt: baseProfile.createdAt,
  }
  
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(updated))
  return updated
}

// Get all skill progressions
export function getSkillProgressions(): SkillProgression[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(STORAGE_KEYS.progressions)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// Save or update a skill progression
export function saveSkillProgression(
  skillName: string,
  currentLevel: number,
  targetLevel: number
): SkillProgression {
  if (!isBrowser()) {
    return {
      id: `preview-${skillName}`,
      skillName,
      currentLevel,
      targetLevel,
      progressScore: calculateProgressScore(currentLevel, targetLevel),
      lastUpdated: new Date().toISOString(),
    }
  }
  
  const progressions = getSkillProgressions()
  const existingIndex = progressions.findIndex(p => p.skillName === skillName)
  
  const progressScore = calculateProgressScore(currentLevel, targetLevel)
  
  const progression: SkillProgression = {
    id: existingIndex >= 0 ? progressions[existingIndex].id : `prog-${Date.now()}`,
    skillName,
    currentLevel,
    targetLevel,
    progressScore,
    lastUpdated: new Date().toISOString(),
  }
  
  if (existingIndex >= 0) {
    progressions[existingIndex] = progression
  } else {
    progressions.push(progression)
  }
  
  localStorage.setItem(STORAGE_KEYS.progressions, JSON.stringify(progressions))
  return progression
}

// Get a single skill progression by name
export function getSkillProgression(skillName: string): SkillProgression | null {
  const progressions = getSkillProgressions()
  return progressions.find(p => p.skillName === skillName) || null
}

// Calculate progress score
function calculateProgressScore(currentLevel: number, targetLevel: number): number {
  const currentValue = currentLevel + 1
  const targetValue = targetLevel + 1
  return (currentValue / targetValue) * 100
}

// Clear all data (for testing)
export function clearAllData(): void {
  if (!isBrowser()) return
  localStorage.removeItem(STORAGE_KEYS.profile)
  localStorage.removeItem(STORAGE_KEYS.progressions)
}
