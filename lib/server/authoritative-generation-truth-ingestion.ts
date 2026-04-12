/**
 * ==========================================================================
 * AUTHORITATIVE GENERATION TRUTH INGESTION CONTRACT
 * ==========================================================================
 * 
 * This is the SINGLE authoritative owner of all generation truth ingestion.
 * ALL generation flows MUST ingest truth through this service before calling
 * the builder. This ensures:
 * 
 * 1. Profile truth is fetched from authoritative server-side sources first
 * 2. Caller overrides are explicitly tracked and labeled
 * 3. Recovery/adherence/execution truth is normalized from available sources
 * 4. Doctrine truth availability is audited honestly
 * 5. Missing signals are labeled as partial/weak, not silently defaulted
 * 
 * RULE: This contract is READ-ONLY for truth sources. It does not mutate data.
 * RULE: Missing signals must reduce quality labels, not fabricate certainty.
 * ==========================================================================
 */

import { getCanonicalProfile, type CanonicalProgrammingProfile } from '@/lib/canonical-profile-service'
import { checkDoctrineRuntimeReadiness, type DoctrineRuntimeReadiness } from '@/lib/doctrine-runtime-readiness'
import type { ReadinessAssessment } from '@/lib/recovery-fatigue-engine'
import type { ConsistencyStatus, ConsistencyState } from '@/lib/consistency-momentum-engine'
import type { AdaptiveProgramInputs } from '@/lib/adaptive-program-builder'
import { 
  fetchNeonTruthPackage, 
  getNeonTruthSummary,
  type NeonTruthPackage, 
  type NeonSignalQuality 
} from './neon-truth-reader'

// Note: getReadinessAssessment and getConsistencyStatus are client-side only
// and use localStorage. For server-side ingestion, we MUST read from Neon
// when available, and only fall back to caller-provided training feedback
// when DB data is unavailable.

// ==========================================================================
// TYPES: Quality Labels
// ==========================================================================

export type SignalQuality = 'strong' | 'usable' | 'partial' | 'weak' | 'missing'

export type FieldSource = 
  | 'authoritative_db'         // Read directly from Neon database
  | 'authoritative_profile'    // From server-side canonical profile (caller-provided)
  | 'caller_override'          // Explicitly provided by caller (tracked)
  | 'defaulted'                // Missing, using safe default
  | 'inferred'                 // Derived from other fields
  | 'none'                     // Not available

// ==========================================================================
// TYPES: Generation Source Map (NEW)
// ==========================================================================

export interface MaterialSignalRecord {
  key: string
  source: FieldSource
  quality: SignalQuality
  usedInGeneration: boolean
  usedByWeekAdaptation: boolean
  valueSummary: string
  reason: string
}

export interface GenerationSourceMap {
  // Summary
  overallQuality: SignalQuality
  profileQuality: SignalQuality
  recoveryQuality: SignalQuality
  adherenceQuality: SignalQuality
  executionQuality: SignalQuality
  doctrineQuality: SignalQuality
  programContextQuality: SignalQuality
  
  // Material signals
  materialSignals: MaterialSignalRecord[]
  
  // Categorized signals
  dbSignalsRead: string[]
  callerOverrideSignals: string[]
  defaultedSignals: string[]
  missingSignals: string[]
  
  // Influence summary
  influenceSummary: string[]
  doctrineEligibility: boolean
  
  // Neon-specific
  neonDbAvailable: boolean
  neonAvailableDomains: string[]
  neonUnavailableDomains: string[]
  
  // Meta
  generatedAt: string
}

// ==========================================================================
// TYPES: Profile Truth Block
// ==========================================================================

export interface ProfileTruthBlock {
  source: 'canonical_profile_service'
  quality: SignalQuality
  canonicalProfile: CanonicalProgrammingProfile
  
  // Explicit tracking of what was authoritative vs caller-overridden
  fieldSources: {
    primaryGoal: FieldSource
    secondaryGoal: FieldSource
    selectedSkills: FieldSource
    scheduleMode: FieldSource
    trainingDaysPerWeek: FieldSource
    sessionLengthMinutes: FieldSource
    experienceLevel: FieldSource
    trainingPathType: FieldSource
    jointCautions: FieldSource
    equipment: FieldSource
    trainingMethodPreferences: FieldSource
  }
  
  // Audit fields
  missingFields: string[]
  defaultedFields: string[]
  callerOverriddenFields: string[]
  
  // Evidence
  evidence: string[]
}

// ==========================================================================
// TYPES: Recovery Truth Block
// ==========================================================================

export interface RecoveryTruthBlock {
  quality: SignalQuality
  
  // Normalized readiness state
  readinessState: string | null
  fatigueState: string | null
  recoveryRisk: 'low' | 'moderate' | 'high' | 'unknown'
  sorenessRisk: 'low' | 'moderate' | 'high' | 'unknown'
  
  // Raw assessment if available
  rawAssessment: ReadinessAssessment | null
  
  // Evidence
  evidence: string[]
}

// ==========================================================================
// TYPES: Adherence Truth Block
// ==========================================================================

export interface AdherenceTruthBlock {
  quality: SignalQuality
  
  // Normalized adherence signals
  recentMissedSessions: number
  recentPartialSessions: number
  recentCompletedSessions: number
  consistencyStatus: 'stable' | 'mixed' | 'disrupted' | 'unknown'
  
  // Session counts
  totalSessionsLast7Days: number
  totalSessionsLast14Days: number
  expectedSessionsPerWeek: number
  
  // Disruption flags (for future skip-day UI integration)
  disruptionReason: string | null
  recoveryInterruptionFlag: boolean
  adherenceDisruptionFlag: boolean
  
  // Raw status if available
  rawConsistencyStatus: ConsistencyStatus | null
  
  // Evidence
  evidence: string[]
}

// ==========================================================================
// TYPES: Execution Truth Block
// ==========================================================================

export interface ExecutionTruthBlock {
  quality: SignalQuality
  
  // Normalized execution signals
  recentSessionCount: number
  usablePerformanceSignals: number
  averageRecentRPE: number | null
  recentCompletionRate: number | null
  recentLoadToleranceSummary: string | null
  
  // Evidence
  evidence: string[]
}

// ==========================================================================
// TYPES: Doctrine Truth Block
// ==========================================================================

export interface DoctrineTruthBlock {
  quality: SignalQuality
  
  // Doctrine availability
  readinessVerdict: string
  readinessExplanation: string
  coverageSummary: string[]
  influenceEligible: boolean
  
  // Raw readiness if available
  rawReadiness: DoctrineRuntimeReadiness | null
  
  // Evidence
  evidence: string[]
}

// ==========================================================================
// TYPES: Current Program Context Block
// ==========================================================================

export interface CurrentProgramContextBlock {
  quality: SignalQuality
  
  // Program context
  existingProgramId: string | null
  currentWeekIndex: number | null
  activeProgramExists: boolean
  recentGenerationIntent: string | null
  
  // Week context
  isFirstGeneratedWeek: boolean
  previousWeekCompleted: boolean
  
  // Evidence
  evidence: string[]
}

// ==========================================================================
// TYPES: Signal Audit Summary
// ==========================================================================

export interface SignalAuditSummary {
  totalSignalDomains: number
  strongDomains: number
  usableDomains: number
  partialDomains: number
  weakDomains: number
  missingDomains: number
  overallQuality: SignalQuality
  
