'use server'

import { getSqlClient, isDatabaseAvailable } from './db'
import type { SkillProgression, AthleteProfile } from '@/types/domain'

// =============================================================================
// DATABASE ROW TYPES (snake_case from Postgres)
// =============================================================================

interface SkillProgressionRow {
  id: string
  user_id: string
  skill_name: string
  current_level: number
  target_level: number
  progress_score: number
  last_updated: string
  created_at: string
}

interface AthleteProfileRow {
  id: string
  user_id: string
  sex: string | null
  height: number | null
  height_unit: string
  bodyweight: number | null
  weight_unit: string
  experience_level: string
  training_days_per_week: number
  session_length_minutes: number
  goal_category: string | null
  selected_skills: string[] | null
  selected_flexibility: string[] | null
  selected_strength: string[] | null
  primary_goal: string | null
  equipment_available: string[] | null
  range_intent: string | null
  range_training_mode: string | null
  pull_up_max: number | null
  dip_max: number | null
  onboarding_complete: boolean
  created_at: string
  updated_at: string | null
}

// =============================================================================
// TYPE TRANSFORMERS (Database Row -> Domain Type)
// =============================================================================

function toSkillProgression(row: SkillProgressionRow): SkillProgression {
  return {
    id: row.id,
    userId: row.user_id,
    skillName: row.skill_name,
    currentLevel: row.current_level,
    targetLevel: row.target_level,
    progressScore: row.progress_score,
    lastUpdated: row.last_updated,
    createdAt: row.created_at,
  }
}

function toAthleteProfile(row: AthleteProfileRow): AthleteProfile {
  return {
    id: row.id,
    userId: row.user_id,
    sex: row.sex as AthleteProfile['sex'],
    height: row.height,
    heightUnit: row.height_unit as AthleteProfile['heightUnit'],
    bodyweight: row.bodyweight,
    weightUnit: row.weight_unit as AthleteProfile['weightUnit'],
    experienceLevel: row.experience_level as AthleteProfile['experienceLevel'],
    trainingDaysPerWeek: row.training_days_per_week,
    sessionLengthMinutes: row.session_length_minutes as AthleteProfile['sessionLengthMinutes'],
    goalCategory: row.goal_category as AthleteProfile['goalCategory'],
    selectedSkills: (row.selected_skills || []) as AthleteProfile['selectedSkills'],
    selectedFlexibility: (row.selected_flexibility || []) as AthleteProfile['selectedFlexibility'],
    selectedStrength: (row.selected_strength || []) as AthleteProfile['selectedStrength'],
    primaryGoal: row.primary_goal,
    equipmentAvailable: (row.equipment_available || []) as AthleteProfile['equipmentAvailable'],
    rangeIntent: row.range_intent as AthleteProfile['rangeIntent'],
    rangeTrainingMode: row.range_training_mode as AthleteProfile['rangeTrainingMode'],
    pullUpMax: row.pull_up_max,
    dipMax: row.dip_max,
    onboardingComplete: row.onboarding_complete,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  }
}

// =============================================================================
// SKILL PROGRESSION QUERIES
// =============================================================================

export async function dbGetSkills(userId: string): Promise<SkillProgression[]> {
  if (!(await isDatabaseAvailable())) return []
  
  const sql = await getSqlClient()
  if (!sql) return []
  
  try {
    const rows = await sql`
      SELECT * FROM skill_progressions 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    return rows.map(toSkillProgression)
  } catch (error) {
    console.error('[SpartanLab DB] Error fetching skills:', error)
    return []
  }
}

export async function dbGetSkill(userId: string, skillName: string): Promise<SkillProgression | null> {
  if (!(await isDatabaseAvailable())) return null
  
  const sql = await getSqlClient()
  if (!sql) return null
  
  try {
    const rows = await sql`
      SELECT * FROM skill_progressions 
      WHERE user_id = ${userId} AND skill_name = ${skillName}
      LIMIT 1
    `
    return rows.length > 0 ? toSkillProgression(rows[0]) : null
  } catch (error) {
    console.error('[SpartanLab DB] Error fetching skill:', error)
    return null
  }
}

export async function dbSaveSkill(
  userId: string, 
  data: Omit<SkillProgression, 'id' | 'userId' | 'createdAt'>
): Promise<SkillProgression | null> {
  if (!(await isDatabaseAvailable())) return null
  
  const sql = await getSqlClient()
  if (!sql) return null
  
  try {
    // Check if skill already exists for this user
    const existing = await dbGetSkill(userId, data.skillName)
    
    if (existing) {
      // Update existing skill
      const rows = await sql`
        UPDATE skill_progressions 
        SET 
          current_level = ${data.currentLevel},
          target_level = ${data.targetLevel},
          progress_score = ${data.progressScore},
          last_updated = ${data.lastUpdated}
        WHERE user_id = ${userId} AND skill_name = ${data.skillName}
        RETURNING *
      `
      return rows.length > 0 ? toSkillProgression(rows[0]) : null
    } else {
      // Insert new skill
      const id = `skill-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const rows = await sql`
        INSERT INTO skill_progressions (id, user_id, skill_name, current_level, target_level, progress_score, last_updated, created_at)
        VALUES (${id}, ${userId}, ${data.skillName}, ${data.currentLevel}, ${data.targetLevel}, ${data.progressScore}, ${data.lastUpdated}, NOW())
        RETURNING *
      `
      return rows.length > 0 ? toSkillProgression(rows[0]) : null
    }
  } catch (error) {
    console.error('[SpartanLab DB] Error saving skill:', error)
    return null
  }
}

