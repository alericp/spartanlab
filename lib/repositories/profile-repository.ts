// Profile repository with dual-mode support
// Preview mode: localStorage
// Production mode: Neon/Postgres with Clerk user linking
//
// NOTE: This module uses localStorage for preview mode (client-side)
// Database operations are async and server-compatible

import { isPreviewMode } from '../app-mode'
import { dbGetProfile, dbSaveProfile } from '../db-queries'
import type { AthleteProfile, ProfileRepository } from '@/types/domain'
import { onTrainingEvent } from '@/lib/achievements/achievement-engine'
import { showAchievementNotifications } from '@/components/achievements/achievement-notification'
import { saveOnboardingProfile, getOnboardingProfile } from '../athlete-profile'
import { saveCanonicalProfile, logCanonicalProfileState } from '../canonical-profile-service'

const STORAGE_KEY = 'spartanlab_profile'

// TASK 1C: REMOVED DEFAULT_PROFILE - No more seed data pollution
// Programs must use real user data from onboarding
// If no data exists, validation will fail gracefully

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// =============================================================================
// PREVIEW MODE IMPLEMENTATION
// =============================================================================

const previewProfileRepository: ProfileRepository = {
  async getProfile(userId: string): Promise<AthleteProfile | null> {
    if (!isBrowser()) return null

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // [TruthState] Reject preview/seed data
        if (parsed.id === 'preview-profile' || parsed.userId === 'preview-user') {
          console.log('[TruthState] Rejected preview profile in previewProfileRepository')
          return null
        }
        return parsed
      } catch {
        return null
      }
    }

    // DO NOT auto-initialize with default - return null for new users
    return null
  },

  async saveProfile(
    userId: string,
    data: Partial<AthleteProfile>
  ): Promise<AthleteProfile> {
    // TASK 1C: Throw error instead of returning fake data when not in browser
    if (!isBrowser()) {
      throw new Error('[ProfileRepository] Cannot save profile outside browser context')
    }

    const current = (await this.getProfile(userId))
    
    // TASK 3: Handle null profile safely
    const baseProfile: AthleteProfile = current ?? {
      id: 'local-profile',
      userId: 'local-user',
      sex: null as any,
      height: null as any,
      heightUnit: 'inches',
      bodyweight: null as any,
      weightUnit: 'lbs',
      experienceLevel: 'beginner',
      trainingDaysPerWeek: 3,
      sessionLengthMinutes: 60,
      goalCategory: null as any,
      selectedSkills: [],
      selectedFlexibility: [],
      selectedStrength: [],
      primaryGoal: null,
      equipmentAvailable: [],
      rangeIntent: null,
      rangeTrainingMode: null,
      pullUpMax: null,
      dipMax: null,
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    }
    
    const updated: AthleteProfile = {
      ...baseProfile,
      ...data,
      id: baseProfile.id,
      userId: baseProfile.userId,
      createdAt: baseProfile.createdAt,
      updatedAt: new Date().toISOString(),
    }
    
    // ==========================================================================
    // [PHASE 30B] ATHLETE PROFILE SAVE FINAL
    // THE DEFINITIVE LOG proving what schedule values are being saved to localStorage
    // ==========================================================================
    console.log('[phase30b-athlete-profile-save-final]', {
      saved_scheduleMode: (updated as { scheduleMode?: string }).scheduleMode ?? null,
      saved_trainingDaysPerWeek: updated.trainingDaysPerWeek ?? null,
      saved_adaptiveWorkloadEnabled: (updated as { adaptiveWorkloadEnabled?: boolean }).adaptiveWorkloadEnabled ?? null,
      verdict:
        (updated as { scheduleMode?: string }).scheduleMode === 'static' && updated.trainingDaysPerWeek === 6
          ? 'ATHLETE_PROFILE_SAVED_STATIC_6'
          : (updated as { scheduleMode?: string }).scheduleMode === 'flexible'
          ? 'ATHLETE_PROFILE_SAVED_FLEXIBLE'
          : `ATHLETE_PROFILE_SAVED_${(updated as { scheduleMode?: string }).scheduleMode}_${updated.trainingDaysPerWeek}`,
    })

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  },
}

// =============================================================================
// PRODUCTION MODE IMPLEMENTATION (Neon/Postgres)
// Falls back to localStorage if database is unavailable
// =============================================================================

const productionProfileRepository: ProfileRepository = {
  async getProfile(userId: string): Promise<AthleteProfile | null> {
    try {
      const profile = await dbGetProfile(userId)
      if (profile) return profile
      // Fallback to localStorage if no database profile
      return previewProfileRepository.getProfile(userId)
    } catch (error) {
      console.error('[SpartanLab] Production getProfile failed, falling back to localStorage:', error)
      return previewProfileRepository.getProfile(userId)
    }
  },

  async saveProfile(
    userId: string,
    data: Partial<AthleteProfile>
  ): Promise<AthleteProfile> {
    try {
      const saved = await dbSaveProfile(userId, data)
      if (saved) return saved
      // Fallback to localStorage if database save fails
      console.warn('[SpartanLab] Database profile save returned null, falling back to localStorage')
      return previewProfileRepository.saveProfile(userId, data)
    } catch (error) {
      console.error('[SpartanLab] Production saveProfile failed, falling back to localStorage:', error)
      return previewProfileRepository.saveProfile(userId, data)
    }
  },
}

// =============================================================================
// EXPORTED REPOSITORY (MODE-AWARE)
// =============================================================================