  // Domain breakdown
  domainQualities: {
    profile: SignalQuality
    recovery: SignalQuality
    adherence: SignalQuality
    execution: SignalQuality
    doctrine: SignalQuality
    programContext: SignalQuality
  }
}

// ==========================================================================
// TYPES: Full Ingestion Contract
// ==========================================================================

export interface AuthoritativeGenerationTruthIngestion {
  // Metadata
  ingestedAt: string
  ingestionVersion: '1.1.0'  // Updated for Neon integration
  
  // Truth blocks
  profileTruth: ProfileTruthBlock
  recoveryTruth: RecoveryTruthBlock
  adherenceTruth: AdherenceTruthBlock
  executionTruth: ExecutionTruthBlock
  doctrineTruth: DoctrineTruthBlock
  currentProgramContext: CurrentProgramContextBlock
  
  // Overall audit
  signalAudit: SignalAuditSummary
  
  // [NEON-TRUTH-CONTRACT] Generation Source Map
  sourceMap: GenerationSourceMap
  
  // [NEON-TRUTH-CONTRACT] Raw Neon package (for downstream inspection)
  neonTruthPackage: NeonTruthPackage | null
  
  // Safe generation notes
  safeGenerationNotes: string[]
}

// ==========================================================================
// TYPES: Ingestion Input
// ==========================================================================

export interface IngestionInput {
  // Required
  dbUserId: string
  generationIntent: string
  
  // Caller-provided inputs (to be tracked as overrides)
  callerCanonicalProfile?: Partial<CanonicalProgrammingProfile>
  callerBuilderInputs?: Partial<AdaptiveProgramInputs>
  
  // Optional context
  existingProgramId?: string
  isFreshBaselineBuild?: boolean
  
  // Training feedback context (if available from builder)
  trainingFeedback?: {
    totalSessionsLast7Days: number
    totalSessionsLast14Days: number
    expectedSessionsPerWeek: number
    averageRecentRPE: number | null
    recentCompletionRate: number | null
    trustedWorkoutCount: number
  }
}

// ==========================================================================
// HELPER: Compute Quality from Present/Missing Counts
// ==========================================================================

function computeQuality(presentCount: number, totalFields: number): SignalQuality {
  const ratio = totalFields > 0 ? presentCount / totalFields : 0
  if (ratio >= 0.9) return 'strong'
  if (ratio >= 0.7) return 'usable'
  if (ratio >= 0.4) return 'partial'
  if (ratio > 0) return 'weak'
  return 'missing'
}

// ==========================================================================
// HELPER: Build Profile Truth Block
// ==========================================================================

