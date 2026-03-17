// =============================================================================
// HISTORY SYSTEM TYPES
// =============================================================================
// Type definitions for program history, workout sessions, and PR tracking

// =============================================================================
// SNAPSHOT TYPES (Stored as JSON in database)
// =============================================================================

/**
 * Snapshot of athlete inputs at program generation time
 */
export interface AthleteInputsSnapshot {
  bodyweight?: number
  weightUnit?: 'kg' | 'lbs'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingDaysPerWeek: number
  sessionLengthMinutes: number
  equipmentAvailable?: string[]
  jointCautions?: string[]
  
  // Goals at time of generation
  primaryGoal?: string
  secondaryGoal?: string
  selectedSkills?: string[]
  
  // Strength benchmarks at time
  pullUpMax?: number
  pushUpMax?: number
  dipMax?: number
  weightedPullUpLoad?: number
  weightedDipLoad?: number
  
  // Skill levels at time
  frontLeverProgression?: string
  plancheProgression?: string
  muscleUpReadiness?: string
  hspuProgression?: string
  
  // Recovery/lifestyle at time
  sleepQuality?: string
  stressLevel?: string
  recoveryConfidence?: string
}

/**
 * Snapshot of program goals at generation time
 */
export interface GoalsSnapshot {
  primaryGoal: string
  primaryGoalLabel?: string
  secondaryEmphasis?: string
  selectedSkills?: string[]
  targetTimeline?: string
  specificTargets?: Array<{
    exercise: string
    currentValue?: number
    targetValue?: number
    unit?: string
  }>
}

/**
 * Snapshot of complete program structure
 */
export interface ProgramStructureSnapshot {
  programName: string
  daysPerWeek: number
  sessionLengthMinutes: number
  blockStructure?: string
  
  // Full day-by-day structure
  days: Array<{
    dayNumber: number
    dayLabel: string
    focus: string
    exercises: Array<{
      exerciseId: string
      exerciseName: string
      category: string
      sets?: number
      reps?: string
      hold?: string
      rest?: string
      notes?: string
    }>
  }>
  
  // Program metadata
  strengthNote?: string
  coachingNotes?: string[]
}

/**
 * Snapshot of session metrics
 */
export interface SessionMetricsSnapshot {
  totalVolume?: number
  totalSets?: number
  totalReps?: number
  totalHoldTime?: number
  workoutDensity?: number
  
  // Time metrics
  plannedDurationMinutes?: number
  actualDurationMinutes?: number
  
  // Performance metrics
  averageRPE?: number
  completionRate?: number
  
  // Fatigue/recovery
  preFatigue?: number
  postFatigue?: number
  perceivedDifficulty?: number
}

/**
 * Individual exercise result in a session
 */
export interface ExerciseResultSnapshot {
  exerciseId: string
  exerciseName: string
  category: 'skill' | 'strength' | 'weighted' | 'bodyweight' | 'mobility' | 'conditioning'
  
  // Prescribed vs actual
  prescribed: {
    sets?: number
    reps?: string
    hold?: string
    weight?: number
    rest?: string
  }
  actual: {
    setsCompleted: number
    repsPerSet?: number[]
    holdPerSet?: number[]
    weightUsed?: number
    restTaken?: number
  }
  
  // Performance
  wasCompleted: boolean
  wasSkipped: boolean
  difficultyRating?: number
  formQuality?: 'poor' | 'moderate' | 'good' | 'excellent'
  notes?: string
  
  // PR flag
  isPR?: boolean
  prType?: string
}

/**
 * PR achieved in a session
 */
export interface PRHitSnapshot {
  exerciseKey: string
  exerciseName: string
  prType: PRType
  newValue: number
  previousValue?: number
  unit: string
  improvement?: number
  improvementPercent?: number
}

// =============================================================================
// MAIN HISTORY TYPES
// =============================================================================

export type ProgramStatus = 'active' | 'archived' | 'replaced' | 'completed' | 'paused'
export type SessionStatus = 'completed' | 'partial' | 'skipped' | 'deload'
export type PRType = 
  | 'max_weight' 
  | 'best_reps' 
  | 'best_hold' 
  | 'best_volume' 
  | 'best_density' 
  | 'best_level' 
  | 'best_sets'
  | 'first_unlock'
