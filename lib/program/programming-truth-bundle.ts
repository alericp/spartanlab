/**
 * PROGRAMMING TRUTH BUNDLE BUILDER
 * 
 * =============================================================================
 * BUILDS THE AUTHORITATIVE PRE-GENERATION INTELLIGENCE BUNDLE
 * =============================================================================
 * 
 * This module builds one read-only ProgrammingTruthBundle by:
 * 1. Starting from canonical profile (required identity/settings truth)
 * 2. Pulling Neon-backed truth from existing stable services
 * 3. Normalizing each section with explicit source/confidence metadata
 * 4. Building derived signals conservatively from available truth
 * 
 * SAFE FALLBACK BEHAVIOR:
 * - If DATABASE_URL unavailable, bundle still builds from canonical profile
 * - Each section has explicit TruthMeta marking availability
 * - No silent fakes - missing DB truth is labeled as unavailable
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { getCanonicalProfile, type CanonicalProgrammingProfile } from '../canonical-profile-service'
import type {
  ProgrammingTruthBundle,
  TruthSourceLabel,
  TruthConfidence,
  TruthMeta,
  BenchmarkStrengthData,
  BenchmarkSkillData,
  SkillProgressionData,
  PerformanceEnvelopeData,
} from './programming-truth-bundle-contract'

// =============================================================================
// LAZY DATABASE CONNECTION
// =============================================================================

let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> | null {
  if (_sql) return _sql
  
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.log('[ProgrammingTruthBundle] DATABASE_URL not available - DB sections disabled')
    return null
  }
  
  _sql = neon(connectionString)
  return _sql
}

// =============================================================================
// HELPER: Create unavailable TruthMeta
// =============================================================================

function unavailableMeta(note?: string): TruthMeta {
  return {
    source: 'unavailable',
    confidence: 'none',
    available: false,
    note: note || 'Database unavailable or no data found',
  }
}

// =============================================================================
// SECTION BUILDERS
// =============================================================================

/**
 * Build benchmarks section from canonical profile + strength_records table
 */