function buildProfileTruthBlock(
  callerProfile: Partial<CanonicalProgrammingProfile> | undefined,
  callerInputs: Partial<AdaptiveProgramInputs> | undefined,
  dbUserId?: string  // [PROTECTED_FUNNEL_IDENTITY] Server-resolved identity for repair
): ProfileTruthBlock {
  // [SERVER-SIDE-ROOT-CAUSE-FIX] getCanonicalProfile() uses localStorage which is unavailable server-side.
  // On the server, the caller-provided profile IS the authoritative source.
  // The caller (route) must fetch profile data before calling the authoritative service.
  
  // Step 1: On server-side, use caller profile as the authoritative source
  // (getCanonicalProfile() returns empty/default on server because localStorage is unavailable)
  const isServerSide = typeof window === 'undefined'
  
  // If server-side and no caller profile provided, we cannot proceed with meaningful profile data
  if (isServerSide && !callerProfile) {
    console.log('[authoritative-truth-ingestion-profile-fallback]', {
      reason: 'server_side_no_caller_profile',
      isServerSide,
    })
    // Return a weak/partial profile block to indicate the problem
    return {
      source: 'canonical_profile_service',
      quality: 'weak',
      canonicalProfile: {
        primaryGoal: 'skill_development',
        scheduleMode: 'weekly',
        trainingDaysPerWeek: 4,
        experienceLevel: 'intermediate',
      } as CanonicalProgrammingProfile,
      fieldSources: {
        primaryGoal: 'defaulted',
        secondaryGoal: 'none',
        selectedSkills: 'none',
        scheduleMode: 'defaulted',
        trainingDaysPerWeek: 'defaulted',
        sessionLengthMinutes: 'none',
        experienceLevel: 'defaulted',
        trainingPathType: 'none',
        jointCautions: 'none',
        equipment: 'none',
        trainingMethodPreferences: 'none',
      },
      missingFields: ['primaryGoal', 'selectedSkills', 'scheduleMode', 'experienceLevel'],
      defaultedFields: ['all_fields_server_fallback'],
      callerOverriddenFields: [],
      evidence: ['Server-side ingestion with no caller profile - using fallback defaults'],
    }
  }
  
  // Step 2: Use caller profile as authoritative on server, or fetch client-side
  const authoritativeProfile = isServerSide 
    ? (callerProfile as CanonicalProgrammingProfile) 
    : getCanonicalProfile()
  
  // Step 3: Track which fields come from authoritative vs caller override
  const fieldSources: ProfileTruthBlock['fieldSources'] = {
    primaryGoal: 'authoritative_profile',
    secondaryGoal: 'authoritative_profile',
    selectedSkills: 'authoritative_profile',
    scheduleMode: 'authoritative_profile',
    trainingDaysPerWeek: 'authoritative_profile',
    sessionLengthMinutes: 'authoritative_profile',
    experienceLevel: 'authoritative_profile',
    trainingPathType: 'authoritative_profile',
    jointCautions: 'authoritative_profile',
    equipment: 'authoritative_profile',
    trainingMethodPreferences: 'authoritative_profile',
  }
  
  const callerOverriddenFields: string[] = []
  const missingFields: string[] = []
  const defaultedFields: string[] = []
  const evidence: string[] = []
  
  // ==========================================================================
  // [PROTECTED_FUNNEL_IDENTITY_ENTRY] Identity ingress audit
  // ==========================================================================
  const callerUserId = callerProfile?.userId
  const profileUserId = authoritativeProfile.userId
  const serverUserId = dbUserId
  
  console.log('[PROTECTED_FUNNEL_IDENTITY_ENTRY]', {
    fingerprint: 'IDENTITY_INGRESS_2026_04_11_V1',
    callerUserId: callerUserId?.slice(0, 12) || 'missing',
    profileUserId: profileUserId?.slice(0, 12) || 'missing',
    serverUserId: serverUserId?.slice(0, 12) || 'missing',
    callerHasUserId: !!callerUserId,
    profileHasUserId: !!profileUserId,
    serverHasUserId: !!serverUserId,
    isServerSide,
  })
  
  // Merge caller profile with tracking
  const merged = { ...authoritativeProfile }
  
  // ==========================================================================
  // [PROTECTED_FUNNEL_IDENTITY_REPAIR] Authoritative identity stitch
  // If server resolved dbUserId is available, it MUST be stitched into the
  // canonical profile. This is the SINGLE authoritative identity repair point.
  // ==========================================================================
  let identityRepaired = false
  let identitySource: 'server_resolved' | 'caller_provided' | 'profile_existing' | 'missing' = 'missing'
  
  if (serverUserId) {
    // Server identity is authoritative - always use it
    merged.userId = serverUserId
    identityRepaired = !profileUserId || profileUserId !== serverUserId
    identitySource = 'server_resolved'
    
    if (identityRepaired) {
      evidence.push(`Identity repaired from server: ${serverUserId.slice(0, 12)}...`)
    }
  } else if (callerUserId) {
    // Fallback to caller-provided userId if no server identity
    merged.userId = callerUserId
    identitySource = 'caller_provided'
    evidence.push(`Identity from caller: ${callerUserId.slice(0, 12)}...`)
  } else if (profileUserId) {
    // Keep existing profile userId
    identitySource = 'profile_existing'
  }
  
  console.log('[PROTECTED_FUNNEL_IDENTITY_REPAIR]', {
    fingerprint: 'IDENTITY_INGRESS_2026_04_11_V1',
    identityRepaired,
    identitySource,
    finalUserId: merged.userId?.slice(0, 12) || 'STILL_MISSING',
    serverUserIdUsed: serverUserId ? true : false,
    verdict: merged.userId ? 'IDENTITY_ESTABLISHED' : 'IDENTITY_STILL_MISSING',
  })
  
  if (callerProfile) {
    // Track each override
    if (callerProfile.primaryGoal && callerProfile.primaryGoal !== authoritativeProfile.primaryGoal) {
      merged.primaryGoal = callerProfile.primaryGoal
      fieldSources.primaryGoal = 'caller_override'
      callerOverriddenFields.push('primaryGoal')
    }
    if (callerProfile.secondaryGoal !== undefined && callerProfile.secondaryGoal !== authoritativeProfile.secondaryGoal) {
      merged.secondaryGoal = callerProfile.secondaryGoal
      fieldSources.secondaryGoal = 'caller_override'
      callerOverriddenFields.push('secondaryGoal')
    }
    if (callerProfile.selectedSkills?.length && JSON.stringify(callerProfile.selectedSkills) !== JSON.stringify(authoritativeProfile.selectedSkills)) {
      merged.selectedSkills = callerProfile.selectedSkills
      fieldSources.selectedSkills = 'caller_override'
      callerOverriddenFields.push('selectedSkills')
    }
    if (callerProfile.scheduleMode && callerProfile.scheduleMode !== authoritativeProfile.scheduleMode) {
      merged.scheduleMode = callerProfile.scheduleMode
      fieldSources.scheduleMode = 'caller_override'
      callerOverriddenFields.push('scheduleMode')
    }
    if (callerProfile.trainingDaysPerWeek !== undefined && callerProfile.trainingDaysPerWeek !== authoritativeProfile.trainingDaysPerWeek) {
      merged.trainingDaysPerWeek = callerProfile.trainingDaysPerWeek
      fieldSources.trainingDaysPerWeek = 'caller_override'
      callerOverriddenFields.push('trainingDaysPerWeek')
    }
    if (callerProfile.sessionLengthMinutes && callerProfile.sessionLengthMinutes !== authoritativeProfile.sessionLengthMinutes) {
      merged.sessionLengthMinutes = callerProfile.sessionLengthMinutes
      fieldSources.sessionLengthMinutes = 'caller_override'
      callerOverriddenFields.push('sessionLengthMinutes')
    }
    if (callerProfile.experienceLevel && callerProfile.experienceLevel !== authoritativeProfile.experienceLevel) {
      merged.experienceLevel = callerProfile.experienceLevel
      fieldSources.experienceLevel = 'caller_override'
      callerOverriddenFields.push('experienceLevel')
    }
    if (callerProfile.trainingPathType && callerProfile.trainingPathType !== authoritativeProfile.trainingPathType) {
      merged.trainingPathType = callerProfile.trainingPathType
      fieldSources.trainingPathType = 'caller_override'
      callerOverriddenFields.push('trainingPathType')
    }
    if (callerProfile.jointCautions?.length && JSON.stringify(callerProfile.jointCautions) !== JSON.stringify(authoritativeProfile.jointCautions)) {
      merged.jointCautions = callerProfile.jointCautions
      fieldSources.jointCautions = 'caller_override'
      callerOverriddenFields.push('jointCautions')
    }
    if (callerProfile.equipmentAvailable?.length && JSON.stringify(callerProfile.equipmentAvailable) !== JSON.stringify(authoritativeProfile.equipmentAvailable)) {
      merged.equipmentAvailable = callerProfile.equipmentAvailable
      fieldSources.equipment = 'caller_override'
      callerOverriddenFields.push('equipment')
    }
    if (callerProfile.trainingMethodPreferences?.length && JSON.stringify(callerProfile.trainingMethodPreferences) !== JSON.stringify(authoritativeProfile.trainingMethodPreferences)) {
      merged.trainingMethodPreferences = callerProfile.trainingMethodPreferences
      fieldSources.trainingMethodPreferences = 'caller_override'
      callerOverriddenFields.push('trainingMethodPreferences')
    }
  }
  
  // Also apply builder inputs as overrides
  if (callerInputs) {
    if (callerInputs.primaryGoal && callerInputs.primaryGoal !== merged.primaryGoal) {
      merged.primaryGoal = callerInputs.primaryGoal
      fieldSources.primaryGoal = 'caller_override'
      if (!callerOverriddenFields.includes('primaryGoal')) callerOverriddenFields.push('primaryGoal')
    }
    if (callerInputs.scheduleMode && callerInputs.scheduleMode !== merged.scheduleMode) {
      merged.scheduleMode = callerInputs.scheduleMode
      fieldSources.scheduleMode = 'caller_override'
      if (!callerOverriddenFields.includes('scheduleMode')) callerOverriddenFields.push('scheduleMode')
    }
    if (callerInputs.trainingDaysPerWeek !== undefined && callerInputs.trainingDaysPerWeek !== merged.trainingDaysPerWeek) {
      merged.trainingDaysPerWeek = callerInputs.trainingDaysPerWeek
      fieldSources.trainingDaysPerWeek = 'caller_override'
      if (!callerOverriddenFields.includes('trainingDaysPerWeek')) callerOverriddenFields.push('trainingDaysPerWeek')
    }
    if (callerInputs.selectedSkills?.length && JSON.stringify(callerInputs.selectedSkills) !== JSON.stringify(merged.selectedSkills)) {
      merged.selectedSkills = callerInputs.selectedSkills
      fieldSources.selectedSkills = 'caller_override'
      if (!callerOverriddenFields.includes('selectedSkills')) callerOverriddenFields.push('selectedSkills')
    }
  }
  
  // Check for missing critical fields
  const criticalFields = ['primaryGoal', 'selectedSkills', 'scheduleMode', 'experienceLevel'] as const
  let presentCount = 0
  
  for (const field of criticalFields) {
    const value = merged[field]
    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      if (field === 'selectedSkills') {
        // selectedSkills can be empty for strength-focused users
        if (!merged.selectedStrength?.length && !merged.selectedFlexibility?.length) {
          missingFields.push(field)
        } else {
          presentCount++
        }
      } else {
        missingFields.push(field)
      }
    } else {
      presentCount++
    }
  }
  
  // Check for defaulted fields
  if (!merged.trainingDaysPerWeek && merged.scheduleMode === 'flexible') {
    defaultedFields.push('trainingDaysPerWeek (will be derived)')
  }
  
  // Build evidence
  if (isServerSide) {
    evidence.push(`Server-side ingestion - using caller profile as authoritative source`)
  } else {
    evidence.push(`Profile fetched from canonical_profile_service (client-side localStorage)`)
  }
  if (callerOverriddenFields.length > 0) {
    evidence.push(`Caller overrides applied: ${callerOverriddenFields.join(', ')}`)
  }
  if (missingFields.length > 0) {
    evidence.push(`Missing critical fields: ${missingFields.join(', ')}`)
  }
  
  const quality = computeQuality(presentCount, criticalFields.length)
  
  return {
    source: 'canonical_profile_service',
    quality,
    canonicalProfile: merged,
    fieldSources,
    missingFields,
    defaultedFields,
    callerOverriddenFields,
    evidence,
  }
}

