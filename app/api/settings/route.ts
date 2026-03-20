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
import { generateAdaptiveProgram, type AdaptiveProgramInputs } from '@/lib/adaptive-program-builder'
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
    
    // CANONICAL FIX: Fetch FULL profile from database including ALL benchmark-relevant fields
    // This includes strength, skill, and flexibility benchmarks needed for proper hydration
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
        onboarding_complete as "onboardingComplete",
        -- STRENGTH BENCHMARKS (current)
        pull_up_max as "pullUpMax",
        dip_max as "dipMax",
        push_up_max as "pushUpMax",
        wall_hspu_reps as "wallHSPUReps",
        weighted_pull_up as "weightedPullUp",
        weighted_dip as "weightedDip",
        -- STRENGTH BENCHMARKS (all-time PR for rebound potential)
        all_time_pr_pull_up as "allTimePRPullUp",
        all_time_pr_dip as "allTimePRDip",
        -- SKILL BENCHMARKS (with band/history context)
        front_lever as "frontLever",
        planche as "planche",
        muscle_up as "muscleUp",
        hspu as "hspu",
        l_sit_hold as "lSitHold",
        v_sit_hold as "vSitHold",
        -- FLEXIBILITY BENCHMARKS (with range intent)
        pancake as "pancake",
        toe_touch as "toeTouch",
        front_splits as "frontSplits",
        side_splits as "sideSplits"
      FROM athlete_profiles
      WHERE user_id = $1
      LIMIT 1
    `, [userId])
    
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
    
    // CANONICAL FIX: Fetch FULL current profile for comparison including ALL benchmark fields
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
        onboarding_complete as "onboardingComplete",
        -- STRENGTH BENCHMARKS
        pull_up_max as "pullUpMax",
        dip_max as "dipMax",
        push_up_max as "pushUpMax",
        wall_hspu_reps as "wallHSPUReps",
        weighted_pull_up as "weightedPullUp",
        weighted_dip as "weightedDip",
        all_time_pr_pull_up as "allTimePRPullUp",
        all_time_pr_dip as "allTimePRDip",
        -- SKILL BENCHMARKS
        front_lever as "frontLever",
        planche as "planche",
        muscle_up as "muscleUp",
        hspu as "hspu",
        l_sit_hold as "lSitHold",
        v_sit_hold as "vSitHold",
        -- FLEXIBILITY BENCHMARKS
        pancake as "pancake",
        toe_touch as "toeTouch",
        front_splits as "frontSplits",
        side_splits as "sideSplits"
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
    
  // CANONICAL FIX: Expanded field mappings for full profile support including ALL benchmarks
  const fieldMappings: Record<string, string> = {
    bodyweight: 'bodyweight',
    experienceLevel: 'experience_level',
    trainingDaysPerWeek: 'training_days_per_week',
    scheduleMode: 'schedule_mode',  // FLEXIBLE SCHEDULING support
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
    // STRENGTH BENCHMARKS
    pullUpMax: 'pull_up_max',
    dipMax: 'dip_max',
    pushUpMax: 'push_up_max',
    wallHSPUReps: 'wall_hspu_reps',
    weightedPullUp: 'weighted_pull_up',
    weightedDip: 'weighted_dip',
    allTimePRPullUp: 'all_time_pr_pull_up',
    allTimePRDip: 'all_time_pr_dip',
    // SKILL BENCHMARKS
    frontLever: 'front_lever',
    planche: 'planche',
    muscleUp: 'muscle_up',
    hspu: 'hspu',
    lSitHold: 'l_sit_hold',
    vSitHold: 'v_sit_hold',
    // FLEXIBILITY BENCHMARKS
    pancake: 'pancake',
    toeTouch: 'toe_touch',
    frontSplits: 'front_splits',
    sideSplits: 'side_splits',
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
    
  // CANONICAL FIX: Fetch FULL updated profile including ALL benchmark fields
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
      onboarding_complete as "onboardingComplete",
      -- STRENGTH BENCHMARKS
      pull_up_max as "pullUpMax",
      dip_max as "dipMax",
      push_up_max as "pushUpMax",
      wall_hspu_reps as "wallHSPUReps",
      weighted_pull_up as "weightedPullUp",
      weighted_dip as "weightedDip",
      all_time_pr_pull_up as "allTimePRPullUp",
      all_time_pr_dip as "allTimePRDip",
      -- SKILL BENCHMARKS
      front_lever as "frontLever",
      planche as "planche",
      muscle_up as "muscleUp",
      hspu as "hspu",
      l_sit_hold as "lSitHold",
      v_sit_hold as "vSitHold",
      -- FLEXIBILITY BENCHMARKS
      pancake as "pancake",
      toe_touch as "toeTouch",
      front_splits as "frontSplits",
      side_splits as "sideSplits"
    FROM athlete_profiles
    WHERE user_id = $1
    LIMIT 1
  `, [userId])
    
    const updatedProfile = updatedProfiles[0] as AthleteProfile & { trainingStyle?: string }
    
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
          try {
            const programInputs: AdaptiveProgramInputs = {
              primaryGoal: (context.athlete.primaryGoal || 'front_lever') as AdaptiveProgramInputs['primaryGoal'],
              experienceLevel: 'intermediate',
              trainingDaysPerWeek: (context.athlete.trainingDaysPerWeek || 4) as AdaptiveProgramInputs['trainingDaysPerWeek'],
              sessionLength: (context.athlete.sessionDurationMinutes || 60) as AdaptiveProgramInputs['sessionLength'],
              equipment: context.athlete.equipment as AdaptiveProgramInputs['equipment'],
            }
            const program = generateAdaptiveProgram(programInputs)
            
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
