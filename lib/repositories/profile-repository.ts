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

const STORAGE_KEY = 'spartanlab_profile'

// Default profile for preview mode
const DEFAULT_PROFILE: AthleteProfile = {
  id: 'preview-profile',
  userId: 'preview-user',
  sex: 'male',
  height: 70,
  heightUnit: 'inches',
  bodyweight: 160,
  weightUnit: 'lbs',
  experienceLevel: 'intermediate',
  trainingDaysPerWeek: 4,
  scheduleMode: 'static',
  sessionLengthMinutes: 60,
  goalCategory: 'skills',
  selectedSkills: ['planche'],
  selectedFlexibility: [],
  selectedStrength: [],
  primaryGoal: 'planche',
  secondaryGoal: 'front_lever', // TASK 3: Default secondary goal
  equipmentAvailable: ['pullup_bar', 'dip_bars', 'parallettes'],
  rangeIntent: null,
  rangeTrainingMode: null,
  pullUpMax: null,
  dipMax: null,
  onboardingComplete: true,
  createdAt: new Date().toISOString(),
}

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
    if (!isBrowser()) return DEFAULT_PROFILE

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
  if (!isBrowser()) return DEFAULT_PROFILE

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
  
  // Check for newly unlocked achievements (strength milestones, etc.)
  const newAchievements = onTrainingEvent()
  if (newAchievements.length > 0) {
    showAchievementNotifications(newAchievements)
  }
  
  return updated
}