// ==========================================================================
// HELPER: Build Recovery Truth Block
// ==========================================================================

/**
 * Build recovery truth from caller-provided training feedback.
 * Note: getReadinessAssessment is client-side only (uses localStorage),
 * so server-side ingestion must work with what's passed in or mark unavailable.
 */
function buildRecoveryTruthBlock(
  trainingFeedback?: IngestionInput['trainingFeedback']
): RecoveryTruthBlock {
  const evidence: string[] = []
  const rawAssessment: ReadinessAssessment | null = null
  
  // Server-side: we cannot call getReadinessAssessment (client-only)
  // Instead, derive what we can from training feedback
  evidence.push('Server-side ingestion - readiness derived from training feedback only')
  
  // Determine quality based on available signals
  let usableSignals = 0
  const totalSignals = 4 // readiness, fatigue, soreness, recovery risk
  
  if (trainingFeedback?.averageRecentRPE !== null && trainingFeedback?.averageRecentRPE !== undefined) {
    usableSignals++
    evidence.push(`Recent RPE signal available: ${trainingFeedback.averageRecentRPE.toFixed(1)}`)
  }
  if (trainingFeedback?.recentCompletionRate !== null && trainingFeedback?.recentCompletionRate !== undefined) {
    usableSignals++
    evidence.push(`Completion rate available: ${(trainingFeedback.recentCompletionRate * 100).toFixed(0)}%`)
  }
  if (trainingFeedback?.totalSessionsLast7Days !== undefined) {
    usableSignals++
  }
  
  const quality = computeQuality(usableSignals, totalSignals)
  
  // Derive recovery/soreness risk from available feedback
  let recoveryRisk: 'low' | 'moderate' | 'high' | 'unknown' = 'unknown'
  let sorenessRisk: 'low' | 'moderate' | 'high' | 'unknown' = 'unknown'
  let readinessState: string | null = null
  let fatigueState: string | null = null
  
  if (trainingFeedback?.averageRecentRPE !== null && trainingFeedback?.averageRecentRPE !== undefined) {
    // Derive readiness from RPE
    if (trainingFeedback.averageRecentRPE > 8.5) {
      recoveryRisk = 'high'
      readinessState = 'recovery_focused'
      sorenessRisk = 'high'
      evidence.push('High average RPE indicates elevated recovery risk')
    } else if (trainingFeedback.averageRecentRPE > 7) {
      recoveryRisk = 'moderate'
      readinessState = 'keep_controlled'
      sorenessRisk = 'moderate'
    } else if (trainingFeedback.averageRecentRPE > 5) {
      recoveryRisk = 'low'
      readinessState = 'train_normally'
      sorenessRisk = 'low'
    } else {
      recoveryRisk = 'low'
      readinessState = 'ready_to_push'
      sorenessRisk = 'low'
    }
    
    // Adjust for completion rate
    if (trainingFeedback?.recentCompletionRate !== null && trainingFeedback?.recentCompletionRate !== undefined) {
      if (trainingFeedback.recentCompletionRate < 0.7 && recoveryRisk === 'low') {
        recoveryRisk = 'moderate'
        evidence.push('Low completion rate elevates recovery concern')
      }
    }
  }
  
  // Derive fatigue state
  if (trainingFeedback?.totalSessionsLast7Days !== undefined && trainingFeedback.totalSessionsLast7Days >= 5) {
    fatigueState = 'accumulated'
    evidence.push('High training frequency this week')
  } else if (trainingFeedback?.totalSessionsLast7Days !== undefined && trainingFeedback.totalSessionsLast7Days <= 2) {
    fatigueState = 'recovered'
    evidence.push('Lower training frequency suggests recovery')
  }
  
  if (usableSignals === 0) {
    evidence.push('No recovery signals available - using unknown/conservative defaults')
  }
  
  return {
    quality,
    readinessState,
    fatigueState,
    recoveryRisk,
    sorenessRisk,
    rawAssessment,
    evidence,
  }
}

// ==========================================================================
// HELPER: Build Adherence Truth Block
// ==========================================================================

/**
 * Build adherence truth from caller-provided training feedback.
 * Note: getConsistencyStatus is client-side only (uses localStorage),
 * so server-side ingestion must work with what's passed in or mark unavailable.
 */
function buildAdherenceTruthBlock(
  trainingFeedback?: IngestionInput['trainingFeedback']
): AdherenceTruthBlock {
  const evidence: string[] = []
  const rawConsistencyStatus: ConsistencyStatus | null = null
  
  // Server-side: we cannot call getConsistencyStatus (client-only)
  evidence.push('Server-side ingestion - consistency derived from training feedback only')
  
  // Calculate adherence metrics
  const totalSessionsLast7Days = trainingFeedback?.totalSessionsLast7Days ?? 0
  const totalSessionsLast14Days = trainingFeedback?.totalSessionsLast14Days ?? 0
  const expectedSessionsPerWeek = trainingFeedback?.expectedSessionsPerWeek ?? 4
  
  const recentMissedSessions = Math.max(0, expectedSessionsPerWeek - totalSessionsLast7Days)
  const recentCompletedSessions = totalSessionsLast7Days
  const recentPartialSessions = 0 // Not tracked yet - will be wired when partial session tracking is added
  
  // Determine consistency status from available data
  let consistencyStatus: 'stable' | 'mixed' | 'disrupted' | 'unknown' = 'unknown'
  
  // Server-side: derive from training feedback since rawConsistencyStatus is unavailable
  if (totalSessionsLast7Days > 0) {
    // Infer from session data
    const completionRate = totalSessionsLast7Days / expectedSessionsPerWeek
    if (completionRate >= 0.8) {
      consistencyStatus = 'stable'
    } else if (completionRate >= 0.5) {
      consistencyStatus = 'mixed'
    } else {
      consistencyStatus = 'disrupted'
    }
    evidence.push(`Consistency inferred from completion rate: ${(completionRate * 100).toFixed(0)}%`)
  }
  
  // Determine quality
  let usableSignals = 0
  const totalSignals = 4
  
  if (trainingFeedback?.totalSessionsLast7Days !== undefined) usableSignals++
  if (trainingFeedback?.totalSessionsLast14Days !== undefined) usableSignals++
  if (rawConsistencyStatus) usableSignals++
  if (trainingFeedback?.recentCompletionRate !== undefined) usableSignals++
  
  const quality = computeQuality(usableSignals, totalSignals)
  
  if (usableSignals === 0) {
    evidence.push('No adherence signals available - using unknown status')
  } else {
    evidence.push(`${usableSignals}/${totalSignals} adherence signals available`)
  }
  
  return {
    quality,
    recentMissedSessions,
    recentPartialSessions,
    recentCompletedSessions,
    consistencyStatus,
    totalSessionsLast7Days,
    totalSessionsLast14Days,
    expectedSessionsPerWeek,
    disruptionReason: null, // Future: will be populated from skip-day UI
    recoveryInterruptionFlag: false, // Future: will be set from recovery disruption
    adherenceDisruptionFlag: recentMissedSessions >= 2, // Flag if 2+ missed sessions
    rawConsistencyStatus,
    evidence,
  }
}

