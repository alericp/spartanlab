// Skill repository with dual-mode support
// Preview mode: localStorage
// Production mode: database (stub)

import { isPreviewMode } from '../app-mode'
import type { SkillProgression, SkillRepository } from '@/types/domain'

const STORAGE_KEY = 'spartanlab_progressions'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function calculateProgressScore(currentLevel: number, targetLevel: number): number {
  const currentValue = currentLevel + 1
  const targetValue = targetLevel + 1
  return (currentValue / targetValue) * 100
}

// =============================================================================
// PREVIEW MODE IMPLEMENTATION
// =============================================================================

const previewSkillRepository: SkillRepository = {
  async getSkills(userId: string): Promise<SkillProgression[]> {
    if (!isBrowser()) return []
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  },
  
  async getSkill(userId: string, skillName: string): Promise<SkillProgression | null> {
    const skills = await this.getSkills(userId)
    return skills.find(s => s.skillName === skillName) || null
  },
  
  async saveSkill(userId: string, data: Omit<SkillProgression, 'id' | 'userId' | 'createdAt'>): Promise<SkillProgression> {
    if (!isBrowser()) {
      return {
        ...data,
        id: `preview-${data.skillName}`,
        userId,
        createdAt: new Date().toISOString(),
      }
    }
    
    const skills = await this.getSkills(userId)
    const existingIndex = skills.findIndex(s => s.skillName === data.skillName)
    
    const skill: SkillProgression = {
      id: existingIndex >= 0 ? skills[existingIndex].id : `skill-${Date.now()}`,
      userId,
      ...data,
      progressScore: calculateProgressScore(data.currentLevel, data.targetLevel),
      createdAt: existingIndex >= 0 ? skills[existingIndex].createdAt : new Date().toISOString(),
    }
    
    if (existingIndex >= 0) {
      skills[existingIndex] = skill
    } else {
      skills.push(skill)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skills))
    return skill
  },
  
  async deleteSkill(userId: string, id: string): Promise<boolean> {
    if (!isBrowser()) return false
    
    const skills = await this.getSkills(userId)
    const filtered = skills.filter(s => s.id !== id)
    
    if (filtered.length === skills.length) return false
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  },
}

// =============================================================================
// PRODUCTION MODE IMPLEMENTATION (STUB)
// =============================================================================

const productionSkillRepository: SkillRepository = {
  async getSkills(userId: string): Promise<SkillProgression[]> {
    // TODO: Implement with Neon/Prisma
    return previewSkillRepository.getSkills(userId)
  },
  
  async getSkill(userId: string, skillName: string): Promise<SkillProgression | null> {
    // TODO: Implement with Neon/Prisma
    return previewSkillRepository.getSkill(userId, skillName)
  },
  
  async saveSkill(userId: string, data: Omit<SkillProgression, 'id' | 'userId' | 'createdAt'>): Promise<SkillProgression> {
    // TODO: Implement with Neon/Prisma
    return previewSkillRepository.saveSkill(userId, data)
  },
  
  async deleteSkill(userId: string, id: string): Promise<boolean> {
    // TODO: Implement with Neon/Prisma
    return previewSkillRepository.deleteSkill(userId, id)
  },
}

// =============================================================================
// EXPORTED REPOSITORY (MODE-AWARE)
// =============================================================================

export const skillRepository: SkillRepository = {
  getSkills: async (userId: string) => {
    const repo = isPreviewMode() ? previewSkillRepository : productionSkillRepository
    return repo.getSkills(userId)
  },
  getSkill: async (userId: string, skillName: string) => {
    const repo = isPreviewMode() ? previewSkillRepository : productionSkillRepository
    return repo.getSkill(userId, skillName)
  },
  saveSkill: async (userId: string, data: Omit<SkillProgression, 'id' | 'userId' | 'createdAt'>) => {
    const repo = isPreviewMode() ? previewSkillRepository : productionSkillRepository
    return repo.saveSkill(userId, data)
  },
  deleteSkill: async (userId: string, id: string) => {
    const repo = isPreviewMode() ? previewSkillRepository : productionSkillRepository
    return repo.deleteSkill(userId, id)
  },
}

// =============================================================================
// CONVENIENCE FUNCTIONS (backward compatibility)
// =============================================================================

export function getSkillProgressions(): SkillProgression[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function getSkillProgression(skillName: string): SkillProgression | null {
  const progressions = getSkillProgressions()
  return progressions.find(p => p.skillName === skillName) || null
}

export function saveSkillProgression(
  skillName: string,
  currentLevel: number,
  targetLevel: number
): SkillProgression {
  if (!isBrowser()) {
    return {
      id: `preview-${skillName}`,
      userId: 'preview-user',
      skillName,
      currentLevel,
      targetLevel,
      progressScore: calculateProgressScore(currentLevel, targetLevel),
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
  }
  
  const progressions = getSkillProgressions()
  const existingIndex = progressions.findIndex(p => p.skillName === skillName)
  
  const progression: SkillProgression = {
    id: existingIndex >= 0 ? progressions[existingIndex].id : `prog-${Date.now()}`,
    userId: 'preview-user',
    skillName,
    currentLevel,
    targetLevel,
    progressScore: calculateProgressScore(currentLevel, targetLevel),
    lastUpdated: new Date().toISOString(),
    createdAt: existingIndex >= 0 ? progressions[existingIndex].createdAt : new Date().toISOString(),
  }
  
  if (existingIndex >= 0) {
    progressions[existingIndex] = progression
  } else {
    progressions.push(progression)
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progressions))
  return progression
}
