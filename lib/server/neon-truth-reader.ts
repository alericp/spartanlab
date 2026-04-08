/**
 * ==========================================================================
 * NEON TRUTH READER - Server-Side DB Truth Fetching
 * ==========================================================================
 * 
 * This is the AUTHORITATIVE reader for stored truth from Neon.
 * It fetches real persisted data that can inform generation decisions.
 * 
 * TABLES QUERIED:
 * - athlete_profiles: Profile truth (goals, schedule, experience, equipment, etc.)
 * - training_response_signals: Execution/adherence truth (completed, skipped, RPE, etc.)
 * - workout_logs: Session history (dates, duration, focus areas)
 * - skill_readiness: Skill readiness assessments
 * - performance_envelopes: Volume/intensity preferences learned from training
 * - constraint_history: Joint/movement constraints detected
 * - programs: Current/previous program context
 * 
 * RULE: This reader is READ-ONLY. It does not mutate data.
 * RULE: Missing data is labeled as 'unavailable', never fabricated.
 * ==========================================================================
 */

import { query, queryOne, isDatabaseAvailable } from '@/lib/db'

// =============================================================================
// TYPES: Source Labels
// =============================================================================

export type NeonTruthSource = 
  | 'authoritative_db'    // Read directly from Neon
  | 'unavailable'         // DB not available or no data found
  | 'db_error'           // Query failed

export type NeonSignalQuality = 'strong' | 'usable' | 'partial' | 'weak' | 'unavailable'

// =============================================================================
// TYPES: Profile Truth from DB
// =============================================================================

export interface NeonProfileTruth {
  source: NeonTruthSource
  quality: NeonSignalQuality
  data: {
    primaryGoal: string | null
    secondaryGoal: string | null
    selectedSkills: string[]
    selectedStrength: string[]
    selectedFlexibility: string[]
    scheduleMode: string | null
    trainingDaysPerWeek: number | null
    sessionLengthMinutes: number | null
    sessionDurationMode: string | null
    experienceLevel: string | null
    trainingStyle: string | null
    equipment: string[]
    jointCautions: string[]
    bodyweight: number | null
    sex: string | null
    weakestArea: string | null
    onboardingComplete: boolean
  } | null
  evidence: string[]
  queriedAt: string
}

// =============================================================================
// TYPES: Adherence/Execution Truth from DB
// =============================================================================

export interface NeonAdherenceExecutionTruth {
  source: NeonTruthSource
  quality: NeonSignalQuality
  data: {
    // Last 7 days
    completedSessionsLast7Days: number
    skippedSessionsLast7Days: number
    partialSessionsLast7Days: number
    totalSessionsLast7Days: number
    
    // Last 14 days
    completedSessionsLast14Days: number
    skippedSessionsLast14Days: number
    totalSessionsLast14Days: number
    
    // RPE stats
    averageRPELast7Days: number | null
    maxRPELast7Days: number | null
    
    // Completion metrics
    completionRateLast7Days: number | null
    completionRateLast14Days: number | null
    
    // Fatigue indicators
    sessionsWithHighFatigue: number
    sessionsWithLowFatigue: number
    
    // Most recent session
    lastSessionDate: string | null
    daysSinceLastSession: number | null
  } | null
  evidence: string[]
  queriedAt: string
}

// =============================================================================
// TYPES: Workout History Summary
// =============================================================================

export interface NeonWorkoutHistoryTruth {
  source: NeonTruthSource
  quality: NeonSignalQuality
  data: {
    totalWorkoutsLogged: number
    recentWorkoutsLast7Days: number
    recentWorkoutsLast30Days: number
    averageDurationMinutes: number | null
    mostFrequentFocusArea: string | null
    lastWorkoutDate: string | null
    daysSinceLastWorkout: number | null
  } | null
  evidence: string[]
  queriedAt: string
}

// =============================================================================
// TYPES: Skill Readiness Truth
// =============================================================================