// ==========================================================================
// HELPER: Build Execution Truth Block
// ==========================================================================

function buildExecutionTruthBlock(
  trainingFeedback?: IngestionInput['trainingFeedback']
): ExecutionTruthBlock {
  const evidence: string[] = []
  
  const recentSessionCount = trainingFeedback?.totalSessionsLast7Days ?? 0
  const averageRecentRPE = trainingFeedback?.averageRecentRPE ?? null
  const recentCompletionRate = trainingFeedback?.recentCompletionRate ?? null
  const trustedWorkoutCount = trainingFeedback?.trustedWorkoutCount ?? 0
  
  // Count usable performance signals
  let usablePerformanceSignals = 0
  if (recentSessionCount > 0) usablePerformanceSignals++
  if (averageRecentRPE !== null) usablePerformanceSignals++
  if (recentCompletionRate !== null) usablePerformanceSignals++
  if (trustedWorkoutCount > 0) usablePerformanceSignals++
  
  const quality = computeQuality(usablePerformanceSignals, 4)
  
  // Build load tolerance summary
  let recentLoadToleranceSummary: string | null = null
  if (averageRecentRPE !== null && recentCompletionRate !== null) {
    if (averageRecentRPE > 8.5 && recentCompletionRate < 0.7) {
      recentLoadToleranceSummary = 'High fatigue with reduced completion - consider load reduction'
    } else if (averageRecentRPE < 6 && recentCompletionRate > 0.9) {
      recentLoadToleranceSummary = 'Low fatigue with high completion - may tolerate increased load'
    } else {
      recentLoadToleranceSummary = 'Load tolerance appears appropriate'
    }
    evidence.push(recentLoadToleranceSummary)
  }
  
  if (usablePerformanceSignals === 0) {
    evidence.push('No execution signals available - first-week generation assumed')
  } else {
    evidence.push(`${usablePerformanceSignals}/4 execution signals available`)
    evidence.push(`Recent session count: ${recentSessionCount}`)
    if (trustedWorkoutCount > 0) {
      evidence.push(`Trusted workout count: ${trustedWorkoutCount}`)
    }
  }
  
  return {
    quality,
    recentSessionCount,
    usablePerformanceSignals,
    averageRecentRPE,
    recentCompletionRate,
    recentLoadToleranceSummary,
    evidence,
  }
}

// ==========================================================================
// HELPER: Build Doctrine Truth Block
// ==========================================================================

async function buildDoctrineTruthBlock(): Promise<DoctrineTruthBlock> {
  const evidence: string[] = []
  let rawReadiness: DoctrineRuntimeReadiness | null = null
  
  try {
    rawReadiness = await checkDoctrineRuntimeReadiness()
    evidence.push(`Doctrine DB readiness: ${rawReadiness.readinessVerdict}`)
  } catch {
    evidence.push('Doctrine DB readiness check failed - continuing without doctrine influence')
  }
  
  // Determine quality
  let quality: SignalQuality = 'missing'
  let influenceEligible = false
  let coverageSummary: string[] = []
  
  if (rawReadiness) {
    if (rawReadiness.readinessVerdict === 'FULL') {
      quality = 'strong'
      influenceEligible = true
      coverageSummary.push(`${rawReadiness.counts.totalRules} rules from ${rawReadiness.counts.activeSources} sources`)
    } else if (rawReadiness.readinessVerdict === 'READY') {
      quality = 'usable'
      influenceEligible = true
      coverageSummary.push(`${rawReadiness.counts.totalRules} rules - minimum thresholds met`)
    } else if (rawReadiness.readinessVerdict === 'PARTIAL') {
      quality = 'partial'
      influenceEligible = false
      coverageSummary.push(`${rawReadiness.counts.totalRules} rules - below minimum thresholds`)
      if (rawReadiness.missingComponents.length > 0) {
        coverageSummary.push(`Missing: ${rawReadiness.missingComponents.slice(0, 3).join(', ')}`)
      }
    } else {
      quality = 'missing'
      influenceEligible = false
      coverageSummary.push('Doctrine DB not ready')
    }
    
    // Add specific coverage evidence
    if (rawReadiness.hasPrinciples) {
      evidence.push(`${rawReadiness.counts.principles} principles available`)
    }
    if (rawReadiness.hasProgressionRules) {
      evidence.push(`${rawReadiness.counts.progressionRules} progression rules available`)
    }
  }
  
  return {
    quality,
    readinessVerdict: rawReadiness?.readinessVerdict || 'NOT_READY',
    readinessExplanation: rawReadiness?.readinessExplanation || 'Doctrine DB unavailable',
    coverageSummary,
    influenceEligible,
    rawReadiness,
    evidence,
  }
}

// ==========================================================================
// HELPER: Build Current Program Context Block
// ==========================================================================

function buildCurrentProgramContextBlock(
  input: IngestionInput
): CurrentProgramContextBlock {
  const evidence: string[] = []
  
  const existingProgramId = input.existingProgramId || null
  const activeProgramExists = !!existingProgramId
  const currentWeekIndex = null // Would be populated from program state
  const recentGenerationIntent = input.generationIntent
  
  // Determine if this is first generated week
  const isFirstGeneratedWeek = 
    input.isFreshBaselineBuild || 
    input.generationIntent === 'onboarding_first_build' ||
    !activeProgramExists
  
  const previousWeekCompleted = false // Would be populated from program state
  
  // Determine quality
  let usableSignals = 0
  if (input.generationIntent) usableSignals++
  if (input.isFreshBaselineBuild !== undefined) usableSignals++
  if (existingProgramId) usableSignals++
  
  const quality = computeQuality(usableSignals, 3)
  
  // Build evidence
  evidence.push(`Generation intent: ${recentGenerationIntent}`)
  if (activeProgramExists) {
    evidence.push(`Existing program: ${existingProgramId?.slice(0, 12)}...`)
  } else {
    evidence.push('No existing program - first generation')
  }
  if (isFirstGeneratedWeek) {
    evidence.push('First week of new program build')
  }
  
  return {
    quality,
    existingProgramId,
    currentWeekIndex,
    activeProgramExists,
    recentGenerationIntent,
    isFirstGeneratedWeek,
    previousWeekCompleted,
    evidence,
  }
}

// ==========================================================================
// HELPER: Build Signal Audit Summary
// ==========================================================================

