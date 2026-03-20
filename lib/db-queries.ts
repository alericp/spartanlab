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
  // Physical attributes
  sex: string | null
  height: number | null
  height_unit: string
  bodyweight: number | null
  weight_unit: string
  body_fat_percent: number | null
  body_fat_source: string | null
  training_experience: string | null
  experience_level: string
  // Goals
  goal_categories: string[] | null
  goal_category: string | null
  primary_goal: string | null
  secondary_goal: string | null
  selected_skills: string[] | null
  selected_flexibility: string[] | null
  selected_strength: string[] | null
  // Strength benchmarks
  pull_up_max: number | null
  push_up_max: number | null
  dip_max: number | null
  wall_hspu_reps: number | null
  weighted_pull_up_load: number | null
  weighted_pull_up_unit: string | null
  weighted_dip_load: number | null
  weighted_dip_unit: string | null
  // Skill benchmarks
  front_lever_progression: string | null
  front_lever_hold_seconds: number | null
  planche_progression: string | null
  planche_hold_seconds: number | null
  muscle_up_readiness: string | null
  hspu_progression: string | null
  l_sit_hold_seconds: number | null
  v_sit_hold_seconds: number | null
  // Flexibility benchmarks
  pancake_level: string | null
  pancake_range_intent: string | null
  toe_touch_level: string | null
  front_splits_level: string | null
  front_splits_range_intent: string | null
  side_splits_level: string | null
  side_splits_range_intent: string | null
  // Equipment & schedule
  equipment_available: string[] | null
  training_days_per_week: number
  session_length_minutes: number
  session_style: string | null
  // Recovery / lifestyle
  sleep_quality: string | null
  energy_level: string | null
  stress_level: string | null
  recovery_confidence: string | null
  // Injury flags
  joint_cautions: string[] | null
  primary_limitation: string | null
  weakest_area: string | null
  // Range/flexibility intent
  range_intent: string | null
  range_training_mode: string | null
  // Meta
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
    // Physical attributes
    sex: row.sex as AthleteProfile['sex'],
    height: row.height,
    heightUnit: row.height_unit as AthleteProfile['heightUnit'],
    bodyweight: row.bodyweight,
    weightUnit: row.weight_unit as AthleteProfile['weightUnit'],
    bodyFatPercent: row.body_fat_percent,
    bodyFatSource: row.body_fat_source as AthleteProfile['bodyFatSource'],
    trainingExperience: row.training_experience as AthleteProfile['trainingExperience'],
    experienceLevel: row.experience_level as AthleteProfile['experienceLevel'],
    // Goals
    goalCategories: (row.goal_categories || []) as AthleteProfile['goalCategories'],
    goalCategory: row.goal_category as AthleteProfile['goalCategory'],
    primaryGoal: row.primary_goal,
    secondaryGoal: row.secondary_goal,
    selectedSkills: (row.selected_skills || []) as AthleteProfile['selectedSkills'],
    selectedFlexibility: (row.selected_flexibility || []) as AthleteProfile['selectedFlexibility'],
    selectedStrength: (row.selected_strength || []) as AthleteProfile['selectedStrength'],
    // Strength benchmarks
    pullUpMax: row.pull_up_max,
    pushUpMax: row.push_up_max,
    dipMax: row.dip_max,
    wallHspuReps: row.wall_hspu_reps,
    weightedPullUpLoad: row.weighted_pull_up_load,
    weightedPullUpUnit: row.weighted_pull_up_unit as AthleteProfile['weightedPullUpUnit'],
    weightedDipLoad: row.weighted_dip_load,
    weightedDipUnit: row.weighted_dip_unit as AthleteProfile['weightedDipUnit'],
    // Skill benchmarks
    frontLeverProgression: row.front_lever_progression,
    frontLeverHoldSeconds: row.front_lever_hold_seconds,
    plancheProgression: row.planche_progression,
    plancheHoldSeconds: row.planche_hold_seconds,
    muscleUpReadiness: row.muscle_up_readiness,
    hspuProgression: row.hspu_progression,
    lSitHoldSeconds: row.l_sit_hold_seconds,
    vSitHoldSeconds: row.v_sit_hold_seconds,
    // Flexibility benchmarks
    pancakeLevel: row.pancake_level,
    pancakeRangeIntent: row.pancake_range_intent as AthleteProfile['pancakeRangeIntent'],
    toeTouchLevel: row.toe_touch_level,
    frontSplitsLevel: row.front_splits_level,
    frontSplitsRangeIntent: row.front_splits_range_intent as AthleteProfile['frontSplitsRangeIntent'],
    sideSplitsLevel: row.side_splits_level,
    sideSplitsRangeIntent: row.side_splits_range_intent as AthleteProfile['sideSplitsRangeIntent'],
    // Equipment & schedule
    equipmentAvailable: (row.equipment_available || []) as AthleteProfile['equipmentAvailable'],
    trainingDaysPerWeek: row.training_days_per_week,
    sessionLengthMinutes: row.session_length_minutes as AthleteProfile['sessionLengthMinutes'],
    sessionStyle: row.session_style as AthleteProfile['sessionStyle'],
    // Recovery / lifestyle
    sleepQuality: row.sleep_quality as AthleteProfile['sleepQuality'],
    energyLevel: row.energy_level as AthleteProfile['energyLevel'],
    stressLevel: row.stress_level as AthleteProfile['stressLevel'],
    recoveryConfidence: row.recovery_confidence as AthleteProfile['recoveryConfidence'],
    // Range intent
    rangeIntent: row.range_intent as AthleteProfile['rangeIntent'],
    rangeTrainingMode: row.range_training_mode as AthleteProfile['rangeTrainingMode'],
    // Meta
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
          -- Physical attributes
          sex = COALESCE(${data.sex ?? null}, sex),
          height = COALESCE(${data.height ?? null}, height),
          height_unit = COALESCE(${data.heightUnit ?? null}, height_unit),
          bodyweight = COALESCE(${data.bodyweight ?? null}, bodyweight),
          weight_unit = COALESCE(${data.weightUnit ?? null}, weight_unit),
          body_fat_percent = COALESCE(${data.bodyFatPercent ?? null}, body_fat_percent),
          body_fat_source = COALESCE(${data.bodyFatSource ?? null}, body_fat_source),
          training_experience = COALESCE(${data.trainingExperience ?? null}, training_experience),
          experience_level = COALESCE(${data.experienceLevel ?? null}, experience_level),
          -- Goals
          goal_categories = COALESCE(${data.goalCategories ?? null}, goal_categories),
          goal_category = COALESCE(${data.goalCategory ?? null}, goal_category),
          primary_goal = COALESCE(${data.primaryGoal ?? null}, primary_goal),
          secondary_goal = COALESCE(${data.secondaryGoal ?? null}, secondary_goal),
          selected_skills = COALESCE(${data.selectedSkills ?? null}, selected_skills),
          selected_flexibility = COALESCE(${data.selectedFlexibility ?? null}, selected_flexibility),
          selected_strength = COALESCE(${data.selectedStrength ?? null}, selected_strength),
          -- Strength benchmarks
          pull_up_max = COALESCE(${data.pullUpMax ?? null}, pull_up_max),
          push_up_max = COALESCE(${data.pushUpMax ?? null}, push_up_max),
          dip_max = COALESCE(${data.dipMax ?? null}, dip_max),
          wall_hspu_reps = COALESCE(${data.wallHspuReps ?? null}, wall_hspu_reps),
          weighted_pull_up_load = COALESCE(${data.weightedPullUpLoad ?? null}, weighted_pull_up_load),
          weighted_pull_up_unit = COALESCE(${data.weightedPullUpUnit ?? null}, weighted_pull_up_unit),
          weighted_dip_load = COALESCE(${data.weightedDipLoad ?? null}, weighted_dip_load),
          weighted_dip_unit = COALESCE(${data.weightedDipUnit ?? null}, weighted_dip_unit),
          -- Skill benchmarks
          front_lever_progression = COALESCE(${data.frontLeverProgression ?? null}, front_lever_progression),
          front_lever_hold_seconds = COALESCE(${data.frontLeverHoldSeconds ?? null}, front_lever_hold_seconds),
          planche_progression = COALESCE(${data.plancheProgression ?? null}, planche_progression),
          planche_hold_seconds = COALESCE(${data.plancheHoldSeconds ?? null}, planche_hold_seconds),
          muscle_up_readiness = COALESCE(${data.muscleUpReadiness ?? null}, muscle_up_readiness),
          hspu_progression = COALESCE(${data.hspuProgression ?? null}, hspu_progression),
          l_sit_hold_seconds = COALESCE(${data.lSitHoldSeconds ?? null}, l_sit_hold_seconds),
          v_sit_hold_seconds = COALESCE(${data.vSitHoldSeconds ?? null}, v_sit_hold_seconds),
          -- Flexibility benchmarks
          pancake_level = COALESCE(${data.pancakeLevel ?? null}, pancake_level),
          pancake_range_intent = COALESCE(${data.pancakeRangeIntent ?? null}, pancake_range_intent),
          toe_touch_level = COALESCE(${data.toeTouchLevel ?? null}, toe_touch_level),
          front_splits_level = COALESCE(${data.frontSplitsLevel ?? null}, front_splits_level),
          front_splits_range_intent = COALESCE(${data.frontSplitsRangeIntent ?? null}, front_splits_range_intent),
          side_splits_level = COALESCE(${data.sideSplitsLevel ?? null}, side_splits_level),
          side_splits_range_intent = COALESCE(${data.sideSplitsRangeIntent ?? null}, side_splits_range_intent),
          -- Equipment & schedule
          equipment_available = COALESCE(${data.equipmentAvailable ?? null}, equipment_available),
          training_days_per_week = COALESCE(${data.trainingDaysPerWeek ?? null}, training_days_per_week),
          session_length_minutes = COALESCE(${data.sessionLengthMinutes ?? null}, session_length_minutes),
          session_style = COALESCE(${data.sessionStyle ?? null}, session_style),
          -- Recovery / lifestyle
          sleep_quality = COALESCE(${data.sleepQuality ?? null}, sleep_quality),
          energy_level = COALESCE(${data.energyLevel ?? null}, energy_level),
          stress_level = COALESCE(${data.stressLevel ?? null}, stress_level),
          recovery_confidence = COALESCE(${data.recoveryConfidence ?? null}, recovery_confidence),
          -- Range intent
          range_intent = COALESCE(${data.rangeIntent ?? null}, range_intent),
          range_training_mode = COALESCE(${data.rangeTrainingMode ?? null}, range_training_mode),
          -- Meta
          onboarding_complete = COALESCE(${data.onboardingComplete ?? null}, onboarding_complete),
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `
      return rows.length > 0 ? toAthleteProfile(rows[0]) : null
    } else {
      // Insert new profile with all fields
      const id = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const rows = await sql`
        INSERT INTO athlete_profiles (
          id, user_id, 
          -- Physical attributes
          sex, height, height_unit, bodyweight, weight_unit, body_fat_percent, body_fat_source, training_experience, experience_level,
          -- Goals
          goal_categories, goal_category, primary_goal, secondary_goal, selected_skills, selected_flexibility, selected_strength,
          -- Strength benchmarks
          pull_up_max, push_up_max, dip_max, wall_hspu_reps, weighted_pull_up_load, weighted_pull_up_unit, weighted_dip_load, weighted_dip_unit,
          -- Skill benchmarks
          front_lever_progression, front_lever_hold_seconds, planche_progression, planche_hold_seconds, muscle_up_readiness, hspu_progression, l_sit_hold_seconds, v_sit_hold_seconds,
          -- Flexibility benchmarks
          pancake_level, pancake_range_intent, toe_touch_level, front_splits_level, front_splits_range_intent, side_splits_level, side_splits_range_intent,
          -- Equipment & schedule
          equipment_available, training_days_per_week, session_length_minutes, session_style,
          -- Recovery / lifestyle
          sleep_quality, energy_level, stress_level, recovery_confidence,
          -- Range intent
          range_intent, range_training_mode,
          -- Meta
          onboarding_complete, created_at
        )
        VALUES (
          ${id}, ${userId},
          -- Physical attributes
          ${data.sex ?? null}, ${data.height ?? null}, ${data.heightUnit ?? 'inches'}, ${data.bodyweight ?? null}, ${data.weightUnit ?? 'lbs'},
          ${data.bodyFatPercent ?? null}, ${data.bodyFatSource ?? null}, ${data.trainingExperience ?? null}, ${data.experienceLevel ?? 'intermediate'},
          -- Goals
          ${data.goalCategories ?? []}, ${data.goalCategory ?? null}, ${data.primaryGoal ?? null}, ${data.secondaryGoal ?? null},
          ${data.selectedSkills ?? []}, ${data.selectedFlexibility ?? []}, ${data.selectedStrength ?? []},
          -- Strength benchmarks
          ${data.pullUpMax ?? null}, ${data.pushUpMax ?? null}, ${data.dipMax ?? null}, ${data.wallHspuReps ?? null},
          ${data.weightedPullUpLoad ?? null}, ${data.weightedPullUpUnit ?? null}, ${data.weightedDipLoad ?? null}, ${data.weightedDipUnit ?? null},
          -- Skill benchmarks
          ${data.frontLeverProgression ?? null}, ${data.frontLeverHoldSeconds ?? null}, ${data.plancheProgression ?? null}, ${data.plancheHoldSeconds ?? null},
          ${data.muscleUpReadiness ?? null}, ${data.hspuProgression ?? null}, ${data.lSitHoldSeconds ?? null}, ${data.vSitHoldSeconds ?? null},
          -- Flexibility benchmarks
          ${data.pancakeLevel ?? null}, ${data.pancakeRangeIntent ?? null}, ${data.toeTouchLevel ?? null}, ${data.frontSplitsLevel ?? null},
          ${data.frontSplitsRangeIntent ?? null}, ${data.sideSplitsLevel ?? null}, ${data.sideSplitsRangeIntent ?? null},
          -- Equipment & schedule
          -- ISSUE A FIX: Use null instead of default values (4/60) to preserve canonical truth
          -- Fallbacks should only apply at read-time for display, not at write-time
          ${data.equipmentAvailable ?? []}, ${data.trainingDaysPerWeek ?? null}, ${data.sessionLengthMinutes ?? null}, ${data.sessionStyle ?? null},
          -- Recovery / lifestyle
          ${data.sleepQuality ?? null}, ${data.energyLevel ?? null}, ${data.stressLevel ?? null}, ${data.recoveryConfidence ?? null},
          -- Range intent
          ${data.rangeIntent ?? null}, ${data.rangeTrainingMode ?? null},
          -- Meta
          ${data.onboardingComplete ?? false}, NOW()
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