export const profileRepository: ProfileRepository = {
  getProfile: async (userId: string) => {
    const repo = isPreviewMode() ? previewProfileRepository : productionProfileRepository
    return repo.getProfile(userId)
  },
  saveProfile: async (userId: string, data: Partial<AthleteProfile>) => {
    const repo = isPreviewMode() ? previewProfileRepository : productionProfileRepository
    return repo.saveProfile(userId, data)
  },
}

// =============================================================================
// CONVENIENCE FUNCTIONS (backward compatibility)
// =============================================================================

export function getAthleteProfile(): AthleteProfile | null {
  if (!isBrowser()) return null

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // [TruthState] Reject preview/seed data
      if (parsed.id === 'preview-profile' || parsed.userId === 'preview-user') {
        console.log('[TruthState] Rejected preview profile in getAthleteProfile convenience function')
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  // DO NOT auto-initialize - return null for new users
  return null
}

export function saveAthleteProfile(
  profile: Partial<AthleteProfile>
): AthleteProfile {
  // TASK 1C: Throw error instead of returning fake data when not in browser
  if (!isBrowser()) {
    throw new Error('[ProfileRepository] Cannot save profile outside browser context')
  }

  const current = getAthleteProfile()
  
  // TASK 3: Handle null profile safely - create safe local-only base if needed
  const baseProfile: AthleteProfile = current ?? {
    id: 'local-profile',
    userId: 'local-user',
    sex: null as any,
    height: null as any,
    heightUnit: 'inches',
    bodyweight: null as any,
    weightUnit: 'lbs',
    experienceLevel: 'beginner',
    trainingDaysPerWeek: 3,
    sessionLengthMinutes: 60,
    goalCategory: null as any,
    selectedSkills: [],
    selectedFlexibility: [],
    selectedStrength: [],
    primaryGoal: null,
    equipmentAvailable: [],
    rangeIntent: null,
    rangeTrainingMode: null,
    pullUpMax: null,
    dipMax: null,
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
  }
  
  // TASK 3: Now safely merge - baseProfile is guaranteed to exist
  const updated: AthleteProfile = {
    ...baseProfile,
    ...profile,
    id: baseProfile.id,
    userId: baseProfile.userId,
    createdAt: baseProfile.createdAt,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  
  // CANONICAL PROFILE FIX: Sync profile changes to onboarding profile
  // This ensures metrics and generation use the same truth
  try {
    const currentOnboarding = getOnboardingProfile()
    if (currentOnboarding) {
      saveOnboardingProfile({
        ...currentOnboarding,
        primaryGoal: updated.primaryGoal ?? currentOnboarding.primaryGoal,
        secondaryGoal: updated.secondaryGoal ?? currentOnboarding.secondaryGoal,
        goalCategory: updated.goalCategory ?? currentOnboarding.goalCategory,
        selectedSkills: updated.selectedSkills ?? currentOnboarding.selectedSkills,
        selectedFlexibility: updated.selectedFlexibility ?? currentOnboarding.selectedFlexibility,
        selectedStrength: updated.selectedStrength ?? currentOnboarding.selectedStrength,
        trainingDaysPerWeek: updated.trainingDaysPerWeek ?? currentOnboarding.trainingDaysPerWeek,
        sessionLengthMinutes: updated.sessionLengthMinutes ?? currentOnboarding.sessionLengthMinutes,
        equipmentAvailable: updated.equipmentAvailable ?? currentOnboarding.equipmentAvailable,
        scheduleMode: updated.scheduleMode ?? currentOnboarding.scheduleMode,
        trainingStyle: updated.trainingStyle ?? currentOnboarding.trainingStyle,
        onboardingComplete: updated.onboardingComplete ?? currentOnboarding.onboardingComplete,
        // Sync strength benchmarks if present
        pullUpMax: updated.pullUpMax?.toString() as any ?? currentOnboarding.pullUpMax,
        dipMax: updated.dipMax?.toString() as any ?? currentOnboarding.dipMax,
      })
      console.log('[ProfileRepository] Synced profile changes to onboarding profile')
    }
  } catch (err) {
    console.warn('[ProfileRepository] Failed to sync to onboarding profile:', err)
  }
  
  // CANONICAL PROFILE FIX: Also sync to canonical profile service for unified truth
  try {
    saveCanonicalProfile({
      primaryGoal: updated.primaryGoal ?? undefined,
      secondaryGoal: updated.secondaryGoal ?? undefined,
      goalCategory: updated.goalCategory ?? undefined,
      selectedSkills: updated.selectedSkills ?? undefined,
      selectedFlexibility: updated.selectedFlexibility ?? undefined,
      selectedStrength: updated.selectedStrength ?? undefined,
      trainingDaysPerWeek: updated.trainingDaysPerWeek ?? undefined,
      scheduleMode: updated.scheduleMode ?? undefined,
      sessionLengthMinutes: updated.sessionLengthMinutes ?? undefined,
      equipmentAvailable: updated.equipmentAvailable ?? undefined,
      trainingStyle: updated.trainingStyle ?? undefined,
      onboardingComplete: updated.onboardingComplete ?? undefined,
    })
    logCanonicalProfileState('After saveAthleteProfile sync')
  } catch (err) {
    console.warn('[ProfileRepository] Failed to sync to canonical profile:', err)
  }
  
  // Check for newly unlocked achievements (strength milestones, etc.)
  const newAchievements = onTrainingEvent()
  if (newAchievements.length > 0) {
    showAchievementNotifications(newAchievements)
  }
  
  return updated
}

