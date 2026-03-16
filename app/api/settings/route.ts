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
  type SettingsChangeAnalysis,
} from '@/lib/settings-regeneration-service'
import {
  regenerateProgramIfNeeded,
  getActiveProgramVersion,
  recordSessionAdaptation,
  getVersionChangeMessage,
  type GenerationReason,
} from '@/lib/program-version-service'
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
    
    // Fetch profile from database
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
        session_length_minutes as "sessionLengthMinutes",
        primary_goal as "primaryGoal",
        equipment_available as "equipmentAvailable",
        joint_cautions as "jointCautions",
        weakest_area as "weakestArea",
        training_style as "trainingStyle",
        onboarding_complete as "onboardingComplete"
      FROM athlete_profiles
      WHERE user_id = $1
      LIMIT 1
    `, [userId])
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ 
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
    
    // Fetch current profile for comparison
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
        session_length_minutes as "sessionLengthMinutes",
        primary_goal as "primaryGoal",
        equipment_available as "equipmentAvailable",
        joint_cautions as "jointCautions",
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
    
    const fieldMappings: Record<string, string> = {
      bodyweight: 'bodyweight',
      experienceLevel: 'experience_level',
      trainingDaysPerWeek: 'training_days_per_week',
      sessionLengthMinutes: 'session_length_minutes',
      primaryGoal: 'primary_goal',
      equipmentAvailable: 'equipment_available',
      jointCautions: 'joint_cautions',
      weakestArea: 'weakest_area',
      trainingStyle: 'training_style',
    }
    
    for (const [key, dbColumn] of Object.entries(fieldMappings)) {
      if (updates[key] !== undefined) {
        updateFields.push(`${dbColumn} = $${paramIndex}`)
        updateValues.push(updates[key])
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
    
    // Fetch updated profile
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
        session_length_minutes as "sessionLengthMinutes",
        primary_goal as "primaryGoal",
        equipment_available as "equipmentAvailable",
        joint_cautions as "jointCautions",
        weakest_area as "weakestArea",
        training_style as "trainingStyle",
        onboarding_complete as "onboardingComplete"
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
      // Check debounce
      if (canRegenerate(userId)) {
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
          
          // Get version change message
          const activeVersion = await getActiveProgramVersion(userId)
          versionMessage = result.explanation
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
