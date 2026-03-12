// Repository index - centralizes data access for dual-mode architecture
// Import repositories from here to ensure mode-aware implementations are used

export { profileRepository, getAthleteProfile, saveAthleteProfile } from './profile-repository'
export { skillRepository, getSkillProgressions, getSkillProgression, saveSkillProgression } from './skill-repository'

// Re-export types for convenience
export type { 
  ProfileRepository, 
  SkillRepository,
  StrengthRepository,
  ProgramRepository,
  WorkoutRepository,
  PlanRepository,
} from '@/types/domain'