export type ExerciseCategory = 'skill' | 'strength' | 'weighted' | 'bodyweight' | 'mobility' | 'conditioning'

/**
 * Program history entry
 */
export interface ProgramHistory {
  id: string
  userId: string
  sourceProgramId?: string
  versionNumber: number
  programName: string
  status: ProgramStatus
  
  // Generation context
  generationReason: string
  reasonSummary?: string
  
  // Full snapshots
  goalsSnapshot: GoalsSnapshot
  athleteInputsSnapshot: AthleteInputsSnapshot
  programStructureSnapshot: ProgramStructureSnapshot
  
  // Quick access fields
  primaryGoal?: string
  trainingDaysPerWeek?: number
  sessionLengthMinutes?: number
  blockSummary?: string
  
  // Notes
  userNotes?: string
  
  // Stats
  totalSessionsCompleted: number
  totalPRsAchieved: number
  
  // Timestamps
  createdAt: string
  archivedAt?: string
  completedAt?: string
}

/**
 * Workout session history entry
 */
export interface WorkoutSessionHistory {
  id: string
  userId: string
  programHistoryId?: string
  activeProgramId?: string
  
  // Session identification
  workoutDate: string
  workoutName: string
  dayLabel?: string
  sessionNumber?: number
  
  // Status
  sessionStatus: SessionStatus
  
  // Summary
  summaryMessage?: string
  
  // Full snapshots
  sessionMetricsSnapshot: SessionMetricsSnapshot
  exerciseResultsSnapshot: ExerciseResultSnapshot[]
  prsHitSnapshot: PRHitSnapshot[]
  
  // Quick access metrics
  durationMinutes?: number
  totalVolume?: number
  exercisesCompleted?: number
  exercisesSkipped?: number
  fatigueRating?: number
  difficultyRating?: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Personal record history entry
 */
export interface PersonalRecordHistory {
  id: string
  userId: string
  
  // Exercise identification
  exerciseKey: string
  exerciseName: string
  exerciseCategory?: ExerciseCategory
  
  // PR details
  prType: PRType
  valuePrimary: number
  valueSecondary?: number
  unit?: string
  
  // Context
  achievedAt: string
  workoutSessionId?: string
  programHistoryId?: string
  bodyweightAtTime?: number
  notes?: string
  
  // Timestamps
  createdAt: string
}

// =============================================================================
// INPUT TYPES FOR CREATING HISTORY ENTRIES
// =============================================================================

export interface CreateProgramHistoryInput {
  userId: string
  sourceProgramId?: string
  versionNumber?: number
  programName: string
  generationReason: string
  reasonSummary?: string
  goalsSnapshot: GoalsSnapshot
  athleteInputsSnapshot: AthleteInputsSnapshot
  programStructureSnapshot: ProgramStructureSnapshot
  primaryGoal?: string
  trainingDaysPerWeek?: number
  sessionLengthMinutes?: number
  blockSummary?: string
  userNotes?: string
}

export interface CreateWorkoutSessionInput {
  userId: string
  programHistoryId?: string
  activeProgramId?: string
  workoutDate: string
  workoutName: string
  dayLabel?: string
  sessionNumber?: number
  sessionStatus?: SessionStatus
  summaryMessage?: string
  sessionMetricsSnapshot: SessionMetricsSnapshot
  exerciseResultsSnapshot: ExerciseResultSnapshot[]
  prsHitSnapshot?: PRHitSnapshot[]
  durationMinutes?: number
  totalVolume?: number
  exercisesCompleted?: number
  exercisesSkipped?: number
  fatigueRating?: number
  difficultyRating?: number
}

export interface CreatePersonalRecordInput {
  userId: string
  exerciseKey: string
  exerciseName: string
  exerciseCategory?: ExerciseCategory
  prType: PRType
  valuePrimary: number
  valueSecondary?: number
  unit?: string
  workoutSessionId?: string
  programHistoryId?: string
  bodyweightAtTime?: number
  notes?: string
}

// =============================================================================
// QUERY OPTIONS
// =============================================================================

export interface HistoryQueryOptions {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  status?: ProgramStatus | SessionStatus
  sortOrder?: 'asc' | 'desc'
}

export interface PRQueryOptions extends HistoryQueryOptions {
  prType?: PRType
  exerciseCategory?: ExerciseCategory
}