export interface NeonSkillReadinessTruth {
  source: NeonTruthSource
  quality: NeonSignalQuality
  data: {
    skills: Array<{
      skill: string
      readinessScore: number
      limitingFactor: string | null
      lastUpdated: string
    }>
    averageReadiness: number | null
    lowestReadinessSkill: string | null
    highestReadinessSkill: string | null
  } | null
  evidence: string[]
  queriedAt: string
}

// =============================================================================
// TYPES: Performance Envelope Truth
// =============================================================================

export interface NeonPerformanceEnvelopeTruth {
  source: NeonTruthSource
  quality: NeonSignalQuality
  data: {
    envelopes: Array<{
      movementFamily: string
      goalType: string
      preferredVolumeMin: number | null
      preferredVolumeMax: number | null
      preferredRepRangeMin: number | null
      preferredRepRangeMax: number | null
      performanceTrend: string | null
      confidenceScore: number
    }>
    hasUsableEnvelopes: boolean
    totalEnvelopes: number
  } | null
  evidence: string[]
  queriedAt: string
}

// =============================================================================
// TYPES: Program Context Truth
// =============================================================================

export interface NeonProgramContextTruth {
  source: NeonTruthSource
  quality: NeonSignalQuality
  data: {
    hasActiveProgram: boolean
    activeProgramId: string | null
    activeProgramCreatedAt: string | null
    activeProgramPrimaryGoal: string | null
    activeProgramTrainingDays: number | null
    totalProgramsCreated: number
    lastProgramCreatedAt: string | null
  } | null
  evidence: string[]
  queriedAt: string
}

// =============================================================================
// TYPES: Constraint History Truth
// =============================================================================

export interface NeonConstraintHistoryTruth {
  source: NeonTruthSource
  quality: NeonSignalQuality
  data: {
    hasConstraints: boolean
    activeConstraints: Array<{
      primaryConstraint: string
      primarySeverity: string | null
      secondaryConstraint: string | null
      skillContext: string | null
      detectedAt: string
    }>
    totalConstraintsRecorded: number
  } | null
  evidence: string[]
  queriedAt: string
}

// =============================================================================
// TYPES: Full Neon Truth Package
// =============================================================================

export interface NeonTruthPackage {
  userId: string
  fetchedAt: string
  dbAvailable: boolean
  
  profile: NeonProfileTruth
  adherenceExecution: NeonAdherenceExecutionTruth
  workoutHistory: NeonWorkoutHistoryTruth
  skillReadiness: NeonSkillReadinessTruth
  performanceEnvelopes: NeonPerformanceEnvelopeTruth
  programContext: NeonProgramContextTruth
  constraintHistory: NeonConstraintHistoryTruth
  
  // Overall summary
  overallQuality: NeonSignalQuality
  availableDomains: string[]
  unavailableDomains: string[]
  evidence: string[]
}

// =============================================================================
// HELPER: Compute Quality
// =============================================================================

function computeQuality(available: number, total: number): NeonSignalQuality {
  if (total === 0) return 'unavailable'
  const ratio = available / total
  if (ratio >= 0.8) return 'strong'
  if (ratio >= 0.6) return 'usable'
  if (ratio >= 0.3) return 'partial'
  if (ratio > 0) return 'weak'
  return 'unavailable'
}

// =============================================================================
// READER: Profile Truth
// =============================================================================