function buildSignalAuditSummary(
  profileTruth: ProfileTruthBlock,
  recoveryTruth: RecoveryTruthBlock,
  adherenceTruth: AdherenceTruthBlock,
  executionTruth: ExecutionTruthBlock,
  doctrineTruth: DoctrineTruthBlock,
  programContext: CurrentProgramContextBlock
): SignalAuditSummary {
  const domainQualities = {
    profile: profileTruth.quality,
    recovery: recoveryTruth.quality,
    adherence: adherenceTruth.quality,
    execution: executionTruth.quality,
    doctrine: doctrineTruth.quality,
    programContext: programContext.quality,
  }
  
  const qualities = Object.values(domainQualities)
  const totalSignalDomains = 6
  
  const strongDomains = qualities.filter(q => q === 'strong').length
  const usableDomains = qualities.filter(q => q === 'usable').length
  const partialDomains = qualities.filter(q => q === 'partial').length
  const weakDomains = qualities.filter(q => q === 'weak').length
  const missingDomains = qualities.filter(q => q === 'missing').length
  
  // Compute overall quality
  let overallQuality: SignalQuality
  if (strongDomains >= 4) {
    overallQuality = 'strong'
  } else if (strongDomains + usableDomains >= 4) {
    overallQuality = 'usable'
  } else if (strongDomains + usableDomains + partialDomains >= 4) {
    overallQuality = 'partial'
  } else if (missingDomains >= 4) {
    overallQuality = 'missing'
  } else {
    overallQuality = 'weak'
  }
  
  return {
    totalSignalDomains,
    strongDomains,
    usableDomains,
    partialDomains,
    weakDomains,
    missingDomains,
    overallQuality,
    domainQualities,
  }
}

// ==========================================================================
// HELPER: Build Generation Source Map
// ==========================================================================

function buildGenerationSourceMap(
  neonPackage: NeonTruthPackage | null,
  profileTruth: ProfileTruthBlock,
  recoveryTruth: RecoveryTruthBlock,
  adherenceTruth: AdherenceTruthBlock,
  executionTruth: ExecutionTruthBlock,
  doctrineTruth: DoctrineTruthBlock,
  programContext: CurrentProgramContextBlock
): GenerationSourceMap {
  const materialSignals: MaterialSignalRecord[] = []
  const dbSignalsRead: string[] = []
  const callerOverrideSignals: string[] = []
  const defaultedSignals: string[] = []
  const missingSignals: string[] = []
  const influenceSummary: string[] = []
  
  // Track profile signals
  const profileFieldSources = profileTruth.fieldSources
  for (const [key, source] of Object.entries(profileFieldSources)) {
    if (source === 'authoritative_db') {
      dbSignalsRead.push(key)
    } else if (source === 'caller_override') {
      callerOverrideSignals.push(key)
    } else if (source === 'defaulted') {
      defaultedSignals.push(key)
    } else if (source === 'none') {
      missingSignals.push(key)
    }
    
    materialSignals.push({
      key,
      source: source as FieldSource,
      quality: source === 'none' || source === 'defaulted' ? 'weak' : 'usable',
      usedInGeneration: source !== 'none',
      usedByWeekAdaptation: ['primaryGoal', 'selectedSkills', 'experienceLevel', 'jointCautions'].includes(key),
      valueSummary: source === 'none' ? 'unavailable' : 'present',
      reason: source === 'authoritative_db' ? 'Read from Neon' : source === 'caller_override' ? 'Provided by caller' : source,
    })
  }
  
  // Track Neon-specific signals
  if (neonPackage?.dbAvailable) {
    if (neonPackage.adherenceExecution.source === 'authoritative_db' && neonPackage.adherenceExecution.data) {
      dbSignalsRead.push('completedSessionsLast7Days', 'skippedSessionsLast7Days', 'averageRPELast7Days')
      influenceSummary.push(`Adherence: ${neonPackage.adherenceExecution.data.completedSessionsLast7Days} completed, ${neonPackage.adherenceExecution.data.skippedSessionsLast7Days} skipped (7d)`)
    }
    if (neonPackage.workoutHistory.source === 'authoritative_db' && neonPackage.workoutHistory.data) {
      dbSignalsRead.push('totalWorkoutsLogged', 'recentWorkoutsLast7Days')
      influenceSummary.push(`History: ${neonPackage.workoutHistory.data.totalWorkoutsLogged} total workouts`)
    }
    if (neonPackage.skillReadiness.source === 'authoritative_db' && neonPackage.skillReadiness.data) {
      dbSignalsRead.push('skillReadiness')
      influenceSummary.push(`Readiness: ${neonPackage.skillReadiness.data.skills.length} skills tracked`)
    }
    if (neonPackage.performanceEnvelopes.source === 'authoritative_db' && neonPackage.performanceEnvelopes.data?.hasUsableEnvelopes) {
      dbSignalsRead.push('performanceEnvelopes')
      influenceSummary.push(`Envelopes: ${neonPackage.performanceEnvelopes.data.totalEnvelopes} usable`)
    }
    if (neonPackage.constraintHistory.source === 'authoritative_db' && neonPackage.constraintHistory.data?.hasConstraints) {
      dbSignalsRead.push('constraintHistory')
      influenceSummary.push(`Constraints: ${neonPackage.constraintHistory.data.totalConstraintsRecorded} recorded`)
    }
  }
  
  // Build influence summary
  if (doctrineTruth.influenceEligible) {
    influenceSummary.push('Doctrine rules eligible for influence')
  } else {
    influenceSummary.push('Doctrine not available')
  }
  
  if (programContext.isFirstGeneratedWeek) {
    influenceSummary.push('First week - acclimation protection active')
  }
  
  return {
    overallQuality: neonPackage?.overallQuality || 'unavailable',
    profileQuality: profileTruth.quality,
    recoveryQuality: recoveryTruth.quality,
    adherenceQuality: adherenceTruth.quality,
    executionQuality: executionTruth.quality,
    doctrineQuality: doctrineTruth.quality,
    programContextQuality: programContext.quality,
    materialSignals,
    dbSignalsRead,
    callerOverrideSignals,
    defaultedSignals,
    missingSignals,
    influenceSummary,
    doctrineEligibility: doctrineTruth.influenceEligible,
    neonDbAvailable: neonPackage?.dbAvailable ?? false,
    neonAvailableDomains: neonPackage?.availableDomains ?? [],
    neonUnavailableDomains: neonPackage?.unavailableDomains ?? [],
    generatedAt: new Date().toISOString(),
  }
}

// ==========================================================================
// HELPER: Enhance Truth Blocks with Neon Data
// ==========================================================================

function enhanceRecoveryTruthWithNeon(
  baseTruth: RecoveryTruthBlock,
  neonPackage: NeonTruthPackage | null
): RecoveryTruthBlock {
  if (!neonPackage?.adherenceExecution.data) {
    return baseTruth
  }
  
  const neonData = neonPackage.adherenceExecution.data
  const evidence = [...baseTruth.evidence]
  evidence.push('[NEON] Recovery derived from DB adherence/execution signals')
  
  // Enhance with real DB data
  let recoveryRisk = baseTruth.recoveryRisk
  let readinessState = baseTruth.readinessState
  
  if (neonData.sessionsWithHighFatigue > 3) {
    recoveryRisk = 'high'
    readinessState = 'recovery_focused'
    evidence.push(`[NEON] ${neonData.sessionsWithHighFatigue} high-fatigue sessions detected`)
  } else if (neonData.averageRPELast7Days && neonData.averageRPELast7Days > 8) {
    recoveryRisk = 'high'
    evidence.push(`[NEON] Avg RPE ${neonData.averageRPELast7Days.toFixed(1)} indicates high load`)
  } else if (neonData.completionRateLast7Days && neonData.completionRateLast7Days < 0.5) {
    recoveryRisk = 'moderate'
    evidence.push(`[NEON] Low completion rate may indicate recovery issues`)
  }
  
  // Improve quality if we have real data
  const quality = neonData.totalSessionsLast7Days > 0 ? 'usable' : baseTruth.quality
  
  return {
    ...baseTruth,
    quality,
    recoveryRisk,
    readinessState,
    evidence,
  }
}

