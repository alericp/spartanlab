import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { query } from '@/lib/db'
import { buildUnifiedContext } from '@/lib/unified-coaching-engine'
import {
  analyzeSettingsChanges,
  canRegenerate,
  markRegeneration,
  getSessionAdaptations,
  validateContinuityPreservation,
  PRESERVED_SYSTEMS,
  analyzeBenchmarkChanges,
  isDuplicateRegeneration,
  recordRegenerationEvent,
  getRegenerationSessionStrategy,
  type SettingsChangeAnalysis,
  type SessionState,
} from '@/lib/settings-regeneration-service'
import {
  regenerateProgramIfNeeded,
  getActiveProgramVersion,
  recordSessionAdaptation,
  getVersionChangeMessage,
  type GenerationReason,
} from '@/lib/program-version-service'
import { createProgramVersionOnSettingsChange } from '@/lib/program-history-versioning'
import { generateAdaptiveProgram, getDefaultAdaptiveInputs, type AdaptiveProgramInputs } from '@/lib/adaptive-program-builder'
import type { AthleteProfile } from '@/lib/data-service'

export const dynamic = 'force-dynamic'

// =============================================================================
// GET /api/settings - Fetch current settings
// =============================================================================

export async function GET() {
  try {
    const { userId } = await getSession()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // [PHASE 16H] SCHEMA DRIFT FIX: Query only columns that exist in athlete_profiles table
    // Benchmark columns (pull_up_max, dip_max, etc.) were never added to DB schema.
    // Benchmark data is stored in localStorage onboarding profile, not in DB.
    console.log('[phase16h-settings-schema-drift-root-cause-audit]', {
      issue: 'removed_nonexistent_benchmark_columns',
      removedColumns: ['pull_up_max', 'dip_max', 'push_up_max', 'wall_hspu_reps', 'weighted_pull_up', 
        'weighted_dip', 'all_time_pr_pull_up', 'all_time_pr_dip', 'front_lever', 'planche', 
        'muscle_up', 'hspu', 'l_sit_hold', 'v_sit_hold', 'pancake', 'toe_touch', 'front_splits', 'side_splits'],
      timestamp: new Date().toISOString(),
    })
    
    const profiles = await query(`
      SELECT 
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
        goal_category as "goalCategory",
        COALESCE(selected_skills, '[]'::jsonb) as "selectedSkills",
        COALESCE(selected_flexibility, '[]'::jsonb) as "selectedFlexibility",
        COALESCE(selected_strength, '[]'::jsonb) as "selectedStrength",
        COALESCE(equipment_available, '[]'::jsonb) as "equipmentAvailable",
        COALESCE(joint_cautions, '[]'::jsonb) as "jointCautions",
        weakest_area as "weakestArea",
        training_style as "trainingStyle",
        onboarding_complete as "onboardingComplete"
      FROM athlete_profiles
      WHERE user_id = $1
      LIMIT 1
    `, [userId])
    
    console.log('[phase16h-settings-column-resolution-verdict]', {
      success: true,
      profileFound: profiles && profiles.length > 0,
    })
    
    if (!profiles || profiles.length === 0) {
      // TASK 4: Return stable response shape even when no profile exists
      return NextResponse.json({ 
        success: true,
        profile: null,
        message: 'No profile found. Complete onboarding to create your profile.'
      })
    }
    
    // Get active program version info
    const activeVersion = await getActiveProgramVersion(userId)
    
    return NextResponse.json({
      success: true,
      profile: profiles[0],
      programVersion: activeVersion ? {
        versionNumber: activeVersion.versionNumber,
        createdAt: activeVersion.createdAt,
        generationReason: activeVersion.generationReason,
      } : null,
    })
    
  } catch (error) {
    console.error('[Settings API] Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT /api/settings - Update settings with intelligent regeneration
// =============================================================================

export async function PUT(request: Request) {
  try {
    const { userId } = await getSession()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const updates = await request.json()
    
    // TASK 7: Dev logging for settings save verification
    console.log('[Settings API] PUT received updates:', {
      scheduleMode: updates.scheduleMode,
      sessionDurationMode: updates.sessionDurationMode,
      trainingDaysPerWeek: updates.trainingDaysPerWeek,
      sessionLengthMinutes: updates.sessionLengthMinutes,
      primaryGoal: updates.primaryGoal,
      fieldCount: Object.keys(updates).length,
    })
    
    // [PHASE 16H] SCHEMA DRIFT FIX: Query only columns that exist in DB
    const currentProfiles = await query(`
      SELECT 
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
        goal_category as "goalCategory",
        COALESCE(selected_skills, '[]'::jsonb) as "selectedSkills",
        COALESCE(selected_flexibility, '[]'::jsonb) as "selectedFlexibility",
        COALESCE(selected_strength, '[]'::jsonb) as "selectedStrength",
        COALESCE(equipment_available, '[]'::jsonb) as "equipmentAvailable",
        COALESCE(joint_cautions, '[]'::jsonb) as "jointCautions",
        weakest_area as "weakestArea",
        training_style as "trainingStyle",
        onboarding_complete as "onboardingComplete"
      FROM athlete_profiles
      WHERE user_id = $1
      LIMIT 1
    `, [userId])
    
    if (!currentProfiles || currentProfiles.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found. Complete onboarding first.' },
        { status: 404 }
      )
    }
    
    const previousProfile = currentProfiles[0] as AthleteProfile
    
    // Apply updates to database
    const updateFields: string[] = []
    const updateValues: unknown[] = []
    let paramIndex = 1
    
  // [PHASE 16H] SCHEMA DRIFT FIX: Field mappings only for columns that exist in DB
  // Benchmark columns were removed - they don't exist in athlete_profiles table
  const fieldMappings: Record<string, string> = {
    bodyweight: 'bodyweight',
    experienceLevel: 'experience_level',
    trainingDaysPerWeek: 'training_days_per_week',
    scheduleMode: 'schedule_mode',
    sessionDurationMode: 'session_duration_mode',
    sessionLengthMinutes: 'session_length_minutes',
    primaryGoal: 'primary_goal',
    secondaryGoal: 'secondary_goal',
    goalCategory: 'goal_category',
    selectedSkills: 'selected_skills',
    selectedFlexibility: 'selected_flexibility',
    selectedStrength: 'selected_strength',
    equipmentAvailable: 'equipment_available',
    jointCautions: 'joint_cautions',
    weakestArea: 'weakest_area',
    trainingStyle: 'training_style',
  }
    
    for (const [key, dbColumn] of Object.entries(fieldMappings)) {
      if (updates[key] !== undefined) {
        updateFields.push(`${dbColumn} = $${paramIndex}`)
        // TASK 2: For flexible users, store NULL for trainingDaysPerWeek
        // to preserve flexible as a true preference, not fake 4-day
        let value = updates[key]
        if (key === 'trainingDaysPerWeek' && updates.scheduleMode === 'flexible') {
          value = null
        }
        updateValues.push(value)
        paramIndex++
      }
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes to apply.',
        analysis: null,
        regenerated: false,
      })
    }
    
    // Add updated_at
    updateFields.push(`updated_at = NOW()`)
    
    // Execute update
    await query(`
      UPDATE athlete_profiles
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
    `, [...updateValues, userId])
    
  // [PHASE 16H] SCHEMA DRIFT FIX: Fetch updated profile with only existing columns
  const updatedProfiles = await query(`
    SELECT
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
      goal_category as "goalCategory",
      COALESCE(selected_skills, '[]'::jsonb) as "selectedSkills",
      COALESCE(selected_flexibility, '[]'::jsonb) as "selectedFlexibility",
      COALESCE(selected_strength, '[]'::jsonb) as "selectedStrength",
      COALESCE(equipment_available, '[]'::jsonb) as "equipmentAvailable",
      COALESCE(joint_cautions, '[]'::jsonb) as "jointCautions",
      weakest_area as "weakestArea",
      training_style as "trainingStyle",
      onboarding_complete as "onboardingComplete"
    FROM athlete_profiles
    WHERE user_id = $1
    LIMIT 1
  `, [userId])
    
    const updatedProfile = updatedProfiles[0] as AthleteProfile & { trainingStyle?: string }
    
    // TASK 7: Dev logging for round-trip verification
    console.log('[Settings API] PUT updated profile (round-trip verification):', {
      scheduleMode: updatedProfile.scheduleMode,
      sessionDurationMode: (updatedProfile as unknown as { sessionDurationMode?: string }).sessionDurationMode,
      trainingDaysPerWeek: updatedProfile.trainingDaysPerWeek,
      sessionLengthMinutes: updatedProfile.sessionLengthMinutes,
      primaryGoal: updatedProfile.primaryGoal,
      secondaryGoal: (updatedProfile as unknown as { secondaryGoal?: string }).secondaryGoal,
    })
    
    // Analyze the changes
    const analysis = analyzeSettingsChanges(previousProfile, updatedProfile)
    
    // Validate that we're preserving required data
    const preservation = validateContinuityPreservation(analysis)
    if (!preservation.valid) {
      console.warn('[Settings API] Preservation warnings:', preservation.warnings)
    }
    
    let regenerated = false
    let versionMessage = ''
    let adaptations: ReturnType<typeof getSessionAdaptations> = []
    
    // Handle structural changes (new program version)
    if (analysis.requiresRegeneration && analysis.generationReason) {
      // Check for duplicate regeneration (prevents rapid double-saves)
      if (isDuplicateRegeneration(userId, analysis.generationReason, analysis.changes)) {
        versionMessage = 'Update already applied.'
      }
      // Check debounce
      else if (canRegenerate(userId)) {
        // Build unified context for regeneration
        const context = await buildUnifiedContext(userId)
        
        // Regenerate program
        const result = await regenerateProgramIfNeeded(
          userId,
          context,
          analysis.generationReason
        )
        
        regenerated = result.regenerated
        
        if (result.regenerated && result.version) {
          markRegeneration(userId)
          recordRegenerationEvent(userId, analysis.generationReason, analysis.changes)
          versionMessage = result.explanation
          
          // Also save to program history for version tracking
          // Generate the actual program to store as snapshot
          // TASK 1 FIX: Use getDefaultAdaptiveInputs() for unified canonical truth
          try {
            const programInputs = getDefaultAdaptiveInputs()
            console.log('[Settings API] TASK 1 FIX: Using canonical profile for regeneration:', {
              primaryGoal: programInputs.primaryGoal,
              secondaryGoal: programInputs.secondaryGoal || 'none',
              scheduleMode: programInputs.scheduleMode,
            })
            // [PRE-AB6 BUILD GREEN GATE / ASYNC PROGRAM GENERATION CONTRACT]
            // generateAdaptiveProgram is declared `export async function`
            // (lib/adaptive-program-builder.ts:5016) so its return type is
            // Promise<AdaptiveProgram>. createProgramVersionOnSettingsChange
            // expects a resolved AdaptiveProgram, so the Promise must be
            // awaited before being passed in. The call already lives inside
            // the async PUT handler's try/catch, so awaiting is safe and
            // does not change failure semantics.
            const program = await generateAdaptiveProgram(programInputs)
            
            // Save to program history (archives previous, creates new entry)
            const historyResult = await createProgramVersionOnSettingsChange(
              userId,
              program,
              analysis.generationReason
            )
            
            if (historyResult.success) {
              console.log('[Settings API] Program history saved:', historyResult.reasonSummary)
            }
          } catch (historyError) {
            console.error('[Settings API] Failed to save program history:', historyError)
            // Don't fail the whole operation - program version was still created
          }
        }
      } else {
        versionMessage = 'Program update skipped (recent regeneration in progress).'
      }
    }
    // Handle minor changes (session adaptations, no new version)
    else if (analysis.changes.some(c => c.affectsFutureSessions)) {
      adaptations = getSessionAdaptations(analysis)
      
      // Record adaptations in database
      const activeVersion = await getActiveProgramVersion(userId)
      if (activeVersion) {
        for (const adaptation of adaptations) {
          await recordSessionAdaptation(
            userId,
            activeVersion.id,
            adaptation.type,
            adaptation.description
          )
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      analysis: {
        overallCategory: analysis.overallCategory,
        requiresRegeneration: analysis.requiresRegeneration,
        changes: analysis.changes.map(c => ({
          field: c.field,
          category: c.category,
          impact: c.impact,
        })),
        affectedSystems: analysis.affectedSystems,
        coachingMessage: analysis.coachingMessage,
      },
      regenerated,
      versionMessage,
      adaptations: adaptations.map(a => ({
        type: a.type,
        description: a.description,
      })),
      preservedSystems: PRESERVED_SYSTEMS,
    })
    
  } catch (error) {
    console.error('[Settings API] Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