async function buildBenchmarksSection(
  userId: string,
  canonicalProfile: CanonicalProgrammingProfile
): Promise<{ section: ProgrammingTruthBundle['benchmarks']; errors: string[] }> {
  const errors: string[] = []
  
  // Start with canonical profile benchmarks
  const strength: BenchmarkStrengthData = {
    pullUpMax: canonicalProfile.pullUpMax ? parseInt(canonicalProfile.pullUpMax, 10) || null : null,
    dipMax: canonicalProfile.dipMax ? parseInt(canonicalProfile.dipMax, 10) || null : null,
    pushUpMax: canonicalProfile.pushUpMax ? parseInt(canonicalProfile.pushUpMax, 10) || null : null,
    weightedPullUpLoad: canonicalProfile.weightedPullUp?.addedWeight || null,
    weightedPullUpReps: canonicalProfile.weightedPullUp?.reps || null,
    weightedDipLoad: canonicalProfile.weightedDip?.addedWeight || null,
    weightedDipReps: canonicalProfile.weightedDip?.reps || null,
    wallHspuReps: canonicalProfile.wallHSPUReps ? parseInt(canonicalProfile.wallHSPUReps, 10) || null : null,
  }
  
  const skills: BenchmarkSkillData = {
    frontLeverProgression: canonicalProfile.frontLeverProgression,
    frontLeverHoldSeconds: canonicalProfile.frontLeverHoldSeconds,
    frontLeverIsAssisted: canonicalProfile.frontLeverIsAssisted,
    plancheProgression: canonicalProfile.plancheProgression,
    plancheHoldSeconds: canonicalProfile.plancheHoldSeconds,
    plancheIsAssisted: canonicalProfile.plancheIsAssisted,
    hspuProgression: canonicalProfile.hspuProgression,
    muscleUpReadiness: canonicalProfile.muscleUpReadiness,
    lSitHoldSeconds: canonicalProfile.lSitHoldSeconds ? parseInt(canonicalProfile.lSitHoldSeconds, 10) || null : null,
    vSitHoldSeconds: canonicalProfile.vSitHoldSeconds ? parseInt(canonicalProfile.vSitHoldSeconds, 10) || null : null,
  }
  
  let strengthRecordsCount = 0
  let mostRecentStrengthDate: string | null = null
  let source: TruthSourceLabel = 'canonical_profile'
  
  // Try to enrich from Neon strength_records
  const sql = getSql()
  if (sql) {
    try {
      const records = await sql`
        SELECT exercise, weight_added, reps, estimated_one_rm, date_logged
        FROM strength_records
        WHERE user_id = ${userId}
        ORDER BY date_logged DESC
        LIMIT 50
      `
      
      strengthRecordsCount = records.length
      if (records.length > 0) {
        mostRecentStrengthDate = records[0].date_logged
        source = 'neon_strength_records'
        
        // Enrich with most recent DB records if they're newer/better
        for (const rec of records) {
          const exercise = rec.exercise?.toLowerCase() || ''
          if (exercise.includes('pull') && exercise.includes('up') && !exercise.includes('weighted')) {
            if (!strength.pullUpMax || rec.reps > strength.pullUpMax) {
              strength.pullUpMax = rec.reps
            }
          }
          if (exercise.includes('dip') && !exercise.includes('weighted')) {
            if (!strength.dipMax || rec.reps > strength.dipMax) {
              strength.dipMax = rec.reps
            }
          }
          if (exercise.includes('weighted') && exercise.includes('pull')) {
            if (!strength.weightedPullUpLoad || rec.weight_added > strength.weightedPullUpLoad) {
              strength.weightedPullUpLoad = rec.weight_added
              strength.weightedPullUpReps = rec.reps
            }
          }
          if (exercise.includes('weighted') && exercise.includes('dip')) {
            if (!strength.weightedDipLoad || rec.weight_added > strength.weightedDipLoad) {
              strength.weightedDipLoad = rec.weight_added
              strength.weightedDipReps = rec.reps
            }
          }
        }
      }
    } catch (err) {
      errors.push(`strength_records query failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }
  
  const hasAnyBenchmark = !!(
    strength.pullUpMax || strength.dipMax || strength.weightedPullUpLoad ||
    skills.frontLeverProgression || skills.plancheProgression
  )
  
  return {
    section: {
      strength,
      skills,
      strengthRecordsCount,
      mostRecentStrengthDate,
      meta: {
        source,
        confidence: hasAnyBenchmark ? (strengthRecordsCount > 5 ? 'high' : 'medium') : 'low',
        available: hasAnyBenchmark,
        dataPointsCount: strengthRecordsCount,
        lastUpdated: mostRecentStrengthDate,
      },
    },
    errors,
  }
}

/**
 * Build skill progressions section from skill_progressions table
 */
async function buildSkillProgressionsSection(
  userId: string
): Promise<{ section: ProgrammingTruthBundle['skillProgressions']; errors: string[] }> {
  const errors: string[] = []
  const bySkill: Record<string, SkillProgressionData> = {}
  
  const sql = getSql()
  if (!sql) {
    return {
      section: {
        bySkill,
        totalSkillsTracked: 0,
        meta: unavailableMeta('Database connection unavailable'),
      },
      errors,
    }
  }
  
  try {
    const rows = await sql`
      SELECT skill_name, current_level, target_level, progress_score, last_updated
      FROM skill_progressions
      WHERE user_id = ${userId}
      ORDER BY last_updated DESC
    `
    
    for (const row of rows) {
      bySkill[row.skill_name] = {
        currentLevel: row.current_level,
        targetLevel: row.target_level,
        progressScore: row.progress_score ? parseFloat(row.progress_score) : null,
        lastUpdated: row.last_updated,
      }
    }
    
    const totalSkillsTracked = Object.keys(bySkill).length
    const mostRecent = rows[0]?.last_updated || null
    
    return {
      section: {
        bySkill,
        totalSkillsTracked,
        meta: {
          source: totalSkillsTracked > 0 ? 'neon_skill_progressions' : 'unavailable',
          confidence: totalSkillsTracked > 2 ? 'high' : totalSkillsTracked > 0 ? 'medium' : 'none',
          available: totalSkillsTracked > 0,
          dataPointsCount: totalSkillsTracked,
          lastUpdated: mostRecent,
        },
      },
      errors,
    }
  } catch (err) {
    errors.push(`skill_progressions query failed: ${err instanceof Error ? err.message : 'unknown'}`)
    return {
      section: {
        bySkill,
        totalSkillsTracked: 0,
        meta: unavailableMeta('Query failed'),
      },
      errors,
    }
  }
}

/**
 * Build performance envelopes section from performance_envelopes table
 */
async function buildPerformanceEnvelopesSection(
  userId: string
): Promise<{ section: ProgrammingTruthBundle['performanceEnvelopes']; errors: string[] }> {
  const errors: string[] = []
  const byMovementFamily: Record<string, PerformanceEnvelopeData> = {}
  
  const sql = getSql()
  if (!sql) {
    return {
      section: {
        byMovementFamily,
        totalEnvelopesTracked: 0,
        averageConfidenceScore: null,
        meta: unavailableMeta('Database connection unavailable'),
      },
      errors,
    }
  }
  
  try {
    const rows = await sql`
      SELECT 
        movement_family,
        preferred_rep_range_min,
        preferred_rep_range_max,
        preferred_set_range_min,
        preferred_set_range_max,
        preferred_weekly_volume_min,
        preferred_weekly_volume_max,
        preferred_density_level,
        fatigue_threshold,
        confidence_score,
        performance_trend,
        data_points_count,
        updated_at
      FROM performance_envelopes
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `
    
    let totalConfidence = 0
    let confidenceCount = 0
    
    for (const row of rows) {
      byMovementFamily[row.movement_family] = {
        preferredRepRangeMin: row.preferred_rep_range_min,
        preferredRepRangeMax: row.preferred_rep_range_max,
        preferredSetRangeMin: row.preferred_set_range_min,
        preferredSetRangeMax: row.preferred_set_range_max,
        preferredWeeklyVolumeMin: row.preferred_weekly_volume_min,
        preferredWeeklyVolumeMax: row.preferred_weekly_volume_max,
        preferredDensityLevel: row.preferred_density_level,
        fatigueThreshold: row.fatigue_threshold,
        confidenceScore: row.confidence_score,
        performanceTrend: row.performance_trend,
        dataPointsCount: row.data_points_count,
      }
      
      if (row.confidence_score != null) {
        totalConfidence += row.confidence_score
        confidenceCount++
      }
    }
    
    const totalEnvelopesTracked = Object.keys(byMovementFamily).length
    const averageConfidenceScore = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : null
    const mostRecent = rows[0]?.updated_at || null
    
    return {
      section: {
        byMovementFamily,
        totalEnvelopesTracked,
        averageConfidenceScore,
        meta: {
          source: totalEnvelopesTracked > 0 ? 'neon_performance_envelopes' : 'unavailable',
          confidence: averageConfidenceScore && averageConfidenceScore > 70 ? 'high' 
            : averageConfidenceScore && averageConfidenceScore > 40 ? 'medium' 
            : totalEnvelopesTracked > 0 ? 'low' : 'none',
          available: totalEnvelopesTracked > 0,
          dataPointsCount: totalEnvelopesTracked,
          lastUpdated: mostRecent,
        },
      },
      errors,
    }
  } catch (err) {
    errors.push(`performance_envelopes query failed: ${err instanceof Error ? err.message : 'unknown'}`)
    return {
      section: {
        byMovementFamily,
        totalEnvelopesTracked: 0,
        averageConfidenceScore: null,
        meta: unavailableMeta('Query failed'),
      },
      errors,
    }
  }
}

/**
 * Build constraint history section from constraint_history table
 */
async function buildConstraintHistorySection(
  userId: string,
  canonicalProfile: CanonicalProgrammingProfile
): Promise<{ section: ProgrammingTruthBundle['constraintHistory']; errors: string[] }> {
  const errors: string[] = []
  
  // Start with canonical profile joint cautions
  const activeJointRiskFlags: string[] = [...(canonicalProfile.jointCautions || [])]
  const recentConstraintPatterns: Array<{ constraint: string; severity: string; detectedAt: string }> = []
  const constraintImprovements: Array<{ constraint: string; improvement: number; trend: string }> = []
  
  const sql = getSql()
  if (!sql) {
    return {
      section: {
        activeJointRiskFlags,
        recentConstraintPatterns,
        constraintImprovements,
        totalHistoryRecords: 0,
        meta: {
          source: activeJointRiskFlags.length > 0 ? 'canonical_profile' : 'unavailable',
          confidence: activeJointRiskFlags.length > 0 ? 'medium' : 'none',
          available: activeJointRiskFlags.length > 0,
        },
      },
      errors,
    }
  }
  
  try {
    // Get recent constraint history
    const historyRows = await sql`
      SELECT 
        primary_constraint,
        primary_severity_level,
        primary_severity_score,
        detected_at,
        skill_context
      FROM constraint_history
      WHERE user_id = ${userId}
        AND detected_at > NOW() - INTERVAL '90 days'
      ORDER BY detected_at DESC
      LIMIT 20
    `
    
    for (const row of historyRows) {
      if (row.primary_constraint) {
        recentConstraintPatterns.push({
          constraint: row.primary_constraint,
          severity: row.primary_severity_level || 'unknown',
          detectedAt: row.detected_at,
        })
        
        // Add to active flags if not already present and high severity
        if (row.primary_severity_score > 60 && !activeJointRiskFlags.includes(row.primary_constraint)) {
          activeJointRiskFlags.push(row.primary_constraint)
        }
      }
    }
    
    // Get constraint improvements
    const improvementRows = await sql`
      SELECT 
        primary_constraint,
        improvement,
        improvement_status
      FROM constraint_improvement
      WHERE user_id = ${userId}
      ORDER BY current_date DESC
      LIMIT 10
    `
    
    for (const row of improvementRows) {
      constraintImprovements.push({
        constraint: row.primary_constraint,
        improvement: row.improvement || 0,
        trend: row.improvement_status || 'stable',
      })
    }
    
    const totalHistoryRecords = historyRows.length + improvementRows.length
    const hasDbData = totalHistoryRecords > 0
    
    return {
      section: {
        activeJointRiskFlags,
        recentConstraintPatterns,
        constraintImprovements,
        totalHistoryRecords,
        meta: {
          source: hasDbData ? 'neon_constraint_history' : (activeJointRiskFlags.length > 0 ? 'canonical_profile' : 'unavailable'),
          confidence: hasDbData ? 'high' : (activeJointRiskFlags.length > 0 ? 'medium' : 'none'),
          available: activeJointRiskFlags.length > 0 || hasDbData,
          dataPointsCount: totalHistoryRecords,
        },
      },
      errors,
    }
  } catch (err) {
    errors.push(`constraint_history query failed: ${err instanceof Error ? err.message : 'unknown'}`)
    return {
      section: {
        activeJointRiskFlags,
        recentConstraintPatterns,
        constraintImprovements,
        totalHistoryRecords: 0,
        meta: {
          source: activeJointRiskFlags.length > 0 ? 'canonical_profile' : 'unavailable',
          confidence: activeJointRiskFlags.length > 0 ? 'medium' : 'none',
          available: activeJointRiskFlags.length > 0,
          note: 'DB query failed, using canonical profile only',
        },
      },
      errors,
    }
  }
}

/**
 * Build training response section from workout_logs + training_response_signals
 */
async function buildTrainingResponseSection(
  userId: string
): Promise<{ section: ProgrammingTruthBundle['trainingResponse']; errors: string[] }> {
  const errors: string[] = []
  
  const sql = getSql()
  if (!sql) {
    return {
      section: {
        hasEarnedHistory: false,
        totalWorkoutsLogged: 0,
        recentAdherencePattern: null,
        consistencySignal: null,
        averageDifficultyRating: null,
        averageCompletionRatio: null,
        memorySummary: null,
        meta: unavailableMeta('Database connection unavailable'),
      },
      errors,
    }
  }
  
  try {
    // Count workout logs
    const logCountResult = await sql`
      SELECT COUNT(*) as count
      FROM workout_logs
      WHERE user_id = ${userId}
    `
    const totalWorkoutsLogged = parseInt(logCountResult[0]?.count || '0', 10)
    
    // Get recent workout frequency for adherence pattern
    const recentLogsResult = await sql`
      SELECT session_date
      FROM workout_logs
      WHERE user_id = ${userId}
        AND session_date > NOW() - INTERVAL '30 days'
      ORDER BY session_date DESC
    `
    const recentWorkouts = recentLogsResult.length
    
    let recentAdherencePattern: 'consistent' | 'sporadic' | 'unknown' | null = null
    let consistencySignal: 'high' | 'medium' | 'low' | null = null
    
    if (recentWorkouts >= 12) {
      recentAdherencePattern = 'consistent'
      consistencySignal = 'high'
    } else if (recentWorkouts >= 6) {
      recentAdherencePattern = 'consistent'
      consistencySignal = 'medium'
    } else if (recentWorkouts >= 2) {
      recentAdherencePattern = 'sporadic'
      consistencySignal = 'low'
    } else if (totalWorkoutsLogged > 0) {
      recentAdherencePattern = 'unknown'
      consistencySignal = 'low'
    }
    
    // Get training response metrics if available
    let averageDifficultyRating: number | null = null
    let averageCompletionRatio: number | null = null
    
    try {
      const responseResult = await sql`
        SELECT 
          AVG(CASE WHEN perceived_difficulty = 'easy' THEN 1 
                   WHEN perceived_difficulty = 'moderate' THEN 2 
                   WHEN perceived_difficulty = 'hard' THEN 3 
                   ELSE NULL END) as avg_difficulty
        FROM training_response_signals
        WHERE user_id = ${userId}
          AND session_date > NOW() - INTERVAL '30 days'
      `
      if (responseResult[0]?.avg_difficulty) {
        averageDifficultyRating = parseFloat(responseResult[0].avg_difficulty)
      }
    } catch {
      // training_response_signals may not exist or have data - that's okay
    }
    
    const hasEarnedHistory = totalWorkoutsLogged >= 3
    
    return {
      section: {
        hasEarnedHistory,
        totalWorkoutsLogged,
        recentAdherencePattern,
        consistencySignal,
        averageDifficultyRating,
        averageCompletionRatio,
        memorySummary: hasEarnedHistory 
          ? `${totalWorkoutsLogged} workouts logged, ${recentWorkouts} in last 30 days`
          : null,
        meta: {
          source: hasEarnedHistory ? 'neon_workout_logs' : 'unavailable',
          confidence: hasEarnedHistory ? (recentWorkouts >= 8 ? 'high' : 'medium') : 'none',
          available: hasEarnedHistory,
          dataPointsCount: totalWorkoutsLogged,
        },
      },
      errors,
    }
  } catch (err) {
    errors.push(`training_response query failed: ${err instanceof Error ? err.message : 'unknown'}`)
    return {
      section: {
        hasEarnedHistory: false,
        totalWorkoutsLogged: 0,
        recentAdherencePattern: null,
        consistencySignal: null,
        averageDifficultyRating: null,
        averageCompletionRatio: null,
        memorySummary: null,
        meta: unavailableMeta('Query failed'),
      },
      errors,
    }
  }
}

/**
 * Build derived programming signals from available truth
 */
function buildDerivedSignals(
  canonicalProfile: CanonicalProgrammingProfile,
  benchmarks: ProgrammingTruthBundle['benchmarks'],
  skillProgressions: ProgrammingTruthBundle['skillProgressions'],
  performanceEnvelopes: ProgrammingTruthBundle['performanceEnvelopes'],
  constraintHistory: ProgrammingTruthBundle['constraintHistory'],
  trainingResponse: ProgrammingTruthBundle['trainingResponse']
): ProgrammingTruthBundle['derivedSignals'] {
  // Compute pulling strength bias
  const hasPullBenchmarks = !!(benchmarks.strength.pullUpMax || benchmarks.strength.weightedPullUpLoad)
  const pullUpMax = benchmarks.strength.pullUpMax || 0
  const pullingStrengthBias: 'low' | 'medium' | 'high' = 
    pullUpMax >= 15 || benchmarks.strength.weightedPullUpLoad ? 'high' :
    pullUpMax >= 8 ? 'medium' : 'low'
  
  // Compute pushing strength bias
  const hasPushBenchmarks = !!(benchmarks.strength.dipMax || benchmarks.strength.weightedDipLoad)
  const dipMax = benchmarks.strength.dipMax || 0
  const pushingStrengthBias: 'low' | 'medium' | 'high' =
    dipMax >= 15 || benchmarks.strength.weightedDipLoad ? 'high' :
    dipMax >= 8 ? 'medium' : 'low'
  
  // Compute straight arm exposure bias from skills
  const hasFlOrPl = !!(benchmarks.skills.frontLeverProgression || benchmarks.skills.plancheProgression)
  const flProgression = benchmarks.skills.frontLeverProgression?.toLowerCase() || ''
  const plProgression = benchmarks.skills.plancheProgression?.toLowerCase() || ''
  const straightArmExposureBias: 'low' | 'medium' | 'high' =
    (flProgression.includes('full') || plProgression.includes('full')) ? 'high' :
    (flProgression.includes('straddle') || plProgression.includes('straddle') ||
     flProgression.includes('advanced') || plProgression.includes('advanced')) ? 'medium' :
    hasFlOrPl ? 'low' : 'low'
  
  // Compute skill specificity bias from selected skills
  const selectedSkillCount = canonicalProfile.selectedSkills?.length || 0
  const skillSpecificityBias: 'low' | 'medium' | 'high' =
    selectedSkillCount >= 3 ? 'high' :
    selectedSkillCount >= 1 ? 'medium' : 'low'
  
  // Compute confidence signals
  const dosageConfidence: TruthConfidence =
    performanceEnvelopes.meta.available && (performanceEnvelopes.averageConfidenceScore || 0) > 60 ? 'high' :
    benchmarks.meta.available && hasPullBenchmarks && hasPushBenchmarks ? 'medium' :
    benchmarks.meta.available ? 'low' : 'none'
  
  const densityConfidence: TruthConfidence =
    performanceEnvelopes.meta.available && Object.values(performanceEnvelopes.byMovementFamily).some(e => e.preferredDensityLevel) ? 'high' :
    trainingResponse.hasEarnedHistory ? 'medium' :
    'low'
  
  const progressionConfidence: TruthConfidence =
    skillProgressions.meta.available && skillProgressions.totalSkillsTracked >= 2 ? 'high' :
    benchmarks.skills.frontLeverProgression || benchmarks.skills.plancheProgression ? 'medium' :
    'low'
  
  const loadingConfidence: TruthConfidence =
    benchmarks.strengthRecordsCount > 5 ? 'high' :
    hasPullBenchmarks || hasPushBenchmarks ? 'medium' :
    'low'
  
  // Constraint signals
  const hasActiveConstraints = constraintHistory.activeJointRiskFlags.length > 0
  const constraintInformedSelection = constraintHistory.meta.available && constraintHistory.totalHistoryRecords > 0
  
  return {
    straightArmExposureBias,
    pullingStrengthBias,
    pushingStrengthBias,
    skillSpecificityBias,
    dosageConfidence,
    densityConfidence,
    progressionConfidence,
    loadingConfidence,
    hasActiveConstraints,
    constraintInformedSelection,
    meta: {
      source: 'derived_from_available',
      confidence: dosageConfidence === 'none' && progressionConfidence === 'none' ? 'low' : 'medium',
      available: true,
    },
  }
}

// =============================================================================
// MAIN BUNDLE BUILDER
// =============================================================================

/**
 * Build the Programming Truth Bundle for a user.
 * 
 * This is the SINGLE entry point for building upstream generation intelligence.
 * Call this once at generation ingress and pass the bundle through.
 * 
 * @param userId - The user ID to build the bundle for
 * @param canonicalProfileOverride - Optional override for canonical profile (for testing)
 */
export async function buildProgrammingTruthBundle(
  userId: string,
  canonicalProfileOverride?: CanonicalProgrammingProfile | null
): Promise<ProgrammingTruthBundle> {
  const startTime = Date.now()
  const allErrors: string[] = []
  
  // Step 1: Get canonical profile (required base truth)
  const canonicalProfile = canonicalProfileOverride || getCanonicalProfile()
  
  // ==========================================================================
  // [TRUTH_BUNDLE_IDENTITY_GATE] Identity verification
  // The protected funnel should have already repaired identity, so this is
  // a secondary gate. If identity still doesn't match here, it's a serious issue.
  // ==========================================================================
  const profileUserId = canonicalProfile?.userId
  const identityMatch = profileUserId === userId
  
  console.log('[TRUTH_BUNDLE_IDENTITY_GATE]', {
    fingerprint: 'IDENTITY_INGRESS_2026_04_11_V1',
    requestedUserId: userId?.slice(0, 12) || 'missing',
    profileUserId: profileUserId?.slice(0, 12) || 'missing',
    identityMatch,
    hasCanonicalProfile: !!canonicalProfile,
    verdict: identityMatch ? 'IDENTITY_VERIFIED' : (profileUserId ? 'IDENTITY_MISMATCH' : 'IDENTITY_MISSING'),
  })
  
  if (!canonicalProfile || !profileUserId) {
    console.error('[TRUTH_BUNDLE_IDENTITY_GATE_FAIL]', {
      fingerprint: 'IDENTITY_INGRESS_2026_04_11_V1',
      reason: !canonicalProfile ? 'no_canonical_profile' : 'no_profile_userId',
      requestedUserId: userId?.slice(0, 12),
      verdict: 'SHOULD_NOT_REACH_HERE_IF_FUNNEL_WORKING',
    })
    // The protected funnel should have caught this earlier, but we still warn
  }
  
  // Step 2: Build each section in parallel
  const [
    benchmarksResult,
    skillProgressionsResult,
    performanceEnvelopesResult,
    constraintHistoryResult,
    trainingResponseResult,
  ] = await Promise.all([
    buildBenchmarksSection(userId, canonicalProfile),
    buildSkillProgressionsSection(userId),
    buildPerformanceEnvelopesSection(userId),
    buildConstraintHistorySection(userId, canonicalProfile),
    buildTrainingResponseSection(userId),
  ])
  
  // Collect errors
  allErrors.push(...benchmarksResult.errors)
  allErrors.push(...skillProgressionsResult.errors)
  allErrors.push(...performanceEnvelopesResult.errors)
  allErrors.push(...constraintHistoryResult.errors)
  allErrors.push(...trainingResponseResult.errors)
  
  // Step 3: Build derived signals
  const derivedSignals = buildDerivedSignals(
    canonicalProfile,
    benchmarksResult.section,
    skillProgressionsResult.section,
    performanceEnvelopesResult.section,
    constraintHistoryResult.section,
    trainingResponseResult.section
  )
  
  // Step 4: Build diagnostics
  const sectionsAvailable: TruthSourceLabel[] = ['canonical_profile']
  const sectionsUnavailable: TruthSourceLabel[] = []
  
  if (benchmarksResult.section.meta.available) {
    sectionsAvailable.push(benchmarksResult.section.meta.source)
  } else {
    sectionsUnavailable.push('neon_strength_records')
  }
  
  if (skillProgressionsResult.section.meta.available) {
    sectionsAvailable.push('neon_skill_progressions')
  } else {
    sectionsUnavailable.push('neon_skill_progressions')
  }
  
  if (performanceEnvelopesResult.section.meta.available) {
    sectionsAvailable.push('neon_performance_envelopes')
  } else {
    sectionsUnavailable.push('neon_performance_envelopes')
  }
  
  if (constraintHistoryResult.section.meta.available) {
    sectionsAvailable.push(constraintHistoryResult.section.meta.source)
  } else {
    sectionsUnavailable.push('neon_constraint_history')
  }
  
  if (trainingResponseResult.section.meta.available) {
    sectionsAvailable.push('neon_workout_logs')
  } else {
    sectionsUnavailable.push('neon_workout_logs')
  }
  
  const totalDataPoints = 
    (benchmarksResult.section.meta.dataPointsCount || 0) +
    (skillProgressionsResult.section.meta.dataPointsCount || 0) +
    (performanceEnvelopesResult.section.meta.dataPointsCount || 0) +
    (constraintHistoryResult.section.meta.dataPointsCount || 0) +
    (trainingResponseResult.section.meta.dataPointsCount || 0)
  
  const buildDurationMs = Date.now() - startTime
  
  // Step 5: Assemble the bundle
  const bundle: ProgrammingTruthBundle = {
    version: 1,
    
    athleteIdentity: {
      userId,
      canonicalProfilePresent: !!canonicalProfile,
      onboardingComplete: canonicalProfile?.onboardingComplete || false,
      meta: {
        source: 'canonical_profile',
        confidence: canonicalProfile?.onboardingComplete ? 'high' : 'medium',
        available: true,
      },
    },
    
    canonicalProfile: {
      value: canonicalProfile,
      meta: {
        source: 'canonical_profile',
        confidence: 'high',
        available: true,
      },
    },
    
    benchmarks: benchmarksResult.section,
    skillProgressions: skillProgressionsResult.section,
    performanceEnvelopes: performanceEnvelopesResult.section,
    constraintHistory: constraintHistoryResult.section,
    trainingResponse: trainingResponseResult.section,
    derivedSignals,
    
    diagnostics: {
      bundleVersion: 1,
      bundleBuiltAt: new Date().toISOString(),
      sectionsAvailable,
      sectionsUnavailable,
      totalDataPointsAcrossSections: totalDataPoints,
      buildDurationMs,
      errors: allErrors,
    },
  }
  
  // Log bundle build summary
  console.log('[ProgrammingTruthBundle] Bundle built', {
    userId,
    sectionsAvailable: sectionsAvailable.length,
    sectionsUnavailable: sectionsUnavailable.length,
    totalDataPoints,
    buildDurationMs,
    errorCount: allErrors.length,
    derivedSignals: {
      dosageConfidence: derivedSignals.dosageConfidence,
      progressionConfidence: derivedSignals.progressionConfidence,
      hasActiveConstraints: derivedSignals.hasActiveConstraints,
    },
  })
  
  return bundle
}

// =============================================================================
// UTILITY EXPORTS FOR DOWNSTREAM USAGE
// =============================================================================

export { 
  hasMeaningfulBenchmarks, 
  hasPerformanceEnvelopeData, 
  hasEarnedTrainingHistory,
  getBundleConfidenceLevel,
  isSectionAvailable,
} from './programming-truth-bundle-contract'