function enhanceAdherenceTruthWithNeon(
  baseTruth: AdherenceTruthBlock,
  neonPackage: NeonTruthPackage | null
): AdherenceTruthBlock {
  if (!neonPackage?.adherenceExecution.data) {
    return baseTruth
  }
  
  const neonData = neonPackage.adherenceExecution.data
  const evidence = [...baseTruth.evidence]
  evidence.push('[NEON] Adherence signals loaded from training_response_signals table')
  
  // Replace with real DB data
  let consistencyStatus = baseTruth.consistencyStatus
  if (neonData.completionRateLast7Days !== null) {
    if (neonData.completionRateLast7Days >= 0.8) {
      consistencyStatus = 'stable'
    } else if (neonData.completionRateLast7Days >= 0.5) {
      consistencyStatus = 'mixed'
    } else {
      consistencyStatus = 'disrupted'
    }
    evidence.push(`[NEON] Completion rate: ${(neonData.completionRateLast7Days * 100).toFixed(0)}%`)
  }
  
  return {
    ...baseTruth,
    quality: neonData.totalSessionsLast7Days > 0 ? 'usable' : baseTruth.quality,
    recentCompletedSessions: neonData.completedSessionsLast7Days,
    recentMissedSessions: neonData.skippedSessionsLast7Days,
    recentPartialSessions: neonData.partialSessionsLast7Days,
    totalSessionsLast7Days: neonData.totalSessionsLast7Days,
    totalSessionsLast14Days: neonData.totalSessionsLast14Days,
    consistencyStatus,
    adherenceDisruptionFlag: neonData.skippedSessionsLast7Days >= 2,
    evidence,
  }
}

function enhanceExecutionTruthWithNeon(
  baseTruth: ExecutionTruthBlock,
  neonPackage: NeonTruthPackage | null
): ExecutionTruthBlock {
  const workoutData = neonPackage?.workoutHistory.data
  const adherenceData = neonPackage?.adherenceExecution.data
  
  if (!workoutData && !adherenceData) {
    return baseTruth
  }
  
  const evidence = [...baseTruth.evidence]
  evidence.push('[NEON] Execution signals loaded from workout_logs and training_response_signals')
  
  const recentSessionCount = workoutData?.recentWorkoutsLast7Days ?? adherenceData?.totalSessionsLast7Days ?? baseTruth.recentSessionCount
  const averageRecentRPE = adherenceData?.averageRPELast7Days ?? baseTruth.averageRecentRPE
  const recentCompletionRate = adherenceData?.completionRateLast7Days ?? baseTruth.recentCompletionRate
  
  let usablePerformanceSignals = 0
  if (recentSessionCount > 0) usablePerformanceSignals++
  if (averageRecentRPE !== null) usablePerformanceSignals++
  if (recentCompletionRate !== null) usablePerformanceSignals++
  if (workoutData?.totalWorkoutsLogged && workoutData.totalWorkoutsLogged > 0) usablePerformanceSignals++
  
  if (workoutData) {
    evidence.push(`[NEON] ${workoutData.totalWorkoutsLogged} total workouts, ${workoutData.recentWorkoutsLast7Days} in last 7 days`)
  }
  
  return {
    ...baseTruth,
    quality: computeQuality(usablePerformanceSignals, 4),
    recentSessionCount,
    usablePerformanceSignals,
    averageRecentRPE,
    recentCompletionRate,
    evidence,
  }
}

function enhanceProgramContextWithNeon(
  baseTruth: CurrentProgramContextBlock,
  neonPackage: NeonTruthPackage | null
): CurrentProgramContextBlock {
  if (!neonPackage?.programContext.data) {
    return baseTruth
  }
  
  const neonData = neonPackage.programContext.data
  const evidence = [...baseTruth.evidence]
  evidence.push('[NEON] Program context loaded from programs table')
  evidence.push(`[NEON] ${neonData.totalProgramsCreated} total programs created`)
  
  return {
    ...baseTruth,
    quality: 'strong',
    existingProgramId: baseTruth.existingProgramId || neonData.activeProgramId,
    activeProgramExists: neonData.hasActiveProgram || baseTruth.activeProgramExists,
    evidence,
  }
}

// ==========================================================================
// MAIN: Build Authoritative Generation Truth Ingestion
// ==========================================================================

