// Profile repository with dual-mode support
// Preview mode: localStorage
// Production mode: Neon/Postgres with Clerk user linking
//
// NOTE: This module uses localStorage for preview mode (client-side)
// Database operations are async and server-compatible

import { isPreviewMode } from '../app-mode'
import type { AthleteProfile, ProfileRepository } from '@/types/domain'

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
  sessionLengthMinutes: 60,
  primaryGoal: 'planche',
  equipmentAvailable: ['pullup_bar', 'dip_bars', 'parallettes'],
  rangeIntent: null,
  rangeTrainingMode: null,
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
    if (!isBrowser()) return DEFAULT_PROFILE

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return DEFAULT_PROFILE
      }
    }

    // Initialize with default
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE))
    return DEFAULT_PROFILE
  },

  async saveProfile(
    userId: string,
    data: Partial<AthleteProfile>
  ): Promise<AthleteProfile> {
    if (!isBrowser()) return DEFAULT_PROFILE

    const current = (await this.getProfile(userId)) || DEFAULT_PROFILE
    const updated: AthleteProfile = {
      ...current,
      ...data,
      id: current.id,
      userId: current.userId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  },
}

// =============================================================================
// PRODUCTION MODE IMPLEMENTATION (Neon/Postgres)
// NOTE: For now, production mode falls back to preview implementation
// Database operations should be handled via server actions in a separate file
// =============================================================================

const productionProfileRepository: ProfileRepository = {
  async getProfile(userId: string): Promise<AthleteProfile | null> {
    // Fall back to localStorage for now
    // Real production would use server actions with database queries
    return previewProfileRepository.getProfile(userId)
  },

  async saveProfile(
    userId: string,
    data: Partial<AthleteProfile>
  ): Promise<AthleteProfile> {
    // Fall back to localStorage for now
    // Real production would use server actions with database queries
    return previewProfileRepository.saveProfile(userId, data)
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

export function getAthleteProfile(): AthleteProfile {
  if (!isBrowser()) return DEFAULT_PROFILE

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return DEFAULT_PROFILE
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE))
  return DEFAULT_PROFILE
}

export function saveAthleteProfile(
  profile: Partial<AthleteProfile>
): AthleteProfile {
  if (!isBrowser()) return DEFAULT_PROFILE

  const current = getAthleteProfile()
  const updated: AthleteProfile = {
    ...current,
    ...profile,
    id: current.id,
    userId: current.userId,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

