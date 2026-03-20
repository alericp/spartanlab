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
    
    // TASK 1: Upsert - creates new or updates existing profile
    // This ensures one canonical DB row per authenticated user
    const upsertResult = await query(`
      INSERT INTO athlete_profiles (
        id,
        user_id,
        sex,
        experience_level,
        training_days_per_week,
        schedule_mode,
        session_length_minutes,
        primary_goal,
        equipment_available,
        joint_cautions,
        weakest_area,
        training_style,
        onboarding_complete,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        sex = COALESCE($2::text, athlete_profiles.sex),
        experience_level = COALESCE($3::text, athlete_profiles.experience_level),
        training_days_per_week = COALESCE($4::int, athlete_profiles.training_days_per_week),
        schedule_mode = COALESCE($5::text, athlete_profiles.schedule_mode),
        session_length_minutes = COALESCE($6::int, athlete_profiles.session_length_minutes),
        primary_goal = COALESCE($7::text, athlete_profiles.primary_goal),
        equipment_available = COALESCE($8::jsonb, athlete_profiles.equipment_available),
        joint_cautions = COALESCE($9::jsonb, athlete_profiles.joint_cautions),
        weakest_area = COALESCE($10::text, athlete_profiles.weakest_area),
        training_style = COALESCE($11::text, athlete_profiles.training_style),
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
        session_length_minutes as "sessionLengthMinutes",
        primary_goal as "primaryGoal",
        equipment_available as "equipmentAvailable",
        joint_cautions as "jointCautions",
        weakest_area as "weakestArea",
        training_style as "trainingStyle",
        onboarding_complete as "onboardingComplete"
    `, [
      userId,
      profileData.sex || null,
      profileData.experienceLevel || 'beginner',
      // TASK 2: For flexible users, trainingDaysPerWeek may be null - don't default to 4
      // This preserves flexible as a true preference, not a fake 4-day identity
      profileData.scheduleMode === 'flexible' ? null : (profileData.trainingDaysPerWeek || 4),
      profileData.scheduleMode || 'static',
      profileData.sessionLengthMinutes || 60,
      profileData.primaryGoal || null,
      profileData.equipmentAvailable ? JSON.stringify(profileData.equipmentAvailable) : JSON.stringify([]),
      profileData.jointCautions ? JSON.stringify(profileData.jointCautions) : JSON.stringify([]),
      profileData.weakestArea || null,
      profileData.trainingStyle || 'balanced_hybrid',
    ])
    
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