export async function buildAuthoritativeGenerationTruthIngestion(
  input: IngestionInput
): Promise<AuthoritativeGenerationTruthIngestion> {
  const startTime = Date.now()
  
  console.log('[authoritative-truth-ingestion] Starting ingestion build', {
    dbUserId: input.dbUserId?.slice(0, 12) + '...',
    generationIntent: input.generationIntent,
    hasCallerProfile: !!input.callerCanonicalProfile,
    hasCallerInputs: !!input.callerBuilderInputs,
    hasExistingProgram: !!input.existingProgramId,
    hasTrainingFeedback: !!input.trainingFeedback,
  })
  
  // [NEON-TRUTH-CONTRACT] STEP 1: Fetch real truth from Neon FIRST
  let neonTruthPackage: NeonTruthPackage | null = null
  try {
    neonTruthPackage = await fetchNeonTruthPackage(input.dbUserId)
    console.log('[authoritative-truth-ingestion-neon] Neon truth fetched', {
      dbAvailable: neonTruthPackage.dbAvailable,
      overallQuality: neonTruthPackage.overallQuality,
      availableDomains: neonTruthPackage.availableDomains,
      unavailableDomains: neonTruthPackage.unavailableDomains,
    })
  } catch (error) {
    console.log('[authoritative-truth-ingestion-neon] Neon fetch failed', {
      error: String(error),
    })
  }
  
  // STEP 2: Build base truth blocks from caller-provided data
  // [PROTECTED_FUNNEL_IDENTITY] Pass server-resolved dbUserId for authoritative identity stitch
  const baseProfileTruth = buildProfileTruthBlock(input.callerCanonicalProfile, input.callerBuilderInputs, input.dbUserId)
  const baseRecoveryTruth = buildRecoveryTruthBlock(input.trainingFeedback)
  const baseAdherenceTruth = buildAdherenceTruthBlock(input.trainingFeedback)
  const baseExecutionTruth = buildExecutionTruthBlock(input.trainingFeedback)
  const baseProgramContext = buildCurrentProgramContextBlock(input)
  
  // STEP 3: Enhance truth blocks with Neon data where available
  const recoveryTruth = enhanceRecoveryTruthWithNeon(baseRecoveryTruth, neonTruthPackage)
  const adherenceTruth = enhanceAdherenceTruthWithNeon(baseAdherenceTruth, neonTruthPackage)
  const executionTruth = enhanceExecutionTruthWithNeon(baseExecutionTruth, neonTruthPackage)
  const currentProgramContext = enhanceProgramContextWithNeon(baseProgramContext, neonTruthPackage)
  
  // STEP 4: Enhance profile truth with Neon data if DB profile is stronger
  let profileTruth = baseProfileTruth
  if (neonTruthPackage?.profile.source === 'authoritative_db' && neonTruthPackage.profile.data) {
    const neonProfile = neonTruthPackage.profile.data
    const evidence = [...baseProfileTruth.evidence, '[NEON] Profile data loaded from athlete_profiles table']
    
    // Update field sources to reflect DB origin
    const fieldSources = { ...baseProfileTruth.fieldSources }
    if (neonProfile.primaryGoal) fieldSources.primaryGoal = 'authoritative_db'
    if (neonProfile.selectedSkills.length > 0) fieldSources.selectedSkills = 'authoritative_db'
    if (neonProfile.scheduleMode) fieldSources.scheduleMode = 'authoritative_db'
    if (neonProfile.trainingDaysPerWeek) fieldSources.trainingDaysPerWeek = 'authoritative_db'
    if (neonProfile.experienceLevel) fieldSources.experienceLevel = 'authoritative_db'
    if (neonProfile.equipment.length > 0) fieldSources.equipment = 'authoritative_db'
    if (neonProfile.sessionLengthMinutes) fieldSources.sessionLengthMinutes = 'authoritative_db'
    if (neonProfile.jointCautions.length > 0) fieldSources.jointCautions = 'authoritative_db'
    if (neonProfile.trainingStyle) fieldSources.trainingPathType = 'authoritative_db'
    
    profileTruth = {
      ...baseProfileTruth,
      quality: neonTruthPackage.profile.quality === 'strong' ? 'strong' : baseProfileTruth.quality,
      fieldSources,
      evidence,
    }
  }
  
  // STEP 5: Build async doctrine truth block
  const doctrineTruth = await buildDoctrineTruthBlock()
  
  // STEP 6: Build audit summary
  const signalAudit = buildSignalAuditSummary(
    profileTruth,
    recoveryTruth,
    adherenceTruth,
    executionTruth,
    doctrineTruth,
    currentProgramContext
  )
  
  // STEP 7: Build generation source map
  const sourceMap = buildGenerationSourceMap(
    neonTruthPackage,
    profileTruth,
    recoveryTruth,
    adherenceTruth,
    executionTruth,
    doctrineTruth,
    currentProgramContext
  )
  
  // STEP 8: Build safe generation notes
  const safeGenerationNotes: string[] = []
  
  if (neonTruthPackage?.dbAvailable) {
    safeGenerationNotes.push(`Neon truth: ${neonTruthPackage.availableDomains.length}/7 domains loaded`)
  } else {
    safeGenerationNotes.push('Neon DB unavailable - using caller-provided truth only')
  }
  
  if (signalAudit.overallQuality === 'weak' || signalAudit.overallQuality === 'missing') {
    safeGenerationNotes.push('Low signal quality - generation will use conservative defaults')
  }
  if (profileTruth.callerOverriddenFields.length > 0) {
    safeGenerationNotes.push(`${profileTruth.callerOverriddenFields.length} profile fields were caller-overridden`)
  }
  if (recoveryTruth.recoveryRisk === 'high') {
    safeGenerationNotes.push('High recovery risk detected - week adaptation should reduce load')
  }
  if (adherenceTruth.consistencyStatus === 'disrupted') {
    safeGenerationNotes.push('Disrupted adherence pattern - conservative frequency recommended')
  }
  if (!doctrineTruth.influenceEligible) {
    safeGenerationNotes.push('Doctrine influence not available for this generation')
  }
  if (currentProgramContext.isFirstGeneratedWeek) {
    safeGenerationNotes.push('First week generation - acclimation protection should apply')
  }
  
  const elapsedMs = Date.now() - startTime
  
  console.log('[authoritative-truth-ingestion] Ingestion complete', {
    elapsedMs,
    neonDbAvailable: neonTruthPackage?.dbAvailable,
    neonOverallQuality: neonTruthPackage?.overallQuality,
    overallQuality: signalAudit.overallQuality,
    domainQualities: signalAudit.domainQualities,
    strongDomains: signalAudit.strongDomains,
    missingDomains: signalAudit.missingDomains,
    dbSignalsRead: sourceMap.dbSignalsRead.length,
    callerOverrideSignals: sourceMap.callerOverrideSignals.length,
    safeGenerationNotes: safeGenerationNotes.slice(0, 3),
  })
  
  return {
    ingestedAt: new Date().toISOString(),
    ingestionVersion: '1.1.0',
    profileTruth,
    recoveryTruth,
    adherenceTruth,
    executionTruth,
    doctrineTruth,
    currentProgramContext,
    signalAudit,
    sourceMap,
    neonTruthPackage,
    safeGenerationNotes,
  }
}

// ==========================================================================
// EXPORTS: Utility Functions
// ==========================================================================

export function getIngestionSummary(ingestion: AuthoritativeGenerationTruthIngestion): string {
  const { signalAudit, safeGenerationNotes } = ingestion
  return `Truth Ingestion: ${signalAudit.overallQuality} quality (${signalAudit.strongDomains}/${signalAudit.totalSignalDomains} strong domains)` +
    (safeGenerationNotes.length > 0 ? ` | Notes: ${safeGenerationNotes[0]}` : '')
}

export function getIngestionAuditLog(ingestion: AuthoritativeGenerationTruthIngestion): Record<string, unknown> {
  return {
    ingestedAt: ingestion.ingestedAt,
    version: ingestion.ingestionVersion,
    overallQuality: ingestion.signalAudit.overallQuality,
    domainQualities: ingestion.signalAudit.domainQualities,
    profileFieldSources: ingestion.profileTruth.fieldSources,
    callerOverrides: ingestion.profileTruth.callerOverriddenFields,
    recoveryRisk: ingestion.recoveryTruth.recoveryRisk,
    consistencyStatus: ingestion.adherenceTruth.consistencyStatus,
    doctrineInfluenceEligible: ingestion.doctrineTruth.influenceEligible,
    isFirstWeek: ingestion.currentProgramContext.isFirstGeneratedWeek,
    safeGenerationNotes: ingestion.safeGenerationNotes,
    // [NEON-TRUTH-CONTRACT] Source map audit
    neonDbAvailable: ingestion.sourceMap.neonDbAvailable,
    neonAvailableDomains: ingestion.sourceMap.neonAvailableDomains,
    dbSignalsRead: ingestion.sourceMap.dbSignalsRead,
    callerOverrideSignals: ingestion.sourceMap.callerOverrideSignals,
    defaultedSignals: ingestion.sourceMap.defaultedSignals,
    missingSignals: ingestion.sourceMap.missingSignals,
    influenceSummary: ingestion.sourceMap.influenceSummary,
  }
}

/**
 * Get a compact source summary for UI display
 */
export function getSourceSummaryForDisplay(ingestion: AuthoritativeGenerationTruthIngestion): {
  label: string
  quality: SignalQuality
  breakdown: string
  availableCount: number
  totalCount: number
  influenceSummary: string[]
} {
  const sourceMap = ingestion.sourceMap
  const neonSummary = ingestion.neonTruthPackage ? getNeonTruthSummary(ingestion.neonTruthPackage) : null
  
  const qualityLabels: Record<SignalQuality, string> = {
    strong: 'Comprehensive Data',
    usable: 'Good Data Coverage',
    partial: 'Partial Data',
    weak: 'Limited Data',
    missing: 'Minimal Data',
  }
  
  return {
    label: qualityLabels[sourceMap.overallQuality] || 'Unknown',
    quality: sourceMap.overallQuality,
    breakdown: neonSummary?.breakdown || `${sourceMap.dbSignalsRead.length} DB signals`,
    availableCount: sourceMap.neonAvailableDomains.length,
    totalCount: 7,
    influenceSummary: sourceMap.influenceSummary.slice(0, 4),
  }
}
