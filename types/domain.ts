// Shared domain types for SpartanLab
// Used by both preview (localStorage) and production (database) implementations

// =============================================================================
// USER & AUTH TYPES
// =============================================================================

// NOTE: 'elite' tier is kept for backward compatibility but merged into 'pro' for new users
// Elite features are now included in Pro tier ($15/month)
export type SubscriptionPlan = 'free' | 'pro' | 'elite'

export interface User {
  id: string
  email: string
  username: string
  subscriptionPlan: SubscriptionPlan
  createdAt: string
  updatedAt?: string
}

export type Sex = 'male' | 'female'
export type HeightUnit = 'inches' | 'cm'
export type WeightUnit = 'lbs' | 'kg'
export type SessionLengthMinutes = 30 | 45 | 60 | 90
export type Equipment = 'pullup_bar' | 'dip_bars' | 'parallettes' | 'rings' | 'resistance_bands'
export type RangeIntent = 'deeper_range' | 'stronger_control' | 'both'
export type RangeTrainingMode = 'flexibility' | 'mobility' | 'hybrid'

export interface AthleteProfile {
  id: string
  userId: string
  sex: Sex | null
  height: number | null
  heightUnit: HeightUnit
  bodyweight: number | null
  weightUnit: WeightUnit
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: number
  sessionLengthMinutes: SessionLengthMinutes
  primaryGoal: string | null
  equipmentAvailable: Equipment[]
  rangeIntent: RangeIntent | null // For flexibility/mobility goals
  rangeTrainingMode: RangeTrainingMode | null // AI-determined training mode
  onboardingComplete: boolean
  createdAt: string
  updatedAt?: string
}

// =============================================================================
// SKILL PROGRESSION TYPES
// =============================================================================

export type SkillName = 'planche' | 'front_lever' | 'muscle_up' | 'handstand_pushup'

export interface SkillProgression {
  id: string
  userId: string
  skillName: SkillName | string
  currentLevel: number
  targetLevel: number
  progressScore: number
  lastUpdated: string
  createdAt: string
}

// =============================================================================
// STRENGTH TRACKING TYPES
// =============================================================================

export type ExerciseType = 'weighted_pull_up' | 'weighted_dip' | 'weighted_muscle_up'

export interface StrengthRecord {
  id: string
  userId: string
  exercise: ExerciseType
  weightAdded: number
  reps: number
  estimatedOneRM: number
  dateLogged: string
  createdAt: string
}

// =============================================================================
// PROGRAM BUILDER TYPES
// =============================================================================

export type PrimaryGoal = 'planche' | 'front_lever' | 'muscle_up' | 'handstand_pushup' | 'weighted_strength'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type SecondaryEmphasis = 'pulling_strength' | 'pushing_strength' | 'core_control' | 'skill_technique' | 'hypertrophy_support' | 'none'
export type SessionLength = 30 | 45 | 60 | 75
export type TrainingDays = 2 | 3 | 4 | 5

export interface ProgramInputs {
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays
  secondaryEmphasis: SecondaryEmphasis
  sessionLength: SessionLength
}

export interface ProgramExercise {
  name: string
  sets: number
  repsOrTime: string
  category: 'skill' | 'strength' | 'accessory' | 'core'
  note?: string
}

export interface ProgramDay {
  dayLabel: string
  emphasis: string
  exercises: ProgramExercise[]
}

export interface Program {
  id: string
  userId: string
  createdAt: string
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays
  secondaryEmphasis: SecondaryEmphasis
  sessionLength: SessionLength
  generatedDays: ProgramDay[]
  strengthNote?: string
}

// =============================================================================
// WORKOUT LOG TYPES
// =============================================================================

export type SessionType = 'skill' | 'strength' | 'mixed' | 'recovery'
export type FocusArea = 'planche' | 'front_lever' | 'muscle_up' | 'handstand_pushup' | 'weighted_strength' | 'general'
export type ExerciseCategory = 'skill' | 'push' | 'pull' | 'core' | 'legs' | 'mobility'

export interface WorkoutExercise {
  id: string
  name: string
  category: ExerciseCategory
  sets: number
  reps?: number
  load?: number
  holdSeconds?: number
  completed: boolean
}

export interface WorkoutLog {
  id: string
  userId: string
  createdAt: string
  sessionName: string
  sessionType: SessionType
  sessionDate: string
  durationMinutes: number
  focusArea: FocusArea
  notes?: string
  exercises: WorkoutExercise[]
}

// =============================================================================
// PLAN/SUBSCRIPTION TYPES
// =============================================================================

export interface PlanState {
  plan: SubscriptionPlan
  source: 'preview' | 'stripe' | 'database'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  expiresAt?: string
}

// Feature access mapping
export interface FeatureAccess {
  skillTracker: boolean
  strengthTracker: boolean
  programBuilder: boolean
  workoutLog: boolean
  dashboard: boolean
  spartanScore: boolean
  volumeAnalyzer: boolean
  goalProjection: boolean
  advancedInsights: boolean
}

// =============================================================================
// REPOSITORY INTERFACES
// =============================================================================

export interface UserRepository {
  getCurrentUser(): Promise<User | null>
  getUserById(id: string): Promise<User | null>
  updateUser(id: string, data: Partial<User>): Promise<User>
}

export interface ProfileRepository {
  getProfile(userId: string): Promise<AthleteProfile | null>
  saveProfile(userId: string, data: Partial<AthleteProfile>): Promise<AthleteProfile>
}

export interface SkillRepository {
  getSkills(userId: string): Promise<SkillProgression[]>
  getSkill(userId: string, skillName: string): Promise<SkillProgression | null>
  saveSkill(userId: string, data: Omit<SkillProgression, 'id' | 'userId' | 'createdAt'>): Promise<SkillProgression>
  deleteSkill(userId: string, id: string): Promise<boolean>
}

export interface StrengthRepository {
  getRecords(userId: string): Promise<StrengthRecord[]>
  getRecordsByExercise(userId: string, exercise: ExerciseType): Promise<StrengthRecord[]>
  saveRecord(userId: string, data: Omit<StrengthRecord, 'id' | 'userId' | 'createdAt'>): Promise<StrengthRecord>
  deleteRecord(userId: string, id: string): Promise<boolean>
}

export interface ProgramRepository {
  getPrograms(userId: string): Promise<Program[]>
  getLatestProgram(userId: string): Promise<Program | null>
  saveProgram(userId: string, data: Omit<Program, 'id' | 'userId' | 'createdAt'>): Promise<Program>
  deleteProgram(userId: string, id: string): Promise<boolean>
}

export interface WorkoutRepository {
  getWorkouts(userId: string): Promise<WorkoutLog[]>
  getRecentWorkouts(userId: string, limit: number): Promise<WorkoutLog[]>
  saveWorkout(userId: string, data: Omit<WorkoutLog, 'id' | 'userId' | 'createdAt'>): Promise<WorkoutLog>
  deleteWorkout(userId: string, id: string): Promise<boolean>
}

export interface PlanRepository {
  getPlan(userId: string): Promise<PlanState>
  setPlan(userId: string, plan: SubscriptionPlan): Promise<PlanState>
  syncFromStripe(userId: string, stripeData: { customerId: string; subscriptionId: string; plan: SubscriptionPlan }): Promise<PlanState>
}
