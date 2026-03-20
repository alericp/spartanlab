import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/onboarding/profile - Upsert athlete profile on onboarding completion
 * 
 * This is the canonical DB write for authenticated users completing onboarding.
 * After this, /api/settings can read the real profile immediately.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getSession()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - must be signed in to save profile' 
      }, { status: 401 })
    }
    
    const profileData = await request.json()
    
    // Validate required fields
    if (!profileData || typeof profileData !== 'object') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid profile data' 
      }, { status: 400 })
    }
    
    // Upsert athlete profile - create or update
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
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        sex = COALESCE(EXCLUDED.sex, athlete_profiles.sex),
        experience_level = COALESCE(EXCLUDED.experience_level, athlete_profiles.experience_level),
        training_days_per_week = COALESCE(EXCLUDED.training_days_per_week, athlete_profiles.training_days_per_week),
        schedule_mode = COALESCE(EXCLUDED.schedule_mode, athlete_profiles.schedule_mode),
        session_length_minutes = COALESCE(EXCLUDED.session_length_minutes, athlete_profiles.session_length_minutes),
        primary_goal = COALESCE(EXCLUDED.primary_goal, athlete_profiles.primary_goal),
        equipment_available = COALESCE(EXCLUDED.equipment_available, athlete_profiles.equipment_available),
        joint_cautions = COALESCE(EXCLUDED.joint_cautions, athlete_profiles.joint_cautions),
        weakest_area = COALESCE(EXCLUDED.weakest_area, athlete_profiles.weakest_area),
        onboarding_complete = true,
        updated_at = NOW()
      RETURNING 
        id,
        user_id as "userId",
        sex,
        experience_level as "experienceLevel",
        training_days_per_week as "trainingDaysPerWeek",
        COALESCE(schedule_mode, 'static') as "scheduleMode",
        session_length_minutes as "sessionLengthMinutes",
        primary_goal as "primaryGoal",
        equipment_available as "equipmentAvailable",
        joint_cautions as "jointCautions",
        weakest_area as "weakestArea",
        onboarding_complete as "onboardingComplete",
        created_at as "createdAt"
    `, [
      userId,
      profileData.sex || null,
      profileData.experienceLevel || 'beginner',
      profileData.trainingDaysPerWeek || 4,
      profileData.scheduleMode || 'static',
      profileData.sessionLengthMinutes || 60,
      profileData.primaryGoal || null,
      JSON.stringify(profileData.equipmentAvailable || []),
      JSON.stringify(profileData.jointCautions || []),
      profileData.weakestArea || null,
    ])
    
    if (!upsertResult || upsertResult.length === 0) {
      console.error('[Onboarding API] Upsert returned no result')
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save profile' 
      }, { status: 500 })
    }
    
    const savedProfile = upsertResult[0]
    
    console.log('[Onboarding API] Profile upserted successfully for user:', userId)
    
    return NextResponse.json({
      success: true,
      profile: savedProfile,
      message: 'Profile saved to database',
    })
    
  } catch (error) {
    console.error('[Onboarding API] Error upserting profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save onboarding profile' },
      { status: 500 }
    )
  }
}