export async function dbDeleteSkill(userId: string, id: string): Promise<boolean> {
  if (!(await isDatabaseAvailable())) return false
  
  const sql = await getSqlClient()
  if (!sql) return false
  
  try {
    const result = await sql`
      DELETE FROM skill_progressions 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `
    return result.length > 0
  } catch (error) {
    console.error('[SpartanLab DB] Error deleting skill:', error)
    return false
  }
}

// =============================================================================
// ATHLETE PROFILE QUERIES
// =============================================================================

export async function dbGetProfile(userId: string): Promise<AthleteProfile | null> {
  if (!(await isDatabaseAvailable())) return null
  
  const sql = await getSqlClient()
  if (!sql) return null
  
  try {
    const rows = await sql`
      SELECT * FROM athlete_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `
    return rows.length > 0 ? toAthleteProfile(rows[0]) : null
  } catch (error) {
    console.error('[SpartanLab DB] Error fetching profile:', error)
    return null
  }
}

export async function dbSaveProfile(
  userId: string, 
  data: Partial<AthleteProfile>
): Promise<AthleteProfile | null> {
  if (!(await isDatabaseAvailable())) return null
  
  const sql = await getSqlClient()
  if (!sql) return null
  
  try {
    // Check if profile already exists
    const existing = await dbGetProfile(userId)
    
    if (existing) {
      // Update existing profile - only update fields that are provided
      const rows = await sql`
        UPDATE athlete_profiles 
        SET 
          sex = COALESCE(${data.sex ?? null}, sex),
          height = COALESCE(${data.height ?? null}, height),
          height_unit = COALESCE(${data.heightUnit ?? null}, height_unit),
          bodyweight = COALESCE(${data.bodyweight ?? null}, bodyweight),
          weight_unit = COALESCE(${data.weightUnit ?? null}, weight_unit),
          experience_level = COALESCE(${data.experienceLevel ?? null}, experience_level),
          training_days_per_week = COALESCE(${data.trainingDaysPerWeek ?? null}, training_days_per_week),
          session_length_minutes = COALESCE(${data.sessionLengthMinutes ?? null}, session_length_minutes),
          goal_category = COALESCE(${data.goalCategory ?? null}, goal_category),
          selected_skills = COALESCE(${data.selectedSkills ?? null}, selected_skills),
          selected_flexibility = COALESCE(${data.selectedFlexibility ?? null}, selected_flexibility),
          selected_strength = COALESCE(${data.selectedStrength ?? null}, selected_strength),
          primary_goal = COALESCE(${data.primaryGoal ?? null}, primary_goal),
          equipment_available = COALESCE(${data.equipmentAvailable ?? null}, equipment_available),
          range_intent = COALESCE(${data.rangeIntent ?? null}, range_intent),
          range_training_mode = COALESCE(${data.rangeTrainingMode ?? null}, range_training_mode),
          pull_up_max = COALESCE(${data.pullUpMax ?? null}, pull_up_max),
          dip_max = COALESCE(${data.dipMax ?? null}, dip_max),
          onboarding_complete = COALESCE(${data.onboardingComplete ?? null}, onboarding_complete),
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `
      return rows.length > 0 ? toAthleteProfile(rows[0]) : null
    } else {
      // Insert new profile with defaults
      const id = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const rows = await sql`
        INSERT INTO athlete_profiles (
          id, user_id, sex, height, height_unit, bodyweight, weight_unit,
          experience_level, training_days_per_week, session_length_minutes,
          goal_category, selected_skills, selected_flexibility, selected_strength,
          primary_goal, equipment_available, range_intent, range_training_mode,
          pull_up_max, dip_max, onboarding_complete, created_at
        )
        VALUES (
          ${id}, ${userId}, ${data.sex ?? null}, ${data.height ?? null}, ${data.heightUnit ?? 'inches'},
          ${data.bodyweight ?? null}, ${data.weightUnit ?? 'lbs'}, ${data.experienceLevel ?? 'intermediate'},
          ${data.trainingDaysPerWeek ?? 4}, ${data.sessionLengthMinutes ?? 60},
          ${data.goalCategory ?? null}, ${data.selectedSkills ?? []}, ${data.selectedFlexibility ?? []},
          ${data.selectedStrength ?? []}, ${data.primaryGoal ?? null}, ${data.equipmentAvailable ?? []},
          ${data.rangeIntent ?? null}, ${data.rangeTrainingMode ?? null},
          ${data.pullUpMax ?? null}, ${data.dipMax ?? null}, ${data.onboardingComplete ?? false}, NOW()
        )
        RETURNING *
      `
      return rows.length > 0 ? toAthleteProfile(rows[0]) : null
    }
  } catch (error) {
    console.error('[SpartanLab DB] Error saving profile:', error)
    return null
  }
}
