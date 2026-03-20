import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * TASK 1: POST /api/onboarding/profile - Canonical DB write for onboarding
 * 
 * This endpoint upserts the athlete profile to the real authenticated database.
 * After this completes, /api/settings can immediately read the real profile.
 * This is the key to ensuring onboarding truth == settings truth == dashboard truth.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getSession()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const profileData = await request.json()
    
    if (!profileData || typeof profileData !== 'object') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid profile data' 
      }, { status: 400 })
    }
    
    // ==========================================================================
    // TASK A FIX: Upsert ALL profile fields including previously missing ones
    // Previously missing: secondary_goal, selected_skills, selected_flexibility,
    // selected_strength, goal_category, session_duration_mode
    // ==========================================================================
    const upsertResult = await query(`
      INSERT INTO athlete_profiles (
        id,
        user_id,
        sex,
        experience_level,
        training_days_per_week,
        schedule_mode,
        session_duration_mode,
        session_length_minutes,
        primary_goal,
        secondary_goal,
        selected_skills,
        selected_flexibility,
        selected_strength,
        goal_category,
        equipment_available,
        joint_cautions,
        weakest_area,
        training_style,
        onboarding_complete,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid()::text,
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        true, NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        sex = COALESCE($2::text, athlete_profiles.sex),
        experience_level = COALESCE($3::text, athlete_profiles.experience_level),
        training_days_per_week = $4::int,
        schedule_mode = COALESCE($5::text, athlete_profiles.schedule_mode),
        session_duration_mode = COALESCE($6::varchar, athlete_profiles.session_duration_mode),
        session_length_minutes = COALESCE($7::int, athlete_profiles.session_length_minutes),
        primary_goal = COALESCE($8::text, athlete_profiles.primary_goal),
        secondary_goal = $9::text,
        selected_skills = COALESCE($10::jsonb, athlete_profiles.selected_skills),
        selected_flexibility = COALESCE($11::jsonb, athlete_profiles.selected_flexibility),
        selected_strength = COALESCE($12::jsonb, athlete_profiles.selected_strength),
        goal_category = $13::text,
        equipment_available = COALESCE($14::jsonb, athlete_profiles.equipment_available),
        joint_cautions = COALESCE($15::jsonb, athlete_profiles.joint_cautions),
        weakest_area = $16::text,
        training_style = COALESCE($17::text, athlete_profiles.training_style),
        onboarding_complete = true,
        updated_at = NOW()
      RETURNING 
        user_id as "userId",
        sex,
        height,
        height_unit as "heightUnit",
        bodyweight,
        weight_unit as "weightUnit",
        body_fat_percent as "bodyFatPercent",
        experience_level as "experienceLevel",
        training_days_per_week as "trainingDaysPerWeek",
        COALESCE(schedule_mode, 'static') as "scheduleMode",
        COALESCE(session_duration_mode, 'static') as "sessionDurationMode",
        session_length_minutes as "sessionLengthMinutes",
        primary_goal as "primaryGoal",
        secondary_goal as "secondaryGoal",
        selected_skills as "selectedSkills",
        selected_flexibility as "selectedFlexibility",
        selected_strength as "selectedStrength",
        goal_category as "goalCategory",
        equipment_available as "equipmentAvailable",
        joint_cautions as "jointCautions",
        weakest_area as "weakestArea",
        training_style as "trainingStyle",
        onboarding_complete as "onboardingComplete"
    `, [
      userId,
      profileData.sex || null,
      profileData.experienceLevel || 'beginner',
      // ISSUE A FIX: For flexible users, trainingDaysPerWeek is null
      // For static users, use their actual value - do NOT fallback to 4
      profileData.scheduleMode === 'flexible' ? null : (profileData.trainingDaysPerWeek ?? null),
      profileData.scheduleMode || 'static',
      profileData.sessionDurationMode || 'static',
      // ISSUE A FIX: Do NOT fallback to 60 - preserve actual canonical value
      profileData.sessionLengthMinutes ?? null,
      profileData.primaryGoal || null,
      profileData.secondaryGoal || null,
      profileData.selectedSkills ? JSON.stringify(profileData.selectedSkills) : JSON.stringify([]),
      profileData.selectedFlexibility ? JSON.stringify(profileData.selectedFlexibility) : JSON.stringify([]),
      profileData.selectedStrength ? JSON.stringify(profileData.selectedStrength) : JSON.stringify([]),
      profileData.goalCategory || null,
      profileData.equipmentAvailable ? JSON.stringify(profileData.equipmentAvailable) : JSON.stringify([]),
      profileData.jointCautions ? JSON.stringify(profileData.jointCautions) : JSON.stringify([]),
      profileData.weakestArea || null,
      profileData.trainingStyle || 'balanced_hybrid',
    ])
    
    // TASK 6: Log what was actually saved
    console.log('[Onboarding API] TASK A FIX: Saved ALL profile fields:', {
      userId,
      primaryGoal: profileData.primaryGoal,
      secondaryGoal: profileData.secondaryGoal,
      selectedSkillsCount: profileData.selectedSkills?.length || 0,
      selectedFlexibilityCount: profileData.selectedFlexibility?.length || 0,
      sessionDurationMode: profileData.sessionDurationMode,
      scheduleMode: profileData.scheduleMode,
    })
    
    if (!upsertResult || upsertResult.length === 0) {
      console.error('[Onboarding API] Upsert returned no result for user:', userId)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save profile' 
      }, { status: 500 })
    }
    
    const savedProfile = upsertResult[0]
    
    console.log('[Onboarding API] Profile upserted successfully for user:', userId, {
      scheduleMode: savedProfile.scheduleMode,
      onboardingComplete: savedProfile.onboardingComplete,
    })
    
    return NextResponse.json({
      success: true,
      profile: savedProfile,
    })
    
  } catch (error) {
    console.error('[Onboarding API] Error upserting profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save onboarding profile' },
      { status: 500 }
    )
  }
}