async function readProfileTruth(userId: string): Promise<NeonProfileTruth> {
  const queriedAt = new Date().toISOString()
  const evidence: string[] = []
  
  try {
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      evidence.push('Database not available')
      return { source: 'unavailable', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    const profile = await queryOne<{
      primary_goal: string | null
      secondary_goal: string | null
      selected_skills: string[] | null
      selected_strength: string[] | null
      selected_flexibility: string[] | null
      schedule_mode: string | null
      training_days_per_week: number | null
      session_length_minutes: number | null
      session_duration_mode: string | null
      experience_level: string | null
      training_style: string | null
      equipment_available: string[] | null
      joint_cautions: string[] | null
      bodyweight: number | null
      sex: string | null
      weakest_area: string | null
      onboarding_complete: boolean | null
    }>(
      `SELECT 
        primary_goal, secondary_goal, selected_skills, selected_strength,
        selected_flexibility, schedule_mode, training_days_per_week,
        session_length_minutes, session_duration_mode, experience_level,
        training_style, equipment_available, joint_cautions, bodyweight,
        sex, weakest_area, onboarding_complete
      FROM athlete_profiles 
      WHERE user_id = $1`,
      [userId]
    )
    
    if (!profile) {
      evidence.push('No athlete profile found in database')
      return { source: 'unavailable', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    evidence.push('Profile loaded from athlete_profiles table')
    
    // Count available fields
    let availableFields = 0
    const totalFields = 12
    
    if (profile.primary_goal) availableFields++
    if (profile.selected_skills?.length) availableFields++
    if (profile.schedule_mode) availableFields++
    if (profile.training_days_per_week) availableFields++
    if (profile.experience_level) availableFields++
    if (profile.equipment_available?.length) availableFields++
    if (profile.session_length_minutes) availableFields++
    if (profile.training_style) availableFields++
    if (profile.joint_cautions?.length || profile.joint_cautions === null) availableFields++ // null is valid (no cautions)
    if (profile.selected_strength?.length) availableFields++
    if (profile.bodyweight) availableFields++
    if (profile.onboarding_complete) availableFields++
    
    evidence.push(`${availableFields}/${totalFields} profile fields populated`)
    
    return {
      source: 'authoritative_db',
      quality: computeQuality(availableFields, totalFields),
      data: {
        primaryGoal: profile.primary_goal,
        secondaryGoal: profile.secondary_goal,
        selectedSkills: profile.selected_skills || [],
        selectedStrength: profile.selected_strength || [],
        selectedFlexibility: profile.selected_flexibility || [],
        scheduleMode: profile.schedule_mode,
        trainingDaysPerWeek: profile.training_days_per_week,
        sessionLengthMinutes: profile.session_length_minutes,
        sessionDurationMode: profile.session_duration_mode,
        experienceLevel: profile.experience_level,
        trainingStyle: profile.training_style,
        equipment: profile.equipment_available || [],
        jointCautions: profile.joint_cautions || [],
        bodyweight: profile.bodyweight,
        sex: profile.sex,
        weakestArea: profile.weakest_area,
        onboardingComplete: profile.onboarding_complete ?? false,
      },
      evidence,
      queriedAt,
    }
  } catch (error) {
    evidence.push(`DB error: ${error instanceof Error ? error.message : String(error)}`)
    return { source: 'db_error', quality: 'unavailable', data: null, evidence, queriedAt }
  }
}

// =============================================================================
// READER: Adherence/Execution Truth
// =============================================================================

async function readAdherenceExecutionTruth(userId: string): Promise<NeonAdherenceExecutionTruth> {
  const queriedAt = new Date().toISOString()
  const evidence: string[] = []
  
  try {
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      evidence.push('Database not available')
      return { source: 'unavailable', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    // Query training_response_signals for last 14 days
    const signals = await query<{
      session_date: string
      was_completed: boolean
      was_skipped: boolean
      session_truncated: boolean
      pre_session_fatigue: number | null
      post_session_fatigue: number | null
      perceived_difficulty: string | null
    }>(
      `SELECT 
        session_date, was_completed, was_skipped, session_truncated,
        pre_session_fatigue, post_session_fatigue, perceived_difficulty
      FROM training_response_signals
      WHERE user_id = $1 
        AND session_date >= CURRENT_DATE - INTERVAL '14 days'
      ORDER BY session_date DESC`,
      [userId]
    )
    
    if (signals.length === 0) {
      evidence.push('No training response signals found in last 14 days')
      return { 
        source: 'authoritative_db', 
        quality: 'unavailable', 
        data: {
          completedSessionsLast7Days: 0,
          skippedSessionsLast7Days: 0,
          partialSessionsLast7Days: 0,
          totalSessionsLast7Days: 0,
          completedSessionsLast14Days: 0,
          skippedSessionsLast14Days: 0,
          totalSessionsLast14Days: 0,
          averageRPELast7Days: null,
          maxRPELast7Days: null,
          completionRateLast7Days: null,
          completionRateLast14Days: null,
          sessionsWithHighFatigue: 0,
          sessionsWithLowFatigue: 0,
          lastSessionDate: null,
          daysSinceLastSession: null,
        }, 
        evidence, 
        queriedAt 
      }
    }
    
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    let completedLast7 = 0, skippedLast7 = 0, partialLast7 = 0
    let completedLast14 = 0, skippedLast14 = 0
    let highFatigue = 0, lowFatigue = 0
    const rpesLast7: number[] = []
    
    for (const s of signals) {
      const sessionDate = new Date(s.session_date)
      const isLast7Days = sessionDate >= sevenDaysAgo
      
      if (s.was_completed) {
        completedLast14++
        if (isLast7Days) completedLast7++
      }
      if (s.was_skipped) {
        skippedLast14++
        if (isLast7Days) skippedLast7++
      }
      if (s.session_truncated && !s.was_skipped) {
        if (isLast7Days) partialLast7++
      }
      
      // Map perceived difficulty to RPE-like score
      if (isLast7Days && s.perceived_difficulty) {
        const rpeMap: Record<string, number> = {
          'very_easy': 4, 'easy': 5, 'moderate': 6, 'challenging': 7, 'hard': 8, 'very_hard': 9, 'maximum': 10
        }
        if (rpeMap[s.perceived_difficulty]) {
          rpesLast7.push(rpeMap[s.perceived_difficulty])
        }
      }
      
      // Fatigue tracking
      if (s.post_session_fatigue !== null) {
        if (s.post_session_fatigue >= 7) highFatigue++
        if (s.post_session_fatigue <= 3) lowFatigue++
      }
    }
    
    const totalLast7 = completedLast7 + skippedLast7 + partialLast7
    const totalLast14 = completedLast14 + skippedLast14
    
    const avgRPE = rpesLast7.length > 0 ? rpesLast7.reduce((a, b) => a + b, 0) / rpesLast7.length : null
    const maxRPE = rpesLast7.length > 0 ? Math.max(...rpesLast7) : null
    
    const completionRate7 = totalLast7 > 0 ? completedLast7 / totalLast7 : null
    const completionRate14 = totalLast14 > 0 ? completedLast14 / totalLast14 : null
    
    // Last session info
    const lastSession = signals[0]
    const lastSessionDate = lastSession?.session_date || null
    const daysSinceLast = lastSessionDate 
      ? Math.floor((now.getTime() - new Date(lastSessionDate).getTime()) / (24 * 60 * 60 * 1000))
      : null
    
    evidence.push(`Found ${signals.length} training response signals`)
    evidence.push(`Last 7 days: ${completedLast7} completed, ${skippedLast7} skipped, ${partialLast7} partial`)
    
    const availableSignals = [
      signals.length > 0,
      avgRPE !== null,
      completionRate7 !== null,
      lastSessionDate !== null,
    ].filter(Boolean).length
    
    return {
      source: 'authoritative_db',
      quality: computeQuality(availableSignals, 4),
      data: {
        completedSessionsLast7Days: completedLast7,
        skippedSessionsLast7Days: skippedLast7,
        partialSessionsLast7Days: partialLast7,
        totalSessionsLast7Days: totalLast7,
        completedSessionsLast14Days: completedLast14,
        skippedSessionsLast14Days: skippedLast14,
        totalSessionsLast14Days: totalLast14,
        averageRPELast7Days: avgRPE,
        maxRPELast7Days: maxRPE,
        completionRateLast7Days: completionRate7,
        completionRateLast14Days: completionRate14,
        sessionsWithHighFatigue: highFatigue,
        sessionsWithLowFatigue: lowFatigue,
        lastSessionDate,
        daysSinceLastSession: daysSinceLast,
      },
      evidence,
      queriedAt,
    }
  } catch (error) {
    evidence.push(`DB error: ${error instanceof Error ? error.message : String(error)}`)
    return { source: 'db_error', quality: 'unavailable', data: null, evidence, queriedAt }
  }
}

// =============================================================================
// READER: Workout History
// =============================================================================

async function readWorkoutHistoryTruth(userId: string): Promise<NeonWorkoutHistoryTruth> {
  const queriedAt = new Date().toISOString()
  const evidence: string[] = []
  
  try {
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      evidence.push('Database not available')
      return { source: 'unavailable', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    const stats = await queryOne<{
      total_workouts: string
      recent_7_days: string
      recent_30_days: string
      avg_duration: number | null
      last_workout: string | null
    }>(
      `SELECT 
        COUNT(*) as total_workouts,
        COUNT(*) FILTER (WHERE session_date >= CURRENT_DATE - INTERVAL '7 days') as recent_7_days,
        COUNT(*) FILTER (WHERE session_date >= CURRENT_DATE - INTERVAL '30 days') as recent_30_days,
        AVG(duration_minutes) as avg_duration,
        MAX(session_date) as last_workout
      FROM workout_logs
      WHERE user_id = $1`,
      [userId]
    )
    
    const totalWorkouts = parseInt(stats?.total_workouts || '0', 10)
    
    if (totalWorkouts === 0) {
      evidence.push('No workout logs found')
      return { source: 'authoritative_db', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    // Get most frequent focus area
    const focusResult = await queryOne<{ focus_area: string }>(
      `SELECT focus_area, COUNT(*) as cnt
       FROM workout_logs
       WHERE user_id = $1 AND focus_area IS NOT NULL
       GROUP BY focus_area
       ORDER BY cnt DESC
       LIMIT 1`,
      [userId]
    )
    
    const now = new Date()
    const lastWorkoutDate = stats?.last_workout || null
    const daysSince = lastWorkoutDate
      ? Math.floor((now.getTime() - new Date(lastWorkoutDate).getTime()) / (24 * 60 * 60 * 1000))
      : null
    
    evidence.push(`Found ${totalWorkouts} total workout logs`)
    evidence.push(`${stats?.recent_7_days || 0} workouts in last 7 days`)
    
    return {
      source: 'authoritative_db',
      quality: totalWorkouts >= 5 ? 'strong' : totalWorkouts >= 2 ? 'usable' : 'weak',
      data: {
        totalWorkoutsLogged: totalWorkouts,
        recentWorkoutsLast7Days: parseInt(stats?.recent_7_days || '0', 10),
        recentWorkoutsLast30Days: parseInt(stats?.recent_30_days || '0', 10),
        averageDurationMinutes: stats?.avg_duration || null,
        mostFrequentFocusArea: focusResult?.focus_area || null,
        lastWorkoutDate,
        daysSinceLastWorkout: daysSince,
      },
      evidence,
      queriedAt,
    }
  } catch (error) {
    evidence.push(`DB error: ${error instanceof Error ? error.message : String(error)}`)
    return { source: 'db_error', quality: 'unavailable', data: null, evidence, queriedAt }
  }
}

// =============================================================================
// READER: Skill Readiness
// =============================================================================

async function readSkillReadinessTruth(userId: string): Promise<NeonSkillReadinessTruth> {
  const queriedAt = new Date().toISOString()
  const evidence: string[] = []
  
  try {
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      evidence.push('Database not available')
      return { source: 'unavailable', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    const readiness = await query<{
      skill: string
      readiness_score: number
      limiting_factor: string | null
      last_updated: string
    }>(
      `SELECT skill, readiness_score, limiting_factor, last_updated
       FROM skill_readiness
       WHERE user_id = $1
       ORDER BY readiness_score DESC`,
      [userId]
    )
    
    if (readiness.length === 0) {
      evidence.push('No skill readiness records found')
      return { source: 'authoritative_db', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    const skills = readiness.map(r => ({
      skill: r.skill,
      readinessScore: r.readiness_score,
      limitingFactor: r.limiting_factor,
      lastUpdated: r.last_updated,
    }))
    
    const avgReadiness = skills.reduce((acc, s) => acc + s.readinessScore, 0) / skills.length
    const lowestSkill = skills[skills.length - 1]?.skill || null
    const highestSkill = skills[0]?.skill || null
    
    evidence.push(`Found readiness data for ${skills.length} skills`)
    evidence.push(`Average readiness: ${avgReadiness.toFixed(0)}`)
    
    return {
      source: 'authoritative_db',
      quality: skills.length >= 3 ? 'strong' : skills.length >= 1 ? 'usable' : 'weak',
      data: {
        skills,
        averageReadiness: avgReadiness,
        lowestReadinessSkill: lowestSkill,
        highestReadinessSkill: highestSkill,
      },
      evidence,
      queriedAt,
    }
  } catch (error) {
    evidence.push(`DB error: ${error instanceof Error ? error.message : String(error)}`)
    return { source: 'db_error', quality: 'unavailable', data: null, evidence, queriedAt }
  }
}

// =============================================================================
// READER: Performance Envelopes
// =============================================================================

async function readPerformanceEnvelopeTruth(userId: string): Promise<NeonPerformanceEnvelopeTruth> {
  const queriedAt = new Date().toISOString()
  const evidence: string[] = []
  
  try {
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      evidence.push('Database not available')
      return { source: 'unavailable', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    const envelopes = await query<{
      movement_family: string
      goal_type: string
      preferred_weekly_volume_min: number | null
      preferred_weekly_volume_max: number | null
      preferred_rep_range_min: number | null
      preferred_rep_range_max: number | null
      performance_trend: string | null
      confidence_score: number
    }>(
      `SELECT 
        movement_family, goal_type, preferred_weekly_volume_min, preferred_weekly_volume_max,
        preferred_rep_range_min, preferred_rep_range_max, performance_trend, confidence_score
       FROM performance_envelopes
       WHERE user_id = $1 AND confidence_score >= 30
       ORDER BY confidence_score DESC`,
      [userId]
    )
    
    if (envelopes.length === 0) {
      evidence.push('No usable performance envelopes found (confidence >= 30)')
      return { source: 'authoritative_db', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    const mapped = envelopes.map(e => ({
      movementFamily: e.movement_family,
      goalType: e.goal_type,
      preferredVolumeMin: e.preferred_weekly_volume_min,
      preferredVolumeMax: e.preferred_weekly_volume_max,
      preferredRepRangeMin: e.preferred_rep_range_min,
      preferredRepRangeMax: e.preferred_rep_range_max,
      performanceTrend: e.performance_trend,
      confidenceScore: e.confidence_score,
    }))
    
    evidence.push(`Found ${mapped.length} usable performance envelopes`)
    
    return {
      source: 'authoritative_db',
      quality: mapped.length >= 3 ? 'strong' : mapped.length >= 1 ? 'usable' : 'weak',
      data: {
        envelopes: mapped,
        hasUsableEnvelopes: mapped.length > 0,
        totalEnvelopes: mapped.length,
      },
      evidence,
      queriedAt,
    }
  } catch (error) {
    evidence.push(`DB error: ${error instanceof Error ? error.message : String(error)}`)
    return { source: 'db_error', quality: 'unavailable', data: null, evidence, queriedAt }
  }
}

// =============================================================================
// READER: Program Context
// =============================================================================

async function readProgramContextTruth(userId: string): Promise<NeonProgramContextTruth> {
  const queriedAt = new Date().toISOString()
  const evidence: string[] = []
  
  try {
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      evidence.push('Database not available')
      return { source: 'unavailable', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    const programs = await query<{
      id: string
      created_at: string
      primary_goal: string | null
      training_days_per_week: number | null
    }>(
      `SELECT id, created_at, primary_goal, training_days_per_week
       FROM programs
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )
    
    if (programs.length === 0) {
      evidence.push('No programs found for user')
      return { 
        source: 'authoritative_db', 
        quality: 'unavailable', 
        data: {
          hasActiveProgram: false,
          activeProgramId: null,
          activeProgramCreatedAt: null,
          activeProgramPrimaryGoal: null,
          activeProgramTrainingDays: null,
          totalProgramsCreated: 0,
          lastProgramCreatedAt: null,
        }, 
        evidence, 
        queriedAt 
      }
    }
    
    const latest = programs[0]
    evidence.push(`Found ${programs.length} program(s)`)
    evidence.push(`Latest program created: ${latest.created_at}`)
    
    return {
      source: 'authoritative_db',
      quality: programs.length > 0 ? 'strong' : 'unavailable',
      data: {
        hasActiveProgram: programs.length > 0,
        activeProgramId: latest.id,
        activeProgramCreatedAt: latest.created_at,
        activeProgramPrimaryGoal: latest.primary_goal,
        activeProgramTrainingDays: latest.training_days_per_week,
        totalProgramsCreated: programs.length,
        lastProgramCreatedAt: latest.created_at,
      },
      evidence,
      queriedAt,
    }
  } catch (error) {
    evidence.push(`DB error: ${error instanceof Error ? error.message : String(error)}`)
    return { source: 'db_error', quality: 'unavailable', data: null, evidence, queriedAt }
  }
}

// =============================================================================
// READER: Constraint History
// =============================================================================

async function readConstraintHistoryTruth(userId: string): Promise<NeonConstraintHistoryTruth> {
  const queriedAt = new Date().toISOString()
  const evidence: string[] = []
  
  try {
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      evidence.push('Database not available')
      return { source: 'unavailable', quality: 'unavailable', data: null, evidence, queriedAt }
    }
    
    const constraints = await query<{
      primary_constraint: string
      primary_severity_level: string | null
      secondary_constraint: string | null
      skill_context: string | null
      detected_at: string
    }>(
      `SELECT primary_constraint, primary_severity_level, secondary_constraint, skill_context, detected_at
       FROM constraint_history
       WHERE user_id = $1
       ORDER BY detected_at DESC
       LIMIT 10`,
      [userId]
    )
    
    if (constraints.length === 0) {
      evidence.push('No constraint history found')
      return { 
        source: 'authoritative_db', 
        quality: 'unavailable', 
        data: {
          hasConstraints: false,
          activeConstraints: [],
          totalConstraintsRecorded: 0,
        }, 
        evidence, 
        queriedAt 
      }
    }
    
    evidence.push(`Found ${constraints.length} constraint record(s)`)
    
    return {
      source: 'authoritative_db',
      quality: 'usable',
      data: {
        hasConstraints: true,
        activeConstraints: constraints.map(c => ({
          primaryConstraint: c.primary_constraint,
          primarySeverity: c.primary_severity_level,
          secondaryConstraint: c.secondary_constraint,
          skillContext: c.skill_context,
          detectedAt: c.detected_at,
        })),
        totalConstraintsRecorded: constraints.length,
      },
      evidence,
      queriedAt,
    }
  } catch (error) {
    evidence.push(`DB error: ${error instanceof Error ? error.message : String(error)}`)
    return { source: 'db_error', quality: 'unavailable', data: null, evidence, queriedAt }
  }
}

// =============================================================================
// MAIN: Fetch Full Neon Truth Package
// =============================================================================

/**
 * Fetch all available truth from Neon for a user.
 * This is the SINGLE authoritative entry point for DB truth reads.
 */
export async function fetchNeonTruthPackage(userId: string): Promise<NeonTruthPackage> {
  const fetchedAt = new Date().toISOString()
  const evidence: string[] = []
  
  const dbAvailable = await isDatabaseAvailable()
  if (!dbAvailable) {
    evidence.push('Database not available - all domains unavailable')
    return {
      userId,
      fetchedAt,
      dbAvailable: false,
      profile: { source: 'unavailable', quality: 'unavailable', data: null, evidence: ['DB unavailable'], queriedAt: fetchedAt },
      adherenceExecution: { source: 'unavailable', quality: 'unavailable', data: null, evidence: ['DB unavailable'], queriedAt: fetchedAt },
      workoutHistory: { source: 'unavailable', quality: 'unavailable', data: null, evidence: ['DB unavailable'], queriedAt: fetchedAt },
      skillReadiness: { source: 'unavailable', quality: 'unavailable', data: null, evidence: ['DB unavailable'], queriedAt: fetchedAt },
      performanceEnvelopes: { source: 'unavailable', quality: 'unavailable', data: null, evidence: ['DB unavailable'], queriedAt: fetchedAt },
      programContext: { source: 'unavailable', quality: 'unavailable', data: null, evidence: ['DB unavailable'], queriedAt: fetchedAt },
      constraintHistory: { source: 'unavailable', quality: 'unavailable', data: null, evidence: ['DB unavailable'], queriedAt: fetchedAt },
      overallQuality: 'unavailable',
      availableDomains: [],
      unavailableDomains: ['profile', 'adherenceExecution', 'workoutHistory', 'skillReadiness', 'performanceEnvelopes', 'programContext', 'constraintHistory'],
      evidence,
    }
  }
  
  evidence.push('Database available - fetching truth from Neon')
  
  // Fetch all domains in parallel
  const [
    profile,
    adherenceExecution,
    workoutHistory,
    skillReadiness,
    performanceEnvelopes,
    programContext,
    constraintHistory,
  ] = await Promise.all([
    readProfileTruth(userId),
    readAdherenceExecutionTruth(userId),
    readWorkoutHistoryTruth(userId),
    readSkillReadinessTruth(userId),
    readPerformanceEnvelopeTruth(userId),
    readProgramContextTruth(userId),
    readConstraintHistoryTruth(userId),
  ])
  
  // Compute available/unavailable domains
  const domains = [
    { name: 'profile', quality: profile.quality },
    { name: 'adherenceExecution', quality: adherenceExecution.quality },
    { name: 'workoutHistory', quality: workoutHistory.quality },
    { name: 'skillReadiness', quality: skillReadiness.quality },
    { name: 'performanceEnvelopes', quality: performanceEnvelopes.quality },
    { name: 'programContext', quality: programContext.quality },
    { name: 'constraintHistory', quality: constraintHistory.quality },
  ]
  
  const availableDomains = domains.filter(d => d.quality !== 'unavailable').map(d => d.name)
  const unavailableDomains = domains.filter(d => d.quality === 'unavailable').map(d => d.name)
  
  evidence.push(`Available domains: ${availableDomains.join(', ') || 'none'}`)
  if (unavailableDomains.length > 0) {
    evidence.push(`Unavailable domains: ${unavailableDomains.join(', ')}`)
  }
  
  // Compute overall quality
  const qualityScores: Record<NeonSignalQuality, number> = {
    strong: 4, usable: 3, partial: 2, weak: 1, unavailable: 0
  }
  const avgScore = domains.reduce((acc, d) => acc + qualityScores[d.quality], 0) / domains.length
  
  let overallQuality: NeonSignalQuality = 'unavailable'
  if (avgScore >= 3) overallQuality = 'strong'
  else if (avgScore >= 2) overallQuality = 'usable'
  else if (avgScore >= 1) overallQuality = 'partial'
  else if (avgScore > 0) overallQuality = 'weak'
  
  return {
    userId,
    fetchedAt,
    dbAvailable: true,
    profile,
    adherenceExecution,
    workoutHistory,
    skillReadiness,
    performanceEnvelopes,
    programContext,
    constraintHistory,
    overallQuality,
    availableDomains,
    unavailableDomains,
    evidence,
  }
}

// =============================================================================
// HELPER: Get Compact Source Summary for Display
// =============================================================================

export function getNeonTruthSummary(pkg: NeonTruthPackage): {
  label: string
  quality: NeonSignalQuality
  breakdown: string
  availableCount: number
  totalCount: number
} {
  const totalCount = 7
  const availableCount = pkg.availableDomains.length
  
  const qualityLabels: Record<NeonSignalQuality, string> = {
    strong: 'Comprehensive',
    usable: 'Good',
    partial: 'Partial',
    weak: 'Limited',
    unavailable: 'Unavailable',
  }
  
  return {
    label: qualityLabels[pkg.overallQuality],
    quality: pkg.overallQuality,
    breakdown: `${availableCount}/${totalCount} data sources`,
    availableCount,
    totalCount,
  }
}
